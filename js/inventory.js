/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * Inventory Management & Item Consumption
 */

class InventoryManager {
  constructor() {
    this.items = [
      { id: 'potion', name: 'Healing Potion', icon: '🍷', qty: 2, desc: 'Restores 50 Health instantly.', type: 'consumable' },
      { id: 'mana', name: 'Mana Crystal', icon: '💎', qty: 2, desc: 'Restores 50 Mana instantly.', type: 'consumable' },
      { id: 'golden_heart', name: 'Golden Heart', icon: '💛', qty: 0, desc: 'Restores 1 lost life container.', type: 'consumable' },
      { id: 'scroll', name: 'Ancient Scroll of Calculus', icon: '📜', qty: 1, desc: 'Inscribed with theorems on limits and derivatives.', type: 'lore' },
      { id: 'sword', name: 'Magical Runeblade', icon: '🗡️', qty: 1, desc: 'A sword humming with differential calculus resonance (+35 Damage).', type: 'equipment' }
    ];
  }

  addItem(id, name, icon, desc, type = 'misc', qty = 1) {
    const existing = this.items.find(i => i.id === id);
    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push({ id, name, icon, desc, type, qty });
    }

    if (window.soundEngine) window.soundEngine.playItemPickup();
    if (window.interfaceManager) {
      window.interfaceManager.showToast(`Acquired: ${name}!`, 'info');
      window.interfaceManager.renderInventorySlots();
    }
  }

  useItem(id, player) {
    const item = this.items.find(i => i.id === id);
    if (!item || item.qty <= 0) return false;

    if (item.id === 'potion') {
      if (player.hp >= player.maxHp) {
        if (window.interfaceManager) window.interfaceManager.showToast('Health is already full!', 'info');
        return false;
      }
      player.heal(50);
      item.qty--;
      if (window.soundEngine) window.soundEngine.playItemPickup();
    } else if (item.id === 'mana') {
      if (player.mana >= player.maxMana) {
        if (window.interfaceManager) window.interfaceManager.showToast('Mana is already full!', 'info');
        return false;
      }
      player.restoreMana(50);
      item.qty--;
      if (window.soundEngine) window.soundEngine.playItemPickup();
    } else if (item.id === 'golden_heart') {
      if (player.hearts >= player.maxHearts) {
        if (window.interfaceManager) window.interfaceManager.showToast('You already have all 5 Hearts!', 'info');
        return false;
      }
      player.restoreHeart(1);
      item.qty--;
    } else if (item.id === 'scroll') {
      if (window.interfaceManager) {
        window.interfaceManager.toggleCalculusCodex();
      }
      return true;
    }

    if (item.qty <= 0 && item.type === 'consumable') {
      const idx = this.items.indexOf(item);
      if (idx !== -1) this.items.splice(idx, 1);
    }

    if (window.interfaceManager) {
      window.interfaceManager.renderInventorySlots();
      window.interfaceManager.updatePlayerStatsUI();
    }
    return true;
  }
}

window.inventoryManager = new InventoryManager();

