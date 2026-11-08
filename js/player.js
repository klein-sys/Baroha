/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * First-Person Player Controller, 3D Viewmodel, Combat, and Survival Systems
 */

class PlayerController {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    // Position, velocity, and physics
    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.pitch = 0; // vertical camera rotation (X-axis)
    this.yaw = 0;   // horizontal camera rotation (Y-axis)
    this.isGrounded = false;
    this.height = 1.8;
    this.radius = 0.5;

    // Movement attributes
    this.walkSpeed = 8.0;
    this.sprintSpeed = 14.0;
    this.jumpForce = 9.0;
    this.gravity = 24.0;

    // Survival and RPG attributes
    this.name = 'Arcane Guardian';
    this.level = 1;
    this.rankTitle = 'Novice Adventurer';
    this.xp = 0;
    this.xpNeeded = 250;
    this.maxHearts = 5;
    this.hearts = 5;
    this.maxHp = 100;
    this.hp = 100;
    this.maxMana = 100;
    this.mana = 100;
    this.manaRegenRate = 6.0; // per second
    this.attackPower = 35;
    this.isBlocking = false;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;

    // Movement input states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false
    };

    // Mobile touch inputs
    this.touchMoveVector = { x: 0, y: 0 };
    this.isPointerLocked = false;

    // 3D Viewmodel (First-Person Runeblade Sword & Arcane Hand)
    this.viewmodelRoot = new THREE.Group();
    this.swordMesh = null;
    this.swordTrail = null;
    this.isAttacking = false;
    this.attackProgress = 0;
    this.attackDuration = 0.35; // seconds
    this.attackCooldown = 0;

    // Current equipped weapon
    this.equippedWeapon = {
      name: 'Magical Runeblade',
      type: 'sword',
      damage: 35,
      reach: 3.5
    };

    // Checkpoint
    this.checkpointPosition = new THREE.Vector3(0, 2, 0);

    // Build the 3D first-person weapon model
    this.createViewmodel();

    // Hook inputs
    this.setupInputs();
  }

  createViewmodel() {
    // Parent the viewmodel to the camera so it follows the player's view
    this.camera.add(this.viewmodelRoot);

    // --- RUNEBLADE SWORD (Right Hand) ---
    const swordGroup = new THREE.Group();
    swordGroup.position.set(0.38, -0.32, -0.6);
    swordGroup.rotation.set(0.1, -0.2, 0);

    // Blade
    const bladeGeom = new THREE.BoxGeometry(0.04, 0.75, 0.015);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x334466,
      emissiveIntensity: 0.2
    });
    const blade = new THREE.Mesh(bladeGeom, bladeMat);
    blade.position.y = 0.45;
    swordGroup.add(blade);

    // Glowing Rune Core on Blade
    const runeGeom = new THREE.BoxGeometry(0.015, 0.5, 0.02);
    const runeMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
    const rune = new THREE.Mesh(runeGeom, runeMat);
    rune.position.y = 0.45;
    swordGroup.add(rune);

    // Crossguard
    const guardGeom = new THREE.BoxGeometry(0.24, 0.03, 0.05);
    const guardMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Gold
      metalness: 0.8,
      roughness: 0.3
    });
    const guard = new THREE.Mesh(guardGeom, guardMat);
    guard.position.y = 0.08;
    swordGroup.add(guard);

    // Hilt / Grip
    const hiltGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8);
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.8 });
    const hilt = new THREE.Mesh(hiltGeom, hiltMat);
    hilt.position.y = -0.02;
    swordGroup.add(hilt);

    // Pommel (Ruby Gem)
    const pommelGeom = new THREE.SphereGeometry(0.035, 8, 8);
    const pommelMat = new THREE.MeshStandardMaterial({
      color: 0xe63946,
      emissive: 0xe63946,
      emissiveIntensity: 0.5
    });
    const pommel = new THREE.Mesh(pommelGeom, pommelMat);
    pommel.position.y = -0.12;
    swordGroup.add(pommel);

    this.swordMesh = swordGroup;
    this.viewmodelRoot.add(this.swordMesh);

    // --- ARCANE FOCUS HAND / ORB (Left Hand) ---
    const orbGroup = new THREE.Group();
    orbGroup.position.set(-0.38, -0.35, -0.55);

    const orbGeom = new THREE.SphereGeometry(0.06, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({
      color: 0x7209b7,
      transparent: true,
      opacity: 0.85
    });
    const orb = new THREE.Mesh(orbGeom, orbMat);
    orbGroup.add(orb);

    // Outer magical ring
    const ringGeom = new THREE.RingGeometry(0.09, 0.11, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    orbGroup.add(ring);
    this.manaOrbMesh = orbGroup;
    this.viewmodelRoot.add(this.manaOrbMesh);
  }

  setupInputs() {
    // Keyboard down
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'KeyW': case 'ArrowUp':
          this.keys.forward = true; break;
        case 'KeyS': case 'ArrowDown':
          this.keys.backward = true; break;
        case 'KeyA': case 'ArrowLeft':
          this.keys.left = true; break;
        case 'KeyD': case 'ArrowRight':
          this.keys.right = true; break;
        case 'ShiftLeft': case 'ShiftRight':
          this.keys.sprint = true; break;
        case 'Space':
          this.keys.jump = true; break;
        case 'KeyE': case 'KeyF':
          if (window.game) window.game.handleInteract();
          break;
        case 'KeyQ':
          if (window.game) window.game.castEquippedAbility();
          break;
        case 'KeyI':
          if (window.interfaceManager) window.interfaceManager.toggleInventory();
          break;
        case 'Tab':
          e.preventDefault();
          if (window.interfaceManager) window.interfaceManager.toggleQuestJournal();
          break;
        case 'KeyC':
          if (window.interfaceManager) window.interfaceManager.toggleCharacterStatus();
          break;
        case 'KeyM':
          if (window.interfaceManager) window.interfaceManager.toggleCalculusCodex();
          break;
        case 'KeyH':
          if (window.interfaceManager) window.interfaceManager.toggleControlsModal();
          break;
        case 'KeyO':
          if (window.interfaceManager) window.interfaceManager.toggleSettingsModal();
          break;
        case 'Digit1':
          if (window.abilitiesManager) window.abilitiesManager.selectAbility(0);
          break;
        case 'Digit2':
          if (window.abilitiesManager) window.abilitiesManager.selectAbility(1);
          break;
        case 'Digit3':
          if (window.abilitiesManager) window.abilitiesManager.selectAbility(2);
          break;
        case 'Digit4':
          if (window.abilitiesManager) window.abilitiesManager.selectAbility(3);
          break;
        case 'Digit5':
          if (window.abilitiesManager) window.abilitiesManager.selectAbility(4);
          break;
        case 'Digit6':
          if (window.abilitiesManager) window.abilitiesManager.selectAbility(5);
          break;
        case 'Backquote': case 'F1':
          e.preventDefault();
          if (window.devConsoleManager) window.devConsoleManager.toggle();
          break;
        case 'Escape': case 'KeyP':
          if (window.game) window.game.togglePause();
          break;
      }
    });

    // Keyboard up
    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':
          this.keys.forward = false; break;
        case 'KeyS': case 'ArrowDown':
          this.keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft':
          this.keys.left = false; break;
        case 'KeyD': case 'ArrowRight':
          this.keys.right = false; break;
        case 'ShiftLeft': case 'ShiftRight':
          this.keys.sprint = false; break;
        case 'Space':
          this.keys.jump = false; break;
      }
    });

    // Mouse Look (Pointer Lock)
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('click', () => {
      if (!this.isPointerLocked && (!window.game || !window.game.isPaused)) {
        canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === canvas);
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;

      const baseSens = 0.0022;
      const multiplier = (window.settingsManager && window.settingsManager.settings.controls.mouseSensitivity) || 1.0;
      const invertY = (window.settingsManager && window.settingsManager.settings.controls.invertY) ? -1 : 1;

      this.yaw -= e.movementX * baseSens * multiplier;
      this.pitch -= e.movementY * baseSens * multiplier * invertY;

      // Clamp vertical look between -85 and +85 degrees
      this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
    });

    // Mouse Click (LMB Attack, RMB Block)
    canvas.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked) return;
      if (e.button === 0) {
        // LMB: Attack
        this.performAttack();
      } else if (e.button === 2) {
        // RMB: Block
        this.isBlocking = true;
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.isBlocking = false;
      }
    });

    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  performAttack() {
    if (this.attackCooldown > 0 || this.isAttacking) return;
    this.isAttacking = true;
    this.attackProgress = 0;
    this.attackCooldown = 0.4;

    // Play sword slash SFX
    if (window.soundEngine) window.soundEngine.playSwordSlash();

    // Trigger 3D character attack animation
    if (window.game && window.game.character) {
      window.game.character.triggerAttack('basic');
    }

    // Perform melee raycast against enemies in front
    if (window.game) {
      window.game.checkMeleeHit(this.equippedWeapon.damage, this.equippedWeapon.reach);
    }
  }

  takeDamage(amount) {
    if (this.isInvulnerable) return;

    // If player is blocking, mitigate 60% of damage
    let finalDamage = amount;
    if (this.isBlocking) {
      finalDamage = Math.round(amount * 0.4);
      if (window.soundEngine) window.soundEngine.playSwordHit();
    } else {
      if (window.soundEngine) window.soundEngine.playPlayerDamage();
    }

    this.hp -= finalDamage;

    // Trigger visual feedback (red vignette)
    const vig = document.getElementById('damage-vignette');
    if (vig) {
      vig.classList.add('active');
      setTimeout(() => vig.classList.remove('active'), 250);
    }

    // Floating combat text
    if (window.interfaceManager) {
      window.interfaceManager.showFloatingText(`-${finalDamage}`, this.position, 'damage');
    }

    // Brief invulnerability frame
    this.isInvulnerable = true;
    this.invulnerabilityTimer = 0.6;

    // Check if HP reached zero
    if (this.hp <= 0) {
      this.loseHeart();
    }
  }

  loseHeart() {
    this.hearts = Math.max(0, this.hearts - 1);
    if (window.soundEngine) window.soundEngine.playHeartLost();

    if (window.interfaceManager) {
      window.interfaceManager.updateHeartsUI(this.hearts);
      window.interfaceManager.showToast('CRITICAL: 1 HEART LOST!', 'error');
    }

    if (this.hearts <= 0) {
      // Game Over
      if (window.game) window.game.handleGameOver();
    } else {
      // Respawn at realm checkpoint
      this.respawnAtCheckpoint();
    }
  }

  restoreHeart(count = 1) {
    this.hearts = Math.min(this.maxHearts, this.hearts + count);
    if (window.interfaceManager) {
      window.interfaceManager.updateHeartsUI(this.hearts);
      window.interfaceManager.showToast(`+${count} GOLDEN HEART RESTORED!`, 'success');
    }
  }

  heal(amount) {
    const oldHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const restored = this.hp - oldHp;
    if (restored > 0 && window.interfaceManager) {
      window.interfaceManager.showFloatingText(`+${restored} HP`, this.position, 'heal');
    }
  }

  restoreMana(amount) {
    const oldMp = this.mana;
    this.mana = Math.min(this.maxMana, this.mana + amount);
    const restored = this.mana - oldMp;
    if (restored > 0 && window.interfaceManager) {
      window.interfaceManager.showFloatingText(`+${restored} MP`, this.position, 'mana');
    }
  }

  addXp(amount) {
    this.xp += amount;
    if (window.interfaceManager) {
      window.interfaceManager.showFloatingText(`+${amount} XP`, this.position, 'crit');
      window.interfaceManager.showToast(`Gained +${amount} Experience!`, 'info');
    }

    // Level up check
    while (this.xp >= this.xpNeeded) {
      this.levelUp();
    }
  }

  levelUp() {
    this.xp -= this.xpNeeded;
    this.level += 1;
    this.xpNeeded = Math.round(this.xpNeeded * 1.6);
    this.maxHp += 25;
    this.hp = this.maxHp;
    this.maxMana += 20;
    this.mana = this.maxMana;
    this.attackPower += 10;
    this.equippedWeapon.damage += 10;

    // Update titles based on level
    if (this.level === 2) {
      this.rankTitle = 'Apprentice Mage';
      if (window.abilitiesManager) window.abilitiesManager.unlockAbility('fireball');
    } else if (this.level === 3) {
      this.rankTitle = 'Lich Hunter';
      if (window.abilitiesManager) window.abilitiesManager.unlockAbility('lightning');
    } else if (this.level >= 4) {
      this.rankTitle = 'Legendary Guardian';
      if (window.abilitiesManager) window.abilitiesManager.unlockAbility('nova');
    }

    if (window.soundEngine) window.soundEngine.playLevelUp();
    if (window.interfaceManager) {
      window.interfaceManager.showToast(`LEVEL UP! You are now Level ${this.level} (${this.rankTitle})!`, 'success');
      window.interfaceManager.updatePlayerStatsUI();
    }
  }

  setCheckpoint(pos) {
    this.checkpointPosition.copy(pos);
  }

  respawnAtCheckpoint() {
    this.position.copy(this.checkpointPosition);
    this.position.y += 1.5;
    this.velocity.set(0, 0, 0);
    this.hp = this.maxHp;
    this.mana = this.maxMana;
    this.isInvulnerable = true;
    this.invulnerabilityTimer = 2.0; // 2 seconds grace period
    if (window.interfaceManager) {
      window.interfaceManager.showToast('Respawned at Sanctuary Checkpoint.', 'info');
    }
  }

  update(delta) {
    // Regenerate mana slowly
    if (this.mana < this.maxMana) {
      this.mana = Math.min(this.maxMana, this.mana + this.manaRegenRate * delta);
    }

    // Attack cooldown timers
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    // Invulnerability timer
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= delta;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // --- MOVEMENT PHYSICS ---
    const moveSpeed = this.keys.sprint ? this.sprintSpeed : this.walkSpeed;
    const moveDir = new THREE.Vector3();

    // Calculate forward & right vectors based on yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    // Keyboard inputs
    if (this.keys.forward) moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.right) moveDir.add(right);
    if (this.keys.left) moveDir.sub(right);

    // Mobile touch joystick
    if (this.touchMoveVector.x !== 0 || this.touchMoveVector.y !== 0) {
      moveDir.addScaledVector(right, this.touchMoveVector.x);
      moveDir.addScaledVector(forward, -this.touchMoveVector.y);
    }

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      this.velocity.x = moveDir.x * moveSpeed;
      this.velocity.z = moveDir.z * moveSpeed;
    } else {
      // Decelerate smoothly
      this.velocity.x *= 0.75;
      this.velocity.z *= 0.75;
    }

    // Jump
    if (this.keys.jump && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    // Apply gravity
    this.velocity.y -= this.gravity * delta;

    // Integrate position
    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.position.z += this.velocity.z * delta;

    // Ground collision test (simple floor at y = 1.8 or world height)
    let groundHeight = 1.8;
    if (window.game && window.game.world) {
      groundHeight = window.game.world.getTerrainHeight(this.position.x, this.position.z) + this.height;
    }

    if (this.position.y <= groundHeight) {
      this.position.y = groundHeight;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Update Camera position and rotation (only if in First-Person mode)
    if (!window.robloxCharacter || window.robloxCharacter.cameraMode === 'first_person') {
      this.camera.position.copy(this.position);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    }

    // --- ANIMATE FIRST-PERSON VIEWMODEL ---
    if (!window.robloxCharacter || window.robloxCharacter.cameraMode === 'first_person') {
      this.updateViewmodel(delta);
    }
  }

  updateViewmodel(delta) {
    if (!this.swordMesh) return;

    // Arcane mana orb idle breathing & rotation
    if (this.manaOrbMesh) {
      this.manaOrbMesh.rotation.z += 1.5 * delta;
      this.manaOrbMesh.rotation.x += 0.8 * delta;
      const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.08;
      this.manaOrbMesh.scale.set(pulse, pulse, pulse);
    }

    // Sword idle breathing sway
    const time = Date.now() * 0.003;
    const idleX = Math.sin(time) * 0.015;
    const idleY = Math.cos(time * 1.5) * 0.01;

    if (this.isBlocking) {
      // Raise sword horizontally for blocking
      this.swordMesh.position.set(0.15, -0.15, -0.45);
      this.swordMesh.rotation.set(0.6, -0.8, 1.2);
    } else if (this.isAttacking) {
      // Slash animation swing
      this.attackProgress += delta / this.attackDuration;

      if (this.attackProgress < 0.3) {
        // Wind-up: pull back up right
        const t = this.attackProgress / 0.3;
        this.swordMesh.position.set(0.45 + t * 0.1, -0.2 + t * 0.15, -0.5);
        this.swordMesh.rotation.set(0.3 - t * 0.4, -0.3 + t * 0.2, -0.2);
      } else if (this.attackProgress < 0.7) {
        // Swing forward and down diagonal slash
        const t = (this.attackProgress - 0.3) / 0.4;
        this.swordMesh.position.set(0.55 - t * 0.85, -0.05 - t * 0.4, -0.65);
        this.swordMesh.rotation.set(-0.1 + t * 1.4, -0.1 - t * 1.2, -0.2 + t * 1.6);
      } else if (this.attackProgress < 1.0) {
        // Recovery back to rest position
        const t = (this.attackProgress - 0.7) / 0.3;
        this.swordMesh.position.set(-0.3 + t * 0.68, -0.45 + t * 0.13, -0.65 + t * 0.05);
        this.swordMesh.rotation.set(1.3 - t * 1.2, -1.3 + t * 1.1, 1.4 - t * 1.4);
      } else {
        this.isAttacking = false;
        this.attackProgress = 0;
      }
    } else {
      // Rest / Idle position
      this.swordMesh.position.set(0.38 + idleX, -0.32 + idleY, -0.6);
      this.swordMesh.rotation.set(0.1, -0.2, 0);
    }
  }
}

window.PlayerController = PlayerController;

