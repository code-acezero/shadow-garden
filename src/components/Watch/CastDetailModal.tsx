"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { 
  X, User, Mic, Star, Calendar, MapPin, Heart, Film, 
  ArrowRight, ArrowLeft, Loader2, Play, Clapperboard, Tv
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CastModalData {
  id?: string | number;
  name: string;
  character?: string | null;
  role?: string | null;
  image?: string | null;
  profileLarge?: string | null;
  department?: string | null;
  popularity?: number | string | null;
  mediaType?: 'anime' | 'movie' | 'drama' | 'tv';
  // For Anime Character + Voice Actor support
  voiceActor?: {
    id?: string | number;
    name: string;
    poster?: string | null;
    language?: string | null;
  } | null;
}

interface CastDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CastModalData | null;
}

interface MediaNode {
  id: number | string;
  title?: {
    english?: string | null;
    romaji?: string | null;
    native?: string | null;
  } | null;
  coverImage?: {
    large?: string | null;
    medium?: string | null;
  } | null;
  format?: string | null;
  mediaType?: 'movie' | 'tv' | 'drama' | 'anime' | null;
  startDate?: {
    year?: number | null;
  } | null;
}

interface FullCharacterData {
  id: number | string;
  name: {
    full: string;
    native?: string | null;
    alternative?: string[] | null;
  };
  image: {
    large?: string | null;
    medium?: string | null;
  };
  description?: string | null;
  gender?: string | null;
  dateOfBirth?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  age?: string | null;
  bloodType?: string | null;
  favourites?: number | null;
  media?: {
    edges?: Array<{
      characterRole?: string | null;
      node: MediaNode;
    }>;
  };
}

interface FullVoiceArtistData {
  id: number | string;
  name: {
    full: string;
    native?: string | null;
    alternative?: string[] | null;
  };
  languageV2?: string | null;
  image: {
    large?: string | null;
    medium?: string | null;
  };
  description?: string | null;
  gender?: string | null;
  dateOfBirth?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  age?: string | number | null;
  yearsActive?: number[] | null;
  homeTown?: string | null;
  bloodType?: string | null;
  favourites?: number | null;
  primaryOccupations?: string[] | null;
  isLiveAction?: boolean;
  characters?: {
    edges?: Array<{
      role?: string | null;
      mediaType?: 'movie' | 'tv' | 'drama' | 'anime';
      node: {
        id: number | string;
        name: {
          full: string;
          native?: string | null;
          alternative?: string[] | null;
        };
        image?: {
          large?: string | null;
          medium?: string | null;
        } | null;
        description?: string | null;
        gender?: string | null;
        age?: string | null;
        bloodType?: string | null;
        favourites?: number | null;
        dateOfBirth?: { year?: number | null; month?: number | null; day?: number | null } | null;
      };
      media?: MediaNode[];
    }>;
  };
}

