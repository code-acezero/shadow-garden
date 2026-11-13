const fs = require('fs');

const buf = fs.readFileSync('3d assets/diorama_floating_islands__shrine.glb');
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
const gltf = JSON.parse(jsonStr);

// Binary chunk starts at 20 + jsonLen
let offset = 20 + jsonLen;
// Chunk header: length (4), type (4)
const binLen = buf.readUInt32LE(offset);
const binType = buf.readUInt32LE(offset + 4);
const binData = buf.subarray(offset + 8, offset + 8 + binLen);

const img8 = gltf.images[8];
const bv = gltf.bufferViews[img8.bufferView];
const imgData = binData.subarray(bv.byteOffset, bv.byteOffset + bv.byteLength);

fs.writeFileSync('scripts/texture_8.png', imgData);
console.log('Saved texture 8 (bytes):', imgData.length);

