import { supabase } from "@/lib/supabase";

// ==========================================================================
//  MIGRATION NOTE (read this before touching anything below)
// ==========================================================================
//  The old backend (consumet-api-hianime + the hianime-api-v2/v3/v4 mirror
//  pools) is completely dead — every one of those hosts is down. This file
//  now talks to a single new source instead: the Anikoto API
//  (https://anikoto-api-ivory.vercel.app), which scrapes anikoto.net.
//
//  The new API is a DIFFERENT SHAPE from the old one (slug-based instead of
//  opaque encrypted IDs, no character data, related/recommendations are
//  separate endpoints, etc). To avoid breaking every component that
//  consumes `AnimeService` / the `Universal*` types, all of that is
//  normalized back into the exact same Universal* interfaces the rest of
//  the app already expects. `AnimeService`'s method names and return
//  shapes are unchanged — only what happens inside them changed.
//
//  IMPORTANT: I hit the live API directly (not just its docs) before
//  writing this, because the bundled Swagger docs turned out to be stale
//  in several places. Notable discrepancies found:
//    - /api/anime/:slug/episodes items have NO `title` field (docs claim
//      one exists). Only number/href/id/dataIds/dataMal/dataTimestamp/
//      hasDub/hasSub come back. We synthesize "Episode N" as a title.
//    - /api/genre, /api/type, /api/latest, /api/status all actually return
//      `{ results, topRated?, currentPage, hasNextPage, hasPreviousPage,
//      minPage, maxPage }` — NOT the flat `AnimeCard[]` the docs show for
//      /api/latest and /api/status. Parsing below is defensive and accepts
//      either shape just in case a given endpoint really does return a
//      bare array some day.
//    - /api/search has no `totalResults` field despite the docs.
//    - /api/anime/:slug/related entries are inconsistent — some have no
//      `id`/`slug` at all (only an `href` pointing at a filter/search page
//      for unindexed titles). Those are kept but won't be clickable to a
//      detail page; filtered defensively where needed.
//    - /api/watch and /api/anime/tooltip/:id could not be live-verified
//      (blocked by this environment's fetch tool), so their parsing below
//      follows the documented schema with defensive fallbacks — please
//      sanity check these two against a real response if playback or
//      tooltips look off.
// ==========================================================================

// ==========================================
//  1. CONFIGURATION (✅ EXPORTED)
// ==========================================

/** Base URL for the new Anikoto API. Everything now flows through here. */
export const BASE_URL = 'https://anikoto-api-ivory.vercel.app/api';

/** @deprecated Dead mirror pool from the old HiAnime backend. Kept as an empty
 * export only so any stray `import { POOL_V2 } from ...` elsewhere doesn't
 * break the build. Not used anywhere in this file anymore. */
export const POOL_V2: string[] = [];
/** @deprecated see POOL_V2 */
export const POOL_V3: string[] = [];
/** @deprecated see POOL_V2 — now just aliases BASE_URL */
export const BASE_URL_V4 = BASE_URL;

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

/**
 * Generic fetcher for the Anikoto API. Builds a query string (array values
 * are serialized as `key[]=a&key[]=b`, matching /api/filter's expected
 * format), goes through the app's own `/api/proxy` route client-side to
 * dodge CORS (same pattern the old code used — this is NOT Anikoto's own
 * `/api/proxy` streaming proxy, it's this app's internal one), and unwraps
 * the `{ ok, data }` / `{ ok, cached, data }` envelope every Anikoto
 * endpoint returns (or raw arrays like /api/watch).
 */
