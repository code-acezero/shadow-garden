/**
 * Shadow Garden - Multi-Source Shorts Aggregator
 * Unifies Vertical Drama (Western English), Baofeng & Feifan MacCMS (35,000+ unlocked titles),
 * and Curated English & Hindi Dubbed Micro-Series.
 */

import { ShortDramaItem, ShortDramaDetail, ShortsCategoryTab } from './types';
import { getMacCMSShorts, getMacCMSDetail, searchMacCMS } from './maccms';
import { CURATED_HINDI_DRAMAS, CURATED_ENGLISH_DRAMAS } from './curated';
import { getVerticalDramas, getVerticalDramaDetail } from './sources/vertical';

export * from './types';
export * from './maccms';
export * from './curated';
export * from './sources/vertical';

/**
 * Returns categorized feed of vertical short dramas with all titles in English
 */
export async function getShortDramaFeed(
  tab: ShortsCategoryTab = 'trending',
  page: number = 1
): Promise<{ items: ShortDramaItem[]; hasMore: boolean; page: number; total?: number }> {
  try {
    if (tab === 'hindi') {
      // Return Hindi Dubbed collection
      const allHindi: ShortDramaItem[] = CURATED_HINDI_DRAMAS.map(d => ({
        id: d.id,
        source: d.source,
        title: d.title,
        originalTitle: d.originalTitle,
        cover: d.cover,
        banner: d.banner,
        description: d.description,
        totalEpisodes: d.totalEpisodes,
        language: d.language,
        tags: d.tags,
        views: d.views,
        rating: d.rating,
        releaseYear: d.releaseYear,
        status: d.status,
        isUnlocked: d.isUnlocked,
        firstEpisodeStream: d.episodes[0]?.streamUrl
      }));

      return {
        items: allHindi,
        hasMore: false,
        page: 1,
        total: allHindi.length
      };
    }

    if (tab === 'english') {
      const curatedEng: ShortDramaItem[] = CURATED_ENGLISH_DRAMAS.map(d => ({
        id: d.id,
        source: d.source,
        title: d.title,
        originalTitle: d.originalTitle,
        cover: d.cover,
        banner: d.banner,
        description: d.description,
        totalEpisodes: d.totalEpisodes,
        language: d.language,
        tags: d.tags,
        views: d.views,
        rating: d.rating,
        releaseYear: d.releaseYear,
        status: d.status,
        isUnlocked: d.isUnlocked,
        firstEpisodeStream: d.episodes[0]?.streamUrl
      }));

      const verticalRes = await getVerticalDramas(page);
      const combined = page === 1 ? [...curatedEng, ...verticalRes.items] : verticalRes.items;

      return {
        items: combined,
        hasMore: page < 5,
        page,
        total: curatedEng.length + verticalRes.total
      };
    }

    if (tab === 'western_ceo') {
      const curatedCeo: ShortDramaItem[] = [
        ...CURATED_ENGLISH_DRAMAS,
        ...CURATED_HINDI_DRAMAS
      ]
        .filter(d => d.tags.some(t => {
          const l = t.toLowerCase();
          return l.includes('ceo') || l.includes('billionaire') || l.includes('werewolf') || l.includes('revenge');
        }))
        .map(d => ({
          id: d.id,
          source: d.source,
          title: d.title,
          originalTitle: d.originalTitle,
          cover: d.cover,
          banner: d.banner,
          description: d.description,
          totalEpisodes: d.totalEpisodes,
          language: d.language,
          tags: d.tags,
          views: d.views,
          rating: d.rating,
          releaseYear: d.releaseYear,
          status: d.status,
          isUnlocked: d.isUnlocked,
          firstEpisodeStream: d.episodes[0]?.streamUrl
        }));

      const verticalRes = await getVerticalDramas(page);
      const ceoVertical = verticalRes.items.filter(d => 
        d.tags.some(t => {
          const l = t.toLowerCase();
          return l.includes('ceo') || l.includes('billionaire') || l.includes('romance') || l.includes('secret');
        })
      );

      const items = page === 1 ? [...curatedCeo, ...ceoVertical] : ceoVertical;

      return {
        items,
        hasMore: page < 5,
        page,
        total: items.length
      };
    }

    if (tab === 'unlocked_67k') {
      // 100% Unlocked MacCMS VOD providers (Feifan & Baofeng with auto English translation)
      const provider = page % 2 === 0 ? 'maccms_bfzy' : 'maccms_ffzy';
      const maccmsRes = await getMacCMSShorts(page, provider);
      return {
        items: maccmsRes.items,
        hasMore: page < maccmsRes.pageCount,
        page,
        total: maccmsRes.total
      };
    }

    // Default: 'trending' - blends top curated blockbusters, Vertical Drama English hits, and live MacCMS feed
    const [maccmsRes, verticalRes] = await Promise.all([
      getMacCMSShorts(page, 'maccms_ffzy'),
      getVerticalDramas(page)
    ]);

    let blended: ShortDramaItem[] = [];

    if (page === 1) {
      const curatedPicks: ShortDramaItem[] = [
        ...CURATED_ENGLISH_DRAMAS.slice(0, 3),
        ...CURATED_HINDI_DRAMAS.slice(0, 3)
      ].map(d => ({
        id: d.id,
        source: d.source,
        title: d.title,
        originalTitle: d.originalTitle,
        cover: d.cover,
        banner: d.banner,
        description: d.description,
        totalEpisodes: d.totalEpisodes,
        language: d.language,
        tags: d.tags,
        views: d.views,
        rating: d.rating,
        releaseYear: d.releaseYear,
        status: d.status,
        isUnlocked: d.isUnlocked,
        firstEpisodeStream: d.episodes[0]?.streamUrl
      }));

      blended = [...curatedPicks, ...verticalRes.items.slice(0, 4), ...maccmsRes.items];
    } else {
      blended = [...verticalRes.items.slice(0, 4), ...maccmsRes.items];
    }

    return {
      items: blended,
      hasMore: page < maccmsRes.pageCount,
      page,
      total: maccmsRes.total + CURATED_HINDI_DRAMAS.length + CURATED_ENGLISH_DRAMAS.length + verticalRes.total
    };
  } catch (err: any) {
    console.error('[ShortDramaFeed Error]:', err.message);
    return { items: [], hasMore: false, page };
  }
}

