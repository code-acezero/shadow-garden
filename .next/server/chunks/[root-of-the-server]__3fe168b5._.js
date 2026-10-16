module.exports = [
"[project]/.next-internal/server/app/api/donghua/[...endpoint]/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/app/api/donghua/[...endpoint]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "maxDuration",
    ()=>maxDuration,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/server.js [app-route] (ecmascript)");
;
const runtime = 'nodejs';
const maxDuration = 30;
const BASE_URLS = [
    'https://donghuaworld.com',
    'https://donghuaworld.in'
];
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
};
// In-memory cache with 15-minute TTL
const memoryCache = new Map();
function getCached(key) {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
        memoryCache.delete(key);
        return null;
    }
    return item.data;
}
function setCached(key, data, ttlSeconds = 900) {
    memoryCache.set(key, {
        data,
        expiry: Date.now() + ttlSeconds * 1000
    });
}
async function fetchWithTimeout(url, headers, timeoutMs = 8000) {
    const controller = new AbortController();
    const id = setTimeout(()=>controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            headers,
            signal: controller.signal,
            cache: 'no-store'
        });
        if (res.ok) return await res.text();
        throw new Error(`HTTP ${res.status}`);
    } finally{
        clearTimeout(id);
    }
}
async function fetchHtml(path) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // 1. Try primary domains with fast timeout
    for (const base of BASE_URLS){
        try {
            const url = `${base}${cleanPath}`;
            return await fetchWithTimeout(url, {
                ...HEADERS,
                Referer: `${base}/`
            }, 8000);
        } catch (err) {
            console.warn(`[Donghua Route] Fetch failed for ${base}${cleanPath}:`, err.message);
        }
    }
    // 2. Fallback via public proxy if direct domains are blocked
    try {
        const fallbackTarget = `${BASE_URLS[0]}${cleanPath}`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fallbackTarget)}`;
        return await fetchWithTimeout(proxyUrl, {
            'User-Agent': HEADERS['User-Agent']
        }, 12000);
    } catch (proxyErr) {
        console.error(`[Donghua Route] Proxy fallback failed:`, proxyErr.message);
    }
    throw new Error(`Failed to fetch ${cleanPath} across all mirrors`);
}
function cleanSlug(raw) {
    return raw.replace(/^https?:\/\/[^/]+/i, '').replace(/^\//, '').replace(/\/$/, '').replace(/^anime\//, '');
}
function parseCards(html) {
    const cards = [];
    const articleMatches = [
        ...html.matchAll(/<article[^>]*class="[^"]*bs[^"]*"[^>]*>([\s\S]*?)<\/article>/gi)
    ];
    for (const m of articleMatches){
        const block = m[1];
        const hrefMatch = block.match(/<a[^>]*href="([^"]+)"[^>]*>/i);
        const href = hrefMatch ? hrefMatch[1] : '';
        const slug = cleanSlug(href);
        const titleMatch = block.match(/class="(?:eggtitle|tt)"[^>]*>(?:<h2[^>]*>)?([\s\S]*?)(?:<\/h2>)?<\//i);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        const imgMatch = block.match(/<img[^>]*(?:data-src|src)="([^"]+)"/i);
        let image = imgMatch ? imgMatch[1] : '';
        if (image.startsWith('//')) image = `https:${image}`;
        const epMatch = block.match(/class="(?:eggepisode|epx)"[^>]*>([\s\S]*?)<\//i);
        const epText = epMatch ? epMatch[1].trim() : '';
        if (title && slug) {
            cards.push({
                id: slug,
                slug: slug,
                title: title,
                image: image,
                episode: epText,
                type: 'Donghua'
            });
        }
    }
    return cards;
}
async function GET(request) {
    try {
        const pathname = request.nextUrl.pathname;
        const path = pathname.replace(/^\/api\/donghua\/?/, '');
        const searchParams = request.nextUrl.searchParams;
        // 1. /api/donghua/servers?id=...
        if (path === 'servers') {
            const id = searchParams.get('id');
            if (!id) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: 'Missing episode id'
            }, {
                status: 400
            });
            const epSlug = cleanSlug(id);
            const cacheKey = `servers:${epSlug}`;
            const cached = getCached(cacheKey);
            if (cached) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                data: cached
            });
            const html = await fetchHtml(`/${epSlug}/`);
            const servers = [];
            // Extract a[data-hash]
            const serverMatches = [
                ...html.matchAll(/<a[^>]*data-hash="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)
            ];
            for (const m of serverMatches){
                const name = m[2].replace(/<[^>]+>/g, '').trim() || 'Server';
                const b64 = m[1];
                try {
                    const decoded = Buffer.from(b64, 'base64').toString('utf8');
                    const srcMatch = decoded.match(/src=["']([^"']+)["']/i);
                    if (srcMatch && srcMatch[1]) {
                        servers.push({
                            name,
                            url: srcMatch[1]
                        });
                    }
                } catch  {}
            }
            // Fallback: check embedded iframes
            if (servers.length === 0) {
                const iframes = [
                    ...html.matchAll(/<iframe[^>]+src="([^"]+)"/gi)
                ].map((i)=>i[1]).filter((src)=>!src.includes('google') && !src.includes('facebook') && !src.includes('disqus') && !src.includes('recaptcha'));
                iframes.forEach((src, idx)=>{
                    servers.push({
                        name: idx === 0 ? 'Default Player' : `Server ${idx + 1}`,
                        url: src
                    });
                });
            }
            setCached(cacheKey, servers, 1800);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                data: servers
            });
        }
        // 2. /api/donghua/watch?id=...
        if (path === 'watch') {
            const id = searchParams.get('id');
            if (!id) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: 'Missing episode id'
            }, {
                status: 400
            });
            const epSlug = cleanSlug(id);
            const cacheKey = `watch:${epSlug}`;
            const cached = getCached(cacheKey);
            if (cached) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                data: cached
            });
            const html = await fetchHtml(`/${epSlug}/`);
            const rawServers = [];
            const serverMatches = [
                ...html.matchAll(/<a[^>]*data-hash="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)
            ];
            for (const m of serverMatches){
                const name = m[2].replace(/<[^>]+>/g, '').trim() || 'Server';
                const b64 = m[1];
                try {
                    const decoded = Buffer.from(b64, 'base64').toString('utf8');
                    const srcMatch = decoded.match(/src=["']([^"']+)["']/i);
                    if (srcMatch && srcMatch[1]) {
                        rawServers.push({
                            name,
                            url: srcMatch[1]
                        });
                    }
                } catch  {}
            }
            if (rawServers.length === 0) {
                const iframes = [
                    ...html.matchAll(/<iframe[^>]+src="([^"]+)"/gi)
                ].map((i)=>i[1]).filter((src)=>!src.includes('google') && !src.includes('facebook') && !src.includes('disqus') && !src.includes('recaptcha'));
                iframes.forEach((src, idx)=>{
                    rawServers.push({
                        name: idx === 0 ? 'Default Player' : `Server ${idx + 1}`,
                        url: src
                    });
                });
            }
            const finalServers = [];
            let extractedSubtitles = [];
            // Check if any server (like DonghuaPlanet) provides a direct HLS m3u8 stream
            for (const s of rawServers){
                if (s.url && s.url.includes('donghuaplanet.com')) {
                    try {
                        const dpHtml = await fetchWithTimeout(s.url, {
                            'User-Agent': HEADERS['User-Agent'],
                            'Referer': `${BASE_URLS[0]}/`
                        }, 6000);
                        const sourcesMatch = dpHtml.match(/(?:const\s+sources\s*=\s*|sources:\s*)(\[[\s\S]*?\]);?/i);
                        const tracksMatch = dpHtml.match(/const\s+tracks\s*=\s*(\[[\s\S]*?\]);/i);
                        if (sourcesMatch) {
                            const sources = JSON.parse(sourcesMatch[1]);
                            const autoStream = sources.find((srcItem)=>srcItem.label === 'Auto' || srcItem.file?.includes('.m3u8')) || sources[0];
                            if (autoStream && autoStream.file) {
                                const hlsProxied = `/api/proxy?url=${encodeURIComponent(autoStream.file)}&referer=${encodeURIComponent('https://donghuaworld.com/')}`;
                                finalServers.unshift({
                                    name: `${s.name} (HD/4K)`,
                                    url: hlsProxied,
                                    type: 'hls'
                                });
                            }
                        }
                        if (tracksMatch && extractedSubtitles.length === 0) {
                            const tracks = JSON.parse(tracksMatch[1]);
                            extractedSubtitles = tracks.filter((t)=>t.label).map((t)=>({
                                    lang: t.label,
                                    url: `/api/proxy?url=${encodeURIComponent(t.file)}&referer=${encodeURIComponent('https://donghuaworld.com/')}`
                                }));
                        }
                    } catch (e) {
                        console.warn('[Donghua Route] DP extraction error:', e);
                    }
                }
                finalServers.push({
                    name: s.name,
                    url: s.url,
                    type: 'embed'
                });
            }
            const result = {
                servers: finalServers.length > 0 ? finalServers : rawServers,
                url: finalServers.length > 0 ? finalServers[0].url : '',
                subtitles: extractedSubtitles
            };
            setCached(cacheKey, result, 1800);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                data: result
            });
        }
        // 3. /api/donghua/info/:id
        if (path.startsWith('info/')) {
            const slug = cleanSlug(path.replace('info/', ''));
            const cacheKey = `info:${slug}`;
            const cached = getCached(cacheKey);
            if (cached) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                data: cached
            });
            let html = '';
            let parentSlug = slug;
            let isEpisodeSlug = false;
            try {
                html = await fetchHtml(`/anime/${slug}/`);
                if (!html.includes('class="eplister"') && !html.includes('class="thumbook"')) {
                    throw new Error('Not anime series page');
                }
            } catch  {
                isEpisodeSlug = true;
                try {
                    const epHtml = await fetchHtml(`/${slug}/`);
                    // Resolve series parent from breadcrumb or link
                    const breadcrumbMatch = epHtml.match(/<div[^>]*class="[^"]*breadcrumb[^"]*"[\s\S]*?<div[^>]*itemtype="http:\/\/schema\.org\/BreadcrumbList"[\s\S]*?href="https?:\/\/[^/]+\/anime\/([^"/]+)\/?"/i);
                    const generalAnimeMatch = epHtml.match(/href="https?:\/\/[^/]+\/anime\/([^"/?#]+)\/?"/i);
                    const resolved = breadcrumbMatch && breadcrumbMatch[1] || generalAnimeMatch && generalAnimeMatch[1];
                    if (resolved) {
                        parentSlug = resolved;
                        try {
                            html = await fetchHtml(`/anime/${parentSlug}/`);
                        } catch  {
                            html = epHtml;
                        }
                    } else {
                        html = epHtml;
                    }
                } catch  {
                // If both fail, keep empty html
                }
            }
            const titleMatch = html.match(/class="entry-title"[^>]*>([\s\S]*?)<\/h1>/i);
            const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : parentSlug;
            const imgMatch = html.match(/class="thumbook"[\s\S]*?<img[^>]*(?:data-src|src)="([^"]+)"/i) || html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) || html.match(/<img[^>]*(?:data-src|src)="([^"]+)"[^>]*class="[^"]*wp-post-image/i);
            let image = imgMatch ? imgMatch[1] : '';
            if (image.startsWith('//')) image = `https:${image}`;
            const synMatch = html.match(/class="entry-content"[^>]*>([\s\S]*?)<\/div>/i) || html.match(/class="desc[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
            const synopsis = synMatch ? synMatch[1].replace(/<[^>]+>/g, '').trim() : '';
            const genreMatches = [
                ...html.matchAll(/rel="tag"[^>]*>([^<]+)<\/a>/gi)
            ];
            const genres = [
                ...new Set(genreMatches.map((g)=>g[1].trim()))
            ];
            // Parse episodes scoped to .eplister
            const eplisterIdx = html.indexOf('class="eplister"');
            const eplisterHtml = eplisterIdx !== -1 ? html.slice(eplisterIdx, html.indexOf('</ul>', eplisterIdx) !== -1 ? html.indexOf('</ul>', eplisterIdx) + 5 : undefined) : html;
            const epMatches = [
                ...eplisterHtml.matchAll(/<li[^>]*data-index="[^"]*"[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?<div class="epl-num">([^<]*)<\/div>[\s\S]*?<div class="epl-title">([^<]*)<\/div>/gi)
            ];
            let episodes = epMatches.map((m)=>{
                const href = m[1];
                const epSlug = cleanSlug(href);
                const numRaw = m[2].trim();
                const leadingNum = numRaw.match(/^\s*(\d+)/);
                const cleanNumber = leadingNum ? leadingNum[1] : numRaw;
                return {
                    id: epSlug,
                    number: cleanNumber,
                    title: m[3].trim(),
                    href: `/api/donghua/servers?id=${epSlug}`,
                    hasSub: true,
                    hasDub: false
                };
            }).reverse();
            // Fallback if scoped parsing didn't match episodes
            if (episodes.length === 0) {
                const fallbackMatches = [
                    ...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?<div class="epl-num">([^<]*)<\/div>[\s\S]*?<div class="epl-title">([^<]*)<\/div>/gi)
                ];
                if (fallbackMatches.length > 0) {
                    episodes = fallbackMatches.map((m)=>{
                        const href = m[1];
                        const epSlug = cleanSlug(href);
                        const numRaw = m[2].trim();
                        const leadingNum = numRaw.match(/^\s*(\d+)/);
                        const cleanNumber = leadingNum ? leadingNum[1] : numRaw;
                        return {
                            id: epSlug,
                            number: cleanNumber,
                            title: m[3].trim(),
                            href: `/api/donghua/servers?id=${epSlug}`,
                            hasSub: true,
                            hasDub: false
                        };
                    }).reverse();
                } else if (isEpisodeSlug) {
                    // If it was an episode and no list was found, include current episode so player doesn't fail
                    episodes = [
                        {
                            id: slug,
                            number: '1',
                            title: title,
                            href: `/api/donghua/servers?id=${slug}`,
                            hasSub: true,
                            hasDub: false
                        }
                    ];
                }
            }
            const result = {
                detail: {
                    id: parentSlug,
                    slug: parentSlug,
                    title,
                    alternativeTitles: [],
                    image,
                    synopsis,
                    genres,
                    type: 'Donghua',
                    studios: [],
                    producers: [],
                    watchUrl: `${BASE_URLS[0]}/anime/${parentSlug}/`
                },
                episodes: {
                    animeId: parentSlug,
                    slug: parentSlug,
                    episodes
                }
            };
            setCached(cacheKey, result, 1800);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                data: result
            });
        }
        // 4. /api/donghua/home
        if (path === 'home') {
            const page = parseInt(searchParams.get('page') || '1', 10);
            const cacheKey = `home:${page}`;
            const cached = getCached(cacheKey);
            if (cached) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                data: cached
            });
            const html = await fetchHtml(page > 1 ? `/page/${page}/` : '/');
            const cards = parseCards(html);
            const spotlight = cards.slice(0, 8);
            const latestEpisodes = cards.slice(0, 16);
            const newRelease = cards.slice(16, 28);
            const newAdded = cards.slice(28, 40);
            const topDay = cards.slice(0, 10);
            const result = {
                spotlight,
                latestEpisodes,
                newRelease,
                newAdded,
                topDay
            };
            setCached(cacheKey, result, 600);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                data: result
            });
        }
        // 5. /api/donghua/search/:query
        if (path.startsWith('search/')) {
            const query = decodeURIComponent(path.replace('search/', ''));
            const page = searchParams.get('page') || '1';
            const cacheKey = `search:${query}:${page}`;
            const cached = getCached(cacheKey);
            if (cached) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                data: cached
            });
            const html = await fetchHtml(`/?s=${encodeURIComponent(query)}&page=${page}`);
            const cards = parseCards(html);
            setCached(cacheKey, cards, 600);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                data: cards
            });
        }
        // 6. /api/donghua/filter
        if (path === 'filter' || path === 'latest') {
            const page = searchParams.get('page') || '1';
            const order = searchParams.get('order') || 'update';
            const genre = searchParams.get('genre');
            const status = searchParams.get('status');
            const type = searchParams.get('type');
            const cacheKey = `filter:${order}:${page}:${genre}:${status}:${type}`;
            const cached = getCached(cacheKey);
            if (cached) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                data: cached
            });
            let url = `/anime/?order=${order}&page=${page}`;
            if (genre) url += `&genre%5B%5D=${encodeURIComponent(genre)}`;
            if (status) url += `&status=${encodeURIComponent(status)}`;
            if (type) url += `&type=${encodeURIComponent(type)}`;
            const html = await fetchHtml(url);
            const cards = parseCards(html);
            setCached(cacheKey, cards, 600);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                data: cards
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: `Unknown endpoint: ${path}`
        }, {
            status: 404
        });
    } catch (error) {
        console.error('[Donghua API Error]', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: error.message || 'Internal Server Error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3fe168b5._.js.map