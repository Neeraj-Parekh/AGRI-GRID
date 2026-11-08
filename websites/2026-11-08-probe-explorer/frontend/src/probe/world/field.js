// The paddy cross-section diorama: a soil pit dug at the edge of an AWD paddy. The pit wall (plane z = 0)
// is an engineering section through the soil, the bund and the probe axis, so the sectioned probe sits
// exactly in its auger groove. Behind the wall the field continues: puddled mud, water, rice, the bund
// with node A1 on its stake, the staff gauge. Units: metres (layout in mm from spec/layout.js).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { materials } from '../models/materials.js';
import { buildProbe } from '../models/probe.js';
import { buildNodeBox } from '../models/node.js';
import { WORLD, nodeBoxLayout, cablePath, gaugeLayout, bundHeightAt, probeParts } from '../spec/layout.js';
import { gaugeFace, blob } from '../core/textures.js';
import { seededRandom, makeNoise2, fbm, clamp, canvas2d, canvasTexture } from '../core/util.js';
import { bundEarth } from '../core/textures.js';
import { frameShadow } from '../core/stage.js';
import { riceField } from './rice.js';
import { resistiveSensor } from './props.js';

const mm = (v) => v / 1000;
export const PIT = { x0: -1.2, x1: 1.2, z1: 1.6, floor: -0.5 };
const FIELD = { x0: -4.5, x1: 4.5, z0: -9, z1: 4 };
const SOIL_DEPTH = 0.5;

/** Soft daylight sky (equirectangular gradient) in the site's palette; the HDRI only lights the scene. */
let SKY = null;
export function skyTexture() {
  if (SKY) return SKY;
  const [c, x] = canvas2d(16, 512);
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#9fc4dc'); g.addColorStop(0.36, '#cfe1ea'); g.addColorStop(0.495, '#eef1ec'); g.addColorStop(0.52, '#e3e6dc'); g.addColorStop(1, '#cfd3c5');
  x.fillStyle = g; x.fillRect(0, 0, 16, 512);
  SKY = canvasTexture(c); SKY.mapping = THREE.EquirectangularReflectionMapping;
  return SKY;
}

const noiseA = makeNoise2(901);
/** Fine bund surface relief (mm), zero at the toes so it meets the paddy floor. */
function bundRelief(xm, zm) {
  const h = bundHeightAt(xm * 1000);
  if (h <= 0) return 0;
  return fbm(noiseA, xm * 18, zm * 18, 3) * 4 * clamp(h / 60, 0, 1);
}
export const surfaceY = (xm, zm = 0) => mm(bundHeightAt(xm * 1000) + bundRelief(xm, zm));

function mesh(g, m, name, cast = true, receive = true) { const o = new THREE.Mesh(g, m); o.name = name || ''; o.castShadow = cast; o.receiveShadow = receive; return o; }

/** Shape in the XY plane → geometry on the ground (XZ plane, y up). Points are given as [x, z]. */
function groundShape(outer, holes = []) {
  const s = new THREE.Shape(outer.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))));
  const g = new THREE.ShapeGeometry(s, 24);
  g.rotateX(-Math.PI / 2);
  // world-space uv (1 unit = 1 m)
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i += 1) uv.setXY(i, p.getX(i), p.getZ(i));
  g.computeVertexNormals();
  return g;
}

/** The pit outline in plan with the half-disc notch around the probe (r = probe radius). */
function pitOutline(rProbe) {
  const pts = [[PIT.x0, 0]];
  pts.push([-rProbe, 0]);
  for (let i = 1; i < 24; i += 1) { const a = Math.PI - (i / 24) * Math.PI; pts.push([Math.cos(a) * rProbe, -Math.sin(a) * rProbe]); }
  pts.push([rProbe, 0], [PIT.x1, 0], [PIT.x1, PIT.z1], [PIT.x0, PIT.z1]);
  return pts;
}

