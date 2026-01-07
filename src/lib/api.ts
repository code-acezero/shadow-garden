// API integration layer for Shadow Garden - Aniwatch API Integration
import { createClient } from '@supabase/supabase-js';

// Aniwatch API Base URL
const ANIWATCH_BASE_URL = 'https://aniwatch-api-ochre.vercel.app/api/v2/hianime';

// Types for Aniwatch API
export interface AniwatchAnime {
  id: string;
  name: string;
  poster: string;
  duration?: string;
  type: string;
  rating?: string;
  episodes: {
    sub: number;
    dub: number;
  };
  jname?: string;
  description?: string;
  rank?: number;
  otherInfo?: string[];
}

export interface AniwatchHomeData {
  genres: string[];
  latestEpisodeAnimes: AniwatchAnime[];
  spotlightAnimes: AniwatchAnime[];
  top10Animes: {
    today: AniwatchAnime[];
    week: AniwatchAnime[];
    month: AniwatchAnime[];
  };
  topAiringAnimes: AniwatchAnime[];
  topUpcomingAnimes: AniwatchAnime[];
  trendingAnimes: AniwatchAnime[];
  mostPopularAnimes: AniwatchAnime[];
  mostFavoriteAnimes: AniwatchAnime[];
  latestCompletedAnimes: AniwatchAnime[];
}

export interface AniwatchEpisode {
  number: number;
  title: string;
  episodeId: string;
  isFiller: boolean;
}

export interface AniwatchSearchResult {
  animes: AniwatchAnime[];
  mostPopularAnimes: AniwatchAnime[];
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  searchQuery: string;
  searchFilters: Record<string, string | number | boolean>;
}

export interface AniwatchScheduleItem {
  id: string;
  time: string;
  name: string;
  jname: string;
  airingTimestamp: number;
  secondsUntilAiring: number;
}

export interface AniwatchAnimeDetails {
  anime: {
    info: {
      id: string;
      name: string;
      poster: string;
      description: string;
      stats: {
        rating: string;
        quality: string;
        episodes: {
          sub: number;
          dub: number;
        };
        type: string;
        duration: string;
      };
      promotionalVideos: Array<{
        title?: string;
        source?: string;
        thumbnail?: string;
      }>;
      characterVoiceActor: Array<{
        character: {
          id: string;
          poster: string;
          name: string;
          cast: string;
        };
        voiceActor: {
          id: string;
          poster: string;
          name: string;
          cast: string;
        };
      }>;
    };
    moreInfo: {
      aired: string;
      genres: string[];
      status: string;
      studios: string;
      duration: string;
    };
  };
  mostPopularAnimes: AniwatchAnime[];
  recommendedAnimes: AniwatchAnime[];
  relatedAnimes: AniwatchAnime[];
  seasons: Array<{
    id: string;
    name: string;
    title: string;
    poster: string;
    isCurrent: boolean;
  }>;
}

export interface AniwatchEpisodeSources {
  headers: Record<string, string>;
  sources: Array<{
    url: string;
    isM3U8: boolean;
    quality?: string;
  }>;
  subtitles: Array<{
    lang: string;
    url: string;
  }>;
  anilistID: number | null;
  malID: number | null;
}

export interface WatchlistItem {
  anime_id: string;
  status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  progress: number;
  score?: number;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  user_metadata: {
    username: string;
  };
}

// Supabase client (will be configured later when user enables Supabase)
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Aniwatch API functions
export class AnimeAPI {
  // Fetch home page data
  static async getHomeData(): Promise<AniwatchHomeData | null> {
    try {
      const response = await fetch(`${ANIWATCH_BASE_URL}/home`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      }
      throw new Error('Failed to fetch home data');
    } catch (error) {
      console.error('Error fetching home data:', error);
      return null;
    }
  }

  // Fetch top anime (using top10 today)
  static async getTopAnime(limit = 25): Promise<AniwatchAnime[]> {
    try {
      const homeData = await this.getHomeData();
      if (homeData) {
        return homeData.top10Animes.today.slice(0, limit);
      }
      return [];
    } catch (error) {
      console.error('Error fetching top anime:', error);
      return [];
    }
  }

