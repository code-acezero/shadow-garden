"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';
import MonetLineIcon from '@/components/UIx/MonetLineIcon';
import CutePageSwitcher from '@/components/UIx/CutePageSwitcher';
import CylinderPageSlider from '@/components/UIx/CylinderPageSlider';
import MangaCard from '@/components/Manga/MangaCard';
import { ReadingItem } from '@/lib/manga';
import { playGummyTap } from '@/lib/audioManager';

// Fallback curated Mangvels to guarantee section never vanishes on network hiccups
const FALLBACK_MANGVELS: ReadingItem[] = [
  {
    id: '32d76d19-8a05-4db0-9fc2-e0b0648fe9d0',
    slug: 'solo-leveling',
    title: 'Solo Leveling',
    altTitles: ['Na Honjaman Level Up'],
    description: 'In a world where hunters awaken magical powers, the weakest hunter discovers a quest system to become the strongest.',
    cover: 'https://uploads.mangadex.org/covers/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/e90bdc47-c8b9-4df7-b2c0-17641b645ee1.jpg.512.jpg',
    type: 'manhwa',
    status: 'completed',
    genres: ['Action', 'Fantasy', 'Supernatural'],
    latestChapter: 'Ch. 200 (Epilogue)',
    availableLanguages: ['en', 'hi'],
  },
  {
    id: '77bee52c-d2d6-4414-8582-9910a30fe884',
    slug: 'the-eminence-in-shadow',
    title: 'The Eminence in Shadow',
    altTitles: ['Kage no Jitsuryokusha ni Naritakute!'],
    description: 'Cid Kagenou strives to become a mastermind behind the scenes, accidentally fighting a real evil cult.',
    cover: 'https://uploads.mangadex.org/covers/77bee52c-d2d6-4414-8582-9910a30fe884/2c6a0c0e-436f-40f4-86a3-a75d5e71e7a5.jpg.512.jpg',
    type: 'manga',
    status: 'ongoing',
    genres: ['Action', 'Comedy', 'Fantasy', 'Isekai'],
    latestChapter: 'Chapter 65',
    availableLanguages: ['en', 'hi'],
  },
  {
    id: 'c07043ae-35c6-43d9-95e5-22d73359d9f5',
    slug: 'omniscient-readers-viewpoint',
    title: "Omniscient Reader's Viewpoint",
    altTitles: ['Jeonjijeog Dogja Sijeom'],
    description: 'Dokja was an ordinary office worker whose sole interest was reading his favorite web novel. But when the novel becomes reality, he is the only person who knows how the world ends.',
    cover: 'https://uploads.mangadex.org/covers/c07043ae-35c6-43d9-95e5-22d73359d9f5/83f3e69d-2101-4475-ae90-c63bfb6b37db.jpg.512.jpg',
    type: 'manhwa',
    status: 'ongoing',
    genres: ['Action', 'Fantasy', 'Mystery'],
    latestChapter: 'Ch. 210',
    availableLanguages: ['en', 'hi'],
  },
  {
    id: 'b0b721ff-c388-4486-aa0f-c8b0e92152b0',
    slug: 'frieren-beyond-journeys-end',
    title: "Frieren: Beyond Journey's End",
    altTitles: ['Sousou no Frieren'],
    description: 'The adventure is over but life goes on for an elf mage just beginning to learn what living is all about.',
    cover: 'https://uploads.mangadex.org/covers/b0b721ff-c388-4486-aa0f-c8b0e92152b0/e8eef714-ec3b-417c-87d2-7c9c0b115980.jpg.512.jpg',
    type: 'manga',
    status: 'ongoing',
    genres: ['Adventure', 'Drama', 'Fantasy'],
    latestChapter: 'Ch. 130',
    availableLanguages: ['en'],
  },
  {
    id: 'bd6d09d0-0797-4f6c-9407-4e0e56163f4a',
    slug: 'mushoku-tensei',
    title: 'Mushoku Tensei: Jobless Reincarnation',
    altTitles: ['Isekai Ittara Honki Dasu'],
    description: 'A 34-year-old NEET gets a second chance at life in a magical world as Rudeus Greyrat, determined to live with no regrets.',
    cover: 'https://uploads.mangadex.org/covers/bd6d09d0-0797-4f6c-9407-4e0e56163f4a/29514b8a-b50a-4a6c-9c98-a15d7b5b5df3.jpg.512.jpg',
    type: 'light_novel',
    status: 'completed',
    genres: ['Adventure', 'Drama', 'Fantasy', 'Isekai'],
    latestChapter: 'Vol. 26',
    availableLanguages: ['en'],
  },
  {
    id: 'a77742b1-d3b4-4994-ae94-4282297d21b2',
    slug: 'chainsaw-man',
    title: 'Chainsaw Man',
    altTitles: ['CSM'],
    description: 'Denji’s life of poverty is changed forever when he merges with his pet chainsaw devil, Pochita.',
    cover: 'https://uploads.mangadex.org/covers/a77742b1-d3b4-4994-ae94-4282297d21b2/097a4855-4428-48bc-b271-2900e8f3bf05.jpg.512.jpg',
    type: 'manga',
    status: 'ongoing',
    genres: ['Action', 'Comedy', 'Horror', 'Supernatural'],
    latestChapter: 'Ch. 170',
    availableLanguages: ['en'],
  }
];

