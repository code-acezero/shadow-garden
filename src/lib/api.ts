import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables');
}

// --- SINGLETON CLEANUP (Keeps the app from crashing) ---
const globalForSupabase = global as unknown as { supabase: ReturnType<typeof createClient> };

// THE FIX: The word 'export' is added here so AuthContext can read it.
// We still use 'globalForSupabase' to prevent the crash.
export const supabase = globalForSupabase.supabase || createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

if (process.env.NODE_ENV !== 'production') {
    globalForSupabase.supabase = supabase;
}

// ==========================================
//  1. CONFIGURATION
// ==========================================

const BASE_URL = 'https://shadow-garden-wqkq.vercel.app/anime/hianime';
const BASE_URL_V2 = 'https://hianime-api-mu.vercel.app/api/v2/hianime';

// ❌ REMOVED: Duplicate Supabase initialization
// The 'supabase' export is now handled by the import above.

// ==========================================
//  2. SHARED TYPES
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

export interface WatchlistItem {
  anime_id: string;
  status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  progress: number;
  updated_at: string;
  episode_id?: string;
}

// ==========================================
//  3. V1 (BASE) TYPES
// ==========================================

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
  otherName?: string;
}

export interface ConsumetSearchResult {
  currentPage: number;
  hasNextPage: boolean;
  totalPages?: number;
  results: ConsumetAnime[];
}

export interface ConsumetAdvancedSearchParams {
  page?: number;
  type?: 'movie' | 'tv' | 'ova' | 'ona' | 'special';
  status?: 'currently-airing' | 'finished-airing';
  rated?: 'r' | 'pg-13' | 'pg';
  score?: number;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  language?: 'sub' | 'dub';
  startDate?: string;
  endDate?: string;
  sort?: 'recently-added' | 'most-popular';
  genres?: string;
}

export interface ConsumetStreamingLinks {
  headers: {
    Referer: string;
    "User-Agent": string;
  };
  sources: {
    url: string;
    quality: string;
    isM3U8: boolean;
  }[];
  download?: string;
}

// ==========================================
//  4. V2 TYPES & EXPORTS
// ==========================================

