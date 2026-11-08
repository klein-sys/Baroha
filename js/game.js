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

    // Interaction caching
    this.nearestInteractable = null;

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera (First-person, 75 deg FOV)
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.scene.add(this.camera);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false; // Optimized for performance

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

    // Load Realm 1 (The Witch's Cursed Forest)
    this.transitionToRealm(1);

    // Hide Main Menu
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) mainMenu.classList.add('hidden');

    // Start sound engine
    if (window.soundEngine) {
      window.soundEngine.init();
      window.soundEngine.resume();
    }

    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;

    // Lock pointer for mouse look
    this.canvas.requestPointerLock();
  }

  transitionToRealm(realmId) {
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
    const realmNames = [
      'Realm I: The Cursed Forest',
      'Realm II: The Forgotten Kingdom',
      'Realm III: The Realm Beyond Infinity'
    ];
    const realmText = document.getElementById('hud-realm-text');
    if (realmText) realmText.innerText = realmNames[realmId - 1];

    if (window.interfaceManager) {
      window.interfaceManager.showToast(`ENTERING: ${realmNames[realmId - 1]}`, 'info');
      window.interfaceManager.updateQuestHUD();
      window.interfaceManager.updatePlayerStatsUI();
    }
  }

  // =========================================================================
  // COMBAT CHECKS
  // =========================================================================

  checkMeleeHit(damage, reach) {
    const forward = new THREE.Vector3(-Math.sin(this.player.yaw), Math.sin(this.player.pitch), -Math.cos(this.player.yaw)).normalize();
    const hitPoint = this.player.position.clone().addScaledVector(forward, reach);

    let hitSomething = false;

    // 1. Check basic enemies
    this.enemies.enemies.forEach(enemy => {
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
          this.player.addXp(35);
        }
      }
    });

    // 2. Check summoned Skeletons from Lich
    if (this.bosses && this.bosses.summonedSkeletons) {
      this.bosses.summonedSkeletons.forEach(skel => {
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
            this.player.addXp(40);
          }
        }
      });
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
    this.enemies.enemies.forEach(enemy => {
      if (!enemy.isDead && enemy.position.distanceTo(center) <= radius) {
        enemy.hp -= damage;
        if (window.interfaceManager) {
          window.interfaceManager.showFloatingText(`-${damage}`, enemy.position, 'crit');
        }
        if (enemy.hp <= 0) {
          enemy.isDead = true;
          this.scene.remove(enemy.mesh);
          this.player.addXp(40);
        }
      }
    });

    if (this.enemies.isBossActive && this.enemies.activeBoss) {
      const boss = this.enemies.activeBoss;
      if (boss.position.distanceTo(center) <= radius) {
        this.enemies.damageBoss(damage);
      }
    }
  }

  castEquippedAbility() {
    this.abilities.castAbility(this.player);
  }

  // =========================================================================
  // INTERACTION LOGIC
  // =========================================================================

  updateInteractions() {
    let nearest = null;
    let minDist = 3.6;

    // Check Collectibles
    this.world.collectibles.forEach(item => {
      if (!item.collected) {
        const d = this.player.position.distanceTo(item.position);
        if (d < item.radius) {
          this.collectItem(item);
        }
      }
    });

    // Check Interactables (NPCs, gates, towers)
    this.world.interactables.forEach(target => {
      const d = this.player.position.distanceTo(target.position);
      if (d < target.radius && d < minDist) {
        nearest = target;
        minDist = d;
      }
    });

    this.nearestInteractable = nearest;

    if (nearest && window.interfaceManager) {
      window.interfaceManager.showInteractPrompt(`Press [E] to interact with ${nearest.name}`);
    } else if (window.interfaceManager) {
      window.interfaceManager.hideInteractPrompt();
    }
  }

  handleInteract() {
    if (this.nearestInteractable) {
      this.nearestInteractable.interact();
    }
  }

  collectItem(item) {
    item.collected = true;
    this.scene.remove(item.mesh);

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
      // Trigger optional calculus puzzle
      if (window.soundEngine) window.soundEngine.playItemPickup();
      const q = window.calculusManager.getRandomQuestion(this.world.currentRealm, 1);
      if (window.interfaceManager) {
        window.interfaceManager.openMathTrial(q, false, (isCorrect) => {
          if (isCorrect) {
            this.player.addXp(120);
          }
        });
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
  }

  // =========================================================================
  // BOSS ENCOUNTERS & CALCULUS TRIALS
  // =========================================================================

  startBossEncounter(realmId) {
    this.enemies.spawnBoss(realmId);
  }

  triggerBossMathTrial(realmId, phase) {
    if (!this.enemies.isBossActive) return;

    const question = window.calculusManager.getRandomQuestion(realmId, phase);
    if (!question) return;

    if (window.interfaceManager) {
      window.interfaceManager.openMathTrial(question, true, (isCorrect, q) => {
        if (isCorrect) {
          // Deal massive mathematical damage to boss
          this.enemies.damageBoss(q.damage * 1.5);
          this.player.addXp(75);
        } else {
          // Boss attack hits player! Deduct 1 Heart
          this.player.loseHeart();
        }
      });
    }
  }

  handleBossDefeated(realmId) {
    // Award Crystal Fragment
    if (window.missionsManager) {
      window.missionsManager.awardCrystalFragment(realmId);
    }

    if (realmId === 1) {
      this.player.addXp(500);
      this.abilities.unlockAbility('fireball');
      setTimeout(() => {
        this.transitionToRealm(2);
      }, 4000);
    } else if (realmId === 2) {
      this.player.addXp(1000);
      this.abilities.unlockAbility('lightning');
      setTimeout(() => {
        this.transitionToRealm(3);
      }, 4000);
    } else if (realmId === 3) {
      this.player.addXp(2000);
      this.abilities.unlockAbility('nova');
      setTimeout(() => {
        this.handleGameVictory();
      }, 3500);
    }
  }

  // =========================================================================
  // SURVIVAL & GAME STATES
  // =========================================================================

  handleGameOver() {
    this.isGameOver = true;
    this.isRunning = false;
    if (document.exitPointerLock) document.exitPointerLock();

    const screen = document.getElementById('game-over-screen');
    if (screen) screen.classList.remove('hidden');
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
    this.canvas.requestPointerLock();

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
    if (this.isGameOver || this.isVictory) return;

    this.isPaused = !this.isPaused;
    const pauseMenu = document.getElementById('pause-menu');

    if (this.isPaused) {
      if (document.exitPointerLock) document.exitPointerLock();
      if (pauseMenu) pauseMenu.classList.remove('hidden');
    } else {
      if (pauseMenu) pauseMenu.classList.add('hidden');
      this.canvas.requestPointerLock();
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

    if (this.isRunning && !this.isPaused && !this.isGameOver && !this.isVictory) {
      // 1. Day / Night atmosphere & orbital lighting
      if (this.dayNight) this.dayNight.update(delta);

      // 2. Update Player & 3D Third-Person Character
      this.player.update(delta);
      if (this.character) this.character.update(delta, this.player);

      // 3. Update World props & animations
      this.world.update(delta);

      // 4. Update Abilities & Projectiles
      this.abilities.update(delta);

      // 5. Update Enemies & 3D Bosses
      this.enemies.update(delta, this.player);
      if (this.bosses) this.bosses.update(delta, this.player);

      // 6. Update Proximity Interactions
      this.updateInteractions();

      // 7. Update HUD Stats & Cooldowns
      if (window.interfaceManager) {
        window.interfaceManager.updatePlayerStatsUI();
        window.interfaceManager.updateAbilityCooldowns();
      }
    }

    // Render Scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

window.GameEngine = GameEngine;

