// Parametric dielectric profile probe (P1 hero, P2 mini, P4 stub) built from probe-spec.json.
// Built in millimetres inside a group scaled to metres. Lathe strips per profile segment keep edges
// crisp and curved surfaces smooth (≥ 128 segments around for the tube).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import SPEC from '../spec/probe-spec.json' with { type: 'json' };
import { electrodeLayout, halfBLayout, probeParts, PHI_A, PHI_B } from '../spec/layout.js';
import { materials } from './materials.js';
import { tickNumbers } from '../core/textures.js';

const TAU = Math.PI * 2;
const SEG_PER_RAD = 64 / Math.PI; // 128 around

/* ------------------------------------------------------------------ geometry helpers */
/** One lathe per straight segment (crisp creases). `smooth` = treat the whole list as one smooth lathe. */
export function lathe(profile, phi0, phi1, { smooth = false } = {}) {
  const segs = Math.max(4, Math.ceil(Math.abs(phi1 - phi0) * SEG_PER_RAD));
  const geos = [];
  if (smooth) {
    geos.push(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segs, phi0, phi1 - phi0));
  } else {
    for (let i = 0; i < profile.length - 1; i += 1) {
      const a = profile[i], b = profile[i + 1];
      if (Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6) continue;
      geos.push(new THREE.LatheGeometry([new THREE.Vector2(a[0], a[1]), new THREE.Vector2(b[0], b[1])], segs, phi0, phi1 - phi0));
    }
  }
  const g = mergeGeometries(geos.map((q) => q.toNonIndexed()), false);
  geos.forEach((q) => q.dispose());
  return g;
}

/** Flat face from a 2-D polygon in (r, y), placed in the half-plane at angle phi, facing `normal`. */
export function polyFace(poly, phi, normal) {
  const contour = poly.map(([r, y]) => new THREE.Vector2(r, y));
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  const s = Math.sin(phi), c = Math.cos(phi);
  const pos = []; const nor = [];
  const P = (i) => new THREE.Vector3(poly[i][0] * s, poly[i][1], poly[i][0] * c);
  for (const t of tris) {
    let [a, b, d] = t.map(P);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a));
    if (n.dot(normal) < 0) [b, d] = [d, b];
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, d.x, d.y, d.z);
    for (let k = 0; k < 3; k += 1) nor.push(normal.x, normal.y, normal.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  return g;
}

/** Quad from four xyz points (two triangles) with an explicit normal. */
function quad(a, b, c, d, n) {
  const pos = [...a, ...b, ...c, ...a, ...c, ...d];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const tri = new THREE.Vector3().subVectors(new THREE.Vector3(...b), new THREE.Vector3(...a)).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...c), new THREE.Vector3(...a)));
  if (tri.dot(n) < 0) g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...c, ...b, ...a, ...d, ...c], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(Array(6).fill([n.x, n.y, n.z]).flat(), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(12), 2));
  return g;
}

const planeNormal = (phi, sign) => new THREE.Vector3(Math.cos(phi), 0, -Math.sin(phi)).multiplyScalar(sign);
const mesh = (g, m, name) => { const o = new THREE.Mesh(g, m); o.name = name || ''; o.castShadow = true; o.receiveShadow = true; return o; };

/* ------------------------------------------------------------------ shell halves */
/**
 * One half-shell piece. edges: { at phi0: 'seamA'|'seamB'|'section'|null, at phi1: ... }
 * Outer wall can carry the soil-line groove and the white paint split.
 */
