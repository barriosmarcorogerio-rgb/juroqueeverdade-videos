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
// Sertão do Ceará (origem), porto de Fortaleza + navio (x≈1700), papel do relatório.
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
// dry cracked ground
const dryC = cv(512, 512, (g, w, h) => { g.fillStyle = '#c8955a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 12000; i++) { g.fillStyle = `hsl(${24 + rr() * 16},${38 + rr() * 20}%,${44 + rr() * 22}%)`; g.fillRect(rr() * w, rr() * h, 1 + rr() * 3, 1 + rr() * 3); }
  g.strokeStyle = 'rgba(90,50,25,.55)'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { let x = rr() * w, y = rr() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (rr() - 0.5) * 60; y += (rr() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); } });
const ground = add(new THREE.PlaneGeometry(2400, 2400), std({ map: P.tex(dryC, 300, 300) }), 0, 0, 0, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
// dirt road
const roadC = cv(256, 512, (g, w, h) => { g.fillStyle = '#b7865a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { g.fillStyle = `hsl(26,${25 + rr() * 15}%,${40 + rr() * 22}%)`; g.fillRect(rr() * w, rr() * h, 2 + rr() * 3, 2 + rr() * 3); } g.fillStyle = 'rgba(90,60,40,.3)'; g.fillRect(50, 0, 34, h); g.fillRect(170, 0, 34, h); });
const road = add(new THREE.PlaneGeometry(4, 500), decal(std({ map: P.tex(roadC, 1, 50) })), 0, 0.02, 9, world, { cast: false }); road.rotation.x = -Math.PI / 2; road.rotation.z = Math.PI / 2;
// mandacaru cacti
const cactM = std({ color: '#4f7a3a' }), cactRib = std({ color: '#3f6a2e' });
const cactus = (x, z, s = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); g.rotation.y = rr() * 6; world.add(g);
  add(new THREE.CylinderGeometry(0.22, 0.26, 3.2, 10), cactM, 0, 1.6, 0, g); add(new THREE.SphereGeometry(0.22, 10, 8), cactM, 0, 3.2, 0, g);
  for (const sd of [-1, 1]) { if (rr() < 0.25) continue; const h = 1.0 + rr() * 0.8, L = 0.5 + rr() * 0.3;
    const arm = add(new THREE.CylinderGeometry(0.15, 0.15, L, 8), cactM, sd * L / 2, h, 0, g); arm.rotation.z = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.15, 0.15, 1.1 + rr() * 0.8, 8), cactM, sd * L, h + 0.55, 0, g); add(new THREE.SphereGeometry(0.15, 8, 6), cactM, sd * L, h + 1.1, 0, g); }
  return g; };
// bare caatinga trees
const barkM = std({ color: '#8a8278' });
const dryTree = (x, z, s = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); g.rotation.y = rr() * 6; world.add(g);
  add(new THREE.CylinderGeometry(0.1, 0.18, 2.0, 7), barkM, 0, 1.0, 0, g);
  for (let i = 0; i < 7; i++) { const a = rr() * 6.28, el = 0.5 + rr() * 0.6, L = 1 + rr() * 1.3; const br = add(new THREE.CylinderGeometry(0.03, 0.07, L, 5), barkM, 0, 0, 0, g);
    const dir = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)); br.position.set(dir.x * L / 2, 1.8 + dir.y * L / 2, dir.z * L / 2); br.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); }
  return g; };
