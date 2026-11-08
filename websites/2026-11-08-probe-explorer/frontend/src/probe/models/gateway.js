// Farmhouse gateway, two variants (generic and unbranded).
// Prototype (today): clear-lid IP junction box, 230 V AC → 5 V / 3.3 V module, ESP32, SIM800L (2G SMS) with
// its spring antenna, relay module for the 12 V pump, cable gland and a 2-pin mains plug lead. Wall-mounted
// with two screws through the box's mounting lugs.
// Field (ideal): IP67 box on a galvanised mast with a 10 W panel and an 865 MHz LoRa whip, clamped by U-bolts.
// Built in mm; root scaled to metres. Origin: centre of the back face (on the wall), +z out of the wall.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { materials } from './materials.js';
import { pcbTexture } from '../core/textures.js';
import { canvas2d, canvasTexture } from '../core/util.js';

const placed = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const mk = (g, m, name, cast = true) => { const o = new THREE.Mesh(g, m); o.name = name || ''; o.castShadow = cast; o.receiveShadow = true; return o; };
const rb = (w, h, d, r, s = 3) => new RoundedBoxGeometry(w, h, d, s, r);

function module(w, h, t, tex, M) { return mk(new THREE.BoxGeometry(w, h, t), [M.pcbBlack, M.pcbBlack, M.pcbBlack, M.pcbBlack, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), M.pcbBlack], 'module'); }

