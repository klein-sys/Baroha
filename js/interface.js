/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * UI & HUD Interface Manager, Modals, Math Trials, and Mobile Touch Controls
 */

class InterfaceManager {
  constructor() {
    this.activeModal = null;
    this.currentTrialData = null;

    // Toast queue
    this.toastQueue = [];
    this.isToastShowing = false;

    // Cached DOM values to prevent unnecessary 60fps reflows
    this._uiCache = {
      hpStr: '', mpStr: '', xpStr: '', level: -1, rank: '', hearts: -1,
      hpPct: '', mpPct: '', xpPct: '',
      interactVisible: false, interactText: ''
    };
    this._projVec = new THREE.Vector3();

    // Cached DOM elements
    this.initDOMElements();

    // Mobile Virtual Joystick state
    this.joystickActive = false;
    this.joystickCenter = { x: 0, y: 0 };
    this.setupMobileControls();
    document.getElementById('puzzle-hint')?.addEventListener('click', () => window.game?.puzzleAction('hint'));
    document.getElementById('puzzle-reset')?.addEventListener('click', () => window.game?.puzzleAction('reset'));
    this.setupModalTabs();
  }

  initDOMElements() {
    // HUD Bars
    this.hpBar = document.getElementById('hud-hp-bar');
    this.hpNum = document.getElementById('hud-hp-num');
    this.mpBar = document.getElementById('hud-mp-bar');
    this.mpNum = document.getElementById('hud-mp-num');
    this.xpBar = document.getElementById('hud-xp-bar');
    this.xpNum = document.getElementById('hud-xp-num');

    // Roblox Top Bar RPG Elements
    this.robloxLevel = document.getElementById('roblox-level-display');
    this.robloxHpFill = document.getElementById('roblox-hp-fill');
    this.robloxHpNum = document.getElementById('roblox-hp-display');
    this.robloxMpFill = document.getElementById('roblox-mp-fill');
    this.robloxMpNum = document.getElementById('roblox-mp-display');
    this.robloxObjText = document.getElementById('roblox-obj-text');
    this.robloxObjCount = document.getElementById('roblox-obj-count');

    // Player Badge
    this.playerLevelBadge = document.getElementById('hud-player-level');
    this.playerTitle = document.getElementById('hud-player-title');
    this.playerClass = document.getElementById('hud-player-class');
    this.heartsRow = document.getElementById('hud-hearts-row');

    // Boss Bar
    this.bossContainer = document.getElementById('boss-banner');
    this.bossName = document.getElementById('hud-boss-name');
    this.bossPhase = document.getElementById('hud-boss-phase');
    this.bossHpBar = document.getElementById('hud-boss-hp-bar');
    this.bossLevelSub = document.getElementById('hud-boss-level-sub');

    // Quest Tracker HUD
    this.questTitle = document.getElementById('hud-quest-name');
    this.questDesc = document.getElementById('hud-quest-desc');
    this.questProgress = document.getElementById('hud-quest-progress');

    // Interact prompt
    this.interactPrompt = document.getElementById('interact-prompt');
    this.interactText = document.getElementById('interact-text');

    // Hitmarker
    this.hitmarker = document.getElementById('hitmarker');

    // Setup action buttons
    this.bindHUDButtons();
  }

  bindHUDButtons() {
    // Camera toggle
    const camBtn = document.getElementById('btn-cam-toggle');
    if (camBtn) {
      camBtn.onclick = () => {
        if (window.robloxCharacter) window.robloxCharacter.toggleCameraMode();
      };
    }

    // World map toggle
    const mapBtn = document.getElementById('btn-hud-map');
    if (mapBtn) {
      mapBtn.onclick = () => {
        if (window.worldMapManager) window.worldMapManager.toggleMap();
      };
    }

    const closeMapBtn = document.getElementById('btn-close-map');
    if (closeMapBtn) {
      closeMapBtn.onclick = () => {
        if (window.worldMapManager) window.worldMapManager.toggleMap();
      };
    }

    // Roblox pause menu button
    const robloxMenuBtn = document.getElementById('btn-roblox-menu');
    if (robloxMenuBtn) {
      robloxMenuBtn.onclick = () => {
        const anyOpen = document.querySelector('.modal-backdrop.open');
        if (anyOpen) {
          this.closeAllModals();
          this.resumePointerLockIfActive();
        } else {
          if (window.game) window.game.togglePause();
        }
      };
    }

    // Sleep Modal buttons
    const sleepMorningBtn = document.getElementById('btn-sleep-morning');
    if (sleepMorningBtn) {
      sleepMorningBtn.onclick = () => {
        if (window.dayNightManager && !window.dayNightManager.isSleeping) {
          window.dayNightManager.sleepUntilMorning();
        }
      };
    }

    const sleepCancelBtn = document.getElementById('btn-sleep-cancel');
    if (sleepCancelBtn) {
      sleepCancelBtn.onclick = () => {
        if (!window.dayNightManager?.isSleeping) this.hideSleepModal();
      };
    }

    const closeSleepBtn = document.getElementById('btn-close-sleep');
    if (closeSleepBtn) {
      closeSleepBtn.onclick = () => {
        if (!window.dayNightManager?.isSleeping) this.hideSleepModal();
      };
    }
  }

