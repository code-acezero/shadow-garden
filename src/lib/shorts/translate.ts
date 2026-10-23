/**
 * Auto Translation Utility for Short Dramas
 * Translates Chinese titles, synopses, and tags into clean, engaging English.
 * Uses Google Translate API with in-memory LRU caching and fallback dictionary.
 */

const translationCache = new Map<string, string>();

// Fallback dictionary for common short drama titles & tropes
const TITLE_DICTIONARY: Record<string, string> = {
  '穿越侍郎千金，上朝心声全网公开第三季': 'The Assistant Minister\'s Daughter: Court Secrets Revealed Season 3',
  '守越侍郎千金，上朝心声全网公开第三季': 'The Assistant Minister\'s Daughter: Court Secrets Revealed Season 3',
  '守越侍郎千金': 'The Assistant Minister\'s Daughter',
  '穿越侍郎千金': 'The Assistant Minister\'s Daughter',
  '保镖的心动暗号': 'My Heart Belongs to His Bodyguard',
  '双面总裁': 'The Double Life of My Billionaire Husband',
  '重回八零，从摆摊开始暴富': 'Return to the 80s: Street Vendor to Billionaire',
  '隐龙出狱': 'The Hidden Dragon Unchained',
  '绝世战神': 'The Peerless God of War',
  '真假千金': 'The Real Heiress Returns',
  '豪门弃婿': 'The Outcast Son-in-Law\'s Revenge',
  '至尊龙皇': 'Supreme Dragon King',
  '神豪从签到开始': 'Billionaire Check-in System',
  '天降萌宝：妈咪是马甲大佬': 'Heaven-Sent Genius: Mommy is a Secret Boss',
  '离婚后前妻成了首富': 'After the Divorce, My Ex-Wife Became the Richest Tycoon',
  '无双战帝': 'Unrivaled War Sovereign',
  '玫瑰轻颤时': 'When the Rose Trembles',
  '彩礼谈崩，转身拿下千亿总裁': 'Betrothal Ruined: Marrying the Trillionaire CEO',
  '千亿总裁': 'Trillionaire CEO',
  '龙王令': 'Decree of the Dragon King',
  '霸道总裁': 'Domineering CEO',
  '我有一座藏经阁': 'My Secret Celestial Pavilion',
  '九转星辰诀': 'Nine Revolutions Celestial Art'
};

const TAG_DICTIONARY: Record<string, string> = {
  '短剧': 'Mini-Drama',
  '爽文短剧': 'High Energy Romance',
  '爽文': 'High Energy',
  '穿越': 'Time Travel',
  '逆袭': 'Underdog Revenge',
  '重生': 'Rebirth',
  '豪门': 'Billionaire',
  '总裁': 'CEO',
  '战神': 'God of War',
  '都市': 'Modern Urban',
  '古装': 'Historical',
  '甜宠': 'Sweet Romance',
  '复仇': 'Revenge',
  '玄幻': 'Fantasy',
  '神医': 'Miracle Doctor',
  '虐恋': 'Emotional Melodrama',
  '马甲': 'Secret Identity',
  '奶爸': 'Single Father',
  '完结': 'Completed',
  '连载': 'Ongoing',
  '短剧大全': 'All Short Dramas',
  '爱情': 'Romance',
  '现代都市': 'Modern City',
  '现代': 'Modern',
  '武侠': 'Martial Arts',
  '仙侠': 'Immortal Hero',
  '科幻': 'Sci-Fi',
  '悬疑': 'Suspense & Mystery',
  '喜剧': 'Comedy',
  '家庭': 'Family'
};

/**
 * Cleans bracketed tags and episode count noise from Chinese titles
 */
export function sanitizeRawChineseTitle(raw: string): string {
  if (!raw) return 'Mini Drama';
  return raw
    .replace(/【完结】/g, '')
    .replace(/【全集】/g, '')
    .replace(/【连载】/g, '')
    .replace(/\[完结\]/g, '')
    .replace(/\[全集\]/g, '')
    .replace(/（\d+集）/g, '')
    .replace(/\(\d+集\)/g, '')
    .replace(/第\s*\d+\s*季/g, (m) => {
      const num = m.match(/\d+/)?.[0] || '1';
      return ` Season ${num}`;
    })
    .trim();
}

/**
 * High-speed batch translation for multiple titles in 1 single Google Translate request.
 */
