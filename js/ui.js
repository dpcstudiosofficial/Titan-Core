import { gameState } from './state.js';
import { buildingCost } from './buildings.js';
import { rarityToClass } from './assets.js';

export const fmt = (n) => {
  if (n < 1000) return n.toFixed(1).replace('.0', '');
  const u = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let i = 0;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return `${n.toFixed(2)}${u[i]}`;
};

export function renderResourceBar(pps) {
  document.getElementById('partsValue').textContent = fmt(gameState.parts);
  document.getElementById('shardsValue').textContent = fmt(gameState.shards);
  document.getElementById('ppsValue').textContent = fmt(pps);
}

export function renderBuildings(buildings, onBuy) {
  const root = document.getElementById('buildingsList');
  root.innerHTML = '';
  buildings.forEach((b, idx) => {
    const owned = gameState.buildingsOwned[b.id] || 0;
    const cost = buildingCost(b, owned);
    const row = document.createElement('div');
    row.className = 'row-item';
    row.innerHTML = `<strong>${b.name}</strong> x${owned}<button ${gameState.parts < cost ? 'disabled' : ''}>Buy (${fmt(cost)})</button><br><small>${fmt(b.baseProduction)} pps each</small>`;
    row.querySelector('button').addEventListener('click', () => onBuy(b));
    if (idx === 0 && owned > 0) row.innerHTML += `<div><small>Orbiters active: ${owned}</small></div>`;
    root.appendChild(row);
  });
}

export function renderUpgrades(upgrades, onBuy) {
  const root = document.getElementById('upgradesList');
  root.innerHTML = '';
  upgrades.forEach((u) => {
    const bought = !!gameState.purchasedUpgrades[u.id];
    const disabled = bought || gameState.parts < u.cost;
    const row = document.createElement('div');
    row.className = 'row-item';
    row.innerHTML = `<strong>${u.name}</strong><button ${disabled ? 'disabled' : ''}>${bought ? 'Owned' : `Buy (${fmt(u.cost)})`}</button><br><small>${u.description}</small>`;
    row.querySelector('button').addEventListener('click', () => onBuy(u));
    root.appendChild(row);
  });
}

export function renderCacheLootTable(cacheItems) {
  const root = document.getElementById('cacheLootTable');
  root.innerHTML = '';
  cacheItems.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'row-item';
    row.innerHTML = `<strong>${item.name}</strong> <small>(weight ${item.weight})</small><br><small>${item.description}</small>`;
    root.appendChild(row);
  });
}

export function renderVaultReveal(result) {
  const root = document.getElementById('vaultReveal');
  if (result.error) { root.textContent = result.error; return; }
  root.innerHTML = `<div class="reveal-card ${rarityToClass(result.rarity)}"><img src="assets/mechs/front/${result.mech.id}.svg" alt="${result.mech.name}" style="width:200px;height:140px"/><h3>${result.mech.name}</h3><div>${result.rarity}</div></div>`;
}

export function showCacheResult(text) {
  document.getElementById('cacheResult').textContent = text;
}
