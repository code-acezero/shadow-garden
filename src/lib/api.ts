import { createClient } from '@supabase/supabase-js';

// ==========================================
//  1. CONFIGURATION
// ==========================================

const BASE_URL_V1 = 'https://shadow-garden-wqkq.vercel.app/anime/hianime';
const BASE_URL_V2 = 'https://hianime-api-mu.vercel.app/api/v2/hianime';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// ==========================================
//  2. SHARED / V1 TYPES
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
  // Optional props for UI flexibility
  banner?: string; 
  japaneseTitle?: string;
  sub?: number;
  dub?: number;
  episodes?: number;
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

export interface ConsumetAnimeInfo extends Omit<ConsumetAnime, 'episodes'> {
  genres: string[];
  status: string;
  totalEpisodes: number;
  episodes: ConsumetEpisode[];
  recommendations?: ConsumetAnime[];
  relatedAnime?: ConsumetAnime[];
  japaneseTitle?: string;
}

export interface WatchlistItem {
  anime_id: string;
  status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  progress: number;
  updated_at: string;
}

// ==========================================
//  3. V1 API CLASS (Legacy/Home Support)
// ==========================================

export class AnimeAPI {
  private static async request(endpoint: string, params: Record<string, any> = {}) {
    try {
      const url = new URL(`${BASE_URL_V1}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`V1 Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`V1 Fetch failed [${endpoint}]:`, error);
      return null;
    }
  }

  static async getSpotlight(): Promise<{ results: ConsumetAnime[] } | null> {
    return this.request('/spotlight');
  }

  static async getAnimeInfo(id: string): Promise<ConsumetAnimeInfo | null> {
    return this.request('/info', { id });
  }

  static async getTopAiring(page = 1): Promise<{ results: ConsumetAnime[] } | null> {
    return this.request('/top-airing', { page });
  }

  static async getMostPopular(page = 1): Promise<{ results: ConsumetAnime[] } | null> {
    return this.request('/most-popular', { page });
  }

  static async getRecentlyUpdated(page = 1): Promise<{ results: ConsumetAnime[] } | null> {
    return this.request('/recently-updated', { page });
  }

  static async getSchedule(date: string): Promise<{ scheduledAnimes: ConsumetAnime[] } | null> {
    return this.request('/schedule', { date });
  }
}

// ==========================================
//  4. V2 TYPES (Future Proofing)
// ==========================================

export interface V2BaseAnime {
  id: string;
  name: string;
  poster: string;
  duration?: string;
  type?: string;
  rating?: string;
  episodes?: { sub: number; dub: number };
}

export interface V2SpotlightAnime extends V2BaseAnime {
  jname: string;
  description: string;
  rank: number;
  otherInfo: string[];
}

export interface V2HomePageData {
  genres: string[];
  latestEpisodeAnimes: V2BaseAnime[];
  spotlightAnimes: V2SpotlightAnime[];
  top10Animes: {
    today: V2BaseAnime[];
    month: V2BaseAnime[];
    week: V2BaseAnime[];
  };
  topAiringAnimes: V2BaseAnime[];
  topUpcomingAnimes: V2BaseAnime[];
  trendingAnimes: V2BaseAnime[];
  mostPopularAnimes: V2BaseAnime[];
  mostFavoriteAnimes: V2BaseAnime[];
  latestCompletedAnimes: V2BaseAnime[];
}

export interface V2AnimeInfo {
  anime: {
    info: {
      id: string;
      name: string;
      poster: string;
      description: string;
      stats: {
        rating: string;
        quality: string;
        episodes: { sub: number; dub: number };
        type: string;
        duration: string;
      };
      promotionalVideos: any[];
      characterVoiceActor: any[];
    };
    moreInfo: {
      aired: string;
      genres: string[];
      status: string;
      studios: string;
      duration: string;
    };
  };
  mostPopularAnimes: V2BaseAnime[];
  recommendedAnimes: V2BaseAnime[];
  relatedAnimes: V2BaseAnime[];
  seasons: any[];
}

export interface V2Episode {
  number: number;
  title: string;
  episodeId: string;
  isFiller: boolean;
}

export interface V2EpisodeList {
  totalEpisodes: number;
  episodes: V2Episode[];
}

export interface V2Server {
  serverId: number;
  serverName: string;
}

export interface V2EpisodeServers {
  episodeId: string;
  episodeNo: number;
  sub: V2Server[];
  dub: V2Server[];
  raw: V2Server[];
}

// *** COMPATIBILITY ALIAS FOR WATCH.TSX ***
// This ensures 'import { ServerData } from ...' works
export type ServerData = V2EpisodeServers; 

export interface V2Source {
  url: string;
  isM3U8: boolean;
  quality?: string;
}

