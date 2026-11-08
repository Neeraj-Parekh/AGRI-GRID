// Small deterministic helpers (ported from the AGV-4 shared utilities, plain JS).
import * as THREE from 'three';

export const MM = 0.001; // world units are metres; the spec is in millimetres
export const mm = (v) => v * MM;

export function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let v = Math.imul(s ^ (s >>> 15), 1 | s);
    v = (v + Math.imul(v ^ (v >>> 7), 61 | v)) ^ v;
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export function smooth01(x) { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); }
export function smootherstep(x) { const t = clamp(x, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); }
/** 0 outside [a,b], ramps in over rampIn and out over rampOut. */
export function window01(t, a, b, rampIn, rampOut = rampIn) {
  if (t <= a || t >= b) return 0;
  return Math.min(smooth01((t - a) / Math.max(rampIn, 1e-4)), smooth01((b - t) / Math.max(rampOut, 1e-4)));
}
/** Progress of t through [a,b] with smoothstep easing. */
export const prog = (t, a, b) => smooth01((t - a) / Math.max(b - a, 1e-4));
/** Trapezoid speed profile position 0..1 over [a,b] with accel fraction f. */
export function trapezoid(t, a, b, f = 0.25) {
  const u = clamp((t - a) / Math.max(b - a, 1e-4), 0, 1);
  const v = 1 / (1 - f); // peak speed so that area = 1
  if (u < f) return 0.5 * v * u * u / f;
  if (u > 1 - f) return 1 - 0.5 * v * (1 - u) * (1 - u) / f;
  return 0.5 * v * f + v * (u - f);
}

export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export function canvas2d(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
export function canvasTexture(canvas, { srgb = true, repeat = null, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath();
}
export function wrapText(ctx, text, x, y, maxW, lh) {
  const words = String(text).split(/\s+/); let line = ''; let cy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, cy); line = w; cy += lh; } else line = test;
  }
  if (line) ctx.fillText(line, x, cy);
  return cy + lh;
}

/** Shadow flags in one call. */
export function shade(obj, cast = true, receive = true) {
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; } });
  return obj;
}
/** Smooth 2-D value noise (deterministic). */
export function makeNoise2(seed = 1) {
  const r = seededRandom(seed); const P = new Uint8Array(512); const perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i -= 1) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i += 1) P[i] = perm[i & 255];
  const grad = (h, x, y) => { const u = h & 1 ? x : -x; const v = h & 2 ? y : -y; return u + v; };
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y), A = P[X] + Y, B = P[X + 1] + Y;
    return lerp(lerp(grad(P[A], x, y), grad(P[B], x - 1, y), u), lerp(grad(P[A + 1], x, y - 1), grad(P[B + 1], x - 1, y - 1), u), v) * 0.7;
  };
}
export function fbm(noise, x, y, oct = 4) {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < oct; i += 1) { s += a * noise(x * f, y * f); a *= 0.5; f *= 2.03; }
  return s;
}