function shellPiece({ y0, y1, rIn, rOut, phi0, phi1, chamfer = 0.4, groove = null, paintAbove = null, edges = {}, mats }) {
  const g = new THREE.Group();
  const c = chamfer;
  // outer profile split into black / white at the paint line, with the soil-line groove notch
  const outerPts = [[rOut - c, y0], [rOut, y0 + c]];
  if (groove && groove.y > y0 + c && groove.y < y1 - c) {
    outerPts.push([rOut, groove.y - groove.w / 2], [rOut - groove.d, groove.y - groove.w / 2], [rOut - groove.d, groove.y + groove.w / 2], [rOut, groove.y + groove.w / 2]);
  }
  outerPts.push([rOut, y1 - c], [rOut - c, y1]);
  const splitY = paintAbove;
  const black = [], white = [];
  for (let i = 0; i < outerPts.length - 1; i += 1) {
    const a = outerPts[i], b = outerPts[i + 1];
    const mid = (a[1] + b[1]) / 2;
    (splitY != null && mid > splitY ? white : black).push([a, b]);
  }
  const addSegs = (list, mat) => { if (list.length) g.add(mesh(mergeGeometries(list.map(([a, b]) => lathe([a, b], phi0, phi1)), false), mat, 'outer')); };
  addSegs(black, mats.outer); addSegs(white, mats.paint || mats.outer);
  // ends and inner wall
  g.add(mesh(lathe([[rIn, y0], [rOut - c, y0]], phi0, phi1), mats.outer, 'endBottom'));
  g.add(mesh(lathe([[rOut - c, y1], [rIn, y1]], phi0, phi1), splitY != null && y1 > splitY ? (mats.paint || mats.outer) : mats.outer, 'endTop'));
  g.add(mesh(lathe([[rIn, y1], [rIn, y0]], phi0, phi1), mats.inner || mats.outer, 'inner'));
  // edge faces
  const prof = [[rIn, y0], [rOut - c, y0], [rOut, y0 + c], [rOut, y1 - c], [rOut - c, y1], [rIn, y1]];
  for (const [phi, kind, side] of [[phi0, edges.phi0, -1], [phi1, edges.phi1, 1]]) {
    if (!kind) continue;
    // outward normal of this edge face: pointing out of the piece's angular range
    const nrm = new THREE.Vector3(Math.cos(phi), 0, -Math.sin(phi)).multiplyScalar(side);
    if (kind === 'section') g.add(mesh(polyFace(prof, phi, nrm), mats.section, 'section'));
    else if (kind === 'seamA') {
      g.add(mesh(polyFace(prof, phi, nrm), mats.outer, 'seam'));
      // tongue 1.0 × 1.0 at mid-wall, protruding across the seam plane, 1 mm short of each end
      const tw = SPEC.P1.seam.tongue[0], th = SPEC.P1.seam.tongue[1];
      const rm = (rIn + rOut) / 2;
      const tg = new RoundedBoxGeometry(th, (y1 - y0) - 2, tw, 2, 0.15);
      const t = mesh(tg, mats.outer, 'tongue');
      const dir = new THREE.Vector3(Math.sin(phi), 0, Math.cos(phi)); // radial direction of the seam line
      // seams always lie in the plane x = 0, so the box stays axis-aligned: x = protrusion, z = radial
      t.position.copy(dir.clone().multiplyScalar(rm)).add(nrm.clone().multiplyScalar(th / 2)); t.position.y = (y0 + y1) / 2;
      g.add(t);
    } else if (kind === 'seamB') {
      // seam face with a 1.2 × 1.2 groove at mid-wall, open along the length
      const gw = SPEC.P1.seam.groove[0], gd = SPEC.P1.seam.groove[1];
      const rm = (rIn + rOut) / 2, ga = rm - gw / 2, gb = rm + gw / 2;
      g.add(mesh(polyFace([[rIn, y0], [ga, y0], [ga, y1], [rIn, y1]], phi, nrm), mats.outer, 'seam'));
      g.add(mesh(polyFace([[gb, y0], [rOut - c, y0], [rOut, y0 + c], [rOut, y1 - c], [rOut - c, y1], [gb, y1]], phi, nrm), mats.outer, 'seam'));
      const dir = new THREE.Vector3(Math.sin(phi), 0, Math.cos(phi));
      const into = nrm.clone().multiplyScalar(-gd); // groove goes into the piece
      const P = (r, y, deep) => { const v = dir.clone().multiplyScalar(r).add(deep ? into : new THREE.Vector3()); return [v.x, y, v.z]; };
      g.add(mesh(quad(P(ga, y0, true), P(gb, y0, true), P(gb, y1, true), P(ga, y1, true), nrm), mats.outer, 'grooveBottom'));
      g.add(mesh(quad(P(ga, y0, false), P(ga, y0, true), P(ga, y1, true), P(ga, y1, false), dir.clone()), mats.outer, 'grooveWall'));
      g.add(mesh(quad(P(gb, y0, false), P(gb, y0, true), P(gb, y1, true), P(gb, y1, false), dir.clone().negate()), mats.outer, 'grooveWall'));
    }
  }
  return g;
}

/** Copper strip on the inner wall (flush, 0.02 mm proud, chamfered edges catch light). */
function copperStrip(e, phiClip, mats, rIn) {
  const p0 = Math.max(e.phi0, phiClip[0]), p1 = Math.min(e.phi1, phiClip[1]);
  if (p1 <= p0) return null;
  const r = rIn - 0.02, rc = rIn + 0.03;
  const prof = [[rc, e.y1], [r, e.y1 - 0.15], [r, e.y0 + 0.15], [rc, e.y0]];
  const g = new THREE.Group(); g.name = e.id;
  const m = mesh(lathe(prof, p0, p1, { smooth: false }), mats.copper, `copper:${e.id}`); m.castShadow = false;
  g.add(m);
  const wet = new THREE.Mesh(lathe([[r - 0.01, e.y1 - 0.15], [r - 0.01, e.y0 + 0.15]], p0, p1), mats.copperWet.clone());
  wet.name = `wet:${e.id}`; wet.renderOrder = 3; g.add(wet);
  g.userData = { e, wet: wet.material, centre: { phi: (p0 + p1) / 2, y: (e.y0 + e.y1) / 2 } };
  return g;
}

/* ------------------------------------------------------------------ the probe */
/**
 * buildProbe('P1' | 'P2' | 'P4')
 * returns { root, api } — root is scaled to metres; api controls explode, section, translucency,
 * wetness per band, highlight, and gives anchor points (in root-local mm) for effects and callouts.
 */
