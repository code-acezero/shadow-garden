module.exports = [
"[project]/.next-internal/server/app/hindi-watch/[id]/page/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[project]/src/app/icon.svg.mjs { IMAGE => \"[project]/src/app/icon.svg (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/icon.svg.mjs { IMAGE => \"[project]/src/app/icon.svg (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/app/error.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/error.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/app/not-found.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/not-found.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/app/global-error.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/global-error.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/lib/hpi.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/hpi.ts
//
// ==========================================================================
//  MIGRATION NOTE
// ==========================================================================
//  This used to be a thin client over two separate cheerio-scraped Hindi
//  anime sources — Hindi (via /api/Hindi, src/lib/scrapers/Hindi.ts)
//  and Satoru (via /api/satoru, src/lib/scrapers/satoru.ts) — glued together
//  by `bridge.getSmartDetails()`, which searched Satoru by title to borrow
//  its recommendations since Hindi alone didn't have any worth showing.
//
//  Both scrapers are gone. This file now talks directly to a single clean
//  JSON API instead: https://anime-api-ashen-chi.vercel.app (an
//  itzzzme/anime-api-family Hindi-dub fork). Since it's one coherent
//  catalog, there's no second source to "bridge" against anymore —
//  `bridge.getSmartDetails()` is kept only so the one call site that used it
//  doesn't need to change, but it's now a thin alias for `Hindi.getDetails`
//  with the anime's own recommendations attached.
//
//  IMPORTANT — verification status: I could not get a live response back
//  from this specific mirror (my fetch tool blocked every sub-path on this
//  domain). What follows is built against the well-documented endpoint/
//  response conventions shared across the whole itzzzme/anime-api family
//  (this Hindi fork explicitly derives from that same codebase), plus one
//  concrete real-world example response from a sibling fork
//  (shadowanimexyz/anikoto-api) for the anime-detail shape. Every parse
//  below is defensive (tries several plausible field names) for exactly
//  this reason. Please do one manual `curl` sanity check against the live
//  mirror before relying on this in production — in particular the
//  `/api/stream` and `/api/servers` shapes, which I have the least
//  confidence in.
//
//  All public method names on `hpi` (`hpi.Hindi.*`, `hpi.bridge.*`) and
//  every exported type are UNCHANGED, so none of the 5 components that
//  import from this file (WhisperIsland, RecentUpdatesSection,
//  HindiSearchBar, HindiAnimeCard, hindi-watch/WatchClient) needed to be
//  touched for their data-fetching calls. `hpi.satoru` has been removed —
//  nothing outside this file ever called it directly.
// ==========================================================================
/**
 * ==========================================
 * SHARED TYPES (unchanged)
 * ==========================================
 */ __turbopack_context__.s([
    "hpi",
    ()=>hpi
]);
const getHindiApiBase = ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return ("TURBOPACK compile-time truthy", 1) ? `${"TURBOPACK compile-time value", "http://localhost:3000"}/api/blakite` : "TURBOPACK unreachable";
};
async function fetchHindiApi(endpoint, params = {}) {
    // If running on server, call blakite functions directly to bypass loopback fetch issues
    if ("TURBOPACK compile-time truthy", 1) {
        try {
            const { getBlakiteHome, getBlakiteLatest, searchBlakite, filterBlakite, getBlakiteDetail, getBlakiteStreamUrl } = await __turbopack_context__.A("[project]/src/lib/blakite.ts [app-rsc] (ecmascript, async loader)");
            const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
            const parts = cleanEndpoint.split('/');
            const main = parts[0];
            const sub = parts.slice(1).join('/');
            if (main === 'home') {
                const data = await getBlakiteHome();
                return data;
            }
            if (main === 'search') {
                const keyword = params.keyword || params.q || '';
                const page = parseInt(String(params.page || '1'), 10);
                const data = await searchBlakite(keyword, page);
                return data;
            }
            if (main === 'filter') {
                const page = parseInt(String(params.page || '1'), 10);
                const data = await filterBlakite(params, page);
                return data;
            }
            if (main === 'latest') {
                const page = parseInt(String(params.page || '1'), 10);
                const data = await getBlakiteLatest(params.type || 'updated-all', page);
                return data;
            }
            if (main === 'anime') {
                const id = sub || params.id || '';
                const data = await getBlakiteDetail(id);
                return data;
            }
            if (main === 'watch') {
                const slug = sub || params.slug || '';
                const data = await getBlakiteStreamUrl(slug);
                return data;
            }
        } catch (serverErr) {
            console.error('[HPI Server-Side Blakite Error]', serverErr);
        }
    }
    const queryParts = Object.entries(params).filter(([, v])=>v !== undefined && v !== null && v !== '').map(([k, v])=>`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const targetUrl = `${getHindiApiBase()}${endpoint}${queryString}`;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), 15000);
        const response = await fetch(targetUrl, {
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeoutId);
        if (!response.ok) return null;
        const json = await response.json();
        if (json && typeof json === 'object') {
            if ('ok' in json) return json.ok ? json.data ?? json : null;
            if ('data' in json) return json.data;
        }
        return json;
    } catch (innerError) {
        console.error('[HPI fetch error]', innerError);
        return null;
    }
}
function normalizeHindiCard(item) {
    // The API returns episodes as {sub, dub, total} object, not a number
    const epObj = item?.episodes;
    const epCount = epObj?.total ?? epObj?.dub ?? epObj?.sub ?? undefined;
    const imgUrl = item?.image || item?.poster || '';
    return {
        id: item?.id || item?.slug || '',
        title: item?.title || item?.name || item?.titleJp || 'Unknown Title',
        image: imgUrl,
        poster: imgUrl,
        type: item?.type || 'TV',
        episode: epCount !== undefined ? String(epCount) : undefined,
        episodeCount: epCount !== undefined ? String(epCount) : undefined,
        slug: item?.slug || item?.id || '',
        dataId: item?.id || item?.slug || '',
        score: item?.score || 0
    };
}
class HPIClient {
    hindi = {
        getHome: async ()=>{
            const results = await fetchHindiApi('/home');
            const sections = [];
            const filterAnime = (items)=>items.filter((i)=>i.type !== 'Drama' && i.type !== 'Live Action');
            if (results?.spotlight?.length > 0) {
                sections.push({
                    title: 'Spotlight',
                    items: filterAnime(results.spotlight).map(normalizeHindiCard)
                });
            }
            if (results?.recentlyUpdated?.length > 0) {
                sections.push({
                    title: 'Recently Updated',
                    items: filterAnime(results.recentlyUpdated).map(normalizeHindiCard)
                });
            }
            if (results?.ongoingAnime?.length > 0) {
                sections.push({
                    title: 'Ongoing Anime',
                    items: filterAnime(results.ongoingAnime).map(normalizeHindiCard)
                });
            }
            if (results?.moviesCollection?.length > 0) {
                // Movies collection might include dramas/live action in some logic, but let's just map it.
                // We will remove filterAnime for Movies & Drama to allow them to show
                sections.push({
                    title: 'Movies Collection',
                    items: (results.moviesCollection || []).map(normalizeHindiCard)
                });
            }
            if (results?.dramaLiveAction?.length > 0) {
                sections.push({
                    title: 'Drama & Live Action',
                    items: (results.dramaLiveAction || []).map(normalizeHindiCard)
                });
            }
            if (results?.completedSeries?.length > 0) {
                sections.push({
                    title: 'Completed Series',
                    items: filterAnime(results.completedSeries).map(normalizeHindiCard)
                });
            }
            if (results?.hindiDubbedOrg?.length > 0) {
                sections.push({
                    title: 'Hindi Dubbed (Org)',
                    items: filterAnime(results.hindiDubbedOrg).map(normalizeHindiCard)
                });
            }
            if (results?.hindiFanDubbed?.length > 0) {
                sections.push({
                    title: 'Hindi Fan Dubbed',
                    items: filterAnime(results.hindiFanDubbed).map(normalizeHindiCard)
                });
            }
            // Fallback if everything is empty
            if (sections.length === 0) {
                const latest = Array.isArray(results) ? results : [];
                sections.push({
                    title: 'Recently Updated',
                    items: filterAnime(latest).map(normalizeHindiCard)
                });
            }
            return {
                sections
            };
        },
        search: async (query, page = 1)=>{
            const resultsObj = await fetchHindiApi('/search', {
                q: query,
                page
            });
            const list = Array.isArray(resultsObj?.results) ? resultsObj.results : [];
            const items = list.map(normalizeHindiCard);
            return {
                title: query,
                items,
                pagination: {
                    currentPage: resultsObj?.currentPage ?? page,
                    hasNextPage: resultsObj?.hasNextPage ?? false,
                    totalPages: resultsObj?.maxPage ?? 1,
                    totalResults: resultsObj?.totalResults ?? items.length
                }
            };
        },
        getSuggestions: async (query)=>{
            const resultsObj = await fetchHindiApi('/search', {
                q: query,
                page: 1
            });
            const list = Array.isArray(resultsObj?.results) ? resultsObj.results : [];
            return list.map(normalizeHindiCard).slice(0, 5);
        },
        filter: async (params)=>{
            const resultsObj = await fetchHindiApi('/filter', params);
            const list = Array.isArray(resultsObj?.results) ? resultsObj.results : [];
            return {
                items: list.map(normalizeHindiCard),
                pagination: {
                    currentPage: resultsObj?.currentPage ?? 1,
                    hasNextPage: resultsObj?.hasNextPage ?? false,
                    totalPages: resultsObj?.maxPage ?? 1,
                    totalResults: resultsObj?.totalResults ?? list.length
                }
            };
        },
        getDetails: async (id)=>{
            const [info, recommendationsData, relatedData] = await Promise.all([
                fetchHindiApi(`/anime/${id}`),
                fetchHindiApi(`/anime/${id}/recommendations`).catch(()=>[]),
                fetchHindiApi(`/anime/${id}/related`).catch(()=>[])
            ]);
            if (!info) throw new Error('Anime not found');
            // API returns episodes at info.episodes.episodes[] (nested)
            const rawEpisodes = info.episodes?.episodes || info.episodes || [];
            const episodeList = Array.isArray(rawEpisodes) ? rawEpisodes.map((e)=>({
                    id: e.id || '',
                    number: e.number ? String(e.number) : '1',
                    url: e.href || '',
                    title: e.title || `Episode ${e.number}`,
                    image: info.image || ''
                })) : [];
            return {
                id,
                title: info.title || info.name || 'Unknown Title',
                englishTitle: info.title || info.name || '',
                nativeTitle: info.titleJp || info.native || info.title || info.name || '',
                image: info.image || info.poster || '',
                banner: info.cover || info.banner || info.image || '',
                type: info.type || 'TV',
                synopsis: info.synopsis || info.description || '',
                status: info.status || 'Unknown',
                rating: info.rating && !info.rating.includes('/10') && !/^\d+(\.\d+)?$/.test(String(info.rating).trim()) && !/mal|score/i.test(String(info.rating)) ? info.rating : info.isAdult ? '18+' : 'PG-13',
                premiered: info.premiered || info.releaseDate || '',
                season: '',
                aired: info.aired || info.releaseDate || '',
                episodesCount: String(episodeList.length || ''),
                studios: Array.isArray(info.studios) ? info.studios : [],
                producers: Array.isArray(info.producers) ? info.producers : [],
                genres: Array.isArray(info.genres) ? info.genres : [],
                synonyms: Array.isArray(info.alternativeTitles) ? info.alternativeTitles : [],
                episodes: episodeList,
                recommendations: Array.isArray(recommendationsData) ? recommendationsData.map(normalizeHindiCard) : [],
                related: Array.isArray(relatedData) ? relatedData.map(normalizeHindiCard) : [],
                downloads: [],
                dataId: id
            };
        },
        getStream: async (episodeId)=>{
            // Episode IDs from the API are like "31910::1-1"
            // The watch endpoint is /watch/{episodeId} directly
            const streamData = await fetchHindiApi(`/watch/${encodeURIComponent(episodeId)}`);
            const defaultReferer = streamData?.sources?.[0]?.referer || 'https://blakiteapi.xyz/';
            // Raw CDN links (e.g. rumble.cloud) are Referer-gated hotlink protection —
            // a plain <video src="..."> can never send a custom Referer, so the raw
            // link 403s and playback silently never starts. Always route real
            const toPlayableUrl = (rawUrl, referer)=>{
                if (!rawUrl) return '';
                return `/api/proxy?url=${encodeURIComponent(rawUrl)}&referer=${encodeURIComponent(referer || defaultReferer)}`;
            };
            // Map sources from the API response
            const seenRawUrls = new Set();
            const mappedServers = streamData?.sources ? streamData.sources.map((s, idx)=>{
                const rawUrl = s.url || s.m3u8 || '';
                if (rawUrl) seenRawUrls.add(rawUrl);
                const isMp4 = rawUrl.toLowerCase().includes('.mp4');
                // Use the API-provided proxyUrl (omni-api), which is Edge-enabled and supports Range requests
                const bestUrl = s.proxyUrl || toPlayableUrl(rawUrl, s.referer);
                return {
                    name: s.server || `Server ${idx + 1}`,
                    url: bestUrl,
                    isEmbed: !s.m3u8 && !rawUrl.includes('.m3u8') && !isMp4
                };
            }).filter((s)=>s.url) : [];
            // Also include servers from the servers.dub/sub arrays, deduped against
            // the RAW url (not the proxied one) so we don't add a second, broken,
            // un-proxied copy of a server we already mapped above.
            if (streamData?.servers) {
                const dubServers = streamData.servers.dub || [];
                const subServers = streamData.servers.sub || [];
                [
                    ...dubServers,
                    ...subServers
                ].forEach((s)=>{
                    if (s.url && !seenRawUrls.has(s.url)) {
                        seenRawUrls.add(s.url);
                        const isMp4 = s.url.toLowerCase().includes('.mp4');
                        const isEmbed = !s.url.includes('.m3u8') && !isMp4;
                        mappedServers.push({
                            name: s.name || `Server ${mappedServers.length + 1}`,
                            url: toPlayableUrl(s.url, s.referer),
                            isEmbed
                        });
                    }
                });
            }
            mappedServers.sort((a, b)=>{
                const getScore = (s)=>{
                    if (s.url.toLowerCase().includes('.mp4')) return 3;
                    if (!s.isEmbed) return 2; // m3u8
                    return 1; // embed
                };
                return getScore(b) - getScore(a);
            });
            const primaryUrl = mappedServers[0]?.url || toPlayableUrl(streamData?.url, defaultReferer);
            const referer = defaultReferer;
            return {
                id: episodeId,
                iframe: primaryUrl,
                targetUrl: primaryUrl,
                serverUsed: mappedServers[0]?.name || 'Blakite',
                servers: mappedServers,
                nextEpisode: null,
                prevEpisode: null,
                episodes: [],
                stream: primaryUrl ? {
                    file: primaryUrl
                } : {
                    error: 'No stream found'
                },
                subtitles: streamData?.sources?.[0]?.tracks || [],
                intro: null,
                outro: null,
                isM3U8: streamData?.isM3U8 ?? false,
                referer
            };
        },
        getQtip: async (dataId)=>{
            const details = await this.hindi.getDetails(dataId);
            return {
                name: details.title,
                description: details.synopsis,
                rating: details.rating,
                quality: 'HD',
                type: details.type || 'TV',
                japaneseTitle: details.nativeTitle,
                status: details.status,
                aired: details.aired,
                genres: details.genres
            };
        }
    };
    bridge = {
        getSmartDetails: async (id)=>{
            const details = await this.hindi.getDetails(id);
            if (!details) throw new Error('Anime not found');
            return {
                ...details,
                satoruId: null
            };
        }
    };
}
const hpi = new HPIClient();
}),
"[project]/src/app/hindi-watch/[id]/WatchClient.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/app/hindi-watch/[id]/WatchClient.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/hindi-watch/[id]/WatchClient.tsx <module evaluation>", "default");
}),
"[project]/src/app/hindi-watch/[id]/WatchClient.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/app/hindi-watch/[id]/WatchClient.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/hindi-watch/[id]/WatchClient.tsx", "default");
}),
"[project]/src/app/hindi-watch/[id]/WatchClient.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$hindi$2d$watch$2f5b$id$5d2f$WatchClient$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/app/hindi-watch/[id]/WatchClient.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$hindi$2d$watch$2f5b$id$5d2f$WatchClient$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/src/app/hindi-watch/[id]/WatchClient.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$hindi$2d$watch$2f5b$id$5d2f$WatchClient$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/src/app/hindi-watch/[id]/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Page,
    "generateMetadata",
    ()=>generateMetadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$hpi$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/hpi.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$hindi$2d$watch$2f5b$id$5d2f$WatchClient$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/hindi-watch/[id]/WatchClient.tsx [app-rsc] (ecmascript)");
;
;
;
async function generateMetadata(props, parent) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const id = params.id;
    const ep = searchParams?.ep ? String(searchParams.ep) : null;
    const data = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$hpi$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hpi"].hindi.getDetails(id).catch(()=>null);
    if (!data) {
        return {
            title: 'Watch Hindi Dubbed Anime Online Free HD | Shadow Garden',
            description: 'Stream top anime dubbed in Hindi online for free in HD on Shadow Garden. Enjoy high quality Hindi audio with zero buffering.'
        };
    }
    const cleanTitle = data.title || 'Hindi Anime';
    const epText = ep ? ` Episode ${ep}` : '';
    const cleanDesc = (data.synopsis || `Watch ${cleanTitle} Hindi Dubbed in High Definition.`).replace(/<[^>]*>?/gm, '').slice(0, 180).trim();
    const seoTitle = `Watch ${cleanTitle}${epText} Hindi Dubbed Online Free HD`;
    const seoDesc = `Watch ${cleanTitle}${epText} in Hindi Audio online for free in 1080p Full HD on Shadow Garden. Stream all Hindi dubbed anime episodes with high speed servers. ${cleanDesc}...`;
    const canonicalUrl = `https://shadow-garden.site/hindi-watch/${encodeURIComponent(id)}${ep ? `?ep=${ep}` : ''}`;
    const posterUrl = data.image || 'https://shadow-garden.site/og-image.png';
    const keywords = [
        `watch ${cleanTitle} in hindi`,
        `${cleanTitle} hindi dubbed`,
        `${cleanTitle} hindi episodes`,
        `${cleanTitle} episode 1 hindi`,
        `stream ${cleanTitle} hindi`,
        'watch hindi dubbed anime free',
        'hindi anime online',
        'hindi anime download',
        'shadow garden hindi'
    ];
    return {
        title: seoTitle,
        description: seoDesc,
        keywords,
        alternates: {
            canonical: canonicalUrl
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1
            }
        },
        openGraph: {
            title: `Watch ${cleanTitle}${epText} Hindi Dubbed - Shadow Garden`,
            description: seoDesc,
            url: canonicalUrl,
            siteName: 'Shadow Garden',
            images: [
                {
                    url: posterUrl,
                    width: 1200,
                    height: 630,
                    alt: `Watch ${cleanTitle} in Hindi`
                }
            ],
            type: 'video.other'
        },
        twitter: {
            card: 'summary_large_image',
            title: seoTitle,
            description: seoDesc,
            images: [
                posterUrl
            ],
            creator: '@ShadowGarden'
        }
    };
}
async function Page() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$hindi$2d$watch$2f5b$id$5d2f$WatchClient$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
        fileName: "[project]/src/app/hindi-watch/[id]/page.tsx",
        lineNumber: 89,
        columnNumber: 10
    }, this);
}
}),
"[project]/src/app/hindi-watch/[id]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/hindi-watch/[id]/page.tsx [app-rsc] (ecmascript)"));
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__cee04b51._.js.map