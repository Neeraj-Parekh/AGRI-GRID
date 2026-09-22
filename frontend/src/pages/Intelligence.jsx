import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import IdwPanel from '../components/IdwPanel.jsx';
import { ALERTS, FIELDS, NODES } from '../data/demo.js';

function Tech({ children }){
  const [open,setOpen]=useState(false);
  return <div style={{marginTop:10}}><button className="btn ghost" style={{fontSize:13,padding:'6px 14px',display:'flex',alignItems:'center',gap:6}} onClick={()=>setOpen(!open)}>Technical details {open?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</button>{open&&<pre className="code" style={{marginTop:8}}>{children}</pre>}</div>;
}

export default function Intelligence(){
  const f = FIELDS.find(x=>x.id==='AGRI-001');
  const n = NODES.filter(x=>x.fieldId==='AGRI-001');
  // 6×4 grid: green normal, amber watch, red alert at B2 position
  const cells = [];
  for(let r=0;r<4;r++) for(let c=0;c<6;c++){
    const cls = (r===1&&c===2)||(r===2&&c===2) ? 'r' : (r===1&&c===3)||(r===2&&c===3)||(r===1&&c===1)||(r===2&&c===3) ? 'y' : 'g';
    cells.push(cls);
  }
  return (<>
    <h1 className="page-title">Field Intelligence</h1>
    <p className="page-sub">Detect · Infer · Predict — spatial reasoning across the sensor grid. <span className="badge b-proto">PROTOTYPE</span> <span className="badge b-sim">SIMULATED</span></p>

    {/* HERO: spatial field model */}
    <div className="layout-hero" style={{marginBottom:20}}>
      <div className="field-model">
        <h4>FIELD MODEL — AGRI-001 · Spatial water-state grid</h4>
        <p style={{fontSize:15,margin:'4px 0 0',color:'#C8DDD0'}}>Nodes A1, B2, C3, D4 sampled every 10 min. Grid shows interpolated zone state (IDW p=2).</p>
        <div style={{position:'relative',margin:'18px 0'}}>
          <div className="fm-grid">
            {cells.map((cls,i)=><div key={i} className={`fm-cell ${cls} ${i===8?'sel':''}`}/>)}
          </div>
          <div className="fm-node" style={{left:28,top:32}}>A1</div>
          <div className="fm-node" style={{left:128,top:92}}>B2</div>
          <div className="fm-node" style={{left:188,top:152}}>C3</div>
          <div className="fm-node" style={{left:88,top:212}}>D4</div>
        </div>
        <div style={{display:'flex',gap:18,fontSize:12,color:'#9DBDB0',marginTop:8}}>
          <span>🟢 Normal</span><span>🟡 Watch</span><span style={{color:'#F5A89A'}}>🔴 Anomaly zone B2</span>
        </div>
        <p style={{fontSize:13,color:'#9DBDB0',marginTop:14}}>Zone B2 flagged: water dropped 4 cm / 30 min while neighbours B1, B3, B4 stayed stable.</p>
      </div>

      {/* DETECT */}
      <div className="card">
        <div className="field-head"><span style={{fontSize:22}}>🔍</span><b style={{fontSize:18}}>DETECT</b></div>
        <p style={{marginTop:10,fontSize:15,lineHeight:1.6}}><b>Why was this flagged?</b></p>
        <p style={{fontSize:14.5,lineHeight:1.6,color:'var(--text)'}}>Water level dropped <b>4 cm in 30 minutes</b> at Zone B2 — far exceeding normal AWD drying rate.</p>
        <div className="why">
          <h5>Why it matters</h5>
          <p><b>Observation:</b> 4 cm drop in 30 min (≈190× normal AWD drawdown of ~1 cm/day)</p>
          <p><b>Spatial context:</b> Neighbouring zones B1, B3, B4 remained stable (5.7–6.8 cm)</p>
          <p><b>Interpretation:</b> Localized drying event — likely bund leak or breach, not field-wide</p>
          <p><b>Suggested action:</b> Inspect Zone B2 before next irrigation decision</p>
        </div>
        <Tech>{`ANOMALY SCORE: 0.92\nTIME: 15 Sep 2026 12:32\nSOURCES: Node B2 + neighbours B1/B3/B4\nMETHOD: Rate-of-change + spatial deviation (IsolationForest prototype)\nREFERENCE: AWD normal drawdown ~1 cm/day (IRRI)`}</Tech>
        <h4 style={{fontSize:13,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--muted)',margin:'16px 0 4px',fontWeight:700}}>Recent alerts</h4>
        {ALERTS.map(a=><div className="alert-row" key={a.id}><div className={`sev ${a.sev}`}>!</div><div><b>{a.title}</b><br/><small style={{color:'#65716B'}}>{a.field} • {a.node} • {a.time}</small><br/><small style={{color:'#65716B',fontSize:12.5}}>{a.why}</small></div></div>)}
      </div>
    </div>

    <div className="layout-3">
      {/* INFER */}
      <div className="card">
        <div className="field-head"><span style={{fontSize:22}}>🧩</span><b style={{fontSize:18}}>INFER</b></div>
        <p style={{marginTop:10,fontSize:15,lineHeight:1.6}}><b>What is happening spatially?</b></p>
        <p style={{fontSize:14.5,lineHeight:1.6}}>Zones B2–B4 show <b>accelerated drying</b> relative to neighbouring zones B1 and the broader field.</p>
        <IdwPanel poly={f.poly} nodes={n} height={130}/>
        <p style={{fontSize:13,color:'var(--muted)',marginTop:8}}>IDW (p=2) surface computed in-browser from {n.length} node readings. Affected ~0.6 ha. Confidence: <b>78%</b>.</p>
        <Tech>{`INTERPOLATION: IDW power=2\nNODES: A1=6.8, B2=2.4, C3=5.9, D4=5.7 cm\nGRID: 14×14 samples inside AGRI-001 polygon\nINFERENCE: B2 deviation = -3.5σ vs neighbour mean\nREFERENCE: Spatial IDW method (Shepard 1968)`}</Tech>
      </div>

      {/* PREDICT */}
      <div className="card">
        <div className="field-head"><span style={{fontSize:22}}>🔮</span><b style={{fontSize:18}}>PREDICT</b></div>
        <p style={{marginTop:10,fontSize:15,lineHeight:1.6}}><b>What might happen next?</b></p>
        <div className="badge b-proto" style={{marginBottom:8}}>PROTOTYPE — NOT A DEPLOYED MODEL</div>
        <p style={{fontSize:14.5,lineHeight:1.6}}>At the current B2 drying rate the demo <b>0 cm ponded mark</b> is reached in ~14 h. Field rule per IRRI is re-irrigation at <b>−15 cm tube reading</b> — treat the demo mark as illustrative only.</p>
        <div className="why">
          <h5>Suggested action</h5>
          <p><b>Inspect B2 for leak/breach</b> before Day-13 irrigation decision. If confirmed bund breach, repair before water-table drawdown stresses the crop.</p>
        </div>
        <p style={{fontSize:13,color:'var(--muted)',marginTop:8}}>Confidence: <b>64%</b> — do NOT use for real irrigation decisions.</p>
        <Tech>{`METHOD: linear extrapolation of B2 drying rate\nMODEL: IsolationForest prototype (backend/anomaly_detector.py)\nINPUT: 48-point 24h series, 30-min resolution\nOUTPUT: irrigation-requirement estimate (demo)\nLIMITATION: no rainfall forecast, no soil-texture model`}</Tech>
        <Link className="btn" style={{display:'inline-block',marginTop:14,width:'100%',textAlign:'center'}} to="/evidence">Cross-validate in Evidence →</Link>
      </div>

      {/* Summary card */}
      <div className="card" style={{background:'#F0F9F2',borderColor:'#BFE3C9'}}>
        <div className="field-head"><span style={{fontSize:22}}>📋</span><b style={{fontSize:18}}>SUMMARY</b></div>
        <p style={{marginTop:10,fontSize:15,lineHeight:1.7}}><b>DETECT</b> → Water dropped 4 cm in 30 min at B2.<br/><b>INFER</b> → Zones B2–B4 drying faster than neighbours — localized, not field-wide.<br/><b>PREDICT</b> → B2 may hit demo stress mark in ~14 h; inspect for leak before Day-13 irrigation.</p>
        <p style={{fontSize:13.5,color:'var(--muted)',marginTop:10}}>This is the AGRI-GRID core value: point sensors → spatial understanding → actionable intelligence.</p>
        <Link className="btn" style={{display:'inline-block',marginTop:14,width:'100%',textAlign:'center'}} to="/evidence">See how this becomes Evidence →</Link>
      </div>
    </div>
  </>);
}
