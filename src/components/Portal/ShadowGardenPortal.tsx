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
    Vignette,
    Glitch
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
      fireShader: CustomShaderMaterialProps;
      blackHoleShader: CustomShaderMaterialProps;
      auroraShader: CustomShaderMaterialProps;
      tunnelShader: CustomShaderMaterialProps;
      runeShader: CustomShaderMaterialProps;
    }
  }
}

type AppState = 'checking' | 'cinematic_intro' | 'gender_select' | 'anim_choice' | 'loading' | 'running';
type AnimationStage = 
    | 'loading' | 'intro' | 'idle' 
    | 'drop' | 'crouch' | 'stand' | 'confusion' 
    | 'walk' | 'brace_popup'
    | 'push' | 'suction' | 'whiteout' | 'tunnel' | 'tunnel_end' | 'arrival';

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

import { sfx } from '@/lib/audioManager';

const MagmaShader = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color("#ff3300"),
        uIntensity: 2.5
    },
    `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    `varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uIntensity;void main(){float noise=sin(vUv.y*8.0-uTime*1.2)+cos(vUv.x*15.0);float vein=0.03/abs(vUv.x-0.5+noise*0.04);float pulse=sin(uTime*1.5)*0.25+0.75;vec3 finalColor=uColor*vein*uIntensity;float alpha=smoothstep(0.0,1.0,vein)*pulse*0.8;gl_FragColor=vec4(finalColor,alpha);}`
);

const TunnelShader = shaderMaterial(
    {
        uTime: 0,
        uProgress: 0,
        speed: 1.0,
        ring: 1.0,
        swirl: 1.0
    },
    `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    `varying vec2 vUv;
    uniform float uTime;
    uniform float uProgress;
    uniform float speed;
    
    float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
    
    float noise(vec2 p){
        vec2 ip = floor(p);
        vec2 u = fract(p);
        u = u*u*(3.0-2.0*u);
        return mix(
            mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
            mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    }
    
    void main() {
        float time = uTime * speed * 0.6;
        vec2 uv = vec2(vUv.x * 20.0 - time, vUv.y * 12.0 + vUv.x * 5.0 + time * 0.3);
        
        float n1 = noise(uv * 1.5);
        float n2 = noise(uv * 3.0 + vec2(time * 0.5, 0.0));
        float nebula = (n1 + n2 * 0.5) * 0.7;
        
        float streak = pow(noise(vec2(vUv.x * 60.0 - time * 6.0, vUv.y * 100.0)), 12.0) * 4.0;
        
        vec3 col = mix(vec3(0.01, 0.0, 0.03), vec3(0.1, 0.0, 0.3), nebula);
        vec3 highlight = mix(vec3(0.0, 0.6, 1.0), vec3(1.0, 0.0, 0.6), sin(vUv.y * 6.28 + time)*0.5+0.5);
        
        col += highlight * pow(nebula, 2.5) * 2.0;
        col += vec3(0.7, 0.9, 1.0) * streak;
        
        float startDark = smoothstep(0.0, 0.1, vUv.x);
        float endWhite = smoothstep(0.85, 1.0, vUv.x);
        float fadeOut = smoothstep(0.7, 0.95, uProgress);
        
        col *= startDark;
        col = mix(col, vec3(1.0), endWhite + fadeOut);
        
        gl_FragColor = vec4(col, 1.0);
    }`
);


