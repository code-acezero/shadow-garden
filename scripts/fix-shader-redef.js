const fs = require('fs');
const crypto = require('crypto');

const file1 = 'public/experiments/floating-island.html';
const file2 = '3d assets/Floating Island – Shrine Gate to Mana Portal.html';

let content = fs.readFileSync(file1, 'utf8').replace(/\r\n/g, '\n');

const oldTerrainShader = `          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            \`#ifdef USE_MAP
              // Smooth seamless high-frequency soil micro-detail
              vec2 soilUV = vTerrainWorldPos.xz * 0.00045;
              vec4 soilTex = texture2D(map, soilUV);
              float soilLuma = dot(soilTex.rgb, vec3(0.299, 0.587, 0.114));

              \${isTopIsland ? \`
              // Top Island: Rich damp mud loam base with beaten earth road leading to bridge at X = -4400
              vec2 soilUV = vTerrainWorldPos.xz * 0.00045;
              vec4 soilTex = texture2D(map, soilUV);
              float soilLuma = dot(soilTex.rgb, vec3(0.299, 0.587, 0.114));
              vec3 darkMud = vec3(0.048, 0.072, 0.030) * (0.80 + 0.35 * soilLuma);
              vec4 sampledDiffuseColor = vec4(darkMud, 1.0);`;

const newTerrainShader = `          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            \`#ifdef USE_MAP
              \${isTopIsland ? \`
              // Top Island: Rich damp mud loam base with beaten earth road leading to bridge at X = -4400
              vec2 soilUV = vTerrainWorldPos.xz * 0.00045;
              vec4 soilTex = texture2D(map, soilUV);
              float soilLuma = dot(soilTex.rgb, vec3(0.299, 0.587, 0.114));
              vec3 darkMud = vec3(0.048, 0.072, 0.030) * (0.80 + 0.35 * soilLuma);
              vec4 sampledDiffuseColor = vec4(darkMud, 1.0);`;

if (!content.includes(oldTerrainShader)) {
  console.error('ERROR: oldTerrainShader not found!');
  process.exit(1);
}

content = content.replace(oldTerrainShader, newTerrainShader);
console.log('✓ Fixed shader variable redefinition in syncTerrainMaterials');

fs.writeFileSync(file1, content, 'utf8');
fs.writeFileSync(file2, content, 'utf8');

const h1 = crypto.createHash('sha256').update(fs.readFileSync(file1)).digest('hex');
const h2 = crypto.createHash('sha256').update(fs.readFileSync(file2)).digest('hex');
console.log('file1 hash:', h1);
console.log('file2 hash:', h2);
console.log('Byte-for-byte SHA256 identical:', h1 === h2);
