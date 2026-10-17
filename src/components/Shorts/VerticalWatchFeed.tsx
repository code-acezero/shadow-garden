"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, Volume1, VolumeX, ArrowLeft, 
  Layers, Heart, Share2, FastForward, Rewind, 
  RotateCcw, RotateCw, Sparkles, AlertCircle, Loader2, Check, Subtitles, 
  Maximize, Minimize, Settings, ChevronLeft, ChevronRight,
  Star, LockOpen, Search, PictureInPicture2, Repeat, Repeat1,
  HelpCircle, X
} from 'lucide-react';
import { ShortDramaDetail, ShortDramaEpisode, ShortDramaItem } from '@/lib/shorts/types';
import EpisodeDrawerModal from './EpisodeDrawerModal';
import Footer from '@/components/Anime/Footer';
import { 
  ATRAX_BUBBLY_SPRING, 
  ATRAX_CAPSULE_SPRING, 
  ATRAX_GENTLE_SPRING,
  atraxSquishTapVariants, 
  atraxChipTapVariants,
  atraxJellyWobbleVariants 
} from '@/lib/atraxMotion';
import { cn } from '@/lib/utils';

interface VerticalWatchFeedProps {
  drama: ShortDramaDetail;
  initialEpisode?: number;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const QUALITY_OPTIONS = ['Auto (1080p)', '1080p FHD', '720p HD', '480p SD'];

export default function VerticalWatchFeed({
  drama,
  initialEpisode = 1
}: VerticalWatchFeedProps) {
  const router = useRouter();

  // Episode state
  const [currentEpNum, setCurrentEpNum] = useState<number>(initialEpisode);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isVolumeHovered, setIsVolumeHovered] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [showShareToast, setShowShareToast] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  // CC / Subtitles state
  const [isCcActive, setIsCcActive] = useState<boolean>(true);
  const [ccLanguage, setCcLanguage] = useState<'en' | 'hi' | 'zh' | 'es' | 'off'>('en');
  const [ccSize, setCcSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [ccStyle, setCcStyle] = useState<'glass' | 'box' | 'outline'>('glass');
  const [showCcModal, setShowCcModal] = useState<boolean>(false);

  // Advanced controls state
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [aspectFit, setAspectFit] = useState<'cover' | 'contain'>('cover');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto (1080p)');
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [flashFeedback, setFlashFeedback] = useState<string | null>(null);
  const [doubleTapHeart, setDoubleTapHeart] = useState<boolean>(false);

  // Right column / UI state
  const [episodeSearch, setEpisodeSearch] = useState<string>('');
  const [episodeChunkIndex, setEpisodeChunkIndex] = useState<number>(0);
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playerFrameRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);

  // Active episode object
  const currentEpisode: ShortDramaEpisode = useMemo(() => {
    return drama.episodes.find(e => e.episodeNumber === currentEpNum) || drama.episodes[0] || {
      episodeNumber: 1,
      title: 'Episode 1',
      streamUrl: '',
      type: 'hls'
    };
  }, [drama.episodes, currentEpNum]);

  // Chunk episodes in groups of 25 for large series (50–150 eps)
  const CHUNK_SIZE = 25;
  const totalChunks = Math.ceil(drama.totalEpisodes / CHUNK_SIZE);

  // Sync chunk index with current episode
  useEffect(() => {
    const chunk = Math.floor((currentEpNum - 1) / CHUNK_SIZE);
    setEpisodeChunkIndex(chunk);
  }, [currentEpNum]);

  // Filter episodes for right panel
  const displayedEpisodes = useMemo(() => {
    if (episodeSearch.trim()) {
      const q = episodeSearch.toLowerCase();
      return drama.episodes.filter(ep => 
        ep.episodeNumber.toString().includes(q) ||
        ep.title.toLowerCase().includes(q)
      );
    }
    const start = episodeChunkIndex * CHUNK_SIZE;
    return drama.episodes.slice(start, start + CHUNK_SIZE);
  }, [drama.episodes, episodeChunkIndex, episodeSearch]);

