const fs = require('fs');
const crypto = require('crypto');

const targetFile = 'public/experiments/floating-island.html';
const mirrorFile = '3d assets/Floating Island – Shrine Gate to Mana Portal.html';

let html = fs.readFileSync(targetFile, 'utf8');

// =========================================================================
// 1. Hide the cartoon block clouds (nube001..nube010) in setup(root)
// =========================================================================
const oldNubeCode = `      const lay = []; root.traverse(o => { if (/^nube\\d+$/.test(o.name)) lay.push(o) });
      lay.forEach((o, i) => {
        const pv = new THREE.Object3D(); pv.position.copy(IC); scene.add(pv); pv.updateMatrixWorld(true); pv.attach(o); pv.userData.w = [.06, -.045, .08, -.05, .035][i % 5];
        o.traverse(q => { if (q.isMesh && q.material.color) q.material.color.set(0xe3d8ff) }); fxs.push(d => { pv.rotation.y += pv.userData.w * d })
      });`;

const newNubeCode = `      // Hide legacy cartoon block clouds from GLTF in favor of procedural mountain clouds
      root.traverse(o => {
        if (/^nube\\d+/.test(o.name)) {
          o.visible = false;
          o.traverse(q => { if (q.isMesh) q.visible = false; });
        }
      });`;

if (html.includes(oldNubeCode)) {
  html = html.replace(oldNubeCode, newNubeCode);
  console.log('1. Replaced cartoon nube clouds with hidden flag');
} else {
  console.warn('1. Warning: oldNubeCode not found exact match');
}

// =========================================================================
// 2. Redesign world(): Procedural Mountain Clouds + Bridge Mist + Improved Birds with Obstacle Avoidance
// =========================================================================
const oldWorldStart = `    // ---- sky: drifting cloud banks with purple thunder, and birds ----
    function world() {`;

const oldWorldEnd = `          if (u.life <= 0) { scene.remove(o); birds.splice(i, 1) }
        }
      })
    }`;

const worldStartIdx = html.indexOf(oldWorldStart);
const worldEndIdx = html.indexOf(oldWorldEnd, worldStartIdx);

