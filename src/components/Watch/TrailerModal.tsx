"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Film, ExternalLink, Play, AlertCircle, Loader2 } from 'lucide-react';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  trailerKey?: string | null;
  trailerUrl?: string | null;
  trailer?: { id?: string; key?: string; site?: string; url?: string; embedUrl?: string } | null;
  mediaId?: string;
}

export default function TrailerModal({
  isOpen,
  onClose,
  title,
  trailerKey,
  trailerUrl,
  trailer,
  mediaId
}: TrailerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setActiveKey(null);
      setIsSearching(false);
      setSearchFailed(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    // 1. Check if key is already provided
    let initialKey: string | null = trailerKey || trailer?.key || null;
    if (!initialKey && trailer?.id && typeof trailer.id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(trailer.id)) {
      initialKey = trailer.id;
    }
    if (!initialKey && trailer?.url) {
      const vidMatch = trailer.url.match(/(?:watch\?v=|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (vidMatch) initialKey = vidMatch[1];
    }
    if (!initialKey && trailer?.embedUrl) {
      const vidMatch = trailer.embedUrl.match(/(?:watch\?v=|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (vidMatch) initialKey = vidMatch[1];
    }
    if (!initialKey && trailerUrl) {
      const vidMatch = trailerUrl.match(/(?:watch\?v=|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (vidMatch) initialKey = vidMatch[1];
    }

    if (initialKey) {
      setActiveKey(initialKey);
      setIsSearching(false);
    } else {
      // 2. Fetch trailer on-demand from our API endpoint
      setIsSearching(true);
      setSearchFailed(false);
      const queryParam = title ? `q=${encodeURIComponent(title)}` : '';
      const idParam = mediaId ? `id=${encodeURIComponent(mediaId)}` : '';
      const q = [queryParam, idParam].filter(Boolean).join('&');

      fetch(`/api/drama/trailer?${q}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.key) {
            setActiveKey(data.key);
          } else {
            setSearchFailed(true);
          }
        })
        .catch(() => {
          setSearchFailed(true);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, trailerKey, trailer, trailerUrl, title, mediaId]);

  if (!isOpen || !mounted) return null;

  const ytWatchUrl = activeKey 
    ? `https://www.youtube.com/watch?v=${activeKey}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`;

  const embedSrc = activeKey 
    ? `https://www.youtube.com/embed/${activeKey}?autoplay=1&rel=0&enablejsapi=1`
    : '';

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-[#090d1a] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_10px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 bg-white/[0.03] border-b border-white/[0.08]">
          <div className="flex items-center gap-2 min-w-0 pr-4">
            <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 shrink-0">
              <Film size={14} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-lemon block truncate">
                Official Trailer
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={ytWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-rose-600/20 text-zinc-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
              title="Watch directly on YouTube"
            >
              <span>YouTube</span>
              <ExternalLink size={11} />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all active:scale-90 shrink-0"
              aria-label="Close trailer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Video Player Embed (16:9 ratio) */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {embedSrc ? (
            <iframe
              src={embedSrc}
              title={`${title} Trailer`}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : isSearching ? (
            <div className="flex flex-col items-center gap-3 text-cyan-400">
              <Loader2 size={32} className="animate-spin text-cyan-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-lemon">
                Connecting to Official Trailer...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-6 text-center max-w-md">
              <div className="p-3 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                <Play size={24} />
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-lemon">
                Trailer Available on YouTube
              </h4>
              <p className="text-xs text-zinc-400">
                Direct embed preview is unavailable. You can watch the official trailer directly on YouTube.
              </p>
              <a
                href={ytWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                <Play size={13} fill="currentColor" />
                <span>Watch on YouTube</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
