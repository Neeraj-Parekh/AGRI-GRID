import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Droplets, Sprout, AlertTriangle, Radio, CloudRain, Thermometer, Wind, Leaf, MapPinned, ExternalLink, RefreshCw, CheckCircle2, Eye, Gauge, MessageSquare, Database, Battery, Signal, Satellite } from 'lucide-react';
import { useSite } from '../context/SiteContext.jsx';
import SiteSwitcher from '../components/dash/SiteSwitcher.jsx';
import FarmMap from '../components/dash/FarmMap.jsx';
import { Spark, Ring, RainEtChart, Lines48, TextureBar, CountUp } from '../components/dash/charts.jsx';
import SkyBanner from '../components/three/SkyBanner.jsx';
import { ImpactLedger } from '../components/decision/DecisionCards.jsx';
import { fieldDecision, smsText, LANGS, siteLang } from '../lib/advice.js';
import { googleMapsLink, googleEarthLink } from '../lib/openData.js';
import '../components/dash/dash.css';

const STATE_TXT = { normal: 'Healthy', watch: 'Watch', alert: 'Act now' };
const TONE = { ok: ['d-tone-ok', CheckCircle2], watch: ['d-tone-watch', Eye], act: ['d-tone-act', Droplets], alert: ['d-tone-alert', AlertTriangle] };

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30e3); return () => clearInterval(t); }, []);
  return now;
}
function partOfDay(h) { return h < 5 ? 'Night' : h < 7.5 ? 'Dawn' : h < 11 ? 'Morning' : h < 15.5 ? 'Noon' : h < 17.5 ? 'Afternoon' : h < 19.3 ? 'Dusk' : 'Night'; }

function SourceDot({ s }) {
  const map = { live: ['live', 'Live'], cache: ['live', 'Cached'], stale: ['stale', 'Offline copy'], none: ['off', 'Unavailable'], loading: ['load', 'Loading'] };
  const [c, t] = map[s] || map.loading;
  return <span className={`d-src d-src-${c}`}><i />{t}</span>;
}

