import { gameState } from './state.js';

export function buyUpgrade(upgrade) {
  if (gameState.purchasedUpgrades[upgrade.id]) return false;
  if (gameState.parts < upgrade.cost) return false;
  gameState.parts -= upgrade.cost;
  gameState.purchasedUpgrades[upgrade.id] = true;

  if (upgrade.type === 'click') gameState.permanentClickMult *= upgrade.multiplier;
  if (upgrade.type === 'building') {
    gameState.buildingMults[upgrade.target] = (gameState.buildingMults[upgrade.target] || 1) * upgrade.multiplier;
  }
  if (upgrade.type === 'global') gameState.permanentProdMult *= upgrade.multiplier;
  if (upgrade.type === 'scaling') gameState.scalingBonus += (1 - upgrade.multiplier);

  return true;
}