  updatePlayerStatsUI() {
    if (!window.game || !window.game.player) return;
    const p = window.game.player;
    const c = this._uiCache;

    // HP Bar (update DOM only on change)
    const hpRatio = Math.max(0, Math.min(1, p.hp / p.maxHp));
    const hpPct = `${(hpRatio * 100).toFixed(1)}%`;
    const hpStr = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    if (c.hpPct !== hpPct) {
      c.hpPct = hpPct;
      if (this.hpBar) this.hpBar.style.width = hpPct;
      if (this.robloxHpFill) this.robloxHpFill.style.width = hpPct;
    }
    if (c.hpStr !== hpStr) {
      c.hpStr = hpStr;
      if (this.hpNum) this.hpNum.innerText = `${Math.ceil(p.hp)}/${p.maxHp}`;
      if (this.robloxHpNum) this.robloxHpNum.innerText = hpStr;
    }

    // MP Bar
    const mpRatio = Math.max(0, Math.min(1, p.mana / p.maxMana));
    const mpPct = `${(mpRatio * 100).toFixed(1)}%`;
    const mpStr = `${Math.ceil(p.mana)} / ${p.maxMana}`;
    if (c.mpPct !== mpPct) {
      c.mpPct = mpPct;
      if (this.mpBar) this.mpBar.style.width = mpPct;
      if (this.robloxMpFill) this.robloxMpFill.style.width = mpPct;
    }
    if (c.mpStr !== mpStr) {
      c.mpStr = mpStr;
      if (this.mpNum) this.mpNum.innerText = `${Math.ceil(p.mana)}/${p.maxMana}`;
      if (this.robloxMpNum) this.robloxMpNum.innerText = mpStr;
    }

    // XP Bar
    const xpRatio = Math.max(0, Math.min(1, p.xp / p.xpNeeded));
    const xpPct = `${(xpRatio * 100).toFixed(1)}%`;
    const xpStr = `${p.xp}/${p.xpNeeded} XP`;
    if (c.xpPct !== xpPct) {
      c.xpPct = xpPct;
      if (this.xpBar) this.xpBar.style.width = xpPct;
    }
    if (c.xpStr !== xpStr) {
      c.xpStr = xpStr;
      if (this.xpNum) this.xpNum.innerText = xpStr;
    }

    // Level & Title
    if (c.level !== p.level) {
      c.level = p.level;
      if (this.playerLevelBadge) this.playerLevelBadge.innerText = p.level;
      if (this.robloxLevel) this.robloxLevel.innerText = `Lv. ${p.level}`;
    }
    if (c.rank !== p.rankTitle) {
      c.rank = p.rankTitle;
      if (this.playerClass) this.playerClass.innerText = p.rankTitle;
    }

    // Hearts UI
    if (c.hearts !== p.hearts) {
      c.hearts = p.hearts;
      this.updateHeartsUI(p.hearts);
    }
  }

  updateHeartsUI(heartsCount) {
    if (!this.heartsRow) return;
    const hearts = this.heartsRow.querySelectorAll('.heart-icon');
    hearts.forEach((h, idx) => {
      if (idx < heartsCount) {
        h.classList.remove('lost');
        h.classList.add('full');
      } else {
        h.classList.remove('full');
        h.classList.add('lost');
      }
    });
  }

  updateQuestHUD() {
    const world = window.game?.world;
    if (world?.floor) {
      const state = world.dungeonProgress[world.currentRealm];
      const active = window.game.enemies.isBossActive;
      const name = state.defeated ? 'Portal open' : active ? 'Boss encounter' : 'Reach the arena';
      const objective = state.defeated ? 'Use the portal at the back of the arena.'
        : active ? `Defeat ${world.floor.boss}.`
        : !state.rift ? 'Tune the Rift Seal near the grove or chamber entrance.'
        : !state.bridge ? 'Tune the bridge rune until both limits match.'
        : `Cross the gallery and enter ${world.floor.rooms[3]}.`;
      document.getElementById('hud-quest-name').textContent = name;
      document.getElementById('hud-quest-desc').textContent = objective;
      document.getElementById('hud-quest-progress').style.width = state.defeated ? '100%' : active ? '75%' : `${25 * (Number(Boolean(state.rift)) + Number(Boolean(state.bridge)))}%`;
      this.updateRobloxObjective(name, state.defeated ? '1 / 1' : '0 / 1');
      return;
    }

    if (!window.missionsManager) return;
    const quest = window.missionsManager.getCurrentActiveQuest();
    if (!quest) return;

    if (this.questTitle) this.questTitle.innerText = quest.name;
    if (this.questDesc) this.questDesc.innerText = quest.desc;

    if (this.questProgress) {
      if (quest.target) {
        const pct = Math.min(100, (quest.progress / quest.target) * 100);
        this.questProgress.style.width = `${pct}%`;
      } else {
        this.questProgress.style.width = quest.completed ? '100%' : '0%';
      }
    }
  }

