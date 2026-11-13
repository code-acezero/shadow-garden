const fs = require('fs');

const srcPath = 'public/experiments/floating-island.html';
let code = fs.readFileSync(srcPath, 'utf8');

// 1. Replace BRIDGE_PROFILE
const oldProfileStart = '    // Exact high-resolution profile of the suspension bridge (sampled from 3D geometry vertices)\n    const BRIDGE_PROFILE = [';
const oldProfileEnd = '    ];';
const startIdx = code.indexOf(oldProfileStart);
const endIdx = code.indexOf(oldProfileEnd, startIdx) + oldProfileEnd.length;

if (startIdx === -1) {
  console.error('Could not find BRIDGE_PROFILE start');
  process.exit(1);
}

const newBridgeProfileStr = `    // Exact high-resolution profile of the suspension bridge (sampled from 3D geometry vertices)
    const BRIDGE_PROFILE = [
      { x: -25500, minZ: 1368, maxZ: 2014, centerZ: 1691, deckY: -5490 },
      { x: -25100, minZ: 1279, maxZ: 1994, centerZ: 1637, deckY: -5518 },
      { x: -24700, minZ: 1250, maxZ: 1964, centerZ: 1607, deckY: -5529 },
      { x: -24300, minZ: 1210, maxZ: 1934, centerZ: 1572, deckY: -5528 },
      { x: -23900, minZ: 1174, maxZ: 1906, centerZ: 1540, deckY: -5498 },
      { x: -23500, minZ: 1141, maxZ: 1855, centerZ: 1498, deckY: -5430 },
      { x: -23100, minZ: 1121, maxZ: 1829, centerZ: 1475, deckY: -5356 },
      { x: -22700, minZ: 1101, maxZ: 1805, centerZ: 1453, deckY: -5276 },
      { x: -22300, minZ: 1064, maxZ: 1790, centerZ: 1427, deckY: -5175 },
      { x: -21900, minZ: 1030, maxZ: 1762, centerZ: 1396, deckY: -5059 },
      { x: -21500, minZ: 1008, maxZ: 1723, centerZ: 1366, deckY: -4830 },
      { x: -21100, minZ: 991,  maxZ: 1708, centerZ: 1350, deckY: -4702 },
      { x: -20700, minZ: 983,  maxZ: 1685, centerZ: 1334, deckY: -4456 },
      { x: -20300, minZ: 963,  maxZ: 1675, centerZ: 1319, deckY: -4292 },
      { x: -19900, minZ: 909,  maxZ: 1661, centerZ: 1285, deckY: -4106 },
      { x: -19500, minZ: 899,  maxZ: 1629, centerZ: 1264, deckY: -3824 },
      { x: -19100, minZ: 871,  maxZ: 1573, centerZ: 1222, deckY: -3573 },
      { x: -18700, minZ: 822,  maxZ: 1546, centerZ: 1184, deckY: -3404 },
      { x: -18300, minZ: 789,  maxZ: 1518, centerZ: 1154, deckY: -3191 },
      { x: -17900, minZ: 750,  maxZ: 1486, centerZ: 1118, deckY: -2919 },
      { x: -17500, minZ: 709,  maxZ: 1433, centerZ: 1071, deckY: -2697 },
      { x: -17100, minZ: 702,  maxZ: 1409, centerZ: 1056, deckY: -2519 },
      { x: -16700, minZ: 706,  maxZ: 1410, centerZ: 1058, deckY: -2273 },
      { x: -16300, minZ: 706,  maxZ: 1407, centerZ: 1057, deckY: -2083 },
      { x: -15900, minZ: 707,  maxZ: 1407, centerZ: 1057, deckY: -1793 },
      { x: -15500, minZ: 707,  maxZ: 1414, centerZ: 1061, deckY: -1605 },
      { x: -15100, minZ: 709,  maxZ: 1409, centerZ: 1059, deckY: -1325 },
      { x: -14700, minZ: 710,  maxZ: 1423, centerZ: 1067, deckY: -1138 },
      { x: -14300, minZ: 712,  maxZ: 1416, centerZ: 1064, deckY: -843 },
      { x: -13900, minZ: 717,  maxZ: 1418, centerZ: 1068, deckY: -641 },
      { x: -13500, minZ: 721,  maxZ: 1422, centerZ: 1072, deckY: -363 },
      { x: -13100, minZ: 744,  maxZ: 1399, centerZ: 1072, deckY: -150 }
    ];`;

code = code.slice(0, startIdx) + newBridgeProfileStr + code.slice(endIdx);

// 2. getBridgeProfileAt
code = code.replace(
  'if (x < -26700 || x > -14300) return null;',
  'if (x < -25500 || x > -13100) return null;'
);
code = code.replace(
  'const u = Math.max(0, Math.min(1, (x - (-26600)) / 12200));',
  'const u = Math.max(0, Math.min(1, (x - (-25400)) / 12200));'
);
code = code.replace(
  'const playerOnBridge = (P0.x < -14470 && P0.x > -26600);',
  'const playerOnBridge = (P0.x < -13270 && P0.x > -25400);'
);
code = code.replace(
  'const playerU = (P0.x - (-26550)) / 12080;',
  'const playerU = (P0.x - (-25350)) / 12080;'
);

// 3. walk(d) bridge span
code = code.replace(
  'const inBridgeSpan = (nx <= -14350 && nx >= -26650);',
  'const inBridgeSpan = (nx <= -13150 && nx >= -25450);'
);

