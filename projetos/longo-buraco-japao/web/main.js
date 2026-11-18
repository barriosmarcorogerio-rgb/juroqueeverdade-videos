import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const W = 1920, H = 1080;
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
  const body = add(tbox(w, h, d, 2), wallM, 0, y0 + h / 2, 0, parent); parent.userData.body = body;
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
// cut a real doorway in the front face (alpha hole) and build a lit room behind it
{ const body = house.userData.body, wm = body.material, front = wm.clone();
  front.alphaMap = P.tex(cv(256, 256, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#000000'; const x0 = (4.5 - 0.6) / 9 * w, x1 = (4.5 + 0.6) / 9 * w, yb = h - 0.25 / 5.6 * h, yt = h - 2.55 / 5.6 * h; g.fillRect(x0, yt, x1 - x0, yb - yt); }));
  front.alphaMap.wrapS = front.alphaMap.wrapT = THREE.ClampToEdgeWrapping; front.alphaMap.repeat.set(1 / 4.5, 1 / 2.8); front.alphaMap.colorSpace = THREE.NoColorSpace; front.alphaTest = 0.5; front.transparent = false;
  body.material = [wm, wm, wm, wm, front, wm];
  const room = new THREE.Group(); room.position.set(0, 0.25, 1.6); house.add(room);
  const rw = 3.6, rh = 2.7, rd = 3.0;
  const wallIn = std({ color: '#e8d6b0', side: THREE.BackSide }); const rb = add(new THREE.BoxGeometry(rw, rh, rd), wallIn, 0, rh / 2, 0, room, { cast: false });
  const fl = add(new THREE.PlaneGeometry(rw, rd), std({ map: P.tex(P.planks(61), 2, 2), color: '#c9a070' }), 0, 0.01, 0, room, { cast: false }); fl.rotation.x = -Math.PI / 2;
  const pic = add(box(0.8, 0.6, 0.04), std({ color: '#7a5a3a' }), 0.4, 1.6, -rd / 2 + 0.03, room); add(box(0.66, 0.46, 0.02), std({ color: '#7ab0d0' }), 0.4, 1.6, -rd / 2 + 0.06, room);
  add(box(0.9, 0.8, 0.5), std({ color: '#8a5a3a' }), -1.1, 0.4, -rd / 2 + 0.3, room); add(new THREE.CylinderGeometry(0.12, 0.18, 0.3, 12), std({ color: '#f2e6c8', emissive: '#ffd890', emissiveIntensity: 0.8 }), -1.1, 1.0, -rd / 2 + 0.3, room);
  const lamp = new THREE.PointLight('#ffd9a0', 6, 6, 1.5); lamp.position.set(0, 2.2, 0); room.add(lamp); }
add(tbox(9.4, 0.5, 6.9, 2), std({ color: '#8d8478' }), 0, 0.25, 0, house);
add(tbox(0.9, 3, 0.9, 1), brick, 2.6, 8.3, -0.8, house);
for (const [x, y] of [[-3, 1.6], [3, 1.6], [-3, 4.2], [0, 4.2], [3, 4.2]]) { add(box(1.1, 1.5, 0.06), winM, x, y, 3.27, house, { cast: false }); add(box(1.35, 0.14, 0.12), trimM, x, y + 0.8, 3.3, house); add(box(1.35, 0.14, 0.12), trimM, x, y - 0.8, 3.3, house); for (const s of [-1, 1]) add(box(0.12, 1.7, 0.12), trimM, x + s * 0.62, y, 3.3, house); add(box(0.06, 1.5, 0.08), trimM, x, y, 3.31, house); }
// real door: dark interior, frame, hinged leaf (pivot on the left edge) with knob; opens with world.door 0..1

for (const [x, y, w, h] of [[-0.66, 1.42, 0.12, 2.42], [0.66, 1.42, 0.12, 2.42], [0, 2.62, 1.44, 0.14]]) add(box(w, h, 0.14), trimM, x, y, 3.3, house);
const doorPivot = new THREE.Group(); doorPivot.position.set(-0.6, 0.25, 3.3); house.add(doorPivot);
{ const leafM = std({ color: '#6b4428' }); add(box(1.2, 2.3, 0.07), leafM, 0.6, 1.15, 0, doorPivot);
  for (const [y, h] of [[0.6, 0.8], [1.6, 0.8]]) add(box(0.85, h, 0.03), std({ color: '#5a3820' }), 0.6, y, 0.05, doorPivot);
  for (const sz of [-1, 1]) { add(new THREE.SphereGeometry(0.055, 12, 8), std({ color: '#d9b44a', metalness: 0.7, roughness: 0.3 }), 1.05, 1.1, sz * 0.07, doorPivot); add(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8), std({ color: '#d9b44a', metalness: 0.7, roughness: 0.3 }), 1.05, 1.1, 0, doorPivot).rotation.x = Math.PI / 2; }
  for (const y of [0.35, 1.95]) add(box(0.05, 0.16, 0.09), std({ color: '#3a3a3a' }), 0.0, y, 0, doorPivot); }
const setDoor = (t) => { doorPivot.rotation.y = -Math.min(1, Math.max(0, t || 0)) * 1.75; };
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
  while (k < N) { const x = -24 + rr() * 48, z = -16 + rr() * 34; if (Math.abs(z - 8) < 2.6) continue; if (x > 3.6 && x < 7.4 && z > -7.5 && z < 6.5) continue; if (x > -6.5 && x < 3.5 && z > -12.8 && z < -2.8) continue; if (Math.hypot(x - 3, z - 2) < 1.0) continue;
    dummy.position.set(x, 0, z); dummy.rotation.set((rr() - 0.5) * 0.5, rr() * 6.28, (rr() - 0.5) * 0.5); const s = 0.1 + rr() * 0.2; dummy.scale.set(0.8 + rr() * 0.6, s, 0.8); dummy.updateMatrix(); gi.setMatrixAt(k, dummy.matrix);
    col.setHSL(0.22 + rr() * 0.07, 0.45 + rr() * 0.2, 0.75 + rr() * 0.35); gi.setColorAt(k, col); k++; }
  gi.receiveShadow = true; gi.castShadow = false; gi.userData.nd = plainNd; world.add(gi); }
