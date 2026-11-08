// Assembly constraints: which parts touch, which must never intersect, and what holds each part up.
// Pure JS (no three.js). The test (tests/run-tests.mjs) evaluates every rule; the explorer shows the
// same list in the "Assembly check" spec card.
//
// Gaps are in mm. A contact passes when its minimum gap is within [-allowOverlap, maxGap].
// Clearance fits rest on one side, so the minimum gap of a centred 0.2 mm clearance is 0.2 mm,
// and a part that bears on one side (the stake in its clips) has a minimum gap of 0.
import SPEC from './probe-spec.json' with { type: 'json' };
import { electrodeLayout, halfBLayout, probeParts, nodeBoxLayout, cablePath, polylineLength, gaugeLayout, bundHeightAt, WORLD } from './layout.js';

const P1 = SPEC.P1;
const pp = probeParts('P1');
const nb = nodeBoxLayout();
const cab = cablePath();
const hb = halfBLayout();
const N1 = SPEC.N1;

/** Declared contacts. `gap()` returns the minimum surface gap in mm (negative = interference). */
export const CONTACTS = [
  { a: 'probe.tube', b: 'soil.augerHole', why: 'Auger hole wall touches the tube (no air gap)', gap: () => (P1.tube.od / 2) - (P1.tube.od / 2) },
  { a: 'probe.soilGroove', b: 'soil.surface', why: 'Soil-line groove sits exactly at the soil surface', gap: () => Math.abs(P1.soilGroove.z - 0) },
  { a: 'probe.tipCone', b: 'soil.holeBottom', why: 'Tip cone seated in the soil at the hole bottom', gap: () => 0 },
  { a: 'probe.tipPlug', b: 'probe.lowerBore', why: 'Tip plug inside the bore (sliding fit)', gap: () => pp.rIn - pp.tip.plugR },
  { a: 'probe.tipShoulder', b: 'probe.lowerEnd', why: 'Tube end rests on the tip shoulder', gap: () => Math.abs(pp.lower[0] - pp.tip.yTop) },
  { a: 'probe.coupler', b: 'probe.lowerBore', why: 'Coupler 15 mm into the lower section', gap: () => pp.rIn - pp.coupler.r, check: () => (pp.lower[1] - pp.coupler.y0) === P1.coupler.length / 2 },
  { a: 'probe.coupler', b: 'probe.upperBore', why: 'Coupler 15 mm into the upper section', gap: () => pp.rIn - pp.coupler.r, check: () => (pp.coupler.y1 - pp.upper[0]) === P1.coupler.length / 2 },
  { a: 'probe.lowerTopEnd', b: 'probe.upperBottomEnd', why: 'Sections butt together at Z +10', gap: () => Math.abs(pp.lower[1] - pp.upper[0]) },
  { a: 'probe.capSocket', b: 'probe.upperOuter', why: 'Cap socket over the tube top (sliding fit)', gap: () => pp.cap.socketR - pp.rOut, check: () => (pp.upper[1] - pp.cap.y0) === P1.cap.socketDepth },
  { a: 'probe.capSocketFloor', b: 'probe.upperTopEnd', why: 'Tube top seats on the socket floor', gap: () => Math.abs(pp.cap.chamberY0 - pp.upper[1]) },
  { a: 'probe.glandThread', b: 'probe.capHole', why: 'PG7 gland threaded into the cap', gap: () => pp.cap.holeR - pp.gland.threadR },
  { a: 'probe.glandHex', b: 'probe.capTop', why: 'Gland hex body seats on the cap top', gap: () => 0 },
  { a: 'probe.cable', b: 'probe.glandSeal', why: 'Cable OD within the PG7 seal range (3–6.5 mm)', gap: () => 0, check: () => P1.gland.cableOd >= 3 && P1.gland.cableOd <= 6.5 },
  { a: 'probe.copper', b: 'probe.innerWall', why: 'Copper tape flush in its 0.15 mm pockets', gap: () => 0.02, maxGap: 0.05 },
  { a: 'probe.wires', b: 'probe.ribChannel', why: 'Wires run inside the bore between the half-B ribs', gap: () => 0, check: () => wiresFitChannel() },
  { a: 'probe.wires', b: 'probe.couplerSlot', why: 'Wires pass the coupler through its 6 mm slot, aligned with the ribs', gap: () => 0, check: () => slotClearsRibs() },
  { a: 'probe.ds18b20', b: 'probe.innerWallB', why: 'DS18B20 pressed against the wall by its clip', gap: () => Math.abs((hb.dsCentreR + P1.ds18b20.diameter / 2) - pp.rIn) },
  { a: 'probe.cable', b: 'node.glandBottom', why: 'Cable enters the node box through its bottom PG7 gland', gap: () => 0 },
  { a: 'probe.cable', b: 'dripLoop', why: 'Drip loop: low point below the box gland entry', gap: () => 0, check: () => cab.lowY < cab.entryY - 10 },
  { a: 'probe.cable', b: 'leadLength', why: `Probe lead ≤ ${P1.cable.maxLeadMm} mm`, gap: () => 0, check: () => polylineLength(cab.pts) <= P1.cable.maxLeadMm },
  { a: 'node.clipUpper', b: 'stake', why: 'Upper C-clip bears on the stake', gap: () => stakeClipGap() },
  { a: 'node.clipLower', b: 'stake', why: 'Lower C-clip bears on the stake', gap: () => stakeClipGap() },
  { a: 'node.clips', b: 'node.floor', why: 'Clip rings tangent to the box floor (back face)', gap: () => Math.abs((nb.clips[0].centreZ + nb.clips[0].r + nb.clips[0].wall) - nb.backZ) },
  { a: 'stake', b: 'soil.bund', why: `Stake driven ${WORLD.stake.depthIntoBund} mm into the bund`, gap: () => 0, check: () => WORLD.stake.depthIntoBund >= 300 && bundHeightAt(WORLD.stake.x) === WORLD.bund.height },
  { a: 'node.solarBracket', b: 'node.lidBosses', why: 'Solar bracket bolted to the A1 lid bosses', gap: () => 0 },
  { a: 'node.perfboard', b: 'node.standoffs', why: 'Perfboard sits on its four standoffs', gap: () => 0 },
  { a: 'node.battery', b: 'node.batteryHolder', why: '18650 in its holder', gap: () => 9.5 - 9.3 },
  { a: 'node.gasket', b: 'node.groove', why: 'Gasket cord compressed in its groove by the lid', gap: () => -(2.0 - N1.gasket[1]), allowOverlap: 0.6, kind: 'compression' },
  { a: 'gauge', b: 'soil.surface', why: 'Staff gauge zero line at the soil surface', gap: () => Math.abs(gaugeLayout().zeroY - 0) },
  { a: 'gateway.box', b: 'gateway.mount', why: 'Gateway screwed to its wall plate', gap: () => 0 },
  { a: 'gateway.antenna', b: 'gateway.sma', why: 'Antenna screwed onto its SMA connector', gap: () => 0 },
  { a: 'water.meniscus', b: 'probe.tube', why: 'Water meets the tube with a meniscus at r = 12.5 mm', gap: () => 0 },
];

