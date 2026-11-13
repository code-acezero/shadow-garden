const fs = require('fs');
const content = fs.readFileSync('d:/Downloads/anime-companion-standalone (1).html', 'utf8');
const startTag = 'const GLB="';
const startIdx = content.indexOf(startTag);
if (startIdx !== -1) {
  const endIdx = content.indexOf('"', startIdx + startTag.length);
  const base64Str = content.slice(startIdx + startTag.length, endIdx);
  const buf = Buffer.from(base64Str, 'base64');
  fs.writeFileSync('scripts/extracted-model.glb', buf);
  console.log('Extracted GLB size:', buf.length);
  const jsonChunkLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonChunkLen);
  const gltf = JSON.parse(jsonStr);
  console.log('Nodes count:', gltf.nodes.length);
  const nodeNames = gltf.nodes.map(n => n.name).filter(Boolean);
  console.log('First 30 node names:', nodeNames.slice(0, 30));
  console.log('Has J_Bip:', nodeNames.some(n => n.includes('J_Bip')));
  console.log('Has Left_arm:', nodeNames.some(n => n.includes('Left_arm')));
  console.log('Has Hair:', nodeNames.filter(n => /Hair/i.test(n)).slice(0, 10));
}

