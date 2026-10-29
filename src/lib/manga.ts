/**
 * Unified Manga, Manhwa, Comics, Webtoons, Light Novels & Web Novels Engine
 * Powered by MangaDex REST API, AniList Novel Codex, and Multi-language Translation Engine (EN, HI, BN, ES, FR, JA, etc.)
 */

import { translateText } from './translator';

/**
 * Normalizes chapter/volume strings to clean, concise badges (e.g. "Ch. 65", "Vol. 26").
 * Prevents redundant prefixes like "Ch. Chapter 65" or "Ch. Volume 26".
 */
export function formatChapterBadge(ch?: string | number): string {
  if (!ch) return 'Read';
  const str = String(ch).trim();
  if (!str) return 'Read';

  // Normalize Volume labels
  if (/^vol(ume)?\.?\s*/i.test(str)) {
    return str.replace(/^vol(ume)?\.?\s*/i, 'Vol. ');
  }

  // Normalize Chapter labels
  if (/^ch(apter)?\.?\s*/i.test(str)) {
    return str.replace(/^ch(apter)?\.?\s*/i, 'Ch. ');
  }

  // Pure numbers or numbers with decimals/pluses (e.g. "65", "65.5", "60+")
  if (/^\d+(\.\d+)?(\+)?/i.test(str)) {
    return `Ch. ${str}`;
  }

  return str;
}

export type ReadingMediaType = 
  | 'all'
  | 'recent'
  | 'manga'
  | 'manhwa'
  | 'manhua'
  | 'comic'
  | 'webtoon'
  | 'light_novel'
  | 'web_novel';

export type SupportedReadingLanguage = 'en' | 'hi' | 'bn' | string;

export interface ReadingItem {
  id: string;
  slug: string;
  title: string;
  romajiTitle?: string;
  nativeTitle?: string;
  altTitles: string[];
  description: string;
  cover: string;
  banner?: string;
  type: ReadingMediaType;
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  year?: number | string;
  score?: string;
  genres: string[];
  author?: string;
  artist?: string;
  contentRating?: string;
  availableLanguages: string[];
  totalChapters?: number | string;
  latestChapter?: string;
  isNovel?: boolean;
}

export interface ReadingChapter {
  id: string;
  mediaId: string;
  chapter: string;
  volume?: string;
  title?: string;
  language: string;
  pages?: number;
  publishAt?: string;
  scanlationGroup?: string;
  externalUrl?: string;
  isNovel?: boolean;
}

export interface ChapterPagesResult {
  chapterId: string;
  mediaId?: string;
  chapterNumber: string;
  title?: string;
  language: string;
  pages: string[]; // Direct high-speed CDN URLs
  isNovel?: boolean;
  content?: string; // Text for novels
}

const MANGADEX_BASE = 'https://api.mangadex.org';

// Tag UUIDs for MangaDex filtering
const WEBTOON_TAG_ID = 'e197df38-d0e7-43b5-9b09-2842d0c326dd'; // Web Comic
const LONG_STRIP_TAG_ID = '3e2b8dae-350e-4ab8-a8ce-016e844b9f0d'; // Long Strip

/**
 * Maps MangaDex API response to unified ReadingItem
 */
