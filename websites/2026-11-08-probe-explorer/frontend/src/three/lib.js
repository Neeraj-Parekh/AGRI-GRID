// AGRI-GRID shared 3D building blocks (three.js r160+, no other deps).
// Every builder returns a THREE.Object3D; animated parts expose userData.tick(t, dt).
import * as THREE from 'three';
import { riceHillGeometry } from '../probe/world/rice.js';
import { n1OnStake, gatewayOnPole } from './n1.js';

/* ------------------------------------------------------------------ sun position (NOAA approximation) */
// Returns { elevation, azimuth } in radians. Azimuth measured from north, clockwise.
export function sunPosition(date = new Date(), lat = 18.52, lng = 73.85) {
  const rad = Math.PI / 180;
  const ms = date.getTime();
  const jd = ms / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * rad;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const eps = (23.439 - 0.0000004 * n) * rad;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const lst = (gmst * 15 + lng) * rad;
  const ha = lst - ra;
  const phi = lat * rad;
  const elevation = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha));
  const azimuth = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(ha));
  return { elevation, azimuth: (azimuth + 2 * Math.PI) % (2 * Math.PI) };
}

// Date for "hours" (0-24) today at the given lng's local solar-ish time (IST for India by default).
export function dateAtHour(hours, tzOffsetMin = 330) {
  const now = new Date();
  const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(utcMidnight + (hours * 60 - tzOffsetMin) * 60000);
}

/* ------------------------------------------------------------------ small helpers */
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export function mat(color, o = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...o }); }
export function mesh(geo, m, shadow = true) { const o = new THREE.Mesh(geo, m); o.castShadow = shadow; o.receiveShadow = true; return o; }
export function box(w, h, d, m) { return mesh(new THREE.BoxGeometry(w, h, d), m); }
export function cyl(r1, r2, h, m, seg = 20) { return mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); }
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.userData.canvas = c; return t;
}

