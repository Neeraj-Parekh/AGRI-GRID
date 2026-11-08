// Pure layout of every part, in millimetres, derived from probe-spec.json.
// The 3D builders AND the assembly test read these functions, so the test checks exactly what is rendered.
//
// Frames:
//   Probe frame: axis = +Y, Z(spec) = Y, soil surface Y = 0. Angle phi follows three.js LatheGeometry:
//   x = r·sin(phi), z = r·cos(phi). phi = 0 faces the camera (+z).
//   Half A (copper electrodes) is centred on −x (phi = 3π/2), facing the paddy.
//   Half B (wire ribs, DS18B20, depth ticks) is centred on +x (phi = π/2), facing the bund.
//   Seams lie in the plane x = 0: the front seam faces the camera, the back seam faces −z.
//   World frame = probe frame for node A1 (probe axis at x = 0, z = 0). The soil cut plane is z = 0.
import SPEC from './probe-spec.json' with { type: 'json' };

const P1 = SPEC.P1;
const D2R = Math.PI / 180;
export const PHI_A = 1.5 * Math.PI; // centre of half A (−x)
export const PHI_B = 0.5 * Math.PI; // centre of half B (+x)

/** Every electrode as an arc on the inner wall of half A. y in mm, phi in rad. */
export function electrodeLayout(probe = 'P1') {
  const s = probe === 'P1' ? P1 : { ...P1, ...SPEC.P2, guard: P1.guard, ewGnd: P1.ewGnd, bandArcDeg: P1.bandArcDeg };
  const rIn = P1.tube.id / 2;
  const arc = s.bandArcDeg * D2R;
  const out = [];
  for (const b of s.bands) {
    out.push({ id: b.id, kind: 'sense', y0: b.zc - b.h / 2, y1: b.zc + b.h / 2, phi0: PHI_A - arc / 2, phi1: PHI_A + arc / 2, zc: b.zc });
    for (const sign of [1, -1]) {
      const a = b.zc + sign * s.guard.from, c = b.zc + sign * s.guard.to;
      out.push({ id: `${b.id}-G${sign > 0 ? 'u' : 'd'}`, kind: 'guard', y0: Math.min(a, c), y1: Math.max(a, c), phi0: PHI_A - arc / 2, phi1: PHI_A + arc / 2, of: b.id });
    }
  }
  const ewHalf = (s.ew.width / 2) / rIn;
  out.push({ id: 'EW', kind: 'water', y0: s.ew.z0, y1: s.ew.z1, phi0: PHI_A - ewHalf, phi1: PHI_A + ewHalf });
  // GND strip beside EW, 4 mm edge-to-edge, on the back side (phi < PHI_A) so a section at z = 0 shows it
  const gOff = (s.ew.width / 2 + s.ewGnd.gap + s.ewGnd.width / 2) / rIn;
  const gHalf = (s.ewGnd.width / 2) / rIn;
  out.push({ id: 'EW-GND', kind: 'guard', y0: s.ew.z0, y1: s.ew.z1, phi0: PHI_A - gOff - gHalf, phi1: PHI_A - gOff + gHalf });
  return out;
}

/** Wire-channel and DS18B20 placement on half B. */
export function halfBLayout() {
  const rIn = P1.tube.id / 2;
  const chan = PHI_B + 0.32; // channel centre, slightly toward the back so a z = 0 section shows it whole
  const ribHalfGap = (P1.ribs.spacing / 2) / rIn;
  const ribW = P1.ribs.width / rIn;
  return {
    channelPhi: chan,
    ribs: [chan - ribHalfGap - ribW / 2, chan + ribHalfGap + ribW / 2],
    ribPhiWidth: ribW,
    ribTopR: rIn - P1.ribs.height,
    dsPhi: PHI_B + 1.05,
    dsCentreR: rIn - P1.ds18b20.diameter / 2, // steel probe touches the wall
    dsY: P1.ds18b20.z,
    tickPhi: 0.42, // depth ticks on the outside of half B, facing the camera
  };
}

/** Axial profiles of the rigid parts. */
export function probeParts(probe = 'P1') {
  const t = probe === 'P1' ? P1.tube : SPEC.P2.tube;
  const tip = probe === 'P1' ? P1.tip : SPEC.P2.tip;
  const c = P1.cap;
  const lowerTop = probe === 'P1' ? P1.sections.lower[1] : t.zTop; // P2 is one piece
  return {
    rOut: t.od / 2, rIn: t.id / 2,
    lower: [t.zBottom, lowerTop],
    upper: probe === 'P1' ? [P1.sections.upper[0], P1.sections.upper[1]] : null,
    coupler: probe === 'P1' ? { r: P1.coupler.od / 2, rIn: P1.coupler.od / 2 - P1.coupler.wall, y0: P1.coupler.zCentre - P1.coupler.length / 2, y1: P1.coupler.zCentre + P1.coupler.length / 2, slotHalf: P1.coupler.wireSlot / 2 } : null,
    tip: { yTop: tip.zTop, yPoint: tip.zPoint, pointR: tip.pointRadius, plugR: tip.plugOd / 2, plugTop: tip.zTop + tip.plugLength },
    cap: { r: c.od / 2, y0: t.zTop - c.socketDepth, y1: t.zTop - c.socketDepth + c.height, socketR: c.socketId / 2, chamberR: c.chamberId / 2, chamberY0: t.zTop, chamberY1: t.zTop + c.chamberHeight, holeR: c.glandHole / 2 },
    gland: { threadR: P1.gland.thread / 2, hexAF: P1.gland.hexAF, hexH: 4, domeR: 7.2, domeH: 9, threadLen: 8, cableR: P1.gland.cableOd / 2 },
  };
}

