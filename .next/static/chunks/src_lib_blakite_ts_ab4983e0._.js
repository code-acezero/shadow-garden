(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/blakite.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
            console.warn("[Blakite] Upstream returned status ".concat(res.status));
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
    var _item_IMAGES, _item_IMAGES1, _item_TMDB_DATA_releaseDate, _item_TMDB_DATA, _item_TMDB_DATA1;
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
        image: ((_item_IMAGES = item.IMAGES) === null || _item_IMAGES === void 0 ? void 0 : _item_IMAGES.poster) || ((_item_IMAGES1 = item.IMAGES) === null || _item_IMAGES1 === void 0 ? void 0 : _item_IMAGES1.backdrop) || '',
        href: "/api/blakite/anime/".concat(id),
        type: item.type || 'TV',
        date: ((_item_TMDB_DATA = item.TMDB_DATA) === null || _item_TMDB_DATA === void 0 ? void 0 : (_item_TMDB_DATA_releaseDate = _item_TMDB_DATA.releaseDate) === null || _item_TMDB_DATA_releaseDate === void 0 ? void 0 : _item_TMDB_DATA_releaseDate.split('-')[0]) || '?',
        score: Number((_item_TMDB_DATA1 = item.TMDB_DATA) === null || _item_TMDB_DATA1 === void 0 ? void 0 : _item_TMDB_DATA1.rating) || 0,
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
        var _item_TMDB_DATA;
        tsRaw = (_item_TMDB_DATA = item.TMDB_DATA) === null || _item_TMDB_DATA === void 0 ? void 0 : _item_TMDB_DATA.releaseDate;
    }
    let dateToUse = tsRaw ? new Date(tsRaw).getTime() : 0;
    if (isNaN(dateToUse)) dateToUse = 0;
    return dateToUse;
}
async function getBlakiteHome() {
    const db = await fetchBlakiteDatabase();
    if (!db) return null;
    const allItems = [
        ...Object.entries(db.movies || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item,
                dateToUse: getBlakiteItemDate(item)
            };
        }),
        ...Object.entries(db.series || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item,
                dateToUse: getBlakiteItemDate(item)
            };
        }),
        ...Object.entries(db.dramas || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item,
                dateToUse: getBlakiteItemDate(item)
            };
        })
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
async function getBlakiteLatest() {
    let type = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 'updated-all', page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
    const db = await fetchBlakiteDatabase();
    if (!db) return null;
    const allItems = [
        ...Object.entries(db.movies || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item,
                dateToUse: getBlakiteItemDate(item)
            };
        }),
        ...Object.entries(db.series || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item,
                dateToUse: getBlakiteItemDate(item)
            };
        }),
        ...Object.entries(db.dramas || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item,
                dateToUse: getBlakiteItemDate(item)
            };
        })
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
async function getBlakitePopular() {
    let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1, perPage = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 24;
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
        ...Object.entries(db.series || {}).map((param)=>{
            let [id, item] = param;
            var _item_TMDB_DATA;
            return {
                id,
                item,
                rating: parseFloat(((_item_TMDB_DATA = item.TMDB_DATA) === null || _item_TMDB_DATA === void 0 ? void 0 : _item_TMDB_DATA.rating) || '0'),
                dateToUse: getBlakiteItemDate(item)
            };
        }),
        ...Object.entries(db.movies || {}).map((param)=>{
            let [id, item] = param;
            var _item_TMDB_DATA;
            return {
                id,
                item,
                rating: parseFloat(((_item_TMDB_DATA = item.TMDB_DATA) === null || _item_TMDB_DATA === void 0 ? void 0 : _item_TMDB_DATA.rating) || '0'),
                dateToUse: getBlakiteItemDate(item)
            };
        })
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
    var _matched_item_TMDB_DATA;
    const db = await fetchBlakiteDatabase();
    if (!db || !title) return {
        available: false,
        episodeAvailable: false
    };
    const allItems = [
        ...Object.entries(db.series || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item
            };
        }),
        ...Object.entries(db.movies || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item
            };
        }),
        ...Object.entries(db.dramas || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item
            };
        })
    ];
    const qInfo = extractSeasonInfo(title);
    const qClean = normalizeBlakiteTitle(qInfo.baseTitle);
    if (!qClean) return {
        available: false,
        episodeAvailable: false
    };
    const matched = allItems.find((param)=>{
        let { item } = param;
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
            totalEps = (targetSeasonObj === null || targetSeasonObj === void 0 ? void 0 : targetSeasonObj.totalEpisodes) || 0;
        } else {
            const s1 = Object.values(matched.item.seasons).find((s)=>s.seasonNumber === 1);
            totalEps = (s1 === null || s1 === void 0 ? void 0 : s1.totalEpisodes) || Object.values(matched.item.seasons).reduce((acc, s)=>acc + (s.totalEpisodes || 0), 0);
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
        score: Number((_matched_item_TMDB_DATA = matched.item.TMDB_DATA) === null || _matched_item_TMDB_DATA === void 0 ? void 0 : _matched_item_TMDB_DATA.rating) || 0
    };
}
async function searchBlakite(keyword) {
    let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
    const db = await fetchBlakiteDatabase();
    if (!db) return null;
    const lowerKeyword = (keyword || '').toLowerCase().trim();
    const allItems = [
        ...Object.entries(db.movies || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item
            };
        }),
        ...Object.entries(db.series || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item
            };
        }),
        ...Object.entries(db.dramas || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item
            };
        })
    ];
    const matches = allItems.filter((param)=>{
        let { item } = param;
        return (item.title || '').toLowerCase().includes(lowerKeyword);
    }).map((param)=>{
        let { id, item } = param;
        return normalizeBlakiteCard(item, id);
    });
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
async function filterBlakite(params) {
    let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
    const db = await fetchBlakiteDatabase();
    if (!db) return null;
    let matches = [
        ...Object.entries(db.movies || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item
            };
        }),
        ...Object.entries(db.series || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item
            };
        }),
        ...Object.entries(db.dramas || {}).map((param)=>{
            let [id, item] = param;
            return {
                id,
                item
            };
        })
    ];
    if (params.genre) {
        const genreLower = params.genre.toLowerCase();
        matches = matches.filter((m)=>{
            var _m_item_TMDB_DATA_genres, _m_item_TMDB_DATA;
            return (_m_item_TMDB_DATA = m.item.TMDB_DATA) === null || _m_item_TMDB_DATA === void 0 ? void 0 : (_m_item_TMDB_DATA_genres = _m_item_TMDB_DATA.genres) === null || _m_item_TMDB_DATA_genres === void 0 ? void 0 : _m_item_TMDB_DATA_genres.some((g)=>g.toLowerCase() === genreLower);
        });
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
        matches.sort((a, b)=>{
            var _b_item_TMDB_DATA, _a_item_TMDB_DATA;
            return parseFloat(((_b_item_TMDB_DATA = b.item.TMDB_DATA) === null || _b_item_TMDB_DATA === void 0 ? void 0 : _b_item_TMDB_DATA.rating) || '0') - parseFloat(((_a_item_TMDB_DATA = a.item.TMDB_DATA) === null || _a_item_TMDB_DATA === void 0 ? void 0 : _a_item_TMDB_DATA.rating) || '0');
        });
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
            href: "/api/blakite/watch/".concat(id),
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
                id: "".concat(id, "::").concat(season.seasonNumber, "-").concat(i),
                number: String(cumulative),
                seasonNumber: season.seasonNumber,
                episodeInSeason: i,
                title: "Season ".concat(season.seasonNumber, " - Episode ").concat(i),
                href: "/api/blakite/watch/".concat(id, "::").concat(season.seasonNumber, "-").concat(i),
                hasSub: (item.language || '').toLowerCase().includes('sub'),
                hasDub: (item.language || '').toLowerCase().includes('dub') || item.language === 'ORG' || item.language === 'FanDub'
            });
        }
    }
    return episodes;
}
async function getBlakiteDetail(id) {
    var _item_IMAGES, _item_IMAGES1, _item_TMDB_DATA, _item_TMDB_DATA1, _item_TMDB_DATA2, _item_TMDB_DATA3, _item_TMDB_DATA4;
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
        banner: ((_item_IMAGES = item.IMAGES) === null || _item_IMAGES === void 0 ? void 0 : _item_IMAGES.backdrop) || ((_item_IMAGES1 = item.IMAGES) === null || _item_IMAGES1 === void 0 ? void 0 : _item_IMAGES1.poster) || '',
        synopsis: ((_item_TMDB_DATA = item.TMDB_DATA) === null || _item_TMDB_DATA === void 0 ? void 0 : _item_TMDB_DATA.synopsis) || 'No synopsis available.',
        status: item.status || 'Completed',
        rating: ((_item_TMDB_DATA1 = item.TMDB_DATA) === null || _item_TMDB_DATA1 === void 0 ? void 0 : _item_TMDB_DATA1.rating) || '0',
        premiered: ((_item_TMDB_DATA2 = item.TMDB_DATA) === null || _item_TMDB_DATA2 === void 0 ? void 0 : _item_TMDB_DATA2.releaseDate) || '?',
        season: 'ANIME',
        aired: ((_item_TMDB_DATA3 = item.TMDB_DATA) === null || _item_TMDB_DATA3 === void 0 ? void 0 : _item_TMDB_DATA3.releaseDate) || '?',
        episodesCount: String(episodes.length),
        studios: [],
        producers: [],
        genres: ((_item_TMDB_DATA4 = item.TMDB_DATA) === null || _item_TMDB_DATA4 === void 0 ? void 0 : _item_TMDB_DATA4.genres) || [],
        episodes: episodes.map((e)=>{
            var _item_IMAGES, _item_IMAGES1;
            return {
                id: e.id,
                number: e.number,
                seasonNumber: e.seasonNumber,
                episodeInSeason: e.episodeInSeason,
                title: e.title,
                url: e.href,
                image: (item === null || item === void 0 ? void 0 : (_item_IMAGES = item.IMAGES) === null || _item_IMAGES === void 0 ? void 0 : _item_IMAGES.backdrop) || (item === null || item === void 0 ? void 0 : (_item_IMAGES1 = item.IMAGES) === null || _item_IMAGES1 === void 0 ? void 0 : _item_IMAGES1.poster) || ''
            };
        }),
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
        apiUrl = "".concat(BLAKITE_SERVER_URL, "/api/get.php?id=").concat(encodeURIComponent(uniqueId), "&tmdbId=").concat(encodeURIComponent(tmdbId));
    } else {
        apiUrl = "".concat(BLAKITE_SERVER_URL, "/api/get.php?tmdbId=").concat(encodeURIComponent(tmdbId));
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
            videoUrl = "".concat(baseDURL).concat(dataId, ".").concat(qualityCode, ".tar?r_file=chunklist.m3u8&r_type=application%2Fvnd.apple.mpegurl").concat(range ? "&r_range=".concat(range) : '');
            isM3U8 = true;
        } else {
            videoUrl = "".concat(baseDURL).concat(dataId, ".").concat(qualityCode, ".mp4");
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_lib_blakite_ts_ab4983e0._.js.map