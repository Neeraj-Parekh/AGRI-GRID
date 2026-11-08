// Field-diorama chapters: 1 The problem, 4 Why nothing corrodes, 5 How it senses, 6 Guards and reference,
// 7 Install it, 8 One AWD cycle, 12 When readings lie. Each frame(ctx, t) is a pure function of t.
import * as THREE from 'three';
import { shotAt, eventsAt, captionAt, tagWindow, window01, trapezoid, smooth01, clamp, lerp, V, fmt } from './kit.js';
import { awdState, topp, toppInverse, touchCount } from '../spec/physics.js';
import { fieldLineSet, TONE } from '../fx/scanfx.js';

const BANDS = ['E1', 'E2', 'E3', 'E4'];
const BAND_Z = { E1: -25, E2: -75, E3: -125, E4: -175 };
const prog = (t, a, b) => smooth01((t - a) / Math.max(b - a, 1e-4));
const wetOf = (th) => clamp((th - 0.28) / 0.2, 0, 1);

/** Reset everything a field chapter can touch, so each chapter is independent of the last. */
export function fieldBase(f, t) {
  const p = f.probe;
  p.setSection(false); p.setTranslucent(0); p.setExplodeParts({}); p.setWires(1); p.setCopper(1);
  for (const b of [...BANDS, 'EW']) { p.setWetness(b, 0); p.highlight(b, 0); }
  f.setProbeLift(0); f.setAirGap(0); f.setWater(50); f.setBubbles(false, t); f.setTime(t, 1);
  f.node.setLidOpen(0); f.node.setLed('#39e07a', 0.6);
  f.setResistive?.(false, 0);
  f.cable.visible = true; f.cable.geometry.setDrawRange(0, Infinity); f.cable.position.set(0, 0, 0);
}
function applyAwd(f, day) {
  const s = awdState(day);
  f.setWater(s.level); f.setProfile(s.thetaAt);
  for (const b of BANDS) f.probe.setWetness(b, wetOf(s.thetaAt(BAND_Z[b])));
  f.probe.setWetness('EW', s.level > 0 ? clamp(s.level / 50, 0.2, 1) : 0);
  return s;
}
const bandPos = (f, id, dx = 0) => { const p = f.bandWorld(id); p.x += dx; return p; };

/* ======================================================================= 1 · The problem */
export const chProblem = {
  id: 'problem', n: 1, world: 'field', dur: 26,
  title: 'The problem',
  honesty: 'Illustration · AWD rule from IRRI',
  frame(ctx, t) {
    const f = ctx.field, fx = ctx.fx; fieldBase(f, t);
    const day = 10 * trapezoid(t, 9.5, 18.5, 0.15);
    const s = applyAwd(f, day);
    f.setBubbles(t < 12, t);
    const cam = shotAt([
      [0, [1.25, 0.8, 2.1], [-0.25, 0.02, -0.4], 36], [8, [0.95, 0.55, 1.55], [-0.2, 0.0, -0.25], 34],
      [11.5, [0.2, 0.12, 1.0], [-0.12, -0.04, 0], 32], [19, [0.1, 0.03, 0.85], [-0.12, -0.06, 0], 32], [26, [0.13, 0.05, 0.92], [-0.11, -0.06, 0], 32]], t);
    // the −15 cm line across the section, and the rule tag
    const lineK = Math.max(0.35 * window01(t, 11, 26, 1, 0.5), window01(t, 18.5, 26, 0.6, 0.5));
    fx.links.set([{ key: 'awd-line', curve: new THREE.LineCurve3(V(-0.62, -0.15, 0.0008), V(-0.016, -0.15, 0.0008)), width: 0.0022, normal: V(0, 0, 1), opacity: lineK, phase: t * 0.6, tone: 'warn' }]);
    const tags = [
      { text: 'Flooded paddy', sub: 'soil microbes make methane without oxygen', tone: 'warn', pos: V(-0.55, 0.12, -0.35), opacity: tagWindow(t, 2, 6) },
      { text: 'AWD: let the water drop', sub: 'time-lapse · days', tone: 'ok', pos: V(-0.3, 0.06, 0.002), opacity: tagWindow(t, 11.5, 5.5) },
      { text: 'Re-irrigate at −15 cm', sub: 'the IRRI AWD rule', tone: 'warn', pos: V(-0.42, -0.15, 0.002), opacity: tagWindow(t, 19.2, 6.3) },
    ];
    const ev = eventsAt([[1, 'Flooded: 5 cm standing water', 'warn', 'scene'], [9.6, 'AWD: field allowed to dry', 'ok', 'scene'], [13.4, 'Surface water gone', 'sense', 'gauge'], [18.4, 'Water table at −15 cm', 'warn', 'gauge'], [19.6, 'Rule: re-flood to 5 cm', 'ok', 'IRRI']], t);
    return {
      cam, tags,
      hud: {
        phase: { text: t < 9.5 ? 'Continuous flooding' : t < 18.5 ? 'Alternate wetting and drying' : 'AWD rule', tone: t < 9.5 ? 'warn' : t < 18.5 ? 'sense' : 'ok' },
        kpis: [{ l: 'Water level', v: fmt(s.level, 0), u: 'mm', tone: s.level < -120 ? 'warn' : 'water' }, { l: 'Day', v: fmt(day, 1), u: '' }, { l: 'Trigger', v: '−150', u: 'mm', tone: 'warn' }],
        card: { kind: 'level', day, level: s.level, days: 10 },
        ...ev,
        caption: captionAt([[0, 'Flooded rice fields emit methane: microbes in waterlogged soil produce it when water cuts off the oxygen.'], [9.5, 'Alternate wetting and drying (AWD) lets the water drop below the surface, then floods the field again.'], [19, 'The AWD rule from IRRI: re-irrigate when the water is 15 cm below the soil surface. That is the depth the probe has to see.']], t),
      },
    };
  },
};

