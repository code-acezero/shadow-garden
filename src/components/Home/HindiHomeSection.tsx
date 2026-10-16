"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mic, ChevronRight, ChevronLeft, Sparkles, Flame, Loader2 } from 'lucide-react';
import HindiAnimeCard from '@/components/Anime/HindiAnimeCard';

export default function HindiHomeSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);

  useEffect(() => {
    let isSubscribed = true;
    const fetchPopularHindi = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/blakite/popular?page=${page}&perPage=12`);
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && data.ok) {
            setItems(data.results || []);
            setMaxPage(data.maxPage || 1);
          }
        }
      } catch (err) {
        console.error("Failed to load Popular Hindi dubs showcase:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchPopularHindi();
    return () => { isSubscribed = false; };
  }, [page]);

  if (!loading && items.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <Mic className="w-7 h-7 md:w-9 md:h-9 text-orange-400 shrink-0 drop-shadow-[0_0_12px_rgba(251,146,60,0.5)]" />
          <h2 className="text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide flex items-center gap-2">
            HINDI <span className="text-orange-500">MAJESTY</span>
          </h2>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Simple Page Number & Arrow Buttons */}
          <span className="text-xs font-semibold text-zinc-400 select-none">
            <span className="text-white font-bold">{page}</span>
            {maxPage > 1 && <span className="text-zinc-600 font-normal"> / {maxPage}</span>}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-orange-500/20 hover:border-orange-500/30 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90"
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage || loading}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-orange-500/20 hover:border-orange-500/30 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90"
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <Link
            href="/search/hindi"
            className="text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-orange-500/30 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Explore Hindi Hub</span>
            <ChevronRight size={12} className="text-orange-400" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6 animate-pulse">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
          {items.map((anime) => (
            <HindiAnimeCard key={anime.id || anime.slug} anime={anime} />
          ))}
        </div>
      )}
    </section>
  );
}
