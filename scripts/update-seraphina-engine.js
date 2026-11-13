const fs = require('fs');

const file = 'public/experiments/seraphina-engine.js';
let code = fs.readFileSync(file, 'utf8');

// 1. Update controls configuration for deep macro zoom & smooth damping
const oldControls = `const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 0.6;
controls.maxDistance = 5.5;
controls.maxPolarAngle = Math.PI * 0.52;
controls.update();`;

const newControls = `const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.05; // Macro zoom: allows zooming in right up to eyelashes, fangs, jewelry!
controls.maxDistance = 10.0; // Wide stage zoom
controls.zoomSpeed = 1.15;
controls.rotateSpeed = 0.85;
controls.panSpeed = 0.85;
controls.maxPolarAngle = Math.PI * 0.53;
controls.update();

// --- 3D Rotation Center Pivot & Smooth Camera Interpolation System ---
const pivotAnim = {
  active: false,
  startTarget: new THREE.Vector3(),
  endTarget: new THREE.Vector3(),
  startCamPos: new THREE.Vector3(),
  endCamPos: new THREE.Vector3(),
  startTime: 0,
  duration: 280,
  moveCamera: false
};

// 3D Visual Reticle Marker shown at the clicked point
const reticleCanvas = document.createElement('canvas');
reticleCanvas.width = reticleCanvas.height = 128;
const rCtx = reticleCanvas.getContext('2d');
// Outer glowing ring
rCtx.strokeStyle = '#c084fc';
rCtx.lineWidth = 4;
rCtx.shadowColor = '#a855f7';
rCtx.shadowBlur = 8;
rCtx.beginPath();
rCtx.arc(64, 64, 46, 0, Math.PI * 2);
rCtx.stroke();
// Crimson accent ring
rCtx.strokeStyle = '#f43f5e';
rCtx.lineWidth = 2.5;
rCtx.beginPath();
rCtx.arc(64, 64, 28, 0, Math.PI * 2);
rCtx.stroke();
// Precision crosshairs
rCtx.strokeStyle = '#ffffff';
rCtx.lineWidth = 2;
rCtx.beginPath();
rCtx.moveTo(64, 8); rCtx.lineTo(64, 24);
rCtx.moveTo(64, 104); rCtx.lineTo(64, 120);
rCtx.moveTo(8, 64); rCtx.lineTo(24, 64);
rCtx.moveTo(104, 64); rCtx.lineTo(120, 64);
rCtx.stroke();
// Center pinpoint
rCtx.fillStyle = '#ffffff';
rCtx.beginPath();
rCtx.arc(64, 64, 3, 0, Math.PI * 2);
rCtx.fill();

const reticleTex = new THREE.CanvasTexture(reticleCanvas);
const reticleMat = new THREE.SpriteMaterial({
  map: reticleTex,
  color: 0xffffff,
  transparent: true,
  opacity: 0,
  depthTest: false,
  depthWrite: false
});
const reticleSprite = new THREE.Sprite(reticleMat);
reticleSprite.scale.set(0.12, 0.12, 0.12);
reticleSprite.visible = false;
reticleSprite.renderOrder = 999;
scene.add(reticleSprite);

let reticleTimer = 0;
function showPivotReticle(point) {
  reticleSprite.position.copy(point);
  reticleSprite.visible = true;
  reticleMat.opacity = 1.0;
  reticleSprite.scale.set(0.08, 0.08, 0.08);
  reticleTimer = 0.5;
}

function setRotationPivot(point, keepOffset = true, customCamPos = null) {
  showPivotReticle(point);

  pivotAnim.active = true;
  pivotAnim.startTarget.copy(controls.target);
  pivotAnim.endTarget.copy(point);
  pivotAnim.startCamPos.copy(camera.position);

  if (customCamPos) {
    pivotAnim.endCamPos.copy(customCamPos);
    pivotAnim.moveCamera = true;
  } else if (keepOffset) {
    const offset = camera.position.clone().sub(controls.target);
    pivotAnim.endCamPos.copy(point).add(offset);
    pivotAnim.moveCamera = true;
  } else {
    pivotAnim.moveCamera = false;
  }

  pivotAnim.startTime = performance.now();
  pivotAnim.duration = 280;

  // Update anatomical label for user feedback
  let label = 'Custom Pivot';
  if (point.y > 1.38) label = 'Head / Face';
  else if (point.y > 1.15) label = 'Neck & Collar';
  else if (point.y > 0.85) label = 'Torso & Arms';
  else if (point.y > 0.45) label = 'Skirt & Hips';
  else label = 'Boots & Feet';

  const pivotLabel = document.getElementById('cur-pivot-label');
  if (pivotLabel) pivotLabel.textContent = \`\${label} (\${point.y.toFixed(2)}m)\`;
}`;

