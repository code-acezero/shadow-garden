import { NextRequest, NextResponse } from 'next/server';
import { AniListService } from '@/lib/anilist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '24', 10);

    const releasedOnly = searchParams.get('releasedOnly') !== 'false';

    const data: any = await AniListService.getAiringToday(page, perPage, releasedOnly);
    const items = Array.isArray(data) ? data : (data?.items || []);
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
