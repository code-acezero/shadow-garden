"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Clapperboard, Compass, MessageSquare, ChevronRight, ChevronLeft,
  Tv, Star, Clock, SlidersHorizontal, ChevronDown, Check,
  Heart, MessageCircle, Swords
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimeService } from '@/lib/api';
import AnimeCard from '@/components/Anime/AnimeCard';
import { omni, DramaCard } from '@/lib/omni';
import { cn, getStreamUrl } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type MultiverseTab = 'movies' | 'donghua' | 'drama' | 'community';
type SubFilterType = 'all' | 'top_rated' | 'recent';

interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  badge: string;
  animeTitle: string;
  content: string;
  time: string;
  likes: number;
  replies: number;
}

export default function MultiverseShowcase() {
  const [activeTab, setActiveTab] = useState<MultiverseTab>('movies');
  const [subFilter, setSubFilter] = useState<SubFilterType>('all');
  const [movies, setMovies] = useState<any[]>([]);
  const [donghua, setDonghua] = useState<any[]>([]);
  const [dramas, setDramas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isRealmMenuOpen, setIsRealmMenuOpen] = useState(false);

  // Fetch dramas from dedicated drama source (/api/drama/dramas & /api/drama/home)
  const fetchDramas = useCallback(async (targetPage: number) => {
    try {
      const res = await omni.drama.getDramas('all', targetPage).catch(() => ({ items: [] }));
      let items = res.items || [];
      if (items.length === 0 && targetPage === 1) {
        const homeRes = await omni.drama.getHome().catch(() => ({ sections: [] }));
        const allItems = homeRes.sections?.flatMap(s => s.items) || [];
        items = allItems;
      }
      return items.map((item: DramaCard) => ({
        ...item,
        targetRoute: getStreamUrl(item.id, item.title, item.isMovie ? 'movie' : 'drama', item.episode),
        type: item.type || (item.isMovie ? 'Movie' : 'Drama'),
        rating: item.score || '8.2',
        score: item.score || '8.2',
        source: 'universal'
      }));
    } catch (err) {
      console.error('Failed to fetch dramas:', err);
      return [];
    }
  }, []);

  // Fetch movies from dedicated movie source (/api/drama/movies) & anime feature films
  const fetchMovies = useCallback(async (targetPage: number) => {
    try {
      const [movieSourceRes, animeMovieList] = await Promise.all([
        omni.drama.getMovies('all', targetPage).catch(() => ({ items: [] })),
        AnimeService.getMovies(targetPage).catch(() => [])
      ]);

      const mappedDramaMovies = (movieSourceRes.items || []).map((item: DramaCard) => ({
        ...item,
        targetRoute: getStreamUrl(item.id, item.title, 'movie', item.episode),
        type: 'Movie',
        rating: item.score || '8.2',
        score: item.score || '8.2',
        source: 'universal'
      }));

      const safeAnimeMovies = Array.isArray(animeMovieList) ? animeMovieList : [];

      // Interleave cinema movie source with anime feature films for a comprehensive universe
      const combined: any[] = [];
      const maxLen = Math.max(mappedDramaMovies.length, safeAnimeMovies.length);
      for (let i = 0; i < maxLen; i++) {
        if (mappedDramaMovies[i]) combined.push(mappedDramaMovies[i]);
        if (safeAnimeMovies[i]) combined.push(safeAnimeMovies[i]);
      }

      return combined.length > 0 ? combined.slice(0, 18) : (mappedDramaMovies.length > 0 ? mappedDramaMovies : safeAnimeMovies);
    } catch (err) {
      console.error('Failed to fetch movies:', err);
      return [];
    }
  }, []);

  // Community discussions/whispers
  const communityPosts: CommunityPost[] = [
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
          const movieList = await fetchMovies(page);
          if (isMounted) setMovies(movieList);
        } else if (activeTab === 'donghua') {
          const donghuaList = await AnimeService.getDonghua(page).catch(() => []);
          if (isMounted) setDonghua(Array.isArray(donghuaList) ? donghuaList.slice(0, 18) : []);
        } else if (activeTab === 'drama') {
          const dramaList = await fetchDramas(page);
          if (isMounted) setDramas(dramaList.slice(0, 18));
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
  }, [activeTab, page, fetchDramas, fetchMovies]);

  // Initial load for all tabs so counts are readily available
  useEffect(() => {
    let isMounted = true;
    async function preloadInitial() {
      try {
        const [movieList, donghuaList, dramaList] = await Promise.all([
          fetchMovies(1),
          AnimeService.getDonghua(1).catch(() => []),
          fetchDramas(1)
        ]);
        if (!isMounted) return;
        setMovies(movieList);
        setDonghua(Array.isArray(donghuaList) ? donghuaList.slice(0, 18) : []);
        setDramas(dramaList.slice(0, 18));
      } catch (e) {
        // quiet fallback
      }
    }
    preloadInitial();
    return () => { isMounted = false; };
  }, [fetchDramas, fetchMovies]);

  const handleTabChange = (tabId: MultiverseTab) => {
    setActiveTab(tabId);
    setSubFilter('all');
    setPage(1);
    setIsRealmMenuOpen(false);
  };

  const tabs = [
    {
      id: 'movies' as const,
      label: 'Feature Films',
      icon: Clapperboard,
      description: 'Theatrical anime films & cinematic specials',
      count: movies.length,
    },
    {
      id: 'donghua' as const,
      label: 'Chinese Donghua',
      icon: Swords,
      description: '3D Cultivation, martial arts & fantasy epics',
      count: donghua.length,
    },
    {
      id: 'drama' as const,
      label: 'Dramas & Live Action',
      icon: Tv,
      description: 'Asian live-action adaptations & series',
      count: dramas.length,
    },
    {
      id: 'community' as const,
      label: 'Sanctuary Whispers',
      icon: MessageSquare,
      description: 'Community discussions, theories & lore',
      count: communityPosts.length,
    },
  ];

  const activeTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];
  const ActiveIcon = activeTabObj.icon;

  const subFilters = [
    { id: 'all' as const, label: 'All' },
    { id: 'top_rated' as const, label: 'Top Rated', icon: Star },
    { id: 'recent' as const, label: 'Recent', icon: Clock },
  ];

  const getViewAllLink = () => {
    switch (activeTab) {
      case 'movies': return '/cinema#section-movies';
      case 'donghua': return '/search/donghua';
      case 'drama': return '/cinema';
      case 'community': return '/social';
      default: return '/search';
    }
  };

  // Filtered & sorted display items
  const displayedItems = useMemo(() => {
    const raw = activeTab === 'movies' ? movies : activeTab === 'donghua' ? donghua : dramas;
    if (!Array.isArray(raw)) return [];

    if (subFilter === 'top_rated') {
      return [...raw].sort((a, b) => {
        const scoreA = parseFloat(a.score || a.rating || 0) || 0;
        const scoreB = parseFloat(b.score || b.rating || 0) || 0;
        return scoreB - scoreA;
      });
    }

    if (subFilter === 'recent') {
      return [...raw].sort((a, b) => {
        const dateA = parseInt(a.releaseDate || a.year || a.date || 0, 10) || 0;
        const dateB = parseInt(b.releaseDate || b.year || b.date || 0, 10) || 0;
        return dateB - dateA;
      });
    }

    return raw;
  }, [activeTab, movies, donghua, dramas, subFilter]);

  const displayedCommunity = useMemo(() => {
    if (subFilter === 'top_rated') {
      return [...communityPosts].sort((a, b) => b.likes - a.likes);
    }
    return communityPosts;
  }, [communityPosts, subFilter]);

  return (
    <section className="w-full my-4 md:my-8 relative z-10">
      {/* Header and Controls */}
      <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6">
        
        {/* Top Tier: Title + Explore All */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="relative">
              <Compass className="w-7 h-7 md:w-9 md:h-9 text-red-500 shrink-0 drop-shadow-[0_0_14px_rgba(239,68,68,0.6)]" />
              <div className="absolute inset-0 bg-red-500/20 blur-md rounded-full -z-10" />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide flex items-center gap-2">
                SHADOW <span className="text-red-500">MULTIVERSE</span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                Beyond traditional anime — feature films, donghua, live action & sanctuary lore
              </p>
            </div>
          </div>

          <Link
            href={getViewAllLink()}
            className="text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-red-500/30 transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 group active:scale-95"
          >
            <span>Explore All</span>
            <ChevronRight size={12} className="text-red-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Filter & Tab System Bar (Clean, Non-Row Design) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-white/5">
          
          {/* Left: Clean Realm Filter Dropdown + Quick Sub-Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Realm Filter Dropdown */}
            <DropdownMenu open={isRealmMenuOpen} onOpenChange={setIsRealmMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={() => setIsRealmMenuOpen(prev => !prev)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/40 text-white transition-all text-xs font-bold active:scale-95 group shadow-sm select-none"
                  aria-label="Filter Realm"
                >
                  <SlidersHorizontal size={13} className="text-red-500 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-zinc-400 font-medium text-[11px] hidden sm:inline">Realm:</span>
                  <span className="text-white font-black uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                    <ActiveIcon size={12} className="text-red-400" />
                    <span>{activeTabObj.label}</span>
                  </span>
                  <ChevronDown size={13} className="text-zinc-400 group-hover:translate-y-0.5 transition-transform" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-[330px] sm:w-[380px] bg-[#0c0d14] !bg-opacity-100 border border-zinc-800 text-white p-2.5 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.98),0_0_30px_rgba(239,68,68,0.12)] z-[100] space-y-1.5 focus:outline-none"
              >
                <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.08] mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400">SELECT REALM</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                    4 Universes
                  </span>
                </div>
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <DropdownMenuItem
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all outline-none select-none group",
                        isActive
                          ? "bg-red-500/15 text-white border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                          isActive 
                            ? "bg-red-500/25 text-red-400 border border-red-500/40 shadow-sm shadow-red-500/20" 
                            : "bg-white/[0.04] text-zinc-400 border border-white/[0.08] group-hover:bg-white/[0.08] group-hover:text-zinc-200"
                        )}>
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col text-left min-w-0">
                          <span className={cn(
                            "text-xs font-black tracking-tight truncate",
                            isActive ? "text-white" : "text-zinc-200 group-hover:text-white"
                          )}>
                            {tab.label}
                          </span>
                          <span className="text-[10.5px] text-zinc-400 leading-snug line-clamp-1">
                            {tab.description}
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <div className="w-5 h-5 rounded-full bg-red-500/25 border border-red-500/40 flex items-center justify-center shrink-0 text-red-400">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clean Sub-Filter Tabs (All / Top Rated / Recent) */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              {subFilters.map((sf) => {
                const isSelected = subFilter === sf.id;
                const Icon = sf.icon;
                return (
                  <button
                    key={sf.id}
                    onClick={() => setSubFilter(sf.id)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all select-none active:scale-95",
                      isSelected
                        ? "bg-red-500 text-white shadow-md shadow-red-950/40"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    {Icon && <Icon size={11} />}
                    <span>{sf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Pagination (Consistent with other sections) */}
          {activeTab !== 'community' && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-400 select-none">
                <span className="text-white font-bold">{page}</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || isPaginating}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={isPaginating}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90"
                  aria-label="Next Page"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

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
            key={`community-${subFilter}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {displayedCommunity.map((post) => (
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
                  &ldquo;{post.content}&rdquo;
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
                    href="/social"
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
            key={`${activeTab}-${subFilter}-${page}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6"
          >
            {displayedItems.map((item, idx) => (
              <div key={`${item.id || item.slug || idx}-${idx}`} className="transform-gpu transition-transform duration-300 hover:scale-[1.03]">
                <AnimeCard anime={item} />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
