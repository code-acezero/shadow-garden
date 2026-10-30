// src/app/api/anime/anilist/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

interface CacheEntry {
  data: any;
  status: number;
  expires: number;
  staleUntil: number;
}

// In-memory server cache for AniList GraphQL responses (prevents hitting the 30 req/min rate limit)
const serverCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes fresh
const STALE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours stale fallback

function cleanCache() {
  if (serverCache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of serverCache.entries()) {
      if (v.staleUntil < now) {
        serverCache.delete(k);
      }
    }
  }
}

async function executeAniListFetch(bodyString: string, authHeader?: string | null, attempt = 1): Promise<{ status: number; json: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'ShadowGarden/2.0 (Anime Streamer)',
  };

  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: bodyString,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const json = await res.json().catch(() => null);

    if (res.status === 429 && attempt < 2) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '1', 10);
      const waitMs = Math.min(Math.max(retryAfter * 1000, 1000), 1500);
      await new Promise(r => setTimeout(r, waitMs));
      return executeAniListFetch(bodyString, authHeader, attempt + 1);
    }

    return { status: res.status, json };
  } catch (err: any) {
    clearTimeout(timer);
    if (attempt <= 2) {
      await new Promise(r => setTimeout(r, 1000));
      return executeAniListFetch(bodyString, authHeader, attempt + 1);
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const body = await req.json();
    const { query, variables } = body;
    const isMutation = typeof query === 'string' && query.trim().startsWith('mutation');
    const bodyString = JSON.stringify({ query, variables });

    // Authenticated calls and mutations must NEVER use or pollute server cache
    if (authHeader || isMutation) {
      const { status, json } = await executeAniListFetch(bodyString, authHeader);
      return NextResponse.json(json || { errors: [{ message: `AniList error status ${status}` }] }, { status });
    }

    const cacheKey = bodyString;
    const cached = serverCache.get(cacheKey);
    const now = Date.now();

    // If cache is fresh, return immediately
    if (cached && now < cached.expires) {
      return NextResponse.json(cached.data, {
        status: cached.status,
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=1800'
        }
      });
    }

    try {
      const { status, json } = await executeAniListFetch(bodyString, null);

      if (status === 200 && json && !json.errors) {
        cleanCache();
        serverCache.set(cacheKey, {
          data: json,
          status,
          expires: now + CACHE_TTL_MS,
          staleUntil: now + STALE_TTL_MS,
        });
        return NextResponse.json(json, {
          status: 200,
          headers: { 'X-Cache': 'MISS' }
        });
      }

      // If rate limited or error, but we have a stale entry, serve stale!
      if (cached && now < cached.staleUntil) {
        console.warn(`[AniList Proxy] Serving stale cache due to upstream status ${status}`);
        return NextResponse.json(cached.data, {
          status: 200,
          headers: { 'X-Cache': 'STALE' }
        });
      }

      return NextResponse.json(json || { errors: [{ message: `AniList error status ${status}` }] }, { status });
    } catch (fetchErr: any) {
      if (cached && now < cached.staleUntil) {
        console.warn(`[AniList Proxy] Serving stale cache due to fetch error: ${fetchErr.message}`);
        return NextResponse.json(cached.data, {
          status: 200,
          headers: { 'X-Cache': 'STALE' }
        });
      }
      throw fetchErr;
    }
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || 'AniList Proxy Request Failed' }] },
      { status: 500 }
    );
  }
}
