import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, PenLine, Check, Undo2, X, Crosshair, ExternalLink } from 'lucide-react';
import { TILES, ndviTileUrl, googleMapsLink } from '../../lib/openData.js';
import { idw } from '../../lib/idw.js';
import { bbox, inPoly } from '../../lib/geo.js';

const MODES = [
  ['satellite', 'Satellite'], ['sentinel', 'Sentinel-2'], ['map', 'Map'],
  ['ndvi', 'NDVI'], ['water', 'Water state'], ['moisture', 'Soil moisture'],
];
const STATE = { normal: '#3FA35B', watch: '#E3A22C', alert: '#E0614A' };
const lerp = (a, b, t) => a + (b - a) * t;
function ramp(stops, t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) {
    const [t0, c0] = stops[i - 1], [t1, c1] = stops[i], k = (t - t0) / (t1 - t0);
    return `rgb(${c0.map((c, j) => Math.round(lerp(c, c1[j], k))).join(',')})`;
  }
  return `rgb(${stops.at(-1)[1].join(',')})`;
}
const ndviColor = v => ramp([[0, [176, 132, 82]], [0.35, [222, 205, 120]], [0.55, [140, 196, 92]], [0.8, [38, 128, 62]], [1, [18, 82, 42]]], v);
const waterColor = cm => ramp([[0, [214, 96, 64]], [0.35, [232, 176, 72]], [0.6, [150, 205, 222]], [1, [32, 110, 182]]], (cm + 20) / 30);
const moistColor = rel => ramp([[0, [190, 120, 70]], [0.45, [230, 190, 100]], [0.75, [120, 190, 170]], [1, [40, 120, 190]]], rel);

