const fs = require('fs');

const srcPath = 'public/experiments/floating-island.html';
let code = fs.readFileSync(srcPath, 'utf8');

// 1. Update Lighting (remove blue fill and harsh blue bias)
code = code.replace(
  "scene.add(new THREE.AmbientLight(0xb2a2f8, .62 * PI));",
  "scene.add(new THREE.AmbientLight(0x766c84, .55 * PI));"
);
code = code.replace(
  "scene.add(new THREE.HemisphereLight(0xa492ff, 0x3b2465, .46 * PI));",
  "scene.add(new THREE.HemisphereLight(0x807498, 0x2c2226, .46 * PI));"
);
code = code.replace(
  "const moon = new THREE.DirectionalLight(0xdcd2ff, .65 * PI);",
  "const moon = new THREE.DirectionalLight(0xe6e0f2, .65 * PI);"
);
code = code.replace(
  "const fill = new THREE.DirectionalLight(0x7695ff, .38 * PI);",
  "const fill = new THREE.DirectionalLight(0xb8a8a0, .28 * PI);"
);

// 2. Lower BRIDGE_PROFILE deckY by 50 units (to match targetSurfaceY = -290)
const oldProfileStart = '    const BRIDGE_PROFILE = [';
const oldProfileEnd = '    ];';
const startIdx = code.indexOf(oldProfileStart);
const endIdx = code.indexOf(oldProfileEnd, startIdx) + oldProfileEnd.length;

if (startIdx === -1) {
  console.error('Could not find BRIDGE_PROFILE');
  process.exit(1);
}

const currentBridgeProfileText = code.slice(startIdx + oldProfileStart.length, endIdx - oldProfileEnd.length);
// Parse and lower deckY by 50
const loweredBridgeProfileStr = `    const BRIDGE_PROFILE = [
      { x: -25500, minZ: 1368, maxZ: 2014, centerZ: 1691, deckY: -5540 },
      { x: -25100, minZ: 1279, maxZ: 1994, centerZ: 1637, deckY: -5568 },
      { x: -24700, minZ: 1250, maxZ: 1964, centerZ: 1607, deckY: -5579 },
      { x: -24300, minZ: 1210, maxZ: 1934, centerZ: 1572, deckY: -5578 },
      { x: -23900, minZ: 1174, maxZ: 1906, centerZ: 1540, deckY: -5548 },
      { x: -23500, minZ: 1141, maxZ: 1855, centerZ: 1498, deckY: -5480 },
      { x: -23100, minZ: 1121, maxZ: 1829, centerZ: 1475, deckY: -5406 },
      { x: -22700, minZ: 1101, maxZ: 1805, centerZ: 1453, deckY: -5326 },
      { x: -22300, minZ: 1064, maxZ: 1790, centerZ: 1427, deckY: -5225 },
      { x: -21900, minZ: 1030, maxZ: 1762, centerZ: 1396, deckY: -5109 },
      { x: -21500, minZ: 1008, maxZ: 1723, centerZ: 1366, deckY: -4880 },
      { x: -21100, minZ: 991,  maxZ: 1708, centerZ: 1350, deckY: -4752 },
      { x: -20700, minZ: 983,  maxZ: 1685, centerZ: 1334, deckY: -4506 },
      { x: -20300, minZ: 963,  maxZ: 1675, centerZ: 1319, deckY: -4342 },
      { x: -19900, minZ: 909,  maxZ: 1661, centerZ: 1285, deckY: -4156 },
      { x: -19500, minZ: 899,  maxZ: 1629, centerZ: 1264, deckY: -3874 },
      { x: -19100, minZ: 871,  maxZ: 1573, centerZ: 1222, deckY: -3623 },
      { x: -18700, minZ: 822,  maxZ: 1546, centerZ: 1184, deckY: -3454 },
      { x: -18300, minZ: 789,  maxZ: 1518, centerZ: 1154, deckY: -3241 },
      { x: -17900, minZ: 750,  maxZ: 1486, centerZ: 1118, deckY: -2969 },
      { x: -17500, minZ: 709,  maxZ: 1433, centerZ: 1071, deckY: -2747 },
      { x: -17100, minZ: 702,  maxZ: 1409, centerZ: 1056, deckY: -2569 },
      { x: -16700, minZ: 706,  maxZ: 1410, centerZ: 1058, deckY: -2323 },
      { x: -16300, minZ: 706,  maxZ: 1407, centerZ: 1057, deckY: -2133 },
      { x: -15900, minZ: 707,  maxZ: 1407, centerZ: 1057, deckY: -1843 },
      { x: -15500, minZ: 707,  maxZ: 1414, centerZ: 1061, deckY: -1655 },
      { x: -15100, minZ: 709,  maxZ: 1409, centerZ: 1059, deckY: -1375 },
      { x: -14700, minZ: 710,  maxZ: 1423, centerZ: 1067, deckY: -1188 },
      { x: -14300, minZ: 712,  maxZ: 1416, centerZ: 1064, deckY: -893 },
      { x: -13900, minZ: 717,  maxZ: 1418, centerZ: 1068, deckY: -691 },
      { x: -13500, minZ: 721,  maxZ: 1422, centerZ: 1072, deckY: -413 },
      { x: -13100, minZ: 744,  maxZ: 1399, centerZ: 1072, deckY: -200 }
    ];`;

