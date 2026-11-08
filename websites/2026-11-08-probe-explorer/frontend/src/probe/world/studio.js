// Product studio: seamless cyclorama, soft key + fill + rim, RoomEnvironment reflections.
// Used for the product beats (meet the probe, print and build, the prints, inside the node, calibration).
import * as THREE from 'three';
import { frameShadow } from '../core/stage.js';
import { canvas2d, canvasTexture } from '../core/util.js';

export function createStudio(stage) {
  const scene = new THREE.Scene();
  scene.environment = stage.envs.studio;
  scene.environmentIntensity = 0.45;
  scene.background = new THREE.Color('#e8ecea');
  scene.fog = new THREE.Fog('#e8ecea', 3.5, 9);

  // Cyclorama: floor that curves up into the back wall (radius 0.6 m), 8 m wide
  const shape = [];
  const R = 0.6;
  for (let i = 0; i <= 24; i += 1) { const a = (i / 24) * (Math.PI / 2); shape.push([-2.2 + 0, 0]); void a; }
  const prof = [];
  prof.push(new THREE.Vector2(3.5, 0));
  for (let i = 0; i <= 24; i += 1) { const a = (i / 24) * (Math.PI / 2); prof.push(new THREE.Vector2(-1.4 - Math.sin(a) * R, R - Math.cos(a) * R)); }
  prof.push(new THREE.Vector2(-2.0, 4));
  // extrude profile along x by building a ribbon
  const W = 8, segX = 2;
  const pos = [], nor = [], uv = [], idx = [];
  for (let i = 0; i < prof.length; i += 1) {
    const p = prof[i];
    const q = prof[Math.min(prof.length - 1, i + 1)], o = prof[Math.max(0, i - 1)];
    const tz = q.x - o.x, ty = q.y - o.y; const L = Math.hypot(tz, ty) || 1; const nz = -ty / L, ny = tz / L;
    for (let j = 0; j <= segX; j += 1) {
      const x = -W / 2 + (j / segX) * W;
      pos.push(x, p.y, p.x); nor.push(0, ny, -nz); uv.push(j / segX, i / (prof.length - 1));
    }
  }
  for (let i = 0; i < prof.length - 1; i += 1) for (let j = 0; j < segX; j += 1) {
    const a = i * (segX + 1) + j, b = a + 1, c = a + segX + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  const [cv, cx] = canvas2d(16, 256); const grd = cx.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, '#f1f3f1'); grd.addColorStop(0.55, '#e9edeb'); grd.addColorStop(1, '#dfe4e2'); cx.fillStyle = grd; cx.fillRect(0, 0, 16, 256);
  const cyc = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#ffffff', map: canvasTexture(cv), roughness: 0.92, metalness: 0, side: THREE.DoubleSide }));
  cyc.receiveShadow = true; cyc.name = 'cyclorama';
  scene.add(cyc);

  const hemi = new THREE.HemisphereLight('#ffffff', '#cfd6d3', 0.35); scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff6ea', 1.9); key.castShadow = true;
  key.shadow.mapSize.set(stage.tierSpec.shadow, stage.tierSpec.shadow); key.shadow.radius = 6; key.shadow.blurSamples = 16;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight('#e6f0ff', 0.55); fill.position.set(-3, 1.5, 2); scene.add(fill);
  const rim = new THREE.DirectionalLight('#ffffff', 0.9); rim.position.set(1.5, 2.5, -3); scene.add(rim);
  const keyDir = new THREE.Vector3(1.2, 2.4, 1.6);

  return {
    scene, key, fill, rim, hemi,
    /** Keep the shadow tight around the current subject. */
    frame(centre, radius) { frameShadow(key, centre, radius, keyDir); },
  };
}
