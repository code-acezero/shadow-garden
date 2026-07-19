import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 800;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const url = sp.get('url');
  const referer = sp.get('referer') || 'https://megacloud.blog/';
  const filename = sp.get('filename') || 'download';

  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const decodedUrl = decodeURIComponent(url);
    const decodedReferer = decodeURIComponent(referer);
    const range = request.headers.get('range');

    const headers: Record<string, string> = {
      Referer: decodedReferer,
      Origin: new URL(decodedReferer).origin,
      'User-Agent': UA,
      Accept: '*/*',
    };
    if (range) headers.Range = range;

    const upstream = await fetch(decodedUrl, { headers, redirect: 'follow' });
    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: `Upstream error ${upstream.status}` }, { status: upstream.status });
    }

    const respHeaders: Record<string, string> = {
      'Content-Type': upstream.headers.get('Content-Type') || 'video/mp4',
      'Content-Disposition': `attachment; filename="${filename.replace(/[^a-z0-9\-_. ]/gi, '_')}"`,
      'Accept-Ranges': upstream.headers.get('Accept-Ranges') || 'bytes',
      'Cache-Control': 'no-store',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
    };
    const cl = upstream.headers.get('Content-Length');
    if (cl) respHeaders['Content-Length'] = cl;
    const cr = upstream.headers.get('Content-Range');
    if (cr) respHeaders['Content-Range'] = cr;

    return new NextResponse(upstream.body, {
      status: upstream.status === 206 ? 206 : 200,
      headers: respHeaders,
    });
  } catch (err: any) {
    console.error('File download engine error:', err);
    return NextResponse.json({ error: err.message || 'Download failed' }, { status: 500 });
  }
}
