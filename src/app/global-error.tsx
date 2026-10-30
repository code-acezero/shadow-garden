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
      window.location.href = '/home?t=' + Date.now();
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
    <html lang="en" className="h-full overflow-hidden">
      <body className="m-0 p-0 h-[100dvh] max-h-[100dvh] w-full bg-[#050508] text-white font-sans antialiased select-none overflow-hidden flex items-center justify-center">
        <div className="w-full h-full max-h-[100dvh] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[300px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
          
          <div className="w-full max-w-xl text-center flex flex-col items-center relative z-10 px-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Application Error
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mb-6 max-w-md mx-auto leading-relaxed">
              We encountered a system disruption. Please reload to restore connection.
            </p>

            {error?.message && (
              <div className="w-full max-w-md mb-6 p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl max-h-24 overflow-y-auto text-left">
                <p className="text-[11px] text-rose-300 font-mono break-words leading-relaxed">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 justify-center">
              <button
                type="button"
                onClick={handleReload}
                className="h-10 px-5 sm:px-6 rounded-xl bg-white hover:bg-zinc-200 active:scale-95 text-black font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
              >
                Reload Application
              </button>
              <a
                href="/home"
                className="h-10 px-5 sm:px-6 rounded-xl bg-[#1c1c1f] hover:bg-[#28282b] border border-white/10 text-zinc-300 hover:text-white font-semibold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center"
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