/**
 * Resolves full drama detail and all unlocked episode streams across all integrated sources
 */
export async function getShortDramaById(id: string): Promise<ShortDramaDetail | null> {
  // 1. Check curated collections first
  const curatedMatch = [...CURATED_HINDI_DRAMAS, ...CURATED_ENGLISH_DRAMAS].find(d => d.id === id);
  if (curatedMatch) {
    const recommendations = [...CURATED_ENGLISH_DRAMAS, ...CURATED_HINDI_DRAMAS]
      .filter(d => d.id !== id)
      .slice(0, 6)
      .map(d => ({
        id: d.id,
        source: d.source,
        title: d.title,
        originalTitle: d.originalTitle,
        cover: d.cover,
        banner: d.banner,
        description: d.description,
        totalEpisodes: d.totalEpisodes,
        language: d.language,
        tags: d.tags,
        views: d.views,
        rating: d.rating,
        releaseYear: d.releaseYear,
        status: d.status,
        isUnlocked: d.isUnlocked,
        firstEpisodeStream: d.episodes[0]?.streamUrl
      }));

    return {
      ...curatedMatch,
      recommendations
    };
  }

  // 2. Check Vertical Drama Network (vd_ prefix)
  if (id.startsWith('vd_')) {
    const vdDetail = await getVerticalDramaDetail(id);
    if (vdDetail) {
      vdDetail.recommendations = [...CURATED_ENGLISH_DRAMAS.slice(0, 4)].map(d => ({
        id: d.id,
        source: d.source,
        title: d.title,
        cover: d.cover,
        description: d.description,
        totalEpisodes: d.totalEpisodes,
        language: d.language,
        tags: d.tags,
        status: d.status,
        isUnlocked: true
      }));
      return vdDetail;
    }
  }

  // 3. Query MacCMS provider (ffzy_, bfzy_, ikun_, wujin_)
  const maccmsDetail = await getMacCMSDetail(id);
  if (maccmsDetail) {
    maccmsDetail.recommendations = [
      ...CURATED_HINDI_DRAMAS.slice(0, 3),
      ...CURATED_ENGLISH_DRAMAS.slice(0, 3)
    ].map(d => ({
      id: d.id,
      source: d.source,
      title: d.title,
      cover: d.cover,
      description: d.description,
      totalEpisodes: d.totalEpisodes,
      language: d.language,
      tags: d.tags,
      status: d.status,
      isUnlocked: true
    }));
    return maccmsDetail;
  }

  return null;
}

/**
 * Unified Search across all integrated sources
 */
export async function searchAllShorts(query: string, page: number = 1): Promise<ShortDramaItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Match curated items
  const matchedCurated = [...CURATED_HINDI_DRAMAS, ...CURATED_ENGLISH_DRAMAS]
    .filter(d => 
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.tags.some(t => t.toLowerCase().includes(q)) ||
      (d.originalTitle && d.originalTitle.toLowerCase().includes(q))
    )
    .map(d => ({
      id: d.id,
      source: d.source,
      title: d.title,
      originalTitle: d.originalTitle,
      cover: d.cover,
      banner: d.banner,
      description: d.description,
      totalEpisodes: d.totalEpisodes,
      language: d.language,
      tags: d.tags,
      views: d.views,
      rating: d.rating,
      releaseYear: d.releaseYear,
      status: d.status,
      isUnlocked: d.isUnlocked,
      firstEpisodeStream: d.episodes[0]?.streamUrl
    }));

  // Match Vertical Drama
  const verticalRes = await getVerticalDramas(1);
  const matchedVertical = verticalRes.items.filter(d =>
    d.title.toLowerCase().includes(q) ||
    d.description.toLowerCase().includes(q) ||
    d.tags.some(t => t.toLowerCase().includes(q))
  );

  // Match MacCMS
  const maccmsMatches = await searchMacCMS(query, page);

  // Combine and deduplicate
  const seen = new Set<string>();
  const combined: ShortDramaItem[] = [];

  for (const item of [...matchedCurated, ...matchedVertical, ...maccmsMatches]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      combined.push(item);
    }
  }

  return combined;
}
