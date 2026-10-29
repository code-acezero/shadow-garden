"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Terminal, ArrowRight, 
  Tv, Film, BookOpen, Layers, Clapperboard,
  Flame, Languages, Smartphone, FileText, AtSign, Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { playGummyTap } from '@/lib/audioManager';

interface SearchGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrefix: (prefix: string) => void;
}

interface TargetShortcut {
  prefix: string;
  label: string;
  scope: string;
  example: string;
  aliases: string[];
  icon: any;
}

const TARGET_SHORTCUTS: TargetShortcut[] = [
  { 
    prefix: "/anime", 
    label: "Anime", 
    scope: "Japanese TV series, movies, OVAs & specials",
    example: "/anime solo leveling",
    aliases: ["/a", "/ani"],
    icon: Tv 
  },
  { 
    prefix: "/manga", 
    label: "Manga", 
    scope: "Manga, manhwa, comics & webtoons",
    example: "/manga omniscient reader",
    aliases: ["/m", "/webtoon"],
    icon: BookOpen 
  },
  { 
    prefix: "/movies", 
    label: "Movies", 
    scope: "HD cinema, movies & feature films",
    example: "/movies oppenheimer",
    aliases: ["/movie", "/film"],
    icon: Film 
  },
  { 
    prefix: "/drama", 
    label: "Drama", 
    scope: "Korean, Chinese & Asian live-action drama",
    example: "/drama queen of tears",
    aliases: ["/kdrama", "/cdrama"],
    icon: Clapperboard 
  },
  { 
    prefix: "/donghua", 
    label: "Donghua", 
    scope: "Chinese 2D & 3D donghua animation",
    example: "/donghua swallowed star",
    aliases: ["/dh"],
    icon: Flame 
  },
  { 
    prefix: "/hindi", 
    label: "Hindi", 
    scope: "Hindi & Indian regional dubbed releases",
    example: "/hindi naruto",
    aliases: ["/dub"],
    icon: Languages 
  },
  { 
    prefix: "/shorts", 
    label: "Shorts", 
    scope: "Vertical mini-series, drama reels & shorts",
    example: "/shorts billionaire",
    aliases: ["/short"],
    icon: Smartphone 
  },
  { 
    prefix: "/novels", 
    label: "Novels", 
    scope: "Light novels & web novel series chapters",
    example: "/novels the beginning after the end",
    aliases: ["/novel", "/ln"],
    icon: FileText 
  },
  { 
    prefix: "@", 
    label: "Profiles", 
    scope: "Shadow Garden users, adventurers & clan guilds",
    example: "@alpha",
    aliases: ["/users"],
    icon: AtSign 
  },
  { 
    prefix: "/posts", 
    label: "Community", 
    scope: "Otakuverse social missives, discussions & news",
    example: "/posts anilist",
    aliases: ["/p", "/feed"],
    icon: Hash 
  },
];

export const SearchGuideModal: React.FC<SearchGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectPrefix
}) => {
  const [hoveredTarget, setHoveredTarget] = useState<TargetShortcut | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Dimmed backdrop overlay */}
      <motion.div
        key="guide-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[105]"
      />

      <motion.div
        key="guide-panel"
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ backgroundColor: '#0c1322' }}
        className="!absolute top-full mt-2 left-0 right-0 max-h-[85vh] overflow-y-auto bg-[#0c1322] border border-white/[0.14] rounded-2xl p-4 sm:p-5 shadow-[0_24px_70px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.12)] z-[110] ring-1 ring-white/10 origin-top scrollbar-hide text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sleek Monochromatic */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300">
              <Terminal size={12} />
            </div>
            <div>
              <span className="text-[11px] font-black tracking-wider uppercase text-white">
                Search Targets Guide
              </span>
              <span className="text-[10px] text-zinc-400 ml-2">
                Prefix shortcuts to narrow search target:
              </span>
            </div>
          </div>
          <button
            onClick={() => { playGummyTap(); onClose(); }}
            className="p-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Guide"
          >
            <X size={12} />
          </button>
        </div>

        {/* Compact Shortcuts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-2.5">
          {TARGET_SHORTCUTS.map((item) => {
            const Icon = item.icon;
            const isHovered = hoveredTarget?.prefix === item.prefix;
            return (
              <button
                key={item.prefix}
                onMouseEnter={() => setHoveredTarget(item)}
                onMouseLeave={() => setHoveredTarget(null)}
                onFocus={() => setHoveredTarget(item)}
                onClick={() => {
                  playGummyTap();
                  onSelectPrefix(item.prefix === '@' ? '@' : `${item.prefix} `);
                  onClose();
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-left transition-all group active:scale-[0.98]",
                  isHovered 
                    ? "bg-white/[0.12] border-white/30 text-white shadow-sm" 
                    : "bg-white/[0.03] border-white/5 text-zinc-400 hover:border-white/15 hover:text-white"
                )}
              >
                <Icon size={12} className={cn("shrink-0 transition-colors", isHovered ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")} />
                <span className="text-[11px] font-mono font-bold text-white truncate">
                  {item.prefix}
                </span>
                <span className="text-[9px] text-zinc-500 group-hover:text-zinc-400 truncate ml-auto">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Hover Info Inspector Panel */}
        <div className="min-h-[58px] p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center">
          <AnimatePresence mode="wait">
            {hoveredTarget ? (
              <motion.div
                key={hoveredTarget.prefix}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.15 }}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                      {hoveredTarget.prefix}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-200">
                      Target {hoveredTarget.label}
                    </span>
                    {hoveredTarget.aliases.length > 0 && (
                      <span className="text-[9px] font-mono text-zinc-500">
                        (aliases: {hoveredTarget.aliases.join(', ')})
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 truncate">
                    {hoveredTarget.scope}
                  </p>
                </div>

                <div 
                  onClick={() => {
                    playGummyTap();
                    onSelectPrefix(`${hoveredTarget.example} `);
                    onClose();
                  }}
                  className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer text-[10px] font-mono transition-colors group"
                  title="Click to use example"
                >
                  <span className="text-zinc-500">Try:</span>
                  <span className="text-white group-hover:underline truncate">{hoveredTarget.example}</span>
                  <ArrowRight size={10} className="text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="neutral-tip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 text-zinc-500 text-[10px]"
              >
                <Terminal size={11} className="text-zinc-400 shrink-0" />
                <span>Hover any option above to preview target scope, aliases & query syntax • Click to insert</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchGuideModal;
