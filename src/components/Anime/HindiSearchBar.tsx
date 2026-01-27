"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, ArrowRight, X, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AnimeAPI_Hindi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface HindiSearchProps {
  onClose: () => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  onToggleMode: () => void; 
}

export default function HindiSearchBar({ onClose, isActive, setIsActive, onToggleMode }: HindiSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- SEARCH SUGGESTIONS ---
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsLoading(true);
        try {
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
    setIsActive(false);
    const params = new URLSearchParams();
    if (query) params.set('keyword', query);
    router.push(`/search/hindi?${params.toString()}`);
  };

  const handleClose = (e: React.MouseEvent) => {
      e.stopPropagation();
      setQuery('');
      setIsActive(false);
      onClose(); 
  };

  return (
    <div 
        className="w-full h-full flex items-center relative group"
        onClick={() => !isActive && setIsActive(true)}
    >
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

      <div className="flex items-center gap-1 pr-1.5">
        {query && <button onClick={handleSubmit} className="p-1 bg-orange-600 text-white rounded-full hover:bg-orange-700 shadow-lg"><ArrowRight size={12} /></button>}
        
        {/* X ICON: Visible if query exists OR if active (for mobile close). Hidden on Desktop if empty. */}
        {(query || isActive) && (
            <button 
                onClick={handleClose} 
                className={cn("p-1 text-zinc-500 hover:text-white", !query && "md:hidden")}
            >
                <X size={12} />
            </button>
        )}
      </div>

      <AnimatePresence>
        {isActive && suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-[120%] left-0 right-0 bg-[#0a0a0a]/95 border border-orange-500/20 rounded-2xl shadow-2xl p-1 z-50">
                {suggestions.map((s: any) => (
                    <div key={s.id} onClick={() => router.push(`/watch/${s.id}`)} className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-xl cursor-pointer group transition-all">
                        <img src={s.poster} className="w-8 h-10 object-cover rounded bg-zinc-800" alt="" />
                        <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate group-hover:text-orange-500">{s.title}</div>
                            <div className="text-[9px] text-zinc-500 font-medium uppercase">
                                Hindi • {s.type || "TV"} • {s.totalEpisodes || s.episodes || '?'} EPS
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}