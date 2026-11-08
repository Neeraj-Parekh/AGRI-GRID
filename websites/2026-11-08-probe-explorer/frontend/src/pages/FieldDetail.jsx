import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Droplets, Leaf, Thermometer, Battery, Signal } from 'lucide-react';
import FarmMap from '../components/dash/FarmMap.jsx';
import { Spark, Lines48, Ring } from '../components/dash/charts.jsx';
import Field3D from '../components/three/Field3D.jsx';
import BandReadings from '../probe/embeds/BandReadings.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { fieldDecision } from '../lib/advice.js';
import { googleMapsLink } from '../lib/openData.js';
import '../components/dash/dash.css';

export default function FieldDetail() {
  const { id } = useParams();
  const { farm, site } = useSite();
  const f = farm.fields.find(x => x.id === id) || farm.fields[0];
  const [mode, setMode] = useState('satellite');
  if (!f) return <div className="d-page"><div className="d-card d-skel" style={{ height: 300 }} /></div>;
  const nodes = farm.nodes.filter(n => n.fieldId === f.id);
  const s = farm.series[f.id];
  const dec = fieldDecision(f, farm.nodes, farm.weather);
  return (
    <div className="d-page">
      <Link to="/fields" className="d-eyebrow"><ArrowLeft size={14} /> All fields at {site.name}</Link>
      <header className="d-head d-rise" style={{ marginTop: 8 }}>
        <div><h1>{f.id} <span style={{ fontWeight: 600, color: 'var(--d-ink3)', fontSize: 22 }}>{f.name}</span></h1>
          <p>{f.crop} · {f.stage} · {f.area} ha · {f.nodes} nodes · boundary {f.src === 'osm' ? `OSM way ${f.osmId}` : f.src === 'traced' ? 'traced by you' : 'approximate'}</p></div>
        <a className="d-btn ghost" href={googleMapsLink(f.center[0], f.center[1], 400)} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open in Google Maps</a>
      </header>
      <section className="d-main">
        <div className="d-card d-map-card d-rise"><FarmMap farm={farm} selected={f.id} mode={mode} onMode={setMode} height={460} /></div>
        <aside className="d-card d-field d-rise" style={{ '--d': '80ms' }}>
          <div className="d-field-top"><div><span className={`d-pill d-pill-${f.state}`}><i />{f.state}</span><h2>Today</h2></div>
            <Ring value={f.health / 100} size={70}><b>{f.ndvi}</b><small>NDVI</small></Ring></div>
          <div className={`d-decision d-tone-${dec.tone}`}><div><b>{dec.title}</b><p>{dec.detail}</p></div></div>
          <div className="d-tiles">
            <div className="d-tile"><small><Droplets size={13} /> {f.water != null ? 'Water' : 'Moisture'}</small><b>{f.water != null ? `${f.water} cm` : `${f.moisture}%`}</b><Spark data={s.water48 || s.soil48} /></div>
            <div className="d-tile"><small><Leaf size={13} /> Moisture</small><b>{f.moisture}%</b><Spark data={s.soil48} color="var(--d-leaf)" /></div>
            <div className="d-tile"><small><Thermometer size={13} /> Temp</small><b>{f.temp}°C</b><Spark data={s.temp48} color="var(--d-coral)" /></div>
          </div>
          <div className="d-net">{nodes.map(n => <div key={n.id} className={`d-net-n d-nm-${n.status}`}><b>{n.id}</b><span>{n.water != null ? `${n.water} cm` : `${n.moisture}%`} · {n.temp}°C</span><small><Battery size={11} /> {n.batt}% · <Signal size={11} /> {n.rssi} dBm</small></div>)}</div>
          <small className="d-fine">Node values are simulated from live weather and soil data.</small>
        </aside>
      </section>
      <section style={{ marginBottom: 18 }}><BandReadings field={f} /></section>
      <section className="d-card d-rise" style={{ marginBottom: 18 }}>
        <div className="d-card-h"><div><h2>3D field</h2><small>Drag to orbit · crop stage slider · sun follows real time at {site.name}</small></div></div>
        <Field3D nodes={nodes.slice(0, 4).map(n => ({ id: n.id, water: n.water ?? (n.moisture - 30) / 3, status: n.status }))} height={420} lat={site.lat} lng={site.lng} />
      </section>
      <section className="d-row2">
        <div className="d-card d-rise"><div className="d-card-h"><div><h2>Soil moisture, 48 h</h2><small>Open-Meteo model for this location, scaled to {f.id}</small></div></div><Lines48 unit="%" lines={[{ label: 'm', color: 'var(--d-water)', data: s.soil48 }]} /></div>
        <div className="d-card d-rise"><div className="d-card-h"><div><h2>{s.water48 ? 'Water level, 48 h' : 'Air temperature, 48 h'}</h2><small>{s.water48 ? 'Simulated from water balance (rain − ET₀)' : 'Open-Meteo hourly'}</small></div></div><Lines48 unit={s.water48 ? '' : '°'} lines={[{ label: 'w', color: s.water48 ? 'var(--d-forest)' : 'var(--d-coral)', data: s.water48 || s.temp48 }]} /></div>
      </section>
    </div>
  );
}
