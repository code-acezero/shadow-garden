const fs = require('fs');

const buf = fs.readFileSync('3d assets/diorama_floating_islands__shrine.glb');
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
const gltf = JSON.parse(jsonStr);

let offset = 20 + jsonLen;
const binLen = buf.readUInt32LE(offset);
const binData = buf.subarray(offset + 8, offset + 8 + binLen);

const img9 = gltf.images[9];
const bv = gltf.bufferViews[img9.bufferView];
const imgData = binData.subarray(bv.byteOffset, bv.byteOffset + bv.byteLength);

fs.writeFileSync('scripts/texture_9.png', imgData);
console.log('Saved texture 9 (bytes):', imgData.length);

