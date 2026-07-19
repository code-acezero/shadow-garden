"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Loader2, Play, Globe, ArrowLeft } from 'lucide-react';
import { omni, DramaCard } from '@/lib/omni';
import { cn } from '@/lib/utils';
import Footer from '@/components/Anime/Footer';

// Search Card using futuristic style
const ResultCard = ({ item }: { item: DramaCard }) => (
  <Link href={`/drama-watch/${item.id}`} className="group relative flex flex-col rounded-md transition-all duration-300 hover:scale-[1.05] hover:z-50 hover:shadow-2xl hover:ring-1 hover:ring-cyan-500/50 origin-center bg-zinc-900 border border-white/5 overflow-hidden">
    <div className="aspect-[2/3] w-full relative">
      {item.image ? (
        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-700"><Play size={24} /></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Cyberpunk accent line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Mini Play Button Center */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-transform group-hover:scale-110">
             <Play size={18} fill="cyan" className="text-cyan-400 ml-1" />
          </div>
      </div>
    </div>
    
    <div className="p-3 bg-[#0a0a0a]">
        <p className="text-xs font-bold text-white line-clamp-1 mb-1">{item.title}</p>
        <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
            {item.year && <span>{item.year}</span>}
            {item.episode && <span className="text-cyan-500 border border-cyan-500/30 bg-cyan-500/10 px-1 rounded">EP {item.episode}</span>}
            {item.country && <span className="flex items-center gap-0.5"><Globe size={10}/>{item.country}</span>}
        </div>
    </div>
  </Link>
);

function DramaSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<DramaCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initialQuery) {
      setLoading(false);
      return;
    }
    setQuery(initialQuery);
    (async () => {
      setLoading(true);
      const r = await omni.drama.search(initialQuery);
      setResults(r.items || []);
      setLoading(false);
    })();
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/drama/search?q=${encodeURIComponent(query.trim())}`);
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

        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto mb-16">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-full px-6 py-4 shadow-2xl focus-within:border-cyan-500/50 transition-colors">
            <Search size={20} className="text-zinc-400 mr-4 shrink-0" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search databases..."
              className="bg-transparent text-white w-full outline-none font-bold placeholder:text-zinc-600 text-lg"
              autoFocus
            />
            {loading && <Loader2 size={20} className="text-cyan-500 animate-spin ml-4 shrink-0" />}
          </div>
        </form>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-cyan-500 font-black tracking-[0.2em] uppercase text-xs animate-pulse">Querying Database...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                Results for <span className="text-cyan-400 border-b-2 border-cyan-400">"{initialQuery}"</span>
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
