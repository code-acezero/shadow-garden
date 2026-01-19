import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables');
}

// --- SINGLETON CLEANUP ---
const globalForSupabase = global as unknown as { supabase: ReturnType<typeof createClient> };

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
//  1. CONFIGURATION & POOLS
// ==========================================

const BASE_URL = 'https://consumet-api-hianime.vercel.app/anime/hianime';

// [LOAD BALANCING] URL Pools for V2 & V3
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

// Fisher-Yates Shuffle
const shuffleArray = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// [SMART FETCH] Retries mirrors if one fails
async function fetchWithFailover(urlPool: string[], endpoint: string, params: Record<string, any> = {}): Promise<any | null> {
    const shuffledPool = shuffleArray([...urlPool]); // Randomize entry point
    
    // Construct Query String
    const queryParts = Object.keys(params)
        .filter(k => params[k] !== undefined && params[k] !== null)
        .map(key => `${key}=${encodeURIComponent(String(params[key]))}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    for (const baseUrl of shuffledPool) {
        try {
            const targetUrl = `${baseUrl}${endpoint}${queryString}`;
            const proxyUrl = typeof window !== 'undefined' ? `/api/proxy?url=${encodeURIComponent(targetUrl)}` : targetUrl;
            
            // Timeout to force switch if slow (5 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) continue; // Try next mirror

            const json = await response.json();
            if (json.status === 200 || json.success === true) {
                return json.data || json.results || json; // Return successful payload
            }
        } catch (error) {
            continue; // Silently failover to next mirror
        }
    }
    return null; // All mirrors failed
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
    poster: string;
    type: string;
    episodes?: number | { sub: number; dub: number };
}

export interface UniversalSeason {
    id: string;
    title: string;
    poster: string;
    isCurrent: boolean;
}

export interface UniversalStream {
    url: string;
    headers?: Record<string, string>;
    subtitles: { file: string; label: string; kind: string; default?: boolean }[];
    intro?: { start: number; end: number };
    outro?: { start: number; end: number };
    server: string;
    isM3U8: boolean;
    quality?: string;
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
//  5. API V2 (PRIMARY POOL)
// ==========================================
export class AnimeAPI_V2 {
  // Uses POOL_V2 with Automatic Failover
  private static async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    return fetchWithFailover(POOL_V2, endpoint, params);
  }
  static async getHomePage() { return this.request('/home'); }
  static async getAnimeInfo(animeId: string) { return this.request(`/anime/${animeId}`); }
  static async search(query: string, page = 1) { return this.request('/search', { q: query, page }); }
  static async getEpisodes(animeId: string) { return this.request(`/anime/${animeId}/episodes`); }
  static async getNextEpisodeSchedule(animeId: string) { return this.request(`/anime/${animeId}/next-episode-schedule`); }
  static async getEpisodeServers(animeEpisodeId: string) { return this.request('/episode/servers', { animeEpisodeId }); }
  static async getEpisodeSources(animeEpisodeId: string, server = 'hd-1', category = 'sub') { return this.request('/episode/sources', { animeEpisodeId, server, category }); }
}

// ==========================================
//  6. API V3 (METADATA POOL)
// ==========================================
export class AnimeAPI_V3 {
  // Uses POOL_V3 with Automatic Failover
  private static async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    return fetchWithFailover(POOL_V3, endpoint, params);
  }
  static async getHomeInfo() { return this.request('/'); }
  static async getAnimeInfo(id: string) { return this.request('/info', { id }); }
  static async search(keyword: string) { return this.request('/search', { keyword }); }
  static async getAnimeCharacters(id: string, page = 1) { return this.request(`/character/list/${id}`, { page }); }
  static async getCharacterDetails(id: string) { return this.request(`/character/${id}`); }
  static async getVoiceActorDetails(id: string) { return this.request(`/actors/${id}`); }
  static async getEpisodes(id: string) { return this.request(`/episodes/${id}`); }
  static async getStreamingLinks(id: string, server: string, type: string) { return this.request('/stream', { id, server, type }); }
}

// ==========================================
//  7. API V4 (FAST & SPECIALIZED)
// ==========================================
export class AnimeAPI_V4 {
  private static async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    // V4 is single source but fast
    return fetchWithFailover([BASE_URL_V4], endpoint, params); 
  }
  static async getHome() { return this.request('/home'); }
  static async getTopAiring(page = 1) { return this.request('/animes/top-airing', { page }); }
  static async getMostPopular(page = 1) { return this.request('/animes/most-popular', { page }); }
  static async getRecentlyUpdated(page = 1) { return this.request('/animes/recently-updated', { page }); }
  static async getAnimeDetail(id: string) { return this.request(`/anime/${id}`); }
  static async search(keyword: string, page = 1) { return this.request('/search', { keyword, page }); }
  static async getEpisodes(id: string) { return this.request(`/episodes/${id}`); }
  static async getStream(id: string, server = 'hd-2', type = 'sub') { return this.request('/stream', { id, server, type }); }
}

// ==========================================
//  8. API HINDI (DEDICATED)
// ==========================================
export class AnimeAPI_Hindi {
  private static async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
      return fetchWithFailover([BASE_URL_HINDI], endpoint, params);
  }
  static async getHome() { return this.request('/home'); }
  static async search(keyword: string, page = 1) { return this.request('/search', { keyword, page }); }
  static async getAnimeDetails(id: string) { return this.request(`/anime/${id}`); }
}

// ==========================================
//  9. ANIME SERVICE (THE ORCHESTRATOR)
// ==========================================

export class AnimeService {

    private static toSlug(id: string): string { return id.replace(/-\d+$/, ''); }

    // --- NORMALIZERS ---

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
            recommendations: (data?.recommendedAnimes || []).filter(Boolean).map((r: any) => ({ id: r.id, title: r.name, poster: r.poster, type: r.type, episodes: r.episodes })),
            related: (data?.relatedAnimes || []).filter(Boolean).map((r: any) => ({ id: r.id, title: r.name, poster: r.poster, type: r.type, episodes: r.episodes })),
            seasons: (data?.seasons || []).filter(Boolean).map((s: any) => ({ id: s.id, title: s.title, poster: s.poster, isCurrent: s.isCurrent })),
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
            recommendations: (d.recommended_data || []).filter(Boolean).map((r: any) => ({ id: r.id, title: r.title, poster: r.poster, type: r.tvInfo?.showType, episodes: { sub: r.tvInfo?.sub, dub: r.tvInfo?.dub } })),
            related: (d.related_data || []).filter(Boolean).map((r: any) => ({ id: r.id, title: r.title, poster: r.poster, type: r.tvInfo?.showType, episodes: { sub: r.tvInfo?.sub, dub: r.tvInfo?.dub } })),
            seasons: (d.seasons || []).filter(Boolean).map((s: any) => ({ id: s.id, title: s.title, poster: s.season_poster, isCurrent: false })),
            trailers: (i.trailers || []).filter(Boolean).map((t: any) => ({ title: t.title, source: t.url, thumbnail: t.thumbnail }))
        };
    }

    private static normalizeCharacters(data: any): UniversalCharacter[] {
        if (!data) return [];
        let list = data.data || data;
        if (!Array.isArray(list)) return [];

        return list.filter(Boolean).map((c: any) => ({
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
        }));
    }

    private static normalizeEpisodes(data: any, source: 'v2'|'v3'): UniversalEpisode[] {
        if (!data) return [];
        let list = source === 'v2' ? (data.episodes || []) : (data.episodes || data);
        if (!Array.isArray(list)) return [];

        return list.filter(Boolean).map((e: any) => ({
            id: e.episodeId || e.id,
            number: e.number || e.episode_no || 0,
            title: e.title || "Episode",
            isFiller: e.isFiller || e.filler || false,
            isDub: e.isDub || false
        }));
    }

    private static normalizeTracks(tracks: any[]): { file: string; label: string; kind: string; default?: boolean }[] {
        if (!Array.isArray(tracks)) return [];
        return tracks
            .filter(t => t.kind !== "thumbnails" && t.label !== "thumbnails")
            .map(t => ({
                file: t.file || t.url,
                label: t.label || t.lang || "Unknown",
                kind: "captions",
                default: !!t.default
            }));
    }

    // --- ORCHESTRATION ---

    // 1. ANIME INFO - Locked to V2 & V3 for Stability
    static async getAnimeInfo(id: string): Promise<UniversalAnime | null> {
        // Priority: V2 (Layout) -> V3 (Metadata)
        const pool = [AnimeAPI_V2, AnimeAPI_V3]; 
        
        for (const api of pool) {
            try {
                // @ts-ignore
                const data = await api.getAnimeInfo(id);
                if (data) {
                    if (api === AnimeAPI_V2) return this.normalizeV2(data);
                    if (api === AnimeAPI_V3) return this.normalizeV3(data);
                }
            } catch (e) { continue; }
        }
        return null;
    }

    // 2. EPISODES - Locked to V2 & V3 (Matches Info)
    static async getEpisodes(id: string): Promise<UniversalEpisode[]> {
        const pool = [AnimeAPI_V2, AnimeAPI_V3];
        for (const api of pool) {
            try {
                // @ts-ignore
                const data = await api.getEpisodes(id);
                if (data) {
                    if (api === AnimeAPI_V2) return this.normalizeEpisodes(data, 'v2');
                    if (api === AnimeAPI_V3) return this.normalizeEpisodes(data, 'v3');
                }
            } catch(e) { continue; }
        }
        return [];
    }

    // 3. CHARACTERS - Locked to V3 (Completeness)
    static async getCharacters(id: string): Promise<UniversalCharacter[]> {
        try {
            const res = await AnimeAPI_V3.getAnimeCharacters(id);
            if (res) return this.normalizeCharacters(res);
        } catch(e) {}
        return [];
    }

    // 4. STREAMING - RACE CONDITION (V2, V3, V4)
    // Instantly returns the first API that responds with a valid link
    static async getStream(episodeId: string, server = 'hd-1', category = 'sub') {
        const cleanId = episodeId.replace('::', '?');
        
        // Define the Promises for the Race
        const promises = [
            // V2 Promise
            (async () => {
                const v2: any = await AnimeAPI_V2.getEpisodeSources(cleanId, server, category as any);
                if (v2 && v2.sources?.[0]) return {
                    url: v2.sources[0].url,
                    headers: v2.headers,
                    subtitles: this.normalizeTracks(v2.tracks),
                    intro: v2.intro, outro: v2.outro,
                    server: 'hd-1', isM3U8: v2.sources[0].type === 'hls'
                };
                throw new Error("V2 Failed");
            })(),
            
            // V3 Promise
            (async () => {
                const v3: any = await AnimeAPI_V3.getStreamingLinks(cleanId, server, category);
                const sl = v3?.streamingLink;
                if (sl?.link?.file) return {
                    url: sl.link.file,
                    subtitles: this.normalizeTracks(sl.tracks),
                    intro: sl.intro, outro: sl.outro,
                    server: 'v3', isM3U8: sl.link.type === 'hls'
                };
                throw new Error("V3 Failed");
            })(),

            // V4 Promise
            (async () => {
                const v4: any = await AnimeAPI_V4.getStream(cleanId, server, category);
                const d = v4?.data;
                if (d?.link?.file) return {
                    url: d.link.file,
                    subtitles: this.normalizeTracks(d.tracks),
                    intro: d.intro, outro: d.outro,
                    server: 'v4', isM3U8: d.link.type === 'hls'
                };
                throw new Error("V4 Failed");
            })()
        ];

        try {
            // Using Promise.any to get the first *successful* result
            return await Promise.any(promises);
        } catch (e) {
            console.error("All streams failed");
            return null;
        }
    }

    // --- OTHER METHODS ---
    static async getSpotlight() {
        // Randomize Home Load
        const pool = Math.random() > 0.5 ? AnimeAPI_V2 : AnimeAPI_V4;
        try {
             // @ts-ignore
             const data = await pool[pool === AnimeAPI_V2 ? 'getHomePage' : 'getHome']();
             return data;
        } catch(e) { return null; }
    }
    
    static async search(query: string) {
        // Simple rotation
        const api = Math.random() > 0.5 ? AnimeAPI_V2 : AnimeAPI_V3;
        // @ts-ignore
        try { return await api.search(query); } catch(e) { return null; }
    }
    
    static async getRecentReleases() { return AnimeAPI_V4.getRecentlyUpdated(1); }
}

// ... Services (Watchlist, User, Image) remain unchanged ...
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return { id: user.id, email: user.email, user_metadata: user.user_metadata };
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