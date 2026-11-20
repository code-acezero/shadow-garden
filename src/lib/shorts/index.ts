/**
 * Shadow Garden - Multi-Source Shorts Aggregator
 * Unified Short Drama Engine across HepDrama, Narto Drama, DramaDünyam,
 * MacCMS (Baofeng & Feifan), and Curated English & Hindi Dubbed Micro-Series.
 */

import { ShortDramaItem, ShortDramaDetail, ShortsCategoryTab } from './types';
import { 
  getUnifiedShortDramaFeed, 
  getUnifiedShortDramaDetail, 
  searchUnifiedShortDramas 
} from './unified';

export * from './types';
export * from './maccms';
export * from './curated';
export * from './sources/hepdrama';
export * from './sources/narto';
export * from './sources/dramadunyam';
export * from './unified';

/**
 * Returns categorized feed of vertical short dramas with all titles in English
 */
export async function getShortDramaFeed(
  tab: ShortsCategoryTab = 'trending',
  page: number = 1
): Promise<{ items: ShortDramaItem[]; hasMore: boolean; page: number; total?: number }> {
  return getUnifiedShortDramaFeed(tab, page);
}

/**
 * Resolves full drama detail and all unlocked episode streams across all integrated sources
 */
export async function getShortDramaById(id: string): Promise<ShortDramaDetail | null> {
  return getUnifiedShortDramaDetail(id);
}

/**
 * Unified Search across all integrated sources
 */
export async function searchAllShorts(query: string, page: number = 1): Promise<ShortDramaItem[]> {
  return searchUnifiedShortDramas(query, page);
}
