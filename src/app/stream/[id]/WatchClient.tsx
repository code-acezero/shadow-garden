"use client";

import { useJellyFlip } from '@/lib/useJellyFlip';
import React, { useState, useEffect, useRef, useCallback, memo, Suspense, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  SkipForward, SkipBack, Server as ServerIcon, Layers, Clock, Play, 
  Grid, List, LayoutGrid, ChevronDown, Flame, Info, Loader2, Check, X, 
  Download, AlertTriangle, Lightbulb, StepForward, Share2, Users, Star,
  FastForward, Film, Zap, CheckCircle2, ChevronRight, ChevronLeft, MessageSquare,
  RefreshCw, Subtitles, Globe, Volume2, ShieldCheck
} from 'lucide-react';
import { WatchPageSkeleton, LiquidPlayerSkeleton } from '@/components/UIx/SkeletonLoaders';
import { omni, DramaDetail, DramaServer, DramaStream, DramaCard } from '@/lib/omni';
import { cn, formatAnimeTitle } from '@/lib/utils';
import DramaPlayer, { DramaPlayerRef } from '@/components/Player/DramaPlayer';
import Footer from '@/components/Anime/Footer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import ShadowComments from '@/components/Comments/ShadowComments';
import WatchListButton from '@/components/Watch/WatchListButton';
import PostShareModal from '@/components/Social/PostShareModal';
import CastDetailModal, { CastModalData } from '@/components/Watch/CastDetailModal';
import TrailerModal from '@/components/Watch/TrailerModal';
import { sfx } from '@/lib/audioManager';
import { toast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import DCard from '@/components/Drama/DCard';
import CountryBadge from '@/components/Drama/CountryBadge';

// ── Marquee Title Helper ──────────────────────────────────────────────────────

const MarqueeTitle = ({ text }: { text: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
    }
  }, [text]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden whitespace-nowrap relative select-none">
      <div className={cn("inline-block", isOverflowing && "animate-marquee hover:[animation-play-state:paused]")}>
        <span ref={textRef} className="text-xs font-black uppercase tracking-wider text-zinc-300 mr-8">
          {text}
        </span>
        {isOverflowing && (
          <span className="text-xs font-black uppercase tracking-wider text-zinc-300 mr-8">
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Short Server Name Formatter ───────────────────────────────────────────────

const formatServerLabel = (name?: string) => {
  if (!name) return 'Server';
  let clean = name
    .replace(/\s*[\(\[]\s*(Hindi|Multi|Dubbed|Original|DUB|SUB)[^\)\]]*[\)\]]/gi, '')
    .replace(/^Hindi\s+Dub\s*\((.*?)\)/i, (_, p) => isNaN(Number(p)) ? p : `Server ${p}`)
    .replace(/^Hindi\s+Dub\s*[-–:]?\s*/i, '')
    .replace(/^Hindi\s+Drama\s+HD/i, 'Hindi HD')
    .replace(/\s*[-–]\s*Hindi(\s+Dub)?$/i, '')
    .replace(/\s+Mirror\s*$/i, ' Alt')
    .trim();
  return clean || name;
};

// ── Episode Button (Animewatch Grid / List / Compact) ─────────────────────────

interface EpisodeButtonProps {
  ep: { id: string; number: number; title: string };
  isCurrent: boolean;
  isPlayed: boolean;
  viewMode: 'grid' | 'list' | 'compact';
  onClick: (id: string) => void;
}

const EpisodeButton = memo(({ ep, isCurrent, isPlayed, viewMode, onClick }: EpisodeButtonProps) => {
  return (
    <button
      type="button"
      data-flip-id={ep.id}
      onClick={() => onClick(ep.id)}
      className={cn(
        "relative overflow-hidden group border select-none transition-colors duration-200 transform-gpu active:scale-95 hover:scale-[1.03] text-center font-bold",
        viewMode === 'grid' 
          ? "h-8 sm:h-9 w-full rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black" 
          : viewMode === 'compact' 
            ? "h-7 sm:h-8 w-full aspect-square rounded-full flex items-center justify-center text-[9px] font-bold" 
            : "w-full h-8 sm:h-9 rounded-2xl flex items-center px-3 sm:px-4 text-[10px] sm:text-[11px] font-bold text-left justify-start",
        isCurrent 
          ? "bg-emerald-500/20 backdrop-blur-md border-emerald-400/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] z-10" 
          : isPlayed 
            ? "bg-rose-500/15 backdrop-blur-md border-rose-400/30 text-rose-300 hover:border-rose-400/60" 
            : "bg-white/[0.03] backdrop-blur-md border-white/[0.06] text-zinc-400 hover:border-cyan-400/40 hover:bg-white/[0.08] hover:text-white"
      )}
    >
      <div className={cn("relative z-10 w-full h-full flex items-center font-lemon tracking-wide overflow-hidden", viewMode === 'list' ? "justify-between" : "justify-center")}>
        <div className="flex items-center gap-2 min-w-0 truncate">
          <span className="shrink-0 font-bold">{ep.number}</span>
          {viewMode === 'list' && (
            <span className="truncate text-[11px] font-sans font-medium text-zinc-300 transition-opacity duration-200">
              {ep.title && !ep.title.toLowerCase().startsWith(`episode ${ep.number}`) ? `• ${ep.title}` : ''}
            </span>
          )}
        </div>
        {isCurrent && viewMode === 'list' && (
          <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[8px] font-black uppercase text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)] shrink-0 transition-transform duration-200">
            <span>PLAYING</span>
          </span>
        )}
      </div>
    </button>
  );
});
EpisodeButton.displayName = "EpisodeButton";

// ── Cast & Characters Block (Matches Anime Watch & Supports 12-item Multi-Tab Pagination) ──────

