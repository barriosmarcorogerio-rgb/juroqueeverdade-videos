// "Um dragão conseguiria voar?" — lei do quadrado-cubo, Quetzalcoatlus. 1873 quadros, 30 fps. Campo aberto na origem.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, walk } from './motion.js';
export const FPS = 30, TOTAL = 1873, DECK = 0;
const SH = [
  ['abre', 0, 'day'], ['series', 119, 'epic'], ['fisica', 220, 'day'], ['lei', 288, 'day'], ['dobra', 377, 'day'], ['peso', 483, 'day'],
  ['cresceu', 566, 'day'], ['aves', 642, 'day'], ['gigante', 747, 'day'], ['girafa', 834, 'day'], ['salto', 979, 'day'], ['entao', 1126, 'day'],
  ['da', 1200, 'day'], ['predio', 1342, 'day'], ['fogo', 1479, 'day'], ['besouro', 1557, 'day'], ['tonico', 1642, 'day'], ['loop', 1790, 'day'],
];
export const SHOTS = SH.map(([id, a, light], i) => ({ id, a, b: (SH[i + 1] ? SH[i + 1][1] : TOTAL) - 1, light }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const LIGHTS = {
  day: { az: 40, el: 52, sky: '#dcecff', ground: '#4a6a2a', hemi: 1.4, sun: '#fff2d0', sunI: 2.8, fog: '#bcd6ea', fogNear: 60, fogFar: 520, skyTop: '#3a86e0', skyHor: '#d6eaf4', sunDisc: '#fff6d8', sunSize: 0.006, sat: 1.16, vig: 0.2, shadowExt: 24 },
  epic: { az: 15, el: 10, sky: '#f0b8a0', ground: '#3a2a30', hemi: 1.2, sun: '#ff9a4a', sunI: 2.8, fog: '#e88a6a', fogNear: 40, fogFar: 400, skyTop: '#3a3a8a', skyHor: '#ffa060', sunDisc: '#ffd28a', sunSize: 0.014, sat: 1.22, vig: 0.32, shadowExt: 30, gain: '#fff0e0' },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });
const D0 = [0, 0, 0], DS = 4.2;
const CAMS = {
  abre: [{ f: 0, pos: [8, 2.0, 12.5], look: [-1.2, 4.2, 0], fov: 54 }, { f: 118, pos: [7.0, 2.0, 11.2], look: [-1.0, 4.4, 0], fov: 52 }],
  series: [{ f: 119, pos: [8, 7, 24], look: [-4, 14, -10], fov: 52 }, { f: 219, pos: [4, 9, 22], look: [6, 15, -10], fov: 50 }],
  fisica: [{ f: 220, pos: [9, 4, 22], look: [0, 6, -4], fov: 54 }, { f: 287, pos: [9, 3.6, 21], look: [0, 4, -4], fov: 52 }],
  lei: [{ f: 288, pos: [-6.6, 2.4, 10.5], look: [-6.6, 1.2, 2], fov: 50 }, { f: 376, pos: [-6.6, 2.3, 9.6], look: [-6.6, 1.2, 2], fov: 48 }],
  dobra: [{ f: 377, pos: [-6.3, 2.7, 10.0], look: [-6.3, 1.0, 2], fov: 50 }, { f: 482, pos: [-6.3, 2.6, 9.4], look: [-6.3, 1.0, 2], fov: 48 }],
  peso: [{ f: 483, pos: [-5.6, 1.7, 8.2], look: [-5.6, 1.0, 2], fov: 48 }, { f: 565, pos: [-5.6, 1.7, 7.8], look: [-5.6, 1.0, 2], fov: 46 }],
  cresceu: [{ f: 566, pos: [6.5, 6.5, 10], look: [1.8, 6.0, 0], fov: 44 }, { f: 641, pos: [6.0, 6.6, 9.2], look: [1.8, 6.0, 0], fov: 42 }],
  aves: [{ f: 642, pos: [5.2, 1.0, 9.6], look: [3, 0.9, 6], fov: 42 }, { f: 746, pos: [5.0, 1.4, 9.2], look: [3, 1.6, 6], fov: 46 }],
  gigante: [{ f: 747, pos: [4, 0.9, 10], look: [0.5, 3.2, 0], fov: 56 }, { f: 833, pos: [3.6, 0.8, 9.2], look: [0.5, 3.4, 0], fov: 56 }],
  girafa: [{ f: 834, pos: [0.4, 3.0, 17], look: [0.2, 2.9, 0], fov: 46 }, { f: 978, pos: [0.4, 3.0, 15.5], look: [0.2, 2.9, 0], fov: 46 }],
  salto: [{ f: 979, pos: [7, 2.6, 15], look: [0, 4, 0], fov: 52 }, { f: 1125, pos: [6, 3.6, 14], look: [0, 7, 0], fov: 56 }],
  entao: [{ f: 1126, pos: [5.1, 1.7, 7.6], look: [4.5, 1.55, 4.5], fov: 38 }, { f: 1199, pos: [5.0, 1.7, 7.2], look: [4.5, 1.55, 4.5], fov: 36 }],
  da: [{ f: 1200, pos: [7, 3.5, 15], look: [0, 5, 0], fov: 50 }, { f: 1341, pos: [6, 4.0, 13], look: [1, 5.4, 0], fov: 48 }],
  predio: [{ f: 1342, pos: [24, 6, 36], look: [-20, 22, -50], fov: 56 }, { f: 1478, pos: [22, 6, 33], look: [-20, 24, -50], fov: 54 }],
  fogo: [{ f: 1479, pos: [6.5, 7.0, 9], look: [2.2, 6.6, 0], fov: 40 }, { f: 1556, pos: [6.2, 7.0, 8.4], look: [2.2, 6.6, 0], fov: 38 }],
  besouro: [{ f: 1557, pos: [3.8, 0.32, 7.3], look: [3.0, 0.2, 6.0], fov: 40 }, { f: 1641, pos: [3.7, 0.3, 7.1], look: [3.0, 0.2, 6.0], fov: 38 }],
  tonico: [{ f: 1642, pos: [11, 3.2, 14], look: [2.5, 3.2, 1], fov: 56 }, { f: 1789, pos: [10, 3.0, 13], look: [2.5, 3.4, 1], fov: 54 }],
  loop: [{ f: 1790, pos: [8, 2.0, 12.5], look: [-1.2, 4.2, 0], fov: 54 }, { f: 1872, pos: [8, 2.0, 12.5], look: [-1.2, 4.2, 0], fov: 54 }],
};
const KICKS = [{ f: 250, a: 0.12 }, { f: 520, a: 0.07 }, { f: 1200, a: 0.04 }];
export const camAt = (f) => { const S = shotAt(f); const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS }); c.shadowAt = c.look; return c; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shotAt(f), C = camAt(f); return { focus: dist(C.pos, C.look), cinf: ['besouro', 'aves', 'entao'].includes(S.id) ? 8 : 3 }; };
export const worldAt = (f) => { const S = shotAt(f); return { noClouds: false, bus: ['series', 'fisica', 'abre', 'loop', 'tonico'].includes(S.id), cubes: ['lei', 'dobra', 'peso'].includes(S.id), tower: S.id === 'predio',
  sink: S.id === 'peso' ? 0.12 * E.easeOut(ramp(f, 515, 525)) : 0 }; };
