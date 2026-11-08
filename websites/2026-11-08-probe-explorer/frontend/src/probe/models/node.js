// N1 node box (×4, identical) on its stake: body with walls/floor/bosses/gasket groove, lid with raised ID,
// two C-clips on the back, PG7 glands on the bottom, perfboard on standoffs, modules, 18650, wiring,
// optional A1 solar bracket. Built in mm; group scaled to metres. Local origin: box bottom face centre,
// back face at z = 0 (the clips extend to −z around the stake).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import SPEC from '../spec/probe-spec.json' with { type: 'json' };
import { materials } from './materials.js';
import { perfboardTexture, pcbTexture, textDecal, heightToNormal } from '../core/textures.js';
import { canvas2d, canvasTexture } from '../core/util.js';

const N = SPEC.N1;
const rb = (w, h, d, r = 1.2, s = 3) => new RoundedBoxGeometry(w, h, d, s, r);
const mk = (g, m, name) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; o.name = name || ''; return o; };

function lidTexture(id) {
  const W = 1150, H = 1350;
  const [c, x] = canvas2d(W / 2, H / 2);
  x.fillStyle = '#000'; x.fillRect(0, 0, W / 2, H / 2);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `800 ${N.text.id * 5}px Inter, system-ui, sans-serif`; x.fillText(id, W / 4, H / 4 - 30);
  x.font = `700 ${N.text.brand * 5}px Inter, system-ui, sans-serif`; x.fillText('AGRI-GRID', W / 4, H / 4 + 70);
  const d = x.getImageData(0, 0, W / 2, H / 2).data; const h = new Float32Array((W / 2) * (H / 2));
  for (let i = 0; i < h.length; i += 1) h[i] = d[i * 4] / 255;
  return { normal: heightToNormal(h, W / 2, H / 2, 3.5, false), mask: canvasTexture(c, { srgb: false }) };
}

/**
 * opts: { id: 'A1', hero: bool (ESP32 + P1 wiring, else NodeMCU), solar: bool, field: bool (IP67 grey Field variant),
 *         lidOpen: 0..1, cutaway: bool }
 */
