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
// Semi-realistic Kentucky farm (1876): farmhouse, red barn, fence, dirt road, crop fields, oaks with leaf cards, 3D grass, cauldron.
const DECK = 0;
const world = new THREE.Group(); scene.add(world);
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, ...o });
const decal = (mat, k = 1) => { mat.polygonOffset = true; mat.polygonOffsetFactor = -k; mat.polygonOffsetUnits = -4 * k; return mat; };
const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const rr = P.rng(7);
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
// ground
const grassC = cv(512, 512, (g, w, h) => { g.fillStyle = '#5c8c38'; g.fillRect(0, 0, w, h); for (let i = 0; i < 14000; i++) { g.fillStyle = `hsl(${82 + rr() * 28},${42 + rr() * 22}%,${26 + rr() * 26}%)`; g.fillRect(rr() * w, rr() * h, 1 + rr() * 2, 2 + rr() * 5); } });
const ground = add(new THREE.PlaneGeometry(2400, 2400), std({ map: P.tex(grassC, 420, 420) }), 0, 0, 0, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
// fields (crop rows)
const fieldTex = (base, row, sp) => P.tex(cv(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = row; g.fillRect(x, 0, 6, h); } for (let i = 0; i < 2500; i++) { g.fillStyle = sp[i % sp.length]; g.fillRect(rr() * w, rr() * h, 2, 3); } }));
const FW = std({ map: fieldTex('#c9b25e', '#9c8740', ['#e0cc7a', '#a8913f']) }), FG = std({ map: fieldTex('#6f9a3e', '#4f7a2a', ['#86b04c', '#3f6a22']) }), FB = std({ map: fieldTex('#7a5a3a', '#5e4229', ['#8d6a45', '#4e3520']) });
for (const [x, z, w, d, m, r] of [[-60, -70, 90, 60, FW, 0.05], [45, -80, 80, 70, FG, -0.04], [-25, -150, 120, 60, FB, 0.02], [70, 40, 70, 60, FW, 0.1], [-70, 45, 70, 55, FG, -0.08], [10, -220, 160, 80, FW, 0]]) {
  const t = m.map.clone(); t.needsUpdate = true; t.repeat.set(w / 4, d / 4); const mm = m.clone(); mm.map = t;
  const p = add(new THREE.PlaneGeometry(w, d), decal(mm, 1), x, 0.02, z, world, { cast: false }); p.rotation.x = -Math.PI / 2; p.rotation.z = r; }
