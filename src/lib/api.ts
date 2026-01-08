import { createClient } from '@supabase/supabase-js';

// ==========================================
//  1. CONFIGURATION
// ==========================================

const BASE_URL = 'https://shadow-garden-wqkq.vercel.app/anime/hianime';
const BASE_URL_V2 = 'https://hianime-api-mu.vercel.app/api/v2/hianime';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

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
//  4. API CLASS (V1 BASE)
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
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
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
  static async searchSuggestions(query: string): Promise<{ suggestions: ConsumetAnime[] } | null> {
    return this.request(`/search-suggestions/${encodeURIComponent(query)}`);
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
  static async getMostFavorite(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/most-favorite', { page });
  }
  static async getLatestCompleted(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/latest-completed', { page });
  }
  static async getRecentlyUpdated(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/recently-updated', { page });
  }
  static async getRecentlyAdded(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/recently-added', { page });
  }
  static async getTopUpcoming(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/top-upcoming', { page });
  }
  static async getSubbedAnime(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/subbed-anime', { page });
  }
  static async getDubbedAnime(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/dubbed-anime', { page });
  }
  static async getMovie(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/movie', { page });
  }
  static async getTV(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/tv', { page });
  }
  static async getOVA(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/ova', { page });
  }
  static async getONA(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/ona', { page });
  }
  static async getSpecial(page = 1): Promise<ConsumetSearchResult | null> {
    return this.request('/special', { page });
  }
  static async getGenres(): Promise<{ id: string; name: string }[] | null> {
    return this.request('/genres');
  }
  static async getGenre(genre: string, page = 1): Promise<ConsumetSearchResult | null> {
    return this.request(`/genre/${genre}`, { page });
  }
  static async getStudio(studio: string, page = 1): Promise<ConsumetSearchResult | null> {
    return this.request(`/studio/${studio}`, { page });
  }
  static async getSchedule(date: string): Promise<{ scheduledAnimes: ConsumetAnime[] } | null> {
    return this.request('/schedule', { date });
  }
  static async getEpisodeStreamingLinks(episodeId: string, server?: string, category?: 'sub' | 'dub'): Promise<ConsumetStreamingLinks | null> {
    return this.request(`/watch/${episodeId}`, { server, category });
  }
}

// ==========================================
//  5. V2 TYPES
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

// UPDATED: Include both singular and plural keys for safety
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
      // Some endpoints return 'charactersVoiceActors', others 'characterVoiceActor'
      charactersVoiceActors?: {
        character: { id: string; poster: string; name: string; cast: string };
        voiceActor: { id: string; poster: string; name: string; cast: string };
      }[];
      characterVoiceActor?: {
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

export interface V2SearchSuggestion {
  id: string;
  name: string;
  jname: string;
  poster: string;
  moreInfo: string[];
}

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

export type ServerData = V2EpisodeServers; 
export type V2SourceResponse = V2StreamingLinks;

// ==========================================
//  6. V2 API CLASS (FIXED URL CONSTRUCTION)
// ==========================================

export class AnimeAPI_V2 {
  
  private static async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    try {
      let targetUrl = `${BASE_URL_V2}${endpoint}`;
      
      // FIX: Manually build query string to avoid double-encoding '?' in IDs
      const queryString = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null)
        .map(key => {
            const value = String(params[key]);
            // If the value itself contains '?', it's likely a raw ID that shouldn't be re-encoded
            if (value.includes('?')) {
                return `${key}=${value}`;
            }
            return `${key}=${encodeURIComponent(value)}`;
        })
        .join('&');
      
      if (queryString) {
        targetUrl += `?${queryString}`;
      }

      // Encode the WHOLE final URL for the proxy
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`V2 API Error: ${response.statusText}`);
      
      const json = await response.json();
      
      if (json.status === 200 || json.success === true) {
        return json.data;
      }
      return null;

    } catch (error) {
      console.error(`V2 Fetch failed [${endpoint}]:`, error);
      return null;
    }
  }

  static async getHomePage(): Promise<V2HomePageData | null> { return this.request<V2HomePageData>('/home'); }
  static async getAZList(sortOption = 'all', page = 1): Promise<V2AZListResult | null> { return this.request<V2AZListResult>(`/azlist/${sortOption}`, { page }); }
  static async getQtipInfo(animeId: string): Promise<V2QTipInfo | null> { return this.request<V2QTipInfo>(`/qtip/${animeId}`); }
  static async getAnimeInfo(animeId: string): Promise<V2AnimeInfo | null> { return this.request<V2AnimeInfo>(`/anime/${animeId}`); }
  static async search(query: string, page = 1, filters = {}): Promise<V2SearchResult | null> { return this.request<V2SearchResult>('/search', { q: query, page, ...filters }); }
  static async getSearchSuggestions(query: string): Promise<{ suggestions: V2SearchSuggestion[] } | null> { return this.request<{ suggestions: V2SearchSuggestion[] }>('/search/suggestion', { q: query }); }
  static async getProducerAnimes(name: string, page = 1): Promise<V2GenericListResult | null> { return this.request<V2GenericListResult>(`/producer/${name}`, { page }); }
  static async getGenreAnimes(name: string, page = 1): Promise<V2GenericListResult | null> { return this.request<V2GenericListResult>(`/genre/${name}`, { page }); }
  static async getCategoryAnimes(category: string, page = 1): Promise<V2GenericListResult | null> { return this.request<V2GenericListResult>(`/category/${category}`, { page }); }
  static async getSchedule(date: string): Promise<V2ScheduleResult | null> { return this.request<V2ScheduleResult>('/schedule', { date }); }
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
}

// ==========================================
//  7. USER & WATCHLIST SERVICES
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
}