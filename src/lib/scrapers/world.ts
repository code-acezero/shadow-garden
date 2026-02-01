import { load, type CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";

// --- Types ---
export type AnimeWorldServer = {
  id: string;
  name: string;
  type?: string;
  iframe?: string | null;
  dataSrc?: string | null;
};

export type AnimeWorldEpisode = {
  episodeId: string;
  number?: string;
  title?: string;
  url: string;
  thumb?: string | null;
};

export type AnimeWorldSeason = {
  season: string;
  episodes: AnimeWorldEpisode[];
};

export type AnimeWorldDetails = {
  id?: string;
  title: string;
  poster?: string | null;
  description?: string | null;
  seasons: AnimeWorldSeason[];
  recommended?: Array<{
    title: string;
    url: string;
    poster?: string | null;
    year?: string | null;
    type?: "series" | "movie" | "unknown";
  }>;
};

export type AnimeWorldHomeSectionItem = {
  title: string;
  url: string;
  poster?: string | null;
  year?: string | null;
  quality?: string | null;
  meta?: string | null;
  type?: "series" | "movie" | "unknown";
};

export type AnimeWorldHome = {
  hero?: AnimeWorldHomeSectionItem[];
  sections: Array<{
    key: string;
    title: string;
    items: AnimeWorldHomeSectionItem[];
  }>;
};

// --- Helpers ---
function absUrl(base: string, href?: string | null) {
  if (!href) return "";
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function cleanText(s?: string | null) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function guessTypeFromUrl(url: string): "series" | "movie" | "unknown" {
  if (url.includes("/series/")) return "series";
  if (url.includes("/movies/") || url.includes("/movie/")) return "movie";
  return "unknown";
}

// --- The Service Class ---
export class AnimeWorldService {
  baseUrl: string;

  constructor(baseUrl = "https://watchanimeworld.net") {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private async fetchHtml(pathOrUrl: string) {
    const url = pathOrUrl.startsWith("http")
      ? pathOrUrl
      : `${this.baseUrl}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      next: { revalidate: 0 } 
    });

    if (!res.ok) {
      throw new Error(`AnimeWorld fetch failed: ${res.status} ${res.statusText}`);
    }
    return await res.text();
  }

  private parsePostCard($: CheerioAPI, root: AnyNode): AnimeWorldHomeSectionItem | null {
    const href = $(root).find("a.lnk-blk").attr("href") || $(root).find("a").attr("href");
    const title = cleanText($(root).find(".entry-title").first().text()) || cleanText($(root).find("h2").first().text());

    if (!href || !title) return null;

    const poster = $(root).find("img").first().attr("src") || $(root).find("img").first().attr("data-src") || null;
    const year = cleanText($(root).find(".year").first().text()) || null;
    const quality = cleanText($(root).find(".post-ql, .Qlty").first().text()) || null;
    const url = absUrl(this.baseUrl, href);

    return {
      title,
      url,
      poster,
      year,
      quality,
      type: guessTypeFromUrl(url),
    };
  }

  // 1. Home Page
  async home(): Promise<AnimeWorldHome> {
    const html = await this.fetchHtml("/");
    const $ = load(html);
    const sections: AnimeWorldHome["sections"] = [];

    $("section.section").each((i, el) => {
      const title = cleanText($(el).find(".section-title").first().text()) || 
                    cleanText($(el).find("header .btn span").first().text()) || 
                    `Section ${i + 1}`;

      const items: AnimeWorldHomeSectionItem[] = [];
      $(el).find("article.post").each((_, a) => {
        const item = this.parsePostCard($, a);
        if (item) items.push(item);
      });

      if (items.length) {
        sections.push({
          key: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          title,
          items,
        });
      }
    });

    // Fallback if no sections found
    if (sections.length === 0) {
        const items: AnimeWorldHomeSectionItem[] = [];
        $("article.post").each((_, a) => {
            const item = this.parsePostCard($, a);
            if (item) items.push(item);
        });
        if (items.length) sections.push({ key: "latest", title: "Latest Releases", items });
    }

    return { sections };
  }

  // 2. Search
  async search(q: string) {
    const html = await this.fetchHtml(`/?s=${encodeURIComponent(q)}`);
    const $ = load(html);
    const results: AnimeWorldHomeSectionItem[] = [];
    
    $("article.post").each((_, el) => {
      const item = this.parsePostCard($, el);
      if (item) results.push(item);
    });

    return { query: q, results };
  }

  // 3. Live Suggestions
  async searchSuggestions(q: string) {
    const attempts = [
      `${this.baseUrl}/wp-admin/admin-ajax.php?action=torofilm_live_search&term=${encodeURIComponent(q)}`,
      `${this.baseUrl}/wp-admin/admin-ajax.php?action=live_search&term=${encodeURIComponent(q)}`
    ];

    for (const url of attempts) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!res.ok) continue;
        const text = await res.text();
        
        try {
          const json = JSON.parse(text);
          return { query: q, raw: json };
        } catch {
          const $ = load(text);
          const items = $("a").map((_, a) => ({
              title: cleanText($(a).text()),
              url: absUrl(this.baseUrl, $(a).attr("href")),
              img: $(a).find("img").attr("src")
            })).get();
          if (items.length) return { query: q, items };
        }
      } catch { continue; }
    }
    return { query: q, items: [] };
  }

  // 4. Details (Anime Info + Episodes)
  async detailsBySeriesUrl(seriesUrl: string): Promise<AnimeWorldDetails> {
    const html = await this.fetchHtml(seriesUrl);
    const $ = load(html);

    const title = cleanText($("h1").first().text()) || "Unknown";
    const poster = $(".poster img").first().attr("src") || $(".wp-post-image").attr("src") || null;
    const description = cleanText($(".description, .wp-content, .overview").first().text()) || null;

    // Detect Seasons
    const seasonNumbers = $(".choose-season ul li a[data-season]")
      .map((_, a) => cleanText($(a).attr("data-season")))
      .get().filter(Boolean);

    const seasonsToFetch = seasonNumbers.length ? seasonNumbers : ["1"];
    const seasons: AnimeWorldSeason[] = [];

    // Fetch episodes for every season found
    for (const s of seasonsToFetch) {
      const seasonEpisodes = await this.fetchSeasonEpisodesFromSeriesPage(seriesUrl, s);
      if (seasonEpisodes.length) {
        seasons.push({ season: s, episodes: seasonEpisodes });
      }
    }

    return { title, poster, description, seasons };
  }

  // 5. Episode AJAX Logic (The Fix for Empty Lists)
  private async fetchSeasonEpisodesFromSeriesPage(seriesUrl: string, season: string): Promise<AnimeWorldEpisode[]> {
    const html = await this.fetchHtml(seriesUrl);
    const $ = load(html);
    const episodes: AnimeWorldEpisode[] = [];

    // Strategy 1: Check if episodes are already on page (usually latest season)
    $("#episode_by_temp article.post.episodes").each((_, el) => {
      const num = cleanText($(el).find(".num-epi").first().text());
      const match = num.match(/^(\d+)\s*x\s*(\d+)$/i);
      
      if (match && match[1] === season) {
         const href = $(el).find("a.lnk-blk").attr("href");
         if (href) {
            episodes.push({
                episodeId: absUrl(this.baseUrl, href).split("/episode/")[1]?.replace(/\/+$/, ""),
                number: match[2],
                title: cleanText($(el).find(".entry-title").text()),
                url: absUrl(this.baseUrl, href),
                thumb: $(el).find("img").attr("src")
            });
         }
      }
    });

    if (episodes.length) return episodes;

    // Strategy 2: AJAX Fetch (The Torofilm Method)
    const postId = cleanText($("body").attr("data-post")) || cleanText($("input[name='post_id']").attr("value"));
    if (!postId) return [];

    const ajaxUrl = `${this.baseUrl}/wp-admin/admin-ajax.php`;
    const params = new URLSearchParams({
        action: "action_select_season", // Common Torofilm action
        post: postId,
        season
    });

    try {
        const res = await fetch(ajaxUrl, {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest",
                "User-Agent": "Mozilla/5.0"
            },
            body: params
        });
        const text = await res.text();
        const $$ = load(text);

        $$("article.post").each((_, el) => {
            const href = $$(el).find("a.lnk-blk").attr("href");
            const num = cleanText($$(el).find(".num-epi").text());
            const match = num.match(/^(\d+)\s*x\s*(\d+)$/i);
            
            if (href) {
                episodes.push({
                    episodeId: absUrl(this.baseUrl, href).split("/episode/")[1]?.replace(/\/+$/, ""),
                    number: match ? match[2] : num,
                    title: cleanText($$(el).find(".entry-title").text()),
                    url: absUrl(this.baseUrl, href),
                    thumb: $$(el).find("img").attr("src")
                });
            }
        });
    } catch (e) { console.error("AJAX Season Fetch Failed", e); }

    return episodes;
  }

  // 6. Streaming Links
  async episode(episodeUrl: string) {
    const html = await this.fetchHtml(episodeUrl);
    const $ = load(html);
    const title = cleanText($("h1").text()) || "Episode";
    const servers: AnimeWorldServer[] = [];

    // Extract Iframes
    $(".aa-tbs-video li a").each((idx, el) => {
        const href = $(el).attr("href"); // e.g. #options-1
        const id = href?.replace("#", "") || `opt-${idx}`;
        const name = $(el).text().trim();
        const iframe = $(`#${id} iframe`).attr("src") || $(`#${id} iframe`).attr("data-src");
        
        if (iframe) {
            servers.push({ id, name, iframe });
        }
    });

    return { title, servers };
  }

  // 7. List Page (The Missing Method for Categories)
  async listPage(path: string) {
    const html = await this.fetchHtml(path);
    const $ = load(html);

    const items: AnimeWorldHomeSectionItem[] = [];
    $("article.post").each((_, el) => {
      const item = this.parsePostCard($, el);
      if (item) items.push(item);
    });

    // Pagination
    const next = $("a.next, .pagination a.next").attr("href") || $("a[rel='next']").attr("href");

    return { 
        path, 
        items, 
        next: next ? absUrl(this.baseUrl, next) : null 
    };
  }

  // 8. AZ List Helper (Just in case)
  async azList() {
    return {
      hint: "Use action=list&path=/letters/A (or site specific path).",
    };
  }
}