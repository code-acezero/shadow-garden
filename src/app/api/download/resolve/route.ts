import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// Heuristic patterns commonly used by embed players to expose their real source.
// This is best-effort: obfuscated/DRM-protected or server-token-gated embeds
// cannot be reliably resolved this way, and we say so honestly rather than
// pretending this works universally.
const PATTERNS: RegExp[] = [
  /"file"\s*:\s*"([^"]+\.(?:m3u8|mp4)[^"]*)"/i,
  /file\s*:\s*"([^"]+\.(?:m3u8|mp4)[^"]*)"/i,
  /source\s*src=["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i,
  /(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i,
  /(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/i,
];

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const embedUrl = sp.get('url');
  const referer = sp.get('referer') || embedUrl || '';

  if (!embedUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const decodedUrl = decodeURIComponent(embedUrl);
    const res = await fetch(decodedUrl, {
      headers: {
        Referer: decodeURIComponent(referer),
        'User-Agent': UA,
        Accept: 'text/html,*/*',
      },
      redirect: 'follow',
    });
    if (!res.ok) {
      return NextResponse.json({ resolved: false, reason: `Embed page returned ${res.status}` }, { status: 200 });
    }
    const html = await res.text();

    for (const pattern of PATTERNS) {
      const m = html.match(pattern);
      if (m && m[1]) {
        const found = m[1].replace(/\\\//g, '/');
        const isM3U8 = found.toLowerCase().includes('.m3u8');
        return NextResponse.json({
          resolved: true,
          url: found,
          type: isM3U8 ? 'hls' : 'mp4',
        });
      }
    }

    return NextResponse.json({
      resolved: false,
      reason: 'No direct source pattern found — this embed likely loads its stream via obfuscated JS or DRM and cannot be captured server-side.',
    });
  } catch (err: any) {
    return NextResponse.json({ resolved: false, reason: err.message || 'Resolve failed' });
  }
}