if (!code.includes(oldControls)) {
  console.error('ERROR: oldControls not found');
  process.exit(1);
}
code = code.replace(oldControls, newControls);
console.log('✓ Replaced controls & added pivot/reticle system');

// 2. Remove contextual sound triggers from setMotion
const oldSoundTriggers = `    // Trigger contextual sounds
    if (motionId.includes('nyaa') || motionId.includes('paws')) audio.earTwitch();
    else if (motionId.includes('slash') || motionId.includes('claw') || motionId.includes('kick')) audio.magicSlash();
    else if (motionId.includes('aura') || motionId.includes('kneel')) audio.bloodAura();
    else if (motionId.includes('spin') || motionId.includes('waltz') || motionId.includes('cape')) audio.whoosh();
    else audio.click();`;

if (code.includes(oldSoundTriggers)) {
  code = code.replace(oldSoundTriggers, '');
  console.log('✓ Removed sound triggers from setMotion');
}

// 3. Update DOCK_TABS: replace talk with focus & pivots, add dance/combat poses
const oldDockTabs = `// --- User Interface & Tab Action Systems ---
const DOCK_TABS = {
  domineering: [
    { id: 'queen_idle', label: 'Vampire Queen Idle' },
    { id: 'kneel_command', label: 'Command: Kneel Before Me' },
    { id: 'blood_orb', label: 'Summon Crimson Mana Orb' },
    { id: 'smug_crossed', label: 'Smug Arms Crossed' }
  ],
  cute: [
    { id: 'nyaa_paws', label: 'Nyaa~ Cat Paw Dance' },
    { id: 'double_peace', label: 'Idol Double Peace (V-Sign)' },
    { id: 'tsundere_pout', label: 'Tsundere Pout ("Hmph!")' }
  ],
  combat: [
    { id: 'shadow_blade', label: 'Shadow Blade Crouch Stance' }
  ],
  talk: [
    { id: 'talk_tease', label: 'Teasing: "Ara ara..."', text: "Ara ara... did you come all this way into my domain just to stare at me like that, human?" },
    { id: 'talk_command', label: 'Command: "Bow down..."', text: "Bow down and acknowledge your vampire queen, mortal." },
    { id: 'talk_cat', label: 'Cat Vampire: "Nyaa~"', text: "Nyaa~ If you pet my cat ears gently, I might consider sparing your neck for tonight..." }
  ]
};`;

