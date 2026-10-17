import { NextRequest, NextResponse } from 'next/server';
import { getShortDramaFeed, ShortsCategoryTab } from '@/lib/shorts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') || 'trending') as ShortsCategoryTab;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    const feed = await getShortDramaFeed(category, page);
    return NextResponse.json({
      success: true,
      category,
      ...feed
    });
  } catch (error: any) {
    console.error('API Shorts Feed Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch shorts feed' },
      { status: 500 }
    );
  }
}
