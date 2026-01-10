import { NextRequest, NextResponse } from 'next/server';
import { fetchWithCustomReferer } from './fetchWithCustomReferer';
import { rewritePlaylistUrls } from './rewritePlaylistUrls';

// =========================================================
// 1. DOMAIN & REFERER CONFIGURATION
// =========================================================
// We map specific video domains to the "Password" (Referer) they require.
const REFERER_MAP: Record<string, string> = {
  // --- HiAnime / MegaCloud Family ---
  'megacloud': 'https://megacloud.blog/',
  'rapid-cloud': 'https://megacloud.blog/',
  'dokicloud': 'https://megacloud.blog/',
  'stormshade': 'https://megacloud.blog/',
  'rabbitstream': 'https://megacloud.blog/',
  
  // --- AnimePahe / Kwik Family ---
  'kwik': 'https://kwik.cx/',
  'uwucdn': 'https://kwik.cx/',
  'animepahe': 'https://animepahe.ru/',
  
  // --- GogoAnime Family ---
  'gogocdn': 'https://gogoanime.tel/',
  'vidstreaming': 'https://gogoanime.tel/',
  'goload': 'https://gogoanime.tel/',
  'playtaku': 'https://gogoanime.tel/',
  
  // --- Third Party / Generic ---
  'streamtape': 'https://streamtape.com/',
  'mp4upload': 'https://mp4upload.com/',
  'dood': 'https://dood.wf/'
};

// Default fallback if the domain isn't in our list
const DEFAULT_REFERER = "https://megacloud.blog/"; 

// Helper to pick the right referer based on the video URL
function determineReferer(videoUrl: string): string {
  const lowerUrl = videoUrl.toLowerCase();
  
  for (const [domainKey, referer] of Object.entries(REFERER_MAP)) {
    if (lowerUrl.includes(domainKey)) {
      return referer;
    }
  }
  return DEFAULT_REFERER;
}
// =========================================================

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  const decodedUrl = decodeURIComponent(url);
  const isM3U8 = decodedUrl.includes('.m3u8');

  // DYNAMIC REFERER SELECTION (Replaces the hardcoded constant)
  const dynamicReferer = determineReferer(decodedUrl);

  try {
    // 1. FETCH (Using the dynamic referer, keeping core logic identical)
    const response = await fetchWithCustomReferer(decodedUrl, dynamicReferer);

    if (!response.ok) {
      return NextResponse.json({
        error: response.statusText,
        status: response.status
      }, { status: response.status });
    }

    // 2. PROCESS
    if (isM3U8) {
      const playlistText = await response.text();
      const modifiedPlaylist = rewritePlaylistUrls(playlistText, decodedUrl);

      return new NextResponse(modifiedPlaylist, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=600"
        }
      });
    } else {
      // Binary data (segments)
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "video/mp2t",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=31536000"
        }
      });
    }

  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json({
      error: "Failed to fetch data",
      details: error.message
    }, { status: 500 });
  }
}

// Handle CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}