"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link'; 
import { useRouter } from 'next/navigation'; 
import { 
  Play, Clock, Star, Calendar, 
  MonitorPlay, Mic, Captions, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AnimeAPI_V2 } from '@/lib/api';
import { cn } from '@/lib/utils';

// --- UNIFIED INTERFACE ---
// Handles Universal, Consumet, and Hindi data shapes
interface UnifiedAnimeData {
  id: string;
  title?: string | { userPreferred?: string; english?: string; romaji?: string; native?: string };
  name?: string; // Consumet fallback
  image?: string; 
  poster?: string;
  cover?: string; // Hindi fallback
  type?: string;
  isAdult?: boolean;
  totalEpisodes?: number;
  sub?: number;
  dub?: number;
  episodes?: { sub: number; dub: number } | number;
  releaseDate?: string;
  status?: string;
  rating?: string;
  // Source Flags
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
  isHindi?: boolean; // Manual override
}

export default function AnimeCard({ anime, progress = 0, isHindi = false }: AnimeCardProps) {
  const router = useRouter(); 
  
  // --- STATE ---
  const [isHovered, setIsHovered] = useState(false);
  const [popupPosition, setPopupPosition] = useState<'left' | 'right'>('right');
  const cardRef = useRef<HTMLDivElement>(null); 
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  // QTip Data
  const [qtip, setQtip] = useState<QTipData | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- 1. DATA NORMALIZATION (The "Consumet" & "Hindi" Fix) ---
  const normalized = React.useMemo(() => {
    // Image: Check Poster (Univ) -> Image (Consumet) -> Cover (Hindi)
    const displayImage = anime.poster || anime.image || anime.cover || "/images/placeholder-no-img.jpg";
    
    // Title: Handle Objects (Universal/Consumet) vs Strings
    let displayTitle = "Unknown Title";
    if (typeof anime.title === 'object') {
        displayTitle = anime.title.userPreferred || anime.title.english || anime.title.romaji || anime.title.native || "Unknown";
    } else if (anime.title) {
        displayTitle = anime.title;
    } else if (anime.name) {
        displayTitle = anime.name;
    }

    // Type
    const displayType = anime.type || "TV";
    
    // Episodes: Handle nested objects vs flat numbers
    const subCount = typeof anime.episodes === 'object' ? anime.episodes?.sub : anime.sub || null;
    const dubCount = typeof anime.episodes === 'object' ? anime.episodes?.dub : anime.dub || null;
    const totalCount = anime.totalEpisodes || (typeof anime.episodes === 'number' ? anime.episodes : null);

    // 18+ Check
    const isAdult = anime.isAdult === true || anime.rating?.includes('18') || anime.rating?.includes('Rx');

    // Route Logic
    const targetRoute = (isHindi || anime.isHindi || anime.source === 'hindi') 
        ? `/watch2/${anime.id}` 
        : `/watch/${anime.id}`;

    return { displayImage, displayTitle, displayType, subCount, dubCount, totalCount, isAdult, targetRoute };
  }, [anime, isHindi]);

  // --- 2. SMART HOVER HANDLING (The "Instant Hide" Fix) ---
  const handleMouseEnter = () => {
    // Cancel any pending close action
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    
    // Position Check
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceOnRight = window.innerWidth - rect.right;
      setPopupPosition(spaceOnRight < 350 ? 'left' : 'right');
    }
    
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Grace period: Wait 300ms before closing. 
    // If user enters tooltip in this time, we cancel this timeout.
    closeTimeout.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  // --- 3. FETCH DETAILED INFO ---
  useEffect(() => {
    // Only fetch if hovered and not already loaded/loading
    if (isHovered && !qtip && !loading && !isHindi) { // Don't fetch QTip for Hindi yet (no API)
      fetchTimeout.current = setTimeout(async () => {
        setLoading(true);
        try {
          // Note: We use the Universal V2 API for QTip data as it has the richest metadata
          // Even if the card source is Consumet, we try to fetch details using the ID
         const data: any = await AnimeAPI_V2.getAnimeInfo(anime.id);          
         if (data?.anime) {
            const info = data.anime.info;
            const more = data.anime.moreInfo;
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
              isAdult: more.genres?.includes('Hentai') || info.stats.rating?.includes('18')
            });
          }
        } catch (err) {
           // If V2 fails, we just don't show the extra tooltip info
        } finally {
          setLoading(false);
        }
      }, 400); 
    }
    return () => { if (fetchTimeout.current) clearTimeout(fetchTimeout.current); };
  }, [isHovered, anime.id, qtip, loading, isHindi]);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    router.push(normalized.targetRoute);
  };

  // --- ANIMATIONS ---
  const qtipVariants = {
    hidden: { opacity: 0, x: popupPosition === 'right' ? -10 : 10, scale: 0.95, filter: "blur(4px)" },
    visible: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 25 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
  };

  return (
    <div 
        ref={cardRef}
        className="relative w-full h-full group perspective-1000 z-0 hover:z-50"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
    >
      <Link href={normalized.targetRoute} className="block h-full">
        <motion.div variants={{ hover: { y: -8, transition: { type: "spring", stiffness: 300 } } }} whileHover="hover" className="h-full">
          <Card className="relative overflow-hidden h-full bg-[#0a0a0a] border-white/5 rounded-xl transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.25)] group-hover:ring-1 group-hover:ring-red-500/50">
            
            {/* --- POSTER IMAGE --- */}
            <div className="aspect-[2/3] w-full relative overflow-hidden">
              <img
                src={normalized.displayImage}
                alt={normalized.displayTitle}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:brightness-50"
              />
              
              {/* BADGES: Type & 18+ */}
              <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
                <Badge className="bg-black/60 backdrop-blur-md border border-white/10 text-white font-bold text-[10px] px-2 uppercase shadow-sm">
                  {normalized.displayType}
                </Badge>
                {normalized.isAdult && (
                  <Badge variant="destructive" className="font-black text-[9px] px-1.5 h-5 shadow-red-900/50 shadow-sm animate-pulse">
                    18+
                  </Badge>
                )}
              </div>

              {/* BADGES: Episodes */}
              <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                 {normalized.subCount && (
                   <Badge className="bg-green-600/90 text-white font-extrabold text-[10px] px-1.5 flex gap-1 items-center shadow-sm border-0">
                     <Captions className="w-3 h-3" /> {normalized.subCount}
                   </Badge>
                 )}
                 {normalized.dubCount && (
                   <Badge className="bg-purple-600/90 text-white font-extrabold text-[10px] px-1.5 flex gap-1 items-center shadow-sm border-0">
                     <Mic className="w-3 h-3" /> {normalized.dubCount}
                   </Badge>
                 )}
                 {!normalized.subCount && !normalized.dubCount && normalized.totalCount && (
                   <Badge className="bg-zinc-700/90 text-white font-extrabold text-[10px] px-1.5 flex gap-1 items-center shadow-sm">
                     <Layers className="w-3 h-3" /> {normalized.totalCount}
                   </Badge>
                 )}
              </div>

              {/* CENTER: Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                <Button onClick={handlePlay} size="icon" className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.6)] border-2 border-white/20 scale-75 group-hover:scale-100 transition-transform duration-300">
                  <Play className="w-5 h-5 md:w-6 md:h-6 fill-white ml-1" />
                </Button>
              </div>

              {/* BOTTOM: Progress Bar */}
              {progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 z-30">
                  <div style={{ width: `${progress}%` }} className="h-full bg-red-600 shadow-[0_0_10px_red]" />
                </div>
              )}
            </div>

            {/* --- FOOTER INFO --- */}
            <div className="p-3 bg-[#0a0a0a] border-t border-white/5 relative z-20 h-full flex flex-col justify-between">
              <h3 className="font-bold text-sm text-gray-100 line-clamp-1 group-hover:text-red-500 transition-colors" title={normalized.displayTitle}>
                {normalized.displayTitle}
              </h3>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded text-[10px]">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    {anime.releaseDate?.split('-')[0] || "N/A"}
                  </span>
                </div>
                <span className={cn(
                  "uppercase text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded",
                  anime.status?.toLowerCase().includes('airing') ? "text-green-400 bg-green-900/20" : "text-gray-500 bg-white/5"
                )}>
                   {anime.status || "ANIME"}
                </span>
              </div>
            </div>

          </Card>
        </motion.div>
      </Link>

      {/* --- SMART TOOLTIP (Q-TIP) --- */}
      {/* Hidden on Touch/Mobile Devices to prevent blocking UI */}
      <AnimatePresence>
        {isHovered && !isHindi && (
          <motion.div
            variants={qtipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onMouseEnter={handleMouseEnter} // Keep open when hovering the tooltip itself
            onMouseLeave={handleMouseLeave} // Close with delay when leaving tooltip
            className={`
              hidden lg:block absolute top-0 w-[300px] z-50
              ${popupPosition === 'right' ? 'left-[102%]' : 'right-[102%]'} 
            `}
          >
            <div className="bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-5 text-left overflow-hidden relative">
              
              {/* Header - Clickable Title */}
              <div className="mb-3 group/tooltip-title">
                <Link href={normalized.targetRoute}>
                    <h4 className="text-white font-black text-lg leading-tight mb-1 line-clamp-2 cursor-pointer group-hover/tooltip-title:text-red-500 transition-colors">
                    {normalized.displayTitle}
                    </h4>
                </Link>
                <p className="text-red-400/80 text-xs font-medium italic line-clamp-1">
                  {qtip?.jname || qtip?.synonyms || "..."}
                </p>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-bold text-gray-300">
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10 px-1.5 py-0 gap-1 rounded-sm">
                  <Star className="w-3 h-3 fill-yellow-500" /> {qtip?.rating || "?"}
                </Badge>
                
                {qtip?.quality && (
                  <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10 px-1.5 py-0 rounded-sm">
                    {qtip.quality}
                  </Badge>
                )}

                {normalized.isAdult && (
                   <Badge variant="destructive" className="px-1.5 py-0 h-5 text-[9px]">18+</Badge>
                )}

                <div className="flex items-center gap-1 ml-auto text-gray-500 font-medium">
                  <Clock className="w-3 h-3" />
                  {qtip?.duration || "?"}
                </div>
              </div>

              {/* Description */}
              <div className="mb-4 relative min-h-[60px]">
                 {loading && !qtip ? (
                   <div className="space-y-2 animate-pulse">
                     <div className="h-2 bg-white/10 rounded w-full"/>
                     <div className="h-2 bg-white/10 rounded w-full"/>
                     <div className="h-2 bg-white/10 rounded w-2/3"/>
                   </div>
                 ) : (
                   <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-4">
                     {qtip?.description || "Accessing Shadow Garden Archives..."}
                   </p>
                 )}
              </div>

              <Separator className="bg-white/10 mb-3" />

              {/* Tags & Footer */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                   {(qtip?.genres || []).slice(0, 3).map((g) => (
                     <span key={g} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                       {g}
                     </span>
                   ))}
                </div>
                
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[10px] text-red-400/80 flex items-center gap-1 truncate max-w-[60%]">
                    <MonitorPlay className="w-3 h-3 shrink-0" />
                    <span className="truncate">{qtip?.studios || "Studio Unknown"}</span>
                  </div>
                  
                  <div className="text-[9px] font-mono text-gray-600 uppercase">
                     {qtip?.season || "ARCHIVED"}
                  </div>
                </div>
              </div>

              {/* Decorative Glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/10 blur-[60px] rounded-full pointer-events-none" />

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}