"use client";

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useCinematicStore } from '@/store/useCinematicStore';

export function CinematicAncientGate() {
  const currentPhase = useCinematicStore((s) => s.currentPhase);
  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);
  const godRaysRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    // Phase 7 & 8: Open heavy stone gate doors
    const targetDoorAngle = currentPhase >= 7 ? Math.PI * 0.45 : 0;
    
    if (leftDoorRef.current) {
      leftDoorRef.current.rotation.y = THREE.MathUtils.damp(
        leftDoorRef.current.rotation.y,
        -targetDoorAngle,
        2.5,
        delta
      );
    }

    if (rightDoorRef.current) {
      rightDoorRef.current.rotation.y = THREE.MathUtils.damp(
        rightDoorRef.current.rotation.y,
        targetDoorAngle,
        2.5,
        delta
      );
    }

    // Volumetric God-Rays Intensity Ramp in Phase 7 & 8
    if (godRaysRef.current) {
      const mat = godRaysRef.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = currentPhase === 7 ? 0.6 : currentPhase >= 8 ? 0.9 : 0.05;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOpacity, 3, delta);
    }
  });

  return (
    <group position={[0, -2, 0]}>
      {/* --- FLOATING ANCIENT STONE PLATFORM --- */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <cylinderGeometry args={[14, 16, 1, 64]} />
        <meshStandardMaterial
          color="#1e1e24"
          roughness={0.85}
          metalness={0.2}
          bumpScale={0.05}
        />
      </mesh>

      {/* Stone Path Leading to Gate */}
      <mesh position={[0, -0.01, 8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 16]} />
        <meshStandardMaterial
          color="#2a2a35"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* --- ANCIENT RUIN PILLARS & ARCHWAY --- */}
      {/* Left Pillar */}
      <mesh position={[-4, 4, 0]}>
        <boxGeometry args={[1.5, 9, 1.5]} />
        <meshStandardMaterial color="#272730" roughness={0.8} />
      </mesh>

      {/* Right Pillar */}
      <mesh position={[4, 4, 0]}>
        <boxGeometry args={[1.5, 9, 1.5]} />
        <meshStandardMaterial color="#272730" roughness={0.8} />
      </mesh>

      {/* Top Archway Beam */}
      <mesh position={[0, 9, 0]}>
        <boxGeometry args={[10, 1.8, 1.8]} />
        <meshStandardMaterial color="#30303b" roughness={0.7} />
      </mesh>

      {/* --- HEAVY STONE GATE DOORS --- */}
      {/* Left Door */}
      <group position={[-3.25, 4, 0]} ref={leftDoorRef}>
        <mesh position={[1.625, 0, 0]}>
          <boxGeometry args={[3.25, 8.2, 0.6]} />
          <meshStandardMaterial
            color="#18181c"
            roughness={0.9}
            metalness={0.3}
          />
        </mesh>
        {/* Door Runes Ornament */}
        <mesh position={[1.625, 0, 0.32]}>
          <boxGeometry args={[2.5, 6, 0.05]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#7e22ce"
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>

      {/* Right Door */}
      <group position={[3.25, 4, 0]} ref={rightDoorRef}>
        <mesh position={[-1.625, 0, 0]}>
          <boxGeometry args={[3.25, 8.2, 0.6]} />
          <meshStandardMaterial
            color="#18181c"
            roughness={0.9}
            metalness={0.3}
          />
        </mesh>
        {/* Door Runes Ornament */}
        <mesh position={[-1.625, 0, 0.32]}>
          <boxGeometry args={[2.5, 6, 0.05]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#7e22ce"
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>

      {/* --- VOLUMETRIC GOD-RAYS LIGHT LEAK CONE --- */}
      <mesh ref={godRaysRef} position={[0, 4, -2]} rotation={[Math.PI / 6, 0, 0]}>
        <coneGeometry args={[12, 25, 32, 1, true]} />
        <meshBasicMaterial
          color="#f43f5e"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* --- FLOATING RUIN ROCKS & DEBRIS --- */}
      <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh position={[-9, 6, 3]}>
          <dodecahedronGeometry args={[1.2]} />
          <meshStandardMaterial color="#2d2d38" roughness={0.9} />
        </mesh>
        <mesh position={[9.5, 7, -2]}>
          <dodecahedronGeometry args={[1.5]} />
          <meshStandardMaterial color="#2d2d38" roughness={0.9} />
        </mesh>
        <mesh position={[-7, 10, -5]}>
          <dodecahedronGeometry args={[0.9]} />
          <meshStandardMaterial color="#2d2d38" roughness={0.9} />
        </mesh>
      </Float>
    </group>
  );
}