async function fetchAnikoto<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    const queryParts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
            for (const v of value) {
                if (v === undefined || v === null || v === '') continue;
                queryParts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(v))}`);
            }
        } else {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const targetUrl = `${BASE_URL}${endpoint}${queryString}`;
    const proxyUrl = typeof window !== 'undefined' ? `/api/proxy?url=${encodeURIComponent(targetUrl)}` : targetUrl;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased to 20s for stream resolution

        try {
            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) return null;

            const json = await response.json();
            
            // Allow raw arrays/objects through and aggressively unwrap proxy objects
            if (json && typeof json === 'object') {
                if ('ok' in json) {
                    return json.ok ? (json.data ?? json) : null;
                }
                if ('data' in json && Array.isArray(json.data)) {
                    return json.data;
                }
            }
            return json as T;

        } catch (innerError: any) {
            if (innerError.name === 'AbortError') return null;
            throw innerError;
        }
    } catch {
        return null;
    }
}

/**
 * SSE (Server-Sent Events) fetcher for the Anikoto /watch endpoint.
 * The /watch endpoint returns data as an SSE stream (`data: {...}\n\n`)
 * instead of standard JSON. This function reads the full response as text,
 * parses each `data: ` prefixed line as JSON, and collects all parsed
 * objects into an array — matching the shape getStream expects.
 */
async function fetchAnikotoSSE(endpoint: string, params: Record<string, any> = {}): Promise<any[] | null> {
    const queryParts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
            for (const v of value) {
                if (v === undefined || v === null || v === '') continue;
                queryParts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(v))}`);
            }
        } else {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const targetUrl = `${BASE_URL}${endpoint}${queryString}`;
    const proxyUrl = typeof window !== 'undefined' ? `/api/proxy?url=${encodeURIComponent(targetUrl)}` : targetUrl;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s for SSE stream resolution

        try {
            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) return null;

            const text = await response.text();

            // First, try parsing as standard JSON (in case the API or proxy
            // already collapsed the SSE stream into a single JSON response)
            try {
                const json = JSON.parse(text);
                // Unwrap { ok, data } envelope if present
                if (json && typeof json === 'object' && !Array.isArray(json)) {
                    if ('ok' in json) {
                        const inner = json.ok ? (json.data ?? json) : null;
                        return inner ? (Array.isArray(inner) ? inner : [inner]) : null;
                    }
                    if ('data' in json && Array.isArray(json.data)) {
                        return json.data;
                    }
                }
                return Array.isArray(json) ? json : [json];
            } catch {
                // Not valid JSON — parse as SSE stream
            }

            // Parse SSE: each event is `data: <json>\n\n`
            const results: any[] = [];
            const lines = text.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) continue;
                const jsonStr = trimmed.slice(5).trim(); // Remove 'data:' prefix
                if (!jsonStr) continue;
                try {
                    const parsed = JSON.parse(jsonStr);
                    results.push(parsed);
                } catch {
                    // Skip malformed lines
                }
            }
            return results.length > 0 ? results : null;

        } catch (innerError: any) {
            if (innerError.name === 'AbortError') return null;
            throw innerError;
        }
    } catch {
        return null;
    }
}

/**
 * Defensive unwrapper for the listing endpoints (genre/type/latest/status/
 * filter). Live testing showed these actually return
 * `{ results, topRated?, currentPage, hasNextPage, hasPreviousPage,
 * minPage, maxPage }`, but the docs claim a bare array for /latest and
 * /status — so this accepts either.
 */
function extractPaged(data: any): {
    results: any[];
    topRated?: any[];
    currentPage?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    minPage?: number;
    maxPage?: number;
} {
    if (!data) return { results: [] };
    if (Array.isArray(data)) return { results: data };
    return {
        results: Array.isArray(data.results) ? data.results : [],
        topRated: data.topRated,
        currentPage: data.currentPage,
        hasNextPage: data.hasNextPage,
        hasPreviousPage: data.hasPreviousPage,
        minPage: data.minPage,
        maxPage: data.maxPage
    };
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
//  3. UNIVERSAL INTERFACES (unchanged — this is the contract the rest of
//     the app depends on. Do not rename fields here without updating every
//     consumer.)
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
    isAdult?: boolean;
    rating?: string;
}

export interface UniversalSeason {
    id: string;
    title: string;
    poster: string;
    isCurrent: boolean;
}

// ==========================================
//  4. ANIKOTO API CLIENT (raw endpoint wrappers)
// ==========================================
export class AnimeAPI_Anikoto {
    static async getHome() { return fetchAnikoto('/home'); }

    static async search(keyword: string, page = 1) {
        return fetchAnikoto('/search', { keyword, page });
    }

