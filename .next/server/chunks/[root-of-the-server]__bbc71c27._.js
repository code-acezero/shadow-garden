module.exports = [
"[project]/src/lib/supabase.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSupabaseBrowserClient",
    ()=>getSupabaseBrowserClient,
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$110$2e$8$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@supabase+supabase-js@2.110.8/node_modules/@supabase/supabase-js/dist/index.mjs [instrumentation] (ecmascript) <locals>");
;
// Singleton instance container
let supabaseInstance = null;
const getSupabaseBrowserClient = ()=>{
    if (!supabaseInstance) {
        const url = ("TURBOPACK compile-time value", "https://kacgsuabfdqcskjonzkl.supabase.co") || '';
        const key = ("TURBOPACK compile-time value", "sb_publishable_UOBkqQdOw4XFiO2CMmrmyw_kALwbMGw") || '';
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        supabaseInstance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$110$2e$8$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(url, key);
    }
    return supabaseInstance;
};
const supabase = getSupabaseBrowserClient();
}),
"[project]/src/lib/extractors/streamExtractor.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/extractors/streamExtractor.ts
// Unified Stream Extractor for Shadow Garden
// Consolidates Japanese Sub/Dub, English Dub, Chinese Donghua, and Hindi Dub into a single standard interface.
__turbopack_context__.s([
    "decryptMegaPlayEnc",
    ()=>decryptMegaPlayEnc,
    "extractMegaPlayStream",
    ()=>extractMegaPlayStream,
    "fetchAnikotoWatchDubStream",
    ()=>fetchAnikotoWatchDubStream,
    "fetchBlakiteHindiStream",
    ()=>fetchBlakiteHindiStream,
    "fetchZokoMalStream",
    ()=>fetchZokoMalStream,
    "resolveMalIdByTitleOrSlug",
    ()=>resolveMalIdByTitleOrSlug,
    "resolveUnifiedStreams",
    ()=>resolveUnifiedStreams,
    "xorDecrypt",
    ()=>xorDecrypt
]);
const streamCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;
function xorDecrypt(base64Str, key = 'otaku-embed-v1') {
    try {
        let binary;
        if (typeof Buffer !== 'undefined') {
            binary = Buffer.from(base64Str, 'base64');
        } else if (typeof atob !== 'undefined') {
            const raw = atob(base64Str);
            binary = new Uint8Array(raw.length);
            for(let i = 0; i < raw.length; i++){
                binary[i] = raw.charCodeAt(i);
            }
        } else {
            return '';
        }
        const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
        const keyBytes = encoder ? encoder.encode(key) : new Uint8Array(Array.from(key).map((c)=>c.charCodeAt(0)));
        const out = new Uint8Array(binary.length);
        for(let i = 0; i < binary.length; i++){
            out[i] = binary[i] ^ keyBytes[i % keyBytes.length];
        }
        if (typeof TextDecoder !== 'undefined') {
            return new TextDecoder('utf-8').decode(out);
        }
        return String.fromCharCode.apply(null, Array.from(out));
    } catch (e) {
        return '';
    }
}
async function fetchZokoMalStream(malId, episode, mode = 'sub') {
    try {
        const embedUrl = `https://zokoanime.video/stream/mal/${malId}/${episode}/${mode}`;
        const controller = new AbortController();
        const timer = setTimeout(()=>controller.abort(), 8500);
        const res = await fetch(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://hianime.at/'
            },
            signal: controller.signal
        });
        clearTimeout(timer);
        if (!res.ok) return null;
        const html = await res.text();
        const pMatch = html.match(/window\.__P\s*=\s*["']([^"']+)["']/i);
        if (!pMatch) return null;
        const decrypted = xorDecrypt(pMatch[1]);
        if (!decrypted) return null;
        const parsed = JSON.parse(decrypted);
        if (!parsed || !parsed.src) return null;
        const subtitles = Array.isArray(parsed.subtitles) ? parsed.subtitles.filter((s)=>s && s.src).map((s)=>({
                url: s.src,
                lang: s.lang || 'en',
                label: s.label || s.lang || 'English',
                default: s.default || s.lang === 'en'
            })) : [];
        return {
            url: parsed.src,
            subtitles,
            intro: parsed.intro || parsed.skip?.intro || null,
            outro: parsed.outro || parsed.skip?.outro || null
        };
    } catch (err) {
        return null;
    }
}
async function fetchBlakiteHindiStream(title, episode) {
    try {
        const base = 'https://omni-api-v1.vercel.app/api/blakite';
        const cleanSearch = title.replace(/\(TV\)|\(Movie\)|\(Dub\)|\(Sub\)|Season\s*\d+/gi, '').trim();
        const searchRes = await fetch(`${base}/search?q=${encodeURIComponent(cleanSearch)}`, {
            cache: 'no-store'
        });
        if (!searchRes.ok) return null;
        const searchJson = await searchRes.json();
        const results = searchJson.data?.results || [];
        if (!results.length) return null;
        const cleanInput = cleanSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matched = results.find((r)=>{
            const cleanTarget = (r.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanTarget.includes(cleanInput) || cleanInput.includes(cleanTarget);
        }) || results[0];
        const detailRes = await fetch(`${base}/anime/${matched.id}`, {
            cache: 'no-store'
        });
        if (!detailRes.ok) return null;
        const detailJson = await detailRes.json();
        const episodesList = detailJson.data?.episodes?.episodes || detailJson.data?.episodes || [];
        const targetEpNum = Number(episode);
        const epObj = episodesList.find((e)=>Number(e.number) === targetEpNum) || episodesList[0];
        if (!epObj) return null;
        const watchRes = await fetch(`${base}/watch/${encodeURIComponent(epObj.id)}`, {
            cache: 'no-store'
        });
        if (!watchRes.ok) return null;
        const watchJson = await watchRes.json();
        const watchData = watchJson.data;
        if (!watchData) return null;
        const servers = [];
        // Direct Rumble Cloud CDN video URL
        if (watchData.url) {
            const isM3U8 = watchData.isM3U8 === true || watchData.url.includes('.m3u8');
            servers.push({
                serverId: 'rumble-cdn',
                serverName: 'Rumble Cloud',
                url: watchData.url,
                type: isM3U8 ? 'm3u8' : 'mp4',
                referer: 'https://blakiteapi.xyz/'
            });
        }
        // Additional sources from Blakite response if available
        if (Array.isArray(watchData.sources)) {
            for (const src of watchData.sources){
                if (src.url && src.url !== watchData.url) {
                    const isM3U8 = !!src.m3u8 || src.url.includes('.m3u8');
                    servers.push({
                        serverId: `blakite-${src.server || 'mirror'}`,
                        serverName: src.server || 'Blakite',
                        url: src.url,
                        type: isM3U8 ? 'm3u8' : 'mp4',
                        referer: src.referer || 'https://blakiteapi.xyz/'
                    });
                }
            }
        }
        return servers.length > 0 ? servers : null;
    } catch (err) {
        return null;
    }
}
async function decryptMegaPlayEnc(enc) {
    try {
        const encKey = new TextEncoder().encode('i?LMTAx0Q6,:}50U');
        const keyBytes = new Uint8Array(32);
        keyBytes.set(encKey.subarray(0, Math.min(32, encKey.length)));
        const cryptoKey = await globalThis.crypto.subtle.importKey('raw', keyBytes, {
            name: 'AES-CBC'
        }, false, [
            'decrypt'
        ]);
        const iv = new TextEncoder().encode("W0;27ToaUpl_P%'c");
        let b = enc.replace(/-/g, '+').replace(/_/g, '/');
        while(b.length % 4)b += '=';
        let binStr;
        if (typeof atob !== 'undefined') {
            binStr = atob(b);
        } else if (typeof Buffer !== 'undefined') {
            binStr = Buffer.from(b, 'base64').toString('binary');
        } else {
            return null;
        }
        const cipherBytes = new Uint8Array(binStr.length);
        for(let i = 0; i < binStr.length; i++)cipherBytes[i] = binStr.charCodeAt(i);
        const decBuffer = await globalThis.crypto.subtle.decrypt({
            name: 'AES-CBC',
            iv
        }, cryptoKey, cipherBytes);
        return new TextDecoder().decode(decBuffer);
    } catch  {
        return null;
    }
}
async function extractMegaPlayStream(embedUrl) {
    try {
        const urlMatch = embedUrl.match(/\/stream\/s-2\/(\d+)\//);
        if (!urlMatch) return {
            m3u8: null
        };
        let realId = urlMatch[1];
        // If this is a dub embed or specific track, fetch the embed page HTML to extract the exact data-id
        try {
            const pageRes = await fetch(embedUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Referer': 'https://anikoto.net/'
                },
                signal: AbortSignal.timeout(3500)
            });
            if (pageRes.ok) {
                const html = await pageRes.text();
                const dataIdMatch = html.match(/data-id=["'](\d+)["']/);
                if (dataIdMatch && dataIdMatch[1]) {
                    realId = dataIdMatch[1];
                }
            }
        } catch  {}
        const isTcdn = embedUrl.includes('s=tcdn');
        const getSourcesUrl = `https://megaplay.buzz/videojs/stream/getSources?id=${realId}${isTcdn ? '&s=tcdn' : ''}`;
        const controller = new AbortController();
        const timeout = setTimeout(()=>controller.abort(), 4500);
        const res = await fetch(getSourcesUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://megaplay.buzz/',
                'X-Requested-With': 'XMLHttpRequest'
            },
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) return {
            m3u8: null
        };
        const data = await res.json();
        if (!data?.enc) return {
            m3u8: null
        };
        const dec = await decryptMegaPlayEnc(data.enc);
        if (!dec) return {
            m3u8: null
        };
        const json = JSON.parse(dec);
        return {
            m3u8: json.file || null,
            tracks: data.tracks || [],
            intro: data.intro || null,
            outro: data.outro || null
        };
    } catch  {
        return {
            m3u8: null
        };
    }
}
function parseWatchResponse(text) {
    if (!text) return null;
    const trimmed = text.trim();
    try {
        const parsed = JSON.parse(trimmed);
        if (parsed?.data?.sources?.length || parsed?.sources?.length) {
            return parsed.data ? parsed : {
                data: parsed
            };
        }
    } catch  {}
    const lines = trimmed.split('\n');
    const collectedSources = [];
    let collectedServers = [];
    let skipData = null;
    let episodeData = null;
    for (const line of lines){
        const l = line.trim();
        if (!l.startsWith('data:')) continue;
        const payload = l.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
            const obj = JSON.parse(payload);
            if (obj.type === 'source' && obj.source) {
                collectedSources.push(obj.source);
            } else if (obj.type === 'sources' && Array.isArray(obj.sources)) {
                collectedSources.push(...obj.sources);
            } else if (obj.data?.sources && Array.isArray(obj.data.sources)) {
                collectedSources.push(...obj.data.sources);
            } else if (obj.type === 'servers' && Array.isArray(obj.servers)) {
                collectedServers = obj.servers;
            } else if (obj.type === 'skip_data' && obj.skip_data) {
                skipData = obj.skip_data;
            } else if (obj.type === 'episode' && obj.episode) {
                episodeData = obj.episode;
            }
        } catch  {}
    }
    return {
        data: {
            sources: collectedSources,
            servers: collectedServers,
            skip_data: skipData,
            episode: episodeData
        }
    };
}
// In-memory MAL ID cache to avoid redundant slug/title lookups
const malIdCache = new Map();
async function resolveMalIdByTitleOrSlug(titleOrSlug) {
    const key = (titleOrSlug || '').toLowerCase().trim();
    if (!key) return null;
    if (malIdCache.has(key)) return malIdCache.get(key);
    const mirrors = [
        'https://omni-api-v1.vercel.app/api',
        'https://omni-api-v2.vercel.app/api'
    ];
    try {
        let slug = titleOrSlug;
        if (!/-[a-z0-9]{5}$/.test(slug)) {
            const clean = titleOrSlug.replace(/::\d+$/, '').replace(/\(TV\)|\(Movie\)|\(Dub\)|\(Sub\)|Season\s*\d+|Part\s*\d+/gi, '').replace(/-/g, ' ').trim();
            for (const mirror of mirrors){
                try {
                    const sRes = await fetch(`${mirror}/search?keyword=${encodeURIComponent(clean)}`, {
                        signal: AbortSignal.timeout(3500)
                    });
                    if (sRes.ok) {
                        const sJson = await sRes.json();
                        const top = sJson.data?.results?.[0];
                        if (top?.slug) {
                            slug = top.slug;
                            break;
                        }
                    }
                } catch  {}
            }
        }
        for (const mirror of mirrors){
            try {
                const epRes = await fetch(`${mirror}/anime/${encodeURIComponent(slug)}/episodes`, {
                    signal: AbortSignal.timeout(3500)
                });
                if (epRes.ok) {
                    const epJson = await epRes.json();
                    const firstEp = epJson.data?.episodes?.[0];
                    if (firstEp?.dataMal) {
                        const parsed = parseInt(firstEp.dataMal, 10);
                        if (!isNaN(parsed) && parsed > 0) {
                            malIdCache.set(key, parsed);
                            return parsed;
                        }
                    }
                }
            } catch  {}
        }
    } catch  {}
    return null;
}
async function fetchAnikotoWatchDubStream(titleOrSlug, episode) {
    const mirrors = [
        'https://omni-api-v1.vercel.app/api',
        'https://omni-api-v2.vercel.app/api',
        'https://omni-api-v3.vercel.app/api'
    ];
    try {
        let slug = titleOrSlug;
        const isExactHashedSlug = /-[a-z0-9]{5}$/.test(slug);
        if (!isExactHashedSlug) {
            const searchKeyword = titleOrSlug.replace(/::\d+$/, '').replace(/\(TV\)|\(Movie\)|\(Dub\)|\(Sub\)|Season\s*\d+|Part\s*\d+/gi, '').replace(/-/g, ' ').trim();
            for (const mirror of mirrors){
                try {
                    const searchRes = await fetch(`${mirror}/search?keyword=${encodeURIComponent(searchKeyword)}`, {
                        signal: AbortSignal.timeout(4000)
                    });
                    if (searchRes.ok) {
                        const json = await searchRes.json();
                        const results = json.data?.results || [];
                        if (results.length > 0) {
                            slug = results[0].slug;
                            break;
                        }
                    }
                } catch  {}
            }
        }
        let watchJson = null;
        for (const mirror of mirrors){
            try {
                const watchRes = await fetch(`${mirror}/watch/${encodeURIComponent(slug)}?ep=${episode}`, {
                    signal: AbortSignal.timeout(5000)
                });
                if (watchRes.ok) {
                    const text = await watchRes.text();
                    const parsed = parseWatchResponse(text);
                    if (parsed?.data?.sources?.length || parsed?.sources?.length) {
                        watchJson = parsed.data ? parsed : {
                            data: parsed
                        };
                        break;
                    }
                }
            } catch  {}
        }
        // Fallback: If slug didn't produce watch sources, search by clean title and retry watch
        if (!watchJson?.data?.sources?.length && isExactHashedSlug) {
            const fallbackTitle = titleOrSlug.replace(/-[a-z0-9]{5}$/, '').replace(/\(TV\)|\(Movie\)|\(Dub\)|\(Sub\)|Season\s*\d+|Part\s*\d+/gi, '').replace(/-/g, ' ').trim();
            for (const mirror of mirrors){
                try {
                    const searchRes = await fetch(`${mirror}/search?keyword=${encodeURIComponent(fallbackTitle)}`, {
                        signal: AbortSignal.timeout(4000)
                    });
                    if (searchRes.ok) {
                        const sJson = await searchRes.json();
                        const results = sJson.data?.results || [];
                        if (results.length > 0) {
                            const newSlug = results[0].slug;
                            const wRes = await fetch(`${mirror}/watch/${encodeURIComponent(newSlug)}?ep=${episode}`, {
                                signal: AbortSignal.timeout(5000)
                            });
                            if (wRes.ok) {
                                const text = await wRes.text();
                                const parsed = parseWatchResponse(text);
                                if (parsed?.data?.sources?.length || parsed?.sources?.length) {
                                    watchJson = parsed.data ? parsed : {
                                        data: parsed
                                    };
                                    break;
                                }
                            }
                        }
                    }
                } catch  {}
            }
        }
        const sources = watchJson?.data?.sources || [];
        const dubSources = sources.filter((s)=>s && s.type === 'dub' && s.url);
        if (!dubSources.length) {
            return null;
        }
        // Process all sources in parallel: extract direct .m3u8 if available, fallback to embed
        const serverPromises = dubSources.map(async (src, index)=>{
            const rawName = String(src.server || '').toLowerCase();
            let serverName = 'Vidstream';
            let serverId = `vidstream-dub-${index + 1}`;
            if (rawName.includes('vidstream-1')) {
                serverName = 'Vidstream';
                serverId = 'vidstream-dub';
            } else if (rawName.includes('vidstream') || rawName.includes('2')) {
                serverName = 'Vidstreaming';
                serverId = 'vidstreaming-dub';
            } else if (rawName.includes('hd')) {
                serverName = 'MegaCloud Mirror';
                serverId = 'megacloud-mirror-dub';
            }
            // Extract direct .m3u8 stream from MegaPlay
            const direct = await extractMegaPlayStream(src.url).catch(()=>null);
            if (direct?.m3u8) {
                return {
                    serverId,
                    serverName,
                    url: direct.m3u8,
                    type: 'm3u8',
                    referer: 'https://megaplay.buzz/',
                    tracks: direct.tracks,
                    intro: direct.intro,
                    outro: direct.outro
                };
            }
            // If direct extraction fails, provide playable embed URL as resilient backup
            return {
                serverId: `${serverId}-embed`,
                serverName: `${serverName} (Embed)`,
                url: src.url,
                type: src.url.includes('.m3u8') ? 'm3u8' : 'embed',
                referer: 'https://megaplay.buzz/'
            };
        });
        const resolved = await Promise.all(serverPromises);
        // Prioritize direct .m3u8 streams first, then rank Vidstream > Vidstreaming > MegaCloud Mirror > Embed
        const rank = (s)=>{
            const typeRank = s.type === 'm3u8' ? 0 : 10;
            if (s.serverName.startsWith('Vidstream')) return typeRank + 1;
            if (s.serverName.startsWith('Vidstreaming')) return typeRank + 2;
            if (s.serverName.startsWith('MegaCloud')) return typeRank + 3;
            return typeRank + 4;
        };
        resolved.sort((a, b)=>rank(a) - rank(b));
        return resolved.length > 0 ? resolved : null;
    } catch (err) {
        console.error('[fetchAnikotoWatchDubStream] Exception:', err);
        return null;
    }
}
async function resolveUnifiedStreams({ malId, title, episode = 1, countryOfOrigin = 'JP', knownHasDub = false }) {
    const epNum = Number(episode) || 1;
    let origin = (countryOfOrigin || 'JP').toUpperCase();
    // Smart origin fallback if countryOfOrigin is default 'JP'
    if (origin === 'JP') {
        const lowerTitle = (title || '').toLowerCase();
        if (/(?:douluo|dalu|donghua|soul land|battle through the heavens|perfect world|swallowed star|link click|shiguang|immortal king|xian wang|tian guan|mo dao|a will eternal|tales of demons)\b/.test(lowerTitle)) {
            origin = 'CN';
        } else if (/(?:lookism)\b/.test(lowerTitle)) {
            origin = 'KR';
        }
    }
    const isChinese = origin === 'CN';
    const isKorean = origin === 'KR';
    const primarySubId = isChinese ? 'cn' : isKorean ? 'kr' : 'jp';
    const primarySubLabel = isChinese ? 'CN • Sub' : isKorean ? 'KR • Sub' : 'JP • Sub';
    const primaryLanguage = isChinese ? 'Chinese' : isKorean ? 'Korean' : 'Japanese';
    // Check cache (only valid if at least one server array was non-empty)
    const cacheKey = `${malId || title}_${epNum}_${primarySubId}`;
    const cached = streamCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        if (cached.data.servers[primarySubId]?.length > 0 || cached.data.servers.en?.length > 0) {
            return cached.data;
        }
    }
    const serversByAudio = {
        [primarySubId]: [],
        en: [],
        hi: []
    };
    let globalSubtitles = [];
    let introData = null;
    let outroData = null;
    // Resolve MAL ID if not provided directly
    let effectiveMalId = malId ? Number(malId) : undefined;
    if (!effectiveMalId) {
        const resolved = await resolveMalIdByTitleOrSlug(title);
        if (resolved) effectiveMalId = resolved;
    }
    // Run Sub, English Dub, and Hindi resolution in parallel
    const fetchPromises = [];
    // A. Primary Sub via ZokoAnime (if MAL ID available)
    if (effectiveMalId) {
        fetchPromises.push(fetchZokoMalStream(effectiveMalId, epNum, 'sub').then((subRes)=>{
            if (subRes?.url) {
                serversByAudio[primarySubId].push({
                    serverId: 'megacloud-sub',
                    serverName: 'MegaCloud',
                    url: subRes.url,
                    type: 'm3u8',
                    referer: 'https://zokoanime.video/',
                    tracks: subRes.subtitles?.map((s)=>({
                            file: s.url,
                            label: s.label,
                            default: s.default
                        })),
                    intro: subRes.intro,
                    outro: subRes.outro
                });
                if (subRes.subtitles?.length) globalSubtitles = subRes.subtitles;
                if (subRes.intro) introData = subRes.intro;
                if (subRes.outro) outroData = subRes.outro;
            }
        }));
    }
    // B1. English Dub via ZokoAnime Direct HLS (High Availability Direct .m3u8 + Subtitles + Auto-Skip)
    if (effectiveMalId) {
        fetchPromises.push(fetchZokoMalStream(effectiveMalId, epNum, 'dub').then((dubRes)=>{
            if (dubRes?.url) {
                serversByAudio.en.push({
                    serverId: 'megacloud-dub',
                    serverName: 'MegaCloud',
                    url: dubRes.url,
                    type: 'm3u8',
                    referer: 'https://zokoanime.video/',
                    tracks: dubRes.subtitles?.map((s)=>({
                            file: s.url,
                            label: s.label,
                            default: s.default
                        })),
                    intro: dubRes.intro,
                    outro: dubRes.outro
                });
                if (dubRes.subtitles?.length && !globalSubtitles.length) {
                    globalSubtitles = dubRes.subtitles;
                }
                if (dubRes.intro && !introData) introData = dubRes.intro;
                if (dubRes.outro && !outroData) outroData = dubRes.outro;
            }
        }));
    }
    // B2. English Dub via Anikoto (MegaPlay / Vidstream / Vidstreaming)
    fetchPromises.push(fetchAnikotoWatchDubStream(title, epNum).then((dubServers)=>{
        if (dubServers?.length) {
            for (const s of dubServers){
                // Avoid duplicate URLs
                if (!serversByAudio.en.some((existing)=>existing.url === s.url)) {
                    serversByAudio.en.push(s);
                }
            }
            const withTracks = dubServers.find((s)=>s.tracks && s.tracks.length > 0);
            if (withTracks && withTracks.tracks && !globalSubtitles.length) {
                globalSubtitles = withTracks.tracks.map((t)=>({
                        url: t.file,
                        lang: t.label?.toLowerCase()?.slice(0, 2) || 'en',
                        label: t.label || 'English',
                        default: !!t.default
                    }));
            }
            const withIntro = dubServers.find((s)=>s.intro);
            if (withIntro?.intro && !introData) introData = withIntro.intro;
            const withOutro = dubServers.find((s)=>s.outro);
            if (withOutro?.outro && !outroData) outroData = withOutro.outro;
        }
    }));
    // C. Hindi Dub via Blakite
    fetchPromises.push(fetchBlakiteHindiStream(title, epNum).then((hindiServers)=>{
        if (hindiServers?.length) {
            serversByAudio.hi.push(...hindiServers);
        }
    }));
    await Promise.allSettled(fetchPromises);
    // If Sub only has 1 server and it's m3u8, synthesize Vidstreaming mirror for failover UI
    if (serversByAudio[primarySubId].length === 1 && serversByAudio[primarySubId][0].type === 'm3u8') {
        const primary = serversByAudio[primarySubId][0];
        serversByAudio[primarySubId].push({
            serverId: 'vidstreaming-sub',
            serverName: 'Vidstreaming',
            url: primary.url,
            type: primary.type,
            referer: primary.referer,
            tracks: primary.tracks,
            intro: primary.intro,
            outro: primary.outro
        });
    }
    // If English Dub only has 1 direct m3u8 server, synthesize Vidstreaming mirror for failover UI
    if (serversByAudio.en.length === 1 && serversByAudio.en[0].type === 'm3u8') {
        const primaryDub = serversByAudio.en[0];
        serversByAudio.en.push({
            serverId: 'vidstreaming-dub',
            serverName: 'Vidstreaming',
            url: primaryDub.url,
            type: primaryDub.type,
            referer: primaryDub.referer,
            tracks: primaryDub.tracks,
            intro: primaryDub.intro,
            outro: primaryDub.outro
        });
    }
    // Sort English Dub servers so direct m3u8 comes before embed
    serversByAudio.en.sort((a, b)=>{
        if (a.type === 'm3u8' && b.type !== 'm3u8') return -1;
        if (a.type !== 'm3u8' && b.type === 'm3u8') return 1;
        return 0;
    });
    // Synchronize captions and intro/outro markers across ALL audio tracks (JP, EN, HI)
    for (const audioKey of Object.keys(serversByAudio)){
        for (const server of serversByAudio[audioKey]){
            if ((!server.tracks || server.tracks.length === 0) && globalSubtitles.length > 0) {
                server.tracks = globalSubtitles.map((s)=>({
                        file: s.url,
                        label: s.label,
                        default: s.default
                    }));
            }
            if (!server.intro && introData) server.intro = introData;
            if (!server.outro && outroData) server.outro = outroData;
        }
    }
    // Ensure universal aliases exist in serversByAudio
    if (!serversByAudio.sub || serversByAudio.sub.length === 0) {
        serversByAudio.sub = serversByAudio[primarySubId] || [];
    }
    if (!serversByAudio.dub || serversByAudio.dub.length === 0) {
        serversByAudio.dub = serversByAudio.en || [];
    }
    if (!serversByAudio.jp || serversByAudio.jp.length === 0) {
        serversByAudio.jp = serversByAudio[primarySubId] || [];
    }
    // Build clean AudioTrack options
    const hasSub = serversByAudio[primarySubId].length > 0;
    const hasEnDub = serversByAudio.en.length > 0 || knownHasDub;
    const hasHindi = serversByAudio.hi.length > 0;
    const audioTracks = [
        {
            id: primarySubId,
            label: primarySubLabel,
            language: primaryLanguage,
            type: 'sub',
            available: hasSub
        },
        {
            id: 'en',
            label: 'EN • Dub',
            language: 'English',
            type: 'dub',
            available: hasEnDub
        },
        {
            id: 'hi',
            label: 'HI • Dub',
            language: 'Hindi',
            type: 'dub',
            available: hasHindi
        }
    ];
    const result = {
        audioTracks,
        servers: serversByAudio,
        subtitles: globalSubtitles,
        intro: introData,
        outro: outroData
    };
    // Only cache if servers were successfully found
    if (serversByAudio[primarySubId].length > 0 || serversByAudio.en.length > 0) {
        streamCache.set(cacheKey, {
            timestamp: Date.now(),
            data: result
        });
    }
    return result;
}
}),
"[externals]/node:dns [external] (node:dns, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:dns", () => require("node:dns"));

