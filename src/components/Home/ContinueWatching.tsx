"use client";

import React, { useState, useEffect } from "react";
import { Clock, ChevronRight } from "lucide-react";
import { supabase, AnimeService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ContinueAnimeCard, { ContinueWatchingItem } from "../Anime/ContinueAnimeCard"; 

// --- Database Row Type ---
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
                  let clean = statsRating.replace("PG-", "PG ").replace("R-", "").replace("+", ""); 
                  if (clean.trim() === "13" || clean.trim() === "13+") {
                      displayRating = "PG-13";
                  } else {
                      displayRating = clean;
                  }
              }

              // Zero Check Logic
              const rawSub = info?.episodes?.sub || info?.stats?.episodes?.sub || 0;
              const rawDub = info?.episodes?.dub || info?.stats?.episodes?.dub || 0;

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
                // Ensure null if 0 to prevent "00" display
                sub: rawSub > 0 ? rawSub : undefined,
                dub: rawDub > 0 ? rawDub : undefined,
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
            // ✅ ALIGNMENT FIX: Matches header exactly (w-full, max-w-[1600px], px-8)
            className="w-full max-w-[1600px] mx-auto overflow-x-auto no-scrollbar py-8 px-4 md:px-8 snap-x snap-mandatory flex gap-4 md:gap-5"
          >
            {items.map((anime) => (
              <ContinueAnimeCard 
                key={anime.id} 
                anime={anime} 
                onClick={goToWatch} 
                variants={itemVariants} 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}