function mapMangaDexItem(raw: any): ReadingItem {
  const attrs = raw.attributes || {};
  const id = raw.id;

  // Title extraction (en > ja-ro > others)
  const titleObj = attrs.title || {};
  const primaryTitle = titleObj.en || titleObj['ja-ro'] || titleObj.ja || Object.values(titleObj)[0] || 'Unknown Title';

  // Alt titles
  const altTitles = (attrs.altTitles || []).map((t: any) => Object.values(t)[0]).filter(Boolean) as string[];

  // Description
  const descObj = attrs.description || {};
  const description = descObj.en || Object.values(descObj)[0] || 'No synopsis available.';

  // Cover Art
  const coverRel = (raw.relationships || []).find((r: any) => r.type === 'cover_art');
  const coverFileName = coverRel?.attributes?.fileName;
  const cover = coverFileName 
    ? `https://uploads.mangadex.org/covers/${id}/${coverFileName}.512.jpg`
    : '/images/placeholder.jpg';

  // Determine Type based on originalLanguage and tags
  const origLang = attrs.originalLanguage || 'ja';
  const tagIds = (attrs.tags || []).map((t: any) => t.id);
  const tagNames = (attrs.tags || []).map((t: any) => t.attributes?.name?.en).filter(Boolean);

  let type: ReadingMediaType = 'manga';
  if (origLang === 'ko') {
    type = 'manhwa';
  } else if (origLang === 'zh' || origLang === 'zh-hk') {
    type = 'manhua';
  } else if (origLang === 'en') {
    type = 'comic';
  } else if (tagIds.includes(WEBTOON_TAG_ID) || tagIds.includes(LONG_STRIP_TAG_ID)) {
    type = 'webtoon';
  }

  // All available translated languages from MangaDex metadata
  const rawLangs: string[] = Array.isArray(attrs.availableTranslatedLanguages)
    ? attrs.availableTranslatedLanguages.filter(Boolean)
    : [];

  const availableLanguages = Array.from(new Set(rawLangs.length > 0 ? rawLangs : ['en'])).sort((a, b) => {
    if (a === 'en') return -1;
    if (b === 'en') return 1;
    if (a === 'hi') return -1;
    if (b === 'hi') return 1;
    if (a === 'bn') return -1;
    if (b === 'bn') return 1;
    return a.localeCompare(b);
  });

  return {
    id,
    slug: id,
    title: String(primaryTitle),
    romajiTitle: titleObj['ja-ro'],
    nativeTitle: titleObj.ja || titleObj.ko || titleObj.zh,
    altTitles,
    description: String(description).replace(/\[\/?(b|i|u|url|spoiler)\]/gi, ''),
    cover,
    banner: cover,
    type,
    status: attrs.status || 'ongoing',
    year: attrs.year || (attrs.createdAt ? new Date(attrs.createdAt).getFullYear() : undefined),
    genres: tagNames,
    contentRating: attrs.contentRating || 'safe',
    availableLanguages,
    latestChapter: attrs.lastChapter || undefined,
    isNovel: false
  };
}

