"use client";

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PostShareModal from '@/components/Social/PostShareModal';

export default function CuteShareBar() {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <section className="w-full max-w-5xl mx-auto px-4 my-8">
      <div className="relative rounded-3xl border border-primary-500/30 bg-gradient-to-r from-[#120816] via-[#0d0714] to-[#120816] p-5 sm:p-6 shadow-[0_0_40px_rgba(220,38,38,0.15)] flex flex-col sm:flex-row items-center justify-between gap-5 overflow-hidden">
        <div className="flex items-center gap-4 text-left w-full sm:w-auto">
          <div className="relative w-14 h-14 sm:w-18 sm:h-18 shrink-0 bg-primary-950/40 rounded-2xl border border-primary-500/30 overflow-hidden flex items-center justify-center p-1.5 shadow-inner">
            <img 
              src="/images/index/sticker-1.gif" 
              alt="Cute Shadow Mascot" 
              className="w-full h-full object-contain animate-bounce" 
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-primary-600/30 border border-primary-500/40 text-primary-400 text-[10px] font-mono font-bold tracking-widest uppercase">
                Spread The Word
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">Join the Guild</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white mt-1">Invite your friends to Shadow Garden!</h4>
            <p className="text-xs text-zinc-400 line-clamp-2 sm:line-clamp-none">Share the sanctuary to unlock watch parties, live streams, and 15,000+ anime & donghua.</p>
          </div>
        </div>
        <Button
          onClick={() => setShowShareModal(true)}
          className="w-full sm:w-auto bg-primary-600 hover:bg-primary-500 text-white border-0 h-11 px-6 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary-900/30 flex items-center justify-center gap-2 shrink-0 group hover:scale-105 transition-all"
        >
          <Share2 size={16} className="group-hover:rotate-12 transition-transform" />
          Share Garden
        </Button>
      </div>

      <PostShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        customUrl={typeof window !== 'undefined' ? window.location.origin : 'https://shadow-garden-v2.vercel.app'}
        customTitle="Shadow Garden - Next-Gen Anime & Donghua Sanctuary"
        customContent="Stream 15,000+ anime & donghua in ultra HD with 0 ads, join real-time watch rooms, and chat with fellow otakus!"
      />
    </section>
  );
}