export function buildGatewayPrototype() {
  const M = materials();
  const root = new THREE.Group(); root.name = 'gateway-prototype'; root.scale.setScalar(0.001);
  const W = 150, H = 110, D = 70, wall = 2.5;
  const boxMat = new THREE.MeshPhysicalMaterial({ color: '#d9dcd8', roughness: 0.45, clearcoat: 0.3 });
  const body = new THREE.Group(); root.add(body);
  body.add(placed(mk(rb(W, H, wall, 3), boxMat, 'back'), 0, 0, wall / 2));
  for (const [w, h, x, y] of [[wall, H, -W / 2 + wall / 2, 0], [wall, H, W / 2 - wall / 2, 0], [W, wall, 0, H / 2 - wall / 2], [W, wall, 0, -H / 2 + wall / 2]]) {
    body.add(placed(mk(rb(w, h, D - 6, 1.2), boxMat, 'wall'), x, y, (D - 6) / 2));
  }
  // mounting lugs + screws into the wall
  for (const sy of [-1, 1]) {
    const lug = mk(rb(16, 12, 4, 1.5), boxMat, 'lug'); lug.position.set(0, sy * (H / 2 + 6), 2); body.add(lug);
    const screw = mk(new THREE.CylinderGeometry(3.6, 3.6, 2, 24), M.steel, 'screw'); screw.rotation.x = Math.PI / 2; screw.position.set(0, sy * (H / 2 + 6), 5); body.add(screw);
  }
  // clear lid with gasket line
  const lid = mk(rb(W, H, 6, 3), M.clearLid, 'clearLid', false); lid.position.z = D - 3; lid.renderOrder = 5; root.add(lid);
  // inside: DIN-ish mounting plate + modules
  const plate = mk(rb(W - 14, H - 14, 2, 1), M.plasticWhite, 'plate'); plate.position.z = wall + 1; body.add(plate);
  const z0 = wall + 2;
  const psu = mk(rb(46, 30, 20, 2), new THREE.MeshStandardMaterial({ color: '#2b2e31', roughness: 0.5 }), 'acdc'); psu.position.set(-42, 22, z0 + 10); body.add(psu);
  const [lc, lx] = canvas2d(256, 160); lx.fillStyle = '#2b2e31'; lx.fillRect(0, 0, 256, 160); lx.fillStyle = '#e8e8e2'; lx.font = '700 26px Inter, system-ui, sans-serif'; lx.fillText('AC 230V IN', 16, 46); lx.fillText('DC 5V OUT', 16, 90); lx.font = '500 20px Inter, system-ui, sans-serif'; lx.fillText('isolated module', 16, 130);
  const psuLab = mk(new THREE.PlaneGeometry(44, 28), new THREE.MeshStandardMaterial({ map: canvasTexture(lc), roughness: 0.5 }), 'acdcLabel', false); psuLab.position.set(-42, 22, z0 + 20.05); body.add(psuLab);
  const esp = module(28, 54, 1.6, pcbTexture('gw-esp32', { w: 28, h: 54, color: '#1d2228', text: 'ESP32', sub: 'gateway', pads: 15 }), M); esp.position.set(8, 6, z0 + 8); body.add(esp);
  const can = mk(rb(16, 18, 2.6, 0.4), M.aluminium, 'shield'); can.position.set(8, 18, z0 + 10); body.add(can);
  const sim = module(24, 24, 1.6, pcbTexture('gw-sim', { w: 24, h: 24, color: '#1b3a6b', text: 'SIM800L', sub: '2G SMS' }), M); sim.position.set(46, 24, z0 + 8); body.add(sim);
  const spring = []; for (let i = 0; i <= 120; i += 1) { const a = i / 120 * Math.PI * 2 * 12; spring.push(new THREE.Vector3(46 + 10 + Math.cos(a) * 2.2, 24 + 4 + i / 120 * 26, z0 + 12 + Math.sin(a) * 2.2)); }
  const ant = mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spring), 480, 0.35, 8, false), M.brass, 'simAntenna'); body.add(ant);
  const relay = module(26, 34, 1.6, pcbTexture('gw-relay', { w: 26, h: 34, color: '#1f4e9a', text: 'RELAY', sub: '12 V pump' }), M); relay.position.set(44, -26, z0 + 8); body.add(relay);
  const relayCube = mk(rb(15, 19, 15, 1), new THREE.MeshStandardMaterial({ color: '#2a63c9', roughness: 0.4 }), 'relayCube'); relayCube.position.set(44, -22, z0 + 16.5); body.add(relayCube);
  const term = mk(rb(26, 8, 10, 1), new THREE.MeshStandardMaterial({ color: '#2f8a4f', roughness: 0.5 }), 'terminal'); term.position.set(-40, -30, z0 + 5); body.add(term);
  // LEDs
  const ledMat = M.led('#39e07a'); const led = mk(new THREE.SphereGeometry(1.4, 16, 10), ledMat, 'led'); led.position.set(-2, -20, z0 + 10); body.add(led);
  const txMat = M.led('#33c6e0'); const tx = mk(new THREE.SphereGeometry(1.2, 16, 10), txMat, 'txLed'); tx.position.set(4, -20, z0 + 10); body.add(tx);
  // wires inside
  const wcol = ['#c0392b', '#1d1f21', '#2f80c9', '#f1c40f'];
  [[[-42, 6, z0 + 10], [-20, -4, z0 + 14], [4, -12, z0 + 10]], [[-42, 8, z0 + 9], [-10, 40, z0 + 14], [40, 36, z0 + 10]], [[16, -12, z0 + 9], [30, -22, z0 + 14], [40, -40, z0 + 10]], [[-40, -26, z0 + 9], [-48, -10, z0 + 12], [-48, 6, z0 + 10]]]
    .forEach((pts, i) => body.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 24, 0.7, 12, false), M.wire(wcol[i]), 'gwWire')));
  // bottom glands: mains lead (2-pin plug) and pump lead
  const glands = [];
  for (const gx of [-40, 40]) {
    const hex = mk(new THREE.CylinderGeometry(8.6, 8.6, 4, 6), M.plasticBlack, 'gland'); hex.position.set(gx, -H / 2 - 2, D / 2); body.add(hex);
    const dome = mk(new THREE.CylinderGeometry(6.4, 7.6, 8, 32), M.plasticBlack, 'glandDome'); dome.position.set(gx, -H / 2 - 8, D / 2); body.add(dome);
    glands.push(new THREE.Vector3(gx, -H / 2 - 12, D / 2));
  }
  return { root, ledMat, txMat, glands, size: { w: W, h: H, d: D } };
}

