// src/components/Portal/ModelInspector.tsx
import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

export default function ModelInspector() {
  // Load all 3 models to inspect them
  const boy = useGLTF('/3d/boy/source/Anime Boy.glb');
  const girl = useGLTF('/3d/girl/source/anime+girl+3d+model.glb');
  const door = useGLTF('/3d/door/source/door.glb');

  useEffect(() => {
    console.log("========== [INSPECTOR REPORT] ==========");
    
    // 1. BOY MODEL DATA
    console.log("--- BOY MODEL ---");
    // @ts-ignore
    console.log("Animation Clips:", boy.animations.map(a => a.name));
    console.log("Object/Bone Names:", Object.keys(boy.nodes));

    // 2. GIRL MODEL DATA
    console.log("--- GIRL MODEL ---");
    // @ts-ignore
    console.log("Animation Clips:", girl.animations.map(a => a.name));
    console.log("Object/Bone Names:", Object.keys(girl.nodes));

    // 3. DOOR MODEL DATA
    console.log("--- DOOR MODEL ---");
    // @ts-ignore
    console.log("Animation Clips:", door.animations.map(a => a.name));
    console.log("Nodes (Look for 'Chair', 'Door_L', 'Door_R'):", Object.keys(door.nodes));
    
    console.log("========================================");
  }, [boy, girl, door]);

  return null; // Renders nothing, just logs
}