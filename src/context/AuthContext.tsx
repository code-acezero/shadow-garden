"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getRandomAvatar, getRandomGuestName } from "@/components/User/AvatarSelectorModal";

// ── Clean up any leftover multi-account localStorage keys from old system ────
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('shadow_multi_auth');
    localStorage.removeItem('shadow_saved_accounts');
  } catch {}
}

type AuthContextType = {
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isMounted = useRef(true);
  const currentProfileId = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userMeta?: any) => {
    try {
      // 4-second timeout to prevent network stalls on rapid reloads
      const queryPromise = supabase.from("profiles").select("*").eq("id", userId).single();
      const timeoutPromise = new Promise<{ data: any }>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 4000)
      );

      const { data }: { data: any } = await Promise.race([queryPromise, timeoutPromise]);
      if (data) {
        if (!data.avatar_url || !data.username) {
          const updatedName = data.username || userMeta?.full_name || userEmail?.split('@')[0] || getRandomGuestName();
          const updatedAvatar = data.avatar_url || userMeta?.avatar_url || getRandomAvatar(false);
          supabase.from("profiles").update({ username: updatedName, avatar_url: updatedAvatar }).eq("id", userId).catch(() => {});
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
    } catch (e) { 
      // Return fallback profile so user is NEVER disconnected on temporary network stalls or rate limits
      return {
        id: userId,
        username: userMeta?.full_name || userEmail?.split('@')[0] || getRandomGuestName(),
        email: userEmail,
        avatar_url: userMeta?.avatar_url || getRandomAvatar(false),
        role: 'user',
        is_guest: false
      };
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<any>((resolve) => 
          setTimeout(() => resolve({ data: { session: null } }), 4000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        if (session?.user && isMounted.current) {
          setUser(session.user);
          if (currentProfileId.current !== session.user.id) {
            const profileData = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
            if (isMounted.current && profileData) {
              setProfile(profileData);
              currentProfileId.current = profileData.id;
            }
          }
        }
      } catch (e) { console.error("Auth Init error", e); }
      finally { if (isMounted.current) setIsLoading(false); }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted.current) return;

      // Ignore silent refreshes & initial session if already handled
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || (event === 'INITIAL_SESSION' && currentProfileId.current)) {
        if (session?.user) {
          setUser(prev => (prev?.id === session.user.id ? prev : session.user));
        }
        return;
      }

      if (session?.user) {
        setUser(prev => (prev?.id === session.user.id ? prev : session.user));
        if (currentProfileId.current !== session.user.id) {
          const profileData = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
          if (isMounted.current && profileData) {
            setProfile(profileData);
            currentProfileId.current = profileData.id;
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
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try { 
      // Add a 2-second timeout to prevent signOut from hanging indefinitely
      await Promise.race([
        supabase.auth.signOut(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
    } catch {}
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('shadow_welcome_shown');
      window.location.assign('/home');
    }
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

  const value = useMemo(() => ({ user, profile, isLoading, signOut, refreshSession }),
    [user, profile, isLoading, signOut, refreshSession]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);