module.exports = mod;
}),
"[externals]/node:assert [external] (node:assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:assert", () => require("node:assert"));

module.exports = mod;
}),
"[externals]/node:net [external] (node:net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:net", () => require("node:net"));

module.exports = mod;
}),
"[externals]/node:http [external] (node:http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:http", () => require("node:http"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/node:querystring [external] (node:querystring, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:querystring", () => require("node:querystring"));

module.exports = mod;
}),
"[externals]/node:events [external] (node:events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:events", () => require("node:events"));

module.exports = mod;
}),
"[externals]/node:diagnostics_channel [external] (node:diagnostics_channel, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:diagnostics_channel", () => require("node:diagnostics_channel"));

module.exports = mod;
}),
"[externals]/node:util [external] (node:util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:util", () => require("node:util"));

module.exports = mod;
}),
"[externals]/node:tls [external] (node:tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:tls", () => require("node:tls"));

module.exports = mod;
}),
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:zlib [external] (node:zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:zlib", () => require("node:zlib"));

module.exports = mod;
}),
"[externals]/node:perf_hooks [external] (node:perf_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:perf_hooks", () => require("node:perf_hooks"));

module.exports = mod;
}),
"[externals]/node:util/types [external] (node:util/types, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:util/types", () => require("node:util/types"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/node:worker_threads [external] (node:worker_threads, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:worker_threads", () => require("node:worker_threads"));

module.exports = mod;
}),
"[externals]/node:http2 [external] (node:http2, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:http2", () => require("node:http2"));

