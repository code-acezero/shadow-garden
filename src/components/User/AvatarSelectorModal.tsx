"use client";

import React, { useState, useMemo } from 'react';
import { X, Search, Check, UserCircle, Lock, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AvatarItem {
  id: string;
  name: string;
  category: string; // 'One Piece', 'Naruto', 'Dragon Ball', 'Solo Leveling', 'Jujutsu Kaisen', 'Demon Slayer', 'Bleach', 'Meme'
  url: string;
  isGuestAllowed?: boolean;
}

export const ANIME_AVATARS: AvatarItem[] = [
  // --- MEME / FUNNY AVATARS (GUEST & REGISTERED) ---
  { id: 'm1', name: 'Smug Anya', category: 'Memes', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AnyaSmug', isGuestAllowed: true },
  { id: 'm2', name: 'Cursed Gojo', category: 'Memes', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CursedGojo', isGuestAllowed: true },
  { id: 'm3', name: 'Lost Zoro', category: 'Memes', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ZoroLost', isGuestAllowed: true },
  { id: 'm4', name: 'Derp Goku', category: 'Memes', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=DerpGoku', isGuestAllowed: true },
  { id: 'm5', name: 'Shocked Pikachu', category: 'Memes', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ShockPika', isGuestAllowed: true },
  { id: 'm6', name: 'Screaming Cat', category: 'Memes', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CatScream', isGuestAllowed: true },
  { id: 'm7', name: 'Traveler Mask', category: 'Memes', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TravelerMask', isGuestAllowed: true },
  { id: 'm8', name: 'Shadow Slime', category: 'Memes', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowSlime', isGuestAllowed: true },

  // --- ONE PIECE ---
  { id: 'op1', name: 'Monkey D. Luffy', category: 'One Piece', url: 'https://cdn.myanimelist.net/images/characters/9/131317.jpg' },
  { id: 'op2', name: 'Roronoa Zoro', category: 'One Piece', url: 'https://cdn.myanimelist.net/images/characters/3/100534.jpg' },
  { id: 'op3', name: 'Vinsmoke Sanji', category: 'One Piece', url: 'https://cdn.myanimelist.net/images/characters/5/136769.jpg' },
  { id: 'op4', name: 'Nami', category: 'One Piece', url: 'https://cdn.myanimelist.net/images/characters/2/263249.jpg' },
  { id: 'op5', name: 'Trafalgar D. Law', category: 'One Piece', url: 'https://cdn.myanimelist.net/images/characters/4/111858.jpg' },
  { id: 'op6', name: 'Shanks', category: 'One Piece', url: 'https://cdn.myanimelist.net/images/characters/12/283626.jpg' },
  { id: 'op7', name: 'Portgas D. Ace', category: 'One Piece', url: 'https://cdn.myanimelist.net/images/characters/4/72223.jpg' },

  // --- NARUTO ---
  { id: 'n1', name: 'Naruto Uzumaki', category: 'Naruto', url: 'https://cdn.myanimelist.net/images/characters/2/284121.jpg' },
  { id: 'n2', name: 'Sasuke Uchiha', category: 'Naruto', url: 'https://cdn.myanimelist.net/images/characters/9/131317.jpg' },
  { id: 'n3', name: 'Kakashi Hatake', category: 'Naruto', url: 'https://cdn.myanimelist.net/images/characters/7/284129.jpg' },
  { id: 'n4', name: 'Itachi Uchiha', category: 'Naruto', url: 'https://cdn.myanimelist.net/images/characters/8/70570.jpg' },
  { id: 'n5', name: 'Hinata Hyuga', category: 'Naruto', url: 'https://cdn.myanimelist.net/images/characters/6/284125.jpg' },
  { id: 'n6', name: 'Madara Uchiha', category: 'Naruto', url: 'https://cdn.myanimelist.net/images/characters/16/208573.jpg' },

  // --- DRAGON BALL ---
  { id: 'db1', name: 'Son Goku', category: 'Dragon Ball', url: 'https://cdn.myanimelist.net/images/characters/15/258019.jpg' },
  { id: 'db2', name: 'Vegeta', category: 'Dragon Ball', url: 'https://cdn.myanimelist.net/images/characters/9/258021.jpg' },
  { id: 'db3', name: 'Gohan', category: 'Dragon Ball', url: 'https://cdn.myanimelist.net/images/characters/14/258025.jpg' },
  { id: 'db4', name: 'Trunks', category: 'Dragon Ball', url: 'https://cdn.myanimelist.net/images/characters/11/258027.jpg' },
  { id: 'db5', name: 'Piccolo', category: 'Dragon Ball', url: 'https://cdn.myanimelist.net/images/characters/13/258023.jpg' },

  // --- SOLO LEVELING ---
  { id: 'sl1', name: 'Sung Jinwoo', category: 'Solo Leveling', url: 'https://cdn.myanimelist.net/images/characters/10/531980.jpg' },
  { id: 'sl2', name: 'Cha Hae-In', category: 'Solo Leveling', url: 'https://cdn.myanimelist.net/images/characters/4/534120.jpg' },
  { id: 'sl3', name: 'Igris', category: 'Solo Leveling', url: 'https://cdn.myanimelist.net/images/characters/2/535000.jpg' },

  // --- JUJUTSU KAISEN ---
  { id: 'jjk1', name: 'Satoru Gojo', category: 'Jujutsu Kaisen', url: 'https://cdn.myanimelist.net/images/characters/15/422168.jpg' },
  { id: 'jjk2', name: 'Ryomen Sukuna', category: 'Jujutsu Kaisen', url: 'https://cdn.myanimelist.net/images/characters/8/422170.jpg' },
  { id: 'jjk3', name: 'Yuji Itadori', category: 'Jujutsu Kaisen', url: 'https://cdn.myanimelist.net/images/characters/3/422166.jpg' },
  { id: 'jjk4', name: 'Megumi Fushiguro', category: 'Jujutsu Kaisen', url: 'https://cdn.myanimelist.net/images/characters/9/422167.jpg' },

  // --- DEMON SLAYER ---
  { id: 'ds1', name: 'Tanjiro Kamado', category: 'Demon Slayer', url: 'https://cdn.myanimelist.net/images/characters/8/383679.jpg' },
  { id: 'ds2', name: 'Nezuko Kamado', category: 'Demon Slayer', url: 'https://cdn.myanimelist.net/images/characters/16/383681.jpg' },
  { id: 'ds3', name: 'Zenitsu Agatsuma', category: 'Demon Slayer', url: 'https://cdn.myanimelist.net/images/characters/13/383683.jpg' },
  { id: 'ds4', name: 'Kyojuro Rengoku', category: 'Demon Slayer', url: 'https://cdn.myanimelist.net/images/characters/3/420786.jpg' },
];

export function getRandomAvatar(isGuest = false): string {
  const options = isGuest
    ? ANIME_AVATARS.filter(a => a.isGuestAllowed)
    : ANIME_AVATARS;
  const pick = options[Math.floor(Math.random() * options.length)];
  return pick.url;
}

export function getRandomGuestName(): string {
  const number = Math.floor(1000 + Math.random() * 9000);
  const titles = ['Traveler', 'Shadow Wanderer', 'Astral Guest', 'Mystic Nomad'];
  const prefix = titles[Math.floor(Math.random() * titles.length)];
  return `${prefix} #${number}`;
}

interface AvatarSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  currentUrl?: string;
  isGuest?: boolean;
}

export default function AvatarSelectorModal({
  isOpen,
  onClose,
  onSelect,
  currentUrl,
  isGuest = false,
}: AvatarSelectorModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = useMemo(() => {
    if (isGuest) return ['Memes'];
    const cats = Array.from(new Set(ANIME_AVATARS.map(a => a.category)));
    return ['All', ...cats];
  }, [isGuest]);

  const filteredAvatars = useMemo(() => {
    let list = isGuest ? ANIME_AVATARS.filter(a => a.isGuestAllowed) : ANIME_AVATARS;

    if (!isGuest && selectedCategory !== 'All') {
      list = list.filter(a => a.category === selectedCategory);
    }

    if (!isGuest && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        a => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedCategory, searchQuery, isGuest]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <UserCircle size={18} className="text-primary-500" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white">
                {isGuest ? 'Guest Meme Avatars' : 'Select Character Avatar'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search bar & Guest Restriction Notice */}
          {isGuest ? (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-3 text-yellow-400 text-xs">
              <Lock size={16} className="shrink-0" />
              <span>Guest profiles are restricted to Meme Avatars. Sign in to unlock 100+ Anime Character avatars!</span>
            </div>
          ) : (
            <div className="relative mt-4">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search anime or character name (e.g. Luffy, Gojo, Naruto)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          )}

          {/* Category Tabs (Registered Users Only) */}
          {!isGuest && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3 mt-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                      : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Avatar Grid */}
          <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-2 mt-2">
            {filteredAvatars.map(avatar => {
              const isSelected = currentUrl === avatar.url;
              return (
                <div
                  key={avatar.id}
                  onClick={() => {
                    onSelect(avatar.url);
                    onClose();
                  }}
                  className={`group relative aspect-square rounded-2xl overflow-hidden border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary-500 ring-2 ring-primary-500/50 scale-105'
                      : 'border-white/10 hover:border-white/40 hover:scale-105'
                  }`}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      // Fallback to dicebear if image link breaks
                      e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatar.id}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                    <span className="text-[9px] font-bold text-white truncate w-full">
                      {avatar.name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-md">
                      <Check size={12} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
