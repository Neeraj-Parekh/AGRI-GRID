// AGRI-GRID farm diorama with real CC0 / NASA models (see public/models/CREDITS.md).
// One farm: 2 x 2 paddy plots, 4 sensor-node boxes (one per plot) sending ESP-NOW packets to a
// gateway by the farmhouse, a posed farmer, tree line, and an illustrative SAR satellite pass.
// Time of day follows the real sun at the site; weather drives clouds, rain and wind.
//
// Same API as before:  const s = mountSky(el, { lat, lng, nodes, weather, hour, interactive, stage, sar });
//   s.update({ nodes, weather, hour, stage, sar });  s.dispose();
import * as THREE from 'three';
import { riceHillGeometry } from '../probe/world/rice.js';
import { n1OnStake, gatewayOnPole } from './n1.js';
import * as L from './lib.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

const BASE = (import.meta.env.BASE_URL || '/') + 'models/';
const DRACO = (import.meta.env.BASE_URL || '/') + 'draco/';

// shared loader + cache (several scenes on one page reuse parsed models)
let loader = null; const cache = new Map();
function getLoader() {
  if (loader) return loader;
  loader = new GLTFLoader(); const d = new DRACOLoader(); d.setDecoderPath(DRACO); loader.setDRACOLoader(d); return loader;
}
function load(path) {
  if (!cache.has(path)) cache.set(path, new Promise((res, rej) => getLoader().load(BASE + path, g => res(g.scene), undefined, rej)));
  return cache.get(path);
}
const shadow = o => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
// some packs ship metalness 1, which renders black without an environment map (night)
const matte = (o, maxMetal = 0) => { o.traverse(c => { if (c.isMesh && c.material) { c.material = c.material.clone(); c.material.metalness = Math.min(c.material.metalness ?? 0, maxMetal); if (maxMetal === 0) c.material.roughness = Math.max(c.material.roughness ?? 1, 0.8); } }); return o; };
function fitHeight(o, h) { const b = new THREE.Box3().setFromObject(o); const s = h / Math.max(1e-6, b.max.y - b.min.y); o.scale.multiplyScalar(s); return o; }

const PLOTS = [[-5, -3.2], [5, -3.2], [-5, 3.8], [5, 3.8]], PW = 9, PD = 6.2;

// rotate a bone so its child points along worldDir
function aimBone(bone, child, worldDir) {
  bone.updateWorldMatrix(true, true);
  const a = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld), b = new THREE.Vector3().setFromMatrixPosition(child.matrixWorld);
  const cur = b.sub(a).normalize(), q = new THREE.Quaternion().setFromUnitVectors(cur, worldDir.clone().normalize());
  const pq = new THREE.Quaternion(); bone.parent.getWorldQuaternion(pq);
  const wq = new THREE.Quaternion(); bone.getWorldQuaternion(wq);
  bone.quaternion.copy(pq.invert().multiply(q.multiply(wq)));
  bone.updateWorldMatrix(false, true);
}

