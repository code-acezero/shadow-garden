import 'server-only'; // 🛡️ SAFETY: Prevents this file from ever running on the client
import { ANIME, IAnimeResult } from "@consumet/extensions";
// ✅ Import Supabase from your singleton file to prevent connection crashes
import { supabase } from '@/lib/api';

// -- PROVIDERS (Server-Side Only) --
const isServer = typeof window === 'undefined';

const PROVIDERS = {
  // Use Hianime if available
  METADATA: isServer ? new ANIME.Hianime() : null, 
  BACKUP: isServer ? new ANIME.AnimePahe() : null,
};

// ==========================================
//  SHARED TYPES (The "Shadow" Schema)
// ==========================================

export interface ShadowAnime {
  id: string;
  title: string;
  image: string;
  cover?: string;
  description?: string;
  rating?: number | string;
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
  role: string;
  voiceActor?: {
    name: string;
    image: string;
    language?: string;
  };
}

export interface Trailer {
  id: string;
  site: string;
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
  url?: string;
  provider: string;
}

export interface ShadowSource {
  url: string;
  quality: string;
  isM3U8: boolean;
  subtitles?: { url: string; lang: string }[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  headers?: Record<string, string>;
}

// ==========================================
//  CONSUMET SERVICE
// ==========================================

class ConsumetService {
  
  /**
   * Fetches data for the Home Page
   */
  async getHomePageData() {
    // Safety check for server environment
    if (!isServer || !PROVIDERS.METADATA) {
        return { spotlight: [], trending: [], topAiring: [], recent: [], popular: [], upcoming: [] };
    }

    try {
      console.time("Shadow:HomeData");
      const hianime = PROVIDERS.METADATA;

      // Parallel Fetching
      const [spotlight, topAiring, recent, popular, upcoming] = await Promise.all([
        hianime.fetchSpotlight().catch(() => ({ results: [] })),
        hianime.fetchTopAiring().catch(() => ({ results: [] })),       
        hianime.fetchRecentlyUpdated().catch(() => ({ results: [] })), 
        hianime.fetchMostPopular().catch(() => ({ results: [] })),     
        hianime.fetchTopUpcoming().catch(() => ({ results: [] }))      
      ]);
      console.timeEnd("Shadow:HomeData");

      // Helper to map basic result
      const mapBasic = (item: IAnimeResult) => ({
        id: item.id,
        title: typeof item.title === 'string' ? item.title : String(item.title),
        image: item.image || '',
        type: item.type,
        duration: (item as any).duration, 
        totalEpisodes: (item as any).totalEpisodes,
        provider: 'hianime' as const
      });

      return {
        spotlight: (spotlight.results || []).map((item: any) => ({
            ...mapBasic(item),
            cover: item.banner || item.cover || item.image,
            description: item.description,
            rank: item.rank,
            quality: item.quality
        })),
        trending: (topAiring.results || []).map(mapBasic), 
        topAiring: (topAiring.results || []).map(mapBasic), 
        recent: (recent.results || []).map(mapBasic),
        popular: (popular.results || []).map(mapBasic),
        upcoming: (upcoming.results || []).map(mapBasic),
      };

    } catch (error) {
      console.error("❌ Home Data Error:", error);
      return { spotlight: [], trending: [], topAiring: [], recent: [], popular: [], upcoming: [] };
    }
  }

  /**
   * Search for anime
   */
  async search(query: string, page: number = 1): Promise<ShadowAnime[]> {
    if (!isServer || !PROVIDERS.METADATA) return [];

    try {
      const res = await PROVIDERS.METADATA.search(query, page);
      return res.results.map((item: any) => ({
        id: item.id,
        title: item.title.toString(),
        image: item.image,
        releaseDate: item.releaseDate,
        type: item.type,
        status: item.status,
        provider: 'hianime'
      }));
    } catch (e) {
      console.error("Search Error:", e);
      return [];
    }
  }

