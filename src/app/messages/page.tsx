"use client";

import React from 'react';
import ChatSystem from '@/components/Social/Chats/ChatSystem';
import Footer from '@/components/Anime/Footer';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MessagesPage() {
  return (
    <div className="bg-[#050505] text-white flex flex-col w-full overflow-y-auto custom-scrollbar" style={{ height: "calc(100dvh - var(--nav-height-top) - var(--nav-height-bottom))" }}>
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 flex-1 flex flex-col py-6">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/social"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="p-2 bg-primary-600/20 border border-primary-500/30 rounded-2xl text-primary-400">
              <MessageSquare size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                Direct Messages
              </h1>
              <p className="text-[10px] text-zinc-400">
                Instagram-style 1-on-1 private messaging and Clan group chats.
              </p>
            </div>
          </div>
        </div>

        {/* Instagram DM Interface Container */}
        <div className="flex-1 w-full">
          <ChatSystem />
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
