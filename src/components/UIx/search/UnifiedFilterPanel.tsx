"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, RotateCcw, Dices, Search, CheckCircle, ChevronDown, 
  Tv, Info, Calendar, Layers, Languages, ArrowDownAZ, Star, Flame, SlidersHorizontal,
  Globe, Tag, Check, Filter, HelpCircle
} from 'lucide-react';
import { 
  SEARCH_TARGETS, SearchTargetConfig, UNIFIED_GENRES, 
  MEDIA_FORMATS, STATUS_OPTIONS, AUDIO_LANGUAGES, 
  SEASONS, YEARS, UNIFIED_SORT_OPTIONS 
} from './SearchConfig';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { playGummyTap } from '@/lib/audioManager';

interface UnifiedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    target: string;
    genre: string[];
    format: string;
    status: string;
    season: string;
    year: string;
    language: string;
    sort: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  onReset: () => void;
  onApply: () => void;
  onRandomSummon: () => void;
  isRandomLoading?: boolean;
  onOpenGuideModal?: () => void;
}

// Compact Select Component
const CompactSelect = ({ label, icon: Icon, options, value, onChange }: {
  label: string;
  icon: any;
  options: { value: string; label: string; icon?: any }[];
  value: string;
  onChange: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);
  const selectedLabel = selectedOption?.label || "All";

  return (
    <div className="space-y-1 relative">
      <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider ml-1 flex items-center gap-1">
        <Icon size={10} className="text-zinc-500" /> {label}
      </label>
      <button
        type="button"
        onClick={() => { playGummyTap(); setIsOpen(!isOpen); }}
        className={cn(
          "w-full bg-white/[0.04] hover:bg-white/[0.08] border rounded-xl text-[11px] py-1.5 px-2.5 flex items-center justify-between transition-all font-medium",
          value && value !== 'newest' && value !== 'all'
            ? "border-primary-500/40 text-white bg-primary-500/10"
            : "border-white/10 text-zinc-300"
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={11} className={cn("transition-transform text-zinc-500 shrink-0", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            style={{ backgroundColor: '#0c1322' }}
            className="absolute top-[110%] left-0 right-0 bg-[#0c1322] border border-white/15 rounded-xl shadow-2xl z-[90] overflow-hidden p-1"
          >
            <div className="max-h-40 overflow-y-auto space-y-0.5 scrollbar-hide">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    playGummyTap();
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 text-[10px] rounded-lg transition-colors flex justify-between items-center",
                    value === opt.value
                      ? "bg-primary-600/25 text-primary-400 font-bold"
                      : "text-zinc-300 hover:bg-white/10"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check size={11} className="text-primary-400 shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const UnifiedFilterPanel: React.FC<UnifiedFilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  onReset,
  onApply,
  onRandomSummon,
  isRandomLoading,
  onOpenGuideModal
}: UnifiedFilterPanelProps) => {
  const [targetMenuOpen, setTargetMenuOpen] = useState(false);
  const [genreMenuOpen, setGenreMenuOpen] = useState(false);
  const [genreSearch, setGenreSearch] = useState('');
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Outside click listener: ensures other page options (cards, nav, bell) remain directly accessible
  React.useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleOutsideClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTargetCategory = filters.target || 'all';
  const targetOptions = [
    { value: 'all', label: 'Global (All Media)', icon: Globe, desc: 'Unified universe search across all media' },
    ...SEARCH_TARGETS.filter(t => t.category !== 'all' && t.category !== 'users' && t.category !== 'posts').map(t => ({
      value: t.category,
      label: t.label,
      icon: t.icon,
      desc: t.hint
    }))
  ];

  const currentTargetObj = targetOptions.find(t => t.value === currentTargetCategory) || targetOptions[0];
  const TargetIcon = currentTargetObj.icon;

  const filteredGenres = UNIFIED_GENRES.filter(g => 
    !genreSearch.trim() || g.toLowerCase().includes(genreSearch.toLowerCase().trim())
  );

  const toggleGenre = (genre: string) => {
    playGummyTap();
    setFilters((prev: any) => ({
      ...prev,
      genre: prev.genre.includes(genre)
        ? prev.genre.filter((g: string) => g !== genre)
        : [...prev.genre, genre]
    }));
  };

  return (
    <AnimatePresence>
      {/* Desktop dimmed backdrop overlay (pure CSS hidden on mobile so screen is never darkened) */}
      <div
        key="filter-backdrop-desktop"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="hidden md:block fixed inset-0 bg-black/60 backdrop-blur-sm z-[105] cursor-pointer"
      />

      {/* On mobile: NO backdrop overlay at all! Other options stay 100% visible and accessible, outside click closes panel */}
      <motion.div
        ref={panelRef}
        key="filter-panel"
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        style={{ backgroundColor: '#0c1322' }}
        className="fixed left-2 right-2 top-[52px] sm:top-14 md:absolute md:top-full md:left-0 md:right-0 md:mt-2 max-h-[82vh] overflow-y-auto bg-[#0c1322] border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-2xl z-[110] origin-top scrollbar-hide text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-white/5 border border-white/10 text-primary-400">
              <SlidersHorizontal size={13} />
            </div>
            <span className="text-[11px] font-black tracking-widest uppercase text-white font-lemon">
              Filter Matrix
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Guide Button (Inside Filter Panel only for mobile) */}
            {onOpenGuideModal && (
              <button
                type="button"
                onClick={() => { playGummyTap(); onOpenGuideModal(); }}
                className="flex md:hidden items-center gap-1 text-[10px] text-zinc-300 hover:text-white transition-colors px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 uppercase font-bold tracking-wider"
                title="Search Guide & Shortcuts"
              >
                <HelpCircle size={11} className="text-primary-400" /> Guide
              </button>
            )}

            <button
              type="button"
              onClick={() => { playGummyTap(); onReset(); }}
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5 uppercase font-bold tracking-wider"
            >
              <RotateCcw size={10} /> Reset
            </button>
            <button
              onClick={() => { playGummyTap(); onClose(); }}
              className="p-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Filters"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* ─── ROW 1: SEARCH TARGET & GENRES (DROPDOWN MENUS) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
          
          {/* 1. Search Target Scope Dropdown */}
          <div className="space-y-1 relative">
            <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider ml-1 flex items-center gap-1">
              <Globe size={10} className="text-zinc-500" /> Search Target Scope
            </label>
            <button
              type="button"
              onClick={() => { playGummyTap(); setTargetMenuOpen(!targetMenuOpen); setGenreMenuOpen(false); }}
              className={cn(
                "w-full bg-white/[0.04] hover:bg-white/[0.08] border rounded-xl text-xs py-2 px-3 flex items-center justify-between transition-all font-bold",
                currentTargetCategory !== 'all'
                  ? "border-primary-500/40 text-white bg-primary-500/10"
                  : "border-white/15 text-white"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <TargetIcon size={13} className="text-primary-400 shrink-0" />
                <span className="truncate">{currentTargetObj.label}</span>
              </span>
              <ChevronDown size={12} className={cn("transition-transform text-zinc-400 shrink-0", targetMenuOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {targetMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  style={{ backgroundColor: '#0c1322' }}
                  className="absolute top-[110%] left-0 right-0 bg-[#0c1322] border border-white/15 rounded-xl shadow-2xl z-[95] overflow-hidden p-1.5"
                >
                  <div className="max-h-52 overflow-y-auto space-y-0.5 scrollbar-hide">
                    {targetOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSel = currentTargetCategory === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            playGummyTap();
                            setFilters((prev: any) => ({ ...prev, target: opt.value }));
                            setTargetMenuOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between gap-2",
                            isSel ? "bg-primary-600/25 text-white font-bold" : "text-zinc-300 hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon size={13} className={isSel ? "text-primary-400" : "text-zinc-400"} />
                            <div className="truncate">
                              <div className="truncate">{opt.label}</div>
                            </div>
                          </div>
                          {isSel && <Check size={12} className="text-primary-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. Genres Multi-Select Dropdown */}
          <div className="space-y-1 relative">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Tag size={10} className="text-zinc-500" /> Genres
              </label>
              {filters.genre.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters((p: any) => ({ ...p, genre: [] }))}
                  className="text-[9px] text-primary-400 hover:underline uppercase font-bold"
                >
                  Clear ({filters.genre.length})
                </button>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => { playGummyTap(); setGenreMenuOpen(!genreMenuOpen); setTargetMenuOpen(false); setGenreSearch(''); }}
              className={cn(
                "w-full bg-white/[0.04] hover:bg-white/[0.08] border rounded-xl text-xs py-2 px-3 flex items-center justify-between transition-all font-bold",
                filters.genre.length > 0
                  ? "border-primary-500/40 text-white bg-primary-500/10"
                  : "border-white/15 text-zinc-300"
              )}
            >
              <span className="flex items-center gap-1.5 truncate">
                <Tag size={12} className={filters.genre.length > 0 ? "text-primary-400" : "text-zinc-400"} />
                <span className="truncate">
                  {filters.genre.length === 0
                    ? 'All Genres'
                    : filters.genre.length === 1
                    ? filters.genre[0]
                    : `${filters.genre.length} Genres Selected`}
                </span>
              </span>
              <ChevronDown size={12} className={cn("transition-transform text-zinc-400 shrink-0", genreMenuOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {genreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  style={{ backgroundColor: '#0c1322' }}
                  className="absolute top-[110%] left-0 right-0 bg-[#0c1322] border border-white/15 rounded-xl shadow-2xl z-[95] overflow-hidden p-2"
                >
                  {/* Mini search inside dropdown */}
                  <div className="relative mb-1.5">
                    <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      autoFocus
                      value={genreSearch}
                      onChange={(e) => setGenreSearch(e.target.value)}
                      placeholder="Filter genres..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-1 pl-7 pr-2.5 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-hide pr-1">
                    <button
                      type="button"
                      onClick={() => {
                        playGummyTap();
                        setFilters((prev: any) => ({ ...prev, genre: [] }));
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors",
                        filters.genre.length === 0 ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <span>All Genres</span>
                      {filters.genre.length === 0 && <Check size={11} className="text-primary-400" />}
                    </button>

                    {filteredGenres.map((g) => {
                      const isChecked = filters.genre.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleGenre(g)}
                          className={cn(
                            "w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors",
                            isChecked ? "bg-primary-600/20 text-primary-300" : "text-zinc-300 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <span>{g}</span>
                          {isChecked && <Check size={11} className="text-primary-400" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* ─── ROW 2: ATTRIBUTES GRID (COMPACT) ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
          <CompactSelect
            label="Format"
            icon={Tv}
            options={MEDIA_FORMATS}
            value={filters.format || ""}
            onChange={(v) => setFilters((p: any) => ({ ...p, format: v }))}
          />
          <CompactSelect
            label="Status"
            icon={Info}
            options={STATUS_OPTIONS}
            value={filters.status || ""}
            onChange={(v) => setFilters((p: any) => ({ ...p, status: v }))}
          />
          <CompactSelect
            label="Season"
            icon={Calendar}
            options={[{ value: "", label: "All Seasons" }, ...SEASONS.map(s => ({ value: s, label: s.toUpperCase() }))]}
            value={filters.season || ""}
            onChange={(v) => setFilters((p: any) => ({ ...p, season: v }))}
          />
          <CompactSelect
            label="Year"
            icon={Layers}
            options={[{ value: "", label: "All Years" }, ...YEARS.map(y => ({ value: y, label: y }))]}
            value={filters.year || ""}
            onChange={(v) => setFilters((p: any) => ({ ...p, year: v }))}
          />
        </div>

        {/* ─── ROW 3: AUDIO & SORT (COMPACT) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3.5">
          <CompactSelect
            label="Audio / Dub"
            icon={Languages}
            options={AUDIO_LANGUAGES}
            value={filters.language || ""}
            onChange={(v) => setFilters((p: any) => ({ ...p, language: v }))}
          />
          <CompactSelect
            label="Sort Order"
            icon={ArrowDownAZ}
            options={UNIFIED_SORT_OPTIONS}
            value={filters.sort || "newest"}
            onChange={(v) => setFilters((p: any) => ({ ...p, sort: v }))}
          />
        </div>

        {/* ─── FOOTER ACTIONS ─── */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/[0.08]">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => { playGummyTap(); onRandomSummon(); }}
            disabled={isRandomLoading}
            className="h-7 text-[10px] bg-white/5 hover:bg-white/10 text-zinc-300 rounded-full border border-white/10 font-bold uppercase tracking-wider"
          >
            <Dices size={11} className={cn("mr-1", isRandomLoading && "animate-spin text-primary-400")} />
            Random
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => { playGummyTap(); onApply(); }}
            className="h-8 text-xs text-white px-5 rounded-full shadow-[0_0_14px_rgba(220,38,38,0.4)] bg-primary-600 hover:bg-primary-700 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Search size={12} />
            Apply Filters
          </Button>
        </div>

      </motion.div>
    </AnimatePresence>
  );
};

export default UnifiedFilterPanel;
