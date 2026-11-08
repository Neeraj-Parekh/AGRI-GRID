// Reading-card contents and small SVG charts for the HUD. Pure render of the chapter's hud.card object.
import { Fragment } from 'react';
import { awdState, topp } from '../spec/physics.js';

const TONE = { sense: '#2bb3cf', ok: '#3FA35B', warn: '#E3A22C', alert: '#E0614A', water: '#2F86C9' };
const ink3 = '#7F8E86', line = 'rgba(16,38,28,.09)';

function Axes({ W, H, pad, xt, yt }) {
  return (<g>
    <line x1={pad[3]} y1={H - pad[2]} x2={W - pad[1]} y2={H - pad[2]} stroke={line} />
    <line x1={pad[3]} y1={pad[0]} x2={pad[3]} y2={H - pad[2]} stroke={line} />
    {xt && <text x={W - pad[1]} y={H - 4} textAnchor="end">{xt}</text>}
    {yt && <text x={pad[3] + 4} y={pad[0] + 8}>{yt}</text>}
  </g>);
}
const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');

function LevelChart({ day, level, days = 10 }) {
  const W = 340, H = 150, pad = [12, 10, 22, 34];
  const x = (d) => pad[3] + (d / 12) * (W - pad[1] - pad[3]); const y = (l) => pad[0] + ((60 - l) / 230) * (H - pad[0] - pad[2]);
  const pts = []; for (let d = 0; d <= 12; d += 0.25) pts.push([x(d), y(awdState(d).level)]);
  return (<svg className="px-chart" viewBox={`0 0 ${W} ${H}`}>
    <Axes W={W} H={H} pad={pad} xt="days" yt="water mm" />
    <line x1={pad[3]} x2={W - pad[1]} y1={y(0)} y2={y(0)} stroke={ink3} strokeDasharray="2 3" /><text x={pad[3] - 4} y={y(0) + 3} textAnchor="end">0</text>
    <line x1={pad[3]} x2={W - pad[1]} y1={y(-150)} y2={y(-150)} stroke={TONE.warn} strokeWidth="1.5" strokeDasharray="5 4" /><text x={pad[3] - 4} y={y(-150) + 3} textAnchor="end">−150</text>
    <text x={pad[3] - 4} y={y(50) + 3} textAnchor="end">+50</text>
    <path d={path(pts)} fill="none" stroke={TONE.water} strokeWidth="2" opacity=".35" />
    <path d={path(pts.filter((p) => p[0] <= x(day)))} fill="none" stroke={TONE.water} strokeWidth="2.4" />
    <circle cx={x(day)} cy={y(level)} r="5" fill={level <= -150 ? TONE.alert : TONE.water} stroke="#fff" strokeWidth="2" />
    <text x={x(days)} y={y(-150) - 6} textAnchor="middle" fill={TONE.warn}>re-irrigate</text>
  </svg>);
}

function ToppChart({ eps, theta }) {
  const W = 340, H = 170, pad = [14, 10, 24, 36];
  const x = (e) => pad[3] + ((e - 1) / 39) * (W - pad[1] - pad[3]); const y = (th) => pad[0] + ((0.6 - th) / 0.65) * (H - pad[0] - pad[2]);
  const pts = []; for (let e = 1; e <= 40; e += 0.5) pts.push([x(e), y(topp(e))]);
  return (<svg className="px-chart" viewBox={`0 0 ${W} ${H}`}>
    <Axes W={W} H={H} pad={pad} xt="apparent permittivity ε" yt="θ" />
    {[0, 0.2, 0.4].map((v) => <g key={v}><line x1={pad[3]} x2={W - pad[1]} y1={y(v)} y2={y(v)} stroke={line} /><text x={pad[3] - 5} y={y(v) + 3} textAnchor="end">{Math.round(v * 100)}%</text></g>)}
    {[5, 20, 40].map((v) => <text key={v} x={x(v)} y={H - pad[2] + 13} textAnchor="middle">{v}</text>)}
    <path d={path(pts)} fill="none" stroke={TONE.sense} strokeWidth="2.4" />
    <line x1={x(eps)} x2={x(eps)} y1={y(theta)} y2={H - pad[2]} stroke={TONE.sense} strokeDasharray="2 3" />
    <circle cx={x(eps)} cy={y(theta)} r="5.5" fill={TONE.water} stroke="#fff" strokeWidth="2" />
    <text x={W - pad[1]} y={y(0.55)} textAnchor="end">Topp et al. 1980</text>
  </svg>);
}

