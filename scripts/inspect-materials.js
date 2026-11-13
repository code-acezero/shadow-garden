const fs = require('fs');

const buf = fs.readFileSync('3d assets/diorama_floating_islands__shrine.glb');
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
const gltf = JSON.parse(jsonStr);

console.log('Materials detail:');
gltf.materials.forEach((m, i) => {
  console.log(`[${i}] ${m.name}:`, JSON.stringify(m, null, 2));
});

console.log('Images:');
gltf.images.forEach((img, i) => {
  console.log(`[${i}] ${img.name} (${img.mimeType})`);
});
