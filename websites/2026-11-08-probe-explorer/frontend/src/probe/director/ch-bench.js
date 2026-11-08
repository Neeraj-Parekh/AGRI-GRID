// Studio chapters: 2 Meet the probe, 3 Print and build, 11 Calibrate it, 13 The three prints, 14 Inside the node.
import * as THREE from 'three';
import { shotAt, eventsAt, captionAt, tagWindow, window01, smooth01, clamp, lerp, V, fmt, orbit } from './kit.js';
import { lyingPose } from '../world/bench.js';
import { probeParts } from '../spec/layout.js';
import { touchCount, topp } from '../spec/physics.js';
import { TONE } from '../fx/scanfx.js';
import SPEC from '../spec/probe-spec.json' with { type: 'json' };

const prog = (t, a, b) => smooth01((t - a) / Math.max(b - a, 1e-4));
const P1 = probeParts('P1');

function benchBase(b) {
  for (const p of [b.hero, b.p2, b.p4]) { p.setSection(false); p.setTranslucent(0); p.setExplodeParts({}); p.setWires(1); p.setCopper(1); }
  b.hero.root.rotation.set(0, 0, 0);
  b.nodeP.setLidOpen(0); b.nodeF.setLidOpen(0);
}
/** World position of an axial point (mm) on a lying probe, lifted by `up` (m) above its surface. */
function lyingPoint(kind, x0, z0, s, up = 0.012, r = 12.5) {
  const p = lyingPose(kind);
  return V(x0 + (s / 1000) * Math.cos(p.delta), p.y0 + (s / 1000) * Math.sin(p.delta) + r / 1000 + up, z0);
}

/* ======================================================================= 2 · Meet the probe */
export const chMeet = {
  id: 'meet', n: 2, world: 'bench', dur: 24,
  title: 'Meet the probe',
  honesty: 'Design render · probe in build',
  frame(ctx, t) {
    const b = ctx.bench; benchBase(b);
    b.show(['hero', 'pen', 'rule']);
    const x0 = 0.03; b.lie(b.hero, 'P1', x0, 0);
    const inside = window01(t, 15.5, 24.5, 0.8, 0.1);
    b.hero.setTranslucent(inside > 0.5 ? 1 : 0);
    b.frame(V(0, 0, 0.03), 0.3);
    const ang = lerp(-0.25, 0.18, prog(t, 0, 24));
    const cam = shotAt([[0, [0.02, 0.7, 0.72], [-0.01, 0.0, 0.035], 30], [6, [0.03, 0.5, 0.76], [-0.01, 0.01, 0.03], 30], [15.5, [0.0, 0.34, 0.72], [-0.015, 0.012, 0.01], 30], [24, [0.05, 0.33, 0.7], [-0.02, 0.012, 0.0], 30]], t);
    void ang;
    const lp = (s, up) => lyingPoint('P1', x0, 0, s, up);
    const on = (a) => window01(t, a, 15.4, 0.4, 0.4);
    const tags = [
      { text: 'Cap + PG7 gland', sub: 'cable out, sealed', tone: 'sense', pos: lp(150, 0.012), opacity: on(6.4) },
      { text: 'White above ground', sub: 'depth ticks 0–10 cm', tone: 'sense', pos: lp(70, 0.008), opacity: on(7.4) },
      { text: 'Soil-line groove · Z 0', tone: 'ok', pos: lp(0, 0.004), opacity: on(8.4) },
      { text: 'Black below ground', sub: 'four sensing depths inside', tone: 'sense', pos: lp(-110, 0.008), opacity: on(9.4) },
      { text: 'Cone tip', tone: 'sense', pos: lp(-222, 0.0), opacity: on(10.4) },
      { text: 'Pen for scale · 140 mm', tone: 'sense', pos: V(0.08, 0.012, 0.055), opacity: on(11.4) },
      ...['E1', 'E2', 'E3', 'E4'].map((id, i) => ({ text: `${id} · ${['0–5', '5–10', '10–15', '15–20'][i]} cm`, tone: 'water', pos: lp([-25, -75, -125, -175][i], 0.004), opacity: window01(t, 16.4 + i * 0.4, 24, 0.4, 0.2), h: 0.7 })),
      { text: 'EW water strip', tone: 'water', pos: lp(50, 0.004), opacity: window01(t, 18.4, 24, 0.4, 0.2), h: 0.7 },
    ];
    const ev = eventsAt([[1, 'P1 hero probe', 'sense', 'design'], [16, 'X-ray: bands inside the tube', 'sense', 'design']], t);
    return {
      cam, tags,
      hud: {
        phase: { text: t < 15.5 ? 'Above and below ground' : 'Inside the tube', tone: 'sense' },
        kpis: [{ l: 'Tube OD', v: '25', u: 'mm' }, { l: 'Wall', v: '1.6', u: 'mm' }, { l: 'Tip to cap', v: '385', u: 'mm' }, { l: 'Depths', v: '4', u: '' }],
        card: { kind: 'spec', rows: [['Body', 'PETG, two printed halves, epoxy seam'], ['Above ground', '140 mm, white, depth ticks'], ['Below ground', '210 mm + 20 mm tip'], ['Sensing', 'E1–E4: 10 mm copper bands, 4 mm guards'], ['Water level', 'EW strip, −5 to +100 mm'], ['Reference', 'EREF pad in the cap, DS18B20 at −10 cm'], ['Cable', 'PG7 gland, ≤ 400 mm to the node']] },
        ...ev,
        caption: captionAt([[0, 'The AGRI-GRID probe, at true size next to a pen and a steel rule.'], [6, 'White above ground with depth ticks, black below. The soil-line groove marks the surface.'], [15.5, 'Inside: four copper sensing bands at 0–5, 5–10, 10–15 and 15–20 cm, a water-level strip, a temperature sensor and a reference pad.']], t),
      },
    };
  },
};

