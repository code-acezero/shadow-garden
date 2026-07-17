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

async function fetchDonghuaApi<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
  const queryParts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const targetUrl = `${DONGHUA_API_BASE}${endpoint}${queryString}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(targetUrl, { signal: controller.signal, cache: 'no-store' });
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
    if (res?.topDay?.length > 0) {
      sections.push({ title: 'Popular', items: res.topDay });
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
  }
};
