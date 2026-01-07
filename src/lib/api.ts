import { createClient } from '@supabase/supabase-js';

// 1. API CONSTANTS
const BASE_URL = 'https://shadow-garden-wqkq.vercel.app/anime/hianime';
const BASE_URL_V2 = 'https://hianime-api-mu.vercel.app/api/v2/hianime';

// --- SUPABASE CONFIG ---
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// ==========================================
//  TYPES & INTERFACES
// ==========================================

export interface AppUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
}

export interface ConsumetAnime {
  id: string;
  title: string;
  url: string;
  image: string;
  releaseDate?: string;
  subOrDub?: 'sub' | 'dub' | 'both';
  description?: string;
  rank?: number;
  type?: string;
  duration?: string;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  poster: string;
  jname: string;
  moreInfo: string[];
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
  status: string;
  totalEpisodes: number;
  episodes: ConsumetEpisode[];
  recommendations?: ConsumetAnime[];
  relatedAnime?: ConsumetAnime[];
  japaneseTitle?: string;
}

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

export interface WatchlistItem {
  anime_id: string;
  status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  progress: number;
  updated_at: string;
}

// ==========================================
//  API CLASSES
// ==========================================

export class AnimeAPI {
  
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

  
static async getSchedule(date: string): Promise<{ scheduledAnimes: ConsumetAnime[] } | null> {
  return this.request(BASE_URL, '/schedule', { date });
}


  // --- DISCOVERY ---
  static async getSpotlight(): Promise<{ results: ConsumetAnime[] } | null> {
    return this.request(BASE_URL, '/spotlight');
  }

  static async getAnimeInfo(id: string): Promise<ConsumetAnimeInfo | null> {
    return this.request(BASE_URL, '/info', { id });
  }

  static async getTopAiring(page = 1): Promise<{ results: ConsumetAnime[] } | null> {
    return this.request(BASE_URL, '/top-airing', { page });
  }

  static async getMostPopular(page = 1): Promise<{ results: ConsumetAnime[] } | null> {
    return this.request(BASE_URL, '/most-popular', { page });
  }

  static async getRecentlyUpdated(page = 1): Promise<{ results: ConsumetAnime[] } | null> {
    return this.request(BASE_URL, '/recently-updated', { page });
  }

  // --- V2 SEARCH ---
  static async getSearchSuggestionsV2(query: string): Promise<SearchSuggestion[]> {
    const res = await this.request(BASE_URL_V2, '/search/suggestion', { q: query });
    return res?.data?.suggestions || [];
  }

  static async searchAnimeV2(query: string, page = 1): Promise<V2SearchResult | null> {
    const res = await this.request(BASE_URL_V2, '/search', { q: query, page });
    return res?.data || null;
  }

  // --- STREAMING ---
  static async getEpisodeServers(animeEpisodeId: string): Promise<{ data: ServerData } | null> {
    return this.request(BASE_URL_V2, '/episode/servers', { animeEpisodeId });
  }

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
}

export class WatchlistAPI {
  static async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    if (supabase && userId !== 'guest') {
      const { data } = await supabase.from('watchlist').select('*').eq('user_id', userId);
      return data || [];
    }
    // Local Fallback
    if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`watchlist_${userId}`);
        return local ? JSON.parse(local) : [];
    }
    return [];
  }

  static async addToWatchlist(userId: string, animeId: string, status: WatchlistItem['status'], progress: number = 0): Promise<boolean> {
    const item = { anime_id: animeId, status, progress, updated_at: new Date().toISOString() };
    
    if (supabase && userId !== 'guest') {
      const { error } = await supabase.from('watchlist').upsert({ user_id: userId, ...item }, { onConflict: 'user_id, anime_id' });
      return !error;
    }
    
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

export class UserAPI {
  static async getCurrentUser(): Promise<AppUser | null> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata
        };
      }
    }
    // Mock guest user or check local storage if you have a custom auth system
    return null;
  }
}