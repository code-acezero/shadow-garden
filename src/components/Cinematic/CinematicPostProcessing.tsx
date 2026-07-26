"use client";

import React from 'react';
import { 
  EffectComposer, 
  Bloom, 
  ChromaticAberration, 
  Vignette,
  Glitch
} from '@react-three/postprocessing';
import { GlitchMode, BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useCinematicStore } from '@/store/useCinematicStore';

export function CinematicPostProcessing() {
  const currentPhase = useCinematicStore((s) => s.currentPhase);

  // Configure chromatic aberration per phase
  const offsetVector = React.useMemo(() => {
    if (currentPhase === 3) return new THREE.Vector2(0.005, 0.005); // Hyper-travel warp
    if (currentPhase === 7) return new THREE.Vector2(0.008, 0.008); // Gate push strain
    if (currentPhase === 8) return new THREE.Vector2(0.02, 0.02);   // Wormhole velocity tear
    return new THREE.Vector2(0.002, 0.002);
  }, [currentPhase]);

  return (
    <EffectComposer disableNormalPass>
      {/* Bloom glow for space stars, runes, and god-rays */}
      <Bloom
        intensity={currentPhase >= 7 ? 2.5 : 1.2}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />

      {/* Chromatic Aberration for warp & velocity lens distortion */}
      <ChromaticAberration
        offset={offsetVector}
        radialModulation={false}
        modulationOffset={0}
      />

      {/* Cinematic Vignette */}
      <Vignette
        eskil={false}
        offset={0.25}
        darkness={currentPhase >= 5 ? 0.75 : 0.55}
      />

      {/* Time Tunnel Glitch (Phase 8) */}
      {currentPhase === 8 && (
        <Glitch
          delay={new THREE.Vector2(0, 0)}
          duration={new THREE.Vector2(0.1, 0.3)}
          strength={new THREE.Vector2(0.3, 1.0)}
          mode={GlitchMode.SPORADIC}
          active
          ratio={0.85}
        />
      )}
    </EffectComposer>
  );
}
