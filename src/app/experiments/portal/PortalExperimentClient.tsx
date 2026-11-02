'use client';

import React, { Suspense, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  useGLTF, 
  useAnimations, 
  Stars, 
  Html,
  useProgress,
  useTexture
} from '@react-three/drei';
import * as THREE from 'three';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Compass, 
  ArrowLeft, 
  Moon, 
  DoorOpen,
  ArrowUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- LOADING INDICATOR ---
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-black/80 border border-white/10 backdrop-blur-xl text-center min-w-[220px]">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs font-mono font-bold tracking-widest text-primary-300 uppercase">
          Synthesizing Realm
        </span>
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-200" 
            style={{ width: `${Math.round(progress)}%` }} 
          />
        </div>
        <span className="text-[10px] text-zinc-400 font-mono">{Math.round(progress)}% Loaded</span>
      </div>
    </Html>
  );
}

// --- SEAMLESS EXPANDED CELESTIAL SKY DOME (NATURAL CRACK-FREE POLES & SEAMLESS WRAP) ---
function OriginalSkyDome({ radius = 380, skyRotation = 0 }: { radius?: number; skyRotation?: number }) {
  const skyTexture = useTexture('/textures/cielonoche.png');
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    skyTexture.wrapS = THREE.RepeatWrapping;
    skyTexture.wrapT = THREE.ClampToEdgeWrapping;
    skyTexture.minFilter = THREE.LinearFilter;
    skyTexture.magFilter = THREE.LinearFilter;
    skyTexture.generateMipmaps = false;
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    skyTexture.needsUpdate = true;
  }, [skyTexture]);

  return (
    <group>
      {/* 1. Main Seamless Celestial Sphere */}
      <mesh ref={meshRef} rotation={[0, -Math.PI * 0.32 + skyRotation, 0]}>
        <sphereGeometry args={[radius, 64, 48]} />
        <meshBasicMaterial 
          map={skyTexture} 
          side={THREE.BackSide} 
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>

      {/* 2. Deep Celestial Starfield */}
      <Stars 
        radius={radius * 0.94} 
        depth={50} 
        count={3600} 
        factor={3.8} 
        saturation={0.35} 
        fade 
        speed={0.4} 
      />
    </group>
  );
}

useTexture.preload('/textures/cielonoche.png');

// --- ORIGINAL CELESTIAL ISLAND MODEL (PORTAL NIGHT VERSION) ---
interface ModelProps {
  isPlaying: boolean;
  animSpeed: number;
}

function PortalNightModel({ isPlaying, animSpeed }: ModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/portal_night_version.glb');
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (names.length > 0 && actions[names[0]]) {
      const action = actions[names[0]]!;
      action.setEffectiveTimeScale(animSpeed);
      if (isPlaying) {
        action.play();
      } else {
        action.paused = true;
      }
    }
  }, [actions, names, isPlaying, animSpeed]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__SCENE = scene;
    }

    // Traverse scene:
    // 1. Hide duplicate inner globo
    // 2. Hide tilted lower cloud planes to prevent slicing artifacts
    // 3. Keep all original floating island elements intact
    scene.traverse((child) => {
      const name = (child.name || '').toLowerCase();
      
      if (name.includes('globo') || name.includes('nube')) {
        child.visible = false;
      }

      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.roughness = Math.min(mat.roughness || 0.6, 0.85);
          mat.envMapIntensity = 1.0;
        }
      }
    });

    // Anchor the floating celestial island to origin
    scene.rotation.y = -Math.PI / 2;
    scene.updateMatrixWorld(true);
    
    // Compute bounding box strictly from island geometry
    const islandBox = new THREE.Box3();
    scene.traverse((child) => {
      const name = (child.name || '').toLowerCase();
      if ((child as THREE.Mesh).isMesh && !name.includes('globo') && !name.includes('nube')) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.computeBoundingBox();
          if (mesh.geometry.boundingBox) {
            const b = mesh.geometry.boundingBox.clone();
            b.applyMatrix4(mesh.matrixWorld);
            islandBox.union(b);
          }
        }
      }
    });

    const center = new THREE.Vector3();
    islandBox.getCenter(center);
    // Center island in X and Z, keep natural elevation in Y
    scene.position.x -= center.x;
    scene.position.z -= center.z;
    scene.updateMatrixWorld(true);
  }, [scene]);

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} scale={0.0025} />
    </group>
  );
}

