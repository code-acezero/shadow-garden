/**
 * Shadow Garden - Vertical Drama & Shorts Types
 * Multi-source Unified Data Model
 * Unified Aggregator across HepDrama, Narto Drama, DramaDünyam, and MacCMS
 */

export type ShortDramaLanguage = 
  | 'Hindi Dub' 
  | 'English Dub' 
  | 'English Sub'
  | 'Chinese' 
  | 'Korean' 
  | 'Japanese' 
  | 'Multi';

export type ShortDramaSource = 
  | 'hepdrama'
  | 'narto'
  | 'dramadunyam'
  | 'maccms_ikun' 
  | 'maccms_ffzy' 
  | 'maccms_bfzy'
  | 'maccms_wujin'
  | 'vertical_drama'
  | 'dramabox' 
  | 'shortmax'
  | 'curated'
  | 'curated_hindi'
  | 'curated_english'
  | 'unified';

export interface ShortDramaSourceReference {
  source: ShortDramaSource;
  sourceName: string;
  id: string;
  title: string;
  totalEpisodes?: number;
  streamUrl?: string;
}

export interface ShortDramaItem {
  id: string;                      // Unique ID, e.g. "hep_slug", "narto_slug", "ffzy_49257"
  source: ShortDramaSource;
  sourceName?: string;             // Human-readable studio or platform name (e.g. "HepDrama", "AnyReel", "DramaBox")
  title: string;
  originalTitle?: string;
  cover: string;
  poster?: string;
  banner?: string;
  description: string;
  totalEpisodes: number;
  language: ShortDramaLanguage;
  tags: string[];
  views?: string;
  rating?: string;
  releaseYear?: string;
  status: 'Completed' | 'Ongoing';
  isUnlocked: boolean;             // true if all episodes are free without paywall
  firstEpisodeStream?: string;
  sources?: ShortDramaSourceReference[]; // List of available sources if unified
}

export interface ShortDramaEpisode {
  episodeNumber: number;
  title: string;
  streamUrl: string;               // Direct HLS (.m3u8), resolver URL (/api/shorts/stream?...) or MP4
  type: 'hls' | 'mp4';
  duration?: string;
  thumbnail?: string;
  source?: ShortDramaSource;
  alternativeStreams?: Array<{
    source: ShortDramaSource;
    streamUrl: string;
    type: 'hls' | 'mp4';
  }>;
}

export interface ShortDramaDetail extends ShortDramaItem {
  episodes: ShortDramaEpisode[];
  recommendations: ShortDramaItem[];
}

export type ShortsCategoryTab = 
  | 'trending' 
  | 'hindi' 
  | 'english' 
  | 'western_ceo' 
  | 'unlocked_67k';