if (worldStartIdx !== -1 && worldEndIdx !== -1) {
  const fullOldWorld = html.slice(worldStartIdx, worldEndIdx + oldWorldEnd.length);
  
  const newWorldCode = `    // ---- sky: procedural realistic mountain clouds, rope bridge mist, and improved birds with obstacle avoidance ----
    function world() {
      // 1. High-fidelity procedural fractal mountain cloud texture (512x512)
      const cv = document.createElement('canvas'); cv.width = cv.height = 512; const cx = cv.getContext('2d');
      const imgData = cx.createImageData(512, 512);
      const dBuf = imgData.data;
      
      function hash2D(x, y) {
        let n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
      }
      function sNoise(x, y) {
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = x - ix, fy = y - iy;
        const sfx = fx * fx * (3 - 2 * fx), sfy = fy * fy * (3 - 2 * fy);
        const a = hash2D(ix, iy), b = hash2D(ix + 1, iy);
        const c = hash2D(ix, iy + 1), d = hash2D(ix + 1, iy + 1);
        return a + (b - a) * sfx + (c - a) * sfy + (a - b - c + d) * sfx * sfy;
      }
      function fbm(x, y) {
        let v = 0, amp = 0.52, f = 1.0;
        for (let o = 0; o < 4; o++) {
          v += amp * sNoise(x * f, y * f);
          amp *= 0.5; f *= 2.05;
        }
        return v;
      }

      for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 512; x++) {
          const nx = (x / 256.0 - 1.0), ny = (y / 256.0 - 1.0);
          const r = Math.sqrt(nx * nx + ny * ny);
          if (r >= 1.0) continue;
          const nv = fbm(x * 0.018, y * 0.018);
          const falloff = Math.pow(Math.max(0, 1.0 - r), 1.6);
          const a = falloff * (0.35 + 0.65 * nv);
          const idx = (y * 512 + x) * 4;
          dBuf[idx] = 238;     // R (soft silver-lavender)
          dBuf[idx + 1] = 230; // G
          dBuf[idx + 2] = 255; // B
          dBuf[idx + 3] = Math.min(255, Math.floor(a * 255));
        }
      }
      cx.putImageData(imgData, 0, 0);

      const ct = new THREE.CanvasTexture(cv); ct.encoding = THREE.sRGBEncoding;
      const clouds = worldClouds;

      // 2. Multi-scale Procedural Mountain Sky Clouds with Expansion & Swirling Wind
      for (let i = 0; i < 26; i++) {
        const g = new THREE.Group();
        const tier = Math.random();
        // Varied scales: massive mountain shelf clouds (tier > 0.7), medium billows, wispy streams
        const isShelf = tier > 0.72;
        const isWispy = tier < 0.28;
        const baseOpacity = isWispy ? 0.32 : isShelf ? 0.68 : 0.48;

        const mat = new THREE.SpriteMaterial({
          map: ct,
          color: isWispy ? 0xc8b8ff : isShelf ? 0xf0eaff : 0xe4dcff,
          transparent: true,
          opacity: baseOpacity,
          depthWrite: false,
          fog: false
        });
        const gm = new THREE.SpriteMaterial({
          map: ct,
          color: 0x9b6bff,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          fog: false
        });

        const puffCount = isShelf ? 9 : isWispy ? 4 : 6;
        const puffSpread = isShelf ? 14000 : 7000;
        const puffBaseScale = isShelf ? (18000 + Math.random() * 18000) : isWispy ? (5000 + Math.random() * 6000) : (10000 + Math.random() * 9000);

        for (let k = 0; k < puffCount; k++) {
          const s = new THREE.Sprite(mat);
          const sc = puffBaseScale * (0.75 + Math.random() * 0.5);
          s.scale.set(sc, sc * (0.45 + Math.random() * 0.3), 1);
          s.position.set(rb() * puffSpread, rb() * (puffSpread * 0.22), rb() * puffSpread);
          s.userData = { origScale: s.scale.clone(), phase: Math.random() * Math.PI * 2, expSp: 0.12 + Math.random() * 0.18 };
          g.add(s);
        }

        const gl = new THREE.Sprite(gm);
        gl.scale.set(puffBaseScale * 1.8, puffBaseScale * 1.1, 1);
        g.add(gl);
        scene.add(g);

        clouds.push({
          g, mat, gm,
          r: 16000 + Math.random() * 52000,
          a: Math.random() * 6.283,
          y: 2800 + Math.random() * 26000,
          w: (0.008 + Math.random() * 0.016) * (Math.random() < 0.5 ? -1 : 1),
          ph: Math.random() * 9,
          expansionSpeed: 0.15 + Math.random() * 0.2
        });
      }

      // 3. Realistic Mountain Mist Clouds Along the Rope Bridge
      const bridgeMistSprites = [];
      const bridgeMistMat = new THREE.SpriteMaterial({
        map: ct,
        color: 0xd8d0ff,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        fog: true
      });
      const bridgeMistGroup = new THREE.Group();
      bridgeMistGroup.name = 'bridgeMountainMist';

      // Bridge spans between top island (-12500, 850, 600) and lower island (-25500, -5800, 1500)
      for (let i = 0; i < 22; i++) {
        const s = new THREE.Sprite(bridgeMistMat);
        const t = i / 21;
        const bx = -12500 + t * (-25500 - (-12500)) + (Math.random() - 0.5) * 1600;
        const by = 850 + t * (-5800 - 850) - 200 + (Math.random() - 0.5) * 600;
        const bz = 600 + t * (1500 - 600) + (Math.random() - 0.5) * 1400;
        const sc = 3200 + Math.random() * 3000;
        s.scale.set(sc, sc * 0.55, 1);
        s.position.set(bx, by, bz);
        s.userData = {
          baseX: bx, baseY: by, baseZ: bz,
          driftSpeed: 35 + Math.random() * 45,
          phase: Math.random() * Math.PI * 2,
          rangeX: 1800
        };
        bridgeMistGroup.add(s);
        bridgeMistSprites.push(s);
      }
      scene.add(bridgeMistGroup);

      // Cloud Lightning
      const bm = new THREE.MeshBasicMaterial({ color: 0xefe4ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const gm2 = new THREE.MeshBasicMaterial({ color: 0x8a4dff, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false });
      const bolt = new THREE.Mesh(new THREE.BufferGeometry(), bm), bg = new THREE.Mesh(new THREE.BufferGeometry(), gm2), tl = new THREE.PointLight(0x9b6bff, 0, 0, 2);
      bolt.visible = bg.visible = false; scene.add(bolt, bg, tl);
      let tNext = 3 + Math.random() * 4, fl = null;
      function strike() {
        const c = clouds[Math.random() * clouds.length | 0], p0 = c.g.position.clone().add(V(rb() * 5000, rb() * 1500, rb() * 5000));
        const o = clouds[Math.random() * clouds.length | 0], p1 = Math.random() < .5 ? o.g.position.clone() : p0.clone().add(V(rb() * 9000, -6000 - Math.random() * 9000, rb() * 9000));
        const len = p0.distanceTo(p1), pts = []; for (let k = 0; k <= 12; k++) {
          const u = k / 12, p = p0.clone().lerp(p1, u); if (k > 0 && k < 12) p.add(V(rb() * 900, rb() * 450, rb() * 900)); pts.push(p)
        }
        const bpts = []; for (let k = 0; k < pts.length - 1; k++) { bpts.push(pts[k].x, pts[k].y, pts[k].z, pts[k + 1].x, pts[k + 1].y, pts[k + 1].z) }
        bolt.geometry.setAttribute('position', new THREE.Float32BufferAttribute(bpts, 3)); bolt.geometry.computeBoundingSphere();
        bg.geometry.setAttribute('position', new THREE.Float32BufferAttribute(bpts, 3)); bg.geometry.computeBoundingSphere();
        bolt.visible = bg.visible = true; fl = { t: 0, d: .35 + Math.random() * .25, c, p0 };
        tl.position.copy(p0); tl.intensity = 1.2e8; S.thunder(p0);
      }

      fxs.push(d => {
        // Procedural cloud drifting & organic breathing expansion
        for (const c of clouds) {
          c.a += c.w * d;
          c.g.position.set(Math.cos(c.a) * c.r, c.y + Math.sin(ts * .25 + c.ph) * 900, Math.sin(c.a) * c.r);
          const expFactor = 1.0 + 0.12 * Math.sin(ts * c.expansionSpeed + c.ph);
          for (let sIdx = 0; sIdx < c.g.children.length; sIdx++) {
            const child = c.g.children[sIdx];
            if (child.userData && child.userData.origScale) {
              const os = child.userData.origScale;
              child.scale.set(os.x * expFactor, os.y * expFactor, 1);
            }
          }
        }

        // Bridge mountain mist drifting and undulating
        for (let mIdx = 0; mIdx < bridgeMistSprites.length; mIdx++) {
          const ms = bridgeMistSprites[mIdx];
          const ud = ms.userData;
          ms.position.x = ud.baseX + Math.sin(ts * 0.35 + ud.phase) * ud.rangeX;
          ms.position.y = ud.baseY + Math.sin(ts * 0.65 + ud.phase) * 80;
          ms.position.z = ud.baseZ + Math.cos(ts * 0.45 + ud.phase) * 180;
          const pulse = 1.0 + 0.15 * Math.sin(ts * 0.5 + ud.phase);
          ms.scale.y = ms.scale.x * 0.55 * pulse;
        }

        tNext -= d; if (tNext <= 0) { strike(); tNext = 3 + Math.random() * 6 }
        if (fl) {
          fl.t += d; const p = fl.t / fl.d;
          if (p < 1) {
            const f = Math.sin(p * Math.PI) * (Math.random() < .4 ? 0 : 1);
            fl.c.gm.opacity = f * .85; bm.opacity = f; bg.opacity = f * .45;
            tl.intensity = f * 1.2e8;
          } else { fl.c.gm.opacity = 0; bolt.visible = bg.visible = false; tl.intensity = 0; fl = null }
        }
      });

      // 4. Improved Birds with Obstacle Avoidance & Articulated Wing Flap
      const birdWingGeo = new THREE.BufferGeometry();
      birdWingGeo.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0, 70,    0, 0, -60,   260, 0, -20,
        0, 0, 70,  260, 0, -20,   420, 0, -90,
        260, 0, -20, 420, 0, -90, 480, 0, -140
      ], 3));
      birdWingGeo.computeVertexNormals();

      const birdMat = new THREE.MeshStandardMaterial({
        color: 0xeae4ff,
        emissive: 0x4c1d95,
        emissiveIntensity: 0.38,
        roughness: 0.72,
        metalness: 0.08,
        side: THREE.DoubleSide
      });

      // Sleek tapered bird body
      const birdBodyGeo = new THREE.ConeGeometry(38, 140, 7);
      birdBodyGeo.rotateX(Math.PI * 0.5);

      // Registered solid architecture obstacles to avoid
      const birdObstacles = [
        { name: 'Torii Gate', x: 1394, y: 1500, z: 381, r: 1800 },
        { name: 'Mana Portal', x: 2200, y: 700, z: 381, r: 1600 },
        { name: 'Cherry Tree', x: 1100, y: 1100, z: 1200, r: 1500 },
        { name: 'Lamp House Altar', x: -6178, y: 400, z: 3293, r: 1800 },
        { name: 'Main Island Core', x: 500, y: 0, z: 400, r: 3200 },
        { name: 'Top Diorama Island Core', x: -8000, y: -400, z: 800, r: 4200 }
      ];

      const POI = [V(1394, 3800, 381), V(900, 2200, 60), at(2200, 1400), V(900, 2800, -3200), V(0, 2400, 0), V(-6000, 2200, 1800), V(-12000, 2000, 800)];
      const birds = worldBirds;
      let tb = 2 + Math.random() * 3;

      function flock() {
        const tg = POI[Math.random() * POI.length | 0], a = Math.random() * 6.283, dist = 18000 + Math.random() * 10000;
        const aim = tg.clone().add(V(rb() * 4000, rb() * 1800, rb() * 4000));
        const st = aim.clone().add(V(Math.cos(a) * dist, rb() * 4000 + 2200, Math.sin(a) * dist));
        const dir = aim.clone().sub(st).normalize();
        const sp = 850 + Math.random() * 600;
        const n = 2 + (Math.random() * 4 | 0);

        for (let i = 0; i < n && birds.length < 14; i++) {
          const g = new THREE.Group();
          const w1 = new THREE.Mesh(birdWingGeo, birdMat);
          const w2 = new THREE.Mesh(birdWingGeo, birdMat);
          w2.scale.x = -1;
          const bodyMesh = new THREE.Mesh(birdBodyGeo, birdMat);
          g.add(bodyMesh, w1, w2);
          g.position.copy(st).add(V(rb() * 900 * i, rb() * 400, rb() * 900 * i));
          g.visible = true;
          g.userData = {
            w1, w2,
            v: dir.clone().multiplyScalar(sp * (0.92 + Math.random() * 0.16)),
            ph: Math.random() * 99,
            fq: 3.2 + Math.random() * 2.2,
            sw: 0.12 + Math.random() * 0.2,
            life: 2.8 * dist / sp,
            lastYaw: Math.atan2(dir.x, dir.z)
          };
          scene.add(g);
          birds.push(g);
        }
      }

      fxs.push(d => {
        tb -= d; if (tb <= 0) { flock(); tb = 4 + Math.min(-Math.log(Math.random()) * 8, 30); }
        for (let i = birds.length - 1; i >= 0; i--) {
          const o = birds[i], u = o.userData;
          u.life -= d;

          // Natural flight meander
          u.v.applyAxisAngle(U, u.sw * Math.sin(ts * 0.5 + u.ph) * d);
          u.v.y += Math.sin(ts * 0.7 + u.ph) * 50 * d;

          // Object & Architecture Avoidance Repulsion
          for (let k = 0; k < birdObstacles.length; k++) {
            const obs = birdObstacles[k];
            const dx = o.position.x - obs.x;
            const dy = o.position.y - obs.y;
            const dz = o.position.z - obs.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < obs.r * obs.r) {
              const dist = Math.sqrt(distSq) || 1;
              const push = (1.0 - dist / obs.r) * 2400.0 * d;
              u.v.x += (dx / dist) * push;
              u.v.y += (Math.abs(dy) < 400 ? 1.0 : (dy / dist)) * push;
              u.v.z += (dz / dist) * push;
            }
          }

          // Safe Flight Floor Clearance (never clip through ground or mountains)
          let floorAlt = -100;
          if (o.position.x > -4000) floorAlt = 500;
          else if (o.position.x > -14000) floorAlt = 200;
          if (o.position.y < floorAlt + 450) {
            u.v.y += (floorAlt + 450 - o.position.y) * 4.5 * d;
          }

          u.v.clampLength(650, 1500);

          if (Math.random() < 0.25 * d) S.chirp(o.position);
          o.position.addScaledVector(u.v, d);

          // Smooth orientation and banking roll
          o.lookAt(o.position.clone().add(u.v));
          const currentYaw = Math.atan2(u.v.x, u.v.z);
          const yawDelta = currentYaw - (u.lastYaw || currentYaw);
          o.rotation.z = Math.max(-0.65, Math.min(0.65, -yawDelta * 12.0));
          u.lastYaw = currentYaw;

          // Articulated sinusoidal wing flap
          const flap = Math.sin(ts * u.fq + u.ph);
          u.w1.rotation.z = flap * 0.55;
          u.w2.rotation.z = -flap * 0.55;
          u.w1.rotation.x = Math.cos(ts * u.fq + u.ph) * 0.14;
          u.w2.rotation.x = Math.cos(ts * u.fq + u.ph) * 0.14;

          if (u.life <= 0) { scene.remove(o); birds.splice(i, 1); }
        }
      });
    }`;

  html = html.slice(0, worldStartIdx) + newWorldCode + html.slice(worldEndIdx + oldWorldEnd.length);
  console.log('2. Successfully replaced world() with procedural clouds, bridge mist, and improved birds');
} else {
  console.error('2. Error: Could not locate world() bounds');
}

