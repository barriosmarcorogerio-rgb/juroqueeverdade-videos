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
const hillTexs = [0, 1, 2, 3].map((n) => P.tex(cv(512, 512, (g, w, h) => { const r = P.rng(300 + n); g.fillStyle = ['#78a450', '#6f9a48', '#82ac58', '#739f4c'][n]; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.fillStyle = `hsl(${62 + r() * 46},${32 + r() * 22}%,${36 + r() * 20}%)`; g.save(); g.translate(r() * w, r() * h); g.rotate(r() * 3); g.fillRect(-30 - r() * 40, -15 - r() * 25, 60 + r() * 80, 30 + r() * 50); g.restore(); }
  for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h; for (let k = 0; k < 12; k++) { g.fillStyle = `hsl(${98 + r() * 22},${38 + r() * 15}%,${17 + r() * 12}%)`; g.beginPath(); g.arc(x + (r() - 0.5) * 44, y + (r() - 0.5) * 30, 4 + r() * 7, 0, 7); g.fill(); } }
  for (let i = 0; i < 500; i++) { g.fillStyle = `hsl(108,40%,${18 + r() * 12}%)`; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 2.5, 0, 7); g.fill(); } }), 3, 1.5));
const hillGeo = (R, seed) => { const geo = new THREE.SphereGeometry(R, 72, 20, 0, Math.PI * 2, 0, Math.PI / 2), pa = geo.attributes.position, v = new THREE.Vector3(), r = P.rng(seed), f1 = r() * 6, f2 = r() * 6;
  for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); const a = Math.atan2(v.z, v.x), k = 1 + 0.12 * Math.sin(a * 3 + f1) + 0.07 * Math.sin(a * 7 + f2) + 0.04 * Math.sin(a * 13 + f1 * 2);
    v.x *= k; v.z *= k; v.y *= 0.7 + 0.45 * (0.5 + 0.5 * Math.sin(a * 2 + f2)) + 0.06 * Math.sin(a * 11 + f1); pa.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); return geo; };
for (let i = 0; i < 14; i++) { const a = rr() * Math.PI * 2, d = 330 + rr() * 200, R = 70 + rr() * 60; const h = add(hillGeo(R, 100 + i), std({ map: hillTexs[i % 4] }), Math.cos(a) * d, -2, Math.sin(a) * d, world, { cast: false }); h.scale.y = 0.42; }
// 3D grass blades around the yard
{ const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute([-0.025, 0, 0, 0.025, 0, 0, 0.004, 1, 0.02], 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0.3, 1, 0, 0.3, 1, 0, 0.6, 1], 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  bg.setAttribute('color', new THREE.Float32BufferAttribute([0.16, 0.26, 0.08, 0.16, 0.26, 0.08, 0.55, 0.72, 0.3], 3));
  const N = 90000, gm = std({ vertexColors: true, side: THREE.DoubleSide }); const gi = new THREE.InstancedMesh(bg, gm, N); const col = new THREE.Color(); let k = 0;
  while (k < N) { const x = -24 + rr() * 48, z = -16 + rr() * 34; if (Math.abs(z - 8) < 2.6) continue; if (x > 3.6 && x < 7.4 && z > -7.5 && z < 6.5) continue; if (x > -6.5 && x < 3.5 && z > -12.8 && z < -2.8) continue; if (Math.hypot(x - 3, z - 2) < 1.0) continue;
    dummy.position.set(x, 0, z); dummy.rotation.set((rr() - 0.5) * 0.5, rr() * 6.28, (rr() - 0.5) * 0.5); const s = 0.1 + rr() * 0.2; dummy.scale.set(0.8 + rr() * 0.6, s, 0.8); dummy.updateMatrix(); gi.setMatrixAt(k, dummy.matrix);
    col.setHSL(0.22 + rr() * 0.07, 0.45 + rr() * 0.2, 0.75 + rr() * 0.35); gi.setColorAt(k, col); k++; }
  gi.receiveShadow = true; gi.castShadow = false; gi.userData.nd = plainNd; world.add(gi); }
