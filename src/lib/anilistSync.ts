// src/lib/anilistSync.ts
import { supabase } from '@/lib/supabase';

export type TriArchiveRealm = 'anime' | 'donghua' | 'cinema' | 'shorts';

/**
 * Determines which TriArchive Realm a media item belongs to
 */
export function getMediaRealm(mediaType?: string): TriArchiveRealm {
  const type = (mediaType || '').toLowerCase().trim();
  if (type === 'donghua') return 'donghua';
  if (type === 'shorts' || type === 'short') return 'shorts';
  if (type === 'drama' || type === 'movie' || type === 'series' || type === 'film') return 'cinema';
  return 'anime'; // Default realm: anime (and future manga/hindi dubs)
}

export interface AniListMediaDetails {
  id: number;
  idMal?: number;
  title: {
    english?: string;
    romaji?: string;
    native?: string;
    userPreferred?: string;
  };
  coverImage: {
    extraLarge?: string;
    large?: string;
    medium?: string;
  };
  bannerImage?: string;
  format?: string;
  status?: string;
  episodes?: number;
  chapters?: number;
  volumes?: number;
  duration?: number;
  averageScore?: number;
  genres?: string[];
  nextAiringEpisode?: {
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
  };
}

const mediaCache = new Map<string, AniListMediaDetails | null>();
const mediaCacheTTL = new Map<string, number>(); // timestamp when cached
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─── RATE-LIMITED REQUEST QUEUE ──────────────────────────────────────────────
// Prevents 429 storms when many cards mount and each call resolveAniListMedia
const requestQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void; fn: () => Promise<any> }> = [];
let isProcessingQueue = false;
const MIN_REQUEST_GAP_MS = 650; // minimum ms between AniList API calls (safely within 90 req/min)

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  while (requestQueue.length > 0) {
    const item = requestQueue.shift()!;
    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    }
    // Wait between requests to avoid rate limits
    await new Promise(r => setTimeout(r, MIN_REQUEST_GAP_MS));
  }
  isProcessingQueue = false;
}

function enqueueRequest<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    requestQueue.push({ resolve, reject, fn });
    processQueue();
  });
}

// In-flight dedup: prevents duplicate concurrent requests for the same key
const inflightRequests = new Map<string, Promise<AniListMediaDetails | null>>();

// Clean title for high-accuracy AniList fuzzy matching
export function cleanAnimeTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/-[a-f0-9]{4,6}$/i, '') // trailing hashes like -359bc
    .replace(/season\s+(\d+)/i, 'Season $1')
    .replace(/2nd Season/i, 'Season 2')
    .replace(/3rd Season/i, 'Season 3')
    .replace(/4th Season/i, 'Season 4')
    .replace(/\s*\(TV\)/gi, '')
    .replace(/\s*\(Dub\)/gi, '')
    .replace(/\s*\(Sub\)/gi, '')
    .replace(/\s*\(Hindi Dub\)/gi, '')
    .replace(/\s*\(Chinese Dub\)/gi, '')
    .trim();
}

/**
 * Resolves any Shadow Garden anime or manga title to an AniList Media object with live stats
 */
export async function resolveAniListMedia(
  title: string, 
  mediaId?: string, 
  mediaType: 'ANIME' | 'MANGA' = 'ANIME'
): Promise<AniListMediaDetails | null> {
  const cacheKey = `${mediaType}_${mediaId || ''}_${title || ''}`.toLowerCase();
  
  // Check cache with TTL (includes negative/null caching)
  if (mediaCache.has(cacheKey)) {
    const cachedAt = mediaCacheTTL.get(cacheKey) || 0;
    if (Date.now() - cachedAt < CACHE_TTL_MS) {
      return mediaCache.get(cacheKey) ?? null;
    }
    // Stale cache - remove
    mediaCache.delete(cacheKey);
    mediaCacheTTL.delete(cacheKey);
  }

  // Dedup: if there's already an in-flight request for this key, wait for it
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey)!;
  }

  const promise = _resolveAniListMediaInternal(title, mediaId, mediaType, cacheKey);
  inflightRequests.set(cacheKey, promise);
  
  try {
    return await promise;
  } finally {
    inflightRequests.delete(cacheKey);
  }
}

