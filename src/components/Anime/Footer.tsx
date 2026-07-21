"use client";

import React from 'react';
import Link from 'next/link';
import { Crown, Copyright } from 'lucide-react';
import { cn } from '@/lib/utils';
import ShadowLogo from '@/components/UIx/ShadowLogo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#050505] border-t border-white/5 py-8 mt-12">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Branding */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <Link href="/" className="flex items-center gap-3 text-white hover:text-orange-500 transition-colors group">
            <div className="w-8 h-8 rounded-full border border-white/20 group-hover:border-orange-500 transition-colors flex items-center justify-center bg-[#0a0a0a]">
              <ShadowLogo size="w-6 h-6" />
            </div>
            <span className="text-xl font-lemon font-black tracking-widest">SHADOW GARDEN</span>
          </Link>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
            Premium Anime & Drama Streaming
          </p>
        </div>

        {/* Center: Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs font-bold text-zinc-400 uppercase tracking-widest">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/hindi" className="hover:text-white transition-colors">Hindi Dub</Link>
          <Link href="/donghua" className="hover:text-white transition-colors">Donghua</Link>
          <Link href="/drama" className="hover:text-white transition-colors">Drama</Link>
          <Link href="/movies" className="hover:text-white transition-colors">Movies &amp; Series</Link>
          <Link href="/schedule" className="hover:text-white transition-colors">Schedule</Link>
        </div>

        {/* Right: Copyright & Creator */}
        <div className="flex flex-col items-center md:items-end gap-1 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
          <div className="flex items-center gap-1">
            <Copyright size={10} /> {currentYear} Shadow Garden
          </div>
          <div className="flex items-center gap-1">
            Developed by <a href="https://www.facebook.com/codeacezero.azim" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors border-b border-zinc-400 hover:border-white">Ace Zero</a>
          </div>
        </div>

      </div>
    </footer>
  );
}