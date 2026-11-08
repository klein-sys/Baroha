/**
 * MATHBOUND – LEGENDS OF THE THREE BOSSES
 * Day & Night Cycle and Bed Sleeping System
 */

class DayNightManager {
  constructor(scene) {
    this.scene = scene;

    // Time representation in hours: 0.0 to 24.0 (starts at 8:00 AM)
    this.timeOfDay = 8.0;
    this.timeScale = 0.15; // 1 real second = ~0.15 in-game minutes (full day ~10 mins, adjustable)
    this.isNight = false;
    this.wasNight = false;

    // Lighting entities
    this.sunLight = null;
    this.moonLight = null;
    this.hemiLight = null;

    // Sky colors
    this.skyDayColor = new THREE.Color(0x70b8f0);
    this.skySunsetColor = new THREE.Color(0xd96b27);
    this.skyNightColor = new THREE.Color(0x060814);
    this.skySunriseColor = new THREE.Color(0xe08f58);

    // Bed interaction state
    this.isSleeping = false;
    this.sleepFadeEl = null;

    this.initLights();
    this.createSleepFadeOverlay();
  }

  initLights() {
    // Hemispheric ambient light
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x334455, 0.9);
    this.scene.add(this.hemiLight);

    // Sun directional light
    this.sunLight = new THREE.DirectionalLight(0xfff6dd, 1.4);
    this.sunLight.position.set(50, 100, 50);
    this.sunLight.castShadow = false;
    this.scene.add(this.sunLight);

