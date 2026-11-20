/**
 * HepDrama Source Provider (https://hepdrama.com)
 * Native English vertical short dramas (Billionaire, CEO, Werewolf, Secret Baby, Mafia, Revenge)
 * Direct HLS (.m3u8) playback with HD quality.
 */

import { ShortDramaItem, ShortDramaDetail, ShortDramaEpisode } from '../types';

const BASE_URL = 'https://hepdrama.com';

// In-memory cache for ultra-fast response
const feedCache = new Map<string, { timestamp: number; data: { items: ShortDramaItem[]; total: number; hasMore: boolean } }>();
const detailCache = new Map<string, { timestamp: number; data: ShortDramaDetail }>();
const streamCache = new Map<string, { timestamp: number; url: string }>();

const FEED_CACHE_TTL = 30 * 60 * 1000;   // 30 minutes
const DETAIL_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const STREAM_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const HEPDRAMA_CATEGORIES = [
  { slug: 'billionaire-ceo', name: 'Billionaire & CEO' },
  { slug: 'revenge', name: 'Revenge' },
  { slug: 'contract-marriage', name: 'Contract Marriage' },
  { slug: 'hidden-identity', name: 'Hidden Identity' },
  { slug: 'divorce-betrayal', name: 'Divorce & Betrayal' },
  { slug: 'mafia', name: 'Mafia' },
  { slug: 'werewolf', name: 'Werewolf' },
  { slug: 'secret-baby', name: 'Secret Baby' },
  { slug: 'enemies-to-lovers', name: 'Enemies to Lovers' },
  { slug: 'strong-women', name: 'Strong Women' },
  { slug: 'time-travel', name: 'Time Travel' },
  { slug: 'rebirth', name: 'Rebirth' }
];

function detectHepStudio(title: string, synopsis?: string): string {
  const combined = `${title} ${synopsis || ''}`.toLowerCase();
  if (combined.includes('goodshort') || combined.includes('goodbos')) return 'GoodShort';
  if (combined.includes('shorttv') || combined.includes('volcengine')) return 'ShortTV';
  if (combined.includes('reelshort') || combined.includes('crazymaple')) return 'ReelShort';
  if (combined.includes('moboreels') || combined.includes('mobo')) return 'MoboReels';
  if (combined.includes('kalostv') || combined.includes('kalos')) return 'Kalos TV';
  if (combined.includes('topshort')) return 'TopShort';
  if (combined.includes('netshort')) return 'NetShort';
  if (combined.includes('meloshort') || combined.includes('melolo')) return 'MeloShort';
  if (combined.includes('flickreel')) return 'FlickReels';
  if (combined.includes('anyreel')) return 'AnyReel';
  if (combined.includes('sereal')) return 'Sereal';
  return 'DramaBox';
}

/**
 * Fetch and parse category pages from HepDrama
 */