export function textSprite(text, { size = 0.5, color = '#ffffff', bg = 'rgba(7,59,42,0.88)', font = '600 44px Inter, system-ui, sans-serif', pad = 22 } = {}) {
  const tmp = document.createElement('canvas').getContext('2d'); tmp.font = font;
  const w = Math.ceil(tmp.measureText(text).width) + pad * 2, h = 78;
  const tex = canvasTexture(w, h, (x) => {
    x.fillStyle = bg; const r = 26;
    x.beginPath(); x.moveTo(r, 0); x.arcTo(w, 0, w, h, r); x.arcTo(w, h, 0, h, r); x.arcTo(0, h, 0, 0, r); x.arcTo(0, 0, w, 0, r); x.fill();
    x.font = font; x.fillStyle = color; x.textBaseline = 'middle'; x.fillText(text, pad, h / 2 + 2);
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(size * w / h, size, 1); sp.renderOrder = 10; return sp;
}

/* ------------------------------------------------------------------ sky dome + stars + sun/moon */
export function buildSky(radius = 400) {
  const g = new THREE.Group();
  const uniforms = { top: { value: new THREE.Color('#6fb3e8') }, bottom: { value: new THREE.Color('#e9f3f6') }, glow: { value: new THREE.Color('#ffd9a0') }, sunDir: { value: V3(0, 1, 0) }, glowAmt: { value: 0.3 } };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 bottom; uniform vec3 glow; uniform vec3 sunDir; uniform float glowAmt; varying vec3 vP;
      void main(){ float h = clamp(vP.y*1.4+0.15,0.0,1.0); vec3 c = mix(bottom, top, pow(h,0.7));
        float s = max(dot(normalize(vP), normalize(sunDir)),0.0); c += glow*pow(s,8.0)*glowAmt + glow*pow(s,90.0)*0.6;
        gl_FragColor = vec4(c,1.0); }`,
  }));
  dome.renderOrder = -10; g.add(dome);
  // stars
  const n = 900, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = Math.random(), v = Math.random() * 0.9 + 0.08; const th = u * Math.PI * 2, ph = Math.acos(1 - v); pos[i * 3] = Math.sin(ph) * Math.cos(th) * radius * 0.95; pos[i * 3 + 1] = Math.cos(ph) * radius * 0.95; pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * radius * 0.95; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false });
  const stars = new THREE.Points(sg, starMat); g.add(stars);
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.035, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1c4 })); g.add(sunDisc);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.022, 16, 12), new THREE.MeshBasicMaterial({ color: 0xe8eef7 })); g.add(moon);
  g.userData = { uniforms, starMat, sunDisc, moon, radius };
  return g;
}

// Applies time of day to sky + lights. elevation in radians. cloud 0..1
export function applyDaylight({ sky, sun, hemi, scene, fog = true }, sp, cloud = 0) {
  const e = sp.elevation, az = sp.azimuth;
  const dir = V3(Math.sin(az) * Math.cos(e), Math.sin(e), -Math.cos(az) * Math.cos(e)); // x=east, z=-north (south toward camera +z)
  const day = smooth(-0.1, 0.25, e), golden = smooth(0.35, 0.02, Math.abs(e - 0.08)) * smooth(-0.12, 0.05, e);
  const u = sky.userData.uniforms;
  const nightTop = new THREE.Color('#0d1a3a'), nightBot = new THREE.Color('#2a3b5e');
  const dayTop = new THREE.Color('#5ea9e6').lerp(new THREE.Color('#8a98a6'), cloud * 0.8), dayBot = new THREE.Color('#e3f0f4').lerp(new THREE.Color('#c9cfd4'), cloud * 0.7);
  u.top.value.copy(nightTop).lerp(dayTop, day); u.bottom.value.copy(nightBot).lerp(dayBot, day).lerp(new THREE.Color('#f6b98a'), golden * 0.7 * (1 - cloud));
  u.sunDir.value.copy(dir); u.glowAmt.value = (0.25 + golden * 1.2) * (1 - cloud * 0.8) * day;
  sky.userData.starMat.opacity = (1 - smooth(-0.18, 0.02, e)) * (1 - cloud * 0.7);
  const R = sky.userData.radius * 0.9;
  sky.userData.sunDisc.position.copy(dir).multiplyScalar(R); sky.userData.sunDisc.visible = e > -0.05 && cloud < 0.85;
  sky.userData.moon.position.set(-dir.x * R, Math.max(0.15, -dir.y) * R, -dir.z * R); sky.userData.moon.visible = e < 0.05;
  const sunCol = new THREE.Color('#fff4e0').lerp(new THREE.Color('#ffb070'), golden);
  sun.position.copy(dir.y > 0 ? dir : V3(-dir.x, Math.max(0.3, -dir.y), -dir.z)).multiplyScalar(60);
  if (e > -0.05) { sun.color.copy(sunCol); sun.intensity = 3.2 * day * (1 - cloud * 0.75); }
  else { sun.color.set('#a9bff0'); sun.intensity = 0.9 * (1 - cloud * 0.5); } // moonlight
  hemi.intensity = 0.55 + 0.85 * day; hemi.color.copy(new THREE.Color('#bcd7ff').lerp(new THREE.Color('#e8f2ff'), day)); hemi.groundColor.set(day > 0.5 ? '#6b5a43' : '#1e2230');
  if (fog && scene.fog) scene.fog.color.copy(u.bottom.value);
  return { day, golden, night: 1 - day };
}

/* ------------------------------------------------------------------ rice (instanced, wind shader) */
export function buildRice(points, { height = 0.55, color = '#ffffff', tipColor = '#e6c45a' } = {}) {
  // Leaf-strip rice hills (several curved, twisted, drooping leaves per tiller), instanced, seeded.
  const shared = { uTime: { value: 0 }, uWind: { value: 0.5 } };
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = shared.uTime; sh.uniforms.uWind = shared.uWind;
    sh.vertexShader = 'uniform float uTime; uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 wp = instanceMatrix * vec4(0.0,0.0,0.0,1.0);
      float k = position.y * position.y;
      transformed.x += sin(uTime*1.7 + wp.x*0.6 + wp.z*0.4) * 0.22 * uWind * k;
      transformed.z += cos(uTime*1.3 + wp.x*0.3) * 0.1 * uWind * k;`);
  };
  const variants = [0, 1, 2].map((i) => riceHillGeometry(601 + i * 13, { height: 1, detail: 0 }));
  const g = new THREE.Group(); g.name = 'rice';
  let seed = 4242; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const buckets = [[], [], []];
  for (const [x, y, z] of points) { const v = Math.floor(rnd() * 3); buckets[v].push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rnd() * 6.28, 0)), new THREE.Vector3(1, 1, 1).multiplyScalar(height * (0.85 + rnd() * 0.3)))); }
  buckets.forEach((list, v) => { if (!list.length) return; const im = new THREE.InstancedMesh(variants[v], m, list.length); list.forEach((M, i) => im.setMatrixAt(i, M)); im.castShadow = true; im.receiveShadow = true; g.add(im); });
  g.userData.wind = shared;
  g.userData.setStage = (stage) => { // 0 transplant .. 1 harvest
    const h = 0.25 + 0.9 * Math.min(stage, 0.75) / 0.75; g.scale.set(1, h / 0.55 * (height / 0.55), 1);
    m.color.set(stage > 0.82 ? new THREE.Color(color).lerp(new THREE.Color(tipColor), smooth(0.82, 1, stage)) : color);
  };
  return g;
}

