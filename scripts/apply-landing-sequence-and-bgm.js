const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'experiments', 'kagemi-island.html');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add CSS for Title Intro, Dimension Alert, BGM Toast, Skip Button & Whiteout
const sequenceCSS = `
    /* =========================================================================
       LANDING ANIMATION SEQUENCE & BGM STYLES
       ========================================================================= */
    #kagemi-whiteout-overlay {
      position: fixed;
      inset: 0;
      background: #ffffff;
      pointer-events: none;
      opacity: 0;
      z-index: 99998;
      transition: opacity 0.35s ease;
    }

    /* Cinematic Title Intro */
    #kagemi-cinematic-title {
      position: fixed;
      inset: 0;
      z-index: 99995;
      background: #020205;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      overflow: hidden;
      user-select: none;
      transition: opacity 0.8s ease;
    }
    #kagemi-cinematic-title.active {
      display: flex;
    }
    .k-title-glow-sphere {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: rgba(124, 58, 237, 0.15);
      filter: blur(140px);
      pointer-events: none;
    }
    .k-title-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 0 24px;
      max-width: 900px;
    }
    .k-title-h1 {
      font-size: clamp(48px, 9vw, 108px);
      font-weight: 800;
      letter-spacing: 0.38em;
      margin-left: 0.38em;
      text-transform: uppercase;
      background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 45%, #c084fc 80%, #7c3aed 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 0 32px rgba(124, 58, 237, 0.65));
      margin-bottom: 0;
      line-height: 1.1;
    }
    .k-title-laser-container {
      position: relative;
      width: 100%;
      max-width: 640px;
      height: 24px;
      margin: 12px 0 16px 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .k-title-laser-line {
      position: absolute;
      width: 100%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.6), transparent);
    }
    .k-title-laser-beam {
      position: absolute;
      width: 90px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #ffffff 50%, transparent);
      box-shadow: 0 0 16px #a855f7, 0 0 32px #7c3aed;
      border-radius: 999px;
      animation: kLaserSweep 3.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
    }
    @keyframes kLaserSweep {
      0% { transform: translateX(-320px); opacity: 0; }
      15% { opacity: 1; }
      85% { opacity: 1; }
      100% { transform: translateX(320px); opacity: 0; }
    }
    .k-title-sub {
      font-size: 13px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: rgba(226, 232, 240, 0.75);
      font-weight: 600;
      margin: 0;
    }
    .k-title-enter-hint {
      margin-top: 36px;
      font-size: 12px;
      letter-spacing: 0.18em;
      color: rgba(168, 85, 247, 0.9);
      background: rgba(124, 58, 237, 0.12);
      border: 1px solid rgba(168, 85, 247, 0.3);
      padding: 6px 18px;
      border-radius: 999px;
      text-transform: uppercase;
      font-weight: 600;
      animation: kHintPulse 2s ease-in-out infinite;
    }
    @keyframes kHintPulse {
      0%, 100% { opacity: 0.65; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.03); }
    }

    /* Floating Skip Sequence Button */
    #kagemi-seq-skip-btn {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      display: none;
      align-items: center;
      gap: 8px;
      background: rgba(10, 14, 26, 0.88);
      border: 1px solid rgba(168, 85, 247, 0.45);
      color: #f1f5f9;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 8px 18px;
      border-radius: 999px;
      cursor: pointer;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(124, 58, 237, 0.3);
      transition: all 0.2s ease;
    }
    #kagemi-seq-skip-btn:hover {
      background: #7c3aed;
      border-color: #a855f7;
      transform: scale(1.04);
      box-shadow: 0 8px 28px rgba(124, 58, 237, 0.6);
    }
    #kagemi-seq-skip-btn:active {
      transform: scale(0.96);
    }

    /* Dimension Alert (Brace Popup) from Main Landing Page */
    #kagemi-brace-modal {
      position: fixed;
      inset: 0;
      z-index: 99997;
      background: rgba(2, 4, 10, 0.78);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    #kagemi-brace-modal.active {
      display: flex;
    }
    .k-brace-card {
      position: relative;
      max-width: 460px;
      width: 100%;
      background: rgba(10, 14, 26, 0.95);
      border: 1px solid rgba(220, 38, 38, 0.55);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 36px rgba(220, 38, 38, 0.3);
      text-align: center;
      animation: kBraceSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes kBraceSlideUp {
      from { opacity: 0; transform: translateY(18px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .k-brace-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 14px;
      border-bottom: 1px solid rgba(220, 38, 38, 0.2);
      padding-bottom: 12px;
    }
    .k-brace-badge {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #f87171;
      background: rgba(220, 38, 38, 0.15);
      border: 1px solid rgba(220, 38, 38, 0.35);
      padding: 3px 12px;
      border-radius: 999px;
    }
    .k-brace-title {
      margin: 0;
      font-size: 17px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.04em;
    }
    .k-brace-msg {
      font-size: 13px;
      line-height: 1.6;
      color: #cbd5e1;
      text-align: left;
      margin: 0 0 20px 0;
      font-family: monospace, sans-serif;
    }
    .k-brace-btn {
      width: 100%;
      background: linear-gradient(135deg, #b91c1c, #991b1b);
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 12px 24px;
      border-radius: 12px;
      border: 1px solid rgba(248, 113, 113, 0.5);
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(185, 28, 28, 0.5);
      transition: all 0.18s ease;
    }
    .k-brace-btn:hover {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      transform: scale(1.02);
      box-shadow: 0 8px 26px rgba(220, 38, 38, 0.7);
    }
    .k-brace-btn:active {
      transform: scale(0.97);
    }

    /* BGM Now Playing Floating Toast */
    #kagemi-bgm-toast {
      position: fixed;
      bottom: 84px;
      left: 24px;
      z-index: 9990;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(10, 14, 26, 0.88);
      border: 1px solid rgba(168, 85, 247, 0.35);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      padding: 8px 16px;
      border-radius: 999px;
      color: #e2e8f0;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.03em;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #kagemi-bgm-toast.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .k-bgm-note {
      color: #a855f7;
      font-size: 14px;
      animation: kNoteBounce 1.5s ease-in-out infinite;
    }
    @keyframes kNoteBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
`;

