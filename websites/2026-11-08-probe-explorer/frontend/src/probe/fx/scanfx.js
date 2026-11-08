// Measurement effects in the AGV-4 language, recalibrated for AGRI-GRID's daylight palette and probe scale.
// One reusable object per effect type, no per-frame allocation, translucent fills with depthWrite off.
// Every effect is driven by explicit parameters from the timeline (pure function of t).
import * as THREE from 'three';
import { canvas2d, canvasTexture, roundRect, clamp, smooth01 } from '../core/util.js';

export const TONE = {
  sense: new THREE.Color('#33c6e0'),
  ok: new THREE.Color('#3fa35b'),
  warn: new THREE.Color('#e3a22c'),
  alert: new THREE.Color('#e0614a'),
  water: new THREE.Color('#2f86c9'),
  white: new THREE.Color('#ffffff'),
};
export const toneOf = (k) => TONE[k] || TONE.sense;

const fxMat = (color, opacity = 1, extra = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false, ...extra });

/** Thin flat ribbon along a polyline, lying in a plane with the given normal (width in world units). */
export function ribbonGeometry(points, width, normal = new THREE.Vector3(0, 0, 1)) {
  const pos = [], uv = [], idx = [];
  const n = points.length;
  let L = 0; const acc = [0];
  for (let i = 1; i < n; i += 1) { L += points[i].distanceTo(points[i - 1]); acc.push(L); }
  const tmp = new THREE.Vector3(), side = new THREE.Vector3();
  for (let i = 0; i < n; i += 1) {
    const a = points[Math.max(0, i - 1)], b = points[Math.min(n - 1, i + 1)];
    tmp.subVectors(b, a).normalize();
    side.crossVectors(normal, tmp).normalize().multiplyScalar(width / 2);
    pos.push(points[i].x + side.x, points[i].y + side.y, points[i].z + side.z, points[i].x - side.x, points[i].y - side.y, points[i].z - side.z);
    const u = L > 0 ? acc[i] / L : 0; uv.push(u, 0, u, 1);
    if (i < n - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/* ------------------------------------------------------------------ field pulses */
/** 3–4 phase-offset rings expanding on a plane: bright leading edge, soft trailing band. */
export class PulseRings {
  constructor({ count = 4, width = 0.004, color = TONE.sense } = {}) {
    this.group = new THREE.Group(); this.group.name = 'pulseRings'; this.group.renderOrder = 5;
    this.count = count; this.width = width;
    this.rings = [];
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
      uniforms: { uColor: { value: color.clone() }, uOpacity: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv; void main(){ float lead = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y)); float a = mix(0.25, 1.0, pow(vUv.y, 2.0)) * lead; gl_FragColor = vec4(uColor, a * uOpacity); }',
    });
    for (let i = 0; i < count; i += 1) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 96, 1), mat.clone());
      // RingGeometry uv.y is not radial; rebuild radial uv
      const p = m.geometry.attributes.position; const uv = m.geometry.attributes.uv;
      for (let j = 0; j < p.count; j += 1) { const r = Math.hypot(p.getX(j), p.getY(j)); uv.setXY(j, 0, (r - 0.98) / 0.02); }
      m.renderOrder = 5; m.frustumCulled = false;
      this.rings.push(m); this.group.add(m);
    }
    this.group.visible = false;
  }
  /** phase: running time (s); maxR: metres; strength 0..1; half: draw only a half disc (cut face) */
  set({ phase = 0, centre, normal = new THREE.Vector3(0, 1, 0), maxR = 0.15, strength = 1, period = 2.4, color = null, arc = null }) {
    this.group.visible = strength > 0.01;
    if (!this.group.visible) return;
    this.group.position.copy(centre);
    this.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());
    for (let i = 0; i < this.count; i += 1) {
      const m = this.rings[i];
      const k = ((phase / period) + i / this.count) % 1;
      const r = 0.002 + k * maxR;
      const inner = Math.max(0.0005, r - this.width);
      m.scale.setScalar(r);
      // keep ring width constant in world units: inner radius ratio
      const ratio = inner / r;
      const p = m.geometry.attributes.position;
      if (m.userData.ratio !== ratio) {
        const segs = 97;
        for (let j = 0; j < p.count; j += 1) { const a = Math.atan2(p.getY(j), p.getX(j)); const outer = j >= segs; const rr = outer ? 1 : ratio; p.setXY(j, Math.cos(a) * rr, Math.sin(a) * rr); }
        p.needsUpdate = true; m.userData.ratio = ratio;
      }
      if (color) m.material.uniforms.uColor.value.copy(color);
      m.material.uniforms.uOpacity.value = strength * (1 - k) * smooth01(k * 8);
      m.visible = true;
      if (arc) { m.material.side = THREE.DoubleSide; }
    }
  }
  hide() { this.group.visible = false; }
}

