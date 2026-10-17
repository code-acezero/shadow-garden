"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Search, CheckCircle2, Film } from 'lucide-react';
import { ShortDramaEpisode } from '@/lib/shorts/types';
import { ATRAX_CAPSULE_SPRING, atraxChipTapVariants, atraxBubblePopVariants } from '@/lib/atraxMotion';
import { cn } from '@/lib/utils';

interface EpisodeDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  totalEpisodes: number;
  episodes: ShortDramaEpisode[];
  currentEpisode: number;
  onSelectEpisode: (epNumber: number) => void;
}

export default function EpisodeDrawerModal({
  isOpen,
  onClose,
  title,
  totalEpisodes,
  episodes,
  currentEpisode,
  onSelectEpisode
}: EpisodeDrawerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEpisodes = episodes.filter(ep => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ep.title.toLowerCase().includes(q) ||
      ep.episodeNumber.toString().includes(q) ||
      `episode ${ep.episodeNumber}`.includes(q)
    );
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:w-[420px] z-50 flex flex-col pointer-events-none">
            <motion.div
              variants={atraxBubblePopVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="pointer-events-auto h-[80vh] md:h-full w-full bg-slate-950/95 border-t md:border-t-0 md:border-l border-white/10 rounded-t-[32px] md:rounded-l-[32px] md:rounded-tr-none flex flex-col shadow-2xl shadow-black backdrop-blur-2xl overflow-hidden"
            >
              {/* Drawer Handle (Mobile) */}
              <div className="flex md:hidden justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="p-5 pb-3 border-b border-white/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 font-mono">
                      {totalEpisodes} Episodes
                    </span>
                    <span className="text-xs text-slate-400">Select Episode</span>
                  </div>
                  <h2 className="text-sm font-bold text-white truncate mt-1">
                    {title}
                  </h2>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 border border-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Jump to Episode Search */}
              <div className="px-5 py-3 border-b border-white/5">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search episode number..."
                    className="w-full bg-slate-900/80 border border-white/10 rounded-2xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 text-slate-400 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Episode Grid */}
              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                  {filteredEpisodes.map((ep) => {
                    const isCurrent = ep.episodeNumber === currentEpisode;

                    return (
                      <motion.button
                        key={ep.episodeNumber}
                        variants={atraxChipTapVariants}
                        initial="initial"
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => {
                          onSelectEpisode(ep.episodeNumber);
                          onClose();
                        }}
                        className={cn(
                          "relative aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-xs font-bold transition-all border",
                          isCurrent
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/40 font-extrabold scale-105"
                            : "bg-slate-900/90 text-slate-300 border-white/10 hover:border-white/30 hover:bg-slate-800"
                        )}
                      >
                        {isCurrent ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <Play className="w-3.5 h-3.5 fill-white animate-pulse" />
                            <span className="text-[11px] font-mono leading-none">
                              Ep {ep.episodeNumber}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-sm font-mono leading-none">
                              {ep.episodeNumber}
                            </span>
                            {ep.duration && (
                              <span className="text-[9px] text-slate-400 font-normal leading-none">
                                {ep.duration}
                              </span>
                            )}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {filteredEpisodes.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No episodes found matching "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Bottom Quick Bar */}
              <div className="p-4 border-t border-white/10 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
                <span>Playing Episode: <strong className="text-white">{currentEpisode} of {totalEpisodes}</strong></span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  100% Unlocked
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