const CACTI = [[-4, -6, 1.1], [6.5, -4, 0.9], [-9, 2, 1.2], [11, 3, 1.0], [3, -12, 1.3], [-14, -10, 1.0], [16, -9, 1.2], [-6, 13, 0.9], [9, 15, 1.1]];
for (const [x, z, s] of CACTI) cactus(x, z, s);
for (let i = 0; i < 70; i++) { const a = rr() * 6.28, d = 20 + rr() * 140; cactus(Math.cos(a) * d, Math.sin(a) * d, 0.8 + rr() * 0.8); }
for (const [x, z] of [[-7, -3], [8, -8], [-12, 6], [13, 9], [0, -16]]) dryTree(x, z, 1 + rr() * 0.4);
for (let i = 0; i < 60; i++) { const a = rr() * 6.28, d = 18 + rr() * 160; dryTree(Math.cos(a) * d, Math.sin(a) * d, 0.9 + rr() * 0.8); }
// rocks
const rockM = std({ color: '#a39684' });
for (let i = 0; i < 40; i++) { const a = rr() * 6.28, d = 3 + rr() * 40; const r = add(new THREE.DodecahedronGeometry(0.2 + rr() * 0.6, 0), rockM, Math.cos(a) * d, 0.1, Math.sin(a) * d, world); r.scale.y = 0.6; r.rotation.set(rr(), rr(), rr()); }
// dry grass tufts
{ const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute([-0.025, 0, 0, 0.025, 0, 0, 0.004, 1, 0.02], 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0.3, 1, 0, 0.3, 1, 0, 0.6, 1], 3));
  bg.setAttribute('color', new THREE.Float32BufferAttribute([0.45, 0.33, 0.15, 0.45, 0.33, 0.15, 0.85, 0.72, 0.42], 3));
  const N = 14000, gi = new THREE.InstancedMesh(bg, std({ vertexColors: true, side: THREE.DoubleSide }), N); const col = new THREE.Color();
  for (let k = 0; k < N; k++) { const cx = -30 + rr() * 60, cz = -25 + rr() * 45, x = cx + (rr() - 0.5) * 0.8, z = cz + (rr() - 0.5) * 0.8; if (Math.abs(z - 9) < 2.2) { dummy.position.set(0, -5, 0); } else dummy.position.set(x, 0, z);
    dummy.rotation.set((rr() - 0.5) * 0.7, rr() * 6.28, (rr() - 0.5) * 0.7); const s = 0.05 + rr() * 0.1; dummy.scale.set(0.6 + rr() * 0.6, s, 0.6); dummy.updateMatrix(); gi.setMatrixAt(k, dummy.matrix); col.setHSL(0.09 + rr() * 0.04, 0.4, 0.6 + rr() * 0.3); gi.setColorAt(k, col); }
  gi.userData.nd = plainNd; world.add(gi); }
