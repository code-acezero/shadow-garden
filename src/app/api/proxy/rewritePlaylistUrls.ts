// src/lib/proxy/rewritePlaylistUrls.ts

export function rewritePlaylistUrls(playlistText: string, baseUrl: string, referer?: string) {
  const base = new URL(baseUrl);
  const refererSuffix = referer ? `&referer=${encodeURIComponent(referer)}` : '';
  
  return playlistText
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      
      if (!trimmed) return line;

      // 1. HANDLE TAGS WITH URI ATTRIBUTES (Keys, Audio, Subtitles, Init Maps)
      // Examples: #EXT-X-KEY:...,URI="mon.key", #EXT-X-MEDIA:TYPE=AUDIO,...,URI="aud/a0/index.m3u8", #EXT-X-MAP:URI="init.mp4"
      if (trimmed.startsWith("#") && trimmed.includes("URI=")) {
        return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
          try {
            const resolvedUrl = new URL(uri, base).href;
            return `URI="/api/proxy?url=${encodeURIComponent(resolvedUrl)}${refererSuffix}"`;
          } catch (e) {
            return match;
          }
        });
      }

      // 2. SKIP OTHER TAGS / COMMENTS
      if (trimmed.startsWith("#")) {
        return line;
      }

      // 3. HANDLE VIDEO SEGMENTS
      // Safety Guard: Don't double-proxy
      if (trimmed.includes("/api/proxy")) {
        return trimmed;
      }

      try {
        const resolvedUrl = new URL(trimmed, base).href;
        
        // Safety Guard 2
        if (resolvedUrl.includes("/api/proxy")) {
            return trimmed;
        }

        return `/api/proxy?url=${encodeURIComponent(resolvedUrl)}${refererSuffix}`;
      } catch (e) {
        return line; 
      }
    })
    .join("\n");
}