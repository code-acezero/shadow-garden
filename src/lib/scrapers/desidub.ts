import { load, type CheerioAPI } from "cheerio";
import { ProxyAgent } from "undici"; // ✅ Import ProxyAgent

// --- Interfaces (Kept exactly the same) ---

export interface DesiCard {
  id: string;
  title: string;
  url: string;
  image: string;
  episode?: string;
  type?: string;
  status?: string;
  duration?: string;
  rating?: string;
  views?: string;
  audio?: string[];
  year?: string;
  slug?: string;
  dataId?: string;
}

export interface DesiPagination {
  currentPage: number;
  hasNextPage: boolean;
  totalPages: number;
  totalResults: number;
}

export interface DesiListResult {
  title?: string;
  items: DesiCard[];
  pagination: DesiPagination;
}

export interface DesiEpisode {
  id: string;
  number: string;
  url: string;
  title?: string;
  image?: string;
  date?: string;
}

export interface DesiServer {
  name: string;
  url: string;
  isEmbed: boolean;
}

export interface DesiStream {
  id: string;
  iframe: string;
  servers: DesiServer[];
  nextEpisode: string | null;
  prevEpisode: string | null;
  episodes: DesiEpisode[];
  requiresExtraction: boolean;
  nextEpDate?: string | null; 
}

export interface DesiDetails {
  id: string;
  title: string;
  nativeTitle: string;
  englishTitle: string;
  synonyms: string[];
  image: string;
  banner: string;
  synopsis: string;
  status: string;
  rating: string;
  premiered: string;
  season: string;
  aired: string;
  duration: string;
  episodesCount: string;
  studios: string[];
  producers: string[];
  genres: string[];
  audio: string[];
  recommendations: DesiCard[];
  downloads: { resolution: string; url: string; host: string }[];
  episodes: DesiEpisode[];
  views?: string;
  likes?: string;
  tags?: string[];
}

export interface DesiQtip {
  name: string;
  description: string;
  rating: string;
  quality: string;
  type: string;
  japaneseTitle: string;
  status: string;
  aired: string;
  genres: string[];
}

export interface FilterParams {
  keyword?: string;
  page?: number;
  genre?: string[];
  status?: string[];
  type?: string[];
  year?: string;
  season?: string;
  sort?: string;
  order?: string;
}

export class DesiDubService {
  private baseUrl = "https://www.desidubanime.me";
  
  // ✅ 1. Read Proxy from Env (Add DESIDUB_PROXY to your .env)
  // Example: http://user:pass@ip:port
  private proxyUrl = process.env.DESIDUB_PROXY || null;

  private headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": this.baseUrl,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  /**
   * Fetch HTML with Proxy Support
   */
  private async fetchHtml(url: string): Promise<string> {
    try {
      // ✅ 2. Configure Dispatcher for Proxy
      const requestOptions: RequestInit & { dispatcher?: any } = {
        headers: this.headers,
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(15000)
      };

      if (this.proxyUrl) {
        requestOptions.dispatcher = new ProxyAgent(this.proxyUrl);
      }

      const res = await fetch(url, requestOptions);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e: any) {
      console.error(`Fetch failed for ${url}:`, e?.message);
      throw e;
    }
  }

