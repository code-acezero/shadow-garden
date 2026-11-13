const fs = require('fs');
const crypto = require('crypto');

const targetFile = 'public/experiments/floating-island.html';
const mirrorFile = '3d assets/Floating Island – Shrine Gate to Mana Portal.html';

let html = fs.readFileSync(targetFile, 'utf8');

// 1. Add dioramaGrassTex variable and capture it in buildDiorama
if (!html.includes('let dioramaGrassTex = null;')) {
  html = html.replace('let dioramaRoot = null;', 'let dioramaRoot = null;\n    let dioramaGrassTex = null;');
}

const buildDioramaSnippet = `      const S = 22000;
      model.scale.set(S, S, S);
      
      // Capture diorama's native seamless grass texture for tile-free terrain
      const pDisc1Orig = model.getObjectByName('pDisc1_Grass_0');
      if (pDisc1Orig && pDisc1Orig.material && pDisc1Orig.material.map) {
        dioramaGrassTex = pDisc1Orig.material.map.clone();
        dioramaGrassTex.wrapS = dioramaGrassTex.wrapT = THREE.RepeatWrapping;
        dioramaGrassTex.needsUpdate = true;
      }
      // Also attempt high-res emerald texture if available
      new THREE.TextureLoader().load('/models/tex0_emerald.png', (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.encoding = THREE.sRGBEncoding;
        dioramaGrassTex = tex;
        syncTerrainMaterials();
      }, undefined, () => {
        new THREE.TextureLoader().load('tex0_emerald.png', (tex) => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.encoding = THREE.sRGBEncoding;
          dioramaGrassTex = tex;
          syncTerrainMaterials();
        });
      });`;

const oldScaleSnippet = `      const S = 22000;
      model.scale.set(S, S, S);`;

if (html.includes(oldScaleSnippet) && !html.includes("Capture diorama's native seamless grass texture")) {
  html = html.replace(oldScaleSnippet, buildDioramaSnippet);
  console.log('1. Added dioramaGrassTex capture in buildDiorama');
}