/* ======================================================================= 3 · Print and build */
const STEPS3 = ['Print halves arch-up, cut faces down', 'Copper tape into the pockets', 'Close the halves, epoxy seam', 'Join sections on the coupler', 'Wires along the ribs + DS18B20', 'Push the tip plug into the bore', 'Cap on, PG7 gland threaded in'];
export const chBuild = {
  id: 'build', n: 3, world: 'bench', dur: 34,
  title: 'Print and build',
  honesty: 'Design render · build sequence',
  frame(ctx, t) {
    const b = ctx.bench, fx = ctx.fx; benchBase(b);
    const printing = t < 6;
    b.show(printing ? ['bed', 'printSet'] : ['hero']);
    const h = b.hero; b.upright(h, 0.3);
    const halves = (1 + 1.6 * window01(t, 6.2, 11.6, 0.9, 0.9)) * (1 - prog(t, 11, 14.6)), up = 1 - prog(t, 15, 18.6), coupler = 1 - prog(t, 15, 18.2), tip = 1 - prog(t, 23, 25.8), cap = 1 - prog(t, 26, 28.6), gland = 1 - prog(t, 27.4, 29.8);
    h.setExplodeParts({ halves, upper: up, coupler, tip, cap, gland });
    h.setCopper(prog(t, 6.3, 10.4));
    const xray = window01(t, 18.8, 26, 0.5, 0.5);
    h.setTranslucent(xray > 0.5 ? 1 : 0);
    h.setWires(prog(t, 19.2, 22.6));
    b.frame(V(0, printing ? 0 : 0.3, 0), printing ? 0.18 : 0.42);
    const cam = shotAt([[0, [0.14, 0.4, 0.4], [-0.02, 0.0, 0.0], 32], [5.6, [0.12, 0.36, 0.36], [-0.02, 0.0, 0.0], 32], [6.4, [0.3, 0.38, 1.0], [0.0, 0.31, 0], 34], [7.6, [0.2, 0.25, 0.25], [-0.035, 0.2, 0], 30], [10.6, [0.2, 0.25, 0.25], [-0.035, 0.2, 0], 30], [11.6, [0.22, 0.3, 0.62], [0.0, 0.25, 0], 32], [14.8, [0.22, 0.3, 0.62], [0.0, 0.25, 0], 32], [15.6, [0.16, 0.33, 0.36], [0.0, 0.31, 0], 30], [18.6, [0.16, 0.33, 0.36], [0.0, 0.31, 0], 30], [19.4, [0.07, 0.212, 0.14], [0.0, 0.205, 0], 30], [22.8, [0.07, 0.212, 0.14], [0.0, 0.205, 0], 30], [23.4, [0.1, 0.1, 0.3], [0.0, 0.08, 0], 30], [25.8, [0.1, 0.1, 0.3], [0.0, 0.08, 0], 30], [26.4, [0.12, 0.47, 0.32], [0.0, 0.45, 0], 30], [29.8, [0.12, 0.47, 0.32], [0.0, 0.45, 0], 30], [31, [0.3, 0.4, 0.95], [0.0, 0.31, 0], 34], [34, orbit([0, 0.31, 0], 0.95, 0.09, 0.62), [0.0, 0.31, 0], 34]], t);
    const step = t < 6 ? 0 : t < 11 ? 1 : t < 15 ? 2 : t < 19 ? 3 : t < 23 ? 4 : t < 26 ? 5 : 6;
    // contact flash when a joint closes
    const flash = (tc, pos) => { const k = window01(t, tc - 0.1, tc + 0.9, 0.1, 0.8); if (k > 0) fx.rings[0].set({ phase: (t - tc) * 2.4, centre: pos, normal: V(0, 1, 0), maxR: 0.03, strength: k, period: 2.4, color: TONE.ok }); };
    flash(14.6, V(0, 0.3 - 0.1, 0)); flash(18.6, V(0, 0.31, 0)); flash(25.8, V(0, 0.3 - 0.21, 0)); flash(28.6, V(0, 0.3 + 0.125, 0));
    const tags = [
      { text: 'Halves arch-up, seam faces on the bed', sub: '0.4 mm nozzle · 0.2 mm layers · 4 perimeters · no supports', tone: 'sense', pos: V(-0.11, 0.03, -0.09), opacity: window01(t, 0.8, 5.8, 0.4, 0.3) },
      { text: 'Copper tape into 0.15 mm pockets', sub: 'flush with the inner wall of half A', tone: 'sense', pos: V(-0.05, 0.25, 0.0), anchorX: 1.04, opacity: window01(t, 7.8, 10.8, 0.4, 0.3) },
      { text: 'Tongue into groove · epoxy seam', tone: 'ok', pos: V(0.025, 0.24, 0), opacity: window01(t, 12, 15.2, 0.4, 0.3) },
      { text: 'Coupler: 15 mm into each section', tone: 'ok', pos: V(0.025, 0.31, 0), opacity: window01(t, 16, 19.2, 0.4, 0.3) },
      { text: 'Wires along the half-B ribs', sub: 'through the coupler slot to the cap', tone: 'sense', pos: V(0.016, 0.225, 0), opacity: window01(t, 19.8, 23, 0.4, 0.3) },
      { text: 'DS18B20 in its clip', tone: 'sense', pos: V(0.016, 0.2, 0.004), opacity: window01(t, 21.2, 23, 0.3, 0.3) },
      { text: 'Tip plug fully seated', tone: 'ok', pos: V(0.025, 0.09, 0), opacity: window01(t, 24, 26.2, 0.4, 0.3) },
      { text: 'Cap covers the tube by 15 mm', sub: 'gland threaded in, cable through it', tone: 'ok', pos: V(0.03, 0.45, 0), opacity: window01(t, 27, 31, 0.4, 0.3) },
    ];
    const ev = eventsAt([[1, 'Print: 4 half shells, PETG, no supports', 'sense', 'print'], [10.4, 'Copper laid flush with the wall', 'ok', 'build'], [14.6, 'Halves closed', 'ok', 'build'], [18.6, 'Sections joined', 'ok', 'build'], [22.6, '9 conductors routed', 'ok', 'build'], [25.8, 'Tip seated', 'ok', 'build'], [29.8, 'Probe sealed', 'ok', 'build']], t);
    return {
      cam, tags,
      hud: {
        phase: { text: STEPS3[step], tone: 'sense' },
        kpis: [{ l: 'Step', v: `${step + 1}/7`, u: '' }, { l: 'Nozzle', v: '0.4', u: 'mm' }, { l: 'Layer', v: '0.2', u: 'mm' }, { l: 'Perimeters', v: '4', u: '' }],
        card: { kind: 'steps', title: 'Build steps', steps: STEPS3, done: STEPS3.map((_, i) => i < step), active: step },
        ...ev,
        caption: captionAt([[0, 'Each section prints as two half shells, arch up with the cut faces on the bed, in matte PETG with no supports.'], [6, 'Copper tape goes into shallow pockets so it sits flush with the inner wall.'], [11, 'The halves close tongue-into-groove with an epoxy seam; a coupler joins the two sections.'], [19, 'Nine colour-coded wires run along the ribs of half B to the cap. The DS18B20 clips against the wall.'], [23, 'The tip plug seats in the bore, then the cap and PG7 gland seal the top. Every joint closes on a real contact.']], t),
      },
    };
  },
};