// ================= SETS for "E se você cavasse até o Japão?" =================
const textTex = (w, h, fn) => { const t = P.tex(cv(w, h, fn)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1); return t; };
const fitT = (g, txt, x, y, font, px, maxW) => { let s = px; do { g.font = font.replace('#', s + 'px'); s -= 2; } while (g.measureText(txt).width > maxW && s > 10); g.fillText(txt, x, y); };
const emis = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0, ...o });
const HOLE = [3, 0, 2];
// ---- the hole in the yard ----
const holeG = new THREE.Group(); holeG.position.set(...HOLE); world.add(holeG);
{ const d = add(new THREE.CircleGeometry(0.62, 32), new THREE.MeshBasicMaterial({ color: '#120c08' }), 0, 0.035, 0, holeG, { cast: false }); d.rotation.x = -Math.PI / 2;
  add(new THREE.TorusGeometry(0.66, 0.1, 8, 32), std({ color: '#6a4a2e' }), 0, 0.03, 0, holeG).rotation.x = Math.PI / 2;
  const pile = add(new THREE.ConeGeometry(1.0, 0.7, 14), std({ map: P.tex(P.dirt(17), 2, 2), color: '#8a6440' }), -1.6, 0.35, -0.6, holeG); pile.scale.z = 0.8; }
