import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import AnimeCard from '@/components/AnimeCard'; // Import the updated card
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ViewAllPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { category } = useParams(); // e.g., 'recently-updated'
  
  // State for data
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get current page from URL or default to 1
  const currentPage = parseInt(searchParams.get('page') || '1');

  // Fetch Logic
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Replace with your actual API endpoint
        // Example: https://shadow-garden-api.vercel.app/anime/hianime/${category}?page=${currentPage}
        const response = await fetch(`YOUR_API_BASE_URL/anime/hianime/${category}?page=${currentPage}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch page data", error);
      } finally {
        setLoading(false);
        // Scroll to top on page change
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (category) fetchData();
  }, [category, currentPage]);

  // Pagination Handlers
  const handleNext = () => {
    if (data?.hasNextPage) {
      setSearchParams({ page: (currentPage + 1).toString() });
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setSearchParams({ page: (currentPage - 1).toString() });
    }
  };

  // Format Category Title (e.g., "recently-updated" -> "Recently Updated")
  const pageTitle = category?.replace(/-/g, ' ').toUpperCase();

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 py-24">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-[Cinzel]">
            {pageTitle}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Page {currentPage} of {data?.totalPages || '...'}
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
              // Pass your settings state here if available
              // useJapaneseTitle={settings.useJapanese} 
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