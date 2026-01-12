import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase Environment Variables");
}

// --- SINGLETON PATTERN (Prevents "Too Many Connections" Crash) ---
const globalForSupabase = global as unknown as { supabase: ReturnType<typeof createClient> };

export const supabase = globalForSupabase.supabase || createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

if (process.env.NODE_ENV !== 'production') {
    globalForSupabase.supabase = supabase;
}