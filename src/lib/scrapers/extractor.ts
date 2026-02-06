export const SourceExtractor = {
  async extractStream(embedUrl: string): Promise<any> {
    try {
      if (!embedUrl || !embedUrl.startsWith('http')) {
          return { error: "Invalid URL", url: embedUrl };
      }

      // 1. Fetch HTML with headers mimicking a real user
      const res = await fetch(embedUrl, {
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://desidubanime.me/"
        },
        redirect: 'follow'
      });
      const html = await res.text();

      // 2. Specific Logic for Known Hosts
      
      // --- ABYSS / SHORT.ICU (Best chance for .m3u8) ---
      if (embedUrl.includes('abyss') || embedUrl.includes('short.icu')) {
          // Look for: file: "..."
          const match = html.match(/file:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/);
          if (match) {
              return { type: 'hls', file: match[1], headers: { 'Referer': embedUrl } };
          }
      }

      // --- GD MIRROR BOT (Often hidden in scripts) ---
      if (embedUrl.includes('gdmirrorbot')) {
          // Look for standard JWPlayer setup
          const match = html.match(/file:\s*["'](https?:\/\/[^"']+)["']/);
          if (match && (match[1].includes('.m3u8') || match[1].includes('.mp4'))) {
              return { type: 'hls', file: match[1], headers: { 'Referer': embedUrl } };
          }
      }

      // 3. GENERIC "BRUTE FORCE" REGEX
      // If specific logic failed, try finding ANY video link in the source code
      
      // Pattern A: .m3u8 links (HLS)
      const m3u8Global = html.match(/(https?:\/\/[a-zA-Z0-9\-_./]+\.m3u8[a-zA-Z0-9\-_./?=]*)/);
      if (m3u8Global) {
          return { type: 'hls', file: m3u8Global[1], headers: { 'Referer': embedUrl } };
      }

      // Pattern B: .mp4 links (Direct)
      const mp4Global = html.match(/(https?:\/\/[a-zA-Z0-9\-_./]+\.mp4[a-zA-Z0-9\-_./?=]*)/);
      if (mp4Global) {
          return { type: 'mp4', file: mp4Global[1], headers: { 'Referer': embedUrl } };
      }

      // 4. Return failure
      return { error: "No stream found", debugUrl: embedUrl };

    } catch (e: any) {
      return { error: "Extractor Error", details: e.message };
    }
  }
};