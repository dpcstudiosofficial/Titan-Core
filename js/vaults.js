import { gameState } from './state.js';

const vaultCosts = { common: 35, rare: 80, legendary: 180 };

const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];

function weightedPick(entries) {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const e of entries) {
    roll -= e[1];
    if (roll <= 0) return e[0];
  }
  return entries[entries.length - 1][0];
}

export function openVault(type, rates, mechs) {
  const cost = vaultCosts[type];
  if (gameState.shards < cost) return { error: 'Not enough Tech Shards.' };
  gameState.shards -= cost;

  const rarity = weightedPick(rates[type]);
  const pool = mechs.filter((m) => m.rarity === rarity);
  const mech = pool[Math.floor(Math.random() * pool.length)];
  gameState.unlockedMechs[mech.id] = (gameState.unlockedMechs[mech.id] || 0) + 1;

  if (!gameState.selectedMech || rarityOrder.indexOf(mech.rarity) > rarityOrder.indexOf(mechs.find((m) => m.id === gameState.selectedMech)?.rarity || 'Common')) {
    gameState.selectedMech = mech.id;
  }

  return { mech, rarity, cost };
}