/* ======================================================================= 11 · Calibrate it */
const CAL = [0.10, 0.18, 0.26, 0.33, 0.40, 0.47];
const V_CUP = 150, M_DRY = 200;
export const chCalib = {
  id: 'calib', n: 11, world: 'bench', dur: 30,
  title: 'Calibrate it',
  honesty: 'Example values · method: gravimetric oven-dry',
  frame(ctx, t) {
    const b = ctx.bench, fx = ctx.fx; benchBase(b);
    b.show(['cups', 'p4', 'scale', 'oven']);
    const cx = (i) => -0.32 + i * 0.085;
    b.cups.forEach((c, i) => c.position.set(cx(i), 0, 0));
    b.scale.group.position.set(0.24, 0, 0.03); b.oven.position.set(0.5, 0, -0.1);
    const read = clamp(Math.floor((t - 0.5) / 2), 0, 5);
    const p4 = b.p4; p4.root.rotation.set(0, 0, 0); p4.root.position.set(cx(t < 12.5 ? read : 5), 0.05, 0); p4.root.visible = t < 12.5;
    const weigh = clamp(Math.floor((t - 12.5) / 1), 0, 5); const dryW = clamp(Math.floor((t - 19.5) / 0.75), 0, 5);
    const mWet = (i) => M_DRY + CAL[i] * V_CUP;
    let reading = '0.0 g';
    if (t >= 12.5 && t < 18.5) reading = `${mWet(weigh).toFixed(1)} g`;
    else if (t >= 19.5 && t < 24) reading = `${M_DRY.toFixed(1)} g`;
    b.scale.setReading(reading);
    const sel = t < 12.5 ? read : t < 18.5 ? weigh : dryW;
    if (t < 24) fx.lock.set({ pos: V(cx(sel), 0.04, 0.04), camera: ctx.camera, size: [0.045, 0.045], k: 1, opacity: 0.9, color: t < 12.5 ? TONE.sense : TONE.ok });
    b.frame(V(0.05, 0.05, 0), 0.5);
    const cam = shotAt([[0, [-0.02, 0.32, 0.72], [-0.08, 0.03, 0], 32], [12, [-0.02, 0.3, 0.68], [-0.08, 0.03, 0], 32], [13.5, [0.12, 0.3, 0.7], [0.08, 0.04, 0], 32], [18.5, [0.3, 0.32, 0.72], [0.36, 0.08, -0.04], 32], [24, [0.3, 0.32, 0.72], [0.36, 0.08, -0.04], 32], [26, [0.14, 0.52, 1.18], [0.12, 0.06, -0.03], 34], [30, [0.12, 0.54, 1.2], [0.12, 0.06, -0.03], 34]], t);
    const rows = CAL.map((th, i) => ({ cup: i + 1, count: t > 0.5 + i * 2 + 1 ? touchCount(th, 1) : null, wet: t > 12.5 + i ? mWet(i) : null, dry: t > 19.5 + i * 0.75 ? M_DRY : null, theta: t > 19.5 + i * 0.75 ? th : null }));
    const tags = [
      { text: `Cup ${read + 1} · count ${touchCount(CAL[read], 1)}`, tone: 'sense', pos: V(cx(read), 0.11, 0.0), opacity: window01(t, 0.6 + read * 2, 2.4 + read * 2, 0.25, 0.25) * (t < 12.4 ? 1 : 0) },
      { text: 'Weigh wet', sub: 'm_wet', tone: 'ok', pos: V(0.25, 0.06, 0.05), opacity: window01(t, 12.6, 18.4, 0.4, 0.4) },
      { text: 'Dry 105 °C · 24 h', sub: 'then weigh dry', tone: 'warn', pos: V(0.5, 0.27, 0.04), opacity: window01(t, 18.6, 24, 0.4, 0.4) },
      { text: 'θ = (m_wet − m_dry) / (ρw · V)', tone: 'ok', pos: V(0.0, 0.14, 0.0), opacity: window01(t, 22, 30, 0.5, 0.5) },
    ];
    const ev = eventsAt([[1, 'Probe in cup 1 (driest)', 'sense', 'cal'], [11, 'Six counts recorded', 'ok', 'cal'], [13, 'Weighing wet', 'sense', 'cal'], [19, 'Oven 105 °C for 24 h', 'warn', 'cal'], [23.5, 'θ computed per cup', 'ok', 'cal'], [25, 'Curve fitted: Topp → calibrated', 'ok', 'cal']], t);
    return {
      cam, tags,
      hud: {
        phase: { text: t < 12.5 ? 'Record counts' : t < 18.5 ? 'Weigh wet' : t < 24 ? 'Oven-dry and weigh' : 'Fit your soil curve', tone: t < 24 ? 'sense' : 'ok' },
        kpis: [{ l: 'Cups', v: '6', u: '' }, { l: 'Volume', v: `${V_CUP}`, u: 'cm³' }, { l: 'Oven', v: '105', u: '°C' }],
        card: { kind: 'calib', rows, fit: prog(t, 24, 27) },
        ...ev,
        caption: captionAt([[0, 'Calibrate in your own soil: fill five or six cups from dry to saturated and record the probe count in each.'], [12.5, 'Weigh each cup, oven-dry it at 105 °C for 24 hours, and weigh it again.'], [22, 'Water content is θ = (m_wet − m_dry) / (ρw·V). Fit counts against θ and replace the Topp curve with your own.']], t),
      },
    };
  },
};

