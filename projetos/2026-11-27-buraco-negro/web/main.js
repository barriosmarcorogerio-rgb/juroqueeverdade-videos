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
// Espaço: buraco negro, estrela, galáxia, Terra.
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
// ===== ESPAÇO: buraco negro (origem, z = -40), estrela que desaba, galáxia, Terra; céu estrelado =====
const txt = (w, h, fn) => { const t = P.tex(cv(w, h, fn)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1); return t; };
const basic = (o) => new THREE.MeshBasicMaterial({ fog: false, ...o });
// estrelas
{ const N = 4000, pos = new Float32Array(N * 3), r = P.rng(3); for (let i = 0; i < N; i++) { const u = r() * 2 - 1, a = r() * 6.283, s = Math.sqrt(1 - u * u), R = 900; pos[i * 3] = Math.cos(a) * s * R; pos[i * 3 + 1] = u * R; pos[i * 3 + 2] = Math.sin(a) * s * R; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const st = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false })); st.userData.ndSkip = true; scene.add(st); window.__stars = st; }
// BURACO NEGRO
const BH = new THREE.Group(); BH.position.set(0, 0, -40); world.add(BH);
const hole = new THREE.Mesh(new THREE.SphereGeometry(6, 48, 32), basic({ color: '#000000' })); BH.add(hole);
const diskC = cv(1024, 1024, (g, w, h) => { const c = w / 2; const gr = g.createRadialGradient(c, c, c * 0.42, c, c, c); gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.18, 'rgba(255,210,120,1)'); gr.addColorStop(0.5, 'rgba(255,120,40,.9)'); gr.addColorStop(1, 'rgba(120,20,10,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = P.rng(8); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 260; i++) { const a = r() * 6.28, d = c * (0.45 + r() * 0.5); g.strokeStyle = `rgba(${r() < 0.5 ? '255,255,220' : '120,40,10'},${0.15 + r() * 0.3})`; g.lineWidth = 2 + r() * 6; g.beginPath(); g.arc(c, c, d, a, a + 0.4 + r() * 0.8); g.stroke(); } });
const diskM = basic({ map: txt(1024, 1024, (g) => g.drawImage(diskC, 0, 0)), transparent: true, side: THREE.DoubleSide, depthWrite: false });
const disk = new THREE.Mesh(new THREE.RingGeometry(6.6, 22, 96, 1), diskM); { const uv = disk.geometry.attributes.uv, pp = disk.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pp.getX(i) / 44 + 0.5, pp.getY(i) / 44 + 0.5); }
disk.rotation.x = -Math.PI / 2 + 0.22; disk.userData.ndSkip = true; BH.add(disk);
const ring = new THREE.Mesh(new THREE.TorusGeometry(6.35, 0.18, 12, 96), basic({ color: '#fff2c8' })); ring.userData.ndSkip = true; BH.add(ring);
const glowC = cv(512, 512, (g, w, h) => { const gr = g.createRadialGradient(256, 256, 60, 256, 256, 256); gr.addColorStop(0, 'rgba(255,190,110,.55)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const glow = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), basic({ map: txt(512, 512, (g) => g.drawImage(glowC, 0, 0)), transparent: true, depthWrite: false, opacity: 0.6 })); glow.position.z = -8; glow.userData.ndSkip = true; glow.renderOrder = -1; BH.add(glow);
// ESTRELA gigante que desaba (x = -120)
const STAR = new THREE.Group(); STAR.position.set(-120, 0, -40); world.add(STAR);
const starC = cv(512, 512, (g, w, h) => { g.fillStyle = '#ffb040'; g.fillRect(0, 0, w, h); const r = P.rng(4); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,${200 + r() * 55},${80 + r() * 100},.5)`; g.beginPath(); g.arc(r() * w, r() * h, 4 + r() * 20, 0, 7); g.fill(); } });
const star = new THREE.Mesh(new THREE.SphereGeometry(14, 48, 32), basic({ map: P.tex(starC, 2, 1) })); STAR.add(star);
const sglow = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), basic({ map: txt(512, 512, (g) => g.drawImage(glowC, 0, 0)), transparent: true, depthWrite: false })); sglow.position.z = -16; sglow.userData.ndSkip = true; STAR.add(sglow);
const starHole = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 24), basic({ color: '#000000' })); STAR.add(starHole);
// FEIXE DE LUZ que entra no buraco (lanterna do Tonico)
const beamCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-9.2, 1.9, -14.6), new THREE.Vector3(-7, 1.6, -24), new THREE.Vector3(-4, 0.8, -34), new THREE.Vector3(-1.2, 0.2, -38.5)]);
const beam = new THREE.Mesh(new THREE.TubeGeometry(beamCurve, 64, 0.22, 10), basic({ color: '#fff6a0', transparent: true, opacity: 0.9 })); beam.userData.ndSkip = true; world.add(beam);
// GALÁXIA (x = 300): espiral vista de cima
const galC = cv(1024, 1024, (g, w, h) => { const c = 512, r = P.rng(6); g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { const arm = i % 2, t = r() * 4.2, a = t * 1.3 + arm * Math.PI + (r() - 0.5) * 0.5, d = 40 + t * 105 + (r() - 0.5) * 40; const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d;
    g.fillStyle = `rgba(${200 + r() * 55},${180 + r() * 60},${230 + r() * 25},${0.25 + r() * 0.5})`; g.beginPath(); g.arc(x, y, 1 + r() * 3, 0, 7); g.fill(); }
  const gr = g.createRadialGradient(c, c, 0, c, c, 150); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(1, 'rgba(255,200,150,0)'); g.fillStyle = gr; g.beginPath(); g.arc(c, c, 150, 0, 7); g.fill(); });
const GAL = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), basic({ map: txt(1024, 1024, (g) => g.drawImage(galC, 0, 0)), transparent: true, depthWrite: false, side: THREE.DoubleSide }));
GAL.position.set(300, 0, -60); GAL.rotation.x = -1.0; GAL.userData.ndSkip = true; world.add(GAL);
// TERRA (x = -300)
const earthC = cv(1024, 512, (g, w, h) => { g.fillStyle = '#2f6fc8'; g.fillRect(0, 0, w, h); const r = P.rng(12); g.fillStyle = '#4f9a4a';
  for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(r() * w, 80 + r() * 350, 30 + r() * 90, 20 + r() * 60, r() * 3, 0, 7); g.fill(); } g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 50; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 70, 6 + r() * 14, 0, 0, 7); g.fill(); }
  g.fillStyle = '#f4f8ff'; g.fillRect(0, 0, w, 30); g.fillRect(0, h - 30, w, 30); });
const EARTH = new THREE.Mesh(new THREE.SphereGeometry(12, 48, 32), std({ map: P.tex(earthC, 1, 1), roughness: 0.8 })); EARTH.position.set(-300, -8, -30); world.add(EARTH);
const DASH = new THREE.Group(); world.add(DASH);
for (let k = 0; k < 26; k++) { const d = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 0.3), basic({ color: '#ffd23f' })); d.position.set(-282 + k * 5.2, -4, -30); d.userData.ndSkip = true; DASH.add(d); }
const farHole = new THREE.Mesh(new THREE.SphereGeometry(2, 24, 16), basic({ color: '#000000' })); farHole.position.set(-148, -4, -30); world.add(farHole);
const farRing = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.25, 8, 48), basic({ color: '#ffb050' })); farRing.position.copy(farHole.position); farRing.userData.ndSkip = true; world.add(farRing);
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

function worldState(S, f) { for (const c of clouds) c.visible = false;
  disk.rotation.z = -f * (S.slow ? 0.0015 : 0.012); BH.scale.setScalar(S.bhScale || 1);
  star.scale.setScalar(S.starScale ?? 1); sglow.scale.setScalar(Math.max(0.05, S.starScale ?? 1)); starHole.visible = (S.starScale ?? 1) < 0.35;
  beam.visible = !!S.beam; DASH.visible = farHole.visible = farRing.visible = !!S.dash; EARTH.rotation.y = f * 0.002; }

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1) * (a.sx || 1), s * (a.sy || 1), s);
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
