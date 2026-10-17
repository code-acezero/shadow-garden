"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { ShortDramaDetail } from '@/lib/shorts/types';
import { Loader2 } from 'lucide-react';

// Dynamically import VerticalWatchFeed with ssr: false since it uses Hls.js and DOM media elements
const VerticalWatchFeed = dynamic(
  () => import('@/components/Shorts/VerticalWatchFeed'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[100dvh] bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="text-xs font-semibold text-slate-400">Loading vertical drama...</p>
      </div>
    )
  }
);

interface WatchClientLoaderProps {
  drama: ShortDramaDetail;
  initialEpisode: number;
}

export default function WatchClientLoader({ drama, initialEpisode }: WatchClientLoaderProps) {
  return (
    <VerticalWatchFeed
      drama={drama}
      initialEpisode={initialEpisode}
    />
  );
}