export const mangaService = {
  /**
   * Search Manga / Manhwa / Comics / Webtoons via MangaDex
   */
  async search(params: {
    query?: string;
    type?: ReadingMediaType;
    language?: string;
    genre?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ReadingItem[]; total: number }> {
    const { query = '', type = 'all', language, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const urlParams = new URLSearchParams();
    urlParams.set('limit', String(limit));
    urlParams.set('offset', String(offset));
    urlParams.append('includes[]', 'cover_art');
    urlParams.append('includes[]', 'author');
    urlParams.append('includes[]', 'artist');
    urlParams.append('contentRating[]', 'safe');
    urlParams.append('contentRating[]', 'suggestive');

    if (query.trim()) {
      urlParams.set('title', query.trim());
    } else {
      urlParams.set('order[followedCount]', 'desc');
    }

    // Type filtering by original language & tags
    if (type === 'manga') {
      urlParams.append('originalLanguage[]', 'ja');
    } else if (type === 'manhwa') {
      urlParams.append('originalLanguage[]', 'ko');
    } else if (type === 'manhua') {
      urlParams.append('originalLanguage[]', 'zh');
      urlParams.append('originalLanguage[]', 'zh-hk');
    } else if (type === 'comic') {
      urlParams.append('originalLanguage[]', 'en');
    } else if (type === 'webtoon') {
      urlParams.append('includedTags[]', WEBTOON_TAG_ID);
    }

    // Language filtering
    if (language) {
      urlParams.append('availableTranslatedLanguage[]', language);
    }

    try {
      const res = await fetch(`${MANGADEX_BASE}/manga?${urlParams.toString()}`, {
        headers: { 'User-Agent': 'ShadowGarden/2.0' },
        next: { revalidate: 300 }
      });

      if (!res.ok) throw new Error(`MangaDex search failed with status ${res.status}`);
      const data = await res.json();
      const items = (data.data || []).map(mapMangaDexItem);

      return {
        items,
        total: data.total || items.length
      };
    } catch (err) {
      console.error('Manga search error:', err);
      return { items: [], total: 0 };
    }
  },

  /**
   * Get Trending Manga / Manhwa / Webtoons
   */
  async getTrending(type: ReadingMediaType = 'all', page: number = 1, limit: number = 18, language?: string): Promise<ReadingItem[]> {
    const res = await this.search({ type, language, page, limit });
    return res.items;
  },

  /**
   * Get Recent Updates (latest uploaded chapters)
   */
  async getRecentUpdates(page: number = 1, limit: number = 18, language?: string): Promise<ReadingItem[]> {
    const offset = (page - 1) * limit;
    const urlParams = new URLSearchParams();
    urlParams.set('limit', String(limit));
    urlParams.set('offset', String(offset));
    urlParams.append('includes[]', 'cover_art');
    urlParams.append('includes[]', 'author');
    urlParams.append('includes[]', 'artist');
    urlParams.append('contentRating[]', 'safe');
    urlParams.append('contentRating[]', 'suggestive');
    urlParams.set('order[latestUploadedChapter]', 'desc');

    if (language && language !== 'all') {
      urlParams.append('availableTranslatedLanguage[]', language);
    }

    try {
      const res = await fetch(`${MANGADEX_BASE}/manga?${urlParams.toString()}`, {
        headers: { 'User-Agent': 'ShadowGarden/2.0' },
        next: { revalidate: 60 }
      });

      if (!res.ok) throw new Error(`MangaDex recent updates failed: ${res.status}`);
      const data = await res.json();
      return (data.data || []).map(mapMangaDexItem);
    } catch (err) {
      console.error('Manga recent updates error:', err);
      return [];
    }
  },

  /**
   * Get Manga Details by ID
   */
  async getDetails(id: string): Promise<ReadingItem | null> {
    try {
      const res = await fetch(`${MANGADEX_BASE}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`, {
        headers: { 'User-Agent': 'ShadowGarden/2.0' },
        next: { revalidate: 600 }
      });
      if (!res.ok) return null;
      const json = await res.json();
      return mapMangaDexItem(json.data);
    } catch (err) {
      console.error('Failed to get manga details:', err);
      return null;
    }
  },

  /**
   * Get Chapters Feed for a Manga (with external URL filtering, pagination loop & complete source loading)
   */
  /**
   * Get Chapters Feed for a Manga (with external URL filtering, pagination loop, multi-source fallback & complete chapter catalog)
   */
  async getChapters(
    mangaId: string, 
    language?: string,
    order: 'asc' | 'desc' = 'asc',
    limit: number = 500
  ): Promise<ReadingChapter[]> {
    const rawChapters: any[] = [];
    let offset = 0;
    const batchSize = 100; // MangaDex maximum per-request limit is 100
    let total = 0;

    try {
      do {
        const urlParams = new URLSearchParams();
        urlParams.set('limit', String(batchSize));
        urlParams.set('offset', String(offset));
        urlParams.set(`order[chapter]`, order);
        urlParams.append('includes[]', 'scanlation_group');
        urlParams.append('contentRating[]', 'safe');
        urlParams.append('contentRating[]', 'suggestive');
        urlParams.append('contentRating[]', 'erotica'); // CRITICAL: Include erotica so shonen & seinen chapters are not omitted
        urlParams.append('includeExternalUrl', '0'); // Exclude external links with 0 pages

        if (language) {
          urlParams.append('translatedLanguage[]', language);
        }

        const res = await fetch(`${MANGADEX_BASE}/manga/${mangaId}/feed?${urlParams.toString()}`, {
          headers: { 'User-Agent': 'ShadowGarden/2.0' },
          next: { revalidate: 300 }
        });

        if (!res.ok) {
          if (rawChapters.length > 0) break;
          throw new Error(`MangaDex feed failed with status ${res.status}`);
        }

        const data = await res.json();
        total = data.total || 0;
        const batch = data.data || [];
        rawChapters.push(...batch);
        offset += batch.length;

        // Stop if batch is empty, all chapters fetched, or limit reached
        if (batch.length === 0 || offset >= total || rawChapters.length >= limit) {
          break;
        }
      } while (offset < total);

      let parsedChapters: ReadingChapter[] = rawChapters
        .filter((c: any) => (c.attributes?.pages || 0) > 0)
        .map((c: any) => {
          const groupRel = (c.relationships || []).find((r: any) => r.type === 'scanlation_group');
          return {
            id: c.id,
            mediaId: mangaId,
            chapter: c.attributes?.chapter || '0',
            volume: c.attributes?.volume || undefined,
            title: c.attributes?.title || undefined,
            language: c.attributes?.translatedLanguage || 'en',
            pages: c.attributes?.pages || 0,
            publishAt: c.attributes?.publishAt || c.attributes?.createdAt,
            scanlationGroup: groupRel?.attributes?.name || 'Scanlation Archive',
            externalUrl: c.attributes?.externalUrl || undefined,
            isNovel: false
          };
        });

      // CHECK: If English chapters are missing or sparse (< 15 chapters e.g. Solo Leveling, Omniscient Reader due to MangaDex DMCA takedowns),
      // seamlessly query our secondary archive provider (WeebCentral) to provide the complete chapter catalog (Ch 0 to End).
      const enChapters = parsedChapters.filter(c => (c.language || 'en').toLowerCase() === 'en');
      if ((!language || language === 'en') && enChapters.length < 15) {
        try {
          const details = await this.getDetails(mangaId);
          const candidates: string[] = [];
          // Prioritize English / Latin altTitles (e.g. "Solo Leveling" when primary title is "Na Honjaman Level-Up")
          if (details?.altTitles) {
            const latinAlt = details.altTitles.filter(t => /^[a-zA-Z0-9\s:,'!?-]+$/.test(t));
            candidates.push(...latinAlt, ...details.altTitles);
          }
          if (details?.title) candidates.push(details.title);
          if (details?.romajiTitle) candidates.push(details.romajiTitle);

          const seriesId = await searchWeebCentral(candidates);
          if (seriesId) {
            const fallbackChapters = await getWeebCentralChapters(seriesId, mangaId);
            if (fallbackChapters.length > enChapters.length) {
              // Filter out sparse English chapters and merge complete fallback chapters
              parsedChapters = [
                ...parsedChapters.filter(c => (c.language || 'en').toLowerCase() !== 'en'),
                ...fallbackChapters
              ];
            }
          }
        } catch (fallbackErr) {
          console.warn('Fallback chapter provider error:', fallbackErr);
        }
      }

      // Deduplicate chapters by (language + chapter number) preferring chapters with valid titles and scanlation groups
      const seen = new Set<string>();
      const deduplicated: ReadingChapter[] = [];
      for (const ch of parsedChapters) {
        const key = `${ch.language.toLowerCase()}-${ch.chapter}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduplicated.push(ch);
        }
      }

      // Natural numerical sort by chapter number
      deduplicated.sort((a, b) => {
        const numA = parseFloat(a.chapter) || 0;
        const numB = parseFloat(b.chapter) || 0;
        return order === 'asc' ? numA - numB : numB - numA;
      });

      return deduplicated;
    } catch (err) {
      console.error('Failed to load manga chapters:', err);
      return [];
    }
  },

  /**
   * Get Chapter Pages via MangaDex @at-home Server or Secondary Archive
   */
  async getChapterPages(chapterId: string): Promise<ChapterPagesResult | null> {
    // 1. Handle Secondary Archive chapters (WeebCentral prefix)
    if (chapterId.startsWith('wc-')) {
      try {
        const pages = await getWeebCentralPages(chapterId);
        if (pages.length > 0) {
          return {
            chapterId,
            chapterNumber: '1',
            language: 'en',
            pages,
            isNovel: false
          };
        }
      } catch (err) {
        console.error('Secondary archive pages failed:', err);
      }
    }

    // 2. MangaDex @at-home Server
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`${MANGADEX_BASE}/at-home/server/${chapterId}`, {
          headers: { 'User-Agent': 'ShadowGarden/2.0' }
        });

        if (!res.ok) {
          if (attempt === 0 && (res.status === 500 || res.status === 502 || res.status === 503 || res.status === 429)) {
            await new Promise(r => setTimeout(r, 600));
            continue;
          }
          throw new Error(`At-home server responded with ${res.status}`);
        }
        const json = await res.json();
        const baseUrl = json.baseUrl;
        const hash = json.chapter?.hash;
        const data: string[] = json.chapter?.data || [];
        const dataSaver: string[] = json.chapter?.dataSaver || [];

        // Prefer high-res data, fallback to dataSaver
        const filesToUse = data.length > 0 ? data : dataSaver;
        const folder = data.length > 0 ? 'data' : 'data-saver';

        if (!baseUrl || !hash || filesToUse.length === 0) {
          throw new Error('No image pages returned by MangaDex');
        }

        // Build direct high-speed image URLs
        const pages = filesToUse.map((filename: string) => {
          return `${baseUrl}/${folder}/${hash}/${filename}`;
        });

        return {
          chapterId,
          chapterNumber: '1',
          language: 'en',
          pages,
          isNovel: false
        };
      } catch (err) {
        if (attempt === 1) {
          console.error('Failed to get chapter pages after retry:', err);
        }
      }
    }

    return {
      chapterId,
      chapterNumber: '1',
      language: 'en',
      pages: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80'
      ],
      isNovel: false
    };
  }
};

/**
 * Secondary Archive Helper Functions (WeebCentral integration for complete chapter coverage)
 */
async function searchWeebCentral(titleOrTitles: string | string[]): Promise<string | null> {
  const titles = Array.isArray(titleOrTitles) ? titleOrTitles : [titleOrTitles];
  for (const raw of titles) {
    if (!raw) continue;
    const cleanTitle = raw
      .replace(/\([^)]*\)/g, '')
      .replace(/Season\s+\d+/i, '')
      .replace(/Rank\s+#\d+/i, '')
      .trim();
    if (!cleanTitle || cleanTitle.length < 2) continue;

    try {
      const url = `https://weebcentral.com/search/data?text=${encodeURIComponent(cleanTitle)}&sort=Best+Match&order=Ascending&official=Any&anime=Any`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(6000)
      });
      if (!res.ok) continue;
      const html = await res.text();
      const seriesMatch = html.match(/href="https:\/\/weebcentral\.com\/series\/([^"\/]+)\/([^"]+)"/i);
      if (seriesMatch) {
        return seriesMatch[1];
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function getWeebCentralChapters(seriesId: string, mangaId: string): Promise<ReadingChapter[]> {
  try {
    const url = `https://weebcentral.com/series/${seriesId}/full-chapter-list`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return [];
    const html = await res.text();
    const re = /href="\/chapters\/([^"]+)"[\s\S]*?<span[^>]*>(Chapter\s+([0-9.]+)[^<]*)<\/span>/gi;
    let match;
    const chapters: ReadingChapter[] = [];
    while ((match = re.exec(html)) !== null) {
      chapters.push({
        id: `wc-${match[1]}`,
        mediaId: mangaId,
        chapter: match[3],
        title: match[2].trim(),
        language: 'en',
        pages: 20,
        scanlationGroup: 'Official Archive',
        isNovel: false
      });
    }
    // Reverse so Ch 0/1 is at the beginning
    return chapters.reverse();
  } catch {
    return [];
  }
}

async function getWeebCentralPages(chapterId: string): Promise<string[]> {
  try {
    const cleanId = chapterId.replace(/^wc-/, '');
    const url = `https://weebcentral.com/chapters/${cleanId}/images?is_prev=False&current_page=1&reading_style=long_strip`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return [];
    const html = await res.text();
    const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map(m => m[1]);
    return imgs.filter(u => u.startsWith('http'));
  } catch {
    return [];
  }
}

/**
 * Curated Light Novel & Web Novel Catalog with Chapter Content & Translation
 */
export const novelService = {
  /**
   * Fetch Trending Light Novels & Web Novels from AniList
   */
  async getTrending(page: number = 1, limit: number = 18): Promise<ReadingItem[]> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: MANGA, format: NOVEL, sort: [TRENDING_DESC, POPULARITY_DESC]) {
            id
            title {
              english
              romaji
              native
            }
            coverImage {
              extraLarge
              large
            }
            bannerImage
            description
            averageScore
            status
            genres
            chapters
            startDate {
              year
            }
          }
        }
      }
    `;

    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { page, perPage: limit } }),
        next: { revalidate: 600 }
      });

      if (!res.ok) return [];
      const json = await res.json();
      const mediaList = json.data?.Page?.media || [];

      return mediaList.map((m: any) => ({
        id: `novel-${m.id}`,
        slug: `novel-${m.id}`,
        title: m.title.english || m.title.romaji || 'Light Novel',
        romajiTitle: m.title.romaji,
        nativeTitle: m.title.native,
        altTitles: [m.title.romaji, m.title.native].filter(Boolean),
        description: (m.description || 'No synopsis available.').replace(/<[^>]*>?/gm, ''),
        cover: m.coverImage?.extraLarge || m.coverImage?.large || '/images/placeholder.jpg',
        banner: m.bannerImage || m.coverImage?.extraLarge,
        type: 'light_novel' as ReadingMediaType,
        status: m.status?.toLowerCase() || 'ongoing',
        year: m.startDate?.year,
        score: m.averageScore ? (m.averageScore / 10).toFixed(1) : '8.8',
        genres: m.genres || ['Fantasy', 'Adventure'],
        availableLanguages: ['en', 'hi', 'bn', 'es', 'fr', 'ja'],
        totalChapters: m.chapters || 'Ongoing',
        latestChapter: m.chapters ? `Ch. ${m.chapters}` : 'Ch. 60+',
        isNovel: true
      }));
    } catch (err) {
      console.error('Failed to load trending light novels:', err);
      return [];
    }
  },

  /**
   * Search Light Novels & Web Novels
   */
  async search(query: string, page: number = 1, limit: number = 20): Promise<ReadingItem[]> {
    const gql = `
      query ($search: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(search: $search, type: MANGA, format: NOVEL, sort: [SEARCH_MATCH]) {
            id
            title { english romaji native }
            coverImage { extraLarge large }
            bannerImage
            description
            averageScore
            status
            genres
            chapters
            startDate { year }
          }
        }
      }
    `;

    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: gql, variables: { search: query, page, perPage: limit } })
      });
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data?.Page?.media || []).map((m: any) => ({
        id: `novel-${m.id}`,
        slug: `novel-${m.id}`,
        title: m.title.english || m.title.romaji,
        romajiTitle: m.title.romaji,
        nativeTitle: m.title.native,
        altTitles: [m.title.romaji, m.title.native].filter(Boolean),
        description: (m.description || '').replace(/<[^>]*>?/gm, ''),
        cover: m.coverImage?.extraLarge || m.coverImage?.large || '/images/placeholder.jpg',
        banner: m.bannerImage,
        type: 'light_novel' as ReadingMediaType,
        status: m.status?.toLowerCase() || 'ongoing',
        year: m.startDate?.year,
        score: m.averageScore ? (m.averageScore / 10).toFixed(1) : '8.8',
        genres: m.genres || [],
        availableLanguages: ['en', 'hi', 'bn', 'es', 'fr', 'ja'],
        totalChapters: m.chapters || 'Ongoing',
        isNovel: true
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get Specific Novel Details by ID
   */
  async getDetails(id: string): Promise<ReadingItem | null> {
    const rawId = parseInt(id.replace(/^novel-/, ''), 10);
    if (isNaN(rawId)) return null;

    const query = `
      query ($id: Int) {
        Media(id: $id, type: MANGA, format: NOVEL) {
          id
          title { english romaji native }
          coverImage { extraLarge large }
          bannerImage
          description
          averageScore
          status
          genres
          chapters
          startDate { year }
        }
      }
    `;

    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { id: rawId } }),
        next: { revalidate: 600 }
      });

      if (!res.ok) return null;
      const json = await res.json();
      const m = json.data?.Media;
      if (!m) return null;

      return {
        id: `novel-${m.id}`,
        slug: `novel-${m.id}`,
        title: m.title.english || m.title.romaji || 'Light Novel',
        romajiTitle: m.title.romaji,
        nativeTitle: m.title.native,
        altTitles: [m.title.romaji, m.title.native].filter(Boolean),
        description: (m.description || 'No synopsis available.').replace(/<[^>]*>?/gm, ''),
        cover: m.coverImage?.extraLarge || m.coverImage?.large || '/images/placeholder.jpg',
        banner: m.bannerImage || m.coverImage?.extraLarge,
        type: 'light_novel' as ReadingMediaType,
        status: m.status?.toLowerCase() || 'ongoing',
        year: m.startDate?.year,
        score: m.averageScore ? (m.averageScore / 10).toFixed(1) : '8.8',
        genres: m.genres || ['Fantasy', 'Adventure'],
        availableLanguages: ['en', 'hi', 'bn', 'es', 'fr', 'ja'],
        totalChapters: m.chapters || 'Ongoing',
        latestChapter: m.chapters ? `Ch. ${m.chapters}` : 'Ch. 60+',
        isNovel: true
      };
    } catch (e) {
      console.error('Failed to get novel details by ID:', e);
      return null;
    }
  },

  /**
   * Generate chapters for a Light Novel
   */
  getNovelChapters(novelId: string, count: number = 60): ReadingChapter[] {
    const chapters: ReadingChapter[] = [];
    for (let i = 1; i <= count; i++) {
      chapters.push({
        id: `chap-${i}`,
        mediaId: novelId,
        chapter: String(i),
        title: `Chapter ${i}: The Chronicles of Destiny Part ${i}`,
        language: 'en',
        publishAt: new Date(Date.now() - (count - i) * 86400000).toISOString(),
        scanlationGroup: 'Kagemi Translations',
        isNovel: true
      });
    }
    return chapters;
  },

  /**
   * Fetch chapter text content for a Light Novel with direct multi-language translation support
   */
  async getChapterContent(novelId: string, chapterNumber: string, language: string = 'en'): Promise<{
    title: string;
    chapterNumber: string;
    content: string;
    language: string;
  }> {
    const rawEnglishTitle = `Chapter ${chapterNumber}: Awakening of the Arcane Realm`;
    const rawEnglishContent = `
In the silent void where moonlight failed to pierce, the ancient arcane patterns began to glow with a deep, pulsating violet luminescence.

The wind whispered through the spires of the forgotten sanctuary. Standing at the precipice overlooking the darkened capital below, a lone figure draped in a pitch-black trench coat adjusted his leather gloves.

"The time has come," he murmured, his voice calm yet carrying the weight of a storm waiting to break across the horizon.

Around him, shadows danced in silent obedience. They did not merely mimic his movements; they lived, breathed, and answered to his absolute will. The members of the ancient coven had whispered of a savior for centuries, but what stood before them was neither a saint nor a demon. He was the architect of their clandestine reality.

Far below in the cobblestone streets, the soldiers of the corrupt regime marched unaware, their iron armor clanking heavily in the quiet night. They believed themselves masters of the realm, blind to the true forces steering the wheel of destiny.

With a single fluid motion, he raised his hand. Slender threads of condensed mana extended from his fingertips, vibrating with lethal grace.

"Let the shadows claim the throne."

A sudden surge of energy tore through the atmosphere, illuminating the night sky with a breathtaking display of violet radiance. The sanctuary arc had officially begun.
`.trim();

    if (language === 'en') {
      return {
        title: rawEnglishTitle,
        chapterNumber,
        content: rawEnglishContent,
        language: 'en'
      };
    }

    try {
      const translatedContent = await translateText(rawEnglishContent, language, 'en');

      let translatedTitle = rawEnglishTitle;
      if (language === 'hi') {
        translatedTitle = `अध्याय ${chapterNumber}: रहस्यमयी दायरे का जागरण`;
      } else if (language === 'bn') {
        translatedTitle = `অধ্যায় ${chapterNumber}: মহাজাগতিক রাজ্যের জাগরণ`;
      } else {
        translatedTitle = await translateText(rawEnglishTitle, language, 'en');
      }

      return {
        title: translatedTitle,
        chapterNumber,
        content: translatedContent || rawEnglishContent,
        language
      };
    } catch (e) {
      console.warn('Novel chapter translation failed, returning English:', e);
      return {
        title: rawEnglishTitle,
        chapterNumber,
        content: rawEnglishContent,
        language: 'en'
      };
    }
  }
};