// --- MANA FANTASY TEAMED PORTAL (EXACT 3D MODEL FROM GLB) ---
// Loaded from public/models/mana_fantasy_teamed_portal.glb and permanently attached to the back edge of the floating island
function ManaFantasyTeamedPortal() {
  const { scene } = useGLTF('/models/mana_fantasy_teamed_portal.glb');

  useEffect(() => {
    // 1. Maintain local scene origin intact
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.updateMatrixWorld(true);

    // 2. Configure materials for glowing magical runes and ethereal shaders
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;

          // Glowing Magenta-Pink Arch Runes (Material)
          if (mat.name === 'Material') {
            mat.emissive = new THREE.Color('#f472b6');
            mat.emissiveIntensity = 3.5;
            if (mat.map && !mat.emissiveMap) {
              mat.emissiveMap = mat.map;
            }
          }

          // Floating Mana Bats & Shards swirling in the air around arch (Material.067)
          if (mat.name === 'Material.067') {
            mat.transparent = true;
            mat.opacity = 0.95;
            mat.depthWrite = false;
            mat.emissive = new THREE.Color('#d946ef');
            mat.emissiveIntensity = 2.4;
          }

          // Translucent Curled Branches (Material.056 & Material.002)
          if (mat.name === 'Material.056' || mat.name === 'Material.002') {
            mat.transparent = true;
            mat.opacity = 0.85;
            mat.roughness = 0.25;
            mat.metalness = 0.15;
          }

          // Purple Crystal Clusters (Material.077)
          if (mat.name === 'Material.077') {
            mat.emissive = new THREE.Color('#8b5cf6');
            mat.emissiveIntensity = 1.8;
            mat.roughness = 0.2;
          }
        }
      }
    });
  }, [scene]);

  return (
    // Permanently attached to the back edge of the floating island
    // Perfectly aligned with the Torii gate axis (X: -2.2, Y: ground level -0.7, Z: 7.6)
    // Facing straight into the gate (rotation: [0, 0, 0]) for a direct walkthrough into the arch
    <group 
      position={[-2.64, -5.79, -5.01]} 
      rotation={[0, 0, 0]} 
      scale={18}
    >
      <primitive object={scene} />

      {/* Atmospheric purple mana lighting casting glow on the floating island */}
      <pointLight 
        position={[0.02, 0.35, 0.7]} 
        color="#f472b6" 
        intensity={6.0} 
        distance={20} 
        castShadow
      />
      <pointLight 
        position={[0.02, 0.32, 0.6]} 
        color="#c084fc" 
        intensity={4.5} 
        distance={15} 
      />
      <pointLight 
        position={[0.02, 0.28, 0.8]} 
        color="#a855f7" 
        intensity={3.5} 
        distance={12} 
      />
    </group>
  );
}

// Preload models for immediate rendering
useGLTF.preload('/models/portal_night_version.glb');
useGLTF.preload('/models/mana_fantasy_teamed_portal.glb');

