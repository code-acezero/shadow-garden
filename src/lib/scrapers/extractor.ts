import { type Browser, type Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const cleanUrl = (raw: string) => raw.replace(/\\\//g, '/').replace(/\\"/g, '').replace(/\\/g, '').trim();

const decodeBase64 = (str: string) => {
  try { return Buffer.from(str, 'base64').toString('utf-8'); } catch (e) { return null; }
};

// --- HUMAN SIMULATION HELPER ---
const humanMove = async (page: Page | any, x: number, y: number) => {
    try {
        await page.mouse.move(x, y, { steps: 5 });
    } catch(e) {}
};

export const SourceExtractor = {
  // --- MAIN ENTRY POINT ---
  async extractStream(serverUrl: string): Promise<any> {
    if (serverUrl.includes('player1.php') && serverUrl.includes('data=')) {
      return this.extractMultiAudio(serverUrl);
    }
    // Route difficult servers to the "Ad Assassin" browser
    if (serverUrl.includes('zephyrflick') || serverUrl.includes('abysscdn') || serverUrl.includes('short.icu')) {
      return await this.extractWithBrowser(serverUrl);
    }
    return { error: "Unsupported server type", url: serverUrl };
  },

  extractMultiAudio(url: string) {
    try {
      const urlObj = new URL(url);
      const dataParam = urlObj.searchParams.get('data');
      if (!dataParam) return { error: "No data param found" };
      const jsonStr = decodeBase64(dataParam);
      if (!jsonStr) return { error: "Failed to decode base64" };
      const streams = JSON.parse(jsonStr);
      return {
        type: 'multi_audio_list',
        streams: streams.map((s: any) => ({
          language: s.language,
          url: s.link, 
          isShortened: true 
        }))
      };
    } catch (e: any) {
      return { error: "Multi-Audio parsing failed", details: e.message };
    }
  },

  // --- LOGIC 2: THE "AD ASSASSIN" BROWSER ---
  async extractWithBrowser(targetUrl: string): Promise<any> {
    let browser: any = null;
    try {
      const isVercel = !!process.env.VERCEL;

      // 1. SETUP: Configure browser to ALLOW ads (so Abyss doesn't block us)
      // We turn OFF the popup blocker here.
      const launchArgs = [
        ...chromium.args, 
        '--disable-popup-blocking', // <--- KEY: Let them try to open ads
        '--disable-blink-features=AutomationControlled', 
        '--no-sandbox', 
        '--disable-setuid-sandbox'
      ];

      if (isVercel) {
        const puppeteerCore = await import('puppeteer-core');
        chromium.setGraphicsMode = false;
        browser = await puppeteerCore.default.launch({
          args: launchArgs, 
          defaultViewport: { width: 1280, height: 720 },
          executablePath: await chromium.executablePath(),
          headless: true,
        });
      } else {
        const puppeteer = await import('puppeteer');
        browser = await puppeteer.default.launch({
          headless: true, 
          args: launchArgs
        });
      }

      const pages = await browser.pages();
      const mainPage = pages.length > 0 ? pages[0] : await browser.newPage();
      
      // 2. THE ASSASSIN: Listen for new tabs (Ads) and kill them immediately
      browser.on('targetcreated', async (target: any) => {
          try {
              if (target.type() === 'page') {
                  const newPage = await target.page();
                  // Check if this is the main page. If not, it's an ad.
                  if (newPage && newPage !== mainPage) {
                      // We let it exist for 100ms so the player "thinks" it worked
                      // console.log("Ad popup detected... Assassinating.");
                      setTimeout(async () => {
                          try { await newPage.close(); } catch(e) {}
                      }, 500); 
                  }
              }
          } catch (e) {}
      });

      // 3. STEALTH: Hide automation
      await mainPage.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => false });
      });
      await mainPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // 4. NETWORK SNIFFER: Catch the video link
      let m3u8Url: string | null = null;
      await mainPage.setRequestInterception(true);
      
      mainPage.on('request', (req: any) => {
        try {
            if (req.isInterceptResolutionHandled()) return;
            const url = req.url();
            
            // Capture Video
            if (url.includes('.m3u8') || (url.includes('.mp4') && !url.includes('short.icu'))) {
                m3u8Url = url;
                req.abort(); // Stop loading once we have it
                return;
            } 
            
            // CRITICAL: ALLOW scripts/frames (Abyss needs these to "verify" us)
            // Only block heavy media like images/fonts to save bandwidth
            if (['image', 'font', 'stylesheet'].includes(req.resourceType())) {
                req.abort();
                return;
            }
            req.continue();
        } catch (e) {}
      });

      // 5. NAVIGATION
      try {
        await mainPage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // --- PHASE 1: CLICK THROUGH LANDING PAGE ---
        // Abyss often has a "Welcome" click-through screen.
        await new Promise(r => setTimeout(r, 2000));
        await mainPage.mouse.click(640, 360); // Blind click center to clear overlay
        
        // --- PHASE 2: TURNSTILE / CLOUDFLARE ---
        try {
            const frames = mainPage.frames();
            for (const frame of frames) {
                const turnstile = await frame.$('input[type="checkbox"]');
                if (turnstile) {
                    const box = await turnstile.boundingBox();
                    if (box) {
                        await humanMove(mainPage, box.x + 5, box.y + 5);
                        await mainPage.mouse.click(box.x + 5, box.y + 5);
                        await new Promise(r => setTimeout(r, 4000)); 
                    }
                }
            }
        } catch(e) {}

        // --- PHASE 3: INTERACT WITH PLAYER ---
        // We simulate a user trying to play. This triggers the ad (which we kill).
        try {
             // Look for player inside frames
             const frames = mainPage.frames();
             for (const frame of frames) {
                // Try clicking standard play buttons
                const btn = await frame.$('.jw-display-icon-container, .vjs-big-play-button, .play-wrapper, video');
                if (btn) {
                    const box = await btn.boundingBox();
                    if (box) {
                        // Move and Click
                        await humanMove(mainPage, box.x + box.width/2, box.y + box.height/2);
                        await mainPage.mouse.click(box.x + box.width/2, box.y + box.height/2);
                        // Abyss needs a second click after the ad opens
                        await new Promise(r => setTimeout(r, 1000));
                        await mainPage.mouse.click(box.x + box.width/2, box.y + box.height/2);
                    }
                }
             }
             // Backup: Spacebar
             await mainPage.keyboard.press('Space');
        } catch (e) {}

        await new Promise(r => setTimeout(r, 3000));

        // --- PHASE 4: DIRECT EXTRACTION (Backup) ---
        if (!m3u8Url) {
             const content = await mainPage.content();
             let match = content.match(/(https?:\\?\/\\?\/[^"'\s]+\.m3u8[^"'\s]*)/);
             if (match && match[1]) m3u8Url = cleanUrl(match[1]);
        }

      } catch (e) {
        console.log("Navigation timeout...");
      }

      // --- DEBUG ---
      let debugScreenshot = "";
      if (!m3u8Url) {
          try {
              if (browser.isConnected() && !mainPage.isClosed()) {
                  const screenshotBuffer = await mainPage.screenshot({ encoding: 'base64' });
                  debugScreenshot = `data:image/png;base64,${screenshotBuffer}`;
              }
          } catch (e) {}
      }

      await browser.close();

      if (m3u8Url) {
          return {
            type: (m3u8Url as string).includes('.m3u8') ? 'hls' : 'mp4',
            source: 'Puppeteer Extract',
            file: m3u8Url,
            headers: {
                'Referer': 'https://abysscdn.com/', 
                'User-Agent': 'Mozilla/5.0'
            }
          };
      }

      return { 
          error: "Media Not Found", 
          debug: "Ad Assassin failed",
          screenshot: debugScreenshot 
      };

    } catch (e: any) {
      if (browser) await browser.close();
      return { error: "Browser Failed", details: e.message };
    }
  }
};