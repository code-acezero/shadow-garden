"use client";

import React, { useRef, useState, useEffect } from 'react';
import { MediaPlayer } from '@vidstack/react';

// Custom icons
import {
  Loader2,
  AlertCircle,
  SkipForward,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Play,
  Pause,
  ChevronDown,
  Monitor,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Slider } from '@/components/ui/slider';

export interface VidstackPlayerProps {
  url: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onNext?: () => void;
  onError?: (error: Error) => void;
  subtitles?: Array<{
    url: string;
    lang: string;
    label: string;
    default?: boolean;
  }>;
  serverName?: string;
}

export default function VidstackPlayer({
  url,
  title = "Stream",
  poster,
  autoPlay = false,
  onEnded,
  onNext,
  onError,
  subtitles = [],
  serverName = "auto",
}: VidstackPlayerProps) {
  const playerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qualities, setQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [playerState, setPlayerState] = useState({
    paused: true,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    muted: false,
  });

  // Ensure URL is properly proxied
  const getProxiedUrl = (originalUrl: string): string => {
    if (!originalUrl) return '';
    
    if (originalUrl.includes('/api/proxy')) {
      return originalUrl;
    }
    
    if (originalUrl.includes('.m3u8') || originalUrl.includes('mpegurl')) {
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      return `${base}/api/proxy?url=${encodeURIComponent(originalUrl)}&referer=https://megacloud.blog/`;
    }
    
    return originalUrl;
  };

  const proxiedUrl = getProxiedUrl(url);

  // Handle player events
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleReady = () => {
      console.log('Player ready');
      setIsLoading(false);
      
      // Get video element
      const video = player.querySelector('video') as HTMLVideoElement | null;
      if (video) {
        videoRef.current = video;
        
        // Set up video event listeners
        video.addEventListener('play', () => {
          setPlayerState(prev => ({ ...prev, paused: false }));
        });
        
        video.addEventListener('pause', () => {
          setPlayerState(prev => ({ ...prev, paused: true }));
        });
        
        video.addEventListener('timeupdate', () => {
          setPlayerState(prev => ({ ...prev, currentTime: video.currentTime }));
        });
        
        video.addEventListener('durationchange', () => {
          setPlayerState(prev => ({ ...prev, duration: video.duration }));
        });
        
        video.addEventListener('volumechange', () => {
          setPlayerState(prev => ({ 
            ...prev, 
            volume: video.volume,
            muted: video.muted 
          }));
        });
      }
    };

    const handleError = (e: any) => {
      console.error('Player error:', e);
      setError('Playback failed');
      setIsLoading(false);
      
      if (onError) {
        onError(new Error('Playback error'));
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    player.addEventListener('vds-ready', handleReady);
    player.addEventListener('vds-error', handleError);
    player.addEventListener('vds-can-play', handleCanPlay);
    player.addEventListener('vds-load-start', handleLoadStart);

    return () => {
      player.removeEventListener('vds-ready', handleReady);
      player.removeEventListener('vds-error', handleError);
      player.removeEventListener('vds-can-play', handleCanPlay);
      player.removeEventListener('vds-load-start', handleLoadStart);
    };
  }, [onError]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    
    if (playerRef.current) {
      playerRef.current.reload();
    }
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (playerState.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !playerState.muted;
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value[0];
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = playerState.currentTime + seconds;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Custom controls component
  const CustomControls = () => {
    const { paused, currentTime, duration, volume, muted } = playerState;

    return (
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${
        showControls || paused ? 'opacity-100' : 'opacity-0'
      }`}>
        
        {/* Progress bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPause}
              className="text-white hover:text-red-500 transition-colors"
            >
              {paused ? (
                <Play className="w-6 h-6" />
              ) : (
                <Pause className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={() => handleSkip(-10)}
              className="text-white hover:text-red-500 text-sm font-semibold"
            >
              -10s
            </button>

            <button
              onClick={() => handleSkip(10)}
              className="text-white hover:text-red-500 text-sm font-semibold"
            >
              +10s
            </button>

            <div className="flex items-center gap-2 group">
              <button
                onClick={handleToggleMute}
                className="text-white hover:text-red-500"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <div className="w-0 group-hover:w-24 transition-all duration-300 overflow-hidden">
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.05}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          {/* Center title */}
          <div className="text-center flex-1 px-4">
            <div className="text-sm font-semibold text-white truncate">{title}</div>
            {serverName && (
              <div className="text-xs text-gray-400 mt-1">
                Server: <span className="text-green-400">{serverName}</span>
              </div>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-4">
            {/* Quality selector */}
            {qualities.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-white hover:text-red-500 transition-colors flex items-center gap-1">
                    <Monitor className="w-5 h-5" />
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/95 border-white/10">
                  <DropdownMenuLabel>Quality</DropdownMenuLabel>
                  {qualities.map((quality, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => setCurrentQuality(index)}
                    >
                      {quality} {currentQuality === index && '✓'}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Playback speed */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-white hover:text-red-500 transition-colors">
                  <Zap className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/95 border-white/10">
                <DropdownMenuLabel>Speed</DropdownMenuLabel>
                {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.playbackRate = rate;
                      }
                    }}
                  >
                    {rate === 1 ? 'Normal' : `${rate}x`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Next episode */}
            {onNext && (
              <button
                onClick={onNext}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold text-white transition-colors"
              >
                <span>Next</span>
                <SkipForward className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="text-white hover:text-red-500 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
      <div className="relative">
        <Loader2 className="w-16 h-16 text-red-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
        </div>
      </div>
      <div className="mt-4 space-y-2 text-center">
        <p className="text-white font-semibold">Loading Stream</p>
      </div>
    </div>
  );

  // Error overlay
  const ErrorOverlay = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50 p-6">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">Stream Failed</h3>
      <p className="text-gray-300 text-center mb-6 max-w-md">{error}</p>
      
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          onClick={handleRetry}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Retry {retryCount > 0 && `(${retryCount})`}
        </Button>
        
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="flex items-center gap-2"
        >
          Reload Page
        </Button>
        
        {onNext && (
          <Button
            onClick={onNext}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Skip to Next
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-xl overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (!playerState.paused) {
          setTimeout(() => setShowControls(false), 1000);
        }
      }}
    >
      <MediaPlayer
        ref={playerRef}
        title={title}
        src={proxiedUrl}
        poster={poster}
        autoplay={autoPlay}
        playsinline
        crossorigin="anonymous"
        onVdsEnded={onEnded}
        controls={false} // We're using custom controls
      >
        {/* Custom Controls will be rendered here */}
      </MediaPlayer>

      {/* Render CustomControls outside MediaPlayer to avoid context issues */}
      <CustomControls />

      {/* Loading overlay */}
      {isLoading && <LoadingSpinner />}

      {/* Error overlay */}
      {error && <ErrorOverlay />}

      {/* Title overlay */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg max-w-md z-40">
        <h3 className="text-white font-bold text-lg truncate">{title}</h3>
        {serverName && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-300">Connected to {serverName}</span>
          </div>
        )}
      </div>
    </div>
  );
}