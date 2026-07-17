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
    // itzzzme-family responses wrap the payload as either `results` or
    // `data` depending on the fork/endpoint — accept either.
    return (json?.results ?? json?.data ?? null) as T;
  } catch {
    return null;
  }
}

/** Pulls the actual list out of a `results` payload regardless of whether
 * it's a bare array, `{ data: [...] }`, or `{ animes: [...] }` — the three
 * shapes seen across itzzzme-family forks. */
function extractList(payload: any, ...keys: string[]): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

function normalizeHindiCard(item: any): AnimeCard {
  return {
    id: item?.id || item?.slug || '',
    title: item?.title || item?.name || 'Unknown Title',
    image: item?.poster || item?.image || item?.img || '',
    type: item?.showType || item?.type || 'TV',
    episode: item?.episode_no ? String(item.episode_no) : (item?.episode || undefined),
    episodeCount: item?.episodes?.eps ? String(item.episodes.eps) : (item?.episodeCount || undefined),
    duration: item?.duration,
    dataId: item?.data_id != null ? String(item.data_id) : (item?.dataId || undefined)
  };
}

class HPIClient {
  // --- DESIDUB-SHAPED ENDPOINTS (now backed by the new Hindi API) ---
  desidub = {
    getHome: async (): Promise<DesiDubHome> => {
      const results: any = await fetchHindiApi('/home');
      const latest = extractList(results, 'latestEpisode', 'latestEpisodes', 'recentlyUpdated', 'latest_episode');
      const trending = extractList(results, 'trending', 'spotlights', 'spotlightAnimes');
      const sections: DesiDubHome['sections'] = [
        { title: 'Latest Episode', items: latest.map(normalizeHindiCard) }
      ];
      if (trending.length) sections.push({ title: 'Trending', items: trending.map(normalizeHindiCard) });
      return { sections };
    },

    search: async (query: string, page = 1) => {
      const results: any = await fetchHindiApi('/search', { keyword: query, page });
      const list = extractList(results, 'data', 'animes');
      const items = list.map(normalizeHindiCard);
      return {
        title: query,
        items,
        pagination: {
          currentPage: results?.currentPage ?? page,
          hasNextPage: !!results?.hasNextPage,
          totalPages: results?.totalPages,
          totalResults: results?.totalResults ?? items.length
        } as Pagination
      };
    },

    getSuggestions: async (query: string): Promise<AnimeCard[]> => {
      const results: any = await fetchHindiApi('/search/suggest', { keyword: query });
      const list = extractList(results, 'data', 'suggestions');
      return list.map(normalizeHindiCard);
    },

    filter: async (params: any) => {
      const results: any = await fetchHindiApi('/search', params);
      const list = extractList(results, 'data', 'animes');
      return {
        items: list.map(normalizeHindiCard),
        pagination: {
          currentPage: results?.currentPage ?? 1,
          hasNextPage: !!results?.hasNextPage,
          totalPages: results?.totalPages,
          totalResults: results?.totalResults ?? list.length
        } as Pagination
      };
    },

    getDetails: async (id: string): Promise<DesiDubDetails> => {
      const [detail, episodesRes] = await Promise.all([
        fetchHindiApi<any>(`/anime/${encodeURIComponent(id)}`),
        fetchHindiApi<any>(`/episodes/${encodeURIComponent(id)}`)
      ]);

      const info = detail?.data || detail?.info || detail || {};
      const moreInfo = info?.animeInfo || detail?.moreInfo || {};
      const recRaw = extractList(detail, 'recommended_data', 'recommendedAnimes', 'recommendations').flat();
      const episodeList = extractList(episodesRes, 'episodes').map((e: any) => ({
        id: e?.id || e?.episodeId || `${id}?ep=${e?.episode_no || e?.number}`,
        number: String(e?.episode_no ?? e?.number ?? ''),
        url: e?.id || '',
        title: e?.title || `Episode ${e?.episode_no ?? e?.number ?? ''}`,
        image: e?.thumbnail || info?.poster || ''
      }));

      const splitCsv = (v: any): string[] =>
        typeof v === 'string' ? v.split(',').map((s: string) => s.trim()).filter(Boolean) : Array.isArray(v) ? v : [];

      return {
        id,
        title: info?.title || info?.name || 'Unknown Title',
        englishTitle: info?.title || info?.name || '',
        nativeTitle: info?.japanese_title || moreInfo?.Japanese || '',
        image: info?.poster || info?.img || '',
        banner: info?.poster || info?.img || '',
        type: info?.showType || info?.type || 'TV',
        synopsis: moreInfo?.Overview || info?.description || '',
        status: moreInfo?.Status || info?.status || 'Unknown',
        rating: info?.rating || (info?.adultContent ? 'R+' : 'PG-13'),
        premiered: moreInfo?.Premiered || '',
        season: moreInfo?.Premiered || '',
        aired: moreInfo?.Aired || '',
        episodesCount: String(episodeList.length || info?.episodes?.eps || ''),
        studios: splitCsv(moreInfo?.Studios),
        producers: splitCsv(moreInfo?.Producers),
        genres: splitCsv(moreInfo?.Genres),
        synonyms: splitCsv(moreInfo?.Synonyms),
        episodes: episodeList,
        recommendations: recRaw.map(normalizeHindiCard),
        downloads: [], // not exposed by this source
        dataId: info?.data_id != null ? String(info.data_id) : undefined
      };
    },

    getStream: async (episodeId: string): Promise<DesiDubStream> => {
      // Discover available servers first (best-effort — if this endpoint's
      // shape doesn't match, we fall back to a single default-server fetch).
      const serversRes: any = await fetchHindiApi(`/servers/${encodeURIComponent(episodeId)}`);
      const serverNames: string[] = extractList(serversRes, 'servers', 'data')
        .map((s: any) => s?.serverName || s?.name)
        .filter(Boolean);
      const namesToTry = serverNames.length ? serverNames.slice(0, 3) : [undefined as any];

      const attempts = await Promise.all(
        namesToTry.map(async (name) => {
          const stream: any = await fetchHindiApi('/stream', { id: episodeId, server: name, type: 'sub' });
          const sourceList = extractList(stream, 'sources');
          const url = sourceList[0]?.url || stream?.file;
          if (!url) return null;
          return { name: name || 'HD-1', url, isEmbed: false, raw: stream };
        })
      );

      const organized = attempts.filter((a): a is NonNullable<typeof a> => !!a);
      const primary = organized[0];

      return {
        id: episodeId,
        iframe: primary?.url || '',
        targetUrl: primary?.url || '',
        serverUsed: primary?.name || '',
        servers: organized.map(({ name, url, isEmbed }) => ({ name, url, isEmbed })),
        nextEpisode: null,
        prevEpisode: null,
        episodes: [],
        stream: primary?.url ? { file: primary.url } : { error: 'No stream found' },
        subtitles: extractList(primary?.raw, 'subtitles', 'tracks').map((t: any) => ({
          lang: t?.lang || t?.label || 'Unknown',
          url: t?.url || t?.file
        })),
        intro: primary?.raw?.intro || primary?.raw?.skip_data?.intro || null,
        outro: primary?.raw?.outro || primary?.raw?.skip_data?.outro || null,
        isM3U8: primary?.raw ? extractList(primary.raw, 'sources')[0]?.isM3U8 !== false : true
      };
    },

    getQtip: async (dataId: string): Promise<DesiDubQtip> => {
      const results: any = await fetchHindiApi(`/qtip/${encodeURIComponent(dataId)}`);
      const data = Array.isArray(results?.data) ? results.data[0] : (results?.data || results || {});
      return {
        name: data?.title || data?.name || 'Unknown Title',
        description: data?.description || data?.animeInfo?.Overview || '',
        rating: data?.rating || 'PG-13',
        quality: data?.quality || 'HD',
        type: data?.showType || data?.type || 'TV',
        japaneseTitle: data?.japanese_title || data?.animeInfo?.Japanese || '',
        status: data?.status || data?.animeInfo?.Status || 'Unknown',
        aired: data?.aired || data?.animeInfo?.Aired || '',
        genres: Array.isArray(data?.genres)
          ? data.genres
          : (typeof data?.animeInfo?.Genres === 'string' ? data.animeInfo.Genres.split(',').map((s: string) => s.trim()) : [])
      };
    }
  };

  // --- BRIDGE: kept for the one existing call site (hindi-watch WatchClient).
  // With a single unified source there's no cross-source lookup left to do —
  // this is now just an alias for getDetails(), whose `recommendations` are
  // already populated straight from the same API response.
  bridge = {
    getSmartDetails: async (id: string) => {
      const details = await this.desidub.getDetails(id);
      if (!details) throw new Error('Anime not found');
      return { ...details, satoruId: null };
    }
  };
}

export const hpi = new HPIClient();