  // Fetch trending anime
  static async getTrendingAnime(): Promise<AniwatchAnime[]> {
    try {
      const homeData = await this.getHomeData();
      if (homeData) {
        return homeData.trendingAnimes;
      }
      return [];
    } catch (error) {
      console.error('Error fetching trending anime:', error);
      return [];
    }
  }

  // Fetch latest episodes
  static async getLatestEpisodes(): Promise<AniwatchAnime[]> {
    try {
      const homeData = await this.getHomeData();
      if (homeData) {
        return homeData.latestEpisodeAnimes;
      }
      return [];
    } catch (error) {
      console.error('Error fetching latest episodes:', error);
      return [];
    }
  }

  // Fetch upcoming anime
  static async getUpcomingAnime(): Promise<AniwatchAnime[]> {
    try {
      const homeData = await this.getHomeData();
      if (homeData) {
        return homeData.topUpcomingAnimes;
      }
      return [];
    } catch (error) {
      console.error('Error fetching upcoming anime:', error);
      return [];
    }
  }

  // Fetch most popular anime
  static async getMostPopularAnime(): Promise<AniwatchAnime[]> {
    try {
      const homeData = await this.getHomeData();
      if (homeData) {
        return homeData.mostPopularAnimes;
      }
      return [];
    } catch (error) {
      console.error('Error fetching most popular anime:', error);
      return [];
    }
  }

