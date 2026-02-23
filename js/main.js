import { gameState } from './state.js';
import { buildingsData, upgradesData, cacheItemsData, vaultRatesData, mechsData } from './data_static.js';
import { initTabs, showTab } from './screens.js';
import { renderResourceBar, renderBuildings, renderUpgrades, renderCacheLootTable, showCacheResult, renderVaultReveal } from './ui.js';
import { buyBuilding, computePps } from './buildings.js';
import { buyUpgrade } from './upgrades.js';
import { coreClick, idleTick } from './idle.js';
import { openCache } from './caches.js';
import { openVault } from './vaults.js';
import { renderInventory } from './inventory.js';
import { createBattleSystem } from './battle.js';
import { loadGame, saveGame } from './save.js';

loadGame();

const coreButton = document.getElementById('coreButton');
const milestoneMsg = document.getElementById('milestoneMsg');
const battle = createBattleSystem(document.getElementById('battleCanvas'), document.getElementById('battleStatus'), mechsData);

function refreshAll(ppsNow = computePps(buildingsData)) {
  renderResourceBar(ppsNow);
  renderBuildings(buildingsData, (b) => { if (buyBuilding(b)) refreshAll(); });
  renderUpgrades(upgradesData, (u) => { if (buyUpgrade(u)) refreshAll(); });
  renderInventory(document.getElementById('inventoryGrid'), mechsData);
  const select = document.getElementById('playerMechSelect');
  const current = select.value;
  select.innerHTML = '';
  mechsData.filter((m) => gameState.unlockedMechs[m.id]).forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.name} (${m.rarity})`;
    if (m.id === (current || gameState.selectedMech)) opt.selected = true;
    select.appendChild(opt);
  });
  gameState.selectedMech = select.value || gameState.selectedMech;
}

coreButton.addEventListener('click', () => {
  coreClick();
  coreButton.classList.add('pulse');
  setTimeout(() => coreButton.classList.remove('pulse'), 120);
  refreshAll();
});

initTabs(showTab);
renderCacheLootTable(cacheItemsData);
refreshAll();

setInterval(() => {
  const now = Date.now();
  const dtSec = Math.min(1, (now - gameState.lastTick) / 1000);
  gameState.lastTick = now;
  const tick = idleTick(buildingsData, dtSec);
  if (tick.msg) milestoneMsg.textContent = tick.msg;
  if (tick.milestoneGain) milestoneMsg.textContent = `Milestone reward: +${tick.milestoneGain} shards!`;
  refreshAll(tick.pps);
}, 100);

setInterval(() => saveGame(), 10000);

Array.from(document.querySelectorAll('.vault-btn')).forEach((btn) => {
  btn.addEventListener('click', () => {
    const result = openVault(btn.dataset.vault, vaultRatesData, mechsData);
    renderVaultReveal(result);
    refreshAll();
  });
});

document.getElementById('openCacheBtn').addEventListener('click', () => {
  const result = openCache(cacheItemsData);
  if (result.error) showCacheResult(result.error);
  else showCacheResult(`Obtained: ${result.item.name} — ${result.item.description}`);
  refreshAll();
});

document.getElementById('inventoryGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-select-mech]');
  if (!btn) return;
  gameState.selectedMech = btn.dataset.selectMech;
  refreshAll();
});

document.getElementById('playerMechSelect').addEventListener('change', (e) => {
  gameState.selectedMech = e.target.value;
});

document.getElementById('startBattleBtn').addEventListener('click', () => {
  battle.start(gameState.selectedMech || 'scrapwalker');
});

window.addEventListener('beforeunload', saveGame);
