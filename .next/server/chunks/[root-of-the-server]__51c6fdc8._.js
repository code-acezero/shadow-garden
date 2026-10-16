module.exports = [
"[project]/.next-internal/server/app/api/anime/anilist/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/src/app/api/anime/anilist/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/app/api/anime/anilist/route.ts
__turbopack_context__.s([
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/server.js [app-route] (ecmascript)");
;
const runtime = 'nodejs';
const dynamic = 'force-dynamic';
const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';
// In-memory server cache for AniList GraphQL responses (prevents hitting the 30 req/min rate limit)
const serverCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes fresh
const STALE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours stale fallback
function cleanCache() {
    if (serverCache.size > 1000) {
        const now = Date.now();
        for (const [k, v] of serverCache.entries()){
            if (v.staleUntil < now) {
                serverCache.delete(k);
            }
        }
    }
}
async function executeAniListFetch(bodyString, attempt = 1) {
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), 12000);
    try {
        const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'ShadowGarden/2.0 (Anime Streamer)'
            },
            body: bodyString,
            signal: controller.signal
        });
        clearTimeout(timer);
        const json = await res.json().catch(()=>null);
        if (res.status === 429 && attempt <= 2) {
            const retryAfter = parseInt(res.headers.get('retry-after') || '2', 10);
            const waitMs = Math.min(Math.max(retryAfter * 1000, 1500), 4000);
            await new Promise((r)=>setTimeout(r, waitMs));
            return executeAniListFetch(bodyString, attempt + 1);
        }
        return {
            status: res.status,
            json
        };
    } catch (err) {
        clearTimeout(timer);
        if (attempt <= 2) {
            await new Promise((r)=>setTimeout(r, 1000));
            return executeAniListFetch(bodyString, attempt + 1);
        }
        throw err;
    }
}
async function POST(req) {
    try {
        const body = await req.json();
        const { query, variables } = body;
        const bodyString = JSON.stringify({
            query,
            variables
        });
        const cacheKey = bodyString;
        const cached = serverCache.get(cacheKey);
        const now = Date.now();
        // If cache is fresh, return immediately
        if (cached && now < cached.expires) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(cached.data, {
                status: cached.status,
                headers: {
                    'X-Cache': 'HIT'
                }
            });
        }
        try {
            const { status, json } = await executeAniListFetch(bodyString);
            if (status === 200 && json && !json.errors) {
                cleanCache();
                serverCache.set(cacheKey, {
                    data: json,
                    status,
                    expires: now + CACHE_TTL_MS,
                    staleUntil: now + STALE_TTL_MS
                });
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(json, {
                    status: 200,
                    headers: {
                        'X-Cache': 'MISS'
                    }
                });
            }
            // If rate limited or error, but we have a stale entry, serve stale!
            if (cached && now < cached.staleUntil) {
                console.warn(`[AniList Proxy] Serving stale cache due to upstream status ${status}`);
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(cached.data, {
                    status: 200,
                    headers: {
                        'X-Cache': 'STALE'
                    }
                });
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(json || {
                errors: [
                    {
                        message: `AniList error status ${status}`
                    }
                ]
            }, {
                status
            });
        } catch (fetchErr) {
            if (cached && now < cached.staleUntil) {
                console.warn(`[AniList Proxy] Serving stale cache due to fetch error: ${fetchErr.message}`);
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(cached.data, {
                    status: 200,
                    headers: {
                        'X-Cache': 'STALE'
                    }
                });
            }
            throw fetchErr;
        }
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            errors: [
                {
                    message: error.message || 'AniList Proxy Request Failed'
                }
            ]
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__51c6fdc8._.js.map