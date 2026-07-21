"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OtakuVerse from '@/components/Social/OtakuVerse';
import AuthModal from '@/components/Auth/AuthModal';
import Footer from '@/components/Anime/Footer';
import { useAuth } from '@/context/AuthContext';

function SocialContent() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const searchParams = useSearchParams();
  const newsId = searchParams.get('news');
  const postId = searchParams.get('post');

  return (
    <div className="overflow-visible bg-[#050505] text-white flex flex-col w-full h-full">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-900/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] opacity-50" />
      </div>

      {/* Main Social Interface */}
      <div className="relative z-10 flex-1">
        <OtakuVerse 
          user={user} 
          onAuthRequired={() => setShowAuthModal(true)} 
          highlightId={postId || undefined}
          initialNewsId={newsId || undefined}
        />
      </div>

      {/* Footer spans full width */}
      <div className="relative z-10 mt-auto w-full pt-8 pb-8">
        <Footer />
      </div>

      {/* Auth Modal for Guests interacting with features */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
}

export default function SocialPage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-[#050505]" />}>
      <SocialContent />
    </Suspense>
  );
}