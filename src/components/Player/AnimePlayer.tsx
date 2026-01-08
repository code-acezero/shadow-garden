import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
// @ts-ignore
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Strategy: Try Direct first, then Proxy
  // We use ThingProxy as fallback because it handles heavy video traffic well
  const PROXY = 'https://thingproxy.freeboard.io/fetch/';

  useEffect(() => {
    if (!url || !videoRef.current) return;
    const video = videoRef.current;
    
    // Reset Error
    setErrorMsg(null);

    // 1. CLEANUP
    if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
    }
    if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
    }

    // 2. INITIALIZE PLYR UI (Immediately visible)
    const player = new Plyr(video, {
        controls: [
            'play-large', 'play', 'rewind', 'fast-forward', 'progress',
            'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'
        ],
        settings: ['quality', 'speed'],
        seekTime: 10,
        keyboard: { focused: true, global: true },
        tooltips: { controls: true, seek: true }
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

    player.on('ended', () => { if (onEnded) onEnded(); });
    
    // Save reference
    playerRef.current = player;

    // 3. LOAD STREAM
    // We try to load DIRECTLY first (no proxy). 
    // Hls.js will automatically fail over if CORS blocks it.
    let finalUrl = url;

    if (Hls.isSupported() && url.includes('.m3u8')) {
        const hls = new Hls({
            enableWorker: false,
            lowLatencyMode: true,
            // Only use proxy if direct fails (handled via error event below) or if we force it
            xhrSetup: (xhr, reqUrl) => {
               // If we are in "Proxy Mode" (detected by url), ensure segments are proxied too
               if (finalUrl.includes('thingproxy') && !reqUrl.includes('thingproxy')) {
                   xhr.open('GET', PROXY + encodeURIComponent(reqUrl), true);
               }
            }
        });

        const loadStream = (streamUrl: string) => {
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
        };

        // Attempt Load
        loadStream(finalUrl);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
             // Create Quality Levels
             const availableQualities = hls.levels.map((l) => l.height);
             availableQualities.unshift(0); // Auto

             // @ts-ignore
             player.config.quality = {
                 default: 0,
                 options: availableQualities,
                 forced: true,
                 onChange: (newQuality: number) => {
                     hls.levels.forEach((level, levelIndex) => {
                         if (level.height === newQuality) hls.currentLevel = levelIndex;
                     });
                 },
             };
             video.play().catch(() => {});
        });

        // ERROR HANDLING & RETRY
        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    console.warn("Network Error:", data);
                    // If Direct fails, Try Proxy
                    if (!finalUrl.includes('thingproxy')) {
                        console.log("Switching to Proxy...");
                        hls.destroy();
                        // Re-init HLS with Proxy URL
                        finalUrl = PROXY + encodeURIComponent(url);
                        // We need a brief timeout to let destroy finish
                        setTimeout(() => {
                           // Re-create HLS instance for proxy mode
                           const newHls = new Hls({ enableWorker: false, lowLatencyMode: true });
                           newHls.loadSource(finalUrl);
                           newHls.attachMedia(video);
                           newHls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(()=>{}));
                           hlsRef.current = newHls;
                        }, 500);
                    } else {
                        // Proxy also failed
                        setErrorMsg(`Stream Error: ${data.details}`);
                        hls.destroy();
                    }
                } else {
                    hls.destroy();
                    setErrorMsg("Media Format Error");
                }
            }
        });

        hlsRef.current = hls;

    } else {
        // Native HLS (Safari)
        video.src = finalUrl;
        video.addEventListener('error', () => {
             // Retry with proxy for Native
             if (!video.src.includes('thingproxy')) {
                 video.src = PROXY + encodeURIComponent(url);
             } else {
                 setErrorMsg("Playback Failed");
             }
        });
    }

    return () => {
        if (hlsRef.current) hlsRef.current.destroy();
        if (playerRef.current) playerRef.current.destroy();
    };
  }, [url, intro, outro, autoSkip, onEnded, onNext]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10 aspect-video anime-plyr-wrapper relative">
        <video 
            ref={videoRef} 
            className="plyr-video w-full h-full object-contain" 
            crossOrigin="anonymous" 
            playsInline
        />

        {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-[100] text-center p-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-2" />
                <h3 className="text-xl font-bold text-white">Playback Error</h3>
                <p className="text-zinc-400 mb-4">{errorMsg}</p>
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
            .plyr__video-wrapper { height: 100%; }
        `}</style>
    </div>
  );
}