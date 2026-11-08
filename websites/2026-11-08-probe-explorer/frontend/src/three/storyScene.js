// "How AGRI-GRID works": one continuous 3D world driven by scroll progress 0..1.
// Chapters: space -> ground -> AI -> person -> farmer -> everyone else.
//
// const story = mountStory(el, { onChapter: i => ..., sarImage: optionalUrl });
// story.setProgress(p);  story.dispose();
import * as THREE from 'three';
import * as L from './lib.js';

export const CHAPTERS = [
  { id: 'space', from: 0.0, to: 0.16 },
  { id: 'ground', from: 0.16, to: 0.32 },
  { id: 'ai', from: 0.32, to: 0.56 },
  { id: 'person', from: 0.56, to: 0.68 },
  { id: 'farmer', from: 0.68, to: 0.86 },
  { id: 'everyone', from: 0.86, to: 1.01 },
];

const KEYS = [ // p, camera position, camera target
  [0.00, [13, 32, -4], [0, 32.5, -20]],
  [0.11, [20, 24, 20], [0, 6, -6]],
  [0.22, [9, 4.6, 13], [0, 0.9, 0]],
  [0.32, [6, 5.5, 14], [-1, 1.2, 1]],
  [0.40, [17, 7.5, 15], [24, 4, 0]],
  [0.52, [24.5, 6.5, 10.5], [26, 5, 0]],
  [0.62, [32.4, 2.9, -2.4], [28.6, 1.9, 0.4]],
  [0.72, [-4, 3.0, 10], [-9.2, 1.5, 3.4]],
  [0.84, [-2.5, 4.6, 13], [-6.5, 0.6, 1]],
  [1.00, [6, 62, 66], [6, 0, -8]],
];

