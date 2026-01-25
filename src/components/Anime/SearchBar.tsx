"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, X, Loader2, PlayCircle, Clock, Image as ImageIcon, 
  Sparkles, Filter, Calendar, Layers, Tag, Tv, Dices, RotateCcw
} from 'lucide-react';
import { useRouter } from 'next/navigation'; 
import { motion, AnimatePresence } from 'framer-motion';
import { AnimeService } from '@/lib/api'; 
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- TYPES ---
interface SearchResult {
  id: string;
  title: string;
  image: string;
  releaseDate?: string;
  type?: string;
}

// --- CONSTANTS ---
const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Isekai", 
  "Magic", "Mystery", "Romance", "Sci-Fi", "Shounen", "Slice of Life", "Supernatural"
];

const SEASONS = ["spring", "summer", "fall", "winter"];
const STATUSES = ["currently_airing", "finished_airing", "not_yet_aired"];
const TYPES = ["tv", "movie", "ova", "ona", "special"];
const YEARS = Array.from({ length: 2026 - 1990 }, (_, i) => (2026 - i).toString());

const PLACEHOLDERS = [
  "Summon Solo Leveling...", "Find One Piece...", "Search Jujutsu Kaisen...", 
  "Discover Chainsaw Man...", "Explore Shadow Garden..."
];

