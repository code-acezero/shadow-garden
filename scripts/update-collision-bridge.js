const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'experiments', 'floating-island.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Declare BRIDGE_PROFILE, getBridgeProfileAt, and worldObstacles
const target1 = `    const rcMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), rc = new THREE.Raycaster(), gMeshes = [], pillars = [C.clone().addScaledVector(Pp, 1758), C.clone().addScaledVector(Pp, -1758)];`;

const replacement1 = `    const rcMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), rc = new THREE.Raycaster(), gMeshes = [], pillars = [C.clone().addScaledVector(Pp, 1758), C.clone().addScaledVector(Pp, -1758)];

    // Exact high-resolution profile of the suspension bridge (sampled from 3D geometry vertices)
    const BRIDGE_PROFILE = [
      { x: -26700, minZ: 1437, maxZ: 2083, centerZ: 1760, deckY: -5650 },
      { x: -26300, minZ: 1348, maxZ: 2063, centerZ: 1706, deckY: -5678 },
      { x: -25900, minZ: 1319, maxZ: 2033, centerZ: 1676, deckY: -5689 },
      { x: -25500, minZ: 1279, maxZ: 2003, centerZ: 1641, deckY: -5688 },
      { x: -25100, minZ: 1243, maxZ: 1975, centerZ: 1609, deckY: -5658 },
      { x: -24700, minZ: 1210, maxZ: 1924, centerZ: 1567, deckY: -5590 },
      { x: -24300, minZ: 1190, maxZ: 1898, centerZ: 1544, deckY: -5516 },
      { x: -23900, minZ: 1170, maxZ: 1874, centerZ: 1522, deckY: -5436 },
      { x: -23500, minZ: 1133, maxZ: 1859, centerZ: 1496, deckY: -5335 },
      { x: -23100, minZ: 1099, maxZ: 1831, centerZ: 1465, deckY: -5219 },
      { x: -22700, minZ: 1077, maxZ: 1792, centerZ: 1435, deckY: -4990 },
      { x: -22300, minZ: 1060, maxZ: 1777, centerZ: 1419, deckY: -4862 },
      { x: -21900, minZ: 1052, maxZ: 1754, centerZ: 1403, deckY: -4616 },
      { x: -21500, minZ: 1032, maxZ: 1744, centerZ: 1388, deckY: -4452 },
      { x: -21100, minZ: 978,  maxZ: 1730, centerZ: 1354, deckY: -4266 },
      { x: -20700, minZ: 968,  maxZ: 1698, centerZ: 1333, deckY: -3984 },
      { x: -20300, minZ: 940,  maxZ: 1642, centerZ: 1291, deckY: -3733 },
      { x: -19900, minZ: 891,  maxZ: 1615, centerZ: 1253, deckY: -3564 },
      { x: -19500, minZ: 858,  maxZ: 1587, centerZ: 1223, deckY: -3351 },
      { x: -19100, minZ: 819,  maxZ: 1555, centerZ: 1187, deckY: -3079 },
      { x: -18700, minZ: 778,  maxZ: 1502, centerZ: 1140, deckY: -2857 },
      { x: -18300, minZ: 771,  maxZ: 1478, centerZ: 1125, deckY: -2679 },
      { x: -17900, minZ: 775,  maxZ: 1479, centerZ: 1127, deckY: -2433 },
      { x: -17500, minZ: 775,  maxZ: 1476, centerZ: 1126, deckY: -2243 },
      { x: -17100, minZ: 776,  maxZ: 1476, centerZ: 1126, deckY: -1953 },
      { x: -16700, minZ: 776,  maxZ: 1483, centerZ: 1130, deckY: -1765 },
      { x: -16300, minZ: 778,  maxZ: 1478, centerZ: 1128, deckY: -1485 },
      { x: -15900, minZ: 779,  maxZ: 1492, centerZ: 1136, deckY: -1298 },
      { x: -15500, minZ: 781,  maxZ: 1485, centerZ: 1133, deckY: -1003 },
      { x: -15100, minZ: 786,  maxZ: 1487, centerZ: 1137, deckY: -801 },
      { x: -14700, minZ: 790,  maxZ: 1491, centerZ: 1141, deckY: -523 },
      { x: -14300, minZ: 813,  maxZ: 1468, centerZ: 1141, deckY: -310 }
    ];

    function getBridgeProfileAt(x, includeSway = true) {
      if (x < -26700 || x > -14300) return null;
      let low = 0, high = BRIDGE_PROFILE.length - 1;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (BRIDGE_PROFILE[mid].x < x) low = mid + 1;
        else high = mid - 1;
      }
      const i1 = Math.max(0, high), i2 = Math.min(BRIDGE_PROFILE.length - 1, low);
      const p1 = BRIDGE_PROFILE[i1], p2 = BRIDGE_PROFILE[i2];
      const t = (i1 === i2) ? 0 : (x - p1.x) / (p2.x - p1.x);
      let minZ = p1.minZ + (p2.minZ - p1.minZ) * t;
      let maxZ = p1.maxZ + (p2.maxZ - p1.maxZ) * t;
      let centerZ = p1.centerZ + (p2.centerZ - p1.centerZ) * t;
      let deckY = p1.deckY + (p2.deckY - p1.deckY) * t;
      if (includeSway) {
        const u = Math.max(0, Math.min(1, (x - (-26600)) / 12200));
        const env = Math.sin(u * Math.PI);
        const swayZ = env * (Math.sin(ts * 1.5) * 36.0 + Math.sin(ts * 2.8) * 12.0);
        let sagY = env * (Math.sin(ts * 2.0 + 0.4) * 18.0);
        const playerOnBridge = (P0.x < -14470 && P0.x > -26600);
        if (playerOnBridge) {
          const playerU = (P0.x - (-26550)) / 12080;
          const distU = Math.abs(u - playerU);
          if (distU < 0.22) sagY -= (1 - distU / 0.22) * 36.0;
        }
        minZ += swayZ;
        maxZ += swayZ;
        centerZ += swayZ;
        deckY += sagY;
      }
      return { minZ, maxZ, centerZ, deckY };
    }

    // Comprehensive world obstacle and architecture collision registry
    const worldObstacles = [
      // Portal Island Stone Houses
      { type: 'box', minX: -559, maxX: 545, minZ: -2061, maxZ: -941, minY: -350, maxY: 1200, name: 'Stone House North' },
      { type: 'box', minX: -559, maxX: 545, minZ: 1651, maxZ: 2771, minY: -350, maxY: 1200, name: 'Stone House South' },
      // Portal Island Stone Ruins
      { type: 'box', minX: -2812, maxX: -2069, minZ: 1198, maxZ: 2050, minY: -450, maxY: 200, name: 'Stone Ruins North' },
      { type: 'box', minX: -3034, maxX: -2449, minZ: -390, maxZ: 227, minY: -400, maxY: 250, name: 'Stone Ruins South' },
      // Sakura Tree Trunk on Portal Island
      { type: 'cylinder', x: 840, z: -3280, r: 450, minY: -500, maxY: 3000, name: 'Sakura Tree' },
      // Witch Trees on Portal Island (framing the stairs)
      { type: 'cylinder', x: 3290, z: 1300, r: 400, minY: -500, maxY: 2500, name: 'Witch Tree North' },
      { type: 'cylinder', x: 3290, z: -400, r: 400, minY: -500, maxY: 2500, name: 'Witch Tree South' },
      // Portal Gate Pillars
      { type: 'cylinder', x: pillars[0].x, z: pillars[0].z, r: 810, minY: -200, maxY: 5000, name: 'Portal Pillar Left' },
      { type: 'cylinder', x: pillars[1].x, z: pillars[1].z, r: 810, minY: -200, maxY: 5000, name: 'Portal Pillar Right' }
    ];`;

