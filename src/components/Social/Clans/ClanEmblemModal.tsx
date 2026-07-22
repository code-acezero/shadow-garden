"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Shield, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ClanEmblem {
  id: string;
  name: string;
  category: string;
  url: string;
}

const svgToDataUri = (svgString: string) => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
};

export const ANIME_CLAN_EMBLEMS: ClanEmblem[] = [
  // --- SHADOW GARDEN & DARK FANTASY ---
  {
    id: 'sg1',
    name: 'Shadow Garden Insignia',
    category: 'Shadow Garden',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#050508"/>
        <circle cx="50" cy="50" r="36" fill="none" stroke="#9333ea" stroke-width="2" stroke-dasharray="4 2"/>
        <path d="M50 20 A30 30 0 1 1 30 70 A25 25 0 1 0 50 20 Z" fill="#c084fc"/>
        <path d="M50 15 L54 50 L50 85 L46 50 Z" fill="#e9d5ff"/>
        <circle cx="50" cy="50" r="6" fill="#a855f7"/>
      </svg>
    `)
  },
  {
    id: 'sg2',
    name: 'Seven Shadows Crest',
    category: 'Shadow Garden',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#180b2d"/>
        <polygon points="50,15 58,35 80,35 62,48 68,70 50,56 32,70 38,48 20,35 42,35" fill="#f59e0b" stroke="#fef08a" stroke-width="2"/>
        <circle cx="50" cy="46" r="10" fill="#a855f7"/>
      </svg>
    `)
  },
  {
    id: 'sg3',
    name: 'Ancient Eclipse Emblem',
    category: 'Shadow Garden',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#030712"/>
        <circle cx="50" cy="50" r="32" fill="#fbbf24" opacity="0.3"/>
        <circle cx="50" cy="50" r="28" fill="#111827"/>
        <circle cx="46" cy="46" r="26" fill="#030712"/>
        <path d="M50 15 Q65 35 50 85 Q35 35 50 15 Z" fill="#a855f7" opacity="0.6"/>
      </svg>
    `)
  },

  // --- NARUTO / SHINOBI ORGANIZATIONS ---
  {
    id: 'nar1',
    name: 'Akatsuki Cloud Emblem',
    category: 'Naruto',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#09090b"/>
        <path d="M25 60 C20 60, 15 50, 25 42 C25 32, 40 25, 55 32 C65 25, 80 32, 80 42 C88 50, 80 60, 75 60 Z" fill="#dc2626" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="35" cy="48" r="4" fill="#ffffff" opacity="0.3"/>
      </svg>
    `)
  },
  {
    id: 'nar2',
    name: 'Uchiha Clan Crest',
    category: 'Naruto',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#09090b"/>
        <path d="M50 20 C25 20 20 45 50 55 C80 45 75 20 50 20 Z" fill="#dc2626"/>
        <path d="M50 55 C20 45 25 70 50 70 C75 70 80 45 50 55 Z" fill="#f8fafc"/>
        <rect x="47" y="70" width="6" height="12" fill="#94a3b8" rx="2"/>
      </svg>
    `)
  },
  {
    id: 'nar3',
    name: 'Leaf Village Crest',
    category: 'Naruto',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#064e3b"/>
        <circle cx="50" cy="50" r="30" fill="none" stroke="#10b981" stroke-width="6"/>
        <path d="M50 20 A30 30 0 1 1 35 70 A15 15 0 1 0 50 50" fill="none" stroke="#34d399" stroke-width="6" stroke-linecap="round"/>
        <path d="M35 70 L25 80" stroke="#34d399" stroke-width="6" stroke-linecap="round"/>
      </svg>
    `)
  },
  {
    id: 'nar4',
    name: 'Anbu Black Ops Mask',
    category: 'Naruto',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#0f172a"/>
        <ellipse cx="50" cy="52" rx="22" ry="28" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
        <path d="M35 35 Q40 45 32 55" stroke="#dc2626" stroke-width="4" fill="none"/>
        <path d="M65 35 Q60 45 68 55" stroke="#dc2626" stroke-width="4" fill="none"/>
        <ellipse cx="42" cy="48" rx="4" ry="7" fill="#09090b"/>
        <ellipse cx="58" cy="48" rx="4" ry="7" fill="#09090b"/>
      </svg>
    `)
  },

  // --- ONE PIECE / PIRATE FLEETS ---
  {
    id: 'op1',
    name: 'Straw Hat Jolly Roger',
    category: 'One Piece',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#0c0a09"/>
        <path d="M25 25 L75 75 M75 25 L25 75" stroke="#e7e5e4" stroke-width="8" stroke-linecap="round"/>
        <circle cx="50" cy="48" r="22" fill="#f5f5f4"/>
        <circle cx="42" cy="48" r="6" fill="#0c0a09"/>
        <circle cx="58" cy="48" r="6" fill="#0c0a09"/>
        <path d="M22 42 Q50 35 78 42" stroke="#eab308" stroke-width="6" stroke-linecap="round"/>
        <path d="M35 40 C35 25, 65 25, 65 40 Z" fill="#eab308"/>
        <path d="M35 38 Q50 35 65 38" stroke="#dc2626" stroke-width="4"/>
      </svg>
    `)
  },
  {
    id: 'op2',
    name: 'Heart Pirates Crest',
    category: 'One Piece',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#ca8a04"/>
        <circle cx="50" cy="50" r="32" fill="#09090b"/>
        <path d="M32 55 Q50 70 68 55" stroke="#ca8a04" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="38" cy="42" r="5" fill="#ca8a04"/>
        <circle cx="62" cy="42" r="5" fill="#ca8a04"/>
      </svg>
    `)
  },
  {
    id: 'op3',
    name: 'Red Hair Pirates Emblem',
    category: 'One Piece',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#450a0a"/>
        <path d="M20 20 L80 80 M80 20 L20 80" stroke="#991b1b" stroke-width="8" stroke-linecap="round"/>
        <circle cx="50" cy="50" r="22" fill="#f8fafc"/>
        <path d="M56 32 L64 60" stroke="#dc2626" stroke-width="4"/>
        <circle cx="42" cy="50" r="5" fill="#09090b"/>
        <circle cx="58" cy="50" r="5" fill="#09090b"/>
      </svg>
    `)
  },
  {
    id: 'op4',
    name: 'Whitebeard Pirates Seal',
    category: 'One Piece',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#3b0764"/>
        <path d="M20 20 L80 80 M80 20 L20 80" stroke="#a855f7" stroke-width="6"/>
        <circle cx="50" cy="48" r="20" fill="#f8fafc"/>
        <path d="M25 45 Q50 65 75 45 Q50 55 25 45 Z" fill="#f8fafc" stroke="#18181b" stroke-width="2"/>
      </svg>
    `)
  },

  // --- ATTACK ON TITAN / REGIMENTS ---
  {
    id: 'aot1',
    name: 'Wings of Freedom (Survey Corps)',
    category: 'Attack on Titan',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#0284c7"/>
        <path d="M50 15 L80 30 V60 C80 75 50 88 50 88 C50 88 20 75 20 60 V30 Z" fill="#0f172a" stroke="#f8fafc" stroke-width="3"/>
        <path d="M30 35 C35 45 42 50 48 65 C40 60 35 55 30 35 Z" fill="#f8fafc"/>
        <path d="M35 30 C42 40 46 48 50 68 C42 62 38 52 35 30 Z" fill="#f8fafc"/>
        <path d="M70 35 C65 45 58 50 52 65 C60 60 65 55 70 35 Z" fill="#38bdf8"/>
        <path d="M65 30 C58 40 54 48 50 68 C58 62 62 52 65 30 Z" fill="#38bdf8"/>
      </svg>
    `)
  },
  {
    id: 'aot2',
    name: 'Garrison Regiment Rose',
    category: 'Attack on Titan',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#881337"/>
        <path d="M50 15 L80 30 V60 C80 75 50 88 50 88 C50 88 20 75 20 60 V30 Z" fill="#1c1917" stroke="#f43f5e" stroke-width="3"/>
        <circle cx="42" cy="45" r="12" fill="#f43f5e"/>
        <circle cx="58" cy="52" r="12" fill="#e11d48"/>
        <path d="M42 45 Q50 35 58 52" stroke="#fda4af" stroke-width="3" fill="none"/>
      </svg>
    `)
  },
  {
    id: 'aot3',
    name: 'Military Police Unicorn',
    category: 'Attack on Titan',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#064e3b"/>
        <path d="M50 15 L80 30 V60 C80 75 50 88 50 88 C50 88 20 75 20 60 V30 Z" fill="#022c22" stroke="#10b981" stroke-width="3"/>
        <path d="M40 65 L45 40 L60 30 L55 50 L65 55 Z" fill="#f8fafc"/>
        <path d="M60 30 L75 15 L62 26" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>
      </svg>
    `)
  },

  // --- HUNTER X HUNTER / TROUPE ---
  {
    id: 'hxh1',
    name: 'Phantom Troupe Spider',
    category: 'Hunter x Hunter',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#1e1b4b"/>
        <path d="M50 45 L15 25 M50 45 L85 25 M50 50 L10 45 M50 50 L90 45 M50 55 L15 70 M50 55 L85 70 M50 60 L25 85 M50 60 L75 85" stroke="#e0e7ff" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="50" cy="40" rx="8" ry="6" fill="#e0e7ff"/>
        <ellipse cx="50" cy="58" rx="14" ry="18" fill="#e0e7ff"/>
        <text x="50" y="63" text-anchor="middle" fill="#1e1b4b" font-size="14" font-weight="900" font-family="sans-serif">12</text>
      </svg>
    `)
  },
  {
    id: 'hxh2',
    name: 'Hunter Association Seal',
    category: 'Hunter x Hunter',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#78350f"/>
        <circle cx="50" cy="50" r="32" fill="#1c1917" stroke="#fbbf24" stroke-width="4"/>
        <text x="50" y="62" text-anchor="middle" fill="#fbbf24" font-size="32" font-weight="900" font-family="sans-serif">H</text>
      </svg>
    `)
  },

  // --- BLEACH / GOTEI 13 ---
  {
    id: 'bl1',
    name: 'Substitute Shinigami Badge',
    category: 'Bleach',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#18181b"/>
        <polygon points="50,15 82,32 82,68 50,85 18,68 18,32" fill="#09090b" stroke="#71717a" stroke-width="4"/>
        <circle cx="50" cy="45" r="14" fill="#f8fafc"/>
        <circle cx="44" cy="45" r="3" fill="#09090b"/>
        <circle cx="56" cy="45" r="3" fill="#09090b"/>
        <path d="M50 58 L45 72 L50 68 L55 72 Z" fill="#ef4444"/>
      </svg>
    `)
  },
  {
    id: 'bl2',
    name: 'Gotei 13 Insignia',
    category: 'Bleach',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#09090b"/>
        <polygon points="50,15 85,50 50,85 15,50" fill="#18181b" stroke="#e4e4e7" stroke-width="3"/>
        <circle cx="50" cy="50" r="16" fill="#09090b" stroke="#e4e4e7" stroke-width="2"/>
        <text x="50" y="56" text-anchor="middle" fill="#f43f5e" font-size="18" font-weight="900" font-family="serif">三</text>
      </svg>
    `)
  },

  // --- FAIRY TAIL & BLACK CLOVER & JJK ---
  {
    id: 'ft1',
    name: 'Fairy Tail Guild Mark',
    category: 'Guilds',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#7f1d1d"/>
        <path d="M30 75 C30 50, 45 40, 45 25 C55 35, 65 30, 75 20 C70 40, 55 45, 65 60 C50 55, 45 65, 30 75 Z" fill="#fef08a" stroke="#f59e0b" stroke-width="3"/>
        <path d="M45 40 Q60 50 65 60" stroke="#dc2626" stroke-width="3" fill="none"/>
      </svg>
    `)
  },
  {
    id: 'bc1',
    name: 'Black Bulls Crest',
    category: 'Guilds',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#171717"/>
        <path d="M20 30 Q35 15 45 40 Q50 45 55 40 Q65 15 80 30 Q65 45 50 78 Q35 45 20 30 Z" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
        <polygon points="50,45 38,32 62,32" fill="#171717"/>
        <circle cx="44" cy="38" r="3" fill="#ef4444"/>
        <circle cx="56" cy="38" r="3" fill="#ef4444"/>
      </svg>
    `)
  },
  {
    id: 'jjk1',
    name: 'Jujutsu High Crest',
    category: 'Guilds',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#1e1b4b"/>
        <circle cx="50" cy="50" r="32" fill="none" stroke="#6366f1" stroke-width="4"/>
        <path d="M35 35 L65 65 M65 35 L35 65" stroke="#818cf8" stroke-width="4"/>
        <circle cx="50" cy="50" r="12" fill="#312e81" stroke="#a5b4fc" stroke-width="3"/>
      </svg>
    `)
  },
];

export function getRandomClanEmblem(): string {
  const randomIndex = Math.floor(Math.random() * ANIME_CLAN_EMBLEMS.length);
  return ANIME_CLAN_EMBLEMS[randomIndex].url;
}

interface ClanEmblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmblem: (url: string) => void;
  currentUrl?: string;
}

export default function ClanEmblemModal({ isOpen, onClose, onSelectEmblem, currentUrl }: ClanEmblemModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Shadow Garden', 'Naruto', 'One Piece', 'Attack on Titan', 'Hunter x Hunter', 'Bleach', 'Guilds'];

  const filteredEmblems = ANIME_CLAN_EMBLEMS.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[20000] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          style={{ maxHeight: "calc(100dvh - var(--nav-height-top, 64px) - var(--nav-height-bottom, 64px) - 10px)" }}
          className="w-full max-w-2xl bg-[#0c0c10] border-t sm:border border-white/15 rounded-t-[2.5rem] sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col my-0 sm:my-auto relative overflow-hidden"
        >
          {/* iOS Top Drag Indicator Bar */}
          <div className="w-12 h-1.5 bg-white/25 rounded-full mx-auto mb-3 shrink-0" />

          {/* Top glow decoration */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-32 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0 relative z-10 bg-[#0c0c10]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary-600/20 border border-primary-500/30 rounded-xl text-primary-400">
                <Shield size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white leading-tight">Clan Emblem Vault</h3>
                <p className="text-[10px] text-zinc-400">Select an official insignia or anime organization crest for your clan.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Controls: Search & Categories */}
          <div className="py-3 space-y-2.5 shrink-0 relative z-10 bg-[#0e0e12]">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search emblems, factions, anime..."
                className="w-full bg-[#16161d] border border-white/15 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500 transition-colors shadow-inner"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-2.5 text-zinc-400 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1 rounded-full font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-900/40 border border-primary-400/40'
                      : 'bg-[#181822] text-zinc-300 hover:bg-[#222230] hover:text-white border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Emblem Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 py-2 grid grid-cols-3 sm:grid-cols-4 gap-3 min-h-[250px] relative z-10">
            {filteredEmblems.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-zinc-500 text-xs">
                <ShieldAlert className="w-8 h-8 mb-2 opacity-40 text-primary-400" />
                No emblems found matching your search.
              </div>
            ) : (
              filteredEmblems.map(emblem => {
                const isSelected = currentUrl === emblem.url;
                return (
                  <button
                    key={emblem.id}
                    onClick={() => {
                      onSelectEmblem(emblem.url);
                      onClose();
                    }}
                    className={`group relative rounded-2xl border p-2.5 flex flex-col items-center text-center transition-all bg-[#121218] hover:scale-[1.03] ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500/20 shadow-xl shadow-primary-500/30 ring-2 ring-primary-500'
                        : 'border-white/10 hover:border-primary-500/50 hover:bg-[#1a1a24]'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden mb-2 border border-white/10 bg-zinc-900 relative shadow-md shrink-0">
                      <img
                        src={emblem.url}
                        alt={emblem.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary-600/70 backdrop-blur-[1px] flex items-center justify-center">
                          <Check className="w-6 h-6 text-white stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-200 group-hover:text-white line-clamp-1 leading-tight">
                      {emblem.name}
                    </span>
                    <span className="text-[8px] text-zinc-400 font-mono mt-0.5 uppercase tracking-wider">
                      {emblem.category}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
