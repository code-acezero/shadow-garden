"use client";

/**
 * SHADOW GARDEN: ETERNAL ENGINE (VER 76.2 - TYPESCRIPT FIX FINAL)
 * =============================================================================
 * [UPDATES]
 * - Fixed TypeScript error with conditional rendering (changed && to ternary with null)
 * - All performance optimizations preserved
 * - All functions, features, logic, and designs maintained
 */

import React, { useRef, useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
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
    DepthOfField, 
    Vignette
} from '@react-three/postprocessing';
import { ToneMappingMode, BlendFunction } from 'postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, Fingerprint, X, Sword, Wand2, Info, Power, FastForward, PlayCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PortalLoadingScreen from './PortalLoadingScreen';

// =============================================================================
// TYPES
// =============================================================================

interface CustomShaderMaterialProps {
    ref?: React.Ref<any>;
    uColor?: THREE.Color;
    uOpen?: number;
    uSuction?: number;
    uTime?: number;
    uSpeed?: number;
    uIntensity?: number;
    uDensity?: number;
    transparent?: boolean;
    side?: THREE.Side;
    blending?: THREE.Blending;
    depthWrite?: boolean;
    [key: string]: any; 
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      warpShader: CustomShaderMaterialProps;
      portalVortexShader: CustomShaderMaterialProps;
      magmaShader: CustomShaderMaterialProps;
      cloudShader: CustomShaderMaterialProps;
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
type PerformanceTier = 'potato' | 'low' | 'medium' | 'high';

interface Props {
    startTransition?: boolean;
    onComplete: () => void;
    onSceneReady?: () => void;
}

// =============================================================================
// PERFORMANCE DETECTION (ENHANCED)
// =============================================================================

const detectPerformanceTier = (): PerformanceTier => {
    if (typeof window === 'undefined') return 'medium';
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isLowEndMobile = isMobile && (
        /Android [1-7]/.test(navigator.userAgent) ||
        /iPhone OS [1-11]_/.test(navigator.userAgent)
    );
    
    const cores = navigator.hardwareConcurrency || 2;
    const memory = (navigator as any).deviceMemory || 2;
    
    // Very aggressive detection for potato tier (most Android devices)
    if (isLowEndMobile || (isAndroid && cores <= 4) || memory < 3) {
        return 'potato';
    }
    
    // Low tier for budget devices
    if (isMobile || cores <= 2 || memory < 4) {
        return 'low';
    }
    
    // Medium tier for average devices
    if (cores <= 4 || memory < 8) {
        return 'medium';
    }
    
    return 'high';
};

// Frame rate monitor for dynamic quality adjustment
class PerformanceMonitor {
    private frameCount = 0;
    private lastTime = performance.now();
    private fps = 60;
    
    update(): number {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime >= this.lastTime + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
        
        return this.fps;
    }
    
    shouldDowngrade(): boolean {
        return this.fps < 25;
    }
}

const perfMonitor = new PerformanceMonitor();

// =============================================================================
// OPTIMIZED SHADERS (SIMPLIFIED)
// =============================================================================

const MagmaShader = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color("#ff3300"),
        uIntensity: 2.5
    },
    `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    `varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uIntensity;void main(){float noise=sin(vUv.y*8.0-uTime*1.2)+cos(vUv.x*15.0);float vein=0.03/abs(vUv.x-0.5+noise*0.04);float pulse=sin(uTime*1.5)*0.25+0.75;vec3 finalColor=uColor*vein*uIntensity;float alpha=smoothstep(0.0,1.0,vein)*pulse*0.8;gl_FragColor=vec4(finalColor,alpha);}`
);

const PortalVortexShader = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color("#ff0000"),
        uOpen: 0,
        uSuction: 0
    },
    `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    `varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uOpen;uniform float uSuction;void main(){vec2 center=vUv-0.5;float dist=length(center);float angle=atan(center.y,center.x);float spiral=sin(angle*6.0+dist*20.0-uTime*(2.0+uSuction*2.0));float rings=sin(dist*30.0-uTime*(2.5+uSuction*3.0));vec3 baseColor=mix(vec3(0.8,0.2,0.2),vec3(1.0,0.7,0.7),smoothstep(0.5,0.2,dist));vec3 finalColor=mix(baseColor,vec3(1.0),uOpen*smoothstep(0.4,0.0,dist));finalColor*=(1.0+spiral*0.3+rings*0.25);float alpha=smoothstep(0.5,0.0,dist)*uOpen*(1.0+rings*0.3);gl_FragColor=vec4(finalColor,alpha);}`
);