const newDockTabs = `// --- User Interface & Tab Action Systems ---
const DOCK_TABS = {
  domineering: [
    { id: 'queen_idle', label: 'Vampire Queen Idle' },
    { id: 'kneel_command', label: 'Command: Kneel Before Me' },
    { id: 'blood_orb', label: 'Summon Crimson Mana Orb' },
    { id: 'smug_crossed', label: 'Smug Arms Crossed' }
  ],
  cute: [
    { id: 'nyaa_paws', label: 'Nyaa~ Cat Paw Dance' },
    { id: 'double_peace', label: 'Idol Double Peace (V-Sign)' },
    { id: 'tsundere_pout', label: 'Tsundere Pout ("Hmph!")' }
  ],
  dance: [
    { id: 'queen_idle', label: 'Graceful Royal Stand' },
    { id: 'nyaa_paws', label: 'Playful Step & Sway' },
    { id: 'smug_crossed', label: 'Elegant Aristocrat Pose' }
  ],
  combat: [
    { id: 'shadow_blade', label: 'Shadow Blade Crouch Stance' }
  ],
  focus: [
    { id: 'pivot_face', label: '👑 Face & Cat Ears (1.48m)', point: new THREE.Vector3(0, 1.48, 0), camPos: new THREE.Vector3(0, 1.48, 0.45) },
    { id: 'pivot_eyes', label: '👁️ Crimson Eyes Macro (1.45m)', point: new THREE.Vector3(0, 1.455, 0.08), camPos: new THREE.Vector3(0, 1.455, 0.22) },
    { id: 'pivot_choker', label: '📿 Ribbon Choker (1.30m)', point: new THREE.Vector3(0, 1.30, 0.05), camPos: new THREE.Vector3(0, 1.30, 0.45) },
    { id: 'pivot_corset', label: '💎 Gothic Corset (1.05m)', point: new THREE.Vector3(0, 1.05, 0), camPos: new THREE.Vector3(0, 1.05, 0.85) },
    { id: 'pivot_hands', label: '🧤 Vampire Claws (0.92m)', point: new THREE.Vector3(0.35, 0.92, 0.15), camPos: new THREE.Vector3(0.35, 0.92, 0.65) },
    { id: 'pivot_boots', label: '👢 Leather Boots (0.22m)', point: new THREE.Vector3(0, 0.22, 0), camPos: new THREE.Vector3(0, 0.35, 0.95) },
    { id: 'pivot_center', label: '🌟 Model Center (1.00m)', point: new THREE.Vector3(0, 1.00, 0), camPos: new THREE.Vector3(0, 1.25, 2.5) }
  ]
};`;

if (!code.includes(oldDockTabs)) {
  console.error('ERROR: oldDockTabs not found');
  process.exit(1);
}
code = code.replace(oldDockTabs, newDockTabs);
console.log('✓ Replaced DOCK_TABS with focus & pivots');

// 4. Update renderDockTab and remove speakDialogue
const oldRenderAndSpeak = `function renderDockTab(tabName) {
  const panel = document.getElementById('dock-panel-content');
  if (!panel) return;
  panel.innerHTML = '';

  const items = DOCK_TABS[tabName] || [];
  items.forEach(item => {
    const chip = document.createElement('button');
    chip.className = \`action-chip \${seraphina.currentMotion === item.id ? 'active' : ''}\`;
    chip.textContent = item.label;
    chip.onclick = () => {
      audio.init();
      document.querySelectorAll('.action-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (tabName === 'talk') {
        speakDialogue(item.text);
      } else {
        seraphina.setMotion(item.id);
      }
    };
    panel.appendChild(chip);
  });

  if (tabName === 'talk') {
    const customDiv = document.createElement('div');
    customDiv.className = 'talk-input-container';
    customDiv.innerHTML = \`
      <input type="text" id="custom-speech-input" placeholder="Type anything for Seraphina to speak with real lip-sync...">
      <button id="btn-speak-custom">Speak</button>
    \`;
    panel.appendChild(customDiv);

    const input = document.getElementById('custom-speech-input');
    const speakBtn = document.getElementById('btn-speak-custom');
    const handleCustom = () => {
      const val = input.value.trim();
      if (val) speakDialogue(val);
    };
    speakBtn.onclick = handleCustom;
    input.onkeydown = (e) => { if (e.key === 'Enter') handleCustom(); };
  }
}

// Dialogue Display & Speech Synthesis
function speakDialogue(text) {
  audio.init();
  const bubble = document.getElementById('speech-bubble');
  const speechText = document.getElementById('speech-text');
  if (bubble && speechText) {
    speechText.textContent = text;
    bubble.classList.add('visible');
    clearTimeout(window.__speechTimeout);
    window.__speechTimeout = setTimeout(() => {
      bubble.classList.remove('visible');
    }, Math.max(3500, text.length * 90));
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.35;
    utterance.rate = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Kyoko') || v.name.includes('Samantha'));
    if (femaleVoice) utterance.voice = femaleVoice;
    window.speechSynthesis.speak(utterance);
  }
}`;

