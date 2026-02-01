import * as cheerio from 'cheerio';

const BASE_URL = 'https://satoru.one';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const headers = { 
  'User-Agent': USER_AGENT, 
  'X-Requested-With': 'XMLHttpRequest',
  'Referer': BASE_URL
};

export const SatoruService = {
  // 1. Mission: Unified Home Intelligence
  async getHome(signal?: AbortSignal) {
    const res = await fetch(`${BASE_URL}/home`, { headers, signal });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    return {
      spotlight: this.extractSpotlight($),
      trending: this.extractTrending($),
      latestUpdates: this.extractAnimeList($, '.block_area_home:has(.cat-heading:contains("Latest Episode")) .flw-item'),
      newReleases: this.extractAnimeList($, '.block_area_home:has(.cat-heading:contains("New On Satoru")) .flw-item'),
      topAiring: this.extractSidebarList($, '.anif-block-01 .ulclear li'),
      completed: this.extractSidebarList($, '.anif-block-02 .ulclear li'),
      genres: this.extractGenres($)
    };
  },

  // 2. Mission: Real-time Search Suggestions
  async getSuggestions(query: string, signal?: AbortSignal) {
    const res = await fetch(`${BASE_URL}/ajax/search/suggest?keyword=${encodeURIComponent(query)}`, { headers, signal });
    const data = await res.json();
    const $ = cheerio.load(data.html);
    
    return $('.nav-item').map((_, el) => ({
      id: $(el).attr('href')?.split('/').pop()?.split('?')[0],
      title: $(el).find('.film-name').text().trim(),
      japaneseTitle: $(el).find('.film-name').attr('data-jname'),
      poster: $(el).find('img').attr('data-src') || $(el).find('img').attr('src'),
      metadata: $(el).find('.film-infor').text().trim(),
    })).get();
  },

  // 3. Mission: Search & Discovery (Genre, Category, Keyword)
  async search(query: string, page: number = 1, type?: string, signal?: AbortSignal) {
    let url = `${BASE_URL}/search?keyword=${encodeURIComponent(query)}&page=${page}`;
    
    if (type === 'genre') url = `${BASE_URL}/genre/${query}?page=${page}`;
    if (type === 'category') url = `${BASE_URL}/anime/${query}?page=${page}`;

    const res = await fetch(url, { headers, signal });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    return {
      results: this.extractAnimeList($, '.flw-item'),
      pagination: {
        currentPage: page,
        hasNextPage: $('.pagination .page-item.active').next().hasClass('page-item')
      }
    };
  },

  // 4. Mission: Anime Detailed Intelligence
  async getInfo(id: string, signal?: AbortSignal) {
    const res = await fetch(`${BASE_URL}/watch/${id}`, { headers, signal });
    const html = await res.text();
    const $ = cheerio.load(html);

   let schema: any = {};

try {
  const schemaRaw = $('script[type="application/json"]').html();
  if (schemaRaw) {
    schema = JSON.parse(
      schemaRaw
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
    );
  }
} catch {
  schema = {};
}

    const internalId = $('#anime-id').val() || html.match(/const movieId = (\d+);/)?.[1];
    
    const epRes = await fetch(`${BASE_URL}/ajax/v2/episode/list/${internalId}`, { headers, signal });
    const epData = await epRes.json();
    const $ep = cheerio.load(epData.html);
    
    return {
      id,
      internalId,
      title: schema.name || $('.film-name.dynamic-name').text().trim(),
      japaneseTitle: $('.film-name.dynamic-name').attr('data-jname'),
      poster: schema.thumbnailUrl || $('.film-poster img').attr('src'),
      description: schema.discription || $('.film-description .text').text().trim(),
      stats: {
        rating: $('.tick-pg').text().trim(),
        quality: $('.tick-quality').text().trim(),
        episodes: {
            sub: $('.tick-item.tick-sub').text().trim(),
            dub: $('.tick-item.tick-dub').text().trim()
        }
      },
      episodes: $ep('.ep-item').map((_, el) => ({
        episodeId: $(el).attr('data-id'),
        number: $(el).attr('data-number'),
        title: $(el).find('.ep-name').attr('title') || `Episode ${$(el).attr('data-number')}`,
      })).get()
    };
  },

  // 5. Mission: Server Extraction
  async getServers(episodeId: string, signal?: AbortSignal) {
    const res = await fetch(`${BASE_URL}/ajax/v2/episode/servers?episodeId=${episodeId}`, { headers, signal });
    const data = await res.json();
    const $ = cheerio.load(data.html);
    
    return $('.server-item').map((_, el) => {
      const langGroup = $(el).closest('[class*="servers-"]').attr('class')?.split('servers-')[1] || 'unknown';
      return {
        serverId: $(el).attr('data-id'), 
        name: $(el).text().trim(),
        language: langGroup,
        category: langGroup === 'jp' ? 'sub' : 'dub'
      };
    }).get();
  },

  // --- INTERNAL EXTRACTION UTILITIES ---

  extractAnimeList($: cheerio.CheerioAPI, selector: string) {
    return $(selector).map((_, el) => {
      const dubLangs = $(el).find('.tick-dub span').map((_, s) => $(s).attr('title')).get();
      return {
        id: $(el).find('.film-poster-ahref').attr('href')?.split('/').pop()?.split('?')[0],
        title: $(el).find('.film-name').text().trim(),
        poster: $(el).find('img').attr('data-src') || $(el).find('img').attr('src'),
        type: $(el).find('.fdi-item').first().text().trim(),
        episodeCount: $(el).find('.tick-eps').text().trim(),
        dubInfo: { languages: dubLangs, isHindi: dubLangs.includes('hindi') }
      };
    }).get();
  },

  extractSpotlight($: cheerio.CheerioAPI) {
    return $('.deslide-item').closest('.swiper-slide:not(.swiper-slide-duplicate)').map((_, el) => {
      const item = $(el).find('.deslide-item');
      return {
        id: item.find('.btn-primary').attr('href')?.split('/').pop(),
        title: item.find('.desi-head-title').text().trim(),
        poster: item.find('.film-poster-img').attr('src'),
        description: item.find('.desi-description').text().trim(),
        rank: item.find('.desi-sub-text').text().trim()
      };
    }).get();
  },

  extractTrending($: cheerio.CheerioAPI) {
    return $('#trending-home .swiper-slide:not(.swiper-slide-duplicate)').map((_, el) => ({
      id: $(el).find('.film-poster').attr('href')?.split('/').pop(),
      title: $(el).find('.film-title').text().trim(),
      poster: $(el).find('img').attr('src') || $(el).find('img').attr('data-src'),
      rank: $(el).find('.number span').text().trim()
    })).get();
  },

  extractSidebarList($: cheerio.CheerioAPI, selector: string) {
    return $(selector).map((_, el) => ({
      id: $(el).find('a').attr('href')?.split('/').pop(),
      title: $(el).find('.film-name').text().trim(),
      poster: $(el).find('img').attr('data-src') || $(el).find('img').attr('src')
    })).get();
  },

  extractGenres($: cheerio.CheerioAPI) {
    return $('.sb-genre-list li a').map((_, el) => ({ 
        name: $(el).text().trim(), 
        id: $(el).attr('href')?.split('/').pop() 
    })).get();
  }
};