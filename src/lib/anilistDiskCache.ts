// src/lib/anilistDiskCache.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface CacheEntry {
  data: any;
  timestamp: number;
  expires: number;
  staleUntil: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry>();
const CACHE_DIR = path.join(process.cwd(), '.cache', 'anilist');
const DEFAULT_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours fresh
const STALE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days stale fallback

let rateLimitedUntil = 0;

export function isAniListRateLimited(): boolean {
  return Date.now() < rateLimitedUntil;
}

export function setAniListRateLimit(seconds: number): void {
  const waitMs = Math.max(seconds, 5) * 1000;
  rateLimitedUntil = Math.max(rateLimitedUntil, Date.now() + waitMs);
  console.warn(`[AniListCache] Rate-limited by upstream. Throttling outbound requests for ${seconds}s.`);
}

function getHashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  } catch (e) {
    // Non-fatal if filesystem is read-only
  }
}

export function getCachedAniList(key: string): { data: any; isStale: boolean } | null {
  const now = Date.now();
  
  // 1. Check in-memory cache
  const memEntry = MEMORY_CACHE.get(key);
  if (memEntry) {
    if (now < memEntry.expires) {
      return { data: memEntry.data, isStale: false };
    }
    if (now < memEntry.staleUntil) {
      return { data: memEntry.data, isStale: true };
    }
  }

  // 2. Check disk cache if on server
  if (typeof window === 'undefined') {
    try {
      const hash = getHashKey(key);
      const filePath = path.join(CACHE_DIR, `${hash}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const entry: CacheEntry = JSON.parse(raw);
        if (entry && entry.data) {
          MEMORY_CACHE.set(key, entry);
          if (now < entry.expires) {
            return { data: entry.data, isStale: false };
          }
          if (now < entry.staleUntil) {
            return { data: entry.data, isStale: true };
          }
        }
      }
    } catch (e) {
      // Ignore disk read error
    }
  }

  return null;
}

export function setCachedAniList(key: string, data: any, ttlMs: number = DEFAULT_TTL_MS): void {
  if (!data) return;
  const now = Date.now();
  const entry: CacheEntry = {
    data,
    timestamp: now,
    expires: now + ttlMs,
    staleUntil: now + STALE_TTL_MS
  };

  MEMORY_CACHE.set(key, entry);

  if (MEMORY_CACHE.size > 3000) {
    const oldestKey = MEMORY_CACHE.keys().next().value;
    if (oldestKey) MEMORY_CACHE.delete(oldestKey);
  }

  if (typeof window === 'undefined') {
    try {
      ensureCacheDir();
      const hash = getHashKey(key);
      const filePath = path.join(CACHE_DIR, `${hash}.json`);
      fs.writeFile(filePath, JSON.stringify(entry), () => {});
    } catch (e) {
      // Ignore disk write error
    }
  }
}
