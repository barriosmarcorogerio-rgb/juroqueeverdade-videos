// Gigante redesenhado: corpo inteiro num contorno só (ombro, braço, perna fundidos ao tronco), anatomia esquisita.
import { mul, mix } from './toon.js';
const L = -2.094, TH = Math.atan2(-Math.sin(L) + 0.8, -Math.cos(L));
const E = (cx, cy, a, b, rot = 0, n = 44) => { const c = Math.cos(rot), s = Math.sin(rot), o = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, x = Math.cos(t) * a, y = Math.sin(t) * b; o.push([cx + x * c - y * s, cy + x * s + y * c]); } return o; };
const X = (pts) => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return Math.max(x1 - x0, y1 - y0) / 2; };
const TP = (pts, w0, w1, n = 18) => { const P = []; for (let i = 0; i <= n; i++) { const t = i / n, k = t * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(k)), u = k - j; P.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]); }
  const A = [], B = []; P.forEach((q, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let nx = b[1] - a[1], ny = a[0] - b[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; const w = (w0 + (w1 - w0) * i / n) / 2; A.push([q[0] + nx * w, q[1] + ny * w]); B.push([q[0] - nx * w, q[1] - ny * w]); }); return [...A, ...B.reverse()]; };
const G = (p, shapes, w = 9) => { for (const s of shapes) p.inkRing(s.pts, w, TH); for (const s of shapes) p.shadedFill(s.pts, s.col, s.sh || mul(s.col, [0.8, 0.7, 0.7]), L, s.R || X(s.pts), 0.35); };
const ARCH = {
  grin: { hip: 610, sh: 345, chestW: 150, waistW: 95, head: 140, hy: 210, legW: 64, armW: 52, armL: 1.12, belly: 0.3 },
  tiny: { hip: 590, sh: 330, chestW: 190, waistW: 150, head: 62, hy: 268, legW: 84, armW: 70, armL: 0.95, belly: 1.0 },
  long: { hip: 640, sh: 365, chestW: 128, waistW: 82, head: 112, hy: 220, legW: 54, armW: 44, armL: 1.38, belly: 0.1 },
};
/** o: {kind, skin, hair, walk 0..1, arms|armsL|armsR: hang|reach|up, look, mouth 0..1, dazed} */
export const fxGiant = (p, t = 0, o = {}) => {
  const A = ARCH[o.kind || 'grin'], kind = o.kind || 'grin', SK = o.skin || '#e6b08a', SD = mul(SK, [0.8, 0.68, 0.66]), DK = mul(SK, [0.58, 0.46, 0.44]), w = o.walk || 0, cx = 300, sole = 975;
  const shapes = [], after = [];
  // --- legs (hip -> knee -> ankle) ---
  for (const sd of [-1, 1]) { const ph = Math.sin((w + (sd > 0 ? 0.5 : 0)) * Math.PI * 2), hx = cx + sd * A.waistW * 0.55, kx = hx + sd * 14 + ph * 20, ky = (A.hip + sole) / 2 + 10 - Math.max(0, ph) * 24, ax = hx + sd * 6 + ph * 36, ay = sole - 30 - Math.max(0, ph) * 36;
    shapes.push({ pts: TP([[hx, A.hip - 30], [kx, ky]], A.legW * 1.15, A.legW * 0.75), col: SK }, { pts: E(kx, ky, A.legW * 0.46, A.legW * 0.42), col: SK }, { pts: TP([[kx, ky], [ax, ay]], A.legW * 0.72, A.legW * 0.5), col: SK },
      { pts: E(ax + sd * 24, ay + 18, A.legW * 0.85, A.legW * 0.34), col: SK });
    after.push(() => { p.arc(kx, ky + 4, A.legW * 0.3, 7, 200, 340, 3, DK); for (let k = 0; k < 4; k++) p.ell(ax + sd * (24 + A.legW * 0.6) - sd * k * 15, ay + 26, 6, 4, mix(SK, '#ffffff', 0.4), 2); }); }
  // --- torso: hunched chest, narrow waist, pot belly ---
  const tor = [], top = A.sh - 10, bot = A.hip + 10;
  for (let i = 0; i <= 24; i++) { const k = i / 24, y = top + (bot - top) * k, hw = k < 0.35 ? A.chestW * (0.82 + 0.18 * Math.sin(k / 0.35 * Math.PI / 2)) : A.chestW + (A.waistW - A.chestW) * ((k - 0.35) / 0.65) + A.belly * 40 * Math.sin((k - 0.35) / 0.65 * Math.PI); tor.push([cx + hw, y]); }
  for (let i = 24; i >= 0; i--) { const [x, y] = tor[i]; tor.push([2 * cx - x, y]); }
  shapes.push({ pts: tor, col: SK }, { pts: E(cx, A.hip - 10, A.waistW * 1.05, 60), col: SK });
  // --- shoulders + arms, merged with the torso ---
  for (const sd of [-1, 1]) {
    const sx = cx + sd * A.chestW * 0.86, sy = A.sh + 30, pose = (sd < 0 ? o.armsL : o.armsR) || o.arms || 'hang', Lr = (sole - A.sh) * 0.6 * A.armL, sw = Math.sin((w + (sd > 0 ? 0 : 0.5)) * Math.PI * 2) * 22;
    let ex, ey, hx, hy; if (pose === 'reach') { ex = sx + sd * Lr * 0.48; ey = sy - 6; hx = sx + sd * Lr * 0.95; hy = sy - 50; } else if (pose === 'up') { ex = sx + sd * 46; ey = sy - Lr * 0.46; hx = sx + sd * 80; hy = sy - Lr * 0.92; } else { ex = sx + sd * 36 + sw * 0.3; ey = sy + Lr * 0.48; hx = sx + sd * 26 + sw; hy = sy + Lr * 0.98; }
    shapes.push({ pts: E(sx - sd * 10, sy - 6, A.armW * 0.95, A.armW * 0.75), col: SK }, { pts: TP([[sx - sd * 14, sy - 4], [ex, ey]], A.armW * 1.05, A.armW * 0.62), col: SK }, { pts: E(ex, ey, A.armW * 0.36, A.armW * 0.34), col: SK },
      { pts: TP([[ex, ey], [hx, hy]], A.armW * 0.62, A.armW * 0.48), col: SK });
    const ang = Math.atan2(hy - ey, hx - ex), hr = A.armW * 0.62;
    shapes.push({ pts: E(hx + Math.cos(ang) * hr * 0.6, hy + Math.sin(ang) * hr * 0.6, hr, hr * 0.8, ang), col: SK });
    for (let k = 0; k < 4; k++) { const a = ang + (k - 1.5) * 0.32, bx = hx + Math.cos(ang) * hr * 1.1, by = hy + Math.sin(ang) * hr * 1.1; shapes.push({ pts: TP([[bx + Math.cos(a) * 4, by + Math.sin(a) * 4], [bx + Math.cos(a) * hr * 1.25, by + Math.sin(a) * hr * 1.25]], hr * 0.36, hr * 0.26), col: SK }); }
    shapes.push({ pts: TP([[hx - Math.cos(ang - sd * 1.6) * 0, hy], [hx + Math.cos(ang - sd * 1.4) * hr * 1.0, hy + Math.sin(ang - sd * 1.4) * hr * 1.0]], hr * 0.4, hr * 0.3), col: SK });
    after.push(() => { p.arc(ex, ey, A.armW * 0.26, 6, 20, 160, 3, DK); p.arc(sx - sd * 6, sy + 10, A.armW * 0.55, A.armW * 0.4, sd > 0 ? 200 : 200, 330, 3, SD); });
  }
  // neck
  shapes.push({ pts: TP([[cx + 2, A.sh + 30], [cx + 6, A.hy + A.head * 0.6]], kind === 'tiny' ? 64 : 52, kind === 'tiny' ? 54 : 40), col: SK });
  G(p, shapes, 10); after.forEach((fn) => fn());
  // anatomy: pecs, ribs, belly, navel
  for (const sd of [-1, 1]) p.arc(cx + sd * A.chestW * 0.42, A.sh + 70, A.chestW * 0.4, 26, sd > 0 ? 10 : 10, 170, 4, SD);
  for (let k = 0; k < 4; k++) for (const sd of [-1, 1]) p.arc(cx + sd * A.chestW * 0.5, A.sh + 120 + k * 24, A.chestW * 0.3, 10, 195, 300, 3.5, DK);
  p.stroke([[cx, A.sh + 40], [cx + 2, A.sh + 170]], 3, SD); p.ell(cx + 3, A.hip - 70, 6, 8, DK, 0); if (A.belly > 0.5) p.arc(cx, A.hip - 40, A.waistW * 0.9, 50, 20, 160, 3.5, SD);
  // --- head ---
  const hcx = cx + 8 + (o.look || 0) * 10, hcy = A.hy + (o.dazed ? 10 : 0), HR = A.head, ry = kind === 'long' ? 1.35 : 1.0;
  const head = E(hcx, hcy, HR, HR * ry); head.forEach((q) => { if (q[1] > hcy) q[0] = hcx + (q[0] - hcx) * (1 - 0.12 * (q[1] - hcy) / (HR * ry)); });
  G(p, [{ pts: E(hcx - HR * 0.98, hcy + 6, HR * 0.2, HR * 0.28), col: SK }, { pts: E(hcx + HR * 0.98, hcy + 6, HR * 0.2, HR * 0.28), col: SK }, { pts: head, col: SK }], 9);
  for (const sd of [-1, 1]) p.ell(hcx + sd * HR * 0.98, hcy + 6, HR * 0.09, HR * 0.15, SD, 0);
  if (kind !== 'tiny') for (let k = 0; k < 9; k++) { const a = Math.PI * (1.12 + k * 0.095); p.ell(hcx + Math.cos(a) * HR * 0.86, hcy + Math.sin(a) * HR * ry * 0.95, HR * 0.17, HR * 0.1, o.hair || '#4a3424', 4, 0, 360, a * 57.3 + 90); }
  // eyes: sunken, blank, tiny pupils
  const ey = hcy - HR * ry * 0.16, er = kind === 'tiny' ? HR * 0.3 : HR * 0.17;
  for (const sd of [-1, 1]) { const ex = hcx + sd * HR * 0.36; p.ell(ex, ey + 3, er * 1.35, er * 1.25, mix(SK, DK, 0.55), 0); p.ell(ex, ey, er, er * 0.95, '#fbf7ee', 5);
    if (o.dazed) { const sp = []; for (let k = 0; k < 26; k++) { const a = k / 26 * 12, r = k / 26 * er * 0.8; sp.push([ex + Math.cos(a) * r, ey + Math.sin(a) * r]); } p.stroke(sp, 3); } else p.dot(ex + (o.look || 0) * er * 0.3, ey + 2, Math.max(4, er * 0.16)); }
  p.stroke([[hcx - 6, ey + er + 8], [hcx + 8, ey + er + 34], [hcx - 6, ey + er + 38]], 4, DK);
  // mouth: wide grin with gums + teeth
  const my = hcy + HR * ry * 0.42, mw = kind === 'tiny' ? HR * 0.5 : HR * 0.82, open = (o.mouth || 0) * 40;
  if (kind === 'tiny') { p.arc(hcx, my - 10, mw, 18, 15, 165, 5); p.arc(hcx, my - 4, mw * 0.6, 8, 30, 150, 3, DK); }
  else { const top = [], bt = []; for (let i = 0; i <= 22; i++) { const x = hcx - mw + i / 22 * mw * 2, k = (i / 22 - 0.5) * 2; top.push([x, my - 20 - k * k * 16]); bt.push([x, my + 24 + open - k * k * 28]); }
    const mp = [...top, ...bt.reverse()]; p.poly(mp, '#4a1420', 0);
    p.clip(mp, () => { p.poly(top.map(([x, y]) => [x, y - 2]).concat(top.slice().reverse().map(([x, y]) => [x, y + 9])), '#d06a78', 0); const nT = 14; for (let i = 0; i < nT; i++) { const x0 = hcx - mw + i / nT * mw * 2, k = ((i + 0.5) / nT - 0.5) * 2, yt = my - 12 - k * k * 16; p.poly([[x0 + 2, yt], [x0 + mw * 2 / nT - 2, yt], [x0 + mw * 2 / nT - 3, yt + 16 - k * k * 4], [x0 + 3, yt + 16 - k * k * 4]], '#fbf3dc', 1.6); } });
    p.poly(mp, null, 6); for (const sd of [-1, 1]) p.stroke([[hcx + sd * mw, my - 20 - 16], [hcx + sd * (mw + 16), my - 34 - 16]], 4, DK); }
};
