// src/lib/omni.ts
// Client for the omni-api hindidrama scraper (hindidrama.net)
// Mirrors the shape of hpi.ts and dpi.ts for consistency.

import { ApiManager } from './api';

const getOmniBase = () => `${ApiManager.getBaseUrl()}/hindidrama`;
const getMoviesBase = () => `${ApiManager.getBaseUrl()}/hdmovies`;

async function fetchOmni<T = any>(
  endpoint: string,
  params: Record<string, any> = {},
  retryCount = 0
): Promise<T | null> {
  const queryParts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const base = endpoint.startsWith('http') ? '' : (endpoint.includes('hdmovies') ? getMoviesBase() : getOmniBase());
  let targetUrl = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.replace('/hdmovies', '')}${queryString}`;
  
  const proxyUrl =
    typeof window !== 'undefined'
      ? `/api/proxy?url=${encodeURIComponent(targetUrl)}`
      : targetUrl;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const response = await fetch(proxyUrl, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (retryCount < ApiManager.getAllUrls().length - 1) {
        ApiManager.rotateUrl();
        return fetchOmni(endpoint, params, retryCount + 1);
      }
      return null;
    }

    const json = await response.json();
    // Unwrap proxy wrapper if present
    if (json && typeof json === 'object') {
      if ('ok' in json) return json.ok ? (json.data ?? json) : null;
      if ('data' in json && !('results' in json) && !('servers' in json)) return json.data as T;
    }
    return json as T;
  } catch (err: any) {
    if (
      err?.name === 'AbortError' ||
      (err?.message && err.message.includes('fetch'))
    ) {
      if (retryCount < ApiManager.getAllUrls().length - 1) {
        ApiManager.rotateUrl();
        return fetchOmni(endpoint, params, retryCount + 1);
      }
    }
    return null;
  }
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface DramaCard {
  id: string;           // slug used in URL
  title: string;
  image: string;
  type?: string;
  episode?: string;
  year?: string;
  country?: string;
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
}

export interface DramaDetail {
  id: string;
  slug: string;
  title: string;
  image: string;
  banner?: string;
  synopsis: string;
  status: string;
  type: string;
  rating?: string;
  year?: string;
  country?: string;
  genres: string[];
  episodes: DramaEpisode[];
  recommendations: DramaCard[];
  embedUrl?: string;  // base embed URL for stream fetching
}

export interface DramaServer {
  name: string;
  url: string;
  type: 'hls' | 'iframe';
}

export interface DramaStream {
  servers: DramaServer[];
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
    id: item?.slug || item?.id || '',
    title: item?.title || item?.name || 'Unknown',
    image: item?.image || item?.poster || item?.thumbnail || '',
    type: item?.type || item?.country || '',
    episode: item?.episode !== undefined ? String(item.episode) : undefined,
    year: item?.year ? String(item.year) : undefined,
    country: item?.country || '',
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
              items: section.items.map(normalizeDramaCard)
            });
          }
        });
      }

      // Final fallback
      if (sections.length === 0) {
        sections.push({ title: 'Drama', items: [] });
      }

      return { sections };
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

    getDetail: async (slug: string): Promise<DramaDetail | null> => {
      const res: any = await fetchOmni(`/info/${encodeURIComponent(slug)}`);
      if (!res) return null;

      const episodes: DramaEpisode[] = (res.episodes || []).map((e: any, i: number) => ({
        id: e.id || e.slug || String(i + 1),
        number: e.number || i + 1,
        title: e.title || `Episode ${e.number || i + 1}`,
        url: e.url || e.href || e.embedUrl || '',
        embedUrl: e.embedUrl || e.url || e.href || '',
        image: e.image || res.image || '',
      }));

      const recommendations: DramaCard[] = (res.recommendations || res.related || []).map(normalizeDramaCard);

      let finalTitle = res.title || res.name || 'Unknown Drama';
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
        banner: res.banner || res.cover || res.image || '',
        synopsis: res.description || res.synopsis || res.plot || '',
        status: finalStatus,
        type: res.type || res.country || 'Drama',
        rating: res.rating ? String(res.rating) : undefined,
        year: res.year ? String(res.year) : undefined,
        country: res.country || '',
        genres: Array.isArray(res.genres) ? res.genres : [],
        episodes,
        recommendations,
        embedUrl: res.embedUrl || res.embed_url || undefined,
      };
    },

    getStream: async (embedUrl: string): Promise<DramaStream> => {
      const res: any = await fetchOmni(
        '/servers',
        { url: embedUrl }
      );

      const servers: DramaServer[] = Array.isArray(res?.servers)
        ? res.servers.map((s: any) => ({
            name: s.name || 'Server',
            url: s.url || '',
            type: s.type === 'hls' ? 'hls' : 'iframe',
          }))
        : [];

      const hlsServer = servers.find((s) => s.type === 'hls');
      const iframeServer = servers.find((s) => s.type === 'iframe');

      return {
        servers,
        hlsUrl: hlsServer?.url,
        iframeUrl: iframeServer?.url,
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

      // Filter out broken/expired hosts (e.g. gemma416okl has expired SSL cert, multiembed returns 404)
      const brokenKeywords = ['gemma416okl.com', 'multiembed.mov'];
      const isBroken = (url: string) => !url || brokenKeywords.some(b => url.toLowerCase().includes(b));

      const cleanStreams: { name: string; url: string; type?: string }[] = [...standardServers];
      const seenUrls = new Set(standardServers.map(s => s.url));
      const seenNames = new Set(standardServers.map(s => s.name));

      if (Array.isArray(res.streams)) {
        for (const st of res.streams) {
          if (st && st.url && !isBroken(st.url) && !seenUrls.has(st.url)) {
            seenUrls.add(st.url);
            let name = st.name || 'Server';
            if (seenNames.has(name)) {
              let count = 2;
              while (seenNames.has(`${name} ${count}`)) count++;
              name = `${name} ${count}`;
            }
            seenNames.add(name);
            cleanStreams.push({ ...st, name });
          }
        }
      }

      // If seasons exist, populate their sources with working server URLs
      const processedSeasons = hasRealSeasons
        ? seasons.map((season: any) => {
            const seasonNum = season.seasonNumber || 1;
            const sources = imdbId ? [
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
