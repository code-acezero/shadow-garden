"use client";

/**
 * SHADOW GARDEN: ETERNAL ENGINE (VER 71.0 - PORTAL ENHANCED)
 * =============================================================================
 * * [FIXES]
 * - Fixed TS2747: Removed comment inside EffectComposer causing text node error.
 * - Fixed TS2322: Cleaned up conditional rendering for DepthOfField.
 * - Updated Skip Logic: "Skip" now unmounts the 3D engine immediately to show
 * the Landing Page (page.tsx) without redirecting to Home.
 * - Optimized for low-end laptops.
 */

import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom'; 
import { createPortal as create3DPortal, Canvas, useFrame, extend, useThree } from '@react-three/fiber'; 
import * as THREE from 'three';
import { 
    PerspectiveCamera, 
    Stars, 
    Sparkles, 
    CameraShake,
    Cylinder,
    shaderMaterial,
    Sky,
    Billboard,
    Instance,
    Instances,
    Float,
    Cone,
    Capsule
} from '@react-three/drei';
import { 
    EffectComposer, 
    Bloom, 
    ChromaticAberration, 
    ToneMapping,
    DepthOfField
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, Fingerprint, X, Sword, Wand2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PortalLoadingScreen from './PortalLoadingScreen';

// =============================================================================
// TYPES
// =============================================================================

declare global {
  namespace JSX {
    interface IntrinsicElements {
      warpShader: any;
      portalVortexShader: any;
      magmaShader: any;
      cloudShader: any;
    }
  }
}

type AppState = 'checking' | 'gender_select' | 'anim_choice' | 'loading' | 'running';
type AnimationStage = 
    | 'loading' | 'intro' | 'idle' 
    | 'drop' | 'crouch' | 'stand' | 'confusion' 
    | 'walk'
    | 'push' | 'suction' | 'whiteout';

type Gender = 'boy' | 'girl';
type PerformanceTier = 'low' | 'medium' | 'high';

interface Props {
    startTransition?: boolean;
    onComplete: () => void;
    onSceneReady?: () => void;
}

// =============================================================================
// PERFORMANCE DETECTION
// =============================================================================

const detectPerformanceTier = (): PerformanceTier => {
    if (typeof window === 'undefined') return 'medium';
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEndMobile = isMobile && (
        /Android [1-6]/.test(navigator.userAgent) ||
        /iPhone OS [1-9]_/.test(navigator.userAgent)
    );
    
    const cores = navigator.hardwareConcurrency || 2;
    const memory = (navigator as any).deviceMemory || 4;
    
    if (isLowEndMobile || cores <= 2 || memory < 4) {
        return 'low';
    } else if (isMobile || cores <= 4 || memory < 8) {
        return 'medium';
    }
    return 'high';
};

// =============================================================================
// SHADERS
// =============================================================================

const MagmaShader = shaderMaterial(
    {uTime:0,uColor:new THREE.Color("#ff3300"),uIntensity:2.5},
    `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    `varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uIntensity;void main(){float noise=sin(vUv.y*10.0-uTime*1.5)+cos(vUv.x*20.0);float vein=0.03/abs(vUv.x-0.5+noise*0.05);gl_FragColor=vec4(uColor*vein*uIntensity,smoothstep(0.0,1.0,vein));}`
);

// Enhanced Portal Vortex Shader - Wormhole Effect
const PortalVortexShader = shaderMaterial(
    {uTime:0,uColor:new THREE.Color("#ff0000"),uOpen:0,uSuction:0},
    `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpen;
    uniform float uSuction;
    
    void main(){
        vec2 center = vUv - 0.5;
        float dist = length(center);
        float angle = atan(center.y, center.x);
        
        // Wormhole spiral effect
        float spiral = sin(angle * 8.0 + dist * 30.0 - uTime * (2.0 + uSuction * 3.0));
        
        // Depth rings
        float rings = sin(dist * 40.0 - uTime * (3.0 + uSuction * 5.0));
        
        // Color transition from red to white at center
        vec3 white = vec3(1.0);
        vec3 purple = vec3(0.5, 0.0, 0.8);
        vec3 finalColor = mix(uColor, purple, uOpen * 0.3);
        finalColor = mix(finalColor, white, uOpen * smoothstep(0.4, 0.0, dist));
        
        // Add spiral and ring patterns
        finalColor *= (1.0 + spiral * 0.3 + rings * 0.2);
        
        // Vortex alpha with stronger center
        float alpha = smoothstep(0.5, 0.0, dist) * uOpen;
        alpha *= (1.0 + rings * 0.3);
        
        gl_FragColor = vec4(finalColor, alpha);
    }`
);

const CloudShader = shaderMaterial(
    {uTime:0,uColor:new THREE.Color("#552222"),uDensity:0.5},
    `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    `varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uDensity;float rand(vec2 n){return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453);}void main(){float noise=rand(vUv*15.0+uTime*0.05);float dist=distance(vUv,vec2(0.5));float alpha=(1.0-smoothstep(0.0,0.5,dist))*noise*uDensity;gl_FragColor=vec4(uColor,alpha);}`
);

const WarpShader = shaderMaterial(
    {uTime:0,uColor:new THREE.Color("#ffffff"),uSpeed:20.0},
    `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    `uniform float uTime;uniform vec3 uColor;uniform float uSpeed;varying vec2 vUv;void main(){float streak=sin(vUv.y*100.0+uTime*uSpeed);float opacity=smoothstep(0.9,1.0,streak)*smoothstep(0.0,0.2,vUv.x)*smoothstep(1.0,0.8,vUv.x);gl_FragColor=vec4(uColor,opacity*0.8);}`
);

extend({ MagmaShader, PortalVortexShader, CloudShader, WarpShader });

// =============================================================================
// AUDIO MATRIX
// =============================================================================

class AudioMatrix {
    private sources: Map<string, HTMLAudioElement> = new Map();
    private active: boolean = false;
    
    init() {
        if (this.active || typeof window === 'undefined') return;
        const library = { 
            wind: "/audio/sfx/wind.mp3", 
            grind: "/audio/sfx/grind.mp3", 
            boom: "/audio/sfx/boom.mp3", 
            step: "/audio/sfx/step.mp3", 
            drop: "/audio/sfx/drop.mp3", 
            heartbeat: "/audio/sfx/heartbeat.mp3", 
            scream: "/audio/sfx/scream.mp3", 
            suction: "/audio/sfx/wind_howl.mp3" 
        };
        Object.entries(library).forEach(([k, v]) => { 
            const a = new Audio(v); 
            a.preload = 'auto'; 
            a.volume = 0; 
            this.sources.set(k, a); 
        });
        ["track1.mp3", "track2.mp3", "track3.mp3"].forEach(f => { 
            const a = new Audio(`/audio/bgm/${f}`); 
            a.preload = 'auto'; 
            this.sources.set(`bgm_${f}`, a); 
        });
        this.active = true;
    }
    
    unlock() { 
        if(typeof window !== 'undefined') { 
            const Ctx = window.AudioContext || (window as any).webkitAudioContext; 
            if(Ctx) new Ctx().resume(); 
        } 
    }
    
    play(key: string, vol = 1, loop = false, fadeMs = 0) { 
        if(!this.active) this.init(); 
        const a = this.sources.get(key); 
        if(!a) return; 
        a.loop = loop; 
        if(!loop) a.currentTime = 0; 
        a.volume = fadeMs > 0 ? 0 : vol; 
        a.play().catch(() => {}); 
        if(fadeMs > 0) { 
            let v = 0; 
            const step = vol / (fadeMs/50); 
            const i = setInterval(() => { 
                v = Math.min(vol, v + step); 
                a.volume = v; 
                if(v >= vol) clearInterval(i); 
            }, 50); 
        } 
    }
    
    playRandomBGM() { 
        if (!this.active) this.init(); 
        const tracks = ["track1.mp3", "track2.mp3", "track3.mp3"]; 
        const key = `bgm_${tracks[Math.floor(Math.random() * tracks.length)]}`; 
        this.play(key, 0.2, true, 2000); 
    }
    
    stop(key: string, fadeMs = 0) { 
        const a = this.sources.get(key); 
        if (!a) return; 
        if (fadeMs > 0) { 
            const step = a.volume / (fadeMs/50); 
            const i = setInterval(() => { 
                a.volume = Math.max(0, a.volume - step); 
                if(a.volume <= 0) { 
                    a.pause(); 
                    clearInterval(i); 
                } 
            }, 50); 
        } else { 
            a.pause(); 
        } 
    }
    
    stopAll(fadeMs = 500) { 
        this.sources.forEach((_, key) => this.stop(key, fadeMs)); 
    }
}

const sfx = new AudioMatrix();

// =============================================================================
// PLAYER RIG
// =============================================================================

const PlayerRig = ({ stage }: { stage: AnimationStage }) => {
    const legsRef = useRef<THREE.Group>(null);
    
    useFrame((state, delta) => {
        if (!legsRef.current) return;
        const t = state.clock.elapsedTime;
        
        if (stage === 'walk') {
            legsRef.current.position.y = -1.7 + Math.sin(t * 12) * 0.05;
        } else if (stage === 'crouch') {
            legsRef.current.position.y = -0.8;
        } else {
            legsRef.current.position.y = -1.7;
        }
    });
    
    return (
        <group>
            {create3DPortal(
                <group ref={legsRef} position={[0, -1.7, 0.2]}>
                    <Capsule args={[0.18, 1.4]} position={[0.25, 0, 0]}>
                        <meshStandardMaterial color="#050505" />
                    </Capsule>
                    <Capsule args={[0.18, 1.4]} position={[-0.25, 0, 0]}>
                        <meshStandardMaterial color="#050505" />
                    </Capsule>
                </group>,
                useThree().camera
            )}
        </group>
    );
};

// =============================================================================
// SCENE COMPONENTS
// =============================================================================

// Portal Light Effect
const PortalCoreLight = ({ stage }: { stage: AnimationStage }) => {
    const lightRef = useRef<THREE.PointLight>(null);

    useFrame((state, delta) => {
        if (!lightRef.current) return;
        
        let targetInt = 0;

        if (stage === 'push') {
            targetInt = 200;
        } else if (stage === 'suction') {
            targetInt = 500;
        }

        lightRef.current.intensity = THREE.MathUtils.lerp(
            lightRef.current.intensity, 
            targetInt, 
            delta * 2.0
        );
    });

    return (
        <group position={[0, 5, -0.5]}>
            <pointLight 
                ref={lightRef} 
                color="#ffffff" 
                intensity={0} 
                distance={50} 
                decay={2} 
            />
        </group>
    );
};

// [NEW] Visible Portal Vortex Behind Door
const PortalVortex = ({ stage }: { stage: AnimationStage }) => {
    const matRef = useRef<any>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    
    useFrame((state, delta) => {
        if (!matRef.current || !meshRef.current) return;
        
        matRef.current.uTime = state.clock.elapsedTime;
        
        // Gradually increase portal visibility and suction as door opens
        let targetOpen = 0;
        let targetSuction = 0;
        
        if (stage === 'push') {
            // Door opening: portal becomes visible
            targetOpen = 0.7;
            targetSuction = 0.3;
        } else if (stage === 'suction') {
            // Full suction: maximum effect
            targetOpen = 1.0;
            targetSuction = 1.0;
        }
        
        matRef.current.uOpen = THREE.MathUtils.lerp(matRef.current.uOpen, targetOpen, delta * 2.0);
        matRef.current.uSuction = THREE.MathUtils.lerp(matRef.current.uSuction, targetSuction, delta * 1.5);
        
        // Rotate portal for dynamic effect
        meshRef.current.rotation.z += delta * (0.5 + matRef.current.uSuction * 2.0);
    });
    
    return (
        <mesh ref={meshRef} position={[0, 9, -1.5]} rotation={[0, 0, 0]}>
            <circleGeometry args={[6, 64]} />
            {/* @ts-ignore */}
            <portalVortexShader 
                ref={matRef}
                uColor={new THREE.Color("#ff0000")}
                uOpen={0}
                uSuction={0}
                transparent
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </mesh>
    );
};

const WarpTunnel = ({ active, quality }: { active: boolean; quality: PerformanceTier }) => {
    const tunnelRef = useRef<THREE.Group>(null);
    const matRef = useRef<any>(null);
    
    const segments = quality === 'low' ? 16 : quality === 'medium' ? 24 : 32;
    
    useFrame((state, delta) => {
        if (!active || !tunnelRef.current) return;
        tunnelRef.current.rotation.z += delta * 5; 
        if (matRef.current) matRef.current.uTime = state.clock.elapsedTime;
    });
    
    return (
        <group ref={tunnelRef} position={[0, 5, -20]} visible={active}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[12, 4, 80, segments, 1, true]} />
                <warpShader 
                    ref={matRef} 
                    uColor={new THREE.Color("#ccffff")} 
                    uSpeed={30.0} 
                    transparent 
                    side={THREE.BackSide} 
                    blending={THREE.AdditiveBlending} 
                />
            </mesh>
        </group>
    );
};

const ConstructedGate = ({ isOpen, quality }: { isOpen: boolean; quality: PerformanceTier }) => {
    const frameBricks = useMemo(() => {
        const b = [];
        const verticalCount = quality === 'low' ? 12 : 18;
        const archCount = quality === 'low' ? 16 : 24;
        
        for(let y=0; y<verticalCount; y++) { 
            b.push({ pos: [-7, y, 0], scale: [2.5, 0.9, 2.5], rot: [0,0,0] }); 
            b.push({ pos: [7, y, 0], scale: [2.5, 0.9, 2.5], rot: [0,0,0] }); 
        }
        b.push({ pos: [-7, -1, 0], scale: [3.5, 1.5, 3.5], rot: [0,0,0] }); 
        b.push({ pos: [7, -1, 0], scale: [3.5, 1.5, 3.5], rot: [0,0,0] });
        
        for(let i=0; i<archCount; i++) { 
            const angle = (i/(archCount-1)) * Math.PI; 
            const x = Math.cos(angle) * 7; 
            const y = Math.sin(angle) * 7 + 18; 
            b.push({ pos: [x, y, 0], scale: [2, 0.8, 2], rot: [0, 0, angle] }); 
        }
        b.push({ pos: [0, 25.5, 0], scale: [3, 1.5, 3], rot: [0,0,0.78] }); 
        return b;
    }, [quality]);
    
    const leftDoor = useRef<THREE.Group>(null);
    const rightDoor = useRef<THREE.Group>(null);
    
    useFrame((_, delta) => {
        if (!leftDoor.current || !rightDoor.current) return;
        const targetRot = isOpen ? -2.2 : 0;
        leftDoor.current.rotation.y = THREE.MathUtils.lerp(
            leftDoor.current.rotation.y, 
            targetRot, 
            delta * 0.4
        );
        rightDoor.current.rotation.y = THREE.MathUtils.lerp(
            rightDoor.current.rotation.y, 
            -targetRot, 
            delta * 0.4
        );
    });
    
    return (
        <group>
            <Instances range={frameBricks.length}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
                {frameBricks.map((d, i) => (
                    <Instance 
                        key={i} 
                        position={d.pos as any} 
                        scale={d.scale as any} 
                        rotation={d.rot as any} 
                    />
                ))}
            </Instances>
            
            <group position={[-7, 0, 0]} ref={leftDoor}>
                <mesh position={[3.5, 9, 0]} castShadow>
                    <boxGeometry args={[7, 18, 1]} />
                    <meshStandardMaterial color="#0f0505" roughness={0.4} />
                </mesh>
                <mesh position={[0, 0, 0.51]}>
                    <planeGeometry args={[0.5, 17]} />
                    {/* @ts-ignore */}
                    <magmaShader uColor={new THREE.Color("#ff0000")} transparent />
                </mesh>
            </group>
            
            <group position={[7, 0, 0]} ref={rightDoor}>
                <mesh position={[-3.5, 9, 0]} castShadow>
                    <boxGeometry args={[7, 18, 1]} />
                    <meshStandardMaterial color="#0f0505" roughness={0.4} />
                </mesh>
                <mesh position={[0, 0, 0.51]}>
                    <planeGeometry args={[0.5, 17]} />
                    {/* @ts-ignore */}
                    <magmaShader uColor={new THREE.Color("#ff0000")} transparent />
                </mesh>
            </group>
        </group>
    );
};

const CobblestoneRoad = ({ quality }: { quality: PerformanceTier }) => {
    const stones = useMemo(() => {
        const count = quality === 'low' ? 100 : quality === 'medium' ? 150 : 200;
        const arr = [];
        for(let i=0; i<count; i++) { 
            const z = i * 0.5 - 10; 
            const x = (Math.random() - 0.5) * 10; 
            arr.push({ 
                pos: [x, 0.05, z], 
                scale: 0.5 + Math.random() * 0.5, 
                rot: Math.random() * Math.PI 
            }); 
        }
        return arr;
    }, [quality]);
    
    const sphereSegments = quality === 'low' ? 32 : quality === 'medium' ? 48 : 64;
    
    return (
        <group>
            <mesh position={[0, -120, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <sphereGeometry args={[120, sphereSegments, sphereSegments]} />
                <meshStandardMaterial color="#050303" roughness={0.9} />
            </mesh>
            <Instances range={stones.length}>
                <cylinderGeometry args={[0.6, 0.7, 0.1, 7]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
                {stones.map((s, i) => (
                    <Instance 
                        key={i} 
                        position={s.pos as any} 
                        scale={[s.scale, 1, s.scale]} 
                        rotation={[0, s.rot, 0]} 
                    />
                ))}
            </Instances>
        </group>
    );
};

const Fireflies = ({ quality }: { quality: PerformanceTier }) => { 
    const ref = useRef<any>(); 
    const count = quality === 'low' ? 80 : quality === 'medium' ? 140 : 200;
    
    useFrame((state) => { 
        if(ref.current) { 
            ref.current.rotation.y += 0.001; 
            ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 2; 
        } 
    }); 
    
    return (
        <group ref={ref}>
            <Sparkles 
                count={count} 
                scale={[30, 10, 30]} 
                size={4} 
                speed={0.2} 
                opacity={0.8} 
                color="#ffaa00" 
                position={[0, 5, 20]} 
            />
        </group>
    );
};

const GuardianLamps = () => (
    <group>
        {[-9, 9].map((x) => (
            <group key={x} position={[x, 0, 6]}>
                <Cylinder args={[0.5, 0.8, 5, 8]} position={[0, 2.5, 0]}>
                    <meshStandardMaterial color="#050505" roughness={0.8} />
                </Cylinder>
                <mesh position={[0, 6.5, 0]}>
                    <planeGeometry args={[2.5, 6]} />
                    {/* @ts-ignore */}
                    <magmaShader 
                        uColor={new THREE.Color("#ff5500")} 
                        uIntensity={3.0} 
                        transparent 
                        side={THREE.DoubleSide} 
                    />
                </mesh>
                <pointLight 
                    position={[0, 6, 0]} 
                    color="#ff5500" 
                    intensity={30} 
                    distance={25} 
                    decay={2} 
                    castShadow 
                />
            </group>
        ))}
    </group>
);

const EveningStar = ({ quality }: { quality: PerformanceTier }) => {
    const sparkleCount = quality === 'low' ? 5 : 10;
    
    return (
        <group position={[-30, 40, -80]}>
            <mesh>
                <sphereGeometry args={[1.5, 16, 16]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            <pointLight intensity={5} color="#ffffff" distance={100} />
            <Sparkles 
                count={sparkleCount} 
                scale={5} 
                size={15} 
                speed={0} 
                opacity={0.8} 
                color="#ffffff" 
            />
        </group>
    );
};

const VolumetricClouds = ({ quality }: { quality: PerformanceTier }) => { 
    const ref = useRef<any>(); 
    const cloudCount = quality === 'low' ? 4 : quality === 'medium' ? 6 : 8;
    
    useFrame((state) => { 
        if(ref.current) ref.current.uTime = state.clock.elapsedTime; 
    }); 
    
    return (
        <group>
            {[...Array(cloudCount)].map((_, i) => (
                <mesh 
                    key={i} 
                    position={[
                        Math.random()*80-40, 
                        25+Math.random()*10, 
                        -50
                    ]} 
                    rotation={[0,0,0.1]}
                >
                    <planeGeometry args={[40, 20]} />
                    {/* @ts-ignore */}
                    <cloudShader 
                        transparent 
                        depthWrite={false} 
                        uColor={new THREE.Color("#552222")} 
                        ref={i===0?ref:null} 
                    />
                    <Billboard />
                </mesh>
            ))}
        </group>
    );
};

const FloatingIsland = ({ 
    position, 
    scale = 1 
}: { 
    position: [number, number, number]; 
    scale?: number;
}) => (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={1} position={position}>
        <group scale={scale}>
            <Cone args={[4, 5, 6]} rotation={[Math.PI, 0, 0]} position={[0, -2.5, 0]}>
                <meshStandardMaterial color="#2d2d2d" />
            </Cone>
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[4, 32]} />
                <meshStandardMaterial color="#1a2e1a" />
            </mesh>
            <Cylinder args={[0.2, 0.4, 1.5]} position={[1, 0.75, 1]}>
                <meshStandardMaterial color="#3d2817" />
            </Cylinder>
        </group>
    </Float>
);

// =============================================================================
// CAMERA DIRECTOR
// =============================================================================

const CameraDirector = ({ stage }: { stage: AnimationStage }) => {
    const { camera } = useThree();
    const currentTargetPos = useRef(new THREE.Vector3(0, 80, 80));
    const currentLookAt = useRef(new THREE.Vector3(0, 9, 0));
    const currentFov = useRef(60);
    const walkTime = useRef(0);
    const lookSway = useRef(0);
    const orbitOffset = useRef(0);

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;
        const desiredPos = new THREE.Vector3();
        const desiredLook = new THREE.Vector3();
        let targetFov = 60;

        desiredPos.copy(currentTargetPos.current); 
        desiredLook.copy(currentLookAt.current);

        switch(stage) {
            case 'loading': 
                desiredPos.set(0, 80, 80); 
                desiredLook.set(0, 9, 0); 
                break;
            case 'intro': 
                desiredPos.set(0, 7, 45); 
                desiredLook.set(0, 9, 0); 
                orbitOffset.current = t; 
                break;
            case 'idle': 
                const relTime = t - orbitOffset.current;
                const r = 42;
                desiredPos.x = Math.sin(relTime * 0.05) * r;
                desiredPos.z = Math.cos(relTime * 0.05) * r;
                desiredPos.y = 9 + Math.cos(relTime * 0.15) * 2;
                desiredLook.set(0, 10, 0);
                break;
            case 'drop': 
                desiredPos.set(0, 0.8, 35); 
                desiredLook.set(0, -5, 10); 
                break;
            case 'crouch': 
                desiredPos.set(0, 0.5, 35); 
                desiredLook.set(0, 0, 30); 
                break;
            case 'stand': 
                desiredPos.set(0, 1.8, 35); 
                desiredLook.set(0, 7, 0); 
                break;
            case 'confusion': 
                desiredPos.set(0, 1.8, 35);
                desiredLook.set(0.5, 1.5, 34.5); 
                lookSway.current += delta * 3;
                desiredLook.x += Math.sin(lookSway.current); 
                break;
            case 'walk':
                walkTime.current += delta * 7;
                desiredPos.set(
                    Math.cos(walkTime.current * 0.5) * 0.05, 
                    1.8 + Math.sin(walkTime.current) * 0.1, 
                    20 - (walkTime.current * 0.5)
                );
                if (desiredPos.z < 6) desiredPos.z = 6;
                desiredLook.set(0, 7, 0);
                break;
            case 'push':
                desiredPos.set(0, 1.8, 6); 
                desiredLook.set(0, 1.8, -10);
                break;
            case 'suction': 
                desiredPos.set(0, 1.8, -25); 
                desiredLook.set(0, 9, -50); 
                targetFov = 120;
                break;
        }

        const smoothSpeed = stage === 'drop' || stage === 'suction' ? 4.0 : 1.5;
        currentTargetPos.current.lerp(desiredPos, delta * smoothSpeed);
        currentLookAt.current.lerp(desiredLook, delta * (smoothSpeed * 0.8));
        currentFov.current = THREE.MathUtils.lerp(currentFov.current, targetFov, delta * 2);

        camera.position.copy(currentTargetPos.current);
        camera.lookAt(currentLookAt.current);
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.fov = currentFov.current;
            camera.updateProjectionMatrix();
        }
    });
    
    return null;
};

// =============================================================================
// MAIN SCENE
// =============================================================================

const SceneContent = ({ 
    stage, 
    quality 
}: { 
    stage: AnimationStage; 
    quality: PerformanceTier;
}) => {
    const isOpen = stage === 'push' || stage === 'suction';
    const isWarp = stage === 'suction'; 
    const isAction = stage !== 'idle' && stage !== 'intro' && stage !== 'loading';

    const starCount = quality === 'low' ? 3000 : quality === 'medium' ? 5000 : 8000;

    return (
        <>
            <CameraDirector stage={stage} />
            <PlayerRig stage={stage} />
            
            <fog attach="fog" args={['#1a0505', 20, 120]} /> 
            <Sky 
                sunPosition={[-5, -0.02, -10]} 
                inclination={0.6} 
                azimuth={0.25} 
                turbidity={10} 
                rayleigh={3.0} 
                mieCoefficient={0.005} 
            />
            <Stars radius={100} count={starCount} fade factor={4} />
            <EveningStar quality={quality} />
            <VolumetricClouds quality={quality} />
            <Fireflies quality={quality} />
            
            <ambientLight intensity={0.1} color="#2a1a1a" />
            <directionalLight 
                position={[0, 10, -50]} 
                intensity={3} 
                color="#ff3300" 
            /> 
            <directionalLight 
                position={[-20, 40, 20]} 
                intensity={0.5} 
                color="#4444ff" 
                castShadow 
            /> 
            <pointLight 
                position={[0, 9, -5]} 
                intensity={isOpen ? 300 : 5} 
                color="#ff0000" 
                distance={60} 
                decay={2} 
            />
            
            <group position={[0, -2, 0]}>
                <ConstructedGate isOpen={isOpen} quality={quality} />
                <CobblestoneRoad quality={quality} />
                <GuardianLamps />
                <PortalCoreLight stage={stage} />
                <PortalVortex stage={stage} />
            </group>
            
            <WarpTunnel active={isWarp} quality={quality} />
            <FloatingIsland position={[-25, 5, 20]} scale={1.5} />
            <FloatingIsland position={[30, 8, 10]} scale={2} />
            
            <EffectComposer enableNormalPass={false} multisampling={0}>
                <Bloom 
                    luminanceThreshold={0.2} 
                    mipmapBlur 
                    intensity={isOpen ? 4.0 : 1.8} 
                    radius={0.5} 
                />
                <ChromaticAberration 
                    offset={new THREE.Vector2(
                        isWarp ? 0.05 : 0.001, 
                        isWarp ? 0.05 : 0.001
                    )} 
                />
                {quality !== 'low' ? (
                    <DepthOfField 
                        focusDistance={isAction ? 0.02 : 0.05} 
                        focalLength={0.5} 
                        bokehScale={2} 
                        height={480} 
                    />
                ) : <></>} 
                <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
        </>
    );
};

// =============================================================================
// UI OVERLAYS
// =============================================================================

const GenderSelection = ({ onSelect }: { onSelect: (g: Gender) => void }) => (
    <div className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="max-w-2xl w-full border border-white/10 bg-white/5 p-10 rounded-3xl text-center backdrop-blur-xl"
        >
            <div className="flex justify-center items-center gap-2 mb-8">
                <h2 className="text-3xl text-white font-bold tracking-widest font-demoness">
                    IDENTITY CONFIRMATION
                </h2>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info className="w-5 h-5 text-gray-400 hover:text-white" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Required to calibrate your visual avatar.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="grid grid-cols-2 gap-8">
                <button 
                    onClick={() => onSelect('boy')} 
                    className="group p-8 border border-white/5 bg-black/40 hover:border-blue-500 rounded-2xl transition-all flex flex-col items-center gap-6"
                >
                    <Sword className="w-12 h-12 text-blue-400" />
                    <span className="text-xl font-bold text-white tracking-widest">MALE</span>
                </button>
                <button 
                    onClick={() => onSelect('girl')} 
                    className="group p-8 border border-white/5 bg-black/40 hover:border-pink-500 rounded-2xl transition-all flex flex-col items-center gap-6"
                >
                    <Wand2 className="w-12 h-12 text-pink-400" />
                    <span className="text-xl font-bold text-white tracking-widest">FEMALE</span>
                </button>
            </div>
        </motion.div>
    </div>
);

const AnimationPreferencePopup = ({ 
    onChoice 
}: { 
    onChoice: (play: boolean, pauseDays: number) => void;
}) => {
    const [pause7, setPause7] = useState(false); 
    const [never, setNever] = useState(false);
    
    return (
        <div className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="max-w-md w-full bg-[#0a0505] border border-red-900/50 p-8 rounded-2xl"
            >
                <h3 className="text-2xl text-white font-bold mb-4 font-demoness tracking-widest">
                    PLAY SEQUENCE?
                </h3>
                <div className="flex gap-4 mb-6">
                    <Button 
                        onClick={() => onChoice(true, never ? 9999 : (pause7 ? 7 : 0))} 
                        className="flex-1 bg-red-700 hover:bg-red-600"
                    >
                        YES, SHOW
                    </Button>
                    <Button 
                        onClick={() => onChoice(false, never ? 9999 : (pause7 ? 7 : 0))} 
                        variant="outline" 
                        className="flex-1"
                    >
                        NO, SKIP
                    </Button>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="pause" 
                            checked={pause7} 
                            onCheckedChange={(c) => { 
                                setPause7(!!c); 
                                if(c) setNever(false); 
                            }} 
                        />
                        <label htmlFor="pause" className="text-xs text-gray-400">
                            Pause for 7 days
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="never" 
                            checked={never} 
                            onCheckedChange={(c) => { 
                                setNever(!!c); 
                                if(c) setPause7(false); 
                            }} 
                        />
                        <label htmlFor="never" className="text-xs text-gray-400">
                            Never ask again
                        </label>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const GuildCookieNotice = ({ 
    onAccept, 
    onDecline 
}: { 
    onAccept: () => void; 
    onDecline: () => void;
}) => {
    if (typeof document === 'undefined') return <></>;
    
    return (
        <>
            {createPortal(
                <div className="fixed bottom-10 left-0 right-0 mx-auto z-[99999] w-full flex justify-center px-4 pointer-events-none">
                    <motion.div 
                        initial={{ y: 50, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        className="bg-[#0a0505]/95 backdrop-blur-xl border border-red-900/50 rounded-xl p-5 shadow-2xl max-w-sm w-full pointer-events-auto"
                    >
                        <div className="flex items-start gap-4 mb-3">
                            <div className="p-3 bg-gradient-to-br from-red-900/40 to-black rounded-full border border-red-500/20">
                                <Scroll className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold font-demoness tracking-widest text-lg mb-1">
                                    GUILD NOTICE
                                </h4>
                                <p className="text-gray-400 text-xs font-nyctophobia tracking-wide">
                                    Shadow Garden employs magical cookies. Accept to synchronize.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                onClick={onAccept} 
                                className="flex-1 bg-red-700 hover:bg-red-600 text-white text-xs font-bold border border-red-500/50 h-10"
                            >
                                <Fingerprint className="w-3 h-3 mr-2" /> SIGN CONTRACT
                            </Button>
                            <Button 
                                onClick={onDecline} 
                                variant="outline" 
                                className="flex-1 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 h-10 text-xs"
                            >
                                <X className="w-3 h-3 mr-1" /> DECLINE
                            </Button>
                        </div>
                    </motion.div>
                </div>, 
                document.body
            )}
        </>
    );
};

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

export default function ShadowGardenPortal({ 
    startTransition, 
    onComplete, 
    onSceneReady 
}: Props) {
    const [appState, setAppState] = useState<AppState>('checking');
    const [gender, setGender] = useState<Gender | null>(null);
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState<AnimationStage>('loading');
    const [whiteout, setWhiteout] = useState(false);
    const [shake, setShake] = useState(0);
    const [showCookie, setShowCookie] = useState(false);
    const [quality] = useState<PerformanceTier>(detectPerformanceTier());
    
    // NEW: State to track if user skipped the intro
    const [skipped, setSkipped] = useState(false);
    
    const onSceneReadyRef = useRef(onSceneReady);
    useEffect(() => { 
        onSceneReadyRef.current = onSceneReady; 
    }, [onSceneReady]);

    useEffect(() => {
        const savedGender = localStorage.getItem('guest_gender') as Gender;
        if (!localStorage.getItem('SG_GUILD_CONTRACT')) {
            setTimeout(() => setShowCookie(true), 1500);
        }

        if (!savedGender) {
            setAppState('gender_select');
        } else {
            setGender(savedGender);
            setAppState('anim_choice');
        }
    }, []);

    const handleGenderSelect = (g: Gender) => {
        setGender(g); 
        localStorage.setItem('guest_gender', g); 
        sfx.unlock(); 
        setAppState('anim_choice');
    };

    const handleAnimChoice = (play: boolean, days: number) => {
        sfx.unlock(); 
        localStorage.setItem('anim_preference', play ? 'play' : 'skip');
        if (days > 0) { 
            if (days === 9999) {
                localStorage.setItem('anim_never_ask', 'true'); 
            } else {
                localStorage.setItem(
                    'anim_pause_until', 
                    (new Date().getTime() + days*86400000).toString()
                ); 
            }
        }
        if (play) {
            setAppState('loading'); 
        } else {
            // FIX: Instead of calling onComplete() which redirects to Home,
            // we set skipped to true to "turn off the engine" and show the landing page.
            sfx.stopAll();
            setSkipped(true);
        }
    };

    useEffect(() => {
        if (appState !== 'loading') return;
        sfx.init();
        let p = 0;
        const i = setInterval(() => {
            p += 2; 
            setProgress(p);
            if (p >= 100) {
                clearInterval(i);
                setTimeout(() => {
                    setAppState('running'); 
                    setStage('intro');
                    sfx.playRandomBGM(); 
                    sfx.play('wind', 0.2, true);
                    setTimeout(() => {
                        setStage('idle');
                        onSceneReadyRef.current?.(); 
                    }, 4000);
                }, 500);
            }
        }, 30);
        return () => clearInterval(i);
    }, [appState]);

    useEffect(() => {
        if (startTransition && stage === 'idle') {
            performEntrySequence();
        }
    }, [startTransition, stage]);

    const performEntrySequence = () => {
        sfx.init(); 
        setStage('drop');
        sfx.play('wind', 0.8); 
        
        setTimeout(() => { 
            setStage('crouch'); 
            sfx.play('drop', 0.6); 
            setShake(4.0); 
        }, 1500);
        
        setTimeout(() => { 
            setStage('stand'); 
            setShake(0); 
        }, 2500);
        
        setTimeout(() => { 
            setStage('confusion'); 
        }, 3500);
        
        setTimeout(() => { 
            setStage('walk'); 
            sfx.play('step', 0.5, true); 
        }, 5500);

        setTimeout(() => { 
            setStage('push'); 
            sfx.stop('step'); 
            sfx.play('grind', 0.8); 
            sfx.play('boom', 0.7); 
            setShake(1.0); 
        }, 9500);

        setTimeout(() => { 
            setStage('suction'); 
            sfx.play('suction', 0.8); 
            sfx.play('scream', 0.6); 
            setShake(10.0); 
        }, 11500);

        setTimeout(() => setWhiteout(true), 11800);
        setTimeout(() => { 
            sfx.stopAll(200); 
            onComplete(); 
        }, 14500);
    };

    // FIX: Early return if skipped. This unmounts the 3D Canvas and overlay,
    // revealing the normal landing page underneath.
    if (skipped) return null;

    if (appState === 'gender_select') {
        return <GenderSelection onSelect={handleGenderSelect} />;
    }
    
    if (appState === 'anim_choice') {
        return <AnimationPreferencePopup onChoice={handleAnimChoice} />;
    }

    const dpr = quality === 'low' ? [0.5, 1] : quality === 'medium' ? [1, 1.25] : [1, 1.5];

    return (
        <div className="fixed inset-0 z-0 bg-black pointer-events-none">
            <AnimatePresence>
                {showCookie && (
                    <GuildCookieNotice 
                        onAccept={() => { 
                            localStorage.setItem('SG_GUILD_CONTRACT', 'true'); 
                            setShowCookie(false); 
                        }} 
                        onDecline={() => { 
                            localStorage.setItem('SG_GUILD_CONTRACT', 'false'); 
                            setShowCookie(false); 
                        }} 
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {appState === 'loading' && (
                    <div className="absolute inset-0 z-[200] pointer-events-auto">
                        <PortalLoadingScreen progress={progress} />
                    </div>
                )}
            </AnimatePresence>

            {appState === 'running' && (
                <Canvas 
                    shadows 
                    dpr={dpr as any} 
                    gl={{ 
                        antialias: quality !== 'low', 
                        powerPreference: "high-performance",
                        alpha: false,
                        stencil: false,
                        depth: true
                    }}
                    performance={{ min: 0.5 }}
                >
                    <Suspense fallback={null}>
                        <PerspectiveCamera makeDefault position={[0, 60, 60]} fov={60} />
                        <CameraShake 
                            maxYaw={0.05} 
                            maxPitch={0.05} 
                            maxRoll={0.05} 
                            yawFrequency={shake} 
                            pitchFrequency={shake} 
                            rollFrequency={shake} 
                            intensity={shake} 
                        />
                        <SceneContent stage={stage} quality={quality} />
                    </Suspense>
                </Canvas>
            )}

            <motion.div 
                initial={{ opacity: 0 }} 
                animate={whiteout ? { opacity: 1 } : { opacity: 0 }} 
                transition={{ duration: 2.5 }} 
                className="absolute inset-0 bg-white z-[10000]" 
            />
        </div>
    );
}