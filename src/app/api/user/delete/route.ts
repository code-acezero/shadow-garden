import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Missing authentication credentials' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase configuration is unavailable' }, { status: 500 });
    }

    // Verify token with user client
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired authentication session' }, { status: 401 });
    }

    const userId = user.id;

    // Clean up user-related records across known tables
    const tablesToClean = [
      { table: 'bookmarks', column: 'user_id' },
      { table: 'continue_watching', column: 'user_id' },
      { table: 'user_settings', column: 'user_id' },
      { table: 'notifications', column: 'user_id' },
      { table: 'comments', column: 'user_id' },
      { table: 'social_posts', column: 'user_id' },
      { table: 'user_stats', column: 'user_id' },
      { table: 'profiles', column: 'id' },
    ];

    for (const item of tablesToClean) {
      try {
        await supabaseAdmin.from(item.table).delete().eq(item.column, userId);
      } catch (err) {
        console.warn(`[DeleteUser] Non-critical error deleting from ${item.table}:`, err);
      }
    }

    // Erase user from auth.users using admin client
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error('[DeleteUser] Error deleting auth user:', deleteAuthError);
      return NextResponse.json({ error: deleteAuthError.message || 'Failed to erase auth credentials' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Operative identity and all associated vault records have been eradicated.'
    });
  } catch (error: any) {
    console.error('[DeleteUser] Unhandled error during account deletion:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
