"use client";

import React, { useState } from 'react';
import OtakuVerse from '@/components/Social/OtakuVerse';
import AuthModal from '@/components/Auth/AuthModal';
import { useAuth } from '@/context/AuthContext';

export default function SocialPage() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-24">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] opacity-50" />
      </div>

      {/* Main Social Interface */}
      <div className="relative z-10">
        <OtakuVerse 
          user={user} 
          onAuthRequired={() => setShowAuthModal(true)} 
        />
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