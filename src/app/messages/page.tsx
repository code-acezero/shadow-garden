"use client";

import React from 'react';
import ChatSystem from '@/components/Social/Chats/ChatSystem';

export default function MessagesPage() {
  return (
    <div
      className="fixed inset-0 bg-[#050505] text-white flex flex-col overflow-hidden"
      style={{ top: 'var(--nav-height-top, 60px)', bottom: 'var(--nav-height-bottom, 70px)' }}
    >
      <div className="w-full max-w-[1400px] mx-auto sm:px-4 flex-1 flex flex-col h-full overflow-hidden sm:py-3">
        <ChatSystem />
      </div>
    </div>
  );
}
