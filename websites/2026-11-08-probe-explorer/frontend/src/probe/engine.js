// Probe Explorer engine: one renderer, lazily built worlds, one effect set per world, a deterministic
// timeline (every visible state is a pure function of the global time T), camera modes and record mode.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createStage } from './core/stage.js';
import { createField } from './world/field.js';
import { createBench } from './world/bench.js';
import { createFarm } from './world/farm.js';
import { createPhoneWorld } from './world/phone.js';
import { PulseRings, SweepSheet, LockBrackets, Marker, TagSet, Packets, LinkLines, FieldLines, Trace } from './fx/scanfx.js';
import { buildTimeline, locate, CHAPTERS } from './director/chapters.js';
import { INTERACTIVE, SPEC_CARDS } from './director/interactive.js';

/** DOM tag layer: crisp result tags (not tone-mapped), positioned every frame from 3D anchors. */
function makeTagLayer(container) {
  const layer = document.createElement('div'); layer.className = 'px-tags';
  container.appendChild(layer);
  const pool = [];
  const v = new THREE.Vector3();
  return {
    layer,
    set(tags, camera, w, h, offsetX = 0) {
      const list = (tags || []).filter((t) => t.opacity > 0.01);
      while (pool.length < list.length) { const el = document.createElement('div'); el.className = 'px-tag'; el.innerHTML = '<i></i><b></b><small></small>'; layer.appendChild(el); pool.push({ el, key: '' }); }
      pool.forEach((p, i) => {
        const t = list[i];
        if (!t) { p.el.style.display = 'none'; return; }
        v.copy(t.pos).project(camera);
        const behind = v.z > 1;
        const x = (v.x * 0.5 + 0.5) * w - offsetX, y = (-v.y * 0.5 + 0.5) * h;
        const key = `${t.text}|${t.sub || ''}|${t.tone || 'sense'}`;
        if (p.key !== key) { p.key = key; p.el.dataset.tone = t.tone || 'sense'; p.el.children[1].textContent = t.text; p.el.children[2].textContent = t.sub || ''; p.el.children[2].style.display = t.sub ? '' : 'none'; }
        p.el.style.display = behind ? 'none' : '';
        p.el.style.opacity = String(t.opacity);
        const ax = t.anchorX ?? 0; p.el.style.transform = `translate(${x}px, ${y}px) translate(${-ax * 100}%, -50%)`;
        p.el.classList.toggle('sm', (t.h || 1) < 0.9);
      });
    },
    clear() { pool.forEach((p) => { p.el.style.display = 'none'; }); },
  };
}

function makeFx(scene) {
  const fx = {
    rings: [new PulseRings(), new PulseRings()], sweep: new SweepSheet(), lock: new LockBrackets(), marker: new Marker(),
    tags: new TagSet(14), packets: new Packets(12), links: new LinkLines(10), lines: new FieldLines(), trace: new Trace(),
  };
  for (const o of [...fx.rings, fx.sweep, fx.lock, fx.marker, fx.tags, fx.packets, fx.links, fx.lines, fx.trace]) scene.add(o.group);
  fx.hideAll = () => {
    fx.rings.forEach((r) => r.hide()); fx.sweep.hide(); fx.lock.hide(); fx.marker.hide();
    fx.packets.set([]); fx.links.set([]); fx.lines.set({ opacity: 0 }); fx.trace.set({ opacity: 0 }); fx.tags.set([]);
  };
  fx.hideAll();
  return fx;
}

const OVERVIEW = {
  field: { eye: [1.1, 0.8, 1.9], target: [-0.1, 0, -0.3], fov: 36 },
  bench: { eye: [0.2, 0.5, 0.9], target: [0, 0.1, 0], fov: 34 },
  farm: { eye: [12, 10, 18], target: [-2, 0, 1], fov: 40 },
  phone: { eye: [0.04, -0.01, 0.42], target: [0, -0.025, 0], fov: 30 },
};

