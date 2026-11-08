import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveData } from '../context/ModeContext.jsx';
import { useSite } from '../context/SiteContext.jsx';
export default function Fields(){
  const [q,setQ]=useState(''); const [crop,setCrop]=useState('all'); const [st,setSt]=useState('all');
  const { fields, isLive } = useLiveData();
  const { site, farm } = useSite();
  const crops = [...new Set(fields.map(f=>f.crop))];
  const rows = fields.filter(f=>(f.id.toLowerCase().includes(q.toLowerCase()))&&(crop==='all'||f.crop===crop)&&(st==='all'||f.state===st));
  const normal = fields.filter(f=>f.state==='normal').length;
  const watch = fields.filter(f=>f.state==='watch').length;
  const alert = fields.filter(f=>f.state==='alert').length;
  return (<>
    <h1 className="page-title">Field Portfolio</h1>
    <p className="page-sub">{fields.length} fields at {site.name}, {site.state} · {farm.season} · boundaries from {farm.boundarySource} {isLive?<span className="badge b-active">LIVE</span>:<span className="badge b-sim">SIMULATED</span>}</p>
    <div className="chips">
      <div className="chip normal"><span className="count">{normal}</span> Normal</div>
      <div className="chip watch"><span className="count">{watch}</span> Watch</div>
      <div className="chip alert"><span className="count">{alert}</span> Alert</div>
      <div className="chip"><span className="count">{fields.reduce((s,f)=>s+f.nodes,0)}</span> Nodes</div>
      <div className="chip"><span className="count">{fields.reduce((s,f)=>s+f.area,0).toFixed(1)}</span> ha total</div>
    </div>
    <div className="filters"><input placeholder="Search field ID…" value={q} onChange={e=>setQ(e.target.value)} aria-label="Search fields"/><select value={crop} onChange={e=>setCrop(e.target.value)}><option value="all">All crops</option>{crops.map(c=><option key={c}>{c}</option>)}</select><select value={st} onChange={e=>setSt(e.target.value)}><option value="all">All status</option><option value="normal">Normal</option><option value="watch">Watch</option><option value="alert">Alert</option></select></div>
    <div className="card"><table className="tbl"><thead><tr><th>Field</th><th>Crop</th><th>Area</th><th>Status</th><th>Nodes</th><th>Water / moisture</th><th>AWD</th><th>Updated</th><th></th></tr></thead><tbody>
  {rows.map(f=><tr key={f.id}><td><b>{f.id}</b></td><td>{f.crop}</td><td>{f.area} ha</td><td><span className={`badge ${f.state==='alert'?'b-alert':f.state==='watch'?'b-watch':'b-active'}`}>{f.state}</span></td><td>{f.nodes}</td><td><b>{f.water!=null?`${f.water} cm`:`${f.moisture}% soil`}</b></td><td>{f.awd}</td><td style={{color:'var(--muted)',fontSize:13}}>{f.updated}</td><td><Link className="btn ghost" to={`/fields/${f.id}`}>Open →</Link></td></tr>)}
  </tbody></table>{rows.length===0&&<p style={{color:'var(--muted)',padding:'20px 0'}}>No fields match. Try clearing filters.</p>}</div>
  </>);
}
