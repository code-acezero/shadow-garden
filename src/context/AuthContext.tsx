"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase"; 
import { Session, User, AuthChangeEvent } from "@supabase/supabase-js"; 

export interface SavedAccount {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  session: Session; 
  lastActive: number;
}

type AuthContextType = {
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  savedAccounts: SavedAccount[];
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  switchAccount: (accountId: string) => Promise<void>;
  removeAccount: (accountId: string) => void; 
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  savedAccounts: [],
  signOut: async () => {},
  refreshSession: async () => {},
  switchAccount: async () => {},
  removeAccount: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  
  const isMounted = useRef(true);
  const hasInitialized = useRef(false);
  const currentProfileId = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userMeta?: any) => {
    try {
        const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
        if (data) return data;
        return {
            id: userId,
            username: userMeta?.full_name || userEmail?.split('@')[0] || "Adventurer",
            email: userEmail,
            avatar_url: userMeta?.avatar_url,
            role: 'user',
            is_guest: false
        };
    } catch (e) { return null; }
  }, []);

  const updateSavedAccounts = useCallback((session: Session, profileData: any) => {
      if (!session?.user) return;
      setSavedAccounts(prev => {
          const existing = prev.filter(a => a.id !== session.user.id);
          const updated: SavedAccount = {
              id: session.user.id,
              email: session.user.email!,
              username: profileData?.username,
              avatar_url: profileData?.avatar_url,
              session: session,
              lastActive: Date.now()
          };
          const nextList = [updated, ...existing].slice(0, 2);
          if (typeof window !== 'undefined') localStorage.setItem('shadow_multi_auth', JSON.stringify(nextList));
          return nextList;
      });
  }, []);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    isMounted.current = true;

    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem('shadow_multi_auth');
            if (stored) setSavedAccounts(JSON.parse(stored));
        } catch(e) {}
    }

    const init = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && isMounted.current) {
                setUser(session.user);
                const profileData = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
                if (isMounted.current && profileData) {
                    setProfile(profileData);
                    currentProfileId.current = profileData.id;
                    updateSavedAccounts(session, profileData);
                }
            }
        } catch (e) { console.error("Auth Init error", e); } 
        finally { if (isMounted.current) setIsLoading(false); }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted.current) return;
        if (session?.user) {
            setUser(session.user);
            if (currentProfileId.current !== session.user.id) {
                const profileData = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
                if (isMounted.current && profileData) {
                    setProfile(profileData);
                    currentProfileId.current = profileData.id;
                    updateSavedAccounts(session, profileData);
                }
            }
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            currentProfileId.current = null;
        }
        if (isMounted.current) setIsLoading(false);
    });

    return () => { isMounted.current = false; subscription.unsubscribe(); };
  }, [fetchProfile, updateSavedAccounts]);

  const switchAccount = useCallback(async (accountId: string) => {
    const target = savedAccounts.find(a => a.id === accountId);
    if (!target) return;
    setIsLoading(true);
    await supabase.auth.setSession({ access_token: target.session.access_token, refresh_token: target.session.refresh_token });
    window.location.reload(); 
  }, [savedAccounts]);

  const removeAccount = useCallback((accountId: string) => {
    const nextList = savedAccounts.filter(a => a.id !== accountId);
    setSavedAccounts(nextList);
    if (typeof window !== 'undefined') localStorage.setItem('shadow_multi_auth', JSON.stringify(nextList));
    if (user?.id === accountId) {
      supabase.auth.signOut().then(() => { 
        setUser(null); 
        setProfile(null);
        currentProfileId.current = null;
      });
    }
  }, [savedAccounts, user]);

  // ✅ FIXED: Sequential "Remove -> SignOut -> Switch? -> Reload"
  const signOut = useCallback(async () => {
    try {
      const currentId = user?.id;
      // 1. Calculate remaining accounts (this is the list AFTER current is gone)
      const remainingAccounts = savedAccounts.filter(a => a.id !== currentId);
      
      // 2. Commit removal to Storage & State IMMEDIATELY
      if (typeof window !== 'undefined') {
          localStorage.setItem('shadow_multi_auth', JSON.stringify(remainingAccounts));
      }
      setSavedAccounts(remainingAccounts);

      // 3. Perform the Sign Out (Clears current session)
      await supabase.auth.signOut();
      
      // 4. Decision: Switch or Guest?
      if (remainingAccounts.length > 0) {
        // --- SWITCH LOGIC ---
        const nextAccount = remainingAccounts[0];
        
        // Restore session for the next account
        const { error } = await supabase.auth.setSession({
            access_token: nextAccount.session.access_token,
            refresh_token: nextAccount.session.refresh_token
        });

        if (error) {
            console.error("Switch failed, defaulting to guest", error);
        }
      } 
      
      // 5. FINAL STEP: Reload unconditionally.
      // If switch worked -> Loads as User B.
      // If switch failed/no accounts -> Loads as Guest.
      window.location.reload();
      
    } catch(e) {
      // Failsafe
      window.location.reload();
    }
  }, [savedAccounts, user]);

  const refreshSession = useCallback(async () => {
    try {
        const { data: { session } } = await supabase.auth.refreshSession();
        if (session?.user) {
            setUser(session.user);
            const profileData = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
            if (profileData) {
                setProfile(profileData);
                currentProfileId.current = profileData.id;
            }
        }
    } catch(e) {}
  }, [fetchProfile]);

  const value = useMemo(() => ({ user, profile, isLoading, savedAccounts, signOut, refreshSession, switchAccount, removeAccount }), 
    [user?.id, profile?.id, isLoading, savedAccounts.length, signOut, refreshSession, switchAccount, removeAccount]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);