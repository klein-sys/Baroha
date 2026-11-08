/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * Quests, Mission Objectives, and Progression Tracker
 */

class MissionsManager {
  constructor() {
    this.currentRealm = 1;

    // Keys collected in Realm 1
    this.forestKeysCollected = 0;
    this.towersActivated = 0;

    // Sacred Crystal Fragments (1/3, 2/3, 3/3)
    this.crystals = {
      fragment1: false, // Morgathia
      fragment2: false, // Vorthak
      fragment3: false  // Azrael
    };

    // Quest Journal definitions
    this.quests = {
      realm1: [
        {
          id: 'r1_m1',
          name: 'The Last Guardian\'s Wisdom',
          desc: 'Speak with the Last Guardian of Knowledge at the forest glade.',
          completed: false,
          active: true
        },
        {
          id: 'r1_m2',
          name: 'The 3 Keys of Limits',
          desc: 'Collect 3 Corrupted Keys of Limits hidden across the ruins.',
          progress: 0,
          target: 3,
          completed: false,
          active: false
        },
        {
          id: 'r1_m3',
          name: 'Infiltrate the Cursed Castle',
          desc: 'Use the 3 Keys to unlock the barrier at the Witch\'s Castle Gate.',
          completed: false,
          active: false
        },
        {
          id: 'r1_m4',
          name: 'Vanquish Morgathia',
          desc: 'Defeat Morgathia, Keeper of Broken Limits, using differential calculus.',
          completed: false,
          active: false
        },
        {
          id: 'r1_m5',
          name: 'Recover the First Fragment',
          desc: 'Reclaim the First Sacred Calculus Crystal Fragment.',
          completed: false,
          active: false
        }
      ],

      realm2: [
        {
          id: 'r2_m1',
          name: 'The Necropolis Gate',
          desc: 'Consult Hermit Scholar Alistair regarding Vorthak\'s undead army.',
          completed: false,
          active: true
        },
        {
          id: 'r2_m2',
          name: 'Survive the Undead Wave',
          desc: 'Defeat the corrupted Skeleton Scholars and Undead Knights in the cemetery.',
          completed: false,
          active: false
        },
        {
          id: 'r2_m3',
          name: 'Enter the Crypt Throne',
          desc: 'Cross through the spectral portal to face Lich King Vorthak.',
          completed: false,
          active: false
        },
        {
          id: 'r2_m4',
          name: 'Vanquish the Lich King',
          desc: 'Shatter Vorthak\'s trigonometric derivative shield and claim the Second Fragment.',
          completed: false,
          active: false
        }
      ],

      realm3: [
        {
          id: 'r3_m1',
          name: 'The Celestial Obelisks',
          desc: 'Activate all 3 Ancient Dimensional Towers (Limit, Derivative, Continuity).',
          progress: 0,
          target: 3,
          completed: false,
          active: true
        },
        {
          id: 'r3_m2',
          name: 'The Forbidden Equation Core',
          desc: 'Enter the Grand Cosmic Arena beyond infinity.',
          completed: false,
          active: false
        },
        {
          id: 'r3_m3',
          name: 'Banish Azrael',
          desc: 'Overcome the Final Calculus Trial and vanquish Azrael.',
          completed: false,
          active: false
        },
        {
          id: 'r3_m4',
          name: 'Restore Numeria',
          desc: 'Unite the three Sacred Calculus Crystals and restore harmonic balance.',
          completed: false,
          active: false
        }
      ]
    };

    // Side Quests / Achievements
    this.achievements = [
      { id: 'witch_slayer', name: 'Witch Slayer', desc: 'Defeated Morgathia and conquered Limits.', unlocked: false },
      { id: 'lich_hunter', name: 'Lich Hunter', desc: 'Defeated Vorthak and mastered Trig Derivatives.', unlocked: false },
      { id: 'calculus_god', name: 'Master of Calculus', desc: 'Defeated Azrael and sealed the Forbidden Equation.', unlocked: false },
      { id: 'perfectionist', name: 'Calculus Scholar', desc: 'Maintained 100% accuracy on 5 math trials.', unlocked: false }
    ];
  }

  getCurrentActiveQuest() {
    const list = this.quests[`realm${this.currentRealm}`] || this.quests.realm1;
    return list.find(q => q.active && !q.completed) || list[list.length - 1];
  }

  completeQuest(id) {
    const list = this.quests[`realm${this.currentRealm}`] || [];
    const quest = list.find(q => q.id === id);
    if (quest && !quest.completed) {
      quest.completed = true;
      quest.active = false;

      // Activate next quest
      const idx = list.indexOf(quest);
      if (idx + 1 < list.length) {
        list[idx + 1].active = true;
      }

      if (window.interfaceManager) {
        window.interfaceManager.showToast(`QUEST COMPLETED: ${quest.name}!`, 'success');
        window.interfaceManager.updateQuestHUD();
      }
    }
  }

  recordKeyCollected() {
    this.forestKeysCollected++;
    const quest = this.quests.realm1.find(q => q.id === 'r1_m2');
    if (quest) {
      quest.progress = this.forestKeysCollected;
      if (this.forestKeysCollected >= quest.target) {
        this.completeQuest('r1_m2');
        this.completeQuest('r1_m1');
      }
    }
    if (window.interfaceManager) window.interfaceManager.updateQuestHUD();
  }

  hasAllForestKeys() {
    return this.forestKeysCollected >= 3;
  }

  recordTowerActivated() {
    this.towersActivated++;
    const quest = this.quests.realm3.find(q => q.id === 'r3_m1');
    if (quest) {
      quest.progress = this.towersActivated;
      if (this.towersActivated >= quest.target) {
        this.completeQuest('r3_m1');
      }
    }
    if (window.interfaceManager) window.interfaceManager.updateQuestHUD();
  }

  areAllTowersActive() {
    return this.towersActivated >= 3;
  }

  awardCrystalFragment(realmId) {
    if (realmId === 1) {
      this.crystals.fragment1 = true;
      this.completeQuest('r1_m4');
      this.completeQuest('r1_m5');
      this.unlockAchievement('witch_slayer');
    } else if (realmId === 2) {
      this.crystals.fragment2 = true;
      this.completeQuest('r2_m3');
      this.completeQuest('r2_m4');
      this.unlockAchievement('lich_hunter');
    } else if (realmId === 3) {
      this.crystals.fragment3 = true;
      this.completeQuest('r3_m3');
      this.completeQuest('r3_m4');
      this.unlockAchievement('calculus_god');
    }

    if (window.interfaceManager) {
      window.interfaceManager.updateCrystalsUI(this.crystals);
    }
  }

  unlockAchievement(id) {
    const ach = this.achievements.find(a => a.id === id);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      if (window.interfaceManager) {
        window.interfaceManager.showToast(`🏆 ACHIEVEMENT UNLOCKED: ${ach.name}!`, 'success');
      }
    }
  }
}

window.MissionsManager = MissionsManager;
window.missionsManager = new MissionsManager();

