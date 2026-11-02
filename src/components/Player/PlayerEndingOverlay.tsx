'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PlayerEndingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onReplay?: () => void;
  animeTitle?: string;
  currentEpisodeNumber?: number | string;
  totalEpisodes?: number;
  status?: string;
  nextAiringEpisode?: {
    episode?: number;
    airingAt?: number;
    timeUntilAiring?: number;
    airingISOTimestamp?: string;
    airingTimestamp?: number;
  } | null;
}

export const PlayerEndingOverlay: React.FC<PlayerEndingOverlayProps> = ({
  isOpen,
  onClose,
  onReplay,
  animeTitle,
  currentEpisodeNumber,
  status = '',
  nextAiringEpisode,
}) => {
  // Determine whether anime is completed/finished vs ongoing
  const statusLower = (status || '').toLowerCase();
  const isFinished = 
    (statusLower.includes('finished') || 
     statusLower.includes('completed') || 
     statusLower.includes('ended') || 
     statusLower.includes('aired')) &&
    !nextAiringEpisode;

  // Target timestamp for next episode broadcast
  const targetTimestamp = useMemo(() => {
    if (!nextAiringEpisode) return null;
    if (nextAiringEpisode.airingISOTimestamp) {
      const parsed = new Date(nextAiringEpisode.airingISOTimestamp).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    if (nextAiringEpisode.airingAt) {
      return Number(nextAiringEpisode.airingAt) * 1000;
    }
    if (nextAiringEpisode.airingTimestamp) {
      return Number(nextAiringEpisode.airingTimestamp) * 1000;
    }
    if (nextAiringEpisode.timeUntilAiring) {
      return Date.now() + Number(nextAiringEpisode.timeUntilAiring) * 1000;
    }
    return null;
  }, [nextAiringEpisode]);

  // Live countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || isFinished || !targetTimestamp) {
      setTimeLeft(null);
      return;
    }

    const calcTime = () => {
      const now = Date.now();
      const diff = targetTimestamp - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isFinished, targetTimestamp]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{ 
            backgroundColor: 'rgba(5, 3, 14, 0.98)', 
            backdropFilter: 'blur(28px)', 
            WebkitBackdropFilter: 'blur(28px)' 
          }}
          className="absolute inset-0 z-[80] w-full h-full flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 select-none overflow-hidden"
        >
          {/* Cinematic radial glow & faded edges vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.16)_0%,_transparent_72%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_45%,_rgba(0,0,0,0.85)_100%)] pointer-events-none" />

          {/* Main Card Content */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center px-2 sm:px-6"
          >
            {isFinished ? (
              /* ─── SERIES FINALE / THE END ─── */
              <>
                <h2 className="font-lemon text-6xl sm:text-8xl md:text-9xl lg:text-[9.5rem] font-black tracking-[0.18em] sm:tracking-[0.25em] text-white uppercase mb-4 sm:mb-6 drop-shadow-[0_8px_48px_rgba(139,92,246,0.55)] leading-none select-none">
                  The End
                </h2>

                {animeTitle && (
                  <p className="text-zinc-300 text-xs sm:text-sm md:text-base font-mono tracking-[0.2em] uppercase max-w-3xl truncate px-4">
                    {animeTitle}
                  </p>
                )}

                <p className="text-zinc-500 text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase max-w-3xl mt-1.5 px-4">
                  Series Finale Completed
                </p>

                {/* Symmetrical Faded & Rounded Actions */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                  {onReplay && (
                    <button
                      onClick={onReplay}
                      className="w-28 sm:w-36 py-2.5 sm:py-3 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 hover:text-white font-medium text-xs sm:text-sm border border-purple-500/30 hover:border-purple-500/50 backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer text-center shadow-lg shadow-purple-950/40"
                    >
                      Replay
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-28 sm:w-36 py-2.5 sm:py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white font-medium text-xs sm:text-sm border border-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer text-center shadow-lg shadow-black/40"
                  >
                    Dismiss
                  </button>
                </div>
              </>
            ) : (
              /* ─── ONGOING ANIME / DIGITAL CLOCK COUNTDOWN ─── */
              <>
                {animeTitle && (
                  <h3 className="text-zinc-300 text-xs sm:text-sm md:text-base font-medium tracking-wider uppercase mb-1 max-w-2xl truncate px-4">
                    {animeTitle}
                  </h3>
                )}

                <p className="text-zinc-500 text-[10px] sm:text-xs font-mono tracking-widest uppercase mb-3 sm:mb-5">
                  Next episode premieres in
                </p>

                {timeLeft && !timeLeft.isExpired ? (
                  /* Big Wide Cinematic Digital Clock Display */
                  <div className="my-2 sm:my-5 w-full max-w-3xl mx-auto flex items-center justify-center gap-2 sm:gap-5 md:gap-8">
                    {/* Days */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <span className="font-mono text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tight tabular-nums drop-shadow-[0_4px_32px_rgba(139,92,246,0.4)] leading-none">
                        {String(timeLeft.days).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] sm:text-[11px] md:text-xs font-mono font-bold uppercase tracking-[0.25em] text-zinc-400 mt-2 sm:mt-3">
                        Days
                      </span>
                    </div>

                    <div className="flex items-center justify-center self-start pt-1 sm:pt-3 md:pt-4">
                      <span className="font-mono text-2xl sm:text-5xl md:text-6xl font-light text-purple-400/50 select-none">:</span>
                    </div>

                    {/* Hours */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <span className="font-mono text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tight tabular-nums drop-shadow-[0_4px_32px_rgba(139,92,246,0.4)] leading-none">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] sm:text-[11px] md:text-xs font-mono font-bold uppercase tracking-[0.25em] text-zinc-400 mt-2 sm:mt-3">
                        Hours
                      </span>
                    </div>

                    <div className="flex items-center justify-center self-start pt-1 sm:pt-3 md:pt-4">
                      <span className="font-mono text-2xl sm:text-5xl md:text-6xl font-light text-purple-400/50 select-none">:</span>
                    </div>

                    {/* Minutes */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <span className="font-mono text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tight tabular-nums drop-shadow-[0_4px_32px_rgba(139,92,246,0.4)] leading-none">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] sm:text-[11px] md:text-xs font-mono font-bold uppercase tracking-[0.25em] text-zinc-400 mt-2 sm:mt-3">
                        Mins
                      </span>
                    </div>

                    <div className="flex items-center justify-center self-start pt-1 sm:pt-3 md:pt-4">
                      <span className="font-mono text-2xl sm:text-5xl md:text-6xl font-light text-purple-400/50 select-none">:</span>
                    </div>

                    {/* Seconds */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <span className="font-mono text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-purple-400 tracking-tight tabular-nums drop-shadow-[0_4px_32px_rgba(168,85,247,0.55)] leading-none">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] sm:text-[11px] md:text-xs font-mono font-bold uppercase tracking-[0.25em] text-purple-300/90 mt-2 sm:mt-3">
                        Secs
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Broadcast Imminent or TBA state */
                  <div className="my-4 sm:my-6 py-4 px-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col items-center max-w-md mx-auto">
                    <span className="font-mono text-lg sm:text-2xl font-extrabold text-purple-300 uppercase tracking-wider mb-1">
                      {timeLeft?.isExpired ? 'Broadcast Imminent' : 'Airing Schedule TBA'}
                    </span>
                    <span className="text-zinc-400 text-xs sm:text-sm font-medium">
                      {timeLeft?.isExpired 
                        ? 'The new episode is scheduled to broadcast shortly.' 
                        : 'Official simulcast release timing will be updated soon.'}
                    </span>
                  </div>
                )}

                <p className="text-zinc-400 text-[10px] sm:text-xs font-mono tracking-[0.2em] uppercase max-w-2xl mt-2 sm:mt-3 px-4">
                  Episode {currentEpisodeNumber ? currentEpisodeNumber : ''} Concluded
                </p>

                {/* Symmetrical Faded & Rounded Actions */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                  {onReplay && (
                    <button
                      onClick={onReplay}
                      className="w-28 sm:w-36 py-2.5 sm:py-3 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 hover:text-white font-medium text-xs sm:text-sm border border-purple-500/30 hover:border-purple-500/50 backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer text-center shadow-lg shadow-purple-950/40"
                    >
                      Replay
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-28 sm:w-36 py-2.5 sm:py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white font-medium text-xs sm:text-sm border border-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer text-center shadow-lg shadow-black/40"
                  >
                    Dismiss
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlayerEndingOverlay;
