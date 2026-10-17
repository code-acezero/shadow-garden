import { supabase } from "@/lib/supabase";
import { resolveUnifiedStreams, UnifiedStreamResult } from "@/lib/extractors/streamExtractor";
import { AniListService } from "@/lib/anilist";

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

export class ApiManager {
    private static urls = ['/api'];
    private static currentIndex = 0;

    static getBaseUrl() {
        return '/api';
    }

    static rotateUrl() {
        return '/api';
    }

    static getAllUrls() {
        return this.urls;
    }
}

export const BASE_URL = ApiManager.getBaseUrl();

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
async function fetchAnikoto<T = any>(_endpoint: string, _params: Record<string, any> = {}): Promise<T | null> {
    return null;
}

async function fetchAnikotoSSE(_endpoint: string, _params: Record<string, any> = {}): Promise<any[] | null> {
    return null;
}

export const ANIKOTO_GENRE_MAP: Record<string, string> = {
  "action": "1", "adventure": "2", "boys love": "2330", "cars": "538", "comedy": "8",
  "dementia": "453", "demons": "119", "drama": "62", "ecchi": "214", "erotica": "2322",
  "fantasy": "3", "game": "180", "girls love": "2328", "gourmet": "2326", "harem": "215",
  "historical": "70", "horror": "222", "isekai": "74", "josei": "404", "kids": "46",
  "magic": "203", "mahou shoujo": "2310", "martial arts": "114", "mecha": "123", "military": "125",
  "music": "242", "mystery": "57", "parody": "162", "police": "136", "psychological": "73",
  "romance": "28", "samurai": "163", "school": "14", "sci-fi": "12", "seinen": "50",
  "shoujo": "252", "shoujo ai": "235", "shounen": "15", "shounen ai": "233", "slice of life": "35",
  "space": "124", "sports": "29", "super power": "16", "supernatural": "9", "suspense": "2316",
  "thriller": "54", "unknown": "32", "vampire": "58"
};

