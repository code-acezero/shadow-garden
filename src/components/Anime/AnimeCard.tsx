"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link'; 
import { useRouter } from 'next/navigation'; 
import { 
  Play, Clock, Star, Calendar, 
  MonitorPlay, Mic, Captions, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// ✅ Import Safe API
import { AnimeAPI_V2 } from '@/lib/api';

// --- INTERFACES ---
interface BaseAnimeData {
  id: string;
  title: string;
  image: string; 
  poster?: string;
  type?: string;
  totalEpisodes?: number;
  sub?: number;
  dub?: number;
  episodes?: { sub: number; dub: number } | number;
  releaseDate?: string;
  status?: string;
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
}

interface AnimeCardProps {
  anime: BaseAnimeData | any; 
  progress?: number;
}

export default function AnimeCard({ anime, progress = 0 }: AnimeCardProps) {
  const router = useRouter(); 
  
  // State for Hover & Position Calculation
  const [isHovered, setIsHovered] = useState(false);
  const [popupPosition, setPopupPosition] = useState<'left' | 'right'>('right');
  const cardRef = useRef<HTMLDivElement>(null); // Ref to measure position

  // QTip Data State
  const [qtip, setQtip] = useState<QTipData | null>(null);
  const [loading, setLoading] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  // Normalize Data
  const displayImage = anime.poster || anime.image;
  const displayTitle = anime.title || anime.name || "Unknown";
  const displayType = anime.type || "TV";
  const subCount = typeof anime.episodes === 'object' ? anime.episodes?.sub : anime.sub || anime.totalEpisodes || null;
  const dubCount = typeof anime.episodes === 'object' ? anime.episodes?.dub : anime.dub || null;
  const hasDub = dubCount && dubCount > 0;

  // --- 1. SMART POSITION CHECK ---
  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const spaceOnRight = screenWidth - rect.right;
      
      // If less than 350px space on right, flip to left
      if (spaceOnRight < 350) {
        setPopupPosition('left');
      } else {
        setPopupPosition('right');
      }
    }
    setIsHovered(true);
  };

  // --- 2. FETCH DATA (V2 API) ---
  useEffect(() => {
    if (isHovered && !qtip && !loading) {
      hoverTimeout.current = setTimeout(async () => {
        setLoading(true);
        try {
          const data = await AnimeAPI_V2.getAnimeInfo(anime.id);
          if (data?.anime) {
            setQtip({
              jname: data.anime.info.jname,
              rating: data.anime.info.stats.rating,
              quality: data.anime.info.stats.quality,
              description: data.anime.info.description,
              genres: data.anime.moreInfo.genres,
              studios: data.anime.moreInfo.studios,
              duration: data.anime.info.stats.duration,
              synonyms: data.anime.moreInfo.synonyms
            });
          }
        } catch (err) {
          console.error("QTip Fetch Error:", err);
        } finally {
          setLoading(false);
        }
      }, 400); 
    }
    return () => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); };
  }, [isHovered, anime.id, qtip, loading]);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    router.push(`/watch/${anime.id}`);
  };

  // --- ANIMATIONS ---
  // Dynamic variants based on calculated position
  const qtipVariants = {
    hidden: { 
      opacity: 0, 
      x: popupPosition === 'right' ? -20 : 20, // Slide from correct side
      scale: 0.95, 
      filter: "blur(4px)" 
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1, 
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 400, damping: 25 }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
  };

  return (
    <motion.div
      ref={cardRef} // Attach Ref here
      initial="rest"
      whileHover="hover"
      animate="rest"
      onMouseEnter={handleMouseEnter} // Use new handler
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-full group perspective-1000 z-0 hover:z-50"
    >
      <Link href={`/watch/${anime.id}`} className="block h-full">
        <motion.div variants={{ hover: { y: -8, transition: { type: "spring", stiffness: 300 } } }} className="h-full">
          <Card className="relative overflow-hidden h-full bg-[#0a0a0a] border-white/5 rounded-xl transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.25)] group-hover:ring-1 group-hover:ring-red-500/50">
            
            {/* POSTER */}
            <div className="aspect-[2/3] w-full relative overflow-hidden">
              <img
                src={displayImage}
                alt={displayTitle}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:brightness-50"
              />
              
              <div className="absolute top-2 right-2 z-20">
                <Badge className="bg-black/60 backdrop-blur-md border border-white/10 text-white font-bold text-[10px] px-2">
                  {displayType}
                </Badge>
              </div>

              <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                 {subCount && (
                   <Badge className="bg-green-500/90 text-black font-extrabold text-[10px] px-1.5 flex gap-1 items-center">
                     <Captions className="w-3 h-3" /> {subCount}
                   </Badge>
                 )}
                 {hasDub && (
                   <Badge className="bg-purple-500/90 text-white font-extrabold text-[10px] px-1.5 flex gap-1 items-center">
                     <Mic className="w-3 h-3" /> {dubCount}
                   </Badge>
                 )}
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                <Button onClick={handlePlay} size="icon" className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.6)] border-2 border-white/20">
                  <Play className="w-6 h-6 fill-white ml-1" />
                </Button>
              </div>

              {progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 z-30">
                  <div style={{ width: `${progress}%` }} className="h-full bg-red-600 shadow-[0_0_10px_red]" />
                </div>
              )}
            </div>

            {/* INFO */}
            <div className="p-3 bg-[#0a0a0a] border-t border-white/5 relative z-20 h-full">
              <h3 className="font-bold text-sm text-gray-100 line-clamp-1 group-hover:text-red-500 transition-colors">
                {displayTitle}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  {anime.releaseDate?.split('-')[0] || "N/A"}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-600" />
                <span className="uppercase text-[10px] font-medium tracking-wider text-gray-500">
                   {anime.status || "Anime"}
                </span>
              </div>
            </div>

          </Card>
        </motion.div>
      </Link>

      {/* --- SMART POSITIONING QTIP --- */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            variants={qtipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              hidden lg:block absolute top-0 w-[320px] z-50 pointer-events-none
              ${popupPosition === 'right' ? 'left-[102%]' : 'right-[102%]'} 
            `}
          >
            <div className="bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-5 text-left overflow-hidden relative">
              
              <div className="mb-3">
                <h4 className="text-white font-black text-lg leading-tight mb-1 line-clamp-2">
                  {displayTitle}
                </h4>
                <p className="text-red-400 text-xs font-medium italic line-clamp-1">
                  {qtip?.jname || qtip?.synonyms || "..."}
                </p>
              </div>

              <div className="flex items-center gap-3 mb-4 text-xs font-bold text-gray-300">
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10 px-1.5 py-0 gap-1 rounded-sm">
                  <Star className="w-3 h-3 fill-yellow-500" /> {qtip?.rating || "?"}
                </Badge>
                
                {qtip?.quality && (
                  <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10 px-1.5 py-0 rounded-sm">
                    {qtip.quality}
                  </Badge>
                )}

                <div className="flex items-center gap-1 ml-auto text-gray-500 font-medium">
                  <Clock className="w-3 h-3" />
                  {qtip?.duration || "24m"}
                </div>
              </div>

              <div className="mb-4 relative">
                 {loading && !qtip ? (
                   <div className="space-y-2 animate-pulse">
                     <div className="h-3 bg-white/10 rounded w-full"/>
                     <div className="h-3 bg-white/10 rounded w-5/6"/>
                     <div className="h-3 bg-white/10 rounded w-4/6"/>
                   </div>
                 ) : (
                   <p className="text-xs text-gray-400 leading-relaxed line-clamp-5">
                     {qtip?.description || "Loading intel from Shadow Garden..."}
                   </p>
                 )}
              </div>

              <Separator className="bg-white/10 mb-3" />

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                   {(qtip?.genres || []).slice(0, 3).map((g) => (
                     <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                       {g}
                     </span>
                   ))}
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-1">
                  <div className="text-[10px] text-gray-500 flex items-center gap-1">
                    <MonitorPlay className="w-3 h-3" />
                    {qtip?.studios || "Studio Unknown"}
                  </div>
                  
                  <div className="text-[10px] font-mono text-gray-600">
                     V2.DATA
                  </div>
                </div>
              </div>

              <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/10 blur-[60px] rounded-full pointer-events-none" />

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}