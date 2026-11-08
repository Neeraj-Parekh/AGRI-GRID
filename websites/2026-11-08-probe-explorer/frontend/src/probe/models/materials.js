// Physically based materials. Values follow the fidelity rules (PETG matte, copper metallic, brushed steel…).
import * as THREE from 'three';
import { layerLinesNormal, grainNormal, brushed, sectionHatch, mudTop, soilFace, bundEarth, waterNormal, soilDetail } from '../core/textures.js';

let M = null;

export function materials() {
  if (M) return M;
  const layers = layerLinesNormal(); layers.repeat.set(1, 1);
  const grain = grainNormal();
  const br = brushed();
  M = {
    petgBlack: new THREE.MeshPhysicalMaterial({ color: '#202326', roughness: 0.62, metalness: 0, normalMap: layers, normalScale: new THREE.Vector2(0.35, 0.35), clearcoat: 0.04, clearcoatRoughness: 0.6, sheen: 0.15, sheenColor: new THREE.Color('#5a6066'), sheenRoughness: 0.8 }),
    petgWhite: new THREE.MeshPhysicalMaterial({ color: '#eceee9', roughness: 0.55, metalness: 0, normalMap: grain, normalScale: new THREE.Vector2(0.12, 0.12) }),
    petgSmoke: new THREE.MeshPhysicalMaterial({ color: '#2d3236', roughness: 0.35, metalness: 0, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }),
    section: new THREE.MeshStandardMaterial({ map: sectionHatch(), roughness: 0.8, metalness: 0, side: THREE.DoubleSide }),
    sectionWhite: new THREE.MeshStandardMaterial({ color: '#d9dbd6', roughness: 0.8, side: THREE.DoubleSide }),
    copper: new THREE.MeshPhysicalMaterial({ color: '#d98a5f', roughness: 0.34, metalness: 1, clearcoat: 0.2, clearcoatRoughness: 0.4 }),
    copperWet: new THREE.MeshBasicMaterial({ color: '#3a86c8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.NormalBlending }),
    steel: new THREE.MeshPhysicalMaterial({ color: '#b9bec2', roughness: 0.42, metalness: 1, normalMap: br.normal, normalScale: new THREE.Vector2(0.25, 0.25), roughnessMap: br.rough, anisotropy: 0.35, anisotropyRotation: Math.PI / 2, envMapIntensity: 0.55 }),
    epoxy: new THREE.MeshPhysicalMaterial({ color: '#b98d4a', roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.78 }),
    nylon: new THREE.MeshPhysicalMaterial({ color: '#cfd0cb', roughness: 0.42, metalness: 0, normalMap: grain, normalScale: new THREE.Vector2(0.08, 0.08), sheen: 0.2, sheenColor: new THREE.Color('#ffffff') }),
    rubber: new THREE.MeshStandardMaterial({ color: '#232527', roughness: 0.92, metalness: 0 }),
    cable: new THREE.MeshPhysicalMaterial({ color: '#1b1c1e', roughness: 0.48, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.5 }),
    solder: new THREE.MeshStandardMaterial({ color: '#c4c8cb', roughness: 0.3, metalness: 1, envMapIntensity: 0.7 }),
    tin: new THREE.MeshStandardMaterial({ color: '#c0c4c6', roughness: 0.36, metalness: 1, envMapIntensity: 0.7 }),
    brass: new THREE.MeshStandardMaterial({ color: '#c9a24c', roughness: 0.3, metalness: 1 }),
    gold: new THREE.MeshStandardMaterial({ color: '#e0b860', roughness: 0.25, metalness: 1 }),
    aluminium: new THREE.MeshPhysicalMaterial({ color: '#d4d7d9', roughness: 0.38, metalness: 1, normalMap: br.normal, normalScale: new THREE.Vector2(0.15, 0.15) }),
    pcbBlack: new THREE.MeshStandardMaterial({ color: '#1c252c', roughness: 0.45 }),
    plasticBlack: new THREE.MeshStandardMaterial({ color: '#17191b', roughness: 0.5 }),
    plasticWhite: new THREE.MeshStandardMaterial({ color: '#efefea', roughness: 0.45 }),
    pvcGrey: new THREE.MeshPhysicalMaterial({ color: '#a7aaa7', roughness: 0.5, normalMap: grain, normalScale: new THREE.Vector2(0.05, 0.05) }),
    bamboo: new THREE.MeshPhysicalMaterial({ color: '#b89a63', roughness: 0.6, clearcoat: 0.2, clearcoatRoughness: 0.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.04, metalness: 0, transmission: 0.9, thickness: 0.8, ior: 1.5, transparent: true, opacity: 0.3 }),
    clearLid: new THREE.MeshPhysicalMaterial({ color: '#e8f1f3', roughness: 0.12, metalness: 0, transparent: true, opacity: 0.28, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.05 }),
    led: (c = '#3dff7a') => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 9, roughness: 0.3 }),
    wire: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.42, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
  };

  // Soil cut face: horizons texture + moisture darkening driven by a 1-D θ(z) profile texture.
  const sf = soilFace();
  const prof = new Uint8Array(256 * 4);
  const profileTex = new THREE.DataTexture(prof, 256, 1, THREE.RGBAFormat); profileTex.needsUpdate = true; profileTex.minFilter = profileTex.magFilter = THREE.LinearFilter;
  const soilU = { uProfile: { value: profileTex }, uTable: { value: -1.0 }, uSaturate: { value: 0 }, uDetail: { value: soilDetail() } };
  M.soilFaceU = soilU;
  M.soilFaceProfile = profileTex;
  const soilFaceMat = new THREE.MeshStandardMaterial({ map: sf.map, normalMap: sf.normal, normalScale: new THREE.Vector2(0.32, 0.32), roughness: 0.92, metalness: 0 });
  soilFaceMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, soilU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos; uniform sampler2D uProfile; uniform float uTable; uniform sampler2D uDetail;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec3 det = texture2D(uDetail, vWPos.xy * 18.0 + vWPos.zy * 18.0).rgb;
        diffuseColor.rgb *= mix(vec3(1.0), det * 1.55, 0.55);
        float depth01 = clamp(-vWPos.y / 0.5, 0.0, 1.0);
        float wet = texture2D(uProfile, vec2(depth01, 0.5)).r;
        diffuseColor.rgb *= mix(1.08, 0.62, wet);
        float nearTable = 1.0 - smoothstep(0.0, 0.006, abs(vWPos.y - uTable));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.30, 0.52, 0.66), nearTable * 0.45 * step(-0.45, uTable));`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.42, wet * 0.8);`);
  };
  M.soilFace = soilFaceMat;
  M.soilFaceTex = sf;

  const mt = mudTop(); mt.map.repeat.set(3, 3); mt.normal.repeat.set(3, 3);
  M.mud = new THREE.MeshStandardMaterial({ map: mt.map, normalMap: mt.normal, normalScale: new THREE.Vector2(1.1, 1.1), roughness: 0.55, metalness: 0, color: '#d8d2ca' });
  const be = bundEarth(); be.map.repeat.set(2, 2); be.normal.repeat.set(2, 2);
  M.bund = new THREE.MeshStandardMaterial({ map: be.map, normalMap: be.normal, roughness: 0.95, metalness: 0 });
  M.bundFace = new THREE.MeshStandardMaterial({ map: sf.map, normalMap: sf.normal, roughness: 0.95, color: '#c9b49a' });
  const wn = waterNormal(); wn.repeat.set(6, 6);
  M.waterNormal = wn;
  M.water = new THREE.MeshPhysicalMaterial({ color: '#7fb2c2', roughness: 0.04, metalness: 0, transmission: 0.0, transparent: true, opacity: 0.62, normalMap: wn, normalScale: new THREE.Vector2(0.18, 0.18), ior: 1.33, depthWrite: false, envMapIntensity: 1.4, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.02 });
  M.waterFace = new THREE.MeshPhysicalMaterial({ color: '#5f99ad', roughness: 0.1, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
  M.skin = new THREE.MeshPhysicalMaterial({ color: '#b27b5c', roughness: 0.52, metalness: 0, sheen: 0.55, sheenColor: new THREE.Color('#f2c2a8'), sheenRoughness: 0.45, clearcoat: 0.08, clearcoatRoughness: 0.6 });
  M.nail = new THREE.MeshPhysicalMaterial({ color: '#e3bfae', roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  M.leaf = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, metalness: 0, side: THREE.DoubleSide, vertexColors: false });
  return M;
}
