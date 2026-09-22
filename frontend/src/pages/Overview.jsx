import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Droplet, AlertTriangle, Leaf, Database } from 'lucide-react';
import FieldMap from '../components/FieldMap.jsx';
import { Spark } from '../components/Charts.jsx';
import IdwPanel from '../components/IdwPanel.jsx';
import { FieldArt } from '../components/FieldArt.jsx';
import { useLiveData } from '../context/ModeContext.jsx';
import { CLUSTER, ALERTS, TELEMETRY, getKpis } from '../data/demo.js';

function Kpi({ icon, bg, title, value, ctx, delta, bad }){
  return <div className="card kpi"><div className="kpi-ic" style={{background:bg}}>{icon}</div><div><b>{value}</b><small>{title}</small><span className="ctx">{ctx}</span></div><span className={`delta ${bad?'down-bad':'up'}`}>{delta}</span></div>;
}
export default function Overview(){
  const [layer,setLayer]=useState('water');
  const [sel,setSel]=useState('AGRI-001');
  const { fields, nodes, isLive } = useLiveData();
  const KPIS = getKpis(fields);
  const f = fields.find(x=>x.id===sel) || fields[0];
  const selNodes = nodes.filter(n=>n.fieldId===f.id);
  const watch = fields.filter(x=>x.state==='watch').length;
  const alert = fields.filter(x=>x.state==='alert').length;
  return (<>
    <h1 className="page-title">Field Intelligence for a Sustainable Tomorrow</h1>
    <p className="page-sub">Monitor. Understand. Act. For resilient farms and a healthier planet.</p>
    <div className="meta-row"><span>⛅ <b>{CLUSTER.weather.temp}°C</b> {CLUSTER.weather.cond}</span><span>🌱 <b>{CLUSTER.season}</b> {CLUSTER.crop}</span><span>📅 Last updated <b>{CLUSTER.lastUpdated}</b></span>{isLive?<span className="badge b-active">LIVE — local API store</span>:<span className="badge b-sim">SIMULATED</span>}</div>
    <div className="grid-kpi">
      <Kpi icon={<Droplet color="#2D78B7"/>} bg="#E3EFFA" title="Fields in normal water state" value={`${KPIS.normalPct}%`} ctx={`${KPIS.total} fields monitored`} delta="↑ 12%"/>
      <Kpi icon={<AlertTriangle color="#C94D3D"/>} bg="#FDE8E4" title="Require attention" value={KPIS.attention} ctx={`${watch} watch · ${alert} alert zones`} delta="↑ 1" bad/>
      <Kpi icon={<Leaf color="#2F7D46"/>} bg="#E3F3DF" title="AWD cycles on track" value={KPIS.awd} ctx="5 of 6 paddy fields compliant" delta="↑ 25%"/>
      <Kpi icon={<Database color="#2D78B7"/>} bg="#E3EFFA" title="Active sensor nodes" value={KPIS.nodes} ctx="All reporting within 10 min" delta="100%"/>
    </div>
    <div className="layout-hero">
      <div className="card">
        <div className="field-head"><div><b style={{fontSize:16}}>Field Map</b><br/><small style={{color:'#65716B'}}>{CLUSTER.name} • {fields.length} fields — click a field to explore</small></div>
          <div className="map-tools" style={{position:'static',marginLeft:'auto'}}>{['map','satellite','ndvi','water'].map(l=><button key={l} className={layer===l?'on':''} onClick={()=>setLayer(l)}>{l==='map'?'Map':l==='satellite'?'Satellite':l==='ndvi'?'NDVI':'Water State'}</button>)}</div></div>
        <div style={{marginTop:10}}><FieldMap layer={layer} selected={sel} onSelect={setSel} nodesOverride={nodes}/></div>
        {layer==='water'&&<small style={{display:'block',marginTop:8,color:'#65716B'}}>IDW (p=2) surface computed from {selNodes.length} node readings — not a flat fill</small>}
      </div>
      <div className="card">
        <div className="field-head"><b style={{fontSize:16}}>Selected Field</b>{isLive&&<span className="badge b-active" style={{marginLeft:8}}>LIVE</span>}</div>
        <h2 style={{margin:'8px 0 10px',fontSize:26,fontWeight:800,letterSpacing:'-.5px'}}>{f.id} <span className="badge b-paddy">{f.crop}</span> <span className={`badge ${f.state==='alert'?'b-alert':f.state==='watch'?'b-watch':'b-active'}`}>● {f.state}</span></h2>
        <FieldArt label={`${f.id} · ${f.crop} — illustrative`} variant={0}/>
        <dl className="kv"><dt>Area</dt><dd>{f.area} ha</dd><dt>Sensor Nodes</dt><dd>{f.nodes}</dd><dt>Crop Stage</dt><dd>{f.stage}</dd><dt>AWD Cycle</dt><dd>{f.awd}</dd><dt>Last Update</dt><dd>{f.updated}</dd></dl>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}><b style={{fontSize:14}}>Field Health</b><b style={{fontSize:22,fontWeight:800}}>{f.health}%</b></div>
        <div className="healthbar"><div style={{width:`${f.health}%`}}/></div>
        <div className="tele3">
          <div className="tele"><small>💧 Water Level</small><b>{f.water} cm</b><Spark data={TELEMETRY['AGRI-001:avg:water']}/></div>
          <div className="tele"><small>🌱 Soil Moisture</small><b>{f.moisture}%</b><Spark data={TELEMETRY['AGRI-001:B2:moisture']} color="#2F7D46"/></div>
          <div className="tele"><small>🌡️ Temperature</small><b>{f.temp}°C</b><Spark data={TELEMETRY['AGRI-001:B2:temp']} color="#C94D3D"/></div>
        </div>
        <Link className="btn" style={{display:'inline-block',marginTop:14,width:'100%',textAlign:'center'}} to={`/fields/${f.id}`}>View Field Details →</Link>
      </div>
    </div>
    <div className="layout-3">
      <div className="card"><div className="field-head"><b style={{fontSize:16}}>Recent Alerts</b><Link to="/intelligence" style={{marginLeft:'auto',fontSize:13,fontWeight:600,color:'var(--green)'}}>View All →</Link></div>
        {ALERTS.slice(0,3).map(a=><div className="alert-row" key={a.id}><div className={`sev ${a.sev}`}>!</div><div><b>{a.title}</b><br/><small style={{color:'#65716B'}}>{a.field} • {a.node}</small></div><small style={{marginLeft:'auto',color:'#65716B'}}>{a.ago}</small></div>)}
      </div>
      <div className="card"><div className="field-head"><b style={{fontSize:16}}>Field Water State</b> <small style={{color:'#65716B'}}>({f.id})</small> {isLive?<span className="badge b-active">LIVE</span>:<span className="badge b-sim">SIMULATED</span>}</div>
        <div style={{marginTop:10}}><IdwPanel poly={f.poly} nodes={selNodes}/></div></div>
      <div className="card"><div className="field-head"><b style={{fontSize:16}}>AWD Progress</b><small style={{marginLeft:'auto',color:'#65716B'}}>Cycle 3</small></div>
        <div className="timeline"><div className="tstep done"><b>Flooded</b>Day 1–5</div><div className="tstep now"><b>Drying</b>Day 6–12</div><div className="tstep"><b>Irrigate</b>Day 13</div><div className="tstep"><b>Next Cycle</b>Day 14+</div></div>
        <div className="card" style={{background:'#EDF5EA',borderColor:'#BFE3C9'}}>🍃 <b>On track</b><br/><small style={{color:'#65716B'}}>Field is following the planned AWD cycle. Demo timeline is illustrative — field AWD per IRRI re-irrigates at −15 cm tube reading.</small></div></div>
    </div>
  </>);
}
