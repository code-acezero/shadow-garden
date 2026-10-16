// src/lib/extractors/streamExtractor.ts
// Unified Stream Extractor for Shadow Garden
// Consolidates Japanese Sub/Dub, English Dub, Chinese Donghua, and Hindi Dub into a single standard interface.

export interface StreamServer {
  serverId: string;
  serverName: string; // e.g. 'MegaCloud', 'Vidstreaming', 'Vidstream', 'Rumble Cloud', 'Blakite'
  url: string;        // direct playable .m3u8 or .mp4 or embed url
  type: 'm3u8' | 'mp4' | 'embed';
  quality?: string;
  referer?: string | null;
  tracks?: any[];
  intro?: { start: number; end: number } | null;
  outro?: { start: number; end: number } | null;
}

export interface AudioTrackOption {
  id: 'jp' | 'en' | 'hi' | 'cn' | 'kr' | 'raw';
  label: string;      // e.g. 'JP • Sub', 'EN • Dub', 'HI • Dub', 'CN • Sub', 'KR • Sub'
  language: string;   // 'Japanese', 'English', 'Hindi', 'Chinese', 'Korean'
  type: 'sub' | 'dub' | 'raw';
  available: boolean;
}

export interface SubtitleTrack {
  url: string;
  lang: string;
  label: string;
  default?: boolean;
}

export interface UnifiedStreamResult {
  audioTracks: AudioTrackOption[];
  servers: Record<string, StreamServer[]>;
  subtitles: SubtitleTrack[];
  intro?: { start: number; end: number } | null;
  outro?: { start: number; end: number } | null;
}

// In-memory cache to prevent redundant scrapes (TTL: 2 hours)
interface CacheEntry {
  timestamp: number;
  data: UnifiedStreamResult;
}
const streamCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

// Universal XOR decryptor for ZokoAnime obfuscated window.__P (works in Node & browser)
export function xorDecrypt(base64Str: string, key = 'otaku-embed-v1'): string {
  try {
    let binary: Uint8Array;
    if (typeof Buffer !== 'undefined') {
      binary = Buffer.from(base64Str, 'base64');
    } else if (typeof atob !== 'undefined') {
      const raw = atob(base64Str);
      binary = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        binary[i] = raw.charCodeAt(i);
      }
    } else {
      return '';
    }

    const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
    const keyBytes = encoder ? encoder.encode(key) : new Uint8Array(Array.from(key).map(c => c.charCodeAt(0)));
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      out[i] = binary[i] ^ keyBytes[i % keyBytes.length];
    }

    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(out);
    }
    return String.fromCharCode.apply(null, Array.from(out));
  } catch (e) {
    return '';
  }
}

/**
 * 1. ZOKOANIME DIRECT MAL EXTRACTOR (Primary Sub & English Dub)
 */
