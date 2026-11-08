// The farm grid: four AWD plots split by bunds, nodes A1 (P1 + solar) and B2, C3, D4 (P2) on their stakes,
// the farmhouse with the gateway (Prototype on the wall / Field on a mast), tank and 12 V pump feeding plot A,
// and an illustrative C-band SAR satellite pass. Plot sizes are compact for the frame (stated in captions).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { materials } from '../models/materials.js';
import { buildNodeBox } from '../models/node.js';
import { buildGatewayPrototype, buildGatewayField, mainsPlug } from '../models/gateway.js';
import { WORLD, nodeBoxLayout, cablePath, probeParts, bundHeightAt } from '../spec/layout.js';
import { frameShadow } from '../core/stage.js';
import { seededRandom, canvas2d, canvasTexture, makeNoise2, fbm } from '../core/util.js';
import { heightToNormal, grainNormal, waterNormal } from '../core/textures.js';
import { riceField } from './rice.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { skyTexture } from './field.js';

const mm = (v) => v / 1000;
const placed = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const mk = (g, m, name, cast = true, rec = true) => { const o = new THREE.Mesh(g, m); o.name = name || ''; o.castShadow = cast; o.receiveShadow = rec; return o; };

const PW = 9, PD = 7, G = 0.3; // plot width (x), depth (z), half bund base
export const PLOTS = {
  A: { x0: -G - PW, x1: -G, z0: G, z1: G + PD },
  B: { x0: G, x1: G + PW, z0: G, z1: G + PD },
  C: { x0: -G - PW, x1: -G, z0: -G - PD, z1: -G },
  D: { x0: G, x1: G + PW, z0: -G - PD, z1: -G },
};
const EDGE_X = 2 * G + PW, EDGE_Z = 2 * G + PD; // outer bund centrelines
// Node assemblies use the diorama layout (probe at origin, bund centre at +x 0.36 m) rotated onto a bund.
export const NODES = {
  A1: { plot: 'A', pos: [-0.36, 0, 3.8], rot: 0, hero: true },
  B2: { plot: 'B', pos: [0.36, 0, 5.6], rot: Math.PI, hero: false },
  C3: { plot: 'C', pos: [-4.5, 0, -0.36], rot: -Math.PI / 2, hero: false },
  D4: { plot: 'D', pos: [0.36, 0, -3.8], rot: Math.PI, hero: false },
};
export const HOUSE = { x: -14.6, z: 3.0, w: 6, d: 4.6, h: 2.8 };

function plaster() {
  const w = 256; const [c, x] = canvas2d(w, w); const img = x.createImageData(w, w); const n = makeNoise2(71); const H = new Float32Array(w * w);
  for (let j = 0; j < w; j += 1) for (let i = 0; i < w; i += 1) { const f = fbm(n, i / 18, j / 18, 4); const k = (j * w + i) * 4; const v = 228 + f * 18; img.data[k] = v; img.data[k + 1] = v - 6; img.data[k + 2] = v - 16; img.data[k + 3] = 255; H[j * w + i] = f; }
  x.putImageData(img, 0, 0); const map = canvasTexture(c); map.wrapS = map.wrapT = THREE.RepeatWrapping;
  return { map, normal: heightToNormal(H, w, w, 1.5) };
}
function tiles() {
  const W = 256, H = 256; const [c, x] = canvas2d(W, H); const Hh = new Float32Array(W * H); const r = seededRandom(72);
  for (let j = 0; j < H; j += 1) for (let i = 0; i < W; i += 1) {
    const row = Math.floor(j / 32), off = (row % 2) * 16; const u = ((i + off) % 32) / 32, v = (j % 32) / 32;
    const curve = Math.sin(u * Math.PI); const hgt = curve * (0.4 + 0.6 * v);
    Hh[j * W + i] = hgt;
  }
  const img = x.createImageData(W, H);
  for (let j = 0; j < H; j += 1) for (let i = 0; i < W; i += 1) { const k = (j * W + i) * 4; const h = Hh[j * W + i]; const g = r() * 10; img.data[k] = 150 + h * 50 + g; img.data[k + 1] = 72 + h * 26 + g; img.data[k + 2] = 48 + h * 16 + g; img.data[k + 3] = 255; }
  x.putImageData(img, 0, 0); const map = canvasTexture(c); map.wrapS = map.wrapT = THREE.RepeatWrapping;
  return { map, normal: heightToNormal(Hh, W, H, 4) };
}

