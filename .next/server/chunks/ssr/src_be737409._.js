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
"[project]/src/lib/mentions.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderMentions",
    ()=>RenderMentions,
    "processMentionsAndNotify",
    ()=>processMentionsAndNotify
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
;
;
;
function RenderMentions({ content, className = '' }) {
    if (!content) return null;
    // Regex to match @username or @[username]
    const mentionRegex = /(@[a-zA-Z0-9_-]+|@\[[a-zA-Z0-9_\s-]+\])/g;
    const parts = content.split(mentionRegex);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: className,
        children: parts.map((part, index)=>{
            if (part.match(/^@[a-zA-Z0-9_-]+$/)) {
                const username = part.slice(1);
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    href: `/profile/${encodeURIComponent(username)}`,
                    onClick: (e)=>e.stopPropagation(),
                    className: "text-red-500 hover:text-red-400 font-bold hover:underline cursor-pointer transition-colors inline-block mx-0.5",
                    children: part
                }, index, false, {
                    fileName: "[project]/src/lib/mentions.tsx",
                    lineNumber: 26,
                    columnNumber: 13
                }, this);
            } else if (part.match(/^@\[[a-zA-Z0-9_\s-]+\]$/)) {
                const username = part.slice(2, -1);
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    href: `/profile/${encodeURIComponent(username)}`,
                    onClick: (e)=>e.stopPropagation(),
                    className: "text-red-500 hover:text-red-400 font-bold hover:underline cursor-pointer transition-colors inline-block mx-0.5",
                    children: [
                        "@",
                        username
                    ]
                }, index, true, {
                    fileName: "[project]/src/lib/mentions.tsx",
                    lineNumber: 38,
                    columnNumber: 13
                }, this);
            }
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].Fragment, {
                children: part
            }, index, false, {
                fileName: "[project]/src/lib/mentions.tsx",
                lineNumber: 48,
                columnNumber: 16
            }, this);
        })
    }, void 0, false, {
        fileName: "[project]/src/lib/mentions.tsx",
        lineNumber: 21,
        columnNumber: 5
    }, this);
}
async function processMentionsAndNotify(supabase, content, senderId, senderName, targetType = 'post') {
    if (!supabase || !content || !senderId) return;
    const matches = content.match(/@([a-zA-Z0-9_-]+)/g);
    if (!matches || matches.length === 0) return;
    const rawUsernames = Array.from(new Set(matches.map((m)=>m.slice(1))));
    // Ignore @all or system tags
    const validUsernames = rawUsernames.filter((u)=>u.toLowerCase() !== 'all' && u.toLowerCase() !== 'everyone');
    if (validUsernames.length === 0) return;
    try {
        const { data: targetUsers } = await supabase.from('profiles').select('id, username').in('username', validUsernames);
        if (targetUsers && targetUsers.length > 0) {
            const notifications = targetUsers.filter((u)=>u.id !== senderId) // Don't notify self
            .map((u)=>({
                    user_id: u.id,
                    type: 'MENTION',
                    content: `🔔 @${senderName || 'Someone'} mentioned you in a ${targetType}: "${content.slice(0, 100)}..."`
                }));
            if (notifications.length > 0) {
                await supabase.from('notifications').insert(notifications);
            }
        }
    } catch (err) {
        console.error('Error processing mention notifications:', err);
    }
}
}),
"[project]/src/hooks/useIsMobile.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useIsMobile",
    ()=>useIsMobile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const checkIsMobile = undefined;
    }, [
        breakpoint
    ]);
    return isMobile;
}
}),
];

//# sourceMappingURL=src_be737409._.js.map