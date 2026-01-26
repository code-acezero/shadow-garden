"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, ArrowRight, Filter, SortAsc, CheckCircle, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AnimeAPI_Hindi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- HINDI FILTER CONSTANTS ---
// Hindi API usually has fewer specific filters, so we keep it streamlined
const HINDI_GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi", "Slice of Life", "Thriller"];
const LANGUAGES = ["Hindi", "Tamil", "Telugu", "English"];

interface HindiSearchProps {
  onClose: () => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  onToggleMode: () => void; // To switch back to Global
}

export default function HindiSearchBar({ onClose, isActive, setIsActive, onToggleMode }: HindiSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ genre: [] as string[], language: "" });

  // --- SEARCH SUGGESTIONS ---
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsLoading(true);
        try {
          // Use Hindi API Search
          const data = await AnimeAPI_Hindi.search(query, 1);
          if (data?.results) {
            setSuggestions(data.results.slice(0, 5));
          }
        } catch (e) { setSuggestions([]); } finally { setIsLoading(false); }
      } else setSuggestions([]);
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsActive(false); setShowFilters(false);
    const params = new URLSearchParams();
    if (query) params.set('keyword', query);
    // Note: Hindi API search page might need specific params, adjusting standard ones:
    if (filters.language) params.set('lang', filters.language.toLowerCase());
    router.push(`/search/hindi?${params.toString()}`);
  };

  return (
    <div className="w-full h-full flex items-center relative group">
      {/* Hindi Indicator Icon */}
      <div className="h-full w-10 flex items-center justify-center shrink-0 text-orange-500">
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Languages className="w-4 h-4" />}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 h-full flex items-center relative">
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          onFocus={() => setIsActive(true)} 
          placeholder="Search Hindi/Dubbed Anime..."
          className="bg-transparent border-none outline-none focus:ring-0 text-white placeholder-zinc-500 text-[11px] md:text-xs h-full w-full pr-2 font-medium" 
        />
      </form>

      {/* Actions */}
      <div className="flex items-center gap-1 pr-1.5">
        {query && <button onClick={handleSubmit} className="p-1 bg-orange-600 text-white rounded-full hover:bg-orange-700 shadow-lg"><ArrowRight size={12} /></button>}
        {(query || isActive) && <button onClick={(e) => { e.stopPropagation(); setQuery(''); setIsActive(false); setShowFilters(false); onClose(); }} className="p-1 text-zinc-500 hover:text-white"><X size={12} /></button>}
        
        <div className="w-px h-3 bg-white/10 mx-1" />
        
        <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); setShowFilters(!showFilters); setIsActive(true); }} 
            className={cn("p-1.5 rounded-full transition-colors", showFilters ? "text-orange-400 bg-orange-500/10" : "text-zinc-400 hover:text-white")}
        >
            <Filter size={12} />
        </button>
      </div>

      {/* --- DROPDOWNS (Absolute) --- */}
      <AnimatePresence>
        {/* 1. FILTERS */}
        {showFilters && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-[120%] left-0 right-0 bg-black/90 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-4 shadow-2xl z-50">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Hindi Archive Filters</span>
                    <button onClick={onToggleMode} className="text-[9px] px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-white transition-colors">Switch to Global</button>
                </div>
                
                <div className="space-y-3">
                    {/* Genres */}
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scroll">
                        {HINDI_GENRES.map(g => (
                            <button 
                                key={g} 
                                onClick={() => setFilters(p => ({...p, genre: p.genre.includes(g) ? p.genre.filter(i => i !== g) : [...p.genre, g]}))} 
                                className={cn("px-2 py-1 rounded-md text-[9px] font-bold border transition-all", filters.genre.includes(g) ? "bg-orange-600 border-orange-500 text-white" : "bg-white/5 border-white/5 text-zinc-400")}
                            >
                                {g}
                            </button>
                        ))}
                    </div>

                    {/* Language Select */}
                    <div className="grid grid-cols-2 gap-2">
                        {LANGUAGES.map(lang => (
                            <button 
                                key={lang} 
                                onClick={() => setFilters(p => ({...p, language: p.language === lang ? "" : lang}))}
                                className={cn("flex items-center justify-between px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase", filters.language === lang ? "border-orange-500/50 bg-orange-500/10 text-orange-400" : "border-white/10 bg-white/5 text-zinc-400")}
                            >
                                {lang} {filters.language === lang && <CheckCircle size={10} />}
                            </button>
                        ))}
                    </div>

                    <Button size="sm" onClick={handleSubmit} className="w-full h-8 text-[10px] bg-orange-600 hover:bg-orange-700 text-white mt-2">Search Archives</Button>
                </div>
            </motion.div>
        )}

        {/* 2. SUGGESTIONS */}
        {isActive && suggestions.length > 0 && !showFilters && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-[120%] left-0 right-0 bg-[#0a0a0a]/95 border border-orange-500/20 rounded-2xl shadow-2xl p-1 z-50">
                {suggestions.map((s: any) => (
                    <div key={s.id} onClick={() => router.push(`/watch/${s.id}`)} className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-xl cursor-pointer group transition-all">
                        <img src={s.poster} className="w-8 h-10 object-cover rounded bg-zinc-800" alt="" />
                        <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate group-hover:text-orange-500">{s.title}</div>
                            <div className="text-[9px] text-zinc-500 font-medium uppercase">Hindi • {s.type || "TV"}</div>
                        </div>
                    </div>
                ))}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}