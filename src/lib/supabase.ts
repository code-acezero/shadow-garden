import { createBrowserClient } from '@supabase/ssr';

// Singleton instance
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * ✅ IMPROVEMENT: Better environment variable validation with clear error messages
 */
export const getSupabaseBrowserClient = () => {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Enhanced validation with helpful messages
    if (!url || !key) {
      const missingVars: string[] = [];
      if (!url) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!key) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      
      const errorMessage = `🚨 CRITICAL: Missing Supabase environment variables: ${missingVars.join(', ')}`;
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error(errorMessage);
        console.error('📝 Please add these variables to your .env.local file:');
        console.error('   NEXT_PUBLIC_SUPABASE_URL=your-project-url');
        console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
      }
      
      // Throw error in production to prevent silent failures
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Supabase configuration missing');
      }
    }

    supabaseInstance = createBrowserClient(
      url || '', // Provide fallback empty string to prevent crash
      key || ''
    );
  }
  return supabaseInstance;
};

// Export the singleton directly for ease of use
export const supabase = getSupabaseBrowserClient();