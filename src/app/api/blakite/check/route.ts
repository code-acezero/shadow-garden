import { NextRequest, NextResponse } from 'next/server';
import { checkHindiDub } from '@/lib/blakite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || '';
    const ep = searchParams.get('ep') || searchParams.get('episode');
    if (!title) {
      return NextResponse.json({ ok: false, available: false, error: 'No title provided' });
    }

    const result = await checkHindiDub(title, ep ? Number(ep) : undefined);
    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (err: any) {
    console.error('Error in /api/blakite/check:', err);
    return NextResponse.json({ ok: false, available: false, error: err.message }, { status: 500 });
  }
}