/** Above-ground part of a probe (white tube, cap, gland) for wide shots; the rest is in the soil. */
function probeTop(kind) {
  const M = materials(); const P = probeParts(kind);
  const g = new THREE.Group(); g.scale.setScalar(0.001);
  const top = kind === 'P1' ? 140 : 100;
  g.add(mk(new THREE.CylinderGeometry(P.rOut, P.rOut, top + 2, 64), M.petgWhite, 'tube')).position.y = top / 2 - 1;
  const capProf = [[P.rOut, P.cap.y0], [P.cap.r - 0.8, P.cap.y0], [P.cap.r, P.cap.y0 + 0.8], [P.cap.r, P.cap.y1 - 1.2], [P.cap.r - 1.2, P.cap.y1], [0, P.cap.y1]].map(([r, y]) => new THREE.Vector2(r, y));
  g.add(mk(new THREE.LatheGeometry(capProf, 64), M.petgWhite, 'cap'));
  const hexR = P.gland.hexAF / 2 / Math.cos(Math.PI / 6);
  g.add(placed(mk(new THREE.CylinderGeometry(hexR, hexR, 4, 6), M.nylon, 'hex'), 0, P.cap.y1 + 2, 0));
  g.add(placed(mk(new THREE.CylinderGeometry(4, 7.2, 9, 48), M.nylon, 'dome'), 0, P.cap.y1 + 8.5, 0));
  return g;
}