export function mountSky(container, opts = {}) {
  const o = { lat: 18.52, lng: 73.85, hour: null, weather: { cloud: 0.15, rain: 0, wind: 0.4 }, nodes: null, interactive: false, sar: false, ...opts }; if (o.stage == null) o.stage = 0.55; if (!o.weather) o.weather = { cloud: 0.15, rain: 0, wind: 0.4 }; if (o.lat == null) { o.lat = 18.52; o.lng = 73.85; }
  const W = () => container.clientWidth || 900, H = () => container.clientHeight || 320;
  const mobile = Math.min(window.innerWidth, window.innerHeight) < 600;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setSize(W(), H());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
  container.appendChild(renderer.domElement);
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

  const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#dde8ee', 45, 150);
  const camera = new THREE.PerspectiveCamera(28, W() / H(), 0.1, 900);
  const camBase = L.V3(9, 4.8, 23.5), camTarget = L.V3(-0.5, 2.9, -3);
  const fitCam = () => { const a = W() / H(); camera.aspect = a; camera.fov = a > 2.6 ? 24 : a > 1.7 ? 30 : 42; camera.updateProjectionMatrix(); };
  fitCam(); camera.position.copy(camBase); camera.lookAt(camTarget);

  // sky + lights
  const sky = L.buildSky(420); scene.add(sky);
  const hemi = new THREE.HemisphereLight('#e8f2ff', '#6b5a43', 0.6); scene.add(hemi);
  const moonFill = new THREE.AmbientLight('#6f86b8', 0); scene.add(moonFill);
  const sun = new THREE.DirectionalLight('#fff1d6', 3); sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 16, bottom: -14, near: 1, far: 140 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const pm = new THREE.PMREMGenerator(renderer);
  let envTex = null; // r160 has no scene.environmentIntensity, so the HDRI is switched off at night instead
  new HDRLoader().load(BASE + 'hdri/forest_slope_1k.hdr', t => { t.mapping = THREE.EquirectangularReflectionMapping; envTex = pm.fromEquirectangular(t).texture; t.dispose(); }, undefined, () => {});

  // ground, distant patchwork, hills
  const ground = L.mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: '#7d9a52', roughness: 1 }), false); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);
  const farM = [new THREE.MeshStandardMaterial({ color: '#86a85a', roughness: 1 }), new THREE.MeshStandardMaterial({ color: '#6f9448', roughness: 1 }), new THREE.MeshStandardMaterial({ color: '#a39466', roughness: 1 }), new THREE.MeshStandardMaterial({ color: '#7eaab3', roughness: 0.35 })];
  for (let gx = -9; gx <= 9; gx++) for (let gz = 2; gz <= 9; gz++) {
    if (Math.abs(gx) < 2 && gz < 3) continue;
    const m = farM[Math.abs(gx * 7 + gz * 3) % 4]; const pl = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 6.4), m);
    pl.rotation.x = -Math.PI / 2; pl.position.set(gx * 10, 0.004, -gz * 7 - 1); pl.receiveShadow = true; scene.add(pl);
  }
  for (let i = 0; i < 11; i++) { const h = L.mesh(new THREE.SphereGeometry(26 + (i * 37 % 14), 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#5b7a52', roughness: 1, flatShading: true }), false); h.scale.y = 0.28; h.position.set(-150 + i * 30, -0.5, -110 - (i * 13 % 20)); scene.add(h); }

  // paddy plots: mud, water, bunds
  const bundM = new THREE.MeshStandardMaterial({ color: '#8a6a45', roughness: 1 });
  const plots = PLOTS.map(([x, z]) => {
    const mudM = new THREE.MeshStandardMaterial({ color: '#5d4631', roughness: 1 });
    const mud = L.mesh(new THREE.BoxGeometry(PW, 0.1, PD), mudM, false); mud.position.set(x, -0.04, z); scene.add(mud);
    const watM = new THREE.MeshStandardMaterial({ color: '#5f9fb0', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.78, envMapIntensity: 1.4 });
    const wat = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.25, PD - 0.25), watM); wat.rotation.x = -Math.PI / 2; wat.position.set(x, 0.05, z); wat.receiveShadow = true; scene.add(wat);
    for (const [bx, bz, bw, bd] of [[x, z - PD / 2, PW + 0.5, 0.5], [x, z + PD / 2, PW + 0.5, 0.5], [x - PW / 2, z, 0.5, PD + 0.5], [x + PW / 2, z, 0.5, PD + 0.5]]) {
      const b = L.mesh(new THREE.BoxGeometry(bw, 0.3, bd), bundM); b.position.set(bx, 0.11, bz); scene.add(b);
    }
    return { x, z, mudM, watM, wat };
  });
  const channel = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 15), new THREE.MeshStandardMaterial({ color: '#4f8fa3', roughness: 0.1, metalness: 0.1, envMapIntensity: 1.5 })); channel.rotation.x = -Math.PI / 2; channel.position.set(-10.3, 0.03, 0.3); scene.add(channel);

  // nodes + gateway + packets + link arcs
  const nodeIds = ['A1', 'B2', 'C3', 'D4'];
  const nodes = PLOTS.map(([x, z], i) => { const n = shadow(n1OnStake(nodeIds[i], { k: 3.4, hero: i === 0, stakeH: 1.7 })); n.position.set(x + (i % 2 ? -2.6 : 2.2), 0, z + 0.6); scene.add(n); return n; });
  const gw = shadow(gatewayOnPole({ k: 3.2, poleH: 3.2 })); gw.position.set(12.2, 0, -4.6); scene.add(gw);
  const linkM = new THREE.LineDashedMaterial({ color: '#7fc4ff', dashSize: 0.3, gapSize: 0.25, transparent: true, opacity: 0.55 });
  const arcs = nodes.map(n => {
    const a = n.position.clone().add(n.userData.top), b = gw.position.clone().add(gw.userData.top), m = a.clone().lerp(b, 0.5); m.y += 2.4;
    const c = new THREE.QuadraticBezierCurve3(a, m, b); const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(40)), linkM); l.computeLineDistances(); scene.add(l); return c;
  });
  const pktM = new THREE.MeshBasicMaterial({ color: '#9fe0ff' });
  const packets = Array.from({ length: 5 }, () => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), pktM); const tr = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({ color: '#9fe0ff', transparent: true, opacity: 0.3, depthWrite: false })); p.add(tr); p.visible = false; p.userData = { t: 1, curve: null }; scene.add(p); return p; });

  // satellite + radar swath
  const satG = new THREE.Group(); scene.add(satG);
  const beam = L.buildRadarBeam('#6fd0f0'); scene.add(beam);
  let satReady = false;
  load('space/sentinel6.glb').then(s => {
    const m = matte(s.clone(true), 0.55); const b = new THREE.Box3().setFromObject(m); const size = b.getSize(new THREE.Vector3());
    m.scale.setScalar(3.6 / Math.max(size.x, size.y, size.z)); const c = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()); m.position.sub(c);
    satG.add(m); satReady = true;
  }).catch(() => { const s = L.buildSatellite(0.3); satG.add(s); satReady = true; });

  // SAR overlay (illustrative unless a real image is passed)
  const sarTex = o.sarImage ? new THREE.TextureLoader().load(o.sarImage, t => { t.colorSpace = THREE.SRGBColorSpace; }) : L.sarTileTexture(1, 5);
  const sarOverlay = new THREE.Mesh(new THREE.PlaneGeometry(PW * 2 + 1, PD * 2 + 1), new THREE.MeshBasicMaterial({ map: sarTex, transparent: true, opacity: 0, depthWrite: false }));
  sarOverlay.rotation.x = -Math.PI / 2; sarOverlay.position.set(0, 0.9, 0.3); sarOverlay.renderOrder = 5; scene.add(sarOverlay);
  let sarOn = !!o.sar, sarAmt = sarOn ? 1 : 0;

  // rice (instanced grass with wind + growth stage)
  let rice = null; const riceU = { uTime: { value: 0 }, uWind: { value: 0.4 }, uH: { value: 1 } };
  let stage = o.stage;
  function layoutRice() {
    if (!rice) return;
    const { im, base, pts } = rice, m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    const h = 0.25 + stage * 0.7;
    pts.forEach(([x, z, r1, r2], k) => { e.set(0, r1 * 6.28, 0); q.setFromEuler(e); const s = base * h * (0.85 + r2 * 0.3); sc.set(base * (0.6 + stage * 0.5), s, base * (0.6 + stage * 0.5)); p.set(x, 0.03, z); m.compose(p, q, sc); im.setMatrixAt(k, m); });
    im.instanceMatrix.needsUpdate = true;
    im.material.color.set(new THREE.Color('#ffffff').lerp(new THREE.Color('#e3c25a'), L.smooth(0.72, 1, stage)));
  }
  {
    // leaf-strip rice hills (seeded, instanced) in place of the old grass cards
    const geo = riceHillGeometry(811, { height: 1, detail: 0 }); geo.computeBoundingBox();
    const gh = geo.boundingBox.max.y; riceU.uH.value = gh;
    const pts = []; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (const [x, z] of PLOTS) for (let i = x - PW / 2 + 0.5; i < x + PW / 2 - 0.3; i += mobile ? 0.7 : 0.5) for (let j = z - PD / 2 + 0.5; j < z + PD / 2 - 0.3; j += mobile ? 0.7 : 0.5) pts.push([i + (rnd() - 0.5) * 0.1, j + (rnd() - 0.5) * 0.1, rnd(), rnd()]);
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.6, side: THREE.DoubleSide });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, riceU);
      sh.vertexShader = 'uniform float uTime; uniform float uWind; uniform float uH;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\nfloat k = clamp(position.y / uH, 0.0, 1.0);\nfloat ph = instanceMatrix[3].x * 0.6 + instanceMatrix[3].z * 0.45;\ntransformed.x += sin(uTime * 1.7 + ph) * 0.09 * k * k * uWind * uH;\ntransformed.z += cos(uTime * 1.3 + ph) * 0.05 * k * k * uWind * uH;');
    };
    const im = new THREE.InstancedMesh(geo, mat, pts.length); im.castShadow = !mobile; im.receiveShadow = true;
    rice = { im, base: 0.75 / gh, pts }; layoutRice(); scene.add(im);
  }

  // scenery: farmhouse, trees, bushes, clouds, farmer
  const houseLamp = new THREE.PointLight('#ffc070', 0, 9, 2); houseLamp.position.set(14.5, 1.6, -9); scene.add(houseLamp);
  let houseWin = null;
  load('buildings/house.gltf').then(h => { const m = shadow(matte(fitHeight(h.clone(true), 4.2))); m.position.set(15.5, 0, -10.5); m.rotation.y = -0.6; scene.add(m);
    houseWin = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), new THREE.MeshBasicMaterial({ color: '#ffcf7a', transparent: true, opacity: 0 })); houseWin.position.set(14.3, 1.5, -8.6); houseWin.rotation.y = -0.6; scene.add(houseWin); }).catch(() => {});
  const treeFiles = ['common_tree_1', 'common_tree_2', 'common_tree_3', 'pine_tree_1'];
  Promise.all(treeFiles.map(f => load(`nature/${f}.glb`))).then(ts => {
    ts = ts.map(t => matte(t.clone(true)));
    let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    // tree line behind the farm and along the sides, never in front of the camera
    for (let i = 0; i < (mobile ? 22 : 38); i++) {
      const side = i % 5 === 0 ? (rnd() < 0.5 ? -1 : 1) : 0;
      const x = side ? side * (18 + rnd() * 8) : -34 + rnd() * 68, z = side ? -16 + rnd() * 12 : -14 - rnd() * 16;
      if (x > 11 && x < 20 && z > -14 && z < -6) continue; // keep the house clear
      const t = shadow(ts[i % ts.length].clone(true)); fitHeight(t, 3 + rnd() * 2.2); t.position.set(x, 0, z); t.rotation.y = rnd() * 6.28; scene.add(t);
    }
  }).catch(() => {});
  Promise.all(['bush_1', 'bush_2', 'stone_1', 'stone_3'].map(f => load(`nature/${f}.glb`))).then(bs => {
    bs = bs.map(b => matte(b.clone(true)));
    let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 18; i++) { const b = shadow(bs[i % bs.length].clone(true)); fitHeight(b, 0.4 + rnd() * 0.5); const onLeft = i % 2; b.position.set(onLeft ? -11.5 - rnd() * 3 : -10 + rnd() * 22, 0, onLeft ? -7 + rnd() * 14 : -7.6 - rnd() * 1.5); scene.add(b); }
  }).catch(() => {});
  const cloudG = new THREE.Group(); scene.add(cloudG);
  Promise.all(['cloud_1', 'cloud_2'].map(f => load(`nature/${f}.glb`))).then(cs => {
    for (let i = 0; i < 7; i++) { const c = cs[i % 2].clone(true); fitHeight(c, 2.2 + (i % 3)); c.position.set(-50 + i * 16, 15 + (i % 3) * 2.2, -30 - (i % 4) * 9); c.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; m.castShadow = false; } }); cloudG.add(c); }
  }).catch(() => { cloudG.add(L.buildClouds(7, 90, 15)); });
  const rain = L.buildRain(46, 1600, 15); scene.add(rain);

  let farmer = null, farmerBones = null;
  load('people/farmer.gltf').then(f => {
    const m = cloneSkinned(f); shadow(m); m.traverse(c => { if (c.isSkinnedMesh) c.frustumCulled = false; }); fitHeight(m, 1.72); m.scale.multiplyScalar(0.46); // bind-pose box overstates the posed rig height
    m.position.set(9.9, 0.26, 1.4); m.rotation.y = -0.75; scene.add(m);
    const bone = n => { let r = null; m.traverse(c => { if (c.isBone && c.name === n) r = c; }); return r; };
    const names = ['LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand', 'Spine', 'Head'];
    const B = Object.fromEntries(names.map(n => [n, bone(n)]));
    m.updateMatrixWorld(true);
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(m.quaternion), right = new THREE.Vector3(1, 0, 0).applyQuaternion(m.quaternion);
    // arms down by the sides; right forearm raised as if holding a phone
    if (B.LeftArm && B.LeftForeArm) aimBone(B.LeftArm, B.LeftForeArm, new THREE.Vector3(0, -1, 0).addScaledVector(right, 0.12));
    if (B.RightArm && B.RightForeArm) aimBone(B.RightArm, B.RightForeArm, new THREE.Vector3(0, -1, 0).addScaledVector(right, -0.12).addScaledVector(fwd, 0.15));
    if (B.LeftForeArm && B.LeftHand) aimBone(B.LeftForeArm, B.LeftHand, new THREE.Vector3(0, -1, 0).addScaledVector(fwd, 0.15));
    if (B.RightForeArm && B.RightHand) aimBone(B.RightForeArm, B.RightHand, fwd.clone().multiplyScalar(0.8).add(new THREE.Vector3(0, 0.35, 0)).addScaledVector(right, 0.25));
    if (B.RightHand) { const phone = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.13, 0.012), new THREE.MeshStandardMaterial({ color: '#111', emissive: '#4d8af0', emissiveIntensity: 0.6 })); const wp = new THREE.Vector3(); B.RightHand.getWorldPosition(wp); scene.add(phone); phone.position.copy(wp).addScaledVector(fwd, 0.06); phone.lookAt(wp.clone().add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(fwd, -0.4)); farmerBones = { ...B, phone }; }
    else farmerBones = B;
    farmer = m;
  }).catch(() => {});

  // interaction
  let controls = null;
  if (o.interactive) {
    controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.target.copy(camTarget);
    controls.maxPolarAngle = Math.PI * 0.47; controls.minDistance = 8; controls.maxDistance = 60; controls.enablePan = false;
    camera.position.set(14, 10, 20);
  }

  // status chip
  const chip = document.createElement('div');
  Object.assign(chip.style, { position: 'absolute', left: '14px', top: '12px', font: '600 12px Inter, system-ui, sans-serif', color: '#fff', background: 'rgba(7,40,28,.55)', padding: '6px 11px', borderRadius: '999px', pointerEvents: 'none', backdropFilter: 'blur(8px)', zIndex: 2 });
  if (W() < 640) chip.style.top = '52px';
  container.appendChild(chip);

  // state
  let data = o.nodes || [{ id: 'A1', water: 4.8, status: 'normal' }, { id: 'B2', water: -3, status: 'alert' }, { id: 'C3', water: 3.9, status: 'normal' }, { id: 'D4', water: 2.7, status: 'watch' }];
  let weather = { ...o.weather }, hourOverride = o.hour;
  function applyData() {
    data.slice(0, 4).forEach((d, i) => {
      nodes[i].userData.setStatus(d.status || 'normal');
      const p = plots[i], w = d.water ?? 2;
      p.wat.visible = w > -1; p.wat.position.y = 0.04 + Math.max(0, w) * 0.006; p.watM.opacity = L.lerp(0.45, 0.82, L.smooth(-1, 6, w));
      p.mudM.color.set(new THREE.Color('#4a3828').lerp(new THREE.Color('#a08560'), L.smooth(-2, -18, w)));
    });
  }
  applyData();

  // loop
  const clock = new THREE.Clock(); let raf = 0, visible = true, nextPing = 0.6, pingIdx = 0, mouseX = 0, mouseY = 0;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }, { threshold: 0.01 });
  io.observe(container);
  const onMove = e => { const r = container.getBoundingClientRect(); mouseX = (e.clientX - r.left) / r.width - 0.5; mouseY = (e.clientY - r.top) / r.height - 0.5; };
  container.addEventListener('pointermove', onMove);
  const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); fitCam(); }); ro.observe(container);

  function frame() {
    raf = 0; if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    const date = hourOverride == null ? new Date() : L.dateAtHour(hourOverride);
    const sp = L.sunPosition(date, o.lat, o.lng);
    const light = L.applyDaylight({ sky, sun, hemi, scene }, sp, weather.cloud);
    // darker, bluer nights than the shared daylight model (the HDRI would otherwise keep things lit)
    hemi.intensity *= 0.2 + 0.8 * light.day; if (light.day < 0.3) sun.intensity *= 0.35;
    scene.environment = light.day > 0.12 ? envTex : null;
    moonFill.intensity = 0.55 * light.night;
    renderer.toneMappingExposure = 0.8 + 0.35 * light.day;
    sun.target.position.set(0, 0, 0);
    houseLamp.intensity = light.night > 0.5 ? 6 : 0; if (houseWin) houseWin.material.opacity = light.night > 0.5 ? 1 : 0;
    if (controls) controls.update();
    else if (!reduce) { camera.position.set(camBase.x + mouseX * 2 + Math.sin(t * 0.07) * 0.8, camBase.y - mouseY * 0.8, camBase.z); camera.lookAt(camTarget); }
    sarAmt += ((sarOn ? 1 : 0) - sarAmt) * Math.min(1, dt * 4); sarOverlay.material.opacity = 0.65 * sarAmt; sarOverlay.visible = sarAmt > 0.01;
    riceU.uTime.value = t; riceU.uWind.value = 0.3 + (weather.wind ?? 0.4) * 1.4;
    nodes.forEach(n => n.userData.tick(t, dt, light.night)); gw.userData.tick(t, dt, camera);
    rain.userData.tick(t, dt, weather.rain || 0);
    cloudG.children.forEach((c, i) => { c.position.x += dt * (0.5 + (weather.wind ?? 0.4)) * (0.6 + (i % 3) * 0.2); if (c.position.x > 70) c.position.x -= 140; c.traverse(m => { if (m.isMesh) { m.material.opacity = 0.35 + 0.6 * (weather.cloud ?? 0.2); m.material.color.set((weather.cloud ?? 0) > 0.6 ? '#c3cad0' : '#ffffff'); } }); });
    if (farmer && !reduce) { farmer.position.y = 0.26 + Math.sin(t * 1.6) * 0.004; if (farmerBones?.Head) farmerBones.Head.rotation.y = Math.sin(t * 0.4) * 0.25; }
    // packets
    nextPing -= dt;
    if (nextPing <= 0) {
      const i = pingIdx % 4, p = packets.find(q => q.userData.t >= 1);
      if (p) { nodes[i].userData.ping(); p.userData.t = 0; p.userData.curve = arcs[i]; p.visible = true; }
      pingIdx++; nextPing = reduce ? 4 : 1.1 + (pingIdx % 3) * 0.35;
    }
    packets.forEach(p => { if (p.userData.t >= 1) return; p.userData.t = Math.min(1, p.userData.t + dt * 0.75); p.position.copy(p.userData.curve.getPoint(p.userData.t)); if (p.userData.t >= 1) { p.visible = false; gw.userData.receive(); } });
    // satellite: 30 s cycle crossing the upper sky; radar swath over the farm near the middle
    const cyc = (t % 30) / 30, sx = L.lerp(-46, 46, cyc);
    satG.position.set(sx * 0.8, 8.4 + Math.sin(cyc * Math.PI) * 0.8, -18); satG.rotation.set(0.25, t * 0.05 + 0.6, 0.15);
    const over = satReady ? 1 - L.smooth(7, 18, Math.abs(sx)) : 0;
    beam.userData.set(satG.position.clone().add(L.V3(0, -0.8, 0)), sx * 0.35, 0.3, 4, PD * 2 + 1, 0.4, over);
    const hhmm = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(date);
    const phase = sp.elevation < -0.12 ? 'Night' : sp.elevation < 0.15 ? (sp.azimuth < Math.PI ? 'Dawn' : 'Dusk') : 'Day';
    chip.textContent = `${hourOverride == null ? 'Auto · ' : ''}${phase} · ${hhmm} IST${over > 0.3 ? ' · SAR pass (illustrative)' : ''}${(weather.rain || 0) > 0.2 ? ' · Rain' : ''}`;
    renderer.render(scene, camera);
    if (!reduce || t < 0.2) raf = requestAnimationFrame(frame);
    else setTimeout(() => { raf = requestAnimationFrame(frame); }, 500);
  }
  raf = requestAnimationFrame(frame);

  return {
    update(next = {}) {
      if (next.nodes) { data = next.nodes; applyData(); }
      if (next.weather) weather = { ...weather, ...next.weather };
      if ('hour' in next) hourOverride = next.hour;
      if ('stage' in next && next.stage != null) { stage = next.stage; layoutRice(); }
      if ('sar' in next) sarOn = !!next.sar;
    },
    dispose() {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); container.removeEventListener('pointermove', onMove); if (controls) controls.dispose();
      scene.traverse(x => { if (x.isInstancedMesh || (x.geometry && !x.isSkinnedMesh)) x.geometry?.dispose(); });
      pm.dispose(); renderer.dispose(); renderer.domElement.remove(); chip.remove();
    },
  };
}
