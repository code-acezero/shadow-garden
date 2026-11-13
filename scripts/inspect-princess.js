const fs = require('fs');

const buf = fs.readFileSync('public/models/princess.glb');
const jsonChunkLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + jsonChunkLen);
const gltf = JSON.parse(jsonStr);

console.log('Meshes:', gltf.meshes ? gltf.meshes.length : 0);
console.log('Materials:', gltf.materials ? gltf.materials.map(m => m.name) : []);
console.log('Nodes count:', gltf.nodes ? gltf.nodes.length : 0);
console.log('Animations count:', gltf.animations ? gltf.animations.length : 0);
if (gltf.animations) {
  console.log('Animation names:', gltf.animations.map(a => a.name));
}

const nodeNames = gltf.nodes.map(n => n.name).filter(Boolean);
console.log('Sample node names (first 35):', nodeNames.slice(0, 35));

// Check bone naming conventions:
const boneSample = nodeNames.filter(n => /hip|spine|arm|leg|head|neck|hand|foot|eye|hair|skirt/i.test(n));
console.log('Matching anatomical bones sample (30):', boneSample.slice(0, 30));