export function buildProbe(kind = 'P1', opts = {}) {
  const M = materials();
  const isP1 = kind === 'P1', isP4 = kind === 'P4';
  const P = probeParts(isP4 ? 'P1' : kind);
  const rIn = P.rIn, rOut = P.rOut;
  const root = new THREE.Group(); root.name = `probe-${kind}`; root.scale.setScalar(0.001);
  const hb = halfBLayout();
  const elAll = isP4 ? stubElectrodes() : electrodeLayout(isP1 ? 'P1' : 'P2');
  const lowerRange = isP4 ? [-30, 30] : P.lower;
  const sections = isP1 ? [['lower', P.lower], ['upper', P.upper]] : [['lower', lowerRange]];

  const mats = { outer: M.petgBlack, inner: M.petgBlack, paint: isP4 ? null : M.petgWhite, section: M.section, copper: M.copper, copperWet: M.copperWet };

  // Two variants of every PETG piece: whole and sectioned (only the z < 0 half, cut at z = 0).
  const variants = { whole: new THREE.Group(), section: new THREE.Group() };
  variants.whole.name = 'whole'; variants.section.name = 'section';
  root.add(variants.whole, variants.section);
  const parts = {}; // name -> { whole: Group, section: Group }
  const halves = { A: [], B: [] };

  for (const [name, [y0, y1]] of sections) {
    for (const H of ['A', 'B']) {
      for (const v of ['whole', 'section']) {
        const range = H === 'A' ? (v === 'whole' ? [Math.PI, TAU] : [Math.PI, 1.5 * Math.PI]) : (v === 'whole' ? [0, Math.PI] : [0.5 * Math.PI, Math.PI]);
        const edges = H === 'A'
          ? (v === 'whole' ? { phi0: 'seamA', phi1: 'seamA' } : { phi0: 'seamA', phi1: 'section' })
          : (v === 'whole' ? { phi0: 'seamB', phi1: 'seamB' } : { phi0: 'section', phi1: 'seamB' });
        const grp = new THREE.Group(); grp.name = `${name}${H}`;
        grp.add(shellPiece({ y0, y1, rIn, rOut, phi0: range[0], phi1: range[1], groove: !isP4 && name === 'lower' ? { y: 0, w: SPEC.P1.soilGroove.width, d: SPEC.P1.soilGroove.depth } : null, paintAbove: isP4 ? null : SPEC.P1.paintWhiteAbove, edges, mats }));
        // copper on half A, clipped to the visible range
        if (H === 'A') {
          for (const e of elAll) {
            const lo = Math.max(e.y0, y0 + 0.5), hi = Math.min(e.y1, y1 - 0.5);
            if (hi <= lo) continue;
            const cs = copperStrip({ ...e, y0: lo, y1: hi }, range, mats, rIn);
            if (cs) { cs.userData.variant = v; grp.add(cs); }
          }
          // vertical GND bus wire along the arc edge, with a jumper to each guard (soldered)
          if (!isP4) grp.add(gndBus(y0, y1, elAll, v === 'section'));
          // epoxy bead on the outside of each seam
          for (const phi of v === 'whole' ? [Math.PI, TAU] : [Math.PI]) {
            const d = new THREE.Vector3(Math.sin(phi), 0, Math.cos(phi));
            const bead = mesh(new THREE.CylinderGeometry(0.28, 0.28, y1 - y0 - 0.8, 12), M.epoxy, 'epoxy');
            bead.position.copy(d.multiplyScalar(rOut - 0.02)); bead.position.y = (y0 + y1) / 2; bead.castShadow = false;
            grp.add(bead);
          }
        } else {
          // ribs on half B (wire channel), clipped to the visible range
          for (const rp of hb.ribs) {
            if (rp < range[0] || rp > range[1]) continue;
            const rib = mesh(new RoundedBoxGeometry(SPEC.P1.ribs.height, y1 - y0 - 1, SPEC.P1.ribs.width, 2, 0.18), M.petgBlack, 'rib');
            rib.position.set(Math.sin(rp) * (rIn - SPEC.P1.ribs.height / 2), (y0 + y1) / 2, Math.cos(rp) * (rIn - SPEC.P1.ribs.height / 2));
            rib.rotation.y = rp - Math.PI / 2;
            grp.add(rib);
          }
          // DS18B20 clip (part of half B) on the lower section
          if (isP1 && name === 'lower' && hb.dsPhi >= range[0] && hb.dsPhi <= range[1]) grp.add(dsClip(hb));
          // depth ticks + numbers (outside, above ground, facing the camera) — whole only
          if (!isP4 && v === 'whole') grp.add(depthTicks(y0, y1, rOut, hb.tickPhi));
        }
        variants[v].add(grp);
        parts[`${name}${H}`] = parts[`${name}${H}`] || {}; parts[`${name}${H}`][v] = grp;
        halves[H].push(grp);
      }
    }
  }

  // Coupler (P1), tip, cap, gland
  const extras = {};
  if (isP1) {
    const c = P.coupler;
    const slot = c.slotHalf / c.r; // half-angle of the 6 mm slot
    for (const v of ['whole', 'section']) {
      const r0 = v === 'whole' ? hb.channelPhi + slot : Math.max(hb.channelPhi + slot, 0.5 * Math.PI);
      const r1 = v === 'whole' ? hb.channelPhi + TAU - slot : 1.5 * Math.PI;
      const prof = [[c.rIn, c.y0], [c.r - 0.3, c.y0], [c.r, c.y0 + 0.3], [c.r, c.y1 - 0.3], [c.r - 0.3, c.y1], [c.rIn, c.y1], [c.rIn, c.y0]];
      const grp = new THREE.Group(); grp.name = 'coupler';
      grp.add(mesh(lathe(prof, r0, r1), M.petgBlack, 'coupler'));
      const capPoly = [[c.rIn, c.y0], [c.r, c.y0], [c.r, c.y1], [c.rIn, c.y1]];
      grp.add(mesh(polyFace(capPoly, r0, planeNormal(r0, -1)), v === 'section' && r0 === 0.5 * Math.PI ? M.section : M.petgBlack));
      grp.add(mesh(polyFace(capPoly, r1, planeNormal(r1, 1)), v === 'section' ? M.section : M.petgBlack));
      variants[v].add(grp); extras.coupler = extras.coupler || {}; extras.coupler[v] = grp;
    }
  }
  if (!isP4) {
    const t = P.tip;
    const tipProfile = [[0, t.yPoint], [0.55, t.yPoint + 0.1], [1.05, t.yPoint + 0.4], [1.35, t.yPoint + 0.85], [rOut, t.yTop]];
    for (const v of ['whole', 'section']) {
      const [p0, p1] = v === 'whole' ? [0, TAU] : [0.5 * Math.PI, 1.5 * Math.PI];
      const grp = new THREE.Group(); grp.name = 'tip';
      grp.add(mesh(lathe(tipProfile, p0, p1, { smooth: true }), M.petgBlack, 'cone'));
      grp.add(mesh(lathe([[rOut, t.yTop], [t.plugR, t.yTop], [t.plugR, t.plugTop - 0.4], [t.plugR - 0.4, t.plugTop], [0, t.plugTop]], p0, p1), M.petgBlack, 'plug'));
      if (v === 'section') {
        const poly = [[0, t.yPoint], ...tipProfile.slice(1), [t.plugR, t.yTop], [t.plugR, t.plugTop - 0.4], [t.plugR - 0.4, t.plugTop], [0, t.plugTop]];
        grp.add(mesh(polyFace(poly, 0.5 * Math.PI, planeNormal(0.5 * Math.PI, -1)), M.section));
        grp.add(mesh(polyFace(poly, 1.5 * Math.PI, planeNormal(1.5 * Math.PI, 1)), M.section));
      }
      variants[v].add(grp); extras.tip = extras.tip || {}; extras.tip[v] = grp;
    }
    // Cap with socket, wire chamber, gland hole and the sealed EREF pad
    const c = P.cap;
    const capProfile = [[c.socketR, c.y0], [c.r - 0.8, c.y0], [c.r, c.y0 + 0.8], [c.r, c.y1 - 1.2], [c.r - 1.2, c.y1], [c.holeR, c.y1], [c.holeR, c.chamberY1], [c.chamberR, c.chamberY1], [c.chamberR, c.chamberY0], [c.socketR, c.chamberY0], [c.socketR, c.y0]];
    for (const v of ['whole', 'section']) {
      const [p0, p1] = v === 'whole' ? [0, TAU] : [0.5 * Math.PI, 1.5 * Math.PI];
      const grp = new THREE.Group(); grp.name = 'cap';
      const outerIdx = [0, 1, 2, 3, 4, 5];
      grp.add(mesh(lathe(capProfile.slice(0, 6), p0, p1), M.petgWhite, 'capOuter'));
      grp.add(mesh(lathe(capProfile.slice(5), p0, p1), M.petgWhite, 'capInner'));
      if (v === 'section') {
        const poly = capProfile.slice(0, -1);
        grp.add(mesh(polyFace(poly, 0.5 * Math.PI, planeNormal(0.5 * Math.PI, -1)), M.sectionWhite));
        grp.add(mesh(polyFace(poly, 1.5 * Math.PI, planeNormal(1.5 * Math.PI, 1)), M.sectionWhite));
      }
      void outerIdx;
      // EREF pad on the chamber wall (sealed with clear epoxy)
      const pw = SPEC.P1.eref.size[0] / c.chamberR;
      const pa = PHI_A - 0.6; const pp0 = pa - pw / 2, pp1 = pa + pw / 2;
      if (v === 'whole' || (pp0 >= p0 && pp1 <= p1)) {
        const pad = mesh(lathe([[c.chamberR - 0.05, c.chamberY1 - 0.2], [c.chamberR - 0.05, c.chamberY0 + 0.2]], pp0, pp1), M.copper, 'eref');
        grp.add(pad);
        const coat = mesh(lathe([[c.chamberR - 0.25, c.chamberY1 - 0.1], [c.chamberR - 0.25, c.chamberY0 + 0.1]], pp0 - 0.05, pp1 + 0.05), M.epoxy, 'erefCoat');
        coat.castShadow = false; grp.add(coat);
        grp.userData.eref = { phi: pa, y: (c.chamberY0 + c.chamberY1) / 2, r: c.chamberR };
      }
      variants[v].add(grp); extras.cap = extras.cap || {}; extras.cap[v] = grp;
    }
    extras.gland = buildGland(P);
    root.add(extras.gland);
  } else {
    // P4 stub: printed end disc at the bottom, open top
    const disc = new THREE.Group(); disc.name = 'endDisc';
    disc.add(mesh(lathe([[0, -32], [rOut, -32], [rOut, -30.4], [rOut - 0.4, -30], [rIn, -30]], 0, TAU), M.petgBlack));
    disc.add(mesh(lathe([[rIn, -30], [rIn, -29], [0, -29]], 0, TAU), M.petgBlack));
    variants.whole.add(disc);
    variants.section.add(disc.clone());
  }

  // Wires inside the bore (assembled state) + DS18B20
  const wires = isP1 ? buildWires(elAll, P, hb) : new THREE.Group();
  root.add(wires);

  /* ---------------------------------------------------------------- api */
  const state = { explode: 0, section: false, translucent: 0, print: 0, wires: 1, halves: 0, upper: 0 };
  const wiresOk = () => state.halves < 0.02 && state.upper < 0.02 && (state.section || state.translucent > 0.05) && state.wires > 0.001;
  const smoke = M.petgSmoke;
  const originalMats = new Map();
  root.traverse((o) => { if (o.isMesh) originalMats.set(o, o.material); });
  const bandMeshes = {};
  root.traverse((o) => { if (o.userData && o.userData.e) (bandMeshes[o.userData.e.id] ||= []).push(o); });

  const api = {
    kind, root, parts, extras, wires, variants,
    /** 0..1: halves apart, sections apart, cap up, tip down, gland up. */
    setExplode(k) { api.setExplodeParts({ halves: k, upper: k, coupler: k, tip: k, cap: k, gland: k }); },
    /** Per-part explode (each 0..1) for the build sequence. */
    setExplodeParts({ halves = 0, upper = 0, coupler = 0, tip = 0, cap = 0, gland = 0 } = {}) {
      state.explode = Math.max(halves, upper, coupler, tip, cap, gland); state.halves = halves; state.upper = upper;
      for (const [nm, p] of Object.entries(parts)) {
        const isA = nm.endsWith('A');
        const up = nm.startsWith('upper');
        for (const v of ['whole', 'section']) {
          if (!p[v]) continue;
          p[v].position.set((isA ? -1 : 1) * 16 * halves, up ? 46 * upper : 0, 0);
        }
      }
      if (extras.coupler) for (const v of ['whole', 'section']) extras.coupler[v].position.set(0, 22 * coupler, 0);
      if (extras.tip) for (const v of ['whole', 'section']) extras.tip[v].position.set(0, -34 * tip, 0);
      if (extras.cap) for (const v of ['whole', 'section']) extras.cap[v].position.set(0, 86 * cap, 0);
      if (extras.gland) { extras.gland.position.set(0, 86 * cap + 32 * gland, 0); extras.gland.userData.setThreadVisible(gland > 0.02 || cap > 0.02); }
      wires.visible = wiresOk();
    },
    /** Copper tape placement (0 = above its pocket, 1 = laid in the pocket). */
    setCopper(k) {
      for (const list of Object.values(bandMeshes)) for (const g of list) { g.visible = k > 0.001; g.position.y = 40 * (1 - k) * (1 - k); }
    },
    /** Wires grow along their path from the cap (0..1); X-ray views only. */
    setWires(k) {
      state.wires = k;
      wires.traverse((o) => { if (o.isMesh && o.name.startsWith('wire:')) { const n = o.geometry.index.count; o.geometry.setDrawRange(0, Math.floor((n / 6) * k) * 6); } else if (o.isMesh) o.visible = k > 0.98; });
      wires.visible = wiresOk();
    },
    setSection(on) {
      state.section = !!on;
      variants.whole.visible = !on; variants.section.visible = !!on;
      if (extras.gland) extras.gland.visible = !on || opts.glandInSection !== false;
      wires.visible = wiresOk();
    },
    /** Swap the PETG to a smoky translucent variant (0 = solid). */
    setTranslucent(k) {
      state.translucent = k;
      root.traverse((o) => {
        if (!o.isMesh) return;
        const orig = originalMats.get(o);
        if (orig === M.petgBlack || orig === M.petgWhite) o.material = k > 0.05 ? smoke : orig;
      });
      smoke.opacity = 0.18 + 0.2 * (1 - k);
      wires.visible = wiresOk();
    },
    /** Wet overlay (0..1) on a band's copper: an overlay tint, not a recolour of the metal. */
    setWetness(id, w) {
      for (const g of bandMeshes[id] || []) g.userData.wet.opacity = 0.2 * w;
    },
    highlight(id, k) {
      for (const g of bandMeshes[id] || []) g.children[0].material = k > 0.5 ? highlightCopper() : M.copper;
    },
    /** Local (mm) anchor for effects: band centre on the inner wall facing the paddy (section plane). */
    anchor(name) {
      const e = elAll.find((q) => q.id === name);
      if (e) return new THREE.Vector3(-(rIn - 0.05), (e.y0 + e.y1) / 2, 0);
      if (name === 'cap') return new THREE.Vector3(0, P.cap.y1, 0);
      if (name === 'glandTop') return new THREE.Vector3(0, P.cap.y1 + P.gland.hexH + P.gland.domeH, 0);
      if (name === 'eref') return new THREE.Vector3(Math.sin(PHI_A - 0.6) * P.cap.chamberR, (P.cap.chamberY0 + P.cap.chamberY1) / 2, Math.cos(PHI_A - 0.6) * P.cap.chamberR);
      if (name === 'ds') return new THREE.Vector3(Math.sin(hb.dsPhi) * hb.dsCentreR, hb.dsY, Math.cos(hb.dsPhi) * hb.dsCentreR);
      if (name === 'tip') return new THREE.Vector3(0, P.tip.yPoint, 0);
      if (name === 'soil') return new THREE.Vector3(rOut, 0, 0);
      return new THREE.Vector3();
    },
    electrodes: elAll, dims: P,
  };
  api.setSection(false);
  api.setExplode(0);
  return api;
}

