module.exports = [
"[project]/src/context/AuthContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/User/AvatarSelectorModal.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
// ── Clean up any leftover multi-account localStorage keys from old system ────
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])({
    user: null,
    profile: null,
    isLoading: true,
    signOut: async ()=>{},
    refreshSession: async ()=>{}
});
const AuthProvider = ({ children })=>{
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const isMounted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(true);
    const currentProfileId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const fetchProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (userId, userEmail, userMeta)=>{
        try {
            // 8-second timeout to allow DB cold-starts while preventing infinite hangs
            const queryPromise = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from("profiles").select("*").eq("id", userId).single();
            const timeoutPromise = new Promise((_, reject)=>setTimeout(()=>reject(new Error("Timeout")), 8000));
            const { data } = await Promise.race([
                queryPromise,
                timeoutPromise
            ]);
            if (data) {
                if (!data.avatar_url || !data.username) {
                    const updatedName = data.username || userMeta?.full_name || userEmail?.split('@')[0] || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRandomGuestName"])();
                    const updatedAvatar = data.avatar_url || userMeta?.avatar_url || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRandomAvatar"])(false);
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from("profiles").update({
                        username: updatedName,
                        avatar_url: updatedAvatar
                    }).eq("id", userId).then(null, ()=>{});
                    return {
                        ...data,
                        username: updatedName,
                        avatar_url: updatedAvatar,
                        _isFallback: false
                    };
                }
                return {
                    ...data,
                    _isFallback: false
                };
            }
            return {
                id: userId,
                username: userMeta?.full_name || userEmail?.split('@')[0] || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRandomGuestName"])(),
                email: userEmail,
                avatar_url: userMeta?.avatar_url || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRandomAvatar"])(false),
                role: 'user',
                is_guest: false,
                _isFallback: true
            };
        } catch (e) {
            return {
                id: userId,
                username: userMeta?.full_name || userEmail?.split('@')[0] || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRandomGuestName"])(),
                email: userEmail,
                avatar_url: userMeta?.avatar_url || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRandomAvatar"])(false),
                role: 'user',
                is_guest: false,
                _isFallback: true
            };
        }
    }, []);
    const loadUserProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (u)=>{
        const profileData = await fetchProfile(u.id, u.email, u.user_metadata);
        if (!isMounted.current || !profileData) return;
        setProfile(profileData);
        if (profileData._isFallback) {
            // If DB timed out or blipped, schedule background retry to fetch full profile (level, frame, title)
            setTimeout(async ()=>{
                if (!isMounted.current) return;
                try {
                    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from("profiles").select("*").eq("id", u.id).single();
                    if (data && isMounted.current) {
                        setProfile({
                            ...data,
                            _isFallback: false
                        });
                        currentProfileId.current = u.id;
                    }
                } catch (err) {}
            }, 2500);
        } else {
            currentProfileId.current = u.id;
        }
    }, [
        fetchProfile
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        isMounted.current = true;
        const init = async ()=>{
            try {
                const sessionPromise = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
                const timeoutPromise = new Promise((resolve)=>setTimeout(()=>resolve({
                            data: {
                                session: null
                            }
                        }), 6000));
                const { data: { session } } = await Promise.race([
                    sessionPromise,
                    timeoutPromise
                ]);
                if (session?.user && isMounted.current) {
                    setUser(session.user);
                    if (currentProfileId.current !== session.user.id) {
                        await loadUserProfile(session.user);
                    }
                }
            } catch (e) {
                console.error("Auth Init error", e);
            } finally{
                if (isMounted.current) setIsLoading(false);
            }
        };
        init();
        const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange(async (event, session)=>{
            if (!isMounted.current) return;
            if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION' && currentProfileId.current) {
                if (session?.user) {
                    setUser((prev)=>prev?.id === session.user.id ? prev : session.user);
                }
                return;
            }
            if (session?.user) {
                setUser((prev)=>prev?.id === session.user.id ? prev : session.user);
                if (currentProfileId.current !== session.user.id) {
                    await loadUserProfile(session.user);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                currentProfileId.current = null;
            }
            if (isMounted.current) setIsLoading(false);
        });
        return ()=>{
            isMounted.current = false;
            subscription.unsubscribe();
        };
    }, [
        fetchProfile,
        loadUserProfile
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!user) return;
        const sendHeartbeat = ()=>{
            // Only send heartbeat if the tab is actively visible to prevent ghost online states
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update({
                    is_online: true,
                    updated_at: new Date().toISOString()
                }).eq('id', user.id).then(null, ()=>{});
            }
        };
        // Initial heartbeat
        sendHeartbeat();
        // Heartbeat every 2 minutes
        const interval = setInterval(sendHeartbeat, 2 * 60 * 1000);
        // Mark as offline when tab is closed
        const handleBeforeUnload = ()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update({
                is_online: false
            }).eq('id', user.id).then(null, ()=>{});
        };
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return ()=>{
            clearInterval(interval);
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
        };
    }, [
        user
    ]);
    const signOut = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        try {
            // Add a 2-second timeout to prevent signOut from hanging indefinitely
            await Promise.race([
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signOut(),
                new Promise((resolve)=>setTimeout(resolve, 2000))
            ]);
        } catch  {}
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, []);
    const refreshSession = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        try {
            const { data: { session } } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.refreshSession();
            if (session?.user) {
                setUser(session.user);
                const profileData = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
                if (profileData) {
                    setProfile(profileData);
                    currentProfileId.current = profileData.id;
                }
            }
        } catch (e) {}
    }, [
        fetchProfile
    ]);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            user,
            profile,
            isLoading,
            signOut,
            refreshSession
        }), [
        user,
        profile,
        isLoading,
        signOut,
        refreshSession
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/AuthContext.tsx",
        lineNumber: 221,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const useAuth = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
}),
"[project]/src/context/UserDataContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UserDataProvider",
    ()=>UserDataProvider,
    "useUserData",
    ()=>useUserData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
const UserDataContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])({
    library: [],
    continueData: [],
    loadingData: true,
    refreshData: async ()=>{},
    updateLibraryStatus: ()=>{},
    addToLibrary: ()=>{},
    removeFromLibrary: ()=>{},
    removeFromContinue: ()=>{},
    clearContinueData: ()=>{}
});
const getValidPoster = (...candidates)=>{
    for (const c of candidates){
        if (typeof c === 'string' && c.trim() !== '') return c.trim();
    }
    return "/images/no-poster.png";
};
const UserDataProvider = ({ children })=>{
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const [library, setLibrary] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [continueData, setContinueData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingData, setLoadingData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const refreshData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (isSilent = false)=>{
        if (!user) {
            setLibrary([]);
            try {
                const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
                const items = Object.values(localData).map((item)=>{
                    const rawProg = typeof item.progress === 'number' ? item.progress : 0;
                    const calculatedProgress = rawProg <= 100 ? rawProg : Math.min(Math.round(rawProg / (item.duration || 1350) * 100), 100);
                    return {
                        id: item.animeId || item.anime_id,
                        anime_id: item.animeId || item.anime_id,
                        title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatAnimeTitle"])(item.title || item.anime_title, item.animeId || item.anime_id),
                        poster: getValidPoster(item.poster, item.episode_image, item.anime_image),
                        episode: item.episodeNumber || item.episode_number || 1,
                        episodeId: item.episodeId || item.episode_id,
                        progress: calculatedProgress,
                        totalEpisodes: item.totalEpisodes || "?",
                        type: item.type || "TV",
                        ageRating: item.ageRating || item.age_rating || (item.isAdult || item.is_adult ? '18+' : null),
                        isAdult: item.isAdult || item.is_adult || false,
                        last_updated: item.lastUpdated ? new Date(item.lastUpdated).toISOString() : new Date().toISOString()
                    };
                });
                items.sort((a, b)=>new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
                setContinueData(items);
            } catch (e) {
                setContinueData([]);
            }
            setLoadingData(false);
            return;
        }
        // Only show loading spinner if data is not loaded yet (silent background refresh otherwise)
        if (!isSilent && library.length === 0 && continueData.length === 0) {
            setLoadingData(true);
        }
        try {
            const [watchlistRes, continueRes] = await Promise.all([
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('watchlist').select('*').eq('user_id', user.id).order('updated_at', {
                    ascending: false
                }),
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('user_continue_watching').select('*').eq('user_id', user.id).order('last_updated', {
                    ascending: false
                })
            ]);
            if (watchlistRes.data) {
                const dbData = watchlistRes.data;
                const enrichedLibrary = dbData.map((item)=>({
                        ...item,
                        id: item.anime_id,
                        title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatAnimeTitle"])(item.anime_title, item.anime_id),
                        poster: getValidPoster(item.anime_image, item.poster),
                        totalEpisodes: item.total_episodes || "?",
                        total_episodes: item.total_episodes || "?",
                        media_type: item.media_type || item.type || "anime",
                        type: item.type || item.media_type || "TV",
                        description: item.description || "",
                        ageRating: item.ageRating || null,
                        isAdult: item.isAdult || false,
                        status: item.status,
                        updated_at: item.updated_at
                    }));
                setLibrary(enrichedLibrary);
            }
            if (continueRes.data) {
                const dbData = continueRes.data;
                const uniqueMap = new Map();
                dbData.forEach((item)=>{
                    if (!uniqueMap.has(item.anime_id)) uniqueMap.set(item.anime_id, item);
                });
                const enriched = Array.from(uniqueMap.values()).map((item)=>{
                    const rawProg = item.progress || 0;
                    const calculatedProgress = rawProg <= 100 ? rawProg : Math.min(Math.round(rawProg / (item.duration || 1350) * 100), 100);
                    return {
                        ...item,
                        id: item.anime_id,
                        anime_id: item.anime_id,
                        title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatAnimeTitle"])(item.title || item.anime_title, item.anime_id),
                        poster: getValidPoster(item.banner_image, item.episode_image, item.anime_image, item.poster),
                        episode: item.episode_number,
                        episodeId: item.episode_id,
                        progress: calculatedProgress,
                        totalEpisodes: item.total_episodes || "?",
                        type: item.type || "TV",
                        ageRating: item.age_rating || item.ageRating || (item.is_adult || item.isAdult ? '18+' : null),
                        isAdult: item.is_adult || item.isAdult || false,
                        sub: undefined,
                        dub: undefined
                    };
                });
                setContinueData(enriched);
            }
        } catch (error) {
            console.error('Failed to load user data', error);
        } finally{
            setLoadingData(false);
        }
    }, [
        user,
        library.length,
        continueData.length
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        refreshData();
    }, [
        user
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleUpdate = ()=>{
            refreshData(true);
        };
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
        };
    }, [
        refreshData
    ]);
    const updateLibraryStatus = (animeId, newStatus)=>{
        setLibrary((prev)=>prev.map((item)=>item.anime_id === animeId ? {
                    ...item,
                    status: newStatus
                } : item));
    };
    const addToLibrary = (item)=>{
        setLibrary((prev)=>{
            const exists = prev.find((i)=>i.anime_id === item.anime_id);
            if (exists) {
                return prev.map((i)=>i.anime_id === item.anime_id ? {
                        ...i,
                        status: item.status
                    } : i);
            }
            return [
                item,
                ...prev
            ];
        });
    };
    const removeFromLibrary = (animeId)=>{
        setLibrary((prev)=>prev.filter((item)=>item.anime_id !== animeId));
    };
    const removeFromContinue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((animeId)=>{
        setContinueData((prev)=>prev.filter((item)=>item.anime_id !== animeId));
    }, []);
    const clearContinueData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setContinueData([]);
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(UserDataContext.Provider, {
        value: {
            library,
            continueData,
            loadingData,
            refreshData,
            updateLibraryStatus,
            addToLibrary,
            removeFromLibrary,
            removeFromContinue,
            clearContinueData
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/UserDataContext.tsx",
        lineNumber: 192,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
const useUserData = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(UserDataContext);
}),
"[project]/src/hooks/useSettings.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_SETTINGS",
    ()=>DEFAULT_SETTINGS,
    "SettingsProvider",
    ()=>SettingsProvider,
    "useSettings",
    ()=>useSettings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/toast.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
const DEFAULT_SETTINGS = {
    twoFactor: false,
    loginAlerts: true,
    incognito: false,
    publicActivity: true,
    allowRequests: true,
    autoPlay: true,
    autoSkipOpEd: true,
    resumePlayback: true,
    volumeBoost: false,
    defaultServer: 'hd-1',
    defaultQuality: '1080p',
    defaultAudio: 'jp',
    subLanguage: 'en',
    defaultVolume: 100,
    haptics: true,
    pipMode: true,
    accentColor: 'red',
    glassEffect: true,
    particles: true,
    reducedMotion: false,
    roundedUI: true,
    uiGlow: true,
    uiBorders: 'normal',
    cardVariant: 'default',
    fontFamily: 'inter',
    // ✅ ENABLED BY DEFAULT + SET TO HANA
    whisperEnabled: true,
    whisperVoice: 'hana',
    whisperVolume: 0.8,
    homeLayout: 'trending',
    listView: 'grid',
    showNSFW: false,
    blurSpoilers: true,
    hideFillers: true,
    useJapaneseTitle: false,
    pushNotifs: true,
    emailNotifs: false,
    newEpAlerts: true,
    communityAlerts: true,
    systemAlerts: true,
    // ✅ ENABLED BY DEFAULT
    enableWhisper: true,
    autoBackup: true,
    bandwidthSaver: false,
    hideOnlineStatus: false,
    hideLevelBadge: false
};
const SettingsContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
let providerMountCount = 0;
let effectRunCount = 0;
function SettingsProvider({ children }) {
    const mountId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(++providerMountCount);
    const { user, profile } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [settings, setSettings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [storageUsage, setStorageUsage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("0 KB");
    const debounceTimer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const hasInitialized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const userIdRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Apply Theme CSS Variables
    const applyThemeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])((s)=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const root = undefined;
        const palettes = undefined;
        const activePalette = undefined;
        const fontMap = undefined;
        const selectedFont = undefined;
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const currentUserId = user?.id || 'guest';
        const runId = ++effectRunCount;
        if (hasInitialized.current && userIdRef.current === currentUserId) return;
        hasInitialized.current = true;
        userIdRef.current = currentUserId;
        const key = user?.id ? `shadow_settings_${user.id}` : `shadow_settings_guest`;
        let currentSettings = {
            ...DEFAULT_SETTINGS
        };
        // 1. Local Storage
        const localData = localStorage.getItem(key);
        if (localData) {
            try {
                currentSettings = {
                    ...DEFAULT_SETTINGS,
                    ...JSON.parse(localData)
                };
            } catch (e) {
                console.error("Settings parse error");
            }
        }
        // 2. Profile Sync
        if (user && profile?.settings) {
            currentSettings = {
                ...currentSettings,
                ...profile.settings
            };
            // Override local shadow_player_prefs if DB has newer playerPrefs
            if (currentSettings.playerPrefs) {
                localStorage.setItem('shadow_player_prefs', JSON.stringify(currentSettings.playerPrefs));
            }
        }
        // --- ✅ FORCE-ACTIVATE DEFAULT VOICE (HANA) IF MISSING ---
        const voiceConfig = localStorage.getItem('shadow_voice_settings');
        if (!voiceConfig) {
            console.log("🔊 Injecting Default Voice Model: Hana");
            const defaultVoice = {
                pack: 'hana',
                language: 'en',
                volume: 0.8,
                speed: 1.0,
                pitch: 1.0
            };
            localStorage.setItem('shadow_voice_settings', JSON.stringify(defaultVoice));
            // Also sync it to our settings state just in case
            currentSettings.whisperVoice = 'hana'; // [!code highlight]
            currentSettings.whisperEnabled = true;
        }
        // ---------------------------------------------------
        setSettings(currentSettings);
        applyThemeRef.current(currentSettings);
        setIsLoaded(true);
        let total = 0;
        for(let x in localStorage){
            if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
                total += (localStorage[x].length + x.length) * 2;
            }
        }
        setStorageUsage((total / 1024).toFixed(2) + " KB");
    }, [
        user?.id,
        profile?.id
    ]);
    const updateSetting = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((key, value)=>{
        setSettings((prev)=>{
            const newSettings = {
                ...prev,
                [key]: value
            };
            const storageKey = user?.id ? `shadow_settings_${user.id}` : `shadow_settings_guest`;
            localStorage.setItem(storageKey, JSON.stringify(newSettings));
            if ([
                'accentColor',
                'fontFamily',
                'uiGlow',
                'uiBorders',
                'roundedUI'
            ].includes(key)) {
                applyThemeRef.current(newSettings);
                localStorage.setItem('shadow_theme_cache', JSON.stringify({
                    accentColor: newSettings.accentColor,
                    fontFamily: newSettings.fontFamily,
                    uiGlow: newSettings.uiGlow,
                    uiBorders: newSettings.uiBorders,
                    roundedUI: newSettings.roundedUI
                }));
            }
            if (user && newSettings.autoBackup) {
                if (debounceTimer.current) clearTimeout(debounceTimer.current);
                debounceTimer.current = setTimeout(async ()=>{
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update({
                        settings: newSettings
                    }).eq('id', user.id);
                }, 1000);
            }
            return newSettings;
        });
    }, [
        user
    ]);
    const resetSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const key = user?.id ? `shadow_settings_${user.id}` : `shadow_settings_guest`;
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem(key, JSON.stringify(DEFAULT_SETTINGS));
        applyThemeRef.current(DEFAULT_SETTINGS);
        if (user) __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update({
            settings: DEFAULT_SETTINGS
        }).eq('id', user.id);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].success("Factory Reset Complete");
    }, [
        user
    ]);
    const clearCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const key = user?.id ? `shadow_settings_${user.id}` : `shadow_settings_guest`;
        Object.keys(localStorage).forEach((k)=>{
            if (k !== key && !k.includes('sb-') && !k.includes('auth')) localStorage.removeItem(k);
        });
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].success("Cache Cleared");
    }, [
        user
    ]);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return {
            settings,
            updateSetting,
            resetSettings,
            isLoaded,
            storageUsage,
            clearCache
        };
    }, [
        settings,
        isLoaded,
        storageUsage,
        updateSetting,
        resetSettings,
        clearCache
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handlePlayerPrefsUpdate = (e)=>{
            if (e.detail && e.detail.playerPrefs) {
                updateSetting('playerPrefs', e.detail.playerPrefs);
            }
        };
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, [
        updateSetting
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SettingsContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/hooks/useSettings.tsx",
        lineNumber: 303,
        columnNumber: 5
    }, this);
}
function useSettings() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(SettingsContext);
    if (!context) throw new Error("useSettings must be used within a SettingsProvider");
    return context;
}
}),
"[project]/src/hooks/useTravellerProfile.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getStoredTravellerProfile",
    ()=>getStoredTravellerProfile,
    "saveTravellerProfile",
    ()=>saveTravellerProfile,
    "useTravellerProfile",
    ()=>useTravellerProfile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/User/AvatarSelectorModal.tsx [app-ssr] (ecmascript)");
