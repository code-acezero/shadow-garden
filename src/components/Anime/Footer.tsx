"use client";

import React, { memo } from 'react';
import Link from 'next/link';
import { 
  Compass, Layers, ShieldCheck, ChevronUp, 
  Tv, BookOpen, Film, Scroll, Mic2, Calendar, 
  MessageSquare, Users, ScanSearch, RefreshCw,
  Scale, FileText, Lock, AlertCircle, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AdsterraNativeBanner from '@/components/Ads/AdsterraNativeBanner';
import { playGummyTap } from '@/lib/audioManager';

function FooterComponent() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    playGummyTap();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (document.documentElement) {
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="w-full bg-[#050811] border-t border-white/[0.07] mt-6 md:mt-8 text-zinc-400 relative select-none">
      
      {/* Top Subtle Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[80px] bg-red-600/[0.03] blur-[80px] pointer-events-none" />

      {/* Sponsored Ad Banner Container */}
      <div className="w-full px-2 sm:px-4 md:px-6 pt-3 pb-1">
        <div className="w-full rounded-2xl bg-white/[0.015] border border-white/[0.05] p-2 overflow-hidden shadow-sm">
          <AdsterraNativeBanner location="general" format="native" />
        </div>
      </div>

      {/* Main Multi-Column Footer Grid */}
      <div className="w-full px-2 sm:px-4 md:px-6 pt-5 pb-2 md:pt-6 md:pb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
          
          {/* Column 1 & 2: Branding & Platform Info */}
          <div className="lg:col-span-2 flex flex-col items-start gap-3 pr-0 lg:pr-8">
            <Link 
              href="/" 
              onClick={() => playGummyTap()}
              className="flex flex-col text-white group"
            >
              <span className="text-base md:text-lg font-lemon font-black tracking-widest text-white group-hover:text-red-400 transition-colors">
                KAGEMI
              </span>
              <span className="text-[8.5px] font-black uppercase tracking-[0.25em] text-zinc-500 -mt-0.5">
                The Multiverse of Entertainment
              </span>
            </Link>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-md font-medium">
              An edge-accelerated, unified discovery sanctuary for Anime, Manga, Light Novels, Asian Dramas, and Worldwide Cinema. Engineered with ultra-minimal dark aesthetics and fluid interactions.
            </p>
          </div>

          {/* Column 3: Media Discovery */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white">
              <Compass size={13} className="text-red-400" />
              <span>Discovery</span>
            </div>
            <ul className="flex flex-col gap-2 text-xs font-medium">
              <li>
                <Link 
                  href="/explore?library=anime" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Anime Series</span>
                  <Tv size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/manga" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Manga &amp; Novels</span>
                  <BookOpen size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/cinema" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Asian Dramas &amp; Cinema</span>
                  <Film size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/donghua" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Donghua Hub</span>
                  <Scroll size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/hindi" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Hindi Dubbed Vault</span>
                  <Mic2 size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Ecosystem & Tools */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white">
              <Layers size={13} className="text-amber-400" />
              <span>Ecosystem</span>
            </div>
            <ul className="flex flex-col gap-2 text-xs font-medium">
              <li>
                <Link 
                  href="/schedule" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Release Schedule</span>
                  <Calendar size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/rooms" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Watch Parties</span>
                  <Users size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/social" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">OtakuVerse Community</span>
                  <MessageSquare size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/ai/imagesearch" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">AI Visual Search</span>
                  <ScanSearch size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/watchlist" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">AniList Cloud Sync</span>
                  <RefreshCw size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Platform & Compliance */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white">
              <ShieldCheck size={13} className="text-blue-400" />
              <span>Compliance</span>
            </div>
            
            <ul className="flex flex-col gap-2 text-xs font-medium">
              <li>
                <Link 
                  href="/settings" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">DMCA &amp; Takedown Notice</span>
                  <Scale size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/settings" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Terms of Service</span>
                  <FileText size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/settings" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Privacy Policy</span>
                  <Lock size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/settings" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Content Disclaimer</span>
                  <AlertCircle size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/settings" 
                  onClick={() => playGummyTap()} 
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Security &amp; Inquiries</span>
                  <Shield size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              </li>
            </ul>

            <p className="text-[10px] text-zinc-500 leading-relaxed pt-1.5 border-t border-white/[0.04]">
              All media content is indexed from non-affiliated third-party providers.
            </p>
          </div>

        </div>

        {/* Bottom Legal & Copyright Strip */}
        <div className="mt-6 pt-3 pb-5 md:pb-2 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-zinc-500">
          
          <div className="flex items-center gap-2">
            <span>&copy; {currentYear} KAGEMI.</span>
            <span>All rights reserved.</span>
            <span className="hidden sm:inline text-zinc-600">&bull;</span>
            <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">VERSION 4</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-600 tracking-wider uppercase font-bold">
              ESTABLISHED IN THE SHADOWS
            </span>

            {/* Back to Top Quick Action */}
            <button 
              onClick={scrollToTop} 
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 transition-all text-xs font-bold active:scale-95 shadow-sm"
              title="Return to top"
            >
              <span>Top</span>
              <ChevronUp size={12} />
            </button>
          </div>

        </div>
      </div>

    </footer>
  );
}

const Footer = memo(FooterComponent);
export default Footer;