// Chapter 17, right half: a phone held in a soft, stylised 3D hand (palm and thumb only, wrist edge at the
// frame), on a quiet backdrop. The palm is a smooth signed-distance surface polygonised once with
// MarchingCubes; the thumb is built from capsules on a pivot so it can tap. The screen is a live canvas.
// Units: metres (built in mm, scaled 0.001). Phone screen faces +z.
import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { materials } from '../models/materials.js';
import { canvas2d, canvasTexture, roundRect, smooth01, clamp, lerp } from '../core/util.js';
import { frameShadow } from '../core/stage.js';

const PH = { w: 72, h: 150, d: 8, r: 9, bezel: 2.2 };

/* ------------------------------------------------------------------ SDF helpers (mm) */
const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
function sdCapsule(p, a, b, r) {
  const pax = p[0] - a[0], pay = p[1] - a[1], paz = p[2] - a[2];
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
  return len3(pax - bax * h, pay - bay * h, paz - baz * h) - r;
}
function sdEllipsoid(p, c, rad, rotZ = 0) {
  let x = p[0] - c[0], y = p[1] - c[1]; const z = p[2] - c[2];
  const cs = Math.cos(-rotZ), sn = Math.sin(-rotZ); const xr = x * cs - y * sn, yr = x * sn + y * cs; x = xr; y = yr;
  const k0 = len3(x / rad[0], y / rad[1], z / rad[2]); const k1 = len3(x / (rad[0] * rad[0]), y / (rad[1] * rad[1]), z / (rad[2] * rad[2]));
  return k0 * (k0 - 1) / k1;
}
const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); };

// Fingers wrap the phone's left edge from behind; tips curl over the edge without touching the glass.
const FINGERS = [
  { y: -6, r: 8.2 }, { y: -26, r: 8.6 }, { y: -46, r: 8.2 }, { y: -64, r: 7.0 },
];
function palmSDF(p) {
  let d = sdEllipsoid(p, [12, -50, -17.2], [42, 50, 13], -0.3); // palm, its front touches the phone back (z = −4)
  d = smin(d, sdEllipsoid(p, [36, -70, -6], [17, 25, 15], -0.5), 10); // thenar mound at the thumb base
  d = smin(d, sdCapsule(p, [36, -100, -16], [66, -175, -22], 27), 16); // wrist
  for (const f of FINGERS) {
    const k0 = [-6, f.y, -25], k1 = [-30, f.y + 1, -15], k2 = [-36 - f.r, f.y + 1.5, -2], k3 = [-36 - f.r + 3, f.y + 2, 9];
    let fd = sdCapsule(p, k0, k1, f.r * 1.05); fd = smin(fd, sdCapsule(p, k1, k2, f.r), 3); fd = smin(fd, sdCapsule(p, k2, k3, f.r * 0.9), 3);
    d = smin(d, fd, 7);
  }
  return d;
}

function buildPalm(resolution = 84) {
  const M = materials();
  const mc = new MarchingCubes(resolution, M.skin, false, false, 140000);
  mc.isolation = 0;
  const half = resolution / 2;
  // domain: x ∈ [−100, 100] mm (centre 0), y ∈ [−200, 0] (centre −100), z ∈ [−100, 100]
  const S = 100, cx = 0, cy = -100, cz = 0;
  const p = [0, 0, 0];
  for (let z = 0; z < resolution; z += 1) for (let y = 0; y < resolution; y += 1) for (let x = 0; x < resolution; x += 1) {
    p[0] = cx + ((x - half) / half) * S; p[1] = cy + ((y - half) / half) * S; p[2] = cz + ((z - half) / half) * S;
    const d = palmSDF(p);
    mc.field[x + y * resolution + z * resolution * resolution] = clamp(-d, -6, 6);
  }
  mc.update();
  const n = mc.count;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(mc.positionArray.slice(0, n * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(mc.normalArray.slice(0, n * 3), 3));
  g.scale(S, S, S); g.translate(cx, cy, cz);
  mc.geometry.dispose();
  const mesh = new THREE.Mesh(g, M.skin); mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = 'palm';
  return mesh;
}

/** Thumb on a pivot at its base joint; returns { group, setTap(k) }. */
function buildThumb() {
  const M = materials();
  const pivot = new THREE.Group(); pivot.name = 'thumbPivot'; pivot.position.set(40, -60, 4);
  const seg = (a, b, r) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const L = A.distanceTo(B); const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, L, 12, 40), M.skin); m.position.copy(A).lerp(B, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); m.castShadow = true; m.receiveShadow = true; return m; };
  // in pivot space: proximal then distal phalanx toward the screen centre, tip pad 6 mm above the glass at rest
  const j = [-15, 27, 9.5], tip = [-30, 49, 9.5];
  pivot.add(seg([0, 0, 0], j, 11.2), seg(j, tip, 9.6));
  const jointBall = new THREE.Mesh(new THREE.SphereGeometry(10.4, 40, 24), M.skin); jointBall.position.set(...j); pivot.add(jointBall);
  // nail on the top of the distal phalanx
  const nail = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), M.nail); nail.scale.set(6.2, 8.0, 1.6);
  const dir = new THREE.Vector3(...tip).sub(new THREE.Vector3(...j)).normalize();
  nail.position.set(...tip).addScaledVector(dir, -3.5); nail.position.z += 8.6; nail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); pivot.add(nail);
  // axis for the tap: in the screen plane, perpendicular to the thumb direction
  const axis = new THREE.Vector3(dir.y, -dir.x, 0).normalize();
  const rest = new THREE.Quaternion().setFromAxisAngle(axis, -0.06);
  return {
    group: pivot,
    tipLocal: new THREE.Vector3(...tip),
    /** k 0 (rest) → 1 (pad touches the glass). */
    setTap(k) { pivot.quaternion.copy(rest).multiply(new THREE.Quaternion().setFromAxisAngle(axis, 0.165 * smooth01(k))); },
  };
}

