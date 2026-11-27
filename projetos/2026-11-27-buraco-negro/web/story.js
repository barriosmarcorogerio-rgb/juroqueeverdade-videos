// "E se você caísse num buraco negro?" — 1925 quadros, 30 fps. Espaço: buraco negro em (0,0,-40), estrela em x=-120, galáxia em x=300, Terra em x=-300.
// NOVO: a boca do Tonico mexe com a narração (web/mouth.json, gerado por mouth.py) quando ele está explicando.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1925, DECK = -999;
const MOUTH = await (await fetch('mouth.json')).json();
const talkAt = (f) => MOUTH[f] || 0;
const SH = [
  ['abre', 0, 'space'], ['culpa', 66, 'space'], ['estrela', 137, 'space'], ['luz', 283, 'space'], ['ese', 391, 'space'], ['pe', 448, 'space'],
  ['estica', 640, 'space'], ['espag', 768, 'space'], ['gigante', 888, 'space'], ['atravessa', 1107, 'space'], ['defora', 1189, 'space'],
  ['lento', 1278, 'space'], ['tempo', 1456, 'space'], ['boa', 1557, 'space'], ['terra', 1600, 'space'], ['alivio', 1702, 'space'], ['loop', 1852, 'space'],
];
export const SHOTS = SH.map(([id, a, light], i) => ({ id, a, b: (SH[i + 1] ? SH[i + 1][1] : TOTAL) - 1, light }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const LIGHTS = {
  space: { az: 150, el: 20, sky: '#c8c8ff', ground: '#2a1a10', hemi: 1.35, sun: '#ffe2b0', sunI: 2.6, fog: '#000008', fogNear: 2000, fogFar: 5000, skyTop: '#01010a', skyHor: '#0a0818', sunDisc: '#000000', sunSize: 0, sat: 1.15, vig: 0.3, shadowExt: 10, gain: '#fff4ec' },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });
const BHP = [0, 0, -40], STP = [-120, 0, -40], GAL = [300, 0, -60], EAR = [-300, -8, -30];
const T0 = [-9, 1.5, -22];               // Tonico perto do buraco negro
const CAMS = {
  abre: [{ f: 0, pos: [-8.6, 1.8, -13.5], look: [-9, 1.5, -22], fov: 52 }, { f: 65, pos: [-8.6, 1.8, -14.3], look: [-9, 1.5, -22], fov: 50 }],
  culpa: [{ f: 66, pos: [6, 10, 22], look: [-2, 0, -38], fov: 50 }, { f: 136, pos: [4, 8, 16], look: [-2, 0, -38], fov: 48 }],
  estrela: [{ f: 137, pos: [-100, 6, 10], look: [-118, 0, -40], fov: 52 }, { f: 282, pos: [-104, 5, 4], look: [-119, 0, -40], fov: 50 }],
  luz: [{ f: 283, pos: [-9, 4.5, 0], look: [-5.5, 0.8, -28], fov: 54 }, { f: 390, pos: [-8.5, 4.2, -3], look: [-5, 0.8, -30], fov: 52 }],
  ese: [{ f: 391, pos: [-12.6, 2.4, -12.2], look: [-13.6, 2.2, -16], fov: 38 }, { f: 447, pos: [-12.7, 2.4, -12.8], look: [-13.6, 2.2, -16], fov: 36 }],
  pe: [{ f: 448, pos: [-5.6, 0.8, -17.0], look: [-6.6, 0.2, -24], fov: 50 }, { f: 639, pos: [-5.7, 0.8, -17.8], look: [-6.6, 0.2, -24], fov: 48 }],
  estica: [{ f: 640, pos: [-4.2, 0.6, -18.5], look: [-5, 0.2, -27], fov: 56 }, { f: 767, pos: [-4.2, 0.6, -19.2], look: [-5, 0.2, -27], fov: 54 }],
  espag: [{ f: 768, pos: [-3.6, 0.6, -20.5], look: [-4.2, 0.3, -29.5], fov: 56 }, { f: 887, pos: [-3.6, 0.6, -21.2], look: [-4.2, 0.3, -29.5], fov: 54 }],
  gigante: [{ f: 888, pos: [300, 130, 60], look: [300, 0, -60], fov: 60 }, { f: 1106, pos: [300, 40, -20], look: [300, 0, -60], fov: 50, ease: 'easeIn' }],
  atravessa: [{ f: 1107, pos: [-5, 3, 8], look: [-0.4, 0.6, -24], fov: 56 }, { f: 1188, pos: [-3, 2, -6], look: [-0.4, 0.6, -26], fov: 56 }],
  defora: [{ f: 1189, pos: [-25.5, 3.2, -6], look: [-24, 2.6, -12], fov: 44 }, { f: 1277, pos: [-25.7, 3.1, -6.6], look: [-24, 2.6, -12], fov: 42 }],
  lento: [{ f: 1278, pos: [-3.5, 2.6, -12], look: [-1.2, 1.2, -26], fov: 44 }, { f: 1455, pos: [-3.2, 2.4, -15], look: [-1.2, 1.2, -26], fov: 40 }],
  tempo: [{ f: 1456, pos: [-2.6, 2.6, -11], look: [-1.4, 1.6, -22], fov: 50 }, { f: 1556, pos: [-2.6, 2.6, -12], look: [-1.4, 1.6, -22], fov: 48 }],
  boa: [{ f: 1557, pos: [-283, 1.5, -2], look: [-291, 0, -26], fov: 50 }, { f: 1599, pos: [-284, 1.5, -4], look: [-291, 0, -26], fov: 48 }],
  terra: [{ f: 1600, pos: [-258, 10, 60], look: [-222, -4, -30], fov: 70 }, { f: 1701, pos: [-256, 9, 52], look: [-222, -4, -30], fov: 68 }],
  alivio: [{ f: 1702, pos: [-283.5, 2.2, -4.5], look: [-286.6, 1.8, -13], fov: 44 }, { f: 1851, pos: [-284, 2.0, -6.5], look: [-286.6, 1.4, -13], fov: 42 }],
  loop: [{ f: 1852, pos: [-8.6, 1.8, -13.5], look: [-9, 1.5, -22], fov: 52 }, { f: 1924, pos: [-8.6, 1.8, -13.5], look: [-9, 1.5, -22], fov: 52 }],
};
const KICKS = [{ f: 849, a: 0.05 }, { f: 1600, a: 0.04 }];
export const camAt = (f) => { const S = shotAt(f); const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS }); c.shadowAt = c.look; return c; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shotAt(f), C = camAt(f); return { focus: dist(C.pos, C.look), cinf: ['ese', 'defora', 'boa', 'alivio', 'abre', 'loop'].includes(S.id) ? 5 : 0 }; };
export const worldAt = (f) => { const S = shotAt(f);
  return { noClouds: true, slow: ['lento', 'tempo'].includes(S.id), bhScale: ['atravessa', 'lento', 'tempo'].includes(S.id) ? 2.2 : 1,
    starScale: S.id === 'estrela' ? (f < 200 ? 1 : Math.max(0.02, 1 - E.easeIn(ramp(f, 200, 262)))) : 1, beam: S.id === 'luz', dash: S.id === 'terra' }; };
