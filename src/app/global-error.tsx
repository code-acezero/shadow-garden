'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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

  useEffect(() => {
    console.error("Critical Global Error caught by Next.js:", error);
    if (typeof window !== 'undefined') {
      const msg = error?.message || '';
      const isChunkOrSwError = msg.includes('Loading chunk') || msg.includes('ChunkLoadError') || msg.includes('addAll');
      const lockKey = 'global_error_autoheal';
      const last = sessionStorage.getItem(lockKey);
      const now = Date.now();
      if (isChunkOrSwError && (!last || now - parseInt(last, 10) > 10000)) {
        sessionStorage.setItem(lockKey, now.toString());
        handleReload();
      }
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="m-0 p-0 bg-[#050508] text-white font-sans antialiased select-none">
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-md w-full text-center flex flex-col items-center relative z-10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 bg-purple-500/10 border border-purple-500/25 px-3.5 py-1 rounded-full mb-3 shadow-sm">
              (｡•́︿•̀｡) Critical Anomaly
            </span>

            <h1 className="text-2xl sm:text-3xl font-black tracking-wide uppercase text-white mb-2">
              Something <span className="text-purple-400">Tripped Over!</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mb-5 max-w-xs leading-relaxed">
              A critical mana surge occurred. Let&apos;s flush the cache and restore your anime realm!
            </p>

            {error?.message && (
              <p className="text-[11px] text-rose-300/90 font-mono mb-6 px-3.5 py-2 bg-rose-950/20 border border-rose-500/20 rounded-xl max-w-sm break-words leading-relaxed">
                {error.message}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleReload}
                className="py-2.5 px-6 rounded-full bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(168,85,247,0.35)] active:scale-95 transition-all cursor-pointer border border-purple-400/30"
              >
                Cast Heal & Reload
              </button>
              <a
                href="/home"
                className="py-2.5 px-6 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider border border-white/10 active:scale-95 transition-all cursor-pointer"
              >
                Sanctuary Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}