/* ------------------------------------------------------------------ sweep sheet */
/** A thin translucent sheet with a bright moving front; vertical (down the probe) or horizontal. */
export class SweepSheet {
  constructor({ w = 0.06, h = 0.24 } = {}) {
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
      uniforms: { uFront: { value: 0.5 }, uColor: { value: TONE.sense.clone() }, uOpacity: { value: 1 }, uTrail: { value: 0.18 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uFront; uniform vec3 uColor; uniform float uOpacity; uniform float uTrail; varying vec2 vUv;
        void main(){ float d = vUv.y - uFront; float front = exp(-pow(d / 0.006, 2.0)); float trail = smoothstep(uTrail, 0.0, d) * step(0.0, d) * 0.22;
          float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
          float a = (front * 0.95 + trail) * edge; gl_FragColor = vec4(mix(uColor, vec3(1.0), front * 0.5), a * uOpacity); }`,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
    this.mesh.renderOrder = 6; this.mesh.visible = false; this.mesh.frustumCulled = false;
    this.group = this.mesh;
  }
  /** front 0..1 measured from the top of the sheet. */
  set({ centre, w, h, front, opacity = 1, color = TONE.sense, rotY = 0, rotX = 0 }) {
    this.mesh.visible = opacity > 0.01;
    if (!this.mesh.visible) return;
    this.mesh.position.copy(centre); this.mesh.scale.set(w / 0.06, h / 0.24, 1);
    this.mesh.rotation.set(rotX, rotY, 0);
    this.mat.uniforms.uFront.value = 1 - front; this.mat.uniforms.uOpacity.value = opacity; this.mat.uniforms.uColor.value.copy(color);
  }
  hide() { this.mesh.visible = false; }
}

/* ------------------------------------------------------------------ lock brackets */
/** Four corner brackets that close on a target (camera-facing). */
export class LockBrackets {
  constructor() {
    this.group = new THREE.Group(); this.group.name = 'lock'; this.group.renderOrder = 9;
    this.mat = fxMat(TONE.sense, 1, { depthTest: false });
    const L = new THREE.Shape(); // an L of unit size, 0.12 thick
    L.moveTo(0, 0); L.lineTo(1, 0); L.lineTo(1, 0.12); L.lineTo(0.12, 0.12); L.lineTo(0.12, 1); L.lineTo(0, 1); L.closePath();
    const g = new THREE.ShapeGeometry(L);
    this.corners = [0, 1, 2, 3].map((i) => { const m = new THREE.Mesh(g, this.mat); m.rotation.z = (i * Math.PI) / 2; m.renderOrder = 9; this.group.add(m); return m; });
    this.group.visible = false;
  }
  /** k: 0 (open, far) → 1 (closed); size: half-extent [w,h] in metres; arm: bracket arm length. */
  set({ pos, camera, size = [0.02, 0.01], k = 1, opacity = 1, color = TONE.sense, arm = null }) {
    this.group.visible = opacity > 0.01;
    if (!this.group.visible) return;
    this.group.position.copy(pos);
    this.group.quaternion.copy(camera.quaternion);
    const open = 1 + (1 - smooth01(k)) * 0.9;
    const a = arm || Math.min(size[0], size[1]) * 0.55;
    const xs = [1, -1, -1, 1], ys = [1, 1, -1, -1];
    const rot = [Math.PI, -Math.PI / 2, 0, Math.PI / 2];
    this.corners.forEach((m, i) => { m.position.set(xs[i] * size[0] * open, ys[i] * size[1] * open, 0); m.rotation.z = rot[i]; m.scale.setScalar(a); });
    this.mat.opacity = opacity; this.mat.color.copy(color);
  }
  hide() { this.group.visible = false; }
}

/* ------------------------------------------------------------------ condition marker */
export class Marker {
  constructor() {
    this.group = new THREE.Group(); this.group.name = 'marker';
    const [c, x] = canvas2d(256, 256);
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(0.6, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    this.spotMat = fxMat(TONE.alert, 0.6, { map: canvasTexture(c), side: THREE.DoubleSide });
    this.spot = new THREE.Mesh(new THREE.CircleGeometry(1, 48), this.spotMat);
    // irregular ring (seeded wobble)
    const pts = []; for (let i = 0; i <= 96; i += 1) { const a = (i / 96) * Math.PI * 2; const r = 1 + 0.06 * Math.sin(a * 5 + 1.3) + 0.04 * Math.sin(a * 9 + 0.4); pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    this.ringMat = fxMat(TONE.alert, 1, { side: THREE.DoubleSide });
    this.ring = new THREE.Mesh(ribbonGeometry(pts, 0.06), this.ringMat);
    this.group.add(this.spot, this.ring); this.group.renderOrder = 7; this.spot.renderOrder = 7; this.ring.renderOrder = 8;
    this.group.visible = false;
  }
  set({ pos, normal = new THREE.Vector3(0, 0, 1), r = 0.02, opacity = 1, tone = 'alert', phase = 0 }) {
    this.group.visible = opacity > 0.01; if (!this.group.visible) return;
    this.group.position.copy(pos); this.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());
    const breathe = 1 + 0.06 * Math.sin(phase * 3.2);
    this.group.scale.setScalar(r * breathe);
    const c = toneOf(tone); this.spotMat.color.copy(c); this.ringMat.color.copy(c);
    this.spotMat.opacity = 0.5 * opacity; this.ringMat.opacity = opacity;
  }
  hide() { this.group.visible = false; }
}

/* ------------------------------------------------------------------ result tags */
const tagCache = new Map();
function tagTexture(text, tone, sub) {
  const key = `${text}|${tone}|${sub || ''}`;
  if (tagCache.has(key)) return tagCache.get(key);
  const S = 2;
  const [c0, x0] = canvas2d(10, 10); x0.font = `700 ${26 * S}px Inter, system-ui, sans-serif`;
  const tw = x0.measureText(text).width; x0.font = `500 ${18 * S}px Inter, system-ui, sans-serif`; const sw = sub ? x0.measureText(sub).width : 0;
  void c0;
  const W = Math.ceil(Math.max(tw, sw) + 64 * S), H = (sub ? 82 : 56) * S;
  const [c, x] = canvas2d(W, H);
  x.fillStyle = 'rgba(255,255,255,0.94)'; roundRect(x, 2, 2, W - 4, H - 4, 14 * S); x.fill();
  x.strokeStyle = 'rgba(16,38,28,0.10)'; x.lineWidth = 2; x.stroke();
  const col = '#' + toneOf(tone).getHexString();
  x.fillStyle = col; x.beginPath(); x.arc(24 * S, (sub ? 30 : H / 2 / S) * S, 6 * S, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#10261C'; x.font = `700 ${26 * S}px Inter, system-ui, sans-serif`; x.textBaseline = 'middle';
  x.fillText(text, 40 * S, (sub ? 30 : H / 2 / S) * S);
  if (sub) { x.fillStyle = '#4E5F56'; x.font = `500 ${18 * S}px Inter, system-ui, sans-serif`; x.fillText(sub, 40 * S, 60 * S); }
  const t = canvasTexture(c); t.userData = { aspect: W / H };
  tagCache.set(key, t);
  return t;
}
export class TagSet {
  constructor(n = 6) {
    this.group = new THREE.Group(); this.group.name = 'tags';
    this.sprites = Array.from({ length: n }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); s.renderOrder = 20; s.visible = false; s.center.set(0, 0.5); this.group.add(s); return s; });
  }
  /** tags: [{text, sub, tone, pos (Vector3), opacity, h (world height)}] */
  set(tags) {
    this.sprites.forEach((s, i) => {
      const t = tags[i];
      if (!t || t.opacity < 0.01) { s.visible = false; return; }
      const tex = tagTexture(t.text, t.tone || 'sense', t.sub);
      if (s.material.map !== tex) { s.material.map = tex; s.material.needsUpdate = true; }
      s.material.opacity = t.opacity; s.visible = true;
      s.position.copy(t.pos);
      const h = t.h || 0.02; s.scale.set(h * tex.userData.aspect, h, 1);
      s.center.set(t.anchorX ?? 0, 0.5);
    });
  }
}

/* ------------------------------------------------------------------ packets (data dots with trails) */
export class Packets {
  constructor(n = 12, { r = 0.004 } = {}) {
    this.group = new THREE.Group(); this.group.name = 'packets';
    this.items = Array.from({ length: n }, () => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: TONE.sense, toneMapped: false, transparent: true }));
      m.material.color.multiplyScalar(3);
      const trail = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), fxMat(TONE.sense, 0.25));
      m.add(trail); trail.scale.set(1.8, 1.8, 1.8);
      m.visible = false; m.renderOrder = 12; this.group.add(m); return m;
    });
    this.r = r;
  }
  /** list: [{curve (THREE.Curve), k 0..1, tone, opacity, r}] */
  set(list) {
    this.items.forEach((m, i) => {
      const p = list[i];
      if (!p || p.opacity < 0.01 || p.k < 0 || p.k > 1) { m.visible = false; return; }
      m.visible = true; p.curve.getPointAt(clamp(p.k, 0, 1), m.position);
      const c = toneOf(p.tone || 'sense'); m.material.color.copy(c).multiplyScalar(3); m.material.opacity = p.opacity;
      m.children[0].material.color.copy(c); m.children[0].material.opacity = 0.22 * p.opacity;
      m.scale.setScalar(p.r || this.r);
    });
  }
}

/* ------------------------------------------------------------------ link lines */
export class LinkLines {
  constructor(n = 8) {
    this.group = new THREE.Group(); this.group.name = 'links';
    this.lines = Array.from({ length: n }, () => { const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, toneMapped: false,
      uniforms: { uColor: { value: TONE.sense.clone() }, uOpacity: { value: 0.5 }, uPhase: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; uniform float uPhase; varying vec2 vUv; void main(){ float dash = 0.55 + 0.45 * smoothstep(0.35, 0.5, fract(vUv.x * 18.0 - uPhase)); float edge = 1.0 - abs(vUv.y - 0.5) * 2.0; gl_FragColor = vec4(uColor, uOpacity * dash * smoothstep(0.0, 0.5, edge)); }',
    })); m.visible = false; m.renderOrder = 4; m.frustumCulled = false; this.group.add(m); return m; });
  }
  /** links: [{key, curve, width, normal, opacity, phase, tone}] — geometry rebuilt only when key changes */
  set(links) {
    this.lines.forEach((m, i) => {
      const l = links[i];
      if (!l || l.opacity < 0.01) { m.visible = false; return; }
      if (m.userData.key !== l.key) { m.geometry.dispose(); m.geometry = ribbonGeometry(l.curve.getSpacedPoints(64), l.width || 0.01, l.normal || new THREE.Vector3(0, 1, 0)); m.userData.key = l.key; }
      m.visible = true; m.material.uniforms.uOpacity.value = l.opacity; m.material.uniforms.uPhase.value = l.phase || 0; m.material.uniforms.uColor.value.copy(toneOf(l.tone || 'sense'));
    });
  }
}

/* ------------------------------------------------------------------ fringing field lines (cut face) */
/**
 * Illustrative fringing-field lines from a sense band on the inner wall, out through the 1.6 mm PETG wall
 * into the soil slice, and back to the guard bands on either side. Drawn in the cut plane z = 0+ (metres).
 * guards=false: lines spread to the neighbouring bands instead (the "blurry depth" case of chapter 6).
 */
export function fieldLineSet({ x0, yc, h, guardGap = 0.004, reach = 0.06, lines = 6, guards = true, spreadTo = 0.05, side = -1 }) {
  const out = [];
  for (let i = 0; i < lines; i += 1) {
    const k = (i + 0.5) / lines; // 0 inner (short) .. 1 outer (long)
    const depth = 0.004 + k * reach; // how far into the soil the loop reaches
    const yFrom = yc + h * 0.5 * (0.2 + 0.6 * (1 - k));
    const yTo = guards ? yc + h / 2 + guardGap * (0.5 + k * 0.6) : yc + spreadTo * (0.4 + k * 0.9);
    for (const sgn of [1, -1]) {
      const pts = [];
      const a = yFrom * sgn + yc * (1 - sgn), b = (guards ? yTo : yTo) * sgn + yc * (1 - sgn);
      void a; void b;
      const y0 = sgn > 0 ? yFrom : 2 * yc - yFrom;
      const y1 = sgn > 0 ? yTo : 2 * yc - yTo;
      for (let j = 0; j <= 40; j += 1) {
        const s = j / 40;
        const bulge = Math.sin(Math.PI * s);
        const x = x0 + side * depth * Math.pow(bulge, 0.8);
        const y = y0 + (y1 - y0) * (0.5 - 0.5 * Math.cos(Math.PI * s));
        pts.push(new THREE.Vector3(x, y, 0));
      }
      out.push({ pts, k });
    }
  }
  return out;
}

export class FieldLines {
  constructor(maxLines = 48) {
    this.group = new THREE.Group(); this.group.name = 'fieldLines';
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
      uniforms: { uColor: { value: TONE.sense.clone() }, uOpacity: { value: 0.8 }, uPhase: { value: 0 }, uGrow: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; uniform float uPhase; uniform float uGrow; varying vec2 vUv; void main(){ float grow = step(vUv.x, uGrow); float flow = 0.6 + 0.4 * smoothstep(0.2, 0.5, fract(vUv.x * 6.0 - uPhase)); float edge = 1.0 - abs(vUv.y - 0.5) * 2.0; gl_FragColor = vec4(uColor, uOpacity * flow * grow * smoothstep(0.0, 0.6, edge)); }',
    });
    this.meshes = [];
    this.maxLines = maxLines; this.group.visible = false; this.group.renderOrder = 6;
  }
  build(key, sets, width = 0.0006, z = 0.0004) {
    if (this.key === key) return;
    this.key = key;
    for (const m of this.meshes) { m.geometry.dispose(); this.group.remove(m); }
    this.meshes = [];
    for (const s of sets) for (const l of s) {
      const pts = l.pts.map((p) => new THREE.Vector3(p.x, p.y, z));
      const m = new THREE.Mesh(ribbonGeometry(pts, width * (0.7 + 0.6 * (1 - l.k))), this.mat);
      m.renderOrder = 6; m.frustumCulled = false; this.meshes.push(m); this.group.add(m);
    }
  }
  set({ opacity = 1, phase = 0, grow = 1, tone = 'sense' }) {
    this.group.visible = opacity > 0.01;
    this.mat.uniforms.uOpacity.value = opacity * 0.85; this.mat.uniforms.uPhase.value = phase; this.mat.uniforms.uGrow.value = grow;
    this.mat.uniforms.uColor.value.copy(toneOf(tone));
  }
}

/* ------------------------------------------------------------------ glow trace along a path (circuit overlay, wire data dot) */
export class Trace {
  constructor() {
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, toneMapped: false, depthTest: false,
      uniforms: { uColor: { value: TONE.sense.clone() }, uOpacity: { value: 1 }, uHead: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; uniform float uHead; varying vec2 vUv; void main(){ if (vUv.x > uHead) discard; float head = exp(-pow((vUv.x - uHead) / 0.03, 2.0)); float edge = 1.0 - abs(vUv.y - 0.5) * 2.0; gl_FragColor = vec4(mix(uColor, vec3(1.0), head * 0.6) * (1.0 + head * 2.0), uOpacity * (0.55 + head * 0.45) * smoothstep(0.0, 0.5, edge)); }',
    });
    this.group = new THREE.Group(); this.meshes = [];
  }
  build(key, paths, width, normal) {
    if (this.key === key) return; this.key = key;
    for (const m of this.meshes) { m.geometry.dispose(); this.group.remove(m); }
    this.meshes = paths.map((p) => { const m = new THREE.Mesh(ribbonGeometry(p, width, normal), this.mat); m.renderOrder = 15; m.frustumCulled = false; this.group.add(m); return m; });
  }
  set({ opacity = 1, head = 1, tone = 'sense' }) { this.group.visible = opacity > 0.01; this.mat.uniforms.uOpacity.value = opacity; this.mat.uniforms.uHead.value = head; this.mat.uniforms.uColor.value.copy(toneOf(tone)); }
}