/* ======================================================================= 4 · Why nothing corrodes */
export const chCorrode = {
  id: 'corrode', n: 4, world: 'field', dur: 22,
  title: 'Why nothing corrodes',
  honesty: 'Design render · probe in build',
  frame(ctx, t) {
    const f = ctx.field, fx = ctx.fx; fieldBase(f, t);
    f.probe.setSection(true); f.setWater(-260); f.setProfile((z) => (z < -200 ? 0.48 : 0.40));
    for (const b of BANDS) f.probe.setWetness(b, 0.6);
    const corr = prog(t, 9, 17);
    f.setResistive?.(true, corr);
    const cam = shotAt([[0, [0.03, -0.06, 0.22], [-0.01, -0.075, 0], 30], [2.5, [0.0, -0.072, 0.11], [-0.012, -0.075, 0], 28], [8, [0.0, -0.072, 0.11], [-0.012, -0.075, 0], 28], [10, [-0.24, 0.03, 0.28], [-0.3, -0.005, 0], 30], [17, [-0.25, 0.02, 0.25], [-0.3, -0.008, 0], 30], [22, [-0.12, 0.02, 0.4], [-0.16, -0.04, 0], 32]], t);
    // dimension line across the wall (inner wall x = −10.9 mm → outer x = −12.5 mm) at y = −70 mm
    const dk = window01(t, 2.5, 9, 0.6, 0.4);
    const y = -0.0695, z = 0.0007;
    fx.links.set([
      { key: 'dim', curve: new THREE.LineCurve3(V(-0.0109, y, z), V(-0.0125, y, z)), width: 0.00028, normal: V(0, 0, 1), opacity: dk, tone: 'sense' },
      { key: 'dimA', curve: new THREE.LineCurve3(V(-0.0109, y - 0.002, z), V(-0.0109, y + 0.002, z)), width: 0.00012, normal: V(0, 0, 1), opacity: dk, tone: 'sense' },
      { key: 'dimB', curve: new THREE.LineCurve3(V(-0.0125, y - 0.002, z), V(-0.0125, y + 0.002, z)), width: 0.00012, normal: V(0, 0, 1), opacity: dk, tone: 'sense' },
    ]);
    if (corr > 0.15) fx.marker.set({ pos: V(-0.3, -0.018, 0.0022), r: 0.011, opacity: window01(t, 12, 22, 0.6, 0.6), tone: 'alert', phase: t });
    const tags = [
      { text: '1.6 mm PETG wall', sub: 'the insulator: copper never touches soil', tone: 'sense', pos: V(-0.0128, -0.064, 0.001), opacity: dk, anchorX: 1.04 },
      { text: corr < 0.2 ? 'Two-prong resistive sensor · week 0' : `Week ${Math.max(1, Math.round(corr * 8))}: traces corroding`, sub: 'bare metal + current in wet soil', tone: corr < 0.2 ? 'sense' : 'alert', pos: V(-0.285, 0.035, 0.003), opacity: window01(t, 9.5, 22, 0.5, 0.5) },
    ];
    const ev = eventsAt([[3, 'Copper sits inside the tube', 'sense', 'design'], [10, 'Resistive sensor: bare traces in soil', 'warn', 'comparison'], [15.5, 'Corrosion changes the reading', 'alert', 'comparison']], t);
    return {
      cam, tags,
      hud: {
        phase: { text: t < 9 ? 'Sealed electrodes' : 'Exposed electrodes, for contrast', tone: t < 9 ? 'ok' : 'alert' },
        kpis: [{ l: 'Wall', v: '1.6', u: 'mm', tone: 'sense' }, { l: 'Copper in soil', v: '0', u: 'mm²', tone: 'ok' }, { l: 'Resistive', v: `wk ${Math.round(corr * 8)}`, u: '', tone: corr > 0.4 ? 'alert' : 'warn' }],
        card: { kind: 'note', title: 'Wall thickness matters', rows: [['Wall', '1.6 ± 0.1 mm PETG'], ['Role', 'insulator and dielectric'], ['Sensitivity', 'falls as the wall gets thicker'], ['Tolerance', 'print with 4 perimeters, check with calipers']] },
        ...ev,
        caption: captionAt([[0, 'The copper bands sit inside the tube. The 1.6 mm PETG wall is the insulator, so no metal ever touches the wet soil.'], [9, 'A cheap two-prong resistive sensor puts bare metal in the soil and passes current through it. Over weeks the traces corrode and the reading drifts.']], t),
      },
    };
  },
};

