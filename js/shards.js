import { gameState } from './state.js';

const milestones = [1000, 8000, 50000, 300000, 1800000, 12000000, 90000000, 700000000];

export function unlockShardsIfNeeded() {
  if (!gameState.shardsUnlocked && gameState.lifetimeParts >= 1000) {
    gameState.shardsUnlocked = true;
    gameState.shards += 5;
    return 'Tech Shards unlocked! +5 shards.';
  }
  return '';
}

export function claimMilestoneShards() {
  let gained = 0;
  milestones.forEach((m) => {
    if (gameState.lifetimeParts >= m && !gameState.milestonesClaimed[m]) {
      gameState.milestonesClaimed[m] = true;
      gained += 2 + Math.floor(Math.log10(m));
    }
  });
  if (gained) gameState.shards += gained;
  return gained;
}

export function passiveShardTick(dtSec) {
  if (!gameState.shardsUnlocked) return 0;
  const base = 0.02;
  const gain = (base + gameState.shardPassivePerSec) * dtSec;
  gameState.shards += gain;
  return gain;
}
