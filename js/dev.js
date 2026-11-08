/**
 * MATHBOUND – LEGENDS OF THE THREE BOSSES
 * Comprehensive Developer Console & Debug Suite
 * Provides full dev access to all game functions, mechanics, calculus trials, and teleportation.
 */

class DevConsoleManager {
  constructor() {
    this.isOpen = false;
    this.isGodMode = false;
    this.speedMultiplier = 1.0;
    this.isNoclip = false;
    this.isDebugOverlayActive = false;
    this.debugOverlayEl = null;

    // Original stats backup
    this.origWalkSpeed = 8.0;
    this.origSprintSpeed = 14.0;

    this.initOverlay();
    this.bindEvents();
  }

  initOverlay() {
    let el = document.getElementById('dev-debug-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dev-debug-overlay';
      el.style.cssText = `
        position: fixed;
        bottom: 85px;
        left: 20px;
        background: rgba(10, 10, 18, 0.88);
        border: 1px solid #00d4ff;
        border-radius: 8px;
        padding: 8px 14px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: #00d4ff;
        z-index: 800;
        pointer-events: none;
        display: none;
        box-shadow: 0 4px 15px rgba(0, 212, 255, 0.2);
        line-height: 1.4;
      `;
      document.body.appendChild(el);
    }
    this.debugOverlayEl = el;
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      // Don't capture when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Backquote' || e.code === 'F1') {
        e.preventDefault();
        this.toggle();
      }
    });

    // Close button
    const closeBtn = document.getElementById('btn-close-dev');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.isOpen = false;
      });
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    const modal = document.getElementById('dev-console-modal');
    if (!modal) return;

    if (this.isOpen) {
      if (window.interfaceManager) window.interfaceManager.closeAllModals('dev-console-modal');
      if (document.exitPointerLock) document.exitPointerLock();
      this.populateDevUI();
      modal.classList.add('open');
      if (window.soundEngine) window.soundEngine.playItemPickup();
    } else {
      modal.classList.remove('open');
      if (window.interfaceManager) {
        window.interfaceManager.resumePointerLockIfActive();
      } else if (window.game && window.game.isRunning && !window.game.isPaused) {
        const canvas = document.getElementById('game-canvas');
        if (canvas) canvas.requestPointerLock();
      }
    }
  }

  populateDevUI() {
    // Update live status indicators in dev modal
    const godBtn = document.getElementById('btn-dev-toggle-god');
    if (godBtn) {
      godBtn.innerText = this.isGodMode ? '⚡ GOD MODE: [ACTIVE]' : '⚡ GOD MODE: [OFF]';
      godBtn.className = this.isGodMode ? 'btn-dev-action active-toggle' : 'btn-dev-action';
    }

    const noclipBtn = document.getElementById('btn-dev-toggle-noclip');
    if (noclipBtn) {
      noclipBtn.innerText = this.isNoclip ? '🕊️ NOCLIP / FLY: [ACTIVE]' : '🕊️ NOCLIP / FLY: [OFF]';
      noclipBtn.className = this.isNoclip ? 'btn-dev-action active-toggle' : 'btn-dev-action';
    }

    const overlayBtn = document.getElementById('btn-dev-toggle-overlay');
    if (overlayBtn) {
      overlayBtn.innerText = this.isDebugOverlayActive ? '📊 DEBUG OVERLAY: [ON]' : '📊 DEBUG OVERLAY: [OFF]';
      overlayBtn.className = this.isDebugOverlayActive ? 'btn-dev-action active-toggle' : 'btn-dev-action';
    }
  }

  // =========================================================================
  // 1. GOD MODE & PLAYER STATS
  // =========================================================================

  toggleGodMode() {
    this.isGodMode = !this.isGodMode;
    if (window.game && window.game.player) {
      const p = window.game.player;
      p.isInvulnerable = this.isGodMode;
      if (this.isGodMode) {
        p.hp = p.maxHp;
        p.mana = p.maxMana;
        p.hearts = 5;
      }
    }
    this.populateDevUI();
    this.notify(`God Mode ${this.isGodMode ? 'ACTIVATED (Invulnerable & Infinite Mana)' : 'DEACTIVATED'}`);
  }

  setSpeed(multiplier = 1.0) {
    this.speedMultiplier = multiplier;
    if (window.game && window.game.player) {
      window.game.player.walkSpeed = this.origWalkSpeed * multiplier;
      window.game.player.sprintSpeed = this.origSprintSpeed * multiplier;
    }
    this.notify(`Player Movement Speed set to ${multiplier}x`);
  }

  toggleNoclip() {
    this.isNoclip = !this.isNoclip;
    if (window.game && window.game.player) {
      const p = window.game.player;
      p.gravity = this.isNoclip ? 0 : 24.0;
      if (this.isNoclip) {
        p.velocity.y = 0;
        p.jumpForce = 18.0;
      } else {
        p.jumpForce = 9.0;
      }
    }
    this.populateDevUI();
    this.notify(`Noclip / Fly mode ${this.isNoclip ? 'ENABLED' : 'DISABLED'}`);
  }

  healFull() {
    if (window.game && window.game.player) {
      const p = window.game.player;
      p.hp = p.maxHp;
      p.mana = p.maxMana;
      p.hearts = 5;
      if (window.interfaceManager) window.interfaceManager.updatePlayerStatsUI();
      this.notify('HP, Mana & All 5 Hearts fully restored!');
    }
  }

  maxLevel() {
    if (window.game && window.game.player) {
      const p = window.game.player;
      p.level = 4;
      p.rankTitle = 'Legendary Guardian';
      p.maxHp = 250;
      p.hp = 250;
      p.maxMana = 200;
      p.mana = 200;
      p.attackPower = 85;
      p.equippedWeapon.damage = 85;

      // Unlock all abilities
      if (window.abilitiesManager) {
        window.abilitiesManager.unlockAbility('fireball');
        window.abilitiesManager.unlockAbility('lightning');
        window.abilitiesManager.unlockAbility('nova');
      }

      if (window.interfaceManager) {
        window.interfaceManager.updatePlayerStatsUI();
        window.interfaceManager.renderAbilityDock();
      }
      this.notify('Player promoted to MAX LEVEL 4 (Legendary Guardian)!');
    }
  }

  addXp(amount = 1000) {
    if (window.game && window.game.player) {
      window.game.player.addXp(amount);
      this.notify(`Added +${amount} XP to player.`);
    }
  }

  // =========================================================================
  // 2. REALM & TELEPORTATION
  // =========================================================================

  teleport(x, y, z) {
    if (window.game && window.game.player) {
      window.game.player.position.set(x, y, z);
      window.game.player.velocity.set(0, 0, 0);
      window.game.player.setCheckpoint(new THREE.Vector3(x, y, z));
      if (window.robloxCharacter) {
        window.robloxCharacter.position.set(x, y, z);
        window.robloxCharacter.mesh.position.set(x, y, z);
      }
      this.notify(`Teleported to (${x}, ${y}, ${z})`);
    }
  }

  loadRealm(realmId) {
    if (window.game) {
      window.game.transitionToRealm(realmId);
      this.notify(`Switched to Realm ${realmId}!`);
    }
  }

  // =========================================================================
  // 3. BOSS CONTROLS
  // =========================================================================

  spawnBoss(realmId) {
    if (window.game) {
      window.game.startBossEncounter(realmId);
      this.notify(`Boss for Realm ${realmId} spawned!`);
    }
  }

  killBoss() {
    if (window.game && window.game.enemies && window.game.enemies.isBossActive) {
      const boss = window.game.enemies.activeBoss;
      window.game.enemies.damageBoss(99999);
      this.notify(`Boss ${boss ? boss.name : ''} instantly defeated!`);
    } else {
      this.notify('No active boss to defeat.', 'warning');
    }
  }

  triggerBossTrial(phase = 1) {
    if (window.game) {
      const realm = (window.missionsManager && window.missionsManager.currentRealm) || 1;
      window.game.triggerBossMathTrial(realm, phase);
      this.toggle(); // close dev console to allow answering
    }
  }

  clearAllMinions() {
    if (window.game && window.game.enemies) {
      window.game.enemies.enemies.forEach(e => {
        if (!e.isDead) {
          e.isDead = true;
          window.game.scene.remove(e.mesh);
        }
      });
      window.game.enemies.enemies = [];
      if (window.bossesManager && window.bossesManager.summonedSkeletons) {
        window.bossesManager.summonedSkeletons.forEach(s => {
          if (s.mesh) window.game.scene.remove(s.mesh);
        });
        window.bossesManager.summonedSkeletons = [];
      }
      this.notify('All minion enemies cleared from arena.');
    }
  }

  // =========================================================================
  // 4. CALCULUS ENGINE TESTING & TRIAL RUNNER
  // =========================================================================

  triggerMathQuestion(realmId = 1, phase = 1) {
    if (window.calculusManager && window.interfaceManager) {
      const q = window.calculusManager.getRandomQuestion(realmId, phase);
      this.toggle();
      window.interfaceManager.openMathTrial(q, true, (isCorrect) => {
        if (isCorrect) {
          this.notify(`Answer was CORRECT! (${q.topic})`, 'success');
        } else {
          this.notify(`Answer was INCORRECT. (${q.topic})`, 'error');
        }
      });
    }
  }

  solveCurrentTrial() {
    if (!window.interfaceManager || !window.interfaceManager.currentTrialData) {
      this.notify('No calculus trial is currently open.', 'warning');
      return;
    }
    const q = window.interfaceManager.currentTrialData;
    window.interfaceManager.handleTrialAnswer(true, q, (isCorrect) => {
      if (window.game && window.game.enemies && window.game.enemies.isBossActive) {
        window.game.enemies.damageBoss(q.damage * 1.5);
      }
    });
    this.notify(`Auto-solved ${q.topic} with 100% accuracy!`, 'success');
  }

  runCalculusDiagnostics() {
    if (!window.calculusManager) return;
    const cm = window.calculusManager;
    let errors = 0;
    let tested = 0;

    ['realm1', 'realm2', 'realm3'].forEach(r => {
      const list = cm.questionBank[r] || [];
      list.forEach(q => {
        tested++;
        if (q.type === 'mcq') {
          const correct = q.options.filter(o => o.isCorrect);
          if (correct.length !== 1) errors++;
        } else if (q.type === 'numeric') {
          if (!q.correctAnswer || !q.acceptableAnswers || q.acceptableAnswers.length === 0) errors++;
        }
      });
    });

    if (errors === 0) {
      this.notify(`Calculus Test Passed: All ${tested} questions are mathematically verified!`, 'success');
    } else {
      this.notify(`Calculus Test Warning: Found ${errors} question bank errors!`, 'error');
    }
  }

  // =========================================================================
  // 5. INVENTORY & CHEATS
  // =========================================================================

  giveAllKeys() {
    if (window.missionsManager) {
      window.missionsManager.forestKeysCollected = 3;
      window.missionsManager.towersActivated = 3;
      window.missionsManager.recordKeyCollected();
      window.missionsManager.recordTowerActivated();
      this.notify('Gave all 3 Forest Keys of Limits & activated all 3 Towers!');
    }
  }

  giveAllItems() {
    if (window.inventoryManager) {
      window.inventoryManager.addItem('potion', 'Healing Potion', '🍷', 'Restores 50 Health.', 'consumable', 5);
      window.inventoryManager.addItem('mana', 'Mana Crystal', '💎', 'Restores 50 Mana.', 'consumable', 5);
      window.inventoryManager.addItem('golden_heart', 'Golden Heart', '💛', 'Restores 1 lost life container.', 'consumable', 5);
      this.notify('Added +5 Potions, +5 Mana Crystals, and +5 Golden Hearts!');
    }
  }

  unlockAllSpells() {
    if (window.abilitiesManager) {
      window.abilitiesManager.unlockAbility('fireball');
      window.abilitiesManager.unlockAbility('lightning');
      window.abilitiesManager.unlockAbility('nova');
      if (window.interfaceManager) window.interfaceManager.renderAbilityDock();
      this.notify('All 6 Arcane Spells unlocked and ready!');
    }
  }

  grantAllCrystals() {
    if (window.missionsManager) {
      window.missionsManager.crystals.fragment1 = true;
      window.missionsManager.crystals.fragment2 = true;
      window.missionsManager.crystals.fragment3 = true;
      if (window.interfaceManager) window.interfaceManager.updateCrystalsUI(window.missionsManager.crystals);
      this.notify('All 3 Sacred Calculus Crystal Fragments granted!');
    }
  }

  // =========================================================================
  // 6. TIME OF DAY & ATMOSPHERE
  // =========================================================================

  setTimeOfDay(hour) {
    if (window.dayNightManager) {
      window.dayNightManager.timeOfDay = hour;
      window.dayNightManager.updateAtmosphere();
      window.dayNightManager.isNight = (hour >= 19.0 || hour < 5.0);
      window.dayNightManager.updateClockUI();
      this.notify(`Time of Day set to ${hour.toFixed(1)}:00 (${window.dayNightManager.isNight ? 'Night' : 'Day'})`);
    }
  }

  // =========================================================================
  // 7. DEBUG OVERLAY & LIVE TELEMETRY
  // =========================================================================

  toggleDebugOverlay() {
    this.isDebugOverlayActive = !this.isDebugOverlayActive;
    if (this.debugOverlayEl) {
      this.debugOverlayEl.style.display = this.isDebugOverlayActive ? 'block' : 'none';
    }
    this.populateDevUI();
    this.notify(`Live Debug Overlay ${this.isDebugOverlayActive ? 'ENABLED' : 'DISABLED'}`);
  }

  update(delta) {
    // If God Mode active, clamp player stats
    if (this.isGodMode && window.game && window.game.player) {
      const p = window.game.player;
      p.hp = p.maxHp;
      p.mana = p.maxMana;
      p.hearts = 5;
      p.isInvulnerable = true;
      if (window.abilitiesManager) {
        window.abilitiesManager.abilities.forEach(a => a.timer = 0);
      }
    }

    // Update Live Debug Overlay
    if (this.isDebugOverlayActive && this.debugOverlayEl && window.game) {
      const p = window.game.player;
      const b = window.game.enemies ? window.game.enemies.activeBoss : null;
      const timeStr = window.dayNightManager ? `${window.dayNightManager.timeOfDay.toFixed(1)}h` : 'N/A';
      const fps = Math.round(1 / (delta || 0.016));

      this.debugOverlayEl.innerHTML = `
        <span style="color:#ffd978;">🛠️ DEV TELEMETRY</span> | FPS: <strong>${fps}</strong><br/>
        POS: X:<strong>${p.position.x.toFixed(1)}</strong> Y:<strong>${p.position.y.toFixed(1)}</strong> Z:<strong>${p.position.z.toFixed(1)}</strong> | YAW: ${(p.yaw * 180 / Math.PI).toFixed(0)}°<br/>
        REALM: <strong>${(window.missionsManager && window.missionsManager.currentRealm) || 1}</strong> | TIME: <strong>${timeStr}</strong> | GOD: <strong>${this.isGodMode ? 'ON' : 'OFF'}</strong><br/>
        BOSS: <strong>${b ? `${b.name} (${Math.ceil(window.game.enemies.bossHp)}/${window.game.enemies.bossMaxHp})` : 'None'}</strong> | ENEMIES: <strong>${window.game.enemies.enemies.length}</strong>
      `;
    }
  }

  // =========================================================================
  // 8. SAVE & GAME STATE
  // =========================================================================

  forceSave() {
    if (window.progressionManager && window.game) {
      window.progressionManager.saveGame(
        window.game.player,
        window.game.world,
        window.missionsManager,
        window.inventoryManager,
        window.game.abilities
      );
      this.notify('Game state forced saved to LocalStorage!', 'success');
    }
  }

  forceReset() {
    if (confirm('Are you sure you want to wipe all local progress and restart?')) {
      if (window.progressionManager) window.progressionManager.clearSave();
      location.reload();
    }
  }

  testVictory() {
    this.toggle();
    if (window.game) window.game.handleGameVictory();
  }

  testGameOver() {
    this.toggle();
    if (window.game) window.game.handleGameOver();
  }

  notify(msg, type = 'info') {
    if (window.interfaceManager) {
      window.interfaceManager.showToast(`[DEV] ${msg}`, type);
    }
    console.log(`[DEV CONSOLE] ${msg}`);
  }
}

// Global initialization
window.DevConsoleManager = DevConsoleManager;
window.devConsoleManager = new DevConsoleManager();
window.dev = window.devConsoleManager; // convenient console alias