function stakeClipGap() {
  // stake axis vs ring centre offset equals the clearance, so the stake touches the ring on one side
  const c = nb.clips[0];
  const offset = Math.abs(c.centreZ - WORLD.stake.z);
  return (c.r - offset) - WORLD.stake.d / 2;
}

function wiresFitChannel() {
  // 9 conductors of 0.5 mm OD (30 AWG wire-wrap) in two layers between ribs 4 mm apart
  const perLayer = Math.ceil(P1.conductors.length / 2);
  return perLayer * 0.5 <= P1.ribs.spacing && 2 * 0.5 <= P1.ribs.height + 0.6;
}

function slotClearsRibs() {
  const rIn = P1.tube.id / 2;
  const ribOuterEdge = (P1.ribs.spacing / 2 + P1.ribs.width) ; // mm from channel centre along the arc
  return ribOuterEdge <= P1.coupler.wireSlot / 2 && rIn > 0;
}

/* ------------------------------------------------------------------ parts and support chain */
/** Every part, what holds it up, and a simple collision proxy (mm, world). */
export function parts() {
  const L = [];
  const add = (id, supportedBy, proxy) => L.push({ id, supportedBy, proxy });
  const tubeR = pp.rOut;
  add('soil', 'ground', { kind: 'slab', y0: -450, y1: 0 });
  add('soil.bund', 'soil', { kind: 'bund' });
  add('probe.lower', 'soil', { kind: 'cyl', x: 0, z: 0, r: tubeR, y0: pp.lower[0], y1: pp.lower[1], hollowR: pp.rIn });
  add('probe.tip', 'soil', { kind: 'cyl', x: 0, z: 0, r: tubeR, y0: pp.tip.yPoint, y1: pp.tip.yTop });
  add('probe.upper', 'probe.lower', { kind: 'cyl', x: 0, z: 0, r: tubeR, y0: pp.upper[0], y1: pp.upper[1], hollowR: pp.rIn });
  add('probe.coupler', 'probe.lower', { kind: 'cyl', x: 0, z: 0, r: pp.coupler.r, y0: pp.coupler.y0, y1: pp.coupler.y1, inside: ['probe.lower', 'probe.upper'] });
  add('probe.cap', 'probe.upper', { kind: 'cyl', x: 0, z: 0, r: pp.cap.r, y0: pp.cap.y0, y1: pp.cap.y1, socket: { r: pp.cap.socketR, y1: pp.cap.chamberY0 } });
  add('probe.gland', 'probe.cap', { kind: 'cyl', x: 0, z: 0, r: pp.gland.hexAF / 2 / Math.cos(Math.PI / 6), y0: pp.cap.y1, y1: pp.cap.y1 + pp.gland.hexH + pp.gland.domeH });
  add('probe.cable', 'probe.gland', { kind: 'polyline', pts: cab.pts, r: pp.gland.cableR });
  add('stake', 'soil.bund', { kind: 'cyl', x: WORLD.stake.x, z: WORLD.stake.z, r: WORLD.stake.d / 2, y0: nb.stakeBottomY, y1: WORLD.stake.top });
  add('node.box', 'stake', { kind: 'box', x0: nb.x - nb.outer.w / 2, x1: nb.x + nb.outer.w / 2, y0: nb.bottomY, y1: nb.topY, z0: nb.backZ, z1: nb.frontZ });
  add('node.clips', 'stake', { kind: 'ring', x: WORLD.stake.x, z: nb.clips[0].centreZ, r: nb.clips[0].r, wall: nb.clips[0].wall, ys: nb.clips.map((c) => c.y) });
  add('node.gland', 'node.box', { kind: 'cyl', x: nb.gland.x, z: nb.gland.z, r: 8.7, y0: nb.bottomY - 13, y1: nb.bottomY });
  const g = gaugeLayout();
  add('gauge', 'soil', { kind: 'box', x0: g.x - g.w / 2, x1: g.x + g.w / 2, y0: g.y0, y1: g.y1, z0: g.z - g.t / 2, z1: g.z + g.t / 2 });
  return L;
}

