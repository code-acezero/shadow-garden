import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
// @ts-ignore
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

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
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Use CodeTabs (Most reliable for handling Referer/CORS blocks)
  const PROXY = 'https://api.codetabs.com/v1/proxy?quest=';

  useEffect(() => {
    // 1. Reset State on new URL
    if (!url) return;
    setLoading(true);
    setErrorMsg(null);

    // 2. Destroy old instances
    if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
    }
    if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
    }

    // 3. Prepare URL
    const finalUrl = url.startsWith('http') && !url.includes('cors') 
        ? PROXY + encodeURIComponent(url) 
        : url;

    // 4. Initialize Player & Stream
    const initPlayer = () => {
        const video = videoRef.current;
        if (!video) return;

        // A. Setup HLS First (Prepare the stream)
        if (Hls.isSupported() && url.includes('.m3u8')) {
            const hls = new Hls({
                enableWorker: false,
                lowLatencyMode: true,
                xhrSetup: (xhr, reqUrl) => {
                    // Force proxy for segments
                    if (reqUrl && !reqUrl.includes('codetabs')) {
                        xhr.open('GET', PROXY + encodeURIComponent(reqUrl), true);
                    }
                }
            });

            hls.loadSource(finalUrl);

            // B. Wait for Manifest, THEN Initialize Plyr
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setLoading(false);
                
                // Initialize Plyr
                const player = new Plyr(video, {
                    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
                    settings: ['quality', 'speed'],
                    seekTime: 10,
                });

                // FIX: Cast 'player' to 'any' to access the hidden .media property
                const plyrInstance = player as any;
                hls.attachMedia(plyrInstance.media);
                
                // Handle Quality Levels
                const levels = hls.levels.map(l => l.height);
                levels.unshift(0); // Auto
                
                // @ts-ignore
                player.config.quality = {
                    default: 0,
                    options: levels,
                    forced: true,
                    onChange: (q: number) => {
                        hls.levels.forEach((lvl, i) => { if (lvl.height === q) hls.currentLevel = i; });
                    }
                };

                // Auto Skip Logic
                player.on('timeupdate', () => {
                    const t = player.currentTime;
                    if (intro && autoSkip && t > intro.start && t < intro.end) player.currentTime = intro.end;
                    if (outro && autoSkip && t > outro.start && t < outro.end && onNext) onNext();
                });

                player.on('ended', () => onEnded && onEnded());

                // Save Reference
                playerRef.current = player;
                
                // Try Play
                const playPromise = player.play();
                if (playPromise) playPromise.catch(() => {});
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else {
                        setErrorMsg(`Stream Error: ${data.details}`);
                        hls.destroy();
                    }
                }
            });

            hlsRef.current = hls;

        } else {
            // Native HLS (Safari)
            video.src = finalUrl;
            const player = new Plyr(video, { controls: ['play-large', 'play', 'progress', 'fullscreen'] });
            playerRef.current = player;
            setLoading(false);
        }
    };

    // Small timeout to ensure DOM is ready
    const t = setTimeout(initPlayer, 100);
    return () => clearTimeout(t);

  }, [url, intro, outro, autoSkip]); // Re-run when these change

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10 aspect-video relative anime-plyr-wrapper">
        
        {/* The Video Element */}
        <video 
            ref={videoRef} 
            className="plyr-video w-full h-full" 
            crossOrigin="anonymous" 
            playsInline 
        />

        {/* Loading Spinner */}
        {loading && !errorMsg && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
            </div>
        )}

        {/* Error Screen */}
        {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30 text-center p-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-2" />
                <h3 className="text-xl font-bold text-white">Playback Error</h3>
                <p className="text-zinc-400 mb-4 text-sm">{errorMsg}</p>
                <button 
                   onClick={() => window.location.reload()} 
                   className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold"
                >
                    <RefreshCw size={16} /> Retry
                </button>
            </div>
        )}

        <style>{`
            .anime-plyr-wrapper .plyr {
                height: 100%;
                width: 100%;
                --plyr-color-main: #dc2626;
                --plyr-video-background: #000;
            }
        `}</style>
    </div>
  );
}