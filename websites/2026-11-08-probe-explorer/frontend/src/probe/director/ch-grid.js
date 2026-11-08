// Farm-scale and screen chapters: 9 The grid talks, 10 Ground meets space, 15 The farm grid,
// 16 Ground + space (real data), 17 Backend + farmer (split screen), 18 Impact and scale.
import * as THREE from 'three';
import { shotAt, eventsAt, captionAt, tagWindow, window01, trapezoid, smooth01, clamp, lerp, V, fmt, orbit } from './kit.js';
import { smsText } from '../../lib/advice.js';
import { TONE } from '../fx/scanfx.js';

const prog = (t, a, b) => smooth01((t - a) / Math.max(b - a, 1e-4));
const IDS = ['A1', 'B2', 'C3', 'D4'];
const PLOT_OF = { A1: 'A', B2: 'B', C3: 'C', D4: 'D' };

const curveCache = new Map();
function packetCurve(farm, id) {
  const key = `${farm.variant}:${id}`;
  if (curveCache.has(key)) return curveCache.get(key);
  const a = farm.nodePoint(id), b = farm.gatewayPoint();
  const mid = a.clone().lerp(b, 0.5); mid.y += a.distanceTo(b) * 0.22 + 0.5;
  const c = new THREE.QuadraticBezierCurve3(a, mid, b); c.arcLengthDivisions = 60;
  curveCache.set(key, c); return c;
}
/** Every node sends every `period` s, staggered; returns packets + link list + which nodes are transmitting. */
function traffic(farm, t, { period = 2.6, fly = 1.1, tone = () => 'sense', from = 0.6 } = {}) {
  const packets = [], links = [], tx = {};
  IDS.forEach((id, i) => {
    const c = packetCurve(farm, id);
    const local = t - from - i * 0.55; const k = local >= 0 ? (local % period) / fly : -1;
    packets.push({ curve: c, k, tone: tone(id), opacity: k >= 0 && k <= 1 ? 1 : 0, r: 0.04 });
    links.push({ key: `link-${farm.variant}-${id}`, curve: c, width: 0.035, normal: V(0, 1, 0), opacity: 0.35, phase: t * 1.5, tone: tone(id) });
    tx[id] = local >= 0 && (local % period) < 0.25;
  });
  const gwTx = packets.some((p) => p.k > 0.92 && p.k <= 1);
  return { packets, links, tx, gwTx };
}
function farmBase(farm, ctx, t) {
  farm.setVariant(ctx.settings.variant === 'field' ? 'field' : 'prototype');
  for (const p of ['A', 'B', 'C', 'D']) farm.setWater(p, 30);
  farm.setPump(false); farm.setSatellite(0, false); farm.setTime(t);
  farm.setGatewayLeds(0);
}
const nodeTag = (farm, id, text, sub, tone, opacity) => ({ text, sub, tone, pos: farm.nodePoint(id).add(V(0, 0.22, 0)), opacity });

