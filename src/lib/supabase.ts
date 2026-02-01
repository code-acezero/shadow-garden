import { createBrowserClient } from '@supabase/ssr';

// Singleton instance
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabaseBrowserClient = () => {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error("🚨 CRITICAL: Supabase Env Vars missing!");
        console.error("URL:", url ? "Set" : "MISSING");
        console.error("Key:", key ? "Set" : "MISSING");
    }

    supabaseInstance = createBrowserClient(
      url!,
      key!
    );
  }
  return supabaseInstance;
};

// Export the singleton directly for ease of use
export const supabase = getSupabaseBrowserClient();