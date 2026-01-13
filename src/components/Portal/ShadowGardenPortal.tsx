"use client";

/**
 * SHADOW GARDEN: ETERNAL ENGINE (VER 35.0 - THE BODY)
 * =============================================================================
 * * [NEW] DETAILED PROCEDURAL RIG
 * - Replaced basic boxes with a multi-part geometry rig.
 * - Arms, Palms, Thumbs, Fingers, and Legs constructed from primitives.
 * - Simulates a "Real 3D Model" without requiring external downloads.
 * * [MODEL SUPPORT]
 * - Added a `useGLTF` block (commented) if you wish to drop in a real .glb file.
 * * [PRESERVED]
 * - All Cinematic Physics (Fall, Recover, Confusion, Walk, Suction).
 * - Global Audio Unlock.
 */

import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom'; 
import { createPortal as create3DPortal, Canvas, useFrame, extend, useThree } from '@react-three/fiber'; 
import * as THREE from 'three';
import { 
    PerspectiveCamera, 
    Stars, 
    Sparkles, 
    Instance, 
    Instances, 
    MeshReflectorMaterial, 
    CameraShake,
    Cylinder,
    shaderMaterial,
    Sky,
    Cloud,
    Billboard,
    Box,
    Capsule,
    Sphere,
    useGLTF // Import for model loading
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
import { Scroll, Fingerprint, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PortalLoadingScreen from './PortalLoadingScreen';

// =============================================================================
// CONFIGURATION
// =============================================================================

const BGM_TRACKS = ["track1.mp3", "track2.mp3", "track3.mp3"];

// =============================================================================
// MODULE 1: AUDIO MATRIX
// =============================================================================

class AudioMatrix {
    private sources: Map<string, HTMLAudioElement> = new Map();
    private active: boolean = false;
    private hasUserInteracted: boolean = false;

    init() {
        if (this.active) return;
        
        const sfxLibrary = {
            wind: "/audio/sfx/wind.mp3", 
            grind: "/audio/sfx/grind.mp3", 
            boom: "/audio/sfx/boom.mp3", 
            step: "/audio/sfx/step.mp3",
            drop: "/audio/sfx/drop.mp3", 
            heartbeat: "/audio/sfx/heartbeat.mp3",
            scream: "/audio/sfx/scream.mp3",
            suction: "/audio/sfx/wind_howl.mp3" 
        };

        if (typeof window !== 'undefined') {
            Object.entries(sfxLibrary).forEach(([key, url]) => {
                const audio = new Audio(url);
                audio.preload = 'auto';
                audio.volume = 0;
                this.sources.set(key, audio);
            });

            BGM_TRACKS.forEach((filename) => {
                const path = `/audio/bgm/${filename}`;
                const audio = new Audio(path);
                audio.preload = 'auto';
                audio.volume = 0;
                this.sources.set(`bgm_${filename}`, audio);
            });

            this.active = true;
        }
    }

    unlockAudio() {
        if (this.hasUserInteracted) return;
        this.hasUserInteracted = true;
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            ctx.resume().then(() => {
                this.play('wind', 0.2, true, 2000);
            });
        }
    }

    playRandomBGM(fadeMs: number = 2000) {
        if (!this.active) this.init();
        if (BGM_TRACKS.length === 0) return;
        const idx = Math.floor(Math.random() * BGM_TRACKS.length); 
        const key = `bgm_${BGM_TRACKS[idx]}`;
        const audio = this.sources.get(key);
        if (audio) this.play(key, 0.2, true, fadeMs); 
    }

    play(key: string, vol: number = 1, loop: boolean = false, fadeMs: number = 0) {
        if (!this.active) this.init();
        const audio = this.sources.get(key);
        if (!audio) return;
        
        audio.loop = loop;
        if (!loop) audio.currentTime = 0;
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }

        if (fadeMs > 0) {
            audio.volume = 0;
            const steps = 30;
            const incr = vol / steps;
            const interval = fadeMs / steps;
            const timer = setInterval(() => {
                if (audio.volume < vol - incr) audio.volume += incr;
                else {
                    audio.volume = vol;
                    clearInterval(timer);
                }
            }, interval);
        } else {
            audio.volume = vol;
        }
    }

    stop(key: string, fadeMs: number = 0) {
        const audio = this.sources.get(key);
        if (!audio) return;

        if (fadeMs > 0) {
            const steps = 20;
            const decr = audio.volume / steps;
            const interval = fadeMs / steps;
            const timer = setInterval(() => {
                if (audio.volume > decr) audio.volume -= decr;
                else {
                    audio.volume = 0;
                    audio.pause();
                    clearInterval(timer);
                }
            }, interval);
        } else {
            audio.pause();
        }
    }

    stopAll(fadeMs: number = 500) {
        this.sources.forEach(audio => {
            if (!audio.paused) {
                const steps = 10;
                const decr = audio.volume / steps;
                const interval = fadeMs / steps;
                const timer = setInterval(() => {
                    if (audio.volume > decr) audio.volume -= decr;
                    else {
                        audio.volume = 0;
                        audio.pause();
                        clearInterval(timer);
                    }
                }, interval);
            }
        });
    }
}