/* ======================================================================= 5 · How it senses */
export const chSense = {
  id: 'sense', n: 5, world: 'field', dur: 30,
  title: 'How it senses',
  honesty: 'Illustration of a ~1 MHz field · Literature · Topp 1980',
  frame(ctx, t) {
    const f = ctx.field, fx = ctx.fx; fieldBase(f, t);
    f.probe.setSection(true); f.setWater(-240);
    // θ ramps up during the zoom act (15–25 s): dry → wet
    const theta = lerp(0.14, 0.45, prog(t, 15.5, 24.5));
    f.setProfile(() => theta);
    for (const b of BANDS) f.probe.setWetness(b, wetOf(theta));
    const eps = toppInverse(theta);
    // lock + sweep (E1 → E4)
    const lockK = window01(t, 0.3, 3.0, 0.8, 0.3);
    if (lockK > 0) fx.lock.set({ pos: bandPos(f, 'E1', -0.0006), camera: ctx.camera, size: [0.0045, 0.0062], k: prog(t, 0.3, 1.1), opacity: lockK, color: t > 2 ? TONE.ok : TONE.sense });
    const sweepK = window01(t, 2.6, 7.2, 0.3, 0.4); const front = prog(t, 2.8, 6.9);
    fx.sweep.set({ centre: V(-0.0115, -0.1, 0.0009), w: 0.008, h: 0.2, front, opacity: sweepK });
    BANDS.forEach((b, i) => { const yb = (BAND_Z[b] + 0) / 1000; const fy = -front * 0.2; f.probe.highlight(b, sweepK > 0.05 && Math.abs(fy - yb) < 0.012 ? 1 : 0); void i; });
    // fringing field from E2 through the wall into the soil, closing on its guards
    const flK = window01(t, 7.2, 30, 0.8, 0.6);
    fx.lines.build('E2-guard', [fieldLineSet({ x0: -0.0109, yc: -0.075, h: 0.01, guardGap: 0.004, reach: 0.032, lines: 6, guards: true })]);
    fx.lines.set({ opacity: flK, phase: t * 0.9, grow: prog(t, 7.2, 9.0), tone: theta > 0.35 ? 'water' : 'sense' });
    fx.rings[0].set({ phase: t, centre: V(-0.0125, -0.075, 0.0006), normal: V(0, 0, 1), maxR: 0.032, strength: 0.3 * window01(t, 9, 30, 0.8, 0.6) * (0.4 + theta), period: 2.6 });
    const cam = shotAt([[0, [0.05, -0.05, 0.36], [-0.005, -0.1, 0], 30], [3, [0.01, -0.085, 0.27], [-0.006, -0.1, 0], 28], [7.5, [-0.008, -0.074, 0.19], [-0.018, -0.075, 0], 30], [15, [-0.01, -0.078, 0.2], [-0.02, -0.078, 0], 30], [24.5, [-0.008, -0.08, 0.22], [-0.018, -0.08, 0], 30], [30, [-0.005, -0.085, 0.25], [-0.016, -0.085, 0], 30]], t);
    const tags = [
      { text: 'Fringing field', sub: 'through the wall into a few mm of soil', tone: 'sense', pos: V(-0.05, -0.06, 0.001), opacity: window01(t, 9, 15.5, 0.5, 0.5) },
      { text: `θ ${Math.round(theta * 100)} % · ε ${fmt(eps, 1)}`, sub: 'more water → more capacitance', tone: theta > 0.35 ? 'ok' : 'sense', pos: V(-0.05, -0.095, 0.001), opacity: window01(t, 16, 30, 0.5, 0.5) },
    ];
    const ev = eventsAt([[2.9, 'E1 read', 'sense', 'A1'], [3.9, 'E2 read', 'sense', 'A1'], [4.9, 'E3 read', 'sense', 'A1'], [5.9, 'E4 read', 'sense', 'A1'], [16, 'Soil wetting: ε rising', 'sense', 'illustration'], [25, `E2 θ ${Math.round(0.45 * 100)} %`, 'ok', 'Topp']], t);
    return {
      cam, tags,
      hud: {
        phase: { text: t < 7.2 ? 'Reading the bands' : t < 15.5 ? 'Fringing field' : 'Water raises ε', tone: 'sense' },
        kpis: [{ l: 'ε (apparent)', v: fmt(eps, 1), u: '' }, { l: 'θ (Topp)', v: Math.round(theta * 100), u: '%', tone: 'water' }, { l: 'E2 count', v: touchCount(theta, 1), u: '', tone: 'sense' }],
        card: { kind: 'topp', eps, theta },
        overlay: t > 15 ? { kind: 'zoom', theta, k: window01(t, 15, 30, 0.6, 0.6) } : null,
        ...ev,
        caption: captionAt([[0, 'Each copper band and its guards form a capacitor. The ESP32 touch peripheral measures it band by band.'], [7.2, 'The electric field fringes out through the PETG wall into the soil next to the tube.'], [15.5, 'Water has ε ≈ 80; air and soil minerals only 3–5. As the soil wets, capacitance rises and the touch count falls. Topp (1980) turns ε into water content.']], t),
      },
    };
  },
};