// ---------- actors ----------
const base = (f, seed) => { const i = idle(f, seed); return { seed, bob: q(i.bob, 4), tilt: q(i.tilt, 2), headTilt: q(i.headTilt, 2), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const TON = (T, f, expr, arms, pos, extra = {}) => { const k = Math.floor(f / 20) % arms.length, ex = Array.isArray(expr) ? expr[Math.floor(f / 28) % expr.length] : expr;
  return R(T, 'explorador', { ...base(f, 4), expr: ex, L: arms[k][0], R: arms[k][1], holdR: arms[k][2] ?? undefined, facing: arms[k][3] ?? 0, look: arms[k][4] ?? 0 }, pos, extra); };
const FXC = (key, fn, pos, s, extra = {}) => ({ key, draw: fn, x: pos[0], y: pos[1], z: pos[2], s, blob: extra.blob ?? true, ...extra });
const DRAG = (T, f, o, pos, s = DS, extra = {}) => FXC('dr' + JSON.stringify(o), (p) => T.fxDragonD(p, o), pos, s, extra);
const flapFast = (f) => q((f * 0.11) % 1, 2), flapSlow = (f) => q((f * 0.05) % 1, 2);
const hopOf = (f) => q(Math.max(0, Math.sin(f * 0.69)) * 18, 0);
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = []; const push = (a) => out.push(a);
  switch (id) {
    case 'abre': case 'loop': push(DRAG(T, f, { flap: flapFast(f), effort: 1, hop: hopOf(f), sweat: 1, run: q((f * 0.05) % 1, 2) }, D0));
      push(TON(T, f, ['surprised', 'confused'], [['cheek', 'hang'], ['hang', 'point', null, -1, -0.5]], [3.4, 0, 6.4])); break;
    case 'series': push(DRAG(T, f, { flap: flapSlow(f), fire: f > 160 ? q(0.6 + 0.4 * Math.sin(f * 0.3), 2) : 0 }, [lerp(-10, 10, (f - 119) / 100), 13 + Math.sin(f * 0.1) * 0.6, -10], DS, { blob: false })); break;
    case 'fisica': { const y = f < 250 ? lerp(13, 0, E.easeIn(ramp(f, 220, 250))) : 0; push(DRAG(T, f, { flap: f < 250 ? flapFast(f) : 0.25, effort: 1, sweat: f > 250 ? 1 : 0 }, [5, y, -4], DS, { blob: y < 0.5 })); break; }
    case 'lei': push(TON(T, f, ['determined', 'smile'], [['hip', 'point', null, 1, 0.4], ['up', 'point', null, 1, 0.4]], [-7.7, 0, 5.2])); break;
    case 'dobra': push(TON(T, f, ['smile', 'excited'], [['point', 'hip', null, 1, 0.4], ['up', 'hip']], [-7.6, 0, 5.2])); break;
    case 'peso': push(TON(T, f, f > 520 ? ['shock', 'surprised'] : 'smug', [['cheek', 'cheek']], [-7.5, 0, 5.0])); break;
    case 'cresceu': push(DRAG(T, f, { flap: flapFast(f), effort: 1, hop: hopOf(f), sweat: 1 }, D0)); break;
    case 'aves': { const y = f > 700 ? lerp(0, 2.2, E.easeIn(ramp(f, 700, 746))) : 0; push(FXC('bd' + flapFast(f), (p) => T.fxBirdD(p, { flap: f > 690 ? flapFast(f) : 0.25 }), [3, y, 6], 0.9, { blob: y < 0.3 })); break; }
    case 'gigante': push(FXC('pt0', (p) => T.fxPteroD(p, {}), [0, 0, 0], 2.4)); push(TON(T, f, ['shock', 'surprised'], [['cheek', 'cheek'], ['up', 'up']], [2.6, 0, 2.4])); break;
    case 'girafa': push(FXC('pt1', (p) => T.fxPteroD(p, {}), [-2.0, 0, 0], 2.9)); push(FXC('gf', (p) => T.fxGiraffeD(p, {}), [2.6, 0, 0], 2.7));
      push(TON(T, f, ['surprised', 'smile'], [['hang', 'point', null, -1, -0.4]], [0.3, 0, 2.2])); break;
    case 'salto': { const L = q(ramp(f, 1000, 1110), 2); push(FXC('pt' + L + flapSlow(f), (p) => T.fxPteroD(p, { launch: L, flap: flapSlow(f) }), [0, 0, 0], 2.4, { blob: L < 0.5 })); break; }
    case 'entao': push(TON(T, f, ['confused', 'determined'], [['temple', 'hang'], ['hang', 'temple']], [4.5, 0.25, 4.5])); break;
    case 'da': push(DRAG(T, f, { flap: flapSlow(f), col: '#7ccc6a' }, [lerp(-6, 6, (f - 1200) / 141), 4.5 + Math.sin(f * 0.1) * 0.5, -1], 2.2, { blob: false }));
      push(TON(T, f, ['laugh', 'excited'], [['up', 'up'], ['wave', 'up']], [4.5, 0.25, 4.5])); break;
    case 'predio': push(DRAG(T, f, { flap: flapFast(f), effort: 1, sweat: 1, hop: hopOf(f) }, [-6, 0, -48], 15)); break;
    case 'fogo': push(DRAG(T, f, { flap: 0.25, effort: f < 1515 ? 1 : 0, fire: f > 1505 && f < 1530 ? 0.18 : 0 }, D0)); break;
    case 'besouro': push(FXC('bt' + q((f * 0.1) % 1, 1), (p) => T.fxBeetleD(p, { spray: f > 1585 ? q(((f - 1585) * 0.04) % 1, 2) : 0, run: q((f * 0.1) % 1, 1) }), [3, 0, 6], 0.45)); break;
    case 'tonico': push(DRAG(T, f, { flap: flapFast(f), effort: 1, hop: hopOf(f), sweat: 1 }, D0));
      push(FXC('fan' + q(f * 0.6 % 6.28, 1), (p) => T.fxFanD(p, { spin: q(f * 0.6 % 6.28, 1) }), [5.2, 0, 3.6], 1.8));
      push(TON(T, f, ['determined', 'excited'], [['thumb', 'hip'], ['up', 'point', null, -1, -0.5]], [7.2, 0, 4.4])); break;
  }
  return out;
};
export const fxAt = (f, T) => [];
