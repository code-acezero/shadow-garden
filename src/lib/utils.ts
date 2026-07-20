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