/** Signed distance from point p to a proxy (negative inside). Rough but conservative. */
function sdf(proxy, p) {
  const [x, y, z] = p;
  if (proxy.kind === 'cyl') {
    const d = Math.hypot(x - proxy.x, z - proxy.z) - proxy.r;
    const h = Math.max(proxy.y0 - y, y - proxy.y1);
    const outside = Math.hypot(Math.max(d, 0), Math.max(h, 0));
    return outside + Math.min(Math.max(d, h), 0);
  }
  if (proxy.kind === 'box') {
    const dx = Math.max(proxy.x0 - x, x - proxy.x1), dy = Math.max(proxy.y0 - y, y - proxy.y1), dz = Math.max(proxy.z0 - z, z - proxy.z1);
    const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0));
    return outside + Math.min(Math.max(dx, dy, dz), 0);
  }
  return Infinity;
}

function samplePoints(proxy, n = 48) {
  const out = [];
  if (proxy.kind === 'polyline') {
    for (let i = 0; i < proxy.pts.length - 1; i += 1) {
      for (let k = 0; k < 6; k += 1) {
        const a = proxy.pts[i], b = proxy.pts[i + 1], t = k / 6;
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
      }
    }
  } else if (proxy.kind === 'cyl') {
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2;
      for (const y of [proxy.y0, (proxy.y0 + proxy.y1) / 2, proxy.y1]) out.push([proxy.x + Math.sin(a) * proxy.r, y, proxy.z + Math.cos(a) * proxy.r]);
    }
  } else if (proxy.kind === 'box') {
    for (const x of [proxy.x0, (proxy.x0 + proxy.x1) / 2, proxy.x1]) for (const y of [proxy.y0, (proxy.y0 + proxy.y1) / 2, proxy.y1]) for (const z of [proxy.z0, (proxy.z0 + proxy.z1) / 2, proxy.z1]) out.push([x, y, z]);
  }
  return out;
}