/* ======================================================================= 6 · Guard rings and reference */
export const chGuards = {
  id: 'guards', n: 6, world: 'field', dur: 26,
  title: 'Guard rings and reference',
  honesty: 'Illustration · drift values simulated',
  frame(ctx, t) {
    const f = ctx.field, fx = ctx.fx; fieldBase(f, t);
    f.probe.setSection(true); f.setWater(-240); f.setProfile((z) => (z > -50 ? 0.33 : 0.40));
    for (const b of BANDS) f.probe.setWetness(b, 0.5);
    const noG = window01(t, 0.5, 8.2, 0.6, 0.5), withG = window01(t, 8.4, 16.5, 0.6, 0.5);
    if (t < 8.3) { fx.lines.build('E2-noguard', [fieldLineSet({ x0: -0.0109, yc: -0.075, h: 0.01, reach: 0.04, lines: 6, guards: false, spreadTo: 0.05 })]); fx.lines.set({ opacity: noG, phase: t, grow: prog(t, 0.5, 2.2), tone: 'warn' }); }
    else { fx.lines.build('E2-guard', [fieldLineSet({ x0: -0.0109, yc: -0.075, h: 0.01, guardGap: 0.004, reach: 0.032, lines: 6, guards: true })]); fx.lines.set({ opacity: withG, phase: t, grow: prog(t, 8.4, 10), tone: 'sense' }); }
    // depth slices on the soil face (16–19 s)
    const sk = window01(t, 15.8, 19.6, 0.6, 0.5);
    const slices = BANDS.map((b, i) => ({ key: `slice${i}`, curve: new THREE.LineCurve3(V(-0.0135, BAND_Z[b] / 1000, 0.0006), V(-0.075, BAND_Z[b] / 1000, 0.0006)), width: 0.046, normal: V(0, 0, 1), opacity: sk * 0.35, tone: i % 2 ? 'water' : 'sense' }));
    fx.links.set(slices);
    // reference beat (19–26): EREF in the cap, DS18B20 at −10 cm
    const refK = window01(t, 19.5, 26, 0.6, 0.4);
    const eref = f.probe.anchor('eref'); const ds = f.probe.anchor('ds');
    const erefW = V(eref.x / 1000, eref.y / 1000, eref.z / 1000 + 0.004), dsW = V(ds.x / 1000, ds.y / 1000, 0.004);
    if (t > 19.5 && t < 22.6) fx.lock.set({ pos: erefW, camera: ctx.camera, size: [0.007, 0.007], k: prog(t, 19.6, 20.4), opacity: refK, color: TONE.sense });
    if (t > 22.6) fx.lock.set({ pos: dsW, camera: ctx.camera, size: [0.006, 0.028], k: prog(t, 22.7, 23.5), opacity: refK, color: TONE.sense });
    const cam = shotAt([[0, [-0.02, -0.08, 0.2], [-0.035, -0.08, 0], 30], [8, [-0.02, -0.08, 0.2], [-0.035, -0.08, 0], 30], [15.5, [-0.025, -0.1, 0.27], [-0.04, -0.1, 0], 30], [19.4, [-0.025, -0.1, 0.27], [-0.04, -0.1, 0], 30], [21, [0.02, 0.15, 0.13], [0.0, 0.145, 0], 30], [22.6, [0.02, 0.15, 0.13], [0.0, 0.145, 0], 30], [24.2, [0.03, -0.09, 0.17], [0.006, -0.1, 0], 30], [26, [0.03, -0.09, 0.18], [0.006, -0.1, 0], 30]], t);
    const tags = [
      { text: 'Without guards', sub: 'E2 also sees the soil of E1 and E3', tone: 'warn', pos: V(-0.06, -0.035, 0.001), opacity: window01(t, 2, 8.2, 0.4, 0.4) },
      { text: 'With guards', sub: 'each band reads its own 5 cm slice', tone: 'ok', pos: V(-0.06, -0.05, 0.001), opacity: window01(t, 10, 16, 0.4, 0.4) },
      ...['0–5', '5–10', '10–15', '15–20'].map((d, i) => ({ text: `${d} cm`, tone: 'sense', pos: V(-0.078, BAND_Z[BANDS[i]] / 1000, 0.001), opacity: sk, h: 0.6 })),
      { text: 'EREF · sealed reference', sub: 'tracks electronics drift', tone: 'sense', pos: V(erefW.x - 0.012, erefW.y, erefW.z), opacity: window01(t, 20.2, 22.6, 0.4, 0.3), anchorX: 1.04 },
      { text: 'DS18B20 · soil °C', sub: 'temperature correction', tone: 'sense', pos: V(dsW.x + 0.008, dsW.y, dsW.z), opacity: window01(t, 23.3, 26, 0.4, 0.3) },
    ];
    const ev = eventsAt([[1, 'Fields overlap without guards', 'warn', 'illustration'], [8.6, 'Guards driven to ground', 'ok', 'design'], [16, 'Four separate depth slices', 'ok', 'design'], [20, 'EREF: drift reference', 'sense', 'cap'], [23, 'DS18B20: soil temperature', 'sense', 'half B']], t);
    return {
      cam, tags,
      hud: {
        phase: { text: t < 8.4 ? 'Overlap without guards' : t < 19.5 ? 'Guarded bands' : 'Drift reference', tone: t < 8.4 ? 'warn' : 'ok' },
        kpis: [{ l: 'Band height', v: '10', u: 'mm' }, { l: 'Guard', v: '4', u: 'mm' }, { l: 'Slice', v: '5', u: 'cm', tone: 'ok' }],
        card: t < 19.5 ? { kind: 'isolation', guards: t > 8.4 } : { kind: 'drift', k: prog(t, 19.5, 25.5) },
        ...ev,
        caption: captionAt([[0, 'Without guard rings, each band’s field spreads into its neighbours’ soil, and the depth reading blurs.'], [8.4, 'Grounded guard rings either side of each band close the field locally, so each band reads its own 5 cm slice.'], [19.5, 'EREF, a sealed pad in the cap, sees no soil: it tracks electronics and lead drift. The DS18B20 gives soil temperature for correction.']], t),
      },
    };
  },
};