// --- MAIN CLIENT COMPONENT ---
export default function PortalExperimentClient() {
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(1);
  const [autoRotate, setAutoRotate] = useState(false);
  const [skyRotation, setSkyRotation] = useState(0);
  const [lightingMode, setLightingMode] = useState<'midnight' | 'arcane' | 'gold'>('midnight');
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (controlsRef.current && typeof window !== 'undefined') {
      (window as any).__CONTROLS = controlsRef.current;
    }
  });

  // Lighting presets
  const lightingConfigs = {
    midnight: {
      ambient: '#1e223d',
      ambientIntensity: 1.4,
      moonlight: '#93c5fd',
      moonIntensity: 2.8,
      lanternColor: '#f59e0b',
      lanternIntensity: 4.0,
      fog: '#060a18',
    },
    arcane: {
      ambient: '#24143d',
      ambientIntensity: 1.5,
      moonlight: '#c084fc',
      moonIntensity: 3.2,
      lanternColor: '#a855f7',
      lanternIntensity: 5.0,
      fog: '#0b0618',
    },
    gold: {
      ambient: '#291d12',
      ambientIntensity: 1.3,
      moonlight: '#fde047',
      moonIntensity: 2.6,
      lanternColor: '#fb923c',
      lanternIntensity: 4.5,
      fog: '#100a06',
    },
  };

  const currentLighting = lightingConfigs[lightingMode];

  const setCameraView = (view: 'walkthrough' | 'portal' | 'top' | 'front' | 'side') => {
    if (!controlsRef.current) return;
    const ctrl = controlsRef.current;
    
    switch (view) {
      case 'walkthrough':
        // Straight line looking through Torii gate into the Mana Fantasy Portal
        ctrl.object.position.set(-2.2, 1.8, -12.5);
        ctrl.target.set(-2.2, 2.0, 7.6);
        break;
      case 'portal':
        // Focused perspective right in front of the Mana Fantasy Teamed Portal
        ctrl.object.position.set(-2.2, 1.6, 2.8);
        ctrl.target.set(-2.2, 2.0, 7.6);
        break;
      case 'top':
        // Pure zenith 90-degree top view with clean sky globe
        ctrl.object.position.set(-2.2, 34, 1.5);
        ctrl.target.set(-2.2, 0, 1.5);
        break;
      case 'front':
        // Classic front overview
        ctrl.object.position.set(-2.2, 4.5, -20);
        ctrl.target.set(-2.2, 1.5, 2.0);
        break;
      case 'side':
        // Side perspective showing pathway and depth
        ctrl.object.position.set(-18, 5, 2.0);
        ctrl.target.set(-2.2, 1.5, 2.0);
        break;
    }
    ctrl.update();
  };

  if (!mounted) {
    return (
      <div className="w-screen h-screen bg-[#060814] flex flex-col items-center justify-center gap-3 text-white font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-zinc-400 tracking-widest uppercase">Connecting to Experiment Lab...</span>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060814] select-none font-sans">
      {/* 3D CANVAS */}
      <Canvas
        shadows
        camera={{ position: [-2.2, 1.8, -12.5], fov: 46, near: 0.1, far: 2000 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        {/* Soft atmospheric depth across expanded world radius */}
        <fog attach="fog" args={[currentLighting.fog, 100, 750]} />

        {/* Ambient & Directional Moonlight */}
        <ambientLight color={currentLighting.ambient} intensity={currentLighting.ambientIntensity} />
        <directionalLight
          position={[15, 28, 15]}
          color={currentLighting.moonlight}
          intensity={currentLighting.moonIntensity}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />

        {/* Lantern Accent Point Lights Around Portal Gate */}
        <pointLight position={[-0.5, 1.8, 6.0]} color={currentLighting.lanternColor} intensity={currentLighting.lanternIntensity} distance={15} />
        <pointLight position={[-0.5, 1.8, 3.0]} color={currentLighting.lanternColor} intensity={currentLighting.lanternIntensity} distance={15} />
        <pointLight position={[0.5, 3.0, 4.5]} color={currentLighting.moonlight} intensity={currentLighting.moonIntensity * 0.9} distance={14} />

        {/* 1. Seamless Expanded Sky Globe (Zero Pole Cracks & Slashes) */}
        {/* 2. Original Portal Night Version Island Base */}
        {/* 3. Mana Fantasy Teamed Portal Attached to Floating Island */}
        <Suspense fallback={<Loader />}>
          <OriginalSkyDome radius={420} skyRotation={skyRotation} />
          <PortalNightModel isPlaying={isPlaying} animSpeed={animSpeed} />
          <ManaFantasyTeamedPortal />
        </Suspense>

        {/* Full 360-Degree Vertical & Horizontal Orbit Camera Controls */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={[-2.2, 2.0, 7.6]}
          enableDamping
          dampingFactor={0.06}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          minDistance={1.0}
          maxDistance={600}
          minPolarAngle={0.0001}
          maxPolarAngle={Math.PI - 0.0001}
        />
      </Canvas>

      {/* TOP HEADER OVERLAY */}
      <div className="absolute top-4 inset-x-4 md:inset-x-6 flex items-center justify-between pointer-events-none z-30">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link
            href="/home"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={14} className="text-primary-400" />
            <span>Return</span>
          </Link>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide text-white">Shadow Realm Lab</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 border border-primary-500/30 uppercase">
                Mana Portal Attached
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              portal_night_version.glb + mana_fantasy_teamed_portal.glb
            </span>
          </div>
        </div>

        {/* Lighting Mood Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl pointer-events-auto">
          <button
            type="button"
            onClick={() => setLightingMode('midnight')}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer",
              lightingMode === 'midnight' ? "bg-blue-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
            )}
            title="Midnight Blue"
          >
            Midnight
          </button>
          <button
            type="button"
            onClick={() => setLightingMode('arcane')}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer",
              lightingMode === 'arcane' ? "bg-purple-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
            )}
            title="Arcane Violet"
          >
            Arcane
          </button>
          <button
            type="button"
            onClick={() => setLightingMode('gold')}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer",
              lightingMode === 'gold' ? "bg-amber-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
            )}
            title="Solar Ember"
          >
            Ember
          </button>
        </div>
      </div>

      {/* FLOATING BOTTOM CONTROL DOCK */}
      <div className="absolute bottom-5 inset-x-0 mx-auto w-fit max-w-[95vw] z-30 pointer-events-auto">
        <div className="flex flex-col items-center gap-2">
          {/* Main Controls Dock */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-2xl bg-black/75 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white">
            
            {/* Play/Pause Animation */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                isPlaying 
                  ? "bg-primary text-white shadow-md shadow-primary-900/40" 
                  : "bg-white/10 text-zinc-300 hover:bg-white/15 hover:text-white"
              )}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <div className="h-4 w-px bg-white/10 mx-0.5" />

            {/* Camera View Presets */}
            <button
              type="button"
              onClick={() => setCameraView('walkthrough')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-primary-300 hover:text-white hover:bg-primary-500/20 transition-all cursor-pointer"
              title="Straight walkthrough through the Torii gate into the Mana Fantasy Portal"
            >
              <DoorOpen size={12} />
              <span>Walkthrough</span>
            </button>
            <button
              type="button"
              onClick={() => setCameraView('portal')}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-purple-300 hover:text-white hover:bg-purple-500/20 transition-all cursor-pointer"
              title="Close perspective on the Mana Fantasy Portal"
            >
              Mana Portal
            </button>
            <button
              type="button"
              onClick={() => setCameraView('top')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Top Zenith View directly above the island"
            >
              <ArrowUp size={12} />
              <span>Top View</span>
            </button>
            <button
              type="button"
              onClick={() => setCameraView('front')}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setCameraView('side')}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              Side
            </button>

            <div className="h-4 w-px bg-white/10 mx-0.5" />

            {/* Auto-Rotate Toggle */}
            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer",
                autoRotate ? "bg-white/20 text-white font-bold" : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
              title="Toggle Auto Rotation"
            >
              <Compass size={12} className={cn(autoRotate && "animate-spin")} />
              <span className="hidden sm:inline">Orbit</span>
            </button>

            {/* Moon & Sky Position Toggle */}
            <button
              type="button"
              onClick={() => setSkyRotation(r => (r + Math.PI / 4) % (Math.PI * 2))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Rotate Sky & Moon Position"
            >
              <Moon size={12} className="text-amber-300" />
              <span className="hidden sm:inline">Moon</span>
            </button>

            {/* Reset Camera */}
            <button
              type="button"
              onClick={() => setCameraView('walkthrough')}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Reset to Walkthrough View"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Quick Helper Subtext */}
          <div className="text-[10px] text-zinc-500 font-mono tracking-wider">
            Left Click: Full 360° Rotate • Right Click: Pan • Scroll: Walk / Zoom
          </div>
        </div>
      </div>
    </div>
  );
}
