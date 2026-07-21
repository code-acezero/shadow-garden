"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AnimeCard from '@/components/Anime/AnimeCard';
import { MediaCard } from '@/components/Anime/MediaCard';
import { AnimeService } from '@/lib/api';
import { dpi } from '@/lib/dpi';
import { hpi } from '@/lib/hpi';
import { omni } from '@/lib/omni';
import { cn } from '@/lib/utils';
import Footer from '@/components/Anime/Footer';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, ChevronLeft, ChevronRight, Filter, X, SlidersHorizontal,
  Flame, TrendingUp, Clock, Star, Tv, Film, LayoutGrid, List,
  Calendar, Layers, Info, CheckCircle, RotateCcw, ArrowDownAZ, Hash, PlaySquare, ChevronDown
} from 'lucide-react';

// --- CONSTANTS ---

const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Isekai", "Mecha", "Mystery", "Psychological", "Romance", "Sci-Fi", "Seinen", "Shoujo", "Shounen", "Slice of Life", "Sports", "Supernatural", "Thriller"];
const TYPES = ["tv", "movie", "ova", "ona", "special"];
const STATUS_OPTIONS = ["currently-airing", "finished-airing", "not-yet-aired"];
const SEASONS = ["spring", "summer", "fall", "winter"];
const YEARS = Array.from({ length: 2027 - 2000 }, (_, i) => (2027 - i).toString());
const SORT_OPTIONS = [
  { value: "newest", label: "Latest", icon: Clock },
  { value: "popular", label: "Popular", icon: Flame },
  { value: "trending", label: "Trending", icon: TrendingUp },
  { value: "rating", label: "Top Rated", icon: Star },
];

const DONGHUA_GENRES = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Harem", "Historical", "Martial Arts", "Mecha", "Mystery", "Romance", "Sci-Fi", "Shounen", "Slice of Life"];
const DONGHUA_STATUS = ["ongoing", "completed"];
const DONGHUA_SORT = [{value: 'update', label: 'Latest', icon: Clock}, {value: 'popular', label: 'Popular', icon: Flame}, {value: 'rating', label: 'Top Rated', icon: Star}];

const HINDI_GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "TV Movie", "Thriller", "War", "Western"];
const HINDI_TYPES = ["Movie", "Series", "Drama"];
const HINDI_STATUS = ["Ongoing", "Completed"];
const HINDI_SORT = [{value: 'newest', label: 'Latest', icon: Clock}, {value: 'score', label: 'Top Rated', icon: Star}];

const DRAMA_CATEGORIES = ["korean-drama", "chinese-drama", "japanese-drama", "hindi-dubbed"];
const DRAMA_SORT = [{value: 'newest', label: 'Latest', icon: Clock}];

const MOVIES_CATEGORIES = ["action", "adventure", "animation", "biography", "cartoon", "sci-fi", "comedy", "crime", "documentary", "drama", "family", "fantasy", "history", "horror", "musical", "mystery", "romance", "sports", "thriller", "war"];
const MOVIES_COUNTRIES = ["bollywood", "hollywood"];
const MOVIES_SORT = [{value: 'newest', label: 'Latest', icon: Clock}];

