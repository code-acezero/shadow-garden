"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Play, Calendar, MonitorPlay, 
  Mic, Info, X, ListVideo, Star
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { hpi } from '@/lib/hpi'; 
import { cn } from '@/lib/utils';

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
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const [popupPosition, setPopupPosition] = useState<'left' | 'right'>('right');
  
  const [qtip, setQtip] = useState<QTipData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- 1. DATA NORMALIZATION ---
  const normalized = useMemo(() => {
    const cleanPoster = anime.poster ? anime.poster.replace(/([^:]\/)\/+/g, "$1") : "/images/placeholder-no-img.jpg";
    const title = anime.title || "Unknown Title";
    const type = anime.type || "HINDI";
    const targetRoute = anime.targetRoute || `/watch/${anime.id}`; 
    const epCount = anime.episode || "?";

    return { poster: cleanPoster, title, type, targetRoute, epCount, dataId: anime.dataId };
  }, [anime]);

  // --- 2. FETCH DATA (HPI Version) ---
  const fetchDataNow = async () => {
    if (qtip || loading || !normalized.dataId) return;
    
    setLoading(true);
    try {
      // Direct numeric ID fetch from new scraper
      const res = await hpi.desidub.getQtip(normalized.dataId); 

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
    } catch (e) { 
        console.error("HPI Qtip retrieval failed:", e);
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

  const handleMobileInfoToggle = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setShowMobileInfo(prev => !prev);
    if (!showMobileInfo && !qtip) fetchDataNow();
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
    return <span className="h-5 px-2 flex items-center justify-center rounded-full bg-primary-600/20 border border-primary-500/30 text-[9px] font-black text-primary-400 backdrop-blur-md uppercase tracking-tighter">{rating}</span>;
  };

  return (
    <div 
      ref={cardRef}
      className="relative w-full aspect-[2/3] group z-0 hover:z-50 touch-manipulation"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
              onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder-no-img.jpg"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
          </div>

          {/* BADGES & INFO */}
          <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3 z-20">
             <div className="h-4 md:h-5 px-2 flex items-center justify-center rounded-full bg-primary-600/90 backdrop-blur-md border border-primary-500/50 text-[8px] md:text-[9px] font-black text-white uppercase tracking-wider shadow-lg shadow-primary-900/20">
               {normalized.type}
             </div>
          </div>

          <div className="absolute top-2.5 right-2.5 md:top-3 md:right-3 z-40">
             <button onClick={handleMobileInfoToggle} className="md:hidden w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/20">
               <Info size={10} className="md:w-3 md:h-3" />
             </button>
          </div>

          {/* PLAY BUTTON */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 scale-75 group-hover:scale-100 hidden md:flex">
             <div className="relative group/play">
               <div className="absolute inset-0 rounded-full bg-primary-600 blur-xl opacity-50 group-hover/play:opacity-80 animate-pulse" />
               <div className="relative w-14 h-14 rounded-full bg-primary-600 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-transform duration-200 group-hover/play:scale-110">
                 <Play className="w-6 h-6 text-white fill-white ml-1" />
               </div>
             </div>
          </div>

          {/* METADATA */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5 md:p-3 z-20 flex flex-col gap-1.5 md:gap-2">
            <h3 className="text-xs md:text-sm font-black text-white leading-tight line-clamp-2 drop-shadow-md group-hover:text-primary-400 transition-colors duration-300">
               {normalized.title}
            </h3>
            
            <div className="flex items-center justify-between gap-1.5">
                <div className="flex-shrink-0 flex items-center gap-1 h-5 md:h-6 px-1.5 md:px-2.5 rounded-md md:rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-sm min-w-0">
                    <div className="flex items-center gap-0.5 text-[8px] md:text-[9px] font-bold text-white uppercase">
                        <Mic size={8} className="text-zinc-300 md:w-3 md:h-3" /> 
                        <span>HINDI</span>
                    </div>
                </div>

                <div className="flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/10 h-5 md:h-6 px-1.5 md:px-2.5 rounded-md md:rounded-full flex items-center justify-center gap-1">
                    <ListVideo size={10} className="text-zinc-300 md:w-3 md:h-3" />
                    <span className="text-[8px] md:text-[9px] font-bold text-white tracking-wide uppercase">
                       EP {normalized.epCount}
                    </span>
                </div>
            </div>
          </div>
        </Link>

        {/* MOBILE INFO OVERLAY */}
        <AnimatePresence>
          {showMobileInfo && (
            <motion.div 
              variants={mobileOverlayVariants} 
              initial="hidden" 
              animate="visible" 
              exit="exit" 
              className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl p-4 flex flex-col gap-3 md:hidden"
            >
               <button onClick={handleMobileInfoToggle} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white active:bg-primary-600 transition-colors z-50"><X size={16} /></button>
               <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
                  <h4 className="text-white font-black text-lg leading-tight mb-1 pr-8">{normalized.title}</h4>
                  <p className="text-primary-400 text-xs font-bold mb-3">{qtip?.jname || "Loading..."}</p>
                  <div className="flex flex-wrap gap-2 mb-3 items-center">
                      <div className="px-2 py-0.5 bg-primary-600/10 border border-primary-500/20 text-primary-400 text-[10px] rounded-md font-black flex items-center gap-1"><Star size={10} className="fill-primary-500" /> {qtip?.rating || "-"}</div>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400"><Calendar size={10} /> {qtip?.aired || "?"}</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed opacity-90 line-clamp-[8]">{loading ? "Retrieving Hindi Intel..." : (qtip?.description || "No description available.")}</p>
               </div>
               <button onClick={(e) => { handlePlay(e); }} className="w-full py-3 bg-primary-600 rounded-full font-black text-white text-sm uppercase tracking-widest shadow-lg shadow-primary-900/40 flex items-center justify-center gap-2 active:scale-95 transition-transform"><Play size={16} fill="currentColor" /> Watch Now</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DESKTOP Q-TIP POPUP */}
      <AnimatePresence>
        {isHovered && !showMobileInfo && (
          <motion.div
             custom={popupPosition}
             variants={qtipVariants}
             initial="hidden"
             animate="visible"
             exit="exit"
             className={cn(
               "hidden md:block absolute top-0 w-[280px] lg:w-[320px] z-50",
               popupPosition === 'right' ? 'left-[105%]' : 'right-[105%]'
             )}
          >
             <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 border-t-primary-500/30 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative overflow-hidden">
                <div className="mb-3">
                   <Link href={normalized.targetRoute}><h4 className="text-white font-black text-base lg:text-lg leading-tight mb-1 cursor-pointer hover:text-primary-400 transition-colors line-clamp-2">{normalized.title}</h4></Link>
                   <p className="text-primary-500/80 text-xs font-bold italic line-clamp-1">{loading ? "Synchronizing..." : (qtip?.jname || "Hindi Archives")}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="px-2 py-0.5 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] rounded-md font-black uppercase flex items-center gap-1">
                        <Star size={10} className="fill-primary-500" /> {qtip?.rating || "-"}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}