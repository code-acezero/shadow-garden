/**
 * Shadow Garden - Vertical Drama & Shorts Types
 * Multi-source Unified Data Model
 */

export type ShortDramaLanguage = 
  | 'Hindi Dub' 
  | 'English Dub' 
  | 'Chinese' 
  | 'Korean' 
  | 'Japanese' 
  | 'Multi';

export type ShortDramaSource = 
  | 'maccms_ikun' 
  | 'maccms_ffzy' 
  | 'maccms_lzi' 
  | 'dramabox' 
  | 'shortmax'
  | 'curated_hindi';

export interface ShortDramaItem {
  id: string;                      // Unique ID, e.g. "ffzy_49257" or "db_4100012"
  source: ShortDramaSource;
  title: string;
  originalTitle?: string;
  cover: string;
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
}

export interface ShortDramaEpisode {
  episodeNumber: number;
  title: string;
  streamUrl: string;               // Direct HLS (.m3u8) or MP4 CDN URL
  type: 'hls' | 'mp4';
  duration?: string;
  thumbnail?: string;
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