module.exports = mod;
}),
"[externals]/node:url [external] (node:url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:url", () => require("node:url"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/node:console [external] (node:console, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:console", () => require("node:console"));

module.exports = mod;
}),
"[externals]/node:fs/promises [external] (node:fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs/promises", () => require("node:fs/promises"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:timers [external] (node:timers, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:timers", () => require("node:timers"));

module.exports = mod;
}),
"[project]/src/lib/anilist.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/anilist.ts
// Native AniList GraphQL Client for Shadow Garden
// Serves as the primary metadata & catalog provider for all anime (excluding Hindi and Donghua).
__turbopack_context__.s([
    "AniListService",
    ()=>AniListService
]);
const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';
// In-memory cache for fast repeat lookups (TTL 5 mins)
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
// Setup resilient DNS lookup for Node.js SSR runtime
let nodeDispatcher = null;
if ("TURBOPACK compile-time truthy", 1) {
    try {
        const dns = __turbopack_context__.r("[externals]/node:dns [external] (node:dns, cjs)");
        const { Agent } = __turbopack_context__.r("[project]/node_modules/.pnpm/undici@7.29.0/node_modules/undici/index.js [instrumentation] (ecmascript)");
        const resolver = new dns.promises.Resolver();
        resolver.setServers([
            '8.8.8.8',
            '1.1.1.1',
            '8.8.4.4',
            '1.0.0.1'
        ]);
        nodeDispatcher = new Agent({
            connect: {
                lookup: (hostname, options, callback)=>{
                    if (typeof options === 'function') {
                        callback = options;
                        options = {};
                    }
                    resolver.resolve4(hostname).then((ips)=>{
                        if (options && options.all) {
                            callback(null, ips.map((ip)=>({
                                    address: ip,
                                    family: 4
                                })));
                        } else {
                            callback(null, ips[0], 4);
                        }
                    }).catch((err)=>dns.lookup(hostname, options, callback));
                }
            }
        });
    } catch  {}
}
async function queryAniList(query, variables = {}) {
    const cacheKey = JSON.stringify({
        query,
        variables
    });
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
        return cached.data;
    }
    const isBrowser = "undefined" !== 'undefined';
    const targetUrl = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : ANILIST_GRAPHQL_ENDPOINT;
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), 12000);
    const fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            query,
            variables
        }),
        signal: controller.signal
    };
    if (!isBrowser && nodeDispatcher) {
        fetchOptions.dispatcher = nodeDispatcher;
    }
    try {
        const res = await fetch(targetUrl, fetchOptions);
        clearTimeout(timer);
        if (!res.ok) {
            console.warn(`[AniList] GraphQL request failed with status: ${res.status}`);
            return null;
        }
        const json = await res.json();
        if (json.errors) {
            console.warn('[AniList] GraphQL errors:', json.errors);
            return null;
        }
        const data = json.data;
        cache.set(cacheKey, {
            data,
            expires: Date.now() + CACHE_TTL_MS
        });
        return data;
    } catch (err) {
        console.error('[AniList] Fetch error:', err);
        return null;
    }
}
// Media Fields Fragment
const MEDIA_CARD_FIELDS = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  coverImage {
    extraLarge
    large
    medium
  }
  bannerImage
  format
  status
  episodes
  duration
  genres
  averageScore
  countryOfOrigin
  isAdult
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
`;
function cleanHtml(html) {
    if (!html) return '';
    return html.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>?/gm, '').trim();
}
function mapMediaToCard(media, overrideEp) {
    const title = media.title?.english || media.title?.romaji || media.title?.native || 'Unknown Title';
    const jname = media.title?.romaji || media.title?.native || '';
    const poster = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium || '';
    // Calculate current released episodes
    let currentEp = overrideEp || 0;
    if (!currentEp) {
        if (media.nextAiringEpisode?.episode) {
            currentEp = Math.max(1, media.nextAiringEpisode.episode - 1);
        } else if (media.status === 'FINISHED') {
            currentEp = media.episodes || 1;
        } else {
            currentEp = media.episodes || 1;
        }
    }
    return {
        id: String(media.id),
        title,
        jname,
        poster,
        type: media.format || 'TV',
        duration: media.duration ? `${media.duration}m` : undefined,
        episodes: {
            sub: currentEp,
            dub: currentEp,
            eps: media.episodes || currentEp
        },
        rank: media.averageScore,
        isAdult: !!media.isAdult,
        rating: media.averageScore ? `${(media.averageScore / 10).toFixed(1)}/10` : 'PG-13'
    };
}
class AniListService {
    /**
   * 1. LATEST AIRED EPISODES (Real-time updates as episodes broadcast)
   * Mirrors how Anikoto /latest updated, but with live broadcast timestamps!
   */ static async getRecentEpisodes(page = 1, perPage = 24) {
        const query = `
      query ($page: Int, $perPage: Int, $airingAt_lesser: Int) {
        Page(page: $page, perPage: $perPage) {
          airingSchedules(
            airingAt_lesser: $airingAt_lesser, 
            sort: TIME_DESC
          ) {
            id
            airingAt
            episode
            media {
              ${MEDIA_CARD_FIELDS}
            }
          }
        }
      }
    `;
        const now = Math.floor(Date.now() / 1000);
        const data = await queryAniList(query, {
            page,
            perPage: perPage * 2,
            airingAt_lesser: now
        });
        const schedules = data?.Page?.airingSchedules || [];
        const seenMediaIds = new Set();
        const results = [];
        for (const item of schedules){
            const media = item.media;
            if (!media) continue;
            // Filter strictly for Japanese anime (keeps Donghua separate)
            if (media.countryOfOrigin && media.countryOfOrigin !== 'JP') continue;
            // Prevent duplicate media entries in the same page batch
            if (seenMediaIds.has(media.id)) continue;
            seenMediaIds.add(media.id);
            const card = mapMediaToCard(media, item.episode);
            // Attach airing episode number
            card.episode = item.episode;
            card.airingAt = item.airingAt;
            results.push(card);
            if (results.length >= perPage) break;
        }
        return results;
    }
    /**
   * 2. SPOTLIGHT / TRENDING ANIME
   */ static async getSpotlight() {
        const query = `
      query {
        Page(page: 1, perPage: 10) {
          media(
            type: ANIME, 
            sort: TRENDING_DESC, 
            countryOfOrigin: "JP",
            isAdult: false
          ) {
            ${MEDIA_CARD_FIELDS}
            description(asHtml: false)
          }
        }
      }
    `;
        const data = await queryAniList(query);
        const list = data?.Page?.media || [];
        return list.map((item)=>({
                ...mapMediaToCard(item),
                description: cleanHtml(item.description),
                banner: item.bannerImage || item.coverImage?.extraLarge || item.coverImage?.large
            }));
    }
    /**
   * 3. HOME SECTIONS (Spotlight + Recent Updates)
   */ static async getHomeSections() {
        const [spotlight, recent] = await Promise.all([
            this.getSpotlight().catch(()=>[]),
            this.getRecentEpisodes(1, 24).catch(()=>[])
        ]);
        return {
            spotlight,
            recent
        };
    }
    /**
   * 4. TOP AIRING ANIME
   */ static async getTopAiring(page = 1, perPage = 24) {
        const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            status: RELEASING, 
            sort: POPULARITY_DESC, 
            countryOfOrigin: "JP"
          ) {
            ${MEDIA_CARD_FIELDS}
          }
        }
      }
    `;
        const data = await queryAniList(query, {
            page,
            perPage
        });
        return (data?.Page?.media || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 5. MOST POPULAR ANIME
   */ static async getMostPopular(page = 1, perPage = 24) {
        const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            sort: POPULARITY_DESC, 
            countryOfOrigin: "JP"
          ) {
            ${MEDIA_CARD_FIELDS}
          }
        }
      }
    `;
        const data = await queryAniList(query, {
            page,
            perPage
        });
        return (data?.Page?.media || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 6. TOP UPCOMING
   */ static async getTopUpcoming(page = 1, perPage = 24) {
        const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            status: NOT_YET_RELEASED, 
            sort: POPULARITY_DESC, 
            countryOfOrigin: "JP"
          ) {
            ${MEDIA_CARD_FIELDS}
          }
        }
      }
    `;
        const data = await queryAniList(query, {
            page,
            perPage
        });
        return (data?.Page?.media || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 7. COMPLETED ANIME
   */ static async getCompleted(page = 1, perPage = 24) {
        const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            status: FINISHED, 
            sort: POPULARITY_DESC, 
            countryOfOrigin: "JP"
          ) {
            ${MEDIA_CARD_FIELDS}
          }
        }
      }
    `;
        const data = await queryAniList(query, {
            page,
            perPage
        });
        return (data?.Page?.media || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 8. MOST FAVORITE ANIME
   */ static async getMostFavorite(page = 1, perPage = 24) {
        const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            sort: FAVOURITES_DESC, 
            countryOfOrigin: "JP"
          ) {
            ${MEDIA_CARD_FIELDS}
          }
        }
      }
    `;
        const data = await queryAniList(query, {
            page,
            perPage
        });
        return (data?.Page?.media || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 9. SEARCH ANIME
   */ static async search(keyword, page = 1, perPage = 24) {
        const query = `
      query ($search: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            currentPage
            hasNextPage
            lastPage
          }
          media(
            search: $search, 
            type: ANIME, 
            countryOfOrigin: "JP"
          ) {
            ${MEDIA_CARD_FIELDS}
          }
        }
      }
    `;
        const data = await queryAniList(query, {
            search: keyword,
            page,
            perPage
        });
        const pInfo = data?.Page?.pageInfo;
        const results = (data?.Page?.media || []).map((m)=>mapMediaToCard(m));
        return {
            results,
            currentPage: pInfo?.currentPage ?? page,
            hasNextPage: !!pInfo?.hasNextPage,
            hasPreviousPage: page > 1,
            maxPage: pInfo?.lastPage || (pInfo?.hasNextPage ? page + 1 : page),
            minPage: 1
        };
    }
    /**
   * 10. SEARCH SUGGESTIONS (Typeahead)
   */ static async getSearchSuggestions(keyword) {
        const query = `
      query ($search: String) {
        Page(page: 1, perPage: 8) {
          media(
            search: $search, 
            type: ANIME, 
            countryOfOrigin: "JP"
          ) {
            id
            title {
              english
              romaji
            }
            coverImage {
              medium
            }
            format
            duration
          }
        }
      }
    `;
        const data = await queryAniList(query, {
            search: keyword
        });
        return (data?.Page?.media || []).map((item)=>({
                id: String(item.id),
                title: item.title?.english || item.title?.romaji || 'Unknown Title',
                poster: item.coverImage?.medium || '',
                type: item.format || 'TV',
                duration: item.duration ? `${item.duration}m` : '?'
            }));
    }
    /**
   * 11. FILTER BY GENRE
   */ static async getByGenre(genre, page = 1, perPage = 24) {
        const query = `
      query ($genre: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            genre: $genre, 
            type: ANIME, 
            sort: POPULARITY_DESC, 
            countryOfOrigin: "JP"
          ) {
            ${MEDIA_CARD_FIELDS}
          }
        }
      }
    `;
        const data = await queryAniList(query, {
            genre,
            page,
            perPage
        });
        return (data?.Page?.media || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 11b. ADVANCED MULTI-CRITERIA FILTER
   */ static async filter(params) {
        const page = Number(params.page) || 1;
        const perPage = Number(params.perPage) || 24;
        const variables = {
            page,
            perPage
        };
        if (params.keyword?.trim()) {
            variables.search = params.keyword.trim();
        }
        if (params.genres || params.genre) {
            const raw = params.genres || params.genre;
            const arr = (Array.isArray(raw) ? raw : String(raw).split(',')).map((g)=>g.trim()).filter(Boolean);
            if (arr.length > 0) variables.genre_in = arr;
        }
        if (params.genre_exclude || params.excluded_genres) {
            const raw = params.genre_exclude || params.excluded_genres;
            const arr = (Array.isArray(raw) ? raw : String(raw).split(',')).map((g)=>g.trim()).filter(Boolean);
            if (arr.length > 0) variables.genre_not_in = arr;
        }
        if (params.type) {
            const t = String(params.type).toUpperCase().replace(/[\s-]/g, '_');
            if ([
                'TV',
                'TV_SHORT',
                'MOVIE',
                'SPECIAL',
                'OVA',
                'ONA',
                'MUSIC'
            ].includes(t)) {
                variables.format = t;
            }
        }
        if (params.status) {
            const s = String(params.status).toLowerCase();
            if (s.includes('finish') || s.includes('complete')) variables.status = 'FINISHED';
            else if (s.includes('air') || s.includes('ongoing')) variables.status = 'RELEASING';
            else if (s.includes('not') || s.includes('upcoming')) variables.status = 'NOT_YET_RELEASED';
        }
        if (params.season) {
            const s = String(params.season).toUpperCase();
            if ([
                'WINTER',
                'SPRING',
                'SUMMER',
                'FALL'
            ].includes(s)) {
                variables.season = s;
            }
        }
        if (params.year) {
            const y = parseInt(String(params.year), 10);
            if (!isNaN(y)) variables.seasonYear = y;
        }
        // Sort mapping
        let sorts = [
            'POPULARITY_DESC'
        ];
        if (params.sort) {
            const s = String(params.sort).toLowerCase();
            if (s === 'score' || s === 'top-score') sorts = [
                'SCORE_DESC',
                'POPULARITY_DESC'
            ];
            else if (s === 'name-az') sorts = [
                'TITLE_ROMAJI'
            ];
            else if (s === 'release-date') sorts = [
                'START_DATE_DESC'
            ];
            else if (s === 'latest-updated' || s === 'recent') sorts = [
                'UPDATED_AT_DESC'
            ];
            else if (s === 'latest-added') sorts = [
                'ID_DESC'
            ];
            else if (s === 'number_of_episodes') sorts = [
                'EPISODES_DESC'
            ];
            else if (s === 'trending') sorts = [
                'TRENDING_DESC'
            ];
        }
        variables.sort = sorts;
        const query = `
      query ($page: Int, $perPage: Int, $search: String, $genre_in: [String], $genre_not_in: [String], $format: MediaFormat, $status: MediaStatus, $season: MediaSeason, $seasonYear: Int, $sort: [MediaSort]) {
        Page(page: $page, perPage: $perPage) {
          media(
            search: $search,
            genre_in: $genre_in,
            genre_not_in: $genre_not_in,
            format: $format,
            status: $status,
            season: $season,
            seasonYear: $seasonYear,
            sort: $sort,
            type: ANIME,
            countryOfOrigin: "JP"
          ) {
            ${MEDIA_CARD_FIELDS}
          }
        }
      }
    `;
        const data = await queryAniList(query, variables);
        return (data?.Page?.media || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 12. ANIME INFO / DETAIL
   * Supports both numeric AniList IDs and string slugs/titles!
   */ static async getAnimeInfo(idOrSlug) {
        const isNumeric = /^\d+$/.test(idOrSlug.trim());
        const query = `
      query (${isNumeric ? '$id: Int' : '$search: String'}) {
        Media(${isNumeric ? 'id: $id' : 'search: $search'}, type: ANIME) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          description(asHtml: false)
          bannerImage
          coverImage {
            extraLarge
            large
            medium
          }
          format
          status
          episodes
          duration
          season
          seasonYear
          startDate {
            year
            month
            day
          }
          genres
          synonyms
          averageScore
          countryOfOrigin
          isAdult
          studios(isMain: true) {
            nodes {
              name
            }
          }
          nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
          }
          characters(sort: ROLE, perPage: 12) {
            edges {
              role
              node {
                id
                name {
                  full
                }
                image {
                  medium
                }
              }
              voiceActors(language: JAPANESE) {
                id
                name {
                  full
                }
                image {
                  medium
                }
                language
              }
            }
          }
          relations {
            edges {
              relationType
              node {
                id
                idMal
                title {
                  english
                  romaji
                }
                coverImage {
                  medium
                }
                format
                type
              }
            }
          }
          recommendations(perPage: 12, sort: RATING_DESC) {
            nodes {
              mediaRecommendation {
                id
                idMal
                title {
                  english
                  romaji
                }
                coverImage {
                  medium
                }
                averageScore
                format
              }
            }
          }
          streamingEpisodes {
            title
            thumbnail
            url
            site
          }
        }
      }
    `;
        const variables = {};
        if (isNumeric) {
            variables.id = parseInt(idOrSlug.trim(), 10);
        } else {
            variables.search = idOrSlug.replace(/-/g, ' ');
        }
        const data = await queryAniList(query, variables);
        const media = data?.Media;
        if (!media) return null;
        const slug = String(media.id);
        const cleanTitle = media.title?.english || media.title?.romaji || media.title?.native || 'Unknown Title';
        const cleanJname = media.title?.native || media.title?.romaji || '';
        const cleanPoster = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium || '';
        const cleanBanner = media.bannerImage || cleanPoster;
        const cleanDesc = cleanHtml(media.description);
        // Calculate released episode count
        let releasedCount = media.episodes || 0;
        if (media.nextAiringEpisode?.episode) {
            releasedCount = Math.max(1, media.nextAiringEpisode.episode - 1);
        } else if (media.streamingEpisodes && media.streamingEpisodes.length > 0) {
            releasedCount = Math.max(releasedCount, media.streamingEpisodes.length);
        }
        if (releasedCount === 0 && media.status === 'RELEASING') {
            releasedCount = 1;
        }
        // Build episode list
        const episodeList = [];
        const streamEpMap = new Map();
        if (Array.isArray(media.streamingEpisodes)) {
            media.streamingEpisodes.forEach((sep)=>{
                const match = sep.title?.match(/Episode\s+(\d+)/i) || sep.url?.match(/episode-(\d+)/i);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (!streamEpMap.has(num)) streamEpMap.set(num, sep);
                }
            });
        }
        const totalToGenerate = Math.max(releasedCount, media.episodes || 0);
        for(let i = 1; i <= totalToGenerate; i++){
            const streamEp = streamEpMap.get(i);
            episodeList.push({
                id: `${slug}::${i}`,
                number: i,
                title: streamEp?.title || `Episode ${i}`,
                isFiller: false,
                isDub: true,
                isSub: true,
                hasDub: true,
                hasSub: true,
                malId: media.idMal || undefined
            });
        }
        // Normalize characters
        const characters = [];
        if (Array.isArray(media.characters?.edges)) {
            media.characters.edges.forEach((edge)=>{
                const charNode = edge.node;
                const va = edge.voiceActors?.[0];
                if (charNode) {
                    characters.push({
                        id: String(charNode.id),
                        name: charNode.name?.full || 'Unknown',
                        poster: charNode.image?.medium || '',
                        role: edge.role || 'MAIN',
                        voiceActor: va ? {
                            id: String(va.id),
                            name: va.name?.full || '',
                            poster: va.image?.medium || '',
                            language: va.language || 'Japanese'
                        } : undefined
                    });
                }
            });
        }
        // Normalize relations
        const related = [];
        if (Array.isArray(media.relations?.edges)) {
            media.relations.edges.forEach((edge)=>{
                const rNode = edge.node;
                if (rNode && rNode.type === 'ANIME') {
                    related.push({
                        id: String(rNode.id),
                        title: rNode.title?.english || rNode.title?.romaji || 'Unknown',
                        poster: rNode.coverImage?.medium || '',
                        type: edge.relationType || rNode.format || 'ANIME'
                    });
                }
            });
        }
        // Normalize recommendations
        const recommendations = [];
        if (Array.isArray(media.recommendations?.nodes)) {
            media.recommendations.nodes.forEach((n)=>{
                const recMedia = n.mediaRecommendation;
                if (recMedia) {
                    recommendations.push({
                        id: String(recMedia.id),
                        title: recMedia.title?.english || recMedia.title?.romaji || 'Unknown',
                        poster: recMedia.coverImage?.medium || '',
                        type: recMedia.format || 'TV',
                        rank: recMedia.averageScore
                    });
                }
            });
        }
        const studioNames = (media.studios?.nodes || []).map((s)=>s.name).filter(Boolean);
        return {
            id: slug,
            title: cleanTitle,
            jname: cleanJname,
            poster: cleanPoster,
            description: cleanDesc,
            isAdult: !!media.isAdult,
            malId: media.idMal || undefined,
            countryOfOrigin: media.countryOfOrigin || 'JP',
            stats: {
                rating: media.averageScore ? `${(media.averageScore / 10).toFixed(1)}/10` : 'PG-13',
                quality: 'HD',
                duration: media.duration ? `${media.duration}m` : '24m',
                type: media.format || 'TV',
                malScore: media.averageScore ? String(media.averageScore / 10) : '?',
                episodes: {
                    sub: releasedCount,
                    dub: releasedCount
                }
            },
            info: {
                status: media.status || 'Finished',
                genres: media.genres || [],
                studios: studioNames,
                producers: [],
                aired: media.startDate?.year ? `${media.startDate.year}` : '?',
                premiered: media.season && media.seasonYear ? `${media.season} ${media.seasonYear}` : '?',
                japanese: cleanJname,
                synonyms: (media.synonyms || []).join(', ')
            },
            episodes: episodeList,
            characters,
            recommendations,
            related,
            seasons: [],
            trailers: []
        };
    }
    /**
   * 13. EPISODES
   */ static async getEpisodes(idOrSlug) {
        const info = await this.getAnimeInfo(idOrSlug);
        return info?.episodes || [];
    }
    /**
   * 14. AIRING SCHEDULE
   */ static async getSchedule(date, tzOffsetHours = 0) {
        try {
            const targetDate = new Date(date);
            const parsedTime = isNaN(targetDate.getTime()) ? new Date() : targetDate;
            const startOfDay = Math.floor(new Date(parsedTime.getFullYear(), parsedTime.getMonth(), parsedTime.getDate(), 0, 0, 0).getTime() / 1000) - tzOffsetHours * 3600;
            const endOfDay = startOfDay + 86400;
            const query = `
        query ($airingAt_greater: Int, $airingAt_lesser: Int) {
          Page(page: 1, perPage: 50) {
            airingSchedules(
              airingAt_greater: $airingAt_greater,
              airingAt_lesser: $airingAt_lesser,
              sort: TIME
            ) {
              id
              airingAt
              timeUntilAiring
              episode
              media {
                id
                title {
                  english
                  romaji
                  native
                }
                countryOfOrigin
              }
            }
          }
        }
      `;
            const data = await queryAniList(query, {
                airingAt_greater: startOfDay,
                airingAt_lesser: endOfDay
            });
            const schedules = (data?.Page?.airingSchedules || []).filter((item)=>item.media && (!item.media.countryOfOrigin || item.media.countryOfOrigin === 'JP'));
            return {
                scheduledAnimes: schedules.map((item)=>{
                    const airDate = new Date(item.airingAt * 1000);
                    const timeStr = airDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                    return {
                        id: String(item.media.id),
                        time: timeStr,
                        name: item.media.title?.english || item.media.title?.romaji || 'Unknown Title',
                        jname: item.media.title?.romaji || item.media.title?.native || '',
                        timestamp: item.airingAt,
                        secondsUntilAiring: item.timeUntilAiring,
                        episode: item.episode
                    };
                })
            };
        } catch (err) {
            console.error("[AniList.getSchedule] Error:", err);
            return {
                scheduledAnimes: []
            };
        }
    }
    /**
   * 15. TOOLTIP / QUICK INFO
   */ static async getTooltip(id) {
        const info = await this.getAnimeInfo(id);
        if (!info) return null;
        return {
            id: info.id,
            title: info.title,
            jname: info.jname,
            poster: info.poster,
            description: info.description,
            rating: info.stats?.rating,
            quality: info.stats?.quality,
            duration: info.stats?.duration,
            type: info.stats?.type,
            genres: info.info?.genres,
            studios: info.info?.studios?.join(', '),
            isAdult: info.isAdult
        };
    }
}
}),
"[project]/src/lib/api.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ANIKOTO_GENRE_MAP",
    ()=>ANIKOTO_GENRE_MAP,
    "AnimeAPI_Anikoto",
    ()=>AnimeAPI_Anikoto,
    "AnimeService",
    ()=>AnimeService,
    "ApiManager",
    ()=>ApiManager,
    "BASE_URL",
    ()=>BASE_URL,
    "BASE_URL_V4",
    ()=>BASE_URL_V4,
    "ImageAPI",
    ()=>ImageAPI,
    "POOL_V2",
    ()=>POOL_V2,
    "POOL_V3",
    ()=>POOL_V3,
    "UserAPI",
    ()=>UserAPI,
    "WatchlistAPI",
    ()=>WatchlistAPI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$extractors$2f$streamExtractor$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/extractors/streamExtractor.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/anilist.ts [instrumentation] (ecmascript)");
;
;
;
class ApiManager {
    static urls = [
        'https://omni-api-v1.vercel.app/api',
        'https://omni-api-v2.vercel.app/api'
    ];
    static currentIndex = 0;
    static getBaseUrl() {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return this.urls[this.currentIndex];
    }
    static rotateUrl() {
        this.currentIndex = (this.currentIndex + 1) % this.urls.length;
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.warn(`[ApiManager] Rotated API URL to: ${this.urls[this.currentIndex]}`);
        return this.urls[this.currentIndex];
    }
    static getAllUrls() {
        return this.urls;
    }
}
const BASE_URL = ApiManager.getBaseUrl();
const POOL_V2 = [];
const POOL_V3 = [];
const BASE_URL_V4 = BASE_URL;
// ==========================================
//  2. SHARED UTILS
// ==========================================
const normalizeList = (item)=>{
    if (!item) return [];
    if (Array.isArray(item)) return item.filter((i)=>typeof i === 'string').map((i)=>i.trim());
    if (typeof item === 'string') {
        return item.includes(',') ? item.split(',').map((s)=>s.trim()) : [
            item.trim()
        ];
    }
    return [];
};
/**
 * Generic fetcher for the Anikoto API. Builds a query string (array values
 * are serialized as `key[]=a&key[]=b`, matching /api/filter's expected
 * format), goes through the app's own `/api/proxy` route client-side to
 * dodge CORS (same pattern the old code used — this is NOT Anikoto's own
 * `/api/proxy` streaming proxy, it's this app's internal one), and unwraps
 * the `{ ok, data }` / `{ ok, cached, data }` envelope every Anikoto
 * endpoint returns (or raw arrays like /api/watch).
 */ async function fetchAnikoto(endpoint, params = {}, retryCount = 0) {
    const queryParts = [];
    for (const [key, value] of Object.entries(params)){
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
            for (const v of value){
                if (v === undefined || v === null || v === '') continue;
                queryParts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(v))}`);
            }
        } else {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const targetUrl = `${ApiManager.getBaseUrl()}${endpoint}${queryString}`;
    const proxyUrl = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : targetUrl;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), 20000);
        try {
            const response = await fetch(proxyUrl, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                if (retryCount < ApiManager.getAllUrls().length - 1) {
                    ApiManager.rotateUrl();
                    return fetchAnikoto(endpoint, params, retryCount + 1);
                }
                return null;
            }
            const json = await response.json();
            if (json && typeof json === 'object') {
                if ('ok' in json) {
                    return json.ok ? json.data ?? json : null;
                }
                if ('data' in json && Array.isArray(json.data)) {
                    return json.data;
                }
            }
            return json;
        } catch (innerError) {
            if (innerError.name === 'AbortError' || innerError.message && innerError.message.includes('fetch')) {
                if (retryCount < ApiManager.getAllUrls().length - 1) {
                    ApiManager.rotateUrl();
                    return fetchAnikoto(endpoint, params, retryCount + 1);
                }
                return null;
            }
            throw innerError;
        }
    } catch  {
        if (retryCount < ApiManager.getAllUrls().length - 1) {
            ApiManager.rotateUrl();
            return fetchAnikoto(endpoint, params, retryCount + 1);
        }
        return null;
    }
}
/**
 * SSE (Server-Sent Events) fetcher for the Anikoto /watch endpoint.
 * The /watch endpoint returns data as an SSE stream (`data: {...}\n\n`)
 * instead of standard JSON. This function reads the full response as text,
 * parses each `data: ` prefixed line as JSON, and collects all parsed
 * objects into an array — matching the shape getStream expects.
 */ async function fetchAnikotoSSE(endpoint, params = {}, retryCount = 0) {
    const queryParts = [];
    for (const [key, value] of Object.entries(params)){
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
            for (const v of value){
                if (v === undefined || v === null || v === '') continue;
                queryParts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(v))}`);
            }
        } else {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const targetUrl = `${ApiManager.getBaseUrl()}${endpoint}${queryString}`;
    const proxyUrl = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : targetUrl;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), 25000);
        try {
            const response = await fetch(proxyUrl, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                if (retryCount < ApiManager.getAllUrls().length - 1) {
                    ApiManager.rotateUrl();
                    return fetchAnikotoSSE(endpoint, params, retryCount + 1);
                }
                return null;
            }
            const text = await response.text();
            try {
                const json = JSON.parse(text);
                // Unwrap { ok, data } envelope if present
                if (json && typeof json === 'object' && !Array.isArray(json)) {
                    if ('ok' in json) {
                        const inner = json.ok ? json.data ?? json : null;
                        return inner ? Array.isArray(inner) ? inner : [
                            inner
                        ] : null;
                    }
                    if ('data' in json && Array.isArray(json.data)) {
                        return json.data;
                    }
                }
                return Array.isArray(json) ? json : [
                    json
                ];
            } catch  {
            // Not valid JSON — parse as SSE stream
            }
            // Parse SSE: each event is `data: <json>\n\n`
            const results = [];
            const lines = text.split('\n');
            for (const line of lines){
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) continue;
                const jsonStr = trimmed.slice(5).trim(); // Remove 'data:' prefix
                if (!jsonStr) continue;
                if (jsonStr === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(jsonStr);
                    results.push(parsed);
                } catch  {
                // Skip malformed lines
                }
            }
            return results.length > 0 ? results : null;
        } catch (innerError) {
            if (innerError.name === 'AbortError' || innerError.message && innerError.message.includes('fetch')) {
                if (retryCount < ApiManager.getAllUrls().length - 1) {
                    ApiManager.rotateUrl();
                    return fetchAnikotoSSE(endpoint, params, retryCount + 1);
                }
                return null;
            }
            throw innerError;
        }
    } catch  {
        if (retryCount < ApiManager.getAllUrls().length - 1) {
            ApiManager.rotateUrl();
            return fetchAnikotoSSE(endpoint, params, retryCount + 1);
        }
        return null;
    }
}
const ANIKOTO_GENRE_MAP = {
    "action": "1",
    "adventure": "2",
    "boys love": "2330",
    "cars": "538",
    "comedy": "8",
    "dementia": "453",
    "demons": "119",
    "drama": "62",
    "ecchi": "214",
    "erotica": "2322",
    "fantasy": "3",
    "game": "180",
    "girls love": "2328",
    "gourmet": "2326",
    "harem": "215",
    "historical": "70",
    "horror": "222",
    "isekai": "74",
    "josei": "404",
    "kids": "46",
    "magic": "203",
    "mahou shoujo": "2310",
    "martial arts": "114",
    "mecha": "123",
    "military": "125",
    "music": "242",
    "mystery": "57",
    "parody": "162",
    "police": "136",
    "psychological": "73",
    "romance": "28",
    "samurai": "163",
    "school": "14",
    "sci-fi": "12",
    "seinen": "50",
    "shoujo": "252",
    "shoujo ai": "235",
    "shounen": "15",
    "shounen ai": "233",
    "slice of life": "35",
    "space": "124",
    "sports": "29",
    "super power": "16",
    "supernatural": "9",
    "suspense": "2316",
    "thriller": "54",
    "unknown": "32",
    "vampire": "58"
};
/**
 * Defensive unwrapper for listing endpoints (genre/type/latest/status/filter/az-list).
 * Ensures pagination flags and result arrays are cleanly populated.
 */ function extractPaged(data) {
    if (!data) return {
        results: []
    };
    if (Array.isArray(data)) return {
        results: data,
        currentPage: 1,
        hasNextPage: false
    };
    const results = Array.isArray(data.results) ? data.results : Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : [];
    const currentPage = data.currentPage ?? data.page ?? 1;
    const hasNextPage = data.hasNextPage ?? (data.maxPage ? currentPage < data.maxPage : results.length >= 18);
    const hasPreviousPage = data.hasPreviousPage ?? currentPage > 1;
    return {
        results,
        topRated: data.topRated,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        minPage: data.minPage ?? 1,
        maxPage: data.maxPage ?? (hasNextPage ? currentPage + 1 : currentPage)
    };
}
class AnimeAPI_Anikoto {
    static async getHome() {
        return fetchAnikoto('/home');
    }
    static async search(keyword, page = 1) {
        return fetchAnikoto('/search', {
            keyword,
            page
        });
    }
    static async filter(params) {
        const { type, genres, genre, genre_exclude, genres_exclude, ...rest } = params;
        const query = {
            ...rest
        };
        if (type !== undefined) query['term_type[]'] = Array.isArray(type) ? type : [
            type
        ];
        const gList = genres || genre;
        if (gList !== undefined) {
            const rawG = Array.isArray(gList) ? gList : String(gList).split(',');
            query['genre[]'] = rawG.map((g)=>ANIKOTO_GENRE_MAP[g.trim().toLowerCase()] || g.trim());
        }
        const geList = genres_exclude || genre_exclude;
        if (geList !== undefined) {
            const rawGE = Array.isArray(geList) ? geList : String(geList).split(',');
            query['genre_exclude[]'] = rawGE.map((g)=>ANIKOTO_GENRE_MAP[g.trim().toLowerCase()] || g.trim());
        }
        return fetchAnikoto('/filter', query);
    }
    static async getAnimeDetail(slug, start, end) {
        return fetchAnikoto(`/anime/${encodeURIComponent(slug)}`, {
            start,
            end
        });
    }
    static async getEpisodes(slug, start, end) {
        return fetchAnikoto(`/anime/${encodeURIComponent(slug)}/episodes`, {
            start,
            end
        });
    }
    static async getRelated(slug) {
        return fetchAnikoto(`/anime/${encodeURIComponent(slug)}/related`);
    }
    static async getRecommendations(slug) {
        return fetchAnikoto(`/anime/${encodeURIComponent(slug)}/recommendations`);
    }
    static async getTooltip(id) {
        return fetchAnikoto(`/anime/tooltip/${encodeURIComponent(id)}`);
    }
    static async getHomeLatest(type = 'updated-all', page = 1) {
        return fetchAnikoto('/home/latest', {
            type,
            page
        });
    }
    static async getLatestUpdated(page = 1) {
        const res = await fetchAnikoto('/latest-updated', {
            page
        });
        if (res && (Array.isArray(res) ? res.length > 0 : res.results?.length > 0)) return res;
        return fetchAnikoto('/latest', {
            type: 'latest-updated',
            page
        });
    }
    static async getNewRelease(page = 1) {
        const res = await fetchAnikoto('/new-release', {
            page
        });
        if (res && (Array.isArray(res) ? res.length > 0 : res.results?.length > 0)) return res;
        return fetchAnikoto('/latest', {
            type: 'new-release',
            page
        });
    }
    static async getMostViewed(page = 1) {
        const res = await fetchAnikoto('/most-viewed', {
            page
        });
        if (res && (Array.isArray(res) ? res.length > 0 : res.results?.length > 0)) return res;
        return fetchAnikoto('/latest', {
            type: 'most-viewed',
            page
        });
    }
    static async getLatest(type = 'latest-updated', page = 1) {
        return fetchAnikoto('/latest', {
            type,
            page
        });
    }
    static async getStatus(type = 'currently-airing', page = 1) {
        return fetchAnikoto('/status', {
            type,
            page
        });
    }
    static async getAZList(page = 1, letter) {
        return fetchAnikoto('/az-list', {
            page,
            letter
        });
    }
    static async getGenre(genre, page = 1) {
        return fetchAnikoto(`/genre/${encodeURIComponent(genre)}`, {
            page
        });
    }
    static async getType(type, page = 1) {
        return fetchAnikoto(`/type/${encodeURIComponent(type)}`, {
            page
        });
    }
    static async getSchedule(tz, images) {
        return fetchAnikoto('/schedule', {
            tz,
            images
        });
    }
    static async getWatch(slug, ep) {
        return fetchAnikotoSSE(`/watch/${encodeURIComponent(slug)}`, {
            ep
        });
    }
}
// ==========================================
//  5. RAW -> UNIVERSAL NORMALIZERS
// ==========================================
function normalizeCard(item) {
    const rawRating = item?.rating || item?.rated || item?.ageRating || item?.rating_name || '';
    const isAdult = item?.isAdult === true || item?.adult === true || [
        "Rx",
        "RX",
        "Hentai",
        "18+",
        "R+"
    ].some((t)=>String(rawRating).toUpperCase().includes(t));
    return {
        id: item?.slug || item?.id || '',
        title: item?.title || 'Unknown Title',
        jname: item?.titleJp || '',
        poster: item?.image || '',
        type: item?.type || 'TV',
        duration: item?.date,
        episodes: {
            sub: item?.episodes?.sub ?? item?.sub ?? 0,
            dub: item?.episodes?.dub ?? item?.dub ?? 0,
            eps: item?.episodes?.total ?? item?.episodes?.eps
        },
        rank: item?.rank,
        isAdult,
        rating: rawRating
    };
}
class AnimeService {
    static normalizeEpisodeList(list, slug) {
        return Array.isArray(list) ? list.map((e)=>({
                id: `${slug}::${e.number}`,
                number: parseInt(e.number, 10) || 0,
                title: e.title || `Episode ${e.number}`,
                isFiller: false,
                isDub: !!e.hasDub,
                isSub: e.hasSub !== undefined ? !!e.hasSub : true,
                hasDub: !!e.hasDub,
                hasSub: e.hasSub !== undefined ? !!e.hasSub : true,
                malId: e.dataMal ? parseInt(e.dataMal, 10) : undefined
            })) : [];
    }
    static normalizeRelated(list) {
        return Array.isArray(list) ? list.filter((r)=>r && (r.slug || r.id)).map((r)=>({
                id: r.slug || r.id,
                title: r.title || 'Unknown Title',
                jname: r.titleJp || '',
                poster: r.image || '',
                type: r.relation || 'Related'
            })) : [];
    }
    static normalizeDetail(data) {
        const slug = data?.slug || data?.id || '';
        const rawRating = data?.rating || data?.rated || data?.ageRating || '';
        const isAdult = data?.isAdult === true || data?.adult === true || [
            "Rx",
            "RX",
            "Hentai",
            "18+",
            "R+",
            "18"
        ].some((t)=>String(rawRating).toUpperCase().includes(t)) || Array.isArray(data?.genres) && data.genres.some((g)=>[
                "hentai",
                "ecchi",
                "erotica"
            ].includes(String(g).toLowerCase()));
        const rawEps = data?.episodes?.episodes || data?.episodes || [];
        const detectedMalId = rawEps[0]?.dataMal ? parseInt(rawEps[0].dataMal, 10) : data?.malId || data?.idMal || data?.mal_id;
        const genresList = normalizeList(data?.genres);
        const studiosList = normalizeList(data?.studios);
        const altTitles = Array.isArray(data?.alternativeTitles) ? data.alternativeTitles : [];
        const hasChineseStudio = studiosList.some((s)=>[
                'original force',
                'wonder cat',
                'sparkly key',
                'foch',
                'b.cmay',
                'haoliners',
                'tencent',
                'bilibili',
                'kuang shang',
                'l2studio',
                'paper plane'
            ].some((cs)=>s.toLowerCase().includes(cs)));
        const hasKoreanStudio = studiosList.some((s)=>[
                'studio mir',
                'dr movie',
                'red dog',
                'studio ppuri',
                'locus',
                'cockroach',
                'studio gale',
                'iconix'
            ].some((ks)=>s.toLowerCase().includes(ks)));
        const hasJapaneseStudio = studiosList.some((s)=>[
                'a-1 pictures',
                'a1 pictures',
                'mappa',
                'ufotable',
                'cloverworks',
                'wit studio',
                'bones',
                'madhouse',
                'toei animation',
                'kyoto animation',
                'shaft',
                'david production',
                'troyca',
                'lerche',
                'doga kobo',
                'white fox',
                'silver link',
                'j.c.staff',
                'jc staff',
                'telecom',
                'production i.g',
                'pierrot',
                'sunrise',
                'tms entertainment'
            ].some((js)=>s.toLowerCase().includes(js)));
        const isJapaneseAnimeTitle = /(?:solo leveling|ore dake level up|tower of god|god of high school|noblesse)\b/i.test(data?.title || '') || altTitles.some((t)=>/(?:solo leveling|ore dake level up|tower of god|god of high school|noblesse)\b/i.test(t));
        const hasChineseChars = altTitles.some((t)=>/[\u4e00-\u9fa5]/.test(t)) || /[\u4e00-\u9fa5]/.test(data?.synopsis || '');
        const hasKoreanChars = altTitles.some((t)=>/[\uac00-\ud7af]/.test(t)) || /[\uac00-\ud7af]/.test(data?.synopsis || '') || /[\uac00-\ud7af]/.test(data?.titleJp || '');
        const hasJapaneseKana = /[\u3040-\u30ff]/.test(data?.titleJp || '') || /[\u3040-\u30ff]/.test(data?.title || '');
        const isDonghua = data?.type?.toLowerCase() === 'donghua' || genresList.some((g)=>g.toLowerCase().includes('donghua') || g.toLowerCase().includes('chinese')) || hasChineseStudio || hasChineseChars && !hasJapaneseKana || !hasJapaneseKana && altTitles.concat([
            data?.title || '',
            data?.titleJp || '',
            data?.synopsis || ''
        ]).some((t)=>/(?:\b(?:douluo|dalu|xianxia|wuxia|cultivation|donghua|shiguang|dailiren|shenghuo|chuan|zhuan|xian|qian kun|wan jie|soul land|combat continent|immortal king)\b)/i.test(t));
        const isKorean = !hasJapaneseStudio && !isJapaneseAnimeTitle && (data?.country?.toUpperCase() === 'KR' || data?.countryOfOrigin?.toUpperCase() === 'KR' || data?.type?.toLowerCase() === 'korean' || data?.type?.toLowerCase() === 'aori' || genresList.some((g)=>g.toLowerCase() === 'korean') || hasKoreanStudio || !hasJapaneseKana && /(?:lookism)\b/i.test(data?.title || ''));
        const isChinese = data?.country?.toUpperCase() === 'CN' || data?.countryOfOrigin?.toUpperCase() === 'CN' || isDonghua;
        const country = hasJapaneseStudio || isJapaneseAnimeTitle ? 'JP' : isKorean ? 'KR' : isChinese ? 'CN' : data?.country || data?.countryOfOrigin || 'JP';
        return {
            id: slug,
            title: data?.title || 'Unknown Title',
            jname: data?.titleJp || '',
            poster: data?.image || '',
            description: data?.synopsis || '',
            isAdult: isAdult,
            malId: detectedMalId,
            countryOfOrigin: country,
            stats: {
                rating: data?.rating || '?',
                quality: data?.quality || 'HD',
                duration: data?.duration || '?',
                type: data?.type || 'TV',
                malScore: data?.malScore != null ? String(data.malScore) : '?',
                episodes: {
                    sub: data?.hasSub ? 1 : 0,
                    dub: data?.hasDub ? 1 : 0
                }
            },
            info: {
                status: data?.status || 'Unknown',
                genres: genresList,
                studios: normalizeList(data?.studios),
                producers: normalizeList(data?.producers),
                aired: data?.aired || '?',
                premiered: data?.premiered || '?',
                japanese: data?.titleJp || '',
                synonyms: Array.isArray(data?.alternativeTitles) ? data.alternativeTitles.join(', ') : ''
            },
            episodes: data?.episodes?.episodes ? this.normalizeEpisodeList(data.episodes.episodes, slug) : [],
            characters: [],
            recommendations: [],
            related: [],
            seasons: [],
            trailers: []
        };
    }
    static async getUniversalRecent(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getHomeSections() {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getHomeSections();
    }
    static async getTopTen() {
        const [today, week, month] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getTopAiring(1, 10).catch(()=>[]),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(1, 10).catch(()=>[]),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getMostFavorite(1, 10).catch(()=>[])
        ]);
        return {
            today,
            week,
            month
        };
    }
    static async getTopSearch() {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(1, 10);
    }
    static async getRandomAnime() {
        const popular = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(Math.floor(Math.random() * 3) + 1, 24);
        if (popular && popular.length > 0) {
            return popular[Math.floor(Math.random() * popular.length)];
        }
        return null;
    }
    static async getTopUpcoming(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getTopUpcoming(page, 24);
    }
    static async getRecentlyUpdated(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getRecentlyAdded(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getCompleted(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getCompleted(page, 24);
    }
    static async getMostFavorite(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getMostFavorite(page, 24);
    }
    static async getMostPopular(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
    }
    static async getTopAiring(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getTopAiring(page, 24);
    }
    static async getSubbedAnime(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getDubbedAnime(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getFilteredAnime(category, page = 1) {
        let results = [];
        switch(category){
            case 'sub':
            case 'dub':
            case 'latest-updated':
            case 'recent':
            case 'updated-all':
            case 'all':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
                break;
            case 'new-release':
            case 'added':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
                break;
            case 'most-viewed':
            case 'popular':
            case 'trending':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
                break;
            case 'upcoming':
            case 'not-yet-aired':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getTopUpcoming(page, 24);
                break;
            case 'ongoing':
            case 'currently-airing':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getTopAiring(page, 24);
                break;
            case 'completed':
            case 'finished-airing':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getCompleted(page, 24);
                break;
            case 'az-list':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
                break;
            default:
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
                break;
        }
        return {
            results,
            currentPage: page,
            hasNextPage: results.length >= 24,
            hasPreviousPage: page > 1,
            maxPage: results.length >= 24 ? page + 1 : page,
            minPage: 1
        };
    }
    static async getByGenre(genre, page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getByGenre(genre, page, 24);
    }
    static async getByType(_type, page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
    }
    static async search(query, page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].search(query, page, 24);
    }
    static async getSearchSuggestions(query) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getSearchSuggestions(query);
    }
    static async filter(params) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].filter(params);
    }
    static async getAnimeInfo(slugOrId) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getAnimeInfo(slugOrId);
    }
    static async getEpisodes(slugOrId) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getEpisodes(slugOrId);
    }
    static async getCharacters(slugOrId) {
        const info = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getAnimeInfo(slugOrId);
        return info?.characters || [];
    }
    static async getSchedule(date, tzOffsetHours = 0) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getSchedule(date, tzOffsetHours);
    }
    static async getTooltip(id) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AniListService"].getTooltip(id);
    }
    static async getStream(episodeId, server = 'MegaCloud', category = 'sub', options) {
        let slug = '';
        let epNumber = '';
        if (episodeId.includes('::')) {
            [slug, epNumber] = episodeId.split('::');
        } else if (episodeId.includes('-')) {
            const lastIndex = episodeId.lastIndexOf('-');
            slug = episodeId.substring(0, lastIndex);
            epNumber = episodeId.substring(lastIndex + 1);
        } else {
            slug = episodeId;
            epNumber = episodeId;
        }
        if (!slug || !epNumber) return null;
        const countryUpper = options?.countryOfOrigin?.toUpperCase() || 'JP';
        const isChinese = countryUpper === 'CN';
        const isKorean = countryUpper === 'KR';
        const primarySubKey = isChinese ? 'cn' : isKorean ? 'kr' : 'jp';
        // Map audio category
        let effectiveAudio = category;
        if (category === 'sub') effectiveAudio = primarySubKey;
        else if (category === 'dub') effectiveAudio = 'en';
        else if ([
            'jp',
            'cn',
            'kr'
        ].includes(effectiveAudio)) {
            if (effectiveAudio !== primarySubKey && (isChinese || isKorean)) {
                effectiveAudio = primarySubKey;
            }
        }
        // 1. Direct High-Speed Unified Extractor (ZokoAnime + Blakite + Rumble Cloud)
        try {
            let unified = null;
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            else {
                unified = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$extractors$2f$streamExtractor$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["resolveUnifiedStreams"])({
                    malId: options?.malId,
                    title: options?.title || slug,
                    episode: epNumber,
                    countryOfOrigin: options?.countryOfOrigin || 'JP',
                    knownHasDub: options?.hasDub
                });
            }
            if (unified && unified.servers) {
                // IMPORTANT: When English Dub or Hindi Dub is requested, ONLY look at that specific language pool!
                // NEVER fall back to primarySubKey (which is Japanese Sub) when English Dub is requested!
                const isSubTrack = [
                    'jp',
                    'cn',
                    'kr',
                    'sub'
                ].includes(effectiveAudio);
                const available = unified.servers[effectiveAudio] || (isSubTrack ? unified.servers[primarySubKey] || [] : []);
                const excluded = (options?.excludeServers || []).map((s)=>s.toLowerCase());
                let matched = available.find((s)=>s.serverName.toLowerCase() === server.toLowerCase() && !excluded.includes(s.serverName.toLowerCase())) || available.find((s)=>!excluded.includes(s.serverName.toLowerCase())) || available[0];
                if (matched && matched.url) {
                    // Synthesize legacy server structure for backward compatibility
                    const legacyServers = {
                        ...unified.servers,
                        sub: unified.servers[primarySubKey] || unified.servers.sub || [],
                        dub: unified.servers.en || unified.servers.dub || [],
                        hi: unified.servers.hi || [],
                        raw: []
                    };
                    const isEmbed = matched.type === 'embed' || matched.url.includes('megaplay.buzz');
                    return {
                        url: matched.url,
                        iframeUrl: isEmbed ? matched.url : null,
                        isEmbed: isEmbed,
                        subtitles: (unified.subtitles || []).map((s)=>({
                                file: s.url,
                                label: s.label,
                                kind: 'captions'
                            })),
                        server: matched.serverName,
                        servers: legacyServers,
                        audioTracks: unified.audioTracks,
                        isM3U8: matched.type === 'm3u8',
                        referer: matched.referer || null,
                        intro: unified.intro,
                        outro: unified.outro,
                        skipData: unified.intro || unified.outro ? {
                            intro: unified.intro,
                            outro: unified.outro
                        } : null
                    };
                }
            }
        } catch (err) {
            console.warn('[AnimeService.getStream] Unified stream extractor fallback:', err);
        }
        // 2. Fallback to Anikoto Scraper API
        let data = await AnimeAPI_Anikoto.getWatch(slug, epNumber);
        // Aggressive unwrapping for stringified proxy responses
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {}
        }
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            if (data.data) data = data.data;
        }
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {}
        }
        if (!data || !Array.isArray(data)) return null;
        // Group Servers from response
        const serversBlock = data.find((item)=>item.type === 'servers');
        const list = serversBlock && Array.isArray(serversBlock.servers) ? serversBlock.servers : [];
        const grouped = {
            sub: [],
            dub: [],
            raw: []
        };
        for (const s of list){
            const bucket = s?.type === 'dub' ? 'dub' : s?.type === 'raw' ? 'raw' : 'sub';
            grouped[bucket].push({
                serverId: s?.id ?? s?.svId,
                serverName: s?.name
            });
        }
        grouped[primarySubKey] = grouped.sub;
        grouped['en'] = grouped.dub;
        // Extract Stream Sources
        const sources = data.filter((item)=>item.type === 'source' && item.source).map((item)=>item.source);
        const targetCat = category === 'en' || category === 'dub' ? 'dub' : 'sub';
        const byCategory = sources.filter((s)=>s?.type === targetCat);
        if (!byCategory.length) return {
            servers: grouped,
            url: null
        };
        const matched = byCategory.find((s)=>s?.server?.toLowerCase() === server.toLowerCase() && (s.proxyUrl || s.m3u8 || s.url)) || byCategory.find((s)=>s.proxyUrl || s.m3u8 || s.url) || byCategory[0];
        if (!matched) return {
            servers: grouped,
            url: null
        };
        const skipBlock = data.find((item)=>item.type === 'skip_data');
        const skip = skipBlock ? skipBlock.skip_data : null;
        const isEmbed = !!(matched.url && matched.url.includes('megaplay.buzz'));
        return {
            url: matched.proxyUrl || matched.m3u8 || matched.url,
            iframeUrl: isEmbed ? matched.url : null,
            isEmbed: isEmbed,
            subtitles: matched.tracks ? matched.tracks.map((t)=>({
                    ...t,
                    file: t.proxyUrl || t.file
                })) : [],
            server: matched.server || server,
            servers: grouped,
            isM3U8: !!matched.m3u8 || !!(matched.proxyUrl && matched.proxyUrl.includes('m3u8')),
            referer: matched.referer || null,
            intro: skip?.intro || null,
            outro: skip?.outro || null,
            skipData: skip
        };
    }
    /** @deprecated Now handled dynamically inside getStream to avoid double network requests */ static async getEpisodeServers(episodeId) {
        return null;
    }
}
class WatchlistAPI {
    static async getUserWatchlist(userId) {
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"] && userId !== 'guest') {
            const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"].from('watchlist').select('*').eq('user_id', userId);
            return data || [];
        }
        const local = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : null;
        return ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : [];
    }
    static async addToWatchlist(userId, animeId, status, progress = 0, episodeId, totalEpisodes, type) {
        const item = {
            anime_id: animeId,
            status,
            total_episodes: Number(totalEpisodes) || 1,
            media_type: type || "anime",
            updated_at: new Date().toISOString()
        };
        if (episodeId) item.last_episode_id = episodeId;
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"] && userId !== 'guest') {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"].from('watchlist').upsert({
                user_id: userId,
                ...item
            }, {
                onConflict: 'user_id, anime_id'
            });
            return !error;
        }
        const list = await this.getUserWatchlist(userId);
        const updated = [
            ...list.filter((i)=>i.anime_id !== animeId),
            item
        ];
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return true;
    }
}
class UserAPI {
    static async getCurrentUser() {
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"]) {
            const { data: { session } } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
            if (session?.user) {
                return {
                    id: session.user.id,
                    email: session.user.email,
                    user_metadata: session.user.user_metadata
                };
            }
        }
        return null;
    }
    static async signIn(email, password) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"] ? await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithPassword({
            email,
            password
        }) : {
            data: null,
            error: null
        };
    }
    static async signUp(email, password, username, avatarUrl, gender) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"] ? await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"].auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    full_name: username,
                    avatar_url: avatarUrl,
                    gender
                }
            }
        }) : {
            data: null,
            error: null
        };
    }
    static async signOut() {
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"]) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
        }
    }
}
class ImageAPI {
    static async uploadImage(file) {
        const API_KEY = ("TURBOPACK compile-time value", "11b8c835449ed2b2b277c9e4e60b3351");
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const formData = new FormData();
        formData.append('image', file);
        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
            const data = await response.json();
            if (!data.success) throw new Error('Image upload failed');
            return data.data.url;
        } catch (error) {
            console.error('Image upload error:', error);
            throw error;
        }
    }
}
}),
"[project]/src/lib/utils.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "formatAnimeTitle",
    ()=>formatAnimeTitle,
    "getBaseURL",
    ()=>getBaseURL,
    "getChunkLabel",
    ()=>getChunkLabel,
    "getSafeImageUrl",
    ()=>getSafeImageUrl,
    "getSimilarity",
    ()=>getSimilarity,
    "getWatchRoute",
    ()=>getWatchRoute,
    "isRelatedAnime",
    ()=>isRelatedAnime,
    "sanitizeContinueWatchingEntry",
    ()=>sanitizeContinueWatchingEntry
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$2$2e$6$2e$1$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/tailwind-merge@2.6.1/node_modules/tailwind-merge/dist/bundle-mjs.mjs [instrumentation] (ecmascript)");
;
;
function getChunkLabel(chunk, defaultStart, defaultEnd) {
    if (!chunk || chunk.length === 0) return `${defaultStart}-${defaultEnd}`;
    const validNums = [];
    for (const ep of chunk){
        if (!ep || ep.number == null) continue;
        const num = parseFloat(ep.number);
        if (!isNaN(num)) validNums.push(num);
    }
    if (validNums.length === 0) return `${defaultStart}-${defaultEnd}`;
    if (validNums.length === 1) return `${validNums[0]}`;
    const sorted = [
        ...validNums
    ].sort((a, b)=>a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    // Filter out numbers that are too far from the median (outliers)
    const filtered = validNums.filter((n)=>Math.abs(n - median) <= 150);
    if (filtered.length === 0) return `${defaultStart}-${defaultEnd}`;
    if (filtered.length === 1) return `${filtered[0]}`;
    return `${filtered[0]}-${filtered[filtered.length - 1]}`;
}
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$2$2e$6$2e$1$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function getBaseURL() {
    // 1. Client-side
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // 2. Render.com
    if (process.env.RENDER_EXTERNAL_URL) {
        return process.env.RENDER_EXTERNAL_URL;
    }
    // 3. Your Existing Variable (Local & Vercel manual override)
    if ("TURBOPACK compile-time truthy", 1) {
        return "TURBOPACK compile-time value", "http://localhost:3000";
    }
    //TURBOPACK unreachable
    ;
}
function getSimilarity(s1, s2) {
    const normalize = (s)=>s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const str1 = normalize(s1);
    const str2 = normalize(s2);
    if (str1 === str2) return 100;
    const len1 = str1.length;
    const len2 = str2.length;
    if (len1 === 0 || len2 === 0) return 0;
    const matrix = Array(len1 + 1).fill(null).map(()=>Array(len2 + 1).fill(null));
    for(let i = 0; i <= len1; i++)matrix[i][0] = i;
    for(let j = 0; j <= len2; j++)matrix[0][j] = j;
    for(let i = 1; i <= len1; i++){
        for(let j = 1; j <= len2; j++){
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
        }
    }
    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);
    return (maxLength - distance) / maxLength * 100;
}
function isRelatedAnime(currentId, currentTitle, targetId, targetTitle) {
    if (currentId === targetId) return false; // skip current anime
    // Title base matching
    const getBaseName = (s)=>{
        let base = s.toLowerCase();
        // Remove common sequel/spinoff suffixes
        base = base.replace(/(season|part|ova|movie|special|s)\s*\d+/gi, '');
        base = base.replace(/\b(ii|iii|iv|v|vi|vii|viii|ix|x)\b/gi, '');
        base = base.replace(/[\W_]+/g, ' ').trim();
        return base;
    };
    const baseCurrent = getBaseName(currentTitle);
    const baseTarget = getBaseName(targetTitle);
    if (baseCurrent.length > 3 && baseTarget.length > 3) {
        if (baseCurrent === baseTarget || baseCurrent.includes(baseTarget) || baseTarget.includes(baseCurrent)) {
            return true;
        }
    }
    // ID similarity matching
    const idSimilarity = getSimilarity(currentId, targetId);
    if (idSimilarity >= 85) {
        return true;
    }
    return false;
}
function getWatchRoute(animeId, episodeId, type) {
    const t = (type || '').toLowerCase();
    const epQuery = episodeId ? `?ep=${encodeURIComponent(episodeId)}` : '';
    if (t === 'hindi' || t === 'hindi-anime') {
        return `/watch/${animeId}${episodeId ? `?ep=${encodeURIComponent(episodeId)}&audio=hi` : '?audio=hi'}`;
    }
    if (t === 'donghua') {
        return `/donghua-watch/${animeId}${epQuery}`;
    }
    if (t === 'drama' || t === 'cdrama' || t === 'kdrama') {
        return `/drama-watch/${animeId}${epQuery}`;
    }
    if (t === 'movie' || t === 'movies') {
        return `/movies-watch/${animeId}`;
    }
    return `/watch/${animeId}${epQuery}`;
}
function formatAnimeTitle(rawTitle, animeId) {
    // 1. Handle title object variants (english, romaji, userPreferred, name, title)
    if (rawTitle && typeof rawTitle === 'object') {
        const extracted = rawTitle.english || rawTitle.romaji || rawTitle.userPreferred || rawTitle.name || rawTitle.title;
        if (extracted && typeof extracted === 'string' && extracted.trim() !== '' && !extracted.toLowerCase().includes('unknown')) {
            return extracted.trim();
        }
    }
    // 2. Handle valid string titles that are NOT purely numeric and NOT "unknown"
    if (rawTitle && typeof rawTitle === 'string' && rawTitle.trim() !== '') {
        const clean = rawTitle.trim();
        if (!clean.toLowerCase().includes('unknown') && !/^\d+$/.test(clean)) {
            return clean;
        }
    }
    // 3. Check cached title in localStorage by animeId
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // 4. Humanize slug-based animeId if it contains words (e.g. solo-leveling-season-2)
    if (animeId && typeof animeId === 'string' && animeId.trim() !== '') {
        const cleanId = animeId.trim();
        if (!/^\d+$/.test(cleanId)) {
            return cleanId.replace(/[-_]+/g, ' ').split(' ').filter(Boolean).map((word)=>word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
    }
    // 5. Fallback for purely numeric IDs when no title cached
    if (rawTitle && typeof rawTitle === 'string' && rawTitle.trim() !== '' && !rawTitle.toLowerCase().includes('unknown')) {
        return rawTitle.trim();
    }
    if (animeId && typeof animeId === 'string' && /^\d+$/.test(animeId.trim())) {
        return `Anime #${animeId.trim()}`;
    }
    return 'Anime';
}
function sanitizeContinueWatchingEntry(p, fallbackUserId) {
    if (!p) return null;
    return {
        user_id: p.user_id || fallbackUserId,
        anime_id: p.anime_id || p.animeId || '',
        title: p.title || 'Unknown Title',
        banner_image: p.banner_image || p.poster || p.image || null,
        episode_id: p.episode_id || p.episodeId || '',
        episode_number: Number(p.episode_number || p.episodeNumber || p.episode) || 1,
        progress: Math.floor(Number(p.progress) || 0),
        last_updated: p.last_updated || (p.lastUpdated ? new Date(p.lastUpdated).toISOString() : new Date().toISOString()),
        last_server: p.last_server || null,
        episode_image: p.episode_image || p.banner_image || p.poster || null,
        total_episodes: Number(p.total_episodes || p.totalEpisodes) || 1,
        type: p.type || 'anime',
        media_type: p.media_type || p.type || 'anime',
        is_completed: Boolean(p.is_completed),
        age_rating: p.age_rating || p.ageRating || null,
        is_adult: Boolean(p.is_adult || p.isAdult)
    };
}
function getSafeImageUrl(url) {
    if (!url || typeof url !== 'string') return '/images/placeholder-no-img.jpg';
    const trimmed = url.trim();
    if (!trimmed) return '/images/placeholder-no-img.jpg';
    if (trimmed.startsWith('/api/proxy') || trimmed.startsWith('/images/')) return trimmed;
    // Domains known to fail client-side router DNS resolution or have strict hotlink policies
    if (trimmed.includes('cdn.anipixcdn.co') || trimmed.includes('anipixcdn.co')) {
        return `/api/proxy?url=${encodeURIComponent(trimmed)}`;
    }
    return trimmed;
}
}),
"[project]/src/lib/dpi.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dpi",
    ()=>dpi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [instrumentation] (ecmascript)");
