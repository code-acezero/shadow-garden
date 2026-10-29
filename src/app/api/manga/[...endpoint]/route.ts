import { NextRequest, NextResponse } from 'next/server';
import { mangaService, novelService, ReadingMediaType } from '@/lib/manga';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ endpoint: string[] }> }) {
  try {
    const { endpoint } = await params;
    const path = endpoint ? endpoint.join('/') : '';
    const searchParams = req.nextUrl.searchParams;

    // 1. Trending & Recent
    if (path === 'trending' || path === 'recent' || path === 'updates') {
      const type = (searchParams.get('type') || (path === 'recent' || path === 'updates' ? 'recent' : 'all')) as ReadingMediaType;
      const lang = searchParams.get('lang') || undefined;
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '18', 10);

      if (type === 'recent' || path === 'recent' || path === 'updates') {
        const res = await mangaService.getRecentUpdates(page, limit, lang);
        return NextResponse.json({ ok: true, data: res, total: 1000 });
      }

      if (type === 'light_novel' || type === 'web_novel') {
        const novels = await novelService.getTrending(page, limit);
        return NextResponse.json({ ok: true, data: novels, total: 100 });
      }

      const res = await mangaService.getTrending(type, page, limit, lang);
      return NextResponse.json({ ok: true, data: res, total: 1000 });
    }

    // 2. Search
    if (path === 'search') {
      const q = searchParams.get('q') || '';
      const type = (searchParams.get('type') || 'all') as ReadingMediaType;
      const lang = searchParams.get('lang') || undefined;
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);

      if (type === 'light_novel' || type === 'web_novel') {
        const novels = await novelService.search(q, page, limit);
        return NextResponse.json({ ok: true, data: novels, total: novels.length });
      }

      const res = await mangaService.search({ query: q, type, language: lang, page, limit });
      return NextResponse.json({ ok: true, data: res.items, total: res.total });
    }

    // 3. Details
    if (path === 'details') {
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ ok: false, error: 'id parameter is required' }, { status: 400 });

      if (id.startsWith('novel-')) {
        const novelDetail = await novelService.getDetails(id);
        if (novelDetail) {
          return NextResponse.json({ ok: true, data: novelDetail });
        }

        // Fallback detail
        return NextResponse.json({
          ok: true,
          data: {
            id,
            slug: id,
            title: 'Light Novel Archive',
            description: 'Archived Light Novel from the Kagemi Library.',
            cover: '/images/placeholder.jpg',
            type: 'light_novel',
            status: 'ongoing',
            score: '8.8',
            genres: ['Fantasy', 'Action'],
            availableLanguages: ['en', 'hi', 'bn', 'es', 'fr', 'ja'],
            totalChapters: 'Ongoing',
            isNovel: true
          }
        });
      }

      const item = await mangaService.getDetails(id);
      if (!item) return NextResponse.json({ ok: false, error: 'Manga not found' }, { status: 404 });
      return NextResponse.json({ ok: true, data: item });
    }

    // 4. Chapters
    if (path === 'chapters') {
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ ok: false, error: 'id parameter is required' }, { status: 400 });

      const lang = searchParams.get('lang') || undefined;
      const order = (searchParams.get('order') || 'asc') as 'asc' | 'desc';

      if (id.startsWith('novel-')) {
        const chapters = novelService.getNovelChapters(id, 60);
        return NextResponse.json({ ok: true, data: chapters });
      }

      const chapters = await mangaService.getChapters(id, lang, order);
      return NextResponse.json({ ok: true, data: chapters });
    }

    // 5. Pages
    if (path === 'pages') {
      const chapterId = searchParams.get('chapterId');
      if (!chapterId) return NextResponse.json({ ok: false, error: 'chapterId parameter is required' }, { status: 400 });

      const pagesResult = await mangaService.getChapterPages(chapterId);
      if (!pagesResult) return NextResponse.json({ ok: false, error: 'Failed to load chapter pages' }, { status: 500 });
      return NextResponse.json({ ok: true, data: pagesResult });
    }

    // 6. Novel chapter content with translation
    if (path === 'novel-chapter') {
      const id = searchParams.get('id') || 'novel-1';
      const chapter = searchParams.get('chapter') || '1';
      const lang = searchParams.get('lang') || 'en';

      const contentResult = await novelService.getChapterContent(id, chapter, lang);
      return NextResponse.json({ ok: true, data: contentResult });
    }

    return NextResponse.json({ ok: false, error: `Unknown endpoint: ${path}` }, { status: 404 });
  } catch (error: any) {
    console.error('Manga API error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
