"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Globe, Check, 
  Search, ChevronDown, CheckCircle2
} from 'lucide-react';
import MangaCard from '@/components/Manga/MangaCard';
import CylinderPageSlider from '@/components/UIx/CylinderPageSlider';
import CutePageSwitcher from '@/components/UIx/CutePageSwitcher';
import { ReadingItem, ReadingMediaType } from '@/lib/manga';
import { SUPPORTED_LANGUAGES, LanguageMeta } from '@/lib/translator';
import { 
  atraxSquishTapVariants, 
  atraxChipTapVariants, 
  atraxBubblePopVariants, 
  ATRAX_BUBBLY_SPRING 
} from '@/lib/atraxMotion';
import { playGummyPop, playGummyTap } from '@/lib/audioManager';
import { cn } from '@/lib/utils';

// Language flag icons
const LANG_FLAGS: Record<string, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  bn: '🇧🇩',
  es: '🇪🇸',
  'es-la': '🇲🇽',
  fr: '🇫🇷',
  id: '🇮🇩',
  pt: '🇵🇹',
  'pt-br': '🇧🇷',
  ru: '🇷🇺',
  ja: '🇯🇵',
  de: '🇩🇪',
  it: '🇮🇹',
  ar: '🇸🇦',
  vi: '🇻🇳',
  th: '🇹🇭',
  tr: '🇹🇷',
  zh: '🇨🇳',
  'zh-hk': '🇭🇰',
  ko: '🇰🇷',
  pl: '🇵🇱',
  uk: '🇺🇦',
};

interface MangaSectionProps {
  type: ReadingMediaType;
  title: string;
  highlight: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor: string;
  initialLang?: string;
  onExplore: (type: ReadingMediaType) => void;
}

