"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mic, ChevronRight, ChevronLeft, Flame, Loader2 } from 'lucide-react';
import HindiAnimeCard from '@/components/Anime/HindiAnimeCard';
import MonetLineIcon from '@/components/UIx/MonetLineIcon';
import CylinderPageSlider from '@/components/UIx/CylinderPageSlider';
import CutePageSwitcher from '@/components/UIx/CutePageSwitcher';
import { atraxSquishTapVariants } from '@/lib/atraxMotion';
import { playGummyPop, playGummyTap } from '@/lib/audioManager';

export default function HindiHomeSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const cacheRef = useRef<Record<number, any[]>>({});

  const handlePageChange = (newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > maxPage) return;
    const cached = cacheRef.current[newPage];
    if (cached && cached.length > 0) {
      setItems(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setPage(newPage);
  };

  useEffect(() => {
    let isSubscribed = true;
    const fetchPopularHindi = async () => {
      const cached = cacheRef.current[page];
      if (cached && cached.length > 0) {
        setItems(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/blakite/popular?page=${page}&perPage=12`);
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && data.ok) {
            const results = data.results || [];
            setItems(results);
            cacheRef.current[page] = results;
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
    <section className="w-full relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 mb-4 md:mb-6">
        {/* Row 1: Title (left) & Mobile Explore Button (right) */}
        <div className="flex items-center justify-between md:justify-start gap-2.5 md:gap-3 w-full md:w-auto min-w-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <MonetLineIcon
              icon={Mic}
              variant="orange"
            />
            <h2 className="text-base sm:text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide leading-none truncate">
              HINDI MAJESTY
            </h2>
          </div>

          {/* Mobile Only: Symmetrical Explore Button */}
          <Link
            href="/hindi"
            onClick={() => playGummyPop()}
            className="md:hidden text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all inline-flex items-center gap-1 whitespace-nowrap select-none shrink-0 active:scale-95"
          >
            <span>Explore</span>
            <ChevronRight size={11} className="text-orange-400" />
          </Link>
        </div>

        {/* Row 2 on Mobile (Full Width Page Switcher) / Right Controls on Desktop */}
        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 w-full md:w-auto">
          <CutePageSwitcher
            page={page}
            maxPage={maxPage}
            loading={loading}
            onPageChange={handlePageChange}
            variant="orange"
            className="w-full md:w-auto justify-between md:justify-start"
          />

          {/* Desktop Only: Full Button Name */}
          <Link
            href="/hindi"
            onClick={() => playGummyPop()}
            className="hidden md:inline-flex text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-orange-500/30 transition-colors items-center gap-1.5 whitespace-nowrap select-none active:scale-95"
          >
            <span>Explore Majesty</span>
            <ChevronRight size={12} className="text-orange-400" />
          </Link>
        </div>
      </div>

      <CylinderPageSlider
        page={page}
        loading={loading}
        skeletonCount={12}
        gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-5"
      >
        {items.map((anime) => (
          <HindiAnimeCard key={anime.id || anime.slug} anime={anime} />
        ))}
      </CylinderPageSlider>

      {/* Bottom Center-Aligned Page Switcher */}
      <div className="w-full flex items-center justify-center mt-6 md:mt-8 px-2 sm:px-0">
        <CutePageSwitcher
          page={page}
          maxPage={maxPage}
          loading={loading}
          onPageChange={handlePageChange}
          variant="orange"
        />
      </div>
    </section>
  );
}
