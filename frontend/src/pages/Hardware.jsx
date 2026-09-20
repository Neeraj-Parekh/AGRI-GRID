export default function Hardware(){
  return (<><h1 className="page-title">Hardware</h1><p className="page-sub">The physical AGRI-GRID node — not just software. <span className="badge b-proto">PROTOTYPE</span></p>
  <div className="hw-grid">
    <div className="card"><h3>AGRI-GRID node (per node ~₹2,200 sensors)</h3><table className="tbl"><thead><tr><th>Component</th><th>Role</th><th>Why</th></tr></thead><tbody>
      <tr><td><b>Heltec WiFi LoRa 32 V3</b></td><td>MCU + LoRa 865MHz + OLED</td><td>IN865 legal; 1–5 km; debug display</td></tr>
      <tr><td><b>JSN-SR04T</b></td><td>Water depth</td><td>IP67 waterproof (HC-SR04 rots)</td></tr>
      <tr><td><b>DS18B20</b></td><td>Temperature</td><td>Waterproof ±0.5°C</td></tr>
      <tr><td><b>Capacitive v1.2</b></td><td>Soil moisture</td><td>Non-corrosive</td></tr>
      <tr><td><b>18650 + 1W solar</b></td><td>Power</td><td>6–10 mo; indefinite w/ solar</td></tr>
      <tr><td><b>IP65 box</b></td><td>Enclosure</td><td>Dust/splash-proof</td></tr>
    </tbody></table><p><small>Specs from AGRI-GRID concept note. No fabricated claims beyond documented values.</small></p></div>
    <div className="card"><h3>Deployment topology</h3><pre className="code">Node A (Zone NW) ─┐\nNode B (Zone NE) ─┼─► Gateway (ESP32+LoRa+WiFi) ─► FastAPI / Cloud\nNode C (Zone S)  ─┘      IN865 865–867 MHz · 10-min cycle</pre>
    <h4>Cost (3 nodes + 1 gateway)</h4><p>Heltec build <b>₹14,995</b> · Budget ESP32+Ra-02 <b>₹6,586</b></p>
    <h4>Edge AI</h4><p>IsolationForest on gateway — sudden drop, temp spike, dry-soil flags; inference &lt;100ms. <code className="inline">backend/anomaly_detector.py</code> exists (water-quality version — AGRI adapter in <code className="inline">backend/agri_api.py</code>).</p></div>
  </div>
  <div className="card" style={{marginTop:14}}><h3>Field photos</h3><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=60&auto=format&fit=crop" alt="Paddy field" width="220" style={{borderRadius:10}} loading="lazy"/><img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&q=60&auto=format&fit=crop" alt="Rice field" width="220" style={{borderRadius:10}} loading="lazy"/><img src="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&q=60&auto=format&fit=crop" alt="Farm landscape" width="220" style={{borderRadius:10}} loading="lazy"/></div><p><small>Representative Unsplash field imagery (open licence). Replace with your real node photos — real hardware beats AI images. See ATTRIBUTION.md.</small></p></div></>);
}
