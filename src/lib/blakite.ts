/**
 * Blakite Hindi Anime Service & Scraper
 * Self-hosted locally inside shadow-garden-v2 with in-memory caching.
 */

const BLAKITE_API_URL = 'https://blakiteapi.xyz/api/getAllAnime.php';
export const BLAKITE_SERVER_URL = 'https://blakiteapi.xyz';

export interface BlakiteRawItem {
  tmdbId: string;
  originalTmdbId?: string;
  title: string;
  language: string;
  type: string;
  status?: string;
  TMDB_DATA?: {
    genres?: string[];
    synopsis?: string;
    rating?: string;
    releaseDate?: string;
    trailer?: string;
    keywords?: string[];
  };
  IMAGES?: {
    poster?: string;
    backdrop?: string;
  };
  seasons?: Record<
    string,
    {
      seasonNumber: number;
      status: string;
      totalEpisodes: number;
      createdAt?: string;
      updatedAt?: string;
    }
  >;
}

export interface BlakiteDatabase {
  movies: Record<string, BlakiteRawItem>;
  series: Record<string, BlakiteRawItem>;
  dramas: Record<string, BlakiteRawItem>;
}

export interface BlakiteAnimeCard {
  id: string;
  slug: string;
  title: string;
  titleJp: string;
  image: string;
  href: string;
  type: string;
  date: string;
  score: number;
  episodes: {
    sub: number;
    dub: number;
    total: number;
  };
}

export interface BlakiteEpisode {
  id: string;
  number: string;
  seasonNumber?: number;
  episodeInSeason?: number;
  title: string;
  href: string;
  hasSub: boolean;
  hasDub: boolean;
}

