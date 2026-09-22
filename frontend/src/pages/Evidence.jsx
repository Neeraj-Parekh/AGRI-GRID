import { Link } from 'react-router-dom';
import { EVIDENCE } from '../data/demo.js';

export default function Evidence(){
  const hero = EVIDENCE.find(e=>e.id==='EV-2026-0139');
  return (<>
    <h1 className="page-title">Evidence</h1>
    <p className="page-sub">Ground × Space × Context → cross-validation → confidence → review. <span className="badge b-sim">SIMULATED SAR/WEATHER</span></p>

    {/* HERO: the discrepancy case */}
    <div className="card" style={{marginBottom:16,borderColor:'#F5C4BC',borderWidth:1.5}}>
      <div className="field-head" style={{marginBottom:14}}>
        <b style={{fontSize:17}}>Featured Evidence Record</b>
        <span className="badge b-alert" style={{marginLeft:8}}>DISCREPANCY → REVIEW REQUIRED</span>
        <span className="badge b-sim" style={{marginLeft:4}}>SIMULATED</span>
      </div>

      {/* FIELD header */}
      <div style={{display:'flex',gap:20,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
        <div style={{background:'#F0F9F2',border:'1.5px solid #BFE3C9',borderRadius:10,padding:'10px 16px'}}>
          <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--muted)',fontWeight:700}}>FIELD</div>
          <div style={{fontSize:18,fontWeight:800}}>{hero.field}</div>
        </div>
        <div style={{background:'#F5F6F1',border:'1.5px solid var(--border)',borderRadius:10,padding:'10px 16px'}}>
          <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--muted)',fontWeight:700}}>ZONE</div>
          <div style={{fontSize:18,fontWeight:800}}>{hero.zone}</div>
        </div>
        <div style={{background:'#F5F6F1',border:'1.5px solid var(--border)',borderRadius:10,padding:'10px 16px'}}>
          <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--muted)',fontWeight:700}}>TIME</div>
          <div style={{fontSize:15,fontWeight:700}}>{hero.time}</div>
        </div>
        <div style={{background:'#F5F6F1',border:'1.5px solid var(--border)',borderRadius:10,padding:'10px 16px'}}>
          <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--muted)',fontWeight:700}}>OBSERVATION</div>
          <div style={{fontSize:15,fontWeight:700}}>{hero.obs}</div>
        </div>
      </div>

      {/* Three sources */}
      <div className="evi-grid">
        <div className="evi" style={{borderColor:'#BFE3C9'}}>
          <h4>🛰️ Ground</h4>
          <p style={{fontSize:16,fontWeight:700,margin:'0 0 6px'}}>{hero.ground}</p>
          <p style={{fontSize:13,color:'var(--muted)',margin:0}}>Source: Node {hero.zone} · LoRa 865 MHz</p>
        </div>
        <div className="evi" style={{borderColor:'#B8D4EC'}}>
          <h4>🛰️ Space</h4>
          <p style={{fontSize:16,fontWeight:700,margin:'0 0 6px'}}>{hero.space}</p>
          <p style={{fontSize:13,color:'var(--muted)',margin:0}}>Source: Simulated Sentinel-1 SAR — <b>SIMULATED</b>, not real imagery</p>
        </div>
        <div className="evi" style={{borderColor:'#EAD9A8'}}>
          <h4>🌦️ Context</h4>
          <p style={{fontSize:16,fontWeight:700,margin:'0 0 6px'}}>{hero.context}</p>
          <p style={{fontSize:13,color:'var(--muted)',margin:0}}>Source: Simulated weather — <b>SIMULATED</b></p>
        </div>
      </div>

      {/* Cross-validation result */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginTop:4}}>
        <div style={{background:'#F5F6F1',border:'1.5px solid var(--border)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--muted)',fontWeight:700,marginBottom:6}}>CONSISTENCY</div>
          <div style={{fontSize:22,fontWeight:800,color:'var(--red)'}}>{hero.consistency}</div>
          <div style={{fontSize:13,color:'var(--muted)',marginTop:4}}>Ground says HIGH water. SAR says LOW. Weather is dry — sources disagree.</div>
        </div>
        <div style={{background:'#F5F6F1',border:'1.5px solid var(--border)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--muted)',fontWeight:700,marginBottom:6}}>CONFIDENCE</div>
          <div className="conf" style={{color:'var(--amber)'}}>{hero.confidence}%</div>
          <div style={{height:8,background:'#EAEDE7',borderRadius:99,marginTop:8}}><div style={{width:`${hero.confidence}%`,height:'100%',background:'var(--amber)',borderRadius:99}}/></div>
          <div style={{fontSize:13,color:'var(--muted)',marginTop:6}}>Lowered from high-confidence by source disagreement. Never 100% on simulated inputs.</div>
        </div>
        <div style={{background:'#FFF5F3',border:'1.5px solid #F5C4BC',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',color:'#8f2b1f',fontWeight:700,marginBottom:6}}>REVIEW STATUS</div>
          <div style={{fontSize:20,fontWeight:800,color:'var(--red)'}}>{hero.review}</div>
          <div style={{fontSize:13.5,color:'var(--text)',marginTop:6,lineHeight:1.5}}>Disagreement ≠ fraud. Discrepancy lowers confidence and triggers <b>human review</b> — a person must decide before this record is trusted.</div>
        </div>
      </div>

      {/* Traceability */}
      <details style={{marginTop:14}}>
        <summary style={{cursor:'pointer',fontSize:14,fontWeight:600,color:'var(--green)'}}>View traceability & lineage</summary>
        <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div><b style={{fontSize:14}}>Lineage chain</b>
            <table className="tbl" style={{marginTop:6,fontSize:13}}><tbody>
              {hero.lineage.map((l,i)=><tr key={i}><td>Step {i+1}</td><td><code className="inline">{l}</code></td></tr>)}
            </tbody></table>
          </div>
          <div><b style={{fontSize:14}}>Record metadata</b>
            <dl className="kv" style={{fontSize:13}}>
              <dt>Record ID</dt><dd>{hero.id}</dd>
              <dt>Ground source</dt><dd>Node {hero.zone} (LoRa)</dd>
              <dt>Satellite source</dt><dd>SAR (simulated)</dd>
              <dt>Context source</dt><dd>Weather (simulated)</dd>
              <dt>Confidence</dt><dd>{hero.confidence}%</dd>
              <dt>Anomaly</dt><dd>Yes — flagged</dd>
            </dl>
            <p style={{fontSize:12.5,color:'var(--muted)'}}>Cryptographic audit trail — roadmap. Demo-only record hash, not production blockchain.</p>
          </div>
        </div>
      </details>
    </div>

    {/* All records table */}
    <div className="card">
      <div className="field-head"><b style={{fontSize:17}}>All Evidence Records</b><span style={{marginLeft:'auto',fontSize:13,color:'var(--muted)'}}>{EVIDENCE.length} records</span></div>
      <table className="tbl" style={{marginTop:12}}><thead><tr><th>Record</th><th>Field/Zone</th><th>Ground</th><th>Space</th><th>Context</th><th>Consistency</th><th>Conf.</th><th>Review</th><th></th></tr></thead><tbody>
      {EVIDENCE.map(e=><tr key={e.id}>
        <td><b>{e.id}</b><br/><small style={{color:'var(--muted)'}}>{e.time}</small></td>
        <td>{e.field}<br/><small style={{color:'var(--muted)'}}>{e.zone}</small></td>
        <td style={{fontSize:13}}>{e.ground}</td>
        <td style={{fontSize:13}}>{e.space}</td>
        <td style={{fontSize:13}}>{e.context}</td>
        <td><span className={`badge ${e.consistency==='Consistent'?'b-active':'b-alert'}`}>{e.consistency}</span></td>
        <td><b>{e.confidence}%</b></td>
        <td style={{fontSize:13}}>{e.review}</td>
        <td><Link className="btn ghost" to={`/evidence/${e.id}`}>View</Link></td>
      </tr>)}
      </tbody></table>
      <p style={{fontSize:13,color:'var(--muted)',marginTop:10}}>Disagreement ≠ fraud. Discrepancy lowers confidence and triggers human review. High agreement raises confidence — never to 100% on simulated inputs.</p>
    </div>
  </>);
}

