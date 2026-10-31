"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerPreviewProps {
  captionSize?: 'small' | 'medium' | 'large' | 'x-large';
  captionColor?: string;
  captionBg?: 'transparent' | 'semi-black' | 'solid-black' | 'blur';
  captionFont?: 'sans' | 'serif' | 'mono';
  playbackSpeed?: number;
  dimMode?: boolean;
}

const CUE_TIMESTAMPS = [
  { start: 0, end: 4.5, text: "I am Atomic. The shadows bow to no one." },
  { start: 4.5, end: 8.5, text: "Kagemi — Sanctuary of the Shadow Garden." },
  { start: 8.5, end: 12.5, text: "Through the endless night, our code remains absolute." },
  { start: 12.5, end: 16.5, text: "True power does not shout. It whispers in the void." },
  { start: 16.5, end: 20.0, text: "Enter the abyss. Witness the supreme majesty." }
];

export default function PlayerPreview({
  captionSize = 'medium',
  captionColor = '#ffffff',
  captionBg = 'semi-black',
  captionFont = 'sans',
  playbackSpeed = 1,
  dimMode = false,
}: PlayerPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(20);
  const [activeCue, setActiveCue] = useState<string>("I am Atomic. The shadows bow to no one.");

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    const match = CUE_TIMESTAMPS.find(c => t >= c.start && t < c.end);
    if (match) {
      setActiveCue(match.text);
    } else {
      setActiveCue(CUE_TIMESTAMPS[0].text);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Font size mapping
  const sizeClasses = {
    'small': 'text-xs sm:text-sm',
    'medium': 'text-sm sm:text-base font-medium',
    'large': 'text-base sm:text-lg font-bold',
    'x-large': 'text-lg sm:text-xl font-black',
  }[captionSize];

  // Font family mapping
  const fontFamilies = {
    'sans': "'Inter', system-ui, -apple-system, sans-serif",
    'serif': "'Georgia', 'Cambria', serif",
    'mono': "'JetBrains Mono', 'Courier New', monospace",
  }[captionFont];

  // Background styling mapping
  const bgStyles = {
    'transparent': 'bg-transparent text-shadow-heavy',
    'semi-black': 'bg-black/75 px-3 py-1 rounded-lg backdrop-blur-[2px] shadow-lg',
    'solid-black': 'bg-black px-3 py-1 rounded-md shadow-2xl',
    'blur': 'bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-xl',
  }[captionBg];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={cn(
      "w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-black/60 relative transition-all duration-300 shadow-2xl group",
      dimMode && "ring-2 ring-primary/40 shadow-[0_0_30px_rgba(var(--primary-color),0.25)]"
    )}>
      {/* Video Canvas */}
      <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          src="/videos/demo.mp4"
          playsInline
          loop
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration || 20);
          }}
          onClick={togglePlay}
          className="w-full h-full object-cover cursor-pointer select-none"
        />

        {/* Live Subtitle Overlay */}
        <div className="absolute bottom-12 inset-x-4 flex justify-center pointer-events-none select-none z-20">
          <div
            style={{
              color: captionColor,
              fontFamily: fontFamilies,
              textShadow: captionBg === 'transparent' ? '0 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)' : undefined,
            }}
            className={cn(
              "text-center transition-all duration-150 max-w-[90%] leading-relaxed tracking-wide",
              sizeClasses,
              bgStyles
            )}
          >
            {activeCue}
          </div>
        </div>

        {/* Play State Watermark on Pause */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 shadow-xl z-20"
          >
            <Play size={24} className="ml-1 fill-white" />
          </button>
        )}

        {/* Top Floating Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-20 pointer-events-none">
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-zinc-300">
            Live Player Preview
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
            {playbackSpeed}x
          </span>
        </div>

        {/* Bottom Controls Bar */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex flex-col gap-1.5 z-20 opacity-90 group-hover:opacity-100 transition-opacity">
          {/* Scrubber timeline */}
          <input
            type="range"
            min={0}
            max={duration || 20}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-primary"
          />

          <div className="flex items-center justify-between text-xs text-zinc-300 pt-0.5">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-1 rounded-md hover:bg-white/10 text-white transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-white" />}
              </button>

              <button
                onClick={handleRestart}
                className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                title="Restart"
              >
                <RotateCcw size={13} />
              </button>

              <button
                onClick={toggleMute}
                className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>

              <span className="text-[10px] font-mono text-zinc-400 ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              HD 1080p • Multi-Sub
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
