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

function mapTmdbToCard(item: any, forceType?: string): any {
  if (!item) return null;
  const poster = item.poster_path 
    ? `${TMDB_IMAGE_BASE}${item.poster_path}` 
    : (item.backdrop_path ? `${TMDB_IMAGE_BASE}${item.backdrop_path}` : '');

  const dateStr = item.first_air_date || item.release_date || '';
  const year = dateStr ? dateStr.split('-')[0] : '';
  const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : '7.8';
  
  const lang = (item.original_language || '').toLowerCase();
  const isMovie = item.title !== undefined || item.media_type === 'movie' || forceType === 'Movie';
  
  let type = 'Drama';
  let country = 'Global';
  let category: 'drama' | 'series' | 'movie' = 'drama';

  if (isMovie) {
    type = 'Movie';
    category = 'movie';
    if (lang === 'hi') country = 'Bollywood';
    else if (lang === 'ko') country = 'Korea';
    else if (lang === 'ja') country = 'Japan';
    else if (lang === 'zh') country = 'China';
    else country = 'Hollywood';
  } else {
    // TV Series or Asian Drama
    if (lang === 'ko') {
      type = 'K-Drama';
      country = 'Korea';
      category = 'drama';
    } else if (lang === 'zh') {
      type = 'C-Drama';
      country = 'China';
      category = 'drama';
    } else if (lang === 'ja') {
      type = 'J-Drama';
      country = 'Japan';
      category = 'drama';
    } else if (lang === 'th') {
      type = 'Thai Drama';
      country = 'Thailand';
      category = 'drama';
    } else if (lang === 'tr') {
      type = 'Turkish Drama';
      country = 'Turkey';
      category = 'drama';
    } else if (lang === 'hi') {
      type = 'Series';
      country = 'India';
      category = 'series';
    } else {
      type = 'Series';
      country = 'Series';
      category = 'series';
    }
  }

  const title = item.name || item.title || item.original_name || item.original_title || 'Untitled';
  const isHindi = lang === 'hi' || /hindi/i.test(title);

  return {
    id: String(item.id),
    slug: String(item.id),
    title,
    image: poster,
    poster: poster,
    backdrop: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : poster,
    overview: item.overview || '',
    synopsis: item.overview || '',
    type,
    category,
    year,
    country,
    episode: item.number_of_episodes ? `${item.number_of_episodes} EPS` : (isMovie ? 'Movie' : 'Series'),
    score: rating,
    isHindi,
    audio: isHindi ? 'Hindi Dub' : (category === 'drama' ? 'ENG Sub / OG' : 'English / Multi')
  };
}

const GENRE_MAP: Record<string, number> = {
  drama: 18,
  action: 10759,
  adventure: 10759,
  comedy: 35,
  crime: 80,
  mystery: 9648,
  romance: 10749,
  scifi: 10765,
  'sci-fi': 10765,
  fantasy: 10765,
  family: 10751,
  thriller: 53,
  war: 10768
};

// Filter out talk shows, reality shows, news, and anime from live-action drama/series discovery
const EXCLUDE_NON_SCRIPTED = '10767,10763,10764,16';