// =========================================================================
// 3. Terrain Materials Sync + Smooth Triplanar/World Shader + Road Blend
// =========================================================================
const oldTerrainInDio = `        // Copy main island ground/soil visual looks and color to diorama lands
        if (n === 'pDisc1_Grass_0' || n === 'pasted__pDisc1_Grass_0') {
          if (tierraMat) {
            const gm = tierraMat.clone();
            if (gm.map) {
              gm.map = gm.map.clone();
              gm.map.wrapS = gm.map.wrapT = THREE.RepeatWrapping;
              gm.map.repeat.set(3.5, 3.5);
              gm.map.needsUpdate = true;
            }
            o.material = gm;
          } else {
            o.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(0.75, 0.95, 0.32),
              roughness: 0.92,
              metalness: 0
            });
          }
          o.material.needsUpdate = true;
          return;
        }`;

const newTerrainInDio = `        // Ground will be smoothly textured via syncTerrainMaterials()
        if (n === 'pDisc1_Grass_0' || n === 'pasted__pDisc1_Grass_0') {
          return;
        }`;

if (html.includes(oldTerrainInDio)) {
  html = html.replace(oldTerrainInDio, newTerrainInDio);
  console.log('3a. Replaced old terrain check in buildDiorama');
} else {
  console.warn('3a. Warning: oldTerrainInDio not found exact match');
}

