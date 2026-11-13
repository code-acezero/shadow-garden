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

// Find nodes
const nodesToInspect = ['coladezorro012', 'coladezorro012_Material #6_0', 'Plane115', 'Plane115_03_-_Default_0'];
gltf.nodes.forEach((n, idx) => {
  if (n.name && (n.name.includes('coladezorro012') || n.name.includes('Plane115') || n.name.includes('08_-_Default_0'))) {
    console.log(`Node ${idx}: "${n.name}" mesh=${n.mesh} rot=${JSON.stringify(n.rotation)}`);
    if (n.mesh !== undefined) {
      const mesh = gltf.meshes[n.mesh];
      console.log('  Mesh:', mesh.name, 'primitives:', mesh.primitives.length);
      const posAcc = gltf.accessors[mesh.primitives[0].attributes.POSITION];
      console.log('  Pos accessor min:', posAcc.min, 'max:', posAcc.max);
    }
  }
});
