import { gameState } from './state.js';

const KEY = 'titan_core_save_v1';

export function saveGame() {
  const payload = JSON.stringify(gameState);
  localStorage.setItem(KEY, payload);
  gameState.lastSave = Date.now();
}

export function loadGame() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.assign(gameState, data);
  } catch {
    console.warn('Save data corrupted; starting fresh.');
  }
}
