"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, ChevronLeft, ChevronRight, 
  Plus, ChevronDown, Eye, CheckCircle, 
  Clock, XCircle, Loader2, Trash2, 
  Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence, wrap, PanInfo, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/Auth/AuthModal';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

// --- TYPES ---
interface SpotlightAnime {
  id: string;
  title: string | { english?: string; romaji?: string; userPreferred?: string; native?: string };
  image?: string;
  cover?: string;
  banner?: string;
  poster?: string;
  description?: string;
  type?: string;
  releaseDate?: string;
  rating?: number | string;
}

// --- CONFIG ---
const SWIPE_THRESHOLD = 50;
const AUTO_PLAY_INTERVAL = 8000;

// --- OPTIMIZED VARIANTS (✅ FIXED TypeScript types) ---
const sliderVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    scale: 1.2,
    opacity: 0,
    zIndex: 1,
    filter: "blur(8px)",
  }),
  center: {
    zIndex: 10,
    x: 0,
    scale: 1, 
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      x: { type: "spring", stiffness: 280, damping: 28, mass: 0.7 },
      scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any },
      opacity: { duration: 0.3 },
      filter: { duration: 0.3 }
    }
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "40%" : "-40%", 
    scale: 1.05,
    opacity: 0,
    filter: "blur(6px)",
    transition: {
      x: { duration: 0.5, ease: "easeInOut" },
      scale: { duration: 0.5, ease: "easeInOut" },
      opacity: { duration: 0.4 }
    }
  })
};

// ✅ FIXED: Proper Variants type with custom parameter
const liquidTextVariants: Variants = {
  hidden: (direction: number) => ({ 
    opacity: 0, 
    x: direction > 0 ? -40 : 40,
    skewX: direction > 0 ? 10 : -10,
    filter: "blur(8px)",
    scale: 0.95
  }),
  visible: {
    opacity: 1,
    x: 0,
    skewX: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: { 
      delay: 0.15,
      duration: 0.5,
      ease: [0.19, 1, 0.22, 1] as any,
      // Stagger will be handled via custom prop
    }
  },
  exit: (direction: number) => ({ 
    opacity: 0, 
    x: direction < 0 ? -60 : 60,
    skewX: direction < 0 ? -15 : 15,
    filter: "blur(10px)",
    transition: { duration: 0.3, ease: "easeOut" }
  })
};

// --- WHISPER HELPER ---
const notifyWhisper = (message: string, type: 'success' | 'error' = 'success') => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('shadow-whisper', { 
      detail: { id: Date.now(), type, title: "Guild Quests Notice", message } 
    });
    window.dispatchEvent(event);
  }
};

