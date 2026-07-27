"use client";

import React, { useEffect, Suspense } from 'react';
import ChatSystem from '@/components/Social/Chats/ChatSystem';

function MessagesContent() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('clear_temp_notifications'));
  }, []);
  return (
    <div
      className="fixed inset-0 bg-[#050505] text-white flex flex-col overflow-hidden"
      style={{ top: 'var(--nav-height-top, 60px)', bottom: 'var(--nav-height-bottom, 70px)' }}
    >
      <div className="w-full sm:px-4 flex-1 flex flex-col h-full overflow-hidden sm:py-3">
        <ChatSystem />
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#050505]" />}>
      <MessagesContent />
    </Suspense>
  );
}
