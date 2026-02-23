import { gameState } from './state.js';

export function createBattleSystem(canvas, statusEl, mechs) {
  const ctx = canvas.getContext('2d');
  const gravity = 0.35;
  const state = {
    active: false,
    keys: {},
    chargingJump: false,
    jumpCharge: 0,
    missiles: [],
    explosions: [],
    lastTime: 0,
    player: null,
    enemy: null,
    enemyFireTimer: 0,
  };

  const setStatus = (t) => { statusEl.textContent = t; };
  function mechObj(x, y, data, facing) {
    return { x, y, vx: 0, vy: 0, w: 70 * data.stats.size, h: 88 * data.stats.size, hp: data.stats.hp, maxHp: data.stats.hp, data, facing, cooldown: 0, bob: Math.random() * Math.PI };
  }

  function fireMissile(owner) {
    if (owner.cooldown > 0) return;
    owner.cooldown = owner.data.stats.missileCooldown;
    const dir = owner.facing;
    state.missiles.push({ x: owner.x + owner.w / 2, y: owner.y + owner.h * 0.4, vx: dir * owner.data.stats.missileSpeed * 2.3, damage: owner.data.stats.missileDamage, owner });
  }

  function updateMech(m, dt) {
    m.vy += gravity;
    m.x += m.vx * dt * 60;
    m.y += m.vy * dt * 60;
    m.cooldown = Math.max(0, m.cooldown - dt);
    if (m.y > 300 - m.h) { m.y = 300 - m.h; m.vy = 0; }
    m.x = Math.max(10, Math.min(canvas.width - m.w - 10, m.x));
    m.bob += dt * 4;
  }

  function hit(target, dmg) {
    target.hp -= dmg;
    state.explosions.push({ x: target.x + target.w / 2, y: target.y + target.h / 2, t: 0, max: 0.35 });
  }

  function start(playerId) {
    const pData = mechs.find((m) => m.id === playerId) || mechs[0];
    const enemyPool = mechs.filter((m) => m.id !== pData.id);
    const eData = enemyPool[Math.floor(Math.random() * enemyPool.length)];
    state.player = mechObj(120, 180, pData, 1);
    state.enemy = mechObj(760, 180, eData, -1);
    state.active = true;
    state.enemyFireTimer = 0.6;
    state.missiles = [];
    state.explosions = [];
    setStatus(`Battle started: ${pData.name} vs ${eData.name}`);
    requestAnimationFrame(loop);
  }

  function processInput(dt) {
    const p = state.player;
    p.vx = 0;
    if (state.keys['a']) { p.vx = -p.data.stats.speed; p.facing = -1; }
    if (state.keys['d']) { p.vx = p.data.stats.speed; p.facing = 1; }
    if (state.chargingJump) state.jumpCharge = Math.min(1, state.jumpCharge + dt * 1.5);
  }

  function enemyAi(dt) {
    const e = state.enemy;
    const p = state.player;
    const dist = p.x - e.x;
    e.vx = Math.sign(dist) * e.data.stats.speed * 0.75;
    e.facing = dist > 0 ? 1 : -1;
    if (Math.abs(dist) < 280 && Math.random() < 0.015) fireMissile(e);
    state.enemyFireTimer -= dt;
    if (state.enemyFireTimer <= 0) {
      fireMissile(e);
      state.enemyFireTimer = Math.max(0.5, 1.7 - e.data.stats.missileSpeed * 0.08);
    }
    if (Math.random() < 0.01 && e.vy === 0) e.vy = -e.data.stats.jumpStrength * 1.6;
  }

  function resolveMissiles(dt) {
    const arr = [];
    for (const m of state.missiles) {
      m.x += m.vx * dt * 60;
      const t = m.owner === state.player ? state.enemy : state.player;
      if (m.x > t.x && m.x < t.x + t.w && m.y > t.y && m.y < t.y + t.h) {
        hit(t, m.damage);
        continue;
      }
      if (m.x < 0 || m.x > canvas.width) continue;
      arr.push(m);
    }
    state.missiles = arr;
  }

  function drawMech(m) {
    const bob = Math.sin(m.bob) * 2;
    ctx.fillStyle = m === state.player ? '#79c7ff' : '#ff9a9a';
    ctx.fillRect(m.x, m.y + bob, m.w, m.h);
    ctx.fillStyle = '#0f1727';
    ctx.fillRect(m.x + m.w * (m.facing > 0 ? 0.65 : 0.1), m.y + bob + m.h * 0.25, m.w * 0.25, m.h * 0.2);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#121b2f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#223656';
    ctx.fillRect(0, 300, canvas.width, 120);
    const p = state.player, e = state.enemy;
    drawMech(p); drawMech(e);

    for (const m of state.missiles) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    state.explosions.forEach((ex) => {
      const r = 8 + ex.t * 36;
      ctx.fillStyle = `rgba(255,120,50,${1 - ex.t / ex.max})`;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    drawHp(p, 18, 16);
    drawHp(e, canvas.width - 318, 16);
  }

  function drawHp(mech, x, y) {
    ctx.fillStyle = '#132036'; ctx.fillRect(x, y, 300, 20);
    ctx.fillStyle = '#5bf58b'; ctx.fillRect(x, y, 300 * (mech.hp / mech.maxHp), 20);
    ctx.strokeStyle = '#4f668f'; ctx.strokeRect(x, y, 300, 20);
  }

  function loop(ts) {
    if (!state.active) return;
    const dt = Math.min(0.033, (ts - (state.lastTime || ts)) / 1000);
    state.lastTime = ts;
    processInput(dt);
    enemyAi(dt);
    updateMech(state.player, dt);
    updateMech(state.enemy, dt);
    resolveMissiles(dt);
    state.explosions = state.explosions.filter((e) => (e.t += dt) < e.max);

    if (state.player.hp <= 0 || state.enemy.hp <= 0) {
      state.active = false;
      if (state.enemy.hp <= 0) {
        const reward = 6 + Math.floor(state.enemy.data.stats.hp / 120);
        gameState.shards += reward;
        setStatus(`Victory! +${reward} Tech Shards.`);
      } else {
        setStatus('Defeat. Repair and try again.');
      }
      draw();
      return;
    }

    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    state.keys[k] = true;
    if (k === 'w') state.chargingJump = true;
    if (k === ' ' && state.active) { e.preventDefault(); fireMissile(state.player); }
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    state.keys[k] = false;
    if (k === 'w') {
      state.chargingJump = false;
      if (state.active && state.player.vy === 0) state.player.vy = -(state.player.data.stats.jumpStrength * (1 + state.jumpCharge));
      state.jumpCharge = 0;
    }
  });

  draw();
  return { start };
}
