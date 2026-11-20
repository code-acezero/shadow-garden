import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instance container
let supabaseInstance: any = null;

/**
 * Standard Supabase client factory.
 * Uses localStorage by default for session storage, which is highly reliable
 * for client-side auth and prevents disconnection on reload.
 */
export const getSupabaseBrowserClient = () => {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Missing Supabase env variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
      }
    }

    supabaseInstance = createClient<any>(url, key);
  }
  return supabaseInstance;
};

// Lazy proxy prevents build-time static evaluation crashes when env vars are not set during Vercel build
export const supabase: any = new Proxy({} as any, {
  get(_target, prop) {
    const client = getSupabaseBrowserClient();
    const val = client[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  }
});
