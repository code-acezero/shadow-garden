import { ANIME, IAnimeResult, ISource } from "@consumet/extensions";
import hianime from "@consumet/extensions/dist/providers/anime/hianime";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ==========================================
//  1. CONFIGURATION & CLIENTS
// ==========================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (!supabase && typeof window !== 'undefined') {
  console.warn("⚠️ Supabase keys missing. Some persistence features may be disabled.");
}

// -- PROVIDERS (Server-Side Only) --
// We instantiate these only on the server to avoid CORS/Browser issues with Consumet
const isServer = typeof window === 'undefined';

const PROVIDERS = {
  METADATA: isServer ? new ANIME.Hianime() : null, // Primary Source
  BACKUP: isServer ? new ANIME.AnimePahe() : null, // Backup Source
};

// ==========================================
//  2. SHARED TYPES (The "Shadow" Schema)
// ==========================================

export interface ShadowAnime {
  id: string;
  title: string;
  image: string;
  cover?: string;
  description?: string;
  rating?: number | string; // Normalized to 1-10 or "8.5"
  malScore?: string;
  totalEpisodes?: number;
  type?: string;
  releaseDate?: string;
  season?: string;
  genres?: string[];
  status?: string;
  studios?: string[];
  producers?: string[];
  duration?: string;
  
  // Rich Data
  recommendations?: ShadowAnime[];
  related?: ShadowAnime[];
  characters?: Character[];
  trailers?: Trailer[];
  
  provider: 'hianime' | 'animepahe' | 'custom';
}

export interface Character {
  name: string;
  image: string;
  role: string; // 'Main' | 'Supporting'
  voiceActor?: {
    name: string;
    image: string;
    language?: string;
  };
}

export interface Trailer {
  id: string; // YouTube ID usually
  site: string; // 'youtube'
  thumbnail: string;
  url?: string;
}

export interface ShadowEpisode {
  id: string;
  number: number;
  title: string;
  isFiller: boolean;
  isSubbed?: boolean;
  isDubbed?: boolean;
  url?: string; // Direct link (internal use)
  provider: string;
}

export interface ShadowSource {
  url: string;
  quality: string; // '1080p', '720p', 'default', 'backup'
  isM3U8: boolean;
  subtitles?: { url: string; lang: string }[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  headers?: Record<string, string>;
}

// ==========================================
//  3. CONSUMET SERVICE
// ==========================================

class ConsumetService {
  
  /**
   * Fetches data for the Home Page (Spotlight, Trending, etc.)
   * Only runs on the server.
   */
  async getHomePageData() {
    if (!isServer || !PROVIDERS.METADATA) {
        return { spotlight: [], trending: [], topAiring: [], recent: [], popular: [], upcoming: [] };
    }

    try {
      console.time("Shadow:HomeData");
      const hianime = PROVIDERS.METADATA;

      // Parallel Fetching for speed
      const [spotlight, topAiring, recent, popular, upcoming] = await Promise.all([
        hianime.fetchSpotlight(),
        hianime.fetchTopAiring(),       
        hianime.fetchRecentlyUpdated(), 
        hianime.fetchMostPopular(),     
        hianime.fetchTopUpcoming()      
      ]);
      console.timeEnd("Shadow:HomeData");

      // Helper to map basic result to ShadowAnime
      const mapBasic = (item: IAnimeResult) => ({
        id: item.id,
        title: item.title.toString(),
        image: item.image || '',
        type: item.type,
        // Safely access duration if it exists on the type
        duration: (item as any).duration, 
        totalEpisodes: (item as any).totalEpisodes,
        provider: 'hianime' as const
      });

      return {
        spotlight: spotlight.results.map((item: any) => ({
            ...mapBasic(item),
            cover: item.banner || item.cover || item.image,
            description: item.description,
            rank: item.rank,
            quality: item.quality
        })),
        trending: topAiring.results.map(mapBasic), 
        topAiring: topAiring.results.map(mapBasic), 
        recent: recent.results.map(mapBasic),
        popular: popular.results.map(mapBasic),
        upcoming: upcoming.results.map(mapBasic),
      };

    } catch (error) {
      console.error("❌ Home Data Error:", error);
      return { spotlight: [], trending: [], topAiring: [], recent: [], popular: [], upcoming: [] };
    }
  }

  /**
   * Search for anime.
   * If client-side, calls the internal API proxy.
   */
  async search(query: string, page: number = 1): Promise<ShadowAnime[]> {
    if (!isServer) {
        // Client-side: Fetch from our own API route
        return fetch(`/api/anime?action=search&q=${encodeURIComponent(query)}&page=${page}`).then(r => r.json());
    }

    try {
      console.log(`🔍 Searching HiAnime: "${query}" (Page ${page})`);
      const res = await PROVIDERS.METADATA!.search(query, page);
      
      return res.results.map((item: any) => ({
        id: item.id,
        title: item.title.toString(),
        image: item.image,
        releaseDate: item.releaseDate,
        type: item.type,
        status: item.status, // Often undefined in search results
        provider: 'hianime'
      }));
    } catch (e) {
      console.error("Search Error:", e);
      return [];
    }
  }

