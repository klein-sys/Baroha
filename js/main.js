/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * Application Entry Point, Main Menu Navigation & Event Dispatcher
 */

window.addEventListener('DOMContentLoaded', () => {
  // Initialize the core GameEngine
  const game = new GameEngine();
  game.update();

  // --- MAIN MENU NAVIGATION ---
  const btnStart = document.getElementById('btn-start-game');
  const btnContinue = document.getElementById('btn-continue-game');
  const btnHowToPlay = document.getElementById('btn-how-to-play');
  const btnSettings = document.getElementById('btn-settings');
  const btnCodex = document.getElementById('btn-codex');
  const btnCredits = document.getElementById('btn-credits');

  // Check existing save game
  if (window.progressionManager && window.progressionManager.hasSave()) {
    if (btnContinue) btnContinue.removeAttribute('disabled');
  }

  if (btnStart) {
    btnStart.addEventListener('click', () => {
      game.startNewGame();
    });
  }

  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      game.startNewGame();
      if (window.progressionManager) {
        window.progressionManager.loadGame(
          game.player,
          game.world,
          window.missionsManager,
          window.inventoryManager,
          game.abilities
        );
      }
    });
  }

  if (btnHowToPlay) {
    btnHowToPlay.addEventListener('click', () => {
      if (window.interfaceManager) window.interfaceManager.toggleControlsModal();
    });
  }

  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      if (window.interfaceManager) window.interfaceManager.toggleSettingsModal();
    });
  }

  if (btnCodex) {
    btnCodex.addEventListener('click', () => {
      if (window.interfaceManager) window.interfaceManager.toggleCalculusCodex();
    });
  }

  if (btnCredits) {
    btnCredits.addEventListener('click', () => {
      if (window.interfaceManager) window.interfaceManager.closeAllModals('credits-modal');
      const modal = document.getElementById('credits-modal');
      if (modal) modal.classList.add('open');
    });
  }

  // --- DEV ACCESS BUTTONS ---
  const btnRobloxDev = document.getElementById('btn-roblox-dev');
  const btnMainDev = document.getElementById('btn-main-dev');
  const btnPauseDev = document.getElementById('btn-pause-dev');
  const btnTouchDev = document.getElementById('btn-touch-dev');

  if (btnRobloxDev) btnRobloxDev.addEventListener('click', () => { if (window.devConsoleManager) window.devConsoleManager.toggle(); });
  if (btnMainDev) btnMainDev.addEventListener('click', () => { if (window.devConsoleManager) window.devConsoleManager.toggle(); });
  if (btnPauseDev) btnPauseDev.addEventListener('click', () => { if (window.devConsoleManager) window.devConsoleManager.toggle(); });
  if (btnTouchDev) btnTouchDev.addEventListener('click', () => { if (window.devConsoleManager) window.devConsoleManager.toggle(); });

  // --- PAUSE MENU BUTTONS ---
  const btnResume = document.getElementById('btn-pause-resume');
  const btnRestart = document.getElementById('btn-pause-restart');
  const btnPauseControls = document.getElementById('btn-pause-controls');
  const btnPauseSettings = document.getElementById('btn-pause-settings');
  const btnPauseMainMenu = document.getElementById('btn-pause-mainmenu');

  if (btnResume) {
    btnResume.addEventListener('click', () => game.togglePause());
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      game.togglePause();
      game.transitionToRealm(game.world.currentRealm);
    });
  }

  if (btnPauseControls) {
    btnPauseControls.addEventListener('click', () => {
      if (window.interfaceManager) window.interfaceManager.toggleControlsModal();
    });
  }

  if (btnPauseSettings) {
    btnPauseSettings.addEventListener('click', () => {
      if (window.interfaceManager) window.interfaceManager.toggleSettingsModal();
    });
  }

  if (btnPauseMainMenu) {
    btnPauseMainMenu.addEventListener('click', () => {
      location.reload();
    });
  }

  // --- GAME OVER BUTTONS ---
  const btnRetry = document.getElementById('btn-gameover-retry');
  const btnGameOverMainMenu = document.getElementById('btn-gameover-mainmenu');

  if (btnRetry) {
    btnRetry.addEventListener('click', () => game.retryCheckpoint());
  }

  if (btnGameOverMainMenu) {
    btnGameOverMainMenu.addEventListener('click', () => location.reload());
  }

  // --- VICTORY BUTTONS ---
  const btnVictoryMainMenu = document.getElementById('btn-victory-mainmenu');
  if (btnVictoryMainMenu) {
    btnVictoryMainMenu.addEventListener('click', () => location.reload());
  }

  // --- HUD TOP-RIGHT BUTTONS ---
  const btnHudControls = document.getElementById('btn-hud-controls');
  const btnHudSettings = document.getElementById('btn-hud-settings');
  if (btnHudControls) {
    btnHudControls.addEventListener('click', () => {
      if (window.interfaceManager) window.interfaceManager.toggleControlsModal();
    });
  }
  if (btnHudSettings) {
    btnHudSettings.addEventListener('click', () => {
      if (window.interfaceManager) window.interfaceManager.toggleSettingsModal();
    });
  }

  // --- MODAL CLOSE BUTTONS ---
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.interfaceManager) {
        window.interfaceManager.closeAllModals();
        window.interfaceManager.resumePointerLockIfActive();
      } else {
        const modal = e.target.closest('.modal-backdrop');
        if (modal) modal.classList.remove('open');
      }
    });
  });

  // --- BOTTOM NAV PILLS ---
  const pillJournal = document.getElementById('nav-pill-journal');
  const pillInventory = document.getElementById('nav-pill-inventory');
  const pillCodex = document.getElementById('nav-pill-codex');
  const pillStatus = document.getElementById('nav-pill-status');
  const pillControls = document.getElementById('nav-pill-controls');
  const pillSettings = document.getElementById('nav-pill-settings');

  if (pillJournal) pillJournal.onclick = () => window.interfaceManager.toggleQuestJournal();
  if (pillInventory) pillInventory.onclick = () => window.interfaceManager.toggleInventory();
  if (pillCodex) pillCodex.onclick = () => window.interfaceManager.toggleCalculusCodex();
  if (pillStatus) pillStatus.onclick = () => window.interfaceManager.toggleCharacterStatus();
  if (pillControls) pillControls.onclick = () => window.interfaceManager.toggleControlsModal();
  if (pillSettings) pillSettings.onclick = () => window.interfaceManager.toggleSettingsModal();

  // Initialize Settings UI bindings
  if (window.settingsManager) {
    window.settingsManager.bindUIEvents();
    window.settingsManager.populateSettingsUI();
  }
});