// casa de taipa + far hills (serras)
const taipa = new THREE.Group(); taipa.position.set(-6, 0, -14); taipa.rotation.y = 0.3; world.add(taipa);
{ add(tbox(6, 2.8, 4, 2), std({ map: P.tex(cv(256, 256, (g, w, h) => { g.fillStyle = '#c99a6a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(110,70,40,${rr() * 0.25})`; g.fillRect(rr() * w, rr() * h, 3 + rr() * 6, 2); } })) }), 0, 1.4, 0, taipa);
  for (const sd of [-1, 1]) { const r = add(new THREE.BoxGeometry(6.6, 0.15, 2.5), std({ color: '#b5583a' }), 0, 3.2, sd * 1.1, taipa); r.rotation.x = sd * 0.42; }
  add(box(0.9, 1.9, 0.08), std({ color: '#3d6f8f' }), 0.8, 0.95, 2.02, taipa); add(box(0.8, 0.7, 0.08), std({ color: '#3d6f8f' }), -1.6, 1.6, 2.02, taipa); }
for (let i = 0; i < 12; i++) { const a = rr() * Math.PI * 2, d = 340 + rr() * 220; const h = add(new THREE.SphereGeometry(80 + rr() * 60, 20, 10), std({ color: i % 2 ? '#a07a58' : '#8f7a5e' }), Math.cos(a) * d, -36, Math.sin(a) * d, world, { cast: false }); h.scale.y = 0.42; }
// chalk board "ACLIMATAÇÃO"
const textTex = (w, h, fn) => { const t = P.tex(cv(w, h, fn)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1); return t; };
const fit = (g, txt, x, y, font, px, maxW) => { let s = px; do { g.font = font.replace('#', s + 'px'); s -= 2; } while (g.measureText(txt).width > maxW && s > 10); g.fillText(txt, x, y); };
const board = new THREE.Group(); board.position.set(4.2, 0, -1.2); board.rotation.y = -0.35; world.add(board);
{ const bt = textTex(1024, 640, (g, w, h) => { g.fillStyle = '#2f4a3a'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 40; i++) g.fillRect(rr() * w, rr() * h, 120, 6);
    g.fillStyle = '#f2f0e6'; g.textAlign = 'center'; fit(g, 'ACLIMATAÇÃO', w / 2, 230, '900 # Georgia, serif', 150, w - 90); g.font = '60px Georgia, serif'; fit(g, 'bicho novo + terra nova = ?', w / 2, 380, 'italic # Georgia, serif', 70, w - 120);
    g.strokeStyle = '#f2f0e6'; g.lineWidth = 8; g.beginPath(); g.moveTo(200, 470); g.lineTo(820, 470); g.stroke(); });
  add(new THREE.BoxGeometry(2.4, 1.5, 0.08), std({ map: bt }), 0, 1.7, 0, board); for (const sd of [-1, 1]) add(new THREE.BoxGeometry(0.08, 2.6, 0.08), std({ color: '#7a5434' }), sd * 1.1, 1.3, -0.08, board); }
// report paper on a crate (final)
const rep = new THREE.Group(); rep.position.set(6, 0, 6); world.add(rep);
{ add(tbox(1.0, 0.8, 0.7, 1), std({ color: '#9a7046' }), 0, 0.4, 0, rep);
  const pt = textTex(1024, 1400, (g, w, h) => { g.fillStyle = '#efe6d0'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d1a18'; g.textAlign = 'center';
    fit(g, 'RELATÓRIO DA COMISSÃO', w / 2, 140, '900 # Georgia, serif', 80, w - 140); g.fillRect(70, 170, w - 140, 6); g.textAlign = 'left';
    const L = ['1. Borboletas coletadas: 4.000', '2. Plantas secas: 1.200', '3. Pedras: muitas', '4. Mapas do sertão: 12', '5. Camelos: ...'];
    L.forEach((t, i) => fit(g, t, 90, 300 + i * 120, '# Georgia, serif', 62, w - 180)); g.textAlign = 'center'; g.fillStyle = '#9a2a24'; g.save(); g.translate(w / 2, 1050); g.rotate(-0.15); fit(g, 'ASSUNTO ENCERRADO', 0, 0, '900 # Georgia, serif', 96, w - 160); g.restore(); });
  const pp = add(new THREE.PlaneGeometry(0.6, 0.82), std({ map: pt, side: THREE.DoubleSide }), 0, 0.805, 0, rep, { cast: false }); pp.rotation.x = -Math.PI / 2; pp.rotation.z = 0.1; }
// ---------- port of Fortaleza + ship (x ≈ 1700) ----------
const PX = 1700;
const sea = add(new THREE.PlaneGeometry(1400, 1400), std({ map: P.tex(cv(256, 256, (g, w, h) => { g.fillStyle = '#2f7fa8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${0.05 + rr() * 0.15})`; g.fillRect(rr() * w, rr() * h, 10 + rr() * 20, 2); } }), 160, 160), roughness: 0.35 }), PX, 0.05, -400, world, { cast: false });
sea.rotation.x = -Math.PI / 2; const seaT = sea.material.map;
const sand = add(new THREE.PlaneGeometry(300, 120), decal(std({ color: '#e2cfa0' })), PX, 0.08, 70, world, { cast: false }); sand.rotation.x = -Math.PI / 2;
// quay
const quayM = std({ map: P.tex(P.stone(41, 36, 10, 62), 6, 1) });
add(tbox(80, 1.2, 6, 2), quayM, PX, 0.5, 12, world);
const plankM = std({ map: P.tex(P.planks(5), 1, 6) });
add(tbox(5, 0.2, 18, 2), plankM, PX + 6, 1.0, 1, world);
for (let z = -7; z <= 9; z += 3) for (const sd of [-1, 1]) add(new THREE.CylinderGeometry(0.16, 0.16, 3, 8), std({ color: '#5a4030' }), PX + 6 + sd * 2.3, -0.4, z, world);
// colonial facades
const facade = (x, z, w, h, col, rot = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; world.add(g);
  add(tbox(w, h, 5, 2), std({ color: col }), 0, h / 2 + 1.1, 0, g); add(box(w + 0.3, 0.4, 5.3), std({ color: '#f4f0e6' }), 0, h + 1.1, 0, g);
  const roofG = add(new THREE.BoxGeometry(w + 0.4, 0.2, 5.6), std({ color: '#b5583a' }), 0, h + 1.6, 0, g); roofG.rotation.x = 0.25;
  for (let i = 0; i < Math.floor(w / 2.2); i++) { const wx = -w / 2 + 1.2 + i * 2.2; add(box(1.0, 1.8, 0.1), std({ color: '#3d6f8f' }), wx, 2.4, 2.52, g); add(box(1.0, 1.4, 0.1), std({ color: '#3d6f8f' }), wx, h - 0.6 + 1.1, 2.52, g);
    add(box(1.25, 0.12, 0.15), std({ color: '#f4f0e6' }), wx, 3.35, 2.55, g); } return g; };
[[-30, 10, '#e7c25a'], [-19, 9, '#7fb0c9'], [-9, 10, '#e79a8a'], [1, 11, '#f2efe6'], [12, 9, '#9fcf8a'], [22, 10, '#e7c25a'], [33, 9, '#c9a0d9']].forEach(([dx, h, c], i) => facade(PX + dx, 20, 9.5, h * 0.8, c, Math.PI));
{ const ch = new THREE.Group(); ch.position.set(PX - 2, 0, 32); ch.rotation.y = Math.PI; world.add(ch); add(tbox(12, 11, 9, 2), std({ color: '#f4f0e6' }), 0, 6.6, 0, ch);
  for (const sd of [-1, 1]) { add(tbox(3, 17, 3, 2), std({ color: '#f4f0e6' }), sd * 4.5, 9.6, 3, ch); add(new THREE.ConeGeometry(2.1, 3, 4), std({ color: '#b5583a' }), sd * 4.5, 19.6, 3, ch).rotation.y = Math.PI / 4; } }
// ship
const ship = new THREE.Group(); ship.position.set(PX + 13, 0, -1); world.add(ship);
{ const sh = new THREE.Shape(); sh.moveTo(-11, 2.6); sh.lineTo(11, 2.6); sh.quadraticCurveTo(13, 2.4, 14, 3.6); sh.lineTo(12, 0); sh.quadraticCurveTo(0, -1.8, -10, 0); sh.lineTo(-11.5, 3.2); sh.closePath();
  const hg = new THREE.ExtrudeGeometry(sh, { depth: 6, bevelEnabled: false }); hg.translate(0, 0, -3); const hull = add(hg, std({ color: '#5a3b26' }), 0, -0.6, 0, ship); hull.rotation.y = Math.PI / 2;
  add(tbox(5.4, 0.15, 21, 2), plankM, 0, 1.95, 0, ship);
  add(box(6.1, 0.35, 23.5), std({ color: '#2a2622' }), 0, 0.2, 0, ship);
  for (const [z, h] of [[-5, 14], [5, 16]]) { add(new THREE.CylinderGeometry(0.16, 0.22, h, 8), std({ color: '#6a4a30' }), 0, 2 + h / 2, z, ship);
    for (const [y, w] of [[6, 7], [10.5, 5.5]]) { add(new THREE.CylinderGeometry(0.08, 0.08, w + 1, 6), std({ color: '#6a4a30' }), 0, 2 + y + 2.2, z, ship).rotation.z = Math.PI / 2;
      const sl = add(new THREE.PlaneGeometry(w, 4.0, 6, 4), std({ color: '#f1ead8', side: THREE.DoubleSide }), 0, 2 + y, z + 0.25, ship); const pa = sl.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const u = pa.getX(i) / w * 2; pa.setZ(i, (1 - u * u) * 0.6); } sl.geometry.computeVertexNormals(); sl.rotation.y = Math.PI / 2; } } }
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

function worldState(S, f) { for (const c of clouds) c.visible = !S.noClouds; seaT.offset.set(f * 0.0004, f * 0.0002); ship.position.y = Math.sin(f * 0.05) * 0.12; ship.rotation.z = Math.sin(f * 0.04) * 0.015; if (S.shipAt) ship.position.x = S.shipAt; else ship.position.x = PX + 13; }

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