const newRenderAndSpeak = `function renderDockTab(tabName) {
  const panel = document.getElementById('dock-panel-content');
  if (!panel) return;
  panel.innerHTML = '';

  const items = DOCK_TABS[tabName] || [];
  items.forEach(item => {
    const chip = document.createElement('button');
    const isFocus = (tabName === 'focus');
    chip.className = \`action-chip \${!isFocus && seraphina.currentMotion === item.id ? 'active' : ''}\`;
    chip.textContent = item.label;
    chip.onclick = () => {
      document.querySelectorAll('.action-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (isFocus) {
        setRotationPivot(item.point, false, item.camPos);
      } else {
        seraphina.setMotion(item.id);
      }
    };
    panel.appendChild(chip);
  });
}`;

if (!code.includes(oldRenderAndSpeak)) {
  console.error('ERROR: oldRenderAndSpeak not found');
  process.exit(1);
}
code = code.replace(oldRenderAndSpeak, newRenderAndSpeak);
console.log('✓ Replaced renderDockTab & removed all speech synthesis / dialogue');

// 5. Update header buttons and click-to-pivot raycasting
const oldHeaderAndPointer = `// Top Action Controls
document.getElementById('btn-cam-face').onclick = () => {
  controls.target.set(0, 1.48, 0);
  camera.position.set(0, 1.48, 0.95);
  controls.update();
  audio.click();
};
document.getElementById('btn-cam-full').onclick = () => {
  controls.target.set(0, 0.95, 0);
  camera.position.set(0, 1.25, 2.7);
  controls.update();
  audio.click();
};
document.getElementById('btn-cam-dynamic').onclick = () => {
  controls.target.set(0, 1.1, 0);
  camera.position.set(1.2, 1.4, 2.1);
  controls.update();
  audio.click();
};
document.getElementById('btn-physics-toggle').onclick = (e) => {
  seraphina.physicsEnabled = !seraphina.physicsEnabled;
  e.target.textContent = \`Physics: \${seraphina.physicsEnabled ? '120Hz ON' : 'OFF'}\`;
  e.target.classList.toggle('active', seraphina.physicsEnabled);
  audio.click();
};
document.getElementById('btn-audio-toggle').onclick = (e) => {
  audio.init();
  audio.enabled = !audio.enabled;
  e.target.textContent = \`Sound: \${audio.enabled ? 'ON' : 'OFF'}\`;
  e.target.classList.toggle('active', audio.enabled);
};

// Mouse move tracking (Normalized device coordinates [-1, 1])
const mouse = new THREE.Vector2(-999, -999);
const raycaster = new THREE.Raycaster();

window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('pointerdown', (e) => {
  audio.init();
  raycaster.setFromCamera(mouse, camera);
  if (seraphina.model) {
    const hits = raycaster.intersectObjects(seraphina.model.children, true);
    if (hits.length > 0) {
      const hitPoint = hits[0].point;
      if (hitPoint.y > 1.4) {
        seraphina.earTwitchTimer = 0.05;
        audio.purr();
        speakDialogue("Nyaa~ That tickles! Be gentle with my ears...");
      }
    }
  }
});`;