export function createField(stage, opts = {}) {
  const M = materials();
  const scene = new THREE.Scene(); scene.name = 'field';
  const tier = stage.tierSpec;
  scene.environment = stage.envs.studio; scene.environmentIntensity = 0.5;
  stage.fieldEnvReady.then((env) => { scene.environment = env; });
  scene.background = skyTexture();
  scene.fog = new THREE.Fog('#e6ece9', 5, 15);

  const P = probeParts('P1');
  const rOut = mm(P.rOut);

  /* ---------------------------------------------------------- lights */
  const hemi = new THREE.HemisphereLight('#eaf4ff', '#7a6a55', 0.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3df', 2.4); sun.castShadow = true;
  sun.shadow.mapSize.set(tier.shadow, tier.shadow); sun.shadow.radius = 4; sun.shadow.blurSamples = 12;
  scene.add(sun, sun.target);
  const sunDir = new THREE.Vector3(1.1, 2.2, 1.5);

  /* ---------------------------------------------------------- soil: pit wall (section), pit, paddy floor */
  const soil = new THREE.Group(); soil.name = 'soil'; scene.add(soil);
  // Section face below y = 0 with the auger groove (the probe silhouette: tube + cone tip)
  const t = P.tip;
  const grooveL = [[-rOut, 0], [-rOut, mm(t.yTop)], [-mm(1.35), mm(t.yPoint + 0.85)], [-mm(1.05), mm(t.yPoint + 0.4)], [-mm(0.55), mm(t.yPoint + 0.1)], [0, mm(t.yPoint)]];
  const groove = [...grooveL, ...grooveL.slice(0, -1).reverse().map(([x, y]) => [-x, y])];
  const faceShape = new THREE.Shape([new THREE.Vector2(PIT.x0, -SOIL_DEPTH), new THREE.Vector2(PIT.x1, -SOIL_DEPTH), new THREE.Vector2(PIT.x1, 0), ...groove.slice().reverse().map(([x, y]) => new THREE.Vector2(x, y)), new THREE.Vector2(PIT.x0, 0)]);
  const faceG = new THREE.ShapeGeometry(faceShape, 1);
  { const p = faceG.attributes.position, uv = faceG.attributes.uv; for (let i = 0; i < p.count; i += 1) uv.setXY(i, (p.getX(i) - PIT.x0) / 2.0, 1 + p.getY(i) / SOIL_DEPTH); }
  const face = mesh(faceG, M.soilFace, 'sectionFace', false, true); soil.add(face);
  // Auger hole wall (visible only when the probe is lifted out): half-cylinder + cone, facing inward
  {
    const prof = [[rOut, 0], [rOut, mm(t.yTop)], [mm(1.35), mm(t.yPoint + 0.85)], [mm(0.55), mm(t.yPoint + 0.1)], [0.0001, mm(t.yPoint)]].reverse().map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(prof, 48, Math.PI / 2, Math.PI);
    const hole = mesh(g, new THREE.MeshStandardMaterial({ color: '#4a3e33', roughness: 0.95, side: THREE.BackSide }), 'augerHole', false, true);
    soil.add(hole);
  }
  // Bund section face (above y = 0), following the bund profile + relief at z = 0
  {
    const pts = [];
    for (let i = 0; i <= 120; i += 1) { const x = mm(WORLD.bund.x - WORLD.bund.baseHalf) + (i / 120) * mm(2 * WORLD.bund.baseHalf); pts.push(new THREE.Vector2(x, surfaceY(x, 0))); }
    const shp = new THREE.Shape([pts[0], ...pts.slice(1)].concat([new THREE.Vector2(pts[pts.length - 1].x, 0), new THREE.Vector2(pts[0].x, 0)]));
    const g = new THREE.ShapeGeometry(shp, 1);
    const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i += 1) uv.setXY(i, p.getX(i) * 2.2, p.getY(i) * 2.2);
    const be = bundEarth();
    const bfMat = new THREE.MeshStandardMaterial({ map: be.map, normalMap: be.normal, normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.95, color: '#c4ae92' });
    const bf = mesh(g, bfMat, 'bundSection', false, true); bf.position.z = 0.00002; soil.add(bf);
  }
  // Pit side walls, far wall and floor (soil-face texture; the floor is trodden mud)
  {
    const wallMat = M.soilFace;
    const side = (x, dir) => { const g = new THREE.PlaneGeometry(PIT.z1, SOIL_DEPTH); g.rotateY(dir * Math.PI / 2); const m = mesh(g, wallMat, 'pitWall', false, true); m.position.set(x, -SOIL_DEPTH / 2, PIT.z1 / 2); return m; };
    soil.add(side(PIT.x0, 1), side(PIT.x1, -1));
    const far = new THREE.PlaneGeometry(PIT.x1 - PIT.x0, SOIL_DEPTH); far.rotateY(Math.PI); const fm = mesh(far, wallMat, 'pitFar', false, true); fm.position.set(0, -SOIL_DEPTH / 2, PIT.z1); soil.add(fm);
    const fl = new THREE.PlaneGeometry(PIT.x1 - PIT.x0, PIT.z1); fl.rotateX(-Math.PI / 2);
    const flm = mesh(fl, M.mud, 'pitFloor', false, true); flm.position.set(0, PIT.floor, PIT.z1 / 2); soil.add(flm);
  }
  // Paddy floor (y = 0) around the pit, with the notch at the probe and a slot for the gauge
  const gl = gaugeLayout();
  const gaugeHole = [[mm(gl.x - gl.w / 2), mm(gl.z - gl.t / 2)], [mm(gl.x + gl.w / 2), mm(gl.z - gl.t / 2)], [mm(gl.x + gl.w / 2), mm(gl.z + gl.t / 2)], [mm(gl.x - gl.w / 2), mm(gl.z + gl.t / 2)]];
  const floorOuter = [[FIELD.x0, FIELD.z0], [FIELD.x1, FIELD.z0], [FIELD.x1, FIELD.z1], [FIELD.x0, FIELD.z1]];
  const floor = mesh(groundShape(floorOuter, [pitOutline(rOut).reverse(), gaugeHole]), M.mud, 'paddyFloor', false, true);
  soil.add(floor);
  // Bund surface: a relief grid along z, interrupted by the pit
  const bundMeshes = [];
  for (const [z0, z1, segZ] of [[FIELD.z0, 0, 90], [PIT.z1, FIELD.z1, 24]]) {
    const segX = 72; const g = new THREE.PlaneGeometry(1, 1, segX, segZ); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, uv = g.attributes.uv;
    const xa = mm(WORLD.bund.x - WORLD.bund.baseHalf), xb = mm(WORLD.bund.x + WORLD.bund.baseHalf);
    for (let i = 0; i < p.count; i += 1) {
      const u = p.getX(i) + 0.5, v = p.getZ(i) + 0.5;
      const x = xa + u * (xb - xa), z = z0 + v * (z1 - z0);
      p.setXYZ(i, x, surfaceY(x, z), z); uv.setXY(i, x * 2, z * 2);
    }
    g.computeVertexNormals();
    const bm = mesh(g, M.bund, 'bund', true, true); soil.add(bm); bundMeshes.push(bm);
  }
  // A few clods and pebbles on the mud near the probe (instanced, seeded)
  {
    const r = seededRandom(515); const g = mergeVertices(new THREE.IcosahedronGeometry(1, 4));
    const pa = g.attributes.position; for (let i = 0; i < pa.count; i += 1) { const k = 1 + (Math.sin(pa.getX(i) * 7.1) + Math.cos(pa.getY(i) * 5.3) + Math.sin(pa.getZ(i) * 6.7)) * 0.07; pa.setXYZ(i, pa.getX(i) * k, pa.getY(i) * k * 0.6, pa.getZ(i) * k); }
    g.computeVertexNormals();
    const clodMat = new THREE.MeshStandardMaterial({ color: '#6b5a49', roughness: 0.9 });
    const n = 160; const im = new THREE.InstancedMesh(g, clodMat, n); const m4 = new THREE.Matrix4(); let k = 0;
    while (k < n) {
      const x = -1.1 + r() * 1.2, z = -0.02 - r() * 1.4; const d = Math.hypot(x, z);
      if (d < 0.03 || (Math.abs(x - mm(gl.x)) < 0.03 && Math.abs(z - mm(gl.z)) < 0.03)) continue;
      const s = 0.003 + r() * r() * 0.012;
      m4.compose(new THREE.Vector3(x, s * 0.25, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(r(), r() * 6, r())), new THREE.Vector3(s, s, s));
      im.setMatrixAt(k, m4); k += 1;
    }
    im.castShadow = true; im.receiveShadow = true; im.name = 'clods'; soil.add(im);
  }

  /* ---------------------------------------------------------- water: surface, section face, meniscus */
  const water = new THREE.Group(); water.name = 'water'; scene.add(water);
  const wSurf = mesh(groundShape(floorOuter, [pitOutline(rOut + 0.0015).reverse(), gaugeHole]), M.water, 'waterSurface', false, false);
  wSurf.renderOrder = 3; water.add(wSurf);
  const wFaceMat = M.waterFace;
  const wFaceL = mesh(new THREE.PlaneGeometry(1, 1), wFaceMat, 'waterFaceL', false, false);
  const wFaceR = mesh(new THREE.PlaneGeometry(1, 1), wFaceMat, 'waterFaceR', false, false);
  wFaceL.renderOrder = 2; wFaceR.renderOrder = 2; water.add(wFaceL, wFaceR);
  const topLineMat = new THREE.MeshBasicMaterial({ color: '#e8f6ff', transparent: true, opacity: 0.7, depthWrite: false });
  const topLines = [0, 1, 2].map(() => { const l = mesh(new THREE.PlaneGeometry(1, 0.0012), topLineMat, 'waterLine', false, false); l.renderOrder = 3; water.add(l); return l; });
  const bundEdgeAt = (Lmm, side) => { // x (m) where the bund surface reaches the water level on one side
    const b = WORLD.bund; let lo = b.topHalf, hi = b.baseHalf; // distance from the bund centre
    for (let i = 0; i < 30; i += 1) { const mid = (lo + hi) / 2; if (bundHeightAt(b.x + mid) > Lmm) lo = mid; else hi = mid; }
    return mm(b.x + side * (lo + hi) / 2);
  };
  // Meniscus at the probe (back half, z ≤ 0) and around the gauge bar
  const menProf = []; for (let i = 0; i <= 8; i += 1) { const s = i / 8; menProf.push(new THREE.Vector2(rOut + s * 0.003, 0.0014 * Math.pow(1 - s, 2.2))); }
  const menProbe = mesh(new THREE.LatheGeometry(menProf, 48, Math.PI / 2, Math.PI), M.water, 'meniscusProbe', false, false); menProbe.renderOrder = 3; water.add(menProbe);
  const menGauge = new THREE.Group();
  { const r0 = 0.0001; const g = new THREE.TorusGeometry(1, 1, 6, 24); void g; void r0;
    const ring = mesh(new RoundedBoxGeometry(mm(gl.w) + 0.004, 0.0012, mm(gl.t) + 0.004, 2, 0.0006), M.water, 'meniscusGauge', false, false);
    ring.position.set(mm(gl.x), 0.0006, mm(gl.z)); ring.renderOrder = 3; menGauge.add(ring); }
  water.add(menGauge);
  // Methane bubbles (chapter 1): instanced spheres rising from the mud, seeded
  const bubbleN = 48; const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.55, depthWrite: false }), bubbleN);
  bubbles.renderOrder = 4; bubbles.frustumCulled = false; bubbles.visible = false; water.add(bubbles);
  const bubbleSeeds = (() => { const r = seededRandom(616); return Array.from({ length: bubbleN }, () => ({ x: -1.1 + r() * 1.05, z: -0.04 - r() * 1.2, ph: r(), sp: 0.6 + r() * 0.8, s: 0.0012 + r() * 0.0018 })); })();

  /* ---------------------------------------------------------- probe A1 */
  const probe = buildProbe('P1');
  scene.add(probe.root);
  // air-gap failure overlay on the section face (dark sliver beside the tube, paddy side)
  const gapMat = new THREE.MeshBasicMaterial({ color: '#141210', transparent: true, opacity: 0, depthWrite: false });
  const gap = mesh(new THREE.PlaneGeometry(1, 1), gapMat, 'airGap', false, false); gap.renderOrder = 2; soil.add(gap);

  /* ---------------------------------------------------------- staff gauge G1 */
  const gauge = new THREE.Group(); gauge.name = 'gaugeG1';
  {
    const L = mm(gl.y1 - gl.y0);
    const faceMat = new THREE.MeshStandardMaterial({ map: gaugeFace(), roughness: 0.42, metalness: 0 });
    const g = new RoundedBoxGeometry(mm(gl.w), L, mm(gl.t), 3, 0.0008);
    const bar = mesh(g, [M.plasticBlack, M.plasticBlack, M.plasticBlack, M.plasticBlack, faceMat, M.plasticBlack], 'gaugeBar');
    // RoundedBoxGeometry has no groups; use a face plane for the printed scale
    bar.material = M.plasticBlack;
    const facePlane = mesh(new THREE.PlaneGeometry(mm(gl.w) - 0.0012, L - 0.0012), faceMat, 'gaugeFace', false, true); facePlane.position.z = mm(gl.t) / 2 + 0.00005;
    gauge.add(bar, facePlane);
    gauge.position.set(mm(gl.x), mm((gl.y0 + gl.y1) / 2), mm(gl.z));
    scene.add(gauge);
  }

  /* ---------------------------------------------------------- stake + node A1 + cable */
  const nb = nodeBoxLayout();
  const S = WORLD.stake;
  const stakeLen = mm(S.top - nb.stakeBottomY);
  const stake = new THREE.Group(); stake.name = 'stake';
  {
    const g = new THREE.CylinderGeometry(mm(S.d / 2), mm(S.d / 2), stakeLen, 40, 1);
    const st = mesh(g, M.bamboo, 'stakeTube'); stake.add(st);
    for (let y = 0.12; y < stakeLen - 0.02; y += 0.24) { const node = mesh(new THREE.TorusGeometry(mm(S.d / 2), 0.0011, 8, 40), M.bamboo, 'bambooNode'); node.rotation.x = Math.PI / 2; node.position.y = -stakeLen / 2 + y; stake.add(node); }
    const capTop = mesh(new THREE.CircleGeometry(mm(S.d / 2) - 0.0005, 32), M.bamboo, 'stakeTop'); capTop.rotation.x = -Math.PI / 2; capTop.position.y = stakeLen / 2; stake.add(capTop);
    stake.position.set(mm(S.x), mm(nb.stakeBottomY) + stakeLen / 2, mm(S.z));
    scene.add(stake);
  }
  const node = buildNodeBox({ id: 'A1', hero: true, solar: true });
  node.root.position.set(mm(nb.x), mm(nb.bottomY), mm(nb.backZ));
  scene.add(node.root);
  const cp = cablePath();
  const cableCurve = new THREE.CatmullRomCurve3(cp.pts.map(([x, y, z]) => new THREE.Vector3(mm(x), mm(y), mm(z))), false, 'centripetal');
  const cable = mesh(new THREE.TubeGeometry(cableCurve, 160, mm(P.gland.cableR), 16, false), M.cable, 'cable');
  scene.add(cable);
  // contact shadows (soft blobs) where objects meet the ground
  const blobMat = new THREE.MeshBasicMaterial({ map: blob(), transparent: true, depthWrite: false, opacity: 0.55 });
  const contact = (x, z, r, y = 0.0004) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), blobMat); b.rotation.x = -Math.PI / 2; b.position.set(x, y, z); b.renderOrder = 1; scene.add(b); return b; };
  contact(mm(S.x), mm(S.z), 0.035, surfaceY(mm(S.x), mm(S.z)) + 0.0006);
  const probeBlob = contact(0, -0.004, 0.03);

  /* ---------------------------------------------------------- rice */
  const cells = [];
  const r = seededRandom(4242);
  const rowX = 0.2, rowZ = 0.15;
  for (let x = -0.1; x > FIELD.x0 + 0.2; x -= rowX) for (let z = -0.09; z > FIELD.z0 + 0.3; z -= rowZ) cells.push({ x: x + (r() - 0.5) * 0.03, z: z + (r() - 0.5) * 0.03, seed: 0 });
  const xr = mm(WORLD.bund.x + WORLD.bund.baseHalf) + 0.12;
  for (let x = xr; x < FIELD.x1 - 0.2; x += rowX) for (let z = -0.09; z > FIELD.z0 + 0.3; z -= rowZ) cells.push({ x: x + (r() - 0.5) * 0.03, z: z + (r() - 0.5) * 0.03, seed: 0 });
  for (let x = -0.1; x > FIELD.x0 + 0.2; x -= rowX) for (let z = PIT.z1 + 0.12; z < FIELD.z1 - 0.2; z += rowZ) cells.push({ x, z, seed: 0 });
  // keep the gauge readable: no hill directly in front of it
  const keep = cells.filter((c) => !(Math.abs(c.x - mm(gl.x)) < 0.07 && c.z > -0.2));
  const rice = riceField(keep, { height: 0.5, heroTest: (c) => c.z > -1.6 && Math.abs(c.x) < 1.6 && c.z < 0.1, tierScale: tier.rice });
  scene.add(rice.group);

  /* ---------------------------------------------------------- comparison: two-prong resistive sensor on the section */
  const resist = resistiveSensor({ cup: false });
  resist.group.position.set(-0.3, -0.03, 0.001); resist.group.visible = false; scene.add(resist.group);

  /* ---------------------------------------------------------- state API */
  const state = { level: 50, gap: 0, probeLift: 0 };
  const profileData = M.soilFaceProfile.image.data;
  const api = {
    scene, sun, hemi, probe, node, gauge, stake, cable, cableCurve, rice, water, soil, bubbles, nodeLayout: nb,
    /** Water level relative to the paddy surface (mm). Above 0: ponded water; below 0: water table in the soil. */
    setWater(levelMm) {
      state.level = levelMm;
      const ponded = levelMm > 0.5;
      const L = mm(Math.max(levelMm, 0));
      wSurf.visible = ponded; menProbe.visible = ponded; menGauge.visible = ponded; wFaceL.visible = ponded; wFaceR.visible = ponded; topLines.forEach((l) => { l.visible = ponded; });
      if (ponded) {
        wSurf.position.y = L; menProbe.position.y = L; menGauge.position.y = L;
        // section face of the water: from the pit's left edge to the probe, and from the probe to the bund
        const xl0 = PIT.x0, xl1 = -rOut; wFaceL.scale.set(xl1 - xl0, L, 1); wFaceL.position.set((xl0 + xl1) / 2, L / 2, -0.0003);
        const xr0 = rOut, xr1 = PIT.x1; wFaceR.scale.set(xr1 - xr0, L, 1); wFaceR.position.set((xr0 + xr1) / 2, L / 2, -0.0003);
        const segs = [[PIT.x0, -rOut], [rOut, bundEdgeAt(levelMm, -1)], [bundEdgeAt(levelMm, 1), PIT.x1]];
        segs.forEach(([a, b], i) => { topLines[i].scale.set(Math.max(0.0001, b - a), 1, 1); topLines[i].position.set((a + b) / 2, L - 0.0006, 0.0001); });
      }
      M.soilFaceU.uTable.value = levelMm < -1 ? mm(levelMm) : -1;
    },
    /** Soil moisture by depth: fn(zMm) → θ (0..0.5). Drives the section-face shading. */
    setProfile(fn) {
      for (let i = 0; i < 256; i += 1) {
        const z = -(i / 255) * 500; const th = fn(z);
        profileData[i * 4] = Math.round(clamp((th - 0.16) / (0.48 - 0.16), 0, 1) * 255);
      }
      M.soilFaceProfile.needsUpdate = true;
    },
    /** Air gap between the tube and the soil on the paddy side (0..1), a failure beat. */
    setAirGap(k, y0 = -130, y1 = -40) {
      state.gap = k; gapMat.opacity = 0.85 * clamp(k * 3, 0, 1);
      const w = mm(0.4 + 2.2 * k);
      gap.scale.set(w, mm(y1 - y0), 1); gap.position.set(-rOut - w / 2, mm((y0 + y1) / 2), 0.0003);
    },
    /** Lift the probe out of its hole (m) for the install beat. */
    setProbeLift(m) { state.probeLift = m; probe.root.position.y = m; cable.visible = m < 0.001; probeBlob.visible = m < 0.002; },
    setTime(t, wind = 1) {
      rice.setTime(t, wind);
      M.waterNormal.offset.set(t * 0.012, t * 0.008);
    },
    setResistive(on, k) { resist.group.visible = !!on; if (on) resist.setCorrosion(k); },
    setBubbles(on, t) {
      bubbles.visible = on && state.level > 2;
      if (!bubbles.visible) return;
      const m4 = new THREE.Matrix4(); const L = mm(state.level);
      bubbleSeeds.forEach((b, i) => {
        const k = ((t * 0.35 * b.sp) + b.ph) % 1; const y = k * L; const s = b.s * (0.6 + 0.4 * k);
        m4.compose(new THREE.Vector3(b.x + Math.sin(t * 3 + i) * 0.002, y, b.z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
        bubbles.setMatrixAt(i, m4);
      });
      bubbles.instanceMatrix.needsUpdate = true;
    },
    /** World position of a band centre on the section (inner wall, paddy side). */
    bandWorld(id) { const a = probe.anchor(id); return new THREE.Vector3(mm(a.x), mm(a.y) + probe.root.position.y, mm(a.z)); },
    frame(centre, radius) { frameShadow(sun, centre, radius, sunDir); },
    get level() { return state.level; },
  };
  api.setWater(50);
  api.setAirGap(0);
  api.setProfile(() => 0.48);
  api.frame(new THREE.Vector3(0, 0, -0.2), 1.2);
  return api;
}
