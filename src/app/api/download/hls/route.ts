import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
// Large HLS downloads can take a while to fully fetch+concat server-side.
// Requires a hosting plan that allows longer function durations (e.g. Vercel Pro).
export const maxDuration = 800;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

function fetchUpstream(url: string, referer: string, range?: string) {
  const headers: Record<string, string> = {
    Referer: referer,
    Origin: new URL(referer).origin,
    'User-Agent': UA,
    Accept: '*/*',
  };
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

async function fetchSegmentBytes(seg: Segment, referer: string): Promise<Buffer> {
  const range = seg.byteRange ? `bytes=${seg.byteRange.offset}-${seg.byteRange.offset + seg.byteRange.length - 1}` : undefined;
  const res = await fetchUpstream(seg.url, referer, range);
  if (!res.ok) throw new Error(`Segment fetch failed: ${res.status}`);
  const arrayBuf = await res.arrayBuffer();
  let buf = Buffer.from(arrayBuf as any);
  if (seg.keyUri) {
    const key = await getKey(seg.keyUri, referer);
    buf = decrypt(buf, key, seg.seq, seg.ivHex);
  }
  return buf;
}

// Fetch segments with limited concurrency but emit them to the stream strictly in order.
async function* orderedConcurrentFetch(segments: Segment[], referer: string, concurrency = 5) {
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
      await new Promise(r => setTimeout(r, 25));
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

  if (!playlistUrl) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(playlistUrl);
    const decodedReferer = decodeURIComponent(referer);

    const mediaPlaylistUrl = await resolveVariant(decodedUrl, decodedReferer, resolution);
    const { segments, mapUri, isFmp4 } = await parseMediaPlaylist(mediaPlaylistUrl, decodedReferer);

    if (segments.length === 0) {
      return NextResponse.json({ error: 'No segments found in playlist' }, { status: 422 });
    }

    const ext = isFmp4 ? 'mp4' : 'ts';
    const contentType = isFmp4 ? 'video/mp4' : 'video/mp2t';

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
        'Content-Disposition': `attachment; filename="${filename.replace(/[^a-z0-9\-_. ]/gi, '_')}.${ext}"`,
        'Cache-Control': 'no-store',
        'X-Segment-Count': String(segments.length),
      },
    });
  } catch (err: any) {
    console.error('HLS download engine error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process HLS stream' }, { status: 500 });
  }
}