export async function GET(req: NextRequest, { params }: { params: Promise<{ endpoint: string[] }> }) {
  const { endpoint } = await params;
  const action = endpoint?.[0] || 'home';
  const urlObj = new URL(req.url);

  const cacheKey = `drama_v2:${endpoint?.join('/') || action}:${urlObj.search}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // ── 1. HOME: Unified Multi-Category Hub (Dramas, Series, Movies, Hindi Dubs, Turkish, Recent) ──
    if (action === 'home') {
      const [
        kdramas,
        cdramas,
        jdramas,
        turkishDramas,
        series,
        movies,
        bollywood,
        trending,
        hollywood,
        topKdramas,
        airingTodayTv,
        nowPlayingMovies
      ] = await Promise.all([
        fetchTmdb('/discover/tv', { with_original_language: 'ko', without_genres: EXCLUDE_NON_SCRIPTED, 'vote_count.gte': 15, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
        fetchTmdb('/discover/tv', { with_original_language: 'zh', without_genres: EXCLUDE_NON_SCRIPTED, 'vote_count.gte': 10, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
        fetchTmdb('/discover/tv', { with_original_language: 'ja', with_genres: 18, without_genres: EXCLUDE_NON_SCRIPTED, 'vote_count.gte': 5, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
        fetchTmdb('/discover/tv', { with_original_language: 'tr', without_genres: EXCLUDE_NON_SCRIPTED, 'vote_count.gte': 5, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
        fetchTmdb('/discover/tv', { with_original_language: 'en', without_genres: EXCLUDE_NON_SCRIPTED, 'vote_count.gte': 50, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
        fetchTmdb('/movie/popular', { page: 1 }).catch(() => ({ results: [] })),
        fetchTmdb('/discover/movie', { with_original_language: 'hi', 'vote_count.gte': 10, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
        fetchTmdb('/trending/tv/week').catch(() => ({ results: [] })),
        fetchTmdb('/discover/movie', { with_original_language: 'en', 'vote_count.gte': 100, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
        fetchTmdb('/discover/tv', { with_original_language: 'ko', without_genres: EXCLUDE_NON_SCRIPTED, 'vote_count.gte': 80, sort_by: 'vote_average.desc' }).catch(() => ({ results: [] })),
        fetchTmdb('/tv/airing_today', { page: 1 }).catch(() => ({ results: [] })),
        fetchTmdb('/movie/now_playing', { page: 1 }).catch(() => ({ results: [] }))
      ]);

      // Synchronize Recent Updates (interleave latest TV episodes and latest Movies together)
      const mappedRecentTv = (airingTodayTv.results || []).map((item: any) => {
        const c = mapTmdbToCard(item);
        if (c) c.episode = 'New Ep';
        return c;
      }).filter(Boolean);

      const mappedRecentMovies = (nowPlayingMovies.results || []).map((item: any) => mapTmdbToCard(item, 'Movie')).filter(Boolean);

      const syncedRecentUpdates: any[] = [];
      const maxLen = Math.max(mappedRecentTv.length, mappedRecentMovies.length);
      for (let i = 0; i < maxLen; i++) {
        if (mappedRecentTv[i]) syncedRecentUpdates.push(mappedRecentTv[i]);
        if (mappedRecentMovies[i]) syncedRecentUpdates.push(mappedRecentMovies[i]);
        if (syncedRecentUpdates.length >= 20) break;
      }

      // Hindi Dubbed / Bollywood Section from TMDB (Blakite is anime only)
      const hindiItems = (bollywood.results || [])
        .map((item: any) => {
          const card = mapTmdbToCard(item, 'Movie');
          if (card) {
            card.country = 'Hindi Dub';
            card.isHindi = true;
            card.audio = 'Hindi / Multi';
          }
          return card;
        })
        .filter(Boolean)
        .slice(0, 18);

      const sections = [
        {
          title: 'Recent Updates',
          items: syncedRecentUpdates.length > 0 ? syncedRecentUpdates : (trending.results || []).map((item: any) => mapTmdbToCard(item)).slice(0, 18),
          query: 'recent'
        },
        {
          title: 'Trending Asian Dramas',
          items: (trending.results || []).map((item: any) => mapTmdbToCard(item)).filter(Boolean).slice(0, 18),
          query: 'kdrama'
        },
        {
          title: 'Blockbuster Movies',
          items: (movies.results || []).map((item: any) => mapTmdbToCard(item, 'Movie')).filter(Boolean).slice(0, 18),
          query: 'movies'
        },
        {
          title: 'Popular Turkish Dramas (Dizi)',
          items: (turkishDramas.results || []).map((item: any) => mapTmdbToCard(item)).filter(Boolean).slice(0, 18),
          query: 'turkey'
        },
        {
          title: 'Binge-Worthy Web Series',
          items: (series.results || []).map((item: any) => mapTmdbToCard(item)).filter(Boolean).slice(0, 18),
          query: 'series'
        },
        {
          title: 'Popular Korean Dramas (K-Drama)',
          items: (kdramas.results || []).map((item: any) => mapTmdbToCard(item)).filter(Boolean).slice(0, 18),
          query: 'korea'
        },
        {
          title: 'Top Chinese Dramas (C-Drama)',
          items: (cdramas.results || []).map((item: any) => mapTmdbToCard(item)).filter(Boolean).slice(0, 18),
          query: 'china'
        },
        {
          title: 'Japanese Live Action & J-Dramas',
          items: (jdramas.results || []).map((item: any) => mapTmdbToCard(item)).filter(Boolean).slice(0, 18),
          query: 'japan'
        },
        {
          title: 'Bollywood Hits & Cinema',
          items: (bollywood.results || []).map((item: any) => mapTmdbToCard(item, 'Movie')).filter(Boolean).slice(0, 18),
          query: 'bollywood'
        },
        {
          title: 'Hollywood Hits & Blockbusters',
          items: (hollywood.results || []).map((item: any) => mapTmdbToCard(item, 'Movie')).filter(Boolean).slice(0, 18),
          query: 'hollywood'
        },
        {
          title: 'Critically Acclaimed Masterpieces',
          items: (topKdramas.results || []).map((item: any) => mapTmdbToCard(item)).filter(Boolean).slice(0, 18),
          query: 'top'
        }
      ];

      if (hindiItems.length > 0) {
        sections.splice(1, 0, {
          title: 'Hindi Dubbed Spotlight',
          items: hindiItems,
          query: 'hindi'
        });
      }

      const result = { sections: sections.filter(s => s.items.length > 0) };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // ── 2. DRAMAS: Dedicated Asian Drama Catalog (K-Drama, C-Drama, J-Drama, Thai) ──
    if (action === 'dramas') {
      const country = (urlObj.searchParams.get('country') || urlObj.searchParams.get('sub') || 'all').toLowerCase();
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);

      let lang = '';
      if (country.includes('korea') || country === 'kdrama') lang = 'ko';
      else if (country.includes('china') || country === 'cdrama') lang = 'zh';
      else if (country.includes('japan') || country === 'jdrama') lang = 'ja';
      else if (country.includes('thai')) lang = 'th';
      else if (country.includes('turk') || country === 'turkish' || country === 'tr') lang = 'tr';

      const params: Record<string, any> = {
        page,
        without_genres: EXCLUDE_NON_SCRIPTED,
        'vote_count.gte': 10,
        sort_by: 'popularity.desc'
      };

      if (lang) {
        params.with_original_language = lang;
      } else {
        // All Asian & Regional Dramas
        params.with_origin_country = 'KR|CN|JP|TH|TW|TR';
      }

      const data = await fetchTmdb('/discover/tv', params);
      const results = (data.results || []).map((item: any) => mapTmdbToCard(item)).filter(Boolean);

      const result = {
        results,
        currentPage: data.page || page,
        hasNextPage: (data.page || page) < (data.total_pages || 1)
      };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // ── 3. SERIES: Dedicated Web Series Catalog (Western, Global, Indian) ──
    if (action === 'series') {
      const category = (urlObj.searchParams.get('category') || urlObj.searchParams.get('sub') || 'all').toLowerCase();
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);

      const params: Record<string, any> = {
        page,
        without_genres: EXCLUDE_NON_SCRIPTED,
        sort_by: 'popularity.desc'
      };

      if (category.includes('indian') || category.includes('hindi')) {
        params.with_original_language = 'hi';
        params['vote_count.gte'] = 5;
      } else if (category.includes('top') || category.includes('rate')) {
        params.with_original_language = 'en';
        params['vote_count.gte'] = 200;
        params.sort_by = 'vote_average.desc';
      } else if (category.includes('scifi') || category.includes('action')) {
        params.with_genres = '10759,10765';
        params['vote_count.gte'] = 50;
      } else if (category.includes('crime') || category.includes('thrill')) {
        params.with_genres = '80,9648';
        params['vote_count.gte'] = 50;
      } else {
        // Trending / All global web series
        params.with_original_language = 'en';
        params['vote_count.gte'] = 50;
      }

      const data = await fetchTmdb('/discover/tv', params);
      const results = (data.results || []).map((item: any) => mapTmdbToCard(item)).filter(Boolean);

      const result = {
        results,
        currentPage: data.page || page,
        hasNextPage: (data.page || page) < (data.total_pages || 1)
      };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // ── 4. MOVIES: Dedicated Movies Catalog (Hollywood, Bollywood, Asian, Animated) ──
    if (action === 'movies') {
      const category = (urlObj.searchParams.get('category') || urlObj.searchParams.get('sub') || 'all').toLowerCase();
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);

      const params: Record<string, any> = {
        page,
        sort_by: 'popularity.desc'
      };

      if (category.includes('bolly') || category.includes('hindi') || category.includes('india')) {
        params.with_original_language = 'hi';
        params['vote_count.gte'] = 10;
      } else if (category.includes('holly') || category.includes('english')) {
        params.with_original_language = 'en';
        params['vote_count.gte'] = 100;
      } else if (category.includes('asian') || category.includes('korean') || category.includes('japanese')) {
        params.with_original_language = 'ko|ja|zh';
        params['vote_count.gte'] = 20;
      } else if (category.includes('anim')) {
        params.with_genres = 16;
        params['vote_count.gte'] = 50;
      } else if (category.includes('top') || category.includes('rate')) {
        params['vote_count.gte'] = 500;
        params.sort_by = 'vote_average.desc';
      }

      const data = await fetchTmdb('/discover/movie', params);
      const results = (data.results || []).map((item: any) => mapTmdbToCard(item, 'Movie')).filter(Boolean);

      const result = {
        results,
        currentPage: data.page || page,
        hasNextPage: (data.page || page) < (data.total_pages || 1)
      };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // ── 5. HINDI: Dedicated Hindi Dubbed & Bollywood Catalog (Dramas, Series & Movies) ──
    if (action === 'hindi') {
      const sub = (urlObj.searchParams.get('sub') || 'all').toLowerCase();
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
      const limit = 24;

      let allHindi: any[] = [];

      // Discover TMDB Hindi movies and series
      if (sub === 'all' || sub === 'movies' || sub === 'movie') {
        const tmdbMovies = await fetchTmdb('/discover/movie', { with_original_language: 'hi', page, sort_by: 'popularity.desc' }).catch(() => ({ results: [] }));
        const mappedMovies = (tmdbMovies.results || []).map((item: any) => mapTmdbToCard(item, 'Movie')).filter(Boolean);
        allHindi.push(...mappedMovies);
      }

      if (sub === 'all' || sub === 'series' || sub === 'dramas' || sub === 'drama') {
        const tmdbTv = await fetchTmdb('/discover/tv', { with_original_language: 'hi', page, sort_by: 'popularity.desc' }).catch(() => ({ results: [] }));
        const mappedTv = (tmdbTv.results || []).map((item: any) => mapTmdbToCard(item, 'Drama')).filter(Boolean);
        allHindi.push(...mappedTv);
      }

      const total = allHindi.length;
      const startIndex = (page - 1) * limit;
      const paged = allHindi.slice(startIndex, startIndex + limit);

      const result = {
        results: paged,
        currentPage: page,
        hasNextPage: startIndex + limit < total
      };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // ── 6. SEARCH: Unified Multi-Search across Dramas, Series & Movies ──
    if (action === 'search') {
      const q = urlObj.searchParams.get('keyword') || urlObj.searchParams.get('q') || urlObj.searchParams.get('story') || '';
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
      if (!q.trim()) return NextResponse.json({ results: [], total: 0 });

      // Run search on TMDB multi
      const multiRes = await fetchTmdb('/search/multi', { query: q.trim(), page }).catch(() => ({ results: [] }));

      const tmdbResults = (multiRes.results || [])
        .filter((r: any) => r.media_type === 'tv' || r.media_type === 'movie')
        .map((r: any) => mapTmdbToCard(r, r.media_type === 'movie' ? 'Movie' : undefined))
        .filter(Boolean);

      const seen = new Set<string>();
      const combined: any[] = [];

      for (const item of tmdbResults) {
        const key = item.id || item.title;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
        }
      }

      const result = {
        results: combined,
        total: combined.length,
        currentPage: page,
        hasNextPage: false
      };
      setCached(cacheKey, result, 600);
      return NextResponse.json(result);
    }

    // ── 6.5. TRAILER: On-Demand Official Trailer Resolver ──
    if (action === 'trailer') {
      const q = urlObj.searchParams.get('q') || urlObj.searchParams.get('query') || urlObj.searchParams.get('keyword') || '';
      const rawId = urlObj.searchParams.get('id') || '';

      let trailerResult: any = null;

      if (rawId) {
        let tmdbId = rawId;
        if (rawId.startsWith('tt')) {
          const findRes = await fetchTmdb(`/find/${rawId}`, { external_source: 'imdb_id' }).catch(() => null);
          const found = findRes?.movie_results?.[0] || findRes?.tv_results?.[0];
          if (found?.id) tmdbId = String(found.id);
        } else {
          const numMatch = rawId.match(/^(\d+)/);
          if (numMatch) tmdbId = numMatch[1];
        }

        const [movieVids, tvVids] = await Promise.all([
          fetchTmdb(`/movie/${tmdbId}/videos`, { include_video_language: 'en,null,ko,hi,ja,zh,fr,es,de' }).catch(() => ({ results: [] })),
          fetchTmdb(`/tv/${tmdbId}/videos`, { include_video_language: 'en,null,ko,hi,ja,zh,fr,es,de' }).catch(() => ({ results: [] }))
        ]);
        const allVids = [...(movieVids.results || []), ...(tvVids.results || [])];
        const trailerObj = allVids.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.official && v.iso_639_1 === 'en')
          || allVids.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
          || allVids.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer')
          || allVids.find((v: any) => v.site === 'YouTube' && v.type === 'Teaser')
          || allVids.find((v: any) => v.site === 'YouTube');
        if (trailerObj?.key) {
          trailerResult = {
            id: trailerObj.key,
            key: trailerObj.key,
            url: `https://www.youtube.com/watch?v=${trailerObj.key}`,
            embedUrl: `https://www.youtube.com/embed/${trailerObj.key}?autoplay=1&rel=0`,
            name: trailerObj.name || 'Official Trailer',
            type: trailerObj.type || 'Trailer'
          };
        }
      }

      // If not found by ID, try searching TMDB by title query
      if (!trailerResult && q) {
        try {
          const cleanQ = q.replace(/[\(\)\[\]]/g, ' ').trim();
          const [searchMovie, searchTv] = await Promise.all([
            fetchTmdb('/search/movie', { query: cleanQ }).catch(() => ({ results: [] })),
            fetchTmdb('/search/tv', { query: cleanQ }).catch(() => ({ results: [] }))
          ]);
          const firstHit = searchMovie.results?.[0] || searchTv.results?.[0];
          if (firstHit?.id) {
            const isHitMovie = Boolean(firstHit.title);
            const vids = await fetchTmdb(`/${isHitMovie ? 'movie' : 'tv'}/${firstHit.id}/videos`, {
              include_video_language: 'en,null,ko,hi,ja,zh,fr,es,de'
            }).catch(() => ({ results: [] }));
            const trailerObj = (vids.results || []).find((v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
              || (vids.results || []).find((v: any) => v.site === 'YouTube' && v.type === 'Trailer')
              || (vids.results || []).find((v: any) => v.site === 'YouTube');
            if (trailerObj?.key) {
              trailerResult = {
                id: trailerObj.key,
                key: trailerObj.key,
                url: `https://www.youtube.com/watch?v=${trailerObj.key}`,
                embedUrl: `https://www.youtube.com/embed/${trailerObj.key}?autoplay=1&rel=0`,
                name: trailerObj.name || `${q} Official Trailer`,
                type: 'Trailer'
              };
            }
          }
        } catch {}
      }

      if (!trailerResult && q) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const searchRes = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q.trim() + ' official trailer')}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9'
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (searchRes.ok) {
            const text = await searchRes.text();
            const match = text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
            if (match && match[1]) {
              trailerResult = {
                id: match[1],
                key: match[1],
                url: `https://www.youtube.com/watch?v=${match[1]}`,
                embedUrl: `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`,
                name: `${q} Official Trailer`,
                type: 'Trailer'
              };
            }
          }
        } catch {}
      }

      if (trailerResult) {
        setCached(cacheKey, trailerResult, 3600);
        return NextResponse.json(trailerResult);
      }
      return NextResponse.json({ error: 'Trailer not found' }, { status: 404 });
    }

    // ── 7. COUNTRY (Backward Compatibility) ──
    if (action === 'country') {
      const country = (endpoint?.[1] || urlObj.searchParams.get('country') || 'korea').toLowerCase();
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);

      let lang = 'ko';
      if (country.includes('china') || country.includes('chinese')) lang = 'zh';
      else if (country.includes('japan')) lang = 'ja';
      else if (country.includes('thai')) lang = 'th';
      else if (country.includes('india') || country.includes('hindi')) lang = 'hi';

      const data = await fetchTmdb('/discover/tv', {
        with_original_language: lang,
        without_genres: EXCLUDE_NON_SCRIPTED,
        page,
        sort_by: 'popularity.desc'
      });
      const results = (data.results || []).map((item: any) => mapTmdbToCard(item)).filter(Boolean);

      const result = {
        results,
        currentPage: data.page || page,
        hasNextPage: (data.page || page) < (data.total_pages || 1)
      };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // ── 8. GENRE (Backward Compatibility) ──
    if (action === 'genre') {
      const genre = (endpoint?.[1] || urlObj.searchParams.get('genre') || 'drama').toLowerCase();
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
      const genreId = GENRE_MAP[genre] || 18;

      const data = await fetchTmdb('/discover/tv', {
        with_genres: genreId,
        without_genres: EXCLUDE_NON_SCRIPTED,
        page,
        sort_by: 'popularity.desc'
      });
      const results = (data.results || []).map((item: any) => mapTmdbToCard(item)).filter(Boolean);

      const result = {
        results,
        currentPage: data.page || page,
        hasNextPage: (data.page || page) < (data.total_pages || 1)
      };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // ── 9. CATEGORY / FILTER (Backward Compatibility) ──
    if (action === 'category' || action === 'filter') {
      const path = (endpoint?.[1] || urlObj.searchParams.get('path') || urlObj.searchParams.get('type') || 'trending').toLowerCase();
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);

      let endpointPath = '/tv/popular';
      if (path.includes('top') || path.includes('rate')) endpointPath = '/tv/top_rated';
      else if (path.includes('trend')) endpointPath = '/trending/tv/week';
      else if (path.includes('airing') || path.includes('today')) endpointPath = '/tv/airing_today';
      else if (path.includes('on_the_air') || path.includes('ongoing')) endpointPath = '/tv/on_the_air';

      const data = await fetchTmdb(endpointPath, { page });
      const results = (data.results || []).map((item: any) => mapTmdbToCard(item)).filter(Boolean);

      const result = {
        results,
        currentPage: data.page || page,
        hasNextPage: (data.page || page) < (data.total_pages || 1)
      };
      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // ── 10. INFO / DETAIL: Unified Detail for Dramas, Web Series, and Movies ──
    if (action === 'info' || action === 'detail') {
      const rawId = endpoint?.[1] || urlObj.searchParams.get('id') || '';
      if (!rawId) return NextResponse.json({ error: 'Missing media id' }, { status: 400 });

      let tmdbId = rawId;

      // Extract numeric or IMDb prefix if slug format (e.g. "969681-spider-man-brand-new-day" -> "969681")
      const numMatch = rawId.match(/^(\d+)(?:-.*)?$/);
      const imdbMatch = rawId.match(/^(tt\d+)(?:-.*)?$/);
      if (numMatch) {
        tmdbId = numMatch[1];
      } else if (imdbMatch) {
        tmdbId = imdbMatch[1];
      }

      // Handle IMDb ID lookup (e.g. tt1234567)
      if (tmdbId.startsWith('tt')) {
        const findRes = await fetchTmdb(`/find/${tmdbId}`, { external_source: 'imdb_id' }).catch(() => null);
        const matched = findRes?.tv_results?.[0] || findRes?.movie_results?.[0];
        if (matched?.id) {
          tmdbId = String(matched.id);
        }
      }

      const reqType = (urlObj.searchParams.get('type') || '').toLowerCase();
      const isReqMovie = reqType === 'movie' || urlObj.searchParams.get('isMovie') === 'true';
      const isReqTv = reqType === 'tv' || reqType === 'series' || reqType === 'drama';

      let mediaData: any = null;
      let isMovie = false;

      if (isReqMovie) {
        mediaData = await fetchTmdb(`/movie/${tmdbId}`, {
          append_to_response: 'external_ids,recommendations,credits,videos,similar'
        }).catch(() => null);
        if (mediaData && mediaData.id) isMovie = true;
      } else if (isReqTv) {
        mediaData = await fetchTmdb(`/tv/${tmdbId}`, {
          append_to_response: 'external_ids,recommendations,credits,videos,similar'
        }).catch(() => null);
        if (mediaData && mediaData.id) isMovie = false;
      } else {
        // Fetch both in parallel and intelligently pick the most prominent one
        const [tvRes, movieRes] = await Promise.all([
          fetchTmdb(`/tv/${tmdbId}`, { append_to_response: 'external_ids,recommendations,credits,videos,similar' }).catch(() => null),
          fetchTmdb(`/movie/${tmdbId}`, { append_to_response: 'external_ids,recommendations,credits,videos,similar' }).catch(() => null)
        ]);

        if (movieRes && movieRes.id && tvRes && tvRes.id) {
          const movieVotes = movieRes.vote_count || 0;
          const tvVotes = tvRes.vote_count || 0;
          if (movieVotes > tvVotes) {
            mediaData = movieRes;
            isMovie = true;
          } else {
            mediaData = tvRes;
            isMovie = false;
          }
        } else if (movieRes && movieRes.id) {
          mediaData = movieRes;
          isMovie = true;
        } else if (tvRes && tvRes.id) {
          mediaData = tvRes;
          isMovie = false;
        }
      }

      if (!mediaData || !mediaData.id) {
        return NextResponse.json({ error: 'Media not found' }, { status: 404 });
      }

      const imdbId = mediaData.external_ids?.imdb_id || mediaData.imdb_id || '';
      const poster = mediaData.poster_path ? `${TMDB_IMAGE_BASE}${mediaData.poster_path}` : '';
      const backdrop = mediaData.backdrop_path ? `${TMDB_BACKDROP_BASE}${mediaData.backdrop_path}` : poster;

      const lang = (mediaData.original_language || '').toLowerCase();
      let type = 'Drama';
      let country = 'Global';
      if (isMovie) {
        type = 'Movie';
        country = lang === 'hi' ? 'Bollywood' : (lang === 'ko' ? 'Korea' : (lang === 'ja' ? 'Japan' : 'Hollywood'));
      } else {
        if (lang === 'ko') { type = 'K-Drama'; country = 'Korea'; }
        else if (lang === 'zh') { type = 'C-Drama'; country = 'China'; }
        else if (lang === 'ja') { type = 'J-Drama'; country = 'Japan'; }
        else if (lang === 'th') { type = 'Thai Drama'; country = 'Thailand'; }
        else if (lang === 'hi') { type = 'Series'; country = 'India'; }
        else { type = 'Series'; country = 'Series'; }
      }

      // Construct seasons list for TV / Dramas / Web Series
      const seasonsList = (!isMovie && Array.isArray(mediaData.seasons))
        ? mediaData.seasons
            .filter((s: any) => s.season_number > 0)
            .map((s: any) => ({
              seasonNumber: s.season_number,
              name: s.name || `Season ${s.season_number}`,
              episodeCount: s.episode_count || 1
            }))
        : [];

      const requestedSeason = parseInt(urlObj.searchParams.get('season') || '1', 10);

      // Construct episodes
      let episodesList: any[] = [];
      if (isMovie) {
        episodesList = [{
          id: '1',
          number: 1,
          title: 'Full Movie',
          url: `/stream/${tmdbId}?ep=1`,
          embedUrl: `https://vidlink.pro/movie/${tmdbId}`,
          image: backdrop || poster
        }];
      } else {
        // Fetch requested season episodes for accurate episode list
        try {
          const seasonData = await fetchTmdb(`/tv/${tmdbId}/season/${requestedSeason}`).catch(() => null);
          if (seasonData && Array.isArray(seasonData.episodes) && seasonData.episodes.length > 0) {
            episodesList = seasonData.episodes.map((ep: any) => ({
              id: String(ep.episode_number),
              number: ep.episode_number,
              season: requestedSeason,
              title: ep.name || `Episode ${ep.episode_number}`,
              url: `/stream/${tmdbId}?season=${requestedSeason}&ep=${ep.episode_number}`,
              embedUrl: `https://vidlink.pro/tv/${tmdbId}/${requestedSeason}/${ep.episode_number}`,
              image: ep.still_path ? `${TMDB_IMAGE_BASE}${ep.still_path}` : poster
            }));
          }
        } catch (sErr) {
          console.warn(`[Drama Info] Failed to load season ${requestedSeason} for ${tmdbId}:`, sErr);
        }

        // Fallback if season fetch is empty
        if (episodesList.length === 0) {
          const currentSeasonMeta = seasonsList.find((s: any) => s.seasonNumber === requestedSeason);
          const count = currentSeasonMeta?.episodeCount || mediaData.number_of_episodes || 12;
          for (let i = 1; i <= Math.min(count, 50); i++) {
            episodesList.push({
              id: String(i),
              number: i,
              season: requestedSeason,
              title: `Episode ${i}`,
              url: `/stream/${tmdbId}?season=${requestedSeason}&ep=${i}`,
              embedUrl: `https://vidlink.pro/tv/${tmdbId}/${requestedSeason}/${i}`,
              image: poster
            });
          }
        }
      }

      // Structured Cast & Characters: Load all casts with actual roles
      const structuredCast = (mediaData.credits?.cast || []).map((c: any) => {
        let actualRole = 'Cast Member';
        if (c.order === 0) actualRole = 'Lead Character';
        else if (c.order < 5) actualRole = 'Main Role';
        else if (c.order < 15) actualRole = 'Supporting Role';
        else actualRole = 'Cast Member';

        return {
          id: String(c.id),
          name: c.name || 'Unknown Actor',
          character: c.character || 'Cast Member',
          role: actualRole,
          profile: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
          profileLarge: c.profile_path ? `https://image.tmdb.org/t/p/w500${c.profile_path}` : null,
          image: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
          popularity: c.popularity,
          department: c.known_for_department || 'Acting'
        };
      });

      // Official YouTube Trailer extraction with multi-priority matching & fallbacks
      let trailerObj = (mediaData.videos?.results || []).find((v: any) => 
        v.site === 'YouTube' && v.type === 'Trailer' && v.official && v.iso_639_1 === 'en'
      ) || (mediaData.videos?.results || []).find((v: any) => 
        v.site === 'YouTube' && v.type === 'Trailer' && v.official
      ) || (mediaData.videos?.results || []).find((v: any) => 
        v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      ) || (mediaData.videos?.results || []).find((v: any) => v.site === 'YouTube');

      if (!trailerObj) {
        try {
          const vidsRes = await fetchTmdb(`/${isMovie ? 'movie' : 'tv'}/${tmdbId}/videos`, {
            include_video_language: 'en,null,ko,hi,ja,zh,fr,es,de'
          }).catch(() => null);
          const extraVids = vidsRes?.results || [];
          trailerObj = extraVids.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.official && v.iso_639_1 === 'en')
            || extraVids.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
            || extraVids.find((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
            || extraVids.find((v: any) => v.site === 'YouTube');
        } catch {}
      }

      if (!trailerObj) {
        const titleForSearch = mediaData.name || mediaData.title || mediaData.original_name || '';
        if (titleForSearch) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const searchRes = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(titleForSearch + ' official trailer')}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
              },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (searchRes.ok) {
              const text = await searchRes.text();
              const match = text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
              if (match && match[1]) {
                trailerObj = {
                  key: match[1],
                  site: 'YouTube',
                  name: `${titleForSearch} Official Trailer`,
                  type: 'Trailer'
                };
              }
            }
          } catch {}
        }
      }

      const trailer = trailerObj ? {
        id: trailerObj.key,
        key: trailerObj.key,
        url: `https://www.youtube.com/watch?v=${trailerObj.key}`,
        embedUrl: `https://www.youtube.com/embed/${trailerObj.key}?autoplay=1&rel=0`,
        name: trailerObj.name || 'Official Trailer',
        type: trailerObj.type || 'Trailer'
      } : null;

      // Related Titles: STRICTLY actual franchise collection or direct connected prequel/sequels ONLY
      let relatedFranchise: any[] = [];
      if (mediaData.belongs_to_collection && mediaData.belongs_to_collection.id) {
        try {
          const colData = await fetchTmdb(`/collection/${mediaData.belongs_to_collection.id}`).catch(() => null);
          if (colData && Array.isArray(colData.parts)) {
            relatedFranchise = colData.parts
              .filter((p: any) => String(p.id) !== String(tmdbId))
              .map((p: any) => ({
                ...mapTmdbToCard(p, 'Movie'),
                relationType: 'FRANCHISE'
              }));
          }
        } catch {}
      } else {
        // For titles without belongs_to_collection (e.g. multi-season dramas, direct sequels/spinoffs)
        const mainTitle = (mediaData.name || mediaData.title || '').trim();
        const cleanBaseTitle = mainTitle.split(/[:\-\–]/)[0].trim();
        if (cleanBaseTitle && cleanBaseTitle.length >= 4) {
          try {
            const searchEndpoint = isMovie ? '/search/movie' : '/search/tv';
            const searchRes = await fetchTmdb(searchEndpoint, { query: cleanBaseTitle }).catch(() => null);
            if (searchRes && Array.isArray(searchRes.results)) {
              const matched = searchRes.results.filter((item: any) => {
                if (String(item.id) === String(tmdbId)) return false;
                const itName = (item.name || item.title || '').toLowerCase();
                const baseLower = cleanBaseTitle.toLowerCase();
                return itName.startsWith(baseLower) || itName.includes(`${baseLower}:`) || itName.includes(`${baseLower} 2`) || itName.includes(`${baseLower} 3`);
              });
              relatedFranchise = matched.slice(0, 8).map((p: any) => ({
                ...mapTmdbToCard(p, isMovie ? 'Movie' : undefined),
                relationType: 'CONNECTED'
              }));
            }
          } catch {}
        }
      }

      // STRICT: If no genuine franchise/connected items exist, related is empty []!
      const related = relatedFranchise;

      // Recommendations ("More Like This"): Strictly distinct from related and current
      const relatedIds = new Set(related.map((r: any) => String(r.id)));
      const recommendations = (mediaData.recommendations?.results || mediaData.similar?.results || [])
        .map((r: any) => mapTmdbToCard(r, isMovie ? 'Movie' : undefined))
        .filter((r: any) => Boolean(r) && String(r.id) !== String(tmdbId) && !relatedIds.has(String(r.id)))
        .slice(0, 16);

      // Extract studios & production intel
      const studios = (mediaData.production_companies || mediaData.networks || [])
        .slice(0, 3)
        .map((c: any) => ({
          name: c.name,
          logo: c.logo_path ? `https://image.tmdb.org/t/p/w200${c.logo_path}` : null,
          country: c.origin_country || ''
        }));

      const director = (mediaData.credits?.crew || []).find((c: any) => c.job === 'Director')?.name 
        || (mediaData.created_by || [])[0]?.name 
        || '';

      const result = {
        id: String(mediaData.id),
        slug: String(mediaData.id),
        title: mediaData.name || mediaData.title || mediaData.original_name || mediaData.original_title || 'Untitled',
        image: poster,
        poster,
        banner: backdrop,
        backdrop,
        tagline: mediaData.tagline || '',
        synopsis: mediaData.overview || 'No synopsis available.',
        overview: mediaData.overview || '',
        status: mediaData.status === 'Ended' ? 'Completed' : (isMovie ? 'Released' : 'Ongoing'),
        type,
        isMovie,
        rating: mediaData.vote_average ? Number(mediaData.vote_average).toFixed(1) : '8.0',
        voteCount: mediaData.vote_count ? Number(mediaData.vote_count).toLocaleString() : undefined,
        year: (mediaData.first_air_date || mediaData.release_date || '').split('-')[0] || '',
        releaseDate: mediaData.release_date || mediaData.first_air_date || '',
        runtime: mediaData.runtime ? `${mediaData.runtime} min` : undefined,
        studios,
        director,
        trailer,
        country,
        imdbId,
        genres: (mediaData.genres || []).map((g: any) => g.name),
        cast: structuredCast,
        characters: structuredCast,
        episodes: episodesList,
        seasons: seasonsList.length > 0 ? seasonsList : undefined,
        recommendations,
        related,
        isHindi: lang === 'hi',
        originalLanguage: (mediaData.original_language || lang || 'en').toUpperCase(),
        embedUrl: isMovie ? `https://vidlink.pro/movie/${tmdbId}` : `https://vidlink.pro/tv/${tmdbId}/${requestedSeason}/1`
      };

      setCached(cacheKey, result, 900);
      return NextResponse.json(result);
    }

    // ── 11. STREAM / SERVERS RESOLVER: Direct HLS + Multi-Server Switcher ──
    if (action === 'stream' || action === 'embed' || action === 'watch' || action === 'servers') {
      const embedParam = urlObj.searchParams.get('url') || urlObj.searchParams.get('embed') || '';
      let id = urlObj.searchParams.get('id') || '';
      let season = urlObj.searchParams.get('season') || '1';
      let episode = urlObj.searchParams.get('episode') || urlObj.searchParams.get('ep') || '1';
      let isMovie = urlObj.searchParams.get('isMovie') === 'true' || urlObj.searchParams.get('type') === 'movie';
      const title = urlObj.searchParams.get('title') || '';

      if (embedParam) {
        const movieMatch = embedParam.match(/\/movie\/([^/?#]+)/i);
        if (movieMatch) {
          if (!id) id = movieMatch[1];
          isMovie = true;
        } else {
          const tvMatch = embedParam.match(/\/tv\/([^/?#]+)(?:\/(\d+))?(?:\/(\d+))?/i);
          if (tvMatch) {
            if (!id) id = tvMatch[1];
            if (tvMatch[2]) season = tvMatch[2];
            if (tvMatch[3]) episode = tvMatch[3];
          } else {
            const dramaWatchMatch = embedParam.match(/\/(?:drama|movies)-watch\/([^/?#]+)/i);
            if (dramaWatchMatch && !id) {
              id = dramaWatchMatch[1];
            }
            const epMatch = embedParam.match(/[?&]ep=(\d+)/i);
            if (epMatch) {
              episode = epMatch[1];
            }
          }
        }
      }

      let imdbIdParam = urlObj.searchParams.get('imdbId') || '';
      if (!imdbIdParam && id) {
        if (id.startsWith('tt')) {
          imdbIdParam = id;
        } else {
          try {
            const ext = await fetchTmdb(`/${isMovie ? 'movie' : 'tv'}/${id}/external_ids`).catch(() => null);
            if (ext?.imdb_id) imdbIdParam = ext.imdb_id;
          } catch {}
        }
      }
      const superTarget = imdbIdParam || id;

      // Helper: check if Super Player is available for this title
      const checkSuperPlayerAvailable = async (target: string): Promise<boolean> => {
        if (!target) return false;
        const ck = `super_srv_check_${target}`;
        const cached = getCached<boolean>(ck);
        if (cached !== null) return cached;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(`https://slast430did.com/play/${target}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Referer': 'https://hdmoviescloud.com/'
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!res.ok) {
            setCached(ck, false, 900);
            return false;
          }
          const html = await res.text();
          const isAvail = html.includes('let p3 =') || html.includes('HDVBPlayer');
          setCached(ck, isAvail, 1800);
          return isAvail;
        } catch {
          // If check times out, fallback to true so we don't break playback
          return true;
        }
      };

      // Fast async helper for hindidrama servers (Asian dramas & movies Hindi dubbed)
      const fetchHindiDramaServers = async (t: string, s: string | number, e: string | number, isMov: boolean = false) => {
        if (!t) return [];
        const cleanTitle = t.replace(/[^\w\s]/gi, ' ').trim();
        const ck = `hd_srv_${cleanTitle.toLowerCase().replace(/\s+/g, '_')}_s${s}_e${e}_${isMov ? 'm' : 'tv'}`;
        const cached = getCached<any[]>(ck);
        if (cached) return cached;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const searchRes = await fetch(`https://hindidrama.net/search.php?search=${encodeURIComponent(cleanTitle)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://hindidrama.net/' },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!searchRes.ok) return [];
          const searchHtml = await searchRes.text();

          const linkRegex = /href="([^"]*hindi-dubbed-online\/watch-[^"]+)"/gi;
          let linkMatch;
          const candidateHrefs: string[] = [];

          while ((linkMatch = linkRegex.exec(searchHtml)) !== null) {
            candidateHrefs.push(linkMatch[1]);
          }

          if (candidateHrefs.length === 0) return [];

          // Find the best matching href based on title tokens and season
          const titleTokens = cleanTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
          const seasonNum = Number(s) || 1;
          const seasonKeywords = [`season-${seasonNum}`, `s0${seasonNum}`, `s${seasonNum}`];

          let bestHref = candidateHrefs[0];
          let bestScore = -1;

          for (const href of candidateHrefs) {
            const lowerHref = href.toLowerCase();
            let score = 0;
            for (const token of titleTokens) {
              if (lowerHref.includes(token)) score += 2;
            }
            if (!isMov) {
              for (const sk of seasonKeywords) {
                if (lowerHref.includes(sk)) score += 3;
              }
            }
            if (score > bestScore) {
              bestScore = score;
              bestHref = href;
            }
          }

          if (bestScore <= 0 && titleTokens.length > 0) {
            setCached(ck, [], 1800);
            return [];
          }

          const parts = bestHref.replace(/\/$/, '').split('/');
          const slug = parts[parts.length - 1];
          const epStr = String(e).padStart(2, '0');
          const embedUrl = isMov 
            ? `https://hindidrama.net/embed/tvshow_srv?search=${slug}`
            : `https://hindidrama.net/embed/tvshow_srv?search=${slug}-e${epStr}`;

          const epController = new AbortController();
          const epTimeoutId = setTimeout(() => epController.abort(), 2500);
          const embedRes = await fetch(embedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://hindidrama.net/' },
            signal: epController.signal
          });
          clearTimeout(epTimeoutId);
          if (!embedRes.ok) return [];
          const embedHtml = await embedRes.text();

          const extractedServers: { name: string; url: string; type: 'hls' | 'iframe' }[] = [];
          if (embedHtml) {
            const srvRegex = /case\s+(\d+):\s*src\s*=\s*"(.*?)";/g;
            let srvMatch;
            while ((srvMatch = srvRegex.exec(embedHtml)) !== null) {
              const srvId = srvMatch[1];
              const src = srvMatch[2];
              if (!src) continue;
              let srvName = `Server ${srvId}`;
              if (src.includes('byse')) srvName = 'Byse';
              else if (src.includes('morencius') || src.includes('vidmoly')) srvName = 'Vidmoly';
              else if (src.includes('streamtape')) srvName = 'Streamtape';
              else if (src.includes('rpm') || src.includes('bolly')) srvName = 'RPM';
              extractedServers.push({ name: srvName, url: src, type: 'iframe' });
            }
          }

          if (extractedServers.length === 0 && embedHtml.includes('videoLink')) {
            extractedServers.push({ name: 'Hindi HD', url: embedUrl, type: 'iframe' });
          }

          setCached(ck, extractedServers, 3600);
          return extractedServers;
        } catch {
          return [];
        }
      };

      const reqAudio = (urlObj.searchParams.get('audio') || '').toLowerCase();

      // Check whether this media is natively in Hindi (e.g. Bollywood movie / Indian show)
      let isHindiNative = false;
      try {
        const mediaMeta = await fetchTmdb(`/${isMovie ? 'movie' : 'tv'}/${id}`).catch(() => null);
        if (mediaMeta?.original_language === 'hi') {
          isHindiNative = true;
        }
      } catch {}

      // Parallel execution for fast response: check hindidrama & super player
      const [hindiDramaServers, isSuperAvailable] = await Promise.all([
        reqAudio === 'multi' && title ? fetchHindiDramaServers(title, season, episode, isMovie) : Promise.resolve([]),
        checkSuperPlayerAvailable(superTarget)
      ]);

      // Construct Multi-Audio & Hindi Dubbed Server Sources DYNAMICALLY
      // ONLY load servers that genuinely provide Hindi/Multi audio (NO fake dummy fallbacks)
      const multiServers: { name: string; url: string; type: 'hls' | 'iframe' }[] = [];

      // 1. Add scraped genuine Hindi Dubbed servers (Byse, Vidmoly, Streamtape, RPM)
      if (hindiDramaServers.length > 0) {
        multiServers.push(...hindiDramaServers);
      }

      // 2. Add verified Super Player (which has Hindi audio tracks from HDMovie2/HDVB)
      if (isSuperAvailable) {
        multiServers.push({
          name: 'Super Player',
          url: `https://slast430did.com/play/${superTarget}`,
          type: 'iframe'
        });
        multiServers.push({
          name: 'Super Mirror',
          url: `https://gemma416okl.com/play/${superTarget}`,
          type: 'iframe'
        });
      }

      // 3. If native Hindi content, standard servers ARE playing Hindi original audio!
      if (isHindiNative) {
        multiServers.push(
          isMovie 
            ? { name: 'VidLink', url: `https://vidlink.pro/movie/${id}`, type: 'iframe' }
            : { name: 'VidLink', url: `https://vidlink.pro/tv/${id}/${season}/${episode}`, type: 'iframe' },
          isMovie
            ? { name: 'Videasy', url: `https://player.videasy.net/movie/${id}`, type: 'iframe' }
            : { name: 'Videasy', url: `https://player.videasy.net/tv/${id}/${season}/${episode}`, type: 'iframe' },
          isMovie
            ? { name: 'AutoEmbed', url: `https://player.autoembed.cc/embed/movie/${id}`, type: 'iframe' }
            : { name: 'AutoEmbed', url: `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`, type: 'iframe' }
        );
      }

      // Original Audio Server Sources (Verified working embeds)
      const ogServers: { name: string; url: string; type: 'hls' | 'iframe' }[] = isMovie ? [
        { name: 'VidLink', url: `https://vidlink.pro/movie/${id}`, type: 'iframe' },
        { name: 'Videasy', url: `https://player.videasy.net/movie/${id}`, type: 'iframe' },
        { name: 'AutoEmbed', url: `https://player.autoembed.cc/embed/movie/${id}`, type: 'iframe' },
        { name: 'VidSrc ME', url: `https://vidsrc.me/embed/movie?tmdb=${id}`, type: 'iframe' },
        { name: 'SuperEmbed', url: `https://multiembed.mov/?video_id=${id}&tmdb=1`, type: 'iframe' },
        { name: '2Embed', url: `https://www.2embed.cc/embed/${id}`, type: 'iframe' },
        { name: 'Super Player', url: `https://slast430did.com/play/${superTarget}`, type: 'iframe' }
      ] : [
        { name: 'VidLink', url: `https://vidlink.pro/tv/${id}/${season}/${episode}`, type: 'iframe' },
        { name: 'Videasy', url: `https://player.videasy.net/tv/${id}/${season}/${episode}`, type: 'iframe' },
        { name: 'AutoEmbed', url: `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`, type: 'iframe' },
        { name: 'VidSrc ME', url: `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`, type: 'iframe' },
        { name: 'SuperEmbed', url: `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`, type: 'iframe' },
        { name: '2Embed', url: `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`, type: 'iframe' },
        { name: 'Super Player', url: `https://slast430did.com/play/${superTarget}`, type: 'iframe' }
      ];

      const servers = reqAudio === 'multi' ? multiServers : ogServers;

      return NextResponse.json({
        servers,
        ogServers,
        multiServers,
        hasMultiAudio: multiServers.length > 0,
        iframeUrl: servers[0]?.url
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 404 });
  } catch (error: any) {
    console.error(`[Drama TMDB API Error] ${action}:`, error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
