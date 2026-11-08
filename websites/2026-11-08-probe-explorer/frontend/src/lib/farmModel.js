// Turns a site + live open data into the dashboard's farm: fields, sensor nodes, gateways, alerts, KPIs.
//
// What is REAL: field boundaries (OpenStreetMap or your own trace), areas computed from them,
// weather, rainfall, ET0 and modelled soil moisture (Open-Meteo), soil texture/pH/carbon (SoilGrids),
// crop stage from the crop calendar of that region.
// What is SIMULATED: individual node readings and the paddy water level. They are derived from the
// real numbers above plus a stable per-field offset, so they move with real weather but are not
// measurements. The UI labels them that way.
import { areaHa, centroid, distM, inPoly, spreadPoints, rectPoly, rng, hash, clamp } from './geo.js';
import { cropToday, seasonLabel } from '../data/sites.js';

const FLOODED = new Set(['Transplanting', 'Tillering', 'Panicle initiation', 'Flowering', 'Grain filling']);

function soilHydro(soil) {
  const clay = soil?.clay ?? 30, silt = soil?.silt ?? 30;
  const fc = clamp(0.08 + 0.0045 * clay + 0.002 * silt, 0.14, 0.45); // field capacity (m3/m3), texture rule-of-thumb
  const pwp = clamp(0.02 + 0.0042 * clay, 0.04, 0.3);                // wilting point
  return { fc, pwp, sat: clamp(fc + 0.12, 0.3, 0.55) };
}

function ndviFor(cropInfo, stress) {
  if (/fallow/i.test(cropInfo.crop) || /Land prep/.test(cropInfo.stage)) return 0.17;
  if (/sugarcane/i.test(cropInfo.crop)) return clamp(0.5 + 0.3 * Math.sin(Math.PI * Math.min(1, cropInfo.progress * 1.3)) - stress * 0.18, 0.2, 0.86);
  const f = cropInfo.progress, peak = Math.sin(Math.PI * Math.min(1, f * 1.15));
  return clamp(0.22 + 0.6 * peak - stress * 0.2, 0.15, 0.88);
}

// --- choose fields: traced first, then OSM polygons near the anchor, then approximate plots ---
function pickFields(site, osm, traced) {
  const anchor = [site.lat, site.lng], out = [];
  for (const t of traced || []) out.push({ poly: t.poly, src: 'traced', name: t.name, tags: {} });
  const cands = (osm || []).map(o => ({ ...o, area: areaHa(o.poly), c: centroid(o.poly) }))
    .filter(o => o.area >= 0.15 && o.area <= 80)
    .map(o => ({ ...o, d: distM(anchor, o.c), score: distM(anchor, o.c) / site.radiusM + (o.area > 12 ? (o.area - 12) / 25 : 0) + (o.area < 0.35 ? 0.25 : 0) }))
    .sort((a, b) => a.score - b.score);
  // one farm = one compact cluster: seed on the candidate with the most neighbours within 600 m
  // (ties go to the one nearer the anchor), then take fields nearest that seed.
  if (cands.length > 8) {
    const top = cands.slice(0, 40);
    let seed = top[0], best = -1;
    for (const c of top) { const n = top.filter(o => distM(o.c, c.c) < 600).length - c.score * 0.5; if (n > best) { best = n; seed = c; } }
    cands.sort((a, b) => distM(a.c, seed.c) - distM(b.c, seed.c));
  }
  for (const o of cands) {
    if (out.length >= 8) break;
    if (out.some(f => inPoly(o.c[0], o.c[1], f.poly) || distM(centroid(f.poly), o.c) < 25)) continue;
    out.push({ poly: o.poly, src: 'osm', osmId: o.osmId, name: o.tags.name, tags: o.tags });
  }
  if (out.length < 3) {
    // No mapped fields here (or offline): lay out approximate plots so the demo still works, clearly marked.
    const r = rng(site.id), rot = r() * 30 - 15, cols = 4, rows = 2, w = 150, h = 95, gap = 14;
    for (let i = 0; out.length < 8 && i < cols * rows; i++) {
      const cx = (i % cols - (cols - 1) / 2) * (w + gap), cy = (Math.floor(i / cols) - (rows - 1) / 2) * (h + gap);
      const t = rot * Math.PI / 180, mLat = 1 / 111320, mLng = 1 / (111320 * Math.cos(site.lat * Math.PI / 180));
      const c = [site.lat + (cx * Math.sin(t) + cy * Math.cos(t)) * mLat, site.lng + (cx * Math.cos(t) - cy * Math.sin(t)) * mLng];
      out.push({ poly: rectPoly(c, w * (0.8 + r() * 0.3), h * (0.8 + r() * 0.3), rot), src: 'approx', tags: {} });
    }
  }
  return out;
}

