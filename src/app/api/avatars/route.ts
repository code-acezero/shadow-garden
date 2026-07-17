import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Target directory: public/guest_avatars (or userpfp)
    // Ensure you create this folder in your project
    const directory = path.join(process.cwd(), 'public', 'guest_avatars');
    
    if (!fs.existsSync(directory)) {
      return NextResponse.json({ images: [] });
    }

    const files = fs.readdirSync(directory);
    // Filter for images only
    const images = files.filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
                        .map(file => `/guest_avatars/${file}`);

    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load avatars' }, { status: 500 });
  }
}