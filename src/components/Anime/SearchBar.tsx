
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, PlayCircle, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimeAPI, SearchSuggestion } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce Logic: Wait 300ms after typing stops to fetch
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsLoading(true);
        setShowResults(true);
        try {
          const data = await AnimeAPI.getSearchSuggestionsV2(query);
          setSuggestions(data.slice(0, 5)); // Limit to top 5
        } catch (error) {
          console.error("Search error:", error);
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

  // Click Outside to Close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowResults(false);
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleSuggestionClick = (animeId: string) => {
    setShowResults(false);
    navigate(`/watch/${animeId}`);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg z-50">
      
      {/* --- INPUT CAPSULE --- */}
      <form onSubmit={handleSearchSubmit} className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-purple-600/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 1 && setShowResults(true)}
          placeholder="Summon Anime..." 
          className="w-full bg-[#0a0a0a]/80 border border-white/10 text-gray-200 text-sm rounded-full py-3 pl-12 pr-12 
                     focus:outline-none focus:bg-black focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 
                     transition-all backdrop-blur-xl shadow-xl shadow-black/50 placeholder-gray-500 relative z-10"
        />
        <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors z-20" />
        
        {/* Right Actions */}
        <div className="absolute right-3 top-2.5 flex items-center gap-2 z-20">
          {isLoading ? (
             <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
          ) : query && (
             <button type="button" onClick={() => setQuery('')} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
             </button>
          )}
          <div className="hidden md:block bg-white/5 rounded-md px-1.5 py-0.5 border border-white/5">
             <span className="text-[10px] text-gray-500 font-mono">CMD+K</span>
          </div>
        </div>
      </form>

      {/* --- FANTASY DROPDOWN --- */}
      <AnimatePresence>
        {showResults && (suggestions.length > 0 || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-4 bg-[#0a0a0a]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/5 to-transparent pointer-events-none" />
            
            <div className="p-2 space-y-2">
              <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest flex justify-between">
                <span>Suggestions</span>
                <span className="text-red-500">{suggestions.length} Found</span>
              </div>
              
              {suggestions.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleSuggestionClick(item.id)}
                  className="group relative flex items-center gap-4 p-2 rounded-xl cursor-pointer transition-all hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                  {/* Glowing Effect on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />

                  {/* Poster Capsule */}
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg border border-white/10">
                    <img src={item.poster} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 relative z-10">
                    <h4 className="text-sm font-bold text-gray-200 group-hover:text-red-400 truncate transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-gray-500 truncate mb-1.5">{item.jname}</p>
                    
                    {/* Meta Tags (The Capsule Docks) */}
                    <div className="flex flex-wrap gap-2">
                      {item.moreInfo.map((info, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-gray-400 flex items-center gap-1">
                           {info.includes('min') ? <Clock size={8}/> : null}
                           {info}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Icon */}
                  <div className="mr-2 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-red-500">
                    <PlayCircle size={20} />
                  </div>
                </div>
              ))}
            </div>

            <div 
              onClick={handleSearchSubmit}
              className="p-3 bg-white/5 border-t border-white/5 text-center text-xs font-bold text-gray-400 hover:text-white cursor-pointer hover:bg-red-600/20 transition-colors"
            >
              View all results for "{query}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}