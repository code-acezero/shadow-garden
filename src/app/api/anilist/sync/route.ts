// src/app/api/anilist/sync/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function mapToAniListStatus(sgStatus: string): string {
  switch (sgStatus) {
    case 'watching': return 'CURRENT';
    case 'completed': return 'COMPLETED';
    case 'plan_to_watch': return 'PLANNING';
    case 'on_hold': return 'PAUSED';
    case 'dropped': return 'DROPPED';
    default: return 'CURRENT';
  }
}

function mapToShadowGardenStatus(anilistStatus: string): string {
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

function cleanAnimeTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/-[a-f0-9]{4,6}$/i, '')
    .replace(/season\s+(\d+)/i, 'Season $1')
    .replace(/2nd Season/i, 'Season 2')
    .replace(/3rd Season/i, 'Season 3')
    .replace(/4th Season/i, 'Season 4')
    .replace(/\s*\(TV\)/gi, '')
    .replace(/\s*\(Dub\)/gi, '')
    .replace(/\s*\(Sub\)/gi, '')
    .trim();
}

async function resolveAniListMedia(title: string, animeId?: string) {
  const numericId = parseInt(animeId || '', 10);
  if (!isNaN(numericId) && numericId > 0 && String(numericId) === animeId) {
    const byIdQuery = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title { english romaji native userPreferred }
          coverImage { extraLarge large medium }
          bannerImage
          format
          status
          episodes
          averageScore
        }
      }
    `;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: byIdQuery, variables: { id: numericId } }),
    });
    const data = await res.json();
    if (data?.data?.Media) return data.data.Media;
  }

  const cleaned = cleanAnimeTitle(title);
  const searchCandidates = [cleaned, title];
  if (title.toLowerCase().includes('war of the three')) {
    searchCandidates.unshift('Tokyo Revengers: War of the Three Titans Arc');
  }

  const searchQuery = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        title { english romaji native userPreferred }
        coverImage { extraLarge large medium }
        bannerImage
        format
        status
        episodes
        averageScore
      }
    }
  `;

  for (const candidate of searchCandidates) {
    if (!candidate || candidate.length < 2) continue;
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, variables: { search: candidate } }),
      });
      const data = await res.json();
      if (data?.data?.Media) return data.data.Media;
    } catch {}
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { action, userId, username, token } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Try resolving token from profile settings if not provided in payload
    let anilistToken = token;
    let anilistUsername = username;

    if (!anilistToken || !anilistUsername) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('settings')
        .eq('id', userId)
        .single();

      if (profile?.settings) {
        if (!anilistToken && profile.settings.anilist_token) {
          anilistToken = profile.settings.anilist_token;
        }
        if (!anilistUsername && profile.settings.anilist_username) {
          anilistUsername = profile.settings.anilist_username;
        }
      }
    }

    if (!anilistUsername) {
      anilistUsername = 'codeacezero';
    }

    // --- ACTION: PULL ---
    if (action === 'pull') {
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
                  title { english romaji userPreferred }
                  coverImage { extraLarge large medium }
                  bannerImage
                  status
                  episodes
                  averageScore
                }
              }
            }
          }
        }
      `;

      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { userName: anilistUsername } }),
      });

      const json = await res.json();
      if (json.errors) {
        return NextResponse.json({ error: json.errors[0]?.message || 'Failed to fetch AniList data' }, { status: 400 });
      }

      const lists = json?.data?.MediaListCollection?.lists || [];
      let importedCount = 0;
      let totalFound = 0;

      for (const list of lists) {
        for (const entry of list.entries) {
          totalFound++;
          const media = entry.media;
          const animeId = String(media.id);
          const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || 'Unknown Title';
          const poster = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium;
          const sgStatus = mapToShadowGardenStatus(entry.status);

          const { error } = await supabaseAdmin.from('watchlist').upsert({
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
          }, { onConflict: 'user_id,anime_id' });

          if (!error) importedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        action: 'pull',
        totalFound,
        importedCount,
      });
    }

    // --- ACTION: PUSH ---
    if (action === 'push') {
      if (!anilistToken) {
        return NextResponse.json({
          error: 'AniList OAuth token is required to push changes. Connect your AniList account first.',
          requiresAuth: true
        }, { status: 401 });
      }

      const { data: items, error: fetchErr } = await supabaseAdmin
        .from('watchlist')
        .select('*')
        .eq('user_id', userId);

      if (fetchErr || !items) {
        return NextResponse.json({ error: fetchErr?.message || 'Failed to fetch watchlist' }, { status: 500 });
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
      let failedCount = 0;
      const details: any[] = [];

      for (const item of items) {
        try {
          const media = await resolveAniListMedia(item.anime_title, item.anime_id);
          if (!media || !media.id) {
            failedCount++;
            details.push({ title: item.anime_title, status: 'unresolved' });
            continue;
          }

          const anilistStatus = mapToAniListStatus(item.status);
          const progress = item.last_episode_number || 0;
          const score = item.score ? Number(item.score) : undefined;

          const res = await fetch('https://graphql.anilist.co', {
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

          const resData = await res.json();
          if (resData?.data?.SaveMediaListEntry) {
            pushedCount++;
            details.push({ title: item.anime_title, mediaId: media.id, status: 'pushed', progress });
          } else {
            failedCount++;
            details.push({ title: item.anime_title, status: 'error', reason: resData.errors?.[0]?.message });
          }

          // Delay slightly between requests
          await new Promise(r => setTimeout(r, 200));
        } catch (e: any) {
          failedCount++;
          details.push({ title: item.anime_title, status: 'exception', reason: e.message });
        }
      }

      return NextResponse.json({
        success: true,
        action: 'push',
        totalItems: items.length,
        pushedCount,
        failedCount,
        details,
      });
    }

    // --- ACTION: TWO-WAY ---
    if (action === 'two-way') {
      // 1. Pull first
      let pulledCount = 0;
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
                  title { english romaji userPreferred }
                  coverImage { extraLarge large medium }
                  bannerImage
                  status
                  episodes
                  averageScore
                }
              }
            }
          }
        }
      `;

      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { userName: anilistUsername } }),
      });

      const json = await res.json();
      const lists = json?.data?.MediaListCollection?.lists || [];

      for (const list of lists) {
        for (const entry of list.entries) {
          const media = entry.media;
          const animeId = String(media.id);
          const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || 'Unknown Title';
          const poster = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium;
          const sgStatus = mapToShadowGardenStatus(entry.status);

          const { error } = await supabaseAdmin.from('watchlist').upsert({
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
          }, { onConflict: 'user_id,anime_id' });

          if (!error) pulledCount++;
        }
      }

      // 2. If token present, push as well
      let pushedCount = 0;
      if (anilistToken) {
        const { data: items } = await supabaseAdmin.from('watchlist').select('*').eq('user_id', userId);
        if (items) {
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

          for (const item of items) {
            try {
              const media = await resolveAniListMedia(item.anime_title, item.anime_id);
              if (media?.id) {
                await fetch('https://graphql.anilist.co', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${anilistToken}`,
                  },
                  body: JSON.stringify({
                    query: mutation,
                    variables: {
                      mediaId: media.id,
                      status: mapToAniListStatus(item.status),
                      progress: item.last_episode_number || 0,
                      score: item.score ? Number(item.score) : undefined,
                    }
                  })
                });
                pushedCount++;
                await new Promise(r => setTimeout(r, 200));
              }
            } catch {}
          }
        }
      }

      return NextResponse.json({
        success: true,
        action: 'two-way',
        pulledCount,
        pushedCount,
        hasPushToken: !!anilistToken,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('AniList Sync Error:', err);
    return NextResponse.json({ error: err.message || 'Internal sync error' }, { status: 500 });
  }
}