function cropFromTags(tags, today) {
  const c = (tags.crop || '').toLowerCase();
  if (/rice|paddy/.test(c)) return { ...today, crop: today.paddy ? today.crop : 'Paddy (off-season)', paddy: today.paddy };
  if (/sugar/.test(c)) return { ...today, crop: 'Sugarcane', paddy: false };
  if (tags.landuse === 'orchard') return { ...today, crop: 'Orchard', paddy: false, stage: 'Perennial', progress: 0.6 };
  if (tags.landuse === 'meadow') return { ...today, crop: 'Fodder / grass', paddy: false, stage: 'Vegetative', progress: 0.5 };
  return today;
}

// group fields into ESP-NOW clusters (nodes within ~450 m share one gateway)
function clusterFields(fields) {
  const groups = [];
  for (const f of fields) {
    const g = groups.find(g => g.some(o => distM(o.center, f.center) < 450));
    if (g) g.push(f); else groups.push([f]);
  }
  return groups;
}

const fmtTime = d => d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

export function buildFarm({ site, weather, soil, power, osm, traced, date = new Date() }) {
  const today = cropToday(site, date);
  const soilUsed = soil || site.soilFallback;
  const hyd = soilHydro(soilUsed);
  const wx = weather || null;
  const baseVwc = wx?.soilNow?.sm3 ?? (today.paddy ? hyd.sat - 0.03 : (hyd.fc + hyd.pwp) / 2);
  const rain7 = wx?.rain7 ?? null, et7 = wx?.et7 ?? null;
  const balance = rain7 != null && et7 != null ? rain7 - et7 : 0;
  const tNow = wx?.current?.tempC ?? 28;
  const updated = fmtTime(wx?.fetchedAt ? new Date(wx.fetchedAt) : date);

  const picked = pickFields(site, osm, traced);
  const fields = picked.map((p, i) => {
    const r = rng(`${site.id}:${p.osmId || i}`);
    const crop = cropFromTags(p.tags, today);
    const ha = +areaHa(p.poly).toFixed(2);
    const center = centroid(p.poly);
    const k = 0.82 + r() * 0.32;                         // field-to-field variation in drainage/levelling
    const vwc = clamp(baseVwc * k, hyd.pwp + 0.01, hyd.sat);
    const rel = clamp((vwc - hyd.pwp) / (hyd.fc - hyd.pwp), 0, 1.25);
    let level = null;
    if (crop.paddy) {
      if (FLOODED.has(crop.stage)) level = clamp(3 + balance / 5 + (r() - 0.5) * 9 - (k < 0.9 ? 6 : 0), -19, 10);
      else if (crop.stage === 'Maturity') level = clamp(-6 + (r() - 0.5) * 6, -16, 0);
      else level = clamp(1 + (r() - 0.5) * 4, -4, 6);
      level = +level.toFixed(1);
    }
    const stress = crop.paddy ? (level != null && level < -10 ? (-10 - level) / 10 : 0) : clamp(0.75 - rel, 0, 0.75);
    let state = 'normal';
    if (crop.paddy && level != null) state = level <= -15 ? 'alert' : level <= -8 ? 'watch' : 'normal';
    else if (!/Fallow|Orchard/.test(crop.crop)) state = rel < 0.42 ? 'alert' : rel < 0.62 ? 'watch' : 'normal';
    const ndvi = +ndviFor(crop, stress).toFixed(2);
    const id = `${site.code}-${String(i + 1).padStart(2, '0')}`;
    const moisturePct = Math.round((level != null && level > 0 ? hyd.sat : vwc) * 100);
    return {
      id, name: p.name || `Plot ${i + 1}`, src: p.src, osmId: p.osmId || null, poly: p.poly, center,
      crop: crop.crop, paddy: crop.paddy, stage: crop.stage, progress: crop.progress, daysIn: crop.daysIn, daysLeft: crop.daysLeft,
      area: ha, state, ndvi, health: Math.round(clamp(ndvi / 0.82, 0, 1) * 100),
      water: level, moisture: moisturePct, vwc: +vwc.toFixed(3), rel: +rel.toFixed(2),
      temp: +(tNow + (r() - 0.5) * 1.4).toFixed(1),
      awd: crop.paddy && FLOODED.has(crop.stage) ? `Cycle ${1 + Math.floor(crop.daysIn / 14)} (Day ${1 + crop.daysIn % 14})` : 'N/A',
      updated, seed: hash(id),
      nodes: 0,
    };
  });

  // nodes + gateways
  const nodes = [], gateways = [], links = [];
  const groups = clusterFields(fields);
  groups.forEach((g, gi) => {
    const c = [g.reduce((s, f) => s + f.center[0], 0) / g.length, g.reduce((s, f) => s + f.center[1], 0) / g.length];
    // put the gateway on the edge of the cluster nearest the anchor (a farmhouse with power)
    const toward = [site.lat - c[0], site.lng - c[1]], n = Math.hypot(...toward) || 1;
    const gw = { id: `GW-${gi + 1}`, lat: c[0] + toward[0] / n * 0.0006, lng: c[1] + toward[1] / n * 0.0006, fields: g.map(f => f.id) };
    if (g.length === 1) { gw.lat = c[0]; gw.lng = c[1]; }
    gateways.push(gw);
  });
  let leakUsed = false;
  fields.forEach((f, fi) => {
    const r = rng(f.seed + 7);
    const count = f.area < 0.8 ? 3 : f.area < 5 ? 4 : 5;
    const pts = spreadPoints(f.poly, count, r);
    const gw = gateways.find(g => g.fields.includes(f.id));
    // at most one field per farm shows a bund-leak node (demo of neighbour-anomaly detection)
    const leakIdx = !leakUsed && f.paddy && f.water != null && f.water > -8 && (f.seed % 3 === 0) ? 1 : -1;
    if (leakIdx >= 0) leakUsed = true;
    pts.forEach(([lat, lng], ni) => {
      const id = `${String.fromCharCode(65 + ni)}${fi + 1}`;
      const d = distM([lat, lng], [gw.lat, gw.lng]);
      const leak = ni === leakIdx;
      const water = f.water == null ? null : +(leak ? f.water - 4 - r() * 1.5 : f.water + (r() - 0.5) * 2.4).toFixed(1);
      const moisture = clamp(Math.round(f.moisture + (r() - 0.5) * 6 - (leak ? 9 : 0)), 5, 60);
      let status = 'normal';
      if (f.paddy && water != null) status = leak ? 'alert' : water <= -15 ? 'alert' : water <= -8 ? 'watch' : 'normal';
      else status = f.state;
      nodes.push({
        id, fieldId: f.id, zone: `${f.id.split('-')[1]}${String.fromCharCode(65 + ni)}`, lat, lng, water, moisture,
        temp: +(f.temp + (r() - 0.5) * 0.8).toFixed(1), batt: Math.round(62 + r() * 36),
        rssi: Math.round(clamp(-40 - 18 * Math.log10(Math.max(d, 5)), -95, -40)), dist: Math.round(d),
        status, leak, gw: gw.id, updated: wx?.current?.time ? wx.current.time.slice(11, 16) : '--:--',
      });
      links.push({ from: [lat, lng], to: [gw.lat, gw.lng], hops: d > 380 ? 2 : 1, nodeId: id });
    });
    f.nodes = pts.length;
    if (leakIdx >= 0) f.state = 'alert';
  });

  // per-field series for sparklines (real hourly shapes, field-scaled)
  const series = {};
  for (const f of fields) {
    const k = f.vwc / (baseVwc || 0.3);
    const soil48 = (wx?.soil48?.length ? wx.soil48 : Array.from({ length: 48 }, (_, i) => baseVwc * (1 - i * 0.001)))
      .map((v, i) => ({ t: i, v: +((v ?? baseVwc) * k * 100).toFixed(1) }));
    const temp48 = (wx?.temp48?.length ? wx.temp48 : Array.from({ length: 48 }, (_, i) => tNow - 4 * Math.cos((i - 14) / 24 * 2 * Math.PI)))
      .map((v, i) => ({ t: i, v: +(v ?? tNow).toFixed(1) }));
    let water48 = null;
    if (f.water != null) {
      const per = (-0.6 - (1 - Math.min(1, (f.rel || 1))) * 0.8) / 24 + (balance > 0 ? 0.02 : 0); // cm/hour drawdown
      water48 = Array.from({ length: 48 }, (_, i) => ({ t: i, v: +(f.water - per * (47 - i)).toFixed(2) }));
    }
    series[f.id] = { soil48, temp48, water48 };
  }

  const alerts = [];
  for (const f of fields) {
    const leakNode = nodes.find(n => n.fieldId === f.id && n.leak);
    if (leakNode) alerts.push({ id: `AL-${f.id}-leak`, sev: 'crit', field: f.id, node: `Node ${leakNode.id}`, title: 'Possible bund leak', why: `${leakNode.id} reads ${leakNode.water} cm while the rest of ${f.id} sits near ${f.water} cm. A single node draining far faster than its neighbours usually means a breach, not normal drying.` });
    else if (f.state === 'alert') alerts.push({ id: `AL-${f.id}`, sev: 'crit', field: f.id, node: f.name, title: f.paddy ? 'Irrigate: AWD threshold reached' : 'Soil moisture critically low', why: f.paddy ? `Water table ${f.water} cm, at or below the IRRI −15 cm AWD trigger.` : `Root-zone moisture ${f.moisture}% (≈${Math.round(f.rel * 100)}% of plant-available water).` });
    else if (f.state === 'watch') alerts.push({ id: `AL-${f.id}-w`, sev: 'warn', field: f.id, node: f.name, title: f.paddy ? 'Drying: plan irrigation' : 'Moisture falling', why: f.paddy ? `Water ${f.water} cm and falling; −15 cm in a few days unless it rains.` : `Moisture ${f.moisture}% — irrigate within 2–3 days if no rain.` });
  }
  if (wx && wx.rain3f >= 10) alerts.push({ id: 'AL-rain', sev: 'info', field: site.short, node: 'Forecast', title: `${wx.rain3f} mm rain in next 3 days`, why: 'Hold irrigation on fields that are not yet at threshold.' });

  const normal = fields.filter(f => f.state === 'normal').length;
  const paddy = fields.filter(f => f.paddy && f.awd !== 'N/A');
  const kpis = {
    total: fields.length, normal, attention: fields.length - normal,
    normalPct: fields.length ? Math.round(normal / fields.length * 100) : 0,
    watch: fields.filter(f => f.state === 'watch').length, alert: fields.filter(f => f.state === 'alert').length,
    nodes: nodes.length, gateways: gateways.length,
    areaHa: +fields.reduce((s, f) => s + f.area, 0).toFixed(1),
    awd: paddy.length ? `${paddy.filter(f => f.state !== 'alert').length} / ${paddy.length}` : '—',
    meanNdvi: fields.length ? +(fields.reduce((s, f) => s + f.ndvi, 0) / fields.length).toFixed(2) : null,
  };

  const srcCount = picked.reduce((m, p) => ({ ...m, [p.src]: (m[p.src] || 0) + 1 }), {});
  return {
    site, crop: today, season: seasonLabel(date), soil: soilUsed, soilIsLive: !!soil, hydro: hyd,
    weather: wx, power, fields, nodes, gateways, links, series, alerts, kpis, updated,
    boundarySource: srcCount.osm ? 'OpenStreetMap' : srcCount.traced ? 'Your trace' : 'Approximate',
    srcCount,
  };
}