const sfx = new AudioMatrix();

// =============================================================================
// MODULE 2: SHADERS
// =============================================================================

const MagmaShader = shaderMaterial(
    { uTime: 0, uColor: new THREE.Color("#ff3300"), uIntensity: 2.5 },
    `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    `varying vec2 vUv; uniform float uTime; uniform vec3 uColor; uniform float uIntensity;
    void main() {
        float noise = sin(vUv.y * 10.0 - uTime * 1.5) + cos(vUv.x * 20.0);
        float vein = 0.03 / abs(vUv.x - 0.5 + noise * 0.05);
        gl_FragColor = vec4(uColor * vein * uIntensity, smoothstep(0.0, 1.0, vein));
    }`
);

const PortalVortexShader = shaderMaterial(
    { uTime: 0, uColor: new THREE.Color("#ff0000"), uOpen: 0 },
    `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    `varying vec2 vUv; uniform float uTime; uniform vec3 uColor; uniform float uOpen;
    void main() {
        vec2 center = vUv - 0.5;
        float dist = length(center);
        float spiral = sin(atan(center.y, center.x) * 8.0 + dist * 30.0 - uTime * 2.0);
        vec3 white = vec3(1.0);
        vec3 finalColor = mix(uColor, white, uOpen * smoothstep(0.3, 0.0, dist));
        float alpha = smoothstep(0.5, 0.0, dist);
        gl_FragColor = vec4(finalColor * (1.0 + spiral * 0.2), alpha);
    }`
);

const CloudShader = shaderMaterial(
    { uTime: 0, uColor: new THREE.Color("#552222"), uDensity: 0.5 },
    `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    `varying vec2 vUv; uniform float uTime; uniform vec3 uColor; uniform float uDensity;
    float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
    void main() {
        float noise = rand(vUv * 15.0 + uTime * 0.05);
        float dist = distance(vUv, vec2(0.5));
        float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * noise * uDensity;
        gl_FragColor = vec4(uColor, alpha);
    }`
);

const WarpShader = shaderMaterial(
    { uTime: 0, uColor: new THREE.Color("#ffffff"), uSpeed: 20.0 },
    `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    `uniform float uTime; uniform vec3 uColor; uniform float uSpeed; varying vec2 vUv;
    void main() {
        float streak = sin(vUv.y * 100.0 + uTime * uSpeed); 
        float opacity = smoothstep(0.9, 1.0, streak) * smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
        gl_FragColor = vec4(uColor, opacity * 0.8);
    }`
);

extend({ MagmaShader, PortalVortexShader, CloudShader, WarpShader });

// =============================================================================
// MODULE 3: PLAYER RIG (HIGH FIDELITY)
// =============================================================================

// --- OPTIONAL: EXTERNAL MODEL LOADING ---
// Use this component if you have a file at /public/models/fpv_rig.glb
/*
const ExternalModelRig = ({ stage }: { stage: any }) => {
    const { scene, animations } = useGLTF('/models/fpv_rig.glb'); 
    // You would bind animations here based on stage
    return <primitive object={scene} />;
}
*/

