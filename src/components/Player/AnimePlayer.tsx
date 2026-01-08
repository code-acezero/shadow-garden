import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
// @ts-ignore - Ignores the "no default export" error common in strict TS configs
import Plyr, { APITypes } from 'plyr-react';
import 'plyr-react/plyr.css';

// --- CUSTOM STYLES FOR NETFLIX LOOK ---
const plyrOptions = {
  controls: [
    'play-large', 'play', 'rewind', 'fast-forward', 'progress',
    'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'
  ],
  settings: ['quality', 'speed'],
  seekTime: 10,
  keyboard: { focused: true, global: true },
  tooltips: { controls: true, seek: true },
  i18n: {
    speed: 'Speed',
    quality: 'Quality'
  }
};

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
  const ref = useRef<APITypes>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [source, setSource] = useState<Plyr.SourceInfo | null>(null);

  // --- PROXY STRATEGY ---
  const PROXY = 'https://api.codetabs.com/v1/proxy?quest=';

  useEffect(() => {
    if (!url) return;

    const isHls = url.includes('.m3u8');
    
    // Construct Proxy URL
    const finalUrl = url.startsWith('http') && !url.includes('cors') 
        ? PROXY + encodeURIComponent(url) 
        : url;

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        // PROXY INTERCEPTOR
        xhrSetup: (xhr, reqUrl) => {
            if (reqUrl && !reqUrl.includes('codetabs')) {
                const target = PROXY + encodeURIComponent(reqUrl);
                xhr.open('GET', target, true);
            }
        }
      });

      hls.loadSource(finalUrl);
      
      const updateQuality = (newQuality: any) => {
         if ((window as any).hls) {
            (window as any).hls.levels.forEach((level: any, levelIndex: number) => {
                if (level.height === newQuality) {
                   (window as any).hls.currentLevel = levelIndex;
                }
            });
         }
      };

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
         const availableQualities = hls.levels.map((l) => l.height);
         availableQualities.unshift(0); // 'Auto'

         // FIX: Cast to any to access .config which TS thinks is missing
         const playerInstance = ref.current?.plyr as any;
         
         if (playerInstance && playerInstance.config) {
             playerInstance.config.quality = {
                 default: 0,
                 options: availableQualities,
                 forced: true,
                 onChange: (e: any) => updateQuality(e),
             };
         }
      });

      hlsRef.current = hls;

      setSource({
        type: 'video',
        sources: [
          {
            src: finalUrl,
            type: 'application/x-mpegURL',
          },
        ],
      });

    } else {
      // Native / MP4
      setSource({
        type: 'video',
        sources: [
          {
            src: finalUrl,
            type: isHls ? 'application/x-mpegURL' : 'video/mp4',
          },
        ],
      });
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [url]);

  // --- ATTACH MEDIA ---
  useEffect(() => {
      if (ref.current && hlsRef.current) {
          // FIX: Cast to any to access .media
          const playerInstance = ref.current.plyr as any;
          const videoElement = playerInstance.media;
          
          if (videoElement && hlsRef.current) {
              hlsRef.current.attachMedia(videoElement);
          }
      }
  }, [source]); 

  // --- AUTO SKIP LOGIC ---
  useEffect(() => {
      // FIX: Cast to any for event listeners
      const player = ref.current?.plyr as any;
      if (!player) return;

      const checkTime = () => {
          const ct = player.currentTime;
          
          if (intro && autoSkip && ct > intro.start && ct < intro.end) {
              player.currentTime = intro.end;
          }
          if (outro && autoSkip && ct > outro.start && ct < outro.end) {
              if (onNext) onNext();
          }
      };

      player.on('timeupdate', checkTime);
      player.on('ended', onEnded || (() => {}));

      return () => {
          player.off('timeupdate', checkTime);
      };
  }, [intro, outro, autoSkip, onNext, onEnded, source]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10 aspect-video anime-plyr-wrapper">
        {source && (
            <Plyr 
                ref={ref} 
                source={source} 
                options={plyrOptions} 
                style={{ height: '100%' }}
            />
        )}
        
        <style>{`
            .anime-plyr-wrapper .plyr {
                height: 100%;
                width: 100%;
            }
            .plyr__video-wrapper {
                height: 100%;
            }
            .plyr--full-ui input[type=range] {
                color: #dc2626;
            }
            .plyr__control--overlaid {
                background: rgba(220, 38, 38, 0.8);
            }
            .plyr--video .plyr__control.plyr__tab-focus, 
            .plyr--video .plyr__control:hover, 
            .plyr--video .plyr__control[aria-expanded=true] {
                background: #dc2626;
            }
        `}</style>
    </div>
  );
}