async function _resolveAniListMediaInternal(
  title: string,
  mediaId: string | undefined,
  mediaType: 'ANIME' | 'MANGA',
  cacheKey: string
): Promise<AniListMediaDetails | null> {

  // 1. If mediaId is already a numeric AniList ID
  const numericId = parseInt(mediaId || '', 10);
  if (!isNaN(numericId) && numericId > 0 && String(numericId) === mediaId) {
    try {
      const byIdQuery = `
        query ($id: Int, $type: MediaType) {
          Media(id: $id, type: $type) {
            id
            idMal
            title { english romaji native userPreferred }
            coverImage { extraLarge large medium }
            bannerImage
            format
            status
            episodes
            chapters
            volumes
            duration
            averageScore
            genres
            nextAiringEpisode { episode airingAt timeUntilAiring }
          }
        }
      `;
      const data = await enqueueRequest(async () => {
        const res = await fetch('/api/anime/anilist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: byIdQuery, variables: { id: numericId, type: mediaType } }),
        });
        if (res.status === 429) return null; // Rate limited, skip gracefully
        return res.json();
      });
      if (data?.data?.Media) {
        mediaCache.set(cacheKey, data.data.Media);
        mediaCacheTTL.set(cacheKey, Date.now());
        return data.data.Media;
      }
    } catch {}
  }

  // 2. Query by search title with deduplicated variations
  const cleaned = cleanAnimeTitle(title);
  const candidatesSet = new Set<string>();
  if (title.toLowerCase().includes('war of the three')) {
    candidatesSet.add('Tokyo Revengers: War of the Three Titans Arc');
  }
  if (cleaned && cleaned.length >= 2) candidatesSet.add(cleaned);
  if (title && title.length >= 2) candidatesSet.add(title);
  const searchCandidates = Array.from(candidatesSet);

  const searchQuery = `
    query ($search: String, $type: MediaType) {
      Media(search: $search, type: $type) {
        id
        idMal
        title { english romaji native userPreferred }
        coverImage { extraLarge large medium }
        bannerImage
        format
        status
        episodes
        chapters
        volumes
        duration
        averageScore
        genres
        nextAiringEpisode { episode airingAt timeUntilAiring }
      }
    }
  `;

  for (const candidate of searchCandidates) {
    try {
      let isRateLimited = false;
      const data = await enqueueRequest(async () => {
        const res = await fetch('/api/anime/anilist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery, variables: { search: candidate, type: mediaType } }),
        });
        if (res.status === 429) {
          isRateLimited = true;
          return null; // Rate limited, skip gracefully
        }
        return res.json();
      });

      if (data?.data?.Media) {
        mediaCache.set(cacheKey, data.data.Media);
        mediaCacheTTL.set(cacheKey, Date.now());
        return data.data.Media;
      }

      // If we got 429, don't keep battering with more candidates
      if (isRateLimited) {
        break;
      }
    } catch {}
  }

  // Cache negative result so cards don't repeatedly retry failed queries
  mediaCache.set(cacheKey, null);
  mediaCacheTTL.set(cacheKey, Date.now());
  return null;
}

/**
 * Maps Shadow Garden status to AniList status
 */
export function mapToAniListStatus(sgStatus: string): string {
  switch (sgStatus) {
    case 'watching': return 'CURRENT';
    case 'completed': return 'COMPLETED';
    case 'plan_to_watch': return 'PLANNING';
    case 'on_hold': return 'PAUSED';
    case 'dropped': return 'DROPPED';
    default: return 'CURRENT';
  }
}

/**
 * Maps AniList status to Shadow Garden status
 */
export function mapToShadowGardenStatus(anilistStatus: string): string {
  switch (anilistStatus) {
    case 'CURRENT':
    case 'REPEATING':
      return 'watching';
    case 'COMPLETED':
      return 'completed';
    case 'PAUSED':
      return 'on_hold';
    case 'DROPPED':
      return 'dropped';
    case 'PLANNING':
    default:
      return 'plan_to_watch';
  }
}

/**
 * Track deleted items in Shadow Garden to mirror deletions on AniList during 2-way sync
 */
