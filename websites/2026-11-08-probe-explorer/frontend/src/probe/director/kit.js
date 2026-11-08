// Small pure helpers shared by the chapter scripts: camera keyframes, act windows, events → toast + log.
import * as THREE from 'three';
import { smooth01, smootherstep, clamp, lerp, window01, trapezoid } from '../core/util.js';

export { smooth01, smootherstep, clamp, lerp, window01, trapezoid };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

/**
 * Camera keyframes: [[t, eye[3], target[3], fov], …]. Between keys the camera eases with smootherstep;
 * before the first and after the last it holds. Pure function of t, so paused deep links match exactly.
 */
export function shotAt(keys, t) {
  if (t <= keys[0][0]) return pack(keys[0]);
  for (let i = 0; i < keys.length - 1; i += 1) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b[0]) {
      const k = smootherstep((t - a[0]) / Math.max(1e-4, b[0] - a[0]));
      return { eye: lerp3(a[1], b[1], k), target: lerp3(a[2], b[2], k), fov: lerp(a[3], b[3], k) };
    }
  }
  return pack(keys[keys.length - 1]);
}
const pack = (k) => ({ eye: k[1].slice(), target: k[2].slice(), fov: k[3] });
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

/** Slow orbit around a target (for holds): returns an eye position. */
export function orbit(target, radius, height, angle) { return [target[0] + Math.sin(angle) * radius, target[1] + height, target[2] + Math.cos(angle) * radius]; }

/** Which act is active: acts = [[name, t0, t1], …]. */
export function actAt(acts, t) { for (const a of acts) if (t >= a[1] && t < a[2]) return a[0]; return acts[acts.length - 1][0]; }

/** Events [[t, text, tone, src]] → { toast, log } at time t. A toast shows for 2.4 s after its event. */
export function eventsAt(events, t) {
  const log = events.filter((e) => e[0] <= t).map((e) => ({ t: e[0], text: e[1], tone: e[2] || 'sense', src: e[3] || '' }));
  const last = log[log.length - 1];
  const toast = last && t - last.t < 2.4 ? { text: last.text, tone: last.tone, k: window01(t, last.t, last.t + 2.4, 0.25, 0.4) } : null;
  return { log, toast };
}

/** Caption list [[t, text]] → the active caption. */
export function captionAt(list, t) { let c = list[0][1]; for (const [ct, txt] of list) if (t >= ct) c = txt; return c; }

/** Tag helper: visible from the result beat for `hold` seconds, with soft ramps. */
export function tagWindow(t, t0, hold = 3, ramp = 0.35) { return window01(t, t0, t0 + hold, ramp, ramp); }

export const fmt = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : '–');
export const pct = (v) => `${Math.round(v * 100)}`;
