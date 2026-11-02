import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function unpackDeanEdwards(str: string): string {
  const regex = /eval\(function\(p,a,c,k,e,[rd]\)\{[\s\S]+?\}\s*\(\s*(['"][\s\S]*?['"])\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(['"][\s\S]*?['"])\.split\(['"]\|['"]\)/;
  const match = str.match(regex);
  if (!match) return str;
  try {
    let p = match[1];
    if ((p.startsWith("'") && p.endsWith("'")) || (p.startsWith('"') && p.endsWith('"'))) {
      p = p.slice(1, -1);
    }
    p = p.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    const a = parseInt(match[2], 10);
    const c = parseInt(match[3], 10);
    let kStr = match[4];
    if ((kStr.startsWith("'") && kStr.endsWith("'")) || (kStr.startsWith('"') && kStr.endsWith('"'))) {
      kStr = kStr.slice(1, -1);
    }
    const k = kStr.split('|');

    const baseConvert = (val: number, radix: number): string => {
      const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let res = '';
      do {
        res = chars[val % radix] + res;
        val = Math.floor(val / radix);
      } while (val > 0);
      return res;
    };

    const dict: Record<string, string> = {};
    for (let i = c - 1; i >= 0; i--) {
      const key = baseConvert(i, a);
      dict[key] = k[i] || key;
    }

    const unpacked = p.replace(/\b(\w+)\b/g, (w) => (dict[w] !== undefined ? dict[w] : w));
    return str + '\n' + unpacked;
  } catch {
    return str;
  }
}

const PATTERNS: RegExp[] = [
  /sources:\s*\[\s*\{\s*["']?file["']?\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i,
  /"file"\s*:\s*"([^"]+\.(?:m3u8|mp4)[^"]*)"/i,
  /file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i,
  /source\s*src=["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i,
  /src:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i,
  /<video[^>]+src=["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i,
  /(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i,
  /(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/i,
];

function extractFromText(text: string): { url: string; type: 'hls' | 'mp4' } | null {
  const unpackedText = unpackDeanEdwards(text);
  for (const pattern of PATTERNS) {
    const m = unpackedText.match(pattern);
    if (m && m[1]) {
      const found = m[1].replace(/\\\//g, '/').trim();
      if (found.startsWith('http://') || found.startsWith('https://')) {
        const isM3U8 = found.toLowerCase().includes('.m3u8');
        return {
          url: found,
          type: isM3U8 ? 'hls' : 'mp4',
        };
      }
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const embedUrl = sp.get('url');
  const referer = sp.get('referer') || embedUrl || '';

  if (!embedUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const decodedUrl = decodeURIComponent(embedUrl);

    // If already direct m3u8 or mp4
    if (decodedUrl.toLowerCase().includes('.m3u8')) {
      return NextResponse.json({ resolved: true, url: decodedUrl, type: 'hls' });
    }
    if (decodedUrl.toLowerCase().includes('.mp4')) {
      return NextResponse.json({ resolved: true, url: decodedUrl, type: 'mp4' });
    }

    let origin: string | undefined;
    try {
      origin = new URL(decodeURIComponent(referer)).origin;
    } catch {
      origin = undefined;
    }

    const headers: Record<string, string> = {
      Referer: decodeURIComponent(referer),
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    };
    if (origin) headers.Origin = origin;

    const res = await fetch(decodedUrl, { headers, redirect: 'follow' });
    if (!res.ok) {
      return NextResponse.json({ resolved: false, reason: `Embed page returned ${res.status}` }, { status: 200 });
    }
    const html = await res.text();

    const direct = extractFromText(html);
    if (direct) {
      return NextResponse.json({ resolved: true, url: direct.url, type: direct.type });
    }

    // Attempt 1-level deep child iframe resolution if nested
    const iframeMatch = html.match(/<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/i);
    if (iframeMatch && iframeMatch[1] && !iframeMatch[1].includes('google') && !iframeMatch[1].includes('captcha')) {
      try {
        const childUrl = iframeMatch[1];
        const childRes = await fetch(childUrl, {
          headers: {
            Referer: decodedUrl,
            'User-Agent': UA,
            Accept: 'text/html,*/*',
          },
          redirect: 'follow',
        });
        if (childRes.ok) {
          const childHtml = await childRes.text();
          const childFound = extractFromText(childHtml);
          if (childFound) {
            return NextResponse.json({ resolved: true, url: childFound.url, type: childFound.type });
          }
        }
      } catch {
        // Child iframe fetch failed, proceed to fallback
      }
    }

    return NextResponse.json({
      resolved: false,
      reason: 'No direct source pattern found — this embed uses protected DRM or server tokens and cannot be captured server-side.',
    });
  } catch (err: any) {
    return NextResponse.json({ resolved: false, reason: err.message || 'Resolve failed' });
  }
}