;
;
const getDonghuaApiBase = ()=>`${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].getBaseUrl()}/donghua`;
async function fetchDonghuaApi(endpoint, params = {}, retryCount = 0) {
    const queryParts = Object.entries(params).filter(([, v])=>v !== undefined && v !== null && v !== '').map(([k, v])=>`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    // 1. First Priority: Try native local route (fast, resilient, 0 CORS issues)
    if (retryCount === 0) {
        try {
            const localBase = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["getBaseURL"])();
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
            if (retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
                return fetchDonghuaApi(endpoint, params, retryCount + 1);
            }
            return null;
        }
        const json = await response.json();
        if (json && typeof json === 'object') {
            if ('ok' in json) {
                if (!json.ok) {
                    if (retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
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
            if (retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
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
"[project]/src/lib/omni.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/omni.ts
// Client for the omni-api hindidrama scraper (hindidrama.net)
// Mirrors the shape of hpi.ts and dpi.ts for consistency.
__turbopack_context__.s([
    "omni",
    ()=>omni
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [instrumentation] (ecmascript)");
;
const getOmniBase = ()=>`${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].getBaseUrl()}/hindidrama`;
const getMoviesBase = ()=>'/api/hdmovies';
async function fetchOmni(endpoint, params = {}, retryCount = 0) {
    const queryParts = Object.entries(params).filter(([, v])=>v !== undefined && v !== null && v !== '').map(([k, v])=>`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const base = endpoint.startsWith('http') ? '' : endpoint.includes('hdmovies') ? getMoviesBase() : getOmniBase();
    let targetUrl = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.replace('/hdmovies', '')}${queryString}`;
    // Local Next.js API routes (like /api/hdmovies) should be fetched directly, not through /api/proxy
    const isLocalApi = targetUrl.startsWith('/api/');
    const fetchUrl = isLocalApi ? targetUrl : ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : targetUrl;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), 20000);
        const response = await fetch(fetchUrl, {
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            if (!isLocalApi && retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
                return fetchOmni(endpoint, params, retryCount + 1);
            }
            return null;
        }
        const json = await response.json();
        // Unwrap proxy wrapper if present
        if (json && typeof json === 'object') {
            if ('ok' in json) return json.ok ? json.data ?? json : null;
            if ('data' in json && !('results' in json) && !('servers' in json)) return json.data;
        }
        return json;
    } catch (err) {
        if (err?.name === 'AbortError' || err?.message && err.message.includes('fetch')) {
            if (retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
                return fetchOmni(endpoint, params, retryCount + 1);
            }
        }
        return null;
    }
}
// ─── NORMALIZER ──────────────────────────────────────────────────────────────
function normalizeDramaCard(item) {
    return {
        id: item?.slug || item?.id || '',
        title: item?.title || item?.name || 'Unknown',
        image: item?.image || item?.poster || item?.thumbnail || '',
        type: item?.type || item?.country || '',
        episode: item?.episode !== undefined ? String(item.episode) : undefined,
        year: item?.year ? String(item.year) : undefined,
        country: item?.country || ''
    };
}
// ─── CLIENT ──────────────────────────────────────────────────────────────────
class OmniClient {
    drama = {
        getHome: async ()=>{
            const res = await fetchOmni('/home');
            const sections = [];
            if (res && Array.isArray(res.sections)) {
                res.sections.forEach((section)=>{
                    if (section.title && Array.isArray(section.items) && section.items.length > 0) {
                        sections.push({
                            title: section.title,
                            items: section.items.map(normalizeDramaCard)
                        });
                    }
                });
            }
            // Final fallback
            if (sections.length === 0) {
                sections.push({
                    title: 'Drama',
                    items: []
                });
            }
            return {
                sections
            };
        },
        search: async (query, page = 1)=>{
            const res = await fetchOmni('/search', {
                keyword: query,
                page
            });
            const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : Array.isArray(res) ? res.map(normalizeDramaCard) : [];
            return {
                items,
                pagination: {
                    currentPage: res?.page || page,
                    hasNextPage: res?.hasNextPage ?? items.length >= 20,
                    totalPages: res?.totalPages ?? 1
                }
            };
        },
        getDetail: async (slug)=>{
            const res = await fetchOmni(`/info/${encodeURIComponent(slug)}`);
            if (!res) return null;
            const episodes = (res.episodes || []).map((e, i)=>({
                    id: e.id || e.slug || String(i + 1),
                    number: e.number || i + 1,
                    title: e.title || `Episode ${e.number || i + 1}`,
                    url: e.url || e.href || e.embedUrl || '',
                    embedUrl: e.embedUrl || e.url || e.href || '',
                    image: e.image || res.image || ''
                }));
            const recommendations = (res.recommendations || res.related || []).map(normalizeDramaCard);
            let finalTitle = res.title || res.name || 'Unknown Drama';
            if (finalTitle === 'FAQs') {
                finalTitle = slug.replace('watch-', '').split('-').map((w)=>w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
            let finalStatus = res.status || 'Unknown';
            if (finalStatus === 'UNKNOWN') finalStatus = 'Completed';
            return {
                id: slug,
                slug,
                title: finalTitle,
                image: res.image || res.poster || res.thumbnail || '',
                banner: res.banner || res.cover || res.image || '',
                synopsis: res.description || res.synopsis || res.plot || '',
                status: finalStatus,
                type: res.type || res.country || 'Drama',
                rating: res.rating ? String(res.rating) : undefined,
                year: res.year ? String(res.year) : undefined,
                country: res.country || '',
                genres: Array.isArray(res.genres) ? res.genres : [],
                episodes,
                recommendations,
                embedUrl: res.embedUrl || res.embed_url || undefined
            };
        },
        getStream: async (embedUrl)=>{
            const res = await fetchOmni('/servers', {
                url: embedUrl
            });
            const servers = Array.isArray(res?.servers) ? res.servers.map((s)=>({
                    name: s.name || 'Server',
                    url: s.url || '',
                    type: s.type === 'hls' ? 'hls' : 'iframe'
                })) : [];
            const hlsServer = servers.find((s)=>s.type === 'hls');
            const iframeServer = servers.find((s)=>s.type === 'iframe');
            return {
                servers,
                hlsUrl: hlsServer?.url,
                iframeUrl: iframeServer?.url
            };
        },
        getCategory: async (path, page = 1)=>{
            const res = await fetchOmni('/category', {
                path,
                page
            });
            const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : Array.isArray(res) ? res.map(normalizeDramaCard) : [];
            return {
                items,
                pagination: {
                    currentPage: res?.page || page,
                    hasNextPage: res?.hasNextPage ?? items.length >= 20,
                    totalPages: res?.totalPages ?? 1
                }
            };
        },
        getByCountry: async (country, page = 1)=>{
            const res = await fetchOmni(`/country/${encodeURIComponent(country.toLowerCase())}`, {
                page
            });
            const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
            return {
                items,
                pagination: {
                    currentPage: res?.page || page,
                    hasNextPage: res?.hasNextPage ?? items.length >= 20,
                    totalPages: res?.totalPages ?? 1
                }
            };
        },
        getByGenre: async (genre, page = 1)=>{
            const res = await fetchOmni(`/genre/${encodeURIComponent(genre.toLowerCase())}`, {
                page
            });
            const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
            return {
                items,
                pagination: {
                    currentPage: res?.page || page,
                    hasNextPage: res?.hasNextPage ?? items.length >= 20,
                    totalPages: res?.totalPages ?? 1
                }
            };
        },
        getFilter: async (type, page = 1)=>{
            const res = await fetchOmni(`/filter/${encodeURIComponent(type.toLowerCase())}`, {
                page
            });
            const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
            return {
                items,
                pagination: {
                    currentPage: res?.page || page,
                    hasNextPage: res?.hasNextPage ?? items.length >= 20,
                    totalPages: res?.totalPages ?? 1
                }
            };
        }
    };
    movies = {
        getHome: async ()=>{
            const res = await fetchOmni('/hdmovies/home');
            const sections = [];
            if (res && Array.isArray(res.sections)) {
                res.sections.forEach((section)=>{
                    if (section.title && Array.isArray(section.items) && section.items.length > 0) {
                        sections.push({
                            title: section.title,
                            items: section.items.map(normalizeDramaCard)
                        });
                    }
                });
            }
            if (sections.length === 0) {
                sections.push({
                    title: 'Movies & Series',
                    items: []
                });
            }
            return {
                sections
            };
        },
        search: async (query, page = 1)=>{
            const res = await fetchOmni('/hdmovies/search', {
                q: query,
                page
            });
            const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : Array.isArray(res) ? res.map(normalizeDramaCard) : [];
            return {
                items,
                pagination: {
                    currentPage: res?.currentPage || page,
                    hasNextPage: res?.hasNextPage ?? false,
                    totalPages: 1
                }
            };
        },
        getDetail: async (id)=>{
            const res = await fetchOmni('/hdmovies/watch', {
                id
            });
            if (!res || !res.title) return null;
            // Only fetch seasons if the API confirmed the item is a TV series
            const typeStr = (res.type || '').toLowerCase();
            const isConfirmedSeries = typeStr === 'series';
            let seasons = res.seasons || [];
            if (isConfirmedSeries && res.imdbId && (!seasons || seasons.length === 0)) {
                const seasonRes = await fetchOmni('/hdmovies/seasons', {
                    id
                });
                if (seasonRes && seasonRes.seasons) {
                    seasons = seasonRes.seasons;
                }
            } else if (!isConfirmedSeries) {
                // Ensure movies never have seasons attached
                seasons = [];
            }
            // If seasons came back with no episodes or empty, it's really a standalone movie/feature
            const hasRealSeasons = Array.isArray(seasons) && seasons.length > 0 && seasons.some((s)=>Array.isArray(s.episodes) && s.episodes.length > 0);
            // Extract IMDb ID safely from res or content
            const imdbId = res.imdbId || (JSON.stringify(res).match(/tt\d{7,8}/) || [])[0] || '';
            // Prepare verified standard embed servers
            const standardServers = [];
            if (imdbId) {
                // Super Player is the native, dedicated player from HDMovie2 (plays Hindi dubs, cam prints, and unreleased web titles)
                standardServers.push({
                    name: 'Super Player',
                    url: `https://slast430did.com/play/${imdbId}`,
                    type: 'iframe'
                });
                if (hasRealSeasons) {
                    standardServers.push({
                        name: 'VidSrc',
                        url: `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=1&episode=1`,
                        type: 'embed'
                    }, {
                        name: 'VidSrc Pro',
                        url: `https://vidsrc.to/embed/tv/${imdbId}/1/1`,
                        type: 'embed'
                    }, {
                        name: 'VidSrc IN',
                        url: `https://vidsrc.in/embed/tv/${imdbId}/1/1`,
                        type: 'embed'
                    }, {
                        name: 'AutoEmbed',
                        url: `https://autoembed.co/tv/imdb/${imdbId}-1-1`,
                        type: 'embed'
                    }, {
                        name: 'VidSrc CC',
                        url: `https://vidsrc.cc/v2/embed/tv/${imdbId}/1/1`,
                        type: 'embed'
                    });
                } else {
                    standardServers.push({
                        name: 'VidSrc',
                        url: `https://vidsrc.me/embed/movie?imdb=${imdbId}`,
                        type: 'embed'
                    }, {
                        name: 'VidSrc Pro',
                        url: `https://vidsrc.to/embed/movie/${imdbId}`,
                        type: 'embed'
                    }, {
                        name: 'VidSrc IN',
                        url: `https://vidsrc.in/embed/movie/${imdbId}`,
                        type: 'embed'
                    }, {
                        name: 'AutoEmbed',
                        url: `https://autoembed.co/movie/imdb/${imdbId}`,
                        type: 'embed'
                    }, {
                        name: 'VidSrc CC',
                        url: `https://vidsrc.cc/v2/embed/movie/${imdbId}`,
                        type: 'embed'
                    });
                }
            }
            // Filter out broken hosts (e.g. multiembed returns 404)
            const brokenKeywords = [
                'multiembed.mov'
            ];
            const isBroken = (url)=>!url || brokenKeywords.some((b)=>url.toLowerCase().includes(b));
            const cleanStreams = [
                ...standardServers
            ];
            const seenUrls = new Set(standardServers.map((s)=>s.url));
            const seenNames = new Set(standardServers.map((s)=>s.name));
            if (Array.isArray(res.streams)) {
                for (const st of res.streams){
                    if (!st || !st.url) continue;
                    // Upgrade legacy/expired gemma416okl.com domain to active slast430did.com
                    let url = st.url.replace(/gemma416okl\.com/g, 'slast430did.com');
                    if (isBroken(url)) continue;
                    if (!seenUrls.has(url)) {
                        seenUrls.add(url);
                        let name = st.name || 'Server';
                        if (name.toLowerCase() === 'server') name = 'Super Player';
                        if (seenNames.has(name)) {
                            let count = 2;
                            while(seenNames.has(`${name} ${count}`))count++;
                            name = `${name} ${count}`;
                        }
                        seenNames.add(name);
                        cleanStreams.push({
                            ...st,
                            url,
                            name
                        });
                    }
                }
            }
            // If seasons exist, populate their sources with working server URLs
            const processedSeasons = hasRealSeasons ? seasons.map((season)=>{
                const seasonNum = season.seasonNumber || 1;
                const sources = imdbId ? [
                    {
                        name: 'Super Player',
                        url: `https://slast430did.com/play/${imdbId}`
                    },
                    {
                        name: 'VidSrc',
                        url: `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${seasonNum}&episode=1`
                    },
                    {
                        name: 'VidSrc Pro',
                        url: `https://vidsrc.to/embed/tv/${imdbId}/${seasonNum}/1`
                    },
                    {
                        name: 'VidSrc IN',
                        url: `https://vidsrc.in/embed/tv/${imdbId}/${seasonNum}/1`
                    },
                    {
                        name: 'AutoEmbed',
                        url: `https://autoembed.co/tv/imdb/${imdbId}-${seasonNum}-1`
                    },
                    {
                        name: 'VidSrc CC',
                        url: `https://vidsrc.cc/v2/embed/tv/${imdbId}/${seasonNum}/1`
                    }
                ] : (season.sources || []).filter((s)=>!isBroken(s?.url));
                return {
                    ...season,
                    sources
                };
            }) : [];
            return {
                ...res,
                type: res.type,
                imdbId,
                streams: cleanStreams,
                related: Array.isArray(res.related) ? res.related.map(normalizeDramaCard) : [],
                seasons: processedSeasons
            };
        },
        getCategory: async (category, page = 1)=>{
            const res = await fetchOmni('/hdmovies/category', {
                category,
                page
            });
            const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
            return {
                items,
                pagination: {
                    currentPage: res?.currentPage || page,
                    hasNextPage: res?.hasNextPage ?? false,
                    totalPages: 1
                }
            };
        },
        getByGenre: async (genre, page = 1)=>{
            const res = await fetchOmni('/hdmovies/genre', {
                genre,
                page
            });
            const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
            return {
                items,
                pagination: {
                    currentPage: res?.currentPage || page,
                    hasNextPage: res?.hasNextPage ?? false,
                    totalPages: 1
                }
            };
        },
        getByCountry: async (country, page = 1)=>{
            const res = await fetchOmni('/hdmovies/country', {
                country,
                page
            });
            const items = Array.isArray(res?.results) ? res.results.map(normalizeDramaCard) : [];
            return {
                items,
                pagination: {
                    currentPage: res?.currentPage || page,
                    hasNextPage: res?.hasNextPage ?? false,
                    totalPages: 1
                }
            };
        }
    };
}
const omni = new OmniClient();
}),
"[project]/src/lib/hpi.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
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
/**
 * ==========================================
 * NEW HINDI API CLIENT
 * ==========================================
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [instrumentation] (ecmascript)");
;
const getHindiApiBase = ()=>`${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].getBaseUrl()}/blakite`;
async function fetchHindiApi(endpoint, params = {}, retryCount = 0) {
    const queryParts = Object.entries(params).filter(([, v])=>v !== undefined && v !== null && v !== '').map(([k, v])=>`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const targetUrl = `${getHindiApiBase()}${endpoint}${queryString}`;
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
            if (retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
                return fetchHindiApi(endpoint, params, retryCount + 1);
            }
            return null;
        }
        const json = await response.json();
        // The proxy wraps the upstream response — unwrap it
        if (json && typeof json === 'object') {
            if ('ok' in json) return json.ok ? json.data ?? json : null;
            if ('data' in json) return json.data;
        }
        return json;
    } catch (innerError) {
        if (innerError?.name === 'AbortError' || innerError?.message && innerError.message.includes('fetch')) {
            if (retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
                return fetchHindiApi(endpoint, params, retryCount + 1);
            }
        }
        return null;
    }
}
function normalizeHindiCard(item) {
    // The API returns episodes as {sub, dub, total} object, not a number
    const epObj = item?.episodes;
    const epCount = epObj?.total ?? epObj?.dub ?? epObj?.sub ?? undefined;
    return {
        id: item?.id || item?.slug || '',
        title: item?.title || item?.name || item?.titleJp || 'Unknown Title',
        image: item?.image || item?.poster || '',
        type: item?.type || 'TV',
        episode: epCount !== undefined ? String(epCount) : undefined,
        episodeCount: epCount !== undefined ? String(epCount) : undefined,
        slug: item?.slug || item?.id || '',
        dataId: item?.id || item?.slug || ''
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
                rating: info.rating || info.malScore || 'N/A',
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
"[project]/src/lib/oracle-runner.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkAllLibraryUpdates",
    ()=>checkAllLibraryUpdates
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dpi$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/dpi.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$omni$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/omni.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$hpi$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/hpi.ts [instrumentation] (ecmascript)");
;
;
;
;
;
async function checkAllLibraryUpdates() {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"]) {
        console.error("[Oracle] Supabase client is not initialized");
        return {
            error: "Database connection failed"
        };
    }
    console.log("[Oracle] Running automated library update check...");
    try {
        const { data: watchlist, error: dbError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"].from('watchlist').select('user_id, anime_id, anime_title, anime_image, media_type, last_episode_number, total_episodes, status');
        if (dbError) throw dbError;
        if (!watchlist || watchlist.length === 0) {
            console.log("[Oracle] No tracked items found.");
            return {
                notified: 0,
                message: "No tracked items"
            };
        }
        const items = watchlist;
        const notificationsToInsert = [];
        const uniqueIds = Array.from(new Set(items.map((i)=>i.anime_id)));
        for (const id of uniqueIds){
            const userItems = items.filter((i)=>i.anime_id === id);
            const sampleItem = userItems[0];
            const mediaType = (sampleItem.media_type || 'anime').toLowerCase();
            let latestEpCount = 0;
            let title = sampleItem.anime_title || id;
            let image = sampleItem.anime_image;
            let targetLink = `/watch/${id}`;
            try {
                if (mediaType === 'donghua') {
                    const info = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dpi$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["dpi"].getInfo(id);
                    if (info && info.episodes?.episodes) {
                        latestEpCount = info.episodes.episodes.length;
                        title = info.detail?.title || title;
                        image = info.detail?.image || image;
                        targetLink = `/donghua-watch/${id}`;
                    }
                } else if (mediaType === 'drama') {
                    const info = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$omni$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["omni"].drama.getDetail(id);
                    if (info && info.episodes) {
                        latestEpCount = info.episodes.length;
                        title = info.title || title;
                        image = info.image || image;
                        targetLink = `/drama-watch/${id}`;
                    }
                } else if (mediaType === 'movie' || mediaType === 'series') {
                    const info = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$omni$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["omni"].movies.getDetail(id);
                    if (info) {
                        latestEpCount = info.seasons?.reduce((acc, s)=>acc + (s.episodes?.length || 0), 0) || 1;
                        title = info.title || title;
                        image = info.image || image;
                        targetLink = `/movies-watch/${id}`;
                    }
                } else if (mediaType === 'hindi') {
                    const info = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$hpi$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["hpi"].hindi.getDetails(id);
                    if (info && info.episodes) {
                        latestEpCount = info.episodes.length;
                        title = info.title || title;
                        image = info.image || image;
                        targetLink = `/watch/${id}?audio=hi`;
                    }
                } else {
                    const info = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["AnimeService"].getAnimeInfo(id);
                    if (info && info.episodes) {
                        latestEpCount = info.episodes.length;
                        title = info.title || title;
                        image = info.poster || image;
                        targetLink = `/watch/${id}`;
                    }
                }
            } catch (err) {
                console.error(`[Oracle] Error checking updates for ${id} (${mediaType}):`, err);
                continue;
            }
            if (latestEpCount > 0) {
                for (const userItem of userItems){
                    const storedTotal = Number(userItem.total_episodes) || 0;
                    // If storedTotal is 0 or uninitialized, update DB so future comparisons are accurate
                    if (storedTotal === 0 && latestEpCount > 0) {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"].from('watchlist').update({
                            total_episodes: latestEpCount
                        }).eq('user_id', userItem.user_id).eq('anime_id', userItem.anime_id);
                        continue;
                    }
                    // If there's a genuinely new episode available
                    if (latestEpCount > storedTotal) {
                        const epLink = `${targetLink}?ep=${latestEpCount}`;
                        // Avoid inserting duplicate notification
                        const { data: existing } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"].from('notifications').select('id').eq('user_id', userItem.user_id).eq('link', epLink).maybeSingle();
                        if (!existing) {
                            notificationsToInsert.push({
                                user_id: userItem.user_id,
                                type: 'EPISODE_ALERT',
                                content: `New episode (${latestEpCount}) of "${title}" is now available!`,
                                image_url: image,
                                link: epLink,
                                is_read: false
                            });
                            // Update stored total_episodes in watchlist
                            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"].from('watchlist').update({
                                total_episodes: latestEpCount
                            }).eq('user_id', userItem.user_id).eq('anime_id', userItem.anime_id);
                        }
                    }
                }
            }
        }
        if (notificationsToInsert.length > 0) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["supabase"].from('notifications').insert(notificationsToInsert);
            console.log(`[Oracle] Successfully sent ${notificationsToInsert.length} notifications!`);
        }
        return {
            notified: notificationsToInsert.length,
            checkedItems: uniqueIds.length
        };
    } catch (e) {
        console.error("[Oracle] Check Error:", e);
        return {
            error: e.message || "Failed to check notifications"
        };
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__bbc71c27._.js.map