const RuneShader = shaderMaterial(
    { uTime: 0, uColor: new THREE.Color("#ff3300"), uIntensity: 1.0 },
    `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    `varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uIntensity;
float rand(vec2 n){return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453);}
void main(){
    vec2 gUv=vUv*vec2(4.0,8.0);vec2 id=floor(gUv);vec2 f=fract(gUv);
    float r=rand(id);
    float pulse=sin(uTime*2.0+r*6.28)*0.5+0.5;
    float rune1=step(0.4,f.x)*step(f.x,0.6)*step(0.2,f.y)*step(f.y,0.8);
    float rune2=step(0.2,f.x)*step(f.x,0.8)*step(0.4,f.y)*step(f.y,0.6);
    float symbol=mix(rune1,max(rune1,rune2),step(0.5,r));
    float fade=smoothstep(0.0,0.2,vUv.x)*smoothstep(1.0,0.8,vUv.x)*smoothstep(0.0,0.1,vUv.y)*smoothstep(1.0,0.9,vUv.y);
    float alpha=symbol*pulse*fade*uIntensity;
    gl_FragColor=vec4(uColor,alpha);
}`
);

const TUNNEL_CURVE = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(10, 10, -50),
    new THREE.Vector3(-30, -20, -120),
    new THREE.Vector3(40, 30, -220),
    new THREE.Vector3(-50, -40, -320),
    new THREE.Vector3(0, 0, -450),
], false, 'catmullrom', 0.8);

const PortalVortexShader = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color("#d8b4fe"),
        uOpen: 0,
        uSuction: 0
    },
    `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    `varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpen;
    uniform float uSuction;
    void main(){
        vec2 center = vUv - 0.5;
        center.x *= (11.5 / 22.0);
        
        float dist = length(center);
        float angle = atan(center.y, center.x);
        
        float spiral = sin(angle*12.0 + dist*30.0 - uTime*(5.0 + uSuction*6.0));
        float rings = sin(dist*50.0 - uTime*(6.0 + uSuction*8.0));
        
        vec3 coreColor = vec3(1.0, 1.0, 1.0);
        vec3 outerColor = uColor;
        vec3 baseColor = mix(outerColor, coreColor, smoothstep(0.4, 0.0, dist));
        
        float spikes = sin(angle * 5.0 - uTime * 2.0) * 0.5 + 0.5;
        baseColor += outerColor * spikes * smoothstep(0.5, 0.2, dist);
        
        vec3 finalColor = baseColor + vec3(spiral * 0.5 + rings * 0.5);
        
        float edgeFade = smoothstep(0.0, 0.02, vUv.x) * smoothstep(1.0, 0.98, vUv.x) * 
                         smoothstep(0.0, 0.02, vUv.y) * smoothstep(1.0, 0.98, vUv.y);
        
        float intensity = uOpen * (2.0 + uSuction * 2.0) * edgeFade;
        float alpha = clamp(intensity * (1.0 - dist*1.5 + rings*0.5 + spiral*0.5), 0.0, 1.0);
        
        gl_FragColor = vec4(finalColor, alpha);
    }`
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

extend({ MagmaShader, PortalVortexShader, CloudShader, WarpShader, TunnelShader, RuneShader });

// =============================================================================
// PLAYER RIG (OPTIMIZED)
// =============================================================================

