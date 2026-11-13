const fs = require('fs');

const buf = fs.readFileSync('3d assets/diorama_floating_islands__shrine.glb');
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
const gltf = JSON.parse(jsonStr);

console.log('Total nodes:', gltf.nodes.length);
console.log('Meshes:', gltf.meshes.length);
console.log('Materials:', gltf.materials.map(m => m.name));

const nodesWithMesh = gltf.nodes.map((n, i) => ({ idx: i, name: n.name, meshIdx: n.mesh, translation: n.translation, rotation: n.rotation, scale: n.scale, children: n.children }))
  .filter(n => n.name && (n.name.includes('Surface') || n.name.includes('shrine') || n.name.includes('pPlane') || n.name.includes('Disc')));

console.log('Key nodes:', JSON.stringify(nodesWithMesh.slice(0, 30), null, 2));

