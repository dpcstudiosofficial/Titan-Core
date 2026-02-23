export const gameState = {
  parts: 0,
  lifetimeParts: 0,
  shards: 0,
  clickPower: 1,
  permanentProdMult: 1,
  permanentClickMult: 1,
  tempProdBoostUntil: 0,
  shardPassivePerSec: 0,
  scalingBonus: 0,
  buildingsOwned: {},
  buildingMults: {},
  purchasedUpgrades: {},
  unlockedMechs: { scrapwalker: 1 },
  selectedMech: 'scrapwalker',
  shardsUnlocked: false,
  lastTick: Date.now(),
  lastShardTick: Date.now(),
  milestonesClaimed: {},
  lastSave: 0,
};

export const rarityColors = {
  Common: '#c9d0df',
  Uncommon: '#7adb73',
  Rare: '#69b6ff',
  Epic: '#ce8bff',
  Legendary: '#ffc567',
  Mythic: '#ff7099',
};

export const tabs = ['idle', 'caches', 'vaults', 'inventory', 'battle'];
