"use client";

import React from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LETTERS = [
  'All', '#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
  'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

export default function AZNavigationBar() {
  return (
    <section className="w-full my-6 md:my-10 relative z-10">
      <div className="relative rounded-2xl md:rounded-3xl bg-gradient-to-b from-[#0e0e12]/90 to-[#070709]/95 border border-white/10 backdrop-blur-2xl p-5 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-36 bg-red-600/15 blur-[80px] pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 md:mb-6">
          <div className="flex items-center gap-2.5 md:gap-3">
            <BookOpen className="w-7 h-7 md:w-9 md:h-9 text-red-500 shrink-0" />
            <h2 className="text-xl md:text-3xl font-black text-white font-lemon uppercase tracking-wide flex items-center gap-2">
              ALPHABETICAL <span className="text-red-500">ARCHIVE</span>
            </h2>
          </div>

          <p className="text-[11px] md:text-xs text-zinc-400 max-w-md font-medium leading-relaxed">
            Instant directory lookup across over 15,000+ anime titles, feature films, and seasonal transmissions.
          </p>
        </div>

        {/* A-Z Button Grid */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 md:gap-2">
          {LETTERS.map((char) => {
            const isAll = char === 'All';
            const targetUrl = isAll 
              ? '/explore?mode=az' 
              : `/explore?mode=az&letter=${encodeURIComponent(char === '#' ? '0-9' : char)}`;

            return (
              <Link
                key={char}
                href={targetUrl}
                className={`
                  group relative flex items-center justify-center
                  ${isAll ? 'px-4 h-8 md:h-9' : 'w-8 h-8 md:w-9 md:h-9'}
                  rounded-xl md:rounded-2xl
                  text-[11px] md:text-xs font-black uppercase tracking-wider
                  transition-all duration-200 select-none
                  bg-white/[0.04] border border-white/10 text-zinc-300
                  hover:bg-red-600 hover:text-white hover:border-red-500
                  hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:-translate-y-0.5
                  active:scale-95 active:translate-y-0
                `}
              >
                <span>{char}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