/* ------------------------------------------------------------------ paddy diorama (cross-section block) */
// zones: array of { id, x, z, w, d } in local units. Returns group with setWater(zoneIdx, cm), setDry(zoneIdx, 0..1)
export function buildPaddy({ w = 14, d = 8, depth = 2.2, zonesX = 2, zonesZ = 2, riceSpacing = 0.5, cutaway = true } = {}) {
  const g = new THREE.Group();
  const soilTop = mat('#6b4c32', { roughness: 1 });
  const strata = canvasTexture(512, 160, (x, W, H) => {
    const bands = [['#4a3324', 0.0], ['#6e4f35', 0.12], ['#5a3f2b', 0.38], ['#7b6045', 0.62], ['#4b3a2c', 0.8]];
    bands.forEach(([c, y], i) => { x.fillStyle = c; x.fillRect(0, y * H, W, (bands[i + 1] ? bands[i + 1][1] : 1) * H - y * H); });
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${200 + Math.random() * 40},${170 + Math.random() * 40},${120},${Math.random() * 0.18})`; x.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    x.strokeStyle = 'rgba(255,255,255,0.25)'; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(0, H * 0.31); x.lineTo(W, H * 0.31); x.stroke();
  });
  const side = mat('#ffffff', { map: strata, roughness: 1 });
  const block = mesh(new THREE.BoxGeometry(w, depth, d), [side, side, soilTop, soilTop, side, side]);
  block.position.y = -depth / 2; g.add(block);
  // bunds around edge + between zones
  const bundM = mat('#7a5c3d', { roughness: 1 });
  const bh = 0.28, bw = 0.35;
  const addBund = (x, z, lx, lz) => { const b = mesh(new THREE.BoxGeometry(lx, bh, lz), bundM); b.position.set(x, bh / 2, z); g.add(b); };
  addBund(0, -d / 2 + bw / 2, w, bw); addBund(0, d / 2 - bw / 2, w, bw); addBund(-w / 2 + bw / 2, 0, bw, d); addBund(w / 2 - bw / 2, 0, bw, d);
  for (let i = 1; i < zonesX; i++) addBund(-w / 2 + (w * i) / zonesX, 0, bw * 0.8, d);
  for (let j = 1; j < zonesZ; j++) addBund(0, -d / 2 + (d * j) / zonesZ, w, bw * 0.8);
  // water per zone
  const zones = [];
  const waterUniforms = { uTime: { value: 0 } };
  for (let j = 0; j < zonesZ; j++) for (let i = 0; i < zonesX; i++) {
    const zw = w / zonesX - bw, zd = d / zonesZ - bw;
    const cx = -w / 2 + (w / zonesX) * (i + 0.5), cz = -d / 2 + (d / zonesZ) * (j + 0.5);
    const wm = new THREE.MeshStandardMaterial({ color: '#4a9cb5', transparent: true, opacity: 0.62, roughness: 0.08, metalness: 0.2 });
    wm.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = waterUniforms.uTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        vec3 wpos = (modelMatrix*vec4(position,1.0)).xyz;
        objectNormal = normalize(vec3(sin(wpos.x*3.0+uTime*1.6)*0.06, 1.0, cos(wpos.z*2.6+uTime*1.3)*0.06));`);
    };
    const water = new THREE.Mesh(new THREE.PlaneGeometry(zw, zd, 8, 8), wm); water.rotation.x = -Math.PI / 2; water.position.set(cx, 0.06, cz); water.receiveShadow = true;
    const dryPatch = new THREE.Mesh(new THREE.PlaneGeometry(zw, zd), new THREE.MeshStandardMaterial({ color: '#9a7a52', roughness: 1, transparent: true, opacity: 0 }));
    dryPatch.rotation.x = -Math.PI / 2; dryPatch.position.set(cx, 0.012, cz); dryPatch.receiveShadow = true;
    g.add(dryPatch, water);
    zones.push({ cx, cz, zw, zd, water, dryPatch, level: 5 });
  }
  // water front faces (visible in cut-away)
  if (cutaway) {
    const frontWater = new THREE.Mesh(new THREE.PlaneGeometry(w - bw * 2, 0.16), new THREE.MeshBasicMaterial({ color: '#4a9cb5', transparent: true, opacity: 0.5, depthWrite: false }));
    frontWater.position.set(0, 0.09, d / 2 + 0.002); g.add(frontWater); g.userData.frontWater = frontWater;
  }
  // rice
  const pts = [];
  for (const z of zones) for (let x = z.cx - z.zw / 2 + 0.25; x < z.cx + z.zw / 2 - 0.1; x += riceSpacing) for (let y = z.cz - z.zd / 2 + 0.25; y < z.cz + z.zd / 2 - 0.1; y += riceSpacing) pts.push([x + (Math.random() - 0.5) * 0.08, 0, y + (Math.random() - 0.5) * 0.08]);
  const rice = buildRice(pts); g.add(rice);
  g.userData = { ...g.userData, zones, rice, waterUniforms, w, d,
    setWater(i, cm) { const z = zones[i]; if (!z) return; z.level = cm; const h = Math.max(cm, 0) * 0.025; z.water.position.y = 0.012 + h; z.water.visible = cm > 0.2; z.dryPatch.material.opacity = Math.min(1, Math.max(0, (2 - cm) / 6)); },
    tick(t) { waterUniforms.uTime.value = t; rice.userData.wind.uTime.value = t; },
  };
  return g;
}