const CloudShader = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color("#552222"),
        uDensity: 0.5
    },
    `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    `varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uDensity;float rand(vec2 n){return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453);}float noise(vec2 p){vec2 ip=floor(p);vec2 u=fract(p);u=u*u*(3.0-2.0*u);return mix(mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);}void main(){float n=noise(vUv*10.0+uTime*0.04)*0.7;n+=noise(vUv*20.0+uTime*0.02)*0.3;float dist=distance(vUv,vec2(0.5));float alpha=(1.0-smoothstep(0.0,0.5,dist))*n*uDensity;gl_FragColor=vec4(uColor,alpha);}`
);

const WarpShader = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color("#ffffff"),
        uSpeed: 20.0
    },
    `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    `uniform float uTime;uniform vec3 uColor;uniform float uSpeed;varying vec2 vUv;void main(){float streak=sin(vUv.y*80.0+uTime*uSpeed);float opacity=smoothstep(0.92,1.0,streak);opacity*=smoothstep(0.0,0.15,vUv.x)*smoothstep(1.0,0.85,vUv.x);gl_FragColor=vec4(uColor,opacity*0.7);}`
);

extend({ MagmaShader, PortalVortexShader, CloudShader, WarpShader });

// =============================================================================
// AUDIO MATRIX (OPTIMIZED)
// =============================================================================

class AudioMatrix {
    private sources: Map<string, HTMLAudioElement> = new Map();
    private active: boolean = false;
    