"use client";
;
;
const FALLBACK_AVATAR = 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';
function getStoredTravellerProfile() {
    if ("TURBOPACK compile-time truthy", 1) return {
        name: 'Shadow Traveller',
        avatar: FALLBACK_AVATAR
    };
    //TURBOPACK unreachable
    ;
    let avatar;
    let name;
    let gender;
}
function saveTravellerProfile(profile) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    const current = undefined;
    const updated = undefined;
}
function useTravellerProfile() {
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        name: 'Shadow Traveller',
        avatar: FALLBACK_AVATAR
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setProfile(getStoredTravellerProfile());
        const handler = (e)=>{
            const detail = e.detail;
            if (detail) {
                setProfile((prev)=>({
                        name: detail.name || prev.name,
                        avatar: detail.avatar || prev.avatar,
                        gender: detail.gender || prev.gender
                    }));
            } else {
                setProfile(getStoredTravellerProfile());
            }
        };
        window.addEventListener('shadow-traveller-updated', handler);
        return ()=>window.removeEventListener('shadow-traveller-updated', handler);
    }, []);
    return profile;
}
}),
"[project]/src/hooks/useMentions.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useMentions",
    ()=>useMentions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-ssr] (ecmascript)");
;
;
function useMentions(text, onSelect) {
    const [mentionState, setMentionState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        isMentioning: false,
        query: '',
        startIndex: -1,
        users: [],
        selectedIndex: 0
    });
    const searchTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Basic mention detection looking for @word at the end of the cursor
        const lastWord = text.split(/\s/).pop() || '';
        if (lastWord.startsWith('@')) {
            const query = lastWord.substring(1);
            const startIndex = text.lastIndexOf('@');
            setMentionState((prev)=>({
                    ...prev,
                    isMentioning: true,
                    query,
                    startIndex
                }));
        } else {
            setMentionState((prev)=>({
                    ...prev,
                    isMentioning: false,
                    query: '',
                    startIndex: -1,
                    users: []
                }));
        }
    }, [
        text
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!mentionState.isMentioning) return;
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(async ()=>{
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) return;
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('id, username, avatar_url, role, admin_title, frame_id, level, title').ilike('username', `${mentionState.query}%`).limit(10);
            if (!error && data) {
                setMentionState((prev)=>({
                        ...prev,
                        users: data,
                        selectedIndex: 0
                    }));
            }
        }, 300);
        return ()=>{
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [
        mentionState.query,
        mentionState.isMentioning
    ]);
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        if (!mentionState.isMentioning || mentionState.users.length === 0) return false;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setMentionState((prev)=>({
                    ...prev,
                    selectedIndex: (prev.selectedIndex + 1) % prev.users.length
                }));
            return true;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setMentionState((prev)=>({
                    ...prev,
                    selectedIndex: prev.selectedIndex === 0 ? prev.users.length - 1 : prev.selectedIndex - 1
                }));
            return true;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            const selectedUser = mentionState.users[mentionState.selectedIndex];
            if (selectedUser) {
                onSelect(selectedUser.username);
                setMentionState((prev)=>({
                        ...prev,
                        isMentioning: false
                    }));
                return true;
            }
        }
        if (e.key === 'Escape') {
            setMentionState((prev)=>({
                    ...prev,
                    isMentioning: false
                }));
            return true;
        }
        return false;
    }, [
        mentionState,
        onSelect
    ]);
    const insertMention = (username)=>{
        if (mentionState.startIndex === -1) return text;
        const before = text.substring(0, mentionState.startIndex);
        return `${before}@${username} `;
    };
    return {
        mentionState,
        handleKeyDown,
        insertMention,
        setMentionState
    };
}
}),
];

//# sourceMappingURL=src_9c7cbc1b._.js.map