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
import { Scroll, Fingerprint, X, Sword, Wand2, Info, Power, FastForward, PlayCircle, Clock, Crown } from 'lucide-react';
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

type AppState = 'checking' | 'cinematic_intro' | 'gender_select' | 'anim_choice' | 'loading' | 'running';
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
    
    if (isLowEndMobile || (isAndroid && cores <= 4) || memory < 3) {
        return 'potato';
    }
    
    if (isMobile || cores <= 2 || memory < 4) {
        return 'low';
    }
    
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
    private ctx: AudioContext | null = null;
    private sources: Map<string, HTMLAudioElement> = new Map();
    private active: boolean = false;
    
    private getCtx(): AudioContext | null {
        if (!this.ctx && typeof window !== 'undefined') {
            const Ctx = window.AudioContext || (window as any).webkitAudioContext;
            if (Ctx) this.ctx = new Ctx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    init() {
        if (this.active || typeof window === 'undefined') return;
        this.getCtx();
        
        const bgmTracks = [
            "/bgm/bgm1.mp3",
            "/bgm/bgm2.mp3",
            "/bgm/shadow_theme.mp3",
            "https://cdn.pixabay.com/audio/2022/03/10/audio_4f5c0a36b0.mp3"
        ];
        
        bgmTracks.forEach((url, idx) => { 
            const a = new Audio(url); 
            a.preload = 'auto';
            a.crossOrigin = 'anonymous';
            this.sources.set(`bgm_${idx}`, a); 
        });
        
        this.active = true;
        if (typeof window !== 'undefined') {
            (window as any).stopShadowBGM = () => this.stopAll(1500);
            (window as any).sfx = this;
        }
    }
    
    unlock() { 
        this.getCtx();
    }
    
    // Real-Time Web Audio Synthesizers for Guaranteed SFX
    synthMetal(vol = 0.4) {
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.type = 'triangle'; osc2.type = 'sine';
            osc1.frequency.setValueAtTime(1200, now);
            osc1.frequency.exponentialRampToValueAtTime(250, now + 0.15);
            osc2.frequency.setValueAtTime(2400, now);
            osc2.frequency.exponentialRampToValueAtTime(500, now + 0.15);
            gain.gain.setValueAtTime(vol * 0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
            osc1.start(now); osc2.start(now); osc1.stop(now + 0.2); osc2.stop(now + 0.2);
        } catch (e) {}
    }
    
    synthCrystal(vol = 0.3) {
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(vol * 0.4, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.35);
        } catch (e) {}
    }

    synthWhoosh(vol = 0.5) {
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const bufferSize = Math.floor(ctx.sampleRate * 0.35);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = ctx.createBufferSource(); noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(250, now);
            filter.frequency.exponentialRampToValueAtTime(1600, now + 0.18);
            filter.frequency.exponentialRampToValueAtTime(350, now + 0.35);
            filter.Q.value = 2.5;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(vol * 0.6, now + 0.18);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
            noise.start(now); noise.stop(now + 0.35);
        } catch (e) {}
    }

    synthStep(vol = 0.4) {
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.09);
            gain.gain.setValueAtTime(vol * 0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.11);
        } catch (e) {}
    }

    synthBreath(vol = 0.3) {
        try {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const bufferSize = Math.floor(ctx.sampleRate * 0.7);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = ctx.createBufferSource(); noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, now);
            filter.frequency.linearRampToValueAtTime(700, now + 0.35);
            filter.frequency.linearRampToValueAtTime(250, now + 0.7);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(vol * 0.35, now + 0.35);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.7);
            noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
            noise.start(now); noise.stop(now + 0.7);
        } catch (e) {}
    }
    
    play(key: string, vol = 1, loop = false, fadeMs = 0) { 
        if(!this.active) this.init(); 
        
        if (key === 'metal' || key === 'click' || key === 'drop' || key === 'grind' || key === 'boom') { this.synthMetal(vol); return; }
        if (key === 'crystal' || key === 'hover') { this.synthCrystal(vol); return; }
        if (key === 'whoosh' || key === 'camera' || key === 'suction') { this.synthWhoosh(vol); return; }
        if (key === 'step') { this.synthStep(vol); return; }
        if (key === 'breath' || key === 'wind') { this.synthBreath(vol); return; }
        
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
        const randomIdx = Math.floor(Math.random() * 4);
        const bgmKey = `bgm_${randomIdx}`;
        if (this.sources.has(bgmKey)) {
            this.play(bgmKey, 0.25, true, 2000);
        } else {
            this.play('bgm_0', 0.25, true, 2000); 
        }
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

const CinematicTitleIntro = React.memo(({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        sfx.init();
        sfx.play('crystal', 0.5);
        
        const timer = setTimeout(() => {
            onComplete();
        }, 4800);

        return () => {
            document.body.style.overflow = originalOverflow;
            clearTimeout(timer);
        };
    }, [onComplete]);

    return (
        <div 
            onClick={onComplete}
            className="fixed inset-0 z-[99999] bg-[#000000] flex flex-col items-center justify-center cursor-pointer overflow-hidden select-none touch-none"
        >
            {/* Deep Space Ambient Glow */}
            <div className="absolute inset-0 bg-[#020205]" />
            <div className="absolute w-[600px] h-[600px] rounded-full bg-primary-950/20 blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 3.5, ease: "easeOut" }}
                className="relative z-10 text-center flex flex-col items-center justify-center w-full px-4 max-w-5xl"
            >
                <div className="relative w-full flex flex-col items-center">
                    {/* Gradvis Title Text */}
                    <h1 
                        className="text-4xl sm:text-6xl md:text-8xl font-normal font-gradvis text-transparent bg-clip-text bg-gradient-to-r from-white via-red-200 to-zinc-400 tracking-[0.25em] sm:tracking-[0.45em] ml-[0.25em] sm:ml-[0.45em] uppercase drop-shadow-[0_0_35px_rgba(220,38,38,0.5)]" 
                        style={{ fontFamily: 'var(--font-gradvis), serif' }}
                    >
                        SHADOW GARDEN
                    </h1>
                    
                    {/* Moving Star Lens Flare under the title */}
                    <div className="relative w-full max-w-3xl h-10 mt-3 overflow-visible flex items-center justify-center">
                        {/* Thin laser guide line under title */}
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent -translate-y-1/2" />
                        
                        {/* Flare star moving from left (0%) to end of title (100%) and slowing down as it reaches the end */}
                        <motion.div
                            initial={{ x: "-100%", opacity: 0, scale: 0.3 }}
                            animate={{ 
                                x: ["-100%", "-30%", "20%", "45%", "50%"], 
                                opacity: [0, 1, 1, 1, 0.95],
                                scale: [0.3, 1.2, 1.0, 1.1, 1.0]
                            }}
                            transition={{ 
                                duration: 4.2, 
                                ease: [0.1, 0.9, 0.2, 1], // Decelerating cubic-bezier curve
                                times: [0, 0.25, 0.6, 0.85, 1]
                            }}
                            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                        >
                            {/* Bright Core Star */}
                            <div className="w-2 h-2 rounded-full bg-white blur-[0.2px] shadow-[0_0_10px_#ffffff,0_0_20px_#ef4444]" />
                            {/* Horizontal anamorphic flare ray */}
                            <div className="absolute w-24 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent blur-[0.3px]" />
                            {/* Glowing aura */}
                            <div className="absolute w-8 h-8 rounded-full bg-red-600/40 blur-md" />
                            {/* Trail */}
                            <div className="absolute right-full w-32 h-[1px] bg-gradient-to-l from-red-400 via-transparent to-transparent opacity-60" />
                        </motion.div>
                    </div>
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2, duration: 2 }}
                    className="mt-14 text-[10px] text-zinc-500 font-mono tracking-[0.3em] uppercase animate-pulse"
                >
                    TAP ANYWHERE TO FAST-FORWARD
                </motion.div>
            </motion.div>
        </div>
    );
});

