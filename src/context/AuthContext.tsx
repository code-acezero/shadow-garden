"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase"; 
import { authLog } from "@/lib/debug"; 
import { AuthChangeEvent, Session } from "@supabase/supabase-js"; 

export interface SavedAccount {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  session: Session; 
  lastActive: number;
}

type AuthContextType = {
  user: any | null;
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
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  
  const mounted = useRef(false);

  const loadSavedAccounts = () => {
    if (typeof window === 'undefined') return;
    try {
        const stored = localStorage.getItem('shadow_multi_auth');
        if (stored) setSavedAccounts(JSON.parse(stored));
    } catch (e) { console.error("Failed to load accounts", e); }
  };

  const fetchProfile = async (currentUser: any) => {
    try {
        if (!currentUser?.id) return;
        const { data, error } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single();
        let currentProfile = data && !error ? data : {
            id: currentUser.id,
            username: currentUser.user_metadata?.full_name || "Shadow Agent",
            email: currentUser.email,
            is_guest: false
        };
        setProfile(currentProfile);
        return currentProfile;
    } catch (error: any) { if (error.name === 'AbortError') return; }
  };

  useEffect(() => {
    mounted.current = true;
    loadSavedAccounts(); 

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
            setUser(session.user);
            const userProfile = await fetchProfile(session.user);
            
            setSavedAccounts(prev => {
                const existing = prev.filter(a => a.id !== session.user.id);
                const updatedAccount: SavedAccount = {
                    id: session.user.id,
                    email: session.user.email!,
                    username: userProfile?.username || session.user.email?.split('@')[0],
                    avatar_url: userProfile?.avatar_url,
                    session: session, 
                    lastActive: Date.now()
                };
                const newAccounts = [updatedAccount, ...existing].slice(0, 2);
                localStorage.setItem('shadow_multi_auth', JSON.stringify(newAccounts));
                return newAccounts;
            });

            if (mounted.current) setIsLoading(false);
        } 
        else if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            if (mounted.current) setIsLoading(false);
        }
    });

    return () => { mounted.current = false; subscription.unsubscribe(); };
  }, []);

  const switchAccount = async (accountId: string) => {
    // 1. Local Update (Instant)
    const stored = localStorage.getItem('shadow_multi_auth');
    const accounts: SavedAccount[] = stored ? JSON.parse(stored) : savedAccounts;
    const target = accounts.find(a => a.id === accountId);
    
    if (!target) return;

    authLog('AUTH_ACTION', `Switching to ${target.username}...`);
    
    const updated = accounts.map(a => a.id === accountId ? { ...a, lastActive: Date.now() } : a)
                            .sort((a, b) => b.lastActive - a.lastActive);
    setSavedAccounts(updated);
    localStorage.setItem('shadow_multi_auth', JSON.stringify(updated));

    // 2. Network (Background)
    // We do NOT await this in the UI flow anymore to prevent blocking
    return supabase.auth.setSession(target.session);
  };

  const removeAccount = (accountId: string) => {
    // 1. Sync Storage Update (Crucial)
    const stored = localStorage.getItem('shadow_multi_auth');
    const currentList: SavedAccount[] = stored ? JSON.parse(stored) : [];
    const newList = currentList.filter(a => a.id !== accountId);
    
    localStorage.setItem('shadow_multi_auth', JSON.stringify(newList));
    setSavedAccounts(newList);
    
    // 2. Fire and Forget SignOut
    if (user?.id === accountId) {
        // Don't await. Just start it.
        supabase.auth.signOut().catch(() => {});
    }
  };

  const signOut = async () => {
    if (typeof window !== 'undefined') localStorage.removeItem('shadow_auth_hint');
    try {
        await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    setProfile(null);
  };

  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) { setUser(session.user); await fetchProfile(session.user); }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, savedAccounts, signOut, refreshSession, switchAccount, removeAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);