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
  function getScene(name) {
    if (!cache.has(name)) {
      cache.set(name, loader.loadAsync(BASE + name + '.glb')
        .then(({scene}) => scene)
        .catch(err => {
          cache.delete(name); // permit retry when an asset is restored
          console.warn('[Dark Fantasy] Could not load ' + name + ':', err);
          return null;
        }));
    }
    return cache.get(name);
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
        return clone;
      });
      o.material = Array.isArray(o.material) ? hidden : hidden[0];
    } else {
      o.visible = false;
    }
  }
  function attach(name, parent, fallback, options) {
    if (!parent || !name || location.protocol === 'file:') {
      if (location.protocol === 'file:' && !warningShown) {
        console.warn('[Dark Fantasy] GLB loading needs http://localhost (not file://).');
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
    if (!boss) return;
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
  worldGroup('spawnVillageHouse','village_house'); // separate bed group is left intact
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