export function recordDeletedMedia(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('shadow_deleted_items') || '[]';
    const list: string[] = JSON.parse(raw);
    if (!list.includes(String(id))) {
      list.push(String(id));
      localStorage.setItem('shadow_deleted_items', JSON.stringify(list));
    }
  } catch {}
}

export function getAndClearDeletedMedia(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('shadow_deleted_items') || '[]';
    const list: string[] = JSON.parse(raw);
    localStorage.removeItem('shadow_deleted_items');
    return list;
  } catch {
    return [];
  }
}

/**
 * PULL: Import / Sync public AniList library by username
 * Supports both ANIME and MANGA
 * Works without access token for non-signed in travellers and saves to local storage!
 * If userId is provided, also syncs directly to Supabase.
 */
export async function pullFromAniList(username: string, userId?: string) {
  const cleanUser = username?.trim();
  if (!cleanUser) {
    throw new Error('Valid username required for pull');
  }

  const query = `
    query ($userName: String, $type: MediaType) {
      MediaListCollection(userName: $userName, type: $type) {
        lists {
          name
          status
          entries {
            id
            mediaId
            status
            progress
            score(format: POINT_10)
            updatedAt
            media {
              id
              idMal
              title { english romaji native userPreferred }
              coverImage { extraLarge large medium }
              bannerImage
              format
              status
              episodes
              chapters
              volumes
              duration
              averageScore
              genres
              nextAiringEpisode { episode airingAt timeUntilAiring }
            }
          }
        }
      }
    }
  `;

  // 1. Fetch Anime List
  const animeRes = await fetch('/api/anime/anilist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { userName: cleanUser, type: 'ANIME' } }),
  });
  const animeJson = await animeRes.json();
  const animeLists = animeJson?.data?.MediaListCollection?.lists || [];

  // 2. Fetch Manga List
  let mangaLists: any[] = [];
  try {
    const mangaRes = await fetch('/api/anime/anilist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { userName: cleanUser, type: 'MANGA' } }),
    });
    const mangaJson = await mangaRes.json();
    mangaLists = mangaJson?.data?.MediaListCollection?.lists || [];
  } catch {}

  const localWatchlist: any[] = [];
  const localReadlist: any[] = [];

  // Process Anime
  for (const list of animeLists) {
    for (const entry of list.entries || []) {
      const media = entry.media;
      const animeId = String(media.id);
      const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || 'Unknown Title';
      const poster = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium;
      const sgStatus = mapToShadowGardenStatus(entry.status);

      localWatchlist.push({
        id: animeId,
        anime_id: animeId,
        anime_title: title,
        title: title,
        anime_image: poster,
        poster: poster,
        banner_image: media.bannerImage || null,
        status: sgStatus,
        last_episode_number: entry.progress || 0,
        progress: entry.progress || 0,
        total_episodes: media.episodes || null,
        score: entry.score || (media.averageScore ? Math.round(media.averageScore / 10) : null),
        media_type: 'anime',
        type: media.format || 'TV',
        updated_at: new Date(entry.updatedAt ? entry.updatedAt * 1000 : Date.now()).toISOString(),
      });
    }
  }

  // Process Manga
  for (const list of mangaLists) {
    for (const entry of list.entries || []) {
      const media = entry.media;
      const mangaId = String(media.id);
      const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || 'Unknown Title';
      const poster = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium;
      const sgStatus = mapToShadowGardenStatus(entry.status) === 'watching' ? 'reading' : mapToShadowGardenStatus(entry.status);

      localReadlist.push({
        id: mangaId,
        anime_id: mangaId,
        manga_id: mangaId,
        anime_title: title,
        title: title,
        anime_image: poster,
        poster: poster,
        image: poster,
        banner_image: media.bannerImage || null,
        status: sgStatus,
        last_episode_number: entry.progress || 0,
        chapters_read: entry.progress || 0,
        progress: entry.progress || 0,
        total_chapters: media.chapters || null,
        total_episodes: media.chapters || null,
        score: entry.score || (media.averageScore ? Math.round(media.averageScore / 10) : null),
        media_type: 'manga',
        type: 'MANGA',
        updated_at: new Date(entry.updatedAt ? entry.updatedAt * 1000 : Date.now()).toISOString(),
      });
    }
  }

  // Save to localStorage for instant UI responsiveness
  if (typeof window !== 'undefined') {
    if (localWatchlist.length > 0) {
      localStorage.setItem('shadow_watchlist', JSON.stringify(localWatchlist));
    }
    if (localReadlist.length > 0) {
      localStorage.setItem('shadow_readlist', JSON.stringify(localReadlist));
    }
    localStorage.setItem('shadow_anilist_username', cleanUser);
    localStorage.setItem('shadow_anilist_sync_state', JSON.stringify({
      last_synced: new Date().toISOString(),
      username: cleanUser,
      anime_count: localWatchlist.length,
      manga_count: localReadlist.length,
    }));
    window.dispatchEvent(new CustomEvent('shadow-watchlist-updated'));
    window.dispatchEvent(new CustomEvent('shadow-readlist-updated'));
  }

  // If user signed in, sync into Supabase
  let supabaseImported = 0;
  if (userId) {
    try {
      const allToUpsert = [
        ...localWatchlist.map(i => ({ ...i, user_id: userId })),
        ...localReadlist.map(i => ({ ...i, user_id: userId })),
      ];

      for (const item of allToUpsert) {
        const { error } = await supabase.from('watchlist').upsert({
          user_id: userId,
          anime_id: item.anime_id,
          anime_title: item.anime_title,
          anime_image: item.anime_image,
          banner_image: item.banner_image,
          status: item.status,
          last_episode_number: item.last_episode_number,
          total_episodes: item.total_episodes,
          total_chapters: item.total_chapters,
          score: item.score,
          media_type: item.media_type,
          updated_at: item.updated_at,
        }, { onConflict: 'user_id,anime_id' });

        if (!error) supabaseImported++;
      }
    } catch (e) {
      console.warn('Supabase sync notice:', e);
    }
  }

  return {
    success: true,
    totalAnime: localWatchlist.length,
    totalManga: localReadlist.length,
    supabaseImported,
  };
}

