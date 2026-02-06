import { NextRequest, NextResponse } from "next/server";
import { DesiDubService, FilterParams } from "@/lib/scrapers/desidub";
import { SourceExtractor } from "@/lib/scrapers/extractor";
import { Element } from "domhandler";

export const runtime = "nodejs"; 
export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = (searchParams.get("action") || "home").toLowerCase();
  
  const service = new DesiDubService();

  try {
    // ------------------------------------------
    // 1. HOME
    // ------------------------------------------
    if (action === "home") {
        return json({ success: true, data: await service.getHome() });
    }

    // ------------------------------------------
    // 2. SEARCH SUGGESTIONS (Autocomplete)
    // ------------------------------------------
    if (action === "suggestions") {
        const q = searchParams.get("q");
        if (!q) return json({ success: true, data: [] });

        const suggestions = await service.getSuggestions(q);
        
        return json({ 
            success: true, 
            data: suggestions.map(s => ({ 
                id: s.id, 
                title: s.title, 
                image: s.image, 
                url: s.url,
                year: s.year,
                type: s.type
            })) 
        });
    }

    // ------------------------------------------
    // 3. SEARCH & FILTER
    // ------------------------------------------
    if (action === "search" || action === "filter") {
        const params: FilterParams = {
            keyword: searchParams.get("q") || undefined,
            page: parseInt(searchParams.get("page") || "1"),
            year: searchParams.get("year") || undefined,
            season: searchParams.get("season") || undefined,
            sort: searchParams.get("sort") || "popular",
            order: searchParams.get("order") || "desc",
            genre: searchParams.get("genre")?.split(",").filter(Boolean),
            status: searchParams.get("status")?.split(",").filter(Boolean),
            type: searchParams.get("type")?.split(",").filter(Boolean),
        };

        const data = await service.search(params);
        return json({ success: true, data });
    }

    // ------------------------------------------
    // 4. DETAILS
    // ------------------------------------------
    if (action === "details") {
        const id = searchParams.get("id");
        if (!id) return json({ error: "Missing id" }, 400);
        
        const details = await service.getDetails(id);
        return json({ success: true, data: details });
    }

    // ------------------------------------------
    // 5. STREAMING
    // ------------------------------------------
    if (action === "stream") {
        const id = searchParams.get("id");
        if (!id) return json({ error: "Missing id" }, 400);

        const streamData = await service.getStream(id);
        const servers = streamData.servers || [];

        let targetUrl = streamData.iframe;
        let serverName = "Default";

        const preferred = servers.find(s => 
          s.name.toLowerCase().includes("vmoly") || 
          s.name.toLowerCase().includes("mirror")
        );

        if (preferred) {
          targetUrl = preferred.url;
          serverName = preferred.name;
        } else if (servers.length > 0 && !targetUrl) {
          targetUrl = servers[0].url;
          serverName = servers[0].name;
        }

        if (!targetUrl) {
            return json({ success: false, error: "No stream found" }, 404);
        }

        let extraction = null;
        try {
            extraction = await SourceExtractor.extractStream(targetUrl);
        } catch (e: any) {
            console.error("Extraction failed for", targetUrl, e?.message);
        }
        
        return json({
            success: true,
            data: {
                ...streamData,
                stream: extraction, 
                serverUsed: serverName,
                targetUrl 
            }
        });
    }
    
    // ------------------------------------------
    // 6. CATEGORIES
    // ------------------------------------------
    if (action === "genre" || action === "tag" || action === "az") {
        const id = searchParams.get("id") || searchParams.get("letter") || "";
        const page = parseInt(searchParams.get("page") || "1");
        
        if (!id) return json({ error: "Missing id/letter" }, 400);

        const type = action as 'genre' | 'tag' | 'az';
        return json({ success: true, data: await service.getList(type, id, page) });
    }

    // ------------------------------------------
    // 7. QTIPS (Hover Details)
    // ------------------------------------------
    if (action === "qtip") {
        const id = searchParams.get("id");
        if (!id) return json({ error: "Missing data-id" }, 400);
        
        try {
            const data = await service.getQtip(id);
            return json({ success: true, data });
        } catch (e: any) {
            return json({ success: false, error: e.message }, 500);
        }
    }

    // ------------------------------------------
    // 8. DEBUG HTML (helps diagnose selector issues)
    // ------------------------------------------
    if (action === "debug-html") {
        const keyword = searchParams.get("q") || "naruto";
        const url = new URL(`${service['baseUrl']}/search/`);
        url.searchParams.set("asp", "1");
        url.searchParams.set("s_keyword", keyword);
        
        try {
            const html = await service['fetchHtml'](url.toString());
            const { load } = await import("cheerio");
            const $ = load(html);
            
            // Extract structure info
            const structure = {
                title: $('title').text(),
                mainContainers: [] as any[],
                gridClasses: [] as string[],
                animeLinks: [] as string[],
                firstElements: [] as any[]
            };
            
            // Find main containers
            $('main, .content, .search-results, [class*="grid"], [class*="kira"]').each((i, el) => {
                const element = el as Element;
                if (i < 5) { // Limit to first 5
                    structure.mainContainers.push({
                        tag: element.tagName,
                        class: $(el).attr('class'),
                        id: $(el).attr('id'),
                        children: $(el).children().length
                    });
                }
            });
            
            // Find grid classes
            $('[class*="grid"], [class*="kira"]').each((i, el) => {
                const cls = $(el).attr('class');
                if (cls && !structure.gridClasses.includes(cls)) {
                    structure.gridClasses.push(cls);
                }
            });
            
            // Find anime links
            $('a[href*="/anime/"]').slice(0, 10).each((i, el) => {
                structure.animeLinks.push($(el).attr('href') || '');
            });
            
            // Get first few elements with links
            $('a[href*="/anime/"]').slice(0, 3).each((i, el) => {
                const container = $(el).closest('div, article, li');
                const containerEl = container[0] as Element | undefined;
                structure.firstElements.push({
                    linkText: $(el).text().trim().substring(0, 50),
                    containerClass: container.attr('class'),
                    containerTag: containerEl?.tagName,
                    hasImage: container.find('img').length > 0,
                    hasTitle: container.find('h2, h3, h4').length > 0
                });
            });
            
            return json({ 
                success: true, 
                structure,
                html: html.substring(0, 5000) // First 5KB for inspection
            });
        } catch (e: any) {
            return json({ error: e.message }, 500);
        }
    }

    // ------------------------------------------
    // 9. DEBUG RECOMMENDATIONS
    // ------------------------------------------
    if (action === "debug-recommendations") {
        const id = searchParams.get("id") || "one-pun-man-3rd-season";
        
        try {
            const url = `${service['baseUrl']}/anime/${id}/`;
            const html = await service['fetchHtml'](url);
            const { load } = await import("cheerio");
            const $ = load(html);
            
            const debug: any = {
                animeId: id,
                url,
                foundSections: [] as any[],
                recommendationSection: null as any,
                scriptUrls: [] as string[],
                possibleAjaxCalls: [] as string[],
                foundIds: [] as string[]
            };
            
            // Check if recommendation section exists
            const recH2 = $('h2:contains("Recomended"), h2:contains("Recommended")');
            if (recH2.length > 0) {
                const parent = recH2.parent();
                debug.recommendationSection = {
                    exists: true,
                    h2Text: recH2.text(),
                    parentClass: parent.attr('class'),
                    gridSections: parent.find('.grid-anime-auto').length,
                    totalDivs: parent.find('.grid-anime-auto > div').length,
                    firstDivClasses: parent.find('.grid-anime-auto > div').first().attr('class')
                };
            }
            
            // Find all sections
            $('section').each((i, el) => {
                const h2 = $(el).find('h2').first().text();
                if (h2) {
                    debug.foundSections.push({
                        title: h2.substring(0, 50),
                        class: $(el).attr('class'),
                        children: $(el).children().length
                    });
                }
            });
            
            // Find script tags
            $('script[src]').each((i, el) => {
                const src = $(el).attr('src');
                if (src) debug.scriptUrls.push(src);
            });
            
            // Look for AJAX patterns in inline scripts
            $('script:not([src])').each((i, el) => {
                const content = $(el).html() || '';
                const ajaxMatches = content.match(/ajax[^'"]*['"]([^'"]+)['"]/gi);
                if (ajaxMatches) {
                    ajaxMatches.forEach(m => {
                        if (!debug.possibleAjaxCalls.includes(m)) {
                            debug.possibleAjaxCalls.push(m);
                        }
                    });
                }
            });
            
            // Check for anime/post ID
            const idPatterns = [
                html.match(/post[_-]?id['"\s:=]+(\d+)/i),
                html.match(/anime[_-]?id['"\s:=]+(\d+)/i),
                html.match(/data-anime-id=['"](\d+)['"]/i)
            ];
            
            debug.foundIds = idPatterns.filter(Boolean).map(m => m![1]);
            
            return json({ success: true, debug });
        } catch (e: any) {
            return json({ error: e.message }, 500);
        }
    }

    // ------------------------------------------
    // 10. DEBUG QTIP (Inspect raw upstream data)
    // ------------------------------------------
    if (action === "debug-qtip") {
        const id = searchParams.get("id");
        if (!id) return json({ error: "Missing id (numeric)" }, 400);

        const endpoints = [
            `https://www.desidubanime.me/ajax/movie/qtip/${id}`,
            `https://www.desidubanime.me/ajax/anime/qtip/${id}`,
            `https://www.desidubanime.me/wp-admin/admin-ajax.php?action=get_qtip&id=${id}`
        ];

        const results = [];

        for (const url of endpoints) {
            try {
                const start = Date.now();
                const res = await fetch(url, {
                    headers: { 
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
                        "X-Requested-With": "XMLHttpRequest", // CRITICAL HEADER
                        "Referer": "https://www.desidubanime.me/"
                    }
                });
                const text = await res.text();
                const duration = Date.now() - start;

                results.push({
                    url,
                    status: res.status,
                    duration: `${duration}ms`,
                    contentLength: text.length,
                    // Preview first 100 chars to see if valid HTML or error
                    preview: text.substring(0, 100).replace(/\n/g, ''),
                    isSuccess: text.length > 50 && !text.includes("404 Not Found")
                });
            } catch (e: any) {
                results.push({ url, error: e.message });
            }
        }

        return json({ 
            success: true, 
            inputId: id, 
            results 
        });
    }
// ------------------------------------------
    // 12. DEBUG JSON (Inspect Raw API Response)
    // ------------------------------------------
    if (action === "debug-json") {
        const id = searchParams.get("id");
        if (!id) return json({ error: "Missing id" }, 400);

        const url = `https://www.desidubanime.me/wp-json/kiranime/v1/anime/tooltip/${id}?_locale=user`;
        
        try {
            const res = await fetch(url, {
                headers: { 
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"
                }
            });
            const rawData = await res.json();
            
            return json({ 
                success: true, 
                url,
                keysFound: Object.keys(rawData), // Lists available keys
                rawData // Shows full data structure
            });
        } catch (e: any) {
            return json({ error: e.message }, 500);
        }
    }
    
    // ------------------------------------------
    // 11. DEBUG CONFIG (The "Rosetta Stone" Logic)
    // ------------------------------------------
    if (action === "debug-config") {
        try {
            // Note: service is available because it's defined at the top of GET
            const html = await service['fetchHtml']("https://www.desidubanime.me/");
            
            // Regex to find standard WordPress AJAX configuration blocks
            const patterns = [
                /var\s+([a-zA-Z0-9_]+)\s*=\s*(\{.*?\});/g, // var something = {...};
                /const\s+([a-zA-Z0-9_]+)\s*=\s*(\{.*?\});/g, // const something = {...};
                /"action"\s*:\s*"([^"]+)"/g // Explicit "action": "something" inside scripts
            ];

            const foundConfigs: { name: string, content: string }[] = [];
            const actionNames: string[] = [];

            // Pattern 1: Find Global Config Objects
            let match;
            while ((match = patterns[0].exec(html)) !== null) {
                // We only care if it contains 'admin-ajax.php' or 'url'
                if (match[2].includes('admin-ajax.php') || match[2].includes('url')) {
                    foundConfigs.push({ name: match[1], content: match[2] });
                }
            }

            // Pattern 2: Find "action" strings directly
            while ((match = patterns[2].exec(html)) !== null) {
                actionNames.push(match[1]);
            }

            return json({ 
                success: true, 
                configObjects: foundConfigs,
                directActions: actionNames
            });
        } catch (e: any) {
            return json({ error: e.message }, 500);
        }
    }

    return json({ error: "Invalid action" }, 400);

  } catch (e: any) {
    console.error("API Error:", e?.message || e);
    return json({ success: false, error: e?.message || "Unknown error" }, 500);
  }
}
