import { Link } from 'react-router-dom';
import IdwPanel from '../components/IdwPanel.jsx';
import { ALERTS, INTEL, FIELDS, NODES } from '../data/demo.js';
export default function Intelligence(){
  const f = FIELDS.find(x=>x.id==='AGRI-001');
  const n = NODES.filter(x=>x.fieldId==='AGRI-001');
  return (<><h1 className="page-title">Intelligence</h1><p className="page-sub">Detect → Infer → Predict. Prototype outputs labelled. <span className="badge b-proto">PROTOTYPE</span> <span className="badge b-sim">SIMULATED</span></p>
  <div className="layout-3">
    <div className="card"><h3>🔍 DETECT</h3>{INTEL.detect.map((d,i)=><p key={i}><b>Zone {d.zone}:</b> “{d.text}”<br/><small>Anomaly score {(d.score*100).toFixed(0)}% · {d.time} · {d.src}</small></p>)}
      <h4>Recent alerts</h4>{ALERTS.map(a=><div className="alert-row" key={a.id}><div className={`sev ${a.sev}`}>!</div><div><b>{a.title}</b><br/><small>{a.field} • {a.node} • {a.time}</small><br/><small>{a.why}</small></div></div>)}</div>
    <div className="card"><h3>🧩 INFER</h3>{INTEL.infer.map((d,i)=><p key={i}>“{d.text}”<br/><small>Affected ~{d.area} · confidence {d.conf}% (IDW p=2, computed in-browser from {n.length} nodes)</small></p>)}<p><small>Spatial reasoning: B2 anomaly vs B1/B3/B4 neighbours — accelerated drying, not field-wide irrigation miss.</small></p><IdwPanel poly={f.poly} nodes={n} height={130}/></div>
    <div className="card"><h3>🔮 PREDICT</h3><p><b>Irrigation requirement estimate (PROTOTYPE)</b><br/>At the current B2 drying rate the demo 0 cm ponded mark is reached in ~14 h — but the field rule per IRRI is re-irrigation at <b>−15 cm tube reading</b>, so treat the demo mark as illustrative only. Suggested action: inspect B2 for leak/breach before Day-13 irrigation.<br/><small>Confidence 64% — do NOT use for real irrigation decisions.</small></p><p><small>Method: linear extrapolation of B2 drying rate + AWD thresholds. Model: IsolationForest prototype (see Hardware/Reports).</small></p><Link className="btn" to="/evidence">Cross-validate in Evidence →</Link></div>
  </div></>);
}