  // Search anime
  static async searchAnime(query: string, page = 1): Promise<AniwatchSearchResult | null> {
    try {
      const response = await fetch(`${ANIWATCH_BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      }
      throw new Error('Search failed');
    } catch (error) {
      console.error('Error searching anime:', error);
      return null;
    }
  }

  // Get search suggestions
  static async getSearchSuggestions(query: string): Promise<AniwatchAnime[]> {
    try {
      const response = await fetch(`${ANIWATCH_BASE_URL}/search/suggestion?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      
      if (result.success) {
        return result.data.suggestions;
      }
      return [];
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      return [];
    }
  }

  // Fetch anime details
  static async getAnimeDetails(animeId: string): Promise<AniwatchAnimeDetails | null> {
    try {
      const response = await fetch(`${ANIWATCH_BASE_URL}/anime/${animeId}`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      }
      throw new Error('Failed to fetch anime details');
    } catch (error) {
      console.error('Error fetching anime details:', error);
      return null;
    }
  }

  // Fetch anime episodes
  static async getAnimeEpisodes(animeId: string): Promise<AniwatchEpisode[]> {
    try {
      const response = await fetch(`${ANIWATCH_BASE_URL}/anime/${animeId}/episodes`);
      const result = await response.json();
      
      if (result.success) {
        return result.data.episodes;
      }
      return [];
    } catch (error) {
      console.error('Error fetching anime episodes:', error);
      return [];
    }
  }

  // Fetch episode streaming sources
  static async getEpisodeSources(episodeId: string, server = 'hd-1', category = 'sub'): Promise<AniwatchEpisodeSources | null> {
    try {
      const response = await fetch(`${ANIWATCH_BASE_URL}/episode/sources?animeEpisodeId=${episodeId}&server=${server}&category=${category}`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      }
      throw new Error('Failed to fetch episode sources');
    } catch (error) {
      console.error('Error fetching episode sources:', error);
      return null;
    }
  }

  // Fetch schedule
  static async getSchedule(date: string): Promise<AniwatchScheduleItem[]> {
    try {
      const response = await fetch(`${ANIWATCH_BASE_URL}/schedule?date=${date}`);
      const result = await response.json();
      
      if (result.success) {
        return result.data.scheduledAnimes;
      }
      return [];
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return [];
    }
  }

  // Fetch anime by category
  static async getAnimeByCategory(category: string, page = 1): Promise<AniwatchAnime[]> {
    try {
      const response = await fetch(`${ANIWATCH_BASE_URL}/category/${category}?page=${page}`);
      const result = await response.json();
      
      if (result.success) {
        return result.data.animes;
      }
      return [];
    } catch (error) {
      console.error('Error fetching anime by category:', error);
      return [];
    }
  }

  // Fetch anime by genre
  static async getAnimeByGenre(genre: string, page = 1): Promise<AniwatchAnime[]> {
    try {
      const response = await fetch(`${ANIWATCH_BASE_URL}/genre/${genre}?page=${page}`);
      const result = await response.json();
      
      if (result.success) {
        return result.data.animes;
      }
      return [];
    } catch (error) {
      console.error('Error fetching anime by genre:', error);
      return [];
    }
  }
}

// Watchlist API functions (using localStorage as fallback when Supabase is not configured)
export class WatchlistAPI {
  static async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('watchlist')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        return data || [];
      } else {
        // Fallback to localStorage
        const watchlist = localStorage.getItem(`watchlist_${userId}`);
        return watchlist ? JSON.parse(watchlist) : [];
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      return [];
    }
  }

  static async addToWatchlist(userId: string, animeId: string, status: WatchlistItem['status']): Promise<boolean> {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('watchlist')
          .upsert({
            user_id: userId,
            anime_id: animeId,
            status,
            progress: 0,
            updated_at: new Date().toISOString()
          });

        return !error;
      } else {
        // Fallback to localStorage
        const watchlist = await this.getUserWatchlist(userId);
        const existingIndex = watchlist.findIndex(item => item.anime_id === animeId);
        
        const newItem: WatchlistItem = {
          anime_id: animeId,
          status,
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (existingIndex >= 0) {
          watchlist[existingIndex] = { ...watchlist[existingIndex], ...newItem };
        } else {
          watchlist.push(newItem);
        }

        localStorage.setItem(`watchlist_${userId}`, JSON.stringify(watchlist));
        return true;
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return false;
    }
  }

  static async updateWatchProgress(userId: string, animeId: string, progress: number): Promise<boolean> {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('watchlist')
          .update({
            progress,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('anime_id', animeId);

        return !error;
      } else {
        // Fallback to localStorage
        const watchlist = await this.getUserWatchlist(userId);
        const existingIndex = watchlist.findIndex(item => item.anime_id === animeId);
        
        if (existingIndex >= 0) {
          watchlist[existingIndex].progress = progress;
          watchlist[existingIndex].updated_at = new Date().toISOString();
          localStorage.setItem(`watchlist_${userId}`, JSON.stringify(watchlist));
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Error updating watch progress:', error);
      return false;
    }
  }

  static async removeFromWatchlist(userId: string, animeId: string): Promise<boolean> {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', userId)
          .eq('anime_id', animeId);

        return !error;
      } else {
        // Fallback to localStorage
        const watchlist = await this.getUserWatchlist(userId);
        const filteredWatchlist = watchlist.filter(item => item.anime_id !== animeId);
        localStorage.setItem(`watchlist_${userId}`, JSON.stringify(filteredWatchlist));
        return true;
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return false;
    }
  }
}

// User API functions (using localStorage as fallback when Supabase is not configured)
export class UserAPI {
  static async getCurrentUser(): Promise<AppUser | null> {
    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        return user as AppUser | null;
      } else {
        // Fallback to localStorage
        const user = localStorage.getItem('current_user');
        return user ? JSON.parse(user) : null;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async signIn(email: string, password: string) {
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        return { data, error };
      } else {
        // Fallback demo login
        const demoUser: AppUser = {
          id: 'demo-user-' + Date.now(),
          email,
          user_metadata: { username: email.split('@')[0] }
        };
        localStorage.setItem('current_user', JSON.stringify(demoUser));
        return { data: { user: demoUser }, error: null };
      }
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  }

  static async signUp(email: string, password: string, username: string) {
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username
            }
          }
        });
        return { data, error };
      } else {
        // Fallback demo registration
        const demoUser: AppUser = {
          id: 'demo-user-' + Date.now(),
          email,
          user_metadata: { username }
        };
        localStorage.setItem('current_user', JSON.stringify(demoUser));
        return { data: { user: demoUser }, error: null };
      }
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  }

  static async signOut(): Promise<boolean> {
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        return !error;
      } else {
        // Fallback localStorage cleanup
        localStorage.removeItem('current_user');
        return true;
      }
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  }
}