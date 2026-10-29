"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, ChevronRight } from 'lucide-react';
import MonetLineIcon from '@/components/UIx/MonetLineIcon';
import CutePageSwitcher from '@/components/UIx/CutePageSwitcher';
import CylinderPageSlider from '@/components/UIx/CylinderPageSlider';
import ShortDramaCard from '@/components/Shorts/ShortDramaCard';
import { ShortDramaItem } from '@/lib/shorts/types';
import { CURATED_HINDI_DRAMAS, CURATED_ENGLISH_DRAMAS } from '@/lib/shorts/curated';
import { playGummyTap } from '@/lib/audioManager';

export default function ShortsHomeSection() {
  const [items, setItems] = useState<ShortDramaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const PER_PAGE = 6;
  const maxPage = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const currentPageItems = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    let isSubscribed = true;
    async function fetchShorts() {
      try {
        const res = await fetch('/api/shorts/feed?tab=trending');
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && data.ok && Array.isArray(data.items) && data.items.length > 0) {
            setItems(data.items);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic shorts feed:', err);
      }
      if (isSubscribed) {
        // Fallback to high quality curated dramas
        const fallback = [...CURATED_HINDI_DRAMAS, ...CURATED_ENGLISH_DRAMAS];
        setItems(fallback as ShortDramaItem[]);
        setLoading(false);
      }
    }
    fetchShorts();
    return () => { isSubscribed = false; };
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > maxPage) return;
    setPage(newPage);
  };

  const handleToggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="w-full my-4 md:my-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 mb-4 md:mb-6">
        {/* Row 1: Title (left) & Mobile Explore Button (right) */}
        <div className="flex items-center justify-between md:justify-start gap-2.5 md:gap-3.5 w-full md:w-auto min-w-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <MonetLineIcon icon={Flame} variant="rose" />
            <h2 className="text-base sm:text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide leading-none truncate">
              SHORTS
            </h2>
          </div>

          {/* Mobile Only: Symmetrical Explore Button */}
          <Link
            href="/shorts"
            onClick={() => playGummyTap()}
            className="md:hidden text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-red-500/30 transition-all inline-flex items-center gap-1 whitespace-nowrap select-none shrink-0 active:scale-95"
          >
            <span>Explore</span>
            <ChevronRight size={11} className="text-red-400" />
          </Link>
        </div>

        {/* Row 2 on Mobile (Full Width Page Switcher) / Right Controls on Desktop */}
        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 w-full md:w-auto">
          <CutePageSwitcher
            page={page}
            maxPage={maxPage}
            loading={loading}
            onPageChange={handlePageChange}
            variant="rose"
            className="w-full md:w-auto justify-between md:justify-start"
          />

          {/* Desktop Only: Full Button Name */}
          <Link
            href="/shorts"
            onClick={() => playGummyTap()}
            className="hidden md:inline-flex text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-red-500/30 transition-all items-center gap-1.5 whitespace-nowrap select-none shrink-0 group active:scale-95"
          >
            <span>Explore Shorts</span>
            <ChevronRight size={12} className="text-red-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Grid of Shorts Cards (Portrait 9:16) */}
      <CylinderPageSlider
        page={page}
        loading={loading}
        skeletonCount={6}
        gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4"
      >
        {currentPageItems.map((drama, idx) => (
          <div key={`${drama.id}_${idx}`} className="w-full aspect-[9/16]">
            <ShortDramaCard
              drama={drama}
              priority={idx < 3}
              isSaved={savedIds.has(drama.id)}
              onToggleSave={handleToggleSave}
            />
          </div>
        ))}
      </CylinderPageSlider>

      {/* Bottom Center-Aligned Page Switcher */}
      <div className="w-full flex items-center justify-center mt-6 md:mt-8 px-2 sm:px-0">
        <CutePageSwitcher
          page={page}
          maxPage={maxPage}
          loading={loading}
          onPageChange={handlePageChange}
          variant="rose"
          fullWidthOnMobile={true}
        />
      </div>
    </section>
  );
}