export async function translateBatchToEnglish(texts: string[]): Promise<string[]> {
  if (!texts || texts.length === 0) return [];

  const results: string[] = new Array(texts.length);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const raw = texts[i]?.trim() || '';
    if (!raw) {
      results[i] = 'Short Drama';
      continue;
    }

    // Clean brackets
    const sanitized = sanitizeRawChineseTitle(raw);

    // If text has NO Chinese characters, keep as-is
    if (!/[\u4e00-\u9fa5]/.test(sanitized)) {
      results[i] = sanitized;
      continue;
    }

    // Check dictionary
    if (TITLE_DICTIONARY[sanitized]) {
      results[i] = TITLE_DICTIONARY[sanitized];
      continue;
    }

    // Check cache
    if (translationCache.has(sanitized)) {
      results[i] = translationCache.get(sanitized)!;
      continue;
    }

    uncachedIndices.push(i);
    uncachedTexts.push(sanitized);
  }

  // If all are already translated or English, return immediately
  if (uncachedTexts.length === 0) {
    return results;
  }

  try {
    const joined = uncachedTexts.join('\n');
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(joined)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      signal: AbortSignal.timeout(4500)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const fullTranslation = data[0].map((item: any) => item[0]).join('');
        const lines = fullTranslation.split('\n').map((l: string) => l.trim());

        for (let j = 0; j < uncachedTexts.length; j++) {
          const original = uncachedTexts[j];
          const translated = lines[j] || original;
          translationCache.set(original, translated);
          results[uncachedIndices[j]] = translated;
        }
        return results;
      }
    }
  } catch (err) {
    console.warn('[Translate Batch Warning]: Fallback translation applied', err);
  }

  // Fallback if batch network request fails
  for (let j = 0; j < uncachedTexts.length; j++) {
    const original = uncachedTexts[j];
    let fallback = original;
    for (const [zh, en] of Object.entries(TAG_DICTIONARY)) {
      fallback = fallback.replaceAll(zh, en);
    }
    results[uncachedIndices[j]] = fallback;
  }

  return results;
}

/**
 * Translates single text from Chinese to English with caching.
 */
export async function translateTextToEnglish(text: string): Promise<string> {
  if (!text || !text.trim()) return '';

  const clean = sanitizeRawChineseTitle(text.trim());

  // If text already has no Chinese characters, return as is
  if (!/[\u4e00-\u9fa5]/.test(clean)) {
    return clean;
  }

  // Check dictionary first
  if (TITLE_DICTIONARY[clean]) {
    return TITLE_DICTIONARY[clean];
  }

  // Check cache
  if (translationCache.has(clean)) {
    return translationCache.get(clean)!;
  }

  const batch = await translateBatchToEnglish([clean]);
  return batch[0] || clean;
}

/**
 * Translates an array of tags to English
 */
export function translateTagsToEnglish(tags: string[]): string[] {
  const result: string[] = [];
  for (const t of tags) {
    const trimmed = t.trim();
    if (!trimmed) continue;

    if (TAG_DICTIONARY[trimmed]) {
      result.push(TAG_DICTIONARY[trimmed]);
    } else if (!/[\u4e00-\u9fa5]/.test(trimmed)) {
      result.push(trimmed);
    } else {
      let mapped = trimmed;
      for (const [zh, en] of Object.entries(TAG_DICTIONARY)) {
        mapped = mapped.replaceAll(zh, en);
      }
      result.push(mapped || 'Mini-Drama');
    }
  }

  if (result.length === 0) {
    result.push('Mini-Drama', 'Shorts', 'English Sub');
  }

  return Array.from(new Set(result));
}

/**
 * Translates episode title (e.g. "第1集" -> "Episode 1")
 */
export function formatEpisodeTitleToEnglish(rawTitle: string, epNum: number): string {
  if (!rawTitle) return `Episode ${epNum}`;

  // If matches 第X集
  const match = rawTitle.match(/第\s*(\d+)\s*集/);
  if (match) {
    return `Episode ${match[1]}`;
  }

  // If starts with number
  if (/^\d+$/.test(rawTitle.trim())) {
    return `Episode ${rawTitle.trim()}`;
  }

  // If already in English
  if (/^Episode\s+\d+/i.test(rawTitle.trim())) {
    return rawTitle.trim();
  }

  // Remove common Chinese markers
  const cleaned = rawTitle
    .replace(/第\s*\d+\s*集/g, '')
    .replace(/正片/g, 'Full Episode')
    .trim();

  return cleaned ? `Episode ${epNum} - ${cleaned}` : `Episode ${epNum}`;
}
