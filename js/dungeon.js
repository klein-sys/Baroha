/** Authored dungeon floors. Bounds are [left, right, north, south]. */
const dungeonFloors = [
  { name: 'The Cursed Forest', rooms: ['Forest Sanctuary', 'Rift Grove', 'Root Vault', 'Morgathia’s Arena', 'Canopy Cache'], color: 0x304936, wall: 0x33443a, width: 11, side: 1, traps: 1, boss: 'Morgathia' },
  { name: 'The Forgotten Kingdom', rooms: ['Crypt Landing', 'Burial Chamber', 'Bone Gallery', 'Vorthak’s Throne', 'Reliquary'], color: 0x3c4443, wall: 0x444650, width: 10, side: -1, traps: 2, boss: 'Vorthak' },
  { name: 'The Celestial Depths', rooms: ['Stargazer’s Rest', 'Shattered Observatory', 'Orbits Gallery', 'Sentinel’s Ring', 'Astral Archive'], color: 0x383456, wall: 0x3b3558, width: 12, side: 1, traps: 3, boss: 'the Harmonic Sentinel' },
  { name: 'Beyond Infinity', rooms: ['The Last Refuge', 'Fractured Limit', 'Gauntlet of Infinity', 'Azrael’s Sanctum', 'The Hidden Axiom'], color: 0x502e43, wall: 0x483449, width: 13, side: -1, traps: 4, boss: 'Azrael' }
];

