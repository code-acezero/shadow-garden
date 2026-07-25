'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
            <p className="text-zinc-400 text-sm mb-8 max-w-xs leading-relaxed">
              A critical error occurred. Please try reloading the app.
            </p>

            <button
              onClick={() => reset()}
              className="py-2.5 px-6 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95 transition-all cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}