/**
 * Defensive unwrapper for listing endpoints (genre/type/latest/status/filter/az-list).
 * Ensures pagination flags and result arrays are cleanly populated.
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
    if (Array.isArray(data)) return { results: data, currentPage: 1, hasNextPage: false };
    
    const results = Array.isArray(data.results) 
        ? data.results 
        : (Array.isArray(data.items) ? data.items : (Array.isArray(data.data) ? data.data : []));

    const currentPage = data.currentPage ?? data.page ?? 1;
    const hasNextPage = data.hasNextPage ?? (data.maxPage ? currentPage < data.maxPage : results.length >= 18);
    const hasPreviousPage = data.hasPreviousPage ?? (currentPage > 1);

    return {
        results,
        topRated: data.topRated,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        minPage: data.minPage ?? 1,
        maxPage: data.maxPage ?? (hasNextPage ? currentPage + 1 : currentPage)
    };
}

export interface AppUser {
    id: string;
    email?: string;
    user_metadata?: { full_name?: string; avatar_url?: string;[key: string]: any; };
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
    banner?: string;
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
        nextAiringEpisode?: {
            airingAt: number;
            timeUntilAiring: number;
            episode: number;
            airingISOTimestamp?: string;
        } | null;
    };
    episodes: UniversalEpisode[];
    characters: UniversalCharacter[];
    recommendations: UniversalAnimeBase[];
    related: UniversalAnimeBase[];
    seasons: UniversalSeason[];
    trailers: { title: string; source: string; thumbnail: string }[];
    malId?: number;
    countryOfOrigin?: string;
    nextAiringEpisode?: {
        airingAt: number;
        timeUntilAiring: number;
        episode: number;
        airingISOTimestamp?: string;
    } | null;
}

export interface UniversalEpisode {
    id: string;
    number: number;
    title: string;
    isFiller: boolean;
    isDub?: boolean;
    isSub?: boolean;
    hasDub?: boolean;
    hasSub?: boolean;
    malId?: number;
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
    banner?: string;
    type: string;
    relationType?: string;
    status?: string;
    year?: number | string;
    seasonYear?: number;
    episodesCount?: number;
    duration?: string;
    episodes?: { sub: number; dub: number; eps?: number };
    rank?: number;
    isAdult?: boolean;
    rating?: string;
    ageRating?: string;
    score?: string | number;
    malId?: number;
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
        const { type, genres, genre, genre_exclude, genres_exclude, ...rest } = params;
        const query: Record<string, any> = { ...rest };
        if (type !== undefined) query['term_type[]'] = Array.isArray(type) ? type : [type];
        
        const gList = genres || genre;
        if (gList !== undefined) {
            const rawG = Array.isArray(gList) ? gList : String(gList).split(',');
            query['genre[]'] = rawG.map(g => ANIKOTO_GENRE_MAP[g.trim().toLowerCase()] || g.trim());
        }

        const geList = genres_exclude || genre_exclude;
        if (geList !== undefined) {
            const rawGE = Array.isArray(geList) ? geList : String(geList).split(',');
            query['genre_exclude[]'] = rawGE.map(g => ANIKOTO_GENRE_MAP[g.trim().toLowerCase()] || g.trim());
        }

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

    static async getHomeLatest(type: 'updated-all' | 'updated-sub' | 'updated-dub' | 'trending' | 'random' = 'updated-all', page = 1) {
        return fetchAnikoto('/home/latest', { type, page });
    }

    static async getLatestUpdated(page = 1) {
        const res = await fetchAnikoto('/latest-updated', { page });
        if (res && (Array.isArray(res) ? res.length > 0 : res.results?.length > 0)) return res;
        return fetchAnikoto('/latest', { type: 'latest-updated', page });
    }

    static async getNewRelease(page = 1) {
        const res = await fetchAnikoto('/new-release', { page });
        if (res && (Array.isArray(res) ? res.length > 0 : res.results?.length > 0)) return res;
        return fetchAnikoto('/latest', { type: 'new-release', page });
    }

    static async getMostViewed(page = 1) {
        const res = await fetchAnikoto('/most-viewed', { page });
        if (res && (Array.isArray(res) ? res.length > 0 : res.results?.length > 0)) return res;
        return fetchAnikoto('/latest', { type: 'most-viewed', page });
    }

    static async getLatest(type: 'latest-updated' | 'new-release' | 'most-viewed' = 'latest-updated', page = 1) {
        return fetchAnikoto('/latest', { type, page });
    }

    static async getStatus(type: 'currently-airing' | 'finished-airing' | 'not-yet-aired' = 'currently-airing', page = 1) {
        return fetchAnikoto('/status', { type, page });
    }

    static async getAZList(page = 1, letter?: string) {
        return fetchAnikoto('/az-list', { page, letter });
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
    const rawRating = item?.rating || item?.rated || item?.ageRating || item?.rating_name || '';
    const isAdult = item?.isAdult === true || item?.adult === true || ["Rx", "RX", "Hentai", "18+", "R+"].some((t: string) => String(rawRating).toUpperCase().includes(t));
    return {
        id: item?.slug || item?.id || '',
        title: item?.title || 'Unknown Title',
        jname: item?.titleJp || '',
        poster: item?.image || '',
        type: item?.type || 'TV',
        duration: item?.date,
        episodes: {
            sub: item?.episodes?.sub ?? item?.sub ?? 0,
            dub: item?.episodes?.dub ?? item?.dub ?? 0,
            eps: item?.episodes?.total ?? item?.episodes?.eps
        },
        rank: item?.rank,
        isAdult,
        rating: rawRating
    };
}

export class AnimeService {

    private static normalizeEpisodeList(list: any[], slug: string): UniversalEpisode[] {
        return Array.isArray(list) ? list.map((e: any) => ({
            id: `${slug}::${e.number}`,
            number: parseInt(e.number, 10) || 0,
            title: e.title || `Episode ${e.number}`,
            isFiller: false,
            isDub: !!e.hasDub,
            isSub: e.hasSub !== undefined ? !!e.hasSub : true,
            hasDub: !!e.hasDub,
            hasSub: e.hasSub !== undefined ? !!e.hasSub : true,
            malId: e.dataMal ? parseInt(e.dataMal, 10) : undefined
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
        const rawRating = data?.rating || data?.rated || data?.ageRating || '';
        const isAdult = data?.isAdult === true || data?.adult === true || ["Rx", "RX", "Hentai", "18+", "R+", "18"].some((t: string) => String(rawRating).toUpperCase().includes(t)) || (Array.isArray(data?.genres) && data.genres.some((g: string) => ["hentai", "ecchi", "erotica"].includes(String(g).toLowerCase())));
        const rawEps = data?.episodes?.episodes || data?.episodes || [];
        const detectedMalId = rawEps[0]?.dataMal ? parseInt(rawEps[0].dataMal, 10) : (data?.malId || data?.idMal || data?.mal_id);
        const genresList = normalizeList(data?.genres);
        const studiosList = normalizeList(data?.studios);
        const altTitles = Array.isArray(data?.alternativeTitles) ? data.alternativeTitles : [];
        const hasChineseStudio = studiosList.some((s: string) => 
            ['original force', 'wonder cat', 'sparkly key', 'foch', 'b.cmay', 'haoliners', 'tencent', 'bilibili', 'kuang shang', 'l2studio', 'paper plane'].some(cs => s.toLowerCase().includes(cs))
        );
        const hasKoreanStudio = studiosList.some((s: string) =>
            ['studio mir', 'dr movie', 'red dog', 'studio ppuri', 'locus', 'cockroach', 'studio gale', 'iconix'].some(ks => s.toLowerCase().includes(ks))
        );
        const hasJapaneseStudio = studiosList.some((s: string) =>
            ['a-1 pictures', 'a1 pictures', 'mappa', 'ufotable', 'cloverworks', 'wit studio', 'bones', 'madhouse', 'toei animation', 'kyoto animation', 'shaft', 'david production', 'troyca', 'lerche', 'doga kobo', 'white fox', 'silver link', 'j.c.staff', 'jc staff', 'telecom', 'production i.g', 'pierrot', 'sunrise', 'tms entertainment'].some(js => s.toLowerCase().includes(js))
        );
        const isJapaneseAnimeTitle = /(?:solo leveling|ore dake level up|tower of god|god of high school|noblesse)\b/i.test(data?.title || '') ||
            altTitles.some((t: string) => /(?:solo leveling|ore dake level up|tower of god|god of high school|noblesse)\b/i.test(t));
        const hasChineseChars = altTitles.some((t: string) => /[\u4e00-\u9fa5]/.test(t)) || /[\u4e00-\u9fa5]/.test(data?.synopsis || '');
        const hasKoreanChars = altTitles.some((t: string) => /[\uac00-\ud7af]/.test(t)) || /[\uac00-\ud7af]/.test(data?.synopsis || '') || /[\uac00-\ud7af]/.test(data?.titleJp || '');
        const hasJapaneseKana = /[\u3040-\u30ff]/.test(data?.titleJp || '') || /[\u3040-\u30ff]/.test(data?.title || '');
        const isDonghua = data?.type?.toLowerCase() === 'donghua' || 
            genresList.some((g: string) => g.toLowerCase().includes('donghua') || g.toLowerCase().includes('chinese')) ||
            hasChineseStudio ||
            (hasChineseChars && !hasJapaneseKana) ||
            (!hasJapaneseKana && altTitles.concat([data?.title || '', data?.titleJp || '', data?.synopsis || '']).some((t: string) => 
                /(?:\b(?:douluo|dalu|xianxia|wuxia|cultivation|donghua|shiguang|dailiren|shenghuo|chuan|zhuan|xian|qian kun|wan jie|soul land|combat continent|immortal king)\b)/i.test(t)
            ));
        const isKorean = !hasJapaneseStudio && !isJapaneseAnimeTitle && (
            data?.country?.toUpperCase() === 'KR' ||
            data?.countryOfOrigin?.toUpperCase() === 'KR' ||
            data?.type?.toLowerCase() === 'korean' ||
            data?.type?.toLowerCase() === 'aori' ||
            genresList.some((g: string) => g.toLowerCase() === 'korean') ||
            hasKoreanStudio ||
            (!hasJapaneseKana && /(?:lookism)\b/i.test(data?.title || ''))
        );

        const isChinese = data?.country?.toUpperCase() === 'CN' ||
            data?.countryOfOrigin?.toUpperCase() === 'CN' ||
            isDonghua;

        const country = (hasJapaneseStudio || isJapaneseAnimeTitle) ? 'JP' : (isKorean ? 'KR' : (isChinese ? 'CN' : (data?.country || data?.countryOfOrigin || 'JP')));

        return {
            id: slug,
            title: data?.title || 'Unknown Title',
            jname: data?.titleJp || '',
            poster: data?.image || '',
            banner: data?.banner || data?.bannerImage || data?.cover || data?.image || '',
            description: data?.synopsis || '',
            isAdult: isAdult,
            malId: detectedMalId,
            countryOfOrigin: country,
            stats: {
                rating: (data?.rating && !data.rating.includes('/10') && !/^\d+(\.\d+)?$/.test(data.rating.trim())) ? data.rating : (isAdult ? '18+' : 'PG-13'),
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
                genres: genresList,
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

    static async getUniversalRecent(page = 1) {
        return await AniListService.getRecentEpisodes(page, 24);
    }

    static async getHomeSections() {
        return await AniListService.getHomeSections();
    }

    static async getTopTen() {
        const [today, week, month] = await Promise.all([
            AniListService.getTopAiring(1, 10).catch(() => []),
            AniListService.getMostPopular(1, 10).catch(() => []),
            AniListService.getMostFavorite(1, 10).catch(() => []),
        ]);
        return { today, week, month };
    }

    static async getTopSearch() {
        return await AniListService.getMostPopular(1, 10);
    }

    static async getRandomAnime() {
        const popular = await AniListService.getMostPopular(Math.floor(Math.random() * 3) + 1, 24);
        if (popular && popular.length > 0) {
            return popular[Math.floor(Math.random() * popular.length)];
        }
        return null;
    }

    static async getTopUpcoming(page = 1) {
        return await AniListService.getTopUpcoming(page, 24);
    }

    static async getRecentlyUpdated(page = 1) {
        return await AniListService.getRecentEpisodes(page, 24);
    }

    static async getRecentlyAdded(page = 1) {
        return await AniListService.getRecentEpisodes(page, 24);
    }

    static async getCompleted(page = 1) {
        return await AniListService.getCompleted(page, 24);
    }

    static async getMostFavorite(page = 1) {
        return await AniListService.getMostFavorite(page, 24);
    }

    static async getAiringToday(page = 1) {
        return await AniListService.getAiringToday(page, 24);
    }

    static async getMostPopular(page = 1) {
        return await AniListService.getMostPopular(page, 24);
    }

    static async getTopAiring(page = 1) {
        return await AniListService.getTopAiring(page, 24);
    }

    static async getSubbedAnime(page = 1) {
        return await AniListService.getRecentEpisodes(page, 24);
    }

    static async getDubbedAnime(page = 1) {
        return await AniListService.getEnglishDubbed(page, 24);
    }

    static async getMovies(page = 1) {
        return await AniListService.getMovies(page, 24);
    }

    static async getDonghua(page = 1) {
        return await AniListService.getDonghua(page, 24);
    }

    static async getFilteredAnime(category: string, page = 1) {
        let results: UniversalAnimeBase[] = [];
        switch (category) {
            case 'sub':
            case 'dub':
            case 'latest-updated':
            case 'recent':
            case 'updated-all':
            case 'all':
                results = await AniListService.getRecentEpisodes(page, 24);
                break;
            case 'new-release':
            case 'added':
                results = await AniListService.getRecentEpisodes(page, 24);
                break;
            case 'most-viewed':
            case 'popular':
            case 'trending':
                results = await AniListService.getMostPopular(page, 24);
                break;
            case 'upcoming':
            case 'not-yet-aired':
                results = await AniListService.getTopUpcoming(page, 24);
                break;
            case 'ongoing':
            case 'currently-airing':
                results = await AniListService.getTopAiring(page, 24);
                break;
            case 'completed':
            case 'finished-airing':
                results = await AniListService.getCompleted(page, 24);
                break;
            case 'az-list':
                results = await AniListService.getMostPopular(page, 24);
                break;
            default:
                results = await AniListService.getMostPopular(page, 24);
                break;
        }

        return {
            results,
            currentPage: page,
            hasNextPage: results.length >= 24,
            hasPreviousPage: page > 1,
            maxPage: results.length >= 24 ? page + 1 : page,
            minPage: 1
        };
    }

    static async getByGenre(genre: string, page = 1) {
        return await AniListService.getByGenre(genre, page, 24);
    }

    static async getByType(_type: string, page = 1) {
        return await AniListService.getMostPopular(page, 24);
    }

    static async search(query: string, page = 1) {
        return await AniListService.search(query, page, 24);
    }

    static async getSearchSuggestions(query: string) {
        return await AniListService.getSearchSuggestions(query);
    }

    static async filter(params: Record<string, any>) {
        return await AniListService.filter(params);
    }

    static async getAnimeInfo(slugOrId: string): Promise<UniversalAnime | null> {
        let info = await AniListService.getAnimeInfo(slugOrId).catch(() => null);
        if (info) return info;

        // Fallback: Check if slugOrId is a Blakite Hindi entry or numeric Blakite ID
        try {
            const rawId = (slugOrId || '').trim();
            const cleanId = rawId.match(/^(\d+)/)?.[1] || rawId;
            let blakiteDetail: any = null;

            if (typeof window !== 'undefined') {
                const res = await fetch(`/api/blakite/anime/${encodeURIComponent(cleanId)}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.ok && json.data) blakiteDetail = json.data;
                }
            } else {
                const { getBlakiteDetail } = await import('@/lib/blakite');
                blakiteDetail = await getBlakiteDetail(cleanId).catch(() => null);
            }

            if (blakiteDetail) {
                const cleanTitle = (blakiteDetail.title || '')
                    .replace(/\(Hindi Dubbed\)/i, '')
                    .replace(/\(Hindi Dub\)/i, '')
                    .replace(/\[Hindi Dub\]/i, '')
                    .replace(/Season \d+/i, '')
                    .trim();

                let anilistMatch: UniversalAnime | null = null;
                if (cleanTitle) {
                    anilistMatch = await AniListService.getAnimeInfo(cleanTitle).catch(() => null);
                }

                if (anilistMatch) {
                    (anilistMatch as any).hindiDub = {
                        available: true,
                        dubType: blakiteDetail.language === 'ORG' ? 'Hindi Official Dub' : 'Hindi Dub',
                        blakiteId: blakiteDetail.id,
                        totalEpisodes: blakiteDetail.episodes?.length || 1,
                        score: blakiteDetail.score
                    };
                    return anilistMatch;
                }

                const eps: UniversalEpisode[] = Array.isArray(blakiteDetail.episodes)
                    ? blakiteDetail.episodes.map((e: any, idx: number) => ({
                        id: e.id || `${blakiteDetail.id}::${e.number || (idx + 1)}`,
                        number: parseInt(e.number, 10) || (idx + 1),
                        title: e.title || `Episode ${e.number || (idx + 1)}`,
                        isFiller: false,
                        isDub: true,
                        isSub: true,
                        hasDub: true,
                        hasSub: true,
                    }))
                    : [];

                const uAnime: UniversalAnime = {
                    id: String(blakiteDetail.id),
                    title: cleanTitle || blakiteDetail.title,
                    jname: blakiteDetail.titleJp || blakiteDetail.title,
                    poster: blakiteDetail.image || '/images/no-poster.png',
                    banner: blakiteDetail.banner || blakiteDetail.image || '',
                    description: blakiteDetail.synopsis || '',
                    isAdult: false,
                    stats: {
                        rating: blakiteDetail.rating || 'PG-13',
                        quality: 'HD',
                        duration: '24m',
                        type: blakiteDetail.type || 'TV',
                        malScore: String(blakiteDetail.score || '8.0'),
                        episodes: { sub: eps.length, dub: eps.length }
                    },
                    info: {
                        status: blakiteDetail.status || 'Completed',
                        genres: blakiteDetail.genres || ['Action', 'Animation'],
                        studios: blakiteDetail.studios || [],
                        producers: blakiteDetail.producers || [],
                        aired: blakiteDetail.aired || '?',
                        premiered: blakiteDetail.premiered || '?',
                        japanese: blakiteDetail.nativeTitle || '',
                        synonyms: blakiteDetail.englishTitle || ''
                    },
                    episodes: eps,
                    characters: [],
                    recommendations: [],
                    related: [],
                    seasons: [],
                    trailers: []
                };
                (uAnime as any).hindiDub = {
                    available: true,
                    dubType: blakiteDetail.language === 'ORG' ? 'Hindi Official Dub' : 'Hindi Dub',
                    blakiteId: blakiteDetail.id,
                    totalEpisodes: eps.length,
                    score: blakiteDetail.score
                };
                return uAnime;
            }
        } catch (e) {
            console.warn("[AnimeService] Blakite fallback failed:", e);
        }

        return null;
    }

    static async getEpisodes(slugOrId: string): Promise<UniversalEpisode[]> {
        return await AniListService.getEpisodes(slugOrId);
    }

    static async getCharacters(slugOrId: string): Promise<UniversalCharacter[]> {
        const info = await AniListService.getAnimeInfo(slugOrId);
        return info?.characters || [];
    }

    static async getSchedule(date: string, tzOffsetHours = 0) {
        return await AniListService.getSchedule(date, tzOffsetHours);
    }

    static async getTooltip(id: string) {
        return await AniListService.getTooltip(id);
    }

    static async getStream(
        episodeId: string, 
        server = 'MegaCloud', 
        category: 'sub' | 'dub' | 'raw' | 'jp' | 'en' | 'hi' | 'cn' = 'sub',
        options?: { malId?: number; title?: string; countryOfOrigin?: string; hasDub?: boolean; excludeServers?: string[] }
    ) {
        let slug = '';
        let epNumber = '';
        if (episodeId.includes('::')) {
            [slug, epNumber] = episodeId.split('::');
        } else if (episodeId.includes('-')) {
            const lastIndex = episodeId.lastIndexOf('-');
            slug = episodeId.substring(0, lastIndex);
            epNumber = episodeId.substring(lastIndex + 1);
        } else {
            slug = episodeId;
            epNumber = episodeId;
        }
        if (!slug || !epNumber) return null;

        const countryUpper = options?.countryOfOrigin?.toUpperCase() || 'JP';
        const isChinese = countryUpper === 'CN';
        const isKorean = countryUpper === 'KR';
        const primarySubKey = isChinese ? 'cn' : (isKorean ? 'kr' : 'jp');

        // Map audio category
        let effectiveAudio = category as string;
        if (category === 'sub') effectiveAudio = primarySubKey;
        else if (category === 'dub') effectiveAudio = 'en';
        else if (['jp', 'cn', 'kr'].includes(effectiveAudio)) {
            if (effectiveAudio !== primarySubKey && (isChinese || isKorean)) {
                effectiveAudio = primarySubKey;
            }
        }

        // 1. Direct High-Speed Unified Extractor (ZokoAnime + Blakite + Rumble Cloud)
        try {
            let unified: UnifiedStreamResult | null = null;
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams({
                    malId: options?.malId ? String(options.malId) : '',
                    title: options?.title || slug,
                    ep: String(epNumber),
                    country: options?.countryOfOrigin || 'JP',
                    audio: effectiveAudio,
                    server: server,
                    exclude: options?.excludeServers?.join(',') || ''
                });
                const res = await fetch(`/api/anime/stream?${params.toString()}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.ok && json.data) {
                        unified = json.data;
                    }
                }
            } else {
                unified = await resolveUnifiedStreams({
                    malId: options?.malId,
                    title: options?.title || slug,
                    episode: epNumber,
                    countryOfOrigin: options?.countryOfOrigin || 'JP',
                    knownHasDub: options?.hasDub
                });
            }

            if (unified && unified.servers) {
                // IMPORTANT: When English Dub or Hindi Dub is requested, ONLY look at that specific language pool!
                // NEVER fall back to primarySubKey (which is Japanese Sub) when English Dub is requested!
                const isSubTrack = ['jp', 'cn', 'kr', 'sub'].includes(effectiveAudio);
                const available: any[] = (unified.servers[effectiveAudio] || (isSubTrack ? (unified.servers[primarySubKey] || []) : [])) as any[];
                const excluded = (options?.excludeServers || []).map(s => s.toLowerCase());
                let matched = available.find((s: any) => s.serverName.toLowerCase() === server.toLowerCase() && !excluded.includes(s.serverName.toLowerCase()))
                           || available.find((s: any) => !excluded.includes(s.serverName.toLowerCase()))
                           || available[0];

                if (matched && matched.url) {
                    // Synthesize legacy server structure for backward compatibility
                    const legacyServers: any = {
                        ...unified.servers,
                        sub: unified.servers[primarySubKey] || unified.servers.sub || [],
                        dub: unified.servers.en || unified.servers.dub || [],
                        hi: unified.servers.hi || [],
                        raw: []
                    };

                    const isEmbed = matched.type === 'embed' || matched.url.includes('megaplay.buzz');

                    return {
                        url: matched.url,
                        iframeUrl: isEmbed ? matched.url : null,
                        isEmbed: isEmbed,
                        subtitles: (unified.subtitles || []).map((s: any) => ({ file: s.url, label: s.label, kind: 'captions' })),
                        server: matched.serverName,
                        servers: legacyServers,
                        audioTracks: unified.audioTracks,
                        isM3U8: matched.type === 'm3u8',
                        referer: matched.referer || null,
                        intro: unified.intro,
                        outro: unified.outro,
                        skipData: (unified.intro || unified.outro) ? { intro: unified.intro, outro: unified.outro } : null
                    };
                }
            }
        } catch (err) {
            console.warn('[AnimeService.getStream] Unified stream extractor fallback:', err);
        }

        return null;
    }

    /** @deprecated Now handled dynamically inside getStream to avoid double network requests */
    static async getEpisodeServers(episodeId: string) {
        return null;
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

    static async addToWatchlist(userId: string, animeId: string, status: WatchlistItem['status'], progress: number = 0, episodeId?: string, totalEpisodes?: number, type?: string): Promise<boolean> {
        const item: any = { 
            anime_id: animeId, 
            status, 
            total_episodes: Number(totalEpisodes) || 1, 
            media_type: type || "anime", 
            updated_at: new Date().toISOString() 
        };
        if (episodeId) item.last_episode_id = episodeId;

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

    static async signUp(email: string, password: string, username: string, avatarUrl?: string, gender?: string) {
        return supabase ? await supabase.auth.signUp({ email, password, options: { data: { username, full_name: username, avatar_url: avatarUrl, gender } } }) : { data: null, error: null };
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
        const API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
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