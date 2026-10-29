"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Play, Calendar, MonitorPlay, 
  Mic, ListVideo, Star, Info
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { hpi } from '@/lib/hpi'; 
import { cn, getSafeImageUrl, slugifyTitle } from '@/lib/utils';

// --- TYPES ---
interface QTipData {
  jname?: string;
  rating?: string;
  quality?: string;
  description?: string;
  genres?: string[];
  status?: string;
  aired?: string;
  type?: string;
}

// --- ANIMATION VARIANTS (Fixed Types) ---
const qtipVariants: Variants = {
  hidden: (direction: 'left' | 'right') => ({ 
    opacity: 0, 
    x: direction === 'right' ? -15 : 15, 
    scale: 0.95,
    filter: "blur(8px)"
  }),
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 300, damping: 20 } 
  },
  exit: { 
      opacity: 0, 
      scale: 0.95, 
      transition: { duration: 0.1 } 
  }
};

const mobileOverlayVariants: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
  exit: { y: "100%", opacity: 0, transition: { duration: 0.2 } }
};

export default function HindiAnimeCard({ anime }: { anime: any }) {
  const router = useRouter(); 
  const cardRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [isHovered, setIsHovered] = useState(false);
  const [popupPosition, setPopupPosition] = useState<'left' | 'right'>('right');
  
  const [qtip, setQtip] = useState<QTipData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- 1. DATA NORMALIZATION ---
  const normalized = useMemo(() => {
    const rawPoster = anime.poster || anime.image;
    const cleanPoster = getSafeImageUrl(rawPoster ? rawPoster.replace(/([^:]\/)\/+/g, "$1") : "/images/no-poster.png");
    const title = anime.title || "Unknown Title";
    const releasedEp = (() => {
      if (anime.dub !== undefined && anime.dub !== null && anime.dub !== '') return anime.dub;
      if (typeof anime.episodes === 'object' && anime.episodes !== null) {
        if (anime.episodes.dub !== undefined && anime.episodes.dub !== null && anime.episodes.dub !== 0 && anime.episodes.dub !== '') return anime.episodes.dub;
      }
      if (anime.episode !== undefined && anime.episode !== null && anime.episode !== '') return anime.episode;
      if (anime.latestEpisode !== undefined && anime.latestEpisode !== null && anime.latestEpisode !== '') return anime.latestEpisode;
      if (typeof anime.episodes === 'object' && anime.episodes !== null) {
        const ep = anime.episodes.sub;
        if (ep !== undefined && ep !== null && ep !== 0 && ep !== '') return ep;
      }
      if (anime.sub !== undefined && anime.sub !== null && anime.sub !== '') return anime.sub;
      return null;
    })();

    // Estimated total episodes set to premier (never fall back to released episodes)
    const totalEp = (() => {
      if (anime.totalEpisodes !== undefined && anime.totalEpisodes !== null && anime.totalEpisodes !== '') return anime.totalEpisodes;
      if (anime.total_episodes !== undefined && anime.total_episodes !== null && anime.total_episodes !== '') return anime.total_episodes;
      if (typeof anime.episodes === 'object' && anime.episodes !== null) {
        const ep = anime.episodes.total ?? anime.episodes.eps;
        if (ep !== undefined && ep !== null && ep !== 0 && ep !== '') return ep;
      }
      if (typeof anime.episodes === 'number' && anime.episodes > 0) return anime.episodes;
      if (anime.total !== undefined && anime.total !== null && anime.total !== '') return anime.total;
      if ((anime.type || '').toLowerCase() === 'movie') return 1;
      return null;
    })();

    const type = anime.type || anime.format || 'TV';
    const cleanTitle = (title || "").replace(/\(Hindi Dubbed\)/i, '').replace(/\(Hindi Dub\)/i, '').replace(/\[Hindi Dub\]/i, '').trim();
    const titleSlug = slugifyTitle(cleanTitle || title);
    const routeId = (titleSlug && !String(anime.id).includes('-')) ? `${anime.id}-${titleSlug}` : anime.id;

    let targetRoute = anime.targetRoute;
    if (!targetRoute) {
      targetRoute = `/watch/${routeId}?audio=hi`;
      if (anime.episodeId || anime.episode) {
        targetRoute = `/watch/${routeId}?ep=${anime.episodeId || anime.episode}&audio=hi`;
      }
    } else if (targetRoute.startsWith('/hindi-watch/')) {
      targetRoute = targetRoute.replace('/hindi-watch/', '/watch/');
      if (!targetRoute.includes('audio=')) {
        targetRoute += `${targetRoute.includes('?') ? '&' : '?'}audio=hi`;
      }
    }

    const dataId = anime.dataId || anime.id || anime.slug || '';
    const releaseYear = anime.year || (anime.releaseDate ? String(anime.releaseDate).split('-')[0] : '');
    return { poster: cleanPoster, title, type, targetRoute, releasedEp, totalEp, dataId, releaseYear };
  }, [anime]);

  // --- 2. FETCH DATA (HPI Version) ---
  const fetchDataNow = async () => {
    if (qtip || loading || !normalized.dataId) return;
    
    setLoading(true);
    try {
      // Direct numeric ID fetch from new scraper
      const res = await hpi.hindi.getQtip(normalized.dataId); 

      setQtip({
        jname: res.japaneseTitle, 
        rating: res.rating, 
        quality: res.quality || "HD",
        description: res.description,
        genres: res.genres,
        status: res.status,
        aired: res.aired,
        type: res.type
      });
    } catch (e: any) { 
        console.warn("HPI Qtip retrieval notice:", e?.message || e);
        setQtip({
            jname: normalized.title,
            description: "Tactical intel unavailable for this sector.",
            genres: ["Hindi"]
        });
    } finally {
        setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleMouseEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      setPopupPosition(spaceRight < 340 ? 'left' : 'right');
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => setIsHovered(false), 100); 
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    router.push(normalized.targetRoute);
  };

  useEffect(() => {
    if (isHovered && !qtip && !loading) {
        fetchTimeout.current = setTimeout(fetchDataNow, 200); 
    }
    return () => { if (fetchTimeout.current) clearTimeout(fetchTimeout.current); };
  }, [isHovered, qtip, loading]);

  const AgeTag = ({ rating }: { rating?: string }) => {
    if (!rating || rating === "?" || rating === "-") return null;
    const isAdult = /18|rx|r\+|nc-17/i.test(rating);
    return (
      <span className={cn(
        "h-5 px-1.5 sm:px-2 flex items-center justify-center rounded-[6px] border text-[8.5px] sm:text-[9px] font-mono font-bold shadow-sm backdrop-blur-md uppercase tracking-wider select-none shrink-0",
        isAdult 
          ? "bg-rose-600/90 border-rose-500/50 text-white shadow-[0_0_10px_rgba(225,29,72,0.35)]" 
          : "bg-black/65 border-white/10 text-zinc-300"
      )}>
        {rating}
      </span>
    );
  };

  return (
    <HoverCard
      openDelay={140}
      closeDelay={100}
      onOpenChange={(open) => {
        setIsHovered(open);
        if (open && !qtip) fetchDataNow();
      }}
    >
      <HoverCardTrigger asChild>
        <div 
          ref={cardRef}
          className="relative w-full aspect-[2/3] group z-0 hover:z-50 touch-manipulation cursor-pointer"
        >
          <div className="w-full h-full relative rounded-[20px] md:rounded-[24px] overflow-hidden bg-[#0a0a0a] ring-1 ring-white/10 shadow-lg transition-all duration-500 hover:shadow-2xl hover:shadow-primary-900/20 hover:ring-primary-500/30">
        
        <Link href={normalized.targetRoute} className="block w-full h-full relative">
          
          {/* IMAGE */}
          <div className="absolute inset-0 overflow-hidden rounded-[20px] md:rounded-[24px]">
            <img
              src={normalized.poster}
              alt={normalized.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transform-gpu transition-transform duration-700 ease-out group-hover:scale-110 will-change-transform"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src.startsWith('/api/proxy')) {
                  img.src = '/images/no-poster.png';
                } else if (img.src.startsWith('http')) {
                  img.src = `/api/proxy?url=${encodeURIComponent(img.src)}`;
                } else {
                  img.src = '/images/no-poster.png';
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent opacity-95 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent opacity-40 pointer-events-none" />
          </div>

          {/* Top-Left: Media Format Badge */}
          <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3 z-20 pointer-events-none">
            <span className="h-5 px-1.5 sm:px-2 flex items-center justify-center rounded-[6px] bg-black/65 border border-white/10 text-white text-[8.5px] md:text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
              {(anime.type || anime.format || 'TV').toUpperCase().replace(/_/g, ' ')}
            </span>
          </div>

          {/* Top-Right: Clean Rating & Info Button (Miruro Clean Realignment) */}
          <div className="absolute top-2.5 right-2.5 md:top-3 md:right-3 z-30 flex items-center gap-1.5 pointer-events-auto">
            {anime.score && Number(anime.score) > 0 && (
              <span className="h-[22px] px-2.5 flex items-center justify-center gap-1.5 rounded-[6px] bg-black/80 border border-[#2e51a2]/40 text-white font-mono backdrop-blur-md shadow-sm select-none pointer-events-none">
                <span className="text-[#4e85ff] font-black text-[11px] sm:text-[11.5px] tracking-wider">MAL</span>
                <span className="font-bold text-zinc-100 text-[11px] sm:text-[11.5px]">{Number(anime.score).toFixed(1)}</span>
              </span>
            )}
            <AgeTag rating={qtip?.rating || anime.rating || anime.ageRating} />
          </div>

          {/* PLAY BUTTON */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 scale-75 group-hover:scale-100 hidden md:flex pointer-events-none">
             <div className="relative group/play">
               <div className="absolute inset-0 rounded-full bg-primary-600 blur-xl opacity-40 group-hover/play:opacity-70 transition-opacity" />
               <div className="relative w-12 h-12 rounded-full bg-primary-600/95 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-[0_0_24px_rgba(220,38,38,0.55)] transition-transform duration-200 group-hover/play:scale-105">
                 <Play className="w-5 h-5 text-white fill-white ml-0.5" />
               </div>
             </div>
          </div>

          {/* METADATA (Miruro Clean Minimal) */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 z-20 flex flex-col gap-1.5 justify-end pointer-events-none">
            <h3 className="text-xs sm:text-[13px] font-bold text-white leading-snug line-clamp-2 drop-shadow-md group-hover:text-primary-400 transition-colors duration-200">
               {normalized.title}
            </h3>
            
            <div className="flex items-center justify-between gap-1 w-full overflow-hidden text-[9px]">
                {/* Left: Unboxed HINDI with last released episode number */}
                <div className="inline-flex items-center gap-1 font-mono font-bold text-amber-300 text-[9px] uppercase tracking-wide shrink-0">
                    <Mic size={9.5} className="text-amber-400 shrink-0" /> 
                    <span>HINDI</span>
                    {normalized.releasedEp ? (
                      <span className="text-zinc-200 ml-0.5">EP {normalized.releasedEp}</span>
                    ) : null}
                </div>

                {/* Right: Estimated Total Episodes to Premier */}
                <div className="flex items-center gap-1 text-[9px] font-mono font-medium text-zinc-300 shrink-0">
                    <ListVideo size={9.5} className="text-zinc-400 shrink-0" />
                    <span>{(normalized.totalEp || (qtip as any)?.totalEpisodes) ? `${normalized.totalEp || (qtip as any)?.totalEpisodes} EPS` : (normalized.releaseYear || 'ANIME')}</span>
                </div>
            </div>
          </div>
        </Link>

        </div>
      </div>
      </HoverCardTrigger>

      {/* DESKTOP Q-TIP POPUP */}
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={14}
        avoidCollisions={true}
        className="hidden md:block w-[280px] lg:w-[320px] p-0 bg-transparent border-0 shadow-none outline-none z-[9999]"
      >
        <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 border-t-primary-500/30 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative overflow-hidden">
          <div className="mb-3">
             <Link href={normalized.targetRoute}><h4 className="text-white font-black text-base lg:text-lg leading-tight mb-1 cursor-pointer hover:text-primary-400 transition-colors line-clamp-2">{normalized.title}</h4></Link>
             <p className="text-primary-500/80 text-xs font-bold italic line-clamp-1">{loading ? "Synchronizing..." : (qtip?.jname || "Hindi Archives")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 font-mono select-none">
                  <span className="text-[#4e85ff] text-[11px] font-black tracking-wider uppercase">MAL</span>
                  <span className="text-zinc-100 font-bold text-[12px]">{qtip?.rating || anime.score || "-"}</span>
              </div>
              <div className="px-2 py-0.5 bg-white/5 border border-white/10 text-zinc-300 text-[9px] rounded-md font-bold uppercase tracking-wider">
                  {loading ? "..." : (qtip?.type || "TV")}
              </div>
              <div className="px-2 py-0.5 bg-white/5 border border-white/10 text-zinc-300 text-[9px] rounded-md font-bold uppercase tracking-wider">
                  {loading ? "..." : (qtip?.quality || "HD")}
              </div>
          </div>

          <div className="mb-4 min-h-[60px]">
             {loading || !qtip ? (
                <div className="space-y-1.5 animate-pulse"><div className="h-2 bg-white/10 rounded w-full"/><div className="h-2 bg-white/10 rounded w-5/6"/><div className="h-2 bg-white/10 rounded w-4/6"/><p className="text-[10px] text-zinc-500 pt-2 italic">Accessing Archives...</p></div>
             ) : ( <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-5 font-medium">{qtip?.description}</p> )}
          </div>

          <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                  <Calendar size={12} className="text-zinc-600" /> 
                  <span className="uppercase tracking-wide">{loading ? "Loading..." : (qtip?.aired || "Unknown")}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                  <Info size={12} className="text-zinc-600" /> 
                  <span className="line-clamp-1 text-zinc-400">{loading ? "..." : (qtip?.status || "Archive")}</span>
              </div>
          </div>
          
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-600/10 blur-[60px] rounded-full pointer-events-none" />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}