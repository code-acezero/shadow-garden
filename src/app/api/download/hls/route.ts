import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const runtime = 'nodejs';
export const maxDuration = 300; // Vercel Hobby plan max; upgrade to Pro for 800+

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function fetchUpstream(url: string, referer: string, range?: string) {
  let origin: string | undefined;
  try {
    origin = new URL(referer).origin;
  } catch {
    origin = undefined;
  }

  const headers: Record<string, string> = {
    Referer: referer,
    'User-Agent': UA,
    Accept: '*/*',
  };
  if (origin) headers.Origin = origin;
  if (range) headers.Range = range;
  return fetch(url, { headers, redirect: 'follow' });
}

interface Segment {
  url: string;
  byteRange?: { length: number; offset: number };
  keyUri?: string;
  ivHex?: string;
  seq: number;
}

interface ParsedPlaylist {
  segments: Segment[];
  mapUri?: string; // EXT-X-MAP (fMP4 init segment)
  isFmp4: boolean;
}

async function resolveVariant(playlistUrl: string, referer: string, wantRes?: string): Promise<string> {
  const res = await fetchUpstream(playlistUrl, referer);
  if (!res.ok) throw new Error(`Failed to fetch playlist: ${res.status}`);
  const text = await res.text();

  if (!text.includes('#EXT-X-STREAM-INF')) return playlistUrl; // already a media playlist

  const lines = text.split('\n');
  const variants: { bandwidth: number; height: number; uri: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXT-X-STREAM-INF')) {
      const bwMatch = line.match(/BANDWIDTH=(\d+)/);
      const resMatch = line.match(/RESOLUTION=\d+x(\d+)/);
      const uriLine = (lines[i + 1] || '').trim();
      if (uriLine && !uriLine.startsWith('#')) {
        variants.push({
          bandwidth: bwMatch ? parseInt(bwMatch[1]) : 0,
          height: resMatch ? parseInt(resMatch[1]) : 0,
          uri: new URL(uriLine, playlistUrl).href,
        });
      }
    }
  }
  if (variants.length === 0) throw new Error('No variants found in master playlist');

  variants.sort((a, b) => b.bandwidth - a.bandwidth);
  if (wantRes) {
    const target = parseInt(wantRes);
    const match = variants.find(v => v.height === target);
    if (match) return match.uri;
  }
  return variants[0].uri; // highest quality by default
}

async function parseMediaPlaylist(playlistUrl: string, referer: string): Promise<ParsedPlaylist> {
  const res = await fetchUpstream(playlistUrl, referer);
  if (!res.ok) throw new Error(`Failed to fetch media playlist: ${res.status}`);
  const text = await res.text();
  const lines = text.split('\n');

  const segments: Segment[] = [];
  let currentKeyUri: string | undefined;
  let currentKeyIv: string | undefined;
  let mapUri: string | undefined;
  let seq = 0;
  let byteRangeOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXT-X-KEY')) {
      if (line.includes('METHOD=NONE')) {
        currentKeyUri = undefined;
        currentKeyIv = undefined;
      } else {
        const uriM = line.match(/URI="([^"]+)"/);
        const ivM = line.match(/IV=0x([0-9A-Fa-f]+)/);
        currentKeyUri = uriM ? new URL(uriM[1], playlistUrl).href : undefined;
        currentKeyIv = ivM ? ivM[1] : undefined;
      }
      continue;
    }
    if (line.startsWith('#EXT-X-MAP')) {
      const uriM = line.match(/URI="([^"]+)"/);
      if (uriM) mapUri = new URL(uriM[1], playlistUrl).href;
      continue;
    }
    if (line.startsWith('#EXT-X-BYTERANGE')) {
      const m = line.match(/#EXT-X-BYTERANGE:(\d+)(?:@(\d+))?/);
      if (m) {
        const length = parseInt(m[1]);
        const offset = m[2] ? parseInt(m[2]) : byteRangeOffset;
        byteRangeOffset = offset + length;
        (segments as any)._pendingRange = { length, offset };
      }
      continue;
    }
    if (line.startsWith('#')) continue;

    // Segment URI line
    const pendingRange = (segments as any)._pendingRange;
    if (pendingRange) delete (segments as any)._pendingRange;

    segments.push({
      url: new URL(line, playlistUrl).href,
      byteRange: pendingRange,
      keyUri: currentKeyUri,
      ivHex: currentKeyIv,
      seq: seq++,
    });
  }

  return { segments, mapUri, isFmp4: !!mapUri };
}