// In-memory cache for the full catalog (1 hour TTL)
let cachedDb: BlakiteDatabase | null = null;
let cachedDbTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function fetchBlakiteDatabase(): Promise<BlakiteDatabase | null> {
  const now = Date.now();
  if (cachedDb && (now - cachedDbTime) < CACHE_TTL_MS) {
    return cachedDb;
  }

  try {
    const res = await fetch(BLAKITE_API_URL, {
      headers: {
        'Referer': BLAKITE_SERVER_URL + '/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      console.warn(`[Blakite] Upstream returned status ${res.status}`);
      return cachedDb; // return stale if available
    }

    const data = await res.json();
    if (data && data.success && data.data) {
      cachedDb = data.data as BlakiteDatabase;
      cachedDbTime = now;
      return cachedDb;
    }

    return cachedDb;
  } catch (error) {
    console.error('[Blakite] Failed to fetch database:', error);
    return cachedDb;
  }
}

export function normalizeBlakiteCard(item: BlakiteRawItem, id: string): BlakiteAnimeCard {
  let totalEps = 0;
  if (item.seasons) {
    for (const s of Object.values(item.seasons)) {
      totalEps += s.totalEpisodes || 0;
    }
  } else if (item.type === 'Movie') {
    totalEps = 1;
  }

  const isSub = (item.language || '').toLowerCase().includes('sub');
  const isDub = (item.language || '').toLowerCase().includes('dub') || item.language === 'ORG' || item.language === 'FanDub';

  return {
    id: id,
    slug: id,
    title: item.title,
    titleJp: item.title,
    image: item.IMAGES?.poster || item.IMAGES?.backdrop || '',
    href: `/api/blakite/anime/${id}`,
    type: item.type || 'TV',
    date: item.TMDB_DATA?.releaseDate?.split('-')[0] || '?',
    score: Number(item.TMDB_DATA?.rating) || 0,
    episodes: {
      sub: isSub ? totalEps : 0,
      dub: isDub ? totalEps : 0,
      total: totalEps,
    },
  };
}

function getBlakiteItemDate(item: BlakiteRawItem): number {
  let tsRaw: any = (item as any).updatedAt || (item as any).createdAt || null;
  
  if (!tsRaw && item.seasons) {
    let maxTs = 0;
    for (const s of Object.values(item.seasons)) {
      const sTs = new Date(s.updatedAt || s.createdAt || 0).getTime();
      if (sTs > maxTs) {
        maxTs = sTs;
        tsRaw = s.updatedAt || s.createdAt;
      }
    }
  }

  if (!tsRaw) {
    tsRaw = item.TMDB_DATA?.releaseDate;
  }

  let dateToUse = tsRaw ? new Date(tsRaw).getTime() : 0;
  if (isNaN(dateToUse)) dateToUse = 0;
  return dateToUse;
}

export async function getBlakiteHome() {
  const db = await fetchBlakiteDatabase();
  if (!db) return null;

  const allItems: { id: string; item: BlakiteRawItem; dateToUse: number }[] = [
    ...Object.entries(db.movies || {}).map(([id, item]) => ({ id, item, dateToUse: getBlakiteItemDate(item) })),
    ...Object.entries(db.series || {}).map(([id, item]) => ({ id, item, dateToUse: getBlakiteItemDate(item) })),
    ...Object.entries(db.dramas || {}).map(([id, item]) => ({ id, item, dateToUse: getBlakiteItemDate(item) }))
  ];

  allItems.sort((a, b) => b.dateToUse - a.dateToUse);

  const spotlight = allItems.slice(0, 10).map(i => normalizeBlakiteCard(i.item, i.id));
  const recentlyUpdated = allItems.slice(0, 30).map(i => normalizeBlakiteCard(i.item, i.id));
  
  const ongoingAnime = allItems.filter(i => i.item.status === 'Ongoing').slice(0, 20).map(i => normalizeBlakiteCard(i.item, i.id));
  const moviesCollection = allItems.filter(i => i.item.type === 'Movie').slice(0, 20).map(i => normalizeBlakiteCard(i.item, i.id));
  const dramaLiveAction = allItems.filter(i => i.item.type === 'Drama').slice(0, 20).map(i => normalizeBlakiteCard(i.item, i.id));
  
  const completedSeries = allItems.filter(i => i.item.status === 'Completed').slice(0, 20).map(i => normalizeBlakiteCard(i.item, i.id));
  const hindiDubbedOrg = allItems.filter(i => i.item.language === 'ORG').slice(0, 20).map(i => normalizeBlakiteCard(i.item, i.id));
  const hindiFanDubbed = allItems.filter(i => i.item.language === 'Fandub').slice(0, 20).map(i => normalizeBlakiteCard(i.item, i.id));

  return {
    spotlight,
    recentlyUpdated,
    ongoingAnime,
    moviesCollection,
    dramaLiveAction,
    completedSeries,
    hindiDubbedOrg,
    hindiFanDubbed,
  };
}

export async function getBlakiteLatest(type: string = 'updated-all', page: number = 1) {
  const db = await fetchBlakiteDatabase();
  if (!db) return null;

  const allItems: { id: string; item: BlakiteRawItem; dateToUse: number }[] = [
    ...Object.entries(db.movies || {}).map(([id, item]) => ({ id, item, dateToUse: getBlakiteItemDate(item) })),
    ...Object.entries(db.series || {}).map(([id, item]) => ({ id, item, dateToUse: getBlakiteItemDate(item) })),
    ...Object.entries(db.dramas || {}).map(([id, item]) => ({ id, item, dateToUse: getBlakiteItemDate(item) }))
  ];

  allItems.sort((a, b) => b.dateToUse - a.dateToUse);

  let filteredItems = allItems;
  if (type === 'updated-sub') {
    filteredItems = allItems.filter(i => (i.item.language || '').toLowerCase().includes('sub'));
  } else if (type === 'updated-dub') {
    filteredItems = allItems.filter(i => (i.item.language || '').toLowerCase().includes('dub') || i.item.language === 'ORG' || i.item.language === 'Fandub');
  } else if (type === 'trending') {
    filteredItems = allItems.filter(i => i.item.status === 'Ongoing');
  }

  const totalResults = filteredItems.length;
  const maxPage = Math.ceil(totalResults / 24) || 1;
  const pagedResults = filteredItems.slice((page - 1) * 24, page * 24).map(x => normalizeBlakiteCard(x.item, x.id));

  return {
    totalResults,
    currentPage: page,
    hasNextPage: page < maxPage,
    hasPreviousPage: page > 1,
    maxPage,
    minPage: 1,
    results: pagedResults
  };
}

export async function getBlakitePopular(page: number = 1, perPage: number = 24) {
  const db = await fetchBlakiteDatabase();
  if (!db) {
    return {
      totalResults: 0,
      currentPage: page,
      hasNextPage: false,
      hasPreviousPage: false,
      maxPage: 1,
      minPage: 1,
      results: []
    };
  }

  const allItems: { id: string; item: BlakiteRawItem; rating: number; dateToUse: number }[] = [
    ...Object.entries(db.series || {}).map(([id, item]) => ({ 
      id, 
      item, 
      rating: parseFloat(item.TMDB_DATA?.rating || '0'),
      dateToUse: getBlakiteItemDate(item)
    })),
    ...Object.entries(db.movies || {}).map(([id, item]) => ({ 
      id, 
      item, 
      rating: parseFloat(item.TMDB_DATA?.rating || '0'),
      dateToUse: getBlakiteItemDate(item)
    }))
  ];

  // Filter strictly for Hindi Dubs (ORG, Fandub, or Hindi in title/language)
  const hindiItems = allItems.filter(i => 
    i.item.language === 'ORG' || 
    i.item.language === 'Fandub' || 
    /hindi/i.test(i.item.language || '') || 
    /hindi/i.test(i.item.title || '')
  );

  // Sort by rating descending, with recency as secondary tiebreaker
  hindiItems.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.dateToUse - a.dateToUse;
  });

  const totalResults = hindiItems.length;
  const maxPage = Math.ceil(totalResults / perPage) || 1;
  const pagedResults = hindiItems
    .slice((page - 1) * perPage, page * perPage)
    .map(x => normalizeBlakiteCard(x.item, x.id));

  return {
    totalResults,
    currentPage: page,
    hasNextPage: page < maxPage,
    hasPreviousPage: page > 1,
    maxPage,
    minPage: 1,
    results: pagedResults
  };
}

