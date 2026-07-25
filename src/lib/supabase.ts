import { createBrowserClient } from '@supabase/ssr';

// Singleton instance container
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export const resetSupabaseClient = () => {
  supabaseInstance = null;
};

/**
 * ✅ Resilient Supabase browser client factory with auto-reconnection & non-blocking fallback
 */
export const getSupabaseBrowserClient = () => {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Missing Supabase env variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
      }

      // Return a no-op stub that matches the Supabase client shape
      // so the app renders gracefully when env vars are temporarily missing or evaluating.
      const noopError = { message: 'Supabase not configured' };
      const noopQ = { data: null, error: noopError, count: null, status: 400, statusText: 'Not configured' };
      const qBuilder: any = new Proxy(Promise.resolve(noopQ), {
        get(target, prop) {
          if (prop === 'then' || prop === 'catch' || prop === 'finally') return (target[prop as keyof typeof target] as Function).bind(target);
          return () => qBuilder;
        }
      });
      const stub: any = {
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
          signOut: async () => ({ error: null }),
          setSession: async () => ({ data: { session: null, user: null }, error: null }),
          refreshSession: async () => ({ data: { session: null, user: null }, error: null }),
          onAuthStateChange: (_cb: any) => ({
            data: { subscription: { unsubscribe: () => {} } }
          }),
        },
        from: () => qBuilder,
        storage: { from: () => ({ upload: async () => ({ data: null, error: noopError }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
        channel: () => ({ on: () => ({ subscribe: () => {} }) }),
        removeChannel: () => {},
      };
      supabaseInstance = stub as ReturnType<typeof createBrowserClient>;
      return supabaseInstance;
    }

    // Custom fetch with retry logic & automatic client reset on persistent server drops
    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let retries = 3;
      let delay = 500;
      while (retries > 0) {
        try {
          const response = await fetch(input, init);
          if (response.ok || (response.status >= 400 && response.status < 500)) {
            return response;
          }
          throw new Error(`Server returned ${response.status}`);
        } catch (error) {
          retries--;
          if (retries === 0) {
            // Reset instance so next query creates a fresh connection instead of staying locked in a broken state
            resetSupabaseClient();
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
      return fetch(input, init);
    };

    supabaseInstance = createBrowserClient(
      url,
      key,
      {
        global: {
          fetch: customFetch
        }
      }
    );
  }
  return supabaseInstance;
};

// Export singleton & dynamic proxy to support client resets
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    const instance = getSupabaseBrowserClient();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});