CinematicTitleIntro.displayName = 'CinematicTitleIntro';

const GenderSelection = React.memo(({ onSelect }: { onSelect: (g: Gender) => void }) => {
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4 sm:p-6 overflow-hidden touch-none">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="w-full max-w-lg mx-auto border-2 border-primary-900/60 bg-[#0a0505]/95 p-6 sm:p-8 rounded-3xl text-center backdrop-blur-2xl shadow-[0_0_60px_rgba(220,38,38,0.35)] relative overflow-hidden -translate-y-6 sm:-translate-y-8"
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-pulse" />

                <div className="flex justify-center items-center gap-2 mb-6 border-b border-primary-900/30 pb-4">
                    <Crown className="w-6 h-6 text-primary-500" />
                    <h2 className="text-xl sm:text-2xl text-white font-bold tracking-widest uppercase font-mono">
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

                <p className="text-xs text-gray-400 font-mono mb-8 leading-relaxed">
                    Select your monarch vessel before entering the dimensional sanctuary.
                </p>

                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <button 
                        onClick={() => onSelect('boy')} 
                        className="group p-6 sm:p-8 border border-blue-500/30 bg-blue-950/20 hover:bg-blue-900/40 hover:border-blue-400 rounded-2xl transition-all flex flex-col items-center gap-4 shadow-lg hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
                    >
                        <div className="p-4 rounded-full bg-blue-500/20 border border-blue-400/40 group-hover:scale-110 transition-transform">
                            <Sword className="w-8 h-8 text-blue-400" />
                        </div>
                        <span className="text-base sm:text-lg font-bold text-white tracking-widest font-mono">MALE</span>
                        <span className="text-[10px] text-blue-300/70 font-mono uppercase">SHADOW HUNTER</span>
                    </button>
                    <button 
                        onClick={() => onSelect('girl')} 
                        className="group p-6 sm:p-8 border border-pink-500/30 bg-pink-950/20 hover:bg-pink-900/40 hover:border-pink-400 rounded-2xl transition-all flex flex-col items-center gap-4 shadow-lg hover:shadow-[0_0_25px_rgba(236,72,153,0.4)]"
                    >
                        <div className="p-4 rounded-full bg-pink-500/20 border border-pink-400/40 group-hover:scale-110 transition-transform">
                            <Wand2 className="w-8 h-8 text-pink-400" />
                        </div>
                        <span className="text-base sm:text-lg font-bold text-white tracking-widest font-mono">FEMALE</span>
                        <span className="text-[10px] text-pink-300/70 font-mono uppercase">CELESTIAL MONARCH</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
});

GenderSelection.displayName = 'GenderSelection';

const AnimationPreferencePopup = React.memo(({ 
    onChoice 
}: { 
    onChoice: (play: boolean, pauseDays: number) => void;
}) => {
    const [pause7, setPause7] = useState(false); 
    const [never, setNever] = useState(false);
    
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-hidden touch-none">
            <div className="absolute inset-0 bg-gradient-to-t from-primary-950/20 via-black to-black pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative max-w-sm sm:max-w-md w-full mx-auto bg-[#0a0505]/95 border border-primary-900/60 p-5 sm:p-6 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden text-center -translate-y-6 sm:-translate-y-10"
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-pulse" />

                <div className="flex items-center justify-center gap-3 mb-4 border-b border-primary-900/30 pb-3">
                    <div className="p-2 bg-primary-950/60 rounded-full border border-primary-500/40 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                        <Power className="w-5 h-5 text-primary-500 animate-pulse" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-base sm:text-lg text-white font-bold tracking-[0.15em] font-mono uppercase">
                            SYSTEM DETECTED
                        </h3>
                        <p className="text-[10px] text-primary-400/80 uppercase tracking-widest font-mono">
                            ANIMATION SETTINGS
                        </p>
                    </div>
                </div>

                <p className="text-gray-300 text-xs mb-5 leading-relaxed font-mono">
                    Play the cinematic portal intro?
                </p>

                <div className="grid grid-cols-2 gap-2.5 mb-4">
                    <Button 
                        onClick={() => {
                            sfx.play('metal');
                            onChoice(true, never ? 9999 : (pause7 ? 7 : 0));
                        }} 
                        onMouseEnter={() => sfx.play('crystal')}
                        className="group relative overflow-hidden bg-primary-900/50 hover:bg-primary-700 border border-primary-500/60 hover:border-primary-400 transition-all duration-300 h-10 rounded-xl shadow-md"
                    >
                        <div className="flex items-center justify-center gap-2.5">
                            <PlayCircle className="w-4 h-4 text-primary-400 group-hover:text-white" />
                            <span className="text-white font-bold tracking-widest text-xs font-mono">PLAY</span>
                        </div>
                    </Button>
                    
                    <Button 
                        onClick={() => {
                            sfx.play('metal');
                            onChoice(false, never ? 9999 : (pause7 ? 7 : 0));
                        }} 
                        onMouseEnter={() => sfx.play('crystal')}
                        variant="outline" 
                        className="bg-transparent border-white/10 hover:bg-white/10 hover:border-white/20 h-10 rounded-xl"
                    >
                        <div className="flex items-center justify-center gap-2.5">
                            <FastForward className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-300 group-hover:text-white transition-colors tracking-widest text-xs font-mono">SKIP</span>
                        </div>
                    </Button>
                </div>

                <div className="bg-black/60 rounded-xl p-3 border border-white/10 space-y-2 text-left">
                    <div className="flex items-center space-x-2.5">
                        <Checkbox 
                            id="pause" 
                            checked={pause7} 
                            className="border-primary-900/50 data-[state=checked]:bg-primary-900 data-[state=checked]:text-white"
                            onCheckedChange={(c) => { 
                                setPause7(!!c); 
                                if(c) setNever(false); 
                            }} 
                        />
                        <label htmlFor="pause" className="text-xs text-gray-400 font-mono cursor-pointer hover:text-primary-400 transition-colors flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-primary-500" /> Skip for 7 days
                        </label>
                    </div>
                    <div className="flex items-center space-x-2.5">
                        <Checkbox 
                            id="never" 
                            checked={never} 
                            className="border-primary-900/50 data-[state=checked]:bg-primary-900 data-[state=checked]:text-white"
                            onCheckedChange={(c) => { 
                                setNever(!!c); 
                                if(c) setPause7(false); 
                            }} 
                        />
                        <label htmlFor="never" className="text-xs text-gray-400 font-mono cursor-pointer hover:text-primary-400 transition-colors">
                            Always skip intro
                        </label>
                    </div>
                </div>
            </motion.div>
        </div>
    );
});

