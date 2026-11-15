const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'experiments', 'kagemi-island.html');
let content = fs.readFileSync(targetPath, 'utf8');

// The JS implementation of KagemiAudioManager and LandingSequenceController
const sequenceJS = `
    /* =========================================================================
       KAGEMI AUDIO & BGM MANAGER (AUTHENTIC MAIN LANDING PAGE BGM PLAYLIST)
       ========================================================================= */
    const KAGEMI_BGM_TRACKS = [
      { title: "Hiisi Island Night (To Light the Aeon Dark)", url: "/bgm/Hiisi Island Night OST 1 (To Light the Aeon Dark Motif)  Genshin Impact Luna I OST.mp3" },
      { title: "Hiisi Island Day OST 3", url: "/bgm/Hiisi Island Day OST 3  Genshin Impact 6.0 OST.mp3" },
      { title: "Through the Silent Frostbound Night", url: "/bgm/[Finalized] Through the Silent Frostbound Night - Hiisi Island OST 2  Genshin Impact 6.0 OST.mp3" },
      { title: "Columbina Nod-Krai Leitmotif", url: "/bgm/Columbina Nod-Krai Leitmotif Vocal 2 - Silvermoon Hall (Red)  Genshin Impact 6.0 OST.mp3" },
      { title: "Columbina's Lullaby Vocal", url: "/bgm/[Final V4] Columbina's Lullaby Vocal - Maiden Flowerbed (Blue)  Genshin Impact 6.0 OST.mp3" },
      { title: "Lullaby of the New Moon", url: "/bgm/Lullaby of the New Moon (III)_ Petala ceciderunt - Silvermoon Hall (White)  Genshin Impact 6.0 OST.mp3" },
      { title: "Dawn Winery Theme", url: "/bgm/Dawn Winery Theme.mp3" },
      { title: "The Outlander Who Caught the Wind", url: "/bgm/The Outlander Who Caught the Wind.mp3" },
      { title: "Overture of Falling Stars", url: "/bgm/Overture of Falling Stars.mp3" },
      { title: "Homecoming to Port", url: "/bgm/Homecoming to Port.mp3" },
      { title: "Bleach OST - Soundscape to Ardor", url: "/bgm/Bleach OST 3 - Soundscape to Ardor.mp3" },
      { title: "Madoka Magica - Take Your Hands", url: "/bgm/Mahou Shoujo Madoka Magica Rebellion OST - Take Your Hands.mp3" },
      { title: "Sad Anime OST - Eye Water", url: "/bgm/Sad Anime Ost _ Eye Water - Guitar.mp3" },
      { title: "Naruto Shippuden - Man of the World", url: "/bgm/Naruto Shippuuden Sountrack (Man of the world).mp3" }
    ];

    const KAGEMI_SFX_FILES = {
      title: '/sfx/title.mp3',
      drone: '/sfx/drone.mp3',
      door: '/sfx/door.mp3',
      portal: '/sfx/portal.mp3',
      glitch: '/sfx/glitch.mp3',
      tunnel: '/sfx/tunnel.mp3',
      destination: '/sfx/destination.mp3'
    };

    class KagemiAudioEngine {
      constructor() {
        this.bgmAudio = null;
        this.currentBgmIdx = -1;
        this.bgmEnabled = true;
        this.sfxEnabled = true;
        this.sfxPool = new Map();
        this.toastTimer = null;
        this.fadeInterval = null;
        this.targetVol = 0.35;
      }

      init() {
        // Pre-create SFX Audio instances
        Object.entries(KAGEMI_SFX_FILES).forEach(([key, url]) => {
          try {
            const a = new Audio(url);
            a.preload = 'auto';
            this.sfxPool.set(key, a);
          } catch(e) {}
        });
      }

      playSfx(key, vol = 0.6, loop = false) {
        if (!this.sfxEnabled) return;
        const a = this.sfxPool.get(key);
        if (a) {
          try {
            a.currentTime = 0;
            a.volume = vol;
            a.loop = loop;
            const p = a.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          } catch(e) {}
        }
      }

      stopSfx(key) {
        const a = this.sfxPool.get(key);
        if (a) {
          try {
            a.pause();
            a.currentTime = 0;
            a.loop = false;
          } catch(e) {}
        }
      }

      stopAllSfx() {
        this.sfxPool.forEach(a => {
          try { a.pause(); a.currentTime = 0; a.loop = false; } catch(e) {}
        });
      }

      playBgm(idx) {
        if (!this.bgmEnabled) return;
        if (idx < 0 || idx >= KAGEMI_BGM_TRACKS.length) idx = 0;
        this.currentBgmIdx = idx;
        const track = KAGEMI_BGM_TRACKS[idx];

        if (this.bgmAudio) {
          try {
            this.bgmAudio.pause();
            this.bgmAudio = null;
          } catch(e) {}
        }

        try {
          const a = new Audio(track.url);
          a.preload = 'auto';
          a.volume = 0;
          a.onended = () => { this.nextBgm(); };
          this.bgmAudio = a;

          const p = a.play();
          if (p && typeof p.catch === 'function') {
            p.catch(err => {
              console.warn('[BGM Autoplay prevented, will start on next interaction]:', err);
            });
          }

          // Smooth 2s fade in
          let v = 0;
          if (this.fadeInterval) clearInterval(this.fadeInterval);
          this.fadeInterval = setInterval(() => {
            if (!this.bgmAudio) { clearInterval(this.fadeInterval); return; }
            v = Math.min(this.targetVol, v + 0.025);
            this.bgmAudio.volume = v;
            if (v >= this.targetVol) clearInterval(this.fadeInterval);
          }, 80);

          this.showToast(track.title);
          this.updateToolbarLabel();
        } catch(err) {
          console.warn('[BGM Play Error]:', err);
        }
      }

      playRandomBgm() {
        const nextIdx = Math.floor(Math.random() * KAGEMI_BGM_TRACKS.length);
        this.playBgm(nextIdx);
      }

      nextBgm() {
        const nextIdx = (this.currentBgmIdx + 1) % KAGEMI_BGM_TRACKS.length;
        this.playBgm(nextIdx);
      }

      toggleBgm() {
        this.bgmEnabled = !this.bgmEnabled;
        if (!this.bgmEnabled) {
          if (this.bgmAudio) {
            try { this.bgmAudio.pause(); } catch(e) {}
          }
        } else {
          if (this.bgmAudio && this.bgmAudio.src) {
            this.bgmAudio.play().catch(() => {});
          } else {
            this.playRandomBgm();
          }
        }
        this.updateToolbarLabel();
      }

      updateToolbarLabel() {
        const btn = document.getElementById('btn-bgm-toggle');
        if (btn) {
          btn.textContent = this.bgmEnabled ? '♫ Music: On' : '♫ Music: Off';
          btn.classList.toggle('on', this.bgmEnabled);
        }
      }

      showToast(trackTitle) {
        const toast = document.getElementById('kagemi-bgm-toast');
        const titleEl = document.getElementById('k-bgm-title');
        if (!toast || !titleEl) return;

        titleEl.textContent = 'Now Playing: ' + trackTitle;
        toast.classList.add('visible');

        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
          toast.classList.remove('visible');
        }, 5000);
      }
    }

    const kagemiAudio = new KagemiAudioEngine();
    window.kagemiAudio = kagemiAudio;


    /* =========================================================================
       AUTHENTIC LANDING ANIMATION SEQUENCE CONTROLLER
       ========================================================================= */
    let landingShake = 0;

    class LandingSequenceManager {
      constructor() {
        this.active = false;
        this.stage = 'idle'; // 'title', 'flyover', 'drop', 'crouch', 'stand', 'confusion', 'walk', 'brace', 'push_suction', 'tunnel', 'arrival'
        this.stageElapsed = 0;
        this.totalElapsed = 0;
        this.walkBobT = 0;
        this.swayAngle = 0;
        this.savedCamPos = new THREE.Vector3();
        this.savedCamLook = new THREE.Vector3();

        // Key Points in 3D Space
        this.islandCenter = new THREE.Vector3(897, 0, 66);
        this.dropTarget = new THREE.Vector3(-28500, -5820 + 90, 1600);
        this.stairsFoot = null; // Calculated dynamically from PW.c
      }

      start() {
        this.active = true;
        this.stageElapsed = 0;
        this.totalElapsed = 0;
        this.walkBobT = 0;
        this.swayAngle = 0;
        landingShake = 0;

        // Ensure audio is initialized and unlocked
        kagemiAudio.init();
        audioInit();
        if (S.ac && S.ac.state === 'suspended') S.ac.resume();

        // Show skip button
        const skipBtn = document.getElementById('kagemi-seq-skip-btn');
        if (skipBtn) skipBtn.style.display = 'flex';

        // Set mode
        setMode('landing_sequence');

        // Phase 1: Title Card Intro
        this.setStage('title');
      }

      setStage(newStage) {
        this.stage = newStage;
        this.stageElapsed = 0;
        console.log('[Landing Sequence Stage]:', newStage);

        const titleCard = document.getElementById('kagemi-cinematic-title');
        const braceModal = document.getElementById('kagemi-brace-modal');
        const whiteout = document.getElementById('kagemi-whiteout-overlay');

        if (newStage === 'title') {
          if (titleCard) {
            titleCard.style.display = 'flex';
            titleCard.style.opacity = '1';
            titleCard.classList.add('active');
          }
          kagemiAudio.playSfx('title', 0.8);
          // Start BGM swelling in
          setTimeout(() => {
            if (!kagemiAudio.bgmAudio || kagemiAudio.bgmAudio.paused) {
              kagemiAudio.playRandomBgm();
            }
          }, 800);
        } else if (newStage === 'flyover') {
          if (titleCard) {
            titleCard.style.opacity = '0';
            setTimeout(() => { titleCard.style.display = 'none'; titleCard.classList.remove('active'); }, 800);
          }
          kagemiAudio.playSfx('drone', 0.5, true);
        } else if (newStage === 'drop') {
          kagemiAudio.stopSfx('drone');
          kagemiAudio.playSfx('drone', 0.75, false);
        } else if (newStage === 'crouch') {
          landingShake = 3.5;
          kagemiAudio.playSfx('door', 0.6); // Impact thud
          playGenshinChime(true);
        } else if (newStage === 'stand') {
          landingShake = 0;
        } else if (newStage === 'walk') {
          // Footsteps will play during walk update
        } else if (newStage === 'brace') {
          if (document.exitPointerLock) document.exitPointerLock();
          if (braceModal) braceModal.classList.add('active');
          playGenshinChime(true);
        } else if (newStage === 'push_suction') {
          if (braceModal) braceModal.classList.remove('active');
          kagemiAudio.playSfx('door', 0.8);
          kagemiAudio.playSfx('portal', 0.8, true);
          kagemiAudio.playSfx('glitch', 0.7, true);
          landingShake = 5.0;
        } else if (newStage === 'tunnel') {
          kagemiAudio.stopSfx('portal');
          kagemiAudio.stopSfx('glitch');
          kagemiAudio.playSfx('tunnel', 0.8, true);
          landingShake = 0;
          enterTunnel();
        } else if (newStage === 'arrival') {
          kagemiAudio.stopSfx('tunnel');
          kagemiAudio.playSfx('destination', 0.9);
          if (whiteout) {
            whiteout.style.opacity = '1';
            setTimeout(() => { whiteout.style.opacity = '0'; }, 300);
          }
          exitTunnel();
          this.complete();
        }
      }

      update(d) {
        if (!this.active) return;
        this.stageElapsed += d;
        this.totalElapsed += d;

        // Apply camera shake if active
        if (landingShake > 0) {
          landingShake = Math.max(0, landingShake - d * 2.5);
          cam.position.x += (Math.random() - 0.5) * landingShake * 35;
          cam.position.y += (Math.random() - 0.5) * landingShake * 25;
          cam.position.z += (Math.random() - 0.5) * landingShake * 35;
        }

        const t = this.stageElapsed;

        switch (this.stage) {
          case 'title': {
            // Position camera high above looking down at the island diorama
            cam.position.set(-16000, 4200, 8000);
            cam.lookAt(this.islandCenter);
            if (t >= 3.2) {
              this.setStage('flyover');
            }
            break;
          }

          case 'flyover': {
            const flyDuration = 8.5;
            const p = Math.min(1.0, t / flyDuration);
            const easeOut = 1 - Math.pow(1 - p, 3);

            // Orbit 1.25 laps around island center
            const angle = easeOut * 2.5 * Math.PI - 1.2;
            const radius = 16000 * (1 - easeOut) + 8500 * easeOut;
            const alt = 4200 * (1 - easeOut) + 1400 * easeOut;

            const cx = this.islandCenter.x + Math.sin(angle) * radius;
            const cz = this.islandCenter.z + Math.cos(angle) * radius;

            cam.position.set(cx, alt, cz);
            cam.lookAt(this.islandCenter.x, 300, this.islandCenter.z);
            cam.fov = 70 - easeOut * 15;
            cam.updateProjectionMatrix();

            if (p >= 1.0) {
              this.setStage('drop');
            }
            break;
          }

          case 'drop': {
            const dropDur = 1.6;
            const p = Math.min(1.0, t / dropDur);
            // Accelerate downward (quadratic ease-in)
            const easeIn = p * p;

            const startY = 3200;
            const targetY = -5820 + 90;
            const currentY = startY * (1 - easeIn) + targetY * easeIn;

            cam.position.set(-28500, currentY, 1600);
            cam.lookAt(-25000, currentY - 100, 1500);

            if (p >= 1.0) {
              this.setStage('crouch');
            }
            break;
          }

          case 'crouch': {
            // Hits ground impact
            const crouchDur = 1.0;
            cam.position.set(-28500, -5820 + 25, 1600);
            cam.lookAt(-26000, -5820 + 10, 1500);

            if (t >= crouchDur) {
              this.setStage('stand');
            }
            break;
          }

          case 'stand': {
            // Smoothly raise camera to standing eye height
            const standDur = 1.2;
            const p = Math.min(1.0, t / standDur);
            const ease = p * p * (3 - 2 * p);

            const crouchY = -5820 + 25;
            const standY = -5820 + 90;
            const currentY = crouchY * (1 - ease) + standY * ease;

            cam.position.set(-28500, currentY, 1600);
            cam.lookAt(-24000, currentY, 1500);

            if (p >= 1.0) {
              this.setStage('confusion');
            }
            break;
          }

          case 'confusion': {
            // Sway head left and right taking in the scenery
            const confDur = 2.2;
            this.swayAngle += d * 2.5;
            const yawOffset = Math.sin(this.swayAngle) * 0.45;

            const lookTarget = new THREE.Vector3(-24000, -5820 + 90, 1500);
            lookTarget.z += Math.sin(this.swayAngle) * 3500;

            cam.position.set(-28500, -5820 + 90, 1600);
            cam.lookAt(lookTarget);

            if (t >= confDur) {
              this.setStage('walk');
            }
            break;
          }

          case 'walk': {
            // Strides smoothly forward along the bridge and approach path
            const walkDur = 4.5;
            const p = Math.min(1.0, t / walkDur);
            const ease = p * p * (3 - 2 * p);

            this.walkBobT += d * 7.0;
            const headBob = Math.sin(this.walkBobT) * 7.0;
            const headSway = Math.sin(this.walkBobT * 0.5) * 5.0;

            // Advance from small island lawn to in front of shrine stairs
            const startX = -28500, startZ = 1600, startY = -5820 + 90;
            const targetX = PW ? (PW.c.x - 2200) : -800;
            const targetZ = PW ? PW.c.z : 400;
            const targetY = PW ? (PW.c.y + 60) : 760;

            const curX = startX * (1 - ease) + targetX * ease;
            const curY = startY * (1 - ease) + targetY * ease + headBob;
            const curZ = startZ * (1 - ease) + targetZ * ease + headSway;

            cam.position.set(curX, curY, curZ);
            const lookAtTarget = PW ? PW.c.clone().setY(PW.c.y + 120) : at(0, 700);
            cam.lookAt(lookAtTarget);

            // Play procedural footstep tick
            if (Math.sin(this.walkBobT) > 0.95 && !this.justStepped) {
              this.justStepped = true;
              if (typeof S !== 'undefined' && S.thud) S.thud(120, 0.08, 0.25, 0);
            } else if (Math.sin(this.walkBobT) < 0.2) {
              this.justStepped = false;
            }

            if (p >= 1.0) {
              this.setStage('brace');
            }
            break;
          }

          case 'brace': {
            // Camera waits at the foot of the stairs looking at the portal
            if (PW) {
              cam.position.set(PW.c.x - 2200, PW.c.y + 60, PW.c.z);
              cam.lookAt(PW.c.x, PW.c.y + 120, PW.c.z);
            }
            break;
          }

          case 'push_suction': {
            // Rapid surge forward into the water vortex!
            const surgeDur = 2.4;
            const p = Math.min(1.0, t / surgeDur);
            const easeIn = p * p * p;

            if (PW) {
              const startX = PW.c.x - 2200;
              const targetX = PW.c.x + 80;
              const curX = startX * (1 - easeIn) + targetX * easeIn;

              cam.position.set(curX, PW.c.y + 50, PW.c.z);
              cam.lookAt(PW.c.x + 500, PW.c.y + 50, PW.c.z);
            }

            // Whiteout swells at the end of suction
            const whiteout = document.getElementById('kagemi-whiteout-overlay');
            if (whiteout && p > 0.6) {
              whiteout.style.opacity = ((p - 0.6) / 0.4).toFixed(2);
            }

            if (p >= 1.0) {
              this.setStage('tunnel');
            }
            break;
          }

          case 'tunnel': {
            // tunnelTick handles rendering; after 4.5s transition to arrival
            if (t >= 4.5) {
              this.setStage('arrival');
            }
            break;
          }
        }
      }

      complete() {
        this.active = false;
        this.stage = 'idle';

        // Hide sequence overlays
        const titleCard = document.getElementById('kagemi-cinematic-title');
        const braceModal = document.getElementById('kagemi-brace-modal');
        const skipBtn = document.getElementById('kagemi-seq-skip-btn');
        const whiteout = document.getElementById('kagemi-whiteout-overlay');

        if (titleCard) { titleCard.style.display = 'none'; titleCard.classList.remove('active'); }
        if (braceModal) { braceModal.classList.remove('active'); }
        if (skipBtn) { skipBtn.style.display = 'none'; }
        if (whiteout) { whiteout.style.opacity = '0'; }

        // Land the player cleanly in front of the sacred shrine on the island
        if (PW) {
          cam.position.copy(at(-2400, 700));
          cam.lookAt(at(0, 700));
          const g0 = groundAt(cam.position.x, cam.position.z, cam.position.y + 500);
          if (g0 !== null) cam.position.y = g0 + pl.eye;
          P0.copy(cam.position);
          pl.vel.set(0, 0, 0);
        } else {
          setMode('walk');
        }

        setMode('walk');
        playGenshinChime(true);
      }

      skip() {
        kagemiAudio.stopAllSfx();
        this.complete();
      }
    }

    const landingSequenceManager = new LandingSequenceManager();
    window.landingSequenceManager = landingSequenceManager;
    window.startLandingSequence = () => landingSequenceManager.start();
    window.skipLandingSequence = () => landingSequenceManager.skip();
`;