const DetailedHand = ({ side }: { side: 'left' | 'right' }) => {
    const flip = side === 'right' ? 1 : -1;
    const BodyMat = <meshStandardMaterial color="#050505" roughness={0.7} metalness={0.2} />;

    return (
        <group scale={[flip, 1, 1]}>
            {/* Forearm */}
            <Capsule args={[0.06, 0.4]} position={[0, -0.2, 0]}>{BodyMat}</Capsule>
            
            {/* Palm */}
            <Box args={[0.12, 0.15, 0.04]} position={[0, 0.1, 0]}>{BodyMat}</Box>
            
            {/* Thumb */}
            <group position={[0.08, 0.05, 0.02]} rotation={[0, 0, -0.5]}>
                <Capsule args={[0.025, 0.08]}>{BodyMat}</Capsule>
            </group>

            {/* Fingers (Static pose for better perf, or animated locally) */}
            <group position={[-0.02, 0.2, 0]}>
                {[...Array(4)].map((_, i) => (
                    <Capsule key={i} args={[0.02, 0.1]} position={[i * 0.03 - 0.03, 0, 0]}>{BodyMat}</Capsule>
                ))}
            </group>
        </group>
    );
};

const PlayerRig = ({ stage }: { stage: AnimationStage }) => {
    const { camera } = useThree();
    const rightHandRef = useRef<THREE.Group>(null);
    const leftHandRef = useRef<THREE.Group>(null);
    const legsRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (!rightHandRef.current || !leftHandRef.current || !legsRef.current) return;

        const t = state.clock.elapsedTime;
        
        const rTarget = new THREE.Vector3(0.4, -0.4, -0.8); 
        const lTarget = new THREE.Vector3(-0.4, -0.4, -0.8);
        const rRot = new THREE.Vector3(0.5, 0, 0); // Slight natural curve
        
        switch (stage) {
            case 'drop': rTarget.set(0.6, 0.5, -0.8); lTarget.set(-0.6, 0.5, -0.8); break;
            case 'crouch': 
                rTarget.set(0.3, -0.8, -0.6); lTarget.set(-0.3, -0.8, -0.6); 
                rRot.set(1.8, 0, 0); // Hands planted on ground
                break;
            case 'stand': rTarget.set(0.4, -0.5, -0.6); lTarget.set(-0.4, -0.5, -0.6); break;
            case 'confusion': 
                rTarget.set(0.2, -0.2, -0.5); // Hand to face
                lTarget.set(-0.5, -1.0, -0.5); 
                rRot.set(0.2, 0.5, -0.5); // Looking at palm
                break;
            case 'walk1':
            case 'walk2':
                rTarget.y = -0.5 + Math.sin(t * 10) * 0.1; lTarget.y = -0.5 + Math.cos(t * 10) * 0.1;
                rTarget.z = -0.8 + Math.cos(t * 10) * 0.1; lTarget.z = -0.8 + Math.sin(t * 10) * 0.1;
                break;
            case 'push':
            case 'suction':
                rTarget.set(0.3, 0.0, -1.0); lTarget.set(-0.3, 0.0, -1.0); 
                rRot.set(1.6, 0, 0); // Palms pushing out
                break;
        }

        rightHandRef.current.position.lerp(rTarget, delta * 4);
        leftHandRef.current.position.lerp(lTarget, delta * 4);
        rightHandRef.current.rotation.x = THREE.MathUtils.lerp(rightHandRef.current.rotation.x, rRot.x, delta * 4);
        rightHandRef.current.rotation.y = THREE.MathUtils.lerp(rightHandRef.current.rotation.y, rRot.y, delta * 4);
        
        leftHandRef.current.rotation.x = rightHandRef.current.rotation.x;
        
        legsRef.current.position.set(0, -1.7, 0.2); 
    });

    const LegMat = <meshStandardMaterial color="#050505" roughness={0.8} />;

    return (
        <group>
            {create3DPortal(
                <group position={[0, 0, 0]}>
                    {/* Right Hand */}
                    <group ref={rightHandRef} position={[0.4, -0.4, -0.8]}>
                        <DetailedHand side="right" />
                    </group>
                    
                    {/* Left Hand */}
                    <group ref={leftHandRef} position={[-0.4, -0.4, -0.8]}>
                        <DetailedHand side="left" />
                    </group>

                    {/* Legs (Visible when looking down) */}
                    <group ref={legsRef}>
                        <Capsule args={[0.18, 1.4]} position={[0.25, 0, 0]}>{LegMat}</Capsule>
                        <Capsule args={[0.18, 1.4]} position={[-0.25, 0, 0]}>{LegMat}</Capsule>
                    </group>
                </group>,
                camera
            )}
        </group>
    );
};