const getThemeStyles = (lib: string) => {
  switch (lib) {
    case 'donghua': return { 
        bgActive: 'bg-amber-500', shadowActive: 'shadow-amber-500/30', textActive: 'text-amber-400', 
        borderActive: 'border-amber-500', bgHover: 'hover:bg-amber-500/20', textHover: 'group-hover:text-amber-300',
        textMain: 'text-amber-500', bgLight: 'bg-amber-500/10', borderLight: 'border-amber-500/30',
        glow: 'shadow-[0_0_40px_rgba(245,158,11,0.2)]', ring: 'ring-amber-500/30'
    };
    case 'hindi': return { 
        bgActive: 'bg-purple-600', shadowActive: 'shadow-purple-600/30', textActive: 'text-purple-400', 
        borderActive: 'border-purple-500', bgHover: 'hover:bg-purple-600/20', textHover: 'group-hover:text-purple-300',
        textMain: 'text-purple-500', bgLight: 'bg-purple-600/10', borderLight: 'border-purple-500/30',
        glow: 'shadow-[0_0_40px_rgba(147,51,234,0.2)]', ring: 'ring-purple-500/30'
    };
    case 'drama': return { 
        bgActive: 'bg-cyan-500', shadowActive: 'shadow-cyan-500/30', textActive: 'text-cyan-400', 
        borderActive: 'border-cyan-500', bgHover: 'hover:bg-cyan-500/20', textHover: 'group-hover:text-cyan-300',
        textMain: 'text-cyan-500', bgLight: 'bg-cyan-500/10', borderLight: 'border-cyan-500/30',
        glow: 'shadow-[0_0_40px_rgba(6,182,212,0.2)]', ring: 'ring-cyan-500/30'
    };
    case 'movies': return { 
        bgActive: 'bg-emerald-500', shadowActive: 'shadow-emerald-500/30', textActive: 'text-emerald-400', 
        borderActive: 'border-emerald-500', bgHover: 'hover:bg-emerald-500/20', textHover: 'group-hover:text-emerald-300',
        textMain: 'text-emerald-500', bgLight: 'bg-emerald-500/10', borderLight: 'border-emerald-500/30',
        glow: 'shadow-[0_0_40px_rgba(16,185,129,0.2)]', ring: 'ring-emerald-500/30'
    };
    default: return { 
        bgActive: 'bg-primary-600', shadowActive: 'shadow-primary-600/30', textActive: 'text-primary-400', 
        borderActive: 'border-primary-500', bgHover: 'hover:bg-primary-600/20', textHover: 'group-hover:text-primary-300',
        textMain: 'text-primary-500', bgLight: 'bg-primary-600/10', borderLight: 'border-primary-500/30',
        glow: 'shadow-[0_0_40px_rgba(225,29,72,0.2)]', ring: 'ring-primary-500/30'
    };
  }
};

