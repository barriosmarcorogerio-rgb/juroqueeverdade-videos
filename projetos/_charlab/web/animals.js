// Bichos redesenhados (mesmo acabamento dos personagens): formas fundidas num contorno único, sombreado, olhos com brilho.
// Espaço do cartão: x -200..800 (centro 300), y 0..1000, pés em ~975. Todos olham para a DIREITA (use flip no cartão para virar).
import { INK, mul, mix } from './toon.js';
const LIGHT = -2.094, TH = Math.atan2(-Math.sin(LIGHT) + 0.8, -Math.cos(LIGHT));
const ellP = (cx, cy, a, b, rot = 0, n = 44) => { const c = Math.cos(rot), s = Math.sin(rot), o = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, x = Math.cos(t) * a, y = Math.sin(t) * b; o.push([cx + x * c - y * s, cy + x * s + y * c]); } return o; };
const ext = (pts) => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return Math.max(x1 - x0, y1 - y0) / 2; };
/** tapered limb/neck polygon along a polyline, width w0 -> w1 */
const taper = (pts, w0, w1, n = 16) => {
  const P = []; for (let i = 0; i <= n; i++) { const t = i / n, k = t * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(k)), u = k - j; P.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]); }
  const L = [], R = []; P.forEach((q, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let nx = b[1] - a[1], ny = a[0] - b[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; const w = (w0 + (w1 - w0) * i / n) / 2; L.push([q[0] + nx * w, q[1] + ny * w]); R.push([q[0] - nx * w, q[1] - ny * w]); });
  return [...L, ...R.reverse()];
};
/** draw a group of overlapping shapes as ONE silhouette: all ink first, then all fills */
const group = (p, shapes, w = 9) => { for (const s of shapes) if (!s.noInk) p.inkRing(s.pts, s.w ?? w, TH); for (const s of shapes) { const R = s.R || ext(s.pts); if (s.flat) p.poly(s.pts, s.col, 0); else p.shadedFill(s.pts, s.col, s.shadow || mul(s.col, [0.76, 0.72, 0.8]), LIGHT, R, 0.35); } };
const eyeBig = (p, x, y, r, o = {}) => { p.ell(x, y, r, r * 1.05, '#ffffff', 4.5); const lx = (o.look || 0) * r * 0.3; p.ell(x + lx + r * 0.15, y + r * 0.12, r * 0.52, r * 0.58, o.iris || '#2a1a14', 0); p.dot(x + lx + r * 0.32, y - r * 0.12, r * 0.18, '#ffffff');
  if (o.lid) { p.clip(ellP(x, y, r * 1.02, r * 1.07), () => p.poly([[x - r * 1.2, y - r * 1.2], [x + r * 1.2, y - r * 1.2], [x + r * 1.2, y - r * 1.2 + o.lid * 2.1 * r], [x - r * 1.2, y - r * 1.2 + o.lid * 2.1 * r]], o.skin, 0)); p.stroke([[x - r * 0.98, y - r * 1.05 + o.lid * 2.1 * r], [x + r * 0.98, y - r * 1.05 + o.lid * 2.1 * r]], 4); p.ell(x, y, r, r * 1.05, null, 4.5); }
  if (o.lashes) for (let k = 0; k < 3; k++) { const a = -Math.PI * (0.25 + k * 0.17); p.stroke([[x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.4]], 3.5); } };
const hoof = (p, x, y, w, col = '#3a2a22') => { p.poly([[x - w, y - w * 0.9], [x + w, y - w * 0.9], [x + w * 1.1, y], [x - w * 1.1, y]], col, 5); };