// =============================================================================
// MODULE 4: SCENE COMPONENTS
// =============================================================================

const WarpTunnel = ({ active }: { active: boolean }) => {
    const tunnelRef = useRef<THREE.Group>(null);
    const matRef = useRef<any>(null);

    useFrame((state, delta) => {
        if (!active || !tunnelRef.current) return;
        tunnelRef.current.rotation.z += delta * 5; 
        if (matRef.current) matRef.current.uTime = state.clock.elapsedTime;
    });

    return (
        <group ref={tunnelRef} position={[0, 5, -20]} visible={active}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[8, 2, 60, 32, 1, true]} />
                {/* @ts-ignore */}
                <warpShader ref={matRef} uColor={new THREE.Color("#ccffff")} uSpeed={30.0} transparent side={THREE.BackSide} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
    );
};

const ConstructedGate = ({ isOpen }: { isOpen: boolean }) => {
    const frameBricks = useMemo(() => {
        const b = [];
        for(let y=0; y<18; y++) {
            b.push({ pos: [-7, y, 0], scale: [2.5, 0.9, 2.5], rot: [0,0,0] });
            b.push({ pos: [7, y, 0], scale: [2.5, 0.9, 2.5], rot: [0,0,0] });
        }
        b.push({ pos: [-7, -1, 0], scale: [3.5, 1.5, 3.5], rot: [0,0,0] });
        b.push({ pos: [7, -1, 0], scale: [3.5, 1.5, 3.5], rot: [0,0,0] });
        for(let i=0; i<24; i++) {
            const angle = (i/23) * Math.PI;
            const x = Math.cos(angle) * 7;
            const y = Math.sin(angle) * 7 + 18;
            b.push({ pos: [x, y, 0], scale: [2, 0.8, 2], rot: [0, 0, angle] });
        }
        b.push({ pos: [0, 25.5, 0], scale: [3, 1.5, 3], rot: [0,0,0.78] }); 
        return b;
    }, []);

    const leftDoor = useRef<THREE.Group>(null);
    const rightDoor = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (!leftDoor.current || !rightDoor.current) return;
        const targetRot = isOpen ? -2.2 : 0;
        leftDoor.current.rotation.y = THREE.MathUtils.lerp(leftDoor.current.rotation.y, targetRot, delta * 0.4);
        rightDoor.current.rotation.y = THREE.MathUtils.lerp(rightDoor.current.rotation.y, -targetRot, delta * 0.4);
    });

    return (
        <group>
            <Instances range={frameBricks.length}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
                {frameBricks.map((d, i) => (
                    <Instance key={i} position={d.pos as any} scale={d.scale as any} rotation={d.rot as any} />
                ))}
            </Instances>

            <group position={[-7, 0, 0]}>
                <group ref={leftDoor}>
                    <group position={[3.5, 9, 0]}>
                        <mesh castShadow receiveShadow>
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
            </group>

            <group position={[7, 0, 0]}>
                <group ref={rightDoor}>
                    <group position={[-3.5, 9, 0]}>
                        <mesh castShadow receiveShadow>
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
            </group>
        </group>
    );
};

const CobblestoneRoad = () => {
    const stones = useMemo(() => {
        const arr = [];
        for(let i=0; i<200; i++) {
            const z = i * 0.5 - 10; 
            const x = (Math.random() - 0.5) * 10; 
            arr.push({ pos: [x, 0.05, z], scale: 0.5 + Math.random() * 0.5, rot: Math.random() * Math.PI });
        }
        return arr;
    }, []);

    return (
        <group>
            <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 35]}>
                <planeGeometry args={[14, 100]} />
                <meshStandardMaterial color="#050303" roughness={1} />
            </mesh>
            <Instances range={stones.length}>
                <cylinderGeometry args={[0.6, 0.7, 0.1, 7]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
                {stones.map((s, i) => (
                    <Instance key={i} position={s.pos as any} scale={[s.scale, 1, s.scale]} rotation={[0, s.rot, 0]} />
                ))}
            </Instances>
        </group>
    );
};

