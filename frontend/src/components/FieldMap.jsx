import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FIELDS, NODES } from '../data/demo.js';

const stateColor = s => s==='alert' ? '#C94D3D' : s==='watch' ? '#D99A25' : '#2F7D46';

export default function FieldMap({ layer='map', selected='AGRI-001', onSelect }){
  const ref = useRef(null); const mapRef = useRef(null);
  useEffect(()=>{
    if(mapRef.current){ mapRef.current.remove(); mapRef.current=null; }
    const map = L.map(ref.current,{ scrollWheelZoom:true }).setView([18.530,73.855],13);
    mapRef.current = map;
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom:19, attribution:'© OpenStreetMap' });
    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{ maxZoom:19, attribution:'© Esri' });
    (layer==='satellite'?sat:osm).addTo(map);
    map._agriBase={osm,sat};
    return ()=>{ map.remove(); mapRef.current=null; };
  },[]);
  useEffect(()=>{
    const map = mapRef.current; if(!map) return;
    const { osm, sat } = map._agriBase || {};
    if(osm&&sat){ if(layer==='satellite'){ if(map.hasLayer(osm))map.removeLayer(osm); sat.addTo(map);} else { if(map.hasLayer(sat))map.removeLayer(sat); osm.addTo(map);} }
    // redraw overlays
    map.eachLayer(l=>{ if(l._agriOverlay) map.removeLayer(l); });
    FIELDS.slice(0,4).forEach(f=>{
      const isSel = f.id===selected;
      const fill = layer==='ndvi' ? (f.health>85?'#2F7D46':f.health>70?'#79C95B':'#D99A25')
        : layer==='water' ? (f.water>6?'#2D78B7':f.water>3?'#6FB6D9':f.water>2?'#D99A25':'#C94D3D')
        : stateColor(f.state);
      const poly = L.polygon(f.poly,{ color:isSel?'#2D78B7':'#fff', weight:isSel?3:1.5, fillColor:fill, fillOpacity:layer==='map'?0.45:0.62 });
      poly._agriOverlay=true;
      poly.bindTooltip(`<b>${f.id}</b><br/>${f.crop} · ${f.state}<br/>Water ${f.water} cm`);
      poly.on('click',()=>onSelect&&onSelect(f.id));
      poly.addTo(map);
      L.marker([ (f.poly[0][0]+f.poly[2][0])/2, (f.poly[0][1]+f.poly[2][1])/2 ],{ interactive:false, icon:L.divIcon({ className:'', html:`<div style="font-weight:800;color:#fff;text-shadow:0 1px 4px #000;font-size:12px">${f.id}</div>`, iconSize:[60,16], iconAnchor:[30,8] }) }).addTo(map)._agriOverlay=true;
    });
    NODES.filter(n=>n.fieldId===selected).forEach(n=>{
      const m = L.circleMarker([n.lat,n.lng],{ radius:7, color:'#fff', weight:2, fillColor:n.status==='alert'?'#C94D3D':n.status==='watch'?'#D99A25':'#2F7D46', fillOpacity:1 });
      m._agriOverlay=true;
      m.bindTooltip(`<b>Node ${n.id}</b> · Zone ${n.zone}<br/>Water ${n.water} cm · ${n.moisture}% · ${n.temp}°C`);
      m.addTo(map);
    });
    const sel = FIELDS.find(f=>f.id===selected);
    if(sel) map.fitBounds(sel.poly,{ padding:[30,30] });
  },[layer,selected]);
  return (
    <div className="map-wrap">
      <div ref={ref} style={{height:'100%'}} role="application" aria-label="Field map"/>
      <div className="legend"><span><i style={{background:'#2F7D46'}}/>Normal</span><span><i style={{background:'#D99A25'}}/>Watch</span><span><i style={{background:'#C94D3D'}}/>Alert</span><span><i style={{background:'#fff',border:'1px solid #999'}}/>Field Boundary</span><span>● Sensor Node</span></div>
    </div>
  );
}
