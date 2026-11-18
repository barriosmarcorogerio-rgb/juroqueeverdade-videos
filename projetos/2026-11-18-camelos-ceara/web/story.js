// "Os camelos de Dom Pedro II" (Ceará, 1859) — 1884 quadros, 30 fps.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, walk } from './motion.js';
export const FPS = 30, TOTAL = 1884, DECK = 0;
const PX = 1700;
const SH = [
  ['dp1', 0, 'day'], ['sertao1', 47, 'day'], ['pensa', 94, 'day'], ['ideia', 125, 'day'],
  ['mar1', 200, 'sea'], ['doca', 264, 'sea'], ['doca2', 306, 'sea'],
  ['convés', 359, 'sea'], ['marin', 449, 'sea'],
  ['seco', 534, 'hot'], ['mula', 593, 'hot'], ['heroi', 643, 'hot'],
  ['desemb', 717, 'sea'], ['povo', 787, 'sea'], ['cospe', 833, 'sea'], ['fiscal', 872, 'sea'], ['chapeu', 917, 'sea'],
  ['vaq1', 992, 'day'], ['deita', 1037, 'day'], ['sentado', 1086, 'day'],
  ['estranho', 1133, 'gold'], ['quadro', 1194, 'gold'], ['torce', 1263, 'gold'],
  ['calor', 1378, 'gold'], ['ninguem', 1446, 'gold'],
  ['pata', 1523, 'dusk'], ['esquec', 1590, 'dusk'],
  ['relat', 1672, 'dawn'], ['silh', 1776, 'dawn'], ['papel', 1840, 'dawn'],
];
export const SHOTS = SH.map(([id, a, light], i) => ({ id, a, b: (SH[i + 1] ? SH[i + 1][1] : TOTAL) - 1, light }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const LIGHTS = {
  day: { az: 40, el: 60, sky: '#d9e8ff', ground: '#8a6a4a', hemi: 1.45, sun: '#fff2d8', sunI: 3.4, fog: '#d8e2ee', fogNear: 80, fogFar: 650, skyTop: '#2a6ad6', skyHor: '#cfe0f2', sat: 1.12, vig: 0.18, shadowExt: 14, sunDisc: '#fff6d8', sunSize: 0.004 },
  hot: { az: 40, el: 70, sky: '#ffe6c0', ground: '#9a6a3a', hemi: 1.5, sun: '#fff0c8', sunI: 3.8, fog: '#f0dcc0', fogNear: 60, fogFar: 500, skyTop: '#4a86d6', skyHor: '#f6dcb8', sat: 1.18, vig: 0.22, shadowExt: 16, sunDisc: '#fffbe8', sunSize: 0.01, gain: '#fff4e6' },
  sea: { az: -60, el: 45, sky: '#d6e8ff', ground: '#6a7a8a', hemi: 1.5, sun: '#fff4e0', sunI: 3.1, fog: '#cfe2f2', fogNear: 120, fogFar: 800, skyTop: '#2c70d8', skyHor: '#c6dcf4', sat: 1.1, vig: 0.16, shadowExt: 18, sunDisc: '#fff6d8', sunSize: 0.004 },
  gold: { az: 20, el: 14, sky: '#ffd9a8', ground: '#6a4a2a', hemi: 1.25, sun: '#ffb46a', sunI: 3.4, fog: '#f2c494', fogNear: 60, fogFar: 600, skyTop: '#4a78c8', skyHor: '#ffc38a', sat: 1.15, vig: 0.24, shadowExt: 16, sunDisc: '#fff0c0', sunSize: 0.006, gain: '#fff2e2' },
  dusk: { az: 10, el: 4, sky: '#9a7ac0', ground: '#3a2a3a', hemi: 1.05, sun: '#ff8a4a', sunI: 2.4, fog: '#d9806a', fogNear: 80, fogFar: 650, skyTop: '#2a2c6e', skyHor: '#ff8f52', sat: 1.18, vig: 0.3, shadowExt: 30, sunDisc: '#ffd28a', sunSize: 0.012, gain: '#f2e6ff' },
  dawn: { az: 120, el: 10, sky: '#ffd6c8', ground: '#6a5a4a', hemi: 1.35, sun: '#ffd2a8', sunI: 2.8, fog: '#f0d2c8', fogNear: 60, fogFar: 650, skyTop: '#6a8fd6', skyHor: '#ffcfae', sat: 1.12, vig: 0.22, shadowExt: 14, sunDisc: '#fff4dc', sunSize: 0.008 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });
// places
const DP = [0, 0, 0], CAM0 = [2.2, 0, -0.4];
const DK = [PX + 6, 1.1, 2];             // on the pier
const DECKP = [PX + 13, 2.05, -1];        // ship deck centre
const SECA = [0, 0, -2];
const CAMS = {
  dp1: [{ f: 0, pos: [1.2, 1.55, 3.2], look: [0, 1.7, 0], fov: 40 }, { f: 46, pos: [1.0, 1.6, 2.6], look: [0, 1.75, 0], fov: 38 }],
  sertao1: [{ f: 47, pos: [-2, 2.4, 6], look: [0, 1.5, -20], fov: 55 }, { f: 93, pos: [-1, 3.6, 6], look: [0, 1.8, -20], fov: 52 }],
  pensa: [{ f: 94, pos: [0.4, 1.7, 2.6], look: [0, 1.8, 0], fov: 36 }, { f: 124, pos: [0.35, 1.7, 2.4], look: [0, 1.8, 0], fov: 35 }],
  ideia: [{ f: 125, pos: [1.2, 1.8, 4.2], look: [0.9, 2.0, 0], fov: 46 }, { f: 199, pos: [1.1, 1.8, 3.6], look: [0.9, 2.0, 0], fov: 44 }],
  mar1: [{ f: 200, pos: [PX + 44, 7, -34], look: [PX + 13, 5, -1], fov: 46 }, { f: 263, pos: [PX + 38, 6, -28], look: [PX + 13, 5, -1], fov: 44 }],
  doca: [{ f: 264, pos: [PX + 1, 2.9, 9], look: [PX + 6, 1.8, 1], fov: 50 }, { f: 305, pos: [PX + 1.5, 2.8, 8.2], look: [PX + 6, 1.8, 1], fov: 48 }],
  doca2: [{ f: 306, pos: [PX + 4.3, 2.6, 5.4], look: [PX + 6.2, 2.6, 2], fov: 42 }, { f: 358, pos: [PX + 4.5, 2.6, 5.0], look: [PX + 6.2, 2.6, 2], fov: 40 }],
  'convés': [{ f: 359, pos: [PX + 13, 6.5, 10.5], look: [PX + 13, 2.2, -2], fov: 50 }, { f: 448, pos: [PX + 13, 5.8, 9.2], look: [PX + 13, 2.2, -2], fov: 48 }],
  marin: [{ f: 449, pos: [PX + 13.3, 3.9, 3.6], look: [PX + 13, 3.8, 1.2], fov: 42 }, { f: 533, pos: [PX + 13.3, 3.9, 3.3], look: [PX + 13, 3.85, 1.2], fov: 40 }],
  seco: [{ f: 534, pos: [18, 14, 22], look: [0, 0, -2], fov: 50 }, { f: 592, pos: [14, 10, 18], look: [0, 0, -2], fov: 48 }],
  mula: [{ f: 593, pos: [-1.6, 1.0, 3.2], look: [-2.2, 0.7, 0.5], fov: 42 }, { f: 642, pos: [-1.7, 0.95, 2.8], look: [-2.2, 0.7, 0.5], fov: 40 }],
  heroi: [{ f: 643, pos: [3.4, 0.5, 3.8], look: [2.2, 1.8, -0.4], fov: 46 }, { f: 716, pos: [3.2, 0.45, 3.2], look: [2.2, 1.9, -0.4], fov: 44 }],
  desemb: [{ f: 717, pos: [PX - 2, 3.4, 9], look: [PX + 7, 1.8, 0], fov: 48 }, { f: 786, pos: [PX - 1, 3.2, 8], look: [PX + 7, 1.8, 0], fov: 46 }],
  povo: [{ f: 787, pos: [PX + 1, 2.5, 8.2], look: [PX + 0.5, 2.4, 15], fov: 54 }, { f: 832, pos: [PX + 1, 2.5, 8.8], look: [PX + 0.5, 2.4, 15], fov: 52 }],
  cospe: [{ f: 833, pos: [PX + 5.8, 3.0, 8.4], look: [PX + 4.8, 2.9, 11.6], fov: 42 }, { f: 871, pos: [PX + 5.7, 3.0, 8.7], look: [PX + 4.8, 2.9, 11.6], fov: 40 }],
  fiscal: [{ f: 872, pos: [PX + 2.6, 2.95, 9.4], look: [PX + 2.4, 2.85, 12.5], fov: 40 }, { f: 916, pos: [PX + 2.6, 2.95, 9.8], look: [PX + 2.4, 2.9, 12.5], fov: 38 }],
  chapeu: [{ f: 917, pos: [PX - 0.3, 2.7, 8.2], look: [PX - 0.5, 2.5, 12.2], fov: 48 }, { f: 991, pos: [PX - 0.3, 2.7, 8.8], look: [PX - 0.5, 2.55, 12.2], fov: 46 }],
  vaq1: [{ f: 992, pos: [-3, 1.5, 5.5], look: [-0.5, 1.2, 0], fov: 48 }, { f: 1036, pos: [-2.6, 1.5, 5.0], look: [-0.5, 1.2, 0], fov: 46 }],
  deita: [{ f: 1037, pos: [0.4, 1.0, 4.2], look: [0, 0.9, 0], fov: 44 }, { f: 1085, pos: [0.4, 0.9, 3.8], look: [0, 0.8, 0], fov: 42 }],
  sentado: [{ f: 1086, pos: [1.4, 1.3, 3.8], look: [0, 1.0, 0], fov: 44 }, { f: 1132, pos: [1.3, 1.25, 3.4], look: [0, 1.0, 0], fov: 42 }],
  estranho: [{ f: 1133, pos: [9, 1.2, 12], look: [0, 2, -6], fov: 46 }, { f: 1193, pos: [8, 1.4, 10.5], look: [0, 2.2, -6], fov: 44 }],
  quadro: [{ f: 1194, pos: [5.2, 1.9, 5.2], look: [3.7, 1.6, -1.0], fov: 50 }, { f: 1262, pos: [5.0, 1.9, 4.6], look: [3.7, 1.6, -1.0], fov: 48 }],
  torce: [{ f: 1263, pos: [2.6, 1.4, 5.6], look: [2.6, 1.3, -0.6], fov: 50 }, { f: 1377, pos: [2.5, 1.5, 4.8], look: [2.6, 1.3, -0.6], fov: 46 }],
  calor: [{ f: 1378, pos: [-4, 0.6, 7], look: [0, 2.2, -4], fov: 52 }, { f: 1445, pos: [-3.4, 0.7, 6.2], look: [0, 2.4, -4], fov: 50 }],
  ninguem: [{ f: 1446, pos: [1.4, 1.6, 4.4], look: [0.6, 1.3, 0], fov: 46 }, { f: 1522, pos: [1.3, 1.6, 4.0], look: [0.6, 1.3, 0], fov: 44 }],
  pata: [{ f: 1523, pos: [2.2, 1.2, 3.8], look: [0.6, 0.8, 0], fov: 46 }, { f: 1589, pos: [2.0, 1.2, 3.4], look: [0.6, 0.8, 0], fov: 44 }],
  esquec: [{ f: 1590, pos: [4, 1.6, 8], look: [0, 1.0, -6], fov: 50 }, { f: 1671, pos: [10, 9, 22], look: [0, 0.6, -6], fov: 50 }],
  relat: [{ f: 1672, pos: [7.6, 1.7, 9.2], look: [5.6, 1.3, 6], fov: 46 }, { f: 1775, pos: [7.3, 1.65, 8.6], look: [5.6, 1.3, 6], fov: 44 }],
  silh: [{ f: 1776, pos: [3, 0.4, 10], look: [-2, 2.6, -10], fov: 50 }, { f: 1839, pos: [2.6, 0.45, 9.2], look: [-2, 2.7, -10], fov: 48 }],
  papel: [{ f: 1840, pos: [6.1, 2.15, 6.75], look: [6, 0.8, 6.0], fov: 46 }, { f: 1883, pos: [6.03, 1.6, 6.32], look: [6, 0.8, 6.0], fov: 42 }],
};
const KICKS = [{ f: 161, a: 0.05 }, { f: 872, a: 0.06 }, { f: 942, a: 0.05 }, { f: 1052, a: 0.07 }, { f: 1100, a: 0.04 }];
export const camAt = (f) => { const S = shotAt(f); const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS }); c.shadowAt = c.look; if (['seco', 'mar1', 'esquec', 'estranho', 'silh', 'calor'].includes(S.id)) c.shadowAt = [S.id === 'mar1' ? PX + 13 : 0, 0, -2]; return c; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shotAt(f), C = camAt(f); if (['seco', 'mar1', 'sertao1', 'esquec', 'silh'].includes(S.id)) return { focus: 10, cinf: 0 }; return { focus: dist(C.pos, C.look), cinf: 8 }; };
export const worldAt = (f) => ({ noClouds: false });
// ---------- actors ----------
const base = (f, seed) => { const i = idle(f, seed); return { seed, bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const CM = (T, o, pos, extra = {}) => ({ key: 'cam' + JSON.stringify(o), draw: (p) => T.fxCamel(p, o), x: pos[0], y: pos[1], z: pos[2], s: extra.s ?? 1.35, ...extra });
const cb = (f, k) => ({ chew: q((f + k * 7) * 0.4 % 6.28, 1), blink: (f + k * 13) % 70 < 4 ? 1 : 0 });
const HERD = (y0, x0, z0, n, f, wk = 0, flipAll = false) => { const out = []; for (let i = 0; i < n; i++) { const c = i % 5, r = Math.floor(i / 5); out.push([x0 + c * 1.6 - 3.2 + (r % 2) * 0.6, y0, z0 - r * 2.2, i]); } return out; };
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const push = (a) => out.push(a);
  switch (id) {
    case 'dp1': push(R(T, 'dpedro', { ...base(f, 3), expr: 'neutral', L: 'temple', R: 'hang', facing: -1, look: -0.4 }, DP)); break;
    case 'sertao1': push(R(T, 'dpedro', { ...base(f, 3), expr: 'neutral', L: 'temple', R: 'hang', facing: 0 }, DP)); break;
    case 'pensa': push(R(T, 'dpedro', { ...base(f, 3), expr: 'stern', L: 'temple', R: 'hip', swirl: q(f * 0.2, 1) }, DP)); break;
    case 'ideia': { const t = clamp((f - 161) / 10);
      push(R(T, 'dpedro', { ...base(f, 3), expr: f < 161 ? 'stern' : 'grin', L: f < 161 ? 'temple' : 'up', R: 'hip', look: 0.4, facing: 1, blink: f < 161 ? 0 : base(f, 3).blink }, DP));
      if (f >= 150) push({ key: 'th' + q(clamp((f - 150) / 12), 1), draw: (p) => T.fxThought(p, clamp((f - 150) / 12)), x: 1.3, y: 1.6, z: -0.2, s: 0.9 + 0.1 * E.back(t), blob: false, shadow: false, order: 5 });
      break; }
    case 'mar1': for (const [x, y, z, i] of HERD(2.05, PX + 13, 2.5, 6, f)) push(CM(T, { ...cb(f, i) }, [x * 0 + PX + 13 + (i % 3 - 1) * 1.4, 2.05, 3 - Math.floor(i / 3) * 4], { s: 1.2 })); break;
    case 'doca': case 'doca2': {
      for (const [x, y, z, i] of HERD(1.1, PX + 6, 6, id === 'doca' ? 14 : 5, f)) push(CM(T, { ...cb(f, i), walk: 0 }, [PX + 6 + ((i % 2) ? 0.7 : -0.7), 1.1, 7.5 - i * 1.5], { s: 1.2, flip: i % 3 === 0 }));
      break; }
    case 'convés': case 'marin': {
      for (let i = 0; i < 10; i++) push(CM(T, { ...cb(f, i), mouth: id === 'marin' && i === 0 ? 0 : 0 }, [PX + 13 + (i % 2 ? 1.3 : -1.3), 2.05, 6 - Math.floor(i / 2) * 2.6], { s: 1.15, flip: i % 2 === 0 }));
      push(R(T, 'marinheiro', { ...base(f, 9), expr: id === 'marin' && f > 500 ? 'shock' : 'nervous', L: id === 'marin' && f > 500 ? 'up' : 'cheek', R: id === 'marin' ? 'point' : 'cheek', facing: 1, look: 0.4 }, [PX + 13, 2.05, 1.2]));
      break; }
    case 'seco': for (let i = 0; i < 3; i++) push(CM(T, { mule: true, lie: 1, blink: 1 }, [-6 + i * 4, 0, -2 - i * 3], { s: 1.0 })); push(R(T, 'vaqueiro', { ...base(f, 5), expr: 'pained', L: 'temple', R: 'hang' }, [-1, 0, 0])); break;
    case 'mula': push(CM(T, { mule: true, lie: 1, mouth: 0.5, blink: (f % 40) < 20 ? 1 : 0 }, [-2.2, 0, 0.5], { s: 0.95 })); break;
    case 'heroi': push(CM(T, { ...cb(f, 1), wide: f > 690 }, CAM0, { s: 1.5 })); break;
    case 'desemb': case 'povo': case 'cospe': case 'fiscal': case 'chapeu': {
      const crowd = [['civA', -4, 14.6], ['civB', -2.6, 14.8], ['velha', -1.0, 14.6], ['civC', 0.6, 14.8], ['civD', 2.2, 14.6], ['workA', 3.8, 14.8], ['civA', -5.5, 14.7], ['civB', 5.2, 14.7]];
      crowd.forEach(([w, dx, z], k) => push(R(T, w, { ...base(f, 20 + k), expr: k % 2 ? 'shock' : 'grin', L: k % 3 ? 'hang' : 'point', R: k % 2 ? 'cheek' : 'hang', facing: 0 }, [PX + dx, 1.1, z])));
      const walking = id === 'desemb';
      for (let i = 0; i < 6; i++) push(CM(T, { ...cb(f, i), walk: walking ? q(((f / 30) * 1.2 + i * 0.3) % 1, 2) : 0 }, [PX + 6 + (i % 2 ? 0.6 : -0.6), 1.1, (walking ? -6 + (f - 717) * 0.05 : 0) + 6 - i * 1.6], { s: 1.2, flip: true }));
      // spitter + fiscal
      const sp = id === 'cospe' && f > 860 || (id === 'fiscal' && f < 880);
      push(CM(T, { ...cb(f, 7), spit: sp ? 1 : 0, wide: id === 'fiscal' }, [PX + 5.2, 1.1, 11.6], { s: 1.25, flip: true }));
      push(R(T, 'fiscal', { ...base(f, 31), expr: id === 'fiscal' && f > 878 ? 'shock' : 'stern', L: id === 'fiscal' && f > 878 ? 'up' : 'hang', R: 'hang', facing: 1, look: 0.5, blink: 0 }, [PX + 2.4, 1.1, 12.5]));
      if (id === 'cospe' && f > 862) { const t = q(clamp((f - 862) / 10), 2); push({ key: 'spit' + t, draw: (p) => T.fxSpit(p, t), x: PX + 4.6 - t * 2.0, y: 2.6 + t * 0.1, z: 11.6 + t * 0.8, s: 0.4, blob: false, shadow: false, order: 6 }); }
      if (id === 'fiscal' && f < 900) push({ key: 'spitF', draw: (p) => T.fxSpit(p, 1), x: PX + 2.45, y: 2.25, z: 12.4, s: 0.45, blob: false, shadow: false, order: 6 });
      // coronel + hat thief
      const ate = f >= 942;
      push(R(T, 'coronel', { ...base(f, 33), expr: ate ? 'shock' : 'neutral', L: ate ? 'cheek' : 'hip', R: ate ? 'cheek' : 'hip', facing: -1, look: ate ? 0.6 : -0.3, blink: ate ? 0 : base(f, 33).blink }, [PX - 1.2, 1.1, 12.5]));
      if (!ate) push({ key: 'hat', draw: (p) => T.fxHat(p), x: PX - 1.2, y: 1.1 + 1.22, z: 12.45, s: 0.42, blob: false, shadow: false, order: 4 });
      push(CM(T, { ...cb(f, 9), hat: ate, chew: ate ? q(f * 0.5 % 6.28, 1) : 0 }, [PX + 0.5, 1.1, 11.9], { s: 1.25, flip: false }));
      break; }
    case 'vaq1': case 'deita': case 'sentado': {
      const lie = id === 'vaq1' ? 0 : id === 'deita' ? q(clamp((f - 1052) / 8), 2) : 1;
      push(CM(T, { ...cb(f, 2), lie, wide: false, blink: id === 'sentado' ? 1 : cb(f, 2).blink }, [0, 0, 0], { s: 1.35 }));
      if (id === 'vaq1') push(R(T, 'vaqueiro', { ...base(f, 5), expr: 'grin', L: 'reach', R: 'hang', facing: 1, look: 0.5, step: q(walk(f, 992, 1, 0.5).phase, 2) }, [lerp(-2.6, -1.2, clamp((f - 992) / 40)), 0, 0.3]));
      else if (id === 'deita') push(R(T, 'vaqueiro', { ...base(f, 5), expr: f > 1052 ? 'shock' : 'grin', L: 'up', R: 'reach', facing: 1, look: 0.5, bob: f > 1052 ? -0.08 : 0 }, [-0.4, f > 1052 ? 0.3 : 0.75, 0.35]));
      else push(R(T, 'vaqueiro', { ...base(f, 5), expr: 'nervous', L: 'belly', R: 'temple', facing: 1 }, [-0.3, 0.62, 0.05]));
      break; }
    case 'estranho': for (let i = 0; i < 5; i++) push(CM(T, { ...cb(f, i) }, [-6 + i * 3, 0, -6 - (i % 2) * 2], { s: 1.35, flip: i % 2 === 0 })); break;
    case 'quadro': push(R(T, 'cientC', { ...base(f, 41), expr: 'stern', L: 'point', R: 'hang', facing: 1, look: 0.6 }, [3.0, 0, -0.6])); break;
    case 'torce': push(CM(T, { ...cb(f, 3) }, [2.6, 0, -1.4], { s: 1.35 })); push(R(T, 'cientC', { ...base(f, 41), expr: 'nervous', L: 'cross', R: 'cross', facing: 1, look: 0.4 }, [1.0, 0, -0.4])); break;
    case 'calor': for (let i = 0; i < 4; i++) push(CM(T, { ...cb(f, i), blink: 1 }, [-3 + i * 2.2, 0, -4 - (i % 2) * 1.5], { s: 1.3, flip: i % 2 === 1 })); break;
    case 'ninguem': push(CM(T, { ...cb(f, 4), spit: f > 1480 && f < 1500 ? 1 : 0 }, [1.6, 0, -0.4], { s: 1.35, flip: true }));
      push(R(T, 'vaqueiro', { ...base(f, 5), expr: 'nervous', L: 'temple', R: 'hang', facing: -1 }, [-0.4, 0, 0.4])); push(R(T, 'cientC', { ...base(f, 41), expr: 'nervous', L: 'hang', R: 'temple', swirl: q(f * 0.2, 1), facing: 1 }, [0.4, 0, 0.0])); break;
    case 'pata': push(CM(T, { lie: 1, bandage: true, blink: 1 }, [0.6, 0, -0.6], { s: 1.35 })); push(R(T, 'vaqueiro', { ...base(f, 5), expr: 'pained', L: 'belly', R: 'hang' }, [-0.8, 0, 0.3])); break;
    case 'esquec': for (let i = 0; i < 5; i++) push(CM(T, { ...cb(f, i), walk: q(((f / 30) * 0.5 + i * 0.25) % 1, 2) }, [-6 + i * 3 + (f - 1590) * 0.01, 0, -6 - (i % 3) * 3], { s: 1.35, flip: i % 2 === 0 })); break;
    case 'relat': push(R(T, 'dpedro', { ...base(f, 3), expr: f > 1740 ? 'shock' : 'stern', L: 'reach', R: 'hang', facing: 1, look: 0.6 }, [4.8, 0, 5.4])); break;
    case 'silh': for (let i = 0; i < 6; i++) push(CM(T, { ...cb(f, i) }, [-8 + i * 3, 0, -10 - (i % 2) * 2], { s: 1.4, flip: i % 2 === 0 })); break;
    case 'papel': if (f > 1858) push(CM(T, { ...cb(f, 1), chew: q(f * 0.6 % 6.28, 1) }, [6.9, -0.05, 5.5], { s: 1.1, flip: true })); break;
  }
  return out;
};
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const fxAt = (f, T) => {
  const out = [], S = shotAt(f);
  if (S.id === 'deita' && f >= 1052 && f < 1066) { const t = q((f - 1052) / 14, 2); out.push(FX('d' + t, (p) => T.fxDust(p, t, '#d9b88a'), [0, 0.05, 0.4], 1.0)); }
  if (['seco', 'heroi', 'calor'].includes(S.id)) for (let k = 0; k < 2; k++) { const t = ((f * 0.01 + k / 2) % 1), kk = q(t * 0.5, 2); out.push(FX('hz' + k + kk, (p) => T.fxDust(p, kk, '#f6e6c8'), [-2 + k * 4, 0.2 + t * 0.6, -3], 1.2 + t, { alpha: q((1 - t) * 0.35, 2) })); }
  return out;
};
