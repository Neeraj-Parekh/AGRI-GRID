// Interactive modes (outside the timeline): moisture slider, exploded view, and replay of a real node log.
// Each is a pure function of its parameters, like the chapters.
import * as THREE from 'three';
import { V } from './kit.js';
import { fieldBase } from './ch-field.js';
import { toppInverse, touchCount, clamp } from '../spec/physics.js';
import { fieldLineSet } from '../fx/scanfx.js';

const BANDS = ['E1', 'E2', 'E3', 'E4'];
const BAND_Z = { E1: -25, E2: -75, E3: -125, E4: -175 };
const wetOf = (th) => clamp((th - 0.28) / 0.2, 0, 1);

/** Piecewise profile through the four band values (and saturated below the water table). */
function profileFrom(theta, level) {
  return (z) => {
    if (z <= level) return 0.48;
    const pts = BANDS.map((b) => [BAND_Z[b], theta[b]]);
    if (z >= pts[0][0]) return pts[0][1];
    for (let i = 0; i < pts.length - 1; i += 1) if (z <= pts[i][0] && z >= pts[i + 1][0]) { const k = (pts[i][0] - z) / (pts[i][0] - pts[i + 1][0]); return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k; }
    return pts[pts.length - 1][1];
  };
}

function bandsFrame(ctx, theta, level, t, honesty, stamp) {
  const f = ctx.field, fx = ctx.fx; fieldBase(f, t);
  f.probe.setSection(true); f.setWater(level); f.setProfile(profileFrom(theta, level));
  BANDS.forEach((b) => { const th = level >= BAND_Z[b] ? 0.48 : theta[b]; f.probe.setWetness(b, wetOf(th)); });
  f.probe.setWetness('EW', level > 0 ? clamp(level / 50, 0.2, 1) : 0);
  fx.lines.build('E2-guard', [fieldLineSet({ x0: -0.0109, yc: -0.075, h: 0.01, guardGap: 0.004, reach: 0.032, lines: 6, guards: true })]);
  fx.lines.set({ opacity: 0.8, phase: t * 0.9, grow: 1, tone: theta.E2 > 0.35 ? 'water' : 'sense' });
  const eff = (b) => (level >= BAND_Z[b] ? 0.48 : theta[b]);
  return {
    cam: { eye: [0.06, -0.06, 0.42], target: [-0.03, -0.09, 0], fov: 32 },
    tags: BANDS.map((b) => ({ text: `${b} · θ ${Math.round(eff(b) * 100)} % · count ${touchCount(eff(b), BANDS.indexOf(b))}`, tone: eff(b) < 0.37 ? 'warn' : 'sense', pos: V(0.02, BAND_Z[b] / 1000, 0.016), opacity: 1, h: 0.8 })),
    honesty,
    hud: {
      phase: { text: stamp || 'Moisture slider', tone: 'sense' },
      kpis: [{ l: 'Water', v: Math.round(level), u: 'mm', tone: 'water' }, { l: 'E2 ε', v: toppInverse(eff('E2')).toFixed(1), u: '' }, { l: 'E3 θ', v: Math.round(eff('E3') * 100), u: '%', tone: eff('E3') < 0.37 ? 'warn' : 'sense' }],
      card: { kind: 'bands', theta: Object.fromEntries(BANDS.map((b) => [b, eff(b)])), level, day: 0 },
      caption: 'Drag each band’s water content: the soil shading, the band tint, the touch count and Topp’s ε all follow. Counts are illustrative until calibrated.',
    },
  };
}

export const INTERACTIVE = {
  moisture: {
    world: 'field',
    defaults: { E1: 0.3, E2: 0.36, E3: 0.42, E4: 0.46, level: -120 },
    frame(ctx, p, t) { return bandsFrame(ctx, p, p.level, t, 'Interactive · illustrative counts'); },
  },
  explode: {
    world: 'bench',
    defaults: { k: 0.6, section: 0 },
    frame(ctx, p) {
      const b = ctx.bench; b.show(['hero']);
      const h = b.hero; h.setSection(false); h.setTranslucent(p.section ? 1 : 0); h.setWires(1); h.setCopper(1); b.upright(h, 0.3); h.setExplode(p.k);
      b.frame(V(0, 0.3, 0), 0.42);
      return { cam: { eye: [0.32, 0.4, 1.0], target: [0, 0.31, 0], fov: 34 }, tags: [], honesty: 'Interactive · design render', hud: { phase: { text: 'Exploded view', tone: 'sense' }, kpis: [{ l: 'Explode', v: Math.round(p.k * 100), u: '%' }], caption: 'Drag to take the probe apart: halves, coupler, tip, cap and PG7 gland. At 0 every contact is closed.' } };
    },
  },
  replay: {
    world: 'field',
    defaults: { i: 0 },
    /** p.log: [{ t (ms), node, level, E1..E4 (fraction) }], p.i: row index */
    frame(ctx, p, t) {
      const rows = p.log || []; const r = rows[Math.max(0, Math.min(rows.length - 1, Math.round(p.i)))];
      if (!r) return bandsFrame(ctx, INTERACTIVE.moisture.defaults, -120, t, 'No log loaded');
      const d = new Date(r.t); const stamp = `Measured · ${r.node || 'A1'} · ${Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 16).replace('T', ' ') : ''}`;
      return bandsFrame(ctx, { E1: r.E1, E2: r.E2, E3: r.E3, E4: r.E4 }, r.level ?? -120, t, stamp, stamp);
    },
  },
};

