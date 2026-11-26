// "11 dias sem dormir" — Randy Gardner (San Diego, 1963–64). 1920 quadros, 30 fps.
// Sets: SALA na origem (fliperama, sofá, cama, calendário), RUA em x = 60, QUADRA em x = 120.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, walk } from './motion.js';
export const FPS = 30, TOTAL = 1920, DECK = 0;
const RX = 60, QX = 120, SG = [RX + 2, 0, -3.4];
const SH = [
  ['abre', 0, 'roomN'], ['ganha', 75, 'roomN'], ['sandiego', 160, 'streetD'], ['randy', 250, 'roomD'], ['meta', 372, 'roomD'],
  ['amigos', 498, 'roomN'], ['piscou', 562, 'roomN'], ['sacudida', 591, 'roomN'], ['enjoo', 626, 'roomD'], ['memoria', 680, 'roomD'],
  ['placa', 727, 'streetN'], ['pessoa', 801, 'streetN'], ['cientista', 837, 'streetD'], ['basquete', 905, 'court'], ['apagou', 995, 'court'],
  ['cerebro', 1061, 'roomN'], ['cochilo', 1140, 'roomN'], ['horas', 1221, 'roomN'], ['dorme', 1335, 'roomD'], ['recordes', 1435, 'roomD'],
  ['perigoso', 1533, 'roomD'], ['tonico', 1580, 'roomN'], ['boceja', 1679, 'roomN'], ['olha', 1760, 'roomN'], ['loop', 1833, 'roomN'],
];
export const SHOTS = SH.map(([id, a, light], i) => ({ id, a, b: (SH[i + 1] ? SH[i + 1][1] : TOTAL) - 1, light }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const NIGHT = { skyTop: '#0a0f30', skyHor: '#2a2c5e', sunDisc: '#000000', sunSize: 0 };
export const LIGHTS = {
  roomN: { az: 40, el: 72, sky: '#d8c8f0', ground: '#4a3424', hemi: 1.55, sun: '#ffd9a0', sunI: 1.7, fog: '#2a2c4e', fogNear: 30, fogFar: 200, ...NIGHT, sat: 1.12, vig: 0.3, shadowExt: 8, gain: '#fff0dc' },
  roomD: { az: 30, el: 66, sky: '#eef4ff', ground: '#6a5034', hemi: 1.6, sun: '#fff6e0', sunI: 2.4, fog: '#cfe2ee', fogNear: 30, fogFar: 300, skyTop: '#4a8ad0', skyHor: '#cfe6f4', sunDisc: '#fff6d8', sunSize: 0.004, sat: 1.12, vig: 0.22, shadowExt: 8 },
  streetD: { az: 35, el: 58, sky: '#dcecff', ground: '#5a6a3a', hemi: 1.4, sun: '#fff2d0', sunI: 2.8, fog: '#bcd6ea', fogNear: 40, fogFar: 420, skyTop: '#3a86e0', skyHor: '#d6eaf4', sunDisc: '#fff6d8', sunSize: 0.006, sat: 1.14, vig: 0.2, shadowExt: 20 },
  streetN: { az: 120, el: 50, sky: '#7a86c8', ground: '#2a2a3a', hemi: 1.15, sun: '#ffe0a0', sunI: 1.5, fog: '#22264a', fogNear: 20, fogFar: 160, ...NIGHT, sat: 1.1, vig: 0.34, shadowExt: 16, gain: '#e8ecff' },
  court: { az: 80, el: 62, sky: '#8a96d8', ground: '#2a2a3a', hemi: 1.2, sun: '#fffbe8', sunI: 2.2, fog: '#1e2246', fogNear: 25, fogFar: 140, ...NIGHT, sat: 1.1, vig: 0.32, shadowExt: 18, gain: '#eef0ff' },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });
// ---------- cameras ----------
const RD = [1.0, 0, -1.25];                                         // Randy no fliperama
const BED = [-3.8, 0.62, 1.25];
const CAMS = {
  abre: [{ f: 0, pos: [0.05, 1.5, 0.75], look: [1.2, 1.3, -1.55], fov: 42 }, { f: 74, pos: [0.25, 1.48, 0.4], look: [1.2, 1.3, -1.55], fov: 40 }],
  ganha: [{ f: 75, pos: [-0.4, 1.7, 3.2], look: [1.3, 1.15, -1.2], fov: 54 }, { f: 159, pos: [-0.2, 1.65, 2.8], look: [1.3, 1.15, -1.2], fov: 52 }],
  sandiego: [{ f: 160, pos: [RX - 9, 2.4, 9], look: [RX + 1, 3.0, -8], fov: 56 }, { f: 249, pos: [RX - 6, 2.0, 7.5], look: [RX + 1, 2.6, -8], fov: 54 }],
  randy: [{ f: 250, pos: [1.5, 1.55, 3.6], look: [2.75, 1.3, 0.4], fov: 48 }, { f: 371, pos: [1.7, 1.5, 3.1], look: [2.75, 1.3, 0.4], fov: 46 }],
  meta: [{ f: 372, pos: [-0.5, 1.65, 1.2], look: [-0.5, 1.6, -2.9], fov: 54 }, { f: 497, pos: [-0.5, 1.65, 0.7], look: [-0.5, 1.65, -2.9], fov: 50 }],
  amigos: [{ f: 498, pos: [-1.8, 1.6, 2.6], look: [-1.8, 1.15, -2.0], fov: 54 }, { f: 561, pos: [-1.8, 1.55, 2.2], look: [-1.8, 1.15, -2.0], fov: 52 }],
  piscou: [{ f: 562, pos: [-1.78, 1.5, -0.5], look: [-1.8, 1.45, -1.9], fov: 36 }, { f: 590, pos: [-1.78, 1.5, -0.75], look: [-1.8, 1.45, -1.9], fov: 34 }],
  sacudida: [{ f: 591, pos: [-1.3, 1.55, 0.6], look: [-1.7, 1.3, -1.9], fov: 44 }, { f: 625, pos: [-1.6, 1.55, 0.2], look: [-1.7, 1.3, -1.9], fov: 42, ease: 'easeOut' }],
  enjoo: [{ f: 626, pos: [0.6, 1.5, 1.2], look: [0.6, 1.3, -1.6], fov: 40 }, { f: 679, pos: [0.6, 1.5, 0.9], look: [0.6, 1.3, -1.6], fov: 38 }],
  memoria: [{ f: 680, pos: [-0.3, 1.6, 1.0], look: [0.6, 1.35, -1.6], fov: 40 }, { f: 726, pos: [-0.2, 1.6, 0.8], look: [0.6, 1.35, -1.6], fov: 38 }],
  placa: [{ f: 727, pos: [RX - 1.8, 1.5, 3.2], look: [RX + 1.6, 2.1, -3.2], fov: 50 }, { f: 800, pos: [RX - 1.2, 1.55, 2.4], look: [RX + 1.6, 2.2, -3.2], fov: 48 }],
  pessoa: [{ f: 801, pos: [RX + 0.4, 1.7, 1.4], look: [SG[0], 1.75, SG[2]], fov: 44 }, { f: 836, pos: [RX + 0.6, 1.7, 1.0], look: [SG[0], 1.8, SG[2]], fov: 42 }],
  cientista: [{ f: 837, pos: [RX - 1.5, 1.6, 2.6], look: [RX - 0.6, 1.3, -4.6], fov: 48 }, { f: 904, pos: [RX - 1.0, 1.6, 2.2], look: [RX - 0.6, 1.3, -4.6], fov: 46 }],
  basquete: [{ f: 905, pos: [QX + 0.8, 1.8, 0.5], look: [QX - 0.3, 2.0, -7], fov: 54 }, { f: 994, pos: [QX + 0.5, 1.7, -0.3], look: [QX - 0.3, 2.2, -7], fov: 52 }],
  apagou: [{ f: 995, pos: [QX - 1.0, 1.55, -3.4], look: [QX - 1.2, 1.45, -5.5], fov: 38 }, { f: 1060, pos: [QX - 1.0, 1.55, -3.8], look: [QX - 1.2, 1.45, -5.5], fov: 36 }],
  cerebro: [{ f: 1061, pos: [-1.8, 1.5, 0.9], look: [-1.8, 1.3, -1.9], fov: 44 }, { f: 1139, pos: [-1.8, 1.5, 0.3], look: [-1.8, 1.35, -1.9], fov: 42 }],
  cochilo: [{ f: 1140, pos: [-1.76, 1.52, -0.5], look: [-1.8, 1.48, -1.9], fov: 34 }, { f: 1220, pos: [-1.76, 1.52, -0.8], look: [-1.8, 1.48, -1.9], fov: 32 }],
  horas: [{ f: 1221, pos: [-1.0, 1.7, 3.6], look: [-3.4, 0.9, 1.0], fov: 48 }, { f: 1334, pos: [-1.4, 1.65, 3.2], look: [-3.4, 0.9, 1.0], fov: 46 }],
  dorme: [{ f: 1335, pos: [-0.6, 1.9, 1.25], look: [-3.8, 0.75, 1.15], fov: 50 }, { f: 1434, pos: [-0.9, 1.85, 1.25], look: [-3.8, 0.75, 1.15], fov: 48 }],
  recordes: [{ f: 1435, pos: [0.6, 2.5, 2.5], look: [0.6, 0.86, 1.4], fov: 42 }, { f: 1532, pos: [0.6, 2.2, 2.3], look: [0.6, 0.86, 1.4], fov: 40 }],
  perigoso: [{ f: 1533, pos: [0.6, 2.2, 2.3], look: [0.6, 0.86, 1.4], fov: 40 }, { f: 1579, pos: [0.6, 2.0, 2.1], look: [0.6, 0.86, 1.4], fov: 40, ease: 'easeOut' }],
  tonico: [{ f: 1580, pos: [1.4, 1.6, 2.8], look: [3.7, 1.45, 0.1], fov: 46 }, { f: 1678, pos: [1.8, 1.6, 2.4], look: [3.7, 1.45, 0.1], fov: 44 }],
  boceja: [{ f: 1679, pos: [2.2, 1.55, 1.7], look: [3.3, 1.5, 0.3], fov: 36 }, { f: 1759, pos: [2.4, 1.55, 1.4], look: [3.3, 1.5, 0.3], fov: 34 }],
  olha: [{ f: 1760, pos: [-1.3, 1.65, 2.2], look: [0.9, 1.25, -1.4], fov: 50 }, { f: 1832, pos: [-1.0, 1.6, 1.7], look: [1.0, 1.25, -1.5], fov: 48 }],
  loop: [{ f: 1833, pos: [0.05, 1.5, 0.75], look: [1.2, 1.3, -1.55], fov: 42 }, { f: 1919, pos: [0.05, 1.5, 0.75], look: [1.2, 1.3, -1.55], fov: 42 }],
};
const KICKS = [{ f: 75, a: 0.05 }, { f: 591, a: 0.07 }, { f: 812, a: 0.05 }, { f: 1533, a: 0.08 }];
export const camAt = (f) => { const S = shotAt(f); const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS }); c.shadowAt = c.look; return c; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shotAt(f), C = camAt(f); if (['sandiego', 'ganha', 'horas'].includes(S.id)) return { focus: dist(C.pos, C.look), cinf: 2 }; return { focus: dist(C.pos, C.look), cinf: 6 }; };
// bola de basquete: arremesso da mão do Randy até o aro
const BALL = (f) => { const t = clamp((f - 930) / 34); if (f < 930) return [QX - 1.0, 1.25 + Math.abs(Math.sin(f * 0.25)) * 0.0, -5.3];
  if (f > 964) { const u = clamp((f - 964) / 20); return [QX, Math.max(0.13, 2.8 - u * 2.7 + Math.abs(Math.sin(u * 9)) * 0.4 * (1 - u)), -8.9 + u * 1.5]; }
  return [lerp(QX - 1.0, QX, t), 1.25 + (3.05 - 1.25) * t + Math.sin(t * Math.PI) * 1.4, lerp(-5.3, -8.9, t)]; };
