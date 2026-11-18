// Vídeo longo horizontal, guiado por shots.json (gerado por plan.py). 12 quadros/s.
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, walk } from './motion.js';
const RAW = await (await fetch('shots.json')).json();
export const FPS = 12, TOTAL = RAW.total, DECK = 0;
export const SHOTS = RAW.shots;
export const shotAt = (f) => { let lo = 0, hi = SHOTS.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (SHOTS[m].a <= f) lo = m; else hi = m - 1; } return SHOTS[lo]; };
export const LIGHTS = {
  day: { az: 35, el: 48, sky: '#cfe2ff', ground: '#6f7a4a', hemi: 1.5, sun: '#fff4e0', sunI: 3.2, fog: '#c9dcf2', fogNear: 60, fogFar: 700, skyTop: '#2c6fd6', skyHor: '#bcd7f4', sat: 1.12, vig: 0.18, shadowExt: 16, sunDisc: '#fff6d8', sunSize: 0.004 },
  gold: { az: 20, el: 14, sky: '#ffd9a8', ground: '#6a5a3a', hemi: 1.25, sun: '#ffb46a', sunI: 3.4, fog: '#f2c494', fogNear: 60, fogFar: 600, skyTop: '#4a78c8', skyHor: '#ffc38a', sat: 1.15, vig: 0.24, shadowExt: 16, sunDisc: '#fff0c0', sunSize: 0.006, gain: '#fff2e2' },
  night: { az: 200, el: 30, sky: '#7a8ac0', ground: '#3a3a4a', hemi: 1.5, sun: '#b0c0ff', sunI: 1.4, fog: '#2a3050', fogNear: 60, fogFar: 500, skyTop: '#0a1030', skyHor: '#2a3a6a', sat: 1.05, vig: 0.3, shadowExt: 16, sunDisc: '#e8eeff', sunSize: 0.003 },
  shaft: { az: 35, el: 80, sky: '#c9b8a0', ground: '#3a2a1a', hemi: 1.1, sun: '#fff4e0', sunI: 0.6, fog: '#1a120c', fogNear: 6, fogFar: 40, skyTop: '#bcd7f4', skyHor: '#bcd7f4', sat: 1.1, vig: 0.38, shadowExt: 8 },
  hot: { az: 35, el: 80, sky: '#ffb070', ground: '#5a1a00', hemi: 1.2, sun: '#ffb060', sunI: 0.5, fog: '#3a0e00', fogNear: 5, fogFar: 34, skyTop: '#bcd7f4', skyHor: '#bcd7f4', sat: 1.2, vig: 0.4, shadowExt: 8, gain: '#ffe6d0' },
  mine: { az: 35, el: 80, sky: '#ffd0a0', ground: '#3a2010', hemi: 1.0, sun: '#ffd9a0', sunI: 0.3, fog: '#2a1408', fogNear: 10, fogFar: 40, skyTop: '#2a1408', skyHor: '#2a1408', sat: 1.1, vig: 0.36, shadowExt: 10 },
  polar: { az: 160, el: 18, sky: '#dfe8ff', ground: '#c0c8d8', hemi: 1.5, sun: '#fff0e0', sunI: 2.6, fog: '#dde6f2', fogNear: 30, fogFar: 300, skyTop: '#5a86c8', skyHor: '#e6eef8', sat: 1.0, vig: 0.2, shadowExt: 14, sunDisc: '#fffbe8', sunSize: 0.004 },
  space: { az: 60, el: 20, sky: '#a0b0d0', ground: '#202030', hemi: 1.3, sun: '#ffffff', sunI: 2.4, fog: '#000000', fogNear: 3000, fogFar: 5000, skyTop: '#02030a', skyHor: '#0a1030', sat: 1.12, vig: 0.25, shadowExt: 60 },
  core: { az: 35, el: 70, sky: '#ffb070', ground: '#ff6a10', hemi: 1.2, sun: '#ffd0a0', sunI: 0.8, fog: '#5a1a04', fogNear: 30, fogFar: 260, skyTop: '#3a0a00', skyHor: '#7a2a08', sat: 1.15, vig: 0.32, shadowExt: 14, gain: '#fff0e0' },
  center: { az: 35, el: 60, sky: '#fff0c0', ground: '#ffb040', hemi: 1.8, sun: '#fff6e0', sunI: 1.0, fog: '#ffe6a0', fogNear: 200, fogFar: 900, skyTop: '#ffe6a0', skyHor: '#ffe6a0', sat: 1.08, vig: 0.22, shadowExt: 10 },
  dawn: { az: 120, el: 10, sky: '#ffd6c8', ground: '#6a5a4a', hemi: 1.4, sun: '#ffd2a8', sunI: 2.8, fog: '#f0d2c8', fogNear: 80, fogFar: 800, skyTop: '#6a8fd6', skyHor: '#ffcfae', sat: 1.12, vig: 0.22, shadowExt: 40, sunDisc: '#fff4dc', sunSize: 0.008 },
  ocean: { az: 60, el: 40, sky: '#d6e8ff', ground: '#4a6a8a', hemi: 1.5, sun: '#fff4e0', sunI: 3.0, fog: '#cfe2f2', fogNear: 120, fogFar: 800, skyTop: '#2c70d8', skyHor: '#c6dcf4', sat: 1.1, vig: 0.16, shadowExt: 18, sunDisc: '#fff6d8', sunSize: 0.004 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light || 'day'], ...(S.lightOv || {}) });
