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
    case 'watching':
    case 'reading':
      return 'CURRENT';
    case 'completed':
      return 'COMPLETED';
    case 'plan_to_watch':
    case 'plan_to_read':
      return 'PLANNING';
    case 'on_hold':
      return 'PAUSED';
    case 'dropped':
      return 'DROPPED';
    default:
      return 'CURRENT';
  }
}

function mapToShadowGardenStatus(anilistStatus: string, mediaType: 'anime' | 'manga'): string {
  switch (anilistStatus) {
    case 'CURRENT':
    case 'REPEATING':
      return mediaType === 'manga' ? 'reading' : 'watching';
    case 'COMPLETED':
      return 'completed';
    case 'PAUSED':
      return 'on_hold';
    case 'DROPPED':
      return 'dropped';
    case 'PLANNING':
    default:
      return mediaType === 'manga' ? 'plan_to_read' : 'plan_to_watch';
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

async function resolveAniListMedia(title: string, animeId?: string, type: 'ANIME' | 'MANGA' = 'ANIME') {
  const numericId = parseInt(animeId || '', 10);
  if (!isNaN(numericId) && numericId > 0 && String(numericId) === animeId) {
    const byIdQuery = `
      query ($id: Int, $type: MediaType) {
        Media(id: $id, type: $type) {
          id
          title { english romaji native userPreferred }
          coverImage { extraLarge large medium }
          bannerImage
          format
          status
          episodes
          chapters
          averageScore
        }
      }
    `;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: byIdQuery, variables: { id: numericId, type } }),
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
    query ($search: String, $type: MediaType) {
      Media(search: $search, type: $type) {
        id
        title { english romaji native userPreferred }
        coverImage { extraLarge large medium }
        bannerImage
        format
        status
        episodes
        chapters
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
        body: JSON.stringify({ query: searchQuery, variables: { search: candidate, type } }),
      });
      const data = await res.json();
      if (data?.data?.Media) return data.data.Media;
    } catch {}
  }
  return null;
}

async function fetchAniListLists(username: string, type: 'ANIME' | 'MANGA') {
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
              title { english romaji userPreferred }
              coverImage { extraLarge large medium }
              bannerImage
              format
              status
              episodes
              chapters
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
    body: JSON.stringify({ query, variables: { userName: username, type } }),
  });

  const json = await res.json();
  if (json.errors) {
    console.warn(`AniList ${type} query notice:`, json.errors[0]?.message);
    return [];
  }
  return json?.data?.MediaListCollection?.lists || [];
}

