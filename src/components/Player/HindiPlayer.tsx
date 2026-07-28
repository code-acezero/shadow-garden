"use client";

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';
import {
    Play, Pause, Volume2, VolumeX,
    Settings, Maximize, Minimize, Subtitles,
    Wand2, AudioWaveform, PictureInPicture, Gauge,
    ChevronRight, ChevronLeft, MousePointerClick,
    ChevronsLeft, ChevronsRight, Sun, MoveHorizontal, MoveVertical,
    Loader2, Cast
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MagicalWaveParticlesPlayerLoader } from '@/components/Watch/LiquidWatchLoaders';

// --- 1. CONFIGURATION CONSTANTS ---
const SUB_COLORS = {
    White: '#ffffff', Yellow: '#fbbf24', Cyan: '#22d3ee', Red: '#f87171',
    Green: '#4ade80', Purple: '#c084fc', Black: '#000000'
};
const SUB_SIZES = { Small: '0.8em', Medium: '1.15em', Large: '1.5em', Huge: '2.0em' };
const SUB_FONTS = {
    Sans: '"Inter", sans-serif', Serif: '"Merriweather", serif',
    Mono: '"JetBrains Mono", monospace', Hand: '"BadUnicorn", sans-serif', Anime: '"Monas", sans-serif'
};
const SUB_LIFTS = { Bottom: '0px', Middle: '-5vh', High: '-12vh' };
const SUB_BACKGROUNDS = { None: 'transparent', Outline: 'text-shadow', Box: 'smart', Blur: 'smart-blur', Bar: 'bar' };

const DEFAULT_SUB_STYLE = { color: 'White', size: 'Medium', bg: 'Outline', font: 'Sans', lift: 'Middle', opacity: 75 };

// --- WHISPER HELPER ---
const notifyWhisper = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('shadow-whisper', {
            detail: { id: Date.now(), type, title: "Player", message }
        });
        window.dispatchEvent(event);
    }
};

interface HindiPlayerProps {
    url: string;
    title?: string;
    poster?: string;
    subtitles?: any[];
    intro?: { start: number; end: number };
    outro?: { start: number; end: number };
    // The upstream CDN behind `url` may require this exact Referer header or
    // it rejects the request. Forwarded to /api/proxy so it can send it.
    referer?: string | null;
    iframeUrl?: string | null;
    isEmbed?: boolean;
    isM3U8?: boolean;
    autoSkip?: boolean;
    autoPlay?: boolean;
    startTime?: number;
    onEnded?: () => void;
    onNext?: () => void;
    onPlay?: () => void;
    onSkipIntro?: () => void;
    onProgress?: (state: { playedSeconds: number; loadedSeconds: number }) => void;
    onInteract?: () => void;
    onPause?: () => void;
    onBuffer?: () => void;
    controlsTimeout?: number;
    onControlsChange?: (visible: boolean) => void;
    initialVolume?: number;
    initialSpeed?: number;
    onSettingsChange?: (key: string, value: any) => void;
    onError?: (err: any) => void;
}

export interface HindiPlayerRef {
    getCurrentTime: () => number;
    getDuration: () => number;
    seekTo: (time: number) => void;
    focus: () => void;
}