/* ======================================================================= 7 · Install it */
export const chInstall = {
  id: 'install', n: 7, world: 'field', dur: 28,
  title: 'Install it',
  honesty: 'Design render · install guide',
  frame(ctx, t) {
    const f = ctx.field, fx = ctx.fx; fieldBase(f, t);
    f.setWater(-240); f.setProfile((z) => (z < -200 ? 0.48 : 0.40));
    const lift = 0.25 * (1 - trapezoid(t, 5.2, 9.6, 0.25));
    f.setProbeLift(lift);
    f.probe.setTranslucent(lift > 0.002 ? 1 : 0);
    const sectionOn = t >= 9.6 && t < 17;
    f.probe.setSection(sectionOn);
    // air gap 10–13.5 s, then firmed
    const gap = window01(t, 10.4, 15.6, 0.8, 1.4);
    f.setAirGap(gap);
    const theta = 0.40 - 0.16 * gap;
    for (const b of BANDS) f.probe.setWetness(b, wetOf(theta));
    // cable draws in from the probe to the box (22–25 s)
    const ck = t < 22 ? 0 : prog(t, 22, 25);
    f.cable.visible = ck > 0.001; const n = f.cable.geometry.index.count; f.cable.geometry.setDrawRange(0, Math.floor((n / 6) * ck) * 6);
    if (t > 25) { const k = (t - 25.2) / 1.4; fx.packets.set([{ curve: f.cableCurve, k, tone: 'sense', opacity: k > 0 && k < 1 ? 1 : 0, r: 0.004 }]); }
    f.node.setLed(t > 26.6 && t < 27.4 ? '#33c6e0' : '#39e07a', t > 26.6 && t < 27.4 ? 9 : 0.6);
    if (t > 5.4 && t < 10) fx.lock.set({ pos: V(0.0, 0.0, 0.016), camera: ctx.camera, size: [0.018, 0.006], k: prog(t, 8.6, 9.6), opacity: window01(t, 8.4, 10.2, 0.4, 0.3), color: t > 9.5 ? TONE.ok : TONE.sense });
    if (gap > 0.02 || (t > 13 && t < 17)) fx.marker.set({ pos: V(-0.0135, -0.085, 0.0012), r: 0.012, opacity: window01(t, 10.6, 17, 0.4, 0.5), tone: t < 13.6 ? 'alert' : 'ok', phase: t });
    if (t > 17.5 && t < 22.5) fx.lock.set({ pos: V(-0.125, 0.0, -0.02), camera: ctx.camera, size: [0.022, 0.006], k: prog(t, 18, 18.8), opacity: window01(t, 17.6, 22.4, 0.4, 0.4), color: TONE.ok });
    const cam = shotAt([[0, [0.3, 0.14, 1.15], [0.0, 0.07, 0], 32], [5, [0.3, 0.14, 1.12], [0.0, 0.07, 0], 32], [9.6, [0.1, 0.03, 0.42], [0.0, -0.04, 0], 30], [10.4, [0.0, -0.07, 0.2], [-0.015, -0.085, 0], 30], [16.6, [0.0, -0.07, 0.2], [-0.015, -0.085, 0], 30], [18.2, [-0.09, 0.05, 0.3], [-0.12, 0.0, -0.02], 30], [21.8, [-0.09, 0.05, 0.3], [-0.12, 0.0, -0.02], 30], [24, [0.4, 0.38, 0.92], [0.14, 0.25, 0], 32], [28, [0.42, 0.39, 0.96], [0.15, 0.25, 0], 32]], t);
    const tags = [
      { text: 'Auger a 25 mm hole', sub: '230 mm deep, vertical', tone: 'sense', pos: V(0.03, -0.09, 0.002), opacity: window01(t, 0.6, 5.2, 0.4, 0.4) },
      { text: 'Probe lowered into the hole', tone: 'sense', pos: V(0.03, 0.3, 0.0), opacity: window01(t, 1.2, 8.6, 0.4, 0.4) },
      { text: 'Insert to the soil-line groove', sub: 'groove level with the surface', tone: 'ok', pos: V(0.025, 0.012, 0.016), opacity: window01(t, 8.8, 10.4, 0.3, 0.3) },
      { text: t < 13.6 ? 'Air gap: reading falls' : 'Firmed: contact restored', sub: t < 13.6 ? 'each band sees only a few mm' : 'press soil back around the tube', tone: t < 13.6 ? 'alert' : 'ok', pos: V(-0.03, -0.06, 0.002), opacity: window01(t, 11, 16.8, 0.4, 0.4), anchorX: 1.04 },
      { text: 'Zero on the gauge = soil surface', tone: 'ok', pos: V(-0.105, 0.012, -0.018), opacity: window01(t, 18.6, 22.2, 0.4, 0.4) },
      { text: 'Cable to node A1', sub: 'drip loop below the box gland', tone: 'sense', pos: V(0.2, 0.25, 0.02), opacity: window01(t, 24.6, 28, 0.4, 0.4) },
    ];
    const steps = ['Auger a 25 × 230 mm hole', 'Insert to the soil-line groove', 'Firm the soil: no air gap', 'Zero against the staff gauge', 'Cable to the node, drip loop'];
    const done = [t > 5, t > 9.6, t > 16, t > 22, t > 26.6];
    const ev = eventsAt([[1, 'Hole: 25 mm, 230 mm deep', 'sense', 'install'], [9.6, 'Probe seated at the groove', 'ok', 'install'], [11.2, 'E2 θ dropped: air gap', 'alert', 'A1'], [14.4, 'Soil firmed: reading back', 'ok', 'A1'], [19, 'Gauge zero = surface', 'ok', 'install'], [26.6, 'First packet from A1', 'sense', 'A1']], t);
    return {
      cam, tags,
      hud: {
        phase: { text: steps[Math.min(4, done.filter(Boolean).length)] || 'Installed', tone: gap > 0.2 ? 'alert' : 'sense' },
        kpis: [{ l: 'E2 θ', v: Math.round(theta * 100), u: '%', tone: gap > 0.2 ? 'alert' : 'water' }, { l: 'Depth', v: '230', u: 'mm' }, { l: 'Steps', v: `${done.filter(Boolean).length}/5`, u: '', tone: 'ok' }],
        card: { kind: 'steps', title: 'Install checklist', steps, done },
        ...ev,
        caption: captionAt([[0, 'Auger a vertical 25 mm hole, 230 mm deep, next to the staff gauge.'], [5.2, 'Push the probe in until the soil-line groove is level with the surface.'], [10.4, 'An air gap is the main error for any capacitance probe: the reading falls. Firm the soil back around the tube.'], [17.4, 'Check the level: the gauge zero and the groove both sit at the soil surface.'], [22, 'Run the cable to node A1 with a drip loop under the box gland.']], t),
      },
    };
  },
};

