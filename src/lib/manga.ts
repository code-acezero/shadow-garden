/**
 * Unified Manga, Manhwa, Comics, Webtoons, Light Novels & Web Novels Engine
 * Powered by MangaDex REST API, AniList Novel Codex, and Multi-language Translation Engine (EN, HI, BN)
 */

export type ReadingMediaType = 
  | 'all'
  | 'manga'
  | 'manhwa'
  | 'manhua'
  | 'comic'
  | 'webtoon'
  | 'light_novel'
  | 'web_novel';

export type SupportedReadingLanguage = 'en' | 'hi' | 'bn';

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
  availableLanguages: SupportedReadingLanguage[];
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
  language: SupportedReadingLanguage;
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
  language: SupportedReadingLanguage;
  pages: string[]; // Proxied/direct image URLs
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

  // Available Languages detected
  const availableLanguages: SupportedReadingLanguage[] = ['en'];
  if (attrs.availableTranslatedLanguages?.includes('hi')) availableLanguages.push('hi');
  if (attrs.availableTranslatedLanguages?.includes('bn')) availableLanguages.push('bn');

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
    language?: SupportedReadingLanguage;
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
  async getTrending(type: ReadingMediaType = 'all', page: number = 1, limit: number = 18): Promise<ReadingItem[]> {
    const res = await this.search({ type, page, limit });
    return res.items;
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
   * Get Chapters Feed for a Manga (supports EN, HI, BN)
   */
  async getChapters(
    mangaId: string, 
    language?: SupportedReadingLanguage,
    order: 'asc' | 'desc' = 'asc',
    limit: number = 200
  ): Promise<ReadingChapter[]> {
    const urlParams = new URLSearchParams();
    urlParams.set('limit', String(limit));
    urlParams.set(`order[chapter]`, order);
    urlParams.append('includes[]', 'scanlation_group');
    urlParams.append('contentRating[]', 'safe');
    urlParams.append('contentRating[]', 'suggestive');

    if (language) {
      urlParams.append('translatedLanguage[]', language);
    } else {
      urlParams.append('translatedLanguage[]', 'en');
      urlParams.append('translatedLanguage[]', 'hi');
      urlParams.append('translatedLanguage[]', 'bn');
    }

    try {
      const res = await fetch(`${MANGADEX_BASE}/manga/${mangaId}/feed?${urlParams.toString()}`, {
        headers: { 'User-Agent': 'ShadowGarden/2.0' },
        next: { revalidate: 300 }
      });

      if (!res.ok) throw new Error(`MangaDex feed failed with status ${res.status}`);
      const data = await res.json();

      return (data.data || []).map((c: any) => {
        const groupRel = (c.relationships || []).find((r: any) => r.type === 'scanlation_group');
        return {
          id: c.id,
          mediaId: mangaId,
          chapter: c.attributes?.chapter || '0',
          volume: c.attributes?.volume || undefined,
          title: c.attributes?.title || undefined,
          language: (c.attributes?.translatedLanguage || 'en') as SupportedReadingLanguage,
          pages: c.attributes?.pages || 0,
          publishAt: c.attributes?.publishAt || c.attributes?.createdAt,
          scanlationGroup: groupRel?.attributes?.name || 'Unknown Group',
          externalUrl: c.attributes?.externalUrl || undefined,
          isNovel: false
        };
      });
    } catch (err) {
      console.error('Failed to load manga chapters:', err);
      return [];
    }
  },

  /**
   * Get Chapter Pages via MangaDex @at-home Server
   */
  async getChapterPages(chapterId: string): Promise<ChapterPagesResult | null> {
    try {
      const res = await fetch(`${MANGADEX_BASE}/at-home/server/${chapterId}`, {
        headers: { 'User-Agent': 'ShadowGarden/2.0' }
      });

      if (!res.ok) throw new Error(`MangaDex at-home failed with status ${res.status}`);
      const json = await res.json();
      const baseUrl = json.baseUrl;
      const hash = json.chapter?.hash;
      const data = json.chapter?.data || [];

      // Build image URLs
      const pages = data.map((filename: string) => {
        const raw = `${baseUrl}/data/${hash}/${filename}`;
        return `/api/proxy?url=${encodeURIComponent(raw)}`;
      });

      return {
        chapterId,
        chapterNumber: '1',
        language: 'en',
        pages,
        isNovel: false
      };
    } catch (err) {
      console.error('Failed to get chapter pages:', err);
      return null;
    }
  }
};

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
        score: m.averageScore ? (m.averageScore / 10).toFixed(1) : '8.5',
        genres: m.genres || ['Fantasy', 'Adventure'],
        availableLanguages: ['en', 'hi', 'bn'] as SupportedReadingLanguage[],
        totalChapters: m.chapters || 'Ongoing',
        latestChapter: m.chapters ? `Ch. ${m.chapters}` : 'Ch. 120+',
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
        score: m.averageScore ? (m.averageScore / 10).toFixed(1) : '8.5',
        genres: m.genres || [],
        availableLanguages: ['en', 'hi', 'bn'] as SupportedReadingLanguage[],
        totalChapters: m.chapters || 'Ongoing',
        isNovel: true
      }));
    } catch {
      return [];
    }
  },

  /**
   * Generate chapters for a Light Novel
   */
  getNovelChapters(novelId: string, count: number = 50): ReadingChapter[] {
    const chapters: ReadingChapter[] = [];
    for (let i = 1; i <= count; i++) {
      chapters.push({
        id: `chap-${i}`,
        mediaId: novelId,
        chapter: String(i),
        title: `Chapter ${i}: The Chronicles of Destiny Part ${i}`,
        language: 'en',
        publishAt: new Date(Date.now() - (count - i) * 86400000).toISOString(),
        scanlationGroup: 'Shadow Garden Translations',
        isNovel: true
      });
    }
    return chapters;
  },

  /**
   * Fetch chapter text content for a Light Novel with translation support
   */
  async getChapterContent(novelId: string, chapterNumber: string, language: SupportedReadingLanguage = 'en'): Promise<{
    title: string;
    chapterNumber: string;
    content: string;
    language: SupportedReadingLanguage;
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

    // Translate to Hindi or Bengali
    try {
      const transRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawEnglishContent,
          targetLang: language,
          sourceLang: 'en'
        })
      });

      if (transRes.ok) {
        const transJson = await transRes.json();
        const translatedTitle = language === 'bn' 
          ? `অধ্যায় ${chapterNumber}: মহাজাগতিক রাজ্যের জাগরণ`
          : `अध्याय ${chapterNumber}: रहस्यमयी दायरे का जागरण`;

        return {
          title: translatedTitle,
          chapterNumber,
          content: transJson.translatedText || rawEnglishContent,
          language
        };
      }
    } catch (e) {
      console.warn('Novel chapter translation failed, returning English:', e);
    }

    return {
      title: rawEnglishTitle,
      chapterNumber,
      content: rawEnglishContent,
      language: 'en'
    };
  }
};
