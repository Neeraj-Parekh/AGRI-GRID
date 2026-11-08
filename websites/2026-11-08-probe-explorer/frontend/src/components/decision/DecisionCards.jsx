import { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Eye, CloudRain, Droplets, Battery, Signal, MessageSquare } from 'lucide-react';
import { forecastIrrigation, decide, methaneAvoided, IPCC_DEFAULTS, AWD_THRESHOLD_CM } from './decide.js';
import './decision.css';

const TONE = { ok: ['#E8F6EC', '#BFE3C9', '#073B2A', CheckCircle2], watch: ['#FFF3D6', '#EAD9A8', '#6b4e00', Eye], act: ['#E3EFFA', '#B8D4EC', '#1d4e7e', Droplets], alert: ['#FDE8E4', '#F5C4BC', '#8f2b1f', AlertTriangle], review: ['#EDEFFC', '#C8CDF5', '#2c3a8c', Eye] };

/** The one sentence a farmer or officer needs, then the evidence. */
export function DecisionCard({ field, nodes, series, rain3dMm = null, discrepancy = false, simulated = true }) {
  const forecast = useMemo(() => forecastIrrigation({ level: field.water, series, rain3dMm }), [field.water, series, rain3dMm]);
  const d = decide({ field, nodes, forecast, discrepancy });
  const [bg, bd, fg, Icon] = TONE[d.tone];
  return (
    <div className="card ag-decision" style={{ background: bg, borderColor: bd }}>
      <div className="ag-decision-head" style={{ color: fg }}><Icon size={20} /> <b>Today's decision · {field.id}</b>{simulated && <span className="badge b-sim">SIMULATED</span>}</div>
      <p className="ag-decision-action" style={{ color: fg }}>{d.action}</p>
      <ul className="ag-decision-ev">{d.evidence.map(e => <li key={e}>{e}</li>)}</ul>
    </div>
  );
}

/** Days until the −15 cm AWD threshold, with a small projection chart. */
export function IrrigationForecast({ field, series, rain3dMm = null }) {
  const f = forecastIrrigation({ level: field.water, series, rain3dMm });
  const days = f.days == null ? null : Math.min(f.days, 30);
  const W = 300, H = 110, top = 10, bot = 92, x0 = 32;
  const y = v => top + (bot - top) * (1 - (v - AWD_THRESHOLD_CM + 3) / (12 - AWD_THRESHOLD_CM + 3));
  const span = Math.max(days ?? 10, 4) * 1.15;
  const x = d => x0 + (W - x0 - 8) * (d / span);
  return (
    <div className="card">
      <div className="field-head"><b style={{ fontSize: 16 }}>Next irrigation</b><span className="badge b-proto" style={{ marginLeft: 'auto' }}>FORECAST</span></div>
      <div className="ag-big">{f.status === 'irrigate' ? 'Now' : days == null ? 'Stable' : `${days.toFixed(1)} days`}</div>
      <small style={{ color: 'var(--muted)' }}>until water reaches {AWD_THRESHOLD_CM} cm (IRRI AWD threshold) · drying {Math.abs(f.perDay).toFixed(2)} cm/day</small>
      <svg viewBox={`0 0 ${W} ${H}`} className="ag-mini" role="img" aria-label="Projected water level">
        <line x1={x0} x2={W - 8} y1={y(0)} y2={y(0)} stroke="#8d6b47" strokeWidth="1.5" />
        <text x="2" y={y(0) + 4} fontSize="9" fill="var(--muted)">soil 0</text>
        <line x1={x0} x2={W - 8} y1={y(AWD_THRESHOLD_CM)} y2={y(AWD_THRESHOLD_CM)} stroke="#C94D3D" strokeDasharray="4 3" />
        <text x="2" y={y(AWD_THRESHOLD_CM) + 4} fontSize="9" fill="#C94D3D">−15</text>
        {days != null && <line x1={x(0)} y1={y(field.water)} x2={x(days)} y2={y(AWD_THRESHOLD_CM)} stroke="var(--water)" strokeWidth="2.5" />}
        <circle cx={x(0)} cy={y(field.water)} r="4" fill="var(--dark)" />
        {days != null && <circle cx={x(days)} cy={y(AWD_THRESHOLD_CM)} r="4" fill="#C94D3D" />}
      </svg>
      {rain3dMm != null && <div className="ag-rain"><CloudRain size={15} /> {rain3dMm} mm rain forecast in the next 3 days (Open-Meteo){f.status === 'rain-hold' ? ' · hold irrigation' : ''}</div>}
    </div>
  );
}

