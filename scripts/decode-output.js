const fs = require('fs');
const path = require('path');

const srcFile = process.argv[2];
const destFile = process.argv[3];

if (!srcFile || !destFile) {
  console.error('Usage: node scripts/decode-output.js <srcFile> <destFile>');
  process.exit(1);
}

let raw = fs.readFileSync(srcFile, 'utf8').trim();
if (raw.startsWith('"') && raw.endsWith('"')) {
  try {
    raw = JSON.parse(raw);
  } catch (e) {
    raw = raw.slice(1, -1);
  }
}

const match = raw.match(/^data:image\/[a-zA-Z+]+;base64,(.+)$/s);
const base64Data = match ? match[1] : raw;

fs.writeFileSync(destFile, Buffer.from(base64Data, 'base64'));
console.log('Wrote', destFile, 'bytes:', fs.statSync(destFile).size);
