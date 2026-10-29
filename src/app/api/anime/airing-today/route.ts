import { NextRequest, NextResponse } from 'next/server';
import { AniListService } from '@/lib/anilist';
import { getHindiReleasingToday } from '@/lib/blakite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let lastMatchRun = 0;
const FAST_MATCH_THROTTLE = 3 * 60 * 1000; // Run at most once every 3 minutes on feed activity

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '24', 10);
    const releasedOnly = searchParams.get('releasedOnly') !== 'false';
    const audio = (searchParams.get('audio') || 'all').toLowerCase(); // 'all' | 'sub' | 'hi'

    // Anikoto Event Trigger: Opportunistically check for new episode alerts on feed load
    const now = Date.now();
    if (page === 1 && now - lastMatchRun > FAST_MATCH_THROTTLE) {
      lastMatchRun = now;
      import('@/lib/oracle-runner').then(m => m.checkRecentEpisodeAlerts()).catch(() => {});
    }

    if (audio === 'hi') {
      const hindiResults = await getHindiReleasingToday(perPage);
      return NextResponse.json({
        ok: true,
        page: 1,
        pageInfo: { currentPage: 1, hasNextPage: false, totalPages: 1 },
        results: hindiResults
      });
    }

    if (audio === 'dub') {
      const dubResults = await AniListService.getEnglishDubbed(page, perPage);
      return NextResponse.json({
        ok: true,
        page,
        pageInfo: { currentPage: page, hasNextPage: dubResults.length === perPage, totalPages: 1 },
        results: dubResults.map((it: any) => ({ ...it, isDub: true }))
      });
    }

    const data: any = await AniListService.getAiringToday(page, perPage, releasedOnly);
    let items = Array.isArray(data) ? data : (data?.items || []);

    if (audio === 'all' && page === 1) {
      try {
        const hindiToday = await getHindiReleasingToday(6);
        if (hindiToday.length > 0) {
          // Mark sub items
          items = items.map((it: any) => ({ ...it, isSub: true }));
          // Interleave / prepend today's Hindi releases with distinct isHindi flag
          const combined = [];
          const maxLen = Math.max(items.length, hindiToday.length);
          for (let i = 0; i < maxLen; i++) {
            if (i < hindiToday.length) combined.push(hindiToday[i]);
            if (i < items.length) combined.push(items[i]);
          }
          items = combined.slice(0, perPage);
        }
      } catch (hErr) {
        console.warn('[AiringToday] Hindi dub merge fallback:', hErr);
      }
    }

    return NextResponse.json({
      ok: true,
      page,
      pageInfo: data?.pageInfo || { currentPage: page, hasNextPage: items.length === perPage, totalPages: 1 },
      results: items
    });
  } catch (err: any) {
    console.error('Error in /api/anime/airing-today:', err);
    return NextResponse.json({ ok: false, results: [], error: err.message }, { status: 500 });
  }
}

