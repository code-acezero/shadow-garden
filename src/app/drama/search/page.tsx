"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Loader2, Play, Globe, ArrowLeft, Filter } from 'lucide-react';
import { omni, DramaCard } from '@/lib/omni';
import { cn } from '@/lib/utils';
import Footer from '@/components/Anime/Footer';
import DCard from '@/components/Drama/DCard';
import CountryBadge from '@/components/Drama/CountryBadge';

const COUNTRIES = [
  { id: 'korean-drama', label: 'Korean Drama', code: 'korean' },
  { id: 'chinese-drama', label: 'Chinese Drama', code: 'chinese' },
  { id: 'japanese-drama', label: 'Japanese Drama', code: 'japanese' },
  { id: 'turkish-drama', label: 'Turkish Drama', code: 'turkish' },
  { id: 'thai-drama', label: 'Thai Drama', code: 'thai' },
];

const GENRES = [
  'Action', 'Romance', 'Thriller', 'Comedy', 'Mystery', 'Historical', 'Fantasy', 'Sci-Fi'
];

function DramaSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  
  const initialFilter = searchParams.get('filter') || '';
  const initialGenre = searchParams.get('genre') || '';

  const [query, setQuery] = useState(initialQuery);
  const [filterType, setFilterType] = useState(initialFilter);
  const [filterGenre, setFilterGenre] = useState(initialGenre);
  const [results, setResults] = useState<DramaCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let res;
        if (query) {
          res = await omni.drama.search(query);
        } else if (filterType) {
          const countryKey = filterType.replace('-drama', '');
          res = await omni.drama.getByCountry(countryKey);
        } else if (filterGenre) {
          res = await omni.drama.getByGenre(filterGenre);
        } else {
          const home = await omni.drama.getHome();
          const allItems = home?.sections?.flatMap(s => s.items) || [];
          res = { items: allItems };
        }
        setResults(res?.items || []);
      } catch (e) {
        setResults([]);
      }
      setLoading(false);
    })();
  }, [query, filterType, filterGenre]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setFilterType('');
    setFilterGenre('');
    router.push(`/drama/search?q=${encodeURIComponent(query.trim())}`);
  };

  const selectCountry = (id: string) => {
    const next = filterType === id ? '' : id;
    setFilterType(next);
    setFilterGenre('');
    setQuery('');
    router.push(next ? `/drama/search?filter=${next}` : '/drama/search');
  };

  const selectGenre = (g: string) => {
    const next = filterGenre === g ? '' : g;
    setFilterGenre(next);
    setFilterType('');
    setQuery('');
    router.push(next ? `/drama/search?genre=${encodeURIComponent(next)}` : '/drama/search');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white pt-24 pb-16 px-4 md:px-8 selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto">
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/drama" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-cyan-400 transition-all active:scale-95">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">Drama Realm</h1>
            <p className="text-xs font-bold text-cyan-200/60 uppercase tracking-widest">Explore Asian & Worldwide Dramas</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 bg-[#0f172a] border border-cyan-500/30 rounded-full px-4 py-3 focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all">
            <Search size={18} className="text-cyan-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by drama title..."
              className="bg-transparent text-white font-bold text-sm w-full outline-none placeholder:text-cyan-200/40"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); router.push('/drama/search'); }} className="text-xs font-bold text-cyan-400 hover:text-white px-2">
                Clear
              </button>
            )}
          </form>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center justify-center gap-2 px-6 py-3 rounded-full border text-xs font-black uppercase tracking-wider transition-all active:scale-95", showFilters || filterType || filterGenre ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "bg-white/5 border-white/10 text-cyan-200 hover:bg-white/10")}
          >
            <Filter size={16} /> Filters {(filterType || filterGenre) && '• Active'}
          </button>
        </div>

        {/* Filter Drawer */}
        {(showFilters || filterType || filterGenre) && (
          <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 mb-8 shadow-2xl flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <p className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-3">Country / Region</p>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectCountry(c.id)}
                    className={cn("px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 active:scale-95", filterType === c.id ? "bg-cyan-500 text-black border-cyan-400 font-black shadow-[0_0_10px_rgba(34,211,238,0.4)]" : "bg-white/5 border-white/10 text-zinc-300 hover:border-cyan-500/40")}
                  >
                    <CountryBadge country={c.code} className="bg-transparent border-0 px-0 py-0 shadow-none" />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-3">Genres</p>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <button
                    key={g}
                    onClick={() => selectGenre(g)}
                    className={cn("px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95", filterGenre === g ? "bg-cyan-500 text-black border-cyan-400 font-black shadow-[0_0_10px_rgba(34,211,238,0.4)]" : "bg-white/5 border-white/10 text-zinc-300 hover:border-cyan-500/40")}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="w-full py-32 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
            <p className="text-xs font-black text-cyan-400 uppercase tracking-widest">Summoning Dramas...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {results.map(item => (
              <DCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="w-full py-32 flex flex-col items-center justify-center text-center">
            <Globe className="w-16 h-16 text-cyan-500/40 mb-4" />
            <h3 className="text-xl font-bold text-white mb-1">No Dramas Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm">Try searching with a different keyword or removing active filters.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function DramaSearchPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    }>
      <DramaSearchContent />
    </Suspense>
  );
}
