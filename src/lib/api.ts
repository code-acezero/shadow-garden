import { createClient } from '@supabase/supabase-js';

// Base URL for your specific Consumet HiAnime instance
const BASE_URL = 'https://shadow-garden-wqkq.vercel.app/anime/hianime';

// --- CONSUMET HIANIME TYPES ---

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

export interface ConsumetAnimeInfo extends ConsumetAnime {
  genres: string[];
  type: string;
  status: string;
  otherName?: string;
  totalEpisodes: number;
  episodes: Array<{
    id: string;
    number: number;
    title: string;
    url: string;
  }>;
}

export interface ConsumetStreamingLinks {
  headers: {
    Referer: string;
    'User-Agent': string;
  };
  sources: Array<{
    url: string;
    quality: string;
    isM3U8: boolean;
  }>;
  download: string;
}

// --- APP TYPES ---

export interface WatchlistItem {
  anime_id: string;
  status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  progress: number;
  updated_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  user_metadata: { username: string };
}

// --- SUPABASE CONFIG ---

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- API IMPLEMENTATION ---

export class AnimeAPI {
  private static async request(endpoint: string, params: Record<string, any> = {}) {
    try {
      const url = new URL(`${BASE_URL}${endpoint}`);
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Network error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return null;
    }
  }

  // Spotlight (Hero Slider)
  static async getSpotlight(): Promise<{ spotlightAnimes: ConsumetAnime[] }> {
    return this.request('/spotlight');
  }

  // Search (Path: /{query})
  static async searchAnime(query: string, page = 1): Promise<ConsumetSearchResult | null> {
    return this.request(`/${encodeURIComponent(query)}`, { page });
  }

  // Info (Query: ?id={id})
  static async getAnimeInfo(id: string): Promise<ConsumetAnimeInfo | null> {
    return this.request('/info', { id });
  }

  // Streaming (Path: /watch/{episodeId})
  static async getEpisodeSources(
    episodeId: string, 
    server = 'vidstreaming', 
    category = 'sub'
  ): Promise<ConsumetStreamingLinks | null> {
    return this.request(`/watch/${episodeId}`, { server, category });
  }

  // Homepage Collections
  static async getTopAiring(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/top-airing', { page });
  }

  static async getMostPopular(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/most-popular', { page });
  }

  static async getRecentlyUpdated(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/recently-updated', { page });
  }

  // Schedule (date format: YYYY-MM-DD)
  static async getSchedule(date: string): Promise<{ scheduledAnimes: ConsumetAnime[] }> {
    return this.request('/schedule', { date });
  }
}

// --- WATCHLIST & USER PERSISTENCE ---

export class WatchlistAPI {
  static async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    if (supabase) {
      const { data } = await supabase.from('watchlist').select('*').eq('user_id', userId);
      return data || [];
    }
    const local = localStorage.getItem(`watchlist_${userId}`);
    return local ? JSON.parse(local) : [];
  }

  static async addToWatchlist(userId: string, animeId: string, status: WatchlistItem['status']): Promise<boolean> {
    const item = { anime_id: animeId, status, progress: 0, updated_at: new Date().toISOString() };
    if (supabase) {
      const { error } = await supabase.from('watchlist').upsert({ user_id: userId, ...item });
      return !error;
    }
    const list = await this.getUserWatchlist(userId);
    const updated = [...list.filter(i => i.anime_id !== animeId), item];
    localStorage.setItem(`watchlist_${userId}`, JSON.stringify(updated));
    return true;
  }
}

export class UserAPI {
  static async getCurrentUser(): Promise<AppUser | null> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      return user as AppUser | null;
    }
    const user = localStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  }
}