export async function fetchZokoMalStream(
  malId: number | string,
  episode: number | string,
  mode: 'sub' | 'dub' = 'sub'
): Promise<{
  url: string;
  subtitles: SubtitleTrack[];
  intro?: { start: number; end: number } | null;
  outro?: { start: number; end: number } | null;
} | null> {
  try {
    const embedUrl = `https://zokoanime.video/stream/mal/${malId}/${episode}/${mode}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8500);

    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://hianime.at/'
      },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const html = await res.text();
    const pMatch = html.match(/window\.__P\s*=\s*["']([^"']+)["']/i);
    if (!pMatch) return null;

    const decrypted = xorDecrypt(pMatch[1]);
    if (!decrypted) return null;

    const parsed = JSON.parse(decrypted);
    if (!parsed || !parsed.src) return null;

    const subtitles: SubtitleTrack[] = Array.isArray(parsed.subtitles)
      ? parsed.subtitles
          .filter((s: any) => s && s.src)
          .map((s: any) => ({
            url: s.src,
            lang: s.lang || 'en',
            label: s.label || s.lang || 'English',
            default: s.default || s.lang === 'en'
          }))
      : [];

    return {
      url: parsed.src,
      subtitles,
      intro: parsed.intro || parsed.skip?.intro || null,
      outro: parsed.outro || parsed.skip?.outro || null
    };
  } catch (err) {
    return null;
  }
}

/**
 * 2. HINDI DUB EXTRACTOR (Blakite / Rumble Cloud CDN)
 */
export async function fetchBlakiteHindiStream(
  title: string,
  episode: number | string
): Promise<StreamServer[] | null> {
  try {
    const { 
      checkHindiDub, 
      getBlakiteDetail, 
      getBlakiteStreamUrl,
      extractSeasonInfo,
      findEpisodeInBlakite 
    } = await import('../blakite');

    const epNum = Number(episode);
    if (isNaN(epNum) || epNum <= 0) return null;

    // 1. Direct high-precision season & episode aware Hindi Dub check
    const checkResult = await checkHindiDub(title, epNum);
    if (!checkResult?.available || !checkResult.id || !checkResult.episodeAvailable) {
      // If Season is not in Hindi DB, or this specific episode is not dubbed, return null immediately.
      // NEVER fall back to Episode 1 or another season!
      return null;
    }

    let targetSlug: string | null = checkResult.matchedEpisode?.id || null;

    if (!targetSlug) {
      const detailData = await getBlakiteDetail(checkResult.id);
      if (!detailData || !detailData.episodes?.length) return null;

      const qInfo = extractSeasonInfo(title);
      const epObj = findEpisodeInBlakite(detailData.episodes as any, qInfo.season, epNum, qInfo.isSeasonExplicit);
      if (!epObj) return null;
      targetSlug = epObj.id;
    }

    if (!targetSlug) return null;

    const watchData = await getBlakiteStreamUrl(targetSlug);
    if (!watchData || !watchData.url) return null;

    const isM3U8 = watchData.isM3U8 === true || watchData.url.includes('.m3u8');
    return [
      {
        serverId: 'rumble-cdn',
        serverName: 'Rumble Cloud',
        url: watchData.url,
        type: isM3U8 ? 'm3u8' : 'mp4',
        referer: 'https://blakiteapi.xyz/'
      }
    ];
  } catch (err) {
    console.error('[Blakite Extractor Error]', err);
    return null;
  }
}

// Universal AES-256-CBC decryptor for MegaPlay buzz obfuscated stream encodings
export async function decryptMegaPlayEnc(enc: string): Promise<string | null> {
  try {
    const encKey = new TextEncoder().encode('i?LMTAx0Q6,:}50U');
    const keyBytes = new Uint8Array(32);
    keyBytes.set(encKey.subarray(0, Math.min(32, encKey.length)));
    const cryptoKey = await globalThis.crypto.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['decrypt']);
    const iv = new TextEncoder().encode("W0;27ToaUpl_P%'c");

    let b = enc.replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    let binStr: string;
    if (typeof atob !== 'undefined') {
      binStr = atob(b);
    } else if (typeof Buffer !== 'undefined') {
      binStr = Buffer.from(b, 'base64').toString('binary');
    } else {
      return null;
    }
    const cipherBytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) cipherBytes[i] = binStr.charCodeAt(i);

    const decBuffer = await globalThis.crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, cipherBytes);
    return new TextDecoder().decode(decBuffer);
  } catch {
    return null;
  }
}

// Direct .m3u8 extractor from MegaPlay buzz embeds
export async function extractMegaPlayStream(embedUrl: string): Promise<{
  m3u8: string | null;
  tracks?: any[];
  intro?: { start: number; end: number } | null;
  outro?: { start: number; end: number } | null;
}> {
  try {
    const urlMatch = embedUrl.match(/\/stream\/s-2\/(\d+)\//);
    if (!urlMatch) return { m3u8: null };
    let realId = urlMatch[1];

    // If this is a dub embed or specific track, fetch the embed page HTML to extract the exact data-id
    try {
      const pageRes = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://anikoto.net/'
        },
        signal: AbortSignal.timeout(3500)
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const dataIdMatch = html.match(/data-id=["'](\d+)["']/);
        if (dataIdMatch && dataIdMatch[1]) {
          realId = dataIdMatch[1];
        }
      }
    } catch {}

    const isTcdn = embedUrl.includes('s=tcdn');
    const getSourcesUrl = `https://megaplay.buzz/videojs/stream/getSources?id=${realId}${isTcdn ? '&s=tcdn' : ''}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(getSourcesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://megaplay.buzz/',
        'X-Requested-With': 'XMLHttpRequest'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return { m3u8: null };
    const data = await res.json();
    if (!data?.enc) return { m3u8: null };
    const dec = await decryptMegaPlayEnc(data.enc);
    if (!dec) return { m3u8: null };
    const json = JSON.parse(dec);
    return {
      m3u8: json.file || null,
      tracks: data.tracks || [],
      intro: data.intro || null,
      outro: data.outro || null
    };
  } catch {
    return { m3u8: null };
  }
}

