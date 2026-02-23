(() => {
  const { buildings, upgrades, cacheItems, vaultRates, mechs } = window.TITAN_DATA;

  const state = {
    parts: 0, lifetimeParts: 0, shards: 0, clickPower: 1,
    permanentProdMult: 1, permanentClickMult: 1, tempProdBoostUntil: 0,
    shardPassivePerSec: 0, scalingBonus: 0,
    buildingsOwned: {}, buildingMults: {}, purchasedUpgrades: {},
    unlockedMechs: { scrapwalker: 1 }, selectedMech: 'scrapwalker',
    shardsUnlocked: false, milestonesClaimed: {},
    lastTick: Date.now(),
  };

  const SAVE_KEY = 'titan_core_save_v2';
  const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => n < 1000 ? n.toFixed(1).replace('.0', '') : ['','K','M','B','T','Qa','Qi'].reduce((acc,u,i,a)=>{
    if(acc!==null) return acc; if(n<1000||i===a.length-1) return `${n.toFixed(2)}${u}`; n/=1000; return null;
  },null);

  function load() { try { Object.assign(state, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch {} }
  function save() { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }

  function buildingCost(b) {
    const owned = state.buildingsOwned[b.id] || 0;
    return Math.floor(b.baseCost * Math.pow(b.costMultiplier, owned));
  }

  function totalBuildings() { return Object.values(state.buildingsOwned).reduce((a,b)=>a+b,0); }

  function pps() {
    const base = buildings.reduce((sum,b)=>sum + (state.buildingsOwned[b.id]||0) * b.baseProduction * (state.buildingMults[b.id]||1),0);
    const scaling = 1 + Math.floor(totalBuildings()/25) * state.scalingBonus;
    const temp = Date.now() < state.tempProdBoostUntil ? 2 : 1;
    return base * state.permanentProdMult * scaling * temp;
  }

  function unlockShardsMilestones() {
    if (!state.shardsUnlocked && state.lifetimeParts >= 1000) {
      state.shardsUnlocked = true;
      state.shards += 5;
      $('milestoneMsg').textContent = 'Tech Shards unlocked! +5';
    }
    [1000,8000,50000,300000,1800000,12000000,90000000,700000000].forEach((m)=>{
      if(state.lifetimeParts>=m && !state.milestonesClaimed[m]){
        state.milestonesClaimed[m]=true;
        const gain=2+Math.floor(Math.log10(m));
        state.shards += gain;
        $('milestoneMsg').textContent = `Milestone ${m.toLocaleString()} reached: +${gain} shards`;
      }
    });
  }

  function renderTop(ppsNow){
    $('partsValue').textContent = fmt(state.parts);
    $('shardsValue').textContent = fmt(state.shards);
    $('ppsValue').textContent = fmt(ppsNow);
  }

  function renderBuildings(){
    const root = $('buildingsList'); root.innerHTML='';
    buildings.forEach((b,idx)=>{
      const owned = state.buildingsOwned[b.id]||0; const cost = buildingCost(b);
      const row = document.createElement('div'); row.className='row-item';
      row.innerHTML = `<strong>${b.name}</strong><button ${state.parts<cost?'disabled':''}>Buy ${fmt(cost)}</button><div class='meta'>Owned: ${owned} • ${fmt(b.baseProduction)} pps</div>`;
      row.querySelector('button').onclick=()=>{ if(state.parts>=cost){ state.parts-=cost; state.buildingsOwned[b.id]=owned+1; refresh(); } };
      if(idx===0 && owned>0){ const orb=document.createElement('div'); orb.className='meta'; orb.textContent=`Core Orbiters Active: ${owned}`; row.appendChild(orb); }
      root.appendChild(row);
    });
  }

  function applyUpgrade(u){
    if(u.type==='click') state.permanentClickMult*=u.multiplier;
    if(u.type==='global') state.permanentProdMult*=u.multiplier;
    if(u.type==='building') state.buildingMults[u.target]=(state.buildingMults[u.target]||1)*u.multiplier;
    if(u.type==='scaling') state.scalingBonus += (1-u.multiplier);
  }

  function renderUpgrades(){
    const root = $('upgradesList'); root.innerHTML='';
    upgrades.forEach((u)=>{
      const owned = !!state.purchasedUpgrades[u.id];
      const row = document.createElement('div'); row.className='row-item';
      row.innerHTML=`<strong>${u.name}</strong><button ${owned||state.parts<u.cost?'disabled':''}>${owned?'Owned':`Buy ${fmt(u.cost)}`}</button><div class='meta'>${u.description}</div>`;
      row.querySelector('button').onclick=()=>{ if(owned||state.parts<u.cost) return; state.parts-=u.cost; state.purchasedUpgrades[u.id]=true; applyUpgrade(u); refresh(); };
      root.appendChild(row);
    });
  }

  function weighted(items, key='weight'){
    const t=items.reduce((s,i)=>s+i[key],0); let r=Math.random()*t;
    for(const i of items){ r-=i[key]; if(r<=0) return i; }
    return items[items.length-1];
  }

  function renderCacheTable(){
    const root = $('cacheLootTable'); root.innerHTML='';
    cacheItems.forEach(i=>{ const d=document.createElement('div'); d.className='row-item'; d.innerHTML=`<strong>${i.name}</strong><div class='meta'>${i.description} (w:${i.weight})</div>`; root.appendChild(d); });
  }

  function openCache(){
    if(!state.shardsUnlocked) return $('cacheResult').textContent='Unlock shards at 1,000 lifetime parts first.';
    if(state.shards<10) return $('cacheResult').textContent='Not enough shards.';
    state.shards -= 10;
    const item = weighted(cacheItems);
    if(item.kind==='permanent_prod') state.permanentProdMult*=item.value;
    if(item.kind==='permanent_click') state.permanentClickMult*=item.value;
    if(item.kind==='temporary_prod') state.tempProdBoostUntil=Math.max(Date.now(),state.tempProdBoostUntil)+item.duration*1000;
    if(item.kind==='passive_shards') state.shardPassivePerSec += item.value;
    if(item.kind==='production_scale') state.scalingBonus += item.value;
    $('cacheResult').textContent = `Obtained ${item.name}: ${item.description}`;
    refresh();
  }

  function openVault(type){
    const costs={common:35,rare:80,legendary:180}; const cost=costs[type];
    if(state.shards<cost){ $('vaultReveal').textContent='Not enough shards.'; return; }
    state.shards-=cost;
    const rarity = weighted(vaultRates[type].map(([rarity,weight])=>({rarity,weight}))).rarity;
    const pool = mechs.filter(m=>m.rarity===rarity);
    const mech = pool[Math.floor(Math.random()*pool.length)];
    state.unlockedMechs[mech.id]=(state.unlockedMechs[mech.id]||0)+1;
    if(!state.selectedMech || rarityOrder.indexOf(mech.rarity)>rarityOrder.indexOf(mechs.find(m=>m.id===state.selectedMech)?.rarity||'Common')) state.selectedMech=mech.id;
    $('vaultReveal').innerHTML = `<div class='reveal-card rarity-${rarity}'><img src='assets/mechs/front/${mech.id}.svg'/><h3>${mech.name}</h3><p>${rarity}</p></div>`;
    refresh();
  }

  function renderInventory(){
    const root = $('inventoryGrid'); root.innerHTML='';
    const owned = mechs.filter(m=>state.unlockedMechs[m.id]);
    if(!owned.length){ root.textContent='No mechs unlocked.'; return; }
    owned.forEach((m)=>{
      const d=document.createElement('div'); d.className='mech-card';
      d.innerHTML=`<img src='assets/mechs/front/${m.id}.svg'/><h4>${m.name}</h4><div class='meta ${'rarity-'+m.rarity}'>${m.rarity} ×${state.unlockedMechs[m.id]}</div><div class='meta'>HP ${m.stats.hp} • DMG ${m.stats.missileDamage}</div><button data-mech='${m.id}'>Set Active</button>`;
      root.appendChild(d);
    });
    root.onclick=(e)=>{ const b=e.target.closest('button[data-mech]'); if(!b) return; state.selectedMech=b.dataset.mech; refresh(); };
  }

  function refreshMechSelect(){
    const s=$('playerMechSelect'); s.innerHTML='';
    mechs.filter(m=>state.unlockedMechs[m.id]).forEach(m=>{
      const o=document.createElement('option'); o.value=m.id; o.textContent=`${m.name} (${m.rarity})`; if(m.id===state.selectedMech) o.selected=true; s.appendChild(o);
    });
  }

  function refresh(){
    renderTop(pps()); renderBuildings(); renderUpgrades(); renderInventory(); refreshMechSelect();
  }

  // battle
  const battle = (()=>{
    const canvas=$('battleCanvas'); const ctx=canvas.getContext('2d'); const g=0.35;
    const st={active:false,keys:{},charging:false,charge:0,p:null,e:null,missiles:[],explosions:[],last:0,aiFire:1};
    const mechObj=(x,m,f)=>({x,y:180,vx:0,vy:0,w:70*m.stats.size,h:88*m.stats.size,hp:m.stats.hp,maxHp:m.stats.hp,m,f,cool:0,bob:0});
    function fire(owner){ if(owner.cool>0)return; owner.cool=owner.m.stats.missileCooldown; st.missiles.push({x:owner.x+owner.w/2,y:owner.y+owner.h*0.5,vx:owner.f*owner.m.stats.missileSpeed*2.3,d:owner.m.stats.missileDamage,o:owner}); }
    function hp(m,x,y){ctx.fillStyle='#10253c';ctx.fillRect(x,y,300,16);ctx.fillStyle='#4bff8f';ctx.fillRect(x,y,300*(m.hp/m.maxHp),16);}
    function draw(){ctx.clearRect(0,0,960,420);ctx.fillStyle='#101a2d';ctx.fillRect(0,0,960,420);ctx.fillStyle='#223a5b';ctx.fillRect(0,300,960,120); [st.p,st.e].forEach((m,i)=>{if(!m)return;const bob=Math.sin(m.bob)*2;ctx.fillStyle=i? '#ff9a9a':'#79c7ff';ctx.fillRect(m.x,m.y+bob,m.w,m.h);}); st.missiles.forEach(ms=>{ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(ms.x,ms.y,4,0,Math.PI*2);ctx.fill();}); st.explosions.forEach(ex=>{ctx.fillStyle=`rgba(255,120,40,${1-ex.t/ex.max})`;ctx.beginPath();ctx.arc(ex.x,ex.y,8+ex.t*30,0,Math.PI*2);ctx.fill();}); if(st.p&&st.e){hp(st.p,20,18);hp(st.e,640,18);} }
    function start(id){ const pm=mechs.find(m=>m.id===id)||mechs[0]; const ep=mechs.filter(m=>m.id!==pm.id); const em=ep[Math.floor(Math.random()*ep.length)]; st.p=mechObj(120,pm,1); st.e=mechObj(760,em,-1); st.active=true; st.missiles=[]; st.explosions=[]; st.last=0; $('battleStatus').textContent=`Battle started: ${pm.name} vs ${em.name}`; requestAnimationFrame(loop); }
    function loop(ts){ if(!st.active) return; const dt=Math.min(.033,(ts-(st.last||ts))/1000); st.last=ts; const p=st.p,e=st.e;
      p.vx=0; if(st.keys.a){p.vx=-p.m.stats.speed;p.f=-1;} if(st.keys.d){p.vx=p.m.stats.speed;p.f=1;} if(st.charging) st.charge=Math.min(1,st.charge+dt*1.5);
      const dist=p.x-e.x; e.vx=Math.sign(dist)*e.m.stats.speed*.75; e.f=dist>0?1:-1; st.aiFire-=dt; if(st.aiFire<=0){fire(e); st.aiFire=Math.max(.5,1.7-e.m.stats.missileSpeed*.08);} if(Math.random()<.01&&e.vy===0)e.vy=-e.m.stats.jumpStrength*1.5;
      [p,e].forEach(m=>{m.vy+=g;m.x+=m.vx*dt*60;m.y+=m.vy*dt*60;m.cool=Math.max(0,m.cool-dt);if(m.y>300-m.h){m.y=300-m.h;m.vy=0;}m.x=Math.max(10,Math.min(960-m.w-10,m.x));m.bob+=dt*4;});
      st.missiles=st.missiles.filter(ms=>{ms.x+=ms.vx*dt*60; const t=ms.o===p?e:p; if(ms.x>t.x&&ms.x<t.x+t.w&&ms.y>t.y&&ms.y<t.y+t.h){t.hp-=ms.d; st.explosions.push({x:t.x+t.w/2,y:t.y+t.h/2,t:0,max:.35}); return false;} return ms.x>=0&&ms.x<=960;});
      st.explosions=st.explosions.filter(ex=>(ex.t+=dt)<ex.max);
      if(p.hp<=0||e.hp<=0){ st.active=false; if(e.hp<=0){const reward=6+Math.floor(e.m.stats.hp/120); state.shards+=reward; $('battleStatus').textContent=`Victory! +${reward} shards`; } else $('battleStatus').textContent='Defeat.'; refresh(); draw(); return; }
      draw(); requestAnimationFrame(loop);
    }
    window.addEventListener('keydown',(e)=>{const k=e.key.toLowerCase();st.keys[k]=true;if(k==='w')st.charging=true;if(k===' '&&st.active){e.preventDefault();fire(st.p);}});
    window.addEventListener('keyup',(e)=>{const k=e.key.toLowerCase();st.keys[k]=false;if(k==='w'){st.charging=false;if(st.active&&st.p.vy===0)st.p.vy=-(st.p.m.stats.jumpStrength*(1+st.charge));st.charge=0;}});
    draw();
    return {start};
  })();

  function setupTabs(){
    const tabs=['idle','caches','vaults','inventory','battle'];
    const root=$('tabs');
    tabs.forEach((t,i)=>{const b=document.createElement('button');b.textContent=t[0].toUpperCase()+t.slice(1);if(i===0)b.classList.add('active');b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$('screen-'+t).classList.add('active');};root.appendChild(b);});
  }

  load();
  setupTabs();
  renderCacheTable();
  refresh();

  $('coreButton').addEventListener('click', () => {
    const gain = state.clickPower * state.permanentClickMult;
    state.parts += gain;
    state.lifetimeParts += gain;
    $('coreButton').classList.add('pulse');
    setTimeout(()=>$('coreButton').classList.remove('pulse'),120);
    unlockShardsMilestones();
    refresh();
  });

  $('openCacheBtn').onclick = openCache;
  document.querySelectorAll('.vault-btn').forEach(b=>b.onclick=()=>openVault(b.dataset.vault));
  $('playerMechSelect').onchange=(e)=>state.selectedMech=e.target.value;
  $('startBattleBtn').onclick=()=>battle.start(state.selectedMech||'scrapwalker');

  setInterval(()=>{
    const now = Date.now();
    const dt = Math.min(1,(now-state.lastTick)/1000);
    state.lastTick = now;
    const gain = pps() * dt;
    state.parts += gain;
    state.lifetimeParts += gain;
    if(state.shardsUnlocked) state.shards += (0.02 + state.shardPassivePerSec) * dt;
    unlockShardsMilestones();
    renderTop(pps());
  }, 100);

  setInterval(save, 10000);
  window.addEventListener('beforeunload', save);
})();
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