let hiCopper = null;
function highlightCopper() {
  if (!hiCopper) { const M = materials(); hiCopper = M.copper.clone(); hiCopper.emissive = new THREE.Color('#ff8a3d'); hiCopper.emissiveIntensity = 0.35; }
  return hiCopper;
}

function stubElectrodes() {
  const rIn = SPEC.P1.tube.id / 2, arc = SPEC.P1.bandArcDeg * Math.PI / 180;
  return [
    { id: 'S1', kind: 'sense', y0: -5, y1: 5, phi0: PHI_A - arc / 2, phi1: PHI_A + arc / 2, zc: 0 },
    { id: 'S1-Gu', kind: 'guard', y0: 9, y1: 13, phi0: PHI_A - arc / 2, phi1: PHI_A + arc / 2, of: 'S1' },
    { id: 'S1-Gd', kind: 'guard', y0: -13, y1: -9, phi0: PHI_A - arc / 2, phi1: PHI_A + arc / 2, of: 'S1' },
  ].map((e) => ({ ...e, rIn }));
}

/* ------------------------------------------------------------------ details */
function gndBus(y0, y1, el, section) {
  const M = materials();
  const rIn = SPEC.P1.tube.id / 2;
  const arc = SPEC.P1.bandArcDeg * Math.PI / 180;
  const phi = PHI_A - arc / 2 - 0.09; // just outside the band arc, on the back side
  const g = new THREE.Group(); g.name = 'gndBus';
  const guards = el.filter((e) => e.kind === 'guard' && e.of && e.y1 > y0 && e.y0 < y1);
  if (!guards.length) return g;
  const yTop = Math.min(y1 - 1, Math.max(...guards.map((q) => q.y1)) + 2), yBot = Math.max(y0 + 1, Math.min(...guards.map((q) => q.y0)) - 2);
  const r = rIn - 0.35;
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, yTop - yBot, 16), M.wire('#1d1f21'));
  wire.position.set(Math.sin(phi) * r, (yTop + yBot) / 2, Math.cos(phi) * r); wire.castShadow = false;
  g.add(wire);
  for (const q of guards) {
    const y = (q.y0 + q.y1) / 2;
    const bridge = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 10), M.solder);
    const pb = phi + 0.07;
    bridge.position.set(Math.sin(pb) * (rIn - 0.15), y, Math.cos(pb) * (rIn - 0.15)); bridge.scale.set(1.2, 0.7, 1.2);
    g.add(bridge);
  }
  void section;
  return g;
}

