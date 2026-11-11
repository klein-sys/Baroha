/**
 * Baroha Dark Fantasy — non-destructive GLB visual overhaul, Three.js r128.
 * Install AFTER js/enemies.js and BEFORE js/game.js in index.html.
 * Does not change HP, AI, interactions, hitboxes, locomotion, or gameplay data.
 * Original meshes stay visible until the corresponding GLB loads successfully.
 * The player keeps its original animated pivot hierarchy.
 * No modules/bundler; all IIFE and globals for existing non-module script tags.
 */
(function () {
  'use strict';
  if (window.DarkFantasyAssets) return;
  if (!window.THREE || !THREE.GLTFLoader || typeof RobloxCharacter === 'undefined' ||
      typeof EnemiesManager === 'undefined' || typeof BossesManager === 'undefined' ||
      typeof WorldManager === 'undefined' || typeof realmArt === 'undefined') {
    console.warn('[Dark Fantasy] Required Three.js loaders or game classes were not found.');
    return;
  }

  const BASE = 'game-art/dark-fantasy/';
  const cache = new Map();
  const loader = new THREE.GLTFLoader();
  let warningShown = false;

  function inScene(node) {
    let p = node;
    while (p && p.parent) p = p.parent;
    return !!(p && p.isScene);
  }
  function markSharedResources(root) {
    if (!root || typeof root.traverse !== 'function') return;
    root.traverse(obj => {
      if (obj.geometry) {
        obj.geometry.userData = obj.geometry.userData || {};
        obj.geometry.userData.shared = true;
      }
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => {
          if (m) {
            m.userData = m.userData || {};
            m.userData.shared = true;
          }
        });
      }
    });
  }
  function decodeBase64ArrayBuffer(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }
  function hasOfflineGLB(name) {
    return !!(typeof window !== 'undefined' && window.DARK_FANTASY_OFFLINE_GLB && name && window.DARK_FANTASY_OFFLINE_GLB[name]);
  }
  function getScene(name) {
    if (!cache.has(name)) {
      const isFile = typeof location !== 'undefined' && location.protocol === 'file:';
      const gltfPromise = (isFile && hasOfflineGLB(name) && typeof loader.parse === 'function')
        ? new Promise((resolve, reject) => loader.parse(decodeBase64ArrayBuffer(window.DARK_FANTASY_OFFLINE_GLB[name]), '', resolve, reject))
        : loader.loadAsync(BASE + name + '.glb');

      cache.set(name, gltfPromise
        .then(({scene}) => {
          markSharedResources(scene);
          return scene;
        })
        .catch(err => {
          cache.delete(name); // permit retry when an asset is restored
          console.warn('[Dark Fantasy] Could not load ' + name + ':', err);
          return null;
        }));
    }
    return cache.get(name);
  }
  function filterGeometryByMinY(geom, minY) {
    if (!geom || !geom.attributes || !geom.attributes.position) return geom;
    const pos = geom.attributes.position;
    const idxAttr = geom.index;
    const kept = [];
    if (idxAttr) {
      const arr = idxAttr.array;
      for (let i = 0; i < arr.length; i += 3) {
        const a = arr[i], b = arr[i + 1], c = arr[i + 2];
        if ((pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3 >= minY) {
          kept.push(a, b, c);
        }
      }
    } else {
      for (let i = 0; i + 2 < pos.count; i += 3) {
        if ((pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3 >= minY) {
          kept.push(i, i + 1, i + 2);
        }
      }
    }
    if (kept.length === 0) return null;
    const cloned = geom.clone();
    cloned.setIndex(kept);
    cloned.userData = { shared: false };
    return cloned;
  }
  // Hide the mesh material rather than its entire Object3D; meshes can be animated parents.
  function hideOriginal(o) {
    if (!o) return;
    if (o.isMesh && o.material) {
      // Clone before hiding: shared Three.js materials may be used by unrelated
      // game objects, including fallback meshes that have not loaded yet.
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      const hidden = materials.map(mat => {
        const clone = mat.clone();
        clone.visible = false;
        clone.userData = Object.assign({}, clone.userData, { shared: false });
        return clone;
      });
      o.material = Array.isArray(o.material) ? hidden : hidden[0];
    } else {
      o.visible = false;
    }
  }
  function attach(name, parent, fallback, options) {
    const isFile = typeof location !== 'undefined' && location.protocol === 'file:';
    if (!parent || !name || (isFile && !hasOfflineGLB(name))) {
      if (isFile && !warningShown) {
        console.warn('[Dark Fantasy] GLB loading needs http://localhost or dark-fantasy-offline.js (not file://).');
        warningShown = true;
      }
      return Promise.resolve(null);
    }
    options = options || {};
    return getScene(name).then(template => {
      if (!template || !inScene(parent) || parent.userData.darkFantasyVisual) return null;
      // Assets contain only rigid parts, so clone(true) is correct and inexpensive.
      const visual = template.clone(true);
      visual.name = 'DF_' + name;
      const pos = options.position || [0, 0, 0];
      const scale = options.scale || [1, 1, 1];
      visual.position.set(pos[0],pos[1],pos[2]);
      visual.scale.set(scale[0],scale[1],scale[2]);
      visual.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = !!(window.game && window.game.renderer && window.game.renderer.shadowMap.enabled);
          obj.receiveShadow = obj.castShadow;
          obj.frustumCulled = true;
        }
      });
      parent.add(visual);
      (fallback || []).forEach(hideOriginal);
      parent.userData.darkFantasyVisual = visual;
      if (options.enemyMotion) parent.userData.realmModel = visual;
      return visual;
    });
  }
  const assets = window.DarkFantasyAssets = { BASE, attach, preload: names => Promise.all(names.map(getScene)), cache };

  // Reuse Baroha's existing native GLB substitution and SkeletonUtils cloning.
  // These are used for the high-frequency trees and the existing KayKit slots.
  Object.assign(realmArt, {
    pine: 'dark-fantasy/gothic_tree.glb',
    bareTree: 'dark-fantasy/gothic_tree.glb',
    knight: 'dark-fantasy/undead_knight.glb',
    scholar: 'dark-fantasy/skeleton_scholar.glb',
    chest: 'dark-fantasy/chest.glb',
    key: 'dark-fantasy/key.glb'
  });

  function wrap(proto, method, onResult) {
    const original = proto[method];
    if (typeof original !== 'function' || original.__darkFantasyWrap) return;
    function patched(...args) {
      const before = {
        world: Array.isArray(this.worldObjects) ? this.worldObjects.length : 0,
        skel: Array.isArray(this.summonedSkeletons) ? this.summonedSkeletons.length : 0,
        items: Array.isArray(this.collectibles) ? this.collectibles.length : 0
      };
      const result = original.apply(this, args);
      try { onResult.call(this, result, args, before); }
      catch (e) { console.warn('[Dark Fantasy] Visual attach failed in ' + method, e); }
      return result;
    }
    patched.__darkFantasyWrap = true;
    proto[method] = patched;
  }

  // ===== PLAYABLE CHARACTER: use the existing swing/walk/jump pivots =====
  wrap(RobloxCharacter.prototype, 'buildRobloxBody', function () {
    const torso = this.torso;
    const belt = torso.children.find(c => c.isMesh && c !== this.cape && c !== this.head);
    attach('hero_torso', torso, [torso,belt]);
    attach('hero_helmet', this.head, [this.head].concat(this.head.children.slice()));
    attach('hero_arm', this.leftArmPivot, [this.leftArm]);
    attach('hero_arm', this.rightArmPivot, [this.rightArm]);
    attach('hero_leg', this.leftLegPivot, [this.leftLeg]);
    attach('hero_leg', this.rightLegPivot, [this.rightLeg]);
    attach('hero_cape', this.cape, [this.cape]);
    attach('hero_runeblade', this.swordMesh, this.swordMesh.children.slice());
  });

  // First-person sword is a separate weapon rig in js/player.js. Keep its attack
  // animations by attaching a scaled replacement inside the existing swordGroup.
  if (typeof PlayerController !== 'undefined') {
    wrap(PlayerController.prototype, 'createViewmodel', function () {
      if (this.swordMesh) {
        attach('hero_runeblade', this.swordMesh, this.swordMesh.children.slice(), {
          scale: [.60, .60, .60]
        });
      }
    });
  }

  // ===== ENEMIES: native KayKit slots are mapped above; other types attach here =====
  const enemyModels = Object.freeze({
    imp: 'forest_imp', wolf: 'shadow_wolf',
    mage: 'phantom_mage', phantom: 'dimensional_phantom'
  });
  wrap(EnemiesManager.prototype, 'spawnEnemy', function (enemy, args) {
    const name = enemyModels[args[0]];
    if (enemy && name) attach(name, enemy.mesh, enemy.mesh.children.filter(c => c.isMesh), { enemyMotion: true });
  });

  // ===== BOSSES: preserve orbiting props and animated body subgroups =====
  wrap(BossesManager.prototype, 'spawnDarkWitch', function (boss) {
    if (!boss) return;
    const animated = new Set([boss.magicCircle].concat(boss.spellbooks));
    attach('dark_witch', boss.mesh, boss.mesh.children.filter(c => !animated.has(c)), {position:[0,-.35,0]});
  });
  wrap(BossesManager.prototype, 'spawnLich', function (boss) {
    if (!boss || boss.type === 'sentinel') return;
    const animated = new Set([boss.staff].concat(boss.runeCards));
    attach('lich_king', boss.mesh, boss.mesh.children.filter(c => !animated.has(c)), {position:[0,-.18,0]});
  });
  wrap(BossesManager.prototype, 'spawnSkeletonWarrior', function (_result,_args,before) {
    this.summonedSkeletons.slice(before.skel).forEach(s => {
      attach('summoned_skeleton', s.mesh, s.mesh.children.slice(), {position:[0,-.45,0]});
    });
  });
  wrap(BossesManager.prototype, 'spawnEternalDragon', function (boss) {
    if (!boss) return;
    attach('dragon_body', boss.mesh, boss.mesh.children.filter(c => c !== boss.head && c !== boss.wings));
    attach('dragon_head', boss.head, boss.head.children.filter(c => c !== boss.halo));
    boss.wings.children.forEach((wing,i) => {
      attach('dragon_wing', wing, wing.children.slice(), {scale:[i === 0 ? -1 : 1,1,1]});
    });
    // Keep the rotating halo and wing pivots (both referenced by BossesManager.update).
  });

  // ===== WORLD: only meshes/objects with safe visual-only fallbacks =====
  function worldGroup(method,asset,keep) {
    wrap(WorldManager.prototype,method,function(_result,_args,before) {
      if (method === 'spawnNPC' && _args[3]?.startsWith('Aster')) return;
      const created=this.worldObjects.slice(before.world);
      const target=created.find(o => o.isGroup) || created[0];
      if (!target) return;
      let fallback;
      if (keep) fallback=target.children.filter((c,i) => !keep(c,i,target));
      else fallback=target.isGroup ? target.children.slice() : [target];
      attach(asset,target,fallback);
    });
  }
  worldGroup('spawnGlowingMushroom','glow_mushroom',c=>c.isLight);
  worldGroup('spawnCastleGate','castle_gate',(c,i)=>i===3); // purple shield must disappear on unlock
  worldGroup('spawnCryptThrone','crypt_gate',(c,i)=>i===1); // portal vortex remains visible
  // House overhaul: keep wood gable roof, windows, corner beams and gold mullions while
  // opening the solid stone block into the walkable hollow interior & synced hinged door.
  wrap(WorldManager.prototype, 'spawnVillageHouse', function (_result, _args, before) {
    const created = this.worldObjects.slice(before.world);
    const target = created.find(o => o.isGroup) || created[0];
    if (!target || target.userData.darkFantasyVisual) return;
    if (typeof location !== 'undefined' && location.protocol === 'file:' && !hasOfflineGLB('village_house')) return;

    getScene('village_house').then(template => {
      if (!template || !inScene(target) || target.userData.darkFantasyVisual) return;
      const visual = template.clone(true);
      visual.name = 'DF_village_house';
      const shadowOn = !!(window.game && window.game.renderer && window.game.renderer.shadowMap.enabled);

      let stoneMat = null;
      let woodMat = null;
      let blackironMat = null;

      visual.traverse(obj => {
        if (!obj.isMesh || !obj.geometry) return;
        obj.castShadow = shadowOn;
        obj.receiveShadow = shadowOn;
        obj.frustumCulled = true;

        if (typeof obj.geometry.computeBoundingBox === 'function') {
          obj.geometry.computeBoundingBox();
        }
        const bb = obj.geometry.boundingBox;
        const matName = ((obj.material && obj.material.name) || '').toLowerCase();
        const sx = bb ? (bb.max.x - bb.min.x) : 0;
        const sy = bb ? (bb.max.y - bb.min.y) : 0;
        const sz = bb ? (bb.max.z - bb.min.z) : 0;

        if (matName.includes('stone') || (sx > 5.0 && sy > 3.2 && sz > 4.5 && sy < 4.5)) {
          // Solid stone cube would block interior & bed; apply its PBR stone material to hollow walls
          stoneMat = obj.material;
          obj.visible = false;
        } else if (matName.includes('blackiron') || matName.includes('iron') || (bb && bb.max.y > 6.4)) {
          // Preserve roof spire cone while stripping the static lower door mesh (y < 4.2)
          blackironMat = obj.material;
          const filtered = filterGeometryByMinY(obj.geometry, 4.2);
          if (filtered) {
            obj.geometry = filtered;
          } else {
            obj.visible = false;
          }
        } else if (matName.includes('wood') || (bb && sx > 6.5)) {
          woodMat = obj.material;
        }
      });

      target.add(visual);
      target.userData.darkFantasyVisual = visual;

      if (target.userData.houseWalls) {
        if (stoneMat) {
          target.userData.houseWalls.forEach(w => {
            if (w) w.material = stoneMat;
          });
        }
        if (woodMat && target.userData.houseFloors) {
          target.userData.houseFloors.forEach(f => {
            if (f) f.material = woodMat;
          });
        }
        if (blackironMat && target.userData.houseDoor) {
          target.userData.houseDoor.material = blackironMat;
        }
        (target.userData.houseExtras || []).forEach(hideOriginal);
      } else {
        (target.isGroup ? target.children.filter(c => c !== visual) : []).forEach(hideOriginal);
      }
    });
  });
  worldGroup('spawnBed','adventurer_bed');
  worldGroup('spawnSpectralBrazier','spectral_brazier',c=>c.isLight);
  worldGroup('spawnTrainingDummy','training_dummy');
  worldGroup('spawnDimensionalTower','dimensional_tower',(c,i)=>i===1); // activatable tip remains
  worldGroup('spawnAzraelNexus','azrael_nexus');
  worldGroup('spawnNPC','npc_spirit',(c,i)=>i===2); // preserve aura ring

  // Mesh-parent props need an offset because the original mesh origin is at its center.
  wrap(WorldManager.prototype,'spawnGothicPillar',function(_res,_args,before) {
    const mesh=this.worldObjects[before.world];
    if (mesh && mesh.isMesh) attach('gothic_pillar',mesh,[mesh],{position:[0,-4,0]});
  });
  wrap(WorldManager.prototype,'spawnTombstone',function(_res,_args,before) {
    const mesh=this.worldObjects[before.world];
    if (mesh && mesh.isMesh) attach('tombstone',mesh,[mesh],{position:[0,-.7,0]});
  });

  // Existing chest/key use native applyRealmModel (remapped above).
  const collectibleModels = {potion:'potion',mana:'mana',xp:'xp',golden_heart:'golden_heart',scroll:'scroll'};
  wrap(WorldManager.prototype,'spawnCollectible',function(_res,args,before) {
    const asset=collectibleModels[args[0]];
    if (!asset) return;
    this.collectibles.slice(before.items).forEach(item => {
      attach(asset,item.mesh,item.mesh.children.slice());
    });
  });

  // ===== CALCULUS WORLD OBJECTS: preserve visuals that signal puzzle state =====
  worldGroup('spawnRiftSeal','rift_seal_obelisks',(c,i)=>i>=4); // animated ring, reactive crystal
  worldGroup('spawnPiecewiseBridge','piecewise_bridge_pedestal',(c,i)=>i!==1); // transparent bridge + rune dial
  worldGroup('spawnLeylineShrine','leyline_shrine',(c,i)=>i===1); // rotating needle
  worldGroup('spawnOscillatingPlatform','oscillating_platform',()=>true); // keep slab status colors & crystal
  worldGroup('spawnManaWell','mana_well',(c,i)=>i===1); // preserve animated water surface

  console.info('[Dark Fantasy] Overhaul installed: player, minions, bosses, world props and loot.');
})();