const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mechs = JSON.parse(fs.readFileSync(path.join(root, 'data/mechs.json'), 'utf8'));

const rarityPalettes = {
  Common: ['#9da8bb', '#6f7889', '#d7dde7'],
  Uncommon: ['#7adf76', '#3f9448', '#c9ffd1'],
  Rare: ['#65bcff', '#3478b8', '#d3edff'],
  Epic: ['#c084ff', '#6f43af', '#f0dcff'],
  Legendary: ['#ffbf60', '#c27d24', '#ffe5bb'],
  Mythic: ['#ff6f9e', '#ad2f62', '#ffd1df'],
};

const dirs = [
  'assets/mechs/front',
  'assets/mechs/side',
  'assets/core',
  'assets/cache',
  'assets/vaults',
  'assets/effects',
  'assets/backgrounds',
];
dirs.forEach((d) => fs.mkdirSync(path.join(root, d), { recursive: true }));

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = (h ^ str.charCodeAt(i)) * 16777619;
  return Math.abs(h >>> 0);
}
function rand(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }

function mechSvg(mech, view = 'front') {
  const [c1, c2, c3] = rarityPalettes[mech.rarity];
  const r = rand(hash(mech.id + view));
  const parts = [];
  for (let i = 0; i < 10; i++) {
    const x = 20 + Math.floor(r() * 160);
    const y = 20 + Math.floor(r() * 140);
    const w = 10 + Math.floor(r() * 36);
    const h = 8 + Math.floor(r() * 40);
    const fill = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
    const rx = Math.floor(r() * 6);
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" opacity="0.95"/>`);
  }
  const eyeX = view === 'front' ? 100 : 120;
  const legs = view === 'front'
    ? `<rect x="70" y="150" width="20" height="36" fill="${c2}"/><rect x="110" y="150" width="20" height="36" fill="${c2}"/>`
    : `<rect x="92" y="150" width="18" height="36" fill="${c2}"/><rect x="120" y="150" width="18" height="36" fill="${c2}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0%" stop-color="${c2}"/><stop offset="100%" stop-color="${c1}"/></linearGradient></defs>
  <rect width="200" height="200" fill="#101a2d"/>
  <ellipse cx="100" cy="182" rx="56" ry="10" fill="#000" opacity="0.35"/>
  <rect x="52" y="58" width="96" height="92" rx="16" fill="url(#g)" stroke="${c3}" stroke-width="3"/>
  ${parts.join('\n')}
  <rect x="${eyeX - 18}" y="86" width="36" height="12" rx="6" fill="#111"/>
  <circle cx="${eyeX - 8}" cy="92" r="3" fill="#8ef5ff"/><circle cx="${eyeX + 8}" cy="92" r="3" fill="#8ef5ff"/>
  ${legs}
</svg>`;
}

function write(rel, str) { fs.writeFileSync(path.join(root, rel), str, 'utf8'); }

mechs.forEach((mech) => {
  write(`assets/mechs/front/${mech.id}.svg`, mechSvg(mech, 'front'));
  write(`assets/mechs/side/${mech.id}.svg`, mechSvg(mech, 'side'));
});

write('assets/core/core.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220"><defs><radialGradient id="c"><stop offset="0%" stop-color="#9cf6ff"/><stop offset="55%" stop-color="#36b4e9"/><stop offset="100%" stop-color="#12243f"/></radialGradient></defs><circle cx="110" cy="110" r="94" fill="#0f1f35"/><circle cx="110" cy="110" r="72" fill="url(#c)"/><circle cx="110" cy="110" r="42" fill="#b9fbff" opacity="0.65"/><g fill="none" stroke="#7adfff" stroke-width="5" opacity="0.7"><circle cx="110" cy="110" r="86"/><circle cx="110" cy="110" r="56"/></g></svg>`);
write('assets/cache/cache.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 140"><rect x="20" y="30" width="140" height="90" rx="10" fill="#3f5f8f"/><rect x="20" y="45" width="140" height="15" fill="#6d95cf"/><rect x="80" y="58" width="20" height="35" fill="#ffd166"/></svg>`);
write('assets/vaults/common.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect x="22" y="26" width="116" height="108" rx="10" fill="#8e98a8"/><text x="80" y="92" fill="#fff" text-anchor="middle" font-size="22">C</text></svg>`);
write('assets/vaults/rare.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect x="22" y="26" width="116" height="108" rx="10" fill="#4388c9"/><text x="80" y="92" fill="#fff" text-anchor="middle" font-size="22">R</text></svg>`);
write('assets/vaults/legendary.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect x="22" y="26" width="116" height="108" rx="10" fill="#c3882e"/><text x="80" y="92" fill="#fff" text-anchor="middle" font-size="22">L</text></svg>`);
write('assets/effects/missile.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 30"><polygon points="4,15 58,4 58,26" fill="#ffd166"/><rect x="58" y="9" width="18" height="12" fill="#ff6b35"/></svg>`);
write('assets/effects/explosion.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="#ff8c42"/><circle cx="60" cy="60" r="30" fill="#ffd166"/></svg>`);
write('assets/effects/hit.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path d="M60 12 L70 46 L108 46 L78 66 L88 104 L60 80 L32 104 L42 66 L12 46 L50 46 Z" fill="#fff"/></svg>`);
write('assets/backgrounds/idle.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#10192c"/><g stroke="#2f456e" opacity="0.4">${Array.from({length: 80}, (_,i)=>`<line x1="${i*16}" y1="0" x2="${i*16+220}" y2="720"/>`).join('')}</g></svg>`);
write('assets/backgrounds/battle.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#0f1729"/><rect y="520" width="1280" height="200" fill="#203554"/><circle cx="1060" cy="120" r="72" fill="#f6c15c" opacity="0.7"/></svg>`);

console.log(`Generated ${mechs.length * 2 + 11} SVG assets.`);