const holeState = (k) => { holeG.scale.setScalar(k > 0 ? 1 : 0.001); };
// ---- vertical shaft under the hole (layers change colour/glow by depth) ----
const shaftG = new THREE.Group(); shaftG.position.set(HOLE[0], 0, HOLE[2]); world.add(shaftG);
const rockC = cv(512, 512, (g, w, h) => { g.fillStyle = '#7a6a5a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const v = 40 + rr() * 60; g.fillStyle = `rgba(${v},${v * 0.9},${v * 0.8},${0.25 + rr() * 0.4})`; g.beginPath(); g.ellipse(rr() * w, rr() * h, 3 + rr() * 18, 2 + rr() * 10, rr() * 3, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(20,14,10,.5)'; g.lineWidth = 2; for (let i = 0; i < 30; i++) { let x = rr() * w, y = rr() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rr() - 0.5) * 70; y += rr() * 50; g.lineTo(x, y); } g.stroke(); } });
const shaftM = emis({ map: P.tex(rockC, 3, 12), side: THREE.BackSide, color: '#ffffff', emissive: '#000000' });
const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 80, 32, 1, true), shaftM); shaft.position.y = -40.2; shaft.castShadow = false; shaft.receiveShadow = false; shaftG.add(shaft);
const shaftBottom = add(new THREE.CircleGeometry(1.0, 32), emis({ color: '#5a4a3a' }), 0, -80, 0, shaftG, { cast: false }); shaftBottom.rotation.x = -Math.PI / 2;
const rope = add(new THREE.CylinderGeometry(0.018, 0.018, 80, 6), std({ color: '#d9c49a' }), 0.6, -40, 0.36, shaftG, { cast: false });
const shaftLight = new THREE.PointLight('#ffd9a0', 0, 12, 1.4); scene.add(shaftLight);
const iceM = std({ color: '#cfeaf6', roughness: 0.2 });
const ice = new THREE.Group(); shaftG.add(ice); for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.35, 0.3, 0.35), iceM, -0.4 + (i % 2) * 0.3, -79.85 + Math.floor(i / 2) * 0.3, -0.45, ice);
// layer palettes: [wall colour, emissive glow]
const LAYERS = { terra: ['#9a7a5a', '#000000'], rocha: ['#8a8278', '#000000'], quente: ['#9a6a4a', '#2a0800'], crosta: ['#7a5a4a', '#401000'], manto: ['#c0582a', '#a02a00'], fundo: ['#e0742a', '#ff5a10'] };
const setShaft = (S) => { const L = LAYERS[S.layer || 'terra']; shaftM.color.set(L[0]); shaftM.emissive.set(L[1]); shaftM.emissiveIntensity = S.glow ?? 0.6; ice.visible = !!S.ice; rope.visible = S.rope !== false; };
// ---- Kola: snowy plain, rusty welded cap, ruins, birches (x = 3000) ----
const KX = 3000;
const kolaG = new THREE.Group(); kolaG.position.set(KX, 0, 0); world.add(kolaG);
{ const sn = add(new THREE.PlaneGeometry(900, 900), std({ map: P.tex(cv(256, 256, (g, w, h) => { g.fillStyle = '#eef2f6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(150,170,200,${rr() * 0.15})`; g.fillRect(rr() * w, rr() * h, 3, 2); } }), 120, 120) }), 0, 0.01, 0, kolaG, { cast: false }); sn.rotation.x = -Math.PI / 2;
  const rust = std({ map: P.tex(cv(256, 256, (g, w, h) => { g.fillStyle = '#7d8086'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.fillStyle = `hsla(${18 + rr() * 16},55%,${28 + rr() * 18}%,${0.35 + rr() * 0.4})`; g.beginPath(); g.ellipse(rr() * w, rr() * h, 4 + rr() * 16, 3 + rr() * 9, rr() * 3, 0, 7); g.fill(); } })), roughness: 0.45, metalness: 0.55 });
  add(new THREE.CylinderGeometry(0.45, 0.47, 0.08, 32), rust, 0, 0.04, 0, kolaG); add(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 6), rust, 0, 0.1, 0, kolaG);
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; add(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 6), std({ color: '#55585e', metalness: 0.6, roughness: 0.4 }), Math.cos(a) * 0.38, 0.095, Math.sin(a) * 0.38, kolaG); }
  const plate = textTex(512, 256, (g, w, h) => { g.fillStyle = '#5a4a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2e6c8'; g.textAlign = 'center'; fitT(g, 'POÇO DE KOLA', w / 2, 100, '900 # Georgia, serif', 70, w - 40); fitT(g, '12.262 m', w / 2, 200, '900 # Georgia, serif', 90, w - 40); });
  add(new THREE.BoxGeometry(1.2, 0.6, 0.06), std({ map: plate }), 0, 0.9, -0.9, kolaG); add(new THREE.BoxGeometry(0.06, 1.0, 0.06), std({ color: '#3a3a3a' }), 0, 0.5, -0.95, kolaG);
  const conc = std({ color: '#9a9a96' });
  for (const [x, z, w, h, d] of [[-8, -12, 10, 6, 6], [6, -16, 8, 9, 6], [14, -10, 5, 4, 5]]) { add(tbox(w, h, d, 2), conc, x, h / 2, z, kolaG); for (let i = 0; i < 3; i++) add(box(1, 1.3, 0.1), std({ color: '#2a2e34' }), x - w / 2 + 1.5 + i * 2.5, h * 0.6, z + d / 2 + 0.02, kolaG); }
  add(new THREE.CylinderGeometry(0.5, 0.6, 22, 12), conc, 12, 11, -18, kolaG);
  const birch = std({ color: '#efece6' });
  for (let i = 0; i < 40; i++) { const x = (rr() - 0.5) * 120, z = -20 - rr() * 60; const h = 6 + rr() * 4, t = add(new THREE.CylinderGeometry(0.05, 0.12, h, 6), birch, x, h / 2, z, kolaG); for (let b = 0; b < 4; b++) { const br = add(new THREE.CylinderGeometry(0.02, 0.04, 1.6, 4), birch, x, h * (0.55 + b * 0.1), z, kolaG); br.rotation.set(rr() - 0.5, rr() * 6, 0.6 + rr() * 0.5); } }
  const pole = textTex(512, 256, (g, w, h) => { g.fillStyle = '#c0302c'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.textAlign = 'center'; fitT(g, 'POLO NORTE', w / 2, 160, '900 # Georgia, serif', 110, w - 40); });
  const pn = new THREE.Group(); pn.position.set(40, 0, 40); kolaG.add(pn); add(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 10), std({ color: '#ffffff' }), 0, 1.3, 0, pn); for (let i = 0; i < 5; i++) add(new THREE.CylinderGeometry(0.085, 0.085, 0.25, 10), std({ color: '#c0302c' }), 0, 0.3 + i * 0.5, 0, pn);
  add(new THREE.BoxGeometry(1.4, 0.7, 0.05), std({ map: pole }), 0, 2.2, 0.1, pn); }
// ---- deep mine gallery (Mponeng), x = 3000, z = 400 ----
const mineG = new THREE.Group(); mineG.position.set(KX, 0, 400); world.add(mineG);
{ const mt = emis({ map: P.tex(rockC, 6, 2), side: THREE.BackSide, color: '#b08a6a', emissive: '#2a0a00', emissiveIntensity: 0.5 });
  const tun = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 40, 24, 1, true), mt); tun.rotation.x = Math.PI / 2; tun.position.y = 2.0; mineG.add(tun);
  const fl = add(new THREE.PlaneGeometry(4, 40), std({ color: '#5a4636' }), 0, 0.02, 0, mineG, { cast: false }); fl.rotation.x = -Math.PI / 2;
  for (let z = -16; z <= 16; z += 4) { add(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff2c0' }), 0, 4.1, z, mineG, { cast: false }); }
  for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(0.5, 0.45, 0.5), iceM, -1.1 + (i % 3) * 0.55, 0.23 + Math.floor(i / 3) * 0.46, -3, mineG);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.1, 0.1, 40), std({ color: '#6a5a4a' }), s * 0.6, 0.05, 0, mineG); }