// --- PREMIUM SUB COMPONENTS ---
function PremiumFilterChip({ label, active, onClick, themeStyles }: { label: string; active: boolean; onClick: () => void; themeStyles: any }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-[11px] md:text-xs font-bold transition-all duration-300 backdrop-blur-md ${
        active
          ? `${themeStyles.bgActive} text-white shadow-lg ${themeStyles.shadowActive} border border-transparent`
          : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white hover:border-white/20'
      }`}
    >
      {label}
    </motion.button>
  );
}

function PremiumSelect({ label, icon: Icon, options, value, onChange, themeStyles }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-zinc-300 text-xs font-bold transition-all duration-300 w-full hover:bg-white/10 ${open ? `ring-2 ${themeStyles.ring}` : ''}`}
      >
        <div className={`p-1.5 rounded-lg ${open ? themeStyles.bgActive : 'bg-white/10'} transition-colors`}>
            <Icon size={14} className={open ? 'text-white' : 'text-zinc-400'} />
        </div>
        <span className="flex-1 text-left truncate uppercase tracking-wider">{value?.replace(/-/g, ' ') || label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3, ease: 'backOut' }}>
          <ChevronDown size={14} className="text-zinc-500" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 left-0 right-0 bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="max-h-56 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              <button
                onClick={() => { onChange(""); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-xs text-zinc-400 hover:bg-white/10 rounded-xl transition-all font-bold tracking-wide"
              >
                ANY
              </button>
              {options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-xs rounded-xl transition-all flex justify-between items-center uppercase font-bold tracking-wide ${
                    value === opt ? `${themeStyles.bgLight} ${themeStyles.textActive} border border-white/5` : 'text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  {opt.replace(/-/g, ' ')}
                  {value === opt && <CheckCircle size={14} className={themeStyles.textActive} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- MAIN CONTENT ---
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const keyword = searchParams.get('keyword') || '';
  const genresParam = searchParams.get('genres') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1');
  const modeParam = searchParams.get('mode') || '';
  const libraryParam = searchParams.get('library') || 'main';

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [maxPage, setMaxPage] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState(libraryParam);

  // Filter state
  const [query, setQuery] = useState(keyword);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(genresParam ? genresParam.split(',') : []);
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSort, setSelectedSort] = useState(sortParam);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      let data: any;

      if (selectedLibrary === 'donghua') {
        if (keyword) {
            const res = await dpi.search(keyword, currentPage);
            data = { results: res, currentPage, hasNextPage: res.length >= 20 };
        } else if (selectedGenres.length > 0 || selectedType || selectedStatus || selectedSort !== 'update') {
            const params: Record<string, any> = { page: currentPage };
            if (selectedGenres.length) params.genre = selectedGenres.join(',');
            if (selectedType) params.type = selectedType;
            if (selectedStatus) params.status = selectedStatus;
            params.order = selectedSort === 'newest' ? 'update' : selectedSort;
            const res = await dpi.filter(params);
            data = { results: res, currentPage, hasNextPage: res.length >= 24 };
        } else {
            const res = await dpi.filter({ order: 'update', page: currentPage });
            data = { results: res, currentPage, hasNextPage: res.length >= 24 };
        }
      } else if (selectedLibrary === 'hindi') {
        if (keyword) {
            const res = await hpi.hindi.search(keyword, currentPage);
            data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage, maxPage: res.pagination?.totalPages };
        } else if (selectedGenres.length > 0 || selectedType || selectedStatus || selectedSort !== 'newest') {
            const params: Record<string, any> = { page: currentPage };
            if (selectedGenres.length) params.genre = selectedGenres.join(',');
            if (selectedType) params.type = selectedType;
            if (selectedStatus) params.status = selectedStatus;
            if (selectedSort !== 'newest') params.sort = selectedSort;
            const res = await hpi.hindi.filter(params);
            data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage, maxPage: res.pagination?.totalPages };
        } else {
            const res = await hpi.hindi.filter({ sort: 'updated_at', page: currentPage });
            data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage, maxPage: res.pagination?.totalPages };
        }
      } else if (selectedLibrary === 'drama') {
        if (keyword) {
            const res = await omni.drama.search(keyword, currentPage);
            data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage, maxPage: res.pagination?.totalPages };
        } else if (selectedGenres.length > 0) {
            const res = await omni.drama.getByCountry(selectedGenres[0].replace('-drama', ''), currentPage);
            data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage, maxPage: res.pagination?.totalPages };
        } else {
            const res = await omni.drama.getByCountry('korean', currentPage);
            data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage, maxPage: res.pagination?.totalPages };
        }
      } else if (selectedLibrary === 'movies') {
        if (keyword) {
            const res = await omni.movies.search(keyword, currentPage);
            data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage, maxPage: res.pagination?.totalPages };
        } else if (selectedGenres.length > 0) {
            const cat = selectedGenres[0];
            if (MOVIES_COUNTRIES.includes(cat)) {
                const res = await omni.movies.getByCountry(cat, currentPage);
                data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage, maxPage: res.pagination?.totalPages };
            } else {
                const res = await omni.movies.getByGenre(cat, currentPage);
                data = { results: res.items || [], hasNextPage: res.pagination?.hasNextPage, currentPage: res.pagination?.currentPage, maxPage: res.pagination?.totalPages };
            }
        } else {
            const res = await omni.movies.getHome();
            const items = res.sections.flatMap(s => s.items);
            data = { results: items, hasNextPage: false, currentPage: 1 };
        }
      } else {
        if (modeParam === 'az') {
          data = await AnimeService.getFilteredAnime('recent', currentPage);
        } else if (keyword) {
          data = await AnimeService.search(keyword, currentPage);
        } else if (selectedGenres.length > 0 || selectedType || selectedStatus || selectedSeason || selectedYear) {
          const params: Record<string, any> = { page: currentPage };
          if (selectedGenres.length) params.genres = selectedGenres.join(',').toLowerCase();
          if (selectedType) params.type = selectedType;
          if (selectedStatus) params.status = selectedStatus;
          if (selectedSeason) params.season = selectedSeason;
          if (selectedYear) params.year = selectedYear;
          const filterResults = await AnimeService.filter(params);
          data = { results: filterResults, currentPage, hasNextPage: filterResults.length >= 20 };
        } else {
          data = await AnimeService.getFilteredAnime(selectedSort === 'popular' ? 'popular' : selectedSort === 'trending' ? 'trending' : 'recent', currentPage);
        }
      }

      setResults(data?.results || data || []);
      setHasNextPage(data?.hasNextPage ?? false);
      setMaxPage(data?.maxPage);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, currentPage, selectedGenres, selectedType, selectedStatus, selectedSeason, selectedYear, selectedSort, modeParam, selectedLibrary]);

  useEffect(() => {
    fetchResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchResults]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('keyword', query);
    if (selectedGenres.length) params.set('genres', selectedGenres.join(','));
    if (selectedSort !== 'newest' && selectedSort !== 'update') params.set('sort', selectedSort);
    if (selectedLibrary !== 'main') params.set('library', selectedLibrary);
    router.push(`/search?${params.toString()}`);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre.toLowerCase()) ? prev.filter(g => g !== genre.toLowerCase()) : [...prev, genre.toLowerCase()]
    );
  };

  const resetFilters = () => {
    setSelectedGenres([]);
    setSelectedType('');
    setSelectedStatus('');
    setSelectedSeason('');
    setSelectedYear('');
    setSelectedSort(selectedLibrary === 'donghua' ? 'update' : 'newest');
    setQuery('');
  };

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/search?${params.toString()}`);
    setCurrentPage(page);
  };

  const pageNumbers = () => {
    const pages: (number | string)[] = [];
    const total = maxPage || (hasNextPage ? currentPage + 1 : currentPage);
    const range = 2;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > range + 2) pages.push('...');
      for (let i = Math.max(2, currentPage - range); i <= Math.min(total - 1, currentPage + range); i++) pages.push(i);
      if (currentPage < total - range - 1) pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  const themeStyles = getThemeStyles(selectedLibrary);

  const LIBRARIES = [
    { id: 'main', label: 'Anime', icon: Tv },
    { id: 'donghua', label: 'Donghua', icon: Flame },
    { id: 'hindi', label: 'Hindi', icon: Film },
    { id: 'drama', label: 'Drama', icon: Layers },
    { id: 'movies', label: 'Movies', icon: PlaySquare }
  ];

  return (
    <div className="w-full h-full bg-[#020202] text-white selection:bg-white/20">
      {/* 
        PREMIUM HERO HEADER 
        Uses glassmorphism, dynamic glowing blobs, and sleek typography 
      */}
      <div className="relative pt-[calc(env(safe-area-inset-top)+80px)] md:pt-[calc(env(safe-area-inset-top)+56px)] pb-12 px-4 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        
        {/* Animated glowing blob matching the theme */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            className={`absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] md:w-[1000px] h-[400px] ${themeStyles.bgActive} rounded-[100%] blur-[120px] pointer-events-none`} 
        />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 mb-6">
            <div className={`h-px w-12 bg-gradient-to-r from-transparent ${themeStyles.bgActive} to-transparent`} />
            <span className={`${themeStyles.textMain} text-xs tracking-[0.4em] font-black uppercase font-lemon`}>
              {modeParam === 'az' ? 'Index' : keyword ? 'Search Results' : 'Explore Library'}
            </span>
            <div className={`h-px w-12 bg-gradient-to-r from-transparent ${themeStyles.bgActive} to-transparent`} />
          </motion.div>
          
          <motion.h1 initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }} className="text-5xl md:text-7xl text-white mb-8 font-gradvis drop-shadow-2xl font-black">
            {modeParam === 'az' ? (
              <>A-Z <span className={themeStyles.textMain}>INDEX</span></>
            ) : keyword ? (
              <>SEARCH <span className={themeStyles.textMain}>RESULTS</span></>
            ) : (
              <>SHADOW <span className={themeStyles.textMain}>LIBRARY</span></>
            )}
          </motion.h1>
          
          {/* Library Tabs (Glassmorphic Pill) */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="inline-flex flex-wrap justify-center p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl md:rounded-full gap-1 shadow-2xl mb-8">
            {LIBRARIES.map(lib => {
                const isActive = selectedLibrary === lib.id;
                return (
                    <button
                        key={lib.id}
                        onClick={() => {
                            setSelectedLibrary(lib.id);
                            setSelectedGenres([]);
                            setSelectedType('');
                            setSelectedStatus('');
                            setSelectedSeason('');
                            setSelectedYear('');
                            setSelectedSort(lib.id === 'donghua' ? 'update' : 'newest');
                            const params = new URLSearchParams(searchParams.toString());
                            params.set('library', lib.id);
                            params.delete('page');
                            params.delete('genres');
                            params.delete('type');
                            params.delete('status');
                            params.delete('sort');
                            router.push(`/search?${params.toString()}`);
                        }}
                        className={`relative flex items-center gap-2 px-6 py-3 text-xs md:text-sm font-bold uppercase transition-colors duration-300 rounded-full overflow-hidden ${
                          isActive ? 'text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeLibraryTab"
                                className={`absolute inset-0 ${themeStyles.bgActive} shadow-lg ${themeStyles.shadowActive} rounded-full`}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <lib.icon size={16} className={isActive ? 'text-white' : ''} />
                            {lib.label}
                        </span>
                    </button>
                )
            })}
          </motion.div>

          {/* Premium Search Bar */}
          <motion.form initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} onSubmit={handleSearch} className="w-full max-w-3xl mx-auto flex flex-col md:flex-row gap-4 relative">
            <div className="relative flex-1 group">
              <div className={`absolute -inset-1 bg-gradient-to-r from-transparent via-${themeStyles.bgActive.replace('bg-', '')}/30 to-transparent rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-500`} />
              <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-[2rem] px-2 h-16 shadow-xl transition-all focus-within:border-white/20">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-full ${themeStyles.bgLight} ${themeStyles.textMain} ml-1`}>
                      <Search size={20} />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${LIBRARIES.find(l=>l.id===selectedLibrary)?.label} universe...`}
                    className="flex-1 bg-transparent border-none outline-none text-white text-base md:text-lg px-4 placeholder-zinc-600 font-medium h-full"
                  />
                  {query && (
                    <button type="button" onClick={() => setQuery('')} className="p-3 text-zinc-500 hover:text-white transition-colors mr-2">
                      <X size={20} />
                    </button>
                  )}
              </div>
            </div>
            
            <div className="flex gap-2 h-16 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-6 rounded-[2rem] font-bold transition-all duration-300 border ${
                    showFilters 
                        ? `${themeStyles.bgLight} ${themeStyles.borderLight} ${themeStyles.textActive}` 
                        : 'bg-[#0a0a0a] border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <SlidersHorizontal size={20} />
                  <span className="hidden md:block uppercase tracking-wider text-xs">Filters</span>
                </button>
                <button
                  type="submit"
                  className={`flex items-center justify-center px-8 ${themeStyles.bgActive} rounded-[2rem] text-sm font-bold uppercase tracking-wider transition-all duration-300 ${themeStyles.glow} text-white hover:scale-105`}
                >
                  Search
                </button>
            </div>
          </motion.form>
        </div>
      </div>

      {/* Filters Panel (Glassmorphic Accordion) */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-b border-white/5 bg-white/[0.02]"
          >
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
              {/* Genres Container */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-xl ${themeStyles.bgActive}`}><Hash size={16} className="text-white" /></div>
                    <span className="text-sm font-black text-white uppercase tracking-widest">{selectedLibrary === 'drama' || selectedLibrary === 'movies' ? 'Categories' : 'Genres'}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {(() => {
                    const activeGenres = selectedLibrary === 'donghua' ? DONGHUA_GENRES : selectedLibrary === 'hindi' ? HINDI_GENRES : selectedLibrary === 'drama' ? DRAMA_CATEGORIES : selectedLibrary === 'movies' ? [...MOVIES_COUNTRIES, ...MOVIES_CATEGORIES] : GENRES;
                    return activeGenres.map(g => (
                      <PremiumFilterChip
                        key={g}
                        label={g.replace(/-/g, ' ')}
                        active={selectedGenres.includes(g.toLowerCase())}
                        themeStyles={themeStyles}
                        onClick={() => {
                          if (selectedLibrary === 'drama' || selectedLibrary === 'movies') {
                            setSelectedGenres(selectedGenres.includes(g) ? [] : [g]);
                          } else {
                            toggleGenre(g);
                          }
                        }}
                      />
                    ));
                  })()}
                </div>
              </div>

              {/* Dropdowns Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {selectedLibrary !== 'donghua' && selectedLibrary !== 'drama' && selectedLibrary !== 'movies' && <PremiumSelect label="Type" icon={Tv} options={selectedLibrary === 'hindi' ? HINDI_TYPES : TYPES} value={selectedType} onChange={setSelectedType} themeStyles={themeStyles} />}
                {selectedLibrary !== 'drama' && selectedLibrary !== 'movies' && <PremiumSelect label="Status" icon={Info} options={selectedLibrary === 'donghua' ? DONGHUA_STATUS : selectedLibrary === 'hindi' ? HINDI_STATUS : STATUS_OPTIONS} value={selectedStatus} onChange={setSelectedStatus} themeStyles={themeStyles} />}
                {selectedLibrary === 'main' && <PremiumSelect label="Season" icon={Calendar} options={SEASONS} value={selectedSeason} onChange={setSelectedSeason} themeStyles={themeStyles} />}
                {selectedLibrary === 'main' && <PremiumSelect label="Year" icon={Layers} options={YEARS} value={selectedYear} onChange={setSelectedYear} themeStyles={themeStyles} />}
              </div>

              {/* Filter Actions */}
              <div className="flex justify-between items-center pt-6 border-t border-white/5">
                <button onClick={resetFilters} className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">
                  <RotateCcw size={16} /> Reset Filters
                </button>
                <button
                  onClick={handleSearch}
                  className={`px-8 py-3 ${themeStyles.bgActive} rounded-full text-sm font-bold transition-all shadow-lg ${themeStyles.shadowActive} text-white uppercase tracking-widest hover:scale-105`}
                >
                  Apply & Search
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        
        {/* Sort & Stats Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-[#0a0a0a] p-4 rounded-3xl border border-white/5 shadow-2xl">
            <div className="flex items-center gap-4 text-sm font-bold text-zinc-400 pl-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-zinc-600" /> : <div className={`w-2 h-2 rounded-full ${themeStyles.bgActive} animate-pulse`} />}
                {!loading && results.length > 0 ? (
                    <span className="uppercase tracking-widest">Found <span className="text-white">{results.length}+</span> results</span>
                ) : (
                    <span className="uppercase tracking-widest">Searching...</span>
                )}
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                {(selectedLibrary === 'donghua' ? DONGHUA_SORT : selectedLibrary === 'hindi' ? HINDI_SORT : selectedLibrary === 'drama' ? DRAMA_SORT : selectedLibrary === 'movies' ? MOVIES_SORT : SORT_OPTIONS).map(opt => (
                <button
                    key={opt.value}
                    onClick={() => {
                        setSelectedSort(opt.value);
                        if (!keyword) {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set('sort', opt.value);
                            params.delete('page');
                            router.push(`/search?${params.toString()}`);
                        }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 uppercase tracking-widest whitespace-nowrap ${
                    selectedSort === opt.value
                        ? `${themeStyles.bgLight} ${themeStyles.textActive} ring-1 ${themeStyles.ring}`
                        : 'bg-transparent text-zinc-500 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <opt.icon size={14} />
                    {opt.label}
                </button>
                ))}
            </div>
        </div>

        {/* Loading / Empty / Results */}
        {loading ? (
          <div className="h-[40vh] flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className={`absolute inset-0 ${themeStyles.bgActive} blur-2xl opacity-20 rounded-full animate-pulse`} />
                <Loader2 className={`w-12 h-12 animate-spin ${themeStyles.textMain} relative z-10`} />
            </div>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest animate-pulse">Scanning the archives...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="h-[40vh] flex flex-col items-center justify-center gap-6 text-center">
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
                <Search size={40} className="text-zinc-700 relative z-10" />
            </div>
            <div>
                <h3 className="text-2xl font-black text-white mb-2 font-gradvis">Void Encountered</h3>
                <p className="text-zinc-500 text-sm max-w-md mx-auto">
                {keyword ? `We searched the entire ${selectedLibrary} universe but couldn't find "${keyword}".` : 'Try adjusting your filters or search terms to uncover hidden gems.'}
                </p>
            </div>
            <button onClick={resetFilters} className={`mt-4 px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all border border-white/10 hover:${themeStyles.bgLight} hover:${themeStyles.textActive}`}>
              Reset Everything
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
          >
            {results.map((item: any, i: number) => {
              if (selectedLibrary === 'drama' || selectedLibrary === 'movies') {
                  return (
                      <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.05, 0.5) }}>
                          <MediaCard item={item} theme={selectedLibrary === 'drama' ? 'cyan' : 'emerald'} />
                      </motion.div>
                  );
              } else {
                  return (
                      <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.05, 0.5) }}>
                          <AnimeCard anime={item} />
                      </motion.div>
                  );
              }
            })}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && results.length > 0 && (
            <div className="mt-16 flex justify-center items-center gap-2">
                <button
                    onClick={() => currentPage > 1 && navigateToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all uppercase tracking-widest ${
                    currentPage === 1
                        ? 'opacity-30 cursor-not-allowed bg-transparent text-zinc-600'
                        : `bg-white/5 border border-white/10 text-zinc-300 ${themeStyles.bgHover} hover:text-white hover:border-white/20`
                    }`}
                >
                    <ChevronLeft size={16} /> Prev
                </button>

                <div className="hidden md:flex gap-2">
                    {pageNumbers().map((p, i) =>
                        typeof p === 'string' ? (
                        <span key={`ellipsis-${i}`} className="text-zinc-700 px-2 flex items-end pb-2">···</span>
                        ) : (
                        <button
                            key={p}
                            onClick={() => navigateToPage(p)}
                            className={`w-12 h-12 flex items-center justify-center rounded-2xl text-sm font-black transition-all ${
                            p === currentPage
                                ? `${themeStyles.bgActive} text-white shadow-lg ${themeStyles.shadowActive} scale-110`
                                : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {p}
                        </button>
                        )
                    )}
                </div>

                <button
                    onClick={() => hasNextPage && navigateToPage(currentPage + 1)}
                    disabled={!hasNextPage}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all uppercase tracking-widest ${
                    !hasNextPage
                        ? 'opacity-30 cursor-not-allowed bg-transparent text-zinc-600'
                        : `bg-white/5 border border-white/10 text-zinc-300 ${themeStyles.bgHover} hover:text-white hover:border-white/20`
                    }`}
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020202]" />}>
      <SearchContent />
    </Suspense>
  );
}
