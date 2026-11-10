/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * 3D Procedural World Generation, Realms, Interactive Objects, and Collectibles
 */

class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.currentRealm = 1;
    this.dungeonProgress = {};
    this.worldObjects = [];
    this.interactables = [];
    this.collectibles = [];
    this.animatedLights = [];
    this.oscillatingPlatforms = [];
    this.solidBridges = [];

    // Collision & Interactive Doors Subsystems
    this.colliders = [];
    this.walkableSurfaces = [];
    this.animatedDoors = [];
    this.sharedGeom = {};
    this.sharedMat = {};

    // Terrain size
    this.terrainWidth = 140;
    this.terrainDepth = 180;
    this.terrainMesh = null;

    // Skybox & Atmosphere
    this.ambientLight = null;
    this.directionalLight = null;
  }

  getSharedGeom(key, factory) {
    if (!this.sharedGeom[key]) {
      const g = factory();
      g.userData = g.userData || {};
      g.userData.shared = true;
      this.sharedGeom[key] = g;
    }
    return this.sharedGeom[key];
  }

  getSharedMat(key, factory) {
    if (!this.sharedMat[key]) {
      const m = factory();
      m.userData = m.userData || {};
      m.userData.shared = true;
      this.sharedMat[key] = m;
    }
    return this.sharedMat[key];
  }

  disposeHierarchy(root) {
    if (!root || typeof root.traverse !== 'function') return;
    root.traverse(obj => {
      if (obj.geometry && (!obj.geometry.userData || !obj.geometry.userData.shared)) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(mat => {
          if (mat && (!mat.userData || !mat.userData.shared)) {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          }
        });
      }
    });
  }

  clearWorld() {
    this.worldObjects.forEach(obj => {
      this.scene.remove(obj);
      this.disposeHierarchy(obj);
    });
    this.worldObjects = [];

    this.interactables.forEach(item => {
      if (item.mesh) {
        this.scene.remove(item.mesh);
        this.disposeHierarchy(item.mesh);
      }
    });
    this.interactables = [];

    this.collectibles.forEach(c => {
      if (c.mesh) {
        this.scene.remove(c.mesh);
        this.disposeHierarchy(c.mesh);
      }
    });
    this.collectibles = [];

    this.oscillatingPlatforms.forEach(p => {
      if (p.mesh) {
        this.scene.remove(p.mesh);
        this.disposeHierarchy(p.mesh);
      }
    });
    this.oscillatingPlatforms = [];

    this.solidBridges.forEach(b => {
      if (b.mesh) {
        this.scene.remove(b.mesh);
        this.disposeHierarchy(b.mesh);
      }
    });
    this.solidBridges = [];

    this.animatedLights = [];
    this.colliders = [];
    this.walkableSurfaces = [];
    this.animatedDoors = [];

    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      this.disposeHierarchy(this.terrainMesh);
      this.terrainMesh = null;
    }

    // Dispose shared caches when unloading whole realm
    Object.values(this.sharedGeom).forEach(g => g.dispose && g.dispose());
    Object.values(this.sharedMat).forEach(m => m.dispose && m.dispose());
    this.sharedGeom = {};
    this.sharedMat = {};
  }

  // =========================================================================
  // COLLISION & RAYCAST ENGINE (AABB / CYLINDER / WALKABLE FLOOR / LOS)
  // =========================================================================

  addBoxCollider(minX, minY, minZ, maxX, maxY, maxZ, opts = {}) {
    const col = {
      type: 'aabb',
      minX: Math.min(minX, maxX),
      minY: Math.min(minY, maxY),
      minZ: Math.min(minZ, maxZ),
      maxX: Math.max(minX, maxX),
      maxY: Math.max(minY, maxY),
      maxZ: Math.max(minZ, maxZ),
      enabled: opts.enabled !== false,
      blocksSight: opts.blocksSight !== false,
      blocksCamera: opts.blocksCamera !== false,
      blocksHorizontal: opts.blocksHorizontal !== false,
      isCeiling: !!opts.isCeiling,
      tag: opts.tag || ''
    };
    this.colliders.push(col);
    return col;
  }

  addCylinderCollider(x, z, radius, minY, maxY, opts = {}) {
    const col = {
      type: 'cylinder',
      x, z, radius,
      minY: Math.min(minY, maxY),
      maxY: Math.max(minY, maxY),
      enabled: opts.enabled !== false,
      blocksSight: opts.blocksSight !== false,
      blocksCamera: opts.blocksCamera !== false,
      blocksHorizontal: opts.blocksHorizontal !== false,
      tag: opts.tag || ''
    };
    this.colliders.push(col);
    return col;
  }

  addWalkableSurface(minX, maxX, minZ, maxZ, y) {
    this.walkableSurfaces.push({
      minX: Math.min(minX, maxX),
      maxX: Math.max(minX, maxX),
      minZ: Math.min(minZ, maxZ),
      maxZ: Math.max(minZ, maxZ),
      y
    });
  }

  resolveHorizontalCollision(pos, radius = 0.45, feetY = null, headY = null) {
    const bot = feetY !== null ? feetY : (pos.y - 1.8);
    const top = headY !== null ? headY : (pos.y + 0.08);

    // Two passes stabilize corner slides between adjacent walls/doors
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < this.colliders.length; i++) {
        const c = this.colliders[i];
        if (!c.enabled || !c.blocksHorizontal) continue;

        // Vertical overlap check (skip objects completely above head or below step threshold)
        if (top <= c.minY + 0.05 || bot >= c.maxY - 0.14) continue;

        if (c.type === 'aabb') {
          const cx = Math.max(c.minX, Math.min(pos.x, c.maxX));
          const cz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
          const dx = pos.x - cx;
          const dz = pos.z - cz;
          const distSq = dx * dx + dz * dz;

          if (distSq < radius * radius) {
            if (distSq > 1e-8) {
              const dist = Math.sqrt(distSq);
              const overlap = radius - dist;
              pos.x += (dx / dist) * overlap;
              pos.z += (dz / dist) * overlap;
            } else {
              // Inside box: push out along shallowest horizontal exit axis
              const penLeft = Math.abs(pos.x - c.minX);
              const penRight = Math.abs(c.maxX - pos.x);
              const penBack = Math.abs(pos.z - c.minZ);
              const penFront = Math.abs(c.maxZ - pos.z);
              const minPen = Math.min(penLeft, penRight, penBack, penFront);
              if (minPen === penLeft) pos.x = c.minX - radius;
              else if (minPen === penRight) pos.x = c.maxX + radius;
              else if (minPen === penBack) pos.z = c.minZ - radius;
              else pos.z = c.maxZ + radius;
            }
          }
        } else if (c.type === 'cylinder') {
          const dx = pos.x - c.x;
          const dz = pos.z - c.z;
          const minR = radius + c.radius;
          const distSq = dx * dx + dz * dz;
          if (distSq < minR * minR) {
            if (distSq > 1e-8) {
              const dist = Math.sqrt(distSq);
              const overlap = minR - dist;
              pos.x += (dx / dist) * overlap;
              pos.z += (dz / dist) * overlap;
            } else {
              pos.x += minR;
            }
          }
        }
      }
    }
  }

  checkCeilingCollision(pos, velocity, headY) {
    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      if (!c.enabled || !c.isCeiling) continue;
      if (pos.x >= c.minX - 0.3 && pos.x <= c.maxX + 0.3 &&
          pos.z >= c.minZ - 0.3 && pos.z <= c.maxZ + 0.3) {
        if (headY >= c.minY && headY <= c.maxY && velocity.y > 0) {
          velocity.y = 0;
          pos.y = c.minY - 0.08;
        }
      }
    }
  }

  _segmentColliderHitT(ax, ay, az, dx, dy, dz, c) {
    if (c.type === 'aabb') {
      let tMin = 0.0;
      let tMax = 1.0;

      // X slab
      if (Math.abs(dx) < 1e-8) {
        if (ax < c.minX || ax > c.maxX) return null;
      } else {
        const inv = 1 / dx;
        let t1 = (c.minX - ax) * inv;
        let t2 = (c.maxX - ax) * inv;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return null;
      }

      // Y slab
      if (Math.abs(dy) < 1e-8) {
        if (ay < c.minY || ay > c.maxY) return null;
      } else {
        const inv = 1 / dy;
        let t1 = (c.minY - ay) * inv;
        let t2 = (c.maxY - ay) * inv;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return null;
      }

      // Z slab
      if (Math.abs(dz) < 1e-8) {
        if (az < c.minZ || az > c.maxZ) return null;
      } else {
        const inv = 1 / dz;
        let t1 = (c.minZ - az) * inv;
        let t2 = (c.maxZ - az) * inv;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return null;
      }

      return tMin <= tMax ? tMin : null;
    } else if (c.type === 'cylinder') {
      const fx = ax - c.x;
      const fz = az - c.z;
      const a = dx * dx + dz * dz;
      if (a < 1e-8) return null;
      const b = 2 * (fx * dx + fz * dz);
      const cc = fx * fx + fz * fz - c.radius * c.radius;
      const disc = b * b - 4 * a * cc;
      if (disc < 0) return null;
      const sqrtD = Math.sqrt(disc);
      const t = (-b - sqrtD) / (2 * a);
      if (t < 0 || t > 1) return null;
      const hitY = ay + dy * t;
      if (hitY < c.minY || hitY > c.maxY) return null;
      return t;
    }
    return null;
  }

  hasLineOfSight(fromVec, toVec, ignoreCollider = null) {
    const dx = toVec.x - fromVec.x;
    const dy = toVec.y - fromVec.y;
    const dz = toVec.z - fromVec.z;
    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      if (!c.enabled || !c.blocksSight || c === ignoreCollider) continue;
      const hitT = this._segmentColliderHitT(fromVec.x, fromVec.y, fromVec.z, dx, dy, dz, c);
      if (hitT !== null && hitT > 0.02 && hitT < 0.96) {
        return false;
      }
    }
    return true;
  }

  clipCameraRay(targetVec, camVec, padding = 0.3) {
    const dx = camVec.x - targetVec.x;
    const dy = camVec.y - targetVec.y;
    const dz = camVec.z - targetVec.z;
    const totalDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (totalDist < 0.01) return;

    let bestT = 1.0;
    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      if (!c.enabled || !c.blocksCamera) continue;
      const hitT = this._segmentColliderHitT(targetVec.x, targetVec.y, targetVec.z, dx, dy, dz, c);
      if (hitT !== null && hitT > 0.05 && hitT < bestT) {
        bestT = hitT;
      }
    }

    if (bestT < 1.0) {
      const clippedDist = Math.max(0.45, bestT * totalDist - padding);
      const scale = clippedDist / totalDist;
      camVec.x = targetVec.x + dx * scale;
      camVec.y = targetVec.y + dy * scale;
      camVec.z = targetVec.z + dz * scale;
    }

    // Never allow third-person camera to clip below terrain or house floors
    const minCamY = this.getTerrainHeight(camVec.x, camVec.z) + 0.38;
    if (camVec.y < minCamY) {
      camVec.y = minCamY;
    }
  }

  checkProjectileColliderHit(pos, radius = 0.18) {
    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      if (!c.enabled) continue;
      if (pos.y + radius < c.minY || pos.y - radius > c.maxY) continue;
      if (c.type === 'aabb') {
        if (pos.x + radius >= c.minX && pos.x - radius <= c.maxX &&
            pos.z + radius >= c.minZ && pos.z - radius <= c.maxZ) {
          return true;
        }
      } else if (c.type === 'cylinder') {
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        const r = radius + c.radius;
        if (dx * dx + dz * dz <= r * r) return true;
      }
    }
    return false;
  }

  loadRealm(realmId) {
    this.currentRealm = realmId;
    this.clearWorld();

    this._elapsed = 0;
    buildDungeonFloor(this);

    // Play realm ambient soundtrack
    if (window.soundEngine) {
      window.soundEngine.startMusicForRealm(realmId, false);
    }
  }

  getTerrainHeight(x, z, feetY = null) {
    let h = -100;

    // Walkable building floors & door steps
    if (this.walkableSurfaces) {
      for (let i = 0; i < this.walkableSurfaces.length; i++) {
        const s = this.walkableSurfaces[i];
        if (x >= s.minX && x <= s.maxX && z >= s.minZ && z <= s.maxZ) {
          if (feetY === null || s.y <= feetY + 0.9) {
            if (s.y > h) h = s.y;
          }
        }
      }
    }

    // Check solidified bridges
    if (this.solidBridges) {
      for (let i = 0; i < this.solidBridges.length; i++) {
        const b = this.solidBridges[i];
        if (b.isSolid && Math.abs(x - b.x) <= b.halfWidth && Math.abs(z - b.z) <= b.halfLength) {
          if (b.y > h) h = b.y;
        }
      }
    }

    // Check oscillating platforms
    if (this.oscillatingPlatforms) {
      for (let i = 0; i < this.oscillatingPlatforms.length; i++) {
        const p = this.oscillatingPlatforms[i];
        if (p.mesh && Math.abs(x - p.mesh.position.x) <= p.radius && Math.abs(z - p.mesh.position.z) <= p.radius) {
          const top = p.mesh.position.y + 0.3;
          if ((feetY === null || feetY >= top - 0.65) && top > h) h = top;
        }
      }
    }

    return h;
  }

  // =========================================================================
  // ENVIRONMENT PROPS
  // =========================================================================

  spawnGothicTree(x, z) {
    const y = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Trunk (shared geometry/material for high performance)
    const trunkGeom = this.getSharedGeom('treeTrunk', () => new THREE.CylinderGeometry(0.35, 0.6, 6, 8));
    const trunkMat = this.getSharedMat('treeTrunk', () => new THREE.MeshStandardMaterial({ color: 0x1b140f, roughness: 0.9 }));
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 3;
    trunk.castShadow = true;
    group.add(trunk);

    // Twisted Foliage Crown
    const leavesGeom = this.getSharedGeom('treeLeaves', () => new THREE.DodecahedronGeometry(2.5, 1));
    const leavesMat = this.getSharedMat('treeLeaves', () => new THREE.MeshStandardMaterial({ color: 0x112211, roughness: 0.8 }));
    const leaves = new THREE.Mesh(leavesGeom, leavesMat);
    leaves.position.y = 6.2;
    leaves.castShadow = true;
    group.add(leaves);

    this.scene.add(group);
    this.worldObjects.push(group);
    group.rotation.y = Math.random() * Math.PI * 2;
    this.addCylinderCollider(x, z, 0.6, y, y + 6.5, { tag: 'tree' });
    applyRealmModel(Math.random() < 0.7 ? 'pine' : 'bareTree', group, [trunk, leaves], 6 + Math.random() * 3);
  }

  spawnGlowingMushroom(x, z) {
    const y = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Stem (shared geometry/material)
    const stemGeom = this.getSharedGeom('mushStem', () => new THREE.CylinderGeometry(0.08, 0.12, 0.6, 8));
    const stemMat = this.getSharedMat('mushStem', () => new THREE.MeshStandardMaterial({ color: 0xddddcc }));
    const stem = new THREE.Mesh(stemGeom, stemMat);
    stem.position.y = 0.3;
    group.add(stem);

    // Glowing Cap (emissive material eliminates 24 redundant PointLights while keeping bright bioluminescent glow)
    const capGeom = this.getSharedGeom('mushCap', () => new THREE.ConeGeometry(0.35, 0.4, 8));
    const capMat = this.getSharedMat('mushCap', () => new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00f5d4,
      emissiveIntensity: 1.5,
      roughness: 0.25
    }));
    const cap = new THREE.Mesh(capGeom, capMat);
    cap.position.y = 0.65;
    group.add(cap);

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
    pLeft.castShadow = true;
    group.add(pLeft);

    const pRight = new THREE.Mesh(pGeom, pMat);
    pRight.position.set(4, 4.5, 0);
    pRight.castShadow = true;
    group.add(pRight);

    // Cross arch
    const archGeom = new THREE.BoxGeometry(10, 1.5, 2);
    const arch = new THREE.Mesh(archGeom, pMat);
    arch.position.set(0, 9, 0);
    arch.castShadow = true;
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

    // Solid Gate Pillar & Locked Barrier Colliders
    this.addBoxCollider(x - 5, y, z - 1, x - 3, y + 9.5, z + 1, { tag: 'gate_pillar' });
    this.addBoxCollider(x + 3, y, z - 1, x + 5, y + 9.5, z + 1, { tag: 'gate_pillar' });
    const barrierCollider = this.addBoxCollider(x - 3, y, z - 0.35, x + 3, y + 8.5, z + 0.35, { tag: 'gate_barrier' });

    // Register interactable gate
    const gateObj = {
      type: 'gate',
      name: 'Witch\'s Castle Gate',
      promptText: 'Open Gate',
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
          barrierCollider.enabled = false;
          gateObj.promptText = 'Gate Open';
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
    const pGeom = this.getSharedGeom('gothicPillar', () => new THREE.CylinderGeometry(0.7, 0.8, 8, 8));
    const pMat = this.getSharedMat('gothicPillar', () => new THREE.MeshStandardMaterial({ color: 0x33333d, roughness: 0.8 }));
    const pillar = new THREE.Mesh(pGeom, pMat);
    pillar.position.set(x, y + 4, z);
    pillar.castShadow = true;
    this.scene.add(pillar);
    this.worldObjects.push(pillar);
    this.addCylinderCollider(x, z, 0.85, y, y + 8, { tag: 'pillar' });
  }

  spawnTombstone(x, z) {
    const y = this.getTerrainHeight(x, z);
    const geom = this.getSharedGeom('tombstone', () => new THREE.BoxGeometry(0.8, 1.4, 0.25));
    const mat = this.getSharedMat('tombstone', () => new THREE.MeshStandardMaterial({ color: 0x3a3d40, roughness: 0.9 }));
    const tomb = new THREE.Mesh(geom, mat);
    tomb.position.set(x, y + 0.7, z);
    tomb.rotation.y = (Math.random() - 0.5) * 0.4;
    tomb.castShadow = true;
    this.scene.add(tomb);
    this.worldObjects.push(tomb);
    this.addCylinderCollider(x, z, 0.5, y, y + 1.4, { tag: 'tombstone', blocksSight: false });
  }

  spawnSpectralBrazier(x, z) {
    const y = this.getTerrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const bGeom = this.getSharedGeom('brazierBase', () => new THREE.CylinderGeometry(0.5, 0.3, 1.8, 8));
    const bMat = this.getSharedMat('brazierBase', () => new THREE.MeshStandardMaterial({ color: 0x1f2421, metalness: 0.6 }));
    const base = new THREE.Mesh(bGeom, bMat);
    base.position.y = 0.9;
    group.add(base);

    // Green flame sphere
    const fGeom = this.getSharedGeom('brazierFlame', () => new THREE.SphereGeometry(0.3, 8, 8));
    const fMat = this.getSharedMat('brazierFlame', () => new THREE.MeshBasicMaterial({ color: 0x06d6a0 }));
    const flame = new THREE.Mesh(fGeom, fMat);
    flame.position.y = 1.9;
    group.add(flame);

    const light = new THREE.PointLight(0x06d6a0, 1.4, 10);
    light.position.y = 2.0;
    group.add(light);

    this.scene.add(group);
    this.worldObjects.push(group);
    this.addCylinderCollider(x, z, 0.55, y, y + 2.2, { tag: 'brazier', blocksSight: false });
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
      promptText: 'Enter Crypt',
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
  // VILLAGE HOUSES, INN & INTERACTIVE HINGED DOORS + BEDS (SLEEPING SYSTEM)
  // Preserves original architectural design (6.5 x 4.2 x 5.5 + Cone Roof + Dark Door)
  // with full solid wall collision, window collision, walkable floor & hinged door.
  // =========================================================================
  _localToWorld(originX, originY, originZ, yaw, lx, ly, lz) {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    return {
      x: originX + lx * c + lz * s,
      y: originY + ly,
      z: originZ - lx * s + lz * c
    };
  }

  _addLocalHouseCollider(originX, originY, originZ, yaw, minLx, minLy, minLz, maxLx, maxLy, maxLz, opts = {}) {
    const p1 = this._localToWorld(originX, originY, originZ, yaw, minLx, minLy, minLz);
    const p2 = this._localToWorld(originX, originY, originZ, yaw, maxLx, maxLy, maxLz);
    return this.addBoxCollider(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, opts);
  }

  spawnVillageHouse(x, z, hasBed = false, facingYaw = 0) {
    // Sample foundation corners so terrain hills never protrude through interior floor
    const corners = [
      this.getTerrainHeight(x, z),
      this.getTerrainHeight(x - 3.15, z - 2.75),
      this.getTerrainHeight(x + 3.15, z - 2.75),
      this.getTerrainHeight(x - 3.15, z + 2.75),
      this.getTerrainHeight(x + 3.15, z + 2.75)
    ];
    const baseY = Math.max(...corners);
    const floorThicknessOffset = 0.14;
    const innerFloorY = baseY + floorThicknessOffset;

    const group = new THREE.Group();
    group.position.set(x, baseY, z);
    group.rotation.y = facingYaw;

    const wallMat = this.getSharedMat('houseWall', () => new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 }));
    const floorMat = this.getSharedMat('houseFloor', () => new THREE.MeshStandardMaterial({ color: 0x5c3a1d, roughness: 0.85 }));
    const trimMat = this.getSharedMat('houseTrim', () => new THREE.MeshStandardMaterial({ color: 0x3b220d, roughness: 0.7 }));
    const glassMat = this.getSharedMat('houseGlass', () => new THREE.MeshStandardMaterial({
      color: 0xffe49e,
      emissive: 0xffb347,
      emissiveIntensity: 0.35,
      roughness: 0.2
    }));

    // Solid Wooden Foundation & Interior Floor Slab (matches village_house 6.3 x 5.5 footprint cleanly)
    const floorGeom = this.getSharedGeom('houseFoundation', () => new THREE.BoxGeometry(6.28, 1.0, 5.48));
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.position.set(0, floorThicknessOffset - 0.5, 0);
    floorMesh.receiveShadow = true;
    group.add(floorMesh);

    // Front porch threshold step for smooth walking entry across doorway
    const stepGeom = this.getSharedGeom('houseStep', () => new THREE.BoxGeometry(1.76, 0.35, 0.85));
    const stepMesh = new THREE.Mesh(stepGeom, floorMat);
    stepMesh.position.set(0, floorThicknessOffset - 0.22, 3.05);
    stepMesh.receiveShadow = true;
    group.add(stepMesh);

    // Register walkable interior floor + entrance step
    const fp1 = this._localToWorld(x, baseY, z, facingYaw, -3.12, 0, -2.72);
    const fp2 = this._localToWorld(x, baseY, z, facingYaw, 3.12, 0, 3.45);
    this.addWalkableSurface(fp1.x, fp2.x, fp1.z, fp2.z, innerFloorY);

    // Hollow Perimeter Walls matching village_house envelope (6.3 x 4.05 x 5.5, thickness 0.28)
    const backGeom = this.getSharedGeom('houseBackWall', () => new THREE.BoxGeometry(6.3, 4.05, 0.28));
    const backWall = new THREE.Mesh(backGeom, wallMat);
    backWall.position.set(0, 2.025, -2.61);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    group.add(backWall);

    const sideGeom = this.getSharedGeom('houseSideWall', () => new THREE.BoxGeometry(0.28, 4.05, 4.94));
    const leftWall = new THREE.Mesh(sideGeom, wallMat);
    leftWall.position.set(-3.01, 2.025, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(sideGeom, wallMat);
    rightWall.position.set(3.01, 2.025, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    // Rustic framed windows on left & right walls (fallback details hidden when dark-fantasy overhaul loads)
    const winFrameGeom = this.getSharedGeom('houseWinFrame', () => new THREE.BoxGeometry(0.34, 1.15, 1.35));
    const winPaneGeom = this.getSharedGeom('houseWinPane', () => new THREE.BoxGeometry(0.36, 0.9, 1.1));
    const windowMeshes = [];
    [-3.01, 3.01].forEach(wx => {
      const wf = new THREE.Mesh(winFrameGeom, trimMat);
      wf.position.set(wx, 2.1, 0);
      group.add(wf);
      windowMeshes.push(wf);
      const wp = new THREE.Mesh(winPaneGeom, glassMat);
      wp.position.set(wx, 2.1, 0);
      group.add(wp);
      windowMeshes.push(wp);
    });

    // Front wall split around 1.42m wide doorway (x in [-0.71, +0.71])
    const frontWingGeom = this.getSharedGeom('houseFrontWing', () => new THREE.BoxGeometry(2.44, 4.05, 0.28));
    const frontLeftWall = new THREE.Mesh(frontWingGeom, wallMat);
    frontLeftWall.position.set(-1.93, 2.025, 2.61);
    frontLeftWall.castShadow = true;
    frontLeftWall.receiveShadow = true;
    group.add(frontLeftWall);

    const frontRightWall = new THREE.Mesh(frontWingGeom, wallMat);
    frontRightWall.position.set(1.93, 2.025, 2.61);
    frontRightWall.castShadow = true;
    frontRightWall.receiveShadow = true;
    group.add(frontRightWall);

    // Front lintel header above doorway (y = 2.62 to 4.05)
    const lintelGeom = this.getSharedGeom('houseLintel', () => new THREE.BoxGeometry(1.42, 1.43, 0.28));
    const lintel = new THREE.Mesh(lintelGeom, wallMat);
    lintel.position.set(0, 3.335, 2.61);
    lintel.castShadow = true;
    lintel.receiveShadow = true;
    group.add(lintel);

    // Sloped Wooden Roof (Original ConeGeometry 5.2, 2.5, 4 preserved when fallback is active)
    const roofGeom = this.getSharedGeom('houseRoof', () => {
      const g = new THREE.ConeGeometry(5.2, 2.5, 4);
      g.rotateY(Math.PI / 4);
      return g;
    });
    const roofMat = this.getSharedMat('houseRoof', () => new THREE.MeshStandardMaterial({ color: 0x4a2c11, roughness: 0.7 }));
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 5.1;
    roof.castShadow = true;
    group.add(roof);

    // Hinged Wooden Door at Left Jamb (-0.71, 0.14, 2.67)
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-0.71, floorThicknessOffset, 2.67);

    const doorGeom = this.getSharedGeom('houseDoor', () => new THREE.BoxGeometry(1.42, 2.48, 0.16));
    const doorMat = this.getSharedMat('houseDoor', () => new THREE.MeshStandardMaterial({ color: 0x2e1806, roughness: 0.75 }));
    const doorMesh = new THREE.Mesh(doorGeom, doorMat);
    doorMesh.position.set(0.71, 1.24, 0);
    doorMesh.castShadow = true;
    doorPivot.add(doorMesh);

    // Brass Door Knob on both interior & exterior sides so hinge & handle side is obvious
    const knobGeom = this.getSharedGeom('doorKnob', () => new THREE.SphereGeometry(0.065, 8, 8));
    const knobMat = this.getSharedMat('doorKnob', () => new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.25 }));
    const knobOut = new THREE.Mesh(knobGeom, knobMat);
    knobOut.position.set(1.24, 1.05, 0.10);
    doorPivot.add(knobOut);
    const knobIn = new THREE.Mesh(knobGeom, knobMat);
    knobIn.position.set(1.24, 1.05, -0.10);
    doorPivot.add(knobIn);

    group.add(doorPivot);
    group.userData.houseWalls = [backWall, leftWall, rightWall, frontLeftWall, frontRightWall, lintel];
    group.userData.houseFloors = [floorMesh, stepMesh];
    group.userData.houseExtras = [roof, ...windowMeshes];
    group.userData.houseDoor = doorMesh;
    group.userData.doorPivot = doorPivot;

    this.scene.add(group);
    this.worldObjects.push(group);

    // Register Solid Wall Colliders (matches physical geometry strictly; roof does NOT block player below)
    this._addLocalHouseCollider(x, baseY, z, facingYaw, -3.15, -0.5, -2.75, 3.15, 4.15, -2.44, { tag: 'house_wall' });
    this._addLocalHouseCollider(x, baseY, z, facingYaw, -3.15, -0.5, -2.75, -2.84, 4.15, 2.75, { tag: 'house_wall' });
    this._addLocalHouseCollider(x, baseY, z, facingYaw, 2.84, -0.5, -2.75, 3.15, 4.15, 2.75, { tag: 'house_wall' });
    this._addLocalHouseCollider(x, baseY, z, facingYaw, -3.15, -0.5, 2.44, -0.71, 4.15, 2.75, { tag: 'house_wall' });
    this._addLocalHouseCollider(x, baseY, z, facingYaw, 0.71, -0.5, 2.44, 3.15, 4.15, 2.75, { tag: 'house_wall' });
    // Door header lintel acts strictly as ceiling clearance above doorway (no horizontal sticking)
    this._addLocalHouseCollider(x, baseY, z, facingYaw, -0.72, 2.62, 2.44, 0.72, 4.15, 2.75, {
      tag: 'house_lintel', blocksHorizontal: false, blocksSight: true, blocksCamera: false, isCeiling: true
    });

    // Closed Door Collider (synchronized with door open/close animation)
    const doorCollider = this._addLocalHouseCollider(x, baseY, z, facingYaw, -0.72, 0.0, 2.48, 0.72, 2.62, 2.80, {
      tag: 'house_door', enabled: true, blocksSight: true, blocksCamera: true
    });

    // Register Interactive Door Control (E KEY = OPEN / CLOSE DOOR)
    const doorWorldPos = this._localToWorld(x, innerFloorY, z, facingYaw, 0, 1.25, 2.67);
    const doorNormalOut = this._localToWorld(0, 0, 0, facingYaw, 0, 0, 1);
    const doorState = {
      pivot: doorPivot,
      isOpen: false,
      isAnimating: false,
      elapsed: 0,
      duration: 0.36,
      startRot: 0,
      targetRot: 0
    };
    this.animatedDoors.push(doorState);

    const doorInteractObj = {
      type: 'door',
      name: 'House Door',
      ignoreCollider: doorCollider,
      get promptText() {
        return doorState.isOpen ? 'Close Door' : 'Open Door';
      },
      position: new THREE.Vector3(doorWorldPos.x, doorWorldPos.y, doorWorldPos.z),
      radius: 2.9,
      interact: () => {
        if (doorState.isAnimating) return;
        const nextOpen = !doorState.isOpen;

        // If closing while player stands inside the doorway slab, gently step player clear along doorway normal
        if (!nextOpen && window.game && window.game.player) {
          const p = window.game.player.position;
          const dx = p.x - doorWorldPos.x;
          const dz = p.z - doorWorldPos.z;
          const dotOut = dx * doorNormalOut.x + dz * doorNormalOut.z;
          const perpDist = Math.abs(dx * doorNormalOut.z - dz * doorNormalOut.x);
          if (Math.abs(dotOut) < 0.72 && perpDist < 0.95) {
            const sign = dotOut >= 0 ? 1 : -1;
            const push = (0.78 - Math.abs(dotOut)) * sign;
            p.x += doorNormalOut.x * push;
            p.z += doorNormalOut.z * push;
          }
        }

        doorState.isOpen = nextOpen;
        doorState.isAnimating = true;
        doorState.elapsed = 0;
        doorState.startRot = doorPivot.rotation.y;
        doorState.targetRot = nextOpen ? -Math.PI * 0.54 : 0;

        // Synchronize collision state cleanly with door state
        doorCollider.enabled = !nextOpen;

        if (window.soundEngine && window.soundEngine.playDoorToggle) {
          window.soundEngine.playDoorToggle(nextOpen);
        }
      }
    };
    this.interactables.push(doorInteractObj);

    // If house contains an interactive bed (Inn)
    if (hasBed) {
      this.spawnBed(x, innerFloorY, z, facingYaw);
    }
  }

  spawnBed(houseX, floorY, houseZ, facingYaw = 0) {
    // Position bed comfortably in rear half of Inn so open doorway space stays unobstructed
    const bedWorld = this._localToWorld(houseX, floorY, houseZ, facingYaw, 0, 0, -0.95);
    const group = new THREE.Group();
    group.position.set(bedWorld.x, floorY, bedWorld.z);
    group.rotation.y = facingYaw;

    // Wooden Bed Frame
    const frameGeom = new THREE.BoxGeometry(1.6, 0.45, 2.5);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x5c3818, roughness: 0.7 });
    const frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.y = 0.22;
    frame.castShadow = true;
    group.add(frame);

    // Mattress & Red Blanket (Roblox style)
    const matGeom = new THREE.BoxGeometry(1.5, 0.35, 2.4);
    const matMat = new THREE.MeshStandardMaterial({ color: 0xb5179e, roughness: 0.6 });
    const mattress = new THREE.Mesh(matGeom, matMat);
    mattress.position.y = 0.55;
    mattress.castShadow = true;
    group.add(mattress);

    // White Pillow
    const pilGeom = new THREE.BoxGeometry(1.2, 0.22, 0.6);
    const pilMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.4 });
    const pillow = new THREE.Mesh(pilGeom, pilMat);
    pillow.position.set(0, 0.75, -0.82);
    group.add(pillow);

    this.scene.add(group);
    this.worldObjects.push(group);

    // Solid furniture collider on the bed (blocksSight: false so walls/door gate line-of-sight cleanly)
    this._addLocalHouseCollider(houseX, floorY, houseZ, facingYaw, -0.82, 0.0, -2.38, 0.82, 1.05, 0.48, {
      tag: 'furniture_bed', blocksSight: false, blocksCamera: false
    });

    // Register bed with proximity interaction
    this.interactables.push({
      type: 'bed',
      name: 'Adventurer\'s Bed',
      promptText: 'Sleep',
      position: new THREE.Vector3(bedWorld.x, floorY + 0.8, bedWorld.z),
      radius: 2.8,
      interact: () => {
        if (window.dayNightManager?.isSleeping) return;
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
    post.castShadow = true;
    group.add(post);

    // Straw Body
    const strawGeom = new THREE.CylinderGeometry(0.45, 0.4, 1.2, 8);
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xd4a373 });
    const straw = new THREE.Mesh(strawGeom, strawMat);
    straw.position.y = 1.3;
    straw.castShadow = true;
    group.add(straw);

    // Crossbar arms
    const barGeom = new THREE.BoxGeometry(1.6, 0.18, 0.18);
    const bar = new THREE.Mesh(barGeom, postMat);
    bar.position.y = 1.5;
    group.add(bar);

    this.scene.add(group);
    this.worldObjects.push(group);
    this.addCylinderCollider(x, z, 0.55, y, y + 2.3, { tag: 'training_dummy', blocksSight: false });
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
    this.addCylinderCollider(x, z, 1.4, y, y + 9.0, { tag: 'tower', blocksSight: false });

    // Tower activation
    let activated = false;
    this.interactables.push({
      type: 'tower',
      name: name,
      promptText: `Activate ${name}`,
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
      promptText: 'Enter Nexus',
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
    if (this.dungeonProgress[this.currentRealm]?.loot?.includes(name)) return;
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
    this.addCylinderCollider(x, z, 0.55, groundY, groundY + 2.2, { tag: 'npc', blocksSight: false });

    // Register NPC interactable
    this.interactables.push({
      type: 'npc',
      name: name,
      role: role,
      promptText: `Speak to ${name}`,
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
  spawnRiftSeal(x, z, state) {
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
      ob.castShadow = true;
      group.add(ob);
      this.addCylinderCollider(x + Math.cos(angle) * 2.2, z + Math.sin(angle) * 2.2, 0.45, groundY, groundY + 3.5, {
        tag: 'rift_obelisk', blocksSight: false
      });
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
    let freqIndex = state.rift ? 3 : 0;
    if (state.rift) {
      core.scale.setScalar(1.5);
      coreMat.emissive.setHex(0x00ff88);
      ringMat.emissive.setHex(0x38ef7d);
    }

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
        if (state.rift) {
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
          state.rift = true;
          core.scale.set(1.5, 1.5, 1.5);
          coreMat.emissive.setHex(0x00ff88);
          ringMat.emissive.setHex(0x38ef7d);
          if (window.soundEngine) window.soundEngine.playChestOpen();
          if (window.interfaceManager) {
            window.interfaceManager.showToast('✨ RIFT SEAL BREACHED! Frequency x → 3 reached Limit Power = 6.00! Arena ward weakened (+150 XP)!', 'success');
          }
          window.game?.player.addXp(150);
          window.game?.autoSaveProgress();
          window.interfaceManager?.updateQuestHUD();
        } else {
          const val = (curX * curX - 9) / (curX - 3);
          if (window.soundEngine) window.soundEngine.playMagicBolt();
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
  spawnPiecewiseBridge(x, z, state) {
    const groundY = -0.5;
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
    pedestal.position.set(0, 1.4, 7.5);
    group.add(pedestal);

    // Glowing Rune Dial
    const dialGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const dialMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffaa00, emissiveIntensity: 0.5 });
    const dial = new THREE.Mesh(dialGeom, dialMat);
    dial.position.set(0, 2.5, 7.5);
    group.add(dial);

    this.scene.add(group);
    this.worldObjects.push(group);
    this.addCylinderCollider(x, z + 7.5, 0.65, 0, 2.2, { tag: 'bridge_pedestal', blocksSight: false });
    const bridgeCollision = {
      x: x,
      z: z,
      y: groundY + 0.5,
      halfWidth: bridgeWidth / 2 + 0.5,
      halfLength: bridgeLength / 2 + 0.5,
      isSolid: Boolean(state.bridge)
    };
    this.solidBridges.push(bridgeCollision);
    const makeSolid = () => {
      bridgeCollision.isSolid = true;
      slabMat.opacity = 0.95;
      slabMat.color.setHex(0xd4af37);
      slabMat.emissive.setHex(0xffaa00);
      slabMat.emissiveIntensity = 0.4;
    };
    if (state.bridge) makeSolid();

    // Tuning k parameters: [-1, 0, 1, 2, 3]
    const kValues = [-1.0, 0.0, 1.0, 2.0];
    let kIndex = state.bridge ? 2 : 0;

    const bridgeInteract = {
      type: 'calculus_bridge',
      name: 'Piecewise Bridge Rune Pedestal',
      position: new THREE.Vector3(x, 1.25, z + 7.5),
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
        if (state.bridge) return;
        kIndex = (kIndex + 1) % kValues.length;
        const k = kValues[kIndex];
        const leftLimit = 2 * k + 3;
        const rightLimit = 5.0;
        const jump = Math.abs(leftLimit - rightLimit);
        const isContinuous = jump < 0.01;

        if (isContinuous) {
          makeSolid();
          state.bridge = true;
          window.soundEngine?.playMathCorrect();
          window.interfaceManager?.showToast('Bridge stabilized. Left limit = right limit = f(2).', 'success');
          window.interfaceManager?.updateQuestHUD();
          window.game?.autoSaveProgress();
        } else {
          bridgeCollision.isSolid = false;
          slabMat.opacity = 0.35;
          slabMat.color.setHex(0x4a4e69);
          slabMat.emissive = new THREE.Color(0x000000);
          if (window.soundEngine) window.soundEngine.playMagicBolt();
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
    this.addCylinderCollider(x, z, 1.75, groundY, groundY + 1.5, { tag: 'leyline_altar', blocksSight: false });

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
          if (window.soundEngine) window.soundEngine.playMagicBolt();
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
        platformObj.previousY = group.position.y;
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
    this.addCylinderCollider(x, z, 2.05, groundY, groundY + 0.9, { tag: 'mana_well', blocksSight: false });

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
    if (!this._elapsed) this._elapsed = 0;
    this._elapsed += delta;
    const t = this._elapsed;

    // 1. Update Animated Hinged Doors (smooth cubic ease-out)
    if (this.animatedDoors && this.animatedDoors.length > 0) {
      for (let i = 0; i < this.animatedDoors.length; i++) {
        const d = this.animatedDoors[i];
        if (d.isAnimating) {
          d.elapsed += delta;
          const p = Math.min(1.0, d.elapsed / d.duration);
          const ease = 1 - Math.pow(1 - p, 3);
          d.pivot.rotation.y = d.startRot + (d.targetRot - d.startRot) * ease;
          if (p >= 1.0) {
            d.pivot.rotation.y = d.targetRot;
            d.isAnimating = false;
          }
        }
      }
    }

    // 2. Update Oscillating Platforms
    if (this.oscillatingPlatforms) {
      for (let i = 0; i < this.oscillatingPlatforms.length; i++) {
        this.oscillatingPlatforms[i].update(t);
      }
    }

    const player = window.game?.player;
    for (const trap of this.traps || []) {
      const phase = (t + trap.phase) % 4.5;
      const active = phase >= 3.5 && phase < 4.1;
      if (trap.sweeps) trap.mesh.position.x = trap.x + 3.5 * Math.sin((t + trap.phase) * 1.45);
      trap.mesh.material.color.setHex(active ? 0xff5340 : phase >= 2.4 && phase < 3.5 ? 0xfbb756 : 0x5b5272);
      const position = trap.mesh.position;
      if (active && player && Math.abs(player.position.x - position.x) < 2.9
        && Math.abs(player.position.z - position.z) < 1.1 && player.position.y < player.height + 0.45) {
        player.takeDamage(7 + this.currentRealm * 4);
      }
    }

    // 3. Bob and rotate collectibles
    for (let i = 0; i < this.collectibles.length; i++) {
      const item = this.collectibles[i];
      if (!item.collected && item.mesh) {
        item.mesh.rotation.y += 1.8 * delta;
        item.mesh.position.y = item.baseY + Math.sin(t * 3.0 + item.position.x) * 0.15;
      }
    }

    // 4. Animate celestial rings
    for (let i = 0; i < this.animatedLights.length; i++) {
      const lightObj = this.animatedLights[i];
      if (lightObj.mesh) {
        lightObj.mesh.rotation.z += lightObj.speed * delta;
        lightObj.mesh.rotation.y += (lightObj.speed * 0.6) * delta;
      }
    }
  }
}

window.WorldManager = WorldManager;

