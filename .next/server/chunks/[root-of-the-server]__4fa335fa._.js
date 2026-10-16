module.exports = [
"[project]/.next-internal/server/app/api/hdmovies/[...endpoint]/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/src/app/api/hdmovies/[...endpoint]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic,
    "maxDuration",
    ()=>maxDuration,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/server.js [app-route] (ecmascript)");
;
const runtime = 'nodejs';
const dynamic = 'force-dynamic';
const maxDuration = 30;
const TMDB_API_KEY = '1cf50e6248dc270629e802686245c2c8';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
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
async function fetchTmdb(endpoint, params = {}) {
    const query = new URLSearchParams({
        api_key: TMDB_API_KEY,
        ...Object.fromEntries(Object.entries(params).filter(([, v])=>v !== undefined && v !== null && v !== '').map(([k, v])=>[
                k,
                String(v)
            ]))
    });
    const url = `${TMDB_BASE}${endpoint}?${query.toString()}`;
    const controller = new AbortController();
    const id = setTimeout(()=>controller.abort(), 12000);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'ShadowGarden/2.0'
            },
            next: {
                revalidate: 600
            }
        });
        if (!res.ok) {
            throw new Error(`TMDB HTTP ${res.status}`);
        }
        return await res.json();
    } finally{
        clearTimeout(id);
    }
}
function mapTmdbToCard(m) {
    if (!m) return null;
    const poster = m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : m.backdrop_path ? `${TMDB_IMAGE_BASE}${m.backdrop_path}` : '';
    const year = m.release_date ? m.release_date.split('-')[0] : '';
    const rating = m.vote_average ? Number(m.vote_average).toFixed(1) : '7.5';
    return {
        id: String(m.id),
        slug: String(m.id),
        title: m.title || m.name || m.original_title || 'Untitled',
        image: poster,
        poster: poster,
        backdrop: m.backdrop_path ? `${TMDB_BACKDROP_BASE}${m.backdrop_path}` : poster,
        rating: rating,
        year: year,
        type: 'Movie',
        country: m.original_language?.toUpperCase() === 'HI' ? 'Bollywood' : m.original_language?.toUpperCase() === 'JA' ? 'Japan' : 'Hollywood',
        overview: m.overview || ''
    };
}
const GENRE_MAP = {
    action: 28,
    adventure: 12,
    animation: 16,
    comedy: 35,
    crime: 80,
    documentary: 99,
    drama: 18,
    family: 10751,
    fantasy: 14,
    history: 36,
    horror: 27,
    music: 10402,
    mystery: 9648,
    romance: 10749,
    'sci-fi': 878,
    scifi: 878,
    thriller: 53,
    war: 10752,
    western: 37
};
async function GET(req, { params }) {
    const { endpoint } = await params;
    const action = endpoint?.[0] || 'home';
    const urlObj = new URL(req.url);
    const cacheKey = `${action}:${urlObj.search}`;
    const cached = getCached(cacheKey);
    if (cached) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(cached);
    try {
        // 1. HOME: Rich multi-category curated movie rows
        if (action === 'home') {
            const [trending, popular, topRated, bollywood, animation] = await Promise.all([
                fetchTmdb('/trending/movie/week').catch(()=>({
                        results: []
                    })),
                fetchTmdb('/movie/popular').catch(()=>({
                        results: []
                    })),
                fetchTmdb('/movie/top_rated').catch(()=>({
                        results: []
                    })),
                fetchTmdb('/discover/movie', {
                    with_original_language: 'hi',
                    sort_by: 'popularity.desc'
                }).catch(()=>({
                        results: []
                    })),
                fetchTmdb('/discover/movie', {
                    with_genres: 16,
                    sort_by: 'popularity.desc'
                }).catch(()=>({
                        results: []
                    }))
            ]);
            const sections = [
                {
                    title: 'Recent Updates',
                    items: (trending.results || []).map(mapTmdbToCard).filter(Boolean).slice(0, 18),
                    query: 'trending'
                },
                {
                    title: 'Trending Movies',
                    items: (popular.results || []).map(mapTmdbToCard).filter(Boolean).slice(0, 18),
                    query: 'popular'
                },
                {
                    title: 'Top Rated Blockbusters',
                    items: (topRated.results || []).map(mapTmdbToCard).filter(Boolean).slice(0, 18),
                    query: 'top_rated'
                },
                {
                    title: 'Bollywood Hits',
                    items: (bollywood.results || []).map(mapTmdbToCard).filter(Boolean).slice(0, 18),
                    query: 'bollywood'
                },
                {
                    title: 'Animation & Animated Features',
                    items: (animation.results || []).map(mapTmdbToCard).filter(Boolean).slice(0, 18),
                    query: 'animation'
                }
            ].filter((s)=>s.items.length > 0);
            const result = {
                sections
            };
            setCached(cacheKey, result, 900);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(result);
        }
        // 2. SEARCH
        if (action === 'search') {
            const q = urlObj.searchParams.get('q') || urlObj.searchParams.get('story') || urlObj.searchParams.get('keyword') || '';
            const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
            if (!q.trim()) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                results: [],
                total: 0
            });
            const data = await fetchTmdb('/search/movie', {
                query: q.trim(),
                page
            });
            const results = (data.results || []).map(mapTmdbToCard).filter(Boolean);
            const result = {
                results,
                total: data.total_results || results.length,
                currentPage: data.page || page,
                hasNextPage: (data.page || page) < (data.total_pages || 1)
            };
            setCached(cacheKey, result, 600);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(result);
        }
        // 3. GENRE
        if (action === 'genre') {
            const genre = (urlObj.searchParams.get('genre') || 'action').toLowerCase();
            const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
            const genreId = GENRE_MAP[genre] || 28;
            const data = await fetchTmdb('/discover/movie', {
                with_genres: genreId,
                page,
                sort_by: 'popularity.desc'
            });
            const results = (data.results || []).map(mapTmdbToCard).filter(Boolean);
            const result = {
                results,
                currentPage: data.page || page,
                hasNextPage: (data.page || page) < (data.total_pages || 1)
            };
            setCached(cacheKey, result, 900);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(result);
        }
        // 4. COUNTRY / REGIONAL CATALOGUES
        if (action === 'country') {
            const country = (urlObj.searchParams.get('country') || 'bollywood').toLowerCase();
            const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
            let lang = 'en';
            if (country.includes('bolly') || country.includes('india') || country.includes('hindi')) lang = 'hi';
            else if (country.includes('korea')) lang = 'ko';
            else if (country.includes('japan')) lang = 'ja';
            else if (country.includes('china')) lang = 'zh';
            else if (country.includes('thai')) lang = 'th';
            else if (country.includes('turk')) lang = 'tr';
            const data = await fetchTmdb('/discover/movie', {
                with_original_language: lang,
                page,
                sort_by: 'popularity.desc'
            });
            const results = (data.results || []).map(mapTmdbToCard).filter(Boolean);
            const result = {
                results,
                currentPage: data.page || page,
                hasNextPage: (data.page || page) < (data.total_pages || 1)
            };
            setCached(cacheKey, result, 900);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(result);
        }
        // 5. CATEGORY
        if (action === 'category') {
            const category = (urlObj.searchParams.get('category') || 'popular').toLowerCase();
            const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
            let endpointPath = '/movie/popular';
            if (category.includes('top') || category.includes('rate')) endpointPath = '/movie/top_rated';
            else if (category.includes('trend')) endpointPath = '/trending/movie/week';
            else if (category.includes('upcom')) endpointPath = '/movie/upcoming';
            const data = await fetchTmdb(endpointPath, {
                page
            });
            const results = (data.results || []).map(mapTmdbToCard).filter(Boolean);
            const result = {
                results,
                currentPage: data.page || page,
                hasNextPage: (data.page || page) < (data.total_pages || 1)
            };
            setCached(cacheKey, result, 900);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(result);
        }
        // 6. WATCH / DETAIL
        if (action === 'watch' || action === 'detail') {
            const rawId = urlObj.searchParams.get('id') || endpoint?.[1] || '';
            if (!rawId) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing movie id'
            }, {
                status: 400
            });
            let tmdbId = rawId;
            // Handle IMDb ID lookup (e.g. tt1234567)
            if (rawId.startsWith('tt')) {
                const findRes = await fetchTmdb(`/find/${rawId}`, {
                    external_source: 'imdb_id'
                }).catch(()=>null);
                const matched = findRes?.movie_results?.[0];
                if (matched?.id) {
                    tmdbId = String(matched.id);
                }
            }
            const movie = await fetchTmdb(`/movie/${tmdbId}`, {
                append_to_response: 'external_ids,recommendations,credits,videos'
            });
            if (!movie || !movie.id) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Movie not found'
                }, {
                    status: 404
                });
            }
            const imdbId = movie.external_ids?.imdb_id || movie.imdb_id || '';
            const poster = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : '';
            const backdrop = movie.backdrop_path ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}` : poster;
            // Multi-Server High Speed Embed Players
            const streams = [
                {
                    name: 'VidSrc Pro',
                    url: `https://vidsrc.to/embed/movie/${imdbId || movie.id}`,
                    type: 'embed'
                },
                {
                    name: 'VidLink Pro',
                    url: `https://vidlink.pro/movie/${movie.id}`,
                    type: 'embed'
                },
                {
                    name: 'AutoEmbed',
                    url: `https://autoembed.co/movie/tmdb/${movie.id}`,
                    type: 'embed'
                },
                {
                    name: 'EmbedSU',
                    url: `https://embed.su/embed/movie/${movie.id}`,
                    type: 'embed'
                },
                {
                    name: 'VidSrc CC',
                    url: `https://vidsrc.cc/v2/embed/movie/${movie.id}`,
                    type: 'embed'
                },
                {
                    name: 'Super Player',
                    url: `https://slast430did.com/play/${imdbId || movie.id}`,
                    type: 'iframe'
                },
                {
                    name: '2Embed',
                    url: `https://www.2embed.cc/embed/${imdbId || movie.id}`,
                    type: 'embed'
                }
            ];
            const related = (movie.recommendations?.results || []).map(mapTmdbToCard).filter(Boolean).slice(0, 12);
            const result = {
                id: String(movie.id),
                slug: String(movie.id),
                title: movie.title || movie.original_title || 'Untitled',
                image: poster,
                cover: backdrop,
                synopsis: movie.overview || 'No synopsis available.',
                description: movie.overview || '',
                imdbId: imdbId,
                year: movie.release_date ? movie.release_date.split('-')[0] : '',
                releaseDate: movie.release_date || '',
                runtime: movie.runtime ? `${movie.runtime} min` : undefined,
                rating: movie.vote_average ? Number(movie.vote_average).toFixed(1) : '7.5',
                type: 'Movie',
                country: movie.original_language?.toUpperCase() === 'HI' ? 'Bollywood' : 'Hollywood',
                genres: (movie.genres || []).map((g)=>g.name),
                cast: (movie.credits?.cast || []).slice(0, 8).map((c)=>c.name),
                streams: streams,
                related: related,
                downloadLinks: []
            };
            setCached(cacheKey, result, 900);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(result);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: `Unknown action: ${action}`
        }, {
            status: 404
        });
    } catch (error) {
        console.error(`[HDMovies TMDB API Error] ${action}:`, error.message);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Internal Server Error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4fa335fa._.js.map