// Insert sequenceJS right before function bindGenshinEvents()
content = content.replace(
  'function bindGenshinEvents() {',
  sequenceJS + '\n\n    function bindGenshinEvents() {'
);

// Update frame(d) loop to handle mode === 'landing_sequence'
content = content.replace(
  "if (mode === 'seq') seqI();",
  "if (mode === 'landing_sequence') landingSequenceManager.update(d); else if (mode === 'seq') seqI();"
);

// Update ld.onclick to start landing sequence
content = content.replace(
  "setMode('walk');\n        requestLock();",
  "landingSequenceManager.start();"
);

// Update bindGenshinEvents to wire up new buttons
const eventBindings = `
      // Landing Sequence & BGM Event Listeners
      const btnLandingSeq = document.getElementById('btn-landing-seq');
      if (btnLandingSeq) {
        btnLandingSeq.onclick = () => {
          landingSequenceManager.start();
        };
      }

      const skipBtn = document.getElementById('kagemi-seq-skip-btn');
      if (skipBtn) {
        skipBtn.onclick = () => {
          landingSequenceManager.skip();
        };
      }

      const braceOk = document.getElementById('k-brace-ok-btn');
      if (braceOk) {
        const handleBrace = (e) => {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          landingSequenceManager.setStage('push_suction');
        };
        braceOk.onclick = handleBrace;
        braceOk.onpointerdown = (e) => { if (e) e.stopPropagation(); };
        braceOk.ontouchstart = handleBrace;
      }

      const titleCard = document.getElementById('kagemi-cinematic-title');
      if (titleCard) {
        titleCard.onclick = () => {
          if (landingSequenceManager.active && landingSequenceManager.stage === 'title') {
            landingSequenceManager.setStage('flyover');
          }
        };
      }

      const btnBgmToggle = document.getElementById('btn-bgm-toggle');
      if (btnBgmToggle) {
        btnBgmToggle.onclick = () => {
          kagemiAudio.toggleBgm();
        };
      }

      const btnBgmNext = document.getElementById('btn-bgm-next');
      if (btnBgmNext) {
        btnBgmNext.onclick = () => {
          kagemiAudio.nextBgm();
        };
      }
`;

content = content.replace(
  "const menuClose = document.getElementById('g-menu-close-btn');",
  eventBindings + "\n      const menuClose = document.getElementById('g-menu-close-btn');"
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully injected KagemiAudioManager and LandingSequenceManager into kagemi-island.html!');
