"use client";

import React, { useState, useEffect } from "react";
import { Play, Clock, ChevronRight, Mic, Captions } from "lucide-react";
import { supabase, AnimeService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- Types ---
interface ContinueWatchingRow {
  anime_id: string;
  anime_title?: string;
  episode_id: string;
  episode_number: number;
  progress: number;
  duration?: number;
  last_updated: string;
  episode_image: string;
  total_episodes: number;
  type: string;
  is_completed: boolean;
}

interface ContinueWatchingItem {
  id: string;
  title: string;
  poster: string;
  episode: number;
  totalEpisodes: number | string;
  progress: number;
  type: string;
  ageRating: string | null;
  isAdult: boolean;
  episodeId: string;
  sub?: number | string;
  dub?: number | string;
}

// --- Animations ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  },
};

export default function ContinueWatching() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const goToWatch = (animeId: string, episodeId?: string) => {
    if (!episodeId) return;
    router.push(`/watch/${animeId}?ep=${episodeId}`);
  };

  useEffect(() => {
    const fetchProgressWithMetadata = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_continue_watching")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_completed", false)
          .order("last_updated", { ascending: false })
          .limit(15);

        if (error) throw error;
        
        const dbData = data as ContinueWatchingRow[];

        if (!dbData || dbData.length === 0) {
            setItems([]);
            setLoading(false);
            return;
        }

        const uniqueMap = new Map<string, ContinueWatchingRow>();
        dbData.forEach((item) => {
          if (!uniqueMap.has(item.anime_id)) uniqueMap.set(item.anime_id, item);
        });
        
        const missionArray = Array.from(uniqueMap.values()).slice(0, 10);

        const enrichedItems = await Promise.all(
          missionArray.map(async (item) => {
            try {
              const info: any = await AnimeService.getAnimeInfo(item.anime_id);
              const duration = item.duration || 1440;
              const progressPercent = Math.min(Math.round((item.progress / duration) * 100), 100);

              const title = 
                info?.title?.english || 
                info?.title?.userPreferred || 
                info?.title?.romaji || 
                item.anime_title || 
                item.anime_id;

              // --- FIXED RATING LOGIC ---
              const statsRating = info?.stats?.rating || ""; 
              const explicitAdult = info?.isAdult === true;
              
              const ratingStringAdult = ["R", "17", "18", "RX", "HENTAI", "R+"].some(tag => 
                statsRating.toUpperCase().includes(tag)
              );
                
              const isAdult = explicitAdult || ratingStringAdult;

              let displayRating = null;

              if (isAdult) {
                  displayRating = "18+";
              } else if (statsRating && statsRating !== "?") {
                  // Clean up the rating string
                  let clean = statsRating.replace("PG-", "PG ").replace("R-", "").replace("+", ""); 
                  
                  // Specific fix requested: 13+ -> PG-13
                  if (clean.trim() === "13" || clean.trim() === "13+") {
                      displayRating = "PG-13";
                  } else {
                      displayRating = clean;
                  }
              }

              return {
                id: item.anime_id,
                title: title,
                poster: item.episode_image || info?.poster || info?.image || "/images/no-poster.png",
                episode: item.episode_number,
                totalEpisodes: info?.totalEpisodes || item.total_episodes || "?",
                progress: progressPercent,
                type: info?.type || item.type || "TV",
                ageRating: displayRating,
                isAdult: isAdult, 
                episodeId: item.episode_id,
                sub: info?.episodes?.sub || info?.stats?.episodes?.sub,
                dub: info?.episodes?.dub || info?.stats?.episodes?.dub,
              };
            } catch (err) {
              return {
                id: item.anime_id,
                title: item.anime_title || "Unknown Title",
                poster: item.episode_image || "/images/no-poster.png",
                episode: item.episode_number,
                totalEpisodes: item.total_episodes || "?",
                progress: 0,
                type: item.type || "TV",
                ageRating: null,
                isAdult: false,
                episodeId: item.episode_id,
                sub: undefined,
                dub: undefined
              };
            }
          })
        );

        setItems(enrichedItems);
      } catch (e) {
        console.error("Continue Watching Sync Error:", e);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) fetchProgressWithMetadata();
  }, [user, authLoading]);

  if (!user || (!loading && items.length === 0)) return null;

  return (
    <section className="w-full relative z-10 animate-in fade-in duration-700 mt-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex items-center justify-between mb-6 px-4 md:px-8 max-w-[1600px] mx-auto"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600/10 rounded-xl border border-red-500/20 backdrop-blur-md">
            <Clock className="w-4 h-4 text-red-500" />
          </div>
          {/* Red Gradient Title */}
          <h2 className="text-lg font-black tracking-[0.2em] uppercase font-sans drop-shadow-md bg-gradient-to-r from-red-500 via-red-600 to-red-900 bg-clip-text text-transparent">
            Continue Adventure
          </h2>
        </div>

        <Link 
          href="/watchlist?tab=continue" 
          className="group flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest"
        >
          View All
          <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      {/* Horizontal Scroll Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex gap-4 overflow-hidden px-4 md:px-8 max-w-[1600px] mx-auto py-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[40%] md:w-[22%] lg:w-[15%] aspect-[3/4] rounded-[32px] bg-white/5 animate-pulse border border-white/5 shadow-inner" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full overflow-x-auto no-scrollbar py-8 px-4 md:px-8 snap-x snap-mandatory flex gap-4 md:gap-5"
          >
            {items.map((anime) => (
              <motion.div
                key={anime.id}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => goToWatch(anime.id, anime.episodeId)}
                className="flex-shrink-0 w-[42%] sm:w-[30%] md:w-[22%] lg:w-[15.5%] xl:w-[15.5%] snap-start group relative aspect-[3/4] rounded-[32px] overflow-hidden cursor-pointer shadow-2xl shadow-black/50 ring-1 ring-white/10 bg-[#050505] transform-gpu transition-all duration-300 z-0 hover:z-10"
              >
                {/* 1. Background Image */}
                <div className="absolute inset-0 overflow-hidden rounded-[32px]">
                  <motion.img
                    src={anime.poster}
                    alt={anime.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  {/* Enhanced Shadow Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-95 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* 2. Top Labels */}
                <div className="absolute top-3 left-3 z-30">
                  <div className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-[8px] font-black text-white uppercase tracking-wider shadow-lg">
                    {anime.type}
                  </div>
                </div>
                
                {/* Age Rating Tag */}
                {anime.ageRating && (
                  <div className="absolute top-3 right-3 z-30">
                    <div className={`px-2 py-1 backdrop-blur-md border rounded-lg text-[8px] font-black text-white uppercase tracking-wider shadow-lg ${
                      anime.isAdult 
                        ? "bg-red-600/90 border-red-500/50 shadow-red-900/20" 
                        : "bg-black/60 border-white/10"
                    }`}>
                      {anime.ageRating}
                    </div>
                  </div>
                )}

                {/* 3. Center Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 scale-50 group-hover:scale-100 -translate-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-red-600 blur-xl opacity-70 animate-pulse" />
                    <div className="relative w-10 h-10 rounded-full bg-red-600 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.6)]">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* 4. Bottom Metadata */}
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 z-20 flex flex-col gap-1.5">
                  
                  {/* Title */}
                  <h3 className="text-sm font-black text-white leading-tight truncate drop-shadow-xl filter group-hover:text-red-400 transition-colors">
                    {anime.title}
                  </h3>

                  {/* Adaptive Info Row */}
                  <div className="flex items-center justify-between gap-1 w-full overflow-hidden">
                    
                    {/* Left: Episode Count (Flexible) */}
                    <div className="flex-1 min-w-0 bg-white/10 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md flex items-center justify-center">
                      <span className="text-[8.5px] font-bold text-white tracking-tight uppercase whitespace-nowrap">
                        EP {anime.episode}<span className="text-white/50 mx-0.5">/</span>{anime.totalEpisodes}
                      </span>
                    </div>
                    
                    {/* Right: Sub/Dub (Compact) */}
                    {(anime.sub || anime.dub) && (
                      <div className="flex-shrink-0 flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md min-w-0">
                        {anime.sub && (
                          <div className="flex items-center gap-0.5 text-[8.5px] font-bold text-white tracking-tight whitespace-nowrap">
                            <Captions size={9} className="text-zinc-300 flex-shrink-0" />
                            <span>{anime.sub}</span>
                          </div>
                        )}
                        {anime.sub && anime.dub && (
                          <div className="w-px h-2.5 bg-white/20 flex-shrink-0" />
                        )}
                        {anime.dub && (
                          <div className="flex items-center gap-0.5 text-[8.5px] font-bold text-white tracking-tight whitespace-nowrap">
                            <Mic size={9} className="text-zinc-300 flex-shrink-0" />
                            <span>{anime.dub}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="flex flex-col gap-1 w-full mt-0.5">
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${anime.progress}%` }}
                        transition={{ duration: 1.2, ease: "circOut", delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(220,38,38,0.8)]"
                      />
                    </div>
                    <span className="text-[8px] font-black text-zinc-300 tracking-widest uppercase opacity-90 text-center drop-shadow-md">
                        {anime.progress}% Complete
                    </span>
                  </div>
                </div>

                {/* 5. Glass Border Shine */}
                <div className="absolute inset-0 rounded-[32px] ring-1 ring-inset ring-white/10 pointer-events-none z-30 group-hover:ring-red-500/30 transition-all duration-500" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}