/** 2-pin plug on a lead (Type C style), unbranded. Origin: plug body centre. */
export function mainsPlug() {
  const M = materials();
  const g = new THREE.Group(); g.scale.setScalar(0.001);
  const body = mk(rb(20, 34, 16, 4), M.plasticWhite, 'plug'); g.add(body);
  for (const sx of [-1, 1]) { const pin = mk(new THREE.CylinderGeometry(2, 2, 18, 20), M.brass, 'pin'); pin.position.set(sx * 9.5, -26, 0); g.add(pin); }
  return g;
}

export function buildGatewayField() {
  const M = materials();
  const root = new THREE.Group(); root.name = 'gateway-field'; root.scale.setScalar(0.001);
  const mastH = 3200;
  const galv = M.aluminium;
  const mast = mk(new THREE.CylinderGeometry(24, 24, mastH, 40), galv, 'mast'); mast.position.y = mastH / 2 - 600; root.add(mast); // 600 mm in the ground
  const capM = mk(new THREE.SphereGeometry(24, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), galv, 'mastCap'); capM.position.y = mastH - 600; root.add(capM);
  const box = mk(rb(180, 230, 90, 6), M.pvcGrey, 'ip67Box'); box.position.set(0, 1500, 24 + 45 + 6); root.add(box);
  for (const y of [1420, 1580]) { const ub = mk(new THREE.TorusGeometry(26, 3.2, 12, 40, Math.PI), M.steel, 'uBolt'); ub.position.set(0, y, 0); ub.rotation.y = Math.PI; ub.rotation.x = Math.PI / 2; root.add(ub); const br = mk(rb(70, 20, 8, 2), M.steel, 'bracket'); br.position.set(0, y, 28); root.add(br); }
  const ledMat = M.led('#39e07a'); const led = mk(new THREE.SphereGeometry(3, 16, 10), ledMat, 'led'); led.position.set(60, 1590, 24 + 90 + 7); root.add(led);
  const txMat = M.led('#33c6e0'); const tx = mk(new THREE.SphereGeometry(3, 16, 10), txMat, 'txLed'); tx.position.set(72, 1590, 24 + 90 + 7); root.add(tx);
  // solar panel on a tilt bracket near the top
  const panel = new THREE.Group();
  const frame = mk(rb(540, 30, 350, 4), M.aluminium, 'frame'); panel.add(frame);
  const [pc, px] = canvas2d(540, 350); px.fillStyle = '#132036'; px.fillRect(0, 0, 540, 350); px.strokeStyle = '#7f93b0'; px.lineWidth = 2;
  for (let i = 1; i < 9; i += 1) { px.beginPath(); px.moveTo(i * 60, 0); px.lineTo(i * 60, 350); px.stroke(); } for (let j = 1; j < 6; j += 1) { px.beginPath(); px.moveTo(0, j * 58); px.lineTo(540, j * 58); px.stroke(); }
  const cells = mk(new THREE.PlaneGeometry(530, 340), new THREE.MeshPhysicalMaterial({ map: canvasTexture(pc), roughness: 0.15, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 }), 'cells', false); cells.rotation.x = -Math.PI / 2; cells.position.y = 15.5; panel.add(cells);
  panel.position.set(0, 2350, 200); panel.rotation.x = 0.45; root.add(panel);
  const arm = mk(rb(30, 30, 210, 3), M.steel, 'arm'); arm.position.set(0, 2330, 100); root.add(arm);
  // LoRa whip on top
  const whip = mk(new THREE.CylinderGeometry(5, 9, 900, 24), new THREE.MeshStandardMaterial({ color: '#efefea', roughness: 0.35 }), 'loraWhip'); whip.position.y = mastH - 600 + 470; root.add(whip);
  const base = mk(new THREE.CylinderGeometry(14, 14, 40, 24), M.steel, 'whipBase'); base.position.y = mastH - 600 + 20; root.add(base);
  return { root, ledMat, txMat, antennaTop: new THREE.Vector3(0, mastH - 600 + 920, 0) };
}