// dirt road along x at z=8, plus a lane to the house
const roadC = cv(256, 512, (g, w, h) => { g.fillStyle = '#9c7f5c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 6000; i++) { g.fillStyle = `hsl(30,${20 + rr() * 15}%,${36 + rr() * 22}%)`; g.fillRect(rr() * w, rr() * h, 2 + rr() * 3, 2 + rr() * 3); } g.fillStyle = 'rgba(80,60,40,.35)'; g.fillRect(50, 0, 34, h); g.fillRect(170, 0, 34, h); g.fillStyle = 'rgba(110,150,60,.5)'; g.fillRect(118, 0, 20, h); });
const roadT = P.tex(roadC, 1, 60); const road = add(new THREE.PlaneGeometry(4.5, 600), decal(std({ map: roadT })), 0, 0.03, 8, world, { cast: false }); road.rotation.x = -Math.PI / 2; road.rotation.z = Math.PI / 2;
const laneT = P.tex(roadC, 1, 4); const lane = add(new THREE.PlaneGeometry(3.2, 14), decal(std({ map: laneT })), 5.5, 0.025, -0.5, world, { cast: false }); lane.rotation.x = -Math.PI / 2;
// siding / wood textures
const siding = (base, line, vertical = false) => P.tex(cv(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { g.fillStyle = line; if (vertical) g.fillRect(i * 16, 0, 2, h); else g.fillRect(0, i * 16, w, 2); } for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(0,0,0,${rr() * 0.06})`; g.fillRect(rr() * w, rr() * h, vertical ? 1 : 6, vertical ? 6 : 1); } }));
const sideTex = (t, w, h, s = 3) => { const x = t.clone(); x.needsUpdate = true; x.repeat.set(w / s, h / s); return x; };
const WH = siding('#ece6da', '#b9b0a2'), RD = siding('#a8322b', '#6e1f1b', true);
const roofT = P.tex(cv(256, 256, (g, w, h) => { g.fillStyle = '#4d4f55'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 12; x < w; x += 24) { g.fillStyle = `hsl(220,6%,${24 + rr() * 14}%)`; g.fillRect(x + 1, y + 1, 22, 14); } }));
const mat = (t, w, h, s) => std({ map: sideTex(t, w, h, s) });
const gable = (parent, w, d, h, rise, wallM, roofM, y0 = 0) => {
  add(tbox(w, h, d, 2), wallM, 0, y0 + h / 2, 0, parent);
  const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, rise); sh.closePath();
  const gg = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); gg.translate(0, 0, -w / 2);
  const gb = add(gg, wallM, 0, y0 + h, 0, parent); gb.rotation.y = Math.PI / 2;
  const th = Math.atan2(rise, d / 2), L = Math.hypot(d / 2, rise) + 0.5;
  for (const s of [-1, 1]) { const sl = add(new THREE.BoxGeometry(w + 0.6, 0.18, L), roofM, 0, y0 + h + rise / 2 + 0.08, s * (d / 4 + 0.1), parent); sl.rotation.x = s * th; }
};
const winM = std({ color: '#2c3a4a', roughness: 0.3 }), trimM = std({ color: '#f6f3ec' }), brick = std({ color: '#8a4a3a' });
// farmhouse (front faces +z)
const house = new THREE.Group(); house.position.set(-1.5, 0, -9); world.add(house);
gable(house, 9, 6.5, 5.6, 2.6, mat(WH, 9, 6, 2.4), std({ map: sideTex(roofT, 10, 5, 2.5) }));
add(tbox(9.4, 0.5, 6.9, 2), std({ color: '#8d8478' }), 0, 0.25, 0, house);
add(tbox(0.9, 3, 0.9, 1), brick, 2.6, 8.3, -0.8, house);
for (const [x, y] of [[-3, 1.6], [3, 1.6], [-3, 4.2], [0, 4.2], [3, 4.2]]) { add(box(1.1, 1.5, 0.06), winM, x, y, 3.27, house, { cast: false }); add(box(1.35, 0.14, 0.12), trimM, x, y + 0.8, 3.3, house); add(box(1.35, 0.14, 0.12), trimM, x, y - 0.8, 3.3, house); for (const s of [-1, 1]) add(box(0.12, 1.7, 0.12), trimM, x + s * 0.62, y, 3.3, house); add(box(0.06, 1.5, 0.08), trimM, x, y, 3.31, house); }
add(box(1.2, 2.3, 0.08), std({ color: '#5b3a26' }), 0, 1.4, 3.28, house, { cast: false });
// porch
add(tbox(9, 0.25, 2.6, 1), std({ map: sideTex(WH, 9, 2.6, 2) , color: '#c9b9a0' }), 0, 0.55, 4.55, house);
for (const x of [-4.3, -1.5, 1.5, 4.3]) add(new THREE.CylinderGeometry(0.1, 0.1, 2.3, 10), trimM, x, 1.8, 5.7, house);
{ const pr = add(new THREE.BoxGeometry(9.4, 0.16, 2.9), std({ map: sideTex(roofT, 10, 3, 2.5) }), 0, 3.02, 4.6, house); pr.rotation.x = 0.18; }
// red barn
const barn = new THREE.Group(); barn.position.set(-17, 0, -19); barn.rotation.y = 0.5; world.add(barn);
gable(barn, 8, 11, 5.2, 3.6, mat(RD, 8, 6, 2.4), std({ map: sideTex(roofT, 12, 8, 2.5) }));
add(box(4, 3.8, 0.1), std({ color: '#7d221d' }), 0, 1.9, 5.56, barn); for (const s of [-1, 1]) { const x = add(box(5.4, 0.2, 0.1), trimM, 0, 1.9, 5.62, barn); x.rotation.z = s * 0.76; }
add(box(4.2, 0.22, 0.12), trimM, 0, 3.85, 5.6, barn);
// fence along the road (z = 4.8), gap at the lane
const postM = std({ color: '#7a6450' }), railM = std({ color: '#8f7860' });
for (let x = -44; x <= 44; x += 2.5) { if (x > 3.5 && x < 7.5) continue; add(new THREE.BoxGeometry(0.14, 1.3, 0.14), postM, x, 0.65, 4.8, world); }
for (const [a, b] of [[-44, 3.5], [7.5, 44]]) for (const y of [0.45, 0.85, 1.2]) add(new THREE.BoxGeometry(b - a, 0.09, 0.06), railM, (a + b) / 2, y, 4.8, world);
// mailbox
add(new THREE.BoxGeometry(0.12, 1.1, 0.12), postM, 8.3, 0.55, 5.6, world); add(new THREE.BoxGeometry(0.3, 0.3, 0.55), std({ color: '#56616e', roughness: 0.5 }), 8.3, 1.22, 5.6, world);
// trees: trunk + branches + foliage blobs + instanced leaf cards
const leafT = P.tex(cv(256, 256, (g) => { for (let i = 0; i < 150; i++) { const x = 30 + rr() * 196, y = 30 + rr() * 196, r = 9 + rr() * 15; g.fillStyle = `hsl(${92 + rr() * 22},${44 + rr() * 18}%,${22 + rr() * 26}%)`; g.beginPath(); g.ellipse(x, y, r, r * 0.55, rr() * 3, 0, 7); g.fill(); } }));
leafT.wrapS = leafT.wrapT = THREE.ClampToEdgeWrapping;
const leafM = std({ map: leafT, alphaTest: 0.5, side: THREE.DoubleSide });
const leafDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafT, alphaTest: 0.5 });
const leafNd = ndInst(leafT), plainNd = ndInst(null);
const barkM = std({ color: '#5b4a3a' }), blobM = std({ color: '#3e6326' });
const leafGeo = new THREE.PlaneGeometry(1, 1);
const dummy = new THREE.Object3D();
const oak = (x, z, s = 1, leaves = 70) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rr() * 6; world.add(g);
  add(new THREE.CylinderGeometry(0.32 * s, 0.55 * s, 4.2 * s, 10), barkM, 0, 2.1 * s, 0, g);
  const cl = [];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + rr(), r = (1.4 + rr() * 1.4) * s, y = (4.6 + rr() * 2.6) * s; cl.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    const br = add(new THREE.CylinderGeometry(0.08 * s, 0.18 * s, Math.hypot(r, y - 3.4 * s), 6), barkM, Math.cos(a) * r / 2, (3.4 * s + y) / 2, Math.sin(a) * r / 2, g); br.lookAt(g.localToWorld(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r))); br.rotateX(Math.PI / 2); }
  cl.push([0, 7.6 * s, 0], [0.8 * s, 6.2 * s, 0.6 * s]);
  const inst = new THREE.InstancedMesh(leafGeo, leafM, cl.length * leaves); let k = 0;
  for (const [cx, cy, cz] of cl) {
    const R = (1.5 + rr() * 0.5) * s; const b = add(new THREE.IcosahedronGeometry(R * 0.82, 1), blobM, cx, cy, cz, g); b.userData.nd = plainNd;
    for (let i = 0; i < leaves; i++) { const u = rr() * 2 - 1, a = rr() * 6.283, rad = R * (0.75 + rr() * 0.4), sq = Math.sqrt(1 - u * u);
      dummy.position.set(cx + Math.cos(a) * sq * rad, cy + u * rad * 0.8, cz + Math.sin(a) * sq * rad); dummy.rotation.set(rr() * 6, rr() * 6, rr() * 6); dummy.scale.setScalar((0.9 + rr() * 0.8) * s); dummy.updateMatrix(); inst.setMatrixAt(k++, dummy.matrix); } }
  inst.castShadow = true; inst.receiveShadow = true; inst.customDepthMaterial = leafDepth; inst.userData.nd = leafNd; g.add(inst);
  return g;
};
oak(9.5, -5.5, 1.15); oak(-9.5, -3.5, 0.95); oak(14, -14, 1.0); oak(-26, -6, 1.1); oak(24, -2, 0.9);
for (let i = 0; i < 26; i++) { const x = -140 + i * 11 + rr() * 6, z = -95 - rr() * 30; oak(x, z, 1.1 + rr() * 0.6, 26); }
for (let i = 0; i < 10; i++) { const x = (rr() > 0.5 ? 1 : -1) * (30 + rr() * 50), z = -20 + rr() * 50; oak(x, z, 0.8 + rr() * 0.5, 30); }
// far hills
for (let i = 0; i < 14; i++) { const a = rr() * Math.PI * 2, d = 330 + rr() * 200; const h = add(new THREE.SphereGeometry(70 + rr() * 60, 20, 10), std({ color: i % 2 ? '#6f9a48' : '#7fa85a' }), Math.cos(a) * d, -30, Math.sin(a) * d, world, { cast: false }); h.scale.y = 0.45; }
// 3D grass blades around the yard
{ const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute([-0.025, 0, 0, 0.025, 0, 0, 0.004, 1, 0.02], 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0.3, 1, 0, 0.3, 1, 0, 0.6, 1], 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  bg.setAttribute('color', new THREE.Float32BufferAttribute([0.16, 0.26, 0.08, 0.16, 0.26, 0.08, 0.55, 0.72, 0.3], 3));
  const N = 90000, gm = std({ vertexColors: true, side: THREE.DoubleSide }); const gi = new THREE.InstancedMesh(bg, gm, N); const col = new THREE.Color(); let k = 0;
  while (k < N) { const x = -24 + rr() * 48, z = -16 + rr() * 34; if (Math.abs(z - 8) < 2.6) continue; if (x > 3.6 && x < 7.4 && z > -7.5 && z < 6.5) continue; if (x > -6.5 && x < 3.5 && z > -12.8 && z < -2.8) continue; if (Math.hypot(x - 2.2, z + 0.55) < 1.3) continue;
    dummy.position.set(x, 0, z); dummy.rotation.set((rr() - 0.5) * 0.5, rr() * 6.28, (rr() - 0.5) * 0.5); const s = 0.1 + rr() * 0.2; dummy.scale.set(0.8 + rr() * 0.6, s, 0.8); dummy.updateMatrix(); gi.setMatrixAt(k, dummy.matrix);
    col.setHSL(0.22 + rr() * 0.07, 0.45 + rr() * 0.2, 0.75 + rr() * 0.35); gi.setColorAt(k, col); k++; }
  gi.receiveShadow = true; gi.castShadow = false; gi.userData.nd = plainNd; world.add(gi); }
// cauldron over a fire in the yard
const kettle = new THREE.Group(); kettle.position.set(2.6, 0, -0.6); world.add(kettle);
{ const pts = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 0.62; pts.push(new THREE.Vector2(Math.sin(a) * 0.55 + 0.02, -Math.cos(a) * 0.5)); }
  const pot = add(new THREE.LatheGeometry(pts, 24), std({ color: '#1f1f22', roughness: 0.55, side: THREE.DoubleSide }), 0, 0.85, 0, kettle);
  add(new THREE.TorusGeometry(0.5, 0.04, 8, 24), std({ color: '#2a2a2e', roughness: 0.5 }), 0, 1.04, 0, kettle).rotation.x = Math.PI / 2;
  const soup = add(new THREE.CircleGeometry(0.47, 24), std({ color: '#c9b98a', roughness: 0.35 }), 0, 0.98, 0, kettle, { cast: false }); soup.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283; const l = add(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), std({ color: '#222' }), Math.cos(a) * 0.45, 0.37, Math.sin(a) * 0.45, kettle); l.rotation.z = Math.cos(a) * 0.25; l.rotation.x = -Math.sin(a) * 0.25; }
  for (let i = 0; i < 5; i++) { const lg = add(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6), barkM, 0, 0.08, 0, kettle); lg.rotation.z = Math.PI / 2; lg.rotation.y = i * 1.25; }
  for (let i = 0; i < 6; i++) { const f = add(new THREE.ConeGeometry(0.13, 0.4 + rr() * 0.2, 7), new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffb23a' : '#ff6a1f' }), (rr() - 0.5) * 0.35, 0.25, (rr() - 0.5) * 0.35, kettle, { cast: false }); f.userData.nd = plainNd; } }
// ---------- falling meat: ICONIC cartoon drumstick (coxa com osso) ----------
const meatRed = std({ color: '#b8352b', roughness: 0.45 }), meatCut = std({ color: '#e88a78', roughness: 0.5 }), boneM = std({ color: '#f8f2e4', roughness: 0.5 });
const drumGeo = (() => { const pts = []; const prof = [[0.0, -0.02], [0.05, 0.0], [0.07, 0.06], [0.12, 0.14], [0.17, 0.24], [0.19, 0.32], [0.18, 0.4], [0.14, 0.47], [0.07, 0.51], [0.0, 0.52]];
  for (const [r, y] of prof) pts.push(new THREE.Vector2(r, y)); return new THREE.LatheGeometry(pts, 28); })();
const boneGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.26, 12), knobGeo = new THREE.SphereGeometry(0.05, 14, 10), stripeGeo = new THREE.TorusGeometry(0.165, 0.014, 6, 28, Math.PI * 1.1);
const meatPiece = (parent = world) => { const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  // drumstick lies along +x: meat bulb at +x, bone sticking out to -x
  const body = new THREE.Mesh(drumGeo, meatRed); body.rotation.z = -Math.PI / 2; body.position.x = -0.06; body.castShadow = true; inner.add(body);
  for (const [x, a] of [[0.17, 0.3], [0.27, -0.2]]) { const st = new THREE.Mesh(stripeGeo, meatCut); st.position.x = x; st.rotation.set(0, Math.PI / 2, a); st.scale.setScalar(x > 0.2 ? 1.08 : 0.95); inner.add(st); }
  const bone = new THREE.Mesh(boneGeo, boneM); bone.rotation.z = Math.PI / 2; bone.position.x = -0.17; bone.castShadow = true; inner.add(bone);
  for (const dz of [-0.035, 0.035]) { const k = new THREE.Mesh(knobGeo, boneM); k.position.set(-0.31, 0, dz); k.castShadow = true; inner.add(k); }
  inner.position.x = -0.08; parent.add(g); g.position.y = -50; return g; };
const MEAT = [];
// roof surface of the farmhouse (front slope faces +z): local y(z)
const HX = -1.5, HZ = -9; const roofY = (x, z) => { const lz = Math.abs(z - HZ); return 5.6 + 2.6 * (1 - lz / 3.25) + 0.12; };
const porchY = (z) => 3.02 + Math.tan(0.18) * (4.6 - (z - HZ)) + 0.1;
const rain = (n, f0, f1, area, floorFn, sc = [0.9, 1.6]) => { for (let i = 0; i < n; i++) { const m = meatPiece(); m.scale.setScalar(sc[0] + rr() * (sc[1] - sc[0]));
  const [x, z] = area(); const fl = floorFn(x, z), h = 26 + rr() * 26, land = f0 + rr() * (f1 - f0);
  MEAT.push({ m, x, z, t0: land - (h - fl) / 0.75, h, spin: (rr() - 0.5) * 0.5, floor: fl, yaw: rr() * 6.28, rest: fl < 0.2 ? 0 : 1 }); } };
const yard = () => { for (;;) { const x = -14 + rr() * 30, z = -5 + rr() * 17; if (Math.hypot(x - 1.75, z + 0.5) < 0.9 || Math.hypot(x - 2.6, z + 0.6) < 0.9) continue; if (Math.abs(z - 4.8) < 0.3) continue; return [x, z]; } };
const nearCam = () => { for (;;) { const x = -1 + rr() * 9, z = -3 + rr() * 9; if (Math.hypot(x - 1.75, z + 0.5) < 0.9 || Math.hypot(x - 2.6, z + 0.6) < 0.9 || Math.abs(z - 4.8) < 0.3) continue; return [x, z]; } };
rain(150, 575, 700, yard, () => 0.0, [0.6, 1.0]);
rain(40, 580, 690, nearCam, () => 0.0, [0.65, 1.0]);
rain(26, 600, 690, () => [HX - 4 + rr() * 8, HZ + 0.6 + rr() * 2.4], roofY, [0.8, 1.1]);
rain(10, 600, 690, () => [HX - 4 + rr() * 8, HZ + 3.6 + rr() * 2.2], (x, z) => porchY(z), [0.7, 1.0]);
// on top of fence posts (x = -44 + 2.5k)
for (let k = 14; k <= 22; k++) { const x = -44 + 2.5 * k; if (x > 3.5 && x < 7.5) continue; const m = meatPiece(); m.scale.setScalar(0.8); MEAT.push({ m, x, z: 4.8, t0: 610 + rr() * 50 - 40 / 0.75, h: 41.3, spin: 0.3, floor: 1.33, yaw: rr() * 6.28, rest: 1 }); }
// hero chunks: 0 into cauldron (312), 1 next to her (493), 2 fence post x=1 (520), 3 on her head (543)
const HERO = [[2.6, 0.93, -0.6, 312, 50, 0.85], [2.15, 0.0, 0.3, 493, 14, 0.95], [1.0, 1.31, 4.8, 520, 14, 0.85], [1.72, 1.72, -0.42, 543, 12, 0.7]];
for (const [x, fl, z, tl, h, s] of HERO) { const m = meatPiece(); m.scale.setScalar(s); MEAT.push({ m, x, z, t0: tl - (h - fl) / 0.75, h, spin: 0.3, floor: fl, yaw: 0.35, rest: fl > 0.5 ? 1 : 0, hero: true }); }
// vulture drops (dusk): fall from the flock, f 1490-1600
const VDROP = [];
for (let i = 0; i < 26; i++) { const m = meatPiece(); m.scale.setScalar(1.0 + rr() * 0.5); VDROP.push({ m, i, t0: 1490 + rr() * 90, spin: (rr() - 0.5) * 0.6 }); }
const paddle = new THREE.Group(); paddle.position.set(2.6, 1.0, -0.6); world.add(paddle);
{ const st = add(new THREE.CylinderGeometry(0.03, 0.035, 1.6, 8), std({ color: '#8a6a45' }), -0.45, 0.35, 0.05, paddle); st.rotation.z = 0.75; }
let VPOS = []; // vulture positions published by worldState (from story)
const updateMeat = (f, S) => {
  const fe = S.fe ?? f;
  for (const c of MEAT) { const t = fe - c.t0; if (t < 0 || (S.hideMeat && !c.hero) || (c.hero && S.hideHero)) { c.m.visible = false; continue; } c.m.visible = true;
    const y = c.h - t * 0.75;
    if (y > c.floor) { c.m.position.set(c.x, y, c.z); c.m.rotation.set(0.6 + c.spin * fe * 0.5, c.spin * fe, 0.4 + c.spin * fe); }
    else { const bt = (c.floor - y) / 0.75, bounce = bt < 8 ? Math.sin(bt / 8 * Math.PI) * 0.18 * (c.hero ? 1.4 : 1) : 0;
      c.m.position.set(c.x, c.floor + 0.09 * c.m.scale.x + bounce, c.z); c.m.rotation.set(0, c.yaw, c.rest ? 0.15 : 0); } }
  for (const d of VDROP) { const t = f - d.t0, v = VPOS[d.i % Math.max(1, VPOS.length)]; if (t < 0 || !v || !S.vdrop) { d.m.visible = false; continue; } d.m.visible = true;
    d.m.position.set(v[0] + Math.sin(d.i) * 0.6, v[1] - 0.5 - t * 0.12 - t * t * 0.004, v[2]); d.m.rotation.set(d.spin * t, d.i + d.spin * t * 0.7, 0.3); }
};
// ---------- sign at the gate: FAZENDA CROUCH / KENTUCKY 1876 ----------
const textTex = (w, h, fn) => { const t = P.tex(cv(w, h, fn)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1); return t; };
const signT = textTex(1024, 512, (g, w, h) => { g.fillStyle = '#7a5434'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(40,20,10,${0.18 + rr() * 0.12})`; g.fillRect(0, i * 57, w, 4); }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${rr() * 0.08})`; g.fillRect(rr() * w, rr() * h, 30, 2); }
  g.fillStyle = '#f5ead2'; g.textAlign = 'center'; g.font = '900 120px Georgia, serif'; g.fillText('FAZENDA', w / 2, 170); g.fillText('CROUCH', w / 2, 300);
  g.font = '700 74px Georgia, serif'; g.fillStyle = '#f2c84b'; g.fillText('KENTUCKY · 1876', w / 2, 430); });
const sign = new THREE.Group(); sign.position.set(10.2, 0, 5.4); sign.rotation.y = -0.25; world.add(sign);
for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.14, 2.3, 0.14), postM, s * 1.0, 1.15, -0.05, sign);
add(new THREE.BoxGeometry(2.3, 1.15, 0.08), std({ map: signT }), 0, 1.75, 0.04, sign);
// ---------- newspaper on an old barrel (golden hour shot) ----------
const paperT = textTex(1024, 1400, (g, w, h) => { g.fillStyle = '#efe6d0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(120,100,60,${rr() * 0.06})`; g.fillRect(rr() * w, rr() * h, 3, 3); }
  const fit = (txt, y, font, px, maxW = w - 140) => { let s = px; do { g.font = font.replace('#', s + 'px'); s -= 2; } while (g.measureText(txt).width > maxW && s > 10); g.fillText(txt, w / 2, y); };
  g.fillStyle = '#1d1a18'; g.textAlign = 'center'; fit('GAZETA DO KENTUCKY', 125, '900 # Georgia, serif', 84);
  g.fillRect(70, 155, w - 140, 8); fit('Edição extra  ·  março de 1876', 205, 'italic # Georgia, serif', 34); g.fillRect(70, 228, w - 140, 4);
  fit('CHOVE', 430, '900 # Georgia, serif', 190); fit('CARNE!', 630, '900 # Georgia, serif', 190);
  fit('"Céu azul, nem uma nuvem"', 715, 'italic 700 # Georgia, serif', 52);
  g.save(); g.translate(330, 960); g.rotate(-0.4); g.fillStyle = '#9a3a30'; g.beginPath(); g.ellipse(60, 0, 140, 105, 0, 0, 7); g.fill(); g.lineWidth = 10; g.strokeStyle = '#1d1a18'; g.stroke();
  g.fillStyle = '#f8f2e4'; g.fillRect(-150, -22, 100, 44); g.strokeRect(-150, -22, 100, 44); for (const d of [-26, 26]) { g.beginPath(); g.arc(-160, d, 30, 0, 7); g.fill(); g.stroke(); } g.restore();
  g.fillStyle = '#1d1a18';
  for (let i = 0; i < 12; i++) { const y = 790 + i * 46; g.fillRect(580, y, 360 - (i % 4) * 30, 12); }
  for (let i = 0; i < 6; i++) { const y = 1150 + i * 40; g.fillRect(80, y, 860 - (i % 3) * 60, 11); } });