/**
 * PUSH: Push user's Supabase watchlist to AniList following TriArchive Realm rules:
 * - Realm I (Anime): Pushes to AniList
 * - Realm II (Donghua): Tries AniList; if unavailable, stays in Supabase without throwing error
 * - Realm III (Drama, Shorts, Series, Movies): Preserved purely in Supabase Cloud Core
 */
export async function pushToAniList(userId: string, anilistToken: string) {
  if (!userId || !anilistToken) {
    throw new Error('User ID and AniList token are required to push');
  }

  // 1. Fetch user watchlist from Supabase
  const { data: items, error: fetchErr } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId);

  if (fetchErr || !items) {
    throw new Error(fetchErr?.message || 'Failed to fetch watchlist from database');
  }

  const mutation = `
    mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int, $score: Float) {
      SaveMediaListEntry (mediaId: $mediaId, status: $status, progress: $progress, score: $score) {
        id
        mediaId
        status
        progress
      }
    }
  `;

  let pushedCount = 0;
  let donghuaSyncedCount = 0;
  let cloudPreservedCount = 0;
  let failedCount = 0;
  const results: any[] = [];

  for (const item of items) {
    const realm = getMediaRealm(item.media_type);

    // Realm III: Drama, Shorts, Series, Movies -> Stay in Supabase Cloud Core
    if (realm === 'shorts' || realm === 'cinema') {
      cloudPreservedCount++;
      results.push({
        item: item.anime_title,
        realm,
        status: 'cloud_preserved',
        reason: 'Supabase Cloud Core Protected (Live Action & Shorts)',
      });
      continue;
    }

    // Realm II: Donghua -> Try AniList; if unavailable, stay in Supabase without throwing error
    if (realm === 'donghua') {
      try {
        const media = await resolveAniListMedia(item.anime_title, item.anime_id);
        if (!media || !media.id) {
          // Gracefully stay in Supabase without error!
          cloudPreservedCount++;
          results.push({
            item: item.anime_title,
            realm: 'donghua',
            status: 'cloud_preserved',
            reason: 'Donghua Unlisted on AniList · Preserved in Supabase Vault',
          });
          continue;
        }

        const anilistStatus = mapToAniListStatus(item.status);
        const progress = item.last_episode_number || 0;
        const score = item.score ? Number(item.score) : undefined;

        const res = await fetch('/api/anime/anilist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anilistToken}`,
          },
          body: JSON.stringify({
            query: mutation,
            variables: {
              mediaId: media.id,
              status: anilistStatus,
              progress,
              score,
            }
          })
        });

        const resJson = await res.json();
        if (resJson?.data?.SaveMediaListEntry) {
          pushedCount++;
          donghuaSyncedCount++;
          results.push({
            item: item.anime_title,
            realm: 'donghua',
            mediaId: media.id,
            status: 'pushed',
            progress,
          });
        } else {
          // If rejected by AniList, safely keep in Supabase without failing
          cloudPreservedCount++;
          results.push({
            item: item.anime_title,
            realm: 'donghua',
            status: 'cloud_preserved',
            reason: 'AniList Entry Mismatched · Preserved in Supabase Vault',
          });
        }
        await new Promise(r => setTimeout(r, 200));
      } catch (err: any) {
        // Safe harbor for Donghua: never fail the push
        cloudPreservedCount++;
        results.push({
          item: item.anime_title,
          realm: 'donghua',
          status: 'cloud_preserved',
          reason: 'Network Skip · Preserved in Supabase Vault',
        });
      }
      continue;
    }

    // Realm I: Anime & Future Manga -> Standard AniList Two-Way Push
    try {
      const media = await resolveAniListMedia(item.anime_title, item.anime_id);
      if (!media || !media.id) {
        failedCount++;
        results.push({
          item: item.anime_title,
          realm: 'anime',
          status: 'failed',
          reason: 'Could not resolve AniList ID',
        });
        continue;
      }

      const anilistStatus = mapToAniListStatus(item.status);
      const progress = item.last_episode_number || 0;
      const score = item.score ? Number(item.score) : undefined;

      const res = await fetch('/api/anime/anilist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anilistToken}`,
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            mediaId: media.id,
            status: anilistStatus,
            progress: progress,
            score: score,
          }
        })
      });

      const resJson = await res.json();
      if (resJson?.data?.SaveMediaListEntry) {
        pushedCount++;
        results.push({
          item: item.anime_title,
          realm: 'anime',
          mediaId: media.id,
          status: 'pushed',
          progress,
        });
      } else {
        failedCount++;
        results.push({
          item: item.anime_title,
          realm: 'anime',
          status: 'failed',
          reason: resJson.errors?.[0]?.message || 'AniList rejected mutation',
        });
      }

      // Small delay to prevent hitting AniList mutation rate limit
      await new Promise(r => setTimeout(r, 200));
    } catch (e: any) {
      failedCount++;
      results.push({
        item: item.anime_title,
        realm: 'anime',
        status: 'failed',
        reason: e.message,
      });
    }
  }

  return {
    success: true,
    totalItems: items.length,
    pushedCount,
    donghuaSyncedCount,
    cloudPreservedCount,
    failedCount,
    details: results,
  };
}

/**
 * TWO-WAY SYNC / OVERRIDE:
 * 1. Checks update timestamps between AniList and Supabase
 * 2. Mirrors deletions between both platforms
 * 3. Supports explicit override (override Supabase or override AniList)
 */
export async function twoWaySync(
  userId: string, 
  username: string, 
  anilistToken?: string, 
  options?: { 
    override?: 'supabase' | 'anilist';
    targetMediaType?: 'anime' | 'manga';
  }
) {
  const deletedIds = getAndClearDeletedMedia();

  const action = options?.override === 'supabase' 
    ? 'override_supabase' 
    : options?.override === 'anilist' 
      ? 'override_anilist' 
      : 'two-way';

  const res = await fetch('/api/anilist/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      userId,
      username,
      token: anilistToken,
      deletedMediaIds: deletedIds,
      targetMediaType: options?.targetMediaType,
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to complete two-way synchronization');
  }

  // Also refresh local cache
  if (typeof window !== 'undefined') {
    await pullFromAniList(username, userId);
  }

  return data;
}


