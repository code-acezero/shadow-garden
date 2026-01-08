// api/proxy.js
const axios = require('axios');

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('Missing URL');
  }

  try {
    const targetUrl = decodeURIComponent(url);
    
    // Setup Headers to mimic a real browser
    const proxyHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://megacloud.blog/',
      'Origin': 'https://megacloud.blog',
      'Accept': '*/*',
      'Accept-Encoding': 'identity', // Important: prevent compression issues
    };

    // Fetch the resource
    const response = await axios.get(targetUrl, {
      headers: proxyHeaders,
      responseType: 'arraybuffer',
      validateStatus: () => true,
      maxRedirects: 5,
    });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    // Forward the content type
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Handle M3U8 manifest rewriting
    const isManifest = targetUrl.includes('.m3u8') || 
                       contentType.includes('mpegurl') || 
                       contentType.includes('x-mpegURL');

    if (isManifest) {
      let manifest = response.data.toString('utf8');
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      // Rewrite URLs in the manifest
      manifest = manifest.split('\n').map(line => {
        // Skip comments and empty lines
        if (line.startsWith('#') || line.trim() === '') {
          return line;
        }

        // Handle URIs in #EXT-X-KEY (encryption keys)
        if (line.includes('URI=')) {
          return line.replace(/URI="([^"]+)"/g, (match, uri) => {
            const absoluteUrl = uri.startsWith('http') ? uri : new URL(uri, baseUrl).toString();
            return `URI="/api/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
          });
        }

        // Handle regular URLs (segments, sub-manifests)
        let absoluteUrl = line.trim();
        if (!absoluteUrl.startsWith('http')) {
          absoluteUrl = new URL(absoluteUrl, baseUrl).toString();
        }
        return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
      }).join('\n');

      return res.send(manifest);
    }

    // For video chunks (.ts) or other binary data
    return res.send(response.data);

  } catch (error) {
    console.error(`Proxy Error for ${url}:`, error.message);
    res.status(error.response?.status || 500).send(`Proxy Error: ${error.message}`);
  }
};