code = code.slice(0, startIdx) + loweredBridgeProfileStr + code.slice(endIdx);

// 3. Strict Front-Only Portal Breakthrough Trigger
const oldBreakthrough = `        // Breakthrough trigger: only triggers when walking into the front of the portal water wall from the stairs
        if (dAlong <= 40 && dAlong >= -50 && perpOffset < PW.R * 0.95 && suc > 0.35) {
          enterTunnel();
        }`;

const newBreakthrough = `        // Strict Front-Only Breakthrough trigger:
        // ONLY triggers when walking forward into the front of the portal water wall from the stairs!
        // Touching the water wall from behind, left, or right will NOT trigger teleportation.
        const isFrontOfPortal = (toP.x > 0);
        const isForwardIntoWall = (dAlong > -15 && dAlong <= 35 && L.vel.x > 80);
        const isWithinStairsCorridor = (Math.abs(P0.z - PW.c.z) < 280);
        const isWithinPortalRadius = (perpOffset < PW.R * 0.88);
        if (isFrontOfPortal && isForwardIntoWall && isWithinStairsCorridor && isWithinPortalRadius && suc > 0.35) {
          enterTunnel();
        }`;

code = code.replace(oldBreakthrough, newBreakthrough);

// 4. Update buildDiorama: targetSurfaceY = -290 (lowered by 50 units so it tucks under main island without visible overlap)
code = code.replace(
  'const targetSurfaceY = -240;',
  'const targetSurfaceY = -290;'
);

// Waterfall splash base Y lowered by 50
code = code.replace(
  'const fallBase = new THREE.Vector3(-27050, -5690, -999);',
  'const fallBase = new THREE.Vector3(-27050, -5740, -999);'
);

// Waterfall spatial audio pos Y lowered by 50
code = code.replace(
  'const dWater = p.distanceTo(V(-27050, -5690, -999));',
  'const dWater = p.distanceTo(V(-27050, -5740, -999));'
);

// Spawn point Y lowered by 50
code = code.replace(
  'const spawnY = (gLower !== null) ? gLower : -5920;',
  'const spawnY = (gLower !== null) ? gLower : -5970;'
);
code = code.replace(
  'cam.position.set(spawnX0, -5920 + pl.eye, spawnZ0);',
  'cam.position.set(spawnX0, -5970 + pl.eye, spawnZ0);'
);
code = code.replace(
  'P0.set(spawnX0, -5920, spawnZ0);',
  'P0.set(spawnX0, -5970, spawnZ0);'
);

// Remove the obsolete rectangular buildIslandJoint function
const buildIslandJointRegex = /\n\s+function buildIslandJoint\(model\) \{[\s\S]*?scene\.add\(jointMesh\);\s+gMeshes\.push\(jointMesh\);\s+\}/;
code = code.replace(buildIslandJointRegex, '');

// Remove call to buildIslandJoint
code = code.replace(
  '      // Build seamless blended land joint between top island and main portal island\n      buildIslandJoint(model);\n',
  ''
);

// 5. Replace diorama top island grass color with rich dark moss loam (0x1a4022)
code = code.replace(
  'isGrass ? 0x1a455a :',
  'isGrass ? 0x1a4022 :'
);

// 6. Color Tuning in setup(root):
// Tune main island meshes: Plane (grass tufts), coladezorro (reeds), tierra (ground), portal (torii gate), etc.
const setupMaterialTuningSearch = `      let fr, r2, pad = []; root.traverse(o => {
        const n = o.name.replace(/\\./g, '');
        if (n === 'Cube_0') fr = o;
        if (n === 'Cylinder001_18') r2 = o;
        if (n === 'Icosphere_3' || /^Cube00[1-7]_/.test(n)) o.traverse(q => { if (q.isMesh) blend(q.material) });
      });`;

const setupMaterialTuningReplace = `      let fr, r2, pad = []; root.traverse(o => {
        const n = o.name.replace(/\\./g, '');
        if (n === 'Cube_0') fr = o;
        if (n === 'Cylinder001_18') r2 = o;
        if (n === 'Icosphere_3' || /^Cube00[1-7]_/.test(n)) o.traverse(q => { if (q.isMesh) blend(q.material) });
      });

      // Tune main island colors to eliminate harsh blue and bring rich organic twilight palette:
      root.traverse(o => {
        if (!o.isMesh || !o.material) return;
        const n = o.name;
        const m = o.material;

        // Grass blades & tufts (992 planes): converts cyan [47, 102, 139] to lush twilight emerald
        if (n.startsWith('Plane')) {
          m.color.setRGB(0.70, 0.96, 0.30);
          m.roughness = 0.88;
        }
        // Tall reeds along walkway (129 meshes): converts cyan [42, 76, 116] to natural moonlit sage
        else if (n.startsWith('coladezorro')) {
          m.color.setRGB(0.72, 0.95, 0.32);
          m.roughness = 0.85;
        }
        // Main island terrain ground: converts cyan [35, 68, 106] to deep moss loam
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
        }
      });`;

