/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * RPG Progression, Level Curve, and LocalStorage Save/Load
 */

class ProgressionManager {
  constructor() {
    this.saveKey = 'FORBIDDEN_REALM_SAVE_DATA_V1';
  }

  saveGame(player, worldManager, missionsManager, inventoryManager, abilitiesManager) {
    try {
      const saveData = {
        player: {
          level: player.level,
          rankTitle: player.rankTitle,
          xp: player.xp,
          xpNeeded: player.xpNeeded,
          hearts: player.hearts,
          hp: player.hp,
          maxHp: player.maxHp,
          mana: player.mana,
          maxMana: player.maxMana,
          attackPower: player.attackPower
        },
        world: {
          currentRealm: worldManager.currentRealm
        },
        missions: {
          forestKeysCollected: missionsManager.forestKeysCollected,
          towersActivated: missionsManager.towersActivated,
          crystals: missionsManager.crystals,
          achievements: missionsManager.achievements
        },
        inventory: inventoryManager.items,
        abilities: abilitiesManager.abilities.map(a => ({ id: a.id, unlocked: a.unlocked })),
        timestamp: Date.now()
      };

      localStorage.setItem(this.saveKey, JSON.stringify(saveData));
      console.log('Game progress saved successfully.');
      return true;
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
      return false;
    }
  }

  hasSave() {
    try {
      const data = JSON.parse(localStorage.getItem(this.saveKey));
      return Boolean(data?.player && [1, 2, 3].includes(data.world?.currentRealm));
    } catch {
      return false;
    }
  }

  loadGame(player, worldManager, missionsManager, inventoryManager, abilitiesManager) {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return false;
      const data = JSON.parse(raw);

      if (data.player) {
        player.level = data.player.level || 1;
        player.rankTitle = data.player.rankTitle || 'Novice Adventurer';
        player.xp = data.player.xp || 0;
        player.xpNeeded = data.player.xpNeeded || 250;
        player.hearts = data.player.hearts || 5;
        player.maxHp = data.player.maxHp || 100;
        player.hp = data.player.hp || player.maxHp;
        player.maxMana = data.player.maxMana || 100;
        player.mana = data.player.mana ?? player.maxMana;
        player.attackPower = data.player.attackPower || 35;
      }

      if (data.world) {
        if (window.game) {
          window.game.transitionToRealm(data.world.currentRealm || 1);
        } else {
          worldManager.loadRealm(data.world.currentRealm || 1);
        }
      }

      if (data.missions) {
        missionsManager.forestKeysCollected = data.missions.forestKeysCollected || 0;
        missionsManager.towersActivated = data.missions.towersActivated || 0;
        if (data.missions.crystals) missionsManager.crystals = data.missions.crystals;
        if (data.missions.achievements) missionsManager.achievements = data.missions.achievements;
      }

      if (data.inventory) {
        inventoryManager.items = data.inventory;
      }

      if (data.abilities) {
        data.abilities.forEach(savedA => {
          const matched = abilitiesManager.abilities.find(a => a.id === savedA.id);
          if (matched) matched.unlocked = savedA.unlocked;
        });
      }

      window.interfaceManager?.renderAbilityDock();
      window.interfaceManager?.updateQuestHUD();
      window.interfaceManager?.updatePlayerStatsUI();
      window.interfaceManager?.updateCrystalsUI(missionsManager.crystals);
      console.log('Game progress loaded successfully.');
      return true;
    } catch (e) {
      console.error('Error loading save data:', e);
      return false;
    }
  }

  clearSave() {
    localStorage.removeItem(this.saveKey);
  }
}

window.progressionManager = new ProgressionManager();