function Isolation({ guards }) {
  const W = 340, H = 150; const ys = [30, 62, 94, 126];
  return (<svg className="px-chart" viewBox={`0 0 ${W} ${H}`}>
    <rect x="40" y="10" width="14" height="132" rx="4" fill="#2b2f33" />
    {ys.map((y, i) => <g key={i}>
      <rect x="48" y={y - 6} width="6" height="12" fill="#d98a5f" />
      {guards && <><rect x="49" y={y - 13} width="5" height="4" fill="#9aa3a8" /><rect x="49" y={y + 9} width="5" height="4" fill="#9aa3a8" /></>}
      <ellipse cx={guards ? 74 : 92} cy={y} rx={guards ? 22 : 44} ry={guards ? 10 : 26} fill={i === 1 ? (guards ? TONE.sense : TONE.warn) : '#cfd8d1'} opacity={i === 1 ? 0.4 : 0.25} />
      <text x="200" y={y + 4}>{['E1 · 0–5 cm', 'E2 · 5–10 cm', 'E3 · 10–15 cm', 'E4 · 15–20 cm'][i]}</text>
    </g>)}
    <text x="200" y="12" fill={guards ? TONE.ok : TONE.warn}>{guards ? 'one slice each' : 'E2 overlaps E1, E3'}</text>
  </svg>);
}

function Drift({ k }) {
  const W = 340, H = 150, pad = [14, 10, 24, 36];
  const x = (h) => pad[3] + (h / 24) * (W - pad[1] - pad[3]); const y = (c) => pad[0] + ((560 - c) / 60) * (H - pad[0] - pad[2]);
  const raw = [], cor = []; const hmax = 24 * Math.max(0.02, k);
  for (let h = 0; h <= hmax; h += 0.25) { const temp = Math.sin(((h - 9) / 24) * Math.PI * 2); raw.push([x(h), y(530 + 18 * temp + 4 * Math.sin(h * 1.7))]); cor.push([x(h), y(530 + 2.5 * Math.sin(h * 1.7))]); }
  return (<svg className="px-chart" viewBox={`0 0 ${W} ${H}`}>
    <Axes W={W} H={H} pad={pad} xt="hours" yt="E2 count" />
    <path d={path(raw)} fill="none" stroke={TONE.warn} strokeWidth="2" />
    <path d={path(cor)} fill="none" stroke={TONE.ok} strokeWidth="2.4" />
    <text x={W - pad[1]} y={pad[0] + 10} textAnchor="end" fill={TONE.warn}>raw (temperature wave)</text>
    <text x={W - pad[1]} y={pad[0] + 24} textAnchor="end" fill={TONE.ok}>EREF + °C corrected</text>
  </svg>);
}

function Bands({ theta, level }) {
  const ids = ['E1', 'E2', 'E3', 'E4']; const W = 340, H = 168;
  const x0 = 70, x1 = 300; const xv = (v) => x0 + ((v - 0.2) / 0.3) * (x1 - x0);
  return (<svg className="px-chart" viewBox={`0 0 ${W} ${H}`}>
    {ids.map((id, i) => { const y = 14 + i * 30; const v = theta[id]; const c = v < 0.4 ? TONE.warn : TONE.sense; return (<g key={id}>
      <text x="8" y={y + 12}>{id} · {['0–5', '5–10', '10–15', '15–20'][i]}</text>
      <rect x={x0} y={y} width={x1 - x0} height="16" rx="8" fill="#e7ece6" />
      <rect x={x0} y={y} width={Math.max(6, xv(v) - x0)} height="16" rx="8" fill={c} />
      <text x={x1 + 6} y={y + 12} style={{ fill: '#10261C' }}>{Math.round(v * 100)}%</text>
    </g>); })}
    <line x1={xv(0.37)} x2={xv(0.37)} y1="8" y2="134" stroke={TONE.alert} strokeDasharray="4 3" />
    <text x={xv(0.37)} y="148" textAnchor="middle" fill={TONE.alert}>37 % (illustrative)</text>
    <text x="8" y="164">water {level > 0 ? '+' : ''}{Math.round(level)} mm</text>
  </svg>);
}

