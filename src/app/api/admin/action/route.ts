import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// The sacred Guild Master ID
const GUILD_MASTER_ID = '8a63216a-bc69-4b08-b5ea-a43f2c8c6b1f';
const ALPHA_UUID = '5d38da6e-b568-4499-ab67-f588354add5d';

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing credentials' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token session' }, { status: 401 });
    }

    // Verify Guild Master or Admin privilege
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, username')
      .eq('id', user.id)
      .single();

    const isAuthorizedAdmin = 
      user.id === GUILD_MASTER_ID ||
      callerProfile?.role === 'admin' ||
      callerProfile?.role === 'master';

    if (!isAuthorizedAdmin) {
      return NextResponse.json({ error: 'Forbidden: Guild Master or Admin privilege required' }, { status: 403 });
    }

    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    switch (action) {
      // 1. UPDATE USER PROFILE (level, xp, coins, titles, frames, roles, bans, etc.)
      case 'update_profile': {
        const { userId, updates } = payload;
        if (!userId || !updates) {
          return NextResponse.json({ error: 'Missing userId or updates' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();

        if (error) {
          console.error('[AdminAPI] update_profile error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
      }

      // 2. DELETE ADVENTURER PROFILE
      case 'delete_user': {
        const { userId } = payload;
        if (!userId) {
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      // 3. PERSIST SITE CONFIG (Monetization/Ads, Magic Net, Theme, etc.)
      case 'update_site_config': {
        const { key, value } = payload;
        if (!key) {
          return NextResponse.json({ error: 'Missing config key' }, { status: 400 });
        }

        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);

        const { data, error } = await supabaseAdmin
          .from('site_config')
          .upsert({
            key,
            value: serializedValue,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' })
          .select();

        if (error) {
          console.error('[AdminAPI] update_site_config error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
      }

      // 4. SAVE ALPHA PROFILE & AI NEURAL DIRECTIVES
      case 'save_alpha': {
        const { profileUpdates, aiConfigUpdates } = payload;

        // Update Alpha's User Profile
        if (profileUpdates) {
          const { error: pErr } = await supabaseAdmin
            .from('profiles')
            .update({
              ...profileUpdates,
              updated_at: new Date().toISOString()
            })
            .or(`id.eq.${ALPHA_UUID},username.ilike.Alpha`);

          if (pErr) {
            console.error('[AdminAPI] save_alpha profile error:', pErr);
            return NextResponse.json({ error: pErr.message }, { status: 500 });
          }
        }

        // Update Alpha AI Core Directives in site_config
        if (aiConfigUpdates) {
          const serialized = typeof aiConfigUpdates === 'string' ? aiConfigUpdates : JSON.stringify(aiConfigUpdates);
          await supabaseAdmin
            .from('site_config')
            .upsert({
              key: 'alpha_ai_config',
              value: serialized,
              updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
        }

        return NextResponse.json({ success: true });
      }

      // 5. GUILD BOARD POPUP SAVE (INSERT OR UPDATE WITH VALID UUID)
      case 'save_guild_board': {
        const popup = payload.popup;
        if (!popup) {
          return NextResponse.json({ error: 'Missing popup data' }, { status: 400 });
        }

        let popupId = popup.id;
        if (!popupId || !isValidUUID(popupId)) {
          popupId = crypto.randomUUID();
        }

        const sanitizedPopup = {
          ...popup,
          id: popupId,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
          .from('guild_boards')
          .upsert(sanitizedPopup)
          .select();

        if (error) {
          console.error('[AdminAPI] save_guild_board error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data?.[0] || sanitizedPopup });
      }

      // 6. DELETE GUILD BOARD POPUP
      case 'delete_guild_board': {
        const { id } = payload;
        if (!id) {
          return NextResponse.json({ error: 'Missing popup id' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
          .from('guild_boards')
          .delete()
          .eq('id', id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      // 7. GUILD NOTICES (INSERT)
      case 'create_notice': {
        const { header, content, image_url } = payload;
        if (!content) {
          return NextResponse.json({ error: 'Missing notice content' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
          .from('guild_notices')
          .insert({
            header: header || '',
            content,
            image_url: image_url || null,
            created_at: new Date().toISOString()
          })
          .select();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data?.[0] });
      }

      // 8. GUILD NOTICES (DELETE)
      case 'delete_notice': {
        const { id } = payload;
        const { error } = await supabaseAdmin
          .from('guild_notices')
          .delete()
          .eq('id', id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      // 9. VOICE FOUNDRY (INSERT)
      case 'create_voice': {
        const { voiceData } = payload;
        if (!voiceData) {
          return NextResponse.json({ error: 'Missing voiceData' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
          .from('voice_packs')
          .insert(voiceData)
          .select();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data?.[0] });
      }

      // 10. VOICE FOUNDRY (DELETE)
      case 'delete_voice': {
        const { id } = payload;
        const { error } = await supabaseAdmin
          .from('voice_packs')
          .delete()
          .eq('id', id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      // 11. DISPATCH NOTIFICATIONS & GIFTS
      case 'dispatch_notifications': {
        const { notifications } = payload;
        if (!notifications) {
          return NextResponse.json({ error: 'Missing notifications' }, { status: 400 });
        }

        const items = Array.isArray(notifications) ? notifications : [notifications];
        const { error } = await supabaseAdmin
          .from('notifications')
          .insert(items);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      // 12. MOD APPLICATIONS
      case 'manage_mod_application': {
        const { appId, userId, status } = payload;
        if (!appId || !status) {
          return NextResponse.json({ error: 'Missing appId or status' }, { status: 400 });
        }

        if (status === 'approved' && userId) {
          await supabaseAdmin
            .from('profiles')
            .update({ role: 'moderator' })
            .eq('id', userId);
        }

        const { error } = await supabaseAdmin
          .from('mod_applications')
          .update({ status })
          .eq('id', appId);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[AdminAPI] Unhandled server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

