"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, ArrowLeft, 
  Layers, Heart, Share2, FastForward, ChevronUp, ChevronDown, 
  RotateCcw, Sparkles, AlertCircle, Loader2, Check
} from 'lucide-react';
import { ShortDramaDetail, ShortDramaEpisode } from '@/lib/shorts/types';
import EpisodeDrawerModal from './EpisodeDrawerModal';
import { 
  ATRAX_BUBBLY_SPRING, 
  ATRAX_CAPSULE_SPRING, 
  atraxSquishTapVariants, 
  atraxJellyWobbleVariants 
} from '@/lib/atraxMotion';
import { cn } from '@/lib/utils';

interface VerticalWatchFeedProps {
  drama: ShortDramaDetail;
  initialEpisode?: number;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 2];

export default function VerticalWatchFeed({
  drama,
  initialEpisode = 1
}: VerticalWatchFeedProps) {
  const router = useRouter();

  const [currentEpNum, setCurrentEpNum] = useState<number>(initialEpisode);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeedIdx, setPlaybackSpeedIdx] = useState<number>(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [showShareToast, setShowShareToast] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  // Find active episode data
  const currentEpisode: ShortDramaEpisode = drama.episodes.find(
    e => e.episodeNumber === currentEpNum
  ) || drama.episodes[0] || {
    episodeNumber: 1,
    title: 'Episode 1',
    streamUrl: '',
    type: 'hls'
  };

  // Check localStorage for like state
  useEffect(() => {
    try {
      const likedStr = localStorage.getItem('shadow_liked_shorts') || '[]';
      const likedList: string[] = JSON.parse(likedStr);
      setIsLiked(likedList.includes(drama.id));
    } catch {
      // Ignore storage errors
    }
  }, [drama.id]);

  // Toggle Like
  const toggleLike = () => {
    setIsLiked(prev => {
      const next = !prev;
      try {
        const likedStr = localStorage.getItem('shadow_liked_shorts') || '[]';
        let likedList: string[] = JSON.parse(likedStr);
        if (next) {
          if (!likedList.includes(drama.id)) likedList.push(drama.id);
        } else {
          likedList = likedList.filter(id => id !== drama.id);
        }
        localStorage.setItem('shadow_liked_shorts', JSON.stringify(likedList));
      } catch {}
      return next;
    });
  };

  // Video Streaming Setup (HLS.js + Native fallback)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentEpisode.streamUrl) return;

    setIsLoadingVideo(true);
    setVideoError(null);
    setProgress(0);

    const streamUrl = currentEpisode.streamUrl;
    const isHls = streamUrl.includes('.m3u8');

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoadingVideo(false);
        video.play().catch(() => {
          // Auto-play was prevented by browser policy (mute and retry)
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => setIsPlaying(false));
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setVideoError('Video stream unavailable. Retrying...');
              hls.destroy();
              break;
          }
        }
      });
    } else {
      // Native MP4 or Safari HLS
      video.src = streamUrl;
      video.load();
      video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => setIsPlaying(false));
      });
      setIsLoadingVideo(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentEpisode.streamUrl]);

  // Speed sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = SPEED_OPTIONS[playbackSpeedIdx];
    }
  }, [playbackSpeedIdx]);

  // Navigate next / prev episodes
  const goToNextEpisode = useCallback(() => {
    if (currentEpNum < drama.totalEpisodes) {
      const nextEp = currentEpNum + 1;
      setCurrentEpNum(nextEp);
      router.replace(`/shorts/watch?id=${encodeURIComponent(drama.id)}&ep=${nextEp}`, { scroll: false });
    }
  }, [currentEpNum, drama.totalEpisodes, drama.id, router]);

  const goToPrevEpisode = useCallback(() => {
    if (currentEpNum > 1) {
      const prevEp = currentEpNum - 1;
      setCurrentEpNum(prevEp);
      router.replace(`/shorts/watch?id=${encodeURIComponent(drama.id)}&ep=${prevEp}`, { scroll: false });
    }
  }, [currentEpNum, drama.id, router]);

  const selectEpisode = (epNum: number) => {
    setCurrentEpNum(epNum);
    router.replace(`/shorts/watch?id=${encodeURIComponent(drama.id)}&ep=${epNum}`, { scroll: false });
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDrawerOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goToNextEpisode();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrevEpisode();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextEpisode, goToPrevEpisode, isDrawerOpen]);

  // Touch Swipe Handlers for vertical snap
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    // Swipe threshold 50px
    if (diff > 50) {
      goToNextEpisode(); // Swipe Up -> Next Episode
    } else if (diff < -50) {
      goToPrevEpisode(); // Swipe Down -> Prev Episode
    }
  };

  // Play / Pause toggle
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Mute toggle
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // Speed cycle
  const cycleSpeed = () => {
    setPlaybackSpeedIdx(prev => (prev + 1) % SPEED_OPTIONS.length);
  };

  // Share handler
  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${drama.title} - Ep ${currentEpNum}`,
          text: `Watch ${drama.title} Episode ${currentEpNum} in vertical HD on Shadow Garden!`,
          url: window.location.href
        });
      } catch {
        // Ignored or cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2500);
      } catch {}
    }
  };

  // Video Time Update
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setProgress(video.currentTime);
    setDuration(video.duration || 0);
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[100dvh] bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* Desktop Ambient Background Glow */}
      <div 
        className="hidden md:block absolute inset-0 z-0 bg-cover bg-center filter blur-3xl opacity-30 scale-125 transition-all duration-700 pointer-events-none"
        style={{ backgroundImage: `url(${drama.cover})` }}
      />

      {/* 9:16 Vertical Video Frame */}
      <div className="relative w-full h-full md:h-[92vh] md:w-auto md:aspect-[9/16] md:max-w-[460px] bg-slate-950 md:rounded-[36px] overflow-hidden md:border md:border-white/10 md:shadow-2xl md:shadow-black/80 z-10 flex flex-col">
        
        {/* Top Header Floating Controls */}
        <div className="absolute top-0 inset-x-0 p-4 pt-5 z-30 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
          {/* Back button */}
          <motion.button
            variants={atraxSquishTapVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => router.push('/shorts')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 text-white text-xs font-semibold hover:bg-black/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Shorts</span>
          </motion.button>

          {/* Episode Badge & Language Pill */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/25 border border-primary/40 text-primary backdrop-blur-md font-mono">
              Ep {currentEpNum} / {drama.totalEpisodes}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/40 border border-white/15 text-slate-200 backdrop-blur-md">
              {drama.language}
            </span>
          </div>
        </div>

        {/* Video Element */}
        <div 
          onClick={togglePlayPause}
          className="relative w-full h-full flex items-center justify-center cursor-pointer bg-black"
        >
          <video
            ref={videoRef}
            playsInline
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={goToNextEpisode}
            onWaiting={() => setIsLoadingVideo(true)}
            onPlaying={() => {
              setIsLoadingVideo(false);
              setIsPlaying(true);
            }}
            className="w-full h-full object-cover"
          />

          {/* Loading Spinner */}
          {isLoadingVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20 pointer-events-none">
              <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {/* Big Centered Play/Pause Icon Indicator */}
          <AnimatePresence>
            {!isPlaying && !isLoadingVideo && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={ATRAX_BUBBLY_SPRING}
                className="absolute w-20 h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center pointer-events-none z-20 shadow-2xl"
              >
                <Play className="w-8 h-8 ml-1 fill-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner */}
          {videoError && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-slate-900/90 border border-red-500/30 text-center z-30">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-white font-medium">{videoError}</p>
              <button
                onClick={() => selectEpisode(currentEpNum)}
                className="mt-3 px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold"
              >
                Reload Stream
              </button>
            </div>
          )}
        </div>

        {/* Right Floating Action Bar (TikTok / Reels style) */}
        <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-3.5 pointer-events-auto">
          {/* Episode List Button */}
          <motion.button
            variants={atraxSquishTapVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => setIsDrawerOpen(true)}
            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white flex flex-col items-center justify-center shadow-lg hover:border-primary/50 transition-colors"
          >
            <Layers className="w-5 h-5 text-primary" />
            <span className="text-[9px] font-mono leading-none mt-0.5">
              {currentEpNum}
            </span>
          </motion.button>

          {/* Like Heart Button */}
          <motion.button
            variants={atraxJellyWobbleVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={toggleLike}
            className={cn(
              "w-12 h-12 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-lg transition-colors",
              isLiked 
                ? "bg-rose-500/30 border-rose-500 text-rose-500 shadow-rose-500/30" 
                : "bg-black/60 border-white/20 text-white hover:text-rose-400"
            )}
          >
            <Heart className={cn("w-5 h-5", isLiked && "fill-rose-500")} />
          </motion.button>

          {/* Speed Button */}
          <motion.button
            variants={atraxSquishTapVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={cycleSpeed}
            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white flex flex-col items-center justify-center shadow-lg hover:border-white/40 transition-colors font-mono font-bold text-xs"
          >
            <span>{SPEED_OPTIONS[playbackSpeedIdx]}x</span>
            <span className="text-[8px] text-slate-400 font-sans leading-none">Speed</span>
          </motion.button>

          {/* Mute Button */}
          <motion.button
            variants={atraxSquishTapVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={toggleMute}
            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-lg hover:border-white/40 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-amber-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </motion.button>

          {/* Share Button */}
          <motion.button
            variants={atraxSquishTapVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={handleShare}
            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-lg hover:border-white/40 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Desktop Quick Next / Prev Arrows */}
        <div className="hidden md:flex absolute right-16 top-1/2 -translate-y-1/2 flex-col gap-2 z-30">
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            disabled={currentEpNum <= 1}
            onClick={goToPrevEpisode}
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:bg-black/80"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, y: 2 }}
            whileTap={{ scale: 0.95 }}
            disabled={currentEpNum >= drama.totalEpisodes}
            onClick={goToNextEpisode}
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:bg-black/80"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Bottom Metadata Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-4 pb-5 z-20 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none">
          <div className="pr-16 flex flex-col gap-1">
            {/* Title */}
            <h1 className="text-sm md:text-base font-extrabold text-white line-clamp-1 drop-shadow-md">
              {drama.title}
            </h1>

            {/* Current Episode Title */}
            <p className="text-xs text-primary font-semibold flex items-center gap-1.5">
              <span>{currentEpisode.title}</span>
              <span className="text-slate-400 font-normal">
                ({currentEpNum}/{drama.totalEpisodes})
              </span>
            </p>

            {/* Synopsis snippet */}
            <p className="text-[11px] text-slate-300/90 line-clamp-2 leading-relaxed mt-0.5">
              {drama.description}
            </p>
          </div>

          {/* Thin Scrubbing Progress Bar */}
          <div className="w-full h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-150"
              style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Episode Drawer Modal */}
      <EpisodeDrawerModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={drama.title}
        totalEpisodes={drama.totalEpisodes}
        episodes={drama.episodes}
        currentEpisode={currentEpNum}
        onSelectEpisode={selectEpisode}
      />

      {/* Share Toast Notification */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-10 z-50 px-4 py-2 rounded-full bg-slate-900/90 border border-primary/40 text-white text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-xl"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