export async function getHepDramaFeed(
  categorySlug?: string,
  page: number = 1
): Promise<{ items: ShortDramaItem[]; total: number; hasMore: boolean }> {
  const cat = categorySlug || (page % 2 === 0 ? 'revenge' : 'billionaire-ceo');
  const cacheKey = `hep_feed_${cat}_${page}`;
  
  const cached = feedCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < FEED_CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = `${BASE_URL}/en/category/${cat}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      next: { revalidate: 1800 }
    });

    if (!res.ok) {
      console.warn(`[HepDrama] Category ${cat} returned status ${res.status}`);
      return { items: [], total: 0, hasMore: false };
    }

    const html = await res.text();
    const unescaped = html.replace(/\\"/g, '"');

    // Parse series objects from dehydrated RSC payload
    const regex = /"slug":"([^"]+)","title":"([^"]+)"[\s\S]*?"synopsis":(".*?"|null)[\s\S]*?"posterUrl":"([^"]+)"[\s\S]*?"episodeCount":(\d+)/g;
    const items: ShortDramaItem[] = [];
    const seen = new Set<string>();

    for (const m of unescaped.matchAll(regex)) {
      const slug = m[1];
      if (seen.has(slug)) continue;
      seen.add(slug);

      const title = m[2];
      let synopsis = '';
      try {
        synopsis = m[3] === 'null' ? '' : JSON.parse(m[3]);
      } catch {
        synopsis = m[3] || '';
      }

      let poster = m[4];
      if (poster && !poster.startsWith('http')) {
        poster = `${BASE_URL}${poster}`;
      }

      const episodeCount = parseInt(m[5], 10) || 1;
      const studio = detectHepStudio(title, synopsis);

      items.push({
        id: `hep_${slug}`,
        source: 'hepdrama',
        sourceName: studio,
        title,
        cover: poster,
        poster,
        banner: poster,
        description: synopsis || `Stream all ${episodeCount} episodes of ${title} in HD.`,
        totalEpisodes: episodeCount,
        language: 'English Dub',
        tags: [
          studio,
          cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          'Western CEO',
          'Mini-Series'
        ],
        status: 'Completed',
        isUnlocked: true,
        firstEpisodeStream: `/api/shorts/stream?source=hepdrama&seriesSlug=${encodeURIComponent(slug)}&epNum=1`
      });
    }

    const result = {
      items,
      total: items.length,
      hasMore: items.length >= 30
    };

    feedCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (err: any) {
    console.error('[HepDrama Feed Error]:', err.message);
    return { items: [], total: 0, hasMore: false };
  }
}

/**
 * Live search on HepDrama via /api/search
 */
export async function searchHepDrama(query: string): Promise<ShortDramaItem[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const res = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(q)}&lang=en`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`[HepDrama Search] Failed with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    const rawItems = Array.isArray(data) ? data : (data.items || []);

    return rawItems.map((item: any) => {
      let poster = item.posterUrl || '';
      if (poster && !poster.startsWith('http')) {
        poster = `${BASE_URL}${poster}`;
      }

      const studio = detectHepStudio(item.title);
      const tags = [studio];
      if (Array.isArray(item.categories)) {
        item.categories.forEach((c: any) => {
          if (c.name && c.name !== 'HepDrama') tags.push(c.name);
        });
      }

      return {
        id: `hep_${item.slug}`,
        source: 'hepdrama' as const,
        sourceName: studio,
        title: item.title,
        cover: poster,
        poster,
        banner: poster,
        description: `Watch ${item.title} with all ${item.episodeCount || 0} episodes unlocked on ${studio}.`,
        totalEpisodes: item.episodeCount || 0,
        language: 'English Dub' as const,
        tags,
        status: 'Completed' as const,
        isUnlocked: true,
        firstEpisodeStream: `/api/shorts/stream?source=hepdrama&seriesSlug=${encodeURIComponent(item.slug)}&epNum=1`
      };
    });
  } catch (err: any) {
    console.error('[HepDrama Search Error]:', err.message);
    return [];
  }
}

/**
 * Fetch full series detail & all episodes from HepDrama
 */
export async function getHepDramaDetail(idOrSlug: string): Promise<ShortDramaDetail | null> {
  const slug = idOrSlug.replace(/^hep_/, '');
  const cacheKey = `hep_detail_${slug}`;

  const cached = detailCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DETAIL_CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = `${BASE_URL}/en/series/${slug}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      console.warn(`[HepDrama Detail] ${slug} returned ${res.status}`);
      return null;
    }

    const html = await res.text();
    const unescaped = html.replace(/\\"/g, '"');

    // Extract title
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || unescaped.match(/"title":"([^"]+)"/);
    const title = titleMatch ? titleMatch[1].trim() : slug.replace(/-/g, ' ');

    // Extract synopsis
    const synopsisMatch = unescaped.match(/"synopsis":(".*?"|null)/);
    let description = '';
    if (synopsisMatch && synopsisMatch[1] !== 'null') {
      try {
        description = JSON.parse(synopsisMatch[1]);
      } catch {
        description = synopsisMatch[1];
      }
    }

    // Extract poster
    const posterMatch = unescaped.match(/"posterUrl":"([^"]+)"/) || html.match(/<meta property="og:image" content="([^"]+)"/i);
    let cover = posterMatch ? posterMatch[1] : '';
    if (cover && !cover.startsWith('http')) {
      cover = `${BASE_URL}${cover}`;
    }

    // Extract all episodes from RSC
    // {"id":"[uuid]","number":1,...,"thumbnailUrl":"..."}
    const epMatches = [...unescaped.matchAll(/\{"id":"([0-9a-fA-F-]+)","number":(\d+)[^{}]*?"thumbnailUrl":(".*?"|null)[^{}]*?\}/g)];
    const epMap = new Map<number, ShortDramaEpisode>();

    for (const m of epMatches) {
      const epId = m[1];
      const epNum = parseInt(m[2], 10);
      if (epMap.has(epNum)) continue;

      let thumb: string | undefined = undefined;
      if (m[3] && m[3] !== 'null') {
        try {
          thumb = JSON.parse(m[3]);
        } catch {
          thumb = m[3];
        }
      }

      epMap.set(epNum, {
        episodeNumber: epNum,
        title: `Episode ${epNum}`,
        streamUrl: `/api/shorts/stream?source=hepdrama&epId=${epId}&seriesSlug=${encodeURIComponent(slug)}&epNum=${epNum}`,
        type: 'hls',
        thumbnail: thumb || cover,
        source: 'hepdrama'
      });
    }

    // Sort episodes sequentially
    const episodes = Array.from(epMap.values()).sort((a, b) => a.episodeNumber - b.episodeNumber);

    // If episode 1 exists, pre-resolve its direct stream to eliminate delay on play
    if (episodes.length > 0) {
      const firstEpMatch = epMatches.find(m => parseInt(m[2], 10) === 1);
      if (firstEpMatch) {
        const ep1Id = firstEpMatch[1];
        try {
          const directStream = await resolveHepDramaStream(ep1Id);
          if (directStream) {
            episodes[0].streamUrl = directStream;
          }
        } catch (e) {
          // Fallback to resolver route
        }
      }
    }

    const totalEpisodes = episodes.length > 0 ? episodes.length : 1;
    const studio = detectHepStudio(title, description);

    const detail: ShortDramaDetail = {
      id: `hep_${slug}`,
      source: 'hepdrama',
      sourceName: studio,
      title,
      cover: cover || 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600',
      poster: cover,
      banner: cover,
      description: description || `Watch all ${totalEpisodes} full episodes of ${title} in HD with zero interruptions.`,
      totalEpisodes,
      language: 'English Dub',
      tags: [studio, 'Western Romance', 'Billionaire CEO', 'Full Series'],
      status: 'Completed',
      isUnlocked: true,
      firstEpisodeStream: episodes[0]?.streamUrl,
      episodes,
      recommendations: []
    };

    detailCache.set(cacheKey, { timestamp: Date.now(), data: detail });
    return detail;
  } catch (err: any) {
    console.error(`[HepDrama Detail Error] for ${slug}:`, err.message);
    return null;
  }
}