code = code.replace(setupMaterialTuningSearch, setupMaterialTuningReplace);

// 7. Add populateDioramaFoliage function and call it in setup/buildDiorama
const populateDioramaFoliageFunc = `
    let dioramaFoliageGrass = null, dioramaFoliageReeds = null, dioramaFoliageFlowers = null;
    function populateDioramaFoliage(dioModel, mainIsland) {
      if (!dioModel || !mainIsland) return;

      // Find source geometry and materials from main island
      let srcGrass = null, srcReed = null, sakura = null;
      mainIsland.traverse(o => {
        if (!o.isMesh) return;
        if (!srcGrass && o.name.startsWith('Plane')) srcGrass = o;
        if (!srcReed && o.name.startsWith('coladezorro')) srcReed = o;
        if (!sakura && o.name.startsWith('sakuraplano')) sakura = o;
      });
      if (!srcGrass || !srcReed || !sakura) return;

      let seed = 12345;
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

      const gTargets = [];
      dioModel.traverse(o => {
        if (o.isMesh && (o.name.includes('pDisc1_Grass') || o.name.includes('pasted__pDisc1_Grass'))) gTargets.push(o);
      });
      const folRay = new THREE.Raycaster();

      function findGround(x, z, island) {
        const startY = island === 'top' ? 2000 : -4000;
        folRay.set(new THREE.Vector3(x, startY, z), new THREE.Vector3(0, -1, 0));
        folRay.far = 8000;
        const hits = folRay.intersectObjects(gTargets, false);
        return hits.length ? hits[0].point.y : null;
      }

      function distToSegment(px, pz, x1, z1, x2, z2) {
        const dx = x2 - x1, dz = z2 - z1;
        const lenSq = dx * dx + dz * dz;
        if (lenSq === 0) return Math.hypot(px - x1, pz - z1);
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / lenSq));
        return Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz));
      }

      const grassPts = [], reedPts = [], flowerPts = [];

      // Top Island foliage distribution (X: -12500 to -3500)
      for (let i = 0; i < 240; i++) {
        const x = -12500 + rnd() * 8800;
        const z = -1400 + rnd() * 3200;
        const dPath = distToSegment(x, z, -12500, 850, -3500, 381);
        const y = findGround(x, z, 'top');
        if (y !== null) {
          if (dPath > 120) grassPts.push({ x, y, z });
          if (dPath > 280 && i % 2 === 0) reedPts.push({ x, y, z });
          if (dPath > 160 && i % 3 === 0) flowerPts.push({ x, y, z });
        }
      }

      // Lower Island foliage distribution (X: -31000 to -25500)
      for (let i = 0; i < 180; i++) {
        const x = -31000 + rnd() * 5500;
        const z = 100 + rnd() * 2800;
        const dPath = distToSegment(x, z, -28400, 1431, -25500, 1691);
        const y = findGround(x, z, 'lower');
        if (y !== null) {
          if (dPath > 140) grassPts.push({ x, y, z });
          if (dPath > 380 && i % 2 === 0) reedPts.push({ x, y, z });
          if (dPath > 200 && i % 3 === 0) flowerPts.push({ x, y, z });
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

      // 3. Flowers InstancedMesh (sakura blossom clusters with gentle moonlit tint)
      const flowerMat = sakura.material.clone();
      flowerMat.color.setRGB(0.95, 0.85, 1.0);
      flowerMat.alphaTest = 0.5;
      flowerMat.side = THREE.DoubleSide;

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
    }
`;

// Insert populateDioramaFoliage after buildBridgeCollider
code = code.replace(
  '      dioramaBridgeCollider = collider;\n      scene.add(collider);\n      gMeshes.push(collider);\n    }',
  '      dioramaBridgeCollider = collider;\n      scene.add(collider);\n      gMeshes.push(collider);\n    }' + populateDioramaFoliageFunc
);

// Call populateDioramaFoliage in buildDiorama
code = code.replace(
  '      // Build suspension rope bridge collider\n      buildBridgeCollider(model);',
  '      // Build suspension rope bridge collider\n      buildBridgeCollider(model);\n\n      // Copy shaders, grasses, reeds and flowers from main island to both lands of the new island\n      if (islandRoot) populateDioramaFoliage(model, islandRoot);'
);

// Also call populateDioramaFoliage in setup if diorama is already loaded
code = code.replace(
  '      if (!fr || !r2) return;\n      r2.scale.x = r2.scale.z = .152; root.updateMatrixWorld(true);',
  '      if (dioramaRoot) populateDioramaFoliage(dioramaRoot, root);\n      if (!fr || !r2) return;\n      r2.scale.x = r2.scale.z = .152; root.updateMatrixWorld(true);'
);

fs.writeFileSync(srcPath, code, 'utf8');
console.log('Successfully updated public/experiments/floating-island.html with all 4 requirements!');

