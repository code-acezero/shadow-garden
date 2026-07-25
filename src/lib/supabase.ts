import { createClient } from '@supabase/supabase-js';

// Singleton instance container
let supabaseInstance: any = null;

/**
 * Standard Supabase client factory.
 * Uses localStorage by default for session storage, which is highly reliable
 * for client-side auth and prevents disconnection on reload.
 */
export const getSupabaseBrowserClient = () => {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!url || !key) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Missing Supabase env variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
      }
    }

    supabaseInstance = createClient<any>(url, key);
  }
  return supabaseInstance;
};

// Export singleton directly. 
// Note: This is safe because we are strictly using this as a browser client.
export const supabase = getSupabaseBrowserClient();