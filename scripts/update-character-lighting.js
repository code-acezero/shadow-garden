const fs = require('fs');

const filePath = 'public/experiments/seraphina-engine.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Expose window.THREE = THREE
if (!content.includes('window.THREE = THREE;')) {
  content = content.replace(
    "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';",
    "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';\nwindow.THREE = THREE;"
  );
}

// 2. Set model rotation to Math.PI in init(gltf)
if (!content.includes('this.model.rotation.y = Math.PI;')) {
  content = content.replace(
    'this.model.position.set(0, 0, 0);',
    'this.model.position.set(0, 0, 0);\n    this.model.rotation.y = Math.PI; // Face front (+Z towards camera)'
  );
}

// 3. Update lighting
const oldLightingRegex = /\/\/ 3\. High-Fidelity Anime Studio Chiaroscuro Lighting[\s\S]*?topLight\.target = headTarget;[\s\S]*?scene\.add\(topLight\);/;

const newLightingCode = `// 3. High-Fidelity Anime Studio Chiaroscuro Lighting (Facial Sculpting & Deep Contrast)
  const headTarget = new THREE.Object3D();
  headTarget.position.set(0, 1.35, 0);
  scene.add(headTarget);

  // Soft Twilight Lavender Sky & Warm Rose-Umber Ground for natural, healthy anime ambient occlusion
  const hemiLight = new THREE.HemisphereLight(0x56486c, 0x38222a, 0.85);
  scene.add(hemiLight);

  // Key Portrait Directional Light: 28° rake angle, sculpts nose bridge, cheekbones and jawline
  const keyLight = new THREE.DirectionalLight(0xfff8f2, 1.30);
  keyLight.position.set(0.85, 1.68, 1.60);
  keyLight.target = headTarget;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.2;
  keyLight.shadow.camera.far = 4.5;
  keyLight.shadow.camera.left = -0.85;
  keyLight.shadow.camera.right = 0.85;
  keyLight.shadow.camera.top = 2.0;
  keyLight.shadow.camera.bottom = 0.4;
  keyLight.shadow.bias = -0.00010;
  keyLight.shadow.normalBias = 0.008;
  keyLight.shadow.radius = 2.2;
  scene.add(keyLight);

  // Soft Fill Light: Warm rose-peach undertone on opposite side, keeping shadows lively & soft
  const fillLight = new THREE.DirectionalLight(0xffd1dc, 0.48);
  fillLight.position.set(-1.10, 1.35, 1.45);
  fillLight.target = headTarget;
  scene.add(fillLight);

  // Rim Silhouette Light: Crisp violet-silver edge accent separating hair strands, cat ears and cloak
  const rimLight = new THREE.DirectionalLight(0xe9d5ff, 1.75);
  rimLight.position.set(-1.15, 1.85, -1.8);
  rimLight.target = headTarget;
  scene.add(rimLight);

  // Soft Top Light: Accentuates hair crown volume and ear silhouettes
  const topLight = new THREE.DirectionalLight(0xffeff5, 0.38);
  topLight.position.set(0.1, 2.7, 0.3);
  topLight.target = headTarget;
  scene.add(topLight);`;

if (oldLightingRegex.test(content)) {
  content = content.replace(oldLightingRegex, newLightingCode);
}

// 4. Update camera presets for face and full body
content = content.replace(
  /setRotationPivot\(new THREE\.Vector3\(0, 1\.48, 0\), false, new THREE\.Vector3\(0, 1\.48, 0\.45\)\);/,
  'setRotationPivot(new THREE.Vector3(0, 1.42, 0.08), false, new THREE.Vector3(0, 1.42, 0.72));'
);

content = content.replace(
  /setRotationPivot\(new THREE\.Vector3\(0, 0\.95, 0\), false, new THREE\.Vector3\(0, 1\.25, 2\.5\)\);/,
  'setRotationPivot(new THREE.Vector3(0, 0.95, 0), false, new THREE.Vector3(0, 1.20, 2.4));'
);