function buildPhone(screenTex) {
  const M = materials();
  const g = new THREE.Group(); g.name = 'phone';
  const shape = new THREE.Shape(); const { w, h, r } = PH; const x0 = -w / 2 + r, y0 = -h / 2 + r;
  roundShape(shape, -w / 2 + 1.6, -h / 2 + 1.6, w - 3.2, h - 3.2, r - 1.6);
  void x0; void y0;
  const frame = new THREE.ExtrudeGeometry(shape, { depth: PH.d - 3.2, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 1.6, bevelSegments: 8, curveSegments: 24 });
  frame.translate(0, 0, -(PH.d - 3.2) / 2);
  const body = new THREE.Mesh(frame, new THREE.MeshPhysicalMaterial({ color: '#2a2d31', roughness: 0.32, metalness: 0.6, clearcoat: 0.6, clearcoatRoughness: 0.2 }));
  body.castShadow = true; body.receiveShadow = true; g.add(body);
  // curved glass front (slightly inset), and the screen as a rounded-rect plane under it
  const glassShape = new THREE.Shape(); roundShape(glassShape, -w / 2 + 1.0, -h / 2 + 1.0, w - 2.0, h - 2.0, r - 1.0);
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(glassShape, 24), new THREE.MeshPhysicalMaterial({ color: '#0b0c0d', roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03 }));
  glass.position.z = PH.d / 2 + 0.01; g.add(glass);
  const sw = w - 2 * PH.bezel - 2, sh = h - 2 * PH.bezel - 2;
  const scrShape = new THREE.Shape(); roundShape(scrShape, -sw / 2, -sh / 2, sw, sh, r - 3);
  const sg = new THREE.ShapeGeometry(scrShape, 24);
  const p = sg.attributes.position, uv = sg.attributes.uv; for (let i = 0; i < p.count; i += 1) uv.setXY(i, (p.getX(i) + sw / 2) / sw, (p.getY(i) + sh / 2) / sh);
  const screen = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.z = PH.d / 2 + 0.03; g.add(screen);
  // glass reflection layer
  const refl = new THREE.Mesh(new THREE.ShapeGeometry(glassShape, 24), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.02, transparent: true, opacity: 0.035, clearcoat: 1, depthWrite: false }));
  refl.position.z = PH.d / 2 + 0.06; g.add(refl);
  // buttons on the right edge, camera island on the back
  for (const [y, l] of [[38, 22], [10, 12]]) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(1.0, l, 6, 16), M.aluminium); b.position.set(w / 2 + 0.4, y, 0); g.add(b); }
  return { group: g, screenSize: [sw, sh] };
}
function roundShape(s, x, y, w, h, r) {
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
}