export const camAt = (f) => { const S = shotAt(f); const c = camFromKeys(S.cam, f, { kicks: S.kicks || [], creep: 0.0025 }); c.shadowAt = S.shadowAt || c.look; return c; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shotAt(f); if (!S.dof) return { focus: 10, cinf: 0 }; const C = camAt(f); return { focus: dist(C.pos, S.focusAt || C.look), cinf: S.dof }; };
export const worldAt = (f) => { const S = shotAt(f); const w = { noClouds: false, ...(S.world || {}), a: S.a };
  return w; };
const base = (F, seed) => { const i = idle(F, seed); return { seed, bob: q(i.bob, 5), tilt: q(i.tilt, 3), headTilt: q(i.headTilt, 3), blink: blinkAt(F, seed) }; };   // precisão alta: arredondar causava a cabeça 'tremer' 1–2 px
const SEED = { tonico: 3, bia: 5, ferraz: 9, lucio: 11, soldado: 13, gigante: 15, gigante2: 17, gigante3: 19 };
export const actorsAt = (f, T) => {
  const S = shotAt(f), F = f * 2.5, out = [], u = E.smooth(clamp((f - S.a) / Math.max(1, S.b - S.a)));
  for (const c of S.cast || []) {
    let pos = c.to ? lerp3(c.pos, c.to, c.ease === 'lin' ? clamp((f - S.a) / Math.max(1, S.b - S.a)) : u) : c.pos.slice();
    if (c.float) pos = [pos[0] + Math.sin(F * 0.03 + pos[2]) * c.float * 0.5, pos[1] + Math.sin(F * 0.05 + pos[0]) * c.float, pos[2]];
    if (c.fx) { let go = c.o || {}; if (c.walk) go = { ...go, walk: q(((f - S.a) * 2.5 / 30 * 0.6) % 1, 2) }; if (go.steam) go = { ...go, steam: q(((f - S.a) / 30) % 1 + 0.001, 2) }; if (go.cutFrac !== undefined) go = { ...go, cut: q(Math.min(1, Math.max(0, (f - S.a - go.cutFrac * (S.b - S.a)) / 10)), 2) }; if (go.decapFrac !== undefined) go = { ...go, decap: q(Math.min(1, Math.max(0, (f - S.a - go.decapFrac * (S.b - S.a)) / Math.max(4, (1 - go.decapFrac) * (S.b - S.a) * 0.8))), 2) }; const k = c.fx + (c.t !== undefined ? q(c.t, 1) : '') + JSON.stringify(go); out.push({ key: k, draw: (p) => T[c.fx](p, c.t ?? 0, go), x: pos[0], y: pos[1], z: pos[2], s: c.s || 1, face: c.face, flip: c.flip, blob: false, shadow: c.shadow ?? false, order: c.order || 4, roll: c.wobble ? c.wobble * Math.sin(F * 0.05) : (c.roll || 0), tint: c.tint }); continue; }
    const b = base(F, SEED[c.who] || 7), o = { ...b, ...(c.pose || {}) };
    if (c.still) { o.bob = 0; o.tilt = 0; }
    if (c.walk) o.step = q(walk(F, S.a * 2.5, 1.2, 0.5).phase, 2);
    if (c.climb) { const k = Math.floor((f - S.a) / 4); o.L = 'grip'; o.R = 'grip'; o.gripHi = k % 2 ? 'L' : 'R'; o.step = q((k % 4) / 4, 2); o.bob = q(0.01 * Math.sin((f - S.a) * 0.8), 3); }   // escalada/rapel: mão sobre mão na corda, pernas mexendo
    if (c.shake) { o.bob = q(0.01 * Math.sin(F * 2.1), 3); o.shake = (F | 0) % 2; }
    if (c.swirl) o.swirl = q(F * 0.2, 1);
    if (c.chew) o.bob = q(0.006 * Math.sin(F * 0.8), 3);
    const s = c.s || 1;
    const roll = c.spin ? F * 0.03 : c.rollTo !== undefined ? lerp(c.roll || 0, c.rollTo, c.rollEase === 'in' ? E.easeIn(clamp((f - S.a - (c.rollDelay || 0)) / Math.max(1, (c.rollDur || (S.b - S.a)))) ) : u) : (c.roll || 0);
    out.push({ key: c.who + JSON.stringify(o), draw: (p) => T.romanFront(p, c.who, o), x: pos[0], y: pos[1], z: pos[2], s, flip: c.flip, face: c.face, blob: c.blob, roll, shadow: c.shadow, tint: c.tint });
    if (c.hat) out.push({ key: 'helm', draw: (p) => T.fxHelmet(p), x: pos[0], y: pos[1] + (c.hatY ?? 1.27) * s + (o.bob || 0) * 2.25 * s, z: pos[2] + 0.02, s: 0.42 * s, face: c.face, blob: false, shadow: false, order: 3 });
  }
  return out;
};
export const fxAt = (f, T) => [];