/* ======================================================================= 13 · The three prints */
export const chPrints = {
  id: 'prints', n: 13, world: 'bench', dur: 22,
  title: 'The three prints',
  honesty: 'Design render · prints in build',
  frame(ctx, t) {
    const b = ctx.bench; benchBase(b);
    b.show(['hero', 'p2', 'p3', 'p3s', 'p4']);
    b.lie(b.hero, 'P1', 0.0, -0.13); b.lie(b.p2, 'P2', -0.03, -0.06);
    // P3 rests in its stand's saddles, axis along the saddle line
    const st = b.p3s; st.group.position.set(-0.03, 0, 0.04);
    const s1 = st.saddles[0], s2 = st.saddles[1];
    const dir = V(s2.x - s1.x, s2.yAxis - s1.yAxis, 0).normalize();
    const ang = Math.atan2(dir.y, dir.x);
    b.p3.root.rotation.set(0, 0, -Math.PI / 2 + ang);
    const sAt1 = -180; // axial point (mm) resting in saddle 1
    b.p3.root.position.set(st.group.position.x + s1.x - dir.x * sAt1 / 1000, s1.yAxis - 0.0002 - dir.y * sAt1 / 1000, st.group.position.z);
    b.p4.root.rotation.set(0, 0, 0); b.p4.root.position.set(0.25, 0.032, 0.07);
    b.frame(V(0.03, 0.03, 0), 0.32);
    const cam = shotAt([[0, [-0.02, 0.6, 0.7], [0.03, 0.02, -0.03], 32], [11, [0.06, 0.46, 0.66], [0.04, 0.03, -0.02], 32], [22, [0.1, 0.42, 0.64], [0.04, 0.03, -0.02], 32]], t);
    const tags = [
      { text: 'P1 hero · 4 bands + EW', sub: 'node A1', tone: 'sense', pos: lyingPoint('P1', 0.0, -0.13, 60, 0.012), opacity: window01(t, 1.5, 22, 0.4, 0.3) },
      { text: 'P2 mini · 1 band + EW', sub: 'nodes B2, C3, D4', tone: 'sense', pos: lyingPoint('P2', -0.03, -0.06, -110, 0.006), anchorX: 1.04, opacity: window01(t, 3, 22, 0.4, 0.3) },
      { text: 'P3 cutaway display', sub: 'on its 15° stand', tone: 'sense', pos: V(-0.05, 0.08, 0.04), opacity: window01(t, 4.5, 22, 0.4, 0.3) },
      { text: 'P4 test stub · 60 mm', sub: 'for calibration cups', tone: 'sense', pos: V(0.25, 0.08, 0.07), opacity: window01(t, 6, 22, 0.4, 0.3) },
    ];
    return {
      cam, tags,
      hud: {
        phase: { text: 'Four prints, one design', tone: 'sense' },
        kpis: [{ l: 'P1', v: '385', u: 'mm' }, { l: 'P2', v: '230', u: 'mm' }, { l: 'P4', v: '60', u: 'mm' }],
        card: { kind: 'table', title: 'Print list', head: ['Part', 'Use', 'Bands'], rows: [['P1 hero', 'node A1', 'E1–E4 + EW'], ['P2 mini', 'B2, C3, D4', 'ES + EW'], ['P3 cutaway', 'display, demos', 'shown open'], ['P4 stub', 'calibration', 'S1']] },
        ...eventsAt([[1, 'P1, P2, P3, P4 laid out', 'sense', 'print']], t),
        caption: captionAt([[0, 'One parametric design, four prints: P1 for the hero node, P2 for the field nodes, P3 opened up for display, and P4 for calibration cups.']], t),
      },
    };
  },
};