    static async filter(params: Record<string, any>) {
        const { type, ...rest } = params;
        const query: Record<string, any> = { ...rest };
        if (type !== undefined) query.term_type = type;
        return fetchAnikoto('/filter', query);
    }

    static async getAnimeDetail(slug: string, start?: number | string, end?: number | string) {
        return fetchAnikoto(`/anime/${encodeURIComponent(slug)}`, { start, end });
    }

    static async getEpisodes(slug: string, start?: number | string, end?: number | string) {
        return fetchAnikoto(`/anime/${encodeURIComponent(slug)}/episodes`, { start, end });
    }

    static async getRelated(slug: string) {
        return fetchAnikoto(`/anime/${encodeURIComponent(slug)}/related`);
    }

    static async getRecommendations(slug: string) {
        return fetchAnikoto(`/anime/${encodeURIComponent(slug)}/recommendations`);
    }

    static async getTooltip(id: string) {
        return fetchAnikoto(`/anime/tooltip/${encodeURIComponent(id)}`);
    }

    static async getLatest(type: 'latest-updated' | 'new-release' | 'most-viewed' = 'latest-updated', page = 1) {
        return fetchAnikoto('/latest', { type, page });
    }

    static async getStatus(type: 'currently-airing' | 'finished-airing' | 'not-yet-aired' = 'currently-airing', page = 1) {
        return fetchAnikoto('/status', { type, page });
    }

    static async getGenre(genre: string, page = 1) {
        return fetchAnikoto(`/genre/${encodeURIComponent(genre)}`, { page });
    }

    static async getType(type: string, page = 1) {
        return fetchAnikoto(`/type/${encodeURIComponent(type)}`, { page });
    }

    static async getSchedule(tz?: number, images?: boolean) {
        return fetchAnikoto('/schedule', { tz, images });
    }

    static async getWatch(slug: string, ep: number | string) {
        return fetchAnikotoSSE(`/watch/${encodeURIComponent(slug)}`, { ep });
    }
}

// ==========================================
//  5. RAW -> UNIVERSAL NORMALIZERS
// ==========================================

function normalizeCard(item: any): UniversalAnimeBase {
    return {
        id: item?.slug || item?.id || '',
        title: item?.title || 'Unknown Title',
        jname: item?.titleJp || '',
        poster: item?.image || '',
        type: item?.type || 'TV',
        duration: item?.date,
        episodes: {
            sub: item?.episodes?.sub ?? 0,
            dub: item?.episodes?.dub ?? 0,
            eps: item?.episodes?.total
        },
        rank: item?.rank,
        isAdult: false,
        rating: item?.rating
    };
}

export class AnimeService {

    private static normalizeEpisodeList(list: any[], slug: string): UniversalEpisode[] {
        return Array.isArray(list) ? list.map((e: any) => ({
            id: `${slug}::${e.number}`,
            number: parseInt(e.number, 10) || 0,
            title: e.title || `Episode ${e.number}`,
            isFiller: false,
            isDub: !!e.hasDub
        })) : [];
    }

    private static normalizeRelated(list: any[]): UniversalAnimeBase[] {
        return Array.isArray(list) ? list
            .filter((r: any) => r && (r.slug || r.id))
            .map((r: any) => ({
                id: r.slug || r.id,
                title: r.title || 'Unknown Title',
                jname: r.titleJp || '',
                poster: r.image || '',
                type: r.relation || 'Related'
            })) : [];
    }

    private static normalizeDetail(data: any): UniversalAnime {
        const slug = data?.slug || data?.id || '';
        return {
            id: slug,
            title: data?.title || 'Unknown Title',
            jname: data?.titleJp || '',
            poster: data?.image || '',
            description: data?.synopsis || '',
            isAdult: false,
            stats: {
                rating: data?.rating || '?',
                quality: data?.quality || 'HD',
                duration: data?.duration || '?',
                type: data?.type || 'TV',
                malScore: data?.malScore != null ? String(data.malScore) : '?',
                episodes: {
                    sub: data?.hasSub ? 1 : 0,
                    dub: data?.hasDub ? 1 : 0
                }
            },
            info: {
                status: data?.status || 'Unknown',
                genres: normalizeList(data?.genres),
                studios: normalizeList(data?.studios),
                producers: normalizeList(data?.producers),
                aired: data?.aired || '?',
                premiered: data?.premiered || '?',
                japanese: data?.titleJp || '',
                synonyms: Array.isArray(data?.alternativeTitles) ? data.alternativeTitles.join(', ') : ''
            },
            episodes: data?.episodes?.episodes ? this.normalizeEpisodeList(data.episodes.episodes, slug) : [],
            characters: [],
            recommendations: [],
            related: [],
            seasons: [],
            trailers: []
        };
    }

