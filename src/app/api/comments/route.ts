import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GUEST_USER_ID = 'eea3d178-8339-4aa0-a1d3-38bc52b87f77';

function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase admin credentials missing');
    }
    return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { episode_id, content, parent_id, is_spoiler, traveler_name, traveler_avatar } = body;

        if (!episode_id || !content || typeof content !== 'string' || !content.trim()) {
            return NextResponse.json({ error: 'Missing required comment fields' }, { status: 400 });
        }

        const adminClient = getAdminClient();

        // Encode traveler identity into comment content if guest
        let finalContent = content.trim();
        if (traveler_name || traveler_avatar) {
            const meta = JSON.stringify({
                name: traveler_name || 'Traveler',
                avatar: traveler_avatar || ''
            });
            finalContent = `<!--traveller:${meta}-->${finalContent}`;
        }

        const { data, error } = await adminClient
            .from('comments')
            .insert({
                episode_id,
                user_id: GUEST_USER_ID,
                content: finalContent,
                parent_id: parent_id || null,
                is_spoiler: !!is_spoiler
            })
            .select('*')
            .single();

        if (error) {
            console.error('[API /api/comments] Insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, comment: data });
    } catch (err: any) {
        console.error('[API /api/comments] Unexpected error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
