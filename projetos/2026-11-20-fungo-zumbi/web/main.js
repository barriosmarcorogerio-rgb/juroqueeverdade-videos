import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.15, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });
const M = {
  plank: texM(P.planks(1), 1, 6), beam: texM(P.beam(2), 1, 2), beamDark: texM(P.beam(3, [28, 36, 30]), 1, 2),
  rot: texM(P.rotten(4), 1, 1), rotB: texM(P.rotten(14), 1, 1),
  stone: texM(P.stone(4), 1, 1), stoneMoss: texM(P.mossy(P.stone(4), 5, 1.2), 1, 1),
  grass: texM(P.grass(6), 40, 40), dirt: texM(P.dirt(7), 6, 30), plaster: texM(P.plaster(8), 1, 1), plaster2: texM(P.plaster(18, 28), 1, 1),
  roof: texM(P.roof(9), 2, 2), marble: texM(P.marble(10), 1, 1), marbleTop: toon({ color: '#ece2cf' }),
  trunk: toon({ color: '#6a4a32' }), cypress: toon({ color: '#3f6b36' }), pine: toon({ color: '#5c8a3c' }), bush: toon({ color: '#6c9a42' }),
  hill: toon({ color: '#7aa64c' }), hillFar: toon({ color: '#86ad60' }), mount: toon({ color: '#8fa7b8' }), snow: toon({ color: '#f4f6fa' }),
  iron: toon({ color: '#5c5a57' }), bronze: toon({ color: '#b08a4a' }), wood: toon({ color: '#7a5434' }), door: toon({ color: '#5a3a24' }),
  window: toon({ color: '#2b2430' }), red: toon({ color: '#b8282b' }),
};
M.banner = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.banner()), alphaTest: 0.5, side: THREE.DoubleSide });
// helmet
const helmetIn = P.tex(P.helmetInside()); helmetIn.wrapS = helmetIn.wrapT = THREE.ClampToEdgeWrapping;
M.helmIn = new THREE.MeshToonMaterial({ gradientMap: grad, map: helmetIn, side: THREE.BackSide });
M.helmOut = toon({ color: '#8f8a7e' });

// ---------- ink / normal-depth contract ----------
const NOINK = 'noink'; // userData flag: never outlined (cards, fx, water handled specially)
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});
const waterNd = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,1.,.5,vD); }`,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);

// ---------- world ----------
// Floresta tropical (escala humana, origem) + set MACRO do chão da floresta (x = MX, 1 unidade = 1 cm).
const DECK = 0;
const world = new THREE.Group(); scene.add(world);
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, ...o });
const decal = (mat, k = 1) => { mat.polygonOffset = true; mat.polygonOffsetFactor = -k; mat.polygonOffsetUnits = -4 * k; return mat; };
const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const rr = P.rng(11);
const ndInst = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } }, defines: map ? { HASMAP: 1 } : {},
  vertexShader: `varying vec2 vUv; varying float vD;
    void main(){ vUv = uv; mat4 m = modelMatrix;
    #ifdef USE_INSTANCING
      m = m * instanceMatrix;
    #endif
    vec4 mv = viewMatrix * m * vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD;
    void main(){
    #ifdef HASMAP
      if (texture2D(map, vUv).a < .5) discard;
    #endif
    gl_FragColor = vec4(.5,.5,1.,vD); }`,
  side: THREE.DoubleSide,
});
const plainNd = ndInst(null);
const dummy = new THREE.Object3D();
// leaf texture (alpha), reused at every scale
const leafCanvas = (col, vein = '#cfe6a0', seed = 1) => cv(256, 512, (g, w, h) => { const r = P.rng(seed);
  g.beginPath(); g.moveTo(w / 2, 6); g.bezierCurveTo(w * 1.02, h * 0.25, w * 0.98, h * 0.7, w / 2, h - 4); g.bezierCurveTo(w * 0.02, h * 0.7, -w * 0.02, h * 0.25, w / 2, 6); g.closePath();
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, col); gr.addColorStop(0.5, P.shade ? col : col); gr.addColorStop(1, col); g.fillStyle = gr; g.fill();
  g.save(); g.clip(); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.06})`; g.fillRect(r() * w, r() * h, 6, 3); }
  g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(w / 2, 0, w / 2, h); g.restore();
  g.strokeStyle = vein; g.lineWidth = 7; g.beginPath(); g.moveTo(w / 2, 10); g.lineTo(w / 2, h - 8); g.stroke(); g.lineWidth = 3;
  for (let k = 1; k < 9; k++) { const y = h * k / 10; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(w / 2, y + 30); g.quadraticCurveTo(w / 2 + sd * w * 0.2, y + 6, w / 2 + sd * w * 0.42, y - 18); g.stroke(); } } });
