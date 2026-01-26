"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Play, Calendar, MonitorPlay, 
  Captions, Mic, Info, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimeAPI_V2 } from '@/lib/api';
import { cn } from '@/lib/utils';

// --- TYPES ---
interface UnifiedAnimeData {
  id: string;
  title?: string | { userPreferred?: string; english?: string; romaji?: string; native?: string };
  name?: string;
  image?: string; 
  poster?: string;
  cover?: string;
  type?: string;
  isAdult?: boolean;
  totalEpisodes?: number;
  sub?: number;
  dub?: number;
  episode?: number; 
  episodes?: { sub: number; dub: number } | number;
  releaseDate?: string;
  status?: string;
  rating?: string;
  source?: 'universal' | 'consumet' | 'hindi';
  isHindi?: boolean; 
}

interface QTipData {
  jname?: string;
  rating?: string;
  quality?: string;
  description?: string;
  genres?: string[];
  studios?: string;
  duration?: string;
  synonyms?: string;
  season?: string;
  isAdult?: boolean;
}

interface AnimeCardProps {
  anime: UnifiedAnimeData | any; 
  progress?: number;
  isHindi?: boolean;
}

// --- ANIMATION VARIANTS ---
const qtipVariants = {
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
  exit: { opacity: 0, scale: 0.95, filter: "blur(4px)", transition: { duration: 0.15 } }
};

const mobileOverlayVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
  exit: { y: "100%", opacity: 0, transition: { duration: 0.2 } }
};