const paperG = new THREE.Group(); paperG.position.set(30, 0, 20); world.add(paperG);
{ const pts = []; for (let i = 0; i <= 10; i++) { const y = i / 10 * 1.0; pts.push(new THREE.Vector2(0.42 + 0.06 * Math.sin(y * Math.PI), y)); } add(new THREE.LatheGeometry(pts, 24), std({ color: '#7a5434' }), 0, 0, 0, paperG);
  for (const y of [0.15, 0.85]) add(new THREE.TorusGeometry(0.45, 0.025, 6, 24), std({ color: '#3a3836', roughness: 0.5 }), 0, y, 0, paperG).rotation.x = Math.PI / 2;
  add(new THREE.CircleGeometry(0.43, 24), std({ color: '#6a4a2c' }), 0, 1.0, 0, paperG).rotation.x = -Math.PI / 2;
  const pp = add(new THREE.PlaneGeometry(0.62, 0.85), std({ map: paperT, side: THREE.DoubleSide }), 0, 1.012, 0.02, paperG, { cast: false }); pp.rotation.x = -Math.PI / 2; pp.rotation.z = 0.12;
  const pm = meatPiece(paperG); pm.position.set(0.62, 1.06, 0.3); pm.scale.setScalar(0.6); pm.rotation.y = 2.4; }
