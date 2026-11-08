import { ALERTS, EVIDENCE } from '../data/demo.js';
import { useSite } from '../context/SiteContext.jsx';
export default function Reports(){
  const { farm, site } = useSite();
  const print = ()=> window.print();
  const dl = ()=>{
    const blob = new Blob([JSON.stringify({ site:{ id:site.id, name:site.name, lat:site.lat, lng:site.lng }, season:farm.season, fields:farm.fields.map(({poly,...f})=>({...f, polygon:poly})), nodes:farm.nodes, weather:farm.weather && { current:farm.weather.current, rain7:farm.weather.rain7, et7:farm.weather.et7 }, soil:farm.soil, farmAlerts:farm.alerts, demoAlerts:ALERTS, evidence:EVIDENCE, generated:new Date().toISOString(), label:'Boundaries/weather/soil from open data; node readings SIMULATED' },null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='agri-grid-evidence-report.json'; a.click();
  };
  return (<><h1 className="page-title">Reports</h1><p className="page-sub">Prototype field evidence report. <span className="badge b-proto">DEMO EVIDENCE REPORT</span></p>
  <div className="card"><h3>Field Evidence Summary — AGRI-001 (Paddy, 2.4 ha)</h3>
  <p><b>Current field state:</b> Watch — Zone B2 rapid drying, health 82%.</p>
  <p><b>Water history:</b> 24h avg 6.2→5.2 cm; B2 6.4→2.4 cm (4 cm / 30 min ≈190× normal AWD drawdown — likely leak/breach, 12:32).</p>
  <p><b>AWD status:</b> Cycle 3 Day 12, Drying — on track except B2. Demo timeline is illustrative; field AWD per IRRI re-irrigates at −15 cm tube reading.</p>
  <p><b>Anomalies:</b> {ALERTS.length} open (1 crit, 2 watch/info).</p>
  <p><b>Evidence:</b> {EVIDENCE.length} records, 2 consistent / 1 discrepancy-review.</p>
  <p><b>Confidence:</b> 86% consistent case, 41% discrepancy case (SIMULATED).</p>
  <p><small>No carbon-certification claims. AWD methane 30–50% figures are literature values (IRRI), not measured here.</small></p>
  <div style={{display:'flex',gap:10}}><button className="btn" onClick={print}>View / Print Report</button><button className="btn ghost" onClick={dl}>Download JSON</button></div></div></>);
}
export function Settings(){
  return (<><h1 className="page-title">Settings</h1><p className="page-sub">Environment + thresholds (demo).</p><div className="card"><p>API base: <code className="inline">{import.meta.env.VITE_AGRI_API || 'http://localhost:8001'}</code> — set <code className="inline">VITE_AGRI_API</code> for deploy.</p><p>Thresholds: water-stress &lt;2 cm alert, &lt;3.5 cm watch; temp &gt;31°C info; gap &gt;30 min warn.</p></div></>);
}
