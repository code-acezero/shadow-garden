const fs = require('fs');
const crypto = require('crypto');

const targetFile = 'public/experiments/floating-island.html';
const mirrorFile = '3d assets/Floating Island – Shrine Gate to Mana Portal.html';

let html = fs.readFileSync(targetFile, 'utf8');

// 1. Update createSmoothTerrainMat color to exact matched deep teal-moss: (0.11, 0.35, 0.40)
html = html.replace(
  'color: new THREE.Color(0.72, 0.95, 0.38),',
  'color: new THREE.Color(0.11, 0.35, 0.40), // exact matched deep twilight teal-moss to main island'
);

// 2. In setup(root): Update coladezorro to pure white plumes, lajas to purple gems, Plane 08 to purple flowers
const oldSetupColors = `        // Main island meadow flowers (260 meshes): vibrant purple matching cherry tree
        if (n.startsWith('Plane') && n.includes('08_-_Default_0')) {
          m.color = new THREE.Color(0xd86bf4);
          m.emissive = new THREE.Color(0x581c87);
          m.emissiveIntensity = 0.45;
          m.side = THREE.DoubleSide;
        }
        // Grass blades & tufts (732 meshes): lush twilight emerald
        else if (n.startsWith('Plane')) {
          m.color.setRGB(0.70, 0.96, 0.30);
          m.roughness = 0.88;
        }
        // Sakura tree blossoms & falling petals: radiant cherry blossom purple
        else if (n.startsWith('sakuraplano') || n.startsWith('petalo')) {
          m.color = new THREE.Color(0xd86bf4);
          m.emissive = new THREE.Color(0x581c87);
          m.emissiveIntensity = 0.45;
          m.side = THREE.DoubleSide;
        }
        // Tall reeds along walkway (129 meshes): natural moonlit sage
        else if (n.startsWith('coladezorro')) {
          m.color.setRGB(0.72, 0.95, 0.32);
          m.roughness = 0.85;
        }
        // Main island terrain ground: deep moss loam
        else if (n.includes('tierra')) {
          m.color.setRGB(0.75, 0.95, 0.32);
          m.roughness = 0.92;
          tierraMat = m;
        }
        // Sacred stones around the shrine pillars: radiant glowing purple amethyst gems!
        else if (n.startsWith('lajas')) {
          m.color = new THREE.Color(0x9333ea);
          m.emissive = new THREE.Color(0x7e22ce);
          m.emissiveIntensity = 0.55;
          m.roughness = 0.28;
          m.metalness = 0.12;
          m.side = THREE.DoubleSide;
        }`;

const newSetupColors = `        // Main island meadow flowers (260 meshes): vibrant purple matching cherry tree
        if (n.startsWith('Plane') && n.includes('08_-_Default_0')) {
          m.color = new THREE.Color(0xd86bf4);
          m.emissive = new THREE.Color(0x581c87);
          m.emissiveIntensity = 0.45;
          m.side = THREE.DoubleSide;
        }
        // Grass blades & tufts (732 meshes): lush twilight emerald
        else if (n.startsWith('Plane')) {
          m.color.setRGB(0.70, 0.96, 0.30);
          m.roughness = 0.88;
        }
        // Sakura tree blossoms & falling petals: radiant cherry blossom purple
        else if (n.startsWith('sakuraplano') || n.startsWith('petalo')) {
          m.color = new THREE.Color(0xd86bf4);
          m.emissive = new THREE.Color(0x581c87);
          m.emissiveIntensity = 0.45;
          m.side = THREE.DoubleSide;
        }
        // Long flowering reeds along walkway (129 meshes): pure white foxtail plumes
        else if (n.startsWith('coladezorro')) {
          m.color = new THREE.Color(0xf8fafc);
          m.emissive = new THREE.Color(0xe2e8f0);
          m.emissiveIntensity = 0.38;
          m.roughness = 0.85;
          m.side = THREE.DoubleSide;
        }
        // Main island terrain ground: deep moss loam
        else if (n.includes('tierra')) {
          m.color.setRGB(0.75, 0.95, 0.32);
          m.roughness = 0.92;
          tierraMat = m;
        }
        // Sacred stones around the shrine pillars: radiant glowing purple amethyst gems!
        else if (n.startsWith('lajas')) {
          m.color = new THREE.Color(0x9333ea);
          m.emissive = new THREE.Color(0x7e22ce);
          m.emissiveIntensity = 0.55;
          m.roughness = 0.28;
          m.metalness = 0.12;
          m.side = THREE.DoubleSide;
        }`;

if (html.includes(oldSetupColors)) {
  html = html.replace(oldSetupColors, newSetupColors);
  console.log('2. Updated setup() colors with white long flowers');
} else {
  console.warn('2. Warning: oldSetupColors not matched');
}

