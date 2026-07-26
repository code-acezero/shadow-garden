"use client";

import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { 
  Stars, 
  Sparkles, 
  Float, 
  Preload 
} from '@react-three/drei';
import { 
  EffectComposer, 
  Bloom, 
  ChromaticAberration, 
  Vignette,
  Glitch
} from '@react-three/postprocessing';
import { GlitchMode } from 'postprocessing';
import { useCinematicStore } from '@/store/useCinematicStore';
import { cinematicAudio } from '@/lib/audio/CinematicAudioEngine';

// =============================================================================
// 1. SPACE VOID & GALAXY DISK
// =============================================================================
function SpaceVoidScene() {
  const currentPhase = useCinematicStore((s) => s.currentPhase);
  const galaxyRef = useRef<THREE.Group>(null);

  const galaxyParticles = useMemo(() => {
    const count = 1500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorInside = new THREE.Color('#9333ea');
    const colorOutside = new THREE.Color('#3b82f6');

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 50 + 5;
      const spinAngle = radius * 0.4;
      const branchAngle = ((i % 3) * 2 * Math.PI) / 3;

      const x = Math.cos(branchAngle + spinAngle) * radius + (Math.random() - 0.5) * 3;
      const y = (Math.random() - 0.5) * 3;
      const z = Math.sin(branchAngle + spinAngle) * radius + (Math.random() - 0.5) * 3;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixed = colorInside.clone().lerp(colorOutside, radius / 55);
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }
    return { positions, colors };
  }, []);

  useFrame((_, delta) => {
    if (galaxyRef.current) {
      const speed = currentPhase === 3 ? 0.6 : 0.05;
      galaxyRef.current.rotation.y += delta * speed;
    }
  });

  return (
    <group>
      <Stars radius={120} depth={60} count={5000} factor={4} saturation={0.5} fade speed={currentPhase === 3 ? 4 : 1} />
      <Sparkles count={350} scale={[70, 70, 70]} size={currentPhase === 3 ? 4 : 2} speed={currentPhase === 3 ? 3 : 0.4} color="#c084fc" />

      <group ref={galaxyRef} position={[0, -10, -50]} rotation={[Math.PI / 4, 0, 0]}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[galaxyParticles.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[galaxyParticles.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.6} vertexColors transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
      </group>

      <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh position={[-35, 18, -70]}>
          <sphereGeometry args={[6, 32, 32]} />
          <meshStandardMaterial color="#38bdf8" emissive="#1e3a8a" emissiveIntensity={0.4} roughness={0.8} />
        </mesh>
        <mesh position={[40, -15, -80]}>
          <sphereGeometry args={[9, 32, 32]} />
          <meshStandardMaterial color="#c084fc" emissive="#581c87" emissiveIntensity={0.5} roughness={0.7} />
        </mesh>
      </Float>
    </group>
  );
}

// =============================================================================
// 2. ANCIENT PLATFORM, PRE-OPENED GATE & FRONT BLACK HOLE
// =============================================================================
function AncientOpenGateScene() {
  const currentPhase = useCinematicStore((s) => s.currentPhase);
  const blackHoleRingRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (blackHoleRingRef.current) {
      blackHoleRingRef.current.rotation.z += delta * 3.0;
    }
  });

  return (
    <group position={[0, -2, 0]}>
      {/* Stone Platform */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <cylinderGeometry args={[14, 16, 1, 64]} />
        <meshStandardMaterial color="#1e1e24" roughness={0.85} metalness={0.2} />
      </mesh>

      {/* Stone Path */}
      <mesh position={[0, -0.01, 8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 16]} />
        <meshStandardMaterial color="#2a2a35" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Pillars */}
      <mesh position={[-4, 4, 0]}><boxGeometry args={[1.5, 9, 1.5]} /><meshStandardMaterial color="#272730" roughness={0.8} /></mesh>
      <mesh position={[4, 4, 0]}><boxGeometry args={[1.5, 9, 1.5]} /><meshStandardMaterial color="#272730" roughness={0.8} /></mesh>
      <mesh position={[0, 9, 0]}><boxGeometry args={[10, 1.8, 1.8]} /><meshStandardMaterial color="#30303b" roughness={0.7} /></mesh>

      {/* PRE-OPENED GATE DOORS (Swung open at Math.PI * 0.45 from Phase 3 onwards) */}
      <group position={[-3.25, 4, 0]} rotation={[0, -Math.PI * 0.45, 0]}>
        <mesh position={[1.625, 0, 0]}>
          <boxGeometry args={[3.25, 8.2, 0.6]} />
          <meshStandardMaterial color="#18181c" roughness={0.9} metalness={0.3} />
        </mesh>
      </group>

      <group position={[3.25, 4, 0]} rotation={[0, Math.PI * 0.45, 0]}>
        <mesh position={[-1.625, 0, 0]}>
          <boxGeometry args={[3.25, 8.2, 0.6]} />
          <meshStandardMaterial color="#18181c" roughness={0.9} metalness={0.3} />
        </mesh>
      </group>

      {/* FRONT-SIDE BLACK HOLE & WORMHOLE VORTEX (Visible through open gate) */}
      <group position={[0, 4, -0.5]}>
        {/* Event Horizon */}
        <mesh position={[0, 0, -0.2]}>
          <sphereGeometry args={[2.8, 32, 32]} />
          <meshBasicMaterial color="#000000" />
        </mesh>

        {/* Spinning Accretion Disc Ring */}
        <mesh ref={blackHoleRingRef} position={[0, 0, 0]}>
          <ringGeometry args={[2.9, 5.8, 64]} />
          <meshBasicMaterial color="#f43f5e" side={THREE.FrontSide} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Volumetric God-Ray Light Cone */}
        <mesh position={[0, 0, 1]} rotation={[Math.PI / 6, 0, 0]}>
          <coneGeometry args={[10, 20, 32, 1, true]} />
          <meshBasicMaterial color="#f43f5e" transparent opacity={0.35} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

