(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/dpi.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dpi",
    ()=>dpi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
const getDonghuaApiBase = ()=>"".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiManager"].getBaseUrl(), "/donghua");
async function fetchDonghuaApi(endpoint) {
    let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, retryCount = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
    const queryParts = Object.entries(params).filter((param)=>{
        let [, v] = param;
        return v !== undefined && v !== null && v !== '';
    }).map((param)=>{
        let [k, v] = param;
        return "".concat(encodeURIComponent(k), "=").concat(encodeURIComponent(String(v)));
    });
    const queryString = queryParts.length > 0 ? "?".concat(queryParts.join('&')) : '';
    // 1. First Priority: Try native local route (fast, resilient, 0 CORS issues)
    if (retryCount === 0) {
        try {
            const localBase = ("TURBOPACK compile-time truthy", 1) ? '' : "TURBOPACK unreachable";
            const localUrl = "".concat(localBase, "/api/donghua").concat(endpoint).concat(queryString);
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
    const targetUrl = "".concat(getDonghuaApiBase()).concat(endpoint).concat(queryString);
    const proxyUrl = ("TURBOPACK compile-time truthy", 1) ? "/api/proxy?url=".concat(encodeURIComponent(targetUrl)) : "TURBOPACK unreachable";
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), 15000);
        const response = await fetch(proxyUrl, {
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            if (retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
                return fetchDonghuaApi(endpoint, params, retryCount + 1);
            }
            return null;
        }
        const json = await response.json();
        if (json && typeof json === 'object') {
            if ('ok' in json) {
                if (!json.ok) {
                    if (retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
                        return fetchDonghuaApi(endpoint, params, retryCount + 1);
                    }
                    return null;
                }
                var _json_data;
                return (_json_data = json.data) !== null && _json_data !== void 0 ? _json_data : json;
            }
            if ('data' in json) return json.data;
        }
        return json;
    } catch (innerError) {
        if ((innerError === null || innerError === void 0 ? void 0 : innerError.name) === 'AbortError' || (innerError === null || innerError === void 0 ? void 0 : innerError.message) && innerError.message.includes('fetch')) {
            if (retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
                return fetchDonghuaApi(endpoint, params, retryCount + 1);
            }
        }
        return null;
    }
}
const dpi = {
    async getHome () {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        var _res_spotlight, _res_latestEpisodes, _res_newRelease, _res_newAdded, _res_topDay;
        const res = await fetchDonghuaApi('/home', {
            page
        });
        const sections = [];
        if ((res === null || res === void 0 ? void 0 : (_res_spotlight = res.spotlight) === null || _res_spotlight === void 0 ? void 0 : _res_spotlight.length) > 0) {
            sections.push({
                title: 'Spotlight',
                items: res.spotlight
            });
        }
        if ((res === null || res === void 0 ? void 0 : (_res_latestEpisodes = res.latestEpisodes) === null || _res_latestEpisodes === void 0 ? void 0 : _res_latestEpisodes.length) > 0) {
            sections.push({
                title: 'Latest Episodes',
                items: res.latestEpisodes
            });
        }
        if ((res === null || res === void 0 ? void 0 : (_res_newRelease = res.newRelease) === null || _res_newRelease === void 0 ? void 0 : _res_newRelease.length) > 0) {
            sections.push({
                title: 'New Releases',
                items: res.newRelease
            });
        }
        if ((res === null || res === void 0 ? void 0 : (_res_newAdded = res.newAdded) === null || _res_newAdded === void 0 ? void 0 : _res_newAdded.length) > 0) {
            sections.push({
                title: 'Recently Added',
                items: res.newAdded
            });
        }
        if ((res === null || res === void 0 ? void 0 : (_res_topDay = res.topDay) === null || _res_topDay === void 0 ? void 0 : _res_topDay.length) > 0) {
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
    async search (query) {
        let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
        const res = await fetchDonghuaApi("/search/".concat(encodeURIComponent(query)), {
            page
        });
        return res || [];
    },
    async filter (params) {
        const res = await fetchDonghuaApi('/filter', params);
        const data = (res === null || res === void 0 ? void 0 : res.results) || res || [];
        return Array.isArray(data) ? data : [];
    },
    async getInfo (id) {
        const res = await fetchDonghuaApi("/info/".concat(encodeURIComponent(id)));
        return res;
    },
    async getServers (id) {
        const res = await fetchDonghuaApi('/servers', {
            id
        });
        return res || [];
    },
    async getStream (episodeId) {
        var _rawServers_;
        const res = await fetchDonghuaApi('/watch', {
            id: episodeId
        });
        const rawServers = Array.isArray(res === null || res === void 0 ? void 0 : res.servers) ? res.servers : Array.isArray(res === null || res === void 0 ? void 0 : res.sources) ? res.sources.map((s, i)=>({
                name: s.quality || "Server ".concat(i + 1),
                url: s.url || ''
            })) : (res === null || res === void 0 ? void 0 : res.url) ? [
            {
                name: 'Default',
                url: res.url
            }
        ] : [];
        let subtitles = Array.isArray(res === null || res === void 0 ? void 0 : res.subtitles) && res.subtitles.length > 0 ? res.subtitles : [];
        const hlsServer = rawServers.find((s)=>{
            var _s_url, _s_url1;
            return s.type === 'hls' || ((_s_url = s.url) === null || _s_url === void 0 ? void 0 : _s_url.includes('.m3u8')) || ((_s_url1 = s.url) === null || _s_url1 === void 0 ? void 0 : _s_url1.includes('/api/proxy'));
        });
        let finalUrl = (hlsServer === null || hlsServer === void 0 ? void 0 : hlsServer.url) || (res === null || res === void 0 ? void 0 : res.iframe) || (res === null || res === void 0 ? void 0 : res.url) || ((_rawServers_ = rawServers[0]) === null || _rawServers_ === void 0 ? void 0 : _rawServers_.url) || '';
        if (finalUrl && finalUrl.includes('donghuaplanet.com') && !finalUrl.includes('.m3u8')) {
            try {
                const proxyUrl = "/api/proxy?url=".concat(encodeURIComponent(finalUrl), "&referer=").concat(encodeURIComponent('https://donghuaworld.com/'));
                const htmlRes = await fetch(proxyUrl);
                const html = await htmlRes.text();
                const sourcesMatch = html.match(/(?:const\s+sources\s*=\s*|sources:\s*)(\[[\s\S]*?\]);?/i);
                const tracksMatch = html.match(/(?:const\s+tracks\s*=\s*|tracks:\s*)(\[[\s\S]*?\]);?/i);
                if (sourcesMatch) {
                    const sources = JSON.parse(sourcesMatch[1]);
                    const autoStream = sources.find((s)=>{
                        var _s_file;
                        return s.label === 'Auto' || ((_s_file = s.file) === null || _s_file === void 0 ? void 0 : _s_file.includes('.m3u8'));
                    }) || sources[0];
                    if (autoStream && autoStream.file) {
                        finalUrl = "/api/proxy?url=".concat(encodeURIComponent(autoStream.file), "&referer=").concat(encodeURIComponent('https://donghuaworld.com/'));
                    }
                }
                if (tracksMatch && subtitles.length === 0) {
                    const tracks = JSON.parse(tracksMatch[1]);
                    subtitles = tracks.filter((t)=>t.label).map((t)=>({
                            lang: t.label,
                            url: "/api/proxy?url=".concat(encodeURIComponent(t.file), "&referer=").concat(encodeURIComponent('https://donghuaworld.com/'))
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
            nextEpDate: (res === null || res === void 0 ? void 0 : res.nextEpDate) || null,
            subtitles: subtitles,
            intro: (res === null || res === void 0 ? void 0 : res.intro) || null,
            outro: (res === null || res === void 0 ? void 0 : res.outro) || null,
            referer: (res === null || res === void 0 ? void 0 : res.referer) || null
        };
    },
    bridge: {
        getSmartDetails: async (id)=>{
            var _info_episodes;
            const info = await fetchDonghuaApi("/info/".concat(encodeURIComponent(id)));
            if (!info) throw new Error('Anime not found');
            const detail = (info === null || info === void 0 ? void 0 : info.detail) || info;
            const episodesData = (info === null || info === void 0 ? void 0 : (_info_episodes = info.episodes) === null || _info_episodes === void 0 ? void 0 : _info_episodes.episodes) || (info === null || info === void 0 ? void 0 : info.episodes) || [];
            return {
                id: (detail === null || detail === void 0 ? void 0 : detail.id) || (detail === null || detail === void 0 ? void 0 : detail.slug) || id,
                title: (detail === null || detail === void 0 ? void 0 : detail.title) || (detail === null || detail === void 0 ? void 0 : detail.name) || 'Unknown Title',
                nativeTitle: ((detail === null || detail === void 0 ? void 0 : detail.alternativeTitles) || [])[0] || '',
                image: (detail === null || detail === void 0 ? void 0 : detail.image) || '',
                banner: (detail === null || detail === void 0 ? void 0 : detail.image) || '',
                type: (detail === null || detail === void 0 ? void 0 : detail.type) || 'TV',
                synopsis: (detail === null || detail === void 0 ? void 0 : detail.synopsis) || '',
                status: 'Ongoing',
                rating: (detail === null || detail === void 0 ? void 0 : detail.rating) || 'PG-13',
                premiered: '',
                aired: '',
                episodesCount: String(episodesData.length || 0),
                studios: (detail === null || detail === void 0 ? void 0 : detail.studios) || [],
                producers: (detail === null || detail === void 0 ? void 0 : detail.producers) || [],
                genres: (detail === null || detail === void 0 ? void 0 : detail.genres) || [],
                synonyms: (detail === null || detail === void 0 ? void 0 : detail.alternativeTitles) || [],
                episodes: episodesData.map((e)=>{
                    const numRaw = String(e.number || '1');
                    const numMatch = numRaw.match(/^\s*(\d+)/);
                    const numClean = numMatch ? numMatch[1] : numRaw.replace(/\D/g, '') || numRaw;
                    return {
                        id: e.id || e.href || numClean,
                        number: numClean,
                        url: e.href || '',
                        title: e.title || "Episode ".concat(numClean),
                        image: (detail === null || detail === void 0 ? void 0 : detail.image) || ''
                    };
                }),
                recommendations: [],
                downloads: [],
                satoruId: null
            };
        }
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_lib_dpi_ts_f9da1dce._.js.map