function dsClip(hb) {
  const M = materials();
  const d = SPEC.P1.ds18b20.diameter;
  const g = new THREE.Group(); g.name = 'dsClip';
  // C-clip: 270° ring around the steel probe, 6 mm tall, joined to the wall
  const ring = new THREE.Mesh(new THREE.TorusGeometry(d / 2 + 0.6, 0.6, 16, 48, Math.PI * 1.5), M.petgBlack);
  ring.rotation.x = Math.PI / 2;
  const c = new THREE.Vector3(Math.sin(hb.dsPhi) * hb.dsCentreR, hb.dsY, Math.cos(hb.dsPhi) * hb.dsCentreR);
  for (const dy of [-2, 2]) {
    const rr = ring.clone(); rr.position.copy(c); rr.position.y += dy;
    rr.rotation.z = hb.dsPhi + Math.PI * 0.25 + Math.PI; // opening faces the axis
    rr.castShadow = true; g.add(rr);
  }
  return g;
}

function depthTicks(y0, y1, rOut, phi) {
  const M = materials();
  const g = new THREE.Group(); g.name = 'ticks';
  const tk = SPEC.P1.ticks;
  const tickMat = new THREE.MeshStandardMaterial({ color: '#2b2e31', roughness: 0.6 });
  for (let z = tk.z0; z <= tk.z1; z += tk.shortEvery) {
    if (z <= y0 + 1 || z >= y1 - 1) continue;
    const long = z % tk.longEvery === 0;
    const w = long ? 6 : 3;
    const t = new THREE.Mesh(new RoundedBoxGeometry(tk.raised, 0.8, w, 2, 0.15), tickMat);
    const pc = phi + (w / 2) / rOut - 0.02;
    t.position.set(Math.sin(pc) * (rOut + tk.raised / 2 - 0.05), z, Math.cos(pc) * (rOut + tk.raised / 2 - 0.05));
    t.rotation.y = pc - Math.PI / 2;
    g.add(t);
  }
  // numbers (cm) on a curved decal beside the long ticks
  const tex = tickNumbers();
  const lo = Math.max(y0, 0), hi = Math.min(y1, 110);
  if (hi > lo + 5) {
    const dec = new THREE.Mesh(new THREE.CylinderGeometry(rOut + 0.04, rOut + 0.04, 110, 32, 1, true, phi + 0.5, 0.55), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    dec.position.y = 55; dec.renderOrder = 2;
    // clip the decal to this section with a texture offset trick: keep only if section covers most of it
    if (y0 <= 10 && y1 >= 100) g.add(dec);
    else if (y0 < 5) { /* lower section: numbers live on the upper section */ }
  }
  void M;
  return g;
}

/** PG7 cable gland: lock nut inside the chamber, thread through the cap, hex body, dome nut, seal, cable. */
function buildGland(P) {
  const M = materials();
  const c = P.cap, gl = P.gland;
  const g = new THREE.Group(); g.name = 'gland';
  const hexR = gl.hexAF / 2 / Math.cos(Math.PI / 6);
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(hexR, hexR, gl.hexH, 6), M.nylon); hex.position.y = c.y1 + gl.hexH / 2; hex.castShadow = true;
  const chamf = new THREE.Mesh(new THREE.CylinderGeometry(hexR * 0.92, hexR, 0.6, 6), M.nylon); chamf.position.y = c.y1 + gl.hexH + 0.3;
  g.add(hex, chamf);
  // dome nut with knurl ribs
  const domeProf = [[gl.threadR + 0.6, 0], [gl.domeR, 0], [gl.domeR, gl.domeH * 0.55], [gl.domeR * 0.82, gl.domeH * 0.92], [gl.cableR + 0.9, gl.domeH], [gl.cableR + 0.6, gl.domeH - 0.4]];
  const dome = new THREE.Mesh(new THREE.LatheGeometry(domeProf.map(([r, y]) => new THREE.Vector2(r, y)), 64), M.nylon); dome.position.y = c.y1 + gl.hexH; dome.castShadow = true;
  g.add(dome);
  for (let i = 0; i < 24; i += 1) {
    const a = (i / 24) * Math.PI * 2;
    const rib = new THREE.Mesh(new RoundedBoxGeometry(0.6, gl.domeH * 0.5, 0.9, 1, 0.2), M.nylon);
    rib.position.set(Math.sin(a) * (gl.domeR + 0.15), c.y1 + gl.hexH + gl.domeH * 0.28, Math.cos(a) * (gl.domeR + 0.15)); rib.rotation.y = a;
    g.add(rib);
  }
  // rubber seal visible at the dome mouth
  const seal = new THREE.Mesh(new THREE.TorusGeometry(gl.cableR + 0.5, 0.45, 12, 40), M.rubber); seal.rotation.x = Math.PI / 2; seal.position.y = c.y1 + gl.hexH + gl.domeH - 0.2;
  g.add(seal);
  // thread (visible only when exploded) + lock nut inside the chamber
  const thread = new THREE.Group(); thread.name = 'thread';
  const core = new THREE.Mesh(new THREE.CylinderGeometry(gl.threadR - 0.55, gl.threadR - 0.55, gl.threadLen, 48), M.nylon); core.position.y = c.y1 - gl.threadLen / 2;
  thread.add(core);
  const pitch = 1.27, turns = gl.threadLen / pitch;
  const pts = []; for (let i = 0; i <= turns * 48; i += 1) { const a = (i / 48) * Math.PI * 2; pts.push(new THREE.Vector3(Math.sin(a) * (gl.threadR - 0.35), c.y1 - gl.threadLen + (i / 48) * pitch, Math.cos(a) * (gl.threadR - 0.35))); }
  const helix = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length, 0.32, 8, false), M.nylon);
  thread.add(helix);
  const nutR = 9.2 / Math.cos(Math.PI / 6);
  const nut = new THREE.Mesh(new THREE.CylinderGeometry(nutR * 0.98, nutR * 0.98, 2.5, 6), M.nylon); nut.position.y = c.chamberY1 - 1.25;
  thread.add(nut);
  g.add(thread);
  g.userData.setThreadVisible = (on) => { core.visible = on; helix.visible = on; nut.visible = true; };
  g.userData.setThreadVisible(false);
  return g;
}