    static async getUniversalRecent() {
        const home: any = await AnimeAPI_Anikoto.getHome();
        return Array.isArray(home?.latestEpisodes) ? home.latestEpisodes.map(normalizeCard) : [];
    }

    static async getHomeSections() {
        const home: any = await AnimeAPI_Anikoto.getHome();
        if (!home) return { spotlight: [], recent: [] };
        const spotlight = Array.isArray(home.spotlight) ? home.spotlight.map((item: any) => ({
            ...normalizeCard(item),
            description: item?.synopsis || item?.description || ''
        })) : [];
        const recent = Array.isArray(home.latestEpisodes) ? home.latestEpisodes.map(normalizeCard) : [];
        return { spotlight, recent };
    }

    static async getTopTen() {
        const home: any = await AnimeAPI_Anikoto.getHome();
        if (!home) return null;
        return {
            today: Array.isArray(home.topDay) ? home.topDay.map(normalizeCard) : [],
            week: Array.isArray(home.topWeek) ? home.topWeek.map(normalizeCard) : [],
            month: Array.isArray(home.topMonth) ? home.topMonth.map(normalizeCard) : []
        };
    }

    static async getTopSearch() {
        const home: any = await AnimeAPI_Anikoto.getHome();
        return Array.isArray(home?.topDay) ? home.topDay.map(normalizeCard) : [];
    }

    static async getRandomAnime(): Promise<UniversalAnime | null> {
        const home: any = await AnimeAPI_Anikoto.getHome();
        const pool = [...(home?.spotlight || []), ...(home?.topDay || [])];
        if (!pool.length) return null;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const slug = pick?.slug || pick?.id;
        return slug ? this.getAnimeInfo(slug) : null;
    }

    static async getTopUpcoming(page = 1) {
        const data: any = await AnimeAPI_Anikoto.getStatus('not-yet-aired', page);
        return extractPaged(data).results.map(normalizeCard);
    }

    static async getRecentlyUpdated(page = 1) {
        const data: any = await AnimeAPI_Anikoto.getLatest('latest-updated', page);
        return extractPaged(data).results.map(normalizeCard);
    }

    static async getRecentlyAdded(page = 1) {
        const data: any = await AnimeAPI_Anikoto.getLatest('new-release', page);
        return extractPaged(data).results.map(normalizeCard);
    }

    static async getCompleted(page = 1) {
        const data: any = await AnimeAPI_Anikoto.getStatus('finished-airing', page);
        return extractPaged(data).results.map(normalizeCard);
    }

    static async getMostFavorite(page = 1) {
        const data: any = await AnimeAPI_Anikoto.getLatest('most-viewed', page);
        return extractPaged(data).results.map(normalizeCard);
    }

    static async getMostPopular(page = 1) {
        const data: any = await AnimeAPI_Anikoto.getLatest('most-viewed', page);
        return extractPaged(data).results.map(normalizeCard);
    }

    static async getTopAiring(page = 1) {
        const data: any = await AnimeAPI_Anikoto.getStatus('currently-airing', page);
        return extractPaged(data).results.map(normalizeCard);
    }

    static async getSubbedAnime(page = 1) {
        const data: any = await AnimeAPI_Anikoto.filter({ language: ['sub'], page });
        return extractPaged(data).results.map(normalizeCard);
    }

    static async getDubbedAnime(page = 1) {
        const data: any = await AnimeAPI_Anikoto.filter({ language: ['dub'], page });
        return extractPaged(data).results.map(normalizeCard);
    }

