// Live open data, fetched from the browser (all free, no API key, CORS-enabled):
//   Open-Meteo        weather, ET0, modelled soil moisture        https://open-meteo.com
//   ISRIC SoilGrids   soil texture, organic carbon, pH (250 m)     https://soilgrids.org
//   NASA POWER        30-day rainfall and solar radiation          https://power.larc.nasa.gov
//   OpenStreetMap     real field boundaries via Overpass API       https://overpass-api.de
//   Nominatim         place search for adding your own farm       https://nominatim.org
// Each result is cached in localStorage so the demo still opens offline after one visit.

const TTL = { weather: 30 * 60e3, power: 12 * 3600e3, soil: 30 * 864e5, fields: 30 * 864e5 };

function cacheGet(key, ttl) {
  try { const v = JSON.parse(localStorage.getItem('ag:' + key)); if (v && Date.now() - v.t < ttl) return v.d; } catch { /* storage unavailable */ }
  return null;
}
function cacheStale(key) { try { return JSON.parse(localStorage.getItem('ag:' + key))?.d ?? null; } catch { return null; } }
function cacheSet(key, d) { try { localStorage.setItem('ag:' + key, JSON.stringify({ t: Date.now(), d })); } catch { /* quota or private mode */ } }

async function getJSON(url, ms = 9000, init) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// Wraps a fetcher: fresh cache -> network -> stale cache -> null. Returns { data, src: 'live'|'cache'|'stale'|'none' }
async function cached(key, ttl, fn) {
  const fresh = cacheGet(key, ttl); if (fresh) return { data: fresh, src: 'cache' };
  try { const d = await fn(); cacheSet(key, d); return { data: d, src: 'live' }; }
  catch (e) { const s = cacheStale(key); return s ? { data: s, src: 'stale' } : { data: null, src: 'none', error: String(e.message || e) }; }
}

const k4 = v => (+v).toFixed(4);

export function fetchWeather(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${k4(lat)}&longitude=${k4(lng)}` +
    '&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,is_day' +
    '&hourly=temperature_2m,soil_moisture_0_to_1cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm,soil_temperature_6cm' +
    '&daily=precipitation_sum,et0_fao_evapotranspiration,temperature_2m_max,temperature_2m_min,sunrise,sunset' +
    '&past_days=14&forecast_days=4&timezone=Asia%2FKolkata';
  return cached(`wx:${k4(lat)},${k4(lng)}`, TTL.weather, async () => {
    const d = await getJSON(url);
    const H = d.hourly || {}, D = d.daily || {};
    // index of the current hour in the hourly arrays
    const nowIso = (d.current?.time || '').slice(0, 13);
    let hi = (H.time || []).findIndex(t => t.slice(0, 13) === nowIso); if (hi < 0) hi = Math.max(0, (H.time || []).length - 4 * 24);
    const pick = (arr, i) => (arr && arr[i] != null ? arr[i] : null);
    const todayIdx = Math.max(0, (D.time || []).findIndex(t => t === (d.current?.time || '').slice(0, 10)));
    const sum = (arr, a, b) => (arr || []).slice(a, b).reduce((s, v) => s + (v || 0), 0);
    return {
      fetchedAt: new Date().toISOString(),
      current: {
        tempC: d.current?.temperature_2m ?? null, rh: d.current?.relative_humidity_2m ?? null,
        precip: d.current?.precipitation ?? 0, cloud: d.current?.cloud_cover ?? null,
        wind: d.current?.wind_speed_10m ?? null, isDay: d.current?.is_day ?? 1, time: d.current?.time,
      },
      soilNow: { sm0: pick(H.soil_moisture_0_to_1cm, hi), sm3: pick(H.soil_moisture_3_to_9cm, hi), sm9: pick(H.soil_moisture_9_to_27cm, hi), st6: pick(H.soil_temperature_6cm, hi) },
      // last 48 h of root-zone soil moisture (3-9 cm), for sparklines
      soil48: (H.soil_moisture_3_to_9cm || []).slice(Math.max(0, hi - 47), hi + 1),
      temp48: (H.temperature_2m || []).slice(Math.max(0, hi - 47), hi + 1),
      soil9_48: (H.soil_moisture_9_to_27cm || []).slice(Math.max(0, hi - 47), hi + 1),
      daily: (D.time || []).map((t, i) => ({ date: t, rain: D.precipitation_sum?.[i] ?? 0, et0: D.et0_fao_evapotranspiration?.[i] ?? 0, tmax: D.temperature_2m_max?.[i], tmin: D.temperature_2m_min?.[i], sunrise: D.sunrise?.[i], sunset: D.sunset?.[i], forecast: i > todayIdx })),
      todayIdx,
      rain7: +sum(D.precipitation_sum, todayIdx - 6, todayIdx + 1).toFixed(1),
      et7: +sum(D.et0_fao_evapotranspiration, todayIdx - 6, todayIdx + 1).toFixed(1),
      rain3f: +sum(D.precipitation_sum, todayIdx + 1, todayIdx + 4).toFixed(1),
    };
  });
}

export function fetchSoil(lat, lng) {
  const props = ['clay', 'sand', 'silt', 'soc', 'phh2o', 'bdod'];
  const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${k4(lng)}&lat=${k4(lat)}&` +
    props.map(p => `property=${p}`).join('&') + '&depth=0-5cm&depth=15-30cm&value=mean';
  return cached(`soil:${k4(lat)},${k4(lng)}`, TTL.soil, async () => {
    const d = await getJSON(url, 14000);
    const out = { depths: {} };
    for (const L of d.properties?.layers || []) {
      const f = L.unit_measure?.d_factor || 1;
      for (const dep of L.depths || []) {
        const v = dep.values?.mean; if (v == null) continue;
        (out.depths[dep.label] ||= {})[L.name] = +(v / f).toFixed(2);
      }
    }
    const top = out.depths['0-5cm'] || {};
    if (top.clay == null) throw new Error('no soil data here (water/urban pixel)');
    // SoilGrids units after d_factor: clay/sand/silt %, soc g/kg, phh2o pH, bdod kg/dm3
    return { clay: top.clay, sand: top.sand, silt: top.silt, soc: top.soc, ph: top.phh2o, bdod: top.bdod, sub: out.depths['15-30cm'] || null };
  });
}

