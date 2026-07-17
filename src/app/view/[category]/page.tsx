"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import AnimeCard from '@/components/Anime/AnimeCard'; 
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimeService } from '@/lib/api';
import { dpi } from '@/lib/dpi';

function ViewAllContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  
  // Extract category from the URL (e.g. /view/trending -> category = "trending")
  const category = params.category as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get current page from URL or default to 1
  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    const fetchData = async () => {
      if (!category) return;
      
      setLoading(true);
      try {
        let result: any;
        if (category === 'donghua') {
           const donghuaData = await dpi.getHome(currentPage);
           // Mock pagination for donghua since dpi.getHome just returns an array
           result = {
              results: donghuaData,
              currentPage: currentPage,
              hasNextPage: donghuaData.length === 24, // Assuming 24 is max per page
              hasPreviousPage: currentPage > 1,
              maxPage: 100 // Donghua scraper might not provide maxPage easily
           };
        } else {
           result = await AnimeService.getFilteredAnime(category, currentPage);
        }
        setData(result);
      } catch (error) {
        console.error("Failed to fetch page data", error);
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    fetchData();
  }, [category, currentPage]);

  const updatePage = (newPage: number) => {
    router.push(`/view/${category}?page=${newPage}`);
  };

  const handleNext = () => {
    if (data?.hasNextPage) updatePage(currentPage + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) updatePage(currentPage - 1);
  };

  // Format Category Title
  const pageTitle = category?.replace(/-/g, ' ').toUpperCase() || "ANIME LIST";

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 py-24">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-white uppercase drop-shadow-md">
            {pageTitle}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Page {currentPage} {data?.maxPage ? `of ${data.maxPage}` : ''}
          </p>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data?.results?.map((anime: any) => (
            <AnimeCard 
              key={anime.id} 
              anime={anime} 
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && data && (
        <div className="max-w-7xl mx-auto mt-12 flex justify-center items-center gap-4">
          
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all ${
              currentPage === 1 
                ? 'opacity-50 cursor-not-allowed bg-transparent border-white/10' 
                : 'bg-white/5 border-white/10 hover:bg-primary-600 hover:border-primary-500 shadow-lg hover:shadow-primary-600/20'
            }`}
          >
            <ChevronLeft size={18} />
            <span>Previous</span>
          </button>

          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/10 border border-primary-500/20 font-bold text-primary-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
            {currentPage}
          </div>

          <button
            onClick={handleNext}
            disabled={!data.hasNextPage}
            className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all ${
              !data.hasNextPage 
                ? 'opacity-50 cursor-not-allowed bg-transparent border-white/10' 
                : 'bg-white/5 border-white/10 hover:bg-primary-600 hover:border-primary-500 shadow-lg hover:shadow-primary-600/20'
            }`}
          >
            <span>Next</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

// We wrap the content in Suspense because useSearchParams causes client-side de-opt
export default function ViewAllPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#050505]" />}>
      <ViewAllContent />
    </Suspense>
  );
}