/* ======================================================================= 14 · Inside the node */
export const chNode = {
  id: 'node', n: 14, world: 'bench', dur: 30, variant: true,
  title: 'Inside the node',
  honesty: 'Design render · circuit from the build sheet',
  frame(ctx, t) {
    const b = ctx.bench, fx = ctx.fx; benchBase(b);
    const field = ctx.settings.variant === 'field';
    b.show(['base', field ? 'nodeF' : 'nodeP']);
    const n = field ? b.nodeF : b.nodeP;
    const lid = prog(t, 2, 5);
    n.setLidOpen(lid, 'aside');
    n.root.updateMatrixWorld(true);
    const at = (name, dy = 0, dz = 6) => { const o = n.inside.getObjectByName(name); if (!o) return V(0, 0.3, 0.08); const p = o.getWorldPosition(V(0, 0, 0)); return p.add(V(0, dy, dz / 1000)); };
    // power + signal traces (box-local mm → world), drawn over the perfboard
    if (!b._traceBuilt || b._traceBuilt !== n) {
      const L = (pts) => pts.map(([x, y, z]) => n.root.localToWorld(V(x, y, z)));
      const zt = 3 + 25 + 1.6 + 6;
      const H = 130 + 4.8;
      const yb = H / 2 + 6;
      fx.trace.build(`trace-${field}`, [
        L([[0, 16 + 2.4, 12], [0, 16 + 2.4, zt], [18, yb + 8, zt], [18, yb + 22, zt]]), // 18650 → TP4056
        L([[18, yb + 22, zt], [24, yb + 22, zt], [24, yb - 30, zt], [2, yb - 30, zt]]), // TP4056 → HT7833
        L([[2, yb - 30, zt], [-14, yb - 30, zt], [-14, yb - 18, zt]]), // HT7833 → ESP32 3V3
        L([[-10, yb - 43, zt], [-10, yb - 36, zt], [-20, yb - 30, zt], [-20, yb - 10, zt]]), // J1 → ESP32 touch pins
        L([[18, yb - 8, zt], [4, yb - 8, zt], [-4, yb + 4, zt]]), // INA219 → I2C
      ], 0.0011, V(0, 0, 1));
      b._traceBuilt = n;
    }
    fx.trace.set({ opacity: window01(t, 6, 30, 0.6, 0.5), head: prog(t, 6, 12), tone: 'sense' });
    const ctr = n.root.localToWorld(V(0, 67, 30));
    b.frame(ctr, 0.22);
    const cam = shotAt([[0, [0.32, 0.48, 0.78], [0.05, 0.3, 0.03], 32], [5, [0.16, 0.4, 0.56], [0.04, 0.3, 0.04], 30], [18, [0.14, 0.39, 0.54], [0.04, 0.3, 0.04], 30], [24, [0.32, 0.44, 0.6], [0.05, 0.3, 0.02], 32], [30, [0.34, 0.46, 0.64], [0.05, 0.3, 0.02], 32]], t);
    const lab = (text, name, t0, sub, dy = 0.0) => ({ text, sub, tone: 'sense', pos: at(name, dy), opacity: window01(t, t0, 30, 0.4, 0.3), h: 0.75 });
    const tags = [
      lab('ESP32', 'esp32', 6.5, 'touch pins T9–T0'), lab('TP4056', 'tp4056', 7.5, 'charger'), lab('INA219', 'ina219', 8.5, 'current'), lab('HT7833', 'ht7833', 9.5, '3.3 V LDO'),
      lab('18650 cell', 'cell18650', 10.5, 'in its holder'), lab('J1 · probe cable', 'J1', 11.5), lab('Perfboard on 4 standoffs', 'perfboard', 12.5, '', -0.03),
      { text: 'Gasket in its groove', tone: 'ok', pos: n.root.localToWorld(V(-50, 130, 58)), opacity: window01(t, 13.5, 30, 0.4, 0.3), h: 0.75 },
      { text: 'C-clips on the stake', tone: 'ok', pos: n.root.localToWorld(V(20, 30, -14)), opacity: window01(t, 18.5, 30, 0.4, 0.3), h: 0.75 },
      { text: field ? 'IP67 enclosure · Field' : 'Printed PETG box · Prototype', tone: field ? 'ok' : 'sense', pos: n.root.localToWorld(V(-60, 150, 30)), opacity: window01(t, 20, 30, 0.4, 0.3) },
    ];
    const ev = eventsAt([[2, 'Lid off', 'sense', 'N1'], [6.5, 'Power path: 18650 → TP4056 → HT7833', 'ok', 'build sheet'], [9, 'Probe J1 → ESP32 touch pins', 'sense', 'build sheet'], [11, 'I²C: SHT31 + INA219 on GPIO21/22', 'sense', 'build sheet']], t);
    return {
      cam, tags,
      hud: {
        phase: { text: field ? 'Field variant (ideal)' : 'Prototype (today)', tone: field ? 'ok' : 'sense' },
        kpis: [{ l: 'MCU', v: 'ESP32', u: '' }, { l: 'Cell', v: '18650', u: '' }, { l: 'Panel', v: '1', u: 'W' }, { l: 'LDO', v: 'HT7833', u: '' }],
        card: { kind: 'pins', rows: SPEC.pins.hero, power: '1 W panel → TP4056 → 18650 → HT7833 (3.3 V) → ESP32 · deep sleep between readings' },
        ...ev,
        caption: captionAt([[0, 'Inside node A1: the perfboard sits on four standoffs above the 18650 cell.'], [6, 'Power runs from the 1 W panel and 18650 through the TP4056 charger and an HT7833 regulator. The probe cable lands on J1 and goes to the ESP32 touch pins.'], [18, 'The lid gasket sits in its groove, the PG7 glands are at the bottom, and two C-clips hang the box on its stake.']], t),
      },
    };
  },
};
