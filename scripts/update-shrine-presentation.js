const fs = require('fs');
const crypto = require('crypto');

const filePath1 = 'public/experiments/floating-island.html';
const filePath2 = '3d assets/Floating Island \u2013 Shrine Gate to Mana Portal.html';

let content = fs.readFileSync(filePath1, 'utf8');

// 1. Update shrine elevation and rotation so it faces the walkway
const oldShrineBlock = `      // Move stone shrine altar (polySurface7) and fire (polySurface6) to the right side of the walkway so the path stays clear
      const ps7 = model.getObjectByName('polySurface7');
      const ps6 = model.getObjectByName('polySurface6');
      if (ps7 && ps6) {
        const localDx = -1200 / 220;
        const localDy = 80 / 220;
        const localDz = 2800 / 220;
        ps7.position.x += localDx;
        ps7.position.y += localDy;
        ps7.position.z += localDz;
        ps6.position.x += localDx;
        ps6.position.y += localDy;
        ps6.position.z += localDz;
        ps7.rotation.y += -0.35;
        ps6.rotation.y += -0.35;
        ps7.updateMatrixWorld(true);
        ps6.updateMatrixWorld(true);
      }`;

const newShrineBlock = `      // Move stone shrine altar (polySurface7) and fire (polySurface6) to the right side of the walkway and face the approaching path
      const ps7 = model.getObjectByName('polySurface7');
      const ps6 = model.getObjectByName('polySurface6');
      if (ps7 && ps6) {
        const localDx = -1200 / 220;
        const localDy = 120 / 220;
        const localDz = 2800 / 220;
        ps7.position.x += localDx;
        ps7.position.y += localDy;
        ps7.position.z += localDz;
        ps6.position.x += localDx;
        ps6.position.y += localDy;
        ps6.position.z += localDz;
        ps7.rotation.y = -Math.PI * 0.75;
        ps6.rotation.y = -Math.PI * 0.75;
        ps7.updateMatrixWorld(true);
        ps6.updateMatrixWorld(true);
      }`;

if (!content.includes(oldShrineBlock)) {
  console.error('Could not find oldShrineBlock');
  process.exit(1);
}
content = content.replace(oldShrineBlock, newShrineBlock);

// 2. Update material colors for isAltar and isReeds
const oldColorBlock = `          const isCliff = n.includes('lambert1_0');
          const isAltar = n.includes('lambert14') || n.includes('polySurface7');
          const isChest = n.includes('lambert15') || n.includes('Chest');

          const col = isCliff ? 0x0d151e :
                      isGrass ? 0x1a4022 :
                      isReeds ? 0x183428 :
                      isLeaves ? 0x1c1424 :
                      isRock ? 0x16222e :
                      isWood ? 0x2e2420 :
                      isAltar ? 0x202b36 :
                      isChest ? 0x2c221a : 0x16222e;`;

const newColorBlock = `          const isCliff = n.includes('lambert1_0');
          const isAltar = n.includes('lambert14') || n.includes('polySurface7');
          const isChest = n.includes('lambert15') || n.includes('Chest');

          const col = isCliff ? 0x0d151e :
                      isGrass ? 0x1a4022 :
                      isReeds ? 0x486b36 :
                      isLeaves ? 0x1c1424 :
                      isRock ? 0x16222e :
                      isWood ? 0x2e2420 :
                      isAltar ? 0xf4eee6 :
                      isChest ? 0x2c221a : 0x16222e;`;

if (!content.includes(oldColorBlock)) {
  console.error('Could not find oldColorBlock');
  process.exit(1);
}
content = content.replace(oldColorBlock, newColorBlock);

// 3. Add shrine flank foliage in populateDioramaFoliage
const oldFoliageBlock = `      // Lower Island foliage distribution (X: -31000 to -25500)`;
const newFoliageBlock = `      // Shrine surround foliage (framing both sides of shrine stairs matching reference image)
      const shrineFlanks = [
        { cx: -6550, cz: 3880, r: 420 },
        { cx: -5720, cz: 3260, r: 420 },
        { cx: -6400, cz: 3180, r: 360 }
      ];
      for (const flank of shrineFlanks) {
        for (let j = 0; j < 14; j++) {
          const fx = flank.cx + (rnd() - 0.5) * flank.r * 2;
          const fz = flank.cz + (rnd() - 0.5) * flank.r * 2;
          const fy = findGround(fx, fz, 'top');
          if (fy !== null) {
            grassPts.push({ x: fx, y: fy, z: fz });
            if (j % 2 === 0) reedPts.push({ x: fx, y: fy, z: fz });
            if (j % 3 === 0) flowerPts.push({ x: fx, y: fy, z: fz });
          }
        }
      }

      // Lower Island foliage distribution (X: -31000 to -25500)`;

if (!content.includes(oldFoliageBlock)) {
  console.error('Could not find oldFoliageBlock');
  process.exit(1);
}
content = content.replace(oldFoliageBlock, newFoliageBlock);

fs.writeFileSync(filePath1, content, 'utf8');
fs.writeFileSync(filePath2, content, 'utf8');

const hash1 = crypto.createHash('sha256').update(fs.readFileSync(filePath1)).digest('hex');
const hash2 = crypto.createHash('sha256').update(fs.readFileSync(filePath2)).digest('hex');

console.log('Update completed!');
console.log('File 1 SHA256:', hash1);
console.log('File 2 SHA256:', hash2);
console.log('Identical:', hash1 === hash2);

