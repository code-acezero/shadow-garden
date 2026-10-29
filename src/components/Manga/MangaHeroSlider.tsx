"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, BookOpen, Star, 
  BookMarked, Info, Layers, Bookmark, BookmarkCheck, Globe,
  ChevronDown, Check, Clock, Pause, XCircle, Trash2, CheckCircle2
} from 'lucide-react';
import { ReadingItem } from '@/lib/manga';
import { atraxSquishTapVariants, atraxChipTapVariants } from '@/lib/atraxMotion';
import { playGummyPop, playGummyTap } from '@/lib/audioManager';
import { useUserData } from '@/context/UserDataContext';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const READLIST_STATUSES = [
  { id: 'reading', label: 'Reading', color: 'text-violet-400', icon: <BookOpen size={14} className="text-violet-400" /> },
  { id: 'plan_to_read', label: 'Planned', color: 'text-sky-400', icon: <Clock size={14} className="text-sky-400" /> },
  { id: 'completed', label: 'Completed', color: 'text-emerald-400', icon: <CheckCircle2 size={14} className="text-emerald-400" /> },
  { id: 'on_hold', label: 'On Hold', color: 'text-amber-400', icon: <Pause size={14} className="text-amber-400" /> },
  { id: 'dropped', label: 'Dropped', color: 'text-rose-400', icon: <XCircle size={14} className="text-rose-400" /> },
];

// Curated high-fidelity spotlight slides with cinematic backdrops
const FEATURED_SLIDES = [
  {
    id: "32d76d19-8a05-4db0-9fc2-e0b0648fe9d0",
    title: "Solo Leveling",
    nativeTitle: "나 혼자만 레벨업",
    type: "manhwa",
    badge: "Korean Manhwa",
    score: "9.8",
    rating: "Rank #1",
    totalChapters: "200 Chapters",
    cover: "https://uploads.mangadex.org/covers/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/e90bdc47-c8b9-4df7-b2c0-17641b645ee1.jpg.512.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/manga/banner/105398-4UrEhdqZukrg.jpg",
    description: "10 years ago, after 'the Gate' that connected the real world with the monster world opened, some of the ordinary, everyday people received the power to hunt monsters within the Gate. They are known as 'Hunters'. Sung Jin-Woo, known as the 'Weakest Hunter of All Mankind', discovers a secret quest inside a deadly double dungeon that allows him to level up alone.",
    languages: "Multi Language"
  },
  {
    id: "9a414441-bbad-43f1-a3a7-dc262ca790a3",
    title: "Omniscient Reader's Viewpoint",
    nativeTitle: "전지적 독자 시점",
    type: "manhwa",
    badge: "Korean Manhwa",
    score: "9.7",
    rating: "Rank #2",
    totalChapters: "220 Chapters",
    cover: "https://uploads.mangadex.org/covers/9a414441-bbad-43f1-a3a7-dc262ca790a3/be18dc9a-7f1c-4ca5-b318-ffff2d7d58c3.jpg.512.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/manga/banner/119257-RtxJMRCunHXc.jpg",
    description: "'This is a development I know of.' In a split second, the world had been destroyed, and a new universe had unfolded. The ordinary life of an ordinary reader who knew the ending of the novel was about to change. Dokja is the sole reader who knows how the apocalyptic world operates.",
    languages: "Multi Language"
  },
  {
    id: "77bee52c-d2d6-44ad-a33a-1734c1fe696a",
    title: "The Eminence in Shadow",
    nativeTitle: "陰の実力者になりたくて！",
    type: "manga",
    badge: "Japanese Manga",
    score: "9.9",
    rating: "Shadow Garden",
    totalChapters: "65+ Chapters",
    cover: "https://uploads.mangadex.org/covers/77bee52c-d2d6-44ad-a33a-1734c1fe696a/6079dd31-838b-4d61-87c4-121f3ad19158.jpg.512.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/130298-9yxFlFvKMwRk.jpg",
    description: "Cid Kagenou does not want to be a protagonist, nor does he want to be a final boss. He prefers to keep a low profile as a minor character, until it's time to reveal that he's the mastermind behind everything! Reborn in another world, he creates Shadow Garden to operate from the shadows.",
    languages: "Multi Language"
  },
  {
    id: "b0b721ff-c388-4486-aa0f-c2b0bb321512",
    title: "Frieren: Beyond Journey's End",
    nativeTitle: "葬送のフリーレン",
    type: "manga",
    badge: "Japanese Manga",
    score: "9.8",
    rating: "Award Winner",
    totalChapters: "135 Chapters",
    cover: "https://uploads.mangadex.org/covers/b0b721ff-c388-4486-aa0f-c2b0bb321512/b9a049b0-186b-4714-a83e-bb965458914a.jpg.512.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg",
    description: "The adventure is over, but life goes on for an elf mage just beginning to learn what living is all about. Elf mage Frieren and her courageous fellow adventurers have defeated the Demon King and brought peace to the land. But Frieren will long outlive the rest of her former party.",
    languages: "Multi Language"
  },
  {
    id: "a77742b1-befd-49a4-bff5-1ad4e6b0ef7b",
    title: "Chainsaw Man",
    nativeTitle: "チェンソーマン",
    type: "manga",
    badge: "Japanese Manga",
    score: "9.6",
    rating: "Top Shonen",
    totalChapters: "180+ Chapters",
    cover: "https://uploads.mangadex.org/covers/a77742b1-befd-49a4-bff5-1ad4e6b0ef7b/6e518bd1-5f60-446b-8832-bfe6bf74834b.jpg.512.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/manga/banner/105778-ppHaMwown6c9.jpg",
    description: "Denji has a simple dream—to live a happy and peaceful life, spending time with a girl he likes. This is a far cry from reality, however, as Denji is forced by the yakuza into killing devils in order to pay off his crushing debts.",
    languages: "Multi Language"
  },
  {
    id: "novel-shadow-slave",
    title: "Shadow Slave",
    nativeTitle: "Shadow Slave",
    type: "web_novel",
    badge: "Web Novel",
    score: "9.9",
    rating: "Global Phenomenon",
    totalChapters: "1800+ Chapters",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600&auto=format&fit=crop",
    description: "Growing up in poverty, Sunny never expected anything good from life. However, even he did not anticipate being chosen by the Nightmare Spell and becoming one of the Awakened—an elite group of people gifted with supernatural powers.",
    languages: "Multi Language"
  }
];

