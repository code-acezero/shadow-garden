import { createClient } from '@supabase/supabase-js';

// 1. ORIGINAL API (For Info, Search, Spotlight)
const BASE_URL = 'https://shadow-garden-wqkq.vercel.app/anime/hianime';

// 2. NEW V2 STREAMING API (For Servers, Sources, Schedules)
const BASE_URL_V2 = 'https://hianime-api-mu.vercel.app/api/v2/hianime';

// --- TYPES ---

export interface ConsumetAnime {
  id: string;
  title: string;
  url: string;
  image: string;
  releaseDate?: string;
  subOrDub?: 'sub' | 'dub' | 'both';
  description?: string;
  rank?: number;
}

export interface ConsumetSearchResult {
  currentPage: number;
  hasNextPage: boolean;
  totalPages?: number;
  results: ConsumetAnime[];
}

export interface ConsumetEpisode {
  id: string;
  number: number;
  title: string;
  url: string;
  isFiller?: boolean;
  isSubbed?: boolean;
  isDubbed?: boolean;
}

export interface ConsumetAnimeInfo extends ConsumetAnime {
  genres: string[];
  type: string;
  status: string;
  otherName?: string;
  totalEpisodes: number;
  episodes: ConsumetEpisode[];
  recommendations?: ConsumetAnime[]; // Added for recommendations
  relatedAnime?: ConsumetAnime[];    // Added for related seasons
  japaneseTitle?: string;
}

// --- NEW V2 TYPES ---

export interface EpisodeServer {
  serverId: number;
  serverName: string;
}

export interface ServerData {
  episodeId: string;
  episodeNo: number;
  sub: EpisodeServer[];
  dub: EpisodeServer[];
  raw: EpisodeServer[];
}

export interface StreamSource {
  url: string;
  isM3U8: boolean;
  quality?: string;
}

export interface V2SourceResponse {
  headers: {
    Referer: string;
    'User-Agent': string;
  };
  sources: StreamSource[];
  subtitles: Array<{ lang: string; url: string }>;
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
}

export interface NextEpSchedule {
  airingISOTimestamp: string | null;
  airingTimestamp: number | null;
  secondsUntilAiring: number | null;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  poster: string;
  jname: string;
  moreInfo: string[]; // e.g. ["Jan 21, 2022", "Movie", "17m"]
}

export interface V2SearchResult {
  animes: Array<{
    id: string;
    name: string;
    poster: string;
    duration: string;
    type: string;
    rating: string;
    episodes: { sub: number; dub: number };
  }>;
  mostPopularAnimes: any[];
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
}

// --- SUPABASE CONFIG ---

// Use process.env for Next.js compatibility (Vite env vars might not work if you switched to Next.js)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- API IMPLEMENTATION ---

export class AnimeAPI {
  
  // Generic Request Handler
  private static async request(baseUrl: string, endpoint: string, params: Record<string, any> = {}) {
    try {
      const url = new URL(`${baseUrl}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Network error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return null;
    }
  }

  // ==========================================
  //  SECTION 1: INFO & DISCOVERY (OLD API)
  // ==========================================

  static async getSpotlight(): Promise<{ results: ConsumetAnime[] } | null> {
    // Note: Your spotlight result key is 'results' based on previous logs, adjusted type if needed
    return this.request(BASE_URL, '/spotlight');
  }

  static async searchAnime(query: string, page = 1): Promise<ConsumetSearchResult | null> {
    return this.request(BASE_URL, `/${encodeURIComponent(query)}`, { page });
  }

  static async getAnimeInfo(id: string): Promise<ConsumetAnimeInfo | null> {
    return this.request(BASE_URL, '/info', { id });
  }

  static async getTopAiring(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request(BASE_URL, '/top-airing', { page });
  }

  static async getMostPopular(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request(BASE_URL, '/most-popular', { page });
  }

  static async getRecentlyUpdated(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request(BASE_URL, '/recently-updated', { page });
  }

  // ==========================================
  //  SECTION 2: STREAMING V2 (NEW API)
  // ==========================================

  // 1. Get Servers for an Episode
  // Endpoint: /api/v2/hianime/episode/servers?animeEpisodeId={id}
  static async getEpisodeServers(animeEpisodeId: string): Promise<{ data: ServerData } | null> {
    return this.request(BASE_URL_V2, '/episode/servers', { animeEpisodeId });
  }

  // 2. Get Streaming Links (Sources)
  // Endpoint: /api/v2/hianime/episode/sources?animeEpisodeId={id}&server={server}&category={cat}
  static async getEpisodeSourcesV2(
    animeEpisodeId: string, 
    server: string = 'hd-1', 
    category: 'sub' | 'dub' | 'raw' = 'sub'
  ): Promise<{ data: V2SourceResponse } | null> {
    return this.request(BASE_URL_V2, '/episode/sources', { 
      animeEpisodeId, 
      server, 
      category 
    });
  }

  // 3. Get Next Episode Schedule
  // Endpoint: /api/v2/hianime/anime/{animeId}/next-episode-schedule
  static async getNextEpisodeSchedule(animeId: string): Promise<{ data: NextEpSchedule } | null> {
    return this.request(BASE_URL_V2, `/anime/${animeId}/next-episode-schedule`);
  }
  
// NEW: V2 Search Suggestions
  static async getSearchSuggestionsV2(query: string): Promise<SearchSuggestion[]> {
    const res = await this.request(BASE_URL_V2, '/search/suggestion', { q: query });
    return res?.data?.suggestions || [];
  }

  // NEW: V2 Advanced Search
  static async searchAnimeV2(query: string, page = 1): Promise<V2SearchResult | null> {
    const res = await this.request(BASE_URL_V2, '/search', { q: query, page });
    return res?.data || null;
  }
}

// --- WATCHLIST & USER PERSISTENCE ---

export interface WatchlistItem {
  anime_id: string;
  status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  progress: number; // Episode number
  updated_at: string;
}

export class WatchlistAPI {
  static async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    if (supabase) {
      const { data } = await supabase.from('watchlist').select('*').eq('user_id', userId);
      return data || [];
    }
    // Fallback to local storage
    if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`watchlist_${userId}`);
        return local ? JSON.parse(local) : [];
    }
    return [];
  }

  static async addToWatchlist(userId: string, animeId: string, status: WatchlistItem['status'], progress: number = 0): Promise<boolean> {
    const item = { anime_id: animeId, status, progress, updated_at: new Date().toISOString() };
    
    if (supabase) {
      // Upsert: Insert or Update if exists
      const { error } = await supabase.from('watchlist').upsert({ user_id: userId, ...item }, { onConflict: 'user_id, anime_id' });
      return !error;
    }
    
    // Local Storage Fallback
    if (typeof window !== 'undefined') {
        const list = await this.getUserWatchlist(userId);
        const updated = [...list.filter(i => i.anime_id !== animeId), item];
        localStorage.setItem(`watchlist_${userId}`, JSON.stringify(updated));
    }
    return true;
  }
  
  static async updateProgress(userId: string, animeId: string, episodeNumber: number) {
      return this.addToWatchlist(userId, animeId, 'watching', episodeNumber);
  }
}