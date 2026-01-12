"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, PlayCircle, Clock, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation'; 
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
// We define the interface locally or import from a safe types file to avoid importing the scraper
interface SearchResult {
  id: string;
  title: string;
  image: string;
  releaseDate?: string;
  type?: string;
}

// --- CONFIGURATION ---
const PLACEHOLDERS = [
  "Summon Solo Leveling...",
  "Find One Piece...",
  "Search Jujutsu Kaisen...",
  "Discover Chainsaw Man...",
  "Look for Bleach...",
  "Explore Shadow Garden..."
];

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Placeholder Animation State
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); 

  // --- ANIMATED PLACEHOLDER LOGIC ---
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000); 
    return () => clearInterval(interval);
  }, []);

  // --- SEARCH DEBOUNCE (REPAIRED FOR VERCEL) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsLoading(true);
        setShowResults(true);
        try {
          // ✅ FIX: Instead of calling consumetClient directly, we fetch from your API route
          // This keeps the Node.js scraper code on the server and prevents build errors.
          const response = await fetch(`/api/anime?action=search&q=${encodeURIComponent(query)}`);
          
          if (!response.ok) throw new Error("Search failed");
          
          const data = await response.json();
          // Adjusting mapping based on your ShadowAnime schema
          setSuggestions(data.slice(0, 5)); 
        } catch (error) {
          console.error("Shadow Search error:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // --- CLICK OUTSIDE ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS ---
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowResults(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleSuggestionClick = (animeId: string) => {
    setShowResults(false);
    router.push(`/watch/${animeId}`);
  };

  const handleAISearch = () => {
    router.push('/ai/imagesearch');
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl z-50">
      
      {/* --- INPUT CAPSULE --- */}
      <form onSubmit={handleSearchSubmit} className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 via-purple-600/20 to-blue-600/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative flex items-center w-full bg-[#0a0a0a]/90 border border-white/10 rounded-full backdrop-blur-2xl shadow-2xl transition-all focus-within:border-red-500/50 focus-within:bg-black focus-within:ring-1 focus-within:ring-red-500/30 h-12">
            
            <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-red-500 transition-colors">
                <Search className="w-5 h-5" />
            </div>

            <div className="relative flex-1 h-full">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 1 && setShowResults(true)}
                    className="w-full h-full bg-transparent border-none focus:ring-0 text-gray-100 text-sm placeholder-transparent relative z-10"
                />
                
                <AnimatePresence mode="wait">
                    {!query && (
                        <motion.div 
                            key={placeholderIndex}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex items-center pointer-events-none text-gray-500/60 text-sm select-none"
                        >
                            {PLACEHOLDERS[placeholderIndex]}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-center gap-1.5 pr-2 pl-2">
                <AnimatePresence>
                    {isLoading && (
                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {query && !isLoading && (
                        <motion.button
                            type="button"
                            onClick={() => setQuery('')}
                            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                            className="p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </motion.button>
                    )}
                </AnimatePresence>

                <div className="w-px h-5 bg-white/10 mx-1" />

                <button
                    type="button"
                    onClick={handleAISearch}
                    className="group/ai relative flex items-center justify-center w-8 h-8 rounded-full overflow-hidden hover:bg-white/5 transition-all"
                    title="Search by Image (AI)"
                >
                     <div className="relative">
                        <ImageIcon className="w-4 h-4 text-gray-400 group-hover/ai:text-blue-400 transition-colors" />
                        <Sparkles className="w-2.5 h-2.5 text-yellow-400 absolute -top-1.5 -right-1.5 animate-pulse" />
                     </div>
                     <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover/ai:opacity-100 blur-sm transition-opacity" />
                </button>
            </div>
        </div>
      </form>

      {/* --- DROPDOWN --- */}
      <AnimatePresence>
        {showResults && (suggestions.length > 0 || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-3 bg-[#0a0a0a]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-[100]"
          >
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/5 to-transparent pointer-events-none" />
            
            <div className="p-2 space-y-1 relative z-10">
              <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex justify-between">
                <span>Suggestions</span>
                <span className="text-red-500">{suggestions.length} Found</span>
              </div>
              
              {suggestions.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleSuggestionClick(item.id)}
                  className="group relative flex items-center gap-4 p-2 rounded-xl cursor-pointer transition-all hover:bg-white/5 border border-transparent hover:border-white/5"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-500" />

                  <div className="relative w-10 h-14 rounded-md overflow-hidden flex-shrink-0 shadow-lg border border-white/10 group-hover:border-red-500/30 transition-colors">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0 relative z-10">
                    <h4 className="text-sm font-bold text-gray-200 group-hover:text-red-400 truncate transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="text-[9px] px-1.5 py-px rounded border border-white/10 text-gray-400 flex items-center gap-1 bg-black/20">
                            <Clock size={8}/> {item.releaseDate || 'Unknown'}
                        </span>
                        <span className="text-[9px] px-1.5 py-px rounded border border-white/10 text-gray-400 flex items-center gap-1 bg-black/20">
                            {item.type || 'TV'}
                        </span>
                    </div>
                  </div>

                  <div className="mr-2 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-red-500">
                    <PlayCircle size={18} />
                  </div>
                </div>
              ))}
            </div>

            <div 
              onClick={handleSearchSubmit}
              className="p-3 bg-white/5 border-t border-white/5 text-center text-xs font-bold text-gray-400 hover:text-white cursor-pointer hover:bg-red-600/10 transition-colors relative z-10"
            >
              View all results for "{query}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}