const Fireflies = () => {
    const ref = useRef<any>();
    useFrame((state) => {
        if(ref.current) {
            ref.current.rotation.y += 0.001;
            ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 2;
        }
    });
    return (
        <group ref={ref}>
            <Sparkles count={200} scale={[30, 10, 30]} size={4} speed={0.2} opacity={0.8} color="#ffaa00" position={[0, 5, 20]} />
        </group>
    )
}

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
                    <magmaShader uColor={new THREE.Color("#ff5500")} uIntensity={3.0} transparent side={THREE.DoubleSide} />
                </mesh>
                <pointLight position={[0, 6, 0]} color="#ff5500" intensity={30} distance={25} decay={2} castShadow />
            </group>
        ))}
    </group>
);

const EveningStar = () => (
    <group position={[-30, 40, -80]}>
        <mesh>
            <sphereGeometry args={[1.5, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
        </mesh>
        <pointLight intensity={5} color="#ffffff" distance={100} />
        <Sparkles count={10} scale={5} size={15} speed={0} opacity={0.8} color="#ffffff" />
    </group>
);

const VolumetricClouds = () => {
    const cloudRef = useRef<any>(null);
    useFrame((state) => {
        if(cloudRef.current) cloudRef.current.uTime = state.clock.elapsedTime;
    });

    return (
        <group>
            {[...Array(8)].map((_, i) => (
                <mesh key={i} position={[Math.random()*80-40, 25+Math.random()*10, -50]} rotation={[0,0,0.1]}>
                    <planeGeometry args={[40, 20]} />
                    {/* @ts-ignore */}
                    <cloudShader transparent depthWrite={false} uColor={new THREE.Color("#552222")} ref={i===0?cloudRef:null} />
                    <Billboard />
                </mesh>
            ))}
        </group>
    );
};

// =============================================================================
// 4. CINEMATIC DIRECTOR (CAMERA & SHAKE)
// =============================================================================

type AnimationStage = 'loading' | 'intro' | 'idle' | 'drop' | 'crouch' | 'stand' | 'confusion' | 'walk1' | 'breath' | 'walk2' | 'push' | 'suction';

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
            case 'loading': desiredPos.set(0, 80, 80); desiredLook.set(0, 9, 0); break;
            case 'intro': desiredPos.set(0, 7, 45); desiredLook.set(0, 9, 0); orbitOffset.current = t; break;
            case 'idle': 
                const relTime = t - orbitOffset.current;
                const r = 42;
                desiredPos.x = Math.sin(relTime * 0.05) * r;
                desiredPos.z = Math.cos(relTime * 0.05) * r;
                desiredPos.y = 9 + Math.cos(relTime * 0.15) * 2;
                desiredLook.set(0, 10, 0);
                break;
            case 'drop': desiredPos.set(0, 0.8, 35); desiredLook.set(0, -5, 10); break;
            case 'crouch': desiredPos.set(0, 0.5, 35); desiredLook.set(0, 0, 30); break;
            case 'stand': desiredPos.set(0, 1.8, 35); desiredLook.set(0, 7, 0); break;
            case 'confusion': 
                desiredPos.set(0, 1.8, 35);
                desiredLook.set(0.5, 1.5, 34.5); 
                lookSway.current += delta * 3;
                desiredLook.x += Math.sin(lookSway.current); 
                break;
            case 'walk1': 
                walkTime.current += delta * 6;
                desiredPos.set(Math.cos(walkTime.current * 0.5) * 0.05, 1.8 + Math.sin(walkTime.current) * 0.1, 20);
                desiredLook.set(0, 7, 0);
                break;
            case 'breath': 
                desiredPos.y = 1.65; desiredPos.z = 18; lookSway.current += delta * 0.5;
                desiredLook.y = 9 + Math.sin(lookSway.current) * 8; desiredLook.x = 0;
                break;
            case 'walk2': 
                walkTime.current += delta * 6;
                desiredPos.set(0, 1.8 + Math.sin(walkTime.current) * 0.1, 8);
                desiredLook.set(0, 8, 0); 
                break;
            case 'push':
                desiredPos.set(0, 1.8, 6); desiredLook.set(0, 9, 0);
                break;
            case 'suction': 
                desiredPos.set(0, 1.8, -25); desiredLook.set(0, 9, -50); targetFov = 120;
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
// 5. GUILD COOKIE COMPONENT
// =============================================================================

const GuildCookieNotice = ({ onAccept, onDecline }: { onAccept: () => void, onDecline: () => void }) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed bottom-10 left-0 right-0 mx-auto z-[99999] w-full flex justify-center px-4 pointer-events-none">
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-[#0a0505]/95 backdrop-blur-md border border-red-900/50 rounded-lg p-5 shadow-[0_0_30px_rgba(220,38,38,0.2)] max-w-sm w-full pointer-events-auto"
            >
                <div className="flex items-start gap-4 mb-3">
                    <div className="p-2 bg-red-900/20 rounded-full border border-red-500/20">
                        <Scroll className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h4 className="text-red-500 font-bold font-mono tracking-wider text-sm mb-1">GUILD NOTICE</h4>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            Shadow Garden employs magical cookies to enhance your experience.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={onAccept} className="flex-1 bg-red-800 hover:bg-red-700 text-white text-xs font-bold border border-red-500/50">
                        <Fingerprint className="w-3 h-3 mr-2" /> ACCEPT
                    </Button>
                    <Button onClick={onDecline} variant="ghost" className="flex-1 text-gray-500 hover:text-white text-xs hover:bg-white/5">
                        <span className="flex items-center gap-1"><X className="w-3 h-3" /> DECLINE</span>
                    </Button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

// =============================================================================
// 6. MAIN EXPORT
// =============================================================================

const SceneContent = ({ stage }: { stage: AnimationStage }) => {
    const isOpen = stage === 'push' || stage === 'suction';
    const isWarp = stage === 'suction'; 
    const isAction = stage !== 'idle' && stage !== 'intro' && stage !== 'loading';

    return (
        <>
            <CameraDirector stage={stage} />
            <PlayerRig stage={stage} />
            
            <fog attach="fog" args={['#1a0505', 20, 120]} /> 
            <Sky sunPosition={[-5, -0.02, -10]} inclination={0.6} azimuth={0.25} turbidity={10} rayleigh={3.0} mieCoefficient={0.005} />
            <Stars radius={100} count={8000} fade factor={4} />
            <EveningStar />
            <VolumetricClouds />
            <Fireflies />
            
            <ambientLight intensity={0.1} color="#2a1a1a" />
            <directionalLight position={[0, 10, -50]} intensity={3} color="#ff3300" /> 
            <directionalLight position={[-20, 40, 20]} intensity={0.5} color="#4444ff" castShadow /> 
            <pointLight position={[0, 9, -5]} intensity={isOpen ? 300 : 5} color="#ff0000" distance={60} decay={2} />
            
            <group position={[0, -2, 0]}>
                <MeshReflectorMaterial mirror={1} blur={[300, 50]} resolution={1024} mixBlur={1} mixStrength={30} roughness={0.6} depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.4} color="#0a0505" metalness={0.8} />
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                    <planeGeometry args={[200, 200]} />
                    <meshStandardMaterial color="#000000" />
                </mesh>
                <ConstructedGate isOpen={isOpen} />
                <CobblestoneRoad />
                <GuardianLamps />
                
                {/* CORE */}
                <mesh position={[0, 8, -1]}>
                    <planeGeometry args={[12, 18]} />
                    {isOpen ? (
                        <meshBasicMaterial color="#ffffff" toneMapped={false} />
                    ) : (
                        // @ts-ignore
                        <portalVortexShader uColor={new THREE.Color("#ff0000")} uOpen={0} transparent />
                    )}
                </mesh>
            </group>
            
            {/* HYPERDRIVE TUNNEL */}
            <WarpTunnel active={isWarp} />
            
            <Sparkles count={800} scale={40} size={6} speed={0.4} opacity={0.5} color="#ff3300" position={[0, 5, 10]} />
            
            <EffectComposer enableNormalPass={false} multisampling={0}>
                <Bloom luminanceThreshold={0.2} mipmapBlur intensity={isOpen ? 4.0 : 1.8} radius={0.5} />
                <ChromaticAberration offset={new THREE.Vector2(isWarp ? 0.05 : 0.002, isWarp ? 0.05 : 0.002)} />
                <DepthOfField focusDistance={isAction ? 0.02 : 0.05} focalLength={0.5} bokehScale={2} height={480} />
                <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
        </>
    );
};

interface Props {
    startTransition?: boolean;
    onComplete: () => void;
    onSceneReady?: () => void;
}

export default function ShadowGardenPortal({ startTransition, onComplete, onSceneReady }: Props) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState<AnimationStage>('loading');
    const [shake, setShake] = useState(0);
    const [whiteout, setWhiteout] = useState(false);
    const [showCookie, setShowCookie] = useState(false); 
    
    const onSceneReadyRef = useRef(onSceneReady);
    useEffect(() => { onSceneReadyRef.current = onSceneReady; }, [onSceneReady]);

    // GLOBAL AUDIO UNLOCK
    useEffect(() => {
        const handleInteraction = () => sfx.unlockAudio();
        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            sfx.stopAll(); 
        };
    }, []);

    // LOADING FIX
    useEffect(() => {
        sfx.init();
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += 1.5; 
            if (currentProgress > 100) currentProgress = 100;
            setProgress(currentProgress);

            if (currentProgress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    setIsLoaded(true);
                    handleLoaded();
                }, 500);
            }
        }, 30);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const hasContract = localStorage.getItem('SG_GUILD_CONTRACT');
        if (hasContract === null) {
            setTimeout(() => setShowCookie(true), 1500);
        }
    }, []);

    const handleCookieAccept = () => {
        localStorage.setItem('SG_GUILD_CONTRACT', 'true');
        setShowCookie(false);
    };

    const handleCookieDecline = () => {
        localStorage.setItem('SG_GUILD_CONTRACT', 'false');
        setShowCookie(false);
    };

    const handleLoaded = () => {
        setStage('intro');
        sfx.playRandomBGM(); 
        sfx.play('wind', 0.2, true);
        
        setTimeout(() => {
            setStage('idle');
            if (onSceneReadyRef.current) onSceneReadyRef.current();
        }, 4000); 
    };

    useEffect(() => {
        if (startTransition && stage === 'idle') {
            performEntrySequence();
        }
    }, [startTransition, stage]);

    // === CINEMATIC TIMELINE ===
    const performEntrySequence = () => {
        sfx.init(); 
        setStage('drop');
        sfx.play('wind', 0.8); 
        
        setTimeout(() => { setStage('crouch'); sfx.play('drop', 0.6); setShake(4.0); }, 1500);
        setTimeout(() => { setStage('stand'); setShake(0); }, 2500);
        setTimeout(() => { setStage('confusion'); }, 3500);
        setTimeout(() => { setStage('walk1'); sfx.play('step', 0.5, true); }, 5500);
        setTimeout(() => { setStage('breath'); sfx.stop('step'); sfx.play('heartbeat', 0.6); }, 8500);
        setTimeout(() => { setStage('walk2'); sfx.stop('heartbeat'); sfx.play('step', 0.5, true); }, 11500);
        
        setTimeout(() => { 
            setStage('push'); 
            sfx.stop('step'); 
            sfx.play('grind', 0.8); 
            sfx.play('boom', 0.7); 
            setShake(1.0); 
        }, 14500);

        setTimeout(() => {
            setStage('suction'); 
            sfx.play('suction', 0.8);
            sfx.play('scream', 0.6);
            setShake(10.0); 
            
            setTimeout(() => setWhiteout(true), 800); 
        }, 16000);

        setTimeout(() => { sfx.stopAll(200); onComplete(); }, 18500);
    };

    return (
        <div className="fixed inset-0 z-0 bg-black pointer-events-none">
            <AnimatePresence>
                {showCookie && <GuildCookieNotice onAccept={handleCookieAccept} onDecline={handleCookieDecline} />}
            </AnimatePresence>

            <AnimatePresence>
                {!isLoaded && (
                    <div className="absolute inset-0 z-[200] pointer-events-auto">
                        <PortalLoadingScreen progress={progress} />
                    </div>
                )}
            </AnimatePresence>

            <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: false, powerPreference: "high-performance" }}>
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 60, 60]} fov={60} />
                    <CameraShake maxYaw={0.05} maxPitch={0.05} maxRoll={0.05} yawFrequency={shake} pitchFrequency={shake} rollFrequency={shake} intensity={shake} />
                    {isLoaded && <SceneContent stage={stage} />}
                </Suspense>
            </Canvas>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={whiteout ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 2.0, ease: "easeInOut" }} 
                className="absolute inset-0 bg-white z-[10000]"
            />
        </div>
    );
}