// api/proxy.js
const axios = require('axios');

module.exports = async (req, res) => {
  const { url } = req.query;

  // Log incoming request
  console.log('=== PROXY REQUEST ===');
  console.log('Target URL:', url);

  if (!url) {
    console.log('ERROR: Missing URL');
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const targetUrl = decodeURIComponent(url);
    console.log('Decoded URL:', targetUrl);
    
    // Setup headers
    const proxyHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
      'Connection': 'keep-alive',
    };

    // Add origin/referer only for the main domain
    if (targetUrl.includes('netmagcdn.com') || targetUrl.includes('megacloud')) {
      proxyHeaders['Referer'] = 'https://megacloud.blog/';
      proxyHeaders['Origin'] = 'https://megacloud.blog';
    }

    console.log('Request headers:', Object.keys(proxyHeaders));

    // Fetch the resource
    const response = await axios.get(targetUrl, {
      headers: proxyHeaders,
      responseType: 'arraybuffer',
      validateStatus: () => true,
      maxRedirects: 5,
      timeout: 30000,
    });

    console.log('Response status:', response.status);
    console.log('Response content-type:', response.headers['content-type']);
    console.log('Response size:', response.data.length, 'bytes');

    // If error status, log and return
    if (response.status >= 400) {
      console.log('ERROR: Upstream returned', response.status);
      return res.status(response.status).send(response.data);
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', '*');
    
    // Forward content type
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Check if this is an M3U8 manifest
    const isManifest = targetUrl.includes('.m3u8') || 
                       contentType.includes('mpegurl') || 
                       contentType.includes('x-mpegURL') ||
                       contentType.includes('vnd.apple.mpegurl');

    if (isManifest) {
      console.log('*** MANIFEST DETECTED ***');
      let manifest = response.data.toString('utf8');
      console.log('Original manifest preview:', manifest.substring(0, 300));
      
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      console.log('Base URL:', baseUrl);

      const lines = manifest.split('\n');
      const rewrittenLines = lines.map((line, index) => {
        const trimmed = line.trim();
        
        // Skip empty lines
        if (trimmed === '') return line;
        
        // Skip comments that don't have URIs
        if (trimmed.startsWith('#')) {
          // Handle #EXT-X-KEY with URI
          if (trimmed.includes('URI=')) {
            const rewritten = trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
              let absoluteUrl = uri;
              if (!uri.startsWith('http')) {
                absoluteUrl = new URL(uri, baseUrl).toString();
              }
              const proxied = `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
              console.log(`  [Line ${index}] Rewriting KEY URI: ${uri} -> ${proxied}`);
              return `URI="${proxied}"`;
            });
            return rewritten;
          }
          return line;
        }

        // Handle segment/playlist URLs
        let absoluteUrl = trimmed;
        if (!trimmed.startsWith('http')) {
          try {
            absoluteUrl = new URL(trimmed, baseUrl).toString();
          } catch (e) {
            console.log(`  [Line ${index}] Failed to parse URL: ${trimmed}`);
            return line;
          }
        }
        const proxied = `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
        console.log(`  [Line ${index}] Rewriting: ${trimmed.substring(0, 50)}... -> ${proxied.substring(0, 80)}...`);
        return proxied;
      });

      manifest = rewrittenLines.join('\n');
      console.log('Rewritten manifest preview:', manifest.substring(0, 300));
      console.log('=== END PROXY REQUEST ===\n');
      
      return res.send(manifest);
    }

    // For video segments
    console.log('Sending binary data (video segment)');
    console.log('=== END PROXY REQUEST ===\n');
    return res.send(response.data);

  } catch (error) {
    console.error('=== PROXY ERROR ===');
    console.error('URL:', url);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data?.toString().substring(0, 200));
    }
    console.error('=== END PROXY ERROR ===\n');
    
    return res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      url: url
    });
  }
};