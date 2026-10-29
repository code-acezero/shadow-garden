import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 45;

// In-memory cache for search results (Key: URL or SHA256/hash, Value: Response JSON)
interface CacheEntry {
    data: any;
    timestamp: number;
}
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const MAX_CACHE_SIZE = 150;

function getCachedResult(key: string) {
    const entry = searchCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        searchCache.delete(key);
        return null;
    }
    return entry.data;
}

function setCachedResult(key: string, data: any) {
    if (searchCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = searchCache.keys().next().value;
        if (oldestKey) searchCache.delete(oldestKey);
    }
    searchCache.set(key, { data, timestamp: Date.now() });
}

// Simple fast hash for caching image buffers
function quickHash(buffer: ArrayBuffer | Uint8Array): string {
    const view = new Uint8Array(buffer);
    let hash = 0;
    const step = Math.max(1, Math.floor(view.length / 500));
    for (let i = 0; i < view.length; i += step) {
        hash = ((hash << 5) - hash) + view[i];
        hash |= 0;
    }
    return `buf_${view.length}_${hash}`;
}

// Upstream trace.moe endpoints
const UPSTREAM_ENDPOINTS = [
    'https://api.trace.moe',
    'https://trace.moe/api'
];

async function callTraceMoe(
    endpoint: string,
    params: URLSearchParams,
    body: ArrayBuffer | Uint8Array | null,
    contentType: string | null,
    apiKey?: string
): Promise<Response> {
    const targetUrl = `${endpoint}/search?${params.toString()}`;
    const headers: Record<string, string> = {
        'User-Agent': 'ShadowGarden-ImageSearch/4.0'
    };
    if (contentType) headers['Content-Type'] = contentType;
    if (apiKey) headers['x-trace-secret'] = apiKey;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
        const res = await fetch(targetUrl, {
            method: body ? 'POST' : 'GET',
            headers,
            body: body ? (body as any) : undefined,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return res;
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

// Fallback: If trace.moe returned numeric IDs without anilistInfo, enrich via AniList GraphQL
async function enrichWithAniList(results: any[]) {
    if (!Array.isArray(results) || results.length === 0) return results;

    const idsToFetch = results
        .map(r => (typeof r.anilist === 'number' ? r.anilist : null))
        .filter((id): id is number => id !== null);

    if (idsToFetch.length === 0) return results;

    try {
        const query = `
            query ($ids: [Int]) {
                Page(page: 1, perPage: 25) {
                    media(id_in: $ids, type: ANIME) {
                        id
                        idMal
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            extraLarge
                        }
                        bannerImage
                        episodes
                        status
                        isAdult
                    }
                }
            }
        `;

        const res = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query, variables: { ids: idsToFetch } }),
            next: { revalidate: 3600 }
        });

        if (!res.ok) return results;
        const json = await res.json();
        const mediaList: any[] = json?.data?.Page?.media || [];
        const mediaMap = new Map<number, any>();
        mediaList.forEach(m => mediaMap.set(m.id, m));

        return results.map(r => {
            if (typeof r.anilist === 'number' && mediaMap.has(r.anilist)) {
                return {
                    ...r,
                    anilist: mediaMap.get(r.anilist)
                };
            }
            return r;
        });
    } catch (err) {
        console.error('AniList enrichment failed:', err);
        return results;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // Quota check endpoint
    if (action === 'quota' || action === 'me') {
        try {
            const res = await fetch('https://api.trace.moe/me', {
                headers: { 'User-Agent': 'ShadowGarden-ImageSearch/4.0' }
            });
            if (res.ok) {
                const data = await res.json();
                return NextResponse.json(data);
            }
        } catch (e) {}
        return NextResponse.json({ id: 'internal', priority: 0, concurrency: 1, quota: 100, quotaUsed: 0 });
    }

    const imageUrl = searchParams.get('url');
    if (!imageUrl) {
        return NextResponse.json({ error: 'Missing image URL in query param' }, { status: 400 });
    }

    const cacheKey = `url_${imageUrl}`;
    const cached = getCachedResult(cacheKey);
    if (cached) {
        return NextResponse.json(cached);
    }

    const params = new URLSearchParams();
    params.set('url', imageUrl);
    if (searchParams.has('cutBorders')) params.set('cutBorders', '');
    if (searchParams.has('anilistID')) params.set('anilistID', searchParams.get('anilistID')!);
    params.set('anilistInfo', ''); // Always request AniList info

    let lastError: any = null;
    for (const endpoint of UPSTREAM_ENDPOINTS) {
        try {
            const res = await callTraceMoe(endpoint, params, null, null);
            if (res.ok) {
                const data = await res.json();
                if (data.result && data.result.length > 0) {
                    data.result = await enrichWithAniList(data.result);
                }
                setCachedResult(cacheKey, data);
                return NextResponse.json(data);
            }
            lastError = `Upstream returned status ${res.status}`;
        } catch (err: any) {
            lastError = err.message || 'Network error';
        }
    }

    return NextResponse.json({
        frameCount: 0,
        error: lastError || 'Image search failed on all mirrors',
        result: []
    }, { status: 502 });
}