/**
 * Resolves a HepDrama episode to direct CDN HLS .m3u8 stream
 */
export async function resolveHepDramaStream(episodeId: string): Promise<string | null> {
  if (!episodeId) return null;

  const cached = streamCache.get(episodeId);
  if (cached && Date.now() - cached.timestamp < STREAM_CACHE_TTL) {
    return cached.url;
  }

  try {
    const playUrl = `${BASE_URL}/api/play/${episodeId}`;
    const playRes = await fetch(playUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://hepdrama.com/',
        'Accept': 'application/json'
      }
    });

    if (!playRes.ok) {
      console.warn(`[HepDrama Play API] ${episodeId} returned ${playRes.status}`);
      return null;
    }

    const playData = await playRes.json();
    const relUrl = playData.sources?.[0]?.url;
    if (!relUrl) {
      return null;
    }

    const streamApiUrl = relUrl.startsWith('http') ? relUrl : `${BASE_URL}${relUrl}`;

    // Follow 302 redirect manually to obtain the CDN URL
    const streamRes = await fetch(streamApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://hepdrama.com/'
      },
      redirect: 'manual'
    });

    const location = streamRes.headers.get('location');
    const finalUrl = location || streamApiUrl;

    streamCache.set(episodeId, { timestamp: Date.now(), url: finalUrl });
    return finalUrl;
  } catch (err: any) {
    console.error(`[HepDrama Resolve Stream Error] ${episodeId}:`, err.message);
    return null;
  }
}
