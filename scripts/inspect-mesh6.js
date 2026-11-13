const fs = require('fs');
const html = fs.readFileSync('public/experiments/floating-island.html', 'utf8');
const idGlb = html.indexOf('id="glb"');
const sIdx = html.indexOf('>', idGlb) + 1;
const eIdx = html.indexOf('</script>', sIdx);
const b64 = html.slice(sIdx, eIdx).trim();
const buf = Buffer.from(b64, 'base64');

const jsonLen = buf.readUInt32LE(12);
const jsonChunk = buf.slice(20, 20 + jsonLen).toString('utf8');
const gltf = JSON.parse(jsonChunk);

const binChunk = buf.slice(20 + jsonLen + 8);

function getAccessorData(accIdx) {
  const acc = gltf.accessors[accIdx];
  const bv = gltf.bufferViews[acc.bufferView];
  const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const count = acc.count;
  const isVec3 = acc.type === 'VEC3';
  const isFloat = acc.componentType === 5126;
  const isShort = acc.componentType === 5122 || acc.componentType === 5123;
  console.log('Accessor', accIdx, 'type:', acc.type, 'compType:', acc.componentType, 'count:', count, 'normalized:', acc.normalized);
  console.log('min:', acc.min, 'max:', acc.max);
}

const mesh6 = gltf.meshes[6];
console.log('Mesh 6 name:', mesh6.name);
getAccessorData(mesh6.primitives[0].attributes.POSITION);