export interface SeasonInfo {
  baseTitle: string;
  season: number;
  isSeasonExplicit: boolean;
}

export function extractSeasonInfo(title: string): SeasonInfo {
  if (!title) return { baseTitle: '', season: 1, isSeasonExplicit: false };
  const t = title.trim();
  let season = 1;
  let isSeasonExplicit = false;

  if (/\b(?:2nd|second)\s*season\b/i.test(t)) {
    season = 2;
    isSeasonExplicit = true;
  } else if (/\b(?:3rd|third)\s*season\b/i.test(t)) {
    season = 3;
    isSeasonExplicit = true;
  } else if (/\b(?:4th|fourth)\s*season\b/i.test(t)) {
    season = 4;
    isSeasonExplicit = true;
  } else if (/\b(?:5th|fifth)\s*season\b/i.test(t)) {
    season = 5;
    isSeasonExplicit = true;
  } else if (/\bfinal\s*season\b/i.test(t)) {
    season = 4;
    isSeasonExplicit = true;
  } else {
    const sMatch = t.match(/\bseason\s*(\d+)\b/i);
    if (sMatch) {
      season = parseInt(sMatch[1], 10);
      isSeasonExplicit = true;
    } else {
      const pMatch = t.match(/\bpart\s*(\d+)\b/i);
      if (pMatch) {
        season = parseInt(pMatch[1], 10);
        isSeasonExplicit = true;
      } else {
        const rMatch = t.match(/(?:^|\s|\()(VI|IV|V|III|II)(?:\s*[:\-\(\]]|\s*$)/i);
        if (rMatch) {
          const roman = rMatch[1].toUpperCase();
          if (roman === 'II') season = 2;
          else if (roman === 'III') season = 3;
          else if (roman === 'IV') season = 4;
          else if (roman === 'V') season = 5;
          else if (roman === 'VI') season = 6;
          isSeasonExplicit = true;
        }
      }
    }
  }

  const baseTitle = t
    .replace(/\(tv\)|\(movie\)|\(dub\)|\(sub\)|\(hindi dubbed\)|\(hindi fan dubbed\)|\(english dubbed\)|\(english subbed\)/gi, '')
    .replace(/\b(?:1st|first|2nd|second|3rd|third|4th|fourth|5th|fifth)\s*season\b/gi, '')
    .replace(/\bfinal\s*season\b/gi, '')
    .replace(/\bseason\s*\d+\b/gi, '')
    .replace(/\bpart\s*\d+\b/gi, '')
    .replace(/(?:^|\s|\()(VI|IV|V|III|II)(?:\s*[:\-\(\]]|\s*$)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { baseTitle, season, isSeasonExplicit };
}

export function normalizeBlakiteTitle(t: string): string {
  return (t || '')
    .toLowerCase()
    .replace(/\(tv\)|\(movie\)|\(dub\)|\(sub\)|\(hindi dubbed\)|\(hindi fan dubbed\)|\(english dubbed\)|\(english subbed\)/gi, '')
    .replace(/hindidubbed|hindifandubbed|fandubbed|dubbed|hindi/gi, '')
    .replace(/[^a-z0-9]/g, '');
}

export function findEpisodeInBlakite(
  episodes: BlakiteEpisode[],
  targetSeason: number,
  targetEpNum: number,
  isSeasonExplicit: boolean
): BlakiteEpisode | null {
  if (!episodes.length || isNaN(targetEpNum) || targetEpNum <= 0) return null;

  if (isSeasonExplicit) {
    const inSeasonMatch = episodes.find(e => e.seasonNumber === targetSeason && e.episodeInSeason === targetEpNum);
    if (inSeasonMatch) return inSeasonMatch;
    return null;
  }

  const s1Match = episodes.find(e => (e.seasonNumber === 1 || !e.seasonNumber) && (e.episodeInSeason === targetEpNum || Number(e.number) === targetEpNum));
  if (s1Match) return s1Match;

  const cumulativeMatch = episodes.find(e => Number(e.number) === targetEpNum);
  if (cumulativeMatch) return cumulativeMatch;

  return null;
}

export async function checkHindiDub(
  title: string,
  episode?: number | string
): Promise<{
  available: boolean;
  id?: string;
  title?: string;
  dubType?: 'Hindi Official Dub' | 'Hindi Fan Dub' | 'Hindi Dub' | string;
  language?: string;
  season?: number;
  totalEpisodes?: number;
  episodeAvailable?: boolean;
  matchedEpisode?: { id: string; season?: number; epInSeason?: number; number?: string };
  score?: number;
}> {
  const db = await fetchBlakiteDatabase();
  if (!db || !title) return { available: false, episodeAvailable: false };

  const allItems: { id: string; item: BlakiteRawItem }[] = [
    ...Object.entries(db.series || {}).map(([id, item]) => ({ id, item })),
    ...Object.entries(db.movies || {}).map(([id, item]) => ({ id, item })),
    ...Object.entries(db.dramas || {}).map(([id, item]) => ({ id, item }))
  ];

  const qInfo = extractSeasonInfo(title);
  const qClean = normalizeBlakiteTitle(qInfo.baseTitle);
  if (!qClean) return { available: false, episodeAvailable: false };

  const matched = allItems.find(({ item }) => {
    const isHindi = item.language === 'ORG' || item.language === 'Fandub' || /hindi/i.test(item.language || '') || /hindi/i.test(item.title || '');
    if (!isHindi) return false;

    const tInfo = extractSeasonInfo(item.title || '');
    const tClean = normalizeBlakiteTitle(tInfo.baseTitle);

    const titleMatches = (tClean === qClean) ||
      (qClean.length >= 6 && (tClean.includes(qClean) || qClean.includes(tClean)));
    if (!titleMatches) return false;

    // Strict season check:
    if (item.seasons) {
      const availSeasons = Object.values(item.seasons).map(s => s.seasonNumber);
      return availSeasons.includes(qInfo.season);
    }
    return qInfo.season === 1;
  });

  if (!matched) return { available: false, episodeAvailable: false };

  let totalEps = 0;
  if (matched.item.seasons) {
    if (qInfo.isSeasonExplicit) {
      const targetSeasonObj = Object.values(matched.item.seasons).find(s => s.seasonNumber === qInfo.season);
      totalEps = targetSeasonObj?.totalEpisodes || 0;
    } else {
      const s1 = Object.values(matched.item.seasons).find(s => s.seasonNumber === 1);
      totalEps = s1?.totalEpisodes || Object.values(matched.item.seasons).reduce((acc, s) => acc + (s.totalEpisodes || 0), 0);
    }
  } else if (matched.item.type === 'Movie') {
    totalEps = 1;
  }

  const episodes = generateBlakiteEpisodes(matched.item, matched.id);

  let epObj: BlakiteEpisode | null = null;
  let episodeAvailable = true;

  if (episode !== undefined && episode !== null && String(episode).trim() !== '') {
    const epNum = Number(episode);
    epObj = findEpisodeInBlakite(episodes, qInfo.season, epNum, qInfo.isSeasonExplicit);
    episodeAvailable = !!epObj;
  }

  const dubType = matched.item.language === 'ORG' 
    ? 'Hindi Official Dub' 
    : (matched.item.language === 'Fandub' ? 'Hindi Fan Dub' : 'Hindi Dub');

  return {
    available: true,
    id: matched.id,
    title: matched.item.title,
    dubType,
    language: matched.item.language,
    season: qInfo.season,
    totalEpisodes: totalEps,
    episodeAvailable,
    matchedEpisode: epObj ? {
      id: epObj.id,
      season: epObj.seasonNumber,
      epInSeason: epObj.episodeInSeason,
      number: epObj.number
    } : undefined,
    score: Number(matched.item.TMDB_DATA?.rating) || 0
  };
}

export async function searchBlakite(keyword: string, page: number = 1) {
  const db = await fetchBlakiteDatabase();
  if (!db) return null;
  const lowerKeyword = (keyword || '').toLowerCase().trim();
  
  const allItems: { id: string; item: BlakiteRawItem }[] = [
    ...Object.entries(db.movies || {}).map(([id, item]) => ({ id, item })),
    ...Object.entries(db.series || {}).map(([id, item]) => ({ id, item })),
    ...Object.entries(db.dramas || {}).map(([id, item]) => ({ id, item }))
  ];

  const matches = allItems
    .filter(({ item }) => (item.title || '').toLowerCase().includes(lowerKeyword))
    .map(({ id, item }) => normalizeBlakiteCard(item, id));

  const itemsPerPage = 24;
  const maxPage = Math.ceil(matches.length / itemsPerPage) || 1;
  const pagedResults = matches.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return {
    keyword,
    totalResults: matches.length,
    currentPage: page,
    hasNextPage: page < maxPage,
    hasPreviousPage: page > 1,
    maxPage,
    minPage: 1,
    results: pagedResults
  };
}

export async function filterBlakite(params: { genre?: string; type?: string; status?: string; sort?: string }, page: number = 1) {
  const db = await fetchBlakiteDatabase();
  if (!db) return null;
  
  let matches = [
    ...Object.entries(db.movies || {}).map(([id, item]) => ({ id, item })),
    ...Object.entries(db.series || {}).map(([id, item]) => ({ id, item })),
    ...Object.entries(db.dramas || {}).map(([id, item]) => ({ id, item }))
  ];
  
  if (params.genre) {
    const genreLower = params.genre.toLowerCase();
    matches = matches.filter(m => m.item.TMDB_DATA?.genres?.some(g => g.toLowerCase() === genreLower));
  }
  
  if (params.type) {
    const typeLower = params.type.toLowerCase();
    matches = matches.filter(m => (m.item.type || '').toLowerCase() === typeLower);
  }
  
  if (params.status) {
    const statusLower = params.status.toLowerCase();
    matches = matches.filter(m => (m.item.status || 'Completed').toLowerCase() === statusLower);
  }

  if (params.sort === 'score') {
    matches.sort((a, b) => parseFloat(b.item.TMDB_DATA?.rating || '0') - parseFloat(a.item.TMDB_DATA?.rating || '0'));
  } else {
    matches.reverse();
  }

  const cards = matches.map(m => normalizeBlakiteCard(m.item, m.id));

  const itemsPerPage = 24;
  const maxPage = Math.ceil(cards.length / itemsPerPage) || 1;
  const pagedResults = cards.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return {
    totalResults: cards.length,
    currentPage: page,
    hasNextPage: page < maxPage,
    hasPreviousPage: page > 1,
    maxPage,
    minPage: 1,
    results: pagedResults
  };
}

export function generateBlakiteEpisodes(item: BlakiteRawItem, id: string): BlakiteEpisode[] {
  const episodes: BlakiteEpisode[] = [];

  if (item.type === 'Movie' || !item.seasons) {
    episodes.push({
      id: id,
      number: '1',
      title: 'Full Movie',
      href: `/api/blakite/watch/${id}`,
      hasSub: (item.language || '').toLowerCase().includes('sub'),
      hasDub: (item.language || '').toLowerCase().includes('dub') || item.language === 'ORG' || item.language === 'FanDub',
    });
    return episodes;
  }

  const seasons = Object.values(item.seasons).sort((a, b) => a.seasonNumber - b.seasonNumber);
  
  let cumulative = 0;
  for (const season of seasons) {
    for (let i = 1; i <= season.totalEpisodes; i++) {
      cumulative++;
      episodes.push({
        id: `${id}::${season.seasonNumber}-${i}`,
        number: String(cumulative),
        seasonNumber: season.seasonNumber,
        episodeInSeason: i,
        title: `Season ${season.seasonNumber} - Episode ${i}`,
        href: `/api/blakite/watch/${id}::${season.seasonNumber}-${i}`,
        hasSub: (item.language || '').toLowerCase().includes('sub'),
        hasDub: (item.language || '').toLowerCase().includes('dub') || item.language === 'ORG' || item.language === 'FanDub',
      });
    }
  }

  return episodes;
}

export async function getBlakiteDetail(id: string) {
  const db = await fetchBlakiteDatabase();
  if (!db) return null;

  let item: BlakiteRawItem | null = null;
  if (db.movies && db.movies[id]) item = db.movies[id];
  else if (db.series && db.series[id]) item = db.series[id];
  else if (db.dramas && db.dramas[id]) item = db.dramas[id];

  if (!item) return null;

  const card = normalizeBlakiteCard(item, id);
  const episodes = generateBlakiteEpisodes(item, id);

  return {
    ...card,
    id,
    nativeTitle: item.title,
    englishTitle: item.title,
    synonyms: [],
    banner: item.IMAGES?.backdrop || item.IMAGES?.poster || '',
    synopsis: item.TMDB_DATA?.synopsis || 'No synopsis available.',
    status: item.status || 'Completed',
    rating: item.TMDB_DATA?.rating || '0',
    premiered: item.TMDB_DATA?.releaseDate || '?',
    season: 'ANIME',
    aired: item.TMDB_DATA?.releaseDate || '?',
    episodesCount: String(episodes.length),
    studios: [],
    producers: [],
    genres: item.TMDB_DATA?.genres || [],
    episodes: episodes.map(e => ({
      id: e.id,
      number: e.number,
      seasonNumber: e.seasonNumber,
      episodeInSeason: e.episodeInSeason,
      title: e.title,
      url: e.href,
      image: item?.IMAGES?.backdrop || item?.IMAGES?.poster || ''
    })),
    recommendations: [],
    related: [],
    downloads: []
  };
}

export async function getBlakiteStreamUrl(slug: string) {
  let apiUrl = '';
  let tmdbId = slug;
  let uniqueId = '';

  if (slug.includes('::')) {
    [tmdbId, uniqueId] = slug.split('::');
    apiUrl = `${BLAKITE_SERVER_URL}/api/get.php?id=${encodeURIComponent(uniqueId)}&tmdbId=${encodeURIComponent(tmdbId)}`;
  } else {
    apiUrl = `${BLAKITE_SERVER_URL}/api/get.php?tmdbId=${encodeURIComponent(tmdbId)}`;
  }

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'Referer': BLAKITE_SERVER_URL + '/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
      },
      cache: 'no-store'
    });

    if (!res.ok) return null;

    const result = await res.json();
    if (!result.success || !result.data || !result.data.dataId) {
      return null;
    }

    const { dataId, format, quality, qid, ranges } = result.data;
    const baseDURL = "https://hugh.cdn.rumble.cloud/video/";
    
    const qualityLabels = ['240p', '360p', '480p', '720p', '1080p'];
    const qualityCodes = ['oaa', 'baa', 'caa', 'gaa', 'haa'];
    
    const maxQualityIndex = Math.min(qid || 5, qualityLabels.length) - 1;
    const availableQualities = qualityLabels.slice(0, maxQualityIndex + 1);
    const availableQualityCodes = qualityCodes.slice(0, maxQualityIndex + 1);

    let defaultQuality = quality || '720p';
    if (!availableQualities.includes(defaultQuality)) {
      defaultQuality = availableQualities[availableQualities.length - 1] || '720p';
    }

    const defaultQualityIndex = Math.max(0, availableQualities.indexOf(defaultQuality));
    const qualityCode = availableQualityCodes[defaultQualityIndex] || 'gaa';

    let videoUrl = '';
    let isM3U8 = false;

    if (format === 'M3U8' && ranges) {
      const rangeMap: Record<string, string> = {};
      const rangeLines = String(ranges).split('\n').map(l => l.trim()).filter(Boolean);
      rangeLines.forEach(line => {
        const match = line.match(/^(\d+-\d+)\s*\(([^)]+)\)/);
        if (match) {
          rangeMap[match[2]] = match[1];
        }
      });

      const range = rangeMap[defaultQuality] || '';
      videoUrl = `${baseDURL}${dataId}.${qualityCode}.tar?r_file=chunklist.m3u8&r_type=application%2Fvnd.apple.mpegurl${range ? `&r_range=${range}` : ''}`;
      isM3U8 = true;
    } else {
      videoUrl = `${baseDURL}${dataId}.${qualityCode}.mp4`;
      isM3U8 = false;
    }

    return { 
      url: videoUrl, 
      isM3U8,
      dataId,
      referer: 'https://blakiteapi.xyz/' 
    };

  } catch (err) {
    console.error('[Blakite] Failed to resolve stream:', err);
    return null;
  }
}

