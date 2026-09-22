import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import FieldMap from '../components/FieldMap.jsx';
import { WaterChart, Spark } from '../components/Charts.jsx';
import IdwPanel from '../components/IdwPanel.jsx';
import { useLiveData } from '../context/ModeContext.jsx';
import { TELEMETRY } from '../data/demo.js';
export default function FieldDetail(){
  const { id } = useParams();
  const { fields, nodes, isLive } = useLiveData();
  const f = fields.find(x=>x.id===id) || fields[0];
  const nodesOf = nodes.filter(n=>n.fieldId===f.id);
  const [node,setNode]=useState(nodesOf[1]?.id || nodesOf[0]?.id);
  const n = nodesOf.find(x=>x.id===node) || nodesOf[0];
  const [layer,setLayer]=useState('water');
  const isAlert = n?.status==='alert';
  return (<>
    <Link to="/fields" style={{fontSize:14,fontWeight:600,color:'var(--green)'}}>← Back to Fields</Link>
    <h1 className="page-title">{f.id} — {f.crop}</h1>
    <p className="page-sub">{f.area} ha · {f.stage} · {f.nodes} sensors · Last update {f.updated} {isLive?<span className="badge b-active">LIVE values</span>:<span className="badge b-sim">SIMULATED</span>}</p>
    <div className="layout-hero">
      <div className="card">
        <div className="field-head"><b style={{fontSize:16}}>Field View</b><div className="map-tools" style={{position:'static',marginLeft:'auto'}}>{['map','satellite','ndvi','water'].map(l=><button key={l} className={layer===l?'on':''} onClick={()=>setLayer(l)}>{l}</button>)}</div></div>
        <p style={{color:'var(--muted)',fontSize:13.5,marginTop:4}}>Zones · nodes · IDW water surface — click a node below for detail</p>
        <div style={{marginTop:10}}><FieldMap layer={layer} selected={f.id} nodesOverride={nodes}/></div>
        <div style={{marginTop:14}}><IdwPanel poly={f.poly} nodes={nodesOf} height={130}/></div>
      </div>
      <div className="card">
        <b style={{fontSize:16}}>Nodes</b>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'10px 0 14px'}}>
          {nodesOf.map(x=><button key={x.id} onClick={()=>setNode(x.id)} className="btn ghost" style={{fontSize:13,padding:'8px 14px',borderWidth:x.id===node?'2px':'1.5px',borderColor:x.id===node?'var(--dark)':undefined}}>{x.id} · {x.zone}<br/><small style={{fontWeight:400,color:'var(--muted)'}}>{x.water} cm</small></button>)}
        </div>
        {n&&<>
          <h3 style={{margin:'0 0 8px',fontSize:18,fontWeight:800}}>Node {n.id} — Zone {n.zone}</h3>
          <dl className="kv"><dt>Water level</dt><dd style={{color:isAlert?'var(--red)':'inherit'}}>{n.water} cm</dd><dt>Soil moisture</dt><dd>{n.moisture}%</dd><dt>Temperature</dt><dd>{n.temp}°C</dd><dt>Battery</dt><dd>{n.batt}%</dd><dt>Signal</dt><dd>{n.rssi} dBm</dd><dt>Last update</dt><dd>{n.updated||f.updated}</dd></dl>
          {isAlert&&<div className="why"><h5>Why this matters</h5><p><b>Water level dropped 4 cm in 30 min</b> — ≈190× normal AWD drying rate.</p><p><b>Spatial context:</b> neighbouring zones B1, B3, B4 remained stable (5.7–6.8 cm).</p><p><b>Interpretation:</b> localized drying event — likely bund leak or breach, not field-wide irrigation miss.</p><p><b>Suggested action:</b> inspect Zone B2 before next irrigation decision.</p></div>}
          <b style={{fontSize:14,display:'block',marginTop:16}}>Water level — last 24h</b>
          <WaterChart data={TELEMETRY['AGRI-001:B2:water']}/>
          <small style={{color:'var(--muted)'}}>Deterministic demo series: slow decline → sharp 4 cm drop at 12:00–12:30 → anomaly flagged.</small>
        </>}
      </div>
    </div>
    <div className="layout-3">
      <div className="card"><b style={{fontSize:15}}>Soil Moisture Trend</b><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>44% at B2 vs 63–68% neighbours — supports drying inference</p><Spark data={TELEMETRY['AGRI-001:B2:moisture']} color="#2F7D46"/></div>
      <div className="card"><b style={{fontSize:15}}>Temperature Trend</b><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>30.1°C at B2, +1.6°C above field mean — evapotranspiration driver</p><Spark data={TELEMETRY['AGRI-001:B2:temp']} color="#C94D3D"/></div>
      <div className="card"><b style={{fontSize:15}}>AWD Status</b><p style={{marginTop:8}}>{f.awd} — Drying Day 6–12</p><div className="badge b-proto">PROTOTYPE</div><p style={{fontSize:13.5,color:'var(--muted)',marginTop:10,lineHeight:1.55}}>Demo simplification: stress shown at 0 cm ponded. Field AWD per IRRI re-irrigates at <b>−15 cm tube reading</b>.</p><Link className="btn" style={{display:'inline-block',marginTop:8}} to="/intelligence">Open Intelligence →</Link></div>
    </div>
  </>);
}