// Insert CSS right before </style>
content = content.replace('</style>', sequenceCSS + '\n  </style>');

// 2. Add HTML markup for Whiteout, Title Intro, Brace Modal, Skip Button, BGM Toast, and toolbar buttons
const sequenceHTML = `
  <!-- Whiteout transition flash overlay -->
  <div id="kagemi-whiteout-overlay"></div>

  <!-- Full-screen Cinematic Title Card Overlay -->
  <div id="kagemi-cinematic-title" class="active">
    <div class="k-title-glow-sphere"></div>
    <div class="k-title-content">
      <h1 class="k-title-h1">KAGEMI</h1>
      <div class="k-title-laser-container">
        <div class="k-title-laser-line"></div>
        <div class="k-title-laser-beam"></div>
      </div>
      <p class="k-title-sub">Sanctuary of Shadows · Dimensional Gateway</p>
      <div class="k-title-enter-hint">▶ Click anywhere to begin landing sequence</div>
    </div>
  </div>

  <!-- Floating Skip to Island Button -->
  <button id="kagemi-seq-skip-btn" title="Skip cinematic sequence">
    <span>Skip to Walk</span>
    <span>⏭</span>
  </button>

  <!-- Dimension Alert (Brace Popup) -->
  <div id="kagemi-brace-modal">
    <div class="k-brace-card">
      <div class="k-brace-header">
        <span class="k-brace-badge">⚠ DIMENSION ALERT</span>
      </div>
      <h3 class="k-brace-title">TRAVERSE THE MANA GATEWAY</h3>
      <p class="k-brace-msg">
        We are not going beyond Kagemi, we are going beyond our reality and going to a place known as Otakuverse which has the guild Kagemi where we will operate everything. Brace yourself and push the door.
      </p>
      <button id="k-brace-ok-btn" class="k-brace-btn">OK, I'M READY</button>
    </div>
  </div>

  <!-- Floating BGM Now-Playing Toast -->
  <div id="kagemi-bgm-toast">
    <span class="k-bgm-note">♫</span>
    <span id="k-bgm-title">Now Playing: Hiisi Island Night</span>
  </div>
`;

// Insert sequence HTML right after <div id="c"></div>
content = content.replace('<div id="c"></div>', '<div id="c"></div>' + sequenceHTML);

// 3. Update #ui toolbar buttons to include Landing Sequence and BGM controls
const oldToolbar = '<div id="ui"><button id="fl">Flyover</button><button id="wk" class="on">Walk</button><button id="fo">Free\n      look</button><button id="fp">FPV</button><button id="al">Alignment line</button><button id="sn">Sound:\n      on</button><button id="hw" hidden>Hold to walk</button></div>';

const newToolbar = `<div id="ui">
    <button id="btn-landing-seq" title="Play Authentic Cinematic Landing Sequence">🎬 Landing Sequence</button>
    <button id="fl">Flyover</button>
    <button id="wk" class="on">Walk</button>
    <button id="fo">Free look</button>
    <button id="fp">FPV</button>
    <button id="al">Alignment line</button>
    <button id="btn-bgm-toggle" title="Toggle Background Music">♫ Music: On</button>
    <button id="btn-bgm-next" title="Next BGM Track">⏭</button>
    <button id="sn">SFX: On</button>
    <button id="hw" hidden>Hold to walk</button>
  </div>`;

if (content.includes(oldToolbar)) {
  content = content.replace(oldToolbar, newToolbar);
  console.log('Replaced toolbar successfully!');
} else {
  console.warn('Could not match exact oldToolbar, replacing via regex...');
  content = content.replace(/<div id="ui">[\s\S]*?<\/div>/, newToolbar.trim());
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Saved CSS and HTML to kagemi-island.html successfully!');
