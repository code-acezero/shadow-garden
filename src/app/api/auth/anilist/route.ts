import { NextResponse } from 'next/server';

const CLIENT_ID = '46235';
const CLIENT_SECRET = process.env.ANILIST_SECRET || 'QbZ7sNUFmLY8LpOW98Hr8VQkPbBAiaO06MDf3vPC'; // Hardcoded fallback for demonstration
const REDIRECT_URI = 'https://shadow-garden.site/home'; // Or process.env.NEXT_PUBLIC_BASE_URL + '/home'

export async function POST(req: Request) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Missing code' }, { status: 400 });
        }

        // Exchange code for token
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

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('AniList API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
