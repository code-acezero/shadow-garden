"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const hasIncrementedVisit = useRef(false);

  // 1. Track Page Visits
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Local visit tracking
    try {
      const currentVisits = parseInt(localStorage.getItem('shadow_total_visits') || '0', 10);
      const sessionVisited = sessionStorage.getItem('shadow_session_active');

      if (!sessionVisited) {
        sessionStorage.setItem('shadow_session_active', '1');
        const updatedVisits = currentVisits + 1;
        localStorage.setItem('shadow_total_visits', updatedVisits.toString());

        // Sync with Supabase site_config in background
        supabase
          .from('site_config')
          .select('value')
          .eq('key', 'total_site_visits')
          .single()
          .then(({ data }: { data: any }) => {
            const count = data ? parseInt(data.value || '0', 10) + 1 : updatedVisits;
            supabase.from('site_config').upsert({
              key: 'total_site_visits',
              value: count.toString(),
              updated_at: new Date().toISOString()
            }).then(null, () => {});
          }, () => {});
      }
    } catch (e) {
      console.warn('Visit tracker error:', e);
    }
  }, [pathname]);

  // 2. Track Realtime Active Presence (Signed-in Adventurers + Travellers)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Stable traveller tag for anonymous visitors across page navigations in session
    let guestTag = sessionStorage.getItem('shadow_traveller_tag');
    if (!guestTag) {
      guestTag = Math.random().toString(36).substring(2, 6).toUpperCase();
      sessionStorage.setItem('shadow_traveller_tag', guestTag);
    }

    const presenceKey = user?.id || `traveller_${guestTag}`;
    const displayName = user 
      ? (profile?.username || user.email?.split('@')[0] || 'Adventurer') 
      : `Traveller #${guestTag}`;

    const channel = supabase.channel('shadow_presence_global', {
      config: {
        presence: {
          key: presenceKey,
        },
      },
    });

    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        try {
          await channel.track({
            online_at: new Date().toISOString(),
            user_id: user?.id || null,
            username: displayName,
            role: profile?.role || (user ? 'user' : 'traveller'),
            admin_title: profile?.admin_title || null,
            avatar_url: profile?.avatar_url || null,
            current_page: pathname || '/',
            is_traveller: !user,
          });
        } catch (e) {
          // Ignore presence track failure
        }
      }
    });

    return () => {
      try {
        channel.unsubscribe();
      } catch (e) {
        // Ignore
      }
    };
  }, [user?.id, profile?.username, profile?.role, profile?.admin_title, profile?.avatar_url, pathname]);

  return null;
}
