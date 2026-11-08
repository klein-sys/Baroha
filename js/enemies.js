/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * Enemy AI, Wave Spawning, and Boss Combat Systems
 */

class EnemiesManager {
  constructor(scene) {
    this.scene = scene;
    this.enemies = [];
    this.nightEnemies = [];
    this.activeBoss = null;
    this.isBossActive = false;
    this.bossPhase = 1;
    this.bossMaxHp = 300;
    this.bossHp = 300;
    this.bossQuestionTimer = 0;
  }

  clearEnemies() {
    this.enemies.forEach(e => {
      if (e.mesh) this.scene.remove(e.mesh);
    });
    this.enemies = [];

    this.despawnNightMonsters();

    if (window.bossesManager) {
      window.bossesManager.clearBoss();
    } else if (this.activeBoss && this.activeBoss.mesh) {
      this.scene.remove(this.activeBoss.mesh);
      this.activeBoss = null;
    }
    this.isBossActive = false;
  }

  spawnNightMonsters() {
    this.despawnNightMonsters();

    // Spawn 4 fierce night stalkers around player
    const spawnOffsets = [
      { x: -22, z: 15, name: 'Night Terror Stalker', hp: 95, pwr: 24, type: 'wolf' },
      { x: 25, z: -10, name: 'Blood Moon Beast', hp: 110, pwr: 26, type: 'wolf' },
      { x: -15, z: -25, name: 'Nightmare Wraith', hp: 85, pwr: 22, type: 'phantom' },
      { x: 18, z: 25, name: 'Dread Stalker', hp: 90, pwr: 20, type: 'imp' }
    ];

    spawnOffsets.forEach(spec => {
      const enemy = this.spawnEnemy(spec.type, spec.x, spec.z, spec.name, spec.hp, spec.pwr);
      if (enemy) {
        enemy.isNightSpawn = true;
        this.nightEnemies.push(enemy);
      }
    });
  }

  despawnNightMonsters() {
    this.nightEnemies.forEach(e => {
      if (e.mesh) this.scene.remove(e.mesh);
      const idx = this.enemies.indexOf(e);
      if (idx !== -1) this.enemies.splice(idx, 1);
    });
    this.nightEnemies = [];
  }

  spawnMinionsForRealm(realmId) {
    this.clearEnemies();

    switch (realmId) {
      case 1:
        // Forest Imps & Shadow Wolves
        this.spawnEnemy('imp', -15, 12, 'Corrupted Forest Imp', 45, 12);
        this.spawnEnemy('imp', 18, -14, 'Corrupted Forest Imp', 45, 12);
        this.spawnEnemy('wolf', 8, 20, 'Shadow Wolf', 65, 18);
        this.spawnEnemy('wolf', -20, -18, 'Shadow Wolf', 65, 18);
        break;
      case 2:
        // Undead Scholars & Knights
        this.spawnEnemy('scholar', -10, 8, 'Skeleton Scholar', 75, 16);
        this.spawnEnemy('scholar', 12, 10, 'Skeleton Scholar', 75, 16);
        this.spawnEnemy('knight', 0, -14, 'Undead Knight', 110, 22);
        this.spawnEnemy('mage', -16, -18, 'Phantom Mage', 90, 20);
        break;
      case 3:
        // Dimensional Phantoms
        this.spawnEnemy('phantom', -12, 8, 'Dimensional Phantom', 120, 24);
        this.spawnEnemy('phantom', 14, -6, 'Dimensional Phantom', 120, 24);
        this.spawnEnemy('phantom', 0, 16, 'Infinity Voidling', 100, 20);
        break;
    }
  }

