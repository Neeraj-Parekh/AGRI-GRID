import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import FieldMap from '../components/FieldMap.jsx';
import { WaterChart, Spark } from '../components/Charts.jsx';
import { FIELDS, NODES, TELEMETRY } from '../data/demo.js';
export default function FieldDetail(){
  const { id } = useParams();
  const f = FIELDS.find(x=>x.id===id) || FIELDS[0];
  const nodes = NODES.filter(n=>n.fieldId===f.id);
  const [node,setNode]=useState(nodes[1]?.id || nodes[0]?.id);
  const n = nodes.find(x=>x.id===node) || nodes[0];
  const [layer,setLayer]=useState('water');
  return (<>
    <Link to="/fields">← Fields</Link>
    <h1 className="page-title">{f.id} — {f.crop}</h1>
    <p className="page-sub">{f.area} ha · {f.stage} · {f.nodes} sensors · Last update {f.updated} <span className="badge b-sim">SIMULATED</span></p>
    <div className="layout-2">
      <div className="card"><div className="field-head"><b>Field view — zones + nodes + water-state heatmap</b><div className="map-tools" style={{position:'static',marginLeft:'auto'}}>{['map','satellite','ndvi','water'].map(l=><button key={l} className={layer===l?'on':''} onClick={()=>setLayer(l)}>{l}</button>)}</div></div>
        <div style={{marginTop:10}}><FieldMap layer={layer} selected={f.id}/></div>
        <p><small>Anomaly marker: Zone B2 (Node B2) — rapid drying. Click nodes in table below for telemetry.</small></p></div>
      <div className="card"><b>Nodes</b>{nodes.map(x=><button key={x.id} onClick={()=>setNode(x.id)} className="btn ghost" style={{margin:4,borderColor:x.id===node?'#073B2A':undefined}}>{x.id} · {x.zone} · {x.water}cm</button>)}
        {n&&<><h3>Node {n.id} — Zone {n.zone}</h3><dl className="kv"><dt>Water level</dt><dd>{n.water} cm</dd><dt>Soil moisture</dt><dd>{n.moisture}%</dd><dt>Temperature</dt><dd>{n.temp}°C</dd><dt>Battery</dt><dd>{n.batt}%</dd><dt>Signal</dt><dd>{n.rssi} dBm</dd><dt>Last update</dt><dd>{n.updated}</dd></dl>
        <b>Water level — last 24h (30-min)</b><WaterChart data={TELEMETRY['AGRI-001:B2:water']}/><small>Node B: slow decline → sharp 4 cm drop at 12:00–12:30 → anomaly flagged. Deterministic demo series.</small></>}</div>
    </div>
    <div className="layout-3">
      <div className="card"><b>Soil moisture trend</b><Spark data={TELEMETRY['AGRI-001:B2:moisture']} color="#2F7D46"/><p>44% at B2 vs 63–68% neighbours — supports drying inference.</p></div>
      <div className="card"><b>Temperature trend</b><Spark data={TELEMETRY['AGRI-001:B2:temp']} color="#C94D3D"/><p>30.1°C at B2, +1.6°C above field mean — evapotranspiration driver.</p></div>
      <div className="card"><b>AWD status</b><p>{f.awd} — Drying Day 6–12. B2 approaching stress threshold. <span className="badge b-proto">PROTOTYPE</span></p><Link className="btn" to="/intelligence">Open Intelligence →</Link></div>
    </div>
  </>);
}
