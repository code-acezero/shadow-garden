"use client";

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Settings, Maximize, Subtitles, Gauge, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Loader2, PictureInPicture, Server as ServerIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DramaPlayerProps {
  /** HLS or MP4 url — if present, tries to play natively first */
  url?: string | null;
  /** Fallback iframe URL when url is absent or HLS fails to load */
  iframeUrl?: string | null;
  title?: string;
  poster?: string;
  referer?: string | null;
  autoPlay?: boolean;
  startTime?: number;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onProgress?: (s: { playedSeconds: number }) => void;
  onInteract?: () => void;
  initialVolume?: number;
  episodes?: { id: string; number: number; title: string; }[];
  currentEpId?: string | null;
  onEpisodeSelect?: (id: string) => void;
  servers?: { name: string; type: string; url?: string; }[];
  activeServerIdx?: number;
  onServerSelect?: (idx: number) => void;
}

export interface DramaPlayerRef {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (t: number) => void;
  focus: () => void;
}

const DramaPlayer = forwardRef<DramaPlayerRef, DramaPlayerProps>(({
  url, iframeUrl, title, poster, referer, autoPlay = true, startTime = 0,
  onEnded, onPlay, onPause, onProgress, onInteract, initialVolume = 1,
  episodes = [], currentEpId, onEpisodeSelect, servers = [], activeServerIdx = 0, onServerSelect
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hasInitRef = useRef(false);
  const canSaveRef = useRef(false);
  const ctTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [useIframe, setUseIframe] = useState(!url);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [speed, setSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [showServers, setShowServers] = useState(false);
  const [hlsFailed, setHlsFailed] = useState(false);

  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    getDuration: () => videoRef.current?.duration || 0,
    seekTo: (t: number) => { if (videoRef.current) { videoRef.current.currentTime = t; setCurrentTime(t); } },
    focus: () => containerRef.current?.focus(),
  }));

  const formatTime = (t: number) => {
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
    return h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}` : `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const showUI = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  // Decide whether to use iframe mode
  useEffect(() => {
    setUseIframe(!url || hlsFailed);
  }, [url, hlsFailed]);

  // HLS / video setup
  useEffect(() => {
    if (!url || useIframe) return;
    const video = videoRef.current;
    if (!video) return;

    setHasStarted(false);
    hasInitRef.current = false;
    setIsBuffering(true);
    if (hlsRef.current) hlsRef.current.destroy();

    canSaveRef.current = false;
    const cTimer = setTimeout(() => { canSaveRef.current = true; }, 8000);

    const finalUrl = url.startsWith('http')
      ? `/api/proxy?url=${encodeURIComponent(url)}${referer ? `&referer=${encodeURIComponent(referer)}` : ''}`
      : url;

    const isHls = !url.toLowerCase().includes('.mp4');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ capLevelToPlayerSize: true, startLevel: -1, startPosition: startTime > 0 ? startTime : -1 });
      hls.loadSource(finalUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((l, i) => ({ height: l.height, index: i })).sort((a, b) => b.height - a.height);
        setQualities(levels);
        setIsBuffering(false);
        if (autoPlay) video.play().catch(() => {});
      });
      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        setIsBuffering(false);
        if (startTime > 0 && !hasInitRef.current) {
          video.currentTime = startTime;
          hasInitRef.current = true;
        }
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.warn('DramaPlayer: HLS fatal error, falling back to iframe', data);
          setHlsFailed(true);
        }
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isHls) {
      video.src = finalUrl;
      video.addEventListener('loadedmetadata', () => {
        if (startTime > 0 && !hasInitRef.current) { video.currentTime = startTime; hasInitRef.current = true; }
        if (autoPlay) video.play().catch(() => {});
      });
      video.addEventListener('error', () => setHlsFailed(true));
    } else {
      setHlsFailed(true);
    }

    return () => {
      clearTimeout(cTimer);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [url, useIframe]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play();
    else { videoRef.current.pause(); onInteract?.(); }
  };

  const seek = (d: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + d, duration));
    setCurrentTime(videoRef.current.currentTime);
    showUI();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const m = !isMuted;
    setIsMuted(m);
    videoRef.current.muted = m;
    setVolume(m ? 0 : 1);
    if (!m) videoRef.current.volume = 1;
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await containerRef.current?.requestFullscreen();
    else await document.exitFullscreen();
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await videoRef.current?.requestPictureInPicture();
    } catch {}
  };

  // Iframe mode
  if (useIframe && iframeUrl) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden ring-1 ring-white/10">
        <iframe
          src={iframeUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media"
          title={title || 'Drama Player'}
        />
        {title && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 pointer-events-none z-10">
            <span className="text-[9px] font-black text-white uppercase tracking-widest truncate max-w-xs block">{title}</span>
          </div>
        )}
      </div>
    );
  }

  // Loading / no source state
  if (useIframe && !iframeUrl) {
    return (
      <div className="w-full aspect-video bg-black rounded-2xl flex items-center justify-center ring-1 ring-white/10">
        <div className="text-zinc-500 text-sm font-bold">No stream available</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn("group relative w-full aspect-video bg-black overflow-hidden font-sans select-none rounded-2xl shadow-2xl ring-1 ring-white/10 outline-none", showControls ? "cursor-auto" : "cursor-none")}
      style={{ touchAction: 'none' }}
      onClick={() => { if (showControls) setShowControls(false); else showUI(); }}
      onMouseMove={showUI}
      onKeyDown={(e) => {
        if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
        if (e.code === 'ArrowRight') seek(10);
        if (e.code === 'ArrowLeft') seek(-10);
        if (e.code === 'KeyF') toggleFullscreen();
        showUI();
      }}
    >
      {/* Click-to-close menus overlay */}
      {(showSettings || showEpisodes || showServers) && (
        <div className="absolute inset-0 z-40 cursor-auto" onClick={(e) => { e.stopPropagation(); setShowSettings(false); setShowEpisodes(false); setShowServers(false); }} />
      )}
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain outline-none"
        onPlay={() => { setIsPlaying(true); setIsBuffering(false); onPlay?.(); showUI(); }}
        onPause={() => { setIsPlaying(false); onPause?.(); }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsBuffering(false); setHasStarted(true); }}
        onCanPlay={() => setIsBuffering(false)}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v) return;
          setCurrentTime(v.currentTime);
          if (!hasStarted && v.currentTime > 0) setHasStarted(true);
          if (canSaveRef.current) onProgress?.({ playedSeconds: v.currentTime });
        }}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={() => { onInteract?.(); onEnded?.(); }}
        playsInline
      />

      {/* Buffering */}
      {isBuffering && !hasStarted && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <img src="/run-happy.gif" alt="Loading" className="w-24 h-24 object-contain" />
          <p className="mt-3 font-[Cinzel] text-primary-500 animate-pulse tracking-[0.4em] text-[10px] uppercase">Loading Drama...</p>
        </div>
      )}
      {isBuffering && hasStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 backdrop-blur-sm p-4 rounded-full"><Loader2 className="w-10 h-10 text-white animate-spin" /></div>
        </div>
      )}

      {/* Title */}
      <div className={cn("absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 max-w-[85%]", showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8")}>
        <div className="bg-black/70 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-pulse shrink-0" />
          <span className="text-[9px] font-black text-gray-200 uppercase tracking-widest truncate">{title || "Shadow Garden"}</span>
        </div>
      </div>

      {/* Center Play Button */}
      <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none z-20 transition-all duration-500", showControls ? "opacity-100" : "opacity-0 scale-150")}>
        {!isBuffering && (
          <div onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-14 h-14 md:w-16 md:h-16 bg-primary-600/20 backdrop-blur-md border border-primary-500/50 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] pointer-events-auto cursor-pointer hover:scale-110 active:scale-95 transition-all">
            {isPlaying ? <Pause fill="white" size={24} /> : <Play fill="white" size={24} className="ml-1" />}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className={cn("absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end px-3 pb-3 md:px-6 md:pb-5 transition-opacity duration-300 z-30 pointer-events-none", showControls ? "opacity-100" : "opacity-0")}>
        {/* Progress */}
        <div className="w-full h-4 flex items-center mb-2 pointer-events-auto cursor-pointer relative group/seek">
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-600 border-2 border-white rounded-full shadow-lg scale-0 group-hover/seek:scale-100 transition-transform pointer-events-none" style={{ left: `calc(${duration ? Math.min((currentTime / duration) * 100, 100) : 0}% - 8px)` }} />
          <input type="range" min={0} max={duration || 100} step="0.1" value={currentTime}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            onMouseUp={(e) => { const t = parseFloat(e.currentTarget.value); if (videoRef.current) { videoRef.current.currentTime = t; setCurrentTime(t); } onInteract?.(); }}
            onTouchEnd={(e) => { const t = parseFloat(e.currentTarget.value); if (videoRef.current) { videoRef.current.currentTime = t; setCurrentTime(t); } onInteract?.(); }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between pointer-events-auto mt-2">
          <div className="flex items-center gap-2 md:gap-5">
            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="hover:text-primary-500 transition-colors active:scale-90 text-white">
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <div className="text-[11px] font-bold text-zinc-400 font-mono hidden md:block"><span className="text-white">{formatTime(currentTime)}</span> / {formatTime(duration)}</div>
            
            {/* Integrated Episodes Menu */}
            {episodes && episodes.length > 0 && (
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowEpisodes(!showEpisodes); setShowServers(false); setShowSettings(false); }} className={cn("text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all active:scale-95 text-white", showEpisodes ? "bg-primary-600 border-primary-500" : "bg-white/10 border-white/20 hover:border-primary-500")}>
                  Episodes
                </button>
                {showEpisodes && (
                  <div className="absolute bottom-full mb-4 left-0 bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl p-2 w-64 shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-bottom-2 max-h-64 overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                    <p className="text-[10px] font-black text-zinc-500 uppercase px-3 pb-2 pt-1 sticky top-0 bg-black/90 z-10 border-b border-white/10">Select Episode</p>
                    {episodes.map(ep => (
                      <button key={ep.id} onClick={() => { onEpisodeSelect?.(ep.id); setShowEpisodes(false); }} className={cn("text-[11px] px-3 py-2 rounded-xl text-left font-bold transition-all flex items-center justify-between group", currentEpId === ep.id ? "bg-primary-600 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10")}>
                        <span className="truncate">EP {ep.number}: {ep.title}</span>
                        {currentEpId === ep.id && <Play size={10} className="shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Integrated Servers Menu */}
            {servers && servers.length > 0 && (
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowServers(!showServers); setShowEpisodes(false); setShowSettings(false); }} className={cn("text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all active:scale-95 text-white flex items-center gap-2", showServers ? "bg-primary-600 border-primary-500" : "bg-white/10 border-white/20 hover:border-primary-500")}>
                  <ServerIcon size={12} className="hidden md:block" /> {servers[activeServerIdx]?.name || 'Server'}
                </button>
                {showServers && (
                  <div className="absolute bottom-full mb-4 left-0 bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl p-2 w-56 shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-bottom-2" onClick={(e) => e.stopPropagation()}>
                    <p className="text-[10px] font-black text-zinc-500 uppercase px-3 pb-2 pt-1 border-b border-white/10">Audio / Server</p>
                    {servers.map((srv, idx) => (
                      <button key={idx} onClick={() => { onServerSelect?.(idx); setShowServers(false); }} className={cn("text-[11px] px-3 py-2 rounded-xl text-left font-bold transition-all flex items-center justify-between", activeServerIdx === idx ? "bg-primary-600 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10")}>
                        <span>{srv.name}</span>
                        <span className={cn("text-[8px] px-2 py-0.5 rounded-full", srv.type === 'hls' ? "bg-green-900/50 text-green-400" : "bg-zinc-800 text-zinc-400")}>{srv.type === 'hls' ? 'HLS' : 'Embed'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4 relative">
            <div className="relative z-50">
              <button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setShowEpisodes(false); setShowServers(false); }} className={cn("hover:text-primary-500 transition-colors active:scale-90 p-2 md:p-0 text-white", showSettings && "text-primary-500")}>
                <Settings size={22} />
              </button>
              {showSettings && (
                <div className="absolute bottom-12 right-0 bg-black/85 backdrop-blur-md border border-white/10 rounded-2xl p-2 w-48 shadow-2xl z-50 flex flex-col gap-1 animate-in slide-in-from-bottom-2" onClick={(e) => e.stopPropagation()}>
                  <p className="text-[10px] font-black text-zinc-500 uppercase px-3 pb-1 border-b border-white/10">Quality</p>
                  <button onClick={() => { if (hlsRef.current) hlsRef.current.currentLevel = -1; setCurrentQuality(-1); }} className={cn("text-[11px] px-3 py-2 rounded-full text-left font-bold transition-all", currentQuality === -1 ? "bg-primary-600 text-white" : "hover:bg-white/10")}>Auto</button>
                  {qualities.map(q => <button key={q.index} onClick={() => { if (hlsRef.current) hlsRef.current.currentLevel = q.index; setCurrentQuality(q.index); }} className={cn("text-[11px] px-3 py-2 rounded-full text-left font-bold transition-all", currentQuality === q.index ? "bg-primary-600 text-white" : "hover:bg-white/10")}>{q.height}p</button>)}
                  <p className="text-[10px] font-black text-zinc-500 uppercase px-3 pb-1 border-b border-white/10 mt-1">Speed</p>
                  {[0.5, 1, 1.25, 1.5, 2].map(r => <button key={r} onClick={() => { if (videoRef.current) videoRef.current.playbackRate = r; setSpeed(r); }} className={cn("text-[11px] px-3 py-2 rounded-full text-left font-bold transition-all", speed === r ? "bg-primary-600 text-white" : "hover:bg-white/10")}>{r}x</button>)}
                </div>
              )}
            </div>
            <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="hover:text-primary-500 transition-colors active:scale-90 p-2 md:p-0 text-white"><Maximize size={22} /></button>
          </div>
        </div>
      </div>
    </div>
  );
});

DramaPlayer.displayName = "DramaPlayer";
export default DramaPlayer;
