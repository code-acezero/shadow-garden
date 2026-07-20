"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Loader2, Play, Globe, ArrowLeft, Filter } from 'lucide-react';
import { omni, DramaCard } from '@/lib/omni';
import { cn } from '@/lib/utils';
import Footer from '@/components/Anime/Footer';

const COUNTRIES = [
  { id: 'korean-drama', label: '🇰🇷 Korean Drama' },
  { id: 'chinese-drama', label: '🇨🇳 Chinese Drama' },
  { id: 'japanese-drama', label: '🇯🇵 Japanese Drama' },
  { id: 'turkish-drama', label: '🇹🇷 Turkish Drama' },
  { id: 'thai-drama', label: '🇹🇭 Thai Drama' },
];

const GENRES = [
  'Action', 'Romance', 'Thriller', 'Comedy', 'Mystery', 'Historical', 'Fantasy', 'Sci-Fi'
];

const ResultCard = ({ item }: { item: DramaCard }) => {
  let countryTag = item.country || '';
  if (!countryTag && item.type) {
    if (item.type.toLowerCase().includes('korea')) countryTag = 'South Korea';
    else if (item.type.toLowerCase().includes('china') || item.type.toLowerCase().includes('chinese')) countryTag = 'China';
    else if (item.type.toLowerCase().includes('japan')) countryTag = 'Japan';
    else if (item.type.toLowerCase().includes('turkey') || item.type.toLowerCase().includes('turkish')) countryTag = 'Turkey';
    else if (item.type.toLowerCase().includes('thai')) countryTag = 'Thailand';
  }

  let flag = '🌍';
  const cLower = countryTag.toLowerCase();
  if (cLower.includes('korea')) flag = '🇰🇷';
  else if (cLower.includes('china')) flag = '🇨🇳';
  else if (cLower.includes('japan')) flag = '🇯🇵';
  else if (cLower.includes('turkey')) flag = '🇹🇷';
  else if (cLower.includes('thai')) flag = '🇹🇭';

  return (
    <div className="group relative flex flex-col shrink-0 w-full transition-all duration-300 hover:z-50 hover:scale-110 origin-bottom touch-manipulation">
      <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#0f172a] relative shadow-lg group-hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] group-hover:ring-2 group-hover:ring-cyan-400/50 transition-all cursor-pointer" onClick={() => window.location.href = `/drama-watch/${item.id}`}>
        {item.image ? (
          <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity duration-300" loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cyan-900"><Play size={24} /></div>
        )}
        
        {countryTag && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1 border border-white/10 z-10">
            <span className="text-[10px]">{flag}</span>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">{countryTag}</span>
          </div>
        )}

        {item.episode && (
          <div className="absolute top-2 right-2 bg-cyan-500 text-black px-1.5 py-0.5 rounded font-black text-[9px] z-10 shadow-md">
            EP {item.episode}
          </div>
        )}

        <div className="absolute inset-0 p-3 md:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent pb-4">
          <div className="mb-3">
              <h3 className="text-xs md:text-sm font-black text-white line-clamp-2 leading-tight drop-shadow-md mb-1">{item.title}</h3>
              <div className="flex flex-wrap items-center gap-1.5 text-[8px] md:text-[9px] font-bold text-cyan-200/80 uppercase tracking-widest">
                  {item.year && <span className="bg-white/10 px-1 rounded">{item.year}</span>}
                  {item.type && !item.type.includes(countryTag) && <span>{item.type}</span>}
              </div>
          </div>
          <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all">
                  <Play size={14} fill="black" className="ml-0.5" />
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
        if (initialFilter) {
          const r = await omni.drama.getByCountry(initialFilter.replace('-drama', ''));
          setResults(r.items || []);
        } else if (initialGenre) {
          const r = await omni.drama.getByGenre(initialGenre);
          setResults(r.items || []);
        } else if (initialQuery) {
          const r = await omni.drama.search(initialQuery);
          setResults(r.items || []);
        } else {
          setResults([]);
        }
      } catch (err) {
        setResults([]);
      }
      setLoading(false);
    })();
  }, [initialQuery, initialFilter, initialGenre]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let url = `/drama/search?`;
    if (query.trim()) url += `q=${encodeURIComponent(query.trim())}&`;
    if (filterType) url += `filter=${encodeURIComponent(filterType)}&`;
    if (filterGenre) url += `genre=${encodeURIComponent(filterGenre)}&`;
    router.push(url.replace(/&$/, ''));
  };

  const applyFilter = (type: string, value: string) => {
    let url = `/drama/search?`;
    if (query.trim()) url += `q=${encodeURIComponent(query.trim())}&`;
    
    let newFilterType = filterType;
    let newFilterGenre = filterGenre;

    if (type === 'filter') {
        newFilterType = filterType === value ? '' : value;
    } else if (type === 'genre') {
        newFilterGenre = filterGenre === value ? '' : value;
    }

    if (newFilterType) url += `filter=${encodeURIComponent(newFilterType)}&`;
    if (newFilterGenre) url += `genre=${encodeURIComponent(newFilterGenre)}&`;
    
    router.push(url.replace(/&$/, ''));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-[env(safe-area-inset-top)] pb-24 overflow-x-hidden relative">
      
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none fixed" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-900/10 via-purple-900/5 to-transparent pointer-events-none fixed" />

      <div className="max-w-[1500px] mx-auto px-4 md:px-12 pt-24 relative z-10">
        
        <button onClick={() => router.push('/drama')} className="flex items-center gap-2 text-cyan-500 hover:text-cyan-400 font-bold uppercase tracking-widest text-xs mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Portal
        </button>

        {/* Search & Filters */}
        <div className="w-full max-w-4xl mx-auto mb-16 flex flex-col items-center">
          <form onSubmit={handleSearch} className="relative w-full max-w-2xl mb-4">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-full px-6 py-4 shadow-2xl focus-within:border-cyan-500/50 transition-colors">
              <Search size={20} className="text-zinc-400 mr-4 shrink-0" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dramas..."
                className="bg-transparent text-white w-full outline-none font-bold placeholder:text-zinc-600 text-lg"
                autoFocus
              />
              <button type="button" onClick={() => setShowFilters(!showFilters)} className={cn("ml-2 p-2 rounded-full transition-colors shrink-0", showFilters || filterType || filterGenre ? "bg-cyan-500 text-black" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white")}>
                  <Filter size={18} />
              </button>
            </div>
          </form>

          {/* Expanded Filters */}
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 relative z-20">
                <div>
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Country / Type</h3>
                    <div className="flex flex-wrap gap-2">
                        {COUNTRIES.map(c => (
                            <button key={c.id} onClick={() => applyFilter('filter', c.id)} className={cn("px-4 py-2 rounded-full text-xs font-bold border transition-all", filterType === c.id ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white")}>
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Genre</h3>
                    <div className="flex flex-wrap gap-2">
                        {GENRES.map(g => (
                            <button key={g} onClick={() => applyFilter('genre', g)} className={cn("px-4 py-2 rounded-full text-xs font-bold border transition-all", filterGenre === g ? "bg-purple-500 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white")}>
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-cyan-500 font-black tracking-[0.2em] uppercase text-xs animate-pulse">Querying Database...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                {initialQuery ? <span>Results for <span className="text-cyan-400 border-b-2 border-cyan-400">"{initialQuery}"</span></span> : filterType ? <span>Filtered by <span className="text-cyan-400">{COUNTRIES.find(c => c.id === filterType)?.label || filterType}</span></span> : filterGenre ? <span>Genre: <span className="text-purple-400">{filterGenre}</span></span> : "Explore Dramas"}
              </h1>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">{results.length} Matches</span>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {results.map((item) => (
                  <ResultCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <Search size={48} className="text-zinc-800 mb-6" />
                <h2 className="text-xl font-black uppercase text-zinc-500 tracking-widest mb-2">No Matches Found</h2>
                <p className="text-zinc-600 text-sm">The query returned zero results from the shadow databases.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div className="mt-24"><Footer /></div>
    </div>
  );
}

export default function DramaSearchPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}><DramaSearchContent /></Suspense>;
}