// 3. In populateDioramaFoliage:
// Capture srcFlower from mainIsland (Plane..._08_-_Default_0) so flowers are 3D clusters
// Elevate flowers upright so they are never grounded or clipped into dirt
const oldCaptureFoliage = `      let srcGrass = null, srcReed = null, sakura = null;
      mainIsland.traverse(o => {
        if (!o.isMesh) return;
        if (!srcGrass && o.name === 'Plane115_03_-_Default_0') srcGrass = o;
        if (!srcReed && o.name === 'coladezorro012_Material_#6_0') srcReed = o;
        if (!sakura && o.name === 'sakuraplano005_12_-_Default_0') sakura = o;
      });

      if (!srcGrass || !srcReed || !sakura) return;`;

const newCaptureFoliage = `      let srcGrass = null, srcReed = null, sakura = null, srcFlower = null;
      mainIsland.traverse(o => {
        if (!o.isMesh) return;
        if (!srcGrass && o.name === 'Plane115_03_-_Default_0') srcGrass = o;
        if (!srcReed && o.name === 'coladezorro012_Material_#6_0') srcReed = o;
        if (!sakura && o.name === 'sakuraplano005_12_-_Default_0') sakura = o;
        if (!srcFlower && o.name.includes('08_-_Default_0')) srcFlower = o;
      });

      if (!srcGrass || !sakura) return;`;

if (html.includes(oldCaptureFoliage)) {
  html = html.replace(oldCaptureFoliage, newCaptureFoliage);
  console.log('3a. Added srcFlower capture (Plane..._08_-_Default_0)');
} else {
  console.warn('3a. Warning: oldCaptureFoliage not matched');
}

// Replace flower mesh creation to use 3D flower cluster geometry and upright elevation
const oldFlowerInstInit = `      const flowerInst = new THREE.InstancedMesh(sakura.geometry, flowerMat, flowerPts.length);
      flowerInst.name = 'dioramaFoliageFlowers';
      // Multi-tonal cherry tree purple palette
      const purplePalette = [
        new THREE.Color(0xd86bf4), // bright radiant orchid
        new THREE.Color(0xc084fc), // glowing lilac
        new THREE.Color(0x9333ea), // royal amethyst
        new THREE.Color(0xa855f7), // luminous violet
        new THREE.Color(0xe9d5ff), // soft ethereal lavender
        new THREE.Color(0xec4899)  // cherry blossom magenta
      ];
      for (let i = 0; i < flowerPts.length; i++) {
        const p = flowerPts[i];
        dummy.position.set(p.x, p.y + 45, p.z);
        dummy.rotation.set((rnd() - 0.5) * 0.2, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.2);
        const s = 85 + rnd() * 45;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        flowerInst.setMatrixAt(i, dummy.matrix);
        flowerInst.setColorAt(i, purplePalette[i % purplePalette.length]);
      }`;

const newFlowerInstInit = `      const flowerGeo = (srcFlower && srcFlower.geometry) ? srcFlower.geometry : sakura.geometry;
      const flowerInst = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerPts.length);
      flowerInst.name = 'dioramaFoliageFlowers';
      // Multi-tonal cherry tree purple palette
      const purplePalette = [
        new THREE.Color(0xd86bf4), // bright radiant orchid
        new THREE.Color(0xc084fc), // glowing lilac
        new THREE.Color(0x9333ea), // royal amethyst
        new THREE.Color(0xa855f7), // luminous violet
        new THREE.Color(0xe9d5ff), // soft ethereal lavender
        new THREE.Color(0xec4899)  // cherry blossom magenta
      ];
      for (let i = 0; i < flowerPts.length; i++) {
        const p = flowerPts[i];
        const s = 90 + rnd() * 35;
        // Upright vertical orientation: bottom rests cleanly on ground surface, zero flat clipping
        dummy.position.set(p.x, p.y + s * 0.58, p.z);
        dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        flowerInst.setMatrixAt(i, dummy.matrix);
        flowerInst.setColorAt(i, purplePalette[i % purplePalette.length]);
      }`;

if (html.includes(oldFlowerInstInit)) {
  html = html.replace(oldFlowerInstInit, newFlowerInstInit);
  console.log('3b. Updated flowerInst to use 3D flower cluster geometry and upright elevation');
} else {
  console.warn('3b. Warning: oldFlowerInstInit not matched');
}

// Write to public/experiments/floating-island.html
fs.writeFileSync(targetFile, html, 'utf8');
console.log('Successfully wrote', targetFile);

// Mirror byte-for-byte to 3d assets/
fs.writeFileSync(mirrorFile, html, 'utf8');
console.log('Successfully mirrored to', mirrorFile);

// Verify SHA256 hashes
const h1 = crypto.createHash('sha256').update(fs.readFileSync(targetFile)).digest('hex');
const h2 = crypto.createHash('sha256').update(fs.readFileSync(mirrorFile)).digest('hex');
console.log('SHA256 target:', h1);
console.log('SHA256 mirror:', h2);
if (h1 === h2) {
  console.log('✓ Invariant verified: Files are 100% byte-for-byte SHA256 identical');
} else {
  console.error('✗ ERROR: SHA256 mismatch!');
  process.exit(1);
}

