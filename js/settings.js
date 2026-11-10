/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * Settings Manager: Graphics Quality, Resolution, Performance, Controls, and Audio
 */

class SettingsManager {
  constructor() {
    this.storageKey = 'FORBIDDEN_REALM_SETTINGS_V1';

    // Default settings configuration
    this.defaultSettings = {
      graphics: {
        preset: 'high',           // 'low', 'medium', 'high', 'ultra'
        resolutionScale: 1.0,     // 0.75, 1.0, 1.5
        renderDistance: 'medium', // 'short', 'medium', 'far'
        fogDensity: 0.022,
        fov: 75,
        particles: true,
        dynamicLighting: true,
        fpsCap: 60                // 30, 60, 0 (uncapped)
      },
      controls: {
        mouseSensitivity: 1.0,    // 0.5 to 3.0
        invertY: false,
        mobileControls: 'auto'    // 'auto', 'always', 'never'
      },
      audio: {
        masterVolume: 1.0,
        musicVolume: 0.45,
        sfxVolume: 0.65,
        muted: false
      }
    };

    this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
    this.loadSettings();
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        // Merge saved into current
        if (saved.graphics) Object.assign(this.settings.graphics, saved.graphics);
        if (saved.controls) Object.assign(this.settings.controls, saved.controls);
        if (saved.audio) Object.assign(this.settings.audio, saved.audio);
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      if (window.interfaceManager) {
        window.interfaceManager.showToast('Settings saved & applied!', 'success');
      }
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  applySettings() {
    // 1. Apply Graphics Settings
    if (window.game) {
      const g = this.settings.graphics;

      // Resolution / Pixel Ratio & Shadows
      if (window.game.renderer) {
        const dpr = Math.min(window.devicePixelRatio * g.resolutionScale, 2.0);
        window.game.renderer.setPixelRatio(dpr);
        window.game.renderer.setSize(window.innerWidth, window.innerHeight);
        const enableShadows = !!g.dynamicLighting && g.preset !== 'low';
        if (window.game.renderer.shadowMap) {
          window.game.renderer.shadowMap.enabled = enableShadows;
        }
        if (window.game.dayNight && window.game.dayNight.sunLight) {
          window.game.dayNight.sunLight.castShadow = enableShadows;
        }
      }

      // Camera FOV
      if (window.game.camera) {
        window.game.camera.fov = g.fov;
        window.game.camera.updateProjectionMatrix();
      }

      // Scene Fog / Atmosphere Density
      if (window.game.scene && window.game.scene.fog) {
        window.game.scene.fog.density = g.fogDensity;
      }
    }

    // 2. Apply Audio Settings
    if (window.soundEngine) {
      const a = this.settings.audio;
      if (window.soundEngine.setMasterVolume) {
        window.soundEngine.setMasterVolume(a.masterVolume);
      }
      window.soundEngine.setMusicVolume(a.musicVolume);
      window.soundEngine.setSfxVolume(a.sfxVolume);
      if (a.muted && !window.soundEngine.isMuted) {
        window.soundEngine.toggleMute();
      } else if (!a.muted && window.soundEngine.isMuted) {
        window.soundEngine.toggleMute();
      }
    }

    // 3. Apply Controls Settings
    const c = this.settings.controls;
    const mobileEl = document.getElementById('mobile-controls');
    if (mobileEl) {
      if (c.mobileControls === 'always') {
        mobileEl.classList.add('active');
      } else if (c.mobileControls === 'never') {
        mobileEl.classList.remove('active');
      } else {
        // Auto
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (isTouch) mobileEl.classList.add('active');
        else mobileEl.classList.remove('active');
      }
    }
  }

  setPreset(preset) {
    this.settings.graphics.preset = preset;

    switch (preset) {
      case 'low':
        this.settings.graphics.resolutionScale = 0.75;
        this.settings.graphics.renderDistance = 'short';
        this.settings.graphics.fogDensity = 0.035;
        this.settings.graphics.particles = false;
        this.settings.graphics.dynamicLighting = false;
        this.settings.graphics.fpsCap = 30;
        break;
      case 'medium':
        this.settings.graphics.resolutionScale = 1.0;
        this.settings.graphics.renderDistance = 'medium';
        this.settings.graphics.fogDensity = 0.024;
        this.settings.graphics.particles = true;
        this.settings.graphics.dynamicLighting = true;
        this.settings.graphics.fpsCap = 60;
        break;
      case 'high':
        this.settings.graphics.resolutionScale = 1.0;
        this.settings.graphics.renderDistance = 'medium';
        this.settings.graphics.fogDensity = 0.020;
        this.settings.graphics.particles = true;
        this.settings.graphics.dynamicLighting = true;
        this.settings.graphics.fpsCap = 60;
        break;
      case 'ultra':
        this.settings.graphics.resolutionScale = 1.5;
        this.settings.graphics.renderDistance = 'far';
        this.settings.graphics.fogDensity = 0.012;
        this.settings.graphics.particles = true;
        this.settings.graphics.dynamicLighting = true;
        this.settings.graphics.fpsCap = 0; // uncapped
        break;
    }

    this.populateSettingsUI();
    this.applySettings();
  }

  resetToDefaults() {
    this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
    this.saveSettings();
    this.populateSettingsUI();
    this.applySettings();
    if (window.interfaceManager) {
      window.interfaceManager.showToast('Settings reset to High Performance defaults.', 'info');
    }
  }

  populateSettingsUI() {
    // Populate graphics elements
    const g = this.settings.graphics;
    const resSelect = document.getElementById('settings-res-scale');
    if (resSelect) resSelect.value = g.resolutionScale.toString();

    const distSelect = document.getElementById('settings-render-dist');
    if (distSelect) distSelect.value = g.renderDistance;

    const fovSlider = document.getElementById('settings-fov');
    const fovVal = document.getElementById('settings-fov-val');
    if (fovSlider) {
      fovSlider.value = g.fov;
      if (fovVal) fovVal.innerText = `${g.fov}°`;
    }

    const partCheck = document.getElementById('settings-particles');
    if (partCheck) partCheck.checked = g.particles;

    const fpsSelect = document.getElementById('settings-fps-cap');
    if (fpsSelect) fpsSelect.value = g.fpsCap.toString();

    // Preset active buttons
    document.querySelectorAll('.btn-preset-pill').forEach(btn => {
      if (btn.dataset.preset === g.preset) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Controls
    const c = this.settings.controls;
    const sensSlider = document.getElementById('settings-mouse-sens');
    const sensVal = document.getElementById('settings-mouse-sens-val');
    if (sensSlider) {
      sensSlider.value = c.mouseSensitivity;
      if (sensVal) sensVal.innerText = `${c.mouseSensitivity.toFixed(1)}x`;
    }

    const invertCheck = document.getElementById('settings-invert-y');
    if (invertCheck) invertCheck.checked = c.invertY;

    const mobileSelect = document.getElementById('settings-mobile-ui');
    if (mobileSelect) mobileSelect.value = c.mobileControls;

    // Audio
    const a = this.settings.audio;
    const masterSlider = document.getElementById('settings-vol-master');
    const masterVal = document.getElementById('settings-vol-master-val');
    if (masterSlider) {
      masterSlider.value = Math.round(a.masterVolume * 100);
      if (masterVal) masterVal.innerText = `${Math.round(a.masterVolume * 100)}%`;
    }

    const musicSlider = document.getElementById('settings-vol-music');
    const musicVal = document.getElementById('settings-vol-music-val');
    if (musicSlider) {
      musicSlider.value = Math.round(a.musicVolume * 100);
      if (musicVal) musicVal.innerText = `${Math.round(a.musicVolume * 100)}%`;
    }

    const sfxSlider = document.getElementById('settings-vol-sfx');
    const sfxVal = document.getElementById('settings-vol-sfx-val');
    if (sfxSlider) {
      sfxSlider.value = Math.round(a.sfxVolume * 100);
      if (sfxVal) sfxVal.innerText = `${Math.round(a.sfxVolume * 100)}%`;
    }

    const muteCheck = document.getElementById('settings-mute-audio');
    if (muteCheck) muteCheck.checked = a.muted;
  }

  bindUIEvents() {
    // Presets
    document.querySelectorAll('.btn-preset-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setPreset(btn.dataset.preset);
      });
    });

    // Resolution
    const resSelect = document.getElementById('settings-res-scale');
    if (resSelect) {
      resSelect.addEventListener('change', (e) => {
        this.settings.graphics.resolutionScale = parseFloat(e.target.value);
        this.settings.graphics.preset = 'custom';
        this.applySettings();
      });
    }

    // Render Distance
    const distSelect = document.getElementById('settings-render-dist');
    if (distSelect) {
      distSelect.addEventListener('change', (e) => {
        this.settings.graphics.renderDistance = e.target.value;
        if (e.target.value === 'short') this.settings.graphics.fogDensity = 0.035;
        else if (e.target.value === 'medium') this.settings.graphics.fogDensity = 0.022;
        else this.settings.graphics.fogDensity = 0.012;
        this.settings.graphics.preset = 'custom';
        this.applySettings();
      });
    }

    // FOV
    const fovSlider = document.getElementById('settings-fov');
    const fovVal = document.getElementById('settings-fov-val');
    if (fovSlider) {
      fovSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.settings.graphics.fov = val;
        if (fovVal) fovVal.innerText = `${val}°`;
        this.applySettings();
      });
    }

    // Particles
    const partCheck = document.getElementById('settings-particles');
    if (partCheck) {
      partCheck.addEventListener('change', (e) => {
        this.settings.graphics.particles = e.target.checked;
        this.applySettings();
      });
    }

    // FPS Cap
    const fpsSelect = document.getElementById('settings-fps-cap');
    if (fpsSelect) {
      fpsSelect.addEventListener('change', (e) => {
        this.settings.graphics.fpsCap = parseInt(e.target.value);
      });
    }

    // Mouse Sensitivity
    const sensSlider = document.getElementById('settings-mouse-sens');
    const sensVal = document.getElementById('settings-mouse-sens-val');
    if (sensSlider) {
      sensSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.settings.controls.mouseSensitivity = val;
        if (sensVal) sensVal.innerText = `${val.toFixed(1)}x`;
      });
    }

    // Invert Y
    const invertCheck = document.getElementById('settings-invert-y');
    if (invertCheck) {
      invertCheck.addEventListener('change', (e) => {
        this.settings.controls.invertY = e.target.checked;
      });
    }

    // Mobile UI
    const mobileSelect = document.getElementById('settings-mobile-ui');
    if (mobileSelect) {
      mobileSelect.addEventListener('change', (e) => {
        this.settings.controls.mobileControls = e.target.value;
        this.applySettings();
      });
    }

    // Master Volume
    const masterSlider = document.getElementById('settings-vol-master');
    const masterVal = document.getElementById('settings-vol-master-val');
    if (masterSlider) {
      masterSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.settings.audio.masterVolume = val / 100;
        if (masterVal) masterVal.innerText = `${val}%`;
        this.applySettings();
      });
    }

    // Music Volume
    const musicSlider = document.getElementById('settings-vol-music');
    const musicVal = document.getElementById('settings-vol-music-val');
    if (musicSlider) {
      musicSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.settings.audio.musicVolume = val / 100;
        if (musicVal) musicVal.innerText = `${val}%`;
        this.applySettings();
      });
    }

    // SFX Volume
    const sfxSlider = document.getElementById('settings-vol-sfx');
    const sfxVal = document.getElementById('settings-vol-sfx-val');
    if (sfxSlider) {
      sfxSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.settings.audio.sfxVolume = val / 100;
        if (sfxVal) sfxVal.innerText = `${val}%`;
        this.applySettings();
      });
    }

    // Mute
    const muteCheck = document.getElementById('settings-mute-audio');
    if (muteCheck) {
      muteCheck.addEventListener('change', (e) => {
        this.settings.audio.muted = e.target.checked;
        this.applySettings();
      });
    }

    // Save & Reset Buttons
    const btnSave = document.getElementById('btn-settings-save');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        this.saveSettings();
        window.interfaceManager?.closeAllModals();
        window.interfaceManager?.resumePointerLockIfActive();
      });
    }

    const btnReset = document.getElementById('btn-settings-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.resetToDefaults();
      });
    }
  }
}

window.settingsManager = new SettingsManager();

