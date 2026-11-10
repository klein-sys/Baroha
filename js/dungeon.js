/** Authored dungeon floors. Bounds are [left, right, north, south]. */
const dungeonFloors = [
  { name: 'The Cursed Forest', rooms: ['Forest Sanctuary', 'Rift Grove', 'Root Vault', 'Morgathia’s Arena', 'Canopy Cache'], color: 0x304936, wall: 0x33443a, width: 11, side: 1, traps: 1, boss: 'Morgathia' },
  { name: 'The Forgotten Kingdom', rooms: ['Crypt Landing', 'Burial Chamber', 'Bone Gallery', 'Vorthak’s Throne', 'Reliquary'], color: 0x3c4443, wall: 0x444650, width: 10, side: -1, traps: 2, boss: 'Vorthak' },
  { name: 'The Celestial Depths', rooms: ['Stargazer’s Rest', 'Shattered Observatory', 'Orbits Gallery', 'Sentinel’s Ring', 'Astral Archive'], color: 0x383456, wall: 0x3b3558, width: 12, side: 1, traps: 3, boss: 'the Harmonic Sentinel' },
  { name: 'Beyond Infinity', rooms: ['The Last Refuge', 'Fractured Limit', 'Gauntlet of Infinity', 'Azrael’s Sanctum', 'The Hidden Axiom'], color: 0x502e43, wall: 0x483449, width: 13, side: -1, traps: 4, boss: 'Azrael' }
];

function buildDungeonFloor(world) {
  const floor = dungeonFloors[world.currentRealm - 1];
  const state = world.dungeonProgress[world.currentRealm] ??= {};
  const side = floor.side;
  const width = floor.width;
  world.floor = floor;
  world.rooms = [
    { name: floor.rooms[0], bounds: [-9, 9, 4, 30], entry: 0, exit: 3 },
    { name: floor.rooms[1], bounds: [-width, width, -17, 1], entry: 3, exit: 2.3 },
    { name: floor.rooms[2], bounds: [-width, width, -46, -28], entry: 2.3, exit: 3, annex: side },
    { name: floor.rooms[3], bounds: [-16, 16, -78, -46], entry: 3, exit: 0 },
    { name: floor.rooms[4], bounds: side > 0 ? [width + 5, width + 15, -41, -31] : [-width - 15, -width - 5, -41, -31], entry: 0, exit: 0, annex: -side }
  ];
  world.traps = [];
  world.scene.background = new THREE.Color(0x0b1019);
  world.scene.fog = new THREE.FogExp2(0x141726, 0.023);
  const ambient = new THREE.AmbientLight(0xb4c3e3, 0.24);
  world.scene.add(ambient);
  world.worldObjects.push(ambient);

  const box = (x, y, z, w, h, d, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    world.scene.add(mesh);
    world.worldObjects.push(mesh);
    return mesh;
  };
  const stone = world.getSharedMat('dungeon_stone', () => new THREE.MeshStandardMaterial({ color: floor.color, roughness: 0.92 }));
  const wallMaterial = world.getSharedMat('dungeon_wall', () => new THREE.MeshStandardMaterial({ color: floor.wall, roughness: 0.82 }));
  const trim = world.getSharedMat('dungeon_trim', () => new THREE.MeshStandardMaterial({ color: 0x242233, metalness: 0.15, roughness: 0.83 }));
  const lamp = world.getSharedMat('dungeon_lamp', () => new THREE.MeshBasicMaterial({ color: [0x81bd9c, 0x95d7bd, 0x9c83e7, 0xf4a77a][world.currentRealm - 1] }));
  const wall = (x1, x2, z1, z2) => {
    box((x1 + x2) / 2, 2.8, (z1 + z2) / 2, x2 - x1, 5.6, z2 - z1, wallMaterial);
    box((x1 + x2) / 2, 0.42, (z1 + z2) / 2, x2 - x1 + 0.1, 0.84, z2 - z1 + 0.1, trim);
    box((x1 + x2) / 2, 4.25, (z1 + z2) / 2, x2 - x1 + 0.12, 0.22, z2 - z1 + 0.12, trim);
    world.addBoxCollider(x1, 0, z1, x2, 5.6, z2, { tag: 'dungeon_wall' });
  };
  const floorSlab = (x1, x2, z1, z2) => {
    box((x1 + x2) / 2, -0.65, (z1 + z2) / 2, x2 - x1, 1.3, z2 - z1, stone);
    world.addWalkableSurface(x1, x2, z1, z2, 0);
  };

  for (const { bounds: [left, right, north, south], entry, exit, annex } of world.rooms) {
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
  floorSlab(-3, 3, 1, 4);
  wall(-3.7, -3, 1, 4);
  wall(3, 3.7, 1, 4);

  for (const [z, width] of [[4, 3], [-17, 2.3], [-28, 2.3], [-46, 3]]) {
    for (const x of [-width, width]) {
      box(x, 2.8, z, 0.72, 5.6, 0.95, trim);
      box(x, 3.6, z + 0.52, 0.2, 0.6, 0.1, lamp);
    }
  }
  for (const z of [9, -7, -33, -61]) {
    const light = new THREE.PointLight(0xb8c9fa, 0.6, 24);
    light.position.set(0, 4.6, z);
    world.scene.add(light);
    world.worldObjects.push(light);
  }

  world.spawnRiftSeal(-5.5, -8, state);
  world.spawnPiecewiseBridge(0, -22.5, state);
  // Each lift crosses the void between the gallery and its optional side chamber.
  world.spawnOscillatingPlatform(side * (width + 2.5), -36, 1.0 + world.currentRealm * 0.15, 0.9 + world.currentRealm * 0.12, -0.35);
  world.spawnManaWell(5.5, 10);
  if (world.currentRealm === 1) {
    world.spawnVillageHouse(0, 25, true, Math.PI);
    world.spawnTrainingDummy(5, 16);
    for (const [x, z] of [[-7, 15], [7, 16], [-9, -13], [9, -11], [-9, -34], [8, -41], [-12, -62], [12, -60]]) {
      world.spawnGothicTree(x, z);
    }
    world.spawnNPC(0, 0, 7, 'The Last Guardian of Knowledge', 'Keeper of the Sanctuary');
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
  world.spawnCollectible('chest', side * (width + 10), 0, -36, 'Hidden Reliquary');

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
  world.unlockDescent = () => {
    state.defeated = true;
    world.setArenaGate(false);
    portalTarget.promptText = world.currentRealm === dungeonFloors.length ? 'Restore Numeria' : 'Descend to the next floor';
    portalMaterial.color.setHex(0x81f9d0);
    portalMaterial.emissive.setHex(0x22866b);
    portalMaterial.emissiveIntensity = 1.5;
  };
  if (state.defeated) world.unlockDescent();
}
