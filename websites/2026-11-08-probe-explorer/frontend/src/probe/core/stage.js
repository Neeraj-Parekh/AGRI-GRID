// Renderer, environments and the post chain (AgX, HDRI/RoomEnvironment IBL, PCF shadows, GTAO, bloom, MSAA/SMAA).
// Quality tiers: high (desktop), medium, low (phones / slow GPUs). The adaptive monitor steps down
// AO → bloom → shadow resolution before any geometry is dropped.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

export const TIERS = {
  high: { dpr: 2, shadow: 2048, ao: true, bloom: true, msaa: 4, smaa: true, rice: 1 },
  medium: { dpr: 1.5, shadow: 2048, ao: false, bloom: true, msaa: 4, smaa: false, rice: 0.7 },
  low: { dpr: 1, shadow: 1024, ao: false, bloom: false, msaa: 0, smaa: false, rice: 0.45 },
};

export function pickTier(requested) {
  if (requested && TIERS[requested]) return requested;
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || Math.min(window.innerWidth, window.innerHeight) < 600;
  if (mobile) return 'medium';
  return (navigator.hardwareConcurrency || 4) >= 4 ? 'high' : 'medium';
}

export function createStage(container, { quality = 'auto', base = '/', fixedSize = null } = {}) {
  let tierName = pickTier(quality === 'auto' ? null : quality);
  const auto = quality === 'auto';
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true, alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor('#e9eef0');
  Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
  container.appendChild(renderer.domElement);

  const size = () => fixedSize ? { w: fixedSize[0], h: fixedSize[1] } : { w: container.clientWidth || 1280, h: container.clientHeight || 720 };

  // Environments
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envs = { studio: pmrem.fromScene(new RoomEnvironment(), 0.03).texture, field: null };
  const fieldEnvReady = new Promise((res) => {
    new HDRLoader().load(`${base}models/hdri/forest_slope_1k.hdr`, (t) => { t.mapping = THREE.EquirectangularReflectionMapping; envs.field = pmrem.fromEquirectangular(t).texture; t.dispose(); res(envs.field); }, undefined, () => { envs.field = envs.studio; res(envs.studio); });
  });

  // Post chain
  let composer = null, renderPass = null, gtao = null, bloom = null, smaa = null, output = null;
  const dummyScene = new THREE.Scene(), dummyCam = new THREE.PerspectiveCamera();
  function buildComposer() {
    const T = TIERS[tierName];
    composer?.dispose?.();
    const { w, h } = size();
    const dpr = Math.min(window.devicePixelRatio || 1, T.dpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    const rt = new THREE.WebGLRenderTarget(w * dpr, h * dpr, { type: THREE.HalfFloatType, samples: T.msaa });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(dpr); composer.setSize(w, h);
    renderPass = new RenderPass(dummyScene, dummyCam);
    composer.addPass(renderPass);
    gtao = null; bloom = null; smaa = null;
    if (T.ao) {
      gtao = new GTAOPass(dummyScene, dummyCam, w * dpr, h * dpr);
      gtao.output = GTAOPass.OUTPUT.Default; gtao.blendIntensity = 0.85;
      gtao.updateGtaoMaterial({ radius: 0.2, distanceExponent: 1.6, thickness: 1.2, scale: 1.0, samples: 12 });
      gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      composer.addPass(gtao);
    }
    if (T.bloom) { /* high threshold: only LEDs and data dots bloom */ bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.5, 3.2); composer.addPass(bloom); }
    output = new OutputPass(); composer.addPass(output);
    if (T.smaa) { smaa = new SMAAPass(); composer.addPass(smaa); }
  }
  buildComposer();

  // Adaptive quality
  const frameTimes = []; let lastDrop = 0;
  function monitor(dtMs, now) {
    if (!auto) return;
    frameTimes.push(dtMs); if (frameTimes.length > 90) frameTimes.shift();
    if (frameTimes.length < 90 || now - lastDrop < 4000) return;
    const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    if (avg > 40 && tierName !== 'low') { tierName = tierName === 'high' ? 'medium' : 'low'; lastDrop = now; frameTimes.length = 0; buildComposer(); }
  }

  const api = {
    renderer, envs, fieldEnvReady,
    get tier() { return tierName; },
    get tierSpec() { return TIERS[tierName]; },
    setTier(t) { if (TIERS[t] && t !== tierName) { tierName = t; buildComposer(); } },
    /** Render `scene` from `camera`; `focusDist` tunes the AO radius to the shot scale. */
    render(scene, camera, { focusDist = 1, viewOffset = null, toneMapping = THREE.AgXToneMapping, exposure = 1.0 } = {}) {
      renderer.toneMapping = toneMapping; renderer.toneMappingExposure = exposure;
      const { w, h } = size();
      if (viewOffset) camera.setViewOffset(w, h, viewOffset[0], viewOffset[1], w, h); else if (camera.view) camera.clearViewOffset();
      renderPass.scene = scene; renderPass.camera = camera;
      if (gtao) {
        gtao.scene = scene; gtao.camera = camera;
        gtao.updateGtaoMaterial({ radius: Math.max(0.002, focusDist * 0.045) });
      }
      composer.render();
    },
    resize() { buildComposer(); },
    monitor,
    size,
    snapshot(type = 'image/jpeg', q = 0.9) { return renderer.domElement.toDataURL(type, q); },
    dispose() { composer?.dispose?.(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
  return api;
}

/** Fit a directional light's shadow camera tightly around a subject sphere (centre, radius in metres). */
export function frameShadow(light, centre, radius, dir) {
  const d = dir.clone().normalize();
  light.position.copy(centre).addScaledVector(d, radius * 6 + 0.5);
  light.target.position.copy(centre);
  light.target.updateMatrixWorld();
  const cam = light.shadow.camera;
  cam.left = -radius; cam.right = radius; cam.top = radius; cam.bottom = -radius;
  cam.near = 0.01; cam.far = radius * 12 + 1;
  cam.updateProjectionMatrix();
  light.shadow.bias = -0.00015 * Math.max(1, radius * 4);
  light.shadow.normalBias = radius * 0.012;
}
