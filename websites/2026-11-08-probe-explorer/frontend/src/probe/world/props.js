// Studio props, all bevelled and physically sized (metres): ballpoint pen and steel rule for scale,
// textured print bed, the two-prong resistive sensor that corrodes, calibration cups, kitchen scale,
// bench oven, the P3 display stand and a weighted stake base for the node box.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { materials } from '../models/materials.js';
import { canvas2d, canvasTexture, seededRandom, roundRect } from '../core/util.js';
import { corrosionTexture, grainNormal } from '../core/textures.js';
import SPEC from '../spec/probe-spec.json' with { type: 'json' };

const placed = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const mk = (g, m, name, cast = true) => { const o = new THREE.Mesh(g, m); o.name = name || ''; o.castShadow = cast; o.receiveShadow = true; return o; };
const rb = (w, h, d, r, s = 3) => new RoundedBoxGeometry(w, h, d, s, r);

/** Ballpoint pen lying on the floor along +x (140 mm, Ø 9 mm). Origin: contact line centre on the floor. */
export function pen() {
  const M = materials();
  const g = new THREE.Group(); g.name = 'pen';
  const body = new THREE.MeshPhysicalMaterial({ color: '#2f6fb3', roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const prof = [[0, 0], [0.6, 0.4], [1.6, 6], [3.6, 16], [4.5, 20], [4.5, 128], [4.2, 134], [3.6, 140], [0, 140]].map(([r, y]) => new THREE.Vector2(r / 1000, y / 1000));
  const lathe = mk(new THREE.LatheGeometry(prof, 48), body, 'penBody');
  const tip = mk(new THREE.LatheGeometry([[0, 0], [0.6, 0.4], [1.6, 6], [3.62, 16.2], [0, 16.2]].map(([r, y]) => new THREE.Vector2(r / 1000, y / 1000)), 48), M.steel, 'penTip');
  const clip = mk(rb(0.0022, 0.045, 0.0012, 0.0005), M.steel, 'penClip'); clip.position.set(0, 0.112, 0.0052);
  const p = new THREE.Group(); p.add(lathe, tip, clip);
  p.rotation.z = -Math.PI / 2; p.position.set(-0.07, 0.0045, 0);
  g.add(p);
  return g;
}

/** 300 mm steel rule lying flat (mm ticks, cm numbers). Origin: centre of the bottom face. */
export function steelRule() {
  const M = materials();
  const W = 3000, H = 250; const [c, x] = canvas2d(W, H);
  x.fillStyle = '#c9ced1'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#222'; x.font = '600 60px Inter, system-ui, sans-serif'; x.textAlign = 'center';
  for (let i = 0; i <= 300; i += 1) {
    const len = i % 10 === 0 ? 70 : i % 5 === 0 ? 48 : 30; const px = 0 + i * 10 - (i === 300 ? 2 : 0);
    x.fillRect(px - 1.5, 0, 3, len);
    if (i % 10 === 0 && i > 0 && i < 300) x.fillText(String(i / 10), px, 140);
  }
  x.font = '600 34px Inter, system-ui, sans-serif'; x.fillText('mm', 60, 215);
  const top = new THREE.MeshPhysicalMaterial({ map: canvasTexture(c), roughness: 0.35, metalness: 0.85 });
  const g = new THREE.Group(); g.name = 'rule';
  const bar = mk(rb(0.3, 0.001, 0.025, 0.0004, 2), M.aluminium, 'ruleBar'); bar.position.y = 0.0005; g.add(bar);
  const face = mk(new THREE.PlaneGeometry(0.2995, 0.0245), top, 'ruleFace', false); face.rotation.x = -Math.PI / 2; face.position.y = 0.00102; g.add(face);
  return g;
}

/** Textured PEI print bed 235 × 235 mm on an aluminium plate. Origin: bed top centre. */
export function printBed() {
  const [c, x] = canvas2d(512, 512); const r = seededRandom(808);
  x.fillStyle = '#2b2a28'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i += 1) { x.fillStyle = `rgba(${150 + r() * 60},${130 + r() * 40},${70 + r() * 30},${0.08 + r() * 0.12})`; x.fillRect(r() * 512, r() * 512, 1.5, 1.5); }
  x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 1; for (let i = 0; i <= 10; i += 1) { x.beginPath(); x.moveTo(i * 51.2, 0); x.lineTo(i * 51.2, 512); x.stroke(); x.beginPath(); x.moveTo(0, i * 51.2); x.lineTo(512, i * 51.2); x.stroke(); }
  const pei = new THREE.MeshStandardMaterial({ map: canvasTexture(c), normalMap: grainNormal(), normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.7, metalness: 0.1 });
  const M = materials();
  const g = new THREE.Group(); g.name = 'printBed';
  const plate = mk(rb(0.25, 0.006, 0.25, 0.0015), M.aluminium, 'bedPlate'); plate.position.y = -0.003 - 0.0006; g.add(plate);
  const sheet = mk(rb(0.235, 0.0006, 0.235, 0.0002, 1), pei, 'pei', false); sheet.position.y = -0.0003; g.add(sheet);
  return g;
}

/** Two-prong resistive sensor (exposed traces) standing in a soil cup. corrosion(k) swaps the texture. */
export function resistiveSensor({ cup: withCup = true } = {}) {
  const M = materials();
  const g = new THREE.Group(); g.name = 'resistive';
  const W = 0.02, H = 0.06, T = 0.0016;
  const shape = new THREE.Shape();
  // two 7.5 mm tines, 45 mm long, 5 mm gap, header area above (like common two-prong boards)
  shape.moveTo(-W / 2, 0.004); shape.lineTo(-W / 2, H); shape.lineTo(W / 2, H); shape.lineTo(W / 2, 0.004);
  shape.lineTo(W / 2 - 0.003, 0); shape.lineTo(0.0035, 0); shape.lineTo(0.0025, 0.045);
  shape.lineTo(-0.0025, 0.045); shape.lineTo(-0.0035, 0); shape.lineTo(-W / 2 + 0.003, 0); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: true, bevelThickness: 0.0002, bevelSize: 0.0002, bevelSegments: 2 });
  geo.translate(0, 0, -T / 2);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i += 1) uv.setXY(i, (p.getX(i) + W / 2) / W, p.getY(i) / H);
  const mat = new THREE.MeshPhysicalMaterial({ map: corrosionTexture(0), roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const board = mk(geo, mat, 'fork'); g.add(board);
  const hdr = mk(rb(0.0102, 0.0085, 0.0025, 0.0004), M.plasticBlack, 'header'); hdr.position.set(0, H - 0.004, T / 2 + 0.0013); g.add(hdr);
  // soil cup it stands in
  const cupG = new THREE.CylinderGeometry(0.034, 0.028, 0.05, 48, 1, true);
  const cupMat = new THREE.MeshPhysicalMaterial({ color: '#f1f1ee', roughness: 0.2, transmission: 0.5, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const cup = mk(cupG, cupMat, 'cup', false); cup.position.y = 0.025; cup.renderOrder = 3;
  const soilTop = mk(new THREE.CircleGeometry(0.0335, 48), new THREE.MeshStandardMaterial({ color: '#5b4635', roughness: 0.9 }), 'cupSoil', false); soilTop.rotation.x = -Math.PI / 2; soilTop.position.y = 0.045;
  const base = mk(new THREE.CircleGeometry(0.028, 48), cupMat, 'cupBase', false); base.rotation.x = -Math.PI / 2; base.position.y = 0.0005;
  const cg = new THREE.Group(); cg.add(cup, soilTop, base); if (withCup) { g.add(cg); board.position.y = 0.045 - 0.03; hdr.position.y += 0.015; } // traces 30 mm into the soil
  return { group: g, setCorrosion(k) { const t = corrosionTexture(k); if (mat.map !== t) { mat.map = t; mat.needsUpdate = true; } } };
}

/** A clear calibration cup filled with soil of a given wetness (0 dry … 1 saturated). Origin: cup bottom. */
export function soilCup(wet, label) {
  const g = new THREE.Group(); g.name = `cup-${label}`;
  const cupMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, transmission: 0.7, thickness: 0.002, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });
  const cup = mk(new THREE.CylinderGeometry(0.036, 0.03, 0.07, 48, 1, true), cupMat, 'cupWall', false); cup.position.y = 0.035; cup.renderOrder = 3;
  const rim = mk(new THREE.TorusGeometry(0.036, 0.0009, 8, 48), cupMat, 'rim', false); rim.rotation.x = Math.PI / 2; rim.position.y = 0.07;
  const c = new THREE.Color('#9a7a58').lerp(new THREE.Color('#3b2c22'), wet);
  const soilMat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 - 0.5 * wet, normalMap: grainNormal(), normalScale: new THREE.Vector2(1.4, 1.4) });
  const soil = mk(new THREE.CylinderGeometry(0.0347, 0.0298, 0.058, 48), soilMat, 'soil', false); soil.position.y = 0.029;
  g.add(cup, rim, soil);
  // printed label strip
  const [lc, lx] = canvas2d(256, 64); lx.fillStyle = '#ffffff'; roundRect(lx, 2, 2, 252, 60, 10); lx.fill(); lx.fillStyle = '#10261C'; lx.font = '700 34px Inter, system-ui, sans-serif'; lx.textAlign = 'center'; lx.textBaseline = 'middle'; lx.fillText(label, 128, 33);
  const lab = mk(new THREE.CylinderGeometry(0.0335, 0.0328, 0.012, 48, 1, true, -0.6, 1.2), new THREE.MeshStandardMaterial({ map: canvasTexture(lc), roughness: 0.6, transparent: true }), 'label', false);
  lab.position.y = 0.05; lab.scale.setScalar(1.03); g.add(lab);
  return g;
}