function parseWatchResponse(text: string): any {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed?.data?.sources?.length || parsed?.sources?.length) {
      return parsed.data ? parsed : { data: parsed };
    }
  } catch {}

  const lines = trimmed.split('\n');
  const collectedSources: any[] = [];
  let collectedServers: any[] = [];
  let skipData: any = null;
  let episodeData: any = null;

  for (const line of lines) {
    const l = line.trim();
    if (!l.startsWith('data:')) continue;
    const payload = l.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const obj = JSON.parse(payload);
      if (obj.type === 'source' && obj.source) {
        collectedSources.push(obj.source);
      } else if (obj.type === 'sources' && Array.isArray(obj.sources)) {
        collectedSources.push(...obj.sources);
      } else if (obj.data?.sources && Array.isArray(obj.data.sources)) {
        collectedSources.push(...obj.data.sources);
      } else if (obj.type === 'servers' && Array.isArray(obj.servers)) {
        collectedServers = obj.servers;
      } else if (obj.type === 'skip_data' && obj.skip_data) {
        skipData = obj.skip_data;
      } else if (obj.type === 'episode' && obj.episode) {
        episodeData = obj.episode;
      }
    } catch {}
  }

  return {
    data: {
      sources: collectedSources,
      servers: collectedServers,
      skip_data: skipData,
      episode: episodeData
    }
  };
}

// In-memory MAL ID cache to avoid redundant slug/title lookups
const malIdCache = new Map<string, number>();

/**
 * Fast MAL ID resolver using Anikoto episode metadata or title search
 */
export async function resolveMalIdByTitleOrSlug(titleOrSlug: string): Promise<number | null> {
  const key = (titleOrSlug || '').toLowerCase().trim();
  if (!key) return null;
  if (malIdCache.has(key)) return malIdCache.get(key)!;

  const mirrors = [
    'https://omni-api-v1.vercel.app/api',
    'https://omni-api-v2.vercel.app/api'
  ];

  try {
    let slug = titleOrSlug;
    if (!/-[a-z0-9]{5}$/.test(slug)) {
      const clean = titleOrSlug
        .replace(/::\d+$/, '')
        .replace(/\(TV\)|\(Movie\)|\(Dub\)|\(Sub\)|Season\s*\d+|Part\s*\d+/gi, '')
        .replace(/-/g, ' ')
        .trim();

      for (const mirror of mirrors) {
        try {
          const sRes = await fetch(`${mirror}/search?keyword=${encodeURIComponent(clean)}`, {
            signal: AbortSignal.timeout(3500)
          });
          if (sRes.ok) {
            const sJson = await sRes.json();
            const top = sJson.data?.results?.[0];
            if (top?.slug) {
              slug = top.slug;
              break;
            }
          }
        } catch {}
      }
    }

    for (const mirror of mirrors) {
      try {
        const epRes = await fetch(`${mirror}/anime/${encodeURIComponent(slug)}/episodes`, {
          signal: AbortSignal.timeout(3500)
        });
        if (epRes.ok) {
          const epJson = await epRes.json();
          const firstEp = epJson.data?.episodes?.[0];
          if (firstEp?.dataMal) {
            const parsed = parseInt(firstEp.dataMal, 10);
            if (!isNaN(parsed) && parsed > 0) {
              malIdCache.set(key, parsed);
              return parsed;
            }
          }
        }
      } catch {}
    }
  } catch {}
  return null;
}