    // Moon directional light
    this.moonLight = new THREE.DirectionalLight(0x7a8db8, 0.5);
    this.moonLight.position.set(-50, 100, -50);
    this.moonLight.castShadow = false;
    this.scene.add(this.moonLight);
  }

  createSleepFadeOverlay() {
    let overlay = document.getElementById('sleep-fade-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sleep-fade-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #000;
        z-index: 999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 1.2s ease-in-out;
      `;
      document.body.appendChild(overlay);
    }
    this.sleepFadeEl = overlay;
  }

  update(delta) {
    if (this.isSleeping) return;

    // Advance in-game clock
    this.timeOfDay = (this.timeOfDay + delta * this.timeScale) % 24.0;

    // Update lighting, sun position, and sky color
    this.updateAtmosphere();

    // Night detection
    // Nighttime: 7:00 PM (19.0) to 5:00 AM (5.0)
    this.isNight = (this.timeOfDay >= 19.0 || this.timeOfDay < 5.0);

    if (this.isNight !== this.wasNight) {
      this.handleDayNightTransition(this.isNight);
      this.wasNight = this.isNight;
    }

    // Update HUD clock
    this.updateClockUI();
  }

  updateAtmosphere() {
    const angle = ((this.timeOfDay - 6.0) / 24.0) * Math.PI * 2;
    const distance = 120;

    // Sun orbits
    this.sunLight.position.x = Math.cos(angle) * distance;
    this.sunLight.position.y = Math.sin(angle) * distance;
    this.sunLight.position.z = 40;

    // Moon orbits opposite
    this.moonLight.position.x = -this.sunLight.position.x;
    this.moonLight.position.y = -this.sunLight.position.y;
    this.moonLight.position.z = -this.sunLight.position.z;

    // Evaluate sky & ambient based on time
    let skyColor = new THREE.Color();
    let hemiIntensity = 0.9;
    let sunIntensity = 0;
    let moonIntensity = 0;

    if (this.timeOfDay >= 5.0 && this.timeOfDay < 7.0) {
      // Sunrise transition
      const t = (this.timeOfDay - 5.0) / 2.0;
      skyColor.lerpColors(this.skyNightColor, this.skySunriseColor, t);
      hemiIntensity = THREE.MathUtils.lerp(0.3, 0.8, t);
      sunIntensity = THREE.MathUtils.lerp(0.1, 1.2, t);
    } else if (this.timeOfDay >= 7.0 && this.timeOfDay < 17.0) {
      // Daytime
      skyColor.copy(this.skyDayColor);
      hemiIntensity = 1.0;
      sunIntensity = 1.4;
      moonIntensity = 0.0;
    } else if (this.timeOfDay >= 17.0 && this.timeOfDay < 19.0) {
      // Sunset transition
      const t = (this.timeOfDay - 17.0) / 2.0;
      skyColor.lerpColors(this.skySunsetColor, this.skyNightColor, t);
      hemiIntensity = THREE.MathUtils.lerp(0.8, 0.25, t);
      sunIntensity = THREE.MathUtils.lerp(1.2, 0.0, t);
      moonIntensity = THREE.MathUtils.lerp(0.0, 0.6, t);
    } else {
      // Nighttime
      skyColor.copy(this.skyNightColor);
      hemiIntensity = 0.25;
      sunIntensity = 0.0;
      moonIntensity = 0.6;
    }

    if (this.scene.background && this.scene.background.isColor) {
      this.scene.background.copy(skyColor);
    }
    if (this.scene.fog) {
      this.scene.fog.color.copy(skyColor);
    }

    this.hemiLight.intensity = hemiIntensity;
    this.sunLight.intensity = sunIntensity;
    this.moonLight.intensity = moonIntensity;
  }

  handleDayNightTransition(isNight) {
    if (isNight) {
      // Night warning banner
      if (window.interfaceManager) {
        window.interfaceManager.showToast('⚠️ NIGHT HAS FALLEN — Monsters are aggressive & hunt the living!', 'warning');
      }
      // Night music
      if (window.soundEngine && !window.soundEngine.isBossMusic) {
        window.soundEngine.startNightAmbience();
      }
      // Spawn aggressive nighttime monsters
      if (window.game && window.game.enemies) {
        window.game.enemies.spawnNightMonsters();
      }
    } else {
      // Daytime arrived
      if (window.interfaceManager) {
        window.interfaceManager.showToast('☀️ DAWN BREAKS — Peaceful daylight returns to Numeria.', 'success');
      }
      if (window.soundEngine && !window.soundEngine.isBossMusic) {
        window.soundEngine.startDayAmbience();
      }
      // Clear out dangerous night stalkers
      if (window.game && window.game.enemies) {
        window.game.enemies.despawnNightMonsters();
      }
    }
  }

  updateClockUI() {
    const clockEl = document.getElementById('hud-clock-text');
    if (!clockEl) return;

    let hours = Math.floor(this.timeOfDay);
    let minutes = Math.floor((this.timeOfDay % 1) * 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    const icon = this.isNight ? '🌙' : (this.timeOfDay >= 5 && this.timeOfDay < 7 ? '🌅' : (this.timeOfDay >= 17 && this.timeOfDay < 19 ? '🌇' : '☀️'));
    clockEl.innerText = `${icon} ${displayHours}:${formattedMinutes} ${ampm}`;
  }

  // =========================================================================
  // BED & SLEEPING SYSTEM
  // =========================================================================
  sleepUntilMorning(callback) {
    if (this.isSleeping) return;
    this.isSleeping = true;

    // Trigger sleeping animation on character
    if (window.game && window.game.character) {
      window.game.character.setAnimationState('sleeping');
    }

    // Fade to black
    if (this.sleepFadeEl) {
      this.sleepFadeEl.style.pointerEvents = 'all';
      this.sleepFadeEl.style.opacity = '1';
    }

    setTimeout(() => {
      // Advance clock directly to 6:00 AM (Sunrise)
      this.timeOfDay = 6.0;
      this.updateAtmosphere();
      this.isNight = false;
      this.wasNight = false;

      // Despawn aggressive night monsters
      if (window.game && window.game.enemies) {
        window.game.enemies.despawnNightMonsters();
      }

      // Restore player HP & Mana to full
      if (window.game && window.game.player) {
        window.game.player.hp = window.game.player.maxHp;
        window.game.player.mana = window.game.player.maxMana;
      }

      if (window.soundEngine) {
        window.soundEngine.playLevelUp();
        window.soundEngine.startDayAmbience();
      }

      if (window.interfaceManager) {
        window.interfaceManager.showToast('You awake well-rested at 6:00 AM. Vitality fully restored!', 'success');
        window.interfaceManager.updatePlayerStatsUI();
      }

      // Return player character to idle standing position beside bed
      if (window.game && window.game.character) {
        window.game.character.setAnimationState('idle');
      }

      // Fade back in
      setTimeout(() => {
        if (this.sleepFadeEl) {
          this.sleepFadeEl.style.opacity = '0';
          this.sleepFadeEl.style.pointerEvents = 'none';
        }
        this.isSleeping = false;
        if (callback) callback();
      }, 600);
    }, 1400);
  }
}

window.DayNightManager = DayNightManager;