export interface V2StreamingLinks {
  headers: any;
  sources: V2Source[];
  subtitles: { lang: string; url: string }[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  anilistID: number | null;
  malID: number | null;
}

// *** COMPATIBILITY ALIAS FOR WATCH.TSX ***
export type V2SourceResponse = V2StreamingLinks;

export interface V2SearchResult {
  animes: V2BaseAnime[];
  mostPopularAnimes: V2BaseAnime[];
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  searchQuery: string;
  searchFilters: any;
}

export interface V2SearchSuggestion {
  id: string;
  name: string;
  poster: string;
  jname: string;
  moreInfo: string[];
}

export interface V2ProducerAnimes {
  producerName: string;
  animes: V2BaseAnime[];
  top10Animes: any;
  topAiringAnimes: any;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface V2GenreAnimes {
  genreName: string;
  animes: V2BaseAnime[];
  genres: string[];
  topAiringAnimes: any;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface V2CategoryAnimes {
  category: string;
  animes: V2BaseAnime[];
  genres: string[];
  top10Animes: any;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface V2ScheduleAnime {
  id: string;
  time: string;
  name: string;
  jname: string;
  airingTimestamp: number;
  secondsUntilAiring: number;
}

// ==========================================
//  5. V2 API CLASS (New Implementation)
// ==========================================

export class AnimeV2API {
  
  private static async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    try {
      const url = new URL(`${BASE_URL_V2}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`V2 API Error: ${response.statusText}`);
      const json = await response.json();
      return json.success ? json.data : null;
    } catch (error) {
      console.error(`V2 Fetch failed [${endpoint}]:`, error);
      return null;
    }
  }

  // 1. HOME
  static async getHomePage(): Promise<V2HomePageData | null> {
    return this.request<V2HomePageData>('/home');
  }

  // 2. LISTS (A-Z)
  static async getAZList(sortOption: string = 'all', page = 1): Promise<any | null> {
    return this.request(`/azlist/${sortOption}`, { page });
  }

  // 3. INFO
  static async getQtipInfo(animeId: string): Promise<any | null> {
    return this.request(`/qtip/${animeId}`);
  }

  static async getAnimeInfo(animeId: string): Promise<V2AnimeInfo | null> {
    return this.request<V2AnimeInfo>(`/anime/${animeId}`);
  }

  // 4. EPISODES
  static async getEpisodes(animeId: string): Promise<V2EpisodeList | null> {
    return this.request<V2EpisodeList>(`/anime/${animeId}/episodes`);
  }

  static async getNextEpisodeSchedule(animeId: string): Promise<any | null> {
    return this.request(`/anime/${animeId}/next-episode-schedule`);
  }

  // 5. STREAMING
  static async getEpisodeServers(animeEpisodeId: string): Promise<V2EpisodeServers | null> {
    return this.request<V2EpisodeServers>('/episode/servers', { animeEpisodeId });
  }

  static async getEpisodeSources(
    animeEpisodeId: string, 
    server: string = 'hd-1', 
    category: 'sub' | 'dub' | 'raw' = 'sub'
  ): Promise<V2StreamingLinks | null> {
    return this.request<V2StreamingLinks>('/episode/sources', { animeEpisodeId, server, category });
  }

  // 6. SEARCH & DISCOVERY
  static async search(query: string, page = 1, filters: Record<string, string> = {}): Promise<V2SearchResult | null> {
    return this.request<V2SearchResult>('/search', { q: query, page, ...filters });
  }

  static async getSearchSuggestions(query: string): Promise<{ suggestions: V2SearchSuggestion[] } | null> {
    return this.request<{ suggestions: V2SearchSuggestion[] }>('/search/suggestion', { q: query });
  }

  static async getProducerAnimes(name: string, page = 1): Promise<V2ProducerAnimes | null> {
    return this.request<V2ProducerAnimes>(`/producer/${name}`, { page });
  }

  static async getGenreAnimes(name: string, page = 1): Promise<V2GenreAnimes | null> {
    return this.request<V2GenreAnimes>(`/genre/${name}`, { page });
  }

  static async getCategoryAnimes(category: string, page = 1): Promise<V2CategoryAnimes | null> {
    return this.request<V2CategoryAnimes>(`/category/${category}`, { page });
  }

  // 7. SCHEDULE
  static async getSchedule(date: string): Promise<{ scheduledAnimes: V2ScheduleAnime[] } | null> {
    return this.request<{ scheduledAnimes: V2ScheduleAnime[] }>('/schedule', { date });
  }
}

// ==========================================
//  6. USER & WATCHLIST SERVICES
// ==========================================

export class WatchlistAPI {
  static async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    if (supabase && userId !== 'guest') {
      const { data } = await supabase.from('watchlist').select('*').eq('user_id', userId);
      return data || [];
    }
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
    return null;
  }
}