/** Nine colour-coded conductors from the cap down the half-B rib channel to each electrode, plus the DS18B20. */
function buildWires(el, P, hb) {
  const M = materials();
  const g = new THREE.Group(); g.name = 'wires';
  const rIn = P.rIn;
  const COLORS = { E1: '#c0392b', E2: '#e67e22', E3: '#f1c40f', E4: '#27ae60', EW: '#2f80c9', GND: '#1d1f21', 'DS-VDD': '#8e44ad', 'DS-DQ': '#ecf0f1', EREF: '#8b9299' };
  const chanPt = (y, layer, idx) => {
    const off = (idx - 2) * 0.5 / rIn; const r = rIn - 0.28 - layer * 0.5;
    const ph = hb.channelPhi + off;
    return new THREE.Vector3(Math.sin(ph) * r, y, Math.cos(ph) * r);
  };
  const topY = P.cap.chamberY0 + 4;
  const targets = [];
  const tabPhi = PHI_A - 0.62; // solder tabs on the back side of each band (visible in section)
  for (const e of el.filter((q) => q.kind === 'sense')) targets.push({ id: e.id, y: (e.y0 + e.y1) / 2, to: new THREE.Vector3(Math.sin(tabPhi) * (rIn - 0.1), (e.y0 + e.y1) / 2, Math.cos(tabPhi) * (rIn - 0.1)) });
  const ew = el.find((q) => q.id === 'EW');
  targets.push({ id: 'EW', y: 60, to: new THREE.Vector3(Math.sin(PHI_A - 0.25) * (rIn - 0.1), 60, Math.cos(PHI_A - 0.25) * (rIn - 0.1)) });
  void ew;
  const arc = SPEC.P1.bandArcDeg * Math.PI / 180, busPhi = PHI_A - arc / 2 - 0.09;
  targets.push({ id: 'GND', y: -12, to: new THREE.Vector3(Math.sin(busPhi) * (rIn - 0.4), -12, Math.cos(busPhi) * (rIn - 0.4)) });
  const ds = new THREE.Vector3(Math.sin(hb.dsPhi) * hb.dsCentreR, hb.dsY + SPEC.P1.ds18b20.length / 2 + 2, Math.cos(hb.dsPhi) * hb.dsCentreR);
  targets.push({ id: 'DS-VDD', y: ds.y, to: ds.clone().add(new THREE.Vector3(0.6, 0, 0)) });
  targets.push({ id: 'DS-DQ', y: ds.y, to: ds.clone().add(new THREE.Vector3(-0.6, 0, 0)) });
  const eref = new THREE.Vector3(Math.sin(PHI_A - 0.6) * (P.cap.chamberR - 0.4), P.cap.chamberY0 + 5, Math.cos(PHI_A - 0.6) * (P.cap.chamberR - 0.4));
  targets.push({ id: 'EREF', y: P.cap.chamberY0 + 5, to: eref, inCap: true });

  targets.forEach((t, i) => {
    const layer = i % 2, idx = Math.floor(i / 2);
    const pts = [new THREE.Vector3(0.8 * Math.sin(i), P.cap.chamberY1 - 2, 0.8 * Math.cos(i))];
    if (t.inCap) {
      pts.push(new THREE.Vector3(eref.x * 0.5, P.cap.chamberY0 + 7, eref.z * 0.5), t.to);
    } else {
      pts.push(chanPt(topY - 2, layer, idx), chanPt(topY - 12, layer, idx));
      const yb = t.y + 6;
      for (let y = topY - 30; y > yb; y -= 30) pts.push(chanPt(y, layer, idx));
      pts.push(chanPt(yb, layer, idx));
      const a = chanPt(t.y + 2, layer, idx), b = t.to;
      const mid = a.clone().lerp(b, 0.5); mid.z -= 3.2; mid.y += 1.5;
      if (Math.hypot(mid.x, mid.z) > rIn - 1) mid.multiplyScalar((rIn - 1.2) / Math.hypot(mid.x, mid.z));
      pts.push(a, mid, b);
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.4);
    const w = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, pts.length * 8), 0.25, 16, false), M.wire(COLORS[t.id]));
    w.castShadow = false; w.name = `wire:${t.id}`;
    g.add(w);
    if (!t.inCap && !t.id.startsWith('DS')) { const sb = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), M.solder); sb.position.copy(t.to); sb.scale.set(1.1, 0.75, 1.1); g.add(sb); }
  });
  // DS18B20 steel probe in its clip, with its cable stub
  const d = SPEC.P1.ds18b20;
  const steel = new THREE.Mesh(new THREE.CapsuleGeometry(d.diameter / 2, d.length - d.diameter, 8, 32), M.steel);
  steel.position.set(Math.sin(hb.dsPhi) * hb.dsCentreR, hb.dsY, Math.cos(hb.dsPhi) * hb.dsCentreR); steel.castShadow = true;
  g.add(steel);
  const boot = new THREE.Mesh(new THREE.CylinderGeometry(d.diameter / 2 - 0.4, d.diameter / 2 - 0.2, 4, 24), M.cable);
  boot.position.copy(steel.position); boot.position.y += d.length / 2 + 1; g.add(boot);
  g.userData.ds = steel;
  return g;
}