  /**
   * Get detailed Anime Info + Episodes.
   * Handles rich data mapping (Characters, Relations, etc.)
   */
  async getInfo(id: string): Promise<{ info: ShadowAnime; episodes: ShadowEpisode[] }> {
    if (!isServer) {
        return fetch(`/api/anime?action=info&id=${encodeURIComponent(id)}`).then(res => res.json());
    }

    try {
      console.log(`📖 Fetching Info: ${id}`);
      const data = await PROVIDERS.METADATA!.fetchAnimeInfo(id);
      
      // -- Map Characters --
      // HiAnime Consumet structure for characters is often nested
      const characters: Character[] = (data.characters || []).map((c: any) => ({
        name: c.name?.full || c.name || "Unknown",
        image: c.image || c.image?.large || '/placeholder.png',
        role: c.role || "Main",
        voiceActor: (c.voiceActors && c.voiceActors.length > 0) ? {
            name: c.voiceActors[0].name?.full || c.voiceActors[0].name,
            image: c.voiceActors[0].image || c.voiceActors[0].image?.large
        } : undefined
      }));

      // -- Map Recommendations --
      const recommendations: ShadowAnime[] = (data.recommendations || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        image: r.image,
        type: r.type,
        duration: r.duration,
        totalEpisodes: r.episodes,
        rating: r.rating,
        provider: 'hianime'
      }));

      // -- Map Related Anime --
      const related: ShadowAnime[] = (data.relatedAnime || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        image: r.image,
        type: r.type,
        totalEpisodes: r.episodes, 
        provider: 'hianime'
      }));

      // -- Normalize Main Info --
      const anime: ShadowAnime = {
        id: data.id,
        title: data.title.toString(),
        image: data.image as string,
        cover: data.cover || data.image,
        description: data.description as string,
        
        // Stats
        rating: data.rating,
        malScore: data.malScore || (data as any).malID?.toString(), // Fallback
        totalEpisodes: data.totalEpisodes,
        status: data.status as string,
        duration: (data as any).duration,
        
        // Metadata
        genres: data.genres,
        releaseDate: data.releaseDate || (data as any).startDate,
        season: (data as any).season,
        studios: (data as any).studios,
        producers: (data as any).producers,
        type: data.type,
        
        // Relations
        recommendations,
        related,
        characters,
        
        // Trailers (Promotional Videos)
        // HiAnime extension often returns them as 'promotionalVideos'
        trailers: (data as any).promotionalVideos?.map((pv: any) => ({
            id: pv.source?.split('/').pop() || '', // Extract ID from youtube url if needed
            site: 'youtube',
            thumbnail: pv.thumbnail,
            url: pv.source
        })) || [],

        provider: 'hianime'
      };

      // -- Map Episodes --
      const episodes: ShadowEpisode[] = data.episodes?.map((ep: any) => ({
        id: ep.id,
        number: ep.number,
        title: ep.title || `Episode ${ep.number}`,
        isFiller: ep.isFiller || false,
        isSubbed: (ep as any).isSubbed, // Some providers explicitly state this
        isDubbed: (ep as any).isDubbed,
        provider: 'hianime'
      })) || [];

      // Optional: Save mapping to Supabase for future reference
      if (supabase && data.title) {
          this.saveMapping(data.title.toString(), 'hianime', id);
      }

      return { info: anime, episodes };

    } catch (e) {
      console.error(`❌ [getInfo] Failed for ID: ${id}`, e);
      // Return a partial object so UI doesn't crash completely
      throw new Error(`Failed to load anime info: ${(e as Error).message}`);
    }
  }

  /**
   * Get Streaming Links.
   * Includes logic to PROXY M3U8 links to bypass CORS/Referer checks.
   */
  async getSources(
    episodeId: string, 
    server: string = 'hd-1', 
    category: 'sub'|'dub'|'raw' = 'sub'
  ): Promise<ShadowSource[]> {
    
    if (!isServer) {
        return fetch(`/api/anime?action=sources&id=${episodeId}&server=${server}&cat=${category}`).then(res => res.json());
    }

try {
    console.log(`🎬 [getSources] Fetching: ${episodeId} [${server}]`);
    const data = await PROVIDERS.METADATA!.fetchEpisodeSources(episodeId, server as any, category as any);
        
        if (!data || !data.sources) {
            console.warn("No sources returned from primary provider.");
            return [];
        }

        // Normalize and wrap in Proxy
        return data.sources.map((s: any) => {
            let finalUrl = s.url;
            const referer = data.headers?.Referer;

            // --- PROXY LOGIC ---
            // If it's an M3U8 or has a Referer, we route it through our Next.js API proxy
            if (finalUrl.includes('.m3u8') || referer) {
                const proxyBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                finalUrl = `${proxyBase}/api/proxy?url=${encodeURIComponent(s.url)}`;
                if (referer) {
                    finalUrl += `&referer=${encodeURIComponent(referer)}`;
                }
            }

            return {
                url: finalUrl,
                quality: s.quality || 'auto',
                isM3U8: s.isM3U8 || s.url.includes('.m3u8'),
                intro: data.intro,
                outro: data.outro,
                subtitles: data.subtitles
            };
        });

    } catch (e) {
        console.error("❌ Source Fetch Error", e);
        return [];
    }
  }

  // ==========================================
  //  4. PRIVATE HELPERS
  // ==========================================

  private normalize(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }

  private async saveMapping(title: string, provider: 'hianime' | 'animepahe', id: string) {
    if (!supabase) return;
    const slug = this.normalize(title);
    
    // We try to upsert this into a mapping table. 
    // This allows us to map IDs between different providers later if needed.
    const update = { 
        slug, 
        title, 
        updated_at: new Date().toISOString(), 
        [`${provider}_id`]: id 
    };
    
    // Fire and forget - don't await this to keep UI fast
    supabase.from('anime_mappings').upsert(update, { onConflict: 'slug' }).then(({ error }) => {
        if (error) console.error("Mapping Save Error:", error.message);
    });
  }
}

// Export a singleton instance
export const consumetClient = new ConsumetService();