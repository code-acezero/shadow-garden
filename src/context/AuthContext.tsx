"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getRandomAvatar, getRandomGuestName } from "@/components/User/AvatarSelectorModal";

// ── SavedAccount: metadata only — NO session/token storage ──────────────────
// Storing tokens caused stale-token session invalidation on Vercel reloads.
// Now we only store display info; switching requires password re-entry.
export interface SavedAccount {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  lastActive: number;
}

type AuthContextType = {
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  savedAccounts: SavedAccount[];
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  switchAccount: (email: string, password: string) => Promise<{ error: string | null }>;
  removeAccount: (accountId: string) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  savedAccounts: [],
  signOut: async () => {},
  refreshSession: async () => {},
  switchAccount: async () => ({ error: null }),
  removeAccount: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  const isMounted = useRef(true);
  const currentProfileId = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userMeta?: any) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (data) {
        if (!data.avatar_url || !data.username) {
          const updatedName = data.username || userMeta?.full_name || userEmail?.split('@')[0] || getRandomGuestName();
          const updatedAvatar = data.avatar_url || userMeta?.avatar_url || getRandomAvatar(false);
          await supabase.from("profiles").update({ username: updatedName, avatar_url: updatedAvatar }).eq("id", userId);
          return { ...data, username: updatedName, avatar_url: updatedAvatar };
        }
        return data;
      }
      return {
        id: userId,
        username: userMeta?.full_name || userEmail?.split('@')[0] || getRandomGuestName(),
        email: userEmail,
        avatar_url: userMeta?.avatar_url || getRandomAvatar(false),
        role: 'user',
        is_guest: false
      };
    } catch (e) { return null; }
  }, []);

  // Persist only metadata (never tokens) to localStorage
  const updateSavedAccounts = useCallback((user: User, profileData: any) => {
    setSavedAccounts(prev => {
      const existing = prev.filter(a => a.id !== user.id);
      const updated: SavedAccount = {
        id: user.id,
        email: user.email!,
        username: profileData?.username,
        avatar_url: profileData?.avatar_url,
        lastActive: Date.now()
      };
      const nextList = [updated, ...existing];
      if (typeof window !== 'undefined') localStorage.setItem('shadow_saved_accounts', JSON.stringify(nextList));
      return nextList;
    });
  }, []);

  useEffect(() => {
    isMounted.current = true;

    // Load saved account metadata from localStorage (no tokens)
    if (typeof window !== 'undefined') {
      try {
        // Migrate old token-based storage if present
        const oldKey = localStorage.getItem('shadow_multi_auth');
        if (oldKey) {
          const old: any[] = JSON.parse(oldKey);
          // Strip session field, keep only metadata
          const migrated: SavedAccount[] = old.map(a => ({
            id: a.id,
            email: a.email,
            username: a.username,
            avatar_url: a.avatar_url,
            lastActive: a.lastActive || Date.now()
          }));
          localStorage.setItem('shadow_saved_accounts', JSON.stringify(migrated));
          localStorage.removeItem('shadow_multi_auth');
          setSavedAccounts(migrated);
        } else {
          const stored = localStorage.getItem('shadow_saved_accounts');
          if (stored) setSavedAccounts(JSON.parse(stored));
        }
      } catch (e) {}
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
            updateSavedAccounts(session.user, profileData);
          }
        }
      } catch (e) { console.error("Auth Init error", e); }
      finally { if (isMounted.current) setIsLoading(false); }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted.current) return;

      // Ignore silent refreshes — don't re-fetch profile on token rotation
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          setUser(prev => (prev?.id === session.user.id ? prev : session.user));
        }
        return;
      }

      if (session?.user) {
        setUser(prev => (prev?.id === session.user.id ? prev : session.user));
        // Only re-fetch profile on actual account change (fresh sign-in / switch)
        if (currentProfileId.current !== session.user.id) {
          const profileData = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
          if (isMounted.current && profileData) {
            setProfile(profileData);
            currentProfileId.current = profileData.id;
            updateSavedAccounts(session.user, profileData);
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

  // Switch account: sign out current, sign in fresh with password — no stale tokens
  const switchAccount = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      window.location.reload();
      return { error: null };
    } catch (e: any) {
      return { error: e?.message || 'Switch failed' };
    }
  }, []);

  const removeAccount = useCallback((accountId: string) => {
    setSavedAccounts(prev => {
      const nextList = prev.filter(a => a.id !== accountId);
      if (typeof window !== 'undefined') localStorage.setItem('shadow_saved_accounts', JSON.stringify(nextList));
      return nextList;
    });
    // If removing the active account, sign out to guest
    if (user?.id === accountId) {
      supabase.auth.signOut().then(() => {
        setUser(null);
        setProfile(null);
        currentProfileId.current = null;
      });
    }
  }, [user]);

  // Sign out: clear session, reload as guest (or to account picker if others saved)
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    window.location.reload();
  }, []);

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
    } catch (e) {}
  }, [fetchProfile]);

  const value = useMemo(() => ({ user, profile, isLoading, savedAccounts, signOut, refreshSession, switchAccount, removeAccount }),
    [user, profile, isLoading, savedAccounts, signOut, refreshSession, switchAccount, removeAccount]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);