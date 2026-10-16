module.exports = [
"[project]/.next-internal/server/app/api/anime/airing-today/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/src/lib/anilist.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/app/api/anime/airing-today/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/anilist.ts [app-route] (ecmascript)");
;
;
const runtime = 'nodejs';
const dynamic = 'force-dynamic';
async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const perPage = parseInt(searchParams.get('perPage') || '24', 10);
        const releasedOnly = searchParams.get('releasedOnly') !== 'false';
        const data = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anilist$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AniListService"].getAiringToday(page, perPage, releasedOnly);
        const items = Array.isArray(data) ? data : data?.items || [];
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            page,
            pageInfo: data?.pageInfo || {
                currentPage: page,
                hasNextPage: items.length === perPage,
                totalPages: 1
            },
            results: items
        });
    } catch (err) {
        console.error('Error in /api/anime/airing-today:', err);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__6ad1ad11._.js.map