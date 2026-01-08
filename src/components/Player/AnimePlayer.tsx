import React, { useEffect, useRef } from 'react';
import { 
  MediaPlayer, 
  MediaProvider, 
  Poster,
  type MediaPlayerInstance,
} from '@vidstack/react';
import { 
  DefaultVideoLayout, 
  defaultLayoutIcons 
} from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

interface AnimePlayerProps {
  url: string;
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  autoSkip?: boolean;
  headers?: Record<string, string>;
  onEnded?: () => void;
  onNext?: () => void;
}

export default function AnimePlayer({ url, intro, outro, autoSkip = false, onEnded, onNext }: AnimePlayerProps) {
  const player = useRef<MediaPlayerInstance>(null);

  // --- PROXY STRATEGY ---
  // CodeTabs is the most permissive free proxy for video streams
  const PROXY = 'https://api.codetabs.com/v1/proxy?quest=';
  
  // Only proxy if it's an http link and not already proxied
  const src = url.startsWith('http') && !url.includes('cors') 
    ? PROXY + encodeURIComponent(url) 
    : url;

  useEffect(() => {
    // Subscribe to time updates for Auto-Skip functionality
    if (player.current) {
        return player.current.subscribe(({ currentTime }) => {
            // INTRO SKIP
            if (intro && autoSkip) {
                if (currentTime > intro.start && currentTime < intro.end) {
                    player.current!.currentTime = intro.end;
                }
            }
            // OUTRO SKIP
            if (outro && autoSkip) {
                if (currentTime > outro.start && currentTime < outro.end) {
                    onNext?.(); // Auto-next if available
                }
            }
        });
    }
  }, [url, intro, outro, autoSkip, onNext]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black">
      <MediaPlayer 
        ref={player}
        title="Anime Stream"
        src={src}
        aspectRatio="16/9"
        load="eager"
        onEnd={onEnded}
        className="w-full h-full"
      >
        <MediaProvider>
          <Poster className="vds-poster" />
        </MediaProvider>

        {/* Netflix-like Standard Layout */}
        <DefaultVideoLayout 
            icons={defaultLayoutIcons} 
        />
      </MediaPlayer>
    </div>
  );
}