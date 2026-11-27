// "O polvo tem 3 corações" — 1862 quadros, 30 fps. Fundo do mar na origem, praia em x = 200. Boca do Tonico sincronizada (mouth.json).
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1862, DECK = 0;
const MOUTH = await (await fetch('mouth.json')).json();
const talkAt = (f) => MOUTH[f] || 0;
const SH = [
  ['abre', 0, 'sea'], ['abre2', 16, 'sea'], ['abre3', 32, 'sea'], ['azul', 75, 'sea'], ['tres', 152, 'sea'], ['branq', 207, 'sea'], ['terceiro', 303, 'sea'], ['rasteja', 424, 'sea'], ['cobre', 485, 'sea'],
  ['bracos', 649, 'sea'], ['neuronios', 728, 'sea'], ['pensa', 849, 'sea'], ['gosto', 899, 'sea'], ['prova', 1018, 'sea'], ['cor', 1115, 'sea'], ['osso', 1227, 'sea'],
  ['buraco', 1312, 'sea'], ['moeda', 1409, 'sea'], ['tonico', 1495, 'beach'], ['melada', 1627, 'beach'], ['loop', 1697, 'sea'],
];
const CLOSE = new Set(['tres', 'branq', 'gosto', 'melada', 'bracos']);   // closes de propósito: o enquadramento automático só centraliza
export const SHOTS = SH.map(([id, a, light], i) => ({ id, a, b: (SH[i + 1] ? SH[i + 1][1] : TOTAL) - 1, light, close: CLOSE.has(id) }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const LIGHTS = {
  sea: { az: 30, el: 75, sky: '#bfefff', ground: '#2a6a7a', hemi: 1.45, sun: '#e8fbff', sunI: 2.2, fog: '#2a8aa8', fogNear: 4, fogFar: 46, skyTop: '#1a5a8a', skyHor: '#2a8aa8', sunDisc: '#000000', sunSize: 0, sat: 1.12, vig: 0.3, shadowExt: 10, gain: '#e8fcff' },
  beach: { az: 35, el: 55, sky: '#dcecff', ground: '#a89060', hemi: 1.4, sun: '#fff4d8', sunI: 2.8, fog: '#cfe6f4', fogNear: 60, fogFar: 600, skyTop: '#3a86e0', skyHor: '#d6eaf4', sunDisc: '#fff6d8', sunSize: 0.006, sat: 1.16, vig: 0.2, shadowExt: 12 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });
const OC = [0, 0, -2], PX = 200;
const CAMS = {
  abre: [{ f: 0, pos: [0, 1.6, 0.2], look: [0, 1.6, -2], fov: 40 }, { f: 15, pos: [0, 1.6, 0.05], look: [0, 1.6, -2], fov: 38 }],
  abre2: [{ f: 16, pos: [0.9, 0.5, 0.4], look: [0.2, 0.5, -2], fov: 46 }, { f: 31, pos: [0.7, 0.5, 0.2], look: [0.2, 0.5, -2], fov: 44 }],
  abre3: [{ f: 32, pos: [0.2, 1.2, 2.2], look: [0, 1.1, -2], fov: 52 }, { f: 74, pos: [0.15, 1.2, 1.5], look: [0, 1.1, -2], fov: 48 }],
  azul: [{ f: 75, pos: [1.8, 1.4, 3.6], look: [0.6, 1.0, -2], fov: 52 }, { f: 151, pos: [1.6, 1.4, 3.2], look: [0.6, 1.0, -2], fov: 50 }],
  tres: [{ f: 152, pos: [0, 1.35, 0.2], look: [0, 1.25, -2], fov: 46 }, { f: 206, pos: [0, 1.35, 0.0], look: [0, 1.25, -2], fov: 44 }],
  branq: [{ f: 207, pos: [-0.3, 1.2, 0.3], look: [0, 1.0, -2], fov: 46 }, { f: 302, pos: [-0.2, 1.2, 0.1], look: [0, 1.0, -2], fov: 44 }],
  terceiro: [{ f: 303, pos: [0.8, 1.6, 2.4], look: [0, 1.4, -2], fov: 54 }, { f: 423, pos: [0.4, 2.4, 2.2], look: [0, 2.2, -2], fov: 54 }],
  rasteja: [{ f: 424, pos: [3, 0.8, 2.2], look: [0.5, 0.5, -2], fov: 50 }, { f: 484, pos: [2.4, 0.8, 1.6], look: [-0.5, 0.5, -2], fov: 50 }],
  cobre: [{ f: 485, pos: [0.3, 1.5, 4.6], look: [0.3, 1.2, -1], fov: 54 }, { f: 648, pos: [0.3, 1.5, 4.2], look: [0.3, 1.2, -1], fov: 52 }],
  bracos: [{ f: 649, pos: [0.6, 0.5, 0.6], look: [0, 0.4, -2], fov: 50 }, { f: 727, pos: [0.4, 0.5, 0.4], look: [0, 0.4, -2], fov: 48 }],
  neuronios: [{ f: 728, pos: [0, 1.0, 1.6], look: [0, 0.9, -2], fov: 52 }, { f: 848, pos: [0, 1.0, 1.2], look: [0, 0.9, -2], fov: 50 }],
  pensa: [{ f: 849, pos: [-1.2, 0.8, 1.4], look: [0, 0.6, -2], fov: 52 }, { f: 898, pos: [-1.0, 0.8, 1.2], look: [0, 0.6, -2], fov: 50 }],
  gosto: [{ f: 899, pos: [1.3, 0.35, -0.6], look: [0.8, 0.25, -1.6], fov: 44 }, { f: 1017, pos: [1.2, 0.35, -0.8], look: [0.8, 0.25, -1.6], fov: 42 }],
  prova: [{ f: 1018, pos: [1.0, 1.3, 3.6], look: [0.8, 1.0, -1.6], fov: 52 }, { f: 1114, pos: [0.9, 1.3, 3.2], look: [0.8, 1.0, -1.6], fov: 50 }],
  cor: [{ f: 1115, pos: [4.4, 1.2, 1.4], look: [5.2, 0.9, -2.4], fov: 46 }, { f: 1226, pos: [4.6, 1.2, 1.0], look: [5.2, 0.9, -2.4], fov: 44 }],
  osso: [{ f: 1227, pos: [0.1, 1.2, 1.4], look: [0, 1.1, -2], fov: 50 }, { f: 1311, pos: [0.1, 1.2, 1.1], look: [0, 1.1, -2], fov: 48 }],
  buraco: [{ f: 1312, pos: [7.4, 1.1, 0.4], look: [6, 0.9, -2.5], fov: 44 }, { f: 1408, pos: [7.0, 1.0, 0.0], look: [6, 0.9, -2.5], fov: 40 }],
  moeda: [{ f: 1409, pos: [6.9, 1.1, -1.0], look: [6.3, 0.9, -2.54], fov: 44 }, { f: 1494, pos: [6.3, 0.95, -1.6], look: [6.42, 0.9, -2.54], fov: 42 }],
  tonico: [{ f: 1495, pos: [PX + 0.4, 1.5, 3.2], look: [PX, 1.3, 0], fov: 46 }, { f: 1626, pos: [PX + 0.3, 1.5, 2.6], look: [PX, 1.3, 0], fov: 44 }],
  melada: [{ f: 1627, pos: [PX + 0.2, 1.6, 1.6], look: [PX, 1.4, 0], fov: 40 }, { f: 1696, pos: [PX + 0.2, 1.6, 1.4], look: [PX, 1.4, 0], fov: 38 }],
  loop: [{ f: 1697, pos: [2.5, 2.0, 5], look: [0, 1.0, -2], fov: 54 }, { f: 1790, pos: [0.4, 1.3, 2.2], look: [0, 1.1, -2], fov: 50 }, { f: 1861, pos: [0.2, 1.2, 1.6], look: [0, 1.1, -2], fov: 50 }],
};
const KICKS = [{ f: 368, a: 0.06 }, { f: 1627, a: 0.05 }];
export const camAt = (f) => { const S = shotAt(f); const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS }); c.shadowAt = c.look; return c; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shotAt(f), C = camAt(f); return { focus: dist(C.pos, C.look), cinf: 6 }; };
export const worldAt = (f) => { const S = shotAt(f); return { clouds: S.light === 'beach' }; };
// ---------- actors ----------
const base = (f, seed) => { const i = idle(f, seed); return { seed, bob: q(i.bob, 4), tilt: q(i.tilt, 2), headTilt: q(i.headTilt, 2), blink: blinkAt(f, seed) }; };
const helmet = (p) => { const g = p.g; g.save(); g.fillStyle = 'rgba(190,235,255,.2)'; g.strokeStyle = '#f2c84b'; g.lineWidth = 16; g.beginPath(); g.arc(300, 255, 165, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 12; g.beginPath(); g.arc(300, 255, 130, 3.6, 4.4); g.stroke(); g.restore(); };
const TON = (T, f, who, expr, arms, pos, extra = {}, more = {}, helm = false) => { const k = Math.floor(f / 22) % arms.length, ex = Array.isArray(expr) ? expr[Math.floor(f / 30) % expr.length] : expr;
  const o = { ...base(f, 4), expr: ex, L: arms[k][0], R: arms[k][1], holdR: arms[k][2] ?? undefined, facing: arms[k][3] ?? 0, look: arms[k][4] ?? 0, ...more };
  const a = { key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra };
  return helm ? [a, { key: 'helm', draw: helmet, x: pos[0], y: pos[1], z: pos[2] + 0.02, blob: false, shadow: false, order: 3, s: a.s }] : [a]; };
const OCT = (T, f, o, pos, s = 1.3, extra = {}) => { const oo = { wig: q((f * 0.02) % 1, 2), beat: q((f * 0.09) % 1, 1), ...o }; return { key: 'oc' + JSON.stringify(oo), draw: (p) => T.fxOctopus(p, oo), x: pos[0], y: pos[1], z: pos[2], s, ...extra }; };
const FXC = (key, fn, pos, s, extra = {}) => ({ key, draw: fn, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 4, ...extra });
const bub = (T, f) => FXC('bb' + (f % 90), (p) => T.fxBubbles(p, (f % 90) / 30), [0.3, 0, -1.4], 2.2);
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = []; const push = (...a) => out.push(...a.flat());
  switch (id) {
    case 'abre': case 'abre2': case 'abre3': push(OCT(T, f, { xray: 1, beat: q((f * 0.12) % 1, 1), wig: q((f * 0.04) % 1, 2) }, OC, 1.3, id === 'abre' || id === 'abre2' ? { noFrame: true } : {})); push(bub(T, f)); break;
    case 'azul': push(OCT(T, f, { xray: 1 }, OC)); push(TON(T, f, 'mergulhador', ['shock', 'surprised'], [['cheek', 'cheek'], ['up', 'point', null, -1, -0.5]], [2.0, 0, -0.6], {}, {}, true)); break;
    case 'tres': push(OCT(T, f, { xray: 1, beat: q((f * 0.12) % 1, 1) }, OC)); break;
    case 'branq': push(OCT(T, f, { xray: 1, beat: q((f * 0.12) % 1, 1) }, OC)); break;
    case 'terceiro': { const y = f > 360 ? lerp(0, 1.4, E.easeOut(ramp(f, 360, 420))) : 0; push(OCT(T, f, { xray: 1, stop: f > 368, wig: q((f * (f > 360 ? 0.06 : 0.02)) % 1, 2) }, [0, y, -2], 1.3, { blob: y < 0.3 })); push(bub(T, f)); break; }
    case 'rasteja': push(OCT(T, f, { wig: q((f * 0.05) % 1, 2), look: -1 }, [lerp(1.5, -0.8, ramp(f, 424, 484)), 0, -2], 1.1)); break;
    case 'cobre': { const pop = (f0) => { const t = (f - f0) / 8; return t >= 1 ? 1 : 0.6 + 0.4 * (1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2)); };   // cada gota só aparece quando a narração fala dela
      if (f >= 537) push(FXC('d1', (p) => T.fxDrop(p, { col: '#c8302f', label: 'FERRO' }), [-0.6, 0.3, -1.2], 0.9 * pop(537)));
      if (f >= 585) push(FXC('d2', (p) => T.fxDrop(p, { col: '#3f8fe8', label: 'COBRE' }), [1.2, 0.3, -1.2], 0.9 * pop(585)));
      push(TON(T, f, 'mergulhador', ['smile', 'determined'], [['point', 'hip', null, -1, -0.4], ['hip', 'point', null, 1, 0.4]], [0.3, 0, -0.7], {}, { talk: talkAt(f) }, true)); break; }
    case 'bracos': push(OCT(T, f, { wig: q((f * 0.04) % 1, 2) }, OC)); break;
    case 'neuronios': push(OCT(T, f, { xray: 1, neur: 1, wig: q((f * 0.03) % 1, 2) }, OC)); break;
    case 'pensa': push(OCT(T, f, { indep: 1, wig: q((f * 0.06) % 1, 2), look: Math.sin(f * 0.2) > 0 ? 1 : -1 }, OC)); break;
    case 'gosto': push(OCT(T, f, { taste: f % 20 < 12 ? 1 : 0, wig: q((f * 0.02) % 1, 2) }, OC, 1.3)); break;
    case 'prova': push(OCT(T, f, { happy: 1, wig: q((f * 0.03) % 1, 2) }, OC)); push(TON(T, f, 'mergulhador', ['laugh', 'smile'], [['belly', 'point', null, -1, -0.5], ['up', 'hip']], [2.2, 0, -0.8], {}, { talk: talkAt(f) }, true)); break;
    case 'cor': { const k = E.smooth(ramp(f, 1140, 1170)); const c = k > 0.5 ? '#6a7a7a' : '#d8506a', d = k > 0.5 ? '#5a6670' : '#a8344e'; push(OCT(T, f, { col: c, dark: d, look: 1 }, [5.0, 0, -2.4], 0.9, { alpha: 1 })); break; }
    case 'osso': push(OCT(T, f, { wig: q((f * 0.03) % 1, 2), happy: 1 }, OC)); break;
    case 'buraco': { const k = E.smooth(ramp(f, 1330, 1400)); push(OCT(T, f, { squeeze: k * 0.9, wig: q((f * 0.05) % 1, 2) }, [lerp(6.6, 6.0, k), 0, lerp(-2.2, -2.45, k)], lerp(0.7, 0.2, k), { blob: k < 0.5 })); break; }
    case 'moeda': break;
    case 'tonico': { const dip = f > 1560; push(TON(T, f, 'explorador', dip ? ['excited', 'surprised'] : ['determined', 'smile'], [[dip ? 'reach' : 'hip', 'reach', 'sorvete', 1, 0.4]], [PX, 0, 0])); break; }
    case 'melada': push(TON(T, f, 'explorador', ['disgust', 'pained'], [['hang', 'up', 'sorvete', 1, 0.2]], [PX, 0, 0]));
      push(FXC('drip' + (f % 20), (p) => { const g = p.g; g.fillStyle = '#f8c8d8'; g.strokeStyle = '#1a1424'; g.lineWidth = 6; for (let i = 0; i < 3; i++) { const y = 300 + ((f * 6 + i * 70) % 200); g.beginPath(); g.ellipse(430 + i * 12, y, 10, 16, 0, 0, 7); g.fill(); g.stroke(); } }, [PX, 0, 0.05], 1)); break;
    case 'loop': push(OCT(T, f, { xray: f > 1780 ? 1 : 0, beat: q((f * 0.09) % 1, 1) }, OC)); push(bub(T, f)); break;
  }
  return out;
};
export const fxAt = (f, T) => [];