const CastCharactersBlock = ({ characters, cast }: { characters?: any[]; cast?: any[] }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCast, setSelectedCast] = useState<CastModalData | null>(null);

  const list = useMemo(() => {
    if (Array.isArray(characters) && characters.length > 0) return characters;
    if (Array.isArray(cast) && cast.length > 0) {
      return cast.map((c, i) => {
        if (typeof c === 'string') {
          return { id: String(i), name: c, character: 'Cast Member', role: 'Cast Member', image: null, profile: null };
        }
        return c;
      });
    }
    return [];
  }, [characters, cast]);

  const itemsPerPage = 12;
  const totalTabs = Math.ceil(list.length / itemsPerPage) || 1;

  useEffect(() => {
    if (activeTab >= totalTabs) setActiveTab(0);
  }, [totalTabs, activeTab]);

  const currentCasts = useMemo(() => {
    const start = activeTab * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
  }, [list, activeTab]);

  if (!list || list.length === 0) return null;

  return (
    <div className="w-full bg-[#0c1322] rounded-[32px] border border-white/[0.12] p-5 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.05] flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-[#0e1629]/90 border border-white/[0.08] text-cyan-400">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-lemon">
              Character & Voice Artists
            </h3>
            <p className="text-[10px] text-zinc-400">Starring actors, character roles & profile details</p>
          </div>
        </div>

        {/* Top-Right Multi-Tab Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
            {activeTab * itemsPerPage + 1}–{Math.min((activeTab + 1) * itemsPerPage, list.length)} of {list.length}
          </span>

          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
              disabled={activeTab === 0}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-all active:scale-95"
              title="Previous casts"
              aria-label="Previous casts"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] font-black text-cyan-400 px-1.5">
              {activeTab + 1}/{totalTabs}
            </span>
            <button
              onClick={() => setActiveTab(prev => Math.min(totalTabs - 1, prev + 1))}
              disabled={activeTab >= totalTabs - 1}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-all active:scale-95"
              title="Next casts"
              aria-label="Next casts"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {currentCasts.map((char: any, idx: number) => {
          const actorName = char.name || 'Unknown Actor';
          const charName = char.character || char.role || 'Cast Member';
          const avatar = char.profile || char.profileLarge || char.image || char.poster;

          return (
            <div 
              key={char.id || `${actorName}-${idx}`} 
              onClick={() => setSelectedCast({
                id: char.id,
                name: actorName,
                character: char.character || null,
                role: char.role || 'Cast Member',
                image: avatar,
                profileLarge: char.profileLarge || avatar,
                department: char.department || 'Acting',
                popularity: char.popularity,
                mediaType: 'movie'
              })}
              className="cursor-pointer flex flex-col gap-2 bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.06] hover:border-cyan-400/30 rounded-2xl p-2.5 transition-all group"
            >
              <div className="w-full aspect-[3/4] rounded-xl overflow-hidden shrink-0 border border-white/10 relative bg-zinc-900 shadow-md">
                <img
                  src={avatar || '/images/no-avatar.png'}
                  alt={actorName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.currentTarget.src = '/images/no-avatar.png'; }}
                />
              </div>
              <div className="min-w-0 flex flex-col">
                <h4 className="text-xs font-black text-white truncate group-hover:text-cyan-300 transition-colors">
                  {actorName}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-medium">
                  {charName}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <CastDetailModal 
        isOpen={Boolean(selectedCast)} 
        onClose={() => setSelectedCast(null)} 
        data={selectedCast} 
      />
    </div>
  );
};

// ── Family Lineage & Related Titles Block (Strict Mode) ───────────────────────

const STRICT_RELATION_TYPES = new Set([
  'FRANCHISE',
  'CONNECTED',
  'PREQUEL',
  'SEQUEL',
  'SIDE_STORY',
  'SPIN_OFF',
  'ALTERNATIVE',
  'PARENT',
  'CHARACTER'
]);

const RelatedTitlesBlock = ({ 
  related, 
  className = "xl:col-span-12 w-full" 
}: { 
  related?: DramaCard[];
  className?: string;
}) => {
  const list = useMemo(() => {
    const combined: DramaCard[] = [];
    const seen = new Set<string>();

    (related || []).forEach(item => {
      if (!item || !item.id) return;
      const relType = (item.relationType || '').toUpperCase().trim();
      // Strictly look for genuine relation types only
      if (STRICT_RELATION_TYPES.has(relType) && !seen.has(String(item.id))) {
        seen.add(String(item.id));
        combined.push(item);
      }
    });

    return combined;
  }, [related]);

  // If nothing, the section will completely disappear
  if (!list || list.length === 0) return null;

  return (
    <div className={className}>
      <div className="w-full bg-[#0c1322] rounded-[32px] border border-white/[0.12] p-5 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.05] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#0e1629]/90 border border-white/[0.08] text-cyan-400">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-lemon">
                Related Titles
              </h3>
              <p className="text-[10px] text-zinc-400">Prequels, sequels, connected franchise & related universe</p>
            </div>
          </div>
          <span className="text-[10px] font-black text-cyan-300 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 uppercase tracking-widest">
            {list.length} Titles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.slice(0, 12).map((rel: any) => {
            const relationLabel = (rel.relationType || (rel.isMovie ? 'FRANCHISE' : 'CONNECTED')).replace(/_/g, ' ');
            return (
              <Link
                key={rel.id}
                href={`/stream/${rel.id}${rel.isMovie ? '?type=movie' : ''}`}
                className="group flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.06] hover:border-cyan-400/30 transition-all duration-300 relative overflow-hidden"
              >
                <div className="w-14 h-20 rounded-xl overflow-hidden shrink-0 relative bg-zinc-900 border border-white/10 shadow-md">
                  <img
                    src={rel.poster || rel.image || '/images/no-poster.png'}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = '/images/no-poster.png'; }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={16} fill="white" className="text-white drop-shadow-md" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 mb-1">
                    {relationLabel}
                  </span>
                  <h4 className="text-xs font-black text-white truncate group-hover:text-cyan-300 transition-colors">
                    {rel.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400">
                    {rel.year && <span>{rel.year}</span>}
                    {rel.score && (
                      <span className="flex items-center gap-0.5 text-yellow-400 font-bold">
                        <Star size={10} fill="currentColor" /> {rel.score}
                      </span>
                    )}
                    <span className="uppercase text-[9px] font-bold text-zinc-500">{rel.country || rel.type}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Cinema Intel & Stream Telemetry Panel (Fills Info Section Right Side) ─────

interface CinemaIntelPanelProps {
  drama: DramaDetail;
  isMovie?: boolean;
}

const CinemaIntelPanel = ({ drama, isMovie = false }: CinemaIntelPanelProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    try {
      if (typeof window !== 'undefined') {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Stream link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const formattedRelease = useMemo(() => {
    if (!drama.releaseDate && !drama.year) return null;
    if (drama.releaseDate) {
      try {
        const d = new Date(drama.releaseDate);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      } catch {}
    }
    return drama.year || null;
  }, [drama.releaseDate, drama.year]);

  return (
    <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col justify-between gap-3.5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] shadow-inner">
      {/* Top Header: Cinema Intel Title & Status */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-[10px] font-black tracking-widest uppercase text-zinc-300 font-lemon">
            Cinema Intel
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
          4K UHD Ready
        </span>
      </div>

      {/* Grid: Audio, Quality, Subtitles, Protection */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col gap-0.5">
          <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
            <Volume2 size={10} className="text-cyan-400" /> Audio
          </span>
          <span className="font-bold text-zinc-200 truncate">
            {drama.isHindi ? "Multi + Hindi" : "Studio Stereo 2.0"}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col gap-0.5">
          <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
            <Subtitles size={10} className="text-cyan-400" /> Subtitles
          </span>
          <span className="font-bold text-zinc-200 truncate">
            Multi-Language
          </span>
        </div>

        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col gap-0.5">
          <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
            <ShieldCheck size={10} className="text-emerald-400" /> Protection
          </span>
          <span className="font-bold text-emerald-400 truncate">
            Ad-Shield Active
          </span>
        </div>

        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col gap-0.5">
          <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
            <Zap size={10} className="text-yellow-400" /> CDN Network
          </span>
          <span className="font-bold text-zinc-200 truncate">
            Ultra-Low Ping
          </span>
        </div>
      </div>

      {/* Production & Director Info */}
      <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06] text-[11px]">
        {drama.director && (
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Director:</span>
            <span className="font-bold text-zinc-200 truncate max-w-[170px]">{drama.director}</span>
          </div>
        )}

        {formattedRelease && (
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Premiere:</span>
            <span className="font-bold text-zinc-200">{formattedRelease}</span>
          </div>
        )}

        {drama.voteCount && (
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Community:</span>
            <span className="font-bold text-yellow-400 flex items-center gap-1">
              <Star size={10} fill="currentColor" /> {drama.rating || '8.5'} ({drama.voteCount})
            </span>
          </div>
        )}

        {drama.studios && drama.studios.length > 0 && (
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Studios / Network:</span>
            <div className="flex flex-wrap gap-1">
              {drama.studios.map(s => (
                <span key={s.name} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[9px] font-bold text-zinc-300">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share / Copy Action */}
      <button
        onClick={handleCopyLink}
        className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/30 text-zinc-300 hover:text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 group shadow-sm"
      >
        {copied ? (
          <>
            <Check size={12} className="text-emerald-400" />
            <span className="text-emerald-400">Copied Stream Link</span>
          </>
        ) : (
          <>
            <Share2 size={12} className="text-zinc-400 group-hover:text-cyan-400 transition-colors" />
            <span>Share Stream Link</span>
          </>
        )}
      </button>
    </div>
  );
};

// ── Movie Cinema Sidebar (Right Column - Up Next & Franchise Queue Only) ───────

interface MovieCinemaSidebarProps {
  drama: DramaDetail;
  related?: DramaCard[];
  recommendations?: DramaCard[];
}

const MovieCinemaSidebar = ({
  drama,
  related = [],
  recommendations = []
}: MovieCinemaSidebarProps) => {
  const queueItems = useMemo(() => {
    const list: (DramaCard & { queueType: string })[] = [];
    const seen = new Set<string>();

    (related || []).forEach(item => {
      if (item && item.id && !seen.has(String(item.id)) && String(item.id) !== String(drama.id)) {
        seen.add(String(item.id));
        list.push({ ...item, queueType: item.relationType || 'FRANCHISE' });
      }
    });

    (recommendations || []).forEach(item => {
      if (item && item.id && !seen.has(String(item.id)) && String(item.id) !== String(drama.id)) {
        seen.add(String(item.id));
        list.push({ ...item, queueType: 'RECOMMENDED' });
      }
    });

    return list;
  }, [related, recommendations, drama.id]);

  return (
    <div className="w-full h-full min-h-[460px] max-h-[620px] bg-[#0c1322] rounded-[32px] border border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.05] flex flex-col overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-3 sm:p-4 bg-[#0e1628] border-b border-white/[0.08] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/20">
            <Film size={15} />
          </div>
          <span className="font-black text-white uppercase text-xs font-lemon tracking-wider">Cinema Hub</span>
        </div>

        <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
          <Layers size={11} />
          <span>Up Next ({queueItems.length})</span>
        </div>
      </div>

      {/* Up Next & Franchise Scroll List */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="flex flex-col gap-2">
          {queueItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 font-medium">
              No queue titles available.
            </div>
          ) : (
            queueItems.map((item) => (
              <Link
                key={item.id}
                href={`/stream/${item.id}?type=movie`}
                className="group flex items-center gap-3 p-2 rounded-2xl bg-white/[0.02] hover:bg-cyan-500/10 border border-white/[0.05] hover:border-cyan-400/30 transition-all duration-200"
              >
                <div className="w-12 h-16 rounded-xl overflow-hidden shrink-0 relative bg-zinc-900 border border-white/10 shadow-sm">
                  <img
                    src={item.poster || item.image || '/images/no-poster.png'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = '/images/no-poster.png'; }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={14} fill="white" className="text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={cn(
                      "text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border",
                      item.queueType === 'FRANCHISE'
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/30"
                        : "bg-purple-500/20 text-purple-300 border-purple-400/30"
                    )}>
                      {item.queueType}
                    </span>
                    {item.year && <span className="text-[9px] text-zinc-400">{item.year}</span>}
                  </div>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[9px] text-zinc-400">
                    {item.score && (
                      <span className="flex items-center gap-0.5 text-yellow-400 font-bold">
                        <Star size={9} fill="currentColor" /> {item.score}
                      </span>
                    )}
                    <span className="text-zinc-500 uppercase">{item.country || 'Movie'}</span>
                  </div>
                </div>

                <ChevronRight size={14} className="text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// ── Main Watch Component ──────────────────────────────────────────────────────

export function DramaWatchContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawSlug = (params.id as string) || '';
  // Extract TMDB / IMDb ID if title slug is appended (e.g. 969681-spider-man-brand-new-day -> 969681)
  const cleanIdMatch = rawSlug.match(/^(\d+|tt\d+)/i);
  const slug = cleanIdMatch ? cleanIdMatch[1] : rawSlug;
  const urlEp = searchParams.get('ep');
  const urlType = searchParams.get('type');

  const { user } = useAuth();
  const [dimMode, setDimMode] = useState(false);
  const playerRef = useRef<DramaPlayerRef>(null);
  const progressRef = useRef(0);

  const [drama, setDrama] = useState<DramaDetail | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [activeSeason, setActiveSeason] = useState<number>(() => {
    const s = Number(searchParams.get('season'));
    return s > 0 ? s : 1;
  });
  const [streamKey, setStreamKey] = useState<number>(0);
  const [currentEpId, setCurrentEpId] = useState<string | null>(null);
  const [stream, setStream] = useState<DramaStream | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [activeServerIdx, setActiveServerIdx] = useState(0);
  const [audioMode, setAudioMode] = useState<'og' | 'multi'>('og');
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [epViewMode, setEpViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [epChunkIndex, setEpChunkIndex] = useState(0);
  const epContainerRef = useRef<HTMLDivElement>(null);
  useJellyFlip(epViewMode, epContainerRef);
  const [isAutoNext, setIsAutoNext] = useState(true);
  const chunkSize = 50;

  // Seamlessly synchronize browser URL with slugified title
  useEffect(() => {
    if (drama && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const slugTitle = drama.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const expectedSlug = `${drama.id}-${slugTitle}`;
      if (!currentPath.includes(expectedSlug) && currentPath.startsWith('/stream/')) {
        const search = window.location.search;
        window.history.replaceState(null, '', `/stream/${expectedSlug}${search}`);
      }
    }
  }, [drama]);

  const filteredRecommendations = useMemo(() => {
    if (!drama?.recommendations || drama.recommendations.length === 0) return [];
    const relatedIds = new Set((drama.related || []).map(r => String(r.id)));
    return drama.recommendations.filter(r => String(r.id) !== String(drama.id) && !relatedIds.has(String(r.id)));
  }, [drama?.recommendations, drama?.related, drama?.id]);

  useEffect(() => {
    sfx.pauseBGM();
    return () => { sfx.resumeBGM(); };
  }, []);

  const handleCreateWatchRoom = async () => {
    if (!user || !supabase) {
      toast.error("Please log in to start a watch room!");
      return;
    }

    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const currentEp = drama?.episodes.find(e => e.id === currentEpId);
      const { data: room, error: roomError } = await supabase
        .from('watch_rooms')
        .insert({
          code,
          title: drama?.title || 'Cinema Watch Room',
          host_id: user.id,
          media_id: drama?.id,
          media_type: drama?.isMovie ? 'movie' : 'drama',
          episode_number: currentEp?.number || 1,
          is_private: false
        })
        .select()
        .single();

      if (roomError) throw roomError;

      await supabase.from('room_members').insert({
        room_id: room.id,
        user_id: user.id,
        role: 'host'
      });

      toast.success("Watch room created!");
      window.location.href = `/rooms/${code}`;
    } catch (err: any) {
      console.error("Failed to create room:", err);
      toast.error("Could not create watch room");
    }
  };

  const handleSeasonChange = async (seasonNum: number) => {
    if (seasonNum === activeSeason) return;
    setActiveSeason(seasonNum);
    setIsLoadingInfo(true);
    try {
      const data = await omni.drama.getDetail(slug, urlType || undefined, seasonNum);
      if (data) {
        setDrama(data);
        if (data.episodes && data.episodes.length > 0) {
          setCurrentEpId(data.episodes[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load season:", e);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  // Played episodes tracking
  const [playedEpIds, setPlayedEpIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem(`shadow_drama_played_${slug}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const markEpPlayed = useCallback((id: string | null) => {
    if (!id) return;
    setPlayedEpIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem(`shadow_drama_played_${slug}`, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [slug]);

  // Load drama/movie info
  useEffect(() => {
    if (!slug) return;
    setDrama(null);
    setCurrentEpId(null);
    setStream(null);
    setStreamError(null);
    setIsLoadingInfo(true);
    (async () => {
      const data = await omni.drama.getDetail(slug, urlType || undefined, activeSeason);

      if (data && (!data.recommendations || data.recommendations.length === 0)) {
        try {
          let relatedData = null;
          if (data.country) {
            relatedData = await omni.drama.getByCountry(data.country, 1);
          } else if (data.genres && data.genres.length > 0) {
            relatedData = await omni.drama.getByGenre(data.genres[0], 1);
          }

          if (relatedData && relatedData.items && relatedData.items.length > 1) {
            data.recommendations = relatedData.items
              .filter((s: any) => s.id !== data.id)
              .slice(0, 10);
          } else {
            const homeData = await omni.drama.getHome();
            if (homeData && homeData.sections && homeData.sections.length > 0) {
              data.recommendations = homeData.sections[0].items
                .filter((s: any) => s.id !== data.id)
                .slice(0, 10);
            }
          }
        } catch {}
      }

      setDrama(data);
      setIsLoadingInfo(false);

      if (data?.episodes?.length) {
        let target = data.episodes[0].id;
        if (urlEp) {
          const paramStr = String(urlEp).trim();
          const paramNum = Number(paramStr);
          const found = data.episodes.find(e => 
            String(e.id) === paramStr || 
            String(e.number) === paramStr || 
            (!isNaN(paramNum) && Number(e.number) === paramNum)
          );
          if (found) target = found.id;
        }
        setCurrentEpId(target);
      }
    })();
  }, [slug, urlType, urlEp]);

  // Load stream when episode, season, streamKey, or audioMode changes
  useEffect(() => {
    if (!currentEpId || !drama) return;
    const ep = drama.episodes.find(e => e.id === currentEpId);
    if (!ep?.embedUrl) return;

    (async () => {
      setIsStreamLoading(true);
      setStreamError(null);
      setStream(null);
      setActiveServerIdx(0);
      try {
        const isMovie = Boolean(drama.isMovie || drama.type === 'Movie');
        const result = await omni.drama.getStream(
          ep.embedUrl || '',
          drama.id,
          activeSeason,
          ep.number,
          isMovie,
          drama.title,
          audioMode,
          drama.imdbId
        );
        setStream(result);

        if (result.servers && result.servers.length > 0) {
          setActiveServerIdx(0);
        }
      } catch {
        setStreamError('Failed to load stream');
      } finally {
        setIsStreamLoading(false);
      }
    })();
  }, [currentEpId, drama, activeSeason, streamKey, audioMode]);

  const handleAudioModeChange = useCallback((mode: 'og' | 'multi') => {
    if (mode === audioMode) return;
    setAudioMode(mode);
    setActiveServerIdx(0);
  }, [audioMode]);

  // Dynamic Adapting Audio Labels (e.g. KOREAN (OG), JAPANESE (OG), ENGLISH (OG) / HINDI / MULTI)
  const audioLabels = useMemo(() => {
    if (!drama) return { ogLabel: 'OG AUDIO', multiLabel: 'MULTI / HINDI' };

    const lang = (drama.originalLanguage || '').toLowerCase();
    const country = (drama.country || '').toLowerCase();
    const type = (drama.type || '').toLowerCase();
    const isHindi = Boolean(
      lang === 'hi' ||
      drama.isHindi ||
      country.includes('india') ||
      country.includes('bollywood')
    );

    let ogLabel = 'OG AUDIO';
    if (lang === 'ko' || country.includes('korea') || type.includes('k-drama')) {
      ogLabel = 'KOREAN (OG)';
    } else if (lang === 'ja' || country.includes('japan') || type.includes('j-drama')) {
      ogLabel = 'JAPANESE (OG)';
    } else if (lang === 'zh' || country.includes('china') || country.includes('taiwan') || type.includes('c-drama')) {
      ogLabel = 'CHINESE (OG)';
    } else if (lang === 'th' || country.includes('thai')) {
      ogLabel = 'THAI (OG)';
    } else if (lang === 'tr' || country.includes('turk')) {
      ogLabel = 'TURKISH (OG)';
    } else if (isHindi) {
      ogLabel = 'HINDI (OG)';
    } else if (lang === 'en' || country.includes('hollywood') || country.includes('usa') || country.includes('uk') || country.includes('english')) {
      ogLabel = 'ENGLISH (OG)';
    } else if (lang === 'es' || country.includes('spain')) {
      ogLabel = 'SPANISH (OG)';
    } else if (lang === 'fr' || country.includes('france')) {
      ogLabel = 'FRENCH (OG)';
    } else if (lang === 'de' || country.includes('german')) {
      ogLabel = 'GERMAN (OG)';
    }

    const multiLabel = isHindi ? 'ENG / MULTI' : 'HINDI / MULTI';

    return { ogLabel, multiLabel };
  }, [drama]);

  const currentEpIndex = drama?.episodes.findIndex(e => e.id === currentEpId) ?? -1;
  const currentEp = drama?.episodes[currentEpIndex];
  const currentServer = stream?.servers?.[activeServerIdx];
  const activeHlsUrl = currentServer?.type === 'hls' ? currentServer.url : undefined;
  const activeIframe = currentServer?.type === 'iframe' ? currentServer.url : (stream?.iframeUrl || currentEp?.embedUrl || currentEp?.url);

  const nextEp = currentEpIndex >= 0 && drama && currentEpIndex < drama.episodes.length - 1 ? drama.episodes[currentEpIndex + 1] : null;
  const prevEp = currentEpIndex > 0 ? drama?.episodes[currentEpIndex - 1] : null;

  const handleEpClick = useCallback((id: string) => {
    markEpPlayed(currentEpId);
    setCurrentEpId(id);
    setStream(null);
    if (typeof window !== 'undefined') {
      const ep = drama?.episodes.find(e => e.id === id);
      const url = new URL(window.location.href);
      url.searchParams.set('ep', ep ? String(ep.number) : id);
      window.history.replaceState({}, '', url.toString());
    }
  }, [drama, currentEpId, markEpPlayed]);


  const episodeChunks = useMemo(() => {
    if (!drama) return [];
    const eps = drama.episodes || [];
    const c = [];
    for (let i = 0; i < eps.length; i += chunkSize) c.push(eps.slice(i, i + chunkSize));
    return c;
  }, [drama, chunkSize]);

  useEffect(() => {
    if (!currentEpId || !drama) return;
    const idx = drama.episodes.findIndex(e => e.id === currentEpId);
    if (idx !== -1) setEpChunkIndex(Math.floor(idx / chunkSize));
  }, [currentEpId, drama]);

  if (isLoadingInfo) return <WatchPageSkeleton />;
  if (!drama) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center flex-col gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-black tracking-widest uppercase font-lemon">Failed to load content</h2>
        <p className="text-zinc-500 text-sm">Please try refreshing the page or exploring other titles.</p>
        <Link href="/cinema" className="mt-2 px-5 py-2 rounded-xl bg-cyan-500 text-black font-black text-xs uppercase tracking-wider">
          Return to Hub
        </Link>
      </div>
    );
  }

  const isMovie = Boolean(drama.isMovie || urlType === 'movie');
  const hasHindiAudio = Boolean(drama.isHindi || stream?.servers?.some(s => s.name.toLowerCase().includes('hindi')));

  return (
    <div className="min-h-screen bg-[#020617] text-gray-100 font-sans overflow-x-hidden relative selection:bg-cyan-500/30">
      <style jsx global>{`
        @keyframes audio-bar-1 { 0%, 100% { height: 3px; } 50% { height: 11px; } }
        @keyframes audio-bar-2 { 0%, 100% { height: 9px; } 50% { height: 3px; } }
        @keyframes audio-bar-3 { 0%, 100% { height: 5px; } 50% { height: 12px; } }
        @keyframes available-wave-1 { 0%, 100% { height: 2.5px; opacity: 0.45; } 50% { height: 7px; opacity: 1; } }
        @keyframes available-wave-2 { 0%, 100% { height: 7px; opacity: 1; } 50% { height: 2.5px; opacity: 0.45; } }
      `}</style>

      {/* Dim Mode Overlay */}
      <div 
        onClick={() => setDimMode(false)} 
        className={cn(
          "fixed inset-0 bg-black/95 transition-opacity duration-300 will-change-[opacity]",
          dimMode ? 'opacity-100 pointer-events-auto cursor-pointer z-[50]' : 'opacity-0 pointer-events-none z-[50]'
        )} 
      />

      <div className="w-full flex flex-col items-center relative z-10 px-3 sm:px-4 md:px-8 max-w-[1520px] mx-auto pt-2 pb-16">
        
        {/* ══════════════════════════════════════════════════════════════════════
            MODE 1: CINEMA MOVIE WATCH EXPERIENCE (When drama.isMovie is true)
           ══════════════════════════════════════════════════════════════════════ */}
        {isMovie ? (
          <div className="w-full flex flex-col xl:grid xl:grid-cols-12 gap-6 items-stretch">
            
            {/* Left 8-Column: Player + Cinema Controls Bar */}
            <div className="xl:col-span-8 w-full flex flex-col gap-3 order-1">
              
              {/* Player Stage (16:9 Aspect Ratio) */}
              <div 
                className={cn(
                  "w-full aspect-video bg-[#030712] rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative transition-all duration-300",
                  dimMode ? "z-[60] ring-2 ring-cyan-500/50 shadow-[0_0_60px_rgba(0,0,0,0.9)]" : "z-10"
                )}
                onWheel={(e) => {
                  window.scrollBy({ top: e.deltaY, behavior: 'instant' as any });
                }}
              >
                {isStreamLoading ? (
                  <LiquidPlayerSkeleton text="LOADING CINEMA STREAM..." />
                ) : audioMode === 'multi' && (!stream?.servers || stream.servers.length === 0) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 p-6 text-center select-none">
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
                      <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-white uppercase font-lemon tracking-wider mb-1">
                      Multi / Hindi Audio Unavailable
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-sm mb-4">
                      Genuine Hindi dubbing is not yet released for this title. You can watch with crystal clear audio in {audioLabels.ogLabel}.
                    </p>
                    <button
                      onClick={() => handleAudioModeChange('og')}
                      className="px-5 py-2 rounded-full bg-cyan-500 text-black font-black text-xs uppercase tracking-wider hover:bg-cyan-400 transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                    >
                      Switch to {audioLabels.ogLabel}
                    </button>
                  </div>
                ) : streamError ? (
                  <div className="w-full h-full flex items-center justify-center bg-black text-zinc-500">
                    <div className="flex flex-col items-center gap-3">
                      <X size={32} className="text-rose-500" />
                      <p className="text-sm font-bold text-white">{streamError}</p>
                    </div>
                  </div>
                ) : (
                  <DramaPlayer
                    key={`${currentEpId}-${activeServerIdx}-${streamKey}`}
                    ref={playerRef}
                    url={activeHlsUrl}
                    iframeUrl={activeIframe}
                    title={drama.title}
                    poster={drama.banner || drama.image}
                    autoPlay
                    onProgress={(s) => { progressRef.current = s.playedSeconds; }}
                    servers={stream?.servers || []}
                    activeServerIdx={activeServerIdx}
                    onServerSelect={(idx) => setActiveServerIdx(idx)}
                  />
                )}
              </div>

              {/* Movie Cinema Controls Bar */}
              <div className={cn("w-full bg-[#0c1322] border border-white/[0.12] rounded-[32px] px-5 py-3.5 flex flex-col gap-3 transition-all duration-300 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.05]", dimMode ? "z-[60] relative" : "relative z-10")}>
                
                {/* ROW 1: Cinema Edition, Badges & Reload */}
                <div className="flex w-full justify-between items-center gap-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-black text-[9px] uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                      Cinema Edition
                    </span>
                    <CountryBadge country={drama.country} type={drama.type} showFullname />
                    {drama.year && <span className="bg-white/10 text-zinc-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10">{drama.year}</span>}
                    {drama.runtime && <span className="bg-white/10 text-zinc-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10">{drama.runtime}</span>}
                    <span className="border border-white/20 text-zinc-300 text-[9px] font-bold px-2 py-0.5 rounded-full">4K Ultra HD</span>
                    {hasHindiAudio && (
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-black px-2 py-0.5 rounded-full text-[9px] font-black flex items-center shadow-sm">
                        Hindi Dub
                      </span>
                    )}
                    {drama.rating && (
                      <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star size={9} fill="currentColor" /> {drama.rating}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      onClick={() => {
                        setStreamKey(k => k + 1);
                        toast.info("Reloading stream player...");
                      }}
                      variant="ghost" 
                      size="icon" 
                      className="rounded-xl w-8 h-8 border border-white/[0.08] bg-[#141d30] text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400/30 transition-all atrax-bubbly-btn atrax-squish-tap shadow-sm"
                      title="Reload Player Stream"
                    >
                      <RefreshCw size={13} className={isStreamLoading ? "animate-spin text-cyan-400" : ""} />
                    </Button>

                    <Button 
                      onClick={() => setDimMode(v => !v)} 
                      variant="ghost" 
                      size="icon" 
                      className={cn("rounded-xl w-8 h-8 border transition-all atrax-bubbly-btn atrax-squish-tap shadow-sm", dimMode ? "text-yellow-400 bg-yellow-500/20 border-yellow-500/40" : "text-zinc-400 bg-[#141d30] border-white/[0.08] hover:text-white")}
                      title="Theater Cinema Mode"
                    >
                      <Lightbulb size={14} />
                    </Button>

                    {/* Audio Sources Mode Toggle (Dynamic Adapting Names) at VERY RIGHT CORNER */}
                    <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-full border border-white/[0.08] shrink-0">
                      <button
                        onClick={() => handleAudioModeChange('og')}
                        className={cn(
                          "px-2.5 h-7 rounded-full text-[9px] font-black uppercase tracking-wider transition-all",
                          audioMode === 'og'
                            ? "bg-cyan-500 text-black shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        )}
                        title="Original Language Audio"
                      >
                        {audioLabels.ogLabel}
                      </button>
                      <button
                        onClick={() => handleAudioModeChange('multi')}
                        className={cn(
                          "px-2.5 h-7 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1",
                          audioMode === 'multi'
                            ? "bg-emerald-500 text-black shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        )}
                        title="Multi-Audio & Dubbed"
                      >
                        <span>{audioLabels.multiLabel}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ROW 2: Title & Action Buttons */}
                <div className="flex w-full justify-between items-center gap-3 border-t border-white/[0.06] pt-2.5">
                  <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                    <h1 className="text-sm sm:text-base font-black text-white font-lemon truncate">
                      {drama.title}
                    </h1>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <WatchListButton 
                      animeId={drama.id} 
                      animeTitle={drama.title} 
                      animeImage={drama.image} 
                      mediaType="movie" 
                      totalEpisodes={1} 
                      type="Movie" 
                    />

                    <button 
                      onClick={handleCreateWatchRoom}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-white/[0.08] bg-[#141d30] text-zinc-300 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-400/40 text-[10px] font-black uppercase tracking-wider transition-all atrax-bubbly-btn atrax-squish-tap shrink-0 shadow-sm"
                      title="Create Watch Room"
                    >
                      <Users size={12} />
                      <span>Room</span>
                    </button>

                    <PostShareModal
                      mediaData={{
                        id: drama.id,
                        title: drama.title,
                        poster: drama.image,
                        synopsis: drama.synopsis,
                        type: 'Movie',
                        rating: drama.rating || '8.5',
                        totalEpisodes: 1,
                        episodeNumber: 1,
                        url: typeof window !== 'undefined' ? window.location.href : `/stream/${drama.id}?type=movie`
                      }}
                      trigger={
                        <button 
                          className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-white/[0.08] bg-[#141d30] text-zinc-300 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-400/40 text-[10px] font-black uppercase tracking-wider transition-all atrax-bubbly-btn atrax-squish-tap shrink-0 shadow-sm"
                          title="Share Movie"
                        >
                          <Share2 size={12} />
                          <span>Share</span>
                        </button>
                      }
                    />

                    {currentEpId && (
                      <Link 
                        href={`/download/drama/${slug}?ep=${currentEpId}`} 
                        className="flex items-center gap-1.5 px-3 h-8 rounded-full border border-white/[0.08] bg-[#141d30] text-zinc-300 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:border-cyan-400 hover:text-black transition-all atrax-bubbly-btn atrax-squish-tap shadow-sm"
                      >
                        <Download size={12} /> <span>Download</span>
                      </Link>
                    )}

                    {/* Server Dropdown at VERY RIGHT CORNER */}
                    {stream && stream.servers.length > 0 && (
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 uppercase transition-all whitespace-nowrap rounded-full px-3.5 shadow-sm">
                            <ServerIcon size={12} />
                            <span>{formatServerLabel(currentServer?.name)}</span>
                            <ChevronDown size={11} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0b101e] border border-white/[0.08] rounded-2xl shadow-xl z-50 min-w-[170px] p-2">
                          <ScrollArea className="h-auto max-h-[220px]">
                            <div className="flex flex-col gap-1">
                              {stream.servers.map((srv, idx) => (
                                <DropdownMenuItem 
                                  key={idx} 
                                  onClick={() => setActiveServerIdx(idx)} 
                                  className={cn(
                                    "cursor-pointer px-3 py-1.5 rounded-xl text-[9px] uppercase font-bold tracking-wider transition-all flex items-center justify-between",
                                    activeServerIdx === idx ? "bg-cyan-500 text-black font-black" : "text-zinc-300 hover:bg-white/5"
                                  )}
                                >
                                  <span>{formatServerLabel(srv.name)}</span>
                                  {activeServerIdx === idx && <Check size={11} />}
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </ScrollArea>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Right 4-Column: Cinema Lounge Sidebar (Up Next & Franchise Only) */}
            <div className="xl:col-span-4 w-full flex flex-col order-2 xl:max-h-[620px]">
              <MovieCinemaSidebar 
                drama={drama}
                related={drama.related}
                recommendations={drama.recommendations}
              />
            </div>

            {/* Bottom 12-Column: Movie Overview & Details Card with One-Click Trailer */}
            <div className="xl:col-span-12 w-full bg-[#0c1322] rounded-[32px] border border-white/[0.12] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.05] flex flex-col lg:flex-row gap-6 items-stretch order-3">
              <div className="shrink-0 w-36 sm:w-44 flex flex-col gap-2.5">
                <img 
                  src={drama.image || '/images/no-poster.png'} 
                  alt={drama.title} 
                  className="w-full aspect-[2/3] object-cover rounded-2xl border border-white/10 shadow-lg" 
                />
                {/* One-Click Watch Trailer Button Under Poster */}
                <button
                  onClick={() => setShowTrailerModal(true)}
                  className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95 border border-rose-400/30 group"
                  title="Watch official trailer"
                >
                  <Play size={12} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                  <span>Watch Trailer</span>
                </button>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <h2 className="text-2xl font-black text-white font-lemon leading-tight">
                  {drama.title}
                </h2>

                {drama.tagline && (
                  <p className="text-xs italic text-cyan-300/80 -mt-1 font-medium line-clamp-1">
                    &ldquo;{drama.tagline}&rdquo;
                  </p>
                )}

                <div className="flex flex-wrap gap-2 items-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <CountryBadge country={drama.country} type="Movie" showFullname />
                  {drama.year && <span className="bg-white/[0.05] border border-white/[0.08] px-2.5 py-0.5 rounded-full">{drama.year}</span>}
                  {drama.runtime && <span className="bg-white/[0.05] border border-white/[0.08] px-2.5 py-0.5 rounded-full">{drama.runtime}</span>}
                  <span className="bg-white/[0.05] border border-white/[0.08] px-2.5 py-0.5 rounded-full text-emerald-400">Movie</span>
                  {drama.rating && (
                    <span className="text-yellow-400 bg-yellow-500/15 border border-yellow-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> {drama.rating}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-medium line-clamp-4">
                  {drama.synopsis || "Immerse yourself into this high-definition cinema production with direct high-speed playback, multi-subtitles, and studio audio."}
                </p>

                {drama.genres && drama.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.06]">
                    {drama.genres.map((g) => (
                      <span key={g} className="text-[10px] bg-white/[0.04] text-zinc-300 px-2.5 py-0.5 rounded-lg border border-white/[0.06]">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side: Cinema Intel & Stream Telemetry */}
              <CinemaIntelPanel drama={drama} isMovie={true} />
            </div>

            {/* Dedicated Cast & Characters Block (Full 12-Column) */}
            <div className="xl:col-span-12 w-full order-4">
              <CastCharactersBlock characters={drama.characters} cast={drama.cast} />
            </div>

            {/* Dedicated Related Titles Block (Strict Mode - Disappears if empty) */}
            <RelatedTitlesBlock related={drama.related} className="xl:col-span-12 w-full order-5" />

            {/* "More Like This" Recommendations Carousel (Filtered to avoid duplicates) */}
            {filteredRecommendations.length > 0 && (
              <div className="xl:col-span-12 w-full flex flex-col gap-4 pt-2 order-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-[#0e1629]/90 border border-white/[0.08] text-cyan-400">
                    <Film size={18} />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider font-lemon">
                    More Like This
                  </h3>
                </div>

                <div className="flex gap-4 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
                  {filteredRecommendations.map(r => (
                    <div key={r.id} className="shrink-0 w-[140px] sm:w-[170px] md:w-[195px]">
                      <DCard item={r} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Movie Comments & Reviews */}
            <div className="xl:col-span-12 w-full pt-4 order-6">
              <ShadowComments 
                key={user?.id || 'guest'}
                episodeId={`drama-movie-${drama.id}`} 
                themeColor="stream"
              />
            </div>

          </div>
        ) : (

          /* ══════════════════════════════════════════════════════════════════════
              MODE 2: ANIMEPAGE EXACT WATCH LAYOUT (For Dramas & Web Series)
             ══════════════════════════════════════════════════════════════════════ */
          <div className="w-full flex flex-col xl:grid xl:grid-cols-12 gap-6 items-stretch">
            
            {/* Left 8-Column: Player + Desktop & Mobile Animewatch Controls Bar */}
            <div className="xl:col-span-8 w-full flex flex-col gap-3 order-1">
              
              {/* Player Stage */}
              <div 
                className={cn(
                  "w-full aspect-video bg-[#030712] rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative transition-all duration-300",
                  dimMode ? "z-[60] ring-2 ring-cyan-500/50 shadow-[0_0_60px_rgba(0,0,0,0.9)]" : "z-10"
                )}
                onWheel={(e) => {
                  window.scrollBy({ top: e.deltaY, behavior: 'instant' as any });
                }}
              >
                {isStreamLoading ? (
                  <LiquidPlayerSkeleton text="CONNECTING TO SECURE DRAMA STREAM..." />
                ) : audioMode === 'multi' && (!stream?.servers || stream.servers.length === 0) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 p-6 text-center select-none">
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
                      <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-white uppercase font-lemon tracking-wider mb-1">
                      Multi / Hindi Audio Unavailable
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-sm mb-4">
                      Genuine Hindi dubbing is not yet released for this episode. You can watch with crystal clear audio in {audioLabels.ogLabel}.
                    </p>
                    <button
                      onClick={() => handleAudioModeChange('og')}
                      className="px-5 py-2 rounded-full bg-cyan-500 text-black font-black text-xs uppercase tracking-wider hover:bg-cyan-400 transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                    >
                      Switch to {audioLabels.ogLabel}
                    </button>
                  </div>
                ) : streamError ? (
                  <div className="w-full h-full flex items-center justify-center bg-black text-zinc-500">
                    <div className="flex flex-col items-center gap-3">
                      <X size={32} className="text-rose-500" />
                      <p className="text-sm font-bold text-white">{streamError}</p>
                    </div>
                  </div>
                ) : (
                  <DramaPlayer
                    key={`${currentEpId}-${activeServerIdx}-${streamKey}`}
                    ref={playerRef}
                    url={activeHlsUrl}
                    iframeUrl={activeIframe}
                    title={currentEp?.title || drama.title}
                    poster={drama.banner || drama.image}
                    autoPlay
                    onProgress={(s) => { progressRef.current = s.playedSeconds; }}
                    onEnded={() => {
                      markEpPlayed(currentEpId);
                      if (isAutoNext && nextEp) handleEpClick(nextEp.id);
                    }}
                    episodes={drama.episodes}
                    currentEpId={currentEpId}
                    onEpisodeSelect={handleEpClick}
                    isAutoNext={isAutoNext}
                    servers={stream?.servers || []}
                    activeServerIdx={activeServerIdx}
                    onServerSelect={(idx) => setActiveServerIdx(idx)}
                  />
                )}
              </div>

              {/* Series & Drama Control Box (Desktop - 2 Rows) */}
              <div className={cn("hidden lg:flex w-full bg-[#0c1322] border border-white/[0.12] rounded-[32px] px-5 py-3.5 flex-col gap-3 transition-all duration-300 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.05]", dimMode ? "z-[60] relative" : "relative z-10")}>
                
                {/* ROW 1: Season Dropdown, Episode Navigation, Automations & Player Reload */}
                <div className="flex w-full justify-between items-center gap-3">
                  
                  {/* Left: Season + Prev Ep + Current Badge + Next Ep + Auto Next + Reload */}
                  <div className="flex items-center gap-2 flex-nowrap shrink-0">
                    {/* Season Switcher for multi-season TV series */}
                    {drama.seasons && drama.seasons.length > 1 && (
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1.5 px-3.5 h-8 rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 text-[10px] font-black uppercase tracking-wider hover:bg-cyan-500/20 transition-all whitespace-nowrap active:scale-95 shrink-0 shadow-sm">
                            <span>Season {activeSeason}</span>
                            <ChevronDown size={11} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-[#0b101e] border border-white/[0.08] rounded-2xl shadow-xl z-50 min-w-[150px] p-2">
                          <ScrollArea className="h-auto max-h-[220px]">
                            <div className="flex flex-col gap-1">
                              {drama.seasons.map((s) => (
                                <DropdownMenuItem 
                                  key={s.seasonNumber} 
                                  onClick={() => handleSeasonChange(s.seasonNumber)} 
                                  className={cn(
                                    "cursor-pointer px-3 py-1.5 rounded-xl text-[9px] uppercase font-bold tracking-wider transition-all flex items-center justify-between",
                                    activeSeason === s.seasonNumber ? "bg-cyan-500 text-black font-black" : "text-zinc-300 hover:bg-white/5"
                                  )}
                                >
                                  <span>{s.name || `Season ${s.seasonNumber}`}</span>
                                  {activeSeason === s.seasonNumber && <Check size={11} />}
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </ScrollArea>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    <button
                      disabled={!prevEp}
                      onClick={() => prevEp && handleEpClick(prevEp.id)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-full border text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap atrax-bubbly-btn atrax-squish-tap shadow-sm",
                        prevEp 
                          ? "bg-[#141d30] border-white/[0.10] text-zinc-300 hover:bg-cyan-500 hover:border-cyan-400 hover:text-black" 
                          : "opacity-20 border-white/5 text-zinc-600 cursor-not-allowed"
                      )}
                    >
                      <SkipBack size={12} /> <span>PREV EP</span>
                    </button>

                    <div className="flex items-center gap-1.5 px-3.5 h-8 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm">
                      <span>{`S${activeSeason} : EP ${currentEp?.number || 1}`}</span>
                    </div>

                    {nextEp ? (
                      <button
                        onClick={() => handleEpClick(nextEp.id)}
                        className="flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-full border border-white/[0.10] bg-[#141d30] text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-cyan-500 hover:border-cyan-400 hover:text-black whitespace-nowrap atrax-bubbly-btn atrax-squish-tap shadow-sm group"
                      >
                        <span>NEXT EP</span> <SkipForward size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-full border border-white/5 bg-white/5 text-zinc-600 text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-30 cursor-not-allowed"
                      >
                        <span>NEXT EP</span> <SkipForward size={12} />
                      </button>
                    )}

                    <button
                      onClick={() => setIsAutoNext(v => !v)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 px-3 h-8 rounded-full border text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap active:scale-95",
                        isAutoNext ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300" : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white"
                      )}
                      title="Auto Next Episode"
                    >
                      <StepForward size={12} className={cn(isAutoNext ? "text-cyan-400" : "text-zinc-500")} />
                      <span>AUTO NEXT: {isAutoNext ? 'ON' : 'OFF'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setStreamKey(k => k + 1);
                        toast.info("Reloading stream player...");
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-cyan-300 hover:border-cyan-400/30 text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap active:scale-95"
                      title="Reload stream player"
                    >
                      <RefreshCw size={11} className={isStreamLoading ? "animate-spin text-cyan-400" : ""} />
                      <span>RELOAD</span>
                    </button>
                  </div>

                  {/* Right: Theater Dim Mode & Audio Mode Toggle at VERY RIGHT CORNER */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => setDimMode(v => !v)}
                      variant="ghost"
                      size="icon"
                      className={cn("rounded-full w-8 h-8 transition-all active:scale-95 border", dimMode ? "text-yellow-400 bg-yellow-500/15 border-yellow-500/40" : "text-zinc-400 hover:text-white bg-white/[0.04] border-white/[0.08]")}
                      title="Theater Dim Mode"
                    >
                      <Lightbulb size={13} />
                    </Button>

                    {/* Audio Sources Mode Toggle (Dynamic Adapting Names) at VERY RIGHT CORNER */}
                    <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-full border border-white/[0.08] shrink-0">
                      <button
                        onClick={() => handleAudioModeChange('og')}
                        className={cn(
                          "px-2.5 h-7 rounded-full text-[9px] font-black uppercase tracking-wider transition-all",
                          audioMode === 'og'
                            ? "bg-cyan-500 text-black shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        )}
                        title="Original Language Audio"
                      >
                        {audioLabels.ogLabel}
                      </button>
                      <button
                        onClick={() => handleAudioModeChange('multi')}
                        className={cn(
                          "px-2.5 h-7 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1",
                          audioMode === 'multi'
                            ? "bg-emerald-500 text-black shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        )}
                        title="Multi-Audio & Dubbed"
                      >
                        <span>{audioLabels.multiLabel}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </button>
                    </div>
                  </div>

                </div>

                {/* ROW 2: Episode Title Marquee, Status, Server Switcher & Actions */}
                <div className="flex w-full justify-between items-center gap-3 border-t border-white/[0.06] pt-2.5">
                  <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden">
                    <div className="min-w-0 max-w-[280px] xl:max-w-[400px] flex items-center">
                      <MarqueeTitle text={currentEp ? (() => {
                        let t = (currentEp.title || '').trim();
                        while (/^(?:(?:episode|ep\.?)\s*\d+|\b\d+\b)\s*[:\-–—•.]*\s*/i.test(t)) {
                          t = t.replace(/^(?:(?:episode|ep\.?)\s*\d+|\b\d+\b)\s*[:\-–—•.]*\s*/i, '').trim();
                        }
                        t = t.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
                        return `S${activeSeason} : EP ${currentEp.number}${t ? ` — ${t}` : ''}`;
                      })() : drama.title} />
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-[10px] text-zinc-400 uppercase font-black bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
                      <Clock size={11} className="text-cyan-400" />
                      <span>{drama.status || 'Ongoing'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {currentEpId && (
                      <Link 
                        href={`/download/drama/${slug}?ep=${currentEpId}`} 
                        className="flex items-center gap-1.5 px-3 h-8 rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-300 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:border-cyan-400 hover:text-black transition-all active:scale-95"
                      >
                        <Download size={12} /> <span>Download</span>
                      </Link>
                    )}

                    <WatchListButton 
                      animeId={drama.id} 
                      animeTitle={drama.title} 
                      animeImage={drama.image} 
                      currentEp={currentEp?.number} 
                      mediaType="drama" 
                      totalEpisodes={drama.episodes?.length || 1} 
                      type="Drama" 
                    />

                    <button 
                      onClick={handleCreateWatchRoom}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-400/40 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shrink-0"
                      title="Create Watch Room"
                    >
                      <Users size={12} />
                      <span>Room</span>
                    </button>

                    <PostShareModal
                      mediaData={{
                        id: drama.id,
                        title: drama.title,
                        poster: drama.image,
                        synopsis: drama.synopsis,
                        type: isMovie ? 'Movie' : 'Drama',
                        rating: drama.rating || '8.2',
                        totalEpisodes: drama.episodes?.length || 0,
                        episodeNumber: currentEp?.number || 1,
                        url: typeof window !== 'undefined' ? window.location.href : `/stream/${drama.id}?ep=${currentEp?.number || 1}`
                      }}
                      trigger={
                        <button 
                          className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-400/40 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shrink-0"
                          title="Share Episode"
                        >
                          <Share2 size={12} />
                          <span>Share</span>
                        </button>
                      }
                    />

                    {/* Server Switcher Dropdown at VERY RIGHT CORNER */}
                    {stream && stream.servers.length > 0 && (
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 gap-2 text-[10px] font-black text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 uppercase transition-all whitespace-nowrap rounded-full px-3.5 shadow-sm shrink-0">
                            <ServerIcon size={12} />
                            <span>{formatServerLabel(currentServer?.name)}</span>
                            <ChevronDown size={11} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0b101e] border border-white/[0.08] rounded-2xl shadow-xl z-50 min-w-[170px] p-2">
                          <ScrollArea className="h-auto max-h-[220px]">
                            <div className="flex flex-col gap-1">
                              {stream.servers.map((srv, idx) => (
                                <DropdownMenuItem 
                                  key={idx} 
                                  onClick={() => setActiveServerIdx(idx)} 
                                  className={cn(
                                    "cursor-pointer px-3 py-1.5 rounded-xl text-[9px] uppercase font-bold tracking-wider transition-all flex items-center justify-between",
                                    activeServerIdx === idx ? "bg-cyan-500 text-black font-black" : "text-zinc-300 hover:bg-white/5"
                                  )}
                                >
                                  <span>{formatServerLabel(srv.name)}</span>
                                  {activeServerIdx === idx && <Check size={11} />}
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </ScrollArea>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

              </div>

              {/* Series & Drama Control Bar (Mobile) */}
              <div className={cn("flex lg:hidden w-full bg-[#0c1322] border border-white/[0.12] rounded-[28px] p-3.5 flex-col gap-3 transition-all duration-300 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.05]", dimMode ? "z-[60] relative" : "relative z-10")}>
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                  <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    <span className="text-[10px] text-cyan-400 font-black uppercase shrink-0">NOW:</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-300 truncate">
                      {currentEp ? `S${activeSeason}: EP ${currentEp.number} — ${currentEp.title}` : drama.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setStreamKey(k => k + 1);
                        toast.info("Reloading stream player...");
                      }}
                      className="p-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-cyan-400 active:scale-95"
                      title="Reload Player Stream"
                    >
                      <RefreshCw size={12} className={isStreamLoading ? "animate-spin text-cyan-400" : ""} />
                    </button>
                    <Button onClick={() => setDimMode(v => !v)} variant="ghost" size="icon" className={cn("rounded-lg w-7 h-7 border shrink-0", dimMode ? "text-yellow-400 bg-yellow-500/20 border-yellow-500/40" : "text-zinc-400 bg-white/[0.04] border-white/[0.08]")}>
                      <Lightbulb size={12} />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full">
                  {drama.seasons && drama.seasons.length > 1 && (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 px-2.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 text-[10px] font-black uppercase flex items-center gap-1 shrink-0">
                          <span>S{activeSeason}</span>
                          <ChevronDown size={10} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-[#0b101e] border border-white/[0.08] rounded-xl shadow-xl z-50 min-w-[130px] p-1.5">
                        <ScrollArea className="h-auto max-h-[180px]">
                          <div className="flex flex-col gap-1">
                            {drama.seasons.map((s) => (
                              <DropdownMenuItem 
                                key={s.seasonNumber} 
                                onClick={() => handleSeasonChange(s.seasonNumber)} 
                                className={cn(
                                  "cursor-pointer px-2.5 py-1.5 rounded-lg text-[9px] uppercase font-bold tracking-wider transition-all flex items-center justify-between",
                                  activeSeason === s.seasonNumber ? "bg-cyan-500 text-black font-black" : "text-zinc-300 hover:bg-white/5"
                                )}
                              >
                                <span>Season {s.seasonNumber}</span>
                                {activeSeason === s.seasonNumber && <Check size={10} />}
                              </DropdownMenuItem>
                            ))}
                          </div>
                        </ScrollArea>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <button disabled={!prevEp} onClick={() => prevEp && handleEpClick(prevEp.id)} className="flex-1 bg-[#141d30] h-8 rounded-xl border border-white/[0.10] flex items-center justify-center gap-1 text-zinc-300 text-[10px] font-black uppercase hover:text-white atrax-bubbly-btn atrax-squish-tap shadow-sm disabled:opacity-20">
                    <SkipBack size={12} /> PREV
                  </button>
                  <button disabled={!nextEp} onClick={() => nextEp && handleEpClick(nextEp.id)} className="flex-1 bg-[#141d30] h-8 rounded-xl border border-white/[0.10] flex items-center justify-center gap-1 text-zinc-300 text-[10px] font-black uppercase hover:text-white atrax-bubbly-btn atrax-squish-tap shadow-sm disabled:opacity-20">
                    NEXT <SkipForward size={12} />
                  </button>
                  <button 
                    onClick={() => setIsAutoNext(v => !v)} 
                    className={cn(
                      "px-2.5 h-8 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 atrax-bubbly-btn atrax-squish-tap shadow-sm flex items-center gap-1",
                      isAutoNext ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-300" : "bg-[#141d30] border-white/[0.10] text-zinc-400"
                    )}
                  >
                    <StepForward size={11} />
                    <span>AUTO: {isAutoNext ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                <div className="flex w-full items-center justify-between gap-1.5 border-t border-white/[0.06] pt-2 overflow-x-auto no-scrollbar">
                  {stream && stream.servers.length > 0 && (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 px-2.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 text-[10px] font-black uppercase flex items-center gap-1 shrink-0 atrax-bubbly-btn atrax-squish-tap shadow-sm">
                          <ServerIcon size={11} />
                          <span className="truncate max-w-[90px]">{formatServerLabel(currentServer?.name)}</span>
                          <ChevronDown size={10} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-[#0c1322] border border-white/[0.12] rounded-2xl shadow-xl z-50 min-w-[150px] p-1.5">
                        <ScrollArea className="h-auto max-h-[190px]">
                          <div className="flex flex-col gap-1">
                            {stream.servers.map((srv, idx) => (
                              <DropdownMenuItem 
                                key={idx} 
                                onClick={() => setActiveServerIdx(idx)} 
                                className={cn(
                                  "cursor-pointer px-2.5 py-1.5 rounded-xl text-[9px] uppercase font-bold tracking-wider transition-all flex items-center justify-between",
                                  activeServerIdx === idx ? "bg-cyan-500 text-black font-black" : "text-zinc-300 hover:bg-white/5"
                                )}
                              >
                                <span>{formatServerLabel(srv.name)}</span>
                                {activeServerIdx === idx && <Check size={10} />}
                              </DropdownMenuItem>
                            ))}
                          </div>
                        </ScrollArea>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <WatchListButton animeId={drama.id} animeTitle={drama.title} animeImage={drama.image} currentEp={currentEp?.number} mediaType="drama" totalEpisodes={drama.episodes?.length || 1} type="Drama" />
                  <button onClick={handleCreateWatchRoom} className="flex items-center gap-1 h-8 px-2.5 rounded-xl border border-white/[0.10] bg-[#141d30] text-zinc-300 text-[10px] font-black uppercase shrink-0 atrax-bubbly-btn atrax-squish-tap shadow-sm"><Users size={11} /><span>Room</span></button>
                  <PostShareModal mediaData={{ id: drama.id, title: drama.title, poster: drama.image, synopsis: drama.synopsis, type: isMovie ? 'Movie' : 'Drama', rating: drama.rating || '8.2', totalEpisodes: drama.episodes?.length || 0, episodeNumber: currentEp?.number || 1, url: typeof window !== 'undefined' ? window.location.href : `/stream/${drama.id}` }} trigger={<button className="flex items-center gap-1 h-8 px-2.5 rounded-xl border border-white/[0.10] bg-[#141d30] text-zinc-300 text-[10px] font-black uppercase shrink-0 atrax-bubbly-btn atrax-squish-tap shadow-sm"><Share2 size={11} /><span>Share</span></button>} />
                  {currentEpId && <Link href={`/download/drama/${slug}?ep=${currentEpId}`} className="flex items-center gap-1 px-2.5 h-8 rounded-xl border border-white/[0.10] bg-[#141d30] text-zinc-300 text-[10px] font-black uppercase shrink-0 atrax-bubbly-btn atrax-squish-tap shadow-sm"><Download size={11} /><span>DL</span></Link>}
                </div>
              </div>

            </div>

            {/* Right 4-Column: Exact Animewatch Episode Navigation Sidebar */}
            <div className="xl:col-span-4 w-full h-[460px] sm:h-[520px] xl:h-auto xl:relative xl:self-stretch order-2">
              <div className="w-full h-full xl:absolute xl:inset-0 bg-[#0c1322] rounded-[32px] border border-white/[0.12] overflow-hidden flex flex-col shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.05] relative z-20">
              
              {/* Episodes Section Header */}
              <div className="p-4 bg-[#0e1628] border-b border-white/[0.08] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-black text-white flex items-center gap-2 uppercase text-xs font-lemon tracking-widest">
                    <Layers size={16} className="text-cyan-400" /> 
                    <span>Episodes</span>
                  </h3>
                  <Badge className="bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-black text-[10px] px-2.5 h-5 rounded-full shadow-sm">
                    {drama.episodes.length}
                  </Badge>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/[0.06]">
                  <button 
                    onClick={() => setEpViewMode('compact')} 
                    className={cn("p-1.5 rounded-lg transition-all", epViewMode === 'compact' ? "bg-cyan-500 text-black shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                    title="Compact Dots"
                  >
                    <Grid size={13} />
                  </button>
                  <button 
                    onClick={() => setEpViewMode('grid')} 
                    className={cn("p-1.5 rounded-lg transition-all", epViewMode === 'grid' ? "bg-cyan-500 text-black shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                    title="Grid Tiles"
                  >
                    <LayoutGrid size={13} />
                  </button>
                  <button 
                    onClick={() => setEpViewMode('list')} 
                    className={cn("p-1.5 rounded-lg transition-all", epViewMode === 'list' ? "bg-cyan-500 text-black shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                    title="Detailed List"
                  >
                    <List size={13} />
                  </button>
                </div>
              </div>

              {/* Season Picker Bar for Series */}
              {drama.seasons && drama.seasons.length > 1 && (
                <div className="w-full border-b border-white/[0.06] bg-black/30 py-2.5 px-3 flex items-center justify-between gap-2 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Season</span>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider hover:bg-cyan-500/20 transition-all active:scale-95">
                        <span>Season {activeSeason}</span>
                        <ChevronDown size={11} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0b101e] border border-white/[0.08] rounded-xl shadow-xl z-50 min-w-[150px] p-1.5">
                      <ScrollArea className="h-auto max-h-[220px]">
                        <div className="flex flex-col gap-1">
                          {drama.seasons.map((s) => (
                            <DropdownMenuItem
                              key={s.seasonNumber}
                              onClick={() => handleSeasonChange(s.seasonNumber)}
                              className={cn(
                                "cursor-pointer px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all flex items-center justify-between",
                                activeSeason === s.seasonNumber ? "bg-cyan-500 text-black font-black" : "text-zinc-300 hover:bg-white/5"
                              )}
                            >
                              <span>{s.name || `Season ${s.seasonNumber}`}</span>
                              <span className="text-[9px] opacity-60 ml-2">{s.episodeCount} eps</span>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* Episode Chunk Switcher (> 50 episodes) */}
              {episodeChunks.length > 1 && (
                <div className="w-full border-b border-white/[0.06] bg-black/20 py-2.5 px-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {episodeChunks.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setEpChunkIndex(idx)}
                        className={cn(
                          "flex-shrink-0 px-3 py-1 text-[10px] font-black rounded-lg transition-all border uppercase tracking-wider active:scale-95",
                          epChunkIndex === idx 
                            ? "bg-cyan-400 text-black border-cyan-300 shadow-sm" 
                            : "bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white"
                        )}
                      >
                        {idx * chunkSize + 1}–{Math.min((idx + 1) * chunkSize, drama.episodes.length)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Episode Buttons Container */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 custom-scrollbar overflow-x-hidden">
                <div
                  ref={epContainerRef}
                  className={cn(
                    "grid",
                    epViewMode === 'grid' ? 'grid-cols-5 gap-2' : epViewMode === 'compact' ? 'grid-cols-10 gap-1.5' : 'grid-cols-1 gap-1.5'
                  )}
                >
                  {episodeChunks[epChunkIndex]?.map((ep) => (
                    <EpisodeButton
                      key={ep.id}
                      ep={ep}
                      isCurrent={ep.id === currentEpId}
                      isPlayed={playedEpIds.has(ep.id) && ep.id !== currentEpId}
                      viewMode={epViewMode}
                      onClick={handleEpClick}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>

            {/* Bottom 12-Column: Overview & Details Card */}
            <div className="xl:col-span-12 w-full bg-[#0c1322] rounded-[32px] border border-white/[0.12] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.05] flex flex-col lg:flex-row gap-6 items-stretch order-3">
              <div className="shrink-0 w-36 sm:w-44 flex flex-col gap-2.5">
                <img 
                  src={drama.image || '/images/no-poster.png'} 
                  alt={drama.title} 
                  className="w-full aspect-[2/3] object-cover rounded-2xl border border-white/10 shadow-lg" 
                />
                {/* One-Click Watch Trailer Button Under Poster */}
                <button
                  onClick={() => setShowTrailerModal(true)}
                  className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95 border border-rose-400/30 group"
                  title="Watch official trailer"
                >
                  <Play size={12} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                  <span>Watch Trailer</span>
                </button>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <h2 className="text-2xl font-black text-white font-lemon leading-tight">
                  {drama.title}
                </h2>

                {drama.tagline && (
                  <p className="text-xs italic text-cyan-300/80 -mt-1 font-medium line-clamp-1">
                    &ldquo;{drama.tagline}&rdquo;
                  </p>
                )}

                <div className="flex flex-wrap gap-2 items-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <CountryBadge country={drama.country} type={drama.type} showFullname />
                  {drama.year && <span className="bg-white/[0.05] border border-white/[0.08] px-2.5 py-0.5 rounded-full">{drama.year}</span>}
                  {drama.status && (
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full border", 
                      drama.status.toLowerCase().includes('ongoing') ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "bg-white/[0.05] border-white/[0.08]"
                    )}>
                      {drama.status}
                    </span>
                  )}
                  {drama.rating && (
                    <span className="text-yellow-400 bg-yellow-500/15 border border-yellow-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> {drama.rating}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-medium line-clamp-4">
                  {drama.synopsis || "Immerse yourself into this Asian drama production with direct high-speed playback, multi-subtitles, and studio audio."}
                </p>

                {drama.cast && drama.cast.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider mr-1">Cast:</span>
                    {drama.cast.slice(0, 6).map((c: any) => {
                      const name = typeof c === 'string' ? c : (c.name || 'Cast');
                      const key = typeof c === 'string' ? c : (c.id || c.name);
                      return (
                        <span key={key} className="text-[10px] bg-white/[0.04] text-zinc-300 px-2.5 py-0.5 rounded-lg border border-white/[0.06]">
                          {name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Side: Cinema Intel & Stream Telemetry */}
              <CinemaIntelPanel drama={drama} isMovie={false} />
            </div>

            {/* Cast & Characters Block (Full 12-Column) */}
            <div className="xl:col-span-12 w-full order-3">
              <CastCharactersBlock characters={drama.characters} cast={drama.cast} />
            </div>

            {/* Dedicated Related Titles Block (Strict Mode - Disappears if empty) */}
            <RelatedTitlesBlock related={drama.related} className="xl:col-span-12 w-full order-4" />

            {/* Recommended Dramas (Bottom 12-Column, Filtered to avoid duplicates) */}
            {filteredRecommendations.length > 0 && (
              <div className="xl:col-span-12 w-full flex flex-col gap-3 pt-4 order-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-[#0e1629]/90 border border-white/[0.08] text-cyan-400">
                    <Flame size={18} />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-lemon">
                    More Like This
                  </h3>
                </div>

                <div className="flex gap-4 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
                  {filteredRecommendations.map(r => (
                    <div key={r.id} className="shrink-0 w-[140px] sm:w-[170px] md:w-[195px]">
                      <DCard item={r} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Comments Section (Bottom 12-Column) */}
            <div className="xl:col-span-12 w-full pt-4 order-6">
              <ShadowComments 
                key={user?.id || 'guest'}
                episodeId={currentEpId || `drama-${drama.id}-ep-${currentEp?.number || 1}`} 
                themeColor="stream"
              />
            </div>

          </div>
        )}

      </div>

      <TrailerModal 
        isOpen={showTrailerModal} 
        onClose={() => setShowTrailerModal(false)} 
        trailer={drama?.trailer} 
        title={drama?.title} 
        mediaId={drama?.id}
      />

      <Footer />
    </div>
  );
}

export default function DramaWatchPage() {
  return (
    <Suspense fallback={<WatchPageSkeleton />}>
      <DramaWatchContent />
    </Suspense>
  );
}
