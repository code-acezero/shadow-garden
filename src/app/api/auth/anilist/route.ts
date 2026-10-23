import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CLIENT_ID = '46235';
const CLIENT_SECRET = process.env.ANILIST_SECRET || 'QbZ7sNUFmLY8LpOW98Hr8VQkPbBAiaO06MDf3vPC';
const REDIRECT_URI = 'https://shadow-garden.site/home';

export async function POST(req: Request) {
    try {
        const { code, currentUserId } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Missing code' }, { status: 400 });
        }

        // 1. Exchange authorization code for token
        const response = await fetch('https://anilist.co/api/v2/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                code: code,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('AniList Token Error:', data);
            return NextResponse.json({ error: data.error || 'Failed to exchange token' }, { status: response.status });
        }

        const accessToken = data.access_token;
        let viewer: any = null;

        // 2. Fetch authenticated AniList Viewer info
        if (accessToken) {
            try {
                const viewerRes = await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        query: `
                            query {
                                Viewer {
                                    id
                                    name
                                    avatar {
                                        large
                                        medium
                                    }
                                    bannerImage
                                }
                            }
                        `
                    })
                });
                const viewerData = await viewerRes.json();
                viewer = viewerData?.data?.Viewer || null;
            } catch (vErr) {
                console.error('Failed to fetch AniList viewer info:', vErr);
            }
        }

        // 3. Connect to Supabase to support direct AniList sign in
        let magicToken: string | null = null;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && serviceKey && viewer) {
            try {
                const supabaseAdmin = createClient(supabaseUrl, serviceKey);

                if (currentUserId) {
                    // User is already logged in — link AniList to their profile
                    const { data: existingProfile } = await supabaseAdmin
                        .from('profiles')
                        .select('settings')
                        .eq('id', currentUserId)
                        .single();

                    const currentSettings = existingProfile?.settings || {};
                    await supabaseAdmin
                        .from('profiles')
                        .update({
                            settings: {
                                ...currentSettings,
                                anilist_username: viewer.name,
                                anilist_token: accessToken,
                                anilist_connected_at: new Date().toISOString()
                            }
                        })
                        .eq('id', currentUserId);
                } else {
                    // Direct AniList Sign In: Look up or create Supabase user for AniList
                    const anilistEmail = `anilist_${viewer.id}@shadow-garden.site`;

                    // Check if user exists
                    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
                    let targetUser = userList?.users?.find(u => u.email === anilistEmail);

                    if (!targetUser) {
                        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                            email: anilistEmail,
                            email_confirm: true,
                            user_metadata: {
                                full_name: viewer.name,
                                username: viewer.name,
                                avatar_url: viewer.avatar?.large || viewer.avatar?.medium,
                                anilist_id: viewer.id,
                                anilist_username: viewer.name
                            }
                        });

                        if (createErr) {
                            console.error('Failed to create user for AniList:', createErr);
                        } else {
                            targetUser = newUser.user;
                        }
                    }

                    if (targetUser) {
                        // Ensure profile row exists & is updated
                        await supabaseAdmin.from('profiles').upsert({
                            id: targetUser.id,
                            username: viewer.name,
                            avatar_url: viewer.avatar?.large || viewer.avatar?.medium,
                            banner_url: viewer.bannerImage || null,
                            bio: 'Shadow operative connected via AniList.',
                            role: 'user',
                            affinity: 'Darkness',
                            settings: {
                                anilist_username: viewer.name,
                                anilist_token: accessToken,
                                anilist_connected_at: new Date().toISOString()
                            }
                        }, { onConflict: 'id' });

                        // Generate magic link token for instant browser sign in
                        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
                            type: 'magiclink',
                            email: anilistEmail
                        });

                        if (linkData?.properties?.hashed_token) {
                            magicToken = linkData.properties.hashed_token;
                        }
                    }
                }
            } catch (supErr) {
                console.error('Supabase AniList integration error:', supErr);
            }
        }

        return NextResponse.json({
            ...data,
            viewer,
            magic_token: magicToken,
        });
    } catch (error: any) {
        console.error('AniList API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
