module.exports = [
"[project]/src/lib/dpi.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dpi",
    ()=>dpi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
const getDonghuaApiBase = ()=>`${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiManager"].getBaseUrl()}/donghua`;
async function fetchDonghuaApi(endpoint, params = {}, retryCount = 0) {
    const queryParts = Object.entries(params).filter(([, v])=>v !== undefined && v !== null && v !== '').map(([k, v])=>`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    // 1. First Priority: Try native local route (fast, resilient, 0 CORS issues)
    if (retryCount === 0) {
        try {
            const localBase = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getBaseURL"])();
            const localUrl = `${localBase}/api/donghua${endpoint}${queryString}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(()=>controller.abort(), 12000);
            const localRes = await fetch(localUrl, {
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(timeoutId);
            if (localRes.ok) {
                const json = await localRes.json();
                if (json && json.ok && json.data) {
                    return json.data;
                }
            }
        } catch (localErr) {
        // Gracefully fall back to remote ApiManager
        }
    }
    // 2. Second Priority: Fallback to ApiManager remote mirrors
    const targetUrl = `${getDonghuaApiBase()}${endpoint}${queryString}`;
    const proxyUrl = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : targetUrl;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), 15000);
        const response = await fetch(proxyUrl, {
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            if (retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
                return fetchDonghuaApi(endpoint, params, retryCount + 1);
            }
            return null;
        }
        const json = await response.json();
        if (json && typeof json === 'object') {
            if ('ok' in json) {
                if (!json.ok) {
                    if (retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
                        return fetchDonghuaApi(endpoint, params, retryCount + 1);
                    }
                    return null;
                }
                return json.data ?? json;
            }
            if ('data' in json) return json.data;
        }
        return json;
    } catch (innerError) {
        if (innerError?.name === 'AbortError' || innerError?.message && innerError.message.includes('fetch')) {
            if (retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
                return fetchDonghuaApi(endpoint, params, retryCount + 1);
            }
        }
        return null;
    }
}
const dpi = {
    async getHome (page = 1) {
        const res = await fetchDonghuaApi('/home', {
            page
        });
        const sections = [];
        if (res?.spotlight?.length > 0) {
            sections.push({
                title: 'Spotlight',
                items: res.spotlight
            });
        }
        if (res?.latestEpisodes?.length > 0) {
            sections.push({
                title: 'Latest Episodes',
                items: res.latestEpisodes
            });
        }
        if (res?.newRelease?.length > 0) {
            sections.push({
                title: 'New Releases',
                items: res.newRelease
            });
        }
        if (res?.newAdded?.length > 0) {
            sections.push({
                title: 'Recently Added',
                items: res.newAdded
            });
        }
        if (res?.topDay?.length > 0) {
            sections.push({
                title: 'Popular Today',
                items: res.topDay
            });
        }
        // Fallback if everything is empty
        if (sections.length === 0) {
            const latest = Array.isArray(res) ? res : [];
            sections.push({
                title: 'Latest Episodes',
                items: latest
            });
        }
        return {
            sections
        };
    },
    async search (query, page = 1) {
        const res = await fetchDonghuaApi(`/search/${encodeURIComponent(query)}`, {
            page
        });
        return res || [];
    },
    async filter (params) {
        const res = await fetchDonghuaApi('/filter', params);
        const data = res?.results || res || [];
        return Array.isArray(data) ? data : [];
    },
    async getInfo (id) {
        const res = await fetchDonghuaApi(`/info/${encodeURIComponent(id)}`);
        return res;
    },
    async getServers (id) {
        const res = await fetchDonghuaApi('/servers', {
            id
        });
        return res || [];
    },
    async getStream (episodeId) {
        const res = await fetchDonghuaApi('/watch', {
            id: episodeId
        });
        const rawServers = Array.isArray(res?.servers) ? res.servers : Array.isArray(res?.sources) ? res.sources.map((s, i)=>({
                name: s.quality || `Server ${i + 1}`,
                url: s.url || ''
            })) : res?.url ? [
            {
                name: 'Default',
                url: res.url
            }
        ] : [];
        let subtitles = Array.isArray(res?.subtitles) && res.subtitles.length > 0 ? res.subtitles : [];
        const hlsServer = rawServers.find((s)=>s.type === 'hls' || s.url?.includes('.m3u8') || s.url?.includes('/api/proxy'));
        let finalUrl = hlsServer?.url || res?.iframe || res?.url || rawServers[0]?.url || '';
        if (finalUrl && finalUrl.includes('donghuaplanet.com') && !finalUrl.includes('.m3u8')) {
            try {
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(finalUrl)}&referer=${encodeURIComponent('https://donghuaworld.com/')}`;
                const htmlRes = await fetch(proxyUrl);
                const html = await htmlRes.text();
                const sourcesMatch = html.match(/(?:const\s+sources\s*=\s*|sources:\s*)(\[[\s\S]*?\]);?/i);
                const tracksMatch = html.match(/(?:const\s+tracks\s*=\s*|tracks:\s*)(\[[\s\S]*?\]);?/i);
                if (sourcesMatch) {
                    const sources = JSON.parse(sourcesMatch[1]);
                    const autoStream = sources.find((s)=>s.label === 'Auto' || s.file?.includes('.m3u8')) || sources[0];
                    if (autoStream && autoStream.file) {
                        finalUrl = `/api/proxy?url=${encodeURIComponent(autoStream.file)}&referer=${encodeURIComponent('https://donghuaworld.com/')}`;
                    }
                }
                if (tracksMatch && subtitles.length === 0) {
                    const tracks = JSON.parse(tracksMatch[1]);
                    subtitles = tracks.filter((t)=>t.label).map((t)=>({
                            lang: t.label,
                            url: `/api/proxy?url=${encodeURIComponent(t.file)}&referer=${encodeURIComponent('https://donghuaworld.com/')}`
                        }));
                }
            } catch (e) {
                console.error('Failed to extract DonghuaPlanet stream:', e);
            }
        }
        return {
            servers: rawServers,
            url: finalUrl,
            iframe: finalUrl,
            nextEpDate: res?.nextEpDate || null,
            subtitles: subtitles,
            intro: res?.intro || null,
            outro: res?.outro || null,
            referer: res?.referer || null
        };
    },
    bridge: {
        getSmartDetails: async (id)=>{
            const info = await fetchDonghuaApi(`/info/${encodeURIComponent(id)}`);
            if (!info) throw new Error('Anime not found');
            const detail = info?.detail || info;
            const episodesData = info?.episodes?.episodes || info?.episodes || [];
            return {
                id: detail?.id || detail?.slug || id,
                title: detail?.title || detail?.name || 'Unknown Title',
                nativeTitle: (detail?.alternativeTitles || [])[0] || '',
                image: detail?.image || '',
                banner: detail?.image || '',
                type: detail?.type || 'TV',
                synopsis: detail?.synopsis || '',
                status: 'Ongoing',
                rating: detail?.rating || 'PG-13',
                premiered: '',
                aired: '',
                episodesCount: String(episodesData.length || 0),
                studios: detail?.studios || [],
                producers: detail?.producers || [],
                genres: detail?.genres || [],
                synonyms: detail?.alternativeTitles || [],
                episodes: episodesData.map((e)=>{
                    const numRaw = String(e.number || '1');
                    const numMatch = numRaw.match(/^\s*(\d+)/);
                    const numClean = numMatch ? numMatch[1] : numRaw.replace(/\D/g, '') || numRaw;
                    return {
                        id: e.id || e.href || numClean,
                        number: numClean,
                        url: e.href || '',
                        title: e.title || `Episode ${numClean}`,
                        image: detail?.image || ''
                    };
                }),
                recommendations: [],
                downloads: [],
                satoruId: null
            };
        }
    }
};
}),
];

//# sourceMappingURL=src_lib_dpi_ts_a8598a10._.js.map