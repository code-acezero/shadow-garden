"use client";

import React, { useEffect } from 'react';
import ShadowGardenPortal from '@/components/Portal/ShadowGardenPortal';
import { CinematicSystemUI } from '@/components/Cinematic/CinematicSystemUI';
import { cinematicAudio } from '@/lib/audio/CinematicAudioEngine';

export default function LandingClient() {
  // Guarantee all Web Audio contexts and oscillators are completely stopped on unmount
  useEffect(() => {
    return () => {
      cinematicAudio.stopAllAudio();
    };
  }, []);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#030305] text-white selection:bg-purple-500/30">
      {/* 3D R3F World Canvas (Space Void, Open Gate, Black Hole, FPV Hands, Camera Controller) */}
      <ShadowGardenPortal />

      {/* Solo Leveling System UI Overlays (Phases 0 through 8) */}
      <CinematicSystemUI />
    </main>
  );
}