import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// --- SINGLETON CLEANUP ---
const globalForSupabase = global as unknown as { supabase: any };

export const supabase = globalForSupabase.supabase || (supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
}) : null);

if (process.env.NODE_ENV !== 'production' && supabase) {
    globalForSupabase.supabase = supabase;
}

// ==========================================
//  1. CONFIGURATION & POOLS
// ==========================================

const BASE_URL = 'https://consumet-api-hianime.vercel.app/anime/hianime';

const POOL_V2 = [
    'https://hianime-api-mu.vercel.app/api/v2/hianime',
    'https://hianime-api-v2-2nd.vercel.app/api/v2/hianime'
];

const POOL_V3 = [
    'https://hianime-api-v3.vercel.app/api',
    'https://hianime-api-v3-2nd.vercel.app/api'
];

const BASE_URL_V4 = 'https://hianime-api-v4.vercel.app/api/v1'; 
const BASE_URL_HINDI = 'https://hindi-anime-api-v1.vercel.app/api';

// ==========================================
//  2. SHARED UTILS
// ==========================================

const normalizeList = (item: any): string[] => {
    if (!item) return [];
    if (Array.isArray(item)) return item.filter(i => typeof i === 'string').map(i => i.trim());
    if (typeof item === 'string') {
        return item.includes(',') ? item.split(',').map(s => s.trim()) : [item.trim()];
    }
    return [];
};

const shuffleArray = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