    static async getFilteredAnime(category: string, page = 1) {
        let rawData: any;
        
        switch (category) {
            case 'sub':
                rawData = await AnimeAPI_Anikoto.filter({ language: ['sub'], page });
                break;
            case 'dub':
                rawData = await AnimeAPI_Anikoto.filter({ language: ['dub'], page });
                break;
            case 'trending':
                rawData = await AnimeAPI_Anikoto.getTrending(page);
                break;
            case 'popular':
                rawData = await AnimeAPI_Anikoto.getMostPopular(page);
                break;
            case 'recent':
                rawData = await AnimeAPI_Anikoto.getLatest('latest-updated', page);
                break;
            case 'completed':
                rawData = await AnimeAPI_Anikoto.getLatest('latest-completed', page);
                break;
            default:
                // Default to all/recent if category is unknown or "all"
                rawData = await AnimeAPI_Anikoto.getLatest('latest-updated', page);
                break;
        }

        const paged = extractPaged(rawData);
        return {
            results: paged.results.map(normalizeCard),
            currentPage: paged.currentPage ?? page,
            hasNextPage: paged.hasNextPage ?? false,
            hasPreviousPage: paged.hasPreviousPage ?? false,
            maxPage: paged.maxPage,
            minPage: paged.minPage
        };
    }

    static async getByGenre(genre: string, page = 1) {
        const data: any = await AnimeAPI_Anikoto.getGenre(genre, page);
        return extractPaged(data).results.map(normalizeCard);
    }

    static async getByType(type: string, page = 1) {
        const data: any = await AnimeAPI_Anikoto.getType(type, page);
        return extractPaged(data).results.map(normalizeCard);
    }

    static async search(query: string, page = 1) {
        const data: any = await AnimeAPI_Anikoto.search(query, page);
        const paged = extractPaged(data);
        return {
            results: paged.results.map(normalizeCard),
            currentPage: paged.currentPage ?? page,
            hasNextPage: paged.hasNextPage ?? false,
            hasPreviousPage: paged.hasPreviousPage ?? false,
            maxPage: paged.maxPage,
            minPage: paged.minPage
        };
    }

    static async getSearchSuggestions(query: string) {
        const data: any = await AnimeAPI_Anikoto.search(query, 1);
        const paged = extractPaged(data);
        return paged.results.slice(0, 8).map((item: any) => ({
            id: item?.slug || item?.id || '',
            title: item?.title || 'Unknown Title',
            poster: item?.image || '',
            type: item?.type || 'TV',
            duration: item?.date || '?'
        }));
    }

    static async filter(params: Record<string, any>) {
        const data: any = await AnimeAPI_Anikoto.filter(params);
        return extractPaged(data).results.map(normalizeCard);
    }

    static async getAnimeInfo(slug: string): Promise<UniversalAnime | null> {
        const [detail, related, recommendations] = await Promise.all([
            AnimeAPI_Anikoto.getAnimeDetail(slug),
            AnimeAPI_Anikoto.getRelated(slug).catch(() => null),
            AnimeAPI_Anikoto.getRecommendations(slug).catch(() => null)
        ]);
        if (!detail) return null;

        const normalized = this.normalizeDetail(detail);
        normalized.related = this.normalizeRelated(related as any);
        normalized.recommendations = Array.isArray(recommendations) ? (recommendations as any[]).map(normalizeCard) : [];
        return normalized;
    }

    static async getEpisodes(slug: string): Promise<UniversalEpisode[]> {
        const data: any = await AnimeAPI_Anikoto.getEpisodes(slug);
        return data?.episodes ? this.normalizeEpisodeList(data.episodes, data.slug || slug) : [];
    }

    static async getCharacters(_slug: string): Promise<UniversalCharacter[]> {
        return [];
    }

