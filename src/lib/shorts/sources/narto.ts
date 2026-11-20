/**
 * Narto Drama Source Provider (https://narto-drama.com)
 * Mega-aggregator hosting 20+ short drama studios (AnyReel, DramaBox, DreameShort, FlexTV, GoodShort, MoboReels)
 * Direct HLS (.m3u8) streams for all episodes.
 */

import { ShortDramaItem, ShortDramaDetail, ShortDramaEpisode } from '../types';

const BASE_URL = 'https://narto-drama.com';

// Cache maps
const feedCache = new Map<string, { timestamp: number; data: { items: ShortDramaItem[]; total: number; hasMore: boolean } }>();
const detailCache = new Map<string, { timestamp: number; data: ShortDramaDetail }>();

const FEED_CACHE_TTL = 30 * 60 * 1000;   // 30 minutes
const DETAIL_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getFreshCookie(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function getHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Cookie': `nd_ck=${getFreshCookie()}`,
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': `${BASE_URL}/`
  };
}

/**
 * Ingest sections and studio collections from Narto Drama
 */
export async function getNartoDramaFeed(
  sectionKey?: string,
  page: number = 1
): Promise<{ items: ShortDramaItem[]; total: number; hasMore: boolean }> {
  const cacheKey = `narto_feed_${sectionKey || 'all'}_${page}`;
  const cached = feedCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < FEED_CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(`${BASE_URL}/home/providers/sections`, {
      headers: getHeaders(),
      next: { revalidate: 1800 }
    });

    if (!res.ok) {
      console.warn(`[Narto Drama] sections returned ${res.status}`);
      return { items: [], total: 0, hasMore: false };
    }

    const data = await res.json();
    const sections: any[] = data.sections || [];

    const items: ShortDramaItem[] = [];
    const seen = new Set<string>();

    for (const section of sections) {
      if (sectionKey && !section.tab_label.toLowerCase().includes(sectionKey.toLowerCase()) && section.tab_key !== sectionKey) {
        continue;
      }

      const secItems: any[] = section.items || [];
      for (const item of secItems) {
        const title = item.title?.trim();
        if (!title || seen.has(title.toLowerCase())) continue;
        seen.add(title.toLowerCase());

        // Extract slug from watch_url
        let slug = '';
        if (item.watch_url) {
          const match = item.watch_url.match(/detail\/watch\/([^\/?&]+)/) ||
                        item.watch_url.match(/title=([^&]+)/);
          if (match) {
            slug = decodeURIComponent(match[1]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          }
        }
        if (!slug && item.book_id) {
          slug = `${item.book_id}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        }

        let poster = item.poster_url || '';
        if (poster && !poster.startsWith('http')) {
          poster = `${BASE_URL}${poster}`;
        }

        const studio = item.category_name || 'Narto Drama';
        const tags = [studio, 'Narto Drama'];
        if (Array.isArray(item.tag_names)) {
          item.tag_names.forEach((t: string) => tags.push(t));
        }

        items.push({
          id: `narto_${slug}`,
          source: 'narto',
          sourceName: studio,
          title,
          cover: poster,
          poster,
          banner: poster,
          description: item.description || `Stream ${title} produced by ${studio}. Full vertical episodes unlocked.`,
          totalEpisodes: 60, // Estimated until detail is loaded
          language: 'English Dub',
          tags,
          status: 'Completed',
          isUnlocked: true,
          firstEpisodeStream: `/api/shorts/stream?source=narto&seriesSlug=${encodeURIComponent(slug)}&epNum=1`
        });
      }
    }

    const result = {
      items,
      total: items.length,
      hasMore: items.length >= 24
    };

    feedCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (err: any) {
    console.error('[Narto Drama Feed Error]:', err.message);
    return { items: [], total: 0, hasMore: false };
  }
}

/**
 * Search Narto Drama
 */
export async function searchNartoDrama(query: string): Promise<ShortDramaItem[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const url = `${BASE_URL}/search?q=${encodeURIComponent(q)}&lang=en-US`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': `nd_ck=${getFreshCookie()}`
      }
    });

    if (!res.ok) {
      console.warn(`[Narto Search] returned ${res.status}`);
      return [];
    }

    const html = await res.text();
    const links = [...html.matchAll(/href=["'](https:\/\/narto-drama\.com\/detail\/watch\/([^"'\/?&]+)[^"']*)["']/gi)];
    const seen = new Set<string>();
    const results: ShortDramaItem[] = [];

    for (const linkMatch of links) {
      const slug = linkMatch[2];
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);

      const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      // Attempt to extract nearby poster if available
      const posterMatch = html.match(new RegExp(`src=["']([^"']*(?:poster|cover)[^"']*)["'][^>]*alt=["'][^"']*${slug}[^"']*["']`, 'i'));
      let poster = posterMatch ? posterMatch[1] : '';
      if (poster && !poster.startsWith('http')) {
        poster = `${BASE_URL}${poster}`;
      }

      results.push({
        id: `narto_${slug}`,
        source: 'narto',
        sourceName: 'Narto Drama',
        title,
        cover: poster || 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600',
        poster,
        banner: poster,
        description: `Stream ${title} on Narto Drama with all unlocked episodes.`,
        totalEpisodes: 60,
        language: 'English Dub',
        tags: ['Narto Drama', 'Shorts', 'English Dub'],
        status: 'Completed',
        isUnlocked: true,
        firstEpisodeStream: `/api/shorts/stream?source=narto&seriesSlug=${encodeURIComponent(slug)}&epNum=1`
      });
    }

    return results;
  } catch (err: any) {
    console.error('[Narto Search Error]:', err.message);
    return [];
  }
}

/**
 * Fetch full series detail & all direct HLS episodes from Narto Drama
 */
export async function getNartoDramaDetail(idOrSlug: string): Promise<ShortDramaDetail | null> {
  const slug = idOrSlug.replace(/^narto_/, '');
  const cacheKey = `narto_detail_${slug}`;

  const cached = detailCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DETAIL_CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = `${BASE_URL}/detail/watch/${slug}/1?lang=en-US`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': `nd_ck=${getFreshCookie()}`
      }
    });

    if (!res.ok) {
      console.warn(`[Narto Detail] ${slug} returned ${res.status}`);
      return null;
    }

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1].replace(/- Free Streaming.*$/i, '').trim() : slug.replace(/-/g, ' ');

    // Extract description
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract episodeItemsRaw
    const rawMatch = html.match(/const\s+episodeItemsRaw\s*=\s*(\[[\s\S]*?\]);/);
    const episodes: ShortDramaEpisode[] = [];

    if (rawMatch) {
      try {
        const rawList = JSON.parse(rawMatch[1]);
        for (const ep of rawList) {
          const num = ep.number || ep.route_episode_number || 1;
          const stream = ep.play_url || '';
          let thumb = ep.thumb_url || '';
          if (thumb && !thumb.startsWith('http')) {
            thumb = `${BASE_URL}${thumb}`;
          }

          episodes.push({
            episodeNumber: num,
            title: ep.title || `Episode ${num}`,
            streamUrl: stream,
            type: 'hls',
            thumbnail: thumb,
            source: 'narto'
          });
        }
      } catch (parseErr) {
        console.error('[Narto Drama] Failed to parse episodeItemsRaw:', parseErr);
      }
    }

    // Sort episodes sequentially
    episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

    // Extract poster
    let cover = episodes[0]?.thumbnail || '';
    if (!cover) {
      const imgMatch = html.match(/class=["'][^"']*poster[^"']*["'][^>]*src=["']([^"']+)["']/i);
      cover = imgMatch ? imgMatch[1] : '';
      if (cover && !cover.startsWith('http')) {
        cover = `${BASE_URL}${cover}`;
      }
    }

    const totalEpisodes = episodes.length > 0 ? episodes.length : 60;

    const detail: ShortDramaDetail = {
      id: `narto_${slug}`,
      source: 'narto',
      sourceName: 'Narto Drama',
      title,
      cover: cover || 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600',
      poster: cover,
      banner: cover,
      description: description || `Watch all ${totalEpisodes} full episodes of ${title} in HD on Narto Drama.`,
      totalEpisodes,
      language: 'English Dub',
      tags: ['Narto Drama', 'Shorts', 'English Dub', 'Full Series'],
      status: 'Completed',
      isUnlocked: true,
      firstEpisodeStream: episodes[0]?.streamUrl,
      episodes,
      recommendations: []
    };

    detailCache.set(cacheKey, { timestamp: Date.now(), data: detail });
    return detail;
  } catch (err: any) {
    console.error(`[Narto Detail Error] ${slug}:`, err.message);
    return null;
  }
}

/**
 * Resolves direct media stream URL for an episode from Narto's Edge router
 */
export async function resolveNartoStream(slugOrId: string, epNum: number = 1): Promise<string | null> {
  const slug = slugOrId.replace(/^narto_/, '');
  const num = Math.max(1, epNum);

  try {
    const url = `https://nartodrama.com/e/rs/detail/watch/${slug}/${num}/refresh-source?force=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `https://narto-drama.com/detail/watch/${slug}/${num}?lang=en-US`
      }
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.direct_play_url || data.play_url || null;
  } catch (err: any) {
    console.error('[Narto Stream Resolution Error]:', err.message);
    return null;
  }
}