export default function MangaSection({
  type,
  title,
  highlight,
  subtitle,
  icon,
  accentColor,
  initialLang = 'all',
  onExplore,
}: MangaSectionProps) {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sectionLang, setSectionLang] = useState<string>(initialLang);

  // Single Bouncy Gummy Dropdown State
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter languages for gummy popover
  const allLanguagesList = useMemo(() => {
    return Object.values(SUPPORTED_LANGUAGES).map(l => ({
      ...l,
      flag: LANG_FLAGS[l.code] || '🌐'
    }));
  }, []);

  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return allLanguagesList;
    const q = langSearch.toLowerCase().trim();
    return allLanguagesList.filter(l => 
      l.label.toLowerCase().includes(q) || 
      l.native.toLowerCase().includes(q) || 
      l.code.toLowerCase().includes(q)
    );
  }, [allLanguagesList, langSearch]);

  const activeLangMeta = sectionLang !== 'all' 
    ? { ...(SUPPORTED_LANGUAGES[sectionLang] || { code: sectionLang, label: sectionLang.toUpperCase(), native: sectionLang.toUpperCase() }), flag: LANG_FLAGS[sectionLang] || '🌐' }
    : null;

  // Fetch Section Items
  useEffect(() => {
    let isSubscribed = true;

    async function loadSectionData() {
      setLoading(true);
      try {
        const langParam = sectionLang && sectionLang !== 'all' ? `&lang=${sectionLang}` : '';
        const endpoint = type === 'recent' 
          ? `/api/manga/recent?page=${page}&limit=12${langParam}`
          : `/api/manga/trending?type=${type}&page=${page}&limit=12${langParam}`;

        const res = await fetch(endpoint);
        if (res.ok) {
          const json = await res.json();
          let dataList: ReadingItem[] = json.data || [];

          // Client-side fallback language filter if needed
          if (sectionLang && sectionLang !== 'all') {
            dataList = dataList.filter(item => 
              item.isNovel || item.availableLanguages.includes(sectionLang)
            );
          }

          if (isSubscribed) {
            setItems(dataList);
            setTotal(json.total || 100);
          }
        }
      } catch (err) {
        console.error(`Failed to load ${type} section:`, err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    loadSectionData();
    return () => { isSubscribed = false; };
  }, [type, page, sectionLang]);

  // If page changed but no items, return null only if total is 0 and not loading
  if (!loading && items.length === 0 && page === 1 && sectionLang === 'all') {
    return null;
  }

  const maxPage = Math.max(1, Math.ceil(total / 12));

  return (
    <section className="w-full flex flex-col gap-3.5 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 border-b border-white/5 pb-3">
        {/* Row 1: Title (left) + Mobile Symmetrical Explore (right) */}
        <div className="flex items-center justify-between md:justify-start gap-2.5 sm:gap-3 w-full md:w-auto min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {icon}
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-white font-lemon uppercase tracking-wide flex items-center gap-2 leading-none truncate">
              <span>{title}</span>
              <span className={accentColor}>{highlight}</span>
            </h2>
          </div>

          {/* Mobile Only: Symmetrical Explore Button */}
          <motion.button
            variants={atraxSquishTapVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => {
              playGummyPop();
              onExplore(type);
            }}
            className="md:hidden text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-violet-500/40 hover:bg-white/10 transition-all inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>Explore</span>
            <ChevronRight size={11} className="text-violet-400" />
          </motion.button>
        </div>

        {/* Section Actions: Single Language Filter & Page Switcher */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
          {/* Single Language Filter Button with Bouncy Gummy Drop Menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <motion.button
              variants={atraxSquishTapVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              onClick={() => {
                playGummyPop();
                setShowLangMenu(!showLangMenu);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border select-none shadow-sm backdrop-blur-md",
                showLangMenu || sectionLang !== 'all'
                  ? "bg-violet-600/90 text-white border-violet-400/80 shadow-[0_0_16px_rgba(139,92,246,0.4)]"
                  : "bg-white/[0.04] hover:bg-white/[0.09] text-zinc-300 hover:text-white border-white/10"
              )}
              title="Language Filter"
            >
              <span className="text-sm leading-none">{activeLangMeta?.flag || '🌐'}</span>
              <span className="font-semibold tracking-wide">
                {sectionLang === 'all' 
                  ? 'Language Filter' 
                  : sectionLang === 'en' 
                  ? 'English (Primary)' 
                  : (activeLangMeta?.native || activeLangMeta?.label || sectionLang.toUpperCase())}
              </span>
              <motion.div
                animate={{ rotate: showLangMenu ? 180 : 0 }}
                transition={ATRAX_BUBBLY_SPRING}
              >
                <ChevronDown size={13} className="text-violet-300 opacity-90" />
              </motion.div>
            </motion.button>

            {/* Bouncy Gummy Dropdown Menu (Clean, Simpler, Cute Design) */}
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  variants={atraxBubblePopVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute right-0 top-full mt-2.5 w-76 sm:w-80 max-h-[400px] overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_24px_rgba(139,92,246,0.18)] border border-violet-500/25 bg-zinc-900/95 backdrop-blur-3xl z-50 flex flex-col p-3"
                >
                  {/* Subtle Cute Glow Orb in Background */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-violet-500/20 blur-2xl pointer-events-none rounded-full" />

                  {/* Cute Rounded-Full Search Bar */}
                  <div className="relative mb-2.5 shrink-0">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400" />
                    <input
                      type="text"
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      placeholder="Search language..."
                      className="w-full bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.15] border border-white/10 focus:border-violet-400/80 rounded-full pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-zinc-400 outline-none transition-all"
                    />
                  </div>

                  {/* Primary Options: English Primary & All Languages */}
                  <div className="flex flex-col gap-1.5 pb-2 border-b border-white/10 shrink-0">
                    {/* English (Primary) */}
                    <motion.button
                      variants={atraxChipTapVariants}
                      whileTap="tap"
                      whileHover="hover"
                      onClick={() => {
                        playGummyPop();
                        setSectionLang('en');
                        setShowLangMenu(false);
                        setPage(1);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-2xl transition-all flex items-center justify-between text-xs",
                        sectionLang === 'en'
                          ? "bg-violet-600 text-white shadow-[0_4px_16px_rgba(139,92,246,0.4)] font-bold"
                          : "bg-white/[0.04] hover:bg-violet-500/10 text-zinc-200 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg leading-none">🇬🇧</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">English</span>
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-400/20 text-violet-300 border border-violet-400/30">
                            Primary
                          </span>
                        </div>
                      </div>
                      {sectionLang === 'en' && (
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                          <Check size={12} className="text-white stroke-[3]" />
                        </div>
                      )}
                    </motion.button>

                    {/* All Languages */}
                    <motion.button
                      variants={atraxChipTapVariants}
                      whileTap="tap"
                      whileHover="hover"
                      onClick={() => {
                        playGummyPop();
                        setSectionLang('all');
                        setShowLangMenu(false);
                        setPage(1);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-2xl transition-all flex items-center justify-between text-xs",
                        sectionLang === 'all'
                          ? "bg-violet-600 text-white shadow-[0_4px_16px_rgba(139,92,246,0.4)] font-bold"
                          : "bg-white/[0.04] hover:bg-violet-500/10 text-zinc-200 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg leading-none">🌐</span>
                        <span className="font-bold">All Languages</span>
                      </div>
                      {sectionLang === 'all' && (
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                          <Check size={12} className="text-white stroke-[3]" />
                        </div>
                      )}
                    </motion.button>
                  </div>

                  {/* Clean, Cute Languages List */}
                  <div className="overflow-y-auto max-h-56 flex flex-col gap-1 pt-2 pr-1 no-scrollbar">
                    <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-400/90">
                      More Languages ({filteredLanguages.length})
                    </div>
                    {filteredLanguages.map((l) => {
                      if (l.code === 'en') return null; // Pinned at top
                      const isSelected = sectionLang === l.code;
                      return (
                        <motion.button
                          key={l.code}
                          variants={atraxChipTapVariants}
                          whileTap="tap"
                          whileHover="hover"
                          onClick={() => {
                            playGummyPop();
                            setSectionLang(l.code);
                            setShowLangMenu(false);
                            setPage(1);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-1.5 rounded-xl transition-all flex items-center justify-between text-xs",
                            isSelected
                              ? "bg-violet-600 text-white font-bold shadow-sm"
                              : "hover:bg-violet-500/10 text-zinc-300 hover:text-white"
                          )}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="text-base leading-none">{l.flag}</span>
                            <span className="font-semibold">{l.label}</span>
                            {l.native !== l.label && (
                              <span className="text-[10px] text-violet-300/80 font-normal">
                                {l.native}
                              </span>
                            )}
                          </span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                              <Check size={10} className="text-white stroke-[3]" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section Page Switcher in Header: Cute < page number > */}
          <CutePageSwitcher
            currentPage={page}
            hasNextPage={page < maxPage}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(maxPage, p + 1))}
            loading={loading}
            variant="purple"
            className="flex-1 md:flex-initial justify-between md:justify-center"
          />

          {/* Desktop Only Explore More Button with Gummy Animation */}
          <motion.button
            variants={atraxSquishTapVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => {
              playGummyPop();
              onExplore(type);
            }}
            className="hidden md:inline-flex text-[11px] font-black uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-violet-500/40 hover:bg-white/10 transition-all items-center gap-1 whitespace-nowrap"
          >
            <span>Explore</span>
            <ChevronRight size={12} className="text-violet-400" />
          </motion.button>
        </div>
      </div>

      {/* Grid of Cards with 3D Cylinder Page Slider & Anti-Shrink Skeleton */}
      <CylinderPageSlider
        page={page}
        loading={loading}
        skeletonCount={12}
        gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-5"
      >
        {items.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-zinc-500 bg-white/[0.02] rounded-2xl border border-white/5">
            No titles found for this category with the selected language filter.
          </div>
        ) : (
          items.map((item) => (
            <MangaCard key={item.id} item={item} activeLang={sectionLang} />
          ))
        )}
      </CylinderPageSlider>

      {/* Bottom Center-Aligned Cute Page Switcher: < page number > */}
      {!loading && items.length > 0 && (
        <div className="w-full flex items-center justify-center pt-5 pb-2 my-2 border-t border-white/[0.05] px-2 sm:px-0">
          <CutePageSwitcher
            currentPage={page}
            hasNextPage={page < maxPage}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(maxPage, p + 1))}
            loading={loading}
            variant="purple"
          />
        </div>
      )}
    </section>
  );
}
