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
// Sala da casa (origem), rua de San Diego (x=60), quadra de basquete (x=120).
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
// ===== SALA da casa (origem): fliperama, sofá, cama, calendário, relógio, janela =====
const txt = (w, h, fn) => { const t = P.tex(cv(w, h, fn)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1); return t; };
const floorC = cv(512, 512, (g, w, h) => { const r = P.rng(5); for (let i = 0; i < 8; i++) { g.fillStyle = `hsl(28,${38 + r() * 10}%,${36 + r() * 8}%)`; g.fillRect(0, i * h / 8, w, h / 8 - 3); g.fillStyle = 'rgba(40,24,12,.6)'; g.fillRect(0, i * h / 8 + h / 8 - 3, w, 3);
  for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(60,36,18,${r() * 0.15})`; g.fillRect(r() * w, i * h / 8 + r() * h / 8, 30 + r() * 80, 2); } g.fillStyle = 'rgba(40,24,12,.5)'; g.fillRect(r() * w, i * h / 8, 3, h / 8); } });
const floor = add(new THREE.PlaneGeometry(9, 7), std({ map: P.tex(floorC, 2, 2) }), 0, 0, 0, world, { cast: false }); floor.rotation.x = -Math.PI / 2;
const wallC = cv(256, 256, (g, w, h) => { g.fillStyle = '#d9c9a0'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(150,120,70,.22)'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 12, h); });
const wallM = std({ map: P.tex(wallC, 6, 2) });
add(new THREE.BoxGeometry(9, 3.2, 0.15), wallM, 0, 1.6, -3.05, world);                 // fundo
add(new THREE.BoxGeometry(0.15, 3.2, 7), wallM, -4.5, 1.6, 0, world);                  // esquerda
// parede direita com janela (buraco) em z -0.6..0.6, y 1.0..2.2
add(new THREE.BoxGeometry(0.15, 3.2, 2.9), wallM, 4.5, 1.6, -2.05, world); add(new THREE.BoxGeometry(0.15, 3.2, 2.9), wallM, 4.5, 1.6, 2.05, world);
add(new THREE.BoxGeometry(0.15, 1.0, 1.2), wallM, 4.5, 0.5, 0, world); add(new THREE.BoxGeometry(0.15, 1.0, 1.2), wallM, 4.5, 2.7, 0, world);
const winC = (night) => cv(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, night ? '#0c1238' : '#6fb2e6'); gr.addColorStop(1, night ? '#2a2c5e' : '#cfe6f4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (night) { const r = P.rng(4); for (let i = 0; i < 40; i++) { g.fillStyle = '#fff8d0'; g.fillRect(r() * w, r() * h * 0.7, 2, 2); } g.fillStyle = '#f4f0d8'; g.beginPath(); g.arc(180, 70, 22, 0, 7); g.fill(); }
  g.fillStyle = '#1a1a24'; g.fillRect(0, h * 0.78, w, h * 0.22); g.fillStyle = '#ffe08a'; for (let x = 20; x < w; x += 60) g.fillRect(x, h * 0.82, 14, 12); });
const winNight = new THREE.MeshBasicMaterial({ map: txt(256, 256, (g, w, h) => g.drawImage(winC(true), 0, 0)) }), winDay = new THREE.MeshBasicMaterial({ map: txt(256, 256, (g, w, h) => g.drawImage(winC(false), 0, 0)) });
const winGlass = add(new THREE.PlaneGeometry(1.2, 1.2), winNight, 4.6, 1.6, 0, world, { cast: false }); winGlass.rotation.y = -Math.PI / 2; winGlass.userData.ndSkip = false;
const frameM = std({ color: '#f4f0e6' });
for (const [y, h_] of [[1.0, 0.08], [2.2, 0.08], [1.6, 0.05]]) add(new THREE.BoxGeometry(0.2, h_, 1.3), frameM, 4.45, y, 0, world);
for (const z of [-0.62, 0, 0.62]) add(new THREE.BoxGeometry(0.2, 1.25, z ? 0.08 : 0.05), frameM, 4.45, 1.6, z, world);
// rodapé
add(new THREE.BoxGeometry(9, 0.14, 0.04), std({ color: '#6a4a2e' }), 0, 0.07, -2.96, world);
// FLIPERAMA (frente para +z)
const PB = [1.6, 0, -2.0];
const pbM = std({ color: '#c8302f' }), pbDark = std({ color: '#2a1a2e' }), chrome = std({ color: '#d8dce2', roughness: 0.3, metalness: 0.6 });
const pb = new THREE.Group(); pb.position.set(...PB); world.add(pb);
add(new THREE.BoxGeometry(0.8, 0.45, 1.4), pbM, 0, 0.95, 0, pb).rotation.x = 0.1;
for (const [x, z] of [[-0.34, 0.6], [0.34, 0.6], [-0.34, -0.6], [0.34, -0.6]]) add(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), chrome, x, 0.4, z, pb);
const pfC = cv(256, 448, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a4aa8'); gr.addColorStop(1, '#1a2a6a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = P.rng(9); for (let i = 0; i < 14; i++) { g.fillStyle = ['#ffd23f', '#ff5a8a', '#4ae0c8'][i % 3]; g.beginPath(); g.arc(30 + r() * 196, 30 + r() * 300, 12 + r() * 10, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); }
  g.fillStyle = '#f4f4f8'; g.beginPath(); g.arc(128, 200, 14, 0, 7); g.fill(); g.fillStyle = '#ffe36a'; g.fillRect(60, 400, 50, 12); g.fillRect(146, 400, 50, 12); });
const pf = add(new THREE.PlaneGeometry(0.72, 1.3), new THREE.MeshBasicMaterial({ map: txt(256, 448, (g) => g.drawImage(pfC, 0, 0)) }), 0, 1.19, 0, pb, { cast: false }); pf.rotation.x = -Math.PI / 2 + 0.1;
const bbC = cv(256, 256, (g, w, h) => { g.fillStyle = '#1a1030'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23f'; g.font = '900 64px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('SUPER', 128, 90); g.fillStyle = '#ff5a8a'; g.fillText('BOLA', 128, 160);
  g.fillStyle = '#4ae0c8'; g.font = '900 34px Inter, sans-serif'; g.fillText('9 9 9 9 0', 128, 220); g.strokeStyle = '#ffd23f'; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16); });
add(new THREE.BoxGeometry(0.8, 0.85, 0.16), pbM, 0, 1.62, -0.66, pb);
add(new THREE.PlaneGeometry(0.66, 0.7), new THREE.MeshBasicMaterial({ map: txt(256, 256, (g) => g.drawImage(bbC, 0, 0)) }), 0, 1.62, -0.575, pb, { cast: false });
// SOFÁ
const sofaM = std({ color: '#3f6f8f' });
add(new THREE.BoxGeometry(2.2, 0.45, 0.9), sofaM, -1.8, 0.3, -2.4, world); add(new THREE.BoxGeometry(2.2, 0.6, 0.25), sofaM, -1.8, 0.75, -2.8, world);
for (const x of [-2.95, -0.65]) add(new THREE.BoxGeometry(0.25, 0.65, 0.9), sofaM, x, 0.45, -2.4, world);
// CALENDÁRIO na parede do fundo (dezembro 1963 / janeiro 1964, 11 dias riscados)
const calC = cv(400, 520, (g, w, h) => { g.fillStyle = '#fbf8ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8302f'; g.fillRect(0, 0, w, 120); g.fillStyle = '#fff'; g.font = '900 56px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('JANEIRO', w / 2, 70); g.font = '700 30px Inter, sans-serif'; g.fillText('1964', w / 2, 106);
  g.font = '700 30px Inter, sans-serif'; for (let d = 1; d <= 31; d++) { const c = (d + 2) % 7, r_ = Math.floor((d + 2) / 7), x = 30 + c * 53, y = 170 + r_ * 66; g.fillStyle = '#333'; g.fillText(String(d), x + 10, y);
    if (d <= 8) { g.strokeStyle = '#c8302f'; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 12, y - 28); g.lineTo(x + 32, y + 8); g.moveTo(x + 32, y - 28); g.lineTo(x - 12, y + 8); g.stroke(); } } });
add(new THREE.PlaneGeometry(0.8, 1.04), std({ map: txt(400, 520, (g) => g.drawImage(calC, 0, 0)) }), -0.2, 1.85, -2.96, world, { cast: false });
// RELÓGIO de parede (ponteiros giram: worldAt.clock)
const clk = new THREE.Group(); clk.position.set(-2.6, 2.45, -2.95); world.add(clk);
const clockFace = cv(256, 256, (g, w, h) => { g.fillStyle = '#fbf8ee'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.lineWidth = 14; g.strokeStyle = '#3a2418'; g.stroke(); g.fillStyle = '#3a2418'; g.font = '900 34px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let k = 1; k <= 12; k++) { const a = k / 12 * Math.PI * 2; g.fillText(String(k), 128 + Math.sin(a) * 92, 128 - Math.cos(a) * 92); } });
add(new THREE.CircleGeometry(0.32, 32), new THREE.MeshBasicMaterial({ map: txt(256, 256, (g) => g.drawImage(clockFace, 0, 0)) }), 0, 0, 0.01, clk, { cast: false });
const handM = new THREE.MeshBasicMaterial({ color: '#2a1a12' });
const hHour = new THREE.Group(), hMin = new THREE.Group(); clk.add(hHour); clk.add(hMin);
add(new THREE.BoxGeometry(0.035, 0.16, 0.01), handM, 0, 0.08, 0.03, hHour, { cast: false }); add(new THREE.BoxGeometry(0.025, 0.25, 0.01), handM, 0, 0.12, 0.04, hMin, { cast: false });
// CAMA (parede esquerda)
const bedM = std({ color: '#7a5434' }), sheetM = std({ color: '#e8eef6' }), blanketM = std({ color: '#5f86b8' });
add(new THREE.BoxGeometry(1.1, 0.4, 2.2), bedM, -3.8, 0.2, 1.2, world); add(new THREE.BoxGeometry(1.1, 1.0, 0.1), bedM, -3.8, 0.5, 0.05, world);
add(new THREE.BoxGeometry(1.05, 0.12, 2.1), sheetM, -3.8, 0.46, 1.22, world); add(new THREE.BoxGeometry(0.7, 0.14, 0.38), sheetM, -3.8, 0.58, 0.35, world);
const blanket = add(new THREE.BoxGeometry(1.08, 0.1, 1.3), blanketM, -3.8, 0.54, 1.65, world);
// CAVALETE da feira de ciências
const posterC = cv(512, 640, (g, w, h) => { g.fillStyle = '#f6f1e2'; g.fillRect(0, 0, w, h); g.fillStyle = '#2f6f8f'; g.fillRect(0, 0, w, 120); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '900 44px Inter, sans-serif'; g.fillText('FEIRA DE', w / 2, 52); g.fillText('CIÊNCIAS', w / 2, 102);
  g.fillStyle = '#c8302f'; g.font = '900 46px Inter, sans-serif'; g.fillText('QUANTO TEMPO', w / 2, 190); g.fillText('SEM DORMIR?', w / 2, 244);
  g.strokeStyle = '#3a2418'; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, 400, 110, 0, 7); g.stroke(); g.beginPath(); g.moveTo(w / 2, 400); g.lineTo(w / 2, 320); g.moveTo(w / 2, 400); g.lineTo(w / 2 + 60, 430); g.stroke();
  g.fillStyle = '#3a2418'; g.font = '900 54px Inter, sans-serif'; g.fillText('264 h ?', w / 2, 600); });
const easel = new THREE.Group(); easel.position.set(3.2, 0, 0.6); easel.rotation.y = -0.6; world.add(easel);
for (const x of [-0.4, 0.4]) add(new THREE.BoxGeometry(0.05, 1.9, 0.05), bedM, x, 0.95, 0, easel); add(new THREE.BoxGeometry(0.05, 1.8, 0.05), bedM, 0, 0.9, -0.4, easel).rotation.x = -0.25;
add(new THREE.PlaneGeometry(1.0, 1.25), std({ map: txt(512, 640, (g) => g.drawImage(posterC, 0, 0)) }), 0, 1.35, 0.04, easel, { cast: false });
// MESA + LIVRO DOS RECORDES (carimbo "PROIBIDO" ligável)
add(new THREE.BoxGeometry(1.2, 0.06, 0.8), bedM, 0.6, 0.75, 1.4, world); for (const [x, z] of [[0.1, 1.1], [1.1, 1.1], [0.1, 1.7], [1.1, 1.7]]) add(new THREE.BoxGeometry(0.06, 0.75, 0.06), bedM, x, 0.37, z, world);
const bookC = cv(400, 520, (g, w, h) => { g.fillStyle = '#c8a42e'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a2a5a'; g.fillRect(16, 16, w - 32, h - 32); g.fillStyle = '#ffd23f'; g.textAlign = 'center'; g.font = '900 52px Inter, sans-serif';
  g.fillText('LIVRO', w / 2, 150); g.fillText('DOS', w / 2, 215); g.fillText('RECORDES', w / 2, 280); g.font = '900 120px Inter, sans-serif'; g.fillText('★', w / 2, 430); });
const book = new THREE.Group(); book.position.set(0.6, 0.86, 1.4); world.add(book);
add(new THREE.BoxGeometry(0.6, 0.1, 0.78), std({ color: '#f4efe0' }), 0, 0, 0, book);
const bookTop = add(new THREE.PlaneGeometry(0.62, 0.8), std({ map: txt(400, 520, (g) => g.drawImage(bookC, 0, 0)) }), 0, 0.052, 0, book, { cast: false }); bookTop.rotation.x = -Math.PI / 2;
const stampC = cv(512, 256, (g, w, h) => { g.translate(w / 2, h / 2); g.rotate(-0.25); g.strokeStyle = '#e02a2a'; g.lineWidth = 16; g.strokeRect(-220, -70, 440, 140); g.fillStyle = '#e02a2a'; g.font = '900 84px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PROIBIDO', 0, 6); });
const stamp = add(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ map: txt(512, 256, (g) => g.drawImage(stampC, 0, 0)), transparent: true }), 0, 0.06, 0, book, { cast: false }); stamp.rotation.x = -Math.PI / 2; stamp.userData.ndSkip = true;
// abajur
add(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), chrome, -3.4, 0.7, -2.6, world); add(new THREE.ConeGeometry(0.28, 0.35, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#ffe6a0', side: THREE.DoubleSide }), -3.4, 1.5, -2.6, world);
// ===== RUA (x = 60): casas, palmeiras, placa de rua, poste =====
const RX = 60;
const asph = add(new THREE.PlaneGeometry(200, 10), std({ color: '#3a3a40' }), RX, 0.01, 2, world, { cast: false }); asph.rotation.x = -Math.PI / 2;
for (let x = -90; x < 90; x += 6) { const d = add(new THREE.PlaneGeometry(2.6, 0.18), std({ color: '#e8d46a' }), RX + x, 0.02, 2, world, { cast: false }); d.rotation.x = -Math.PI / 2; }
const side_ = add(new THREE.BoxGeometry(200, 0.15, 3), std({ color: '#b8b2a6' }), RX, 0.075, -4.5, world, { cast: false });
const lawn = add(new THREE.PlaneGeometry(200, 60), std({ color: '#6f9a48' }), RX, 0.0, -36, world, { cast: false }); lawn.rotation.x = -Math.PI / 2;
const lawn2 = add(new THREE.PlaneGeometry(200, 60), std({ color: '#6f9a48' }), RX, 0.0, 37, world, { cast: false }); lawn2.rotation.x = -Math.PI / 2;
const HC = ['#f2e6c8', '#cfe2ee', '#f4d2c2', '#e8e8d8', '#d8e8c8'];
const house = (x, z, c, s = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g);
  add(new THREE.BoxGeometry(8 * s, 3.2, 6), std({ color: c }), 0, 1.6, 0, g); const roof = add(new THREE.CylinderGeometry(0.01, 4.8 * s, 1.8, 4, 1), std({ color: '#8a4a3a' }), 0, 4.1, 0, g); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.8;
  add(new THREE.BoxGeometry(1.0, 2.1, 0.1), std({ color: '#5a3a24' }), 0, 1.05, 3.02, g); for (const wx of [-2.6, 2.6]) { add(new THREE.BoxGeometry(1.3, 1.1, 0.08), std({ color: '#ffe8a0', emissive: '#ffd070', emissiveIntensity: 0.0 }), wx, 1.7, 3.02, g).userData.win = true; }
  return g; };
const houses = []; for (let i = 0; i < 9; i++) houses.push(house(RX - 40 + i * 10, -11, HC[i % HC.length]));
const palm = (x, z, h = 7) => { const tr = add(new THREE.CylinderGeometry(0.18, 0.28, h, 8), std({ color: '#8a6a48' }), x, h / 2, z, world); const L = [];
  for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28; L.push([x, h - 0.2, z, -0.6 + Math.sin(k) * 0.2, a, 0, 2.6]); } leafField(L, LEAFM, LEAFND); };
for (const [x, z] of [[RX - 14, -6.5], [RX + 7, -6.5], [RX + 26, -6.5], [RX - 30, -6.5], [RX + 44, -6.5]]) palm(x, z, 7 + (x % 3));
// PLACA de rua (cruzamento) — "OCEAN ST" / "PALM AVE"
const sgM = std({ color: '#2f7a4a' });
const SG = [RX + 2, 0, -3.4];
add(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8), std({ color: '#9aa0a8' }), SG[0], 1.4, SG[2], world);
const plate = (t) => txt(512, 128, (g, w, h) => { g.fillStyle = '#2f7a4a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#fff'; g.font = '900 72px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, w / 2, h / 2 + 4); });
const p1 = add(new THREE.BoxGeometry(1.2, 0.3, 0.04), [sgM, sgM, sgM, sgM, std({ map: plate('OCEAN ST') }), std({ map: plate('OCEAN ST') })], SG[0], 2.75, SG[2], world);
const p2 = add(new THREE.BoxGeometry(0.04, 0.3, 1.2), [std({ map: plate('PALM AVE') }), std({ map: plate('PALM AVE') }), sgM, sgM, sgM, sgM], SG[0], 3.08, SG[2], world);
// poste de luz
const lampPost = (x, z) => { add(new THREE.CylinderGeometry(0.08, 0.1, 5, 8), std({ color: '#5a5a60' }), x, 2.5, z, world); add(new THREE.BoxGeometry(0.9, 0.1, 0.1), std({ color: '#5a5a60' }), x + 0.45, 5, z, world);
  const b = add(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff2c0' }), x + 0.85, 4.85, z, world, { cast: false }); b.userData.ndSkip = true; };
lampPost(RX - 6, -3.6); lampPost(RX + 16, -3.6);
// ===== QUADRA de basquete (x = 120) =====
const QX = 120;
const court = add(new THREE.PlaneGeometry(30, 24), std({ color: '#7a8a9a' }), QX, 0.01, 0, world, { cast: false }); court.rotation.x = -Math.PI / 2;
const lineC = cv(512, 512, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#f4f4f4'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20); g.beginPath(); g.arc(w / 2, 10, 140, 0, Math.PI); g.stroke(); g.strokeRect(w / 2 - 70, 10, 140, 180); g.beginPath(); g.arc(w / 2, 190, 70, 0, Math.PI); g.stroke(); });
const lines = add(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: txt(512, 512, (g) => g.drawImage(lineC, 0, 0)), transparent: true }), QX, 0.02, -2, world, { cast: false }); lines.rotation.x = -Math.PI / 2; lines.userData.ndSkip = true;
add(new THREE.CylinderGeometry(0.1, 0.12, 3.6, 8), std({ color: '#3a4a5a' }), QX, 1.8, -10, world);
add(new THREE.BoxGeometry(1.8, 1.1, 0.06), std({ color: '#f4f4f4' }), QX, 3.4, -9.2, world); add(new THREE.BoxGeometry(0.06, 0.06, 0.8), std({ color: '#3a4a5a' }), QX, 3.2, -9.6, world);
const rim = add(new THREE.TorusGeometry(0.23, 0.02, 8, 24), std({ color: '#e8603a' }), QX, 3.05, -8.9, world); rim.rotation.x = Math.PI / 2;
add(new THREE.CylinderGeometry(0.23, 0.15, 0.4, 12, 1, true), std({ color: '#f4f4f4', wireframe: true }), QX, 2.83, -8.9, world, { cast: false });
for (let k = -1; k <= 1; k += 2) { add(new THREE.BoxGeometry(30, 3, 0.05), std({ color: '#6a7a6a', wireframe: true }), QX, 1.5, k * 12, world, { cast: false }); }
for (const [x, z] of [[QX - 8, -11], [QX + 8, -11]]) { add(new THREE.CylinderGeometry(0.08, 0.1, 7, 8), std({ color: '#4a4a50' }), x, 3.5, z, world); const b = add(new THREE.BoxGeometry(0.9, 0.4, 0.3), new THREE.MeshBasicMaterial({ color: '#ffffe8' }), x, 7, z + 0.1, world, { cast: false }); b.userData.ndSkip = true; }
const ball = add(new THREE.SphereGeometry(0.13, 16, 12), std({ color: '#e8742a' }), QX, 0.13, 0, world);
// colinas distantes
for (let i = 0; i < 14; i++) { const a = rr() * Math.PI * 2, d = 260 + rr() * 200; const h = add(new THREE.SphereGeometry(70 + rr() * 50, 18, 10), std({ color: i % 2 ? '#4a6a3e' : '#5a7a48' }), 60 + Math.cos(a) * d, -20, Math.sin(a) * d, world, { cast: false }); h.scale.y = 0.35; }
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

function worldState(S, f) { for (const c of clouds) c.visible = !S.noClouds;
  winGlass.material = S.night ? winNight : winDay; stamp.visible = !!S.stamp;
  const cl = S.clock ?? 2.5; hHour.rotation.z = -cl / 12 * Math.PI * 2; hMin.rotation.z = -(cl % 1) * Math.PI * 2;
  blanket.visible = S.blanket !== false; easel.visible = !!S.easel;
  if (S.ball) ball.position.set(...S.ball); 
  world.traverse((o) => { if (o.userData.win) o.material.emissiveIntensity = S.night ? 1.0 : 0.0; }); }

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