/** Kitchen scale with a canvas display. Origin: bottom centre. setReading(text). */
export function kitchenScale() {
  const M = materials();
  const g = new THREE.Group(); g.name = 'scale';
  const body = mk(rb(0.16, 0.022, 0.2, 0.006), M.plasticWhite, 'scaleBody'); body.position.y = 0.011; g.add(body);
  const plate = mk(rb(0.15, 0.003, 0.15, 0.0012), M.steel, 'scalePlate'); plate.position.set(0, 0.0235, -0.015); g.add(plate);
  const [c, x] = canvas2d(256, 96);
  const tex = canvasTexture(c);
  const disp = mk(new THREE.PlaneGeometry(0.05, 0.018), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), 'scaleDisplay', false);
  disp.rotation.x = -Math.PI / 2 + 0.35; disp.position.set(0, 0.0225, 0.083); g.add(disp);
  const setReading = (text) => { if (setReading.last === text) return; setReading.last = text; x.fillStyle = '#0f1a14'; x.fillRect(0, 0, 256, 96); x.fillStyle = '#7dfc9a'; x.font = '700 64px ui-monospace, Menlo, monospace'; x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillText(text, 240, 50); tex.needsUpdate = true; };
  setReading('0.0 g');
  return { group: g, plateY: 0.025, plateZ: -0.015, setReading };
}

