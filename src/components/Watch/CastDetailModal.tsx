"use client";

import React, { useEffect } from 'react';
import { X, Sparkles, User, Mic, Star, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CastModalData {
  name: string;
  character?: string | null;
  role?: string | null;
  image?: string | null;
  profileLarge?: string | null;
  department?: string | null;
  popularity?: number | string | null;
  // For Anime Character + Voice Actor support
  voiceActor?: {
    name: string;
    poster?: string | null;
    language?: string | null;
  } | null;
}

interface CastDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CastModalData | null;
}

export default function CastDetailModal({ isOpen, onClose, data }: CastDetailModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const isAnimeCharacter = Boolean(data.voiceActor) || data.department === 'Character';
  const mainImage = data.profileLarge || data.image || '/images/no-avatar.png';

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#0b1021] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col gap-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-cyan-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all active:scale-90"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {/* Modal Header Badge */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/20">
            {isAnimeCharacter ? <Sparkles size={14} /> : <User size={14} />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-lemon">
            {isAnimeCharacter ? 'Character & Voice Cast Profile' : 'Cast & Actor Profile'}
          </span>
        </div>

        {/* Main Profile Showcase */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 mt-1">
          {/* Big Photo with Glow */}
          <div className="relative shrink-0 w-32 h-44 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border border-white/15 bg-zinc-900 shadow-2xl group">
            <img 
              src={mainImage} 
              alt={data.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { e.currentTarget.src = '/images/no-avatar.png'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Details Column */}
          <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/25">
              {data.role || (isAnimeCharacter ? 'Character' : 'Leading Cast')}
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-white font-lemon leading-tight mt-0.5">
              {data.name}
            </h3>

            {data.character && (
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Character Played
                </span>
                <p className="text-sm font-black text-cyan-300">
                  {data.character}
                </p>
              </div>
            )}

            {data.department && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                <Film size={12} className="text-zinc-500" />
                <span>{data.department}</span>
              </div>
            )}

            {data.popularity !== undefined && data.popularity !== null && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold mt-0.5">
                <Star size={12} fill="currentColor" />
                <span>{isAnimeCharacter ? 'Favorites' : 'Popularity Index'}: {typeof data.popularity === 'number' ? data.popularity.toLocaleString() : data.popularity}</span>
              </div>
            )}
          </div>
        </div>

        {/* Voice Actor Section (For Anime Characters) */}
        {data.voiceActor && (
          <div className="mt-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3.5">
            <div className="w-14 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-900 shadow-md">
              <img 
                src={data.voiceActor.poster || '/images/no-avatar.png'} 
                alt={data.voiceActor.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = '/images/no-avatar.png'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                <Mic size={10} className="text-purple-400" />
                <span>Voice Actor ({data.voiceActor.language || 'Japanese'})</span>
              </span>
              <h4 className="text-sm font-black text-white truncate">
                {data.voiceActor.name}
              </h4>
            </div>
          </div>
        )}

        {/* Footer Close */}
        <div className="pt-2 border-t border-white/[0.06] flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}
