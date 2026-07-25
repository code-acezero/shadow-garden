"use client";

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Shield, ShieldAlert, Sparkles, Folder, Upload, Crop, ZoomIn, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ClanEmblem {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const ANIME_CLAN_EMBLEMS: ClanEmblem[] = [
  // --- SHADOW GARDEN ---
  { id: 'sg-eminence', name: 'Shadow Garden Sigil', category: 'Shadow Garden', url: '/emblems/sg_emblem.png' },
  { id: 'sg-atomic', name: 'I Am Atomic Burst', category: 'Shadow Garden', url: 'https://api.iconify.design/game-icons:atomic-slashes.svg?color=%23c084fc' },
  { id: 'sg-sevenshadows', name: 'Seven Shadows Order', category: 'Shadow Garden', url: 'https://api.iconify.design/game-icons:hooded-figure.svg?color=%23a855f7' },
  { id: 'sg-mitsugoshi', name: 'Mitsugoshi Corporation', category: 'Shadow Garden', url: 'https://api.iconify.design/game-icons:coins.svg?color=%23eab308' },
  { id: 'sg-slimeblade', name: 'Shadow Slime Blade', category: 'Shadow Garden', url: 'https://api.iconify.design/game-icons:katana.svg?color=%23c084fc' },
  { id: 'sg-diablos', name: 'Cult of Diablos Seal', category: 'Shadow Garden', url: 'https://api.iconify.design/game-icons:evil-comet.svg?color=%23dc2626' },
  { id: 'sg-sanctuary', name: 'Sanctuary Gateway', category: 'Shadow Garden', url: 'https://api.iconify.design/game-icons:magic-gate.svg?color=%2306b6d4' },
  { id: 'sg-alexandria', name: 'Alexandria Base', category: 'Shadow Garden', url: 'https://api.iconify.design/game-icons:castle.svg?color=%2310b981' },
  { id: 'sg-johnsmith', name: 'John Smith Steel Threads', category: 'Shadow Garden', url: 'https://api.iconify.design/game-icons:marionette.svg?color=%23eab308' },
  { id: 'sg-alexia', name: 'Midgar Royal Crest', category: 'Shadow Garden', url: 'https://api.iconify.design/game-icons:crowned-shield.svg?color=%2338bdf8' },
  { id: 'sg-lawless', name: 'Red Tower Lawless', category: 'Shadow Garden', url: 'https://api.iconify.design/game-icons:tower-flag.svg?color=%23ef4444' },

  // --- NARUTO ---
  { id: 'nar-akatsuki', name: 'Akatsuki Cloud', category: 'Naruto', url: '/emblems/akatsuki_emblem.png' },
  { id: 'nar-leaf', name: 'Konoha Hidden Leaf', category: 'Naruto', url: 'https://api.iconify.design/game-icons:shuriken.svg?color=%2322c55e' },
  { id: 'nar-uchiha', name: 'Uchiha Clan Crest', category: 'Naruto', url: 'https://api.iconify.design/game-icons:fire-tail.svg?color=%23ef4444' },
  { id: 'nar-uzumaki', name: 'Uzumaki Spiral Seal', category: 'Naruto', url: 'https://api.iconify.design/ph:circle-notch-bold.svg?color=%23f97316' },
  { id: 'nar-anbu', name: 'Anbu Ops Mask', category: 'Naruto', url: 'https://api.iconify.design/game-icons:fox-mask.svg?color=%23a855f7' },
  { id: 'nar-sand', name: 'Sunagakure Sand Gourd', category: 'Naruto', url: 'https://api.iconify.design/game-icons:sand-snake.svg?color=%23eab308' },
  { id: 'nar-rinnegan', name: 'Rinnegan Eye Domain', category: 'Naruto', url: 'https://api.iconify.design/game-icons:eyeball.svg?color=%23a855f7' },

  // --- ATTACK ON TITAN ---
  { id: 'aot-survey', name: 'Wings of Freedom', category: 'Attack on Titan', url: '/emblems/aot_emblem.png' },
  { id: 'aot-garrison', name: 'Garrison Roses', category: 'Attack on Titan', url: 'https://api.iconify.design/game-icons:rose.svg?color=%2322c55e' },
  { id: 'aot-police', name: 'Military Police Unicorn', category: 'Attack on Titan', url: 'https://api.iconify.design/game-icons:unicorn.svg?color=%233b82f6' },
  { id: 'aot-scout', name: 'Scout Regiment Shield', category: 'Attack on Titan', url: 'https://api.iconify.design/game-icons:feathered-wing.svg?color=%2306b6d4' },
  { id: 'aot-marley', name: 'Marley Warrior Unit', category: 'Attack on Titan', url: 'https://api.iconify.design/game-icons:spartan-helmet.svg?color=%23eab308' },

  // --- DEMON SLAYER ---
  { id: 'ds-corps', name: 'Demon Slayer Corps', category: 'Demon Slayer', url: '/emblems/ds_emblem.png' },
  { id: 'ds-flame', name: 'Flame Hashira Rengoku', category: 'Demon Slayer', url: 'https://api.iconify.design/game-icons:flamer.svg?color=%23f97316' },
  { id: 'ds-water', name: 'Water Hashira Tomioka', category: 'Demon Slayer', url: 'https://api.iconify.design/game-icons:water-drop.svg?color=%2306b6d4' },
  { id: 'ds-sun', name: 'Sun Breathing Hanafuda', category: 'Demon Slayer', url: 'https://api.iconify.design/game-icons:sunbeams.svg?color=%23ef4444' },
  { id: 'ds-thunder', name: 'Thunder Hashira Zenitsu', category: 'Demon Slayer', url: 'https://api.iconify.design/game-icons:lightning-trio.svg?color=%23eab308' },

  // --- ONE PIECE ---
  { id: 'op-strawhat', name: 'Straw Hat Pirates', category: 'One Piece', url: 'https://api.iconify.design/game-icons:pirate-flag.svg?color=%23eab308' },
  { id: 'op-heart', name: 'Heart Pirates (Law)', category: 'One Piece', url: 'https://api.iconify.design/game-icons:heart-emblem.svg?color=%23ef4444' },
  { id: 'op-whitebeard', name: 'Whitebeard Armada', category: 'One Piece', url: 'https://api.iconify.design/game-icons:mustache.svg?color=%2338bdf8' },
  { id: 'op-marines', name: 'World Navy Marines', category: 'One Piece', url: 'https://api.iconify.design/game-icons:anchor.svg?color=%232563eb' },
  { id: 'op-beast', name: 'Beast Pirates Kaido', category: 'One Piece', url: 'https://api.iconify.design/game-icons:horned-skull.svg?color=%23a855f7' },
  { id: 'op-redhair', name: 'Red Hair Shanks Fleet', category: 'One Piece', url: 'https://api.iconify.design/game-icons:crossed-swords.svg?color=%23ef4444' },

  // --- JUJUTSU KAISEN ---
  { id: 'jjk-high', name: 'Jujutsu High Insignia', category: 'Jujutsu Kaisen', url: 'https://api.iconify.design/game-icons:yin-yang.svg?color=%23a855f7' },
  { id: 'jjk-gojo', name: 'Six Eyes Limitless', category: 'Jujutsu Kaisen', url: 'https://api.iconify.design/game-icons:eye-shield.svg?color=%2338bdf8' },
  { id: 'jjk-sukuna', name: 'Malevolent Shrine', category: 'Jujutsu Kaisen', url: 'https://api.iconify.design/game-icons:horned-helm.svg?color=%23dc2626' },
  { id: 'jjk-shadows', name: 'Ten Shadows Divine Dog', category: 'Jujutsu Kaisen', url: 'https://api.iconify.design/game-icons:wolf-head.svg?color=%23a855f7' },

  // --- FAIRY TAIL ---
  { id: 'ft-fairy', name: 'Fairy Tail Guild Mark', category: 'Fairy Tail', url: 'https://api.iconify.design/game-icons:fairy.svg?color=%23ec4899' },
  { id: 'ft-sabertooth', name: 'Sabertooth Guild', category: 'Fairy Tail', url: 'https://api.iconify.design/game-icons:saber-toothed-cat-head.svg?color=%23eab308' },
  { id: 'ft-dragon', name: 'Dragon Slayer Igneel', category: 'Fairy Tail', url: 'https://api.iconify.design/game-icons:dragon-breath.svg?color=%23f97316' },

  // --- BLEACH ---
  { id: 'bl-gotei', name: 'Gotei 13 Soul Society', category: 'Bleach', url: 'https://api.iconify.design/game-icons:daito.svg?color=%23e2e8f0' },
  { id: 'bl-badge', name: 'Substitute Shinigami', category: 'Bleach', url: 'https://api.iconify.design/game-icons:skull-shield.svg?color=%23f97316' },
  { id: 'bl-quincy', name: 'Wandenreich Quincy Cross', category: 'Bleach', url: 'https://api.iconify.design/game-icons:sparkles.svg?color=%2338bdf8' },
  { id: 'bl-espada', name: 'Espada Hollow Crown', category: 'Bleach', url: 'https://api.iconify.design/game-icons:hollow-cat.svg?color=%23a855f7' },

  // --- MY HERO ACADEMIA ---
  { id: 'mha-ua', name: 'UA High School Shield', category: 'My Hero Academia', url: 'https://api.iconify.design/game-icons:shield-impact.svg?color=%23eab308' },
  { id: 'mha-ofa', name: 'One For All Flame', category: 'My Hero Academia', url: 'https://api.iconify.design/game-icons:lightning-helix.svg?color=%23ef4444' },

  // --- HUNTER X HUNTER ---
  { id: 'hxh-hunter', name: 'Hunter License Crest', category: 'Hunter x Hunter', url: 'https://api.iconify.design/game-icons:target-prize.svg?color=%2322c55e' },
  { id: 'hxh-spider', name: 'Phantom Troupe Spider', category: 'Hunter x Hunter', url: 'https://api.iconify.design/game-icons:spider-alt.svg?color=%23a855f7' },
  { id: 'hxh-zoldyck', name: 'Zoldyck Assassin Seal', category: 'Hunter x Hunter', url: 'https://api.iconify.design/game-icons:daggers-head.svg?color=%23a855f7' },

  // --- BLACK CLOVER ---
  { id: 'bc-bulls', name: 'Black Bulls Squad', category: 'Black Clover', url: 'https://api.iconify.design/game-icons:bull-head.svg?color=%23ef4444' },
  { id: 'bc-dawn', name: 'Golden Dawn Squad', category: 'Black Clover', url: 'https://api.iconify.design/game-icons:sun.svg?color=%23eab308' },

  // --- FULLMETAL ALCHEMIST ---
  { id: 'fma-flamel', name: 'Flamel Alchemy Snake', category: 'Fullmetal Alchemist', url: 'https://api.iconify.design/game-icons:caduceus.svg?color=%23dc2626' },
  { id: 'fma-ouroboros', name: 'Ouroboros Homunculus', category: 'Fullmetal Alchemist', url: 'https://api.iconify.design/game-icons:ouroboros.svg?color=%23ef4444' },

  // --- DRAGON BALL ---
  { id: 'db-capsule', name: 'Capsule Corporation', category: 'Dragon Ball', url: 'https://api.iconify.design/game-icons:atomic-slashes.svg?color=%233b82f6' },
  { id: 'db-redribbon', name: 'Red Ribbon Army', category: 'Dragon Ball', url: 'https://api.iconify.design/game-icons:ribbon-shield.svg?color=%23dc2626' },
  { id: 'db-kame', name: 'Kame Turtle Kanji', category: 'Dragon Ball', url: 'https://api.iconify.design/game-icons:turtle.svg?color=%23f97316' },

  // --- SOLO LEVELING & ISEKAI ---
  { id: 'sl-monarch', name: 'Shadow Monarch Crown', category: 'Solo Leveling', url: 'https://api.iconify.design/game-icons:crown.svg?color=%238b5cf6' },
  { id: 'sl-gate', name: 'S-Rank Gate Portal', category: 'Solo Leveling', url: 'https://api.iconify.design/game-icons:portal.svg?color=%233b82f6' },
  { id: 'ov-ainz', name: 'Ainz Ooal Gown', category: 'Overlord', url: 'https://api.iconify.design/game-icons:crown-coin.svg?color=%23eab308' },
  { id: 'eva-nerv', name: 'NERV Command Leaf', category: 'Evangelion', url: 'https://api.iconify.design/game-icons:maple-leaf.svg?color=%23dc2626' }
];

export const CATEGORIES = [
  'All',
  'Shadow Garden',
  'Naruto',
  'Attack on Titan',
  'Demon Slayer',
  'One Piece',
  'Jujutsu Kaisen',
  'Fairy Tail',
  'Bleach',
  'My Hero Academia',
  'Hunter x Hunter',
  'Black Clover',
  'Fullmetal Alchemist',
  'Dragon Ball',
  'Solo Leveling',
  'Overlord'
];

export const getRandomClanEmblem = () => {
  return ANIME_CLAN_EMBLEMS[Math.floor(Math.random() * ANIME_CLAN_EMBLEMS.length)].url;
};

interface ClanEmblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmblem: (url: string) => void;
  currentUrl?: string;
}