  spawnEnemy(type, x, z, name, hp, attackPower) {
    const groundY = (window.game && window.game.world) ? window.game.world.getTerrainHeight(x, z) : 0;
    const group = new THREE.Group();
    group.position.set(x, groundY, z);

    let matColor = 0xff3344;
    let geom = new THREE.BoxGeometry(0.8, 1.4, 0.8);

    if (type === 'imp') {
      matColor = 0x9b5de5;
      geom = new THREE.SphereGeometry(0.5, 8, 8);
    } else if (type === 'wolf') {
      matColor = 0x3a0ca3;
      geom = new THREE.BoxGeometry(0.7, 0.7, 1.4);
    } else if (type === 'scholar') {
      matColor = 0x06d6a0;
      geom = new THREE.CylinderGeometry(0.35, 0.45, 1.6, 8);
    } else if (type === 'knight') {
      matColor = 0x555566;
      geom = new THREE.BoxGeometry(0.9, 1.8, 0.6);
    } else if (type === 'phantom') {
      matColor = 0x7209b7;
      geom = new THREE.OctahedronGeometry(0.7);
    }

    const mat = new THREE.MeshStandardMaterial({
      color: matColor,
      roughness: 0.6,
      metalness: 0.3
    });
    const body = new THREE.Mesh(geom, mat);
    body.position.y = 0.9;
    group.add(body);

    // Glowing Eyes
    const eyeGeom = new THREE.SphereGeometry(0.08, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
    eyeL.position.set(-0.2, 1.3, 0.4);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
    eyeR.position.set(0.2, 1.3, 0.4);
    group.add(eyeR);

    this.scene.add(group);

    const enemy = {
      type: type,
      name: name,
      mesh: group,
      position: group.position,
      maxHp: hp,
      hp: hp,
      attackPower: attackPower,
      speed: type === 'wolf' ? 4.5 : 2.5,
      attackCooldown: 1.5,
      attackTimer: 0,
      detectionRadius: 22.0,
      attackRadius: 2.2,
      isDead: false
    };

    this.enemies.push(enemy);
    return enemy;
  }

  // =========================================================================
  // BOSS ENCOUNTERS
  // =========================================================================

  spawnBoss(realmId) {
    if (this.activeBoss && this.activeBoss.mesh) {
      this.scene.remove(this.activeBoss.mesh);
    }

    this.isBossActive = true;
    this.bossPhase = 1;

    let bossData = {};
    let theme = 'witch';
    let objectiveText = 'Defeat The Dark Witch';

    if (window.bossesManager) {
      if (realmId === 1) {
        bossData = window.bossesManager.spawnDarkWitch(0, -45);
        theme = 'witch';
        objectiveText = 'Defeat The Dark Witch';
      } else if (realmId === 2) {
        bossData = window.bossesManager.spawnLich(0, -38);
        theme = 'lich';
        objectiveText = 'Defeat The Lich';
      } else {
        bossData = window.bossesManager.spawnEternalDragon(0, -25);
        theme = 'dragon';
        objectiveText = 'Defeat The Eternal Dragon';
      }
    } else {
      if (realmId === 1) {
        bossData = this.buildWitchBoss();
      } else if (realmId === 2) {
        bossData = this.buildLichBoss();
      } else {
        bossData = this.buildAzraelBoss();
      }
    }

    this.activeBoss = bossData;
    this.bossMaxHp = bossData.maxHp;
    this.bossHp = bossData.maxHp;
    this.bossQuestionTimer = 6.0; // Trigger first calculus trial shortly

    // Play intense boss battle music
    if (window.soundEngine) {
      window.soundEngine.startMusicForRealm(realmId, true);
    }

    // Update Boss UI
    if (window.interfaceManager) {
      const sub = realmId === 1 ? 'Lv. 50' : (realmId === 2 ? 'Lv. 100' : 'Lv. 1000 (Final Boss)');
      window.interfaceManager.showBossBar(bossData.name, sub, 1.0, theme);
      window.interfaceManager.updateRobloxObjective(objectiveText, '0 / 1');
      window.interfaceManager.showToast(`BOSS BATTLE: ${bossData.name} emerges!`, 'error');
    }
  }

  buildWitchBoss() {
    // Morgathia, Keeper of Broken Limits
    const group = new THREE.Group();
    group.position.set(0, 2.5, -45);

    // Robe
    const robeGeom = new THREE.ConeGeometry(1.2, 3.2, 12);
    const robeMat = new THREE.MeshStandardMaterial({ color: 0x240046, roughness: 0.5 });
    const robe = new THREE.Mesh(robeGeom, robeMat);
    robe.position.y = 1.6;
    group.add(robe);

    // Horned Witch Hat
    const hatGeom = new THREE.ConeGeometry(0.8, 1.8, 8);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x10002b });
    const hat = new THREE.Mesh(hatGeom, hatMat);
    hat.position.y = 3.6;
    group.add(hat);