// Add the master syncTerrainMaterials() function and stone stepping road generator
const syncTerrainCode = `
    // Master Terrain Material & Road Generator: Seamless, Tile-Free, Emerald Moss with Beaten Earth Road
    function syncTerrainMaterials() {
      if (!tierraMat) return;
      const baseTex = tierraMat.map ? tierraMat.map.clone() : null;
      if (baseTex) baseTex.wrapS = baseTex.wrapT = THREE.RepeatWrapping;

      const createSmoothTerrainMat = (isTopIsland) => {
        const mat = new THREE.MeshStandardMaterial({
          map: baseTex,
          color: new THREE.Color(0.72, 0.95, 0.38),
          roughness: 0.92,
          metalness: 0.02
        });

        mat.onBeforeCompile = (shader) => {
          shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            \`#include <common>
            varying vec3 vTerrainWorldPos;
            \`
          );
          shader.vertexShader = shader.vertexShader.replace(
            '#include <worldpos_vertex>',
            \`#include <worldpos_vertex>
            vTerrainWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
            \`
          );

          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            \`#include <common>
            varying vec3 vTerrainWorldPos;

            float distToSeg(vec2 p, vec2 a, vec2 b) {
              vec2 pa = p - a, ba = b - a;
              float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
              return length(pa - ba * h);
            }
            \`
          );

          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            \`#ifdef USE_MAP
              // Dual-scale de-synchronized world-space sampling: completely destroys checkerboards and tile edges
              vec2 uv1 = vTerrainWorldPos.xz * 0.00030;
              vec2 uv2 = vec2(vTerrainWorldPos.z, -vTerrainWorldPos.x) * 0.00082 + vec2(0.37, 0.71);
              vec4 samp1 = texture2D(map, uv1);
              vec4 samp2 = texture2D(map, uv2);

              float blendNoise = sin(vTerrainWorldPos.x * 0.0011) * cos(vTerrainWorldPos.z * 0.0011) * 0.5 + 0.5;
              vec4 sampledDiffuseColor = mix(samp1, samp2, blendNoise);

              \${isTopIsland ? \`
              // Road from bridge entrance (-12500, 850) to main island entrance (-3500, 381)
              vec2 p0 = vec2(-12500.0, 850.0);
              vec2 p1 = vec2(-8200.0, 700.0);
              vec2 p2 = vec2(-3500.0, 381.0);
              float dRoad = min(distToSeg(vTerrainWorldPos.xz, p0, p1), distToSeg(vTerrainWorldPos.xz, p1, p2));

              // Soft feathered road blend matching main island beaten-earth/stone road
              float roadFactor = 1.0 - smoothstep(110.0, 240.0, dRoad);
              if (roadFactor > 0.001) {
                // Earth-stone path color matching main island
                vec3 roadCol = vec3(0.52, 0.49, 0.42);
                float grain = fract(sin(dot(vTerrainWorldPos.xz, vec2(12.9898, 78.233))) * 43758.5453);
                roadCol *= (0.92 + 0.16 * grain);
                sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, roadCol, roadFactor * 0.90);
              }
              \` : ''}

              diffuseColor *= sampledDiffuseColor;
            #endif
            \`
          );
        };

        return mat;
      };

      if (dioramaRoot) {
        const p1 = dioramaRoot.getObjectByName('pDisc1_Grass_0');
        const p2 = dioramaRoot.getObjectByName('pasted__pDisc1_Grass_0');
        if (p1) { p1.material = createSmoothTerrainMat(true); p1.material.needsUpdate = true; }
        if (p2) { p2.material = createSmoothTerrainMat(false); p2.material.needsUpdate = true; }
      }

      // Sync portal stone platform and stairs with ground material
      if (islandRoot) {
        islandRoot.traverse(o => {
          if (!o.isMesh) return;
          const n = o.name;
          if (n.startsWith('Icosphere_3') || (n.startsWith('Cube00') && n.endsWith('_0'))) {
            o.material = tierraMat.clone();
            o.material.roughness = 0.92;
            o.material.needsUpdate = true;
          }
        });
      }
    }
`;