/* ------------------------------------------------------------------ sensor node on a stake */
export function buildNode(id, { hero = false } = {}) {
  // N1 node box (display scale) hung on its stake by both C-clips, probe top beside it.
  return n1OnStake(id, { k: 3.6, hero, stakeH: 2.4 });
}

/* ------------------------------------------------------------------ gateway pole */
export function buildGateway() {
  return gatewayOnPole({ k: 3.4, poleH: 4.2, label: 'Gateway' });
}

/* ------------------------------------------------------------------ satellite (Sentinel-1 style) */
export function buildSatellite(scale = 1) {
  const g = new THREE.Group();
  const bus = box(1.2, 1.2, 1.9, mat('#d8b660', { metalness: 0.55, roughness: 0.35 })); g.add(bus);
  const foil = box(1.22, 0.3, 1.92, mat('#b48a2c', { metalness: 0.7, roughness: 0.3 })); foil.position.y = -0.3; g.add(foil);
  const sar = box(0.1, 0.7, 7.5, mat('#2b3a55', { metalness: 0.3, roughness: 0.4 })); sar.position.set(-0.75, -0.45, 0); sar.rotation.z = 0.5; g.add(sar);
  // SAR antenna tiles
  for (let i = -3; i <= 3; i++) { const t = box(0.11, 0.6, 0.9, mat('#3d5378', { metalness: 0.4 })); t.position.set(-0.8, -0.45, i * 1.05); t.rotation.z = 0.5; g.add(t); }
  const wing = box(6, 0.04, 1.4, mat('#16295e', { roughness: 0.25, metalness: 0.35 })); wing.position.set(3.7, 0.25, 0); g.add(wing);
  for (let i = 0; i < 5; i++) { const l = box(0.02, 0.05, 1.42, mat('#c9ccce', { metalness: 0.8 })); l.position.set(1.4 + i * 1.2, 0.26, 0); g.add(l); }
  const blinker = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff5a4a' })); blinker.position.set(0.6, 0.65, 0.95); g.add(blinker);
  g.scale.setScalar(scale);
  g.userData = { tick(t) { blinker.visible = (t % 1.4) < 0.15; } };
  return g;
}

