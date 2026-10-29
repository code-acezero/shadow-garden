import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton server-side admin client instance
let adminInstance: SupabaseClient<any> | null = null;

/**
 * Server-only Supabase Admin Client.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security (RLS) for
 * trusted backend operations (cron jobs, episode notifications, admin tasks).
 */
export const getSupabaseAdminClient = (): SupabaseClient<any> => {
  if (!adminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!url || !serviceKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Missing Supabase server credentials: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      }
    }

    adminInstance = createClient<any>(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminInstance;
};

export const supabaseAdmin = getSupabaseAdminClient();

