"use client";

import { useEffect } from 'react';

/**
 * PWAInstaller
 * Handles service worker lifecycle, automatic skipWaiting, legacy cache cleanup,
 * and standard PWA install prompts.
 */
export default function PWAInstaller() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Purge any caches immediately on app bootstrap to prevent stale chunk errors
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          console.log('[PWA] Purging cache store:', key);
          caches.delete(key);
        });
      });
    }

    // Register Service Worker with automatic update & claim
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // Check for updates immediately
        reg.update();

        // If a worker is already waiting, tell it to take over
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      }).catch((err) => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      });

      // Reload when new SW activates and claims clients
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[PWA] New Service Worker activated. Refreshing page...');
          window.location.reload();
        }
      });
    }

    // Allow native install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}