// Radar beam from apex to a ground rectangle (updates each frame)
export function buildRadarBeam(color = '#5cc0dc') {
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(15), 3)); geo.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1]);
  const beam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
  const foot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }));
  foot.rotation.x = -Math.PI / 2;
  const g = new THREE.Group(); g.add(beam, foot);
  g.userData = { set(apex, cx, cz, w, d, y = 0.15, opacity = 1) {
    const a = geo.attributes.position.array;
    a.set([apex.x, apex.y, apex.z, cx - w / 2, y, cz - d / 2, cx + w / 2, y, cz - d / 2, cx + w / 2, y, cz + d / 2, cx - w / 2, y, cz + d / 2]);
    geo.attributes.position.needsUpdate = true; geo.computeBoundingSphere();
    foot.position.set(cx, y, cz); foot.scale.set(w, d, 1);
    beam.material.opacity = 0.12 * opacity; foot.material.opacity = 0.28 * opacity; g.visible = opacity > 0.01;
  } };
  return g;
}

/* ------------------------------------------------------------------ packet that arcs from A to B */
export function buildPacket(color = '#4d8af0', size = 0.09) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), new THREE.MeshBasicMaterial({ color }));
  const trail = new THREE.Mesh(new THREE.SphereGeometry(size * 2.2, 10, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, depthWrite: false }));
  m.add(trail); m.visible = false;
  m.userData = { t: 1, a: V3(0, 0, 0), b: V3(0, 0, 0), h: 1.5, speed: 0.9, onArrive: null,
    send(a, b, h = 1.5, speed = 0.9, onArrive = null) { this.a.copy(a); this.b.copy(b); this.h = h; this.speed = speed; this.t = 0; this.onArrive = onArrive; m.visible = true; },
    tick(t, dt) { if (this.t >= 1) return; this.t = Math.min(1, this.t + dt * this.speed); const k = this.t;
      m.position.lerpVectors(this.a, this.b, k); m.position.y += Math.sin(k * Math.PI) * this.h;
      if (k >= 1) { m.visible = false; if (this.onArrive) this.onArrive(); } } };
  return m;
}

/* ------------------------------------------------------------------ farmhouse */
export function buildFarmhouse() {
  const g = new THREE.Group();
  const wall = box(3, 1.9, 2.4, mat('#e7dcc9')); wall.position.y = 0.95; g.add(wall);
  const roof = mesh(new THREE.ConeGeometry(2.4, 1.2, 4), mat('#a5523a')); roof.rotation.y = Math.PI / 4; roof.position.y = 2.45; g.add(roof);
  const winMat = new THREE.MeshBasicMaterial({ color: '#2c3440' });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.45), winMat); win.position.set(0.6, 1.2, 1.205); g.add(win);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.0), new THREE.MeshBasicMaterial({ color: '#5a3a22' })); door.position.set(-0.6, 0.5, 1.205); g.add(door);
  const lamp = new THREE.PointLight('#ffc070', 0, 5, 2); lamp.position.set(0.6, 1.2, 1.6); g.add(lamp);
  g.userData = { setNight(n) { winMat.color.set(n > 0.5 ? '#ffcf7a' : '#2c3440'); lamp.intensity = n > 0.5 ? 2.5 : 0; } };
  return g;
}

/* ------------------------------------------------------------------ trees (simple low-poly) */
export function buildTree(s = 1) {
  const g = new THREE.Group();
  const trunk = cyl(0.08 * s, 0.12 * s, 0.9 * s, mat('#6b4a2e'), 6); trunk.position.y = 0.45 * s; g.add(trunk);
  const crown = mesh(new THREE.IcosahedronGeometry(0.75 * s, 0), mat('#3f7a3a', { flatShading: true })); crown.position.y = 1.35 * s; g.add(crown);
  return g;
}

/* ------------------------------------------------------------------ rain + clouds */
export function buildRain(area = 30, count = 1400, height = 14) {
  const pos = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) { const x = (Math.random() - 0.5) * area, y = Math.random() * height, z = (Math.random() - 0.5) * area * 0.6; pos.set([x, y, z, x - 0.03, y - 0.35, z], i * 6); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#c8d8ea', transparent: true, opacity: 0.0, depthWrite: false }));
  lines.userData = { tick(t, dt, amount) { lines.material.opacity = 0.55 * amount; lines.visible = amount > 0.02; if (!lines.visible) return; const a = geo.attributes.position.array;
    for (let i = 0; i < count; i++) { const k = i * 6; let y = a[k + 1] - dt * 11; if (y < 0) y += height; a[k + 1] = y; a[k + 4] = y - 0.35; } geo.attributes.position.needsUpdate = true; } };
  return lines;
}

