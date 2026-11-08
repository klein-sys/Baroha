/**
 * AUTOMATED REGRESSION & VALIDATION TEST SUITE
 * Uses diagnosing-bugs disciplined testing methodology
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== RUNNING MATHBOUND COMPREHENSIVE TEST SUITE ===');

// Mock browser globals
global.window = global;
global.window.addEventListener = () => {};
global.document = {
  getElementById: (id) => ({
    innerText: '',
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    addEventListener: () => {},
    querySelectorAll: () => [],
    appendChild: () => {},
    focus: () => {}
  }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  exitPointerLock: () => {}
};
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = v; },
  removeItem(k) { delete this.store[k]; }
};

// Mock THREE.js
global.THREE = {
  Vector3: class {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    clone() { return new global.THREE.Vector3(this.x, this.y, this.z); }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
    length() { return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z); }
    lengthSq() { return this.x*this.x + this.y*this.y + this.z*this.z; }
    normalize() { const l = this.length() || 1; this.x /= l; this.y /= l; this.z /= l; return this; }
    distanceTo(v) { return this.clone().sub(v).length(); }
    project() { return this; }
  },
  Color: class {
    constructor(c = 0) { this.c = c; }
    copy(c) { this.c = c.c; return this; }
    lerpColors() { return this; }
  },
  Group: class {
    constructor() { this.children = []; this.position = new global.THREE.Vector3(); this.rotation = { x: 0, y: 0, z: 0, set() {} }; }
    add(m) { this.children.push(m); }
    remove() {}
    lookAt() {}
  },
  Mesh: class {
    constructor() { this.position = new global.THREE.Vector3(); this.rotation = { x: 0, y: 0, z: 0, set() {} }; this.scale = { set() {} }; }
    lookAt() {}
  },
  Scene: class {
    constructor() { this.children = []; }
    add(m) { this.children.push(m); }
    remove() {}
  },
  BoxGeometry: class {},
  SphereGeometry: class {},
  CylinderGeometry: class {},
  ConeGeometry: class { rotateX() {} },
  RingGeometry: class {},
  PlaneGeometry: class {},
  OctahedronGeometry: class {},
  TorusGeometry: class {},
  BufferGeometry: class { setAttribute() {} computeVertexNormals() {} },
  BufferAttribute: class {},
  MeshBasicMaterial: class {},
  MeshStandardMaterial: class {},
  HemisphereLight: class { constructor() { this.position = new global.THREE.Vector3(); } },
  DirectionalLight: class { constructor() { this.position = new global.THREE.Vector3(); } },
  MathUtils: { lerp: (a, b, t) => a + (b - a) * t },
  DoubleSide: 2
};

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message);
    failures++;
  } else {
    console.log('✅ PASS:', message);
  }
}

// 1. Load calculus.js
try {
  const code = fs.readFileSync('js/calculus.js', 'utf8');
  vm.runInThisContext(code);
  assert(typeof (global.CalculusManager || global.window.CalculusManager) === 'function', 'CalculusManager class defined');
  assert(global.calculusManager instanceof global.CalculusManager, 'calculusManager instance created');

  // Verify Question Banks
  const cm = global.calculusManager;
  let totalQuestions = 0;
  for (const realm of ['realm1', 'realm2', 'realm3']) {
    const list = cm.questionBank[realm];
    assert(list && list.length > 0, `${realm} has questions`);
    list.forEach(q => {
      totalQuestions++;
      assert(q.topic && q.topic.length > 0, `Question ${q.id} has topic`);
      assert(q.damage && q.damage > 0, `Question ${q.id} has damage value`);
      if (q.type === 'mcq') {
        const correctCount = q.options.filter(o => o.isCorrect).length;
        assert(correctCount === 1, `Question ${q.id} has exactly 1 correct option`);
      } else {
        assert(q.correctAnswer && q.acceptableAnswers.length > 0, `Numeric Question ${q.id} has acceptable answers`);
      }
    });
  }
  console.log(`Verified ${totalQuestions} mathematical calculus questions.`);
} catch (e) {
  assert(false, `calculus.js execution: ${e.message}`);
}

// 2. Load missions.js
try {
  const code = fs.readFileSync('js/missions.js', 'utf8');
  vm.runInThisContext(code);
  assert(typeof global.MissionsManager === 'function', 'MissionsManager class defined');
  const mm = global.missionsManager;
  assert(!mm.hasAllForestKeys(), 'Starts with < 3 keys');
  mm.recordKeyCollected();
  mm.recordKeyCollected();
  mm.recordKeyCollected();
  assert(mm.hasAllForestKeys(), '3 keys collected allows forest keys unlock');
} catch (e) {
  assert(false, `missions.js execution: ${e.message}`);
}

// 3. Load inventory.js
try {
  const code = fs.readFileSync('js/inventory.js', 'utf8');
  vm.runInThisContext(code);
  assert(typeof global.InventoryManager === 'function', 'InventoryManager class defined');
  const inv = global.inventoryManager;
  inv.addItem('golden_heart', 'Golden Heart', '💛', 'Test', 'consumable', 2);
  const gh = inv.items.find(i => i.id === 'golden_heart');
  assert(gh && gh.qty === 2, 'Inventory correctly adds items');
} catch (e) {
  assert(false, `inventory.js execution: ${e.message}`);
}

// 4. Load bosses.js and check realmId
try {
  const code = fs.readFileSync('js/bosses.js', 'utf8');
  vm.runInThisContext(code);
  assert(typeof global.BossesManager === 'function', 'BossesManager class defined');
  const bm = new global.BossesManager(new global.THREE.Scene());
  const witch = bm.spawnDarkWitch();
  assert(witch.name === 'The Dark Witch', 'Dark witch spawned');
  // Check realmId property
  assert(witch.realmId === 1, 'Dark Witch has realmId === 1');
  const lich = bm.spawnLich();
  assert(lich.realmId === 2, 'Lich has realmId === 2');
  const dragon = bm.spawnEternalDragon();
  assert(dragon.realmId === 3, 'Eternal Dragon has realmId === 3');
} catch (e) {
  assert(false, `bosses.js execution: ${e.message}`);
}

// 5. Load dev.js and verify all Dev functions
try {
  const code = fs.readFileSync('js/dev.js', 'utf8');
  vm.runInThisContext(code);
  assert(typeof global.DevConsoleManager === 'function', 'DevConsoleManager class defined');
  const dev = global.devConsoleManager;
  assert(dev !== null, 'DevConsoleManager instance created');

  // Setup mock game player
  global.game = {
    isRunning: true,
    isPaused: false,
    player: {
      hp: 50,
      maxHp: 100,
      mana: 20,
      maxMana: 100,
      hearts: 2,
      isInvulnerable: false,
      level: 1,
      rankTitle: 'Novice Adventurer',
      walkSpeed: 8,
      sprintSpeed: 14,
      gravity: 24,
      jumpForce: 9,
      position: new global.THREE.Vector3(0, 0, 0),
      velocity: new global.THREE.Vector3(0, 0, 0),
      setCheckpoint() {},
      equippedWeapon: { damage: 35 }
    },
    enemies: {
      isBossActive: true,
      activeBoss: { name: 'Test Boss', hp: 500 },
      bossHp: 500,
      bossMaxHp: 500,
      enemies: [],
      damageBoss(d) { this.bossHp -= d; }
    }
  };

  // Test God Mode
  dev.toggleGodMode();
  assert(dev.isGodMode === true, 'Dev God Mode turned ON');
  assert(global.game.player.hp === 100, 'God Mode restores full HP');
  assert(global.game.player.hearts === 5, 'God Mode restores full hearts');

  // Test Speed Multiplier
  dev.setSpeed(2.5);
  assert(global.game.player.walkSpeed === 20, 'Dev Speed multiplier applied (8 * 2.5 = 20)');

  // Test Noclip
  dev.toggleNoclip();
  assert(dev.isNoclip === true, 'Noclip mode active');
  assert(global.game.player.gravity === 0, 'Gravity disabled during noclip');

  // Test Max Level
  dev.maxLevel();
  assert(global.game.player.level === 4, 'Max Level sets level to 4');
  assert(global.game.player.rankTitle === 'Legendary Guardian', 'Max Level grants Legendary Guardian title');

  // Test Boss Kill
  dev.killBoss();
  assert(global.game.enemies.bossHp <= 0, 'Dev killBoss deals fatal damage to active boss');

  // Test Key & Item cheats
  dev.giveAllKeys();
  assert(global.missionsManager.hasAllForestKeys(), 'Dev giveAllKeys grants 3 keys');

  dev.giveAllItems();
  const pot = global.inventoryManager.items.find(i => i.id === 'potion');
  assert(pot && pot.qty >= 5, 'Dev giveAllItems grants potions');

  dev.grantAllCrystals();
  assert(global.missionsManager.crystals.fragment1 && global.missionsManager.crystals.fragment2 && global.missionsManager.crystals.fragment3, 'Dev grantAllCrystals unlocks all 3 fragments');
} catch (e) {
  assert(false, `dev.js execution: ${e.message}`);
}

// 6. Verify all DOM element IDs referenced in JS exist in index.html
try {
  const html = fs.readFileSync('index.html', 'utf8');
  const jsFiles = [
    'js/main.js', 'js/game.js', 'js/player.js', 'js/character.js',
    'js/abilities.js', 'js/bosses.js', 'js/world.js', 'js/enemies.js',
    'js/missions.js', 'js/inventory.js', 'js/progression.js', 'js/settings.js',
    'js/map.js', 'js/interface.js', 'js/dev.js', 'js/audio.js'
  ];
  let missingCount = 0;
  for (const f of jsFiles) {
    const code = fs.readFileSync(f, 'utf8');
    const regex = /getElementById\(['"]([^'"]+)['"]\)/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      const id = match[1];
      if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
        console.error(`Missing element #${id} referenced in ${f}`);
        missingCount++;
      }
    }
  }
  assert(missingCount === 0, `All referenced DOM IDs exist in index.html (missing: ${missingCount})`);
} catch (e) {
  assert(false, `DOM ID verification: ${e.message}`);
}

console.log('=== TEST SUITE COMPLETED ===');
if (failures > 0) {
  console.error(`Total failures: ${failures}`);
  process.exit(1);
} else {
  console.log('All tests passed successfully!');
  process.exit(0);
}
