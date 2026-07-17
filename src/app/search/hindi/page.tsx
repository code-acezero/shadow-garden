"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AnimeCard from '@/components/Anime/AnimeCard';
import { hpi } from '@/lib/hpi';
import { demoness, hunters } from '@/lib/fonts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, ChevronLeft, ChevronRight, X, Languages, Hash,
  RotateCcw, SlidersHorizontal
} from 'lucide-react';

const HINDI_GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi", "Thriller"];
const HINDI_LANGUAGES = ["Hindi", "Tamil", "Telugu", "English"];

function HindiSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const keyword = searchParams.get('keyword') || '';
  const pageParam = parseInt(searchParams.get('page') || '1');

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [query, setQuery] = useState(keyword);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState('');

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      if (keyword) {
        const data = await hpi.desidub.search(keyword, currentPage);
        const items = Array.isArray(data) ? data : (data as any)?.items || (data as any)?.results || [];
        setResults(items.map((item: any) => ({
          id: item.id || item.slug,
          title: item.title || item.name,
          poster: item.image || item.poster || '/images/no-poster.png',
          type: item.type || 'TV',
          episodes: { sub: 0, dub: item.episodeCount || item.episodes || 0 },
          isHindi: true,
          targetRoute: `/hindi-watch/${item.id || item.slug}`,
        })));
        setHasNextPage(items.length >= 20);
      } else {
        // Show latest Hindi anime by default
        const data = await hpi.desidub.getLatest(currentPage);
        const items = Array.isArray(data) ? data : (data as any)?.items || (data as any)?.results || [];
        setResults(items.map((item: any) => ({
          id: item.id || item.slug,
          title: item.title || item.name,
          poster: item.image || item.poster || '/images/no-poster.png',
          type: item.type || 'TV',
          episodes: { sub: 0, dub: item.episodeCount || item.episodes || 0 },
          isHindi: true,
          targetRoute: `/hindi-watch/${item.id || item.slug}`,
        })));
        setHasNextPage(items.length >= 20);
      }
    } catch (err) {
      console.error("Hindi search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, currentPage]);

  useEffect(() => {
    fetchResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchResults]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('keyword', query);
    router.push(`/search/hindi?${params.toString()}`);
  };

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/search/hindi?${params.toString()}`);
    setCurrentPage(page);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="relative pt-20 pb-8 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-950/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-600/5 rounded-full blur-[120px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-orange-500" />
            <span className={`text-orange-400 text-[10px] tracking-[0.3em] font-bold uppercase ${hunters.className}`}>
              <Languages size={12} className="inline mr-2" />
              Hindi Dubbed
            </span>
          </div>
          
          <h1 className={`text-4xl md:text-6xl text-white mb-2 ${demoness.className}`}>
            {keyword ? (
              <>HINDI <span className="text-orange-500">RESULTS</span></>
            ) : (
              <>HINDI <span className="text-orange-500">LIBRARY</span></>
            )}
          </h1>
          
          {keyword && (
            <p className="text-zinc-400 text-sm">
              Showing Hindi results for "<span className="text-white font-bold">{keyword}</span>"
              {results.length > 0 && !loading && (
                <span className="text-zinc-500 ml-2">· {results.length} found</span>
              )}
            </p>
          )}

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-3">
            <div className="relative flex-1 max-w-2xl">
              <Languages size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/60" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Hindi dubbed anime..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.08] transition-all placeholder-zinc-500"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="submit" className="px-6 py-3.5 bg-orange-600 hover:bg-orange-700 rounded-2xl text-sm font-bold transition-colors shadow-lg shadow-orange-600/20">
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3.5 rounded-2xl border text-sm font-bold transition-all ${
                showFilters ? 'bg-orange-600/20 border-orange-500/30 text-orange-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal size={18} />
            </button>
          </form>

          {/* Switch to Global */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => router.push(`/search${keyword ? `?keyword=${keyword}` : ''}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
            >
              <Search size={14} />
              Switch to Global Search
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-y border-white/5"
          >
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3 block flex items-center gap-2">
                  <Hash size={12} /> Genres
                </span>
                <div className="flex flex-wrap gap-2">
                  {HINDI_GENRES.map(g => (
                    <button
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        selectedGenres.includes(g)
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3 block">Audio Language</span>
                <div className="flex gap-2">
                  {HINDI_LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(selectedLang === lang ? '' : lang)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                        selectedLang === lang
                          ? 'bg-orange-600/20 border-orange-500/30 text-orange-400'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/5">
                <button onClick={() => { setSelectedGenres([]); setSelectedLang(''); }} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors">
                  <RotateCcw size={12} /> Reset
                </button>
                <button onClick={handleSearch} className="px-8 py-2.5 bg-orange-600 hover:bg-orange-700 rounded-xl text-sm font-bold transition-colors shadow-lg">
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            <p className="text-zinc-500 text-sm animate-pulse">Searching Hindi archives...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Languages size={32} className="text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-white">No Results Found</h3>
            <p className="text-zinc-500 text-sm text-center max-w-md">
              {keyword ? `No Hindi dubbed anime found for "${keyword}".` : 'The Hindi API may be unavailable right now.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((anime: any) => (
                <AnimeCard key={anime.id} anime={anime} isHindi />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex justify-center items-center gap-3">
              <button
                onClick={() => currentPage > 1 && navigateToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  currentPage === 1
                    ? 'opacity-30 cursor-not-allowed border-white/5 text-zinc-600'
                    : 'border-white/10 text-zinc-300 hover:bg-orange-600 hover:border-orange-500 hover:text-white'
                }`}
              >
                <ChevronLeft size={16} /> Prev
              </button>

              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 font-bold text-orange-500 shadow-[0_0_15px_rgba(251,146,60,0.2)]">
                {currentPage}
              </div>

              <button
                onClick={() => hasNextPage && navigateToPage(currentPage + 1)}
                disabled={!hasNextPage}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  !hasNextPage
                    ? 'opacity-30 cursor-not-allowed border-white/5 text-zinc-600'
                    : 'border-white/10 text-zinc-300 hover:bg-orange-600 hover:border-orange-500 hover:text-white'
                }`}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function HindiSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <HindiSearchContent />
    </Suspense>
  );
}