  /**
   * Get detailed Anime Info + Episodes
   */
  async getInfo(id: string): Promise<{ info: ShadowAnime; episodes: ShadowEpisode[] } | null> {
    if (!isServer || !PROVIDERS.METADATA) return null;

    try {
      const data = await PROVIDERS.METADATA.fetchAnimeInfo(id);
      
      const characters: Character[] = (data.characters || []).map((c: any) => ({
        name: c.name?.full || c.name || "Unknown",
        image: c.image || c.image?.large || '/placeholder.png',
        role: c.role || "Main",
        voiceActor: (c.voiceActors && c.voiceActors.length > 0) ? {
            name: c.voiceActors[0].name?.full || c.voiceActors[0].name,
            image: c.voiceActors[0].image || c.voiceActors[0].image?.large
        } : undefined
      }));

      const recommendations: ShadowAnime[] = (data.recommendations || []).map((r: any) => ({
        id: r.id,
        title: r.title?.romaji || r.title?.english || r.title?.native || r.title?.userPreferred || r.title,
        image: r.image,
        type: r.type,
        duration: r.duration,
        totalEpisodes: r.episodes,
        rating: r.rating,
        provider: 'hianime'
      }));

      const related: ShadowAnime[] = (data.relatedAnime || []).map((r: any) => ({
        id: r.id,
        title: r.title?.romaji || r.title?.english || r.title?.native || r.title?.userPreferred || r.title,
        image: r.image,
        type: r.type,
        totalEpisodes: r.episodes, 
        provider: 'hianime'
      }));

      const anime: ShadowAnime = {
        id: data.id,
        title: data.title.toString(),
        image: data.image as string,
        cover: data.cover || data.image,
        description: data.description as string,
        rating: data.rating,
        malScore: data.malScore || (data as any).malID?.toString(),
        totalEpisodes: data.totalEpisodes,
        status: data.status as string,
        duration: (data as any).duration,
        genres: data.genres,
        releaseDate: data.releaseDate || (data as any).startDate,
        season: (data as any).season,
        studios: (data as any).studios,
        producers: (data as any).producers,
        type: data.type,
        recommendations,
        related,
        characters,
        trailers: (data as any).promotionalVideos?.map((pv: any) => ({
            id: pv.source?.split('/').pop() || '',
            site: 'youtube',
            thumbnail: pv.thumbnail,
            url: pv.source
        })) || [],
        provider: 'hianime'
      };

      const episodes: ShadowEpisode[] = data.episodes?.map((ep: any) => ({
        id: ep.id,
        number: ep.number,
        title: ep.title || `Episode ${ep.number}`,
        isFiller: ep.isFiller || false,
        isSubbed: (ep as any).isSubbed,
        isDubbed: (ep as any).isDubbed,
        provider: 'hianime'
      })) || [];

      if (supabase && data.title) {
          this.saveMapping(data.title.toString(), 'hianime', id);
      }

      return { info: anime, episodes };

    } catch (e) {
      console.error(`❌ [getInfo] Failed for ID: ${id}`, e);
      // Don't throw error to client, return null so UI handles "Not Found" gracefully
      return null;
    }
  }

  /**
   * Get Streaming Links
   */
  async getSources(
    episodeId: string, 
    server: string = 'hd-1', 
    category: 'sub'|'dub'|'raw' = 'sub'
  ): Promise<ShadowSource[]> {
    if (!isServer || !PROVIDERS.METADATA) return [];

    try {
        const data = await PROVIDERS.METADATA.fetchEpisodeSources(episodeId, server as any, category as any);
        
        if (!data || !data.sources) {
            console.warn("No sources returned from primary provider.");
            return [];
        }

        return data.sources.map((s: any) => {
            let finalUrl = s.url;
            const referer = data.headers?.Referer;

            // --- PROXY LOGIC ---
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
  //  PRIVATE HELPERS
  // ==========================================

  private normalize(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }

  private async saveMapping(title: string, provider: 'hianime' | 'animepahe', id: string) {
    if (!supabase) return;
    const slug = this.normalize(title);
    
    const update = { 
        slug, 
        title, 
        updated_at: new Date().toISOString(), 
        [`${provider}_id`]: id 
    };
    // FIX: Cast 'update' to any and explicitly type destructured error as any
    // This satisfies the compiler's strict binding check.
    supabase.from('anime_mappings')
      .upsert(update as any, { onConflict: 'slug' })
      .then(({ error }: { error: any }) => { // 👈 Added explicit type here
        if (error) console.error("Mapping Save Error:", error.message);
      });
  }
}
export const consumetClient = new ConsumetService();