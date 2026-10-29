/**
 * Unified Translation Engine for Novels and Multi-language Grimoire Text
 * Uses Google Translate (client=gtx) with MyMemory fallback & in-memory caching.
 */

export interface LanguageMeta {
  code: string;
  label: string;
  native: string;
  flag?: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageMeta> = {
  en: { code: 'en', label: 'English', native: 'English' },
  hi: { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  bn: { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  es: { code: 'es', label: 'Spanish', native: 'Español' },
  'es-la': { code: 'es-la', label: 'Spanish (LatAm)', native: 'Español (Latinoamérica)' },
  fr: { code: 'fr', label: 'French', native: 'Français' },
  id: { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia' },
  pt: { code: 'pt', label: 'Portuguese', native: 'Português' },
  'pt-br': { code: 'pt-br', label: 'Portuguese (BR)', native: 'Português (Brasil)' },
  ru: { code: 'ru', label: 'Russian', native: 'Русский' },
  ja: { code: 'ja', label: 'Japanese', native: '日本語' },
  de: { code: 'de', label: 'German', native: 'Deutsch' },
  it: { code: 'it', label: 'Italian', native: 'Italiano' },
  ar: { code: 'ar', label: 'Arabic', native: 'العربية' },
  vi: { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
  th: { code: 'th', label: 'Thai', native: 'ไทย' },
  tr: { code: 'tr', label: 'Turkish', native: 'Türkçe' },
  zh: { code: 'zh', label: 'Chinese', native: '中文' },
  'zh-hk': { code: 'zh-hk', label: 'Chinese (HK)', native: '繁體中文' },
  ko: { code: 'ko', label: 'Korean', native: '한국어' },
  pl: { code: 'pl', label: 'Polish', native: 'Polski' },
  uk: { code: 'uk', label: 'Ukrainian', native: 'Українська' }
};

export function getLanguageMeta(code: string): LanguageMeta {
  const normalized = code.toLowerCase().trim();
  return (
    SUPPORTED_LANGUAGES[normalized] || {
      code: normalized,
      label: normalized.toUpperCase(),
      native: normalized.toUpperCase()
    }
  );
}

// In-memory cache to prevent redundant calls across server requests
const cache = new Map<string, { result: string; expires: number }>();

/**
 * Direct in-process translation function
 */
export async function translateText(
  text: string,
  targetLang: string = 'hi',
  sourceLang: string = 'en'
): Promise<string> {
  const normTarget = targetLang.toLowerCase().trim();
  const normSource = sourceLang.toLowerCase().trim();

  if (!text || typeof text !== 'string') return '';
  if (normTarget === 'en' || normTarget === normSource) return text;

  // Cache lookup
  const cacheKey = `${normSource}:${normTarget}:${text.slice(0, 100)}:${text.length}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() < hit.expires) {
    return hit.result;
  }

  // 1. Primary engine: Google Translate gtx
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      normSource
    )}&tl=${encodeURIComponent(normTarget)}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: '*/*'
      }
    });

    if (res.ok) {
      const body = await res.text();
      // Ensure response is JSON and not HTML challenge
      if (body.startsWith('[') || body.startsWith('{')) {
        const json = JSON.parse(body);
        const translated = json?.[0]?.map((item: any) => item[0]).join('');
        if (translated && typeof translated === 'string' && translated.trim().length > 0) {
          cache.set(cacheKey, { result: translated, expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });
          return translated;
        }
      }
    }
  } catch (err) {
    console.warn(`[Translator] Primary Google gtx failed for ${normTarget}:`, err);
  }

  // 2. Secondary fallback engine: MyMemory API
  try {
    // If text is very long, chunk to 500 chars for MyMemory free tier
    const chunks = text.match(/.{1,450}(\s|$)/g) || [text];
    const translatedChunks: string[] = [];

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const memUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        chunk.trim()
      )}&langpair=${encodeURIComponent(normSource)}|${encodeURIComponent(normTarget)}`;

      const memRes = await fetch(memUrl, {
        headers: { 'User-Agent': 'ShadowGarden/2.0' }
      });

      if (memRes.ok) {
        const memJson = await memRes.json();
        const part = memJson.responseData?.translatedText;
        if (part && !part.includes('MYMEMORY WARNING')) {
          translatedChunks.push(part);
          continue;
        }
      }
      translatedChunks.push(chunk);
    }

    const fallbackResult = translatedChunks.join(' ');
    if (fallbackResult.trim().length > 0) {
      cache.set(cacheKey, { result: fallbackResult, expires: Date.now() + 1000 * 60 * 60 * 24 });
      return fallbackResult;
    }
  } catch (err) {
    console.warn(`[Translator] Secondary MyMemory failed for ${normTarget}:`, err);
  }

  // Return original text if all translation engines fail
  return text;
}
