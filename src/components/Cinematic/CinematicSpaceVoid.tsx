"use client";

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useCinematicStore } from '@/store/useCinematicStore';

export function CinematicSpaceVoid() {
  const currentPhase = useCinematicStore((s) => s.currentPhase);
  const galaxyRef = useRef<THREE.Group>(null);
  const nebulaRef = useRef<THREE.Group>(null);

  // Generate particle positions for a spiral galaxy disc
  const galaxyParticles = useMemo(() => {
    const count = 1200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorInside = new THREE.Color('#9333ea'); // Purple
    const colorOutside = new THREE.Color('#3b82f6'); // Blue

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 45 + 5;
      const spinAngle = radius * 0.4;
      const branchAngle = ((i % 3) * 2 * Math.PI) / 3;

      const randomX = (Math.random() - 0.5) * 4;
      const randomY = (Math.random() - 0.5) * 4;
      const randomZ = (Math.random() - 0.5) * 4;

      const x = Math.cos(branchAngle + spinAngle) * radius + randomX;
      const y = randomY * 0.8;
      const z = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixedColor = colorInside.clone().lerp(colorOutside, radius / 50);
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    return { positions, colors };
  }, []);

  useFrame((_, delta) => {
    if (galaxyRef.current) {
      const speed = currentPhase === 3 ? 0.8 : 0.05;
      galaxyRef.current.rotation.y += delta * speed;
    }
    if (nebulaRef.current) {
      nebulaRef.current.rotation.z += delta * 0.02;
    }
  });

  return (
    <group>
      {/* Distant Starfield */}
      <Stars
        radius={120}
        depth={60}
        count={5000}
        factor={4}
        saturation={0.5}
        fade
        speed={currentPhase === 3 ? 4 : 1}
      />

      {/* Floating Ambient Sparkles */}
      <Sparkles
        count={300}
        scale={[60, 60, 60]}
        size={currentPhase === 3 ? 4 : 2}
        speed={currentPhase === 3 ? 3 : 0.4}
        color="#a855f7"
      />

      {/* Spiral Galaxy Mesh */}
      <group ref={galaxyRef} position={[0, -10, -50]} rotation={[Math.PI / 4, 0, 0]}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[galaxyParticles.positions, 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[galaxyParticles.colors, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.6}
            vertexColors
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>

      {/* Distant Mysterious Planets */}
      <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh position={[-35, 18, -70]}>
          <sphereGeometry args={[6, 32, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#1e3a8a"
            emissiveIntensity={0.4}
            roughness={0.8}
          />
        </mesh>

        <mesh position={[40, -15, -80]}>
          <sphereGeometry args={[9, 32, 32]} />
          <meshStandardMaterial
            color="#c084fc"
            emissive="#581c87"
            emissiveIntensity={0.5}
            roughness={0.7}
          />
        </mesh>
      </Float>

      {/* Nebula Ambient Atmospheric Glow */}
      <group ref={nebulaRef} position={[0, 0, -40]}>
        <mesh>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial
            color="#6b21a8"
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
