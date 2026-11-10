/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * Magical Abilities & Projectiles Engine
 */

class AbilitiesManager {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = [];
    this.activeSpells = [];

    // Registered abilities
    this.abilities = [
      {
        id: 'bolt',
        name: 'Magic Bolt',
        icon: '🔮',
        key: '1',
        manaCost: 10,
        cooldown: 0.8,
        timer: 0,
        unlocked: true,
        damage: 30,
        desc: 'Fires an arcane projectile with concentrated mathematical energy.'
      },
      {
        id: 'fireball',
        name: 'Fireball',
        icon: '🔥',
        key: '2',
        manaCost: 25,
        cooldown: 3.0,
        timer: 0,
        unlocked: false, // Unlocked after Witch
        damage: 65,
        desc: 'Hurls an explosive sphere of arcane flame, dealing heavy area damage.'
      },
      {
        id: 'lightning',
        name: 'Lightning Strike',
        icon: '⚡',
        key: '3',
        manaCost: 35,
        cooldown: 5.0,
        timer: 0,
        unlocked: false, // Unlocked after Lich
        damage: 95,
        desc: 'Calls down thunderbolts from the celestial heavens.'
      },
      {
        id: 'shield',
        name: 'Magical Shield',
        icon: '🛡️',
        key: '4',
        manaCost: 25,
        cooldown: 9.0,
        timer: 0,
        unlocked: true,
        damage: 0,
        desc: 'Summons an invulnerable forcefield absorbing all damage for 5 seconds.'
      },
      {
        id: 'heal',
        name: 'Healing Aura',
        icon: '✨',
        key: '5',
        manaCost: 30,
        cooldown: 12.0,
        timer: 0,
        unlocked: true,
        damage: 0,
        desc: 'Restores 40 Health through harmonic equilibrium.'
      },
      {
        id: 'nova',
        name: 'Eternal Nova',
        icon: '🌌',
        key: 'Q',
        manaCost: 50,
        cooldown: 14.0,
        timer: 0,
        unlocked: false, // Level 3 ultimate
        damage: 150,
        desc: 'Cataclysmic cosmic burst banishing all corrupted entities in range.'
      }
    ];

