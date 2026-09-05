"use client";

import { useEffect } from 'react';

/**
 * Silent PWA installer — registers the service worker and captures the
 * browser's native beforeinstallprompt event so Chrome/Edge can show its
 * own install banner. No custom UI is rendered.
 */
export default function PWAInstaller() {
  useEffect(() => {
    // Register Service Worker with automatic update & legacy cache cleanup
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.update();
      }).catch((err) => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      });

      // Automatically purge legacy broken caches if found in client storage
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key.includes('v1') || key.includes('v2') || key.includes('v3')) {
              caches.delete(key);
            }
          });
        });
      }
    }

    // Allow the browser to show its own native install prompt — do NOT call
    // e.preventDefault() so the browser banner appears automatically.
    const handleBeforeInstallPrompt = (_e: Event) => {
      // intentionally not calling e.preventDefault()
      // the browser will show its native install UI on its own
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Render nothing
  return null;
}