async function fetchWithFailover(urlPool: string[], endpoint: string, params: Record<string, any> = {}): Promise<any | null> {
    const shuffledPool = shuffleArray([...urlPool]);
    
    const queryParts = Object.keys(params)
        .filter(k => params[k] !== undefined && params[k] !== null)
        .map(key => `${key}=${encodeURIComponent(String(params[key]))}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    for (const baseUrl of shuffledPool) {
        try {
            const targetUrl = `${baseUrl}${endpoint}${queryString}`;
            const proxyUrl = typeof window !== 'undefined' ? `/api/proxy?url=${encodeURIComponent(targetUrl)}` : targetUrl;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) continue;

            const json = await response.json();
            if (json.status === 200 || json.success === true) {
                return json.data || json.results || json; 
            }
        } catch (error) {
            continue;
        }
    }
    return null;
}

export interface AppUser {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; avatar_url?: string; [key: string]: any; };
}

export interface WatchlistItem {
  anime_id: string;
  status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  progress: number;
  updated_at: string;
  episode_id?: string;
}

// ==========================================
//  3. UNIVERSAL INTERFACES
// ==========================================

export interface UniversalAnime {
    id: string;
    title: string;
    jname: string;
    poster: string;
    description: string;
    isAdult: boolean;
    stats: {
        rating: string;
        quality: string;
        duration: string;
        type: string;
        malScore: string;
        episodes: { sub: number; dub: number };
    };
    info: {
        status: string;
        genres: string[];
        studios: string[];
        producers: string[];
        aired: string;
        premiered: string;
        japanese: string;
        synonyms: string;
    };
    episodes: UniversalEpisode[];
    characters: UniversalCharacter[];
    recommendations: UniversalAnimeBase[];
    related: UniversalAnimeBase[];
    seasons: UniversalSeason[];
    trailers: { title: string; source: string; thumbnail: string }[];
}

export interface UniversalEpisode {
    id: string;
    number: number;
    title: string;
    isFiller: boolean;
    isDub?: boolean;
}

export interface UniversalCharacter {
    id: string;
    name: string;
    poster: string;
    role: string;
    favorites?: number;
    voiceActor?: {
        id: string;
        name: string;
        poster: string;
        language: string;
    };
}

export interface UniversalAnimeBase {
    id: string;
    title: string;
    jname?: string;
    poster: string;
    type: string;
    duration?: string;
    episodes?: { sub: number; dub: number; eps?: number };
    rank?: number; 
}

export interface UniversalSeason {
    id: string;
    title: string;
    poster: string;
    isCurrent: boolean;
}

// ==========================================
//  4. API V1 (LEGACY)
// ==========================================
export class AnimeAPI {
  private static async request(endpoint: string, params: Record<string, any> = {}) {
    try {
      const url = new URL(`${BASE_URL}${endpoint}`);
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      const finalUrl = typeof window !== 'undefined' ? `/api/proxy?url=${encodeURIComponent(url.toString())}` : url.toString();
      const response = await fetch(finalUrl);
      if (!response.ok) throw new Error(`V1 API Error: ${response.status}`);
      return await response.json();
    } catch (error) { return null; }
  }
  static async search(query: string, page = 1) { return this.request(`/${encodeURIComponent(query)}`, { page }); }
  static async getAnimeInfo(id: string) { return this.request('/info', { id }); }
  static async getEpisodeStreamingLinks(episodeId: string) { return this.request(`/watch/${episodeId}`); }
}

// ==========================================
//  5. API V2 (PRIMARY POOL + PRODUCER/CATEGORY)
// ==========================================
export class AnimeAPI_V2 {
  static async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    return fetchWithFailover(POOL_V2, endpoint, params);
  }
  static async getHomePage() { return this.request('/home'); }
  static async getAnimeInfo(animeId: string) { return this.request(`/anime/${animeId}`); }
  
  static async search(query: string, page = 1) { 
    const data: any = await this.request('/search', { q: query, page });
    if (data && data.animes) {
        return {
            results: data.animes.map((item: any) => ({
                id: item.id,
                title: item.name,
                jname: item.jname,
                poster: item.poster,
                type: item.type,
                duration: item.duration,
                episodes: item.episodes || { sub: 0, dub: 0 }
            }))
        };
    }
    return { results: [] };
  }

  static async getSearchSuggestions(query: string) {
    return this.request('/search/suggestion', { q: query });
  }

  static async getProducerAnimes(name: string, page = 1) {
    return this.request(`/producer/${name}`, { page });
  }

  static async getCategoryAnimes(name: string, page = 1) {
    return this.request(`/category/${name}`, { page });
  }

  static async getSchedule(date: string) { 
    const data: any = await this.request('/schedule', { date });
    if (data && data.scheduledAnimes) {
        return {
            scheduledAnimes: data.scheduledAnimes.map((item: any) => ({
                id: item.id,
                time: item.time,
                name: item.name,
                jname: item.jname,
                timestamp: item.airingTimestamp,
                secondsUntilAiring: item.secondsUntilAiring,
                episode: item.episode
            }))
        };
    }
    return { scheduledAnimes: [] };
  }

  static async getEpisodes(animeId: string) { return this.request(`/anime/${animeId}/episodes`); }
  static async getNextEpisodeSchedule(animeId: string) { return this.request(`/anime/${animeId}/next-episode-schedule`); }
  static async getEpisodeServers(animeEpisodeId: string) { return this.request('/episode/servers', { animeEpisodeId }); }
  static async getEpisodeSources(animeEpisodeId: string, server = 'hd-1', category = 'sub') { return this.request('/episode/sources', { animeEpisodeId, server, category }); }
}

// ==========================================
//  6. API V3 (METADATA POOL + TOP 10)
// ==========================================
export class AnimeAPI_V3 {
  static async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    return fetchWithFailover(POOL_V3, endpoint, params);
  }
  static async getHomeInfo() { return this.request('/'); }
  static async getAnimeInfo(id: string) { return this.request('/info', { id }); }
  
  static async search(keyword: string) { 
    const data: any = await this.request('/search', { keyword });
    if (data && data.data) {
        return {
            results: data.data.map((item: any) => ({
                id: item.id,
                title: item.title,
                jname: item.japanese_title,
                poster: item.poster,
                type: item.tvInfo?.showType || "TV",
                episodes: { sub: item.tvInfo?.sub || 0, dub: item.tvInfo?.dub || 0 }
            }))
        };
    }
    return { results: [] };
  }

  static async getTopTen() { return this.request('/top-ten'); }
  static async getTopSearch() { return this.request('/top-search'); }
  static async getRandomAnime() { return this.request('/random'); }

  static async getSchedule(date: string) {
    const data: any = await this.request('/schedule', { date });
    if (Array.isArray(data)) {
        return {
            scheduledAnimes: data.map((item: any) => ({
                id: item.id,
                time: item.time,
                name: item.title,
                jname: item.japanese_title,
                timestamp: null, 
                secondsUntilAiring: null,
                episode: item.episode_no
            }))
        };
    }
    return { scheduledAnimes: [] };
  }

  static async getAnimeCharacters(id: string, page = 1) { return this.request(`/character/list/${id}`, { page }); }
  static async getCharacterDetails(id: string) { return this.request(`/character/${id}`); }
  static async getVoiceActorDetails(id: string) { return this.request(`/actors/${id}`); }
  static async getEpisodes(id: string) { return this.request(`/episodes/${id}`); }
  static async getStreamingLinks(id: string, server: string, type: string) { return this.request('/stream', { id, server, type }); }
}

// ==========================================
//  7. API V4 (FAST & SPECIALIZED LISTS)
// ==========================================
export class AnimeAPI_V4 {
  static async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    return fetchWithFailover([BASE_URL_V4], endpoint, params); 
  }
  
  static async getHome() { return this.request('/home'); }
  static async getTopUpcoming(page = 1) { return this.request('/animes/top-upcoming', { page }); }
  static async getRecentlyUpdated(page = 1) { return this.request('/animes/recently-updated', { page }); }
  static async getRecentlyAdded(page = 1) { return this.request('/animes/recently-added', { page }); }
  static async getCompleted(page = 1) { return this.request('/animes/completed', { page }); }
  static async getMostFavorite(page = 1) { return this.request('/animes/most-favorite', { page }); }
  static async getMostPopular(page = 1) { return this.request('/animes/most-popular', { page }); }
  static async getTopAiring(page = 1) { return this.request('/animes/top-airing', { page }); }
  static async getSubbedAnime(page = 1) { return this.request('/animes/subbed-anime', { page }); }
  static async getDubbedAnime(page = 1) { return this.request('/animes/dubbed-anime', { page }); }
  static async getByGenre(name: string, page = 1) { return this.request(`/animes/genre/${name}`, { page }); }
  static async getAzList(letter: string, page = 1) { return this.request(`/animes/az-list/${letter}`, { page }); }
  static async getSearchSuggestions(keyword: string) { return this.request('/suggestion', { keyword }); }
  static async filter(params: Record<string, any>) { return this.request('/filter', params); }

  static async search(keyword: string, page = 1) { 
    const data: any = await this.request('/search', { keyword, page });
    if (data && data.response) {
        return {
            results: data.response.map((item: any) => ({
                id: item.id,
                title: item.title,
                jname: item.alternativeTitle,
                poster: item.poster,
                type: item.type,
                duration: item.duration,
                episodes: item.episodes || { sub: 0, dub: 0 }
            })),
            pageInfo: data.pageInfo
        };
    }
    return { results: [] };
  }

  static async getAnimeDetail(id: string) { return this.request(`/anime/${id}`); }
  static async getEpisodes(id: string) { return this.request(`/episodes/${id}`); }
  static async getStream(id: string, server = 'hd-2', type = 'sub') { return this.request('/stream', { id, server, type }); }
}

// ==========================================
//  8. API HINDI (DEDICATED)
// ==========================================
export class AnimeAPI_Hindi {
  static async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
      return fetchWithFailover([BASE_URL_HINDI], endpoint, params);
  }
  static async getHome() { return this.request('/home'); }
  
  static async search(keyword: string, page = 1) { 
      const data: any = await this.request('/search', { keyword, page });
      if (data && (data.animes || data.response || data.results)) {
          const list = data.animes || data.response || data.results || [];
          return {
              results: list.map((item: any) => ({
                  id: item.id,
                  title: item.name || item.title,
                  poster: item.poster,
                  type: item.type || "TV",
                  episodes: item.episodes || { sub: 0, dub: 0 }
              }))
          };
      }
      return { results: [] };
  }
  static async getAnimeDetails(id: string) { return this.request(`/anime/${id}`); }
}

// ==========================================
//  9. ANIME SERVICE (THE ORCHESTRATOR)
// ==========================================

export class AnimeService {

    private static normalizeV4List(data: any): UniversalAnimeBase[] {
        const list = data?.response || data?.animes || [];
        return list.map((item: any) => ({
            id: item.id,
            title: item.title || item.name,
            jname: item.alternativeTitle || item.jname,
            poster: item.poster,
            type: item.type,
            duration: item.duration,
            episodes: item.episodes || { sub: 0, dub: 0 }
        }));
    }

    private static normalizeV3TopTen(item: any): UniversalAnimeBase {
        return {
            id: item.id,
            title: item.title,
            jname: item.japanese_title,
            poster: item.poster,
            rank: item.rank || item.number,
            type: "TV", 
            episodes: { 
                sub: parseInt(item.tvInfo?.sub || "0"), 
                dub: parseInt(item.tvInfo?.dub || "0"),
                eps: parseInt(item.tvInfo?.eps || "0")
            }
        };
    }

    private static normalizeV2(data: any): UniversalAnime {
        const i = data?.anime?.info || {};
        const m = data?.anime?.moreInfo || {};
        return {
            id: i.id || "",
            title: i.name || "Unknown Title",
            jname: i.jname || m.japanese || "",
            poster: i.poster || "",
            description: i.description || "",
            isAdult: m.genres?.includes('Hentai') || false,
            stats: {
                rating: i.stats?.rating || "?",
                quality: i.stats?.quality || "HD",
                duration: i.stats?.duration || "?",
                type: i.stats?.type || "TV",
                malScore: m.malscore || "?",
                episodes: i.stats?.episodes || { sub: 0, dub: 0 }
            },
            info: {
                status: m.status || "Unknown",
                genres: normalizeList(m.genres),
                studios: normalizeList(m.studios),
                producers: normalizeList(m.producers),
                aired: m.aired || "?",
                premiered: m.premiered || "?",
                japanese: m.japanese || "",
                synonyms: m.synonyms || ""
            },
            episodes: [], characters: [], 
            recommendations: (data?.recommendedAnimes || []).map((r: any) => ({ id: r.id, title: r.name, poster: r.poster, type: r.type, episodes: r.episodes })),
            related: (data?.relatedAnimes || []).map((r: any) => ({ id: r.id, title: r.name, poster: r.poster, type: r.type, episodes: r.episodes })),
            seasons: (data?.seasons || []).map((s: any) => ({ id: s.id, title: s.title, poster: s.poster, isCurrent: s.isCurrent })),
            trailers: i.promotionalVideos || []
        };
    }

    private static normalizeV3(data: any): UniversalAnime {
        const d = data?.data || data || {}; 
        const i = d.animeInfo || {};
        return {
            id: d.id || "",
            title: d.title || "Unknown Title",
            jname: d.japanese_title || "",
            poster: d.poster || "",
            description: i.Overview || "",
            isAdult: d.adultContent || false,
            stats: {
                rating: i.tvInfo?.rating || "PG-13",
                quality: i.tvInfo?.quality || "HD",
                duration: i.Duration || "?",
                type: d.showType || "TV",
                malScore: i["MAL Score"] || "?",
                episodes: { sub: parseInt(i.tvInfo?.sub || "0"), dub: parseInt(i.tvInfo?.dub || "0") }
            },
            info: {
                status: i.Status || "Unknown",
                genres: normalizeList(i.Genres),
                studios: normalizeList(i.Studios),
                producers: normalizeList(i.Producers),
                aired: i.Aired || "?",
                premiered: i.Premiered || "?",
                japanese: i.Japanese || "",
                synonyms: i.Synonyms || ""
            },
            episodes: [], characters: [], 
            recommendations: (d.recommended_data || []).map((r: any) => ({ id: r.id, title: r.title, poster: r.poster, type: r.tvInfo?.showType, episodes: { sub: r.tvInfo?.sub, dub: r.tvInfo?.dub } })),
            related: (d.related_data || []).map((r: any) => ({ id: r.id, title: r.title, poster: r.poster, type: r.tvInfo?.showType, episodes: { sub: r.tvInfo?.sub, dub: r.tvInfo?.dub } })),
            seasons: (d.seasons || []).map((s: any) => ({ id: s.id, title: s.title, poster: s.season_poster, isCurrent: false })),
            trailers: (i.trailers || []).map((t: any) => ({ title: t.title, source: t.url, thumbnail: t.thumbnail }))
        };
    }

    private static normalizeEpisodes(data: any, source: 'v2'|'v3'): UniversalEpisode[] {
        let list = source === 'v2' ? (data.episodes || []) : (data.episodes || data);
        return Array.isArray(list) ? list.map((e: any) => ({
            id: e.episodeId || e.id,
            number: e.number || e.episode_no || 0,
            title: e.title || "Episode",
            isFiller: e.isFiller || e.filler || false,
            isDub: e.isDub || false
        })) : [];
    }

    private static normalizeCharacters(data: any): UniversalCharacter[] {
        let list = data.data || data;
        return Array.isArray(list) ? list.map((c: any) => ({
            id: c.character?.id || c.id,
            name: c.character?.name || c.name,
            poster: c.character?.poster || c.imageUrl || c.poster,
            role: c.character?.cast || c.role || c.cast,
            favorites: c.character?.favorites,
            voiceActor: (c.voiceActors?.[0] || c.voiceActor) ? {
                id: c.voiceActors?.[0]?.id || c.voiceActor?.id,
                name: c.voiceActors?.[0]?.name || c.voiceActor?.name,
                poster: c.voiceActors?.[0]?.poster || c.voiceActor?.poster,
                language: c.voiceActors?.[0]?.type || c.voiceActor?.language
            } : undefined
        })) : [];
    }

    // LISTS & HOME
    static async getTopUpcoming(page = 1) { const data = await AnimeAPI_V4.getTopUpcoming(page); return data ? this.normalizeV4List(data) : []; }
    static async getRecentlyUpdated(page = 1) { const data = await AnimeAPI_V4.getRecentlyUpdated(page); return data ? this.normalizeV4List(data) : []; }
    static async getRecentlyAdded(page = 1) { const data = await AnimeAPI_V4.getRecentlyAdded(page); return data ? this.normalizeV4List(data) : []; }
    static async getCompleted(page = 1) { const data = await AnimeAPI_V4.getCompleted(page); return data ? this.normalizeV4List(data) : []; }
    static async getMostFavorite(page = 1) { const data = await AnimeAPI_V4.getMostFavorite(page); return data ? this.normalizeV4List(data) : []; }
    static async getMostPopular(page = 1) { const data = await AnimeAPI_V4.getMostPopular(page); return data ? this.normalizeV4List(data) : []; }
    static async getTopAiring(page = 1) { const data = await AnimeAPI_V4.getTopAiring(page); return data ? this.normalizeV4List(data) : []; }
    static async getSubbedAnime(page = 1) { const data = await AnimeAPI_V4.getSubbedAnime(page); return data ? this.normalizeV4List(data) : []; }
    static async getDubbedAnime(page = 1) { const data = await AnimeAPI_V4.getDubbedAnime(page); return data ? this.normalizeV4List(data) : []; }

    static async getTopTen() {
        const data: any = await AnimeAPI_V3.getTopTen();
        if (!data) return null;
        return {
            today: (data.today || []).map(this.normalizeV3TopTen),
            week: (data.week || []).map(this.normalizeV3TopTen),
            month: (data.month || []).map(this.normalizeV3TopTen)
        };
    }

    static async getUniversalRecent() {
        const data: any = await AnimeAPI_V2.getHomePage();
        return data?.recentEpisodes ? data.recentEpisodes.map((item: any) => ({ id: item.id, title: item.name, poster: item.poster, type: item.type || "TV", episodes: item.episodes || { sub: 0, dub: 0 } })) : [];
    }

   /**
 * ✅ DEDICATED HINDI RECENT
 * Handles unique structure: response.data.latestSeries/latestMovies
 */
static async getHindiRecent() {
    try {
        // Handshake with dedicated Hindi endpoint
        const response: any = await AnimeAPI_Hindi.getHome();
        
        // Safety check: The fetch utility already returns 'json.data' 
        // if the API structure is { success: true, data: { ... } }
        const intel = response?.latestSeries ? response : response?.data;

        if (!intel) {
            console.warn("Shadow Garden: Hindi Intelligence Link Null.");
            return [];
        }

        // Merge Series and Movies for the "Recent Updates" feed
        const combined = [
            ...(intel.latestSeries || []),
            ...(intel.latestMovies || [])
        ];

        return combined.map((item: any) => ({
            // Hindi API specific mapping: id, title, poster
            id: item.id,
            title: item.title,
            // Tactical URL Fix: Cleans double-slashes in poster links
            poster: item.poster ? item.poster.replace(/([^:]\/)\/+/g, "$1") : "", 
            type: item.type === 'movie' ? 'MOVIE' : 'TV',
            // Hindi API home doesn't provide ep numbers, defaulting for UI safety
            episodes: { sub: 0, dub: 0 } 
        }));
    } catch (error) {
        console.error("Hindi Data Sync Failure:", error);
        return [];
    }
}

    // CORE DATA METHODS
    static async getAnimeInfo(id: string): Promise<UniversalAnime | null> {
        const dataV2 = await AnimeAPI_V2.getAnimeInfo(id); if (dataV2) return this.normalizeV2(dataV2);
        const dataV3 = await AnimeAPI_V3.getAnimeInfo(id); if (dataV3) return this.normalizeV3(dataV3);
        return null;
    }

    static async getEpisodes(id: string): Promise<UniversalEpisode[]> {
        const dataV2: any = await AnimeAPI_V2.getEpisodes(id); if (dataV2) return this.normalizeEpisodes(dataV2, 'v2');
        const dataV3: any = await AnimeAPI_V3.getEpisodes(id); if (dataV3) return this.normalizeEpisodes(dataV3, 'v3');
        return [];
    }

    static async getCharacters(id: string) {
        const res = await AnimeAPI_V3.getAnimeCharacters(id);
        return res ? this.normalizeCharacters(res) : [];
    }

    static async getStream(episodeId: string, server = 'hd-1', category = 'sub') {
        const cleanId = episodeId.replace('::', '?');
        try {
            const v2: any = await AnimeAPI_V2.getEpisodeSources(cleanId, server, category);
            if (v2?.sources?.[0]) return { url: v2.sources[0].url, subtitles: v2.tracks || [], server: 'hd-1', isM3U8: v2.sources[0].type === 'hls' };
        } catch (e) {}
        try {
            const v3: any = await AnimeAPI_V3.getStreamingLinks(cleanId, server, category);
            if (v3?.streamingLink?.link?.file) return { url: v3.streamingLink.link.file, subtitles: v3.streamingLink.tracks || [], server: 'v3', isM3U8: v3.streamingLink.link.type === 'hls' };
        } catch (e) {}
        return null;
    }

    static async getSchedule(date: string) {
        try { const v2 = await AnimeAPI_V2.getSchedule(date); if (v2?.scheduledAnimes?.length > 0) return v2; } catch (e) {}
        try { const v3 = await AnimeAPI_V3.getSchedule(date); if (v3?.scheduledAnimes?.length > 0) return v3; } catch (e) {}
        return { scheduledAnimes: [] };
    }

    static async getSearchSuggestions(query: string) {
        const v4Data: any = await AnimeAPI_V4.getSearchSuggestions(query);
        if (v4Data?.length > 0) return v4Data.map((item: any) => ({ id: item.id, title: item.title, poster: item.poster, type: item.type || 'TV', duration: item.duration || '?' }));
        const v2Data: any = await AnimeAPI_V2.getSearchSuggestions(query);
        if (v2Data?.suggestions) return v2Data.suggestions.map((item: any) => ({ id: item.id, title: item.name, poster: item.poster, type: item.moreInfo?.[1] || 'TV', duration: item.moreInfo?.[2] || '?' }));
        return [];
    }

    static async getRandomAnime() { const data = await AnimeAPI_V3.getRandomAnime(); return data ? this.normalizeV3(data) : null; }
    static async getTopSearch() { const data: any = await AnimeAPI_V3.getTopSearch(); return data || []; }
    static async search(query: string, page = 1) { 
        const v4 = await AnimeAPI_V4.search(query, page); if (v4?.results?.length > 0) return v4;
        return await AnimeAPI_V2.search(query, page); 
    }
    static async filter(params: any) { const data = await AnimeAPI_V4.filter(params); return data ? this.normalizeV4List(data) : []; }
}

// ==========================================
//  10. OTHER APIS
// ==========================================
export class WatchlistAPI {
  static async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    if (supabase && userId !== 'guest') {
      const { data } = await supabase.from('watchlist').select('*').eq('user_id', userId);
      return data || [];
    }
    const local = typeof window !== 'undefined' ? localStorage.getItem(`watchlist_${userId}`) : null;
    return local ? JSON.parse(local) : [];
  }
  static async addToWatchlist(userId: string, animeId: string, status: WatchlistItem['status'], progress: number = 0, episodeId?: string): Promise<boolean> {
    const item: any = { anime_id: animeId, status, progress, updated_at: new Date().toISOString() };
    if (episodeId) item.episode_id = episodeId;
    if (supabase && userId !== 'guest') {
      const { error } = await supabase.from('watchlist').upsert({ user_id: userId, ...item }, { onConflict: 'user_id, anime_id' });
      return !error;
    }
    const list = await this.getUserWatchlist(userId);
    const updated = [...list.filter(i => i.anime_id !== animeId), item];
    if (typeof window !== 'undefined') localStorage.setItem(`watchlist_${userId}`, JSON.stringify(updated));
    return true;
  }
}

export class UserAPI {
  static async getCurrentUser(): Promise<AppUser | null> {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return { id: session.user.id, email: session.user.email, user_metadata: session.user.user_metadata };
      }
    }
    return null;
  }
  static async signIn(email: string, password: string) { return supabase ? await supabase.auth.signInWithPassword({ email, password }) : { data: null, error: null }; }
  static async signUp(email: string, password: string, username: string) { 
      return supabase ? await supabase.auth.signUp({ email, password, options: { data: { username, full_name: username } } }) : { data: null, error: null }; 
  }
  static async signOut() { if (supabase) await supabase.auth.signOut(); }
}

export class ImageAPI {
  static async uploadImage(file: File): Promise<string> {
    const API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || '1DL4pRCKKmg238fsCU6i7ZYEStP9fL9o4q'; 
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, { method: 'POST', body: formData });
    const data = await response.json();
    return data.success ? data.data.url : '';
  }
}