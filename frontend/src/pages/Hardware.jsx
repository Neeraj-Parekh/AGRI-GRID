import { FieldArt } from '../components/FieldArt.jsx';
export default function Hardware(){
  return (<>
    <h1 className="page-title">Hardware</h1>
    <p className="page-sub">The physical AGRI-GRID node — built, tested, field-deployable. <span className="badge b-proto">PROTOTYPE</span></p>

    {/* Hero: node photo slot */}
    <div className="card" style={{padding:0,overflow:'hidden',marginBottom:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',minHeight:280}}>
        <div style={{background:'linear-gradient(135deg,#073B2A,#0B2E22)',color:'#fff',padding:'36px 40px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
          <div style={{fontSize:12,textTransform:'uppercase',letterSpacing:'.1em',color:'#9DBDB0',fontWeight:700,marginBottom:10}}>AGRI-GRID NODE · REV 1</div>
          <h2 style={{margin:'0 0 12px',fontSize:32,fontWeight:800,letterSpacing:'-.5px',lineHeight:1.15}}>LoRa Sensor Grid<br/>for Paddy Fields</h2>
          <p style={{color:'#C8DDD0',fontSize:15.5,lineHeight:1.6,margin:0,maxWidth:420}}>ESP32 + LoRa 865 MHz star-grid across paddy zones. Measures AWD water-depth, runs edge-AI anomaly detection, quantifies methane + water-credit eligibility.</p>
          <div style={{display:'flex',gap:24,marginTop:22}}>
            <div><div style={{fontSize:26,fontWeight:800,color:'#79C95B'}}>₹14,995</div><div style={{fontSize:12,color:'#9DBDB0'}}>3 nodes + gateway</div></div>
            <div><div style={{fontSize:26,fontWeight:800,color:'#79C95B'}}>1–5 km</div><div style={{fontSize:12,color:'#9DBDB0'}}>LoRa range</div></div>
            <div><div style={{fontSize:26,fontWeight:800,color:'#79C95B'}}>6–10 mo</div><div style={{fontSize:12,color:'#9DBDB0'}}>Battery-only</div></div>
          </div>
        </div>
        <div style={{background:'#0B2E22',display:'grid',placeItems:'center',padding:24}}>
          <div style={{width:'100%',maxWidth:400,textAlign:'center'}}>
            <div style={{background:'rgba(255,255,255,.07)',border:'1.5px dashed rgba(255,255,255,.25)',borderRadius:14,padding:'40px 24px',color:'#9DBDB0',fontSize:14}}>
              <div style={{fontSize:36,marginBottom:8}}>📷</div>
              <b style={{color:'#fff',fontSize:15}}>Drop real AGRI-GRID node photo here</b><br/>
              <small>Replace with your actual hardware photo — real hardware is proof. This slot awaits your upload.</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="layout-3">
      {/* Spec sheet */}
      <div className="card">
        <h3 style={{margin:'0 0 4px',fontSize:18,fontWeight:700}}>Sensor Suite</h3>
        <p style={{color:'var(--muted)',fontSize:13.5,margin:'0 0 14px'}}>Per-node components — all IP-rated for field use</p>
        <table className="tbl" style={{fontSize:13.5}}>
          <thead><tr><th>Component</th><th>Role</th></tr></thead>
          <tbody>
            <tr><td><b>Heltec WiFi LoRa 32 V3</b></td><td>MCU + LoRa 865 MHz + OLED</td></tr>
            <tr><td><b>JSN-SR04T</b></td><td>Water depth (IP67 sealed)</td></tr>
            <tr><td><b>DS18B20</b></td><td>Temperature (±0.5°C, waterproof)</td></tr>
            <tr><td><b>Capacitive v1.2</b></td><td>Soil moisture (non-corrosive)</td></tr>
            <tr><td><b>18650 + 1W solar</b></td><td>Power (6–10 months)</td></tr>
            <tr><td><b>IP65 junction box</b></td><td>Enclosure (dust/splash)</td></tr>
          </tbody>
        </table>
        <p style={{color:'var(--muted)',fontSize:12.5,marginTop:12}}>Specs from AGRI-GRID concept note. No fabricated values.</p>
      </div>

      {/* Deployment topology */}
      <div className="card">
        <h3 style={{margin:'0 0 4px',fontSize:18,fontWeight:700}}>Deployment Topology</h3>
        <p style={{color:'var(--muted)',fontSize:13.5,margin:'0 0 14px'}}>Star grid: nodes → gateway → cloud</p>
        <pre className="code">{`Node A (Zone NW) ─┐
Node B (Zone NE) ─┼─► Gateway ─► FastAPI
Node C (Zone S)  ─┘
  IN865 · 865–867 MHz
  10-min sleep cycle`}</pre>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:14}}>
          <div style={{background:'#F0F9F2',border:'1px solid #BFE3C9',borderRadius:10,padding:'12px 14px'}}>
            <div style={{fontSize:22,fontWeight:800,color:'var(--green)'}}>₹14,995</div>
            <div style={{fontSize:12,color:'var(--muted)'}}>Heltec build (recommended)</div>
          </div>
          <div style={{background:'#F5F6F1',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px'}}>
            <div style={{fontSize:22,fontWeight:800}}>₹6,586</div>
            <div style={{fontSize:12,color:'var(--muted)'}}>Budget ESP32 + Ra-02</div>
          </div>
        </div>
      </div>

      {/* Edge AI + field illustration */}
      <div className="card">
        <h3 style={{margin:'0 0 4px',fontSize:18,fontWeight:700}}>Edge AI + Field View</h3>
        <p style={{color:'var(--muted)',fontSize:13.5,margin:'0 0 14px'}}>On-gateway anomaly detection</p>
        <FieldArt label="AGRI-001 · field deployment — illustrative" variant={1}/>
        <ul style={{fontSize:14,lineHeight:1.7,paddingLeft:18,margin:'12px 0'}}>
          <li><b>IsolationForest</b> on gateway — sudden drop, temp spike, dry-soil flags</li>
          <li>Inference <b>&lt;100 ms</b> per reading, no cloud dependency</li>
          <li>Code: <code className="inline">backend/anomaly_detector.py</code> (water-quality adapter in <code className="inline">backend/agri_api.py</code>)</li>
        </ul>
        <p style={{fontSize:13,color:'var(--muted)'}}>Illustrative art — replace with your real field deployment photo.</p>
      </div>
    </div>

    <div className="card" style={{marginTop:16,background:'#FFF8E6',borderColor:'#EAD9A8'}}>
      <b style={{fontSize:15}}>📷 Real hardware photos needed</b>
      <p style={{fontSize:14,marginTop:6,lineHeight:1.6}}>The strongest credibility upgrade for this page is dropping in your actual AGRI-GRID node, PCB, and deployment photos. The illustration slots above are placeholders — swap them before the demo and the page jumps from "prototype" to "built."</p>
    </div>
  </>);
}
