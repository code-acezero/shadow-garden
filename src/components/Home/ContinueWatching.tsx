"use client";

import React, { useState, useEffect } from "react";
import { Clock, ChevronRight } from "lucide-react";
import { AnimeService } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ContinueAnimeCard, { ContinueWatchingItem } from "../Anime/ContinueAnimeCard"; 

import { useUserData } from "@/context/UserDataContext";

// ... (Types & Animations remain unchanged) ...
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

const notifyWhisper = (message: string, type: 'success' | 'error' = 'success') => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('shadow-whisper', { 
      detail: { id: Date.now(), type, title: "Watch History", message } 
    });
    window.dispatchEvent(event);
  }
};

export default function ContinueWatching() {
  const { user, isLoading: authLoading } = useAuth();
  const { continueData, loadingData, removeFromContinue } = useUserData();
  const router = useRouter();

  const goToWatch = (animeId: string, episodeId?: string) => {
    if (!episodeId) return;
    router.push(`/watch/${animeId}?ep=${episodeId}`);
  };

  const handleRemoveItem = async (animeId: string) => {
    if (!user) return;
    removeFromContinue(animeId);
    try {
      const { error } = await supabase
        .from("user_continue_watching")
        .delete()
        .eq("user_id", user.id)
        .eq("anime_id", animeId);

      if (error) {
        console.error("Failed to remove continue watching item:", error);
        notifyWhisper("Failed to remove anime.", "error");
      } else {
        notifyWhisper("Anime removed from history.", "success");
      }
    } catch (err) {
      console.error("Error removing item:", err);
      notifyWhisper("An error occurred.", "error");
    }
  };

  if (!user || (!loadingData && continueData.length === 0)) return null;

  return (
    <section className="w-full relative z-10 animate-in fade-in duration-700 mt-8">
      {/* Header - Updated max-w to 1350px */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex items-center justify-between flex-nowrap mb-4 md:mb-6 px-4 md:px-8 max-w-[1350px] mx-auto gap-4"
      >
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="p-1.5 md:p-2 bg-primary-600/10 rounded-lg md:rounded-xl border border-primary-500/20 backdrop-blur-md flex-shrink-0">
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-500" />
          </div>
          <h2 className="text-sm md:text-lg font-black tracking-[0.15em] md:tracking-[0.2em] uppercase font-sans drop-shadow-md bg-gradient-to-r from-primary-500 via-primary-600 to-primary-900 bg-clip-text text-transparent truncate">
            Continue Adventure
          </h2>
        </div>

        <Link 
          href="/watchlist?tab=continue" 
          className="group flex-shrink-0 flex items-center gap-0.5 md:gap-1 text-[9px] md:text-[10px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest whitespace-nowrap"
        >
          View All
          <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      {/* Horizontal Scroll Content - Updated max-w to 1350px */}
      <AnimatePresence mode="wait">
        {loadingData ? (
          <div className="flex gap-4 overflow-hidden px-4 md:px-8 max-w-[1350px] mx-auto py-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[42%] md:w-[22%] lg:w-[15%] aspect-[3/4] rounded-[32px] bg-white/5 animate-pulse border border-white/5 shadow-inner" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-[1350px] mx-auto overflow-x-auto no-scrollbar py-8 px-4 md:px-8 snap-x snap-mandatory flex gap-4 md:gap-5"
          >
            {continueData.slice(0, 10).map((anime) => (
              <ContinueAnimeCard 
                key={anime.id} 
                anime={anime} 
                onClick={goToWatch} 
                onRemove={handleRemoveItem} 
                variants={itemVariants} 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}