/** Bench drying oven (generic) with a door window and a 105 °C display. Origin: bottom centre. */
export function benchOven() {
  const M = materials();
  const g = new THREE.Group(); g.name = 'oven';
  const W = 0.36, H = 0.24, D = 0.28;
  g.add(placed(mk(rb(W, H, D, 0.01), new THREE.MeshPhysicalMaterial({ color: '#e7e8e3', roughness: 0.35, clearcoat: 0.4 }), 'ovenBody'), 0, H / 2, 0));
  const door = mk(rb(W * 0.72, H * 0.78, 0.012, 0.004), M.plasticBlack, 'door'); door.position.set(-W * 0.1, H / 2, D / 2 + 0.004); g.add(door);
  const glass = mk(new THREE.PlaneGeometry(W * 0.56, H * 0.5), new THREE.MeshPhysicalMaterial({ color: '#ffb065', emissive: '#ff8a3d', emissiveIntensity: 0.35, roughness: 0.1, transparent: true, opacity: 0.85 }), 'window', false);
  glass.position.set(-W * 0.1, H / 2 + 0.01, D / 2 + 0.0105); g.add(glass);
  const [c, x] = canvas2d(256, 96); x.fillStyle = '#10140f'; x.fillRect(0, 0, 256, 96); x.fillStyle = '#ff6b4a'; x.font = '700 58px ui-monospace, Menlo, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('105°C', 128, 50);
  const disp = mk(new THREE.PlaneGeometry(0.05, 0.019), new THREE.MeshBasicMaterial({ map: canvasTexture(c), toneMapped: false }), 'ovenDisplay', false); disp.position.set(W * 0.37, H * 0.7, D / 2 + 0.0002); g.add(disp);
  for (let i = 0; i < 2; i += 1) { const k = mk(new THREE.CylinderGeometry(0.009, 0.009, 0.01, 32), M.plasticBlack, 'knob'); k.rotation.x = Math.PI / 2; k.position.set(W * 0.37, H * (0.45 - i * 0.18), D / 2 + 0.005); g.add(k); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = mk(new THREE.CylinderGeometry(0.008, 0.009, 0.006, 24), M.rubber, 'foot'); f.position.set(sx * (W / 2 - 0.03), -0.003, sz * (D / 2 - 0.03)); g.add(f); }
  g.children.forEach((o) => { if (o.name !== 'foot') o.position.y += 0.006; });
  return g;
}

