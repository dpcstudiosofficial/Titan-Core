import { gameState } from './state.js';

function weightedPick(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

export function openCache(cacheItems) {
  const cost = 10;
  if (!gameState.shardsUnlocked) return { error: 'Unlock Tech Shards first.' };
  if (gameState.shards < cost) return { error: 'Not enough Tech Shards.' };
  gameState.shards -= cost;

  const item = weightedPick(cacheItems);
  if (item.kind === 'permanent_prod') gameState.permanentProdMult *= item.value;
  if (item.kind === 'permanent_click') gameState.permanentClickMult *= item.value;
  if (item.kind === 'temporary_prod') gameState.tempProdBoostUntil = Math.max(Date.now(), gameState.tempProdBoostUntil) + item.duration * 1000;
  if (item.kind === 'passive_shards') gameState.shardPassivePerSec += item.value;
  if (item.kind === 'production_scale') gameState.scalingBonus += item.value;

  return { item };
}