if (!content.includes(target1)) {
  console.error('Target 1 not found!');
  process.exit(1);
}
content = content.replace(target1, replacement1);

// 2. In walk(d): obstacle collisions and bridge rope clamp
const target2 = `      // move, stay on the island (ground must exist), push out of the gate pillars
      let nx = P0.x + L.vel.x * d, nz = P0.z + L.vel.z * d;
      for (const p of pillars) { const dx = nx - p.x, dz = nz - p.z, r = Math.hypot(dx, dz); if (r < 810) { nx = p.x + dx / r * 810; nz = p.z + dz / r * 810 } }`;

const replacement2 = `      // move, stay on the island (ground must exist), push out of all world obstacles and architectures
      let nx = P0.x + L.vel.x * d, nz = P0.z + L.vel.z * d;

      // Solid collision resolution for all world architecture and objects (prevents ghosting through walls)
      const bodyRadius = 90;
      for (let iter = 0; iter < 2; iter++) {
        for (const obs of worldObstacles) {
          if (obs.minY !== undefined && (P0.y + 700 < obs.minY || P0.y > obs.maxY)) continue;
          if (obs.type === 'cylinder') {
            const dx = nx - obs.x, dz = nz - obs.z;
            const dist = Math.hypot(dx, dz);
            const minDist = obs.r + bodyRadius;
            if (dist < minDist && dist > 1e-4) {
              const push = (minDist - dist) / dist;
              nx += dx * push;
              nz += dz * push;
            }
          } else if (obs.type === 'box') {
            const bMinX = obs.minX - bodyRadius;
            const bMaxX = obs.maxX + bodyRadius;
            const bMinZ = obs.minZ - bodyRadius;
            const bMaxZ = obs.maxZ + bodyRadius;
            if (nx > bMinX && nx < bMaxX && nz > bMinZ && nz < bMaxZ) {
              const dLeft = nx - bMinX;
              const dRight = bMaxX - nx;
              const dBottom = nz - bMinZ;
              const dTop = bMaxZ - nz;
              const minPen = Math.min(dLeft, dRight, dBottom, dTop);
              if (minPen === dLeft) nx = bMinX;
              else if (minPen === dRight) nx = bMaxX;
              else if (minPen === dBottom) nz = bMinZ;
              else nz = bMaxZ;
            }
          }
        }
      }

      // STRICT BRIDGE ROPE BARRIER & ZERO-FALL DECK ENFORCEMENT
      // Active across the suspension bridge span [-26650, -14350]
      const inBridgeSpan = (nx <= -14350 && nx >= -26650);
      let bridgeDeckY = null;
      if (inBridgeSpan) {
        const bp = getBridgeProfileAt(nx, true);
        if (bp) {
          bridgeDeckY = bp.deckY;
          // Player body padding from ropes: strictly clamps lateral Z so player can NEVER walk past ropes
          const ropeMargin = 110;
          const clampedZ = clampv(nz, bp.minZ + ropeMargin, bp.maxZ - ropeMargin);
          if (clampedZ !== nz) {
            nz = clampedZ;
            L.vel.z = 0;
          }
        }
      }`;

