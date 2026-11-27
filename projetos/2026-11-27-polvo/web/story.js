// "O polvo tem 3 corações" v2 — HISTÓRIA: polvo com fome → caranguejo na fenda → tubarão → foge pelo buraquinho. 1778 quadros, 30 fps.
// Cada fato aparece quando a história precisa dele; o raio-x mostra o sangue correndo (brânquias / corpo / para quando nada).
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1778, DECK = 0;
const SH = [
  ['abre', 0], ['abre2', 16], ['abre3', 32], ['caranguejo', 113], ['rasteja', 217], ['porque', 310], ['coracoes', 349], ['branq', 399], ['corpo', 490],
  ['nada', 565], ['cansa', 652], ['azul', 705], ['cobre', 747], ['fenda', 839], ['gosto', 961], ['pensa', 1026], ['achou', 1184], ['masai', 1224],
  ['tubarao', 1248], ['cor', 1290], ['pedra', 1368], ['naocolou', 1409], ['foge', 1441], ['passa', 1509], ['final', 1590], ['loop', 1687],
];
const CLOSE = new Set(['abre', 'abre2', 'coracoes', 'branq', 'azul', 'gosto', 'loop', 'porque']);
export const SHOTS = SH.map(([id, a], i) => ({ id, a, b: (SH[i + 1] ? SH[i + 1][1] : TOTAL) - 1, light: 'sea', close: CLOSE.has(id), noAuto: ['cor', 'pedra', 'foge', 'tubarao'].includes(id) }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const LIGHTS = {
  sea: { az: 30, el: 75, sky: '#bfefff', ground: '#2a6a7a', hemi: 1.45, sun: '#e8fbff', sunI: 2.2, fog: '#2a8aa8', fogNear: 4, fogFar: 46, skyTop: '#1a5a8a', skyHor: '#2a8aa8', sunDisc: '#000000', sunSize: 0, sat: 1.12, vig: 0.3, shadowExt: 12, gain: '#e8fcff' },
};
export const lightFor = (S, f) => { const L = { ...LIGHTS.sea }; if (['masai', 'tubarao', 'cor', 'pedra', 'naocolou'].includes(S.id)) { L.hemi = 1.1; L.fog = '#1a5a78'; L.vig = 0.42; } return L; };
// trajeto do polvo: começo → fenda (-4.1,-3.2)
const P0 = [2, 0, 1], PF = [-4.1, 0, -3.1], TOCA = [6, 0, -3];
const crawl = (f) => { const t = E.smooth(ramp(f, 217, 900)); return [lerp(P0[0], PF[0], t), 0, lerp(P0[2], PF[2], t)]; };
const CAMS = {
  abre: [{ f: 0, pos: [2, 1.55, 2.3], look: [2, 1.55, 0.9], fov: 40 }, { f: 15, pos: [2, 1.55, 2.2], look: [2, 1.55, 0.9], fov: 38 }],
  abre2: [{ f: 16, pos: [2.6, 0.5, 2.4], look: [2.1, 0.5, 1], fov: 46 }, { f: 31, pos: [2.5, 0.5, 2.3], look: [2.1, 0.5, 1], fov: 44 }],
  abre3: [{ f: 32, pos: [2.4, 1.3, 5.2], look: [2, 1.0, 1], fov: 52 }, { f: 112, pos: [2.3, 1.3, 4.4], look: [2, 1.0, 1], fov: 50 }],
  caranguejo: [{ f: 113, pos: [-4.6, 0.6, -2.2], look: [-5, 0.5, -4.2], fov: 42 }, { f: 216, pos: [-4.7, 0.6, -2.6], look: [-5, 0.5, -4.2], fov: 40 }],
  rasteja: [{ f: 217, pos: [4.5, 1.0, 4.2], look: [1.6, 0.4, 0.6], fov: 52 }, { f: 309, pos: [3.2, 1.0, 3.6], look: [0.8, 0.4, 0.0], fov: 52 }],
  porque: [{ f: 310, pos: [1.0, 1.0, 3.0], look: [0, 0.8, 0], fov: 46 }, { f: 348, pos: [0.9, 1.0, 2.7], look: [0, 0.8, 0], fov: 44 }],
  coracoes: [{ f: 349, pos: [0, 1.3, 2.2], look: [0, 1.15, 0], fov: 46 }, { f: 398, pos: [0, 1.3, 2.0], look: [0, 1.15, 0], fov: 44 }],
  branq: [{ f: 399, pos: [0, 1.25, 2.4], look: [0, 1.1, 0], fov: 50 }, { f: 489, pos: [0, 1.25, 2.2], look: [0, 1.1, 0], fov: 48 }],
  corpo: [{ f: 490, pos: [0, 1.0, 3.4], look: [0, 0.9, 0], fov: 54 }, { f: 564, pos: [0, 1.0, 3.1], look: [0, 0.9, 0], fov: 52 }],
  nada: [{ f: 565, pos: [0.3, 1.5, 4.2], look: [0, 1.2, 0], fov: 54 }, { f: 651, pos: [0.3, 2.6, 4.0], look: [0, 2.3, 0], fov: 54 }],
  cansa: [{ f: 652, pos: [1.2, 1.4, 3.4], look: [0, 0.8, 0], fov: 52 }, { f: 704, pos: [1.0, 1.0, 3.0], look: [0, 0.6, 0], fov: 50 }],
  azul: [{ f: 705, pos: [0, 1.15, 2.4], look: [0, 1.0, 0], fov: 48 }, { f: 746, pos: [0, 1.15, 2.2], look: [0, 1.0, 0], fov: 46 }],
  cobre: [{ f: 747, pos: [0, 1.3, 4.6], look: [0, 1.0, 0], fov: 56 }, { f: 838, pos: [0, 1.3, 4.2], look: [0, 1.0, 0], fov: 54 }],
  fenda: [{ f: 839, pos: [-1.5, 1.4, 1.0], look: [-4.4, 0.7, -3.6], fov: 50 }, { f: 960, pos: [-2.2, 1.2, -0.2], look: [-4.6, 0.6, -3.8], fov: 48 }],
  gosto: [{ f: 961, pos: [-4.6, 0.5, -2.3], look: [-5, 0.45, -4.2], fov: 42 }, { f: 1025, pos: [-4.7, 0.5, -2.6], look: [-5, 0.45, -4.2], fov: 40 }],
  pensa: [{ f: 1026, pos: [-3.2, 1.1, -0.6], look: [-4.1, 0.8, -3.1], fov: 50 }, { f: 1183, pos: [-3.4, 1.1, -1.0], look: [-4.1, 0.8, -3.1], fov: 48 }],
  achou: [{ f: 1184, pos: [-3.3, 1.0, -0.8], look: [-4.3, 0.7, -3.3], fov: 50 }, { f: 1223, pos: [-3.4, 1.0, -1.1], look: [-4.3, 0.7, -3.3], fov: 48 }],
  masai: [{ f: 1224, pos: [-3.4, 1.4, -0.9], look: [-3.8, 1.1, -3.2], fov: 50 }, { f: 1247, pos: [-3.2, 1.8, -0.6], look: [-3.4, 1.8, -3.2], fov: 50 }],
  tubarao: [{ f: 1248, pos: [-1.0, 1.6, 3.4], look: [-3.0, 1.4, -3.0], fov: 60 }, { f: 1289, pos: [-1.2, 1.6, 2.6], look: [-3.2, 1.3, -3.0], fov: 58 }],
  cor: [{ f: 1290, pos: [-3.3, 1.0, -0.5], look: [-4.3, 0.7, -3.3], fov: 48 }, { f: 1367, pos: [-3.5, 1.0, -1.0], look: [-4.3, 0.7, -3.3], fov: 46 }],
  pedra: [{ f: 1368, pos: [-1.5, 1.5, 2.0], look: [-3.6, 1.0, -3.2], fov: 56 }, { f: 1408, pos: [-1.6, 1.5, 1.6], look: [-3.6, 1.0, -3.2], fov: 54 }],
  naocolou: [{ f: 1409, pos: [-0.8, 1.6, 3.0], look: [-3.4, 1.0, -3.0], fov: 58 }, { f: 1440, pos: [-0.8, 1.6, 2.8], look: [-3.4, 1.0, -3.0], fov: 58 }],
  foge: [{ f: 1441, pos: [7.2, 1.1, 0.0], look: [6.2, 0.9, -2.5], fov: 44 }, { f: 1508, pos: [6.6, 1.0, -1.1], look: [6.1, 0.9, -2.54], fov: 40 }],
  passa: [{ f: 1509, pos: [6.6, 1.2, -7.2], look: [6.0, 0.8, -3.6], fov: 50 }, { f: 1589, pos: [6.5, 1.1, -6.6], look: [6.0, 0.7, -3.8], fov: 48 }],
  final: [{ f: 1590, pos: [7.0, 1.4, -8.4], look: [6.1, 1.0, -4.6], fov: 52 }, { f: 1686, pos: [6.6, 1.3, -7.6], look: [6.1, 1.0, -4.6], fov: 48 }],
  loop: [{ f: 1687, pos: [6.0, 1.5, -6.4], look: [6.0, 1.45, -4.7], fov: 44 }, { f: 1777, pos: [6.0, 1.55, -6.1], look: [6.0, 1.55, -4.7], fov: 40 }],
};
const KICKS = [{ f: 624, a: 0.06 }, { f: 1248, a: 0.09 }, { f: 1409, a: 0.06 }, { f: 1555, a: 0.07 }];
const REL = new Set(['porque', 'coracoes', 'branq', 'corpo', 'nada', 'cansa', 'azul', 'cobre']);   // câmera relativa ao polvo que rasteja
export const camAt = (f) => { const S = shotAt(f); const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS }); if (REL.has(S.id)) { const p = crawl(f); c.pos = c.pos.map((v, i) => v + p[i]); c.look = c.look.map((v, i) => v + p[i]); } c.shadowAt = c.look; return c; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shotAt(f), C = camAt(f); return { focus: dist(C.pos, C.look), cinf: 6 }; };
export const worldAt = (f) => ({ clouds: false });
// ---------- actors ----------
const OCT = (T, f, o, pos, s = 1.3, extra = {}) => { const oo = { wig: q((f * 0.02) % 1, 2), beat: q((f * 0.09) % 1, 1), ...o }; if (oo.flow) oo.ft = q(f / 30, 2); return { key: 'oc' + JSON.stringify(oo), draw: (p) => T.fxOctopus(p, oo), x: pos[0], y: pos[1], z: pos[2], s, ...extra }; };
const FXC = (key, fn, pos, s, extra = {}) => ({ key, draw: fn, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 4, ...extra });
const bub = (T, f, pos = [0.3, 0, -1.4]) => FXC('bb' + (f % 90), (p) => T.fxBubbles(p, (f % 90) / 30), pos, 2.2);
const pop = (f, f0) => { const t = (f - f0) / 8; return t >= 1 ? 1 : 0.6 + 0.4 * (1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2)); };
const CRAB = (T, f, o, pos, s = 0.35, extra = {}) => ({ key: 'cr' + JSON.stringify(o), draw: (p) => T.fxCrab(p, o), x: pos[0], y: pos[1], z: pos[2], s, ...extra });
const SHARK = (T, f, o, pos, s = 1.6, extra = {}) => ({ key: 'sk' + JSON.stringify(o), draw: (p) => T.fxShark(p, o), x: pos[0], y: pos[1], z: pos[2], s, blob: false, ...extra });
const CRABP = [-5, 0.05, -4.25];
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = []; const push = (...a) => out.push(...a.flat());
  const wig = (k) => q((f * k) % 1, 2);
  switch (id) {
    case 'abre': case 'abre2': case 'abre3': push(OCT(T, f, { xray: id === 'abre' ? 1 : 0, flow: id === 'abre' ? 'all' : undefined, wig: wig(0.04), look: id === 'abre3' ? -1 : 0 }, P0, 1.3, id !== 'abre3' ? { noFrame: true } : {})); push(bub(T, f, [P0[0], 0, P0[2] + 0.4])); break;
    case 'caranguejo': push(CRAB(T, f, { claw: q(Math.abs(Math.sin(f * 0.15)), 1) }, CRABP)); break;
    case 'rasteja': push(OCT(T, f, { wig: wig(0.06), look: -1 }, crawl(f), 1.1)); break;
    case 'porque': push(OCT(T, f, { wig: wig(0.02), look: 1, happy: 1 }, crawl(f), 1.1)); break;
    case 'coracoes': push(OCT(T, f, { xray: 1, beat: q((f * 0.12) % 1, 1) }, crawl(f), 1.1)); break;
    case 'branq': push(OCT(T, f, { xray: 1, flow: 'gill', beat: q((f * 0.12) % 1, 1) }, crawl(f), 1.1)); break;
    case 'corpo': push(OCT(T, f, { xray: 1, flow: 'all', beat: q((f * 0.12) % 1, 1) }, crawl(f), 1.1)); break;
    case 'nada': { const p = crawl(f), y = lerp(0, 1.6, E.easeOut(ramp(f, 570, 620))); const st = f >= 620; push(OCT(T, f, { xray: 1, flow: st ? 'stop' : 'all', stop: st, wig: wig(0.07) }, [p[0], y, p[2]], 1.1, { blob: y < 0.3 })); push(bub(T, f, [p[0], 0, p[2] + 0.3])); break; }
    case 'cansa': { const p = crawl(f), y = lerp(1.6, 0, E.easeIn(ramp(f, 652, 680))); push(OCT(T, f, { wig: wig(0.02), look: -1 }, [p[0], y, p[2]], 1.1, { blob: y < 0.3 })); break; }
    case 'azul': push(OCT(T, f, { xray: 1, flow: 'all', beat: q((f * 0.1) % 1, 1) }, crawl(f), 1.1)); break;
    case 'cobre': { const p = crawl(f); push(OCT(T, f, { xray: 1, flow: 'all', wig: wig(0.03) }, p, 1.0));
      if (f >= 765) push(FXC('d1', (pp) => T.fxDrop(pp, { col: '#c8302f', label: 'FERRO' }), [p[0] - 1.3, 0.3, p[2] + 0.4], 0.8 * pop(f, 765)));
      if (f >= 810) push(FXC('d2', (pp) => T.fxDrop(pp, { col: '#3f8fe8', label: 'COBRE' }), [p[0] + 1.3, 0.3, p[2] + 0.4], 0.8 * pop(f, 810))); break; }
    case 'fenda': push(OCT(T, f, { wig: wig(0.05), look: -1 }, crawl(f), 1.0)); break;
    case 'gosto': push(CRAB(T, f, { claw: q(Math.abs(Math.sin(f * 0.2)), 1), scared: f > 990 ? 1 : 0 }, CRABP));
      push(FXC('arm' + (f % 12), (pp) => { const g = pp.g, x = 700 - Math.min(1, (f - 961) / 25) * 380; g.lineCap = 'round'; g.lineWidth = 46; g.strokeStyle = '#1a1424'; g.beginPath(); g.moveTo(800, 700); g.quadraticCurveTo(560, 640 + Math.sin(f * 0.3) * 20, x, 760); g.stroke(); g.lineWidth = 36; g.strokeStyle = '#d8506a'; g.stroke();
        for (let k = 0; k < 6; k++) { const t = k / 6, sx = x + (800 - x) * t, sy = 760 - 60 * Math.sin(t * 3.1); g.fillStyle = '#f8d8c8'; g.beginPath(); g.arc(sx, sy + 14, 8, 0, 7); g.fill(); if (f > 980 && (f + k * 3) % 12 < 6) { g.fillStyle = '#ffe86a'; g.beginPath(); g.arc(sx, sy - 18, 7, 0, 7); g.fill(); } } }, [CRABP[0], 0.05, CRABP[2] + 0.02], 0.35, { order: 3 })); break;
    case 'pensa': push(OCT(T, f, { xray: f > 1100 ? 1 : 0, neur: 1, indep: 1, wig: wig(0.06), look: Math.sin(f * 0.15) > 0 ? 1 : -1 }, PF, 1.0)); break;
    case 'achou': push(OCT(T, f, { happy: 1, wig: wig(0.04) }, PF, 1.0)); push(CRAB(T, f, { scared: 1, claw: 1 }, [PF[0] + 0.7, 0.05, PF[2] + 0.4], 0.3)); break;
    case 'masai': push(OCT(T, f, { wig: wig(0.02), look: 1 }, PF, 1.0)); push(FXC('sh', (pp) => { const g = pp.g; g.fillStyle = 'rgba(10,20,30,.55)'; g.beginPath(); g.ellipse(300, 400, 320, 90, 0, 0, 7); g.fill(); }, [PF[0] + 1, 2.4, PF[2] - 1], 1.6)); break;
    case 'tubarao': { const x = lerp(4, -0.6, E.easeOut(ramp(f, 1248, 1285))); push(SHARK(T, f, { swim: q((f * 0.05) % 1, 2), bite: q(0.3 + 0.3 * Math.sin(f * 0.3), 1) }, [x, 0.6, -2.6], 1.5, { flip: true }));
      push(OCT(T, f, { wig: wig(0.08), look: 1 }, PF, 1.0)); break; }
    case 'cor': { const k = E.smooth(ramp(f, 1330, 1350)); const c = k > 0.5 ? '#5a6670' : '#d8506a', d = k > 0.5 ? '#4a565e' : '#a8344e'; push(OCT(T, f, { col: c, dark: d, look: 1 }, PF, 1.0)); break; }
    case 'pedra': push(OCT(T, f, { col: '#5a6670', dark: '#4a565e', look: 1 }, PF, 1.0)); push(SHARK(T, f, { swim: q((f * 0.03) % 1, 2), bite: 0 }, [-0.9, 0.9, -2.2], 1.5, { flip: true })); break;
    case 'naocolou': { const bite = E.easeIn(ramp(f, 1409, 1430)); push(SHARK(T, f, { swim: q((f * 0.06) % 1, 2), bite: q(bite, 1) }, [lerp(-0.9, -2.6, bite), 0.9, -2.2], 1.5, { flip: true }));
      push(OCT(T, f, { wig: wig(0.1), look: 1, col: f > 1420 ? '#d8506a' : '#5a6670', dark: f > 1420 ? '#a8344e' : '#4a565e' }, [lerp(PF[0], PF[0] + 1.2, ramp(f, 1420, 1440)), 0, PF[2]], 1.0)); break; }
    case 'foge': { const k = E.smooth(ramp(f, 1450, 1500)); push(OCT(T, f, { squeeze: k * 0.9, wig: wig(0.07) }, [lerp(6.6, 6.0, k), 0, lerp(-2.2, -2.45, k)], lerp(0.7, 0.2, k), { blob: k < 0.5 }));
      if (f > 1470) push(SHARK(T, f, { swim: q((f * 0.06) % 1, 2), bite: 0.6 }, [lerp(10, 7.6, ramp(f, 1470, 1500)), 0.9, -1.6], 1.2, { flip: true, noFrame: true })); break; }
    case 'passa': { const k = E.smooth(ramp(f, 1509, 1545)); push(OCT(T, f, { squeeze: (1 - k) * 0.9, wig: wig(0.05), happy: k > 0.8 ? 1 : 0 }, [6.0, 0, lerp(-3.5, -4.6, k)], lerp(0.25, 1.0, k))); break; }
    case 'final': push(OCT(T, f, { wig: wig(0.02), look: -1 }, [6.0, 0, -4.6], 1.0)); push(bub(T, f, [6.0, 0, -4.2])); break;
    case 'loop': push(OCT(T, f, { xray: 1, flow: 'all', beat: q((f * 0.12) % 1, 1), wig: wig(0.03) }, [6.0, 0, -4.6], 1.0)); push(bub(T, f, [6.0, 0, -4.2])); break;
  }
  return out;
};
export const fxAt = (f, T) => [];
