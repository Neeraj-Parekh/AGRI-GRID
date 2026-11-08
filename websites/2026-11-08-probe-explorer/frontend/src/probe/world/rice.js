// Rice built from curved leaf strips: each hill is a clump of tillers, each tiller a few leaves with
// several segments, twist and droop; height, angle and colour are seeded. Hills are instanced, and a
// vertex-shader sway runs on the timeline clock (uTime = t), so a paused frame is exact.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { seededRandom } from '../core/util.js';

function leafStrip(r, { len, width, lean, droop, twist, yaw, segs, base }) {
  const pos = [], col = [], nor = [], idx = [];
  const c0 = new THREE.Color('#3a6526'), c1 = new THREE.Color('#5f9233'), tipC = new THREE.Color('#8fa648');
  const hue = (r() - 0.5) * 0.04;
  for (let i = 0; i <= segs; i += 1) {
    const s = i / segs;
    // centreline: rises, leans outwards and droops quadratically near the tip
    const up = len * (s - droop * s * s * s * 0.9);
    const out = len * (lean * s + droop * 0.55 * s * s);
    const w = width * Math.sin(Math.PI * Math.min(1, 0.12 + s * 0.95)) * (1 - 0.65 * s);
    const tw = twist * s;
    const cx = Math.sin(yaw) * out, cz = Math.cos(yaw) * out, cy = base + up;
    // leaf blade across direction, rotated by twist around the centreline
    const ax = Math.cos(yaw) * Math.cos(tw), az = -Math.sin(yaw) * Math.cos(tw), ay = Math.sin(tw) * 0.4;
    pos.push(cx - ax * w / 2, cy - ay * w / 2, cz - az * w / 2, cx + ax * w / 2, cy + ay * w / 2, cz + az * w / 2);
    const c = c0.clone().lerp(c1, Math.min(1, s * 1.3)).lerp(tipC, Math.max(0, s - 0.8) * 2); c.offsetHSL(hue, 0, (r() - 0.5) * 0.03);
    col.push(c.r, c.g, c.b, c.r * 0.92, c.g * 0.92, c.b * 0.92);
    nor.push(Math.sin(yaw) * 0.5, 0.85, Math.cos(yaw) * 0.5, Math.sin(yaw) * 0.5, 0.85, Math.cos(yaw) * 0.5);
    if (i < segs) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

/** One rice hill (metres). detail 1 = hero, 0 = far LOD. */
export function riceHillGeometry(seed, { height = 0.55, detail = 1 } = {}) {
  const r = seededRandom(seed);
  const tillers = detail ? 9 : 5, leaves = detail ? 4 : 3, segs = detail ? 7 : 3;
  const parts = [];
  for (let t = 0; t < tillers; t += 1) {
    const yaw0 = (t / tillers) * Math.PI * 2 + r() * 0.6;
    const lean0 = 0.05 + r() * 0.12;
    // the tiller stem (a narrow pale strip pair)
    parts.push(leafStrip(r, { len: height * (0.35 + r() * 0.1), width: 0.006, lean: lean0 * 0.5, droop: 0.02, twist: 0, yaw: yaw0, segs: 2, base: 0 }));
    parts.push(leafStrip(r, { len: height * (0.35 + r() * 0.1), width: 0.006, lean: lean0 * 0.5, droop: 0.02, twist: 0, yaw: yaw0 + Math.PI / 2, segs: 2, base: 0 }));
    for (let l = 0; l < leaves; l += 1) {
      const len = height * (0.55 + r() * 0.5) * (1 - l * 0.08);
      parts.push(leafStrip(r, { len, width: 0.008 + r() * 0.003, lean: lean0 + 0.08 + r() * 0.18, droop: 0.25 + r() * 0.45, twist: (r() - 0.5) * 2.2, yaw: yaw0 + (r() - 0.5) * 0.9, segs, base: height * (0.06 + l * 0.05) }));
    }
  }
  const g = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return g;
}

/** Shared leaf material with a deterministic sway driven by uniforms.uTime. */
export function riceMaterial() {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0, side: THREE.DoubleSide });
  const u = { uTime: { value: 0 }, uWind: { value: 1 } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uWind;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #else
          vec3 ip = vec3(0.0);
        #endif
        float hgt = max(transformed.y, 0.0);
        float ph = ip.x * 3.1 + ip.z * 2.3;
        float sw = (sin(uTime * 1.3 + ph) * 0.6 + sin(uTime * 2.1 + ph * 1.7) * 0.25) * uWind;
        transformed.x += sw * hgt * hgt * 0.22;
        transformed.z += sw * hgt * hgt * 0.08;`);
  };
  mat.userData.u = u;
  return mat;
}

/**
 * Instanced field of hills. cells: [{x, z, seed}] (metres). Returns { group, setTime(t), material }.
 * Two LODs: hero hills (detail) and far hills.
 */
export function riceField(cells, { height = 0.55, heroTest = () => true, castShadow = true, tierScale = 1 } = {}) {
  const mat = riceMaterial();
  const group = new THREE.Group(); group.name = 'rice';
  const variants = 4;
  const hero = Array.from({ length: variants }, (_, i) => riceHillGeometry(101 + i * 17, { height, detail: 1 }));
  const far = Array.from({ length: variants }, (_, i) => riceHillGeometry(301 + i * 17, { height, detail: 0 }));
  const r = seededRandom(77);
  const buckets = { hero: Array.from({ length: variants }, () => []), far: Array.from({ length: variants }, () => []) };
  for (const c of cells) {
    if (tierScale < 1 && r() > tierScale && !heroTest(c)) continue;
    const v = Math.floor(r() * variants);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(c.x, c.y || 0, c.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * Math.PI * 2, 0)), new THREE.Vector3().setScalar(0.85 + r() * 0.3));
    (heroTest(c) ? buckets.hero : buckets.far)[v].push(m);
  }
  for (const kind of ['hero', 'far']) {
    buckets[kind].forEach((list, v) => {
      if (!list.length) return;
      const im = new THREE.InstancedMesh(kind === 'hero' ? hero[v] : far[v], mat, list.length);
      list.forEach((m, i) => im.setMatrixAt(i, m));
      im.instanceMatrix.needsUpdate = true; im.castShadow = castShadow && kind === 'hero'; im.receiveShadow = true;
      im.computeBoundingSphere();
      group.add(im);
    });
  }
  return { group, material: mat, setTime(t, wind = 1) { mat.userData.u.uTime.value = t; mat.userData.u.uWind.value = wind; } };
}
