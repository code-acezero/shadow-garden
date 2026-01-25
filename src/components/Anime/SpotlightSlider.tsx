"use client";

import React, { useState, useEffect } from 'react';
import { 
  Play, ChevronLeft, ChevronRight, 
  Calendar, Captions, Sparkles, Star,
  Plus, Check, ChevronDown, Eye, CheckCircle, 
  Clock, XCircle, Trash2, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Logic Imports
import { supabase } from '@/lib/api';
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

export default function SpotlightSlider({ animes }: { animes: SpotlightAnime[] | any[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0); 
  const router = useRouter(); 
  const { user, isLoading: isAuthLoading } = useAuth();

  const [showAuth, setShowAuth] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  // Defensive data filter
  const validAnimes = Array.isArray(animes) ? animes.filter(a => a && (a.id || a.animeId)) : [];

  const statusMap: any = {
    "watching": { label: "Watching", icon: <Eye size={14}/>, color: "text-green-400 border-green-500/20 bg-green-500/10" },
    "completed": { label: "Completed", icon: <CheckCircle size={14}/>, color: "text-blue-400 border-blue-500/20 bg-blue-500/10" },
    "plan_to_watch": { label: "Planning", icon: <Clock size={14}/>, color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
    "on_hold": { label: "On Hold", icon: <Clock size={14}/>, color: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10" },
    "dropped": { label: "Dropped", icon: <XCircle size={14}/>, color: "text-red-400 border-red-500/20 bg-red-500/10" },
  };

  useEffect(() => {
    if (validAnimes.length > 0) {
      const interval = setInterval(() => handleNext(), 8000);
      return () => clearInterval(interval);
    }
  }, [activeIndex, validAnimes.length]);

  useEffect(() => {
    const checkStatus = async () => {
      if (!supabase || !user || !validAnimes[activeIndex]) return;
      try {
        const { data } = await (supabase.from('watchlist') as any)
          .select('status').eq('user_id', user.id).eq('anime_id', validAnimes[activeIndex].id).maybeSingle();
        setStatus(data?.status || null);
      } catch (err) { console.error(err); }
    };
    if (!isAuthLoading) checkStatus();
  }, [activeIndex, user, isAuthLoading, validAnimes]);

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % validAnimes.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev === 0 ? validAnimes.length - 1 : prev - 1));
  };

  const handleUpdateStatus = async (newStatus: string | null) => {
    if (!supabase) return;
    if (!user) { setShowAuth(true); return; }
    setLoadingList(true);
    const currentAnime = validAnimes[activeIndex];
    try {
      if (!newStatus) {
        await (supabase.from('watchlist') as any).delete().eq('user_id', user.id).eq('anime_id', currentAnime.id);
        setStatus(null);
        toast.success("Removed from library.");
      } else {
        await (supabase.from('watchlist') as any).upsert({
          user_id: user.id,
          anime_id: currentAnime.id,
          status: newStatus,
          anime_title: typeof currentAnime.title === 'string' ? currentAnime.title : (currentAnime.title?.english || "Unknown"),
          anime_image: currentAnime.poster || currentAnime.image,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, anime_id' });
        setStatus(newStatus);
        toast.success(`Moved to ${statusMap[newStatus].label}`);
      }
    } catch (err) { toast.error("Failed to update status"); }
    finally { setLoadingList(false); }
  };

  if (validAnimes.length === 0) return null;

  const current = validAnimes[activeIndex];
  const displayImage = current.cover || current.banner || current.poster || current.image;
  const displayTitle = typeof current.title === 'object' 
    ? (current.title?.english || current.title?.userPreferred || "Unknown") 
    : (current.title || current.name);
  const displayDesc = (current.description || "").replace(/<[^>]*>?/gm, ''); 

  const morphSlideVariants = {
    initial: (direction: number) => ({ opacity: 0, x: direction > 0 ? "20%" : "-20%", scale: 1.1, filter: "blur(10px)" }),
    animate: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] } },
    exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? "20%" : "-20%", scale: 0.95, filter: "blur(10px)", transition: { duration: 0.6, ease: "easeInOut" } })
  };

  const textVariants = {
    hidden: { opacity: 0, x: -20, filter: "blur(8px)" },
    visible: (i: number) => ({ opacity: 1, x: 0, filter: "blur(0px)", transition: { delay: 0.1 + (i * 0.1), duration: 0.6, ease: "easeOut" } })
  };

  return (
    <section className="relative w-full mb-8 group perspective-[2000px] px-2 sm:px-4 md:px-8">
      <div 
        className="relative w-full h-[45vh] min-h-[380px] md:h-[420px] lg:h-[450px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/5 bg-[#050505]"
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={current.id}
            custom={direction}
            variants={morphSlideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Motion */}
            <motion.div 
              className="absolute inset-0 w-full h-full"
              animate={{ rotateX: [0, 0.5, 0, -0.5, 0], rotateY: [0, -1, 0, 1, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.img 
                src={displayImage} 
                alt="" 
                className="w-full h-full object-cover opacity-40 select-none"
                initial={{ scale: 1.05 }}
                animate={{ scale: 1.15 }}
                transition={{ duration: 10, ease: "linear" }}
              />
            </motion.div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/30 to-transparent z-10" />

            {/* --- CONTENT LAYER --- */}
            <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-10 z-20 pb-16 md:pb-20">
              <div className="max-w-3xl relative">
                
                <motion.div custom={0} variants={textVariants} initial="hidden" animate="visible" className="flex items-center gap-2 mb-2 md:mb-3">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/20 border border-red-500/20 backdrop-blur-md">
                    <Sparkles className="w-3 h-3 text-red-400" />
                    <span className="text-red-200 text-[8px] md:text-[9px] font-bold tracking-wider uppercase">Guild Highlights</span>
                  </div>
                  <Badge className="border border-white/10 text-white/60 bg-white/5 text-[8px] md:text-[9px] uppercase">{current.type || 'TV'}</Badge>
                </motion.div>

                <motion.h1 custom={1} variants={textVariants} initial="hidden" animate="visible" className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-3 md:mb-4 leading-[1.05] uppercase tracking-tighter line-clamp-2 drop-shadow-2xl">
                    {displayTitle}
                </motion.h1>

                <motion.p custom={2} variants={textVariants} initial="hidden" animate="visible" className="text-gray-400 mb-6 line-clamp-2 text-[11px] md:text-sm font-medium leading-relaxed max-w-lg">
                  {displayDesc}
                </motion.p>

                <motion.div custom={3} variants={textVariants} initial="hidden" animate="visible" className="flex flex-row items-center gap-2 w-full sm:w-auto">
                  <Button onClick={() => router.push(`/watch/${current.id}`)} className="h-10 px-6 sm:px-8 rounded-full bg-red-600 hover:bg-red-700 text-white text-[10px] sm:text-xs font-bold shadow-lg transition-all transform active:scale-95 flex-1 sm:flex-none">
                    <Play className="mr-1.5 h-3.5 w-3.5 fill-white" /> WATCH
                  </Button>

                  <div className="flex items-center h-10 flex-1 sm:flex-none">
                    <Button 
                      variant="ghost" 
                      disabled={loadingList || isAuthLoading}
                      onClick={() => handleUpdateStatus(status === 'watching' ? null : 'watching')}
                      className={cn("h-full px-4 sm:px-6 rounded-l-full border-y border-l transition-all backdrop-blur-xl font-bold text-[10px] uppercase tracking-wider flex-1", status ? statusMap[status]?.color : "bg-white/5 border-white/10 text-white")}
                    >
                      {loadingList ? <Loader2 size={14} className="animate-spin"/> : (status ? statusMap[status].icon : <Plus size={14}/>)}
                      <span className="ml-1.5">{status ? statusMap[status].label : "QUEST"}</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={cn("h-full px-2 rounded-r-full border transition-all backdrop-blur-xl shrink-0", status ? statusMap[status]?.color : "bg-white/5 border-white/10 text-white")}>
                          <ChevronDown size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 text-zinc-300 z-[100] min-w-[140px] shadow-2xl rounded-xl">
                        {Object.keys(statusMap).map((key) => (
                          <DropdownMenuItem key={key} onClick={() => handleUpdateStatus(key)} className="text-[10px] font-bold uppercase gap-2 py-2 cursor-pointer">
                            {statusMap[key].icon} {statusMap[key].label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* NAVIGATION CONTROLS */}
        <div className="absolute bottom-4 left-4 right-4 z-40 flex items-center justify-between">
           <button onClick={handlePrev} className="p-2 rounded-full bg-black/40 hover:bg-red-600 border border-white/10 text-white transition-all backdrop-blur-md shadow-xl active:scale-90">
             <ChevronLeft size={18} />
           </button>
           
           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5">
              {validAnimes.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => {
                    setDirection(idx > activeIndex ? 1 : -1);
                    setActiveIndex(idx);
                  }} 
                  className={cn("transition-all duration-500 rounded-full h-1", idx === activeIndex ? 'w-5 bg-red-600 shadow-[0_0_8px_#ef4444]' : 'w-1 bg-white/20')} 
                />
              ))}
           </div>

           <button onClick={handleNext} className="p-2 rounded-full bg-black/40 hover:bg-red-600 border border-white/10 text-white transition-all backdrop-blur-md shadow-xl active:scale-90">
             <ChevronRight size={18} />
           </button>
        </div>
      </div>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onAuthSuccess={() => setShowAuth(false)} />
    </section>
  );
}