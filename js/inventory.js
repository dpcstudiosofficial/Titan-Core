import { gameState } from './state.js';
import { mechFrontSrc, rarityToClass } from './assets.js';

export function renderInventory(el, mechs) {
  el.innerHTML = '';
  const owned = mechs.filter((m) => gameState.unlockedMechs[m.id]);
  if (!owned.length) {
    el.innerHTML = '<p>No mechs unlocked yet. Open Vaults!</p>';
    return;
  }
  owned.forEach((m) => {
    const card = document.createElement('div');
    card.className = 'mech-card';
    card.innerHTML = `
      <img src="${mechFrontSrc(m.id)}" alt="${m.name}" />
      <h4>${m.name}</h4>
      <div class="${rarityToClass(m.rarity)}">${m.rarity} x${gameState.unlockedMechs[m.id]}</div>
      <small>${m.description}</small>
      <button data-select-mech="${m.id}">Set Active</button>
    `;
    el.appendChild(card);
  });
}