export default function MangvelsHomeSection() {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(10);
  const cacheRef = useRef<Record<number, ReadingItem[]>>({});

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
    async function fetchMangvels() {
      const cached = cacheRef.current[page];
      if (cached && cached.length > 0) {
        setItems(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/manga/trending?type=all&page=${page}&limit=12`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data.items) ? data.items : (Array.isArray(data.data) ? data.data : []);
          if (isSubscribed && list.length > 0) {
            setItems(list);
            cacheRef.current[page] = list;
            setMaxPage(Math.min(10, Math.ceil((data.total || 100) / 12)));
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load Mangvels for home:', err);
      }

      if (isSubscribed) {
        // Fall back to curated list if page 1 or empty
        if (page === 1) {
          setItems(FALLBACK_MANGVELS);
        }
        setLoading(false);
      }
    }

    fetchMangvels();
    return () => { isSubscribed = false; };
  }, [page]);

  return (
    <section className="w-full my-4 md:my-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 mb-4 md:mb-6">
        {/* Row 1: Title (left) & Mobile Explore Button (right) */}
        <div className="flex items-center justify-between md:justify-start gap-2.5 md:gap-3.5 w-full md:w-auto min-w-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <MonetLineIcon icon={BookOpen} variant="purple" />
            <h2 className="text-base sm:text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide leading-none truncate">
              MANGVELS
            </h2>
          </div>

          {/* Mobile Only: Symmetrical Explore Button */}
          <Link
            href="/manga"
            onClick={() => playGummyTap()}
            className="md:hidden text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all inline-flex items-center gap-1 whitespace-nowrap select-none shrink-0 active:scale-95"
          >
            <span>Explore</span>
            <ChevronRight size={11} className="text-purple-400" />
          </Link>
        </div>

        {/* Row 2 on Mobile (Full Width Page Switcher) / Right Controls on Desktop */}
        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 w-full md:w-auto">
          <CutePageSwitcher
            page={page}
            maxPage={maxPage}
            loading={loading}
            onPageChange={handlePageChange}
            variant="purple"
            className="w-full md:w-auto justify-between md:justify-start"
          />

          {/* Desktop Only: Full Button Name */}
          <Link
            href="/manga"
            onClick={() => playGummyTap()}
            className="hidden md:inline-flex text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all items-center gap-1.5 whitespace-nowrap select-none shrink-0 group active:scale-95"
          >
            <span>Explore Mangvels</span>
            <ChevronRight size={12} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Grid of Manga Cards (Aspect 2:3) */}
      <CylinderPageSlider
        page={page}
        loading={loading}
        skeletonCount={12}
        gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-5"
      >
        {items.map((item) => (
          <div key={item.id} className="transform-gpu transition-transform duration-300 hover:scale-[1.03]">
            <MangaCard item={item} />
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
          variant="purple"
          fullWidthOnMobile={true}
        />
      </div>
    </section>
  );
}
