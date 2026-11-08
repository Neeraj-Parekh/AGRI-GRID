// Pure physics and the deterministic soil-moisture model. No three.js, so node tests can import it.
import SPEC from './probe-spec.json' with { type: 'json' };

export { SPEC };

/** Topp et al. (1980): volumetric water content θ (m³/m³) from apparent permittivity ε. */
export function topp(eps) {
  const [a, b, c, d] = SPEC.physics.topp;
  return a + b * eps + c * eps * eps + d * eps * eps * eps;
}

/** Inverse of Topp by bisection (ε for a given θ), used by the moisture slider. */
export function toppInverse(theta) {
  let lo = 1, hi = 81;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (topp(mid) < theta) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Gravimetric volumetric water content: θ = (m_wet − m_dry) / (ρ_w · V). Masses in g, V in cm³. */
export function gravimetricTheta(mWet, mDry, volumeCm3, rhoW = 1) {
  return (mWet - mDry) / (rhoW * volumeCm3);
}

/**
 * Illustrative mapping from θ to an ESP32 touch count. The touch peripheral counts charge cycles,
 * and the count FALLS as capacitance rises. Numbers are illustrative until calibrated (see PROBE.md).
 */
export function touchCount(theta, bandIndex = 0, driftC = 0) {
  const base = 820 - bandIndex * 6; // dry-air count differs slightly per band (lead length)
  const span = 520;
  return Math.round(base - span * Math.min(1, Math.max(0, theta / 0.5)) + driftC * 1.8);
}

/** Smoothstep and helpers kept here so tests can use them without three.js. */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth01 = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
export const lerp = (a, b, k) => a + (b - a) * k;

/**
 * Seeded 1-D AWD drying model (illustrative): returns water level (mm, + above soil) and θ at depth z (mm, negative).
 * `day` runs 0..12. The perched water table falls through the soil after the surface water is gone.
 * Saturated θ ≈ 0.48, field drying toward ≈ 0.30 near the surface. Values are ILLUSTRATIVE.
 */
export function awdState(day) {
  // surface water: +50 mm at day 0 → 0 at day 4 (≈ 12 mm/day, typical ponded drawdown incl. ET + percolation)
  const surface = 50 - 12.5 * day;
  // once surface water is gone, the water table falls ~ 25 mm/day in puddled soil (illustrative)
  const table = surface > 0 ? 0 : -25 * (day - 4);
  const level = surface > 0 ? surface : table;
  const thetaAt = (z) => {
    if (z >= level) {
      // above the water table: drains toward field capacity, faster near the surface
      const above = level <= 0 ? (z - level) : 0;
      const dry = smooth01(above / 90);
      const surfaceBoost = smooth01((z + 60) / 60) * smooth01((day - 4) / 6) * 0.06; // surface layer dries more (ET)
      return 0.48 - 0.13 * dry - surfaceBoost;
    }
    return 0.48;
  };
  return { level, thetaAt, surfaceWater: Math.max(0, surface) };
}

/** Day at which the water level reaches the AWD threshold (−150 mm) in the illustrative model. */
export function awdTriggerDay() {
  return 4 + 150 / 25;
}

/** IPCC 2019 Refinement Tier 1 style methane estimate (defaults to be confirmed against Tables 5.11/5.12). */
export function methaneKg({ areaHa, days, efc = 1.19, sfw = 1.0 }) {
  return efc * sfw * days * areaHa;
}