// 5. Update material settings
const oldMatRegex = /\/\/ Material Contrast Tuning: High-Fidelity Anime Shading[\s\S]*?o\.material\.needsUpdate = true;\s*\}/;

const newMatCode = `// Material Contrast Tuning: High-Fidelity Anime Shading & Facial Detail Sculpting
        if (o.material) {
          o.material.side = THREE.DoubleSide;
          o.material.alphaTest = 0.45;
          // Strip blinding unlit VRoid export emissiveMap across all meshes
          o.material.emissiveMap = null;

          if (mName.includes('SKIN')) {
            // Porcelain vampire skin: warm ivory tone, velvety matte finish, rich soft shadows
            o.material.color = new THREE.Color(0xfff8f5);
            o.material.roughness = 0.68;
            o.material.metalness = 0.0;
            // Subtle warm peach subsurface warmth (prevents muddy black shadows, reveals skin blush)
            o.material.emissive = new THREE.Color(0x32161c);
            o.material.emissiveIntensity = 0.20;
          } else if (mName.includes('HAIR')) {
            // Pink hair: soft pastel strawberry-rose, distinct contrast against pale porcelain skin
            o.material.color = new THREE.Color(0xffdbe8);
            o.material.roughness = 0.46;
            o.material.metalness = 0.02;
            o.material.emissive = new THREE.Color(0x381022);
            o.material.emissiveIntensity = 0.16;
          } else if (mName.includes('FaceEyelash') || mName.includes('FaceEyeline') || mName.includes('FaceBrow')) {
            // High-contrast, razor-sharp eyeliner, lashes, and brows
            o.material.color = new THREE.Color(0x18050e);
            o.material.roughness = 0.80;
            o.material.metalness = 0.0;
            o.material.emissive = new THREE.Color(0x000000);
            o.material.emissiveIntensity = 0.0;
          } else if (mName.includes('FaceMouth')) {
            // Defined lips and cute vampire fangs
            o.material.color = new THREE.Color(0xffffff);
            o.material.roughness = 0.50;
            o.material.metalness = 0.0;
            o.material.emissive = new THREE.Color(0x280612);
            o.material.emissiveIntensity = 0.14;
          } else if (mName.includes('EyeIris')) {
            // Radiant glowing crimson vampire iris
            o.material.color = new THREE.Color(0xffffff);
            o.material.roughness = 0.12;
            o.material.metalness = 0.0;
            o.material.emissive = new THREE.Color(0x6e081c);
            o.material.emissiveIntensity = 0.90;
          } else if (mName.includes('EyeHighlight') || mName.includes('EyeWhite')) {
            o.material.color = new THREE.Color(0xffffff);
            o.material.roughness = 0.15;
            o.material.metalness = 0.0;
            o.material.emissive = new THREE.Color(0x181818);
            o.material.emissiveIntensity = 0.15;
          } else if (mName.includes('Accessory_CatEar')) {
            o.material.color = new THREE.Color(0xffdbe8);
            o.material.roughness = 0.52;
            o.material.metalness = 0.02;
            o.material.emissive = new THREE.Color(0x2d101a);
            o.material.emissiveIntensity = 0.15;
          } else if (mName.includes('CLOTH') || mName.includes('Tops') || mName.includes('Onepiece')) {
            o.material.roughness = 0.82;
            o.material.metalness = 0.04;
            o.material.emissive = new THREE.Color(0x08040a);
            o.material.emissiveIntensity = 0.08;
          } else if (mName.includes('Shoes')) {
            o.material.roughness = 0.35;
            o.material.metalness = 0.15;
            o.material.emissive = new THREE.Color(0x000000);
            o.material.emissiveIntensity = 0.0;
          }
          o.material.needsUpdate = true;
        }`;

if (oldMatRegex.test(content)) {
  content = content.replace(oldMatRegex, newMatCode);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated seraphina-engine.js');
