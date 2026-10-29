"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Heart, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import AnimeCard from '@/components/Anime/AnimeCard';
import MonetLineIcon from '@/components/UIx/MonetLineIcon';

interface AllTimeFavoriteCarouselProps {
  initialItems?: any[];
}

export default function AllTimeFavoriteCarousel({ initialItems = [] }: AllTimeFavoriteCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<any[]>(() => (Array.isArray(initialItems) ? initialItems.filter(Boolean) : []));
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);

  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  // Sync state to refs
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      const valid = initialItems.filter(Boolean);
      setItems(valid);
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    const fetchFirst = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/anime/favorite?page=1&perPage=24`);
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && data.ok && Array.isArray(data.results)) {
            const valid = data.results.filter((i: any) => i && (i.id || i.slug));
            setItems(valid);
            if (valid.length < 24) {
              setHasMore(false);
              hasMoreRef.current = false;
            }
          }
        }
      } catch (err) {
        console.error("Failed to load initial favorite anime:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchFirst();
    return () => { isSubscribed = false; };
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      const res = await fetch(`/api/anime/favorite?page=${nextPage}&perPage=24`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.results) && data.results.length > 0) {
          const validNew = data.results.filter((i: any) => i && (i.id || i.slug));
          
          setItems(prev => {
            const existingIds = new Set(prev.map(i => String(i?.id || i?.slug || '')));
            const uniqueNew = validNew.filter((i: any) => !existingIds.has(String(i?.id || i?.slug || '')));
            return [...prev, ...uniqueNew];
          });

          pageRef.current = nextPage;
          setPage(nextPage);

          if (validNew.length < 24) {
            setHasMore(false);
            hasMoreRef.current = false;
          }
        } else {
          setHasMore(false);
          hasMoreRef.current = false;
        }
      } else {
        setHasMore(false);
        hasMoreRef.current = false;
      }
    } catch (err) {
      console.error("Failed to load more favorite anime:", err);
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || loadingRef.current || !hasMoreRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    if (scrollLeft + clientWidth >= scrollWidth - 600) {
      loadMore();
    }
  }, [loadMore]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      if (direction === 'right') {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 800) {
          loadMore();
        }
      }
      const scrollAmount = direction === 'left' ? -480 : 480;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const safeItems = items.filter(Boolean);
  if (!loading && safeItems.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-4 md:mb-6">
        <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 w-full sm:w-auto min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <MonetLineIcon icon={Heart} variant="primary" />
            <h2 className="text-base sm:text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide leading-none truncate whitespace-nowrap">
              ALL TIME FAVORITES
            </h2>
          </div>

          {/* Mobile View All */}
          <Link
            href="/explore?category=favorite"
            onClick={() => playGummyTap()}
            className="sm:hidden text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-primary-500/30 transition-all inline-flex items-center gap-1 whitespace-nowrap select-none shrink-0 active:scale-95"
          >
            <span>View All</span>
            <ChevronRight size={11} className="text-primary-400" />
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
          <Link
            href="/explore?category=favorite"
            onClick={() => playGummyTap()}
            className="text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-primary-500/30 transition-colors hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <span>View All</span>
            <ChevronRight size={12} className="text-primary-400" />
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-transform active:scale-90"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-transform active:scale-90"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Infinite Horizontal Carousel */}
      {loading ? (
        <div className="w-full overflow-x-auto no-scrollbar py-2 md:py-6 snap-x snap-mandatory flex gap-4 md:gap-5 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[42%] sm:w-[28%] md:w-[22%] lg:w-[15.5%] xl:w-[15.5%] aspect-[3/4] bg-white/5 rounded-2xl border border-white/5" />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="w-full overflow-x-auto no-scrollbar py-2 md:py-6 snap-x snap-mandatory flex gap-4 md:gap-5 scroll-smooth"
        >
          {safeItems.map((anime, index) => {
            const rank = index + 1;
            const uniqueKey = `${anime.id || anime.slug || 'fav'}-${index}`;

            return (
              <div
                key={uniqueKey}
                className="flex-shrink-0 w-[42%] sm:w-[28%] md:w-[22%] lg:w-[15.5%] xl:w-[15.5%] relative group snap-start"
              >
                <AnimeCard 
                  anime={anime} 
                  rank={rank} 
                  aspectRatio="aspect-[3/4]" 
                />
              </div>
            );
          })}

          {loadingMore && (
            <div className="flex-shrink-0 w-[42%] sm:w-[28%] md:w-[22%] lg:w-[15.5%] xl:w-[15.5%] aspect-[3/4] flex items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02]">
              <Loader2 size={24} className="animate-spin text-red-500" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
