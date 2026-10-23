import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials missing');
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

// GET: Fetch real likes and dislikes count, plus user reaction
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const drama_id = searchParams.get('drama_id');
    const episode_number = parseInt(searchParams.get('episode') || '1', 10);
    const user_id = searchParams.get('user_id');

    if (!drama_id) {
      return NextResponse.json({ error: 'Missing drama_id' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Query exact counts in parallel
    const [likesRes, dislikesRes, userRes] = await Promise.all([
      supabase
        .from('shorts_likes')
        .select('*', { count: 'exact', head: true })
        .eq('drama_id', drama_id)
        .eq('episode_number', episode_number)
        .eq('reaction_type', 'like'),
      supabase
        .from('shorts_likes')
        .select('*', { count: 'exact', head: true })
        .eq('drama_id', drama_id)
        .eq('episode_number', episode_number)
        .eq('reaction_type', 'dislike'),
      user_id ? supabase
        .from('shorts_likes')
        .select('reaction_type')
        .eq('drama_id', drama_id)
        .eq('episode_number', episode_number)
        .eq('user_id', user_id)
        .maybeSingle() : Promise.resolve({ data: null })
    ]);

    return NextResponse.json({
      success: true,
      likesCount: likesRes.count ?? 0,
      dislikesCount: dislikesRes.count ?? 0,
      userReaction: userRes?.data?.reaction_type || null
    });
  } catch (err: any) {
    console.error('[API /api/shorts/likes GET error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Real toggle like or dislike
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drama_id, episode_number = 1, user_id, action } = body;

    if (!drama_id || !user_id || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const epNum = typeof episode_number === 'number' ? episode_number : parseInt(episode_number, 10);
    const supabase = getAdminClient();

    if (action === 'remove') {
      await supabase
        .from('shorts_likes')
        .delete()
        .eq('drama_id', drama_id)
        .eq('episode_number', epNum)
        .eq('user_id', user_id);
    } else if (action === 'like' || action === 'dislike') {
      await (supabase.from('shorts_likes') as any).upsert(
        {
          drama_id,
          episode_number: epNum,
          user_id,
          reaction_type: action,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'drama_id,episode_number,user_id' }
      );
    }

    // Return fresh updated counts
    const [likesRes, dislikesRes] = await Promise.all([
      supabase
        .from('shorts_likes')
        .select('*', { count: 'exact', head: true })
        .eq('drama_id', drama_id)
        .eq('episode_number', epNum)
        .eq('reaction_type', 'like'),
      supabase
        .from('shorts_likes')
        .select('*', { count: 'exact', head: true })
        .eq('drama_id', drama_id)
        .eq('episode_number', epNum)
        .eq('reaction_type', 'dislike')
    ]);

    return NextResponse.json({
      success: true,
      likesCount: likesRes.count ?? 0,
      dislikesCount: dislikesRes.count ?? 0,
      userReaction: action === 'remove' ? null : action
    });
  } catch (err: any) {
    console.error('[API /api/shorts/likes POST error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