export function createFarm(stage) {
  const M = materials();
  const scene = new THREE.Scene(); scene.name = 'farm';
  const tier = stage.tierSpec;
  scene.environment = stage.envs.studio; scene.environmentIntensity = 0.5;
  stage.fieldEnvReady.then((env) => { scene.environment = env; });
  scene.background = skyTexture();
  scene.fog = new THREE.Fog('#e6ece9', 60, 170);

  const hemi = new THREE.HemisphereLight('#eaf4ff', '#7a6a55', 0.55); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3df', 2.3); sun.castShadow = true;
  sun.shadow.mapSize.set(tier.shadow, tier.shadow); sun.shadow.radius = 3; sun.shadow.blurSamples = 10;
  scene.add(sun, sun.target);
  const sunDir = new THREE.Vector3(1.1, 2.0, 1.4);

  /* ---------------------------------------------------------- ground, bunds, plots */
  const groundMat = new THREE.MeshStandardMaterial({ color: '#949a6e', roughness: 0.95, normalMap: grainNormal(), normalScale: new THREE.Vector2(0.6, 0.6) });
  const ground = mk(new THREE.PlaneGeometry(700, 700), groundMat, 'ground', false); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.002; scene.add(ground);
  // field margin grass (a slightly greener ring around the plots)
  const mudMat = M.mud.clone(); mudMat.map = M.mud.map.clone(); mudMat.map.repeat.set(12, 12); mudMat.normalMap = M.mud.normalMap.clone(); mudMat.normalMap.repeat.set(12, 12); mudMat.map.needsUpdate = true;
  const plotMeshes = {}, waterMeshes = {};
  const wn = waterNormal().clone(); wn.repeat.set(10, 10); wn.wrapS = wn.wrapT = THREE.RepeatWrapping; wn.needsUpdate = true;
  const waterMat = M.water.clone(); waterMat.normalMap = wn;
  for (const [id, p] of Object.entries(PLOTS)) {
    const w = p.x1 - p.x0 + 0.4, d = p.z1 - p.z0 + 0.4;
    const fl = mk(new THREE.PlaneGeometry(w, d), mudMat, `plot${id}`, false); fl.rotation.x = -Math.PI / 2; fl.position.set((p.x0 + p.x1) / 2, 0, (p.z0 + p.z1) / 2); scene.add(fl); plotMeshes[id] = fl;
    const wt = mk(new THREE.PlaneGeometry(w, d), waterMat, `water${id}`, false, false); wt.rotation.x = -Math.PI / 2; wt.position.set((p.x0 + p.x1) / 2, 0.05, (p.z0 + p.z1) / 2); wt.renderOrder = 3; scene.add(wt); waterMeshes[id] = wt;
  }
  // bunds: extruded smooth profile along straight runs
  const bundMat = M.bund.clone(); bundMat.map = M.bund.map.clone(); bundMat.map.repeat.set(1, 12); bundMat.map.needsUpdate = true;
  const bundRun = (len, segs = 1) => {
    const prof = []; const B = WORLD.bund;
    for (let i = 0; i <= 24; i += 1) { const xx = -B.baseHalf + (i / 24) * 2 * B.baseHalf; prof.push(new THREE.Vector2(mm(xx), mm(bundHeightAt(B.x + xx)))); }
    const g = new THREE.PlaneGeometry(1, len, 24, segs); const p = g.attributes.position;
    for (let i = 0; i < p.count; i += 1) { const u = Math.round((p.getX(i) + 0.5) * 24); p.setXYZ(i, prof[u].x, prof[u].y, p.getY(i)); }
    g.computeVertexNormals();
    // ensure normals face up
    const n = g.attributes.normal; let flip = 0; for (let i = 0; i < n.count; i += 1) flip += n.getY(i); if (flip < 0) { g.scale(1, 1, -1); g.computeVertexNormals(); }
    return g;
  };
  const addBund = (x, z, len, alongX) => { const b = mk(bundRun(len), bundMat, 'bund'); b.position.set(x, 0, z); if (alongX) b.rotation.y = Math.PI / 2; scene.add(b); return b; };
  addBund(0, 0, 2 * EDGE_Z, false); addBund(0, 0, 2 * EDGE_X, true); addBund(-EDGE_X, 0, 2 * EDGE_Z + 0.4, false); addBund(EDGE_X, 0, 2 * EDGE_Z + 0.4, false); addBund(0, -EDGE_Z, 2 * EDGE_X + 0.4, true); addBund(0, EDGE_Z, 2 * EDGE_X + 0.4, true);

  /* ---------------------------------------------------------- rice (far LOD hills in rows) */
  const cells = []; const r = seededRandom(9090);
  for (const p of Object.values(PLOTS)) for (let x = p.x0 + 0.18; x < p.x1 - 0.1; x += 0.32) for (let z = p.z0 + 0.16; z < p.z1 - 0.1; z += 0.28) {
    let skip = false; for (const n of Object.values(NODES)) if (Math.hypot(x - n.pos[0], z - n.pos[2]) < 0.16) skip = true;
    if (!skip) cells.push({ x: x + (r() - 0.5) * 0.04, z: z + (r() - 0.5) * 0.04 });
  }
  const rice = riceField(cells, { height: 0.5, heroTest: (c) => Math.hypot(c.x + 0.4, c.z - 3.8) < 1.6 || Math.hypot(c.x - 0.4, c.z - 5.6) < 1.2, tierScale: tier.rice * 0.85, castShadow: true });
  scene.add(rice.group);

  /* ---------------------------------------------------------- nodes */
  const nb = nodeBoxLayout(); const cp = cablePath();
  const nodes = {};
  const buildNode = (id, n, field) => {
    const g = new THREE.Group(); g.name = `nodeAsm-${id}`;
    const kind = field || n.hero ? 'P1' : 'P2';
    const top = probeTop(kind); g.add(top);
    const S = WORLD.stake; const stakeLen = mm(S.top - nb.stakeBottomY);
    const st = mk(new THREE.CylinderGeometry(mm(S.d / 2), mm(S.d / 2), stakeLen, 32), M.bamboo, 'stake'); st.position.set(mm(S.x), mm(nb.stakeBottomY) + stakeLen / 2, mm(S.z)); g.add(st);
    const box = buildNodeBox({ id, hero: n.hero, solar: field || n.hero, field, internals: false });
    box.root.position.set(mm(nb.x), mm(nb.bottomY), mm(nb.backZ)); g.add(box.root);
    const pts = cp.pts.map(([x, y, z]) => new THREE.Vector3(mm(x), mm(y), mm(z)));
    if (kind === 'P2') { const d = mm(40); pts[0].y -= d; pts[1].y -= d; }
    const cab = mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 64, mm(2.5), 12, false), M.cable, 'cable'); g.add(cab);
    g.position.set(...n.pos); g.rotation.y = n.rot;
    scene.add(g);
    return { group: g, box, kind, antenna: () => box.root.localToWorld(new THREE.Vector3(0, 135, 30)) };
  };
  const nodeSets = { prototype: {}, field: {} };
  for (const [id, n] of Object.entries(NODES)) { nodeSets.prototype[id] = buildNode(id, n, false); nodeSets.field[id] = buildNode(id, n, true); }

  /* ---------------------------------------------------------- farmhouse + gateway */
  const house = new THREE.Group(); house.name = 'farmhouse';
  {
    const pl = plaster(); pl.map.repeat.set(3, 2); pl.normal.repeat.set(3, 2);
    const wallMat = new THREE.MeshStandardMaterial({ map: pl.map, normalMap: pl.normal, roughness: 0.9, color: '#f2ece0' });
    const H = HOUSE;
    house.add(placed(mk(new RoundedBoxGeometry(H.w, H.h, H.d, 3, 0.04), wallMat, 'walls'), 0, H.h / 2, 0));
    const plinth = mk(new RoundedBoxGeometry(H.w + 0.2, 0.3, H.d + 0.2, 3, 0.03), new THREE.MeshStandardMaterial({ color: '#8c8478', roughness: 0.9 }), 'plinth'); plinth.position.y = 0.15; house.add(plinth);
    const tl = tiles(); tl.map.repeat.set(10, 5); tl.normal.repeat.set(10, 5);
    const roofMat = new THREE.MeshStandardMaterial({ map: tl.map, normalMap: tl.normal, roughness: 0.75 });
    const roofLen = H.w + 0.7, slope = Math.hypot(H.d / 2 + 0.45, 1.3);
    for (const s of [-1, 1]) {
      const rf = mk(new RoundedBoxGeometry(roofLen, 0.07, slope, 2, 0.02), roofMat, 'roof'); rf.position.set(0, H.h + 0.65, s * (H.d / 4 + 0.1)); rf.rotation.x = s * Math.atan2(1.3, H.d / 2 + 0.45); house.add(rf);
    }
    const ridge = mk(new THREE.CylinderGeometry(0.08, 0.08, roofLen, 24), roofMat, 'ridge'); ridge.rotation.z = Math.PI / 2; ridge.position.y = H.h + 1.3; house.add(ridge);
    for (const s of [-1, 1]) { const gab = new THREE.Shape([new THREE.Vector2(-H.d / 2, 0), new THREE.Vector2(H.d / 2, 0), new THREE.Vector2(0, 1.3)]); const gg = mk(new THREE.ShapeGeometry(gab), wallMat, 'gable'); gg.rotation.y = s * Math.PI / 2; gg.position.set(s * H.w / 2 * 0.999, H.h, 0); house.add(gg); }
    const wood = new THREE.MeshStandardMaterial({ color: '#6b4a2f', roughness: 0.6 });
    const door = mk(new RoundedBoxGeometry(0.95, 2.05, 0.06, 2, 0.01), wood, 'door'); door.position.set(0.8, 1.025 + 0.3, H.d / 2 + 0.02); house.add(door);
    for (const wx of [-1.6, 2.3]) { const fr = mk(new RoundedBoxGeometry(1.1, 1.0, 0.08, 2, 0.01), new THREE.MeshStandardMaterial({ color: '#2f5b4a', roughness: 0.5 }), 'window'); fr.position.set(wx, 1.6, H.d / 2 + 0.02); house.add(fr); const gl = mk(new THREE.PlaneGeometry(0.92, 0.82), new THREE.MeshPhysicalMaterial({ color: '#30383a', roughness: 0.1, metalness: 0.2 }), 'glass', false); gl.position.set(wx, 1.6, H.d / 2 + 0.065); house.add(gl); }
    house.position.set(H.x, 0, H.z); house.rotation.y = Math.PI / 2; // front (+z local) faces +x (the fields)
    scene.add(house);
  }
  const gwP = buildGatewayPrototype();
  const wallPos = new THREE.Vector3(-1.9, 1.75, HOUSE.d / 2); // house-local, on the front wall beside the door
  gwP.root.position.copy(wallPos); house.add(gwP.root);
  // mains lead from the gland down to a wall socket, plus the pump lead
  const sock = mk(new RoundedBoxGeometry(0.086, 0.086, 0.03, 2, 0.006), M.plasticWhite, 'socket'); sock.position.set(-1.9, 1.15, HOUSE.d / 2 + 0.015); house.add(sock);
  const plug = mainsPlug(); plug.position.set(-1.9 - 0.04 * 0, 1.17, HOUSE.d / 2 + 0.03 + 0.008); plug.rotation.x = Math.PI / 2; house.add(plug);
  const g0 = gwP.glands[0].clone().multiplyScalar(0.001).add(wallPos);
  const lead = mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([g0, g0.clone().add(new THREE.Vector3(0, -0.15, 0.03)), new THREE.Vector3(-1.93, 1.3, HOUSE.d / 2 + 0.06), new THREE.Vector3(-1.9, 1.19, HOUSE.d / 2 + 0.045)]), 40, 0.0035, 12, false), M.cable, 'mainsLead'); house.add(lead);
  const gwF = buildGatewayField();
  gwF.root.position.set(HOUSE.x + 3.4, 0, HOUSE.z - 1.8); scene.add(gwF.root);

  /* ---------------------------------------------------------- tank, pump, pipe, stream */
  const pumpGrp = new THREE.Group(); pumpGrp.name = 'pump';
  const tankMat = new THREE.MeshPhysicalMaterial({ color: '#1f2224', roughness: 0.55, clearcoat: 0.2 });
  const TX = -11.3, TZ = 6.2; const tank = mk(new THREE.CylinderGeometry(0.55, 0.55, 1.2, 64), tankMat, 'tank'); tank.position.set(TX, 0.6 + 0.4, TZ); pumpGrp.add(tank);
  for (let i = 0; i < 4; i += 1) { const rib = mk(new THREE.TorusGeometry(0.553, 0.012, 8, 64), tankMat, 'rib'); rib.rotation.x = Math.PI / 2; rib.position.set(TX, 0.55 + i * 0.28, TZ); pumpGrp.add(rib); }
  const lidT = mk(new THREE.CylinderGeometry(0.2, 0.22, 0.06, 40), tankMat, 'tankLid'); lidT.position.set(TX, 1.63, TZ); pumpGrp.add(lidT);
  const plat = mk(new RoundedBoxGeometry(1.4, 0.4, 1.4, 3, 0.03), new THREE.MeshStandardMaterial({ color: '#9b5b44', roughness: 0.9 }), 'platform'); plat.position.set(TX, 0.2, TZ); pumpGrp.add(plat);
  const pumpBody = mk(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 40), new THREE.MeshPhysicalMaterial({ color: '#2f6fb3', roughness: 0.35, clearcoat: 0.5 }), 'pumpMotor'); pumpBody.rotation.z = Math.PI / 2; pumpBody.position.set(TX + 0.85, 0.09, TZ - 0.4); pumpGrp.add(pumpBody);
  const pumpBase = mk(new RoundedBoxGeometry(0.28, 0.03, 0.16, 2, 0.006), M.steel, 'pumpBase'); pumpBase.position.set(TX + 0.85, 0.015, TZ - 0.4); pumpGrp.add(pumpBase);
  const pipeMat = new THREE.MeshPhysicalMaterial({ color: '#2c2f31', roughness: 0.4 });
  const pipeIn = mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(TX + 0.45, 0.5, TZ - 0.15), new THREE.Vector3(TX + 0.65, 0.15, TZ - 0.3), new THREE.Vector3(TX + 0.74, 0.09, TZ - 0.4)]), 24, 0.02, 16, false), pipeMat, 'suction'); pumpGrp.add(pipeIn);
  // outlet pipe rests on the west bund (crest 0.2 m) and overhangs into plot A
  const outPts = [new THREE.Vector3(TX + 0.96, 0.09, TZ - 0.4), new THREE.Vector3(-10.1, 0.06, TZ - 0.45), new THREE.Vector3(-EDGE_X, 0.225, TZ - 0.5), new THREE.Vector3(-EDGE_X + 0.45, 0.235, TZ - 0.52)];
  const pipeOut = mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outPts), 48, 0.025, 16, false), pipeMat, 'outlet'); pumpGrp.add(pipeOut);
  const SX = -EDGE_X + 0.47, SZ = TZ - 0.52; const streamCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(SX, 0.225, SZ), new THREE.Vector3(SX + 0.2, 0.22, SZ), new THREE.Vector3(SX + 0.32, 0.05, SZ));
  const streamMat = new THREE.MeshPhysicalMaterial({ color: '#cfe7f2', roughness: 0.05, transparent: true, opacity: 0.6, depthWrite: false });
  const stream = mk(new THREE.TubeGeometry(streamCurve, 24, 0.018, 12, false), streamMat, 'stream', false, false); stream.visible = false; pumpGrp.add(stream);
  scene.add(pumpGrp);
  // pump lead from the gateway relay along the wall and ground to the pump (illustrative routing)
  const leadPts = [g0.clone().add(new THREE.Vector3(0.08, 0, 0)), new THREE.Vector3(-1.75, 1.3, HOUSE.d / 2 + 0.03), new THREE.Vector3(-1.4, 0.32, HOUSE.d / 2 + 0.03)].map((p) => house.localToWorld(p.clone()));
  house.updateMatrixWorld(true);
  const lp = [gwP.glands[1].clone().multiplyScalar(0.001).add(wallPos), new THREE.Vector3(-1.75, 1.2, HOUSE.d / 2 + 0.03), new THREE.Vector3(-1.5, 0.33, HOUSE.d / 2 + 0.03)].map((p) => house.localToWorld(p));
  lp.push(new THREE.Vector3(-12.2, 0.012, 5.25), new THREE.Vector3(TX + 0.9, 0.012, 5.3), new THREE.Vector3(TX + 0.86, 0.03, TZ - 0.5));
  void leadPts;
  scene.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lp), 80, 0.004, 10, false), M.cable, 'pumpLead'));

  /* ---------------------------------------------------------- satellite (illustrative C-band SAR) */
  const sat = new THREE.Group(); sat.name = 'satellite';
  {
    const foil = new THREE.MeshPhysicalMaterial({ color: '#d9b25a', roughness: 0.35, metalness: 0.9, envMapIntensity: 0.8 });
    const bus = mk(new RoundedBoxGeometry(1.6, 1.4, 1.4, 3, 0.05), foil, 'bus'); sat.add(bus);
    const sarMat = new THREE.MeshPhysicalMaterial({ color: '#e8e9e6', roughness: 0.45 });
    const sar = mk(new RoundedBoxGeometry(10, 0.12, 0.8, 2, 0.03), sarMat, 'sarAntenna'); sar.position.set(0, -0.85, 0); sar.rotation.x = 0.5; sat.add(sar);
    const [pc, px] = canvas2d(512, 128); px.fillStyle = '#16223a'; px.fillRect(0, 0, 512, 128); px.strokeStyle = '#8fa1c0'; for (let i = 1; i < 16; i += 1) { px.beginPath(); px.moveTo(i * 32, 0); px.lineTo(i * 32, 128); px.stroke(); }
    const wing = mk(new RoundedBoxGeometry(9, 0.06, 2.2, 2, 0.02), new THREE.MeshPhysicalMaterial({ map: canvasTexture(pc), roughness: 0.2, metalness: 0.4, clearcoat: 1 }), 'solarWing'); wing.position.set(0, 0.9, -1.8); wing.rotation.x = -0.3; sat.add(wing);
    sat.scale.setScalar(0.8);
  }
  scene.add(sat);
  const beamMat = new THREE.MeshBasicMaterial({ color: '#33c6e0', transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const beam = mk(new THREE.BufferGeometry(), beamMat, 'beam', false, false); beam.renderOrder = 6; beam.frustumCulled = false; scene.add(beam);
  const footMat = new THREE.MeshBasicMaterial({ color: '#33c6e0', transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false });
  const foot = mk(new THREE.PlaneGeometry(1, 1), footMat, 'footprint', false, false); foot.rotation.x = -Math.PI / 2; foot.renderOrder = 6; scene.add(foot);

  /* ---------------------------------------------------------- trees around the farm (soft, smooth foliage) */
  {
    const r2 = seededRandom(5150);
    const blob = mergeVertices(new THREE.IcosahedronGeometry(1, 3));
    { const p = blob.attributes.position; for (let i = 0; i < p.count; i += 1) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + 0.08 * Math.sin(x * 4.1 + y * 2.3) + 0.06 * Math.cos(z * 3.7 - y * 1.9); p.setXYZ(i, x * k, y * k, z * k); } blob.computeVertexNormals(); }
    const leafM = new THREE.MeshStandardMaterial({ color: '#4f7a3a', roughness: 0.85 });
    const barkM = new THREE.MeshStandardMaterial({ color: '#5a4636', roughness: 0.9 });
    const spots = [[-19, -10], [-22, 4], [-18, 13], [-9, -17], [-28, -4], [-30, 12], [-6, 19], [-24, -16], [-14, 22], [-34, 2], [58, 22], [52, -32], [30, 58], [62, -4]];
    const crowns = []; const trunks = [];
    for (const [x, z] of spots) {
      const h = 3.2 + r2() * 2.5, w = 1.6 + r2() * 1.2;
      trunks.push(new THREE.Matrix4().compose(new THREE.Vector3(x, h * 0.35, z), new THREE.Quaternion(), new THREE.Vector3(0.18, h * 0.7, 0.18)));
      for (let k = 0; k < 4; k += 1) { const a = r2() * 6.28; crowns.push(new THREE.Matrix4().compose(new THREE.Vector3(x + Math.cos(a) * w * 0.4, h * (0.75 + r2() * 0.25), z + Math.sin(a) * w * 0.4), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0)), new THREE.Vector3(w, w * 0.8, w).multiplyScalar(0.6 + r2() * 0.35))); }
    }
    const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1.3, 1, 16), barkM, trunks.length); trunks.forEach((m, i) => tr.setMatrixAt(i, m)); tr.castShadow = true; scene.add(tr);
    const cr = new THREE.InstancedMesh(blob, leafM, crowns.length); crowns.forEach((m, i) => { cr.setMatrixAt(i, m); cr.setColorAt(i, new THREE.Color('#4f7a3a').offsetHSL((r2() - 0.5) * 0.04, 0, (r2() - 0.5) * 0.08)); }); cr.castShadow = true; cr.receiveShadow = true; scene.add(cr);
  }

  /* ---------------------------------------------------------- API */
  let variant = 'prototype';
  const ripples = { centre: streamCurve.getPoint(1) };
  const api = {
    scene, sun, hemi, rice, house, nodes: () => nodeSets[variant], nodeSets, gwP, gwF, sat, beam, foot, stream, ripples, plots: PLOTS, waterMeshes, plotMeshes,
    setVariant(v) {
      variant = v === 'field' ? 'field' : 'prototype';
      for (const [k, set] of Object.entries(nodeSets)) for (const n of Object.values(set)) n.group.visible = k === variant;
      gwP.root.visible = variant === 'prototype'; gwF.root.visible = variant === 'field';
    },
    get variant() { return variant; },
    /** Gateway antenna position in world space (packet target). */
    gatewayPoint() {
      if (variant === 'field') return gwF.root.localToWorld(gwF.antennaTop.clone());
      house.updateMatrixWorld(true); return gwP.root.localToWorld(new THREE.Vector3(56, 30, 40));
    },
    nodePoint(id) { const n = nodeSets[variant][id]; n.group.updateMatrixWorld(true); return n.box.root.localToWorld(new THREE.Vector3(0, 140, 30)); },
    setWater(id, levelMm) { const w = waterMeshes[id]; w.visible = levelMm > 0.5; w.position.y = mm(Math.max(levelMm, 0.5)); },
    setPump(on) { stream.visible = on; },
    setLeds(fn) { for (const [id, n] of Object.entries(nodeSets[variant])) { const [c, i] = fn(id); n.box.setLed(c, i); } },
    setGatewayLeds(tx) { const g = variant === 'field' ? gwF : gwP; g.txMat.emissiveIntensity = 1 + 9 * tx; },
    /** Satellite along its track: k 0..1 (trapezoid speed applied by the caller). */
    setSatellite(k, show = true) {
      sat.visible = show; beam.visible = show; foot.visible = show;
      if (!show) return;
      const x = -60 + 120 * k; sat.position.set(x, 22, -14); sat.rotation.set(0, 0, 0);
      // side-looking beam to a ground swath right of track
      const fx = x, fz = 1.5, fw = 10, fl = 3.2;
      foot.position.set(fx, 0.03, fz); foot.scale.set(fl, fw, 1);
      const a = new THREE.Vector3(x - 3.6, 21.2, -13.4), b = new THREE.Vector3(x + 3.6, 21.2, -13.4);
      const c0 = new THREE.Vector3(fx - fl / 2, 0.03, fz - fw / 2), c1 = new THREE.Vector3(fx + fl / 2, 0.03, fz - fw / 2), c2 = new THREE.Vector3(fx + fl / 2, 0.03, fz + fw / 2), c3 = new THREE.Vector3(fx - fl / 2, 0.03, fz + fw / 2);
      const pos = [a, c0, c1, a, c1, b, b, c1, c2, b, c2, c3, a, b, c3, a, c3, c0].flatMap((v) => [v.x, v.y, v.z]);
      beam.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); beam.geometry.attributes.position.needsUpdate = true;
    },
    setTime(t) { rice.setTime(t, 0.8); wn.offset.set(t * 0.01, t * 0.007); },
    frame(centre, radius) { frameShadow(sun, centre, radius, sunDir); },
  };
  api.setVariant('prototype');
  for (const id of Object.keys(PLOTS)) api.setWater(id, 50);
  api.setSatellite(0, false);
  api.frame(new THREE.Vector3(-3, 0, 1.5), 18);
  return api;
}
