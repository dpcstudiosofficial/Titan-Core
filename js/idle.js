import { gameState } from './state.js';
import { computePps } from './buildings.js';
import { claimMilestoneShards, passiveShardTick, unlockShardsIfNeeded } from './shards.js';

export function coreClick() {
  const gain = gameState.clickPower * gameState.permanentClickMult;
  gameState.parts += gain;
  gameState.lifetimeParts += gain;
  return gain;
}

export function idleTick(buildings, dtSec) {
  const pps = computePps(buildings);
  const gain = pps * dtSec;
  gameState.parts += gain;
  gameState.lifetimeParts += gain;
  const shardGain = passiveShardTick(dtSec);
  const milestoneGain = claimMilestoneShards();
  const msg = unlockShardsIfNeeded();
  return { pps, gain, shardGain, milestoneGain, msg };
}
