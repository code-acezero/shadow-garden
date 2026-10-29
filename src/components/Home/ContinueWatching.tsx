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
import MonetLineIcon from "@/components/UIx/MonetLineIcon";
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
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 18 }
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

import { getWatchRoute } from "@/lib/utils";

export default function ContinueWatching() {
  const { user, isLoading: authLoading } = useAuth();
  const { continueData, loadingData, removeFromContinue } = useUserData();
  const router = useRouter();

  const goToWatch = (animeId: string, episodeId?: string, type?: string) => {
    router.push(getWatchRoute(animeId, episodeId, type));
  };

  const handleRemoveItem = async (animeId: string) => {
    removeFromContinue(animeId);
    if (user) {
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
    } else {
      try {
        const localData = JSON.parse(localStorage.getItem('shadow_continue_watching') || '{}');
        delete localData[animeId];
        localStorage.setItem('shadow_continue_watching', JSON.stringify(localData));
        notifyWhisper("Anime removed from history.", "success");
      } catch (err) {}
    }
  };

  if (!loadingData && continueData.length === 0) return null;

  return (
    <section className="w-full relative z-10 animate-in fade-in duration-700 mt-2 md:mt-8">
      {/* Header - Updated max-w to 1350px */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex items-center justify-between flex-nowrap mb-2 md:mb-6 gap-4 w-full"
      >
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <MonetLineIcon icon={Clock} variant="primary" />
          <h2 className="text-base sm:text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide leading-none truncate">
            CONTINUE WATCHING
          </h2>
        </div>

        <Link 
          href="/library?tab=continue" 
          className="text-[10px] md:text-[11px] font-black uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-primary-500/30 transition-all inline-flex items-center gap-1 whitespace-nowrap select-none shrink-0 active:scale-95"
        >
          View All
          <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      {/* Horizontal Scroll Content */}
      <AnimatePresence mode="wait">
        {loadingData ? (
          <div className="flex gap-4 overflow-hidden py-2 md:py-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[42%] md:w-[22%] lg:w-[15%] aspect-[3/4] rounded-[32px] bg-white/5 animate-pulse border border-white/5 shadow-inner" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full overflow-x-auto no-scrollbar py-2 md:py-6 snap-x snap-mandatory flex gap-4 md:gap-5"
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