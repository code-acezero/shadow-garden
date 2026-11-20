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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
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

// Lazy proxy singleton prevents build-time evaluation crashes when env vars are not set during Vercel build
export const supabaseAdmin = new Proxy({} as SupabaseClient<any>, {
  get(_target, prop) {
    const client = getSupabaseAdminClient();
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  }
});
