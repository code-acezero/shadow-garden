"use client";

import dynamic from 'next/dynamic';

// Now it is safe to use ssr: false because this wrapper itself is a Client Component
const WhisperIsland = dynamic(() => import("./WhisperIsland"), { 
  ssr: false 
});

export default function WhisperIslandWrapper() {
  return <WhisperIsland />;
}