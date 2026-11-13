const fs = require('fs');

const buf = fs.readFileSync('public/models/princess.glb');
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));

console.log('Princess Materials:');
gltf.materials.forEach((m, i) => {
  console.log(i, m.name, m.pbrMetallicRoughness ? m.pbrMetallicRoughness.baseColorFactor : 'no pbr');
  if (m.emissiveTexture || m.emissiveFactor) {
    console.log('  Emissive:', m.emissiveFactor, m.emissiveTexture);
  }
});