AnimationPreferencePopup.displayName = 'AnimationPreferencePopup';

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

        if (!savedGender) {
            setAppState('cinematic_intro');
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
        localStorage.setItem('shadow_traveller_gender', g);
        localStorage.setItem('SG_GUILD_CONTRACT', 'true');
        localStorage.setItem('shadow_audio_permitted', 'true');
        
        import('@/components/User/AvatarSelectorModal').then(({ getRandomAvatar }) => {
            const avatar = getRandomAvatar(true, g);
            localStorage.setItem('shadow_traveller_avatar', avatar);
            window.dispatchEvent(new CustomEvent('shadow-traveller-updated', { 
                detail: { avatar, gender: g } 
            }));
        }).catch(err => console.error("Failed to load avatar generator", err));
        
        sfx.unlock(); 
        setAppState('loading');
    }, []);

    const handleCinematicIntroComplete = useCallback(() => {
        if (!gender) {
            setAppState('gender_select');
        } else {
            setAppState('loading');
        }
    }, [gender]);

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
            setAppState('cinematic_intro'); 
        } else {
            triggerSkip();
        }
    }, [triggerSkip]);

    useEffect(() => {
        if (appState !== 'loading') return;
        sfx.init();
        
        // Immediately skip to running state without the artificial loading screen delay
        setAppState('running'); 
        setStage('intro');
        sfx.playRandomBGM(); 
        sfx.play('wind', 0.15, true);
        
        const timeout = setTimeout(() => {
            setStage('idle');
            onSceneReadyRef.current?.(); 
        }, 4000);
        
        return () => clearTimeout(timeout);
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

    if (appState === 'cinematic_intro') {
        return <CinematicTitleIntro onComplete={handleCinematicIntroComplete} />;
    }

    if (appState === 'gender_select') {
        return <GenderSelection onSelect={handleGenderSelect} />;
    }
    
    if (appState === 'anim_choice') {
        return <AnimationPreferencePopup onChoice={handleAnimChoice} />;
    }

    const dpr: [number, number] = quality === 'potato' ? [0.4, 0.7] : quality === 'low' ? [0.5, 0.9] : quality === 'medium' ? [0.7, 1] : [1, 1.25];

    return (
        <>
            <div className="fixed inset-0 z-0 bg-black pointer-events-none">

            <AnimatePresence>
                {/* PortalLoadingScreen removed entirely as requested */}
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
        </>
    );
}