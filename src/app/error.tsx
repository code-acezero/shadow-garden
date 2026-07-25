'use client';

import React, { useEffect } from 'react';
import { RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#050508] text-white select-none">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        {/* Minimal Error Badge */}
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400/90 bg-purple-950/50 border border-purple-500/30 px-3 py-1 rounded-full mb-4">
          Anomaly
        </span>

        {/* Clean Heading */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-zinc-400 text-sm mb-8 max-w-xs leading-relaxed">
          An unexpected error occurred while loading this page.
        </p>

        {/* Clean Action Buttons */}
        <div className="flex items-center gap-3 w-full justify-center">
          <button
            onClick={() => reset()}
            className="py-2.5 px-6 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <RotateCcw size={14} />
            <span>Try again</span>
          </button>

          <Link
            href="/"
            className="py-2.5 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-semibold text-xs tracking-wide transition-all cursor-pointer flex items-center gap-2"
          >
            <Home size={14} />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}