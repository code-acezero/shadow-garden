"use client";

import React from 'react';
import { 
  EffectComposer, 
  Bloom, 
  ChromaticAberration, 
  Vignette,
  Glitch
} from '@react-three/postprocessing';
import { GlitchMode } from 'postprocessing';
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

  const glitchDelay = React.useMemo(() => new THREE.Vector2(0, 0), []);
  const glitchDuration = React.useMemo(() => new THREE.Vector2(0.1, 0.3), []);
  const glitchStrength = React.useMemo(() => new THREE.Vector2(0.3, 1.0), []);

  const Composer = EffectComposer as any;
  const BloomEffect = Bloom as any;
  const ChromaticEffect = ChromaticAberration as any;
  const VignetteEffect = Vignette as any;
  const GlitchEffect = Glitch as any;

  return (
    <Composer disableNormalPass>
      <BloomEffect
        intensity={currentPhase >= 7 ? 2.5 : 1.2}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />

      <ChromaticEffect
        offset={offsetVector}
        radialModulation={false}
        modulationOffset={0}
      />

      <VignetteEffect
        eskil={false}
        offset={0.25}
        darkness={currentPhase >= 5 ? 0.75 : 0.55}
      />

      {currentPhase === 8 ? (
        <GlitchEffect
          active
          delay={glitchDelay}
          duration={glitchDuration}
          strength={glitchStrength}
          mode={GlitchMode.SPORADIC}
          ratio={0.85}
        />
      ) : (
        <></>
      )}
    </Composer>
  );
}
