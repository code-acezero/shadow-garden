"use client";

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface SimplePlayerProps {
  url: string;
}

export default function SimpleHLSPlayer({ url }: SimplePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset error on new URL
    setError(null);
    setStatus('Loading source...');

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        debug: true, // Enable logs in console
        xhrSetup: (xhr, url) => {
          // Debugging: Log what URL hls.js is actually trying to fetch
          console.log(`[HLS Request] ${url}`);
        }
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus('Manifest loaded, playing...');
        video.play().catch(e => console.error("Auto-play blocked", e));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setStatus(`Network Error: ${data.details}`);
              console.error("Fatal network error encountered, trying to recover");
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setStatus(`Media Error: ${data.details}`);
              console.error("Fatal media error encountered, trying to recover");
              hls?.recoverMediaError();
              break;
            default:
              setStatus(`Fatal Error: ${data.details}`);
              hls?.destroy();
              break;
          }
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
    } else {
      setError('HLS is not supported in this browser.');
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-800">
        <video
          ref={videoRef}
          controls
          className="w-full h-full"
          crossOrigin="anonymous" // Important for CORS
        />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-red-500 p-4 text-center">
            {error}
          </div>
        )}
      </div>
      
      {/* Mini Debug Bar */}
      <div className="text-xs font-mono bg-gray-900 p-2 rounded border border-gray-800 text-gray-400">
        Status: <span className="text-blue-400">{status}</span>
      </div>
    </div>
  );
}