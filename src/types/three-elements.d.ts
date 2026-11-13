import type { ThreeElement } from '@react-three/fiber';
import type { ShaderMaterial } from 'three';

type CustomShaderElement = ThreeElement<typeof ShaderMaterial> & Record<string, any>;

declare module '@react-three/fiber' {
  interface ThreeElements {
    grassMaterial: CustomShaderElement;
    manaBarrierMaterial: CustomShaderElement;
    ancientStoneMaterial: CustomShaderElement;
    holyFireMaterial: CustomShaderElement;
    divineCoreShader: CustomShaderElement;
    rainShader: CustomShaderElement;
    tunnelShader: CustomShaderElement;
    portalVortexShader: CustomShaderElement;
    warpShader: CustomShaderElement;
    runeShader: CustomShaderElement;
    magmaShader: CustomShaderElement;
    cloudShader: CustomShaderElement;
  }
}
