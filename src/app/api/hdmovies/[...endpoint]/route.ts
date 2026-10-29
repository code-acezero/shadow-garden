import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const TMDB_API_KEY = '1cf50e6248dc270629e802686245c2c8';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

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

async function fetchTmdb(endpoint: string, params: Record<string, string | number> = {}): Promise<any> {
  const query = new URLSearchParams({
    api_key: TMDB_API_KEY,
    ...Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)])
    )
  });

  const url = `${TMDB_BASE}${endpoint}?${query.toString()}`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ShadowGarden/2.0'
      },
      next: { revalidate: 600 }
    });
    if (!res.ok) {
      throw new Error(`TMDB HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

function mapTmdbToCard(m: any): any {
  if (!m) return null;
  const poster = m.poster_path 
    ? `${TMDB_IMAGE_BASE}${m.poster_path}` 
    : (m.backdrop_path ? `${TMDB_IMAGE_BASE}${m.backdrop_path}` : '');

  const year = m.release_date ? m.release_date.split('-')[0] : '';
  const rating = m.vote_average ? Number(m.vote_average).toFixed(1) : '7.5';

  return {
    id: String(m.id),
    slug: String(m.id),
    title: m.title || m.name || m.original_title || 'Untitled',
    image: poster,
    poster: poster,
    backdrop: m.backdrop_path ? `${TMDB_BACKDROP_BASE}${m.backdrop_path}` : poster,
    rating: rating,
    year: year,
    type: 'Movie',
    country: m.original_language?.toUpperCase() === 'HI' ? 'Bollywood' : (m.original_language?.toUpperCase() === 'JA' ? 'Japan' : 'Hollywood'),
    overview: m.overview || ''
  };
}

const GENRE_MAP: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'sci-fi': 878,
  scifi: 878,
  thriller: 53,
  war: 10752,
  western: 37
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ endpoint: string[] }> }) {
  const { endpoint } = await params;
  const action = endpoint?.[0] || 'home';
  const urlObj = new URL(req.url);

  const cacheKey = `${action}:${urlObj.search}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // 1. HOME: Rich multi-category curated movie rows
    if (action === 'home') {
      const [trending, popular, topRated, bollywood, animation] = await Promise.all([
        fetchTmdb('/trending/movie/week').catch(() => ({ results: [] })),
        fetchTmdb('/movie/popular').catch(() => ({ results: [] })),
        fetchTmdb('/movie/top_rated').catch(() => ({ results: [] })),
        fetchTmdb('/discover/movie', { with_original_language: 'hi', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
        fetchTmdb('/discover/movie', { with_genres: 16, sort_by: 'popularity.desc' }).catch(() => ({ results: [] }))
      ]);

      const sections = [
        {
          title: 'Recent Updates',
          items: (trending.results || []).map(mapTmdbToCard).filter(Boolean).slice(0, 18),
          query: 'trending'
        },
        {
          title: 'Trending Movies',
          items: (popular.results || []).map(mapTmdbToCard).filter(Boolean).slice(0, 18),
          query: 'popular'
        },
        {
          title: 'Top Rated Blockbusters',
          items: (topRated.results || []).map(mapTmdbToCard).filter(Boolean).slice(0, 18),
          query: 'top_rated'
        },
        {
          title: 'Bollywood Hits',
          items: (bollywood.results || []).map(mapTmdbToCard).filter(Boolean).slice(0, 18),
          query: 'bollywood'
        },
        {
          title: 'Animation & Animated Features',
          items: (animation.results || []).map(mapTmdbToCard).filter(Boolean).slice(0, 18),
          query: 'animation'
        }
      ].filter(s => s.items.length > 0);

      const result = { sections };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // 2. SEARCH
    if (action === 'search') {
      const q = urlObj.searchParams.get('q') || urlObj.searchParams.get('story') || urlObj.searchParams.get('keyword') || '';
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
      if (!q.trim()) return NextResponse.json({ results: [], total: 0 });

      const data = await fetchTmdb('/search/movie', { query: q.trim(), page });
      const results = (data.results || []).map(mapTmdbToCard).filter(Boolean);

      const result = {
        results,
        total: data.total_results || results.length,
        currentPage: data.page || page,
        hasNextPage: (data.page || page) < (data.total_pages || 1)
      };
      setCached(cacheKey, result, 600);
      return NextResponse.json(result);
    }

    // 3. GENRE
    if (action === 'genre') {
      const genre = (urlObj.searchParams.get('genre') || 'action').toLowerCase();
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
      const genreId = GENRE_MAP[genre] || 28;

      const data = await fetchTmdb('/discover/movie', {
        with_genres: genreId,
        page,
        sort_by: 'popularity.desc'
      });
      const results = (data.results || []).map(mapTmdbToCard).filter(Boolean);

      const result = {
        results,
        currentPage: data.page || page,
        hasNextPage: (data.page || page) < (data.total_pages || 1)
      };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // 4. COUNTRY / REGIONAL CATALOGUES
    if (action === 'country') {
      const country = (urlObj.searchParams.get('country') || 'bollywood').toLowerCase();
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);

      let lang = 'en';
      if (country.includes('bolly') || country.includes('india') || country.includes('hindi')) lang = 'hi';
      else if (country.includes('korea')) lang = 'ko';
      else if (country.includes('japan')) lang = 'ja';
      else if (country.includes('china')) lang = 'zh';
      else if (country.includes('thai')) lang = 'th';
      else if (country.includes('turk')) lang = 'tr';

      const data = await fetchTmdb('/discover/movie', {
        with_original_language: lang,
        page,
        sort_by: 'popularity.desc'
      });
      const results = (data.results || []).map(mapTmdbToCard).filter(Boolean);

      const result = {
        results,
        currentPage: data.page || page,
        hasNextPage: (data.page || page) < (data.total_pages || 1)
      };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // 5. CATEGORY
    if (action === 'category') {
      const category = (urlObj.searchParams.get('category') || 'popular').toLowerCase();
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);

      let endpointPath = '/movie/popular';
      if (category.includes('top') || category.includes('rate')) endpointPath = '/movie/top_rated';
      else if (category.includes('trend')) endpointPath = '/trending/movie/week';
      else if (category.includes('upcom')) endpointPath = '/movie/upcoming';

      const data = await fetchTmdb(endpointPath, { page });
      const results = (data.results || []).map(mapTmdbToCard).filter(Boolean);

      const result = {
        results,
        currentPage: data.page || page,
        hasNextPage: (data.page || page) < (data.total_pages || 1)
      };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // 6. WATCH / DETAIL
    if (action === 'watch' || action === 'detail') {
      const rawId = urlObj.searchParams.get('id') || endpoint?.[1] || '';
      if (!rawId) return NextResponse.json({ error: 'Missing movie id' }, { status: 400 });

      let tmdbId = rawId;

      // Handle IMDb ID lookup (e.g. tt1234567)
      if (rawId.startsWith('tt')) {
        const findRes = await fetchTmdb(`/find/${rawId}`, { external_source: 'imdb_id' }).catch(() => null);
        const matched = findRes?.movie_results?.[0];
        if (matched?.id) {
          tmdbId = String(matched.id);
        }
      }

      const movie = await fetchTmdb(`/movie/${tmdbId}`, {
        append_to_response: 'external_ids,recommendations,credits,videos'
      });

      if (!movie || !movie.id) {
        return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
      }

      const imdbId = movie.external_ids?.imdb_id || movie.imdb_id || '';
      const poster = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : '';
      const backdrop = movie.backdrop_path ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}` : poster;

      // Multi-Server High Speed Embed Players
      const streams = [
        { name: 'VidSrc Pro', url: `https://vidsrc.to/embed/movie/${imdbId || movie.id}`, type: 'embed' },
        { name: 'VidLink Pro', url: `https://vidlink.pro/movie/${movie.id}`, type: 'embed' },
        { name: 'AutoEmbed', url: `https://autoembed.co/movie/tmdb/${movie.id}`, type: 'embed' },
        { name: 'EmbedSU', url: `https://embed.su/embed/movie/${movie.id}`, type: 'embed' },
        { name: 'VidSrc CC', url: `https://vidsrc.cc/v2/embed/movie/${movie.id}`, type: 'embed' },
        { name: 'Super Player', url: `https://slast430did.com/play/${imdbId || movie.id}`, type: 'iframe' },
        { name: '2Embed', url: `https://www.2embed.cc/embed/${imdbId || movie.id}`, type: 'embed' }
      ];

      const related = (movie.recommendations?.results || []).map(mapTmdbToCard).filter(Boolean).slice(0, 12);

      const result = {
        id: String(movie.id),
        slug: String(movie.id),
        title: movie.title || movie.original_title || 'Untitled',
        image: poster,
        cover: backdrop,
        synopsis: movie.overview || 'No synopsis available.',
        description: movie.overview || '',
        imdbId: imdbId,
        year: movie.release_date ? movie.release_date.split('-')[0] : '',
        releaseDate: movie.release_date || '',
        runtime: movie.runtime ? `${movie.runtime} min` : undefined,
        rating: movie.vote_average ? Number(movie.vote_average).toFixed(1) : '7.5',
        type: 'Movie',
        country: movie.original_language?.toUpperCase() === 'HI' ? 'Bollywood' : 'Hollywood',
        genres: (movie.genres || []).map((g: any) => g.name),
        cast: (movie.credits?.cast || []).slice(0, 18).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character || 'Cast Member',
          role: c.character ? 'Actor' : 'Cast Member',
          image: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
          profile: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
          profileLarge: c.profile_path ? `https://image.tmdb.org/t/p/w500${c.profile_path}` : null,
          department: c.known_for_department || 'Acting',
          popularity: c.popularity
        })),
        characters: (movie.credits?.cast || []).slice(0, 18).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character || 'Cast Member',
          role: c.character ? 'Actor' : 'Cast Member',
          image: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
          profile: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
          profileLarge: c.profile_path ? `https://image.tmdb.org/t/p/w500${c.profile_path}` : null,
          department: c.known_for_department || 'Acting',
          popularity: c.popularity
        })),
        streams: streams,
        related: related,
        downloadLinks: []
      };

      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 404 });
  } catch (error: any) {
    console.error(`[HDMovies TMDB API Error] ${action}:`, error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
