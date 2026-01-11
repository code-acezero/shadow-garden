"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/api';
// ADDED: AuthChangeEvent (This fixes the 'event' type error safely)
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

// --- TYPES ---
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string | null;
  banner_url?: string;
  bio?: string;
  gender?: string; 
  role: 'user' | 'moderator' | 'admin' | 'guest'; 
  xp_points?: number;
  is_guest?: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  updateGuestProfile: (data: Partial<Profile>) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- GUEST LOGIC ---
  const initializeGuest = () => {
    if (typeof window === 'undefined') return;
    try {
        const storedGuest = localStorage.getItem('shadow_guest');
        if (storedGuest) {
            setProfile(JSON.parse(storedGuest));
        } else {
            const newGuest: Profile = {
                id: `guest_${Date.now()}`,
                username: 'Guest Agent',
                full_name: 'Anonymous Shadow',
                avatar_url: null, 
                gender: 'male', 
                role: 'guest',
                is_guest: true,
                xp_points: 0
            };
            localStorage.setItem('shadow_guest', JSON.stringify(newGuest));
            setProfile(newGuest);
        }
    } catch (e) {
        console.error("Guest Init Error", e);
    }
  };

  const updateGuestProfile = (data: Partial<Profile>) => {
      if (!profile?.is_guest) return;
      const updated = { ...profile, ...data };
      setProfile(updated);
      localStorage.setItem('shadow_guest', JSON.stringify(updated));
  };

  const fetchProfile = async (userId: string) => {
      if (!supabase) return;
      try {
          const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
          
          // FIX: Explicitly check if data exists and cast it to 'any' or 'Profile' before spreading
          if (!error && data) {
              const userProfile = data as unknown as Profile; // Type casting fixes the "Spread types" error
              setProfile({ ...userProfile, is_guest: false });
          }
      } catch (err) {
          console.error("Fetch Profile Error (Ignored)", err);
      }
  };
  // --- INITIALIZATION EFFECT ---
  useEffect(() => {
    let mounted = true;

    const init = async () => {
        if (!supabase) { 
            if(mounted) { initializeGuest(); setIsLoading(false); }
            return; 
        }
        
        try {
            // Check for existing session first
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;

            if (mounted) {
                if (session?.user) {
                    setSession(session);
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    // Only initialize guest if explicitly NO session found (not an error)
                    initializeGuest();
                }
            }
        } catch (err: any) {
            // FIX: If AbortError, DO NOTHING. Do not force guest mode.
            // Let onAuthStateChange handle it.
            if (err.name === 'AbortError' || err.message?.includes('aborted')) {
                return;
            }
            console.error("Auth Init Error:", err);
            // Only force guest on REAL errors, not network cancellations
            if (mounted && !user) initializeGuest();
        } finally {
            if (mounted) setIsLoading(false);
        }
    };

    init();

    if (supabase) {
        // FIXED: Added types here to satisfy TypeScript.
        // This does NOT change the runtime logic or cause crashes.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            if (!mounted) return;
            
            // This listener is robust and recovers even if getSession was aborted
            if (session?.user) {
                setSession(session);
                setUser(session.user);
                // Only fetch profile if we haven't already (prevents flashing)
                if (!profile || profile.id !== session.user.id) {
                     await fetchProfile(session.user.id);
                }
            } else {
                setSession(null);
                setUser(null);
                // Only switch to guest on explicit sign out
                if (event === 'SIGNED_OUT' || !profile) {
                    initializeGuest();
                }
            }
            setIsLoading(false);
        });
        
        return () => {
            mounted = false;
            // Defensive check
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        };
    }
  }, []);

  const signOut = async () => {
      if (!supabase) return;
      try {
          await supabase.auth.signOut();
      } catch (e) { console.error(e); }
      
      localStorage.removeItem('shadow_guest');
      initializeGuest();
      window.location.reload(); 
  };

  const refreshProfile = async () => {
      if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ 
        session, user, profile, isLoading, 
        refreshProfile, signOut, updateGuestProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};