    static async getStream(episodeId: string, server = 'VidPlay-1', category: 'sub' | 'dub' = 'sub') {
        const [slug, epNumber] = episodeId.split('::');
        if (!slug || !epNumber) return null;

        let data: any = await AnimeAPI_Anikoto.getWatch(slug, epNumber);
        
        // Aggressive unwrapping for stringified proxy responses
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch(e){}
        }
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            if (data.data) data = data.data; 
        }
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch(e){}
        }

        if (!data || !Array.isArray(data)) return null;

        // 1. Group Servers from the EXACT SAME response
        const serversBlock = data.find((item: any) => item.type === 'servers');
        const list: any[] = serversBlock && Array.isArray(serversBlock.servers) ? serversBlock.servers : [];
        const grouped: { sub: any[]; dub: any[]; raw: any[] } = { sub: [], dub: [], raw: [] };
        for (const s of list) {
            const bucket: 'sub' | 'dub' | 'raw' = s?.type === 'dub' ? 'dub' : s?.type === 'raw' ? 'raw' : 'sub';
            grouped[bucket].push({ serverId: s?.id ?? s?.svId, serverName: s?.name });
        }

        // 2. Extract Stream Sources
        const sources = data
            .filter((item: any) => item.type === 'source' && item.source)
            .map((item: any) => item.source);

        const byCategory = sources.filter(s => s?.type === category);
        
        // Even if no stream matched, return the server list so UI can render the dropdown
        if (!byCategory.length) return { servers: grouped, url: null };

        const matched =
            byCategory.find(s => s?.server?.toLowerCase() === server.toLowerCase() && (s.proxyUrl || s.m3u8 || s.url)) ||
            byCategory.find(s => s.proxyUrl || s.m3u8 || s.url) ||
            byCategory[0];
            
        if (!matched) return { servers: grouped, url: null };

        const skipBlock = data.find((item: any) => item.type === 'skip_data');
        const skip = skipBlock ? skipBlock.skip_data : null;

        return {
            url: matched.proxyUrl || matched.m3u8 || matched.url,
            subtitles: matched.tracks ? matched.tracks.map((t: any) => ({
                ...t,
                file: t.proxyUrl || t.file
            })) : [],
            server: matched.server || server,
            servers: grouped, // ✅ Server list attached to stream payload
            isM3U8: !!matched.m3u8 || !!(matched.proxyUrl && matched.proxyUrl.includes('m3u8')),
            referer: matched.referer || null,
            intro: skip?.intro || null,
            outro: skip?.outro || null,
            skipData: skip
        };
    }

    /** @deprecated Now handled dynamically inside getStream to avoid double network requests */
    static async getEpisodeServers(episodeId: string) {
        return null;
    }

    static async getSchedule(date: string, tzOffsetHours = 0) {
        const data: any = await AnimeAPI_Anikoto.getSchedule(tzOffsetHours, true);
        if (!Array.isArray(data)) return { scheduledAnimes: [] };

        let targetLabel: string | null = null;
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
            targetLabel = parsed.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' });
        }

        const day = data.find((d: any) => d.day === targetLabel) || data[0];
        const animes = Array.isArray(day?.animes) ? day.animes : [];

        return {
            scheduledAnimes: animes.map((item: any) => ({
                id: item?.slug || item?.id || '',
                time: item?.date || '',
                name: item?.title || 'Unknown Title',
                jname: item?.titleJp || '',
                timestamp: null,
                secondsUntilAiring: null,
                episode: item?.type || ''
            }))
        };
    }

    static async getTooltip(id: string) {
        return AnimeAPI_Anikoto.getTooltip(id);
    }
}

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

  static async signIn(email: string, password: string) {
    return supabase ? await supabase.auth.signInWithPassword({ email, password }) : { data: null, error: null };
  }

  static async signUp(email: string, password: string, username: string) {
    return supabase ? await supabase.auth.signUp({ email, password, options: { data: { username, full_name: username } } }) : { data: null, error: null };
  }

  static async signOut() {
      if (supabase) {
          await supabase.auth.signOut();
          if (typeof window !== 'undefined') {
              localStorage.removeItem('shadow_garden_auth');
              sessionStorage.clear();
          }
      }
  }
}

export class ImageAPI {
  static async uploadImage(file: File): Promise<string> {
    const env = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
    const API_KEY = env?.process?.env?.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!API_KEY) {
      console.error('⚠️ IMGBB_API_KEY not found in environment variables');
      throw new Error('Image upload service is not configured');
    }
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error('Image upload failed');
      return data.data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }
}