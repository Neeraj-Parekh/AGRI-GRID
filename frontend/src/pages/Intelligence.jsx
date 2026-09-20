import { Link } from 'react-router-dom';
import { ALERTS, INTEL } from '../data/demo.js';
export default function Intelligence(){
  return (<><h1 className="page-title">Intelligence</h1><p className="page-sub">Detect → Infer → Predict. Prototype outputs labelled. <span className="badge b-proto">PROTOTYPE</span> <span className="badge b-sim">SIMULATED</span></p>
  <div className="layout-3">
    <div className="card"><h3>🔍 DETECT</h3>{INTEL.detect.map((d,i)=><p key={i}><b>Zone {d.zone}:</b> “{d.text}”<br/><small>Anomaly score {(d.score*100).toFixed(0)}% · {d.time} · {d.src}</small></p>)}
      <h4>Recent alerts</h4>{ALERTS.map(a=><div className="alert-row" key={a.id}><div className={`sev ${a.sev}`}>!</div><div><b>{a.title}</b><br/><small>{a.field} • {a.node} • {a.time}</small><br/><small>{a.why}</small></div></div>)}</div>
    <div className="card"><h3>🧩 INFER</h3>{INTEL.infer.map((d,i)=><p key={i}>“{d.text}”<br/><small>Affected ~{d.area} · confidence {d.conf}% (SIMULATED spatial IDW)</small></p>)}<p><small>Spatial reasoning: B2 anomaly vs B1/B3/B4 neighbours — accelerated drying, not field-wide irrigation miss.</small></p><div style={{height:120,background:'linear-gradient(90deg,#2F7D46 40%,#D99A25 60%,#C94D3D 75%,#2F7D46 90%)',borderRadius:10}} title="Simulated spatial drying gradient"/></div>
    <div className="card"><h3>🔮 PREDICT</h3>{INTEL.predict.map((d,i)=><p key={i}><b>{d.title}</b><br/>{d.text}<br/><small>Confidence {d.conf}% — do NOT use for real irrigation decisions.</small></p>)}<p><small>Method: linear extrapolation of B2 drying rate + AWD thresholds. Model: IsolationForest prototype (see Hardware/Reports).</small></p><Link className="btn" to="/evidence">Cross-validate in Evidence →</Link></div>
  </div></>);
}