const leafMat = (c) => { const t = P.tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; const m = std({ map: t, side: THREE.DoubleSide, alphaTest: 0.5, transparent: false }); return m; };
const LEAF = [leafCanvas('#3f8a3a', '#a8d080', 1), leafCanvas('#2f7a3a', '#9cc87a', 2), leafCanvas('#5a9a3e', '#c8e6a0', 3)];
const LEAFM = LEAF.map(leafMat);
const LEAFND = LEAF.map((c) => { const t = P.tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return ndInst(t); });
const dryLeaf = [leafCanvas('#9a6a3a', '#c89a6a', 4), leafCanvas('#7a4e2a', '#a87a4a', 5), leafCanvas('#b0823e', '#d6b07a', 6)];
const DRYM = dryLeaf.map(leafMat), DRYND = dryLeaf.map((c) => { const t = P.tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return ndInst(t); });
const leafGeo = new THREE.PlaneGeometry(0.5, 1); leafGeo.translate(0, 0.5, 0);
// instanced leaves helper: list of [x,y,z, rx,ry,rz, size]
const leafField = (list, mats, nds) => { mats.forEach((m, mi) => { const L = list.filter((_, i) => i % mats.length === mi); const im = new THREE.InstancedMesh(leafGeo, m, L.length);
  L.forEach(([x, y, z, a, b, c, s], k) => { dummy.position.set(x, y, z); dummy.rotation.set(a, b, c); dummy.scale.setScalar(s); dummy.updateMatrix(); im.setMatrixAt(k, dummy.matrix); });
  im.castShadow = true; im.receiveShadow = true; im.userData.nd = nds[mi]; world.add(im); }); };
// ===== FLORESTA (escala humana) =====
const soilC = cv(512, 512, (g, w, h) => { g.fillStyle = '#4a3a24'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = `hsl(${28 + rr() * 60},${30 + rr() * 30}%,${18 + rr() * 22}%)`; g.fillRect(rr() * w, rr() * h, 2 + rr() * 5, 1 + rr() * 3); } });
const ground = add(new THREE.PlaneGeometry(400, 400), std({ map: P.tex(soilC, 60, 60) }), 0, 0, 0, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
const barkC = cv(256, 512, (g, w, h) => { g.fillStyle = '#6a5440'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(40,28,18,${0.2 + rr() * 0.4})`; g.lineWidth = 2 + rr() * 4; const x = rr() * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (rr() - 0.5) * 30, h); g.stroke(); }
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(90,140,70,${rr() * 0.5})`; g.fillRect(rr() * w, rr() * h, 10 + rr() * 30, 6 + rr() * 20); } });
const barkM = std({ map: P.tex(barkC, 2, 3) });
const canopy = [];
const jtree = (x, z, s = 1) => { const h = (9 + rr() * 6) * s, r = (0.35 + rr() * 0.25) * s;
  add(new THREE.CylinderGeometry(r * 0.75, r * 1.25, h, 12), barkM, x, h / 2, z, world);
  for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28 + rr(), root = add(new THREE.ConeGeometry(r * 0.5, 1.8 * s, 5), barkM, x + Math.cos(a) * r, 0.5 * s, z + Math.sin(a) * r, world); root.rotation.z = Math.cos(a) * 0.9; root.rotation.x = -Math.sin(a) * 0.9; }
  for (let k = 0; k < 160; k++) { const a = rr() * 6.28, d = rr() * 4.2 * s, y = h - 1 + rr() * 3.5 * s - d * 0.3; canopy.push([x + Math.cos(a) * d, y, z + Math.sin(a) * d, rr() * 6, rr() * 6, rr() * 6, (1.6 + rr() * 1.4) * s]); } };
