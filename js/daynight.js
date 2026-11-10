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
    this.wasLightLevel = 1.0;
    this.nightNotificationFired = false;
    this.dawnNotificationFired = true;
    this.currentLightLevel = 1.0;
    this.currentDimmingRate = 0.0;
    this.currentMonsterAggression = 0.6;

    // Lighting entities
    this.sunLight = null;
    this.moonLight = null;
    this.hemiLight = null;

    // Sky colors (pre-allocated to avoid per-frame allocations)
    this.skyDayColor = new THREE.Color(0x70b8f0);
    this.skySunsetColor = new THREE.Color(0xd96b27);
    this.skyNightColor = new THREE.Color(0x060814);
    this.skySunriseColor = new THREE.Color(0xe08f58);
    this._skyColor = new THREE.Color();
    this._lastClockStr = '';
    this._lastFluxStr = '';

    // Bed interaction state
    this.isSleeping = false;
    this.sleepFadeEl = null;
    this.sleepRafId = null;

    this.initLights();
    this.createSleepFadeOverlay();
  }

  initLights() {
    // Hemispheric ambient light
    this.hemiLight = new THREE.HemisphereLight(0xdfeaff, 0x2b362b, 0.95);
    this.scene.add(this.hemiLight);

    // Sun directional light (primary shadow caster for quality lighting without multi-light overhead)
    this.sunLight = new THREE.DirectionalLight(0xfff6dd, 1.35);
    this.sunLight.position.set(45, 80, 45);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 220;
    const d = 55;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0006;
    this.scene.add(this.sunLight);
    if (this.sunLight.target) this.scene.add(this.sunLight.target);

    // Moon directional light
    this.moonLight = new THREE.DirectionalLight(0x7a8db8, 0.55);
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
        background: #050711;
        z-index: 480;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.8s ease-in-out;
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

    // Evaluate Day / Night Trigonometric Calculus:
    // L(t) = sin(w*(t - 6)), dL/dt = w*cos(w*(t - 6))
    const calc = window.calculusEngine
      ? window.calculusEngine.evalDayNightCalculus(this.timeOfDay)
      : {
          L: Math.sin((Math.PI / 12) * (this.timeOfDay - 6)),
          dLdt: (Math.PI / 12) * Math.cos((Math.PI / 12) * (this.timeOfDay - 6)),
          isDay: this.timeOfDay >= 6 && this.timeOfDay < 18,
          isNight: this.timeOfDay >= 18 || this.timeOfDay < 6,
          dimmingRate: -(Math.PI / 12) * Math.cos((Math.PI / 12) * (this.timeOfDay - 6)),
          monsterAggression: 1.0
        };

    this.currentLightLevel = calc.L;
    this.currentDimmingRate = calc.dLdt;
    this.currentMonsterAggression = calc.monsterAggression;
    this.isNight = calc.isNight;

    // Night starts ONCE when L crosses zero downward (Task 2B.1 & Task 3a)
    if (this.wasLightLevel > 0 && calc.L <= 0) {
      if (!this.nightNotificationFired) {
        this.nightNotificationFired = true;
        this.dawnNotificationFired = false;
        this.handleDayNightTransition(true);
      }
    } else if (this.wasLightLevel <= 0 && calc.L > 0) {
      if (!this.dawnNotificationFired) {
        this.dawnNotificationFired = true;
        this.nightNotificationFired = false;
        this.handleDayNightTransition(false);
      }
    }
    this.wasLightLevel = calc.L;
    this.wasNight = this.isNight;

    // Update HUD clock and live calculus flux indicator
    this.updateClockUI(calc);
  }

  updateAtmosphere() {
    const angle = ((this.timeOfDay - 6.0) / 24.0) * Math.PI * 2;
    const distance = 120;

    // Sun orbits (clamp Y above horizon for clean crisp shadows during dawn/dusk)
    this.sunLight.position.x = Math.cos(angle) * distance;
    this.sunLight.position.y = Math.max(22, Math.sin(angle) * distance);
    this.sunLight.position.z = 40;

    // Keep shadow frustum centered around player horizontally for crisp local shadows
    if (window.game && window.game.player && this.sunLight.target) {
      const px = Math.round(window.game.player.position.x / 4) * 4;
      const pz = Math.round(window.game.player.position.z / 4) * 4;
      this.sunLight.target.position.set(px, 0, pz);
      this.sunLight.position.x += px;
      this.sunLight.position.z += pz;
    }

    // Moon orbits opposite
    this.moonLight.position.x = -Math.cos(angle) * distance;
    this.moonLight.position.y = Math.max(25, -Math.sin(angle) * distance);
    this.moonLight.position.z = -40;

    // Evaluate sky & ambient based on time using pre-allocated color
    const skyColor = this._skyColor;
    let hemiIntensity = 0.9;
    let sunIntensity = 0;
    let moonIntensity = 0;

    if (this.timeOfDay >= 5.0 && this.timeOfDay < 7.0) {
      // Sunrise transition
      const t = (this.timeOfDay - 5.0) / 2.0;
      skyColor.lerpColors(this.skyNightColor, this.skySunriseColor, t);
      hemiIntensity = THREE.MathUtils.lerp(0.35, 0.88, t);
      sunIntensity = THREE.MathUtils.lerp(0.15, 1.25, t);
    } else if (this.timeOfDay >= 7.0 && this.timeOfDay < 17.0) {
      // Daytime
      skyColor.copy(this.skyDayColor);
      hemiIntensity = 1.0;
      sunIntensity = 1.38;
      moonIntensity = 0.0;
    } else if (this.timeOfDay >= 17.0 && this.timeOfDay < 19.0) {
      // Sunset transition
      const t = (this.timeOfDay - 17.0) / 2.0;
      skyColor.lerpColors(this.skySunsetColor, this.skyNightColor, t);
      hemiIntensity = THREE.MathUtils.lerp(0.85, 0.3, t);
      sunIntensity = THREE.MathUtils.lerp(1.25, 0.0, t);
      moonIntensity = THREE.MathUtils.lerp(0.0, 0.6, t);
    } else {
      // Nighttime
      skyColor.copy(this.skyNightColor);
      hemiIntensity = 0.3;
      sunIntensity = 0.0;
      moonIntensity = 0.65;
    }

    // Preserve Realm 2/3 atmosphere if non-Realm 1 sky is used; modulate nicely in Realm 1
    const realmId = (window.game && window.game.world) ? window.game.world.currentRealm : 1;
    if (realmId === 1 && !window.game?.world?.floor) {
      if (this.scene.background && this.scene.background.isColor) {
        this.scene.background.copy(skyColor);
      }
      if (this.scene.fog) {
        this.scene.fog.color.copy(skyColor);
      }
    }

    const dungeon = Boolean(window.game?.world?.floor);
    this.hemiLight.intensity = hemiIntensity * (dungeon ? 0.62 : 1);
    this.sunLight.intensity = sunIntensity * (dungeon ? 0.24 : 1);
    this.moonLight.intensity = moonIntensity * (dungeon ? 0.42 : 1);
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

  updateClockUI(calc) {
    const clockEl = document.getElementById('hud-clock-text');
    if (clockEl) {
      let hours = Math.floor(this.timeOfDay);
      let minutes = Math.floor((this.timeOfDay % 1) * 60);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

      const icon = this.isNight ? '🌙' : (this.timeOfDay >= 5 && this.timeOfDay < 7 ? '🌅' : (this.timeOfDay >= 17 && this.timeOfDay < 19 ? '🌇' : '☀️'));
      const clockStr = `${icon} ${displayHours}:${formattedMinutes} ${ampm}`;
      if (clockStr !== this._lastClockStr) {
        this._lastClockStr = clockStr;
        clockEl.innerText = clockStr;
      }
    }

    const fluxEl = document.getElementById('hud-calculus-flux');
    if (fluxEl && calc) {
      const lStr = calc.L >= 0 ? `+${calc.L.toFixed(2)}` : calc.L.toFixed(2);
      const dStr = calc.dLdt >= 0 ? `+${calc.dLdt.toFixed(2)}` : calc.dLdt.toFixed(2);
      const fluxStr = `L: ${lStr} | dL/dt: ${dStr}`;
      if (fluxStr !== this._lastFluxStr) {
        this._lastFluxStr = fluxStr;
        fluxEl.innerText = fluxStr;
      }
    }
  }

  // =========================================================================
  // BED & SLEEPING SYSTEM (EXACT 5-SECOND COUNTDOWN TO 6:00 AM SUNRISE)
  // =========================================================================
  sleepUntilMorning(callback) {
    if (this.isSleeping) return;
    this.isSleeping = true;

    const SLEEP_DURATION_MS = 5000;
    const startWallTime = performance.now();
    const startGameTime = this.timeOfDay;
    // Compute forward hours toward 6:00 AM next morning
    let hoursToAdvance = 6.0 - startGameTime;
    if (hoursToAdvance <= 0) hoursToAdvance += 24.0;

    // Zero player velocity & set character sleeping pose
    if (window.game && window.game.player) {
      window.game.player.velocity.set(0, 0, 0);
      Object.keys(window.game.player.keys).forEach(k => { window.game.player.keys[k] = false; });
    }
    if (window.game && window.game.character) {
      window.game.character.setAnimationState('sleeping');
    }

    // Prepare Sleep Countdown UI inside Adventurer's Inn & Bed modal
    const countdownBox = document.getElementById('sleep-countdown-box');
    const countdownText = document.getElementById('sleep-countdown-text');
    const progressFill = document.getElementById('sleep-progress-fill');
    const actionBtns = document.getElementById('sleep-action-buttons');
    const closeBtn = document.getElementById('btn-close-sleep');
    const heading = document.getElementById('sleep-modal-heading');
    const visualIcon = document.getElementById('sleep-visual-icon');
    const timeInfo = document.getElementById('sleep-current-time');

    if (actionBtns) actionBtns.style.display = 'none';
    if (closeBtn) closeBtn.style.display = 'none';
    if (countdownBox) countdownBox.style.display = 'block';
    if (heading) heading.innerText = 'SLEEPING UNTIL MORNING...';
    if (progressFill) progressFill.style.width = '0%';

    // Dim backdrop behind modal so transition is smooth & visible
    if (this.sleepFadeEl) {
      this.sleepFadeEl.style.pointerEvents = 'all';
      this.sleepFadeEl.style.opacity = '0.82';
    }

    const step = (now) => {
      if (!this.isSleeping) return;
      const elapsed = now - startWallTime;
      const t = Math.min(1.0, elapsed / SLEEP_DURATION_MS);
      const remainingSec = Math.max(1, Math.ceil((SLEEP_DURATION_MS - elapsed) / 1000));

      if (countdownText) {
        countdownText.innerText = elapsed >= SLEEP_DURATION_MS
          ? '☀️ Sunrise Reached! Waking up...'
          : `🌙 Resting peacefully... Waking in ${remainingSec}s`;
      }
      if (progressFill) {
        progressFill.style.width = `${(t * 100).toFixed(1)}%`;
      }
      if (visualIcon) {
        visualIcon.innerText = t < 0.65 ? '🌙 ➔ 🌅' : '🌅 ➔ ☀️';
      }

      // Smoothly transition sky/atmosphere from current hour toward 6:00 AM over the second half
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      this.timeOfDay = (startGameTime + hoursToAdvance * ease) % 24.0;
      this.updateAtmosphere();
      if (timeInfo) {
        let h = Math.floor(this.timeOfDay);
        let m = Math.floor((this.timeOfDay % 1) * 60);
        const ap = h >= 12 ? 'PM' : 'AM';
        const dh = h % 12 === 0 ? 12 : h % 12;
        const fm = m < 10 ? `0${m}` : m;
        timeInfo.innerText = `Advancing Time: ${dh}:${fm} ${ap}`;
      }

      if (elapsed < SLEEP_DURATION_MS) {
        this.sleepRafId = requestAnimationFrame(step);
      } else {
        // Exact 5.0 seconds elapsed — finalize 6:00 AM state cleanly
        this.timeOfDay = 6.0;
        this.isNight = false;
        this.wasNight = false;
        this.wasLightLevel = 0.05;
        this.nightNotificationFired = false;
        this.dawnNotificationFired = true;

        this.updateAtmosphere();
        const calc = window.calculusEngine
          ? window.calculusEngine.evalDayNightCalculus(this.timeOfDay)
          : { L: 0.0, dLdt: Math.PI / 12 };
        this.updateClockUI(calc);

        // Clear aggressive nighttime monsters
        if (window.game && window.game.enemies) {
          window.game.enemies.despawnNightMonsters();
        }

        // Restore player HP & Mana to 100%
        if (window.game && window.game.player) {
          window.game.player.hp = window.game.player.maxHp;
          window.game.player.mana = window.game.player.maxMana;
        }

        if (window.soundEngine) {
          window.soundEngine.playLevelUp();
          window.soundEngine.startDayAmbience();
        }

        if (window.game && window.game.character) {
          window.game.character.setAnimationState('idle');
        }

        // Reset modal back to initial clean state and close
        if (countdownBox) countdownBox.style.display = 'none';
        if (actionBtns) actionBtns.style.display = 'flex';
        if (closeBtn) closeBtn.style.display = 'flex';
        if (heading) heading.innerText = 'REST UNTIL MORNING?';
        if (visualIcon) visualIcon.innerText = '🌙 ➔ ☀️';
        if (progressFill) progressFill.style.width = '0%';

        if (this.sleepFadeEl) {
          this.sleepFadeEl.style.opacity = '0';
          this.sleepFadeEl.style.pointerEvents = 'none';
        }

        this.isSleeping = false;
        if (window.interfaceManager) {
          window.interfaceManager.hideSleepModal();
          window.interfaceManager.updatePlayerStatsUI();
          window.interfaceManager.showToast('☀️ Good morning (6:00 AM)! HP & Mana restored to 100%.', 'success');
        }

        if (window.progressionManager && window.game) {
          window.progressionManager.saveGame(
            window.game.player,
            window.game.world,
            window.missionsManager,
            window.inventoryManager,
            window.abilitiesManager
          );
        }

        if (callback) callback();
      }
    };

    this.sleepRafId = requestAnimationFrame(step);
  }
}

window.DayNightManager = DayNightManager;

