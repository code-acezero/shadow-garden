import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { AniListService } from '@/lib/anilist';
import { AnimeService } from '@/lib/api';
import { dpi } from '@/lib/dpi';
import { omni } from '@/lib/omni';
import { hpi } from '@/lib/hpi';
import { mangaService, novelService } from '@/lib/manga';

interface WatchlistItem {
  user_id: string;
  anime_id: string;
  anime_title: string;
  anime_image: string;
  media_type?: string;
  last_episode_number?: number;
  total_episodes?: number;
  status?: string;
}

/**
 * 1. ANIKOTO FAST-MATCH ENGINE: checkRecentEpisodeAlerts()
 * -------------------------------------------------------------------------
 * Instead of looping through the entire database, this checks the freshly
 * aired broadcast episodes feed (which only contains 20-30 titles released today)
 * and matches them against watching users in < 150ms.
 */
export async function checkRecentEpisodeAlerts() {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    console.error("[Oracle:Recent] Supabase admin client not available");
    return { error: "Database admin client unavailable" };
  }

  try {
    const recent = await AniListService.getRecentEpisodes(1, 24);
    if (!recent || recent.length === 0) {
      return { notified: 0, checked: 0 };
    }

    // Build candidate lookup lists (exact string ID, numeric AniList ID, and slugs)
    const candidateIds = new Set<string>();
    for (const item of recent) {
      const rawId = String(item.id || '').trim();
      if (rawId) {
        candidateIds.add(rawId);
        // Extract numeric suffix if present (e.g. "solo-leveling-20401" -> "20401")
        const match = rawId.match(/(\d+)$/);
        if (match) candidateIds.add(match[1]);
      }
    }

    // Fetch all watching users from Supabase using Admin Client (bypasses RLS)
    const { data: watchingList, error: dbErr } = await adminClient
      .from('watchlist')
      .select('user_id, anime_id, anime_title, anime_image, media_type, last_episode_number, status')
      .eq('status', 'watching');

    if (dbErr) throw dbErr;
    if (!watchingList || watchingList.length === 0) {
      return { notified: 0, checked: recent.length, watchingCount: 0 };
    }

    const notificationsToInsert: any[] = [];

    for (const watcher of watchingList) {
      const watcherRawId = String(watcher.anime_id || '').trim();
      const watcherNumMatch = watcherRawId.match(/(\d+)$/);
      const watcherNumId = watcherNumMatch ? watcherNumMatch[1] : null;

      // Find if this watcher's anime aired in the recent batch
      const airedItem = recent.find((item: any) => {
        const itemId = String(item.id || '').trim();
        return itemId === watcherRawId || (watcherNumId && itemId === watcherNumId);
      });

      if (!airedItem) continue;

      const latestEp = Number((airedItem as any).episode) || 1;
      const watchedEp = Number(watcher.last_episode_number) || 0;

      // Only notify if user hasn't already watched this episode
      if (watchedEp >= latestEp) continue;

      const targetLink = `/watch/${watcher.anime_id}?ep=${latestEp}`;

      // Deduplicate against notifications table to avoid duplicate alerts
      const { data: existing } = await adminClient
        .from('notifications')
        .select('id')
        .eq('user_id', watcher.user_id)
        .eq('link', targetLink)
        .maybeSingle();

      if (!existing) {
        notificationsToInsert.push({
          user_id: watcher.user_id,
          type: 'anime_update',
          content: `New episode (${latestEp}) of "${airedItem.title || watcher.anime_title}" is now available!`,
          image_url: airedItem.poster || watcher.anime_image,
          link: targetLink,
          is_read: false
        });
      }
    }

    if (notificationsToInsert.length > 0) {
      const { error: insertErr } = await adminClient.from('notifications').insert(notificationsToInsert);
      if (insertErr) {
        console.error('[Oracle:Recent] Error inserting notifications:', insertErr);
      } else {
        console.log(`[Oracle:Recent] Successfully sent ${notificationsToInsert.length} episode alerts!`);
      }
    }

    return { 
      notified: notificationsToInsert.length, 
      checkedRecent: recent.length, 
      watchingUsers: watchingList.length 
    };
  } catch (err: any) {
    console.error('[Oracle:Recent] Error in fast-match engine:', err);
    return { error: err.message || "Fast-match check failed" };
  }
}

/**
 * 2. COMPREHENSIVE MULTI-REALM CHECKER: checkAllLibraryUpdates()
 * -------------------------------------------------------------------------
 * Scans active 'watching' and 'plan_to_watch' anime, donghua, drama, and hindi series
 * across Supabase using the Service Role Admin Client.
 */
