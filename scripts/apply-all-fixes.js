const fs = require('fs');
const crypto = require('crypto');

const file1 = 'public/experiments/floating-island.html';
const file2 = '3d assets/Floating Island \u2013 Shrine Gate to Mana Portal.html';

let code = fs.readFileSync(file1, 'utf8');

// 1. Module-level variable for tierraMat
if (!code.includes('let tierraMat = null;')) {
  code = code.replace(
    'let dioramaRoot = null, dioramaFoliageGrass = null, dioramaFoliageReeds = null, dioramaFoliageFlowers = null;',
    'let dioramaRoot = null, dioramaFoliageGrass = null, dioramaFoliageReeds = null, dioramaFoliageFlowers = null, tierraMat = null;'
  );
}

// 2. In frame(d), update wind time on flower shader
if (!code.includes('uWindTime')) {
  code = code.replace(
    'if (dioramaFlameLight) {',
    `// Wind movement for diorama flowers
      if (dioramaFoliageFlowers && dioramaFoliageFlowers.material.userData && dioramaFoliageFlowers.material.userData.shader) {
        dioramaFoliageFlowers.material.userData.shader.uniforms.uWindTime.value = ts;
      }
      if (dioramaFlameLight) {`
  );
}

// 3. In populateDioramaFoliage, add complete obstacle & water exclusion and wind shader
const oldPopulateSearch = `    function populateDioramaFoliage(dioModel, mainIsland) {`;
const oldPopulateEndSearch = `      dioramaFoliageFlowers = flowerInst;\n    }`;

const oldPopulateIndex = code.indexOf(oldPopulateSearch);
const oldPopulateEndIndex = code.indexOf(oldPopulateEndSearch);

if (oldPopulateIndex === -1 || oldPopulateEndIndex === -1) {
  console.error('Could not find populateDioramaFoliage bounds');
  process.exit(1);
}

