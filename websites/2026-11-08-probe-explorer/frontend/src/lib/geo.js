// Small geometry helpers for lat/lng polygons ([[lat,lng], ...]). Accurate enough at field scale.
const R = 6371008.8, rad = d => d * Math.PI / 180;

export function areaHa(poly) {
  if (!poly || poly.length < 3) return 0;
  const lat0 = rad(poly.reduce((s, p) => s + p[0], 0) / poly.length);
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [y1, x1] = poly[i], [y2, x2] = poly[(i + 1) % poly.length];
    a += rad(x1) * Math.cos(lat0) * rad(y2) - rad(x2) * Math.cos(lat0) * rad(y1);
  }
  return Math.abs(a / 2) * R * R / 1e4;
}

export function centroid(poly) {
  const n = poly.length; return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
}

export function distM(a, b) {
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function inPoly(lat, lng, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j];
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function bbox(poly) {
  let a = 90, b = 180, c = -90, d = -180;
  for (const [y, x] of poly) { a = Math.min(a, y); b = Math.min(b, x); c = Math.max(c, y); d = Math.max(d, x); }
  return { minLat: a, minLng: b, maxLat: c, maxLng: d };
}

// n well-spread points inside a polygon (deterministic): farthest-point sampling over a grid.
export function spreadPoints(poly, n, rng = Math.random) {
  const b = bbox(poly), cand = [];
  const steps = 18;
  for (let i = 0; i <= steps; i++) for (let j = 0; j <= steps; j++) {
    const lat = b.minLat + (b.maxLat - b.minLat) * (i + 0.5) / (steps + 1), lng = b.minLng + (b.maxLng - b.minLng) * (j + 0.5) / (steps + 1);
    if (inPoly(lat, lng, poly)) cand.push([lat, lng]);
  }
  if (!cand.length) return [centroid(poly)];
  // start near the centroid, then keep picking the point farthest from those chosen
  const c = centroid(poly);
  cand.sort((p, q) => distM(p, c) - distM(q, c));
  const out = [cand[0]];
  while (out.length < Math.min(n, cand.length)) {
    let best = null, bd = -1;
    for (const p of cand) { const d = Math.min(...out.map(o => distM(o, p))) * (0.9 + rng() * 0.2); if (d > bd) { bd = d; best = p; } }
    out.push(best);
  }
  // pull points 25% toward the centroid so nodes never sit on the bund line
  return out.map(([y, x]) => [y + (c[0] - y) * 0.25, x + (c[1] - x) * 0.25]);
}

// Rectangle (lat/lng) of w x h metres centred on [lat,lng], rotated by deg.
export function rectPoly([lat, lng], w, h, deg = 0) {
  const mLat = 1 / 111320, mLng = 1 / (111320 * Math.cos(rad(lat))), t = rad(deg);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => {
    const xr = x * Math.cos(t) - y * Math.sin(t), yr = x * Math.sin(t) + y * Math.cos(t);
    return [+(lat + yr * mLat).toFixed(6), +(lng + xr * mLng).toFixed(6)];
  });
}

// Seeded PRNG (mulberry32) + string hash, so every field gets stable "personality".
export function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) { let a = typeof seed === 'number' ? seed : hash(seed); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
