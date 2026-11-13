const fs = require('fs');
const crypto = require('crypto');

const file1 = 'public/experiments/floating-island.html';
const file2 = '3d assets/Floating Island – Shrine Gate to Mana Portal.html';

let content = fs.readFileSync(file1, 'utf8').replace(/\r\n/g, '\n');

// 1. Remove pierW and pierE, ensure colMesh.visible = false
const oldPierSnippet = `      // 5. Massive Granite Abutment Foundation Piers embedding the bridge into the island cliffs
      const pierGeoW = new THREE.BoxGeometry(85, 240, bridgeWidth + 80);
      const pierW = new THREE.Mesh(pierGeoW, stoneMat);
      pierW.position.set(startX + 35, -590, centerZ);
      bridgeGroup.add(pierW);

      const pierGeoE = new THREE.BoxGeometry(85, 220, bridgeWidth + 80);
      const pierE = new THREE.Mesh(pierGeoE, stoneMat);
      pierE.position.set(endX - 35, -460, centerZ);
      bridgeGroup.add(pierE);

      // Mid-chasm granite support pylons rising from the depths
      const midPylonGeo = new THREE.CylinderGeometry(28, 36, 320, 12);
      const midPylonN = new THREE.Mesh(midPylonGeo, stoneMat);
      midPylonN.position.set((startX + endX) * 0.5, -490, centerZ - bridgeWidth * 0.38);
      bridgeGroup.add(midPylonN);

      const midPylonS = new THREE.Mesh(midPylonGeo, stoneMat);
      midPylonS.position.set((startX + endX) * 0.5, -490, centerZ + bridgeWidth * 0.38);
      bridgeGroup.add(midPylonS);

      // 6. Invisible walk collider mesh in gMeshes for raycasting backup
      const colGeo = new THREE.BoxGeometry(bridgeLen, 14, bridgeWidth);
      const colMat = new THREE.MeshBasicMaterial({ visible: false });
      const colMesh = new THREE.Mesh(colGeo, colMat);
      colMesh.name = 'shrineBridgeWalkCollider';
      colMesh.position.set(startX + bridgeLen * 0.5, getBridgeY(0.5) + 6, centerZ);
      colMesh.userData.s = 'wood';
      bridgeGroup.add(colMesh);
      gMeshes.push(colMesh);`;

const newPierSnippet = `      // 5. Mid-chasm granite support pylons rising from the depths
      const midPylonGeo = new THREE.CylinderGeometry(28, 36, 320, 12);
      const midPylonN = new THREE.Mesh(midPylonGeo, stoneMat);
      midPylonN.position.set((startX + endX) * 0.5, -490, centerZ - bridgeWidth * 0.38);
      bridgeGroup.add(midPylonN);

      const midPylonS = new THREE.Mesh(midPylonGeo, stoneMat);
      midPylonS.position.set((startX + endX) * 0.5, -490, centerZ + bridgeWidth * 0.38);
      bridgeGroup.add(midPylonS);

      // 6. Invisible walk collider mesh in gMeshes for raycasting backup
      const colGeo = new THREE.BoxGeometry(bridgeLen, 14, bridgeWidth);
      const colMat = new THREE.MeshBasicMaterial({ visible: false });
      const colMesh = new THREE.Mesh(colGeo, colMat);
      colMesh.name = 'shrineBridgeWalkCollider';
      colMesh.position.set(startX + bridgeLen * 0.5, getBridgeY(0.5) + 6, centerZ);
      colMesh.userData.s = 'wood';
      colMesh.visible = false;
      bridgeGroup.add(colMesh);
      gMeshes.push(colMesh);`;

if (!content.includes(oldPierSnippet)) {
  console.error('ERROR: oldPierSnippet not found!');
  process.exit(1);
}
content = content.replace(oldPierSnippet, newPierSnippet);
console.log('✓ Replaced pier snippet: removed protruding abutment box & ensured colMesh invisible');

// 2. Hide static billboard grasses along road and bridge in buildDiorama
const oldGroundSnippet = `      // Add walkable ground meshes from diorama to gMeshes (strictly whitelisting genuine walkable ground only)
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

const newGroundSnippet = `      // Hide static cardboard grass billboards baked into the diorama model along the road and bridge corridor
      const _vRoadPt = new THREE.Vector3();
      const distToSeg2D = (px, pz, ax, az, bx, bz) => {
        const pax = px - ax, paz = pz - az;
        const bax = bx - ax, baz = bz - az;
        const lenSq = bax * bax + baz * baz;
        const h = lenSq === 0 ? 0 : Math.max(0, Math.min(1, (pax * bax + paz * baz) / lenSq));
        return Math.hypot(pax - bax * h, paz - baz * h);
      };

      model.traverse(o => {
        if (!o.isMesh) return;
        const n = o.name || '';
        const m = o.material;
        const mName = (m && m.name) ? m.name : '';
        if (n.includes('pPlane') || mName.includes('lambert12') || n.includes('GrassPlane')) {
          o.getWorldPosition(_vRoadPt);
          const dRoad = distToSeg2D(_vRoadPt.x, _vRoadPt.z, -7450, 480, -4400, 770);
          const inBridgeSpan = (_vRoadPt.x >= -4600 && _vRoadPt.x <= -2150 && _vRoadPt.z >= 350 && _vRoadPt.z <= 1200);
          if (dRoad < 360 || inBridgeSpan) {
            o.visible = false;
          }
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

if (!content.includes(oldGroundSnippet)) {
  console.error('ERROR: oldGroundSnippet not found!');
  process.exit(1);
}
content = content.replace(oldGroundSnippet, newGroundSnippet);
console.log('✓ Added billboard grass hiding in buildDiorama');

fs.writeFileSync(file1, content, 'utf8');
fs.writeFileSync(file2, content, 'utf8');

const h1 = crypto.createHash('sha256').update(fs.readFileSync(file1)).digest('hex');
const h2 = crypto.createHash('sha256').update(fs.readFileSync(file2)).digest('hex');
console.log('file1 hash:', h1);
console.log('file2 hash:', h2);
console.log('Byte-for-byte SHA256 identical:', h1 === h2);