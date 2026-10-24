import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// In-memory cache for translated passages to prevent redundant requests
const translationCache = new Map<string, { result: string; expires: number }>();

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang = 'hi', sourceLang = 'en' } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ ok: false, error: 'Text is required' }, { status: 400 });
    }

    if (targetLang === 'en' || targetLang === sourceLang) {
      return NextResponse.json({ ok: true, translatedText: text });
    }

    const cacheKey = `${targetLang}:${text.slice(0, 120)}:${text.length}`;
    const cached = translationCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return NextResponse.json({ ok: true, translatedText: cached.result, cached: true });
    }

    // Break text into manageable chunks (<1500 chars) preserving paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    const translatedParagraphs: string[] = [];

    for (const para of paragraphs) {
      if (!para.trim()) {
        translatedParagraphs.push('');
        continue;
      }

      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(para)}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (res.ok) {
          const json = await res.json();
          const translatedPart = json?.[0]?.map((item: any) => item[0]).join('') || para;
          translatedParagraphs.push(translatedPart);
        } else {
          translatedParagraphs.push(para);
        }
      } catch (chunkErr) {
        console.warn('Paragraph translation error:', chunkErr);
        translatedParagraphs.push(para);
      }
    }

    const finalResult = translatedParagraphs.join('\n\n');
    translationCache.set(cacheKey, { result: finalResult, expires: Date.now() + 1000 * 60 * 60 * 24 });

    return NextResponse.json({ ok: true, translatedText: finalResult });
  } catch (error: any) {
    console.error('Translation service error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Translation failed' }, { status: 500 });
  }
}
