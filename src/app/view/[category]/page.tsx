"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import AnimeCard from '@/components/Anime/AnimeCard'; 
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
// import { AnimeAPI } from '@/lib/api'; // Use this if you have a library function

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
        // REPLACE THIS URL with your actual API endpoint or use AnimeAPI helper
        // Example: Using the proxy we created earlier
        const apiUrl = `https://shadow-garden-api.vercel.app/anime/hianime/${category}?page=${currentPage}`;
        
        // If you are using the proxy from earlier steps:
        // const proxyUrl = `/api/proxy?url=${encodeURIComponent(apiUrl)}`;
        
        const response = await fetch(apiUrl);
        const result = await response.json();
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
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-[Cinzel]">
            {pageTitle}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Page {currentPage} {data?.totalPages ? `of ${data.totalPages}` : ''}
          </p>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
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
            className={`flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 transition-all ${
              currentPage === 1 
                ? 'opacity-50 cursor-not-allowed bg-transparent' 
                : 'bg-white/5 hover:bg-purple-600 hover:border-purple-500'
            }`}
          >
            <ChevronLeft size={18} />
            <span>Previous</span>
          </button>

          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 font-bold text-purple-400">
            {currentPage}
          </div>

          <button
            onClick={handleNext}
            disabled={!data.hasNextPage}
            className={`flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 transition-all ${
              !data.hasNextPage 
                ? 'opacity-50 cursor-not-allowed bg-transparent' 
                : 'bg-white/5 hover:bg-purple-600 hover:border-purple-500'
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