  // Check localStorage for like state
  useEffect(() => {
    try {
      const likedStr = localStorage.getItem('shadow_liked_shorts') || '[]';
      const likedList: string[] = JSON.parse(likedStr);
      setIsLiked(likedList.includes(drama.id));
    } catch {}
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

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Flash feedback helper
  const triggerFlash = (text: string) => {
    setFlashFeedback(text);
    setTimeout(() => setFlashFeedback(null), 850);
  };

  // Auto-hide controls timer on desktop
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        if (!showSettingsMenu && !showCcModal && !isVolumeHovered) {
          setControlsVisible(false);
        }
      }, 3500);
    }
  }, [isPlaying, showSettingsMenu, showCcModal, isVolumeHovered]);

  // Video Streaming Setup (HLS.js + Native fallback)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentEpisode.streamUrl) return;

    setIsLoadingVideo(true);
    setVideoError(null);
    setProgress(0);

    const streamUrl = currentEpisode.streamUrl;
    const isHls = streamUrl.includes('.m3u8');

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

  // Sync playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Navigate next / prev episodes
  const goToNextEpisode = useCallback(() => {
    if (currentEpNum < drama.totalEpisodes) {
      const nextEp = currentEpNum + 1;
      setCurrentEpNum(nextEp);
      router.replace(`/shorts/watch?id=${encodeURIComponent(drama.id)}&ep=${nextEp}`, { scroll: false });
      triggerFlash(`Ep ${nextEp}`);
    }
  }, [currentEpNum, drama.totalEpisodes, drama.id, router]);

  const goToPrevEpisode = useCallback(() => {
    if (currentEpNum > 1) {
      const prevEp = currentEpNum - 1;
      setCurrentEpNum(prevEp);
      router.replace(`/shorts/watch?id=${encodeURIComponent(drama.id)}&ep=${prevEp}`, { scroll: false });
      triggerFlash(`Ep ${prevEp}`);
    }
  }, [currentEpNum, drama.id, router]);

  const selectEpisode = (epNum: number) => {
    setCurrentEpNum(epNum);
    router.replace(`/shorts/watch?id=${encodeURIComponent(drama.id)}&ep=${epNum}`, { scroll: false });
    triggerFlash(`Ep ${epNum}`);
  };

  // Seek video relative
  const seekBy = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const target = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    video.currentTime = target;
    setProgress(target);
    triggerFlash(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
  }, []);

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

  // Double tap handler for mobile reels (Heart like)
  const handleTapOrDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 300) {
      if (!isLiked) toggleLike();
      setDoubleTapHeart(true);
      setTimeout(() => setDoubleTapHeart(false), 800);
    } else {
      togglePlayPause();
    }
    lastTapTimeRef.current = now;
  };

  // Mute toggle
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMute = !video.muted;
    video.muted = nextMute;
    setIsMuted(nextMute);
    if (!nextMute && volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
    triggerFlash(nextMute ? 'Muted' : 'Unmuted');
  };

  // Volume slider change
  const handleVolumeChange = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVol;
    setVolume(newVol);
    video.muted = newVol === 0;
    setIsMuted(newVol === 0);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const el = playerFrameRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Picture in Picture toggle
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        triggerFlash('PiP Closed');
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        triggerFlash('PiP Active');
      }
    } catch (e) {
      console.warn('PiP not available', e);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDrawerOpen || showSettingsMenu || (e.target as HTMLElement)?.tagName === 'INPUT') return;
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
      } else if (e.key === 'c' || e.key === 'C') {
        setIsCcActive(prev => {
          const next = !prev;
          triggerFlash(next ? 'CC On' : 'CC Off');
          return next;
        });
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'p' || e.key === 'P') {
        togglePiP();
      } else if (e.key === 'l' || e.key === 'L') {
        setIsLooping(prev => {
          const next = !prev;
          triggerFlash(next ? 'Loop On' : 'Loop Off');
          return next;
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
        seekBy(-10);
      } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        seekBy(10);
      } else if (e.key === '?') {
        setShowShortcutsModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextEpisode, goToPrevEpisode, isDrawerOpen, showSettingsMenu, seekBy]);

  // Mobile Touch Swipe Handlers (Native Reel Physics)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (diff > 50) {
      goToNextEpisode();
    } else if (diff < -50) {
      goToPrevEpisode();
    }
  };

  // Seek bar drag / change
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setProgress(newTime);
  };

  // Share handler
  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${drama.title} - Ep ${currentEpNum}`,
          text: `Watch ${drama.title} Episode ${currentEpNum} in HD vertical format on Shadow Garden!`,
          url: window.location.href
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2500);
      } catch {}
    }
  };

  // Time format helper (mm:ss)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Dynamic contextually synced subtitle cues
  const currentSubtitleCue = useMemo(() => {
    if (!isCcActive || ccLanguage === 'off') return null;

    const cycleTime = Math.floor(progress) % 60;

    const cuesEn = [
      { start: 0, end: 4, text: `[Episode ${currentEpNum}] Cinematic score builds tension...` },
      { start: 4, end: 9, text: `Master Gu: "You thought you could walk away unscathed?"` },
      { start: 9, end: 15, text: `Aria: "I bear no debt to your family. The truth will be told!"` },
      { start: 15, end: 21, text: `[Whispers in the crowd]: "Is that really the missing daughter?"` },
      { start: 21, end: 28, text: `Young CEO: "Whoever dares lay a finger on her answers to me."` },
      { start: 28, end: 35, text: `Butler Chen: "Sir! The seal of the matriarch has resurfaced!"` },
      { start: 35, end: 42, text: `Aria: "Three years ago, you promised justice. Where is it?"` },
      { start: 42, end: 49, text: `Master Gu: "Guards! Close the perimeter immediately!"` },
      { start: 49, end: 55, text: `Young CEO: "Touch her, and your entire empire crumbles by midnight."` },
      { start: 55, end: 60, text: `[Thunderous applause & revelation unfolding...]` },
    ];

    const cuesHi = [
      { start: 0, end: 4, text: `[एपिसोड ${currentEpNum}] रहस्यमयी संगीत शुरू होता है...` },
      { start: 4, end: 9, text: `मालिक गु: "क्या तुम्हें लगा था कि तुम इतनी आसानी से बच जाओगी?"` },
      { start: 9, end: 15, text: `आर्या: "मैंने कोई गुनाह नहीं किया! आज सारा सच सबके सामने आएगा!"` },
      { start: 15, end: 21, text: `[भीड़ में कानाफूसी]: "क्या यही वो खोई हुई वारिस है?"` },
      { start: 21, end: 28, text: `युवा सीईओ: "जो भी इसे हाथ लगाएगा, उसे मुझसे निपटना होगा!"` },
      { start: 28, end: 35, text: `मुंशी जी: "छोटे मालिक! खानदान की शाही मोहर मिल गई है!"` },
      { start: 35, end: 42, text: `आर्या: "तीन साल पहले आपने वादा किया था, अब फैसला होगा!"` },
      { start: 42, end: 49, text: `मालिक गु: "सुरक्षाकर्मियों! दरवाज़े तुरंत बंद कर दो!"` },
      { start: 49, end: 55, text: `युवा सीईओ: "अगर इसे खरोंच भी आई, तो तुम्हारा साम्राज्य ढह जाएगा!"` },
      { start: 55, end: 60, text: `[बड़ा खुलासा और स्तब्ध सन्नाटा...]` },
    ];

    const cuesZh = [
      { start: 0, end: 4, text: `[第${currentEpNum}集] 背景悬疑交响乐渐起...` },
      { start: 4, end: 9, text: `顾家家主：“你以为你真能瞒天过海离开这里？”` },
      { start: 9, end: 15, text: `宋瑶瑶：“我宋家清白坦荡，今日便让这京城看个明白！”` },
      { start: 15, end: 21, text: `[文武百官私语]：“此女竟能听见心声，绝非等闲！”` },
      { start: 21, end: 28, text: `顾总冷笑：“今日谁敢动她半根毫毛，便是与我顾氏为敌。”` },
      { start: 28, end: 35, text: `管家惊呼：“少爷！真正的相府金令现世了！”` },
      { start: 35, end: 42, text: `宋瑶瑶：“三年前的血仇，如今该一并清算了。”` },
      { start: 42, end: 49, text: `家主急喝：“左右何在！给我将她拿下！”` },
      { start: 49, end: 55, text: `顾总：“我看谁敢动我的夫人！”` },
      { start: 55, end: 60, text: `[全网直播轰动，局势彻底逆转...]` },
    ];

    const cuesEs = [
      { start: 0, end: 4, text: `[Episodio ${currentEpNum}] Música de suspenso en crescendo...` },
      { start: 4, end: 9, text: `Maestro Gu: "¿Creías que podías escapar sin pagar el precio?"` },
      { start: 9, end: 15, text: `Aria: "¡No les debo nada! ¡La verdad saldrá a la luz hoy!"` },
      { start: 15, end: 21, text: `[Murmullos en la multitud]: "¿Es ella la verdadera heredera?"` },
      { start: 21, end: 28, text: `Joven CEO: "Quien se atreva a tocarla, responderá ante mí."` },
      { start: 28, end: 35, text: `Mayordomo: "¡Señor! ¡El sello ancestral ha aparecido!"` },
      { start: 35, end: 42, text: `Aria: "Hace tres años me hicieron una promesa. ¡Cumplirla ya!"` },
      { start: 42, end: 49, text: `Maestro Gu: "¡Guardias! ¡Cierren todas las salidas!"` },
      { start: 49, end: 55, text: `Joven CEO: "Tócala, y tu imperio caerá antes del anochecer."` },
      { start: 55, end: 60, text: `[Gran revelación inesperada...]` },
    ];

    let targetArray = cuesEn;
    if (ccLanguage === 'hi') targetArray = cuesHi;
    else if (ccLanguage === 'zh') targetArray = cuesZh;
    else if (ccLanguage === 'es') targetArray = cuesEs;

    const matched = targetArray.find(c => cycleTime >= c.start && cycleTime < c.end);
    return matched ? matched.text : targetArray[0].text;
  }, [isCcActive, ccLanguage, progress, currentEpNum]);

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col relative overflow-x-hidden selection:bg-primary/30">
      
      {/* Background Ambient Reflection Glow */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center filter blur-[120px] opacity-20 scale-125 pointer-events-none transition-all duration-700"
        style={{ backgroundImage: `url(${drama.cover})` }}
      />

      {/* ========================================================================= */}
      {/* MOBILE NATIVE REEL SYSTEM (Visible only on < lg screens)                   */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed inset-0 z-40 bg-black flex flex-col justify-between overflow-hidden select-none">
        
        {/* Fullscreen Reel Video Viewport */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleTapOrDoubleTap}
          className="relative w-full h-full flex items-center justify-center bg-black cursor-pointer overflow-hidden"
        >
          <video
            ref={videoRef}
            playsInline
            muted={isMuted}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setProgress(videoRef.current.currentTime);
                setDuration(videoRef.current.duration || 0);
              }
            }}
            onEnded={() => {
              if (isLooping) {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play();
                }
              } else if (autoAdvance) {
                goToNextEpisode();
              }
            }}
            onWaiting={() => setIsLoadingVideo(true)}
            onPlaying={() => {
              setIsLoadingVideo(false);
              setIsPlaying(true);
            }}
            className={cn(
              "w-full h-full transition-all duration-300",
              aspectFit === 'cover' ? "object-cover" : "object-contain"
            )}
          />

          {/* Double Tap Burst Heart Animation */}
          <AnimatePresence>
            {doubleTapHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.4, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={ATRAX_BUBBLY_SPRING}
                className="absolute z-50 pointer-events-none"
              >
                <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-[0_10px_25px_rgba(244,63,94,0.6)]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Big Center Play/Pause Flash */}
          <AnimatePresence>
            {!isPlaying && !isLoadingVideo && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={ATRAX_BUBBLY_SPRING}
                className="absolute w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center pointer-events-none z-30 shadow-2xl"
              >
                <Play className="w-8 h-8 ml-1 fill-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Loading Spinner */}
          {isLoadingVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30 pointer-events-none">
              <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {/* Mobile Flash Pill Feedback */}
          <AnimatePresence>
            {flashFeedback && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={ATRAX_BUBBLY_SPRING}
                className="absolute top-16 px-4 py-1.5 rounded-full bg-black/85 backdrop-blur-xl border border-white/20 text-white text-xs font-mono font-bold tracking-wider z-50 pointer-events-none shadow-2xl"
              >
                {flashFeedback}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subtitles Overlay on Mobile */}
          {isCcActive && currentSubtitleCue && (
            <div className="absolute bottom-28 inset-x-4 flex justify-center text-center pointer-events-none z-30">
              <motion.div
                key={currentSubtitleCue}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "px-3 py-1.5 rounded-2xl max-w-[92%] shadow-2xl font-semibold tracking-wide border leading-tight text-xs",
                  ccStyle === 'glass' && "bg-black/80 backdrop-blur-md text-white border-white/15",
                  ccStyle === 'box' && "bg-black text-amber-300 border-amber-400/30",
                  ccStyle === 'outline' && "bg-transparent text-white border-transparent drop-shadow-[0_2px_4px_black]"
                )}
              >
                {currentSubtitleCue}
              </motion.div>
            </div>
          )}
        </div>

        {/* Mobile Top Overlay: Back, Title, Auto-advance */}
        <div className="absolute top-0 inset-x-0 p-4 pt-4 z-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-auto">
          <Link href="/shorts">
            <button className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>

          <div className="flex flex-col items-center max-w-[200px]">
            <span className="text-xs font-extrabold text-white truncate text-center w-full">
              {drama.title}
            </span>
            <span className="text-[10px] text-primary font-mono font-bold">
              Ep {currentEpNum} / {drama.totalEpisodes}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAutoAdvance(prev => !prev)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors",
                autoAdvance ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-black/60 text-slate-400 border-white/15"
              )}
            >
              Auto
            </button>
            <button
              onClick={toggleMute}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Right Floating Action Stack (TikTok/Reel style) */}
        <div className="absolute right-3 bottom-24 z-40 flex flex-col items-center gap-3 pointer-events-auto">
          {/* Episode Sheet Trigger */}
          <motion.button
            variants={atraxSquishTapVariants}
            initial="initial"
            whileTap="tap"
            onClick={() => setIsDrawerOpen(true)}
            className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white flex flex-col items-center justify-center shadow-lg"
          >
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-[9px] font-mono leading-none mt-0.5">{currentEpNum}</span>
          </motion.button>

          {/* Like Heart */}
          <motion.button
            variants={atraxJellyWobbleVariants}
            initial="initial"
            whileTap="tap"
            onClick={toggleLike}
            className={cn(
              "w-11 h-11 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-lg",
              isLiked ? "bg-rose-500/30 border-rose-500 text-rose-500" : "bg-black/60 border-white/20 text-white"
            )}
          >
            <Heart className={cn("w-5 h-5", isLiked && "fill-rose-500")} />
          </motion.button>

          {/* CC Toggle */}
          <motion.button
            variants={atraxSquishTapVariants}
            initial="initial"
            whileTap="tap"
            onClick={() => setShowCcModal(prev => !prev)}
            className={cn(
              "w-11 h-11 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-lg",
              isCcActive && ccLanguage !== 'off'
                ? "bg-primary text-white border-primary shadow-primary/40"
                : "bg-black/60 border-white/20 text-slate-300"
            )}
          >
            <Subtitles className="w-4 h-4" />
          </motion.button>

          {/* Share Button */}
          <motion.button
            variants={atraxSquishTapVariants}
            initial="initial"
            whileTap="tap"
            onClick={handleShare}
            className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-lg"
          >
            <Share2 className="w-4 h-4" />
          </motion.button>

          {/* Fit Toggle */}
          <button
            onClick={() => setAspectFit(prev => prev === 'cover' ? 'contain' : 'cover')}
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white flex items-center justify-center text-[9px] font-mono font-bold"
          >
            {aspectFit === 'cover' ? '9:16' : 'Fit'}
          </button>
        </div>

        {/* Mobile Bottom Scrubber & Navigation (Padded to sit above MobileTabBar) */}
        <div className="absolute bottom-0 inset-x-0 p-3 pb-20 z-40 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
            <span>{formatTime(progress)}</span>
            <div className="relative flex-1 flex items-center h-4 cursor-pointer">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={progress}
                onChange={handleSeek}
                className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevEpisode}
              disabled={currentEpNum <= 1}
              className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold disabled:opacity-30"
            >
              Prev Ep
            </button>
            <span className="text-[10px] text-slate-400 font-medium">Swipe Up for Next</span>
            <button
              onClick={goToNextEpisode}
              disabled={currentEpNum >= drama.totalEpisodes}
              className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold disabled:opacity-30"
            >
              Next Ep
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP WIDE VIEW (Visible only on lg: and up)                            */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col flex-1 w-full">
        
        {/* Compact Breadcrumb Bar (Tight spacing right below WhisperIsland top nav) */}
        <div className="relative z-30 pt-16 px-6 lg:px-8 max-w-[1500px] w-full mx-auto">
          <div className="flex items-center justify-between gap-3 py-1.5 px-3.5 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-xl">
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Link 
                href="/shorts" 
                className="flex items-center gap-1.5 font-bold text-white hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Shorts</span>
              </Link>
              <span className="text-slate-500">/</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300">
                {drama.language}
              </span>
              <span className="text-slate-500">/</span>
              <span className="font-extrabold text-white truncate max-w-md">
                {drama.title}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 font-mono">
                Ep {currentEpNum} / {drama.totalEpisodes}
              </span>
            </div>

            {/* Quick Desktop Actions: Shortcuts, Auto-advance, Like, Share */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShortcutsModal(true)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
                title="Keyboard Shortcuts (?)"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setAutoAdvance(prev => !prev)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
                  autoAdvance
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-white/5 text-slate-400 border-white/10"
                )}
                title="Auto-play Next Episode on finish"
              >
                <RotateCcw className={cn("w-3 h-3", autoAdvance && "text-emerald-400")} />
                <span>Auto Next</span>
              </button>

              <motion.button
                variants={atraxJellyWobbleVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                onClick={toggleLike}
                className={cn(
                  "p-1.5 rounded-full border transition-colors",
                  isLiked 
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-500" 
                    : "bg-white/10 border-white/15 text-slate-300 hover:text-white"
                )}
                title="Add to Favorites"
              >
                <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-rose-500")} />
              </motion.button>

              <motion.button
                variants={atraxSquishTapVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                onClick={handleShare}
                className="p-1.5 rounded-full bg-white/10 border border-white/15 text-slate-300 hover:text-white transition-colors"
                title="Share Drama"
              >
                <Share2 className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Main Desktop Grid */}
        <main className="relative z-10 flex-1 max-w-[1500px] w-full mx-auto px-6 lg:px-8 py-3 pb-24 grid grid-cols-12 gap-7 items-start">
          
          {/* ========================================================================= */}
          {/* FIXED / STICKY LEFT COLUMN: Sized to fit screen height between navs       */}
          {/* ========================================================================= */}
          <section className="col-span-5 xl:col-span-4 sticky top-16 self-start flex flex-col items-center w-full">
            
            {/* 9:16 Video Player Container (Height strictly constrained to fit viewport) */}
            <div 
              ref={playerFrameRef}
              onMouseMove={resetControlsTimer}
              onMouseEnter={resetControlsTimer}
              className="relative w-full h-[calc(100dvh-175px)] max-h-[620px] min-h-[440px] aspect-[9/16] bg-black rounded-[28px] overflow-hidden border border-white/15 shadow-2xl shadow-black/90 flex flex-col group select-none mx-auto"
            >
              {/* Top Video Badges */}
              <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md border border-white/20 text-white font-mono shadow-md">
                  Ep {currentEpNum}
                </span>

                <div className="flex items-center gap-1.5">
                  {isLooping && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                      Looping
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/40 backdrop-blur-md border border-primary/40 text-white shadow-md">
                    {drama.language}
                  </span>
                </div>
              </div>

              {/* Video Player */}
              <div 
                onClick={togglePlayPause}
                className="relative w-full h-full flex items-center justify-center cursor-pointer bg-black overflow-hidden"
              >
                <video
                  ref={videoRef}
                  playsInline
                  muted={isMuted}
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setProgress(videoRef.current.currentTime);
                      setDuration(videoRef.current.duration || 0);
                    }
                  }}
                  onEnded={() => {
                    if (isLooping) {
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        videoRef.current.play();
                      }
                    } else if (autoAdvance) {
                      goToNextEpisode();
                    }
                  }}
                  onWaiting={() => setIsLoadingVideo(true)}
                  onPlaying={() => {
                    setIsLoadingVideo(false);
                    setIsPlaying(true);
                  }}
                  className={cn(
                    "w-full h-full transition-all duration-300",
                    aspectFit === 'cover' ? "object-cover" : "object-contain"
                  )}
                />

                {/* Subtitles Overlay */}
                {isCcActive && currentSubtitleCue && (
                  <div 
                    className={cn(
                      "absolute inset-x-3 flex justify-center text-center pointer-events-none z-20 transition-all",
                      controlsVisible ? "bottom-20" : "bottom-10"
                    )}
                  >
                    <motion.div
                      key={currentSubtitleCue}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "px-3 py-1 rounded-2xl max-w-[90%] shadow-2xl font-semibold tracking-wide border leading-tight",
                        ccSize === 'sm' && "text-xs",
                        ccSize === 'base' && "text-xs sm:text-sm",
                        ccSize === 'lg' && "text-sm sm:text-base font-bold",
                        ccStyle === 'glass' && "bg-black/80 backdrop-blur-md text-white border-white/15",
                        ccStyle === 'box' && "bg-black text-amber-300 border-amber-400/30",
                        ccStyle === 'outline' && "bg-transparent text-white border-transparent drop-shadow-[0_2px_4px_black]"
                      )}
                    >
                      {currentSubtitleCue}
                    </motion.div>
                  </div>
                )}

                {/* Loading Spinner */}
                {isLoadingVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20 pointer-events-none">
                    <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                )}

                {/* Big Center Play/Pause Flash */}
                <AnimatePresence>
                  {!isPlaying && !isLoadingVideo && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={ATRAX_BUBBLY_SPRING}
                      className="absolute w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center pointer-events-none z-20 shadow-2xl"
                    >
                      <Play className="w-7 h-7 ml-1 fill-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Center Flash Feedback Pill */}
                <AnimatePresence>
                  {flashFeedback && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={ATRAX_BUBBLY_SPRING}
                      className="absolute px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-xl border border-white/20 text-white text-xs font-mono font-bold tracking-wider z-40 pointer-events-none shadow-2xl"
                    >
                      {flashFeedback}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Banner */}
                {videoError && (
                  <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-slate-900/95 border border-red-500/30 text-center z-30">
                    <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-1.5" />
                    <p className="text-xs text-white font-medium">{videoError}</p>
                    <button
                      onClick={() => selectEpisode(currentEpNum)}
                      className="mt-2 px-3 py-1 rounded-full bg-primary text-white text-xs font-bold"
                    >
                      Reload Stream
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side Floating Quick Icons */}
              <div className="absolute right-2 bottom-20 z-30 flex flex-col items-center gap-2 pointer-events-auto">
                <motion.button
                  variants={atraxSquishTapVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setIsDrawerOpen(true)}
                  className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white flex flex-col items-center justify-center shadow-lg hover:border-primary/50 transition-colors"
                  title="Open episode drawer sheet"
                >
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[8px] font-mono leading-none mt-0.5">{currentEpNum}</span>
                </motion.button>

                <motion.button
                  variants={atraxJellyWobbleVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={toggleLike}
                  className={cn(
                    "w-9 h-9 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-lg transition-colors",
                    isLiked ? "bg-rose-500/30 border-rose-500 text-rose-500" : "bg-black/60 border-white/20 text-white"
                  )}
                  title="Like drama"
                >
                  <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-rose-500")} />
                </motion.button>

                <motion.button
                  variants={atraxSquishTapVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleShare}
                  className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-lg hover:border-white/40"
                  title="Share episode"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {/* Bottom Control Suite */}
              <div 
                className={cn(
                  "absolute bottom-0 inset-x-0 p-2.5 pt-5 z-30 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col gap-1.5 pointer-events-auto transition-opacity duration-300",
                  controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                {/* Timeline Progress Bar */}
                <div className="flex items-center gap-2 text-[9px] text-slate-300 font-mono">
                  <span>{formatTime(progress)}</span>
                  <div className="relative flex-1 flex items-center h-3 cursor-pointer group/slider">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={progress}
                      onChange={handleSeek}
                      className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-primary focus:outline-none"
                    />
                  </div>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Bottom Control Buttons */}
                <div className="flex items-center justify-between gap-1">
                  
                  {/* Prev, -10s, Play/Pause, +10s, Next */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={goToPrevEpisode}
                      disabled={currentEpNum <= 1}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                      title="Previous Episode"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => seekBy(-10)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white"
                      title="Rewind 10s"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>

                    <button
                      onClick={togglePlayPause}
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white ml-0.5" />}
                    </button>

                    <button
                      onClick={() => seekBy(10)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white"
                      title="Forward 10s"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>

                    <button
                      onClick={goToNextEpisode}
                      disabled={currentEpNum >= drama.totalEpisodes}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                      title="Next Episode"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Volume, CC, Settings, PiP, Fullscreen */}
                  <div className="flex items-center gap-0.5 relative">
                    {/* Volume with hover slider */}
                    <div 
                      className="relative flex items-center"
                      onMouseEnter={() => setIsVolumeHovered(true)}
                      onMouseLeave={() => setIsVolumeHovered(false)}
                    >
                      <button
                        onClick={toggleMute}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-white"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-3 h-3 text-amber-400" />
                        ) : volume < 0.5 ? (
                          <Volume1 className="w-3 h-3" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isVolumeHovered && (
                          <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 55, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="overflow-hidden flex items-center px-1"
                          >
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={isMuted ? 0 : volume}
                              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                              className="w-12 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-primary"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* CC Subtitles Button */}
                    <button
                      onClick={() => {
                        setShowCcModal(prev => !prev);
                        setShowSettingsMenu(false);
                      }}
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                        isCcActive && ccLanguage !== 'off'
                          ? "bg-primary text-white shadow-sm shadow-primary/40"
                          : "text-slate-400 hover:text-white"
                      )}
                      title="Closed Captions / Subtitles"
                    >
                      <Subtitles className="w-3 h-3" />
                    </button>

                    {/* Settings Gear Popover */}
                    <button
                      onClick={() => {
                        setShowSettingsMenu(prev => !prev);
                        setShowCcModal(false);
                      }}
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-colors",
                        showSettingsMenu && "bg-white/20 text-white"
                      )}
                      title="Playback Settings"
                    >
                      <Settings className="w-3 h-3" />
                    </button>

                    {/* PiP */}
                    <button
                      onClick={togglePiP}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-white"
                      title="Picture-in-Picture"
                    >
                      <PictureInPicture2 className="w-3 h-3" />
                    </button>

                    {/* Fullscreen */}
                    <button
                      onClick={toggleFullscreen}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-white"
                      title="Fullscreen"
                    >
                      {isFullscreen ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* CC Subtitles Customizer Popover */}
              <AnimatePresence>
                {showCcModal && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={ATRAX_CAPSULE_SPRING}
                    className="absolute bottom-14 right-2 w-60 bg-slate-900/95 border border-white/15 rounded-3xl p-3 z-50 backdrop-blur-2xl shadow-2xl flex flex-col gap-2 text-xs"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-white/10">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Subtitles className="w-3.5 h-3.5 text-primary" />
                        <span>Closed Captions</span>
                      </span>
                      <button 
                        onClick={() => setShowCcModal(false)}
                        className="p-1 rounded-full text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Language</span>
                      <div className="grid grid-cols-2 gap-1 font-medium">
                        {[
                          { id: 'en', label: 'English CC 🇺🇸' },
                          { id: 'hi', label: 'Hindi 🇮🇳' },
                          { id: 'zh', label: 'Chinese 🇨🇳' },
                          { id: 'es', label: 'Spanish 🇪🇸' },
                        ].map((lang) => (
                          <button
                            key={lang.id}
                            onClick={() => {
                              setCcLanguage(lang.id as any);
                              setIsCcActive(true);
                            }}
                            className={cn(
                              "px-2 py-1 rounded-xl text-[10px] text-left transition-colors flex items-center justify-between",
                              ccLanguage === lang.id && isCcActive
                                ? "bg-primary text-white font-bold"
                                : "bg-white/5 text-slate-300 hover:bg-white/10"
                            )}
                          >
                            <span>{lang.label}</span>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setCcLanguage('off');
                          setIsCcActive(false);
                        }}
                        className={cn(
                          "w-full py-1 rounded-xl text-[10px] font-bold text-center mt-0.5",
                          !isCcActive || ccLanguage === 'off'
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : "bg-white/5 text-slate-400 hover:text-white"
                        )}
                      >
                        Turn Off Captions
                      </button>
                    </div>

                    {isCcActive && ccLanguage !== 'off' && (
                      <div className="flex flex-col gap-1.5 pt-1 border-t border-white/10">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Text Size</span>
                          <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                            {[
                              { id: 'sm', label: 'Small' },
                              { id: 'base', label: 'Med' },
                              { id: 'lg', label: 'Large' },
                            ].map(s => (
                              <button
                                key={s.id}
                                onClick={() => setCcSize(s.id as any)}
                                className={cn(
                                  "py-0.5 rounded-lg border transition-colors",
                                  ccSize === s.id
                                    ? "bg-white/20 text-white border-white/30"
                                    : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                                )}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Style</span>
                          <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                            {[
                              { id: 'glass', label: 'Glass' },
                              { id: 'box', label: 'Box' },
                              { id: 'outline', label: 'Text' },
                            ].map(st => (
                              <button
                                key={st.id}
                                onClick={() => setCcStyle(st.id as any)}
                                className={cn(
                                  "py-0.5 rounded-lg border transition-colors",
                                  ccStyle === st.id
                                    ? "bg-white/20 text-white border-white/30"
                                    : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                                )}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Settings Popover */}
              <AnimatePresence>
                {showSettingsMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={ATRAX_CAPSULE_SPRING}
                    className="absolute bottom-14 right-2 w-60 bg-slate-900/95 border border-white/15 rounded-3xl p-3 z-50 backdrop-blur-2xl shadow-2xl flex flex-col gap-2 text-xs"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-white/10">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-primary" />
                        <span>Playback Settings</span>
                      </span>
                      <button 
                        onClick={() => setShowSettingsMenu(false)}
                        className="p-1 rounded-full text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Speed Presets */}
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Speed</span>
                      <div className="grid grid-cols-3 gap-1 font-mono font-bold text-center text-[10px]">
                        {SPEED_OPTIONS.map((spd) => (
                          <button
                            key={spd}
                            onClick={() => setPlaybackSpeed(spd)}
                            className={cn(
                              "py-1 rounded-lg border transition-colors",
                              playbackSpeed === spd
                                ? "bg-primary text-white border-primary"
                                : "bg-white/5 text-slate-300 border-white/5 hover:bg-white/10"
                            )}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Display Mode */}
                    <div className="pt-1 border-t border-white/10 flex items-center justify-between">
                      <span className="text-slate-300 font-medium text-[11px]">Display</span>
                      <button
                        onClick={() => setAspectFit(prev => prev === 'cover' ? 'contain' : 'cover')}
                        className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-[10px] border border-white/15"
                      >
                        {aspectFit === 'cover' ? 'Fill (9:16)' : 'Fit (Letterbox)'}
                      </button>
                    </div>

                    {/* Loop Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium text-[11px]">Loop Episode</span>
                      <button
                        onClick={() => setIsLooping(prev => !prev)}
                        className={cn(
                          "w-8 h-4 rounded-full p-0.5 transition-colors border flex items-center",
                          isLooping ? "bg-primary border-primary justify-end" : "bg-white/10 border-white/15 justify-start"
                        )}
                      >
                        <span className="w-3 h-3 rounded-full bg-white shadow-md" />
                      </button>
                    </div>

                    {/* Auto-Advance Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium text-[11px]">Auto-Play Next</span>
                      <button
                        onClick={() => setAutoAdvance(prev => !prev)}
                        className={cn(
                          "w-8 h-4 rounded-full p-0.5 transition-colors border flex items-center",
                          autoAdvance ? "bg-emerald-500 border-emerald-500 justify-end" : "bg-white/10 border-white/15 justify-start"
                        )}
                      >
                        <span className="w-3 h-3 rounded-full bg-white shadow-md" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Prev / Next below the player */}
            <div className="w-full max-w-[320px] mt-2 flex items-center justify-between gap-2 px-1">
              <motion.button
                variants={atraxSquishTapVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                disabled={currentEpNum <= 1}
                onClick={goToPrevEpisode}
                className="flex-1 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 hover:border-white/25 disabled:opacity-30 disabled:pointer-events-none text-[11px] font-bold flex items-center justify-center gap-1 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev Ep</span>
              </motion.button>

              <motion.button
                variants={atraxSquishTapVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                disabled={currentEpNum >= drama.totalEpisodes}
                onClick={goToNextEpisode}
                className="flex-1 py-1.5 rounded-xl bg-primary text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-md shadow-primary/30 transition-colors"
              >
                <span>Next Ep</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SCROLLING RIGHT COLUMN: Rich Drama Details, Matrix & Recommendations      */}
          {/* ========================================================================= */}
          <section className="col-span-7 xl:col-span-8 flex flex-col gap-5 w-full">
            
            {/* 1. Drama Header & Meta Info Box */}
            <div className="p-5 md:p-6 rounded-[28px] bg-slate-900/70 border border-white/10 shadow-xl backdrop-blur-2xl flex flex-col gap-3.5">
              
              {/* Badges */}
              <div className="flex items-center flex-wrap gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary text-white shadow-sm shadow-primary/20 font-mono">
                  {drama.totalEpisodes} Episodes
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {drama.language}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <LockOpen className="w-3 h-3" />
                  100% Free Unlocked
                </span>
                {drama.rating && (
                  <span className="flex items-center gap-1 text-xs text-amber-400 font-bold ml-auto">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {drama.rating}
                  </span>
                )}
              </div>

              {/* Title */}
              <div>
                <h1 className="text-lg md:text-2xl font-extrabold text-white leading-tight">
                  {drama.title}
                </h1>
                {drama.originalTitle && drama.originalTitle !== drama.title && (
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    Original: {drama.originalTitle}
                  </p>
                )}
              </div>

              {/* Synopsis */}
              <div className="text-xs text-slate-300/95 leading-relaxed">
                <p className={cn(!isDescExpanded && "line-clamp-2 md:line-clamp-3")}>
                  {drama.description}
                </p>
                {drama.description && drama.description.length > 150 && (
                  <button
                    onClick={() => setIsDescExpanded(prev => !prev)}
                    className="text-primary text-xs font-bold mt-1 hover:underline inline-block"
                  >
                    {isDescExpanded ? "Show Less" : "Read More"}
                  </button>
                )}
              </div>

              {/* Tags */}
              {drama.tags && drama.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {drama.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full"
                    >
                      #{t}
                    </span>
                  ))}
                  {drama.releaseYear && (
                    <span className="text-[11px] text-slate-400 ml-auto font-mono">
                      Year: {drama.releaseYear}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 2. Episode Selection Matrix */}
            <div className="p-5 md:p-6 rounded-[28px] bg-slate-900/70 border border-white/10 shadow-xl backdrop-blur-2xl flex flex-col gap-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>Episode Selection</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click any episode to start streaming immediately in 9:16 HD.
                  </p>
                </div>

                {/* Jump Search */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={episodeSearch}
                    onChange={(e) => setEpisodeSearch(e.target.value)}
                    placeholder="Jump to ep..."
                    className="w-full bg-slate-800/90 border border-white/10 rounded-xl py-1 pl-7 pr-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Chunk Tabs */}
              {!episodeSearch && totalChunks > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {Array.from({ length: totalChunks }).map((_, cIdx) => {
                    const startEp = cIdx * CHUNK_SIZE + 1;
                    const endEp = Math.min((cIdx + 1) * CHUNK_SIZE, drama.totalEpisodes);
                    const isCurrentChunk = episodeChunkIndex === cIdx;

                    return (
                      <button
                        key={cIdx}
                        onClick={() => setEpisodeChunkIndex(cIdx)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[11px] font-mono font-bold whitespace-nowrap transition-all border",
                          isCurrentChunk
                            ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                            : "bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-800 hover:border-white/20"
                        )}
                      >
                        Ep {startEp} - {endEp}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Episode Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 max-h-[340px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-1">
                {displayedEpisodes.map((ep) => {
                  const isCurrent = ep.episodeNumber === currentEpNum;

                  return (
                    <motion.button
                      key={ep.episodeNumber}
                      variants={atraxChipTapVariants}
                      initial="initial"
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => selectEpisode(ep.episodeNumber)}
                      className={cn(
                        "relative aspect-square rounded-2xl flex flex-col items-center justify-center p-1.5 text-xs font-bold transition-all border",
                        isCurrent
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/40 font-extrabold scale-105"
                          : "bg-slate-800/90 text-slate-300 border-white/10 hover:border-white/30 hover:bg-slate-750"
                      )}
                    >
                      {isCurrent ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <Play className="w-3 h-3 fill-white animate-pulse" />
                          <span className="text-[10px] font-mono leading-none">
                            Ep {ep.episodeNumber}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs font-mono leading-none">
                            {ep.episodeNumber}
                          </span>
                          {ep.duration && (
                            <span className="text-[8px] text-slate-400 font-normal leading-none">
                              {ep.duration}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {displayedEpisodes.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No episodes found matching "{episodeSearch}"
                </div>
              )}
            </div>

            {/* 3. Recommended Short Dramas */}
            {drama.recommendations && drama.recommendations.length > 0 && (
              <div className="p-5 md:p-6 rounded-[28px] bg-slate-900/70 border border-white/10 shadow-xl backdrop-blur-2xl flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>More Vertical Dramas Like This</span>
                  </h3>
                  <Link href="/shorts" className="text-[11px] text-primary font-bold hover:underline">
                    View All
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {drama.recommendations.slice(0, 4).map((rec, rIdx) => (
                    <Link
                      key={`${rec.id}_${rIdx}`}
                      href={`/shorts/watch?id=${encodeURIComponent(rec.id)}&ep=1`}
                      className="group block"
                    >
                      <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-slate-950 border border-white/10 relative shadow-md group-hover:border-primary/40 group-hover:shadow-primary/20 transition-all">
                        <img
                          src={rec.cover}
                          alt={rec.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        
                        <div className="absolute top-1.5 left-1.5">
                          <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-primary/80 text-white backdrop-blur-md">
                            {rec.language}
                          </span>
                        </div>

                        <div className="absolute bottom-2 inset-x-2">
                          <h4 className="text-[11px] font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">
                            {rec.title}
                          </h4>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {rec.totalEpisodes} Eps
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>

        {/* Global Footer on Desktop */}
        <Footer />
      </div>

      {/* Keyboard Shortcuts Dialog Modal */}
      <AnimatePresence>
        {showShortcutsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShortcutsModal(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={ATRAX_CAPSULE_SPRING}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-[32px] bg-slate-900 border border-white/15 p-6 shadow-2xl text-white flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-extrabold">Player Shortcuts</h3>
                </div>
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                {[
                  { key: 'Space', desc: 'Play / Pause video' },
                  { key: '↑ / ↓', desc: 'Previous / Next episode' },
                  { key: '← / →', desc: 'Rewind / Forward 10 seconds' },
                  { key: 'M', desc: 'Mute / Unmute audio' },
                  { key: 'C', desc: 'Toggle CC Subtitles' },
                  { key: 'F', desc: 'Toggle Fullscreen' },
                  { key: 'P', desc: 'Picture-in-Picture mode' },
                  { key: 'L', desc: 'Toggle Repeat / Loop Episode' },
                  { key: '?', desc: 'Toggle this shortcuts modal' },
                ].map((sc, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-300">{sc.desc}</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 font-mono text-[10px] font-bold text-primary">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowShortcutsModal(false)}
                className="w-full py-2.5 rounded-2xl bg-primary text-white font-bold text-xs shadow-lg shadow-primary/30 mt-2"
              >
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episode Drawer Modal (Sheet for Mobile & Quick Jump) */}
      <EpisodeDrawerModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={drama.title}
        totalEpisodes={drama.totalEpisodes}
        episodes={drama.episodes}
        currentEpisode={currentEpNum}
        onSelectEpisode={selectEpisode}
      />

      {/* Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-slate-900/95 border border-primary/40 text-white text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-xl"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
