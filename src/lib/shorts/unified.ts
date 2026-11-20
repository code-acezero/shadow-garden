/**
 * Shadow Garden - Unified Short Drama Engine
 * Multi-Source Aggregator & Deduplication Engine
 * Combines HepDrama, Narto Drama, DramaDünyam, MacCMS, and Curated Collections.
 */

import { 
  ShortDramaItem, 
  ShortDramaDetail, 
  ShortsCategoryTab, 
  ShortDramaSourceReference 
} from './types';
import { 
  getHepDramaFeed, 
  getHepDramaDetail, 
  searchHepDrama, 
  HEPDRAMA_CATEGORIES 
} from './sources/hepdrama';
import { 
  getNartoDramaFeed, 
  getNartoDramaDetail, 
  searchNartoDrama 
} from './sources/narto';
import { 
  getDramaDunyamFeed, 
  searchDramaDunyam 
} from './sources/dramadunyam';
import { 
  getMacCMSShorts, 
  getMacCMSDetail, 
  searchMacCMS 
} from './maccms';
import { 
  CURATED_HINDI_DRAMAS, 
  CURATED_ENGLISH_DRAMAS 
} from './curated';

// In-memory cross-source alias map for instant resolution of alternate IDs
const ALIAS_MAP = new Map<string, string>();

/**
 * Normalizes title for cross-provider deduplication
 */
