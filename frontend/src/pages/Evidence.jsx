import { Link } from 'react-router-dom';
import { EVIDENCE } from '../data/demo.js';
export default function Evidence(){
  return (<><h1 className="page-title">Evidence</h1><p className="page-sub">Ground + Space + Context → cross-validation → confidence → review. <span className="badge b-sim">SIMULATED SAR/WEATHER</span></p>
  <div className="card"><table className="tbl"><thead><tr><th>Record</th><th>Field/Zone</th><th>Ground</th><th>Space</th><th>Context</th><th>Consistency</th><th>Conf.</th><th>Review</th><th></th></tr></thead><tbody>
  {EVIDENCE.map(e=><tr key={e.id}><td><b>{e.id}</b><br/><small>{e.time}</small></td><td>{e.field}<br/>{e.zone}</td><td>{e.ground}</td><td>{e.space}</td><td>{e.context}</td><td><span className={`badge ${e.consistency==='Consistent'?'b-active':'b-alert'}`}>{e.consistency}</span></td><td><b>{e.confidence}%</b></td><td>{e.review}</td><td><Link className="btn ghost" to={`/evidence/${e.id}`}>View</Link></td></tr>)}
  </tbody></table>
  <p><small>Disagreement ≠ fraud. Discrepancy lowers confidence and triggers human review. High agreement raises confidence — never to 100% on simulated inputs.</small></p></div></>);
}
export function EvidenceDetail({ id }){
  const e = EVIDENCE.find(x=>x.id===id) || EVIDENCE[0];
  return (<><Link to="/evidence">← Evidence</Link><h1 className="page-title">{e.id}</h1><p className="page-sub">{e.field} · Zone {e.zone} · {e.time} <span className="badge b-sim">SIMULATED</span></p>
  <div className="evi-grid"><div className="evi"><b>🛰️ GROUND</b><p>{e.ground}</p><small>Source: Node {e.zone} · LoRa 865MHz · record hash demo:a3f9…</small></div><div className="evi"><b>🛰️ SPACE</b><p>{e.space}</p><small>Source: simulated Sentinel-1 SAR · 10m · SIMULATED — not real imagery</small></div><div className="evi"><b>🌦️ CONTEXT</b><p>{e.context}</p><small>Source: simulated weather · SIMULATED</small></div></div>
  <div className="layout-2"><div className="card"><b>Cross-validation</b><p>Consistency: <span className="badge b-active">{e.consistency}</span></p><p className="conf">{e.confidence}% confidence</p><p>Review: <b>{e.review}</b></p></div>
  <div className="card"><b>Traceability</b><table className="tbl"><tbody>{e.lineage.map((l,i)=><tr key={i}><td>Step {i+1}</td><td><code className="inline">{l}</code></td></tr>)}</tbody></table><p><small>Cryptographic audit trail — roadmap. Demo-only record hash, not production blockchain.</small></p></div></div></>);
}