  updateCrystalsUI(crystals) {
    const s1 = document.getElementById('crystal-slot-1');
    const s2 = document.getElementById('crystal-slot-2');
    const s3 = document.getElementById('crystal-slot-3');

    if (s1 && crystals.fragment1) s1.classList.add('found');
    if (s2 && crystals.fragment2) s2.classList.add('found');
    if (s3 && crystals.fragment3) s3.classList.add('found');
  }

  showBossBar(name, subtitle = 'Lv. 50', hpRatio = 1.0, theme = 'witch') {
    if (!this.bossContainer) return;
    this.bossContainer.className = `boss-banner-container active theme-${theme}`;
    if (this.bossName) this.bossName.innerText = name;
    if (this.bossLevelSub) this.bossLevelSub.innerText = subtitle;
    if (this.bossPhase) this.bossPhase.innerText = subtitle;
    if (this.bossHpBar) this.bossHpBar.style.width = `${hpRatio * 100}%`;

    // Apply color theme to ability dock
    const dock = document.getElementById('ability-dock');
    if (dock) {
      dock.className = `ability-dock theme-${theme}`;
    }
  }

  updateRobloxObjective(text, countStr) {
    if (this.robloxObjText) this.robloxObjText.innerText = text;
    if (this.robloxObjCount) this.robloxObjCount.innerText = countStr;
  }

  closeAllModals(exceptModalId = null) {
    if (window.dayNightManager?.isSleeping && exceptModalId !== 'sleep-dialog-modal') return;
    const modals = document.querySelectorAll('.modal-backdrop');
    modals.forEach(m => {
      if (!exceptModalId || m.id !== exceptModalId) {
        m.classList.remove('open');
      }
    });

    if (exceptModalId !== 'world-map-modal' && window.worldMapManager) {
      window.worldMapManager.isOpen = false;
    }
    if (exceptModalId !== 'dev-console-modal' && window.devConsoleManager) {
      window.devConsoleManager.isOpen = false;
    }

    this.activeModal = exceptModalId ? document.getElementById(exceptModalId) : null;
  }

  resumePointerLockIfActive() {
    window.game?.requestMouseLook();
  }

  showSleepModal() {
    if (window.dayNightManager?.isSleeping) return;
    const modal = document.getElementById('sleep-dialog-modal');
    if (!modal) return;
    this.closeAllModals('sleep-dialog-modal');
    if (document.exitPointerLock) document.exitPointerLock();

    // Ensure modal opens cleanly in pre-sleep confirmation state
    const countdownBox = document.getElementById('sleep-countdown-box');
    const actionBtns = document.getElementById('sleep-action-buttons');
    const closeBtn = document.getElementById('btn-close-sleep');
    const heading = document.getElementById('sleep-modal-heading');
    const visualIcon = document.getElementById('sleep-visual-icon');
    const progressFill = document.getElementById('sleep-progress-fill');
    if (countdownBox) countdownBox.style.display = 'none';
    if (actionBtns) actionBtns.style.display = 'flex';
    if (closeBtn) closeBtn.style.display = 'flex';
    if (heading) heading.innerText = 'REST UNTIL MORNING?';
    if (visualIcon) visualIcon.innerText = '🌙 ➔ ☀️';
    if (progressFill) progressFill.style.width = '0%';

    const timeInfo = document.getElementById('sleep-current-time');
    if (timeInfo && window.dayNightManager) {
      let hours = Math.floor(window.dayNightManager.timeOfDay);
      let minutes = Math.floor((window.dayNightManager.timeOfDay % 1) * 60);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      timeInfo.innerText = `Current Time: ${displayHours}:${formattedMinutes} ${ampm} (${window.dayNightManager.isNight ? '🌙 Perilous Night' : '☀️ Peaceful Day'})`;
    }

    modal.classList.add('open');
    this.activeModal = modal;
  }

  hideSleepModal() {
    if (window.dayNightManager?.isSleeping) return;
    const modal = document.getElementById('sleep-dialog-modal');
    if (modal) modal.classList.remove('open');
    this.activeModal = null;
    this.resumePointerLockIfActive();
  }

  updateBossHealth(hp, maxHp, hpRatio) {
    if (this.bossHpBar) {
      this.bossHpBar.style.width = `${Math.max(0, hpRatio * 100)}%`;
    }
  }

  updateBossPhase(phaseText) {
    if (this.bossPhase) this.bossPhase.innerText = phaseText;
    if (this.bossLevelSub) this.bossLevelSub.innerText = phaseText;
  }

  showBossAttack(name, phase) {
    const readout = document.getElementById('boss-attack-readout');
    if (!readout) return;
    readout.hidden = !name;
    readout.textContent = name ? name + ' · ' + phase : '';
    readout.dataset.phase = phase || '';
  }

