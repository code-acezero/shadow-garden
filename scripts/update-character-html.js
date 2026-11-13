const fs = require('fs');
const crypto = require('crypto');

const files = [
  'public/experiments/character-test.html',
  'public/experiments/experiment-2.html',
  '3d assets/Anime Vampire Girl – Seraphina Nocturne 3D Showcase.html'
];

let html = fs.readFileSync(files[0], 'utf8');

// 1. Remove speech bubble CSS
const speechCssOld = `    /* Subtitle / Speech Bubble HUD */
    #speech-bubble {
      position: absolute;
      top: 68px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 620px;
      width: 90%;
      padding: 12px 20px;
      border-radius: 14px;
      background: rgba(13, 9, 24, 0.85);
      border: 1px solid rgba(192, 132, 252, 0.35);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(168, 85, 247, 0.15);
      backdrop-filter: blur(16px);
      z-index: 25;
      text-align: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #speech-bubble.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    #speech-speaker {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #f43f5e;
      font-weight: 700;
      margin-bottom: 4px;
    }
    #speech-text {
      font-size: 15px;
      line-height: 1.45;
      color: #f8fafc;
      font-weight: 500;
    }`;

if (html.includes(speechCssOld)) {
  html = html.replace(speechCssOld, '');
  console.log('✓ Removed speech bubble CSS');
} else {
  console.warn('Speech CSS not found directly, checking partial');
}

// 2. Remove talk-input-container CSS
const talkInputCss = `    /* Custom Talk Input Form */
    .talk-input-container {
      display: flex;
      width: 100%;
      max-width: 600px;
      gap: 8px;
      padding: 4px;
    }
    .talk-input-container input {
      flex: 1;
      background: rgba(23, 16, 42, 0.8);
      border: 1px solid rgba(168, 85, 247, 0.35);
      border-radius: 10px;
      padding: 8px 14px;
      color: #fff;
      font-size: 13px;
      outline: none;
    }
    .talk-input-container input:focus {
      border-color: #c084fc;
      box-shadow: 0 0 10px rgba(192, 132, 252, 0.25);
    }
    .talk-input-container button {
      background: linear-gradient(135deg, #e11d48 0%, #9333ea 100%);
      border: none;
      border-radius: 10px;
      color: #fff;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s;
    }
    .talk-input-container button:hover {
      transform: scale(1.03);
    }`;

if (html.includes(talkInputCss)) {
  html = html.replace(talkInputCss, '');
  console.log('✓ Removed talk-input-container CSS');
}

// 3. Update top actions: Replace dynamic cam & audio toggle with Reset Pivot
const oldTopActions = `    <div class="top-actions">
      <button class="btn-top" id="btn-cam-face">Face Focus</button>
      <button class="btn-top" id="btn-cam-full">Full Body</button>
      <button class="btn-top" id="btn-cam-dynamic">Dynamic Cam</button>
      <button class="btn-top" id="btn-physics-toggle" class="active">Physics: 120Hz</button>
      <button class="btn-top" id="btn-audio-toggle">Sound: ON</button>
    </div>`;

const newTopActions = `    <div class="top-actions">
      <button class="btn-top" id="btn-cam-face">Face Focus</button>
      <button class="btn-top" id="btn-cam-full">Full Body</button>
      <button class="btn-top" id="btn-cam-reset">Reset Pivot</button>
      <button class="btn-top" id="btn-physics-toggle" class="active">Physics: 120Hz</button>
    </div>`;

if (html.includes(oldTopActions)) {
  html = html.replace(oldTopActions, newTopActions);
  console.log('✓ Updated top actions');
}

// 4. Update status-pill to include Pivot information
const oldStatusPill = `<div id="status-pill">Motion: <span id="cur-motion-label">Vampire Queen Idle</span> · FPS: <span id="fps-label">60</span></div>`;
const newStatusPill = `<div id="status-pill">Motion: <span id="cur-motion-label">Vampire Queen Idle</span> · Pivot: <span id="cur-pivot-label">Center (1.00m)</span> · FPS: <span id="fps-label">60</span></div>`;

if (html.includes(oldStatusPill)) {
  html = html.replace(oldStatusPill, newStatusPill);
  console.log('✓ Updated status-pill');
}

// 5. Remove speech bubble HTML element
const oldSpeechBubble = `  <div id="speech-bubble">
    <div id="speech-speaker">Seraphina Nocturne</div>
    <div id="speech-text">...</div>
  </div>`;

if (html.includes(oldSpeechBubble)) {
  html = html.replace(oldSpeechBubble, '');
  console.log('✓ Removed speech bubble HTML');
}

// 6. Update interaction hint
const oldHint = `<div id="interaction-hint">Hover or Click her Cat Ears / Head to interact · Drag mouse to orbit</div>`;
const newHint = `<div id="interaction-hint">Click anywhere on Seraphina to set 3D rotation center · Scroll to zoom smoothly · Drag to orbit</div>`;

if (html.includes(oldHint)) {
  html = html.replace(oldHint, newHint);
  console.log('✓ Updated interaction hint');
}

// 7. Update dock tabs: Replace talk with focus
const oldTabs = `      <button class="dock-tab-btn active" data-tab="domineering">👑 Domineering</button>
      <button class="dock-tab-btn" data-tab="cute">🐱 Cute Emotes</button>
      <button class="dock-tab-btn" data-tab="dance">💃 Dance & Flow</button>
      <button class="dock-tab-btn" data-tab="combat">⚔️ Combat & Martial</button>
      <button class="dock-tab-btn" data-tab="talk">💬 Talk & Visemes</button>
      <button class="dock-tab-btn" data-tab="physics">⚙️ Physics Lab</button>`;

const newTabs = `      <button class="dock-tab-btn active" data-tab="domineering">👑 Domineering</button>
      <button class="dock-tab-btn" data-tab="cute">🐱 Cute Emotes</button>
      <button class="dock-tab-btn" data-tab="dance">💃 Dance & Flow</button>
      <button class="dock-tab-btn" data-tab="combat">⚔️ Combat & Martial</button>
      <button class="dock-tab-btn" data-tab="focus">🎯 Focus & Pivots</button>
      <button class="dock-tab-btn" data-tab="physics">⚙️ Physics Lab</button>`;

if (html.includes(oldTabs)) {
  html = html.replace(oldTabs, newTabs);
  console.log('✓ Updated dock tabs');
}

// Write to all 3 files
files.forEach(f => {
  fs.writeFileSync(f, html, 'utf8');
});

console.log('Hashes:');
files.forEach(f => {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  console.log(f, ':', hash);
});

