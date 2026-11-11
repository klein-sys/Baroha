/**
 * MATHBOUND – LEGENDS OF THE THREE BOSSES
 * 3D Boss System: The Dark Witch (Lv. 50), The Lich (Lv. 100), and Eternal Dragon (Lv. 1000)
 * Faithfully matches the uploaded visual references.
 */

class BossesManager {
  constructor(scene) {
    this.scene = scene;
    this.activeBoss = null;
    this.bossPhase = 1;
    this.summonedSkeletons = [];
    this.bossProjectiles = [];
  }

  clearBoss() {
    this.clearAttack();
    if (this.activeBoss && this.activeBoss.mesh) {
      this.scene.remove(this.activeBoss.mesh);
      this.activeBoss = null;
    }
    this.summonedSkeletons.forEach(s => {
      window.game?.enemies?.clearStrike(s);
      if (s.mesh) this.scene.remove(s.mesh);
    });
    this.summonedSkeletons = [];
    this.bossProjectiles.forEach(p => {
      if (p.mesh) this.scene.remove(p.mesh);
    });
    this.bossProjectiles = [];
  }

  // =========================================================================
  // 1. THE DARK WITCH (LV. 50) - MATCHES UPLOADED IMAGE 1
  // =========================================================================
  spawnDarkWitch(x = 0, z = -45) {
    this.clearBoss();
    const group = new THREE.Group();
    group.position.set(x, 1.5, z);

    // Torso & Dark Robes
    const torsoGeom = new THREE.BoxGeometry(1.0, 1.4, 0.6);
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x160f29,
      roughness: 0.5,
      metalness: 0.3
    });
    const torso = new THREE.Mesh(torsoGeom, robeMat);
    torso.position.y = 1.6;
    group.add(torso);

    // Flared Robe Skirt
    const skirtGeom = new THREE.ConeGeometry(1.6, 2.2, 8);
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x1c1033, roughness: 0.7 });
    const skirt = new THREE.Mesh(skirtGeom, skirtMat);
    skirt.position.y = 0.5;
    group.add(skirt);

    // Head
    const headGeom = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xf5d0c5 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 2.65;
    group.add(head);

    // Long Silver Hair
    const hairGeom = new THREE.BoxGeometry(0.85, 1.2, 0.85);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xd8d8eb, roughness: 0.4 });
    const hair = new THREE.Mesh(hairGeom, hairMat);
    hair.position.set(0, 2.5, -0.05);
    group.add(hair);

    // Pointed Witch Hat (Image 1)
    const hatBrimGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.08, 16);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x0c0714, roughness: 0.6 });
    const hatBrim = new THREE.Mesh(hatBrimGeom, hatMat);
    hatBrim.position.y = 3.05;
    hatBrim.rotation.x = -0.1;
    group.add(hatBrim);

    const hatConeGeom = new THREE.ConeGeometry(0.8, 1.8, 8);
    const hatCone = new THREE.Mesh(hatConeGeom, hatMat);
    hatCone.position.set(0, 3.9, -0.15);
    hatCone.rotation.x = -0.25;
    group.add(hatCone);

    // Purple Gem Brooch on Hat
    const gemGeom = new THREE.OctahedronGeometry(0.18);
    const gemMat = new THREE.MeshBasicMaterial({ color: 0xb5179e });
    const gem = new THREE.Mesh(gemGeom, gemMat);
    gem.position.set(0, 3.2, 0.5);
    group.add(gem);

    // Glowing Purple Eyes
    const eyeGeom = new THREE.PlaneGeometry(0.12, 0.08);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xcc00ff });
    const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
    eyeL.position.set(-0.16, 2.7, 0.36);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
    eyeR.position.set(0.16, 2.7, 0.36);
    group.add(eyeR);

    // Giant Glowing Purple Magic Circle behind Witch (Image 1)
    const circleGeom = new THREE.RingGeometry(2.8, 3.5, 32);
    const circleMat = new THREE.MeshBasicMaterial({
      color: 0x9d4edd,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const magicCircle = new THREE.Mesh(circleGeom, circleMat);
    magicCircle.position.set(0, 2.8, -1.2);
    group.add(magicCircle);

    // 4 Floating Chained Spellbooks orbiting around her (Image 1)
    const spellbooks = [];
    for (let i = 0; i < 4; i++) {
      const bookGroup = new THREE.Group();
      const bookCoverGeom = new THREE.BoxGeometry(0.55, 0.75, 0.18);
      const bookCoverMat = new THREE.MeshStandardMaterial({ color: 0x240046, metalness: 0.3 });
      const book = new THREE.Mesh(bookCoverGeom, bookCoverMat);
      bookGroup.add(book);

      // Glowing Purple Glyph on Book
      const runeGeom = new THREE.PlaneGeometry(0.3, 0.3);
      const runeMat = new THREE.MeshBasicMaterial({ color: 0xc77dff, side: THREE.DoubleSide });
      const rune = new THREE.Mesh(runeGeom, runeMat);
      rune.position.z = 0.1;
      bookGroup.add(rune);

      group.add(bookGroup);
      spellbooks.push(bookGroup);
    }

    this.scene.add(group);

    this.activeBoss = {
      type: 'witch',
      realmId: 1,
      name: 'The Dark Witch',
      level: 50,
      mesh: group,
      position: group.position,
      maxHp: 450,
      hp: 450,
      magicCircle: magicCircle,
      spellbooks: spellbooks,
      attackCooldown: 2.5,
      attackTimer: 1.0,
      teleportTimer: 7.0,
      attackPower: 18
    };

    return this.activeBoss;
  }

  // =========================================================================
  // 2. THE LICH – UNDEAD KING (LV. 100) - MATCHES UPLOADED IMAGE 2
  // =========================================================================
  spawnLich(x = 0, z = -45, sentinel = false) {
    this.clearBoss();
    const group = new THREE.Group();
    group.position.set(x, 1.8, z);

    // Skeleton Torso & Crimson Robes
    const torsoGeom = new THREE.BoxGeometry(1.2, 1.6, 0.7);
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x220505,
      roughness: 0.6,
      metalness: 0.3
    });
    const torso = new THREE.Mesh(torsoGeom, robeMat);
    torso.position.y = 1.8;
    group.add(torso);

    // Bone Ribcage details
    const ribGeom = new THREE.BoxGeometry(1.0, 0.8, 0.75);
    const ribMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.4 });
    const rib = new THREE.Mesh(ribGeom, ribMat);
    rib.position.y = 1.8;
    group.add(rib);

    // Skull Head
    const skullGeom = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    const skullMat = new THREE.MeshStandardMaterial({ color: 0xefefef, roughness: 0.3 });
    const skull = new THREE.Mesh(skullGeom, skullMat);
    skull.position.y = 3.0;
    group.add(skull);

    // Glowing Red Eyes
    const eyeGeom = new THREE.PlaneGeometry(0.14, 0.1);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff002b });
    const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
    eyeL.position.set(-0.2, 3.05, 0.44);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
    eyeR.position.set(0.2, 3.05, 0.44);
    group.add(eyeR);

    // Spiked Red Crown (Image 2)
    const crownGroup = new THREE.Group();
    crownGroup.position.y = 3.5;
    for (let i = 0; i < 5; i++) {
      const spikeGeom = new THREE.ConeGeometry(0.12, 0.45, 4);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0xd00000, metalness: 0.8 });
      const spike = new THREE.Mesh(spikeGeom, spikeMat);
      spike.position.set((i - 2) * 0.18, 0.2, 0);
      crownGroup.add(spike);
    }
    group.add(crownGroup);

    // Large Skull Staff with Spiked Wheel (Image 2)
    const staffGroup = new THREE.Group();
    staffGroup.position.set(1.4, 1.8, 0.5);

    const shaftGeom = new THREE.CylinderGeometry(0.08, 0.08, 4.2, 8);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x1f1414, metalness: 0.8 });
    const shaft = new THREE.Mesh(shaftGeom, shaftMat);
    shaft.position.y = 0.5;
    staffGroup.add(shaft);

    // Spiked Wheel Top
    const wheelGeom = new THREE.TorusGeometry(0.65, 0.09, 8, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x900c3f, metalness: 0.7 });
    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.position.y = 2.6;
    staffGroup.add(wheel);

    // Flaming Red Skull in Wheel
    const flameSkullGeom = new THREE.SphereGeometry(0.35, 8, 8);
    const flameSkullMat = new THREE.MeshBasicMaterial({ color: 0xff1e00 });
    const flameSkull = new THREE.Mesh(flameSkullGeom, flameSkullMat);
    flameSkull.position.y = 2.6;
    staffGroup.add(flameSkull);

    group.add(staffGroup);

    // Floating Red Tarot Runes
    const runeCards = [];
    for (let i = 0; i < 3; i++) {
      const cardGeom = new THREE.BoxGeometry(0.45, 0.65, 0.04);
      const cardMat = new THREE.MeshBasicMaterial({ color: 0xba181b });
      const card = new THREE.Mesh(cardGeom, cardMat);
      group.add(card);
      runeCards.push(card);
    }

    this.scene.add(group);

    this.activeBoss = {
      type: sentinel ? 'sentinel' : 'lich',
      realmId: sentinel ? 3 : 2,
      name: sentinel ? 'The Harmonic Sentinel' : 'The Lich – Undead King',
      level: 100,
      mesh: group,
      position: group.position,
      maxHp: sentinel ? 980 : 750,
      hp: sentinel ? 980 : 750,
      staff: staffGroup,
      runeCards: runeCards,
      attackCooldown: 3.0,
      attackTimer: 1.0,
      skeletonSummonCooldown: 12.0,
      skeletonTimer: 4.0,
      attackPower: 26
    };

    if (sentinel) {
      const keep = new Set([staffGroup, ...runeCards]);
      const trim = new THREE.MeshStandardMaterial({ color: 0x505881, metalness: 0.5, roughness: 0.4 });
      for (const part of [...group.children]) {
        if (!keep.has(part)) {
          group.remove(part);
          window.game?.world.disposeHierarchy(part);
        }
      }
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.89), trim);
      core.scale.set(1.12, 1.85, 0.78);
      core.position.y = 1.64;
      group.add(core);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(1.34, 0.11, 10, 30),
        new THREE.MeshBasicMaterial({ color: 0x91b3ff }));
      halo.position.y = 2.28;
      group.add(halo);
    }
    // Spawn initial Skeleton Warriors flanking the Lich (Image 2)
    if (!sentinel) {
      this.spawnSkeletonWarrior(x - 4, z + 2);
      this.spawnSkeletonWarrior(x + 4, z + 2);
    }

    return this.activeBoss;
  }

  spawnSkeletonWarrior(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0.9, z);

    // Blocky Skeleton Body
    const bodyGeom = new THREE.BoxGeometry(0.7, 0.9, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.9;
    group.add(body);

    // Skull
    const headGeom = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.y = 1.6;
    group.add(head);

    // Red Glowing Eyes
    const eyeGeom = new THREE.PlaneGeometry(0.1, 0.08);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
    eyeL.position.set(-0.12, 1.62, 0.29);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
    eyeR.position.set(0.12, 1.62, 0.29);
    group.add(eyeR);

    // Dark Red Blade
    const swordGeom = new THREE.BoxGeometry(0.08, 0.85, 0.15);
    const swordMat = new THREE.MeshStandardMaterial({ color: 0xa01a1a, metalness: 0.8 });
    const sword = new THREE.Mesh(swordGeom, swordMat);
    sword.position.set(0.55, 0.9, 0.3);
    group.add(sword);

    this.scene.add(group);

    const skeleton = {
      mesh: group,
      position: group.position,
      hp: 75,
      maxHp: 75,
      type: 'summoned',
      detectionRadius: 24,
      attackPower: 12,
      speed: 3.5,
      attackCooldown: 1.8,
      attackTimer: 0,
      isDead: false
    };

    this.summonedSkeletons.push(skeleton);
  }

  // =========================================================================
  // 3. ETERNAL DRAGON: THE GOLDEN GOD (LV. 1000) - MATCHES UPLOADED IMAGE 3
  // =========================================================================
  spawnEternalDragon(x = 0, z = -30) {
    this.clearBoss();
    const group = new THREE.Group();
    group.position.set(x, 6.0, z);

    // Massive Golden Body Torso
    const bodyGeom = new THREE.ConeGeometry(3.5, 9.0, 8);
    bodyGeom.rotateX(Math.PI / 2.5);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xffaa00,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeom, goldMat);
    group.add(body);

    // Colossal Dragon Head with Sharp Horns
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 3.2, 4.2);

    const skullGeom = new THREE.ConeGeometry(1.6, 3.6, 6);
    skullGeom.rotateX(-Math.PI / 2.2);
    const dragonSkull = new THREE.Mesh(skullGeom, goldMat);
    headGroup.add(dragonSkull);

    // Glowing Golden Eyes
    const eyeGeom = new THREE.SphereGeometry(0.28, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
    eyeL.position.set(-0.7, 0.6, 0.8);
    headGroup.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
    eyeR.position.set(0.7, 0.6, 0.8);
    headGroup.add(eyeR);

    // Golden Horns
    for (let i = -1; i <= 1; i += 2) {
      const hornGeom = new THREE.ConeGeometry(0.3, 2.2, 4);
      const horn = new THREE.Mesh(hornGeom, goldMat);
      horn.position.set(i * 0.9, 1.2, -0.6);
      horn.rotation.set(-0.4, 0, i * 0.4);
      headGroup.add(horn);
    }

    // Celestial Golden Halo Ring behind Head (Image 3)
    const haloGeom = new THREE.TorusGeometry(3.2, 0.16, 12, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    halo.position.set(0, 1.2, -1.2);
    headGroup.add(halo);

    group.add(headGroup);

    // Massive Golden Crystalline Wings (Image 3)
    const wingsGroup = new THREE.Group();
    for (let side = -1; side <= 1; side += 2) {
      const wing = new THREE.Group();
      wing.position.set(side * 2.2, 2.0, 0);

      // Wing Arm Spar
      const sparGeom = new THREE.BoxGeometry(0.5, 0.5, 8.5);
      const spar = new THREE.Mesh(sparGeom, goldMat);
      spar.rotation.y = side * 0.8;
      wing.add(spar);

      // Crystalline Wing Membrane Sheets
      const sheetGeom = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0, 0, 0,
        side * 9, 3.5, -4,
        side * 11, -2.5, -2,
        0, 0, 0,
        side * 11, -2.5, -2,
        side * 6, -5.0, 1
      ]);
      sheetGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      sheetGeom.computeVertexNormals();

      const wingMat = new THREE.MeshStandardMaterial({
        color: 0xffc300,
        emissive: 0xffb703,
        emissiveIntensity: 0.35,
        side: THREE.DoubleSide,
        roughness: 0.3,
        metalness: 0.8
      });
      const wingMesh = new THREE.Mesh(sheetGeom, wingMat);
      wing.add(wingMesh);
      wingsGroup.add(wing);
    }
    group.add(wingsGroup);

    // Powerful Golden Claws
    for (let side = -1; side <= 1; side += 2) {
      const clawGeom = new THREE.ConeGeometry(0.8, 3.2, 5);
      const claw = new THREE.Mesh(clawGeom, goldMat);
      claw.position.set(side * 2.8, -3.2, 2.5);
      claw.rotation.x = 0.4;
      group.add(claw);
    }

    this.scene.add(group);

    this.activeBoss = {
      type: 'dragon',
      realmId: 4,
      name: 'Eternal Dragon',
      subtitle: 'Lv. 1000 (Final Boss)',
      level: 1000,
      mesh: group,
      position: group.position,
      maxHp: 1500, // Extremely thick health bar
      hp: 1500,
      wings: wingsGroup,
      head: headGroup,
      halo: halo,
      phase: 1, // 1: Golden Awakening, 2: Divine Wrath, 3: Eternal Judgment
      attackCooldown: 3.5,
      attackTimer: 1.0,
      attackPower: 45
    };

    return this.activeBoss;
  }

  clearAttack() {
    const marker = this.activeBoss?.attack?.marker;
    if (!marker) return;
    this.scene.remove(marker);
    marker.geometry.dispose();
    marker.material.dispose();
    this.activeBoss.attack.marker = null;
  }

  updateAttack(delta, player, boss) {
    const attack = boss.attack ??= { phase: 'approach', time: 2.8, index: 0 };
    attack.time -= delta;
    const position = boss.mesh.position;
    const playerPos = player.position;

    if (attack.phase === 'approach') {
      const orbit = boss.type === 'witch' || boss.type === 'sentinel';
      const x = orbit ? (attack.index % 2 === 0 ? -6 : 6) : playerPos.x;
      const z = orbit ? -63 : playerPos.z - 3;
      const dx = THREE.MathUtils.clamp(x, -10, 10) - position.x;
      const dz = THREE.MathUtils.clamp(z, -71, -53) - position.z;
      const distance = Math.hypot(dx, dz);
      if (distance > 0.1) {
        const step = Math.min(distance, delta * (boss.type === 'lich' ? 3.2 : 4.5)) / distance;
        position.x += dx * step;
        position.z += dz * step;
      }
      if (attack.time > 0) return;

      const alternate = attack.index % 2 === 1;
      attack.shape = boss.type === 'witch' ? (alternate ? 'pendulum' : 'ring')
        : boss.type === 'lich' ? (alternate ? 'summon' : 'slam')
        : boss.type === 'sentinel' ? 'harmonic'
        : !alternate ? 'dive' : 'sweep';
      attack.x = ['sweep', 'dive', 'harmonic'].includes(attack.shape)
        ? THREE.MathUtils.clamp(playerPos.x, -12, 12) : position.x;
      attack.z = position.z;
      attack.startZ = position.z;
      attack.targetZ = playerPos.z > position.z ? -50 : -74;
      attack.hit = false;
      attack.phase = 'warning';
      attack.time = boss.realmId < 3 ? 1.2 : 0.95;
      const ring = attack.shape === 'ring';
      const area = attack.shape === 'slam' || attack.shape === 'summon';
      const geometry = ring ? new THREE.RingGeometry(3.15, 4.85, 40)
        : area ? new THREE.CircleGeometry(4.8, 36) : new THREE.PlaneGeometry(3.7, attack.shape === 'pendulum' ? 13 : 29);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffbe60, transparent: true, opacity: 0.52, depthWrite: false, side: THREE.DoubleSide
      });
      attack.marker = new THREE.Mesh(geometry, material);
      attack.marker.rotation.x = -Math.PI / 2;
      attack.marker.position.set(attack.x, 0.075, ring || area || attack.shape === 'pendulum' ? attack.z : -62.5);
      this.scene.add(attack.marker);
      const tell = {
        ring: 'Asymptote ring · stay clear of radius 4 m',
        sweep: 'Sweep · step out of the marked lane',
        summon: 'Summoning circle · keep clear',
        slam: 'Staff slam · back away',
        dive: 'Aerial pass · dodge sideways',
        pendulum: 'Pendulum sweep · stay beyond the marked arc',
        harmonic: 'Harmonic sweep · read the moving lane'
      };
      const [label, kind, tip] = bossPatterns[attack.shape];
      recordAttack(label, kind, tip);
      window.interfaceManager?.showBossAttack(label, 'Prepare');
      window.interfaceManager?.showToast(tell[attack.shape], 'warning');
      return;
    }

    if (attack.phase === 'warning' && attack.time <= 0) {
      attack.phase = 'active';
      window.interfaceManager?.showBossAttack(bossPatterns[attack.shape][0], 'Strike');
      attack.time = 0.58;
      attack.marker.material.color.setHex(0xff4548);
      attack.marker.material.opacity = 0.76;
      if (attack.shape === 'summon' && this.summonedSkeletons.filter(s => !s.isDead).length < 3) {
        this.spawnSkeletonWarrior(position.x - 2, position.z + 2);
        this.spawnSkeletonWarrior(position.x + 2, position.z + 2);
      }
    }

    if (attack.shape === 'pendulum' && attack.marker) {
      const t = attack.phase === 'warning' ? 1 - attack.time / 1.2 : 1 + (1 - attack.time / 0.58);
      attack.angle = 0.95 * Math.cos(t * Math.PI / 2);
      attack.marker.rotation.z = attack.angle;
    }
    if (attack.shape === 'harmonic' && attack.marker) {
      attack.angle = (attack.angle ?? 0) + delta * 3.6;
      attack.marker.position.x = THREE.MathUtils.clamp(attack.x + 3.2 * Math.sin(attack.angle), -12, 12);
    }

    if (attack.phase === 'active') {
      if (attack.shape === 'dive') {
        position.x = attack.x;
        position.z = THREE.MathUtils.lerp(attack.startZ, attack.targetZ, 1 - Math.max(0, attack.time) / 0.58);
      }
      const distance = Math.hypot(playerPos.x - attack.x, playerPos.z - attack.z);
      const dx = playerPos.x - attack.x;
      const dz = playerPos.z - attack.z;
      const pendulumHit = attack.shape === 'pendulum'
        && Math.abs(dx * Math.cos(attack.angle) - dz * Math.sin(attack.angle)) < 1.85
        && Math.abs(dx * Math.sin(attack.angle) + dz * Math.cos(attack.angle)) < 6.5;
      const laneX = attack.shape === 'harmonic' ? attack.marker.position.x : attack.x;
      const inZone = attack.shape === 'pendulum' ? pendulumHit : attack.shape === 'ring' ? Math.abs(distance - 4) < 0.85
        : attack.shape === 'slam' || attack.shape === 'summon' ? distance < 4.8
        : Math.abs(playerPos.x - laneX) < 1.85 && playerPos.z > -77 && playerPos.z < -48;
      if (!attack.hit && inZone && playerPos.y < player.height + 1.15) {
        attack.hit = true;
        player.takeDamage(boss.attackPower);
        if (this.activeBoss !== boss) return;
      }
      if (attack.time <= 0) {
        this.clearAttack();
        attack.phase = 'recovery';
        window.interfaceManager?.showBossAttack(bossPatterns[attack.shape][0], 'Recovery');
        attack.time = 2;
      }
    } else if (attack.phase === 'recovery' && attack.time <= 0) {
      attack.phase = 'approach';
      window.interfaceManager?.showBossAttack();
      attack.index++;
      attack.time = Math.max(1.15, 2.15 - ((window.game?.enemies.bossPhase || 1) - 1) * 0.45);
    }
  }

  update(delta, player) {
    if (!this.activeBoss) return;
    const boss = this.activeBoss;
    this.updateAttack(delta, player, boss);
    if (!this.activeBoss) return;

    // Face player
    boss.mesh.lookAt(player.position.x, boss.mesh.position.y, player.position.z);
    boss.mesh.rotation.x = boss.attack.phase === 'recovery' ? 0.13 : boss.attack.phase === 'warning' ? -0.10 : 0;

    if (boss.type === 'witch') {
      // Rotate magic circle
      if (boss.magicCircle) boss.magicCircle.rotation.z += 0.8 * delta;

      // Orbit 4 spellbooks around Witch
      const t = Date.now() * 0.002;
      boss.spellbooks.forEach((book, i) => {
        const angle = t + (i * Math.PI) / 2;
        book.position.x = Math.cos(angle) * 2.6;
        book.position.z = Math.sin(angle) * 2.6;
        book.position.y = 2.4 + Math.sin(t * 2 + i) * 0.35;
        book.rotation.y = -angle;
      });
    } else if (boss.type === 'lich' || boss.type === 'sentinel') {
      // Bob staff and spin tarot runes
      const t = Date.now() * 0.003;
      boss.staff.position.y = 1.8 + Math.sin(t) * 0.15;
      boss.runeCards.forEach((card, i) => {
        const angle = t * 1.5 + (i * Math.PI * 2) / 3;
        card.position.set(Math.cos(angle) * 2.0, 2.8 + Math.sin(t * 2 + i) * 0.25, Math.sin(angle) * 2.0);
        card.rotation.y = angle;
      });

      for (const skeleton of this.summonedSkeletons) {
        window.game?.enemies.updateThreat(delta, player, skeleton);
        skeleton.position.x = THREE.MathUtils.clamp(skeleton.position.x, -14, 14);
        skeleton.position.z = THREE.MathUtils.clamp(skeleton.position.z, -76, -48);
      }
    } else if (boss.type === 'dragon') {
      // Flap massive wings
      const t = Date.now() * 0.003;
      boss.wings.children.forEach((wing, i) => {
        const side = i === 0 ? -1 : 1;
        wing.rotation.z = Math.sin(t * 2) * 0.25 * side;
      });
      boss.halo.rotation.z += 1.0 * delta;
      const height = boss.attack.phase === 'recovery' ? 2.1 : 4.2;
      boss.mesh.position.y = THREE.MathUtils.lerp(boss.mesh.position.y, height, 1 - Math.exp(-5 * delta));
    }
  }
}

window.BossesManager = BossesManager;