/**
 * 3. ANIKOTO GENUINE ENGLISH DUB EXTRACTOR (MegaPlay / Vidstream)
 */
export async function fetchAnikotoWatchDubStream(
  titleOrSlug: string,
  episode: number | string
): Promise<StreamServer[] | null> {
  const mirrors = [
    'https://omni-api-v1.vercel.app/api',
    'https://omni-api-v2.vercel.app/api',
    'https://omni-api-v3.vercel.app/api'
  ];

  try {
    let slug = titleOrSlug;
    const isExactHashedSlug = /-[a-z0-9]{5}$/.test(slug);

    if (!isExactHashedSlug) {
      const searchKeyword = titleOrSlug
        .replace(/::\d+$/, '')
        .replace(/\(TV\)|\(Movie\)|\(Dub\)|\(Sub\)|Season\s*\d+|Part\s*\d+/gi, '')
        .replace(/-/g, ' ')
        .trim();

      for (const mirror of mirrors) {
        try {
          const searchRes = await fetch(`${mirror}/search?keyword=${encodeURIComponent(searchKeyword)}`, {
            signal: AbortSignal.timeout(4000)
          });
          if (searchRes.ok) {
            const json = await searchRes.json();
            const results = json.data?.results || [];
            if (results.length > 0) {
              slug = results[0].slug;
              break;
            }
          }
        } catch {}
      }
    }

    let watchJson: any = null;
    for (const mirror of mirrors) {
      try {
        const watchRes = await fetch(`${mirror}/watch/${encodeURIComponent(slug)}?ep=${episode}`, {
          signal: AbortSignal.timeout(5000)
        });
        if (watchRes.ok) {
          const text = await watchRes.text();
          const parsed = parseWatchResponse(text);
          if (parsed?.data?.sources?.length || parsed?.sources?.length) {
            watchJson = parsed.data ? parsed : { data: parsed };
            break;
          }
        }
      } catch {}
    }

    // Fallback: If slug didn't produce watch sources, search by clean title and retry watch
    if (!watchJson?.data?.sources?.length && isExactHashedSlug) {
      const fallbackTitle = titleOrSlug
        .replace(/-[a-z0-9]{5}$/, '')
        .replace(/\(TV\)|\(Movie\)|\(Dub\)|\(Sub\)|Season\s*\d+|Part\s*\d+/gi, '')
        .replace(/-/g, ' ')
        .trim();

      for (const mirror of mirrors) {
        try {
          const searchRes = await fetch(`${mirror}/search?keyword=${encodeURIComponent(fallbackTitle)}`, {
            signal: AbortSignal.timeout(4000)
          });
          if (searchRes.ok) {
            const sJson = await searchRes.json();
            const results = sJson.data?.results || [];
            if (results.length > 0) {
              const newSlug = results[0].slug;
              const wRes = await fetch(`${mirror}/watch/${encodeURIComponent(newSlug)}?ep=${episode}`, {
                signal: AbortSignal.timeout(5000)
              });
              if (wRes.ok) {
                const text = await wRes.text();
                const parsed = parseWatchResponse(text);
                if (parsed?.data?.sources?.length || parsed?.sources?.length) {
                  watchJson = parsed.data ? parsed : { data: parsed };
                  break;
                }
              }
            }
          }
        } catch {}
      }
    }

    const sources = watchJson?.data?.sources || [];
    const dubSources = sources.filter((s: any) => s && s.type === 'dub' && s.url);
    if (!dubSources.length) {
      return null;
    }

    // Process all sources in parallel: extract direct .m3u8 if available, fallback to embed
    const serverPromises = dubSources.map(async (src: any, index: number) => {
      const rawName = String(src.server || '').toLowerCase();
      let serverName = 'Vidstream';
      let serverId = `vidstream-dub-${index + 1}`;
      if (rawName.includes('vidstream-1')) {
        serverName = 'Vidstream';
        serverId = 'vidstream-dub';
      } else if (rawName.includes('vidstream') || rawName.includes('2')) {
        serverName = 'Vidstreaming';
        serverId = 'vidstreaming-dub';
      } else if (rawName.includes('hd')) {
        serverName = 'MegaCloud Mirror';
        serverId = 'megacloud-mirror-dub';
      }

      // Extract direct .m3u8 stream from MegaPlay
      const direct = await extractMegaPlayStream(src.url).catch(() => null);
      if (direct?.m3u8) {
        return {
          serverId,
          serverName,
          url: direct.m3u8,
          type: 'm3u8' as const,
          referer: 'https://megaplay.buzz/',
          tracks: direct.tracks,
          intro: direct.intro,
          outro: direct.outro
        };
      }

      // If direct extraction fails, provide playable embed URL as resilient backup
      return {
        serverId: `${serverId}-embed`,
        serverName: `${serverName} (Embed)`,
        url: src.url,
        type: (src.url.includes('.m3u8') ? 'm3u8' : 'embed') as 'm3u8' | 'embed',
        referer: 'https://megaplay.buzz/'
      };
    });

    const resolved = await Promise.all(serverPromises);

    // Prioritize direct .m3u8 streams first, then rank Vidstream > Vidstreaming > MegaCloud Mirror > Embed
    const rank = (s: StreamServer) => {
      const typeRank = s.type === 'm3u8' ? 0 : 10;
      if (s.serverName.startsWith('Vidstream')) return typeRank + 1;
      if (s.serverName.startsWith('Vidstreaming')) return typeRank + 2;
      if (s.serverName.startsWith('MegaCloud')) return typeRank + 3;
      return typeRank + 4;
    };
    resolved.sort((a, b) => rank(a) - rank(b));

    return resolved.length > 0 ? resolved : null;
  } catch (err) {
    console.error('[fetchAnikotoWatchDubStream] Exception:', err);
    return null;
  }
}

