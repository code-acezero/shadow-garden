import { NextRequest, NextResponse } from 'next/server';
import { 
  getBlakiteHome, 
  getBlakiteLatest, 
  searchBlakite, 
  filterBlakite, 
  getBlakiteDetail, 
  getBlakiteStreamUrl,
  getHindiDubSchedule,
  getHindiReleasingToday,
  getBlakiteLiveAction
} from '@/lib/blakite';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  try {
    const { endpoint } = await params;
    const parts = endpoint || [];
    const mainEndpoint = parts[0] || '';
    const subParam = parts.slice(1).join('/');

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '24', 10);

    if (mainEndpoint === 'live-action' || mainEndpoint === 'dramas') {
      const data = await getBlakiteLiveAction(page, perPage);
      return NextResponse.json({ ok: true, success: true, data });
    }

    if (mainEndpoint === 'home') {
      const data = await getBlakiteHome();
      return NextResponse.json({ ok: true, success: true, data });
    }

    if (mainEndpoint === 'search') {
      const keyword = searchParams.get('keyword') || searchParams.get('q') || '';
      const data = await searchBlakite(keyword, page);
      return NextResponse.json({ ok: true, success: true, data });
    }

    if (mainEndpoint === 'filter') {
      const genre = searchParams.get('genre') || undefined;
      const type = searchParams.get('type') || undefined;
      const status = searchParams.get('status') || undefined;
      const sort = searchParams.get('sort') || undefined;
      const data = await filterBlakite({ genre, type, status, sort }, page);
      return NextResponse.json({ ok: true, success: true, data });
    }

    if (mainEndpoint === 'latest') {
      const type = searchParams.get('type') || 'updated-all';
      const data = await getBlakiteLatest(type, page);
      return NextResponse.json({ ok: true, success: true, results: data?.results || [], data });
    }

    if (mainEndpoint === 'schedule') {
      const date = searchParams.get('date') || undefined;
      const data = await getHindiDubSchedule(date);
      return NextResponse.json({ ok: true, success: true, data });
    }

    if (mainEndpoint === 'releasing-today') {
      const limit = parseInt(searchParams.get('limit') || '24', 10);
      const data = await getHindiReleasingToday(limit);
      return NextResponse.json({ ok: true, success: true, results: data });
    }

    if (mainEndpoint === 'anime') {
      const rawSub = subParam || searchParams.get('id') || '';
      const [id, subAction] = rawSub.split('/');
      if (!id) {
        return NextResponse.json({ ok: false, error: 'Missing anime id' }, { status: 400 });
      }
      if (subAction === 'recommendations' || subAction === 'related') {
        return NextResponse.json({ ok: true, success: true, results: [], data: [] });
      }
      const data = await getBlakiteDetail(id);
      if (!data) {
        return NextResponse.json({ ok: false, error: 'Anime not found' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, success: true, data });
    }

    if (mainEndpoint === 'watch') {
      const slug = subParam || searchParams.get('slug') || '';
      if (!slug) {
        return NextResponse.json({ ok: false, error: 'Missing watch slug' }, { status: 400 });
      }
      const data = await getBlakiteStreamUrl(slug);
      if (!data) {
        return NextResponse.json({ ok: false, error: 'Stream not found' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, success: true, data });
    }

    return NextResponse.json({ ok: false, error: 'Endpoint not found' }, { status: 404 });
  } catch (error: any) {
    console.error('[Blakite Route Error]:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