// Insert syncTerrainMaterials right before setup(root)
const setupIdx = html.indexOf('function setup(root) {');
if (setupIdx !== -1) {
  html = html.slice(0, setupIdx) + syncTerrainCode + '\n' + html.slice(setupIdx);
  console.log('3b. Inserted syncTerrainMaterials() before setup()');
}

// Ensure syncTerrainMaterials() is called in setup(root) and buildDiorama(model)
html = html.replace('if (dioramaRoot) populateDioramaFoliage(dioramaRoot, root);',
  'syncTerrainMaterials();\n      if (dioramaRoot) populateDioramaFoliage(dioramaRoot, root);');

html = html.replace('if (islandRoot) populateDioramaFoliage(model, islandRoot);',
  'syncTerrainMaterials();\n      if (islandRoot) populateDioramaFoliage(model, islandRoot);');

// =========================================================================
// 4. Lamp House (Shrine Altar polySurface7) Color & Shader matching Main Island Shrines
// =========================================================================
html = html.replace('const localDy = 120 / 220;', 'const localDy = -30 / 220; // firmly seated on grassy ground');

const oldAltarMatBlock = `          const isAltar = n.includes('lambert14') || n.includes('polySurface7');
          const isChest = n.includes('lambert15') || n.includes('Chest');

          const col = isCliff ? 0x0d151e :
                      isGrass ? 0x1a4022 :
                      isReeds ? 0x486b36 :
                      isLeaves ? 0x1c1424 :
                      isRock ? 0x16222e :
                      isWood ? 0x2e2420 :
                      isAltar ? 0xc8d4ce : // neutral weathered stone granite/limestone, zero pink tint
                      isChest ? 0x2c221a : 0x16222e;

          const newM = new THREE.MeshStandardMaterial({
            map: m.map,
            color: col,
            roughness: isCliff ? 0.95 : (isRock || isWood) ? 0.90 : 0.82,
            metalness: isCliff ? 0.04 : isRock ? 0.08 : isChest ? 0.12 : 0.02,
            side: (isLeaves || isWood || isReeds) ? THREE.DoubleSide : (m.side || THREE.FrontSide),
            alphaTest: (isLeaves || isReeds) ? 0.42 : (m.alphaTest || 0),
            transparent: isLeaves || isReeds || m.transparent,
            opacity: m.opacity || 1.0,
            envMapIntensity: 0.75
          });`;