export interface HindiScheduleItem {
  id: string;
  name: string;
  jname?: string;
  title: string;
  poster: string;
  backdrop?: string;
  score: number;
  time: string;
  date: string;
  timestamp: number;
  episode: number;
  seasonNumber: number;
  totalEpisodes: number;
  dubType: 'ORG' | 'FanDub' | 'Hindi Dub';
  status: string;
  type: string;
  watchUrl: string;
}

export interface HindiScheduleResponse {
  scheduledAnimes: HindiScheduleItem[];
  allRecent: HindiScheduleItem[];
  ongoing: HindiScheduleItem[];
  targetDate: string;
}

export function cleanHindiTitle(rawTitle: string): string {
  return (rawTitle || '')
    .replace(/\(Hindi Dubbed\)/gi, '')
    .replace(/\(Hindi Dub\)/gi, '')
    .replace(/\[Hindi Dub\]/gi, '')
    .replace(/\(ORG\)/gi, '')
    .replace(/\(FanDub\)/gi, '')
    .trim();
}

export async function getHindiDubSchedule(targetDate?: string): Promise<HindiScheduleResponse> {
  const db = await fetchBlakiteDatabase();
  const todayStr = targetDate || new Date().toISOString().slice(0, 10);
  if (!db) {
    return { scheduledAnimes: [], allRecent: [], ongoing: [], targetDate: todayStr };
  }

  const allEntries: [string, BlakiteRawItem][] = [
    ...Object.entries(db.series || {}),
    ...Object.entries(db.movies || {}),
    ...Object.entries(db.dramas || {})
  ];

  const hindiEntries = allEntries.filter(([, item]) => {
    const lang = (item.language || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    return item.language === 'ORG' || item.language === 'FanDub' || lang.includes('dub') || lang.includes('hindi') || title.includes('hindi');
  });

  const parsedItems: HindiScheduleItem[] = [];
  const ongoingMap = new Map<string, HindiScheduleItem>();

  for (const [id, item] of hindiEntries) {
    const cleanTitle = cleanHindiTitle(item.title);
    const poster = item.IMAGES?.poster || item.IMAGES?.backdrop || '';
    const score = Number(item.TMDB_DATA?.rating) || 0;
    const dubType: 'ORG' | 'FanDub' | 'Hindi Dub' = 
      item.language === 'ORG' ? 'ORG' : 
      (item.language === 'FanDub' ? 'FanDub' : 'Hindi Dub');

    if (item.seasons && Object.keys(item.seasons).length > 0) {
      for (const s of Object.values(item.seasons)) {
        const rawDate = s.updatedAt || s.createdAt || (item as any).updatedAt || item.TMDB_DATA?.releaseDate;
        if (!rawDate) continue;

        const parts = String(rawDate).trim().split(' ');
        const datePart = parts[0] || todayStr;
        const timePart = parts[1] ? parts[1].slice(0, 5) : '00:00';
        const parsedTs = Math.floor(new Date(rawDate.replace(' ', 'T')).getTime() / 1000) || Math.floor(Date.now() / 1000);

        const scheduleItem: HindiScheduleItem = {
          id,
          name: cleanTitle,
          jname: item.title,
          title: `${cleanTitle} (S${s.seasonNumber || 1})`,
          poster,
          backdrop: item.IMAGES?.backdrop || '',
          score,
          time: timePart,
          date: datePart,
          timestamp: parsedTs,
          episode: s.totalEpisodes || 1,
          seasonNumber: s.seasonNumber || 1,
          totalEpisodes: s.totalEpisodes || 1,
          dubType,
          status: s.status || item.status || 'Ongoing',
          type: item.type || 'TV',
          watchUrl: `/watch/${id}?ep=${s.totalEpisodes || 1}&audio=hi&type=dub`
        };

        parsedItems.push(scheduleItem);

        if (scheduleItem.status === 'Ongoing' || item.status === 'Ongoing') {
          const prev = ongoingMap.get(id);
          if (!prev || scheduleItem.timestamp > prev.timestamp) {
            ongoingMap.set(id, scheduleItem);
          }
        }
      }
    } else {
      // Movie / single item
      const rawDate = (item as any).updatedAt || (item as any).createdAt || item.TMDB_DATA?.releaseDate;
      const parts = String(rawDate || '').trim().split(' ');
      const datePart = parts[0] || todayStr;
      const timePart = parts[1] ? parts[1].slice(0, 5) : '00:00';
      const parsedTs = rawDate ? Math.floor(new Date(rawDate.replace(' ', 'T')).getTime() / 1000) : Math.floor(Date.now() / 1000);

      parsedItems.push({
        id,
        name: cleanTitle,
        jname: item.title,
        title: cleanTitle,
        poster,
        backdrop: item.IMAGES?.backdrop || '',
        score,
        time: timePart,
        date: datePart,
        timestamp: parsedTs,
        episode: 1,
        seasonNumber: 1,
        totalEpisodes: 1,
        dubType,
        status: item.status || 'Completed',
        type: item.type || 'Movie',
        watchUrl: `/watch/${id}?ep=1&audio=hi&type=dub`
      });
    }
  }

  // Sort descending by timestamp
  parsedItems.sort((a, b) => b.timestamp - a.timestamp);

  // Exact target date matches
  const targetDayMatches = parsedItems.filter(item => item.date === todayStr);

  return {
    scheduledAnimes: targetDayMatches,
    allRecent: parsedItems.slice(0, 50),
    ongoing: Array.from(ongoingMap.values()).slice(0, 20),
    targetDate: todayStr
  };
}

export async function getHindiReleasingToday(limit = 24) {
  const schedule = await getHindiDubSchedule();
  let list = [...schedule.scheduledAnimes];
  
  // If fewer than limit releases today, top up with recent updates from this week
  if (list.length < limit) {
    const seenIds = new Set(list.map(x => `${x.id}-${x.seasonNumber}`));
    for (const item of schedule.allRecent) {
      const key = `${item.id}-${item.seasonNumber}`;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        list.push(item);
      }
      if (list.length >= limit) break;
    }
  }

  return list.slice(0, limit).map(item => ({
    id: item.id,
    title: item.title,
    name: item.name,
    poster: item.poster,
    image: item.poster,
    episode: item.episode,
    score: item.score,
    type: item.type || 'TV',
    airingAt: item.timestamp,
    isHindi: true,
    dubType: item.dubType,
    watchUrl: item.watchUrl
  }));
}

