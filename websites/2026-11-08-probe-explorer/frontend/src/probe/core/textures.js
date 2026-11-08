// Procedural textures (canvas). Everything is seeded, so the look is identical on every load.
import * as THREE from 'three';
import { canvas2d, canvasTexture, seededRandom, makeNoise2, fbm, roundRect, clamp, lerp } from './util.js';

const cache = new Map();
const once = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };

/** Height field (Float32Array) → tangent-space normal map texture. */
export function heightToNormal(h, w, hh, strength = 2, wrap = true) {
  const [c, x] = canvas2d(w, hh);
  const img = x.createImageData(w, hh);
  const at = (i, j) => {
    if (wrap) { i = (i + w) % w; j = (j + hh) % hh; } else { i = clamp(i, 0, w - 1); j = clamp(j, 0, hh - 1); }
    return h[j * w + i];
  };
  for (let j = 0; j < hh; j += 1) for (let i = 0; i < w; i += 1) {
    const dx = (at(i + 1, j) - at(i - 1, j)) * strength, dy = (at(i, j + 1) - at(i, j - 1)) * strength;
    let nx = -dx, ny = -dy, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const k = (j * w + i) * 4;
    img.data[k] = (nx * 0.5 + 0.5) * 255; img.data[k + 1] = (ny * 0.5 + 0.5) * 255; img.data[k + 2] = (nz * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = canvasTexture(c, { srgb: false });
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** FDM layer lines (along the tube axis for halves printed arch-up) as a normal map. */
export const layerLinesNormal = () => once('layers', () => {
  const w = 512, h = 16; const H = new Float32Array(w * h); const r = seededRandom(7);
  const jitter = Array.from({ length: w }, () => r() * 0.15);
  for (let i = 0; i < w; i += 1) { const p = (i % 4) / 4; const v = Math.sin(p * Math.PI) * 0.9 + jitter[i]; for (let j = 0; j < h; j += 1) H[j * w + i] = v; }
  return heightToNormal(H, w, h, 0.9);
});

/** Fine matte grain (paint, nylon, rubber). */
export const grainNormal = () => once('grain', () => {
  const w = 256; const H = new Float32Array(w * w); const r = seededRandom(11); const n = makeNoise2(3);
  for (let j = 0; j < w; j += 1) for (let i = 0; i < w; i += 1) H[j * w + i] = r() * 0.4 + fbm(n, i / 16, j / 16, 3) * 0.8;
  return heightToNormal(H, w, w, 1.2);
});

/** Brushed metal: long streaks along U. Returns { normal, rough }. */
export const brushed = () => once('brushed', () => {
  const w = 512, h = 128; const H = new Float32Array(w * h); const r = seededRandom(5);
  const rows = Array.from({ length: h }, () => r());
  for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) H[j * w + i] = rows[j] * 0.8 + Math.sin(i * 0.05 + rows[j] * 30) * 0.05;
  const normal = heightToNormal(H, w, h, 0.6);
  const [c, x] = canvas2d(w, h); const img = x.createImageData(w, h);
  for (let j = 0; j < h; j += 1) { const v = 150 + rows[j] * 70; for (let i = 0; i < w; i += 1) { const k = (j * w + i) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = v; img.data[k + 3] = 255; } }
  x.putImageData(img, 0, 0);
  const rough = canvasTexture(c, { srgb: false }); rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
  return { normal, rough };
});

/** Section hatch for cut faces of solid parts (engineering cutaway convention). */
export const sectionHatch = () => once('hatch', () => {
  const [c, x] = canvas2d(128, 128);
  x.fillStyle = '#3b4146'; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = 'rgba(255,255,255,0.10)'; x.lineWidth = 3;
  for (let i = -128; i < 256; i += 16) { x.beginPath(); x.moveTo(i, 128); x.lineTo(i + 128, 0); x.stroke(); }
  const t = canvasTexture(c, { repeat: [1, 1] }); return t;
});

/** Tileable soil-top mud (albedo + normal). */
export const mudTop = () => once('mudTop', () => {
  const w = 512; const [c, x] = canvas2d(w, w); const img = x.createImageData(w, w); const n = makeNoise2(21); const r = seededRandom(22);
  const H = new Float32Array(w * w);
  for (let j = 0; j < w; j += 1) for (let i = 0; i < w; i += 1) {
    const u = i / w, v = j / w;
    const big = fbm(n, u * 6, v * 6, 4), fine = fbm(n, u * 40 + 3, v * 40, 3);
    const hgt = big * 0.6 + fine * 0.5 + (r() < 0.004 ? 1.4 : 0);
    H[j * w + i] = hgt;
    const k = (j * w + i) * 4; const base = 0.5 + big * 0.35 + fine * 0.12;
    img.data[k] = 74 * base + 30; img.data[k + 1] = 62 * base + 24; img.data[k + 2] = 50 * base + 18; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const map = canvasTexture(c); map.wrapS = map.wrapT = THREE.RepeatWrapping;
  return { map, normal: heightToNormal(H, w, w, 3) };
});

/**
 * Soil cut-face horizons. Canvas covers 2.0 m wide × 0.5 m deep (1 px ≈ 1 mm), repeating in x.
 * Puddled layer 0–150 mm, plough pan 150–200 mm, mottled subsoil below. Roots in the top 150 mm.
 */
export const soilFace = () => once('soilFace', () => {
  const w = 2048, h = 512; const [c, x] = canvas2d(w, h); const img = x.createImageData(w, h);
  const n = makeNoise2(31), n2 = makeNoise2(32); const r = seededRandom(33); const H = new Float32Array(w * h);
  const puddled = [72, 62, 54], pan = [92, 78, 64], sub = [122, 92, 64], mottle = [160, 104, 58], crumb = [96, 82, 68];
  for (let j = 0; j < h; j += 1) {
    const d = j; // mm below surface
    for (let i = 0; i < w; i += 1) {
      const wob = fbm(n, i / 140, j / 140, 3) * 18; const dd = d + wob;
      const kPan = clamp((dd - 140) / 22, 0, 1), kSub = clamp((dd - 196) / 30, 0, 1);
      let col = puddled.map((v, q) => lerp(v, pan[q], kPan)).map((v, q) => lerp(v, sub[q], kSub));
      const mot = fbm(n2, i / 30, j / 30, 3);
      if (kSub > 0.2 && mot > 0.22) col = col.map((v, q) => lerp(v, mottle[q], clamp((mot - 0.22) * 3, 0, 0.7) * kSub));
      if (dd < 30) { const cr = fbm(n2, i / 6, j / 6, 2); col = col.map((v, q) => lerp(v, crumb[q], clamp(cr * 1.6, 0, 0.5) * (1 - dd / 30))); }
      const grain = (r() - 0.5) * 7 + fbm(n, i / 3, j / 3, 2) * 12;
      const k = (j * w + i) * 4;
      img.data[k] = clamp(col[0] + grain, 0, 255); img.data[k + 1] = clamp(col[1] + grain * 0.9, 0, 255); img.data[k + 2] = clamp(col[2] + grain * 0.8, 0, 255); img.data[k + 3] = 255;
      H[j * w + i] = grain / 30 + fbm(n, i / 10, j / 10, 2) * 0.8 + kPan * 0.2;
    }
  }
  x.putImageData(img, 0, 0);
  // fibrous rice roots in the puddled layer
  x.strokeStyle = 'rgba(214,196,160,0.38)'; x.lineCap = 'round';
  for (let k = 0; k < 140; k += 1) {
    let px = r() * w, py = r() * 6; const len = 40 + r() * 120; x.lineWidth = 0.6 + r() * 1.1; x.beginPath(); x.moveTo(px, py);
    for (let s = 0; s < 10; s += 1) { px += (r() - 0.5) * 16; py += len / 10; x.lineTo(px, py); }
    x.stroke();
  }
  // pebbles and sand specks
  for (let k = 0; k < 900; k += 1) {
    const px = r() * w, py = 20 + r() * (h - 20), rad = r() < 0.06 ? 2 + r() * 4 : 0.5 + r() * 1.2;
    x.fillStyle = `rgba(${170 + r() * 50},${150 + r() * 40},${120 + r() * 40},${0.35 + r() * 0.4})`;
    x.beginPath(); x.ellipse(px, py, rad, rad * (0.6 + r() * 0.4), r() * 3, 0, Math.PI * 2); x.fill();
  }
  const map = canvasTexture(c); map.wrapS = THREE.RepeatWrapping; map.wrapT = THREE.ClampToEdgeWrapping;
  const normal = heightToNormal(H, w, h, 2.2, false); normal.wrapS = THREE.RepeatWrapping;
  return { map, normal, widthM: 2.0, heightM: 0.5 };
});

/** Fine soil grain (tileable) for macro shots of the section face: multiplied over the horizon texture. */
export const soilDetail = () => once('soilDetail', () => {
  const w = 256; const [c, x] = canvas2d(w, w); const img = x.createImageData(w, w); const n = makeNoise2(77); const r = seededRandom(78);
  for (let j = 0; j < w; j += 1) for (let i = 0; i < w; i += 1) {
    const f = fbm(n, i / 9, j / 9, 3) * 0.5 + fbm(n, i / 3, j / 3, 2) * 0.35 + (r() - 0.5) * 0.25;
    const v = clamp(150 + f * 120, 60, 235); const k = (j * w + i) * 4;
    img.data[k] = v; img.data[k + 1] = v * 0.97; img.data[k + 2] = v * 0.93; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  for (let k = 0; k < 140; k += 1) { x.fillStyle = r() < 0.5 ? `rgba(240,225,200,${0.25 + r() * 0.4})` : `rgba(30,22,16,${0.2 + r() * 0.3})`; x.beginPath(); x.ellipse(r() * w, r() * w, 0.6 + r() * 2.2, 0.5 + r() * 1.6, r() * 3, 0, Math.PI * 2); x.fill(); }
  const t = canvasTexture(c, { srgb: false }); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
});

/** Bund earth (compacted, lighter, grassy top) for the bund cut face and surface. */
export const bundEarth = () => once('bundEarth', () => {
  const w = 512; const [c, x] = canvas2d(w, w); const img = x.createImageData(w, w); const n = makeNoise2(41); const r = seededRandom(42); const H = new Float32Array(w * w);
  for (let j = 0; j < w; j += 1) for (let i = 0; i < w; i += 1) {
    const f = fbm(n, i / 24, j / 24, 4), g = (r() - 0.5) * 20;
    const k = (j * w + i) * 4; img.data[k] = 112 + f * 40 + g; img.data[k + 1] = 92 + f * 32 + g; img.data[k + 2] = 70 + f * 24 + g; img.data[k + 3] = 255;
    H[j * w + i] = f + g / 40;
  }
  x.putImageData(img, 0, 0);
  const map = canvasTexture(c); map.wrapS = map.wrapT = THREE.RepeatWrapping;
  return { map, normal: heightToNormal(H, w, w, 2.5) };
});

/** Water ripples normal map (tileable). */
export const waterNormal = () => once('water', () => {
  const w = 256; const H = new Float32Array(w * w); const n = makeNoise2(51);
  for (let j = 0; j < w; j += 1) for (let i = 0; i < w; i += 1) {
    const u = i / w, v = j / w; let s = 0;
    for (let o = 1; o <= 3; o += 1) s += Math.sin((u * 6 * o + fbm(n, u * 4, v * 4, 2)) * Math.PI * 2) * Math.sin((v * 5 * o) * Math.PI * 2) / o;
    H[j * w + i] = s * 0.3 + fbm(n, u * 8, v * 8, 3) * 0.6;
  }
  return heightToNormal(H, w, w, 1.6);
});

/** Perfboard: 2.54 mm grid of copper pads on brown phenolic or green FR4. */
export function perfboardTexture(wmm, hmm, fr4 = true) {
  return once(`perf${wmm}x${hmm}${fr4}`, () => {
    const s = 8; const W = Math.round(wmm * s), H = Math.round(hmm * s); const [c, x] = canvas2d(W, H);
    x.fillStyle = fr4 ? '#2f6b45' : '#b4844f'; x.fillRect(0, 0, W, H);
    const pitch = 2.54 * s;
    for (let yy = pitch / 1.2; yy < H; yy += pitch) for (let xx = pitch / 1.2; xx < W; xx += pitch) {
      x.fillStyle = '#c99a5a'; x.beginPath(); x.arc(xx, yy, pitch * 0.32, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#1b1b1b'; x.beginPath(); x.arc(xx, yy, pitch * 0.13, 0, Math.PI * 2); x.fill();
    }
    return canvasTexture(c);
  });
}

/** Generic module PCB top with silkscreen text (no brand logos). */
export function pcbTexture(key, { w, h, color = '#1d2a33', text = '', sub = '', pads = 0 }) {
  return once(`pcb:${key}`, () => {
    const s = 10; const W = Math.round(w * s), H = Math.round(h * s); const [c, x] = canvas2d(W, H);
    x.fillStyle = color; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 2;
    for (let i = 0; i < 18; i += 1) { x.beginPath(); x.moveTo((i / 18) * W, 0); x.lineTo((i / 18) * W + W * 0.2, H); x.stroke(); }
    if (pads) { x.fillStyle = '#d6b36a'; for (let i = 0; i < pads; i += 1) { const px = (i + 0.5) * (W / pads); x.beginPath(); x.arc(px, H * 0.06, s * 0.6, 0, 7); x.fill(); x.beginPath(); x.arc(px, H * 0.94, s * 0.6, 0, 7); x.fill(); } }
    x.fillStyle = 'rgba(245,245,240,0.88)'; x.font = `600 ${Math.round(s * 2.4)}px Inter, system-ui, sans-serif`; x.textAlign = 'center';
    if (text) x.fillText(text, W / 2, H * 0.52);
    x.font = `500 ${Math.round(s * 1.5)}px Inter, system-ui, sans-serif`; if (sub) x.fillText(sub, W / 2, H * 0.52 + s * 2.6);
    return canvasTexture(c);
  });
}

/** Text decal on transparent background. */
export function textDecal(key, lines, { w = 512, h = 128, color = '#ffffff', font = '700 72px Inter, system-ui, sans-serif', align = 'center', bg = null } = {}) {
  return once(`txt:${key}`, () => {
    const [c, x] = canvas2d(w, h);
    if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
    x.fillStyle = color; x.font = font; x.textAlign = align; x.textBaseline = 'middle';
    const arr = Array.isArray(lines) ? lines : [lines];
    arr.forEach((l, i) => x.fillText(l, align === 'center' ? w / 2 : 8, h * (i + 1) / (arr.length + 1)));
    const t = canvasTexture(c); return t;
  });
}

/** Staff gauge face: engraved ticks and numbers, white-filled, −150…+100 mm. */
export const gaugeFace = () => once('gauge', () => {
  const s = 6; const W = 30 * s, H = 280 * s; const [c, x] = canvas2d(W, H);
  x.fillStyle = '#26292c'; x.fillRect(0, 0, W, H);
  const yOf = (mm) => (115 - mm) * s; // top margin 15 above +100
  for (let v = -150; v <= 100; v += 5) {
    const long = v % 10 === 0; x.fillStyle = v === -150 ? '#e24b3b' : '#f2f2ee';
    const len = (long ? 12 : 8) * s, th = (long ? 1.2 : 0.8) * s;
    x.fillRect(0, yOf(v) - th / 2, len, th);
    if (v % 20 === 0 && v !== 0 && v !== -150) { x.font = `700 ${6 * s}px Inter, system-ui, sans-serif`; x.textBaseline = 'middle'; x.fillText(String(v / 10), 14 * s, yOf(v)); }
  }
  x.fillStyle = '#f2f2ee'; x.fillRect(0, yOf(0) - s, W, 2 * s);
  x.font = `800 ${4.6 * s}px Inter, system-ui, sans-serif`; x.textBaseline = 'bottom'; x.fillText('SOIL', 13 * s, yOf(0) - 1.6 * s);
  x.fillStyle = '#e24b3b'; x.textBaseline = 'top'; x.font = `800 ${3.4 * s}px Inter, system-ui, sans-serif`; x.fillText('IRRIGATE', 1 * s, yOf(-150) + 1.6 * s);
  x.fillStyle = 'rgba(255,255,255,0.55)'; x.font = `600 ${2.6 * s}px Inter, system-ui, sans-serif`; x.fillText('cm', 22 * s, yOf(100) + 1 * s);
  return canvasTexture(c);
});

/** Depth tick numbers decal for the probe (above ground only, cm). */
export const tickNumbers = () => once('ticknum', () => {
  const s = 12; const W = 14 * s, H = 110 * s; const [c, x] = canvas2d(W, H);
  x.fillStyle = '#2b2e31'; x.font = `800 ${5.2 * s}px Inter, system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let cm = 2; cm <= 10; cm += 2) x.fillText(String(cm), W / 2, (110 - cm * 10) * s);
  return canvasTexture(c);
});

/** Soft round blob for contact shadows. */
export const blob = () => once('blob', () => {
  const [c, x] = canvas2d(128, 128); const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.5, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return canvasTexture(c, { srgb: false });
});

/** Generic soft spot (effects). */
export const spot = () => once('spot', () => {
  const [c, x] = canvas2d(128, 128); const g = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return canvasTexture(c);
});

/** Corrosion progression for the two-prong resistive sensor (k 0..1). */
export function corrosionTexture(k) {
  const key = `corr${Math.round(k * 8)}`;
  return once(key, () => {
    const W = 256, H = 1024; const [c, x] = canvas2d(W, H); const r = seededRandom(61); const n = makeNoise2(62);
    x.fillStyle = '#245a3a'; x.fillRect(0, 0, W, H);
    // two exposed tin-plated traces
    for (const px of [W * 0.25, W * 0.75]) {
      x.fillStyle = '#cfd4d6'; x.fillRect(px - 20, 120, 40, H - 140);
    }
    const lvl = Math.round(k * 8) / 8;
    const img = x.getImageData(0, 0, W, H);
    for (let j = 300; j < H; j += 1) for (let i = 0; i < W; i += 1) {
      const onTrace = Math.abs(i - W * 0.25) < 20 || Math.abs(i - W * 0.75) < 20; if (!onTrace) continue;
      const v = fbm(n, i / 14, j / 14, 4) + (j - 300) / 1400;
      const t = lvl * 1.1 - 0.25;
      if (v < t) { const q = (j * W + i) * 4; const pit = r() < 0.08; img.data[q] = pit ? 40 : 96 + r() * 30; img.data[q + 1] = pit ? 36 : 140 + r() * 40; img.data[q + 2] = pit ? 30 : 110 + r() * 30; }
      else if (v < t + 0.08) { const q = (j * W + i) * 4; img.data[q] = 140; img.data[q + 1] = 110; img.data[q + 2] = 70; }
    }
    x.putImageData(img, 0, 0);
    return canvasTexture(c);
  });
}

export const roundRectPath = roundRect;
