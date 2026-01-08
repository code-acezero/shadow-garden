import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
// @ts-ignore - Supress "no default export" error (Plyr works fine at runtime)
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

interface AnimePlayerProps {
  url: string;
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  autoSkip?: boolean;
  onEnded?: () => void;
  onNext?: () => void;
  headers?: Record<string, string>;
}

export default function AnimePlayer({ url, intro, outro, autoSkip = false, onEnded, onNext }: AnimePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // --- PROXY STRATEGY ---
  const PROXY = 'https://api.codetabs.com/v1/proxy?quest=';

  useEffect(() => {
    if (!url || !videoRef.current) return;
    const video = videoRef.current;

    // 1. Cleanup old instances
    if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
    }
    if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
    }

    // 2. Prepare Proxy URL
    const finalUrl = url.startsWith('http') && !url.includes('cors') 
        ? PROXY + encodeURIComponent(url) 
        : url;

    // Helper to setup Plyr UI
    const initPlyr = () => {
        const player = new Plyr(video, {
            controls: [
                'play-large', 'play', 'rewind', 'fast-forward', 'progress',
                'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'
            ],
            settings: ['quality', 'speed'],
            seekTime: 10,
            keyboard: { focused: true, global: true },
        });

        // Auto-Skip Logic
        player.on('timeupdate', () => {
            const ct = player.currentTime;
            if (intro && autoSkip && ct > intro.start && ct < intro.end) {
                player.currentTime = intro.end;
            }
            if (outro && autoSkip && ct > outro.start && ct < outro.end) {
                if (onNext) onNext();
            }
        });

        player.on('ended', () => {
             if (onEnded) onEnded();
        });

        playerRef.current = player;
    };

    // 3. Initialize HLS
    if (Hls.isSupported() && url.includes('.m3u8')) {
        const hls = new Hls({
            enableWorker: false,
            lowLatencyMode: true,
            // CRITICAL: Force every request through the proxy
            xhrSetup: (xhr, reqUrl) => {
                if (reqUrl && !reqUrl.includes('codetabs')) {
                    const target = PROXY + encodeURIComponent(reqUrl);
                    xhr.open('GET', target, true);
                }
            }
        });

        hls.loadSource(finalUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            // Setup Quality Selector for Plyr
            const availableQualities = hls.levels.map((l) => l.height);
            availableQualities.unshift(0); // Add 'Auto'

            initPlyr();

            // Hook quality selector
            if (playerRef.current) {
                const player = playerRef.current;
                // @ts-ignore - Allow dynamic config update
                player.config.quality = {
                    default: 0,
                    options: availableQualities,
                    forced: true,
                    onChange: (newQuality: number) => {
                        hls.levels.forEach((level, levelIndex) => {
                            if (level.height === newQuality) {
                                hls.currentLevel = levelIndex;
                            }
                        });
                    },
                };
            }
            
            video.play().catch(() => {});
        });

        hlsRef.current = hls;

    } else {
        // Native HLS or MP4
        video.src = finalUrl;
        initPlyr();
    }

    return () => {
        if (hlsRef.current) hlsRef.current.destroy();
        if (playerRef.current) playerRef.current.destroy();
    };
  }, [url, intro, outro, autoSkip, onEnded, onNext]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10 aspect-video anime-plyr-wrapper">
        <video 
            ref={videoRef} 
            className="plyr-video w-full h-full" 
            crossOrigin="anonymous" 
            playsInline
        />
        
        <style>{`
            .anime-plyr-wrapper .plyr {
                height: 100%;
                width: 100%;
                --plyr-color-main: #dc2626; /* Red Theme */
            }
        `}</style>
    </div>
  );
}