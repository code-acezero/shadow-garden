// src/lib/omni.ts
// Client for the omni-api hindidrama scraper (hindidrama.net)
// Mirrors the shape of hpi.ts and dpi.ts for consistency.

import { ApiManager } from './api';

const getOmniBase = () => `${ApiManager.getBaseUrl()}/hindidrama`;

async function fetchOmni<T = any>(
  endpoint: string,
  params: Record<string, any> = {},
  retryCount = 0
): Promise<T | null> {
  const queryParts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const targetUrl = `${getOmniBase()}${endpoint}${queryString}`;
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
}

export interface DramaHome {
  sections: DramaSection[];
}

export interface DramaEpisode {
  id: string;
  number: number;
  title: string;
  url: string;
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

      const push = (title: string, items: any[]) => {
        if (Array.isArray(items) && items.length > 0) {
          sections.push({ title, items: items.map(normalizeDramaCard) });
        }
      };

      if (res) {
        push('Trending', res.trending || []);
        push('Recently Added', res.recent || res.latestEpisodes || res.recentlyAdded || []);
        push('Korean Drama', res.korean || []);
        push('Chinese Drama', res.chinese || []);
        push('Japanese Drama', res.japanese || []);
        push('Hindi Dubbed', res.hindi || []);
        push('Movies', res.movies || []);

        // Fallback: if nothing mapped, try to use raw array
        if (sections.length === 0 && Array.isArray(res)) {
          sections.push({ title: 'Recently Added', items: res.map(normalizeDramaCard) });
        }
      }

      // Final fallback
      if (sections.length === 0) {
        sections.push({ title: 'Drama', items: [] });
      }

      return { sections };
    },

    search: async (query: string, page = 1) => {
      const res: any = await fetchOmni('/search', { q: query, page });
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
      const res: any = await fetchOmni(`/detail/${encodeURIComponent(slug)}`);
      if (!res) return null;

      const episodes: DramaEpisode[] = (res.episodes || []).map((e: any, i: number) => ({
        id: e.id || e.slug || String(i + 1),
        number: e.number || i + 1,
        title: e.title || `Episode ${e.number || i + 1}`,
        url: e.url || e.href || '',
        image: e.image || res.image || '',
      }));

      const recommendations: DramaCard[] = (res.recommendations || res.related || []).map(normalizeDramaCard);

      return {
        id: slug,
        slug,
        title: res.title || res.name || 'Unknown Drama',
        image: res.image || res.poster || res.thumbnail || '',
        banner: res.banner || res.cover || res.image || '',
        synopsis: res.description || res.synopsis || res.plot || '',
        status: res.status || 'Unknown',
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
        '/stream',
        { embedUrl }
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
  };
}

export const omni = new OmniClient();