export interface V2BaseAnime {
  id: string;
  name: string;
  poster: string;
  duration?: string;
  type?: string;
  rating?: string | null;
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

export interface V2AZListResult {
  sortOption: string;
  animes: V2BaseAnime[];
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
}

export interface V2QTipInfo {
  anime: {
    id: string;
    name: string;
    malscore?: string;
    quality?: string;
    episodes?: { sub: number; dub: number };
    type?: string;
    description?: string;
    jname?: string;
    synonyms?: string;
    aired?: string;
    status?: string;
    genres?: string[];
  };
}

export interface V2AnimeInfo {
  anime: {
    info: {
      id: string;
      name: string;
      jname?: string;
      poster: string;
      description: string;
      stats: {
        rating: string;
        quality: string;
        episodes: { sub: number; dub: number };
        type: string;
        duration: string;
      };
      promotionalVideos: {
        title: string;
        source: string;
        thumbnail: string;
      }[];
      charactersVoiceActors?: {
        character: { id: string; poster: string; name: string; cast: string };
        voiceActor: { id: string; poster: string; name: string; cast: string };
      }[];
    };
    moreInfo: {
      aired: string;
      genres: string[];
      status: string;
      studios: string;
      duration: string;
      producers?: string[];
      japanese?: string;
      synonyms?: string;
    };
  };
  mostPopularAnimes: V2BaseAnime[];
  recommendedAnimes: V2BaseAnime[];
  relatedAnimes: V2BaseAnime[];
  seasons: {
    id: string;
    name: string;
    title: string;
    poster: string;
    isCurrent: boolean;
  }[];
}

export interface V2SearchResult {
  animes: V2BaseAnime[];
  mostPopularAnimes: V2BaseAnime[];
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  searchQuery: string;
  searchFilters: Record<string, string[]>;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  jname: string;
  poster: string;
  moreInfo: string[];
}

export interface V2SearchSuggestion extends SearchSuggestion {}

export interface V2GenericListResult {
  producerName?: string;
  genreName?: string;
  category?: string;
  animes: V2BaseAnime[];
  genres?: string[];
  top10Animes?: any;
  topAiringAnimes?: any;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface V2ScheduleResult {
  scheduledAnimes: {
    id: string;
    time: string;
    name: string;
    jname: string;
    airingTimestamp: number;
    secondsUntilAiring: number;
  }[];
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

export interface V2EpisodeSchedule {
  airingISOTimestamp: string | null;
  airingTimestamp: number | null;
  secondsUntilAiring: number | null;
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

export interface V2Source {
  url: string;
  isM3U8: boolean;
  quality?: string;
  type?: string;
}

export interface V2StreamingLinks {
  headers?: {
    Referer: string;
  };
  tracks?: { 
    url: string; 
    lang: string; 
    label?: string;
    kind?: string; 
  }[];
  intro?: {
    start: number;
    end: number;
  };
  outro?: {
    start: number;
    end: number;
  };
  sources: V2Source[];
  anilistID?: number;
  malID?: number;
}

export type LocalServerData = V2EpisodeServers; 
export type V2SourceResponse = V2StreamingLinks;

// ==========================================
//  5. API CLASS (V1 BASE)
// ==========================================

export class AnimeAPI {
  private static async request(endpoint: string, params: Record<string, any> = {}) {
    try {
      const url = new URL(`${BASE_URL}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      const finalUrl = typeof window !== 'undefined' 
        ? `/api/proxy?url=${encodeURIComponent(url.toString())}` 
        : url.toString();

      const response = await fetch(finalUrl);
      if (!response.ok) throw new Error(`V1 API Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Fetch failed [${endpoint}]:`, error);
      return null;
    }
  }

  static async search(query: string, page = 1): Promise<ConsumetSearchResult | null> {
    return this.request(`/${encodeURIComponent(query)}`, { page });
  }
  static async advancedSearch(params: ConsumetAdvancedSearchParams): Promise<ConsumetSearchResult | null> {
    return this.request('/advanced-search', params as Record<string, any>);
  }
  static async getAnimeInfo(id: string): Promise<ConsumetAnimeInfo | null> {
    return this.request('/info', { id });
  }
  static async getSpotlight(): Promise<{ spotlightAnimes: ConsumetAnime[] } | null> {
    return this.request('/spotlight');
  }
  static async getTopAiring(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/top-airing', { page });
  }
  static async getMostPopular(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/most-popular', { page });
  }
  static async getRecentlyUpdated(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/recently-updated', { page });
  }
  static async getGenres(): Promise<{ id: string; name: string }[] | null> {
    return this.request('/genres');
  }
  static async getEpisodeStreamingLinks(episodeId: string, server?: string, category?: 'sub' | 'dub'): Promise<ConsumetStreamingLinks | null> {
    return this.request(`/watch/${episodeId}`, { server, category });
  }
}

// ==========================================
//  6. V2 API CLASS
// ==========================================

export class AnimeAPI_V2 {
  
  private static async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    try {
      let targetUrl = `${BASE_URL_V2}${endpoint}`;
      
      const queryParts = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null)
        .map(key => `${key}=${encodeURIComponent(String(params[key]))}`);
      
      if (queryParts.length > 0) {
        targetUrl += `?${queryParts.join('&')}`;
      }

      const proxyUrl = typeof window !== 'undefined' 
        ? `/api/proxy?url=${encodeURIComponent(targetUrl)}` 
        : targetUrl;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`V2 API Error: ${response.status}`);
      
      const json = await response.json();
      
      // V2 API often wraps data in a 'data' object
      if (json.status === 200 || json.success === true) {
        return json.data;
      }
      return json; // Fallback if data is at root

    } catch (error) {
      console.error(`V2 Fetch failed [${endpoint}]:`, error);
      return null;
    }
  }

  static async getHomePage(): Promise<V2HomePageData | null> { return this.request<V2HomePageData>('/home'); }
  static async getAnimeInfo(animeId: string): Promise<V2AnimeInfo | null> { return this.request<V2AnimeInfo>(`/anime/${animeId}`); }
  static async search(query: string, page = 1, filters = {}): Promise<V2SearchResult | null> { return this.request<V2SearchResult>('/search', { q: query, page, ...filters }); }
  static async getSearchSuggestions(query: string): Promise<{ suggestions: V2SearchSuggestion[] } | null> { return this.request<{ suggestions: V2SearchSuggestion[] }>('/search/suggestion', { q: query }); }
  static async getEpisodes(animeId: string): Promise<V2EpisodeList | null> { return this.request<V2EpisodeList>(`/anime/${animeId}/episodes`); }
  static async getNextEpisodeSchedule(animeId: string): Promise<V2EpisodeSchedule | null> { return this.request<V2EpisodeSchedule>(`/anime/${animeId}/next-episode-schedule`); }
  static async getEpisodeServers(animeEpisodeId: string): Promise<V2EpisodeServers | null> { return this.request<V2EpisodeServers>('/episode/servers', { animeEpisodeId }); }
  
  static async getEpisodeSources(
    animeEpisodeId: string, 
    server: string = 'hd-1', 
    category: 'sub' | 'dub' | 'raw' = 'sub'
  ): Promise<V2StreamingLinks | null> {
    return this.request<V2StreamingLinks>('/episode/sources', { animeEpisodeId, server, category });
  }

  static async getGenreAnimes(name: string, page = 1): Promise<V2GenericListResult | null> { return this.request<V2GenericListResult>(`/genre/${name}`, { page }); }
  static async getCategoryAnimes(category: string, page = 1): Promise<V2GenericListResult | null> { return this.request<V2GenericListResult>(`/category/${category}`, { page }); }
  static async getSchedule(date: string): Promise<V2ScheduleResult | null> { return this.request<V2ScheduleResult>('/schedule', { date }); }
}

// ==========================================
//  7. USER & WATCHLIST SERVICES
// ==========================================

export class WatchlistAPI {
  static async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    if (supabase && userId !== 'guest') {
      const { data, error } = await supabase.from('watchlist').select('*').eq('user_id', userId);
      if (error) console.error("Watchlist Fetch Error:", error);
      return data || [];
    }
    if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`watchlist_${userId}`);
        return local ? JSON.parse(local) : [];
    }
    return [];
  }

  static async addToWatchlist(userId: string, animeId: string, status: WatchlistItem['status'], progress: number = 0, episodeId?: string): Promise<boolean> {
    const item: any = { anime_id: animeId, status, progress, updated_at: new Date().toISOString() };
    if (episodeId) item.episode_id = episodeId;

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

  static async updateProgress(userId: string, animeId: string, episodeNumber: number, episodeId?: string) {
      return this.addToWatchlist(userId, animeId, 'watching', episodeNumber, episodeId);
  }
}

export class UserAPI {
  static async getCurrentUser(): Promise<AppUser | null> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return { id: user.id, email: user.email, user_metadata: user.user_metadata };
    }
    return null;
  }

  static async signIn(email: string, password: string) {
      if (!supabase) return { data: null, error: 'Supabase not initialized' };
      return await supabase.auth.signInWithPassword({ email, password });
  }

  static async signUp(email: string, password: string, username: string) {
      if (!supabase) return { data: null, error: 'Supabase not initialized' };
      return await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, full_name: username } }
      });
  }

  static async signOut() {
      if (supabase) await supabase.auth.signOut();
  }
}



// ==========================================
//  8. IMAGE UPLOAD SERVICE (ImgBB)
// ==========================================

export class ImageAPI {
  /**
   * Uploads a file to ImgBB and returns the public URL
   */
  static async uploadImage(file: File): Promise<string> {
    // Robust environment variable retrieval
    const API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || '1DL4pRCKKmg238fsCU6i7ZYEStP9fL9o4q'; 

    if (!API_KEY || API_KEY === 'undefined') {
      throw new Error('ImgBB API Key is missing. Ensure NEXT_PUBLIC_IMGBB_API_KEY is in .env.local');
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      // We pass the key as a URL parameter as required by ImgBB API v1 documentation
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        // If the API returns a key error, we catch it here
        if (data.status_code === 400 && data.error?.message?.includes('key')) {
            throw new Error('Invalid ImgBB API Key. Check your dashboard at api.imgbb.com');
        }
        throw new Error(data.error?.message || 'Image upload failed');
      }

      return data.data.url;
    } catch (error: any) {
      console.error('ImgBB Service Error:', error);
      throw error;
    }
  }
}