export function buildClouds(n = 7, spread = 60, y = 16) {
  const g = new THREE.Group(); const m = mat('#ffffff', { roughness: 1, transparent: true, opacity: 0.9, flatShading: true });
  for (let i = 0; i < n; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 5; k++) { const p = mesh(new THREE.IcosahedronGeometry(1 + Math.random() * 0.9, 0), m, false); p.position.set(k * 1.1 - 2.2, Math.random() * 0.5, Math.random() * 0.8); c.add(p); }
    c.position.set((Math.random() - 0.5) * spread, y + Math.random() * 4, -10 - Math.random() * 20); c.scale.setScalar(0.8 + Math.random() * 0.8); g.add(c);
  }
  g.userData = { m, tick(t, dt, cover, wind) { g.children.forEach((c, i) => { c.position.x += dt * (0.4 + wind) * (0.6 + (i % 3) * 0.2); if (c.position.x > spread / 2) c.position.x -= spread; });
    m.opacity = 0.25 + 0.7 * cover; m.color.set(cover > 0.6 ? '#b9c1c8' : '#ffffff'); g.visible = cover > 0.05; } };
  return g;
}

/* ------------------------------------------------------------------ people (low-poly, built from primitives) */
export function buildPerson({ shirt = '#2f7d46', skin = '#b07a52', pants = '#2b3440', hat = null, sitting = false } = {}) {
  const g = new THREE.Group();
  const skinM = mat(skin, { roughness: 0.6 });
  const torso = mesh(new THREE.CapsuleGeometry(0.22, 0.5, 4, 10), mat(shirt)); torso.position.y = sitting ? 0.95 : 1.25; g.add(torso);
  const head = mesh(new THREE.SphereGeometry(0.19, 16, 12), skinM); head.position.y = torso.position.y + 0.55; g.add(head);
  // face: eyes + smile (canvas decal)
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), new THREE.MeshBasicMaterial({ map: canvasTexture(128, 128, (x) => {
    x.fillStyle = '#1b1b1b'; x.beginPath(); x.arc(44, 54, 8, 0, 7); x.arc(84, 54, 8, 0, 7); x.fill();
    x.strokeStyle = '#1b1b1b'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.arc(64, 70, 24, 0.2 * Math.PI, 0.8 * Math.PI); x.stroke();
  }), transparent: true }));
  face.position.set(0, head.position.y, 0.185); g.add(face);
  if (hat) { const h = mesh(new THREE.ConeGeometry(0.36, 0.2, 16), mat(hat)); h.position.y = head.position.y + 0.2; g.add(h); }
  const armM = mat(shirt);
  const armL = mesh(new THREE.CapsuleGeometry(0.07, 0.45, 4, 8), armM); armL.position.set(-0.3, torso.position.y + 0.02, 0); g.add(armL);
  const armR = armL.clone(); armR.position.x = 0.3; g.add(armR);
  const legM = mat(pants);
  const legL = mesh(new THREE.CapsuleGeometry(0.09, 0.55, 4, 8), legM); const legR = legL.clone();
  if (sitting) { legL.rotation.x = legR.rotation.x = -Math.PI / 2; legL.position.set(-0.11, 0.62, 0.3); legR.position.set(0.11, 0.62, 0.3); }
  else { legL.position.set(-0.11, 0.42, 0); legR.position.set(0.11, 0.42, 0); }
  g.add(legL, legR);
  g.userData = { head, armL, armR, legL, legR, walk: 0,
    tick(t, dt, walking = false) { head.rotation.y = Math.sin(t * 0.8) * 0.15; head.position.y += 0;
      if (walking) { this.walk += dt * 7; const s = Math.sin(this.walk) * 0.5; legL.rotation.x = s; legR.rotation.x = -s; armL.rotation.x = -s; armR.rotation.x = s; }
      else if (!sitting) { legL.rotation.x = legR.rotation.x = 0; armL.rotation.x = Math.sin(t * 1.2) * 0.05; armR.rotation.x = -0.6; } } };
  return g;
}