function Calib({ rows, fit }) {
  const W = 340, H = 150, pad = [12, 10, 22, 40];
  const x = (th) => pad[3] + ((th - 0.05) / 0.45) * (W - pad[1] - pad[3]); const y = (c) => pad[0] + ((820 - c) / 520) * (H - pad[0] - pad[2]);
  const pts = rows.filter((r) => r.theta != null && r.count != null);
  let line2 = null;
  if (pts.length >= 2 && fit > 0) {
    const n = pts.length; const sx = pts.reduce((a, r) => a + r.theta, 0), sy = pts.reduce((a, r) => a + r.count, 0), sxx = pts.reduce((a, r) => a + r.theta * r.theta, 0), sxy = pts.reduce((a, r) => a + r.theta * r.count, 0);
    const b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n;
    const xe = 0.05 + 0.45 * fit; line2 = [[x(0.05), y(a + b * 0.05)], [x(xe), y(a + b * xe)]];
  }
  return (<>
    <table className="px-table"><thead><tr><th>Cup</th><th>Count</th><th>m wet</th><th>m dry</th><th>θ</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.cup}><td>{r.cup}</td><td className="mono">{r.count ?? '·'}</td><td className="mono">{r.wet != null ? `${r.wet.toFixed(1)} g` : '·'}</td><td className="mono">{r.dry != null ? `${r.dry} g` : '·'}</td><td className="mono">{r.theta != null ? `${Math.round(r.theta * 100)}%` : '·'}</td></tr>)}</tbody></table>
    <svg className="px-chart" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 8 }}>
      <Axes W={W} H={H} pad={pad} xt="θ (oven-dry)" yt="count" />
      {pts.map((r) => <circle key={r.cup} cx={x(r.theta)} cy={y(r.count)} r="4.5" fill={TONE.sense} />)}
      {line2 && <path d={path(line2)} stroke={TONE.ok} strokeWidth="2.4" />}
      {fit > 0.95 && <text x={W - pad[1]} y={pad[0] + 10} textAnchor="end" fill={TONE.ok}>your soil curve</text>}
    </svg>
    <div className="px-note">V = 150 cm³ per cup, ρw = 1 g/cm³. Example values: replace with your own measurements.</div>
  </>);
}

function Scatter({ k }) {
  const W = 340, H = 160, pad = [12, 10, 24, 40];
  const x = (th) => pad[3] + ((th - 0.1) / 0.4) * (W - pad[1] - pad[3]); const y = (s) => pad[0] + ((-5 - s) / 15) * (H - pad[0] - pad[2]);
  const pts = []; let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 40; i += 1) { const th = 0.12 + rnd() * 0.36; pts.push([th, -17 + th * 22 + (rnd() - 0.5) * 3]); }
  const n = Math.round(pts.length * k);
  return (<svg className="px-chart" viewBox={`0 0 ${W} ${H}`}>
    <Axes W={W} H={H} pad={pad} xt="θ top 5 cm (E1)" yt="σ⁰ VV dB" />
    {pts.slice(0, n).map((p, i) => <circle key={i} cx={x(p[0])} cy={y(p[1])} r="3.6" fill={TONE.sense} opacity=".75" />)}
    <text x={W - pad[1]} y={H - pad[2] - 6} textAnchor="end">illustrative · per-field fits needed</text>
  </svg>);
}