// ---------- actors ----------
const base = (f, seed) => { const i = idle(f, seed); return { seed, bob: q(i.bob, 4), tilt: q(i.tilt, 2), headTilt: q(i.headTilt, 2), blink: blinkAt(f, seed) }; };
const TON = 'astronauta';
// Tonico astronauta + capacete de vidro (cartão por cima, mesma escala/rolagem/esticada)
const helmet = (p) => { const g = p.g; g.save(); g.fillStyle = 'rgba(190,225,255,.22)'; g.strokeStyle = '#f4f8ff'; g.lineWidth = 14; g.beginPath(); g.arc(300, 255, 165, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 12; g.beginPath(); g.arc(300, 255, 130, 3.6, 4.4); g.stroke(); g.lineWidth = 16; g.strokeStyle = '#9aa0aa'; g.beginPath(); g.moveTo(170, 400); g.lineTo(430, 400); g.stroke(); g.restore(); };
const ASTRO = (T, f, expr, arms, pos, extra = {}, more = {}) => { const k = Math.floor(f / 22) % arms.length, ex = Array.isArray(expr) ? expr[Math.floor(f / 30) % expr.length] : expr;
  const o = { ...base(f, 4), expr: ex, L: arms[k][0], R: arms[k][1], facing: arms[k][2] ?? 0, look: arms[k][3] ?? 0, ...more };
  const fl = Math.sin(f * 0.05) * 0.06;
  const a = { key: 'ton' + JSON.stringify(o), draw: (p) => T.romanFront(p, TON, o), x: pos[0], y: pos[1] + fl, z: pos[2], blob: false, face: 'cam', roll: extra.roll ?? Math.sin(f * 0.03) * 0.08, ...extra };
  const h = { key: 'helm', draw: helmet, x: pos[0], y: pos[1] + fl, z: pos[2] + 0.02, blob: false, shadow: false, face: 'cam', roll: a.roll, s: a.s, sx: a.sx, sy: a.sy, order: 3, tint: a.tint, alpha: a.alpha };
  return [a, h]; };
const FXC = (key, fn, pos, s, extra = {}) => ({ key, draw: fn, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, face: 'cam', order: 4, ...extra });
const clockFx = (a) => (p) => { const g = p.g; g.fillStyle = '#fbf8ee'; g.strokeStyle = '#1a1424'; g.lineWidth = 16; g.beginPath(); g.arc(300, 500, 230, 0, 7); g.fill(); g.stroke();
  g.lineWidth = 10; for (let k = 0; k < 12; k++) { const t = k / 12 * 6.283; g.beginPath(); g.moveTo(300 + Math.sin(t) * 190, 500 - Math.cos(t) * 190); g.lineTo(300 + Math.sin(t) * 215, 500 - Math.cos(t) * 215); g.stroke(); }
  g.lineCap = 'round'; g.lineWidth = 18; g.beginPath(); g.moveTo(300, 500); g.lineTo(300 + Math.sin(a / 12) * 110, 500 - Math.cos(a / 12) * 110); g.stroke();
  g.lineWidth = 11; g.strokeStyle = '#e8483b'; g.beginPath(); g.moveTo(300, 500); g.lineTo(300 + Math.sin(a) * 175, 500 - Math.cos(a) * 175); g.stroke(); };
const scope = (p) => { const g = p.g; g.save(); g.translate(300, 620); g.rotate(-0.5); g.fillStyle = '#5a6a8a'; g.strokeStyle = '#1a1424'; g.lineWidth = 12; g.beginPath(); g.roundRect(-40, -260, 80, 300, 20); g.fill(); g.stroke(); g.fillStyle = '#8fd0ff'; g.beginPath(); g.ellipse(0, -260, 46, 18, 0, 0, 7); g.fill(); g.stroke(); g.restore(); };
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = []; const push = (...a) => out.push(...a.flat());
  const stretch = (k) => ({ sx: lerp(1, 0.32, k), sy: lerp(1, 3.4, k) });
  switch (id) {
    case 'abre': case 'loop': { const k = 0.85 + 0.1 * Math.sin(f * 0.2); push(ASTRO(T, f, 'terrified', [['up', 'up']], [-9, -0.2, -22], { ...stretch(k * 0.5), roll: Math.sin(f * 0.15) * 0.06 })); break; }
    case 'culpa': push(ASTRO(T, f, 'terrified', [['up', 'up']], [lerp(-9, -6, ramp(f, 66, 136)), lerp(1.5, 0.8, ramp(f, 66, 136)), lerp(-22, -27, ramp(f, 66, 136))], { ...stretch(0.9), roll: -0.9 + f * 0.02 })); break;
    case 'estrela': push(ASTRO(T, f, ['determined', 'smile'], [['hip', 'point', 1, 0.5], ['up', 'point', 1, 0.5]], [-103.5, 0.2, -6], { s: 1.0 }, { talk: talkAt(f) })); break;
    case 'luz': push(ASTRO(T, f, ['surprised', 'shock'], [['hang', 'reach', 1, 0.5]], [-9.8, 0.6, -14.2], {}, { talk: talkAt(f) })); break;
    case 'ese': push(ASTRO(T, f, ['surprised', 'excited'], [['point', 'hip', -1, -0.3], ['up', 'hip']], [-13.6, 1.0, -16], {}, { talk: talkAt(f) })); break;
    case 'pe': { const k = 0.08 + 0.12 * ramp(f, 448, 639); push(ASTRO(T, f, ['nervous', 'scared'], [['up', 'up']], [-6.6, -1.0, -24], { ...stretch(k), roll: 0 })); break; }
    case 'estica': { const k = 0.2 + 0.7 * E.smooth(ramp(f, 650, 760)); push(ASTRO(T, f, ['terrified', 'shock'], [['up', 'up']], [-5, -2.2, -27], { ...stretch(k), roll: Math.sin(f * 0.2) * 0.05 })); break; }
    case 'espag': push(ASTRO(T, f, ['dazed', 'terrified'], [['up', 'up']], [-4.2, -2.4 + Math.sin(f * 0.2) * 0.1, -29.5], { ...stretch(1), roll: Math.sin(f * 0.25) * 0.12 })); break;
    case 'gigante': break;
    case 'atravessa': { const z = lerp(-12, -25.6, E.smooth(ramp(f, 1107, 1188))); push(ASTRO(T, f, ['smile', 'relief'], [['hip', 'wave']], [-0.6, 0.6, z], { s: 1.6 }, { wv: f * 0.3 })); break; }
    case 'defora': push(ASTRO(T, f, ['surprised', 'shock'], [['cheek', 'hang']], [-24, 0.8, -12], {}, { talk: talkAt(f) })); push(FXC('scope', scope, [-23.2, 0.8, -11.9], 0.9)); break;
    case 'lento': { const k = ramp(f, 1278, 1440), sp = lerp(1, 0.02, k); const tint = `rgb(255,${Math.round(lerp(255, 90, k))},${Math.round(lerp(255, 60, k))})`;
      push(ASTRO(T, Math.round(1278 + (f - 1278) * sp), 'smile', [['hip', 'wave']], [-1.2, 0.6, lerp(-24.6, -26.2, Math.sqrt(k))], { s: 1.2, tint, alpha: lerp(1, 0.55, k) }, { wv: 3 })); break; }
    case 'tempo': { const sp = 0.25 * Math.exp(-(f - 1456) / 40); push(FXC('clk' + q(sp * 100, 0) + q((f * 0.25) % 6.28, 1), clockFx(1456 * 0.25 + (1 - Math.exp(-(f - 1456) / 40)) * 10), [-2.2, 1.4, -19.5], 1.4));
      push(ASTRO(T, 1440, 'smile', [['hip', 'wave']], [-1.2, 0.6, -26.2], { s: 1.2, tint: 'rgb(255,90,60)', alpha: 0.55 }, { wv: 3 })); break; }
    case 'boa': push(ASTRO(T, f, ['smile', 'laugh'], [['thumb', 'hip'], ['hip', 'point', -1, -0.4]], [-286.8, 0.6, -12.8], {}, { talk: talkAt(f) })); break;
    case 'terra': break;
    case 'alivio': { const k = f > 1800 ? 0.45 * E.smooth(ramp(f, 1800, 1851)) : 0; push(ASTRO(T, f, f > 1795 ? ['shock', 'terrified'] : ['relief', 'smile'], f > 1795 ? [['up', 'up']] : [['belly', 'hang'], ['hang', 'hip']], [-286.6, 0.6, -13], { ...stretch(k), roll: lerp(0, -0.9, k * 2) })); break; }
  }
  return out;
};
export const fxAt = (f, T) => [];