/** CAMELO (dromedário). o: {walk, lie, spit, chew, hat, mule, bandage, look, blink, mouth, wide} */
export const fxCamel = (p, o = {}) => {
  const mule = !!o.mule, C = mule ? '#9a948c' : '#d8ad6c', C2 = mule ? '#7a746e' : '#bb8a4c', BELLY = mule ? '#c2bcb4' : '#efd3a0', lie = o.lie || 0, w = o.walk || 0;
  const by = 590 + lie * 210, bx = 230;
  // far legs (darker), drawn first
  const NEAR = [], FEET = []; const leg = (x, ph, far) => { const col = far ? C2 : C; if (lie > 0.5) { const pts = taper([[x, by + 40], [x + 60, by + 95], [x - 20, by + 115]], 34, 26); if (far) { group(p, [{ pts, col }], 7); p.ell(x - 22, by + 115, 18, 12, '#6a5040', 5); } else { NEAR.push({ pts, col }); FEET.push(() => p.ell(x - 22, by + 115, 18, 12, '#6a5040', 5)); } return; }
    const sw = Math.sin((w + ph) * Math.PI * 2) * 28 * (1 - lie), kx = x + sw * 0.5, ky = by + 190, fx = x + sw, fy = 972;
    const pts = taper([[x, by + 30], [x + 4, by + 110], [kx, ky], [fx, fy - 20]], 46, 22); if (far) { group(p, [{ pts, col }, { pts: ellP(kx, ky, 17, 16), col }], 7); hoof(p, fx, fy, 20, '#6a5040'); } else { NEAR.push({ pts, col }, { pts: ellP(kx, ky, 17, 16), col }); FEET.push(() => hoof(p, fx, fy, 20, '#6a5040')); } };
  leg(bx - 120, 0.5, true); leg(bx + 105, 0, true);
  // tail
  p.band([[bx - 185, by - 30], [bx - 210, by + 40], [bx - 200, by + 110]], C2, 12, 4, 'round'); p.ell(bx - 200, by + 118, 10, 18, mul(C2, [0.7, 0.7, 0.7]), 4);
  // body + hump + neck + head as one silhouette
  const neck = mule ? taper([[bx + 150, by - 40], [bx + 210, by - 110], [bx + 245, by - 150]], 110, 70) : taper([[bx + 150, by - 20], [bx + 230, by - 80], [bx + 250, by - 190], [bx + 280, by - 255]], 100, 62);
  const hx = mule ? bx + 285 : bx + 320, hy = mule ? by - 185 : by - 290 + lie * 30;
  const shapes = [{ pts: ellP(bx, by, 195, 100), col: C }, { pts: neck, col: C }, { pts: ellP(hx, hy, 74, 44, -0.12), col: C }, { pts: ellP(hx + 62, hy + 16, 38, 32), col: mix(C, '#ffffff', 0.25) }];
  if (!mule) shapes.push({ pts: ellP(bx - 15, by - 85, 112, 100), col: C, shadow: C2 });
  leg(bx - 95, 0, false); leg(bx + 125, 0.5, false);
  group(p, [...NEAR, ...shapes], 10); FEET.forEach((fn) => fn());
  p.clip(ellP(bx, by, 195, 100), () => p.ell(bx + 10, by + 70, 150, 50, BELLY, 0));
  if (!mule) for (let k = 0; k < 7; k++) p.stroke([[bx - 70 + k * 22, by - 172 + Math.abs(k - 3) * 6], [bx - 64 + k * 22, by - 192 + Math.abs(k - 3) * 6]], 4, C2);
  if (mule) { p.band([[bx + 140, by - 70], [bx + 220, by - 150], [hx - 30, hy - 30]], '#4a4440', 18, 3, 'round'); for (const sd of [-1, 1]) group(p, [{ pts: taper([[hx - 30 + sd * 10, hy - 30], [hx - 50 + sd * 18, hy - 120]], 30, 10), col: C }], 6); }
  else for (const sd of [-1, 1]) group(p, [{ pts: ellP(hx - 42 + sd * 10, hy - 40, 12, 20, -0.2), col: C }], 5);
  if (o.bandage && lie < 0.5) { p.poly([[bx - 120, by + 150], [bx - 70, by + 150], [bx - 72, by + 200], [bx - 118, by + 200]], '#f6f3ec', 5); p.stroke([[bx - 112, by + 168], [bx - 80, by + 180]], 5, '#d24a3a'); }
  if (o.bandage && lie >= 0.5) { p.ell(bx - 115, by + 112, 34, 16, '#f6f3ec', 5); p.stroke([[bx - 130, by + 112], [bx - 100, by + 112]], 5, '#d24a3a'); }
  // face
  eyeBig(p, hx + 2, hy - 8, 17, { look: o.look || 0.5, lid: o.blink ? 1 : (o.wide ? 0 : 0.45), skin: C, lashes: !mule });
  p.stroke([[hx + 88, hy + 4], [hx + 96, hy + 12]], 5);
  const my = hy + 34, mo = o.spit ? 1 : (o.mouth || 0), ch = o.chew ? 5 * Math.sin(o.chew) : 0;
  if (mo > 0) { p.ell(hx + 72, my + 8, 26, 9 + 13 * mo, '#7a2e34', 5); p.ell(hx + 74, my - 2, 30, 8, mix(C, '#ffffff', 0.25), 4, 180, 360); }
  else { p.stroke([[hx + 44, my + 2], [hx + 70, my + 10 + ch], [hx + 98, my + 2]], 5); p.ell(hx + 68, my + 16 + ch, 22, 8, mix(C, '#ffffff', 0.2), 4, 0, 180); }
  if (o.hat) { const g = p.g; g.save(); g.translate(hx + 95, my + 6); g.rotate(-0.3); p.ell(0, 0, 72, 18, '#5a3a22', 7); p.ell(0, -22, 40, 30, '#5a3a22', 7, 180, 360); p.stroke([[-38, -6], [38, -6]], 7, '#c9a24a'); g.restore(); }
};
/** GIRAFA (lado direito) */
export const fxGiraffe = (p, o = {}) => {
  const Y = '#efbe55', S = '#a8682a', w = o.walk || 0, bx = 250, by = 650;
  const NEAR = []; const leg = (x, ph, far) => { const sw = Math.sin((w + ph) * Math.PI * 2) * 20; const pts = taper([[x, by + 20], [x + sw * 0.4, by + 170], [x + sw, 955]], 34, 18); const sh = [{ pts, col: far ? mul(Y, [0.85, 0.82, 0.8]) : Y }, { pts: ellP(x + sw * 0.4, by + 170, 13, 12), col: far ? mul(Y, [0.85, 0.82, 0.8]) : Y }]; if (far) group(p, sh, 6); else NEAR.push(...sh); hoof(p, x + sw, 972, 14); };
  leg(bx - 85, 0.5, true); leg(bx + 80, 0, true);
  const neck = taper([[bx + 95, by - 20], [bx + 140, by - 200], [bx + 170, by - 400], [bx + 185, by - 470]], 92, 46);
  const hx = bx + 205, hy = by - 495;
  const body = ellP(bx, by, 145, 82, -0.08);
  leg(bx - 60, 0, false); leg(bx + 105, 0.5, false);
  group(p, [...NEAR, { pts: body, col: Y }, { pts: neck, col: Y }, { pts: ellP(hx, hy, 52, 32, 0.15), col: Y }, { pts: ellP(hx + 42, hy + 14, 26, 22), col: '#f6dc98' }], 9);
  const spots = (clipPts, x0, y0, x1, y1, seed) => p.clip(clipPts, () => { let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; for (let y = y0; y < y1; y += 46) for (let x = x0 + ((y / 46) % 2) * 22; x < x1; x += 50) { const pts = ellP(x + r() * 10, y + r() * 10, 17 + r() * 6, 14 + r() * 5, r() * 3, 7); p.poly(pts, S, 0); } });
  spots(body, bx - 150, by - 90, bx + 150, by + 90, 7); spots(neck, bx + 50, by - 480, bx + 230, by, 11);
  p.band([[bx + 75, by - 60], [bx + 110, by - 240], [bx + 140, by - 420], [hx - 30, hy - 10]], '#8a5422', 12, 3, 'round');
  for (const sd of [0, 1]) { p.band([[hx - 18 + sd * 20, hy - 26], [hx - 22 + sd * 22, hy - 62]], Y, 8, 3, 'round'); p.ell(hx - 22 + sd * 22, hy - 66, 9, 9, S, 4); }
  group(p, [{ pts: ellP(hx - 36, hy - 20, 18, 9, -0.6), col: Y }], 5);
  eyeBig(p, hx + 2, hy - 6, 11, { look: 0.5, lashes: true, lid: 0.25, skin: Y }); p.stroke([[hx + 56, hy + 6], [hx + 60, hy + 12]], 4); p.arc(hx + 46, hy + 24, 12, 5, 20, 160, 4);
  p.band([[bx - 140, by - 20], [bx - 160, by + 60], [bx - 150, by + 140]], Y, 8, 3, 'round'); p.ell(bx - 150, by + 150, 9, 16, '#5a3418', 4);
};
/** ELEFANTE (lado direito). t anima a orelha */
export const fxElephant = (p, t = 0) => {
  const G = '#9aa3ae', G2 = '#7d8693', bx = 250, by = 640;
  const NEAR = [], FEET = []; const leg = (x, far) => { const pts = taper([[x, by + 40], [x, 965]], 78, 70); if (far) group(p, [{ pts, col: G2 }], 8); else NEAR.push({ pts, col: G }); const toes = () => { for (let k = 0; k < 3; k++) p.ell(x - 22 + k * 22, 958, 9, 7, '#e8e2d4', 3); }; if (far) toes(); else FEET.push(toes); };
  leg(bx - 110, true); leg(bx + 90, true);
  const hx = bx + 175, hy = by - 95;
  const trunk = taper([[hx + 55, hy + 30], [hx + 95, hy + 120], [hx + 100, hy + 230], [hx + 80, hy + 300]], 64, 30);
  leg(bx - 70, false); leg(bx + 130, false);
  group(p, [...NEAR, { pts: ellP(bx, by, 190, 135, -0.05), col: G }, { pts: ellP(hx, hy, 105, 98), col: G }, { pts: trunk, col: G }], 10); FEET.forEach((fn) => fn());
  for (let k = 0; k < 6; k++) p.arc(hx + 92 - k * 1.5, hy + 110 + k * 28, 22, 6, 10, 170, 3, G2);
  p.poly(taper([[hx + 40, hy + 70], [hx + 90, hy + 95], [hx + 125, hy + 75]], 22, 6), '#f6f0e2', 5);
  const flap = Math.sin(t * 6) * 12;
  const ear = ellP(hx - 62, hy + 28, 66 + flap, 92, -0.1); group(p, [{ pts: ear, col: G }], 9); p.clip(ear, () => p.ell(hx - 56, hy + 32, 46 + flap, 70, '#d9a6a8', 0));
  eyeBig(p, hx + 40, hy - 20, 13, { look: 0.4, lid: 0.3, skin: G, lashes: true });
  p.band([[bx - 185, by - 20], [bx - 215, by + 60]], G, 10, 3, 'round'); p.ell(bx - 216, by + 68, 8, 14, '#4a4a4a', 3);
};
/** RATO (lado direito) */
export const fxRat = (p, t = 0) => {
  const G = '#9a9aa4', bx = 290, by = 905;
  p.band([[bx - 70, by + 10], [bx - 140, by + 30], [bx - 190, by - 10], [bx - 210, by - 60]], '#e6a8b4', 9, 3, 'round');
  group(p, [{ pts: ellP(bx, by, 78, 50, -0.05), col: G }, { pts: taper([[bx + 50, by - 10], [bx + 140, by + 12]], 66, 14), col: G }], 7);
  p.clip(ellP(bx, by, 78, 50, -0.05), () => p.ell(bx + 10, by + 34, 60, 20, '#d8d6dc', 0));
  group(p, [{ pts: ellP(bx + 52, by - 46, 22, 26, -0.3), col: G }], 6); p.ell(bx + 52, by - 46, 13, 16, '#e6a8b4', 0, 0, 360, -17);
  p.ell(bx + 144, by + 10, 9, 8, '#d0607a', 3); eyeBig(p, bx + 86, by - 8, 9, { look: 0.6 });
  for (const d of [-8, 0, 8]) p.stroke([[bx + 128, by + 14], [bx + 175, by + 6 + d * 2]], 2);
  for (const x of [bx - 40, bx + 30]) p.ell(x, by + 48, 16, 8, '#e6a8b4', 3);
};
/** VACA (lado direito) */
export const fxCow = (p) => {
  const W = '#f6f3ec', B = '#2a2622', bx = 260, by = 720;
  const NEAR = [], FEET = []; const leg = (x, far) => { const pts = taper([[x, by + 40], [x, 950]], 40, 30); if (far) group(p, [{ pts, col: '#dcd8d0' }], 7); else NEAR.push({ pts, col: W }); if (far) hoof(p, x, 972, 20); else FEET.push(() => hoof(p, x, 972, 20)); };
  leg(bx - 105, true); leg(bx + 95, true);
  const hx = bx + 205, hy = by - 70;
  const body = ellP(bx, by, 175, 95, -0.03);
  leg(bx - 75, false); leg(bx + 125, false);
  group(p, [...NEAR, { pts: body, col: W }, { pts: taper([[bx + 140, by - 30], [hx - 20, hy + 10]], 110, 80), col: W }, { pts: ellP(hx, hy, 62, 54), col: W }, { pts: ellP(hx + 40, hy + 34, 40, 30), col: '#f0b6b2' }], 9); FEET.forEach((fn) => fn());
  p.clip(body, () => { for (const [x, y, a, b] of [[bx - 80, by - 40, 60, 46], [bx + 50, by + 20, 44, 34], [bx - 10, by - 70, 30, 24], [bx + 120, by - 60, 30, 26]]) p.poly(ellP(x, y, a, b, 0.4, 12), B, 0); });
  p.poly(ellP(hx - 14, hy - 18, 26, 20, 0.3, 10), B, 0);
  for (const sd of [-1, 1]) { group(p, [{ pts: taper([[hx - 20 + sd * 22, hy - 44], [hx - 22 + sd * 38, hy - 82]], 14, 6), col: '#e8dcb8' }], 4); group(p, [{ pts: ellP(hx - 30 + sd * 46, hy - 30, 22, 12, sd * 0.4), col: W }], 5); }
  eyeBig(p, hx + 8, hy - 8, 11, { look: 0.5, lashes: true, lid: 0.2, skin: W }); for (const d of [-10, 10]) p.ell(hx + 52 + d * 0.4, hy + 36 + d, 5, 4, '#9a5a5a', 0);
  p.ell(bx + 20, by + 92, 40, 20, '#f0b6b2', 5);
  p.band([[bx - 172, by - 30], [bx - 196, by + 60], [bx - 188, by + 150]], W, 9, 3, 'round'); p.ell(bx - 188, by + 160, 11, 18, B, 4);
};
/** DINOSSAURO saurópode (lado direito) */
export const fxSauro = (p) => {
  const G = '#6fa35e', G2 = '#4f8040', bx = 250, by = 700;
  const NEAR = [], FEET = []; const leg = (x, far) => { const pts = taper([[x, by + 40], [x, 960]], 74, 64); if (far) group(p, [{ pts, col: G2 }], 8); else NEAR.push({ pts, col: G }); const toes = () => { for (let k = 0; k < 3; k++) p.ell(x - 22 + k * 22, 958, 8, 6, '#e8e2d4', 3); }; if (far) toes(); else FEET.push(toes); };
  leg(bx - 120, true); leg(bx + 100, true);
  const neck = taper([[bx + 140, by - 40], [bx + 230, by - 230], [bx + 280, by - 470], [bx + 300, by - 560]], 120, 46);
  const tail = taper([[bx - 160, by - 10], [bx - 260, by + 40], [bx - 340, by + 130], [bx - 380, by + 220]], 100, 10);
  const hx = bx + 320, hy = by - 580;
  leg(bx - 80, false); leg(bx + 140, false);
  group(p, [...NEAR, { pts: ellP(bx, by, 200, 120), col: G }, { pts: neck, col: G }, { pts: tail, col: G }, { pts: ellP(hx, hy, 50, 30, 0.1), col: G }], 10); FEET.forEach((fn) => fn());
  p.clip(ellP(bx, by, 200, 120), () => p.ell(bx, by + 80, 170, 50, '#a8cf8a', 0));
  for (let k = 0; k < 9; k++) p.ell(bx - 140 + k * 36, by - 110 + Math.abs(k - 4) * 6, 12, 8, G2, 0);
  eyeBig(p, hx + 6, hy - 6, 10, { look: 0.6 }); p.arc(hx + 32, hy + 12, 14, 5, 20, 160, 4);
};
/** URSO-POLAR (lado direito) */
export const fxBear = (p) => {
  const W = '#f4f6fa', S = '#c9d4e2', bx = 280, by = 700;
  const NEAR = [], FEET = []; const leg = (x, far) => { const pts = taper([[x, by + 40], [x, 950]], 72, 64); if (far) group(p, [{ pts, col: '#dde4ee', shadow: S }], 8); else NEAR.push({ pts, col: W, shadow: S }); const toes = () => { for (let k = 0; k < 3; k++) p.ell(x - 18 + k * 18 + 10, 960, 7, 6, '#2a2a30', 0); }; if (far) toes(); else FEET.push(toes); };
  leg(bx - 110, true); leg(bx + 95, true);
  const hx = bx + 220, hy = by - 60;
  leg(bx - 70, false); leg(bx + 135, false);
  group(p, [...NEAR, { pts: ellP(bx, by, 200, 125), col: W, shadow: S }, { pts: ellP(bx - 150, by - 40, 60, 60), col: W, shadow: S }, { pts: ellP(hx, hy, 80, 70), col: W, shadow: S }, { pts: ellP(hx + 70, hy + 22, 42, 30), col: W, shadow: S }], 10); FEET.forEach((fn) => fn());
  for (const sd of [-1, 1]) { group(p, [{ pts: ellP(hx - 30 + sd * 34, hy - 64, 20, 18), col: W, shadow: S }], 6); p.ell(hx - 30 + sd * 34, hy - 64, 9, 8, '#c8b8c0', 0); }
  p.ell(hx + 108, hy + 16, 14, 11, '#1a1a1e', 4); p.stroke([[hx + 100, hy + 34], [hx + 86, hy + 44]], 4); eyeBig(p, hx + 26, hy - 14, 11, { look: 0.6 });
};
/** URUBU (de frente, asas abertas). flap -1..1, scare 0/1, open 0..1 */
export const fxVulture = (p, flap = 0, scare = 0, open = 0, look = 0) => {
  const BLK = '#2c2428', BLK2 = '#40363a', cx = 300, cy = 520, a = flap * 0.75;
  for (const s of [-1, 1]) {
    const base = [[cx + s * 40, cy - 30], [cx + s * 160, cy - 80 - 90 * a], [cx + s * 270, cy - 60 - 170 * a]], tipY = cy - 60 - 170 * a;
    const wing = [[cx + s * 40, cy - 30], [cx + s * 160, cy - 85 - 90 * a], [cx + s * 285, tipY - 10]];
    for (let k = 0; k < 6; k++) { const fx = cx + s * (300 - k * 22), fy = tipY + 20 + k * 28 - 60 * a * (k / 6); wing.push([fx + s * 30, fy + 40], [fx, fy + 30]); }
    wing.push([cx + s * 120, cy + 70 - 40 * a], [cx + s * 40, cy + 40]);
    group(p, [{ pts: wing, col: BLK, shadow: '#1a1416' }], 8);
    for (let k = 0; k < 5; k++) p.stroke([[cx + s * (150 + k * 24), cy - 40 - (70 + k * 18) * a], [cx + s * (170 + k * 24), cy + 20 - (40 + k * 18) * a]], 4, '#5a5054');
  }
  group(p, [{ pts: ellP(cx, cy + 30, 78, 112), col: BLK2 }, { pts: [[cx - 40, cy + 120], [cx + 40, cy + 120], [cx + 22, cy + 192], [cx - 22, cy + 192]], col: BLK }], 9);
  for (const s of [-1, 1]) { p.band([[cx + s * 25, cy + 130], [cx + s * 32, cy + 178]], '#d9c9b0', 9, 3, 'round'); p.stroke([[cx + s * 32, cy + 180], [cx + s * 44, cy + 190]], 4); }
  for (let k = 0; k < 9; k++) { const t = k / 8; p.ell(cx - 66 + t * 132, cy - 72 + Math.sin(t * Math.PI) * -10, 20, 16, '#f2ebe2', 4); }
  const hx = cx + look * 14, hy = cy - 145 - (scare ? 25 : 0);
  group(p, [{ pts: taper([[cx, cy - 75], [hx, hy + 20]], 30, 22), col: '#c96a5e' }, { pts: ellP(hx, hy, 52, 46), col: '#d8705f' }], 8);
  for (let k = 0; k < 4; k++) p.arc(hx, hy - 30 + k * 8, 26 - k * 3, 6, 200, 340, 2.5, '#b0503f');
  const ey = hy - 10, er = scare ? 18 : 13;
  for (const s of [-1, 1]) { eyeBig(p, hx + s * 22, ey, er, { look: s * 0.2 + look, iris: '#1a1214', lid: scare ? 0 : 0.35, skin: '#d8705f' }); if (!scare) p.stroke([[hx + s * 8, ey - 20], [hx + s * 34, ey - 14]], 5, '#5a2a26'); }
  p.poly([[hx - 15, hy + 6], [hx + 15, hy + 6], [hx + 12, hy + 30 + open * 8], [hx + 2, hy + 48 + open * 10], [hx - 4, hy + 38], [hx - 12, hy + 30 + open * 8]], '#efe0b0', 5);
  p.stroke([[hx - 6, hy + 18], [hx + 6, hy + 18]], 3, '#b8a070');
  if (open) p.ell(hx, hy + 32, 9, 10 * open, '#7a1e28', 4);
  if (scare) for (let k = 0; k < 5; k++) { const ang = -Math.PI / 2 + (k - 2) * 0.35; p.stroke([[hx + Math.cos(ang) * 75, hy + Math.sin(ang) * 70], [hx + Math.cos(ang) * 105, hy + Math.sin(ang) * 100]], 7); }
};
