import { NextRequest, NextResponse } from 'next/server';
import { getBlakitePopular } from '@/lib/blakite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '24', 10);

    const result = await getBlakitePopular(page, perPage);
    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (err: any) {
    console.error('Error in /api/blakite/popular:', err);
    return NextResponse.json({ ok: false, results: [], error: err.message }, { status: 500 });
  }
}
