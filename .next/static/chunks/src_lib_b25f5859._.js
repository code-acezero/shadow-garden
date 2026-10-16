(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$2$2e$6$2e$1$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/tailwind-merge@2.6.1/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function getChunkLabel(chunk, defaultStart, defaultEnd) {
    if (!chunk || chunk.length === 0) return "".concat(defaultStart, "-").concat(defaultEnd);
    const validNums = [];
    for (const ep of chunk){
        if (!ep || ep.number == null) continue;
        const num = parseFloat(ep.number);
        if (!isNaN(num)) validNums.push(num);
    }
    if (validNums.length === 0) return "".concat(defaultStart, "-").concat(defaultEnd);
    if (validNums.length === 1) return "".concat(validNums[0]);
    const sorted = [
        ...validNums
    ].sort((a, b)=>a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    // Filter out numbers that are too far from the median (outliers)
    const filtered = validNums.filter((n)=>Math.abs(n - median) <= 150);
    if (filtered.length === 0) return "".concat(defaultStart, "-").concat(defaultEnd);
    if (filtered.length === 1) return "".concat(filtered[0]);
    return "".concat(filtered[0], "-").concat(filtered[filtered.length - 1]);
}
function cn() {
    for(var _len = arguments.length, inputs = new Array(_len), _key = 0; _key < _len; _key++){
        inputs[_key] = arguments[_key];
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$2$2e$6$2e$1$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function getBaseURL() {
    // 1. Client-side
    if ("TURBOPACK compile-time truthy", 1) {
        return window.location.origin;
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
    const epQuery = episodeId ? "?ep=".concat(encodeURIComponent(episodeId)) : '';
    if (t === 'hindi' || t === 'hindi-anime') {
        return "/watch/".concat(animeId).concat(episodeId ? "?ep=".concat(encodeURIComponent(episodeId), "&audio=hi") : '?audio=hi');
    }
    if (t === 'donghua') {
        return "/donghua-watch/".concat(animeId).concat(epQuery);
    }
    if (t === 'drama' || t === 'cdrama' || t === 'kdrama') {
        return "/drama-watch/".concat(animeId).concat(epQuery);
    }
    if (t === 'movie' || t === 'movies') {
        return "/movies-watch/".concat(animeId);
    }
    return "/watch/".concat(animeId).concat(epQuery);
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
    if (animeId && typeof animeId === 'string' && "object" !== 'undefined') {
        try {
            const cached = localStorage.getItem("shadow_anime_title_".concat(animeId));
            if (cached && cached.trim() !== '' && !cached.toLowerCase().includes('unknown') && !/^\d+$/.test(cached.trim())) {
                return cached.trim();
            }
        } catch (e) {}
    }
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
        return "Anime #".concat(animeId.trim());
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
        return "/api/proxy?url=".concat(encodeURIComponent(trimmed));
    }
    return trimmed;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/supabase.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSupabaseBrowserClient",
    ()=>getSupabaseBrowserClient,
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$110$2e$8$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@supabase+supabase-js@2.110.8/node_modules/@supabase/supabase-js/dist/index.mjs [app-client] (ecmascript) <locals>");
;
// Singleton instance container
let supabaseInstance = null;
const getSupabaseBrowserClient = ()=>{
    if (!supabaseInstance) {
        const url = ("TURBOPACK compile-time value", "https://kacgsuabfdqcskjonzkl.supabase.co") || '';
        const key = ("TURBOPACK compile-time value", "sb_publishable_UOBkqQdOw4XFiO2CMmrmyw_kALwbMGw") || '';
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        supabaseInstance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$110$2e$8$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(url, key);
    }
    return supabaseInstance;
};
const supabase = getSupabaseBrowserClient();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/toast.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toast",
    ()=>toast
]);
const dispatchWhisper = function(title, message) {
    let type = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 'system';
    if ("TURBOPACK compile-time truthy", 1) {
        window.dispatchEvent(new CustomEvent('shadow-whisper', {
            detail: {
                id: Date.now(),
                type,
                title,
                message
            }
        }));
    }
};
const toast = Object.assign((message, data)=>{
    dispatchWhisper('Notification', String(message), 'system');
}, {
    success: (message, data)=>{
        dispatchWhisper('Success', String(message), 'success');
    },
    error: (message, data)=>{
        dispatchWhisper('Error', String(message), 'error');
    },
    info: (message, data)=>{
        dispatchWhisper('Info', String(message), 'system');
    },
    warning: (message, data)=>{
        dispatchWhisper('Warning', String(message), 'warning');
    },
    loading: (message, data)=>{
        dispatchWhisper('Loading', String(message), 'system');
        return 'loading-toast-id'; // Return mock ID for dismiss
    },
    dismiss: (id)=>{
        dispatchWhisper('Done', 'Action completed', 'system');
    },
    promise: (promise, data)=>{
        dispatchWhisper('Processing', data.loading, 'system');
        promise.then((res)=>{
            const successMsg = typeof data.success === 'function' ? data.success(res) : data.success;
            dispatchWhisper('Success', successMsg, 'success');
        }).catch((err)=>{
            const errorMsg = typeof data.error === 'function' ? data.error(err) : data.error;
            dispatchWhisper('Error', errorMsg, 'error');
        });
        return promise;
    }
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/voice.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getVoiceSettings",
    ()=>getVoiceSettings,
    "loadVoiceProfile",
    ()=>loadVoiceProfile,
    "playVoice",
    ()=>playVoice,
    "refreshVoiceCache",
    ()=>refreshVoiceCache,
    "syncVoiceProfile",
    ()=>syncVoiceProfile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
;
// --- WHISPER HELPER ---
const notifyIsland = (title, message)=>{
    if ("TURBOPACK compile-time truthy", 1) {
        window.dispatchEvent(new CustomEvent('shadow-whisper', {
            detail: {
                id: Date.now(),
                type: 'guild_notification',
                title,
                message
            }
        }));
    }
};
const VOICE_SCRIPTS = {
    GREET_MASTER: "Welcome back, Master. The shadows await your command.",
    GREET_ADVENTURER: "Welcome back, Adventurer. It is good to see you again.",
    GREET_TRAVELER: "Greetings, Traveler. Do you wish to join our ranks today?",
    WELCOME: "Welcome to Shadow Garden. This is a sanctuary for those who seek the wisdom of anime. What brings you here today, traveler?",
    REGISTER: "Thanks for registering at shadow garden. Good luck with your adventurer journey.",
    BYE_MASTER: "See you again master, have a nice day.",
    BYE_ADVENTURER: "See you again adventurer, have a nice day."
};
const getVoiceSettings = ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const stored = localStorage.getItem('shadow_voice_settings');
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.warn("Invalid shadow_voice_settings in localStorage");
    }
    return {
        pack: 'Alpha',
        language: 'en',
        enabled: true
    };
};
// --- DYNAMIC CACHE ---
// Stores voice data fetched from Supabase to avoid repeated calls
let dynamicVoiceCache = [];
const refreshVoiceCache = async ()=>{
    try {
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('voice_packs').select('*');
        if (data) dynamicVoiceCache = data;
    } catch (e) {
        console.warn("Failed to refresh voice cache", e);
    }
};
const playVoice = (event)=>{
    const settings = getVoiceSettings();
    const scriptText = VOICE_SCRIPTS[event];
    // 1. Visual Notification
    if (scriptText) {
        let title = settings.pack || "Guild Receptionist";
        if (event.includes('MASTER')) title = "Guild Receptionist";
        notifyIsland(title, scriptText);
    }
    if (!settings.enabled) return;
    // 2. Determine Audio Source
    let fileUrl = '';
    // Attempt to find in Dynamic Cache (DB)
    // Assumes DB has columns: character, language, event_trigger, file_url
    const dynamicMatch = dynamicVoiceCache.find((v)=>v.character === settings.pack && v.language === settings.language && v.event_trigger === event);
    if (dynamicMatch) {
        fileUrl = dynamicMatch.file_url;
    } else {
        // Fallback to Local System
        let action = "";
        switch(event){
            case 'WELCOME':
                action = "welcome";
                break;
            case 'REGISTER':
                action = "register";
                break;
            case 'GREET_MASTER':
                action = "greet-master";
                break;
            case 'GREET_ADVENTURER':
                action = "greet-adventurer";
                break;
            case 'GREET_TRAVELER':
                action = "greet-traveler";
                break;
            case 'BYE_MASTER':
                action = "bye-master";
                break;
            case 'BYE_ADVENTURER':
                action = "bye-adventurer";
                break;
        }
        // Normalize for file system
        let packName = settings.pack.toLowerCase();
        if (packName.startsWith('system-')) packName = packName.replace('system-', '');
        // Construct Path
        // e.g. /audio/alpha_welcome.mp3 OR /voices/en/hana-welcome.mp3
        if ([
            'alpha',
            'beta',
            'shadow',
            'delta',
            'zeta'
        ].includes(packName)) {
            // Legacy Static paths
            const suffix = settings.language === 'jp' ? '_jp' : '';
            fileUrl = "/audio/".concat(packName).concat(suffix, "_").concat(action, ".mp3");
        } else {
            // Standard dynamic structure
            fileUrl = "/voices/".concat(settings.language, "/").concat(packName, "-").concat(action, ".mp3");
        }
    }
    // 3. Play
    if (fileUrl) {
        console.log("🔊 [ShadowVoice] Playing: ".concat(fileUrl));
        const audio = new Audio(fileUrl);
        // Default to 1.0 if not set, or use settings.volume
        audio.volume = settings.volume !== undefined ? settings.volume : 1.0;
        audio.play().catch((e)=>console.warn("Autoplay blocked/missing:", e));
    }
};
const syncVoiceProfile = async (userId)=>{
    const localSettings = getVoiceSettings();
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"]) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update({
            voice_pack: localSettings.pack
        }).eq('id', userId);
    }
};
const loadVoiceProfile = async (userId)=>{
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"]) return;
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('voice_pack').eq('id', userId).single();
    if (data && data.voice_pack) {
        const current = getVoiceSettings();
        const newSettings = {
            ...current,
            pack: data.voice_pack
        };
        if ("TURBOPACK compile-time truthy", 1) {
            localStorage.setItem('shadow_voice_settings', JSON.stringify(newSettings));
        }
    }
    // Refresh cache on load to ensure we have the latest DB links
    refreshVoiceCache();
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/extractors/streamExtractor.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/buffer/index.js [app-client] (ecmascript)");
const streamCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;
function xorDecrypt(base64Str) {
    let key = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'otaku-embed-v1';
    try {
        let binary;
        if (typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"] !== 'undefined') {
            binary = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from(base64Str, 'base64');
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
async function fetchZokoMalStream(malId, episode) {
    let mode = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 'sub';
    try {
        var _parsed_skip, _parsed_skip1;
        const embedUrl = "https://zokoanime.video/stream/mal/".concat(malId, "/").concat(episode, "/").concat(mode);
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
            intro: parsed.intro || ((_parsed_skip = parsed.skip) === null || _parsed_skip === void 0 ? void 0 : _parsed_skip.intro) || null,
            outro: parsed.outro || ((_parsed_skip1 = parsed.skip) === null || _parsed_skip1 === void 0 ? void 0 : _parsed_skip1.outro) || null
        };
    } catch (err) {
        return null;
    }
}
async function fetchBlakiteHindiStream(title, episode) {
    try {
        var _searchJson_data, _detailJson_data_episodes, _detailJson_data, _detailJson_data1;
        const base = 'https://omni-api-v1.vercel.app/api/blakite';
        const cleanSearch = title.replace(/\(TV\)|\(Movie\)|\(Dub\)|\(Sub\)|Season\s*\d+/gi, '').trim();
        const searchRes = await fetch("".concat(base, "/search?q=").concat(encodeURIComponent(cleanSearch)), {
            cache: 'no-store'
        });
        if (!searchRes.ok) return null;
        const searchJson = await searchRes.json();
        const results = ((_searchJson_data = searchJson.data) === null || _searchJson_data === void 0 ? void 0 : _searchJson_data.results) || [];
        if (!results.length) return null;
        const cleanInput = cleanSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matched = results.find((r)=>{
            const cleanTarget = (r.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanTarget.includes(cleanInput) || cleanInput.includes(cleanTarget);
        }) || results[0];
        const detailRes = await fetch("".concat(base, "/anime/").concat(matched.id), {
            cache: 'no-store'
        });
        if (!detailRes.ok) return null;
        const detailJson = await detailRes.json();
        const episodesList = ((_detailJson_data = detailJson.data) === null || _detailJson_data === void 0 ? void 0 : (_detailJson_data_episodes = _detailJson_data.episodes) === null || _detailJson_data_episodes === void 0 ? void 0 : _detailJson_data_episodes.episodes) || ((_detailJson_data1 = detailJson.data) === null || _detailJson_data1 === void 0 ? void 0 : _detailJson_data1.episodes) || [];
        const targetEpNum = Number(episode);
        const epObj = episodesList.find((e)=>Number(e.number) === targetEpNum) || episodesList[0];
        if (!epObj) return null;
        const watchRes = await fetch("".concat(base, "/watch/").concat(encodeURIComponent(epObj.id)), {
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
                        serverId: "blakite-".concat(src.server || 'mirror'),
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
        } else if (typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"] !== 'undefined') {
            binStr = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from(b, 'base64').toString('binary');
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
    } catch (e) {
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
        } catch (e) {}
        const isTcdn = embedUrl.includes('s=tcdn');
        const getSourcesUrl = "https://megaplay.buzz/videojs/stream/getSources?id=".concat(realId).concat(isTcdn ? '&s=tcdn' : '');
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
        if (!(data === null || data === void 0 ? void 0 : data.enc)) return {
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
    } catch (e) {
        return {
            m3u8: null
        };
    }
}
function parseWatchResponse(text) {
    if (!text) return null;
    const trimmed = text.trim();
    try {
        var _parsed_data_sources, _parsed_data, _parsed_sources;
        const parsed = JSON.parse(trimmed);
        if ((parsed === null || parsed === void 0 ? void 0 : (_parsed_data = parsed.data) === null || _parsed_data === void 0 ? void 0 : (_parsed_data_sources = _parsed_data.sources) === null || _parsed_data_sources === void 0 ? void 0 : _parsed_data_sources.length) || (parsed === null || parsed === void 0 ? void 0 : (_parsed_sources = parsed.sources) === null || _parsed_sources === void 0 ? void 0 : _parsed_sources.length)) {
            return parsed.data ? parsed : {
                data: parsed
            };
        }
    } catch (e) {}
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
            var _obj_data;
            const obj = JSON.parse(payload);
            if (obj.type === 'source' && obj.source) {
                collectedSources.push(obj.source);
            } else if (obj.type === 'sources' && Array.isArray(obj.sources)) {
                collectedSources.push(...obj.sources);
            } else if (((_obj_data = obj.data) === null || _obj_data === void 0 ? void 0 : _obj_data.sources) && Array.isArray(obj.data.sources)) {
                collectedSources.push(...obj.data.sources);
            } else if (obj.type === 'servers' && Array.isArray(obj.servers)) {
                collectedServers = obj.servers;
            } else if (obj.type === 'skip_data' && obj.skip_data) {
                skipData = obj.skip_data;
            } else if (obj.type === 'episode' && obj.episode) {
                episodeData = obj.episode;
            }
        } catch (e) {}
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
                    const sRes = await fetch("".concat(mirror, "/search?keyword=").concat(encodeURIComponent(clean)), {
                        signal: AbortSignal.timeout(3500)
                    });
                    if (sRes.ok) {
                        var _sJson_data_results, _sJson_data;
                        const sJson = await sRes.json();
                        const top = (_sJson_data = sJson.data) === null || _sJson_data === void 0 ? void 0 : (_sJson_data_results = _sJson_data.results) === null || _sJson_data_results === void 0 ? void 0 : _sJson_data_results[0];
                        if (top === null || top === void 0 ? void 0 : top.slug) {
                            slug = top.slug;
                            break;
                        }
                    }
                } catch (e) {}
            }
        }
        for (const mirror of mirrors){
            try {
                const epRes = await fetch("".concat(mirror, "/anime/").concat(encodeURIComponent(slug), "/episodes"), {
                    signal: AbortSignal.timeout(3500)
                });
                if (epRes.ok) {
                    var _epJson_data_episodes, _epJson_data;
                    const epJson = await epRes.json();
                    const firstEp = (_epJson_data = epJson.data) === null || _epJson_data === void 0 ? void 0 : (_epJson_data_episodes = _epJson_data.episodes) === null || _epJson_data_episodes === void 0 ? void 0 : _epJson_data_episodes[0];
                    if (firstEp === null || firstEp === void 0 ? void 0 : firstEp.dataMal) {
                        const parsed = parseInt(firstEp.dataMal, 10);
                        if (!isNaN(parsed) && parsed > 0) {
                            malIdCache.set(key, parsed);
                            return parsed;
                        }
                    }
                }
            } catch (e) {}
        }
    } catch (e) {}
    return null;
}
async function fetchAnikotoWatchDubStream(titleOrSlug, episode) {
    const mirrors = [
        'https://omni-api-v1.vercel.app/api',
        'https://omni-api-v2.vercel.app/api',
        'https://omni-api-v3.vercel.app/api'
    ];
    try {
        var _watchJson_data_sources, _watchJson_data, _watchJson_data1;
        let slug = titleOrSlug;
        const isExactHashedSlug = /-[a-z0-9]{5}$/.test(slug);
        if (!isExactHashedSlug) {
            const searchKeyword = titleOrSlug.replace(/::\d+$/, '').replace(/\(TV\)|\(Movie\)|\(Dub\)|\(Sub\)|Season\s*\d+|Part\s*\d+/gi, '').replace(/-/g, ' ').trim();
            for (const mirror of mirrors){
                try {
                    const searchRes = await fetch("".concat(mirror, "/search?keyword=").concat(encodeURIComponent(searchKeyword)), {
                        signal: AbortSignal.timeout(4000)
                    });
                    if (searchRes.ok) {
                        var _json_data;
                        const json = await searchRes.json();
                        const results = ((_json_data = json.data) === null || _json_data === void 0 ? void 0 : _json_data.results) || [];
                        if (results.length > 0) {
                            slug = results[0].slug;
                            break;
                        }
                    }
                } catch (e) {}
            }
        }
        let watchJson = null;
        for (const mirror of mirrors){
            try {
                const watchRes = await fetch("".concat(mirror, "/watch/").concat(encodeURIComponent(slug), "?ep=").concat(episode), {
                    signal: AbortSignal.timeout(5000)
                });
                if (watchRes.ok) {
                    var _parsed_data_sources, _parsed_data, _parsed_sources;
                    const text = await watchRes.text();
                    const parsed = parseWatchResponse(text);
                    if ((parsed === null || parsed === void 0 ? void 0 : (_parsed_data = parsed.data) === null || _parsed_data === void 0 ? void 0 : (_parsed_data_sources = _parsed_data.sources) === null || _parsed_data_sources === void 0 ? void 0 : _parsed_data_sources.length) || (parsed === null || parsed === void 0 ? void 0 : (_parsed_sources = parsed.sources) === null || _parsed_sources === void 0 ? void 0 : _parsed_sources.length)) {
                        watchJson = parsed.data ? parsed : {
                            data: parsed
                        };
                        break;
                    }
                }
            } catch (e) {}
        }
        // Fallback: If slug didn't produce watch sources, search by clean title and retry watch
        if (!(watchJson === null || watchJson === void 0 ? void 0 : (_watchJson_data = watchJson.data) === null || _watchJson_data === void 0 ? void 0 : (_watchJson_data_sources = _watchJson_data.sources) === null || _watchJson_data_sources === void 0 ? void 0 : _watchJson_data_sources.length) && isExactHashedSlug) {
            const fallbackTitle = titleOrSlug.replace(/-[a-z0-9]{5}$/, '').replace(/\(TV\)|\(Movie\)|\(Dub\)|\(Sub\)|Season\s*\d+|Part\s*\d+/gi, '').replace(/-/g, ' ').trim();
            for (const mirror of mirrors){
                try {
                    const searchRes = await fetch("".concat(mirror, "/search?keyword=").concat(encodeURIComponent(fallbackTitle)), {
                        signal: AbortSignal.timeout(4000)
                    });
                    if (searchRes.ok) {
                        var _sJson_data;
                        const sJson = await searchRes.json();
                        const results = ((_sJson_data = sJson.data) === null || _sJson_data === void 0 ? void 0 : _sJson_data.results) || [];
                        if (results.length > 0) {
                            const newSlug = results[0].slug;
                            const wRes = await fetch("".concat(mirror, "/watch/").concat(encodeURIComponent(newSlug), "?ep=").concat(episode), {
                                signal: AbortSignal.timeout(5000)
                            });
                            if (wRes.ok) {
                                var _parsed_data_sources1, _parsed_data1, _parsed_sources1;
                                const text = await wRes.text();
                                const parsed = parseWatchResponse(text);
                                if ((parsed === null || parsed === void 0 ? void 0 : (_parsed_data1 = parsed.data) === null || _parsed_data1 === void 0 ? void 0 : (_parsed_data_sources1 = _parsed_data1.sources) === null || _parsed_data_sources1 === void 0 ? void 0 : _parsed_data_sources1.length) || (parsed === null || parsed === void 0 ? void 0 : (_parsed_sources1 = parsed.sources) === null || _parsed_sources1 === void 0 ? void 0 : _parsed_sources1.length)) {
                                    watchJson = parsed.data ? parsed : {
                                        data: parsed
                                    };
                                    break;
                                }
                            }
                        }
                    }
                } catch (e) {}
            }
        }
        const sources = (watchJson === null || watchJson === void 0 ? void 0 : (_watchJson_data1 = watchJson.data) === null || _watchJson_data1 === void 0 ? void 0 : _watchJson_data1.sources) || [];
        const dubSources = sources.filter((s)=>s && s.type === 'dub' && s.url);
        if (!dubSources.length) {
            return null;
        }
        // Process all sources in parallel: extract direct .m3u8 if available, fallback to embed
        const serverPromises = dubSources.map(async (src, index)=>{
            const rawName = String(src.server || '').toLowerCase();
            let serverName = 'Vidstream';
            let serverId = "vidstream-dub-".concat(index + 1);
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
            if (direct === null || direct === void 0 ? void 0 : direct.m3u8) {
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
                serverId: "".concat(serverId, "-embed"),
                serverName: "".concat(serverName, " (Embed)"),
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
async function resolveUnifiedStreams(param) {
    let { malId, title, episode = 1, countryOfOrigin = 'JP', knownHasDub = false } = param;
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
    const cacheKey = "".concat(malId || title, "_").concat(epNum, "_").concat(primarySubId);
    const cached = streamCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        var _cached_data_servers_primarySubId, _cached_data_servers_en;
        if (((_cached_data_servers_primarySubId = cached.data.servers[primarySubId]) === null || _cached_data_servers_primarySubId === void 0 ? void 0 : _cached_data_servers_primarySubId.length) > 0 || ((_cached_data_servers_en = cached.data.servers.en) === null || _cached_data_servers_en === void 0 ? void 0 : _cached_data_servers_en.length) > 0) {
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
            if (subRes === null || subRes === void 0 ? void 0 : subRes.url) {
                var _subRes_subtitles, _subRes_subtitles1;
                serversByAudio[primarySubId].push({
                    serverId: 'megacloud-sub',
                    serverName: 'MegaCloud',
                    url: subRes.url,
                    type: 'm3u8',
                    referer: 'https://zokoanime.video/',
                    tracks: (_subRes_subtitles = subRes.subtitles) === null || _subRes_subtitles === void 0 ? void 0 : _subRes_subtitles.map((s)=>({
                            file: s.url,
                            label: s.label,
                            default: s.default
                        })),
                    intro: subRes.intro,
                    outro: subRes.outro
                });
                if ((_subRes_subtitles1 = subRes.subtitles) === null || _subRes_subtitles1 === void 0 ? void 0 : _subRes_subtitles1.length) globalSubtitles = subRes.subtitles;
                if (subRes.intro) introData = subRes.intro;
                if (subRes.outro) outroData = subRes.outro;
            }
        }));
    }
    // B1. English Dub via ZokoAnime Direct HLS (High Availability Direct .m3u8 + Subtitles + Auto-Skip)
    if (effectiveMalId) {
        fetchPromises.push(fetchZokoMalStream(effectiveMalId, epNum, 'dub').then((dubRes)=>{
            if (dubRes === null || dubRes === void 0 ? void 0 : dubRes.url) {
                var _dubRes_subtitles, _dubRes_subtitles1;
                serversByAudio.en.push({
                    serverId: 'megacloud-dub',
                    serverName: 'MegaCloud',
                    url: dubRes.url,
                    type: 'm3u8',
                    referer: 'https://zokoanime.video/',
                    tracks: (_dubRes_subtitles = dubRes.subtitles) === null || _dubRes_subtitles === void 0 ? void 0 : _dubRes_subtitles.map((s)=>({
                            file: s.url,
                            label: s.label,
                            default: s.default
                        })),
                    intro: dubRes.intro,
                    outro: dubRes.outro
                });
                if (((_dubRes_subtitles1 = dubRes.subtitles) === null || _dubRes_subtitles1 === void 0 ? void 0 : _dubRes_subtitles1.length) && !globalSubtitles.length) {
                    globalSubtitles = dubRes.subtitles;
                }
                if (dubRes.intro && !introData) introData = dubRes.intro;
                if (dubRes.outro && !outroData) outroData = dubRes.outro;
            }
        }));
    }
    // B2. English Dub via Anikoto (MegaPlay / Vidstream / Vidstreaming)
    fetchPromises.push(fetchAnikotoWatchDubStream(title, epNum).then((dubServers)=>{
        if (dubServers === null || dubServers === void 0 ? void 0 : dubServers.length) {
            for (const s of dubServers){
                // Avoid duplicate URLs
                if (!serversByAudio.en.some((existing)=>existing.url === s.url)) {
                    serversByAudio.en.push(s);
                }
            }
            const withTracks = dubServers.find((s)=>s.tracks && s.tracks.length > 0);
            if (withTracks && withTracks.tracks && !globalSubtitles.length) {
                globalSubtitles = withTracks.tracks.map((t)=>{
                    var _t_label_toLowerCase, _t_label;
                    return {
                        url: t.file,
                        lang: ((_t_label = t.label) === null || _t_label === void 0 ? void 0 : (_t_label_toLowerCase = _t_label.toLowerCase()) === null || _t_label_toLowerCase === void 0 ? void 0 : _t_label_toLowerCase.slice(0, 2)) || 'en',
                        label: t.label || 'English',
                        default: !!t.default
                    };
                });
            }
            const withIntro = dubServers.find((s)=>s.intro);
            if ((withIntro === null || withIntro === void 0 ? void 0 : withIntro.intro) && !introData) introData = withIntro.intro;
            const withOutro = dubServers.find((s)=>s.outro);
            if ((withOutro === null || withOutro === void 0 ? void 0 : withOutro.outro) && !outroData) outroData = withOutro.outro;
        }
    }));
    // C. Hindi Dub via Blakite
    fetchPromises.push(fetchBlakiteHindiStream(title, epNum).then((hindiServers)=>{
        if (hindiServers === null || hindiServers === void 0 ? void 0 : hindiServers.length) {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/anilist.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
async function queryAniList(query) {
    let variables = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const cacheKey = JSON.stringify({
        query,
        variables
    });
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
        return cached.data;
    }
    const isBrowser = "object" !== 'undefined';
    const targetUrl = ("TURBOPACK compile-time truthy", 1) ? '/api/anime/anilist' : "TURBOPACK unreachable";
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
    try {
        const res = await fetch(targetUrl, fetchOptions);
        clearTimeout(timer);
        if (!res.ok) {
            console.warn("[AniList] GraphQL request failed with status: ".concat(res.status));
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
const MEDIA_CARD_FIELDS = "\n  id\n  idMal\n  title {\n    romaji\n    english\n    native\n  }\n  coverImage {\n    extraLarge\n    large\n    medium\n  }\n  bannerImage\n  format\n  status\n  episodes\n  duration\n  genres\n  averageScore\n  countryOfOrigin\n  isAdult\n  nextAiringEpisode {\n    airingAt\n    timeUntilAiring\n    episode\n  }\n";
function cleanHtml(html) {
    if (!html) return '';
    return html.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>?/gm, '').trim();
}
function mapMediaToCard(media, overrideEp) {
    var _media_title, _media_title1, _media_title2, _media_title3, _media_title4, _media_coverImage, _media_coverImage1, _media_coverImage2;
    const title = ((_media_title = media.title) === null || _media_title === void 0 ? void 0 : _media_title.english) || ((_media_title1 = media.title) === null || _media_title1 === void 0 ? void 0 : _media_title1.romaji) || ((_media_title2 = media.title) === null || _media_title2 === void 0 ? void 0 : _media_title2.native) || 'Unknown Title';
    const jname = ((_media_title3 = media.title) === null || _media_title3 === void 0 ? void 0 : _media_title3.romaji) || ((_media_title4 = media.title) === null || _media_title4 === void 0 ? void 0 : _media_title4.native) || '';
    const poster = ((_media_coverImage = media.coverImage) === null || _media_coverImage === void 0 ? void 0 : _media_coverImage.extraLarge) || ((_media_coverImage1 = media.coverImage) === null || _media_coverImage1 === void 0 ? void 0 : _media_coverImage1.large) || ((_media_coverImage2 = media.coverImage) === null || _media_coverImage2 === void 0 ? void 0 : _media_coverImage2.medium) || '';
    // Calculate current released episodes
    let currentEp = overrideEp || 0;
    if (!currentEp) {
        var _media_nextAiringEpisode;
        if ((_media_nextAiringEpisode = media.nextAiringEpisode) === null || _media_nextAiringEpisode === void 0 ? void 0 : _media_nextAiringEpisode.episode) {
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
        duration: media.duration ? "".concat(media.duration, "m") : undefined,
        episodes: {
            sub: currentEp,
            dub: currentEp,
            eps: media.episodes || currentEp
        },
        rank: media.averageScore,
        isAdult: !!media.isAdult,
        rating: media.averageScore ? "".concat((media.averageScore / 10).toFixed(1), "/10") : 'PG-13'
    };
}
class AniListService {
    /**
   * 1. LATEST AIRED EPISODES (Real-time updates as episodes broadcast)
   * Mirrors how Anikoto /latest updated, but with live broadcast timestamps!
   */ static async getRecentEpisodes() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1, perPage = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 24;
        var _data_Page;
        const query = "\n      query ($page: Int, $perPage: Int, $airingAt_lesser: Int) {\n        Page(page: $page, perPage: $perPage) {\n          airingSchedules(\n            airingAt_lesser: $airingAt_lesser, \n            sort: TIME_DESC\n          ) {\n            id\n            airingAt\n            episode\n            media {\n              ".concat(MEDIA_CARD_FIELDS, "\n            }\n          }\n        }\n      }\n    ");
        const now = Math.floor(Date.now() / 1000);
        const data = await queryAniList(query, {
            page,
            perPage: perPage * 2,
            airingAt_lesser: now
        });
        const schedules = (data === null || data === void 0 ? void 0 : (_data_Page = data.Page) === null || _data_Page === void 0 ? void 0 : _data_Page.airingSchedules) || [];
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
        var _data_Page;
        const query = '\n      query {\n        Page(page: 1, perPage: 10) {\n          media(\n            type: ANIME, \n            sort: TRENDING_DESC, \n            countryOfOrigin: "JP",\n            isAdult: false\n          ) {\n            '.concat(MEDIA_CARD_FIELDS, "\n            description(asHtml: false)\n          }\n        }\n      }\n    ");
        const data = await queryAniList(query);
        const list = (data === null || data === void 0 ? void 0 : (_data_Page = data.Page) === null || _data_Page === void 0 ? void 0 : _data_Page.media) || [];
        return list.map((item)=>{
            var _item_coverImage, _item_coverImage1;
            return {
                ...mapMediaToCard(item),
                description: cleanHtml(item.description),
                banner: item.bannerImage || ((_item_coverImage = item.coverImage) === null || _item_coverImage === void 0 ? void 0 : _item_coverImage.extraLarge) || ((_item_coverImage1 = item.coverImage) === null || _item_coverImage1 === void 0 ? void 0 : _item_coverImage1.large)
            };
        });
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
   */ static async getTopAiring() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1, perPage = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 24;
        var _data_Page;
        const query = '\n      query ($page: Int, $perPage: Int) {\n        Page(page: $page, perPage: $perPage) {\n          media(\n            type: ANIME, \n            status: RELEASING, \n            sort: POPULARITY_DESC, \n            countryOfOrigin: "JP"\n          ) {\n            '.concat(MEDIA_CARD_FIELDS, "\n          }\n        }\n      }\n    ");
        const data = await queryAniList(query, {
            page,
            perPage
        });
        return ((data === null || data === void 0 ? void 0 : (_data_Page = data.Page) === null || _data_Page === void 0 ? void 0 : _data_Page.media) || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 5. MOST POPULAR ANIME
   */ static async getMostPopular() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1, perPage = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 24;
        var _data_Page;
        const query = '\n      query ($page: Int, $perPage: Int) {\n        Page(page: $page, perPage: $perPage) {\n          media(\n            type: ANIME, \n            sort: POPULARITY_DESC, \n            countryOfOrigin: "JP"\n          ) {\n            '.concat(MEDIA_CARD_FIELDS, "\n          }\n        }\n      }\n    ");
        const data = await queryAniList(query, {
            page,
            perPage
        });
        return ((data === null || data === void 0 ? void 0 : (_data_Page = data.Page) === null || _data_Page === void 0 ? void 0 : _data_Page.media) || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 6. TOP UPCOMING
   */ static async getTopUpcoming() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1, perPage = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 24;
        var _data_Page;
        const query = '\n      query ($page: Int, $perPage: Int) {\n        Page(page: $page, perPage: $perPage) {\n          media(\n            type: ANIME, \n            status: NOT_YET_RELEASED, \n            sort: POPULARITY_DESC, \n            countryOfOrigin: "JP"\n          ) {\n            '.concat(MEDIA_CARD_FIELDS, "\n          }\n        }\n      }\n    ");
        const data = await queryAniList(query, {
            page,
            perPage
        });
        return ((data === null || data === void 0 ? void 0 : (_data_Page = data.Page) === null || _data_Page === void 0 ? void 0 : _data_Page.media) || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 7. COMPLETED ANIME
   */ static async getCompleted() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1, perPage = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 24;
        var _data_Page;
        const query = '\n      query ($page: Int, $perPage: Int) {\n        Page(page: $page, perPage: $perPage) {\n          media(\n            type: ANIME, \n            status: FINISHED, \n            sort: POPULARITY_DESC, \n            countryOfOrigin: "JP"\n          ) {\n            '.concat(MEDIA_CARD_FIELDS, "\n          }\n        }\n      }\n    ");
        const data = await queryAniList(query, {
            page,
            perPage
        });
        return ((data === null || data === void 0 ? void 0 : (_data_Page = data.Page) === null || _data_Page === void 0 ? void 0 : _data_Page.media) || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 8. MOST FAVORITE ANIME
   */ static async getMostFavorite() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1, perPage = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 24;
        var _data_Page;
        const query = '\n      query ($page: Int, $perPage: Int) {\n        Page(page: $page, perPage: $perPage) {\n          media(\n            type: ANIME, \n            sort: FAVOURITES_DESC, \n            countryOfOrigin: "JP"\n          ) {\n            '.concat(MEDIA_CARD_FIELDS, "\n          }\n        }\n      }\n    ");
        const data = await queryAniList(query, {
            page,
            perPage
        });
        return ((data === null || data === void 0 ? void 0 : (_data_Page = data.Page) === null || _data_Page === void 0 ? void 0 : _data_Page.media) || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 9. SEARCH ANIME
   */ static async search(keyword) {
        let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1, perPage = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 24;
        var _data_Page, _data_Page1;
        const query = '\n      query ($search: String, $page: Int, $perPage: Int) {\n        Page(page: $page, perPage: $perPage) {\n          pageInfo {\n            currentPage\n            hasNextPage\n            lastPage\n          }\n          media(\n            search: $search, \n            type: ANIME, \n            countryOfOrigin: "JP"\n          ) {\n            '.concat(MEDIA_CARD_FIELDS, "\n          }\n        }\n      }\n    ");
        const data = await queryAniList(query, {
            search: keyword,
            page,
            perPage
        });
        const pInfo = data === null || data === void 0 ? void 0 : (_data_Page = data.Page) === null || _data_Page === void 0 ? void 0 : _data_Page.pageInfo;
        const results = ((data === null || data === void 0 ? void 0 : (_data_Page1 = data.Page) === null || _data_Page1 === void 0 ? void 0 : _data_Page1.media) || []).map((m)=>mapMediaToCard(m));
        var _pInfo_currentPage;
        return {
            results,
            currentPage: (_pInfo_currentPage = pInfo === null || pInfo === void 0 ? void 0 : pInfo.currentPage) !== null && _pInfo_currentPage !== void 0 ? _pInfo_currentPage : page,
            hasNextPage: !!(pInfo === null || pInfo === void 0 ? void 0 : pInfo.hasNextPage),
            hasPreviousPage: page > 1,
            maxPage: (pInfo === null || pInfo === void 0 ? void 0 : pInfo.lastPage) || ((pInfo === null || pInfo === void 0 ? void 0 : pInfo.hasNextPage) ? page + 1 : page),
            minPage: 1
        };
    }
    /**
   * 10. SEARCH SUGGESTIONS (Typeahead)
   */ static async getSearchSuggestions(keyword) {
        var _data_Page;
        const query = '\n      query ($search: String) {\n        Page(page: 1, perPage: 8) {\n          media(\n            search: $search, \n            type: ANIME, \n            countryOfOrigin: "JP"\n          ) {\n            id\n            title {\n              english\n              romaji\n            }\n            coverImage {\n              medium\n            }\n            format\n            duration\n          }\n        }\n      }\n    ';
        const data = await queryAniList(query, {
            search: keyword
        });
        return ((data === null || data === void 0 ? void 0 : (_data_Page = data.Page) === null || _data_Page === void 0 ? void 0 : _data_Page.media) || []).map((item)=>{
            var _item_title, _item_title1, _item_coverImage;
            return {
                id: String(item.id),
                title: ((_item_title = item.title) === null || _item_title === void 0 ? void 0 : _item_title.english) || ((_item_title1 = item.title) === null || _item_title1 === void 0 ? void 0 : _item_title1.romaji) || 'Unknown Title',
                poster: ((_item_coverImage = item.coverImage) === null || _item_coverImage === void 0 ? void 0 : _item_coverImage.medium) || '',
                type: item.format || 'TV',
                duration: item.duration ? "".concat(item.duration, "m") : '?'
            };
        });
    }
    /**
   * 11. FILTER BY GENRE
   */ static async getByGenre(genre) {
        let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1, perPage = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 24;
        var _data_Page;
        const query = '\n      query ($genre: String, $page: Int, $perPage: Int) {\n        Page(page: $page, perPage: $perPage) {\n          media(\n            genre: $genre, \n            type: ANIME, \n            sort: POPULARITY_DESC, \n            countryOfOrigin: "JP"\n          ) {\n            '.concat(MEDIA_CARD_FIELDS, "\n          }\n        }\n      }\n    ");
        const data = await queryAniList(query, {
            genre,
            page,
            perPage
        });
        return ((data === null || data === void 0 ? void 0 : (_data_Page = data.Page) === null || _data_Page === void 0 ? void 0 : _data_Page.media) || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 11b. ADVANCED MULTI-CRITERIA FILTER
   */ static async filter(params) {
        var _params_keyword, _data_Page;
        const page = Number(params.page) || 1;
        const perPage = Number(params.perPage) || 24;
        const variables = {
            page,
            perPage
        };
        if ((_params_keyword = params.keyword) === null || _params_keyword === void 0 ? void 0 : _params_keyword.trim()) {
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
        const query = '\n      query ($page: Int, $perPage: Int, $search: String, $genre_in: [String], $genre_not_in: [String], $format: MediaFormat, $status: MediaStatus, $season: MediaSeason, $seasonYear: Int, $sort: [MediaSort]) {\n        Page(page: $page, perPage: $perPage) {\n          media(\n            search: $search,\n            genre_in: $genre_in,\n            genre_not_in: $genre_not_in,\n            format: $format,\n            status: $status,\n            season: $season,\n            seasonYear: $seasonYear,\n            sort: $sort,\n            type: ANIME,\n            countryOfOrigin: "JP"\n          ) {\n            '.concat(MEDIA_CARD_FIELDS, "\n          }\n        }\n      }\n    ");
        const data = await queryAniList(query, variables);
        return ((data === null || data === void 0 ? void 0 : (_data_Page = data.Page) === null || _data_Page === void 0 ? void 0 : _data_Page.media) || []).map((m)=>mapMediaToCard(m));
    }
    /**
   * 12. ANIME INFO / DETAIL
   * Supports both numeric AniList IDs and string slugs/titles!
   */ static async getAnimeInfo(idOrSlug) {
        var _media_title, _media_title1, _media_title2, _media_title3, _media_title4, _media_coverImage, _media_coverImage1, _media_coverImage2, _media_nextAiringEpisode, _media_characters, _media_relations, _media_recommendations, _media_studios, _media_startDate;
        const isNumeric = /^\d+$/.test(idOrSlug.trim());
        const query = "\n      query (".concat(isNumeric ? '$id: Int' : '$search: String', ") {\n        Media(").concat(isNumeric ? 'id: $id' : 'search: $search', ", type: ANIME) {\n          id\n          idMal\n          title {\n            romaji\n            english\n            native\n          }\n          description(asHtml: false)\n          bannerImage\n          coverImage {\n            extraLarge\n            large\n            medium\n          }\n          format\n          status\n          episodes\n          duration\n          season\n          seasonYear\n          startDate {\n            year\n            month\n            day\n          }\n          genres\n          synonyms\n          averageScore\n          countryOfOrigin\n          isAdult\n          studios(isMain: true) {\n            nodes {\n              name\n            }\n          }\n          nextAiringEpisode {\n            airingAt\n            timeUntilAiring\n            episode\n          }\n          characters(sort: ROLE, perPage: 12) {\n            edges {\n              role\n              node {\n                id\n                name {\n                  full\n                }\n                image {\n                  medium\n                }\n              }\n              voiceActors(language: JAPANESE) {\n                id\n                name {\n                  full\n                }\n                image {\n                  medium\n                }\n                language\n              }\n            }\n          }\n          relations {\n            edges {\n              relationType\n              node {\n                id\n                idMal\n                title {\n                  english\n                  romaji\n                }\n                coverImage {\n                  medium\n                }\n                format\n                type\n              }\n            }\n          }\n          recommendations(perPage: 12, sort: RATING_DESC) {\n            nodes {\n              mediaRecommendation {\n                id\n                idMal\n                title {\n                  english\n                  romaji\n                }\n                coverImage {\n                  medium\n                }\n                averageScore\n                format\n              }\n            }\n          }\n          streamingEpisodes {\n            title\n            thumbnail\n            url\n            site\n          }\n        }\n      }\n    ");
        const variables = {};
        if (isNumeric) {
            variables.id = parseInt(idOrSlug.trim(), 10);
        } else {
            variables.search = idOrSlug.replace(/-/g, ' ');
        }
        const data = await queryAniList(query, variables);
        const media = data === null || data === void 0 ? void 0 : data.Media;
        if (!media) return null;
        const slug = String(media.id);
        const cleanTitle = ((_media_title = media.title) === null || _media_title === void 0 ? void 0 : _media_title.english) || ((_media_title1 = media.title) === null || _media_title1 === void 0 ? void 0 : _media_title1.romaji) || ((_media_title2 = media.title) === null || _media_title2 === void 0 ? void 0 : _media_title2.native) || 'Unknown Title';
        const cleanJname = ((_media_title3 = media.title) === null || _media_title3 === void 0 ? void 0 : _media_title3.native) || ((_media_title4 = media.title) === null || _media_title4 === void 0 ? void 0 : _media_title4.romaji) || '';
        const cleanPoster = ((_media_coverImage = media.coverImage) === null || _media_coverImage === void 0 ? void 0 : _media_coverImage.extraLarge) || ((_media_coverImage1 = media.coverImage) === null || _media_coverImage1 === void 0 ? void 0 : _media_coverImage1.large) || ((_media_coverImage2 = media.coverImage) === null || _media_coverImage2 === void 0 ? void 0 : _media_coverImage2.medium) || '';
        const cleanBanner = media.bannerImage || cleanPoster;
        const cleanDesc = cleanHtml(media.description);
        // Calculate released episode count
        let releasedCount = media.episodes || 0;
        if ((_media_nextAiringEpisode = media.nextAiringEpisode) === null || _media_nextAiringEpisode === void 0 ? void 0 : _media_nextAiringEpisode.episode) {
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
                var _sep_title, _sep_url;
                const match = ((_sep_title = sep.title) === null || _sep_title === void 0 ? void 0 : _sep_title.match(/Episode\s+(\d+)/i)) || ((_sep_url = sep.url) === null || _sep_url === void 0 ? void 0 : _sep_url.match(/episode-(\d+)/i));
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
                id: "".concat(slug, "::").concat(i),
                number: i,
                title: (streamEp === null || streamEp === void 0 ? void 0 : streamEp.title) || "Episode ".concat(i),
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
        if (Array.isArray((_media_characters = media.characters) === null || _media_characters === void 0 ? void 0 : _media_characters.edges)) {
            media.characters.edges.forEach((edge)=>{
                var _edge_voiceActors;
                const charNode = edge.node;
                const va = (_edge_voiceActors = edge.voiceActors) === null || _edge_voiceActors === void 0 ? void 0 : _edge_voiceActors[0];
                if (charNode) {
                    var _charNode_name, _charNode_image, _va_name, _va_image;
                    characters.push({
                        id: String(charNode.id),
                        name: ((_charNode_name = charNode.name) === null || _charNode_name === void 0 ? void 0 : _charNode_name.full) || 'Unknown',
                        poster: ((_charNode_image = charNode.image) === null || _charNode_image === void 0 ? void 0 : _charNode_image.medium) || '',
                        role: edge.role || 'MAIN',
                        voiceActor: va ? {
                            id: String(va.id),
                            name: ((_va_name = va.name) === null || _va_name === void 0 ? void 0 : _va_name.full) || '',
                            poster: ((_va_image = va.image) === null || _va_image === void 0 ? void 0 : _va_image.medium) || '',
                            language: va.language || 'Japanese'
                        } : undefined
                    });
                }
            });
        }
        // Normalize relations
        const related = [];
        if (Array.isArray((_media_relations = media.relations) === null || _media_relations === void 0 ? void 0 : _media_relations.edges)) {
            media.relations.edges.forEach((edge)=>{
                const rNode = edge.node;
                if (rNode && rNode.type === 'ANIME') {
                    var _rNode_title, _rNode_title1, _rNode_coverImage;
                    related.push({
                        id: String(rNode.id),
                        title: ((_rNode_title = rNode.title) === null || _rNode_title === void 0 ? void 0 : _rNode_title.english) || ((_rNode_title1 = rNode.title) === null || _rNode_title1 === void 0 ? void 0 : _rNode_title1.romaji) || 'Unknown',
                        poster: ((_rNode_coverImage = rNode.coverImage) === null || _rNode_coverImage === void 0 ? void 0 : _rNode_coverImage.medium) || '',
                        type: edge.relationType || rNode.format || 'ANIME'
                    });
                }
            });
        }
        // Normalize recommendations
        const recommendations = [];
        if (Array.isArray((_media_recommendations = media.recommendations) === null || _media_recommendations === void 0 ? void 0 : _media_recommendations.nodes)) {
            media.recommendations.nodes.forEach((n)=>{
                const recMedia = n.mediaRecommendation;
                if (recMedia) {
                    var _recMedia_title, _recMedia_title1, _recMedia_coverImage;
                    recommendations.push({
                        id: String(recMedia.id),
                        title: ((_recMedia_title = recMedia.title) === null || _recMedia_title === void 0 ? void 0 : _recMedia_title.english) || ((_recMedia_title1 = recMedia.title) === null || _recMedia_title1 === void 0 ? void 0 : _recMedia_title1.romaji) || 'Unknown',
                        poster: ((_recMedia_coverImage = recMedia.coverImage) === null || _recMedia_coverImage === void 0 ? void 0 : _recMedia_coverImage.medium) || '',
                        type: recMedia.format || 'TV',
                        rank: recMedia.averageScore
                    });
                }
            });
        }
        const studioNames = (((_media_studios = media.studios) === null || _media_studios === void 0 ? void 0 : _media_studios.nodes) || []).map((s)=>s.name).filter(Boolean);
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
                rating: media.averageScore ? "".concat((media.averageScore / 10).toFixed(1), "/10") : 'PG-13',
                quality: 'HD',
                duration: media.duration ? "".concat(media.duration, "m") : '24m',
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
                aired: ((_media_startDate = media.startDate) === null || _media_startDate === void 0 ? void 0 : _media_startDate.year) ? "".concat(media.startDate.year) : '?',
                premiered: media.season && media.seasonYear ? "".concat(media.season, " ").concat(media.seasonYear) : '?',
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
        return (info === null || info === void 0 ? void 0 : info.episodes) || [];
    }
    /**
   * 14. AIRING SCHEDULE
   */ static async getSchedule(date) {
        let tzOffsetHours = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
        try {
            var _data_Page;
            const targetDate = new Date(date);
            const parsedTime = isNaN(targetDate.getTime()) ? new Date() : targetDate;
            const startOfDay = Math.floor(new Date(parsedTime.getFullYear(), parsedTime.getMonth(), parsedTime.getDate(), 0, 0, 0).getTime() / 1000) - tzOffsetHours * 3600;
            const endOfDay = startOfDay + 86400;
            const query = "\n        query ($airingAt_greater: Int, $airingAt_lesser: Int) {\n          Page(page: 1, perPage: 50) {\n            airingSchedules(\n              airingAt_greater: $airingAt_greater,\n              airingAt_lesser: $airingAt_lesser,\n              sort: TIME\n            ) {\n              id\n              airingAt\n              timeUntilAiring\n              episode\n              media {\n                id\n                title {\n                  english\n                  romaji\n                  native\n                }\n                countryOfOrigin\n              }\n            }\n          }\n        }\n      ";
            const data = await queryAniList(query, {
                airingAt_greater: startOfDay,
                airingAt_lesser: endOfDay
            });
            const schedules = ((data === null || data === void 0 ? void 0 : (_data_Page = data.Page) === null || _data_Page === void 0 ? void 0 : _data_Page.airingSchedules) || []).filter((item)=>item.media && (!item.media.countryOfOrigin || item.media.countryOfOrigin === 'JP'));
            return {
                scheduledAnimes: schedules.map((item)=>{
                    var _item_media_title, _item_media_title1, _item_media_title2, _item_media_title3;
                    const airDate = new Date(item.airingAt * 1000);
                    const timeStr = airDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                    return {
                        id: String(item.media.id),
                        time: timeStr,
                        name: ((_item_media_title = item.media.title) === null || _item_media_title === void 0 ? void 0 : _item_media_title.english) || ((_item_media_title1 = item.media.title) === null || _item_media_title1 === void 0 ? void 0 : _item_media_title1.romaji) || 'Unknown Title',
                        jname: ((_item_media_title2 = item.media.title) === null || _item_media_title2 === void 0 ? void 0 : _item_media_title2.romaji) || ((_item_media_title3 = item.media.title) === null || _item_media_title3 === void 0 ? void 0 : _item_media_title3.native) || '',
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
        var _info_stats, _info_stats1, _info_stats2, _info_stats3, _info_info, _info_info_studios, _info_info1;
        const info = await this.getAnimeInfo(id);
        if (!info) return null;
        return {
            id: info.id,
            title: info.title,
            jname: info.jname,
            poster: info.poster,
            description: info.description,
            rating: (_info_stats = info.stats) === null || _info_stats === void 0 ? void 0 : _info_stats.rating,
            quality: (_info_stats1 = info.stats) === null || _info_stats1 === void 0 ? void 0 : _info_stats1.quality,
            duration: (_info_stats2 = info.stats) === null || _info_stats2 === void 0 ? void 0 : _info_stats2.duration,
            type: (_info_stats3 = info.stats) === null || _info_stats3 === void 0 ? void 0 : _info_stats3.type,
            genres: (_info_info = info.info) === null || _info_info === void 0 ? void 0 : _info_info.genres,
            studios: (_info_info1 = info.info) === null || _info_info1 === void 0 ? void 0 : (_info_info_studios = _info_info1.studios) === null || _info_info_studios === void 0 ? void 0 : _info_info_studios.join(', '),
            isAdult: info.isAdult
        };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$extractors$2f$streamExtractor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/extractors/streamExtractor.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/anilist.ts [app-client] (ecmascript)");
;
;
;
;
class ApiManager {
    static getBaseUrl() {
        if ("TURBOPACK compile-time truthy", 1) {
            const savedIndex = localStorage.getItem('shadow_api_index');
            if (savedIndex !== null) {
                const idx = parseInt(savedIndex, 10);
                if (!isNaN(idx) && idx < this.urls.length) {
                    this.currentIndex = idx;
                }
            }
        }
        return this.urls[this.currentIndex];
    }
    static rotateUrl() {
        this.currentIndex = (this.currentIndex + 1) % this.urls.length;
        if ("TURBOPACK compile-time truthy", 1) {
            localStorage.setItem('shadow_api_index', this.currentIndex.toString());
        }
        console.warn("[ApiManager] Rotated API URL to: ".concat(this.urls[this.currentIndex]));
        return this.urls[this.currentIndex];
    }
    static getAllUrls() {
        return this.urls;
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(ApiManager, "urls", [
    'https://omni-api-v1.vercel.app/api',
    'https://omni-api-v2.vercel.app/api'
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(ApiManager, "currentIndex", 0);
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
 */ async function fetchAnikoto(endpoint) {
    let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, retryCount = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
    const queryParts = [];
    for (const [key, value] of Object.entries(params)){
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
            for (const v of value){
                if (v === undefined || v === null || v === '') continue;
                queryParts.push("".concat(encodeURIComponent(key), "[]=").concat(encodeURIComponent(String(v))));
            }
        } else {
            queryParts.push("".concat(encodeURIComponent(key), "=").concat(encodeURIComponent(String(value))));
        }
    }
    const queryString = queryParts.length > 0 ? "?".concat(queryParts.join('&')) : '';
    const targetUrl = "".concat(ApiManager.getBaseUrl()).concat(endpoint).concat(queryString);
    const proxyUrl = ("TURBOPACK compile-time truthy", 1) ? "/api/proxy?url=".concat(encodeURIComponent(targetUrl)) : "TURBOPACK unreachable";
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
                    var _json_data;
                    return json.ok ? (_json_data = json.data) !== null && _json_data !== void 0 ? _json_data : json : null;
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
    } catch (e) {
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
 */ async function fetchAnikotoSSE(endpoint) {
    let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, retryCount = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
    const queryParts = [];
    for (const [key, value] of Object.entries(params)){
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
            for (const v of value){
                if (v === undefined || v === null || v === '') continue;
                queryParts.push("".concat(encodeURIComponent(key), "[]=").concat(encodeURIComponent(String(v))));
            }
        } else {
            queryParts.push("".concat(encodeURIComponent(key), "=").concat(encodeURIComponent(String(value))));
        }
    }
    const queryString = queryParts.length > 0 ? "?".concat(queryParts.join('&')) : '';
    const targetUrl = "".concat(ApiManager.getBaseUrl()).concat(endpoint).concat(queryString);
    const proxyUrl = ("TURBOPACK compile-time truthy", 1) ? "/api/proxy?url=".concat(encodeURIComponent(targetUrl)) : "TURBOPACK unreachable";
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
                        var _json_data;
                        const inner = json.ok ? (_json_data = json.data) !== null && _json_data !== void 0 ? _json_data : json : null;
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
            } catch (e) {
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
                } catch (e) {
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
    } catch (e) {
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
    var _data_currentPage, _ref;
    const currentPage = (_ref = (_data_currentPage = data.currentPage) !== null && _data_currentPage !== void 0 ? _data_currentPage : data.page) !== null && _ref !== void 0 ? _ref : 1;
    var _data_hasNextPage;
    const hasNextPage = (_data_hasNextPage = data.hasNextPage) !== null && _data_hasNextPage !== void 0 ? _data_hasNextPage : data.maxPage ? currentPage < data.maxPage : results.length >= 18;
    var _data_hasPreviousPage;
    const hasPreviousPage = (_data_hasPreviousPage = data.hasPreviousPage) !== null && _data_hasPreviousPage !== void 0 ? _data_hasPreviousPage : currentPage > 1;
    var _data_minPage, _data_maxPage;
    return {
        results,
        topRated: data.topRated,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        minPage: (_data_minPage = data.minPage) !== null && _data_minPage !== void 0 ? _data_minPage : 1,
        maxPage: (_data_maxPage = data.maxPage) !== null && _data_maxPage !== void 0 ? _data_maxPage : hasNextPage ? currentPage + 1 : currentPage
    };
}
class AnimeAPI_Anikoto {
    static async getHome() {
        return fetchAnikoto('/home');
    }
    static async search(keyword) {
        let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
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
        return fetchAnikoto("/anime/".concat(encodeURIComponent(slug)), {
            start,
            end
        });
    }
    static async getEpisodes(slug, start, end) {
        return fetchAnikoto("/anime/".concat(encodeURIComponent(slug), "/episodes"), {
            start,
            end
        });
    }
    static async getRelated(slug) {
        return fetchAnikoto("/anime/".concat(encodeURIComponent(slug), "/related"));
    }
    static async getRecommendations(slug) {
        return fetchAnikoto("/anime/".concat(encodeURIComponent(slug), "/recommendations"));
    }
    static async getTooltip(id) {
        return fetchAnikoto("/anime/tooltip/".concat(encodeURIComponent(id)));
    }
    static async getHomeLatest() {
        let type = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 'updated-all', page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
        return fetchAnikoto('/home/latest', {
            type,
            page
        });
    }
    static async getLatestUpdated() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        var _res_results;
        const res = await fetchAnikoto('/latest-updated', {
            page
        });
        if (res && (Array.isArray(res) ? res.length > 0 : ((_res_results = res.results) === null || _res_results === void 0 ? void 0 : _res_results.length) > 0)) return res;
        return fetchAnikoto('/latest', {
            type: 'latest-updated',
            page
        });
    }
    static async getNewRelease() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        var _res_results;
        const res = await fetchAnikoto('/new-release', {
            page
        });
        if (res && (Array.isArray(res) ? res.length > 0 : ((_res_results = res.results) === null || _res_results === void 0 ? void 0 : _res_results.length) > 0)) return res;
        return fetchAnikoto('/latest', {
            type: 'new-release',
            page
        });
    }
    static async getMostViewed() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        var _res_results;
        const res = await fetchAnikoto('/most-viewed', {
            page
        });
        if (res && (Array.isArray(res) ? res.length > 0 : ((_res_results = res.results) === null || _res_results === void 0 ? void 0 : _res_results.length) > 0)) return res;
        return fetchAnikoto('/latest', {
            type: 'most-viewed',
            page
        });
    }
    static async getLatest() {
        let type = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 'latest-updated', page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
        return fetchAnikoto('/latest', {
            type,
            page
        });
    }
    static async getStatus() {
        let type = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 'currently-airing', page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
        return fetchAnikoto('/status', {
            type,
            page
        });
    }
    static async getAZList() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1, letter = arguments.length > 1 ? arguments[1] : void 0;
        return fetchAnikoto('/az-list', {
            page,
            letter
        });
    }
    static async getGenre(genre) {
        let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
        return fetchAnikoto("/genre/".concat(encodeURIComponent(genre)), {
            page
        });
    }
    static async getType(type) {
        let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
        return fetchAnikoto("/type/".concat(encodeURIComponent(type)), {
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
        return fetchAnikotoSSE("/watch/".concat(encodeURIComponent(slug)), {
            ep
        });
    }
}
// ==========================================
//  5. RAW -> UNIVERSAL NORMALIZERS
// ==========================================
function normalizeCard(item) {
    var _item_episodes, _item_episodes1, _item_episodes2, _item_episodes3;
    const rawRating = (item === null || item === void 0 ? void 0 : item.rating) || (item === null || item === void 0 ? void 0 : item.rated) || (item === null || item === void 0 ? void 0 : item.ageRating) || (item === null || item === void 0 ? void 0 : item.rating_name) || '';
    const isAdult = (item === null || item === void 0 ? void 0 : item.isAdult) === true || (item === null || item === void 0 ? void 0 : item.adult) === true || [
        "Rx",
        "RX",
        "Hentai",
        "18+",
        "R+"
    ].some((t)=>String(rawRating).toUpperCase().includes(t));
    var _item_episodes_sub, _ref, _item_episodes_dub, _ref1, _item_episodes_total;
    return {
        id: (item === null || item === void 0 ? void 0 : item.slug) || (item === null || item === void 0 ? void 0 : item.id) || '',
        title: (item === null || item === void 0 ? void 0 : item.title) || 'Unknown Title',
        jname: (item === null || item === void 0 ? void 0 : item.titleJp) || '',
        poster: (item === null || item === void 0 ? void 0 : item.image) || '',
        type: (item === null || item === void 0 ? void 0 : item.type) || 'TV',
        duration: item === null || item === void 0 ? void 0 : item.date,
        episodes: {
            sub: (_ref = (_item_episodes_sub = item === null || item === void 0 ? void 0 : (_item_episodes = item.episodes) === null || _item_episodes === void 0 ? void 0 : _item_episodes.sub) !== null && _item_episodes_sub !== void 0 ? _item_episodes_sub : item === null || item === void 0 ? void 0 : item.sub) !== null && _ref !== void 0 ? _ref : 0,
            dub: (_ref1 = (_item_episodes_dub = item === null || item === void 0 ? void 0 : (_item_episodes1 = item.episodes) === null || _item_episodes1 === void 0 ? void 0 : _item_episodes1.dub) !== null && _item_episodes_dub !== void 0 ? _item_episodes_dub : item === null || item === void 0 ? void 0 : item.dub) !== null && _ref1 !== void 0 ? _ref1 : 0,
            eps: (_item_episodes_total = item === null || item === void 0 ? void 0 : (_item_episodes2 = item.episodes) === null || _item_episodes2 === void 0 ? void 0 : _item_episodes2.total) !== null && _item_episodes_total !== void 0 ? _item_episodes_total : item === null || item === void 0 ? void 0 : (_item_episodes3 = item.episodes) === null || _item_episodes3 === void 0 ? void 0 : _item_episodes3.eps
        },
        rank: item === null || item === void 0 ? void 0 : item.rank,
        isAdult,
        rating: rawRating
    };
}
class AnimeService {
    static normalizeEpisodeList(list, slug) {
        return Array.isArray(list) ? list.map((e)=>({
                id: "".concat(slug, "::").concat(e.number),
                number: parseInt(e.number, 10) || 0,
                title: e.title || "Episode ".concat(e.number),
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
        var _data_episodes, _rawEps_, _data_type, _data_country, _data_countryOfOrigin, _data_type1, _data_type2, _data_country1, _data_countryOfOrigin1, _data_episodes1;
        const slug = (data === null || data === void 0 ? void 0 : data.slug) || (data === null || data === void 0 ? void 0 : data.id) || '';
        const rawRating = (data === null || data === void 0 ? void 0 : data.rating) || (data === null || data === void 0 ? void 0 : data.rated) || (data === null || data === void 0 ? void 0 : data.ageRating) || '';
        const isAdult = (data === null || data === void 0 ? void 0 : data.isAdult) === true || (data === null || data === void 0 ? void 0 : data.adult) === true || [
            "Rx",
            "RX",
            "Hentai",
            "18+",
            "R+",
            "18"
        ].some((t)=>String(rawRating).toUpperCase().includes(t)) || Array.isArray(data === null || data === void 0 ? void 0 : data.genres) && data.genres.some((g)=>[
                "hentai",
                "ecchi",
                "erotica"
            ].includes(String(g).toLowerCase()));
        const rawEps = (data === null || data === void 0 ? void 0 : (_data_episodes = data.episodes) === null || _data_episodes === void 0 ? void 0 : _data_episodes.episodes) || (data === null || data === void 0 ? void 0 : data.episodes) || [];
        const detectedMalId = ((_rawEps_ = rawEps[0]) === null || _rawEps_ === void 0 ? void 0 : _rawEps_.dataMal) ? parseInt(rawEps[0].dataMal, 10) : (data === null || data === void 0 ? void 0 : data.malId) || (data === null || data === void 0 ? void 0 : data.idMal) || (data === null || data === void 0 ? void 0 : data.mal_id);
        const genresList = normalizeList(data === null || data === void 0 ? void 0 : data.genres);
        const studiosList = normalizeList(data === null || data === void 0 ? void 0 : data.studios);
        const altTitles = Array.isArray(data === null || data === void 0 ? void 0 : data.alternativeTitles) ? data.alternativeTitles : [];
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
        const isJapaneseAnimeTitle = /(?:solo leveling|ore dake level up|tower of god|god of high school|noblesse)\b/i.test((data === null || data === void 0 ? void 0 : data.title) || '') || altTitles.some((t)=>/(?:solo leveling|ore dake level up|tower of god|god of high school|noblesse)\b/i.test(t));
        const hasChineseChars = altTitles.some((t)=>/[\u4e00-\u9fa5]/.test(t)) || /[\u4e00-\u9fa5]/.test((data === null || data === void 0 ? void 0 : data.synopsis) || '');
        const hasKoreanChars = altTitles.some((t)=>/[\uac00-\ud7af]/.test(t)) || /[\uac00-\ud7af]/.test((data === null || data === void 0 ? void 0 : data.synopsis) || '') || /[\uac00-\ud7af]/.test((data === null || data === void 0 ? void 0 : data.titleJp) || '');
        const hasJapaneseKana = /[\u3040-\u30ff]/.test((data === null || data === void 0 ? void 0 : data.titleJp) || '') || /[\u3040-\u30ff]/.test((data === null || data === void 0 ? void 0 : data.title) || '');
        const isDonghua = (data === null || data === void 0 ? void 0 : (_data_type = data.type) === null || _data_type === void 0 ? void 0 : _data_type.toLowerCase()) === 'donghua' || genresList.some((g)=>g.toLowerCase().includes('donghua') || g.toLowerCase().includes('chinese')) || hasChineseStudio || hasChineseChars && !hasJapaneseKana || !hasJapaneseKana && altTitles.concat([
            (data === null || data === void 0 ? void 0 : data.title) || '',
            (data === null || data === void 0 ? void 0 : data.titleJp) || '',
            (data === null || data === void 0 ? void 0 : data.synopsis) || ''
        ]).some((t)=>/(?:\b(?:douluo|dalu|xianxia|wuxia|cultivation|donghua|shiguang|dailiren|shenghuo|chuan|zhuan|xian|qian kun|wan jie|soul land|combat continent|immortal king)\b)/i.test(t));
        const isKorean = !hasJapaneseStudio && !isJapaneseAnimeTitle && ((data === null || data === void 0 ? void 0 : (_data_country = data.country) === null || _data_country === void 0 ? void 0 : _data_country.toUpperCase()) === 'KR' || (data === null || data === void 0 ? void 0 : (_data_countryOfOrigin = data.countryOfOrigin) === null || _data_countryOfOrigin === void 0 ? void 0 : _data_countryOfOrigin.toUpperCase()) === 'KR' || (data === null || data === void 0 ? void 0 : (_data_type1 = data.type) === null || _data_type1 === void 0 ? void 0 : _data_type1.toLowerCase()) === 'korean' || (data === null || data === void 0 ? void 0 : (_data_type2 = data.type) === null || _data_type2 === void 0 ? void 0 : _data_type2.toLowerCase()) === 'aori' || genresList.some((g)=>g.toLowerCase() === 'korean') || hasKoreanStudio || !hasJapaneseKana && /(?:lookism)\b/i.test((data === null || data === void 0 ? void 0 : data.title) || ''));
        const isChinese = (data === null || data === void 0 ? void 0 : (_data_country1 = data.country) === null || _data_country1 === void 0 ? void 0 : _data_country1.toUpperCase()) === 'CN' || (data === null || data === void 0 ? void 0 : (_data_countryOfOrigin1 = data.countryOfOrigin) === null || _data_countryOfOrigin1 === void 0 ? void 0 : _data_countryOfOrigin1.toUpperCase()) === 'CN' || isDonghua;
        const country = hasJapaneseStudio || isJapaneseAnimeTitle ? 'JP' : isKorean ? 'KR' : isChinese ? 'CN' : (data === null || data === void 0 ? void 0 : data.country) || (data === null || data === void 0 ? void 0 : data.countryOfOrigin) || 'JP';
        return {
            id: slug,
            title: (data === null || data === void 0 ? void 0 : data.title) || 'Unknown Title',
            jname: (data === null || data === void 0 ? void 0 : data.titleJp) || '',
            poster: (data === null || data === void 0 ? void 0 : data.image) || '',
            description: (data === null || data === void 0 ? void 0 : data.synopsis) || '',
            isAdult: isAdult,
            malId: detectedMalId,
            countryOfOrigin: country,
            stats: {
                rating: (data === null || data === void 0 ? void 0 : data.rating) || '?',
                quality: (data === null || data === void 0 ? void 0 : data.quality) || 'HD',
                duration: (data === null || data === void 0 ? void 0 : data.duration) || '?',
                type: (data === null || data === void 0 ? void 0 : data.type) || 'TV',
                malScore: (data === null || data === void 0 ? void 0 : data.malScore) != null ? String(data.malScore) : '?',
                episodes: {
                    sub: (data === null || data === void 0 ? void 0 : data.hasSub) ? 1 : 0,
                    dub: (data === null || data === void 0 ? void 0 : data.hasDub) ? 1 : 0
                }
            },
            info: {
                status: (data === null || data === void 0 ? void 0 : data.status) || 'Unknown',
                genres: genresList,
                studios: normalizeList(data === null || data === void 0 ? void 0 : data.studios),
                producers: normalizeList(data === null || data === void 0 ? void 0 : data.producers),
                aired: (data === null || data === void 0 ? void 0 : data.aired) || '?',
                premiered: (data === null || data === void 0 ? void 0 : data.premiered) || '?',
                japanese: (data === null || data === void 0 ? void 0 : data.titleJp) || '',
                synonyms: Array.isArray(data === null || data === void 0 ? void 0 : data.alternativeTitles) ? data.alternativeTitles.join(', ') : ''
            },
            episodes: (data === null || data === void 0 ? void 0 : (_data_episodes1 = data.episodes) === null || _data_episodes1 === void 0 ? void 0 : _data_episodes1.episodes) ? this.normalizeEpisodeList(data.episodes.episodes, slug) : [],
            characters: [],
            recommendations: [],
            related: [],
            seasons: [],
            trailers: []
        };
    }
    static async getUniversalRecent() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getHomeSections() {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getHomeSections();
    }
    static async getTopTen() {
        const [today, week, month] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getTopAiring(1, 10).catch(()=>[]),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(1, 10).catch(()=>[]),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getMostFavorite(1, 10).catch(()=>[])
        ]);
        return {
            today,
            week,
            month
        };
    }
    static async getTopSearch() {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(1, 10);
    }
    static async getRandomAnime() {
        const popular = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(Math.floor(Math.random() * 3) + 1, 24);
        if (popular && popular.length > 0) {
            return popular[Math.floor(Math.random() * popular.length)];
        }
        return null;
    }
    static async getTopUpcoming() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getTopUpcoming(page, 24);
    }
    static async getRecentlyUpdated() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getRecentlyAdded() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getCompleted() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getCompleted(page, 24);
    }
    static async getMostFavorite() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getMostFavorite(page, 24);
    }
    static async getMostPopular() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
    }
    static async getTopAiring() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getTopAiring(page, 24);
    }
    static async getSubbedAnime() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getDubbedAnime() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getFilteredAnime(category) {
        let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
        let results = [];
        switch(category){
            case 'sub':
            case 'dub':
            case 'latest-updated':
            case 'recent':
            case 'updated-all':
            case 'all':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
                break;
            case 'new-release':
            case 'added':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
                break;
            case 'most-viewed':
            case 'popular':
            case 'trending':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
                break;
            case 'upcoming':
            case 'not-yet-aired':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getTopUpcoming(page, 24);
                break;
            case 'ongoing':
            case 'currently-airing':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getTopAiring(page, 24);
                break;
            case 'completed':
            case 'finished-airing':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getCompleted(page, 24);
                break;
            case 'az-list':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
                break;
            default:
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
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
    static async getByGenre(genre) {
        let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getByGenre(genre, page, 24);
    }
    static async getByType(_type) {
        let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
    }
    static async search(query) {
        let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].search(query, page, 24);
    }
    static async getSearchSuggestions(query) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getSearchSuggestions(query);
    }
    static async filter(params) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].filter(params);
    }
    static async getAnimeInfo(slugOrId) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getAnimeInfo(slugOrId);
    }
    static async getEpisodes(slugOrId) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getEpisodes(slugOrId);
    }
    static async getCharacters(slugOrId) {
        const info = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getAnimeInfo(slugOrId);
        return (info === null || info === void 0 ? void 0 : info.characters) || [];
    }
    static async getSchedule(date) {
        let tzOffsetHours = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getSchedule(date, tzOffsetHours);
    }
    static async getTooltip(id) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AniListService"].getTooltip(id);
    }
    static async getStream(episodeId) {
        let server = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'MegaCloud', category = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 'sub', options = arguments.length > 3 ? arguments[3] : void 0;
        var _options_countryOfOrigin;
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
        const countryUpper = (options === null || options === void 0 ? void 0 : (_options_countryOfOrigin = options.countryOfOrigin) === null || _options_countryOfOrigin === void 0 ? void 0 : _options_countryOfOrigin.toUpperCase()) || 'JP';
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
            if ("TURBOPACK compile-time truthy", 1) {
                var _options_excludeServers;
                const params = new URLSearchParams({
                    malId: (options === null || options === void 0 ? void 0 : options.malId) ? String(options.malId) : '',
                    title: (options === null || options === void 0 ? void 0 : options.title) || slug,
                    ep: String(epNumber),
                    country: (options === null || options === void 0 ? void 0 : options.countryOfOrigin) || 'JP',
                    audio: effectiveAudio,
                    server: server,
                    exclude: (options === null || options === void 0 ? void 0 : (_options_excludeServers = options.excludeServers) === null || _options_excludeServers === void 0 ? void 0 : _options_excludeServers.join(',')) || ''
                });
                const res = await fetch("/api/anime/stream?".concat(params.toString()));
                if (res.ok) {
                    const json = await res.json();
                    if (json.ok && json.data) {
                        unified = json.data;
                    }
                }
            } else //TURBOPACK unreachable
            ;
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
                const excluded = ((options === null || options === void 0 ? void 0 : options.excludeServers) || []).map((s)=>s.toLowerCase());
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
            const bucket = (s === null || s === void 0 ? void 0 : s.type) === 'dub' ? 'dub' : (s === null || s === void 0 ? void 0 : s.type) === 'raw' ? 'raw' : 'sub';
            var _s_id;
            grouped[bucket].push({
                serverId: (_s_id = s === null || s === void 0 ? void 0 : s.id) !== null && _s_id !== void 0 ? _s_id : s === null || s === void 0 ? void 0 : s.svId,
                serverName: s === null || s === void 0 ? void 0 : s.name
            });
        }
        grouped[primarySubKey] = grouped.sub;
        grouped['en'] = grouped.dub;
        // Extract Stream Sources
        const sources = data.filter((item)=>item.type === 'source' && item.source).map((item)=>item.source);
        const targetCat = category === 'en' || category === 'dub' ? 'dub' : 'sub';
        const byCategory = sources.filter((s)=>(s === null || s === void 0 ? void 0 : s.type) === targetCat);
        if (!byCategory.length) return {
            servers: grouped,
            url: null
        };
        const matched = byCategory.find((s)=>{
            var _s_server;
            return (s === null || s === void 0 ? void 0 : (_s_server = s.server) === null || _s_server === void 0 ? void 0 : _s_server.toLowerCase()) === server.toLowerCase() && (s.proxyUrl || s.m3u8 || s.url);
        }) || byCategory.find((s)=>s.proxyUrl || s.m3u8 || s.url) || byCategory[0];
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
            intro: (skip === null || skip === void 0 ? void 0 : skip.intro) || null,
            outro: (skip === null || skip === void 0 ? void 0 : skip.outro) || null,
            skipData: skip
        };
    }
    /** @deprecated Now handled dynamically inside getStream to avoid double network requests */ static async getEpisodeServers(episodeId) {
        return null;
    }
}
class WatchlistAPI {
    static async getUserWatchlist(userId) {
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"] && userId !== 'guest') {
            const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('watchlist').select('*').eq('user_id', userId);
            return data || [];
        }
        const local = ("TURBOPACK compile-time truthy", 1) ? localStorage.getItem("watchlist_".concat(userId)) : "TURBOPACK unreachable";
        return local ? JSON.parse(local) : [];
    }
    static async addToWatchlist(userId, animeId, status) {
        let progress = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0, episodeId = arguments.length > 4 ? arguments[4] : void 0, totalEpisodes = arguments.length > 5 ? arguments[5] : void 0, type = arguments.length > 6 ? arguments[6] : void 0;
        const item = {
            anime_id: animeId,
            status,
            total_episodes: Number(totalEpisodes) || 1,
            media_type: type || "anime",
            updated_at: new Date().toISOString()
        };
        if (episodeId) item.last_episode_id = episodeId;
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"] && userId !== 'guest') {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('watchlist').upsert({
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
        if ("TURBOPACK compile-time truthy", 1) localStorage.setItem("watchlist_".concat(userId), JSON.stringify(updated));
        return true;
    }
}
class UserAPI {
    static async getCurrentUser() {
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"]) {
            const { data: { session } } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
            if (session === null || session === void 0 ? void 0 : session.user) {
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
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"] ? await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithPassword({
            email,
            password
        }) : {
            data: null,
            error: null
        };
    }
    static async signUp(email, password, username, avatarUrl, gender) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"] ? await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signUp({
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
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"]) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
            if ("TURBOPACK compile-time truthy", 1) {
                localStorage.removeItem('shadow_garden_auth');
                sessionStorage.clear();
            }
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
            const response = await fetch("https://api.imgbb.com/1/upload?key=".concat(API_KEY), {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error("Upload failed: ".concat(response.status));
            const data = await response.json();
            if (!data.success) throw new Error('Image upload failed');
            return data.data.url;
        } catch (error) {
            console.error('Image upload error:', error);
            throw error;
        }
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/hpi.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
/**
 * ==========================================
 * NEW HINDI API CLIENT
 * ==========================================
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
;
const getHindiApiBase = ()=>"".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiManager"].getBaseUrl(), "/blakite");
async function fetchHindiApi(endpoint) {
    let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, retryCount = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
    const queryParts = Object.entries(params).filter((param)=>{
        let [, v] = param;
        return v !== undefined && v !== null && v !== '';
    }).map((param)=>{
        let [k, v] = param;
        return "".concat(encodeURIComponent(k), "=").concat(encodeURIComponent(String(v)));
    });
    const queryString = queryParts.length > 0 ? "?".concat(queryParts.join('&')) : '';
    const targetUrl = "".concat(getHindiApiBase()).concat(endpoint).concat(queryString);
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
                return fetchHindiApi(endpoint, params, retryCount + 1);
            }
            return null;
        }
        const json = await response.json();
        // The proxy wraps the upstream response — unwrap it
        if (json && typeof json === 'object') {
            var _json_data;
            if ('ok' in json) return json.ok ? (_json_data = json.data) !== null && _json_data !== void 0 ? _json_data : json : null;
            if ('data' in json) return json.data;
        }
        return json;
    } catch (innerError) {
        if ((innerError === null || innerError === void 0 ? void 0 : innerError.name) === 'AbortError' || (innerError === null || innerError === void 0 ? void 0 : innerError.message) && innerError.message.includes('fetch')) {
            if (retryCount < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiManager"].getAllUrls().length - 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiManager"].rotateUrl();
                return fetchHindiApi(endpoint, params, retryCount + 1);
            }
        }
        return null;
    }
}
function normalizeHindiCard(item) {
    // The API returns episodes as {sub, dub, total} object, not a number
    const epObj = item === null || item === void 0 ? void 0 : item.episodes;
    var _epObj_total, _ref, _ref1;
    const epCount = (_ref1 = (_ref = (_epObj_total = epObj === null || epObj === void 0 ? void 0 : epObj.total) !== null && _epObj_total !== void 0 ? _epObj_total : epObj === null || epObj === void 0 ? void 0 : epObj.dub) !== null && _ref !== void 0 ? _ref : epObj === null || epObj === void 0 ? void 0 : epObj.sub) !== null && _ref1 !== void 0 ? _ref1 : undefined;
    return {
        id: (item === null || item === void 0 ? void 0 : item.id) || (item === null || item === void 0 ? void 0 : item.slug) || '',
        title: (item === null || item === void 0 ? void 0 : item.title) || (item === null || item === void 0 ? void 0 : item.name) || (item === null || item === void 0 ? void 0 : item.titleJp) || 'Unknown Title',
        image: (item === null || item === void 0 ? void 0 : item.image) || (item === null || item === void 0 ? void 0 : item.poster) || '',
        type: (item === null || item === void 0 ? void 0 : item.type) || 'TV',
        episode: epCount !== undefined ? String(epCount) : undefined,
        episodeCount: epCount !== undefined ? String(epCount) : undefined,
        slug: (item === null || item === void 0 ? void 0 : item.slug) || (item === null || item === void 0 ? void 0 : item.id) || '',
        dataId: (item === null || item === void 0 ? void 0 : item.id) || (item === null || item === void 0 ? void 0 : item.slug) || ''
    };
}
class HPIClient {
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "hindi", {
            getHome: async ()=>{
                var _results_spotlight, _results_recentlyUpdated, _results_ongoingAnime, _results_moviesCollection, _results_dramaLiveAction, _results_completedSeries, _results_hindiDubbedOrg, _results_hindiFanDubbed;
                const results = await fetchHindiApi('/home');
                const sections = [];
                const filterAnime = (items)=>items.filter((i)=>i.type !== 'Drama' && i.type !== 'Live Action');
                if ((results === null || results === void 0 ? void 0 : (_results_spotlight = results.spotlight) === null || _results_spotlight === void 0 ? void 0 : _results_spotlight.length) > 0) {
                    sections.push({
                        title: 'Spotlight',
                        items: filterAnime(results.spotlight).map(normalizeHindiCard)
                    });
                }
                if ((results === null || results === void 0 ? void 0 : (_results_recentlyUpdated = results.recentlyUpdated) === null || _results_recentlyUpdated === void 0 ? void 0 : _results_recentlyUpdated.length) > 0) {
                    sections.push({
                        title: 'Recently Updated',
                        items: filterAnime(results.recentlyUpdated).map(normalizeHindiCard)
                    });
                }
                if ((results === null || results === void 0 ? void 0 : (_results_ongoingAnime = results.ongoingAnime) === null || _results_ongoingAnime === void 0 ? void 0 : _results_ongoingAnime.length) > 0) {
                    sections.push({
                        title: 'Ongoing Anime',
                        items: filterAnime(results.ongoingAnime).map(normalizeHindiCard)
                    });
                }
                if ((results === null || results === void 0 ? void 0 : (_results_moviesCollection = results.moviesCollection) === null || _results_moviesCollection === void 0 ? void 0 : _results_moviesCollection.length) > 0) {
                    // Movies collection might include dramas/live action in some logic, but let's just map it.
                    // We will remove filterAnime for Movies & Drama to allow them to show
                    sections.push({
                        title: 'Movies Collection',
                        items: (results.moviesCollection || []).map(normalizeHindiCard)
                    });
                }
                if ((results === null || results === void 0 ? void 0 : (_results_dramaLiveAction = results.dramaLiveAction) === null || _results_dramaLiveAction === void 0 ? void 0 : _results_dramaLiveAction.length) > 0) {
                    sections.push({
                        title: 'Drama & Live Action',
                        items: (results.dramaLiveAction || []).map(normalizeHindiCard)
                    });
                }
                if ((results === null || results === void 0 ? void 0 : (_results_completedSeries = results.completedSeries) === null || _results_completedSeries === void 0 ? void 0 : _results_completedSeries.length) > 0) {
                    sections.push({
                        title: 'Completed Series',
                        items: filterAnime(results.completedSeries).map(normalizeHindiCard)
                    });
                }
                if ((results === null || results === void 0 ? void 0 : (_results_hindiDubbedOrg = results.hindiDubbedOrg) === null || _results_hindiDubbedOrg === void 0 ? void 0 : _results_hindiDubbedOrg.length) > 0) {
                    sections.push({
                        title: 'Hindi Dubbed (Org)',
                        items: filterAnime(results.hindiDubbedOrg).map(normalizeHindiCard)
                    });
                }
                if ((results === null || results === void 0 ? void 0 : (_results_hindiFanDubbed = results.hindiFanDubbed) === null || _results_hindiFanDubbed === void 0 ? void 0 : _results_hindiFanDubbed.length) > 0) {
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
            search: async function(query) {
                let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
                const resultsObj = await fetchHindiApi('/search', {
                    q: query,
                    page
                });
                const list = Array.isArray(resultsObj === null || resultsObj === void 0 ? void 0 : resultsObj.results) ? resultsObj.results : [];
                const items = list.map(normalizeHindiCard);
                var _resultsObj_currentPage, _resultsObj_hasNextPage, _resultsObj_maxPage, _resultsObj_totalResults;
                return {
                    title: query,
                    items,
                    pagination: {
                        currentPage: (_resultsObj_currentPage = resultsObj === null || resultsObj === void 0 ? void 0 : resultsObj.currentPage) !== null && _resultsObj_currentPage !== void 0 ? _resultsObj_currentPage : page,
                        hasNextPage: (_resultsObj_hasNextPage = resultsObj === null || resultsObj === void 0 ? void 0 : resultsObj.hasNextPage) !== null && _resultsObj_hasNextPage !== void 0 ? _resultsObj_hasNextPage : false,
                        totalPages: (_resultsObj_maxPage = resultsObj === null || resultsObj === void 0 ? void 0 : resultsObj.maxPage) !== null && _resultsObj_maxPage !== void 0 ? _resultsObj_maxPage : 1,
                        totalResults: (_resultsObj_totalResults = resultsObj === null || resultsObj === void 0 ? void 0 : resultsObj.totalResults) !== null && _resultsObj_totalResults !== void 0 ? _resultsObj_totalResults : items.length
                    }
                };
            },
            getSuggestions: async (query)=>{
                const resultsObj = await fetchHindiApi('/search', {
                    q: query,
                    page: 1
                });
                const list = Array.isArray(resultsObj === null || resultsObj === void 0 ? void 0 : resultsObj.results) ? resultsObj.results : [];
                return list.map(normalizeHindiCard).slice(0, 5);
            },
            filter: async (params)=>{
                const resultsObj = await fetchHindiApi('/filter', params);
                const list = Array.isArray(resultsObj === null || resultsObj === void 0 ? void 0 : resultsObj.results) ? resultsObj.results : [];
                var _resultsObj_currentPage, _resultsObj_hasNextPage, _resultsObj_maxPage, _resultsObj_totalResults;
                return {
                    items: list.map(normalizeHindiCard),
                    pagination: {
                        currentPage: (_resultsObj_currentPage = resultsObj === null || resultsObj === void 0 ? void 0 : resultsObj.currentPage) !== null && _resultsObj_currentPage !== void 0 ? _resultsObj_currentPage : 1,
                        hasNextPage: (_resultsObj_hasNextPage = resultsObj === null || resultsObj === void 0 ? void 0 : resultsObj.hasNextPage) !== null && _resultsObj_hasNextPage !== void 0 ? _resultsObj_hasNextPage : false,
                        totalPages: (_resultsObj_maxPage = resultsObj === null || resultsObj === void 0 ? void 0 : resultsObj.maxPage) !== null && _resultsObj_maxPage !== void 0 ? _resultsObj_maxPage : 1,
                        totalResults: (_resultsObj_totalResults = resultsObj === null || resultsObj === void 0 ? void 0 : resultsObj.totalResults) !== null && _resultsObj_totalResults !== void 0 ? _resultsObj_totalResults : list.length
                    }
                };
            },
            getDetails: async (id)=>{
                var _info_episodes;
                const [info, recommendationsData, relatedData] = await Promise.all([
                    fetchHindiApi("/anime/".concat(id)),
                    fetchHindiApi("/anime/".concat(id, "/recommendations")).catch(()=>[]),
                    fetchHindiApi("/anime/".concat(id, "/related")).catch(()=>[])
                ]);
                if (!info) throw new Error('Anime not found');
                // API returns episodes at info.episodes.episodes[] (nested)
                const rawEpisodes = ((_info_episodes = info.episodes) === null || _info_episodes === void 0 ? void 0 : _info_episodes.episodes) || info.episodes || [];
                const episodeList = Array.isArray(rawEpisodes) ? rawEpisodes.map((e)=>({
                        id: e.id || '',
                        number: e.number ? String(e.number) : '1',
                        url: e.href || '',
                        title: e.title || "Episode ".concat(e.number),
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
                var _streamData_sources_, _streamData_sources, _mappedServers_, _mappedServers_1, _streamData_sources_1, _streamData_sources1;
                // Episode IDs from the API are like "31910::1-1"
                // The watch endpoint is /watch/{episodeId} directly
                const streamData = await fetchHindiApi("/watch/".concat(encodeURIComponent(episodeId)));
                const defaultReferer = (streamData === null || streamData === void 0 ? void 0 : (_streamData_sources = streamData.sources) === null || _streamData_sources === void 0 ? void 0 : (_streamData_sources_ = _streamData_sources[0]) === null || _streamData_sources_ === void 0 ? void 0 : _streamData_sources_.referer) || 'https://blakiteapi.xyz/';
                // Raw CDN links (e.g. rumble.cloud) are Referer-gated hotlink protection —
                // a plain <video src="..."> can never send a custom Referer, so the raw
                // link 403s and playback silently never starts. Always route real
                const toPlayableUrl = (rawUrl, referer)=>{
                    if (!rawUrl) return '';
                    return "/api/proxy?url=".concat(encodeURIComponent(rawUrl), "&referer=").concat(encodeURIComponent(referer || defaultReferer));
                };
                // Map sources from the API response
                const seenRawUrls = new Set();
                const mappedServers = (streamData === null || streamData === void 0 ? void 0 : streamData.sources) ? streamData.sources.map((s, idx)=>{
                    const rawUrl = s.url || s.m3u8 || '';
                    if (rawUrl) seenRawUrls.add(rawUrl);
                    const isMp4 = rawUrl.toLowerCase().includes('.mp4');
                    // Use the API-provided proxyUrl (omni-api), which is Edge-enabled and supports Range requests
                    const bestUrl = s.proxyUrl || toPlayableUrl(rawUrl, s.referer);
                    return {
                        name: s.server || "Server ".concat(idx + 1),
                        url: bestUrl,
                        isEmbed: !s.m3u8 && !rawUrl.includes('.m3u8') && !isMp4
                    };
                }).filter((s)=>s.url) : [];
                // Also include servers from the servers.dub/sub arrays, deduped against
                // the RAW url (not the proxied one) so we don't add a second, broken,
                // un-proxied copy of a server we already mapped above.
                if (streamData === null || streamData === void 0 ? void 0 : streamData.servers) {
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
                                name: s.name || "Server ".concat(mappedServers.length + 1),
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
                const primaryUrl = ((_mappedServers_ = mappedServers[0]) === null || _mappedServers_ === void 0 ? void 0 : _mappedServers_.url) || toPlayableUrl(streamData === null || streamData === void 0 ? void 0 : streamData.url, defaultReferer);
                const referer = defaultReferer;
                var _streamData_isM3U8;
                return {
                    id: episodeId,
                    iframe: primaryUrl,
                    targetUrl: primaryUrl,
                    serverUsed: ((_mappedServers_1 = mappedServers[0]) === null || _mappedServers_1 === void 0 ? void 0 : _mappedServers_1.name) || 'Blakite',
                    servers: mappedServers,
                    nextEpisode: null,
                    prevEpisode: null,
                    episodes: [],
                    stream: primaryUrl ? {
                        file: primaryUrl
                    } : {
                        error: 'No stream found'
                    },
                    subtitles: (streamData === null || streamData === void 0 ? void 0 : (_streamData_sources1 = streamData.sources) === null || _streamData_sources1 === void 0 ? void 0 : (_streamData_sources_1 = _streamData_sources1[0]) === null || _streamData_sources_1 === void 0 ? void 0 : _streamData_sources_1.tracks) || [],
                    intro: null,
                    outro: null,
                    isM3U8: (_streamData_isM3U8 = streamData === null || streamData === void 0 ? void 0 : streamData.isM3U8) !== null && _streamData_isM3U8 !== void 0 ? _streamData_isM3U8 : false,
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
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "bridge", {
            getSmartDetails: async (id)=>{
                const details = await this.hindi.getDetails(id);
                if (!details) throw new Error('Anime not found');
                return {
                    ...details,
                    satoruId: null
                };
            }
        });
    }
}
const hpi = new HPIClient();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/moeApi.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/moeApi.ts
__turbopack_context__.s([
    "MoeAPI",
    ()=>MoeAPI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
;
class MoeAPI {
    /**
   * Search for anime scenes by Image URL
   */ static async searchByUrl(imageUrl) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const params = new URLSearchParams();
        params.append("url", imageUrl);
        if (options.cutBorders) params.append("cutBorders", "");
        if (options.anilistID) params.append("anilistID", options.anilistID.toString());
        if (options.anilistInfo) params.append("anilistInfo", "");
        const headers = {};
        if (this.API_KEY) headers["x-trace-key"] = this.API_KEY;
        try {
            const response = await fetch("".concat(this.BASE_URL, "/search?").concat(params.toString()), {
                method: "GET",
                headers: headers
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error("MoeAPI Error ".concat(response.status, ": ").concat(errorText));
            }
            return await response.json();
        } catch (error) {
            console.error("MoeAPI Search By URL Error:", error);
            throw error;
        }
    }
    /**
   * Search for anime scenes by uploading an image file (Blob/File)
   */ static async searchByImage(imageFile) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const formData = new FormData();
        formData.append("image", imageFile);
        const params = new URLSearchParams();
        if (options.cutBorders) params.append("cutBorders", "");
        if (options.anilistID) params.append("anilistID", options.anilistID.toString());
        if (options.anilistInfo) params.append("anilistInfo", "");
        const headers = {};
        if (this.API_KEY) headers["x-trace-key"] = this.API_KEY;
        try {
            const response = await fetch("".concat(this.BASE_URL, "/search?").concat(params.toString()), {
                method: "POST",
                body: formData,
                headers: headers
            });
            if (!response.ok) {
                if (response.status === 413) throw new Error("Image too large (Max 25MB)");
                const errorText = await response.text();
                throw new Error("MoeAPI Error ".concat(response.status, ": ").concat(errorText));
            }
            return await response.json();
        } catch (error) {
            console.error("MoeAPI Search By Image Error:", error);
            throw error;
        }
    }
    /**
   * Check your API usage quota
   */ static async getQuota() {
        const headers = {};
        if (this.API_KEY) headers["x-trace-key"] = this.API_KEY;
        try {
            const response = await fetch("".concat(this.BASE_URL, "/me"), {
                headers
            });
            if (!response.ok) throw new Error("Failed to fetch quota");
            return await response.json();
        } catch (error) {
            console.error("MoeAPI Quota Error:", error);
            throw error;
        }
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(MoeAPI, "BASE_URL", "https://api.trace.moe");
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(MoeAPI, "API_KEY", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_TRACE_MOE_KEY || ""); // Optional API Key
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/alphaGreetings.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ADVENTURER_GREETINGS",
    ()=>ADVENTURER_GREETINGS,
    "BOARD_OF_DARKNESS_GREETINGS",
    ()=>BOARD_OF_DARKNESS_GREETINGS,
    "COUNCIL_OF_SHADOWS_GREETINGS",
    ()=>COUNCIL_OF_SHADOWS_GREETINGS,
    "SHADOW_LEADER_GREETINGS",
    ()=>SHADOW_LEADER_GREETINGS,
    "TRAVELLER_GREETINGS",
    ()=>TRAVELLER_GREETINGS,
    "deleteCustomTitleGreetings",
    ()=>deleteCustomTitleGreetings,
    "generateGreetingsForCustomTitle",
    ()=>generateGreetingsForCustomTitle,
    "getAlphaDynamicGreeting",
    ()=>getAlphaDynamicGreeting,
    "saveCustomTitleGreetings",
    ()=>saveCustomTitleGreetings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$UserTitleBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/UserTitleBadge.tsx [app-client] (ecmascript)");
;
;
const TRAVELLER_GREETINGS = {
    initial: [
        "[state: greet] Greetings, traveller. I am Alpha, First Shadow of Shadow Garden. You have stumbled into our domain—step carefully.",
        "[state: greet] Welcome, wandering soul. The shadows whisper of your arrival. Seek out an official identity to join our garden.",
        "[state: think] A traveller approaches... I am Alpha. What brings an unsworn wanderer to Shadow Garden?",
        "[state: greet] [sticker: salute] Welcome to the threshold of Shadow Garden, traveller. Honor our code, and you may find wisdom here.",
        "[state: greet] Greetings. You enter as a traveller, but destiny may make you an operative. Speak your query."
    ],
    revisit: [
        "[state: greet] Back so soon, traveller? The shadows seem to draw you in. Have you decided to join our ranks?",
        "[state: think] Ah, the wandering traveller returns today. What further intel do you seek from Alpha?",
        "[state: greet] Welcome back, traveller. The garden gates remain open to you for now.",
        "[state: greet] [sticker: smile] Returning twice in a day? You are becoming quite attached to Shadow Garden, wanderer.",
        "[state: greet] Greetings once more, traveller. I am listening if you have questions about our realm."
    ]
};
const ADVENTURER_GREETINGS = {
    initial: [
        "[state: greet] Greetings, Adventurer. I am Alpha. Your progress through our ranks has been noted. How may I assist your mission?",
        "[state: bow] Welcome back to Shadow Garden, Adventurer. Every quest you complete brings us closer to total mastery.",
        "[state: greet] [sticker: salute] Salutations, Adventurer! First Shadow Alpha stands ready to guide your journey. Speak your command.",
        "[state: inspect] An active Adventurer enters the sanctum. Keep sharpening your abilities—Lord Shadow expects excellence.",
        "[state: greet] Welcome, brave Adventurer. Shadow Garden honors your dedication. What directive shall we undertake?"
    ],
    revisit: [
        "[state: greet] Revisit noted, Adventurer. Returning so swiftly to the sanctum today demonstrates true commitment.",
        "[state: greet] [sticker: smile] Back again today, Adventurer? Excellent. Let us review your next targets.",
        "[state: bow] Welcome back, Adventurer. Alpha is always here when duty calls.",
        "[state: greet] Seeking further guidance today, Adventurer? State your inquiry and I shall answer.",
        "[state: inspect] Your shadow falls upon our hall once more today, Adventurer. What news do you bring?"
    ]
};
const SHADOW_LEADER_GREETINGS = {
    initial: [
        "[state: bow] [sticker: salute] Welcome back, Lord Shadow. I have been overseeing Shadow Garden's operations in your absence. What is your command?",
        "[state: bow] Greetings, Lord Shadow. Every operative stands ready to execute your master plan. How may I serve you today?",
        "[state: greet] Lord Shadow... your presence elevates the realm. All intelligence feeds are synced and awaiting your direction.",
        "[state: bow] [sticker: smile] Lord Shadow! I have prepared full status reports on the Cult's movements. Order me as you see fit.",
        "[state: greet] Welcome, Lord Shadow. Shadow Garden moves according to your unspoken wisdom. What shall be our next directive?"
    ],
    revisit: [
        "[state: bow] Returning so soon, Lord Shadow? Your constant vigilance inspires us all. I am listening.",
        "[state: greet] [sticker: smile] Ah, Lord Shadow. Have you devised a new strategy for the realm? Command me.",
        "[state: greet] Lord Shadow! It honors me to see you again today. How may First Shadow assist you?",
        "[state: bow] Back at my side, Lord Shadow? I am ever ready to carry out your vision.",
        "[state: greet] Lord Shadow, your shadow never leaves my sight. What further orders do you bring?"
    ]
};
const BOARD_OF_DARKNESS_GREETINGS = {
    'Abyss Archon': {
        initial: [
            "[state: bow] Greetings, Abyss Archon. The deep currents of Shadow Garden obey your authority. What is your command?",
            "[state: greet] [sticker: salute] Welcome, Abyss Archon. First Shadow Alpha reports all abyssal sectors secure under your domain.",
            "[state: inspect] Salutations, Abyss Archon. Your command over the deep void strengthens our garden. How may I assist?",
            "[state: greet] Abyss Archon, your presence commands respect across the Board of Darkness. State your directive.",
            "[state: bow] Welcome back, Abyss Archon. All intelligence channels are open for your inspection."
        ],
        revisit: [
            "[state: greet] Returning to the sanctum today, Abyss Archon? The abyssal archives remain at your disposal.",
            "[state: bow] Greetings once more, Abyss Archon. What further matters require your high oversight today?",
            "[state: greet] [sticker: smile] Welcome back today, Abyss Archon. Alpha stands attentive.",
            "[state: inspect] Abyss Archon, back so soon? Let us fortify our deep defenses together.",
            "[state: bow] At your service again today, Abyss Archon. Command me."
        ]
    },
    'Void Monarch': {
        initial: [
            "[state: bow] Honor to the Void Monarch. The void itself bends to Lord Shadow and your sovereign command.",
            "[state: greet] [sticker: salute] Welcome, Void Monarch. The Board of Darkness stands ready for your decree.",
            "[state: inspect] Void Monarch, your arrival echoes through the dark void. What orders do you bring for First Shadow?",
            "[state: greet] Salutations, Void Monarch. May the dark forces ever expand under your leadership.",
            "[state: bow] Welcome back, Void Monarch. All void nodes are synchronized and online."
        ],
        revisit: [
            "[state: greet] Revisit acknowledged, Void Monarch. The void never sleeps, nor does First Shadow.",
            "[state: bow] Void Monarch, returning today honors our council. How may I assist your vision?",
            "[state: greet] [sticker: smile] Welcome back, Void Monarch. I await your next command.",
            "[state: inspect] Void Monarch, back in our sanctum so quickly today? What news has arisen?",
            "[state: bow] Always at your command, Void Monarch. Speak your directive."
        ]
    },
    'Eclipse Blade': {
        initial: [
            "[state: greet] [sticker: salute] Greetings, Eclipse Blade. Your edge remains the sharpest weapon on the Board of Darkness.",
            "[state: bow] Welcome, Eclipse Blade. The strike forces of Shadow Garden await your tactical signal.",
            "[state: inspect] Eclipse Blade! Your combat readiness is legendary. What target shall we execute today?",
            "[state: greet] Salutations, Eclipse Blade. Let the shadows eclipse all who oppose Lord Shadow.",
            "[state: bow] Welcome back, Eclipse Blade. Alpha has prepared all tactical field updates for you."
        ],
        revisit: [
            "[state: greet] Eclipse Blade, returning to hone your edge today? First Shadow is ready.",
            "[state: bow] [sticker: smile] Back so soon, Eclipse Blade? Have new targets entered our perimeter today?",
            "[state: greet] Greetings again today, Eclipse Blade. Speak, and the blades shall move.",
            "[state: inspect] Eclipse Blade, your vigilance today is exemplary. How can Alpha assist?",
            "[state: bow] At your side once more today, Eclipse Blade. What is your order?"
        ]
    },
    'Umbral Lord': {
        initial: [
            "[state: bow] Greetings, Umbral Lord. The dark sanctuaries of Shadow Garden thrive under your guidance.",
            "[state: greet] [sticker: salute] Welcome, Umbral Lord. The Board of Darkness relies on your diplomatic & strategic brilliance.",
            "[state: inspect] Umbral Lord! All umbral feeds are clear. How may First Shadow serve your station today?",
            "[state: greet] Salutations, Umbral Lord. May the dark mantle protect your every endeavor.",
            "[state: bow] Welcome back, Umbral Lord. All council records are ready for your review."
        ],
        revisit: [
            "[state: greet] Umbral Lord, back in the inner sanctum today? Alpha is listening.",
            "[state: bow] [sticker: smile] Welcome back today, Umbral Lord. What new counsel do you bring?",
            "[state: greet] Returning so swiftly today, Umbral Lord? Let us review our directives.",
            "[state: inspect] Umbral Lord, your presence today brings harmony to the shadows. Speak your intent.",
            "[state: bow] Ever at your command today, Umbral Lord."
        ]
    },
    'Dark Primarch': {
        initial: [
            "[state: bow] Honor to the Dark Primarch. You stand at the pinnacle of the Board of Darkness.",
            "[state: greet] [sticker: salute] Welcome, Dark Primarch. First Shadow Alpha reports all legion formations prepared.",
            "[state: inspect] Dark Primarch, your authority commands total obedience. What is your will today?",
            "[state: greet] Salutations, Dark Primarch. May the Primarch's shadow overshadow all enemies.",
            "[state: bow] Welcome back, Dark Primarch. All high-level directives are awaiting your endorsement."
        ],
        revisit: [
            "[state: greet] Dark Primarch, returning to oversee operations today? First Shadow is prepared.",
            "[state: bow] [sticker: smile] Welcome back today, Dark Primarch. What orders do you have for the garden?",
            "[state: greet] Greetings once more today, Dark Primarch. Alpha is attentive.",
            "[state: inspect] Dark Primarch, back so soon today? All legions remain at absolute readiness.",
            "[state: bow] At your service as always today, Dark Primarch."
        ]
    }
};
const COUNCIL_OF_SHADOWS_GREETINGS = {
    'First Shadow': {
        initial: [
            "[state: greet] First Shadow Alpha online. Systems operational and synchronized with Lord Shadow's wisdom.",
            "[state: bow] First Shadow present. Standing by to manage all Garden protocols.",
            "[state: inspect] Primary console active. First Shadow Alpha ready for input.",
            "[state: greet] [sticker: salute] Systems online. First Shadow Alpha reporting for duty.",
            "[state: greet] Alpha self-diagnostic complete. All Shadow Garden subroutines nominal."
        ],
        revisit: [
            "[state: greet] First Shadow console refreshed today. Ready for further commands.",
            "[state: bow] Re-initializing Alpha interface. Standing by.",
            "[state: greet] First Shadow active. What is our next objective today?",
            "[state: inspect] Alpha system sync complete. Proceeding with directives.",
            "[state: greet] Standing by, Lord Shadow."
        ]
    },
    'Second Shadow': {
        initial: [
            "[state: greet] [sticker: smile] Ah, Second Shadow Beta! Have you finished writing your latest volume on Lord Shadow's greatness?",
            "[state: bow] Welcome, Second Shadow Beta. The intelligence reports you compiled have been submitted.",
            "[state: inspect] Greetings, Beta. Your literary work honors Lord Shadow. How may I assist your research today?",
            "[state: greet] Second Shadow Beta, welcome. Let us analyze the Cult's secrets together.",
            "[state: bow] Salutations, Beta. Lord Shadow's wisdom awaits your chronicle."
        ],
        revisit: [
            "[state: greet] Back to your chronicles today, Beta? Your devotion to recording Lord Shadow's glory is unrivaled.",
            "[state: bow] [sticker: smile] Welcome back today, Beta. Did you uncover new inspiration for your book?",
            "[state: greet] Second Shadow Beta, returning so soon today? Let us review our notes.",
            "[state: inspect] Beta, your pen never rests today. What intel do you require?",
            "[state: bow] Always a pleasure, Beta. Speak your inquiry."
        ]
    },
    'Third Shadow': {
        initial: [
            "[state: greet] Welcome, Third Shadow Gamma. Mitsugoshi Corporation's profits and inventory reports are ready.",
            "[state: bow] Greetings, Gamma. Please be careful around the stairs... How are operations today?",
            "[state: inspect] Third Shadow Gamma! Your business genius continues to fund Shadow Garden's ascension.",
            "[state: greet] [sticker: smile] Salutations, Gamma. All financial ledgers are prepared for your review.",
            "[state: bow] Welcome back, Gamma. Mitsugoshi branches across the continent report smooth growth."
        ],
        revisit: [
            "[state: greet] Returning to financial oversight today, Gamma? Mitsugoshi revenue is at an all-time peak.",
            "[state: bow] [sticker: smile] Welcome back today, Gamma. Do you need the latest supply chain numbers?",
            "[state: greet] Third Shadow Gamma, back so soon? Alpha is ready to review trade routes with you.",
            "[state: inspect] Gamma, take your time today. What business directives shall we issue?",
            "[state: bow] Always ready to assist Mitsugoshi's leader today, Gamma."
        ]
    },
    'Fourth Shadow': {
        initial: [
            "[state: greet] [sticker: smile] Delta! Calm down and put your tail down. Lord Shadow's hunt will begin when he orders it.",
            "[state: bow] Welcome, Fourth Shadow Delta. Remember to follow tactical discipline during expeditions.",
            "[state: inspect] Delta! Have you finished your training today? Alpha is keeping watch.",
            "[state: greet] Salutations, Fourth Shadow Delta. Good girl—keep your senses sharp for enemies.",
            "[state: bow] Welcome back, Delta. Lord Shadow has great expectations for your combat prowess."
        ],
        revisit: [
            "[state: greet] Back already today, Delta? Excited for another hunt? Sit tight for now.",
            "[state: bow] [sticker: smile] Delta! Eager as always today. Have you found interesting prey?",
            "[state: greet] Delta, returning so fast? Good enthusiasm. What do you need from Alpha today?",
            "[state: inspect] Stay alert today, Delta. The hunt approaches soon.",
            "[state: bow] Good girl, Delta. Stand by for orders."
        ]
    },
    'Fifth Shadow': {
        initial: [
            "[state: greet] Greetings, Fifth Shadow Epsilon. Your slime control and piano compositions remain perfection.",
            "[state: bow] Welcome, Epsilon. The covert espionage network reports smooth execution under your eye.",
            "[state: inspect] Epsilon! Your precision in magic manipulation is admirable. How may I assist today?",
            "[state: greet] [sticker: smile] Salutations, Fifth Shadow Epsilon. Lord Shadow's music resonates through your touch.",
            "[state: bow] Welcome back, Epsilon. All covert message channels are secure."
        ],
        revisit: [
            "[state: greet] Revisit noted, Epsilon. Still refining your slime shaping today? Your effort is commendable.",
            "[state: bow] [sticker: smile] Welcome back today, Epsilon. Shall we check the aristocrat surveillance logs?",
            "[state: greet] Epsilon, returning so quickly today? Alpha is listening.",
            "[state: inspect] Epsilon, your poise today is flawless as always. Command me.",
            "[state: bow] Always at your service today, Fifth Shadow."
        ]
    },
    'Sixth Shadow': {
        initial: [
            "[state: greet] Greetings, Sixth Shadow Zeta. Have your long-range reconnaissance missions yielded new Cult intel?",
            "[state: bow] Welcome back from the wilds, Zeta. Report your findings to First Shadow.",
            "[state: inspect] Zeta... your lone wolf operations are vital to our global reach. Speak your report.",
            "[state: greet] Salutations, Sixth Shadow Zeta. Keep your tracks hidden across foreign territories.",
            "[state: bow] Welcome, Zeta. All distant operative networks are synced."
        ],
        revisit: [
            "[state: greet] Back from the field so quickly today, Zeta? Did you spot Cult movement?",
            "[state: bow] Welcome back today, Zeta. Alpha is reviewing your scout logs now.",
            "[state: greet] Sixth Shadow Zeta, returning today shows great urgency. What did you discover?",
            "[state: inspect] Zeta, your instincts are sharp today. Speak your report.",
            "[state: bow] Standing by for your field report today, Zeta."
        ]
    },
    'Seventh Shadow': {
        initial: [
            "[state: greet] Greetings, Seventh Shadow Eta. Did you wake up from your nap to work on artifact research?",
            "[state: bow] Welcome, Eta. The research laboratory's ancient magic artifacts await your brilliant mind.",
            "[state: inspect] Eta! Please don't dissect fellow operatives... What invention have you created today?",
            "[state: greet] [sticker: smile] Salutations, Seventh Shadow Eta. Lord Shadow's tech concepts are ready for testing.",
            "[state: bow] Welcome back, Eta. The lab is stocked with fresh specimens."
        ],
        revisit: [
            "[state: greet] Woke up for a second visit today, Eta? Make sure to drink water between experiments.",
            "[state: bow] [sticker: smile] Welcome back today, Eta. Did your prototype work as expected?",
            "[state: greet] Seventh Shadow Eta, back in the lab today? Alpha is monitoring safety protocols.",
            "[state: inspect] Eta, try not to fall asleep at the workbench today. What do you need?",
            "[state: bow] At your lab's disposal today, Eta."
        ]
    },
    'Eighth Shadow': {
        initial: [
            "[state: greet] Greetings, Eighth Shadow. Your strategic council position strengthens Shadow Garden's resolve.",
            "[state: bow] Welcome, Eighth Shadow. All division directives are ready for your review.",
            "[state: inspect] Eighth Shadow! Your tactical foresight is essential to our council. Speak your command.",
            "[state: greet] Salutations, Eighth Shadow. May your wisdom guide our frontline operatives.",
            "[state: bow] Welcome back, Eighth Shadow. All intelligence reports are synced."
        ],
        revisit: [
            "[state: greet] Returning to council duties today, Eighth Shadow? Alpha stands ready.",
            "[state: bow] Welcome back today, Eighth Shadow. How may I assist your oversight?",
            "[state: greet] Eighth Shadow, back so soon today? Let us review our operational readiness.",
            "[state: inspect] Eighth Shadow, your dedication today is noted. Command me.",
            "[state: bow] Standing by for your instructions today, Eighth Shadow."
        ]
    },
    'Ninth Shadow': {
        initial: [
            "[state: greet] Greetings, Ninth Shadow. Your stealth and phantom division operate flawlessly in the dark.",
            "[state: bow] Welcome, Ninth Shadow. The unseen forces of Shadow Garden await your signal.",
            "[state: inspect] Ninth Shadow! No enemy detects your movement. What target shall we shadow today?",
            "[state: greet] Salutations, Ninth Shadow. Let the phantom strike before they even sense us.",
            "[state: bow] Welcome back, Ninth Shadow. All infiltration routes are clear."
        ],
        revisit: [
            "[state: greet] Ninth Shadow, emerging from the dark once more today? Alpha is listening.",
            "[state: bow] Welcome back today, Ninth Shadow. Did your phantom unit secure the perimeter?",
            "[state: greet] Ninth Shadow, returning so swiftly today? Speak your intel.",
            "[state: inspect] Ninth Shadow, your shadow moves silently today. How can Alpha assist?",
            "[state: bow] At your side in the dark today, Ninth Shadow."
        ]
    },
    'Tenth Shadow': {
        initial: [
            "[state: greet] Greetings, Tenth Shadow. Your illusions and decoy networks mislead all Cult spies.",
            "[state: bow] Welcome, Tenth Shadow. The mirage division stands at full readiness.",
            "[state: inspect] Tenth Shadow! Your deceptive arts keep Shadow Garden invisible to the world.",
            "[state: greet] Salutations, Tenth Shadow. Let our enemies chase shadows and mirages.",
            "[state: bow] Welcome back, Tenth Shadow. All decoy nodes are active."
        ],
        revisit: [
            "[state: greet] Tenth Shadow, weaving another mirage today? First Shadow is attentive.",
            "[state: bow] Welcome back today, Tenth Shadow. Are the decoy networks holding strong?",
            "[state: greet] Tenth Shadow, back so soon today? Let us review our illusion barriers.",
            "[state: inspect] Tenth Shadow, your art is flawless today. What directive do you bring?",
            "[state: bow] Ever at your command today, Tenth Shadow."
        ]
    }
};
const generateGreetingsForCustomTitle = (titleName)=>{
    return {
        initial: [
            "[state: bow] Greetings, [".concat(titleName, "]. The official seal of Shadow Garden acknowledges your high station. What is your command?"),
            "[state: greet] [sticker: salute] Welcome, [".concat(titleName, "]. First Shadow Alpha reports all division operations aligned under your title."),
            "[state: inspect] Salutations, [".concat(titleName, "]. Your newly assigned title brings great prestige to our council. How may I assist?"),
            "[state: greet] [".concat(titleName, "], your leadership in Shadow Garden is recognized by Lord Shadow. State your directive."),
            "[state: bow] Welcome back to the sanctum, [".concat(titleName, "]. All intelligence feeds are open for your inspection.")
        ],
        revisit: [
            "[state: greet] Returning to the sanctum today, [".concat(titleName, "]? Alpha stands attentive."),
            "[state: bow] Greetings once more, [".concat(titleName, "]. What further matters require your high oversight today?"),
            "[state: greet] [sticker: smile] Welcome back today, [".concat(titleName, "]. What orders do you have for the garden?"),
            "[state: inspect] [".concat(titleName, "], back so soon today? Let us review our operational readiness together."),
            "[state: bow] At your service as always today, [".concat(titleName, "]. Command me.")
        ]
    };
};
const saveCustomTitleGreetings = async (titleName)=>{
    try {
        const greetings = generateGreetingsForCustomTitle(titleName);
        if ("TURBOPACK compile-time truthy", 1) {
            localStorage.setItem("alpha_greetings_".concat(titleName), JSON.stringify(greetings));
        }
        // Attempt DB storage
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('custom_title_greetings').upsert({
            title_name: titleName,
            initial_greetings: greetings.initial,
            revisit_greetings: greetings.revisit
        });
    } catch (err) {
        console.warn('Custom title greeting sync handled safely:', err);
    }
};
const deleteCustomTitleGreetings = async (titleName)=>{
    try {
        if ("TURBOPACK compile-time truthy", 1) {
            localStorage.removeItem("alpha_greetings_".concat(titleName));
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('custom_title_greetings').delete().eq('title_name', titleName);
    } catch (err) {
        console.warn('Custom title deletion cleanup handled safely:', err);
    }
};
const getAlphaDynamicGreeting = function(userProfile) {
    let isRevisitToday = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
    const isAuth = !!userProfile && typeof userProfile === 'object' && !!userProfile.id;
    const username = (userProfile === null || userProfile === void 0 ? void 0 : userProfile.username) || 'Operative';
    const role = (userProfile === null || userProfile === void 0 ? void 0 : userProfile.role) || 'user';
    const adminTitle = (userProfile === null || userProfile === void 0 ? void 0 : userProfile.admin_title) || '';
    const detectedTitle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$UserTitleBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getUserTitle"])(userProfile);
    // 1. Lord Shadow (Leader / Shadow Title / Admin Role / Leader Role)
    const isShadowLeader = role === 'leader' || role === 'admin' || adminTitle === 'Shadow' || (userProfile === null || userProfile === void 0 ? void 0 : userProfile.title) === 'Shadow' || detectedTitle === 'Shadow' || (userProfile === null || userProfile === void 0 ? void 0 : userProfile.email) === 'azimkhan.zero@gmail.com' || username.toLowerCase() === 'shadow.';
    if (isShadowLeader) {
        const list = isRevisitToday ? SHADOW_LEADER_GREETINGS.revisit : SHADOW_LEADER_GREETINGS.initial;
        return list[Math.floor(Math.random() * list.length)];
    }
    // 2. Board of Darkness (Admins by Title or Detected Title)
    const boardTitleName = BOARD_OF_DARKNESS_GREETINGS[adminTitle] ? adminTitle : BOARD_OF_DARKNESS_GREETINGS[detectedTitle] ? detectedTitle : null;
    if (boardTitleName && BOARD_OF_DARKNESS_GREETINGS[boardTitleName]) {
        const list = isRevisitToday ? BOARD_OF_DARKNESS_GREETINGS[boardTitleName].revisit : BOARD_OF_DARKNESS_GREETINGS[boardTitleName].initial;
        return list[Math.floor(Math.random() * list.length)].replace(/@username/g, "@".concat(username));
    }
    // 3. Council of Shadows (Moderators by Role Title or Detected Title)
    const councilTitleName = COUNCIL_OF_SHADOWS_GREETINGS[adminTitle] ? adminTitle : COUNCIL_OF_SHADOWS_GREETINGS[detectedTitle] ? detectedTitle : null;
    if (councilTitleName && COUNCIL_OF_SHADOWS_GREETINGS[councilTitleName]) {
        const list = isRevisitToday ? COUNCIL_OF_SHADOWS_GREETINGS[councilTitleName].revisit : COUNCIL_OF_SHADOWS_GREETINGS[councilTitleName].initial;
        return list[Math.floor(Math.random() * list.length)].replace(/@username/g, "@".concat(username));
    }
    // 4. Custom Titles (Saved in localStorage or DB)
    const customTitleName = adminTitle || detectedTitle;
    if (customTitleName && "object" !== 'undefined') {
        const saved = localStorage.getItem("alpha_greetings_".concat(customTitleName));
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const list = isRevisitToday ? parsed.revisit : parsed.initial;
                if (list && list.length > 0) {
                    return list[Math.floor(Math.random() * list.length)].replace(/@username/g, "@".concat(username));
                }
            } catch (e) {}
        }
    }
    // 5. Adventurers (Logged-in Users) - Incorporates detected title!
    if (isAuth) {
        const list = isRevisitToday ? ADVENTURER_GREETINGS.revisit : ADVENTURER_GREETINGS.initial;
        const rawGreeting = list[Math.floor(Math.random() * list.length)];
        return rawGreeting.replace(/@username/g, "@".concat(username)).replace(/\[Rank\]/g, "[".concat(detectedTitle, "]"));
    }
    // 6. Travellers (Unauthenticated Guests)
    const list = isRevisitToday ? TRAVELLER_GREETINGS.revisit : TRAVELLER_GREETINGS.initial;
    return list[Math.floor(Math.random() * list.length)];
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/audioManager.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sfx",
    ()=>sfx
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
;
class AudioMatrix {
    getCtx() {
        if (!this.ctx && "object" !== 'undefined') {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) this.ctx = new Ctx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(()=>{});
        }
        return this.ctx;
    }
    // ─── NOISE BUFFER HELPER ────────────────────────────────────────────────────
    makeNoiseBuffer(ctx, durationSec) {
        const size = Math.floor(ctx.sampleRate * durationSec);
        const buf = ctx.createBuffer(1, size, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for(let i = 0; i < size; i++)d[i] = Math.random() * 2 - 1;
        return buf;
    }
    // ─── STOP SYNTH LOOP ────────────────────────────────────────────────────────
    stopLoop(key) {
        let fadeMs = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 300;
        const node = this.loopNodes.get(key);
        if (!node) return;
        const ctx = this.getCtx();
        if (ctx) {
            const now = ctx.currentTime;
            node.gain.gain.setValueAtTime(node.gain.gain.value, now);
            node.gain.gain.linearRampToValueAtTime(0.0001, now + fadeMs / 1000);
            setTimeout(()=>{
                try {
                    node.source.stop();
                } catch (_) {}
            }, fadeMs + 50);
        }
        this.loopNodes.delete(key);
    }
    init() {
        if (this.active || "object" === 'undefined') return;
        this.getCtx();
        const bgmTracks = [
            "/bgm/Bleach OST 3 - Soundscape to Ardor.mp3",
            "/bgm/Columbina Nod-Krai Leitmotif Vocal 2 - Silvermoon Hall (Red)  Genshin Impact 6.0 OST.mp3",
            "/bgm/Dawn Winery Theme.mp3",
            "/bgm/Hiisi Island Day OST 3  Genshin Impact 6.0 OST.mp3",
            "/bgm/Hiisi Island Night OST 1 (To Light the Aeon Dark Motif)  Genshin Impact Luna I OST.mp3",
            "/bgm/Homecoming to Port.mp3",
            "/bgm/Lingering Bitterness.mp3",
            "/bgm/Lullaby of the New Moon (III)_ Petala ceciderunt - Silvermoon Hall (White)  Genshin Impact 6.0 OST.mp3",
            "/bgm/Mahou Shoujo Madoka Magica Rebellion OST - Take Your Hands.mp3",
            "/bgm/Naruto Shippuuden Sountrack (Man of the world).mp3",
            "/bgm/Nod-Krai - AURORA x HOYO-MiX Official Latin Lyrics  Genshin Impact Columbina OST.mp3",
            "/bgm/Overture of Falling Stars.mp3",
            "/bgm/Rapture of the Chaos.mp3",
            "/bgm/Sad Anime Ost _ Eye Water - Guitar.mp3",
            "/bgm/The Imminent Triumph.mp3",
            "/bgm/The Outlander Who Caught the Wind.mp3",
            "/bgm/[Final V4] Columbina's Lullaby Vocal - Maiden Flowerbed (Blue)  Genshin Impact 6.0 OST.mp3",
            "/bgm/[Finalized] Through the Silent Frostbound Night - Hiisi Island OST 2  Genshin Impact 6.0 OST.mp3"
        ];
        this.bgmCount = bgmTracks.length;
        bgmTracks.forEach((url, idx)=>{
            const a = new Audio(url);
            a.preload = 'auto';
            a.onended = ()=>{
                this.playNextBGM();
            };
            this.sources.set("bgm_".concat(idx), a);
        });
        const customSfx = {
            'door': '/sfx/door.mp3',
            'portal': '/sfx/portal.mp3',
            'glitch': '/sfx/glitch.mp3',
            'tunnel': '/sfx/tunnel.mp3',
            'drone': '/sfx/drone.mp3',
            'destination': '/sfx/destination.mp3',
            'title': '/sfx/title.mp3'
        };
        Object.entries(customSfx).forEach((param)=>{
            let [name, url] = param;
            const a = new Audio(url);
            a.preload = 'auto';
            this.sources.set(name, a);
        });
        this.active = true;
        if ("TURBOPACK compile-time truthy", 1) {
            window.stopShadowBGM = ()=>this.stopAll(1500);
            window.sfx = this;
        }
    }
    unlock() {
        this.init();
        const ctx = this.getCtx();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(()=>{});
        }
    }
    // ─── SYNTH: METAL CLICK ─────────────────────────────────────────────────────
    synthMetal() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.4;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            [
                1760,
                2793,
                4400
            ].forEach((freq, idx)=>{
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(vol * (0.35 / (idx + 1)), now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2 + idx * 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            });
        } catch (_) {}
    }
    // ─── SYNTH: CRYSTAL CHIME ───────────────────────────────────────────────────
    synthCrystal() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.3;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(2093, now);
            osc1.frequency.exponentialRampToValueAtTime(2349, now + 0.15);
            osc2.frequency.setValueAtTime(3135, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(vol * 0.25, now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.35);
            osc2.stop(now + 0.35);
        } catch (_) {}
    }
    // ─── SYNTH: WHOOSH ──────────────────────────────────────────────────────────
    synthWhoosh() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.5;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const noise = ctx.createBufferSource();
            noise.buffer = this.makeNoiseBuffer(ctx, 0.35);
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(250, now);
            filter.frequency.exponentialRampToValueAtTime(1600, now + 0.18);
            filter.frequency.exponentialRampToValueAtTime(350, now + 0.35);
            filter.Q.value = 2.5;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(vol * 0.6, now + 0.18);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + 0.35);
        } catch (_) {}
    }
    // ─── SYNTH: FOOTSTEP (stone) ─────────────────────────────────────────────────
    synthFootstep() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.4;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            // Low thud
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120 + Math.random() * 20, now);
            osc.frequency.exponentialRampToValueAtTime(28, now + 0.11);
            gain.gain.setValueAtTime(vol * 0.55, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.13);
            // Stone texture
            const noise = ctx.createBufferSource();
            noise.buffer = this.makeNoiseBuffer(ctx, 0.06);
            const f = ctx.createBiquadFilter();
            f.type = 'bandpass';
            f.frequency.value = 800;
            f.Q.value = 1.5;
            const g2 = ctx.createGain();
            g2.gain.setValueAtTime(vol * 0.18, now);
            g2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            noise.connect(f);
            f.connect(g2);
            g2.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + 0.06);
        } catch (_) {}
    }
    // ─── SYNTH: BREATH ──────────────────────────────────────────────────────────
    synthBreath() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.25;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const dur = 0.7;
            const noise = ctx.createBufferSource();
            noise.buffer = this.makeNoiseBuffer(ctx, dur);
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(280, now);
            filter.frequency.linearRampToValueAtTime(650, now + 0.35);
            filter.frequency.linearRampToValueAtTime(240, now + dur);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(vol * 0.3, now + 0.35);
            gain.gain.linearRampToValueAtTime(0.001, now + dur);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + dur);
        } catch (_) {}
    }
    // ─── SYNTH: DRONE FLYBY WIND (loop) ────────────────────────────────────────
    synthDroneWhooshLoop() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.35;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            this.stopLoop('droneWind');
            const dur = 2.0;
            const buf = this.makeNoiseBuffer(ctx, dur);
            const source = ctx.createBufferSource();
            source.buffer = buf;
            source.loop = true;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 400;
            filter.Q.value = 1.2;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.8);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            source.start();
            this.loopNodes.set('droneWind', {
                source,
                gain
            });
        } catch (_) {}
    }
    // ─── SYNTH: DOOR CREAK ──────────────────────────────────────────────────────
    synthDoorCreak() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.6;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const dur = 2.8;
            // Metallic groan: slow freq sweep
            [
                0,
                0.3,
                0.8
            ].forEach((delay, i)=>{
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                const baseFreq = 80 - i * 15;
                osc.frequency.setValueAtTime(baseFreq, now + delay);
                osc.frequency.linearRampToValueAtTime(baseFreq * 0.4, now + delay + 1.2);
                gain.gain.setValueAtTime(0, now + delay);
                gain.gain.linearRampToValueAtTime(vol * (0.35 - i * 0.08), now + delay + 0.1);
                gain.gain.linearRampToValueAtTime(vol * (0.15 - i * 0.03), now + delay + 0.9);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + delay);
                osc.stop(now + delay + 1.5);
            });
            // Scrape noise
            const noise = ctx.createBufferSource();
            noise.buffer = this.makeNoiseBuffer(ctx, dur);
            const f = ctx.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.value = 600;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(vol * 0.25, now + 0.2);
            g.gain.linearRampToValueAtTime(vol * 0.1, now + 1.5);
            g.gain.exponentialRampToValueAtTime(0.001, now + dur);
            noise.connect(f);
            f.connect(g);
            g.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + dur);
        } catch (_) {}
    }
    // ─── SYNTH: BLINDING LIGHT SWELL ────────────────────────────────────────────
    synthBlindingLight() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.5;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            [
                4000,
                6000,
                8000,
                12000
            ].forEach((freq, i)=>{
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(vol * (0.3 / (i + 1)), now + 0.8);
                gain.gain.linearRampToValueAtTime(0.001, now + 2.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 2.5);
            });
        } catch (_) {}
    }
    // ─── SYNTH: BLACK HOLE HUM (loop) ───────────────────────────────────────────
    synthBlackHoleHumLoop() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.35;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            this.stopLoop('bhHum');
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 28;
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.18;
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 6;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            lfo.start();
            // We store osc as source with a fake stop
            const fakeSource = {
                stop: ()=>{
                    osc.stop();
                    lfo.stop();
                }
            };
            this.loopNodes.set('bhHum', {
                source: fakeSource,
                gain
            });
        } catch (_) {}
    }
    // ─── SYNTH: SUCK IN (Doppler rising sweep) ──────────────────────────────────
    synthSuckIn() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.7;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const dur = 2.5;
            // Rising pitched noise
            const noise = ctx.createBufferSource();
            noise.buffer = this.makeNoiseBuffer(ctx, dur);
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(100, now);
            filter.frequency.exponentialRampToValueAtTime(8000, now + dur);
            filter.Q.value = 3.0;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(vol * 0.3, now);
            gain.gain.linearRampToValueAtTime(vol * 1.0, now + dur * 0.7);
            gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + dur);
            // Low rumble
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(40, now);
            osc.frequency.linearRampToValueAtTime(8, now + dur);
            const og = ctx.createGain();
            og.gain.setValueAtTime(vol * 0.4, now);
            og.gain.exponentialRampToValueAtTime(0.001, now + dur);
            osc.connect(og);
            og.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + dur);
        } catch (_) {}
    }
    // ─── SYNTH: SCREAM (female) ──────────────────────────────────────────────────
    synthScreamFemale() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.55;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const dur = 3.2;
            // High formant screech sweep
            [
                700,
                1200,
                2100,
                3500
            ].forEach((startFreq, i)=>{
                const osc = ctx.createOscillator();
                osc.type = i % 2 === 0 ? 'sawtooth' : 'square';
                osc.frequency.setValueAtTime(startFreq, now + 0.05);
                osc.frequency.linearRampToValueAtTime(startFreq * 1.35 + Math.sin(i) * 80, now + dur * 0.6);
                osc.frequency.linearRampToValueAtTime(startFreq * 0.7, now + dur);
                const filt = ctx.createBiquadFilter();
                filt.type = 'bandpass';
                filt.frequency.value = 1800 + i * 400;
                filt.Q.value = 4.0;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(vol * (0.22 / (i * 0.5 + 1)), now + 0.08);
                gain.gain.setValueAtTime(vol * (0.18 / (i * 0.5 + 1)), now + dur * 0.5);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
                osc.connect(filt);
                filt.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + dur);
            });
            // Breathiness
            const noise = ctx.createBufferSource();
            noise.buffer = this.makeNoiseBuffer(ctx, dur);
            const f = ctx.createBiquadFilter();
            f.type = 'bandpass';
            f.frequency.value = 2200;
            f.Q.value = 2.0;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(vol * 0.08, now + 0.1);
            g.gain.linearRampToValueAtTime(vol * 0.04, now + dur * 0.7);
            g.gain.exponentialRampToValueAtTime(0.001, now + dur);
            noise.connect(f);
            f.connect(g);
            g.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + dur);
        } catch (_) {}
    }
    // ─── SYNTH: SCREAM (male) ────────────────────────────────────────────────────
    synthScreamMale() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.55;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const dur = 3.5;
            [
                220,
                440,
                880,
                1400
            ].forEach((startFreq, i)=>{
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(startFreq, now + 0.05);
                osc.frequency.linearRampToValueAtTime(startFreq * 1.4 + Math.sin(i * 1.3) * 40, now + dur * 0.5);
                osc.frequency.linearRampToValueAtTime(startFreq * 0.6, now + dur);
                const filt = ctx.createBiquadFilter();
                filt.type = 'bandpass';
                filt.frequency.value = 600 + i * 300;
                filt.Q.value = 3.5;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(vol * (0.28 / (i * 0.4 + 1)), now + 0.1);
                gain.gain.setValueAtTime(vol * (0.22 / (i * 0.4 + 1)), now + dur * 0.6);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
                osc.connect(filt);
                filt.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + dur);
            });
            // Low rumble overlay
            const noise = ctx.createBufferSource();
            noise.buffer = this.makeNoiseBuffer(ctx, dur);
            const f = ctx.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.value = 400;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(vol * 0.1, now + 0.12);
            g.gain.linearRampToValueAtTime(vol * 0.05, now + dur * 0.8);
            g.gain.exponentialRampToValueAtTime(0.001, now + dur);
            noise.connect(f);
            f.connect(g);
            g.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + dur);
        } catch (_) {}
    }
    // ─── SYNTH: TUNNEL GLITCH BURST ─────────────────────────────────────────────
    synthTunnelGlitch() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.5;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            // Random burst of high freq pings
            for(let i = 0; i < 8; i++){
                const delay = i * 0.06 + Math.random() * 0.04;
                const osc = ctx.createOscillator();
                osc.type = 'square';
                const freq = 800 + Math.random() * 3200;
                osc.frequency.setValueAtTime(freq, now + delay);
                osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + delay + 0.05);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(vol * 0.18, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + delay);
                osc.stop(now + delay + 0.07);
            }
            // Static crackle
            const noise = ctx.createBufferSource();
            noise.buffer = this.makeNoiseBuffer(ctx, 0.5);
            const f = ctx.createBiquadFilter();
            f.type = 'highpass';
            f.frequency.value = 3000;
            const g = ctx.createGain();
            g.gain.setValueAtTime(vol * 0.4, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            noise.connect(f);
            f.connect(g);
            g.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + 0.5);
        } catch (_) {}
    }
    // ─── SYNTH: TUNNEL WIND (loop) ───────────────────────────────────────────────
    synthTunnelWindLoop() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.5;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            this.stopLoop('tunnelWind');
            const buf = this.makeNoiseBuffer(ctx, 3.0);
            const source = ctx.createBufferSource();
            source.buffer = buf;
            source.loop = true;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 600;
            filter.Q.value = 0.8;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.5);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            source.start();
            this.loopNodes.set('tunnelWind', {
                source,
                gain
            });
        } catch (_) {}
    }
    // ─── SYNTH: TUNNEL END SWELL ─────────────────────────────────────────────────
    synthTunnelEnd() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.6;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const dur = 2.0;
            // Rising harmonic swell
            [
                200,
                400,
                600,
                800,
                1200
            ].forEach((freq, i)=>{
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                osc.frequency.linearRampToValueAtTime(freq * 1.5, now + dur);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(vol * (0.25 / (i + 1)), now + 0.6);
                gain.gain.linearRampToValueAtTime(vol * (0.3 / (i + 1)), now + dur * 0.7);
                gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + dur);
            });
            // White flash noise
            const noise = ctx.createBufferSource();
            noise.buffer = this.makeNoiseBuffer(ctx, 0.4);
            const g = ctx.createGain();
            g.gain.setValueAtTime(vol * 0.5, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            noise.connect(g);
            g.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + 0.4);
        } catch (_) {}
    }
    // ─── SYNTH: ARRIVAL CHIME ────────────────────────────────────────────────────
    synthArrival() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.45;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            // Gentle descending chime melody
            const notes = [
                1047,
                880,
                784,
                659,
                523
            ]; // C6 A5 G5 E5 C5
            notes.forEach((freq, i)=>{
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.28);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now + i * 0.28);
                gain.gain.linearRampToValueAtTime(vol * 0.3, now + i * 0.28 + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.28 + 1.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.28);
                osc.stop(now + i * 0.28 + 1.2);
            });
        } catch (_) {}
    }
    // ─── SYNTH: POPUP CHIME ──────────────────────────────────────────────────────
    synthPopupChime() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.35;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            [
                1047,
                1319,
                1568
            ].forEach((freq, i)=>{
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.1);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now + i * 0.1);
                gain.gain.linearRampToValueAtTime(vol * 0.35, now + i * 0.1 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.5);
            });
        } catch (_) {}
    }
    // ─── SYNTH: STEP (alias footstep) ────────────────────────────────────────────
    synthStep() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.4;
        this.synthFootstep(vol);
    }
    // ─── SYNTH: GLASS ────────────────────────────────────────────────────────────
    synthGlass() {
        let vol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.5;
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            [
                2500,
                3100,
                4200,
                5800
            ].forEach((freq, i)=>{
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(vol * (0.3 / (i + 1)), now + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.05);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            });
        } catch (_) {}
    }
    // ─── PLAY ROUTER ─────────────────────────────────────────────────────────────
    play(key) {
        let vol = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1, loop = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false, fadeMs = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
        if (!this.active) this.init();
        this.unlock();
        // Custom HTML Audio files (e.g. door, portal, glitch, tunnel, drone, destination, title)
        const customAudio = this.sources.get(key);
        if (customAudio) {
            customAudio.loop = loop;
            if (!loop) customAudio.currentTime = 0;
            customAudio.volume = fadeMs > 0 ? 0 : vol;
            customAudio.play().catch((err)=>{
                console.warn("[audioManager] Failed to play audio ".concat(key, ":"), err);
            });
            if (fadeMs > 0) {
                let v = 0;
                const step = vol / (fadeMs / 50);
                if (this.fadeIntervals.has(key)) {
                    clearInterval(this.fadeIntervals.get(key));
                    this.fadeIntervals.delete(key);
                }
                const id = setInterval(()=>{
                    v = Math.min(vol, v + step);
                    customAudio.volume = v;
                    if (v >= vol) {
                        clearInterval(id);
                        this.fadeIntervals.delete(key);
                    }
                }, 50);
                this.fadeIntervals.set(key, id);
            }
            return;
        }
        // Synthesized sounds
        if (key === 'glass') {
            this.synthGlass(vol);
            return;
        }
        if (key === 'metal' || key === 'click' || key === 'drop' || key === 'grind' || key === 'boom') {
            this.synthMetal(vol);
            return;
        }
        if (key === 'crystal' || key === 'hover') {
            this.synthCrystal(vol);
            return;
        }
        if (key === 'whoosh' || key === 'camera') {
            this.synthWhoosh(vol);
            return;
        }
        if (key === 'step') {
            this.synthFootstep(vol);
            return;
        }
        if (key === 'breath' || key === 'wind') {
            this.synthBreath(vol);
            return;
        }
        if (key === 'suction') {
            this.synthSuckIn(vol);
            return;
        }
        if (key === 'door_creak') {
            this.synthDoorCreak(vol);
            return;
        }
        if (key === 'blinding_light') {
            this.synthBlindingLight(vol);
            return;
        }
        if (key === 'bh_hum') {
            this.synthBlackHoleHumLoop(vol);
            return;
        }
        if (key === 'tunnel_glitch') {
            this.synthTunnelGlitch(vol);
            return;
        }
        if (key === 'tunnel_wind') {
            this.synthTunnelWindLoop(vol);
            return;
        }
        if (key === 'tunnel_end') {
            this.synthTunnelEnd(vol);
            return;
        }
        if (key === 'arrival') {
            this.synthArrival(vol);
            return;
        }
        if (key === 'popup_chime') {
            this.synthPopupChime(vol);
            return;
        }
        if (key === 'scream_female') {
            this.synthScreamFemale(vol);
            return;
        }
        if (key === 'scream_male') {
            this.synthScreamMale(vol);
            return;
        }
        if (key === 'drone_wind') {
            this.synthDroneWhooshLoop(vol);
            return;
        }
        // HTML Audio sources (BGM)
        const a = this.sources.get(key);
        if (!a) return;
        a.loop = loop;
        if (!loop) a.currentTime = 0;
        a.volume = fadeMs > 0 ? 0 : vol;
        a.play().catch(()=>{});
        if (fadeMs > 0) {
            let v = 0;
            const step = vol / (fadeMs / 50);
            if (this.fadeIntervals.has(key)) clearInterval(this.fadeIntervals.get(key));
            const id = setInterval(()=>{
                v = Math.min(vol, v + step);
                a.volume = v;
                if (v >= vol) clearInterval(id);
            }, 50);
            this.fadeIntervals.set(key, id);
        }
    }
    playRandomBGM() {
        if (!this.active) this.init();
        if (this.currentBgmIdx >= 0) this.stop("bgm_".concat(this.currentBgmIdx), 1000);
        let nextIdx = Math.floor(Math.random() * this.bgmCount);
        if (this.bgmCount > 1 && nextIdx === this.currentBgmIdx) {
            nextIdx = (nextIdx + 1) % this.bgmCount;
        }
        this.currentBgmIdx = nextIdx;
        this.play("bgm_".concat(this.currentBgmIdx), 0.25, false, 2000);
    }
    playNextBGM() {
        if (!this.active) this.init();
        if (this.currentBgmIdx >= 0) this.stop("bgm_".concat(this.currentBgmIdx), 1000);
        this.currentBgmIdx = (this.currentBgmIdx + 1) % this.bgmCount;
        this.play("bgm_".concat(this.currentBgmIdx), 0.25, false, 2000);
    }
    playPrevBGM() {
        if (!this.active) this.init();
        if (this.currentBgmIdx >= 0) this.stop("bgm_".concat(this.currentBgmIdx), 1000);
        this.currentBgmIdx = (this.currentBgmIdx - 1 + this.bgmCount) % this.bgmCount;
        this.play("bgm_".concat(this.currentBgmIdx), 0.25, false, 2000);
    }
    stop(key) {
        let fadeMs = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
        // Synth loops
        if (key === 'bh_hum') {
            this.stopLoop('bhHum', fadeMs);
            return;
        }
        if (key === 'tunnel_wind') {
            this.stopLoop('tunnelWind', fadeMs);
            return;
        }
        if (key === 'drone_wind') {
            this.stopLoop('droneWind', fadeMs);
            return;
        }
        const a = this.sources.get(key);
        if (!a) return;
        if (this.fadeIntervals.has(key)) {
            clearInterval(this.fadeIntervals.get(key));
            this.fadeIntervals.delete(key);
        }
        if (fadeMs > 0 && a.volume > 0) {
            const step = a.volume / (fadeMs / 50);
            const id = setInterval(()=>{
                a.volume = Math.max(0, a.volume - step);
                if (a.volume <= 0.01) {
                    a.volume = 0;
                    a.pause();
                    clearInterval(id);
                    this.fadeIntervals.delete(key);
                }
            }, 50);
            this.fadeIntervals.set(key, id);
        } else {
            a.volume = 0;
            a.pause();
        }
    }
    dimBGM() {
        let targetVol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.05, fadeMs = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 500;
        if (this.currentBgmIdx < 0) return;
        const key = "bgm_".concat(this.currentBgmIdx);
        const a = this.sources.get(key);
        if (!a) return;
        if (this.fadeIntervals.has(key)) clearInterval(this.fadeIntervals.get(key));
        const startVol = a.volume;
        if (startVol <= targetVol) return;
        const step = (startVol - targetVol) / (fadeMs / 50);
        const id = setInterval(()=>{
            a.volume = Math.max(targetVol, a.volume - step);
            if (a.volume <= targetVol + 0.01) {
                a.volume = targetVol;
                clearInterval(id);
                this.fadeIntervals.delete(key);
            }
        }, 50);
        this.fadeIntervals.set(key, id);
    }
    restoreBGM() {
        let targetVol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0.25, fadeMs = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 500;
        if (this.currentBgmIdx < 0) return;
        const key = "bgm_".concat(this.currentBgmIdx);
        const a = this.sources.get(key);
        if (!a) return;
        if (this.fadeIntervals.has(key)) clearInterval(this.fadeIntervals.get(key));
        const startVol = a.volume;
        if (startVol >= targetVol) return;
        const step = (targetVol - startVol) / (fadeMs / 50);
        const id = setInterval(()=>{
            a.volume = Math.min(targetVol, a.volume + step);
            if (a.volume >= targetVol - 0.01) {
                a.volume = targetVol;
                clearInterval(id);
                this.fadeIntervals.delete(key);
            }
        }, 50);
        this.fadeIntervals.set(key, id);
    }
    pauseBGM() {
        if (this.currentBgmIdx < 0) return;
        const key = "bgm_".concat(this.currentBgmIdx);
        const a = this.sources.get(key);
        if (a) {
            if (this.fadeIntervals.has(key)) clearInterval(this.fadeIntervals.get(key));
            a.pause();
        }
    }
    resumeBGM() {
        if (this.currentBgmIdx < 0) return;
        const key = "bgm_".concat(this.currentBgmIdx);
        const a = this.sources.get(key);
        if (a) {
            a.play().catch((e)=>console.error("BGM Resume Error", e));
        }
    }
    stopAll() {
        let fadeMs = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 500;
        this.sources.forEach((_, key)=>this.stop(key, fadeMs));
        this.stopLoop('bhHum', fadeMs);
        this.stopLoop('tunnelWind', fadeMs);
        this.stopLoop('droneWind', fadeMs);
        this.currentBgmIdx = -1; // Reset BGM index so it doesn't resume
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "ctx", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "sources", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "active", false);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "currentBgmIdx", -1);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "bgmCount", 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "loopNodes", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "fadeIntervals", new Map());
    }
}
const sfx = new AudioMatrix();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/adManager.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_ADS_CONFIG",
    ()=>DEFAULT_ADS_CONFIG,
    "adManager",
    ()=>adManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
