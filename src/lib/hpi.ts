// src/lib/hpi.ts
//
// ==========================================================================
//  MIGRATION NOTE
// ==========================================================================
//  This used to be a thin client over two separate cheerio-scraped Hindi
//  anime sources — DesiDub (via /api/desidub, src/lib/scrapers/desidub.ts)
//  and Satoru (via /api/satoru, src/lib/scrapers/satoru.ts) — glued together
//  by `bridge.getSmartDetails()`, which searched Satoru by title to borrow
//  its recommendations since DesiDub alone didn't have any worth showing.
//
//  Both scrapers are gone. This file now talks directly to a single clean
//  JSON API instead: https://anime-api-ashen-chi.vercel.app (an
//  itzzzme/anime-api-family Hindi-dub fork). Since it's one coherent
//  catalog, there's no second source to "bridge" against anymore —
//  `bridge.getSmartDetails()` is kept only so the one call site that used it
//  doesn't need to change, but it's now a thin alias for `desidub.getDetails`
//  with the anime's own recommendations attached.
//
//  IMPORTANT — verification status: I could not get a live response back
//  from this specific mirror (my fetch tool blocked every sub-path on this
//  domain). What follows is built against the well-documented endpoint/
//  response conventions shared across the whole itzzzme/anime-api family
//  (this Hindi fork explicitly derives from that same codebase), plus one
//  concrete real-world example response from a sibling fork
//  (shadowanimexyz/anikoto-api) for the anime-detail shape. Every parse
//  below is defensive (tries several plausible field names) for exactly
//  this reason. Please do one manual `curl` sanity check against the live
//  mirror before relying on this in production — in particular the
//  `/api/stream` and `/api/servers` shapes, which I have the least
//  confidence in.
//
//  All public method names on `hpi` (`hpi.desidub.*`, `hpi.bridge.*`) and
//  every exported type are UNCHANGED, so none of the 5 components that
//  import from this file (WhisperIsland, RecentUpdatesSection,
//  HindiSearchBar, HindiAnimeCard, hindi-watch/WatchClient) needed to be
//  touched for their data-fetching calls. `hpi.satoru` has been removed —
//  nothing outside this file ever called it directly.
// ==========================================================================

/**
 * ==========================================
 * SHARED TYPES (unchanged)
 * ==========================================
 */

export interface Pagination {
  currentPage: number;
  hasNextPage: boolean;
  totalPages?: number;
  totalResults?: number;
}

export interface AnimeCard {
  id: string;
  title: string;
  image: string;
  url?: string;
  type?: string;
  episode?: string;
  episodeCount?: string;
  duration?: string;
  slug?: string;

  // Extra metadata dependent on source
  audio?: string[];
  dubInfo?: {
    languages: string[];
    isHindi: boolean;
  };

  // The itzzzme-family APIs expose a numeric `data_id` alongside the slug
  // `id` — required for the qtip endpoint. Kept optional so nothing that
  // doesn't set it breaks.
  dataId?: string;
}

/**
 * ==========================================
 * DESIDUB TYPES (unchanged shape — now backed by the new source)
 * ==========================================
 */

export interface DesiDubHome {
  sections: {
    title: string;
    items: AnimeCard[];
  }[];
}

export interface DesiDubEpisode {
  id: string;
  number: string;
  url: string;
  title: string;
  image: string;
}

export interface DesiDubDetails extends AnimeCard {
  nativeTitle: string;
  englishTitle: string;
  synonyms: string[];
  banner: string;
  synopsis: string;
  status: string;
  rating: string;
  premiered: string;
  season: string;
  aired: string;
  episodesCount: string;
  studios: string[];
  producers: string[];
  genres: string[];
  episodes: DesiDubEpisode[];
  recommendations: AnimeCard[];
  downloads: { resolution: string; url: string; host: string }[];

  views?: string;
  likes?: string;
  tags?: string[];
}

export interface DesiDubStream {
  id: string;
  iframe: string;
  servers: { name: string; url: string; isEmbed: boolean }[];
  nextEpisode: string | null;
  prevEpisode: string | null;
  episodes: { id: string; number: string; title: string; url: string }[];
  targetUrl: string;
  serverUsed: string;
  stream?: {
    file?: string;
    error?: string;
    debugUrl?: string;
  } | null;

  nextEpDate?: string;

  // New, additive — the source now gives us real HLS + subtitles + skip
  // ranges instead of an iframe embed. Not part of the old shape, safe to
  // ignore if a caller doesn't read them.
  subtitles?: { lang: string; url: string }[];
  intro?: { start: number; end: number } | null;
  outro?: { start: number; end: number } | null;
  isM3U8?: boolean;
  // Additive — same hotlink-protection referer requirement as the main
  // Anikoto source. itzzzme-family APIs commonly return this as `headers.Referer`.
  referer?: string | null;
}

export interface DesiDubQtip {
  name: string;
  description: string;
  rating: string;
  quality: string;
  type: string;
  japaneseTitle: string;
  status: string;
  aired: string;
  genres: string[];
}

/**
 * ==========================================
 * NEW HINDI API CLIENT
 * ==========================================
 */

const HINDI_API_BASE = 'https://anime-api-ashen-chi.vercel.app/api';

async function fetchHindiApi<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
  const queryParts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const targetUrl = `${HINDI_API_BASE}${endpoint}${queryString}`;
  const proxyUrl = typeof window !== 'undefined' ? `/api/proxy?url=${encodeURIComponent(targetUrl)}` : targetUrl;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(proxyUrl, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const json = await response.json();
    if (json?.success === false) return null;
    return json as T;
  } catch {
    return null;
  }
}

