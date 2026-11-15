const fs = require('fs');
const content = fs.readFileSync('public/experiments/kagemi-island.html', 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('<div id="ui"') || l.includes('function bindGenshinEvents()') || l.includes('window.__ISLAND = {') || l.includes('function frame(d) {')) {
    console.log((i + 1) + ': ' + l.trim());
  }
}
