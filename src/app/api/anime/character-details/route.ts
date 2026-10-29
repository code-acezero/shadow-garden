import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';
const TMDB_API_KEY = '1cf50e6248dc270629e802686245c2c8';
const TMDB_BASE = 'https://api.themoviedb.org/3';

// In-memory cache for character & staff dossiers (30 mins TTL)
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

const CHARACTER_QUERY = `
query ($id: Int, $search: String) {
  Character(id: $id, search: $search) {
    id
    name {
      full
      native
      alternative
    }
    image {
      large
      medium
    }
    description(asHtml: false)
    gender
    dateOfBirth {
      year
      month
      day
    }
    age
    bloodType
    favourites
    siteUrl
    media(type: ANIME, sort: POPULARITY_DESC, perPage: 12) {
      edges {
        characterRole
        node {
          id
          title {
            english
            romaji
            native
          }
          coverImage {
            large
            medium
          }
          format
          startDate {
            year
          }
        }
      }
    }
  }
}
`;

const STAFF_QUERY = `
query ($id: Int, $search: String) {
  Staff(id: $id, search: $search) {
    id
    name {
      full
      native
      alternative
    }
    languageV2
    image {
      large
      medium
    }
    description(asHtml: false)
    gender
    dateOfBirth {
      year
      month
      day
    }
    age
    yearsActive
    homeTown
    bloodType
    favourites
    primaryOccupations
    siteUrl
    characters(sort: FAVOURITES_DESC, perPage: 12) {
      edges {
        role
        node {
          id
          name {
            full
            native
            alternative
          }
          image {
            medium
            large
          }
          description(asHtml: false)
          gender
          dateOfBirth {
            year
            month
            day
          }
          age
          bloodType
          favourites
        }
        media {
          id
          title {
            english
            romaji
            native
          }
          coverImage {
            large
            medium
          }
          format
          startDate {
            year
          }
        }
      }
    }
  }
}
`;

async function fetchAniListGql(query: string, variables: Record<string, any>) {
  try {
    const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ShadowGarden/2.0 (Anime Character Dossier)',
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(9000),
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json().catch(() => null);
    return json?.data || null;
  } catch (err) {
    return null;
  }
}

