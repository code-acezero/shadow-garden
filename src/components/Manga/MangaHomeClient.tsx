"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, ChevronRight, BookOpen, Clock, 
  TrendingUp, Scroll, BookText, Layers, ArrowLeft,
  History, X, Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import MobileContainer from '@/components/Layout/MobileContainer';
import Footer from '@/components/Anime/Footer';
import CuteShareBar from '@/components/Home/CuteShareBar';
import MangaCard from '@/components/Manga/MangaCard';
import MangaSection from '@/components/Manga/MangaSection';
import CylinderPageSlider from '@/components/UIx/CylinderPageSlider';
import MangaHeroSlider from '@/components/Manga/MangaHeroSlider';
import MonetLineIcon from '@/components/UIx/MonetLineIcon';
import CutePageSwitcher from '@/components/UIx/CutePageSwitcher';
import ContinueReadingCard from '@/components/Watchlist/ContinueReadingCard';
import { ReadingItem, ReadingMediaType } from '@/lib/manga';
import { atraxSquishTapVariants } from '@/lib/atraxMotion';
import { playGummyPop, playGummyTap } from '@/lib/audioManager';
import { useUserData } from '@/context/UserDataContext';
import { cn } from '@/lib/utils';

export default function MangaHomeClient() {
  const router = useRouter();
  const { continueReadingData, removeFromContinueReading } = useUserData();
  const [focusedType, setFocusedType] = useState<ReadingMediaType | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [focusedItems, setFocusedItems] = useState<ReadingItem[]>([]);
  const [loadingFocused, setLoadingFocused] = useState(false);

  const handleExploreSection = (t: ReadingMediaType | 'all') => {
    playGummyPop();
    if (t === 'all') {
      router.push('/explore?library=manga&category=trending');
    } else {
      router.push(`/explore?library=manga&type=${encodeURIComponent(t)}`);
    }
  };

  // Fetch items when user clicks "Explore All" on any section
  const isFocusedMode = focusedType !== null;

  useEffect(() => {
    if (!isFocusedMode) return;
    let isSubscribed = true;

    async function loadFocusedData() {
      setLoadingFocused(true);
      try {
        const endpoint = focusedType === 'recent'
          ? `/api/manga/recent?page=${page}&limit=18`
          : `/api/manga/trending?type=${focusedType}&page=${page}&limit=18`;

        const res = await fetch(endpoint);
        if (res.ok) {
          const json = await res.json();
          const list: ReadingItem[] = json.data || [];
          if (isSubscribed) {
            setFocusedItems(list);
            setTotalItems(json.total || list.length);
          }
        }
      } catch (err) {
        console.error('Failed to load focused items:', err);
      } finally {
        if (isSubscribed) setLoadingFocused(false);
      }
    }

    loadFocusedData();
    return () => { isSubscribed = false; };
  }, [isFocusedMode, focusedType, page]);

  const maxFocusedPage = Math.max(1, Math.ceil(totalItems / 18));

  return (
    <MobileContainer hasBottomNav className="bg-[#050505] relative w-full">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))] pointer-events-none" />
      <div className="shadow-light-top" />
      <div className="shadow-light-bottom" />

      <div className="min-h-full flex flex-col relative z-10 px-2 sm:px-6 pt-2 pb-16">
        
        {/* Slidable Hero Banner with Multiple Slides (No search bar, no top clutter) */}
        {!isFocusedMode && (
          <MangaHeroSlider />
        )}

        {/* MODE A: STANDALONE SECTIONS (Each with its own Language Filter & < page number > switcher) */}
        {!isFocusedMode && (
          <div className="flex flex-col gap-10 md:gap-14 w-full">
            {/* 0. Continue Reading Section (Integrated with user reading tracking) */}
            {continueReadingData && continueReadingData.length > 0 && (
              <section className="w-full relative z-10 animate-in fade-in duration-700 mt-2 md:mt-4 border-b border-white/5 pb-8">
                {/* Header matching Continue Watching */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center justify-between flex-nowrap mb-2 md:mb-6 gap-4 w-full"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <MonetLineIcon icon={History} variant="cyan" />
                    <h2 className="text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide flex items-center gap-2 leading-none">
                      CONTINUE <span className="text-cyan-400">READING</span>
                    </h2>
                    <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider">
                      {continueReadingData.length} in progress
                    </span>
                  </div>

                  <Link
                    href="/library?mode=readlist&tab=continue_reading"
                    onClick={() => playGummyPop()}
                    className="group flex-shrink-0 flex items-center gap-0.5 md:gap-1 text-[9px] md:text-[10px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest whitespace-nowrap"
                  >
                    <span>View All</span>
                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>

                {/* Horizontal Scroll Track matching Continue Watching */}
                <div className="w-full overflow-x-auto no-scrollbar py-2 md:py-6 snap-x snap-mandatory flex gap-4 md:gap-5">
                  {continueReadingData.slice(0, 10).map((item) => (
                    <ContinueReadingCard
                      key={`cr-${item.manga_id}`}
                      item={item}
                      onRemove={removeFromContinueReading}
                      className="flex-shrink-0 w-[42%] sm:w-[28%] md:w-[22%] lg:w-[15.5%] xl:w-[15.5%] snap-start"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 1. Recent Updates Section */}
            <MangaSection
              type="recent"
              title="RECENT"
              highlight="UPDATES"
              icon={
                <MonetLineIcon
                  icon={Clock}
                  variant="violet"
                />
              }
              accentColor="text-violet-400"
              onExplore={handleExploreSection}
            />

            {/* 2. Trending Titles Section */}
            <MangaSection
              type="all"
              title="TRENDING"
              highlight="TITLES"
              icon={
                <MonetLineIcon
                  icon={TrendingUp}
                  variant="amber"
                />
              }
              accentColor="text-amber-400"
              onExplore={handleExploreSection}
            />

            {/* 3. Japanese Manga Section */}
            <MangaSection
              type="manga"
              title="JAPANESE"
              highlight="MANGA"
              icon={
                <MonetLineIcon
                  icon={BookOpen}
                  variant="rose"
                />
              }
              accentColor="text-rose-400"
              onExplore={handleExploreSection}
            />

            {/* 4. Korean Manhwa & Webtoons Section */}
            <MangaSection
              type="manhwa"
              title="KOREAN"
              highlight="MANHWA & WEBTOONS"
              icon={
                <MonetLineIcon
                  icon={Scroll}
                  variant="cyan"
                />
              }
              accentColor="text-cyan-400"
              onExplore={handleExploreSection}
            />

            {/* 5. Light Novels & Web Novels Section */}
            <MangaSection
              type="light_novel"
              title="LIGHT NOVELS &"
              highlight="WEB NOVELS"
              icon={
                <MonetLineIcon
                  icon={BookText}
                  variant="purple"
                />
              }
              accentColor="text-purple-400"
              onExplore={handleExploreSection}
            />

            {/* 6. Chinese Manhua Section */}
            <MangaSection
              type="manhua"
              title="CHINESE"
              highlight="MANHUA"
              icon={
                <MonetLineIcon
                  icon={Layers}
                  variant="emerald"
                />
              }
              accentColor="text-emerald-400"
              onExplore={handleExploreSection}
            />
          </div>
        )}

        {/* MODE B: FOCUSED CATEGORY EXPLORE GRID */}
        {isFocusedMode && (
          <div className="flex flex-col gap-6">
            {/* Header & Reset Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <motion.button
                  variants={atraxSquishTapVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => {
                    playGummyPop();
                    setFocusedType(null);
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 mb-2 transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Back to All Sections</span>
                </motion.button>
                <h2 className="text-xl md:text-2xl font-black text-white font-lemon uppercase">
                  Explore: <span className="text-violet-400">
                    {focusedType === 'recent' 
                      ? 'Recent Updates' 
                      : focusedType === 'light_novel' 
                      ? 'Light Novels & Web Novels' 
                      : focusedType?.replace('_', ' ')}
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  {totalItems} titles cataloged in this collection
                </p>
              </div>

              {/* Actions: Cute Page Switcher + Close button */}
              <div className="flex flex-wrap items-center gap-2.5">
                <CutePageSwitcher
                  currentPage={page}
                  hasNextPage={page < maxFocusedPage && focusedItems.length >= 18}
                  onPrev={() => setPage((p) => Math.max(1, p - 1))}
                  onNext={() => setPage((p) => Math.min(maxFocusedPage, p + 1))}
                  loading={loadingFocused}
                  variant="purple"
                />

                <motion.button
                  variants={atraxSquishTapVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => {
                    playGummyPop();
                    setFocusedType(null);
                    setPage(1);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all self-start sm:self-auto"
                >
                  Close Explorer
                </motion.button>
              </div>
            </div>

            {/* Results Grid with 3D Cylinder Page Slider & Anti-Shrink Skeleton */}
            <CylinderPageSlider
              page={page}
              loading={loadingFocused}
              skeletonCount={18}
              gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-5"
            >
              {focusedItems.length === 0 ? (
                <div className="col-span-full py-24 text-center flex flex-col items-center justify-center gap-3">
                  <BookOpen size={48} className="text-zinc-600 stroke-[1.5]" />
                  <h3 className="text-lg font-bold text-white">No titles discovered</h3>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Please return to all sections to explore other categories.
                  </p>
                </div>
              ) : (
                focusedItems.map((item) => (
                  <MangaCard key={item.id} item={item} />
                ))
              )}
            </CylinderPageSlider>

            {/* Bottom Center-Aligned Cute Page Switcher */}
            {focusedItems.length > 0 && (
              <div className="w-full flex items-center justify-center pt-6 pb-2 border-t border-white/[0.04] px-2 sm:px-0">
                <CutePageSwitcher
                  currentPage={page}
                  hasNextPage={page < maxFocusedPage && focusedItems.length >= 18}
                  onPrev={() => setPage((p) => Math.max(1, p - 1))}
                  onNext={() => setPage((p) => Math.min(maxFocusedPage, p + 1))}
                  loading={loadingFocused}
                  variant="purple"
                />
              </div>
            )}
          </div>
        )}

        {/* CUTE SHARE BAR */}
        <CuteShareBar 
          badgeText="Share Mangvels"
          badgeSubtext="Reader Sanctuary"
          title="Invite your Fellow Readers to Kagemi!"
          description="Share tens of thousands of manga, manhwa, manhua & light novels with instant chapter loads, vertical webtoon scroll, and progress sync."
        />

        {/* Global Footer */}
        <div className="mt-12 md:mt-16">
          <Footer />
        </div>
      </div>
    </MobileContainer>
  );
}