/* ------------------------------------------------------------------ phone with live screen */
export function buildPhone() {
  const g = new THREE.Group();
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 480;
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  const draw = (msg, lang = 'en') => {
    const x = canvas.getContext('2d'); x.fillStyle = '#0f1512'; x.fillRect(0, 0, 256, 480);
    x.fillStyle = '#79c95b'; x.font = '700 24px Inter, sans-serif'; x.fillText('AGRI-GRID', 22, 50);
    x.fillStyle = '#9dbdb0'; x.font = '16px Inter, sans-serif'; x.fillText('SMS', 22, 76);
    if (msg) {
      x.fillStyle = '#1d3a2c'; x.beginPath(); x.roundRect ? x.roundRect(16, 100, 224, 200, 16) : x.rect(16, 100, 224, 200); x.fill();
      x.fillStyle = '#eaf3ec'; x.font = '19px Inter, "Noto Sans Devanagari", sans-serif';
      let line = '', y = 134; for (const w of msg.split(' ')) { if (x.measureText(line + w).width > 196) { x.fillText(line, 30, y); line = ''; y += 26; } line += w + ' '; } x.fillText(line, 30, y);
    }
    tex.needsUpdate = true;
  };
  draw(null);
  const body = box(0.5, 0.95, 0.06, mat('#111', { roughness: 0.3 })); g.add(body);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.84), new THREE.MeshBasicMaterial({ map: tex })); scr.position.z = 0.032; g.add(scr);
  g.userData = { draw };
  return g;
}

/* ------------------------------------------------------------------ server rack + desk + monitor */
export function buildServer() {
  const g = new THREE.Group();
  const rack = box(1.6, 3.2, 1.2, mat('#1d2228', { roughness: 0.4, metalness: 0.3 })); rack.position.y = 1.6; g.add(rack);
  const leds = [];
  for (let i = 0; i < 9; i++) {
    const u = box(1.45, 0.24, 0.02, mat('#2a3038', { metalness: 0.4 })); u.position.set(0, 0.4 + i * 0.32, 0.61); g.add(u);
    for (let k = 0; k < 4; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshBasicMaterial({ color: '#4dff9a' })); l.position.set(-0.55 + k * 0.08, 0.4 + i * 0.32, 0.63); g.add(l); leds.push(l); }
  }
  const label = textSprite('AI server · GPU', { size: 0.3 }); label.position.set(0, 3.6, 0); g.add(label);
  g.userData = { tick(t, dt, busy = 0.3) { leds.forEach((l, i) => { l.visible = Math.sin(t * (6 + busy * 20) + i * 1.7) > 0.4 - busy; }); } };
  return g;
}

export function buildDesk(screenTexture) {
  const g = new THREE.Group();
  const top = box(2.2, 0.08, 1.0, mat('#c4a57a', { roughness: 0.6 })); top.position.y = 0.78; g.add(top);
  for (const [x, z] of [[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]]) { const l = box(0.06, 0.78, 0.06, mat('#555')); l.position.set(x, 0.39, z); g.add(l); }
  const stand = box(0.08, 0.35, 0.08, mat('#222')); stand.position.set(0, 0.99, -0.25); g.add(stand);
  const mon = box(1.3, 0.78, 0.05, mat('#111', { roughness: 0.3 })); mon.position.set(0, 1.5, -0.27); g.add(mon);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.7), new THREE.MeshBasicMaterial({ map: screenTexture })); scr.position.set(0, 1.5, -0.24); g.add(scr);
  const chair = box(0.55, 0.08, 0.55, mat('#2a3440')); chair.position.set(0, 0.5, 0.75); g.add(chair);
  const back = box(0.55, 0.6, 0.06, mat('#2a3440')); back.position.set(0, 0.85, 1.02); g.add(back);
  return g;
}

/* ------------------------------------------------------------------ illustrative SAR tile (or real image) */
export function sarTileTexture(develop = 1, seed = 7) {
  // develop 0: raw speckle; 1: classified (water blue over grey backscatter)
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return canvasTexture(256, 256, (x, W, H) => {
    const img = x.createImageData(W, H);
    const fields = []; for (let i = 0; i < 9; i++) fields.push({ x: rnd() * W, y: rnd() * H, w: 30 + rnd() * 60, h: 20 + rnd() * 50, water: rnd() > 0.45 });
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      let v = 120 + (rnd() - 0.5) * 120; let water = false;
      for (const f of fields) if (i > f.x && i < f.x + f.w && j > f.y && j < f.y + f.h) { if (f.water) { v = 30 + rnd() * 30; water = true; } else v = 150 + (rnd() - 0.5) * 80; }
      const k = (j * W + i) * 4; const g = Math.max(0, Math.min(255, v));
      if (water && develop > 0.5) { img.data[k] = 40; img.data[k + 1] = 140; img.data[k + 2] = 230; } else { img.data[k] = img.data[k + 1] = img.data[k + 2] = g; }
      img.data[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
  });
}