/**
 * 4. UNIFIED RESOLVER
 * Combines Sub, English Dub, and Hindi Dub into clean audio tracks and server arrays.
 */
export async function resolveUnifiedStreams({
  malId,
  title,
  episode = 1,
  countryOfOrigin = 'JP',
  knownHasDub = false
}: {
  malId?: number | string | null;
  title: string;
  episode: number | string;
  countryOfOrigin?: string;
  knownHasDub?: boolean;
}): Promise<UnifiedStreamResult> {
  const epNum = Number(episode) || 1;
  let origin = (countryOfOrigin || 'JP').toUpperCase();

  // Smart origin fallback if countryOfOrigin is default 'JP'
  if (origin === 'JP') {
    const lowerTitle = (title || '').toLowerCase();
    if (/(?:douluo|dalu|donghua|soul land|battle through the heavens|perfect world|swallowed star|link click|shiguang|immortal king|xian wang|tian guan|mo dao|a will eternal|tales of demons)\b/.test(lowerTitle)) {
      origin = 'CN';
    } else if (/(?:lookism)\b/.test(lowerTitle)) {
      origin = 'KR';
    }
  }

  const isChinese = origin === 'CN';
  const isKorean = origin === 'KR';
  const primarySubId = isChinese ? 'cn' : (isKorean ? 'kr' : 'jp');
  const primarySubLabel = isChinese ? 'CN • Sub' : (isKorean ? 'KR • Sub' : 'JP • Sub');
  const primaryLanguage = isChinese ? 'Chinese' : (isKorean ? 'Korean' : 'Japanese');

  // Check cache (only valid if at least one server array was non-empty)
  const cacheKey = `${malId || title}_${epNum}_${primarySubId}`;
  const cached = streamCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    if (cached.data.servers[primarySubId]?.length > 0 || cached.data.servers.en?.length > 0) {
      return cached.data;
    }
  }

  const serversByAudio: Record<string, StreamServer[]> = {
    [primarySubId]: [],
    en: [],
    hi: []
  };

  let globalSubtitles: SubtitleTrack[] = [];
  let introData: { start: number; end: number } | null = null;
  let outroData: { start: number; end: number } | null = null;

  // Resolve MAL ID if not provided directly
  let effectiveMalId = malId ? Number(malId) : undefined;
  if (!effectiveMalId) {
    const resolved = await resolveMalIdByTitleOrSlug(title);
    if (resolved) effectiveMalId = resolved;
  }

  // Run Sub, English Dub, and Hindi resolution in parallel
  const fetchPromises: Promise<any>[] = [];

  // A. Primary Sub via ZokoAnime (if MAL ID available)
  if (effectiveMalId) {
    fetchPromises.push(
      fetchZokoMalStream(effectiveMalId, epNum, 'sub').then(subRes => {
        if (subRes?.url) {
          serversByAudio[primarySubId].push({
            serverId: 'megacloud-sub',
            serverName: 'MegaCloud',
            url: subRes.url,
            type: 'm3u8',
            referer: 'https://zokoanime.video/',
            tracks: subRes.subtitles?.map(s => ({ file: s.url, label: s.label, default: s.default })),
            intro: subRes.intro,
            outro: subRes.outro
          });
          if (subRes.subtitles?.length) globalSubtitles = subRes.subtitles;
          if (subRes.intro) introData = subRes.intro;
          if (subRes.outro) outroData = subRes.outro;
        }
      })
    );
  }

  // B1. English Dub via ZokoAnime Direct HLS (High Availability Direct .m3u8 + Subtitles + Auto-Skip)
  if (effectiveMalId) {
    fetchPromises.push(
      fetchZokoMalStream(effectiveMalId, epNum, 'dub').then(dubRes => {
        if (dubRes?.url) {
          serversByAudio.en.push({
            serverId: 'megacloud-dub',
            serverName: 'MegaCloud',
            url: dubRes.url,
            type: 'm3u8',
            referer: 'https://zokoanime.video/',
            tracks: dubRes.subtitles?.map(s => ({ file: s.url, label: s.label, default: s.default })),
            intro: dubRes.intro,
            outro: dubRes.outro
          });
          if (dubRes.subtitles?.length && !globalSubtitles.length) {
            globalSubtitles = dubRes.subtitles;
          }
          if (dubRes.intro && !introData) introData = dubRes.intro;
          if (dubRes.outro && !outroData) outroData = dubRes.outro;
        }
      })
    );
  }

  // B2. English Dub via Anikoto (MegaPlay / Vidstream / Vidstreaming)
  fetchPromises.push(
    fetchAnikotoWatchDubStream(title, epNum).then(dubServers => {
      if (dubServers?.length) {
        for (const s of dubServers) {
          // Avoid duplicate URLs
          if (!serversByAudio.en.some(existing => existing.url === s.url)) {
            serversByAudio.en.push(s);
          }
        }
        const withTracks = dubServers.find(s => s.tracks && s.tracks.length > 0);
        if (withTracks && withTracks.tracks && !globalSubtitles.length) {
          globalSubtitles = withTracks.tracks.map((t: any) => ({
            url: t.file,
            lang: t.label?.toLowerCase()?.slice(0, 2) || 'en',
            label: t.label || 'English',
            default: !!t.default
          }));
        }
        const withIntro = dubServers.find(s => s.intro);
        if (withIntro?.intro && !introData) introData = withIntro.intro;
        const withOutro = dubServers.find(s => s.outro);
        if (withOutro?.outro && !outroData) outroData = withOutro.outro;
      }
    })
  );

  // C. Hindi Dub via Blakite
  fetchPromises.push(
    fetchBlakiteHindiStream(title, epNum).then(hindiServers => {
      if (hindiServers?.length) {
        serversByAudio.hi.push(...hindiServers);
      }
    })
  );

  await Promise.allSettled(fetchPromises);

  // If Sub only has 1 server and it's m3u8, synthesize Vidstreaming mirror for failover UI
  if (serversByAudio[primarySubId].length === 1 && serversByAudio[primarySubId][0].type === 'm3u8') {
    const primary = serversByAudio[primarySubId][0];
    serversByAudio[primarySubId].push({
      serverId: 'vidstreaming-sub',
      serverName: 'Vidstreaming',
      url: primary.url,
      type: primary.type,
      referer: primary.referer,
      tracks: primary.tracks,
      intro: primary.intro,
      outro: primary.outro
    });
  }

  // If English Dub only has 1 direct m3u8 server, synthesize Vidstreaming mirror for failover UI
  if (serversByAudio.en.length === 1 && serversByAudio.en[0].type === 'm3u8') {
    const primaryDub = serversByAudio.en[0];
    serversByAudio.en.push({
      serverId: 'vidstreaming-dub',
      serverName: 'Vidstreaming',
      url: primaryDub.url,
      type: primaryDub.type,
      referer: primaryDub.referer,
      tracks: primaryDub.tracks,
      intro: primaryDub.intro,
      outro: primaryDub.outro
    });
  }

  // Sort English Dub servers so direct m3u8 comes before embed
  serversByAudio.en.sort((a, b) => {
    if (a.type === 'm3u8' && b.type !== 'm3u8') return -1;
    if (a.type !== 'm3u8' && b.type === 'm3u8') return 1;
    return 0;
  });

  // Synchronize captions and intro/outro markers across ALL audio tracks (JP, EN, HI)
  for (const audioKey of Object.keys(serversByAudio)) {
    for (const server of serversByAudio[audioKey]) {
      if ((!server.tracks || server.tracks.length === 0) && globalSubtitles.length > 0) {
        server.tracks = globalSubtitles.map(s => ({ file: s.url, label: s.label, default: s.default }));
      }
      if (!server.intro && introData) server.intro = introData;
      if (!server.outro && outroData) server.outro = outroData;
    }
  }

  // Ensure universal aliases exist in serversByAudio
  if (!serversByAudio.sub || serversByAudio.sub.length === 0) {
    serversByAudio.sub = serversByAudio[primarySubId] || [];
  }
  if (!serversByAudio.dub || serversByAudio.dub.length === 0) {
    serversByAudio.dub = serversByAudio.en || [];
  }
  if (!serversByAudio.jp || serversByAudio.jp.length === 0) {
    serversByAudio.jp = serversByAudio[primarySubId] || [];
  }

  // Build clean AudioTrack options
  const hasSub = serversByAudio[primarySubId].length > 0;
  const hasEnDub = serversByAudio.en.length > 0 || knownHasDub;
  const hasHindi = serversByAudio.hi.length > 0;

  const audioTracks: AudioTrackOption[] = [
    {
      id: primarySubId as any,
      label: primarySubLabel,
      language: primaryLanguage,
      type: 'sub',
      available: hasSub
    },
    {
      id: 'en',
      label: 'EN • Dub',
      language: 'English',
      type: 'dub',
      available: hasEnDub
    },
    {
      id: 'hi',
      label: 'HI • Dub',
      language: 'Hindi',
      type: 'dub',
      available: hasHindi
    }
  ];

  const result: UnifiedStreamResult = {
    audioTracks,
    servers: serversByAudio,
    subtitles: globalSubtitles,
    intro: introData,
    outro: outroData
  };

  // Only cache if servers were successfully found
  if (serversByAudio[primarySubId].length > 0 || serversByAudio.en.length > 0) {
    streamCache.set(cacheKey, { timestamp: Date.now(), data: result });
  }

  return result;
}
