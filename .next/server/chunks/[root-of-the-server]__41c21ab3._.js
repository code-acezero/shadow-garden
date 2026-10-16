module.exports = [
"[project]/.next-internal/server/app/api/blakite/popular/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/src/lib/blakite.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Blakite Hindi Anime Service & Scraper
 * Self-hosted locally inside shadow-garden-v2 with in-memory caching.
 */ __turbopack_context__.s([
    "BLAKITE_SERVER_URL",
    ()=>BLAKITE_SERVER_URL,
    "checkHindiDub",
    ()=>checkHindiDub,
    "extractSeasonInfo",
    ()=>extractSeasonInfo,
    "fetchBlakiteDatabase",
    ()=>fetchBlakiteDatabase,
    "filterBlakite",
    ()=>filterBlakite,
    "findEpisodeInBlakite",
    ()=>findEpisodeInBlakite,
    "generateBlakiteEpisodes",
    ()=>generateBlakiteEpisodes,
    "getBlakiteDetail",
    ()=>getBlakiteDetail,
    "getBlakiteHome",
    ()=>getBlakiteHome,
    "getBlakiteLatest",
    ()=>getBlakiteLatest,
    "getBlakitePopular",
    ()=>getBlakitePopular,
    "getBlakiteStreamUrl",
    ()=>getBlakiteStreamUrl,
    "normalizeBlakiteCard",
    ()=>normalizeBlakiteCard,
    "normalizeBlakiteTitle",
    ()=>normalizeBlakiteTitle,
    "searchBlakite",
    ()=>searchBlakite
]);
const BLAKITE_API_URL = 'https://blakiteapi.xyz/api/getAllAnime.php';
const BLAKITE_SERVER_URL = 'https://blakiteapi.xyz';
// In-memory cache for the full catalog (1 hour TTL)
let cachedDb = null;
let cachedDbTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
async function fetchBlakiteDatabase() {
    const now = Date.now();
    if (cachedDb && now - cachedDbTime < CACHE_TTL_MS) {
        return cachedDb;
    }
    try {
        const res = await fetch(BLAKITE_API_URL, {
            headers: {
                'Referer': BLAKITE_SERVER_URL + '/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
            },
            next: {
                revalidate: 3600
            }
        });
        if (!res.ok) {
            console.warn(`[Blakite] Upstream returned status ${res.status}`);
            return cachedDb; // return stale if available
        }
        const data = await res.json();
        if (data && data.success && data.data) {
            cachedDb = data.data;
            cachedDbTime = now;
            return cachedDb;
        }
        return cachedDb;
    } catch (error) {
        console.error('[Blakite] Failed to fetch database:', error);
        return cachedDb;
    }
}
function normalizeBlakiteCard(item, id) {
    let totalEps = 0;
    if (item.seasons) {
        for (const s of Object.values(item.seasons)){
            totalEps += s.totalEpisodes || 0;
        }
    } else if (item.type === 'Movie') {
        totalEps = 1;
    }
    const isSub = (item.language || '').toLowerCase().includes('sub');
    const isDub = (item.language || '').toLowerCase().includes('dub') || item.language === 'ORG' || item.language === 'FanDub';
    return {
        id: id,
        slug: id,
        title: item.title,
        titleJp: item.title,
        image: item.IMAGES?.poster || item.IMAGES?.backdrop || '',
        href: `/api/blakite/anime/${id}`,
        type: item.type || 'TV',
        date: item.TMDB_DATA?.releaseDate?.split('-')[0] || '?',
        score: Number(item.TMDB_DATA?.rating) || 0,
        episodes: {
            sub: isSub ? totalEps : 0,
            dub: isDub ? totalEps : 0,
            total: totalEps
        }
    };
}
function getBlakiteItemDate(item) {
    let tsRaw = item.updatedAt || item.createdAt || null;
    if (!tsRaw && item.seasons) {
        let maxTs = 0;
        for (const s of Object.values(item.seasons)){
            const sTs = new Date(s.updatedAt || s.createdAt || 0).getTime();
            if (sTs > maxTs) {
                maxTs = sTs;
                tsRaw = s.updatedAt || s.createdAt;
            }
        }
    }
    if (!tsRaw) {
        tsRaw = item.TMDB_DATA?.releaseDate;
    }
    let dateToUse = tsRaw ? new Date(tsRaw).getTime() : 0;
    if (isNaN(dateToUse)) dateToUse = 0;
    return dateToUse;
}
async function getBlakiteHome() {
    const db = await fetchBlakiteDatabase();
    if (!db) return null;
    const allItems = [
        ...Object.entries(db.movies || {}).map(([id, item])=>({
                id,
                item,
                dateToUse: getBlakiteItemDate(item)
            })),
        ...Object.entries(db.series || {}).map(([id, item])=>({
                id,
                item,
                dateToUse: getBlakiteItemDate(item)
            })),
        ...Object.entries(db.dramas || {}).map(([id, item])=>({
                id,
                item,
                dateToUse: getBlakiteItemDate(item)
            }))
    ];
    allItems.sort((a, b)=>b.dateToUse - a.dateToUse);
    const spotlight = allItems.slice(0, 10).map((i)=>normalizeBlakiteCard(i.item, i.id));
    const recentlyUpdated = allItems.slice(0, 30).map((i)=>normalizeBlakiteCard(i.item, i.id));
    const ongoingAnime = allItems.filter((i)=>i.item.status === 'Ongoing').slice(0, 20).map((i)=>normalizeBlakiteCard(i.item, i.id));
    const moviesCollection = allItems.filter((i)=>i.item.type === 'Movie').slice(0, 20).map((i)=>normalizeBlakiteCard(i.item, i.id));
    const dramaLiveAction = allItems.filter((i)=>i.item.type === 'Drama').slice(0, 20).map((i)=>normalizeBlakiteCard(i.item, i.id));
    const completedSeries = allItems.filter((i)=>i.item.status === 'Completed').slice(0, 20).map((i)=>normalizeBlakiteCard(i.item, i.id));
    const hindiDubbedOrg = allItems.filter((i)=>i.item.language === 'ORG').slice(0, 20).map((i)=>normalizeBlakiteCard(i.item, i.id));
    const hindiFanDubbed = allItems.filter((i)=>i.item.language === 'Fandub').slice(0, 20).map((i)=>normalizeBlakiteCard(i.item, i.id));
    return {
        spotlight,
        recentlyUpdated,
        ongoingAnime,
        moviesCollection,
        dramaLiveAction,
        completedSeries,
        hindiDubbedOrg,
        hindiFanDubbed
    };
}
async function getBlakiteLatest(type = 'updated-all', page = 1) {
    const db = await fetchBlakiteDatabase();
    if (!db) return null;
    const allItems = [
        ...Object.entries(db.movies || {}).map(([id, item])=>({
                id,
                item,
                dateToUse: getBlakiteItemDate(item)
            })),
        ...Object.entries(db.series || {}).map(([id, item])=>({
                id,
                item,
                dateToUse: getBlakiteItemDate(item)
            })),
        ...Object.entries(db.dramas || {}).map(([id, item])=>({
                id,
                item,
                dateToUse: getBlakiteItemDate(item)
            }))
    ];
    allItems.sort((a, b)=>b.dateToUse - a.dateToUse);
    let filteredItems = allItems;
    if (type === 'updated-sub') {
        filteredItems = allItems.filter((i)=>(i.item.language || '').toLowerCase().includes('sub'));
    } else if (type === 'updated-dub') {
        filteredItems = allItems.filter((i)=>(i.item.language || '').toLowerCase().includes('dub') || i.item.language === 'ORG' || i.item.language === 'Fandub');
    } else if (type === 'trending') {
        filteredItems = allItems.filter((i)=>i.item.status === 'Ongoing');
    }
    const totalResults = filteredItems.length;
    const maxPage = Math.ceil(totalResults / 24) || 1;
    const pagedResults = filteredItems.slice((page - 1) * 24, page * 24).map((x)=>normalizeBlakiteCard(x.item, x.id));
    return {
        totalResults,
        currentPage: page,
        hasNextPage: page < maxPage,
        hasPreviousPage: page > 1,
        maxPage,
        minPage: 1,
        results: pagedResults
    };
}
async function getBlakitePopular(page = 1, perPage = 24) {
    const db = await fetchBlakiteDatabase();
    if (!db) {
        return {
            totalResults: 0,
            currentPage: page,
            hasNextPage: false,
            hasPreviousPage: false,
            maxPage: 1,
            minPage: 1,
            results: []
        };
    }
    const allItems = [
        ...Object.entries(db.series || {}).map(([id, item])=>({
                id,
                item,
                rating: parseFloat(item.TMDB_DATA?.rating || '0'),
                dateToUse: getBlakiteItemDate(item)
            })),
        ...Object.entries(db.movies || {}).map(([id, item])=>({
                id,
                item,
                rating: parseFloat(item.TMDB_DATA?.rating || '0'),
                dateToUse: getBlakiteItemDate(item)
            }))
    ];
    // Filter strictly for Hindi Dubs (ORG, Fandub, or Hindi in title/language)
    const hindiItems = allItems.filter((i)=>i.item.language === 'ORG' || i.item.language === 'Fandub' || /hindi/i.test(i.item.language || '') || /hindi/i.test(i.item.title || ''));
    // Sort by rating descending, with recency as secondary tiebreaker
    hindiItems.sort((a, b)=>{
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.dateToUse - a.dateToUse;
    });
    const totalResults = hindiItems.length;
    const maxPage = Math.ceil(totalResults / perPage) || 1;
    const pagedResults = hindiItems.slice((page - 1) * perPage, page * perPage).map((x)=>normalizeBlakiteCard(x.item, x.id));
    return {
        totalResults,
        currentPage: page,
        hasNextPage: page < maxPage,
        hasPreviousPage: page > 1,
        maxPage,
        minPage: 1,
        results: pagedResults
    };
}
function extractSeasonInfo(title) {
    if (!title) return {
        baseTitle: '',
        season: 1,
        isSeasonExplicit: false
    };
    const t = title.trim();
    let season = 1;
    let isSeasonExplicit = false;
    if (/\b(?:2nd|second)\s*season\b/i.test(t)) {
        season = 2;
        isSeasonExplicit = true;
    } else if (/\b(?:3rd|third)\s*season\b/i.test(t)) {
        season = 3;
        isSeasonExplicit = true;
    } else if (/\b(?:4th|fourth)\s*season\b/i.test(t)) {
        season = 4;
        isSeasonExplicit = true;
    } else if (/\b(?:5th|fifth)\s*season\b/i.test(t)) {
        season = 5;
        isSeasonExplicit = true;
    } else if (/\bfinal\s*season\b/i.test(t)) {
        season = 4;
        isSeasonExplicit = true;
    } else {
        const sMatch = t.match(/\bseason\s*(\d+)\b/i);
        if (sMatch) {
            season = parseInt(sMatch[1], 10);
            isSeasonExplicit = true;
        } else {
            const pMatch = t.match(/\bpart\s*(\d+)\b/i);
            if (pMatch) {
                season = parseInt(pMatch[1], 10);
                isSeasonExplicit = true;
            } else {
                const rMatch = t.match(/(?:^|\s|\()(VI|IV|V|III|II)(?:\s*[:\-\(\]]|\s*$)/i);
                if (rMatch) {
                    const roman = rMatch[1].toUpperCase();
                    if (roman === 'II') season = 2;
                    else if (roman === 'III') season = 3;
                    else if (roman === 'IV') season = 4;
                    else if (roman === 'V') season = 5;
                    else if (roman === 'VI') season = 6;
                    isSeasonExplicit = true;
                }
            }
        }
    }
    const baseTitle = t.replace(/\(tv\)|\(movie\)|\(dub\)|\(sub\)|\(hindi dubbed\)|\(hindi fan dubbed\)|\(english dubbed\)|\(english subbed\)/gi, '').replace(/\b(?:1st|first|2nd|second|3rd|third|4th|fourth|5th|fifth)\s*season\b/gi, '').replace(/\bfinal\s*season\b/gi, '').replace(/\bseason\s*\d+\b/gi, '').replace(/\bpart\s*\d+\b/gi, '').replace(/(?:^|\s|\()(VI|IV|V|III|II)(?:\s*[:\-\(\]]|\s*$)/gi, ' ').replace(/\s+/g, ' ').trim();
    return {
        baseTitle,
        season,
        isSeasonExplicit
    };
}
function normalizeBlakiteTitle(t) {
    return (t || '').toLowerCase().replace(/\(tv\)|\(movie\)|\(dub\)|\(sub\)|\(hindi dubbed\)|\(hindi fan dubbed\)|\(english dubbed\)|\(english subbed\)/gi, '').replace(/hindidubbed|hindifandubbed|fandubbed|dubbed|hindi/gi, '').replace(/[^a-z0-9]/g, '');
}
function findEpisodeInBlakite(episodes, targetSeason, targetEpNum, isSeasonExplicit) {
    if (!episodes.length || isNaN(targetEpNum) || targetEpNum <= 0) return null;
    if (isSeasonExplicit) {
        const inSeasonMatch = episodes.find((e)=>e.seasonNumber === targetSeason && e.episodeInSeason === targetEpNum);
        if (inSeasonMatch) return inSeasonMatch;
        return null;
    }
    const s1Match = episodes.find((e)=>(e.seasonNumber === 1 || !e.seasonNumber) && (e.episodeInSeason === targetEpNum || Number(e.number) === targetEpNum));
    if (s1Match) return s1Match;
    const cumulativeMatch = episodes.find((e)=>Number(e.number) === targetEpNum);
    if (cumulativeMatch) return cumulativeMatch;
    return null;
}
async function checkHindiDub(title, episode) {
    const db = await fetchBlakiteDatabase();
    if (!db || !title) return {
        available: false,
        episodeAvailable: false
    };
    const allItems = [
        ...Object.entries(db.series || {}).map(([id, item])=>({
                id,
                item
            })),
        ...Object.entries(db.movies || {}).map(([id, item])=>({
                id,
                item
            })),
        ...Object.entries(db.dramas || {}).map(([id, item])=>({
                id,
                item
            }))
    ];
    const qInfo = extractSeasonInfo(title);
    const qClean = normalizeBlakiteTitle(qInfo.baseTitle);
    if (!qClean) return {
        available: false,
        episodeAvailable: false
    };
    const matched = allItems.find(({ item })=>{
        const isHindi = item.language === 'ORG' || item.language === 'Fandub' || /hindi/i.test(item.language || '') || /hindi/i.test(item.title || '');
        if (!isHindi) return false;
        const tInfo = extractSeasonInfo(item.title || '');
        const tClean = normalizeBlakiteTitle(tInfo.baseTitle);
        const titleMatches = tClean === qClean || qClean.length >= 6 && (tClean.includes(qClean) || qClean.includes(tClean));
        if (!titleMatches) return false;
        // Strict season check:
        if (item.seasons) {
            const availSeasons = Object.values(item.seasons).map((s)=>s.seasonNumber);
            return availSeasons.includes(qInfo.season);
        }
        return qInfo.season === 1;
    });
    if (!matched) return {
        available: false,
        episodeAvailable: false
    };
    let totalEps = 0;
    if (matched.item.seasons) {
        if (qInfo.isSeasonExplicit) {
            const targetSeasonObj = Object.values(matched.item.seasons).find((s)=>s.seasonNumber === qInfo.season);
            totalEps = targetSeasonObj?.totalEpisodes || 0;
        } else {
            const s1 = Object.values(matched.item.seasons).find((s)=>s.seasonNumber === 1);
            totalEps = s1?.totalEpisodes || Object.values(matched.item.seasons).reduce((acc, s)=>acc + (s.totalEpisodes || 0), 0);
        }
    } else if (matched.item.type === 'Movie') {
        totalEps = 1;
    }
    const episodes = generateBlakiteEpisodes(matched.item, matched.id);
    let epObj = null;
    let episodeAvailable = true;
    if (episode !== undefined && episode !== null && String(episode).trim() !== '') {
        const epNum = Number(episode);
        epObj = findEpisodeInBlakite(episodes, qInfo.season, epNum, qInfo.isSeasonExplicit);
        episodeAvailable = !!epObj;
    }
    const dubType = matched.item.language === 'ORG' ? 'Hindi Official Dub' : matched.item.language === 'Fandub' ? 'Hindi Fan Dub' : 'Hindi Dub';
    return {
        available: true,
        id: matched.id,
        title: matched.item.title,
        dubType,
        language: matched.item.language,
        season: qInfo.season,
        totalEpisodes: totalEps,
        episodeAvailable,
        matchedEpisode: epObj ? {
            id: epObj.id,
            season: epObj.seasonNumber,
            epInSeason: epObj.episodeInSeason,
            number: epObj.number
        } : undefined,
        score: Number(matched.item.TMDB_DATA?.rating) || 0
    };
}
async function searchBlakite(keyword, page = 1) {
    const db = await fetchBlakiteDatabase();
    if (!db) return null;
    const lowerKeyword = (keyword || '').toLowerCase().trim();
    const allItems = [
        ...Object.entries(db.movies || {}).map(([id, item])=>({
                id,
                item
            })),
        ...Object.entries(db.series || {}).map(([id, item])=>({
                id,
                item
            })),
        ...Object.entries(db.dramas || {}).map(([id, item])=>({
                id,
                item
            }))
    ];
    const matches = allItems.filter(({ item })=>(item.title || '').toLowerCase().includes(lowerKeyword)).map(({ id, item })=>normalizeBlakiteCard(item, id));
    const itemsPerPage = 24;
    const maxPage = Math.ceil(matches.length / itemsPerPage) || 1;
    const pagedResults = matches.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    return {
        keyword,
        totalResults: matches.length,
        currentPage: page,
        hasNextPage: page < maxPage,
        hasPreviousPage: page > 1,
        maxPage,
        minPage: 1,
        results: pagedResults
    };
}
async function filterBlakite(params, page = 1) {
    const db = await fetchBlakiteDatabase();
    if (!db) return null;
    let matches = [
        ...Object.entries(db.movies || {}).map(([id, item])=>({
                id,
                item
            })),
        ...Object.entries(db.series || {}).map(([id, item])=>({
                id,
                item
            })),
        ...Object.entries(db.dramas || {}).map(([id, item])=>({
                id,
                item
            }))
    ];
    if (params.genre) {
        const genreLower = params.genre.toLowerCase();
        matches = matches.filter((m)=>m.item.TMDB_DATA?.genres?.some((g)=>g.toLowerCase() === genreLower));
    }
    if (params.type) {
        const typeLower = params.type.toLowerCase();
        matches = matches.filter((m)=>(m.item.type || '').toLowerCase() === typeLower);
    }
    if (params.status) {
        const statusLower = params.status.toLowerCase();
        matches = matches.filter((m)=>(m.item.status || 'Completed').toLowerCase() === statusLower);
    }
    if (params.sort === 'score') {
        matches.sort((a, b)=>parseFloat(b.item.TMDB_DATA?.rating || '0') - parseFloat(a.item.TMDB_DATA?.rating || '0'));
    } else {
        matches.reverse();
    }
    const cards = matches.map((m)=>normalizeBlakiteCard(m.item, m.id));
    const itemsPerPage = 24;
    const maxPage = Math.ceil(cards.length / itemsPerPage) || 1;
    const pagedResults = cards.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    return {
        totalResults: cards.length,
        currentPage: page,
        hasNextPage: page < maxPage,
        hasPreviousPage: page > 1,
        maxPage,
        minPage: 1,
        results: pagedResults
    };
}
function generateBlakiteEpisodes(item, id) {
    const episodes = [];
    if (item.type === 'Movie' || !item.seasons) {
        episodes.push({
            id: id,
            number: '1',
            title: 'Full Movie',
            href: `/api/blakite/watch/${id}`,
            hasSub: (item.language || '').toLowerCase().includes('sub'),
            hasDub: (item.language || '').toLowerCase().includes('dub') || item.language === 'ORG' || item.language === 'FanDub'
        });
        return episodes;
    }
    const seasons = Object.values(item.seasons).sort((a, b)=>a.seasonNumber - b.seasonNumber);
    let cumulative = 0;
    for (const season of seasons){
        for(let i = 1; i <= season.totalEpisodes; i++){
            cumulative++;
            episodes.push({
                id: `${id}::${season.seasonNumber}-${i}`,
                number: String(cumulative),
                seasonNumber: season.seasonNumber,
                episodeInSeason: i,
                title: `Season ${season.seasonNumber} - Episode ${i}`,
                href: `/api/blakite/watch/${id}::${season.seasonNumber}-${i}`,
                hasSub: (item.language || '').toLowerCase().includes('sub'),
                hasDub: (item.language || '').toLowerCase().includes('dub') || item.language === 'ORG' || item.language === 'FanDub'
            });
        }
    }
    return episodes;
}
async function getBlakiteDetail(id) {
    const db = await fetchBlakiteDatabase();
    if (!db) return null;
    let item = null;
    if (db.movies && db.movies[id]) item = db.movies[id];
    else if (db.series && db.series[id]) item = db.series[id];
    else if (db.dramas && db.dramas[id]) item = db.dramas[id];
    if (!item) return null;
    const card = normalizeBlakiteCard(item, id);
    const episodes = generateBlakiteEpisodes(item, id);
    return {
        ...card,
        id,
        nativeTitle: item.title,
        englishTitle: item.title,
        synonyms: [],
        banner: item.IMAGES?.backdrop || item.IMAGES?.poster || '',
        synopsis: item.TMDB_DATA?.synopsis || 'No synopsis available.',
        status: item.status || 'Completed',
        rating: item.TMDB_DATA?.rating || '0',
        premiered: item.TMDB_DATA?.releaseDate || '?',
        season: 'ANIME',
        aired: item.TMDB_DATA?.releaseDate || '?',
        episodesCount: String(episodes.length),
        studios: [],
        producers: [],
        genres: item.TMDB_DATA?.genres || [],
        episodes: episodes.map((e)=>({
                id: e.id,
                number: e.number,
                seasonNumber: e.seasonNumber,
                episodeInSeason: e.episodeInSeason,
                title: e.title,
                url: e.href,
                image: item?.IMAGES?.backdrop || item?.IMAGES?.poster || ''
            })),
        recommendations: [],
        related: [],
        downloads: []
    };
}
async function getBlakiteStreamUrl(slug) {
    let apiUrl = '';
    let tmdbId = slug;
    let uniqueId = '';
    if (slug.includes('::')) {
        [tmdbId, uniqueId] = slug.split('::');
        apiUrl = `${BLAKITE_SERVER_URL}/api/get.php?id=${encodeURIComponent(uniqueId)}&tmdbId=${encodeURIComponent(tmdbId)}`;
    } else {
        apiUrl = `${BLAKITE_SERVER_URL}/api/get.php?tmdbId=${encodeURIComponent(tmdbId)}`;
    }
    try {
        const res = await fetch(apiUrl, {
            headers: {
                'Referer': BLAKITE_SERVER_URL + '/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
            },
            cache: 'no-store'
        });
        if (!res.ok) return null;
        const result = await res.json();
        if (!result.success || !result.data || !result.data.dataId) {
            return null;
        }
        const { dataId, format, quality, qid, ranges } = result.data;
        const baseDURL = "https://hugh.cdn.rumble.cloud/video/";
        const qualityLabels = [
            '240p',
            '360p',
            '480p',
            '720p',
            '1080p'
        ];
        const qualityCodes = [
            'oaa',
            'baa',
            'caa',
            'gaa',
            'haa'
        ];
        const maxQualityIndex = Math.min(qid || 5, qualityLabels.length) - 1;
        const availableQualities = qualityLabels.slice(0, maxQualityIndex + 1);
        const availableQualityCodes = qualityCodes.slice(0, maxQualityIndex + 1);
        let defaultQuality = quality || '720p';
        if (!availableQualities.includes(defaultQuality)) {
            defaultQuality = availableQualities[availableQualities.length - 1] || '720p';
        }
        const defaultQualityIndex = Math.max(0, availableQualities.indexOf(defaultQuality));
        const qualityCode = availableQualityCodes[defaultQualityIndex] || 'gaa';
        let videoUrl = '';
        let isM3U8 = false;
        if (format === 'M3U8' && ranges) {
            const rangeMap = {};
            const rangeLines = String(ranges).split('\n').map((l)=>l.trim()).filter(Boolean);
            rangeLines.forEach((line)=>{
                const match = line.match(/^(\d+-\d+)\s*\(([^)]+)\)/);
                if (match) {
                    rangeMap[match[2]] = match[1];
                }
            });
            const range = rangeMap[defaultQuality] || '';
            videoUrl = `${baseDURL}${dataId}.${qualityCode}.tar?r_file=chunklist.m3u8&r_type=application%2Fvnd.apple.mpegurl${range ? `&r_range=${range}` : ''}`;
            isM3U8 = true;
        } else {
            videoUrl = `${baseDURL}${dataId}.${qualityCode}.mp4`;
            isM3U8 = false;
        }
        return {
            url: videoUrl,
            isM3U8,
            dataId,
            referer: 'https://blakiteapi.xyz/'
        };
    } catch (err) {
        console.error('[Blakite] Failed to resolve stream:', err);
        return null;
    }
}
}),
"[project]/src/app/api/blakite/popular/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$blakite$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/blakite.ts [app-route] (ecmascript)");
;
;
const runtime = 'nodejs';
const dynamic = 'force-dynamic';
async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const perPage = parseInt(searchParams.get('perPage') || '24', 10);
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$blakite$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getBlakitePopular"])(page, perPage);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            ...result
        });
    } catch (err) {
        console.error('Error in /api/blakite/popular:', err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            results: [],
            error: err.message
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__41c21ab3._.js.map