/* ======================================================================= 8 · One AWD cycle */
export const chCycle = {
  id: 'cycle', n: 8, world: 'field', dur: 34,
  title: 'One AWD cycle (time-lapse)',
  honesty: 'Simulated data · illustrative drying rates',
  frame(ctx, t) {
    const f = ctx.field, fx = ctx.fx; fieldBase(f, t);
    f.probe.setSection(true);
    const day = 10.4 * trapezoid(t, 2.5, 28, 0.08);
    const s = applyAwd(f, day);
    const th = Object.fromEntries(BANDS.map((b) => [b, s.thetaAt(BAND_Z[b])]));
    const trig = s.level <= -150;
    const tTrig = 2.5 + (28 - 2.5) * 0.9615; // approx. when day 10 is reached
    // sampling blink every 2.5 s, packet up the cable
    const ph = (t % 2.5) / 2.5; const blink = ph < 0.08;
    f.node.setLed(trig ? '#e0614a' : s.level < -100 ? '#e3a22c' : '#39e07a', blink || (trig && Math.floor(t * 3) % 2 === 0) ? 9 : 0.8);
    fx.packets.set([{ curve: f.cableCurve, k: (t % 2.5) / 0.9, tone: trig ? 'alert' : 'sense', opacity: (t % 2.5) < 0.9 && t > 3 ? 1 : 0, r: 0.0035 }]);
    // EW sweep while ponded, band sweep while drying
    if (s.level > 0) fx.sweep.set({ centre: V(-0.0112, 0.045, 0.0009), w: 0.007, h: 0.11, front: (t % 2.5) / 2.5, opacity: 0.8 });
    else fx.sweep.set({ centre: V(-0.0112, -0.1, 0.0009), w: 0.007, h: 0.2, front: (t % 2.5) / 2.5, opacity: 0.6 * window01(t, 12, 34, 0.5, 0.5) });
    if (t > tTrig - 0.2) {
      fx.lock.set({ pos: V(-0.012, -0.15, 0.003), camera: ctx.camera, size: [0.012, 0.007], k: prog(t, tTrig, tTrig + 0.8), opacity: 1, color: TONE.alert });
      fx.marker.set({ pos: V(-0.04, -0.15, 0.0012), r: 0.014, opacity: window01(t, tTrig, 34, 0.4, 0.4), tone: 'alert', phase: t });
    }
    fx.links.set([{ key: 'awd-line8', curve: new THREE.LineCurve3(V(-0.6, -0.15, 0.0008), V(-0.016, -0.15, 0.0008)), width: 0.0018, normal: V(0, 0, 1), opacity: 0.55, phase: t * 0.6, tone: trig ? 'alert' : 'warn' }]);
    const nb = f.nodeLayout;
    const cam = shotAt([[0, [0.55, 0.35, 1.2], [0.05, 0.05, 0], 34], [3, [0.3, 0.12, 0.78], [0.0, -0.02, 0], 32], [12, [0.12, -0.03, 0.66], [-0.02, -0.085, 0], 30], [26, [0.1, -0.05, 0.64], [-0.02, -0.095, 0], 30], [29.5, [0.5, 0.38, 1.1], [0.12, 0.15, 0], 33], [34, [0.52, 0.39, 1.12], [0.13, 0.16, 0], 33]], t);
    const tags = [
      { text: `EW · water +${Math.max(0, Math.round(s.level))} mm`, sub: 'water-level strip', tone: 'water', pos: V(0.02, 0.05, 0.016), opacity: window01(t, 3.5, 12, 0.4, 0.4) },
      ...BANDS.map((b, i) => ({ text: `${b} · θ ${Math.round(th[b] * 100)} %`, tone: th[b] < 0.4 ? 'warn' : 'sense', pos: V(0.02, BAND_Z[b] / 1000, 0.016), opacity: window01(t, 12.5 + i * 0.3, 29, 0.4, 0.4), h: 0.75 })),
      { text: 'IRRIGATE NOW', sub: 'water table at −15 cm', tone: 'alert', pos: V(nb.x / 1000 + 0.075, (nb.bottomY + 90) / 1000, 0.05), opacity: window01(t, tTrig + 0.6, 34, 0.4, 0.3) },
    ];
    const ev = eventsAt([[3, 'EW: water +50 mm', 'water', 'A1'], [9.5, 'Surface water dropping', 'sense', 'A1'], [12.3, 'Surface water gone', 'sense', 'A1'], [16.5, 'E1 drying', 'warn', 'A1'], [20.5, 'E2 drying', 'warn', 'A1'], [24.5, 'E3 drying', 'warn', 'A1'], [tTrig, 'Threshold crossed at −15 cm', 'alert', 'A1'], [tTrig + 0.8, 'Node A1 flags IRRIGATE', 'alert', 'A1']], t);
    return {
      cam, tags,
      hud: {
        phase: { text: trig ? 'IRRIGATE' : s.level > 0 ? 'Ponded' : 'Drying', tone: trig ? 'alert' : s.level > 0 ? 'water' : 'sense' },
        kpis: [{ l: 'Day', v: fmt(day, 1), u: '' }, { l: 'Water', v: fmt(s.level, 0), u: 'mm', tone: trig ? 'alert' : 'water' }, { l: 'E3 θ', v: Math.round(th.E3 * 100), u: '%', tone: th.E3 < 0.4 ? 'warn' : 'sense' }],
        card: { kind: 'bands', theta: th, level: s.level, day },
        map: { nodes: { A1: trig ? 'alert' : s.level < -100 ? 'warn' : 'ok' } },
        ...ev,
        caption: captionAt([[0, 'One AWD cycle, about ten days in thirty seconds.'], [3, 'While the field is ponded, the EW strip tracks the water level from +50 mm down to the surface.'], [12.3, 'Then the bands dry in turn, top to bottom: E1, E2, E3, E4.'], [tTrig - 0.5, 'At −15 cm the node flags IRRIGATE. The thresholds and drying rates here are illustrative until calibrated in your soil.']], t),
      },
    };
  },
};

