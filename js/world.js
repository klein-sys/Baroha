/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * 3D Procedural World Generation, Realms, Interactive Objects, and Collectibles
 */

class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.currentRealm = 1;
    this.worldObjects = [];
    this.interactables = [];
    this.collectibles = [];
    this.animatedLights = [];

    // Terrain size
    this.terrainWidth = 140;
    this.terrainDepth = 140;
    this.terrainMesh = null;

    // Skybox & Atmosphere
    this.ambientLight = null;
    this.directionalLight = null;
  }

  clearWorld() {
    this.worldObjects.forEach(obj => this.scene.remove(obj));
    this.worldObjects = [];

    this.interactables.forEach(item => {
      if (item.mesh) this.scene.remove(item.mesh);
    });
    this.interactables = [];

    this.collectibles.forEach(c => {
      if (c.mesh) this.scene.remove(c.mesh);
    });
    this.collectibles = [];

    this.animatedLights = [];

    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      this.terrainMesh = null;
    }
  }

  loadRealm(realmId) {
    this.currentRealm = realmId;
    this.clearWorld();

    switch (realmId) {
      case 1:
        this.buildCursedForest();
        break;
      case 2:
        this.buildForgottenKingdom();
        break;
      case 3:
        this.buildRealmBeyondInfinity();
        break;
      default:
        this.buildCursedForest();
        break;
    }

    // Play realm ambient soundtrack
    if (window.soundEngine) {
      window.soundEngine.startMusicForRealm(realmId, false);
    }
  }

  getTerrainHeight(x, z) {
    // Terrain height evaluation
    if (this.currentRealm === 1) {
      // Gentle rolling forest hills
      return Math.sin(x * 0.08) * Math.cos(z * 0.08) * 1.5;
    } else if (this.currentRealm === 2) {
      // Flat courtyard with stepped crypt area
      if (z < -30) return 0;
      return Math.sin(x * 0.04) * 0.6;
    } else {
      // Realm 3: Floating islands
      const dist = Math.sqrt(x * x + z * z);
      if (dist > 45) return -100; // Void fall
      return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.8;
    }
  }

  // =========================================================================
  // REALM 1: THE WITCH'S CURSED FOREST
  // =========================================================================
  buildCursedForest() {
    // Dark moody atmosphere
    this.scene.fog = new THREE.FogExp2(0x0a0c14, 0.022);
    this.scene.background = new THREE.Color(0x060810);

    // Ambient light (Dim blue-violet)
    const amb = new THREE.AmbientLight(0x22223b, 1.2);
    this.scene.add(amb);
    this.worldObjects.push(amb);

    // Directional moonlight
    const moon = new THREE.DirectionalLight(0x4a4e69, 1.5);
    moon.position.set(20, 50, 30);
    this.scene.add(moon);
    this.worldObjects.push(moon);

    // Ground Plane with undulating vertices
    const geom = new THREE.PlaneGeometry(this.terrainWidth, this.terrainDepth, 48, 48);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      pos.setY(i, this.getTerrainHeight(vx, vz));
    }
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a2417, // Dark forest moss
      roughness: 0.9,
      metalness: 0.1
    });
    this.terrainMesh = new THREE.Mesh(geom, mat);
    this.scene.add(this.terrainMesh);
    this.worldObjects.push(this.terrainMesh);

    // Spawn Forest Trees
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 50;
      const tx = Math.cos(angle) * dist;
      const tz = Math.sin(angle) * dist;
      if (Math.abs(tx) < 6 && Math.abs(tz) < 6) continue; // Keep spawn clear
      this.spawnGothicTree(tx, tz);
    }

    // Spawn Glowing Mushrooms
    for (let i = 0; i < 24; i++) {
      const mx = (Math.random() - 0.5) * 80;
      const mz = (Math.random() - 0.5) * 80;
      this.spawnGlowingMushroom(mx, mz);
    }

    // Ancient Stone Ruins & Castle Gate (North)
    this.spawnCastleGate(0, -45);

    // Spawn 3 Corrupted Forest Keys
    this.spawnCollectible('key', -18, 0, 18, 'Forest Key of Limits I');
    this.spawnCollectible('key', 22, 0, -12, 'Forest Key of Limits II');
    this.spawnCollectible('key', -8, 0, -32, 'Forest Key of Limits III');

    // Spawn Potions & Crystals
    this.spawnCollectible('potion', 5, 0, 8, 'Healing Potion');
    this.spawnCollectible('mana', -6, 0, 6, 'Mana Crystal');
    this.spawnCollectible('xp', 12, 0, 14, 'XP Crystal');
    this.spawnCollectible('scroll', -14, 0, -8, 'Ancient Scroll of Limits');
    this.spawnCollectible('chest', 15, 0, -25, 'Cursed Forest Chest');

    // NPC: The Last Guardian of Knowledge (Starting Sanctuary)
    this.spawnNPC(0, 0, 4, 'The Last Guardian of Knowledge', 'Elder of Numeria');
  }

  // =========================================================================
  // REALM 2: THE NECROMANCER'S FORGOTTEN KINGDOM
  // =========================================================================
  buildForgottenKingdom() {
    this.scene.fog = new THREE.FogExp2(0x0a1410, 0.024);
    this.scene.background = new THREE.Color(0x050d0a);

    // Ambient light (Green-tinted necrotic gloom)
    const amb = new THREE.AmbientLight(0x132a13, 1.3);
    this.scene.add(amb);
    this.worldObjects.push(amb);

    const dir = new THREE.DirectionalLight(0x31572c, 1.4);
    dir.position.set(-20, 45, 25);
    this.scene.add(dir);
    this.worldObjects.push(dir);

    // Stone Cobblestone Floor
    const geom = new THREE.PlaneGeometry(this.terrainWidth, this.terrainDepth, 40, 40);
    geom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x22252a, // Cold stone
      roughness: 0.8,
      metalness: 0.2
    });
    this.terrainMesh = new THREE.Mesh(geom, mat);
    this.scene.add(this.terrainMesh);
    this.worldObjects.push(this.terrainMesh);

    // Gothic Cathedral Pillars & Walls
    for (let x = -20; x <= 20; x += 10) {
      this.spawnGothicPillar(x, -10);
      this.spawnGothicPillar(x, -25);
    }

    // Cemetery Tombs
    for (let i = 0; i < 28; i++) {
      const tx = (Math.random() - 0.5) * 70;
      const tz = 8 + Math.random() * 45;
      this.spawnTombstone(tx, tz);
    }

    // Green Spectral Braziers
    this.spawnSpectralBrazier(-12, -2);
    this.spawnSpectralBrazier(12, -2);
    this.spawnSpectralBrazier(-12, -28);
    this.spawnSpectralBrazier(12, -28);

    // Lich Throne / Crypt Entrance (North)
    this.spawnCryptThrone(0, -42);

    // Collectibles & Quests items
    this.spawnCollectible('potion', -4, 0, 10, 'Elixir of Life');
    this.spawnCollectible('mana', 8, 0, 12, 'Necrotic Mana Crystal');
    this.spawnCollectible('golden_heart', 18, 0, 25, 'Sacred Golden Heart');
    this.spawnCollectible('scroll', -16, 0, 15, 'Codex of Trig Derivatives');
    this.spawnCollectible('chest', 0, 0, 22, 'Ancient Reliquary');

    // NPC: Hermit Scholar (Warns of Vorthak)
    this.spawnNPC(0, 0, 2, 'Hermit Scholar Alistair', 'Keeper of Trigonometry');
  }

  // =========================================================================
  // REALM 3: THE REALM BEYOND INFINITY
  // =========================================================================
  buildRealmBeyondInfinity() {
    this.scene.fog = new THREE.FogExp2(0x0f051d, 0.016);
    this.scene.background = new THREE.Color(0x05020a);

    // Ambient celestial light
    const amb = new THREE.AmbientLight(0x480ca8, 1.4);
    this.scene.add(amb);
    this.worldObjects.push(amb);

    const celestial = new THREE.DirectionalLight(0xffbe0b, 1.8);
    celestial.position.set(0, 60, 0);
    this.scene.add(celestial);
    this.worldObjects.push(celestial);

    // Main Floating Arena Island
    const islandGeom = new THREE.CylinderGeometry(38, 22, 12, 32);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x240046,
      roughness: 0.5,
      metalness: 0.5
    });
    const island = new THREE.Mesh(islandGeom, islandMat);
    island.position.set(0, -6, 0);
    this.scene.add(island);
    this.worldObjects.push(island);

    // Glowing Rune Floor on Arena
    const floorGeom = new THREE.RingGeometry(2, 36, 32);
    floorGeom.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshBasicMaterial({
      color: 0x7209b7,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.set(0, 0.05, 0);
    this.scene.add(floor);
    this.worldObjects.push(floor);

    // Orbiting Geometric Calculus Rings in Sky
    for (let i = 0; i < 4; i++) {
      const ringGeom = new THREE.TorusGeometry(12 + i * 8, 0.25, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xffd166 : 0x06d6a0,
        wireframe: true
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(0, 18 + i * 4, 0);
      ring.rotation.x = Math.PI / 3 + i * 0.4;
      this.scene.add(ring);
      this.worldObjects.push(ring);
      this.animatedLights.push({ mesh: ring, speed: 0.3 + i * 0.15 });
    }

    // 3 Ancient Dimensional Towers around perimeter
    this.spawnDimensionalTower(-22, 0, -18, 'Limit Obelisk');
    this.spawnDimensionalTower(22, 0, -18, 'Derivative Obelisk');
    this.spawnDimensionalTower(0, 0, 25, 'Continuity Obelisk');

    // Central Boss Nexus
    this.spawnAzraelNexus(0, -22);

    // Collectibles
    this.spawnCollectible('potion', -10, 0, 0, 'Celestial Nectar');
    this.spawnCollectible('mana', 10, 0, 0, 'Infinity Crystal');
    this.spawnCollectible('golden_heart', 0, 0, 14, 'Aura of Eternity');
    this.spawnCollectible('scroll', -14, 0, 12, 'Master Scroll of Calculus');

    // NPC: Spirit of Differential Calculus
    this.spawnNPC(0, 0, -6, 'Spirit of Calculus', 'Ancient Consciousness of Numeria');
  }

  // =========================================================================
  // ENVIRONMENT PROPS
  // =========================================================================

  spawnGothicTree(x, z) {
    const y = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.35, 0.6, 6, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1b140f, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 3;
    group.add(trunk);

    // Twisted Foliage Crown
    const leavesGeom = new THREE.DodecahedronGeometry(2.5, 1);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x112211, roughness: 0.8 });
    const leaves = new THREE.Mesh(leavesGeom, leavesMat);
    leaves.position.y = 6.2;
    group.add(leaves);

    this.scene.add(group);
    this.worldObjects.push(group);
  }

  spawnGlowingMushroom(x, z) {
    const y = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Stem
    const stemGeom = new THREE.CylinderGeometry(0.08, 0.12, 0.6, 8);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xddddcc });
    const stem = new THREE.Mesh(stemGeom, stemMat);
    stem.position.y = 0.3;
    group.add(stem);

    // Glowing Cap
    const capGeom = new THREE.ConeGeometry(0.35, 0.4, 8);
    const capMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
    const cap = new THREE.Mesh(capGeom, capMat);
    cap.position.y = 0.65;
    group.add(cap);

    // Point Light
    const light = new THREE.PointLight(0x00f5d4, 0.8, 5);
    light.position.y = 0.7;
    group.add(light);

    this.scene.add(group);
    this.worldObjects.push(group);
  }

  spawnCastleGate(x, z) {
    const y = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Gate pillars
    const pGeom = new THREE.BoxGeometry(2, 9, 2);
    const pMat = new THREE.MeshStandardMaterial({ color: 0x241d24, roughness: 0.7 });
    const pLeft = new THREE.Mesh(pGeom, pMat);
    pLeft.position.set(-4, 4.5, 0);
    group.add(pLeft);

    const pRight = new THREE.Mesh(pGeom, pMat);
    pRight.position.set(4, 4.5, 0);
    group.add(pRight);

    // Cross arch
    const archGeom = new THREE.BoxGeometry(10, 1.5, 2);
    const arch = new THREE.Mesh(archGeom, pMat);
    arch.position.set(0, 9, 0);
    group.add(arch);

    // Glowing Rune Shield Barrier
    const barrierGeom = new THREE.PlaneGeometry(6, 8);
    const barrierMat = new THREE.MeshBasicMaterial({
      color: 0x7209b7,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const barrier = new THREE.Mesh(barrierGeom, barrierMat);
    barrier.position.set(0, 4, 0);
    group.add(barrier);

    this.scene.add(group);
    this.worldObjects.push(group);

    // Register interactable gate
    this.interactables.push({
      type: 'gate',
      name: 'Witch\'s Castle Gate',
      position: new THREE.Vector3(x, y + 1.5, z),
      radius: 4.5,
      barrierMesh: barrier,
      isUnlocked: false,
      interact: () => {
        if (window.missionsManager && window.missionsManager.hasAllForestKeys()) {
          barrier.visible = false;
          if (window.soundEngine) window.soundEngine.playChestOpen();
          if (window.interfaceManager) {
            window.interfaceManager.showToast('The 3 Keys resonate! Castle Gate Unlocked!', 'success');
          }
          if (window.game) window.game.startBossEncounter(1);
        } else {
          if (window.interfaceManager) {
            window.interfaceManager.showToast('Locked! Requires all 3 Forest Keys of Limits.', 'warning');
          }
        }
      }
    });
  }

  spawnGothicPillar(x, z) {
    const y = this.getTerrainHeight(x, z);
    const pGeom = new THREE.CylinderGeometry(0.7, 0.8, 8, 8);
    const pMat = new THREE.MeshStandardMaterial({ color: 0x33333d, roughness: 0.8 });
    const pillar = new THREE.Mesh(pGeom, pMat);
    pillar.position.set(x, y + 4, z);
    this.scene.add(pillar);
    this.worldObjects.push(pillar);
  }

  spawnTombstone(x, z) {
    const y = this.getTerrainHeight(x, z);
    const geom = new THREE.BoxGeometry(0.8, 1.4, 0.25);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3a3d40, roughness: 0.9 });
    const tomb = new THREE.Mesh(geom, mat);
    tomb.position.set(x, y + 0.7, z);
    tomb.rotation.y = (Math.random() - 0.5) * 0.4;
    this.scene.add(tomb);
    this.worldObjects.push(tomb);
  }

  spawnSpectralBrazier(x, z) {
    const y = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const bGeom = new THREE.CylinderGeometry(0.5, 0.3, 1.8, 8);
    const bMat = new THREE.MeshStandardMaterial({ color: 0x1f2421, metalness: 0.6 });
    const base = new THREE.Mesh(bGeom, bMat);
    base.position.y = 0.9;
    group.add(base);

    // Green flame sphere
    const fGeom = new THREE.SphereGeometry(0.3, 8, 8);
    const fMat = new THREE.MeshBasicMaterial({ color: 0x06d6a0 });
    const flame = new THREE.Mesh(fGeom, fMat);
    flame.position.y = 1.9;
    group.add(flame);

    const light = new THREE.PointLight(0x06d6a0, 1.4, 8);
    light.position.y = 2.0;
    group.add(light);

    this.scene.add(group);
    this.worldObjects.push(group);
  }

  spawnCryptThrone(x, z) {
    const y = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Large portal gate
    const gateGeom = new THREE.TorusGeometry(4.5, 0.4, 16, 32);
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.5 });
    const ring = new THREE.Mesh(gateGeom, gateMat);
    ring.position.y = 4.5;
    group.add(ring);

    // Spectral Portal Vortex
    const vortexGeom = new THREE.CircleGeometry(4.2, 32);
    const vortexMat = new THREE.MeshBasicMaterial({
      color: 0x06d6a0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const vortex = new THREE.Mesh(vortexGeom, vortexMat);
    vortex.position.y = 4.5;
    group.add(vortex);

    this.scene.add(group);
    this.worldObjects.push(group);

    // Register crypt gate
    this.interactables.push({
      type: 'crypt_gate',
      name: 'Throne of the Lich King',
      position: new THREE.Vector3(x, y + 2, z),
      radius: 5.0,
      interact: () => {
        if (window.game) window.game.startBossEncounter(2);
      }
    });
  }

  spawnDimensionalTower(x, y, z, name) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Tower Obelisk
    const oGeom = new THREE.ConeGeometry(1.6, 9, 4);
    const oMat = new THREE.MeshStandardMaterial({
      color: 0x3a0ca3,
      metalness: 0.8,
      roughness: 0.2
    });
    const obelisk = new THREE.Mesh(oGeom, oMat);
    obelisk.position.y = 4.5;
    group.add(obelisk);

    // Glowing tip
    const tipGeom = new THREE.OctahedronGeometry(0.6);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    const tip = new THREE.Mesh(tipGeom, tipMat);
    tip.position.y = 9.5;
    group.add(tip);

    this.scene.add(group);
    this.worldObjects.push(group);

    // Tower activation
    let activated = false;
    this.interactables.push({
      type: 'tower',
      name: name,
      position: new THREE.Vector3(x, y + 2, z),
      radius: 4.5,
      interact: () => {
        if (!activated) {
          activated = true;
          tipMat.color.setHex(0x06d6a0);
          if (window.soundEngine) window.soundEngine.playLevelUp();
          if (window.interfaceManager) {
            window.interfaceManager.showToast(`ACTIVATED: ${name}!`, 'success');
          }
          if (window.missionsManager) window.missionsManager.recordTowerActivated();
        } else {
          if (window.interfaceManager) {
            window.interfaceManager.showToast(`${name} is already harmonic and active.`, 'info');
          }
        }
      }
    });
  }

  spawnAzraelNexus(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const geom = new THREE.DodecahedronGeometry(3.5);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff006e,
      wireframe: true
    });
    const nexus = new THREE.Mesh(geom, mat);
    nexus.position.y = 6;
    group.add(nexus);

    this.scene.add(group);
    this.worldObjects.push(group);

    this.interactables.push({
      type: 'azrael_gate',
      name: 'The Forbidden Equation Core',
      position: new THREE.Vector3(x, 2, z),
      radius: 6.0,
      interact: () => {
        if (window.missionsManager && window.missionsManager.areAllTowersActive()) {
          if (window.game) window.game.startBossEncounter(3);
        } else {
          if (window.interfaceManager) {
            window.interfaceManager.showToast('Activate all 3 Celestial Towers first!', 'warning');
          }
        }
      }
    });
  }

  // =========================================================================
  // COLLECTIBLES & INTERACTABLES
  // =========================================================================

  spawnCollectible(type, x, y, z, name) {
    const groundY = this.getTerrainHeight(x, z);
    const finalY = groundY + 0.9;

    let geom, mat, color;
    switch (type) {
      case 'potion':
        geom = new THREE.CylinderGeometry(0.18, 0.22, 0.6, 8);
        color = 0xe63946;
        break;
      case 'mana':
        geom = new THREE.OctahedronGeometry(0.35);
        color = 0x00d4ff;
        break;
      case 'xp':
        geom = new THREE.DodecahedronGeometry(0.35);
        color = 0xffbe0b;
        break;
      case 'golden_heart':
        geom = new THREE.SphereGeometry(0.32, 8, 8);
        color = 0xffd700;
        break;
      case 'key':
        geom = new THREE.TorusGeometry(0.28, 0.08, 8, 16);
        color = 0xffd978;
        break;
      case 'scroll':
        geom = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8);
        color = 0xf5ee9e;
        break;
      case 'chest':
        geom = new THREE.BoxGeometry(1.0, 0.8, 0.8);
        color = 0x8b5a2b;
        break;
      default:
        geom = new THREE.SphereGeometry(0.3, 8, 8);
        color = 0xffffff;
    }

    mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.35,
      roughness: 0.3
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, finalY, z);
    this.scene.add(mesh);

    const item = {
      type: type,
      name: name,
      mesh: mesh,
      baseY: finalY,
      position: new THREE.Vector3(x, finalY, z),
      radius: 1.6,
      collected: false
    };

    this.collectibles.push(item);
  }

  spawnNPC(x, y, z, name, role) {
    const groundY = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, groundY, z);

    // Robed Elder Body
    const bodyGeom = new THREE.CylinderGeometry(0.4, 0.7, 1.8, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.9;
    group.add(body);

    // Glowing Hood / Head
    const headGeom = new THREE.SphereGeometry(0.35, 12, 12);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.9;
    group.add(head);

    // Magical Aura Ring
    const auraGeom = new THREE.RingGeometry(0.8, 1.0, 16);
    auraGeom.rotateX(-Math.PI / 2);
    const auraMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, side: THREE.DoubleSide });
    const aura = new THREE.Mesh(auraGeom, auraMat);
    aura.position.y = 0.05;
    group.add(aura);

    this.scene.add(group);
    this.worldObjects.push(group);

    // Register NPC interactable
    this.interactables.push({
      type: 'npc',
      name: name,
      role: role,
      position: new THREE.Vector3(x, groundY + 1.2, z),
      radius: 3.2,
      interact: () => {
        if (window.interfaceManager) {
          window.interfaceManager.showNpcDialogue(name, role);
        }
      }
    });
  }

  update(delta) {
    // Bob and rotate collectibles
    const time = Date.now() * 0.003;
    this.collectibles.forEach(item => {
      if (!item.collected && item.mesh) {
        item.mesh.rotation.y += 1.8 * delta;
        item.mesh.position.y = item.baseY + Math.sin(time + item.position.x) * 0.15;
      }
    });

    // Animate celestial rings
    this.animatedLights.forEach(lightObj => {
      if (lightObj.mesh) {
        lightObj.mesh.rotation.z += lightObj.speed * delta;
        lightObj.mesh.rotation.y += (lightObj.speed * 0.6) * delta;
      }
    });
  }
}

window.WorldManager = WorldManager;