const mineLight = new THREE.PointLight('#ffcc88', 0, 30, 1.2); mineLight.position.set(KX, 3, 400); scene.add(mineLight);
// ---- Earth cutaway in space (z = -6000) ----
const EZ = -6000, ER = 40;
const earthG = new THREE.Group(); earthG.position.set(0, 0, EZ); world.add(earthG);
const LL = (lon, lat, w, h) => [(lon + 180) / 360 * w, (90 - lat) / 180 * h];
const CONT = {
  sa: [[-80, 10], [-75, 11], [-62, 10], [-50, 0], [-35, -5], [-39, -13], [-41, -22], [-48, -26], [-53, -34], [-58, -38], [-65, -41], [-68, -50], [-70, -55], [-75, -50], [-73, -40], [-71, -30], [-70, -18], [-76, -14], [-81, -6], [-80, 0], [-78, 2]],
  af: [[-17, 21], [-10, 30], [-6, 35], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [41, -2], [40, -11], [35, -22], [32, -28], [27, -34], [20, -35], [17, -30], [12, -18], [13, -6], [9, 4], [5, 5], [-8, 5], [-15, 11]],
  na: [[-165, 65], [-140, 70], [-100, 72], [-80, 70], [-62, 55], [-56, 48], [-70, 43], [-76, 35], [-81, 25], [-82, 30], [-90, 29], [-97, 26], [-97, 20], [-87, 21], [-83, 10], [-78, 8], [-85, 12], [-95, 16], [-105, 20], [-110, 24], [-117, 32], [-124, 40], [-125, 49], [-135, 58], [-150, 60], [-165, 60]],
  gr: [[-55, 60], [-40, 60], [-20, 70], [-25, 82], [-60, 82], [-70, 76]],
  eu: [[-10, 36], [-9, 43], [-1, 46], [-5, 48], [5, 52], [8, 57], [5, 62], [15, 69], [30, 70], [60, 70], [80, 73], [110, 77], [140, 72], [180, 68], [180, 62], [160, 60], [140, 55], [135, 45], [122, 40], [121, 30], [110, 20], [108, 12], [104, 2], [100, 10], [98, 16], [92, 22], [80, 12], [77, 8], [72, 20], [66, 25], [57, 25], [52, 28], [56, 15], [45, 13], [38, 20], [35, 28], [34, 32], [28, 36], [26, 40], [20, 38], [16, 40], [12, 44], [8, 44], [3, 42], [0, 39]],
  au: [[114, -22], [122, -18], [131, -12], [137, -12], [142, -11], [146, -18], [153, -26], [150, -37], [141, -38], [135, -34], [129, -32], [115, -34]],
  jp: [[130, 31], [132, 34], [136, 35], [140, 36], [141, 41], [142, 45], [144, 44], [141, 39], [140, 35], [135, 33]],
};
const earthTex = P.tex(cv(2048, 1024, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2f6fae'); gr.addColorStop(0.5, '#2a7fc0'); gr.addColorStop(1, '#2f6fae'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (const [k, pts] of Object.entries(CONT)) { g.beginPath(); pts.forEach(([lo, la], i) => { const [x, y] = LL(lo, la, w, h); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fillStyle = k === 'sa' ? '#5aa04a' : k === 'gr' ? '#eef2f6' : k === 'af' ? '#b9a25a' : '#6aa84f'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#2f5a2a'; g.stroke(); }
  g.fillStyle = '#f4f6fa'; g.fillRect(0, h * 0.92, w, h * 0.08); g.fillRect(0, 0, w, h * 0.03);
  const [bx, by] = LL(-46.6, -23.5, w, h); g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(bx, by, 10, 0, 7); g.fill(); g.lineWidth = 4; g.strokeStyle = '#1a1a1a'; g.stroke(); }));
