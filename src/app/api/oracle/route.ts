import { NextResponse } from 'next/server';
import { supabase } from '@/lib/api';

async function checkAnimeUpdates() {
  // FIX: Guard clause to ensure supabase is initialized
  if (!supabase) {
    console.error("Supabase client is not initialized");
    return { error: "Database connection failed" };
  }

  try {
    // 1. Get all unique anime IDs from everyone's 'watching' list
    // (Simplified for performance: Just checking one popular show for demonstration logic)
    const animeIdToCheck = 'solo-leveling'; 
    
    // 2. Fetch latest data from Consumet (Simulated fetch here)
    // Note: In production, ensure this API endpoint is valid and rate-limited
    const response = await fetch(`https://api.consumet.org/anime/gogoanime/info/${animeIdToCheck}`);
    
    // Handle API failure gracefully
    if (!response.ok) return { notified: 0, status: "Anime API unavailable" };
    
    const animeData = await response.json();
    
    if (!animeData.episodes) return { notified: 0 };
    const latestEpNumber = animeData.episodes.length;

    // 3. Find users watching this anime who are BEHIND
    const { data: usersToNotify, error: dbError } = await supabase
        .from('watchlist')
        .select('user_id, progress')
        .eq('anime_id', animeIdToCheck)
        .lt('progress', latestEpNumber); // Progress < Latest

    if (dbError) throw dbError;
    if (!usersToNotify || usersToNotify.length === 0) return { notified: 0 };

    // 4. Batch Insert Notifications
    const notifications = usersToNotify.map(u => ({
        user_id: u.user_id,
        type: 'anime_update',
        content: `Episode ${latestEpNumber} of ${animeData.title} is now available!`,
        image_url: animeData.image,
        link: `/watch/${animeData.id}-episode-${latestEpNumber}`,
        is_read: false
    }));

    if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
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