const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, '');
export function fetchPower(lat, lng) {
  const end = new Date(Date.now() - 2 * 864e5), start = new Date(end.getTime() - 34 * 864e5);
  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,ALLSKY_SFC_SW_DWN,T2M&community=AG` +
    `&longitude=${k4(lng)}&latitude=${k4(lat)}&start=${ymd(start)}&end=${ymd(end)}&format=JSON`;
  return cached(`power:${k4(lat)},${k4(lng)}`, TTL.power, async () => {
    const d = await getJSON(url, 15000);
    const P = d.properties?.parameter || {};
    const vals = o => Object.values(o || {}).filter(v => v != null && v > -900);
    const rain = vals(P.PRECTOTCORR), sun = vals(P.ALLSKY_SFC_SW_DWN), t = vals(P.T2M);
    if (!rain.length) throw new Error('POWER returned no data yet');
    return { days: rain.length, rain30: +rain.slice(-30).reduce((a, b) => a + b, 0).toFixed(1), solar: +(sun.reduce((a, b) => a + b, 0) / (sun.length || 1)).toFixed(2), t2m: +(t.reduce((a, b) => a + b, 0) / (t.length || 1)).toFixed(1) };
  });
}

// Real field boundaries from OpenStreetMap. Tries several public Overpass mirrors.
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
export function fetchOsmFields(lat, lng, radiusM = 2500) {
  const q = `[out:json][timeout:25];(way["landuse"~"^(farmland|paddy|orchard|meadow|plant_nursery|greenhouse_horticulture)$"](around:${radiusM},${k4(lat)},${k4(lng)});way["crop"](around:${radiusM},${k4(lat)},${k4(lng)}););out tags geom 400;`;
  return cached(`osm:${k4(lat)},${k4(lng)},${radiusM}`, TTL.fields, async () => {
    let last;
    for (const ep of OVERPASS) {
      try {
        const d = await getJSON(ep, 25000, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        return (d.elements || []).filter(e => e.type === 'way' && e.geometry?.length >= 4).map(e => ({
          osmId: e.id, tags: e.tags || {},
          poly: e.geometry.slice(0, -1).map(g => [+g.lat.toFixed(6), +g.lon.toFixed(6)]),
        }));
      } catch (e) { last = e; }
    }
    throw last || new Error('Overpass unavailable');
  });
}

export async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&limit=6&q=${encodeURIComponent(query)}`;
  const d = await getJSON(url, 9000, { headers: { 'Accept-Language': 'en' } });
  return d.map(r => ({ name: r.display_name, lat: +r.lat, lng: +r.lon, type: r.type }));
}

// Tile layers used by the map (all free for non-commercial use with attribution).
export const TILES = {
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxNativeZoom: 19, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' },
  sentinel: { url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/g/{z}/{y}/{x}.jpg', maxNativeZoom: 14, attribution: '<a href="https://s2maps.eu">Sentinel-2 cloudless</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2023)' },
  map: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', maxNativeZoom: 19, subdomains: 'abcd', attribution: '© OpenStreetMap contributors © CARTO' },
  labels: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', maxNativeZoom: 19, subdomains: 'abcd', attribution: '' },
};
// MODIS Terra 16-day NDVI from NASA GIBS (250 m), date ~3 weeks back so a composite exists.
export function ndviTileUrl(date = new Date()) {
  const d = new Date(date.getTime() - 21 * 864e5).toISOString().slice(0, 10);
  return { url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_NDVI_16Day/default/${d}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`, maxNativeZoom: 9, attribution: 'NDVI: NASA EOSDIS GIBS, MODIS Terra 16-day', date: d };
}

export const googleMapsLink = (lat, lng, metres = 600) => `https://www.google.com/maps/@${(+lat).toFixed(6)},${(+lng).toFixed(6)},${metres}m/data=!3m1!1e3`;
export const googleEarthLink = (lat, lng) => `https://earth.google.com/web/@${lat},${lng},600a,1500d,35y,0h,0t,0r`;
