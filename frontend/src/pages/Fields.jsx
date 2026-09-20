import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FIELDS } from '../data/demo.js';
export default function Fields(){
  const [q,setQ]=useState(''); const [crop,setCrop]=useState('all'); const [st,setSt]=useState('all');
  const rows = FIELDS.filter(f=>(f.id.toLowerCase().includes(q.toLowerCase()))&&(crop==='all'||f.crop===crop)&&(st==='all'||f.state===st));
  return (<><h1 className="page-title">Fields</h1><p className="page-sub">Browse the field portfolio — search, filter, open detail. <span className="badge b-sim">SIMULATED</span></p>
  <div className="filters"><input placeholder="Search field ID…" value={q} onChange={e=>setQ(e.target.value)} aria-label="Search fields"/><select value={crop} onChange={e=>setCrop(e.target.value)}><option value="all">All crops</option><option>Paddy</option><option>Sugarcane</option><option>Vegetables</option></select><select value={st} onChange={e=>setSt(e.target.value)}><option value="all">All status</option><option value="normal">Normal</option><option value="watch">Watch</option><option value="alert">Alert</option></select></div>
  <div className="card"><table className="tbl"><thead><tr><th>Field</th><th>Crop</th><th>Area</th><th>Status</th><th>Nodes</th><th>Water</th><th>AWD</th><th>Updated</th><th></th></tr></thead><tbody>
  {rows.map(f=><tr key={f.id}><td><b>{f.id}</b></td><td>{f.crop}</td><td>{f.area} ha</td><td><span className={`badge ${f.state==='alert'?'b-alert':f.state==='watch'?'b-watch':'b-active'}`}>{f.state}</span></td><td>{f.nodes}</td><td>{f.water} cm</td><td>{f.awd}</td><td>{f.updated}</td><td><Link className="btn ghost" to={`/fields/${f.id}`}>Open</Link></td></tr>)}
  </tbody></table>{rows.length===0&&<p>No fields match. Try clearing filters.</p>}</div></>);
}
