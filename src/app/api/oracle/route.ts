import { NextResponse } from 'next/server';
import { supabase } from '@/lib/api';

// Define the shape of the user data to prevent 'never' type errors
interface WatchlistUser {
  user_id: string;
  progress: number;
}

async function checkAnimeUpdates() {
  // FIX: Guard clause to ensure supabase is initialized
  if (!supabase) {
    console.error("Supabase client is not initialized");
    return { error: "Database connection failed" };
  }

  try {
    // 1. Get all unique anime IDs from everyone's 'watching' list
    const animeIdToCheck = 'solo-leveling'; 
    
    // 2. Fetch latest data from Consumet
    const response = await fetch(`https://api.consumet.org/anime/gogoanime/info/${animeIdToCheck}`);
    
    if (!response.ok) return { notified: 0, status: "Anime API unavailable" };
    
    const animeData = await response.json();
    
    if (!animeData.episodes) return { notified: 0 };
    const latestEpNumber = animeData.episodes.length;

    // 3. Find users watching this anime who are BEHIND
    const { data, error: dbError } = await supabase
        .from('watchlist')
        .select('user_id, progress')
        .eq('anime_id', animeIdToCheck)
        .lt('progress', latestEpNumber);

    if (dbError) throw dbError;
    
    // Explicitly cast to our interface to avoid 'never'
    const usersToNotify = data as WatchlistUser[] | null;

    if (!usersToNotify || usersToNotify.length === 0) return { notified: 0 };

    // 4. Batch Prepare Notifications
    const notifications = usersToNotify.map((u) => ({
        user_id: u.user_id,
        type: 'anime_update',
        content: `Episode ${latestEpNumber} of ${animeData.title} is now available!`,
        image_url: animeData.image,
        link: `/watch/${animeData.id}-episode-${latestEpNumber}`,
        is_read: false
    }));

    if (notifications.length > 0) {
        // ✅ FIX: Cast the .from() or the .insert() to 'any' to bypass the Postgrest 'never' overload error
        await (supabase.from('notifications') as any).insert(notifications);
        return { notified: notifications.length };
    }
    
    return { notified: 0 };

  } catch (e) {
    console.error("Oracle Error:", e);
    return { error: "Failed to consult the stars" };
  }
}

export async function GET() {
  const result = await checkAnimeUpdates();
  return NextResponse.json({ status: 'Oracle Check Complete', result });
}