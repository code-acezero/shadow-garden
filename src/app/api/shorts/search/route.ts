import { NextRequest, NextResponse } from 'next/server';
import { searchAllShorts } from '@/lib/shorts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        items: [],
        total: 0
      });
    }

    const items = await searchAllShorts(query, page);
    return NextResponse.json({
      success: true,
      query,
      items,
      total: items.length
    });
  } catch (error: any) {
    console.error('API Shorts Search Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
