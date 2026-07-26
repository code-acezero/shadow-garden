"use client";

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCinematicStore } from '@/store/useCinematicStore';
import { cinematicAudio } from '@/lib/audio/CinematicAudioEngine';

export function CinematicCameraController() {
  const { currentPhase, setPhase } = useCinematicStore();
  const { camera } = useThree();
  
  const targetPos = useRef(new THREE.Vector3(0, 5, 25));
  const targetLook = useRef(new THREE.Vector3(0, 4, 0));
  const walkProgress = useRef(0);
  const phaseTimer = useRef(0);

  useEffect(() => {
    // Phase specific audio triggers and setup
    if (currentPhase === 1) {
      cinematicAudio.startSpaceDrone();
    } else if (currentPhase === 3) {
      cinematicAudio.playHyperWhoosh();
    } else if (currentPhase === 5) {
      cinematicAudio.playLandingThud();
    } else if (currentPhase === 7) {
      cinematicAudio.playDoorGrind();
    } else if (currentPhase === 8) {
      cinematicAudio.playTimeWarp();
    }
  }, [currentPhase]);

  useFrame((state, delta) => {
    phaseTimer.current += delta;
    const time = state.clock.getElapsedTime();

    // PHASE 0 & 1: Distant space void static look
    if (currentPhase <= 1) {
      targetPos.current.set(0, 4, 30);
      targetLook.current.set(0, 0, 0);
    }
    // PHASE 2: Solo Leveling Gender Selection camera shift
    else if (currentPhase === 2) {
      targetPos.current.set(0, 6, 26);
      targetLook.current.set(0, 2, 0);
    }
    // PHASE 3: Hyper-Travel acceleration & Drone View Orbit around gate
    else if (currentPhase === 3) {
      const radius = 22;
      const orbitSpeed = time * 0.25;
      targetPos.current.set(
        Math.sin(orbitSpeed) * radius,
        7 + Math.cos(orbitSpeed * 0.5) * 2,
        Math.cos(orbitSpeed) * radius
      );
      targetLook.current.set(0, 3, 0);
    }
    // PHASE 4: Instructions & Main Landing background orbit
    else if (currentPhase === 4) {
      const radius = 24;
      const orbitSpeed = time * 0.15;
      targetPos.current.set(
        Math.sin(orbitSpeed) * radius,
        8,
        Math.cos(orbitSpeed) * radius
      );
      targetLook.current.set(0, 4, 0);
    }
    // PHASE 5: First-Person Drop onto stone platform & Confusion head look
    else if (currentPhase === 5) {
      // Simulate drop from y=20 down to y=1.6
      if (phaseTimer.current < 1.0) {
        const dropRatio = phaseTimer.current / 1.0;
        targetPos.current.set(0, THREE.MathUtils.lerp(22, 1.6, dropRatio), 14);
      } else {
        // Look down at hands then left/right
        const lookTime = phaseTimer.current - 1.0;
        const headYaw = Math.sin(lookTime * 2.5) * 0.4;
        const headPitch = lookTime < 2.0 ? -0.5 : 0;
        targetPos.current.set(0, 1.6 + Math.sin(time * 8) * 0.01, 14);
        targetLook.current.set(headYaw * 4, 1.6 + headPitch * 2, 8);
      }
    }
    // PHASE 6: Walking down stone path toward gate
    else if (currentPhase === 6) {
      walkProgress.current = Math.min(walkProgress.current + delta * 0.25, 1.0);
      const currentZ = THREE.MathUtils.lerp(14, 3.5, walkProgress.current);
      const headBobY = Math.sin(time * 7) * 0.08;
      const headBobX = Math.cos(time * 3.5) * 0.04;

      targetPos.current.set(headBobX, 1.6 + headBobY, currentZ);
      targetLook.current.set(0, 3.8, 0);

      // Play footstep audio periodically during walk
      if (Math.sin(time * 7) > 0.95 && walkProgress.current < 0.95) {
        cinematicAudio.playFootstep();
      }
    }
    // PHASE 7: Pushing Gate (Camera Shake & FOV Zoom)
    else if (currentPhase === 7) {
      const shakeX = (Math.random() - 0.5) * 0.12;
      const shakeY = (Math.random() - 0.5) * 0.12;

      targetPos.current.set(shakeX, 1.6 + shakeY, 3.2);
      targetLook.current.set(0, 3.8, -2);
    }
    // PHASE 8: Sucked into Black Hole / Time Tunnel
    else if (currentPhase === 8) {
      targetPos.current.set(0, 3.8, THREE.MathUtils.lerp(3.2, -15, delta * 2.5));
      targetLook.current.set(0, 3.8, -30);

      // Trigger Phase 9 whiteout after 2.2s in tunnel
      if (phaseTimer.current > 2.2) {
        setPhase(9);
      }
    }

    // Smooth lerp camera position and orientation
    camera.position.lerp(targetPos.current, delta * 3.5);
    
    // Smooth lookAt tracking
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    const targetDirection = targetLook.current.clone().sub(camera.position).normalize();
    
    const newDir = currentLookAt.lerp(targetDirection, delta * 4.5);
    camera.lookAt(camera.position.clone().add(newDir));
  });

  return null;
}