async function fetchTmdbPerson(staffId?: string | number, staffName?: string | null) {
  try {
    let personId = staffId && !isNaN(Number(staffId)) ? Number(staffId) : null;

    if (!personId && staffName) {
      const searchRes = await fetch(
        `${TMDB_BASE}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(staffName)}`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (searchRes.ok) {
        const searchJson = await searchRes.json().catch(() => null);
        personId = searchJson?.results?.[0]?.id || null;
      }
    }

    if (!personId) return null;

    const detailRes = await fetch(
      `${TMDB_BASE}/person/${personId}?api_key=${TMDB_API_KEY}&append_to_response=combined_credits`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!detailRes.ok) return null;
    const detail = await detailRes.json().catch(() => null);
    if (!detail) return null;

    const rawCredits: any[] = detail.combined_credits?.cast || [];
    const sortedCredits = rawCredits
      .filter((c: any) => c.poster_path && (c.title || c.name))
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 16);

    const bday = detail.birthday;
    const bdayParts = bday ? bday.split('-').map(Number) : [];

    const staffObj = {
      id: detail.id,
      name: {
        full: detail.name || 'Cast Member',
        native: null
      },
      languageV2: detail.known_for_department || 'Acting',
      image: {
        large: detail.profile_path ? `https://image.tmdb.org/t/p/w500${detail.profile_path}` : null,
        medium: detail.profile_path ? `https://image.tmdb.org/t/p/w185${detail.profile_path}` : null
      },
      description: detail.biography || null,
      gender: detail.gender === 1 ? 'Female' : (detail.gender === 2 ? 'Male' : null),
      dateOfBirth: bdayParts.length === 3 ? {
        year: bdayParts[0],
        month: bdayParts[1],
        day: bdayParts[2]
      } : null,
      age: bdayParts[0] ? new Date().getFullYear() - bdayParts[0] : null,
      homeTown: detail.place_of_birth || null,
      favourites: detail.popularity ? Math.round(detail.popularity * 100) : null,
      primaryOccupations: [detail.known_for_department || 'Acting'],
      siteUrl: detail.imdb_id ? `https://www.imdb.com/name/${detail.imdb_id}` : null,
      isLiveAction: true,
      characters: {
        edges: sortedCredits.map((c: any) => {
          const charName = c.character || 'Cast Member';
          const titleStr = c.title || c.name || 'Title';
          const isMovie = c.media_type === 'movie';
          const posterLarge = c.poster_path ? `https://image.tmdb.org/t/p/w500${c.poster_path}` : null;
          const posterMed = c.poster_path ? `https://image.tmdb.org/t/p/w185${c.poster_path}` : null;
          const yr = (c.release_date || c.first_air_date || '').split('-')[0];

          return {
            role: charName,
            mediaType: isMovie ? 'movie' : 'drama',
            node: {
              id: c.id,
              name: { full: charName },
              image: { large: posterLarge, medium: posterMed }
            },
            media: [
              {
                id: c.id,
                title: { english: titleStr, romaji: titleStr },
                coverImage: { large: posterLarge, medium: posterMed },
                format: isMovie ? 'MOVIE' : 'TV',
                mediaType: isMovie ? 'movie' : 'drama',
                startDate: { year: yr ? parseInt(yr) : null }
              }
            ]
          };
        })
      }
    };

    return staffObj;
  } catch (err) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const characterId = searchParams.get('characterId');
    const characterName = searchParams.get('characterName');
    const staffId = searchParams.get('staffId');
    const staffName = searchParams.get('staffName');
    const mediaType = searchParams.get('mediaType'); // 'anime' | 'movie' | 'drama'

    const cacheKey = `${characterId || ''}_${characterName || ''}_${staffId || ''}_${staffName || ''}_${mediaType || ''}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && now < cached.expires) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    const isLiveAction = mediaType === 'movie' || mediaType === 'drama';

    let charData: any = null;
    let staffData: any = null;

    if (!isLiveAction) {
      const charIdNum = characterId && !isNaN(Number(characterId)) ? Number(characterId) : undefined;
      const charVars = charIdNum ? { id: charIdNum } : (characterName ? { search: characterName } : null);

      const staffIdNum = staffId && !isNaN(Number(staffId)) ? Number(staffId) : undefined;
      const staffVars = staffIdNum ? { id: staffIdNum } : (staffName ? { search: staffName } : null);

      const [anilistChar, anilistStaff] = await Promise.all([
        charVars ? fetchAniListGql(CHARACTER_QUERY, charVars) : Promise.resolve(null),
        staffVars ? fetchAniListGql(STAFF_QUERY, staffVars) : Promise.resolve(null)
      ]);

      charData = anilistChar?.Character || null;
      staffData = anilistStaff?.Staff || null;
    }

    // Fallback to TMDB for movie/drama actors or if AniList returned nothing for staff
    if (!staffData && (isLiveAction || !charData) && (staffId || staffName)) {
      const tmdbPerson = await fetchTmdbPerson(staffId || undefined, staffName || undefined);
      if (tmdbPerson) {
        staffData = tmdbPerson;
      }
    }

    // If character is still null but we have characterName and TMDB staff with credits
    if (!charData && characterName && staffData?.characters?.edges?.length > 0) {
      const matchingCredit = staffData.characters.edges.find((e: any) => 
        e.node?.name?.full?.toLowerCase() === characterName.toLowerCase()
      ) || staffData.characters.edges[0];

      if (matchingCredit) {
        const mediaNodes = matchingCredit.media || [];
        charData = {
          id: matchingCredit.node.id,
          name: { full: characterName },
          image: matchingCredit.node.image,
          description: `Character portrayed by ${staffData.name.full}.`,
          media: {
            edges: mediaNodes.map((m: any) => ({
              characterRole: matchingCredit.role,
              node: m
            }))
          }
        };
      }
    }

    const result = {
      character: charData,
      voiceArtist: staffData
    };

    if (result.character || result.voiceArtist) {
      if (cache.size > 500) {
        for (const [k, v] of cache.entries()) {
          if (v.expires < now) cache.delete(k);
        }
      }
      cache.set(cacheKey, { data: result, expires: now + CACHE_TTL_MS });
    }

    return NextResponse.json(result, {
      headers: { 'X-Cache': 'MISS' }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve character & voice artist dossier' },
      { status: 500 }
    );
  }
}