  /**
   * Fetch JSON with Proxy Support
   */
  private async fetchJson(url: string): Promise<any> {
    try {
      const requestOptions: RequestInit & { dispatcher?: any } = {
        headers: {
          ...this.headers,
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest"
        },
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(10000)
      };

      if (this.proxyUrl) {
        requestOptions.dispatcher = new ProxyAgent(this.proxyUrl);
      }

      const res = await fetch(url, requestOptions);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return { html: text };
      }
    } catch (e: any) {
      console.error(`JSON fetch failed for ${url}:`, e?.message);
      throw e;
    }
  }

  // --- Helper Methods (Unchanged) ---

  private clean(text: string | undefined): string {
    return text ? text.replace(/\s+/g, ' ').trim() : "";
  }

  private getSlug(url: string | undefined): string {
    if (!url) return "";
    try {
      if (url.startsWith("http")) {
        const u = new URL(url);
        const parts = u.pathname.replace(/\/$/, "").split("/");
        return parts[parts.length - 1];
      }
      const parts = url.replace(/\/$/, "").split("/");
      return parts[parts.length - 1];
    } catch {
      return "";
    }
  }

  private decodeServerData(encoded: string): DesiServer | null {
    if (!encoded.includes(':')) return null;
    try {
      const [nameB64, urlB64] = encoded.split(':');
      const name = Buffer.from(nameB64, 'base64').toString('utf-8').trim();
      let url = Buffer.from(urlB64, 'base64').toString('utf-8').trim();
      
      let isEmbed = false;
      if (url.includes('<iframe') || url.includes('src=')) {
        const srcMatch = url.match(/src=['"]([^'"]+)['"]/);
        if (srcMatch) {
          url = srcMatch[1];
          isEmbed = true;
        }
      }
      return { name, url, isEmbed };
    } catch (e) {
      return null;
    }
  }

  private extractPagination(html: string, $?: CheerioAPI): DesiPagination {
    let currentPage = 1;
    let totalPages = 1;
    let totalResults = 0;

    const jsMatch = html.match(/var\s+firstPage\s*=\s*({[^}]+})/);
    if (jsMatch) {
      try {
        const data = JSON.parse(jsMatch[1]);
        totalPages = parseInt(data.pages) || 1;
        totalResults = parseInt(data.total) || 0;
      } catch {}
    }

    if ($) {
      const currentEl = $(".page-numbers.current").text();
      if (currentEl) currentPage = parseInt(currentEl) || 1;
      
      if (totalPages === 1) {
        const lastPage = $(".page-numbers:not(.next):not(.dots)").last().text();
        if (lastPage) totalPages = parseInt(lastPage) || 1;
      }
    }

    return {
      currentPage,
      hasNextPage: currentPage < totalPages,
      totalPages,
      totalResults
    };
  }

  private parseAjaxResponse(data: any): DesiCard[] {
    const items: DesiCard[] = [];

    if (data.html) {
      const $ = load(data.html);
      $("div, li, article, a").each((_, el) => {
        const card = this.parseCard($, el);
        if (card) items.push(card);
      });
    }
    
    else if (data.results && Array.isArray(data.results)) {
      items.push(...data.results.map((r: any) => ({
        id: this.getSlug(r.url || r.link || r.permalink),
        title: r.title || r.name || "",
        url: r.url || r.link || r.permalink || "",
        image: r.image || r.thumbnail || r.img || "",
        type: r.type || "",
        year: r.year || r.date || ""
      })));
    }
    
    else if (Array.isArray(data)) {
      items.push(...data.map((r: any) => ({
        id: this.getSlug(r.url || r.link),
        title: r.title || r.name || "",
        url: r.url || r.link || "",
        image: r.image || r.thumbnail || "",
        type: r.type || "",
        year: r.year || ""
      })));
    }

    return items.filter(item => item.title && item.url);
  }

  private parseCard($: CheerioAPI, el: any): DesiCard | null {
    const a = $(el).find("a").first();
    let href = a.attr("href");
    if (!href && $(el).is("a")) href = $(el).attr("href");
    if (!href) return null;

    const dataId = $(el).find("[data-tippy-content-to]").attr("data-tippy-content-to") || 
                   $(el).attr("data-tippy-content-to") ||
                   $(el).find(".film-poster").attr("data-id") ||
                   $(el).attr("data-id");

    const enTitle = $(el).find("span[data-en-title]").text();
    const ntTitle = $(el).find("span[data-nt-title]").text();
    const h3Title = $(el).find("h3, h2, h4").text();
    const titleAttr = $(el).find("[title]").attr("title");
    const rawTitle = $(el).text();
    
    const title = this.clean(enTitle || h3Title || titleAttr || ntTitle || rawTitle);
    if (!title) return null;

    const imgTag = $(el).find("img").first();
    const image = imgTag.attr("data-src") || 
                  imgTag.attr("src") || 
                  imgTag.attr("data-lazy-src") || 
                  $(el).find("[style*='background-image']").css("background-image")?.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1] ||
                  "";

    const audio: string[] = [];
    const badgeText = $(el).text().toLowerCase();
    if (badgeText.includes("multi")) audio.push("Multi");
    if (badgeText.includes("hindi")) audio.push("Hindi");
    if (badgeText.includes("eng")) audio.push("English");
    if (badgeText.includes("tamil")) audio.push("Tamil");
    if (badgeText.includes("telugu")) audio.push("Telugu");

    const episode = this.clean(
      $(el).find(".bg-accent-3").text() || 
      $(el).find("span:contains('E ')").text() ||
      $(el).find(".episode-number").text()
    );

    const type = this.clean($(el).find("span.uppercase").text()) || "TV";
    const duration = this.clean($(el).find(".text-xs .mlb-3").last().text()) || this.clean($(el).find(".duration").text());

    return {
      id: this.getSlug(href),
      slug: this.getSlug(href),
      dataId, 
      title,
      url: href,
      image,
      episode,
      type,
      duration,
      audio
    };
  }

  // ==================================================
  // 1. HOME & SPOTLIGHT
  // ==================================================
  async getHome(): Promise<{ sections: any[] }> {
    const html = await this.fetchHtml(this.baseUrl);
    const $ = load(html);
    const sections: any[] = [];

    // Spotlight
    const spotlightItems: DesiCard[] = [];
    $(".swiper-spotlight .swiper-slide").each((_, el) => {
      const content = $(el).find(".container");
      const title = this.clean(content.find("h2").text());
      const url = content.find("a").attr("href");
      const img = $(el).find("img.image-background").attr("data-src") || "";
      
      if (title && url) {
        const type = this.clean(content.find(".uppercase.bg-accent-3").text()) || "TV";
        spotlightItems.push({
          id: this.getSlug(url),
          title,
          url,
          image: img,
          type,
          status: "Spotlight"
        });
      }
    });
    if (spotlightItems.length) sections.push({ title: "Spotlight", items: spotlightItems });

    // Trending
    const trendingItems: DesiCard[] = [];
    $(".swiper-trending .swiper-slide").each((_, el) => {
      const card = this.parseCard($, el);
      if (card) trendingItems.push(card);
    });
    if (trendingItems.length) sections.push({ title: "Trending", items: trendingItems });

    // Other Sections
    $("section.mbe-6").each((_, sec) => {
      const secTitle = $(sec).find("h2").first().text().trim();
      if (!secTitle || secTitle.includes("Genre")) return;

      const items: DesiCard[] = [];
      $(sec).find(".kira-grid-listing > div, .kira-grid > div").each((__, el) => {
        const card = this.parseCard($, el);
        if (card) items.push(card);
      });

      if (items.length) sections.push({ title: secTitle, items });
    });

    return { sections };
  }

  // ==================================================
  // 2. SEARCH SUGGESTIONS
  // ==================================================
  async getSuggestions(keyword: string): Promise<DesiCard[]> {
    if (!keyword || keyword.length < 2) return [];

    try {
      const ajaxUrl = `${this.baseUrl}/wp-admin/admin-ajax.php?action=ajax_search&keyword=${encodeURIComponent(keyword)}`;
      const data = await this.fetchJson(ajaxUrl);
      
      if (data && (data.success || data.results || data.html)) {
        const parsed = this.parseAjaxResponse(data);
        if (parsed.length > 0) return parsed.slice(0, 10);
      }
    } catch (e) {
      console.log('WordPress AJAX failed, trying next method...');
    }

    try {
      const apiUrl = `${this.baseUrl}/api/suggestions?q=${encodeURIComponent(keyword)}`;
      const data = await this.fetchJson(apiUrl);
      
      if (data && Array.isArray(data)) {
        return data.slice(0, 10).map(item => ({
          id: this.getSlug(item.url || item.link),
          title: item.title || item.name,
          url: item.url || item.link || "",
          image: item.image || item.thumbnail || "",
          year: item.year || "",
          type: item.type || ""
        }));
      }
    } catch (e) {
      console.log('API endpoint failed, trying HTML scraping...');
    }

    try {
      const searchResults = await this.search({ keyword, page: 1 });
      return searchResults.items.slice(0, 5);
    } catch (e) {
      console.error('All suggestion methods failed:', e);
      return [];
    }
  }

  // ==================================================
  // 3. SEARCH
  // ==================================================
  async search(params: FilterParams): Promise<DesiListResult> {
    const url = new URL(`${this.baseUrl}/search/`);
    
    if (params.keyword && !params.genre && !params.status && !params.type && params.page === 1) {
      try {
        const ajaxUrl = `${this.baseUrl}/wp-admin/admin-ajax.php?action=ajax_search&keyword=${encodeURIComponent(params.keyword)}`;
        const data = await this.fetchJson(ajaxUrl);
        
        if (data && (data.success || data.results || data.html)) {
          const items = this.parseAjaxResponse(data);
          if (items.length > 0) {
            return {
              title: `Results for "${params.keyword}"`,
              items,
              pagination: {
                currentPage: 1,
                hasNextPage: false,
                totalPages: 1,
                totalResults: items.length
              }
            };
          }
        }
      } catch (e) {
        console.log('AJAX search failed, using HTML scraping...');
      }
    }

    url.searchParams.set("asp", "1");
    
    if (params.keyword) url.searchParams.set("s_keyword", params.keyword);
    if (params.page && params.page > 1) url.searchParams.set("page", params.page.toString());
    
    if (params.year) url.searchParams.set("s_year", params.year);
    if (params.season) url.searchParams.set("s_season", params.season);
    
    if (params.sort) url.searchParams.set("s_orderby", params.sort);
    if (params.order) url.searchParams.set("s_order", params.order);

    if (params.genre) params.genre.forEach(g => url.searchParams.append("s_genre[]", g));
    if (params.status) params.status.forEach(s => url.searchParams.append("s_status[]", s));
    if (params.type) params.type.forEach(t => url.searchParams.append("s_type[]", t));

    const html = await this.fetchHtml(url.toString());
    const $ = load(html);
    const items: DesiCard[] = [];

    const selectors = [
      ".kira-grid > div",
      ".kira-grid-listing > div", 
      ".search-results > div",
      ".anime-list > div",
      "article.anime-card",
      ".grid-anime-auto > div",
      ".content-wrapper > div > div",
      "div[class*='anime'] > div",
      "main > div > div" 
    ];

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const card = this.parseCard($, el);
        if (card) items.push(card);
      });
      
      if (items.length > 0) break;
    }

    return {
      title: params.keyword ? `Results for "${params.keyword}"` : "Filtered Results",
      items,
      pagination: this.extractPagination(html, $)
    };
  }

  // ==================================================
  // 4. DETAILS
  // ==================================================
  async getDetails(id: string): Promise<DesiDetails> {
    const url = id.startsWith("http") ? id : `${this.baseUrl}/anime/${id}/`;
    const html = await this.fetchHtml(url);
    const $ = load(html);

    const enTitle = this.clean($("span[data-en-title].anime").text());
    const ntTitle = this.clean($("span[data-nt-title].anime").text());
    const title = enTitle || ntTitle || this.clean($("h1").text());
    const image = $(".anime-image img").attr("data-src") || "";
    const banner = $(".background-image img").attr("data-src") || "";
    const synopsis = this.clean($(".anime-synopsis").text());

    const getList = (label: string) => 
      $(`li:contains('${label}') a`).map((_, el) => $(el).text().trim()).get();
    const getMeta = (label: string) => 
      this.clean($(`li:contains('${label}')`).text().replace(label, ""));

    const audio: string[] = [];
    const metaBlock = $(".anime-metadata").text().toLowerCase();
    if(metaBlock.includes("hindi")) audio.push("Hindi");
    if(metaBlock.includes("english")) audio.push("English");
    if(metaBlock.includes("tamil")) audio.push("Tamil");
    if(metaBlock.includes("telugu")) audio.push("Telugu");

    const tags: string[] = [];
    $('.text-spec a[href*="/tag/"]').each((_, el) => {
        const tag = $(el).text().trim();
        if (tag) tags.push(tag);
    });

    let views = "";
    let likes = "";
    $('.anime-metadata li').each((_, el) => {
        const text = $(el).text().trim();
        const hasSvg = $(el).find('svg').length > 0;
        const hasLink = $(el).find('a').length > 0;

        if (hasSvg) {
            likes = text;
        } else if (!hasLink && !hasSvg && /[\d\.]+[MK]/.test(text)) {
            views = text;
        }
    });

    let recommended: DesiCard[] = [];
    
    const scriptMatches = html.match(/wp-admin\/admin-ajax\.php[^'"]*action[^'"]*recommend[^'"]+/gi);
    if (scriptMatches && scriptMatches.length > 0) {
      try {
        const ajaxUrl = scriptMatches[0].startsWith('http') 
          ? scriptMatches[0] 
          : `${this.baseUrl}/${scriptMatches[0].replace(/^\//, '')}`;
        const recData = await this.fetchJson(ajaxUrl);
        recommended = this.parseAjaxResponse(recData);
      } catch (e) {}
    }
    
    if (recommended.length === 0) {
      const animeIdMatch = html.match(/post[_-]?id['"\s:=]+(\d+)/i) || 
                           html.match(/anime[_-]?id['"\s:=]+(\d+)/i) ||
                           html.match(/data-anime-id=['"](\d+)['"]/i);
      
      if (animeIdMatch && animeIdMatch[1]) {
        const endpoints = [
          `${this.baseUrl}/wp-admin/admin-ajax.php?action=load_recommendations&post_id=${animeIdMatch[1]}`,
          `${this.baseUrl}/wp-admin/admin-ajax.php?action=get_related_anime&anime_id=${animeIdMatch[1]}`,
          `${this.baseUrl}/wp-admin/admin-ajax.php?action=anime_recommendations&id=${animeIdMatch[1]}`
        ];
        
        for (const endpoint of endpoints) {
          try {
            const recData = await this.fetchJson(endpoint);
            recommended = this.parseAjaxResponse(recData);
            if (recommended.length > 0) break;
          } catch (e) {}
        }
      }
    }

    if (recommended.length === 0) {
      try {
        const ajaxUrl = `${this.baseUrl}/wp-admin/admin-ajax.php?action=get_related_anime&anime_slug=${id}`;
        const recData = await this.fetchJson(ajaxUrl);
        recommended = this.parseAjaxResponse(recData);
      } catch (e) {}
    }

    if (recommended.length === 0) {
      $(".grid-anime-auto > div").each((_, el) => {
        const card = this.parseCard($, el);
        if (card) recommended.push(card);
      });
    }
    
    const episodes: DesiEpisode[] = [];
    $(".swiper-episode-anime .swiper-slide").each((_, el) => {
        const a = $(el).find("a");
        const url = a.attr("href") || "";
        const title = this.clean($(el).text());
        const num = title.match(/(\d+)/)?.[1] || "0";
        const thumb = $(el).find("img").attr("data-src") || "";

        if(url) {
            episodes.push({
                id: this.getSlug(url),
                number: num,
                url,
                title,
                image: thumb
            });
        }
    });

    const downloads: { resolution: string; url: string; host: string }[] = [];
    $(".download-section-item").each((_, el) => {
        const res = this.clean($(el).find(".download-section-item-res").text());
        const link = $(el).find("a").attr("href") || "";
        const host = $(el).find("a").text().trim();
        if(link) downloads.push({ resolution: res, url: link, host });
    });

    return {
      id: this.getSlug(url),
      title,
      nativeTitle: ntTitle,
      englishTitle: enTitle,
      synonyms: getMeta("Synonyms").split(",").map(s => s.trim()).filter(Boolean),
      image,
      banner,
      synopsis,
      status: getMeta("Status"),
      rating: this.clean($(".anime-score-counts").text()),
      premiered: getMeta("Premiered"),
      season: getMeta("Season"),
      aired: getMeta("Aired"),
      duration: getMeta("Duration"),
      episodesCount: getMeta("Episodes"),
      studios: getList("Studio"),
      producers: getList("Producer"),
      genres: getList("Genre"),
      audio,
      recommendations: recommended,
      downloads,
      episodes: episodes.reverse(),
      views,
      likes,
      tags
    };
  }

  // ==================================================
  // 5. STREAMING
  // ==================================================
  async getStream(id: string): Promise<DesiStream> {
    const url = id.startsWith("http") ? id : `${this.baseUrl}/watch/${id}/`;
    const html = await this.fetchHtml(url);
    const $ = load(html);

    const nextEpDate = $('.next-scheduled-episode span[data-countdown]').attr('data-countdown') || null;

    const episodes: DesiEpisode[] = [];
    $(".episode-list-display-box .episode-list-item").each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        episodes.push({
          id: this.getSlug(href),
          number: this.clean($(el).find(".episode-list-item-number").text()),
          title: this.clean($(el).find(".episode-list-item-title").text()),
          url: href
        });
      }
    });

    const servers: DesiServer[] = [];
    $(".player-selection span[data-embed-id]").each((_, el) => {
      const raw = $(el).attr("data-embed-id");
      if (raw) {
        const decoded = this.decodeServerData(raw);
        if (decoded) servers.push(decoded);
      }
    });

    const iframe = $("iframe").first().attr("src") || "";
    const nextUrl = $(".next-episode").attr("data-open-nav-episode");
    const prevUrl = $(".previous-episode").attr("data-open-nav-episode");

    const cleanNav = (u: string | undefined) => (u && u !== "undefined" ? this.getSlug(u) : null);

    return {
      id: this.getSlug(url),
      iframe,
      servers,
      nextEpisode: cleanNav(nextUrl),
      prevEpisode: cleanNav(prevUrl),
      episodes,
      requiresExtraction: true,
      nextEpDate
    };
  }

  // ==================================================
  // 6. LISTS
  // ==================================================
  async getList(type: 'az' | 'genre' | 'tag', value: string, page = 1): Promise<DesiListResult> {
    let url = "";
    if (type === 'az') {
      url = `${this.baseUrl}/az-list/?letter=${value}&page=${page}`;
    } else {
      url = `${this.baseUrl}/${type}/${value}/page/${page}/`;
    }

    const html = await this.fetchHtml(url);
    const $ = load(html);
    const items: DesiCard[] = [];

    $(".kira-grid > div, .grid-anime-auto > div").each((_, el) => {
      const card = this.parseCard($, el);
      if (card) items.push(card);
    });

    return {
      title: `${type.toUpperCase()}: ${value}`,
      items,
      pagination: this.extractPagination(html, $)
    };
  }

  // ==================================================
  // 7. QTIPS
  // ==================================================
  async getQtip(id: string): Promise<DesiQtip> {
    const url = `${this.baseUrl}/wp-json/kiranime/v1/anime/tooltip/${id}?_locale=user`;

    try {
        const json = await this.fetchJson(url);
        
        const html = json.data;
        if (!html) throw new Error("No HTML data found in response");

        const $ = load(html);
        
        const getMetaValue = (label: string) => {
            return $('.block')
                .filter((_, el) => $(el).find('.font-medium').text().includes(label))
                .text()
                .replace(label, '')
                .trim();
        };

        return {
            name: $('.font-medium.line-clamp-2').text().trim(),
            description: $('.line-clamp-4').text().trim(),
            rating: $('.flex.items-center.gap-1').first().text().replace('star_rate', '').trim(),
            quality: "HD", 
            type: $('.bg-accent-3').text().trim(),
            japaneseTitle: getMetaValue('Native:'),
            status: getMetaValue('Rate:'), 
            aired: getMetaValue('Aired:'),
            genres: [] 
        };

    } catch (e) {
        console.error(`[Qtip] Extraction failed for ID ${id}:`, e);
        return {
            name: "Details Unavailable",
            description: "Could not load additional intel for this title.",
            rating: "-",
            quality: "-",
            type: "-",
            japaneseTitle: "",
            status: "",
            aired: "-",
            genres: []
        };
    }
  }
}