function Kpi({ icon, label, value, decimals = 0, suffix = '', sub, tone = 'leaf', i }) {
  return (
    <div className={`d-card d-kpi d-rise d-kpi-${tone}`} style={{ '--d': `${80 + i * 60}ms` }}>
      <div className="d-kpi-ic">{icon}</div>
      <div className="d-kpi-v">{typeof value === 'number' ? <CountUp value={value} decimals={decimals} suffix={suffix} /> : value}</div>
      <div className="d-kpi-l">{label}</div>
      {sub && <div className="d-kpi-s">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const { site, farm, status, refresh, addTrace, traces, clearTraces } = useSite();
  const [sel, setSel] = useState(null);
  const [mode, setMode] = useState('satellite');
  const now = useClock();
  useEffect(() => { setSel(null); }, [site.id]);
  const fields = farm.fields;
  const f = fields.find(x => x.id === sel) || fields.find(x => x.state === 'alert') || fields[0];
  const fNodes = farm.nodes.filter(n => n.fieldId === f?.id);
  const s = f ? farm.series[f.id] : null;
  const wx = farm.weather, k = farm.kpis;
  const dec = f ? fieldDecision(f, farm.nodes, wx) : null;
  const istHour = +now.toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }) + now.getMinutes() / 60;
  const skyNodes = useMemo(() => fNodes.slice(0, 4).map(n => ({ id: n.id, water: n.water ?? (n.moisture - 30) / 3, status: n.status })), [fNodes]);
  const skyWx = useMemo(() => wx?.current ? { cloud: Math.min(1, (wx.current.cloud ?? 20) / 100), rain: Math.min(1, (wx.current.precip ?? 0) / 4), wind: Math.min(1, (wx.current.wind ?? 8) / 30), tempC: wx.current.tempC, rain3dMm: wx.rain3f } : null, [wx]);
  const balance = wx ? +(wx.rain7 - wx.et7).toFixed(1) : null;

  if (!f) return <div className="d-page"><SiteSwitcher /><div className="d-card d-skel" style={{ height: 400 }} /></div>;

  return (
    <div className="d-page">
      {/* header */}
      <header className="d-head d-rise">
        <div>
          <div className="d-eyebrow"><MapPinned size={14} /> {site.district ? `${site.district}, ` : ''}{site.state || 'India'} · {farm.season}</div>
          <h1>{site.name}</h1>
          <p>{site.tagline}</p>
        </div>
        <div className="d-head-right">
          <div className="d-clock"><span>{partOfDay(istHour)}</span><b>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })} IST</b></div>
          <div className="d-srcs" aria-label="Data source status">
            <span>Weather <SourceDot s={status.weather} /></span><span>Fields <SourceDot s={status.osm} /></span><span>Soil <SourceDot s={status.soil} /></span>
            <button className="d-icon-btn" onClick={refresh} title="Refresh live data"><RefreshCw size={14} /></button>
          </div>
        </div>
      </header>

      <SiteSwitcher />

      {/* hero: 3D farm + live conditions */}
      <section className="d-hero d-rise" style={{ '--d': '60ms' }}>
        <SkyBanner key={site.id} nodes={skyNodes} lat={site.lat} lng={site.lng} height={380} className="d-sky" caption={null} stage={farm.crop.paddy ? Math.min(1, 0.15 + farm.crop.progress) : 0.7} weatherData={skyWx} />
        <div className="d-hero-glass">
          <div className="d-hero-crop">
            <Ring value={farm.crop.progress} size={58} stroke={6} color="var(--d-lime)" track="rgba(255,255,255,.22)"><Sprout size={18} /></Ring>
            <div><small>Today in the field</small><b>{farm.crop.crop}</b><span>{farm.crop.stage}{farm.crop.daysLeft ? ` · ${farm.crop.daysLeft} days to ${farm.crop.paddy ? 'harvest' : 'next stage'}` : ''}</span></div>
          </div>
          <div className="d-hero-wx">
            <span><Thermometer size={15} />{wx?.current?.tempC != null ? `${Math.round(wx.current.tempC)}°C` : '—'}</span>
            <span><Droplets size={15} />{wx?.current?.rh != null ? `${wx.current.rh}% RH` : '—'}</span>
            <span><Wind size={15} />{wx?.current?.wind != null ? `${Math.round(wx.current.wind)} km/h` : '—'}</span>
            <span><CloudRain size={15} />{wx ? `${wx.rain3f} mm next 3 d` : '—'}</span>
          </div>
          <small className="d-hero-src">Live: Open-Meteo · 3D scene is illustrative, node colours follow {f.id}</small>
        </div>
      </section>

      {/* KPIs */}
      <section className="d-kpis">
        <Kpi i={0} icon={<MapPinned size={18} />} label="Fields mapped" value={k.total} sub={`${k.areaHa} ha · ${farm.boundarySource}`} />
        <Kpi i={1} icon={<Leaf size={18} />} label="Healthy now" value={k.normalPct} suffix="%" sub={`mean NDVI ${k.meanNdvi ?? '—'} (est.)`} />
        <Kpi i={2} icon={<AlertTriangle size={18} />} label="Need attention" value={k.attention} sub={`${k.watch} watch · ${k.alert} act now`} tone={k.alert ? 'coral' : 'amber'} />
        <Kpi i={3} icon={<Radio size={18} />} label="Sensor nodes" value={k.nodes} sub={`${k.gateways} ESP-NOW gateway${k.gateways > 1 ? 's' : ''}`} tone="water" />
        <Kpi i={4} icon={<Gauge size={18} />} label="7-day water balance" value={balance ?? '—'} decimals={1} suffix={balance != null ? ' mm' : ''} sub={wx ? `rain ${wx.rain7} − ET₀ ${wx.et7} mm` : 'waiting for Open-Meteo'} tone={balance != null && balance < 0 ? 'amber' : 'water'} />
      </section>

      {/* map + field panel */}
      <section className="d-main">
        <div className="d-card d-rise d-map-card" style={{ '--d': '120ms' }}>
          <div className="d-card-h">
            <div><h2>Field map</h2><small>{fields.length} fields · boundaries from {farm.boundarySource}{farm.srcCount.approx ? ' (approximate plots shown — no mapped fields loaded here yet; trace your own)' : ''} · click a field</small></div>
            {traces.length > 0 && <button className="d-chip-btn" onClick={clearTraces}>Clear {traces.length} traced</button>}
          </div>
          <FarmMap farm={farm} selected={f.id} onSelect={setSel} mode={mode} onMode={setMode} onTrace={p => addTrace(p)} height={540} />
        </div>

        <aside className="d-card d-rise d-field" style={{ '--d': '160ms' }}>
          <div className="d-field-top">
            <div>
              <span className={`d-pill d-pill-${f.state}`}><i />{STATE_TXT[f.state]}</span>
              <h2>{f.id}</h2>
              <small>{f.name} · {f.area} ha · {f.src === 'osm' ? `OSM way ${f.osmId}` : f.src === 'traced' ? 'your trace' : 'approximate boundary'}</small>
            </div>
            <Ring value={f.health / 100} size={70} color={f.health > 70 ? 'var(--d-leaf)' : f.health > 45 ? 'var(--d-amber)' : 'var(--d-coral)'}><b>{f.ndvi}</b><small>NDVI</small></Ring>
          </div>
          <div className="d-field-crop"><Sprout size={15} /> <b>{f.crop}</b> · {f.stage}<div className="d-prog"><i style={{ width: `${Math.round(f.progress * 100)}%` }} /></div></div>

          {dec && (() => { const [cls, Icon] = TONE[dec.tone]; return (
            <div className={`d-decision ${cls}`}><Icon size={18} /><div><b>{dec.title}</b><p>{dec.detail}</p></div></div>
          ); })()}

          <div className="d-tiles">
            <div className="d-tile"><small><Droplets size={13} /> {f.water != null ? 'Water level' : 'Soil moisture'}</small><b>{f.water != null ? `${f.water > 0 ? '+' : ''}${f.water} cm` : `${f.moisture}%`}</b>
              <Spark data={f.water != null ? s.water48 : s.soil48} color="var(--d-water)" /></div>
            <div className="d-tile"><small><Leaf size={13} /> Root-zone moisture</small><b>{f.moisture}%</b><Spark data={s.soil48} color="var(--d-leaf)" /></div>
            <div className="d-tile"><small><Thermometer size={13} /> Air temperature</small><b>{f.temp}°C</b><Spark data={s.temp48} color="var(--d-coral)" /></div>
          </div>

          <div className="d-nodes-mini">
            {fNodes.map(n => <div key={n.id} className={`d-nm d-nm-${n.status}`} title={`RSSI ${n.rssi} dBm · ${n.dist} m to ${n.gw}`}><b>{n.id}</b><span>{n.water != null ? `${n.water} cm` : `${n.moisture}%`}</span><small><Battery size={11} />{n.batt}%</small></div>)}
          </div>
          <div className="d-field-links">
            <Link className="d-btn" to={`/fields/${f.id}`}>Open field</Link>
            <a className="d-btn ghost" href={googleMapsLink(f.center[0], f.center[1])} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Google Maps</a>
            <a className="d-btn ghost" href={googleEarthLink(f.center[0], f.center[1])} target="_blank" rel="noreferrer"><Satellite size={14} /> Earth</a>
          </div>
          <small className="d-fine">Node readings, water level and NDVI here are simulated from live weather and soil data, until real nodes report.</small>
        </aside>
      </section>

      {/* weather + soil */}
      <section className="d-row2">
        <div className="d-card d-rise">
          <div className="d-card-h"><div><h2>Rain vs crop water demand</h2><small>Daily rainfall (bars) and reference evapotranspiration ET₀ (line), last 14 days + 3-day forecast</small></div><SourceDot s={status.weather} /></div>
          <RainEtChart daily={wx?.daily?.slice(Math.max(0, (wx?.todayIdx ?? 14) - 13), (wx?.todayIdx ?? 14) + 4)} />
          <div className="d-legend-inline"><span><i className="d-sw-water" />Rain (mm)</span><span><i className="d-sw-amber" />ET₀ (mm)</span><span><i className="d-sw-hatch" />Forecast</span>
            {farm.power && <span className="d-muted">NASA POWER: {farm.power.rain30} mm rain in last 30 days · {farm.power.solar} kWh/m²/day sun</span>}</div>
        </div>
        <div className="d-card d-rise">
          <div className="d-card-h"><div><h2>Soil moisture, last 48 h</h2><small>Modelled volumetric water at 3–9 cm and 9–27 cm (Open-Meteo) for this site; {f.id} scaled</small></div></div>
          <Lines48 unit="%" lines={[
            { label: '3–9 cm', color: 'var(--d-water)', data: s.soil48 },
            { label: '9–27 cm', color: 'var(--d-leaf)', dash: '6 5', data: (wx?.soil9_48 || []).map((v, i) => ({ t: i, v: +((v ?? 0) * 100).toFixed(1) })) },
          ]} />
          <div className="d-legend-inline"><span><i className="d-sw-water" />3–9 cm</span><span><i className="d-sw-leaf d-dash" />9–27 cm</span>
            <span className="d-muted">field capacity ≈ {Math.round(farm.hydro.fc * 100)}% · wilting ≈ {Math.round(farm.hydro.pwp * 100)}% (from soil texture)</span></div>
        </div>
      </section>

      <section className="d-row3">
        <div className="d-card d-rise">
          <div className="d-card-h"><div><h2>Soil profile</h2><small>{farm.soilIsLive ? 'ISRIC SoilGrids 250 m, 0–5 cm' : site.soilFallback.label}</small></div><SourceDot s={status.soil} /></div>
          <TextureBar sand={farm.soil.sand} silt={farm.soil.silt} clay={farm.soil.clay} />
          <div className="d-soil-kv">
            <div><small>pH</small><b>{farm.soil.ph ?? '—'}</b></div>
            <div><small>Organic C</small><b>{farm.soil.soc ?? '—'} <em>g/kg</em></b></div>
            <div><small>Bulk density</small><b>{farm.soil.bdod ?? '—'} <em>g/cm³</em></b></div>
          </div>
        </div>
        <div className="d-card d-rise">
          <div className="d-card-h"><div><h2>Alerts</h2><small>Generated from field state and forecast</small></div></div>
          <div className="d-alerts">
            {farm.alerts.length ? farm.alerts.slice(0, 5).map(a => (
              <button key={a.id} className={`d-alert d-alert-${a.sev}`} onClick={() => fields.some(x => x.id === a.field) && setSel(a.field)}>
                <i /><div><b>{a.title}</b><small>{a.field} · {a.node}</small></div>
              </button>)) : <p className="d-muted">No alerts. All fields are in range.</p>}
          </div>
        </div>
        <SmsCard site={site} field={f} dec={dec} />
      </section>

      <section className="d-row2">
        <ImpactLedger key={f.id} areaHa={f.paddy ? f.area : 2.4} />
        <div className="d-card d-rise">
          <div className="d-card-h"><div><h2>Network health</h2><small>{farm.nodes.length} nodes · ESP-NOW to {farm.gateways.length} gateway(s) · SMS uplink</small></div></div>
          <div className="d-net">
            {farm.nodes.slice(0, 24).map(n => (
              <div key={n.fieldId + n.id} className={`d-net-n d-nm-${n.status}`}>
                <b>{n.id}<small>{n.fieldId.split('-')[1]}</small></b>
                <span className="d-bar"><i style={{ width: `${n.batt}%` }} /></span>
                <small><Signal size={11} /> {n.rssi}</small>
              </div>))}
          </div>
          <small className="d-fine">RSSI estimated from node-to-gateway distance. Nodes over ~380 m relay through a neighbour.</small>
        </div>
      </section>

      <section className="d-card d-rise d-sources">
        <div className="d-card-h"><div><h2><Database size={17} /> Where these numbers come from</h2><small>{site.about}</small></div></div>
        <div className="d-sources-grid">
          <div><b>Real (live)</b><ul>
            <li>Field boundaries: OpenStreetMap contributors (Overpass API){farm.srcCount.traced ? ' + your traces' : ''}</li>
            <li>Weather, rainfall, ET₀, soil moisture model: Open-Meteo</li>
            <li>Soil texture, pH, organic carbon: ISRIC SoilGrids</li>
            <li>30-day rain and solar: NASA POWER · NDVI tiles: NASA GIBS (MODIS)</li>
            <li>Imagery: Esri World Imagery, Sentinel-2 cloudless 2023 (EOX)</li>
          </ul></div>
          <div><b>Simulated (until nodes are deployed)</b><ul>
            <li>Per-node water level, moisture and battery</li>
            <li>Paddy water level (water balance of rain − ET₀ plus a fixed per-field offset)</li>
            <li>Per-field NDVI (crop-stage curve minus water stress)</li>
            <li>Bund-leak anomaly (at most one field per farm, to demo neighbour-comparison detection)</li>
          </ul></div>
          <div><b>About this site</b><ul>{site.sources.map(x => <li key={x.u}><a href={x.u} target="_blank" rel="noreferrer">{x.t}</a></li>)}
            <li>Anchor {site.lat.toFixed(4)}, {site.lng.toFixed(4)} ({site.precision === 'campus' ? 'research campus' : site.precision === 'town' ? 'town centre; fields within ' + (site.radiusM / 1000) + ' km' : 'search result'})</li></ul></div>
        </div>
      </section>
    </div>
  );
}

function SmsCard({ site, field, dec }) {
  const [lang, setLang] = useState(siteLang(site));
  useEffect(() => { setLang(siteLang(site)); }, [site]);
  if (!dec) return null;
  const text = smsText(field.id, dec, lang);
  return (
    <div className="d-card d-rise">
      <div className="d-card-h"><div><h2><MessageSquare size={17} /> Farmer SMS</h2><small>What the farmer's basic phone receives</small></div></div>
      <div className="d-langs" role="group" aria-label="SMS language">{Object.entries(LANGS).map(([k, l]) => <button key={k} aria-pressed={lang === k} onClick={() => setLang(k)}>{l}</button>)}</div>
      <div className="d-phone"><div className="d-bubble" key={text}>{text}</div><small>{[...text].length} chars · plain SMS via SIM800L, no app</small></div>
      <small className="d-fine">Regional-language text should be checked by a native speaker before field use.</small>
    </div>
  );
}
