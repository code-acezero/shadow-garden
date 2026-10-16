(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/hooks/useIsMobile.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useIsMobile",
    ()=>useIsMobile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
function useIsMobile() {
    let breakpoint = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 768;
    _s();
    const [isMobile, setIsMobile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useIsMobile.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const checkIsMobile = {
                "useIsMobile.useEffect.checkIsMobile": ()=>setIsMobile(window.innerWidth < breakpoint)
            }["useIsMobile.useEffect.checkIsMobile"];
            // Initial check
            checkIsMobile();
            window.addEventListener('resize', checkIsMobile);
            return ({
                "useIsMobile.useEffect": ()=>window.removeEventListener('resize', checkIsMobile)
            })["useIsMobile.useEffect"];
        }
    }["useIsMobile.useEffect"], [
        breakpoint
    ]);
    return isMobile;
}
_s(useIsMobile, "0VTTNJATKABQPGLm9RVT0tKGUgU=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/mentions.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderMentions",
    ()=>RenderMentions,
    "processMentionsAndNotify",
    ()=>processMentionsAndNotify
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
;
;
;
function RenderMentions(param) {
    let { content, className = '' } = param;
    if (!content) return null;
    // Regex to match @username or @[username]
    const mentionRegex = /(@[a-zA-Z0-9_-]+|@\[[a-zA-Z0-9_\s-]+\])/g;
    const parts = content.split(mentionRegex);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: className,
        children: parts.map((part, index)=>{
            if (part.match(/^@[a-zA-Z0-9_-]+$/)) {
                const username = part.slice(1);
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    href: "/profile/".concat(encodeURIComponent(username)),
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
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    href: "/profile/".concat(encodeURIComponent(username)),
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
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, {
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
_c = RenderMentions;
async function processMentionsAndNotify(supabase, content, senderId, senderName) {
    let targetType = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : 'post';
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
                    content: "🔔 @".concat(senderName || 'Someone', " mentioned you in a ").concat(targetType, ': "').concat(content.slice(0, 100), '..."')
                }));
            if (notifications.length > 0) {
                await supabase.from('notifications').insert(notifications);
            }
        }
    } catch (err) {
        console.error('Error processing mention notifications:', err);
    }
}
var _c;
__turbopack_context__.k.register(_c, "RenderMentions");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_8260a6b0._.js.map