export default function SearchBar() {
  const router = useRouter(); 
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // State
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRandomLoading, setIsRandomLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Filters State
  const [filters, setFilters] = useState({
    genre: "",
    season: "",
    year: "",
    type: "",
    status: ""
  });

  // Animated Placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000); 
    return () => clearInterval(interval);
  }, []);

  // Search Logic (Universal API)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsLoading(true);
        setShowResults(true);
        try {
          const data = await AnimeService.getSearchSuggestions(query);
          if (data) {
            const cleanResults: SearchResult[] = data.map((item: any) => ({
              id: item.id,
              title: item.title,
              image: item.poster,
              releaseDate: item.date || 'TBA',
              type: item.type || "TV",
            })).slice(0, 6);
            setSuggestions(cleanResults);
          }
        } catch (error) {
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowResults(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers
  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setShowResults(false);
    setShowFilters(false);
    
    const params = new URLSearchParams();
    if (query) params.set('keyword', query);
    if (filters.genre && filters.genre !== "all") params.set('genres', filters.genre.toLowerCase());
    if (filters.season && filters.season !== "all") params.set('season', filters.season);
    if (filters.year && filters.year !== "all") params.set('year', filters.year);
    if (filters.type && filters.type !== "all") params.set('type', filters.type);
    if (filters.status && filters.status !== "all") params.set('status', filters.status);

    router.push(`/search?${params.toString()}`);
  };

  const handleRandomSummon = async () => {
    setIsRandomLoading(true);
    try {
      const anime = await AnimeService.getRandomAnime();
      if (anime?.id) {
        setShowFilters(false);
        router.push(`/watch/${anime.id}`);
      }
    } catch (error) {
      console.error("Failed to summon random anime");
    } finally {
      setIsRandomLoading(false);
    }
  };

  const handleSuggestionClick = (animeId: string) => {
    setShowResults(false);
    router.push(`/watch/${animeId}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ genre: "", season: "", year: "", type: "", status: "" });
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== "all").length;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl z-50">
      
      {/* SEARCH CAPSULE */}
      <form onSubmit={handleSearchSubmit} className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-transparent to-blue-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className="relative flex flex-col bg-[#0a0a0a]/90 border border-white/10 rounded-2xl backdrop-blur-3xl shadow-2xl transition-all focus-within:border-red-500/50 overflow-hidden">
            
            <div className="flex items-center h-12">
                <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-red-500 transition-colors">
                    <Search className="w-5 h-5" />
                </div>

                <div className="relative flex-1 h-full">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full h-full bg-transparent border-none focus:ring-0 text-gray-100 text-sm placeholder-transparent relative z-10"
                    />
                    
                    <AnimatePresence mode="wait">
                        {!query && (
                            <motion.div 
                                key={placeholderIndex}
                                initial={{ opacity: 0, x: 5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -5 }}
                                className="absolute inset-0 flex items-center pointer-events-none text-gray-500/60 text-sm select-none"
                            >
                                {PLACEHOLDERS[placeholderIndex]}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-1.5 pr-2">
                    <AnimatePresence>
                        {isLoading && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                <Loader2 className="w-4 h-4 text-red-500 animate-spin mr-1" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {query && (
                         <button type="button" onClick={() => setQuery('')} className="p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                             <X className="w-4 h-4" />
                         </button>
                    )}

                    <div className="w-px h-5 bg-white/10 mx-1" />

                    <button 
                        type="button" 
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "relative p-1.5 rounded-lg transition-all",
                            showFilters || activeFilterCount > 0 ? "bg-red-600/20 text-red-400" : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-black flex items-center justify-center text-[7px] font-bold text-white">{activeFilterCount}</span>}
                    </button>

                    <button type="button" onClick={() => router.push('/ai/imagesearch')} className="group/ai relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/5 transition-all">
                          <ImageIcon className="w-4 h-4 text-gray-400 group-hover/ai:text-blue-400 transition-colors" />
                          <Sparkles className="w-2 h-2 text-yellow-400 absolute top-1.5 right-1.5 animate-pulse" />
                    </button>
                </div>
            </div>

            {/* FILTER PANEL */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div 
                        initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        className="border-t border-white/5 bg-black/40 overflow-hidden"
                    >
                        <div className="p-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                             <Select value={filters.genre} onValueChange={(v) => handleFilterChange('genre', v)}>
                                <SelectTrigger className="h-8 text-[10px] bg-white/5 border-white/10 text-gray-300 focus:ring-0">
                                    <Tag className="w-3 h-3 mr-2 opacity-50"/> <SelectValue placeholder="Genre" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0f0f0f] border-white/10 text-gray-300">
                                    <SelectItem value="all">All Genres</SelectItem>
                                    {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                </SelectContent>
                             </Select>

                             <Select value={filters.season} onValueChange={(v) => handleFilterChange('season', v)}>
                                <SelectTrigger className="h-8 text-[10px] bg-white/5 border-white/10 text-gray-300">
                                    <Calendar className="w-3 h-3 mr-2 opacity-50"/> <SelectValue placeholder="Season" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0f0f0f] border-white/10 text-gray-300 uppercase">
                                    <SelectItem value="all">All Seasons</SelectItem>
                                    {SEASONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                             </Select>

                             <Select value={filters.year} onValueChange={(v) => handleFilterChange('year', v)}>
                                <SelectTrigger className="h-8 text-[10px] bg-white/5 border-white/10 text-gray-300">
                                    <Clock className="w-3 h-3 mr-2 opacity-50"/> <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0f0f0f] border-white/10 text-gray-300 max-h-[200px]">
                                    <SelectItem value="all">All Years</SelectItem>
                                    {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                             </Select>

                             <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
                                <SelectTrigger className="h-8 text-[10px] bg-white/5 border-white/10 text-gray-300">
                                    <Tv className="w-3 h-3 mr-2 opacity-50"/> <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0f0f0f] border-white/10 text-gray-300 uppercase">
                                    <SelectItem value="all">All Types</SelectItem>
                                    {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                             </Select>
                             
                             <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                                <SelectTrigger className="h-8 text-[10px] bg-white/5 border-white/10 text-gray-300">
                                    <Layers className="w-3 h-3 mr-2 opacity-50"/> <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0f0f0f] border-white/10 text-gray-300 uppercase">
                                    <SelectItem value="all">All Status</SelectItem>
                                    {STATUSES.map(s => <SelectItem key={s} value={s.replace(/_/g, ' ')}>{s.replace(/_/g, ' ')}</SelectItem>)}
                                </SelectContent>
                             </Select>
                        </div>
                        
                        <div className="px-3 pb-3 flex items-center justify-between">
                            <button 
                                type="button" 
                                onClick={clearFilters} 
                                className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-white transition-colors"
                            >
                                <RotateCcw size={10} /> Reset
                            </button>

                            <div className="flex gap-2">
                                {/* ✅ RANDOM SUMMON BUTTON MOVED HERE */}
                                <Button 
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRandomSummon}
                                    disabled={isRandomLoading}
                                    className="h-7 text-[10px] bg-white/5 border-white/10 hover:bg-yellow-500/20 hover:text-yellow-500 text-gray-300 rounded-md px-4"
                                >
                                    {isRandomLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Dices className="w-3 h-3 mr-2" />}
                                    Random Summon
                                </Button>

                                <Button 
                                    type="submit" 
                                    size="sm" 
                                    className="h-7 text-[10px] bg-red-600 hover:bg-red-700 text-white rounded-md px-4"
                                >
                                    Apply & Search
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </form>

      {/* SUGGESTIONS DROPDOWN */}
      <AnimatePresence>
        {showResults && (suggestions.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-3 bg-[#0a0a0a]/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-xl overflow-hidden z-[100]"
          >
            <div className="p-2 space-y-1 relative z-10">
              <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex justify-between border-b border-white/5 mb-1">
                <span>Summoning Intel...</span>
                <span className="text-red-500">{suggestions.length} Found</span>
              </div>
              
              {suggestions.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleSuggestionClick(item.id)}
                  className="group relative flex items-center gap-4 p-2 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                >
                  <div className="relative w-10 h-14 rounded-md overflow-hidden flex-shrink-0 border border-white/10 shadow-lg bg-zinc-900">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-200 group-hover:text-red-400 truncate transition-colors">{item.title}</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="text-[9px] px-1.5 py-px rounded border border-white/10 text-gray-400 flex items-center gap-1 bg-black/20 font-mono">
                            <Clock size={8}/> {item.releaseDate}
                        </span>
                        <span className="text-[9px] px-1.5 py-px rounded border border-white/10 text-gray-400 bg-black/20 font-bold uppercase tracking-tighter">
                            {item.type}
                        </span>
                    </div>
                  </div>

                  <div className="mr-2 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all text-red-500">
                    <PlayCircle size={18} />
                  </div>
                </div>
              ))}
            </div>

            <div 
              onClick={() => handleSearchSubmit()}
              className="p-3 bg-white/5 border-t border-white/5 text-center text-xs font-bold text-gray-400 hover:text-white cursor-pointer hover:bg-red-600/10 transition-colors flex items-center justify-center gap-2"
            >
              See all results <PlayCircle size={12} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}