earthTex.wrapS = THREE.RepeatWrapping; earthTex.repeat.set(1, 1);
const ringTex = textTex(1024, 1024, (g, w, h) => { const c = w / 2, R = w / 2; const L = [[1.0, '#7a5a3a'], [0.975, '#c8642a'], [0.85, '#d9702e'], [0.546, '#f2b23a'], [0.19, '#fff2b0']];
  for (const [r, col] of L) { const gr = g.createRadialGradient(c, c, R * r * 0.6, c, c, R * r); gr.addColorStop(0, col); gr.addColorStop(1, col); g.fillStyle = col; g.beginPath(); g.arc(c, c, R * r, 0, 7); g.fill(); }
  const glow = g.createRadialGradient(c, c, 0, c, c, R * 0.55); glow.addColorStop(0, 'rgba(255,255,230,.9)'); glow.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = glow; g.beginPath(); g.arc(c, c, R * 0.55, 0, 7); g.fill();
  g.strokeStyle = 'rgba(60,20,0,.5)'; g.lineWidth = 3; for (const r of [0.975, 0.546, 0.19]) { g.beginPath(); g.arc(c, c, R * r, 0, 7); g.stroke(); } });
{ const shell = new THREE.Mesh(new THREE.SphereGeometry(ER, 64, 40, Math.PI / 2, Math.PI * 1.5), emis({ map: earthTex, side: THREE.DoubleSide })); earthG.add(shell);
  // two half-disc cut faces (planes x=0 and z=0) showing the layers
  const cutM = new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide });
  const f1 = new THREE.Mesh(new THREE.CircleGeometry(ER * 0.998, 96, Math.PI / 2, Math.PI), cutM); earthG.add(f1);   // plane z=0, x<=0 half
  const f2 = new THREE.Mesh(new THREE.CircleGeometry(ER * 0.998, 96, -Math.PI / 2, Math.PI), cutM); f2.rotation.y = -Math.PI / 2; earthG.add(f2); // plane x=0, z>=0 half
  f1.userData.nd = plainNd; f2.userData.nd = plainNd; }