export async function POST(request: NextRequest) {
    const contentType = request.headers.get('content-type') || '';
    const searchParams = request.nextUrl.searchParams;

    const params = new URLSearchParams();
    if (searchParams.has('cutBorders')) params.set('cutBorders', '');
    if (searchParams.has('anilistID')) params.set('anilistID', searchParams.get('anilistID')!);
    params.set('anilistInfo', ''); // Always ensure anime metadata comes back

    let imageBuffer: ArrayBuffer | null = null;
    let imageMime = 'image/jpeg';

    try {
        // 1. Multipart Form Data (from file upload)
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('image');
            if (!file || typeof file === 'string') {
                return NextResponse.json({ error: 'No image file provided in form data' }, { status: 400 });
            }
            const blob = file as Blob;
            imageMime = blob.type || 'image/jpeg';
            imageBuffer = await blob.arrayBuffer();
        }
        // 2. JSON Payload (base64 string or remote image URL)
        else if (contentType.includes('application/json')) {
            const body = await request.json();
            if (body.url) {
                const url = body.url;
                params.set('url', url);
            } else if (body.image) {
                const raw = body.image as string;
                const matches = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
                if (matches) {
                    imageMime = matches[1];
                    const buffer = Buffer.from(matches[2], 'base64');
                    imageBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
                } else {
                    const buffer = Buffer.from(raw, 'base64');
                    imageBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
                }
            } else {
                return NextResponse.json({ error: 'Invalid JSON body: provide image or url' }, { status: 400 });
            }
        }
        // 3. Raw Binary Payload
        else if (contentType.startsWith('image/') || contentType.includes('application/octet-stream')) {
            imageMime = contentType.split(';')[0];
            imageBuffer = await request.arrayBuffer();
        } else {
            return NextResponse.json({ error: `Unsupported Content-Type: ${contentType}` }, { status: 415 });
        }
    } catch (err: any) {
        console.error('Failed to parse image search request:', err);
        return NextResponse.json({ error: `Payload error: ${err.message}` }, { status: 400 });
    }

    // Check cache if image buffer exists
    let cacheKey = '';
    if (imageBuffer) {
        cacheKey = quickHash(imageBuffer);
        const cached = getCachedResult(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }
    } else if (params.get('url')) {
        cacheKey = `url_${params.get('url')}`;
        const cached = getCachedResult(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }
    }

    let lastError: any = null;

    for (const endpoint of UPSTREAM_ENDPOINTS) {
        try {
            const res = await callTraceMoe(
                endpoint,
                params,
                imageBuffer,
                imageBuffer ? imageMime : null
            );

            if (res.ok) {
                const data = await res.json();
                if (data.result && data.result.length > 0) {
                    data.result = await enrichWithAniList(data.result);
                }
                if (cacheKey) setCachedResult(cacheKey, data);
                return NextResponse.json(data);
            }

            const errorText = await res.text().catch(() => '');
            lastError = `Upstream error ${res.status}: ${errorText.slice(0, 200)}`;
        } catch (err: any) {
            lastError = err.message || 'Upstream connection error';
        }
    }

    return NextResponse.json({
        frameCount: 0,
        error: lastError || 'Visual scanner engine could not find matching scenes.',
        result: []
    }, { status: 502 });
}
