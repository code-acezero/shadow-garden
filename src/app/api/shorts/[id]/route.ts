import { NextRequest, NextResponse } from 'next/server';
import { getShortDramaById } from '@/lib/shorts';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Drama ID is required' },
        { status: 400 }
      );
    }

    const drama = await getShortDramaById(id);
    if (!drama) {
      return NextResponse.json(
        { success: false, error: 'Drama not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      drama
    });
  } catch (error: any) {
    console.error('API Shorts Detail Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch drama details' },
      { status: 500 }
    );
  }
}
