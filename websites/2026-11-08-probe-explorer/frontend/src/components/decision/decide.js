// Pure decision logic shared by the dashboard cards. No React here, so it is easy to test.

// Linear-regression slope of a {v} series, in units per sample.
export function slope(series) {
  const n = series.length; if (n < 2) return 0;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  series.forEach((p, i) => { sx += i; sy += p.v; sxy += i * p.v; sxx += i * i; });
  return (n * sxy - sx * sy) / (n * sxx - sx * sx);
}

// AWD threshold per IRRI: re-irrigate when the water table reaches 15 cm below the soil surface.
export const AWD_THRESHOLD_CM = -15;

/**
 * Forecast days until the AWD threshold.
 * level: current water level (cm, + above soil, − below), series: recent readings, samplesPerDay,
 * rain3dMm: forecast rain over next 3 days (mm).
 */
export function forecastIrrigation({ level, series, samplesPerDay = 48, rain3dMm = null }) {
  const perDay = slope(series) * samplesPerDay; // cm/day, negative when drying
  if (level <= AWD_THRESHOLD_CM) return { status: 'irrigate', days: 0, perDay };
  if (perDay >= -0.05) return { status: 'stable', days: null, perDay };
  const days = (level - AWD_THRESHOLD_CM) / -perDay;
  const rainHold = rain3dMm != null && rain3dMm >= 10 && days < 3;
  return { status: rainHold ? 'rain-hold' : days < 2 ? 'soon' : 'ok', days, perDay };
}

// Neighbour comparison: flags a node draining much faster than the median of the others.
export function spatialAnomaly(rates) { // rates: [{id, perDay}]
  const vals = rates.map(r => r.perDay).sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  return rates.map(r => ({ ...r, ratio: med < 0 ? r.perDay / med : 0, anomalous: med < 0 && r.perDay / med > 4 }));
}

/**
 * Field decision: one sentence plus the evidence behind it.
 */
export function decide({ field, nodes, forecast, discrepancy }) {
  const alert = nodes.find(n => n.status === 'alert');
  const evidence = [];
  let action, tone;
  if (discrepancy) {
    action = `Hold. Ground and satellite disagree on ${field.id}; an agronomist will check before any advice goes out.`; tone = 'review';
    evidence.push('Discrepancy between node readings and the SAR water map');
  } else if (alert) {
    action = `Inspect the bund at ${alert.id} today. It is losing water much faster than its neighbours.`; tone = 'alert';
    evidence.push(`${alert.id}: ${alert.water} cm, others ${nodes.filter(n => n !== alert).map(n => n.water).join(' / ')} cm`);
  } else if (forecast.status === 'irrigate') {
    action = `Irrigate ${field.id} today: water is 15 cm below the surface.`; tone = 'act';
  } else if (forecast.status === 'rain-hold') {
    action = `Don't irrigate ${field.id} yet. Rain is forecast and the field still has ${forecast.days.toFixed(1)} days of water.`; tone = 'ok';
  } else if (forecast.status === 'soon') {
    action = `Plan to irrigate ${field.id} within ${Math.max(1, Math.round(forecast.days))} day(s).`; tone = 'watch';
  } else {
    action = `No irrigation needed on ${field.id}. Keep drying: that is what cuts methane.`; tone = 'ok';
  }
  if (forecast.days != null) evidence.push(`Drying at ${Math.abs(forecast.perDay).toFixed(2)} cm/day; −15 cm reached in about ${forecast.days.toFixed(1)} days`);
  evidence.push(`Water now ${field.water} cm · soil moisture ${field.moisture}%`);
  return { action, tone, evidence };
}

/**
 * Methane avoided by AWD, IPCC Tier 1 style.
 * EF_c: baseline emission factor (kg CH4/ha/day) for continuously flooded fields.
 * SF_w: water-regime scaling factor for multiple drainage (AWD).
 * GWP: 100-year global warming potential of methane.
 * Defaults are placeholders taken from the IPCC 2019 Refinement (Vol. 4, Ch. 5); confirm the exact
 * values in Tables 5.11 and 5.12 before quoting results.
 */
export const IPCC_DEFAULTS = { EF_c: 1.19, SF_w_awd: 0.55, GWP: 27 };
export function methaneAvoided({ areaHa, days, EF_c = IPCC_DEFAULTS.EF_c, SF_w_awd = IPCC_DEFAULTS.SF_w_awd, GWP = IPCC_DEFAULTS.GWP }) {
  const baseline = EF_c * areaHa * days;          // kg CH4 if continuously flooded
  const awd = baseline * SF_w_awd;                 // kg CH4 under AWD
  const avoided = baseline - awd;
  return { baseline, awd, avoided, co2eT: (avoided * GWP) / 1000 };
}
