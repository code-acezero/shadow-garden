/**
 * Shadow Garden - Multi-Source Shorts Aggregator
 * Unifies MacCMS (67,000+ unlocked titles), English Dubs, and Hindi Dubbed micro-dramas
 */

import { ShortDramaItem, ShortDramaDetail, ShortsCategoryTab } from './types';
import { getMacCMSShorts, getMacCMSDetail, searchMacCMS } from './maccms';
import { CURATED_HINDI_DRAMAS, CURATED_ENGLISH_DRAMAS } from './curated';

export * from './types';
export * from './maccms';
export * from './curated';

/**
 * Returns categorized feed of vertical short dramas
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
      const allEng: ShortDramaItem[] = CURATED_ENGLISH_DRAMAS.map(d => ({
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
        items: allEng,
        hasMore: false,
        page: 1,
        total: allEng.length
      };
    }

    if (tab === 'western_ceo') {
      const ceoItems: ShortDramaItem[] = [
        ...CURATED_ENGLISH_DRAMAS,
        ...CURATED_HINDI_DRAMAS
      ]
        .filter(d => d.tags.some(t => t.toLowerCase().includes('ceo') || t.toLowerCase().includes('billionaire') || t.toLowerCase().includes('werewolf')))
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
        items: ceoItems,
        hasMore: false,
        page: 1,
        total: ceoItems.length
      };
    }

    if (tab === 'unlocked_67k') {
      // 100% Unlocked MacCMS VOD provider
      const maccmsRes = await getMacCMSShorts(page, 'maccms_ffzy');
      return {
        items: maccmsRes.items,
        hasMore: page < maccmsRes.pageCount,
        page,
        total: maccmsRes.total
      };
    }

    // Default: 'trending' - blends top curated hits on page 1 with live unlocked MacCMS feed
    const maccmsRes = await getMacCMSShorts(page, 'maccms_ffzy');
    let blended: ShortDramaItem[] = [];

    if (page === 1) {
      const curatedPicks: ShortDramaItem[] = [
        ...CURATED_HINDI_DRAMAS.slice(0, 3),
        ...CURATED_ENGLISH_DRAMAS.slice(0, 3)
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

      blended = [...curatedPicks, ...maccmsRes.items];
    } else {
      blended = maccmsRes.items;
    }

    return {
      items: blended,
      hasMore: page < maccmsRes.pageCount,
      page,
      total: maccmsRes.total + CURATED_HINDI_DRAMAS.length + CURATED_ENGLISH_DRAMAS.length
    };
  } catch (err: any) {
    console.error('[ShortDramaFeed Error]:', err.message);
    return { items: [], hasMore: false, page };
  }
}

/**
 * Resolves full drama detail and all unlocked episode streams
 */
export async function getShortDramaById(id: string): Promise<ShortDramaDetail | null> {
  // Check curated collections first
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

  // Otherwise, query MacCMS provider
  const maccmsDetail = await getMacCMSDetail(id);
  if (maccmsDetail) {
    // Attach curated hits as recommendations
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

  // Match MacCMS
  const maccmsMatches = await searchMacCMS(query, page);

  // Combine and deduplicate
  const seen = new Set<string>();
  const combined: ShortDramaItem[] = [];

  for (const item of [...matchedCurated, ...maccmsMatches]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      combined.push(item);
    }
  }

  return combined;
}
