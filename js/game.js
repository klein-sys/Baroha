/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * Core Game Engine, Combat Dispatcher, Scene Manager, and Game Loop
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Subsystems
    this.player = null;
    this.world = null;
    this.enemies = null;
    this.abilities = null;

    // Game states
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.clock = new THREE.Clock();

    // Interaction caching & scratch math vectors
    this.nearestInteractable = null;
    this._forward = new THREE.Vector3();
    this._hitPoint = new THREE.Vector3();
    this._viewDir = new THREE.Vector3();
    this._toTarget = new THREE.Vector3();

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera (First-person, 75 deg FOV)
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.scene.add(this.camera);

    // 3. Renderer (Polished Tone Mapping + Soft Shadows)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Subsystems
    this.world = new WorldManager(this.scene);
    this.player = new PlayerController(this.camera, this.scene);
    this.enemies = new EnemiesManager(this.scene);
    this.abilities = new AbilitiesManager(this.scene);

    // Day & Night Cycle, Bosses, 3D Character, and World Map
    this.dayNight = new DayNightManager(this.scene);
    this.bosses = new BossesManager(this.scene);
    this.character = new RobloxCharacter(this.scene, this.camera);
    this.worldMap = new WorldMapManager();

    // Expose globally for cross-system calls
    window.game = this;
    window.abilitiesManager = this.abilities;
    window.worldManager = this.world;
    window.dayNightManager = this.dayNight;
    window.bossesManager = this.bosses;
    window.robloxCharacter = this.character;
    window.worldMapManager = this.worldMap;

    // Setup window resize listener
    window.addEventListener('resize', () => this.onWindowResize());

    // Render initial abilities dock
    if (window.interfaceManager) {
      window.interfaceManager.renderAbilityDock();
      window.interfaceManager.updatePlayerStatsUI();
      window.interfaceManager.updateQuestHUD();
    }

    // Apply settings if loaded
    if (window.settingsManager) {
      window.settingsManager.applySettings();
    }
  }

  startNewGame() {
    // Reset player stats
    this.player.level = 1;
    this.player.xp = 0;
    this.player.hearts = 5;
    this.player.hp = this.player.maxHp;
    this.player.mana = this.player.maxMana;

    this.world.dungeonProgress = {};

    // Hide Main Menu
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) mainMenu.classList.add('hidden');

    // Start sound engine
    if (window.soundEngine) {
      window.soundEngine.init();
      window.soundEngine.resume();
    }

    this.transitionToRealm(1);
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;

    this.requestMouseLook();
  }

  canPlay() {
    return this.isRunning && !this.isPaused && !this.isGameOver && !this.isVictory
      && !document.querySelector('.modal-backdrop.open')
      && !this.dayNight.isSleeping;
  }

  requestMouseLook() {
    if (!this.canPlay() || document.pointerLockElement === this.canvas) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    try {
      this.canvas.requestPointerLock?.()?.catch(() => {});
    } catch {
      // The player can click the canvas to retry when the browser denies capture.
    }
  }

  transitionToRealm(realmId) {
    if (!dungeonFloors[realmId - 1]) return;
    this.nearestInteractable = null;
    this.player.velocity.set(0, 0, 0);
    window.interfaceManager?.hideInteractPrompt();
    window.interfaceManager?.hideBossBar();
    if (window.missionsManager) {
      window.missionsManager.currentRealm = realmId;
    }

    // Load Realm Environment
    this.world.loadRealm(realmId);

    // Spawn Realm Minions
    this.enemies.spawnMinionsForRealm(realmId);

    // Clear projectiles
    this.abilities.clearAllProjectiles();

    // Position player at entrance
    this.player.position.set(0, 2.5, 12);
    this.player.checkpointPosition.set(0, 2.5, 12);
    this.player.yaw = 0;
    this.player.pitch = 0;

    // Update HUD
    const floorName = `Floor ${realmId} · ${this.world.floor.name}`;
    const realmText = document.getElementById('hud-realm-text');
    if (realmText) realmText.innerText = floorName;

    if (window.interfaceManager) {
      window.interfaceManager.showToast(`ENTERING: ${floorName}`, 'info');
      window.interfaceManager.updateQuestHUD();
      window.interfaceManager.updatePlayerStatsUI();
    }
  }

  // =========================================================================
  // COMBAT CHECKS
  // =========================================================================

  checkMeleeHit(damage, reach) {
    const forward = this._forward.set(
      -Math.sin(this.player.yaw),
      Math.sin(this.player.pitch),
      -Math.cos(this.player.yaw)
    ).normalize();
    const hitPoint = this._hitPoint.copy(this.player.position).addScaledVector(forward, reach);

    let hitSomething = false;

    // 1. Check basic enemies
    for (let i = 0; i < this.enemies.enemies.length; i++) {
      const enemy = this.enemies.enemies[i];
      if (!enemy.isDead && enemy.position.distanceTo(hitPoint) < 2.5) {
        enemy.hp -= damage;
        hitSomething = true;
        if (window.soundEngine) window.soundEngine.playSwordHit();
        if (window.interfaceManager) {
          window.interfaceManager.showHitmarker();
          window.interfaceManager.showFloatingText(`-${damage}`, enemy.position, 'damage');
        }

        if (enemy.hp <= 0) {
          enemy.isDead = true;
          this.scene.remove(enemy.mesh);
          this.world?.disposeHierarchy?.(enemy.mesh);
          this.player.addXp(35);
        }
      }
    }

    // 2. Check summoned Skeletons from Lich
    if (this.bosses && this.bosses.summonedSkeletons) {
      for (let i = 0; i < this.bosses.summonedSkeletons.length; i++) {
        const skel = this.bosses.summonedSkeletons[i];
        if (!skel.isDead && skel.position.distanceTo(hitPoint) < 2.5) {
          skel.hp -= damage;
          hitSomething = true;
          if (window.soundEngine) window.soundEngine.playSwordHit();
          if (window.interfaceManager) {
            window.interfaceManager.showHitmarker();
            window.interfaceManager.showFloatingText(`-${damage}`, skel.position, 'damage');
          }
          if (skel.hp <= 0) {
            skel.isDead = true;
            this.scene.remove(skel.mesh);
            this.world?.disposeHierarchy?.(skel.mesh);
            this.player.addXp(40);
          }
        }
      }
    }

    // 3. Check active Boss
    if (this.enemies.isBossActive && this.enemies.activeBoss) {
      const boss = this.enemies.activeBoss;
      if (boss.position.distanceTo(hitPoint) < 5.0) {
        hitSomething = true;
        this.enemies.damageBoss(damage);
        if (window.interfaceManager) window.interfaceManager.showHitmarker();
      }
    }

    return hitSomething;
  }

  checkProjectileHitEnemy(proj) {
    // 1. Enemies check
    for (let i = 0; i < this.enemies.enemies.length; i++) {
      const enemy = this.enemies.enemies[i];
      if (!enemy.isDead && enemy.position.distanceTo(proj.mesh.position) < (enemy.type === 'wolf' ? 1.8 : 1.4)) {
        enemy.hp -= proj.damage;
        if (window.soundEngine) window.soundEngine.playSwordHit();
        if (window.interfaceManager) {
          window.interfaceManager.showHitmarker();
          window.interfaceManager.showFloatingText(`-${proj.damage}`, enemy.position, 'crit');
        }

        if (enemy.hp <= 0) {
          enemy.isDead = true;
          this.scene.remove(enemy.mesh);
          this.world?.disposeHierarchy?.(enemy.mesh);
          this.player.addXp(35);
        }
        return true;
      }
    }

    // 2. Summoned Skeletons check
    if (this.bosses && this.bosses.summonedSkeletons) {
      for (let i = 0; i < this.bosses.summonedSkeletons.length; i++) {
        const skel = this.bosses.summonedSkeletons[i];
        if (!skel.isDead && skel.position.distanceTo(proj.mesh.position) < 1.8) {
          skel.hp -= proj.damage;
          if (window.soundEngine) window.soundEngine.playSwordHit();
          if (window.interfaceManager) {
            window.interfaceManager.showHitmarker();
            window.interfaceManager.showFloatingText(`-${proj.damage}`, skel.position, 'crit');
          }
          if (skel.hp <= 0) {
            skel.isDead = true;
            this.scene.remove(skel.mesh);
            this.world?.disposeHierarchy?.(skel.mesh);
            this.player.addXp(40);
          }
          return true;
        }
      }
    }

    // 3. Boss check
    if (this.enemies.isBossActive && this.enemies.activeBoss) {
      const boss = this.enemies.activeBoss;
      if (boss.position.distanceTo(proj.mesh.position) < 4.2) {
        this.enemies.damageBoss(proj.damage);
        if (window.interfaceManager) window.interfaceManager.showHitmarker();
        return true;
      }
    }

    return false;
  }

  checkProjectileHitPlayer(proj) {
    if (this.player.position.distanceTo(proj.mesh.position) < 1.2) {
      this.player.takeDamage(proj.damage);
      return true;
    }
    return false;
  }

  dealAoeDamage(center, radius, damage) {
    for (let i = 0; i < this.enemies.enemies.length; i++) {
      const enemy = this.enemies.enemies[i];
      if (!enemy.isDead && enemy.position.distanceTo(center) <= radius && this.world.hasLineOfSight(center, enemy.position)) {
        enemy.hp -= damage;
        if (window.interfaceManager) {
          window.interfaceManager.showFloatingText(`-${damage}`, enemy.position, 'crit');
        }
        if (enemy.hp <= 0) {
          enemy.isDead = true;
          this.scene.remove(enemy.mesh);
          this.world?.disposeHierarchy?.(enemy.mesh);
          this.player.addXp(40);
        }
      }
    }

    if (this.enemies.isBossActive && this.enemies.activeBoss) {
      const boss = this.enemies.activeBoss;
      if (boss.position.distanceTo(center) <= radius && this.world.hasLineOfSight(center, boss.position)) {
        this.enemies.damageBoss(damage);
      }
    }
  }

  castEquippedAbility() {
    if (this.canPlay()) this.abilities.castAbility(this.player);
  }

  autoSaveProgress() {
    if (window.progressionManager && this.player && this.world) {
      window.progressionManager.saveGame(
        this.player,
        this.world,
        window.missionsManager,
        window.inventoryManager,
        this.abilities
      );
    }
  }

  // =========================================================================
  // INTERACTION LOGIC
  // =========================================================================

  updateInteractions() {
    if (this.dayNight && this.dayNight.isSleeping) {
      this.nearestInteractable = null;
      window.interfaceManager?.hideInteractPrompt();
      return;
    }

    // Check Collectibles
    for (let i = 0; i < this.world.collectibles.length; i++) {
      const item = this.world.collectibles[i];
      if (!item.collected) {
        const d = this.player.position.distanceTo(item.position);
        if (d < item.radius) {
          this.collectItem(item);
          if (!this.canPlay()) return;
        }
      }
    }

    // Player camera forward vector for intuitive facing/view targeting
    const viewDir = this._viewDir.set(
      -Math.sin(this.player.yaw) * Math.cos(this.player.pitch),
      Math.sin(this.player.pitch),
      -Math.cos(this.player.yaw) * Math.cos(this.player.pitch)
    ).normalize();

    let bestTarget = null;
    let bestScore = Infinity;

    for (let i = 0; i < this.world.interactables.length; i++) {
      const target = this.world.interactables[i];
      const d = this.player.position.distanceTo(target.position);
      if (d > target.radius) continue;

      // Prevent interacting through solid house walls, closed doors, or obstructions
      if (this.world.hasLineOfSight &&
          !this.world.hasLineOfSight(this.player.position, target.position, target.ignoreCollider || null)) {
        continue;
      }

      // Bias toward object player is actually looking at when two interactables overlap in range
      this._toTarget.copy(target.position).sub(this.player.position).normalize();
      const align = viewDir.dot(this._toTarget);
      // Require rough front/side awareness when looking completely opposite at another close object
      const score = d - align * 1.4;
      if (score < bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    }

    this.nearestInteractable = bestTarget;

    if (bestTarget && window.interfaceManager) {
      const label = bestTarget.promptText || `Interact: ${bestTarget.name}`;
      window.interfaceManager.showInteractPrompt(label);
      if (bestTarget.getTelemetry) {
        window.interfaceManager.renderCalculusTelemetry(bestTarget.getTelemetry());
      }
    } else if (window.interfaceManager) {
      window.interfaceManager.hideInteractPrompt();
      // Check if near an oscillating platform
      let nearPlatform = false;
      if (this.world && this.world.oscillatingPlatforms) {
        for (let i = 0; i < this.world.oscillatingPlatforms.length; i++) {
          const p = this.world.oscillatingPlatforms[i];
          if (p.mesh && this.player.position.distanceTo(p.mesh.position) < 6.5) {
            nearPlatform = true;
            const t = this.world._elapsed || (Date.now() * 0.001);
            const calc = window.calculusEngine ? window.calculusEngine.evalOscillatingPlatform(t, p.A, p.omega) : null;
            if (calc) {
              window.interfaceManager.renderCalculusTelemetry({
                title: 'HARMONIC OSCILLATING PLATFORM',
                func: `y(t) = ${p.A}·sin(${p.omega}t)`,
                details: `v(t) = y'(t) = ${(p.A * p.omega).toFixed(1)}·cos(${p.omega}t). Critical leap peak at v(t) ≈ 0!`,
                metrics: [
                  { label: 'Elevation y(t)', val: `${calc.y.toFixed(2)}m` },
                  { label: 'Velocity v(t)', val: `${calc.v.toFixed(2)}m/s` },
                  { label: 'Acceleration a(t)', val: `${calc.a.toFixed(2)}m/s²` },
                  { label: 'Platform Leap State', val: calc.isAtPeak ? 'SAFE (STATIONARY PEAK)' : 'ACTIVE (v ≠ 0)' }
                ]
              });
            }
            break;
          }
        }
      }
      if (!nearPlatform && (!this.enemies || !this.enemies.isBossActive)) {
        window.interfaceManager.hideCalculusTelemetry();
      }
    }
  }

  handleInteract() {
    if (this.canPlay() && !this.dayNight?.isSleeping && this.nearestInteractable) {
      this.nearestInteractable.interact();
    }
  }

  collectItem(item) {
    item.collected = true;
    const state = this.world.dungeonProgress[this.world.currentRealm];
    (state.loot ??= []).push(item.name);
    this.scene.remove(item.mesh);
    this.world?.disposeHierarchy?.(item.mesh);

    if (item.type === 'potion') {
      window.inventoryManager.addItem('potion', 'Healing Potion', '🍷', 'Restores 50 Health instantly.', 'consumable', 1);
    } else if (item.type === 'mana') {
      window.inventoryManager.addItem('mana', 'Mana Crystal', '💎', 'Restores 50 Mana instantly.', 'consumable', 1);
    } else if (item.type === 'golden_heart') {
      window.inventoryManager.addItem('golden_heart', 'Golden Heart', '💛', 'Restores 1 lost life container.', 'consumable', 1);
    } else if (item.type === 'key') {
      if (window.missionsManager) window.missionsManager.recordKeyCollected();
      if (window.soundEngine) window.soundEngine.playItemPickup();
      if (window.interfaceManager) window.interfaceManager.showToast(`FOUND: ${item.name}!`, 'success');
    } else if (item.type === 'scroll') {
      if (window.soundEngine) window.soundEngine.playItemPickup();
      this.player.addXp(150);
      this.player.restoreMana(50);
      if (window.interfaceManager) {
        window.interfaceManager.showToast('📜 Ancient Calculus Scroll: New Codex Theorem Discovered (+150 XP, +50 MP)! Press [M] to inspect.', 'success');
      }
    } else if (item.type === 'xp') {
      this.player.addXp(150);
      if (window.soundEngine) window.soundEngine.playItemPickup();
    } else if (item.type === 'chest') {
      if (window.soundEngine) window.soundEngine.playChestOpen();
      this.player.addXp(80);
      window.inventoryManager.addItem('potion', 'Healing Potion', '🍷', 'Restores 50 Health instantly.', 'consumable', 1);
      window.inventoryManager.addItem('mana', 'Mana Crystal', '💎', 'Restores 50 Mana instantly.', 'consumable', 1);
    }
    this.autoSaveProgress();
  }

  // =========================================================================
  // BOSS ENCOUNTERS & CALCULUS MECHANICS
  // =========================================================================

  startBossEncounter(realmId) {
    if (this.enemies.isBossActive || this.world.dungeonProgress[realmId]?.defeated) return;
    this.enemies.spawnBoss(realmId);
    window.interfaceManager?.updateQuestHUD();
  }

  triggerCalculusSurge(damage = 50) {
    if (!this.enemies.isBossActive) return;
    this.enemies.damageBoss(damage);
    this.player.addXp(80);
    if (window.soundEngine) window.soundEngine.playMathCorrect();
    if (window.interfaceManager) {
      window.interfaceManager.showToast(`⚡ CALCULUS SURGE: Resonance dealt ${damage} direct damage to boss!`, 'success');
    }
  }

  handleBossDefeated(realmId) {
    if (realmId !== this.world.currentRealm || this.world.dungeonProgress[realmId]?.defeated) return;
    this.world.unlockDescent();
    const fragment = realmId === 4 ? 3 : realmId;
    if (realmId !== 3) window.missionsManager?.awardCrystalFragment(fragment);
    this.player.addXp([500, 1000, 1200, 2000][realmId - 1]);
    const spell = [null, 'fireball', 'lightning', 'shield', 'nova'][realmId];
    this.abilities.unlockAbility(spell);
    window.soundEngine?.startMusicForRealm(realmId, false);
    window.interfaceManager?.showToast('Descent portal opened at the back of the arena.', 'success');
    window.interfaceManager?.updateQuestHUD();
    this.autoSaveProgress();
  }

  // =========================================================================
  // SURVIVAL & GAME STATES
  // =========================================================================

  handleGameOver() {
    if (this.enemies.isBossActive) this.resetArena();
    this.isGameOver = true;
    this.isRunning = false;
    if (document.exitPointerLock) document.exitPointerLock();

    const screen = document.getElementById('game-over-screen');
    if (screen) screen.classList.remove('hidden');
  }

  resetArena() {
    this.bosses.clearBoss();
    this.enemies.activeBoss = null;
    this.enemies.isBossActive = false;
    this.abilities.clearAllProjectiles();
    window.interfaceManager?.hideBossBar();
    window.interfaceManager?.updateQuestHUD();
  }

  retryCheckpoint() {
    this.player.hearts = 5;
    this.player.hp = this.player.maxHp;
    this.player.mana = this.player.maxMana;
    this.player.respawnAtCheckpoint();

    const screen = document.getElementById('game-over-screen');
    if (screen) screen.classList.add('hidden');

    this.isGameOver = false;
    this.isRunning = true;
    this.requestMouseLook();

    if (window.interfaceManager) {
      window.interfaceManager.updatePlayerStatsUI();
    }
  }

  handleGameVictory() {
    this.isVictory = true;
    this.isRunning = false;
    if (document.exitPointerLock) document.exitPointerLock();

    // Populate final stats
    document.getElementById('stat-level').innerText = this.player.level;
    document.getElementById('stat-xp').innerText = this.player.xp;
    document.getElementById('stat-accuracy').innerText = `${window.calculusManager ? window.calculusManager.getAccuracy() : 100}%`;

    const victoryScreen = document.getElementById('victory-screen');
    if (victoryScreen) victoryScreen.classList.remove('hidden');

    if (window.soundEngine) window.soundEngine.stopMusic();
  }

  togglePause() {
    if (!this.isRunning || this.isGameOver || this.isVictory || document.querySelector('.modal-backdrop.open')) return;

    this.isPaused = !this.isPaused;
    const pauseMenu = document.getElementById('pause-menu');

    if (this.isPaused) {
      if (document.exitPointerLock) document.exitPointerLock();
      if (pauseMenu) pauseMenu.classList.remove('hidden');
    } else {
      if (pauseMenu) pauseMenu.classList.add('hidden');
      this.requestMouseLook();
    }
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    const scale = (window.settingsManager && window.settingsManager.settings.graphics.resolutionScale) || 1.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio * scale, 2.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // =========================================================================
  // MAIN ANIMATION LOOP
  // =========================================================================

  update(now = 0) {
    requestAnimationFrame((t) => this.update(t));

    // FPS limiter check
    const fpsCap = (window.settingsManager && window.settingsManager.settings.graphics.fpsCap) || 0;
    if (fpsCap > 0) {
      if (!this.lastFrameTime) this.lastFrameTime = 0;
      const minFrameInterval = 1000 / fpsCap;
      if (now - this.lastFrameTime < minFrameInterval) {
        return;
      }
      this.lastFrameTime = now;
    }

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.canPlay()) {
      // 1. Day / Night atmosphere & orbital lighting
      if (this.dayNight) this.dayNight.update(delta);

      // Move lifts before resolving player contact.
      this.world.update(delta);

      // 2. Update Player & 3D Third-Person Character
      this.player.update(delta);
      if (this.character) this.character.update(delta, this.player);

      // 4. Update Abilities & Projectiles
      this.abilities.update(delta);

      // 5. Update Enemies & 3D Bosses
      this.enemies.update(delta, this.player);
      if (this.canPlay() && this.bosses) this.bosses.update(delta, this.player);

      // 6. Update Proximity Interactions
      if (this.canPlay()) this.updateInteractions();

      // 7. Update HUD Stats & Cooldowns
      if (window.interfaceManager) {
        window.interfaceManager.updatePlayerStatsUI();
        window.interfaceManager.updateAbilityCooldowns();
      }

      // 8. Dev Console Telemetry & God Mode
      if (window.devConsoleManager) {
        window.devConsoleManager.update(delta);
      }
    }

    // Render Scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

window.GameEngine = GameEngine;

