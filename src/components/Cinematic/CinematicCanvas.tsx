"use client";

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { CinematicSpaceVoid } from './CinematicSpaceVoid';
import { CinematicAncientGate } from './CinematicAncientGate';
import { CinematicHandsRig } from './CinematicHandsRig';
import { CinematicTimeTunnel } from './CinematicTimeTunnel';
import { CinematicCameraController } from './CinematicCameraController';
import { CinematicPostProcessing } from './CinematicPostProcessing';

export function CinematicCanvas() {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#030305] z-0 overflow-hidden pointer-events-auto">
      <Canvas
        camera={{ position: [0, 5, 30], fov: 60, near: 0.1, far: 500 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 20, 15]} intensity={1.2} color="#a855f7" castShadow />
        <pointLight position={[0, 4, 2]} intensity={2.0} color="#f43f5e" distance={15} />

        <Suspense fallback={null}>
          <CinematicSpaceVoid />
          <CinematicAncientGate />
          <CinematicHandsRig />
          <CinematicTimeTunnel />
          <CinematicCameraController />
          <CinematicPostProcessing />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