const getProxiedUrl = (url: string) => {
  if (!url) return '/images/placeholder.jpg';
  if (url.includes('anilist.co') || url.includes('unsplash.com')) return url;
  if (url.startsWith('/api/proxy') || url.startsWith('/images/')) return url;
  return `/api/proxy?url=${encodeURIComponent(url)}`;
};

export default function MangaHeroSlider() {
  const { readlist, addToReadlist, updateReadlistStatus, removeFromReadlist } = useUserData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedBanners, setFailedBanners] = useState<Record<string, boolean>>({});
  const [showReadlistMenu, setShowReadlistMenu] = useState(false);
  const readlistMenuRef = useRef<HTMLDivElement>(null);
  const totalSlides = FEATURED_SLIDES.length;

  // Auto-slide every 6.5 seconds when not paused and menu not open
  useEffect(() => {
    if (isPaused || showReadlistMenu) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 6500);
    return () => clearInterval(timer);
  }, [isPaused, showReadlistMenu, totalSlides]);

  // Click outside to close readlist menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (readlistMenuRef.current && !readlistMenuRef.current.contains(event.target as Node)) {
        setShowReadlistMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const slide = FEATURED_SLIDES[currentIndex];
  const hasBanner = slide.banner && !failedBanners[slide.id];
  const currentReadlistItem = readlist.find(i => i.id === slide.id || i.anime_id === slide.id);
  const isInReadlist = !!currentReadlistItem;

  const handleSetReadlistStatus = async (newStatus: string) => {
    playGummyPop();
    try {
      if (!isInReadlist) {
        await addToReadlist({
          id: slide.id,
          title: slide.title,
          image: slide.cover,
          poster: slide.banner,
          status: newStatus,
          media_type: slide.type || 'manga',
          total_chapters: parseInt(slide.totalChapters) || undefined
        });
        toast.success(`Saved "${slide.title}" to Readlist!`);
      } else {
        await updateReadlistStatus(slide.id, newStatus);
        toast.info(`Updated status to ${newStatus.replace('_', ' ')}`);
      }
    } catch (err) {
      console.error(err);
    }
    setShowReadlistMenu(false);
  };

  const handleRemoveReadlist = async () => {
    playGummyPop();
    try {
      await removeFromReadlist(slide.id);
      toast.info(`Removed "${slide.title}" from Readlist`);
    } catch (err) {
      console.error(err);
    }
    setShowReadlistMenu(false);
  };

  return (
    <div 
      className="relative w-full rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl mb-10 select-none group/slider min-h-[400px] md:min-h-[450px] pb-14 md:pb-12 flex items-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Banner with Blended Light & Dark Poster Fallback */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          {hasBanner ? (
            <img
              src={getProxiedUrl(slide.banner)}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => {
                setFailedBanners((prev) => ({ ...prev, [slide.id]: true }));
              }}
              className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.08] saturate-[1.12]"
            />
          ) : (
            /* Foreshadowed blended light & dark poster banner backdrop */
            <div className="relative w-full h-full overflow-hidden bg-black">
              <img
                src={getProxiedUrl(slide.cover)}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center filter blur-3xl scale-150 brightness-[0.70] contrast-110 saturate-140 transform-gpu"
              />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.22)_0%,rgba(0,0,0,0.5)_70%,black_100%)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
            </div>
          )}

          {/* Cinematic Dynamic Vignette & Text Readability Overlays - Artwork stays bright and vibrant */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070707]/95 via-[#070707]/55 to-transparent md:w-[60%]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.18),transparent_65%)]" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#070707]/35 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Slide Content */}
      <div className="relative z-10 w-full p-4 sm:p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
        {/* Floating Cover Card */}
        <motion.div 
          key={`cover-${slide.id}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative w-28 sm:w-36 md:w-52 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.9)] border border-white/15 group"
        >
          <img
            src={getProxiedUrl(slide.cover)}
            alt={slide.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = '/images/placeholder.jpg';
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px] font-bold text-white">
            <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 font-mono">
              {slide.totalChapters}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 backdrop-blur-md border border-amber-500/30 flex items-center gap-0.5">
              <Star size={9} className="fill-amber-400 text-amber-400" />
              {slide.score}
            </span>
          </div>
        </motion.div>

        {/* Text Info & Controls */}
        <div className="flex-1 flex flex-col justify-center text-left min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`info-${slide.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col"
            >
              {/* Badges without circular container */}
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]">
                  FEATURED
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                  {slide.badge}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {slide.rating}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Globe size={11} className="text-emerald-400" />
                  <span>Multi Language</span>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-white font-lemon tracking-wide line-clamp-1 mb-1.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                {slide.title}
              </h1>

              {slide.nativeTitle && (
                <p className="text-xs text-zinc-400 font-medium mb-3">
                  {slide.nativeTitle}
                </p>
              )}

              {/* Synopsis */}
              <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed mb-6 max-w-3xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                {slide.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <motion.div
                  variants={atraxSquishTapVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link
                    href={slide.type === 'light_novel' || slide.type === 'web_novel' ? `/novel/read/${slide.id}/chap-1` : `/manga/${slide.id}`}
                    onClick={() => playGummyPop()}
                    className="px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_24px_rgba(139,92,246,0.5)] flex items-center gap-2 select-none"
                  >
                    <BookMarked size={15} />
                    <span>Start Reading</span>
                  </Link>
                </motion.div>

                <motion.div
                  variants={atraxSquishTapVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link
                    href={`/manga/${slide.id}`}
                    onClick={() => playGummyPop()}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs uppercase tracking-wider border border-white/15 transition-all flex items-center gap-1.5 select-none"
                  >
                    <Info size={14} className="text-zinc-400" />
                    <span>Chapter List</span>
                  </Link>
                </motion.div>

                <div className="relative" ref={readlistMenuRef}>
                  <motion.div
                    variants={atraxSquishTapVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        playGummyPop();
                        setShowReadlistMenu(!showReadlistMenu);
                      }}
                      className={cn(
                        "px-5 py-2.5 rounded-full font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 select-none",
                        isInReadlist
                          ? "bg-violet-600/30 text-violet-200 border border-violet-500/50 shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:bg-violet-600/40"
                          : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                      )}
                    >
                      {isInReadlist ? (
                        <>
                          <BookmarkCheck size={14} className="text-violet-400" />
                          <span>{READLIST_STATUSES.find(s => s.id === currentReadlistItem?.status)?.label || 'In Readlist'}</span>
                        </>
                      ) : (
                        <>
                          <Bookmark size={14} className="text-zinc-400" />
                          <span>Add to Read</span>
                        </>
                      )}
                      <ChevronDown size={13} className={cn("text-zinc-400 transition-transform duration-200", showReadlistMenu && "rotate-180")} />
                    </button>
                  </motion.div>

                  {/* Readlist Options Popover Menu */}
                  <AnimatePresence>
                    {showReadlistMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 6 }}
                        transition={{ type: "spring", stiffness: 450, damping: 28 }}
                        className="absolute left-0 bottom-full mb-2 w-56 rounded-2xl border border-white/10 bg-[#0d0d0e]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_20px_rgba(139,92,246,0.2)] p-2 z-50 flex flex-col gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/10 pb-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                            Reading Status
                          </span>
                          {isInReadlist && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              Saved
                            </span>
                          )}
                        </div>

                        {READLIST_STATUSES.map((statusItem) => {
                          const isCurrent = isInReadlist && (currentReadlistItem?.status || 'reading') === statusItem.id;
                          return (
                            <button
                              key={statusItem.id}
                              onClick={() => handleSetReadlistStatus(statusItem.id)}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between",
                                isCurrent 
                                  ? "bg-violet-600 text-white shadow-sm"
                                  : "text-zinc-300 hover:text-white hover:bg-white/5"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {statusItem.icon}
                                <span>{statusItem.label}</span>
                              </div>
                              {isCurrent && <Check size={13} className="stroke-[3]" />}
                            </button>
                          );
                        })}

                        {isInReadlist && (
                          <>
                            <div className="h-px bg-white/10 my-1" />
                            <button
                              onClick={handleRemoveReadlist}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all flex items-center gap-2"
                            >
                              <Trash2 size={13} />
                              <span>Remove from Readlist</span>
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Navigation Capsule: [ < ] [ • • • • • • ] [ > ] */}
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.85)]">
        {/* Previous Button (Left of Dots) */}
        <motion.button
          variants={atraxSquishTapVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          onClick={() => {
            playGummyPop();
            handlePrev();
          }}
          aria-label="Previous Slide"
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-violet-600/80 border border-white/15 text-white flex items-center justify-center transition-all select-none shadow-sm"
        >
          <ChevronLeft size={15} />
        </motion.button>

        {/* Slide Indicator Dots */}
        <div className="flex items-center gap-1.5 px-1">
          {FEATURED_SLIDES.map((s, idx) => (
            <motion.button
              key={s.id}
              variants={atraxChipTapVariants}
              whileTap="tap"
              onClick={() => {
                playGummyTap();
                setCurrentIndex(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                currentIndex === idx 
                  ? "w-6 bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.9)]" 
                  : "w-1.5 bg-white/30 hover:bg-white/60"
              )}
            />
          ))}
        </div>

        {/* Next Button (Right of Dots) */}
        <motion.button
          variants={atraxSquishTapVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          onClick={() => {
            playGummyPop();
            handleNext();
          }}
          aria-label="Next Slide"
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-violet-600/80 border border-white/15 text-white flex items-center justify-center transition-all select-none shadow-sm"
        >
          <ChevronRight size={15} />
        </motion.button>
      </div>
    </div>
  );
}
