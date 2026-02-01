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
import { motion, AnimatePresence, wrap, PanInfo } from 'framer-motion';
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

// --- VARIANTS ---
const sliderVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    scale: 1.3, 
    opacity: 0,
    zIndex: 1,
    filter: "blur(4px)",
  }),
  center: {
    zIndex: 10,
    x: 0,
    scale: 1, 
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 }, 
      scale: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }, 
      opacity: { duration: 0.4 },
      filter: { duration: 0.4 }
    }
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "40%" : "-40%", 
    scale: 1.1, 
    opacity: 0,
    filter: "blur(8px)",
    transition: {
      x: { duration: 0.6, ease: "easeIn" }, 
      scale: { duration: 0.6, ease: "easeIn" },
      opacity: { duration: 0.5 }
    }
  })
};

const liquidTextVariants = {
  hidden: (direction: number) => ({ 
    opacity: 0, 
    x: direction > 0 ? -60 : 60, 
    skewX: direction > 0 ? 20 : -20, 
    filter: "blur(12px)",
    scale: 0.9 
  }),
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    skewX: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: { 
      delay: 0.2 + (i * 0.08), 
      duration: 0.7, 
      ease: [0.19, 1, 0.22, 1] 
    }
  }),
  exit: (direction: number) => ({ 
    opacity: 0, 
    x: direction < 0 ? -100 : 100, 
    skewX: direction < 0 ? -30 : 30, 
    filter: "blur(20px)",
    transition: { duration: 0.4, ease: "easeIn" } 
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
        "dropped": { label: "Dropped", icon: <XCircle size={14}/>, color: "text-red-400 border-red-500/20 bg-red-500/10" },
    };

    useEffect(() => {
        let isMounted = true;
        const checkStatus = async () => {
            if (!supabase || !user || !anime) return;
            try {
                const { data } = await (supabase.from('watchlist') as any)
                    .select('status').eq('user_id', user.id).eq('anime_id', anime.id).maybeSingle();
                if(isMounted) setStatus(data?.status || null);
            } catch (err) { console.error(err); }
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
        } catch (err) { notifyWhisper("Failed to update status", "error"); } 
        finally { setLoadingList(false); }
    };

    return (
        <>
            <motion.div custom={3} variants={liquidTextVariants} className="flex flex-row items-center gap-2 md:gap-3 w-full sm:w-auto">
                {/* WATCH BUTTON */}
                <Button 
                    onClick={() => router.push(`/watch/${anime.id}`)} 
                    className="h-9 md:h-12 px-5 md:px-8 rounded-full bg-red-600 hover:bg-red-700 text-white text-[9px] md:text-xs font-black tracking-widest uppercase shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105 active:scale-95 flex-1 sm:flex-none border border-red-500/20"
                >
                    <Play className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4 fill-white" /> Watch Now
                </Button>

                {/* LIST BUTTON */}
                <div className="flex items-center h-9 md:h-12 flex-1 sm:flex-none shadow-lg rounded-full">
                    <Button 
                        variant="ghost" 
                        disabled={loadingList || isAuthLoading}
                        onClick={() => handleUpdateStatus(status === 'watching' ? null : 'watching')}
                        className={cn("h-full px-3 md:px-6 rounded-l-full border-y border-l transition-all backdrop-blur-xl font-bold text-[9px] md:text-[10px] uppercase tracking-wider flex-1 hover:bg-white/10", status ? statusMap[status]?.color : "bg-black/40 border-white/10 text-white")}
                    >
                        {loadingList ? <Loader2 size={12} className="md:w-3.5 md:h-3.5 animate-spin"/> : (status ? statusMap[status].icon : <Plus size={12} className="md:w-3.5 md:h-3.5"/>)}
                        <span className="ml-1.5 md:ml-2">{status ? statusMap[status].label : "List"}</span>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={cn("h-full px-1.5 md:px-3 rounded-r-full border transition-all backdrop-blur-xl shrink-0 hover:bg-white/10", status ? statusMap[status]?.color : "bg-black/40 border-white/10 text-white")}>
                                <ChevronDown size={12} className="md:w-3.5 md:h-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0a0a0a]/95 backdrop-blur-xl border-white/10 text-zinc-300 z-[100] min-w-[160px] shadow-2xl rounded-2xl p-1.5">
                            {Object.keys(statusMap).map((key) => (
                                <DropdownMenuItem key={key} onClick={() => handleUpdateStatus(key)} className="text-[10px] font-bold uppercase gap-3 py-2.5 px-3 cursor-pointer hover:bg-white/10 rounded-lg transition-colors focus:bg-white/10">
                                    {statusMap[key].icon} {statusMap[key].label}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={() => handleUpdateStatus(null)} className="text-[10px] font-bold uppercase gap-3 py-2.5 px-3 cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors focus:bg-red-500/10">
                                <Trash2 size={14} /> Remove
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </motion.div>
            <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onAuthSuccess={() => setShowAuth(false)} />
        </>
    );
};

// --- MAIN COMPONENT ---
export default function SpotlightSlider({ animes }: { animes: SpotlightAnime[] | any[] }) {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isSliding, setIsSliding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const validAnimes = useMemo(() => Array.isArray(animes) ? animes.filter(a => a && (a.id || a.animeId)) : [], [animes]);
  const activeIndex = wrap(0, validAnimes.length, page);
  const current = validAnimes[activeIndex];

  // Preload Images
  useEffect(() => {
    if (!validAnimes.length) return;
    const nextIndex = wrap(0, validAnimes.length, page + 1);
    const prevIndex = wrap(0, validAnimes.length, page - 1);
    [validAnimes[nextIndex], validAnimes[prevIndex]].forEach(anime => {
      const img = new Image();
      img.src = anime.cover || anime.banner || anime.poster || anime.image;
    });
  }, [page, validAnimes]);

  // Auto Play
  useEffect(() => {
    if (validAnimes.length > 0 && !isHovered) {
      const interval = setInterval(() => paginate(1), AUTO_PLAY_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [page, isHovered, validAnimes.length]);

  const paginate = (newDirection: number) => {
    setIsSliding(true);
    setPage([page + newDirection, newDirection]);
    setTimeout(() => setIsSliding(false), 1200); 
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
    : (current.title || current.name);
  const displayDesc = (current.description || "").replace(/<[^>]*>?/gm, ''); 

  return (
    <section 
      className="relative w-full mb-8 group px-0 mt-4 md:mt-6" // Edge-to-edge on Mobile (px-0), Standard on Desktop (md:px-0 if parent controls, otherwise use parent's constraint)
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={cn(
          // MOBILE: Height adjusted to 55vh for better content fit, Edge-to-edge width
          "relative w-full h-[55vh] min-h-[450px] md:h-[400px] lg:h-[480px] overflow-hidden bg-[#050505] z-0 transition-all",
          // MOBILE: No rounded corners or minimal. DESKTOP: Rounded corners.
          "rounded-none md:rounded-[2.5rem]", 
          "border-y md:border border-white/5",
          isSliding ? "shadow-[0_0_50px_rgba(220,38,38,0.4)] border-red-500/40 duration-300" : "shadow-[0_20px_50px_rgba(0,0,0,0.9)] border-white/5 duration-1000"
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
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing will-change-transform"
          >
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <motion.img 
                  src={displayImage} 
                  alt="spotlight" 
                  className="absolute inset-0 w-full h-full object-cover select-none brightness-[0.55]"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  loading="eager"
                  decoding="sync"
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
            {/* Mobile: Padded from bottom to avoid overlapping with navigation/dots */}
            <div className="absolute bottom-0 left-0 w-full md:w-3/4 p-6 pb-16 md:p-12 md:pb-24 pointer-events-auto overflow-hidden">
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
                  <motion.div custom={0} variants={liquidTextVariants} className="flex items-center gap-2 mb-2 md:mb-3">
                    <div className="flex items-center gap-1.5 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-red-600/20 border border-red-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                        <Flag className="w-2.5 h-2.5 md:w-3 md:h-3 text-red-400 animate-pulse" />
                      <span className="text-red-100 text-[8px] md:text-[10px] font-black tracking-widest uppercase">Guild Quest</span>
                    </div>
                    <Badge className="border-white/10 text-white/80 bg-black/40 backdrop-blur-md text-[8px] md:text-[9px] uppercase tracking-wider px-2 py-0.5">
                      {current.type || 'TV'}
                    </Badge>
                  </motion.div>

                  {/* Title */}
                  <motion.h1 
                    custom={1} 
                    variants={liquidTextVariants} 
                    className="text-2xl sm:text-4xl md:text-7xl font-black text-white mb-2 md:mb-4 leading-[0.95] uppercase tracking-tighter line-clamp-2 drop-shadow-2xl text-shadow-lg font-[Poppins]"
                  >
                      {displayTitle}
                  </motion.h1>

                  {/* Description */}
                  <motion.p 
                    custom={2} 
                    variants={liquidTextVariants} 
                    className="text-zinc-300/90 mb-4 md:mb-8 line-clamp-3 text-[11px] md:text-sm font-medium leading-relaxed max-w-xl drop-shadow-md overflow-hidden"
                  >
                    {displayDesc}
                  </motion.p>

                  {/* ISOLATED ACTIONS COMPONENT */}
                  <SpotlightActions anime={current} />

                </motion.div>
              </AnimatePresence>
            </div>

            {/* 2. PREV BUTTON (Bottom Left - Hidden on tiny mobiles to save space, visible on tablet+) */}
            <div className="absolute bottom-3 left-2 md:bottom-8 md:left-8 pointer-events-auto hidden md:block">
               <button onClick={() => paginate(-1)} className="p-1.5 md:p-4 rounded-full bg-black/30 hover:bg-red-600 border border-white/10 text-white transition-all backdrop-blur-md shadow-2xl active:scale-90 group">
                 <ChevronLeft size={16} className="md:w-6 md:h-6 group-hover:-translate-x-0.5 transition-transform" />
               </button>
            </div>

            {/* 3. NEXT BUTTON (Bottom Right - Hidden on tiny mobiles) */}
            <div className="absolute bottom-3 right-2 md:bottom-8 md:right-8 pointer-events-auto hidden md:block">
               <button onClick={() => paginate(1)} className="p-1.5 md:p-4 rounded-full bg-black/30 hover:bg-red-600 border border-white/10 text-white transition-all backdrop-blur-md shadow-2xl active:scale-90 group">
                 <ChevronRight size={16} className="md:w-6 md:h-6 group-hover:translate-x-0.5 transition-transform" />
               </button>
            </div>

            {/* 4. LIQUID BUBBLE POINTER (Bottom Center) */}
            <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto z-50">
               <div className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 bg-black/40 backdrop-blur-2xl rounded-full border border-white/5 shadow-2xl">
                  {validAnimes.map((_, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {
                        const dir = idx > activeIndex ? 1 : -1;
                        setPage([page + (idx - activeIndex), dir]);
                      }} 
                      className="relative flex items-center justify-center cursor-pointer outline-none"
                      style={{ width: idx === activeIndex ? '16px' : '8px', height: '16px' }}
                    >
                      {/* Base Dot */}
                      <span className="absolute w-1 md:w-1.5 h-1 md:h-1.5 bg-white/20 rounded-full transition-all duration-500" />
                      
                      {/* Active "Water Droplet" Pointer */}
                      {idx === activeIndex && (
                        <motion.span
                          layoutId="bubble-pointer"
                          className="absolute w-3 md:w-6 h-1.5 md:h-2 bg-red-500 rounded-full shadow-[0_0_15px_#ef4444]"
                          transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 25, 
                            mass: 1.2 
                          }}
                        />
                      )}
                    </button>
                  ))}
               </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}