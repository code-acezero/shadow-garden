import { NextRequest, NextResponse } from 'next/server';
import { fetchWithCustomReferer } from './fetchWithCustomReferer';
import { rewritePlaylistUrls } from './rewritePlaylistUrls';

export const runtime = 'nodejs';
export const maxDuration = 30;

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

    // --- ZokoAnime CDNs (Critical for JP Sub & EN Dub streams) ---
    'dramahot': 'https://zokoanime.video/',
    'drama1': 'https://zokoanime.video/',
    'zokoanime': 'https://zokoanime.video/',
    'otakustream': 'https://zokoanime.video/',

    // --- MegaPlay / Anikoto CDNs (Critical for EN Dub streams) ---
    'nexabloom': 'https://megaplay.buzz/',
    'shiora': 'https://megaplay.buzz/',
    'silentvoyage': 'https://megaplay.buzz/',
    'broforgotsave': 'https://megaplay.buzz/',
    'megaplay': 'https://megaplay.buzz/',
    'megap': 'https://megaplay.buzz/',
    'tcdn': 'https://megaplay.buzz/',
    'anikoto': 'https://anikoto.net/',

    // --- Blakite / Rumble Cloud (Hindi & Special Dubs) ---
    'blakite': 'https://blakiteapi.xyz/',
    'rumble': 'https://blakiteapi.xyz/',
    
    // --- ✅ HINDI IMAGE HUB ACCESS ---
    'watchanimeworld': 'https://watchanimeworld.net/',
    'tmdb': 'https://www.themoviedb.org/',
    'image.tmdb': 'https://www.themoviedb.org/',
    'themoviedb': 'https://www.themoviedb.org/',

    // --- HDMovie2 / Bollywood Hubs ---
    'slast430did': 'https://hdmoviesnow.com/',
    'gemma416okl': 'https://hdmoviesnow.com/',
    'hutro433fil': 'https://slast430did.com/',
    'hdmoviesnow': 'https://hdmoviesnow.com/',
    'hdmoviescloud': 'https://hdmoviesnow.com/'
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
    // Disguised video segments (.jpg/.html on streaming CDNs) must NOT be treated as images
    const isVideoSegment = /(?:seg-|\.ts$|\.ts\?|\.m4s|\/anime\/.*(?:seg-|\.jpg|\.html|\.png|\.webp))/i.test(decodedUrl);
    const isImage = !isVideoSegment && !decodedUrl.includes('.mp4') && !decodedUrl.includes('.webm') && (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(decodedUrl) || decodedUrl.includes('/images/') || decodedUrl.includes('image.tmdb'));

    // Check if the URL belongs to a known strict CDN (e.g. dramahot / drama1 / zokoanime)
    const mappedReferer = determineReferer(decodedUrl);
    const isStrictKnownCdn = /dramahot|drama1|zokoanime|otakustream/i.test(decodedUrl);
    const dynamicReferer = (isStrictKnownCdn && mappedReferer !== DEFAULT_REFERER)
        ? mappedReferer
        : (explicitReferer ? decodeURIComponent(explicitReferer) : mappedReferer);

    try {
        // We use your custom fetcher to maintain consistency
        const rangeHeader = request.headers.get('range');
        let response = await fetchWithCustomReferer(decodedUrl, dynamicReferer, rangeHeader);

        // If upstream returns 403 or 401, retry with mappedReferer or known subtitle referers
        if ((response.status === 403 || response.status === 401) && dynamicReferer !== mappedReferer && mappedReferer !== DEFAULT_REFERER) {
            response = await fetchWithCustomReferer(decodedUrl, mappedReferer, rangeHeader);
        }
        if ((response.status === 403 || response.status === 401) && (decodedUrl.includes('.vtt') || decodedUrl.includes('/subs/'))) {
            const fallbackSubs = ['https://zokoanime.video/', 'https://megacloud.blog/'];
            for (const fb of fallbackSubs) {
                if (fb !== dynamicReferer && fb !== mappedReferer) {
                    const retryRes = await fetchWithCustomReferer(decodedUrl, fb, rangeHeader);
                    if (retryRes.ok) {
                        response = retryRes;
                        break;
                    }
                }
            }
        }
        // If upstream still returns 403 or 401, retry with standard clean fetch (no spoofed referer/origin)
        if ((response.status === 403 || response.status === 401)) {
            const directRes = await fetchWithCustomReferer(decodedUrl, undefined, rangeHeader);
            if (directRes.ok || directRes.status === 206) {
                response = directRes;
            }
        }

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
                    "Cache-Control": "no-cache, no-store, must-revalidate"
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
        let segContentType = contentType;
        if (decodedUrl.includes('.mp4') || contentType.includes('video/mp4') || contentType.includes('mp4')) {
            segContentType = "video/mp4";
        } else if (decodedUrl.includes('.webm') || contentType.includes('video/webm')) {
            segContentType = "video/webm";
        } else if (isVideoSegment || decodedUrl.includes('seg-') || decodedUrl.includes('.ts')) {
            segContentType = "video/mp2t";
        } else if (decodedUrl.includes('.m4s')) {
            segContentType = "video/iso.segment";
        } else if (decodedUrl.includes('.vtt') || decodedUrl.includes('/subs/')) {
            segContentType = "text/vtt; charset=utf-8";
        } else if (!segContentType || segContentType.includes('text/html') || segContentType.includes('image/')) {
            segContentType = "application/octet-stream";
        }

        const passthroughHeaders: Record<string, string> = {
            "Content-Type": segContentType,
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