/* ======================================================================= 9 · The grid talks */
export const chGrid = {
  id: 'grid', n: 9, world: 'farm', dur: 30, variant: true,
  title: 'The grid talks',
  honesty: 'Simulated data · prototype network',
  frame(ctx, t) {
    const farm = ctx.farm, fx = ctx.fx; farmBase(farm, ctx, t);
    const bLevel = lerp(40, -70, prog(t, 0, 15));
    const aLevel = t < 21.5 ? -150 : lerp(-150, 50, trapezoid(t, 21.5, 29.5, 0.2));
    farm.setWater('A', aLevel); farm.setWater('B', bLevel); farm.setWater('C', 25); farm.setWater('D', 15);
    const pump = t > 21.2;
    farm.setPump(pump);
    const tone = (id) => (id === 'B2' && t > 8 ? 'alert' : id === 'A1' && t < 21.5 ? 'warn' : 'sense');
    const tr = traffic(farm, t, { tone });
    fx.packets.set(tr.packets); fx.links.set(tr.links);
    farm.setLeds((id) => [tr.tx[id] ? '#33c6e0' : (tone(id) === 'alert' ? '#e0614a' : tone(id) === 'warn' ? '#e3a22c' : '#39e07a'), tr.tx[id] ? 9 : 1]);
    farm.setGatewayLeds(tr.gwTx ? 1 : 0);
    // leak marker on plot B beside the bund near B2
    if (t > 8.4 && t < 21) fx.marker.set({ pos: V(0.62, Math.max(0.006, bLevel / 1000 + 0.004), 4.9), normal: V(0, 1, 0), r: 0.45, opacity: window01(t, 8.4, 21, 0.5, 0.5), tone: 'alert', phase: t });
    if (pump) fx.rings[0].set({ phase: t, centre: V(farm.ripples.centre.x, Math.max(0.003, aLevel / 1000) + 0.004, farm.ripples.centre.z), normal: V(0, 1, 0), maxR: 0.6, strength: aLevel > 0 ? 0.9 : 0.5, period: 1.6, color: TONE.water });
    farm.frame(V(-3, 0, 2), 18);
    const cam = shotAt([[0, [12, 10, 21], [-3, 0, 2], 40], [7.5, [10, 7.5, 18], [-2, 0, 2], 38], [9.2, [2.4, 1.2, 3.3], [0.2, 0.25, 5.3], 34], [14.6, [2.4, 1.2, 3.3], [0.2, 0.25, 5.3], 34], [16.4, [-2, 6.5, 17], [-6, 0.5, 4.5], 38], [21, [-5.2, 1.6, 8.8], [-9.6, 0.25, 5.6], 34], [30, [-4.6, 1.9, 9.4], [-9.2, 0.25, 5.4], 34]], t);
    const tags = [
      ...IDS.map((id, i) => nodeTag(farm, id, id, i === 0 ? 'P1 · 4 depths' : 'P2', 'sense', window01(t, 1 + i * 0.4, 7.6, 0.4, 0.4))),
      nodeTag(farm, 'B2', 'B2 · losing water fast', 'check the bund', 'alert', window01(t, 9.4, 15, 0.4, 0.4)),
      { text: 'Pump ON', sub: 'gateway relay · GPIO13', tone: 'water', pos: V(-10.45, 0.45, 5.8), opacity: window01(t, 21.6, 30, 0.4, 0.4) },
    ];
    const lang = ctx.settings.lang === 'en' ? 'mr' : ctx.settings.lang;
    const ev = eventsAt([[1, 'A1 → gateway · ESP-NOW', 'sense', 'A1'], [1.6, 'B2 → gateway', 'sense', 'B2'], [2.2, 'C3 → gateway', 'sense', 'C3'], [2.7, 'D4 → gateway', 'sense', 'D4'], [8.4, 'B2 drying 3× faster than C3, D4', 'alert', 'anomaly'], [12, 'A1 at −15 cm: irrigate', 'warn', 'A1'], [15.2, 'SMS sent to farmer', 'ok', 'gateway'], [21.2, 'Relay ON: pump running', 'water', 'gateway'], [29.4, 'Plot A back to +5 cm', 'ok', 'A1']], t);
    return {
      cam, tags,
      hud: {
        phase: { text: t < 8.4 ? 'Nodes reporting' : t < 15 ? 'Anomaly at B2' : t < 21.2 ? 'Farmer alerted' : 'Pump on', tone: t < 8.4 ? 'sense' : t < 21.2 ? 'alert' : 'water' },
        kpis: [{ l: 'Nodes', v: '4', u: '' }, { l: 'B2 water', v: fmt(bLevel, 0), u: 'mm', tone: t > 8 ? 'alert' : 'water' }, { l: 'Pump', v: pump ? 'ON' : 'OFF', u: '', tone: pump ? 'water' : 'sense' }],
        card: t >= 14.8 ? { kind: 'sms', lines: [{ lang, text: smsText('B', { key: 'leak', node: 'B2', v: '' }, lang) }, { lang: 'en', text: smsText('B', { key: 'leak', node: 'B2', v: '' }, 'en') }, { lang, text: smsText('A', { key: 'irrigate', v: lang === 'mr' ? 'पाणी −15 सेमी' : 'पानी −15 सेमी' }, lang) }], k: prog(t, 14.8, 15.6) } : { kind: 'packets', log: ev.log.slice(-5) },
        map: { nodes: { A1: t < 21.5 ? 'warn' : 'ok', B2: t > 8 ? 'alert' : 'ok', C3: 'ok', D4: 'ok' }, tx: tr.tx, pump },
        ...ev,
        caption: captionAt([[0, 'Every node sends its readings to the farmhouse gateway over ESP-NOW, the ESP32’s own radio: no Wi-Fi network and no SIM per node.'], [8.4, 'B2 is losing water about three times faster than its neighbours. Ground nodes compared side by side point to a leaking bund, not normal drying.'], [15, 'The gateway sends an SMS in Marathi: check the bund near B2; plot A has reached −15 cm.'], [21.2, 'With the farmer’s go-ahead, the gateway relay starts the 12 V pump and plot A refills.']], t),
      },
    };
  },
};

