const fs = require('fs');

const raw = fs.readFileSync('scripts/anime-companion-engine.js', 'utf8');

// Find key landmarks in raw
const pCatalogs = raw.indexOf('/* ===== catalogs ===== */');
const pLoad = raw.indexOf('/* ===== load ===== */');
const pAfterLoad = raw.indexOf('var LI=', pLoad);
const pTouch = raw.indexOf('/* ===== touch ===== */');
const pChat = raw.indexOf('/* ===== chat, tasks, games ===== */');

console.log('Landmarks:', { pCatalogs, pLoad, pAfterLoad, pTouch, pChat });

// Catalogs block: from pCatalogs up to pLoad
const catalogsPart = raw.slice(pCatalogs, pLoad);

// Solvers, colliders, springs, ik, gestures, dances, locomotion, director:
// from pAfterLoad up to pChat
let engineCorePart = raw.slice(pAfterLoad, pChat);

// Fix model facing rotation: support model-specific yaw offset (Princess & Seraphina need +Math.PI to face camera)
engineCorePart = engineCorePart.replace(
  'model.rotation.y+=((g.ry||0)-model.rotation.y)',
  'model.rotation.y+=(((g.ry||0)+(window._currentYawOffset||0))-model.rotation.y)'
);

// Update bone world matrices during IK solve so child bones compute accurate world vectors
engineCorePart = engineCorePart.replace(
  '}apply(o.b,DQ)});',
  '}apply(o.b,DQ);o.b.updateMatrixWorld(true);});'
);

// Reset bone hierarchy matrices at start of pose frame
engineCorePart = engineCorePart.replace(
  'bones.forEach(function(b){b.quaternion.copy(rest[b.uuid])});ops=[];',
  'bones.forEach(function(b){b.quaternion.copy(rest[b.uuid])});if(model)model.updateMatrixWorld(true);ops=[];'
);

// Only rotate eye bones for the companion model (VRoid models have different eye coordinate frames)
engineCorePart = engineCorePart.replace(
  'rot(N.Eye_L,gp,gy,0,28);rot(N.Eye_R,gp,gy,0,28);',
  'if(window._currentModelKey==="companion"){rot(N.Eye_L,gp,gy,0,28);rot(N.Eye_R,gp,gy,0,28);}'
);

// Invert head & neck pitch when character is yaw-flipped (+Math.PI) to maintain proud, upright head posture
engineCorePart = engineCorePart.replace(
  'rotS(N.Head,pit*.7',
  'rotS(N.Head,(window._currentYawOffset?-pit:pit)*.7'
);
engineCorePart = engineCorePart.replace(
  'rotS(N.Neck,pit*.3',
  'rotS(N.Neck,(window._currentYawOffset?-pit:pit)*.3'
);

// Prevent forced sleep after 70s idle locking eyelids shut
engineCorePart = engineCorePart.replace(
  'EX=resolve(idleOn&&n-lastAct>70?"sleepy":"neutral")',
  'EX=resolve("neutral")'
);

console.log('catalogsPart length:', catalogsPart.length);
console.log('engineCorePart length:', engineCorePart.length);