export default function AnimeCard({ anime, progress = 0, isHindi = false }: AnimeCardProps) {
  const router = useRouter(); 
  const cardRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [isHovered, setIsHovered] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const [popupPosition, setPopupPosition] = useState<'left' | 'right'>('right');
  
  const [qtip, setQtip] = useState<QTipData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- 1. MEMOIZED NORMALIZATION ---
  const normalized = useMemo(() => {
    const displayImage = anime.poster || anime.image || anime.cover || "/images/placeholder-no-img.jpg";
    
    let displayTitle = "Unknown Title";
    if (typeof anime.title === 'object') {
        displayTitle = anime.title.userPreferred || anime.title.english || anime.title.romaji || anime.title.native || "Unknown";
    } else if (anime.title) displayTitle = anime.title;
    else if (anime.name) displayTitle = anime.name;

    const subCount = typeof anime.episodes === 'object' ? anime.episodes?.sub : anime.sub || null;
    const dubCount = typeof anime.episodes === 'object' ? anime.episodes?.dub : anime.dub || null;
    
    const currentEp = anime.episode || subCount || dubCount || 0;
    const totalEp = anime.totalEpisodes || (typeof anime.episodes === 'number' ? anime.episodes : null);

    const rawRating = anime.rating || "";
    const isAdult = anime.isAdult === true || ["Rx", "RX", "18+", "Hentai", "R+"].some(t => rawRating.toUpperCase().includes(t));

    const targetRoute = (isHindi || anime.isHindi || anime.source === 'hindi') 
        ? `/watch2/${anime.id}` 
        : `/watch/${anime.id}`;

    return { 
        displayImage, displayTitle, 
        subCount, dubCount, 
        currentEp, totalEp, 
        isAdult, 
        targetRoute, 
        type: anime.type || "TV" 
    };
  }, [anime, isHindi]);

  // --- HELPER: AGE TAG ---
  const AgeTag = ({ adult, rating }: { adult: boolean, rating?: string }) => {
    if (adult) {
      return (
        <span className="h-5 px-2 flex items-center justify-center rounded-full bg-red-600/90 border border-red-500/50 text-[9px] font-black text-white shadow-lg shadow-red-900/40">
          18+
        </span>
      );
    }
    if (rating && rating !== "?") {
        const clean = rating.replace("PG-", "PG ").replace("R-", "").replace("+", "").trim();
        return (
            <span className="h-5 px-2 flex items-center justify-center rounded-full bg-black/60 border border-white/10 text-[9px] font-black text-white backdrop-blur-md">
                {clean}
            </span>
        );
    }
    return null;
  };

  // --- HANDLERS ---
  const handleMouseEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setPopupPosition((window.innerWidth - rect.right) < 320 ? 'left' : 'right');
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // 600ms grace period so user can move mouse to the tooltip
    closeTimeout.current = setTimeout(() => setIsHovered(false), 600);
  };

  const handleMobileInfoToggle = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setShowMobileInfo(prev => !prev);
    if (!showMobileInfo && !qtip) fetchDataNow();
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    router.push(normalized.targetRoute);
  };

  const fetchDataNow = async () => {
    if (qtip || loading || isHindi) return;
    setLoading(true);
    try {
      const data: any = await AnimeAPI_V2.getAnimeInfo(anime.id);         
      if (data?.anime) {
        const info = data.anime.info;
        const more = data.anime.moreInfo;
        const statsRating = info.stats.rating || "";
        const isAdult = more.genres?.includes('Hentai') || ["Rx", "RX", "18+", "R+"].some(t => statsRating.toUpperCase().includes(t));

        setQtip({
          jname: info.jname || more.japanese,
          rating: info.stats.rating,
          quality: info.stats.quality,
          description: info.description,
          genres: more.genres,
          studios: more.studios,
          duration: info.stats.duration,
          synonyms: more.synonyms,
          season: more.premiered,
          isAdult: isAdult
        });
      }
    } catch (e) { /* silent fail */ }
    setLoading(false);
  };

  useEffect(() => {
    if (isHovered && !qtip && !loading) fetchTimeout.current = setTimeout(fetchDataNow, 400);
    return () => { if (fetchTimeout.current) clearTimeout(fetchTimeout.current); };
  }, [isHovered, qtip, loading]);

  return (
    <div 
      ref={cardRef}
      className="relative w-full aspect-[2/3] group z-0 hover:z-50 touch-manipulation"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-full h-full relative rounded-[24px] overflow-hidden bg-[#0a0a0a] ring-1 ring-white/10 shadow-lg transition-all duration-500 hover:shadow-2xl hover:shadow-red-900/20 hover:ring-red-500/30">
        
        {/* --- MAIN CLICKABLE LINK --- */}
        <Link href={normalized.targetRoute} className="block w-full h-full relative">
          
          {/* IMAGE */}
          <div className="absolute inset-0 overflow-hidden rounded-[24px]">
            <img
              src={normalized.displayImage}
              alt={normalized.displayTitle}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transform-gpu transition-transform duration-700 ease-out group-hover:scale-110 will-change-transform"
            />
            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* TOP LEFT: Type Badge (Pill) */}
          <div className="absolute top-3 left-3 z-20">
             <div className="h-5 px-2.5 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-black text-white uppercase tracking-wider shadow-sm">
               {normalized.type}
             </div>
          </div>

          {/* TOP RIGHT: Mobile Info + Age Tag */}
          <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
             {/* Mobile 'i' Button */}
             <button 
                onClick={handleMobileInfoToggle}
                className="md:hidden w-6 h-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/20"
             >
               <Info size={12} />
             </button>
             
             {/* Age Tag (Pill) */}
             <AgeTag adult={normalized.isAdult} rating={anime.rating} />
          </div>

          {/* CENTER: Play Button (Desktop) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 scale-75 group-hover:scale-100 hidden md:flex">
             <div className="relative group/play">
               <div className="absolute inset-0 rounded-full bg-red-600 blur-xl opacity-50 group-hover/play:opacity-80 animate-pulse" />
               <div className="relative w-14 h-14 rounded-full bg-red-600 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-transform duration-200 group-hover/play:scale-110">
                 <Play className="w-6 h-6 text-white fill-white ml-1" />
               </div>
             </div>
          </div>

          {/* BOTTOM METADATA SECTION */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col gap-2">
            
            {/* Title (On Top) */}
            <h3 className="text-sm font-black text-white leading-tight line-clamp-2 drop-shadow-md group-hover:text-red-400 transition-colors duration-300">
               {normalized.displayTitle}
            </h3>

            {/* Metadata Row (Bottom Left/Right) */}
            <div className="flex items-center justify-between gap-1">
                
                {/* Left: Episodes [Current / Total] (Pill) */}
                <div className="flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/10 h-6 px-2.5 rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white tracking-wide uppercase">
                        EP {normalized.currentEp} <span className="text-white/50 mx-0.5">/</span> {normalized.totalEp || "?"}
                    </span>
                </div>

                {/* Right: Unified Sub/Dub (Pill) - Matched Continue Adventure Style */}
                {(normalized.subCount || normalized.dubCount) && (
                  <div className="flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-sm min-w-0">
                    {normalized.subCount && (
                      <div className="flex items-center gap-0.5 text-[9px] font-bold text-white">
                        <Captions size={9} className="text-zinc-300" /> 
                        <span>{normalized.subCount}</span>
                      </div>
                    )}
                    {normalized.subCount && normalized.dubCount && (
                      <div className="w-px h-2.5 bg-white/20" />
                    )}
                    {normalized.dubCount && (
                      <div className="flex items-center gap-0.5 text-[9px] font-bold text-white">
                        <Mic size={9} className="text-zinc-300" /> 
                        <span>{normalized.dubCount}</span>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Progress Bar (Optional) */}
            {progress > 0 && (
               <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mt-0.5">
                 <div style={{ width: `${progress}%` }} className="h-full bg-red-600 shadow-[0_0_10px_red]" />
               </div>
            )}
          </div>
        </Link>

        {/* --- MOBILE INFO OVERLAY (Mini QTip) --- */}
        <AnimatePresence>
          {showMobileInfo && (
            <motion.div
              variants={mobileOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl p-4 flex flex-col gap-3 md:hidden"
            >
               {/* Close Button */}
               <button 
                 onClick={handleMobileInfoToggle}
                 className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white active:bg-red-600 transition-colors z-50"
               >
                 <X size={16} />
               </button>

               {/* Mobile Content */}
               <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
                  <h4 className="text-white font-black text-lg leading-tight mb-1 pr-8">{normalized.displayTitle}</h4>
                  <p className="text-red-400 text-xs italic mb-3">{qtip?.jname || "..."}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3 items-center">
                     {/* 18+ Tag or Rating (No Star) */}
                     <AgeTag adult={normalized.isAdult} rating={qtip?.rating} />
                     
                     <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                        <Calendar size={10} /> {anime.releaseDate?.split('-')[0] || "?"}
                     </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed opacity-90 line-clamp-[8]">
                     {loading ? "Loading details..." : (qtip?.description || "No description available.")}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(qtip?.genres || []).slice(0, 4).map(g => (
                      <span key={g} className="text-[9px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">{g}</span>
                    ))}
                  </div>
               </div>

               {/* Mobile CTA */}
               <button 
                 onClick={(e) => { handlePlay(e); }}
                 className="w-full py-3 bg-red-600 rounded-full font-black text-white text-sm uppercase tracking-widest shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 active:scale-95 transition-transform"
               >
                 <Play size={16} fill="currentColor" /> Watch Now
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- DESKTOP Q-TIP POPUP (HOVER) --- */}
      <AnimatePresence>
        {isHovered && !isHindi && !showMobileInfo && (
          <motion.div
             custom={popupPosition}
             variants={qtipVariants}
             initial="hidden"
             animate="visible"
             exit="exit"
             // Interactive Hover Logic: Keep open when hovering the popup
             onMouseEnter={handleMouseEnter} 
             onMouseLeave={handleMouseLeave}
             className={`
               hidden md:block absolute top-0 w-[280px] lg:w-[320px] z-50 
               ${popupPosition === 'right' ? 'left-[105%]' : 'right-[105%]'}
             `}
          >
             <div className="bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
                
                {/* Header - Clickable Title */}
                <div className="mb-3">
                   <Link href={normalized.targetRoute}>
                     <h4 className="text-white font-black text-base lg:text-lg leading-tight mb-1 cursor-pointer hover:text-red-500 transition-colors">
                       {normalized.displayTitle}
                     </h4>
                   </Link>
                   <p className="text-red-500/80 text-xs font-bold italic line-clamp-1">{qtip?.jname}</p>
                </div>

                {/* Meta Row */}
                <div className="flex items-center gap-3 mb-3 text-xs font-bold">
                   <div className="flex items-center">
                      {/* Age Tag (Red 18+ or Normal) */}
                      <AgeTag adult={qtip?.isAdult || normalized.isAdult} rating={qtip?.rating} />
                   </div>
                   <div className="flex items-center gap-1 text-zinc-400">
                      <MonitorPlay size={12} />
                      <span>{qtip?.quality || "HD"}</span>
                   </div>
                   <div className="ml-auto text-zinc-500 font-mono text-[10px] uppercase">
                      {qtip?.season || "ANIME"}
                   </div>
                </div>

                {/* Description */}
                <div className="mb-4 min-h-[60px]">
                   {loading && !qtip ? (
                      <div className="space-y-1.5 animate-pulse">
                         <div className="h-2 bg-white/10 rounded w-full"/>
                         <div className="h-2 bg-white/10 rounded w-5/6"/>
                         <div className="h-2 bg-white/10 rounded w-4/6"/>
                      </div>
                   ) : (
                      <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-4">
                         {qtip?.description || "Description unavailable."}
                      </p>
                   )}
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                   {(qtip?.genres || []).slice(0, 3).map(g => (
                      <span key={g} className="text-[9px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                         {g}
                      </span>
                   ))}
                </div>

                {/* Glow Effect */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/10 blur-[60px] rounded-full pointer-events-none" />
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}