    this.selectedAbilityIndex = 0; // default Magic Bolt
  }

  unlockAbility(id) {
    const ability = this.abilities.find(a => a.id === id);
    if (ability && !ability.unlocked) {
      ability.unlocked = true;
      if (window.soundEngine) window.soundEngine.playLevelUp();
      if (window.interfaceManager) {
        window.interfaceManager.showToast(`NEW ABILITY UNLOCKED: ${ability.name}!`, 'success');
        window.interfaceManager.renderAbilityDock();
      }
    }
  }

  selectAbility(index) {
    if (index >= 0 && index < this.abilities.length) {
      if (this.abilities[index].unlocked) {
        this.selectedAbilityIndex = index;
        if (window.interfaceManager) window.interfaceManager.updateSelectedAbility(index);
      }
    }
  }

  getSelectedAbility() {
    return this.abilities[this.selectedAbilityIndex];
  }

  castAbility(player, abilityIndex = this.selectedAbilityIndex) {
    const ability = this.abilities[abilityIndex];
    if (!ability || !ability.unlocked) return;

    if (ability.timer > 0) {
      if (window.interfaceManager) window.interfaceManager.showToast('Ability is on cooldown!', 'warning');
      return;
    }

    if (player.mana < ability.manaCost) {
      if (window.interfaceManager) window.interfaceManager.showToast('Not enough Mana!', 'warning');
      return;
    }

    // Deduct mana & apply cooldown
    player.mana -= ability.manaCost;
    ability.timer = ability.cooldown;

    // Execute ability effects
    switch (ability.id) {
      case 'bolt':
        this.spawnMagicBolt(player);
        break;
      case 'fireball':
        this.spawnFireball(player);
        break;
      case 'lightning':
        this.castLightning(player);
        break;
      case 'shield':
        this.castMagicalShield(player);
        break;
      case 'heal':
        this.castHealingAura(player);
        break;
      case 'nova':
        this.castEternalNova(player);
        break;
    }

    if (window.interfaceManager) window.interfaceManager.updatePlayerStatsUI();
  }

  // --- 1. MAGIC BOLT (with small-angle aiming assist: lim theta->0 sin(theta)/theta = 1) ---
  spawnMagicBolt(player) {
    if (window.soundEngine) window.soundEngine.playMagicBolt();

    let forward = new THREE.Vector3(-Math.sin(player.yaw), Math.sin(player.pitch), -Math.cos(player.yaw)).normalize();
    const spawnPos = player.position.clone().add(new THREE.Vector3(0, -0.2, 0)).addScaledVector(forward, 0.8);

    // Apply Calculus Small-Angle Aim Assist: lim theta->0 [sin(theta)/theta] = 1
    if (window.game && window.game.enemies && window.calculusEngine) {
      let closestEnemy = null;
      let minAngle = 0.35; // ~20 degrees cone
      window.game.enemies.enemies.forEach(e => {
        if (!e.isDead && e.mesh) {
          const toEnemy = e.mesh.position.clone().sub(spawnPos).normalize();
          const angle = forward.angleTo(toEnemy);
          if (angle < minAngle) {
            minAngle = angle;
            closestEnemy = e;
          }
        }
      });
      if (closestEnemy) {
        // Evaluate limit assist factor
        const assistRatio = window.calculusEngine.smallAngleLimit(minAngle);
        const toEnemy = closestEnemy.mesh.position.clone().sub(spawnPos).normalize();
        // Blend trajectory smoothly by assist ratio (as error theta -> 0, assist reaches 1.0)
        forward.lerp(toEnemy, 0.45 * assistRatio).normalize();
      }
    }

    const geom = new THREE.SphereGeometry(0.18, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(spawnPos);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh: mesh,
      velocity: forward.clone().multiplyScalar(28.0),
      radius: 0.3,
      damage: 30,
      type: 'bolt',
      lifetime: 3.0,
      fromPlayer: true
    });
  }

  // --- 2. FIREBALL ---
  spawnFireball(player) {
    if (window.soundEngine) window.soundEngine.playFireball();

    const forward = new THREE.Vector3(-Math.sin(player.yaw), Math.sin(player.pitch), -Math.cos(player.yaw)).normalize();
    const spawnPos = player.position.clone().add(new THREE.Vector3(0, -0.2, 0)).addScaledVector(forward, 0.8);

    const geom = new THREE.SphereGeometry(0.35, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(spawnPos);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh: mesh,
      velocity: forward.clone().multiplyScalar(22.0),
      radius: 0.6,
      damage: 65,
      aoeRadius: 4.5,
      type: 'fireball',
      lifetime: 3.5,
      fromPlayer: true
    });
  }

  // --- 3. LIGHTNING STRIKE ---
  castLightning(player) {
    if (window.soundEngine) window.soundEngine.playLightning();

    // Raycast forward to find ground impact
    const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw)).normalize();
    const targetPos = player.position.clone().addScaledVector(forward, 8.0);
    targetPos.y = (window.game && window.game.world) ? window.game.world.getTerrainHeight(targetPos.x, targetPos.z) : 0;

    // Visual lightning pillar
    const geom = new THREE.CylinderGeometry(0.4, 0.4, 30, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.9 });
    const bolt = new THREE.Mesh(geom, mat);
    bolt.position.set(targetPos.x, targetPos.y + 15, targetPos.z);
    this.scene.add(bolt);

    setTimeout(() => {
      this.scene.remove(bolt);
      geom.dispose();
      mat.dispose();
    }, 250);

    // Damage enemies near target
    if (window.game) {
      window.game.dealAoeDamage(targetPos, 5.0, 95);
    }
  }

  // --- 4. MAGICAL SHIELD ---
  castMagicalShield(player) {
    if (window.soundEngine) window.soundEngine.playShield();
    player.isInvulnerable = true;
    player.invulnerabilityTimer = 5.0;

    if (window.interfaceManager) {
      window.interfaceManager.showToast('MAGICAL SHIELD ACTIVATED! (Invulnerable for 5s)', 'info');
    }
  }

  // --- 5. HEALING AURA ---
  castHealingAura(player) {
    if (window.soundEngine) window.soundEngine.playHeal();
    player.heal(40);
    if (window.interfaceManager) {
      window.interfaceManager.showToast('+40 HP Restored!', 'success');
    }
  }

  // --- 6. ETERNAL NOVA ---
  castEternalNova(player) {
    if (window.soundEngine) window.soundEngine.playLightning();

    // Large expanding ring
    const geom = new THREE.RingGeometry(0.5, 2.5, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0x7209b7, side: THREE.DoubleSide });
    const novaMesh = new THREE.Mesh(geom, mat);
    novaMesh.rotation.x = Math.PI / 2;
    novaMesh.position.copy(player.position);
    this.scene.add(novaMesh);

    let scale = 1;
    const interval = setInterval(() => {
      scale += 3.5;
      novaMesh.scale.set(scale, scale, scale);
      if (scale > 25) {
        clearInterval(interval);
        this.scene.remove(novaMesh);
        geom.dispose();
        mat.dispose();
      }
    }, 30);

    // Blast all enemies in 25 unit radius
    if (window.game) {
      window.game.dealAoeDamage(player.position, 25.0, 150);
    }
  }

  _disposeProjectile(p) {
    if (!p || !p.mesh) return;
    this.scene.remove(p.mesh);
    if (p.mesh.geometry) p.mesh.geometry.dispose();
    if (p.mesh.material) p.mesh.material.dispose();
  }

  update(delta) {
    // Update ability cooldown timers
    this.abilities.forEach(ability => {
      if (ability.timer > 0) {
        ability.timer = Math.max(0, ability.timer - delta);
      }
    });

    const world = window.game?.world;

    // Update active projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime -= delta;

      p.mesh.position.addScaledVector(p.velocity, delta);

      // Check collision with walls, houses, closed doors, pillars
      let hit = false;
      if (world && world.checkProjectileColliderHit && world.checkProjectileColliderHit(p.mesh.position, p.radius)) {
        hit = true;
      }

      // Check collision with enemies/player
      if (!hit && p.fromPlayer && window.game) {
        hit = window.game.checkProjectileHitEnemy(p);
      } else if (!hit && !p.fromPlayer && window.game) {
        hit = window.game.checkProjectileHitPlayer(p);
      }

      if (hit || p.lifetime <= 0) {
        this._disposeProjectile(p);
        this.projectiles.splice(i, 1);
      }
    }
  }

  clearAllProjectiles() {
    this.projectiles.forEach(p => this._disposeProjectile(p));
    this.projectiles = [];
  }
}

window.AbilitiesManager = AbilitiesManager;

