import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !key) {
    return null;
  }
  return createClient(supabaseUrl, key);
}

export interface GlobalCommentItem {
  id: string;
  content: string;
  created_at: string;
  episode_id: string;
  is_spoiler: boolean;
  user_name: string;
  user_avatar: string;
  user_role: string;
  is_traveler: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '18', 10), 1), 50);

    const client = getClient();
    if (!client) {
      return NextResponse.json({ ok: true, comments: [] });
    }

    const { data, error } = await client
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        episode_id,
        is_spoiler,
        profiles (
          id,
          username,
          avatar_url,
          full_name,
          role,
          admin_title
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[GlobalComments API] Error fetching comments:', error.message);
      return NextResponse.json({ ok: false, error: error.message, comments: [] });
    }

    const rawList = data || [];
    const normalized: GlobalCommentItem[] = rawList.map((c: any) => {
      let rawContent = c.content || '';
      let travelerMeta: { name?: string; avatar?: string } | null = null;

      // Extract <!--traveller:{...}--> if present
      const match = rawContent.match(/<!--traveller:(\{.*?\})-->/);
      if (match) {
        try {
          travelerMeta = JSON.parse(match[1]);
        } catch {}
        rawContent = rawContent.replace(/<!--traveller:\{.*?\}-->/, '').trim();
      }

      const profile = c.profiles;
      const isTraveler = !!travelerMeta || !profile;
      const userName = travelerMeta?.name || profile?.full_name || profile?.username || 'Shadow Operative';
      const userAvatar = travelerMeta?.avatar || profile?.avatar_url || '/images/default-avatar.png';
      const userRole = profile?.admin_title || profile?.role || (isTraveler ? 'Traveler' : 'Operative');

      return {
        id: c.id,
        content: rawContent,
        created_at: c.created_at,
        episode_id: c.episode_id || '',
        is_spoiler: !!c.is_spoiler,
        user_name: userName,
        user_avatar: userAvatar,
        user_role: userRole,
        is_traveler: isTraveler,
      };
    });

    return NextResponse.json({ ok: true, comments: normalized });
  } catch (err: any) {
    console.error('[GlobalComments API] Unexpected failure:', err);
    return NextResponse.json({ ok: false, error: err.message, comments: [] }, { status: 500 });
  }
}