// 2. Update syncTerrainMaterials with dioramaGrassTex and natural road shader matching main island
const oldSyncTerrainRe = /    function syncTerrainMaterials\(\)[\s\S]*?function setup\(root\) \{/;

const newSyncTerrainCode = `    // Master Terrain Material & Road Generator: Seamless, Tile-Free, Emerald Moss with Natural Shrine Road
    function syncTerrainMaterials() {
      const baseTex = dioramaGrassTex || (tierraMat && tierraMat.map ? tierraMat.map.clone() : null);
      if (baseTex) baseTex.wrapS = baseTex.wrapT = THREE.RepeatWrapping;

      const createSmoothTerrainMat = (isTopIsland) => {
        const mat = new THREE.MeshStandardMaterial({
          map: baseTex,
          color: new THREE.Color(0.72, 0.95, 0.38),
          roughness: 0.92,
          metalness: 0.02
        });

        mat.onBeforeCompile = (shader) => {
          shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            \`#include <common>
            varying vec3 vTerrainWorldPos;
            \`
          );
          shader.vertexShader = shader.vertexShader.replace(
            '#include <worldpos_vertex>',
            \`#include <worldpos_vertex>
            vTerrainWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
            \`
          );

          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            \`#include <common>
            varying vec3 vTerrainWorldPos;

            float distToSeg(vec2 p, vec2 a, vec2 b) {
              vec2 pa = p - a, ba = b - a;
              float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
              return length(pa - ba * h);
            }
            \`
          );

          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            \`#ifdef USE_MAP
              // Seamless dual-frequency sampling: completely eliminates checkerboards and block seams
              vec2 uv1 = vTerrainWorldPos.xz * 0.00030;
              vec2 uv2 = vec2(vTerrainWorldPos.z, -vTerrainWorldPos.x) * 0.00078 + vec2(0.41, 0.63);
              vec4 samp1 = texture2D(map, uv1);
              vec4 samp2 = texture2D(map, uv2);

              float blendNoise = sin(vTerrainWorldPos.x * 0.0009) * cos(vTerrainWorldPos.z * 0.0009) * 0.5 + 0.5;
              vec4 sampledDiffuseColor = mix(samp1, samp2, blendNoise);

              \${isTopIsland ? \`
              // Natural trodden earth road matching main island shrine entrance path
              vec2 p0 = vec2(-12500.0, 850.0);
              vec2 p1 = vec2(-8200.0, 700.0);
              vec2 p2 = vec2(-3500.0, 381.25);
              float dRoad = min(distToSeg(vTerrainWorldPos.xz, p0, p1), distToSeg(vTerrainWorldPos.xz, p1, p2));

              // Wide, soft natural earth road (matching main island width ~700)
              float roadFactor = 1.0 - smoothstep(160.0, 380.0, dRoad);
              if (roadFactor > 0.001) {
                // Earth-trodden path tone matching main island
                float grain = fract(sin(dot(vTerrainWorldPos.xz, vec2(12.9898, 78.233))) * 43758.5453);
                vec3 troddenEarth = sampledDiffuseColor.rgb * vec3(0.78, 0.74, 0.62) + vec3(0.04, 0.035, 0.025);
                troddenEarth *= (0.94 + 0.12 * grain);
                
                float centerWear = 1.0 - smoothstep(0.0, 180.0, dRoad);
                vec3 centerPath = sampledDiffuseColor.rgb * vec3(0.68, 0.62, 0.50) + vec3(0.06, 0.05, 0.035);
                troddenEarth = mix(troddenEarth, centerPath, centerWear * 0.5);

                sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, troddenEarth, roadFactor * 0.82);
              }
              \` : ''}

              diffuseColor *= sampledDiffuseColor;
            #endif
            \`
          );
        };

        return mat;
      };

      if (dioramaRoot) {
        const p1 = dioramaRoot.getObjectByName('pDisc1_Grass_0');
        const p2 = dioramaRoot.getObjectByName('pasted__pDisc1_Grass_0');
        if (p1) { p1.material = createSmoothTerrainMat(true); p1.material.needsUpdate = true; }
        if (p2) { p2.material = createSmoothTerrainMat(false); p2.material.needsUpdate = true; }
      }

      // Sync portal stone platform and stairs with ground material
      if (islandRoot) {
        islandRoot.traverse(o => {
          if (!o.isMesh) return;
          const n = o.name;
          if (n.startsWith('Icosphere_3') || (n.startsWith('Cube00') && n.endsWith('_0'))) {
            if (tierraMat) {
              o.material = tierraMat.clone();
              o.material.roughness = 0.92;
              o.material.needsUpdate = true;
            }
          }
        });
      }
    }

function setup(root) {`;

if (oldSyncTerrainRe.test(html)) {
  html = html.replace(oldSyncTerrainRe, newSyncTerrainCode);
  console.log('2. Replaced syncTerrainMaterials with dioramaGrassTex and natural road shader');
} else {
  console.warn('2. Warning: oldSyncTerrainRe not matched');
}

// 3. In setup(root): Update lajas to Purple Gems and Plane 08 to Purple Grass Flowers
const oldSetupColors = `        // Grass blades & tufts (992 planes): converts cyan [47, 102, 139] to lush twilight emerald
        if (n.startsWith('Plane')) {
          m.color.setRGB(0.70, 0.96, 0.30);
          m.roughness = 0.88;
        }
        // Tall reeds along walkway (129 meshes): converts cyan [42, 76, 116] to natural moonlit sage
        else if (n.startsWith('coladezorro')) {
          m.color.setRGB(0.72, 0.95, 0.32);
          m.roughness = 0.85;
        }
        // Main island terrain ground: deep moss loam
        else if (n.includes('tierra')) {
          m.color.setRGB(0.75, 0.95, 0.32);
          m.roughness = 0.92;
          tierraMat = m;
        }
        // Grand Torii Gate: dignified sacred stone grey, completely eliminating pink tint
        else if (n.includes('portal_Material')) {
          m.color.setRGB(0.68, 0.70, 0.70);
          m.roughness = 0.88;
        }
        // Hanging stone lanterns & pagodas: neutral weathered stone grey
        else if (n.startsWith('colgante')) {
          m.color.setRGB(0.74, 0.76, 0.75);
          m.roughness = 0.90;
        }
        // Stone ruins & stone houses: neutral weathered stone granite
        else if (n.startsWith('RetopoGroup') || n.startsWith('techoaljibe') || n.startsWith('lajas')) {
          m.color.setRGB(0.74, 0.76, 0.76);
          m.roughness = 0.92;
        }`;

const newSetupColors = `        // Main island meadow flowers (260 meshes): vibrant purple matching cherry tree
        if (n.startsWith('Plane') && n.includes('08_-_Default_0')) {
          m.color = new THREE.Color(0xd86bf4);
          m.emissive = new THREE.Color(0x581c87);
          m.emissiveIntensity = 0.45;
          m.side = THREE.DoubleSide;
        }
        // Grass blades & tufts (732 meshes): lush twilight emerald
        else if (n.startsWith('Plane')) {
          m.color.setRGB(0.70, 0.96, 0.30);
          m.roughness = 0.88;
        }
        // Sakura tree blossoms & falling petals: radiant cherry blossom purple
        else if (n.startsWith('sakuraplano') || n.startsWith('petalo')) {
          m.color = new THREE.Color(0xd86bf4);
          m.emissive = new THREE.Color(0x581c87);
          m.emissiveIntensity = 0.45;
          m.side = THREE.DoubleSide;
        }
        // Tall reeds along walkway (129 meshes): natural moonlit sage
        else if (n.startsWith('coladezorro')) {
          m.color.setRGB(0.72, 0.95, 0.32);
          m.roughness = 0.85;
        }
        // Main island terrain ground: deep moss loam
        else if (n.includes('tierra')) {
          m.color.setRGB(0.75, 0.95, 0.32);
          m.roughness = 0.92;
          tierraMat = m;
        }
        // Sacred stones around the shrine pillars: radiant glowing purple amethyst gems!
        else if (n.startsWith('lajas')) {
          m.color = new THREE.Color(0x9333ea);
          m.emissive = new THREE.Color(0x7e22ce);
          m.emissiveIntensity = 0.55;
          m.roughness = 0.28;
          m.metalness = 0.12;
          m.side = THREE.DoubleSide;
        }
        // Grand Torii Gate: dignified sacred stone grey, completely eliminating pink tint
        else if (n.includes('portal_Material')) {
          m.color.setRGB(0.68, 0.70, 0.70);
          m.roughness = 0.88;
        }
        // Hanging stone lanterns & pagodas: neutral weathered stone grey
        else if (n.startsWith('colgante')) {
          m.color.setRGB(0.74, 0.76, 0.75);
          m.roughness = 0.90;
        }
        // Stone ruins & stone houses: neutral weathered stone granite
        else if (n.startsWith('RetopoGroup') || n.startsWith('techoaljibe')) {
          m.color.setRGB(0.74, 0.76, 0.76);
          m.roughness = 0.92;
        }`;

if (html.includes(oldSetupColors)) {
  html = html.replace(oldSetupColors, newSetupColors);
  console.log('3. Replaced setup() colors: purple gems and purple main island flowers');
} else {
  console.warn('3. Warning: oldSetupColors not matched');
}

// 4. In populateDioramaFoliage: tune flowers scale to 85 + rnd() * 45, grass scale to 95 + rnd() * 35, omit giant cyan reeds
const oldFoliageBuild = `      // 1. Grass InstancedMesh
      const grassInst = new THREE.InstancedMesh(srcGrass.geometry, srcGrass.material, grassPts.length);
      grassInst.name = 'dioramaFoliageGrass';
      for (let i = 0; i < grassPts.length; i++) {
        const p = grassPts[i];
        dummy.position.set(p.x, p.y + 110, p.z);
        dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
        const s = 140 + rnd() * 60;
        dummy.scale.set(s, s * (0.9 + rnd() * 0.25), s);
        dummy.updateMatrix();
        grassInst.setMatrixAt(i, dummy.matrix);
      }
      grassInst.instanceMatrix.needsUpdate = true;
      scene.add(grassInst);
      dioramaFoliageGrass = grassInst;

      // 2. Reeds InstancedMesh
      const reedInst = new THREE.InstancedMesh(srcReed.geometry, srcReed.material, reedPts.length);
      reedInst.name = 'dioramaFoliageReeds';
      for (let i = 0; i < reedPts.length; i++) {
        const p = reedPts[i];
        dummy.position.set(p.x, p.y + 160, p.z);
        dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
        const s = 280 + rnd() * 100;
        dummy.scale.set(s, s * 0.82, s);
        dummy.updateMatrix();
        reedInst.setMatrixAt(i, dummy.matrix);
      }
      reedInst.instanceMatrix.needsUpdate = true;
      scene.add(reedInst);
      dioramaFoliageReeds = reedInst;`;

const newFoliageBuild = `      // 1. Grass InstancedMesh: lush, soft meadow blades
      const grassMat = srcGrass.material.clone();
      grassMat.color = new THREE.Color(0x70f54c);
      const grassInst = new THREE.InstancedMesh(srcGrass.geometry, grassMat, grassPts.length);
      grassInst.name = 'dioramaFoliageGrass';
      for (let i = 0; i < grassPts.length; i++) {
        const p = grassPts[i];
        dummy.position.set(p.x, p.y + 70, p.z);
        dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
        const s = 95 + rnd() * 35;
        dummy.scale.set(s, s * (0.85 + rnd() * 0.20), s);
        dummy.updateMatrix();
        grassInst.setMatrixAt(i, dummy.matrix);
      }
      grassInst.instanceMatrix.needsUpdate = true;
      scene.add(grassInst);
      dioramaFoliageGrass = grassInst;`;

if (html.includes(oldFoliageBuild)) {
  html = html.replace(oldFoliageBuild, newFoliageBuild);
  console.log('4a. Updated grass scale and omitted giant cyan reeds');
} else {
  console.warn('4a. Warning: oldFoliageBuild not matched');
}

const oldFlowerScale = 'const s = 0.20 + rnd() * 0.14;';
const newFlowerScale = 'const s = 85 + rnd() * 45;';
if (html.includes(oldFlowerScale)) {
  html = html.replace(oldFlowerScale, newFlowerScale);
  console.log('4b. Updated flower scale to 85 + rnd() * 45');
} else {
  console.warn('4b. Warning: oldFlowerScale not matched');
}

// Write to public/experiments/floating-island.html
fs.writeFileSync(targetFile, html, 'utf8');
console.log('Successfully wrote', targetFile);

// Mirror byte-for-byte to 3d assets/
fs.writeFileSync(mirrorFile, html, 'utf8');
console.log('Successfully mirrored to', mirrorFile);

// Verify SHA256 hashes
const h1 = crypto.createHash('sha256').update(fs.readFileSync(targetFile)).digest('hex');
const h2 = crypto.createHash('sha256').update(fs.readFileSync(mirrorFile)).digest('hex');
console.log('SHA256 target:', h1);
console.log('SHA256 mirror:', h2);
if (h1 === h2) {
  console.log('✓ Invariant verified: Files are 100% byte-for-byte SHA256 identical');
} else {
  console.error('✗ ERROR: SHA256 mismatch!');
  process.exit(1);
}