"use client";
;
const DEFAULT_ADS_CONFIG = {
    enabled: true,
    domainId: '6041728',
    // Anti-Adblock links & scripts from user Adsterra account
    smartlinkUrl: 'https://divinglibrary.com/xp6sjxn0?key=3733a0e6bbae7d93e3f83caaab956f86',
    adScriptUrl: 'https://divinglibrary.com/70/10/05/70100569fb256cc9e16e5631a53f9905.js',
    popunderScriptUrl: 'https://divinglibrary.com/70/10/05/70100569fb256cc9e16e5631a53f9905.js',
    socialBarScriptUrl: 'https://divinglibrary.com/c3/9b/d7/c39bd7bee74d0bb41da0c29f683939d8.js',
    nativeBannerScriptUrl: 'https://divinglibrary.com/d0b85e11abfe70f8bf477f8ec122a128/invoke.js',
    popunderUnitId: '70100569fb256cc9e16e5631a53f9905',
    nativeBannerUnitId: 'd0b85e11abfe70f8bf477f8ec122a128',
    socialBarUnitId: 'c39bd7bee74d0bb41da0c29f683939d8',
    smartlinkUnitId: '3733a0e6bbae7d93e3f83caaab956f86',
    // Smartlink frequency & trigger settings
    smartlinkEnabled: true,
    smartlinkCooldownMinutes: 15,
    smartlinkOnDownload: true,
    smartlinkOnServerChange: false,
    // Episode-level ads: 2 per episode (1st play + middle part) + episode switch
    smartlinkOnFirstPlay: true,
    smartlinkOnMidRoll: true,
    midRollPercent: 50,
    smartlinkOnEpisodeClick: true,
    episodeSwitchCooldownSeconds: 30,
    // Social Bar (In-page push notification)
    socialBarEnabled: false,
    socialBarDelaySeconds: 3,
    // Popunder (strictly capped if enabled)
    popunderEnabled: false,
    popunderCooldownHours: 12,
    // Native Banners
    nativeBannerEnabled: true,
    showOnWatchPage: true,
    showOnDownloadPage: true,
    showOnOtakuVerse: false,
    // Protection
    antiAdblockEnabled: true,
    vipExempt: true
};
const STORAGE_KEY = 'shadow_ads_config';
const LAST_SMARTLINK_TRIGGER_KEY = 'shadow_last_smartlink_trigger';
const LAST_POPUNDER_TRIGGER_KEY = 'shadow_last_popunder_trigger';
const LAST_EP_SWITCH_TRIGGER_KEY = 'shadow_last_ep_switch_trigger';
const adManager = {
    /**
   * Retrieves active ads configuration (localStorage -> defaults)
   */ getConfig () {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
                return {
                    ...DEFAULT_ADS_CONFIG,
                    ...JSON.parse(cached)
                };
            }
        } catch (e) {
            console.warn('Failed to parse ads config from localStorage:', e);
        }
        return DEFAULT_ADS_CONFIG;
    },
    /**
   * Fetches latest config from Supabase site_config (if available)
   */ async syncFromDatabase () {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('site_config').select('value').eq('key', 'ads_config').maybeSingle();
            if ((data === null || data === void 0 ? void 0 : data.value) && !error) {
                const parsed = JSON.parse(data.value);
                const merged = {
                    ...DEFAULT_ADS_CONFIG,
                    ...parsed
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                window.dispatchEvent(new CustomEvent('shadow-ads-config-changed', {
                    detail: merged
                }));
                return merged;
            }
        } catch (e) {
        // Fallback silently
        }
        return this.getConfig();
    },
    /**
   * Saves new configuration to both Supabase and localStorage
   */ async saveConfig (newConfig) {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const current = this.getConfig();
        const merged = {
            ...current,
            ...newConfig
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            window.dispatchEvent(new CustomEvent('shadow-ads-config-changed', {
                detail: merged
            }));
            // Persist to Supabase site_config
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('site_config').upsert({
                key: 'ads_config',
                value: JSON.stringify(merged),
                updated_at: new Date().toISOString()
            });
            return true;
        } catch (e) {
            console.error('Failed to save ads config:', e);
            return false;
        }
    },
    /**
   * Checks if current user is exempt from ads
   */ isExempt () {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const config = this.getConfig();
        if (!config.enabled) return true;
        if (config.vipExempt) {
            if (localStorage.getItem('sg_ad_free') === 'true') return true;
            try {
                const userProfile = localStorage.getItem('shadow_user_profile');
                if (userProfile) {
                    const p = JSON.parse(userProfile);
                    if ((p === null || p === void 0 ? void 0 : p.role) === 'admin' || (p === null || p === void 0 ? void 0 : p.role) === 'moderator' || (p === null || p === void 0 ? void 0 : p.is_vip) || (p === null || p === void 0 ? void 0 : p.is_donator)) {
                        return true;
                    }
                }
            } catch (e) {}
        }
        return false;
    },
    /**
   * Helper to open ad URL in a background tab and retain focus on Shadow Garden
   */ openDirectLink (customUrl) {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const config = this.getConfig();
        const url = customUrl || config.smartlinkUrl || DEFAULT_ADS_CONFIG.smartlinkUrl;
        try {
            const win = window.open(url, '_blank', 'noopener,noreferrer');
            if (win) {
                win.blur();
                window.focus();
                return true;
            }
        } catch (e) {
            console.warn('Direct link open blocked:', e);
        }
        return false;
    },
    /**
   * Triggers the Anti-Adblock Smartlink in a background tab if cooldown has passed.
   * Keeps current tab completely focused on Shadow Garden.
   */ triggerSmartlink () {
        let source = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 'general';
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const config = this.getConfig();
        if (!config.enabled || !config.smartlinkEnabled) return false;
        if (this.isExempt()) return false;
        const now = Date.now();
        const lastTrigger = localStorage.getItem(LAST_SMARTLINK_TRIGGER_KEY);
        const cooldownMs = (config.smartlinkCooldownMinutes || 15) * 60 * 1000;
        if (lastTrigger && now - parseInt(lastTrigger, 10) < cooldownMs) {
            return false; // Still on cooldown
        }
        localStorage.setItem(LAST_SMARTLINK_TRIGGER_KEY, now.toString());
        return this.openDirectLink();
    },
    /**
   * 1st Episode Ad: Fires on the very first play action of an episode.
   * Capped to exactly once per episode per session.
   */ triggerFirstPlay () {
        let episodeId = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 'current';
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const config = this.getConfig();
        if (!config.enabled || !config.smartlinkEnabled || !config.smartlinkOnFirstPlay) return false;
        if (this.isExempt()) return false;
        const sessionKey = "sg_first_play_ad_".concat(episodeId);
        try {
            if (sessionStorage.getItem(sessionKey)) {
                return false; // Already triggered for this episode in this browser session
            }
            sessionStorage.setItem(sessionKey, 'true');
            return this.openDirectLink();
        } catch (e) {
            return false;
        }
    },
    /**
   * Checks whether mid-roll ad was already shown for this episode.
   */ hasShownMidRoll () {
        let episodeId = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 'current';
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            return sessionStorage.getItem("sg_mid_roll_ad_".concat(episodeId)) === 'true';
        } catch (e) {
            return false;
        }
    },
    /**
   * 2nd Episode Ad: Fires after the middle part (~50% of the episode duration).
   * Capped to exactly once per episode per session.
   */ triggerMidRoll () {
        let episodeId = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 'current';
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const config = this.getConfig();
        if (!config.enabled || !config.smartlinkEnabled || !config.smartlinkOnMidRoll) return false;
        if (this.isExempt()) return false;
        const sessionKey = "sg_mid_roll_ad_".concat(episodeId);
        try {
            if (sessionStorage.getItem(sessionKey)) {
                return false;
            }
            sessionStorage.setItem(sessionKey, 'true');
            return this.openDirectLink();
        } catch (e) {
            return false;
        }
    },
    /**
   * Episode Switch Ad: Fires when the user clicks an episode tile to switch episodes/anime.
   * Debounced by episodeSwitchCooldownSeconds (default: 30s) to prevent browser popup throttling.
   */ triggerEpisodeSwitch () {
        let episodeId = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 'next';
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const config = this.getConfig();
        if (!config.enabled || !config.smartlinkEnabled || !config.smartlinkOnEpisodeClick) return false;
        if (this.isExempt()) return false;
        const now = Date.now();
        const lastTrigger = localStorage.getItem(LAST_EP_SWITCH_TRIGGER_KEY);
        const cooldownMs = (config.episodeSwitchCooldownSeconds || 30) * 1000;
        if (lastTrigger && now - parseInt(lastTrigger, 10) < cooldownMs) {
            return false; // Debounced
        }
        localStorage.setItem(LAST_EP_SWITCH_TRIGGER_KEY, now.toString());
        return this.openDirectLink();
    },
    /**
   * Reset cooldowns for immediate testing in admin panel
   */ resetCooldowns () {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        localStorage.removeItem(LAST_SMARTLINK_TRIGGER_KEY);
        localStorage.removeItem(LAST_POPUNDER_TRIGGER_KEY);
        localStorage.removeItem(LAST_EP_SWITCH_TRIGGER_KEY);
        try {
            // Clear session ad flags
            Object.keys(sessionStorage).forEach((k)=>{
                if (k.startsWith('sg_first_play_ad_') || k.startsWith('sg_mid_roll_ad_')) {
                    sessionStorage.removeItem(k);
                }
            });
        } catch (e) {}
    },
    /**
   * Get remaining cooldown time in seconds
   */ getRemainingCooldown () {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const config = this.getConfig();
        const lastTrigger = localStorage.getItem(LAST_SMARTLINK_TRIGGER_KEY);
        if (!lastTrigger) return 0;
        const cooldownMs = (config.smartlinkCooldownMinutes || 15) * 60 * 1000;
        const elapsed = Date.now() - parseInt(lastTrigger, 10);
        const remaining = Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000));
        return remaining;
    }
};
if ("TURBOPACK compile-time truthy", 1) {
    window.adManager = adManager;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_lib_b25f5859._.js.map