// tunnel line on cut face f1 (z=0 plane): from upper-right surface through centre to lower-left surface
const TUN_A = new THREE.Vector3(-0.7, ER + 0.5, 0.7), TUN_B = new THREE.Vector3(-0.7, -ER - 0.5, 0.7);
{ const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, ER * 2, 10), new THREE.MeshBasicMaterial({ color: '#1a1410' })); tl.position.set(-0.3, 0, 0.3); earthG.add(tl); tl.userData.nd = plainNd; }
for (const [y, c] of [[ER + 1.5, '#ffd23a'], [-ER - 1.5, '#e8483b']]) { const pin = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3, 12), new THREE.MeshBasicMaterial({ color: c })); pin.position.set(-0.7, y, 0.7); if (y < 0) pin.rotation.z = Math.PI; earthG.add(pin); pin.userData.nd = plainNd; }
const traveller = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffd23a' })); traveller.userData.nd = plainNd; earthG.add(traveller);
const stars = (() => { const n = 1500, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = rr() * 2 - 1, a = rr() * 6.283, s = Math.sqrt(1 - u * u); pos.set([Math.cos(a) * s * 900, u * 900, Math.sin(a) * s * 900], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false })); p.userData.ndSkip = true; scene.add(p); return p; })();
// ---- outer core: ocean of liquid metal under a dark rock sky (x = -3000) ----
const CX = -3000;
const coreG = new THREE.Group(); coreG.position.set(CX, 0, 0); world.add(coreG);
const metalT = P.tex(cv(512, 512, (g, w, h) => { g.fillStyle = '#e08a2a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { g.strokeStyle = `rgba(${255},${200 + rr() * 55},${120 + rr() * 100},${0.3 + rr() * 0.4})`; g.lineWidth = 2 + rr() * 6; g.beginPath(); const x = rr() * w, y = rr() * h; g.moveTo(x, y); g.bezierCurveTo(x + 40, y + rr() * 20, x + 80, y - rr() * 20, x + 140, y); g.stroke(); } }), 30, 30);
const metal = add(new THREE.PlaneGeometry(600, 600), emis({ map: metalT, color: '#ffffff', emissive: '#ff7a1a', emissiveIntensity: 0.9, roughness: 0.25, metalness: 0.5 }), 0, 0, 0, coreG, { cast: false }); metal.rotation.x = -Math.PI / 2;
{ const ceil = add(new THREE.PlaneGeometry(600, 600), emis({ map: P.tex(rockC, 40, 40), color: '#6a3a2a', emissive: '#3a0a00', emissiveIntensity: 0.6, side: THREE.DoubleSide }), 0, 40, 0, coreG, { cast: false }); ceil.rotation.x = Math.PI / 2;
  for (let i = 0; i < 30; i++) { const x = (rr() - 0.5) * 300, z = (rr() - 0.5) * 300, h = 8 + rr() * 25; const st = add(new THREE.ConeGeometry(2 + rr() * 3, h, 8), emis({ color: '#5a3a2a', emissive: '#4a1000', emissiveIntensity: 0.6 }), x, 40 - h / 2, z, coreG); st.rotation.x = Math.PI; } }
const pot = new THREE.Group(); coreG.add(pot);
{ const potM = std({ color: '#c9ccd2', roughness: 0.25, metalness: 0.6 }); add(new THREE.CylinderGeometry(0.9, 0.8, 1.2, 28), potM, 0, 0.3, 0, pot); add(new THREE.CylinderGeometry(0.95, 0.95, 0.12, 28), std({ color: '#2a2a2e' }), 0, 0.95, 0, pot);
  add(new THREE.CylinderGeometry(0.12, 0.2, 0.3, 12), std({ color: '#2a2a2e' }), 0, 1.15, 0, pot); for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.4, 0.1, 0.14), std({ color: '#2a2a2e' }), s * 1.05, 0.6, 0, pot);
  add(new THREE.CircleGeometry(0.25, 20), std({ color: '#9fd4ff', roughness: 0.1 }), 0, 0.45, 0.86, pot, { cast: false });
  add(new THREE.TorusGeometry(0.27, 0.05, 8, 20), std({ color: '#b08a4a', metalness: 0.6, roughness: 0.3 }), 0, 0.45, 0.86, pot); }
const coreLight = new THREE.PointLight('#ffb060', 0, 80, 1.0); coreLight.position.set(CX, 6, 0); scene.add(coreLight);
// ---- centre of the Earth: glowing iron crystal sphere (z = 6000) ----
const CZ = 6000;
const centerG = new THREE.Group(); centerG.position.set(0, 0, CZ); world.add(centerG);
{ const ct = P.tex(cv(512, 512, (g, w, h) => { g.fillStyle = '#ffd88a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 220; i++) { const x = rr() * w, y = rr() * h, r = 10 + rr() * 40; g.fillStyle = `hsla(${38 + rr() * 16},100%,${70 + rr() * 25}%,.8)`; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); g.strokeStyle = 'rgba(200,110,20,.6)'; g.lineWidth = 2; g.stroke(); } }), 6, 4);
  const sp = new THREE.Mesh(new THREE.SphereGeometry(30, 48, 32), new THREE.MeshBasicMaterial({ map: ct, side: THREE.BackSide, fog: false })); sp.userData.nd = plainNd; centerG.add(sp);
  const sw = new THREE.Group(); sw.position.set(1.4, 1.6, 0.4); centerG.add(sw); add(new THREE.BoxGeometry(0.5, 0.08, 0.35), std({ color: '#e0b070' }), 0, 0, 0, sw); add(new THREE.BoxGeometry(0.52, 0.04, 0.37), std({ color: '#7ab04a' }), 0, 0.06, 0, sw); add(new THREE.BoxGeometry(0.5, 0.05, 0.35), std({ color: '#d24a3a' }), 0, 0.1, 0, sw); add(new THREE.BoxGeometry(0.5, 0.08, 0.35), std({ color: '#e0b070' }), 0, 0.16, 0, sw);
  centerG.userData.sw = sw;
  const hm = add(new THREE.SphereGeometry(0.28, 20, 12, 0, 6.283, 0, Math.PI / 2), std({ color: '#ffcc22', roughness: 0.4 }), -1.3, 2.2, 0.2, centerG); add(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 20), std({ color: '#ffcc22' }), -1.3, 2.2, 0.2, centerG); centerG.userData.hm = hm; }
const centerLight = new THREE.PointLight('#fff0c0', 0, 60, 1.0); centerLight.position.set(0, 3, CZ + 3); scene.add(centerLight);
// ---- Pacific: open ocean + fishing boat (x = -3000, z = 3000) ----
const OX = -3000, OZ = 3000;
const oceanG = new THREE.Group(); oceanG.position.set(OX, 0, OZ); world.add(oceanG);
const waveT = P.tex(cv(256, 256, (g, w, h) => { g.fillStyle = '#1f6f9a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${0.05 + rr() * 0.18})`; g.fillRect(rr() * w, rr() * h, 10 + rr() * 22, 2); } }), 200, 200);
{ const o = add(new THREE.PlaneGeometry(1400, 1400), std({ map: waveT, roughness: 0.3 }), 0, 0, 0, oceanG, { cast: false }); o.rotation.x = -Math.PI / 2; }
const boat = new THREE.Group(); boat.position.set(3, 0, -2); oceanG.add(boat);
{ const sh = new THREE.Shape(); sh.moveTo(-3, 1); sh.lineTo(3, 1); sh.quadraticCurveTo(3.6, 1, 3.9, 1.5); sh.lineTo(3.2, 0); sh.quadraticCurveTo(0, -0.6, -2.8, 0); sh.closePath();
  const hg = new THREE.ExtrudeGeometry(sh, { depth: 2.2, bevelEnabled: false }); hg.translate(0, -0.45, -1.1); add(hg, std({ color: '#d9e2ea' }), 0, 0, 0, boat); add(box(6.2, 0.12, 2.3), std({ color: '#c0302c' }), 0, 0.58, 0, boat);
  add(tbox(1.6, 1.3, 1.6, 1), std({ color: '#f4f0e6' }), -1.2, 1.2, 0, boat); add(box(1.8, 0.12, 1.8), std({ color: '#2f5f9a' }), -1.2, 1.9, 0, boat);
  add(new THREE.CylinderGeometry(0.05, 0.05, 3, 6), std({ color: '#6a4a30' }), 1.2, 2.0, 0, boat); }
const ripple = add(new THREE.RingGeometry(0.4, 0.7, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 }), 0, 0.03, 0, oceanG, { cast: false }); ripple.rotation.x = -Math.PI / 2; ripple.userData.ndSkip = true;
// ---- set switching ----
const SETS = { quintal: [world.children.filter((c) => ![shaftG, kolaG, mineG, earthG, coreG, centerG, oceanG].includes(c))] };
const farmParts = world.children.filter((c) => ![shaftG, kolaG, mineG, earthG, coreG, centerG, oceanG].includes(c));
const setActive = (S, f) => {
  const s = S.set || 'quintal';
  for (const c of farmParts) c.visible = s === 'quintal' || s === 'shaft';
  shaftG.visible = s === 'shaft' || (s === 'quintal' && !!S.showShaft); kolaG.visible = s === 'kola'; mineG.visible = s === 'mine'; earthG.visible = s === 'earth'; coreG.visible = s === 'core'; centerG.visible = s === 'center'; oceanG.visible = s === 'ocean';
  stars.visible = s === 'earth'; holeState(S.hole ?? 1);
  shaftLight.intensity = s === 'shaft' ? (S.lamp ?? 30) : 0; mineLight.intensity = s === 'mine' ? 60 : 0; coreLight.intensity = s === 'core' ? 400 : 0; centerLight.intensity = s === 'center' ? 200 : 0;
  if (s === 'shaft') setShaft(S);
  if (s === 'earth') { earthG.rotation.y = S.earthRot ?? 0; const u = S.trav ?? -1; traveller.visible = u >= 0; if (u >= 0) traveller.position.lerpVectors(TUN_A, TUN_B, u); }
  if (s === 'core') { metalT.offset.set(f * 0.0008, f * 0.0005); pot.position.set(S.potX ?? 0, (S.potY ?? 0) + Math.sin(f * 0.15) * 0.06, S.potZ ?? 0); pot.rotation.z = Math.sin(f * 0.1) * 0.05; }
  if (s === 'center') { const sw = centerG.userData.sw, hm = centerG.userData.hm; sw.position.y = 1.6 + Math.sin(f * 0.07) * 0.25; sw.rotation.set(f * 0.02, f * 0.03, 0); hm.position.y = 2.2 + Math.sin(f * 0.06 + 2) * 0.2; hm.rotation.z = f * 0.02; }
  if (s === 'ocean') { waveT.offset.set(f * 0.0006, f * 0.0003); boat.position.y = Math.sin(f * 0.12) * 0.08; boat.rotation.z = Math.sin(f * 0.1) * 0.03; const rk = ((f * 0.05) % 1); ripple.scale.setScalar(1 + rk * 4); ripple.material.opacity = 0.7 * (1 - rk); ripple.visible = !!S.ripple; }
};
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
const CW = 2000, CH = 2000, CM = 2.25, PAD = 200; // canvas px; design space x -200..800 (character centred at 300), y 0..1000 -> 2.25 m
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

function worldState(S, f) { setDoor(S.door); for (const c of clouds) c.visible = !S.noClouds && (S.set || 'quintal') === 'quintal'; setActive(S, f); if ((S.set || 'quintal') === 'shaft' || S.set === 'mine') { shaftLight.position.copy(camera.position); } }

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
