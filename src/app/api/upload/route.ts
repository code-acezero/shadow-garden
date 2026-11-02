import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kacgsuabfdqcskjonzkl.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'avatars';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!SERVICE_KEY) {
      return NextResponse.json({ error: 'Supabase storage key not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const fileExt = file.name.split('.').pop() || 'png';
    const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;
    const filePath = `uploads/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to target bucket (avatars, banners, or asset)
    const targetBucket = ['avatars', 'banners', 'asset', 'social_uploads'].includes(bucket)
      ? bucket
      : 'avatars';

    const { data, error } = await supabase.storage
      .from(targetBucket)
      .upload(filePath, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('[API/Upload] Supabase Storage upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: pubData } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: pubData.publicUrl,
      path: data.path,
    });
  } catch (err: any) {
    console.error('[API/Upload] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
