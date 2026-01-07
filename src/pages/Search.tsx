import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AnimeAPI, V2SearchResult } from '@/lib/api';
import AnimeCard from '@/components/Anime/AnimeCard';
import { Loader2 } from 'lucide-react';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  const [data, setData] = useState<V2SearchResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await AnimeAPI.searchAnimeV2(query);
        setData(res);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  // Transform V2 data to match AnimeCard's expected ConsumetAnime interface
  const mapResultsToCards = (v2Animes: any[]) => {
    return v2Animes.map(item => ({
       id: item.id,
       title: item.name,
       image: item.poster,
       url: `/watch/${item.id}`,
       subOrDub: item.episodes.dub > 0 ? 'both' : 'sub', // rough estimation
       type: item.type,
       duration: item.duration,
       rank: undefined
    }));
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-20 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">
          Search Results for <span className="text-red-500">"{query}"</span>
        </h1>
        <p className="text-gray-400 text-sm">
          {data?.animes?.length || 0} results found
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data?.animes && mapResultsToCards(data.animes).map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}

      {!loading && (!data?.animes || data.animes.length === 0) && (
        <div className="text-center py-20 text-gray-500">
          No results found. Try a different keyword.
        </div>
      )}
    </div>
  );
}