// 4. audio
code = code.replace(
  "if (cam.position.x < -14470 && cam.position.x > -26600 && Math.random() < 0.45) {",
  "if (cam.position.x < -13270 && cam.position.x > -25400 && Math.random() < 0.45) {"
);
code = code.replace(
  'const dWater = p.distanceTo(V(-28250, -5850, -930));',
  'const dWater = p.distanceTo(V(-27050, -5690, -999));'
);
code = code.replace(
  'const onBridge = (p.x < -14470 && p.x > -26600);',
  'const onBridge = (p.x < -13270 && p.x > -25400);'
);

// 5. frame(d) loops (replace remaining occurrences of playerOnBridge)
code = code.replaceAll(
  'const playerOnBridge = (P0.x < -14470 && P0.x > -26600);',
  'const playerOnBridge = (P0.x < -13270 && P0.x > -25400);'
);
code = code.replaceAll(
  'const playerU = playerOnBridge ? (P0.x - (-26550)) / 12080 : -1;',
  'const playerU = playerOnBridge ? (P0.x - (-25350)) / 12080 : -1;'
);

// 6. buildBridgeCollider
code = code.replace(
  'const x = -26800 + (-14200 - (-26800)) * (i / steps);',
  'const x = -25600 + (-13000 - (-25600)) * (i / steps);'
);
code = code.replace(
  'const bp = getBridgeProfileAt(Math.max(-26700, Math.min(-14300, x)), false);',
  'const bp = getBridgeProfileAt(Math.max(-25500, Math.min(-13100, x)), false);'
);

// 7. Insert buildIslandJoint right after buildBridgeCollider
const buildIslandJointCode = `
    function buildIslandJoint(model) {
      const minX = -3800, maxX = -2400;
      const minZ = -1600, maxZ = 2400;
      const segsX = 28, segsZ = 36;
      const geo = new THREE.PlaneGeometry(maxX - minX, maxZ - minZ, segsX, segsZ);
      geo.rotateX(-Math.PI / 2);
      geo.translate((minX + maxX) / 2, 0, (minZ + maxZ) / 2);

      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        const u = (vx - minX) / (maxX - minX);
        const hermite = u * u * (3 - 2 * u);

        const yDio = groundAt(minX - 60, vz, 1000) ?? -365;
        const yMain = groundAt(maxX + 60, vz, 1000) ?? -375;
        const blendedY = yDio * (1 - hermite) + yMain * hermite;

        pos.setY(i, blendedY);
      }
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: 0x1a455a,
        roughness: 0.85,
        metalness: 0.05,
        side: THREE.DoubleSide
      });

      const jointMesh = new THREE.Mesh(geo, mat);
      jointMesh.name = 'islandJointMesh';
      jointMesh.userData.s = 'soil';
      scene.add(jointMesh);
      gMeshes.push(jointMesh);
    }
`;

code = code.replace(
  '      dioramaBridgeCollider = collider;\n      scene.add(collider);\n      gMeshes.push(collider);\n    }',
  '      dioramaBridgeCollider = collider;\n      scene.add(collider);\n      gMeshes.push(collider);\n    }' + buildIslandJointCode
);

// 8. buildDiorama: target coordinates
code = code.replace(
  '      const targetSurfaceY = -400;\n      const targetEdgeX = -3400;\n      const targetCenterZ = 450;',
  '      const targetSurfaceY = -240;\n      const targetEdgeX = -2200;\n      const targetCenterZ = 381.25;'
);

// 9. Waterfall particles
code = code.replace(
  'const fallBase = new THREE.Vector3(-28250, -5850, -930);',
  'const fallBase = new THREE.Vector3(-27050, -5690, -999);'
);

// 10. Call buildIslandJoint(model) and update spawn
code = code.replace(
  '      // Build suspension rope bridge collider\n      buildBridgeCollider(model);\n\n      // Set new starting point: lower island at the bottom, looking up towards the grand bridge and floating islands\n      const spawnX = -29600, spawnZ = 1500;\n      const gLower = groundAt(spawnX, spawnZ, -4000);\n      const spawnY = (gLower !== null) ? gLower : -6062.75;',
  '      // Build suspension rope bridge collider\n      buildBridgeCollider(model);\n\n      // Build seamless blended land joint between top island and main portal island\n      buildIslandJoint(model);\n\n      // Set new starting point: lower island at the bottom, looking up towards the grand bridge and floating islands\n      const spawnX = -28400, spawnZ = 1431;\n      const gLower = groundAt(spawnX, spawnZ, -4000);\n      const spawnY = (gLower !== null) ? gLower : -5920;'
);

// 11. Initial spawn coordinates
code = code.replace(
  "      const spawnX0 = -29600, spawnZ0 = 1500;\n      cam.position.set(spawnX0, -6062.75 + pl.eye, spawnZ0);\n      yaw = -1.547; pitch = 0.24;\n      cam.rotation.set(pitch, yaw, 0, 'YXZ');\n      P0.set(spawnX0, -6062.75, spawnZ0);",
  "      const spawnX0 = -28400, spawnZ0 = 1431;\n      cam.position.set(spawnX0, -5920 + pl.eye, spawnZ0);\n      yaw = -1.547; pitch = 0.24;\n      cam.rotation.set(pitch, yaw, 0, 'YXZ');\n      P0.set(spawnX0, -5920, spawnZ0);"
);

fs.writeFileSync(srcPath, code, 'utf8');
console.log('Successfully updated public/experiments/floating-island.html');