const newPopulateFunc = `    function populateDioramaFoliage(dioModel, mainIsland) {
      if (!dioModel || !mainIsland) return;
      if (dioramaFoliageGrass) { scene.remove(dioramaFoliageGrass); dioramaFoliageGrass = null; }
      if (dioramaFoliageReeds) { scene.remove(dioramaFoliageReeds); dioramaFoliageReeds = null; }
      if (dioramaFoliageFlowers) { scene.remove(dioramaFoliageFlowers); dioramaFoliageFlowers = null; }

      let srcGrass = null, srcReed = null, sakura = null;
      mainIsland.traverse(o => {
        if (!o.isMesh) return;
        if (!srcGrass && o.name === 'Plane115_03_-_Default_0') srcGrass = o;
        if (!srcReed && o.name === 'coladezorro012_Material_#6_0') srcReed = o;
        if (!sakura && o.name === 'sakuraplano005_12_-_Default_0') sakura = o;
      });

      if (!srcGrass || !srcReed || !sakura) return;

      const topDisc = dioModel.getObjectByName('pDisc1_Grass_0');
      const lowerDisc = dioModel.getObjectByName('pasted__pDisc1_Grass_0');
      if (!topDisc || !lowerDisc) return;

      const topRaycaster = new THREE.Raycaster();
      const lowerRaycaster = new THREE.Raycaster();
      const down = new THREE.Vector3(0, -1, 0);

      const findGround = (x, z, island) => {
        const ray = island === 'top' ? topRaycaster : lowerRaycaster;
        const target = island === 'top' ? topDisc : lowerDisc;
        const originY = island === 'top' ? 2000 : -4000;
        ray.set(new THREE.Vector3(x, originY, z), down);
        ray.near = 0.1;
        ray.far = 10000;
        const hits = ray.intersectObject(target, false);
        return (hits && hits.length > 0) ? hits[0].point.y : null;
      };

      const distToSegment = (px, pz, x1, z1, x2, z2) => {
        const dx = x2 - x1, dz = z2 - z1;
        const lenSq = dx * dx + dz * dz;
        if (lenSq === 0) return Math.hypot(px - x1, pz - z1);
        let t = ((px - x1) * dx + (pz - z1) * dz) / lenSq;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz));
      };

      // Strict Exclusion Zones: completely prevent flowers/foliage from clipping into water and architectures
      const exclusionZones = [];
      const pondMesh = dioModel.getObjectByName('pDisc5_Water_0');
      if (pondMesh) {
        const b = new THREE.Box3().setFromObject(pondMesh);
        exclusionZones.push({ minX: b.min.x - 140, maxX: b.max.x + 140, minZ: b.min.z - 140, maxZ: b.max.z + 140 });
      }
      const wfMesh = dioModel.getObjectByName('pDisc5_Waterfall_0');
      if (wfMesh) {
        const b = new THREE.Box3().setFromObject(wfMesh);
        exclusionZones.push({ minX: b.min.x - 160, maxX: b.max.x + 160, minZ: b.min.z - 160, maxZ: b.max.z + 160 });
      }
      const pondCenter = { x: -28909, z: 985, r: 2400 };

      // Architecture, rocks, trees, shrine, chest, bridge posts and stepping stones
      dioModel.traverse(o => {
        if (!o.isMesh) return;
        const n = o.name;
        if (
          n.includes('Rock') || n.includes('Sphere') || n.includes('Cylinder') ||
          n.includes('Chest') || n.includes('Tree') || n.includes('polySurface7') ||
          n.includes('Fire') || n.includes('Wood') || n.includes('Bridge') ||
          n.includes('Stepping') || n.includes('lambert13') || n.includes('lambert14') ||
          n.includes('lambert15')
        ) {
          const b = new THREE.Box3().setFromObject(o);
          if (b.max.y > -7200) {
            exclusionZones.push({
              minX: b.min.x - 90, maxX: b.max.x + 90,
              minZ: b.min.z - 90, maxZ: b.max.z + 90
            });
          }
        }
      });

      const isClear = (x, z, island) => {
        if (island === 'lower') {
          if (Math.hypot(x - pondCenter.x, z - pondCenter.z) < pondCenter.r) return false;
        }
        for (let k = 0; k < exclusionZones.length; k++) {
          const zZone = exclusionZones[k];
          if (x >= zZone.minX && x <= zZone.maxX && z >= zZone.minZ && z <= zZone.maxZ) {
            return false;
          }
        }
        return true;
      };

      let seed = 91823;
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

      const grassPts = [], reedPts = [], flowerPts = [];

      // Top Island foliage distribution (X: -12500 to -3500)
      for (let i = 0; i < 280; i++) {
        const x = -12500 + rnd() * 8800;
        const z = -1400 + rnd() * 3200;
        const dPath = distToSegment(x, z, -12500, 850, -3500, 381);
        if (dPath < 120) continue;
        if (!isClear(x, z, 'top')) continue;
        const y = findGround(x, z, 'top');
        if (y !== null) {
          grassPts.push({ x, y, z });
          if (dPath > 240 && i % 2 === 0) reedPts.push({ x, y, z });
          if (dPath > 180 && i % 3 === 0) flowerPts.push({ x, y, z });
        }
      }

      // Shrine surround foliage (framing both sides of shrine stairs, avoiding shrine collision box)
      const shrineFlanks = [
        { cx: -6750, cz: 4050, r: 280 },
        { cx: -5550, cz: 3100, r: 280 }
      ];
      for (const flank of shrineFlanks) {
        for (let j = 0; j < 12; j++) {
          const fx = flank.cx + (rnd() - 0.5) * flank.r * 2;
          const fz = flank.cz + (rnd() - 0.5) * flank.r * 2;
          if (!isClear(fx, fz, 'top')) continue;
          const fy = findGround(fx, fz, 'top');
          if (fy !== null) {
            grassPts.push({ x: fx, y: fy, z: fz });
            if (j % 2 === 0) reedPts.push({ x: fx, y: fy, z: fz });
            if (j % 3 === 0) flowerPts.push({ x: fx, y: fy, z: fz });
          }
        }
      }

      // Lower Island foliage distribution (X: -31000 to -25500)
      for (let i = 0; i < 220; i++) {
        const x = -31000 + rnd() * 5500;
        const z = 100 + rnd() * 2800;
        const dPath = distToSegment(x, z, -28400, 1431, -25500, 1691);
        if (dPath < 140) continue;
        if (!isClear(x, z, 'lower')) continue;
        const y = findGround(x, z, 'lower');
        if (y !== null && y > -5910) {
          grassPts.push({ x, y, z });
          if (dPath > 320 && i % 2 === 0) reedPts.push({ x, y, z });
          if (dPath > 220 && i % 3 === 0) flowerPts.push({ x, y, z });
        }
      }

      const dummy = new THREE.Object3D();

      // 1. Grass InstancedMesh
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
      dioramaFoliageReeds = reedInst;

      // 3. Flowers InstancedMesh with GPU Wind Movement
      const flowerMat = sakura.material.clone();
      flowerMat.color.setRGB(0.95, 0.90, 1.0);
      flowerMat.alphaTest = 0.5;
      flowerMat.side = THREE.DoubleSide;

      flowerMat.onBeforeCompile = (shader) => {
        shader.uniforms.uWindTime = { value: 0 };
        flowerMat.userData.shader = shader;
        shader.vertexShader = 'uniform float uWindTime;\\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          \`#include <begin_vertex>
          // Dynamic mountain wind flutter
          float flowerH = max(0.0, position.y);
          float instId = float(gl_InstanceID) * 0.173;
          float wX = sin(uWindTime * 2.2 + instId) * 1.6 + sin(uWindTime * 4.4 + instId * 2.1) * 0.6;
          float wZ = cos(uWindTime * 1.8 + instId * 1.4) * 1.3;
          float wY = sin(uWindTime * 3.2 + instId) * 0.3;
          transformed.x += wX * (0.35 + 0.65 * sin(uWindTime * 0.85 + instId));
          transformed.z += wZ * (0.35 + 0.65 * cos(uWindTime * 0.75 + instId));
          transformed.y += wY;
          \`
        );
      };

      const flowerInst = new THREE.InstancedMesh(sakura.geometry, flowerMat, flowerPts.length);
      flowerInst.name = 'dioramaFoliageFlowers';
      for (let i = 0; i < flowerPts.length; i++) {
        const p = flowerPts[i];
        dummy.position.set(p.x, p.y + 45, p.z);
        dummy.rotation.set((rnd() - 0.5) * 0.2, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.2);
        const s = 0.18 + rnd() * 0.12;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        flowerInst.setMatrixAt(i, dummy.matrix);
      }
      flowerInst.instanceMatrix.needsUpdate = true;
      scene.add(flowerInst);
      dioramaFoliageFlowers = flowerInst;
    }`;

