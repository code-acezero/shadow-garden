// src/lib/omni.ts
// Direct client for Shadow Garden self-hosted Drama & Movies APIs
// Routes directly to /api/drama and /api/hdmovies with 0 external dependencies or middleman proxies.

const getOmniBase = () => '/api/drama';
const getMoviesBase = () => '/api/hdmovies';

async function fetchOmni<T = any>(
  endpoint: string,
  params: Record<string, any> = {}
): Promise<T | null> {
  const queryParts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const base = endpoint.startsWith('http') ? '' : (endpoint.includes('hdmovies') ? getMoviesBase() : getOmniBase());
  const cleanEndpoint = endpoint.replace('/hdmovies', '');
  const targetUrl = endpoint.startsWith('http') ? endpoint : `${base}${cleanEndpoint}${queryString}`;
  
  const origin = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') : '';
  const fetchUrl = targetUrl.startsWith('http') ? targetUrl : `${origin}${targetUrl}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(fetchUrl, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    if (json && typeof json === 'object') {
      if ('ok' in json) return json.ok ? (json.data ?? json) : null;
      if ('data' in json && !('results' in json) && !('servers' in json)) return json.data as T;
    }
    return json as T;
  } catch {
    return null;
  }
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface DramaCard {
  id: string;           // slug used in URL
  slug?: string;
  title: string;
  image: string;
  poster?: string;
  backdrop?: string;
  overview?: string;
  synopsis?: string;
  type?: string;
  category?: 'drama' | 'series' | 'movie';
  isMovie?: boolean;
  episode?: string;
  year?: string;
  country?: string;
  isHindi?: boolean;
  audio?: string;
  score?: string;
  relationType?: string;
}

export interface DramaSection {
  title: string;
  items: DramaCard[];
  query?: string;
}

export interface DramaHome {
  sections: DramaSection[];
}

export interface DramaEpisode {
  id: string;
  number: number;
  title: string;
  url: string;
  embedUrl?: string;
  image?: string;
  season?: number;
}

export interface DramaSeason {
  seasonNumber: number;
  name: string;
  episodeCount: number;
}

export interface DramaCharacter {
  id: string;
  name: string;
  character?: string;
  role?: string;
  profile?: string | null;
  profileLarge?: string | null;
  image?: string | null;
  popularity?: number;
  department?: string;
}

export interface DramaTrailer {
  id: string;
  key: string;
  url: string;
  embedUrl: string;
  name?: string;
  type?: string;
}

export interface DramaDetail {
  id: string;
  slug: string;
  title: string;
  image: string;
  poster?: string;
  banner?: string;
  backdrop?: string;
  synopsis: string;
  overview?: string;
  status: string;
  type: string;
  isMovie?: boolean;
  rating?: string;
  year?: string;
  country?: string;
  genres: string[];
  cast?: any[];
  characters?: DramaCharacter[];
  runtime?: string;
  imdbId?: string;
  episodes: DramaEpisode[];
  seasons?: DramaSeason[];
  recommendations: DramaCard[];
  related?: DramaCard[];
  trailer?: DramaTrailer | null;
  isHindi?: boolean;
  originalLanguage?: string;
  tagline?: string;
  releaseDate?: string;
  voteCount?: string;
  studios?: { name: string; logo?: string | null; country?: string }[];
  director?: string;
  embedUrl?: string;  // base embed URL for stream fetching
}

export interface DramaServer {
  name: string;
  url: string;
  type: 'hls' | 'iframe';
}

export interface DramaStream {
  servers: DramaServer[];
  ogServers?: DramaServer[];
  multiServers?: DramaServer[];
  hasMultiAudio?: boolean;
  hlsUrl?: string;     // first HLS url if available
  iframeUrl?: string;  // first iframe url as fallback
}

export interface MovieDetail {
  id: string;
  slug: string;
  title: string;
  image: string;
  cover?: string;
  description: string;
  synopsis?: string;
  imdbId: string;
  genres?: string[];
  country?: string;
  year?: string;
  rating?: string;
  contentRating?: string;
  releaseDate?: string;
  runtime?: string;
  cast?: string[];
  type?: string;           // 'Movie' | 'TV Series' etc.
  languages?: string[];
  downloadLinks: { name: string; url: string; quality?: string; size?: string }[];
  streams: { name: string; url: string }[];
  related?: DramaCard[];
  seasons?: {
    seasonNumber: number;
    sources: { name: string; url: string }[];
    episodes?: {
      episodeNumber: number;
      title: string;
      image?: string | null;
      summary?: string | null;
      airdate?: string | null;
    }[];
  }[];
}

// ─── NORMALIZER ──────────────────────────────────────────────────────────────

function normalizeDramaCard(item: any): DramaCard {
  return {
    id: String(item?.slug || item?.id || ''),
    slug: String(item?.slug || item?.id || ''),
    title: item?.title || item?.name || 'Unknown',
    image: item?.image || item?.poster || item?.thumbnail || '',
    poster: item?.poster || item?.image || item?.thumbnail || '',
    backdrop: item?.backdrop || item?.banner || item?.cover || '',
    overview: item?.overview || item?.synopsis || item?.description || '',
    synopsis: item?.synopsis || item?.overview || item?.description || '',
    type: item?.type || item?.country || '',
    category: item?.category,
    isMovie: Boolean(item?.isMovie || item?.category === 'movie' || item?.type === 'Movie'),
    episode: item?.episode !== undefined ? String(item.episode) : undefined,
    year: item?.year ? String(item.year) : undefined,
    country: item?.country || '',
    isHindi: Boolean(item?.isHindi),
    audio: item?.audio || (item?.isHindi ? 'Hindi Dub' : undefined),
    score: item?.score ? String(item.score) : undefined,
    relationType: item?.relationType,
  };
}

// ─── CLIENT ──────────────────────────────────────────────────────────────────

class OmniClient {
  drama = {
    getHome: async (): Promise<DramaHome> => {
      const res: any = await fetchOmni('/home');
      const sections: DramaSection[] = [];

      if (res && Array.isArray(res.sections)) {
        res.sections.forEach((section: any) => {
          if (section.title && Array.isArray(section.items) && section.items.length > 0) {
            sections.push({
              title: section.title,
              items: section.items.map(normalizeDramaCard),
              query: section.query
            });
          }
        });
      }

      // Final fallback
      if (sections.length === 0) {
        sections.push({ title: 'Drama & Movies', items: [] });
      }

      return { sections };
    },

    getDramas: async (country = 'all', page = 1) => {
      const res: any = await fetchOmni('/dramas', { country, page });
      const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
      return {
        items,
        pagination: {
          currentPage: res?.currentPage || page,
          hasNextPage: res?.hasNextPage ?? items.length >= 20,
          totalPages: 10,
        },
      };
    },

    getSeries: async (category = 'all', page = 1) => {
      const res: any = await fetchOmni('/series', { category, page });
      const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
      return {
        items,
        pagination: {
          currentPage: res?.currentPage || page,
          hasNextPage: res?.hasNextPage ?? items.length >= 20,
          totalPages: 10,
        },
      };
    },

    getMovies: async (category = 'all', page = 1) => {
      const res: any = await fetchOmni('/movies', { category, page });
      const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
      return {
        items,
        pagination: {
          currentPage: res?.currentPage || page,
          hasNextPage: res?.hasNextPage ?? items.length >= 20,
          totalPages: 10,
        },
      };
    },

    getHindi: async (sub = 'all', page = 1) => {
      const res: any = await fetchOmni('/hindi', { sub, page });
      const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
      return {
        items,
        pagination: {
          currentPage: res?.currentPage || page,
          hasNextPage: res?.hasNextPage ?? false,
          totalPages: 10,
        },
      };
    },

    search: async (query: string, page = 1) => {
      const res: any = await fetchOmni('/search', { keyword: query, page });
      const items = Array.isArray(res?.results)
        ? res.results.map(normalizeDramaCard)
        : Array.isArray(res) ? res.map(normalizeDramaCard) : [];
      return {
        items,
        pagination: {
          currentPage: res?.page || page,
          hasNextPage: res?.hasNextPage ?? items.length >= 20,
          totalPages: res?.totalPages ?? 1,
        },
      };
    },

    getDetail: async (slug: string, type?: string, season?: number | string): Promise<DramaDetail | null> => {
      const q: any = {};
      if (type) q.type = type;
      if (season) q.season = season;
      const res: any = await fetchOmni(`/info/${encodeURIComponent(slug)}`, Object.keys(q).length > 0 ? q : undefined);
      if (!res) return null;

      const episodes: DramaEpisode[] = (res.episodes || []).map((e: any, i: number) => ({
        id: e.id || e.slug || String(i + 1),
        number: e.number || i + 1,
        title: e.title || `Episode ${e.number || i + 1}`,
        url: e.url || e.href || e.embedUrl || '',
        embedUrl: e.embedUrl || e.url || e.href || '',
        image: e.image || res.image || '',
        season: e.season || (season ? Number(season) : 1),
      }));

      const recommendations: DramaCard[] = (res.recommendations || []).map(normalizeDramaCard);
      const related: DramaCard[] = (res.related || []).map(normalizeDramaCard);
      const characters = Array.isArray(res.characters) ? res.characters : (Array.isArray(res.cast) ? res.cast : []);

      let finalTitle = res.title || res.name || 'Unknown Title';
      if (finalTitle === 'FAQs') {
        finalTitle = slug
          .replace('watch-', '')
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }

      let finalStatus = res.status || 'Unknown';
      if (finalStatus === 'UNKNOWN') finalStatus = 'Completed';

      return {
        id: slug,
        slug,
        title: finalTitle,
        image: res.image || res.poster || res.thumbnail || '',
        poster: res.poster || res.image || '',
        banner: res.banner || res.backdrop || res.cover || res.image || '',
        backdrop: res.backdrop || res.banner || '',
        synopsis: res.synopsis || res.description || res.plot || '',
        overview: res.overview || res.synopsis || res.description || '',
        status: finalStatus,
        type: res.type || res.country || 'Drama',
        isMovie: Boolean(res.isMovie),
        rating: res.rating ? String(res.rating) : undefined,
        year: res.year ? String(res.year) : undefined,
        runtime: res.runtime ? String(res.runtime) : undefined,
        country: res.country || '',
        cast: Array.isArray(res.cast) ? res.cast : [],
        characters,
        genres: Array.isArray(res.genres) ? res.genres : [],
        episodes,
        seasons: Array.isArray(res.seasons) ? res.seasons : undefined,
        recommendations,
        related,
        imdbId: res.imdbId,
        isHindi: Boolean(res.isHindi),
        originalLanguage: res.originalLanguage || res.original_language,
        embedUrl: res.embedUrl || res.embed_url || undefined,
      };
    },

    getStream: async (embedUrl: string, id?: string, season?: number | string, episode?: number | string, isMovie?: boolean, title?: string, audio?: 'og' | 'multi', imdbId?: string): Promise<DramaStream> => {
      const res: any = await fetchOmni(
        '/servers',
        { url: embedUrl, id, season, episode, isMovie, title, audio, imdbId }
      );

      const mapServers = (arr: any[]): DramaServer[] => Array.isArray(arr)
        ? arr.map((s: any) => ({
            name: s.name || 'Server',
            url: s.url || '',
            type: s.type === 'hls' ? 'hls' : 'iframe',
          }))
        : [];

      const servers = mapServers(res?.servers);
      const ogServers = mapServers(res?.ogServers);
      const multiServers = mapServers(res?.multiServers);

      const hlsServer = servers.find((s) => s.type === 'hls');
      const iframeServer = servers.find((s) => s.type === 'iframe');

      return {
        servers,
        ogServers,
        multiServers,
        hasMultiAudio: Boolean(res?.hasMultiAudio || multiServers.length > 0),
        hlsUrl: res?.hlsUrl || hlsServer?.url,
        iframeUrl: res?.iframeUrl || iframeServer?.url,
      };
    },

    getCategory: async (path: string, page = 1) => {
      const res: any = await fetchOmni('/category', { path, page });
      const items = Array.isArray(res?.results)
        ? res.results.map(normalizeDramaCard)
        : Array.isArray(res) ? res.map(normalizeDramaCard) : [];
      return {
        items,
        pagination: {
          currentPage: res?.page || page,
          hasNextPage: res?.hasNextPage ?? items.length >= 20,
          totalPages: res?.totalPages ?? 1,
        },
      };
    },

    getByCountry: async (country: string, page = 1) => {
      const res: any = await fetchOmni(`/country/${encodeURIComponent(country.toLowerCase())}`, { page });
      const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
      return {
        items,
        pagination: {
          currentPage: res?.page || page,
          hasNextPage: res?.hasNextPage ?? items.length >= 20,
          totalPages: res?.totalPages ?? 1,
        },
      };
    },

    getByGenre: async (genre: string, page = 1) => {
      const res: any = await fetchOmni(`/genre/${encodeURIComponent(genre.toLowerCase())}`, { page });
      const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
      return {
        items,
        pagination: {
          currentPage: res?.page || page,
          hasNextPage: res?.hasNextPage ?? items.length >= 20,
          totalPages: res?.totalPages ?? 1,
        },
      };
    },

    getFilter: async (type: string, page = 1) => {
      const res: any = await fetchOmni(`/filter/${encodeURIComponent(type.toLowerCase())}`, { page });
      const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
      return {
        items,
        pagination: {
          currentPage: res?.page || page,
          hasNextPage: res?.hasNextPage ?? items.length >= 20,
          totalPages: res?.totalPages ?? 1,
        },
      };
    },
  };

  movies = {
    getHome: async (): Promise<DramaHome> => {
      const res: any = await fetchOmni('/hdmovies/home');
      const sections: DramaSection[] = [];

      if (res && Array.isArray(res.sections)) {
        res.sections.forEach((section: any) => {
          if (section.title && Array.isArray(section.items) && section.items.length > 0) {
            sections.push({
              title: section.title,
              items: section.items.map(normalizeDramaCard)
            });
          }
        });
      }

      if (sections.length === 0) {
        sections.push({ title: 'Movies & Series', items: [] });
      }

      return { sections };
    },

    search: async (query: string, page = 1) => {
      const res: any = await fetchOmni('/hdmovies/search', { q: query, page });
      const items = Array.isArray(res?.results)
        ? res.results.map(normalizeDramaCard)
        : Array.isArray(res) ? res.map(normalizeDramaCard) : [];
      return {
        items,
        pagination: {
          currentPage: res?.currentPage || page,
          hasNextPage: res?.hasNextPage ?? false,
          totalPages: 1,
        },
      };
    },

    getDetail: async (id: string): Promise<MovieDetail | null> => {
      const res: any = await fetchOmni('/hdmovies/watch', { id });
      if (!res || !res.title) return null;

      // Only fetch seasons if the API confirmed the item is a TV series
      const typeStr: string = (res.type || '').toLowerCase();
      const isConfirmedSeries = typeStr === 'series';

      let seasons = res.seasons || [];
      if (isConfirmedSeries && res.imdbId && (!seasons || seasons.length === 0)) {
        const seasonRes: any = await fetchOmni('/hdmovies/seasons', { id });
        if (seasonRes && seasonRes.seasons) {
            seasons = seasonRes.seasons;
        }
      } else if (!isConfirmedSeries) {
        // Ensure movies never have seasons attached
        seasons = [];
      }

      // If seasons came back with no episodes or empty, it's really a standalone movie/feature
      const hasRealSeasons = Array.isArray(seasons) && seasons.length > 0 && seasons.some((s: any) => Array.isArray(s.episodes) && s.episodes.length > 0);

      // Extract IMDb ID safely from res or content
      const imdbId: string = res.imdbId || (JSON.stringify(res).match(/tt\d{7,8}/) || [])[0] || '';

      // Prepare verified standard embed servers
      const standardServers: { name: string; url: string; type?: string }[] = [];
      if (imdbId) {
        // Super Player is the native, dedicated player from HDMovie2 (plays Hindi dubs, cam prints, and unreleased web titles)
        standardServers.push({
          name: 'Super Player',
          url: `https://slast430did.com/play/${imdbId}`,
          type: 'iframe'
        });

        if (hasRealSeasons) {
          standardServers.push(
            { name: 'VidSrc', url: `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=1&episode=1`, type: 'embed' },
            { name: 'VidSrc Pro', url: `https://vidsrc.to/embed/tv/${imdbId}/1/1`, type: 'embed' },
            { name: 'VidSrc IN', url: `https://vidsrc.in/embed/tv/${imdbId}/1/1`, type: 'embed' },
            { name: 'AutoEmbed', url: `https://autoembed.co/tv/imdb/${imdbId}-1-1`, type: 'embed' },
            { name: 'VidSrc CC', url: `https://vidsrc.cc/v2/embed/tv/${imdbId}/1/1`, type: 'embed' }
          );
        } else {
          standardServers.push(
            { name: 'VidSrc', url: `https://vidsrc.me/embed/movie?imdb=${imdbId}`, type: 'embed' },
            { name: 'VidSrc Pro', url: `https://vidsrc.to/embed/movie/${imdbId}`, type: 'embed' },
            { name: 'VidSrc IN', url: `https://vidsrc.in/embed/movie/${imdbId}`, type: 'embed' },
            { name: 'AutoEmbed', url: `https://autoembed.co/movie/imdb/${imdbId}`, type: 'embed' },
            { name: 'VidSrc CC', url: `https://vidsrc.cc/v2/embed/movie/${imdbId}`, type: 'embed' }
          );
        }
      }

      // Filter out broken hosts (e.g. multiembed returns 404)
      const brokenKeywords = ['multiembed.mov'];
      const isBroken = (url: string) => !url || brokenKeywords.some(b => url.toLowerCase().includes(b));

      const cleanStreams: { name: string; url: string; type?: string }[] = [...standardServers];
      const seenUrls = new Set(standardServers.map(s => s.url));
      const seenNames = new Set(standardServers.map(s => s.name));

      if (Array.isArray(res.streams)) {
        for (const st of res.streams) {
          if (!st || !st.url) continue;
          // Upgrade legacy/expired gemma416okl.com domain to active slast430did.com
          let url = st.url.replace(/gemma416okl\.com/g, 'slast430did.com');
          if (isBroken(url)) continue;
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            let name = st.name || 'Server';
            if (name.toLowerCase() === 'server') name = 'Super Player';
            if (seenNames.has(name)) {
              let count = 2;
              while (seenNames.has(`${name} ${count}`)) count++;
              name = `${name} ${count}`;
            }
            seenNames.add(name);
            cleanStreams.push({ ...st, url, name });
          }
        }
      }

      // If seasons exist, populate their sources with working server URLs
      const processedSeasons = hasRealSeasons
        ? seasons.map((season: any) => {
            const seasonNum = season.seasonNumber || 1;
            const sources = imdbId ? [
              { name: 'Super Player', url: `https://slast430did.com/play/${imdbId}` },
              { name: 'VidSrc', url: `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${seasonNum}&episode=1` },
              { name: 'VidSrc Pro', url: `https://vidsrc.to/embed/tv/${imdbId}/${seasonNum}/1` },
              { name: 'VidSrc IN', url: `https://vidsrc.in/embed/tv/${imdbId}/${seasonNum}/1` },
              { name: 'AutoEmbed', url: `https://autoembed.co/tv/imdb/${imdbId}-${seasonNum}-1` },
              { name: 'VidSrc CC', url: `https://vidsrc.cc/v2/embed/tv/${imdbId}/${seasonNum}/1` }
            ] : (season.sources || []).filter((s: any) => !isBroken(s?.url));

            return {
              ...season,
              sources
            };
          })
        : [];

      return {
          ...res,
          type: res.type,
          imdbId,
          streams: cleanStreams,
          related: Array.isArray(res.related) ? res.related.map(normalizeDramaCard) : [],
          seasons: processedSeasons
      } as MovieDetail;
    },

    getCategory: async (category: string, page = 1) => {
      const res: any = await fetchOmni('/hdmovies/category', { category, page });
      const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
      return {
        items,
        pagination: {
          currentPage: res?.currentPage || page,
          hasNextPage: res?.hasNextPage ?? false,
          totalPages: 1,
        },
      };
    },

    getByGenre: async (genre: string, page = 1) => {
      const res: any = await fetchOmni('/hdmovies/genre', { genre, page });
      const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
      return {
        items,
        pagination: {
          currentPage: res?.currentPage || page,
          hasNextPage: res?.hasNextPage ?? false,
          totalPages: 1,
        },
      };
    },

    getByCountry: async (country: string, page = 1) => {
      const res: any = await fetchOmni('/hdmovies/country', { country, page });
      const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
      return {
        items,
        pagination: {
          currentPage: res?.currentPage || page,
          hasNextPage: res?.hasNextPage ?? false,
          totalPages: 1,
        },
      };
    },
  };
}

export const omni = new OmniClient();
