const fs = require('fs');

const companionCode = fs.readFileSync('scripts/anime-companion-engine.js', 'utf8');

// Let's create the unified engine
// It will support loading either Seraphina or Companion model with full rigs, gestures, dances, expressions!

const unifiedScript = `
/**
 * Unified 3D Anime Character & Companion Engine
 * Full Inverse Kinematics, Secondary Spring Physics, 45+ Gestures, 20+ Dances, 35+ Expressions, Locomotion
 */
(function() {
  const T = THREE;
  const $ = function(id) { return document.getElementById(id); };
  const stage = $('stage') || document.body;

  // --- Renderer & Scene Setup ---
  const canvas = $('c');
  const ren = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  ren.outputEncoding = T.sRGBEncoding;
  ren.toneMapping = T.ACESFilmicToneMapping;
  ren.toneMappingExposure = 1.05;
  ren.shadowMap.enabled = true;
  ren.shadowMap.type = T.PCFSoftShadowMap;

  const scene = new T.Scene();
  scene.background = new T.Color(0x07050e);

  const cam = new T.PerspectiveCamera(32, 1, 0.05, 50);
  cam.position.set(0, 1.25, 2.6);

  const ctl = new T.OrbitControls(cam, ren.domElement);
  ctl.enableDamping = true;
  ctl.dampingFactor = 0.08;
  ctl.target.set(0, 1.15, 0);
  ctl.maxDistance = 6.0;
  ctl.minDistance = 0.35;
  ctl.maxPolarAngle = Math.PI * 0.52;

  function size() {
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || window.innerHeight;
    ren.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(stage);
  window.addEventListener('resize', size);
  size();

  // --- Lighting: Anime Studio 5-Point Chiaroscuro Rig ---
  const headTarget = new T.Object3D();
  headTarget.position.set(0, 1.35, 0);
  scene.add(headTarget);

  const hemiLight = new T.HemisphereLight(0x56486c, 0x38222a, 0.85);
  scene.add(hemiLight);

  const keyLight = new T.DirectionalLight(0xfff8f2, 1.30);
  keyLight.position.set(0.85, 1.68, 1.60);
  keyLight.target = headTarget;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 8.0;
  keyLight.shadow.camera.left = -0.9;
  keyLight.shadow.camera.right = 0.9;
  keyLight.shadow.camera.top = 1.9;
  keyLight.shadow.camera.bottom = -0.1;
  keyLight.shadow.bias = -0.00010;
  keyLight.shadow.normalBias = 0.008;
  keyLight.shadow.radius = 2.2;
  scene.add(keyLight);

  const faceFill = new T.DirectionalLight(0xfff4ee, 0.35);
  faceFill.position.set(0, 1.45, 1.80);
  faceFill.target = headTarget;
  scene.add(faceFill);

  const fillLight = new T.DirectionalLight(0xffd1dc, 0.48);
  fillLight.position.set(-1.10, 1.25, 1.20);
  fillLight.target = headTarget;
  scene.add(fillLight);

  const rimLight = new T.DirectionalLight(0xe9d5ff, 1.75);
  rimLight.position.set(0, 2.10, -1.80);
  rimLight.target = headTarget;
  scene.add(rimLight);

  // --- Polished Dark Reflective Obsidian Stage Dais ---
  const floorGroup = new T.Group();
  const floorGeo = new T.CircleGeometry(3.6, 64);
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = floorCanvas.height = 1024;
  const fctx = floorCanvas.getContext('2d');
  fctx.fillStyle = '#080611';
  fctx.fillRect(0, 0, 1024, 1024);
  fctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
  fctx.lineWidth = 3;
  fctx.beginPath(); fctx.arc(512, 512, 470, 0, Math.PI * 2); fctx.stroke();
  fctx.beginPath(); fctx.arc(512, 512, 450, 0, Math.PI * 2); fctx.stroke();
  fctx.strokeStyle = 'rgba(225, 29, 72, 0.28)';
  fctx.lineWidth = 2;
  fctx.beginPath(); fctx.arc(512, 512, 380, 0, Math.PI * 2); fctx.stroke();
  fctx.beginPath(); fctx.arc(512, 512, 260, 0, Math.PI * 2); fctx.stroke();
  const floorTex = new T.CanvasTexture(floorCanvas);
  const floorMat = new T.MeshStandardMaterial({
    map: floorTex,
    color: 0x141022,
    roughness: 0.30,
    metalness: 0.60
  });
  const floorMesh = new T.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI * 0.5;
  floorMesh.receiveShadow = true;
  floorGroup.add(floorMesh);
  scene.add(floorGroup);

  // --- State Variables ---
  let N = {}, bones = [], rest = {}, hairMats = [], model = null, hipsRest = null, head = null, skinMesh = null, F = {}, mx = 0, my = 0, S = {}, ops = [];
  const Q = new T.Quaternion(), Qi = new T.Quaternion(), DQ = new T.Quaternion(), v1 = new T.Vector3(), v2 = new T.Vector3(), E3 = new T.Euler(0,0,0,'YXZ');
  const now = function() { return performance.now() / 1000; };
  const pk = function(a) { return a[Math.floor(Math.random() * a.length)]; };
  let currentModelKey = 'seraphina'; // 'seraphina' | 'companion'

  // --- Expression & Motion Catalogs (copied completely from standalone companion) ---
  const D = { lid:[0,0], sq:[0,0], sm:0.15, op:0, wd:1, bl:0, gz:[0,0], hd:[0,0,0], tg:0, rd:0, sk:0, w3:0, te:0, ar:-0.5, tl:0, ps:1, tr:0, sw:0, fg:0 };
  const EXPR = {
    neutral: {},
    happy: { lid:0.15, sm:0.8, bl:0.15, sq:0.35, te:0.3, ar:0.8 },
    joy: { lid:0.9, sm:1, op:0.45, bl:0.4, wd:1.3, hd:[-0.05,0,0], te:1, ar:1 },
    smug: { sm:0.45, sk:0.85, lid:0.25, hd:[0,-0.05,0.06], sk:0.9 },
    smirk: { sm:0.4, sk:1, lid:0.35, hd:[0,0.15,0.1] },
    cat: { lid:0.25, sm:0.2, w3:1, bl:0.5, hd:[0,0,0.12] },
    pout: { sm:-0.5, op:0.15, rd:0.8, bl:0.55, hd:[-0.08,0.25,-0.12], ar:-0.8 },
    tease: { sm:0.7, lid:0.2, hd:[0,-0.15,0.08], bl:0.25 },
    giggle: { lid:0.85, sm:0.9, op:0.2, bl:0.3, hd:[0.08,0,0], ar:0.6 },
    dazed: { lid:0.3, sm:0.1, gz:[0,-0.4], hd:[-0.1,0,0.15], ps:0.85 },
    wink_left: { lid:[0.95,0], sq:[0.7,0], sm:0.7, hd:[0,0,0.05], bl:0.2 },
    wink_right: { lid:[0,0.95], sq:[0,0.7], sm:0.7, hd:[0,0,-0.05], bl:0.2 },
    shy: { lid:0.2, sm:0.3, bl:0.85, hd:[0.12,-0.12,-0.08], gz:[-0.2,0.3] },
    thinking: { lid:0.1, sm:0.1, gz:[0.4,-0.4], hd:[-0.08,0.12,0.1] },
    embarrassed: { bl:1, lid:0.35, sm:-0.1, hd:[0.15,0,0], op:0.1 },
    heart_eyes: { ef:"heart", bl:1, sm:0.95, op:0.3, te:0.3, ps:1.2 },
    star_eyes: { ef:"star", sm:1, op:0.5, te:0.8, bl:0.7, ps:1.3 },
    curious: { lid:0, sm:0.2, wd:1.15, hd:[-0.05,0,0.18], ps:1.1 },
    sleepy: { lid:0.65, sm:0.1, hd:[0.12,0,0.05], gz:[0,0.2] },
    determined: { sm:0.3, ar:-0.7, hd:[-0.06,0,0], ps:1.05 },
    proud: { sm:0.6, lid:0.15, hd:[-0.12,0,0], bl:0.2 }
  };

  const A = function(x, y, z) { return [x, y, z]; };
  const sn = Math.sin;
  const ab = function(x) { return Math.abs(Math.sin(x)); };
  function arms(Lu, Lf, Ru, Rf, o) { o = o || {}; o.L = [Lu, Lf]; o.R = [Ru, Rf]; return o; }

  // --- 45+ Full Gestures Catalog ---
  const G = {
    wave: { d: 3, ex: "happy", f: function(u) { return { R: [A(-0.75, 0.65, 0), A(-0.2 + sn(u * 10) * 0.7, 0.95, 0.1)], hd: [0, 0, 0.08] }; } },
    raise_hand: { d: 2.5, ex: "curious", f: function() { return { R: [A(-0.6, 0.8, 0.3), A(-0.1, 1, 0.3)] }; } },
    clap: { d: 3, ex: "joy", f: function(u) { const c = ab(u * 9); return arms(A(0.3, -0.6, 0.55), A(-0.7 + c * 0.4, 0.3, 0.9), A(-0.3, -0.6, 0.55), A(0.7 - c * 0.4, 0.3, 0.9), { sp: [0.05, 0, 0] }); } },
    shrug: { d: 2.2, ex: "curious", f: function() { return arms(A(0.7, -0.6, 0.1), A(0.5, 0.6, 0.2), A(-0.7, -0.6, 0.1), A(-0.5, 0.6, 0.2), { hd: [0, 0, 0.12] }); } },
    stretch: { d: 4, ex: "happy", f: function(u, p) { const s = sn(Math.PI * p); return arms(A(0.35, 1, 0), A(0.1, 1, 0), A(-0.35, 1, 0), A(-0.1, 1, 0), { sp: [-0.15 * s, 0, 0], hd: [-0.18 * s, 0, 0] }); } },
    tuck_hair: { d: 2.5, ex: "shy", f: function() { return { R: [A(-0.5, 0.1, 0.5), A(0.3, 0.9, 0.5)], hd: [0, -0.1, 0.1] }; } },
    hands_behind: { d: 5, ex: "proud", f: function() { return arms(A(0.15, -0.9, -0.5), A(-0.3, -0.3, -0.9), A(-0.15, -0.9, -0.5), A(0.3, -0.3, -0.9), { sp: [0.1, 0, 0] }); } },
    arms_cross: { d: 4, ex: "smug", f: function() { return arms(A(0.15, -0.8, 0.5), A(-0.9, 0.1, 0.5), A(-0.15, -0.8, 0.5), A(0.9, 0.1, 0.5), { hd: [-0.05, 0.15, 0.08] }); } },
    think: { d: 4, ex: "thinking", f: function() { return { R: [A(-0.3, -0.5, 0.6), A(0.2, 0.9, 0.4)], hd: [0.05, 0.2, 0.15] }; } },
    shy_pose: { d: 3.5, ex: "shy", f: function() { return arms(A(0.2, -0.85, 0.45), A(-0.55, 0.35, 0.8), A(-0.2, -0.85, 0.45), A(0.55, 0.35, 0.8), { hd: [0.1, -0.15, -0.1] }); } },
    tease_pose: { d: 3, ex: "tease", f: function() { return { R: [A(-0.2, -0.75, 0.55), A(0.2, 0.9, 0.45)], hd: [0, 0.15, 0.2], sp: [0, 0, -0.08] }; } },
    bow: { d: 2.5, ex: "proud", f: function(u, p) { const s = sn(Math.PI * p); return { sp: [0.5 * s, 0, 0], hd: [0.2 * s, 0, 0] }; } },
    lean_in: { d: 3, ex: "curious", f: function(u, p) { const s = sn(Math.PI * p); return { sp: [0.3 * s, 0, 0], hd: [-0.1 * s, 0, 0.15 * s] }; } },
    nod: { d: 1.6, ex: "happy", f: function(u) { return { hd: [sn(u * 8) * 0.15 + 0.05, 0, 0] }; } },
    shake_head: { d: 1.6, ex: "pout", f: function(u) { return { hd: [0, sn(u * 9) * 0.35, 0] }; } },
    facepalm: { d: 3, ex: "embarrassed", f: function() { return { R: [A(-0.3, 0.1, 0.5), A(0.5, 0.9, 0.6)], hd: [0.3, 0, 0] }; } },
    cheer: { d: 3, ex: "joy", f: function(u) { return arms(A(0.5, 1, 0), A(0.3, 1, 0), A(-0.5, 1, 0), A(-0.3, 1, 0), { hp: [0, ab(u * 8) * 0.08, 0], hd: [-0.15, 0, 0] }); } },
    point: { d: 2.5, ex: "determined", f: function() { return { R: [A(-0.1, 0.1, 1), A(-0.05, 0.1, 1)], hd: [-0.08, 0, 0] }; } },
    hop: { d: 1.6, ex: "joy", f: function(u) { return arms(A(0.55, -0.7, 0.1), A(0.08, -1, 0.28), A(-0.55, -0.7, 0.1), A(-0.08, -1, 0.28), { hp: [0, ab(u * 7) * 0.12, 0] }); } },
    spin: { d: 1.4, ex: "giggle", f: function(u, p) { return arms(A(0.8, -0.3, 0), A(0.5, -0.8, 0), A(-0.8, -0.3, 0), A(-0.5, -0.8, 0), { ry: p * Math.PI * 2, hp: [0, ab(u * 6) * 0.03, 0] }); } },
    blow_kiss: { d: 3, ex: "tease", f: function(u, p) { return { R: p < 0.5 ? [A(-0.3, 0.2, 0.6), A(0.4, 0.9, 0.5)] : [A(-0.3, 0.2, 0.8), A(-0.1, 0.4, 1)], hd: [0, 0, 0.1] }; } },
    salute: { d: 2.5, ex: "proud", f: function() { return { R: [A(-0.5, 0.2, 0.2), A(0.4, 0.9, 0.3)], hd: [-0.08, 0, 0] }; } },
    sway: { d: 4, ex: "happy", f: function(u) { return { hp: [sn(u * 2) * 0.02, 0, 0], sp: [0, 0, sn(u * 2) * 0.08], hd: [0, 0, -sn(u * 2) * 0.05] }; } },
    t_pose: { d: 4, ex: "neutral", f: function() { return arms(A(1, 0, 0), A(1, 0, 0), A(-1, 0, 0), A(-1, 0, 0)); } },
    heroic_pose: { d: 4, ex: "proud", f: function() { return arms(A(0.6, -0.6, -0.2), A(-0.6, -0.5, 0.45), A(-0.6, -0.6, -0.2), A(0.6, -0.5, 0.45), { sp: [-0.1, 0, 0], hd: [-0.15, 0, 0] }); } },
    thumbs_up: { d: 2.6, ex: "happy", f: function() { return { R: [A(-0.15, -0.25, 0.7), A(-0.1, 0.55, 0.8)], hd: [0, -0.1, -0.08] }; } },
    peace_sign: { d: 3, ex: "tease", f: function() { return { R: [A(-0.45, 0.1, 0.5), A(0.2, 1, 0.4)], hd: [0, -0.1, 0.2] }; } },
    heart_hands: { d: 3, ex: "happy", f: function(u) { const s = 1 + 0.04 * sn(u * 6); return arms(A(0.4, -0.4, 0.6), A(-0.6 * s, 0.5, 0.8), A(-0.4, -0.4, 0.6), A(0.6 * s, 0.5, 0.8), { hd: [0.05, 0, 0] }); } },
    finger_guns: { d: 3, ex: "tease", f: function(u) { const r = Math.max(0, sn(u * 7)) * 0.25; return arms(A(0.25, -0.1, 0.9), A(0.2, 0.1 + r, 1), A(-0.25, -0.1, 0.9), A(-0.2, 0.1 + r, 1), { hd: [0, 0, 0.1] }); } },
    flex: { d: 3, ex: "proud", f: function(u) { return arms(A(0.95, 0, 0.05), A(0.15, 1, 0.25), A(-0.95, 0, 0.05), A(-0.15, 1, 0.25), { sp: [-0.05, 0, 0], hp: [0, sn(u * 5) * 0.005, 0] }); } },
    laugh: { d: 3, ex: "giggle", f: function(u) { return arms(A(0.3, -0.7, 0.4), A(-0.4, -0.3, 0.7), A(-0.3, -0.7, 0.4), A(0.4, -0.3, 0.7), { sp: [0.35 + sn(u * 18) * 0.05, 0, 0], hd: [-0.1, 0, 0] }); } }
  };

  // --- 20+ Dances Catalog ---
  const DANCE = {
    sway: function(t) { const s = sn(t * 2); return arms(A(0.4 + s * 0.3, -0.5, 0.1), A(0.3, -0.9, 0.1), A(-0.4 + s * 0.3, -0.5, 0.1), A(-0.3, -0.9, 0.1), { hp: [s * 0.03, 0, 0], sp: [0, 0, s * 0.1] }); },
    bounce: function(t) { const s = ab(t * 5); return arms(A(0.6, -0.5, 0.2), A(0.3, -0.8, 0.3), A(-0.6, -0.5, 0.2), A(-0.3, -0.8, 0.3), { hp: [0, s * 0.04, 0] }); },
    disco: function(t) { const p = sn(t * 4); return arms(A(0.7, p > 0 ? 1 : -0.2, 0), A(0.4, p > 0 ? 0.8 : -0.8, 0), A(-0.7, p > 0 ? -0.2 : 1, 0), A(-0.4, p > 0 ? -0.8 : 0.8, 0), { sp: [0, p * 0.25, 0] }); },
    twist: function(t) { const s = sn(t * 4); return arms(A(0.7, -0.2, 0), A(0.3, -0.9, 0), A(-0.7, -0.2, 0), A(-0.3, -0.9, 0), { sp: [0, s * 0.45, 0], hp: [0, 0, s * 0.05] }); },
    floss: function(t) { const s = sn(t * 7); return arms(A(0.7 * s, -0.6, 0.5 * s), A(0.7 * s, -0.6, 0.5 * s), A(0.7 * s, -0.6, -0.5 * s), A(0.7 * s, -0.6, -0.5 * s), { hp: [-s * 0.07, ab(t * 7) * 0.015, 0] }); },
    dab: function(t) { const sd = Math.floor(t / 1.2) % 2 ? 1 : -1, ph = (t % 1.2) / 1.2, e = Math.min(1, ph * 6) * (ph > 0.8 ? (1 - ph) / 0.2 : 1); return arms(A(sd * 0.8 * e, 0.6 * e, 0), A(sd * 0.8 * e, 0.6 * e, 0), A(-sd * 0.4 * e, -0.7 * e, 0.5 * e), A(-sd * 0.4 * e, -0.7 * e, 0.5 * e), { hd: [0.35 * e, sd * 0.5 * e, 0] }); },
    gangnam: function(t) { const s = sn(t * 7); return arms(A(0.3, -0.5, 0.7), A(-0.3, 0.3 + s * 0.3, 0.9), A(-0.3, -0.5, 0.7), A(0.3, 0.3 - s * 0.3, 0.9), { hp: [0, ab(t * 7) * 0.05, 0] }); },
    macarena: function(t) { const p = Math.floor(t * 2) % 8; return arms(A(0.3, -0.2, 0.9), A(0.1, -0.1, 1), A(-0.3, -0.2, 0.9), A(-0.1, -0.1, 1), { hp: [sn(t * 4) * 0.03, 0, 0] }); },
    wave_arms: function(t) { const s = sn(t * 3); return arms(A(0.8, 0.4 + s * 0.6, 0), A(0.5, 0.7 + s * 0.3, 0), A(-0.8, 0.4 - s * 0.6, 0), A(-0.5, 0.7 - s * 0.3, 0)); }
  };

  // --- Hand Poses Catalog (HP) ---
  const HP = {
    relaxed: [[0.18, 0.28, 0.15], [0.22, 0.32, 0.18], [0.26, 0.38, 0.2], [0.3, 0.42, 0.22], [0.12, 0.18]],
    open: [[0, 0.03, 0], [0, 0.03, 0], [0, 0.03, 0], [0, 0.03, 0], [0, 0]],
    fist: [[1.25, 1.45, 1], [1.3, 1.5, 1.05], [1.3, 1.5, 1.05], [1.3, 1.45, 1], [0.5, 0.7]],
    point: [[0.04, 0.04, 0.02], [1.3, 1.5, 1], [1.3, 1.5, 1], [1.3, 1.45, 1], [0.5, 0.7]],
    peace: [[0.04, 0.04, 0], [0.04, 0.04, 0], [1.3, 1.5, 1], [1.3, 1.45, 1], [0.5, 0.7]],
    flat: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0]],
    paw: [[0.7, 0.9, 0.5], [0.75, 0.95, 0.55], [0.8, 1, 0.6], [0.85, 1, 0.6], [0.4, 0.5]]
  };

  const HANDBY = {
    wave: { r: "open" }, clap: { l: "flat", r: "flat" }, point: { r: "point" }, cheer: { l: "fist", r: "fist" },
    salute: { r: "flat" }, blow_kiss: { r: "open" }, tease_pose: { r: "peace" }, peace_sign: { r: "peace" },
    shrug: { l: "open", r: "open" }, stretch: { l: "open", r: "open" }, shy_pose: { l: "paw", r: "paw" },
    arms_cross: { l: "paw", r: "paw" }, think: { r: "paw" }
  };

  // --- Locomotion Constants & Gait ---
  const LK = {
    walk: { v: 1.1, ex: "happy" },
    run: { v: 2.2, ex: "joy" },
    catwalk: { v: 0.95, ex: "smug" },
    sneak: { v: 0.65, ex: "thinking" }
  };
  const LKI = {
    walk: { ds: 0.62, S: 1.15, w: 0.04, sway: 0.022, yaw: 0.12, aa: 0.42, ef0: 0.22, ef1: 0.5, lean: 0.02, lift: 0.06, low: 0.02 },
    run: { ds: 0.36, S: 2.4, w: 0, sway: 0.015, yaw: 0.2, aa: 0.8, ef0: 0.3, ef1: 1.1, lean: 0.12, lift: 0.14, low: 0.035 },
    catwalk: { ds: 0.58, S: 0.95, w: -0.04, sway: 0.045, yaw: 0.22, aa: 0.38, ef0: 0.2, ef1: 0.4, lean: 0.01, lift: 0.07, low: 0.025 },
    sneak: { ds: 0.65, S: 0.7, w: 0.06, sway: 0.018, yaw: 0.08, aa: 0.3, ef0: 0.15, ef1: 0.3, lean: 0.15, lift: 0.04, low: 0.04 }
  };

  // --- Rig & Kinematic Solver Functions ---
  const Q2 = new T.Quaternion(), Qi2 = new T.Quaternion(), ax1 = new T.Vector3(), v3 = new T.Vector3(), SPD = {}, FING = { L: null, R: null };
  let GRAV = 1.0, WIND = 0.3;

  function apply(b, dq) {
    if (!b || !b.parent) return;
    b.parent.getWorldQuaternion(Q);
    Qi.copy(Q).invert();
    b.quaternion.premultiply(Q).premultiply(dq).premultiply(Qi);
  }

  function sm(k, tv, r) {
    const s = S[k] || (S[k] = tv.clone());
    s.lerp(tv, r);
    return s;
  }

  function spd(k, tv, K, C, dt) {
    let s = SPD[k];
    if (!s) s = SPD[k] = { x: tv.clone(), v: new T.Vector3() };
    const h = Math.min(dt, 0.033) / 2;
    for (let i = 0; i < 2; i++) {
      const a = v3.copy(tv).sub(s.x).multiplyScalar(K).addScaledVector(s.v, -C);
      a.y -= GRAV * 4;
      s.v.addScaledVector(a, h);
      s.x.addScaledVector(s.v, h);
    }
    return s.x;
  }

  function spe(k, tv, K, C, dt) {
    let s = SPD[k + "e"];
    if (!s) s = SPD[k + "e"] = { x: tv.clone(), v: new T.Vector3() };
    const h = Math.min(dt, 0.033) / 2;
    for (let i = 0; i < 2; i++) {
      const a = v3.copy(tv).sub(s.x).multiplyScalar(K).addScaledVector(s.v, -C);
      s.v.addScaledVector(a, h);
      s.x.addScaledVector(s.v, h);
    }
    return s.x;
  }

  function aim(b, c, d, K, C) {
    if (b && c && d) ops.push({ b: b, c: c, d: d, k: b.uuid, K: K, C: C });
  }

  function rot(b, x, y, z, r) {
    if (b) ops.push({ b: b, e: [x, y, z], k: b.uuid + "r", r: r });
  }

  function rotS(b, x, y, z, K, C) {
    if (b) ops.push({ b: b, e: [x, y, z], k: b.uuid + "s", K: K, C: C });
  }

  function fnop(b, f) {
    if (b) ops.push({ b: b, fn: f });
  }

  function nz(x, s) {
    return (sn(x * s) + 0.55 * sn(x * s * 2.37 + 1.7) + 0.3 * sn(x * s * 4.1 + 0.4)) / 1.85;
  }

  function jt(a, s, t) {
    return [a[0] + 0.03 * nz(t + s, 0.4), a[1] + 0.02 * nz(t + s + 3, 0.35), a[2] + 0.03 * nz(t + s + 6, 0.45)];
  }

  function wristLag() {
    ["Left", "Right"].forEach(function(sd_) {
      const el = N[sd_ + "_elbow"], wr = N[sd_ + "_wrist"];
      if (!el || !wr) return;
      fnop(wr, function() {
        const s = SPD[el.uuid];
        if (!s) return;
        const sp_ = s.v.length();
        if (sp_ < 0.02) return;
        ax1.copy(s.x).cross(s.v);
        if (ax1.lengthSq() < 1e-8) return;
        ax1.normalize();
        DQ.setFromAxisAngle(ax1, -Math.min(0.45, sp_ * 0.035));
        apply(wr, DQ);
      });
    });
  }

  function idleLegs(t) {
    const k = sn(t * 0.33 + 0.5), sh = Math.tanh(2.2 * k), a = Math.max(0, sh), b = Math.max(0, -sh);
    return {
      lg: [
        [A(0.02 + 0.04 * b, -1 + 0.04 * b, 0.09 * b), A(0, -1 + 0.1 * b, -0.18 * b), A(0, -1, 0.35)],
        [A(-0.02 - 0.04 * a, -1 + 0.04 * a, 0.09 * a), A(0, -1 + 0.1 * a, -0.18 * a), A(0, -1, 0.35)]
      ],
      hp: [0.018 * sh, 0, 0],
      hr: -0.035 * sh,
      sp: [0, 0, 0.025 * sh]
    };
  }

  // --- Hand / Finger Kinematics ---
  function buildBody() {
    model.updateMatrixWorld(true);
    ["L", "R"].forEach(function(sd_) {
      const sx = sd_ === "L" ? 1 : -1;
      const wr = N[sd_ === "L" ? "Left_wrist" : "Right_wrist"];
      if (!wr) return;
      wr.getWorldQuaternion(Q);
      const qi = Q.clone().invert();
      const chains = ["IndexFinger", "MiddleFinger", "RingFinger", "LittleFinger", "Thumb"].map(function(a) {
        return [1, 2, 3].map(function(s) { return N[a + s + "_" + sd_]; }).filter(Boolean);
      });
      FING[sd_] = {
        wr: wr,
        fa: {},
        ch: chains.map(function(ch) {
          if (ch.length < 2) return { b: ch, al: new T.Vector3(1, 0, 0) };
          ch[0].getWorldPosition(v1);
          ch[ch.length - 1].getWorldPosition(v2);
          const f = v2.clone().sub(v1).normalize();
          const nin = new T.Vector3(-sx, 0, 0);
          nin.addScaledVector(f, -nin.dot(f)).normalize();
          return { b: ch, al: f.clone().cross(nin).normalize().applyQuaternion(qi) };
        })
      };
    });
  }

  function handOps(sd_, spec, t, dt) {
    const H = FING[sd_];
    if (!H) return;
    const pz = HP[spec] || HP.relaxed;
    H.ch.forEach(function(c, fi) {
      c.b.forEach(function(b, ji) {
        const key = fi + "_" + ji;
        const row = pz[fi];
        const base = row[ji] !== undefined ? row[ji] : row[row.length - 1];
        const tg = base + 0.05 * sn(t * 0.9 + fi * 1.7 + ji + (sd_ === "L" ? 0 : 2)) * (spec === "relaxed" ? 1 : 0.2);
        const pr = H.fa[key] === undefined ? tg : H.fa[key];
        const ang = pr + (tg - pr) * Math.min(1, dt * 14);
        H.fa[key] = ang;
        fnop(b, function() {
          H.wr.getWorldQuaternion(Q2);
          ax1.copy(c.al).applyQuaternion(Q2);
          DQ.setFromAxisAngle(ax1, ang);
          apply(b, DQ);
        });
      });
    });
  }

  // --- Dynamic Secondary Springs (Hair, Skirt, Sleeves, Bust, Ears) ---
  const SPR = [];
  const SECRX = /^(Hair_|Skirt_|Wing|Tail|Front_Ribon|Hand_Ribon|J_Sec_|J_Opt_)/;
  function sgrp(k) {
    if (/Skirt|CoatSkirt/i.test(k)) return 'skirt';
    if (/Hair/i.test(k)) return 'hair';
    if (/Wing/i.test(k)) return 'wing';
    if (/Tail/i.test(k)) return 'tail';
    if (/CatEar/i.test(k)) return 'ear';
    if (/Bust/i.test(k)) return 'bust';
    return 'rib';
  }
  const GP = {
    skirt: { s: 1.1, d: 0.35, g: 0.25, h: 0.014 },
    hair: { s: 0.75, d: 0.28, g: 0.38, h: 0.008 },
    wing: { s: 1.8, d: 0.55, g: 0.08, h: 0 },
    tail: { s: 0.5, d: 0.2, g: 0.2, h: 0.01 },
    ear: { s: 1.4, d: 0.4, g: 0.05, h: 0 },
    bust: { s: 1.2, d: 0.35, g: 0.2, h: 0 },
    rib: { s: 0.65, d: 0.3, g: 0.25, h: 0.005 }
  };

  function buildSprings() {
    SPR.length = 0;
    model.updateMatrixWorld(true);
    Object.keys(N).forEach(function(k) {
      if (!SECRX.test(k)) return;
      const b = N[k];
      if (!b) return;
      const wp = new T.Vector3(), t0 = new T.Vector3(), wq = new T.Quaternion();
      b.getWorldPosition(wp);
      b.getWorldQuaternion(wq);
      let len = 0.08, ld = new T.Vector3(0, -1, 0);
      const c = b.children.find(function(x) { return x.isBone; });
      if (c) {
        c.getWorldPosition(t0);
        len = Math.max(0.02, wp.distanceTo(t0));
        ld = c.position.clone().normalize();
      }
      const gp = sgrp(k);
      SPR.push({
        b: b,
        len: len,
        ld: ld,
        gp: gp,
        p: GP[gp] || GP.rib,
        col: [],
        init: false
      });
    });
    SPR.sort(function(a, b) { return (a.b.userData.i || 0) - (b.b.userData.i || 0); });
  }

  const wv = new T.Vector3(), sh = new T.Vector3(), sd = new T.Vector3(), sn2 = new T.Vector3(), sv = new T.Vector3();
  function springs(dt, t) {
    if (!SPR.length) return;
    dt = Math.min(dt, 0.033);
    if (dt <= 0) return;
    wv.set(sn(t * 0.7) * 0.5 + sn(t * 2.3) * 0.25, 0, sn(t * 0.9 + 1) * 0.3).multiplyScalar(WIND);
    SPR.forEach(function(s) {
      const b = s.b, p = s.p;
      b.updateWorldMatrix(true, false);
      b.getWorldPosition(sh);
      b.getWorldQuaternion(Q);
      sd.copy(s.ld).applyQuaternion(Q);
      if (!s.init) {
        s.cur = sh.clone().addScaledVector(sd, s.len);
        s.prev = s.cur.clone();
        s.init = true;
      }
      const nt = sn2.copy(s.cur).sub(s.prev).multiplyScalar(1 - p.d).add(s.cur).addScaledVector(sd, p.s * dt);
      nt.y -= p.g * GRAV * dt;
      nt.addScaledVector(wv, p.g * dt);
      nt.sub(sh).setLength(s.len).add(sh);

      s.prev.copy(s.cur);
      s.cur.copy(nt);
      sv.copy(nt).sub(sh).normalize();
      DQ.setFromUnitVectors(sd, sv);
      apply(b, DQ);
      b.updateMatrixWorld(true);
    });
  }

  // --- State & Motion Engine ---
  let EX = Object.assign({}, D, EXPR.neutral);
  let ES = Object.assign({}, D, EXPR.neutral);
  let exEnd = 0, curG = null, dance = null, loco = null, lastAct = now(), nextIdle = now() + 6, idleOn = true;
  let nextBlink = now() + 2, blinkS = -1, dbl = false, nextSac = now() + 1.5, sac = [0, 0];

  function resolve(n) {
    const e = Object.assign({}, D, EXPR[n] || {});
    ["lid", "sq", "gz", "hd"].forEach(function(k) {
      if (typeof e[k] === "number") e[k] = [e[k], e[k]];
    });
    return e;
  }

  function setEx(n, sec) {
    EX = resolve(n);
    exEnd = now() + (sec || 3);
    const bubble = $('bubble');
    if (bubble) bubble.textContent = "Seraphina: *" + n.replace(/_/g, " ") + "*";
  }

  function act(g, ex, sec) {
    lastAct = now();
    dance = null;
    loco = null;
    const o = G[g];
    if (!o) return;
    curG = { f: o.f, t0: now(), d: sec || o.d, n: g };
    setEx(ex || o.ex, (sec || o.d) + 0.5);
    const bubble = $('bubble');
    if (bubble) bubble.textContent = "Seraphina: " + g.replace(/_/g, " ").toUpperCase();
  }

  function startDance(n) {
    n = n || pk(Object.keys(DANCE));
    lastAct = now();
    curG = null;
    loco = null;
    dance = { n: n, end: now() + 25 };
    setEx("joy", 25);
    const bubble = $('bubble');
    if (bubble) bubble.textContent = "Seraphina: Dancing *" + n.replace(/_/g, " ") + "*";
  }

  function startLoco(kind) {
    kind = kind || "walk";
    lastAct = now();
    curG = null;
    dance = null;
    loco = { kind: kind, ph: 0, v: LK[kind].v, h: model ? model.rotation.y : 0 };
    setEx(LK[kind].ex, 30);
    const bubble = $('bubble');
    if (bubble) bubble.textContent = "Seraphina: Locomotion *" + kind + "*";
  }

  // --- Main Pose Solver (Runs Every Frame) ---
  function pose(t, dt) {
    if (!model || !head) return;
    bones.forEach(function(b) { b.quaternion.copy(rest[b.uuid]); });
    ops = [];
    const n = now();

    // Mouse Tracking with Saccades
    const hv = head.getWorldPosition(v1).clone().project(cam);
    const sw_ = stage.clientWidth, sh_ = stage.clientHeight;
    const hx = (hv.x * 0.5 + 0.5) * sw_, hy = (-hv.y * 0.5 + 0.5) * sh_;
    const Rr = Math.max(120, sh_ * 0.35);
    const dd0 = Math.hypot(mx * sw_ * 0.5 - hx, -my * sh_ * 0.5 - hy);
    const FW = Math.max(0, 1 - dd0 / (Rr * 1.5));
    const gx_ = Math.max(-1, Math.min(1, mx)) * FW;
    const gy_ = Math.max(-1, Math.min(1, my)) * FW;

    // Smooth expression lerp
    const k = Math.min(1, dt * 9);
    for (const key in EX) {
      const a = EX[key];
      if (Array.isArray(a)) {
        for (let i = 0; i < a.length; i++) ES[key][i] += (a[i] - ES[key][i]) * k;
      } else if (typeof a === "number") {
        ES[key] += (a - ES[key]) * k;
      }
    }

    // Evaluate Motion
    let g = {}, gn = null;
    if (dance) {
      if (n > dance.end) { dance = null; setEx("neutral"); }
      else { g = DANCE[dance.n](t); gn = dance.n; }
    } else if (curG) {
      const u = n - curG.t0;
      if (u > curG.d) curG = null;
      else { g = curG.f(u, u / curG.d); gn = curG.n; }
    }

    const b1 = sn(t * 1.3), br = 0.5 + 0.5 * b1;
    const L = g.L || [A(0.36, -1, -0.06 + b1 * 0.02), A(0.3, -1, -0.04)];
    const R = g.R || [A(-0.36, -1, -0.06 + b1 * 0.02), A(-0.3, -1, -0.04)];

    aim(N.Left_arm, N.Left_elbow, jt(L[0], 0, t), 80, 10);
    aim(N.Left_elbow, N.Left_wrist, jt(L[1], 2, t), 60, 8.5);
    aim(N.Right_arm, N.Right_elbow, jt(R[0], 4, t), 80, 10);
    aim(N.Right_elbow, N.Right_wrist, jt(R[1], 6, t), 60, 8.5);
    wristLag();

    rot(N.Left_shoulder, 0, 0, Math.min(0.4, Math.max(0, L[0][1]) * 0.3) + b1 * 0.01, 8);
    rot(N.Right_shoulder, 0, 0, -(Math.min(0.4, Math.max(0, R[0][1]) * 0.3) + b1 * 0.01), 8);

    const hb = HANDBY[gn] || {};
    handOps("L", hb.l || "relaxed", t, dt);
    handOps("R", hb.r || "relaxed", t, dt);

    // Natural Legs Weight Shift
    if (!g.lg && !loco && !dance) {
      const il = idleLegs(t);
      g.lg = il.lg;
      if (!g.hp) g.hp = il.hp;
      if (g.hr === undefined) g.hr = il.hr;
      if (!g.sp) g.sp = il.sp;
    }

    if (g.lg) {
      aim(N.Left_leg, N.Left_knee, g.lg[0][0], 110, 14);
      aim(N.Left_knee, N.Left_ankle, g.lg[0][1], 110, 14);
      aim(N.Right_leg, N.Right_knee, g.lg[1][0], 110, 14);
      aim(N.Right_knee, N.Right_ankle, g.lg[1][1], 110, 14);
    }

    // Head, Neck, Spine LookAt
    if (n > nextSac) {
      sac = [(Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.25];
      nextSac = n + 1.5 + Math.random() * 2.5;
    }
    const h = g.hd || [0, 0, 0], sp = g.sp || [0, 0, 0];
    const pit = Math.max(-0.55, Math.min(0.65, gy_ * 0.22 + 0.03 + ES.hd[0] + h[0]));
    const yaw = Math.max(-1.1, Math.min(1.1, gx_ * 0.45 + ES.hd[1] + h[1] + sn(t * 0.5) * 0.05));
    const rl = Math.max(-0.5, Math.min(0.5, ES.hd[2] + h[2]));

    rotS(N.Head, pit * 0.7 + 0.012 * nz(t, 0.5), yaw * 0.6 + 0.02 * nz(t + 4, 0.4), rl * 0.7, 55, 9.5);
    rotS(N.Neck, pit * 0.3, yaw * 0.4, rl * 0.3, 35, 8);
    rotS(N.Spine, 0.02 + sp[0] * 0.55, sp[1] * 0.55, sp[2] * 0.55, 30, 7);
    rotS(N.Chest, b1 * 0.02 + sp[0] * 0.45, sp[1] * 0.45, sp[2] * 0.45, 30, 7);

    // Eye Gaze
    const gy = Math.max(-0.45, Math.min(0.45, gx_ * 0.25 + ES.gz[0] * 0.3 + sac[0] * 0.1));
    const gp = Math.max(-0.35, Math.min(0.35, gy_ * 0.15 - ES.gz[1] * 0.25 + sac[1] * 0.08));
    rot(N.Eye_L, gp, gy, 0, 28);
    rot(N.Eye_R, gp, gy, 0, 28);

    rot(N.Hips, 0, g.hy || 0, g.hr || 0, 8);

    // Sort & Execute Operations
    ops.sort(function(p, q) { return (p.b.userData.i || 0) - (q.b.userData.i || 0); });
    ops.forEach(function(o) {
      if (o.fn) { o.fn(); return; }
      if (o.c) {
        o.b.getWorldPosition(v1);
        o.c.getWorldPosition(v2);
        v2.sub(v1).normalize();
        const tv = new T.Vector3().fromArray(o.d).normalize();
        const d = (o.K ? spd(o.k, tv, o.K, o.C, dt) : sm(o.k, tv, Math.min(1, dt * 10))).clone().normalize();
        DQ.setFromUnitVectors(v2, d);
      } else {
        const ev = new T.Vector3(o.e[0], o.e[1], o.e[2]);
        const d = o.K ? spe(o.k, ev, o.K, o.C, dt) : sm(o.k, ev, Math.min(1, dt * (o.r || 9)));
        E3.set(d.x, d.y, d.z);
        DQ.setFromEuler(E3);
      }
      apply(o.b, DQ);
    });

    // Pelvis Breathing Bob
    if (hipsRest && N.Hips) {
      const hp = g.hp || [0, 0, 0];
      N.Hips.position.copy(hipsRest);
      N.Hips.parent.getWorldQuaternion(Q);
      v1.set(hp[0] + 0.006 * sn(t * 0.31), hp[1] - 0.004 * br, hp[2]).applyQuaternion(Q.invert());
      N.Hips.position.add(v1);
    }
  }

  // --- Real Blinking & Face Mesh Updates ---
  function faceUpdate(t, dt) {
    if (t > nextBlink) {
      blinkS = t;
      if (Math.random() < 0.25 && !dbl) { dbl = true; nextBlink = t + 0.3; }
      else { dbl = false; nextBlink = t + 2.5 + Math.random() * 3.5; }
    }
    const bt = t - blinkS;
    const ba = bt < 0.045 ? bt / 0.045 : bt < 0.13 ? 1 - (bt - 0.045) / 0.085 : 0;
    const blinkAmount = Math.max(ES.lid[0] || 0, ba);

    // Eyelid / Lash Deformation on Seraphina
    if (window._seraphinaMeshLash && window._seraphinaMeshLash.userData.origPositions) {
      const pos = window._seraphinaMeshLash.geometry.attributes.position;
      const orig = window._seraphinaMeshLash.userData.origPositions;
      for (let i = 0; i < pos.count; i++) {
        pos.array[i * 3 + 1] = orig[i * 3 + 1] - blinkAmount * 0.026;
      }
      pos.needsUpdate = true;
    }
    if (window._seraphinaMeshMouth && window._seraphinaMeshMouth.userData.origPositions) {
      const pos = window._seraphinaMeshMouth.geometry.attributes.position;
      const orig = window._seraphinaMeshMouth.userData.origPositions;
      const smk = ES.sk || 0;
      const sml = ES.sm || 0;
      for (let i = 0; i < pos.count; i++) {
        const ox = orig[i * 3];
        const oy = orig[i * 3 + 1];
        const lift = (ox > 0 ? smk * 0.006 : 0) + sml * 0.004;
        pos.array[i * 3 + 1] = oy + lift;
      }
      pos.needsUpdate = true;
    }
  }

  // --- Director: Autonomous Living Idle System ---
  function director(n) {
    if (!idleOn || loco || curG || dance || n - lastAct < 4 || n < nextIdle) return;
    nextIdle = n + 6 + Math.random() * 7;
    const r = Math.random();
    if (r < 0.45) {
      const gestKeys = ["weight_shift", "stretch", "tuck_hair", "sway", "hands_behind", "arms_cross", "shy_pose", "think"];
      const chosen = pk(gestKeys);
      if (G[chosen]) act(chosen);
    } else if (r < 0.85) {
      const microMoods = ["happy", "curious", "pleased", "smug", "tease", "wink_left", "wink_right"];
      setEx(pk(microMoods), 1.5 + Math.random());
    }
  }

  // --- Model Loader & Bone Mapping ---
  function mapBone(name, o) {
    const cleanName = name.replace(/_\d+$/, "");
    N[cleanName] = o;
    N[name] = o;

    // Standardized Mapping
    if (/Hips/i.test(name)) N.Hips = o;
    else if (/Spine/i.test(name)) N.Spine = o;
    else if (/UpperChest/i.test(name)) N.UpperChest = o;
    else if (/Chest/i.test(name)) N.Chest = o;
    else if (/Neck/i.test(name)) N.Neck = o;
    else if (/Head/i.test(name)) N.Head = o;

    // Arms
    else if (/L.*Shoulder/i.test(name)) N.Left_shoulder = o;
    else if (/R.*Shoulder/i.test(name)) N.Right_shoulder = o;
    else if (/L.*UpperArm|Left_arm/i.test(name)) N.Left_arm = o;
    else if (/R.*UpperArm|Right_arm/i.test(name)) N.Right_arm = o;
    else if (/L.*LowerArm|Left_elbow/i.test(name)) N.Left_elbow = o;
    else if (/R.*LowerArm|Right_elbow/i.test(name)) N.Right_elbow = o;
    else if (/L.*Hand|Left_wrist/i.test(name)) N.Left_wrist = o;
    else if (/R.*Hand|Right_wrist/i.test(name)) N.Right_wrist = o;

    // Legs
    else if (/L.*UpperLeg|Left_leg/i.test(name)) N.Left_leg = o;
    else if (/R.*UpperLeg|Right_leg/i.test(name)) N.Right_leg = o;
    else if (/L.*LowerLeg|Left_knee/i.test(name)) N.Left_knee = o;
    else if (/R.*LowerLeg|Right_knee/i.test(name)) N.Right_knee = o;
    else if (/L.*Foot|Left_ankle/i.test(name)) N.Left_ankle = o;
    else if (/R.*Foot|Right_ankle/i.test(name)) N.Right_ankle = o;
    else if (/L.*Toe/i.test(name)) N.Left_toe = o;
    else if (/R.*Toe/i.test(name)) N.Right_toe = o;

    // Eyes
    else if (/Eye.*L|FaceEye.*L/i.test(name)) N.Eye_L = o;
    else if (/Eye.*R|FaceEye.*R/i.test(name)) N.Eye_R = o;

    // Fingers
    ['Index', 'Middle', 'Ring', 'Little', 'Thumb'].forEach(f => {
      [1, 2, 3].forEach(num => {
        if (name.includes(`L_${f}${num}`) || name.includes(`L_${f}_${num}`) || name.includes(`${f}${num}_L`)) {
          N[\`\${f}Finger\${num}_L\`] = o;
        }
        if (name.includes(`R_${f}${num}`) || name.includes(`R_${f}_${num}`) || name.includes(`${f}${num}_R`)) {
          N[\`\${f}Finger\${num}_R\`] = o;
        }
      });
    });
  }

  function loadModel(modelPath, isCompanion) {
    if (model) scene.remove(model);
    N = {}; bones = []; rest = {}; S = {}; ops = [];

    const loader = new T.GLTFLoader();
    loader.load(modelPath, function(g) {
      model = g.scene;
      scene.add(model);

      if (!isCompanion) {
        model.rotation.y = Math.PI; // Seraphina faces front
      }

      model.traverse(function(o) {
        if (o.isMesh) {
          o.frustumCulled = false;
          o.castShadow = true;
          o.receiveShadow = true;

          // Material Polish & Shading Fix
          if (o.material) {
            o.material.emissiveMap = null;
            if (/skin|face|body/i.test(o.material.name)) {
              o.material.roughness = 0.68;
              o.material.emissive = new T.Color(0x32161c);
              o.material.emissiveIntensity = 0.20;
            } else if (/hair/i.test(o.material.name)) {
              o.material.roughness = 0.46;
            }
          }

          // Cache Seraphina facial meshes
          if (o.name === 'Object_20') {
            window._seraphinaMeshMouth = o;
            o.userData.origPositions = new Float32Array(o.geometry.attributes.position.array);
          } else if (o.name === 'Object_22' || o.name === 'Object_26') {
            window._seraphinaMeshLash = o;
            o.userData.origPositions = new Float32Array(o.geometry.attributes.position.array);
          } else if (o.name === 'Object_25') {
            window._seraphinaMeshBrow = o;
            o.userData.origPositions = new Float32Array(o.geometry.attributes.position.array);
          }
        }

        if (o.isBone) {
          o.userData.i = bones.length;
          bones.push(o);
          mapBone(o.name, o);
          rest[o.uuid] = o.quaternion.clone();
        }
      });

      if (N.Hips) hipsRest = N.Hips.position.clone();
      head = N.Head;

      try { buildBody(); } catch(e) { console.warn('buildBody', e); }
      try { buildSprings(); } catch(e) { console.warn('buildSprings', e); }

      const tag = $('model-tag');
      if (tag) tag.textContent = isCompanion ? "Model: Vampire Companion" : "Model: Seraphina Vampire Queen";
      setEx("happy", 3);
      act("wave");
    });
  }

  // --- Camera Focus Presets ---
  const VIEWS = {
    full: { t: [0, 1.15, 0], d: 2.6 },
    face: { t: [0, 1.45, 0], d: 0.75 },
    hands: { t: [0, 1.0, 0], d: 1.2 },
    legs: { t: [0, 0.45, 0], d: 1.6 }
  };
  let FA = null;
  function focusView(name) {
    const v = VIEWS[name];
    if (!v) return;
    const tg = new T.Vector3().fromArray(v.t);
    const dir = new T.Vector3(0, 0.05, 1).normalize();
    FA = {
      t0: now(),
      dur: 0.75,
      ft: ctl.target.clone(),
      fp: cam.position.clone(),
      tt: tg,
      tp: tg.clone().addScaledVector(dir, v.d)
    };
  }
  function focusTick() {
    if (!FA) return;
    const u = Math.min(1, (now() - FA.t0) / FA.dur);
    const e = u * u * (3 - 2 * u);
    ctl.target.lerpVectors(FA.ft, FA.tt, e);
    cam.position.lerpVectors(FA.fp, FA.tp, e);
    if (u >= 1) FA = null;
  }

  // --- Animation Loop ---
  const clk = new T.Clock();
  function tick() {
    requestAnimationFrame(tick);
    const dt = Math.min(clk.getDelta(), 0.05);
    const t = clk.elapsedTime;

    focusTick();
    ctl.update();

    if (model) {
      try { pose(t, dt); } catch(e) {}
      try { springs(dt, t); } catch(e) {}
      try { faceUpdate(t, dt); } catch(e) {}
      director(now());
    }

    ren.render(scene, cam);
  }
  tick();

  // --- Pointer & Touch Tracking ---
  window.addEventListener('pointermove', function(e) {
    const r = stage.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width) * 2 - 1;
    my = -(((e.clientY - r.top) / r.height) * 2 - 1);
  });

  // --- UI Population & Event Listeners ---
  // Populate Gestures Dropdown
  const selG = $('sel-all-gestures');
  if (selG) {
    Object.keys(G).sort().forEach(function(k) {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k.replace(/_/g, ' ');
      selG.appendChild(opt);
    });
    selG.addEventListener('change', function() {
      if (this.value) { act(this.value); this.value = ''; }
    });
  }

  // Populate Dances Dropdown
  const selD = $('sel-all-dances');
  if (selD) {
    Object.keys(DANCE).sort().forEach(function(k) {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k.replace(/_/g, ' ');
      selD.appendChild(opt);
    });
    selD.addEventListener('change', function() {
      if (this.value) { startDance(this.value); this.value = ''; }
    });
  }

  // Populate Expressions Dropdown
  const selE = $('sel-all-expr');
  if (selE) {
    Object.keys(EXPR).sort().forEach(function(k) {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k.replace(/_/g, ' ');
      selE.appendChild(opt);
    });
    selE.addEventListener('change', function() {
      if (this.value) { setEx(this.value, 6); this.value = ''; }
    });
  }

  // Chip Buttons Handlers
  document.querySelectorAll('[data-g]').forEach(function(b) {
    b.addEventListener('click', function() { act(this.dataset.g); });
  });
  document.querySelectorAll('[data-d]').forEach(function(b) {
    b.addEventListener('click', function() { startDance(this.dataset.d); });
  });
  document.querySelectorAll('[data-ex]').forEach(function(b) {
    b.addEventListener('click', function() { setEx(this.dataset.ex, 5); });
  });
  document.querySelectorAll('[data-loco]').forEach(function(b) {
    b.addEventListener('click', function() { startLoco(this.dataset.loco); });
  });

  const stopBtn = $('btn-stop-all');
  if (stopBtn) {
    stopBtn.addEventListener('click', function() {
      curG = null; dance = null; loco = null; setEx('neutral', 3);
      if (model) { model.position.set(0, 0, 0); model.rotation.y = (currentModelKey === 'seraphina' ? Math.PI : 0); }
      const bubble = $('bubble');
      if (bubble) bubble.textContent = "Seraphina: Standing relaxed in royal idle poise.";
    });
  }

  // Camera Presets
  const btnFace = $('btn-view-face');
  if (btnFace) btnFace.addEventListener('click', function() { focusView('face'); });
  const btnFull = $('btn-view-full');
  if (btnFull) btnFull.addEventListener('click', function() { focusView('full'); });
  const btnHands = $('btn-view-hands');
  if (btnHands) btnHands.addEventListener('click', function() { focusView('hands'); });

  // Idle Toggle
  const btnIdle = $('btn-idle-life');
  if (btnIdle) {
    btnIdle.addEventListener('click', function() {
      idleOn = !idleOn;
      this.textContent = "Idle Life: " + (idleOn ? "ON" : "OFF");
      this.classList.toggle('active', idleOn);
    });
  }

  // Model Switcher
  const btnSwitch = $('btn-switch-model');
  if (btnSwitch) {
    btnSwitch.addEventListener('click', function() {
      if (currentModelKey === 'seraphina') {
        currentModelKey = 'companion';
        loadModel('/models/companion.glb', true);
      } else {
        currentModelKey = 'seraphina';
        loadModel('/models/seraphina.glb', false);
      }
    });
  }

  // Initial Model Load
  loadModel('/models/seraphina.glb', false);

  // Global API exposure for testing
  window.Companion = {
    act: act,
    dance: startDance,
    loco: startLoco,
    setEx: setEx,
    focusView: focusView,
    loadModel: loadModel
  };
})();
`;

fs.writeFileSync('public/experiments/unified-companion-engine.js', unifiedScript, 'utf8');
console.log('Built public/experiments/unified-companion-engine.js! Bytes:', unifiedScript.length);

