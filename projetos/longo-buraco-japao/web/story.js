// "A chuva de carne" (Kentucky, 1876) — 1740 quadros, 30 fps. Quadros por palavra em work/words.json.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, walk } from './motion.js';
export const FPS = 30, TOTAL = 1740, DECK = 0;
const SH = [
  ['abre', 0, 'day'], ['drone', 53, 'day'], ['panico', 101, 'day'], ['kent', 128, 'day'], ['placa', 169, 'day'],
  ['mexe', 205, 'day'], ['cai', 263, 'day'], ['pote', 300, 'day'], ['olha', 350, 'day'], ['azul', 389, 'day'], ['nuvem', 418, 'day'],
  ['out1', 468, 'day'], ['out2', 516, 'day'], ['out3', 539, 'day'], ['chuva', 577, 'day'], ['cerca', 623, 'day'], ['telhado', 661, 'day'],
  ['porta', 693, 'day'], ['castigo', 739, 'day'], ['castigo2', 776, 'day'], ['vizinhos', 809, 'day'], ['prova', 844, 'day'], ['reacao', 881, 'day'],
  ['carneiro', 919, 'day'], ['mastiga', 976, 'day'], ['veado', 1024, 'day'], ['veado2', 1056, 'day'],
  ['jornal', 1089, 'gold'], ['cient1', 1170, 'gold'], ['cient2', 1201, 'gold'], ['cient3', 1241, 'gold'], ['nojo', 1276, 'gold'], ['nojo2', 1317, 'gold'],
  ['chama', 1350, 'dusk'], ['urubu', 1385, 'dusk'], ['assusta', 1424, 'dusk'], ['assusta2', 1465, 'dusk'], ['vomita', 1485, 'dusk'], ['leves', 1523, 'dusk'],
  ['fugir', 1566, 'dusk'], ['emcima', 1592, 'dusk'], ['final1', 1646, 'dawn'], ['final2', 1684, 'dawn'],
];
export const SHOTS = SH.map(([id, a, light], i) => ({ id, a, b: (SH[i + 1] ? SH[i + 1][1] : TOTAL) - 1, light }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const LIGHTS = {
  day: { az: 35, el: 48, sky: '#cfe2ff', ground: '#6f7a4a', hemi: 1.5, sun: '#fff4e0', sunI: 3.2, fog: '#c9dcf2', fogNear: 60, fogFar: 700,
    skyTop: '#2c6fd6', skyHor: '#bcd7f4', sat: 1.12, vig: 0.18, shadowExt: 14, sunDisc: '#fff6d8', sunSize: 0.004 },
  gold: { az: 20, el: 14, sky: '#ffd9a8', ground: '#6a5a3a', hemi: 1.25, sun: '#ffb46a', sunI: 3.4, fog: '#f2c494', fogNear: 60, fogFar: 600,
    skyTop: '#4a78c8', skyHor: '#ffc38a', sat: 1.15, vig: 0.24, shadowExt: 14, sunDisc: '#fff0c0', sunSize: 0.006, gain: '#fff2e2' },
  dusk: { az: 10, el: 3, sky: '#9a7ac0', ground: '#3a2a3a', hemi: 1.0, sun: '#ff8a4a', sunI: 2.2, fog: '#d9806a', fogNear: 80, fogFar: 650,
    skyTop: '#2a2c6e', skyHor: '#ff8f52', sat: 1.18, vig: 0.3, shadowExt: 40, sunDisc: '#ffd28a', sunSize: 0.012, gain: '#f2e6ff' },
  dawn: { az: 120, el: 12, sky: '#ffd6c8', ground: '#6a6a4a', hemi: 1.35, sun: '#ffd2a8', sunI: 2.8, fog: '#f0d2c8', fogNear: 60, fogFar: 650,
    skyTop: '#6a8fd6', skyHor: '#ffcfae', sat: 1.12, vig: 0.2, shadowExt: 12, sunDisc: '#fff4dc', sunSize: 0.006 },
};
export const lightFor = (S, f) => { const L = { ...LIGHTS[S.light] };
  if (['abre', 'drone', 'kent', 'chuva', 'azul', 'castigo2', 'telhado', 'cerca'].includes(S.id)) L.shadowExt = 32;
  if (S.id === 'nojo2' || S.id === 'nojo') { const t = ramp(f, 1276, 1349); L.sunI = lerp(3.4, 2.0, t); L.sat = lerp(1.15, 1.0, t); L.vig = lerp(0.24, 0.36, t); }
  return L; };
// ---------- places ----------
const W = [1.75, 0, -0.5], K = [2.6, 0, -0.6], MAR = [0.35, 0, -1.45], VA = [4.4, 0, 1.4], VB = [5.6, 0, 0.9], C1 = [6.6, 0, 2.6], C2 = [7.7, 0, 1.9];
const TA = [3.1, 0, 0.75], TB = [4.1, 0, 0.75];
const EY = 1.47;
// hero chunk 0 falls into the cauldron at f=312 from 50 m
const H0 = (f) => Math.max(0.95, 50 - (f - (312 - (50 - 0.95) / 0.75)) * 0.75);
// ---------- vultures ----------
const NV = 9;
export const vulture = (i, f) => {
  const S = shotAt(f), ph = i / NV * Math.PI * 2, r = 5 + (i % 3) * 2.2, w = 0.012 + (i % 2) * 0.004;
  let p = [2 + Math.cos(ph + f * w) * r, 34 + (i % 4) * 1.6 + Math.sin(f * 0.05 + i) * 0.4, -2 + Math.sin(ph + f * w) * r];
  if (S.id === 'fugir') { const t = (f - 1566) / 30; p = [p[0] + t * t * 9 + t * 6, p[1] + t * 5, p[2] - t * 3]; }
  if (S.id === 'leves') { const t = (f - 1523) / 30; p = [p[0], p[1] + t * 2.5, p[2]]; }
  return p;
};
const vflap = (i, f, fast) => Math.sin(f * (fast ? 0.9 : 0.22) + i * 1.7);
// ---------- cameras ----------
const CAMS = {
  abre: [{ f: 0, pos: [4.6, 0.35, 3.4], look: [2, 40, -10], fov: 74 }, { f: 52, pos: [4.4, 0.35, 3.2], look: [1, 40, -10], fov: 70, roll: 6 }],
  drone: [{ f: 53, pos: [17, 21, 21], look: [0, 1, -3], fov: 50 }, { f: 100, pos: [13, 15, 16], look: [0, 1, -3], fov: 48 }],
  panico: [{ f: 101, pos: [2.15, 1.5, 1.55], look: [1.75, 1.55, -0.5], fov: 42 }, { f: 127, pos: [2.05, 1.5, 1.25], look: [1.75, 1.6, -0.5], fov: 40 }],
  kent: [{ f: 128, pos: [42, 28, 46], look: [0, 2, -6], fov: 45 }, { f: 168, pos: [24, 12, 30], look: [0, 2, -6], fov: 45 }],
  placa: [{ f: 169, pos: [12.4, 1.55, 9.6], look: [10.2, 1.7, 5.4], fov: 42 }, { f: 204, pos: [11.5, 1.65, 8.4], look: [10.2, 1.75, 5.4], fov: 40 }],
  mexe: [{ f: 205, pos: [2.45, 1.5, 3.3], look: [2.2, 1.2, -0.6], fov: 42 }, { f: 262, pos: [2.3, 1.45, 2.55], look: [2.2, 1.2, -0.6], fov: 40 }],
  cai: [{ f: 263, pos: [0, 0, 0], look: [0, 0, 0], fov: 50 }],
  pote: [{ f: 300, pos: [3.5, 2.1, 1.0], look: [2.6, 0.95, -0.6], fov: 40 }, { f: 349, pos: [3.25, 1.95, 0.6], look: [2.6, 0.98, -0.6], fov: 36 }],
  olha: [{ f: 350, pos: [2.05, 1.05, 1.2], look: [1.75, 1.75, -0.5], fov: 38 }, { f: 388, pos: [2.0, 0.95, 0.95], look: [1.75, 1.8, -0.5], fov: 35 }],
  azul: [{ f: 389, pos: [5.0, 0.4, 3.0], look: [6, 40, -14], fov: 72 }, { f: 417, pos: [5.0, 0.4, 3.0], look: [7.5, 40, -12], fov: 68, roll: 7 }],
  nuvem: [{ f: 418, pos: [1.98, 1.6, 0.8], look: [1.75, 1.6, -0.5], fov: 38 }, { f: 467, pos: [1.93, 1.58, 0.55], look: [1.75, 1.6, -0.5], fov: 35 }],
  out1: [{ f: 468, pos: [3.6, 1.7, 5.0], look: [2.1, 1.0, -0.4], fov: 46 }, { f: 515, pos: [3.4, 1.6, 4.3], look: [2.1, 1.0, -0.4], fov: 44 }],
  out2: [{ f: 516, pos: [1.9, 1.55, 6.6], look: [1.0, 1.3, 4.8], fov: 40 }, { f: 538, pos: [1.7, 1.5, 6.1], look: [1.0, 1.3, 4.8], fov: 38 }],
  out3: [{ f: 539, pos: [2.0, 1.7, 2.1], look: [1.75, 1.55, -0.5], fov: 44 }, { f: 576, pos: [1.9, 1.75, 1.7], look: [1.75, 1.6, -0.5], fov: 42 }],
  chuva: [{ f: 577, pos: [14, 18, 18], look: [0, 1, -3], fov: 52 }, { f: 622, pos: [10, 12, 14], look: [0, 1, -3], fov: 50 }],
  cerca: [{ f: 623, pos: [-5, 0.9, 6.8], look: [-1, 0.5, 1], fov: 50 }, { f: 660, pos: [0.8, 0.95, 6.8], look: [4, 0.6, 1], fov: 50 }],
  telhado: [{ f: 661, pos: [4.6, 5.4, 1.8], look: [-1.5, 6.4, -8], fov: 46 }, { f: 692, pos: [3.8, 6.2, 0.6], look: [-1.5, 6.6, -8], fov: 44 }],
  porta: [{ f: 693, pos: [0.9, 1.2, 1.8], look: [-0.7, 1.25, -3.6], fov: 46 }, { f: 738, pos: [0.75, 1.25, 1.2], look: [0.1, 1.3, -1.8], fov: 44 }],
  castigo: [{ f: 739, pos: [0.6, 1.3, -0.15], look: [0.35, 1.55, -1.45], fov: 40 }, { f: 775, pos: [0.55, 1.25, -0.35], look: [0.35, 1.6, -1.45], fov: 38 }],
  castigo2: [{ f: 776, pos: [-3.2, 0.45, 3.6], look: [1, 2.2, -1.2], fov: 56 }, { f: 808, pos: [-2.8, 0.45, 3.2], look: [1, 2.4, -1.2], fov: 54 }],
  vizinhos: [{ f: 809, pos: [9.2, 1.45, 10.2], look: [3.5, 1.1, 7.2], fov: 46 }, { f: 843, pos: [8.4, 1.45, 9.2], look: [4.6, 1.1, 6.2], fov: 44 }],
  prova: [{ f: 844, pos: [4.6, 1.55, 2.8], look: [4.4, 1.45, 1.4], fov: 40 }, { f: 880, pos: [4.55, 1.55, 2.55], look: [4.4, 1.5, 1.4], fov: 37 }],
  reacao: [{ f: 881, pos: [1.3, 1.5, 1.8], look: [1.05, 1.35, -1.0], fov: 48 }, { f: 918, pos: [1.2, 1.5, 1.5], look: [1.05, 1.4, -1.0], fov: 46 }],
  carneiro: [{ f: 919, pos: [4.25, 1.5, 2.6], look: [4.4, 1.45, 1.4], fov: 40 }, { f: 975, pos: [4.3, 1.5, 2.4], look: [4.4, 1.5, 1.4], fov: 37 }],
  mastiga: [{ f: 976, pos: [5.75, 1.55, 2.2], look: [5.6, 1.5, 0.9], fov: 38 }, { f: 1023, pos: [5.72, 1.55, 2.0], look: [5.6, 1.52, 0.9], fov: 35 }],
  veado: [{ f: 1024, pos: [5.9, 1.5, 2.5], look: [5.6, 1.4, 0.9], fov: 44 }, { f: 1055, pos: [5.85, 1.5, 2.3], look: [5.6, 1.45, 0.9], fov: 42 }],
  veado2: [{ f: 1056, pos: [3.2, 1.6, 5.6], look: [3.1, 1.1, 0], fov: 52 }, { f: 1088, pos: [3.1, 1.6, 5.1], look: [3.1, 1.1, 0], fov: 50 }],
  jornal: [{ f: 1089, pos: [30.12, 2.35, 20.75], look: [30, 1.0, 20.0], fov: 46 }, { f: 1169, pos: [30.05, 2.1, 20.5], look: [30, 1.0, 20.0], fov: 42 }],
  cient1: [{ f: 1170, pos: [8.2, 1.5, 7.2], look: [6.4, 1.1, 2.4], fov: 46 }, { f: 1200, pos: [7.9, 1.5, 6.6], look: [6.6, 1.1, 2.4], fov: 44 }],
  cient2: [{ f: 1201, pos: [6.8, 1.6, 3.9], look: [6.6, 1.65, 2.6], fov: 40 }, { f: 1240, pos: [6.75, 1.6, 3.7], look: [6.6, 1.7, 2.6], fov: 37 }],
  cient3: [{ f: 1241, pos: [8.0, 1.35, 3.6], look: [7.5, 1.3, 1.9], fov: 42 }, { f: 1275, pos: [7.95, 1.35, 3.3], look: [7.6, 1.3, 1.9], fov: 40 }],
  nojo: [{ f: 1276, pos: [3.4, 0.5, 6.4], look: [3.0, 2.6, -1.5], fov: 56 }, { f: 1316, pos: [3.3, 0.6, 5.8], look: [3.0, 3.2, -1.5], fov: 54 }],
  nojo2: [{ f: 1317, pos: [1.98, 1.55, 0.75], look: [1.75, 1.55, -0.5], fov: 38 }, { f: 1349, pos: [1.93, 1.55, 0.5], look: [1.75, 1.6, -0.5], fov: 34 }],
  chama: [{ f: 1350, pos: [2, 1.0, 9], look: [2, 36, -2], fov: 40 }, { f: 1384, pos: [2, 1.0, 8], look: [2.5, 36, -2], fov: 36, roll: -4 }],
  urubu: [{ f: 1385, pos: [0, 0, 0], look: [0, 0, 0], fov: 40 }],
  assusta: [{ f: 1424, pos: [-16, 36, 12], look: [2, 35.5, -2], fov: 46 }, { f: 1464, pos: [-13, 36.5, 10], look: [2, 35.5, -2], fov: 44 }],
  assusta2: [{ f: 1465, pos: [0, 0, 0], look: [0, 0, 0], fov: 42 }],
  vomita: [{ f: 1485, pos: [9, 29, 12], look: [2, 33, -2], fov: 56 }, { f: 1522, pos: [8.5, 29.5, 11], look: [2, 33, -2], fov: 54 }],
  leves: [{ f: 1523, pos: [3.5, 33, 5], look: [1.5, 0, -3], fov: 56 }, { f: 1565, pos: [3.2, 24, 4], look: [1.5, 0, -3], fov: 52 }],
  fugir: [{ f: 1566, pos: [-8, 31, 14], look: [6, 37, -4], fov: 58 }, { f: 1591, pos: [-7, 31.5, 13], look: [12, 39, -6], fov: 56 }],
  emcima: [{ f: 1592, pos: [16, 47, 24], look: [0, 8, -4], fov: 48 }, { f: 1645, pos: [13, 44, 20], look: [0, 6, -4], fov: 46 }],
  final1: [{ f: 1646, pos: [3.6, 1.6, 5.2], look: [3.6, 1.1, 1.0], fov: 46 }, { f: 1683, pos: [3.6, 1.55, 4.7], look: [3.6, 1.1, 1.0], fov: 44 }],
  final2: [{ f: 1684, pos: [3.6, 1.65, 4.3], look: [3.6, 1.5, 0.75], fov: 44 }, { f: 1739, pos: [3.6, 1.65, 3.9], look: [3.6, 1.55, 0.75], fov: 42 }],
};
const KICKS = [{ f: 312, a: 0.04 }, { f: 493, a: 0.06 }, { f: 520, a: 0.06 }, { f: 543, a: 0.08 }, { f: 1465, a: 0.06 }, { f: 739, a: 0.04 }];
const add3 = (a, b) => a.map((v, i) => v + b[i]);
export const camAt = (f) => {
  const S = shotAt(f); const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  c.shadowAt = c.look;
  if (['panico', 'nuvem', 'out3', 'castigo', 'prova', 'carneiro', 'mastiga', 'veado', 'cient2', 'nojo2', 'olha'].includes(S.id)) {
    const k = S.id === 'olha' ? 1.3 : S.id === 'cient2' ? 2.1 : 1.65; c.look = [c.look[0], c.look[1] + 0.2, c.look[2]]; c.pos = c.look.map((v, i) => v + (c.pos[i] - v) * k); c.pos[1] += S.id === 'olha' ? -0.1 : 0.05; }
  if (S.id === 'cai') { const y = H0(f); c.pos = [2.6 + 0.9, y + 2.2, -0.6 + 1.2]; c.look = [2.6 - 2.7, y - 6.6, -0.6 - 3.6]; c.fov = 50; c.shadowAt = [2.2, 0, -0.5]; }
  if (S.id === 'urubu') { const v = vulture(0, f), t = (f - 1385) / 38; c.pos = add3(v, [0.4, 0.4, 4.2 - t * 0.8]); c.look = add3(v, [0, 0.2, 0]); c.fov = 40; }
  if (S.id === 'assusta2') { const v = vulture(1, f); c.pos = add3(v, [0.3, 0.3, 3.6]); c.look = add3(v, [0, 0.2, 0]); c.fov = 42;
    for (const k of KICKS) { const d = f - k.f; if (d >= 0 && d < 7) { const s = (d % 2 ? -1 : 1) * k.a * (1 - d / 7); c.look = [c.look[0], c.look[1] + s * 3, c.look[2]]; c.roll = s * 20; } } }
  if (['abre', 'drone', 'kent', 'chuva', 'azul', 'castigo2', 'chama', 'assusta', 'vomita', 'fugir', 'emcima', 'leves', 'urubu', 'assusta2'].includes(S.id)) c.shadowAt = [1.5, 0, -2];
  if (S.id === 'telhado') c.shadowAt = [-1.5, 6, -7];
  if (S.id === 'jornal') c.shadowAt = [30, 0.5, 20];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const FOC = { panico: [W, 1.6, 8], mexe: [W, EY, 8], pote: [K, 1.0, 12], olha: [W, 1.6, 12], nuvem: [W, 1.6, 10], out3: [W, 1.6, 8], porta: [MAR, 1.4, 6],
  castigo: [MAR, 1.55, 10], prova: [VA, 1.5, 10], carneiro: [VA, 1.5, 10], mastiga: [VB, 1.5, 10], veado: [VB, 1.5, 8], cient2: [C1, 1.6, 10], cient3: [C2, 1.4, 8], nojo2: [W, 1.6, 10],
  final2: [[3.6, 0, 0.75], 1.4, 8], out2: [[1.0, 0, 4.8], 1.3, 10], placa: [[10.2, 0, 5.4], 1.7, 8], jornal: [[30, 0, 20], 1.0, 10], reacao: [[1.05, 0, -1.0], 1.4, 6] };
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), F = FOC[S.id];
  if (S.id === 'urubu' || S.id === 'assusta2') return { focus: dist(C.pos, C.look), cinf: 10 };
  if (!F) return { focus: 10, cinf: 0 };
  return { focus: dist(C.pos, [F[0][0], F[1], F[0][2]]), cinf: F[2] };
};
export const worldAt = (f) => {
  const S = shotAt(f), o = { noClouds: true, stir: f >= 205 && f < 312, table: S.id.startsWith('final') };
  if (f < 128) o.fe = f + 600;
  if (S.id.startsWith('final')) { o.hideHero = true; o.hideMeat = true; }
  if (['chama', 'urubu', 'assusta', 'assusta2', 'vomita', 'leves', 'fugir', 'emcima'].includes(S.id)) { o.vpos = Array.from({ length: NV }, (_, i) => vulture(i, f)); o.vdrop = ['vomita', 'leves'].includes(S.id); }
  return o;
};
// ---------- actors ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const base = (f, seed) => { const i = idle(f, seed); return { seed, bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
const path = (pts, f, f0, f1) => { const u = clamp((f - f0) / (f1 - f0)) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(u)); return lerp3(pts[i], pts[i + 1], u - i); };
const crouch = (f, S) => {
  const b = base(f, 7); let o;
  const id = S.id;
  if (id === 'panico') o = { ...b, expr: 'shock', L: 'up', R: 'up', look: 0.2, bob: q(0.02 * Math.sin(f * 0.9), 3), blink: 0 };
  else if (f < 312) o = { ...b, expr: 'smile', L: 'reach', R: 'reach', facing: 1, look: 0.4, headTilt: q(2 * Math.sin(f * 0.18), 1) };
  else if (f < 350) o = { ...b, expr: 'shock', L: 'cheek', R: 'cheek', facing: 1, look: 0.5, bob: f < 316 ? -0.02 : b.bob };
  else if (f < 468) o = { ...b, expr: 'nervous', L: 'hang', R: 'hang', facing: 0, look: 0, headTilt: q(-Math.min(1, (f - 350) / 15) * 12, 1), blink: 0 };
  else if (f < 493) o = { ...b, expr: 'nervous', L: 'hang', R: 'hang', headTilt: -10, blink: 0 };
  else if (f < 543) o = { ...b, expr: 'shock', L: 'up', R: 'hang', facing: 1, look: 0.6, bob: f < 499 ? 0.05 : 0, blink: 0 };
  else if (f < 577) o = { ...b, expr: f < 556 ? 'dazed' : 'shock', L: 'hang', R: 'hang', bob: f < 548 ? -0.04 : 0, headTilt: q(4 * Math.sin(f * 0.6), 1), blink: 0 };
  else if (f < 881) o = { ...b, expr: 'shock', L: 'cheek', R: 'cheek', look: -0.3 };
  else if (f < 919) o = { ...b, expr: 'pained', L: 'belly', R: 'cheek', facing: 1, look: 0.5 };
  else if (f < 1276) o = { ...b, expr: 'nervous', L: 'hang', R: 'belly', facing: 1, look: 0.6 };
  else o = { ...b, expr: 'nervous', L: 'hang', R: 'hang', look: 0, headTilt: q(-Math.min(1, (f - 1276) / 20) * 10, 1), blink: f > 1317 ? 0 : b.blink };
  return o;
};
const marido = (f, S) => {
  const b = base(f, 11);
  if (f < 739) { const w = walk(f, 693, 3.2, 0.55); return { o: { ...b, expr: 'shock', L: 'up', R: 'up', step: q(w.phase, 2), facing: 1, look: 0.4, blink: 0 } }; }
  if (f < 776) return { o: { ...b, expr: 'shock', L: 'up', R: 'up', look: 0, headTilt: q(-8 + 3 * Math.sin(f * 0.5), 1), bob: q(-0.03 + 0.02 * Math.sin(f * 0.8), 3), blink: 0 } };
  if (f < 881) return { o: { ...b, expr: 'nervous', L: 'up', R: 'hang', facing: 1, look: 0.5 } };
  if (f < 919) return { o: { ...b, expr: 'pained', L: 'cheek', R: 'belly', facing: 1, look: 0.6 } };
  return { o: { ...b, expr: f >= 1056 && f < 1089 ? 'shock' : 'nervous', L: 'hang', R: 'hang', facing: 1, look: 0.6 } };
};
const marPos = (f) => {
  if (f >= 739) return MAR;
  const p = path([[-1.5, 0, -5.2], [-1.2, 0, -3.3], [0.35, 0, -1.45]], f, 698, 736);
  p[1] = p[2] < -3.25 ? 0.675 : 0; return p;
};
const vizA = (f) => { const b = base(f, 3);
  if (f < 844) return { ...b, expr: 'grin', L: 'hang', R: 'wave', wv: q(f * 0.3, 1), step: q(walk(f, 809, 1.4, 0.5).phase, 2), facing: -1, look: -0.3 };
  if (f < 857) return { ...b, expr: 'grin', L: 'hang', R: 'reach', holdR: 'meat', meatRot: -0.2, facing: -1, look: -0.6 };
  if (f < 919) return { ...b, expr: f < 870 ? 'shock' : 'lick', L: 'hang', R: 'cheek', holdR: 'meat', meatRot: -1.9, bite: f >= 866, bob: q(0.006 * Math.sin(f * 0.9), 3) };
  if (f < 976) return { ...b, expr: 'smile', L: 'hang', R: 'thumb', holdL: 'meat', bite: true, look: 0.3, bob: q(0.008 * Math.sin(f * 0.8), 3) };
  if (f < 1056) return { ...b, expr: 'smile', L: 'belly', R: 'hang', facing: 1, look: 0.6 };
  return { ...b, expr: 'shock', L: 'cheek', R: 'cheek', facing: 1, look: 0.7, blink: 0 };
};
const vizB = (f) => { const b = base(f, 5);
  if (f < 844) return { ...b, expr: 'neutral', L: 'hang', R: 'hang', step: q(walk(f, 812, 1.4, 0.5).phase, 2), facing: -1, look: -0.3 };
  if (f < 976) return { ...b, expr: 'stern', L: 'hang', R: 'hang', facing: -1, look: -0.7 };
  if (f < 1024) return { ...b, expr: 'stern', L: 'hang', R: 'cheek', holdR: 'meat', meatRot: -1.9, bite: true, blink: f % 40 < 20 ? 0.5 : 0.6, headTilt: q(4 * Math.sin(f * 0.12), 1), bob: q(0.004 * Math.sin(f * 0.4), 3) };
  return { ...b, expr: 'grin', L: 'point', R: 'hip', facing: -1, look: -0.8 };
};
const vizPos = (f, who) => {
  if (f >= 844) return who === 'A' ? VA : VB;
  const d = who === 'A' ? 0 : -1.3;
  return path([[-1 + d, 0, 8.2], [4.9 + d * 0.3, 0, 8.0], [5.0 + d * 0.2, 0, 6.0]], f, 809, 846);
};
const cient = (f, n) => { const b = base(f, n ? 13 : 17);
  if (n === 0) { if (f < 1201) return { ...b, expr: 'stern', L: 'hang', R: 'hang', holdR: 'jar', step: q(walk(f, 1170, 1.2, 0.5).phase, 2), facing: -1 };
    return { ...b, expr: f < 1225 ? 'stern' : 'shock', L: 'hang', R: 'lift', holdR: 'jar', look: 0.7, facing: 1 }; }
  if (f < 1241) return { ...b, expr: 'neutral', L: 'hang', R: 'hang', holdR: 'jar', step: q(walk(f, 1172, 1.2, 0.5).phase, 2), facing: -1 };
  return { ...b, expr: 'stern', L: 'reach', R: 'hang', holdL: 'jar', look: -0.6, facing: -1 };
};
const cPos = (f, n) => f >= 1201 ? (n ? C2 : C1) : path(n ? [[6.6, 0, 6.5], [7.7, 0, 1.9]] : [[5.6, 0, 7.0], [6.6, 0, 2.6]], f, 1170, 1205);
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  if (['chama', 'urubu', 'assusta', 'assusta2', 'vomita', 'leves', 'fugir', 'emcima'].includes(id)) {
    for (let i = 0; i < NV; i++) { const v = vulture(i, f), fast = ['assusta2', 'fugir', 'vomita', 'leves'].includes(id) || (id === 'assusta' && f > 1455);
      const fl = q(vflap(i, f, fast), 1), sc = (id === 'assusta2' && i === 1) || (id === 'fugir') ? 1 : 0, op = (id === 'urubu' && i === 0 && f > 1392) || (id === 'vomita') ? 1 : 0;
      out.push({ key: `v${fl}${sc}${op}`, draw: (p) => T.fxVulture(p, fl, sc, op, 0), x: v[0], y: v[1] - 1.2, z: v[2], s: 1.5, blob: false, shadow: false, order: 3 }); }
    return out;
  }
  if (id.startsWith('final')) {
    const b1 = base(f, 3), b2 = base(f, 5), chew = q(Math.sin(f * 0.7) * 0.006, 3);
    const late = f >= 1700;
    out.push(R(T, 'vizA', { ...b1, expr: late ? 'lick' : 'smile', L: 'hang', R: late ? 'thumb' : 'cheek', holdR: late ? undefined : 'meat', meatRot: -1.9, bite: true, bob: chew, facing: 1, look: 0.3 }, TA));
    out.push(R(T, 'vizB', { ...b2, expr: late ? 'lick' : 'smile', L: late ? 'thumb' : 'cheek', R: 'hang', holdL: late ? undefined : 'meat', meatRot: -1.2, bite: true, bob: -chew, facing: -1, look: -0.3 }, TB));
    return out;
  }
  if (!['kent', 'placa', 'jornal', 'cai'].includes(id)) out.push(R(T, 'fazendeira', crouch(f, S), W));
  if (f >= 693 && f < 1350 && !['jornal'].includes(id)) { const m = marido(f, S); out.push(R(T, 'marido', m.o, marPos(f))); }
  if (f >= 809 && f < 1350 && id !== 'jornal') { out.push(R(T, 'vizA', vizA(f), vizPos(f, 'A'))); out.push(R(T, 'vizB', vizB(f), vizPos(f, 'B'))); }
  if (f >= 1170 && f < 1350) { out.push(R(T, 'cientista', cient(f, 0), cPos(f, 0))); out.push(R(T, 'cientista2', cient(f, 1), cPos(f, 1))); }
  return out;
};
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const fxAt = (f, T) => {
  const out = [], S = shotAt(f);
  if (['mexe', 'pote', 'olha', 'out1', 'nuvem'].includes(S.id)) for (let k = 0; k < 3; k++) { const t = ((f * 0.012 + k / 3) % 1), kk = q(t * 0.6, 2); out.push(FX('smk' + kk, (p) => T.fxDust(p, kk, '#e9e6e0'), [2.6 + t * 0.4, 1.1 + t * 2.2, -0.6], 0.5 + t * 0.9, { alpha: q((1 - t) * 0.8, 2) })); }
  if (f >= 312 && f < 336) { const t = q((f - 312) / 24, 2); out.push(FX('soap' + t, (p) => T.fxSoap(p, t), [2.6, 0.55, -0.45], 0.9)); }
  for (const [lf, pos, col] of [[493, [2.15, 0.02, 0.45], '#d9cbb0'], [520, [1.0, 1.0, 4.9], '#e8dcc4'], [543, [1.75, 1.6, -0.4], '#f2e8d8']]) if (f >= lf && f < lf + 12) { const t = q((f - lf) / 12, 2); out.push(FX('dst' + lf + t, (p) => T.fxDust(p, t, col), pos, 0.7)); }
  if (S.id === 'assusta2' || S.id === 'fugir') for (let k = 0; k < 6; k++) { const v = vulture(k % NV, S.a), t = (f - S.a) / 30; out.push(FX('fth' + k, (p) => T.fxFeather(p), [v[0] + Math.sin(k * 2.1) * (0.6 + t), v[1] - 0.4 - t * 0.6 - k * 0.1, v[2] + Math.cos(k * 1.3) * 0.5], 0.35, { roll: q(Math.sin(f * 0.2 + k) * 0.8, 1) })); }
  return out;
};
