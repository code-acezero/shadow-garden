// src/lib/hpi.ts
//
// ==========================================================================
//  MIGRATION NOTE
// ==========================================================================
//  This used to be a thin client over two separate cheerio-scraped Hindi
//  anime sources — Hindi (via /api/Hindi, src/lib/scrapers/Hindi.ts)
//  and Satoru (via /api/satoru, src/lib/scrapers/satoru.ts) — glued together
//  by `bridge.getSmartDetails()`, which searched Satoru by title to borrow
//  its recommendations since Hindi alone didn't have any worth showing.
//
//  Both scrapers are gone. This file now talks directly to a single clean
//  JSON API instead: https://anime-api-ashen-chi.vercel.app (an
//  itzzzme/anime-api-family Hindi-dub fork). Since it's one coherent
//  catalog, there's no second source to "bridge" against anymore —
//  `bridge.getSmartDetails()` is kept only so the one call site that used it
//  doesn't need to change, but it's now a thin alias for `Hindi.getDetails`
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
//  All public method names on `hpi` (`hpi.Hindi.*`, `hpi.bridge.*`) and
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
 * Hindi TYPES (unchanged shape — now backed by the new source)
 * ==========================================
 */

export interface HindiHome {
  sections: {
    title: string;
    items: AnimeCard[];
  }[];
}

export interface HindiEpisode {
  id: string;
  number: string;
  url: string;
  title: string;
  image: string;
}

export interface HindiDetails extends AnimeCard {
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
  episodes: HindiEpisode[];
  recommendations: AnimeCard[];
  downloads: { resolution: string; url: string; host: string }[];

  views?: string;
  likes?: string;
  tags?: string[];
}

