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
  };
}

export const omni = new OmniClient();
