import { NextRequest, NextResponse } from 'next/server';
import { AniListService } from '@/lib/anilist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '24', 10);

    const items = await AniListService.getMostFavorite(page, perPage);
    return NextResponse.json({
      ok: true,
      page,
      results: items || []
    });
  } catch (err: any) {
    console.error('Error in /api/anime/favorite:', err);
    return NextResponse.json({ ok: false, results: [], error: err.message }, { status: 500 });
  }
}