const newHeaderAndPointer = `// Top Action Controls
const btnCamFace = document.getElementById('btn-cam-face');
if (btnCamFace) {
  btnCamFace.onclick = () => {
    setRotationPivot(new THREE.Vector3(0, 1.48, 0), false, new THREE.Vector3(0, 1.48, 0.45));
  };
}

const btnCamFull = document.getElementById('btn-cam-full');
if (btnCamFull) {
  btnCamFull.onclick = () => {
    setRotationPivot(new THREE.Vector3(0, 0.95, 0), false, new THREE.Vector3(0, 1.25, 2.5));
  };
}

const btnCamReset = document.getElementById('btn-cam-reset');
if (btnCamReset) {
  btnCamReset.onclick = () => {
    setRotationPivot(new THREE.Vector3(0, 1.0, 0), true);
  };
}

const btnPhysicsToggle = document.getElementById('btn-physics-toggle');
if (btnPhysicsToggle) {
  btnPhysicsToggle.onclick = (e) => {
    seraphina.physicsEnabled = !seraphina.physicsEnabled;
    e.target.textContent = \`Physics: \${seraphina.physicsEnabled ? '120Hz ON' : 'OFF'}\`;
    e.target.classList.toggle('active', seraphina.physicsEnabled);
  };
}

// Mouse move tracking & Click-to-Pivot Re-centering
const mouse = new THREE.Vector2(-999, -999);
const raycaster = new THREE.Raycaster();

window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Click Discrimination: clicking anywhere on the character marks that point as center for 3D rotation
let pointerDownX = 0, pointerDownY = 0, pointerDownTime = 0, isPointerDownOnCanvas = false;

window.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#control-dock') || e.target.closest('header') || e.target.closest('#status-pill') || e.target.closest('#loader')) return;
  pointerDownX = e.clientX;
  pointerDownY = e.clientY;
  pointerDownTime = performance.now();
  isPointerDownOnCanvas = true;
});

window.addEventListener('pointerup', (e) => {
  if (!isPointerDownOnCanvas) return;
  isPointerDownOnCanvas = false;
  if (e.target.closest('#control-dock') || e.target.closest('header') || e.target.closest('#status-pill') || e.target.closest('#loader')) return;

  const moveDist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
  const pressDuration = performance.now() - pointerDownTime;

  // Deliberate click: moved less than 6px and held for less than 350ms (not an orbit drag)
  if (moveDist < 6 && pressDuration < 350) {
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const clickY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(new THREE.Vector2(clickX, clickY), camera);

    if (seraphina.model) {
      const hits = raycaster.intersectObjects(seraphina.model.children, true);
      if (hits.length > 0) {
        // User clicked on character mesh -> set rotation center point!
        setRotationPivot(hits[0].point, true);
      }
    }
  }
});`;

if (!code.includes(oldHeaderAndPointer)) {
  console.error('ERROR: oldHeaderAndPointer not found');
  process.exit(1);
}
code = code.replace(oldHeaderAndPointer, newHeaderAndPointer);
console.log('✓ Replaced header buttons & added click-to-pivot raycasting');

// 6. Update animate loop to interpolate pivot & fade reticle
const oldAnimate = `  // Update Character Animation & Secondary Physics
  seraphina.update(delta);

  controls.update();
  renderer.render(scene, camera);`;

const newAnimate = `  // Update Character Animation & Secondary Physics
  seraphina.update(delta);

  // Smooth 3D Rotation Pivot Interpolation
  if (pivotAnim.active) {
    const p = (now - pivotAnim.startTime) / pivotAnim.duration;
    if (p >= 1.0) {
      controls.target.copy(pivotAnim.endTarget);
      if (pivotAnim.moveCamera) camera.position.copy(pivotAnim.endCamPos);
      pivotAnim.active = false;
    } else {
      const t = 1 - Math.pow(1 - p, 3);
      controls.target.lerpVectors(pivotAnim.startTarget, pivotAnim.endTarget, t);
      if (pivotAnim.moveCamera) camera.position.lerpVectors(pivotAnim.startCamPos, pivotAnim.endCamPos, t);
    }
  }

  // Visual Reticle Fading Animation
  if (reticleTimer > 0) {
    reticleTimer -= delta;
    if (reticleTimer <= 0) {
      reticleSprite.visible = false;
    } else {
      const life = reticleTimer / 0.5;
      reticleMat.opacity = Math.pow(life, 1.2);
      const s = 0.07 + (1 - life) * 0.05;
      reticleSprite.scale.set(s, s, s);
    }
  }

  controls.update();
  renderer.render(scene, camera);`;

if (!code.includes(oldAnimate)) {
  console.error('ERROR: oldAnimate not found');
  process.exit(1);
}
code = code.replace(oldAnimate, newAnimate);
console.log('✓ Updated animate loop with pivot animation & reticle fade');

fs.writeFileSync(file, code, 'utf8');
console.log('Successfully written', file);

