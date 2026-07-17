import { Object3DNode } from '@react-three/fiber';
import { ShaderMaterial } from 'three';

declare module '@react-three/fiber' {
  interface ThreeElements {
    grassMaterial: Object3DNode<ShaderMaterial, typeof ShaderMaterial>;
    manaBarrierMaterial: Object3DNode<ShaderMaterial, typeof ShaderMaterial>;
    ancientStoneMaterial: Object3DNode<ShaderMaterial, typeof ShaderMaterial>;
    holyFireMaterial: Object3DNode<ShaderMaterial, typeof ShaderMaterial>;
    divineCoreShader: Object3DNode<ShaderMaterial, typeof ShaderMaterial>;
    rainShader: Object3DNode<ShaderMaterial, typeof ShaderMaterial>;
  }
}