'use client';

import { useEffect, useRef } from 'react';
import { playVoice } from '@/lib/voice';
import { useAuth } from '@/context/AuthContext';

export default function VoiceInitializer() {
  // ✅ 1. Get profile directly from context (It's already fetched!)
  const { user, profile, isLoading } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (isLoading) return; 
    if (hasRun.current) return; 
    
    // Strict Reload Detection
    if (typeof window !== 'undefined') {
        const entries = performance.getEntriesByType("navigation");
        const navTiming = entries[0] as PerformanceNavigationTiming;
        if (navTiming && navTiming.type === 'reload') return; 
    }
    
    // Mark run BEFORE async logic to prevent double firing
    hasRun.current = true;

    const runVoice = async () => {
        try {
            const hasVisited = localStorage.getItem('shadow_has_visited');

            if (user) {
               // ✅ 2. Use context profile directly. No new Supabase calls.
               const isMaster = profile?.role === 'admin' || profile?.role === 'owner';
               playVoice(isMaster ? 'GREET_MASTER' : 'GREET_ADVENTURER');
               
               if (!hasVisited) localStorage.setItem('shadow_has_visited', 'true');
            } else {
               // Guest
               if (!hasVisited) {
                 playVoice('WELCOME');
                 localStorage.setItem('shadow_has_visited', 'true');
               } else {
                 playVoice('GREET_TRAVELER');
               }
            }
        } catch (e) {
            console.error("Voice Error", e);
        }
    };

    setTimeout(runVoice, 800);

  }, [user, profile, isLoading]); // ✅ Add profile to dependency

  return null;
}