export function EvidenceDetail({ id }){
  const e = EVIDENCE.find(x=>x.id===id) || EVIDENCE[0];
  const isDisc = e.consistency==='Discrepancy';
  return (<>
    <Link to="/evidence" style={{fontSize:14,fontWeight:600,color:'var(--green)'}}>← Back to Evidence</Link>
    <h1 className="page-title">{e.id}</h1>
    <p className="page-sub">{e.field} · Zone {e.zone} · {e.time} <span className="badge b-sim">SIMULATED</span></p>
    <div className="evi-grid">
      <div className="evi" style={{borderColor:isDisc?'#BFE3C9':'#BFE3C9'}}>
        <h4>🛰️ Ground</h4>
        <p style={{fontSize:17,fontWeight:700,margin:'0 0 8px'}}>{e.ground}</p>
        <p style={{fontSize:13,color:'var(--muted)',margin:0}}>Node {e.zone} · LoRa 865 MHz · hash demo:a3f9…</p>
      </div>
      <div className="evi" style={{borderColor:isDisc?'#F5C4BC':'#B8D4EC'}}>
        <h4>🛰️ Space</h4>
        <p style={{fontSize:17,fontWeight:700,margin:'0 0 8px'}}>{e.space}</p>
        <p style={{fontSize:13,color:'var(--muted)',margin:0}}>Simulated Sentinel-1 SAR 10m — <b>SIMULATED</b>, not real imagery</p>
      </div>
      <div className="evi" style={{borderColor:isDisc?'#F5C4BC':'#EAD9A8'}}>
        <h4>🌦️ Context</h4>
        <p style={{fontSize:17,fontWeight:700,margin:'0 0 8px'}}>{e.context}</p>
        <p style={{fontSize:13,color:'var(--muted)',margin:0}}>Simulated weather — <b>SIMULATED</b></p>
      </div>
    </div>
    <div className="layout-2">
      <div className="card" style={{borderColor:isDisc?'#F5C4BC':'#BFE3C9'}}>
        <b style={{fontSize:17}}>Cross-validation</b>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginTop:14}}>
          <div><div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--muted)',fontWeight:700}}>CONSISTENCY</div><div style={{fontSize:22,fontWeight:800,color:isDisc?'var(--red)':'var(--green)'}}>{e.consistency}</div></div>
          <div><div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--muted)',fontWeight:700}}>CONFIDENCE</div><div className="conf" style={{color:e.confidence>70?'var(--green)':'var(--amber)'}}>{e.confidence}%</div></div>
          <div><div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--muted)',fontWeight:700}}>REVIEW</div><div style={{fontSize:17,fontWeight:700}}>{e.review}</div></div>
        </div>
        {isDisc&&<div className="why" style={{marginTop:14}}><h5>Why this matters</h5><p>Ground reads HIGH water while SAR reads LOW. Sources disagree — this lowers confidence and requires <b>human review</b> before the record can be trusted. Disagreement ≠ fraud; it means "don't auto-validate."</p></div>}
      </div>
      <div className="card">
        <b style={{fontSize:17}}>Traceability</b>
        <table className="tbl" style={{marginTop:10,fontSize:13.5}}>
          <thead><tr><th>Step</th><th>Record</th></tr></thead>
          <tbody>{e.lineage.map((l,i)=><tr key={i}><td>Step {i+1}</td><td><code className="inline">{l}</code></td></tr>)}</tbody>
        </table>
        <dl className="kv" style={{fontSize:13.5,marginTop:12}}>
          <dt>Record ID</dt><dd>{e.id}</dd>
          <dt>Ground source</dt><dd>Node {e.zone} (LoRa)</dd>
          <dt>Satellite source</dt><dd>SAR (simulated)</dd>
          <dt>Context source</dt><dd>Weather (simulated)</dd>
          <dt>Model/inference</dt><dd>Spatial IDW (prototype)</dd>
          <dt>Crypto</dt><dd>Roadmap — demo hash only</dd>
        </dl>
      </div>
    </div>
  </>);
}