/* ======================================================================= 10 · Ground meets space */
export const chSpace = {
  id: 'space', n: 10, world: 'farm', dur: 28,
  title: 'Ground meets space',
  honesty: 'Illustration · σ⁰ values illustrative',
  frame(ctx, t) {
    const farm = ctx.farm, fx = ctx.fx; farmBase(farm, ctx, t);
    farm.setWater('A', 50); farm.setWater('B', 20); farm.setWater('C', -40); farm.setWater('D', 10);
    const k = trapezoid(t, 0.5, 15, 0.2);
    farm.setSatellite(k, t < 16);
    farm.frame(V(0, 0, 0), 18);
    const cam = shotAt([[0, [24, 13, 36], [0, 9.5, -5], 42], [14, [20, 11, 31], [0, 7.5, -4], 40], [16, [11, 12, 19], [-0.5, 0, 0.5], 38], [21.5, [11, 12, 19], [-0.5, 0, 0.5], 38], [23.5, [1.1, 0.75, 5.6], [-0.25, 0.15, 3.8], 33], [28, [1.2, 0.8, 5.8], [-0.25, 0.15, 3.8], 33]], t);
    const rk = (a) => window01(t, a, 22.4, 0.4, 0.4);
    const tags = [
      { text: 'Sentinel-1-class C-band SAR', sub: 'illustrative, not to scale · 6–12 day revisit', tone: 'sense', pos: farm.sat.position.clone().add(V(0, 2.5, 0)), opacity: window01(t, 1.5, 14.5, 0.5, 0.5) },
      { text: 'Open water · specular', sub: 'radar bounces away: dark', tone: 'water', pos: V(-4.8, 0.6, 4.2), opacity: rk(16.2) },
      { text: 'Rice in water · double bounce', sub: 'stem + water: bright', tone: 'ok', pos: V(4.8, 0.9, 4.2), opacity: rk(17.2) },
      { text: 'Drained, dense canopy', sub: 'volume scattering', tone: 'warn', pos: V(-4.8, 0.9, -4.2), opacity: rk(18.2) },
      { text: 'E1 ≈ SAR depth (0–5 cm)', tone: 'sense', pos: V(-0.36, 0.12, 3.8), opacity: window01(t, 23.8, 28, 0.4, 0.3), anchorX: 1.04 },
      { text: 'E3 / E4: the −15 cm decision', sub: 'below what radar sees', tone: 'warn', pos: V(-0.36, 0.02, 3.8), opacity: window01(t, 24.6, 28, 0.4, 0.3), anchorX: 1.04 },
    ];
    const ev = eventsAt([[1, 'SAR pass begins', 'sense', 'Sentinel-1'], [8, 'σ⁰ −11.2 dB over plot B (illustrative)', 'sense', 'SAR'], [15, 'Pass complete · next in 6–12 days', 'sense', 'SAR'], [23.6, 'Probe: readings every few minutes', 'ok', 'A1']], t);
    return {
      cam, tags,
      hud: {
        phase: { text: t < 15 ? 'SAR pass' : t < 22.4 ? 'Backscatter regimes' : 'Two depths, two views', tone: 'sense' },
        kpis: [{ l: 'SAR revisit', v: '6–12', u: 'days' }, { l: 'Probe', v: 'live', u: '', tone: 'ok' }, { l: 'SAR depth', v: '~5', u: 'cm' }],
        card: { kind: 'scatter', k: prog(t, 2, 14) },
        overlay: t > 22.6 ? { kind: 'depths', k: window01(t, 22.6, 28, 0.6, 0.3) } : null,
        ...ev,
        caption: captionAt([[0, 'A Sentinel-1-class radar satellite passes every 6 to 12 days and sees through cloud.'], [15.5, 'Radar backscatter depends on the surface: open water looks dark, rice standing in water looks bright, a drained canopy scatters in between.'], [22.6, 'C-band radar senses roughly the top 5 cm, which matches band E1. The −15 cm AWD decision lives at E3 and E4, below what radar can see.']], t),
      },
    };
  },
};

