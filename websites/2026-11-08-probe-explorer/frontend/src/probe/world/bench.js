// The product studio for the bench chapters: the hero probe (lying for scale, or exploded for the build),
// the print bed, the four prints, calibration cups / scale / oven, and the node box on a weighted stake base.
// Every pose keeps real contacts: a probe lying on the floor rests on its cap rim and its tube, tilted by
// asin((r_cap − r_tube) / span); cups stand on the floor; the box hangs on its stake by both clips.
import * as THREE from 'three';
import { createStudio } from './studio.js';
import { buildProbe } from '../models/probe.js';
import { buildNodeBox } from '../models/node.js';
import { probeParts, lyingPose } from '../spec/layout.js';
import { pen, steelRule, printBed, soilCup, kitchenScale, benchOven, p3Stand, stakeBase } from './props.js';
import SPEC from '../spec/probe-spec.json' with { type: 'json' };
import { materials } from '../models/materials.js';

const mm = (v) => v / 1000;

export { lyingPose };

export function createBench(stage) {
  const blackPetg = materials().petgBlack;
  const st = createStudio(stage);
  const scene = st.scene;
  const hero = buildProbe('P1'); scene.add(hero.root);
  const p2 = buildProbe('P2'); scene.add(p2.root);
  const p3 = buildProbe('P1'); p3.setSection(true); p3.setTranslucent(0); scene.add(p3.root);
  const p4 = buildProbe('P4'); scene.add(p4.root);
  const p3s = p3Stand(); scene.add(p3s.group);
  const penM = pen(); scene.add(penM);
  const rule = steelRule(); scene.add(rule);
  const bed = printBed(); scene.add(bed);
  // print layout: clones of the half shells, lying arch-up with the seam faces on the bed
  const printSet = new THREE.Group(); printSet.name = 'printSet'; printSet.scale.setScalar(0.001); scene.add(printSet);
  const lay = (src, rotZ, x, z, lift) => { const c = src.clone(true); c.position.set(0, 0, 0); const holder = new THREE.Group(); holder.add(c); holder.rotation.z = rotZ; holder.position.set(x, lift, z); printSet.add(holder); return holder; };
  // half A: local −x → +y (rot −π/2), axis along +x; half B: rot +π/2. Lifted by the 1 mm tongue / 0 for the groove side.
  const P = probeParts('P1');
  const lowerMid = (P.lower[0] + P.lower[1]) / 2, upperMid = (P.upper[0] + P.upper[1]) / 2;
  const h1 = lay(hero.parts.lowerA.whole, -Math.PI / 2, -lowerMid * 0, -70, SPEC.P1.seam.tongue[1]); h1.children[0].position.y = -lowerMid; h1.position.x = 0;
  const h2 = lay(hero.parts.lowerB.whole, Math.PI / 2, 0, -25, 0); h2.children[0].position.y = -lowerMid;
  const h3 = lay(hero.parts.upperA.whole, -Math.PI / 2, -40, 25, SPEC.P1.seam.tongue[1]); h3.children[0].position.y = -upperMid;
  const h4 = lay(hero.parts.upperB.whole, Math.PI / 2, -40, 70, 0); h4.children[0].position.y = -upperMid;
  void h1; void h2; void h3; void h4;
  // as printed: bare black PETG shells (no copper, no seam bead, no paint, no painted numbers)
  printSet.traverse((o) => {
    if ((o.userData && o.userData.e) || o.name === 'gndBus' || o.name === 'epoxy') o.visible = false;
    if (o.isMesh && o.material && o.material.map && o.material.transparent) o.visible = false; // number decal
    if (o.isMesh && o.material && o.material.color && o.material.color.getHexString() === 'eceee9') o.material = blackPetg;
  });

  const cups = [0, 0.2, 0.4, 0.6, 0.8, 1].map((w, i) => { const c = soilCup(w, `Cup ${i + 1}`); scene.add(c); return c; });
  const scale = kitchenScale(); scene.add(scale.group);
  const oven = benchOven(); scene.add(oven);
  const baseP = stakeBase(0.36); scene.add(baseP.group);
  const nodeP = buildNodeBox({ id: 'A1', hero: true, solar: true }); scene.add(nodeP.root);
  const nodeF = buildNodeBox({ id: 'A1', hero: true, solar: true, field: true }); scene.add(nodeF.root);
  // node hangs on the stake: clip ring centre at the stake axis offset by the clearance (see nodeBoxLayout)
  const N1 = SPEC.N1; const clipR = N1.clips.id / 2; const clearance = clipR - N1.clips.stakeD / 2;
  const placeNode = (n, yBottom) => { n.root.position.set(0, yBottom, mm(clearance + clipR + N1.clips.wall)); };

  const groups = { hero: hero.root, p2: p2.root, p3: p3.root, p4: p4.root, p3s: p3s.group, pen: penM, rule, bed, printSet, scale: scale.group, oven, base: baseP.group, nodeP: nodeP.root, nodeF: nodeF.root };
  const api = {
    scene, studio: st, hero, p2, p3, p4, p3s, pen: penM, rule, bed, printSet, cups, scale, oven, base: baseP, nodeP, nodeF,
    /** Show only the named groups (and cups when listed as 'cups'). */
    show(list) {
      const on = new Set(list);
      for (const [k, g] of Object.entries(groups)) g.visible = on.has(k);
      cups.forEach((c) => { c.visible = on.has('cups'); });
    },
    lie(probe, kind, x, z) { const p = lyingPose(kind); probe.root.rotation.set(0, 0, p.rotZ); probe.root.position.set(x, p.y0, z); },
    upright(probe, y) { probe.root.rotation.set(0, 0, 0); probe.root.position.set(0, y, 0); },
    placeNode,
    frame(c, r) { st.frame(c, r); },
  };
  // fixed placements
  penM.position.set(0, 0, 0.055); rule.position.set(0.02, 0, 0.095);
  bed.position.set(0, 0.0066, 0); printSet.position.set(0, 0.0066, 0);
  scale.group.position.set(0.16, 0, 0.02); oven.position.set(0.45, 0, -0.12);
  p3s.group.position.set(0.05, 0, -0.02);
  placeNode(nodeP, baseP.top - 0.15); placeNode(nodeF, baseP.top - 0.15);
  return api;
}