/** P3 display stand: base plate with two saddles (Ø 25.4 at 40 and 180 mm), 15° tilt. Origin: base bottom centre. */
export function p3Stand() {
  const M = materials(); const st = SPEC.P3.stand;
  const g = new THREE.Group(); g.name = 'p3stand';
  const base = mk(rb(st.base[0] / 1000, st.base[2] / 1000, st.base[1] / 1000, 0.0015), M.petgBlack, 'standBase'); base.position.y = st.base[2] / 2000; g.add(base);
  const ang = (st.angleDeg * Math.PI) / 180; const rS = st.saddleId / 2000;
  const saddles = st.saddleAt.map((a) => {
    const x = -st.base[0] / 2000 + 0.02 + (a / 1000) * Math.cos(ang) * 0.92;
    const yAxis = st.base[2] / 1000 + 0.004 + rS + (a / 1000) * Math.sin(ang);
    const s = new THREE.Group();
    const ring = mk(new THREE.CylinderGeometry(rS + 0.003, rS + 0.003, 0.012, 64, 1, true, Math.PI, Math.PI), M.petgBlack, 'saddleRing');
    ring.material = ring.material.clone(); ring.material.side = THREE.DoubleSide;
    ring.rotation.z = Math.PI / 2 + ang; s.add(ring);
    const postH = yAxis - st.base[2] / 1000;
    const post = mk(rb(0.012, postH, 0.016, 0.002), M.petgBlack, 'saddlePost'); post.position.y = -postH / 2; s.add(post);
    s.position.set(x, yAxis, 0); g.add(s);
    return { x, yAxis };
  });
  return { group: g, saddles, angle: ang, axisR: rS };
}

/** Weighted base with a short stake stub for showing the node box on the bench. Origin: floor. */
export function stakeBase(height = 0.36) {
  const M = materials();
  const g = new THREE.Group(); g.name = 'stakeBase';
  const base = mk(new THREE.CylinderGeometry(0.075, 0.08, 0.025, 64), new THREE.MeshStandardMaterial({ color: '#8e918c', roughness: 0.85, normalMap: grainNormal(), normalScale: new THREE.Vector2(0.6, 0.6) }), 'weight');
  base.position.y = 0.0125; g.add(base);
  const bev = mk(new THREE.TorusGeometry(0.0755, 0.002, 8, 64), base.material, 'bevel'); bev.rotation.x = Math.PI / 2; bev.position.y = 0.025; g.add(bev);
  const stub = mk(new THREE.CylinderGeometry(0.01, 0.01, height, 40), M.bamboo, 'stake'); stub.position.y = 0.025 + height / 2; g.add(stub);
  return { group: g, top: 0.025 + height };
}

/** Generic hand auger (T-handle, shaft, spiral flight). Origin: auger tip. */
export function auger() {
  const M = materials();
  const g = new THREE.Group(); g.name = 'auger';
  const shaft = mk(new THREE.CylinderGeometry(0.006, 0.006, 0.9, 24), M.steel, 'shaft'); shaft.position.y = 0.45 + 0.03; g.add(shaft);
  const handle = mk(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 32), new THREE.MeshStandardMaterial({ color: '#c1452f', roughness: 0.5 }), 'handle'); handle.rotation.z = Math.PI / 2; handle.position.y = 0.93; g.add(handle);
  const pts = []; for (let i = 0; i <= 160; i += 1) { const a = i / 160 * Math.PI * 2 * 5; pts.push(new THREE.Vector3(Math.cos(a) * 0.0095, 0.012 + i / 160 * 0.2, Math.sin(a) * 0.0095)); }
  const flight = mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.0028, 8, false), M.steel, 'flight'); g.add(flight);
  const tip = mk(new THREE.ConeGeometry(0.0065, 0.03, 24), M.steel, 'tip'); tip.rotation.x = Math.PI; tip.position.y = 0.015; g.add(tip);
  return g;
}