// ---- FIELD GRASS: blades over the whole countryside (denser near the yard), + large-scale colour patches on the ground ----
{ const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute([-0.04, 0, 0, 0.04, 0, 0, 0.006, 1, 0.02, 0.05, 0, 0.03, 0.12, 0, 0.03, 0.09, 0.8, 0.04], 3));
  bg.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0.3, 1, 0, 0.3, 1, 0, 0.6, 1, 0, 0.3, 1, 0, 0.3, 1, 0, 0.6, 1], 3));
  bg.setAttribute('color', new THREE.Float32BufferAttribute([0.16, 0.26, 0.08, 0.16, 0.26, 0.08, 0.55, 0.72, 0.3, 0.16, 0.26, 0.08, 0.16, 0.26, 0.08, 0.5, 0.68, 0.28], 3));
  const FIELDS = [[-60, -70, 90, 60, 0.05], [45, -80, 80, 70, -0.04], [-25, -150, 120, 60, 0.02], [70, 40, 70, 60, 0.1], [-70, 45, 70, 55, -0.08], [10, -220, 160, 80, 0]];
  const inField = (x, z) => FIELDS.some(([fx, fz, w, d, r]) => { const dx = x - fx, dz = z - fz, c = Math.cos(r), s = Math.sin(r), u = dx * c - dz * s, v = -dx * s - dz * c; return Math.abs(u) < w / 2 + 1.2 && Math.abs(v) < d / 2 + 1.2; });
  const N = 170000, gi2 = new THREE.InstancedMesh(bg, std({ vertexColors: true, side: THREE.DoubleSide }), N); const col = new THREE.Color(); let k = 0, guard = 0;
  while (k < N && guard++ < N * 6) { const r = Math.pow(rr(), 1.25) * 170, a = rr() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r + 10;
    if (Math.abs(z - 8) < 2.6 || inField(x, z) || (x > -3 && x < 7.5 && z > 18 && z < 100) || (x > -24 && x < 24 && z > -16 && z < 18)) continue;
    dummy.position.set(x, 0, z); dummy.rotation.set((rr() - 0.5) * 0.5, rr() * 6.28, (rr() - 0.5) * 0.5); const s = 0.18 + rr() * 0.3 + r * 0.002; dummy.scale.set(1.2 + rr() + r * 0.01, s, 1.2); dummy.updateMatrix(); gi2.setMatrixAt(k, dummy.matrix);
    col.setHSL(0.2 + rr() * 0.09, 0.42 + rr() * 0.2, 0.7 + rr() * 0.35); gi2.setColorAt(k, col); k++; }
  gi2.count = k; gi2.receiveShadow = true; gi2.castShadow = false; gi2.userData.nd = plainNd; world.add(gi2);
  const patch = P.tex(cv(1024, 1024, (g, w, h) => { for (let i = 0; i < 220; i++) { const x = rr() * w, y = rr() * h, r = 20 + rr() * 90, light = rr() < 0.5; const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, light ? 'rgba(170,200,90,0.35)' : 'rgba(40,70,20,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } }), 1, 1);
  patch.wrapS = patch.wrapT = THREE.ClampToEdgeWrapping;
  const pm = new THREE.MeshBasicMaterial({ map: patch, transparent: true, depthWrite: false, fog: true }); decal(pm, 1);
  const pp = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), pm); pp.rotation.x = -Math.PI / 2; pp.position.set(0, 0.012, 20); pp.userData.ndSkip = true; pp.renderOrder = 0; world.add(pp); }
// ================= Pedra Alta: muralha de 12 m, torres, cidade, horta, corda-armadilha =================
const textTex = (w, h, fn) => { const t = P.tex(cv(w, h, fn)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1); return t; };
const WZ = -40, WALLH = 12, WT = 5;
const wallCanvas = (seed, base) => cv(1024, 1024, (g, w, h) => { const r = P.rng(seed); g.fillStyle = '#3e3a33'; g.fillRect(0, 0, w, h);
  const rows = 8, rh = h / rows;
  for (let j = 0; j < rows; j++) { let x = -r() * 140; while (x < w) { const bw = 120 + r() * 160, v = (r() - 0.5) * 30, wm = (r() - 0.5) * 12, y = j * rh;
      g.fillStyle = `rgb(${base[0] + v + wm | 0},${base[1] + v | 0},${base[2] + v - wm | 0})`; g.beginPath(); g.roundRect(x + 5, y + 5, bw - 10, rh - 10, 14); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 10, y + 7, bw - 20, 7); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + 10, y + rh - 16, bw - 20, 9);
      for (let k = 0; k < 18; k++) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`; g.beginPath(); g.arc(x + 12 + r() * (bw - 24), y + 12 + r() * (rh - 24), 2 + r() * 5, 0, 6.283); g.fill(); }
      if (r() < 0.12) { g.strokeStyle = 'rgba(30,26,22,0.55)'; g.lineWidth = 3; g.beginPath(); let cx = x + bw * r(), cy = y + 8; g.moveTo(cx, cy); for (let k = 0; k < 4; k++) { cx += (r() - 0.5) * 30; cy += (rh - 16) / 4; g.lineTo(cx, cy); } g.stroke(); }
      x += bw; } } });
const wallTexA = P.tex(wallCanvas(51, [176, 166, 146]), 1, 1), wallTexB = P.tex(wallCanvas(77, [138, 130, 114]), 1, 1);
const wallM = std({ map: wallTexA }), wallDark = std({ map: wallTexB }), capM = std({ map: wallTexA, color: '#d8d2c4' });
const wallG = new THREE.Group(); world.add(wallG);
const FACE = WZ + WT / 2;
add(tbox(320, WALLH, WT, 4), wallM, 0, WALLH / 2, WZ, wallG);
add(tbox(320, 1.6, WT + 1.2, 4), wallDark, 0, 0.8, WZ, wallG);                                   // plinth
add(tbox(320, 0.45, WT + 0.7, 4), capM, 0, WALLH - 0.75, WZ, wallG);                             // cornice
{ const fl = add(new THREE.PlaneGeometry(320, WT - 0.2), std({ map: P.tex(P.stone(61, 34, 10, 58, 160, 120), 80, 1.2) }), 0, WALLH + 0.012, WZ, wallG, { cast: false }); fl.rotation.x = -Math.PI / 2; }
for (let x = -158; x <= 158; x += 2.6) { add(tbox(1.5, 1.6, 0.7, 4), wallM, x, WALLH + 0.8, FACE - 0.35, wallG); add(tbox(1.75, 0.18, 0.9, 4), capM, x, WALLH + 1.69, FACE - 0.35, wallG); }
add(tbox(320, 0.55, 0.4, 4), wallM, 0, WALLH + 0.27, WZ - WT / 2 + 0.2, wallG);                  // low inner parapet
for (let x = -152; x <= 152; x += 16) { if (Math.abs(x) < 7 || Math.abs(x % 30) < 4 || Math.abs(x % 30) > 26) continue; add(tbox(1.8, WALLH - 1.2, 1.0, 4), wallM, x, (WALLH - 1.2) / 2, FACE + 0.5, wallG); add(tbox(2.0, 0.3, 1.2, 4), capM, x, WALLH - 1.05, FACE + 0.5, wallG); }
// grime + moss along the bottom of both faces
{ const gc = cv(2048, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(30,28,20,0)'); gr.addColorStop(1, 'rgba(30,28,20,0.55)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = P.rng(5); for (let i = 0; i < 90; i++) { const x = r() * w, y = h * (0.45 + r() * 0.55), rw = 20 + r() * 70; g.fillStyle = `rgba(${60 + r() * 20 | 0},${78 + r() * 20 | 0},${40 + r() * 15 | 0},${0.12 + r() * 0.18})`; g.beginPath(); g.ellipse(x, y, rw, rw * 0.35, 0, 0, 6.283); g.fill(); }
    for (let i = 0; i < 60; i++) { const x = r() * w; g.fillStyle = 'rgba(25,22,18,0.18)'; g.fillRect(x, 0, 3 + r() * 6, h * (0.3 + r() * 0.7)); } });
  for (const [z, ry] of [[FACE + 0.03, 0], [WZ - WT / 2 - 0.03, Math.PI]]) for (const [cx, w] of [[-82.5, 155], [82.5, 155]]) { const t = P.tex(gc, w / 40, 1); const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.8 }); decal(m, 2); const pl = add(new THREE.PlaneGeometry(w, 3.6), m, cx, 3.4, z, wallG, { cast: false }); pl.rotation.y = ry; pl.userData.ndSkip = true; } }
for (let x = -150; x <= 150; x += 30) { if (Math.abs(x) < 1) continue; add(new THREE.CylinderGeometry(4, 4.6, WALLH + 5, 24), std({ map: P.tex(wallCanvas(52 + x, [140, 133, 118]), 3, 2) }), x, (WALLH + 5) / 2, WZ, wallG);
  add(new THREE.CylinderGeometry(4.5, 4.5, 0.5, 24), capM, x, WALLH + 5.2, WZ, wallG);
  add(new THREE.ConeGeometry(4.9, 5.5, 24), std({ color: '#8a3a28' }), x, WALLH + 8.2, WZ, wallG);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.2), std({ map: P.tex(cv(64, 160, (g, w, h) => { g.fillStyle = '#a82a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c84b'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 10, w, 10); g.beginPath(); g.moveTo(w / 2, 50); g.lineTo(w - 14, 90); g.lineTo(w / 2, 130); g.lineTo(14, 90); g.fill(); }), 1, 1), side: THREE.DoubleSide }));
  fl.position.set(x, WALLH + 1.8, WZ + 4.62); wallG.add(fl); }
// gate: stone frame with arch lintel + iron-banded doors
add(box(7, 9, 0.6), std({ map: P.tex(P.planks(53), 2, 1), color: '#8a6040' }), 0, 4.5, FACE + 0.2, wallG);
for (const sd of [-1, 1]) add(box(0.3, 9, 0.3), std({ color: '#3a3a3a' }), sd * 1.8, 4.5, FACE + 0.55, wallG);
for (const y of [1.6, 4.5, 7.4]) add(box(7, 0.28, 0.12), std({ color: '#2e2e30', metalness: 0.4 }), 0, y, FACE + 0.56, wallG);
for (const sd of [-1, 1]) add(tbox(1.4, 10.2, 1.6, 4), capM, sd * 4.2, 5.1, FACE + 0.3, wallG);
add(tbox(9.8, 1.6, 1.6, 4), capM, 0, 10.0, FACE + 0.3, wallG); add(tbox(1.2, 1.9, 1.75, 4), wallDark, 0, 10.0, FACE + 0.32, wallG);
// 3D ropes (grapple lines): world.ropes = [[x1,y1,z1,x2,y2,z2], ...]  (x2..z2 = where the hook bites)
// rope = sagging braided tube; hook = iron shank + ring + 3 curled claws biting into the target, plus a puff of stone chips
const ropeTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#d6bf8e'; g.fillRect(0, 0, 64, 256);
  for (let y = -64; y < 320; y += 16) { g.strokeStyle = '#9c8457'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, y); g.lineTo(64, y + 32); g.stroke(); g.strokeStyle = '#efe0b8'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y + 6); g.lineTo(64, y + 38); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();
const ropePool = []; { const hm = std({ color: '#9aa3ad', metalness: 0.55, roughness: 0.35, emissive: '#22262c' }), cm = std({ color: '#8a8478' });
  for (let i = 0; i < 6; i++) { const rm = std({ color: '#f4e2b2', map: ropeTex.clone(), emissive: '#4a3a1c' }); rm.map.needsUpdate = true;
    const ink = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: '#1a1418', side: THREE.BackSide })); world.add(ink);
    const m = new THREE.Mesh(new THREE.BufferGeometry(), rm); m.castShadow = true; world.add(m);
    const h = new THREE.Group(); world.add(h); const hk = new THREE.Group(); hk.scale.setScalar(1.7); h.add(hk);
    add(new THREE.CylinderGeometry(0.045, 0.055, 0.62, 10), hm, 0, -0.22, 0, hk);                       // shank
    add(new THREE.TorusGeometry(0.09, 0.025, 8, 16), hm, 0, -0.58, 0, hk).rotation.y = Math.PI / 2;      // eye ring (rope tied here)
    add(new THREE.ConeGeometry(0.06, 0.16, 10), hm, 0, 0.13, 0, hk);                                    // nose
    for (let k = 0; k < 3; k++) { const cl = new THREE.Group(); cl.rotation.y = k * Math.PI * 2 / 3; hk.add(cl);
      const arc = add(new THREE.TorusGeometry(0.2, 0.032, 8, 14, Math.PI * 0.95), hm, 0.2, 0.0, 0, cl); arc.rotation.z = Math.PI * 0.02;   // curls back toward the rope
      const tip = add(new THREE.ConeGeometry(0.04, 0.14, 8), hm, 0.4, -0.04, 0, cl); tip.rotation.z = Math.PI; }
    const chips = new THREE.Group(); h.add(chips);
    for (let k = 0; k < 7; k++) { const c = add(new THREE.DodecahedronGeometry(0.05 + (k % 3) * 0.025), cm, 0, 0, 0, chips); c.userData.v = [Math.cos(k * 2.4) * 0.5, -0.25 - (k % 4) * 0.12, Math.sin(k * 2.4) * 0.5]; }
    ropePool.push([m, h, chips, ink]); } }
const _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
const setRopes = (R, f = 0) => ropePool.forEach(([m, h, chips, ink], i) => { const r = R && R[i]; m.visible = h.visible = ink.visible = !!r; if (!r) return;
  const a = new THREE.Vector3(r[0], r[1], r[2]), b = new THREE.Vector3(r[3], r[4], r[5]); _d.subVectors(b, a); const L = _d.length(), dir = _d.clone().normalize();
  const horiz = Math.hypot(_d.x, _d.z) / L, sag = 0.035 * L * horiz;                                  // taut-ish sag, none when hanging straight down
  const mid = a.clone().lerp(b, 0.5); mid.y -= sag; const end = b.clone().addScaledVector(dir, -1.0);   // rope ends at the hook's eye ring
  const curve = new THREE.QuadraticBezierCurve3(a, mid, end); m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(curve, 24, 0.045, 8, false); ink.geometry.dispose(); ink.geometry = new THREE.TubeGeometry(curve, 24, 0.065, 8, false);
  m.material.map.repeat.set(1, L * 2.2);
  h.position.copy(b).addScaledVector(dir, 0.08); h.quaternion.setFromUnitVectors(_up, dir);              // nose buried a little in the stone
  const ph = r[6] ?? Math.min(1, f / 14); chips.visible = ph < 1; chips.children.forEach((c) => { const v = c.userData.v; c.position.set(v[0] * ph, v[1] * ph - 1.2 * ph * ph, v[2] * ph); c.rotation.set(ph * 5, ph * 3, 0); c.scale.setScalar(Math.max(0.01, 1 - ph)); }); });
// city houses
const houseCol = ['#e7c25a', '#7fb0c9', '#e79a8a', '#f2efe6', '#9fcf8a', '#c9a0d9', '#e0b080'];
for (let i = 0; i < 60; i++) { const x = -110 + rr() * 220, z = WZ - 12 - rr() * 90; if (Math.abs(x) < 6 && z > WZ - 25) continue; const w = 5 + rr() * 4, h = 5 + rr() * 6, d = 5 + rr() * 3;
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = (rr() - 0.5) * 0.3; world.add(g);
  add(tbox(w, h, d, 2), std({ color: houseCol[i % houseCol.length] }), 0, h / 2, 0, g); const r = add(new THREE.ConeGeometry(Math.max(w, d) * 0.75, 3, 4), std({ color: '#a8482e' }), 0, h + 1.5, 0, g); r.rotation.y = Math.PI / 4;
  for (let k = 0; k < 2; k++) add(box(1, 1.3, 0.1), std({ color: '#2b3a4a' }), -w / 4 + k * w / 2, h * 0.6, d / 2 + 0.03, g); }
{ const ch = new THREE.Group(); ch.position.set(10, 0, WZ - 50); world.add(ch); add(tbox(14, 14, 20, 3), std({ color: '#efe8da' }), 0, 7, 0, ch); add(tbox(6, 30, 6, 3), std({ color: '#efe8da' }), 0, 15, 12, ch); add(new THREE.ConeGeometry(5, 9, 4), std({ color: '#7a3a2a' }), 0, 34.5, 12, ch).rotation.y = Math.PI / 4; }
// vegetable garden outside the wall
const horta = new THREE.Group(); horta.position.set(14, 0, WZ + 12); world.add(horta);
{ const lettuce = std({ color: '#7ac04a' }); for (let i = 0; i < 6; i++) for (let j = 0; j < 10; j++) { const l = add(new THREE.SphereGeometry(0.35, 10, 8), lettuce, -4 + j * 0.9, 0.25, -2 + i * 0.9, horta); l.scale.y = 0.7; }
  const soil = add(new THREE.PlaneGeometry(10, 6), decal(std({ color: '#6a4a2e' }), 2), 0, 0.02, 0.2, horta, { cast: false }); soil.rotation.x = -Math.PI / 2; }
// trip rope between two posts, ankle height (cap 10)
const tripG = new THREE.Group(); tripG.position.set(0, 0, 20); world.add(tripG);
{ for (const sd of [-1, 1]) add(new THREE.CylinderGeometry(0.25, 0.3, 2.2, 10), std({ color: '#6a4a30' }), sd * 12, 1.1, 0, tripG);
  add(new THREE.CylinderGeometry(0.06, 0.06, 24, 8), std({ color: '#d9c49a' }), 0, 0.9, 0, tripG).rotation.z = Math.PI / 2; }
// lettuce carts (final)
const carts = new THREE.Group(); carts.position.set(-8, 0, 30); world.add(carts);
for (let c = 0; c < 4; c++) { const g = new THREE.Group(); g.position.set(c * 5, 0, 0); carts.add(g); add(tbox(3, 1, 2, 1), std({ color: '#8a6040' }), 0, 1.0, 0, g);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 14), std({ color: '#4a3020' }), x, 0.4, z * 1.05, g).rotation.x = Math.PI / 2;
  for (let i = 0; i < 9; i++) add(new THREE.SphereGeometry(0.38, 10, 8), std({ color: '#7ac04a' }), -0.9 + (i % 3) * 0.9, 1.7, -0.6 + Math.floor(i / 3) * 0.6, g); }
// height chart board on the wall walkway (Wadlow comparison)
const chart = new THREE.Group(); chart.position.set(-6, WALLH, WZ - 1.2); world.add(chart);
{ const t = textTex(512, 1024, (g, w, h) => { g.fillStyle = '#efe6d0'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d1a18'; g.font = '700 40px Georgia, serif'; g.textAlign = 'left';
    for (let m = 0; m <= 30; m++) { const y = h - m * h / 30; g.fillRect(0, y - 2, m % 10 === 0 ? 120 : 60, 4); if (m % 5 === 0) g.fillText((m / 10).toFixed(1).replace('.', ',') + ' m', 140, y + 14); }
    g.fillStyle = '#c0302c'; const yW = h - 27.2 * h / 30; g.fillRect(0, yW - 3, w, 6); g.fillText('2,72 m', 300, yW - 14); g.fillStyle = '#2f5f9a'; const yH = h - 17.5 * h / 30; g.fillRect(0, yH - 3, w, 6); g.fillText('1,75 m', 300, yH - 14); });
  add(new THREE.BoxGeometry(1.5, 3.0, 0.08), std({ map: t }), 0, 1.5, 0, chart); }
// ===== A Muralha (ep. 1): sino, rachadura, floresta, clareira, pegadas =====
const BELLX = -8, BELLZ = WZ - 1.3;
const bellT = new THREE.Group(); bellT.position.set(BELLX, WALLH, BELLZ); world.add(bellT);
const bellPiv = new THREE.Group(); bellPiv.position.set(0, 3.3, 0); bellT.add(bellPiv);
{ const wood = std({ color: '#5a3a24' }); for (const sd of [-1, 1]) add(box(0.25, 3.6, 0.25), wood, sd * 1.1, 1.8, 0, bellT); add(box(2.6, 0.3, 0.35), wood, 0, 3.55, 0, bellT);
  const rf = add(new THREE.ConeGeometry(2.0, 1.2, 4), std({ color: '#7a3a2a' }), 0, 4.3, 0, bellT); rf.rotation.y = Math.PI / 4;
  const prof = []; for (let i = 0; i <= 14; i++) { const t = i / 14; prof.push(new THREE.Vector2(0.18 + 0.55 * Math.pow(t, 1.8) + (t > 0.9 ? (t - 0.9) * 1.2 : 0), -t * 1.25)); }
  const bm = std({ color: '#b08a3a', metalness: 0.6, roughness: 0.45 }); bm.side = THREE.DoubleSide;
  add(new THREE.LatheGeometry(prof, 28), bm, 0, -0.05, 0, bellPiv); add(new THREE.SphereGeometry(0.14, 10, 8), std({ color: '#3a2a1a' }), 0, -1.15, 0, bellPiv);
  const rope = add(new THREE.CylinderGeometry(0.03, 0.03, 3.0, 6), std({ color: '#d9c49a' }), 0.5, -1.7, 0, bellPiv); }
const crackTex = (seed, big) => P.tex(cv(256, 512, (g, w, h) => { const r = P.rng(seed); g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(20,14,12,0.95)'; g.lineCap = 'round'; g.lineJoin = 'round';
  const main = []; let x = w / 2; for (let y = 10; y < h - 10; y += 24) { x += (r() - 0.5) * 50; x = Math.max(40, Math.min(w - 40, x)); main.push([x, y]); }
  g.lineWidth = big ? 34 : 12; g.beginPath(); main.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  if (big) { g.fillStyle = 'rgba(8,6,6,0.98)'; g.beginPath(); main.forEach(([x, y], i) => { const k = Math.sin(i / main.length * Math.PI) * 60; i ? g.lineTo(x - k, y) : g.moveTo(x - k, y); }); for (let i = main.length - 1; i >= 0; i--) { const [x, y] = main[i], k = Math.sin(i / main.length * Math.PI) * 60; g.lineTo(x + k, y); } g.fill(); }
  g.lineWidth = big ? 8 : 5; for (let k = 0; k < 9; k++) { const [x0, y0] = main[(r() * main.length) | 0]; g.beginPath(); g.moveTo(x0, y0); let xx = x0, yy = y0; for (let j = 0; j < 4; j++) { xx += (r() - 0.5) * 60; yy += r() * 30; g.lineTo(xx, yy); } g.stroke(); } }), 1, 1);
const crackA = [crackTex(7, false), crackTex(7, true)];
const cracks = [];
for (const [x, sideZ, sgn] of [[-6.2, WZ + WT / 2 + 0.03, 1], [-6.2, WZ - WT / 2 - 0.03, -1]]) {
  const m = new THREE.MeshBasicMaterial({ map: crackA[0], transparent: true, depthWrite: false }); decal(m, 2);
  const pl = add(new THREE.PlaneGeometry(3.2, 7.5), m, x, 4.2, sideZ, wallG, { cast: false }); if (sgn < 0) pl.rotation.y = Math.PI; pl.userData.ndSkip = true; cracks.push(pl); }
// forest beyond the fields + clearing (0, 0, 110)
const forestG = new THREE.Group(); world.add(forestG);
{ let n = 0, guard = 0; while (n < 46 && guard++ < 400) { const x = -48 + rr() * 96, z = 72 + rr() * 80; if (Math.hypot(x, z - 110) < 15) continue; if (Math.abs(x - 2) < 4 && z < 100) continue; const t = oak(x, z, 1.4 + rr() * 0.8, 22); world.remove(t); forestG.add(t); n++; } }
// giant footprints from the gate to the clearing
const prints = new THREE.Group(); world.add(prints);
{ const pm = decal(std({ color: '#4a3a24', transparent: true, opacity: 0.75 }), 3); for (let i = 0; i < 17; i++) { const z = 22 + i * 4.6, x = 2 + (i % 2 ? 1.4 : -1.4) + Math.sin(i * 0.7) * 1.5;
  const e = add(new THREE.CircleGeometry(1, 24), pm, x, 0.04, z, prints, { cast: false }); e.rotation.x = -Math.PI / 2; e.scale.set(1.3, 2.6, 1); e.userData.ndSkip = true; } }
const setWorld = (S, f) => { tripG.visible = !!S.trip; carts.visible = !!S.carts; chart.visible = !!S.chart; setRopes(S.ropes, S.a != null ? f - S.a : 99);
  bellPiv.rotation.z = S.bell ? Math.sin(f * 0.9) * 0.45 : 0;
  for (const c of cracks) { c.visible = !!S.crack; c.material.map = crackA[S.crack === 2 ? 1 : 0]; c.scale.setScalar(S.crack === 2 ? 1.25 : 1); }
  prints.visible = !!S.prints; };
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

function worldState(S, f) { setDoor(S.door); for (const c of clouds) c.visible = !S.noClouds; setWorld(S, f); }

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
