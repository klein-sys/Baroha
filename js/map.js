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
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'KeyT') {
        e.preventDefault();
        this.toggleMap();
      }
    });
  }

  toggleMap() {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      if (document.exitPointerLock) document.exitPointerLock();
      this.renderMap();
      if (this.modalEl) this.modalEl.classList.add('open');
      if (window.soundEngine) window.soundEngine.playItemPickup();
    } else {
      if (this.modalEl) this.modalEl.classList.remove('open');
      if (window.game && window.game.isRunning && !window.game.isPaused) {
        window.game.canvas.requestPointerLock();
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

    // World coordinate mapping:
    // X: -80 to +80 -> 0 to width
    // Z: 50 to -210 -> height to 0
    const mapX = (wx) => ((wx + 80) / 160) * width;
    const mapY = (wz) => ((-wz + 50) / 260) * height;

    // Draw Regions
    this.regions.forEach(r => {
      const rx1 = mapX(r.bounds.xMin);
      const rx2 = mapX(r.bounds.xMax);
      const ry1 = mapY(r.bounds.zMax);
      const ry2 = mapY(r.bounds.zMin);

      ctx.fillStyle = r.color + '33'; // translucent
      ctx.fillRect(rx1, ry1, rx2 - rx1, ry2 - ry1);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx1, ry1, rx2 - rx1, ry2 - ry1);

      // Region Title
      ctx.fillStyle = r.color;
      ctx.font = 'bold 13px Cinzel, serif';
      ctx.fillText(r.name.toUpperCase(), rx1 + 10, ry1 + 22);
    });

    // Draw Markers
    this.markers.forEach(m => {
      const mx = mapX(m.x);
      const my = mapY(m.z);

      // Icon circle
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fillStyle = m.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#f0e6d2';
      ctx.font = '10px Spectral, sans-serif';
      ctx.fillText(m.name, mx + 12, my + 4);
    });

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