/** Pairs that may overlap by design (nesting or declared contacts handled above). */
const NESTED = new Set([
  'probe.lower|probe.tip', 'probe.lower|probe.upper', 'probe.lower|probe.coupler', 'probe.upper|probe.coupler', 'probe.upper|probe.cap',
  'probe.cap|probe.gland', 'probe.gland|probe.cable', 'node.box|node.clips', 'node.box|node.gland', 'node.gland|probe.cable',
  'stake|node.clips', 'probe.cap|probe.cable', 'probe.lower|probe.cable', 'probe.upper|probe.cable',
]);

/** Run every rule. Returns { contacts: [...], intersections: [...], floating: [...], ok }. */
export function checkAssembly() {
  const contacts = CONTACTS.map((c) => {
    const gap = c.gap();
    const maxGap = c.maxGap ?? 0.2;
    const allow = c.allowOverlap ?? 0.05;
    const extra = c.check ? c.check() : true;
    return { ...c, gap: +gap.toFixed(3), pass: gap <= maxGap + 1e-9 && gap >= -allow - 1e-9 && extra };
  });
  const list = parts();
  const intersections = [];
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const A = list[i], B = list[j];
      const key = `${A.id}|${B.id}`, rkey = `${B.id}|${A.id}`;
      if (NESTED.has(key) || NESTED.has(rkey)) continue;
      if (A.proxy.kind === 'slab' || B.proxy.kind === 'slab' || A.proxy.kind === 'bund' || B.proxy.kind === 'bund' || A.proxy.kind === 'ring' || B.proxy.kind === 'ring') continue;
      let worst = Infinity;
      for (const p of samplePoints(A.proxy)) worst = Math.min(worst, sdf(B.proxy, p));
      for (const p of samplePoints(B.proxy)) worst = Math.min(worst, sdf(A.proxy, p));
      if (worst < -0.05) intersections.push({ a: A.id, b: B.id, penetration: +(-worst).toFixed(2) });
    }
  }
  const byId = new Map(list.map((p) => [p.id, p]));
  const floating = [];
  for (const p of list) {
    let cur = p, steps = 0;
    while (cur && cur.supportedBy !== 'ground' && steps < 20) { cur = byId.get(cur.supportedBy); steps += 1; }
    if (!cur || cur.supportedBy !== 'ground') floating.push(p.id);
  }
  return { contacts, intersections, floating, ok: contacts.every((c) => c.pass) && intersections.length === 0 && floating.length === 0 };
}

/** Geometry parameter checks the prompt asks for (± 0.5 mm). */
export function geometryChecks() {
  const el = electrodeLayout('P1');
  const centres = el.filter((e) => e.kind === 'sense').map((e) => (e.y0 + e.y1) / 2);
  const guards = el.filter((e) => e.kind === 'guard' && e.of);
  const ew = el.find((e) => e.id === 'EW');
  const p2 = electrodeLayout('P2');
  const p2parts = probeParts('P2');
  const rows = [
    ['Band centres −25/−75/−125/−175', centres.every((c, i) => Math.abs(c - [-25, -75, -125, -175][i]) <= 0.5)],
    ['Guard bands 4 mm tall at 9–13 mm from each centre', guards.every((g) => Math.abs((g.y1 - g.y0) - 4) <= 0.5 && Math.abs(Math.min(Math.abs(g.y0 - el.find((e) => e.id === g.of).zc), Math.abs(g.y1 - el.find((e) => e.id === g.of).zc)) - 9) <= 0.5)],
    ['EW strip Z −5 to +100', Math.abs(ew.y0 + 5) <= 0.5 && Math.abs(ew.y1 - 100) <= 0.5],
    ['Wall 1.6 ± 0.1', Math.abs((SPEC.P1.tube.od - SPEC.P1.tube.id) / 2 - 1.6) <= 0.1],
    ['P2 extents +100…−110, tip −130, one band at −75', p2parts.lower[0] === -110 && p2parts.lower[1] === 100 && p2parts.tip.yPoint === -130 && p2.filter((e) => e.kind === 'sense').length === 1],
    ['Bands do not overlap their guards or each other', noOverlap(el.filter((e) => e.kind !== 'water' && e.id !== 'EW-GND'))],
  ];
  return rows.map(([name, pass]) => ({ name, pass }));
}

function noOverlap(list) {
  const s = [...list].sort((a, b) => a.y0 - b.y0);
  for (let i = 1; i < s.length; i += 1) if (s[i].y0 < s[i - 1].y1 - 1e-9) return false;
  return true;
}