export const worldAt = (f) => { const S = shotAt(f); const night = ['roomN', 'streetN', 'court'].includes(S.light);
  const fastClock = ['meta', 'dorme'].includes(S.id) ? (S.id === 'dorme' ? 6 + (f - 1335) * 0.15 : 9 + (f - 372) * 0.09) : (night ? 3.2 + f * 0.0005 : 10.5 + f * 0.0005);
  return { noClouds: night, night, clock: fastClock, stamp: f >= 1540 && S.id === 'perigoso', blanket: !['dorme', 'horas'].includes(S.id) || S.id === 'horas', ball: S.id === 'basquete' ? BALL(f) : [QX + 3, 0.13, -3], easel: ['randy'].includes(S.id) }; };
// ---------- actors ----------
const base = (f, seed) => { const i = idle(f, seed); return { seed, bob: q(i.bob, 4), tilt: q(i.tilt, 2), headTilt: q(i.headTilt, 2), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos, extra = {}) => ({ key: (typeof who === 'string' ? who : who.tunic) + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const ACT = (T, f, who, seed, expr, arms, pos, extra = {}, more = {}) => { const k = Math.floor((f + seed * 7) / 20) % arms.length, ex = Array.isArray(expr) ? expr[Math.floor((f + seed * 5) / 28) % expr.length] : expr;
  return R(T, who, { ...base(f, seed), expr: ex, L: arms[k][0], R: arms[k][1], holdR: arms[k][2] ?? undefined, facing: arms[k][3] ?? 0, look: arms[k][4] ?? 0, ...more }, pos, extra); };
const RANDY = 'randy', DEM = 'cientista2', TON = 'tonicoPij';
// fx: texto/ícones desenhados num cartão (600x1000, chão em y = 975)
const FX = (key, fn, pos, s = 1, extra = {}) => ({ key, draw: fn, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const zzz = (t) => (p) => { const g = p.g; g.font = '900 150px Inter, sans-serif'; g.lineWidth = 16; g.strokeStyle = '#1a1424'; g.fillStyle = '#ffffff';
  [['z', 260, 760, 0.7], ['Z', 330, 600, 0.85], ['Z', 410, 420, 1]].forEach(([c, x, y, k], i) => { const a = clamp(t * 3 - i); if (a <= 0) return; g.save(); g.globalAlpha = a; g.translate(x, y - t * 40); g.scale(k, k); g.strokeText(c, 0, 0); g.fillText(c, 0, 0); g.restore(); }); };
const qmark = (t) => (p) => { const g = p.g; g.font = '900 260px Inter, sans-serif'; g.textAlign = 'center'; g.lineWidth = 20; g.strokeStyle = '#1a1424'; g.fillStyle = '#ffd23f';
  [[200, 520, -0.25], [400, 420, 0.2]].forEach(([x, y, r], i) => { g.save(); g.translate(x, y + Math.sin(t * 6 + i) * 12); g.rotate(r); g.strokeText('?', 0, 0); g.fillText('?', 0, 0); g.restore(); }); };
const nausea = (t) => (p) => { const g = p.g; g.lineWidth = 14; g.strokeStyle = '#7ac74a'; for (let i = 0; i < 3; i++) { g.beginPath(); for (let k = 0; k <= 20; k++) { const x = 140 + k * 16, y = 380 + i * 70 + Math.sin(k * 0.8 + t * 8 + i) * 16; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } };
const talkSign = (t) => (p) => { const g = p.g; g.save(); g.translate(300, 520); g.rotate(Math.sin(t * 5) * 0.06);
  g.fillStyle = '#2f7a4a'; g.strokeStyle = '#1a1424'; g.lineWidth = 12; g.beginPath(); g.roundRect(-230, -110, 460, 220, 24); g.fill(); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.beginPath(); g.roundRect(-205, -85, 410, 170, 14); g.stroke();
  for (const x of [-80, 80]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, -20, 34, 0, 7); g.fill(); g.fillStyle = '#1a1424'; g.beginPath(); g.arc(x + 6, -16, 15, 0, 7); g.fill(); }
  const m = 20 + Math.abs(Math.sin(t * 9)) * 30; g.fillStyle = '#5a1420'; g.beginPath(); g.ellipse(0, 50, 50, m / 2, 0, 0, 7); g.fill();
  g.restore(); g.fillStyle = '#fff'; g.strokeStyle = '#1a1424'; g.lineWidth = 10; g.beginPath(); g.roundRect(330, 180, 230, 140, 30); g.fill(); g.stroke();
  g.fillStyle = '#1a1424'; g.font = '900 80px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('OI!', 445, 280); g.fillStyle = '#9aa0a8'; g.fillRect(290, 630, 20, 345); };
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = []; const push = (a) => out.push(a); const t = (f - S.a) / 30;
  switch (id) {
    case 'abre': case 'loop': { push(ACT(T, f, RANDY, 3, ['dazed', 'laugh'], [['reach', 'reach', null, 1, 0.4], ['reach', 'up', null, 1, 0.4]], RD, {}, { blink: f % 47 < 6 ? 1 : 0.55 })); break; }
    case 'ganha': push(ACT(T, f, RANDY, 3, ['laugh', 'excited'], [['up', 'up'], ['up', 'wave']], [RD[0] - 0.3, 0, RD[2] + 0.1], {}, { blink: 0.5 }));
      push(ACT(T, f, DEM, 9, ['shock', 'surprised'], [['cheek', 'hang'], ['cheek', 'cheek']], [2.05, 0, -0.35])); break;
    case 'sandiego': push(ACT(T, f, RANDY, 3, ['smile', 'grin'], [['wave', 'hang'], ['hang', 'wave']], [RX - 5.5 + (f - 160) * 0.008, 0, 2.2], { s: 1 }, { step: q((f * 0.05) % 1, 2) })); break;
    case 'randy': push(ACT(T, f, RANDY, 3, ['grin', 'smile', 'determined'], [['hip', 'point', null, 1, 0.5], ['thumb', 'hip'], ['hip', 'point', null, 1, 0.5]], [2.4, 0, 0.7])); break;
    case 'meta': push(ACT(T, f, RANDY, 3, ['determined', 'grin'], [['hip', 'point', null, -1, -0.5], ['up', 'point', null, -1, -0.5]], [-0.1, 0, -2.0])); break;
    case 'amigos': push(ACT(T, f, RANDY, 3, ['smile', 'nervous'], [['hang', 'hang']], [-1.8, 0, -1.85]));
      push(ACT(T, f, 'joao', 5, ['stern', 'determined'], [['cross', 'cross'], ['hip', 'point', null, 1, 0.3]], [-2.8, 0, -1.6]));
      push(ACT(T, f, 'pedro', 7, ['stern', 'smug'], [['cross', 'cross'], ['point', 'hip', null, -1, -0.3]], [-0.8, 0, -1.6])); break;
    case 'piscou': push(ACT(T, f, RANDY, 3, 'dazed', [['hang', 'hang']], [-1.8, 0, -1.85], {}, { blink: q(clamp(0.35 + ramp(f, 562, 588) * 0.65), 2), noAnim: 1 })); break;
    case 'sacudida': { const sh = f < 615 ? Math.sin(f * 2.6) * 0.05 : 0; push(ACT(T, f, RANDY, 3, ['shock', 'surprised'], [['up', 'up']], [-1.8 + sh, 0, -1.85], {}, { blink: 0 }));
      push(ACT(T, f, 'pedro', 7, 'angry', [['reach', 'reach', null, -1, -0.4]], [-0.95, 0, -1.6])); break; }
    case 'enjoo': push(ACT(T, f, RANDY, 3, ['disgust', 'pained'], [['belly', 'cheek'], ['belly', 'belly']], [0.6, 0, -1.6], { tint: '#dff2cf' }, { blink: 0.5 }));
      push(FX('nau' + q(t, 1), nausea(t), [0.6, 0.25, -1.55], 0.7)); break;
    case 'memoria': push(ACT(T, f, RANDY, 3, ['confused', 'dazed'], [['temple', 'hang'], ['temple', 'temple']], [0.6, 0, -1.6], {}, { blink: 0.5 }));
      push(FX('qm' + q(t, 1), qmark(t), [0.6, 1.25, -1.62], 0.6)); break;
    case 'placa': push(ACT(T, f, RANDY, 3, ['confused', 'surprised'], [['hang', 'point', null, 1, 0.6], ['temple', 'point', null, 1, 0.6]], [SG[0] - 1.6, 0, SG[2] + 1.6], {}, { blink: 0.5 })); break;
    case 'pessoa': push(ACT(T, f, RANDY, 3, ['smile', 'grin'], [['hang', 'wave', null, 1, 0.6]], [SG[0] - 1.3, 0, SG[2] + 1.9], {}, { blink: 0.5, wv: f * 0.4 }));
      push(ACT(T, f, 'civA', 11, 'smile', [['wave', 'hang', null, -1, -0.5]], [SG[0], 0, SG[2] + 0.05], { alpha: 0.82, tint: '#d8e8ff' }, { wv: f * 0.4 })); break;
    case 'cientista': { const x = lerp(RX - 4.5, RX - 1.4, E.smooth(ramp(f, 837, 880))); push(ACT(T, f, DEM, 9, ['smile', 'determined'], [['hang', 'reach', 'clipboard', 1, 0.5]], [x, 0, -4.4], {}, { step: f < 880 ? q((f * 0.06) % 1, 2) : 0 }));
      push(ACT(T, f, RANDY, 3, ['surprised', 'smile'], [['hang', 'wave', null, -1, -0.4], ['hang', 'hang']], [RX + 0.2, 0, -4.8], {}, { blink: 0.5 })); break; }
    case 'basquete': push(ACT(T, f, RANDY, 3, ['determined', 'excited'], f < 930 ? [['up', 'up']] : [['up', 'hang'], ['up', 'up']], [QX - 1.2, 0, -5.4], {}, { blink: 0.5 }));
      push(ACT(T, f, DEM, 9, ['excited', 'smile'], [['up', 'hip'], ['hip', 'up']], [QX + 0.8, 0, -5.0])); break;
    case 'apagou': push(ACT(T, f, RANDY, 3, 'dazed', [['hang', 'hang']], [QX - 1.2, 0, -5.4], {}, { blink: q(0.5 + 0.4 * Math.abs(Math.sin(f * 0.07)), 2), noAnim: 1 })); break;
    case 'cerebro': case 'cochilo': { const off = id === 'cochilo' ? (f % 40) < 22 : (f % 55) < 15;
      push(ACT(T, f, RANDY, 3, 'dazed', [['hang', 'hang']], [-1.8, 0, -1.85], {}, { blink: 0.45, noAnim: 1 }));
      if (off) push(FX('zz' + q(((f % 40) / 22), 1), zzz(clamp((f % 40) / 22)), [-1.45, 1.0, -1.83], 0.45)); break; }
    case 'horas': push(ACT(T, f, RANDY, 3, ['dazed', 'relief'], [['hang', 'hang']], [lerp(-1.6, -3.0, E.smooth(ramp(f, 1221, 1300))), 0, 1.6], {}, { blink: 0.6, step: f < 1300 ? q((f * 0.05) % 1, 2) : 0 })); break;
    case 'dorme': push(ACT(T, f, RANDY, 3, 'smile_closed', [['hang', 'hang']], [-3.8, 0.8, 2.25], { face: 'cam', roll: -Math.PI / 2, blob: false, s: 0.95 }, { blink: 1, noAnim: 1 }));
      push(FX('zz' + q(((f - 1335) % 45) / 45, 1), zzz(((f - 1335) % 45) / 45), [-3.8, 1.05, 0.45], 0.5)); break;
    case 'recordes': case 'perigoso': break;
    case 'tonico': push(ACT(T, f, TON, 4, ['dazed', 'confused'], [['hang', 'hang', null, 1, 0.6], ['temple', 'hang', null, 1, 0.6]], [2.45, 0, 1.25], {}, { blink: 0.55 }));
      push(FX('sg' + q(t, 1), talkSign(t), [4.25, 0.75, -0.1], 0.6)); break;
    case 'boceja': push(ACT(T, f, TON, 4, f < 1725 ? 'shock' : 'dazed', [['up', 'up']], [3.4, 0, 0.3], {}, { blink: f < 1725 ? 1 : 0.55, noAnim: 1 })); break;
    case 'olha': push(ACT(T, f, TON, 4, ['dazed', 'surprised'], [['hang', 'point', null, 1, 0.6]], [-0.35, 0, -0.1], {}, { blink: 0.55 }));
      push(ACT(T, f, RANDY, 3, 'dazed', [['reach', 'reach', null, 1, 0.4]], RD, { alpha: 0.55, tint: '#dfe8ff' }, { blink: 0.55 })); break;
  }
  return out;
};
export const fxAt = (f, T) => [];
