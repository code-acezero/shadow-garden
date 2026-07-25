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
          .then(({ data }) => {
            const count = data ? parseInt(data.value || '0', 10) + 1 : updatedVisits;
            supabase.from('site_config').upsert({
              key: 'total_site_visits',
              value: count.toString(),
              updated_at: new Date().toISOString()
            }).then(() => {}).catch(() => {});
          })
          .catch(() => {});
      }
    } catch (e) {
      console.warn('Visit tracker error:', e);
    }
  }, [pathname]);

  // 2. Track Realtime Active Presence
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channel = supabase.channel('shadow_presence_global', {
      config: {
        presence: {
          key: user?.id || `guest_${Math.random().toString(36).substring(2, 9)}`,
        },
      },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          online_at: new Date().toISOString(),
          user_id: user?.id || null,
          username: profile?.username || 'Guest Adventurer',
          role: profile?.role || 'guest',
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, profile?.username, profile?.role]);

  return null;
}