/* ======================================================================= 12 · When readings lie */
const FAIL = [
  { k: 'Air gap', s: 'reading falls, one band', fix: 'firm the soil around the tube' },
  { k: 'Dry clay shrinks', s: 'all bands fall together', fix: 're-wet and re-firm; read trends' },
  { k: 'Saline soil', s: 'reads too wet', fix: 'calibrate in your soil; FDC1004 upgrade' },
  { k: 'Temperature drift', s: 'daily wave in counts', fix: 'EREF + DS18B20 correction' },
  { k: 'Seam leak', s: 'water inside: stuck wet', fix: 'epoxy seam, leak test in a bucket' },
  { k: 'Cable moved', s: 'single spike', fix: 'flag, resample 3×, recover' },
];
export const chLies = {
  id: 'lies', n: 12, world: 'field', dur: 36,
  title: 'When readings lie',
  honesty: 'Illustration · failure modes and fixes',
  frame(ctx, t) {
    const f = ctx.field, fx = ctx.fx; fieldBase(f, t);
    f.probe.setSection(true); f.setWater(-240); f.setProfile(() => 0.38);
    for (const b of BANDS) f.probe.setWetness(b, 0.45);
    const i = clamp(Math.floor(t / 6), 0, 5), lt = t - i * 6;
    const on = window01(lt, 0.2, 6, 0.5, 0.5);
    let cam = shotAt([[0, [0.0, -0.07, 0.24], [-0.02, -0.09, 0], 30]], 0);
    const tags = [];
    if (i === 0) { f.setAirGap(on); fx.marker.set({ pos: V(-0.0135, -0.085, 0.0012), r: 0.012, opacity: on, tone: 'alert', phase: t }); }
    if (i === 1) { f.setAirGap(on, -205, -5); f.setProfile((z) => (z < -60 ? 0.48 : 0.26)); fx.marker.set({ pos: V(-0.0135, -0.1, 0.0012), r: 0.02, opacity: on, tone: 'warn', phase: t }); cam = shotAt([[0, [0.0, -0.08, 0.33], [-0.02, -0.1, 0], 32]], 0); }
    if (i === 2) { fx.marker.set({ pos: V(-0.035, -0.08, 0.0012), r: 0.03, opacity: on, tone: 'warn', phase: t }); }
    if (i === 3) { const ds = f.probe.anchor('ds'); fx.lock.set({ pos: V(ds.x / 1000, ds.y / 1000, 0.004), camera: ctx.camera, size: [0.006, 0.028], k: prog(lt, 0.3, 1.1), opacity: on, color: TONE.sense }); cam = shotAt([[0, [0.03, -0.09, 0.18], [0.006, -0.1, 0], 30]], 0); }
    if (i === 4) { fx.marker.set({ pos: V(0.0, -0.12, -0.0105), normal: V(0, 0, 1), r: 0.009, opacity: on, tone: 'alert', phase: t }); f.probe.setWetness('E3', 1); cam = shotAt([[0, [0.012, -0.11, 0.12], [0.0, -0.12, -0.006], 30]], 0); }
    if (i === 5) { const w = lt > 0.8 && lt < 2.6 ? Math.sin(lt * 18) * 0.004 * (1 - (lt - 0.8) / 1.8) : 0; f.cable.position.set(w, 0, w * 0.5); cam = shotAt([[0, [0.32, 0.3, 0.62], [0.12, 0.2, 0], 32]], 0); f.node.setLed(lt > 1 && lt < 3.4 ? '#e3a22c' : '#39e07a', lt > 1 && lt < 3.4 ? 7 : 0.8); }
    tags.push({ text: FAIL[i].k, sub: `${FAIL[i].s} → ${FAIL[i].fix}`, tone: i === 3 || i === 5 ? 'warn' : 'alert', pos: i === 5 ? V(0.2, 0.25, 0.02) : V(-0.05, -0.05, 0.002), opacity: window01(lt, 0.8, 5.6, 0.4, 0.4) });
    const ev = eventsAt(FAIL.map((q, j) => [j * 6 + 0.8, `${q.k}: ${q.s}`, j === 3 || j === 5 ? 'warn' : 'alert', 'A1']).concat([[33.4, 'Cable spike: 3 resamples, recovered', 'ok', 'A1']]), t);
    return {
      cam, tags,
      hud: {
        phase: { text: FAIL[i].k, tone: 'warn' },
        kpis: [{ l: 'Failure', v: `${i + 1}/6`, u: '' }, { l: 'Fix', v: 'known', u: '', tone: 'ok' }],
        card: { kind: 'failures', rows: FAIL, active: i, lt },
        ...ev,
        caption: FAIL[i].k + ': ' + ['an air gap beside the tube makes one band read low.', 'clay shrinks away from the tube as it dries, so every band reads low together.', 'salt makes a ~1 MHz reading look wetter than it is. Calibrate in your own soil, or upgrade to an FDC1004 front end.', 'temperature moves the counts through the day; EREF and the DS18B20 correct it.', 'water inside the tube makes a band stick at wet. Seal the seam with epoxy and leak-test every probe.', 'a moved cable gives a single spike. The node flags it, takes three more samples and recovers.'][i],
      },
    };
  },
};