code = code.slice(0, oldPopulateIndex) + newPopulateFunc + code.slice(oldPopulateEndIndex + oldPopulateEndSearch.length);

// 4. In buildDiorama:
// - Copy main island ground/soil visual looks and color onto pDisc1_Grass_0 and pasted__pDisc1_Grass_0
// - Fix stone architecture pink color for polySurface7 (isAltar) to neutral weathered granite/limestone
const oldBuildDioramaMatSearch = `        if (mName === 'Water' || (n.includes('Water') && !n.includes('Waterfall'))) {`;
const newBuildDioramaMatInsert = `        // Copy main island ground/soil visual looks and color to diorama lands
        if (n === 'pDisc1_Grass_0' || n === 'pasted__pDisc1_Grass_0') {
          if (tierraMat) {
            const gm = tierraMat.clone();
            if (gm.map) {
              gm.map = gm.map.clone();
              gm.map.wrapS = gm.map.wrapT = THREE.RepeatWrapping;
              gm.map.repeat.set(3.5, 3.5);
              gm.map.needsUpdate = true;
            }
            o.material = gm;
          } else {
            o.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(0.75, 0.95, 0.32),
              roughness: 0.92,
              metalness: 0
            });
          }
          o.material.needsUpdate = true;
          return;
        }

        if (mName === 'Water' || (n.includes('Water') && !n.includes('Waterfall'))) {`;

code = code.replace(oldBuildDioramaMatSearch, newBuildDioramaMatInsert);

// Fix isAltar color: change 0xf4eee6 to 0xc8d4ce (cool neutral weathered granite, zero pink tint)
code = code.replace(
  'isAltar ? 0xf4eee6 :',
  'isAltar ? 0xc8d4ce : // neutral weathered stone granite/limestone, zero pink tint'
);

// 5. In setup(root):
// - Fix stone architecture pink color (Torii gate portal_Material, RetopoGroup, lajas, techoaljibe, colgante)
// - Make portal stone platform and stairs match main island ground exactly!
const oldSetupStoneSearch = `        // Main island terrain ground: converts cyan [35, 68, 106] to deep moss loam
        else if (n.includes('tierra')) {
          m.color.setRGB(0.75, 0.95, 0.32);
          m.roughness = 0.92;
        }
        // Grand Torii Gate: converts cold steel blue to warm sacred cedar/cypress shrine timber
        else if (n.includes('portal_Material')) {
          m.color.setRGB(0.85, 0.65, 0.55);
          m.roughness = 0.88;
        }
        // Hanging stone lanterns & pagodas
        else if (n.startsWith('colgante')) {
          m.color.setRGB(0.80, 0.78, 0.70);
          m.roughness = 0.90;
        }
        // Stone ruins & stone houses
        else if (n.startsWith('RetopoGroup') || n.startsWith('techoaljibe') || n.startsWith('lajas')) {
          m.color.setRGB(0.78, 0.76, 0.72);
          m.roughness = 0.92;
        }`;

const newSetupStoneReplace = `        // Main island terrain ground: deep moss loam
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

code = code.replace(oldSetupStoneSearch, newSetupStoneReplace);

// Portal platform and stairs: make stone/platform color exactly same as main island ground
const oldPlatformSearch = `        if (isPlatformOrStairs) {
          // Unified deep twilight bedrock/slate matching main island and newland
          o.material.color.setRGB(0.08, 0.12, 0.16);
          o.material.roughness = 0.85;
          o.material.metalness = 0.05;
        }`;

const newPlatformReplace = `        if (isPlatformOrStairs) {
          // Exact same color and material as main island ground
          if (tierraMat) {
            o.material = tierraMat.clone();
          } else {
            o.material.color.setRGB(0.75, 0.95, 0.32);
            o.material.roughness = 0.92;
            o.material.metalness = 0;
          }
          o.material.needsUpdate = true;
        }`;

code = code.replace(oldPlatformSearch, newPlatformReplace);

fs.writeFileSync(file1, code, 'utf8');
fs.writeFileSync(file2, code, 'utf8');

const h1 = crypto.createHash('sha256').update(fs.readFileSync(file1)).digest('hex');
const h2 = crypto.createHash('sha256').update(fs.readFileSync(file2)).digest('hex');

console.log('Fixed applied successfully!');
console.log('SHA256 file 1:', h1);
console.log('SHA256 file 2:', h2);
console.log('Files match identical:', h1 === h2);
