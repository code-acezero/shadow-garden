(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/context/AuthContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/User/AvatarSelectorModal.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
// ── Clean up any leftover multi-account localStorage keys from old system ────
if ("TURBOPACK compile-time truthy", 1) {
    try {
        localStorage.removeItem('shadow_multi_auth');
        localStorage.removeItem('shadow_saved_accounts');
    } catch (e) {}
}
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])({
    user: null,
    profile: null,
    isLoading: true,
    signOut: async ()=>{},
    refreshSession: async ()=>{}
});
const AuthProvider = (param)=>{
    let { children } = param;
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const isMounted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(true);
    const currentProfileId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const fetchProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[fetchProfile]": async (userId, userEmail, userMeta)=>{
            try {
                // 8-second timeout to allow DB cold-starts while preventing infinite hangs
                const queryPromise = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from("profiles").select("*").eq("id", userId).single();
                const timeoutPromise = new Promise({
                    "AuthProvider.useCallback[fetchProfile]": (_, reject)=>setTimeout({
                            "AuthProvider.useCallback[fetchProfile]": ()=>reject(new Error("Timeout"))
                        }["AuthProvider.useCallback[fetchProfile]"], 8000)
                }["AuthProvider.useCallback[fetchProfile]"]);
                const { data } = await Promise.race([
                    queryPromise,
                    timeoutPromise
                ]);
                if (data) {
                    if (!data.avatar_url || !data.username) {
                        const updatedName = data.username || (userMeta === null || userMeta === void 0 ? void 0 : userMeta.full_name) || (userEmail === null || userEmail === void 0 ? void 0 : userEmail.split('@')[0]) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRandomGuestName"])();
                        const updatedAvatar = data.avatar_url || (userMeta === null || userMeta === void 0 ? void 0 : userMeta.avatar_url) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRandomAvatar"])(false);
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from("profiles").update({
                            username: updatedName,
                            avatar_url: updatedAvatar
                        }).eq("id", userId).then(null, {
                            "AuthProvider.useCallback[fetchProfile]": ()=>{}
                        }["AuthProvider.useCallback[fetchProfile]"]);
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
                    username: (userMeta === null || userMeta === void 0 ? void 0 : userMeta.full_name) || (userEmail === null || userEmail === void 0 ? void 0 : userEmail.split('@')[0]) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRandomGuestName"])(),
                    email: userEmail,
                    avatar_url: (userMeta === null || userMeta === void 0 ? void 0 : userMeta.avatar_url) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRandomAvatar"])(false),
                    role: 'user',
                    is_guest: false,
                    _isFallback: true
                };
            } catch (e) {
                return {
                    id: userId,
                    username: (userMeta === null || userMeta === void 0 ? void 0 : userMeta.full_name) || (userEmail === null || userEmail === void 0 ? void 0 : userEmail.split('@')[0]) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRandomGuestName"])(),
                    email: userEmail,
                    avatar_url: (userMeta === null || userMeta === void 0 ? void 0 : userMeta.avatar_url) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRandomAvatar"])(false),
                    role: 'user',
                    is_guest: false,
                    _isFallback: true
                };
            }
        }
    }["AuthProvider.useCallback[fetchProfile]"], []);
    const loadUserProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[loadUserProfile]": async (u)=>{
            const profileData = await fetchProfile(u.id, u.email, u.user_metadata);
            if (!isMounted.current || !profileData) return;
            setProfile(profileData);
            if (profileData._isFallback) {
                // If DB timed out or blipped, schedule background retry to fetch full profile (level, frame, title)
                setTimeout({
                    "AuthProvider.useCallback[loadUserProfile]": async ()=>{
                        if (!isMounted.current) return;
                        try {
                            const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from("profiles").select("*").eq("id", u.id).single();
                            if (data && isMounted.current) {
                                setProfile({
                                    ...data,
                                    _isFallback: false
                                });
                                currentProfileId.current = u.id;
                            }
                        } catch (err) {}
                    }
                }["AuthProvider.useCallback[loadUserProfile]"], 2500);
            } else {
                currentProfileId.current = u.id;
            }
        }
    }["AuthProvider.useCallback[loadUserProfile]"], [
        fetchProfile
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            isMounted.current = true;
            const init = {
                "AuthProvider.useEffect.init": async ()=>{
                    try {
                        const sessionPromise = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
                        const timeoutPromise = new Promise({
                            "AuthProvider.useEffect.init": (resolve)=>setTimeout({
                                    "AuthProvider.useEffect.init": ()=>resolve({
                                            data: {
                                                session: null
                                            }
                                        })
                                }["AuthProvider.useEffect.init"], 6000)
                        }["AuthProvider.useEffect.init"]);
                        const { data: { session } } = await Promise.race([
                            sessionPromise,
                            timeoutPromise
                        ]);
                        if ((session === null || session === void 0 ? void 0 : session.user) && isMounted.current) {
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
                }
            }["AuthProvider.useEffect.init"];
            init();
            const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange({
                "AuthProvider.useEffect": async (event, session)=>{
                    if (!isMounted.current) return;
                    if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION' && currentProfileId.current) {
                        if (session === null || session === void 0 ? void 0 : session.user) {
                            setUser({
                                "AuthProvider.useEffect": (prev)=>(prev === null || prev === void 0 ? void 0 : prev.id) === session.user.id ? prev : session.user
                            }["AuthProvider.useEffect"]);
                        }
                        return;
                    }
                    if (session === null || session === void 0 ? void 0 : session.user) {
                        setUser({
                            "AuthProvider.useEffect": (prev)=>(prev === null || prev === void 0 ? void 0 : prev.id) === session.user.id ? prev : session.user
                        }["AuthProvider.useEffect"]);
                        if (currentProfileId.current !== session.user.id) {
                            await loadUserProfile(session.user);
                        }
                    } else if (event === 'SIGNED_OUT') {
                        setUser(null);
                        setProfile(null);
                        currentProfileId.current = null;
                    }
                    if (isMounted.current) setIsLoading(false);
                }
            }["AuthProvider.useEffect"]);
            return ({
                "AuthProvider.useEffect": ()=>{
                    isMounted.current = false;
                    subscription.unsubscribe();
                }
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], [
        fetchProfile,
        loadUserProfile
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            if (!user) return;
            const sendHeartbeat = {
                "AuthProvider.useEffect.sendHeartbeat": ()=>{
                    // Only send heartbeat if the tab is actively visible to prevent ghost online states
                    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update({
                            is_online: true,
                            updated_at: new Date().toISOString()
                        }).eq('id', user.id).then(null, {
                            "AuthProvider.useEffect.sendHeartbeat": ()=>{}
                        }["AuthProvider.useEffect.sendHeartbeat"]);
                    }
                }
            }["AuthProvider.useEffect.sendHeartbeat"];
            // Initial heartbeat
            sendHeartbeat();
            // Heartbeat every 2 minutes
            const interval = setInterval(sendHeartbeat, 2 * 60 * 1000);
            // Mark as offline when tab is closed
            const handleBeforeUnload = {
                "AuthProvider.useEffect.handleBeforeUnload": ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update({
                        is_online: false
                    }).eq('id', user.id).then(null, {
                        "AuthProvider.useEffect.handleBeforeUnload": ()=>{}
                    }["AuthProvider.useEffect.handleBeforeUnload"]);
                }
            }["AuthProvider.useEffect.handleBeforeUnload"];
            if ("TURBOPACK compile-time truthy", 1) {
                window.addEventListener('beforeunload', handleBeforeUnload);
            }
            return ({
                "AuthProvider.useEffect": ()=>{
                    clearInterval(interval);
                    if ("TURBOPACK compile-time truthy", 1) {
                        window.removeEventListener('beforeunload', handleBeforeUnload);
                    }
                }
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], [
        user
    ]);
    const signOut = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[signOut]": async ()=>{
            try {
                // Add a 2-second timeout to prevent signOut from hanging indefinitely
                await Promise.race([
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut(),
                    new Promise({
                        "AuthProvider.useCallback[signOut]": (resolve)=>setTimeout(resolve, 2000)
                    }["AuthProvider.useCallback[signOut]"])
                ]);
            } catch (e) {}
            if ("TURBOPACK compile-time truthy", 1) {
                sessionStorage.removeItem('shadow_welcome_shown');
                window.location.assign('/home');
            }
        }
    }["AuthProvider.useCallback[signOut]"], []);
    const refreshSession = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[refreshSession]": async ()=>{
            try {
                const { data: { session } } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.refreshSession();
                if (session === null || session === void 0 ? void 0 : session.user) {
                    setUser(session.user);
                    const profileData = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
                    if (profileData) {
                        setProfile(profileData);
                        currentProfileId.current = profileData.id;
                    }
                }
            } catch (e) {}
        }
    }["AuthProvider.useCallback[refreshSession]"], [
        fetchProfile
    ]);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AuthProvider.useMemo[value]": ()=>({
                user,
                profile,
                isLoading,
                signOut,
                refreshSession
            })
    }["AuthProvider.useMemo[value]"], [
        user,
        profile,
        isLoading,
        signOut,
        refreshSession
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/AuthContext.tsx",
        lineNumber: 221,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(AuthProvider, "g1z7Bv/qeCg6qXy/c1RPi2tyZ1w=");
_c = AuthProvider;
const useAuth = ()=>{
    _s1();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
};
_s1(useAuth, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/context/UserDataContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UserDataProvider",
    ()=>UserDataProvider,
    "useUserData",
    ()=>useUserData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
const UserDataContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])({
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
const getValidPoster = function() {
    for(var _len = arguments.length, candidates = new Array(_len), _key = 0; _key < _len; _key++){
        candidates[_key] = arguments[_key];
    }
    for (const c of candidates){
        if (typeof c === 'string' && c.trim() !== '') return c.trim();
    }
    return "/images/no-poster.png";
};
const UserDataProvider = (param)=>{
    let { children } = param;
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const [library, setLibrary] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [continueData, setContinueData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingData, setLoadingData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const refreshData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "UserDataProvider.useCallback[refreshData]": async function() {
            let isSilent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
            if (!user) {
                setLibrary([]);
                try {
                    const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
                    const items = Object.values(localData).map({
                        "UserDataProvider.useCallback[refreshData].items": (item)=>{
                            const rawProg = typeof item.progress === 'number' ? item.progress : 0;
                            const calculatedProgress = rawProg <= 100 ? rawProg : Math.min(Math.round(rawProg / (item.duration || 1350) * 100), 100);
                            return {
                                id: item.animeId || item.anime_id,
                                anime_id: item.animeId || item.anime_id,
                                title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatAnimeTitle"])(item.title || item.anime_title, item.animeId || item.anime_id),
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
                        }
                    }["UserDataProvider.useCallback[refreshData].items"]);
                    items.sort({
                        "UserDataProvider.useCallback[refreshData]": (a, b)=>new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
                    }["UserDataProvider.useCallback[refreshData]"]);
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
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('watchlist').select('*').eq('user_id', user.id).order('updated_at', {
                        ascending: false
                    }),
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('user_continue_watching').select('*').eq('user_id', user.id).order('last_updated', {
                        ascending: false
                    })
                ]);
                if (watchlistRes.data) {
                    const dbData = watchlistRes.data;
                    const enrichedLibrary = dbData.map({
                        "UserDataProvider.useCallback[refreshData].enrichedLibrary": (item)=>({
                                ...item,
                                id: item.anime_id,
                                title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatAnimeTitle"])(item.anime_title, item.anime_id),
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
                            })
                    }["UserDataProvider.useCallback[refreshData].enrichedLibrary"]);
                    setLibrary(enrichedLibrary);
                }
                if (continueRes.data) {
                    const dbData = continueRes.data;
                    const uniqueMap = new Map();
                    dbData.forEach({
                        "UserDataProvider.useCallback[refreshData]": (item)=>{
                            if (!uniqueMap.has(item.anime_id)) uniqueMap.set(item.anime_id, item);
                        }
                    }["UserDataProvider.useCallback[refreshData]"]);
                    const enriched = Array.from(uniqueMap.values()).map({
                        "UserDataProvider.useCallback[refreshData].enriched": (item)=>{
                            const rawProg = item.progress || 0;
                            const calculatedProgress = rawProg <= 100 ? rawProg : Math.min(Math.round(rawProg / (item.duration || 1350) * 100), 100);
                            return {
                                ...item,
                                id: item.anime_id,
                                anime_id: item.anime_id,
                                title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatAnimeTitle"])(item.title || item.anime_title, item.anime_id),
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
                        }
                    }["UserDataProvider.useCallback[refreshData].enriched"]);
                    setContinueData(enriched);
                }
            } catch (error) {
                console.error('Failed to load user data', error);
            } finally{
                setLoadingData(false);
            }
        }
    }["UserDataProvider.useCallback[refreshData]"], [
        user,
        library.length,
        continueData.length
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UserDataProvider.useEffect": ()=>{
            refreshData();
        }
    }["UserDataProvider.useEffect"], [
        user
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UserDataProvider.useEffect": ()=>{
            const handleUpdate = {
                "UserDataProvider.useEffect.handleUpdate": ()=>{
                    refreshData(true);
                }
            }["UserDataProvider.useEffect.handleUpdate"];
            if ("TURBOPACK compile-time truthy", 1) {
                window.addEventListener('shadow-continue-updated', handleUpdate);
            }
            return ({
                "UserDataProvider.useEffect": ()=>{
                    if ("TURBOPACK compile-time truthy", 1) {
                        window.removeEventListener('shadow-continue-updated', handleUpdate);
                    }
                }
            })["UserDataProvider.useEffect"];
        }
    }["UserDataProvider.useEffect"], [
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
    const removeFromContinue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "UserDataProvider.useCallback[removeFromContinue]": (animeId)=>{
            setContinueData({
                "UserDataProvider.useCallback[removeFromContinue]": (prev)=>prev.filter({
                        "UserDataProvider.useCallback[removeFromContinue]": (item)=>item.anime_id !== animeId
                    }["UserDataProvider.useCallback[removeFromContinue]"])
            }["UserDataProvider.useCallback[removeFromContinue]"]);
        }
    }["UserDataProvider.useCallback[removeFromContinue]"], []);
    const clearContinueData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "UserDataProvider.useCallback[clearContinueData]": ()=>{
            setContinueData([]);
        }
    }["UserDataProvider.useCallback[clearContinueData]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(UserDataContext.Provider, {
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
_s(UserDataProvider, "qwdfn8G8Yni7UYyIwmn5vNJxN3w=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = UserDataProvider;
const useUserData = ()=>{
    _s1();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(UserDataContext);
};
_s1(useUserData, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
var _c;
__turbopack_context__.k.register(_c, "UserDataProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useSettings.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_SETTINGS",
    ()=>DEFAULT_SETTINGS,
    "SettingsProvider",
    ()=>SettingsProvider,
    "useSettings",
    ()=>useSettings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/toast.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
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
const SettingsContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
let providerMountCount = 0;
let effectRunCount = 0;
function SettingsProvider(param) {
    let { children } = param;
    _s();
    const mountId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(++providerMountCount);
    const { user, profile } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [settings, setSettings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [storageUsage, setStorageUsage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("0 KB");
    const debounceTimer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const hasInitialized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const userIdRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Apply Theme CSS Variables
    const applyThemeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        "SettingsProvider.useRef[applyThemeRef]": (s)=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const root = document.documentElement;
            const palettes = {
                red: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                    950: '#450a0a'
                },
                orange: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                    600: '#ea580c',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                    950: '#431407'
                },
                gold: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                    950: '#451a03'
                },
                lime: {
                    50: '#f7fee7',
                    100: '#ecfccb',
                    200: '#d9f99d',
                    300: '#bef264',
                    400: '#a3e635',
                    500: '#84cc16',
                    600: '#65a30d',
                    700: '#4d7c0f',
                    800: '#3f6212',
                    900: '#365314',
                    950: '#1a2e05'
                },
                green: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                    950: '#052e16'
                },
                teal: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                    950: '#042f2e'
                },
                cyan: {
                    50: '#ecfeff',
                    100: '#cffafe',
                    200: '#a5f3fc',
                    300: '#67e8f9',
                    400: '#22d3ee',
                    500: '#06b6d4',
                    600: '#0891b2',
                    700: '#0e7490',
                    800: '#155e75',
                    900: '#164e63',
                    950: '#083344'
                },
                blue: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                    950: '#172554'
                },
                indigo: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b'
                },
                violet: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                    950: '#2e1065'
                },
                purple: {
                    50: '#faf5ff',
                    100: '#f3e8ff',
                    200: '#e9d5ff',
                    300: '#d8b4fe',
                    400: '#c084fc',
                    500: '#a855f7',
                    600: '#9333ea',
                    700: '#7e22ce',
                    800: '#6b21a8',
                    900: '#581c87',
                    950: '#3b0764'
                },
                pink: {
                    50: '#fdf2f8',
                    100: '#fce7f3',
                    200: '#fbcfe8',
                    300: '#f9a8d4',
                    400: '#f472b6',
                    500: '#ec4899',
                    600: '#db2777',
                    700: '#be123c',
                    800: '#9d174d',
                    900: '#831843',
                    950: '#500724'
                },
                rose: {
                    50: '#fff1f2',
                    100: '#ffe4e6',
                    200: '#fecdd3',
                    300: '#fda4af',
                    400: '#fb7185',
                    500: '#f43f5e',
                    600: '#e11d48',
                    700: '#be123c',
                    800: '#9f1239',
                    900: '#881337',
                    950: '#4c0519'
                },
                mono: {
                    50: '#fafafa',
                    100: '#f4f4f5',
                    200: '#e4e4e7',
                    300: '#d4d4d8',
                    400: '#a1a1aa',
                    500: '#71717a',
                    600: '#52525b',
                    700: '#3f3f46',
                    800: '#27272a',
                    900: '#18181b',
                    950: '#09090b'
                }
            };
            const activePalette = palettes[s.accentColor] || palettes['red'];
            Object.keys(activePalette).forEach({
                "SettingsProvider.useRef[applyThemeRef]": (shade)=>root.style.setProperty("--primary-".concat(shade), activePalette[shade])
            }["SettingsProvider.useRef[applyThemeRef]"]);
            root.style.setProperty('--primary-color', activePalette[600]);
            const fontMap = {
                'inter': 'var(--font-sans)',
                'badUnicorn': 'var(--font-bad-unicorn)',
                'demoness': 'var(--font-gradvis)',
                'horrorshow': 'var(--font-above)',
                'hunters': 'var(--font-minomu)',
                'kareudon': 'var(--font-kareudon)',
                'monas': 'var(--font-monas)',
                'nyctophobia': 'var(--font-above)',
                'onePiece': 'var(--font-one-piece)'
            };
            const selectedFont = fontMap[s.fontFamily] || 'var(--font-sans)';
            root.style.setProperty('--font-primary', selectedFont);
            root.style.setProperty('--font-sans', selectedFont);
            root.style.setProperty('--radius', s.roundedUI ? '0.75rem' : '0rem');
            root.style.setProperty('--border-width', s.uiBorders === 'thick' ? '2px' : '1px');
            root.style.setProperty('--glow-opacity', s.uiGlow ? '1' : '0');
        }
    }["SettingsProvider.useRef[applyThemeRef]"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SettingsProvider.useEffect": ()=>{
            const currentUserId = (user === null || user === void 0 ? void 0 : user.id) || 'guest';
            const runId = ++effectRunCount;
            if (hasInitialized.current && userIdRef.current === currentUserId) return;
            hasInitialized.current = true;
            userIdRef.current = currentUserId;
            const key = (user === null || user === void 0 ? void 0 : user.id) ? "shadow_settings_".concat(user.id) : "shadow_settings_guest";
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
            if (user && (profile === null || profile === void 0 ? void 0 : profile.settings)) {
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
        }
    }["SettingsProvider.useEffect"], [
        user === null || user === void 0 ? void 0 : user.id,
        profile === null || profile === void 0 ? void 0 : profile.id
    ]);
    const updateSetting = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SettingsProvider.useCallback[updateSetting]": (key, value)=>{
            setSettings({
                "SettingsProvider.useCallback[updateSetting]": (prev)=>{
                    const newSettings = {
                        ...prev,
                        [key]: value
                    };
                    const storageKey = (user === null || user === void 0 ? void 0 : user.id) ? "shadow_settings_".concat(user.id) : "shadow_settings_guest";
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
                        debounceTimer.current = setTimeout({
                            "SettingsProvider.useCallback[updateSetting]": async ()=>{
                                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update({
                                    settings: newSettings
                                }).eq('id', user.id);
                            }
                        }["SettingsProvider.useCallback[updateSetting]"], 1000);
                    }
                    return newSettings;
                }
            }["SettingsProvider.useCallback[updateSetting]"]);
        }
    }["SettingsProvider.useCallback[updateSetting]"], [
        user
    ]);
    const resetSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SettingsProvider.useCallback[resetSettings]": ()=>{
            const key = (user === null || user === void 0 ? void 0 : user.id) ? "shadow_settings_".concat(user.id) : "shadow_settings_guest";
            setSettings(DEFAULT_SETTINGS);
            localStorage.setItem(key, JSON.stringify(DEFAULT_SETTINGS));
            applyThemeRef.current(DEFAULT_SETTINGS);
            if (user) __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update({
                settings: DEFAULT_SETTINGS
            }).eq('id', user.id);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success("Factory Reset Complete");
        }
    }["SettingsProvider.useCallback[resetSettings]"], [
        user
    ]);
    const clearCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SettingsProvider.useCallback[clearCache]": ()=>{
            const key = (user === null || user === void 0 ? void 0 : user.id) ? "shadow_settings_".concat(user.id) : "shadow_settings_guest";
            Object.keys(localStorage).forEach({
                "SettingsProvider.useCallback[clearCache]": (k)=>{
                    if (k !== key && !k.includes('sb-') && !k.includes('auth')) localStorage.removeItem(k);
                }
            }["SettingsProvider.useCallback[clearCache]"]);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success("Cache Cleared");
        }
    }["SettingsProvider.useCallback[clearCache]"], [
        user
    ]);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SettingsProvider.useMemo[value]": ()=>{
            return {
                settings,
                updateSetting,
                resetSettings,
                isLoaded,
                storageUsage,
                clearCache
            };
        }
    }["SettingsProvider.useMemo[value]"], [
        settings,
        isLoaded,
        storageUsage,
        updateSetting,
        resetSettings,
        clearCache
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SettingsProvider.useEffect": ()=>{
            const handlePlayerPrefsUpdate = {
                "SettingsProvider.useEffect.handlePlayerPrefsUpdate": (e)=>{
                    if (e.detail && e.detail.playerPrefs) {
                        updateSetting('playerPrefs', e.detail.playerPrefs);
                    }
                }
            }["SettingsProvider.useEffect.handlePlayerPrefsUpdate"];
            if ("TURBOPACK compile-time truthy", 1) {
                window.addEventListener('update_player_prefs', handlePlayerPrefsUpdate);
                return ({
                    "SettingsProvider.useEffect": ()=>window.removeEventListener('update_player_prefs', handlePlayerPrefsUpdate)
                })["SettingsProvider.useEffect"];
            }
        }
    }["SettingsProvider.useEffect"], [
        updateSetting
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SettingsContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/hooks/useSettings.tsx",
        lineNumber: 303,
        columnNumber: 5
    }, this);
}
_s(SettingsProvider, "L6AjnjCXYZQcDtJYh0MGz8fRZ74=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = SettingsProvider;
function useSettings() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(SettingsContext);
    if (!context) throw new Error("useSettings must be used within a SettingsProvider");
    return context;
}
_s1(useSettings, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "SettingsProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useTravellerProfile.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getStoredTravellerProfile",
    ()=>getStoredTravellerProfile,
    "saveTravellerProfile",
    ()=>saveTravellerProfile,
    "useTravellerProfile",
    ()=>useTravellerProfile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/User/AvatarSelectorModal.tsx [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const FALLBACK_AVATAR = 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';
function getStoredTravellerProfile() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    let avatar = localStorage.getItem('shadow_traveller_avatar');
    let name = localStorage.getItem('shadow_traveller_name');
    let gender = localStorage.getItem('shadow_traveller_gender');
    if (!name || !name.trim()) {
        name = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRandomGuestName"])();
        localStorage.setItem('shadow_traveller_name', name);
    }
    if (!avatar || !avatar.trim()) {
        avatar = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$User$2f$AvatarSelectorModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRandomAvatar"])(true, gender || undefined);
        localStorage.setItem('shadow_traveller_avatar', avatar);
    }
    return {
        name,
        avatar,
        gender: gender || undefined
    };
}
function saveTravellerProfile(profile) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const current = getStoredTravellerProfile();
    const updated = {
        name: profile.name !== undefined && profile.name.trim() !== '' ? profile.name.trim() : current.name,
        avatar: profile.avatar !== undefined && profile.avatar.trim() !== '' ? profile.avatar.trim() : current.avatar,
        gender: profile.gender !== undefined ? profile.gender : current.gender
    };
    localStorage.setItem('shadow_traveller_name', updated.name);
    localStorage.setItem('shadow_traveller_avatar', updated.avatar);
    if (updated.gender) localStorage.setItem('shadow_traveller_gender', updated.gender);
    window.dispatchEvent(new CustomEvent('shadow-traveller-updated', {
        detail: updated
    }));
    return updated;
}
function useTravellerProfile() {
    _s();
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        name: 'Shadow Traveller',
        avatar: FALLBACK_AVATAR
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useTravellerProfile.useEffect": ()=>{
            setProfile(getStoredTravellerProfile());
            const handler = {
                "useTravellerProfile.useEffect.handler": (e)=>{
                    const detail = e.detail;
                    if (detail) {
                        setProfile({
                            "useTravellerProfile.useEffect.handler": (prev)=>({
                                    name: detail.name || prev.name,
                                    avatar: detail.avatar || prev.avatar,
                                    gender: detail.gender || prev.gender
                                })
                        }["useTravellerProfile.useEffect.handler"]);
                    } else {
                        setProfile(getStoredTravellerProfile());
                    }
                }
            }["useTravellerProfile.useEffect.handler"];
            window.addEventListener('shadow-traveller-updated', handler);
            return ({
                "useTravellerProfile.useEffect": ()=>window.removeEventListener('shadow-traveller-updated', handler)
            })["useTravellerProfile.useEffect"];
        }
    }["useTravellerProfile.useEffect"], []);
    return profile;
}
_s(useTravellerProfile, "F6JtLJXvJl9HT1CRHCNXkVh6Aps=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useMentions.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useMentions",
    ()=>useMentions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
function useMentions(text, onSelect) {
    _s();
    const [mentionState, setMentionState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        isMentioning: false,
        query: '',
        startIndex: -1,
        users: [],
        selectedIndex: 0
    });
    const searchTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useMentions.useEffect": ()=>{
            // Basic mention detection looking for @word at the end of the cursor
            const lastWord = text.split(/\s/).pop() || '';
            if (lastWord.startsWith('@')) {
                const query = lastWord.substring(1);
                const startIndex = text.lastIndexOf('@');
                setMentionState({
                    "useMentions.useEffect": (prev)=>({
                            ...prev,
                            isMentioning: true,
                            query,
                            startIndex
                        })
                }["useMentions.useEffect"]);
            } else {
                setMentionState({
                    "useMentions.useEffect": (prev)=>({
                            ...prev,
                            isMentioning: false,
                            query: '',
                            startIndex: -1,
                            users: []
                        })
                }["useMentions.useEffect"]);
            }
        }
    }["useMentions.useEffect"], [
        text
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useMentions.useEffect": ()=>{
            if (!mentionState.isMentioning) return;
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout({
                "useMentions.useEffect": async ()=>{
                    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"]) return;
                    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('id, username, avatar_url, role, admin_title, frame_id, level, title').ilike('username', "".concat(mentionState.query, "%")).limit(10);
                    if (!error && data) {
                        setMentionState({
                            "useMentions.useEffect": (prev)=>({
                                    ...prev,
                                    users: data,
                                    selectedIndex: 0
                                })
                        }["useMentions.useEffect"]);
                    }
                }
            }["useMentions.useEffect"], 300);
            return ({
                "useMentions.useEffect": ()=>{
                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                }
            })["useMentions.useEffect"];
        }
    }["useMentions.useEffect"], [
        mentionState.query,
        mentionState.isMentioning
    ]);
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMentions.useCallback[handleKeyDown]": (e)=>{
            if (!mentionState.isMentioning || mentionState.users.length === 0) return false;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionState({
                    "useMentions.useCallback[handleKeyDown]": (prev)=>({
                            ...prev,
                            selectedIndex: (prev.selectedIndex + 1) % prev.users.length
                        })
                }["useMentions.useCallback[handleKeyDown]"]);
                return true;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionState({
                    "useMentions.useCallback[handleKeyDown]": (prev)=>({
                            ...prev,
                            selectedIndex: prev.selectedIndex === 0 ? prev.users.length - 1 : prev.selectedIndex - 1
                        })
                }["useMentions.useCallback[handleKeyDown]"]);
                return true;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const selectedUser = mentionState.users[mentionState.selectedIndex];
                if (selectedUser) {
                    onSelect(selectedUser.username);
                    setMentionState({
                        "useMentions.useCallback[handleKeyDown]": (prev)=>({
                                ...prev,
                                isMentioning: false
                            })
                    }["useMentions.useCallback[handleKeyDown]"]);
                    return true;
                }
            }
            if (e.key === 'Escape') {
                setMentionState({
                    "useMentions.useCallback[handleKeyDown]": (prev)=>({
                            ...prev,
                            isMentioning: false
                        })
                }["useMentions.useCallback[handleKeyDown]"]);
                return true;
            }
            return false;
        }
    }["useMentions.useCallback[handleKeyDown]"], [
        mentionState,
        onSelect
    ]);
    const insertMention = (username)=>{
        if (mentionState.startIndex === -1) return text;
        const before = text.substring(0, mentionState.startIndex);
        return "".concat(before, "@").concat(username, " ");
    };
    return {
        mentionState,
        handleKeyDown,
        insertMention,
        setMentionState
    };
}
_s(useMentions, "zJ7v3WyUawAs4Q2adwjXWdcUw6I=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_a70203a7._.js.map