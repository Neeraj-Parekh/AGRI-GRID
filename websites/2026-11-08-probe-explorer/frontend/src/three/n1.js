// Site-scene adapters for the Probe Explorer models: the N1 node box hung on its stake by both C-clips,
// the probe top beside it, and the Prototype gateway box on a pole. The site's scenes are drawn at a display
// scale (`k` × real size) so the hardware reads at farm distance; proportions and contacts stay true.
import * as THREE from 'three';
import { buildNodeBox } from '../probe/models/node.js';
import { buildGatewayPrototype } from '../probe/models/gateway.js';
import { materials } from '../probe/models/materials.js';
import { textSprite } from './lib.js';
import SPEC from '../probe/spec/probe-spec.json' with { type: 'json' };

const STATUS = { normal: '#3dff7a', watch: '#ffc23d', alert: '#ff4b3a' };

/** N1 box on a stake at display scale k. Returns a Group with userData { top, setStatus, ping, tick }. */
export function n1OnStake(id, { k = 3.5, hero = false, stakeH = 1.5, probe = true, label = true } = {}) {
  const M = materials();
  const g = new THREE.Group(); g.name = `n1-${id}`;
  const N = SPEC.N1; const s = k / 1000;
  const stakeR = (N.clips.stakeD / 2) * s;
  const stake = new THREE.Mesh(new THREE.CylinderGeometry(stakeR, stakeR, stakeH, 24), M.bamboo); stake.position.y = stakeH / 2 - 0.25; stake.castShadow = true; stake.receiveShadow = true; g.add(stake);
  const box = buildNodeBox({ id, hero, solar: hero, internals: false });
  box.root.scale.setScalar(s);
  // clip ring centre sits on the stake axis, offset by the clearance so the stake bears on the ring
  const clipR = N.clips.id / 2, clearance = clipR - N.clips.stakeD / 2;
  const boxH = (N.inner[1] + 2 * N.wall) * s;
  const bottom = stakeH - 0.25 - boxH - 0.05;
  box.root.position.set(0, bottom, (clearance + clipR + N.clips.wall) * s);
  g.add(box.root);
  if (probe) {
    const pr = new THREE.Mesh(new THREE.CylinderGeometry(12.5 * s, 12.5 * s, 140 * s, 32), M.petgWhite); pr.position.set(0.28 * k, 70 * s, 0.05 * k); pr.castShadow = true; g.add(pr);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(16 * s, 16 * s, 30 * s, 32), M.petgWhite); cap.position.set(0.28 * k, 140 * s, 0.05 * k); cap.castShadow = true; g.add(cap);
  }
  let tag = null;
  if (label) { tag = textSprite(id, { size: 0.32 }); tag.position.set(0, stakeH + 0.25, 0); g.add(tag); }
  let status = 'normal', flash = 0;
  g.userData = {
    top: new THREE.Vector3(0, bottom + boxH, 0.1),
    label: tag,
    setStatus(st) { status = st; },
    ping() { flash = 1; },
    tick(t, dt) {
      flash = Math.max(0, flash - (dt || 0.016) * 1.8);
      const blink = status === 'alert' ? 0.5 + 0.5 * Math.sin(t * 7) : 0.7 + 0.3 * Math.sin(t * 2);
      box.setLed(STATUS[status] || STATUS.normal, 1.5 + 5 * blink + flash * 8);
    },
  };
  return g;
}

/** Prototype gateway box (clear lid, generic) on a pole at display scale k. userData { top, receive, tick }. */
export function gatewayOnPole({ k = 3.2, poleH = 3.2, label = 'Gateway · SMS' } = {}) {
  const M = materials();
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, poleH, 24), M.aluminium); pole.position.y = poleH / 2; pole.castShadow = true; g.add(pole);
  const gw = buildGatewayPrototype(); gw.root.scale.setScalar(k / 1000);
  // back plate bolted to the pole with two U-bolts
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.2 * k * 0.6, 0.15 * k, 0.012), M.steel); plate.position.set(0, poleH - 0.6, 0.06); g.add(plate);
  for (const dy of [-0.18, 0.18]) { const ub = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.008, 8, 24, Math.PI), M.steel); ub.rotation.set(Math.PI / 2, 0, Math.PI); ub.position.set(0, poleH - 0.6 + dy, 0.0); g.add(ub); }
  gw.root.position.set(0, poleH - 0.6, 0.066); g.add(gw.root);
  const tip = new THREE.Vector3(0.056 * k, poleH - 0.6 + 0.03 * k, 0.066 + 0.04 * k);
  const tag = textSprite(label, { size: 0.3 }); tag.position.set(0, poleH + 0.45, 0); g.add(tag);
  let pulse = 0;
  g.userData = { top: tip, receive() { pulse = 1; }, tick(t, dt) { pulse = Math.max(0, pulse - (dt || 0.016) * 1.2); gw.txMat.emissiveIntensity = 1 + 9 * pulse; gw.ledMat.emissiveIntensity = 2 + Math.sin(t * 2); } };
  return g;
}