  hideBossBar() {
    this.showBossAttack();
    if (this.bossContainer) {
      this.bossContainer.classList.remove('active');
    }
  }

  showHitmarker() {
    if (this.hitmarker) {
      this.hitmarker.classList.add('active');
      setTimeout(() => this.hitmarker.classList.remove('active'), 120);
    }
  }

  showFloatingText(text, pos, type = 'damage') {
    const container = document.getElementById('floating-text-container');
    if (!container || !window.game || !window.game.camera) return;

    // Cap floating combat numbers to prevent DOM buildup
    while (container.children.length >= 12) {
      container.firstElementChild.remove();
    }

    // Project 3D position using reusable scratch vector
    this._projVec.copy(pos).project(window.game.camera);
    if (this._projVec.z > 1) return; // behind camera

    const x = (this._projVec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(this._projVec.y * 0.5) + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = `floating-text ${type}`;
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    container.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1100);
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    if (!this.activeToastMap) this.activeToastMap = new Map();

    // De-duplicate: If identical message already visible, refresh timer instead of stacking
    const msgKey = message.trim();
    if (this.activeToastMap.has(msgKey)) {
      const existing = this.activeToastMap.get(msgKey);
      clearTimeout(existing.timer);
      existing.timer = setTimeout(() => {
        if (existing.el.parentNode) existing.el.parentNode.removeChild(existing.el);
        this.activeToastMap.delete(msgKey);
      }, 4000);
      return;
    }

    // Enforce max 3 visible toasts: remove oldest if at capacity
    while (container.children.length >= 3) {
      const oldest = container.firstElementChild;
      if (oldest) {
        for (const [key, val] of this.activeToastMap.entries()) {
          if (val.el === oldest) {
            clearTimeout(val.timer);
            this.activeToastMap.delete(key);
            break;
          }
        }
        oldest.remove();
      }
    }

    const toast = document.createElement('div');
    toast.className = `toast-msg toast-${type}`;
    toast.innerText = message;
    container.appendChild(toast);

    const timer = setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
      this.activeToastMap.delete(msgKey);
    }, 4000);

    this.activeToastMap.set(msgKey, { el: toast, timer });
  }

  showInteractPrompt(text) {
    if (!this.interactPrompt || !this.interactText) return;
    if (this._uiCache.interactText !== text) {
      this._uiCache.interactText = text;
      this.interactText.innerText = text;
    }
    if (!this._uiCache.interactVisible) {
      this._uiCache.interactVisible = true;
      this.interactPrompt.classList.add('active');
    }
  }

  hideInteractPrompt() {
    if (!this.interactPrompt) return;
    if (this._uiCache.interactVisible) {
      this._uiCache.interactVisible = false;
      this.interactPrompt.classList.remove('active');
    }
  }

  // =========================================================================
  // ABILITIES DOCK RENDERING
  // =========================================================================
  renderAbilityDock() {
    const dock = document.getElementById('ability-dock');
    if (!dock || !window.abilitiesManager) return;

    dock.innerHTML = '';
    this._cooldownCache = {};
    window.abilitiesManager.abilities.forEach((ability, idx) => {
      const slot = document.createElement('div');
      slot.className = `ability-slot ${ability.unlocked ? '' : 'locked'} ${idx === window.abilitiesManager.selectedAbilityIndex ? 'active' : ''}`;
      slot.innerHTML = `
        <span class="ability-key">${ability.key}</span>
        <span class="ability-icon">${ability.icon}</span>
        <span class="ability-mana-cost">${ability.manaCost}MP</span>
        <div class="ability-cooldown-overlay" id="cd-${ability.id}"></div>
      `;
      slot.onclick = () => window.abilitiesManager.selectAbility(idx);
      dock.appendChild(slot);
    });
  }

  updateSelectedAbility(index) {
    const slots = document.querySelectorAll('.ability-slot');
    slots.forEach((s, idx) => {
      if (idx === index) s.classList.add('active');
      else s.classList.remove('active');
    });
  }

  updateAbilityCooldowns() {
    if (!window.abilitiesManager) return;
    if (!this._cooldownCache) this._cooldownCache = {};
    window.abilitiesManager.abilities.forEach(ability => {
      const pctStr = ability.timer > 0 ? `${Math.round((ability.timer / ability.cooldown) * 100)}%` : '0%';
      if (this._cooldownCache[ability.id] === pctStr) return;
      this._cooldownCache[ability.id] = pctStr;
      const overlay = document.getElementById(`cd-${ability.id}`);
      if (overlay) overlay.style.height = pctStr;
    });
  }

  // =========================================================================
  // CALCULUS TELEMETRY HUD & NOTIFICATIONS
  // (Question/quiz modals removed per MATH 101 Project Rules)
  // =========================================================================
  showCalculusInsight(title, message) {
    this.showToast(`📐 ${title}: ${message}`, 'info');
  }

  renderCalculusTelemetry(data, target) {
    const tools = document.getElementById('puzzle-tools');
    if (tools) tools.hidden = !target?.hint;
    const hud = document.getElementById('calculus-live-hud');
    if (!hud) return;
    if (!data) {
      this.hideCalculusTelemetry();
      return;
    }
    const cacheKey = data.html || `${data.title}|${data.func}|${data.details}|${data.metrics ? data.metrics.map(m => m.val).join(',') : ''}`;
    if (this._lastTelemetryKey === cacheKey && hud.style.display === 'block') return;
    this._lastTelemetryKey = cacheKey;

    hud.style.display = 'block';
    const titleEl = document.getElementById('calc-hud-title');
    const bodyEl = document.getElementById('calc-hud-body');
    if (titleEl) titleEl.innerText = data.title || 'ACTIVE HARMONIC FLUX';
    if (bodyEl) {
      if (typeof data.html === 'string') {
        bodyEl.innerHTML = data.html;
      } else {
        bodyEl.innerHTML = `
          <div style="font-family: var(--font-mono); font-size: 13px; color: ${data.isWarning ? '#ff4b4b' : '#ffd166'}; margin-bottom: 4px;">${data.func || ''}</div>
          <div style="font-size: 12px; color: #e0e0e0; margin-bottom: 6px;">${data.details || ''}</div>
          ${data.metrics ? `
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top: 4px;">
              ${data.metrics.map(m => `<span class="calc-pill-metric"><strong>${m.label}:</strong> ${m.val}</span>`).join('')}
            </div>
          ` : ''}
        `;
      }
    }
  }

  hideCalculusTelemetry() {
    const hud = document.getElementById('calculus-live-hud');
    if (hud && hud.style.display !== 'none') {
      hud.style.display = 'none';
      this._lastTelemetryKey = '';
    }
  }

  // =========================================================================
  // NPC DIALOGUE MODAL
  // =========================================================================
  showNpcDialogue(name, role) {
    const modal = document.getElementById('npc-dialog-modal');
    if (!modal) return;
    this.closeAllModals('npc-dialog-modal');
    if (document.exitPointerLock) document.exitPointerLock();

    document.getElementById('npc-name').innerText = name;
    document.getElementById('npc-role').innerText = role;

    const speechText = document.getElementById('npc-speech');
    const choices = document.getElementById('npc-choices');
    choices.innerHTML = '';

    if (name.includes('Guardian')) {
      const game = window.game;
      const state = game.world.dungeonProgress[1];
      speechText.innerText = state.defeated
        ? 'The forest can breathe again. Take the open portal and look for the names Vorthak buried.'
        : state.rift
          ? 'You held the seal steady. Now listen to both sides of the bridge. They must agree before you cross.'
          : game.player.hearts < game.player.maxHearts
            ? 'Sit a moment. The sanctuary is safe. The practice dial can help you see what the seal is doing.'
            : 'I’m Aster. Numeria cracked where its wards should have joined. Morgathia guards the first fracture. Try my practice seal beside us, then follow the lanterns to the grove.';
      const option = (label, action) => {
        const button = document.createElement('button');
        button.className = 'dialogue-choice-btn';
        button.textContent = label;
        button.onclick = action;
        choices.appendChild(button);
      };
      option('What should I watch on the dial?', () => {
        speechText.innerText = 'Watch the output from either side of the gap. It approaches six even though the expression is undefined at three. Try the blue crystal by my side before you head north.';
      });
      option('What happened to the wards?', () => {
        speechText.innerText = 'Four guardians once kept their wards in balance. Read the records you find near each refuge. They tell us what each guardian tried to protect.';
      });
      option('I’ll head to the grove.', () => {
        this.closeAllModals();
        this.resumePointerLockIfActive();
      });
    } else if (name.includes('Scholar')) {
      speechText.innerText = 'Beware traveler! Lich King Vorthak draws power from trigonometric derivatives. Remember the golden laws: d/dx[sin(x)] = cos(x), d/dx[cos(x)] = -sin(x), and d/dx[tan(x)] = sec²(x)!';
      const b1 = document.createElement('button');
      b1.className = 'dialogue-choice-btn';
      b1.innerText = '▶ "Thank you for the guidance, Scholar."';
      b1.onclick = () => {
        modal.classList.remove('open');
        this.activeModal = null;
        this.resumePointerLockIfActive();
      };
      choices.appendChild(b1);
    } else {
      speechText.innerText = 'You stand on the precipice of infinity. Azrael embodies the final trial. Integrate all knowledge of limits, continuity, and instantaneous rates of change to claim victory!';
      const b1 = document.createElement('button');
      b1.className = 'dialogue-choice-btn';
      b1.innerText = '▶ "I shall seal the Forbidden Equation!"';
      b1.onclick = () => {
        modal.classList.remove('open');
        this.activeModal = null;
        this.resumePointerLockIfActive();
      };
      choices.appendChild(b1);
    }

    modal.classList.add('open');
    this.activeModal = modal;
  }

  // =========================================================================
  // QUEST JOURNAL MODAL
  // =========================================================================
  toggleQuestJournal() {
    const modal = document.getElementById('quest-journal-modal');
    if (!modal) return;
    const wasOpen = modal.classList.contains('open');
    this.closeAllModals();

    if (!wasOpen) {
      if (document.exitPointerLock) document.exitPointerLock();
      this.renderQuestJournal();
      modal.classList.add('open');
      this.activeModal = modal;
    } else {
      this.resumePointerLockIfActive();
    }
  }

  renderQuestJournal() {
    const body = document.getElementById('quest-journal-body');
    if (!body || !window.missionsManager) return;
    body.innerHTML = '';

    const world = window.game?.world;
    const state = world?.dungeonProgress[world.currentRealm];
    const list = world?.floor ? [
      { name: 'Stabilize the Rift Seal', desc: 'Approach the boundary from either side without landing on the gap.', completed: state.rift },
      { name: 'Cross the continuity bridge', desc: 'Tune k until the left and right limits agree.', completed: state.bridge },
      { name: world.floor.rooms[4], desc: 'Use the harmonic lift to reach the optional side chamber.' },
      { name: `Defeat ${world.floor.boss}`, desc: 'Enter the arena to unlock its descent portal.', completed: state.defeated }
    ] : [];
    list.forEach(q => {
      const card = document.createElement('div');
      card.className = `quest-item-card ${q.completed ? 'completed' : ''}`;
      card.innerHTML = `
        <div class="quest-card-header">
          <span class="quest-card-name">${q.name}</span>
          <span class="quest-card-status ${q.completed ? 'done' : 'active'}">${q.completed ? 'COMPLETED' : 'IN PROGRESS'}</span>
        </div>
        <p style="font-size: 13px; color: #c2b59b;">${q.desc}</p>
      `;
      body.appendChild(card);
    });
    if (state?.discovered) {
      const record = document.createElement('p');
      record.className = 'quest-item-card';
      record.textContent = world.floorLore;
      body.appendChild(record);
    }
    const patterns = Object.entries(state?.patterns || {});
    if (patterns.length) {
      const heading = document.createElement('h3');
      heading.textContent = 'Attack patterns witnessed';
      body.appendChild(heading);
    }
    for (const [name, pattern] of patterns) {
      const card = document.createElement('article');
      card.className = 'quest-item-card pattern-card';
      const figure = document.createElement('span');
      figure.className = 'attack-diagram';
      figure.dataset.kind = ['ring', 'lane', 'circle'].includes(pattern.kind) ? pattern.kind : 'circle';
      figure.setAttribute('aria-label', figure.dataset.kind + ' danger zone');
      const text = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = name;
      const tip = document.createElement('p');
      tip.textContent = pattern.tip;
      text.append(title, tip);
      card.append(figure, text);
      body.appendChild(card);
    }
  }

  // =========================================================================
  // INVENTORY MODAL
  // =========================================================================
  toggleInventory() {
    const modal = document.getElementById('inventory-modal');
    if (!modal) return;
    const wasOpen = modal.classList.contains('open');
    this.closeAllModals();

    if (!wasOpen) {
      if (document.exitPointerLock) document.exitPointerLock();
      this.renderInventorySlots();
      modal.classList.add('open');
      this.activeModal = modal;
    } else {
      this.resumePointerLockIfActive();
    }
  }

  renderInventorySlots() {
    const grid = document.getElementById('inventory-grid');
    if (!grid || !window.inventoryManager) return;
    grid.innerHTML = '';

    window.inventoryManager.items.forEach(item => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.innerHTML = `
        <span class="slot-icon">${item.icon}</span>
        <span class="slot-qty">${item.qty}</span>
      `;
      slot.onclick = () => {
        document.getElementById('inventory-item-title').innerText = item.name;
        document.getElementById('inventory-item-desc').innerText = item.desc;
        if (item.type === 'consumable' && window.game) {
          window.inventoryManager.useItem(item.id, window.game.player);
        }
      };
      grid.appendChild(slot);
    });
  }

  // =========================================================================
  // CHARACTER STATUS MODAL
  // =========================================================================
  toggleCharacterStatus() {
    const modal = document.getElementById('character-modal');
    if (!modal) return;
    const wasOpen = modal.classList.contains('open');
    this.closeAllModals();

    if (!wasOpen) {
      if (document.exitPointerLock) document.exitPointerLock();
      if (window.game && window.game.player) {
        const p = window.game.player;
        document.getElementById('char-level').innerText = p.level;
        document.getElementById('char-rank').innerText = p.rankTitle;
        document.getElementById('char-hp').innerText = `${p.hp}/${p.maxHp}`;
        document.getElementById('char-mana').innerText = `${p.mana}/${p.maxMana}`;
        document.getElementById('char-hearts').innerText = `${p.hearts}/5`;
        document.getElementById('char-power').innerText = p.attackPower;
        document.getElementById('char-accuracy').innerText = `${window.calculusManager ? window.calculusManager.getAccuracy() : 100}%`;
      }
      modal.classList.add('open');
      this.activeModal = modal;
    } else {
      this.resumePointerLockIfActive();
    }
  }

  // =========================================================================
  // CALCULUS CODEX MODAL (BSU Semestral Project Reference & Worked Examples)
  // =========================================================================
  toggleCalculusCodex() {
    const modal = document.getElementById('codex-modal');
    if (!modal) return;
    const wasOpen = modal.classList.contains('open');
    this.closeAllModals();

    if (!wasOpen) {
      if (document.exitPointerLock) document.exitPointerLock();
      this.renderCodexWorkedExamples();
      modal.classList.add('open');
      this.activeModal = modal;
    } else {
      this.resumePointerLockIfActive();
    }
  }

  renderCodexWorkedExamples() {
    const container = document.getElementById('codex-examples-container');
    if (!container || !window.calculusManager) return;
    container.innerHTML = '';

    // Live Telemetry Card
    const telem = window.calculusManager.getActiveCalculusTelemetry();
    if (telem) {
      const liveCard = document.createElement('div');
      liveCard.style.cssText = 'background: rgba(10, 25, 45, 0.9); border: 2px solid #00d4ff; border-radius: 8px; padding: 16px; margin-bottom: 20px; box-shadow: 0 0 15px rgba(0,212,255,0.3);';
      liveCard.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(0,212,255,0.3); padding-bottom: 8px; margin-bottom: 12px;">
          <h3 style="font-family: var(--font-title); color: #00d4ff; margin: 0; font-size: 16px;">⚡ LIVE WORLD CALCULUS TELEMETRY</h3>
          <span style="font-size: 11px; background: #00d4ff; color: #060913; font-weight: bold; padding: 2px 8px; border-radius: 10px;">ACTIVE SYSTEM</span>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; font-size: 13px;">
          <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 6px;">
            <strong style="color: #ffd166;">Celestial Flux:</strong><br>
            L(t) = sin(ωt) = <span style="color:#00d4ff;">${telem.dayNight.L.toFixed(3)}</span><br>
            dL/dt = ω·cos(ωt) = <span style="color:${telem.dayNight.dLdt >= 0 ? '#38ef7d' : '#ff4b4b'};">${telem.dayNight.dLdt.toFixed(3)}</span><br>
            <span style="font-size: 11px; color:#aaa;">${telem.dayNight.isNight ? 'Night Active (Dusk peak passed)' : 'Daylight Active'}</span>
          </div>
          <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 6px;">
            <strong style="color: #ffd166;">Harmonic Platform:</strong><br>
            y(t) = 3.5·sin(1.2t) = <span style="color:#00d4ff;">${telem.platform.y.toFixed(2)} m</span><br>
            v(t) = y'(t) = <span style="color:#38ef7d;">${telem.platform.v.toFixed(2)} m/s</span><br>
            a(t) = y''(t) = <span style="color:#ff99aa;">${telem.platform.a.toFixed(2)} m/s²</span><br>
            <span style="font-size: 11px; color:${telem.platform.isAtPeak ? '#38ef7d' : '#ffd166'};">${telem.platform.statusText}</span>
          </div>
          <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 6px;">
            <strong style="color: #ffd166;">Rift Seal Limit:</strong><br>
            f(x) = (x² - 9)/(x - 3)<br>
            Hole at x = 3 (0/0 Indeterminate)<br>
            lim (x→3) f(x) = <span style="color:#38ef7d;">6.00</span><br>
            <span style="font-size: 11px; color:#aaa;">Left: 2.99→5.99 | Right: 3.01→6.01</span>
          </div>
          <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 6px;">
            <strong style="color: #ffd166;">Piecewise Bridge:</strong><br>
            f(x) = { kx+3 (x≤2), x²+1 (x>2) }<br>
            Continuous at k = <span style="color:#38ef7d;">1.00</span><br>
            Jump = |Left - Right| = 0.00<br>
            <span style="font-size: 11px; color:#aaa;">Solidifies chasm crossing</span>
          </div>
        </div>
      `;
      container.appendChild(liveCard);
    }

    window.calculusManager.workedExamples.forEach(ex => {
      const card = document.createElement('div');
      card.style.cssText = 'background: rgba(20, 16, 28, 0.85); border: 1px solid #e5b95c; border-radius: 6px; padding: 16px; margin-bottom: 16px;';
      card.innerHTML = `
        <h3 style="font-family: var(--font-title); color: #ffd978; margin-bottom: 6px;">${ex.title}</h3>
        <p style="font-size: 13px; color: #ff99aa; margin-bottom: 8px;"><strong>Core Concept:</strong> ${ex.concept}</p>
        <p style="font-size: 14px; margin-bottom: 10px;">${ex.problemStatement}</p>
        <div style="background: #0d0a14; border-left: 3px solid #00d4ff; padding: 10px; margin-bottom: 10px; font-family: var(--font-mono); font-size: 13px; white-space: pre-line;">
          ${ex.mathematicalSolution.join('\n\n')}
        </div>
        <p style="font-size: 13px; color: #38ef7d;"><strong>Gameplay Outcome:</strong> ${ex.gameplayEffect}</p>
      `;
      container.appendChild(card);
    });
  }

  // =========================================================================
  // TAB SWITCHING & CONTROL / SETTINGS MODALS
  // =========================================================================
  setupModalTabs() {
    document.querySelectorAll('.tabs-header .tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetTab = btn.dataset.tab;
        const parentModal = btn.closest('.fantasy-panel') || btn.closest('.modal-backdrop');
        if (!parentModal || !targetTab) return;

        parentModal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        parentModal.querySelectorAll('.tab-content').forEach(c => {
          if (c.id === targetTab) c.classList.add('active');
          else c.classList.remove('active');
        });
      });
    });

    // Close modal when clicking backdrop outside the fantasy-panel
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          if (window.dayNightManager?.isSleeping) return;
          this.closeAllModals();
          this.resumePointerLockIfActive();
        }
      });
    });
  }

  toggleControlsModal() {
    const modal = document.getElementById('controls-modal');
    if (!modal) return;
    const wasOpen = modal.classList.contains('open');
    this.closeAllModals();

    if (!wasOpen) {
      if (document.exitPointerLock) document.exitPointerLock();
      modal.classList.add('open');
      this.activeModal = modal;
    } else {
      this.resumePointerLockIfActive();
    }
  }

  toggleSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    const wasOpen = modal.classList.contains('open');
    this.closeAllModals();

    if (!wasOpen) {
      if (document.exitPointerLock) document.exitPointerLock();
      if (window.settingsManager) {
        window.settingsManager.populateSettingsUI();
      }
      modal.classList.add('open');
      this.activeModal = modal;
    } else {
      this.resumePointerLockIfActive();
    }
  }

  // =========================================================================
  // MOBILE TOUCH CONTROLS
  // =========================================================================
  setupMobileControls() {
    const joystickZone = document.getElementById('joystick-zone');
    const joystickThumb = document.getElementById('joystick-thumb');

    if (!joystickZone || !joystickThumb) return;

    // Detect touch support
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch) {
      const mobileControls = document.getElementById('mobile-controls');
      if (mobileControls) mobileControls.classList.add('active');
    }

    let joystickPointer = null;
    const resetJoystick = (event) => {
      if (event.pointerId !== joystickPointer) return;
      joystickPointer = null;
      joystickThumb.style.transform = 'translate(-50%, -50%)';
      if (window.game && window.game.player) {
        window.game.player.touchMoveVector.x = 0;
        window.game.player.touchMoveVector.y = 0;
      }
    };

    joystickZone.addEventListener('pointerdown', (e) => {
      if (joystickPointer !== null || !window.game?.canPlay()) return;
      joystickPointer = e.pointerId;
      joystickZone.setPointerCapture(joystickPointer);
      const rect = joystickZone.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }, { passive: false });

    joystickZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== joystickPointer) return;
      const dx = e.clientX - this.joystickCenter.x;
      const dy = e.clientY - this.joystickCenter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxRadius = 45;

      const normX = dx / (dist || 1);
      const normY = dy / (dist || 1);
      const clampedDist = Math.min(dist, maxRadius);

      joystickThumb.style.transform = `translate(calc(-50% + ${normX * clampedDist}px), calc(-50% + ${normY * clampedDist}px))`;

      if (window.game && window.game.player) {
        window.game.player.touchMoveVector.x = (normX * clampedDist) / maxRadius;
        window.game.player.touchMoveVector.y = (normY * clampedDist) / maxRadius;
      }
    }, { passive: false });

    joystickZone.addEventListener('lostpointercapture', resetJoystick);

    // Mobile Action buttons
    const bindBtn = (id, action) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('pointerdown', event => {
          if (event.pointerType === 'touch' && window.game?.canPlay()) action();
        });
        btn.addEventListener('click', event => {
          if (event.pointerType !== 'touch' && window.game?.canPlay()) action();
        });
      }
    };

    bindBtn('btn-touch-attack', () => {
      if (window.game && window.game.player) window.game.player.performAttack();
    });
    bindBtn('btn-touch-jump', () => {
      if (window.game && window.game.player) window.game.player.keys.jump = true;
      setTimeout(() => { if (window.game && window.game.player) window.game.player.keys.jump = false; }, 200);
    });
    bindBtn('btn-touch-cast', () => {
      if (window.game) window.game.castEquippedAbility();
    });
    bindBtn('btn-touch-interact', () => {
      if (window.game) window.game.handleInteract();
    });
    bindBtn('btn-touch-potion', () => {
      if (window.inventoryManager && window.game) {
        window.inventoryManager.useItem('potion', window.game.player);
      }
    });

  }
}

window.interfaceManager = new InterfaceManager();