export default function ClanEmblemModal({ isOpen, onClose, onSelectEmblem, currentUrl }: ClanEmblemModalProps) {
  const [activeTab, setActiveTab] = useState<'preset' | 'upload'>('preset');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload & Crop State
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const filteredEmblems = ANIME_CLAN_EMBLEMS.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImageSrc(reader.result as string);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!uploadedImageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = () => {
    if (!uploadedImageSrc) return;
    
    const canvas = document.createElement('canvas');
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, size, size);

      // Draw circular mask clip
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      const baseWidth = size * zoom;
      const aspectRatio = img.height / img.width;
      const baseHeight = baseWidth * aspectRatio;

      const drawX = (size - baseWidth) / 2 + pan.x;
      const drawY = (size - baseHeight) / 2 + pan.y;

      ctx.drawImage(img, drawX, drawY, baseWidth, baseHeight);

      const croppedDataUrl = canvas.toDataURL('image/png');
      onSelectEmblem(croppedDataUrl);
      onClose();
    };
    img.src = uploadedImageSrc;
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xl font-sans">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-4xl bg-[#09090d]/90 border border-white/10 rounded-[28px] shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col relative overflow-hidden h-[85vh] max-h-[720px] ring-1 ring-white/10 backdrop-blur-2xl"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/3 w-1/2 h-64 bg-primary-600/15 rounded-full blur-[110px] pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 pr-16 shrink-0 border-b border-white/5 relative z-10 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-900/30 border border-primary-500/40 text-primary-400 shadow-md">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  Emblem Library & Studio
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Select a verified sigil or crop a custom upload</p>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1 rounded-2xl self-stretch sm:self-auto">
              <button
                onClick={() => setActiveTab('preset')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'preset' ? 'bg-primary-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Presets
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload' ? 'bg-primary-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Crop size={14} /> Custom Upload & Crop
              </button>
            </div>

            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-all cursor-pointer border border-white/5 z-30"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
            {activeTab === 'preset' ? (
              <>
                {/* Sidebar Categories */}
                <div className="w-full md:w-64 shrink-0 border-r border-white/5 bg-black/30 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-1.5">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-3">
                    Collections
                  </div>
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedCategory === cat;
                    const count = cat === 'All' ? ANIME_CLAN_EMBLEMS.length : ANIME_CLAN_EMBLEMS.filter(e => e.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`relative w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                          isSelected ? 'text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="active-category"
                            className="absolute inset-0 bg-primary-600/20 border border-primary-500/30 rounded-xl"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                          />
                        )}
                        <span className="flex items-center gap-2.5 relative z-10">
                          {cat === 'Shadow Garden' ? (
                            <Sparkles size={15} className={isSelected ? 'text-primary-400' : 'text-zinc-500 group-hover:text-primary-400'} />
                          ) : (
                            <Folder size={15} className={isSelected ? 'text-primary-400' : 'text-zinc-500 group-hover:text-primary-400'} />
                          )}
                          {cat}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md relative z-10 ${isSelected ? 'bg-primary-500/30 text-primary-300' : 'bg-white/5 text-zinc-500'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-black/50 p-4 sm:p-6 overflow-hidden">
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search emblems..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-11 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all font-medium"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {filteredEmblems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                        <ShieldAlert className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-xs font-medium">No emblems found matching your criteria.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                        {filteredEmblems.map(emblem => {
                          const isSelected = currentUrl === emblem.url;
                          return (
                            <button
                              key={emblem.id}
                              onClick={() => { onSelectEmblem(emblem.url); onClose(); }}
                              className={`group relative aspect-square rounded-2xl border flex flex-col items-center justify-center p-4 transition-all duration-300 overflow-hidden cursor-pointer ${
                                isSelected 
                                  ? 'border-primary-500 bg-primary-900/25 shadow-[0_0_25px_rgba(220,38,38,0.2)]' 
                                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20'
                              }`}
                            >
                              <img 
                                src={emblem.url} 
                                alt={emblem.name}
                                className="w-24 h-24 object-contain filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-500 ease-out relative z-10"
                              />

                              {isSelected && (
                                <div className="absolute top-3 right-3 z-20 bg-primary-500 rounded-full p-1 shadow-lg">
                                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                </div>
                              )}

                              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                                <div className="text-[11px] font-bold text-white truncate text-center w-full">
                                  {emblem.name}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Custom Emblem Upload & Crop Studio */
              <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 bg-black/60 gap-8 overflow-y-auto custom-scrollbar">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {!uploadedImageSrc ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full max-w-md h-72 rounded-3xl border-2 border-dashed border-white/15 hover:border-primary-500/50 bg-white/[0.02] hover:bg-primary-500/5 transition-all flex flex-col items-center justify-center p-6 cursor-pointer text-center group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 group-hover:border-primary-500/40 flex items-center justify-center text-zinc-400 group-hover:text-primary-400 transition-all mb-4">
                      <Upload size={28} />
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">Click to Upload Emblem Image</h4>
                    <p className="text-xs text-zinc-400 max-w-xs">Supports PNG, JPG, WEBP or SVG. You can crop and pan afterwards.</p>
                  </div>
                ) : (
                  <>
                    {/* Interactive Crop Canvas Viewport */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Crop size={14} className="text-primary-400" /> Pan & Position (Drag image to position)
                      </div>

                      <div 
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="relative w-64 h-64 rounded-full border-2 border-primary-500/60 shadow-[0_0_40px_rgba(220,38,38,0.2)] overflow-hidden bg-black/80 cursor-grab active:cursor-grabbing select-none"
                      >
                        <img
                          ref={imageRef}
                          src={uploadedImageSrc}
                          alt="Crop preview"
                          draggable={false}
                          style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: 'center',
                            maxWidth: 'none',
                          }}
                          className="w-full h-full object-contain pointer-events-none transition-transform duration-75"
                        />
                        {/* Overlay Grid */}
                        <div className="absolute inset-0 border-2 border-white/20 rounded-full pointer-events-none" />
                      </div>

                      {/* Controls */}
                      <div className="w-full max-w-xs space-y-3 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                          <span className="flex items-center gap-1.5"><ZoomIn size={14} className="text-primary-400" /> Zoom Scale</span>
                          <span className="font-mono text-primary-400">{zoom.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.05"
                          value={zoom}
                          onChange={e => setZoom(parseFloat(e.target.value))}
                          className="w-full accent-primary-500 cursor-pointer"
                        />
                        <button
                          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                          className="w-full py-1.5 text-[10px] font-bold text-zinc-400 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <RefreshCw size={12} /> Reset Position
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      <button
                        onClick={handleApplyCrop}
                        className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-500 hover:to-primary-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Check size={16} strokeWidth={3} /> Apply & Save Emblem
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Upload size={14} /> Choose Different Image
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
