/**
 * DramaDünyam Source Provider (https://dramadunyam.com)
 * Resilient multi-studio aggregator with international dubbed and subbed short dramas.
 * Operates gracefully with fallback and caching.
 */

import { ShortDramaItem, ShortDramaDetail } from '../types';

const BASE_URL = 'https://dramadunyam.com';

const feedCache = new Map<string, { timestamp: number; data: { items: ShortDramaItem[]; total: number; hasMore: boolean } }>();
const FEED_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch public drama feed from DramaDünyam
 */
export async function getDramaDunyamFeed(
  page: number = 1
): Promise<{ items: ShortDramaItem[]; total: number; hasMore: boolean }> {
  const cacheKey = `dd_feed_${page}`;
  const cached = feedCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < FEED_CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/akis`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) {
      console.warn(`[DramaDünyam] /api/akis returned ${res.status}`);
      return { items: [], total: 0, hasMore: false };
    }

    const data = await res.json();
    const rawItems: any[] = data.items || [];

    const items: ShortDramaItem[] = rawItems.map((item: any) => {
      const slug = item.slug || item.id;
      const title = item.title || slug.replace(/-/g, ' ');
      const platform = item.platform || 'DramaDünyam';

      return {
        id: `dd_${slug}`,
        source: 'dramadunyam' as const,
        sourceName: platform,
        title,
        cover: item.cover || '',
        poster: item.cover || '',
        banner: item.cover || '',
        description: `Watch ${title} on ${platform}. Full series with ${item.available_episodes || 40} vertical episodes.`,
        totalEpisodes: item.available_episodes || 40,
        language: item.dublaj ? 'English Dub' : 'English Sub',
        tags: [platform, 'DramaDünyam', 'Mini-Series'],
        status: 'Completed',
        isUnlocked: true
      };
    });

    const result = {
      items,
      total: items.length,
      hasMore: false
    };

    feedCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (err: any) {
    console.warn('[DramaDünyam Feed Error]:', err.message);
    return { items: [], total: 0, hasMore: false };
  }
}

/**
 * Search DramaDünyam cached items
 */
export async function searchDramaDunyam(query: string): Promise<ShortDramaItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const { items } = await getDramaDunyamFeed(1);
  return items.filter(d => 
    d.title.toLowerCase().includes(q) ||
    d.tags.some(t => t.toLowerCase().includes(q))
  );
}
