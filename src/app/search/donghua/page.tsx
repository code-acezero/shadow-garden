"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AnimeCard from '@/components/Anime/AnimeCard';
import { dpi } from '@/lib/dpi';
import { demoness, hunters } from '@/lib/fonts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, ChevronLeft, ChevronRight, X, Flame,
  RotateCcw, SlidersHorizontal
} from 'lucide-react';

function DonghuaSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const keyword = searchParams.get('keyword') || '';
  const pageParam = parseInt(searchParams.get('page') || '1');

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [query, setQuery] = useState(keyword);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      if (keyword) {
        const data = await dpi.search(keyword, currentPage);
        const items = Array.isArray(data) ? data : (data as any)?.items || (data as any)?.results || [];
        setResults(items.map((item: any) => ({
          id: item.id || item.slug,
          title: item.title || item.name,
          poster: item.image || item.poster || '/images/no-poster.png',
          type: item.type || 'TV',
          episodes: { sub: item.episodeCount || item.episodes || 0, dub: 0 },
          isDonghua: true,
          targetRoute: `/donghua-watch/${item.id || item.slug}`,
        })));
        setHasNextPage(items.length >= 20);
      } else {
        const homeData = await dpi.getHome(); 
        const latestSection = homeData.sections.find((s: any) => s.title.toLowerCase().includes("latest")) || homeData.sections[0]; 
        const data = latestSection ? latestSection.items : [];
        const items = Array.isArray(data) ? data : (data as any)?.items || (data as any)?.results || [];
        setResults(items.map((item: any) => ({
          id: item.id || item.slug,
          title: item.title || item.name,
          poster: item.image || item.poster || '/images/no-poster.png',
          type: item.type || 'TV',
          episodes: { sub: item.episodeCount || item.episodes || 0, dub: 0 },
          isDonghua: true,
          targetRoute: `/donghua-watch/${item.id || item.slug}`,
        })));
        setHasNextPage(false);
      }
    } catch (err) {
      console.error("Donghua search error:", err);
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
    router.push(`/search/donghua?${params.toString()}`);
  };

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/search/donghua?${params.toString()}`);
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="relative pt-20 pb-8 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-600/5 rounded-full blur-[120px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-red-500" />
            <span className={`text-red-400 text-[10px] tracking-[0.3em] font-bold uppercase ${hunters.className}`}>
              <Flame size={12} className="inline mr-2" />
              Donghua
            </span>
          </div>
          
          <h1 className={`text-4xl md:text-6xl text-white mb-2 ${demoness.className}`}>
            {keyword ? (
              <>DONGHUA <span className="text-red-500">RESULTS</span></>
            ) : (
              <>DONGHUA <span className="text-red-500">LIBRARY</span></>
            )}
          </h1>
          
          {keyword && (
            <p className="text-zinc-400 text-sm">
              Showing Donghua results for "<span className="text-white font-bold">{keyword}</span>"
              {results.length > 0 && !loading && (
                <span className="text-zinc-500 ml-2">· {results.length} found</span>
              )}
            </p>
          )}

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-3">
            <div className="relative flex-1 max-w-2xl">
              <Flame size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500/60" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Donghua..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-red-500/50 focus:bg-white/[0.08] transition-all placeholder-zinc-500"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="submit" className="px-6 py-3.5 bg-red-600 hover:bg-red-700 rounded-2xl text-sm font-bold transition-colors shadow-lg shadow-red-600/20">
              Search
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

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-red-500" />
            <p className="text-zinc-500 text-sm animate-pulse">Searching Donghua archives...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Flame size={32} className="text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-white">No Results Found</h3>
            <p className="text-zinc-500 text-sm text-center max-w-md">
              {keyword ? `No Donghua found for "${keyword}".` : 'The Donghua API may be unavailable right now.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((anime: any) => (
                <AnimeCard key={anime.id} anime={anime} />
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
                    : 'border-white/10 text-zinc-300 hover:bg-red-600 hover:border-red-500 hover:text-white'
                }`}
              >
                <ChevronLeft size={16} /> Prev
              </button>

              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 font-bold text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                {currentPage}
              </div>

              <button
                onClick={() => hasNextPage && navigateToPage(currentPage + 1)}
                disabled={!hasNextPage}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  !hasNextPage
                    ? 'opacity-30 cursor-not-allowed border-white/5 text-zinc-600'
                    : 'border-white/10 text-zinc-300 hover:bg-red-600 hover:border-red-500 hover:text-white'
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

export default function DonghuaSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <DonghuaSearchContent />
    </Suspense>
  );
}
