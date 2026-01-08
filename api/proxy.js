// api/proxy.js
const axios = require('axios');

module.exports = async (req, res) => {
  const { url, headers } = req.query;

  if (!url) {
    return res.status(400).send('Missing URL');
  }

  try {
    const targetUrl = decodeURIComponent(url);
    
    // 1. Setup Headers to mimic a real browser visiting the site
    const proxyHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://megacloud.blog/', // The key to bypassing the block
      'Origin': 'https://megacloud.blog',
    };

    // 2. Fetch the resource
    const response = await axios.get(targetUrl, {
      headers: proxyHeaders,
      responseType: 'arraybuffer', // Important: Handle binary data (video chunks) correctly
      validateStatus: () => true, // Don't throw on 404/403, just forward them
    });

    // 3. Set CORS headers so your React app can read this
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/vnd.apple.mpegurl');

    // 4. SMART REWRITE: If it's an M3U8 playlist, rewrite the links inside!
    if (targetUrl.includes('.m3u8') || (response.headers['content-type'] && response.headers['content-type'].includes('mpegurl'))) {
      let manifest = response.data.toString('utf8');
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      // Rewrite absolute URLs (http...) to go through this proxy
      // Rewrite relative URLs (segment.ts) to be absolute proxy URLs
      manifest = manifest.replace(/^(?!#)(.*)$/gm, (match) => {
        let absoluteUrl = match;
        if (!match.startsWith('http')) {
          absoluteUrl = new URL(match, baseUrl).toString();
        }
        // Recursively proxy the chunks
        return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
      });

      return res.send(manifest);
    }

    // 5. For video chunks (.ts) or keys, just send the raw data
    return res.send(response.data);

  } catch (error) {
    console.error(`Proxy Error for ${url}:`, error.message);
    res.status(500).send('Proxy Error');
  }
};