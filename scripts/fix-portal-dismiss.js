const fs = require('fs');
const path = require('path');

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Fix pointerdown event listener so clicking modals or while toast is open doesn't grab pointer lock
  content = content.replace(
    /addEventListener\('pointerdown',\s*e\s*=>\s*\{\s*if\s*\(e\.target\s*&&\s*\(e\.target\.closest\('#ui'\)\s*\|\|\s*e\.target\.closest\('button'\)\)\)\s*return;/,
    `addEventListener('pointerdown', e => {
      if (isPortalToastOpen || isLandingMenuOpen || (e.target && (e.target.closest('#ui') || e.target.closest('button') || e.target.closest('#genshin-portal-msg-modal') || e.target.closest('#kagemi-landing-modal')))) return;`
  );

  // 2. Fix openPortalToast and closePortalToast
  const oldToastFuncs = `    function openPortalToast() {
      if (isPortalToastOpen || mode === 'tunnel') return;
      isPortalToastOpen = true;
      const modal = document.getElementById('genshin-portal-msg-modal');
      if (modal) modal.classList.add('active');
      playGenshinChime(true);
      if (document.exitPointerLock) document.exitPointerLock();
    }

    function closePortalToast() {
      if (!isPortalToastOpen) return;
      isPortalToastOpen = false;
      const modal = document.getElementById('genshin-portal-msg-modal');
      if (modal) modal.classList.remove('active');
      if (stepBack && PW) {
        // Step player back slightly along stairs corridor so popup doesn't immediately re-trigger
        P0.x = Math.min(P0.x, PW.c.x - 480);
        cam.position.copy(P0);
        pl.vel.set(0, 0, 0);
      }
    }`;

  const newToastFuncs = `    function openPortalToast() {
      if (portalToastDismissedInZone || !!window.__portalMsgDismissed) return;
      try {
        if (sessionStorage.getItem('kagemi_portal_msg_read') === '1' || localStorage.getItem('kagemi_portal_msg_read') === '1') {
          portalToastDismissedInZone = true;
          return;
        }
      } catch (e) {}
      if (isPortalToastOpen || mode === 'tunnel') return;
      isPortalToastOpen = true;
      const modal = document.getElementById('genshin-portal-msg-modal');
      if (modal) {
        modal.style.display = 'block';
        modal.classList.add('active');
      }
      playGenshinChime(true);
      if (document.exitPointerLock) document.exitPointerLock();
    }

    function closePortalToast(stepBack = false) {
      isPortalToastOpen = false;
      portalToastDismissedInZone = true;
      window.__portalMsgDismissed = true;
      try {
        sessionStorage.setItem('kagemi_portal_msg_read', '1');
        localStorage.setItem('kagemi_portal_msg_read', '1');
      } catch (e) {}

      const modal = document.getElementById('genshin-portal-msg-modal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
      if (stepBack && PW) {
        // Step player back slightly along stairs corridor so popup doesn't immediately re-trigger
        P0.x = Math.min(P0.x, PW.c.x - 480);
        cam.position.copy(P0);
        pl.vel.set(0, 0, 0);
      }
    }`;

  if (content.includes(oldToastFuncs)) {
    content = content.replace(oldToastFuncs, newToastFuncs);
    console.log(`[${path.basename(filePath)}] Replaced openPortalToast / closePortalToast successfully!`);
  } else {
    console.warn(`[${path.basename(filePath)}] Could not find exact oldToastFuncs, trying regex fallback...`);
    content = content.replace(
      /function\s+openPortalToast\(\)\s*\{[\s\S]*?function\s+closePortalToast\([^\)]*\)\s*\{[\s\S]*?\n\s*\}\s*\}/,
      newToastFuncs.trim()
    );
  }

  // 3. Fix trigger condition in updateGenshinHUD
  content = content.replace(
    /let isAlreadyRead = false;\s*try\s*\{\s*isAlreadyRead = \(sessionStorage\.getItem\('kagemi_portal_msg_read'\) === '1'\);\s*\}\s*catch\(e\)\s*\{\}\s*if\s*\(!isAlreadyRead && !portalToastDismissedInZone\)\s*\{/,
    `let isAlreadyRead = portalToastDismissedInZone || !!window.__portalMsgDismissed;
        try {
          if (sessionStorage.getItem('kagemi_portal_msg_read') === '1' || localStorage.getItem('kagemi_portal_msg_read') === '1') {
            isAlreadyRead = true;
            portalToastDismissedInZone = true;
          }
        } catch(e) {}

        if (!isAlreadyRead) {`
  );

  // 4. Fix event listeners in bindGenshinEvents
  const oldBindEvents = `    // Bind Genshin UI Events
    function bindGenshinEvents() {
      const menuClose = document.getElementById('g-menu-close-btn');
      if (menuClose) menuClose.onclick = () => closeKagemiMenu();

      const portalOk = document.getElementById('g-portal-toast-ok-btn');
      if (portalOk) portalOk.onclick = () => closePortalToast();

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (isLandingMenuOpen) closeKagemiMenu();
          if (isPortalToastOpen) closePortalToast();
        } else if (e.key === 'f' || e.key === 'F') {
          if (isNearTerminal && !isLandingMenuOpen && !isPortalToastOpen) {
            e.preventDefault();
            openKagemiMenu();
          }
        }
      });
    }`;

  const newBindEvents = `    // Bind Genshin UI Events
    function bindGenshinEvents() {
      const menuClose = document.getElementById('g-menu-close-btn');
      if (menuClose) menuClose.onclick = () => closeKagemiMenu();

      const portalOk = document.getElementById('g-portal-toast-ok-btn');
      if (portalOk) {
        const handleOk = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          }
          closePortalToast();
        };
        portalOk.onclick = handleOk;
        portalOk.onpointerdown = (e) => { if (e) e.stopPropagation(); };
        portalOk.ontouchstart = handleOk;
      }

      const portalModal = document.getElementById('genshin-portal-msg-modal');
      if (portalModal) {
        portalModal.addEventListener('click', (e) => {
          if (e.target === portalModal || e.target.id === 'g-portal-toast-ok-btn' || (e.target.closest && e.target.closest('#g-portal-toast-ok-btn'))) {
            closePortalToast();
          }
        });
      }

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || ((e.key === 'Enter' || e.key === ' ') && isPortalToastOpen)) {
          if (isPortalToastOpen) {
            e.preventDefault();
            e.stopPropagation();
            closePortalToast();
          } else if (isLandingMenuOpen) {
            closeKagemiMenu();
          }
        } else if (e.key === 'f' || e.key === 'F') {
          if (isNearTerminal && !isLandingMenuOpen && !isPortalToastOpen) {
            e.preventDefault();
            openKagemiMenu();
          }
        }
      });
    }`;

  if (content.includes(oldBindEvents)) {
    content = content.replace(oldBindEvents, newBindEvents);
    console.log(`[${path.basename(filePath)}] Replaced bindGenshinEvents successfully!`);
  } else {
    console.warn(`[${path.basename(filePath)}] Could not find exact oldBindEvents, trying regex fallback...`);
    content = content.replace(
      /\/\/ Bind Genshin UI Events\s*function\s+bindGenshinEvents\(\)\s*\{[\s\S]*?\}\s*\}\s*\}/,
      newBindEvents.trim() + '}'
    );
  }

  // Write updated file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[${path.basename(filePath)}] File updated and saved successfully!`);
}

updateFile(path.join(__dirname, '..', 'public', 'experiments', 'kagemi-island.html'));
updateFile(path.join(__dirname, '..', 'public', 'experiments', 'floating-island.html'));