    init() {
        if (this.active || typeof window === 'undefined') return;
        
        const library = { 
            wind: "https://cdn.freesound.org/previews/442/442827_5121236-lq.mp3",
            grind: "https://cdn.freesound.org/previews/536/536445_11523163-lq.mp3",
            boom: "https://cdn.freesound.org/previews/442/442902_5121236-lq.mp3",
            step: "https://cdn.freesound.org/previews/320/320181_527080-lq.mp3",
            drop: "https://cdn.freesound.org/previews/442/442900_5121236-lq.mp3",
            suction: "https://cdn.freesound.org/previews/442/442828_5121236-lq.mp3"
        };
        
        Object.entries(library).forEach(([k, v]) => { 
            const a = new Audio(v); 
            a.preload = 'auto'; 
            a.volume = 0;
            a.crossOrigin = 'anonymous';
            this.sources.set(k, a); 
        });
        
        const bgmTracks = [
            "https://cdn.pixabay.com/audio/2022/03/10/audio_4f5c0a36b0.mp3"
        ];
        
        bgmTracks.forEach((url, idx) => { 
            const a = new Audio(url); 
            a.preload = 'auto';
            a.crossOrigin = 'anonymous';
            this.sources.set(`bgm_${idx}`, a); 
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
        this.play('bgm_0', 0.25, true, 2000); 
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
// PLAYER RIG (OPTIMIZED)
// =============================================================================

const PlayerRig = React.memo(({ stage }: { stage: AnimationStage }) => {
    const legsRef = useRef<THREE.Group>(null);
    
    useFrame((state) => {
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
        <group position={[0, 1.7, 0]}>
            <group ref={legsRef} position={[0, -1.7, 0.2]}>
                <Capsule args={[0.18, 1.4]} position={[0.25, 0, 0]}>
                    <meshStandardMaterial color="#050505" metalness={0.3} roughness={0.7} />
                </Capsule>
                <Capsule args={[0.18, 1.4]} position={[-0.25, 0, 0]}>
                    <meshStandardMaterial color="#050505" metalness={0.3} roughness={0.7} />
                </Capsule>
            </group>
        </group>
    );
});

PlayerRig.displayName = 'PlayerRig';

// =============================================================================
// SCENE COMPONENTS (OPTIMIZED)
// =============================================================================

const PortalCoreLight = React.memo(({ stage }: { stage: AnimationStage }) => {
    const lightRef = useRef<THREE.PointLight>(null);

    useFrame((state, delta) => {
        if (!lightRef.current) return;
        
        let targetInt = 0;
        if (stage === 'push') {
            targetInt = 150;
        } else if (stage === 'suction') {
            targetInt = 300;
        }

        lightRef.current.intensity = THREE.MathUtils.lerp(
            lightRef.current.intensity, 
            targetInt, 
            delta * 2.5
        );
    });

    return (
        <group position={[0, 5, -0.5]}>
            <pointLight 
                ref={lightRef} 
                color="#ffffff" 
                intensity={0} 
                distance={40} 
                decay={2} 
            />
        </group>
    );
});

PortalCoreLight.displayName = 'PortalCoreLight';

const PortalVortex = React.memo(({ stage }: { stage: AnimationStage }) => {
    const matRef = useRef<any>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    
    useFrame((state, delta) => {
        if (!matRef.current || !meshRef.current) return;
        
        matRef.current.uTime = state.clock.elapsedTime;
        
        let targetOpen = 0;
        let targetSuction = 0;
        
        if (stage === 'push') {
            targetOpen = 1.0;
            targetSuction = 0.5;
        } else if (stage === 'suction') {
            targetOpen = 1.0;
            targetSuction = 1.0;
        }
        
        matRef.current.uOpen = targetOpen;
        matRef.current.uSuction = targetSuction;
        
        meshRef.current.rotation.z += delta * (0.4 + matRef.current.uSuction * 1.5);
    });
    
    return (
        <mesh ref={meshRef} position={[0, 9, -1.5]} rotation={[0, 0, 0]}>
            <circleGeometry args={[6, 48]} />
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
});

PortalVortex.displayName = 'PortalVortex';

const WarpTunnel = React.memo(({ active, quality }: { active: boolean; quality: PerformanceTier }) => {
    const tunnelRef = useRef<THREE.Group>(null);
    const matRef = useRef<any>(null);
    
    const segments = quality === 'potato' ? 12 : quality === 'low' ? 16 : quality === 'medium' ? 20 : 24;
    
    useFrame((state, delta) => {
        if (!active || !tunnelRef.current) return;
        tunnelRef.current.rotation.z += delta * 4; 
        if (matRef.current) matRef.current.uTime = state.clock.elapsedTime;
    });
    
    return (
        <group ref={tunnelRef} position={[0, 5, -20]} visible={active}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[12, 4, 80, segments, 1, true]} />
                <warpShader 
                    ref={matRef} 
                    uColor={new THREE.Color("#ccffff")} 
                    uSpeed={25.0} 
                    transparent 
                    side={THREE.BackSide} 
                    blending={THREE.AdditiveBlending} 
                />
            </mesh>
        </group>
    );
});

WarpTunnel.displayName = 'WarpTunnel';

const ConstructedGate = React.memo(({ isOpen, quality }: { isOpen: boolean; quality: PerformanceTier }) => {
    const frameBricks = useMemo(() => {
        const b = [];
        const verticalCount = quality === 'potato' ? 10 : quality === 'low' ? 12 : 15;
        const archCount = quality === 'potato' ? 12 : quality === 'low' ? 16 : 20;
        
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
    const magmaRefs = useRef<any[]>([]);
    
    useFrame((state, delta) => {
        if (!leftDoor.current || !rightDoor.current) return;
        const targetRot = isOpen ? -2.2 : 0;
        leftDoor.current.rotation.y = THREE.MathUtils.lerp(
            leftDoor.current.rotation.y, 
            targetRot, 
            delta * 0.35
        );
        rightDoor.current.rotation.y = THREE.MathUtils.lerp(
            rightDoor.current.rotation.y, 
            -targetRot, 
            delta * 0.35
        );
        
        magmaRefs.current.forEach(mat => {
            if (mat) mat.uTime = state.clock.elapsedTime;
        });
    });
    
    return (
        <group>
            <Instances range={frameBricks.length}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial 
                    color="#0a0a0a" 
                    roughness={0.9} 
                    metalness={0.1}
                />
                {frameBricks.map((d, i) => (
                    <Instance 
                        key={i} 
                        position={d.pos as [number, number, number]} 
                        scale={d.scale as [number, number, number]} 
                        rotation={d.rot as [number, number, number]} 
                    />
                ))}
            </Instances>
            
            <group position={[-7, 0, 0]} ref={leftDoor}>
                <mesh position={[3.5, 9, 0]} castShadow>
                    <boxGeometry args={[7, 18, 1]} />
                    <meshStandardMaterial 
                        color="#0f0505" 
                        roughness={0.4} 
                        metalness={0.6}
                        emissive="#330000"
                        emissiveIntensity={0.2}
                    />
                </mesh>
                <mesh position={[0, 0, 0.51]}>
                    <planeGeometry args={[0.5, 17]} />
                    <magmaShader 
                        ref={(el: any) => magmaRefs.current[0] = el}
                        uColor={new THREE.Color("#ff0000")} 
                        transparent 
                    />
                </mesh>
            </group>
            
            <group position={[7, 0, 0]} ref={rightDoor}>
                <mesh position={[-3.5, 9, 0]} castShadow>
                    <boxGeometry args={[7, 18, 1]} />
                    <meshStandardMaterial 
                        color="#0f0505" 
                        roughness={0.4} 
                        metalness={0.6}
                        emissive="#330000"
                        emissiveIntensity={0.2}
                    />
                </mesh>
                <mesh position={[0, 0, 0.51]}>
                    <planeGeometry args={[0.5, 17]} />
                    <magmaShader 
                        ref={(el: any) => magmaRefs.current[1] = el}
                        uColor={new THREE.Color("#ff0000")} 
                        transparent 
                    />
                </mesh>
            </group>
        </group>
    );
});

ConstructedGate.displayName = 'ConstructedGate';

const CobblestoneRoad = React.memo(({ quality, whiteout }: { quality: PerformanceTier; whiteout: number }) => {
    const stones = useMemo(() => {
        const count = quality === 'potato' ? 60 : quality === 'low' ? 80 : quality === 'medium' ? 120 : 150;
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
    
    const sphereSegments = quality === 'potato' ? 24 : quality === 'low' ? 32 : quality === 'medium' ? 40 : 48;
    
    const baseColor = new THREE.Color("#050303");
    const whiteColor = new THREE.Color("#ffffff");
    const currentColor = baseColor.clone().lerp(whiteColor, whiteout);
    
    return (
        <group>
            <mesh position={[0, -120, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <sphereGeometry args={[120, sphereSegments, sphereSegments]} />
                <meshStandardMaterial 
                    color={currentColor} 
                    roughness={0.9}
                    metalness={0.1}
                    emissive={whiteColor}
                    emissiveIntensity={whiteout * 2}
                />
            </mesh>
            <Instances range={stones.length}>
                <cylinderGeometry args={[0.6, 0.7, 0.1, 6]} />
                <meshStandardMaterial 
                    color={new THREE.Color("#1a1a1a").lerp(whiteColor, whiteout)} 
                    roughness={0.8}
                    metalness={0.2}
                    emissive={whiteColor}
                    emissiveIntensity={whiteout}
                />
                {stones.map((s, i) => (
                    <Instance 
                        key={i} 
                        position={s.pos as [number, number, number]} 
                        scale={[s.scale, 1, s.scale]} 
                        rotation={[0, s.rot, 0]} 
                    />
                ))}
            </Instances>
        </group>
    );
});

CobblestoneRoad.displayName = 'CobblestoneRoad';

const Fireflies = React.memo(({ quality }: { quality: PerformanceTier }) => { 
    const ref = useRef<any>(); 
    const count = quality === 'potato' ? 40 : quality === 'low' ? 60 : quality === 'medium' ? 100 : 140;
    
    useFrame((state) => { 
        if(ref.current) { 
            ref.current.rotation.y += 0.0008; 
            ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 1.5; 
        } 
    }); 
    
    return (
        <group ref={ref}>
            <Sparkles 
                count={count} 
                scale={[30, 10, 30]} 
                size={3} 
                speed={0.15} 
                opacity={0.7} 
                color="#ffaa00" 
                position={[0, 5, 20]} 
            />
        </group>
    );
});

Fireflies.displayName = 'Fireflies';

const GuardianLamps = React.memo(({ whiteout }: { whiteout: number }) => {
    const magmaRefs = useRef<any[]>([]);
    
    useFrame((state) => {
        magmaRefs.current.forEach(mat => {
            if (mat) mat.uTime = state.clock.elapsedTime;
        });
    });
    
    const whiteColor = new THREE.Color("#ffffff");
    
    return (
        <group>
            {[-9, 9].map((x, idx) => (
                <group key={x} position={[x, 0, 6]}>
                    <Cylinder args={[0.5, 0.8, 5, 8]} position={[0, 2.5, 0]}>
                        <meshStandardMaterial 
                            color={new THREE.Color("#050505").lerp(whiteColor, whiteout)} 
                            roughness={0.8}
                            metalness={0.3}
                            emissive={whiteColor}
                            emissiveIntensity={whiteout}
                        />
                    </Cylinder>
                    <mesh position={[0, 6.5, 0]}>
                        <planeGeometry args={[2.5, 6]} />
                        <magmaShader 
                            ref={(el: any) => magmaRefs.current[idx] = el}
                            uColor={new THREE.Color("#ff5500").lerp(whiteColor, whiteout)} 
                            uIntensity={2.5 + whiteout * 4} 
                            transparent 
                            side={THREE.DoubleSide} 
                        />
                    </mesh>
                    <pointLight 
                        position={[0, 6, 0]} 
                        color={new THREE.Color("#ff5500").lerp(whiteColor, whiteout)} 
                        intensity={20 + whiteout * 60} 
                        distance={20} 
                        decay={2} 
                        castShadow 
                    />
                </group>
            ))}
        </group>
    );
});

GuardianLamps.displayName = 'GuardianLamps';

const EveningStar = React.memo(({ quality }: { quality: PerformanceTier }) => {
    const sparkleCount = quality === 'potato' ? 3 : quality === 'low' ? 5 : 8;
    
    return (
        <group position={[-30, 40, -80]}>
            <mesh>
                <sphereGeometry args={[1.5, 12, 12]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            <pointLight intensity={4} color="#ffffff" distance={80} />
            <Sparkles 
                count={sparkleCount} 
                scale={5} 
                size={12} 
                speed={0} 
                opacity={0.7} 
                color="#ffffff" 
            />
        </group>
    );
});

EveningStar.displayName = 'EveningStar';

const VolumetricClouds = React.memo(({ quality, whiteout }: { quality: PerformanceTier; whiteout: number }) => { 
    const cloudRefs = useRef<any[]>([]);
    const cloudCount = quality === 'potato' ? 3 : quality === 'low' ? 4 : quality === 'medium' ? 5 : 6;
    
    useFrame((state) => { 
        cloudRefs.current.forEach(mat => {
            if (mat) mat.uTime = state.clock.elapsedTime;
        });
    }); 
    
    const whiteColor = new THREE.Color("#ffffff");
    
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
                    <cloudShader 
                        ref={(el: any) => cloudRefs.current[i] = el}
                        transparent 
                        depthWrite={false} 
                        uColor={new THREE.Color("#552222").lerp(whiteColor, whiteout)} 
                        uDensity={0.4 + whiteout * 0.8}
                    />
                    <Billboard />
                </mesh>
            ))}
        </group>
    );
});

VolumetricClouds.displayName = 'VolumetricClouds';

const FloatingIsland = React.memo(({ 
    position, 
    scale = 1,
    whiteout
}: { 
    position: [number, number, number]; 
    scale?: number;
    whiteout: number;
}) => {
    const whiteColor = new THREE.Color("#ffffff");
    
    return (
        <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.8} position={position}>
            <group scale={scale}>
                <Cone args={[4, 5, 6]} rotation={[Math.PI, 0, 0]} position={[0, -2.5, 0]}>
                    <meshStandardMaterial 
                        color={new THREE.Color("#2d2d2d").lerp(whiteColor, whiteout)}
                        roughness={0.8} 
                        metalness={0.2} 
                        emissive={whiteColor}
                        emissiveIntensity={whiteout}
                    />
                </Cone>
                <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[4, 24]} />
                    <meshStandardMaterial 
                        color={new THREE.Color("#1a2e1a").lerp(whiteColor, whiteout)}
                        roughness={0.7} 
                        emissive={whiteColor}
                        emissiveIntensity={whiteout}
                    />
                </mesh>
                <Cylinder args={[0.2, 0.4, 1.5]} position={[1, 0.75, 1]}>
                    <meshStandardMaterial 
                        color={new THREE.Color("#3d2817").lerp(whiteColor, whiteout)}
                        roughness={0.9} 
                        emissive={whiteColor}
                        emissiveIntensity={whiteout}
                    />
                </Cylinder>
            </group>
        </Float>
    );
});

FloatingIsland.displayName = 'FloatingIsland';

// =============================================================================
// SCENE CONTENT (OPTIMIZED)
// =============================================================================

const SceneContent = React.memo(({ 
    stage, 
    quality, 
    whiteoutProgress 
}: { 
    stage: AnimationStage; 
    quality: PerformanceTier; 
    whiteoutProgress: number;
}) => {
    const isOpen = stage === 'push' || stage === 'suction';
    const isWarp = stage === 'suction';
    const starCount = quality === 'potato' ? 1500 : quality === 'low' ? 2500 : quality === 'medium' ? 4000 : 6000;

    return (
        <>
            <CameraDirector stage={stage} />
            <PlayerRig stage={stage} />
            
            <fog attach="fog" args={['#1a0505', 20, 100]} /> 
            <Sky 
                sunPosition={[-5, -0.02, -10]} 
                inclination={0.6} 
                azimuth={0.25} 
                turbidity={10} 
                rayleigh={2.5} 
                mieCoefficient={0.005} 
            />
            <Stars radius={100} count={starCount} fade factor={3.5} />
            <EveningStar quality={quality} />
            <VolumetricClouds quality={quality} whiteout={whiteoutProgress} />
            <Fireflies quality={quality} />
            
            <ambientLight intensity={0.1 + whiteoutProgress * 1.5} color="#2a1a1a" />
            <directionalLight 
                position={[0, 10, -50]} 
                intensity={2.5 + whiteoutProgress * 8} 
                color="#ff3300" 
            /> 
            <directionalLight 
                position={[-20, 40, 20]} 
                intensity={0.4 + whiteoutProgress * 4} 
                color="#4444ff" 
                castShadow 
                shadow-mapSize={[512, 512]}
            /> 
            <directionalLight 
                position={[5, 3, 10]} 
                intensity={1.2 + whiteoutProgress * 8} 
                color="#88ccff" 
            />
            <pointLight 
                position={[0, 9, -5]} 
                intensity={isOpen ? 200 + whiteoutProgress * 400 : 4} 
                color="#ff0000" 
                distance={50} 
                decay={2} 
            />
            
            <group position={[0, -2, 0]}>
                <ConstructedGate isOpen={isOpen} quality={quality} />
                <CobblestoneRoad quality={quality} whiteout={whiteoutProgress} />
                <GuardianLamps whiteout={whiteoutProgress} />
                <PortalCoreLight stage={stage} />
                <PortalVortex stage={stage} />
            </group>
            
            <WarpTunnel active={isWarp} quality={quality} />
            <FloatingIsland position={[-25, 5, 20]} scale={1.5} whiteout={whiteoutProgress} />
            <FloatingIsland position={[30, 8, 10]} scale={2} whiteout={whiteoutProgress} />
            
            <EffectComposer enableNormalPass={false} multisampling={0}>
                <Bloom 
                    luminanceThreshold={0.25} 
                    mipmapBlur 
                    intensity={isOpen ? 3.5 + whiteoutProgress * 4 : 1.5} 
                    radius={0.5} 
                    levels={quality === 'potato' ? 5 : quality === 'low' ? 6 : 7}
                />
                <ChromaticAberration 
                    offset={new THREE.Vector2(
                        isWarp ? 0.04 : 0.0008, 
                        isWarp ? 0.04 : 0.0008
                    )} 
                    radialModulation={false}
                    modulationOffset={0}
                />
                {quality !== 'potato' && quality !== 'low' ? (
                    <DepthOfField
                        focusDistance={0.02}
                        focalLength={0.5}
                        bokehScale={1.5}
                        height={360}
                    />
                ) : <></>}
                <Vignette 
                    offset={0.3 - whiteoutProgress * 0.3} 
                    darkness={0.5 - whiteoutProgress * 0.5} 
                    eskil={false}
                    blendFunction={BlendFunction.NORMAL}
                />
                <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
        </>
    );
});

SceneContent.displayName = 'SceneContent';

// =============================================================================
// CAMERA DIRECTOR (OPTIMIZED)
// =============================================================================

const CameraDirector = React.memo(({ stage }: { stage: AnimationStage }) => {
    const { camera } = useThree();
    const currentTargetPos = useRef(new THREE.Vector3(0, 80, 80));
    const currentLookAt = useRef(new THREE.Vector3(0, 9, 0));
    const currentFov = useRef(60);
    const walkTime = useRef(0);
    const lookSway = useRef(0);
    const orbitOffset = useRef(0);

    useFrame((state, delta) => {
        perfMonitor.update();
        
        const t = state.clock.elapsedTime;
        const desiredPos = new THREE.Vector3();
        const desiredLook = new THREE.Vector3();
        let targetFov = 60;

        desiredPos.copy(currentTargetPos.current); 
        desiredLook.copy(currentLookAt.current);

        switch(stage) {
            case 'loading': {
                desiredPos.set(0, 80, 80); 
                desiredLook.set(0, 9, 0); 
                break;
            }
            case 'intro': {
                desiredPos.set(0, 7, 45); 
                desiredLook.set(0, 9, 0); 
                orbitOffset.current = t; 
                break;
            }
            case 'idle': {
                const relTime = t - orbitOffset.current;
                const r = 42;
                desiredPos.x = Math.sin(relTime * 0.04) * r;
                desiredPos.z = Math.cos(relTime * 0.04) * r;
                desiredPos.y = 9 + Math.cos(relTime * 0.12) * 1.5;
                desiredLook.set(0, 10, 0);
                break;
            }
            case 'drop': {
                desiredPos.set(0, 0.8, 35); 
                desiredLook.set(0, -5, 10); 
                break;
            }
            case 'crouch': {
                desiredPos.set(0, 0.5, 35); 
                desiredLook.set(0, 0, 30); 
                break;
            }
            case 'stand': {
                desiredPos.set(0, 1.8, 35); 
                desiredLook.set(0, 7, 0); 
                break;
            }
            case 'confusion': {
                desiredPos.set(0, 1.8, 35);
                desiredLook.set(0.5, 1.5, 34.5); 
                lookSway.current += delta * 2.5;
                desiredLook.x += Math.sin(lookSway.current) * 0.8; 
                break;
            }
            case 'walk': {
                walkTime.current += delta * 6;
                desiredPos.set(
                    Math.cos(walkTime.current * 0.4) * 0.04, 
                    1.8 + Math.sin(walkTime.current) * 0.08, 
                    20 - (walkTime.current * 0.45)
                );
                if (desiredPos.z < 6) desiredPos.z = 6;
                desiredLook.set(0, 7, 0);
                break;
            }
            case 'push': {
                desiredPos.set(0, 1.8, 6); 
                desiredLook.set(0, 1.8, -10);
                break;
            }
            case 'suction': {
                desiredPos.set(0, 1.8, -25); 
                desiredLook.set(0, 9, -50); 
                targetFov = 110;
                break;
            }
        }

        const smoothSpeed = stage === 'drop' || stage === 'suction' ? 3.5 : 1.3;
        currentTargetPos.current.lerp(desiredPos, delta * smoothSpeed);
        currentLookAt.current.lerp(desiredLook, delta * (smoothSpeed * 0.75));
        currentFov.current = THREE.MathUtils.lerp(currentFov.current, targetFov, delta * 1.8);

        camera.position.copy(currentTargetPos.current);
        camera.lookAt(currentLookAt.current);
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.fov = currentFov.current;
            camera.updateProjectionMatrix();
        }
    });
    
    return null;
});

CameraDirector.displayName = 'CameraDirector';

// =============================================================================
// UI COMPONENTS
// =============================================================================

const GenderSelection = React.memo(({ onSelect }: { onSelect: (g: Gender) => void }) => (
    <div className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="max-w-2xl w-full border border-white/10 bg-white/5 p-10 rounded-3xl text-center backdrop-blur-xl"
        >
            <div className="flex justify-center items-center gap-2 mb-8">
                <h2 className="text-3xl text-white font-bold tracking-widest">
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
));

GenderSelection.displayName = 'GenderSelection';

const AnimationPreferencePopup = React.memo(({ 
    onChoice 
}: { 
    onChoice: (play: boolean, pauseDays: number) => void;
}) => {
    const [pause7, setPause7] = useState(false); 
    const [never, setNever] = useState(false);
    
    return (
        <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-gradient-to-t from-primary-900/10 via-black to-black pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                transition={{ duration: 0.4, ease: "circOut" }}
                className="relative max-w-lg w-full bg-[#080505] border border-primary-900/30 p-1 rounded-sm shadow-[0_0_50px_-10px_rgba(220,38,38,0.2)] overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary-500" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary-500" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary-500" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary-500" />

                <div className="p-8 relative z-10">
                    <div className="flex items-center gap-3 mb-6 border-b border-primary-900/20 pb-4">
                        <div className="p-2 bg-primary-950/30 rounded border border-primary-900/50">
                            <Power className="w-5 h-5 text-primary-500 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg text-white font-bold tracking-[0.2em] font-mono">
                                SYSTEM DETECTED
                            </h3>
                            <p className="text-[10px] text-primary-400/60 uppercase tracking-widest">
                                Dimensional Gate Protocol
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-8 leading-relaxed font-mono">
                        A returning signal has been identified. The dimensional gate is ready for synchronization. <br/><br/>
                        <span className="text-primary-400">Query:</span> Initiate full immersion sequence?
                    </p>

                    <div className="grid grid-cols-1 gap-3 mb-8">
                        <Button 
                            onClick={() => onChoice(true, never ? 9999 : (pause7 ? 7 : 0))} 
                            className="group relative overflow-hidden bg-primary-950/20 hover:bg-primary-900/40 border border-primary-900/50 hover:border-primary-500 transition-all duration-300 h-14"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <div className="flex items-center justify-center gap-3">
                                <PlayCircle className="w-5 h-5 text-primary-500" />
                                <span className="text-white font-bold tracking-widest text-xs">INITIATE SEQUENCE</span>
                            </div>
                        </Button>
                        
                        <Button 
                            onClick={() => onChoice(false, never ? 9999 : (pause7 ? 7 : 0))} 
                            variant="outline" 
                            className="bg-transparent border-white/5 hover:bg-white/5 hover:border-white/20 h-12"
                        >
                            <div className="flex items-center justify-center gap-3">
                                <FastForward className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-400 group-hover:text-white transition-colors tracking-widest text-xs">BYPASS PROTOCOL (SKIP)</span>
                            </div>
                        </Button>
                    </div>

                    <div className="bg-black/40 rounded p-4 border border-white/5 space-y-3">
                        <div className="flex items-center space-x-3">
                            <Checkbox 
                                id="pause" 
                                checked={pause7} 
                                className="border-primary-900/50 data-[state=checked]:bg-primary-900 data-[state=checked]:text-white"
                                onCheckedChange={(c) => { 
                                    setPause7(!!c); 
                                    if(c) setNever(false); 
                                }} 
                            />
                            <label htmlFor="pause" className="text-xs text-gray-500 font-mono cursor-pointer hover:text-primary-400 transition-colors flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Auto-bypass for 7 cycles (days)
                            </label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Checkbox 
                                id="never" 
                                checked={never} 
                                className="border-primary-900/50 data-[state=checked]:bg-primary-900 data-[state=checked]:text-white"
                                onCheckedChange={(c) => { 
                                    setNever(!!c); 
                                    if(c) setPause7(false); 
                                }} 
                            />
                            <label htmlFor="never" className="text-xs text-gray-500 font-mono cursor-pointer hover:text-primary-400 transition-colors">
                                Permanently disable gate sequence
                            </label>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
});

AnimationPreferencePopup.displayName = 'AnimationPreferencePopup';

const GuildCookieNotice = React.memo(({ 
    onAccept, 
    onDecline 
}: { 
    onAccept: () => void; 
    onDecline: () => void;
}) => (
    <div className="fixed bottom-10 left-0 right-0 mx-auto z-[99999] w-full flex justify-center px-4 pointer-events-none">
        <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            className="bg-[#0a0505]/95 backdrop-blur-xl border border-primary-900/50 rounded-xl p-5 shadow-2xl max-w-sm w-full pointer-events-auto"
        >
            <div className="flex items-start gap-4 mb-3">
                <div className="p-3 bg-gradient-to-br from-primary-900/40 to-black rounded-full border border-primary-500/20">
                    <Scroll className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                    <h4 className="text-white font-bold tracking-widest text-lg mb-1">
                        GUILD NOTICE
                    </h4>
                    <p className="text-gray-400 text-xs tracking-wide">
                        Shadow Garden employs magical cookies. Accept to synchronize.
                    </p>
                </div>
            </div>
            <div className="flex gap-3">
                <Button 
                    onClick={onAccept} 
                    className="flex-1 bg-primary-700 hover:bg-primary-600 text-white text-xs font-bold border border-primary-500/50 h-10"
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
    </div>
));

GuildCookieNotice.displayName = 'GuildCookieNotice';

// =============================================================================
// MAIN COMPONENT
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
    const [whiteoutProgress, setWhiteoutProgress] = useState(0);
    const [shake, setShake] = useState(0);
    const [showCookie, setShowCookie] = useState(false);
    const [skipped, setSkipped] = useState(false);
    
    const [quality, setQuality] = useState<PerformanceTier>(() => {
        if (typeof window !== 'undefined') return detectPerformanceTier();
        return 'medium'; 
    });
    
    const onSceneReadyRef = useRef(onSceneReady);
    useEffect(() => { 
        onSceneReadyRef.current = onSceneReady; 
    }, [onSceneReady]);

    useEffect(() => {
        setQuality(detectPerformanceTier());
    }, []);

    const triggerSkip = useCallback(() => {
        sfx.stopAll();
        setSkipped(true);
        onSceneReadyRef.current?.(); 
    }, []);

    useEffect(() => {
        const savedGender = localStorage.getItem('guest_gender') as Gender;
        const neverAsk = localStorage.getItem('anim_never_ask');
        const pauseUntil = localStorage.getItem('anim_pause_until');
        const now = new Date().getTime();

        const isSkipActive = neverAsk === 'true' || (pauseUntil && parseInt(pauseUntil) > now);

        if (!localStorage.getItem('SG_GUILD_CONTRACT')) {
            setTimeout(() => setShowCookie(true), 1500);
        }

        if (!savedGender) {
            setAppState('gender_select');
        } else if (isSkipActive) {
            triggerSkip(); 
        } else {
            setGender(savedGender);
            setAppState('anim_choice');
        }
    }, [triggerSkip]);

    useEffect(() => {
        if (skipped && startTransition) {
            onComplete();
        }
    }, [skipped, startTransition, onComplete]);

    const handleGenderSelect = useCallback((g: Gender) => {
        setGender(g); 
        localStorage.setItem('guest_gender', g); 
        sfx.unlock(); 
        setAppState('loading');
    }, []);

    const handleAnimChoice = useCallback((play: boolean, days: number) => {
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
            triggerSkip();
        }
    }, [triggerSkip]);

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
                    sfx.play('wind', 0.15, true);
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
        if (stage === 'push') {
            const interval = setInterval(() => {
                setWhiteoutProgress(prev => Math.min(prev + 0.015, 1));
            }, 50);
            return () => clearInterval(interval);
        }
    }, [stage]);

    useEffect(() => {
        if (startTransition && stage === 'idle') {
            performEntrySequence();
        }
    }, [startTransition, stage]);

    const performEntrySequence = useCallback(() => {
        sfx.init(); 
        setStage('drop');
        sfx.play('wind', 0.6); 
        
        setTimeout(() => { 
            setStage('crouch'); 
            sfx.play('drop', 0.5); 
            setShake(3.5); 
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
            sfx.play('step', 0.4, true); 
        }, 5500);

        setTimeout(() => { 
            setStage('push'); 
            sfx.stop('step'); 
            sfx.play('grind', 0.7); 
            sfx.play('boom', 0.6); 
            setShake(0.8); 
        }, 9500);

        setTimeout(() => { 
            setStage('suction'); 
            sfx.play('suction', 0.7); 
            setShake(8.0); 
        }, 11500);

        setTimeout(() => setWhiteout(true), 11800);
        setTimeout(() => { 
            sfx.stopAll(200); 
            onComplete(); 
        }, 14500);
    }, [onComplete]);

    if (skipped) return null;

    if (appState === 'gender_select') {
        return <GenderSelection onSelect={handleGenderSelect} />;
    }
    
    if (appState === 'anim_choice') {
        return <AnimationPreferencePopup onChoice={handleAnimChoice} />;
    }

    const dpr: [number, number] = quality === 'potato' ? [0.4, 0.7] : quality === 'low' ? [0.5, 0.9] : quality === 'medium' ? [0.7, 1] : [1, 1.25];

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
                    <PortalLoadingScreen progress={progress} />
                )}
            </AnimatePresence>

            {appState === 'running' && (
                <Canvas 
                    shadows 
                    dpr={dpr} 
                    gl={{ 
                        antialias: quality === 'high',
                        powerPreference: "high-performance",
                        alpha: false,
                        stencil: false,
                        depth: true,
                        logarithmicDepthBuffer: false
                    }}
                    performance={{ min: 0.3 }}
                    frameloop="always"
                >
                    <Suspense fallback={null}>
                        <PerspectiveCamera makeDefault position={[0, 60, 60]} fov={60} />
                        <CameraShake 
                            maxYaw={0.04} 
                            maxPitch={0.04} 
                            maxRoll={0.04} 
                            yawFrequency={shake} 
                            pitchFrequency={shake} 
                            rollFrequency={shake} 
                            intensity={shake} 
                        />
                        <SceneContent stage={stage} quality={quality} whiteoutProgress={whiteoutProgress} />
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