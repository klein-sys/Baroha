/**
 * MATHBOUND – LEGENDS OF THE THREE BOSSES
 * Interactive World Map System (Shortcut: T)
 */

class WorldMapManager {
  constructor() {
    this.isOpen = false;
    this.modalEl = null;
    this.playerMarkerEl = null;

    // Regions data
    this.regions = [
      {
        id: 'beginner',
        name: 'The Beginner Kingdom',
        color: '#2a9d8f',
        bounds: { xMin: -60, xMax: 60, zMin: -10, zMax: 70 },
        desc: 'Peaceful grasslands, starter village, inn & training grounds.',
        discovered: true
      },
      {
        id: 'forest',
        name: 'The Haunted Forest',
        color: '#7209b7',
        bounds: { xMin: -50, xMax: 50, zMin: -70, zMax: -10 },
        desc: 'Dark twisted woodlands. Domain of The Dark Witch (Lv. 50).',
        discovered: false
      },
      {
        id: 'cursed',
        name: 'The Cursed Kingdom',
        color: '#ba181b',
        bounds: { xMin: -70, xMax: 70, zMin: -140, zMax: -70 },
        desc: 'Ruined gothic cathedral and cemetery. Domain of The Lich (Lv. 100).',
        discovered: false
      },
      {
        id: 'golden',
        name: 'The Golden Dragon Realm',
        color: '#e5a910',
        bounds: { xMin: -80, xMax: 80, zMin: -220, zMax: -140 },
        desc: 'Floating celestial temples. Domain of Eternal Dragon (Lv. 1000).',
        discovered: false
      }
    ];

    // Map markers
    this.markers = [
      // Safe / Villages (Green)
      { type: 'safe', name: 'Adventurers Inn & Sleeping Bed', x: 0, z: 25, color: '#2ec4b6', icon: '🛏️' },
      { type: 'safe', name: 'Starter Village Square', x: -10, z: 20, color: '#2ec4b6', icon: '🏡' },
      
      // NPCs & Quests (Blue)
      { type: 'quest', name: 'Elder of Numeria (Tutorial)', x: 0, z: 12, color: '#3a86ff', icon: '🧙‍♂️' },
      { type: 'quest', name: 'Hermit Scholar Alistair', x: -14, z: -55, color: '#3a86ff', icon: '📜' },
      
      // Monsters & Danger (Red)
      { type: 'danger', name: 'Haunted Forest Gates', x: 0, z: -25, color: '#e63946', icon: '🐺' },
      { type: 'danger', name: 'Cursed Crypt Gate', x: 0, z: -85, color: '#e63946', icon: '💀' },

      // Bosses (Purple)
      { type: 'boss', name: 'Boss 1: The Dark Witch (Lv. 50)', x: 0, z: -45, color: '#9b5de5', icon: '🔮' },
      { type: 'boss', name: 'Boss 2: The Lich (Lv. 100)', x: 0, z: -115, color: '#9b5de5', icon: '👑' },
      { type: 'boss', name: 'Boss 3: Eternal Dragon (Lv. 1000)', x: 0, z: -185, color: '#9b5de5', icon: '🐉' },

      // Treasures (Gold)
      { type: 'treasure', name: 'Ancient Relic of Limits', x: 18, z: -35, color: '#ffd166', icon: '💎' },
      { type: 'treasure', name: 'Golden Heart of Eternity', x: -22, z: -95, color: '#ffd166', icon: '💛' }
    ];

    this.setupModal();
    this.bindShortcut();
  }

  setupModal() {
    this.modalEl = document.getElementById('world-map-modal');
  }

  bindShortcut() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat || e.target.closest?.('input, textarea, select')) return;
      if (e.code === 'KeyT') {
        e.preventDefault();
        this.toggleMap();
      }
    });
  }

  toggleMap() {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      if (window.interfaceManager) window.interfaceManager.closeAllModals('world-map-modal');
      if (document.exitPointerLock) document.exitPointerLock();
      this.renderMap();
      if (this.modalEl) this.modalEl.classList.add('open');
      if (window.soundEngine) window.soundEngine.playItemPickup();
    } else {
      if (this.modalEl) this.modalEl.classList.remove('open');
      if (window.interfaceManager) {
        window.interfaceManager.resumePointerLockIfActive();
      }
    }
  }

  renderMap() {
    const canvas = document.getElementById('world-map-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const world = window.game?.world;
    if (!world?.rooms) return;
    const west = Math.min(...world.rooms.map(room => room.bounds[0])) - 5;
    const east = Math.max(...world.rooms.map(room => room.bounds[1])) + 5;
    const north = Math.min(...world.rooms.map(room => room.bounds[2])) - 8;
    const south = Math.max(...world.rooms.map(room => room.bounds[3])) + 6;
    const mapX = x => (x - west) / (east - west) * width;
    const mapY = z => (z - north) / (south - north) * height;
    const rectangle = (x1, x2, z1, z2, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(mapX(x1), mapY(z1), mapX(x2) - mapX(x1), mapY(z2) - mapY(z1));
    };

    rectangle(-3, 3, 1, 4, '#566877');
    const state = world.dungeonProgress[world.currentRealm];
    for (const pit of world.crossingPits) rectangle(...pit.bounds, '#33282a');
    if (state.bridge) rectangle(-2, 2, -28, -17, '#82ceaa');
    for (const { mesh: { position: lift } } of world.oscillatingPlatforms) {
      rectangle(lift.x - 2.3, lift.x + 2.3, lift.z - 2.2, lift.z + 2.2, '#9875ce');
    }
    for (const [index, room] of world.rooms.entries()) {
      rectangle(...room.bounds, index === 3 ? '#553845' : '#29433f');
      const [left, right, north, south] = room.bounds;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f0e6d2';
      ctx.fillText(room.name, mapX((left + right) / 2), mapY((north + south) / 2), mapX(right) - mapX(left) - 7);
    }
    ctx.fillStyle = '#f0e6d2';
    ctx.fillText(`Floor ${world.currentRealm} · ${world.floor.name}`, width / 2, 14);
    ctx.fillStyle = state.defeated ? '#89f9d5' : '#e3a679';
    ctx.fillText(state.defeated ? '◆ Portal open' : '◇ Portal locked', mapX(0), mapY(-74));
    ctx.textAlign = 'left';

    // Draw Player Position Marker
    if (window.game && window.game.player) {
      const px = mapX(window.game.player.position.x);
      const py = mapY(window.game.player.position.z);

      // Glowing pulsing marker
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 217, 120, 0.4)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffbe0b';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // "YOU" tag
      ctx.fillStyle = '#ffd978';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText('YOU', px + 10, py - 4);
    }
  }
}

window.WorldMapManager = WorldMapManager;