/* ======================================================================= 15 · The farm grid */
export const chFarm = {
  id: 'farm', n: 15, world: 'farm', dur: 26, variant: true,
  title: 'The farm grid',
  honesty: 'Design render · plots not to scale',
  frame(ctx, t) {
    const farm = ctx.farm, fx = ctx.fx; farmBase(farm, ctx, t);
    const showField = ctx.settings.variant === 'field' || t > 13;
    farm.setVariant(showField ? 'field' : 'prototype');
    farm.setWater('A', 20); farm.setWater('B', 35); farm.setWater('C', 10); farm.setWater('D', -30);
    const tr = traffic(farm, t, { period: 2.2 });
    fx.packets.set(tr.packets); fx.links.set(tr.links);
    farm.setLeds((id) => [tr.tx[id] ? '#33c6e0' : '#39e07a', tr.tx[id] ? 9 : 1]);
    farm.setGatewayLeds(tr.gwTx ? 1 : 0);
    farm.frame(V(-3, 0, 1), 18);
    const a = lerp(0.9, 1.9, t / 26);
    const cam = { eye: orbit([-3, 0, 1], 21, 11.5, a), target: [-3, 0.2, 1], fov: 40 };
    const tags = [
      { text: showField ? 'Field (ideal)' : 'Prototype (today)', sub: showField ? 'P1 on every node · IP67 · solar · LoRa 865 MHz option' : 'mains gateway at the farmhouse · ESP-NOW', tone: showField ? 'ok' : 'sense', pos: farm.gatewayPoint().add(V(0, 0.8, 0)), opacity: window01(t, 1, 12.6, 0.5, 0.4) + window01(t, 13.4, 26, 0.5, 0.4) },
      ...IDS.map((id, i) => nodeTag(farm, id, id, null, 'sense', window01(t, 2 + i * 0.4, 26, 0.4, 0.3))),
    ];
    const rssi = { A1: -61, B2: -67, C3: -72, D4: -70 };
    const ev = eventsAt([[1, 'Grid online: 4 nodes', 'ok', 'gateway'], [13, showField ? 'Field variant shown' : 'Prototype variant', 'sense', 'settings']], t);
    return {
      cam, tags,
      hud: {
        phase: { text: showField ? 'Field variant (ideal)' : 'Prototype (today)', tone: showField ? 'ok' : 'sense' },
        kpis: [{ l: 'Nodes', v: '4', u: '' }, { l: 'Link', v: 'ESP-NOW', u: '' }, { l: 'Gateway', v: showField ? 'mast' : 'house', u: '' }],
        card: { kind: 'rssi', rows: IDS.map((id) => [id, rssi[id]]), note: 'Link RSSI illustrative until the range test' },
        map: { nodes: { A1: 'ok', B2: 'ok', C3: 'ok', D4: 'warn' }, tx: tr.tx },
        ...ev,
        caption: captionAt([[0, 'Four plots, four nodes on their bunds, one gateway at the farmhouse. Today’s prototype: printed boxes, a mains-powered gateway and ESP-NOW.'], [13, 'The field version: the P1 probe on every node, IP67 enclosures and solar, with a LoRa 865 MHz option for plots beyond ESP-NOW range.']], t),
      },
    };
  },
};