const masterScript = `/**
 * Master Anime Character & Vampire Companion Engine
 * Complete Inverse Kinematics, Secondary Spring Physics, Gestures, Dances, Expressions, Locomotion
 * Includes AdvancedSkeleton Luffy Curve & Quaternion Solvers and VRoid Eyelid Deformations
 */
(function() {
  var T = THREE;
  var $ = function(i) { return document.getElementById(i); };
  var stage = $('stage') || $('canvas-container') || document.body;

  // --- WebGL Renderer ---
  var ren = new T.WebGLRenderer({
    canvas: $('c'),
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  ren.outputEncoding = T.sRGBEncoding;
  ren.toneMapping = T.ACESFilmicToneMapping;
  ren.toneMappingExposure = 1.00;
  ren.shadowMap.enabled = true;
  ren.shadowMap.type = T.PCFSoftShadowMap;
  ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // --- Scene & Camera ---
  var scene = new T.Scene();
  scene.background = new T.Color(0x07050e);

  var cam = new T.PerspectiveCamera(30, 1, 0.05, 50);
  cam.position.set(0, 1.25, 2.5);

  var ctl = new T.OrbitControls(cam, ren.domElement);
  ctl.enableDamping = true;
  ctl.dampingFactor = 0.08;
  ctl.target.set(0, 1.15, 0);
  ctl.minDistance = 0.25;
  ctl.maxDistance = 6.5;
  ctl.maxPolarAngle = Math.PI * 0.52;

  function size() {
    var w = stage.clientWidth || window.innerWidth;
    var h = stage.clientHeight || window.innerHeight;
    ren.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(stage);
  window.addEventListener('resize', size);
  size();

  // --- Plain Studio Diffuse Lighting (Soft Light, Zero Harsh Highlights, Balanced Contrast) ---
  var studioTarget = new T.Object3D();
  studioTarget.position.set(0, 1.25, 0);
  scene.add(studioTarget);

  // Broad, even ambient fill covering the whole stage
  var studioAmbient = new T.AmbientLight(0xffffff, 0.35);
  scene.add(studioAmbient);

  // Soft sky/ground bounce
  var studioHemi = new T.HemisphereLight(0xf5f3f9, 0x1e1b26, 0.22);
  scene.add(studioHemi);

  // Soft overhead key light - broad coverage, soft diffused shadow
  var keyLight = new T.DirectionalLight(0xfffbf7, 0.65);
  keyLight.position.set(0.80, 2.20, 1.80);
  keyLight.target = studioTarget;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 8.0;
  keyLight.shadow.camera.left = -1.2;
  keyLight.shadow.camera.right = 1.2;
  keyLight.shadow.camera.top = 2.2;
  keyLight.shadow.camera.bottom = -0.2;
  keyLight.shadow.bias = -0.0001;
  keyLight.shadow.normalBias = 0.005;
  keyLight.shadow.radius = 5.0; // ultra-soft diffused shadow, zero harsh edges
  scene.add(keyLight);

  // Gentle studio fill from opposite side for natural cheek/jaw contouring
  var fillLight = new T.DirectionalLight(0xf2eff9, 0.30);
  fillLight.position.set(-1.20, 1.50, 1.20);
  fillLight.target = studioTarget;
  scene.add(fillLight);

  // Soft subtle backlight purely for separation, no burning highlights
  var softBackLight = new T.DirectionalLight(0xebe7f5, 0.20);
  softBackLight.position.set(0, 2.20, -1.80);
  softBackLight.target = studioTarget;
  scene.add(softBackLight);

  // --- Studio Matte Floor (No specular hot-spots or harsh reflective glare) ---
  var floorGeo = new T.CircleGeometry(3.8, 64);
  var floorCanvas = document.createElement('canvas');
  floorCanvas.width = floorCanvas.height = 1024;
  var fctx = floorCanvas.getContext('2d');
  fctx.fillStyle = '#080611';
  fctx.fillRect(0, 0, 1024, 1024);
  fctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
  fctx.lineWidth = 2.5;
  fctx.beginPath(); fctx.arc(512, 512, 470, 0, Math.PI * 2); fctx.stroke();
  fctx.beginPath(); fctx.arc(512, 512, 450, 0, Math.PI * 2); fctx.stroke();
  fctx.strokeStyle = 'rgba(225, 29, 72, 0.20)';
  fctx.lineWidth = 1.5;
  fctx.beginPath(); fctx.arc(512, 512, 380, 0, Math.PI * 2); fctx.stroke();
  fctx.beginPath(); fctx.arc(512, 512, 260, 0, Math.PI * 2); fctx.stroke();
  var floorTex = new T.CanvasTexture(floorCanvas);
  var floorMat = new T.MeshStandardMaterial({
    map: floorTex,
    color: 0x0a0814,
    roughness: 0.92, // Matte diffuse studio finish, eliminating specular white circles
    metalness: 0.04
  });
  var floorMesh = new T.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI * 0.5;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // --- Global Rig Variables ---
  var N = {}, bones = [], rest = {}, hairMats = [], model = null, hipsRest = null, head = null, skinMesh = null, F = {}, mx = 0, my = 0, S = {}, ops = [];
  var PXs = -9999, PYs = -9999, PT = 0, PIN = false, FW = 0, LOOK = null;
  var Q = new T.Quaternion(), Qi = new T.Quaternion(), DQ = new T.Quaternion(), v1 = new T.Vector3(), v2 = new T.Vector3(), up = new T.Vector3(), E3 = new T.Euler();
  var now = function() { return performance.now() / 1000; }, pk = function(a) { return a[Math.floor(Math.random() * a.length)]; }, rnd = function(a, b) { return a + Math.random() * (b - a); };

  function say(txt) {
    var b = $('bubble');
    if (b) b.textContent = txt;
  }
  function emit(ev, data) {
    window.dispatchEvent(new CustomEvent('companion-' + ev, { detail: data }));
  }
  var API = { ready: false };

  // --- AdvancedSkeleton Luffy Solvers (Curve Evaluator, Quaternion Slerp with Overdrive & 2nd-Order Physics) ---
  function luffyEvaluate(keys, value, extrapolation) {
    if (!keys || !keys.length) return 0.0;
    if (keys.length === 1) return keys[0][1];
    var a, b;
    if (value <= keys[0][0]) {
      if (extrapolation === "constant") return keys[0][1];
      a = keys[0]; b = keys[1];
    } else if (value >= keys[keys.length - 1][0]) {
      if (extrapolation === "constant") return keys[keys.length - 1][1];
      a = keys[keys.length - 2]; b = keys[keys.length - 1];
    } else {
      a = keys[0]; b = keys[keys.length - 1];
      for (var i = 0; i < keys.length - 1; i++) {
        if (keys[i][0] <= value && value <= keys[i + 1][0]) {
          a = keys[i]; b = keys[i + 1];
          break;
        }
      }
    }
    var width = b[0] - a[0];
    return Math.abs(width) < 1e-7 ? a[1] : a[1] + (b[1] - a[1]) * ((value - a[0]) / width);
  }

  function luffyEvaluateQuaternion(keys, value, extrapolation) {
    if (!keys || !keys.length) return new T.Quaternion(0, 0, 0, 1);
    if (keys.length === 1) {
      var k0 = keys[0][1];
      return new T.Quaternion(k0[0], k0[1], k0[2], k0[3]).normalize();
    }
    var a, b;
    if (value <= keys[0][0]) {
      if (extrapolation === "constant") {
        var ka = keys[0][1];
        return new T.Quaternion(ka[0], ka[1], ka[2], ka[3]).normalize();
      }
      a = keys[0]; b = keys[1];
    } else if (value >= keys[keys.length - 1][0]) {
      if (extrapolation === "constant") {
        var kb = keys[keys.length - 1][1];
        return new T.Quaternion(kb[0], kb[1], kb[2], kb[3]).normalize();
      }
      a = keys[keys.length - 2]; b = keys[keys.length - 1];
    } else {
      a = keys[0]; b = keys[keys.length - 1];
      for (var i = 0; i < keys.length - 1; i++) {
        if (keys[i][0] <= value && value <= keys[i + 1][0]) {
          a = keys[i]; b = keys[i + 1];
          break;
        }
      }
    }
    var width = b[0] - a[0];
    var factor = Math.abs(width) < 1e-7 ? 0 : (value - a[0]) / width;
    var qa = new T.Quaternion(a[1][0], a[1][1], a[1][2], a[1][3]).normalize();
    var qb = new T.Quaternion(b[1][0], b[1][1], b[1][2], b[1][3]).normalize();
    if (qa.dot(qb) < 0) qb.set(-qb.x, -qb.y, -qb.z, -qb.w);
    var qRel = qa.clone().invert().multiply(qb);
    var angle = 2 * Math.acos(Math.max(-1, Math.min(1, qRel.w)));
    var s = Math.sqrt(Math.max(0, 1 - qRel.w * qRel.w));
    var axis = s < 1e-6 ? new T.Vector3(1, 0, 0) : new T.Vector3(qRel.x / s, qRel.y / s, qRel.z / s);
    var overdrive = new T.Quaternion().setFromAxisAngle(axis, angle * factor);
    return qa.multiply(overdrive).normalize();
  }

  // 2nd-order critically damped spring physics for organic motion dampening
  function createDampedSpring(omega, zeta) {
    var x = 0, v = 0;
    return {
      update: function(target, dt) {
        dt = Math.min(dt || 0.016, 0.05);
        var f = 1.0 + 2.0 * dt * zeta * omega;
        var oo = omega * omega;
        var hoo = dt * oo;
        var hhoo = dt * hoo;
        var detInv = 1.0 / (f + hhoo);
        var detX = f * x + dt * v + hhoo * target;
        var detV = v + hoo * (target - x);
        x = detX * detInv;
        v = detV * detInv;
        return x;
      },
      get value() { return x; },
      set: function(val) { x = val; v = 0; }
    };
  }

  // --- Catalogs from Companion ---
  ` + catalogsPart + `

  function skinColor(m) {
    return new T.Color(1, .78, .75);
  }

  // --- Universal VRoid to Companion Bone Mapper ---
  function mapVRoid(name, o) {
    var clean = name.replace(/_\\d+$/, '');
    N[clean] = o;
    N[name] = o;

    if (/Hips/i.test(name)) N.Hips = o;
    if (/Spine/i.test(name)) N.Spine = o;
    if (/UpperChest/i.test(name)) N.UpperChest = o;
    if (/Chest/i.test(name) && !/UpperChest/i.test(name)) N.Chest = o;
    if (/Neck/i.test(name)) N.Neck = o;
    if (/Head/i.test(name)) N.Head = o;

    if (/Shoulder.*L|L.*Shoulder/i.test(name)) N.Left_shoulder = o;
    if (/UpperArm.*L|L.*UpperArm|Arm.*L(?!\\w)/i.test(name)) N.Left_arm = o;
    if (/LowerArm.*L|L.*LowerArm|Elbow.*L/i.test(name)) N.Left_elbow = o;
    if (/Hand.*L|L.*Hand|Wrist.*L/i.test(name)) N.Left_wrist = o;

    if (/Shoulder.*R|R.*Shoulder/i.test(name)) N.Right_shoulder = o;
    if (/UpperArm.*R|R.*UpperArm|Arm.*R(?!\\w)/i.test(name)) N.Right_arm = o;
    if (/LowerArm.*R|R.*LowerArm|Elbow.*R/i.test(name)) N.Right_elbow = o;
    if (/Hand.*R|R.*Hand|Wrist.*R/i.test(name)) N.Right_wrist = o;

    if (/UpperLeg.*L|L.*UpperLeg|Leg.*L(?!\\w)/i.test(name)) N.Left_leg = o;
    if (/LowerLeg.*L|L.*LowerLeg|Knee.*L/i.test(name)) N.Left_knee = o;
    if (/Foot.*L|L.*Foot|Ankle.*L/i.test(name)) N.Left_ankle = o;
    if (/Toe.*L|L.*Toe/i.test(name)) N.Left_toe = o;

    if (/UpperLeg.*R|R.*UpperLeg|Leg.*R(?!\\w)/i.test(name)) N.Right_leg = o;
    if (/LowerLeg.*R|R.*LowerLeg|Knee.*R/i.test(name)) N.Right_knee = o;
    if (/Foot.*R|R.*Foot|Ankle.*R/i.test(name)) N.Right_ankle = o;
    if (/Toe.*R|R.*Toe/i.test(name)) N.Right_toe = o;

    if (/Eye.*L|L.*Eye/i.test(name)) { N.Left_eye = o; N.Eye_L = o; }
    if (/Eye.*R|R.*Eye/i.test(name)) { N.Right_eye = o; N.Eye_R = o; }

    var fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Little'];
    fingerNames.forEach(function(f) {
      for (var i = 1; i <= 3; i++) {
        var canonF = f === 'Thumb' ? 'Thumb' : f + 'Finger';
        var patL = new RegExp('(?:L_)?' + f + '.*' + i + '.*L|J_Bip_L_' + f + i, 'i');
        var patR = new RegExp('(?:R_)?' + f + '.*' + i + '.*R|J_Bip_R_' + f + i, 'i');
        if (patL.test(name)) N[canonF + i + '_L'] = o;
        if (patR.test(name)) N[canonF + i + '_R'] = o;
      }
    });
  }

  // --- Princess Royal Purple Theme Converter ---
  function applyPrincessPurpleTheme(m) {
    m.traverse(function(c) {
      if (c.isMesh && c.material && c.material.map && c.material.map.image) {
        var mName = c.material.name;
        var isLash = /FaceEyeline|Eyeline/i.test(mName);
        // Recolor hair, eyebrows, eyelashes, and dress fabrics/roses (excluding skin and mouth/iris/sclera)
        if (/Hair|Brow|CLOTH|Onepiece|Tops|Shoes|FaceEyeline|Eyeline/i.test(mName) && !/Skin|Face_00_SKIN|EyeIris|EyeHighlight|EyeWhite|Mouth/i.test(mName)) {
          var img = c.material.map.image;
          if (!img.width || !img.height) return;
          var canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var data = imgData.data;

          var isHairOrBrow = /Hair|Brow/i.test(mName);

          for (var i = 0; i < data.length; i += 4) {
            var a = data[i + 3];
            if (a < 8) continue;
            var r = data[i], g = data[i + 1], b = data[i + 2];

            // Eyelashes: turn golden-yellow mascara into deep royal violet mascara
            if (isLash) {
              var lumL = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
              // Target velvety deep mascara violet
              data[i] = Math.round(lumL * 95);      // R
              data[i + 1] = Math.round(lumL * 22);  // G
              data[i + 2] = Math.round(lumL * 145); // B
              continue;
            }

            // RGB to HSL
            var rf = r / 255, gf = g / 255, bf = b / 255;
            var max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
            var h = 0, s = 0, l = (max + min) / 2;
            if (max !== min) {
              var d = max - min;
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
              if (max === rf) h = (gf - bf) / d + (gf < bf ? 6 : 0);
              else if (max === gf) h = (bf - rf) / d + 2;
              else h = (rf - gf) / d + 4;
              h /= 6;
            }

            // Detect golden / blonde / champagne pixels:
            // Warm tones where r > b or hue in yellow-gold band (0.04 - 0.26) and not deep black (l > 0.15)
            var isGoldOrBlonde = isHairOrBrow || (h >= 0.04 && h <= 0.26) || (r > b + 14 && g > b + 6);

            if (isGoldOrBlonde && l > 0.15) {
              // Target royal anime purple / violet hue: ~276 deg (0.765)
              var newH = 0.765;
              // Vibrant royal purple saturation
              var newS = Math.min(1.0, Math.max(0.60, s * 1.35));
              // Keep luminous highlights and rich shadow contrast
              var newL = Math.max(0.12, Math.min(0.92, l * 0.96));

              // HSL to RGB
              var q = newL < 0.5 ? newL * (1 + newS) : newL + newS - newL * newS;
              var p = 2 * newL - q;
              var hue2rgb = function(t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
              };
              data[i] = Math.round(hue2rgb(newH + 1/3) * 255);
              data[i + 1] = Math.round(hue2rgb(newH) * 255);
              data[i + 2] = Math.round(hue2rgb(newH - 1/3) * 255);
            }
          }

          ctx.putImageData(imgData, 0, 0);
          var newTex = new T.CanvasTexture(canvas);
          newTex.flipY = c.material.map.flipY;
          newTex.encoding = c.material.map.encoding;
          newTex.needsUpdate = true;
          c.material.map = newTex;
          c.material.needsUpdate = true;
        }
      }
    });
  }

  // --- Dynamic Facial Deformation for VRoid Meshes (Princess & Seraphina) ---
  var vroidFaceMeshes = { eyeline: null, iris: null, highlight: null, eyewhite: null, skin: null, mouth: null, brow: null };
  var vroidBlinkState = {
    lastBlink: 0,
    nextBlink: 2.2,
    isDouble: false
  };

  function updateVRoidFace(t, dt) {
    if (!vroidFaceMeshes.eyeline) return;

    // Natural periodic blinking (every 2.5 - 5.5s with occasional double-blinks)
    if (t > vroidBlinkState.nextBlink) {
      vroidBlinkState.lastBlink = t;
      if (Math.random() < 0.18 && !vroidBlinkState.isDouble) {
        vroidBlinkState.isDouble = true;
        vroidBlinkState.nextBlink = t + 0.28;
      } else {
        vroidBlinkState.isDouble = false;
        vroidBlinkState.nextBlink = t + 2.5 + Math.random() * 3.2;
      }
    }

    var bt = t - vroidBlinkState.lastBlink;
    var ba = bt < 0.045 ? (bt / 0.045) : (bt < 0.135 ? 1.0 - (bt - 0.045) / 0.090 : 0.0);
    ba = Math.max(0, Math.min(1, ba));

    // Only allow deliberate closed eye / wink expressions if active (not default idle)
    var expLid = 0;
    if (ES && ES.lid && ES.lid[0] !== undefined) {
      if (curG || (dance && dance.n)) {
        expLid = Math.min(1, Math.max(0, ES.lid[0]));
      }
    }
    var blinkAmount = Math.max(expLid, ba);

    // 1. Eyeline: upper lashes curve down cleanly to meet lower lash rim
    var eyeline = vroidFaceMeshes.eyeline;
    var orig = eyeline.userData.origPositions;
    var pos = eyeline.geometry.attributes.position;
    var uv = eyeline.geometry.attributes.uv;

    if (orig && pos && uv) {
      if (!eyeline.userData.lowerVerts) {
        var lvs = [];
        for (var k = 0; k < pos.count; k++) {
          if (uv.getY(k) <= 0.65) {
            lvs.push({ x: orig[k * 3], y: orig[k * 3 + 1] });
          }
        }
        eyeline.userData.lowerVerts = lvs;
      }
      var lowerVerts = eyeline.userData.lowerVerts;

      for (var i = 0; i < pos.count; i++) {
        var oy = orig[i * 3 + 1];
        var v = uv.getY(i);
        if (v > 0.65) {
          var ox = orig[i * 3];
          var targetY = 1.440;
          var minDx = 1e9;
          for (var j = 0; j < lowerVerts.length; j++) {
            var dx = Math.abs(lowerVerts[j].x - ox);
            if (dx < minDx) {
              minDx = dx;
              targetY = lowerVerts[j].y;
            }
          }
          pos.array[i * 3 + 1] = oy - (oy - (targetY + 0.003)) * blinkAmount;
        } else {
          pos.array[i * 3 + 1] = oy;
        }
      }
      pos.needsUpdate = true;
    }

    // 2. Face Skin: Upper eyelid rim stretches down over the eye socket
    var skin = vroidFaceMeshes.skin;
    if (skin && skin.geometry && skin.geometry.attributes.position) {
      var sPos = skin.geometry.attributes.position;
      var sOrig = skin.userData.origPositions;
      var sUv = skin.geometry.attributes.uv;
      if (sOrig && sUv) {
        for (var s = 0; s < sPos.count; s++) {
          var sy = sOrig[s * 3 + 1];
          var sx = Math.abs(sOrig[s * 3]);
          var sz = sOrig[s * 3 + 2];
          var sv = sUv.getY(s);
          if (sx >= 0.018 && sx <= 0.065 && sy >= 1.448 && sy <= 1.472 && sz < -0.045 && sv >= 0.46 && sv <= 0.54) {
            sPos.array[s * 3 + 1] = sy - (sy - 1.442) * blinkAmount * 0.92;
          } else {
            sPos.array[s * 3 + 1] = sy;
          }
        }
        sPos.needsUpdate = true;
      }
    }

    // 3. Iris and Highlight: ALWAYS 100% OPAQUE & VIBRANT!
    // When eyelid is almost fully closed (> 0.70), slide gently back in Z behind eyelid skin
    var tuckZ = -0.018 * Math.max(0, (blinkAmount - 0.70) / 0.30);
    if (vroidFaceMeshes.iris) {
      vroidFaceMeshes.iris.material.transparent = false;
      vroidFaceMeshes.iris.material.opacity = 1.0;
      vroidFaceMeshes.iris.position.z = tuckZ;
    }
    if (vroidFaceMeshes.highlight) {
      vroidFaceMeshes.highlight.material.transparent = true;
      vroidFaceMeshes.highlight.material.opacity = Math.max(0, 1 - blinkAmount * 1.5);
      vroidFaceMeshes.highlight.position.z = tuckZ;
    }
    if (vroidFaceMeshes.eyewhite) {
      vroidFaceMeshes.eyewhite.material.color.set(0xffffff);
      vroidFaceMeshes.eyewhite.position.z = tuckZ * 0.8;
    }

    // 4. Subtle smile / mouth animation
    if (vroidFaceMeshes.mouth && vroidFaceMeshes.mouth.userData.origPositions) {
      var posM = vroidFaceMeshes.mouth.geometry.attributes.position;
      var origM = vroidFaceMeshes.mouth.userData.origPositions;
      var smk = (ES && ES.sk) || 0;
      var sml = (ES && ES.sm) || 0;
      for (var m = 0; m < posM.count; m++) {
        var oxm = origM[m * 3];
        var lift = (oxm > 0 ? smk * 0.005 : 0) + sml * 0.003;
        posM.array[m * 3 + 1] = origM[m * 3 + 1] + lift;
      }
      posM.needsUpdate = true;
    }
  }

  // --- Core Companion Solvers & Physics ---
  ` + engineCorePart + `

  // --- Model Loader ---
  var currentModelKey = 'princess';
  function loadModel(modelPath, modelKey) {
    currentModelKey = modelKey;
    window._currentModelKey = modelKey;
    if (model) scene.remove(model);

    N = {}; bones = []; rest = {}; hairMats = []; F = {}; S = {};
    hipsRest = null; head = null; skinMesh = null;
    curG = null; dance = null; loco = null;
    vroidFaceMeshes = { eyeline: null, iris: null, highlight: null, eyewhite: null, skin: null, mouth: null, brow: null };

    var dispName = modelKey === 'princess' ? "Princess Anime Girl" : (modelKey === 'seraphina' ? "Seraphina Nocturne" : "Vampire Companion");
    say("Loading " + dispName + " with fluid physics...");

    new T.GLTFLoader().load(modelPath, function(gltf) {
      model = gltf.scene;
      scene.add(model);

      window._currentYawOffset = 0;
      if (modelKey === 'princess' || modelKey === 'seraphina') {
        window._currentYawOffset = Math.PI; // Princess & Seraphina face frontal studio camera
      }
      model.rotation.y = window._currentYawOffset;

      // Soft diffuse anime studio materials - eliminate plastic specular shine & artificial emissive glow
      model.traverse(function(o) {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;

          var mName = o.material ? o.material.name : '';

          if (o.material) {
            o.material.emissive = new T.Color(0x000000);
            o.material.emissiveIntensity = 0.0;

            if (/Skin|Face_00_SKIN|Body_00_SKIN/i.test(mName) || o.name === 'Object_7' || o.name === 'Object_22') {
              o.material.roughness = 0.92;
              o.material.metalness = 0.0;
            } else if (/Hair/i.test(mName) || o.name === 'Object_17' || o.name === 'Object_27') {
              o.material.roughness = 0.85;
              o.material.metalness = 0.02;
            } else if (/CLOTH|Onepiece|Tops|Shoes/i.test(mName)) {
              o.material.roughness = 0.82;
              o.material.metalness = 0.05;
            } else {
              o.material.roughness = 0.85;
              o.material.metalness = 0.02;
            }
          }

          if (o.material && o.material.name === "glasses") {
            skinMesh = o;
          }

          // VRoid facial mesh bindings
          if (/FaceEyeline|Eyelash/i.test(mName) || o.name === 'Object_25') {
            vroidFaceMeshes.eyeline = o;
            o.userData.origPositions = new Float32Array(o.geometry.attributes.position.array);
          } else if (/Face_00_SKIN/i.test(mName) || o.name === 'Object_22') {
            vroidFaceMeshes.skin = o;
            o.userData.origPositions = new Float32Array(o.geometry.attributes.position.array);
          } else if (/EyeIris/i.test(mName) || o.name === 'Object_20') {
            vroidFaceMeshes.iris = o;
            o.material.transparent = false;
            o.material.opacity = 1.0;
            o.material.depthWrite = true;
          } else if (/EyeHighlight/i.test(mName) || o.name === 'Object_21') {
            vroidFaceMeshes.highlight = o;
            o.material.transparent = true;
            o.material.opacity = 1.0;
          } else if (/EyeWhite/i.test(mName) || o.name === 'Object_23') {
            vroidFaceMeshes.eyewhite = o;
            o.material.color.set(0xffffff);
            o.material.opacity = 1.0;
            if (!o.userData.origColor) o.userData.origColor = o.material.color.clone();
          } else if (/FaceMouth/i.test(mName) || o.name === 'Object_19') {
            vroidFaceMeshes.mouth = o;
            o.userData.origPositions = new Float32Array(o.geometry.attributes.position.array);
          } else if (/FaceBrow/i.test(mName) || o.name === 'Object_24') {
            vroidFaceMeshes.brow = o;
            o.userData.origPositions = new Float32Array(o.geometry.attributes.position.array);
          }
        }

        if (o.isBone) {
          o.userData.i = bones.length;
          bones.push(o);
          if (modelKey === 'companion') {
            N[o.name.replace(/_\\d+$/, "")] = o;
          } else {
            mapVRoid(o.name, o);
          }
          rest[o.uuid] = o.quaternion.clone();
        }
      });

      if (N.Hips) hipsRest = N.Hips.position.clone();
      else hipsRest = new T.Vector3(0, 0.85, 0);
      head = N.Head;

      try { buildBody(); } catch(e) { console.warn("buildBody error", e); }
      try { buildSprings(); } catch(e) { console.warn("buildSprings error", e); }

      if (modelKey === 'companion') {
        try { buildFace(); } catch(e) { console.warn("buildFace error", e); }
        try { buildSleeves(); } catch(e) { console.warn("buildSleeves error", e); }
        try { buildSkirt(); } catch(e) { console.warn("buildSkirt error", e); }
        try { buildHands(); } catch(e) { console.warn("buildHands error", e); }
      }

      // Apply Princess Royal Purple Theme Palette (Hair & Dress & Eyelashes)
      if (modelKey === 'princess') {
        try { applyPrincessPurpleTheme(model); } catch(e) { console.warn("applyPrincessPurpleTheme error", e); }
      }

      say(dispName + " awakened with complete fluid living rigs & physics!");
      act("wave");
      setEx("happy", 3);
      API.ready = true;
      emit("ready", { model: modelKey });
    }, undefined, function(err) {
      console.error("Failed to load model", err);
      say("Could not load " + dispName);
    });
  }

  // --- Click to set 3D Orbit Center Point ---
  var ray = new T.Raycaster(), downPos = null;
  ren.domElement.addEventListener("pointerdown", function(e) {
    downPos = { x: e.clientX, y: e.clientY };
  });
  ren.domElement.addEventListener("pointerup", function(e) {
    if (!downPos || !model) return;
    var dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
    downPos = null;
    if (dist > 6) return; // Ignore drag/orbit

    var rect = stage.getBoundingClientRect();
    ray.setFromCamera(new T.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), cam);
    var hits = ray.intersectObject(model, true);
    if (!hits.length) return;

    var hit = hits[0];
    ctl.target.copy(hit.point); // Center orbit around clicked feature!

    // Companion touch reaction
    var best = "", bd = 9, w = new T.Vector3();
    ["Head","Neck","Chest","Spine","Hips","Left_wrist","Right_wrist","Left_arm","Right_arm","Left_elbow","Right_elbow","Left_leg","Right_leg","Tail_02","Tail_05","Tail_08","Tail_011","Wing04_L","Wing04_R","Wing07_L","Wing07_R"].forEach(function(k) {
      if (!N[k]) return;
      N[k].getWorldPosition(w);
      var d = w.distanceTo(hit.point);
      if (d < bd) { bd = d; best = k; }
    });

    var reg = "body";
    if (/Head|Neck/.test(best)) reg = "head";
    else if (/Hand|wrist/.test(best)) reg = "hand";
    else if (/arm|elbow/.test(best)) reg = "arm";
    else if (/Tail/.test(best)) reg = "tail";
    else if (/Wing/.test(best)) reg = "wing";

    var list = REACT[reg] || REACT.body;
    var item = pk(list);
    setEx(item[0], 2.5);
    if (item[1]) act(item[1]);
    if (item[2]) say(item[2]);
  });

  // --- Mouse / Touch Tracking (Subtle, Non-Aggressive Eye Tracking) ---
  stage.addEventListener('pointermove', function(e) {
    var rect = stage.getBoundingClientRect();
    PXs = e.clientX - rect.left;
    PYs = e.clientY - rect.top;
    PT = now();
    PIN = true;
  });
  stage.addEventListener('pointerleave', function() {
    PIN = false;
  });

  // --- UI Controls Binding & Model Switcher ---
  var camTargetPos = null, ctlTargetPos = null;
  function focusView(mode) {
    if (mode === 'face') {
      camTargetPos = new T.Vector3(0, 1.38, 0.95);
      ctlTargetPos = new T.Vector3(0, 1.38, 0);
    } else if (mode === 'hands') {
      camTargetPos = new T.Vector3(0, 1.10, 1.10);
      ctlTargetPos = new T.Vector3(0, 1.05, 0);
    } else if (mode === 'legs') {
      camTargetPos = new T.Vector3(0, 0.50, 1.60);
      ctlTargetPos = new T.Vector3(0, 0.42, 0);
    } else { // 'full' or default
      camTargetPos = new T.Vector3(0, 1.25, 2.50);
      ctlTargetPos = new T.Vector3(0, 1.10, 0);
    }
  }

  // --- Animation Render Loop Hook ---
  // The companion engine defines its own tick() loop.
  // We hook updateVRoidFace and camera tweening into each frame:
  var origReq = window.requestAnimationFrame;
  window.requestAnimationFrame = function(cb) {
    return origReq(function(ts) {
      var t = performance.now() / 1000;
      updateVRoidFace(t, 0.016);
      if (camTargetPos && ctlTargetPos) {
        cam.position.lerp(camTargetPos, 0.08);
        ctl.target.lerp(ctlTargetPos, 0.08);
        if (cam.position.distanceTo(camTargetPos) < 0.005 && ctl.target.distanceTo(ctlTargetPos) < 0.005) {
          cam.position.copy(camTargetPos);
          ctl.target.copy(ctlTargetPos);
          camTargetPos = null;
          ctlTargetPos = null;
        }
      }
      cb(ts);
    });
  };

  function initUI() {
    // Model Selectors
    var selPrincess = $('select-model-princess');
    var selSeraphina = $('select-model-seraphina');
    var selCompanion = $('select-model-companion');

    function setActiveModelCard(activeId) {
      [selPrincess, selSeraphina, selCompanion].forEach(function(el) {
        if (!el) return;
        var badge = el.querySelector('.model-badge');
        if (el.id === activeId) {
          el.classList.add('active');
          if (badge) { badge.textContent = 'Active'; badge.style.display = 'block'; }
        } else {
          el.classList.remove('active');
          if (badge) { badge.textContent = ''; badge.style.display = 'none'; }
        }
      });
    }

    if (selPrincess) {
      selPrincess.addEventListener('click', function() {
        setActiveModelCard('select-model-princess');
        loadModel('/models/princess.glb', 'princess');
      });
    }
    if (selSeraphina) {
      selSeraphina.addEventListener('click', function() {
        setActiveModelCard('select-model-seraphina');
        loadModel('/models/seraphina.glb', 'seraphina');
      });
    }
    if (selCompanion) {
      selCompanion.addEventListener('click', function() {
        setActiveModelCard('select-model-companion');
        loadModel('/models/vampire-companion.glb', 'companion');
      });
    }

    // Camera preset buttons
    var btnFace = $('btn-view-face');
    var btnFull = $('btn-view-full');
    var btnHands = $('btn-view-hands');
    var btnLegs = $('btn-view-legs');
    var btnFaceNav = $('btn-focus-face');
    var btnFullNav = $('btn-focus-body');

    if (btnFace) btnFace.addEventListener('click', function() { focusView('face'); });
    if (btnFull) btnFull.addEventListener('click', function() { focusView('full'); });
    if (btnHands) btnHands.addEventListener('click', function() { focusView('hands'); });
    if (btnLegs) btnLegs.addEventListener('click', function() { focusView('legs'); });
    if (btnFaceNav) btnFaceNav.addEventListener('click', function() { focusView('face'); });
    if (btnFullNav) btnFullNav.addEventListener('click', function() { focusView('full'); });

    // Reset pivot
    var btnResetPivot = $('btn-reset-pivot');
    if (btnResetPivot) {
      btnResetPivot.addEventListener('click', function() {
        ctl.target.set(0, 1.15, 0);
      });
    }

    // Idle Life toggle
    var btnIdle = $('btn-toggle-idle');
    if (btnIdle) {
      btnIdle.addEventListener('click', function() {
        idleOn = !idleOn;
        btnIdle.textContent = idleOn ? "Idle Life: ON" : "Idle Life: OFF";
        btnIdle.classList.toggle('active', idleOn);
      });
    }

    // Action Chips
    document.querySelectorAll('[data-act]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var a = this.getAttribute('data-act');
        act(a);
      });
    });

    // Dance Chips
    document.querySelectorAll('[data-dance]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var d = this.getAttribute('data-dance');
        startDance(d);
      });
    });

    // Dropdowns
    var selGesture = $('select-gesture');
    if (selGesture && typeof G !== 'undefined') {
      Object.keys(G).sort().forEach(function(k) {
        var opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k.replace(/_/g, ' ').replace(/\\b\\w/g, function(l){return l.toUpperCase()});
        selGesture.appendChild(opt);
      });
      selGesture.addEventListener('change', function() {
        if (this.value) { act(this.value); this.value = ""; }
      });
    }

    var selDance = $('select-dance');
    if (selDance && typeof DANCE !== 'undefined') {
      Object.keys(DANCE).sort().forEach(function(k) {
        var opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k.replace(/_/g, ' ').replace(/\\b\\w/g, function(l){return l.toUpperCase()});
        selDance.appendChild(opt);
      });
      selDance.addEventListener('change', function() {
        if (this.value) { startDance(this.value); this.value = ""; }
      });
    }

    var selExpr = $('select-expression');
    if (selExpr && typeof EXPR !== 'undefined') {
      Object.keys(EXPR).sort().forEach(function(k) {
        var opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k.replace(/_/g, ' ').replace(/\\b\\w/g, function(l){return l.toUpperCase()});
        selExpr.appendChild(opt);
      });
      selExpr.addEventListener('change', function() {
        if (this.value) { setEx(this.value, 4); this.value = ""; }
      });
    }

    // Layout Toggle (Panel: Right vs Left)
    var btnLayout = $('btn-toggle-layout');
    var appContainer = $('app-layout');
    if (btnLayout && appContainer) {
      btnLayout.addEventListener('click', function() {
        var isLeft = appContainer.classList.toggle('layout-panel-left');
        btnLayout.textContent = isLeft ? "Panel: Left" : "Panel: Right";
        size();
      });
    }
  }

  // Load Princess Model Initially
  loadModel('/models/princess.glb', 'princess');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }

  // Expose Global API
  window.Companion = {
    act: act,
    dance: startDance,
    loco: startLoco,
    setEx: setEx,
    focusView: focusView,
    loadModel: loadModel,
    stop: function() {
      curG = null; dance = null; loco = null;
      setEx('neutral', 1);
    },
    get N() { return N; },
    get bones() { return bones; },
    get ops() { return ops; },
    get curG() { return curG; },
    get currentDance() { return dance; },
    get model() { return model; },
    // Luffy AdvancedSkeleton Solvers
    luffyEvaluate: luffyEvaluate,
    luffyEvaluateQuaternion: luffyEvaluateQuaternion,
    createDampedSpring: createDampedSpring
  };
})();
`;

fs.writeFileSync('scripts/build-complete-companion-engine.js', fs.readFileSync(__filename, 'utf8'), 'utf8');
fs.writeFileSync('public/experiments/seraphina-engine.js', masterScript, 'utf8');
console.log('Successfully generated public/experiments/seraphina-engine.js! Total bytes:', masterScript.length);