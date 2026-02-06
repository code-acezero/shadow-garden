import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // 1. Get the cookies for THIS specific request (Crucial for Security)
  const cookieStore = await cookies();

  // 2. Create a fresh Supabase client for the server
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in API routes
          }
        },
      },
    }
  );
  
  // 3. Verify the User's Session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { targetId, reason } = await request.json();

    if (!targetId || !reason) {
      return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
    }

    // 4. Insert Report
    // (Your SQL Trigger will handle the "3 Strikes" notification logic automatically)
    const { error } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      target_id: targetId,
      reason: reason
    });

    if (error) throw error;
    
    return NextResponse.json({ success: true, message: 'Report submitted' });

  } catch (error: any) {
    console.error("Report Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}