export function FieldMap({ map }) {
  const plots = { A: [12, 10], B: [124, 10], C: [12, 84], D: [124, 84] };
  const node = { A1: [108, 46], B2: [128, 40], C3: [52, 82], D4: [128, 120] };
  const gw = [4, 30];
  return (<svg className="px-chart" viewBox="0 0 236 160">
    {Object.entries(plots).map(([k, [x, y]]) => <g key={k}><rect x={x} y={y} width="100" height="66" rx="8" fill="#e6f0f2" stroke="#cfd9cf" /><text x={x + 8} y={y + 16}>{k}</text></g>)}
    <rect x={gw[0] - 2} y={gw[1] - 8} width="10" height="16" rx="2" fill="#0F5B3A" />
    {Object.entries(map.nodes || {}).map(([id, tone]) => { const [x, y] = node[id]; return (<g key={id}>
      {map.tx && map.tx[id] && <line x1={x} y1={y} x2={gw[0] + 3} y2={gw[1]} stroke={TONE.sense} strokeWidth="1.5" strokeDasharray="3 3" />}
      <circle cx={x} cy={y} r="6.5" fill={TONE[tone] || TONE.ok} stroke="#fff" strokeWidth="2" /><text x={x + 9} y={y + 4} style={{ fill: '#10261C' }}>{id}</text></g>); })}
    {map.pump && <text x="14" y="154" fill={TONE.water}>pump ON → A</text>}
  </svg>);
}

export function Card({ card, t: T }) {
  if (!card) return null;
  switch (card.kind) {
    case 'level': return <><h3>Water level <small>AWD rule −150 mm</small></h3><LevelChart {...card} /></>;
    case 'topp': return <><h3>ε → θ <small>moving dot = band E2</small></h3><ToppChart {...card} /></>;
    case 'isolation': return <><h3>Band isolation</h3><Isolation guards={card.guards} /></>;
    case 'drift': return <><h3>Drift correction <small>simulated day</small></h3><Drift k={card.k} /></>;
    case 'bands': return <><h3>θ per band <small>day {card.day.toFixed(1)}</small></h3><Bands {...card} /></>;
    case 'calib': return <><h3>Calibration <small>{card.fit > 0.95 ? 'Literature → Calibrated' : 'Literature (Topp)'}</small></h3><Calib {...card} /></>;
    case 'scatter': return <><h3>σ⁰ vs θ <small>illustrative</small></h3><Scatter k={card.k} /></>;
    case 'note': case 'spec': return <><h3>{card.title || 'Spec'}</h3><dl className="px-rows">{card.rows.map(([a, b]) => <Fragment key={a}><dt>{a}</dt><dd>{b}</dd></Fragment>)}</dl></>;
    case 'steps': return <><h3>{card.title}</h3><ol className="px-steps">{card.steps.map((s, i) => <li key={s} className={`${card.done[i] ? 'done' : ''} ${card.active === i ? 'on' : ''}`}><i>{card.done[i] ? '✓' : ''}</i>{s}</li>)}</ol></>;
    case 'failures': return <><h3>Failure → symptom → fix</h3><table className="px-table"><tbody>{card.rows.map((r, i) => <tr key={r.k} className={i === card.active ? 'on' : ''}><td>{r.k}</td><td>{r.s}</td><td>{r.fix}</td></tr>)}</tbody></table></>;
    case 'table': return <><h3>{card.title}</h3><table className="px-table"><thead><tr>{card.head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{card.rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody></table></>;
    case 'pins': return <><h3>Pin map · node A1 <small>ESP32</small></h3><table className="px-table"><tbody>{card.rows.map(([n, g, x]) => <tr key={n}><td>{n}</td><td className="mono">{g}</td><td className="mono">{x}</td></tr>)}</tbody></table><div className="px-note">{card.power}</div></>;
    case 'sms': return <><h3>SMS to the farmer <small>from lib/advice.js</small></h3><div className="px-sms" style={{ opacity: card.k }}>{card.lines.map((l, i) => <p key={i} className={l.lang === 'en' ? 'en' : ''}>{l.text}</p>)}</div></>;
    case 'packets': return <><h3>Packet log <small>ESP-NOW</small></h3><table className="px-table"><tbody>{card.log.map((e, i) => <tr key={i}><td className="mono">{e.t.toFixed(1)} s</td><td>{e.text}</td></tr>)}</tbody></table></>;
    case 'rssi': return <><h3>Link RSSI <small>dBm</small></h3>{card.rows.map(([id, v]) => <div key={id} className="px-row"><span>{id}</span><svg width="180" height="12"><rect width="180" height="12" rx="6" fill="#e7ece6" /><rect width={Math.max(8, (v + 95) * 4.5)} height="12" rx="6" fill={TONE.sense} /></svg><span className="px-mono">{v}</span></div>)}<div className="px-note">{card.note}</div></>;
    default: return null;
  }
}
