import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const BASE_URL = 'https://hdmoviescloud.com';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// In-memory cache with 15-minute TTL
const memoryCache = new Map<string, { data: any; expiry: number }>();

function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCached(key: string, data: any, ttlSeconds: number = 900) {
  memoryCache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
}

async function fetchWithTimeout(url: string, headers: any, timeoutMs: number = 10000): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal, cache: 'no-store' });
    if (res.ok) return await res.text();
    throw new Error(`HTTP ${res.status}`);
  } finally {
    clearTimeout(id);
  }
}

function parseSlug(href: string): string {
  const clean = href.replace(/\/$/, '').replace(/\.html$/, '');
  const parts = clean.split('/');
  return parts[parts.length - 1] || '';
}

function parseCards(html: string): any[] {
  const regex = /<article[^>]*class="item[^"]*"[^>]*>[\s\S]*?<div class="poster">[\s\S]*?<img [^>]*src="([^"]+)"[^>]*alt="([^"]*)"[\s\S]*?(?:<div class="rating">([^<]*)<\/div>)?[\s\S]*?<a href="([^"]+)"[\s\S]*?<div class="data[^"]*">[\s\S]*?<h3><a[^>]*>([^<]*)<\/a><\/h3>[\s\S]*?(?:<span>(\d{4})<\/span>)?/gi;
  const cards: any[] = [];
  for (const m of html.matchAll(regex)) {
    const rawImg = m[1];
    const img = rawImg.startsWith('http') ? rawImg : `${BASE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;
    const href = m[4];
    const slug = parseSlug(href);
    const title = (m[5] || m[2] || '').trim();
    const rating = m[3]?.trim() || '';
    const year = m[6] || '';
    if (slug && title) {
      cards.push({
        id: slug,
        slug,
        title,
        href,
        image: img,
        rating,
        year,
        type: 'Movie'
      });
    }
  }
  return cards;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ endpoint: string[] }> }) {
  const { endpoint } = await params;
  const action = endpoint?.[0] || 'home';
  const urlObj = new URL(req.url);

  const cacheKey = `${action}:${urlObj.search}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // 1. HOME
    if (action === 'home') {
      const html = await fetchWithTimeout(BASE_URL, { ...HEADERS, Referer: `${BASE_URL}/` });
      const cards = parseCards(html);

      const sections = [
        { title: 'Recent Updates', items: cards.slice(0, 12) },
        { title: 'Trending Movies', items: cards.slice(12, 24) },
        { title: 'Popular Right Now', items: cards.slice(24, 36) },
        { title: 'Top Rated', items: cards.slice(36) }
      ].filter(s => s.items.length > 0);

      const result = { sections: sections.length > 0 ? sections : [{ title: 'Movies & Series', items: cards }] };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // 2. SEARCH
    if (action === 'search') {
      const q = urlObj.searchParams.get('q') || urlObj.searchParams.get('story') || '';
      if (!q.trim()) return NextResponse.json({ results: [], total: 0 });

      const searchUrl = `${BASE_URL}/index.php?do=search&subaction=search&story=${encodeURIComponent(q.trim())}`;
      const html = await fetchWithTimeout(searchUrl, { ...HEADERS, Referer: `${BASE_URL}/` });
      const results = parseCards(html);

      const result = { results, total: results.length, currentPage: 1, hasNextPage: false };
      setCached(cacheKey, result, 600);
      return NextResponse.json(result);
    }

    // 3. GENRE
    if (action === 'genre') {
      const genre = urlObj.searchParams.get('genre') || 'action';
      const page = urlObj.searchParams.get('page') || '1';
      const path = page === '1' ? `/${genre}/` : `/${genre}/page/${page}/`;
      const html = await fetchWithTimeout(`${BASE_URL}${path}`, { ...HEADERS, Referer: `${BASE_URL}/` });
      const results = parseCards(html);

      const result = { results, currentPage: parseInt(page, 10), hasNextPage: results.length >= 20 };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // 4. COUNTRY
    if (action === 'country') {
      const country = urlObj.searchParams.get('country') || 'bollywood';
      const page = urlObj.searchParams.get('page') || '1';
      const path = page === '1' ? `/${country}/` : `/${country}/page/${page}/`;
      const html = await fetchWithTimeout(`${BASE_URL}${path}`, { ...HEADERS, Referer: `${BASE_URL}/` });
      const results = parseCards(html);

      const result = { results, currentPage: parseInt(page, 10), hasNextPage: results.length >= 20 };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // 5. CATEGORY
    if (action === 'category') {
      const category = urlObj.searchParams.get('category') || 'films';
      const page = urlObj.searchParams.get('page') || '1';
      const path = page === '1' ? `/${category}/` : `/${category}/page/${page}/`;
      const html = await fetchWithTimeout(`${BASE_URL}${path}`, { ...HEADERS, Referer: `${BASE_URL}/` });
      const results = parseCards(html);

      const result = { results, currentPage: parseInt(page, 10), hasNextPage: results.length >= 20 };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // 6. WATCH / DETAIL
    if (action === 'watch' || action === 'detail') {
      const id = urlObj.searchParams.get('id') || endpoint?.[1] || '';
      if (!id) return NextResponse.json({ error: 'Missing movie id' }, { status: 400 });

      const detailUrl = id.endsWith('.html') ? `${BASE_URL}/${id}` : `${BASE_URL}/${id}.html`;
      const html = await fetchWithTimeout(detailUrl, { ...HEADERS, Referer: `${BASE_URL}/` });

      const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const title = (titleMatch?.[1] || id.replace(/-/g, ' ')).trim();

      const posterMatch = html.match(/<div class="poster">[\s\S]*?<img [^>]*src="([^"]+)"/i);
      const rawPoster = posterMatch?.[1] || '';
      const image = rawPoster.startsWith('http') ? rawPoster : `${BASE_URL}${rawPoster.startsWith('/') ? '' : '/'}${rawPoster}`;

      const synopsisMatch = html.match(/class="description"[^>]*>([\s\S]*?)<\/div>/i) || html.match(/<p>([\s\S]*?)<\/p>/i);
      const synopsis = synopsisMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || '';

      const imdbMatch = html.match(/tt\d{7,8}/);
      const imdbId = imdbMatch?.[0] || '';

      const yearMatch = html.match(/<span>(\d{4})<\/span>/);
      const year = yearMatch?.[1] || '';

      const ratingMatch = html.match(/class="rating"[^>]*>([^<]+)<\/div>/i);
      const rating = ratingMatch?.[1]?.trim() || '7.5';

      const type = html.includes('series') || html.includes('Season') || html.includes('Episode') ? 'series' : 'movie';

      // Standard embed servers using imdbId
      const streams: any[] = [];
      if (imdbId) {
        streams.push(
          { name: 'Super Player', url: `https://slast430did.com/play/${imdbId}`, type: 'iframe' },
          { name: 'VidSrc', url: type === 'series' ? `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=1&episode=1` : `https://vidsrc.me/embed/movie?imdb=${imdbId}`, type: 'embed' },
          { name: 'VidSrc Pro', url: type === 'series' ? `https://vidsrc.to/embed/tv/${imdbId}/1/1` : `https://vidsrc.to/embed/movie/${imdbId}`, type: 'embed' },
          { name: 'VidSrc IN', url: type === 'series' ? `https://vidsrc.in/embed/tv/${imdbId}/1/1` : `https://vidsrc.in/embed/movie/${imdbId}`, type: 'embed' },
          { name: 'AutoEmbed', url: type === 'series' ? `https://autoembed.co/tv/imdb/${imdbId}-1-1` : `https://autoembed.co/movie/imdb/${imdbId}`, type: 'embed' },
          { name: 'VidSrc CC', url: type === 'series' ? `https://vidsrc.cc/v2/embed/tv/${imdbId}/1/1` : `https://vidsrc.cc/v2/embed/movie/${imdbId}`, type: 'embed' }
        );
      }

      // Extract related items
      const related = parseCards(html).slice(0, 10);

      const result = {
        id,
        slug: id,
        title,
        image,
        cover: image,
        synopsis,
        description: synopsis,
        imdbId,
        year,
        rating,
        type,
        streams,
        related,
        genres: ['Action', 'Thriller', 'Drama'],
        downloadLinks: []
      };

      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 404 });
  } catch (error: any) {
    console.error(`[HDMovies API Error] ${action}:`, error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