if (!content.includes(target2)) {
  console.error('Target 2 not found!');
  process.exit(1);
}
content = content.replace(target2, replacement2);

// 3. In walk(d): ground detection with zero-fall bridge clamp
const target3 = `      let gy = gnd(nx, nz, P0.y + 500);
      if (gy === null) {
        nx = P0.x;
        nz = P0.z;
        L.vel.set(0, 0, 0);
        gy = gnd(P0.x, P0.z, P0.y + 500);
      }`;

const replacement3 = `      let gy = gnd(nx, nz, P0.y + 600);
      if (bridgeDeckY !== null) {
        // When on bridge, ground level is guaranteed to be AT LEAST the wooden deck surface
        if (gy === null || gy < bridgeDeckY) {
          gy = bridgeDeckY;
          gSurf = 'wood';
        }
      }
      if (gy === null) {
        nx = P0.x;
        nz = P0.z;
        L.vel.set(0, 0, 0);
        gy = gnd(P0.x, P0.z, P0.y + 600);
      }`;

if (!content.includes(target3)) {
  console.error('Target 3 not found!');
  process.exit(1);
}
content = content.replace(target3, replacement3);

// 4. Update dioramaBridgeCollider animation in frame(d)
const target4 = `      if (dioramaBridgeCollider && dioramaBridgeCollider.userData.origPos) {
        const cPos = dioramaBridgeCollider.geometry.attributes.position;
        const cOrig = dioramaBridgeCollider.userData.origPos;
        const steps = 80;
        const playerOnBridge = (P0.x < -14470 && P0.x > -26600);
        const playerU = playerOnBridge ? (P0.x - (-26550)) / 12080 : -1;
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const env = Math.sin(u * Math.PI);
          const swayZ = env * (Math.sin(ts * 1.5) * 36.0 + Math.sin(ts * 2.8) * 12.0);
          let sagY = env * (Math.sin(ts * 2.0 + 0.4) * 18.0);
          if (playerOnBridge) {
            const distU = Math.abs(u - playerU);
            if (distU < 0.22) sagY -= (1 - distU / 0.22) * 36.0;
          }
          const idxL = (i * 2) * 3, idxR = (i * 2 + 1) * 3;
          cPos.setY(i * 2, cOrig[idxL + 1] + sagY);
          cPos.setZ(i * 2, cOrig[idxL + 2] + swayZ);
          cPos.setY(i * 2 + 1, cOrig[idxR + 1] + sagY);
          cPos.setZ(i * 2 + 1, cOrig[idxR + 2] + swayZ);
        }
        cPos.needsUpdate = true;
      }`;