export async function POST(req: Request) {
  try {
    const { action, userId, username, token, deletedMediaIds = [], targetMediaType } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Resolve credentials from profile settings if not in payload
    let anilistToken = token;
    let anilistUsername = username;

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

    if (!anilistUsername) {
      anilistUsername = 'codeacezero';
    }

    const typesToSync: ('ANIME' | 'MANGA')[] = targetMediaType === 'manga' 
      ? ['MANGA'] 
      : targetMediaType === 'anime' 
        ? ['ANIME'] 
        : ['ANIME', 'MANGA'];

    // ─── ACTION: PULL ───────────────────────────────────────────────────────────
    if (action === 'pull') {
      let importedCount = 0;
      let totalFound = 0;

      for (const mType of typesToSync) {
        const lists = await fetchAniListLists(anilistUsername, mType);
        const sgMediaType = mType === 'MANGA' ? 'manga' : 'anime';

        for (const list of lists) {
          for (const entry of list.entries || []) {
            totalFound++;
            const media = entry.media;
            const animeId = String(media.id);
            const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || 'Unknown Title';
            const poster = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium;
            const sgStatus = mapToShadowGardenStatus(entry.status, sgMediaType);

            const payload: any = {
              user_id: userId,
              anime_id: animeId,
              anime_title: title,
              anime_image: poster,
              banner_image: media.bannerImage || null,
              status: sgStatus,
              last_episode_number: entry.progress || 0,
              score: entry.score || (media.averageScore ? Math.round(media.averageScore / 10) : null),
              media_type: sgMediaType,
              updated_at: new Date(entry.updatedAt ? entry.updatedAt * 1000 : Date.now()).toISOString(),
            };

            payload.total_episodes = (sgMediaType === 'manga' ? media.chapters : media.episodes) || null;

            const { error } = await supabaseAdmin.from('watchlist').upsert(payload, {
              onConflict: 'user_id,anime_id',
            });

            if (!error) importedCount++;
          }
        }
      }

      return NextResponse.json({
        success: true,
        action: 'pull',
        totalFound,
        importedCount,
      });
    }

    // ─── ACTION: OVERRIDE SUPABASE (Wipe and Pull Fresh) ──────────────────────
    if (action === 'override_supabase') {
      for (const mType of typesToSync) {
        const sgMediaType = mType === 'MANGA' ? 'manga' : 'anime';
        // Remove existing items of this media type
        await supabaseAdmin
          .from('watchlist')
          .delete()
          .eq('user_id', userId)
          .eq('media_type', sgMediaType);
      }

      // Re-populate from AniList
      let importedCount = 0;
      for (const mType of typesToSync) {
        const lists = await fetchAniListLists(anilistUsername, mType);
        const sgMediaType = mType === 'MANGA' ? 'manga' : 'anime';

        for (const list of lists) {
          for (const entry of list.entries || []) {
            const media = entry.media;
            const animeId = String(media.id);
            const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || 'Unknown Title';
            const poster = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium;
            const sgStatus = mapToShadowGardenStatus(entry.status, sgMediaType);

            const payload: any = {
              user_id: userId,
              anime_id: animeId,
              anime_title: title,
              anime_image: poster,
              banner_image: media.bannerImage || null,
              status: sgStatus,
              last_episode_number: entry.progress || 0,
              score: entry.score || (media.averageScore ? Math.round(media.averageScore / 10) : null),
              media_type: sgMediaType,
              updated_at: new Date(entry.updatedAt ? entry.updatedAt * 1000 : Date.now()).toISOString(),
            };

            payload.total_episodes = (sgMediaType === 'manga' ? media.chapters : media.episodes) || null;

            const { error } = await supabaseAdmin.from('watchlist').upsert(payload, {
              onConflict: 'user_id,anime_id',
            });
            if (!error) importedCount++;
          }
        }
      }

      return NextResponse.json({
        success: true,
        action: 'override_supabase',
        importedCount,
      });
    }

    // ─── ACTION: PUSH / OVERRIDE ANILIST ─────────────────────────────────────
    if (action === 'push' || action === 'override_anilist') {
      if (!anilistToken) {
        return NextResponse.json({
          error: 'AniList OAuth authorization is required to push changes. Bind your AniList account first.',
          requiresAuth: true
        }, { status: 401 });
      }

      const { data: items, error: fetchErr } = await supabaseAdmin
        .from('watchlist')
        .select('*')
        .eq('user_id', userId);

      if (fetchErr || !items) {
        return NextResponse.json({ error: fetchErr?.message || 'Failed to fetch library' }, { status: 500 });
      }

      // If override_anilist, delete entries on AniList that are not in Supabase
      if (action === 'override_anilist') {
        const supabaseIds = new Set(items.map(i => String(i.anime_id)));
        for (const mType of typesToSync) {
          const lists = await fetchAniListLists(anilistUsername, mType);
          for (const list of lists) {
            for (const entry of list.entries || []) {
              if (!supabaseIds.has(String(entry.mediaId))) {
                try {
                  await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${anilistToken}`,
                    },
                    body: JSON.stringify({
                      query: `mutation ($id: Int) { DeleteMediaListEntry (id: $id) { deleted } }`,
                      variables: { id: entry.id }
                    })
                  });
                } catch {}
              }
            }
          }
        }
      }

      // Push all local items to AniList
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
      for (const item of items) {
        const isManga = item.media_type === 'manga' || item.media_type === 'manhwa' || item.media_type === 'manhua';
        const targetType = isManga ? 'MANGA' : 'ANIME';

        if (targetMediaType && targetMediaType !== (isManga ? 'manga' : 'anime')) {
          continue;
        }

        try {
          const media = await resolveAniListMedia(item.anime_title, item.anime_id, targetType);
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
                  progress: item.last_episode_number || item.chapters_read || 0,
                  score: item.score ? Number(item.score) : undefined,
                }
              })
            });
            pushedCount++;
            await new Promise(r => setTimeout(r, 200));
          }
        } catch {}
      }

      return NextResponse.json({
        success: true,
        action,
        pushedCount,
      });
    }

    // ─── ACTION: TWO-WAY (Smart Merge + Deletions Sync) ────────────────────────
    if (action === 'two-way') {
      const { data: supabaseItems } = await supabaseAdmin
        .from('watchlist')
        .select('*')
        .eq('user_id', userId);

      const supabaseMap = new Map<string, any>();
      (supabaseItems || []).forEach(item => {
        supabaseMap.set(String(item.anime_id), item);
      });

      let pulledCount = 0;
      let pushedCount = 0;
      let deletedOnAniListCount = 0;
      let deletedOnSupabaseCount = 0;

      // 1. Process deletions requested from Shadow Garden
      if (anilistToken && deletedMediaIds.length > 0) {
        for (const delId of deletedMediaIds) {
          try {
            // Find entry ID on AniList to delete
            for (const mType of typesToSync) {
              const lists = await fetchAniListLists(anilistUsername, mType);
              for (const list of lists) {
                const found = (list.entries || []).find((e: any) => String(e.mediaId) === String(delId) || String(e.id) === String(delId));
                if (found) {
                  await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${anilistToken}`,
                    },
                    body: JSON.stringify({
                      query: `mutation ($id: Int) { DeleteMediaListEntry (id: $id) { deleted } }`,
                      variables: { id: found.id }
                    })
                  });
                  deletedOnAniListCount++;
                }
              }
            }
          } catch {}
        }
      }

      // 2. Fetch both Anime and Manga from AniList
      const anilistEntriesMap = new Map<string, any>();

      for (const mType of typesToSync) {
        const lists = await fetchAniListLists(anilistUsername, mType);
        const sgMediaType = mType === 'MANGA' ? 'manga' : 'anime';

        for (const list of lists) {
          for (const entry of list.entries || []) {
            const media = entry.media;
            const animeId = String(media.id);
            anilistEntriesMap.set(animeId, { entry, media, sgMediaType });

            const existingSupabase = supabaseMap.get(animeId);

            if (!existingSupabase) {
              // Item exists on AniList but not in Supabase -> Pull
              const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || 'Unknown Title';
              const poster = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium;
              const sgStatus = mapToShadowGardenStatus(entry.status, sgMediaType);

              const payload: any = {
                user_id: userId,
                anime_id: animeId,
                anime_title: title,
                anime_image: poster,
                banner_image: media.bannerImage || null,
                status: sgStatus,
                last_episode_number: entry.progress || 0,
                score: entry.score || (media.averageScore ? Math.round(media.averageScore / 10) : null),
                media_type: sgMediaType,
                updated_at: new Date(entry.updatedAt ? entry.updatedAt * 1000 : Date.now()).toISOString(),
              };

              payload.total_episodes = (sgMediaType === 'manga' ? media.chapters : media.episodes) || null;

              await supabaseAdmin.from('watchlist').upsert(payload, { onConflict: 'user_id,anime_id' });
              pulledCount++;
            } else {
              // Both have the item -> compare updatedAt timestamps
              const anilistTime = (entry.updatedAt || 0) * 1000;
              const supabaseTime = new Date(existingSupabase.updated_at || 0).getTime();

              if (anilistTime > supabaseTime) {
                // AniList is newer -> Pull to Supabase
                const sgStatus = mapToShadowGardenStatus(entry.status, sgMediaType);
                await supabaseAdmin.from('watchlist').update({
                  status: sgStatus,
                  last_episode_number: entry.progress || 0,
                  score: entry.score || existingSupabase.score,
                  updated_at: new Date(anilistTime).toISOString(),
                }).eq('user_id', userId).eq('anime_id', animeId);
                pulledCount++;
              } else if (supabaseTime > anilistTime && anilistToken) {
                // Supabase is newer -> Push to AniList
                try {
                  const mutation = `
                    mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int, $score: Float) {
                      SaveMediaListEntry (mediaId: $mediaId, status: $status, progress: $progress, score: $score) {
                        id
                      }
                    }
                  `;
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
                        status: mapToAniListStatus(existingSupabase.status),
                        progress: existingSupabase.last_episode_number || existingSupabase.chapters_read || 0,
                        score: existingSupabase.score ? Number(existingSupabase.score) : undefined,
                      }
                    })
                  });
                  pushedCount++;
                } catch {}
              }
            }
          }
        }
      }

      // 3. Check for items that exist in Supabase with numeric AniList IDs but are MISSING on AniList (removed on AniList)
      for (const [animeId, supItem] of supabaseMap.entries()) {
        const isNumeric = /^\d+$/.test(animeId);
        if (isNumeric && !anilistEntriesMap.has(animeId)) {
          // Deleted on AniList -> remove from Supabase
          await supabaseAdmin
            .from('watchlist')
            .delete()
            .eq('user_id', userId)
            .eq('anime_id', animeId);
          deletedOnSupabaseCount++;
        } else if (!isNumeric && anilistToken) {
          // Local title not yet on AniList -> Push to AniList
          try {
            const isManga = supItem.media_type === 'manga' || supItem.media_type === 'manhwa';
            const media = await resolveAniListMedia(supItem.anime_title, supItem.anime_id, isManga ? 'MANGA' : 'ANIME');
            if (media?.id && !anilistEntriesMap.has(String(media.id))) {
              const mutation = `
                mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int, $score: Float) {
                  SaveMediaListEntry (mediaId: $mediaId, status: $status, progress: $progress, score: $score) {
                    id
                  }
                }
              `;
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
                    status: mapToAniListStatus(supItem.status),
                    progress: supItem.last_episode_number || supItem.chapters_read || 0,
                    score: supItem.score ? Number(supItem.score) : undefined,
                  }
                })
              });
              pushedCount++;
            }
          } catch {}
        }
      }

      return NextResponse.json({
        success: true,
        action: 'two-way',
        pulledCount,
        pushedCount,
        deletedOnAniListCount,
        deletedOnSupabaseCount,
        hasPushToken: !!anilistToken,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('AniList Sync Error:', err);
    return NextResponse.json({ error: err.message || 'Internal sync error' }, { status: 500 });
  }
}
