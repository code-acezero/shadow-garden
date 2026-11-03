// src/app/api/anime/anilist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getCachedAniList, 
  setCachedAniList, 
  isAniListRateLimited, 
  setAniListRateLimit 
} from '@/lib/anilistDiskCache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

async function executeAniListFetch(bodyString: string, authHeader?: string | null, attempt = 1): Promise<{ status: number; json: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Kagemi/4.0',
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

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '60', 10);
      setAniListRateLimit(retryAfter);
      return { status: 429, json };
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
    const cached = getCachedAniList(cacheKey);

    // If cache is fresh, return immediately (0ms latency, zero upstream request!)
    if (cached && !cached.isStale) {
      return NextResponse.json(cached.data, {
        status: 200,
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
      });
    }

    // If currently rate limited by upstream, serve stale cache immediately!
    if (isAniListRateLimited()) {
      if (cached && cached.data) {
        console.warn(`[AniList Proxy] Serving stale cache during upstream rate-limit`);
        return NextResponse.json(cached.data, {
          status: 200,
          headers: { 'X-Cache': 'STALE' }
        });
      }
      return NextResponse.json(
        { errors: [{ message: 'AniList upstream rate limited. Retrying shortly.' }] },
        { status: 429 }
      );
    }

    try {
      const { status, json } = await executeAniListFetch(bodyString, null);

      if (status === 200 && json && !json.errors) {
        setCachedAniList(cacheKey, json);
        return NextResponse.json(json, {
          status: 200,
          headers: { 
            'X-Cache': 'MISS',
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
          }
        });
      }

      // If rate limited or error, but we have a stale entry, serve stale!
      if (cached && cached.data) {
        console.warn(`[AniList Proxy] Serving stale cache due to upstream status ${status}`);
        return NextResponse.json(cached.data, {
          status: 200,
          headers: { 'X-Cache': 'STALE' }
        });
      }

      return NextResponse.json(json || { errors: [{ message: `AniList error status ${status}` }] }, { status });
    } catch (fetchErr: any) {
      if (cached && cached.data) {
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
