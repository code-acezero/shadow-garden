"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Film, Compass, MessageSquare, Flame, Sparkles, ChevronRight, ChevronLeft, Loader2,
  Tv, Star, Play, Heart, MessageCircle, Clock, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimeService } from '@/lib/api';
import AnimeCard from '@/components/Anime/AnimeCard';
import { hpi } from '@/lib/hpi';
import { dpi } from '@/lib/dpi';
import { cn } from '@/lib/utils';

export default function MultiverseShowcase() {
  const [activeTab, setActiveTab] = useState<'movies' | 'donghua' | 'drama' | 'community'>('movies');
  const [movies, setMovies] = useState<any[]>([]);
  const [donghua, setDonghua] = useState<any[]>([]);
  const [dramas, setDramas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Community discussions/whispers
  const communityPosts = [
    {
      id: 'post-1',
      author: 'ShadowMaster',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      badge: 'ELITE COVEN',
      animeTitle: 'Solo Leveling: Arise from the Shadow',
      content: 'The animation in episode 11 was utterly breathtaking. The shadows army awakening scene gave me literal chills! What was your favorite moment?',
      time: '12m ago',
      likes: 84,
      replies: 29
    },
    {
      id: 'post-2',
      author: 'CrimsonBlade',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      badge: 'TACTICAL OPERATIVE',
      animeTitle: 'Jujutsu Kaisen Season 2',
      content: 'Sukuna vs Mahoraga remains the benchmark for modern action choreography. The sound design during the domain expansion is unbelievable.',
      time: '45m ago',
      likes: 142,
      replies: 53
    },
    {
      id: 'post-3',
      author: 'AlphaSeven',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      badge: 'ARCHIVIST',
      animeTitle: 'Soul Land 2: The Unrivaled Tang Sect',
      content: 'Chinese 3D Donghua CGI has evolved to a level where fight scenes look cinematic. Highly recommend anyone sleeping on Chinese anime to start here!',
      time: '2h ago',
      likes: 67,
      replies: 18
    },
    {
      id: 'post-4',
      author: 'LordCid',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      badge: 'EMINENCE',
      animeTitle: 'The Eminence in Shadow',
      content: 'I Am Atomic. Need I say more? Re-watching the sanctuary arc for the 5th time and the piano soundtrack still hits like a truck.',
      time: '3h ago',
      likes: 215,
      replies: 76
    }
  ];

  const [page, setPage] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadMultiverseData() {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setIsPaginating(true);
        }

        if (activeTab === 'movies') {
          const movieList = await AnimeService.getMovies(page).catch(() => []);
          if (isMounted) setMovies(Array.isArray(movieList) ? movieList.slice(0, 12) : []);
        } else if (activeTab === 'donghua') {
          const donghuaList = await AnimeService.getDonghua(page).catch(() => []);
          if (isMounted) setDonghua(Array.isArray(donghuaList) ? donghuaList.slice(0, 12) : []);
        } else if (activeTab === 'drama') {
          if (page === 1) {
            const blakiteHome = await hpi.hindi.getHome().catch(() => ({ sections: [] }));
            const dramaSection = blakiteHome?.sections?.find((s: any) => 
              s.title.includes('Drama') || s.title.includes('Live Action')
            );
            const dramaItems = dramaSection?.items || [];
            if (isMounted) setDramas(dramaItems.slice(0, 12));
          } else {
            const searchResults = await AnimeService.filter({ genre_in: ['Drama'], page, perPage: 12 }).catch(() => null);
            if (isMounted && searchResults && Array.isArray((searchResults as any).results)) {
              setDramas((searchResults as any).results);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load multiverse showcase:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsPaginating(false);
        }
      }
    }

    loadMultiverseData();
    return () => { isMounted = false; };
  }, [activeTab, page]);

  // Initial load for all tabs so counts and first page are available
  useEffect(() => {
    let isMounted = true;
    async function preloadInitial() {
      try {
        const [movieList, donghuaList, blakiteHome] = await Promise.all([
          AnimeService.getMovies(1).catch(() => []),
          AnimeService.getDonghua(1).catch(() => []),
          hpi.hindi.getHome().catch(() => ({ sections: [] }))
        ]);
        if (!isMounted) return;
        setMovies(Array.isArray(movieList) ? movieList.slice(0, 12) : []);
        setDonghua(Array.isArray(donghuaList) ? donghuaList.slice(0, 12) : []);
        const dramaSection = blakiteHome?.sections?.find((s: any) => 
          s.title.includes('Drama') || s.title.includes('Live Action')
        );
        setDramas((dramaSection?.items || []).slice(0, 12));
      } catch (e) {
        // quiet fallback
      }
    }
    preloadInitial();
    return () => { isMounted = false; };
  }, []);

  const handleTabChange = (tabId: 'movies' | 'donghua' | 'drama' | 'community') => {
    setActiveTab(tabId);
    setPage(1);
  };

  const tabs = [
    { id: 'movies' as const, label: 'Feature Films', icon: Film, count: movies.length },
    { id: 'donghua' as const, label: 'Chinese Donghua', icon: Sparkles, count: donghua.length },
    { id: 'drama' as const, label: 'Dramas & Live Action', icon: Tv, count: dramas.length },
    { id: 'community' as const, label: 'Sanctuary Whispers', icon: MessageSquare, count: communityPosts.length },
  ];

  const getViewAllLink = () => {
    switch (activeTab) {
      case 'movies': return '/search?type=Movie';
      case 'donghua': return '/search/donghua';
      case 'drama': return '/search?type=Drama';
      case 'community': return '/community';
      default: return '/search';
    }
  };

  return (
    <section className="w-full my-4 md:my-8 relative z-10">
      {/* Header and Filter Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 md:mb-7">
        <div className="flex items-center gap-2.5 md:gap-3">
          <Compass className="w-7 h-7 md:w-9 md:h-9 text-red-500 shrink-0 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
          <h2 className="text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide flex items-center gap-2">
            SHADOW <span className="text-red-500">MULTIVERSE</span>
          </h2>
        </div>

        {/* Tactical Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#0a0a0a] border border-white/10 shadow-inner overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap",
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-950/50"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={12} className={isActive ? "text-white" : "text-zinc-500"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Bar: Pagination & View All */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {activeTab !== 'community' && (
            <>
              <span className="text-xs font-semibold text-zinc-400 select-none">
                <span className="text-white font-bold">{page}</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || isPaginating}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={isPaginating}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90"
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          <Link
            href={getViewAllLink()}
            className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white transition-colors bg-white/5 hover:border-red-500/30 px-3.5 py-1.5 rounded-full border border-white/5"
          >
            <span>Explore All</span>
            <ChevronRight size={12} className="text-red-400" />
          </Link>
        </div>
      </div>

      {/* Content Rendering */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl border border-white/5" />
            ))}
          </div>
        ) : activeTab === 'community' ? (
          /* Community Dispatches Grid */
          <motion.div
            key="community-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {communityPosts.map((post) => (
              <div
                key={post.id}
                className="group relative rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#0c0c0e]/95 to-[#070709]/95 border border-white/10 p-4 md:p-5 hover:border-red-500/30 transition-all duration-300 shadow-xl"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={post.avatar}
                      alt={post.author}
                      className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-red-500/50 transition-colors"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs md:text-sm font-black text-white">{post.author}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-red-600/20 border border-red-500/30 text-[8px] font-black text-red-300 uppercase">
                          {post.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium">{post.time}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-black text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded-full line-clamp-1 max-w-[140px]">
                    {post.animeTitle}
                  </span>
                </div>

                <p className="text-xs md:text-sm text-zinc-300 leading-relaxed mb-4 line-clamp-3 font-normal">
                  "{post.content}"
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
                      <Heart size={13} className="text-red-500" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <MessageCircle size={13} className="text-zinc-500" />
                      <span>{post.replies} replies</span>
                    </button>
                  </div>

                  <Link
                    href="/community"
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider inline-flex items-center gap-1"
                  >
                    <span>Join Discussion</span>
                    <ChevronRight size={10} />
                  </Link>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          /* Anime Card Grid for Movies, Donghua, Dramas */
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6"
          >
            {(activeTab === 'movies' ? movies : activeTab === 'donghua' ? donghua : dramas).map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="transform-gpu transition-transform duration-300 hover:scale-[1.03]">
                <AnimeCard anime={item} />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