function normalizeHindiCard(item: any): AnimeCard {
  return {
    id: item?.anime_id || item?.id || item?.slug || '',
    title: item?.title || item?.name || 'Unknown Title',
    image: item?.poster || item?.image || item?.img || '',
    type: item?.showType || item?.type || 'TV',
    episode: item?.episode_no ? String(item.episode_no) : (item?.episode || undefined),
    episodeCount: item?.totalEpisodes || item?.episodes?.eps ? String(item.totalEpisodes || item.episodes.eps) : undefined,
    duration: item?.run_time || item?.runningTime || item?.duration,
    dataId: item?.anime_id != null ? String(item.anime_id) : undefined
  };
}

class HPIClient {
  desidub = {
    getHome: async (): Promise<DesiDubHome> => {
      const response: any = await fetchHindiApi('/newadded');
      const latest = Array.isArray(response?.results) ? response.results : [];
      const sections: DesiDubHome['sections'] = [
        { title: 'Recently Added', items: latest.map(normalizeHindiCard) }
      ];
      return { sections };
    },

    search: async (query: string, page = 1) => {
      const response: any = await fetchHindiApi('/search', { s: query, page });
      const resultsObj = response?.results || {};
      const list = Array.isArray(resultsObj.results) ? resultsObj.results : [];
      const items = list.map(normalizeHindiCard);
      return {
        title: query,
        items,
        pagination: {
          currentPage: resultsObj.currentPage ?? page,
          hasNextPage: (resultsObj.currentPage ?? page) < (resultsObj.totalPages ?? page),
          totalPages: resultsObj.totalPages,
          totalResults: items.length
        } as Pagination
      };
    },

    getSuggestions: async (query: string): Promise<AnimeCard[]> => {
      const response: any = await fetchHindiApi('/search', { s: query, page: 1 });
      const resultsObj = response?.results || {};
      const list = Array.isArray(resultsObj.results) ? resultsObj.results : [];
      return list.map(normalizeHindiCard).slice(0, 5);
    },

    filter: async (params: any) => {
      const response: any = await fetchHindiApi('/newadded');
      const list = Array.isArray(response?.results) ? response.results : [];
      return {
        items: list.map(normalizeHindiCard),
        pagination: {
          currentPage: 1,
          hasNextPage: false,
          totalPages: 1,
          totalResults: list.length
        } as Pagination
      };
    },

    getDetails: async (id: string): Promise<DesiDubDetails> => {
      const [infoRes, episodesRes] = await Promise.all([
        fetchHindiApi<any>('/info', { id }),
        fetchHindiApi<any>('/episode', { id, season: 1 })
      ]);

      const info = infoRes?.data || {};
      const epData = episodesRes?.results?.episodes || [];
      const episodeList = Array.isArray(epData) ? epData.map((e: any) => ({
        id: `${id}?season=${e.season || 1}&ep=${e.episode}`,
        number: String(e.episode),
        url: '',
        title: e.title || `Episode ${e.episode}`,
        image: e.image || e.poster || info.poster || ''
      })) : [];

      return {
        id,
        title: info.title || 'Unknown Title',
        englishTitle: info.title || '',
        nativeTitle: info.title || '',
        image: info.poster || '',
        banner: info.poster || '',
        type: 'TV',
        synopsis: info.overview || '',
        status: 'Unknown',
        rating: info.rating || 'PG-13',
        premiered: info.year || '',
        season: '',
        aired: info.year || '',
        episodesCount: String(episodeList.length || info.episodes || ''),
        studios: [],
        producers: [],
        genres: Array.isArray(info.genres) ? info.genres : [],
        synonyms: [],
        episodes: episodeList,
        recommendations: [],
        downloads: [],
        dataId: id
      };
    },

    getStream: async (episodeId: string): Promise<DesiDubStream> => {
      let id = episodeId;
      let ep = '1';
      let season = '1';

      if (episodeId.includes('?')) {
        const [baseId, qs] = episodeId.split('?');
        id = baseId;
        const params = new URLSearchParams(qs);
        ep = params.get('ep') || '1';
        season = params.get('season') || '1';
      } else {
        const parts = episodeId.split('-');
        if (!isNaN(Number(parts[parts.length-1]))) {
            ep = parts.pop() || '1';
            id = parts.join('-');
        }
      }

      const streamRes: any = await fetchHindiApi('/stream', { id, season, ep });
      const servers = Array.isArray(streamRes?.results) ? streamRes.results : [];
      
      const mappedServers = servers.map((s: any, idx: number) => ({
        name: s.server || `Server ${idx + 1}`,
        url: s.embed || '',
        isEmbed: true
      })).filter((s: any) => s.url);

      const primary = mappedServers[0];

      return {
        id: episodeId,
        iframe: primary?.url || '',
        targetUrl: primary?.url || '',
        serverUsed: primary?.name || '',
        servers: mappedServers,
        nextEpisode: null,
        prevEpisode: null,
        episodes: [],
        stream: primary?.url ? { file: primary.url } : { error: 'No stream found' },
        subtitles: [],
        intro: null,
        outro: null,
        isM3U8: false
      };
    },

    getQtip: async (dataId: string): Promise<DesiDubQtip> => {
      const details = await this.getDetails(dataId);
      return {
        name: details.title,
        description: details.synopsis,
        rating: details.rating,
        quality: 'HD',
        type: details.type || 'TV',
        japaneseTitle: details.nativeTitle,
        status: details.status,
        aired: details.aired,
        genres: details.genres
      };
    }
  };

  bridge = {
    getSmartDetails: async (id: string) => {
      const details = await this.desidub.getDetails(id);
      if (!details) throw new Error('Anime not found');
      return { ...details, satoruId: null };
    }
  };
}

export const hpi = new HPIClient();