function dungeonStoneTexture(paving, level) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext?.('2d');
  if (!context) return null;
  canvas.width = canvas.height = 256;
  context.fillStyle = paving ? '#77736d' : '#6d6763';
  context.fillRect(0, 0, 256, 256);
  let seed = level * 73 + (paving ? 1 : 38);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const rows = paving ? 3 : 5;
  const columns = paving ? 3 : 2;
  const width = 256 / columns;
  const height = 256 / rows;
  for (let row = 0; row < rows; row++) {
    for (let column = -1; column < columns; column++) {
      const x = column * width + (row % 2 ? width / 2 : 0);
      const y = row * height;
      const tone = Math.floor(172 + random() * 44);
      context.fillStyle = `rgb(${tone},${tone - 3},${tone - 4})`;
      context.fillRect(x + 2, y + 2, width - 3, height - 3);
      context.fillStyle = '#e8e0d7';
      context.fillRect(x + 3, y + 3, width - 5, 2);
    }
  }
  for (let i = 0; i < 1600; i++) {
    context.fillStyle = random() > 0.49 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.14)';
    context.fillRect(random() * 256, random() * 256, 1 + random() * 5, 1 + random() * 3);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function buildDungeonFloor(world) {
  const floor = dungeonFloors[world.currentRealm - 1];
  const state = world.dungeonProgress[world.currentRealm] ??= {};
  const side = floor.side;
  const width = floor.width;
  const level = world.currentRealm;
  const gap = [5, 6, 8, 9][level - 1];
  const galleryShift = [0, -3.5, 2.2, -3.5][level - 1];
  const annexEdge = galleryShift + side * width;
  const annexOuter = annexEdge + side * (gap + 10);
  const annexInner = annexEdge + side * gap;
  const heights = [[7.5, 6, 5, 10, 4], [5, 6, 5.5, 10, 4], [7, 10, 8.5, 13, 5], [8, 9, 11, 17, 6]][level - 1];
  world.floor = floor;
  world.rooms = [
    { name: floor.rooms[0], bounds: [-9, 9, 4, 30], entry: 0, exit: 3 },
    { name: floor.rooms[1], bounds: [-width, width, -17, 1], entry: 3, exit: 2.3 },
    { name: floor.rooms[2], bounds: [galleryShift - width, galleryShift + width, -46, -28], entry: 2.3, exit: 3, annex: side },
    { name: floor.rooms[3], bounds: [-16, 16, -78, -46], entry: 3, exit: 0 },
    { name: floor.rooms[4], bounds: [Math.min(annexInner, annexOuter), Math.max(annexInner, annexOuter), -41, -31], entry: 0, exit: 0, annex: -side }
  ];
  world.traps = [];
  world.scene.background = new THREE.Color(0x0b1019);
  world.scene.fog = new THREE.FogExp2(0x141726, 0.023);
  const ambient = new THREE.AmbientLight(0xb4c3e3, 0.24);
  world.scene.add(ambient);
  world.worldObjects.push(ambient);

  const box = (x, y, z, w, h, d, material) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    if (material.map && geometry.attributes.uv) {
      const uv = geometry.attributes.uv;
      const faceScales = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let index = 0; index < uv.count; index++) {
        const [horizontal, vertical] = faceScales[Math.floor(index / 4)];
        uv.setXY(index, uv.getX(index) * horizontal / 4, uv.getY(index) * vertical / 4);
      }
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    world.scene.add(mesh);
    world.worldObjects.push(mesh);
    return mesh;
  };
  const stone = world.getSharedMat('dungeon_stone', () => new THREE.MeshStandardMaterial({ color: floor.color, roughness: 0.92, map: dungeonStoneTexture(true, level) }));
  const wallMaterial = world.getSharedMat('dungeon_wall', () => new THREE.MeshStandardMaterial({ color: floor.wall, roughness: 0.82, map: dungeonStoneTexture(false, level) }));
  const trim = world.getSharedMat('dungeon_trim', () => new THREE.MeshStandardMaterial({ color: 0x242233, metalness: 0.15, roughness: 0.83 }));
  const lamp = world.getSharedMat('dungeon_lamp', () => new THREE.MeshBasicMaterial({ color: [0x81bd9c, 0x95d7bd, 0x9c83e7, 0xf4a77a][world.currentRealm - 1] }));
  const details = new Map();
  const detailBox = (x, y, z, width, height, depth, material, angle = 0) => {
    if (!THREE.InstancedMesh) {
      box(x, y, z, width, height, depth, material).rotation.z = angle;
      return;
    }
    if (!details.has(material)) details.set(material, []);
    details.get(material).push({ x, y, z, width, height, depth, angle });
  };
  let wallHeight = 5.6;
  const wall = (x1, x2, z1, z2) => {
    box((x1 + x2) / 2, wallHeight / 2, (z1 + z2) / 2, x2 - x1, wallHeight, z2 - z1, wallMaterial);
    detailBox((x1 + x2) / 2, 0.42, (z1 + z2) / 2, x2 - x1 + 0.1, 0.84, z2 - z1 + 0.1, trim);
    detailBox((x1 + x2) / 2, 4.25, (z1 + z2) / 2, x2 - x1 + 0.12, 0.22, z2 - z1 + 0.12, trim);
    world.addBoxCollider(x1, 0, z1, x2, wallHeight, z2, { tag: 'dungeon_wall' });
  };
  const floorSlab = (x1, x2, z1, z2) => {
    box((x1 + x2) / 2, -0.65, (z1 + z2) / 2, x2 - x1, 1.3, z2 - z1, stone);
    world.addWalkableSurface(x1, x2, z1, z2, 0);
  };

  const ceiling = (left, right, north, south, height) => {
    box((left + right) / 2, height + 0.24, (north + south) / 2, right - left, 0.48, south - north, trim);
    world.addBoxCollider(left, height, north, right, height + 0.48, south, {
      tag: 'dungeon_ceiling', isCeiling: true, blocksHorizontal: false
    });
  };

  const label = (name, x, y, z) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext?.('2d');
    if (!context) return;
    canvas.width = 512;
    canvas.height = 96;
    context.fillStyle = '#151b20';
    context.fillRect(0, 0, 512, 96);
    context.strokeStyle = '#b39763';
    context.lineWidth = 4;
    context.strokeRect(6, 6, 500, 84);
    context.fillStyle = '#eaddbb';
    context.font = '32px Georgia';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name, 256, 48, 474);
    const texture = new THREE.CanvasTexture(canvas);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 0.77), new THREE.MeshBasicMaterial({ map: texture }));
    plaque.position.set(x, y, z);
    world.scene.add(plaque);
    world.worldObjects.push(plaque);
  };

  for (const [index, room] of world.rooms.entries()) {
    const { bounds: [left, right, north, south], entry, exit, annex } = room;
    wallHeight = heights[index];
    const sky = level === 1 && (index === 1 || index === 3) || level === 3 && index === 2;
    if (sky) {
      ceiling(left, left + 2, north, south, wallHeight);
      ceiling(right - 2, right, north, south, wallHeight);
      for (let z = north + 2; z < south - 1; z += 6) {
        detailBox((left + right) / 2, wallHeight, z, right - left, 0.38, 0.5, trim);
      }
    } else {
      ceiling(left, right, north, south, wallHeight);
      for (let z = north + 1.8; z < south - 1; z += level === 2 ? 3.5 : 5.5) {
        detailBox((left + right) / 2, wallHeight - 0.24, z, right - left, 0.48, 0.4, trim);
      }
    }
    if (entry) {
      const lintel = box(0, 4.8, south + 0.38, 2 * entry + 1.15, 0.78, 0.88, trim);
      lintel.castShadow = true;
      world.addBoxCollider(-entry, 4.41, south - 0.06, entry, 5.19, south + 0.82, { isCeiling: true, blocksHorizontal: false });
      label(room.name, 0, 4.79, south + 0.835);
    }
    if (index === 0) label(room.name, -5.5, 3.4, north + 0.41);
    for (let z = north + 2.8; z < south - 2; z += 5.5) {
      for (const x of [left + 0.42, right - 0.42]) {
        detailBox(x, (wallHeight - 0.2) / 2, z, 0.68, wallHeight - 0.2, 0.88, trim);
        if (z + 5.5 >= south - 2) detailBox(x, 2.7, z, 0.72, 0.39, 0.72, lamp);
        if (level === 2 && index !== 4) {
          detailBox((x + (left + right) / 2) / 2, wallHeight - 0.8, z, (right - left) / 2 + 0.25, 0.38, 0.54, trim, x < 0 ? 0.10 : -0.10);
        }
      }
    }
    floorSlab(left, right, north, south);
    for (const [z, opening] of [[north, exit], [south, entry]]) {
      if (opening) {
        wall(left, -opening, z - 0.35, z + 0.35);
        wall(opening, right, z - 0.35, z + 0.35);
      } else {
        wall(left, right, z - 0.35, z + 0.35);
      }
    }
    for (const [x, direction] of [[left, -1], [right, 1]]) {
      if (annex === direction) {
        wall(x - 0.35, x + 0.35, north, -38.6);
        wall(x - 0.35, x + 0.35, -33.4, south);
      } else {
        wall(x - 0.35, x + 0.35, north, south);
      }
    }
  }
  wallHeight = 5.6;
  floorSlab(-3, 3, 1, 4);
  ceiling(-3, 3, 1, 4, 5.6);
  wall(-3.7, -3, 1, 4);
  wall(3, 3.7, 1, 4);

  for (const [z, width] of [[4, 3], [-17, 2.3], [-28, 2.3], [-46, 3]]) {
    for (const x of [-width, width]) {
      detailBox(x, 2.8, z, 0.72, 5.6, 0.95, trim);
      detailBox(x, 3.6, z + 0.52, 0.2, 0.6, 0.1, lamp);
    }
  }
  let arenaLight;
  for (const z of [9, -7, -33, -61]) {
    const tint = level === 1 && z === 9 ? 0xffbf7e : [0xa9d1a2, 0x88c9c1, 0xa1aafa, 0xffac87][level - 1];
    const light = new THREE.PointLight(tint, z === 9 ? 0.85 : 0.63, 25);
    if (z === -61) arenaLight = light;
    light.position.set(0, 4.6, z);
    world.scene.add(light);
    world.worldObjects.push(light);
  }

  const sealX = [-5.5, 5.5, -5.5, 5.5][level - 1];
  world.spawnRiftSeal(sealX, -8, state);
  world.spawnPiecewiseBridge(0, -22.5, state);
  // Each lift crosses the void between the gallery and its optional side chamber.
  world.spawnOscillatingPlatform(annexEdge + side * gap / 2, -36, 0.9 + level * 0.15, 0.9 + level * 0.12, -0.25);
  if (level >= 3) {
    world.oscillatingPlatforms[0].mesh.position.x = annexEdge + side * 2.35;
    world.spawnOscillatingPlatform(annexEdge + side * (gap - 2.35), -36, 1.05, 0.9 + level * 0.12, -0.2, Math.PI);
  }
  world.spawnManaWell(5.5, 10);
  if (world.currentRealm === 1) {
    world.spawnVillageHouse(0, 25, true, Math.PI);
    world.spawnTrainingDummy(5, 16);
    for (const [x, z] of [[-7, 15], [7, 16], [-9, -13], [9, -11], [-9, -34], [8, -41], [-12, -62], [12, -60]]) {
      world.spawnGothicTree(x, z);
    }
    world.spawnNPC(-3.8, 0, 9, 'Aster, the Last Guardian', 'Wizard of the Broken Threshold');
    world.spawnPracticeSeal(-6, 13);
  } else {
    for (const [x, z] of [[-7, 16], [7, 16], [-7, -12], [7, -12], [-8, -41], [8, -41], [-12, -63], [12, -63]]) {
      world.spawnSpectralBrazier(x, z);
    }
    const props = world.currentRealm === 2 ? [[-7, -3], [6, -6], [-7, -34], [6, -40]]
      : world.currentRealm === 3 ? [[-8, -14], [8, -8], [-8, -32], [9, -41]]
      : [[-7, -3], [9, -6], [-9, -34], [10, -40], [-12, -53], [12, -53]];
    for (const [x, z] of props) {
      if (world.currentRealm === 2) world.spawnTombstone(x, z);
      else world.spawnGothicPillar(x, z);
    }
  }
  world.spawnCollectible('potion', -5, 0, 11, 'Sanctuary Tonic');
  world.spawnCollectible('mana', 5, 0, -13, 'Resonance Crystal');
  if (level >= 3) {
    for (let step = 0; step < 3; step++) {
      const x = annexInner + side * (2.5 + step * 2.1);
      const top = (step + 1) * 0.38;
      box(x, top / 2, -36, 2.16, top, 4.9, stone);
      world.addWalkableSurface(x - 1.08, x + 1.08, -38.45, -33.55, top);
    }
  }
  world.spawnCollectible('chest', annexInner + side * (level >= 3 ? 6.7 : 5), 0, -36, 'Hidden Reliquary');

  if (world.currentRealm > 1) {
    const lane = world.currentRealm === 3 ? -1 : 1;
    for (let index = 0; index < world.currentRealm - 1; index++) {
      const x = 4 * lane * (index % 2 ? -1 : 1);
      const z = -32 - index * 4.8;
      wall(x - 1, x + 1, z - 0.6, z + 0.6);
    }
  }
  for (let index = 0; index < floor.traps; index++) {
    const x = (index % 2 === 0 ? 1 : -1) * (index < 2 ? 2.5 : 5);
    const z = -31 - index * 3.5;
    const mat = new THREE.MeshBasicMaterial({ color: 0x5b5272, transparent: true, opacity: 0.42 });
    const mesh = box(x, 0.035, z, 5.8, 0.06, 2.2, mat);
    world.traps.push({ mesh, phase: index * 1.35, x, sweeps: index >= 2 });
  }

  const lore = [
    'The Grove Record · Morgathia cut the roots that held this threshold together. The forest grew around the fracture.',
    'The Burial Ledger · Vorthak sealed the names of the living with the names of the dead. The crypt began to count both.',
    'The Observatory Log · The watchers built a sentinel to keep time. It kept repeating its final warning after the observatory fell.',
    'The Last Inscription · Numeria survived the first fracture because its guardians worked together. Their wards can be joined again.'
  ];
  const tablet = box(-2.9, 0.75, 5.1, 0.8, 1.5, 0.62, trim);
  world.interactables.push({
    type: 'floor_lore', name: 'Read the floor record', promptText: 'Read the floor record',
    position: tablet.position, radius: 2.5,
    interact: () => {
      if (!state.discovered) {
        state.discovered = true;
        window.game?.autoSaveProgress();
      }
      window.interfaceManager?.showToast(lore[level - 1], 'info');
    }
  });
  world.floorLore = lore[level - 1];

  const gateMaterial = new THREE.MeshStandardMaterial({ color: 0x826ac2, emissive: 0x2e1668, transparent: true, opacity: 0.78 });
  const gate = box(0, 2.4, -46, 6, 4.8, 0.5, gateMaterial);
  const gateCollider = world.addBoxCollider(-3, 0, -46.25, 3, 4.8, -45.75, { tag: 'arena_gate' });
  world.setArenaGate = closed => {
    gate.visible = closed;
    gateCollider.enabled = closed;
  };
  world.setArenaGate(!state.defeated);
  world.interactables.push({
    type: 'arena_gate',
    name: 'Arena Gate',
    position: new THREE.Vector3(0, 1.5, -44.7),
    radius: 3.4,
    interact: () => {
      const game = window.game;
      if (!game || state.defeated || game.enemies.isBossActive) return;
      if (!state.rift || !state.bridge) {
        window.interfaceManager?.showToast('Stabilize the Rift Seal and the continuity bridge first.', 'warning');
        return;
      }
      game.player.position.set(0, game.player.height + 0.1, -49);
      game.player.velocity.set(0, 0, 0);
      game.player.yaw = 0;
      game.startBossEncounter(world.currentRealm);
    }
  });

  const portalMaterial = new THREE.MeshStandardMaterial({ color: 0x696377, emissive: 0x191424, roughness: 0.4 });
  const portal = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.23, 10, 32), portalMaterial);
  portal.position.set(0, 2.15, -74);
  world.scene.add(portal);
  world.worldObjects.push(portal);
  const portalTarget = {
    type: 'descent_portal',
    name: 'Descent Portal',
    promptText: 'Portal locked',
    position: portal.position,
    radius: 3.4,
    interact: () => {
      if (!state.defeated) {
        window.interfaceManager?.showToast(`Defeat ${floor.boss} to open the portal.`, 'warning');
        return;
      }
      if (world.currentRealm === dungeonFloors.length) {
        window.game?.handleGameVictory();
      } else if (window.game) {
        window.game.transitionToRealm(world.currentRealm + 1);
        window.game.autoSaveProgress();
      }
    }
  };
  world.interactables.push(portalTarget);
  const lanterns = [];
  const rings = [];
  if (level === 1) {
    for (const z of [-51, -57, -69]) {
      lanterns.push([-14, 14].map(x => box(x, 2.7, z, 0.36, 0.65, 0.36, lamp)));
    }
  } else if (level === 3) {
    for (const [index, radius] of [2.7, 3.05, 3.4].entries()) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.058, 6, 32), lamp);
      ring.position.set(0, 3.1, -72 + index * 0.48);
      ring.rotation.x = (index + 1) * 0.26;
      ring.rotation.y = (index - 1) * 0.31;
      world.scene.add(ring);
      world.worldObjects.push(ring);
      rings.push(ring);
    }
  }

  world.setArenaReveal = (amount, progress = 1) => {
    const darkness = level === 1 && progress < 0.24 ? Math.max(0, 1 - progress / 0.18) : 0;
    arenaLight.intensity = state.defeated ? 1.05 : 0.15 + 0.48 * Math.max(amount, darkness);
    lanterns.forEach((pair, index) => {
      const lit = state.defeated || progress < 0.05 + index * 0.055 || (index === 2 && amount > 0.5);
      pair.forEach(lantern => { lantern.visible = lit; });
    });
    rings.forEach((ring, index) => {
      const tilt = state.defeated ? 0 : 1 - amount * 0.65;
      ring.rotation.x = (index + 1) * 0.26 * tilt;
      ring.rotation.y = (index - 1) * 0.31 * tilt;
    });
  };
  world.unlockDescent = () => {
    state.defeated = true;
    world.setArenaGate(false);
    portalTarget.promptText = world.currentRealm === dungeonFloors.length ? 'Restore Numeria' : 'Descend to the next floor';
    portalMaterial.color.setHex(0x81f9d0);
    portalMaterial.emissive.setHex(0x22866b);
    portalMaterial.emissiveIntensity = 1.5;
    arenaLight.color.setHex(level === 2 ? 0xffbb72 : 0xa6ffe1);
    world.setArenaReveal(1);
    if (!portal.userData.open) {
      portal.userData.open = true;
      const halo = new THREE.Mesh(new THREE.TorusGeometry(2.36, 0.06, 8, 36), lamp);
      portal.add(halo);
      world.animatedLights.push({ mesh: halo, speed: 0.35 });
    }
  };
  if (state.defeated) world.unlockDescent();

  for (const [material, parts] of details) {
    const batch = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, parts.length);
    const transform = new THREE.Object3D();
    parts.forEach(({ x, y, z, width, height, depth, angle }, index) => {
      transform.position.set(x, y, z);
      transform.scale.set(width, height, depth);
      transform.rotation.z = angle;
      transform.updateMatrix();
      batch.setMatrixAt(index, transform.matrix);
    });
    batch.instanceMatrix.needsUpdate = true;
    batch.frustumCulled = false;
    batch.receiveShadow = true;
    world.scene.add(batch);
    world.worldObjects.push(batch);
  }
}
