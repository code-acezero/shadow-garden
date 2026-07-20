import { ApiManager } from './api';

const getDonghuaApiBase = () => `${ApiManager.getBaseUrl()}/donghua`;

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
  url?: string;
  iframe?: string;
  nextEpDate?: string | null;
  subtitles?: any[];
  intro?: { start: number; end: number } | null;
  outro?: { start: number; end: number } | null;
  referer?: string | null;
}

async function fetchDonghuaApi<T = any>(endpoint: string, params: Record<string, any> = {}, retryCount = 0): Promise<T | null> {
  const queryParts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const targetUrl = `${getDonghuaApiBase()}${endpoint}${queryString}`;
  const proxyUrl = typeof window !== 'undefined'
    ? `/api/proxy?url=${encodeURIComponent(targetUrl)}`
    : targetUrl;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(proxyUrl, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
        if (retryCount < ApiManager.getAllUrls().length - 1) {
            ApiManager.rotateUrl();
            return fetchDonghuaApi(endpoint, params, retryCount + 1);
        }
        return null;
    }

    const json = await response.json();

    if (json && typeof json === 'object') {
      if ('ok' in json) return json.ok ? (json.data ?? json) : null;
      if ('data' in json) return json.data as T;
    }
    return json as T;
  } catch (innerError: any) {
    if (innerError?.name === 'AbortError' || (innerError?.message && innerError.message.includes('fetch'))) {
        if (retryCount < ApiManager.getAllUrls().length - 1) {
            ApiManager.rotateUrl();
            return fetchDonghuaApi(endpoint, params, retryCount + 1);
        }
    }
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

  async filter(params: any): Promise<DonghuaAnimeCard[]> {
    const res = await fetchDonghuaApi<any>('/filter', params);
    const data = res?.results || res || [];
    return Array.isArray(data) ? data : [];
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

    let finalUrl = res?.iframe || res?.url || '';
    let subtitles = res?.subtitles || [];

    if (finalUrl && finalUrl.includes('donghuaplanet.com')) {
      try {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(finalUrl)}&referer=${encodeURIComponent('https://donghuaworld.com/')}`;
        const htmlRes = await fetch(proxyUrl);
        const html = await htmlRes.text();

        const sourcesMatch = html.match(/sources:\s*(\[.*?\])/);
        const tracksMatch = html.match(/const\s+tracks\s*=\s*(\[[\s\S]*?\]);/);

        if (sourcesMatch) {
          const sources = JSON.parse(sourcesMatch[1]);
          const autoStream = sources.find((s: any) => s.label === 'Auto' || s.file?.includes('.m3u8')) || sources[0];
          if (autoStream && autoStream.file) {
            finalUrl = `/api/proxy?url=${encodeURIComponent(autoStream.file)}&referer=${encodeURIComponent('https://donghuaworld.com/')}`;
          }
        }

        if (tracksMatch) {
          const tracks = JSON.parse(tracksMatch[1]);
          subtitles = tracks.filter((t: any) => t.label).map((t: any) => ({ 
            lang: t.label, 
            url: `/api/proxy?url=${encodeURIComponent(t.file)}&referer=${encodeURIComponent('https://donghuaworld.com/')}` 
          }));
        }
      } catch (e) {
        console.error('Failed to extract DonghuaPlanet stream:', e);
      }
    }

    return {
      servers: rawServers,
      url: finalUrl,
      iframe: finalUrl,
      nextEpDate: res?.nextEpDate || null,
      subtitles: subtitles,
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