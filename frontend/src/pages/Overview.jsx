import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Droplet, AlertTriangle, Leaf, Database } from 'lucide-react';
import FieldMap from '../components/FieldMap.jsx';
import { Spark } from '../components/Charts.jsx';
import IdwPanel from '../components/IdwPanel.jsx';
import { FieldArt } from '../components/FieldArt.jsx';
import { useLiveData } from '../context/ModeContext.jsx';
import { CLUSTER, ALERTS, TELEMETRY, getKpis } from '../data/demo.js';

function Kpi({ icon, bg, value, label, delta, bad }){
  return <div className="card kpi"><div className="kpi-ic" style={{background:bg}}>{icon}</div><div><b>{value}</b><small>{label}</small></div><span className={`delta ${bad?'down-bad':'up'}`}>{delta}</span></div>;
}
export default function Overview(){
  const [layer,setLayer]=useState('map');
  const [sel,setSel]=useState('AGRI-001');
  const { fields, nodes, isLive } = useLiveData();
  const KPIS = getKpis(fields);
  const f = fields.find(x=>x.id===sel) || fields[0];
  const selNodes = nodes.filter(n=>n.fieldId===f.id);
  return (<>
    <h1 className="page-title">Field Intelligence for a Sustainable Tomorrow</h1>
    <p className="page-sub">Monitor. Understand. Act. For resilient farms and a healthier planet.</p>
    <div className="meta-row"><span>⛅ <b>{CLUSTER.weather.temp}°C</b> {CLUSTER.weather.cond}</span><span>🌱 <b>{CLUSTER.season}</b> {CLUSTER.crop}</span><span>📅 Last updated <b>{CLUSTER.lastUpdated}</b></span>{isLive?<span className="badge b-active">LIVE — local API store</span>:<span className="badge b-sim">SIMULATED</span>}</div>
    <div className="grid-kpi">
      <Kpi icon={<Droplet color="#2D78B7"/>} bg="#E3EFFA" value={`${KPIS.normalPct}%`} label="Fields in normal water state" delta="↑ 12%"/>
      <Kpi icon={<AlertTriangle color="#C94D3D"/>} bg="#FDE8E4" value={KPIS.attention} label="Fields require attention" delta="↑ 1" bad/>
      <Kpi icon={<Leaf color="#2F7D46"/>} bg="#E3F3DF" value={KPIS.awd} label="AWD cycles compliant" delta="↑ 25%"/>
      <Kpi icon={<Database color="#2D78B7"/>} bg="#E3EFFA" value={KPIS.nodes} label="Active sensor nodes" delta="100%"/>
    </div>
    <div className="layout-2">
      <div className="card">
        <div className="field-head"><div><b>Field Map</b><br/><small style={{color:'#65716B'}}>{CLUSTER.name} • {fields.length} fields</small></div>
          <div className="map-tools" style={{position:'static',marginLeft:'auto'}}>{['map','satellite','ndvi','water'].map(l=><button key={l} className={layer===l?'on':''} onClick={()=>setLayer(l)}>{l==='map'?'Map':l==='satellite'?'Satellite':l==='ndvi'?'NDVI':'Water State'}</button>)}</div></div>
        <div style={{marginTop:10}}><FieldMap layer={layer} selected={sel} onSelect={setSel} nodesOverride={nodes}/></div>
        {layer==='water'&&<small>IDW (p=2) surface computed live from {selNodes.length} node readings — not a flat fill.</small>}
      </div>
      <div className="card">
        <div className="field-head"><b>Selected Field</b>{isLive&&<span className="badge b-active" style={{marginLeft:8}}>LIVE values</span>}</div>
        <h2 style={{margin:'6px 0'}}>{f.id} <span className="badge b-paddy">{f.crop}</span> <span className="badge b-active">● Active</span></h2>
        <FieldArt label={`${f.id} · ${f.crop} — illustrative`} variant={0}/>
        <dl className="kv"><dt>Area</dt><dd>{f.area} ha</dd><dt>Sensor Nodes</dt><dd>{f.nodes}</dd><dt>Crop Stage</dt><dd>{f.stage}</dd><dt>AWD Cycle</dt><dd>{f.awd}</dd><dt>Last Update</dt><dd>{f.updated}</dd></dl>
        <b>Field Health</b><div className="healthbar"><div style={{width:`${f.health}%`}}/></div><div style={{textAlign:'right',fontWeight:800}}>{f.health}%</div>
        <div className="tele3">
          <div className="tele">💧 Water Level<br/><b>{f.water} cm</b><Spark data={TELEMETRY['AGRI-001:avg:water']}/></div>
          <div className="tele">🌱 Soil Moisture<br/><b>{f.moisture}%</b><Spark data={TELEMETRY['AGRI-001:B2:moisture']} color="#2F7D46"/></div>
          <div className="tele">🌡️ Temperature<br/><b>{f.temp}°C</b><Spark data={TELEMETRY['AGRI-001:B2:temp']} color="#C94D3D"/></div>
        </div>
        <Link className="btn" style={{display:'inline-block',marginTop:12}} to={`/fields/${f.id}`}>View Field Details →</Link>
      </div>
    </div>
    <div className="layout-3">
      <div className="card"><div className="field-head"><b>Recent Alerts</b><Link to="/intelligence" style={{marginLeft:'auto',fontSize:13}}>View All →</Link></div>
        {ALERTS.slice(0,3).map(a=><div className="alert-row" key={a.id}><div className={`sev ${a.sev}`}><AlertTriangle size={15}/></div><div><b>{a.title}</b><br/><small style={{color:'#65716B'}}>{a.field} • {a.node}</small></div><small style={{marginLeft:'auto'}}>{a.ago}</small></div>)}
      </div>
      <div className="card"><b>Field Water State ({f.id})</b> {isLive?<span className="badge b-active">LIVE nodes</span>:<span className="badge b-sim">SIMULATED</span>}<div style={{marginTop:8}}><IdwPanel poly={f.poly} nodes={selNodes}/></div></div>
      <div className="card"><div className="field-head"><b>AWD Progress</b><small style={{marginLeft:'auto'}}>Cycle 3</small></div>
        <div className="timeline"><div className="tstep done">Flooded<br/>Day 1–5</div><div className="tstep now">Drying<br/>Day 6–12</div><div className="tstep">Irrigate<br/>Day 13</div><div className="tstep">Next Cycle<br/>Day 14+</div></div>
        <div className="card" style={{background:'#EDF5EA'}}>🍃 <b>On track</b><br/><small>Field is following the planned AWD cycle.</small><br/><small>Illustrative timeline — real AWD re-irrigates at −15 cm tube reading (IRRI), not a calendar day.</small></div></div>
    </div>
  </>);
}
