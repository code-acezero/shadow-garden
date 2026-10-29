"use client";

import React, { useEffect, useRef } from 'react';
import { Hash, Flame, Clock } from 'lucide-react';
import ChibiAnimeIcon from '@/components/Social/ChibiAnimeIcon';
import { motion, AnimatePresence } from 'framer-motion';

export interface SmartHashtagItem {
  tag: string;
  label: string;
  type: 'recent' | 'trending' | 'context' | 'popular';
  countText?: string;
}

interface HashtagDropdownProps {
  suggestions: SmartHashtagItem[];
  selectedIndex: number;
  onSelect: (tag: string) => void;
  position?: 'top' | 'bottom';
  className?: string;
}

export default function HashtagDropdown({
  suggestions,
  selectedIndex,
  onSelect,
  position = 'bottom',
  className = ''
}: HashtagDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedEl = containerRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: position === 'top' ? 6 : -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={`absolute left-0 z-[9999] w-72 max-h-56 overflow-y-auto bg-[#0a0a0f]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-1.5 flex flex-col gap-0.5 custom-scrollbar select-none ${
          position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        } ${className}`}
      >
        <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-white/5 mb-1">
          <span className="flex items-center gap-1.5">
            <Hash size={12} className="text-primary-400" />
            <span>Hashtag Suggestions</span>
          </span>
          <span className="text-[9px] text-zinc-600 font-mono">Tab/Enter to pick</span>
        </div>

        {suggestions.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={item.tag}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(item.tag);
              }}
              className={`flex items-center justify-between gap-3 w-full text-left px-3 py-2 transition-colors cursor-pointer group ${
                isSelected 
                  ? 'bg-primary-500/20 border-l-2 border-primary-500' 
                  : 'hover:bg-white/5 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                  item.type === 'context'
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : item.type === 'recent'
                    ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                    : item.type === 'trending'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-white/5 border-white/10 text-zinc-400'
                }`}>
                  {item.type === 'context' ? (
                    <ChibiAnimeIcon size={13} className="text-cyan-400" />
                  ) : item.type === 'recent' ? (
                    <Clock size={12} />
                  ) : item.type === 'trending' ? (
                    <Flame size={12} />
                  ) : (
                    <Hash size={12} />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-bold truncate transition-colors ${
                    isSelected ? 'text-primary-300' : 'text-zinc-200 group-hover:text-white'
                  }`}>
                    {item.tag}
                  </span>
                  <span className="text-[10px] text-zinc-500 capitalize">
                    {item.countText || (item.type === 'context' ? 'Attached Title' : item.type)}
                  </span>
                </div>
              </div>

              {/* Tag pill badge */}
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                item.type === 'context'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : item.type === 'recent'
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                  : item.type === 'trending'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : 'bg-white/5 text-zinc-400 border border-white/5'
              }`}>
                {item.type === 'context' ? 'Anime' : item.type}
              </span>
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
