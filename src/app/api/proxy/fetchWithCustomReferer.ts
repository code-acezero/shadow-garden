// src/lib/proxy/fetchWithCustomReferer.ts

export async function fetchWithCustomReferer(url: string, refererUrl: string) {
  if (!url) throw new Error("URL is required");
  
  try {
    const urlObj = new URL(refererUrl);
    
    const response = await fetch(url, {
      headers: {
        "Referer": refererUrl,
        "Origin": urlObj.origin,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
      },
      redirect: 'follow',
      // Next.js handles timeouts automatically usually, but we can't set it easily in standard fetch
    });

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}