import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function getChunkLabel(chunk: any[], defaultStart: number, defaultEnd: number): string {
    if (!chunk || chunk.length === 0) return `${defaultStart}-${defaultEnd}`;
    
    const validNums: number[] = [];
    for (const ep of chunk) {
        if (!ep || ep.number == null) continue;
        const num = parseFloat(ep.number);
        if (!isNaN(num)) validNums.push(num);
    }
    
    if (validNums.length === 0) return `${defaultStart}-${defaultEnd}`;
    if (validNums.length === 1) return `${validNums[0]}`;
    
    const sorted = [...validNums].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // Filter out numbers that are too far from the median (outliers)
    const filtered = validNums.filter(n => Math.abs(n - median) <= 150);
    
    if (filtered.length === 0) return `${defaultStart}-${defaultEnd}`;
    if (filtered.length === 1) return `${filtered[0]}`;
    
    return `${filtered[0]}-${filtered[filtered.length - 1]}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseURL() {
  // 1. Client-side
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // 2. Render.com
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }

  // 3. Your Existing Variable (Local & Vercel manual override)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // 4. Vercel Auto-generated
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}

export function getSimilarity(s1: string, s2: string): number {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const str1 = normalize(s1);
    const str2 = normalize(s2);
    
    if (str1 === str2) return 100;
    
    const len1 = str1.length;
    const len2 = str2.length;
    if (len1 === 0 || len2 === 0) return 0;
    
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);
    return ((maxLength - distance) / maxLength) * 100;
}

export function isRelatedAnime(currentId: string, currentTitle: string, targetId: string, targetTitle: string): boolean {
    if (currentId === targetId) return false; // skip current anime
    
    // Title base matching
    const getBaseName = (s: string) => {
        let base = s.toLowerCase();
        // Remove common sequel/spinoff suffixes
        base = base.replace(/(season|part|ova|movie|special|s)\s*\d+/gi, '');
        base = base.replace(/\b(ii|iii|iv|v|vi|vii|viii|ix|x)\b/gi, '');
        base = base.replace(/[\W_]+/g, ' ').trim();
        return base;
    };
        
    const baseCurrent = getBaseName(currentTitle);
    const baseTarget = getBaseName(targetTitle);
    
    if (baseCurrent.length > 3 && baseTarget.length > 3) {
        if (baseCurrent === baseTarget || baseCurrent.includes(baseTarget) || baseTarget.includes(baseCurrent)) {
            return true;
        }
    }
    
    // ID similarity matching
    const idSimilarity = getSimilarity(currentId, targetId);
    if (idSimilarity >= 85) {
        return true;
    }
    
    return false;
}

export function getWatchRoute(animeId: string, episodeId?: string, type?: string): string {
    const t = (type || '').toLowerCase();
    const epQuery = episodeId ? `?ep=${encodeURIComponent(episodeId)}` : '';
    if (t === 'hindi' || t === 'hindi-anime') {
        return `/hindi-watch/${animeId}${epQuery}`;
    }
    if (t === 'donghua') {
        return `/donghua-watch/${animeId}${epQuery}`;
    }
    if (t === 'drama' || t === 'cdrama' || t === 'kdrama') {
        return `/drama-watch/${animeId}${epQuery}`;
    }
    if (t === 'movie' || t === 'movies') {
        return `/movies-watch/${animeId}`;
    }
    return `/watch/${animeId}${epQuery}`;
}

export function formatAnimeTitle(rawTitle?: string | null | any, animeId?: string | null): string {
    // 1. Handle title object variants (english, romaji, userPreferred, name, title)
    if (rawTitle && typeof rawTitle === 'object') {
        const extracted = rawTitle.english || rawTitle.romaji || rawTitle.userPreferred || rawTitle.name || rawTitle.title;
        if (extracted && typeof extracted === 'string' && extracted.trim() !== '' && !extracted.toLowerCase().includes('unknown')) {
            return extracted.trim();
        }
    }

    // 2. Handle valid string titles that are NOT purely numeric and NOT "unknown"
    if (rawTitle && typeof rawTitle === 'string' && rawTitle.trim() !== '') {
        const clean = rawTitle.trim();
        if (!clean.toLowerCase().includes('unknown') && !/^\d+$/.test(clean)) {
            return clean;
        }
    }

    // 3. Check cached title in localStorage by animeId
    if (animeId && typeof animeId === 'string' && typeof window !== 'undefined') {
        try {
            const cached = localStorage.getItem(`shadow_anime_title_${animeId}`);
            if (cached && cached.trim() !== '' && !cached.toLowerCase().includes('unknown') && !/^\d+$/.test(cached.trim())) {
                return cached.trim();
            }
        } catch { }
    }

    // 4. Humanize slug-based animeId if it contains words (e.g. solo-leveling-season-2)
    if (animeId && typeof animeId === 'string' && animeId.trim() !== '') {
        const cleanId = animeId.trim();
        if (!/^\d+$/.test(cleanId)) {
            return cleanId
                .replace(/[-_]+/g, ' ')
                .split(' ')
                .filter(Boolean)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
    }

    // 5. Fallback for purely numeric IDs when no title cached
    if (rawTitle && typeof rawTitle === 'string' && rawTitle.trim() !== '' && !rawTitle.toLowerCase().includes('unknown')) {
        return rawTitle.trim();
    }
    if (animeId && typeof animeId === 'string' && /^\d+$/.test(animeId.trim())) {
        return `Anime #${animeId.trim()}`;
    }

    return 'Anime';
}

export function sanitizeContinueWatchingEntry(p: any, fallbackUserId?: string) {
    if (!p) return null;
    return {
        user_id: p.user_id || fallbackUserId,
        anime_id: p.anime_id || p.animeId || '',
        title: p.title || 'Unknown Title',
        banner_image: p.banner_image || p.poster || p.image || null,
        episode_id: p.episode_id || p.episodeId || '',
        episode_number: Number(p.episode_number || p.episodeNumber || p.episode) || 1,
        progress: Math.floor(Number(p.progress) || 0),
        last_updated: p.last_updated || (p.lastUpdated ? new Date(p.lastUpdated).toISOString() : new Date().toISOString()),
        last_server: p.last_server || null,
        episode_image: p.episode_image || p.banner_image || p.poster || null,
        total_episodes: Number(p.total_episodes || p.totalEpisodes) || 1,
        type: p.type || 'anime',
        media_type: p.media_type || p.type || 'anime',
        is_completed: Boolean(p.is_completed),
        age_rating: p.age_rating || p.ageRating || null,
        is_adult: Boolean(p.is_adult || p.isAdult)
    };
}