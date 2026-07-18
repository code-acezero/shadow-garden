import { BASE_URL } from './api';

const DONGHUA_API_BASE = `${BASE_URL}/donghua`;

export interface DonghuaAnimeCard {
  id: string;
  slug: string;
  title: string;
  image: string;
  href: string;
  type?: string;
  episodes: {
    sub: number;
    dub: number;
    total: number;
  };
}

export interface DonghuaEpisode {
  id: string;
  number: string;
  title?: string;
  href: string;
  hasSub: boolean;
  hasDub: boolean;
}

export interface DonghuaAnimeDetail {
  id: string;
  slug: string;
  title: string;
  alternativeTitles: string[];
  image: string;
  synopsis?: string;
  genres: string[];
  rating?: string;
  type?: string;
  studios: string[];
  producers: string[];
  watchUrl: string;
}

export interface DonghuaServer {
  name: string;
  url: string;
}

export interface DonghuaStreamResult {
  servers: DonghuaServer[];
  iframe?: string;
  nextEpDate?: string | null;
  subtitles?: any[];
  intro?: { start: number; end: number } | null;
  outro?: { start: number; end: number } | null;
  referer?: string | null;
}

async function fetchDonghuaApi<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
  const queryParts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const targetUrl = `${DONGHUA_API_BASE}${endpoint}${queryString}`;
  const proxyUrl = typeof window !== 'undefined' ? `/api/proxy?url=${encodeURIComponent(targetUrl)}` : targetUrl;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(proxyUrl, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const json = await response.json();
    if (json?.success === false) return null;
    return json.data ?? json; // Return data if exists, else the root json
  } catch {
    return null;
  }
}

export const dpi = {
  async getHome(page: number = 1): Promise<{ sections: { title: string; items: DonghuaAnimeCard[] }[] }> {
    const res = await fetchDonghuaApi<any>('/home', { page });
    const sections: { title: string; items: DonghuaAnimeCard[] }[] = [];
    
    if (res?.spotlight?.length > 0) {
      sections.push({ title: 'Spotlight', items: res.spotlight });
    }
    if (res?.latestEpisodes?.length > 0) {
      sections.push({ title: 'Latest Episodes', items: res.latestEpisodes });
    }
    if (res?.newRelease?.length > 0) {
      sections.push({ title: 'New Releases', items: res.newRelease });
    }
    if (res?.newAdded?.length > 0) {
      sections.push({ title: 'Recently Added', items: res.newAdded });
    }
    if (res?.topDay?.length > 0) {
      sections.push({ title: 'Popular Today', items: res.topDay });
    }
    
    // Fallback if everything is empty
    if (sections.length === 0) {
       const latest = Array.isArray(res) ? res : [];
       sections.push({ title: 'Latest Episodes', items: latest });
    }

    return { sections };
  },

  async search(query: string, page: number = 1): Promise<DonghuaAnimeCard[]> {
    const res = await fetchDonghuaApi<DonghuaAnimeCard[]>(`/search/${encodeURIComponent(query)}`, { page });
    return res || [];
  },

  async getInfo(id: string): Promise<{ detail: DonghuaAnimeDetail; episodes: { animeId: string; slug: string; episodes: DonghuaEpisode[] } } | null> {
    const res = await fetchDonghuaApi<{ detail: DonghuaAnimeDetail; episodes: { animeId: string; slug: string; episodes: DonghuaEpisode[] } }>(`/info/${encodeURIComponent(id)}`);
    return res;
  },

  async getServers(id: string): Promise<DonghuaServer[]> {
    const res = await fetchDonghuaApi<DonghuaServer[]>('/servers', { id });
    return res || [];
  },

  async getStream(episodeId: string): Promise<DonghuaStreamResult> {
    const res = await fetchDonghuaApi<any>('/watch', { id: episodeId });
    const rawServers: DonghuaServer[] = Array.isArray(res?.servers)
      ? res.servers
      : Array.isArray(res?.sources)
        ? (res.sources as any[]).map((s: any, i: number) => ({ name: s.quality || `Server ${i + 1}`, url: s.url || '' }))
        : res?.url ? [{ name: 'Default', url: res.url }] : [];
    return {
      servers: rawServers,
      iframe: res?.iframe || res?.url || '',
      nextEpDate: res?.nextEpDate || null,
      subtitles: res?.subtitles || [],
      intro: res?.intro || null,
      outro: res?.outro || null,
      referer: res?.referer || null
    };
  },

  bridge: {
    getSmartDetails: async (id: string) => {
      const info = await fetchDonghuaApi<any>(`/info/${encodeURIComponent(id)}`);
      if (!info) throw new Error('Anime not found');
      const detail = info?.detail || info;
      const episodesData: any[] = info?.episodes?.episodes || info?.episodes || [];
      return {
        id: (detail?.id || id) as string,
        title: (detail?.title || 'Unknown Title') as string,
        nativeTitle: ((detail?.alternativeTitles || [])[0] || '') as string,
        image: (detail?.image || '') as string,
        banner: (detail?.image || '') as string,
        type: (detail?.type || 'TV') as string,
        synopsis: (detail?.synopsis || '') as string,
        status: 'Ongoing' as string,
        rating: (detail?.rating || 'PG-13') as string,
        premiered: '' as string,
        aired: '' as string,
        episodesCount: String(episodesData.length || 0),
        studios: (detail?.studios || []) as string[],
        producers: (detail?.producers || []) as string[],
        genres: (detail?.genres || []) as string[],
        synonyms: (detail?.alternativeTitles || []) as string[],
        episodes: episodesData.map((e: any) => ({
          id: (e.id || e.href || String(e.number)) as string,
          number: String(e.number || '1'),
          url: (e.href || '') as string,
          title: (e.title || `Episode ${e.number}`) as string,
          image: (detail?.image || '') as string
        })),
        recommendations: [] as any[],
        downloads: [] as any[],
        satoruId: null
      };
    }
  }
};