const HindiPlayer = forwardRef<HindiPlayerRef, HindiPlayerProps>(({
    url, iframeUrl, isEmbed, title, poster, intro, outro, referer, isM3U8, autoSkip = false, autoPlay = true, startTime = 0, subtitles = [],
    onEnded, onNext, onPlay, onSkipIntro, onProgress, onInteract, onPause, onBuffer,
    controlsTimeout = 3000, onControlsChange, initialVolume = 1, initialSpeed = 1, onSettingsChange, onError
}, ref) => {
    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const titleContainerRef = useRef<HTMLDivElement>(null);
    const titleTextRef = useRef<HTMLSpanElement>(null);

    // Timers
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const seekOverlayTimerRef = useRef<NodeJS.Timeout | null>(null);
    const bufferDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const seekAccumulatorRef = useRef(0);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Logic Refs
    const seekTargetRef = useRef<number | null>(null);
    const hasInitializedRef = useRef(false);
    const hasSeekedStartTimeRef = useRef(false);
    const hasSkippedIntroRef = useRef(false);
    const originalSpeedRef = useRef(initialSpeed);

    // Gesture Refs
    const touchStartRef = useRef<{ x: number, y: number, time: number, val: number, bright: number, curTime: number } | null>(null);
    const gestureLockRef = useRef<'vertical' | 'horizontal' | null>(null);
    const lastTapTimeRef = useRef(0);

    // Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(initialVolume);
    const [isMuted, setIsMuted] = useState(false);
    const [brightness, setBrightness] = useState(1);
    const [isLongPressing, setIsLongPressing] = useState(false);
    const [castAvailable, setCastAvailable] = useState(false);
    const [isPiPActive, setIsPiPActive] = useState(false);
    const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);

    // UI State
    const [showControls, setShowControls] = useState(true);
    const [showSkipIntro, setShowSkipIntro] = useState(false);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverPos, setHoverPos] = useState<number>(0);
    const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);

    const [seekOverlay, setSeekOverlay] = useState<string | null>(null);
    const [gestureOverlay, setGestureOverlay] = useState<{ icon: React.ReactNode, text: string } | null>(null);

    // Settings State
    const [speed, setSpeed] = useState(initialSpeed);
    const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
    const [currentQuality, setCurrentQuality] = useState(-1);
    const [autoResolutionText, setAutoResolutionText] = useState('Auto');
    const [audioTracks, setAudioTracks] = useState<any[]>([]);
    const [currentAudio, setCurrentAudio] = useState(-1);
    const [currentSubtitle, setCurrentSubtitle] = useState(-1);
    const [trackSubtitles, setTrackSubtitles] = useState<any[]>([]);

    // Preferences
    const [subStyle, setSubStyle] = useState(DEFAULT_SUB_STYLE);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const [doubleTapMode, setDoubleTapMode] = useState<'seek' | 'playpause' | 'fullscreen'>('seek');
    const [verticalGesture, setVerticalGesture] = useState<'vol_bright' | 'fullscreen' | 'none'>('vol_bright');
    const [horizontalGesture, setHorizontalGesture] = useState<'seek' | 'nav' | 'volume' | 'none'>('seek');
    const [activeMenu, setActiveMenu] = useState<'none' | 'main' | 'quality' | 'speed' | 'audio' | 'subs' | 'subSettings' | 'gestures' | 'vGesture' | 'hGesture'>('none');

    const canSaveRef = useRef(false);
    const lastProgressTimeRef = useRef(0);
    const [hlsFailed, setHlsFailed] = useState(false);
    const useIframe = isEmbed || !url;

    // Helper
    const formatTime = (t: number) => {
        const h = Math.floor(t / 3600);
        const m = Math.floor((t % 3600) / 60);
        const s = Math.floor(t % 60);
        return h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}` : `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    useImperativeHandle(ref, () => ({
        getCurrentTime: () => videoRef.current?.currentTime || 0,
        getDuration: () => videoRef.current?.duration || 0,
        seekTo: (time: number) => {
            if (videoRef.current) {
                videoRef.current.currentTime = time;
                setCurrentTime(time);
                if (canSaveRef.current) onInteract?.();
            }
        },
        focus: () => containerRef.current?.focus()
    }));

    // --- PREFERENCE LOADING ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedPrefs = localStorage.getItem('shadow_player_prefs');
            if (savedPrefs) {
                const parsed = JSON.parse(savedPrefs);
                if (parsed.subStyle) {
                    setSubStyle({
                        ...DEFAULT_SUB_STYLE,
                        ...parsed.subStyle
                    });
                }
                if (parsed.doubleTapMode) setDoubleTapMode(parsed.doubleTapMode);
                if (parsed.verticalGesture) setVerticalGesture(parsed.verticalGesture);
                if (parsed.horizontalGesture) setHorizontalGesture(parsed.horizontalGesture);
            }
        }
        const validSubs = subtitles?.filter(s => {
            const label = s.label?.toLowerCase() || '';
            const isThumb = label.includes('thumb') || s.kind === 'thumbnails' || label.includes('sprite');
            const hasUrl = !!(s.url || s.file);
            return !isThumb && hasUrl;
        }) || [];
        setTrackSubtitles(validSubs);
    }, [subtitles]);

    const updateLocalPrefs = (updates: any) => {
        if (updates.subStyle) setSubStyle(prev => ({ ...prev, ...updates.subStyle }));
        if (updates.doubleTapMode) setDoubleTapMode(updates.doubleTapMode);
        if (updates.verticalGesture) setVerticalGesture(updates.verticalGesture);
        if (updates.horizontalGesture) setHorizontalGesture(updates.horizontalGesture);

        const current = JSON.parse(localStorage.getItem('shadow_player_prefs') || '{}');
        const newState = { ...current, ...updates };
        if (updates.subStyle) {
            newState.subStyle = {
                ...DEFAULT_SUB_STYLE,
                ...(current.subStyle || {}),
                ...updates.subStyle
            };
        }
        localStorage.setItem('shadow_player_prefs', JSON.stringify(newState));
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('update_player_prefs', { detail: { playerPrefs: newState } }));
        }
    };

    // --- DYNAMIC CSS ---
    useEffect(() => {
        const styleId = 'shadow-player-subs';
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }
        styleTag.textContent = `
        @font-face { font-family: 'BadUnicorn'; src: '/fonts/BadUnicornDemoRegular.ttf' format('truetype'); }
        @font-face { font-family: 'Monas'; src: '/fonts/Monas.ttf' format('truetype'); }
    `;
    }, []);

    // --- PLAYER SETUP ---
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = initialVolume;
            videoRef.current.playbackRate = initialSpeed;

            const checkForCast = () => {
                // @ts-ignore
                if (videoRef.current && typeof videoRef.current.remote !== 'undefined') {
                    setCastAvailable(true);
                }
            };
            checkForCast();
            setTimeout(checkForCast, 1000);
        }
        setVolume(initialVolume);
        setSpeed(initialSpeed);
        originalSpeedRef.current = initialSpeed;
    }, [initialVolume, initialSpeed]);

    useEffect(() => { onControlsChange?.(showControls); }, [showControls, onControlsChange]);

    useEffect(() => {
        if (titleContainerRef.current && titleTextRef.current) {
            setIsTitleOverflowing(titleTextRef.current.scrollWidth > titleContainerRef.current.clientWidth);
        }
    }, [title]);

    const updateBuffering = (status: boolean) => {
        if (bufferDebounceRef.current) clearTimeout(bufferDebounceRef.current);
        if (status) {
            bufferDebounceRef.current = setTimeout(() => setIsBuffering(true), 300);
        } else {
            setIsBuffering(false);
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !url) return;

        setHasStarted(false);
        hasInitializedRef.current = false;
        setIsBuffering(true);
        if (hlsRef.current) hlsRef.current.destroy();

        const isExplicitMp4 = url.toLowerCase().includes('.mp4');
        // The user explicitly requested to NOT route any proxies
        const finalUrl = url;

        canSaveRef.current = false;
        const timer = setTimeout(() => { canSaveRef.current = true; }, 500);

        const onLevelLoaded = () => {
            setIsBuffering(false);
            if (startTime > 0 && !hasStarted && !hasInitializedRef.current) {
                video.currentTime = startTime;
                hasInitializedRef.current = true;
            }
            canSaveRef.current = true;
        };

        const shouldUseNative = isExplicitMp4 || (isM3U8 === undefined && !url.includes('.m3u8')) || isM3U8 === false;

        let nativeLoadedHandler: (() => void) | null = null;
        let nativeErrorHandler: ((e: any) => void) | null = null;

        if (!shouldUseNative && Hls.isSupported()) {
            const hls = new Hls({ capLevelToPlayerSize: true, autoStartLoad: true, startLevel: -1, startPosition: startTime > 0 ? startTime : -1 });
            hls.loadSource(finalUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                const levels = data.levels.map((l, i) => ({ height: l.height, index: i })).sort((a, b) => b.height - a.height);
                setQualities(levels);
                if (startTime > 0 && !hasInitializedRef.current) {
                    try { video.currentTime = startTime; } catch { }
                    hasInitializedRef.current = true;
                }
                if (autoPlay) {
                    const playPromise = video.play();
                    if (playPromise !== undefined) playPromise.catch(() => setIsPlaying(false));
                }
            });
            hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
                const height = hls.levels[data.level]?.height;
                if (hls.autoLevelEnabled) { setCurrentQuality(-1); setAutoResolutionText(`Auto (${height}p)`); } else { setCurrentQuality(data.level); setAutoResolutionText('Auto'); }
            });
            hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => { setAudioTracks(data.audioTracks); setCurrentAudio(data.audioTracks.findIndex(t => t.default)); });
            hls.on(Hls.Events.FRAG_BUFFERED, onLevelLoaded);
            hls.on(Hls.Events.ERROR, (e, data) => {
                if (data.fatal) {
                    setIsBuffering(false);
                    if (iframeUrl) setHlsFailed(true);
                    onError?.(data);
                }
            });
            hlsRef.current = hls;
        } else if (shouldUseNative || video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = finalUrl;
            video.load();

            nativeLoadedHandler = () => {
                if (startTime > 0 && !hasInitializedRef.current) {
                    try { video.currentTime = startTime; } catch { }
                    hasInitializedRef.current = true;
                }
                canSaveRef.current = true;
                if (autoPlay) {
                    const playPromise = video.play();
                    if (playPromise !== undefined) playPromise.catch(() => setIsPlaying(false));
                }
            };

            nativeErrorHandler = (err: any) => {
                if (iframeUrl) setHlsFailed(true);
                onError?.(err);
            };

            video.addEventListener('loadedmetadata', nativeLoadedHandler);
            video.addEventListener('error', nativeErrorHandler);
            if (video.readyState >= 1) {
                nativeLoadedHandler();
            }
        } else {
            if (iframeUrl) setHlsFailed(true);
        }

        const onEnterPiP = () => setIsPiPActive(true);
        const onLeavePiP = () => setIsPiPActive(false);
        video.addEventListener('enterpictureinpicture', onEnterPiP);
        video.addEventListener('leavepictureinpicture', onLeavePiP);

        return () => {
            clearTimeout(timer);
            if (hlsRef.current) hlsRef.current.destroy();
            video.removeEventListener('enterpictureinpicture', onEnterPiP);
            video.removeEventListener('leavepictureinpicture', onLeavePiP);
            if (nativeLoadedHandler) video.removeEventListener('loadedmetadata', nativeLoadedHandler);
            if (nativeErrorHandler) video.removeEventListener('error', nativeErrorHandler);
        };
    }, [url]);

    const [activeCueText, setActiveCueText] = useState<string | null>(null);

    // --- CC SYNC ---
    useEffect(() => {
        if (trackSubtitles.length > 0 && videoRef.current) {
            const tracks = videoRef.current.textTracks;
            if (tracks) { for (let i = 0; i < tracks.length; i++) { tracks[i].mode = 'disabled'; } }
            const engIndex = trackSubtitles.findIndex(t => t.label?.toLowerCase().includes('eng') || t.lang?.toLowerCase().includes('eng'));
            const targetIndex = engIndex !== -1 ? engIndex : -1;
            if (targetIndex !== -1) {
                setCurrentSubtitle(targetIndex);
                setTimeout(() => { if (videoRef.current?.textTracks[targetIndex]) { videoRef.current.textTracks[targetIndex].mode = 'hidden'; } }, 50);
            } else { setCurrentSubtitle(-1); }
        } else { setCurrentSubtitle(-1); }
    }, [trackSubtitles]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleCueChange = () => {
            if (currentSubtitle !== -1) {
                const track = video.textTracks[currentSubtitle];
                if (track && (track.mode === 'hidden' || track.mode === 'showing')) {
                    const cues = track.activeCues;
                    if (cues && cues.length > 0) {
                        const texts = [];
                        for (let i = 0; i < cues.length; i++) {
                            const cue = cues[i] as any;
                            if (cue.text) texts.push(cue.text);
                        }
                        setActiveCueText(texts.join('\n'));
                        return;
                    }
                }
            }
            setActiveCueText(null);
        };

        const tracks = video.textTracks;
        for (let i = 0; i < tracks.length; i++) {
            tracks[i].addEventListener('cuechange', handleCueChange);
        }

        return () => {
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].removeEventListener('cuechange', handleCueChange);
            }
        };
    }, [currentSubtitle, trackSubtitles]);

    // --- HANDLERS ---
    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) { videoRef.current.play(); } else { videoRef.current.pause(); if (canSaveRef.current) onInteract?.(); }
    }, [onInteract]);

    const seek = (amount: number) => {
        if (videoRef.current) {
            const basisTime = seekTargetRef.current !== null ? seekTargetRef.current : videoRef.current.currentTime;
            let target = basisTime + amount;
            target = Math.max(0, Math.min(target, duration || 100000));
            seekTargetRef.current = target;
            videoRef.current.currentTime = target;
            setCurrentTime(target);
            if (canSaveRef.current) onInteract?.();
            showUI();
            if (seekAccumulatorRef.current) clearTimeout(seekAccumulatorRef.current);
            // @ts-ignore
            seekAccumulatorRef.current = setTimeout(() => { seekTargetRef.current = null; }, 500);
        }
    };

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            if (containerRef.current) {
                await containerRef.current.requestFullscreen();
                // @ts-ignore
                if (screen.orientation && 'lock' in screen.orientation) { screen.orientation.lock('landscape').catch(() => { }); }
            }
        } else {
            await document.exitFullscreen();
            // @ts-ignore
            if (screen.orientation && 'unlock' in screen.orientation) { screen.orientation.unlock(); }
        }
    };

    const togglePiP = async () => {
        if (!videoRef.current) return;
        try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else await videoRef.current.requestPictureInPicture(); } catch (e) { console.error("PiP failed", e); }
    };

    const handleCast = async () => {
        if (videoRef.current && 'remote' in videoRef.current) {
            try {
                // @ts-ignore
                await videoRef.current.remote.prompt();
            } catch (e) {
                notifyWhisper("Casting not available or cancelled", "error");
            }
        } else {
            notifyWhisper("Casting not supported in this browser", "error");
        }
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        if (videoRef.current) {
            videoRef.current.muted = newMuted;
            if (newMuted) {
                setVolume(0);
            } else {
                setVolume(1);
                videoRef.current.volume = 1;
            }
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVol = parseFloat(e.target.value);
        setVolume(newVol);
        if (videoRef.current) {
            videoRef.current.volume = newVol;
            const shouldMute = newVol === 0;
            setIsMuted(shouldMute);
            videoRef.current.muted = shouldMute;
        }
        onSettingsChange?.('volume', newVol);
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video || isScrubbing) return;

        if (seekTargetRef.current === null) {
            setCurrentTime(video.currentTime);
        }

        if (!hasStarted && video.currentTime > 0) setHasStarted(true);

        if (onProgress && (canSaveRef.current || video.currentTime > 0)) {
            canSaveRef.current = true;
            const now = Date.now();
            if (now - lastProgressTimeRef.current > 1000) {
                onProgress({ playedSeconds: video.currentTime, loadedSeconds: video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0 });
                lastProgressTimeRef.current = now;
            }
        }

        if (intro && video.currentTime >= intro.start && video.currentTime <= intro.end) {
            if (autoSkip && !hasSkippedIntroRef.current) {
                hasSkippedIntroRef.current = true;
                video.currentTime = intro.end;
                notifyWhisper("Skipped Intro", "success");
            } else if (!autoSkip) {
                setShowSkipIntro(true);
            }
        } else setShowSkipIntro(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyF', 'KeyM'].includes(e.code)) {
            e.preventDefault();
        }

        if (e.code === 'Space') togglePlay();
        if (e.code === 'ArrowRight') seek(10);
        if (e.code === 'ArrowLeft') seek(-10);
        if (e.code === 'KeyF') toggleFullscreen();
        if (e.code === 'KeyM') toggleMute();
        showUI();
    };

    const handleContainerClick = (e: React.MouseEvent) => {
        containerRef.current?.focus();
        handleGesture(e);
    };

    const changeQuality = (index: number) => {
        if (hlsRef.current) { hlsRef.current.currentLevel = index; if (index === -1) setAutoResolutionText("Auto"); }
        setCurrentQuality(index);
        if (canSaveRef.current) onInteract?.(); onSettingsChange?.('quality', index);
    };
    const changeSpeed = (rate: number) => {
        if (videoRef.current) videoRef.current.playbackRate = rate;
        setSpeed(rate);
        originalSpeedRef.current = rate;
        if (canSaveRef.current) onInteract?.(); onSettingsChange?.('speed', rate);
    };
    const changeAudio = (index: number) => {
        if (hlsRef.current) hlsRef.current.audioTrack = index;
        setCurrentAudio(index); if (canSaveRef.current) onInteract?.();
    };
    const changeSubtitle = (index: number) => {
        setCurrentSubtitle(index);
        if (videoRef.current) {
            const tracks = videoRef.current.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].mode = 'disabled';
            }
            if (index !== -1 && tracks[index]) {
                tracks[index].mode = 'hidden';
            }
        }
        setActiveMenu('none');
        if (canSaveRef.current) onInteract?.();
    };

    // --- TOUCH & GESTURE LOGIC ---
    const startLongPress = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = setTimeout(() => {
            setIsLongPressing(true);
            if (videoRef.current) videoRef.current.playbackRate = 2.0;
        }, 500);
    };

    const endLongPress = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        if (isLongPressing) {
            setIsLongPressing(false);
            if (videoRef.current) videoRef.current.playbackRate = originalSpeedRef.current;
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('[role="menu"]') || target.closest('.absolute.bottom-12') || target.closest('.absolute.bottom-16') || target.closest('.group\\/seek') || target.closest('.bg-black\\/60')) return;
        if (!videoRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now(),
            val: volume,
            bright: brightness,
            curTime: videoRef.current.currentTime
        };
        gestureLockRef.current = null;
        startLongPress();
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartRef.current || !containerRef.current || !videoRef.current) return;

        const deltaX = e.touches[0].clientX - touchStartRef.current.x;
        const deltaY = touchStartRef.current.y - e.touches[0].clientY;

        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            endLongPress();
        }

        if (!gestureLockRef.current) {
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                gestureLockRef.current = 'horizontal';
            } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
                gestureLockRef.current = 'vertical';
            }
        }

        if (!gestureLockRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();

        if (gestureLockRef.current === 'horizontal') {
            if (horizontalGesture === 'seek') {
                const seekTime = Math.max(0, Math.min(duration, touchStartRef.current.curTime + (deltaX / rect.width) * 90));
                videoRef.current.currentTime = seekTime;
                setCurrentTime(seekTime);
                const seekIcon = deltaX > 0 ? <ChevronsRight size={32} /> : <ChevronsLeft size={32} />;
                setGestureOverlay({ icon: seekIcon, text: formatTime(seekTime) });
            } else if (horizontalGesture === 'volume') {
                const newVol = Math.max(0, Math.min(1, touchStartRef.current.val + (deltaX / 200)));
                setVolume(newVol);
                if (videoRef.current) videoRef.current.volume = newVol;
                setGestureOverlay({ icon: <Volume2 size={32} />, text: `${Math.round(newVol * 100)}%` });
            }
        } else if (gestureLockRef.current === 'vertical') {
            if (verticalGesture === 'vol_bright') {
                if (touchStartRef.current.x > rect.width / 2) {
                    const newVol = Math.max(0, Math.min(1, touchStartRef.current.val + (deltaY / 200)));
                    setVolume(newVol);
                    if (videoRef.current) videoRef.current.volume = newVol;
                    setGestureOverlay({ icon: <Volume2 size={32} />, text: `${Math.round(newVol * 100)}%` });
                } else {
                    const newBright = Math.max(0.2, Math.min(1.5, touchStartRef.current.bright + (deltaY / 300)));
                    setBrightness(newBright);
                    setGestureOverlay({ icon: <Sun size={32} />, text: `${Math.round(newBright * 100)}%` });
                }
            }
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        endLongPress();
        setGestureOverlay(null);
        if (!touchStartRef.current) return;

        const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = touchStartRef.current.y - e.changedTouches[0].clientY;
        const timeDiff = Date.now() - touchStartRef.current.time;

        if (timeDiff < 300 && (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50)) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (horizontalGesture === 'nav' && onNext) {
                    if (deltaX < -50) onNext();
                    if (deltaX > 50 && videoRef.current) videoRef.current.currentTime = 0;
                }
            } else {
                if (verticalGesture === 'fullscreen') toggleFullscreen();
            }
        }
        touchStartRef.current = null;
        gestureLockRef.current = null;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
        startLongPress();
    };
    const handleMouseUp = () => endLongPress();

    const handleGesture = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('.absolute.bottom-12') || (e.target as HTMLElement).closest('.absolute.bottom-16') || (e.target as HTMLElement).closest('[class*="group/seek"]') || (e.target as HTMLElement).closest('[class*="bg-black/60"]')) return;
        if (activeMenu !== 'none') { setActiveMenu('none'); return; }

        const now = Date.now();
        const timeDiff = now - lastTapTimeRef.current;
        const isDoubleClick = (timeDiff > 0 && timeDiff < 450) || e.detail === 2;

        if (isDoubleClick) {
            if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

            if (doubleTapMode === 'seek') {
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = e.clientX - rect.left;
                const delta = x > rect.width * 0.5 ? 10 : -10;

                const currentAccumulator = parseInt(seekOverlay?.replace(/[^0-9-]/g, '') || '0');
                const newAccumulator = (timeDiff < 700 ? currentAccumulator : 0) + delta;
                setSeekOverlay(`${newAccumulator > 0 ? '+' : ''}${newAccumulator}s`);

                seek(delta);

                if (seekOverlayTimerRef.current) clearTimeout(seekOverlayTimerRef.current);
                seekOverlayTimerRef.current = setTimeout(() => { setSeekOverlay(null); }, 800);
            } else if (doubleTapMode === 'playpause') {
                togglePlay();
            } else if (doubleTapMode === 'fullscreen') {
                toggleFullscreen();
            }

            lastTapTimeRef.current = now;
            return;
        }

        lastTapTimeRef.current = now;
        clickTimerRef.current = setTimeout(() => {
            if (showControls) { setShowControls(false); } else { showUI(); }
            clickTimerRef.current = null;
        }, 250);
    };

    const handleSeekStart = () => { setIsScrubbing(true); updateBuffering(false); };
    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => setCurrentTime(parseFloat(e.target.value));
    const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
        const time = parseFloat(e.currentTarget.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
            seekTargetRef.current = null;
        }
        setIsScrubbing(false); if (canSaveRef.current) onInteract?.();
    };
    const handleSeekHover = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        setHoverTime(percent * duration);
        setHoverPos(percent * 100);
    };

    const showUI = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying && activeMenu === 'none') { controlsTimeoutRef.current = setTimeout(() => setShowControls(false), controlsTimeout); }
    };

    // --- ASYNC START TIME RECOVERY ---
    useEffect(() => {
        if (startTime > 0 && videoRef.current && !hasInitializedRef.current) {
            if (videoRef.current.readyState >= 1) {
                try { videoRef.current.currentTime = startTime; } catch { }
                setCurrentTime(startTime);
                hasInitializedRef.current = true;
            }
        }
    }, [startTime]);

    if (useIframe && iframeUrl) {
        return (
            <div className="relative w-full aspect-video bg-black rounded-[30px] overflow-hidden ring-1 ring-white/10 shadow-2xl">
                <iframe
                    src={iframeUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="autoplay; fullscreen; encrypted-media"
                    title={title || 'Player'}
                />
                {title && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 pointer-events-none z-10 shadow-lg shadow-black/50">
                        <span className="text-[9px] font-black text-white uppercase tracking-widest truncate max-w-xs block">{title}</span>
                    </div>
                )}
            </div>
        );
    }

    if (useIframe && !iframeUrl && !url) {
        return (
            <div className="w-full aspect-video bg-black rounded-[30px] flex items-center justify-center ring-1 ring-white/10 shadow-2xl">
                <div className="text-zinc-500 text-sm font-bold uppercase tracking-widest flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" /> No stream available
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            className={cn(
                "group relative w-full bg-black overflow-hidden font-sans select-none rounded-2xl shadow-2xl ring-1 ring-white/10 outline-none focus:outline-none focus-visible:ring-0 max-h-[80dvh]",
                showControls ? "cursor-auto" : "cursor-none"
            )}
            style={{ touchAction: 'none', aspectRatio: videoAspectRatio ? `${videoAspectRatio}` : '16 / 9' }}
            onClick={handleContainerClick}
            onKeyDown={handleKeyDown}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={showUI}
            onMouseLeave={() => { isPlaying && activeMenu === 'none' && setShowControls(false); endLongPress(); }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
        >
            <video
                ref={videoRef}
                poster={poster}
                className="w-full h-full object-contain transition-all duration-100 outline-none focus:outline-none"
                style={{ filter: isPiPActive ? 'none' : `brightness(${brightness})` }}
                onPlay={() => { setIsPlaying(true); updateBuffering(false); onPlay?.(); showUI(); }}
                onPause={() => { setIsPlaying(false); onPause?.(); if (canSaveRef.current) onInteract?.(); showUI(); }}
                onWaiting={() => { if (!seekOverlay) updateBuffering(true); }}
                onPlaying={() => { updateBuffering(false); setHasStarted(true); }}
                onCanPlay={() => updateBuffering(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                    if (videoRef.current) {
                        setDuration(videoRef.current.duration || 0);
                        if (videoRef.current.videoWidth && videoRef.current.videoHeight) {
                            const r = videoRef.current.videoWidth / videoRef.current.videoHeight;
                            if (r > 0.3 && r < 3) setVideoAspectRatio(r);
                        }
                        if (startTime > 0 && !hasSeekedStartTimeRef.current) {
                            try {
                                videoRef.current.currentTime = startTime;
                                setCurrentTime(startTime);
                                hasSeekedStartTimeRef.current = true;
                            } catch (err) { }
                        }
                        if (autoPlay) {
                            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
                                if (videoRef.current) {
                                    videoRef.current.muted = true;
                                    setIsMuted(true);
                                    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                                }
                            });
                        }
                    }
                }}
                onEnded={() => { if (canSaveRef.current) onInteract?.(); onEnded?.(); }}
                playsInline
                {...(trackSubtitles.length > 0 ? { crossOrigin: "anonymous" } : {})}
            >
                {trackSubtitles.map((sub, i) => (
                    <track key={i} kind="captions" src={sub.url || sub.file} label={sub.label} srcLang={sub.lang} default={false} />
                ))}
            </video>

            {activeCueText && currentSubtitle !== -1 && (
                <div
                    className={cn(
                        "absolute z-30 pointer-events-none text-center select-none whitespace-pre-line transition-all duration-300",
                        subStyle.bg === 'Bar' ? "left-0 right-0 w-full" : "left-1/2 -translate-x-1/2 w-[92%] sm:w-[85%] max-w-4xl"
                    )}
                    style={{
                        bottom: showControls
                            ? (isMobile ? '76px' : '70px')
                            : (isMobile ? '18px' : '30px'),
                        transform: subStyle.bg === 'Bar'
                            ? `translateY(${subStyle.lift === 'High' ? (isMobile ? '-60px' : '-100px') : subStyle.lift === 'Middle' ? (isMobile ? '-28px' : '-40px') : '0px'})`
                            : `translateX(-50%) translateY(${subStyle.lift === 'High' ? (isMobile ? '-60px' : '-100px') : subStyle.lift === 'Middle' ? (isMobile ? '-28px' : '-40px') : '0px'})`,
                        transition: 'bottom 0.3s ease-in-out, transform 0.3s ease-in-out',
                        backgroundColor: subStyle.bg === 'Bar' ? `rgba(0,0,0, ${(subStyle.opacity ?? 75) / 100})` : 'transparent',
                        padding: subStyle.bg === 'Bar' ? '6px 0' : '0',
                    }}
                >
                    <span
                        className={cn(
                            "px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg inline-block leading-snug tracking-normal max-w-full break-words"
                        )}
                        style={{
                            color: SUB_COLORS[subStyle.color as keyof typeof SUB_COLORS] || '#ffffff',
                            fontSize: subStyle.size === 'Small'
                                ? (isMobile ? '12px' : 'calc(10px + 0.8vw)')
                                : subStyle.size === 'Medium'
                                    ? (isMobile ? '14px' : 'calc(14px + 1.2vw)')
                                    : subStyle.size === 'Large'
                                        ? (isMobile ? '17px' : 'calc(18px + 1.6vw)')
                                        : (isMobile ? '20px' : 'calc(22px + 2vw)'),
                            fontFamily: SUB_FONTS[subStyle.font as keyof typeof SUB_FONTS],
                            backgroundColor: subStyle.bg === 'Box' ? `rgba(0,0,0, ${(subStyle.opacity ?? 75) / 100})` : subStyle.bg === 'Blur' ? `rgba(0,0,0, ${(subStyle.opacity ?? 45) / 100})` : 'transparent',
                            backdropFilter: subStyle.bg === 'Blur' ? 'blur(8px)' : 'none',
                            textShadow: (subStyle.bg === 'Outline' || subStyle.bg === 'None' || !subStyle.bg)
                                ? `2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000, 0px 2px 0px #000, 0px -2px 0px #000, 2px 0px 0px #000, -2px 0px 0px #000, 0px 0px 8px rgba(0,0,0,0.9)`
                                : 'none',
                            border: subStyle.bg === 'Blur' ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        }}
                    >
                        {activeCueText.replace(/<[^>]+>/g, '')}
                    </span>
                </div>
            )}

            {isLongPressing && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 text-white z-50 animate-in fade-in zoom-in-95">
                    <span className="text-[10px] font-black uppercase tracking-widest">2X Speed</span>
                    <ChevronsRight size={14} className="animate-pulse" />
                </div>
            )}

            {seekOverlay && (<div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-50 duration-200"><div className="bg-black/50 backdrop-blur-md py-4 rounded-full text-white font-black text-3xl tracking-widest border border-white/10 shadow-2xl">{seekOverlay}</div></div>)}
            {gestureOverlay && (<div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in-50 duration-200"><div className="bg-black/60 backdrop-blur-md p-6 rounded-full text-white border border-white/10 shadow-2xl mb-4">{gestureOverlay.icon}</div><span className="text-xl font-bold text-white text-shadow">{gestureOverlay.text}</span></div>)}

            {(!hasStarted || isBuffering) && !seekOverlay && !gestureOverlay && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden">
                    <MagicalWaveParticlesPlayerLoader text="INITIALIZING HINDI STREAM..." />
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                        <div className="relative w-36 h-36 flex items-center justify-center">
                            <img src="/run-happy.gif" alt="Loading..." className="w-28 h-28 object-contain relative z-10 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]" />
                            <div className="absolute bottom-2 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse" />
                        </div>
                        <p className="mt-2 font-lemon text-purple-400 animate-pulse tracking-[0.4em] text-[10px] font-bold uppercase drop-shadow">Loading Reality...</p>
                    </div>
                </div>
            )}

            {hasStarted && isBuffering && !seekOverlay && !gestureOverlay && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-[2px] p-4 rounded-full shadow-xl animate-in fade-in zoom-in-90 duration-300">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                </div>
            )}

            {/* Title Island with Cast */}
            <div className={cn("absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 max-w-[90%] w-auto", showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10")}>
                <div ref={titleContainerRef} className="bg-black/60 md:bg-black/80 border border-white/10 rounded-full px-4 py-1.5 md:py-2 shadow-2xl backdrop-blur-md flex items-center gap-3 overflow-hidden pointer-events-auto">
                    <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-pulse shadow-[0_0_8px_red] shrink-0" />

                    <div className="overflow-hidden w-full relative h-4 flex items-center">
                        <span ref={titleTextRef} className={cn("text-[9px] md:text-[10px] font-black text-gray-200 uppercase tracking-widest whitespace-nowrap", isTitleOverflowing && "animate-marquee-slow")}>{title || "Shadow Garden Player"}</span>
                    </div>

                    {castAvailable && (
                        <button onClick={(e) => { e.stopPropagation(); handleCast() }} className="text-primary-500 hover:text-white transition-colors hover:animate-pulse shrink-0">
                            <Cast size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* Play Button with Smooth Blur Transition */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                {!isBuffering && !seekOverlay && !gestureOverlay && (
                    <div onClick={(e) => { e.stopPropagation(); togglePlay(); }} className={cn("group/playbtn relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center pointer-events-auto cursor-pointer active:scale-95 transition-all duration-500", showControls ? "opacity-100 scale-100 hover:scale-110" : "opacity-0 scale-150 pointer-events-none")}>
                        {/* Glowing Liquid Glass Background */}
                        <div className="absolute inset-0 rounded-full bg-white/25 backdrop-blur-2xl border border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.3),inset_0_2px_4px_rgba(255,255,255,0.6)] group-hover/playbtn:bg-white/40 group-hover/playbtn:border-white/60 group-hover/playbtn:shadow-[0_0_45px_rgba(255,255,255,0.6)] transition-all duration-500 overflow-hidden">
                            {/* Glass Shine */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/70 to-transparent opacity-50 -translate-y-[40%] rounded-[100%] pointer-events-none" />
                        </div>
                        {isPlaying ? <Pause fill="white" size={28} className="md:w-8 md:h-8 relative z-10 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover/playbtn:scale-110" /> : <Play fill="white" size={28} className="ml-1 md:w-8 md:h-8 relative z-10 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover/playbtn:scale-110" />}
                    </div>
                )}
            </div>

            <div className={cn("absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end px-3 pb-3 md:px-6 md:pb-6 transition-opacity duration-300 z-[60] pointer-events-none", showControls ? "opacity-100" : "opacity-0")}>
                <div className="group/seek relative w-full h-4 flex items-center cursor-pointer mb-2 md:mb-4 pointer-events-auto" onMouseMove={handleSeekHover} onMouseLeave={() => setHoverTime(null)}>
                    {hoverTime !== null && (<div className="absolute bottom-6 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded-md text-[10px] font-mono text-white shadow-lg pointer-events-none" style={{ left: `${hoverPos}%` }}>{formatTime(hoverTime)}</div>)}
                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-primary-600" style={{ width: `${(currentTime / duration) * 100}%` }} /></div>
                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-600 border-2 border-white rounded-full shadow-[0_0_10px_white] scale-0 group-hover/seek:scale-100 transition-transform pointer-events-none" style={{ left: `calc(${Math.min(Math.max((currentTime / duration) * 100, 0), 100)}% - 8px)` }} />
                    <input type="range" min={0} max={duration || 100} step="0.1" value={currentTime} onMouseDown={handleSeekStart} onTouchStart={handleSeekStart} onChange={handleSeekChange} onMouseUp={handleSeekEnd} onTouchEnd={handleSeekEnd} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto" onClick={(e) => e.stopPropagation()} />
                </div>

                <div className="flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-2 md:gap-6">
                        <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="hover:text-primary-500 transition-colors active:scale-90 p-2 md:p-0">{isPlaying ? <Pause size={20} className="md:w-6 md:h-6" /> : <Play size={20} className="md:w-6 md:h-6" />}</button>
                        <div className="hidden md:flex items-center gap-1 md:gap-3">
                            <button onClick={(e) => { e.stopPropagation(); seek(-10); }} className="flex items-center gap-0.5 group/btn px-1.5 py-0.5 md:px-2 md:py-1 rounded-full border border-white/20 hover:border-primary-500 hover:bg-primary-500/10 transition-all active:scale-95"><ChevronsLeft size={12} className="md:w-[14px] text-white group-hover/btn:text-primary-500 transition-colors" /><span className="text-[8px] md:text-[10px] font-black text-white group-hover/btn:text-primary-500 transition-colors">10</span></button>
                            <button onClick={(e) => { e.stopPropagation(); seek(10); }} className="flex items-center gap-0.5 group/btn px-1.5 py-0.5 md:px-2 md:py-1 rounded-full border border-white/20 hover:border-primary-500 hover:bg-primary-500/10 transition-all active:scale-95"><span className="text-[8px] md:text-[10px] font-black text-white group-hover/btn:text-primary-500 transition-colors">10</span><ChevronsRight size={12} className="md:w-[14px] text-white group-hover/btn:text-primary-500 transition-colors" /></button>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 group/vol">
                            <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="p-2 md:p-0">
                                {isMuted || volume === 0 ? <VolumeX size={20} className="md:w-5 md:h-5" /> : <Volume2 size={20} className="md:w-5 md:h-5" />}
                            </button>
                            <div className="w-0 overflow-hidden md:group-hover/vol:w-20 active:w-20 transition-all duration-300 flex items-center">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.05" 
                                    value={isMuted ? 0 : volume} 
                                    onChange={handleVolumeChange} 
                                    className="w-16 md:w-full h-1 accent-red-600 cursor-pointer bg-white/20 rounded-full pointer-events-auto" 
                                    onClick={(e) => e.stopPropagation()} 
                                    onTouchStart={(e) => e.stopPropagation()} 
                                    onTouchMove={(e) => e.stopPropagation()} 
                                />
                            </div>
                        </div>
                        <div className="text-[10px] md:text-[10px] font-bold text-zinc-400 font-mono"><span className="text-white">{formatTime(currentTime)}</span> / {formatTime(duration)}</div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-5 relative">
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'main' ? 'none' : 'main'); }} className={cn("hover:text-primary-500 transition-colors active:scale-90 group p-2 md:p-0", activeMenu !== 'none' && activeMenu !== 'audio' && activeMenu !== 'subs' && "text-primary-500")}><Settings size={20} className="md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-500" /></button>

                            {activeMenu === 'main' && (
                                <div className="absolute bottom-12 right-0 bg-zinc-950/90 backdrop-blur-3xl border border-white/10 ring-1 ring-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] p-2 w-[180px] sm:w-52 max-h-[160px] sm:max-h-[220px] overflow-y-auto scrollbar-hide z-[70] flex flex-col gap-1 animate-in slide-in-from-bottom-2">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu('quality') }} className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:shadow-inner text-left text-[10px] sm:text-xs font-bold transition-all"><div className="flex items-center gap-1.5"><Settings size={13} /> Quality</div><span className="text-zinc-400 text-[9px] sm:text-[10px] truncate ml-2">{currentQuality === -1 ? autoResolutionText : `${qualities.find(q => q.index === currentQuality)?.height}p`}</span></button>
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu('speed') }} className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:shadow-inner text-left text-[10px] sm:text-xs font-bold transition-all"><div className="flex items-center gap-1.5"><Gauge size={13} /> Speed</div><span className="text-zinc-400 text-[9px] sm:text-[10px]">{speed}x</span></button>
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu('gestures') }} className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:shadow-inner text-left text-[10px] sm:text-xs font-bold transition-all"><div className="flex items-center gap-1.5"><MousePointerClick size={13} /> Gestures</div><span className="text-zinc-400 uppercase text-[9px] sm:text-[10px]">{doubleTapMode}</span></button>
                                    {castAvailable && (
                                        <button onClick={(e) => { e.stopPropagation(); handleCast(); setActiveMenu('none') }} className="lg:hidden flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:shadow-inner text-left text-[10px] sm:text-xs font-bold transition-all"><div className="flex items-center gap-1.5"><Cast size={13} /> Cast</div></button>
                                    )}
                                    <div className="lg:hidden border-t border-white/10 mt-1 pt-1">
                                        <button onClick={(e) => { e.stopPropagation(); setActiveMenu('vGesture') }} className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:shadow-inner text-left text-[10px] sm:text-xs font-bold transition-all"><div className="flex items-center gap-1.5"><MoveVertical size={13} /> V-Swipe</div><span className="text-zinc-400 text-[9px] uppercase">{verticalGesture === 'vol_bright' ? 'Vol/Bri' : verticalGesture}</span></button>
                                        <button onClick={(e) => { e.stopPropagation(); setActiveMenu('hGesture') }} className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:shadow-inner text-left text-[10px] sm:text-xs font-bold transition-all"><div className="flex items-center gap-1.5"><MoveHorizontal size={13} /> H-Swipe</div><span className="text-zinc-400 text-[9px] uppercase">{horizontalGesture === 'nav' ? 'Next/Prev' : horizontalGesture}</span></button>
                                    </div>
                                </div>
                            )}
                            {activeMenu === 'vGesture' && (
                                <div className="absolute bottom-12 right-0 bg-zinc-950/90 backdrop-blur-3xl border border-white/10 ring-1 ring-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] p-2 w-40 sm:w-48 max-h-[160px] sm:max-h-[200px] overflow-y-auto scrollbar-hide z-[70] flex flex-col gap-1 animate-in slide-in-from-bottom-2">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu('main') }} className="flex items-center gap-1.5 text-[10px] px-2 py-1 font-black text-zinc-400 border-b border-white/10 mb-0.5"><ChevronLeft size={13} /> BACK</button>
                                    {['vol_bright', 'fullscreen', 'none'].map(m => (<button key={m} onClick={(e) => { e.stopPropagation(); updateLocalPrefs({ verticalGesture: m }); setActiveMenu('main') }} className={cn("text-[10px] px-2.5 py-1.5 rounded-xl text-left font-bold uppercase transition-all", verticalGesture === m ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25 border border-primary-500/50" : "hover:bg-white/10 hover:shadow-inner text-zinc-400")}>{m === 'vol_bright' ? 'Vol/Bri' : m}</button>))}
                                </div>
                            )}
                            {activeMenu === 'hGesture' && (
                                <div className="absolute bottom-12 right-0 bg-zinc-950/90 backdrop-blur-3xl border border-white/10 ring-1 ring-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] p-2 w-40 sm:w-48 max-h-[160px] sm:max-h-[200px] overflow-y-auto scrollbar-hide z-[70] flex flex-col gap-1 animate-in slide-in-from-bottom-2">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu('main') }} className="flex items-center gap-1.5 text-[10px] px-2 py-1 font-black text-zinc-400 border-b border-white/10 mb-0.5"><ChevronLeft size={13} /> BACK</button>
                                    {['seek', 'nav', 'volume', 'none'].map(m => (<button key={m} onClick={(e) => { e.stopPropagation(); updateLocalPrefs({ horizontalGesture: m }); setActiveMenu('main') }} className={cn("text-[10px] px-2.5 py-1.5 rounded-xl text-left font-bold uppercase transition-all", horizontalGesture === m ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25 border border-primary-500/50" : "hover:bg-white/10 hover:shadow-inner text-zinc-400")}>{m === 'nav' ? 'Next / Prev' : m}</button>))}
                                </div>
                            )}

                            {activeMenu === 'quality' && (
                                <div className="absolute bottom-12 right-0 bg-zinc-950/90 backdrop-blur-3xl border border-white/10 ring-1 ring-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] p-2 w-32 sm:w-36 max-h-[160px] sm:max-h-[200px] overflow-y-auto scrollbar-hide z-[70] flex flex-col gap-1 animate-in slide-in-from-bottom-2">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu('main') }} className="flex items-center gap-1.5 text-[10px] px-2 py-1 font-black text-zinc-400 border-b border-white/10 mb-0.5"><ChevronLeft size={13} /> BACK</button>
                                    <button onClick={(e) => { e.stopPropagation(); changeQuality(-1) }} className={cn("text-[10px] px-2.5 py-1.5 rounded-xl text-left font-bold transition-all", currentQuality === -1 ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25 border border-primary-500/50" : "hover:bg-white/10 hover:shadow-inner text-zinc-400")}>Auto</button>
                                    {qualities.map(q => (<button key={q.index} onClick={(e) => { e.stopPropagation(); changeQuality(q.index) }} className={cn("text-[10px] px-2.5 py-1.5 rounded-xl text-left font-bold transition-all", currentQuality === q.index ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25 border border-primary-500/50" : "hover:bg-white/10 hover:shadow-inner text-zinc-400")}>{q.height}p</button>))}
                                </div>
                            )}
                            {activeMenu === 'speed' && (
                                <div className="absolute bottom-12 right-0 bg-zinc-950/90 backdrop-blur-3xl border border-white/10 ring-1 ring-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] p-2 w-28 sm:w-32 max-h-[160px] sm:max-h-[200px] overflow-y-auto scrollbar-hide z-[70] flex flex-col gap-1 animate-in slide-in-from-bottom-2">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu('main') }} className="flex items-center gap-1.5 text-[10px] px-2 py-1 font-black text-zinc-400 border-b border-white/10 mb-0.5"><ChevronLeft size={13} /> BACK</button>
                                    {[0.5, 1, 1.25, 1.5, 2].map(r => (<button key={r} onClick={(e) => { e.stopPropagation(); changeSpeed(r) }} className={cn("text-[10px] px-2.5 py-1.5 rounded-xl text-left font-bold transition-all", speed === r ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25 border border-primary-500/50" : "hover:bg-white/10 hover:shadow-inner text-zinc-400")}>{r}x</button>))}
                                </div>
                            )}
                            {activeMenu === 'gestures' && (
                                <div className="absolute bottom-12 right-0 bg-zinc-950/90 backdrop-blur-3xl border border-white/10 ring-1 ring-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] p-2 w-40 sm:w-48 max-h-[160px] sm:max-h-[200px] overflow-y-auto scrollbar-hide z-[70] flex flex-col gap-1 animate-in slide-in-from-bottom-2">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu('main') }} className="flex items-center gap-1.5 text-[10px] px-2 py-1 font-black text-zinc-400 border-b border-white/10 mb-0.5"><ChevronLeft size={13} /> BACK</button>
                                    {['seek', 'playpause', 'fullscreen'].map(m => (<button key={m} onClick={(e) => { e.stopPropagation(); updateLocalPrefs({ doubleTapMode: m }); setActiveMenu('none') }} className={cn("text-[10px] px-2.5 py-1.5 rounded-xl text-left font-bold uppercase transition-all", doubleTapMode === m ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25 border border-primary-500/50" : "hover:bg-white/10 hover:shadow-inner text-zinc-400")}>{m}</button>))}
                                </div>
                            )}
                        </div>

                        {audioTracks.length > 1 && (<div className="relative"><button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'audio' ? 'none' : 'audio'); }} className={cn("hover:text-primary-500 transition-colors active:scale-90 p-2 md:p-0", activeMenu === 'audio' && "text-primary-500")}><AudioWaveform size={20} className="md:w-5 md:h-5" /></button>{activeMenu === 'audio' && (<div className="absolute bottom-12 right-0 bg-zinc-950/90 backdrop-blur-3xl border border-white/10 ring-1 ring-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] p-2 w-40 sm:w-48 max-h-[160px] sm:max-h-[200px] overflow-y-auto scrollbar-hide z-[70] flex flex-col gap-1 animate-in slide-in-from-bottom-2">{audioTracks.map((t, i) => (<button key={i} onClick={(e) => { e.stopPropagation(); changeAudio(i); }} className={cn("text-[10px] px-2.5 py-1.5 rounded-xl text-left font-bold transition-all truncate active:scale-95", currentAudio === i ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25 border border-primary-500/50" : "hover:bg-white/10 hover:shadow-inner text-zinc-400")}>{t.name || `Audio ${i + 1}`}</button>))}</div>)}</div>)}

                        {trackSubtitles.length > 0 && (
                            <div className="relative">
                                <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'subs' ? 'none' : 'subs'); }} className={cn("hover:text-primary-500 transition-colors active:scale-90 p-2 md:p-0", (activeMenu === 'subs' || currentSubtitle !== -1) ? "text-primary-500 fill-red-500" : "text-white")}><Subtitles size={20} className="md:w-5 md:h-5" /></button>
                                {activeMenu === 'subs' && (
                                    <div className="absolute bottom-12 right-0 bg-zinc-950/90 backdrop-blur-3xl border border-white/10 ring-1 ring-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] p-2 w-44 sm:w-52 max-h-[160px] sm:max-h-[200px] overflow-hidden z-[70] flex flex-col animate-in slide-in-from-bottom-2">
                                        <button onClick={(e) => { e.stopPropagation(); setActiveMenu('subSettings'); }} className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-xl text-left font-black text-primary-500 hover:bg-white/5 transition-all mb-1 border-b border-white/10 shrink-0"><Settings size={12} /> CAPTION SETTINGS</button>
                                        <div className="overflow-y-auto flex-1 flex flex-col gap-1 scrollbar-hide">
                                            <button onClick={(e) => { e.stopPropagation(); changeSubtitle(-1); }} className={cn("text-[10px] px-2.5 py-1.5 rounded-xl text-left font-bold transition-all active:scale-95 shrink-0", currentSubtitle === -1 ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25 border border-primary-500/50" : "hover:bg-white/10 hover:shadow-inner text-zinc-400")}>Off</button>
                                            {trackSubtitles.map((t, i) => (
                                                <button key={i} onClick={(e) => { e.stopPropagation(); changeSubtitle(i); }} className={cn("text-[10px] px-2.5 py-1.5 rounded-xl text-left font-bold transition-all truncate active:scale-95 shrink-0", currentSubtitle === i ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25 border border-primary-500/50" : "hover:bg-white/10 hover:shadow-inner text-zinc-400")}>{t.label || t.name || t.lang}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {activeMenu === 'subSettings' && (
                                    <div className="absolute bottom-12 right-0 bg-zinc-950/95 backdrop-blur-3xl border border-white/10 ring-1 ring-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.9)] p-3 w-[220px] sm:w-60 md:w-64 max-h-[180px] sm:max-h-[260px] overflow-y-auto scrollbar-hide z-[70] flex flex-col gap-2.5 animate-in slide-in-from-bottom-2" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-zinc-400 border-b border-white/10 pb-1.5"><button onClick={(e) => { e.stopPropagation(); setActiveMenu('subs') }} className="hover:text-white"><ChevronLeft size={13} /></button> CAPTION STYLE</div>
                                        <div className="space-y-1"><span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase">Color</span><div className="flex gap-1.5 flex-wrap">{Object.keys(SUB_COLORS).map((c) => (<button key={c} onClick={(e) => { e.stopPropagation(); updateLocalPrefs({ subStyle: { color: c } }) }} className={cn("w-5 h-5 sm:w-6 sm:h-6 rounded-full border transition-all active:scale-90 shrink-0", subStyle.color === c ? "border-white scale-110 shadow-md" : "border-transparent opacity-60")} style={{ background: SUB_COLORS[c as keyof typeof SUB_COLORS] }} />))}</div></div>
                                        <div className="space-y-1"><span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase">Size</span><div className="flex gap-1 bg-white/5 rounded-xl p-1">{Object.keys(SUB_SIZES).map((s) => (<button key={s} onClick={(e) => { e.stopPropagation(); updateLocalPrefs({ subStyle: { size: s } }) }} className={cn("flex-1 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all active:scale-90 shrink-0", subStyle.size === s ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-zinc-200")}>{s}</button>))}</div></div>
                                        <div className="space-y-1"><span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase">Background</span><div className="flex gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto scrollbar-hide">{Object.keys(SUB_BACKGROUNDS).map((b) => (<button key={b} onClick={(e) => { e.stopPropagation(); updateLocalPrefs({ subStyle: { bg: b } }) }} className={cn("px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all active:scale-90 whitespace-nowrap shrink-0", subStyle.bg === b ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-zinc-200")}>{b}</button>))}</div></div>

                                        {/* Opacity Slider */}
                                        <div className="space-y-1 mt-0.5">
                                            <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase flex justify-between">Opacity <span>{subStyle.opacity ?? 75}%</span></span>
                                            <input
                                                type="range"
                                                min="10"
                                                max="100"
                                                value={subStyle.opacity ?? 75}
                                                onChange={(e) => { e.stopPropagation(); updateLocalPrefs({ subStyle: { opacity: parseInt(e.target.value) } }) }}
                                                className="w-full accent-primary-500 bg-white/10 rounded-full h-1 cursor-pointer pointer-events-auto"
                                                onClick={(e) => e.stopPropagation()}
                                                onTouchStart={(e) => e.stopPropagation()}
                                                onTouchMove={(e) => e.stopPropagation()}
                                            />
                                        </div>

                                        <div className="space-y-1"><span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase">Position</span><div className="flex gap-1 bg-white/5 rounded-xl p-1">{Object.keys(SUB_LIFTS).map((l) => (<button key={l} onClick={(e) => { e.stopPropagation(); updateLocalPrefs({ subStyle: { lift: l } }) }} className={cn("flex-1 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all active:scale-90 shrink-0", subStyle.lift === l ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-zinc-200")}>{l}</button>))}</div></div>
                                        <div className="space-y-1"><span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase">Font</span><div className="flex gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto scrollbar-hide">{Object.keys(SUB_FONTS).map((f) => (<button key={f} onClick={(e) => { e.stopPropagation(); updateLocalPrefs({ subStyle: { font: f } }) }} className={cn("px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all active:scale-90 whitespace-nowrap shrink-0", subStyle.font === f ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-zinc-200")}>{f}</button>))}</div></div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button onClick={(e) => { e.stopPropagation(); togglePiP(); }} className="hover:text-primary-500 transition-colors active:scale-90 p-2 md:p-0"><PictureInPicture size={20} className="md:w-5 md:h-5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="hover:text-primary-500 transition-colors active:scale-90 p-2 md:p-0"><Maximize size={20} className="md:w-5 md:h-5" /></button>
                    </div>
                </div>
            </div>
            {showSkipIntro && (<button onClick={(e) => { e.stopPropagation(); if (videoRef.current && intro) { videoRef.current.currentTime = intro.end; setCurrentTime(intro.end); if (canSaveRef.current) onInteract?.(); onSkipIntro?.(); } }} className="absolute bottom-20 left-6 liquid-glass hover:bg-white text-white hover:text-black px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-left duration-500 z-50 active:scale-95"><Wand2 size={12} /> Skip Intro</button>)}
            {!isPlaying && duration > 0 && Math.abs(currentTime - duration) < 1 && onNext && (<button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute bottom-24 right-6 liquid-glass text-white py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_30px_white] z-50 animate-bounce active:scale-95">Next Episode <ChevronRight size={14} /></button>)}
            <style jsx>{` @keyframes slide-fast { from { transform: translateX(-100%); } to { transform: translateX(100%); } } .animate-slide-fast { animation: slide-fast 1.5s infinite linear; } .animate-marquee-slow { animation: marquee 10s linear infinite; } @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } `}</style>
        </div>
    );
});
HindiPlayer.displayName = "HindiPlayer";
export default HindiPlayer;