const replacement4 = `      if (dioramaBridgeCollider && dioramaBridgeCollider.userData.origPos) {
        const cPos = dioramaBridgeCollider.geometry.attributes.position;
        const cOrig = dioramaBridgeCollider.userData.origPos;
        const steps = cPos.count / 2 - 1;
        const playerOnBridge = (P0.x < -14470 && P0.x > -26600);
        const playerU = playerOnBridge ? (P0.x - (-26550)) / 12080 : -1;
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const env = Math.sin(u * Math.PI);
          const swayZ = env * (Math.sin(ts * 1.5) * 36.0 + Math.sin(ts * 2.8) * 12.0);
          let sagY = env * (Math.sin(ts * 2.0 + 0.4) * 18.0);
          if (playerOnBridge) {
            const distU = Math.abs(u - playerU);
            if (distU < 0.22) sagY -= (1 - distU / 0.22) * 36.0;
          }
          const idxL = (i * 2) * 3, idxR = (i * 2 + 1) * 3;
          cPos.setY(i * 2, cOrig[idxL + 1] + sagY);
          cPos.setZ(i * 2, cOrig[idxL + 2] + swayZ);
          cPos.setY(i * 2 + 1, cOrig[idxR + 1] + sagY);
          cPos.setZ(i * 2 + 1, cOrig[idxR + 2] + swayZ);
        }
        cPos.needsUpdate = true;
      }`;

if (!content.includes(target4)) {
  console.error('Target 4 not found!');
  process.exit(1);
}
content = content.replace(target4, replacement4);

// 5. Replace buildBridgeCollider with accurate spline collider
const startOldBridge = content.indexOf('function buildBridgeCollider(model) {');
const endOldBridge = content.indexOf('function buildDiorama(gltf) {');
if (startOldBridge === -1 || endOldBridge === -1) {
  console.error('buildBridgeCollider function boundaries not found!');
  process.exit(1);
}

const replacement5 = `function buildBridgeCollider(model) {
      const bridge = model.getObjectByName('pasted__pasted__pasted__pasted__pasted__pasted__pasted__pasted__pCube3_RopeBridge_0');
      if (!bridge) return;
      const steps = 120;
      const positions = [];
      const indices = [];
      const halfW = 420;
      for (let i = 0; i <= steps; i++) {
        const x = -26800 + (-14200 - (-26800)) * (i / steps);
        const bp = getBridgeProfileAt(Math.max(-26700, Math.min(-14300, x)), false);
        const cz = bp.centerZ;
        const cy = bp.deckY;
        positions.push(x, cy, cz - halfW);
        positions.push(x, cy, cz + halfW);
        if (i < steps) {
          const idx = i * 2;
          indices.push(idx, idx + 1, idx + 2);
          indices.push(idx + 1, idx + 3, idx + 2);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const collider = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
      collider.userData.s = 'wood';
      collider.visible = false;
      collider.userData.origPos = positions.slice();
      dioramaBridgeCollider = collider;
      scene.add(collider);
      gMeshes.push(collider);
    }

    `;

content = content.slice(0, startOldBridge) + replacement5 + content.slice(endOldBridge);

