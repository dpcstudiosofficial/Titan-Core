import { tabs } from './state.js';

export function initTabs(onTab) {
  const tabsEl = document.getElementById('tabs');
  tabs.forEach((tab, i) => {
    const btn = document.createElement('button');
    btn.textContent = tab[0].toUpperCase() + tab.slice(1);
    if (i === 0) btn.classList.add('active');
    btn.addEventListener('click', () => onTab(tab));
    tabsEl.appendChild(btn);
  });
}

export function showTab(tab) {
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.textContent.toLowerCase() === tab));
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
  document.getElementById(`screen-${tab}`).classList.add('active');
}
