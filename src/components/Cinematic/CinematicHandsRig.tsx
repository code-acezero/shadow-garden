"use client";

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCinematicStore } from '@/store/useCinematicStore';

export function CinematicHandsRig() {
  const { currentPhase, gender } = useCinematicStore();
  const handsGroupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const isMale = gender === 'male';
  const armColor = isMale ? '#18181b' : '#312e81'; // Dark Hunter vs Imperial Monarch
  const accentColor = isMale ? '#ef4444' : '#c084fc'; // Red glow vs Celestial purple

  useFrame((state, delta) => {
    if (!handsGroupRef.current) return;

    // Position hands in front of FPV camera
    const camera = state.camera;
    handsGroupRef.current.position.copy(camera.position);
    handsGroupRef.current.quaternion.copy(camera.quaternion);

    // Animations per Phase
    const time = state.clock.getElapsedTime();

    if (currentPhase === 5) {
      // Phase 5: Look down at hands & confusion gesture
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.position.x = THREE.MathUtils.damp(leftArmRef.current.position.x, -0.35, 4, delta);
        leftArmRef.current.position.y = THREE.MathUtils.damp(leftArmRef.current.position.y, -0.25 + Math.sin(time * 2) * 0.02, 4, delta);
        leftArmRef.current.position.z = THREE.MathUtils.damp(leftArmRef.current.position.z, -0.65, 4, delta);

        rightArmRef.current.position.x = THREE.MathUtils.damp(rightArmRef.current.position.x, 0.35, 4, delta);
        rightArmRef.current.position.y = THREE.MathUtils.damp(rightArmRef.current.position.y, -0.25 + Math.cos(time * 2) * 0.02, 4, delta);
        rightArmRef.current.position.z = THREE.MathUtils.damp(rightArmRef.current.position.z, -0.65, 4, delta);
      }
    } else if (currentPhase === 6) {
      // Phase 6: Walking head-bobbing & arms swinging at sides
      const walkBob = Math.sin(time * 6) * 0.04;
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.position.x = -0.4;
        leftArmRef.current.position.y = -0.35 + walkBob;
        leftArmRef.current.position.z = -0.8 + Math.cos(time * 6) * 0.05;

        rightArmRef.current.position.x = 0.4;
        rightArmRef.current.position.y = -0.35 - walkBob;
        rightArmRef.current.position.z = -0.8 - Math.cos(time * 6) * 0.05;
      }
    } else if (currentPhase === 7) {
      // Phase 7: Pushing against heavy stone gate
      if (leftArmRef.current && rightArmRef.current) {
        const strainShake = (Math.random() - 0.5) * 0.02;
        leftArmRef.current.position.x = THREE.MathUtils.damp(leftArmRef.current.position.x, -0.25 + strainShake, 6, delta);
        leftArmRef.current.position.y = THREE.MathUtils.damp(leftArmRef.current.position.y, -0.15 + strainShake, 6, delta);
        leftArmRef.current.position.z = THREE.MathUtils.damp(leftArmRef.current.position.z, -0.45, 6, delta);

        rightArmRef.current.position.x = THREE.MathUtils.damp(rightArmRef.current.position.x, 0.25 + strainShake, 6, delta);
        rightArmRef.current.position.y = THREE.MathUtils.damp(rightArmRef.current.position.y, -0.15 + strainShake, 6, delta);
        rightArmRef.current.position.z = THREE.MathUtils.damp(rightArmRef.current.position.z, -0.45, 6, delta);
      }
    } else if (currentPhase === 8) {
      // Phase 8: Reaching out hand toward wormhole
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.position.z = THREE.MathUtils.damp(leftArmRef.current.position.z, -0.9, 4, delta);

        rightArmRef.current.position.x = THREE.MathUtils.damp(rightArmRef.current.position.x, 0.1, 4, delta);
        rightArmRef.current.position.y = THREE.MathUtils.damp(rightArmRef.current.position.y, -0.05, 4, delta);
        rightArmRef.current.position.z = THREE.MathUtils.damp(rightArmRef.current.position.z, -0.35, 4, delta);
      }
    }
  });

  // Only show hands during First-Person Phases 5, 6, 7, 8
  if (currentPhase < 5 || currentPhase > 8) return null;

  return (
    <group ref={handsGroupRef}>
      {/* LEFT ARM / GAUNTLET */}
      <group ref={leftArmRef} position={[-0.35, -0.3, -0.7]} rotation={[0.2, 0.15, -0.1]}>
        {/* Forearm Mesh */}
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.45, 16]} />
          <meshStandardMaterial color={armColor} roughness={0.5} metalness={0.8} />
        </mesh>
        {/* Gauntlet Crest Accent */}
        <mesh position={[0, 0, 0.1]}>
          <boxGeometry args={[0.08, 0.08, 0.2]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.8} />
        </mesh>
        {/* Hand Palm */}
        <mesh position={[0, 0.08, -0.22]}>
          <boxGeometry args={[0.1, 0.04, 0.12]} />
          <meshStandardMaterial color="#27272a" roughness={0.6} />
        </mesh>
      </group>

      {/* RIGHT ARM / GAUNTLET */}
      <group ref={rightArmRef} position={[0.35, -0.3, -0.7]} rotation={[0.2, -0.15, 0.1]}>
        {/* Forearm Mesh */}
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.45, 16]} />
          <meshStandardMaterial color={armColor} roughness={0.5} metalness={0.8} />
        </mesh>
        {/* Gauntlet Crest Accent */}
        <mesh position={[0, 0, 0.1]}>
          <boxGeometry args={[0.08, 0.08, 0.2]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.8} />
        </mesh>
        {/* Hand Palm */}
        <mesh position={[0, 0.08, -0.22]}>
          <boxGeometry args={[0.1, 0.04, 0.12]} />
          <meshStandardMaterial color="#27272a" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}