const WormholeTunnel = React.memo(({ stage, tunnelProgress }: { stage: AnimationStage; tunnelProgress: number }) => {
    const matRef = useRef<any>(null);
    const groupRef = useRef<THREE.Group>(null);
    const isActive = stage === 'suction' || stage === 'tunnel' || stage === 'tunnel_end';

    useFrame((state) => {
        if (!matRef.current) return;
        matRef.current.uTime = state.clock.elapsedTime;
        matRef.current.uProgress = tunnelProgress;
    });

    if (!isActive) return null;
    return (
        <group ref={groupRef} position={[0, 0, -50]}>
            <mesh>
                <tubeGeometry args={[TUNNEL_CURVE, 128, 14, 24, false]} />
                <tunnelShader ref={matRef} uProgress={tunnelProgress} side={THREE.BackSide} depthWrite={false} transparent />
            </mesh>
            {/* End bloom */}
            <mesh position={[0, 0, -450]}>
                <sphereGeometry args={[20, 16, 16]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={tunnelProgress > 0.85 ? (tunnelProgress - 0.85) / 0.15 : 0} />
            </mesh>
            {/* Black outside void */}
            <mesh>
                <sphereGeometry args={[500, 8, 8]} />
                <meshBasicMaterial color="#000000" side={THREE.BackSide} />
            </mesh>
        </group>
    );
});

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
    const strobeRef = useRef<THREE.PointLight>(null);

    useFrame((state, delta) => {
        if (!lightRef.current) return;
        const t = state.clock.elapsedTime;
        
        let targetInt = 0;
        if (stage === 'push') {
            targetInt = 150;
        } else if (stage === 'suction' || stage === 'tunnel') {
            targetInt = 350;
        }

        lightRef.current.intensity = THREE.MathUtils.lerp(
            lightRef.current.intensity, 
            targetInt, 
            delta * 2.5
        );

        if (strobeRef.current) {
            if (stage === 'suction' || stage === 'tunnel') {
                const isFlickerOn = (Math.sin(t * 70) + Math.cos(t * 110)) > 0.2;
                strobeRef.current.intensity = isFlickerOn ? 600 : 0;
            } else {
                strobeRef.current.intensity = 0;
            }
        }
    });

    return (
        <group position={[0, 9, -1.0]}>
            <pointLight 
                ref={lightRef} 
                color="#ffffff" 
                intensity={0} 
                distance={40} 
                decay={2} 
            />
            <pointLight 
                ref={strobeRef} 
                color="#00ffff" 
                intensity={0} 
                distance={65} 
                decay={1.2} 
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
        
        // We do not rotate the mesh if it's rectangular, the shader should handle the swirling.
        // meshRef.current.rotation.z += delta * (0.4 + matRef.current.uSuction * 1.5);
    });
    
    return (
        <mesh ref={meshRef} position={[0, 11, -1.0]} rotation={[0, 0, 0]}>
            <planeGeometry args={[11.5, 22]} />
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

const WarpTunnel = React.memo(({ active, quality, stage, glitchIntensity }: { active: boolean; quality: PerformanceTier, stage: AnimationStage, glitchIntensity: number }) => {
    const tunnelRef = useRef<THREE.Group>(null);
    const matRef = useRef<any>(null);
    
    const segments = quality === 'potato' ? 12 : quality === 'low' ? 16 : quality === 'medium' ? 20 : 24;
    
    useFrame((state, delta) => {
        if (!active || !tunnelRef.current) return;
        tunnelRef.current.rotation.z += delta * 4; 
        if (matRef.current) matRef.current.uTime = state.clock.elapsedTime;
    });
    
    const isVisible = active || stage === 'tunnel';
    return (
        <group ref={tunnelRef} position={[0, 11, -1.5]} visible={isVisible}>
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
            {stage !== 'tunnel' && stage !== 'tunnel_end' && stage !== 'arrival' && (
                <group /> // Placeholder for GlitchOverlay logic
            )}
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
            b.push({ pos: [-7.2, y, 0], scale: [2.9, 0.9, 2.9], rot: [0,0,0] }); 
            b.push({ pos: [7.2, y, 0], scale: [2.9, 0.9, 2.9], rot: [0,0,0] }); 
        }
        b.push({ pos: [-7.2, -1, 0], scale: [3.9, 1.5, 3.9], rot: [0,0,0] }); 
        b.push({ pos: [7.2, -1, 0], scale: [3.9, 1.5, 3.9], rot: [0,0,0] });
        
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
            
            <group position={[-5.75, 0, 0]} ref={leftDoor}>
                <mesh position={[2.875, 11, 0]} castShadow>
                    <boxGeometry args={[5.75, 22, 1.2]} />
                    <meshStandardMaterial color="#0f0505" roughness={0.35} metalness={0.65} emissive="#330000" emissiveIntensity={0.3} />
                </mesh>
                <mesh position={[2.875, 11, 0.65]}>
                    <planeGeometry args={[5.5, 21]} />
                    <runeShader ref={(el: any) => { magmaRefs.current[0] = el; }} uColor={new THREE.Color("#ff2200")} uIntensity={1.5} transparent />
                </mesh>
            </group>
            <group position={[5.75, 0, 0]} ref={rightDoor}>
                <mesh position={[-2.875, 11, 0]} castShadow>
                    <boxGeometry args={[5.75, 22, 1.2]} />
                    <meshStandardMaterial color="#0f0505" roughness={0.35} metalness={0.65} emissive="#330000" emissiveIntensity={0.3} />
                </mesh>
                <mesh position={[-2.875, 11, 0.65]}>
                    <planeGeometry args={[5.5, 21]} />
                    <runeShader ref={(el: any) => { magmaRefs.current[1] = el; }} uColor={new THREE.Color("#ff2200")} uIntensity={1.5} transparent />
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
    whiteoutProgress,
    tunnelProgress,
    onReachDoor
}: { 
    stage: AnimationStage; 
    quality: PerformanceTier; 
    whiteoutProgress: number;
    tunnelProgress: number;
    onReachDoor: () => void;
}) => {
    const isOpen = stage === 'push' || stage === 'suction';
    const isWarp = stage === 'suction';
    const starCount = quality === 'potato' ? 1500 : quality === 'low' ? 2500 : quality === 'medium' ? 4000 : 6000;

    return (
        <>
            <CameraDirector stage={stage} tunnelProgress={tunnelProgress} onReachDoor={onReachDoor} />
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
            
            <WarpTunnel active={isOpen} quality={quality} stage={stage} glitchIntensity={0} />
            <WormholeTunnel stage={stage} tunnelProgress={tunnelProgress} />
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
                        isWarp ? 0.2 : 0.0008, 
                        isWarp ? 0.2 : 0.0008
                    )} 
                    radialModulation={false}
                    modulationOffset={0}
                />
                {isWarp ? (
                    <Glitch 
                        delay={new THREE.Vector2(0.05, 0.15)} 
                        duration={new THREE.Vector2(0.2, 0.6)} 
                        strength={new THREE.Vector2(0.8, 1.5)} 
                        active={true}
                        ratio={0.95}
                    />
                ) : <></>}
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

const CameraDirector = React.memo(({ 
    stage, 
    tunnelProgress,
    onReachDoor
}: { 
    stage: AnimationStage; 
    tunnelProgress: number;
    onReachDoor: () => void;
}) => {
    const { camera } = useThree();
    const currentTargetPos = useRef(new THREE.Vector3(0, 80, 80));
    const currentLookAt = useRef(new THREE.Vector3(0, 9, 0));
    const currentFov = useRef(60);
    const walkStart = useRef<number | null>(null);
    const tunnelStart = useRef<number | null>(null);
    const introStart = useRef<number | null>(null);
    const introStartPos = useRef<THREE.Vector3>(new THREE.Vector3());
    const lookSway = useRef(0);
    const orbitOffset = useRef(0);

    useFrame((state, delta) => {
        perfMonitor.update();
        
        const t = state.clock.elapsedTime;
        const desiredPos = new THREE.Vector3();
        const desiredLook = new THREE.Vector3();
        let targetFov = 60;
        let targetRoll = 0;
        let posAccel = 1.3;
        let drag = 1.0;

        desiredPos.copy(currentTargetPos.current); 
        desiredLook.copy(currentLookAt.current);

        switch(stage) {
            case 'loading': {
                desiredPos.set(0, 80, 80); 
                desiredLook.set(0, 9, 0); 
                break;
            }
            case 'intro': {
                if (introStart.current === null) {
                    introStart.current = t;
                    const r = Math.random();
                    if (r < 0.1) introStartPos.current.set(0, -150, 0);       // underground (rare)
                    else if (r < 0.28) introStartPos.current.set(0, 300, 0);  // top of sky
                    else if (r < 0.46) introStartPos.current.set(300, 20, 0); // east
                    else if (r < 0.64) introStartPos.current.set(-300, 20, 0);// west
                    else if (r < 0.82) introStartPos.current.set(0, 20, -300);// north
                    else introStartPos.current.set(0, 20, 300);               // south
                }

                const ft = t - introStart.current;
                const flyDuration = 12.0; // 12 seconds of cinematic entry
                const p = Math.min(ft / flyDuration, 1.0);
                const easeOut = 1 - Math.pow(1 - p, 3);
                
                const angle = easeOut * 4 * Math.PI; // 2 laps
                const radius = 300 * (1 - easeOut) + 42 * easeOut;
                
                const sx = introStartPos.current.x;
                const sy = introStartPos.current.y;
                const sz = introStartPos.current.z;
                
                const targetX = Math.sin(angle) * radius;
                const targetZ = Math.cos(angle) * radius;
                const targetY = sy * (1 - easeOut) + 10 * easeOut;
                
                desiredPos.set(
                    sx * (1 - easeOut) + targetX, 
                    targetY, 
                    sz * (1 - easeOut) + targetZ
                );
                desiredLook.set(0, 9 * easeOut, 0);
                
                targetFov = 90 - (easeOut * 30);
                targetRoll = Math.sin(easeOut * Math.PI) * 0.5;
                posAccel = 5.0;
                drag = 0.8;
                
                // End intro stage automatically after duration
                if (p === 1.0) {
                    orbitOffset.current = t; 
                }
                break;
            }
            case 'tunnel': {
                if (tunnelStart.current === null) tunnelStart.current = t;
                const tt = t - tunnelStart.current;
                const p1 = TUNNEL_CURVE.getPointAt(Math.min(1.0, tunnelProgress));
                const p2 = TUNNEL_CURVE.getPointAt(Math.min(1.0, tunnelProgress + 0.05));
                
                desiredPos.set(p1.x, p1.y, p1.z - 50);
                desiredPos.x += Math.sin(tt * 25) * 0.8 + Math.sin(tt * 3) * 3;
                desiredPos.y += Math.cos(tt * 22) * 0.8 + Math.cos(tt * 3.5) * 3;
                
                desiredLook.set(p2.x, p2.y, p2.z - 50);
                
                targetFov = 90 + tunnelProgress * 40;
                targetRoll = Math.sin(tt * 4.0) * 1.5 + tt * 2.5;
                posAccel = 25;
                drag = 0.5;
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
            case 'walk':
            case 'brace_popup': {
                if (walkStart.current === null && stage === 'walk') walkStart.current = t;
                const wt = walkStart.current !== null ? t - walkStart.current : 0;
                const walkSpeed = 5.2; 
                const forwardZ = Math.max(10.5, 48 - wt * walkSpeed);
                const headBob = stage === 'walk' ? Math.sin(wt * 6.0) * 0.08 : 0; 
                const headSway = stage === 'walk' ? Math.sin(wt * 3.0) * 0.06 : 0;
                desiredPos.set(headSway, 1.8 + headBob, forwardZ);
                desiredLook.set(0, 7, 0);
                
                if (stage === 'walk' && forwardZ <= 10.6) {
                    onReachDoor();
                }
                break;
            }
            case 'push': {
                desiredPos.set(0, 1.8, 6); 
                desiredLook.set(0, 1.8, -10);
                break;
            }
            case 'suction': {
                desiredPos.set(0, 0, -45); 
                desiredLook.set(0, 0, -100); 
                targetFov = 105;
                posAccel = 4.0;
                break;
            }
        }

        const smoothSpeed = posAccel;
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
        sfx.play('title', 0.8);
        
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
                    <h1 
                        className="text-4xl sm:text-6xl md:text-8xl font-normal font-gradvis text-transparent bg-clip-text bg-gradient-to-r from-white via-red-200 to-zinc-400 tracking-[0.25em] sm:tracking-[0.45em] ml-[0.25em] sm:ml-[0.45em] uppercase drop-shadow-[0_0_35px_rgba(220,38,38,0.5)]" 
                        style={{ fontFamily: 'var(--font-gradvis), serif' }}
                    >
                        SHADOW GARDEN
                    </h1>
                    
                    <div className="relative w-full max-w-3xl h-10 mt-3 overflow-visible flex items-center justify-center">
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent -translate-y-1/2" />
                        
                        <motion.div
                            initial={{ x: "-100%", opacity: 0, scale: 0.3 }}
                            animate={{ 
                                x: ["-100%", "-30%", "20%", "45%", "50%"], 
                                opacity: [0, 1, 1, 1, 0.95],
                                scale: [0.3, 1.2, 1.0, 1.1, 1.0]
                            }}
                            transition={{ 
                                duration: 4.2, 
                                ease: [0.1, 0.9, 0.2, 1],
                                times: [0, 0.25, 0.6, 0.85, 1]
                            }}
                            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                        >
                            <div className="absolute w-24 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent blur-[0.3px]" />
                            <div className="absolute w-8 h-8 rounded-full bg-red-600/40 blur-md" />
                            <div className="absolute right-full w-32 h-[1px] bg-gradient-to-l from-red-400 via-transparent to-transparent opacity-60" />
                        </motion.div>
                    </div>
                </div>

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
        <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4 sm:p-6 pb-[15vh] sm:pb-[20vh] overflow-hidden touch-none">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="w-full max-w-lg mx-auto border-2 border-primary-900/60 bg-[#0a0505]/95 p-6 sm:p-8 rounded-3xl text-center backdrop-blur-2xl shadow-[0_0_60px_rgba(220,38,38,0.35)] relative overflow-hidden"
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
                        onClick={() => { sfx.play('glass'); onSelect('boy'); }}
                        onMouseEnter={() => sfx.play('hover')}
                        className="group p-6 sm:p-8 border border-blue-500/30 bg-blue-950/20 hover:bg-blue-900/40 hover:border-blue-400 rounded-2xl transition-all flex flex-col items-center gap-4 shadow-lg hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
                    >
                        <div className="p-4 rounded-full bg-blue-500/20 border border-blue-400/40 group-hover:scale-110 transition-transform">
                            <Sword className="w-8 h-8 text-blue-400" />
                        </div>
                        <span className="text-base sm:text-lg font-bold text-white tracking-widest font-mono">MALE</span>
                        <span className="text-[10px] text-blue-300/70 font-mono uppercase">SHADOW MONARCH</span>
                    </button>
                    <button 
                        onClick={() => { sfx.play('glass'); onSelect('girl'); }} 
                        onMouseEnter={() => sfx.play('hover')}
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

const BracePopup = React.memo(({ onReady, gender }: { onReady: () => void; gender: Gender | null }) => {
    return (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden touch-none">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="relative max-w-sm sm:max-w-md w-full mx-auto bg-[#0a0505]/95 border border-primary-900/60 p-5 sm:p-6 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.3)] text-center"
            >
                <div className="flex items-center justify-center gap-3 mb-4 border-b border-primary-900/30 pb-3">
                    <div className="p-2 bg-primary-950/60 rounded-full border border-primary-500/40">
                        <Power className="w-5 h-5 text-primary-500 animate-pulse" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-base sm:text-lg text-white font-bold tracking-[0.15em] font-mono uppercase">
                            DIMENSION ALERT
                        </h3>
                    </div>
                </div>

                <p className="text-gray-300 text-sm mb-5 leading-relaxed font-mono text-left">
                    We are not going beyond Shadow Garden, we are going beyond our reality and going to a place known as Otakuverse which has the guild Shadow Garden where we will operate everything. Brace yourself and push the door.
                </p>

                <Button 
                    onClick={() => {
                        if (sfx?.play) sfx.play('glass', 0.5);
                        onReady();
                    }}
                    onMouseEnter={() => {
                        if (sfx?.play) sfx.play('hover', 0.3);
                    }}
                    className="w-full bg-primary-900/80 hover:bg-primary-800 text-white border border-primary-500/50 uppercase tracking-widest font-mono pointer-events-auto"
                >
                    OK, I'm ready
                </Button>
            </motion.div>
        </div>
    );
});

BracePopup.displayName = 'BracePopup';

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
                className="relative max-w-sm sm:max-w-md w-full mx-auto bg-[#0a0505]/95 border border-primary-900/60 p-5 sm:p-6 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden text-center"
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
                            sfx.play('glass');
                            onChoice(true, never ? 9999 : (pause7 ? 7 : 0));
                        }} 
                        onMouseEnter={() => sfx.play('hover')}
                        className="group relative overflow-hidden bg-primary-900/50 hover:bg-primary-700 border border-primary-500/60 hover:border-primary-400 transition-all duration-300 h-10 rounded-xl shadow-md"
                    >
                        <div className="flex items-center justify-center gap-2.5">
                            <PlayCircle className="w-4 h-4 text-primary-400 group-hover:text-white" />
                            <span className="text-white font-bold tracking-widest text-xs font-mono">PLAY</span>
                        </div>
                    </Button>
                    
                    <Button 
                        onClick={() => {
                            sfx.play('glass');
                            onChoice(false, never ? 9999 : (pause7 ? 7 : 0));
                        }} 
                        onMouseEnter={() => sfx.play('hover')}
                        variant="outline" 
                        className="bg-transparent border-white/10 hover:bg-white/10 hover:border-white/20 h-10 rounded-xl"
                    >
                        <div className="flex items-center justify-center gap-2.5">
                            <FastForward className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-300 group-hover:text-white transition-colors tracking-widest text-xs font-mono">SKIP</span>
                        </div>
                    </Button>
                </div>

                <div className="bg-black/60 rounded-xl p-3 border border-white/10 flex flex-row items-center justify-between text-left gap-2 flex-nowrap whitespace-nowrap overflow-hidden">
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <Checkbox id="pause" checked={pause7} className="border-primary-900/50 data-[state=checked]:bg-primary-900 data-[state=checked]:text-white flex-shrink-0" onCheckedChange={(c) => { setPause7(!!c); if (c) setNever(false); }} />
                        <label htmlFor="pause" className="text-[10px] sm:text-xs text-gray-400 font-mono cursor-pointer hover:text-primary-400 transition-colors flex items-center gap-1"><Clock className="w-3 h-3 text-primary-500 hidden sm:block" /> Skip 7 days</label>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <Checkbox id="never" checked={never} className="border-primary-900/50 data-[state=checked]:bg-primary-900 data-[state=checked]:text-white flex-shrink-0" onCheckedChange={(c) => { setNever(!!c); if (c) setPause7(false); }} />
                        <label htmlFor="never" className="text-[10px] sm:text-xs text-gray-400 font-mono cursor-pointer hover:text-primary-400 transition-colors">Always skip</label>
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
    const [stage, setStage] = useState<AnimationStage>('loading');
    const [whiteout, setWhiteout] = useState(false);
    const [whiteoutOpacity, setWhiteoutOpacity] = useState(0.45);
    const [whiteoutProgress, setWhiteoutProgress] = useState(0);
    const [tunnelProgress, setTunnelProgress] = useState(0);
    const [showBracePopup, setShowBracePopup] = useState(false);
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
        return () => {
            const sfxObj = (window as any).shadowAudio || (window as any).sfx || sfx;
            if (sfxObj?.stopLoop) {
                sfxObj.stopLoop('tunnelWind');
                sfxObj.stopLoop('bhHum');
                sfxObj.stopLoop('droneWind');
            }
            if (sfxObj?.stopAll) sfxObj.stopAll(300);
        };
    }, []);

    const triggerSkip = useCallback(() => {
        const sfxObj = (window as any).shadowAudio || (window as any).sfx || sfx;
        if (sfxObj?.stopLoop) {
            sfxObj.stopLoop('tunnelWind');
            sfxObj.stopLoop('bhHum');
            sfxObj.stopLoop('droneWind');
        }
        if (sfxObj?.stopAll) sfxObj.stopAll();
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
        setAppState('running'); 
        setStage('intro');
        sfx.playRandomBGM(); 
        sfx.play('drone', 0.6, true);
    }, [appState]);

    useEffect(() => {
        if (appState === 'running' && stage === 'intro') {
            const timeout = setTimeout(() => {
                setStage('idle');
                onSceneReadyRef.current?.(); 
            }, 12500); // Wait for the 12s cinematic flyover + 0.5s buffer
            return () => clearTimeout(timeout);
        }
    }, [appState, stage]);

    useEffect(() => {
        if (stage === 'push') {
            const interval = setInterval(() => {
                setWhiteoutProgress(prev => Math.min(prev + 0.015, 1));
            }, 50);
            return () => clearInterval(interval);
        }
    }, [stage]);

    useEffect(() => {
        if (stage === 'tunnel') {
            const interval = setInterval(() => {
                setTunnelProgress(prev => Math.min(prev + 0.005, 1.2));
            }, 30);
            return () => clearInterval(interval);
        }
    }, [stage]);

    useEffect(() => {
        if (startTransition && stage === 'idle') {
            performEntrySequence();
        }
    }, [startTransition, stage]);

    const handleReachDoor = useCallback(() => {
        setStage('brace_popup');
        sfx.stop('step'); 
        sfx.stop('drone', 500);
        setShowBracePopup(true);
    }, []);

    const performEntrySequence = useCallback(() => {
        sfx.init(); 
        setStage('drop');
        sfx.play('drone', 0.6, true); 
        
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
    }, []);

    const handleBraceReady = useCallback(() => {
        const sfxObj = (window as any).shadowAudio || (window as any).sfx || sfx;
        setShowBracePopup(false);
        setStage('push');
        if (sfxObj?.play) {
            sfxObj.play('door', 0.8); 
            sfxObj.play('portal', 0.8, true); 
            sfxObj.play('grind', 0.5); 
            sfxObj.play('boom', 0.5); 
        }
        setShake(0.8);
        
        setTimeout(() => { 
            setStage('suction'); 
            if (sfxObj?.play) {
                sfxObj.play('suction', 0.7); 
                sfxObj.play('glitch', 0.8, true); // Glitch sound starts right from portal suction!
            }
            setShake(8.0); 
        }, 2000);

        setTimeout(() => {
            setWhiteoutOpacity(0.45); // Reduced opacity for white flash when entering tunnel
            setWhiteout(true);
        }, 2300);
        
        setTimeout(() => {
            setStage('tunnel');
            setTunnelProgress(0);
            setWhiteout(false); // Fade out the whiteout for the tunnel
            setShake(0); // Remove camera shake in tunnel
            if (sfxObj?.stop) {
                sfxObj.stop('portal', 500);
            }
            if (sfxObj?.play) {
                sfxObj.play('tunnel', 0.8, true);
                sfxObj.play('bh_hum', 0.35);
            }
        }, 5000);

        setTimeout(() => {
            if (sfxObj?.play) sfxObj.play('tunnel_end', 0.7);
        }, 9500);

        // Fade back to white smoothly over 1.5s right before tunnel ends
        setTimeout(() => {
            setWhiteoutOpacity(0.85);
            setWhiteout(true);
            if (sfxObj?.stop) {
                sfxObj.stop('glitch', 500); // Stop glitch sound before destination!
            }
        }, 10500);

        setTimeout(() => { 
            if (sfxObj?.stop) {
                sfxObj.stop('tunnel', 500);
                sfxObj.stop('glitch', 300);
            }
            if (sfxObj?.stopLoop) {
                sfxObj.stopLoop('tunnelWind', 300);
                sfxObj.stopLoop('bhHum', 300);
                sfxObj.stopLoop('droneWind', 300);
            }
            setStage('arrival'); 
            if (sfxObj?.play) {
                sfxObj.play('destination', 0.9);
                sfxObj.play('popup_chime', 0.6);
            }
        }, 12000); // End of tunnel

        setTimeout(() => {
            if (sfxObj?.stop) {
                sfxObj.stop('tunnel', 100);
                sfxObj.stop('portal', 100);
                sfxObj.stop('drone', 100);
                sfxObj.stop('glitch', 100);
            }
            if (sfxObj?.stopLoop) {
                sfxObj.stopLoop('tunnelWind', 100);
                sfxObj.stopLoop('bhHum', 100);
                sfxObj.stopLoop('droneWind', 100);
            }
            if (sfxObj?.stopAll) sfxObj.stopAll(100);
            onComplete(); 
        }, 13500); // Complete after 1.5 seconds
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
        <>
            <div className="fixed inset-0 z-0 bg-black pointer-events-none">

            <AnimatePresence>
                {appState === 'cinematic_intro' ? (
                    <CinematicTitleIntro onComplete={handleCinematicIntroComplete} />
                ) : null}
            </AnimatePresence>

            {appState === 'running' ? (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
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
                            <SceneContent stage={stage} quality={quality} whiteoutProgress={whiteoutProgress} tunnelProgress={tunnelProgress} onReachDoor={handleReachDoor} />
                        </Suspense>
                    </Canvas>
                </motion.div>
            ) : null}

            {showBracePopup && (
                <BracePopup onReady={handleBraceReady} gender={gender} />
            )}

            <AnimatePresence>
                {stage === 'arrival' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute inset-0 z-[11000] flex flex-col items-center justify-center pointer-events-none"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold font-mono text-black tracking-[0.2em] mb-4">
                            DESTINATION REACHED
                        </h2>
                        <p className="text-purple-700 font-mono font-semibold tracking-widest text-sm md:text-base">
                            GOOD LUCK, ADVENTURER
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div 
                initial={{ opacity: 0 }} 
                animate={whiteout ? { opacity: whiteoutOpacity } : { opacity: 0 }} 
                transition={{ duration: 1.5 }} 
                className="absolute inset-0 bg-white z-[10000] pointer-events-none" 
            />
        </div>
        </>
    );
}