/* ======================================================================= 16 · Ground + space, real data */
export const chSar = {
  id: 'sar', n: 16, world: 'farm', dur: 24,
  title: 'Ground + space, real data',
  honesty: 'SAR panel: team figures to be added',
  frame(ctx, t) {
    const farm = ctx.farm; farmBase(farm, ctx, t);
    farm.setWater('A', 50); farm.setWater('B', 40); farm.setWater('C', 20); farm.setWater('D', 45);
    farm.setSatellite(trapezoid(t, 0, 9, 0.2) * 0.6 + 0.2, t < 9);
    farm.frame(V(0, 0, 0), 18);
    const cam = shotAt([[0, [20, 12, 30], [0, 6, -3], 42], [9, [4, 30, 11], [0, 0, 0], 44], [24, [3.6, 31, 10], [0, 0, 0], 44]], t);
    return {
      cam, tags: [],
      hud: {
        phase: { text: t < 8 ? 'SAR pass' : 'Ponded fields seen from space', tone: 'sense' },
        kpis: [{ l: 'Sensor', v: 'C-band', u: '' }, { l: 'Region', v: 'Surat', u: '' }],
        overlay: t > 7.4 ? { kind: 'sar', k: window01(t, 7.4, 24, 1.2, 0.4), t } : null,
        ...eventsAt([[1, 'Sentinel-1 pass', 'sense', 'SAR'], [9, 'SAR water map', 'sense', 'U-Net']], t),
        caption: captionAt([[0, 'From orbit, ponded fields show up as dark patches in the radar image.'], [12, 'Together, radar and probes cover the whole farm and the depth that decides irrigation.']], t),
      },
    };
  },
};

