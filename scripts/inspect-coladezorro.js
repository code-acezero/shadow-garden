const fs = require('fs');
const html = fs.readFileSync('public/experiments/floating-island.html', 'utf8');
const idGlb = html.indexOf('id="glb"');
const sIdx = html.indexOf('>', idGlb) + 1;
const eIdx = html.indexOf('</script>', sIdx);
const b64 = html.slice(sIdx, eIdx).trim();
const buf = Buffer.from(b64, 'base64');

// We can load Three and GLTFLoader using standard js
// Or inspect GLTF JSON directly
const jsonLen = buf.readUInt32LE(12);
const jsonChunk = buf.slice(20, 20 + jsonLen).toString('utf8');
const gltf = JSON.parse(jsonChunk);

console.log('Nodes matching coladezorro:');
const zorroNodes = gltf.nodes.filter(n => n.name && n.name.startsWith('coladezorro'));
console.log('Found', zorroNodes.length, 'coladezorro nodes');

// Show the first 5 parent and child nodes
zorroNodes.slice(0, 10).forEach(n => {
  console.log(n.name, 'mesh:', n.mesh, 'rot:', n.rotation, 'trans:', n.translation, 'scale:', n.scale);
});

