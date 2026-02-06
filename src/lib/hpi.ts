// src/lib/hpi.ts

/**
 * ==========================================
 * SHARED TYPES
 * ==========================================
 */

export interface Pagination {
  currentPage: number;
  hasNextPage: boolean;
  totalPages?: number;
  totalResults?: number;
}

export interface AnimeCard {
  id: string;
  title: string;
  image: string; 
  url?: string;
  type?: string;
  episode?: string;
  episodeCount?: string;
  duration?: string;
  slug?: string;
  
  // Extra metadata dependent on source
  audio?: string[]; 
  dubInfo?: {
    languages: string[];
    isHindi: boolean;
  };
}

/**
 * ==========================================
 * DESIDUB TYPES
 * ==========================================
 */

export interface DesiDubHome {
  sections: {
    title: string;
    items: AnimeCard[];
  }[];
}

export interface DesiDubEpisode {
  id: string;
  number: string;
  url: string;
  title: string;
  image: string;
}

export interface DesiDubDetails extends AnimeCard {
  nativeTitle: string;
  englishTitle: string;
  synonyms: string[];
  banner: string;
  synopsis: string;
  status: string;
  rating: string;
  premiered: string;
  season: string;
  aired: string;
  episodesCount: string;
  studios: string[];
  producers: string[];
  genres: string[];
  episodes: DesiDubEpisode[];
  recommendations: AnimeCard[];
  downloads: { resolution: string; url: string; host: string }[];
  
  // New Fields Scraped from Details Page
  views?: string; // e.g., "24M"
  likes?: string; // e.g., "135.5K"
  tags?: string[]; // e.g., ["English", "Hindi", "Japanese"]
}

export interface DesiDubStream {
  id: string;
  iframe: string;
  servers: { name: string; url: string; isEmbed: boolean }[];
  nextEpisode: string | null;
  prevEpisode: string | null;
  episodes: { id: string; number: string; title: string; url: string }[];
  targetUrl: string;
  serverUsed: string;
  stream?: {
    file?: string;
    error?: string;
    debugUrl?: string;
  } | null;

  // New Field Scraped from Watch Page
  nextEpDate?: string; // e.g., "2026-02-08 14:59:39"
}

export interface DesiDubQtip {
  name: string;
  description: string;
  rating: string;
  quality: string;
  type: string;
  japaneseTitle: string;
  status: string;
  aired: string;
  genres: string[];
}

/**
 * ==========================================
 * SATORU TYPES
 * ==========================================
 */

export interface SatoruSeason {
  id: string;
  title: string;
  poster: string;
  isActive: boolean;
}

export interface SatoruWatchInfo {
  id: string;
  internalId: string;
  iframeSrc: string;
  currentEpTitle: string;
  title: string;
  japaneseTitle: string;
  poster: string;
  description: string;
  seasons: SatoruSeason[];
  recommendations: AnimeCard[];
  stats: {
    type: string;
    duration: string;
    quality: string;
    rating: string;
  };
}

/**
 * ==========================================
 * UTILITIES
 * ==========================================
 */

const toSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/['":.]/g, '') 
    .replace(/[^a-z0-9]+/g, '-') 
    .replace(/^-+|-+$/g, ''); 
};

/**
 * ==========================================
 * HPI CLIENT
 * ==========================================
 */

class HPIClient {
  private baseUrl = typeof window === 'undefined' 
    ? (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') 
    : '';

  private async fetcher<T>(endpoint: string): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
    const result = await res.json();
    
    if (!result.success) {
      const error: any = new Error(result.error || `HPI Error: ${endpoint}`);
      error.status = res.status;
      throw error;
    }
    return result.data as T;
  }

  // --- SATORU ENDPOINTS ---
  satoru = {
    getWatch: (id: string) => 
      this.fetcher<SatoruWatchInfo>(`/api/satoru?action=watch&id=${id}`),

    getServers: (episodeId: string) => 
      this.fetcher<any[]>(`/api/satoru?action=servers&episodeId=${episodeId}`),

    getInfo: (id: string) => 
      this.fetcher<any>(`/api/satoru?action=info&id=${id}`),

    getHome: () => 
      this.fetcher<any>(`/api/satoru?action=home`),
      
    search: (query: string) => 
      this.fetcher<{ results: AnimeCard[] }>(`/api/satoru?action=search&q=${encodeURIComponent(query)}`),
  };

  // --- DESIDUB ENDPOINTS ---
  desidub = {
    getHome: () => 
      this.fetcher<DesiDubHome>(`/api/desidub?action=home`),

    search: (query: string, page = 1) => 
      this.fetcher<{ title: string; items: AnimeCard[]; pagination: Pagination }>(
        `/api/desidub?action=search&q=${encodeURIComponent(query)}&page=${page}`
      ),

    getSuggestions: (query: string) => 
      this.fetcher<AnimeCard[]>(`/api/desidub?action=suggestions&q=${encodeURIComponent(query)}`),

    filter: (params: any) => {
      const qs = new URLSearchParams(params).toString();
      return this.fetcher<{ items: AnimeCard[]; pagination: Pagination }>(`/api/desidub?action=filter&${qs}`);
    },

    getDetails: (id: string) => 
      this.fetcher<DesiDubDetails>(`/api/desidub?action=details&id=${id}`),

    getStream: (episodeId: string) => 
      this.fetcher<DesiDubStream>(`/api/desidub?action=stream&id=${episodeId}`),

    getQtip: (dataId: string) => 
      this.fetcher<DesiDubQtip>(`/api/desidub?action=qtip&id=${dataId}`),
  };

  // --- BRIDGE: CROSS-SOURCE LOGIC ---
  bridge = {
    getSmartDetails: async (desidubId: string) => {
      const details = await this.desidub.getDetails(desidubId);
      if (!details) throw new Error("DesiDub not found");

      let recommendations: AnimeCard[] = [];
      let satoruId: string | null = null;

      const titleToSlug = details.englishTitle || details.title;
      const candidateId = toSlug(titleToSlug);
      
      try {
        console.log(`[Bridge] Trying Fast Path: ${candidateId}`);
        const satoruData = await this.satoru.getWatch(candidateId);
        recommendations = satoruData.recommendations || [];
        satoruId = candidateId;
      } catch (e) {
        try {
          const search = await this.satoru.search(details.title);
          const match = search.results?.[0];
          if (match) {
            console.log(`[Bridge] Search Match Found: ${match.id}`);
            const satoruData = await this.satoru.getWatch(match.id);
            recommendations = satoruData.recommendations || [];
            satoruId = match.id;
          }
        } catch (searchErr) {
          console.warn("[Bridge] All Satoru lookups failed.");
        }
      }

      return {
        ...details,
        satoruId,
        recommendations
      };
    }
  };
}

export const hpi = new HPIClient();