// Format AniList description: remove markdown link brackets, format spoilers, clean up bold tags
function cleanAniListDescription(text?: string | null): string[] {
  if (!text) return [];
  
  // Replace AniList spoilers ~!text!~ with clean text
  let cleaned = text.replace(/~!([\s\S]*?)!~/g, '$1');
  
  // Replace [text](url) with just text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Strip double bold markers __text__ and **text**
  cleaned = cleaned.replace(/__(.*?)__/g, '$1');
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  
  // Replace HTML breaks with newlines
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  
  // Split into clean paragraphs
  return cleaned
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

// Format birthday
function formatBirthday(dob?: { year?: number | null; month?: number | null; day?: number | null } | null): string | null {
  if (!dob || (!dob.month && !dob.day)) return null;
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const m = dob.month ? monthNames[dob.month - 1] : '';
  const d = dob.day ? `${dob.day}` : '';
  const y = dob.year ? `, ${dob.year}` : '';
  return `${m} ${d}${y}`.trim();
}

export default function CastDetailModal({ isOpen, onClose, data }: CastDetailModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'character' | 'voiceArtist'>('character');
  const [loading, setLoading] = useState(false);
  const [fullChar, setFullChar] = useState<FullCharacterData | null>(null);
  const [fullStaff, setFullStaff] = useState<FullVoiceArtistData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Determine if this is live-action (movies or drama)
  const isLiveAction = Boolean(
    data?.mediaType === 'movie' || 
    data?.mediaType === 'drama' || 
    data?.department === 'Acting' ||
    (!data?.voiceActor && data?.character)
  );

  // Fetch complete info when modal opens or data changes
  useEffect(() => {
    if (!isOpen || !data) {
      setFullChar(null);
      setFullStaff(null);
      setActiveTab('character');
      return;
    }

    // Default tab: if live action actor, default to actor profile; otherwise character
    const defaultTab = isLiveAction ? 'voiceArtist' : 'character';
    setActiveTab(defaultTab);
    let isMounted = true;
    setLoading(true);

    const isMovieOrDramaActor = isLiveAction && !data.voiceActor;

    const charIdParam = data.id && !isMovieOrDramaActor ? `characterId=${encodeURIComponent(data.id)}` : '';
    const charNameParam = data.character ? `characterName=${encodeURIComponent(data.character)}` : (!isMovieOrDramaActor && data.name ? `characterName=${encodeURIComponent(data.name)}` : '');
    const staffIdParam = isMovieOrDramaActor && data.id ? `staffId=${encodeURIComponent(data.id)}` : (data.voiceActor?.id ? `staffId=${encodeURIComponent(data.voiceActor.id)}` : '');
    const staffNameParam = isMovieOrDramaActor && data.name ? `staffName=${encodeURIComponent(data.name)}` : (data.voiceActor?.name ? `staffName=${encodeURIComponent(data.voiceActor.name)}` : '');
    const mediaTypeParam = data.mediaType ? `mediaType=${encodeURIComponent(data.mediaType)}` : '';

    const params = [charIdParam, charNameParam, staffIdParam, staffNameParam, mediaTypeParam].filter(Boolean).join('&');

    fetch(`/api/anime/character-details?${params}`)
      .then(res => res.ok ? res.json() : null)
      .then(result => {
        if (!isMounted) return;
        if (result) {
          if (result.character) setFullChar(result.character);
          if (result.voiceArtist) setFullStaff(result.voiceArtist);
        }
      })
      .catch(err => {
        console.warn('[CastDetailModal] Failed to load dossier:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, data, isLiveAction]);

  if (!isOpen || !data || !mounted) return null;

  const hasVoiceArtist = Boolean(data.voiceActor?.name || fullStaff?.name?.full || isLiveAction);
  const isCharacterView = activeTab === 'character' || !hasVoiceArtist;

  // Character Images & Attributes
  const charImage = fullChar?.image?.large || fullChar?.image?.medium || data.profileLarge || data.image || '/images/placeholder-no-img.jpg';
  const charName = fullChar?.name?.full || data.character || data.name;
  const charNativeName = fullChar?.name?.native;
  const charRole = data.role || (isLiveAction ? 'Character' : 'Main Character');
  const charFavorites = fullChar?.favourites ?? (typeof data.popularity === 'number' ? data.popularity : null);
  const charBirthday = formatBirthday(fullChar?.dateOfBirth);
  const charAge = fullChar?.age;
  const charGender = fullChar?.gender;
  const charBloodType = fullChar?.bloodType;
  const charParagraphs = cleanAniListDescription(fullChar?.description);
  const charMedia = fullChar?.media?.edges || [];

  // Voice Artist / Actor Images & Attributes
  const vaImage = fullStaff?.image?.large || fullStaff?.image?.medium || (isLiveAction ? (data.profileLarge || data.image) : data.voiceActor?.poster) || '/images/no-avatar.png';
  const vaName = fullStaff?.name?.full || (isLiveAction ? data.name : data.voiceActor?.name) || 'Voice Artist';
  const vaNativeName = fullStaff?.name?.native;
  const vaLanguage = fullStaff?.languageV2 || (isLiveAction ? (data.department || 'Acting') : (data.voiceActor?.language || 'Japanese'));
  const vaFavorites = fullStaff?.favourites;
  const vaHometown = fullStaff?.homeTown;
  const vaAge = fullStaff?.age;
  const vaBirthday = formatBirthday(fullStaff?.dateOfBirth);
  const vaParagraphs = cleanAniListDescription(fullStaff?.description);
  const vaRoles = fullStaff?.characters?.edges || [];

  // Handler: Click a character role from the voice actor/actor tab
  const handleSelectRoleCharacter = (edge: any) => {
    const roleChar = edge.node;
    const mediaNodes: MediaNode[] = edge.media || [];

    setFullChar({
      id: roleChar.id,
      name: roleChar.name || { full: 'Character' },
      image: roleChar.image || {},
      description: roleChar.description || null,
      gender: roleChar.gender,
      dateOfBirth: roleChar.dateOfBirth,
      age: roleChar.age,
      bloodType: roleChar.bloodType,
      favourites: roleChar.favourites,
      media: {
        edges: mediaNodes.map((m: MediaNode) => ({
          characterRole: edge.role,
          node: m
        }))
      }
    });

    setActiveTab('character');

    // Fetch complete character bio if available
    if (roleChar.id && !roleChar.description && !isLiveAction) {
      fetch(`/api/anime/character-details?characterId=${roleChar.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(res => {
          if (res?.character) {
            setFullChar(res.character);
          }
        })
        .catch(() => {});
    }
  };

  // Handler: Click an anime/media card in character view to play immediately
  const handlePlayMedia = (mediaNode: MediaNode) => {
    onClose();
    const mediaId = mediaNode?.id;
    if (!mediaId) return;

    if (isLiveAction || mediaNode.mediaType === 'movie' || mediaNode.mediaType === 'drama' || mediaNode.mediaType === 'tv') {
      const isMovie = mediaNode.mediaType === 'movie' || mediaNode.format === 'MOVIE';
      if (isMovie) {
        router.push(`/movies-watch/${mediaId}`);
      } else {
        router.push(`/drama-watch/${mediaId}`);
      }
    } else {
      router.push(`/watch/${mediaId}`);
    }
  };

  return createPortal(
    <div 
      id="cast-detail-modal-root"
      className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0c0d14] border border-white/10 rounded-t-[28px] sm:rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[82vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-primary/15 blur-3xl rounded-full pointer-events-none" />

        {/* Header Bar: Clean & Minimal Segment Tabs + Close Button */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 pt-3 sm:pt-5 pb-3 border-b border-white/[0.06] relative z-10 shrink-0">
          {hasVoiceArtist ? (
            <div className="flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('character')}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200",
                  isCharacterView
                    ? "bg-white/15 text-white shadow-sm border border-white/10"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <User size={13} className={isCharacterView ? "text-primary-400" : "text-zinc-500"} />
                <span>Character</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('voiceArtist')}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200",
                  !isCharacterView
                    ? "bg-white/15 text-white shadow-sm border border-white/10"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {isLiveAction ? (
                  <Clapperboard size={13} className={!isCharacterView ? "text-cyan-400" : "text-zinc-500"} />
                ) : (
                  <Mic size={13} className={!isCharacterView ? "text-purple-400" : "text-zinc-500"} />
                )}
                <span>{isLiveAction ? 'Actor' : 'Voice Artist'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-primary/10 text-primary-400 border border-primary/20">
                <User size={14} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-300 font-lemon">
                Character Profile
              </span>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all active:scale-90"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-4 sm:px-6 py-4 flex flex-col gap-4 sm:gap-5 relative z-10">

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB 1: CHARACTER VIEW                               */}
          {/* ═══════════════════════════════════════════════════ */}
          {isCharacterView && (
            <div className="flex flex-col gap-4 sm:gap-5 animate-in fade-in duration-150">
              {/* Profile Top Row: Responsive horizontal layout */}
              <div className="flex items-start gap-3.5 sm:gap-5">
                {/* Character Portrait */}
                <div className="relative shrink-0 w-24 h-32 sm:w-36 sm:h-48 rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 bg-zinc-900 shadow-2xl group">
                  <img 
                    src={charImage} 
                    alt={charName} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.src = '/images/placeholder-no-img.jpg'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Identity & Metadata */}
                <div className="flex-1 flex flex-col items-start text-left gap-1 sm:gap-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary-300 border border-primary/30">
                      {charRole}
                    </span>
                    {charFavorites !== null && charFavorites !== undefined && (
                      <span className="text-[9px] font-bold text-amber-400 flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                        <Star size={10} fill="currentColor" />
                        <span>{charFavorites.toLocaleString()}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-2xl font-black text-white font-lemon leading-tight mt-0.5 line-clamp-2 sm:line-clamp-none">
                    {charName}
                  </h3>

                  {charNativeName && (
                    <p className="text-xs text-zinc-400 font-medium tracking-wide">
                      {charNativeName}
                    </p>
                  )}

                  {/* Character Quick Attributes Pills */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1">
                    {charBirthday && (
                      <span className="text-[9px] sm:text-[10px] font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Calendar size={10} className="text-zinc-500" /> {charBirthday}
                      </span>
                    )}
                    {charAge && (
                      <span className="text-[9px] sm:text-[10px] font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-lg">
                        Age: {charAge}
                      </span>
                    )}
                    {charGender && (
                      <span className="text-[9px] sm:text-[10px] font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-lg">
                        {charGender}
                      </span>
                    )}
                    {charBloodType && (
                      <span className="text-[9px] sm:text-[10px] font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-lg">
                        Blood: {charBloodType}
                      </span>
                    )}
                  </div>

                  {/* Voice Artist / Actor Quick Connect Card */}
                  {vaName && (
                    <div 
                      onClick={() => setActiveTab('voiceArtist')}
                      className="cursor-pointer w-full mt-2 p-2 sm:p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-purple-500/40 transition-all flex items-center justify-between gap-2.5 group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-9 sm:w-8 sm:h-10 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-zinc-900">
                          <img 
                            src={vaImage} 
                            alt={vaName}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = '/images/no-avatar.png'; }}
                          />
                        </div>
                        <div className="min-w-0 text-left">
                          <span className="text-[8px] sm:text-[9px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                            {isLiveAction ? (
                              <><Clapperboard size={9} className="text-cyan-400" /> Portrayed by</>
                            ) : (
                              <><Mic size={9} className="text-purple-400" /> Voiced by ({data.voiceActor?.language || 'Japanese'})</>
                            )}
                          </span>
                          <h4 className="text-[11px] sm:text-xs font-black text-white truncate group-hover:text-purple-300 transition-colors">
                            {vaName}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-zinc-400 group-hover:text-purple-300 transition-colors pr-1 shrink-0">
                        <span className="hidden sm:inline">{isLiveAction ? 'Actor Profile' : 'Artist Profile'}</span>
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Biography Section */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest font-lemon flex items-center gap-1.5">
                  <User size={13} className="text-primary-500" />
                  <span>Character Dossier & Lore</span>
                </h4>

                {loading && !fullChar?.description ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-zinc-500">
                    <Loader2 size={14} className="animate-spin text-primary-500" />
                    <span>Loading character archive...</span>
                  </div>
                ) : charParagraphs.length > 0 ? (
                  <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans space-y-2">
                    {charParagraphs.map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic py-1">
                    No detailed character biography registered in the archives.
                  </p>
                )}
              </div>

              {/* Featured Anime / Media Appearances (CLICKABLE TO PLAY) */}
              {charMedia.length > 0 && (
                <div className="flex flex-col gap-2.5 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest font-lemon flex items-center gap-1.5">
                      <Film size={13} className="text-primary-500" />
                      <span>{isLiveAction ? 'Media Appearances (Click to Play)' : 'Anime Appearances (Click to Play)'}</span>
                    </h4>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                      {charMedia.length} Titles
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {charMedia.slice(0, 8).map((item, idx) => {
                      const anime = item.node;
                      const titleStr = anime?.title?.english || anime?.title?.romaji || 'Watch Title';
                      const coverImg = anime?.coverImage?.large || anime?.coverImage?.medium || '/images/placeholder-no-img.jpg';
                      const year = anime?.startDate?.year;

                      return (
                        <div 
                          key={anime?.id || idx}
                          onClick={() => handlePlayMedia(anime)}
                          className="cursor-pointer flex items-center justify-between gap-2.5 p-2 rounded-xl bg-white/[0.02] hover:bg-primary-500/10 border border-white/[0.06] hover:border-primary-500/30 transition-all duration-200 group active:scale-[0.98]"
                          title={`Play ${titleStr}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-12 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/10 relative shadow-sm">
                              <img 
                                src={coverImg} 
                                alt={titleStr}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => { e.currentTarget.src = '/images/placeholder-no-img.jpg'; }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-[11px] font-bold text-white group-hover:text-primary-300 transition-colors truncate leading-snug" title={titleStr}>
                                {titleStr}
                              </h5>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-zinc-400 font-medium">
                                  {year || anime?.format || 'Series'}
                                </span>
                                {item.characterRole && (
                                  <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400">
                                    {item.characterRole}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500/20 group-hover:bg-primary-500 text-primary-400 group-hover:text-white border border-primary-500/30 transition-all shadow-sm">
                            <Play size={12} fill="currentColor" className="ml-0.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB 2: VOICE ARTIST / ACTOR VIEW                    */}
          {/* ═══════════════════════════════════════════════════ */}
          {!isCharacterView && (
            <div className="flex flex-col gap-4 sm:gap-5 animate-in fade-in duration-150">
              {/* Voice Artist / Actor Top Row */}
              <div className="flex items-start gap-3.5 sm:gap-5">
                {/* Portrait */}
                <div className="relative shrink-0 w-24 h-32 sm:w-36 sm:h-48 rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 bg-zinc-900 shadow-2xl group">
                  <img 
                    src={vaImage} 
                    alt={vaName} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.src = '/images/no-avatar.png'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Identity & Metadata */}
                <div className="flex-1 flex flex-col items-start text-left gap-1 sm:gap-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                      isLiveAction 
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                        : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    )}>
                      {isLiveAction ? `${vaLanguage}` : `${vaLanguage} Voice Actor`}
                    </span>
                    {vaFavorites !== null && vaFavorites !== undefined && (
                      <span className="text-[9px] font-bold text-purple-300 flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                        <Heart size={10} fill="currentColor" />
                        <span>{vaFavorites.toLocaleString()}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-2xl font-black text-white font-lemon leading-tight mt-0.5 line-clamp-2 sm:line-clamp-none">
                    {vaName}
                  </h3>

                  {vaNativeName && (
                    <p className="text-xs text-zinc-400 font-medium tracking-wide">
                      {vaNativeName}
                    </p>
                  )}

                  {/* Staff Quick Attributes */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1">
                    {vaBirthday && (
                      <span className="text-[9px] sm:text-[10px] font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Calendar size={10} className="text-zinc-500" /> {vaBirthday}
                      </span>
                    )}
                    {vaHometown && (
                      <span className="text-[9px] sm:text-[10px] font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <MapPin size={10} className="text-zinc-500" /> {vaHometown}
                      </span>
                    )}
                    {vaAge && (
                      <span className="text-[9px] sm:text-[10px] font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-lg">
                        Age: {vaAge}
                      </span>
                    )}
                  </div>

                  {/* Character Back-Link Card */}
                  {charName && (
                    <div 
                      onClick={() => setActiveTab('character')}
                      className="cursor-pointer w-full mt-2 p-2 sm:p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-primary-500/40 transition-all flex items-center justify-between gap-2.5 group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-9 sm:w-8 sm:h-10 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-zinc-900">
                          <img 
                            src={charImage} 
                            alt={charName}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = '/images/placeholder-no-img.jpg'; }}
                          />
                        </div>
                        <div className="min-w-0 text-left">
                          <span className="text-[8px] sm:text-[9px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                            {isLiveAction ? (
                              <><Clapperboard size={9} className="text-primary-400" /> Currently Playing</>
                            ) : (
                              <><Mic size={9} className="text-primary-400" /> Currently Voicing</>
                            )}
                          </span>
                          <h4 className="text-[11px] sm:text-xs font-black text-white truncate group-hover:text-primary-300 transition-colors">
                            {charName}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-zinc-400 group-hover:text-primary-300 transition-colors pr-1 shrink-0">
                        <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="hidden sm:inline">Back to Character</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Biography Section */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest font-lemon flex items-center gap-1.5">
                  {isLiveAction ? <Clapperboard size={13} className="text-cyan-400" /> : <Mic size={13} className="text-purple-400" />}
                  <span>Biography & Background</span>
                </h4>

                {loading && !fullStaff?.description ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-zinc-500">
                    <Loader2 size={14} className={cn("animate-spin", isLiveAction ? "text-cyan-400" : "text-purple-400")} />
                    <span>Loading profile archive...</span>
                  </div>
                ) : vaParagraphs.length > 0 ? (
                  <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans space-y-2">
                    {vaParagraphs.map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic py-1">
                    No detailed biographical background available.
                  </p>
                )}
              </div>

              {/* Roles Section with ANIME / TITLE NAMES & CLICKABLE DRILL-DOWN */}
              {vaRoles.length > 0 && (
                <div className="flex flex-col gap-2.5 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest font-lemon flex items-center gap-1.5">
                      <Star size={13} className={isLiveAction ? "text-cyan-400" : "text-purple-400"} />
                      <span>{isLiveAction ? 'Notable Roles & Filmography' : 'Other Legendary Roles'}</span>
                    </h4>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                      Click to View Character
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {vaRoles.slice(0, 10).map((edge, idx) => {
                      const roleChar = edge.node;
                      const roleName = roleChar.name?.full || 'Character';
                      const roleImg = roleChar.image?.medium || roleChar.image?.large || '/images/placeholder-no-img.jpg';
                      const primaryMedia = edge.media?.[0];
                      const animeTitle = primaryMedia?.title?.english || primaryMedia?.title?.romaji || null;

                      return (
                        <div 
                          key={roleChar.id || idx}
                          onClick={() => handleSelectRoleCharacter(edge)}
                          className="cursor-pointer flex items-center justify-between gap-2.5 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.07] border border-white/[0.06] hover:border-primary-500/30 transition-all duration-200 group active:scale-[0.98]"
                          title={`View ${roleName} details`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-13 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/5 relative">
                              <img 
                                src={roleImg} 
                                alt={roleName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => { e.currentTarget.src = '/images/placeholder-no-img.jpg'; }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h5 className="text-[11px] font-bold text-white group-hover:text-primary-300 transition-colors truncate leading-tight" title={roleName}>
                                  {roleName}
                                </h5>
                                {edge.role && (
                                  <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/[0.04]">
                                    {edge.role}
                                  </span>
                                )}
                              </div>

                              {/* Prominent Anime / Media Title Display */}
                              {animeTitle && (
                                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-primary-400 font-semibold truncate mt-0.5">
                                  <Film size={10} className="shrink-0 text-primary-400/80" />
                                  <span className="truncate" title={animeTitle}>
                                    {animeTitle}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 text-[10px] text-zinc-500 group-hover:text-primary-400 transition-colors pr-1">
                            <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider">Details</span>
                            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Minimal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-white/[0.06] bg-[#0c0d14]/90 backdrop-blur-md flex items-center justify-between text-zinc-500 text-[10px] relative z-10 shrink-0">
          <span className="hidden sm:inline">Press ESC to dismiss dossier</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 border border-white/10"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

