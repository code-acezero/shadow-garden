const axios = require('axios');

module.exports = async (req, res) => {
  const { url, headers } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    // 1. Prepare Headers (Fake a real browser request)
    const requestHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://megacloud.blog/', // The magic key usually needed
      'Origin': 'https://megacloud.blog',
    };

    // If the frontend sent extra custom headers, merge them
    if (headers) {
      try {
        const customHeaders = JSON.parse(headers);
        Object.assign(requestHeaders, customHeaders);
      } catch (e) {
        console.error("Failed to parse custom headers");
      }
    }

    // 2. Fetch the resource from the video server
    const response = await axios({
      url: decodeURIComponent(url),
      method: 'GET',
      headers: requestHeaders,
      responseType: 'stream', // Important for video chunks
      validateStatus: () => true, // Don't throw error on 404/403
    });

    // 3. Forward the headers back to your frontend
    // (We allow everything for CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }

    // 4. Pipe the data (stream) to the response
    response.data.pipe(res);

  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch resource', details: error.message });
  }
};