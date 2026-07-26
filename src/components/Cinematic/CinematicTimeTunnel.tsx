"use client";

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCinematicStore } from '@/store/useCinematicStore';

export function CinematicTimeTunnel() {
  const currentPhase = useCinematicStore((s) => s.currentPhase);
  const ringRef = useRef<THREE.Mesh>(null);
  const tunnelRef = useRef<THREE.Group>(null);

  // Generate high-speed time tunnel star streaks
  const streakCount = 400;
  const streaks = useMemo(() => {
    const pos = new Float32Array(streakCount * 6); // 2 points per line segment
    for (let i = 0; i < streakCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 8;
      const z = -Math.random() * 80;

      pos[i * 6] = Math.cos(angle) * radius;
      pos[i * 6 + 1] = Math.sin(angle) * radius;
      pos[i * 6 + 2] = z;

      pos[i * 6 + 3] = Math.cos(angle) * radius;
      pos[i * 6 + 4] = Math.sin(angle) * radius;
      pos[i * 6 + 5] = z - (4 + Math.random() * 8); // Velocity tail length
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 2.5;
    }
    if (tunnelRef.current && currentPhase >= 8) {
      tunnelRef.current.rotation.z += delta * 4.0;
    }
  });

  // Only render during gate opening (7) & wormhole tunnel (8)
  if (currentPhase < 7 || currentPhase > 8) return null;

  return (
    <group position={[0, 4, 0]}>
      {/* Black Hole Event Horizon Sphere */}
      <mesh position={[0, 0, -2]}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Spinning Accretion Disc Ring */}
      <mesh ref={ringRef} position={[0, 0, -2]} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[2.7, 5.5, 64]} />
        <meshBasicMaterial
          color="#f43f5e"
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* High-Speed Time Tunnel Line Streaks (Phase 8) */}
      {currentPhase === 8 && (
        <group ref={tunnelRef} position={[0, 0, 0]}>
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[streaks, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#c084fc"
              linewidth={2}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>
        </group>
      )}
    </group>
  );
}
