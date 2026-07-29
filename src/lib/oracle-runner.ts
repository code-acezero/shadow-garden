import { supabase } from '@/lib/supabase';
import { AnimeService } from '@/lib/api';
import { dpi } from '@/lib/dpi';
import { omni } from '@/lib/omni';
import { hpi } from '@/lib/hpi';

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

export async function checkAllLibraryUpdates() {
  if (!supabase) {
    console.error("[Oracle] Supabase client is not initialized");
    return { error: "Database connection failed" };
  }

  console.log("[Oracle] Running automated library update check...");

  try {
    const { data: watchlist, error: dbError } = await supabase
      .from('watchlist')
      .select('user_id, anime_id, anime_title, anime_image, media_type, last_episode_number, total_episodes, status');

    if (dbError) throw dbError;
    if (!watchlist || watchlist.length === 0) {
      console.log("[Oracle] No tracked items found.");
      return { notified: 0, message: "No tracked items" };
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

      try {
        if (mediaType === 'donghua') {
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
            targetLink = `/drama-watch/${id}`;
          }
        } else if (mediaType === 'movie' || mediaType === 'series') {
          const info = await omni.movies.getDetail(id);
          if (info) {
            latestEpCount = info.seasons?.reduce((acc: number, s: any) => acc + (s.episodes?.length || 0), 0) || 1;
            title = info.title || title;
            image = info.image || image;
            targetLink = `/movies-watch/${id}`;
          }
        } else if (mediaType === 'hindi') {
          const info = await hpi.hindi.getDetails(id);
          if (info && info.episodes) {
            latestEpCount = info.episodes.length;
            title = info.title || title;
            image = info.image || image;
            targetLink = `/hindi-watch/${id}`;
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
          const storedTotal = Number(userItem.total_episodes) || 0;
          
          // If storedTotal is 0 or uninitialized, update DB so future comparisons are accurate
          if (storedTotal === 0 && latestEpCount > 0) {
            await supabase
              .from('watchlist')
              .update({ total_episodes: latestEpCount })
              .eq('user_id', userItem.user_id)
              .eq('anime_id', userItem.anime_id);
            continue;
          }

          // If there's a genuinely new episode available
          if (latestEpCount > storedTotal) {
            const epLink = `${targetLink}?ep=${latestEpCount}`;
            
            // Avoid inserting duplicate notification
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', userItem.user_id)
              .eq('link', epLink)
              .maybeSingle();

            if (!existing) {
              notificationsToInsert.push({
                user_id: userItem.user_id,
                type: 'EPISODE_ALERT',
                content: `New episode (${latestEpCount}) of "${title}" is now available!`,
                image_url: image,
                link: epLink,
                is_read: false
              });

              // Update stored total_episodes in watchlist
              await supabase
                .from('watchlist')
                .update({ total_episodes: latestEpCount })
                .eq('user_id', userItem.user_id)
                .eq('anime_id', userItem.anime_id);
            }
          }
        }
      }
    }

    if (notificationsToInsert.length > 0) {
      await (supabase.from('notifications') as any).insert(notificationsToInsert);
      console.log(`[Oracle] Successfully sent ${notificationsToInsert.length} notifications!`);
    }

    return { notified: notificationsToInsert.length, checkedItems: uniqueIds.length };
  } catch (e: any) {
    console.error("[Oracle] Check Error:", e);
    return { error: e.message || "Failed to check notifications" };
  }
}

