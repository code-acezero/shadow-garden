import { NextRequest, NextResponse } from 'next/server';
import { resolveHepDramaStream, getHepDramaDetail } from '@/lib/shorts/sources/hepdrama';
import { getNartoDramaDetail, resolveNartoStream } from '@/lib/shorts/sources/narto';
import { searchNartoDrama } from '@/lib/shorts/sources/narto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'hepdrama';
    const epId = searchParams.get('epId');
    const seriesSlug = searchParams.get('seriesSlug');
    const epNum = parseInt(searchParams.get('epNum') || '1', 10);

    // 1. HepDrama Stream Resolution (Proxied through /api/proxy for zero CORS issues)
    if (source === 'hepdrama') {
      let targetEpId = epId;

      if (!targetEpId && seriesSlug) {
        const detail = await getHepDramaDetail(seriesSlug);
        const ep = detail?.episodes.find(e => e.episodeNumber === epNum);
        if (ep) {
          const match = ep.streamUrl.match(/epId=([0-9a-fA-F-]+)/);
          if (match) targetEpId = match[1];
          else if (ep.streamUrl.startsWith('http')) {
            const proxiedUrl = `/api/proxy?url=${encodeURIComponent(ep.streamUrl)}&referer=${encodeURIComponent('https://hepdrama.com/')}`;
            return NextResponse.redirect(new URL(proxiedUrl, request.url), 302);
          }
        }
      }

      if (targetEpId) {
        const cdnUrl = await resolveHepDramaStream(targetEpId);
        if (cdnUrl) {
          const proxiedUrl = `/api/proxy?url=${encodeURIComponent(cdnUrl)}&referer=${encodeURIComponent('https://hepdrama.com/')}`;
          return NextResponse.redirect(new URL(proxiedUrl, request.url), 302);
        }
      }
    }

    // 2. Narto Drama Stream Resolution (Edge router resolution + /api/proxy)
    if (source === 'narto' && seriesSlug) {
      const directUrl = await resolveNartoStream(seriesSlug, epNum);
      if (directUrl) {
        const proxiedUrl = `/api/proxy?url=${encodeURIComponent(directUrl)}&referer=${encodeURIComponent('https://narto-drama.com/')}`;
        return NextResponse.redirect(new URL(proxiedUrl, request.url), 302);
      }

      const detail = await getNartoDramaDetail(seriesSlug);
      const ep = detail?.episodes.find(e => e.episodeNumber === epNum);
      if (ep?.streamUrl) {
        const proxiedUrl = `/api/proxy?url=${encodeURIComponent(ep.streamUrl)}&referer=${encodeURIComponent('https://narto-drama.com/')}`;
        return NextResponse.redirect(new URL(proxiedUrl, request.url), 302);
      }
    }

    // 3. DramaDünyam Stream Resolution (Cross-reference Narto)
    if (source === 'dramadunyam' && seriesSlug) {
      const cleanTitle = seriesSlug.replace(/-/g, ' ');
      const nartoMatches = await searchNartoDrama(cleanTitle);
      if (nartoMatches.length > 0) {
        const targetSlug = nartoMatches[0].id.replace(/^narto_/, '');
        const directUrl = await resolveNartoStream(targetSlug, epNum);
        if (directUrl) {
          const proxiedUrl = `/api/proxy?url=${encodeURIComponent(directUrl)}&referer=${encodeURIComponent('https://narto-drama.com/')}`;
          return NextResponse.redirect(new URL(proxiedUrl, request.url), 302);
        }
      }
    }

    return NextResponse.json(
      { success: false, error: 'Stream not found or expired' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('[API Shorts Stream Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resolve stream' },
      { status: 500 }
    );
  }
}
