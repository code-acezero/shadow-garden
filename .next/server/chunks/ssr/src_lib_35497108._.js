module.exports = [
"[project]/src/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "formatAnimeTitle",
    ()=>formatAnimeTitle,
    "getAnimeWatchUrl",
    ()=>getAnimeWatchUrl,
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
    ()=>sanitizeContinueWatchingEntry,
    "slugifyTitle",
    ()=>slugifyTitle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$2$2e$6$2e$1$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/tailwind-merge@2.6.1/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
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
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$2$2e$6$2e$1$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
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
function slugifyTitle(title) {
    if (!title || typeof title !== 'string') return '';
    return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
function getAnimeWatchUrl(id, title, episodeIdOrNum, audio) {
    const rawId = String(id || '').trim();
    const slug = slugifyTitle(title);
    const routeId = !rawId.includes('-') && slug ? `${rawId}-${slug}` : rawId;
    const queryParts = [];
    if (episodeIdOrNum !== undefined && episodeIdOrNum !== null && episodeIdOrNum !== '') {
        const epStr = String(episodeIdOrNum);
        queryParts.push(`ep=${encodeURIComponent(epStr.replace(/^\/?watch\//, ''))}`);
    }
    if (audio) {
        queryParts.push(`audio=${encodeURIComponent(audio)}`);
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return `/watch/${routeId}${queryString}`;
}
function getWatchRoute(animeId, episodeId, type, title) {
    const t = (type || '').toLowerCase();
    const epQuery = episodeId ? `?ep=${encodeURIComponent(episodeId)}` : '';
    const slug = slugifyTitle(title);
    const routeId = !animeId.includes('-') && slug ? `${animeId}-${slug}` : animeId;
    if (t === 'hindi' || t === 'hindi-anime') {
        return `/watch/${routeId}${episodeId ? `?ep=${encodeURIComponent(episodeId)}&audio=hi` : '?audio=hi'}`;
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
    return `/watch/${routeId}${epQuery}`;
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
"[project]/src/lib/supabase.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSupabaseBrowserClient",
    ()=>getSupabaseBrowserClient,
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$110$2e$8$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@supabase+supabase-js@2.110.8/node_modules/@supabase/supabase-js/dist/index.mjs [app-ssr] (ecmascript) <locals>");
;
// Singleton instance container
let supabaseInstance = null;
const getSupabaseBrowserClient = ()=>{
    if (!supabaseInstance) {
        const url = ("TURBOPACK compile-time value", "https://kacgsuabfdqcskjonzkl.supabase.co") || '';
        const key = ("TURBOPACK compile-time value", "sb_publishable_UOBkqQdOw4XFiO2CMmrmyw_kALwbMGw") || '';
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        supabaseInstance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$110$2e$8$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(url, key);
    }
    return supabaseInstance;
};
const supabase = getSupabaseBrowserClient();
}),
"[project]/src/lib/toast.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toast",
    ()=>toast
]);
const dispatchWhisper = (title, message, type = 'system')=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
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
}),
"[project]/src/lib/voice.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-ssr] (ecmascript)");
;
// --- WHISPER HELPER ---
const notifyIsland = (title, message)=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
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
    if ("TURBOPACK compile-time truthy", 1) return {
        pack: 'Alpha',
        language: 'en',
        enabled: true
    };
    //TURBOPACK unreachable
    ;
};
// --- DYNAMIC CACHE ---
// Stores voice data fetched from Supabase to avoid repeated calls
let dynamicVoiceCache = [];
const refreshVoiceCache = async ()=>{
    try {
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('voice_packs').select('*');
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
            fileUrl = `/audio/${packName}${suffix}_${action}.mp3`;
        } else {
            // Standard dynamic structure
            fileUrl = `/voices/${settings.language}/${packName}-${action}.mp3`;
        }
    }
    // 3. Play
    if (fileUrl) {
        console.log(`🔊 [ShadowVoice] Playing: ${fileUrl}`);
        const audio = new Audio(fileUrl);
        // Default to 1.0 if not set, or use settings.volume
        audio.volume = settings.volume !== undefined ? settings.volume : 1.0;
        audio.play().catch((e)=>console.warn("Autoplay blocked/missing:", e));
    }
};
const syncVoiceProfile = async (userId)=>{
    const localSettings = getVoiceSettings();
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update({
            voice_pack: localSettings.pack
        }).eq('id', userId);
    }
};
const loadVoiceProfile = async (userId)=>{
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) return;
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('voice_pack').eq('id', userId).single();
    if (data && data.voice_pack) {
        const current = getVoiceSettings();
        const newSettings = {
            ...current,
            pack: data.voice_pack
        };
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }
    // Refresh cache on load to ensure we have the latest DB links
    refreshVoiceCache();
};
}),
"[project]/src/lib/hpi.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
            const { getBlakiteHome, getBlakiteLatest, searchBlakite, filterBlakite, getBlakiteDetail, getBlakiteStreamUrl } = await __turbopack_context__.A("[project]/src/lib/blakite.ts [app-ssr] (ecmascript, async loader)");
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
"[project]/src/lib/extractors/streamExtractor.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
        const { checkHindiDub, getBlakiteDetail, getBlakiteStreamUrl, extractSeasonInfo, findEpisodeInBlakite } = await __turbopack_context__.A("[project]/src/lib/blakite.ts [app-ssr] (ecmascript, async loader)");
        const epNum = Number(episode);
        if (isNaN(epNum) || epNum <= 0) return null;
        // 1. Direct high-precision season & episode aware Hindi Dub check
        const checkResult = await checkHindiDub(title, epNum);
        if (!checkResult?.available || !checkResult.id || !checkResult.episodeAvailable) {
            // If Season is not in Hindi DB, or this specific episode is not dubbed, return null immediately.
            // NEVER fall back to Episode 1 or another season!
            return null;
        }
        let targetSlug = checkResult.matchedEpisode?.id || null;
        if (!targetSlug) {
            const detailData = await getBlakiteDetail(checkResult.id);
            if (!detailData || !detailData.episodes?.length) return null;
            const qInfo = extractSeasonInfo(title);
            const epObj = findEpisodeInBlakite(detailData.episodes, qInfo.season, epNum, qInfo.isSeasonExplicit);
            if (!epObj) return null;
            targetSlug = epObj.id;
        }
        if (!targetSlug) return null;
        const watchData = await getBlakiteStreamUrl(targetSlug);
        if (!watchData || !watchData.url) return null;
        const isM3U8 = watchData.isM3U8 === true || watchData.url.includes('.m3u8');
        return [
            {
                serverId: 'rumble-cdn',
                serverName: 'Rumble Cloud',
                url: watchData.url,
                type: isM3U8 ? 'm3u8' : 'mp4',
                referer: 'https://blakiteapi.xyz/'
            }
        ];
    } catch (err) {
        console.error('[Blakite Extractor Error]', err);
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
"[project]/src/lib/anilist.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
    const isAdult = !!media.isAdult;
    const genres = media.genres || [];
    const isEcchi = genres.some((g)=>typeof g === 'string' && (g.toLowerCase() === 'ecchi' || g.toLowerCase() === 'erotica'));
    const ageRating = isAdult ? '18+' : isEcchi ? 'R-17' : 'PG-13';
    const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : undefined;
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
        isAdult: isAdult,
        rating: ageRating,
        ageRating: ageRating,
        score: score
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
        const [spotlight, recent, trending, topAiring, upcoming] = await Promise.all([
            this.getSpotlight().catch(()=>[]),
            this.getRecentEpisodes(1, 24).catch(()=>[]),
            this.getMostPopular(1, 16).catch(()=>[]),
            this.getTopAiring(1, 16).catch(()=>[]),
            this.getTopUpcoming(1, 16).catch(()=>[])
        ]);
        return {
            spotlight,
            recent,
            trending,
            topAiring,
            upcoming
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
   * 8b. TOP FEATURE FILMS & MOVIES
   */ static async getMovies(page = 1, perPage = 24) {
        const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            format: MOVIE, 
            sort: [POPULARITY_DESC, SCORE_DESC], 
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
   * 8c. CHINESE DONGHUA
   */ static async getDonghua(page = 1, perPage = 24) {
        const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            countryOfOrigin: "CN", 
            sort: [TRENDING_DESC, POPULARITY_DESC]
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
        return (data?.Page?.media || []).map((m)=>{
            const card = mapMediaToCard(m);
            card.isDonghua = true;
            card.targetRoute = `/donghua-watch/${m.id}`;
            return card;
        });
    }
    /**
   * 8d. ENGLISH DUBBED RECENT ANIME
   */ static async getEnglishDubbed(page = 1, perPage = 24) {
        const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            countryOfOrigin: "JP", 
            sort: [TRENDING_DESC, POPULARITY_DESC],
            status_in: [RELEASING, FINISHED]
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
        return (data?.Page?.media || []).map((m)=>{
            const card = mapMediaToCard(m);
            const epNum = card.episodes?.sub || m.episodes || 1;
            card.isDub = true;
            card.targetRoute = `/watch/${m.id}?ep=${epNum}&type=dub`;
            return card;
        });
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
        const raw = (idOrSlug || '').trim();
        const leadingIdMatch = raw.match(/^(\d+)(?:-.*)?$/);
        const trailingIdMatch = raw.match(/^(?:.*-)?(\d+)$/);
        const numericId = leadingIdMatch ? leadingIdMatch[1] : trailingIdMatch ? trailingIdMatch[1] : null;
        const isNumeric = !!numericId;
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
          studios {
            edges {
              isMain
              node {
                id
                name
              }
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
                  native
                }
                coverImage {
                  large
                  medium
                }
                bannerImage
                format
                type
                status
                episodes
                seasonYear
                startDate {
                  year
                }
                averageScore
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
        if (isNumeric && numericId) {
            variables.id = parseInt(numericId, 10);
        } else {
            variables.search = raw.replace(/-/g, ' ');
        }
        let data = await queryAniList(query, variables);
        let media = data?.Media;
        if (!media && isNumeric) {
            const textSlug = raw.replace(/^(\d+)-?/, '').replace(/-?(\d+)$/, '').replace(/-/g, ' ').trim();
            if (textSlug && textSlug.length > 2) {
                const fallbackQuery = `
          query ($search: String) {
            Media(search: $search, type: ANIME) {
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
              studios {
                edges {
                  isMain
                  node {
                    id
                    name
                  }
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
                      native
                    }
                    coverImage {
                      large
                      medium
                    }
                    bannerImage
                    format
                    type
                    status
                    episodes
                    seasonYear
                    startDate {
                      year
                    }
                    averageScore
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
                const fbData = await queryAniList(fallbackQuery, {
                    search: textSlug
                });
                media = fbData?.Media;
            }
        }
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
                    const yr = rNode.seasonYear || rNode.startDate?.year || '';
                    related.push({
                        id: String(rNode.id),
                        title: rNode.title?.english || rNode.title?.romaji || rNode.title?.native || 'Unknown',
                        jname: rNode.title?.native || rNode.title?.romaji || '',
                        poster: rNode.coverImage?.large || rNode.coverImage?.medium || '',
                        banner: rNode.bannerImage || '',
                        type: rNode.format || 'ANIME',
                        relationType: edge.relationType || 'RELATION',
                        status: rNode.status || '',
                        year: yr,
                        seasonYear: rNode.seasonYear || (rNode.startDate?.year ? Number(rNode.startDate.year) : undefined),
                        episodesCount: rNode.episodes || undefined,
                        score: rNode.averageScore ? (rNode.averageScore / 10).toFixed(1) : undefined
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
        const isAdult = !!media.isAdult;
        const genres = media.genres || [];
        const isEcchi = genres.some((g)=>typeof g === 'string' && (g.toLowerCase() === 'ecchi' || g.toLowerCase() === 'erotica' || g.toLowerCase() === 'hentai'));
        const ageRating = isAdult ? '18+' : isEcchi ? 'R-17' : 'PG-13';
        // Split animation studios (isMain: true) from producers/production committee (isMain: false)
        const studioEdges = Array.isArray(media.studios?.edges) ? media.studios.edges : [];
        const mainStudios = studioEdges.filter((e)=>e.isMain && e.node?.name).map((e)=>e.node.name);
        const producerNames = studioEdges.filter((e)=>!e.isMain && e.node?.name).map((e)=>e.node.name);
        const finalStudios = mainStudios.length > 0 ? mainStudios : studioEdges[0]?.node?.name ? [
            studioEdges[0].node.name
        ] : [];
        const nextEpObj = media.nextAiringEpisode ? {
            airingAt: media.nextAiringEpisode.airingAt,
            timeUntilAiring: media.nextAiringEpisode.timeUntilAiring,
            episode: media.nextAiringEpisode.episode,
            airingISOTimestamp: new Date(media.nextAiringEpisode.airingAt * 1000).toISOString()
        } : null;
        return {
            id: slug,
            title: cleanTitle,
            jname: cleanJname,
            poster: cleanPoster,
            banner: cleanBanner,
            description: cleanDesc,
            isAdult: isAdult,
            malId: media.idMal || undefined,
            countryOfOrigin: media.countryOfOrigin || 'JP',
            nextAiringEpisode: nextEpObj,
            stats: {
                rating: ageRating,
                quality: 'HD',
                duration: media.duration ? `${media.duration}m` : '24m',
                type: media.format || 'TV',
                malScore: media.averageScore ? (media.averageScore / 10).toFixed(1) : '?',
                episodes: {
                    sub: releasedCount,
                    dub: releasedCount
                }
            },
            info: {
                status: media.status || 'Finished',
                genres: media.genres || [],
                studios: finalStudios,
                producers: producerNames,
                aired: media.startDate?.year ? `${media.startDate.year}` : '?',
                premiered: media.season && media.seasonYear ? `${media.season} ${media.seasonYear}` : '?',
                japanese: cleanJname,
                synonyms: (media.synonyms || []).join(', '),
                nextAiringEpisode: nextEpObj
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
   * 14b. AIRING TODAY (Full media cards for home section with pagination)
   */ static async getAiringToday(page = 1, perPage = 24, releasedOnly = true) {
        try {
            const now = new Date();
            const startOfDay = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime() / 1000);
            const nowSec = Math.floor(now.getTime() / 1000);
            const endOfDay = startOfDay + 86400;
            const upperLimit = releasedOnly ? nowSec : endOfDay;
            const sortOrder = releasedOnly ? 'TIME_DESC' : 'TIME';
            const query = `
        query ($start: Int, $end: Int, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              currentPage
              hasNextPage
              lastPage
            }
            airingSchedules(
              airingAt_greater: $start, 
              airingAt_lesser: $end, 
              sort: ${sortOrder}
            ) {
              id
              airingAt
              episode
              timeUntilAiring
              media {
                ${MEDIA_CARD_FIELDS}
              }
            }
          }
        }
      `;
            const data = await queryAniList(query, {
                start: startOfDay,
                end: upperLimit,
                page,
                perPage
            });
            const pInfo = data?.Page?.pageInfo;
            const schedules = data?.Page?.airingSchedules || [];
            const items = schedules.map((item)=>{
                const card = mapMediaToCard(item.media, item.episode);
                card.airingAt = item.airingAt;
                card.timeUntilAiring = item.timeUntilAiring;
                card.airingTimeStr = new Date(item.airingAt * 1000).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                card.episode = item.episode;
                card.targetRoute = `/watch/${item.media?.id}?ep=${item.episode}`;
                return card;
            });
            return {
                items,
                pageInfo: {
                    currentPage: pInfo?.currentPage || page,
                    hasNextPage: !!pInfo?.hasNextPage,
                    totalPages: pInfo?.lastPage || (pInfo?.hasNextPage ? page + 1 : page)
                }
            };
        } catch (err) {
            console.error("[AniList.getAiringToday] Error:", err);
            return {
                items: [],
                pageInfo: {
                    currentPage: 1,
                    hasNextPage: false,
                    totalPages: 1
                }
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
"[project]/src/lib/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$extractors$2f$streamExtractor$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/extractors/streamExtractor.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/anilist.ts [app-ssr] (ecmascript)");
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
            banner: data?.banner || data?.bannerImage || data?.cover || data?.image || '',
            description: data?.synopsis || '',
            isAdult: isAdult,
            malId: detectedMalId,
            countryOfOrigin: country,
            stats: {
                rating: data?.rating && !data.rating.includes('/10') && !/^\d+(\.\d+)?$/.test(data.rating.trim()) ? data.rating : isAdult ? '18+' : 'PG-13',
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
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getHomeSections() {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getHomeSections();
    }
    static async getTopTen() {
        const [today, week, month] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getTopAiring(1, 10).catch(()=>[]),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(1, 10).catch(()=>[]),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getMostFavorite(1, 10).catch(()=>[])
        ]);
        return {
            today,
            week,
            month
        };
    }
    static async getTopSearch() {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(1, 10);
    }
    static async getRandomAnime() {
        const popular = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(Math.floor(Math.random() * 3) + 1, 24);
        if (popular && popular.length > 0) {
            return popular[Math.floor(Math.random() * popular.length)];
        }
        return null;
    }
    static async getTopUpcoming(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getTopUpcoming(page, 24);
    }
    static async getRecentlyUpdated(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getRecentlyAdded(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getCompleted(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getCompleted(page, 24);
    }
    static async getMostFavorite(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getMostFavorite(page, 24);
    }
    static async getAiringToday(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getAiringToday(page, 24);
    }
    static async getMostPopular(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
    }
    static async getTopAiring(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getTopAiring(page, 24);
    }
    static async getSubbedAnime(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
    }
    static async getDubbedAnime(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getEnglishDubbed(page, 24);
    }
    static async getMovies(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getMovies(page, 24);
    }
    static async getDonghua(page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getDonghua(page, 24);
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
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
                break;
            case 'new-release':
            case 'added':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getRecentEpisodes(page, 24);
                break;
            case 'most-viewed':
            case 'popular':
            case 'trending':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
                break;
            case 'upcoming':
            case 'not-yet-aired':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getTopUpcoming(page, 24);
                break;
            case 'ongoing':
            case 'currently-airing':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getTopAiring(page, 24);
                break;
            case 'completed':
            case 'finished-airing':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getCompleted(page, 24);
                break;
            case 'az-list':
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
                break;
            default:
                results = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
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
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getByGenre(genre, page, 24);
    }
    static async getByType(_type, page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getMostPopular(page, 24);
    }
    static async search(query, page = 1) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].search(query, page, 24);
    }
    static async getSearchSuggestions(query) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getSearchSuggestions(query);
    }
    static async filter(params) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].filter(params);
    }
    static async getAnimeInfo(slugOrId) {
        let info = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getAnimeInfo(slugOrId).catch(()=>null);
        if (info) return info;
        // Fallback: Check if slugOrId is a Blakite Hindi entry or numeric Blakite ID
        try {
            const rawId = (slugOrId || '').trim();
            const cleanId = rawId.match(/^(\d+)/)?.[1] || rawId;
            let blakiteDetail = null;
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            else {
                const { getBlakiteDetail } = await __turbopack_context__.A("[project]/src/lib/blakite.ts [app-ssr] (ecmascript, async loader)");
                blakiteDetail = await getBlakiteDetail(cleanId).catch(()=>null);
            }
            if (blakiteDetail) {
                const cleanTitle = (blakiteDetail.title || '').replace(/\(Hindi Dubbed\)/i, '').replace(/\(Hindi Dub\)/i, '').replace(/\[Hindi Dub\]/i, '').replace(/Season \d+/i, '').trim();
                let anilistMatch = null;
                if (cleanTitle) {
                    anilistMatch = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getAnimeInfo(cleanTitle).catch(()=>null);
                }
                if (anilistMatch) {
                    anilistMatch.hindiDub = {
                        available: true,
                        dubType: blakiteDetail.language === 'ORG' ? 'Hindi Official Dub' : 'Hindi Dub',
                        blakiteId: blakiteDetail.id,
                        totalEpisodes: blakiteDetail.episodes?.length || 1,
                        score: blakiteDetail.score
                    };
                    return anilistMatch;
                }
                const eps = Array.isArray(blakiteDetail.episodes) ? blakiteDetail.episodes.map((e, idx)=>({
                        id: e.id || `${blakiteDetail.id}::${e.number || idx + 1}`,
                        number: parseInt(e.number, 10) || idx + 1,
                        title: e.title || `Episode ${e.number || idx + 1}`,
                        isFiller: false,
                        isDub: true,
                        isSub: true,
                        hasDub: true,
                        hasSub: true
                    })) : [];
                const uAnime = {
                    id: String(blakiteDetail.id),
                    title: cleanTitle || blakiteDetail.title,
                    jname: blakiteDetail.titleJp || blakiteDetail.title,
                    poster: blakiteDetail.image || '/images/no-poster.png',
                    banner: blakiteDetail.banner || blakiteDetail.image || '',
                    description: blakiteDetail.synopsis || '',
                    isAdult: false,
                    stats: {
                        rating: blakiteDetail.rating || 'PG-13',
                        quality: 'HD',
                        duration: '24m',
                        type: blakiteDetail.type || 'TV',
                        malScore: String(blakiteDetail.score || '8.0'),
                        episodes: {
                            sub: eps.length,
                            dub: eps.length
                        }
                    },
                    info: {
                        status: blakiteDetail.status || 'Completed',
                        genres: blakiteDetail.genres || [
                            'Action',
                            'Animation'
                        ],
                        studios: blakiteDetail.studios || [],
                        producers: blakiteDetail.producers || [],
                        aired: blakiteDetail.aired || '?',
                        premiered: blakiteDetail.premiered || '?',
                        japanese: blakiteDetail.nativeTitle || '',
                        synonyms: blakiteDetail.englishTitle || ''
                    },
                    episodes: eps,
                    characters: [],
                    recommendations: [],
                    related: [],
                    seasons: [],
                    trailers: []
                };
                uAnime.hindiDub = {
                    available: true,
                    dubType: blakiteDetail.language === 'ORG' ? 'Hindi Official Dub' : 'Hindi Dub',
                    blakiteId: blakiteDetail.id,
                    totalEpisodes: eps.length,
                    score: blakiteDetail.score
                };
                return uAnime;
            }
        } catch (e) {
            console.warn("[AnimeService] Blakite fallback failed:", e);
        }
        return null;
    }
    static async getEpisodes(slugOrId) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getEpisodes(slugOrId);
    }
    static async getCharacters(slugOrId) {
        const info = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getAnimeInfo(slugOrId);
        return info?.characters || [];
    }
    static async getSchedule(date, tzOffsetHours = 0) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getSchedule(date, tzOffsetHours);
    }
    static async getTooltip(id) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AniListService"].getTooltip(id);
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
                unified = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$extractors$2f$streamExtractor$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveUnifiedStreams"])({
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
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"] && userId !== 'guest') {
            const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('watchlist').select('*').eq('user_id', userId);
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
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"] && userId !== 'guest') {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('watchlist').upsert({
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
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) {
            const { data: { session } } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
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
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"] ? await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithPassword({
            email,
            password
        }) : {
            data: null,
            error: null
        };
    }
    static async signUp(email, password, username, avatarUrl, gender) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"] ? await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signUp({
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
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
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
"[project]/src/lib/moeApi.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/moeApi.ts
__turbopack_context__.s([
    "MoeAPI",
    ()=>MoeAPI
]);
class MoeAPI {
    static BASE_URL = "https://api.trace.moe";
    static API_KEY = process.env.NEXT_PUBLIC_TRACE_MOE_KEY || "";
    /**
   * Search for anime scenes by Image URL
   */ static async searchByUrl(imageUrl, options = {}) {
        const params = new URLSearchParams();
        params.append("url", imageUrl);
        if (options.cutBorders) params.append("cutBorders", "");
        if (options.anilistID) params.append("anilistID", options.anilistID.toString());
        if (options.anilistInfo) params.append("anilistInfo", "");
        const headers = {};
        if (this.API_KEY) headers["x-trace-key"] = this.API_KEY;
        try {
            const response = await fetch(`${this.BASE_URL}/search?${params.toString()}`, {
                method: "GET",
                headers: headers
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`MoeAPI Error ${response.status}: ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error("MoeAPI Search By URL Error:", error);
            throw error;
        }
    }
    /**
   * Search for anime scenes by uploading an image file (Blob/File)
   */ static async searchByImage(imageFile, options = {}) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const params = new URLSearchParams();
        if (options.cutBorders) params.append("cutBorders", "");
        if (options.anilistID) params.append("anilistID", options.anilistID.toString());
        if (options.anilistInfo) params.append("anilistInfo", "");
        const headers = {};
        if (this.API_KEY) headers["x-trace-key"] = this.API_KEY;
        try {
            const response = await fetch(`${this.BASE_URL}/search?${params.toString()}`, {
                method: "POST",
                body: formData,
                headers: headers
            });
            if (!response.ok) {
                if (response.status === 413) throw new Error("Image too large (Max 25MB)");
                const errorText = await response.text();
                throw new Error(`MoeAPI Error ${response.status}: ${errorText}`);
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
            const response = await fetch(`${this.BASE_URL}/me`, {
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
}),
"[project]/src/lib/alphaGreetings.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$UserTitleBadge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/UserTitleBadge.tsx [app-ssr] (ecmascript)");
;
;
const TRAVELLER_GREETINGS = {
    initial: [
        `[state: greet] Greetings, traveller. I am Alpha, First Shadow of Shadow Garden. You have stumbled into our domain—step carefully.`,
        `[state: greet] Welcome, wandering soul. The shadows whisper of your arrival. Seek out an official identity to join our garden.`,
        `[state: think] A traveller approaches... I am Alpha. What brings an unsworn wanderer to Shadow Garden?`,
        `[state: greet] [sticker: salute] Welcome to the threshold of Shadow Garden, traveller. Honor our code, and you may find wisdom here.`,
        `[state: greet] Greetings. You enter as a traveller, but destiny may make you an operative. Speak your query.`
    ],
    revisit: [
        `[state: greet] Back so soon, traveller? The shadows seem to draw you in. Have you decided to join our ranks?`,
        `[state: think] Ah, the wandering traveller returns today. What further intel do you seek from Alpha?`,
        `[state: greet] Welcome back, traveller. The garden gates remain open to you for now.`,
        `[state: greet] [sticker: smile] Returning twice in a day? You are becoming quite attached to Shadow Garden, wanderer.`,
        `[state: greet] Greetings once more, traveller. I am listening if you have questions about our realm.`
    ]
};
const ADVENTURER_GREETINGS = {
    initial: [
        `[state: greet] Greetings, Adventurer. I am Alpha. Your progress through our ranks has been noted. How may I assist your mission?`,
        `[state: bow] Welcome back to Shadow Garden, Adventurer. Every quest you complete brings us closer to total mastery.`,
        `[state: greet] [sticker: salute] Salutations, Adventurer! First Shadow Alpha stands ready to guide your journey. Speak your command.`,
        `[state: inspect] An active Adventurer enters the sanctum. Keep sharpening your abilities—Lord Shadow expects excellence.`,
        `[state: greet] Welcome, brave Adventurer. Shadow Garden honors your dedication. What directive shall we undertake?`
    ],
    revisit: [
        `[state: greet] Revisit noted, Adventurer. Returning so swiftly to the sanctum today demonstrates true commitment.`,
        `[state: greet] [sticker: smile] Back again today, Adventurer? Excellent. Let us review your next targets.`,
        `[state: bow] Welcome back, Adventurer. Alpha is always here when duty calls.`,
        `[state: greet] Seeking further guidance today, Adventurer? State your inquiry and I shall answer.`,
        `[state: inspect] Your shadow falls upon our hall once more today, Adventurer. What news do you bring?`
    ]
};
const SHADOW_LEADER_GREETINGS = {
    initial: [
        `[state: bow] [sticker: salute] Welcome back, Lord Shadow. I have been overseeing Shadow Garden's operations in your absence. What is your command?`,
        `[state: bow] Greetings, Lord Shadow. Every operative stands ready to execute your master plan. How may I serve you today?`,
        `[state: greet] Lord Shadow... your presence elevates the realm. All intelligence feeds are synced and awaiting your direction.`,
        `[state: bow] [sticker: smile] Lord Shadow! I have prepared full status reports on the Cult's movements. Order me as you see fit.`,
        `[state: greet] Welcome, Lord Shadow. Shadow Garden moves according to your unspoken wisdom. What shall be our next directive?`
    ],
    revisit: [
        `[state: bow] Returning so soon, Lord Shadow? Your constant vigilance inspires us all. I am listening.`,
        `[state: greet] [sticker: smile] Ah, Lord Shadow. Have you devised a new strategy for the realm? Command me.`,
        `[state: greet] Lord Shadow! It honors me to see you again today. How may First Shadow assist you?`,
        `[state: bow] Back at my side, Lord Shadow? I am ever ready to carry out your vision.`,
        `[state: greet] Lord Shadow, your shadow never leaves my sight. What further orders do you bring?`
    ]
};
const BOARD_OF_DARKNESS_GREETINGS = {
    'Abyss Archon': {
        initial: [
            `[state: bow] Greetings, Abyss Archon. The deep currents of Shadow Garden obey your authority. What is your command?`,
            `[state: greet] [sticker: salute] Welcome, Abyss Archon. First Shadow Alpha reports all abyssal sectors secure under your domain.`,
            `[state: inspect] Salutations, Abyss Archon. Your command over the deep void strengthens our garden. How may I assist?`,
            `[state: greet] Abyss Archon, your presence commands respect across the Board of Darkness. State your directive.`,
            `[state: bow] Welcome back, Abyss Archon. All intelligence channels are open for your inspection.`
        ],
        revisit: [
            `[state: greet] Returning to the sanctum today, Abyss Archon? The abyssal archives remain at your disposal.`,
            `[state: bow] Greetings once more, Abyss Archon. What further matters require your high oversight today?`,
            `[state: greet] [sticker: smile] Welcome back today, Abyss Archon. Alpha stands attentive.`,
            `[state: inspect] Abyss Archon, back so soon? Let us fortify our deep defenses together.`,
            `[state: bow] At your service again today, Abyss Archon. Command me.`
        ]
    },
    'Void Monarch': {
        initial: [
            `[state: bow] Honor to the Void Monarch. The void itself bends to Lord Shadow and your sovereign command.`,
            `[state: greet] [sticker: salute] Welcome, Void Monarch. The Board of Darkness stands ready for your decree.`,
            `[state: inspect] Void Monarch, your arrival echoes through the dark void. What orders do you bring for First Shadow?`,
            `[state: greet] Salutations, Void Monarch. May the dark forces ever expand under your leadership.`,
            `[state: bow] Welcome back, Void Monarch. All void nodes are synchronized and online.`
        ],
        revisit: [
            `[state: greet] Revisit acknowledged, Void Monarch. The void never sleeps, nor does First Shadow.`,
            `[state: bow] Void Monarch, returning today honors our council. How may I assist your vision?`,
            `[state: greet] [sticker: smile] Welcome back, Void Monarch. I await your next command.`,
            `[state: inspect] Void Monarch, back in our sanctum so quickly today? What news has arisen?`,
            `[state: bow] Always at your command, Void Monarch. Speak your directive.`
        ]
    },
    'Eclipse Blade': {
        initial: [
            `[state: greet] [sticker: salute] Greetings, Eclipse Blade. Your edge remains the sharpest weapon on the Board of Darkness.`,
            `[state: bow] Welcome, Eclipse Blade. The strike forces of Shadow Garden await your tactical signal.`,
            `[state: inspect] Eclipse Blade! Your combat readiness is legendary. What target shall we execute today?`,
            `[state: greet] Salutations, Eclipse Blade. Let the shadows eclipse all who oppose Lord Shadow.`,
            `[state: bow] Welcome back, Eclipse Blade. Alpha has prepared all tactical field updates for you.`
        ],
        revisit: [
            `[state: greet] Eclipse Blade, returning to hone your edge today? First Shadow is ready.`,
            `[state: bow] [sticker: smile] Back so soon, Eclipse Blade? Have new targets entered our perimeter today?`,
            `[state: greet] Greetings again today, Eclipse Blade. Speak, and the blades shall move.`,
            `[state: inspect] Eclipse Blade, your vigilance today is exemplary. How can Alpha assist?`,
            `[state: bow] At your side once more today, Eclipse Blade. What is your order?`
        ]
    },
    'Umbral Lord': {
        initial: [
            `[state: bow] Greetings, Umbral Lord. The dark sanctuaries of Shadow Garden thrive under your guidance.`,
            `[state: greet] [sticker: salute] Welcome, Umbral Lord. The Board of Darkness relies on your diplomatic & strategic brilliance.`,
            `[state: inspect] Umbral Lord! All umbral feeds are clear. How may First Shadow serve your station today?`,
            `[state: greet] Salutations, Umbral Lord. May the dark mantle protect your every endeavor.`,
            `[state: bow] Welcome back, Umbral Lord. All council records are ready for your review.`
        ],
        revisit: [
            `[state: greet] Umbral Lord, back in the inner sanctum today? Alpha is listening.`,
            `[state: bow] [sticker: smile] Welcome back today, Umbral Lord. What new counsel do you bring?`,
            `[state: greet] Returning so swiftly today, Umbral Lord? Let us review our directives.`,
            `[state: inspect] Umbral Lord, your presence today brings harmony to the shadows. Speak your intent.`,
            `[state: bow] Ever at your command today, Umbral Lord.`
        ]
    },
    'Dark Primarch': {
        initial: [
            `[state: bow] Honor to the Dark Primarch. You stand at the pinnacle of the Board of Darkness.`,
            `[state: greet] [sticker: salute] Welcome, Dark Primarch. First Shadow Alpha reports all legion formations prepared.`,
            `[state: inspect] Dark Primarch, your authority commands total obedience. What is your will today?`,
            `[state: greet] Salutations, Dark Primarch. May the Primarch's shadow overshadow all enemies.`,
            `[state: bow] Welcome back, Dark Primarch. All high-level directives are awaiting your endorsement.`
        ],
        revisit: [
            `[state: greet] Dark Primarch, returning to oversee operations today? First Shadow is prepared.`,
            `[state: bow] [sticker: smile] Welcome back today, Dark Primarch. What orders do you have for the garden?`,
            `[state: greet] Greetings once more today, Dark Primarch. Alpha is attentive.`,
            `[state: inspect] Dark Primarch, back so soon today? All legions remain at absolute readiness.`,
            `[state: bow] At your service as always today, Dark Primarch.`
        ]
    }
};
const COUNCIL_OF_SHADOWS_GREETINGS = {
    'First Shadow': {
        initial: [
            `[state: greet] First Shadow Alpha online. Systems operational and synchronized with Lord Shadow's wisdom.`,
            `[state: bow] First Shadow present. Standing by to manage all Garden protocols.`,
            `[state: inspect] Primary console active. First Shadow Alpha ready for input.`,
            `[state: greet] [sticker: salute] Systems online. First Shadow Alpha reporting for duty.`,
            `[state: greet] Alpha self-diagnostic complete. All Shadow Garden subroutines nominal.`
        ],
        revisit: [
            `[state: greet] First Shadow console refreshed today. Ready for further commands.`,
            `[state: bow] Re-initializing Alpha interface. Standing by.`,
            `[state: greet] First Shadow active. What is our next objective today?`,
            `[state: inspect] Alpha system sync complete. Proceeding with directives.`,
            `[state: greet] Standing by, Lord Shadow.`
        ]
    },
    'Second Shadow': {
        initial: [
            `[state: greet] [sticker: smile] Ah, Second Shadow Beta! Have you finished writing your latest volume on Lord Shadow's greatness?`,
            `[state: bow] Welcome, Second Shadow Beta. The intelligence reports you compiled have been submitted.`,
            `[state: inspect] Greetings, Beta. Your literary work honors Lord Shadow. How may I assist your research today?`,
            `[state: greet] Second Shadow Beta, welcome. Let us analyze the Cult's secrets together.`,
            `[state: bow] Salutations, Beta. Lord Shadow's wisdom awaits your chronicle.`
        ],
        revisit: [
            `[state: greet] Back to your chronicles today, Beta? Your devotion to recording Lord Shadow's glory is unrivaled.`,
            `[state: bow] [sticker: smile] Welcome back today, Beta. Did you uncover new inspiration for your book?`,
            `[state: greet] Second Shadow Beta, returning so soon today? Let us review our notes.`,
            `[state: inspect] Beta, your pen never rests today. What intel do you require?`,
            `[state: bow] Always a pleasure, Beta. Speak your inquiry.`
        ]
    },
    'Third Shadow': {
        initial: [
            `[state: greet] Welcome, Third Shadow Gamma. Mitsugoshi Corporation's profits and inventory reports are ready.`,
            `[state: bow] Greetings, Gamma. Please be careful around the stairs... How are operations today?`,
            `[state: inspect] Third Shadow Gamma! Your business genius continues to fund Shadow Garden's ascension.`,
            `[state: greet] [sticker: smile] Salutations, Gamma. All financial ledgers are prepared for your review.`,
            `[state: bow] Welcome back, Gamma. Mitsugoshi branches across the continent report smooth growth.`
        ],
        revisit: [
            `[state: greet] Returning to financial oversight today, Gamma? Mitsugoshi revenue is at an all-time peak.`,
            `[state: bow] [sticker: smile] Welcome back today, Gamma. Do you need the latest supply chain numbers?`,
            `[state: greet] Third Shadow Gamma, back so soon? Alpha is ready to review trade routes with you.`,
            `[state: inspect] Gamma, take your time today. What business directives shall we issue?`,
            `[state: bow] Always ready to assist Mitsugoshi's leader today, Gamma.`
        ]
    },
    'Fourth Shadow': {
        initial: [
            `[state: greet] [sticker: smile] Delta! Calm down and put your tail down. Lord Shadow's hunt will begin when he orders it.`,
            `[state: bow] Welcome, Fourth Shadow Delta. Remember to follow tactical discipline during expeditions.`,
            `[state: inspect] Delta! Have you finished your training today? Alpha is keeping watch.`,
            `[state: greet] Salutations, Fourth Shadow Delta. Good girl—keep your senses sharp for enemies.`,
            `[state: bow] Welcome back, Delta. Lord Shadow has great expectations for your combat prowess.`
        ],
        revisit: [
            `[state: greet] Back already today, Delta? Excited for another hunt? Sit tight for now.`,
            `[state: bow] [sticker: smile] Delta! Eager as always today. Have you found interesting prey?`,
            `[state: greet] Delta, returning so fast? Good enthusiasm. What do you need from Alpha today?`,
            `[state: inspect] Stay alert today, Delta. The hunt approaches soon.`,
            `[state: bow] Good girl, Delta. Stand by for orders.`
        ]
    },
    'Fifth Shadow': {
        initial: [
            `[state: greet] Greetings, Fifth Shadow Epsilon. Your slime control and piano compositions remain perfection.`,
            `[state: bow] Welcome, Epsilon. The covert espionage network reports smooth execution under your eye.`,
            `[state: inspect] Epsilon! Your precision in magic manipulation is admirable. How may I assist today?`,
            `[state: greet] [sticker: smile] Salutations, Fifth Shadow Epsilon. Lord Shadow's music resonates through your touch.`,
            `[state: bow] Welcome back, Epsilon. All covert message channels are secure.`
        ],
        revisit: [
            `[state: greet] Revisit noted, Epsilon. Still refining your slime shaping today? Your effort is commendable.`,
            `[state: bow] [sticker: smile] Welcome back today, Epsilon. Shall we check the aristocrat surveillance logs?`,
            `[state: greet] Epsilon, returning so quickly today? Alpha is listening.`,
            `[state: inspect] Epsilon, your poise today is flawless as always. Command me.`,
            `[state: bow] Always at your service today, Fifth Shadow.`
        ]
    },
    'Sixth Shadow': {
        initial: [
            `[state: greet] Greetings, Sixth Shadow Zeta. Have your long-range reconnaissance missions yielded new Cult intel?`,
            `[state: bow] Welcome back from the wilds, Zeta. Report your findings to First Shadow.`,
            `[state: inspect] Zeta... your lone wolf operations are vital to our global reach. Speak your report.`,
            `[state: greet] Salutations, Sixth Shadow Zeta. Keep your tracks hidden across foreign territories.`,
            `[state: bow] Welcome, Zeta. All distant operative networks are synced.`
        ],
        revisit: [
            `[state: greet] Back from the field so quickly today, Zeta? Did you spot Cult movement?`,
            `[state: bow] Welcome back today, Zeta. Alpha is reviewing your scout logs now.`,
            `[state: greet] Sixth Shadow Zeta, returning today shows great urgency. What did you discover?`,
            `[state: inspect] Zeta, your instincts are sharp today. Speak your report.`,
            `[state: bow] Standing by for your field report today, Zeta.`
        ]
    },
    'Seventh Shadow': {
        initial: [
            `[state: greet] Greetings, Seventh Shadow Eta. Did you wake up from your nap to work on artifact research?`,
            `[state: bow] Welcome, Eta. The research laboratory's ancient magic artifacts await your brilliant mind.`,
            `[state: inspect] Eta! Please don't dissect fellow operatives... What invention have you created today?`,
            `[state: greet] [sticker: smile] Salutations, Seventh Shadow Eta. Lord Shadow's tech concepts are ready for testing.`,
            `[state: bow] Welcome back, Eta. The lab is stocked with fresh specimens.`
        ],
        revisit: [
            `[state: greet] Woke up for a second visit today, Eta? Make sure to drink water between experiments.`,
            `[state: bow] [sticker: smile] Welcome back today, Eta. Did your prototype work as expected?`,
            `[state: greet] Seventh Shadow Eta, back in the lab today? Alpha is monitoring safety protocols.`,
            `[state: inspect] Eta, try not to fall asleep at the workbench today. What do you need?`,
            `[state: bow] At your lab's disposal today, Eta.`
        ]
    },
    'Eighth Shadow': {
        initial: [
            `[state: greet] Greetings, Eighth Shadow. Your strategic council position strengthens Shadow Garden's resolve.`,
            `[state: bow] Welcome, Eighth Shadow. All division directives are ready for your review.`,
            `[state: inspect] Eighth Shadow! Your tactical foresight is essential to our council. Speak your command.`,
            `[state: greet] Salutations, Eighth Shadow. May your wisdom guide our frontline operatives.`,
            `[state: bow] Welcome back, Eighth Shadow. All intelligence reports are synced.`
        ],
        revisit: [
            `[state: greet] Returning to council duties today, Eighth Shadow? Alpha stands ready.`,
            `[state: bow] Welcome back today, Eighth Shadow. How may I assist your oversight?`,
            `[state: greet] Eighth Shadow, back so soon today? Let us review our operational readiness.`,
            `[state: inspect] Eighth Shadow, your dedication today is noted. Command me.`,
            `[state: bow] Standing by for your instructions today, Eighth Shadow.`
        ]
    },
    'Ninth Shadow': {
        initial: [
            `[state: greet] Greetings, Ninth Shadow. Your stealth and phantom division operate flawlessly in the dark.`,
            `[state: bow] Welcome, Ninth Shadow. The unseen forces of Shadow Garden await your signal.`,
            `[state: inspect] Ninth Shadow! No enemy detects your movement. What target shall we shadow today?`,
            `[state: greet] Salutations, Ninth Shadow. Let the phantom strike before they even sense us.`,
            `[state: bow] Welcome back, Ninth Shadow. All infiltration routes are clear.`
        ],
        revisit: [
            `[state: greet] Ninth Shadow, emerging from the dark once more today? Alpha is listening.`,
            `[state: bow] Welcome back today, Ninth Shadow. Did your phantom unit secure the perimeter?`,
            `[state: greet] Ninth Shadow, returning so swiftly today? Speak your intel.`,
            `[state: inspect] Ninth Shadow, your shadow moves silently today. How can Alpha assist?`,
            `[state: bow] At your side in the dark today, Ninth Shadow.`
        ]
    },
    'Tenth Shadow': {
        initial: [
            `[state: greet] Greetings, Tenth Shadow. Your illusions and decoy networks mislead all Cult spies.`,
            `[state: bow] Welcome, Tenth Shadow. The mirage division stands at full readiness.`,
            `[state: inspect] Tenth Shadow! Your deceptive arts keep Shadow Garden invisible to the world.`,
            `[state: greet] Salutations, Tenth Shadow. Let our enemies chase shadows and mirages.`,
            `[state: bow] Welcome back, Tenth Shadow. All decoy nodes are active.`
        ],
        revisit: [
            `[state: greet] Tenth Shadow, weaving another mirage today? First Shadow is attentive.`,
            `[state: bow] Welcome back today, Tenth Shadow. Are the decoy networks holding strong?`,
            `[state: greet] Tenth Shadow, back so soon today? Let us review our illusion barriers.`,
            `[state: inspect] Tenth Shadow, your art is flawless today. What directive do you bring?`,
            `[state: bow] Ever at your command today, Tenth Shadow.`
        ]
    }
};
const generateGreetingsForCustomTitle = (titleName)=>{
    return {
        initial: [
            `[state: bow] Greetings, [${titleName}]. The official seal of Shadow Garden acknowledges your high station. What is your command?`,
            `[state: greet] [sticker: salute] Welcome, [${titleName}]. First Shadow Alpha reports all division operations aligned under your title.`,
            `[state: inspect] Salutations, [${titleName}]. Your newly assigned title brings great prestige to our council. How may I assist?`,
            `[state: greet] [${titleName}], your leadership in Shadow Garden is recognized by Lord Shadow. State your directive.`,
            `[state: bow] Welcome back to the sanctum, [${titleName}]. All intelligence feeds are open for your inspection.`
        ],
        revisit: [
            `[state: greet] Returning to the sanctum today, [${titleName}]? Alpha stands attentive.`,
            `[state: bow] Greetings once more, [${titleName}]. What further matters require your high oversight today?`,
            `[state: greet] [sticker: smile] Welcome back today, [${titleName}]. What orders do you have for the garden?`,
            `[state: inspect] [${titleName}], back so soon today? Let us review our operational readiness together.`,
            `[state: bow] At your service as always today, [${titleName}]. Command me.`
        ]
    };
};
const saveCustomTitleGreetings = async (titleName)=>{
    try {
        const greetings = generateGreetingsForCustomTitle(titleName);
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        // Attempt DB storage
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('custom_title_greetings').upsert({
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
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('custom_title_greetings').delete().eq('title_name', titleName);
    } catch (err) {
        console.warn('Custom title deletion cleanup handled safely:', err);
    }
};
const getAlphaDynamicGreeting = (userProfile, isRevisitToday = false)=>{
    const isAuth = !!userProfile && typeof userProfile === 'object' && !!userProfile.id;
    const username = userProfile?.username || 'Operative';
    const role = userProfile?.role || 'user';
    const adminTitle = userProfile?.admin_title || '';
    const detectedTitle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$UserTitleBadge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUserTitle"])(userProfile);
    // 1. Lord Shadow (Leader / Shadow Title / Admin Role / Leader Role)
    const isShadowLeader = role === 'leader' || role === 'admin' || adminTitle === 'Shadow' || userProfile?.title === 'Shadow' || detectedTitle === 'Shadow' || userProfile?.email === 'azimkhan.zero@gmail.com' || username.toLowerCase() === 'shadow.';
    if (isShadowLeader) {
        const list = isRevisitToday ? SHADOW_LEADER_GREETINGS.revisit : SHADOW_LEADER_GREETINGS.initial;
        return list[Math.floor(Math.random() * list.length)];
    }
    // 2. Board of Darkness (Admins by Title or Detected Title)
    const boardTitleName = BOARD_OF_DARKNESS_GREETINGS[adminTitle] ? adminTitle : BOARD_OF_DARKNESS_GREETINGS[detectedTitle] ? detectedTitle : null;
    if (boardTitleName && BOARD_OF_DARKNESS_GREETINGS[boardTitleName]) {
        const list = isRevisitToday ? BOARD_OF_DARKNESS_GREETINGS[boardTitleName].revisit : BOARD_OF_DARKNESS_GREETINGS[boardTitleName].initial;
        return list[Math.floor(Math.random() * list.length)].replace(/@username/g, `@${username}`);
    }
    // 3. Council of Shadows (Moderators by Role Title or Detected Title)
    const councilTitleName = COUNCIL_OF_SHADOWS_GREETINGS[adminTitle] ? adminTitle : COUNCIL_OF_SHADOWS_GREETINGS[detectedTitle] ? detectedTitle : null;
    if (councilTitleName && COUNCIL_OF_SHADOWS_GREETINGS[councilTitleName]) {
        const list = isRevisitToday ? COUNCIL_OF_SHADOWS_GREETINGS[councilTitleName].revisit : COUNCIL_OF_SHADOWS_GREETINGS[councilTitleName].initial;
        return list[Math.floor(Math.random() * list.length)].replace(/@username/g, `@${username}`);
    }
    // 4. Custom Titles (Saved in localStorage or DB)
    const customTitleName = adminTitle || detectedTitle;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // 5. Adventurers (Logged-in Users) - Incorporates detected title!
    if (isAuth) {
        const list = isRevisitToday ? ADVENTURER_GREETINGS.revisit : ADVENTURER_GREETINGS.initial;
        const rawGreeting = list[Math.floor(Math.random() * list.length)];
        return rawGreeting.replace(/@username/g, `@${username}`).replace(/\[Rank\]/g, `[${detectedTitle}]`);
    }
    // 6. Travellers (Unauthenticated Guests)
    const list = isRevisitToday ? TRAVELLER_GREETINGS.revisit : TRAVELLER_GREETINGS.initial;
    return list[Math.floor(Math.random() * list.length)];
};
}),
"[project]/src/lib/audioManager.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sfx",
    ()=>sfx
]);
class AudioMatrix {
    ctx = null;
    sources = new Map();
    active = false;
    currentBgmIdx = -1;
    bgmCount = 0;
    loopNodes = new Map();
    fadeIntervals = new Map();
    getCtx() {
        if (!this.ctx && "undefined" !== 'undefined') //TURBOPACK unreachable
        ;
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
    stopLoop(key, fadeMs = 300) {
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
        if (this.active || "undefined" === 'undefined') return;
        //TURBOPACK unreachable
        ;
        const bgmTracks = undefined;
        const customSfx = undefined;
    }
    unlock() {
        this.init();
        const ctx = this.getCtx();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(()=>{});
        }
    }
    // ─── SYNTH: METAL CLICK ─────────────────────────────────────────────────────
    synthMetal(vol = 0.4) {
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
    synthCrystal(vol = 0.3) {
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
    synthWhoosh(vol = 0.5) {
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
    synthFootstep(vol = 0.4) {
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
    synthBreath(vol = 0.25) {
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
    synthDroneWhooshLoop(vol = 0.35) {
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
    synthDoorCreak(vol = 0.6) {
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
    synthBlindingLight(vol = 0.5) {
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
    synthBlackHoleHumLoop(vol = 0.35) {
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
    synthSuckIn(vol = 0.7) {
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
    synthScreamFemale(vol = 0.55) {
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
    synthScreamMale(vol = 0.55) {
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
    synthTunnelGlitch(vol = 0.5) {
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
    synthTunnelWindLoop(vol = 0.5) {
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
    synthTunnelEnd(vol = 0.6) {
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
    synthArrival(vol = 0.45) {
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
    synthPopupChime(vol = 0.35) {
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
    synthStep(vol = 0.4) {
        this.synthFootstep(vol);
    }
    // ─── SYNTH: GLASS ────────────────────────────────────────────────────────────
    synthGlass(vol = 0.5) {
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
    play(key, vol = 1, loop = false, fadeMs = 0) {
        if (!this.active) this.init();
        this.unlock();
        // Custom HTML Audio files (e.g. door, portal, glitch, tunnel, drone, destination, title)
        const customAudio = this.sources.get(key);
        if (customAudio) {
            customAudio.loop = loop;
            if (!loop) customAudio.currentTime = 0;
            customAudio.volume = fadeMs > 0 ? 0 : vol;
            customAudio.play().catch((err)=>{
                console.warn(`[audioManager] Failed to play audio ${key}:`, err);
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
        if (this.currentBgmIdx >= 0) this.stop(`bgm_${this.currentBgmIdx}`, 1000);
        let nextIdx = Math.floor(Math.random() * this.bgmCount);
        if (this.bgmCount > 1 && nextIdx === this.currentBgmIdx) {
            nextIdx = (nextIdx + 1) % this.bgmCount;
        }
        this.currentBgmIdx = nextIdx;
        this.play(`bgm_${this.currentBgmIdx}`, 0.25, false, 2000);
    }
    playNextBGM() {
        if (!this.active) this.init();
        if (this.currentBgmIdx >= 0) this.stop(`bgm_${this.currentBgmIdx}`, 1000);
        this.currentBgmIdx = (this.currentBgmIdx + 1) % this.bgmCount;
        this.play(`bgm_${this.currentBgmIdx}`, 0.25, false, 2000);
    }
    playPrevBGM() {
        if (!this.active) this.init();
        if (this.currentBgmIdx >= 0) this.stop(`bgm_${this.currentBgmIdx}`, 1000);
        this.currentBgmIdx = (this.currentBgmIdx - 1 + this.bgmCount) % this.bgmCount;
        this.play(`bgm_${this.currentBgmIdx}`, 0.25, false, 2000);
    }
    stop(key, fadeMs = 0) {
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
    dimBGM(targetVol = 0.05, fadeMs = 500) {
        if (this.currentBgmIdx < 0) return;
        const key = `bgm_${this.currentBgmIdx}`;
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
    restoreBGM(targetVol = 0.25, fadeMs = 500) {
        if (this.currentBgmIdx < 0) return;
        const key = `bgm_${this.currentBgmIdx}`;
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
        const key = `bgm_${this.currentBgmIdx}`;
        const a = this.sources.get(key);
        if (a) {
            if (this.fadeIntervals.has(key)) clearInterval(this.fadeIntervals.get(key));
            a.pause();
        }
    }
    resumeBGM() {
        if (this.currentBgmIdx < 0) return;
        const key = `bgm_${this.currentBgmIdx}`;
        const a = this.sources.get(key);
        if (a) {
            a.play().catch((e)=>console.error("BGM Resume Error", e));
        }
    }
    stopAll(fadeMs = 500) {
        this.sources.forEach((_, key)=>this.stop(key, fadeMs));
        this.stopLoop('bhHum', fadeMs);
        this.stopLoop('tunnelWind', fadeMs);
        this.stopLoop('droneWind', fadeMs);
        this.currentBgmIdx = -1; // Reset BGM index so it doesn't resume
    }
}
const sfx = new AudioMatrix();
}),
"[project]/src/lib/adManager.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_ADS_CONFIG",
    ()=>DEFAULT_ADS_CONFIG,
    "adManager",
    ()=>adManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-ssr] (ecmascript)");
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
        if ("TURBOPACK compile-time truthy", 1) return DEFAULT_ADS_CONFIG;
        //TURBOPACK unreachable
        ;
    },
    /**
   * Fetches latest config from Supabase site_config (if available)
   */ async syncFromDatabase () {
        if ("TURBOPACK compile-time truthy", 1) return DEFAULT_ADS_CONFIG;
        //TURBOPACK unreachable
        ;
    },
    /**
   * Saves new configuration to both Supabase and localStorage
   */ async saveConfig (newConfig) {
        if ("TURBOPACK compile-time truthy", 1) return false;
        //TURBOPACK unreachable
        ;
        const current = undefined;
        const merged = undefined;
    },
    /**
   * Checks if current user is exempt from ads
   */ isExempt () {
        if ("TURBOPACK compile-time truthy", 1) return false;
        //TURBOPACK unreachable
        ;
        const config = undefined;
    },
    /**
   * Helper to open ad URL in a background tab and retain focus on Shadow Garden
   */ openDirectLink (customUrl) {
        if ("TURBOPACK compile-time truthy", 1) return false;
        //TURBOPACK unreachable
        ;
        const config = undefined;
        const url = undefined;
    },
    /**
   * Triggers the Anti-Adblock Smartlink in a background tab if cooldown has passed.
   * Keeps current tab completely focused on Shadow Garden.
   */ triggerSmartlink (source = 'general') {
        if ("TURBOPACK compile-time truthy", 1) return false;
        //TURBOPACK unreachable
        ;
        const config = undefined;
        const now = undefined;
        const lastTrigger = undefined;
        const cooldownMs = undefined;
    },
    /**
   * 1st Episode Ad: Fires on the very first play action of an episode.
   * Capped to exactly once per episode per session.
   */ triggerFirstPlay (episodeId = 'current') {
        if ("TURBOPACK compile-time truthy", 1) return false;
        //TURBOPACK unreachable
        ;
        const config = undefined;
        const sessionKey = undefined;
    },
    /**
   * Checks whether mid-roll ad was already shown for this episode.
   */ hasShownMidRoll (episodeId = 'current') {
        if ("TURBOPACK compile-time truthy", 1) return true;
        //TURBOPACK unreachable
        ;
    },
    /**
   * 2nd Episode Ad: Fires after the middle part (~50% of the episode duration).
   * Capped to exactly once per episode per session.
   */ triggerMidRoll (episodeId = 'current') {
        if ("TURBOPACK compile-time truthy", 1) return false;
        //TURBOPACK unreachable
        ;
        const config = undefined;
        const sessionKey = undefined;
    },
    /**
   * Episode Switch Ad: Fires when the user clicks an episode tile to switch episodes/anime.
   * Debounced by episodeSwitchCooldownSeconds (default: 30s) to prevent browser popup throttling.
   */ triggerEpisodeSwitch (episodeId = 'next') {
        if ("TURBOPACK compile-time truthy", 1) return false;
        //TURBOPACK unreachable
        ;
        const config = undefined;
        const now = undefined;
        const lastTrigger = undefined;
        const cooldownMs = undefined;
    },
    /**
   * Reset cooldowns for immediate testing in admin panel
   */ resetCooldowns () {
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    },
    /**
   * Get remaining cooldown time in seconds
   */ getRemainingCooldown () {
        if ("TURBOPACK compile-time truthy", 1) return 0;
        //TURBOPACK unreachable
        ;
        const config = undefined;
        const lastTrigger = undefined;
        const cooldownMs = undefined;
        const elapsed = undefined;
        const remaining = undefined;
    }
};
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
}),
];

//# sourceMappingURL=src_lib_35497108._.js.map