// =============================================================================
// 3. FIRST-PERSON HANDS RIG
// =============================================================================
function FPVHandsRig() {
  const { currentPhase, gender } = useCinematicStore();
  const handsGroupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const isMale = gender === 'male';
  const armColor = isMale ? '#18181b' : '#312e81';
  const accentColor = isMale ? '#ef4444' : '#c084fc';

  useFrame((state, delta) => {
    if (!handsGroupRef.current) return;
    const camera = state.camera;
    handsGroupRef.current.position.copy(camera.position);
    handsGroupRef.current.quaternion.copy(camera.quaternion);

    const time = state.clock.getElapsedTime();

    if (currentPhase === 5) {
      // Phase 5: Look down at hands & confusion motion
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.position.set(-0.35, -0.25 + Math.sin(time * 2) * 0.02, -0.65);
        rightArmRef.current.position.set(0.35, -0.25 + Math.cos(time * 2) * 0.02, -0.65);
      }
    } else if (currentPhase === 6) {
      // Phase 6: Walking head bobbing
      const walkBob = Math.sin(time * 6) * 0.04;
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.position.set(-0.4, -0.35 + walkBob, -0.8 + Math.cos(time * 6) * 0.05);
        rightArmRef.current.position.set(0.4, -0.35 - walkBob, -0.8 - Math.cos(time * 6) * 0.05);
      }
    } else if (currentPhase === 7) {
      // Phase 7: Reaching out into black hole light
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.position.set(-0.2, -0.1, -0.4);
        rightArmRef.current.position.set(0.1, -0.05, -0.3);
      }
    }
  });

  if (currentPhase < 5 || currentPhase > 7) return null;

  return (
    <group ref={handsGroupRef}>
      <group ref={leftArmRef} position={[-0.35, -0.3, -0.7]} rotation={[0.2, 0.15, -0.1]}>
        <mesh rotation={[Math.PI / 2.5, 0, 0]}><cylinderGeometry args={[0.07, 0.09, 0.45, 16]} /><meshStandardMaterial color={armColor} roughness={0.5} metalness={0.8} /></mesh>
        <mesh position={[0, 0, 0.1]}><boxGeometry args={[0.08, 0.08, 0.2]} /><meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.8} /></mesh>
      </group>
      <group ref={rightArmRef} position={[0.35, -0.3, -0.7]} rotation={[0.2, -0.15, 0.1]}>
        <mesh rotation={[Math.PI / 2.5, 0, 0]}><cylinderGeometry args={[0.07, 0.09, 0.45, 16]} /><meshStandardMaterial color={armColor} roughness={0.5} metalness={0.8} /></mesh>
        <mesh position={[0, 0, 0.1]}><boxGeometry args={[0.08, 0.08, 0.2]} /><meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.8} /></mesh>
      </group>
    </group>
  );
}

