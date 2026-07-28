"use client";

import React, { useEffect, useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
        },
        (err) => {
          console.warn('[PWA] ServiceWorker registration failed:', err);
        }
      );
    }

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after brief delay if not dismissed previously in session
      const dismissed = sessionStorage.getItem('sg_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('sg_pwa_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-[9999] max-w-sm w-[90%] p-4 rounded-[2rem] bg-black/80 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)] flex items-center justify-between gap-4 text-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-[1px] shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              <div className="w-full h-full bg-[#020617] rounded-2xl flex items-center justify-center">
                <Sparkles size={18} className="text-cyan-300 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-lemon font-bold tracking-wider text-white">
                INSTALL SHADOW GARDEN
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                Get full native app experience
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-mono font-bold text-[10px] tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <Download size={12} />
              INSTALL
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-all active:scale-95"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
