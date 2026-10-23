import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

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
    media(type: ANIME, sort: POPULARITY_DESC, perPage: 8) {
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
    characters(sort: FAVOURITES_DESC, perPage: 8) {
      edges {
        role
        node {
          id
          name {
            full
          }
          image {
            medium
            large
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const characterId = searchParams.get('characterId');
    const characterName = searchParams.get('characterName');
    const staffId = searchParams.get('staffId');
    const staffName = searchParams.get('staffName');

    const cacheKey = `${characterId || ''}_${characterName || ''}_${staffId || ''}_${staffName || ''}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && now < cached.expires) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    const charIdNum = characterId && !isNaN(Number(characterId)) ? Number(characterId) : undefined;
    const charVars = charIdNum ? { id: charIdNum } : (characterName ? { search: characterName } : null);

    const staffIdNum = staffId && !isNaN(Number(staffId)) ? Number(staffId) : undefined;
    const staffVars = staffIdNum ? { id: staffIdNum } : (staffName ? { search: staffName } : null);

    const [charData, staffData] = await Promise.all([
      charVars ? fetchAniListGql(CHARACTER_QUERY, charVars) : Promise.resolve(null),
      staffVars ? fetchAniListGql(STAFF_QUERY, staffVars) : Promise.resolve(null)
    ]);

    const result = {
      character: charData?.Character || null,
      voiceArtist: staffData?.Staff || null
    };

    if (result.character || result.voiceArtist) {
      // Keep cache size bounded
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