// ---------- breakfast table (dawn ending) ----------
const table = new THREE.Group(); table.position.set(3.6, 0, 1.6); world.add(table);
{ const wd = std({ color: '#8a6440' }); add(tbox(2.6, 0.08, 1.1, 1), std({ map: sideTex(WH, 2.6, 1.1, 1.2), color: '#c9a77a' }), 0, 0.8, 0, table);
  for (const [x, z] of [[-1.15, -0.45], [1.15, -0.45], [-1.15, 0.45], [1.15, 0.45]]) add(new THREE.BoxGeometry(0.08, 0.8, 0.08), wd, x, 0.4, z, table);
  for (const x of [-0.7, 0.7]) { add(new THREE.CylinderGeometry(0.24, 0.2, 0.03, 24), std({ color: '#f4f1ea', roughness: 0.4 }), x, 0.855, 0.12, table);
    for (const k of [0, 1]) { const m = meatPiece(table); m.position.set(x + (k ? 0.08 : -0.06), 0.93 + k * 0.08, 0.12 + (k ? -0.05 : 0.04)); m.scale.setScalar(0.75); m.rotation.y = k ? 2.2 : 0.4; } }
  add(new THREE.CylinderGeometry(0.06, 0.05, 0.16, 12), std({ color: '#a7c4d6', roughness: 0.2 }), 0, 0.92, -0.25, table); }
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
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
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
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
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

function worldState(S, f) { VPOS = S.vpos || []; updateMeat(f, S); paddle.visible = !!S.stir; paddle.rotation.y = Math.sin(f * 0.18) * 0.9; for (const c of clouds) c.visible = !S.noClouds; table.visible = !!S.table; }

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
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