const newAltarMatBlock = `          const isAltar = n.includes('lambert14') || n.includes('polySurface7');
          const isChest = n.includes('lambert15') || n.includes('Chest');

          // Lamp house color matches main island stone shrines (RetopoGroup003: 0xbcc1c1)
          const col = isCliff ? 0x0d151e :
                      isGrass ? 0x1a4022 :
                      isReeds ? 0x486b36 :
                      isLeaves ? 0x1c1424 :
                      isRock ? 0x16222e :
                      isWood ? 0x2e2420 :
                      isAltar ? 0xbcc1c1 : // identical to RetopoGroup003 on main island
                      isChest ? 0x2c221a : 0x16222e;

          const newM = new THREE.MeshStandardMaterial({
            map: m.map,
            color: col,
            roughness: isCliff ? 0.95 : (isRock || isWood) ? 0.90 : isAltar ? 0.92 : 0.82,
            metalness: isCliff ? 0.04 : isRock ? 0.08 : isChest ? 0.12 : 0.0,
            side: (isLeaves || isWood || isReeds) ? THREE.DoubleSide : (m.side || THREE.FrontSide),
            alphaTest: (isLeaves || isReeds) ? 0.42 : (m.alphaTest || 0),
            transparent: isLeaves || isReeds || m.transparent,
            opacity: m.opacity || 1.0,
            envMapIntensity: 0.75
          });

          if (isAltar) {
            newM.onBeforeCompile = (shader) => {
              shader.fragmentShader = shader.fragmentShader.replace(
                'diffuseColor *= sampledDiffuseColor;',
                \`
                // Preserve moss roof while neutralizing stone pillars, walls, and stairs
                bool isMoss = (sampledDiffuseColor.g > sampledDiffuseColor.r * 1.10) && (sampledDiffuseColor.g > sampledDiffuseColor.b * 1.20);
                if (!isMoss) {
                  float luma = dot(sampledDiffuseColor.rgb, vec3(0.299, 0.587, 0.114));
                  // Cool ancient weathered temple granite matching RetopoGroup003, zero pink tint
                  sampledDiffuseColor.rgb = vec3(luma * 0.48, luma * 0.52, luma * 0.50);
                }
                diffuseColor *= sampledDiffuseColor;
                \`
              );
            };
          }`;