export function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’"“”]/g, '')
    .replace(/[-_.:,!?;/\\|()[\]{}]/g, ' ')
    .replace(/\b(hindi|english|dub|sub|episode|ep|full|series|season|s\d+|unlocked|hd|4k)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Merges two short drama items representing the same drama across different sources
 */
export function mergeDramaItems(primary: ShortDramaItem, secondary: ShortDramaItem): ShortDramaItem {
  const mergedSources: ShortDramaSourceReference[] = [
    ...(primary.sources || [
      {
        source: primary.source,
        sourceName: primary.sourceName || primary.source,
        id: primary.id,
        title: primary.title,
        totalEpisodes: primary.totalEpisodes,
        streamUrl: primary.firstEpisodeStream
      }
    ]),
    ...(secondary.sources || [
      {
        source: secondary.source,
        sourceName: secondary.sourceName || secondary.source,
        id: secondary.id,
        title: secondary.title,
        totalEpisodes: secondary.totalEpisodes,
        streamUrl: secondary.firstEpisodeStream
      }
    ])
  ];

  // Deduplicate sources by ID
  const uniqueSources: ShortDramaSourceReference[] = [];
  const seenSrc = new Set<string>();
  for (const s of mergedSources) {
    if (!seenSrc.has(s.id)) {
      seenSrc.add(s.id);
      uniqueSources.push(s);
    }
  }

  // Register alias
  ALIAS_MAP.set(secondary.id, primary.id);

  // Combine unique tags
  const allTags = Array.from(new Set([...primary.tags, ...secondary.tags]));

  // Pick the highest episode count and longest description
  const totalEpisodes = Math.max(primary.totalEpisodes || 0, secondary.totalEpisodes || 0);
  const description = (primary.description && primary.description.length >= (secondary.description?.length || 0))
    ? primary.description
    : (secondary.description || primary.description);

  return {
    ...primary,
    description,
    totalEpisodes: totalEpisodes > 0 ? totalEpisodes : 40,
    tags: allTags,
    sources: uniqueSources,
    isUnlocked: true,
    firstEpisodeStream: primary.firstEpisodeStream || secondary.firstEpisodeStream
  };
}

/**
 * Deduplicate an array of items by canonical title
 */
export function deduplicateShorts(items: ShortDramaItem[]): ShortDramaItem[] {
  const map = new Map<string, ShortDramaItem>();

  for (const item of items) {
    const key = normalizeTitle(item.title);
    if (!key) {
      map.set(item.id, item);
      continue;
    }

    if (map.has(key)) {
      const existing = map.get(key)!;
      map.set(key, mergeDramaItems(existing, item));
    } else {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

/**
 * Unified Short Drama Feed
 * Harmonizes HepDrama, Narto Drama, DramaDünyam, MacCMS, and Curated content.
 */
export async function getUnifiedShortDramaFeed(
  tab: ShortsCategoryTab = 'trending',
  page: number = 1
): Promise<{ items: ShortDramaItem[]; hasMore: boolean; page: number; total?: number }> {
  try {
    // 1. Hindi Dubbed Collection
    if (tab === 'hindi') {
      const hindiItems: ShortDramaItem[] = CURATED_HINDI_DRAMAS.map(d => ({
        id: d.id,
        source: d.source,
        sourceName: 'Curated Hindi',
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
        items: hindiItems,
        hasMore: false,
        page: 1,
        total: hindiItems.length
      };
    }

    // 2. English Dubbed / Native English Collection
    if (tab === 'english') {
      const [hepRes, nartoRes] = await Promise.allSettled([
        getHepDramaFeed('billionaire-ceo', page),
        getNartoDramaFeed('hot', page)
      ]);

      const hepItems = hepRes.status === 'fulfilled' ? hepRes.value.items : [];
      const nartoItems = nartoRes.status === 'fulfilled' ? nartoRes.value.items : [];

      const curatedEng: ShortDramaItem[] = (page === 1 ? CURATED_ENGLISH_DRAMAS : []).map(d => ({
        id: d.id,
        source: d.source,
        sourceName: 'Curated English',
        title: d.title,
        cover: d.cover,
        banner: d.banner,
        description: d.description,
        totalEpisodes: d.totalEpisodes,
        language: d.language,
        tags: d.tags,
        status: d.status,
        isUnlocked: d.isUnlocked,
        firstEpisodeStream: d.episodes[0]?.streamUrl
      }));

      const raw = [...curatedEng, ...hepItems, ...nartoItems];
      const deduped = deduplicateShorts(raw);

      return {
        items: deduped,
        hasMore: page < 5,
        page,
        total: deduped.length
      };
    }

    // 3. Western CEO / Billionaire Romance
    if (tab === 'western_ceo') {
      const [hepCeo, nartoRomance, ddRes] = await Promise.allSettled([
        getHepDramaFeed('billionaire-ceo', page),
        getNartoDramaFeed('romance', page),
        getDramaDunyamFeed(page)
      ]);

      const hepItems = hepCeo.status === 'fulfilled' ? hepCeo.value.items : [];
      const nartoItems = nartoRomance.status === 'fulfilled' ? nartoRomance.value.items : [];
      const ddItems = ddRes.status === 'fulfilled' ? ddRes.value.items : [];

      const curatedCeo = (page === 1 ? [...CURATED_ENGLISH_DRAMAS, ...CURATED_HINDI_DRAMAS] : [])
        .filter(d => d.tags.some(t => {
          const l = t.toLowerCase();
          return l.includes('ceo') || l.includes('billionaire') || l.includes('werewolf') || l.includes('revenge');
        }))
        .map(d => ({
          id: d.id,
          source: d.source,
          sourceName: 'Curated Hit',
          title: d.title,
          cover: d.cover,
          description: d.description,
          totalEpisodes: d.totalEpisodes,
          language: d.language,
          tags: d.tags,
          status: d.status,
          isUnlocked: d.isUnlocked,
          firstEpisodeStream: d.episodes[0]?.streamUrl
        }));

      const combined = deduplicateShorts([
        ...curatedCeo,
        ...hepItems,
        ...nartoItems,
        ...ddItems.slice(0, 10)
      ]);

      return {
        items: combined,
        hasMore: page < 5,
        page,
        total: combined.length
      };
    }

    // 4. Unlocked 67k Catalog (Feifan + Baofeng + Full Narto)
    if (tab === 'unlocked_67k') {
      const provider = page % 2 === 0 ? 'maccms_bfzy' : 'maccms_ffzy';
      const [maccmsRes, nartoRes] = await Promise.allSettled([
        getMacCMSShorts(page, provider),
        getNartoDramaFeed('original', page)
      ]);

      const maccmsItems = maccmsRes.status === 'fulfilled' ? maccmsRes.value.items : [];
      const nartoItems = nartoRes.status === 'fulfilled' ? nartoRes.value.items : [];

      const combined = deduplicateShorts([...nartoItems, ...maccmsItems]);

      return {
        items: combined,
        hasMore: page < 10,
        page,
        total: combined.length
      };
    }

    // 5. Default: 'trending'
    // Harmonized blend: Top HepDrama + Narto Studios + DramaDünyam + Curated Blockbusters + MacCMS
    const [hepRes, nartoRes, ddRes, maccmsRes] = await Promise.allSettled([
      getHepDramaFeed(page % 2 === 1 ? 'billionaire-ceo' : 'revenge', page),
      getNartoDramaFeed('hot', page),
      getDramaDunyamFeed(page),
      getMacCMSShorts(page, 'maccms_ffzy')
    ]);

    const hepItems = hepRes.status === 'fulfilled' ? hepRes.value.items : [];
    const nartoItems = nartoRes.status === 'fulfilled' ? nartoRes.value.items : [];
    const ddItems = ddRes.status === 'fulfilled' ? ddRes.value.items : [];
    const maccmsItems = maccmsRes.status === 'fulfilled' ? maccmsRes.value.items : [];

    const curatedPicks: ShortDramaItem[] = (page === 1 ? [
      ...CURATED_ENGLISH_DRAMAS.slice(0, 3),
      ...CURATED_HINDI_DRAMAS.slice(0, 3)
    ] : []).map(d => ({
      id: d.id,
      source: d.source,
      sourceName: 'Curated Blockbuster',
      title: d.title,
      cover: d.cover,
      banner: d.banner,
      description: d.description,
      totalEpisodes: d.totalEpisodes,
      language: d.language,
      tags: d.tags,
      status: d.status,
      isUnlocked: d.isUnlocked,
      firstEpisodeStream: d.episodes[0]?.streamUrl
    }));

    // Interleave sources so the feed features top content from all three platforms
    const blended: ShortDramaItem[] = [];
    if (page === 1) {
      blended.push(...curatedPicks);
    }

    // Add HepDrama & Narto Drama items interleaved
    const maxLen = Math.max(hepItems.length, nartoItems.length);
    for (let i = 0; i < maxLen; i++) {
      if (hepItems[i]) blended.push(hepItems[i]);
      if (nartoItems[i]) blended.push(nartoItems[i]);
    }

    // Append DramaDünyam and MacCMS items
    blended.push(...ddItems.slice(0, 12));
    blended.push(...maccmsItems.slice(0, 15));

    const deduped = deduplicateShorts(blended);

    return {
      items: deduped,
      hasMore: page < 10,
      page,
      total: deduped.length
    };
  } catch (err: any) {
    console.error('[Unified Shorts Feed Error]:', err.message);
    return { items: [], hasMore: false, page };
  }
}

/**
 * Unified Search across HepDrama, Narto Drama, DramaDünyam, MacCMS, and Curated
 */
export async function searchUnifiedShortDramas(query: string, page: number = 1): Promise<ShortDramaItem[]> {
  const q = query.trim();
  if (!q) return [];

  const [hepMatches, nartoMatches, ddMatches, maccmsMatches] = await Promise.allSettled([
    searchHepDrama(q),
    searchNartoDrama(q),
    searchDramaDunyam(q),
    searchMacCMS(q, page)
  ]);

  const hep = hepMatches.status === 'fulfilled' ? hepMatches.value : [];
  const narto = nartoMatches.status === 'fulfilled' ? nartoMatches.value : [];
  const dd = ddMatches.status === 'fulfilled' ? ddMatches.value : [];
  const maccms = maccmsMatches.status === 'fulfilled' ? maccmsMatches.value : [];

  // Match curated items locally
  const queryLower = q.toLowerCase();
  const curated = [...CURATED_ENGLISH_DRAMAS, ...CURATED_HINDI_DRAMAS]
    .filter(d => 
      d.title.toLowerCase().includes(queryLower) ||
      d.description.toLowerCase().includes(queryLower) ||
      d.tags.some(t => t.toLowerCase().includes(queryLower))
    )
    .map(d => ({
      id: d.id,
      source: d.source,
      sourceName: 'Curated',
      title: d.title,
      cover: d.cover,
      banner: d.banner,
      description: d.description,
      totalEpisodes: d.totalEpisodes,
      language: d.language,
      tags: d.tags,
      status: d.status,
      isUnlocked: d.isUnlocked,
      firstEpisodeStream: d.episodes[0]?.streamUrl
    }));

  const allResults = [...curated, ...hep, ...narto, ...dd, ...maccms];
  return deduplicateShorts(allResults);
}

/**
 * Resolves full drama details and all unlocked episode streams across all integrated sources
 */
export async function getUnifiedShortDramaDetail(id: string): Promise<ShortDramaDetail | null> {
  // Check if this ID is an alias to a canonical ID
  const targetId = ALIAS_MAP.get(id) || id;

  // 1. HepDrama (hep_ prefix)
  if (targetId.startsWith('hep_')) {
    const hepDetail = await getHepDramaDetail(targetId);
    if (hepDetail) {
      // Build recommendations from Narto and Curated
      const nartoFeed = await getNartoDramaFeed('hot', 1);
      hepDetail.recommendations = [
        ...nartoFeed.items.slice(0, 4),
        ...CURATED_ENGLISH_DRAMAS.slice(0, 2).map(d => ({
          id: d.id,
          source: d.source,
          sourceName: 'Curated',
          title: d.title,
          cover: d.cover,
          description: d.description,
          totalEpisodes: d.totalEpisodes,
          language: d.language,
          tags: d.tags,
          status: d.status,
          isUnlocked: true
        }))
      ];
      return hepDetail;
    }
  }

  // 2. Narto Drama (narto_ prefix)
  if (targetId.startsWith('narto_')) {
    const nartoDetail = await getNartoDramaDetail(targetId);
    if (nartoDetail) {
      const hepFeed = await getHepDramaFeed('billionaire-ceo', 1);
      nartoDetail.recommendations = [
        ...hepFeed.items.slice(0, 4),
        ...CURATED_ENGLISH_DRAMAS.slice(0, 2).map(d => ({
          id: d.id,
          source: d.source,
          sourceName: 'Curated',
          title: d.title,
          cover: d.cover,
          description: d.description,
          totalEpisodes: d.totalEpisodes,
          language: d.language,
          tags: d.tags,
          status: d.status,
          isUnlocked: true
        }))
      ];
      return nartoDetail;
    }
  }

  // 3. DramaDünyam (dd_ prefix)
  if (targetId.startsWith('dd_')) {
    const { items } = await getDramaDunyamFeed(1);
    const ddItem = items.find(i => i.id === targetId || i.id === id);
    if (ddItem) {
      // Attempt to cross-reference with Narto or HepDrama for playback
      const nartoMatches = await searchNartoDrama(ddItem.title);
      if (nartoMatches.length > 0) {
        const fullDetail = await getNartoDramaDetail(nartoMatches[0].id);
        if (fullDetail) {
          fullDetail.title = ddItem.title;
          fullDetail.sourceName = `DramaDünyam (${fullDetail.sourceName})`;
          return fullDetail;
        }
      }

      // Fallback detail
      return {
        ...ddItem,
        episodes: [
          {
            episodeNumber: 1,
            title: 'Episode 1',
            streamUrl: ddItem.firstEpisodeStream || '',
            type: 'hls',
            thumbnail: ddItem.cover
          }
        ],
        recommendations: items.filter(i => i.id !== targetId).slice(0, 6)
      };
    }
  }

  // 4. MacCMS dramas (ffzy_, bfzy_, ikun_, wujin_)
  if (targetId.startsWith('ffzy_') || targetId.startsWith('bfzy_') || targetId.startsWith('ikun_') || targetId.startsWith('wujin_')) {
    const maccmsDetail = await getMacCMSDetail(targetId);
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
  }

  // 5. Curated collections (English & Hindi)
  const curatedMatch = [...CURATED_HINDI_DRAMAS, ...CURATED_ENGLISH_DRAMAS].find(d => d.id === targetId || d.id === id);
  if (curatedMatch) {
    const recommendations = [...CURATED_ENGLISH_DRAMAS, ...CURATED_HINDI_DRAMAS]
      .filter(d => d.id !== curatedMatch.id)
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
        status: d.status,
        isUnlocked: d.isUnlocked,
        firstEpisodeStream: d.episodes[0]?.streamUrl
      }));

    return {
      ...curatedMatch,
      recommendations
    };
  }

  return null;
}
