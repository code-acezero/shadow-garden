import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/lib/translator';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang = 'hi', sourceLang = 'en' } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ ok: false, error: 'Text is required' }, { status: 400 });
    }

    const translatedText = await translateText(text, targetLang, sourceLang);
    return NextResponse.json({ ok: true, translatedText });
  } catch (error: any) {
    console.error('Translation route error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Translation failed' }, { status: 500 });
  }
}
