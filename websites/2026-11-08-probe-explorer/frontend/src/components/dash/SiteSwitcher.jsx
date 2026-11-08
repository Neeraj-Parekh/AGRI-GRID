import { useState } from 'react';
import { MapPin, Plus, Search, X, Trash } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { cropToday } from '../../data/sites.js';
import { geocode } from '../../lib/openData.js';
import { hash } from '../../lib/geo.js';

// Real satellite thumbnail: the Esri World Imagery tile that contains the site.
function tileUrl(lat, lng, z = 15) {
  const n = 2 ** z, x = Math.floor((lng + 180) / 360 * n);
  const r = lat * Math.PI / 180, y = Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n);
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
}

const GENERIC_CAL = [
  { crop: 'Paddy (kharif)', from: '06-20', to: '10-31', paddy: true, stages: ['Nursery', 'Transplanting', 'Tillering', 'Panicle initiation', 'Flowering', 'Grain filling', 'Maturity'] },
  { crop: 'Rabi crop', from: '11-01', to: '03-15', stages: ['Sowing', 'Vegetative', 'Flowering', 'Harvest'] },
];

export default function SiteSwitcher() {
  const { sites, site, setSiteId, addSite, removeSite } = useSite();
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState(''), [res, setRes] = useState(null), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const search = async e => {
    e.preventDefault(); if (!q.trim()) return;
    setBusy(true); setErr('');
    try { setRes(await geocode(q)); } catch { setErr('Search is offline right now. Try again in a minute.'); }
    setBusy(false);
  };
  const pick = r => {
    const name = r.name.split(',')[0];
    addSite({ id: 'c-' + hash(r.name).toString(36), code: name.slice(0, 3).toUpperCase(), name, short: name, district: r.name.split(',').slice(1, 2).join('').trim(), state: r.name.split(',').slice(-3, -2).join('').trim(), stateCode: '', lat: r.lat, lng: r.lng, precision: 'search', radiusM: 2000, zoom: 15, tagline: 'Added from search', about: r.name, calendar: GENERIC_CAL, soilFallback: { clay: 30, sand: 40, silt: 30, soc: 10, ph: 7, bdod: 1.4, label: 'Generic loam (offline)' }, sources: [{ t: 'Location: OpenStreetMap Nominatim', u: 'https://nominatim.openstreetmap.org/' }], custom: true });
    setAdding(false); setRes(null); setQ('');
  };
  return (
    <section className="d-sites" aria-label="Farm sites">
      <div className="d-sites-row" style={{ '--n': sites.length }}>
        {sites.map((s, i) => {
          const c = cropToday(s);
          const on = s.id === site.id;
          return (
            <button key={s.id} className={`d-site ${on ? 'on' : ''}`} onClick={() => setSiteId(s.id)} style={{ '--d': `${i * 50}ms` }} aria-pressed={on}>
              <span className="d-site-img"><img src={tileUrl(s.lat, s.lng)} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} /></span>
              <span className="d-site-body">
                <span className="d-site-state">{s.stateCode || 'IN'} · {s.district || 'Custom'}</span>
                <b>{s.name}</b>
                <span className="d-site-crop">{c.crop}<em>{c.stage}</em></span>
              </span>
              {s.custom && <span className="d-site-x" role="button" tabIndex={0} title="Remove" onClick={e => { e.stopPropagation(); removeSite(s.id); }}><Trash size={13} /></span>}
            </button>
          );
        })}
        <button className="d-site d-site-add" onClick={() => setAdding(true)}><Plus size={20} /><span>Add any farm<br /><small>search a village</small></span></button>
      </div>
      {adding && (
        <div className="d-add" role="dialog" aria-label="Add a farm">
          <form onSubmit={search}>
            <Search size={16} /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Village, taluka or research farm, e.g. Rahuri, Navsari, Dharwad" />
            <button type="submit" disabled={busy}>{busy ? 'Searching…' : 'Search'}</button>
            <button type="button" className="ghost" onClick={() => { setAdding(false); setRes(null); }}><X size={16} /></button>
          </form>
          {err && <p className="d-add-err">{err}</p>}
          {res && (res.length ? <ul>{res.map(r => <li key={r.name}><button onClick={() => pick(r)}><MapPin size={14} />{r.name}</button></li>)}</ul> : <p className="d-add-err">No places found in India for that.</p>)}
          <small>Fields are loaded from OpenStreetMap around the place you pick. Weather and soil come live from Open-Meteo and SoilGrids.</small>
        </div>
      )}
    </section>
  );
}
