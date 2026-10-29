"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { playGummyTap } from '@/lib/audioManager';
import { cn } from '@/lib/utils';

export type SwitcherColorVariant = 'primary' | 'emerald' | 'orange' | 'rose' | 'red' | 'purple' | 'amber';

export interface CutePageSwitcherProps {
  page?: number;
  currentPage?: number;
  maxPage?: number;
  loading?: boolean;
  canPrev?: boolean;
  canNext?: boolean;
  hasNextPage?: boolean;
  onPageChange?: (newPage: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  variant?: SwitcherColorVariant;
  size?: 'sm' | 'md';
  className?: string;
  showPageLabel?: boolean;
  fullWidthOnMobile?: boolean;
}

const VARIANT_STYLES: Record<SwitcherColorVariant, {
  hoverBtn: string;
  activePill: string;
  accentText: string;
}> = {
  primary: {
    hoverBtn: 'hover:bg-primary-500/20 hover:border-primary-500/40 text-primary-300',
    activePill: 'bg-primary-500/10 border-primary-500/20 text-primary-400',
    accentText: 'text-primary-400'
  },
  emerald: {
    hoverBtn: 'hover:bg-emerald-500/20 hover:border-emerald-500/40 text-emerald-300',
    activePill: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    accentText: 'text-emerald-400'
  },
  orange: {
    hoverBtn: 'hover:bg-orange-500/20 hover:border-orange-500/40 text-orange-300',
    activePill: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    accentText: 'text-orange-400'
  },
  rose: {
    hoverBtn: 'hover:bg-rose-500/20 hover:border-rose-500/40 text-rose-300',
    activePill: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    accentText: 'text-rose-400'
  },
  red: {
    hoverBtn: 'hover:bg-red-500/20 hover:border-red-500/40 text-red-300',
    activePill: 'bg-red-500/10 border-red-500/20 text-red-400',
    accentText: 'text-red-400'
  },
  purple: {
    hoverBtn: 'hover:bg-purple-500/20 hover:border-purple-500/40 text-purple-300',
    activePill: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    accentText: 'text-purple-400'
  },
  amber: {
    hoverBtn: 'hover:bg-amber-500/20 hover:border-amber-500/40 text-amber-300',
    activePill: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    accentText: 'text-amber-400'
  }
};

export default function CutePageSwitcher({
  page,
  currentPage,
  maxPage,
  loading = false,
  canPrev,
  canNext,
  hasNextPage,
  onPageChange,
  onPrev,
  onNext,
  variant = 'primary',
  size = 'md',
  className,
  showPageLabel = false,
  fullWidthOnMobile = false
}: CutePageSwitcherProps) {
  const activePage = currentPage ?? page ?? 1;

  const isPrevDisabled = canPrev !== undefined 
    ? !canPrev 
    : (activePage <= 1 || loading);

  const isNextDisabled = canNext !== undefined
    ? !canNext
    : (hasNextPage !== undefined 
        ? (!hasNextPage || loading)
        : ((maxPage !== undefined && activePage >= maxPage) || loading));

  const colors = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const isSm = size === 'sm';

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPrevDisabled) return;
    playGummyTap();
    if (onPrev) {
      onPrev();
    } else if (onPageChange) {
      onPageChange(activePage - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isNextDisabled) return;
    playGummyTap();
    if (onNext) {
      onNext();
    } else if (onPageChange) {
      onPageChange(activePage + 1);
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center select-none bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-md rounded-full shadow-inner transition-colors",
        fullWidthOnMobile ? "w-full sm:w-auto justify-between sm:justify-center" : "",
        isSm ? "p-0.5 gap-1" : "p-1 gap-1.5",
        className
      )}
    >
      {/* Previous Page Arrow */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={handlePrev}
        disabled={isPrevDisabled}
        aria-label="Previous Page"
        className={cn(
          "rounded-full border border-white/5 bg-white/5 text-zinc-300 flex items-center justify-center transition-all cursor-pointer disabled:opacity-20 disabled:pointer-events-none disabled:cursor-not-allowed shrink-0",
          isSm ? "w-6 h-6" : "w-7 h-7 sm:w-8 sm:h-8",
          colors.hoverBtn
        )}
      >
        <ChevronLeft size={isSm ? 13 : 15} />
      </motion.button>

      {/* Center Page Display: < page number > */}
      <div
        className={cn(
          "flex items-center justify-center font-mono font-bold tracking-tight px-2.5 rounded-full bg-white/[0.05] border border-white/[0.05] shrink-0",
          isSm ? "h-6 text-[11px] min-w-[36px]" : "h-7 sm:h-8 text-xs min-w-[44px]",
          colors.activePill
        )}
      >
        {showPageLabel && <span className="text-[10px] uppercase font-sans text-zinc-400 mr-1.5 font-bold">Page</span>}
        <span className="text-white font-extrabold">{activePage}</span>
        {maxPage && maxPage > 1 && (
          <>
            <span className="text-zinc-600 mx-1 font-normal">/</span>
            <span className="text-zinc-400 font-normal text-[10px] sm:text-[11px]">{maxPage}</span>
          </>
        )}
      </div>

      {/* Next Page Arrow */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={handleNext}
        disabled={isNextDisabled}
        aria-label="Next Page"
        className={cn(
          "rounded-full border border-white/5 bg-white/5 text-zinc-300 flex items-center justify-center transition-all cursor-pointer disabled:opacity-20 disabled:pointer-events-none disabled:cursor-not-allowed shrink-0",
          isSm ? "w-6 h-6" : "w-7 h-7 sm:w-8 sm:h-8",
          colors.hoverBtn
        )}
      >
        <ChevronRight size={isSm ? 13 : 15} />
      </motion.button>
    </div>
  );
}