if (html.includes(oldAltarMatBlock)) {
  html = html.replace(oldAltarMatBlock, newAltarMatBlock);
  console.log('4. Replaced lamp house material block with main island shrine shader');
} else {
  console.warn('4. Warning: oldAltarMatBlock not found exact match');
}

html = html.replace(
  'dioramaFlameLight = new THREE.PointLight(0xff9933, 3.2e6, 0, 2);',
  'dioramaFlameLight = new THREE.PointLight(0xff9933, 1.2e6, 950, 2);'
);
html = html.replace(
  'dioramaFlameLight.intensity = 3.2e6 * (0.85 + 0.12 * Math.sin(ts * 11.0) + 0.06 * Math.sin(ts * 23.3));',
  'dioramaFlameLight.intensity = 1.2e6 * (0.85 + 0.12 * Math.sin(ts * 11.0) + 0.06 * Math.sin(ts * 23.3));'
);

// =========================================================================
// 5. Purple Grass Flowers Like Cherry Blossom Tree + Strict Exclusion
// =========================================================================
const oldShrineFlanks = `      // Shrine surround foliage (framing both sides of shrine stairs, avoiding shrine collision box)
      const shrineFlanks = [
        { cx: -6750, cz: 4050, r: 280 },
        { cx: -5550, cz: 3100, r: 280 }
      ];
      for (const flank of shrineFlanks) {
        for (let j = 0; j < 12; j++) {
          const fx = flank.cx + (rnd() - 0.5) * flank.r * 2;
          const fz = flank.cz + (rnd() - 0.5) * flank.r * 2;
          if (!isClear(fx, fz, 'top')) continue;
          const fy = findGround(fx, fz, 'top');
          if (fy !== null) {
            grassPts.push({ x: fx, y: fy, z: fz });
            if (j % 2 === 0) reedPts.push({ x: fx, y: fy, z: fz });
            if (j % 3 === 0) flowerPts.push({ x: fx, y: fy, z: fz });
          }
        }
      }`;

