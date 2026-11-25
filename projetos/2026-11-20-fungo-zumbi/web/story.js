// "A formiga zumbi" — fungo Ophiocordyceps (Tailândia). 1901 quadros, 30 fps. Set humano na origem, set MACRO em x = MX (1 unidade = 1 cm).
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, walk } from './motion.js';
export const FPS = 30, TOTAL = 1901, DECK = 0;
const MX = 600, ST = [MX + 4, 0, -2];
const SH = [
  ['abre', 0, 'macro'], ['fungo', 70, 'macro'], ['floresta', 145, 'jungle'], ['pisa', 190, 'macro'], ['dentro', 317, 'macro'],
  ['trilha', 425, 'macro'], ['treme', 501, 'macro'], ['sinistra', 568, 'jungle'], ['sobe', 626, 'macro'], ['regua', 690, 'macro'],
  ['sol', 730, 'noon'], ['morde', 791, 'noon'], ['solta', 918, 'noon'], ['umido', 978, 'mist'], ['haste', 1099, 'mist'], ['chuva', 1201, 'mist'],
  ['zumbi', 1273, 'dusk'], ['voce', 1398, 'jungle'], ['nao', 1483, 'jungle'], ['especie', 1561, 'jungle'], ['quente', 1621, 'jungle'],
  ['alivio', 1684, 'jungle'], ['chao', 1761, 'jungle'], ['repara', 1814, 'jungle'], ['loop', 1861, 'macro'],
];
export const SHOTS = SH.map(([id, a, light], i) => ({ id, a, b: (SH[i + 1] ? SH[i + 1][1] : TOTAL) - 1, light }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const LIGHTS = {
  jungle: { az: 30, el: 62, sky: '#cfe8c8', ground: '#3a4a26', hemi: 1.35, sun: '#fff2c8', sunI: 2.6, fog: '#8fb48a', fogNear: 14, fogFar: 140, skyTop: '#4a8ad0', skyHor: '#cfe6c4', sat: 1.15, vig: 0.24, shadowExt: 18, sunDisc: '#fff6d8', sunSize: 0.004, gain: '#f4fff0' },
  macro: { az: 50, el: 48, sky: '#d8ecc8', ground: '#4a3a24', hemi: 1.45, sun: '#fff0cc', sunI: 2.9, fog: '#9cbf8a', fogNear: 6, fogFar: 90, skyTop: '#5a96d6', skyHor: '#d6eccc', sat: 1.18, vig: 0.26, shadowExt: 12, sunDisc: '#fff6d8', sunSize: 0.004, gain: '#fffaf0' },
  noon: { az: 20, el: 84, sky: '#eaf6ff', ground: '#5a4a2a', hemi: 1.5, sun: '#fffbe8', sunI: 3.6, fog: '#b6d6a6', fogNear: 8, fogFar: 110, skyTop: '#3a86e0', skyHor: '#e0f2e8', sat: 1.16, vig: 0.22, shadowExt: 16, sunDisc: '#ffffff', sunSize: 0.012, gain: '#fffbe8' },
  mist: { az: 40, el: 40, sky: '#d0e6d6', ground: '#3a4a34', hemi: 1.35, sun: '#f2f6e0', sunI: 2.0, fog: '#c2dccb', fogNear: 3, fogFar: 55, skyTop: '#86b0c6', skyHor: '#d6eadb', sat: 1.08, vig: 0.28, shadowExt: 14, sunDisc: '#ffffff', sunSize: 0.003 },
  dusk: { az: 10, el: 6, sky: '#a07ac0', ground: '#2a1e2a', hemi: 1.05, sun: '#ff8a4a', sunI: 2.4, fog: '#b0605a', fogNear: 6, fogFar: 80, skyTop: '#2a2c6e', skyHor: '#ff8f52', sat: 1.2, vig: 0.34, shadowExt: 14, sunDisc: '#ffd28a', sunSize: 0.012, gain: '#f2e6ff' },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });
// ---------- cameras ----------
const AX = (f) => MX - 1.6 + clamp(f / 140) * 1.9;               // walking zombie ant (opening + loop)
const CL = (f) => clamp((f - 626) / 64);                        // climb progress
const CLY = (f) => lerp(1.5, 24.2, E.smooth(CL(f)));
const UL = [ST[0] + 0.2, 25.42, ST[2] + 6.2];                     // bite spot under the leaf
const CAMS = {
  abre: [{ f: 0, pos: [MX - 0.9, 0.42, 3.0], look: [MX - 0.4, 0.42, 0], fov: 40 }, { f: 69, pos: [MX - 0.3, 0.44, 2.6], look: [MX + 0.1, 0.42, 0], fov: 38 }],
  fungo: [{ f: 70, pos: [MX + 0.75, 0.62, 1.7], look: [MX + 0.45, 0.42, 0], fov: 32 }, { f: 144, pos: [MX + 0.7, 0.6, 1.35], look: [MX + 0.45, 0.42, 0], fov: 30 }],
  floresta: [{ f: 145, pos: [7, 6, 15], look: [0, 3.5, -6], fov: 56 }, { f: 189, pos: [5, 4.4, 11.5], look: [0, 3, -6], fov: 54 }],
  pisa: [{ f: 190, pos: [MX - 0.6, 0.7, 3.6], look: [MX - 0.3, 0.35, 0], fov: 42 }, { f: 316, pos: [MX - 0.1, 0.55, 2.6], look: [MX + 0.1, 0.35, 0], fov: 38 }],
  dentro: [{ f: 317, pos: [MX + 0.3, 0.56, 2.2], look: [MX + 0.1, 0.42, 0], fov: 36 }, { f: 424, pos: [MX + 0.25, 0.5, 1.8], look: [MX + 0.1, 0.42, 0], fov: 34 }],
  trilha: [{ f: 425, pos: [MX, 1.2, 6.0], look: [MX, 0.4, 0], fov: 46 }, { f: 500, pos: [MX + 0.6, 1.0, 5.2], look: [MX + 0.6, 0.4, 0], fov: 44 }],
  treme: [{ f: 501, pos: [MX + 0.6, 0.5, 2.6], look: [MX + 0.3, 0.42, 0], fov: 38 }, { f: 567, pos: [MX + 0.5, 0.48, 2.2], look: [MX + 0.3, 0.42, 0], fov: 36 }],
  sinistra: [{ f: 568, pos: [0.3, 1.6, 2.6], look: [0, 1.45, 0], fov: 38 }, { f: 625, pos: [0.25, 1.58, 2.2], look: [0, 1.45, 0], fov: 36 }],
  regua: [{ f: 690, pos: [ST[0] + 3, 15, ST[2] + 40], look: [ST[0] - 1, 13, ST[2]], fov: 46 }, { f: 729, pos: [ST[0] + 3, 15, ST[2] + 36], look: [ST[0] - 1, 13.5, ST[2]], fov: 45 }],
  sol: [{ f: 730, pos: [ST[0] + 2, 17, ST[2] + 16], look: [ST[0] + 1, 26, ST[2] + 6], fov: 56 }, { f: 790, pos: [ST[0] + 2, 18.5, ST[2] + 14], look: [ST[0] + 1, 26, ST[2] + 6], fov: 54 }],
  morde: [{ f: 791, pos: [UL[0] + 2.4, UL[1] - 1.5, UL[2] + 0.8], look: [UL[0] + 0.2, UL[1] - 0.5, UL[2]], fov: 40 }, { f: 917, pos: [UL[0] + 2.0, UL[1] - 1.3, UL[2] + 0.7], look: [UL[0] + 0.3, UL[1] - 0.5, UL[2]], fov: 37 }],
  solta: [{ f: 918, pos: [UL[0] + 1.25, UL[1] - 0.75, UL[2] + 0.45], look: [UL[0] + 0.45, UL[1] - 0.45, UL[2]], fov: 30 }, { f: 977, pos: [UL[0] + 1.1, UL[1] - 0.7, UL[2] + 0.4], look: [UL[0] + 0.45, UL[1] - 0.45, UL[2]], fov: 28 }],
  umido: [{ f: 978, pos: [UL[0] + 5, UL[1] - 3.2, UL[2] + 6], look: [UL[0], UL[1] - 0.4, UL[2]], fov: 46 }, { f: 1098, pos: [UL[0] + 3.6, UL[1] - 2.4, UL[2] + 4.2], look: [UL[0], UL[1] - 0.4, UL[2]], fov: 44 }],
  haste: [{ f: 1099, pos: [UL[0] + 2.6, UL[1] - 1.9, UL[2] + 1.2], look: [UL[0] + 0.2, UL[1] - 0.9, UL[2]], fov: 42 }, { f: 1200, pos: [UL[0] + 2.3, UL[1] - 1.8, UL[2] + 1.0], look: [UL[0] + 0.2, UL[1] - 1.0, UL[2]], fov: 40 }],
  chuva: [{ f: 1201, pos: [ST[0] + 12, 7, ST[2] + 26], look: [ST[0], 11, ST[2] + 5], fov: 56 }, { f: 1272, pos: [ST[0] + 10, 6, ST[2] + 22], look: [ST[0], 10, ST[2] + 5], fov: 54 }],
  zumbi: [{ f: 1273, pos: [MX - 4.2, 0.35, 3.2], look: [MX - 1.5, 0.55, -2], fov: 50 }, { f: 1397, pos: [MX - 3.4, 0.3, 2.6], look: [MX - 1.2, 0.6, -2], fov: 48 }],
  voce: [{ f: 1398, pos: [0.22, 1.55, 2.1], look: [0, 1.5, 0], fov: 34 }, { f: 1482, pos: [0.2, 1.55, 1.7], look: [0, 1.5, 0], fov: 32 }],
  nao: [{ f: 1483, pos: [1.0, 1.5, 3.6], look: [0, 1.2, 0], fov: 44 }, { f: 1560, pos: [0.8, 1.5, 3.2], look: [0, 1.25, 0], fov: 42 }],
  especie: [{ f: 1561, pos: [-0.8, 1.45, 2.8], look: [0, 1.35, 0], fov: 40 }, { f: 1620, pos: [-0.6, 1.45, 2.5], look: [0, 1.35, 0], fov: 38 }],
  quente: [{ f: 1621, pos: [0.9, 1.5, 3.2], look: [0.45, 1.35, 0], fov: 42 }, { f: 1683, pos: [0.8, 1.5, 2.9], look: [0.45, 1.35, 0], fov: 40 }],
  alivio: [{ f: 1684, pos: [2.2, 1.9, 6.4], look: [0, 1.4, 0], fov: 46 }, { f: 1760, pos: [1.6, 1.7, 5.0], look: [0, 1.35, 0], fov: 44 }],
  chao: [{ f: 1761, pos: [0.35, 1.3, 1.1], look: [0.35, 0.02, 0.75], fov: 44 }, { f: 1813, pos: [0.35, 1.0, 1.0], look: [0.4, 0.02, 0.75], fov: 40 }],
  repara: [{ f: 1814, pos: [0.3, 1.55, 2.4], look: [0, 1.4, 0], fov: 38 }, { f: 1860, pos: [0.24, 1.5, 1.8], look: [0, 1.4, 0], fov: 34 }],
  loop: [{ f: 1861, pos: [MX - 0.9, 0.42, 3.0], look: [MX - 0.4, 0.42, 0], fov: 40 }, { f: 1900, pos: [MX - 0.75, 0.42, 2.9], look: [MX - 0.3, 0.42, 0], fov: 40 }],
};
const KICKS = [{ f: 395, a: 0.05 }, { f: 866, a: 0.07 }, { f: 1145, a: 0.05 }, { f: 1458, a: 0.06 }, { f: 1484, a: 0.05 }];
export const camAt = (f) => { const S = shotAt(f);
  if (S.id === 'sobe') { const y = CLY(f); const c = camFromKeys([{ f: 626, pos: [ST[0] + 0.4, y + 1.4, ST[2] + 4.2], look: [ST[0], y + 0.3, ST[2] + 0.4], fov: 44 }], f, { kicks: KICKS }); c.shadowAt = [ST[0], y, ST[2]]; return c; }
  if (S.id === 'abre' || S.id === 'loop') { const g = S.id === 'loop' ? f - 1861 : f, x = AX(g), z = lerp(2.8, 2.3, clamp(g / 69)); const c = camFromKeys([{ f: 0, pos: [x + 0.35, 0.45, z], look: [x + 0.15, 0.36, 0], fov: 40 }], f, { kicks: KICKS }); c.shadowAt = c.look; return c; }
  const c = camFromKeys(CAMS[S.id], f, { kicks: KICKS }); c.shadowAt = c.look; return c; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shotAt(f), C = camAt(f); if (['floresta', 'regua', 'chuva', 'alivio'].includes(S.id)) return { focus: dist(C.pos, C.look), cinf: 3 }; return { focus: dist(C.pos, C.look), cinf: S.light === 'jungle' ? 8 : 14 }; };
export const worldAt = (f) => { const S = shotAt(f); return { noClouds: S.light !== 'jungle', ruler: ['sobe', 'regua'].includes(S.id) }; };
// ---------- actors ----------
const base = (f, seed) => { const i = idle(f, seed); return { seed, bob: q(i.bob, 4), tilt: q(i.tilt, 2), headTilt: q(i.headTilt, 2), blink: blinkAt(f, seed) }; };
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const ANT = (T, o, pos, extra = {}) => ({ key: 'ant' + JSON.stringify(o), draw: (p) => T.fxAnt(p, o), x: pos[0], y: pos[1], z: pos[2], s: extra.s ?? 1, blob: extra.blob ?? true, ...extra });
// Tonico never freezes: alternate arms / expressions every ~0.6 s inside each shot
const TON = (T, f, expr, arms, pos, extra = {}) => { const k = Math.floor(f / 18) % arms.length, ex = Array.isArray(expr) ? expr[Math.floor(f / 26) % expr.length] : expr;
  return R(T, 'explorador', { ...base(f, 4), expr: ex, L: arms[k][0], R: arms[k][1], holdR: arms[k][2], facing: arms[k][3] ?? 0, look: arms[k][4] ?? 0 }, pos, extra); };
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = []; const push = (a) => out.push(a);
  const wph = (sp = 1) => q((f * 0.09 * sp) % 1, 2);
  switch (id) {
    case 'abre': case 'loop': { const g = id === 'loop' ? f - 1861 : f; push(ANT(T, { walk: wph(), zombie: 1, veins: 0.5, shake: q(Math.sin(f * 1.7) * 3, 0), spin: q(f * 0.2, 1) }, [AX(g), 0, 0])); break; }
    case 'fungo': push(ANT(T, { walk: q(((f - 70) * 0.03) % 1, 2), zombie: 1, veins: q(0.5 + ramp(f, 70, 130) * 0.5, 2), shake: q(Math.sin(f * 1.7) * 3, 0), spin: q(f * 0.2, 1) }, [MX + 0.1, 0, 0])); break;
    case 'floresta': push(TON(T, f, ['smile', 'excited'], [['hang', 'reach', 'lupa', 1, 0.4], ['hip', 'reach', 'lupa', 1, 0.5]], [0, 0, 0])); break;
    case 'pisa': { const x = lerp(MX - 1.8, MX - 0.15, clamp((f - 190) / 70)), wk = f < 262 ? wph() : 0; push(ANT(T, { walk: wk, look: f > 262 ? -0.4 : 0.6 }, [x, 0, 0]));
      push({ key: 'spore' + (f % 8), draw: (p) => T.fxSpore(p, f % 8), x: MX + 0.12, y: 0, z: 0.05, s: 0.12, blob: false, shadow: false, order: 5 }); break; }
    case 'dentro': push(ANT(T, { veins: q(ramp(f, 330, 410), 2), look: 0.2 + 0.4 * Math.sin(f * 0.1), shake: f > 395 ? q(Math.sin(f * 2.1) * 2, 0) : 0 }, [MX - 0.15, 0, 0])); break;
    case 'trilha': for (let i = 0; i < 6; i++) { const x = MX - 3 + i * 0.95 + (f - 425) * 0.012; push(ANT(T, { walk: q((f * 0.09 + i * 0.17) % 1, 2) }, [x, 0, -0.6 + (i % 2) * 0.3])); }
      push(ANT(T, { walk: q(f * 0.05 % 1, 2), zombie: 0.6, spiral: 1, spin: q(f * 0.2, 1), shake: q(Math.sin(f * 1.9) * 4, 0) }, [MX + 0.9 - (f - 425) * 0.004, 0, 0.6], { flip: true })); break;
    case 'treme': push(ANT(T, { walk: q(f * 0.04 % 1, 2), zombie: 0.8, veins: 0.8, spiral: 1, spin: q(f * 0.25, 1), shake: q(Math.sin(f * 2.3) * 6, 0) }, [MX + 0.2 + Math.sin(f * 0.05) * 0.2, 0, 0], { flip: Math.sin(f * 0.05) < 0 })); break;
    case 'sinistra': push(TON(T, f, ['scared', 'terrified', 'shock'], [['cheek', 'hang', 'lupa'], ['cheek', 'cheek'], ['hang', 'reach', 'lupa']], [0, 0, 0])); break;
    case 'sobe': push(ANT(T, { walk: wph(1.4), zombie: 1, veins: 1, spiral: 1, spin: q(f * 0.2, 1) }, [ST[0] - 0.1, CLY(f) - 0.55, ST[2] + 0.42], { face: 'cam', roll: Math.PI / 2, blob: false })); break;
    case 'regua': push(ANT(T, { walk: 0, zombie: 1, veins: 1, spiral: 1 }, [ST[0] - 0.1, 24.0, ST[2] + 0.42], { face: 'cam', roll: Math.PI / 2, blob: false, s: 1.6 })); break;
    case 'sol': push(ANT(T, { walk: wph(), zombie: 1, veins: 1, spiral: 1, spin: q(f * 0.2, 1) }, [UL[0], UL[1], lerp(ST[2] + 1, UL[2], clamp((f - 730) / 60))], { face: 'cam', roll: Math.PI, blob: false, s: 1.4 })); break;
    case 'morde': case 'solta': case 'umido': case 'haste': { const bite = f >= 866 ? 1 : 0; const st = id === 'haste' ? q(E.smooth(ramp(f, 1110, 1190)), 2) : 0;
      push(ANT(T, { bite, zombie: 1, veins: 1, spiral: 1, spin: f < 866 ? q(f * 0.2, 1) : 0, stalk: st, shake: f < 866 ? q(Math.sin(f * 1.5) * 3, 0) : 0, walk: f < 850 ? wph() : 0 }, UL, { face: 'cam', roll: Math.PI, blob: false })); break; }
    case 'chuva': push(ANT(T, { bite: 1, zombie: 1, veins: 1, spiral: 1, stalk: 1 }, UL, { face: 'cam', roll: Math.PI, blob: false, s: 1.6 }));
      for (let i = 0; i < 5; i++) push(ANT(T, { walk: q((f * 0.09 + i * 0.2) % 1, 2) }, [ST[0] - 4 + i * 2 + (f - 1201) * 0.02, 0, ST[2] + 6 + (i % 2) * 2], { s: 1.6 }));
      push({ key: 'spores' + (f % 120), draw: (p) => T.fxSpores(p, f % 120), x: ST[0], y: 1, z: ST[2] + 6, s: 9, blob: false, shadow: false, order: 6 }); break;
    case 'zumbi': for (let i = 0; i < 9; i++) { const r = i % 3, c = Math.floor(i / 3); push(ANT(T, { walk: q((f * 0.05 + i * 0.13) % 1, 2), zombie: 1, veins: 0.7, spiral: 1, spin: q(f * 0.15 + i, 1), shake: q(Math.sin(f * 1.3 + i) * 4, 0) },
        [MX + 1.5 - c * 1.6 - (f - 1273) * 0.006 + r * 0.4, 0, -1.2 - r * 1.3], { flip: true })); } break;
    case 'voce': push(TON(T, f, ['terrified', 'scared'], [['cheek', 'point'], ['cheek', 'point'], ['cheek', 'cheek']], [0, 0, 0])); break;
    case 'nao': push(TON(T, f, ['smile', 'laugh', 'smug'], [['hip', 'point'], ['up', 'hip'], ['hip', 'thumb']], [0, 0, 0])); break;
    case 'especie': push(TON(T, f, ['determined', 'smile'], [['hip', 'reach', 'lupa', 1, 0.4], ['point', 'reach', 'lupa', 1, 0.4]], [0, 0, 0])); break;
    case 'quente': push(TON(T, f, ['excited', 'smile'], [['hip', 'point', null, -1, -0.5], ['up', 'point', null, -1, -0.5]], [0, 0, 0]));
      push({ key: 'th' + q(ramp(f, 1625, 1660), 2), draw: (p) => T.fxThermo(p, E.easeOut(ramp(f, 1625, 1660))), x: 0.95, y: 0.5, z: 0.1, s: 0.75, blob: false, shadow: false, order: 5 }); break;
    case 'alivio': push(TON(T, f, ['relief', 'smile'], [['belly', 'hang'], ['hang', 'reach', 'lupa'], ['hip', 'hang']], [0, 0, 0])); break;
    case 'chao': push(TON(T, f, 'confused', [['hang', 'hang']], [0, 0, 0])); push(ANT(T, { walk: wph(), zombie: 1, spiral: 1, spin: q(f * 0.2, 1) }, [0.1 + (f - 1761) * 0.006, 0, 0.75], { s: 0.07, blob: false })); break;
    case 'repara': push(TON(T, f, ['confused', 'surprised'], [['temple', 'reach', 'lupa', 0, 0.2], ['hang', 'reach', 'lupa', 0, 0.2]], [0, 0, 0])); break;
  }
  return out;
};
export const fxAt = (f, T) => [];
