"use client";

import React from 'react';
import { CinematicCanvas } from '@/components/Cinematic/CinematicCanvas';
import { CinematicSystemUI } from '@/components/Cinematic/CinematicSystemUI';

export default function LandingClient() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#030305] text-white selection:bg-purple-500/30">
      {/* 3D R3F Canvas (Space Void, Ancient Gate, FPV Hands, Time Tunnel, Camera Rig) */}
      <CinematicCanvas />

      {/* Solo Leveling Styled System UI Overlays (Phase 0 to Phase 9) */}
      <CinematicSystemUI />
    </main>
  );
}