export function mountStory(container, opts = {}) {
  const { onChapter = () => {}, sarImage = null } = opts;
  const W = () => container.clientWidth || 1000, H = () => container.clientHeight || 700;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); renderer.setSize(W(), H());
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#e3eef2', 140, 420);
  const camera = new THREE.PerspectiveCamera(40, W() / H(), 0.1, 900);
  const sky = L.buildSky(500); scene.add(sky);
  const hemi = new THREE.HemisphereLight('#e8f2ff', '#6b5a43', 1.1); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff4e0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 30, bottom: -30, near: 1, far: 200 }); sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);
  L.applyDaylight({ sky, sun, hemi, scene }, L.sunPosition(L.dateAtHour(9.5)), 0.1);
  sun.target.position.set(10, 0, 0);

  /* ---------- landscape */
  const ground = L.mesh(new THREE.PlaneGeometry(600, 600), L.mat('#73934c', { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; scene.add(ground);
  const tiles = []; // district fields that light up in the last chapter
  const tileMats = { water: new THREE.MeshStandardMaterial({ color: '#5aa3bd', roughness: 0.35, metalness: 0.1 }), green: L.mat('#6a9a42', { roughness: 1 }), dry: L.mat('#8f7c55', { roughness: 1 }) };
  for (let gx = -7; gx <= 8; gx++) for (let gz = -7; gz <= 4; gz++) {
    const x = gx * 9, z = gz * 7 - 6; if (Math.abs(x - 0) < 12 && Math.abs(z) < 8) continue; if (x > 16 && x < 36 && Math.abs(z) < 9) continue; if (x < -4 && x > -16 && z > -4 && z < 9) continue;
    const m = [tileMats.water, tileMats.green, tileMats.green, tileMats.dry][Math.abs(gx * 5 + gz * 3) % 4];
    const t = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 6.2), m); t.rotation.x = -Math.PI / 2; t.position.set(x, 0.005, z); t.receiveShadow = true; scene.add(t);
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.6, 4, 1), new THREE.MeshBasicMaterial({ color: '#79c95b', transparent: true, opacity: 0, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.rotation.z = Math.PI / 4; ring.scale.set(1.25, 0.95, 1); ring.position.set(x, 0.05, z); scene.add(ring);
    tiles.push({ ring, d: Math.hypot(x, z) });
  }
  for (let i = 0; i < 70; i++) { const t = L.buildTree(0.8 + Math.random() * 0.8); const a = Math.random() * Math.PI * 2, r = 22 + Math.random() * 80; t.position.set(Math.cos(a) * r + 10, 0, Math.sin(a) * r - 10); scene.add(t); }

  /* ---------- the field */
  const paddy = L.buildPaddy({ w: 14, d: 8, depth: 1.4, zonesX: 2, zonesZ: 2, riceSpacing: 0.42, cutaway: false }); scene.add(paddy);
  const Z = paddy.userData.zones; const ids = ['A1', 'B2', 'C3', 'D4'];
  const nodes = ids.map((id, i) => { const n = L.buildNode(id, { hero: i === 0 }); n.position.set(Z[i].cx - 0.9, 0, Z[i].cz + 0.3); scene.add(n); return n; });
  nodes[1].userData.setStatus('alert');
  [6.5, 1.0, 6.0, 0.0].forEach((v, i) => paddy.userData.setWater(i, v));
  const gw = L.buildGateway(); gw.position.set(8.2, 0, 1.2); scene.add(gw);
  const gwTop = gw.position.clone().add(gw.userData.top);
  const house = L.buildFarmhouse(); house.position.set(-13, 0, -6); house.rotation.y = 0.6; scene.add(house);

  // probe callout (scaled-up cutaway beside node A1)
  const probe = new THREE.Group(); probe.position.set(-2.2, 0, 5.2); scene.add(probe);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 4.2, 32, 1, true), new THREE.MeshStandardMaterial({ color: '#f4f4ef', transparent: true, opacity: 0.35, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.y = 1.0; probe.add(glass);
  const probeCap = L.cyl(0.5, 0.5, 0.35, L.mat('#262a2e'), 24); probeCap.position.y = 3.25; probe.add(probeCap);
  const soilCol = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.4), new THREE.MeshStandardMaterial({ color: '#6e4f35', transparent: true, opacity: 0.35, depthWrite: false })); soilCol.position.y = -0.1; probe.add(soilCol);
  const bands = [];
  [0.75, 0.25, -0.25, -0.75].forEach((y) => { const m = new THREE.MeshStandardMaterial({ color: '#c8742c', metalness: 0.5, roughness: 0.35, emissive: '#000000' }); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.16, 32), m); b.position.y = y; probe.add(b); bands.push(b); });
  const ew = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.02), new THREE.MeshStandardMaterial({ color: '#c8742c', emissive: '#000' })); ew.position.set(0, 2.0, 0.4); probe.add(ew);
  const probeLabel = L.textSprite('Printed dielectric probe · 4 depths + water', { size: 0.42 }); probeLabel.position.set(0, 3.9, 0); probe.add(probeLabel);

  // farmer, pump, tank
  const farmer = L.buildPerson({ shirt: '#d9822b', pants: '#3b3b3b', hat: '#e9d9a8' }); farmer.position.set(-8.6, 0, 4.6); farmer.rotation.y = 0.5; scene.add(farmer);
  const phone = L.buildPhone(); phone.scale.setScalar(0.62); phone.position.set(0.36, 1.4, 0.32); phone.rotation.set(-0.25, -0.35, 0); farmer.add(phone);
  const tank = L.cyl(0.9, 0.9, 2.0, L.mat('#2f6fb5', { roughness: 0.5 }), 24); tank.position.set(-12.4, 1.0, 0.5); scene.add(tank);
  const pump = L.box(0.6, 0.45, 0.45, L.mat('#1b1d1f')); pump.position.set(-10.9, 0.22, 0.6); scene.add(pump);
  const pipe = new THREE.CatmullRomCurve3([L.V3(-10.6, 0.35, 0.6), L.V3(-9.4, 0.7, 0.9), L.V3(-7.6, 0.45, 1.6), L.V3(-6.2, 0.15, 2.0)]);
  scene.add(L.mesh(new THREE.TubeGeometry(pipe, 30, 0.07, 8, false), L.mat('#8d969b')));
  const drops = Array.from({ length: 14 }, (_, i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#5cc0dc' })); d.userData.o = i / 14; scene.add(d); return d; });
  const smsBubble = L.textSprite('SMS: Field A1 dry at 15 cm. Irrigate today. Check B2 bund.', { size: 0.42, bg: 'rgba(29,58,44,0.92)' }); smsBubble.position.set(-8.6, 3.4, 4.6); scene.add(smsBubble);

  /* ---------- satellite + SAR tile */
  const sat = L.buildSatellite(1.0); scene.add(sat);
  const beam = L.buildRadarBeam(); scene.add(beam);
  const satLabel = L.textSprite('Sentinel-1 · C-band radar', { size: 0.9 }); scene.add(satLabel);
  let rawTex = L.sarTileTexture(0, 11), maskTex = L.sarTileTexture(1, 11);
  if (sarImage) new THREE.TextureLoader().load(sarImage, (t) => { t.colorSpace = THREE.SRGBColorSpace; rawTex = t; tileRaw.material.map = t; tileRaw.material.needsUpdate = true; });
  const tile = new THREE.Group(); scene.add(tile);
  const tileRaw = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: rawTex, transparent: true, side: THREE.DoubleSide }));
  const tileMask = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: maskTex, transparent: true, opacity: 0, side: THREE.DoubleSide })); tileMask.position.z = 0.01;
  const tileFrame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(5.2, 5.2)), new THREE.LineBasicMaterial({ color: '#8fe3ff' }));
  const tileLabel = L.textSprite('SAR snapshot', { size: 0.5 }); tileLabel.position.y = 3.2;
  tile.add(tileRaw, tileMask, tileFrame, tileLabel);

  /* ---------- AI lab: server, U-Net, anomaly panel, analyst */
  const lab = new THREE.Group(); lab.position.set(26, 0, 0); scene.add(lab);
  const floor = L.box(13, 0.15, 8, L.mat('#d9dcd3')); floor.position.y = 0.07; lab.add(floor);
  const server = L.buildServer(); server.position.set(-4.5, 0.15, -1.5); lab.add(server);
  const slabs = []; const unetX = [-3, -2, -1, 0, 1, 2, 3], unetY = [7.2, 6.2, 5.4, 5.0, 5.4, 6.2, 7.2], unetS = [1.8, 1.4, 1.0, 0.75, 1.0, 1.4, 1.8];
  unetX.forEach((x, i) => { const m = new THREE.MeshStandardMaterial({ color: '#2b3a55', emissive: '#000', transparent: true, opacity: 0.9 }); const s = new THREE.Mesh(new THREE.BoxGeometry(0.22, unetS[i], unetS[i]), m); s.position.set(x, unetY[i] - 1, 0); lab.add(s); slabs.push(s); });
  for (let i = 0; i < 3; i++) { const a = slabs[i].position, b = slabs[6 - i].position; const c = new THREE.QuadraticBezierCurve3(a.clone(), L.V3(0, a.y + 1.2 + i * 0.3, 0), b.clone()); lab.add(new THREE.Mesh(new THREE.TubeGeometry(c, 30, 0.025, 6, false), new THREE.MeshBasicMaterial({ color: '#79c95b', transparent: true, opacity: 0.6 }))); }
  const unetLabel = L.textSprite('U-Net water mapping on SAR (mIoU 0.38, measured)', { size: 0.42 }); unetLabel.position.set(0, 8.2, 0); lab.add(unetLabel);
  // anomaly chart panel
  const chartCanvas = document.createElement('canvas'); chartCanvas.width = 512; chartCanvas.height = 320;
  const chartTex = new THREE.CanvasTexture(chartCanvas); chartTex.colorSpace = THREE.SRGBColorSpace;
  const chart = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.25), new THREE.MeshBasicMaterial({ map: chartTex, side: THREE.DoubleSide })); chart.position.set(4.6, 3.2, 1.2); chart.rotation.y = -0.45; lab.add(chart);
  function drawChart(k) {
    const x = chartCanvas.getContext('2d'); x.fillStyle = '#0f1a14'; x.fillRect(0, 0, 512, 320);
    x.fillStyle = '#9dbdb0'; x.font = '600 22px Inter, sans-serif'; x.fillText('Anomaly model · node water (cm)', 18, 34);
    x.strokeStyle = '#25362c'; x.lineWidth = 1; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(30, 70 + i * 50); x.lineTo(495, 70 + i * 50); x.stroke(); }
    const n = Math.max(2, Math.floor(k * 60));
    const lines = [['A1', '#79c95b', 0.06], ['C3', '#6fb6d9', 0.07], ['D4', '#e6d36a', 0.05], ['B2', '#ff5a4a', 1.65]];
    lines.forEach(([id, c, rate], li) => { x.strokeStyle = c; x.lineWidth = id === 'B2' ? 4 : 2.5; x.beginPath();
      for (let i = 0; i < n; i++) { const px = 30 + i * 7.7, py = 90 + li * 6 + i * rate * 2.6; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); });
    if (k > 0.55) { x.fillStyle = '#ff5a4a'; x.font = '700 22px Inter, sans-serif'; x.fillText('B2 drains 27× faster than neighbours', 40, 300); }
    chartTex.needsUpdate = true;
  }
  drawChart(0);
  // analyst desk + dashboard on monitor
  const monCanvas = document.createElement('canvas'); monCanvas.width = 512; monCanvas.height = 292;
  const monTex = new THREE.CanvasTexture(monCanvas); monTex.colorSpace = THREE.SRGBColorSpace;
  function drawMonitor(state) {
    const x = monCanvas.getContext('2d'); x.fillStyle = '#f5f6f1'; x.fillRect(0, 0, 512, 292);
    x.fillStyle = '#073b2a'; x.fillRect(0, 0, 512, 40); x.fillStyle = '#fff'; x.font = '700 20px Inter, sans-serif'; x.fillText('AGRI-GRID · AGRI-001', 14, 27);
    const cols = [['#2f7d46', '#c94d3d'], ['#2f7d46', '#2f7d46']];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { x.fillStyle = cols[r][c]; x.globalAlpha = 0.8; x.fillRect(18 + c * 120, 56 + r * 100, 112, 92); } x.globalAlpha = 1;
    x.fillStyle = '#16231d'; x.font = '700 20px Inter, sans-serif'; x.fillText(state > 0 ? 'Ground ✓  Space ✓' : 'Checking…', 270, 80);
    x.font = '16px Inter, sans-serif'; x.fillStyle = '#65716b'; x.fillText('Confidence 86%', 270, 106);
    if (state > 1) { x.fillStyle = '#c94d3d'; x.font = '700 18px Inter, sans-serif'; x.fillText('Action: irrigate A1', 270, 150); x.fillText('Inspect B2 bund', 270, 176); x.fillStyle = '#2f7d46'; x.fillRect(270, 200, 150, 40); x.fillStyle = '#fff'; x.fillText('Send SMS ✓', 290, 226); }
    monTex.needsUpdate = true;
  }
  drawMonitor(0);
  const desk = L.buildDesk(monTex); desk.position.set(3, 0.15, 0); lab.add(desk);
  const analyst = L.buildPerson({ shirt: '#2d78b7', pants: '#2b3440', sitting: true }); analyst.position.set(3, 0.15, 0.75); analyst.rotation.y = 2.5; lab.add(analyst);
  const holo = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.48), new THREE.MeshBasicMaterial({ map: monTex, transparent: true, opacity: 0.95, side: THREE.DoubleSide })); holo.position.set(1.1, 2.9, -0.4); lab.add(holo);
  const holoFrame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.7, 1.58)), new THREE.LineBasicMaterial({ color: '#79c95b' })); holo.add(holoFrame);
  const analystBubble = L.textSprite('Ground and space agree. Sending advice.', { size: 0.36, bg: 'rgba(45,120,183,0.92)' }); analystBubble.position.set(3.6, 2.55, 0.6); lab.add(analystBubble);
  const fusion = L.textSprite('Discrepancy check: agree → advise · disagree → send a person', { size: 0.38 }); fusion.position.set(0, 3.6, 2.6); lab.add(fusion);

  /* ---------- stakeholders */
  const stake = [
    { name: 'Farmer · SMS in Marathi / Hindi', pos: [-10, 0, 4.6], col: '#d9822b', tag: '' },
    { name: 'FPO · cluster dashboard', pos: [-34, 0, -26], col: '#2f7d46', tag: '' },
    { name: 'Agriculture dept · verified AWD adoption', pos: [8, 0, -44], col: '#2d78b7', tag: '' },
    { name: 'Carbon & water credits · evidence trail', pos: [46, 0, -28], col: '#7a4fb0', tag: 'planned' },
    { name: 'Marketplace · low-water rice, inputs, insurance', pos: [52, 0, 14], col: '#d99a25', tag: 'planned' },
  ];
  const stakeObjs = stake.map((s, i) => {
    const g = new THREE.Group(); g.position.set(...s.pos); scene.add(g);
    if (i > 0) { const b = L.box(5, 3 + i, 4, L.mat('#eef0ea')); b.position.y = (3 + i) / 2; g.add(b); const r = L.box(5.4, 0.4, 4.4, L.mat(s.col)); r.position.y = 3 + i + 0.2; g.add(r); }
    const lab2 = L.textSprite(s.name + (s.tag ? ` (${s.tag})` : ''), { size: 2.6, bg: s.col }); lab2.position.y = i > 0 ? 6 + i + 3 : 6.5; lab2.material.opacity = 0; g.add(lab2);
    const arc = new THREE.QuadraticBezierCurve3(L.V3(26, 6, 0), L.V3((26 + s.pos[0]) / 2, 24, (0 + s.pos[2]) / 2), L.V3(s.pos[0], i > 0 ? 3 + i : 2, s.pos[2]));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(arc, 40, 0.12, 6, false), new THREE.MeshBasicMaterial({ color: s.col, transparent: true, opacity: 0, depthWrite: false })); scene.add(tube);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), new THREE.MeshBasicMaterial({ color: s.col })); dot.visible = false; scene.add(dot);
    return { g, lab: lab2, arc, tube, dot };
  });

  /* ---------- streams of packets */
  const nodePackets = Array.from({ length: 8 }, () => { const p = L.buildPacket('#4d8af0', 0.1); scene.add(p); return p; });
  const labStream = Array.from({ length: 10 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: '#4d8af0' })); m.userData.o = i / 10; m.visible = false; scene.add(m); return m; });
  const labCurve = new THREE.QuadraticBezierCurve3(gwTop.clone(), L.V3(16, 10, 0), L.V3(21.5, 3.0, -1.5));
  const smsCurve = new THREE.QuadraticBezierCurve3(L.V3(29, 2.2, 0), L.V3(10, 14, 6), L.V3(-8.3, 1.5, 4.9));
  const sms = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: '#79c95b' })); scene.add(sms);

  /* ---------- camera rig */
  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
  function rig(p) {
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
    const [p0, a0, t0] = KEYS[i], [p1, a1, t1] = KEYS[i + 1];
    const k = L.smooth(p0, p1, p);
    camPos.set(L.lerp(a0[0], a1[0], k), L.lerp(a0[1], a1[1], k), L.lerp(a0[2], a1[2], k));
    camTgt.set(L.lerp(t0[0], t1[0], k), L.lerp(t0[1], t1[1], k), L.lerp(t0[2], t1[2], k));
  }

  /* ---------- loop */
  let target = 0, progress = 0, chapter = -1, raf = 0, visible = true, nextPing = 0;
  const clock = new THREE.Clock();
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }, { threshold: 0.01 }); io.observe(container);
  const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.fov = camera.aspect < 0.7 ? 72 : camera.aspect < 0.9 ? 58 : 40; camera.updateProjectionMatrix(); }); ro.observe(container);
  let phoneState = -1, monState = -1, lastChartK = -1;

  function frame() {
    raf = 0; if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    progress += (target - progress) * (reduce ? 1 : Math.min(1, dt * 4));
    const p = progress;
    rig(p); camera.position.copy(camPos); camera.lookAt(camTgt);
    const ch = CHAPTERS.findIndex(c => p >= c.from && p < c.to); if (ch !== chapter && ch >= 0) { chapter = ch; onChapter(ch); }

    paddy.userData.tick(t); nodes.forEach(n => n.userData.tick(t, dt)); gw.userData.tick(t); sat.userData.tick(t); server.userData.tick(t, dt, L.smooth(0.38, 0.5, p) * (1 - L.smooth(0.56, 0.62, p)));
    farmer.userData.tick(t, dt, p > 0.74 && p < 0.8); analyst.userData.tick(t, dt);
    nodePackets.forEach(q => q.userData.tick(t, dt));

    // 1 · space
    sat.position.set(Math.sin(t * 0.05) * 3, 31, -20); sat.rotation.set(0.1, -0.5, 0.15);
    satLabel.position.set(sat.position.x, 35.5, -20); satLabel.material.opacity = 1 - L.smooth(0.12, 0.2, p);
    const beamOn = L.smooth(0.02, 0.06, p) * (1 - L.smooth(0.2, 0.26, p));
    beam.userData.set(sat.position.clone().add(L.V3(-0.8, -0.8, 0)), 0, 0, 16, 10, 0.2, beamOn);
    const dev = L.smooth(0.05, 0.13, p); tileMask.material.opacity = dev;
    const fly = L.smooth(0.3, 0.42, p), through = L.smooth(0.42, 0.52, p);
    const t0 = L.V3(6, 30, -17), tA = L.V3(-5, 11, -7), tB = L.V3(22, 6.5, 0), tC = L.V3(28.5, 6.5, 0);
    const drift = L.smooth(0.03, 0.12, p);
    if (fly <= 0) tile.position.lerpVectors(t0, tA, drift); else if (fly < 1) tile.position.lerpVectors(tA, tB, fly).add(L.V3(0, Math.sin(fly * Math.PI) * 6, 0)); else tile.position.lerpVectors(tB, tC, through);
    tile.scale.setScalar(L.lerp(0.8, 1.15, drift) * L.lerp(1, 0.4, fly)); tile.lookAt(camera.position);
    tile.visible = p > 0.03 && p < 0.55; tileLabel.material.opacity = 1 - fly;

    // 2 · ground: pings, probe
    const groundOn = p > 0.14 && p < 0.44;
    nextPing -= dt;
    if (groundOn && nextPing <= 0) { const k = Math.floor(Math.random() * 4); nodes[k].userData.ping(); const q = nodePackets.find(x => x.userData.t >= 1); if (q) q.userData.send(nodes[k].position.clone().add(L.V3(0, 1.85, 0.1)), gwTop, 1.8, 0.9); nextPing = 0.35; }
    const probeOn = L.smooth(0.17, 0.22, p) * (1 - L.smooth(0.32, 0.36, p));
    probe.visible = probeOn > 0.01; probe.scale.setScalar(0.6 + 0.4 * probeOn); glass.material.opacity = 0.35 * probeOn; probeLabel.material.opacity = probeOn;
    bands.forEach((b, i) => { const on = Math.max(0, Math.sin(t * 2.2 - i * 0.7)); b.material.emissive.setRGB(0.05 * on, 0.35 * on, 0.6 * on); });
    ew.material.emissive.setRGB(0, 0.25 * (0.5 + 0.5 * Math.sin(t * 3)), 0.5 * (0.5 + 0.5 * Math.sin(t * 3)));

    // 3 · AI
    const streamOn = p > 0.3 && p < 0.47;
    labStream.forEach(m => { m.visible = streamOn; if (streamOn) { const k = (m.userData.o + t * 0.35) % 1; labCurve.getPoint(k, m.position); } });
    const unet = L.smooth(0.42, 0.54, p);
    slabs.forEach((s, i) => { const on = unet * 7 > i ? 1 : 0; s.material.emissive.set(on ? (i < 3 ? '#1f6fd0' : i === 3 ? '#79c95b' : '#5cc0dc') : '#000'); s.material.emissiveIntensity = on ? 0.9 : 0; });
    chart.visible = p < 0.58;
    const ck = L.smooth(0.44, 0.56, p); if (Math.abs(ck - lastChartK) > 0.02) { drawChart(ck); lastChartK = ck; }
    fusion.material.opacity = L.smooth(0.5, 0.54, p) * (1 - L.smooth(0.57, 0.6, p));
    unetLabel.material.opacity = L.smooth(0.38, 0.42, p) * (1 - L.smooth(0.62, 0.66, p));

    // 4 · person
    const ms = p < 0.54 ? 0 : p < 0.6 ? 1 : 2; if (ms !== monState) { drawMonitor(ms); monState = ms; }
    analystBubble.material.opacity = L.smooth(0.58, 0.61, p) * (1 - L.smooth(0.68, 0.7, p));
    holo.visible = p > 0.5 && p < 0.7; holo.lookAt(camera.position);
    analyst.userData.head.rotation.x = p > 0.58 && p < 0.66 ? Math.sin(t * 5) * 0.08 : 0;

    // 5 · farmer
    const smsK = L.smooth(0.64, 0.71, p); sms.visible = smsK > 0 && smsK < 1; smsCurve.getPoint(smsK, sms.position);
    const ps = p > 0.705 ? 1 : 0; if (ps !== phoneState) { phone.userData.draw(ps ? 'Field A1: soil dry at 15 cm. Irrigate today. Also check the B2 bund.' : null); phoneState = ps; }
    smsBubble.material.opacity = L.smooth(0.71, 0.73, p) * (1 - L.smooth(0.8, 0.84, p));
    const walk = L.smooth(0.74, 0.8, p);
    farmer.position.set(L.lerp(-8.6, -10.4, walk), 0, L.lerp(4.6, 1.6, walk)); farmer.rotation.y = walk > 0 && walk < 1 ? -2.2 : walk >= 1 ? -1.4 : 0.5;
    const pumping = p > 0.8 && p < 0.97;
    drops.forEach(d => { d.visible = pumping; if (pumping) { const k = (d.userData.o + t * 0.8) % 1; pipe.getPoint(k, d.position); } });
    paddy.userData.setWater(2, L.smooth(0.8, 0.9, p) * 6);

    // 6 · everyone
    const eco = L.smooth(0.86, 0.95, p);
    tiles.forEach(tt => { tt.ring.material.opacity = eco * L.smooth(70, 10, tt.d) * (0.5 + 0.5 * Math.sin(t * 2 + tt.d * 0.2)); });
    stakeObjs.forEach((s, i) => { const k = L.smooth(0.87 + i * 0.015, 0.92 + i * 0.015, p); s.lab.material.opacity = k; s.tube.material.opacity = 0.55 * k; if (i > 0) { s.g.visible = k > 0.001; s.g.scale.setScalar(Math.max(0.001, k)); } s.dot.visible = k > 0.5; if (s.dot.visible) s.arc.getPoint((t * 0.4 + i * 0.2) % 1, s.dot.position); });

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    setProgress(p) { target = Math.min(1, Math.max(0, p)); if (!raf && visible) raf = requestAnimationFrame(frame); },
    jump(p) { target = progress = Math.min(1, Math.max(0, p)); },
    dispose() {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      scene.traverse(x => { if (x.geometry) x.geometry.dispose(); const m = x.material; if (m) (Array.isArray(m) ? m : [m]).forEach(mm => { if (mm.map) mm.map.dispose(); mm.dispose(); }); });
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