/* ======================================================================= 17 · Backend + farmer (split screen) */
export const STAGES = [
  { id: 'pk', t: 1.0, name: 'ESP-NOW packets', sub: 'A1–D4 · θ per band, EW, °C', status: 'prototype firmware' },
  { id: 'gw', t: 2.8, name: 'Gateway', sub: 'ESP32 + SIM800L', status: 'prototype' },
  { id: 'sv', t: 4.6, name: 'Server (Python)', sub: 'ingest · store', status: 'prototype' },
  { id: 'ts', t: 6.4, name: 'Node time series', sub: 'per band, per node', status: 'simulated logs' },
  { id: 'sar', t: 7.6, name: 'Sentinel-1 tile', sub: 'C-band σ⁰ VV/VH', status: 'public data' },
  { id: 'cal', t: 9.6, name: 'Calibration model', sub: 'count → θ (Topp until soil fit)', status: 'literature curve' },
  { id: 'if', t: 11.6, name: 'IsolationForest', sub: '+ drying-rate comparison', status: 'prototype on simulated logs' },
  { id: 'un', t: 13.6, name: 'U-Net (SAR)', sub: 'water map', status: 'trained · per-chip mIoU 0.38 on protocol-clean test' },
  { id: 'de', t: 16.0, name: 'Disagreement engine', sub: 'ground ≠ space → flag for a person', status: 'rule-based prototype' },
  { id: 'dc', t: 18.4, name: 'Decision', sub: 'plan + SMS text', status: 'prototype' },
];
export const chSplit = {
  id: 'split', n: 17, world: 'phone', dur: 36,
  title: 'Backend + farmer',
  honesty: 'Farmer’s phone · prototype app · live wiring: next milestone',
  frame(ctx, t) {
    const ph = ctx.phone;
    const lang = ctx.settings.lang === 'hi' ? 'hi' : 'mr';
    const d = { key: 'plan', v: lang === 'mr' ? 'पाणी −12 सेमी' : 'पानी −12 सेमी' };
    const sms = smsText('A', d, lang); const smsEn = smsText('A', { key: 'plan', v: 'water −12 cm' }, 'en');
    const tap1 = window01(t, 24.4, 25.6, 0.35, 0.6), tap2 = window01(t, 28.6, 29.8, 0.35, 0.6);
    ph.set({
      notif: prog(t, 21.4, 22.2), thread: prog(t, 25.2, 25.9), app: prog(t, 29.4, 30.1), ring: prog(t, 30.1, 32), tap: t > 24.8 && t < 26 ? (t - 24.8) / 1.2 : t > 29 && t < 30.2 ? (t - 29) / 1.2 : 0,
      tapX: t < 27 ? 340 : 200, tapY: t < 27 ? 600 : 598, thumb: Math.max(tap1, tap2),
      sms, smsEn, fieldName: lang === 'mr' ? 'शेत A · नोड A1' : 'खेत A · नोड A1', level: '−12', levelLabel: lang === 'mr' ? 'सेमी · सुकत आहे' : 'सेमी · सूख रहा है',
      planLabel: lang === 'mr' ? 'नियोजन' : 'योजना', plan: lang === 'mr' ? 'गुरुवारी सकाळी पाणी द्या' : 'गुरुवार सुबह सिंचाई करें',
      rainLabel: lang === 'mr' ? 'पुढील ३ दिवस पाऊस' : 'अगले 3 दिन बारिश', rain: lang === 'mr' ? [{ day: 'बुध', mm: 0 }, { day: 'गुरु', mm: 2 }, { day: 'शुक्र', mm: 0 }] : [{ day: 'बुध', mm: 0 }, { day: 'गुरु', mm: 2 }, { day: 'शुक्र', mm: 0 }],
      call: lang === 'mr' ? 'कृषी तज्ज्ञांना कॉल करा' : 'कृषि विशेषज्ञ को कॉल करें', foot: 'prototype app · simulated field A',
    });
    const split = prog(t, 0.2, 3.0);
    const cam = shotAt([[0, [0.04, -0.01, 0.5], [0.0, -0.018, 0], 30], [20, [0.03, -0.01, 0.48], [0.0, -0.018, 0], 30], [24, [0.02, -0.012, 0.44], [0.0, -0.016, 0], 30], [36, [0.025, -0.013, 0.45], [0.0, -0.016, 0], 30]], t);
    const active = STAGES.filter((s) => t >= s.t).length;
    return {
      cam, tags: [], split,
      hud: {
        phase: { text: t < 20 ? STAGES[Math.max(0, active - 1)].name : t < 24 ? 'SMS to the farmer' : 'Farmer opens the app', tone: t < 20 ? 'sense' : 'ok' },
        kpis: [],
        overlay: { kind: 'pipeline', t, split, sms: t > 20.4 ? sms : null },
        ...eventsAt([[1, 'Packets arriving', 'sense', 'gateway'], [16, 'Ground and space agree for field A', 'ok', 'engine'], [20.4, 'SMS queued (Marathi)', 'ok', 'gateway'], [21.4, 'Delivered to farmer', 'ok', 'SIM800L'], [29.4, 'App opened', 'sense', 'phone']], t),
        log: [],
        caption: captionAt([[0, 'Left: the backend. Packets reach the server, the models run, and the disagreement engine decides whether to trust ground and space together or flag the field for a person.'], [20.4, 'Right: the farmer’s phone. A Marathi SMS arrives; one tap opens the AGRI-GRID app with today’s status, the plan and the next irrigation time.']], t),
      },
    };
  },
};

/* ======================================================================= 18 · Impact and scale */
export const chImpact = {
  id: 'impact', n: 18, world: 'farm', dur: 30,
  title: 'Impact and scale',
  honesty: 'Literature · sources cited on screen',
  frame(ctx, t) {
    const farm = ctx.farm; farmBase(farm, ctx, t);
    farm.setWater('A', 20); farm.setWater('B', -40); farm.setWater('C', 10); farm.setWater('D', -60);
    farm.frame(V(-3, 0, 1), 18);
    const cam = { eye: orbit([-2.5, 0, 1], 24, 12.5, lerp(2.3, 2.9, t / 30)), target: [-2.5, 0.3, 1], fov: 40 };
    return {
      cam, tags: [], dim: 0.35,
      hud: {
        phase: { text: 'Impact and scale', tone: 'ok' },
        kpis: [],
        overlay: { kind: 'impact', t, hideCosts: ctx.settings.hideCosts },
        log: [], toast: null,
        caption: null, // the cards carry the content; nothing should cover them
      },
    };
  },
};