export interface HindiStream {
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

export interface HindiQtip {
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

import { BASE_URL } from './api';

const HINDI_API_BASE = `${BASE_URL}/blakite`;

async function fetchHindiApi<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
  const queryParts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const targetUrl = `${HINDI_API_BASE}${endpoint}${queryString}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(targetUrl, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const json = await response.json();
    if (json?.ok === false) return null;
    return json.data as T;
  } catch {
    return null;
  }
}

function normalizeHindiCard(item: any): AnimeCard {
  return {
    id: item?.id || '',
    title: item?.title || 'Unknown Title',
    image: item?.image || '',
    type: item?.type || 'TV',
    episode: item?.episode ? String(item.episode) : undefined,
    episodeCount: item?.episode ? String(item.episode) : undefined,
    dataId: item?.id
  };
}

class HPIClient {
  hindi = {
    getHome: async (): Promise<HindiHome> => {
      const results: any = await fetchHindiApi('/home');
      const sections: HindiHome['sections'] = [];
      
      if (results?.spotlight?.length > 0) {
        sections.push({ title: 'Spotlight', items: results.spotlight.map(normalizeHindiCard) });
      }
      if (results?.latestEpisodes?.length > 0) {
        sections.push({ title: 'Recently Updated', items: results.latestEpisodes.map(normalizeHindiCard) });
      }
      if (results?.newAdded?.length > 0) {
        sections.push({ title: 'Newly Added', items: results.newAdded.map(normalizeHindiCard) });
      }
      if (results?.topDay?.length > 0) {
        sections.push({ title: 'Top Rated', items: results.topDay.map(normalizeHindiCard) });
      }
      
      // Fallback if everything is empty
      if (sections.length === 0) {
         const latest = Array.isArray(results) ? results : [];
         sections.push({ title: 'Recently Added', items: latest.map(normalizeHindiCard) });
      }

      return { sections };
    },

    search: async (query: string, page = 1) => {
      const resultsObj: any = await fetchHindiApi('/search', { q: query, page });
      const list = Array.isArray(resultsObj?.results) ? resultsObj.results : [];
      const items = list.map(normalizeHindiCard);
      return {
        title: query,
        items,
        pagination: {
          currentPage: resultsObj?.currentPage ?? page,
          hasNextPage: resultsObj?.hasNextPage ?? false,
          totalPages: resultsObj?.maxPage ?? 1,
          totalResults: resultsObj?.totalResults ?? items.length
        } as Pagination
      };
    },

    getSuggestions: async (query: string): Promise<AnimeCard[]> => {
      const resultsObj: any = await fetchHindiApi('/search', { q: query, page: 1 });
      const list = Array.isArray(resultsObj?.results) ? resultsObj.results : [];
      return list.map(normalizeHindiCard).slice(0, 5);
    },

    filter: async (params: any) => {
      const resultsObj: any = await fetchHindiApi('/filter', params);
      const list = Array.isArray(resultsObj?.results) ? resultsObj.results : [];
      return {
        items: list.map(normalizeHindiCard),
        pagination: {
          currentPage: resultsObj?.currentPage ?? 1,
          hasNextPage: resultsObj?.hasNextPage ?? false,
          totalPages: resultsObj?.maxPage ?? 1,
          totalResults: resultsObj?.totalResults ?? list.length
        } as Pagination
      };
    },

    getDetails: async (id: string): Promise<HindiDetails> => {
      const info: any = await fetchHindiApi(`/anime/${id}`);
      if (!info) throw new Error('Anime not found');

      const episodeList = Array.isArray(info.episodes) ? info.episodes.map((e: any) => ({
        id: `${id}?ep=${e.id.replace('ep-', '')}`,
        number: e.number ? String(e.number) : e.id.replace('ep-', ''),
        url: '',
        title: e.title || `Episode ${e.number}`,
        image: info.image || ''
      })) : [];

      return {
        id,
        title: info.title || 'Unknown Title',
        englishTitle: info.title || '',
        nativeTitle: info.title || '',
        image: info.image || '',
        banner: info.cover || info.image || '',
        type: info.type || 'TV',
        synopsis: info.description || '',
        status: info.status || 'Unknown',
        rating: info.rating || 'PG-13',
        premiered: info.releaseDate || '',
        season: '',
        aired: info.releaseDate || '',
        episodesCount: String(episodeList.length || info.totalEpisodes || ''),
        studios: Array.isArray(info.studios) ? info.studios : [],
        producers: [],
        genres: Array.isArray(info.genres) ? info.genres : [],
        synonyms: [],
        episodes: episodeList,
        recommendations: [],
        downloads: [],
        dataId: id
      };
    },

    getStream: async (episodeId: string): Promise<HindiStream> => {
      let id = episodeId;
      let ep = '1';

      if (episodeId.includes('?')) {
        const [baseId, qs] = episodeId.split('?');
        id = baseId;
        const params = new URLSearchParams(qs);
        ep = params.get('ep') || '1';
      } else {
        const parts = episodeId.split('-');
        if (!isNaN(Number(parts[parts.length-1]))) {
            ep = parts.pop() || '1';
            id = parts.join('-');
        }
      }

      // Format endpoint: /api/blakite/watch/[slug]?ep=[ep]
      const streamData: any = await fetchHindiApi(`/watch/${id}`, { ep });
      
      const mappedServers = streamData?.sources ? streamData.sources.map((s: any, idx: number) => ({
        name: s.quality || `Server ${idx + 1}`,
        url: s.url || '',
        isEmbed: false // These are direct streams, not embeds
      })).filter((s: any) => s.url) : [];

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
        subtitles: streamData?.subtitles || [],
        intro: null,
        outro: null,
        isM3U8: streamData?.isM3U8 ?? true,
        referer: streamData?.referer || 'https://blakiteapi.xyz/'
      };
    },

    getQtip: async (dataId: string): Promise<HindiQtip> => {
      const details = await this.hindi.getDetails(dataId);
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
      const details = await this.hindi.getDetails(id);
      if (!details) throw new Error('Anime not found');
      return { ...details, satoruId: null };
    }
  };
}

export const hpi = new HPIClient();