/** Parse a node log (CSV with a header, or a JSON array). Accepts θ as fraction or percent. */
export function parseLog(text) {
  const norm = (v) => { const n = Number(v); return Number.isFinite(n) ? (n > 1.5 ? n / 100 : n) : null; };
  let rows = [];
  const s = text.trim();
  if (s.startsWith('[')) rows = JSON.parse(s);
  else {
    const lines = s.split(/\r?\n/).filter(Boolean); const head = lines[0].split(',').map((h) => h.trim().toLowerCase());
    rows = lines.slice(1).map((l) => { const c = l.split(','); const o = {}; head.forEach((h, i) => { o[h] = c[i]?.trim(); }); return o; });
  }
  return rows.map((o) => ({
    t: Date.parse(o.timestamp || o.time || o.t) || Number(o.t) || 0,
    node: o.node || o.node_id || 'A1',
    level: Number(o.level_mm ?? o.level ?? o.water_mm ?? -120),
    E1: norm(o.e1 ?? o.E1 ?? o.theta_e1), E2: norm(o.e2 ?? o.E2 ?? o.theta_e2), E3: norm(o.e3 ?? o.E3 ?? o.theta_e3), E4: norm(o.e4 ?? o.E4 ?? o.theta_e4),
  })).filter((r) => [r.E1, r.E2, r.E3, r.E4].every((v) => v != null));
}

export const SPEC_CARDS = {
  lower: ['Probe body, lower section', 'PETG, OD 25 mm, wall 1.6 mm, Z −210 … +10 mm; copper bands E1–E4 inside half A, wire ribs on half B'],
  upper: ['Probe body, upper section', 'PETG, white above the soil, raised depth ticks 0–10 cm, EW water strip inside'],
  coupler: ['Coupler', 'OD 21.4 mm, wall 2 mm, 30 mm long, 15 mm into each section, 6 mm wire slot'],
  tip: ['Cone tip', 'Z −210 … −230 mm, point radius 1.5 mm, plug OD 21.4 × 10 mm seated in the bore'],
  cap: ['Cap', 'OD 32, 30 high, socket 15 mm over the tube, wire chamber, EREF pad sealed in epoxy'],
  gland: ['PG7 cable gland', 'Thread 12.5 mm, hex 15 AF, seals the 5 mm cable'],
  wires: ['Conductors', '9 colour-coded wires along the half-B ribs: E1–E4, EW, GND, DS-VDD, DS-DQ, EREF'],
  'node-A1': ['Node box N1', 'Inner 110 × 130 × 55 mm, gasket in a rim groove, two C-clips on a 20 mm stake, PG7 glands below'],
  gaugeG1: ['Staff gauge G1', '280 × 30 × 4 mm, −150 … +100 mm scale, zero at the soil surface'],
  stake: ['Stake', '20 mm, driven 350 mm into the bund'],
  cable: ['Probe cable', '11-pin, 5 mm OD, ≤ 400 mm, drip loop below the box gland'],
  sectionFace: ['Soil section', 'Puddled layer 0–150 mm, plough pan 150–200 mm, mottled subsoil; shading follows θ'],
  bund: ['Bund', 'Earth bund, 200 mm high, smooth shoulders'],
  esp32: ['ESP32', 'Touch pins T9, T8, T7, T6 (E1–E4), T4 (EW), T0 (EREF)'],
  tp4056: ['TP4056', 'Li-ion charger with protection, fed by the 1 W panel'],
  ht7833: ['HT7833', '3.3 V LDO for the ESP32'],
  ina219: ['INA219', 'Current/voltage monitor on I²C (GPIO21/22)'],
  cell18650: ['18650 cell', 'In its holder on the box floor'],
};