/* ------------------------------------------------------------------ screen UI (canvas) */
const SCR = { W: 680, H: 1430 };
const DEV = "'Noto Sans Devanagari', Inter, system-ui, sans-serif";
function drawScreen(x, s) {
  const { W, H } = SCR;
  x.save();
  // base wallpaper
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0f3d2b'); g.addColorStop(0.55, '#1f6a45'); g.addColorStop(1, '#79c95b'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(255,255,255,.9)'; x.font = `600 26px ${DEV}`; x.textBaseline = 'middle';
  x.fillText('06:42', 40, 44); x.textAlign = 'right'; x.fillText('4G ▮▮▮  82%', W - 36, 44); x.textAlign = 'left';
  const lock = 1 - s.app; // lock screen + notification
  if (lock > 0.01) {
    x.globalAlpha = lock * (1 - s.thread);
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = `300 150px Inter, system-ui, sans-serif`; x.fillText('06:42', W / 2, 270);
    x.font = `500 32px ${DEV}`; x.fillText('गुरुवार, २३ ऑक्टोबर', W / 2, 370); x.textAlign = 'left';
    // notification card slides in
    const k = s.notif; if (k > 0.01) {
      const y = 470 - (1 - k) * 60; x.globalAlpha = lock * (1 - s.thread) * k;
      x.fillStyle = 'rgba(255,255,255,0.93)'; roundRect(x, 30, y, W - 60, 250, 34); x.fill();
      x.fillStyle = '#2F7D46'; roundRect(x, 58, y + 30, 54, 54, 14); x.fill(); x.fillStyle = '#fff'; x.font = '800 22px Inter, system-ui, sans-serif'; x.textAlign = 'center'; x.fillText('AG', 85, y + 58); x.textAlign = 'left';
      x.fillStyle = '#10261C'; x.font = '700 28px Inter, system-ui, sans-serif'; x.fillText('AGRI-GRID', 128, y + 48); x.fillStyle = '#7F8E86'; x.font = '500 22px Inter, system-ui, sans-serif'; x.fillText('SMS · now', 128, y + 78);
      x.fillStyle = '#10261C'; x.font = `500 30px ${DEV}`; wrap(x, s.sms, 58, y + 130, W - 120, 44, 3);
    }
    x.globalAlpha = 1;
  }
  if (s.thread > 0.01 && s.app < 0.99) {
    x.globalAlpha = s.thread * (1 - s.app);
    x.fillStyle = '#f3f6f1'; x.fillRect(0, 70, W, H - 70);
    x.fillStyle = '#ffffff'; x.fillRect(0, 70, W, 110); x.fillStyle = '#10261C'; x.font = '700 32px Inter, system-ui, sans-serif'; x.fillText('‹  AGRI-GRID', 30, 125);
    x.fillStyle = '#e4e9e2'; roundRect(x, 34, 230, W - 150, 290, 30); x.fill();
    x.fillStyle = '#10261C'; x.font = `500 31px ${DEV}`; wrap(x, s.sms, 62, 285, W - 210, 46, 5);
    x.fillStyle = '#7F8E86'; x.font = '500 21px Inter, system-ui, sans-serif'; wrap(x, s.smsEn, 62, 455, W - 210, 30, 2);
    // link button inside the thread
    x.fillStyle = '#2F7D46'; roundRect(x, 34, 560, 330, 72, 36); x.fill(); x.fillStyle = '#fff'; x.font = `700 28px ${DEV}`; x.fillText('ॲप उघडा  ›', 70, 598);
    x.globalAlpha = 1;
  }
  if (s.app > 0.01) {
    x.globalAlpha = s.app;
    x.fillStyle = '#F3F6F1'; x.fillRect(0, 70, W, H - 70);
    x.fillStyle = '#0F5B3A'; x.fillRect(0, 70, W, 130); x.fillStyle = '#fff'; x.font = '800 30px Inter, system-ui, sans-serif'; x.fillText('AGRI-GRID', 34, 120); x.font = `500 25px ${DEV}`; x.fillStyle = '#cfe8d6'; x.fillText(s.fieldName, 34, 165);
    // status ring
    const cx = W / 2, cy = 400, R = 130; x.lineWidth = 26; x.strokeStyle = '#E7ECE6'; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = '#E3A22C'; x.lineCap = 'round'; x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.72 * s.ring); x.stroke(); x.lineCap = 'butt';
    x.fillStyle = '#10261C'; x.textAlign = 'center'; x.font = '800 66px Inter, system-ui, sans-serif'; x.fillText(s.level, cx, cy - 6); x.font = `500 25px ${DEV}`; x.fillStyle = '#4E5F56'; x.fillText(s.levelLabel, cx, cy + 50); x.textAlign = 'left';
    // plan card
    x.fillStyle = '#fff'; roundRect(x, 30, 580, W - 60, 190, 28); x.fill();
    x.fillStyle = '#7F8E86'; x.font = `600 22px ${DEV}`; x.fillText(s.planLabel, 60, 625);
    x.fillStyle = '#10261C'; x.font = `700 36px ${DEV}`; wrap(x, s.plan, 60, 680, W - 120, 48, 2);
    // 3-day rain strip
    x.fillStyle = '#fff'; roundRect(x, 30, 800, W - 60, 190, 28); x.fill();
    x.fillStyle = '#7F8E86'; x.font = `600 22px ${DEV}`; x.fillText(s.rainLabel, 60, 845);
    s.rain.forEach((d, i) => { const bx = 60 + i * 200; x.fillStyle = '#10261C'; x.font = `600 24px ${DEV}`; x.fillText(d.day, bx, 895); x.fillStyle = '#2F86C9'; x.font = '700 34px Inter, system-ui, sans-serif'; x.fillText(`${d.mm} mm`, bx, 950); });
    // call button
    x.fillStyle = '#2F7D46'; roundRect(x, 30, 1030, W - 60, 100, 50); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = `700 30px ${DEV}`; x.fillText(s.call, W / 2, 1082); x.textAlign = 'left';
    x.fillStyle = '#7F8E86'; x.font = '500 20px Inter, system-ui, sans-serif'; x.textAlign = 'center'; x.fillText(s.foot, W / 2, 1180); x.textAlign = 'left';
    x.globalAlpha = 1;
  }
  // tap ripple
  if (s.tap > 0.01 && s.tap < 0.99) { x.strokeStyle = `rgba(255,255,255,${0.7 * (1 - s.tap)})`; x.lineWidth = 6; x.beginPath(); x.arc(s.tapX, s.tapY, 20 + 90 * s.tap, 0, Math.PI * 2); x.stroke(); }
  x.restore();
}
function wrap(x, text, px, py, maxW, lh, maxLines = 4) {
  const words = String(text).split(' '); let line = ''; let n = 0;
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (x.measureText(t).width > maxW && line) { x.fillText(line, px, py + n * lh); n += 1; line = w; if (n >= maxLines) return; } else line = t; }
  if (line) x.fillText(line, px, py + n * lh);
}