/* ------------------------------------------------------------------ world layout (mm) */
export const WORLD = {
  probeA1: { x: 0, z: 0 },
  bund: { x: 360, baseHalf: 300, topHalf: 125, height: 200 },
  stake: { x: 280, z: -30, d: 20, top: 780, depthIntoBund: 350 },
  gauge: { x: -125, z: -24 },
};

/** Node box N1 on the stake: outer extents and clip rings (mm, world). */
export function nodeBoxLayout() {
  const n = SPEC.N1, s = WORLD.stake, b = WORLD.bund;
  const outer = { w: n.inner[0] + 2 * n.wall, h: n.inner[1] + 2 * n.wall, d: n.floor + n.inner[2] + n.lid };
  const clipR = n.clips.id / 2;
  const bottomY = b.height + 90; // 90 mm above the bund top: clear of splashes, short probe lead
  // The stake bears on the back of each clip ring (clearance 0.25 mm sits on the box side).
  const clearance = clipR - s.d / 2;
  const ringCentreZ = s.z + clearance; // stake touches the ring at its −z side
  const backZ = ringCentreZ + clipR + n.clips.wall; // clip ring is tangent to the box floor (back face)
  return {
    outer, bottomY, topY: bottomY + outer.h, x: s.x,
    backZ, frontZ: backZ + outer.d, centreZ: backZ + outer.d / 2,
    clips: n.clips.at.map((a) => ({ y: bottomY + a, centreZ: ringCentreZ, r: clipR, wall: n.clips.wall, h: n.clips.h })),
    gland: { x: s.x, y: bottomY, z: backZ + outer.d / 2 },
    stakeBottomY: b.height - s.depthIntoBund,
  };
}

/** The probe cable from the PG7 gland on the cap to the PG7 gland under the node box, with a drip loop. */
export function cablePath() {
  const pp = probeParts('P1');
  const nb = nodeBoxLayout();
  const glandTop = pp.cap.y1 + pp.gland.hexH + pp.gland.domeH;
  const gx = nb.gland.x, gz = nb.gland.z, gy = nb.gland.y - pp.gland.hexH - pp.gland.domeH; // under the box gland
  const pts = [
    [0, glandTop, 0],
    [0, glandTop + 22, 0],
    [40, glandTop + 58, 4],
    [130, glandTop + 70, 10],
    [205, gy - 6, gz * 0.7],
    [gx - 14, gy - 34, gz],   // drip-loop low point
    [gx - 4, gy - 22, gz],
    [gx, gy - 6, gz],
    [gx, gy, gz],
  ];
  return { pts, glandTop, entryY: gy, lowY: gy - 34 };
}

export function polylineLength(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i += 1) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
  return L;
}

/** Staff gauge G1 driven into the soil with zero at the surface. */
export function gaugeLayout() {
  const g = SPEC.G1;
  const margin = (g.bar[0] - (g.range[1] - g.range[0])) / 2; // 15 mm each end
  return { x: WORLD.gauge.x, z: WORLD.gauge.z, y0: g.range[0] - margin, y1: g.range[1] + margin, zeroY: 0, w: g.bar[1], t: g.bar[2] };
}

/** Bund cross-section height at world x (mm). Smooth shoulders. */
export function bundHeightAt(x) {
  const b = WORLD.bund;
  const d = Math.abs(x - b.x);
  if (d >= b.baseHalf) return 0;
  if (d <= b.topHalf) return b.height;
  const k = (b.baseHalf - d) / (b.baseHalf - b.topHalf);
  return b.height * k * k * (3 - 2 * k);
}

/** A probe lying on the floor along +x rests on its cap rim and on the tube at the tip junction:
 *  tilt δ = asin((r_cap − r_tube) / span). Returns { rotZ, y0 (m, axis height at Z 0), delta }. */
export function lyingPose(kind = 'P1') {
  const P = probeParts(kind);
  const span = P.cap.y0 - P.tip.yTop;
  const delta = Math.asin((P.cap.r - P.rOut) / span);
  const y0 = P.rOut * Math.cos(delta) - P.tip.yTop * Math.sin(delta);
  return { rotZ: -Math.PI / 2 + delta, y0: y0 / 1000, delta };
}
