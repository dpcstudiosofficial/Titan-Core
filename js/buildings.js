import { gameState } from './state.js';

export function buildingCost(building, owned) {
  return Math.floor(building.baseCost * Math.pow(building.costMultiplier, owned));
}

export function buyBuilding(building) {
  const owned = gameState.buildingsOwned[building.id] || 0;
  const cost = buildingCost(building, owned);
  if (gameState.parts < cost) return false;
  gameState.parts -= cost;
  gameState.buildingsOwned[building.id] = owned + 1;
  return true;
}

export function totalBuildingsOwned() {
  return Object.values(gameState.buildingsOwned).reduce((a, b) => a + b, 0);
}

export function computePps(buildings) {
  const totalOwned = totalBuildingsOwned();
  const scaling = 1 + Math.floor(totalOwned / 25) * gameState.scalingBonus;
  const tempBoost = Date.now() < gameState.tempProdBoostUntil ? 2 : 1;
  return buildings.reduce((sum, b) => {
    const owned = gameState.buildingsOwned[b.id] || 0;
    const bMult = gameState.buildingMults[b.id] || 1;
    return sum + owned * b.baseProduction * bMult;
  }, 0) * gameState.permanentProdMult * scaling * tempBoost;
}
