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
  duration?: number;
  averageScore?: number;
  genres?: string[];
  nextAiringEpisode?: {
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
  };
}

const mediaCache = new Map<string, AniListMediaDetails>();

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
 * Resolves any Shadow Garden anime or donghua title to an AniList Media object
 */
export async function resolveAniListMedia(title: string, animeId?: string): Promise<AniListMediaDetails | null> {
  const cacheKey = `${animeId || ''}_${title || ''}`.toLowerCase();
  if (mediaCache.has(cacheKey)) {
    return mediaCache.get(cacheKey)!;
  }

  // 1. If animeId is already a numeric AniList ID
  const numericId = parseInt(animeId || '', 10);
  if (!isNaN(numericId) && numericId > 0 && String(numericId) === animeId) {
    try {
      const byIdQuery = `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            idMal
            title { english romaji native userPreferred }
            coverImage { extraLarge large medium }
            bannerImage
            format
            status
            episodes
            duration
            averageScore
            genres
            nextAiringEpisode { episode airingAt timeUntilAiring }
          }
        }
      `;
      const res = await fetch('/api/anime/anilist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: byIdQuery, variables: { id: numericId } }),
      });
      const data = await res.json();
      if (data?.data?.Media) {
        mediaCache.set(cacheKey, data.data.Media);
        return data.data.Media;
      }
    } catch {}
  }

  // 2. Query by search title with variations
  const cleaned = cleanAnimeTitle(title);
  const searchCandidates = [cleaned, title];

  // Specific title corrections for known variants
  if (title.toLowerCase().includes('war of the three')) {
    searchCandidates.unshift('Tokyo Revengers: War of the Three Titans Arc');
  }

  const searchQuery = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        idMal
        title { english romaji native userPreferred }
        coverImage { extraLarge large medium }
        bannerImage
        format
        status
        episodes
        duration
        averageScore
        genres
        nextAiringEpisode { episode airingAt timeUntilAiring }
      }
    }
  `;

  for (const candidate of searchCandidates) {
    if (!candidate || candidate.length < 2) continue;
    try {
      const res = await fetch('/api/anime/anilist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, variables: { search: candidate } }),
      });
      const data = await res.json();
      if (data?.data?.Media) {
        mediaCache.set(cacheKey, data.data.Media);
        return data.data.Media;
      }
    } catch {}
  }

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
 * PULL: Import / Sync public AniList watchlist by username into Supabase
 * Safely preserves Donghua, Shorts, Drama, and Movie entries in Supabase
 */
export async function pullFromAniList(username: string, userId: string) {
  if (!username?.trim() || !userId) {
    throw new Error('Valid username and user ID required for pull');
  }

  const query = `
    query ($userName: String) {
      MediaListCollection(userName: $userName, type: ANIME) {
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

  const res = await fetch('/api/anime/anilist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { userName: username.trim() } }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'Failed to fetch AniList watchlist');
  }

  const lists = json?.data?.MediaListCollection?.lists || [];
  let totalEntries = 0;
  let importedCount = 0;

  for (const list of lists) {
    for (const entry of list.entries) {
      totalEntries++;
      const media = entry.media;
      const animeId = String(media.id);
      const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || 'Unknown Title';
      const poster = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium;
      const sgStatus = mapToShadowGardenStatus(entry.status);

      const upsertPayload = {
        user_id: userId,
        anime_id: animeId,
        anime_title: title,
        anime_image: poster,
        banner_image: media.bannerImage || null,
        status: sgStatus,
        last_episode_number: entry.progress || 0,
        total_episodes: media.episodes || null,
        score: entry.score || (media.averageScore ? Math.round(media.averageScore / 10) : null),
        media_type: 'anime',
        updated_at: new Date(entry.updatedAt ? entry.updatedAt * 1000 : Date.now()).toISOString(),
      };

      const { error } = await supabase.from('watchlist').upsert(upsertPayload, {
        onConflict: 'user_id,anime_id'
      });

      if (!error) {
        importedCount++;
      }
    }
  }

  return {
    success: true,
    totalEntries,
    importedCount,
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
 * TWO-WAY SYNC: Multi-realm sync for TriArchive
 * 1. Pulls updated Anime from AniList into Supabase
 * 2. Pushes user changes to AniList while protecting Donghua and Cinema/Shorts
 */
export async function twoWaySync(userId: string, username: string, anilistToken?: string) {
  // 1. Pull from AniList
  const pullResult = await pullFromAniList(username, userId);

  // 2. If token is available, push using TriArchive realm routing
  let pushResult = null;
  if (anilistToken) {
    pushResult = await pushToAniList(userId, anilistToken);
  }

  return {
    success: true,
    pulled: pullResult,
    pushed: pushResult,
  };
}

