// Teste semi-realista: "Ela mexia o sabão no quintal..." (Kentucky, 1876). 301 quadros, 30 fps.
// Palavras: Ela 0, mexia 8, sabão 23, quintal 36 | quando 51, pedaço 67, carne 83 | caiu 95, dentro 108, caldeirão 122 |
// Ela 147, olha 155, cima 172 | Não 197, nuvem 216, céu 233 | E 256, cai 263, outro 272.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
export const FPS = 30, TOTAL = 301, DECK = 0;
export const SHOTS = [
  { id: 'mexe', a: 0, b: 50, light: 'day' },
  { id: 'ceu', a: 51, b: 94, light: 'day' },
  { id: 'pote', a: 95, b: 146, light: 'day' },
  { id: 'olha', a: 147, b: 196, light: 'day' },
  { id: 'limpo', a: 197, b: 255, light: 'day' },
  { id: 'outro', a: 256, b: 300, light: 'day' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const LIGHTS = {
  day: { az: 35, el: 48, sky: '#cfe2ff', ground: '#6f7a4a', hemi: 1.5, sun: '#fff4e0', sunI: 3.2, fog: '#c9dcf2', fogNear: 60, fogFar: 700,
    skyTop: '#2c6fd6', skyHor: '#bcd7f4', sat: 1.12, vig: 0.18, shadowExt: 12, sunDisc: '#fff6d8', sunSize: 0.004 },
};
export const lightFor = (S, f) => { const L = { ...LIGHTS[S.light] }; if (S.id === 'ceu' || S.id === 'limpo') L.shadowExt = 30; return L; };
const W = [1.75, 0, -0.5], K = [2.6, 0, -0.6], EY = 1.47;
const H1 = (f) => Math.max(0.98, 50 - (f - (118 - (50 - 0.98) / 0.75)) * 0.75);
const CAMS = {
  mexe: [{ f: 0, pos: [2.45, 1.5, 3.3], look: [2.2, 1.2, -0.6], fov: 42 }, { f: 50, pos: [2.3, 1.45, 2.55], look: [2.2, 1.2, -0.6], fov: 40 }],
  ceu: [{ f: 51, pos: [5.2, 0.6, 3.6], look: [2.6, 30, -0.6], fov: 70 }, { f: 94, pos: [5.0, 0.7, 3.3], look: [2.6, 12, -0.6], fov: 66 }],
  pote: [{ f: 95, pos: [3.5, 2.1, 1.0], look: [2.6, 0.95, -0.6], fov: 40 }, { f: 146, pos: [3.25, 1.95, 0.6], look: [2.6, 0.98, -0.6], fov: 36 }],
  olha: [{ f: 147, pos: [2.05, 1.05, 1.2], look: [1.75, 1.75, -0.5], fov: 38 }, { f: 196, pos: [2.0, 0.95, 0.95], look: [1.75, 1.8, -0.5], fov: 35 }],
  limpo: [{ f: 197, pos: [5.0, 0.4, 3.0], look: [6, 40, -14], fov: 72, roll: 0 }, { f: 255, pos: [5.0, 0.4, 3.0], look: [7.5, 40, -12], fov: 68, roll: 7 }],
  outro: [{ f: 256, pos: [3.6, 1.7, 5.0], look: [2.1, 1.0, -0.4], fov: 46 }, { f: 300, pos: [3.4, 1.6, 4.3], look: [2.1, 1.0, -0.4], fov: 44 }],
};
const KICKS = [{ f: 118, a: 0.04 }, { f: 272, a: 0.07 }];
export const camAt = (f) => {
  const S = shotAt(f); const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  if (S.id === 'ceu') { const y = H1(f); c.pos = [2.6 + 0.9, y + 2.2, -0.6 + 1.2]; c.look = [2.6 - 2.7, y - 6.6, -0.6 - 3.6]; c.fov = 50; }
  c.shadowAt = [2.2, 0, -0.5];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'mexe': return { focus: dist(C.pos, [W[0], EY, W[2]]), cinf: 8 };
    case 'pote': return { focus: dist(C.pos, [K[0], 1.0, K[2]]), cinf: 12 };
    case 'olha': return { focus: dist(C.pos, [W[0], 1.6, W[2]]), cinf: 12 };
    case 'outro': return { focus: dist(C.pos, [W[0], EY, W[2]]), cinf: 6 };
  }
  return { focus: 10, cinf: 0 };
};
export const worldAt = (f) => ({ stir: f < 118, noClouds: true });
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
export const actorsAt = (f, T) => {
  const i = idle(f, 7), base = { seed: 7, bob: q(i.bob, 5), tilt: q(i.tilt, 3), blink: blinkAt(f, 7) };
  let o;
  if (f < 118) o = { ...base, expr: 'smile', L: 'reach', R: 'reach', facing: 1, look: 0.4, headTilt: q(2 * Math.sin(f * 0.18), 1) };
  else if (f < 155) o = { ...base, expr: 'shock', L: 'cheek', R: 'cheek', facing: 1, look: 0.5, bob: f < 122 ? -0.02 : base.bob };
  else if (f < 256) o = { ...base, expr: 'nervous', L: 'hang', R: 'hang', facing: 0, look: 0, headTilt: q(-Math.min(1, (f - 155) / 15) * 12, 1), blink: 0 };
  else if (f < 272) o = { ...base, expr: 'nervous', L: 'hang', R: 'hang', facing: 0, headTilt: -10, blink: 0 };
  else o = { ...base, expr: 'shock', L: 'up', R: 'up', facing: -1, look: -0.6, bob: f < 278 ? 0.05 : 0, blink: 0 };
  return [R(T, 'fazendeira', o, W)];
};
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const fxAt = (f, T) => {
  const out = [];
  if (!(f >= 197 && f < 256)) for (let k = 0; k < 3; k++) { const t = ((f * 0.012 + k / 3) % 1), kk = q(t * 0.6, 2); out.push(FX('smk' + kk, (p) => T.fxDust(p, kk, '#e9e6e0'), [2.6 + t * 0.4, 1.1 + t * 2.2, -0.6], 0.5 + t * 0.9, { alpha: q((1 - t) * 0.8, 2) })); }
  if (f >= 272 && f < 284) { const t = q((f - 272) / 12, 2); out.push(FX('dst' + t, (p) => T.fxDust(p, t, '#d9cbb0'), [2.05, 0.05, 0.3], 0.8)); }
  return out;
};
