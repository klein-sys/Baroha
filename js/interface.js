/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * UI & HUD Interface Manager, Modals, Math Trials, and Mobile Touch Controls
 */

class InterfaceManager {
  constructor() {
    this.activeModal = null;
    this.currentTrialData = null;
    this.trialTimerInterval = null;

    // Toast queue
    this.toastQueue = [];
    this.isToastShowing = false;

    // Cached DOM elements
    this.initDOMElements();

    // Mobile Virtual Joystick state
    this.joystickActive = false;
    this.joystickCenter = { x: 0, y: 0 };
    this.setupMobileControls();
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
        if (window.game) window.game.togglePause();
      };
    }

    // Sleep Modal buttons
    const sleepMorningBtn = document.getElementById('btn-sleep-morning');
    if (sleepMorningBtn) {
      sleepMorningBtn.onclick = () => {
        this.hideSleepModal();
        if (window.dayNightManager) {
          window.dayNightManager.sleepUntilMorning();
        }
      };
    }

    const sleepCancelBtn = document.getElementById('btn-sleep-cancel');
    if (sleepCancelBtn) {
      sleepCancelBtn.onclick = () => this.hideSleepModal();
    }

    const closeSleepBtn = document.getElementById('btn-close-sleep');
    if (closeSleepBtn) {
      closeSleepBtn.onclick = () => this.hideSleepModal();
    }
  }

  updatePlayerStatsUI() {
    if (!window.game || !window.game.player) return;
    const p = window.game.player;

    // HP Bar
    const hpRatio = Math.max(0, Math.min(1, p.hp / p.maxHp));
    if (this.hpBar) this.hpBar.style.width = `${hpRatio * 100}%`;
    if (this.hpNum) this.hpNum.innerText = `${Math.ceil(p.hp)}/${p.maxHp}`;
    if (this.robloxHpFill) this.robloxHpFill.style.width = `${hpRatio * 100}%`;
    if (this.robloxHpNum) this.robloxHpNum.innerText = `${Math.ceil(p.hp)} / ${p.maxHp}`;

    // MP Bar
    const mpRatio = Math.max(0, Math.min(1, p.mana / p.maxMana));
    if (this.mpBar) this.mpBar.style.width = `${mpRatio * 100}%`;
    if (this.mpNum) this.mpNum.innerText = `${Math.ceil(p.mana)}/${p.maxMana}`;
    if (this.robloxMpFill) this.robloxMpFill.style.width = `${mpRatio * 100}%`;
    if (this.robloxMpNum) this.robloxMpNum.innerText = `${Math.ceil(p.mana)} / ${p.maxMana}`;

    // XP Bar
    const xpRatio = Math.max(0, Math.min(1, p.xp / p.xpNeeded));
    if (this.xpBar) this.xpBar.style.width = `${xpRatio * 100}%`;
    if (this.xpNum) this.xpNum.innerText = `${p.xp}/${p.xpNeeded} XP`;

    // Level & Title
    if (this.playerLevelBadge) this.playerLevelBadge.innerText = p.level;
    if (this.robloxLevel) {
      const displayLv = p.level === 1 ? 25 : (p.level === 2 ? 50 : 100);
      this.robloxLevel.innerText = `Lv. ${displayLv}`;
    }
    if (this.playerClass) this.playerClass.innerText = p.rankTitle;

    // Hearts UI
    this.updateHeartsUI(p.hearts);
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

  showSleepModal() {
    const modal = document.getElementById('sleep-dialog-modal');
    if (!modal) return;
    if (document.exitPointerLock) document.exitPointerLock();

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
    const modal = document.getElementById('sleep-dialog-modal');
    if (modal) modal.classList.remove('open');
    this.activeModal = null;
    if (window.game && window.game.isRunning && !window.game.isPaused) {
      const canvas = document.getElementById('game-canvas');
      if (canvas) canvas.requestPointerLock();
    }
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

  hideBossBar() {
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

    // Project 3D position to 2D screen coordinates
    const v = pos.clone();
    v.project(window.game.camera);

    const x = (v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(v.y * 0.5) + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = `floating-text ${type}`;
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    container.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1200);
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3200);
  }

  showInteractPrompt(text) {
    if (this.interactPrompt && this.interactText) {
      this.interactText.innerText = text;
      this.interactPrompt.classList.add('active');
    }
  }

  hideInteractPrompt() {
    if (this.interactPrompt) {
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
    window.abilitiesManager.abilities.forEach(ability => {
      const overlay = document.getElementById(`cd-${ability.id}`);
      if (overlay) {
        if (ability.timer > 0) {
          const pct = (ability.timer / ability.cooldown) * 100;
          overlay.style.height = `${pct}%`;
        } else {
          overlay.style.height = '0%';
        }
      }
    });
  }

  // =========================================================================
  // MATHEMATICS QUESTION TRIAL MODAL
  // =========================================================================
  openMathTrial(question, isBoss = true, onCompleteCallback) {
    this.currentTrialData = question;
    const modal = document.getElementById('math-trial-modal');
    if (!modal) return;

    // Release pointer lock so player can click answers
    if (document.exitPointerLock) document.exitPointerLock();

    // Populate question details
    document.getElementById('math-trial-topic').innerText = question.topic;
    document.getElementById('math-trial-lore').innerText = question.lore;
    document.getElementById('math-trial-equation').innerText = question.displayEquation;

    const optionsGrid = document.getElementById('math-options-grid');
    const inputContainer = document.getElementById('math-input-container');
    const explanationBox = document.getElementById('math-explanation-box');

    explanationBox.classList.remove('active');

    if (question.type === 'mcq') {
      optionsGrid.style.display = 'grid';
      inputContainer.classList.remove('active');
      optionsGrid.innerHTML = '';

      question.options.forEach((opt, idx) => {
        const letters = ['A', 'B', 'C', 'D'];
        const card = document.createElement('div');
        card.className = 'math-option-card';
        card.innerHTML = `
          <div class="option-badge">${letters[idx]}</div>
          <div class="option-text">${opt.text}</div>
        `;
        card.onclick = () => this.handleTrialAnswer(opt.isCorrect, question, onCompleteCallback);
        optionsGrid.appendChild(card);
      });
    } else {
      // Numeric input
      optionsGrid.style.display = 'none';
      inputContainer.classList.add('active');
      const numInput = document.getElementById('math-numeric-input');
      numInput.value = '';
      numInput.focus();

      document.getElementById('btn-submit-numeric').onclick = () => {
        const val = numInput.value.trim().toLowerCase();
        const isCorrect = question.acceptableAnswers.includes(val);
        this.handleTrialAnswer(isCorrect, question, onCompleteCallback);
      };
    }

    modal.classList.add('open');
    this.activeModal = modal;
  }

  handleTrialAnswer(isCorrect, question, onCompleteCallback) {
    if (window.calculusManager) window.calculusManager.recordAnswer(isCorrect);

    const explanationBox = document.getElementById('math-explanation-box');
    const titleEl = document.getElementById('math-explanation-status');
    const contentEl = document.getElementById('math-explanation-text');
    const stepEl = document.getElementById('math-explanation-steps');

    explanationBox.classList.add('active');

    if (isCorrect) {
      if (window.soundEngine) window.soundEngine.playMathCorrect();
      titleEl.className = 'math-explanation-title correct';
      titleEl.innerText = '⚡ HARMONIC EQUILIBRIUM! ANSWER CORRECT!';
    } else {
      if (window.soundEngine) window.soundEngine.playMathError();
      titleEl.className = 'math-explanation-title wrong';
      titleEl.innerText = '⚠️ CURSE UNRESOLVED! 1 HEART LOST!';
    }

    contentEl.innerText = isCorrect
      ? 'The spell strikes true! Your mathematical proof damages the entity.'
      : 'The corrupted equation destabilizes your life energy! Study the worked solution below:';

    stepEl.innerText = question.explanation;

    document.getElementById('btn-continue-combat').onclick = () => {
      document.getElementById('math-trial-modal').classList.remove('open');
      this.activeModal = null;
      if (onCompleteCallback) onCompleteCallback(isCorrect, question);
    };
  }

  // =========================================================================
  // NPC DIALOGUE MODAL
  // =========================================================================
  showNpcDialogue(name, role) {
    const modal = document.getElementById('npc-dialog-modal');
    if (!modal) return;
    if (document.exitPointerLock) document.exitPointerLock();

    document.getElementById('npc-name').innerText = name;
    document.getElementById('npc-role').innerText = role;

    const speechText = document.getElementById('npc-speech');
    const choices = document.getElementById('npc-choices');
    choices.innerHTML = '';

    if (name.includes('Guardian')) {
      speechText.innerText = 'Greetings, chosen one. The Kingdom of Numeria has fractured under the Forbidden Equation. Collect the 3 Sacred Keys in this forest to open Morgathia\'s Castle Gate. Remember: Limits reveal the true behavior of functions at the boundary!';
      
      const b1 = document.createElement('button');
      b1.className = 'dialogue-choice-btn';
      b1.innerText = '▶ "How do I evaluate limits with indeterminate forms 0/0?"';
      b1.onclick = () => {
        speechText.innerText = 'When direct substitution gives 0/0, factor the polynomial numerator and denominator to cancel common factors, or multiply by the conjugate if radicals are present!';
      };
      choices.appendChild(b1);

      const b2 = document.createElement('button');
      b2.className = 'dialogue-choice-btn';
      b2.innerText = '▶ "I am ready to restore Numeria."';
      b2.onclick = () => {
        modal.classList.remove('open');
        this.activeModal = null;
      };
      choices.appendChild(b2);
    } else if (name.includes('Scholar')) {
      speechText.innerText = 'Beware traveler! Lich King Vorthak draws power from trigonometric derivatives. Remember the golden laws: d/dx[sin(x)] = cos(x), d/dx[cos(x)] = -sin(x), and d/dx[tan(x)] = sec²(x)!';
      const b1 = document.createElement('button');
      b1.className = 'dialogue-choice-btn';
      b1.innerText = '▶ "Thank you for the guidance, Scholar."';
      b1.onclick = () => {
        modal.classList.remove('open');
        this.activeModal = null;
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

    if (modal.classList.contains('open')) {
      modal.classList.remove('open');
      this.activeModal = null;
    } else {
      if (document.exitPointerLock) document.exitPointerLock();
      this.renderQuestJournal();
      modal.classList.add('open');
      this.activeModal = modal;
    }
  }

  renderQuestJournal() {
    const body = document.getElementById('quest-journal-body');
    if (!body || !window.missionsManager) return;
    body.innerHTML = '';

    const list = window.missionsManager.quests[`realm${window.missionsManager.currentRealm}`] || [];
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
  }

  // =========================================================================
  // INVENTORY MODAL
  // =========================================================================
  toggleInventory() {
    const modal = document.getElementById('inventory-modal');
    if (!modal) return;

    if (modal.classList.contains('open')) {
      modal.classList.remove('open');
      this.activeModal = null;
    } else {
      if (document.exitPointerLock) document.exitPointerLock();
      this.renderInventorySlots();
      modal.classList.add('open');
      this.activeModal = modal;
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

    if (modal.classList.contains('open')) {
      modal.classList.remove('open');
      this.activeModal = null;
    } else {
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
    }
  }

  // =========================================================================
  // CALCULUS CODEX MODAL (BSU Semestral Project Reference & Worked Examples)
  // =========================================================================
  toggleCalculusCodex() {
    const modal = document.getElementById('codex-modal');
    if (!modal) return;

    if (modal.classList.contains('open')) {
      modal.classList.remove('open');
      this.activeModal = null;
    } else {
      if (document.exitPointerLock) document.exitPointerLock();
      this.renderCodexWorkedExamples();
      modal.classList.add('open');
      this.activeModal = modal;
    }
  }

  renderCodexWorkedExamples() {
    const container = document.getElementById('codex-examples-container');
    if (!container || !window.calculusManager) return;
    container.innerHTML = '';

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
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        const parentModal = btn.closest('.fantasy-panel');
        if (!parentModal || !targetTab) return;

        parentModal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        parentModal.querySelectorAll('.tab-content').forEach(c => {
          if (c.id === targetTab) c.classList.add('active');
          else c.classList.remove('active');
        });
      });
    });
  }

  toggleControlsModal() {
    const modal = document.getElementById('controls-modal');
    if (!modal) return;
    if (modal.classList.contains('open')) {
      modal.classList.remove('open');
      this.activeModal = null;
      if (window.game && window.game.isRunning && !window.game.isPaused) {
        window.game.canvas.requestPointerLock();
      }
    } else {
      if (document.exitPointerLock) document.exitPointerLock();
      modal.classList.add('open');
      this.activeModal = modal;
    }
  }

  toggleSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    if (modal.classList.contains('open')) {
      modal.classList.remove('open');
      this.activeModal = null;
      if (window.game && window.game.isRunning && !window.game.isPaused) {
        window.game.canvas.requestPointerLock();
      }
    } else {
      if (document.exitPointerLock) document.exitPointerLock();
      if (window.settingsManager) {
        window.settingsManager.populateSettingsUI();
      }
      modal.classList.add('open');
      this.activeModal = modal;
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

    const resetJoystick = () => {
      this.joystickActive = false;
      joystickThumb.style.transform = 'translate(-50%, -50%)';
      if (window.game && window.game.player) {
        window.game.player.touchMoveVector.x = 0;
        window.game.player.touchMoveVector.y = 0;
      }
    };

    joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.joystickActive = true;
      const rect = joystickZone.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }, { passive: false });

    joystickZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.joystickActive) return;
      const touch = e.touches[0];
      const dx = touch.clientX - this.joystickCenter.x;
      const dy = touch.clientY - this.joystickCenter.y;
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

    joystickZone.addEventListener('touchend', resetJoystick);
    joystickZone.addEventListener('touchcancel', resetJoystick);

    // Mobile Action buttons
    const bindBtn = (id, action) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          action();
        }, { passive: false });
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
    bindBtn('btn-touch-journal', () => this.toggleQuestJournal());
    bindBtn('btn-touch-controls', () => this.toggleControlsModal());
    bindBtn('btn-touch-settings', () => this.toggleSettingsModal());
    bindBtn('btn-touch-dev', () => {
      if (window.devConsoleManager) window.devConsoleManager.toggle();
    });
  }
}

window.interfaceManager = new InterfaceManager();

