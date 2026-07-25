import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false
    }
  }
);

export async function GET() {
  const { data, error } = await supabase.auth.signUp({
      email: 'alpha@shadowgarden.net',
      password: 'shadowgardenalpha',
      options: {
          data: {
              username: 'Alpha'
          }
      }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update her profile to moderator and First Shadow
  if (data.user) {
     const { error: updateError } = await supabase
       .from('profiles')
       .update({ role: 'moderator', admin_title: 'First Shadow' })
       .eq('id', data.user.id);
       
     if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
     }
  }

  return NextResponse.json({ success: true, user: data.user });
}