export function buildNodeBox(opts = {}) {
  const M = materials();
  const id = opts.id || 'A1';
  const field = !!opts.field;
  const W = N.inner[0] + 2 * N.wall, H = N.inner[1] + 2 * N.wall, D = N.floor + N.inner[2] + N.lid;
  const bodyD = N.floor + N.inner[2];
  const root = new THREE.Group(); root.name = `node-${id}`; root.scale.setScalar(0.001);
  const shellMat = field ? M.pvcGrey : M.petgBlack;
  const body = new THREE.Group(); body.name = 'body'; root.add(body);
  // floor (back) + four walls, rounded outside
  body.add(mk(rb(W, H, N.floor, N.cornerR * 0.6), shellMat, 'floor')).position.set(0, H / 2, N.floor / 2);
  const wz = N.floor + N.inner[2] / 2;
  body.add(mk(rb(N.wall, H, N.inner[2] + 0.01, 1.0), shellMat, 'wallL')).position.set(-W / 2 + N.wall / 2, H / 2, wz);
  body.add(mk(rb(N.wall, H, N.inner[2] + 0.01, 1.0), shellMat, 'wallR')).position.set(W / 2 - N.wall / 2, H / 2, wz);
  body.add(mk(rb(W, N.wall, N.inner[2] + 0.01, 1.0), shellMat, 'wallT')).position.set(0, H - N.wall / 2, wz);
  body.add(mk(rb(W, N.wall, N.inner[2] + 0.01, 1.0), shellMat, 'wallB')).position.set(0, N.wall / 2, wz);
  // corner bosses with heat-set inserts
  const bossH = N.inner[2] - 1;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const b = mk(new THREE.CylinderGeometry(N.boss.d / 2, N.boss.d / 2, bossH, 32), shellMat, 'boss');
    b.rotation.x = Math.PI / 2; b.position.set(sx * (W / 2 - N.wall - N.boss.d / 2 + 0.6), sy * (H / 2 - N.wall - N.boss.d / 2 + 0.6) + H / 2, N.floor + bossH / 2);
    body.add(b);
    const ins = mk(new THREE.CylinderGeometry(N.boss.hole / 2, N.boss.hole / 2, 0.6, 24), M.brass, 'insert');
    ins.rotation.x = Math.PI / 2; ins.position.copy(b.position); ins.position.z = N.floor + bossH - 0.2; body.add(ins);
  }
  // gasket cord sitting in the rim groove (visible with the lid open)
  const gPts = [];
  const gw = W - N.wall * 2 + N.wall, gh = H - N.wall * 2 + N.wall;
  for (let i = 0; i <= 64; i += 1) {
    const a = (i / 64) * Math.PI * 2; const cx = Math.cos(a), cy = Math.sin(a);
    const sx = Math.sign(cx) * Math.min(1, Math.abs(cx) * 3), sy = Math.sign(cy) * Math.min(1, Math.abs(cy) * 3);
    gPts.push(new THREE.Vector3(sx * gw / 2, sy * gh / 2 + H / 2, bodyD - 0.4));
  }
  const gasket = mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gPts, true), 128, 1.0, 10, true), M.rubber, 'gasket');
  body.add(gasket);
  // C-clips on the back for the 20 mm stake (opening 14 mm faces away from the box)
  const clipR = N.clips.id / 2;
  for (const at of N.clips.at) {
    const ring = new THREE.Group(); ring.name = 'clip';
    const open = 2 * Math.asin((N.clips.opening / 2) / clipR);
    const prof = [[clipR, -N.clips.h / 2], [clipR + N.clips.wall, -N.clips.h / 2], [clipR + N.clips.wall, N.clips.h / 2], [clipR, N.clips.h / 2], [clipR, -N.clips.h / 2]];
    const lg = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 64, Math.PI + open / 2, Math.PI * 2 - open);
    const rm = mk(lg, shellMat, 'clipRing');
    ring.add(rm);
    const web = mk(rb(N.clips.wall * 2.2, N.clips.h, N.clips.wall + 0.5, 0.8), shellMat, 'clipWeb'); web.position.set(0, 0, clipR + N.clips.wall / 2 - 0.2); ring.add(web);
    ring.position.set(0, at, -(clipR + N.clips.wall));
    body.add(ring);
  }
  // zip-tie slots (back face) — shallow recessed slots drawn as dark inlays
  for (const sy of [45, 85]) { const s = mk(rb(14, 3, 0.4, 0.6), M.rubber, 'zipSlot'); s.position.set(0, sy, -0.1); body.add(s); }
  // bottom glands: PG7 for the probe cable + 8 mm spare with printed plug
  const gl = buildPG7(field ? M.plasticBlack : M.nylon); gl.position.set(0, 0, N.floor + N.inner[2] / 2); body.add(gl);
  const plug = mk(new THREE.CylinderGeometry(4.6, 4.6, 2.4, 32), shellMat, 'sparePlug'); plug.position.set(28, -1.2, N.floor + N.inner[2] / 2); body.add(plug);

  // Lid with raised ID text (normal-mapped) and screws
  const lid = new THREE.Group(); lid.name = 'lid';
  const lt = lidTexture(id);
  const lidMat = shellMat.clone(); lidMat.normalMap = lt.normal; lidMat.normalScale = new THREE.Vector2(1.2, 1.2);
  const lidMesh = mk(rb(W, H, N.lid, N.cornerR * 0.6), [shellMat, shellMat, shellMat, shellMat, lidMat, shellMat], 'lidPanel');
  lid.add(lidMesh);
  const txtMat = new THREE.MeshStandardMaterial({ color: field ? '#2b2e31' : '#d9dcd6', roughness: 0.55, alphaMap: lt.mask, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const txt = new THREE.Mesh(new THREE.PlaneGeometry(W, H), txtMat); txt.position.z = N.lid / 2 + 0.05; txt.renderOrder = 2; lid.add(txt);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const sc = mk(new THREE.CylinderGeometry(2.7, 2.7, 1.6, 24), M.steel, 'screw'); sc.rotation.x = Math.PI / 2;
    sc.position.set(sx * (W / 2 - N.wall - N.boss.d / 2 + 0.6), sy * (H / 2 - N.wall - N.boss.d / 2 + 0.6), N.lid / 2 + 0.8); lid.add(sc);
    const slot = mk(new THREE.BoxGeometry(3.4, 0.5, 0.6), M.rubber); slot.position.copy(sc.position); slot.position.z += 0.6; lid.add(slot);
  }
  // status LED window on the lid
  const ledMat = M.led('#39e07a'); const led = mk(new THREE.SphereGeometry(1.6, 24, 16), ledMat, 'led'); led.position.set(W / 2 - 12, H / 2 - 12, N.lid / 2 + 0.4); led.scale.z = 0.5; lid.add(led);
  lid.position.set(0, H / 2, bodyD + N.lid / 2);
  root.add(lid);

  // A1 solar bracket on the two lid bosses, 20° tilt, 1 W panel
  let panel = null;
  if (opts.solar) {
    const br = new THREE.Group(); br.name = 'solar';
    for (const sx of [-1, 1]) {
      const boss = mk(new THREE.CylinderGeometry(3.6, 3.6, 4, 24), shellMat, 'lidBoss'); boss.rotation.x = Math.PI / 2; boss.position.set(sx * 30, H - 18, D + 2); br.add(boss);
      const arm = mk(rb(4, 46, 6, 1.2), M.aluminium, 'arm'); arm.position.set(sx * 30, H + 3, D + 7); arm.rotation.x = -0.25; br.add(arm);
    }
    panel = new THREE.Group();
    const frame = mk(rb(N.solar.panel[0] + 4, 2.6, N.solar.panel[1] + 4, 1.0), M.aluminium, 'panelFrame'); panel.add(frame);
    const [pc, px] = canvas2d(440, 280); px.fillStyle = '#152238'; px.fillRect(0, 0, 440, 280); px.strokeStyle = '#7f93b0'; px.lineWidth = 1.5;
    for (let i = 1; i < 6; i += 1) { px.beginPath(); px.moveTo((i / 6) * 440, 0); px.lineTo((i / 6) * 440, 280); px.stroke(); }
    for (let j = 1; j < 3; j += 1) { px.beginPath(); px.moveTo(0, (j / 3) * 280); px.lineTo(440, (j / 3) * 280); px.stroke(); }
    const cells = new THREE.Mesh(new THREE.PlaneGeometry(N.solar.panel[0], N.solar.panel[1]), new THREE.MeshPhysicalMaterial({ map: canvasTexture(pc), roughness: 0.18, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 }));
    cells.rotation.x = -Math.PI / 2; cells.position.y = 1.35; panel.add(cells);
    panel.position.set(0, H + 26, D - 6); panel.rotation.x = (N.solar.tiltDeg * Math.PI) / 180;
    br.add(panel);
    root.add(br);
  }

  // Internals: perfboard on standoffs, modules, 18650 holder, J1 header, wiring
  const inside = new THREE.Group(); inside.name = 'internals';
  const so = N.standoffs;
  const boardZ = N.floor + so.h;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const s = mk(new THREE.CylinderGeometry(so.d / 2, so.d / 2, so.h, 24), shellMat, 'standoff'); s.rotation.x = Math.PI / 2;
    s.position.set(sx * so.pattern[0] / 2, H / 2 + 6 + sy * so.pattern[1] / 2, N.floor + so.h / 2); inside.add(s);
  }
  const bw = so.pattern[0] + 8, bh = so.pattern[1] + 8;
  const board = mk(new THREE.BoxGeometry(bw, bh, 1.6), [M.pcbBlack, M.pcbBlack, M.pcbBlack, M.pcbBlack, new THREE.MeshStandardMaterial({ map: perfboardTexture(bw, bh, true), roughness: 0.55 }), M.pcbBlack], 'perfboard');
  board.position.set(0, H / 2 + 6, boardZ + 0.8); inside.add(board);
  const top = boardZ + 1.6;
  const mod = (w, h, t, tex, x, y, name) => { const m = mk(new THREE.BoxGeometry(w, h, t), [M.pcbBlack, M.pcbBlack, M.pcbBlack, M.pcbBlack, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), M.pcbBlack], name); m.position.set(x, H / 2 + 6 + y, top + 2.5 + t / 2); inside.add(m); return m; };
  if (opts.hero) {
    const esp = mod(27.9, 54.4, 1.6, pcbTexture('esp32', { w: 27.9, h: 54.4, color: '#1d2228', text: 'ESP32', sub: 'DevKitC V4', pads: 15 }), -14, 6, 'esp32');
    const can = mk(rb(16, 18, 2.6, 0.4), M.aluminium, 'shield'); can.position.set(esp.position.x, esp.position.y + 12, esp.position.z + 2.1); inside.add(can);
    mod(17, 26, 1.2, pcbTexture('tp4056', { w: 17, h: 26, color: '#1f4e9a', text: 'TP4056', sub: '+DW01' }), 18, 22, 'tp4056');
    mod(22, 26, 1.2, pcbTexture('ina219', { w: 22, h: 26, color: '#5a2a7a', text: 'INA219' }), 18, -8, 'ina219');
    mod(12, 10, 1.6, pcbTexture('ht7833', { w: 12, h: 10, color: '#2a2a2a', text: 'HT7833' }), 2, -30, 'ht7833');
    const j1 = mk(new THREE.BoxGeometry(28, 2.6, 8.5), M.plasticBlack, 'J1'); j1.position.set(-10, H / 2 + 6 - bh / 2 + 8, top + 4.25); inside.add(j1);
    const sw = mk(new THREE.BoxGeometry(8.6, 3.6, 3.6), M.plasticBlack, 'SW1'); sw.position.set(22, H / 2 + 6 - bh / 2 + 7, top + 1.8); inside.add(sw);
  } else {
    mod(31, 58, 1.6, pcbTexture('nodemcu', { w: 31, h: 58, color: '#1b1f23', text: 'NodeMCU', sub: 'ESP8266', pads: 15 }), -12, 4, 'nodemcu');
    mod(17, 26, 1.2, pcbTexture('tp4056b', { w: 17, h: 26, color: '#1f4e9a', text: 'TP4056' }), 18, 18, 'tp4056');
    mod(12, 10, 1.6, pcbTexture('ht7833b', { w: 12, h: 10, color: '#2a2a2a', text: 'HT7833' }), 18, -14, 'ht7833');
  }
  // 18650 holder + cell under the board (on the floor)
  const holder = mk(rb(N.battery[0] - 4, 21, 16, 1.0), M.plasticBlack, 'holder'); holder.position.set(0, 16 + N.wall, N.floor + 8); inside.add(holder);
  const cell = mk(new THREE.CylinderGeometry(9.3, 9.3, 65, 40), new THREE.MeshPhysicalMaterial({ color: '#2d7d5a', roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 }), 'cell18650');
  cell.rotation.z = Math.PI / 2; cell.position.set(0, 16 + N.wall, N.floor + 9.6); inside.add(cell);
  for (const sx of [-1, 1]) { const cap = mk(new THREE.CylinderGeometry(9.3, 9.3, 0.8, 40), M.tin); cap.rotation.z = Math.PI / 2; cap.position.set(sx * 32.9, 16 + N.wall, N.floor + 9.6); inside.add(cap); }
  // a few point-to-point wires on the board
  const wcol = ['#c0392b', '#1d1f21', '#e67e22', '#2f80c9', '#27ae60'];
  for (let i = 0; i < 5; i += 1) {
    const y0 = H / 2 + 6 - 20 + i * 8;
    const pts = [new THREE.Vector3(-30, y0, top + 0.5), new THREE.Vector3(-20, y0 + 3, top + 4), new THREE.Vector3(6, y0 - 2, top + 4), new THREE.Vector3(14, y0 + 4, top + 0.5)];
    const w = mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.45, 16, false), M.wire(wcol[i]), 'boardWire'); inside.add(w);
  }
  if (opts.internals !== false) root.add(inside);

  const api = {
    root, lid, inside, panel, led, ledMat,
    outer: { w: W, h: H, d: D },
    /** 0..1 lid swings off forward and up. */
    setLidOpen(k, mode = 'swing') {
      if (mode === 'aside') { lid.position.set(175 * k, H / 2, bodyD + N.lid / 2 + 30 * Math.sin(Math.PI * k)); lid.rotation.set(0, -0.35 * k, 0); }
      else { lid.position.set(0, H / 2 + 40 * k, bodyD + N.lid / 2 + 70 * k); lid.rotation.set(-0.5 * k, 0, 0); }
      gasket.visible = true;
    },
    setLed(color, intensity) { ledMat.color.set(color); ledMat.emissive.set(color); ledMat.emissiveIntensity = intensity; },
  };
  api.setLidOpen(opts.lidOpen || 0);
  return api;
}

/** PG7 gland pointing down (hex at the wall, dome below). Origin at the outer wall face. */
export function buildPG7(mat) {
  const g = new THREE.Group(); g.name = 'pg7';
  const hexR = 15 / 2 / Math.cos(Math.PI / 6);
  const hex = mk(new THREE.CylinderGeometry(hexR, hexR, 4, 6), mat, 'hex'); hex.position.y = -2; g.add(hex);
  const domeProf = [[6.8, 0], [7.2, 0], [7.2, -5], [5.9, -8.3], [3.4, -9], [3.0, -8.6]];
  const dome = mk(new THREE.LatheGeometry(domeProf.map(([r, y]) => new THREE.Vector2(r, y)), 64), mat, 'dome'); dome.position.y = -4; g.add(dome);
  return g;
}
