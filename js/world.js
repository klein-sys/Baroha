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
    this.oscillatingPlatforms = [];
    this.solidBridges = [];

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

    this.oscillatingPlatforms.forEach(p => {
      if (p.mesh) this.scene.remove(p.mesh);
    });
    this.oscillatingPlatforms = [];

    this.solidBridges.forEach(b => {
      if (b.mesh) this.scene.remove(b.mesh);
    });
    this.solidBridges = [];

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
    // Check solidified bridges
    if (this.solidBridges) {
      for (let i = 0; i < this.solidBridges.length; i++) {
        const b = this.solidBridges[i];
        if (b.isSolid && Math.abs(x - b.x) <= b.halfWidth && Math.abs(z - b.z) <= b.halfLength) {
          return b.y;
        }
      }
    }

    // Check oscillating platforms
    if (this.oscillatingPlatforms) {
      for (let i = 0; i < this.oscillatingPlatforms.length; i++) {
        const p = this.oscillatingPlatforms[i];
        if (p.mesh && Math.abs(x - p.mesh.position.x) <= p.radius && Math.abs(z - p.mesh.position.z) <= p.radius) {
          return p.mesh.position.y + 0.3;
        }
      }
    }

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

    // Core Differential Calculus Mechanics (Limits, Piecewise Continuity, IVT, Oscillators)
    this.spawnRiftSeal(-18, 18);
    this.spawnPiecewiseBridge(22, -12);
    this.spawnLeylineShrine(-8, -32);
    this.spawnOscillatingPlatform(12, 0, 3.2, 1.2, 1.0);
    this.spawnManaWell(0, 16);

    // Spawn Potions & Crystals
    this.spawnCollectible('potion', 5, 0, 8, 'Healing Potion');
    this.spawnCollectible('mana', -6, 0, 6, 'Mana Crystal');
    this.spawnCollectible('xp', 12, 0, 14, 'XP Crystal');
    this.spawnCollectible('scroll', -14, 0, -8, 'Ancient Scroll of Limits');
    this.spawnCollectible('chest', 15, 0, -25, 'Cursed Forest Chest');

    // Spawn Starter Village (Beginner Kingdom area)
    this.spawnVillageHouse(0, 25, true); // Village Inn with sleeping bed
    this.spawnVillageHouse(-14, 20, false);
    this.spawnVillageHouse(14, 20, false);
    this.spawnTrainingDummy(6, 15);

    // NPC: The Last Guardian of Knowledge (Starting Sanctuary)
    this.spawnNPC(0, 0, 8, 'The Last Guardian of Knowledge', 'Elder of Numeria');
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
    group.rotation.y = Math.random() * Math.PI * 2;
    applyRealmModel(Math.random() < 0.7 ? 'pine' : 'bareTree', group, [trunk, leaves], 6 + Math.random() * 3);
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
    const gateObj = {
      type: 'gate',
      name: 'Witch\'s Castle Gate',
      position: new THREE.Vector3(x, y + 1.5, z),
      radius: 4.5,
      barrierMesh: barrier,
      isUnlocked: false,
      interact: () => {
        if (gateObj.isUnlocked) {
          if (window.interfaceManager) window.interfaceManager.showToast('Castle Gate is already open!', 'info');
          return;
        }
        if (window.missionsManager && window.missionsManager.hasAllForestKeys()) {
          gateObj.isUnlocked = true;
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
    };
    this.interactables.push(gateObj);
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
    const cryptGateObj = {
      type: 'crypt_gate',
      name: 'Throne of the Lich King',
      position: new THREE.Vector3(x, y + 2, z),
      radius: 5.0,
      isTriggered: false,
      interact: () => {
        if (cryptGateObj.isTriggered && window.game && window.game.enemies && window.game.enemies.isBossActive) return;
        cryptGateObj.isTriggered = true;
        if (window.game) window.game.startBossEncounter(2);
      }
    };
    this.interactables.push(cryptGateObj);
  }

  // =========================================================================
  // VILLAGE HOUSES, INN & INTERACTIVE BEDS (SLEEPING SYSTEM)
  // =========================================================================
  spawnVillageHouse(x, z, hasBed = false) {
    const y = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // House Walls
    const wallGeom = new THREE.BoxGeometry(6.5, 4.2, 5.5);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    const walls = new THREE.Mesh(wallGeom, wallMat);
    walls.position.y = 2.1;
    group.add(walls);

    // Sloped Wooden Roof
    const roofGeom = new THREE.ConeGeometry(5.2, 2.5, 4);
    roofGeom.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a2c11, roughness: 0.7 });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 5.2;
    group.add(roof);

    // Doorway Frame
    const doorGeom = new THREE.BoxGeometry(1.4, 2.4, 0.2);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x2e1806 });
    const door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(0, 1.2, 2.8);
    group.add(door);

    this.scene.add(group);
    this.worldObjects.push(group);

    // If house contains an interactive bed (Inn)
    if (hasBed) {
      this.spawnBed(x, y, z);
    }
  }

  spawnBed(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y + 0.1, z);

    // Wooden Bed Frame
    const frameGeom = new THREE.BoxGeometry(1.6, 0.45, 2.6);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x5c3818, roughness: 0.7 });
    const frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.y = 0.22;
    group.add(frame);

    // Mattress & Red Blanket (Roblox style)
    const matGeom = new THREE.BoxGeometry(1.5, 0.35, 2.5);
    const matMat = new THREE.MeshStandardMaterial({ color: 0xb5179e, roughness: 0.6 });
    const mattress = new THREE.Mesh(matGeom, matMat);
    mattress.position.y = 0.55;
    group.add(mattress);

    // White Pillow
    const pilGeom = new THREE.BoxGeometry(1.2, 0.22, 0.6);
    const pilMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.4 });
    const pillow = new THREE.Mesh(pilGeom, pilMat);
    pillow.position.set(0, 0.75, -0.85);
    group.add(pillow);

    this.scene.add(group);
    this.worldObjects.push(group);

    // Register bed with proximity interaction
    this.interactables.push({
      type: 'bed',
      name: 'Adventurer\'s Bed',
      position: new THREE.Vector3(x, y + 0.8, z),
      radius: 3.5,
      interact: () => {
        if (window.interfaceManager) {
          window.interfaceManager.showSleepModal();
        }
      }
    });
  }

  spawnTrainingDummy(x, z) {
    const y = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Post
    const postGeom = new THREE.CylinderGeometry(0.18, 0.18, 2.2, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x6f4e37 });
    const post = new THREE.Mesh(postGeom, postMat);
    post.position.y = 1.1;
    group.add(post);

    // Straw Body
    const strawGeom = new THREE.CylinderGeometry(0.45, 0.4, 1.2, 8);
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xd4a373 });
    const straw = new THREE.Mesh(strawGeom, strawMat);
    straw.position.y = 1.3;
    group.add(straw);

    // Crossbar arms
    const barGeom = new THREE.BoxGeometry(1.6, 0.18, 0.18);
    const bar = new THREE.Mesh(barGeom, postMat);
    bar.position.y = 1.5;
    group.add(bar);

    this.scene.add(group);
    this.worldObjects.push(group);
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

    const azraelGateObj = {
      type: 'azrael_gate',
      name: 'The Forbidden Equation Core',
      position: new THREE.Vector3(x, 2, z),
      radius: 6.0,
      isTriggered: false,
      interact: () => {
        if (azraelGateObj.isTriggered && window.game && window.game.enemies && window.game.enemies.isBossActive) return;
        if (window.missionsManager && window.missionsManager.areAllTowersActive()) {
          azraelGateObj.isTriggered = true;
          if (window.game) window.game.startBossEncounter(3);
        } else {
          if (window.interfaceManager) {
            window.interfaceManager.showToast('Activate all 3 Celestial Towers first!', 'warning');
          }
        }
      }
    };
    this.interactables.push(azraelGateObj);
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

    const mesh = new THREE.Group();
    const fallback = new THREE.Mesh(geom, mat);
    mesh.add(fallback);
    mesh.position.set(x, finalY, z);
    this.scene.add(mesh);
    if (type === 'key' || type === 'chest') {
      applyRealmModel(type, mesh, [fallback], type === 'key' ? 0.55 : 0.9, -0.25);
    }

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

  // =========================================================================
  // CALCULUS MECHANIC 1: RIFT SEAL (REMOVABLE DISCONTINUITY)
  // f(x) = (x^2 - 9)/(x - 3), undefined at x = 3, lim x->3 = 6
  // =========================================================================
  spawnRiftSeal(x, z) {
    const groundY = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, groundY, z);

    // Obelisks
    const obeliskGeom = new THREE.ConeGeometry(0.5, 3.5, 4);
    const obeliskMat = new THREE.MeshStandardMaterial({ color: 0x2b1b4d, roughness: 0.4, metalness: 0.6 });
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const ob = new THREE.Mesh(obeliskGeom, obeliskMat);
      ob.position.set(Math.cos(angle) * 2.2, 1.75, Math.sin(angle) * 2.2);
      group.add(ob);
    }

    // Floating Rune Ring (Torus)
    const ringGeom = new THREE.TorusGeometry(1.4, 0.15, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x9d4edd,
      emissive: 0x7b2cbf,
      emissiveIntensity: 0.7,
      roughness: 0.2
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.y = 2.0;
    group.add(ring);

    // Core Crystal (Shatters when limit breached)
    const coreGeom = new THREE.OctahedronGeometry(0.6);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x0077b6,
      emissiveIntensity: 0.6
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    core.position.y = 2.0;
    group.add(core);

    this.scene.add(group);
    this.worldObjects.push(group);

    // Tunable frequency parameters
    const frequencies = [2.70, 2.85, 2.95, 2.99, 3.00, 3.01, 3.10, 3.25];
    let freqIndex = 0;
    let isBreached = false;

    const riftObj = {
      type: 'calculus_rift',
      name: 'Corrupted Limit Rift Seal',
      position: new THREE.Vector3(x, groundY + 1.5, z),
      radius: 4.5,
      getTelemetry: () => {
        const curX = frequencies[freqIndex];
        const isHole = Math.abs(curX - 3.0) < 0.001;
        const val = isHole ? null : (curX * curX - 9) / (curX - 3);
        return {
          title: 'RIFT SEAL (REMOVABLE DISCONTINUITY)',
          func: 'f(x) = (x² - 9) / (x - 3) [Undefined at x = 3]',
          details: isHole
            ? '⚠️ HOLE DETECTED at x = 3.0 (0/0 Indeterminate). Approach limit, do not stand on hole!'
            : `Tuning frequency x → 3 channels Limit Power = 6.00. Current Resonance: ${val.toFixed(2)}.`,
          isWarning: isHole,
          metrics: [
            { label: 'Frequency x', val: curX.toFixed(2) },
            { label: 'Resonance f(x)', val: isHole ? 'UNDEFINED (0/0)' : val.toFixed(2) },
            { label: 'Target Limit', val: '6.00' },
            { label: 'x = 2.99', val: '5.99' },
            { label: 'x = 3.01', val: '6.01' }
          ]
        };
      },
      interact: () => {
        if (isBreached) {
          if (window.interfaceManager) window.interfaceManager.showToast('Rift Seal already breached and stabilized!', 'info');
          return;
        }

        freqIndex = (freqIndex + 1) % frequencies.length;
        const curX = frequencies[freqIndex];
        const isHole = Math.abs(curX - 3.0) < 0.001;

        if (isHole) {
          if (window.soundEngine) window.soundEngine.playMathError();
          if (window.interfaceManager) {
            window.interfaceManager.showToast('⚠️ SINGULARITY HOLE at x = 3.0! (0/0 Indeterminate) — Function undefined here. Approach limit without standing on the hole!', 'error');
          }
          coreMat.emissive.setHex(0xff0044);
          coreMat.emissiveIntensity = 1.0;
        } else if (Math.abs(curX - 3.0) <= 0.02) {
          // Breached! Power is 6.00
          isBreached = true;
          core.scale.set(1.5, 1.5, 1.5);
          coreMat.emissive.setHex(0x00ff88);
          ringMat.emissive.setHex(0x38ef7d);
          if (window.soundEngine) window.soundEngine.playChestOpen();
          if (window.interfaceManager) {
            window.interfaceManager.showToast('✨ RIFT SEAL BREACHED! Frequency x → 3 reached Limit Power = 6.00! Claimed Forest Key of Limits I (+150 XP)!', 'success');
          }
          if (window.missionsManager) window.missionsManager.recordKeyCollected();
          if (window.game && window.game.player) window.game.player.addXp(150);
        } else {
          const val = (curX * curX - 9) / (curX - 3);
          if (window.soundEngine) window.soundEngine.playSpellCast();
          if (window.interfaceManager) {
            window.interfaceManager.showToast(`Rune Frequency tuned to x = ${curX.toFixed(2)}. Resonance Power = ${val.toFixed(2)} (Target Limit = 6.00). Keep approaching x → 3!`, 'info');
          }
          coreMat.emissive.setHex(0x00d4ff);
        }
      }
    };
    this.interactables.push(riftObj);
  }

  // =========================================================================
  // CALCULUS MECHANIC 2: PIECEWISE CONTINUOUS BRIDGE
  // f(x) = { kx + 3 (x <= 2), x^2 + 1 (x > 2) }. Continuous iff k = 1
  // =========================================================================
  spawnPiecewiseBridge(x, z) {
    const groundY = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, groundY, z);

    // Ravine marker
    const bridgeLength = 12;
    const bridgeWidth = 4;

    // Bridge stone slabs (flickering when discontinuous, solid when continuous)
    const slabGeom = new THREE.BoxGeometry(bridgeWidth, 0.5, bridgeLength);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x4a4e69,
      transparent: true,
      opacity: 0.35,
      roughness: 0.7
    });
    const bridgeMesh = new THREE.Mesh(slabGeom, slabMat);
    bridgeMesh.position.set(0, 0.25, 0);
    group.add(bridgeMesh);

    // Rune Tuning Pedestal
    const pedGeom = new THREE.CylinderGeometry(0.6, 0.8, 1.8, 8);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x22223b, roughness: 0.5 });
    const pedestal = new THREE.Mesh(pedGeom, pedMat);
    pedestal.position.set(-3.5, 0.9, 0);
    group.add(pedestal);

    // Glowing Rune Dial
    const dialGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const dialMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffaa00, emissiveIntensity: 0.5 });
    const dial = new THREE.Mesh(dialGeom, dialMat);
    dial.position.set(-3.5, 2.0, 0);
    group.add(dial);

    this.scene.add(group);
    this.worldObjects.push(group);

    // Register bridge in solid collision table
    const bridgeCollision = {
      x: x,
      z: z,
      y: groundY + 0.5,
      halfWidth: bridgeWidth / 2 + 0.5,
      halfLength: bridgeLength / 2 + 0.5,
      isSolid: false
    };
    this.solidBridges.push(bridgeCollision);

    // Tuning k parameters: [-1, 0, 1, 2, 3]
    const kValues = [-1.0, 0.0, 1.0, 2.0];
    let kIndex = 0;
    let keySpawned = false;

    const bridgeInteract = {
      type: 'calculus_bridge',
      name: 'Piecewise Bridge Rune Pedestal',
      position: new THREE.Vector3(x - 3.5, groundY + 1.2, z),
      radius: 3.5,
      getTelemetry: () => {
        const k = kValues[kIndex];
        const leftLimit = 2 * k + 3;
        const rightLimit = 5.0;
        const jump = Math.abs(leftLimit - rightLimit);
        const isContinuous = jump < 0.01;
        return {
          title: 'PIECEWISE CONTINUOUS BRIDGE',
          func: 'f(x) = { kx + 3 (x ≤ 2), x² + 1 (x > 2) }',
          details: isContinuous
            ? '✨ CONTINUOUS! Left Limit (5.0) = Right Limit (5.0) = f(2). Jump = 0. Bridge solidified!'
            : `FRACTURED! Left Limit (${leftLimit.toFixed(1)}) ≠ Right Limit (${rightLimit.toFixed(1)}). Jump Discontinuity = ${jump.toFixed(1)}.`,
          isWarning: !isContinuous,
          metrics: [
            { label: 'Rune k', val: k.toFixed(1) },
            { label: 'Left Limit (x→2⁻)', val: leftLimit.toFixed(1) },
            { label: 'Right Limit (x→2⁺)', val: '5.0' },
            { label: 'f(2)', val: leftLimit.toFixed(1) },
            { label: 'Jump Δ', val: jump.toFixed(1) },
            { label: 'Bridge Physical State', val: isContinuous ? 'SOLID (WALKABLE)' : 'SPECTRAL (UNSTABLE)' }
          ]
        };
      },
      interact: () => {
        kIndex = (kIndex + 1) % kValues.length;
        const k = kValues[kIndex];
        const leftLimit = 2 * k + 3;
        const rightLimit = 5.0;
        const jump = Math.abs(leftLimit - rightLimit);
        const isContinuous = jump < 0.01;

        if (isContinuous) {
          bridgeCollision.isSolid = true;
          slabMat.opacity = 0.95;
          slabMat.color.setHex(0xd4af37);
          slabMat.emissive = new THREE.Color(0xffaa00);
          slabMat.emissiveIntensity = 0.4;
          if (window.soundEngine) window.soundEngine.playMathCorrect();
          if (window.interfaceManager) {
            window.interfaceManager.showToast('🌉 PIECEWISE CONTINUITY ACHIEVED! Left Limit = Right Limit = f(2) = 5.0 (Jump = 0). Bridge solidified! Cross and claim Forest Key II!', 'success');
          }
          if (!keySpawned) {
            keySpawned = true;
            this.spawnCollectible('key', x, groundY + 0.5, z + 5, 'Forest Key of Limits II');
          }
        } else {
          bridgeCollision.isSolid = false;
          slabMat.opacity = 0.35;
          slabMat.color.setHex(0x4a4e69);
          slabMat.emissive = new THREE.Color(0x000000);
          if (window.soundEngine) window.soundEngine.playSpellCast();
          if (window.interfaceManager) {
            window.interfaceManager.showToast(`Rune parameter tuned to k = ${k.toFixed(1)}. Left Limit = ${leftLimit.toFixed(1)}, Right Limit = 5.0. Jump Discontinuity = ${jump.toFixed(1)}! Bridge remains spectral.`, 'warning');
          }
        }
      }
    };
    this.interactables.push(bridgeInteract);
  }

  // =========================================================================
  // CALCULUS MECHANIC 3: IVT LEYLINE SHRINE (ROOT FINDING VIA BISECTION)
  // f(x) = x^2 - 12. f(a)*f(b) < 0 guarantees root in (a, b) by IVT!
  // =========================================================================
  spawnLeylineShrine(x, z) {
    const groundY = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, groundY, z);

    // Compass altar
    const altarGeom = new THREE.CylinderGeometry(1.6, 2.0, 1.2, 16);
    const altarMat = new THREE.MeshStandardMaterial({ color: 0x1b263b, roughness: 0.6 });
    const altar = new THREE.Mesh(altarGeom, altarMat);
    altar.position.y = 0.6;
    group.add(altar);

    // Needle dial
    const needleGeom = new THREE.ConeGeometry(0.2, 1.2, 6);
    const needleMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x0077b6, emissiveIntensity: 0.5 });
    const needle = new THREE.Mesh(needleGeom, needleMat);
    needle.position.y = 1.3;
    needle.rotation.x = Math.PI / 2;
    group.add(needle);

    this.scene.add(group);
    this.worldObjects.push(group);

    let a = 0.0;
    let b = 6.0;
    let isRootSolved = false;

    const leylineObj = {
      type: 'calculus_ivt',
      name: 'Leyline Seeker Shrine',
      position: new THREE.Vector3(x, groundY + 1.2, z),
      radius: 4.0,
      getTelemetry: () => {
        const fa = a * a - 12;
        const fb = b * b - 12;
        const mid = (a + b) / 2;
        const fmid = mid * mid - 12;
        return {
          title: 'INTERMEDIATE VALUE THEOREM (IVT) LEYLINE',
          func: 'f(x) = x² - 12 [Continuous on interval [a, b]]',
          details: (fa * fb <= 0)
            ? `f(a)·f(b) < 0 guarantees a subterranean root exists in (${a.toFixed(2)}, ${b.toFixed(2)})! Bisection narrows the interval.`
            : 'Interval boundary error.',
          metrics: [
            { label: 'Interval [a, b]', val: `[${a.toFixed(2)}, ${b.toFixed(2)}]` },
            { label: 'f(a)', val: fa.toFixed(2) },
            { label: 'f(b)', val: fb.toFixed(2) },
            { label: 'Midpoint m', val: mid.toFixed(2) },
            { label: 'f(m)', val: fmid.toFixed(2) },
            { label: 'Interval Width', val: Math.abs(b - a).toFixed(2) }
          ]
        };
      },
      interact: () => {
        if (isRootSolved) {
          if (window.interfaceManager) window.interfaceManager.showToast('Leyline Core already unsealed via IVT!', 'info');
          return;
        }

        const fa = a * a - 12;
        const mid = (a + b) / 2;
        const fmid = mid * mid - 12;

        // Perform bisection step
        if (fa * fmid <= 0) {
          b = mid;
        } else {
          a = mid;
        }

        const width = Math.abs(b - a);
        needle.rotation.z += 0.8;

        if (width < 0.4 || Math.abs(fmid) < 0.1) {
          isRootSolved = true;
          needleMat.emissive.setHex(0x38ef7d);
          if (window.soundEngine) window.soundEngine.playChestOpen();
          if (window.interfaceManager) {
            window.interfaceManager.showToast(`🗝️ ROOT LOCATED VIA IVT! Root x ≈ ${mid.toFixed(3)} found in interval (${a.toFixed(2)}, ${b.toFixed(2)}). Leyline Core Unsealed: Forest Key III (+150 XP)!`, 'success');
          }
          if (window.missionsManager) window.missionsManager.recordKeyCollected();
          if (window.game && window.game.player) window.game.player.addXp(150);
        } else {
          if (window.soundEngine) window.soundEngine.playSpellCast();
          if (window.interfaceManager) {
            window.interfaceManager.showToast(`Seeker Pulse: Interval halved to [${a.toFixed(2)}, ${b.toFixed(2)}] (Midpoint m = ${mid.toFixed(2)}, f(m) = ${fmid.toFixed(2)}). Sign change confirmed!`, 'info');
          }
        }
      }
    };
    this.interactables.push(leylineObj);
  }

  // =========================================================================
  // CALCULUS MECHANIC 4: HARMONIC OSCILLATING PLATFORM
  // y(t) = A*sin(w*t), v(t) = A*w*cos(w*t), a(t) = -A*w^2*sin(w*t)
  // =========================================================================
  spawnOscillatingPlatform(x, z, A = 3.5, omega = 1.2, y0 = 1.0) {
    const group = new THREE.Group();
    group.position.set(x, y0, z);

    // Platform Slab
    const slabGeom = new THREE.CylinderGeometry(2.2, 2.4, 0.6, 16);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x1d3557,
      emissive: 0x457b9d,
      emissiveIntensity: 0.3,
      metalness: 0.7,
      roughness: 0.3
    });
    const slab = new THREE.Mesh(slabGeom, slabMat);
    group.add(slab);

    // Glowing core crystal underneath
    const crystalGeom = new THREE.OctahedronGeometry(0.5);
    const crystalMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const crystal = new THREE.Mesh(crystalGeom, crystalMat);
    crystal.position.y = -0.5;
    group.add(crystal);

    this.scene.add(group);
    this.worldObjects.push(group);

    const platformObj = {
      mesh: group,
      material: slabMat,
      A: A,
      omega: omega,
      y0: y0,
      radius: 2.4,
      update: (t) => {
        const y = A * Math.sin(omega * t);
        const v = A * omega * Math.cos(omega * t);
        const a = -A * omega * omega * Math.sin(omega * t);
        group.position.y = y0 + y;

        // Visual telegraph: green when v ≈ 0 (safe peak)
        const isSafePeak = Math.abs(v) < 0.35;
        if (isSafePeak) {
          slabMat.emissive.setHex(0x00ff88);
          slabMat.emissiveIntensity = 0.8;
        } else {
          slabMat.emissive.setHex(0x457b9d);
          slabMat.emissiveIntensity = 0.2;
        }

        return { y, v, a, isSafePeak };
      }
    };
    this.oscillatingPlatforms.push(platformObj);
  }

  // =========================================================================
  // CALCULUS MECHANIC 5: MANA WELL (HORIZONTAL ASYMPTOTE PLATEAU)
  // M(t) = 100t / (t + 5) -> 100 as t -> infinity
  // =========================================================================
  spawnManaWell(x, z) {
    const groundY = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, groundY, z);

    // Stone Basin
    const basinGeom = new THREE.CylinderGeometry(2.0, 2.2, 0.8, 16);
    const basinMat = new THREE.MeshStandardMaterial({ color: 0x3d3a45, roughness: 0.7 });
    const basin = new THREE.Mesh(basinGeom, basinMat);
    basin.position.y = 0.4;
    group.add(basin);

    // Glowing Azure Pool
    const poolGeom = new THREE.CircleGeometry(1.8, 16);
    poolGeom.rotateX(-Math.PI / 2);
    const poolMat = new THREE.MeshBasicMaterial({ color: 0x00b4d8 });
    const pool = new THREE.Mesh(poolGeom, poolMat);
    pool.position.y = 0.81;
    group.add(pool);

    this.scene.add(group);
    this.worldObjects.push(group);

    let wellTimer = 0;
    this.interactables.push({
      type: 'mana_well',
      name: 'Sanctuary Mana Well',
      position: new THREE.Vector3(x, groundY + 0.8, z),
      radius: 3.5,
      getTelemetry: () => {
        wellTimer += 0.5;
        const current = (100 * wellTimer) / (wellTimer + 5);
        const rate = 500 / Math.pow(wellTimer + 5, 2);
        return {
          title: 'MANA WELL (HORIZONTAL ASYMPTOTE)',
          func: 'M(t) = 100t / (t + 5) [Plateau: lim t→∞ M(t) = 100]',
          details: `Regeneration rate dM/dt = 500/(t+5)² shows diminishing returns as mana approaches asymptote.`,
          metrics: [
            { label: 'Time t', val: `${wellTimer.toFixed(1)}s` },
            { label: 'Mana Regen M(t)', val: `${current.toFixed(1)} MP` },
            { label: 'Rate dM/dt', val: `${rate.toFixed(2)} MP/s` },
            { label: 'Asymptote Limit', val: '100 MP' }
          ]
        };
      },
      interact: () => {
        if (window.game && window.game.player) {
          window.game.player.restoreMana(35);
          if (window.soundEngine) window.soundEngine.playItemPickup();
          if (window.interfaceManager) {
            window.interfaceManager.showToast('Restored +35 Mana at Sanctuary Well (Horizontal Asymptote M(t) → 100)!', 'info');
          }
        }
      }
    });
  }

  update(delta) {
    const t = Date.now() * 0.001;

    // 1. Update Oscillating Platforms
    if (this.oscillatingPlatforms) {
      this.oscillatingPlatforms.forEach(p => p.update(t));
    }

    // 2. Bob and rotate collectibles
    this.collectibles.forEach(item => {
      if (!item.collected && item.mesh) {
        item.mesh.rotation.y += 1.8 * delta;
        item.mesh.position.y = item.baseY + Math.sin(t * 3.0 + item.position.x) * 0.15;
      }
    });

    // 3. Animate celestial rings
    this.animatedLights.forEach(lightObj => {
      if (lightObj.mesh) {
        lightObj.mesh.rotation.z += lightObj.speed * delta;
        lightObj.mesh.rotation.y += (lightObj.speed * 0.6) * delta;
      }
    });
  }
}

window.WorldManager = WorldManager;

