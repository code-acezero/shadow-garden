'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Global Error caught by Next.js:", error);
  }, [error]);

  const handleReload = async () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('shadow_auth_hint');
        sessionStorage.clear();
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            await reg.unregister();
          }
        }
      } catch (_) {}
      // Force fresh fetch bypassing browser disk cache
      window.location.href = '/?t=' + Date.now();
    }
  };

  return (
    <html lang="en">
      <body className="m-0 p-0 bg-[#050508] text-white font-sans">
        <div className="min-h-screen w-full flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center flex flex-col items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400/90 bg-purple-950/50 border border-purple-500/30 px-3 py-1 rounded-full mb-4">
              Critical Fault
            </span>

            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-zinc-400 text-sm mb-4 max-w-xs leading-relaxed">
              A critical error occurred. Please try reloading the app.
            </p>

            {error?.message && (
              <p className="text-xs text-red-400/80 font-mono mb-6 px-3 py-2 bg-red-950/30 border border-red-500/20 rounded-lg max-w-sm break-words">
                {error.message}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleReload}
                className="py-2.5 px-6 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95 transition-all cursor-pointer"
              >
                Try again
              </button>
              <a
                href="/home"
                className="py-2.5 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs tracking-wide border border-white/20 active:scale-95 transition-all cursor-pointer"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}