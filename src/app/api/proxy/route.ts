import { NextRequest, NextResponse } from 'next/server';
import { fetchWithCustomReferer } from './fetchWithCustomReferer';
import { rewritePlaylistUrls } from './rewritePlaylistUrls';

// =========================================================
// 1. TACTICAL DOMAIN MAPPING
// =========================================================
const REFERER_MAP: Record<string, string> = {
    // --- Video Hubs ---
    'megacloud': 'https://megacloud.blog/',
    'rapid-cloud': 'https://megacloud.blog/',
    'rabbitstream': 'https://megacloud.blog/',
    'kwik': 'https://kwik.cx/',
    'uwucdn': 'https://kwik.cx/',
    'animepahe': 'https://animepahe.ru/',
    
    // --- ✅ HINDI IMAGE HUB ACCESS ---
    'watchanimeworld': 'https://watchanimeworld.net/',
    'tmdb': 'https://www.themoviedb.org/',
    'image.tmdb': 'https://www.themoviedb.org/',
    'themoviedb': 'https://www.themoviedb.org/'
};

const DEFAULT_REFERER = "https://megacloud.blog/";

function determineReferer(url: string): string {
    const lowerUrl = url.toLowerCase();
    for (const [key, value] of Object.entries(REFERER_MAP)) {
        if (lowerUrl.includes(key)) return value;
    }
    return DEFAULT_REFERER;
}

// =========================================================
// 2. PROXY HANDLER (Full Logic)
// =========================================================
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    const explicitReferer = request.nextUrl.searchParams.get('referer');

    if (!url) {
        return NextResponse.json({ error: "Mission Failed: No URL" }, { status: 400 });
    }

    const decodedUrl = decodeURIComponent(url);
    const isM3U8 = decodedUrl.includes('.m3u8');
    const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(decodedUrl) || decodedUrl.includes('image');

    // Prefer a referer the source itself told us to use (this is how the new
    // Anikoto-backed sources tell us what they need) over guessing from a
    // hardcoded domain list, which only covers the old backend's CDNs.
    const dynamicReferer = explicitReferer ? decodeURIComponent(explicitReferer) : determineReferer(decodedUrl);

    try {
        // We use your custom fetcher to maintain consistency
        const rangeHeader = request.headers.get('range');
        const response = await fetchWithCustomReferer(decodedUrl, dynamicReferer, rangeHeader);

        if (!response.ok && response.status !== 206) {
            return NextResponse.json({
                error: `Signal Interrupted: ${response.statusText}`,
                status: response.status
            }, { status: response.status });
        }

        // --- PHASE A: IMAGE BINARY (Bypassing CORS/Hotlink) ---
        if (isImage) {
            const arrayBuffer = await response.arrayBuffer();
            const contentType = response.headers.get("Content-Type") || "image/jpeg";

            return new NextResponse(arrayBuffer, {
                status: 200,
                headers: {
                    "Content-Type": contentType,
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "public, max-age=31536000, immutable", // Cache images for speed
                    "Referrer-Policy": "no-referrer"
                }
            });
        }

        // --- PHASE B: HLS PLAYLIST (Rewriting relative paths) ---
        if (isM3U8) {
            const playlistText = await response.text();
            const modifiedPlaylist = rewritePlaylistUrls(playlistText, decodedUrl, explicitReferer ? dynamicReferer : undefined);

            return new NextResponse(modifiedPlaylist, {
                status: 200,
                headers: {
                    "Content-Type": "application/vnd.apple.mpegurl",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "public, max-age=600"
                }
            });
        }

        // --- PHASE C: JSON API RESPONSES ---
        const contentType = response.headers.get("Content-Type") || "";
        if (contentType.includes("application/json") || decodedUrl.includes('/api/')) {
            const text = await response.text();
            return new NextResponse(text, {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "public, max-age=60"
                }
            });
        }

        // --- PHASE D: VIDEO SEGMENTS / OTHERS ---
        const passthroughHeaders: Record<string, string> = {
            "Content-Type": contentType || "application/octet-stream",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
            "Accept-Ranges": response.headers.get("Accept-Ranges") || "bytes",
            "Cache-Control": "public, max-age=31536000",
        };
        const contentRange = response.headers.get("Content-Range");
        if (contentRange) passthroughHeaders["Content-Range"] = contentRange;
        const contentLength = response.headers.get("Content-Length");
        if (contentLength) passthroughHeaders["Content-Length"] = contentLength;

        return new NextResponse(response.body, {
            status: response.status === 206 ? 206 : 200,
            headers: passthroughHeaders
        });

    } catch (error: any) {
        console.error('Shadow Garden Proxy Breach:', error);
        return NextResponse.json({
            error: "Internal Link Severed",
            details: error.message
        }, { status: 500 });
    }
}

// Ensure the browser doesn't block preflight checks
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Range',
            'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
        }
    });
}