export default function FarmMap({ farm, selected, onSelect, mode: modeProp, onMode, onTrace, height = 520, compact = false }) {
  const el = useRef(null), mapRef = useRef(null), base = useRef({}), overlay = useRef(null), traceLayer = useRef(null);
  const [modeState, setModeState] = useState('satellite');
  const mode = modeProp || modeState;
  const setMode = m => { onMode ? onMode(m) : setModeState(m); };
  const [tracing, setTracing] = useState(false);
  const [zoom, setZoom] = useState(farm.site.zoom || 15);
  const [pts, setPts] = useState([]);
  const tracingRef = useRef(false); tracingRef.current = tracing;

  // map + base layers once
  useEffect(() => {
    const map = L.map(el.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: true, preferCanvas: false, zoomSnap: 0.5 }).setView([farm.site.lat, farm.site.lng], farm.site.zoom || 15);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const mk = (t, extra = {}) => L.tileLayer(t.url, { maxZoom: 20, maxNativeZoom: t.maxNativeZoom, subdomains: t.subdomains || 'abc', attribution: t.attribution, crossOrigin: true, ...extra });
    base.current = { satellite: mk(TILES.satellite), sentinel: mk(TILES.sentinel), map: mk(TILES.map), labels: mk(TILES.labels, { pane: 'overlayPane', opacity: 0.85 }) };
    const n = ndviTileUrl(); base.current.ndvi = L.tileLayer(n.url, { maxZoom: 20, maxNativeZoom: n.maxNativeZoom, opacity: 0.62, attribution: n.attribution, crossOrigin: true });
    overlay.current = L.layerGroup().addTo(map);
    traceLayer.current = L.layerGroup().addTo(map);
    map.on('click', e => { if (tracingRef.current) setPts(p => [...p, [+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)]]); });
    map.on('zoomend', () => setZoom(map.getZoom()));
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.invalidateSize()); ro.observe(el.current);
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // base layer by mode
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const b = base.current;
    Object.values(b).forEach(l => map.hasLayer(l) && map.removeLayer(l));
    const baseKey = mode === 'sentinel' ? 'sentinel' : mode === 'map' ? 'map' : 'satellite';
    b[baseKey].addTo(map);
    if (baseKey !== 'map') b.labels.addTo(map);
    if (mode === 'ndvi') b.ndvi.addTo(map);
  }, [mode]);

  // fit to farm when the site changes
  const siteKey = farm.site.id + ':' + farm.fields.length + ':' + (farm.fields[0]?.src || '');
  useEffect(() => {
    const map = mapRef.current; if (!map || !farm.fields.length) return;
    const all = farm.fields.flatMap(f => f.poly);
    map.flyToBounds(L.latLngBounds(all), { padding: compact ? [20, 20] : [50, 50], duration: 0.9, maxZoom: 17 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  // overlays
  useEffect(() => {
    const g = overlay.current; if (!g) return;
    g.clearLayers();
    const nodesBy = id => farm.nodes.filter(n => n.fieldId === id);
    // IDW water / moisture surface inside the selected field
    const sel = farm.fields.find(f => f.id === selected);
    if (sel && (mode === 'water' || mode === 'moisture')) {
      const ns = nodesBy(sel.id).map(n => ({ lat: n.lat, lng: n.lng, value: mode === 'water' ? (n.water ?? 0) : n.moisture }));
      if (ns.length && (mode === 'moisture' || sel.water != null)) {
        const b = bbox(sel.poly), N = 22;
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          const lat = b.minLat + (b.maxLat - b.minLat) * (i + 0.5) / N, lng = b.minLng + (b.maxLng - b.minLng) * (j + 0.5) / N;
          if (!inPoly(lat, lng, sel.poly)) continue;
          const v = idw(ns, lat, lng);
          const c = mode === 'water' ? waterColor(v) : moistColor(v / (farm.hydro.sat * 100));
          const dLat = (b.maxLat - b.minLat) / N / 2, dLng = (b.maxLng - b.minLng) / N / 2;
          L.rectangle([[lat - dLat, lng - dLng], [lat + dLat, lng + dLng]], { stroke: false, fillColor: c, fillOpacity: 0.62, interactive: false }).addTo(g);
        }
      }
    }
    farm.fields.forEach(f => {
      const isSel = f.id === selected;
      let fill = STATE[f.state], op = 0.22;
      if (mode === 'ndvi') { fill = ndviColor(f.ndvi); op = 0.18; }
      if (mode === 'water') { fill = f.water != null ? waterColor(f.water) : '#cfc6b4'; op = isSel ? 0.08 : 0.5; }
      if (mode === 'moisture') { fill = moistColor(f.rel); op = isSel ? 0.08 : 0.5; }
      const poly = L.polygon(f.poly, { color: isSel ? '#ffffff' : 'rgba(255,255,255,.85)', weight: isSel ? 3.5 : 1.6, dashArray: f.src === 'approx' ? '6 5' : null, fillColor: fill, fillOpacity: op, className: `d-poly d-poly-${f.state}${isSel ? ' is-sel' : ''}` });
      poly.bindTooltip(`<div class="d-tt"><b>${f.id}</b> · ${f.name}<br/>${f.crop} · ${f.stage}<br/>${f.area} ha · ${f.water != null ? `water ${f.water} cm` : `moisture ${f.moisture}%`} · NDVI ${f.ndvi}<br/><small>${f.src === 'osm' ? `OSM way ${f.osmId}` : f.src === 'traced' ? 'Your trace' : 'Approximate boundary'}</small></div>`, { sticky: true, className: 'd-tooltip', direction: 'top' });
      poly.on('click', e => { if (tracingRef.current) return; L.DomEvent.stopPropagation(e); onSelect?.(f.id); });
      poly.addTo(g);
      if (!compact) L.marker(f.center, { interactive: false, icon: L.divIcon({ className: 'd-flabel-wrap', html: `<span class="d-flabel ${isSel ? 'is-sel' : ''}">${f.id.split('-')[1]}</span>`, iconSize: [30, 18], iconAnchor: [15, 9] }) }).addTo(g);
    });
    // ESP-NOW links + gateways + nodes
    farm.links.filter(l => zoom >= 16.5 || farm.nodes.find(n => n.id === l.nodeId && n.fieldId === selected)).forEach(l => L.polyline([l.from, l.to], { color: '#9fd7ff', weight: 1.4, opacity: 0.85, dashArray: '2 7', interactive: false, className: 'd-link' }).addTo(g));
    farm.gateways.forEach(gw => {
      L.marker([gw.lat, gw.lng], { icon: L.divIcon({ className: '', html: '<div class="d-gw"><i></i></div>', iconSize: [26, 26], iconAnchor: [13, 13] }) })
        .bindTooltip(`<div class="d-tt"><b>${gw.id}</b> · ESP-NOW gateway<br/>${gw.fields.length} field(s) · SIM800L SMS uplink</div>`, { className: 'd-tooltip', direction: 'top' }).addTo(g);
    });
    farm.nodes.forEach(n => {
      if (n.fieldId !== selected && (compact || zoom < 16.5)) return; // keep the overview readable; all nodes appear when zoomed in
      L.marker([n.lat, n.lng], { icon: L.divIcon({ className: '', html: `<div class="d-node d-node-${n.status}"><i></i></div>`, iconSize: [18, 18], iconAnchor: [9, 9] }) })
        .bindTooltip(`<div class="d-tt"><b>Node ${n.id}</b> · ${n.fieldId}<br/>${n.water != null ? `Water ${n.water} cm · ` : ''}Moisture ${n.moisture}% · ${n.temp}°C<br/>Battery ${n.batt}% · RSSI ${n.rssi} dBm · ${n.dist} m to ${n.gw}<br/><small>simulated reading</small></div>`, { className: 'd-tooltip', direction: 'top' })
        .on('click', () => onSelect?.(n.fieldId)).addTo(g);
    });
  }, [farm, selected, mode, onSelect, compact, zoom]);

  // trace preview
  useEffect(() => {
    const g = traceLayer.current; if (!g) return; g.clearLayers();
    if (!tracing) return;
    if (pts.length) L.polyline([...pts, ...(pts.length > 2 ? [pts[0]] : [])], { color: '#fff', weight: 2.5, dashArray: '5 5' }).addTo(g);
    pts.forEach(p => L.circleMarker(p, { radius: 5, color: '#0F5B3A', weight: 2, fillColor: '#fff', fillOpacity: 1 }).addTo(g));
  }, [pts, tracing]);
  useEffect(() => { const c = el.current; if (c) c.style.cursor = tracing ? 'crosshair' : ''; }, [tracing]);

  const finish = () => { if (pts.length >= 3) onTrace?.(pts); setPts([]); setTracing(false); };
  const sel = farm.fields.find(f => f.id === selected);
  const recenter = () => { const m = mapRef.current; if (m && farm.fields.length) m.flyToBounds(L.latLngBounds(farm.fields.flatMap(f => f.poly)), { padding: [50, 50], duration: 0.7, maxZoom: 17 }); };

  return (
    <div className="d-map" style={{ height }}>
      <div ref={el} className="d-map-canvas" role="application" aria-label={`Map of ${farm.site.name} fields`} />
      {!compact && <div className="d-map-modes" role="tablist" aria-label="Map layer">
        <Layers size={15} aria-hidden="true" />
        {MODES.map(([k, l]) => <button key={k} role="tab" aria-selected={mode === k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>)}
      </div>}
      {!compact && <div className="d-map-actions">
        <button onClick={recenter} title="Fit all fields"><Crosshair size={15} /></button>
        {sel && <a href={googleMapsLink(sel.center[0], sel.center[1])} target="_blank" rel="noreferrer" title="Open this field in Google Maps"><ExternalLink size={15} /> Google Maps</a>}
        {onTrace && !tracing && <button onClick={() => { setTracing(true); setPts([]); }} title="Click points on the map to trace a real field boundary"><PenLine size={15} /> Trace field</button>}
      </div>}
      {tracing && <div className="d-trace-bar">
        <span>Click the field corners on the imagery · {pts.length} point{pts.length === 1 ? '' : 's'}</span>
        <button onClick={() => setPts(p => p.slice(0, -1))} disabled={!pts.length}><Undo2 size={14} /> Undo</button>
        <button onClick={finish} disabled={pts.length < 3} className="ok"><Check size={14} /> Save field</button>
        <button onClick={() => { setTracing(false); setPts([]); }}><X size={14} /></button>
      </div>}
      {!compact && <MapLegend mode={mode} />}
    </div>
  );
}

function MapLegend({ mode }) {
  let items;
  if (mode === 'ndvi') items = [['NDVI low', ndviColor(0.2)], ['', ndviColor(0.45)], ['', ndviColor(0.65)], ['high', ndviColor(0.85)]];
  else if (mode === 'water') items = [['−20 cm', waterColor(-20)], ['−10', waterColor(-10)], ['0', waterColor(0)], ['+10 cm', waterColor(10)]];
  else if (mode === 'moisture') items = [['dry', moistColor(0.1)], ['', moistColor(0.45)], ['', moistColor(0.75)], ['wet', moistColor(1)]];
  else items = null;
  return (
    <div className="d-legend">
      {items ? <div className="d-legend-ramp">{items.map(([l, c], i) => <span key={i}><i style={{ background: c }} />{l}</span>)}</div>
        : <div className="d-legend-ramp">{Object.entries(STATE).map(([k, c]) => <span key={k}><i style={{ background: c }} />{k}</span>)}</div>}
      <div className="d-legend-sym"><span><b className="d-node d-node-normal mini"><i /></b>node</span><span><b className="d-gw mini"><i /></b>gateway</span><span><b className="d-linkkey" />ESP-NOW</span></div>
      {mode === 'ndvi' && <small>MODIS 250 m composite (NASA GIBS) · field values estimated</small>}
      {(mode === 'water' || mode === 'moisture') && <small>IDW surface from simulated node readings</small>}
    </div>
  );
}
