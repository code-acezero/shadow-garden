"use client";

import React from 'react';
import Link from 'next/link';
import { Compass, Flame, Shield, Heart, Zap, Sparkles, Ghost, Skull, Trophy, Smile } from 'lucide-react';

const GENRES = [
  { name: 'Action', icon: Flame, color: 'from-red-600/20 to-orange-600/20 text-red-400 border-red-500/30' },
  { name: 'Fantasy', icon: Sparkles, color: 'from-purple-600/20 to-indigo-600/20 text-purple-400 border-purple-500/30' },
  { name: 'Sci-Fi', icon: Zap, color: 'from-cyan-600/20 to-blue-600/20 text-cyan-400 border-cyan-500/30' },
  { name: 'Romance', icon: Heart, color: 'from-pink-600/20 to-rose-600/20 text-pink-400 border-pink-500/30' },
  { name: 'Supernatural', icon: Ghost, color: 'from-violet-600/20 to-fuchsia-600/20 text-violet-400 border-violet-500/30' },
  { name: 'Comedy', icon: Smile, color: 'from-amber-600/20 to-yellow-600/20 text-amber-400 border-amber-500/30' },
  { name: 'Horror', icon: Skull, color: 'from-emerald-600/20 to-teal-600/20 text-emerald-400 border-emerald-500/30' },
  { name: 'Sports', icon: Trophy, color: 'from-blue-600/20 to-sky-600/20 text-blue-400 border-blue-500/30' },
  { name: 'Adventure', icon: Compass, color: 'from-orange-600/20 to-amber-600/20 text-orange-400 border-orange-500/30' },
];

export default function GenrePillsBar() {
  return (
    <div className="w-full px-4 md:px-0">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 text-xs font-black uppercase tracking-wider shrink-0">
          <Compass size={13} className="text-primary-500" />
          <span>Genres</span>
        </div>
        {GENRES.map((g) => {
          const Icon = g.icon;
          return (
            <Link
              key={g.name}
              href={`/search?type=${encodeURIComponent(g.name)}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r ${g.color} border backdrop-blur-md text-xs font-bold whitespace-nowrap shrink-0 hover:scale-105 active:scale-95 transition-all shadow-sm`}
            >
              <Icon size={13} />
              <span>{g.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