    // Glowing Purple Staff
    const staffGeom = new THREE.CylinderGeometry(0.06, 0.06, 3.8, 8);
    const staffMat = new THREE.MeshStandardMaterial({ color: 0x4a154b, metalness: 0.8 });
    const staff = new THREE.Mesh(staffGeom, staffMat);
    staff.position.set(0.9, 2.0, 0.4);
    group.add(staff);

    // Crystal on staff
    const crystalGeom = new THREE.OctahedronGeometry(0.3);
    const crystalMat = new THREE.MeshBasicMaterial({ color: 0xff006e });
    const crystal = new THREE.Mesh(crystalGeom, crystalMat);
    crystal.position.set(0.9, 3.9, 0.4);
    group.add(crystal);

    this.scene.add(group);

    return {
      realmId: 1,
      name: 'Morgathia, Keeper of Broken Limits',
      mesh: group,
      position: group.position,
      maxHp: 300,
      hp: 300,
      phases: 3,
      attackPower: 25,
      speed: 1.8
    };
  }

  buildLichBoss() {
    // Lich King Vorthak
    const group = new THREE.Group();
    group.position.set(0, 3.0, -38);

    // Towering armored skeleton
    const bodyGeom = new THREE.CylinderGeometry(0.8, 1.0, 3.6, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, metalness: 0.7 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 1.8;
    group.add(body);

    // Horned Crown Skull
    const skullGeom = new THREE.SphereGeometry(0.65, 8, 8);
    const skullMat = new THREE.MeshBasicMaterial({ color: 0x06d6a0 });
    const skull = new THREE.Mesh(skullGeom, skullMat);
    skull.position.y = 3.9;
    group.add(skull);

    // Spectral Ward Shield
    const shieldGeom = new THREE.SphereGeometry(2.6, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x06d6a0,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    const shield = new THREE.Mesh(shieldGeom, shieldMat);
    shield.position.y = 2.0;
    group.add(shield);

    this.scene.add(group);

    return {
      realmId: 2,
      name: 'Vorthak, Summoner of the Undead',
      mesh: group,
      position: group.position,
      maxHp: 450,
      hp: 450,
      phases: 4,
      attackPower: 30,
      speed: 1.5,
      shieldMesh: shield
    };
  }

  buildAzraelBoss() {
    // Azrael, The Eternal Equation
    const group = new THREE.Group();
    group.position.set(0, 5.0, -20);

    // Cosmic Core
    const coreGeom = new THREE.IcosahedronGeometry(2.2, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xff0054,
      emissive: 0x7209b7,
      roughness: 0.2,
      metalness: 0.8
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    group.add(core);

    // Orbiting Golden Equation Rings
    const ring1Geom = new THREE.TorusGeometry(3.6, 0.15, 12, 32);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    group.add(ring1);

    const ring2Geom = new THREE.TorusGeometry(4.2, 0.15, 12, 32);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
    const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2.rotation.x = Math.PI / 2;
    group.add(ring2);

    this.scene.add(group);

    return {
      realmId: 3,
      name: 'AZRAEL, THE ETERNAL EQUATION',
      mesh: group,
      position: group.position,
      maxHp: 650,
      hp: 650,
      phases: 4,
      attackPower: 40,
      speed: 1.2,
      ring1: ring1,
      ring2: ring2
    };
  }

  damageBoss(damage) {
    if (!this.activeBoss) return;

    this.bossHp = Math.max(0, this.bossHp - damage);
    const hpRatio = this.bossHp / this.bossMaxHp;

    if (window.soundEngine) window.soundEngine.playSwordHit();

    // Floating text
    if (window.interfaceManager) {
      window.interfaceManager.showFloatingText(`-${damage}`, this.activeBoss.position, 'crit');
      window.interfaceManager.updateBossHealth(this.bossHp, this.bossMaxHp, hpRatio);
    }

    // Check boss phase transition
    if (this.bossHp > 0) {
      const prevPhase = this.bossPhase;
      if (hpRatio < 0.33) {
        this.bossPhase = 3;
      } else if (hpRatio < 0.66) {
        this.bossPhase = 2;
      }

      if (this.bossPhase !== prevPhase && window.interfaceManager) {
        window.interfaceManager.updateBossPhase(`PHASE ${this.bossPhase === 2 ? 'II' : 'III'}`);
        window.interfaceManager.showToast(`${this.activeBoss.name} shifts into Phase ${this.bossPhase}!`, 'warning');
      }
    } else {
      // Boss defeated!
      this.handleBossDefeat();
    }
  }

  handleBossDefeat() {
    const boss = this.activeBoss;
    this.isBossActive = false;
    if (boss.mesh) this.scene.remove(boss.mesh);

    if (window.soundEngine) window.soundEngine.playLevelUp();
    if (window.interfaceManager) {
      window.interfaceManager.hideBossBar();
      window.interfaceManager.showToast(`VICTORY! ${boss.name} has been vanquished!`, 'success');
    }

    if (window.game) {
      window.game.handleBossDefeated(boss.realmId);
    }
  }

  update(delta, player) {
    // Update basic enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.isDead) continue;

      const toPlayer = player.position.clone().sub(enemy.position);
      const dist = toPlayer.length();

      // Look at player
      enemy.mesh.lookAt(player.position.x, enemy.mesh.position.y, player.position.z);

      if (dist < enemy.detectionRadius && dist > enemy.attackRadius) {
        // Move towards player
        toPlayer.y = 0;
        toPlayer.normalize();
        enemy.position.addScaledVector(toPlayer, enemy.speed * delta);
        if (window.game && window.game.world) {
          enemy.position.y = window.game.world.getTerrainHeight(enemy.position.x, enemy.position.z);
        }
      } else if (dist <= enemy.attackRadius) {
        // Attack player
        enemy.attackTimer -= delta;
        if (enemy.attackTimer <= 0) {
          enemy.attackTimer = enemy.attackCooldown;
          player.takeDamage(enemy.attackPower);
        }
      }
    }

    // Update Boss AI
    if (this.isBossActive && this.activeBoss) {
      const boss = this.activeBoss;
      boss.mesh.lookAt(player.position.x, boss.mesh.position.y, player.position.z);

      // Subtle floating bob
      boss.mesh.position.y += Math.sin(Date.now() * 0.003) * 0.01;

      // Animate Azrael's rings
      if (boss.ring1 && boss.ring2) {
        boss.ring1.rotation.x += 1.2 * delta;
        boss.ring2.rotation.y += 1.5 * delta;
      }

      // Boss periodic calculus curse trial
      this.bossQuestionTimer -= delta;
      if (this.bossQuestionTimer <= 0) {
        this.bossQuestionTimer = 16.0; // Next challenge in 16 seconds
        if (window.game) {
          window.game.triggerBossMathTrial(boss.realmId, this.bossPhase);
        }
      }
    }
  }
}

window.EnemiesManager = EnemiesManager;