// 6. In buildDiorama: Register diorama obstacles and whitelist ONLY genuine walkable surfaces into gMeshes
const target6 = `      // Add all walkable meshes from diorama to gMeshes (strictly whitelisting genuine walkable ground)
      model.traverse(o => {
        if (!o.isMesh) return;
        const n = o.name;
        const isGround = (n === 'pDisc1_Grass_0' || n === 'pasted__pDisc1_Grass_0');
        const isStone = n.includes('SteppingStone') || (n.includes('Rock') && !n.includes('Maple') && !n.includes('Leaves'));
        const isPond = (n === 'pDisc5_Water_0');
        if (isGround || isStone || isPond) {
          o.userData.s = isStone ? 'stone' : (isPond ? 'water' : 'soil');
          if (o.material) o.material.side = THREE.DoubleSide;
          gMeshes.push(o);
        }
      });`;

const replacement6 = `      // Register diorama architecture and solid obstacles dynamically from their exact world bounding boxes:
      const shrineObj = model.getObjectByName('polySurface7');
      if (shrineObj) {
        const b = new THREE.Box3().setFromObject(shrineObj);
        worldObstacles.push({ type: 'box', minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, minY: b.min.y, maxY: b.max.y, name: 'Shrine Altar' });
      }
      
      const chestObj = model.getObjectByName('SM_ChestpCube3') || model.getObjectByName('SM_Chest');
      if (chestObj) {
        const b = new THREE.Box3().setFromObject(chestObj);
        worldObstacles.push({ type: 'box', minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, minY: b.min.y, maxY: b.max.y, name: 'Treasure Chest' });
      }
      
      // Top island torii gate posts framing bridge exit:
      ['pasted__pCube5', 'pCube5', 'pCube5_lambert13_0', 'pasted__pCube5_lambert13_0', 'pasted__pasted__pCube5_lambert13_0'].forEach(name => {
        const post = model.getObjectByName(name);
        if (post && post.isMesh) {
          const b = new THREE.Box3().setFromObject(post);
          worldObstacles.push({ type: 'box', minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, minY: b.min.y, maxY: b.max.y, name: 'Gate Post' });
        }
      });
      
      // Giant tree trunk on top island:
      const treeObj = model.getObjectByName('SM_Tree_4polySurface28');
      if (treeObj) {
        const b = new THREE.Box3().setFromObject(treeObj);
        const c = b.getCenter(new THREE.Vector3());
        worldObstacles.push({ type: 'cylinder', x: c.x, z: c.z, r: 650, minY: b.min.y, maxY: b.max.y, name: 'Giant Maple Tree' });
      }
      
      // Large rocks & boulders on diorama (registered as solid obstacles, NOT ground):
      model.traverse(o => {
        if (!o.isMesh) return;
        const n = o.name;
        if (n.includes('MB_Rock') && !n.includes('Maple') && !n.includes('Leaves')) {
          const b = new THREE.Box3().setFromObject(o);
          const c = b.getCenter(new THREE.Vector3());
          const size = b.getSize(new THREE.Vector3());
          const rad = Math.max(size.x, size.z) * 0.45;
          worldObstacles.push({ type: 'cylinder', x: c.x, z: c.z, r: rad, minY: b.min.y, maxY: b.max.y, name: 'Rock Boulder' });
        }
      });

      // Add walkable ground meshes from diorama to gMeshes (strictly whitelisting genuine walkable ground only)
      model.traverse(o => {
        if (!o.isMesh) return;
        const n = o.name;
        const isGround = (n === 'pDisc1_Grass_0' || n === 'pasted__pDisc1_Grass_0');
        const isStone = n.includes('SteppingStone');
        const isPond = (n === 'pDisc5_Water_0');
        if (isGround || isStone || isPond) {
          o.userData.s = isStone ? 'stone' : (isPond ? 'water' : 'soil');
          if (o.material) o.material.side = THREE.DoubleSide;
          gMeshes.push(o);
        }
      });`;

if (!content.includes(target6)) {
  console.error('Target 6 not found!');
  process.exit(1);
}
content = content.replace(target6, replacement6);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated public/experiments/floating-island.html!');

// Also copy to 3d assets/Floating Island – Shrine Gate to Mana Portal.html
const assetPath = path.join(__dirname, '..', '3d assets', 'Floating Island – Shrine Gate to Mana Portal.html');
fs.writeFileSync(assetPath, content, 'utf8');
console.log('Successfully updated 3d assets/Floating Island – Shrine Gate to Mana Portal.html!');