/** Water and methane ledger with editable assumptions and the formula shown. */
export function ImpactLedger({ areaHa = 2.4, seasonDays = 100 }) {
  const [p, setP] = useState({ areaHa, days: seasonDays, ...IPCC_DEFAULTS, baseWaterMm: 1200, savePct: 25, pumpM3h: 30 });
  const r = methaneAvoided({ areaHa: p.areaHa, days: p.days, EF_c: p.EF_c, SF_w_awd: p.SF_w_awd, GWP: p.GWP });
  const waterSavedM3 = p.baseWaterMm / 1000 * p.areaHa * 10000 * (p.savePct / 100);
  const pumpHours = waterSavedM3 / p.pumpM3h;
  const num = (k, label, step = 'any') => (
    <label className="ag-in"><span>{label}</span><input id={`ag-led-${k}`} type="number" step={step} value={p[k]} onChange={e => setP({ ...p, [k]: +e.target.value })} /></label>
  );
  return (
    <div className="card">
      <div className="field-head"><b style={{ fontSize: 16 }}>Season ledger · water and methane</b><span className="badge b-sim" style={{ marginLeft: 'auto' }}>ESTIMATE</span></div>
      <div className="ag-kpis">
        <div><b>{Math.round(waterSavedM3).toLocaleString('en-IN')} m³</b><small>water not pumped</small></div>
        <div><b>{Math.round(pumpHours)} h</b><small>pump hours saved</small></div>
        <div><b>{Math.round(r.avoided)} kg</b><small>CH₄ avoided</small></div>
        <div><b>{r.co2eT.toFixed(1)} t</b><small>CO₂e avoided</small></div>
      </div>
      <details className="ag-details"><summary>Assumptions and formula</summary>
        <div className="ag-grid-in">
          {num('areaHa', 'Area (ha)')}{num('days', 'Season days', 1)}{num('EF_c', 'EF baseline (kg CH₄/ha/day)')}{num('SF_w_awd', 'SF AWD (multiple drainage)')}
          {num('GWP', 'GWP-100 of CH₄', 1)}{num('baseWaterMm', 'Flooded water use (mm)', 10)}{num('savePct', 'AWD water saving (%)', 1)}{num('pumpM3h', 'Pump flow (m³/h)', 1)}
        </div>
        <p className="ag-formula">CH₄ avoided = EF × area × days × (1 − SF<sub>AWD</sub>) &nbsp;·&nbsp; CO₂e = CH₄ × GWP</p>
        <p className="ag-fine">IPCC Tier 1 method (2019 Refinement, Vol. 4 Ch. 5). Defaults are placeholders: confirm against Tables 5.11–5.12 before quoting. IRRI reports AWD saves up to ~30% water and cuts methane 30–70% without yield loss. Measured savings from this field: none yet.</p>
      </details>
    </div>
  );
}

/** Node health: battery, signal, last seen. */
export function NodeHealth({ nodes }) {
  return (
    <div className="card">
      <div className="field-head"><b style={{ fontSize: 16 }}>Node health</b></div>
      <table className="tbl ag-tbl"><thead><tr><th>Node</th><th>Battery</th><th>Signal</th><th>Last seen</th><th>Status</th></tr></thead>
        <tbody>{nodes.map(n => (
          <tr key={n.fieldId + n.id}>
            <td><b>{n.id}</b> <small style={{ color: 'var(--muted)' }}>{n.zone}</small></td>
            <td><span className="ag-bar"><span style={{ width: `${n.batt}%`, background: n.batt < 30 ? 'var(--red)' : 'var(--green)' }} /></span> <Battery size={13} /> {n.batt}%</td>
            <td><Signal size={13} /> {n.rssi} dBm</td>
            <td>{n.updated}</td>
            <td><span className={`badge ${n.status === 'alert' ? 'b-alert' : n.status === 'watch' ? 'b-watch' : 'b-active'}`}>{n.status}</span></td>
          </tr>))}</tbody></table>
    </div>
  );
}

const SMS = {
  en: (f, a) => `AGRI-GRID ${f}: ${a}`,
  hi: () => 'AGRI-GRID A1: 15 सेमी पर मिट्टी सूखी है। आज सिंचाई करें। B2 की मेड़ भी जाँचें।',
  mr: () => 'AGRI-GRID A1: 15 सेमी खोलीवर माती कोरडी आहे. आज पाणी द्या. B2 चा बांधही तपासा.',
};
/** What the farmer actually receives. */
export function SmsPreview({ field = 'A1', action = 'Soil dry at 15 cm. Irrigate today. Also check the B2 bund.' }) {
  const [lang, setLang] = useState('mr');
  const text = SMS[lang](field, action);
  return (
    <div className="card">
      <div className="field-head"><MessageSquare size={18} /><b style={{ fontSize: 16 }}>Farmer SMS preview</b>
        <div className="ag-langs" role="group" aria-label="Language">{[['mr', 'मराठी'], ['hi', 'हिंदी'], ['en', 'English']].map(([k, l]) => <button key={k} type="button" aria-pressed={lang === k} onClick={() => setLang(k)}>{l}</button>)}</div>
      </div>
      <div className="ag-phone"><div className="ag-bubble">{text}</div><small>{text.length} characters · plain SMS, no app needed</small></div>
      <p className="ag-fine">Marathi and Hindi text should be checked by a native speaker before field use.</p>
    </div>
  );
}