// --- SPOTLIGHT ACTIONS (Buttons) ---
const SpotlightActions = ({ anime }: { anime: SpotlightAnime }) => {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [status, setStatus] = useState<string | null>(null);
    const [loadingList, setLoadingList] = useState(false);
    const [showAuth, setShowAuth] = useState(false);

    const statusMap: any = {
        "watching": { label: "Watching", icon: <Eye size={14}/>, color: "text-green-400 border-green-500/20 bg-green-500/10" },
        "completed": { label: "Completed", icon: <CheckCircle size={14}/>, color: "text-blue-400 border-blue-500/20 bg-blue-500/10" },
        "plan_to_watch": { label: "Planning", icon: <Clock size={14}/>, color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
        "on_hold": { label: "On Hold", icon: <Clock size={14}/>, color: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10" },
        "dropped": { label: "Dropped", icon: <XCircle size={14}/>, color: "text-primary-400 border-primary-500/20 bg-primary-500/10" },
    };

    useEffect(() => {
        let isMounted = true;
        const checkStatus = async () => {
            if (!supabase || !user || !anime) return;
            try {
                const { data } = await (supabase.from('watchlist') as any)
                    .select('status').eq('user_id', user.id).eq('anime_id', anime.id).maybeSingle();
                if(isMounted) setStatus(data?.status || null);
            } catch (err) { 
                if (process.env.NODE_ENV === 'development') {
                    console.error('Watchlist status check error:', err);
                }
            }
        };
        if (!isAuthLoading) checkStatus();
        return () => { isMounted = false; };
    }, [anime.id, user, isAuthLoading]);

    const handleUpdateStatus = async (newStatus: string | null) => {
        if (!supabase) return;
        if (!user) { setShowAuth(true); return; }
        setLoadingList(true);
        try {
            if (!newStatus) {
                await (supabase.from('watchlist') as any).delete().eq('user_id', user.id).eq('anime_id', anime.id);
                setStatus(null);
                notifyWhisper("Anime removed from Quest.", "success");
            } else {
                await (supabase.from('watchlist') as any).upsert({
                    user_id: user.id,
                    anime_id: anime.id,
                    status: newStatus,
                    anime_title: typeof anime.title === 'string' ? anime.title : (anime.title?.english || "Unknown"),
                    anime_image: anime.poster || anime.image,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, anime_id' });
                setStatus(newStatus);
                notifyWhisper(`Mission updated: ${statusMap[newStatus].label}`, "success");
            }
        } catch (err) { 
            notifyWhisper("Failed to update status", "error");
            if (process.env.NODE_ENV === 'development') {
                console.error('Watchlist update error:', err);
            }
        } 
        finally { setLoadingList(false); }
    };

    return (
        <>
            <motion.div 
                custom={3} 
                variants={liquidTextVariants}
                transition={{ delay: 0.15 + (3 * 0.06) }} // ✅ Manual stagger
                className="flex flex-row items-center gap-2 md:gap-3 w-full sm:w-auto"
            >
                {/* WATCH BUTTON */}
                <Button 
                    onClick={() => router.push(`/watch/${anime.id}`)} 
                    className="h-9 md:h-11 px-4 md:px-7 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-[10px] md:text-xs font-black tracking-widest uppercase shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105 active:scale-95 flex-1 sm:flex-none border border-primary-500/20"
                >
                    <Play className="mr-1.5 h-3 w-3 md:h-4 md:w-4 fill-white" /> Watch Now
                </Button>

                {/* MY LIST BUTTON - Split functionality */}
                <div className="flex items-center gap-0 flex-1 sm:flex-none">
                    {/* Main button - add to watching OR remove if already added */}
                    <Button 
                        onClick={() => status ? handleUpdateStatus(null) : handleUpdateStatus("watching")}
                        disabled={loadingList}
                        className={cn(
                            "h-9 md:h-11 px-4 md:px-6 rounded-l-full rounded-r-none text-white text-[10px] md:text-xs font-black tracking-widest uppercase backdrop-blur-md border border-r-0 transition-all transform hover:scale-105 active:scale-95",
                            status ? statusMap[status]?.color : "bg-black/40 border-white/20 hover:bg-black/60"
                        )}
                    >
                        {loadingList ? (
                            <Loader2 className="mr-1.5 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                        ) : status ? (
                            <>
                                {statusMap[status]?.icon}
                                <span className="ml-1.5">{statusMap[status]?.label}</span>
                            </>
                        ) : (
                            <>
                                <Plus className="mr-1.5 h-3 w-3 md:h-4 md:w-4" /> 
                                <span>My List</span>
                            </>
                        )}
                    </Button>

                    {/* Dropdown arrow - only show when not loading */}
                    {!loadingList && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    className={cn(
                                        "h-9 md:h-11 px-2 md:px-3 rounded-r-full rounded-l-none text-white backdrop-blur-md border border-l-0 transition-all transform hover:scale-105 active:scale-95",
                                        status ? statusMap[status]?.color : "bg-black/40 border-white/20 hover:bg-black/60"
                                    )}
                                >
                                    <ChevronDown className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-black/95 border-white/10 backdrop-blur-xl">
                                <DropdownMenuItem onClick={() => handleUpdateStatus("watching")} className="text-white/90 hover:bg-white/10 cursor-pointer">
                                    <Eye size={14} className="mr-2 text-green-400" /> Watching
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus("completed")} className="text-white/90 hover:bg-white/10 cursor-pointer">
                                    <CheckCircle size={14} className="mr-2 text-blue-400" /> Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus("plan_to_watch")} className="text-white/90 hover:bg-white/10 cursor-pointer">
                                    <Clock size={14} className="mr-2 text-purple-400" /> Planning
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus("on_hold")} className="text-white/90 hover:bg-white/10 cursor-pointer">
                                    <Clock size={14} className="mr-2 text-yellow-400" /> On Hold
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus("dropped")} className="text-white/90 hover:bg-white/10 cursor-pointer">
                                    <XCircle size={14} className="mr-2 text-primary-400" /> Dropped
                                </DropdownMenuItem>
                                {status && (
                                    <>
                                        <DropdownMenuSeparator className="bg-white/10" />
                                        <DropdownMenuItem onClick={() => handleUpdateStatus(null)} className="text-primary-400 hover:bg-primary-500/20 cursor-pointer">
                                            <Trash2 size={14} className="mr-2" /> Remove
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </motion.div>
            <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onAuthSuccess={() => setShowAuth(false)} />
        </>
    );
};

// --- MAIN COMPONENT ---
export default function SpotlightSlider({ animes }: { animes: SpotlightAnime[] }) {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isHovered, setIsHovered] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

  // ✅ Performance: Memoize valid animes
  const validAnimes = useMemo(() => 
    animes.filter(a => a && (a.cover || a.banner || a.poster || a.image)),
    [animes]
  );

  const activeIndex = wrap(0, validAnimes.length, page);
  const current = validAnimes[activeIndex];

  // ✅ Auto-play with cleanup
  useEffect(() => {
    if (!isHovered && validAnimes.length > 1) {
      const interval = setInterval(() => {
        setPage([page + 1, 1]);
      }, AUTO_PLAY_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [page, isHovered, validAnimes.length]);

  const paginate = (newDirection: number) => {
    setIsSliding(true);
    setPage([page + newDirection, newDirection]);
    setTimeout(() => setIsSliding(false), 800);
  };

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -SWIPE_THRESHOLD) paginate(1);
    else if (swipe > SWIPE_THRESHOLD) paginate(-1);
  };

  if (validAnimes.length === 0) return null;

  const displayImage = current.cover || current.banner || current.poster || current.image;
  const displayTitle = typeof current.title === 'object' 
    ? (current.title?.english || current.title?.userPreferred || "Unknown") 
    : (current.title || "Unknown");
  const displayDesc = (current.description || "").replace(/<[^>]*>?/gm, ''); 

  return (
    <section 
      className="relative w-full mb-4 md:mb-8 group px-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={cn(
          "relative w-full overflow-hidden bg-[#050505] z-0 transition-all",
          "aspect-video max-h-[56vh] md:max-h-none md:aspect-auto",
          "md:h-[380px] lg:h-[450px]",
          "rounded-none md:rounded-3xl",
          "border-y md:border border-white/5",
          isSliding 
            ? "shadow-[0_0_40px_rgba(220,38,38,0.3)] border-primary-500/30 duration-300" 
            : "shadow-[0_20px_50px_rgba(0,0,0,0.9)] border-white/5 duration-1000"
        )}
      >
        
        {/* --- 3D DOLLY SLIDER --- */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={page}
            custom={direction}
            variants={sliderVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing will-change-transform"
          >
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <motion.img 
                  src={displayImage} 
                  alt="spotlight" 
                  className="absolute inset-0 w-full h-full object-cover select-none brightness-[0.55]"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
            </div>
            {/* Edge Blending Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/20 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* --- CONTENT LAYER --- */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="w-full h-full relative">
            
            {/* 1. TEXT CONTENT */}
            <div className="absolute bottom-0 left-0 w-full md:w-3/4 p-4 pb-20 md:p-10 md:pb-24 pointer-events-auto overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div 
                  key={current.id} 
                  custom={direction}
                  initial="hidden" 
                  animate="visible" 
                  exit="exit" 
                  className="flex flex-col items-start"
                >
                  
                  {/* Badge */}
                  <motion.div 
                    custom={0} 
                    variants={liquidTextVariants}
                    transition={{ delay: 0.15 + (0 * 0.06) }}
                    className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-3"
                  >
                    <div className="flex items-center gap-1 md:gap-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-primary-600/20 border border-primary-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                      <Flag className="w-2 h-2 md:w-3 md:h-3 text-primary-400 animate-pulse" />
                      <span className="text-primary-100 text-[7px] md:text-[10px] font-black tracking-widest uppercase">Guild Quest</span>
                    </div>
                    <Badge className="border-white/10 text-white/80 bg-black/40 backdrop-blur-md text-[7px] md:text-[9px] uppercase tracking-wider px-1.5 md:px-2 py-0.5">
                      {current.type || 'TV'}
                    </Badge>
                  </motion.div>

                  {/* Title */}
                  <motion.h1 
                    custom={1} 
                    variants={liquidTextVariants}
                    transition={{ delay: 0.15 + (1 * 0.06) }}
                    className="text-xl sm:text-3xl md:text-6xl lg:text-7xl font-black text-white mb-1.5 md:mb-4 leading-[0.9] uppercase tracking-tighter line-clamp-2 drop-shadow-2xl text-shadow-lg font-[Poppins]"
                  >
                      {displayTitle}
                  </motion.h1>

                  {/* Description */}
                  <motion.p 
                    custom={2} 
                    variants={liquidTextVariants}
                    transition={{ delay: 0.15 + (2 * 0.06) }}
                    className="text-zinc-300/90 mb-3 md:mb-6 line-clamp-2 md:line-clamp-3 text-[10px] md:text-sm font-medium leading-relaxed max-w-xl drop-shadow-md overflow-hidden"
                  >
                    {displayDesc}
                  </motion.p>

                  {/* ISOLATED ACTIONS COMPONENT */}
                  <SpotlightActions anime={current} />

                </motion.div>
              </AnimatePresence>
            </div>

            {/* 2-4. NAVIGATION ROW - All controls in one aligned row */}
            <div className="absolute bottom-6 md:bottom-8 left-0 right-0 pointer-events-none z-50">
              <div className="flex items-center justify-between px-4 md:px-8 max-w-[1440px] mx-auto pointer-events-none">
                
                {/* PREV BUTTON */}
                <button 
                  onClick={() => paginate(-1)} 
                  className="p-2 md:p-3 rounded-full bg-black/40 hover:bg-primary-600 border border-white/10 text-white transition-all backdrop-blur-md shadow-2xl active:scale-90 group pointer-events-auto"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>

                {/* DOTS INDICATOR (CENTER) */}
                <div className="flex items-center gap-1.5 md:gap-3 px-2.5 md:px-5 py-1.5 md:py-3 bg-black/40 backdrop-blur-2xl rounded-full border border-white/5 shadow-2xl pointer-events-auto">
                  {validAnimes.map((_, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {
                        const dir = idx > activeIndex ? 1 : -1;
                        setPage([page + (idx - activeIndex), dir]);
                      }} 
                      className="relative flex items-center justify-center cursor-pointer outline-none"
                      style={{ width: idx === activeIndex ? '14px' : '8px', height: '14px' }}
                      aria-label={`Go to slide ${idx + 1}`}
                    >
                      {/* Base Dot */}
                      <span className="absolute w-1 md:w-1.5 h-1 md:h-1.5 bg-white/20 rounded-full transition-all duration-500" />
                      
                      {/* Active "Water Droplet" Pointer */}
                      {idx === activeIndex && (
                        <motion.span
                          layoutId="bubble-pointer"
                          className="absolute w-3 md:w-5 h-1.5 md:h-2 bg-primary-500 rounded-full shadow-[0_0_15px_#ef4444]"
                          transition={{ 
                            type: "spring", 
                            stiffness: 380, 
                            damping: 24, 
                            mass: 1 
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* NEXT BUTTON */}
                <button 
                  onClick={() => paginate(1)} 
                  className="p-2 md:p-3 rounded-full bg-black/40 hover:bg-primary-600 border border-white/10 text-white transition-all backdrop-blur-md shadow-2xl active:scale-90 group pointer-events-auto"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}