const keyCache = new Map<string, Buffer>();
async function getKey(keyUri: string, referer: string): Promise<Buffer> {
  const cached = keyCache.get(keyUri);
  if (cached) return cached;
  const res = await fetchUpstream(keyUri, referer);
  if (!res.ok) throw new Error('Failed to fetch decryption key');
  const buf = Buffer.from((await res.arrayBuffer()) as ArrayBuffer);
  keyCache.set(keyUri, buf);
  return buf;
}

function decrypt(data: Buffer, key: Buffer, seq: number, ivHex?: string): Buffer {
  let iv: Buffer;
  if (ivHex) {
    iv = Buffer.from(ivHex.padStart(32, '0'), 'hex');
  } else {
    iv = Buffer.alloc(16);
    iv.writeUInt32BE(seq, 12);
  }
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

async function fetchSegmentBytes(seg: Segment, referer: string, retries = 2): Promise<Buffer> {
  const range = seg.byteRange ? `bytes=${seg.byteRange.offset}-${seg.byteRange.offset + seg.byteRange.length - 1}` : undefined;
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchUpstream(seg.url, referer, range);
      if (!res.ok) throw new Error(`Segment fetch failed: ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      let buf = Buffer.from(arrayBuf as any);
      if (seg.keyUri) {
        const key = await getKey(seg.keyUri, referer);
        buf = decrypt(buf, key, seg.seq, seg.ivHex);
      }
      return buf;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

// Fetch segments with limited concurrency but emit them to the stream strictly in order.
async function* orderedConcurrentFetch(segments: Segment[], referer: string, concurrency = 6) {
  let nextToEmit = 0;
  const results = new Map<number, Buffer>();
  let cursor = 0;
  let inFlightError: Error | null = null;

  const worker = async () => {
    while (cursor < segments.length && !inFlightError) {
      const idx = cursor++;
      try {
        const buf = await fetchSegmentBytes(segments[idx], referer);
        results.set(idx, buf);
      } catch (e: any) {
        inFlightError = e;
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, segments.length) }, worker);
  const pump = Promise.all(workers);

  while (nextToEmit < segments.length) {
    if (inFlightError) throw inFlightError;
    if (results.has(nextToEmit)) {
      yield results.get(nextToEmit)!;
      results.delete(nextToEmit);
      nextToEmit++;
    } else {
      await new Promise(r => setTimeout(r, 20));
    }
  }
  await pump;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const playlistUrl = sp.get('url');
  const referer = sp.get('referer') || 'https://megacloud.blog/';
  const resolution = sp.get('res') || undefined;
  const filename = sp.get('filename') || 'download';
  const format = (sp.get('format') || 'mp4').toLowerCase(); // 'mp4' (default) or 'ts'
  const subUrl = sp.get('sub') || undefined;

  if (!playlistUrl) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(playlistUrl);
    const decodedReferer = decodeURIComponent(referer);
    const decodedSubUrl = subUrl ? decodeURIComponent(subUrl) : undefined;

    const mediaPlaylistUrl = await resolveVariant(decodedUrl, decodedReferer, resolution);
    const { segments, mapUri, isFmp4 } = await parseMediaPlaylist(mediaPlaylistUrl, decodedReferer);

    if (segments.length === 0) {
      return NextResponse.json({ error: 'No segments found in playlist' }, { status: 422 });
    }

    const cleanBaseName = filename.replace(/\.(mp4|ts|mkv)$/i, '').replace(/[^a-z0-9\-_. ()]/gi, '_');

    // ── CASE 1: MP4 REMUXING / SUBTITLE INJECTION VIA FFMPEG ──
    const shouldRemuxToMp4 = format === 'mp4' && (!isFmp4 || Boolean(decodedSubUrl));

    if (shouldRemuxToMp4) {
      let tempVttPath: string | null = null;

      // Optional Subtitle Fetching
      if (decodedSubUrl) {
        try {
          const subRes = await fetchUpstream(decodedSubUrl, decodedReferer);
          if (subRes.ok) {
            const vttText = await subRes.text();
            tempVttPath = path.join(os.tmpdir(), `sub_${crypto.randomUUID()}.vtt`);
            await fs.promises.writeFile(tempVttPath, vttText, 'utf8');
          }
        } catch (subErr) {
          console.warn('[HLS] Failed to fetch subtitle for injection, continuing video-only:', subErr);
        }
      }

      const cleanup = () => {
        if (tempVttPath) {
          fs.promises.unlink(tempVttPath).catch(() => {});
          tempVttPath = null;
        }
      };

      const ffmpegArgs: string[] = [
        '-loglevel', 'error',
        '-i', 'pipe:0',
      ];

      if (tempVttPath) {
        ffmpegArgs.push('-i', tempVttPath);
      }

      ffmpegArgs.push(
        '-map', '0:v:0',
        '-map', '0:a:0?',
      );

      if (tempVttPath) {
        ffmpegArgs.push('-map', '1:0');
      }

      ffmpegArgs.push(
        '-c:v', 'copy',
        '-c:a', 'copy',
        '-bsf:a', 'aac_adtstoasc',
      );

      if (tempVttPath) {
        ffmpegArgs.push(
          '-c:s', 'mov_text',
          '-metadata:s:s:0', 'language=eng',
          '-metadata:s:s:0', 'title=English'
        );
      }

      ffmpegArgs.push(
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        'pipe:1'
      );

      let ffmpegProcess: ReturnType<typeof spawn> | null = null;
      try {
        ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
      } catch (spawnErr) {
        console.warn('[HLS] FFmpeg spawn failed, falling back to direct stream:', spawnErr);
        cleanup();
      }

      if (ffmpegProcess && ffmpegProcess.stdin && ffmpegProcess.stdout) {
        const proc = ffmpegProcess;
        const ffmpegIn = ffmpegProcess.stdin;
        const ffmpegOut = ffmpegProcess.stdout;
        proc.on('close', cleanup);
        proc.stderr?.on('data', (d) => console.warn('[FFmpeg remux]', d.toString()));

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            ffmpegOut.on('data', (chunk: Buffer) => {
              try { controller.enqueue(new Uint8Array(chunk)); } catch {}
            });
            ffmpegOut.on('end', () => {
              try { controller.close(); } catch {}
            });
            proc.on('error', (err) => {
              try { controller.error(err); } catch {}
            });

            try {
              if (mapUri) {
                const res = await fetchUpstream(mapUri, decodedReferer);
                if (res.ok) {
                  const initBuf = Buffer.from(await res.arrayBuffer());
                  ffmpegIn.write(initBuf);
                }
              }

              for await (const chunk of orderedConcurrentFetch(segments, decodedReferer, 6)) {
                if (ffmpegIn.destroyed) break;
                const ok = ffmpegIn.write(chunk);
                if (!ok) {
                  await new Promise((r) => ffmpegIn.once('drain', r));
                }
              }
              ffmpegIn.end();
            } catch (pumpErr) {
              try { proc.kill('SIGTERM'); } catch {}
              try { controller.error(pumpErr); } catch {}
            }
          },
          cancel() {
            try { proc.kill('SIGTERM'); } catch {}
            cleanup();
          }
        });

        return new NextResponse(stream, {
          status: 200,
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="${cleanBaseName}.mp4"`,
            'Cache-Control': 'no-store',
            'X-Segment-Count': String(segments.length),
            'X-Format': 'mp4-remuxed',
          },
        });
      }
    }

    // ── CASE 2: DIRECT PASSTHROUGH STREAM (fMP4 or Raw TS) ──
    const ext = (format === 'mp4' || isFmp4) ? 'mp4' : 'ts';
    const contentType = ext === 'mp4' ? 'video/mp4' : 'video/mp2t';

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          if (mapUri) {
            const res = await fetchUpstream(mapUri, decodedReferer);
            if (res.ok) controller.enqueue(new Uint8Array(await res.arrayBuffer()));
          }
          for await (const chunk of orderedConcurrentFetch(segments, decodedReferer, 6)) {
            controller.enqueue(new Uint8Array(chunk));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${cleanBaseName}.${ext}"`,
        'Cache-Control': 'no-store',
        'X-Segment-Count': String(segments.length),
        'X-Format': 'direct',
      },
    });
  } catch (err: any) {
    console.error('HLS download engine error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process HLS stream' }, { status: 500 });
  }
}