export async function checkAllLibraryUpdates() {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    console.error("[Oracle] Supabase admin client is not initialized");
    return { error: "Database connection failed" };
  }

  console.log("[Oracle] Running automated library update check...");

  try {
    const { data: watchlist, error: dbError } = await adminClient
      .from('watchlist')
      .select('user_id, anime_id, anime_title, anime_image, media_type, last_episode_number, total_episodes, status')
      .in('status', ['watching', 'plan_to_watch', 'reading', 'plan_to_read']);

    if (dbError) throw dbError;
    if (!watchlist || watchlist.length === 0) {
      console.log("[Oracle] No active watching items found.");
      return { notified: 0, message: "No active watching items" };
    }

    const items = watchlist as WatchlistItem[];
    const notificationsToInsert: any[] = [];
    const uniqueIds = Array.from(new Set(items.map(i => i.anime_id)));

    for (const id of uniqueIds) {
      const userItems = items.filter(i => i.anime_id === id);
      const sampleItem = userItems[0];
      const mediaType = (sampleItem.media_type || 'anime').toLowerCase();

      let latestEpCount = 0;
      let title = sampleItem.anime_title || id;
      let image = sampleItem.anime_image;
      let targetLink = `/watch/${id}`;
      const isReadingMedia = ['manga', 'manhwa', 'manhua', 'comic', 'webtoon', 'novel', 'light_novel', 'web_novel'].includes(mediaType) || id.startsWith('manga-') || id.startsWith('novel-');

      try {
        if (isReadingMedia) {
          const isNovel = mediaType.includes('novel') || id.startsWith('novel-');
          if (isNovel) {
            const cleanId = id.replace(/^novel-/, '');
            const info = await novelService.getDetails(cleanId);
            if (info) {
              latestEpCount = typeof info.totalChapters === 'number' ? info.totalChapters : (parseFloat(String(info.totalChapters || '1')) || 1);
              title = info.title || title;
              image = info.cover || image;
              targetLink = `/novel/${cleanId}`;
            }
          } else {
            const cleanId = id.replace(/^manga-/, '');
            const info = await mangaService.getDetails(cleanId);
            if (info) {
              latestEpCount = parseFloat(String(info.latestChapter || '0')) || 0;
              title = info.title || title;
              image = info.cover || image;
              targetLink = `/manga/${cleanId}`;
            }
          }
        } else if (mediaType === 'donghua') {
          const info = await dpi.getInfo(id);
          if (info && info.episodes?.episodes) {
            latestEpCount = info.episodes.episodes.length;
            title = info.detail?.title || title;
            image = info.detail?.image || image;
            targetLink = `/donghua-watch/${id}`;
          }
        } else if (mediaType === 'drama') {
          const info = await omni.drama.getDetail(id);
          if (info && info.episodes) {
            latestEpCount = info.episodes.length;
            title = info.title || title;
            image = info.image || image;
            targetLink = `/stream/${id}`;
          }
        } else if (mediaType === 'movie' || mediaType === 'series') {
          const info = await omni.movies.getDetail(id);
          if (info) {
            latestEpCount = info.seasons?.reduce((acc: number, s: any) => acc + (s.episodes?.length || 0), 0) || 1;
            title = info.title || title;
            image = info.image || image;
            targetLink = `/stream/${id}${mediaType === 'movie' ? '?type=movie' : ''}`;
          }
        } else if (mediaType === 'hindi') {
          const info = await hpi.hindi.getDetails(id);
          if (info && info.episodes) {
            latestEpCount = info.episodes.length;
            title = info.title || title;
            image = info.image || image;
            targetLink = `/watch/${id}?audio=hi`;
          }
        } else {
          const info = await AnimeService.getAnimeInfo(id);
          if (info && info.episodes) {
            latestEpCount = info.episodes.length;
            title = info.title || title;
            image = info.poster || image;
            targetLink = `/watch/${id}`;
          }
        }
      } catch (err) {
        console.error(`[Oracle] Error checking updates for ${id} (${mediaType}):`, err);
        continue;
      }

      if (latestEpCount > 0) {
        for (const userItem of userItems) {
          const userWatchedEp = Number(userItem.last_episode_number) || 0;

          // If user already watched this episode or further, don't alert
          if (userWatchedEp >= latestEpCount) continue;

          const unitLabel = isReadingMedia ? 'chapter' : 'episode';
          const epLink = isReadingMedia ? targetLink : `${targetLink}?ep=${latestEpCount}`;
          
          // Avoid inserting duplicate notification
          const { data: existing } = await adminClient
            .from('notifications')
            .select('id')
            .eq('user_id', userItem.user_id)
            .eq('link', epLink)
            .maybeSingle();

          if (!existing) {
            notificationsToInsert.push({
              user_id: userItem.user_id,
              type: isReadingMedia ? 'manga_update' : 'anime_update',
              content: `New ${unitLabel} (${latestEpCount}) of "${title}" is now available!`,
              image_url: image,
              link: epLink,
              is_read: false
            });
          }
        }
      }
    }

    if (notificationsToInsert.length > 0) {
      await adminClient.from('notifications').insert(notificationsToInsert);
      console.log(`[Oracle] Successfully sent ${notificationsToInsert.length} notifications!`);
    }

    return { notified: notificationsToInsert.length, checkedItems: uniqueIds.length };
  } catch (e: any) {
    console.error("[Oracle] Check Error:", e);
    return { error: e.message || "Failed to check notifications" };
  }
}