// =============================================================================
// 4. CAMERA CONTROLLER RIG
// =============================================================================
function CameraControllerRig() {
  const { currentPhase } = useCinematicStore();
  const { camera } = useThree();

  const targetPos = useRef(new THREE.Vector3(0, 5, 30));
  const targetLook = useRef(new THREE.Vector3(0, 4, 0));
  const phaseTimer = useRef(0);
  const walkProgress = useRef(0);

  useEffect(() => {
    phaseTimer.current = 0;
    if (currentPhase === 1) cinematicAudio.playSound('space_bgm');
    else if (currentPhase === 3) cinematicAudio.playSound('sfx_hyper_whoosh');
    else if (currentPhase === 5) cinematicAudio.playSound('sfx_landing');
    else if (currentPhase === 7) cinematicAudio.playSound('sfx_time_warp');
  }, [currentPhase]);

  useFrame((state, delta) => {
    phaseTimer.current += delta;
    const time = state.clock.getElapsedTime();

    if (currentPhase <= 1) {
      targetPos.current.set(0, 4, 30);
      targetLook.current.set(0, 0, 0);
    } else if (currentPhase === 2) {
      targetPos.current.set(0, 6, 26);
      targetLook.current.set(0, 2, 0);
    } else if (currentPhase === 3) {
      // Phase 3: Drone Orbit around open gate platform
      const radius = 22;
      const speed = time * 0.25;
      targetPos.current.set(Math.sin(speed) * radius, 7 + Math.cos(speed * 0.5) * 2, Math.cos(speed) * radius);
      targetLook.current.set(0, 3, 0);
    } else if (currentPhase === 4) {
      // Phase 4: HIGH TOP-DOWN FRONT VIEW facing gate directly
      targetPos.current.set(0, 18, 22);
      targetLook.current.set(0, 2, 0);
    } else if (currentPhase === 5) {
      // Phase 5: FPV Drop & Confusion
      if (phaseTimer.current < 1.0) {
        const dropRatio = phaseTimer.current / 1.0;
        targetPos.current.set(0, THREE.MathUtils.lerp(18, 1.6, dropRatio), 12);
      } else {
        const lookTime = phaseTimer.current - 1.0;
        const headYaw = Math.sin(lookTime * 2.5) * 0.4;
        const headPitch = lookTime < 1.8 ? -0.4 : 0;
        targetPos.current.set(0, 1.6 + Math.sin(time * 8) * 0.01, 12);
        targetLook.current.set(headYaw * 4, 1.6 + headPitch * 2, 6);
      }
    } else if (currentPhase === 6) {
      // Phase 6: FPV Walk down path to open gate threshold
      walkProgress.current = Math.min(walkProgress.current + delta * 0.25, 1.0);
      const currentZ = THREE.MathUtils.lerp(12, 2.5, walkProgress.current);
      const headBobY = Math.sin(time * 7) * 0.08;
      targetPos.current.set(Math.cos(time * 3.5) * 0.04, 1.6 + headBobY, currentZ);
      targetLook.current.set(0, 3.8, -2);

      if (Math.sin(time * 7) > 0.95 && walkProgress.current < 0.95) {
        cinematicAudio.playSound('sfx_footstep');
      }
    } else if (currentPhase === 7) {
      // Phase 7: Sucked into Black Hole / Time Tunnel
      targetPos.current.set(0, 3.8, THREE.MathUtils.lerp(2.5, -20, delta * 3.0));
      targetLook.current.set(0, 3.8, -40);
    }

    camera.position.lerp(targetPos.current, delta * 3.5);
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    const targetDir = targetLook.current.clone().sub(camera.position).normalize();
    const newDir = currentLook.lerp(targetDir, delta * 4.5);
    camera.lookAt(camera.position.clone().add(newDir));
  });

  return null;
}

// =============================================================================
// 5. POST-PROCESSING STACK
// =============================================================================
function PostProcessingStack() {
  const currentPhase = useCinematicStore((s) => s.currentPhase);

  const offsetVector = useMemo(() => {
    if (currentPhase === 3) return new THREE.Vector2(0.005, 0.005);
    if (currentPhase === 7) return new THREE.Vector2(0.02, 0.02);
    return new THREE.Vector2(0.002, 0.002);
  }, [currentPhase]);

  const glitchDelay = useMemo(() => new THREE.Vector2(0, 0), []);
  const glitchDuration = useMemo(() => new THREE.Vector2(0.1, 0.3), []);
  const glitchStrength = useMemo(() => new THREE.Vector2(0.3, 1.0), []);

  const Composer = EffectComposer as any;
  const BloomEffect = Bloom as any;
  const ChromaticEffect = ChromaticAberration as any;
  const VignetteEffect = Vignette as any;
  const GlitchEffect = Glitch as any;

  return (
    <Composer disableNormalPass>
      <BloomEffect intensity={currentPhase >= 6 ? 2.8 : 1.2} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
      <ChromaticEffect offset={offsetVector} radialModulation={false} modulationOffset={0} />
      <VignetteEffect eskil={false} offset={0.25} darkness={currentPhase >= 5 ? 0.75 : 0.55} />
      {currentPhase === 7 ? (
        <GlitchEffect active delay={glitchDelay} duration={glitchDuration} strength={glitchStrength} mode={GlitchMode.SPORADIC} ratio={0.85} />
      ) : <></>}
    </Composer>
  );
}

// =============================================================================
// 6. MASTER SHADOW GARDEN PORTAL CANVAS EXPORT
// =============================================================================
export default function ShadowGardenPortal() {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#030305] z-0 overflow-hidden pointer-events-auto">
      <Canvas
        camera={{ position: [0, 5, 30], fov: 60, near: 0.1, far: 500 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[10, 20, 15]} intensity={1.2} color="#a855f7" castShadow />
        <pointLight position={[0, 4, 2]} intensity={2.2} color="#f43f5e" distance={16} />

        <Suspense fallback={null}>
          <SpaceVoidScene />
          <AncientOpenGateScene />
          <FPVHandsRig />
          <CameraControllerRig />
          <PostProcessingStack />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}