export function createEngine(container, opts = {}) {
  const base = opts.base || '/';
  const stage = createStage(container, { quality: opts.quality || 'auto', base, fixedSize: opts.fixedSize || null });
  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.005, 400);
  const worlds = {}; const fxs = {};
  const builders = { field: () => createField(stage), bench: () => createBench(stage), farm: () => createFarm(stage), phone: () => createPhoneWorld(stage, { base }) };
  const world = (name) => { if (!worlds[name]) { worlds[name] = builders[name](); fxs[name] = makeFx(worlds[name].scene); } return worlds[name]; };

  let settings = { variant: 'prototype', hideCosts: false, lang: 'en', hidden: [], ...opts.settings };
  let tl = buildTimeline(settings.hidden, opts.hold || 0);
  let T = 0, playing = false, speed = 1, camMode = 'follow', destroyed = false;
  let controls = null;
  let last = null, frameNo = 0, lastHud = 0, dirty = true, lastPaint = 0;
  let current = null; // { seg, local, out }
  let inter = null; // interactive mode { mode, params }
  const onFrame = opts.onFrame || (() => {});
  const tmp = new THREE.Vector3();
  const tagLayer = makeTagLayer(container); let tagsOn = true; let inset = 0;

  function ctxFor(worldName) {
    return {
      get field() { return world('field'); }, get bench() { return world('bench'); }, get farm() { return world('farm'); }, get phone() { return world('phone'); },
      fx: fxs[worldName], camera, settings,
    };
  }

  function applyCamera(cam, worldName) {
    if (camMode === 'free' && controls) { controls.update(); return; }
    const c = camMode === 'overview' ? OVERVIEW[worldName] : cam;
    camera.position.set(...c.eye); camera.lookAt(tmp.set(...c.target)); camera.fov = c.fov;
    // portrait / narrow screens: keep the horizontal extent a 16:9 frame would show (shots are composed for 16:9)
    if (camera.aspect < 1.5) camera.fov = Math.min(78, (2 * Math.atan(Math.tan((c.fov * Math.PI) / 360) * (16 / 9) / camera.aspect) * 180) / Math.PI * 0.82 + c.fov * 0.18);
    const d = camera.position.distanceTo(tmp);
    camera.near = Math.max(0.001, d * 0.012); camera.far = Math.min(500, Math.max(30, d * 240));
    camera.updateProjectionMatrix();
    if (controls) controls.target.copy(tmp);
  }

  /** Evaluate the frame at global time T (pure), returns the chapter output. */
  function evaluate() {
    if (inter) {
      const def = INTERACTIVE[inter.mode]; world(def.world); const fx = fxs[def.world]; fx.hideAll();
      const out = def.frame(ctxFor(def.world), inter.params, T) || {};
      const { w, h } = stage.size(); camera.aspect = w / h; applyCamera(out.cam, def.world);
      current = { seg: { ch: { n: 0, id: inter.mode, title: 'Explore', world: def.world, honesty: out.honesty || '' }, t0: 0, t1: 0, dur: 0 }, local: 0, out };
      return current;
    }
    const loc = locate(tl, T); if (!loc) return null;
    const { seg, local } = loc; const ch = seg.ch;
    world(ch.world);
    if (ch.world === 'phone') world('phone');
    const fx = fxs[ch.world]; fx.hideAll();
    const out = ch.frame(ctxFor(ch.world), local) || {};
    // tags: constant screen size (world height ∝ distance)
    const { w, h } = stage.size(); camera.aspect = w / h;
    applyCamera(out.cam, ch.world);
    current = { seg, local, out };
    return current;
  }

  function render() {
    if (!current) return;
    const { seg, out } = current; const wName = seg.ch.world; const wd = worlds[wName];
    const { w } = stage.size();
    const viewOffset = out.split ? [-w * 0.25 * out.split, 0] : inset !== 0 && !out.noInset ? [-inset * 0.5, 0] : null;
    stage.render(wd.scene, camera, { focusDist: camera.position.distanceTo(tmp), viewOffset, toneMapping: wd.toneMapping, exposure: wd.exposure || 1 });
    const sz = stage.size();
    if (tagsOn) tagLayer.set(out.tags, camera, sz.w, sz.h, 0); else tagLayer.clear();
  }

  function emit(force = false) {
    if (!current) return;
    const now = performance.now();
    if (!force && now - lastHud < 50) return;
    lastHud = now;
    const { seg, local, out } = current;
    onFrame({ T, total: tl.total, segs: tl.segs, seg, ch: seg.ch, local, hud: out.hud || {}, split: out.split || 0, dim: out.dim || 0, playing, speed, camMode, tier: stage.tier });
  }

  let visible = true;
  const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((e) => { visible = e[0].isIntersecting; }) : null;
  io?.observe(container);

  function loop(ts) {
    if (destroyed) return;
    requestAnimationFrame(loop);
    const dt = last == null ? 0 : Math.min(0.1, (ts - last) / 1000); last = ts;
    if (!visible || document.hidden) return;
    // paused: re-render only when something changed (plus a slow refresh for async textures/fonts)
    if (!playing && !dirty && camMode !== 'free' && ts - lastPaint < 700) return;
    dirty = false; lastPaint = ts;
    if (playing) {
      T += dt * speed;
      if (T >= tl.total) { T = opts.loop ? 0 : tl.total; if (!opts.loop) playing = false; }
    }
    evaluate(); render(); emit(!playing);
    stage.monitor(dt * 1000, ts); frameNo += 1;
  }
  requestAnimationFrame(loop);

  // hover / tap: spec card for the part under the pointer
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); let lastHover = 0;
  const keyOf = (o) => {
    for (let q = o; q; q = q.parent) {
      const n = q.name || '';
      if (/^(lower|upper)[AB]$/.test(n)) return n.slice(0, 5);
      if (SPEC_CARDS[n]) return n;
      if (n === 'stakeTube') return 'stake';
    }
    return null;
  };
  const onPointer = (e) => {
    if (!opts.onHover || !current) return;
    const now = performance.now(); if (now - lastHover < 90 && e.type === 'pointermove') return; lastHover = now;
    const r = stage.renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const wd = worlds[current.seg.ch.world]; if (!wd) return;
    const hits = ray.intersectObjects(wd.scene.children, true).filter((h) => h.object.visible && h.object.isMesh && !h.object.material?.transparent);
    const k = hits.length ? keyOf(hits[0].object) : null;
    opts.onHover(k ? { key: k, title: SPEC_CARDS[k][0], text: SPEC_CARDS[k][1], x: e.clientX - r.left, y: e.clientY - r.top, sx: r.width / (stage.size().w || r.width) } : null);
  };
  stage.renderer.domElement.addEventListener('pointermove', onPointer);
  stage.renderer.domElement.addEventListener('pointerdown', onPointer);

  const onResize = () => { if (!opts.fixedSize) stage.resize(); dirty = true; evaluate(); render(); };
  window.addEventListener('resize', onResize);

  const api = {
    stage, camera, worlds, CHAPTERS,
    get T() { return T; }, get total() { return tl.total; }, get timeline() { return tl; }, get playing() { return playing; },
    play() { if (T >= tl.total - 0.01) T = 0; playing = true; last = null; emit(true); },
    pause() { playing = false; emit(true); },
    toggle() { (playing ? api.pause : api.play)(); },
    seek(t) { T = Math.max(0, Math.min(tl.total, t)); dirty = true; evaluate(); render(); emit(true); },
    seekChapter(n, local = 0) { const s = tl.segs.find((q) => q.ch.n === n); if (s) api.seek(s.t0 + local); },
    setSpeed(s) { speed = s; emit(true); },
    setTags(on) { tagsOn = !!on; render(); },
    /** Interactive mode (moisture | explode | replay) with params, or null to return to the timeline. */
    setInteractive(mode, params) { inter = mode ? { mode, params: { ...(INTERACTIVE[mode].defaults || {}), ...(params || {}) } } : null; if (mode) playing = false; dirty = true; evaluate(); render(); emit(true); },
    /** (left edge + right edge − width) of the free area in px; the 3D view is re-centred in it. */
    setInset(px) { inset = px; dirty = true; render(); },
    setSettings(s) {
      const hiddenChanged = JSON.stringify(s.hidden || settings.hidden) !== JSON.stringify(settings.hidden);
      const curN = current?.seg.ch.n, curLocal = current?.local || 0;
      settings = { ...settings, ...s };
      if (hiddenChanged) { tl = buildTimeline(settings.hidden, opts.hold || 0); const seg = tl.segs.find((q) => q.ch.n === curN); T = seg ? seg.t0 + curLocal : 0; }
      if (s.quality) stage.setTier(s.quality === 'auto' ? stage.tier : s.quality);
      dirty = true; evaluate(); render(); emit(true);
    },
    setCamMode(m) {
      camMode = m;
      if (m === 'free' && !controls) { controls = new OrbitControls(camera, stage.renderer.domElement); controls.enableDamping = false; }
      if (controls) controls.enabled = m === 'free';
      evaluate(); render(); emit(true);
    },
    /** Render the current frame now (for screenshots / recording). */
    renderNow() { evaluate(); render(); return stage.renderer.domElement; },
    /** Build the remaining worlds one per idle slot, so playback never stalls on a big build. */
    warm(names = ['field', 'bench', 'farm', 'phone']) {
      const todo = names.filter((n) => !worlds[n]);
      const idle = window.requestIdleCallback || ((f) => setTimeout(f, 400));
      const step = () => { if (destroyed || !todo.length) return; const n = todo.shift(); world(n); try { stage.renderer.compile(worlds[n].scene, camera); } catch { /* compile on first draw instead */ } idle(step, { timeout: 4000 }); };
      idle(step, { timeout: 4000 });
    },
    ready: Promise.all([stage.fieldEnvReady]),
    dispose() { destroyed = true; tagLayer.layer.remove(); window.removeEventListener('resize', onResize); io?.disconnect(); controls?.dispose(); stage.dispose(); },
  };
  return api;
}