if (html.includes(oldShrineFlanks)) {
  html = html.replace(oldShrineFlanks, '// Shrine flanks removed to prevent any clipping near shrine altar');
  console.log('5a. Removed shrineFlanks');
} else {
  console.warn('5a. Warning: oldShrineFlanks not found exact match');
}

const oldIsClear = `      const isClear = (x, z, island) => {
        if (island === 'lower') {
          if (Math.hypot(x - pondCenter.x, z - pondCenter.z) < pondCenter.r) return false;
        }
        for (let k = 0; k < exclusionZones.length; k++) {
          const zZone = exclusionZones[k];
          if (x >= zZone.minX && x <= zZone.maxX && z >= zZone.minZ && z <= zZone.maxZ) {
            return false;
          }
        }
        return true;
      };`;

const newIsClear = `      // Broad Lamp House / Shrine clearance zone
      const shrineClearZone = { minX: -8200, maxX: -4400, minZ: 1400, maxZ: 5000 };

      const isClear = (x, z, island) => {
        if (island === 'lower') {
          if (Math.hypot(x - pondCenter.x, z - pondCenter.z) < pondCenter.r) return false;
        } else if (island === 'top') {
          // Never spawn on or near the road
          const dRoad = distToSegment(x, z, -12500, 850, -3500, 381);
          if (dRoad < 260) return false;
          // Never spawn on or near the lamp house / shrine
          if (x >= shrineClearZone.minX && x <= shrineClearZone.maxX &&
              z >= shrineClearZone.minZ && z <= shrineClearZone.maxZ) return false;
        }
        for (let k = 0; k < exclusionZones.length; k++) {
          const zZone = exclusionZones[k];
          if (x >= zZone.minX && x <= zZone.maxX && z >= zZone.minZ && z <= zZone.maxZ) {
            return false;
          }
        }
        return true;
      };`;

if (html.includes(oldIsClear)) {
  html = html.replace(oldIsClear, newIsClear);
  console.log('5b. Updated isClear with road and shrine exclusion');
}

const oldFlowerMatBlock = `      // 3. Flowers InstancedMesh with GPU Wind Movement
      const flowerMat = sakura.material.clone();
      flowerMat.color.setRGB(0.95, 0.90, 1.0);
      flowerMat.alphaTest = 0.5;
      flowerMat.side = THREE.DoubleSide;`;

const newFlowerMatBlock = `      // 3. Flowers InstancedMesh: Rich Purple Cherry Blossom Palette with GPU Wind
      const flowerMat = sakura.material.clone();
      flowerMat.color.setHex(0xd86bf4); // vibrant purple matching cherry blossom tree
      flowerMat.emissive = new THREE.Color(0x581c87);
      flowerMat.emissiveIntensity = 0.45;
      flowerMat.alphaTest = 0.48;
      flowerMat.side = THREE.DoubleSide;`;

if (html.includes(oldFlowerMatBlock)) {
  html = html.replace(oldFlowerMatBlock, newFlowerMatBlock);
  console.log('5c. Updated flowerMat to purple cherry blossom');
}

const oldFlowerInstLoop = `      const flowerInst = new THREE.InstancedMesh(sakura.geometry, flowerMat, flowerPts.length);
      flowerInst.name = 'dioramaFoliageFlowers';
      for (let i = 0; i < flowerPts.length; i++) {
        const p = flowerPts[i];
        dummy.position.set(p.x, p.y + 45, p.z);
        dummy.rotation.set((rnd() - 0.5) * 0.2, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.2);
        const s = 0.18 + rnd() * 0.12;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        flowerInst.setMatrixAt(i, dummy.matrix);
      }
      flowerInst.instanceMatrix.needsUpdate = true;
      scene.add(flowerInst);`;

const newFlowerInstLoop = `      const flowerInst = new THREE.InstancedMesh(sakura.geometry, flowerMat, flowerPts.length);
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
        const s = 0.20 + rnd() * 0.14;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        flowerInst.setMatrixAt(i, dummy.matrix);
        flowerInst.setColorAt(i, purplePalette[i % purplePalette.length]);
      }
      flowerInst.instanceMatrix.needsUpdate = true;
      if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
      scene.add(flowerInst);`;

if (html.includes(oldFlowerInstLoop)) {
  html = html.replace(oldFlowerInstLoop, newFlowerInstLoop);
  console.log('5d. Updated flowerInst loop with purple instance colors');
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