const TREES = [[-5, -6, 1.1], [6, -8, 1.2], [-11, 1, 1.0], [12, -1, 1.1], [2, -16, 1.3], [-16, -14, 1.2], [18, -15, 1.1], [-7, 10, 1.0], [9, 9, 0.9], [-22, 6, 1.2], [24, 4, 1.0]];
for (const [x, z, s] of TREES) jtree(x, z, s);
for (let i = 0; i < 40; i++) { const a = rr() * 6.28, d = 26 + rr() * 90; jtree(Math.cos(a) * d, Math.sin(a) * d, 0.9 + rr() * 0.6); }
leafField(canopy, LEAFM, LEAFND);
// undergrowth: ferns / big leaves near the ground
{ const L = []; for (let i = 0; i < 2600; i++) { const x = -30 + rr() * 60, z = -26 + rr() * 46; if (Math.hypot(x, z) < 2.2) continue; const n = 4 + Math.floor(rr() * 4);
    for (let k = 0; k < n; k++) { const a = k / n * 6.28 + rr(); L.push([x, 0, z, -0.9 - rr() * 0.4, a, 0, 0.5 + rr() * 0.6]); } } leafField(L, LEAFM, LEAFND); }
// dry leaf litter on the soil
{ const L = []; for (let i = 0; i < 3000; i++) { const x = -20 + rr() * 40, z = -18 + rr() * 30; L.push([x, 0.02, z, -Math.PI / 2 + (rr() - 0.5) * 0.2, 0, rr() * 6.28, 0.25 + rr() * 0.25]); } leafField(L, DRYM, DRYND); }
// hanging vines
const vineM = std({ color: '#4f6a2e' });
for (let i = 0; i < 26; i++) { const x = -14 + rr() * 28, z = -14 + rr() * 18, h = 4 + rr() * 6; const v = add(new THREE.CylinderGeometry(0.03, 0.03, h, 5), vineM, x, 14 - h / 2, z, world, { cast: false }); v.rotation.z = (rr() - 0.5) * 0.15; }
// light shafts are faked with fog colour; far hills of jungle
for (let i = 0; i < 14; i++) { const a = rr() * Math.PI * 2, d = 260 + rr() * 200; const h = add(new THREE.SphereGeometry(70 + rr() * 50, 18, 10), std({ color: i % 2 ? '#2f5a2e' : '#3a6a34' }), Math.cos(a) * d, -20, Math.sin(a) * d, world, { cast: false }); h.scale.y = 0.6; }
// ===== MACRO: chão da floresta visto do tamanho de uma formiga (x = MX) =====
const MX = 600;
const litC = cv(1024, 1024, (g, w, h) => { const r = P.rng(21); g.fillStyle = '#5a4026'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26000; i++) { g.fillStyle = `hsl(${24 + r() * 20},${30 + r() * 25}%,${16 + r() * 22}%)`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,140,60,${0.15 + r() * 0.2})`; g.beginPath(); g.arc(r() * w, r() * h, 10 + r() * 40, 0, 7); g.fill(); } });
const mground = add(new THREE.PlaneGeometry(400, 400), std({ map: P.tex(litC, 14, 14) }), MX, 0, 0, world, { cast: false }); mground.rotation.x = -Math.PI / 2;
// huge fallen leaves lying around (each ~10–20 cm)
{ const L = []; for (let i = 0; i < 160; i++) { const a = rr() * 6.28, d = 3 + rr() * 90, x = MX + Math.cos(a) * d, z = Math.sin(a) * d; const ly = 0.06 + rr() * 0.3, lt = (rr() - 0.5) * 0.3, lr = rr() * 6.28, ls = 10 + rr() * 12, rad = ls * 0.6 + 1;
    if (x > MX - 8 - rad && x < MX + 14 + rad && z > -6 - rad && z < 12 + rad) continue; L.push([x, ly, z, -Math.PI / 2 + lt, 0, lr, ls]); } leafField(L, DRYM, DRYND); }
// pebbles + twigs + moss (kept OUT of the action zone so nothing blocks the ants)
const CLEAR = (x, z, r = 0) => x > MX - 8 - r && x < MX + 14 + r && z > -6 - r && z < 12 + r;
const pebM = std({ color: '#8a7a68' }), twigM = std({ color: '#6a4a2e' }), mossM = std({ color: '#4f7a34' });
for (let i = 0; i < 70; i++) { const a = rr() * 6.28, d = 2.5 + rr() * 60, sc = 0.3 + rr() * 1.4, r1 = rr(), r2 = rr(), r3 = rr(); if (CLEAR(MX + Math.cos(a) * d, Math.sin(a) * d, 2)) continue; const pb = add(new THREE.DodecahedronGeometry(sc, 1), pebM, MX + Math.cos(a) * d, 0.2, Math.sin(a) * d, world); pb.scale.y = 0.6; pb.rotation.set(r1, r2, r3); }
for (let i = 0; i < 30; i++) { const a = rr() * 6.28, d = 4 + rr() * 50, len = 8 + rr() * 16, ry = rr() * 6, cx = MX + Math.cos(a) * d, cz = Math.sin(a) * d;
  let hit = false; for (let k = -1; k <= 1; k += 0.1) if (CLEAR(cx + Math.cos(ry) * len / 2 * k, cz - Math.sin(ry) * len / 2 * k, 1)) hit = true; if (hit) continue;
  const t = add(new THREE.CylinderGeometry(0.25, 0.3, len, 7), twigM, cx, 0.3, cz, world); t.rotation.z = Math.PI / 2; t.rotation.y = ry; }
for (let i = 0; i < 40; i++) { const a = rr() * 6.28, d = 3 + rr() * 50, ms = 0.8 + rr() * 2; if (CLEAR(MX + Math.cos(a) * d, Math.sin(a) * d, 2.5)) continue; const m = add(new THREE.SphereGeometry(ms, 10, 6), mossM, MX + Math.cos(a) * d, 0, Math.sin(a) * d, world); m.scale.y = 0.35; }
// THE plant: stem going up 25 cm with the big leaf on top (ant bites its underside)
const STEM = [MX + 4, 0, -2];
const stemM = std({ color: '#5f8a3a' });
add(new THREE.CylinderGeometry(0.35, 0.45, 26, 10), stemM, STEM[0], 13, STEM[2], world);
const bigLeaf = new THREE.Mesh(new THREE.PlaneGeometry(9, 18), LEAFM[0]); bigLeaf.userData.nd = LEAFND[0]; bigLeaf.castShadow = true; bigLeaf.receiveShadow = true;
bigLeaf.position.set(STEM[0] + 0.2, 25.6, STEM[2] + 8.6); bigLeaf.rotation.x = -Math.PI / 2; world.add(bigLeaf);
// vein under the leaf (thick, so the bite reads)
const vein = add(new THREE.CylinderGeometry(0.07, 0.1, 17, 8), std({ color: '#b8d880' }), STEM[0] + 0.2, 25.52, STEM[2] + 8.6, world); vein.rotation.x = Math.PI / 2;
// background plants (blurred): other stems and leaves
{ const L = []; for (let i = 0; i < 60; i++) { const a = rr() * 6.28, d = 14 + rr() * 60, x = MX + Math.cos(a) * d, z = Math.sin(a) * d - 10, h = 8 + rr() * 34;
    add(new THREE.CylinderGeometry(0.3, 0.4, h, 6), stemM, x, h / 2, z, world); for (let k = 0; k < 3; k++) L.push([x, h - k * 4, z, -1.0 - rr() * 0.4, rr() * 6.28, 0, 10 + rr() * 8]); } leafField(L, LEAFM, LEAFND); }
// RULER next to the stem: "25 cm"
const textTex = (w, h, fn) => { const t = P.tex(cv(w, h, fn)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1); return t; };
const ruler = new THREE.Group(); ruler.position.set(STEM[0] - 3.2, 0, STEM[2] + 1.2); world.add(ruler);
{ const rt = textTex(160, 1024, (g, w, h) => { g.fillStyle = '#f4d23e'; g.fillRect(0, 0, w, h); g.fillStyle = '#241726';
    for (let c = 0; c <= 26; c++) { const y = h - c * h / 26; g.fillRect(0, y - 2, c % 5 ? 46 : 90, 4); if (c % 5 === 0 && c) { g.font = '900 44px Inter, sans-serif'; g.fillText(String(c), 96, y + 16); } } });
  add(new THREE.BoxGeometry(1.6, 26, 0.25), std({ map: rt }), 0, 13, 0, ruler); }
const rulerTag = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4), new THREE.MeshBasicMaterial({ map: textTex(600, 230, (g, w, h) => { g.fillStyle = '#e8483b'; g.beginPath(); g.roundRect(6, 6, w - 12, h - 12, 40); g.fill(); g.lineWidth = 12; g.strokeStyle = '#fff'; g.stroke();
  g.fillStyle = '#fff'; g.font = '900 140px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('25 cm', w / 2, 170); }), transparent: true, depthTest: true }));
rulerTag.position.set(STEM[0] - 8.5, 25, STEM[2] + 1.4); rulerTag.userData.ndSkip = true; world.add(rulerTag);
// mist droplets on the underside (humidity)
const dropM = std({ color: '#d8f0ff', roughness: 0.1, transparent: true, opacity: 0.8 });
for (let i = 0; i < 40; i++) { const ds = 0.04 + rr() * 0.07, dx = STEM[0] + (rr() - 0.5) * 7, dz = STEM[2] + 1 + rr() * 15; if (Math.hypot(dx - STEM[0] - 0.2, dz - STEM[2] - 6.2) < 1.6) continue; const d = add(new THREE.SphereGeometry(ds, 10, 8), dropM, dx, 25.6 - ds, dz, world, { cast: false }); d.scale.y = 1.3; d.userData.ndSkip = true; }
// clouds: soft cumulus billboards (no fog, no ink)
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 22; i++) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 300; const g = c.getContext('2d'); g.filter = 'blur(5px)';
    for (let k = 0; k < 28; k++) { const x = 90 + r() * 330, y = 120 + r() * 110 - Math.sin((x - 90) / 330 * Math.PI) * 70, rad = 30 + r() * 55;
      const gr = g.createRadialGradient(x, y - rad * 0.3, rad * 0.1, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.7, 'rgba(240,244,250,.95)'); gr.addColorStop(1, 'rgba(205,215,230,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); }
    const sh = g.createLinearGradient(0, 150, 0, 260); sh.addColorStop(0, 'rgba(150,165,190,0)'); sh.addColorStop(1, 'rgba(150,165,190,.55)'); g.globalCompositeOperation = 'source-atop'; g.fillStyle = sh; g.fillRect(0, 0, 512, 300);
    const t = P.tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.586), new THREE.MeshBasicMaterial({ map: t, transparent: true, fog: false, depthWrite: false }));
    const a = r() * Math.PI * 2, d = 380 + r() * 260; m.position.set(Math.cos(a) * d, 70 + r() * 150, Math.sin(a) * d); m.scale.setScalar(150 + r() * 160);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }

// ---------- cards ----------
const CW = 2000, CH = 2000, CM = 2.25, PAD = 200;
const cardGeo = new THREE.PlaneGeometry(CM * (600 + 2 * PAD) / 1000, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / (600 + 2 * PAD), 0, 0, CH / 1000, PAD * CW / (600 + 2 * PAD), 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.006, .02, (ds - d)/d));                           // depth jump, near side only
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.012,.01,.014), e*0.0);
    if (flash < -0.5) c = vec3(e);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
    gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
// final copy with sRGB handled by the renderer output (we render to screen with linear->sRGB in the shader chunk)
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

function worldState(S, f) { for (const c of clouds) c.visible = !S.noClouds; rulerTag.visible = ruler.visible = !!S.ruler; }

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    if (a.face === 'cam') { c.mesh.quaternion.copy(cam.quaternion); if (a.roll) c.mesh.rotateZ(a.roll); } else c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < DECK + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position);
  for (const c of clouds) c.quaternion.copy(camera.quaternion);
  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;
