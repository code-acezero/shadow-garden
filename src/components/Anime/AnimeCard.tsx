"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link'; 
import { useRouter } from 'next/navigation'; 
import { Play, Clock, Mic, Captions, Layers, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { consumetClient, ShadowAnime } from '@/lib/consumet';

// --- INTERFACES ---
interface AnimeCardProps {
  anime: ShadowAnime; // Using the new Shadow Engine Type
  progress?: number;
}

export default function AnimeCard({ 
  anime, 
  progress = 0, 
}: AnimeCardProps) {
  const router = useRouter(); 
  const [isHovered, setIsHovered] = useState(false);
  
  // QTip (Quick Tip) State
  const [qtipData, setQtipData] = useState<ShadowAnime | null>(null);
  const [loadingQtip, setLoadingQtip] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  // Safety check for title
  const displayTitle = anime.title || "Unknown Title"; 

  // --- SMART HOVER FETCH ---
  useEffect(() => {
    // Only fetch if hovered, data missing, and not already loading
    if (isHovered && !qtipData && !loadingQtip) {
      // 400ms delay to prevent spamming API while scrolling
      hoverTimeout.current = setTimeout(async () => {
        setLoadingQtip(true);
        try {
          // Ask Shadow Engine for full details
          const { info } = await consumetClient.getInfo(anime.id);
          setQtipData(info);
        } catch (error) {
          console.error("Shadow Garden Intel failed:", error);
        } finally {
          setLoadingQtip(false);
        }
      }, 400);
    } 
    
    // Cleanup if mouse leaves before timeout
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, [isHovered, anime.id, qtipData, loadingQtip]);

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    router.push(`/watch/${anime.id}`);
  };

  // --- ANIMATION VARIANTS ---
  const popupVariants = {
    hidden: { 
      opacity: 0, scale: 0.8, x: 20, filter: "blur(10px)",
      borderRadius: "40px"
    },
    visible: { 
      opacity: 1, scale: 1, x: 0, filter: "blur(0px)",
      borderRadius: "12px",
      transition: { 
        type: "spring" as const, // <--- Added 'as const' here to fix the error
        stiffness: 400, 
        damping: 25, 
        mass: 0.8 
      }
    },
    exit: { 
      opacity: 0, scale: 0.9, filter: "blur(10px)",
      transition: { duration: 0.2 } 
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full h-full group perspective-1000 ${isHovered ? 'z-50' : 'z-0'}`}
    >
      <Link href={`/watch/${anime.id}`} className="block h-full">
        <Card
          className={`
            relative overflow-hidden cursor-pointer bg-[#0a0a0a] border-white/5 
            transition-all duration-300 h-full
            ${isHovered ? 'ring-1 ring-red-600/50 shadow-[0_0_25px_rgba(220,38,38,0.2)]' : 'shadow-lg'}
            aspect-[2/3] rounded-xl
          `}
        >
          {/* --- Image Layer --- */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={anime.image}
              alt={displayTitle}
              referrerPolicy="no-referrer"
              className={`
                w-full h-full object-cover transition-transform duration-700 ease-out
                ${isHovered ? 'scale-110 blur-[2px] brightness-[0.4]' : 'scale-100'}
              `}
              loading="lazy"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/20 opacity-90" />

          {/* --- Badges --- */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20">
             {/* Add rank badge here if available in ShadowAnime */}
          </div>

          <div className="absolute top-2 right-2 flex gap-1 z-20">
             <Badge className="bg-red-600 text-white font-extrabold px-1.5 py-0 text-[10px] border border-red-400 rounded-sm">
                {anime.type || "TV"}
             </Badge>
          </div>

          {/* Play Button Overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 flex items-center justify-center z-30"
              >
                <Button
                  onClick={handleQuickPlay}
                  className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 hover:scale-110 shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-white/20 transition-all p-0 flex items-center justify-center"
                >
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-gray-100 line-clamp-1 leading-tight drop-shadow-md group-hover:text-red-500 transition-colors">
              {displayTitle}
            </h3>

            <div className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/5 rounded-lg p-1.5">
              <div className="flex items-center gap-2 text-[10px] text-gray-300 font-medium">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-red-500" />
                  {anime.totalEpisodes || "?"}
                </span>
                {anime.releaseDate && (
                  <span className="flex items-center gap-1 border-l border-white/10 pl-2">
                    <Clock className="w-3 h-3 text-blue-400" />
                    {anime.releaseDate.split('-')[0]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800 z-30">
              <div style={{ width: `${progress}%` }} className="h-full bg-red-600 shadow-[0_0_8px_red]" />
            </div>
          )}
        </Card>
      </Link>

      {/* --- POPUP (QTIP) --- */}
      <AnimatePresence>
        {isHovered && (qtipData || anime) && (
          <motion.div
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            // Hidden on mobile, visible on large screens
            className="absolute top-0 bottom-0 left-[105%] w-[280px] z-50 pointer-events-none hidden lg:block"
          >
            <div className="relative h-full overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl p-4 flex flex-col gap-3">
              
              {/* Header */}
              <div className="flex justify-between items-start">
                <h4 className="text-white font-bold text-lg leading-tight line-clamp-2">
                    {qtipData?.title || anime.title}
                </h4>
                <div className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-mono text-white/80 whitespace-nowrap">
                    {qtipData?.type || anime.type || 'TV'}
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-2 text-xs font-medium text-white/80">
                 <span className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-3 h-3 fill-yellow-400" /> {qtipData?.rating || anime.rating || "?"}
                 </span>
                 <span className="flex items-center gap-1 text-blue-300">
                    <Clock className="w-3 h-3" /> {qtipData?.totalEpisodes || anime.totalEpisodes || "?"} Eps
                 </span>
              </div>

              {/* Description (Only available after fetch) */}
              <div className="flex-1 overflow-hidden relative">
                {loadingQtip ? (
                    <div className="space-y-2 mt-2 animate-pulse">
                        <div className="h-2 bg-white/10 rounded w-full"></div>
                        <div className="h-2 bg-white/10 rounded w-5/6"></div>
                        <div className="h-2 bg-white/10 rounded w-4/6"></div>
                    </div>
                ) : (
                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-6">
                      {qtipData?.description || "Summoning intel..."}
                    </p>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              {/* Genres */}
              <div className="space-y-2 mt-auto pt-3 border-t border-white/5">
                {qtipData?.genres && (
                  <div className="flex flex-wrap gap-1.5">
                    {qtipData.genres.slice(0, 3).map((g: string) => (
                      <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/5">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center text-[10px] text-gray-500">
                   <span>{qtipData?.releaseDate || anime.releaseDate || 'Unknown'}</span>
                   <span className="uppercase tracking-wider">{qtipData?.status || 'Unknown'}</span>
                </div>
              </div>

              {/* Decorative Glows */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-600/20 blur-[50px] rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-600/10 blur-[50px] rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}