// src/lib/proxy/rewritePlaylistUrls.ts

export function rewritePlaylistUrls(playlistText: string, baseUrl: string) {
  const base = new URL(baseUrl);
  
  return playlistText
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      
      if (!trimmed) return line;

      // 1. HANDLE ENCRYPTION KEYS (The Fix for mon.key error)
      // Example: #EXT-X-KEY:METHOD=AES-128,URI="https://.../mon.key"
      if (trimmed.startsWith("#EXT-X-KEY") && trimmed.includes("URI=")) {
        return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
          try {
            // Resolve relative URLs for keys too
            const resolvedKeyUrl = new URL(uri, base).href;
            
            // Wrap the key URL in your proxy
            return `URI="/api/proxy?url=${encodeURIComponent(resolvedKeyUrl)}"`;
          } catch (e) {
            return match; // Keep original if fail
          }
        });
      }

      // 2. SKIP OTHER COMMENTS
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

        return `/api/proxy?url=${encodeURIComponent(resolvedUrl)}`;
      } catch (e) {
        return line; 
      }
    })
    .join("\n");
}