export function createPhoneWorld(stage, { base = '/' } = {}) {
  const scene = new THREE.Scene(); scene.name = 'phone';
  scene.environment = stage.envs.studio; scene.environmentIntensity = 0.55;
  scene.background = new THREE.Color('#eef1ec');
  const hemi = new THREE.HemisphereLight('#ffffff', '#d8ddd6', 0.6); scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff4e8', 1.7); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#e8f0ff', 0.8); rim.position.set(-1, 0.6, -1); scene.add(rim);
  // soft backdrop card behind the hand (catches the shadow)
  const back = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshStandardMaterial({ color: '#e9ede7', roughness: 0.95 })); back.position.z = -0.09; back.receiveShadow = true; scene.add(back);

  const [canvas, ctx] = canvas2d(SCR.W, SCR.H);
  const tex = canvasTexture(canvas); tex.anisotropy = 8;
  const root = new THREE.Group(); root.scale.setScalar(0.001); scene.add(root);
  const phone = buildPhone(tex); root.add(phone.group);
  const palm = buildPalm(stage.tier === 'low' ? 64 : 84); root.add(palm);
  const thumb = buildThumb(); root.add(thumb.group);
  root.rotation.set(-0.06, -0.14, 0.06);
  key.position.set(0.25, 0.35, 0.5); key.target.position.set(0, -0.03, 0); frameShadow(key, new THREE.Vector3(0, -0.04, 0), 0.16, new THREE.Vector3(0.5, 0.7, 1));

  let lastKey = '';
  const fontReady = (typeof FontFace !== 'undefined')
    ? new FontFace('Noto Sans Devanagari', `url(${base}fonts/NotoSansDevanagari.ttf)`).load().then((f) => { document.fonts.add(f); lastKey = ''; }).catch(() => {})
    : Promise.resolve();
  return {
    scene, phone, palm, thumb, root, key, fontReady, toneMapping: THREE.NeutralToneMapping, exposure: 0.95,
    /** s: screen state (see drawScreen); tap 0..1 drives the thumb. */
    set(s) {
      const k = JSON.stringify([s.notif, s.thread, s.app, s.ring, s.tap, s.sms, s.plan].map((v) => (typeof v === 'number' ? Math.round(v * 60) / 60 : v)));
      thumb.setTap(s.thumb || 0);
      if (k === lastKey) return; lastKey = k;
      drawScreen(ctx, s); tex.needsUpdate = true;
    },
  };
}
