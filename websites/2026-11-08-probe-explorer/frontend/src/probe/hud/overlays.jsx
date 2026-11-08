// Chapter overlays: the ε zoom bubble (5), SAR-vs-probe depths (10), the SAR panel (16),
// the backend pipeline half of the split screen (17) and the impact slide (18).
import { useEffect, useRef } from 'react';
import { STAGES } from '../director/ch-grid.js';

const TONE = { sense: '#2bb3cf', ok: '#3FA35B', warn: '#E3A22C', alert: '#E0614A', water: '#2F86C9' };
function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

/** Zoom bubble: mineral grains and air (ε ≈ 3–5) vs water molecules (ε ≈ 80); water fills pores as θ rises. */
function Zoom({ theta, k }) {
  const r = rng(11); const grains = Array.from({ length: 16 }, () => ({ x: 20 + r() * 220, y: 20 + r() * 160, s: 14 + r() * 22, a: r() * 6 }));
  const r2 = rng(23); const slots = Array.from({ length: 70 }, () => ({ x: 14 + r2() * 232, y: 14 + r2() * 172, a: r2() * 6.28 }));
  const nWater = Math.round(slots.length * Math.min(1, theta / 0.48));
  return (<div className="px-ov px-zoom px-glass" style={{ opacity: k }}>
    <h4>Inside a few mm of soil</h4>
    <svg viewBox="0 0 260 200" style={{ width: '100%' }}>
      <defs><clipPath id="pxzc"><circle cx="130" cy="100" r="96" /></clipPath></defs>
      <circle cx="130" cy="100" r="97" fill="#fbfaf6" stroke="#cfd8d1" strokeWidth="2" />
      <g clipPath="url(#pxzc)">
        {grains.map((g, i) => <rect key={i} x={g.x - g.s / 2} y={g.y - g.s / 2} width={g.s} height={g.s * 0.8} rx={g.s * 0.35} transform={`rotate(${g.a * 30} ${g.x} ${g.y})`} fill="#c9a77c" opacity=".85" />)}
        {slots.slice(0, nWater).map((m, i) => <g key={i} transform={`translate(${m.x} ${m.y}) rotate(${(m.a * 180) / Math.PI})`}><circle r="4.2" fill={TONE.water} /><circle cx="-4" cy="3.2" r="2.4" fill="#cfe8f6" /><circle cx="4" cy="3.2" r="2.4" fill="#cfe8f6" /></g>)}
      </g>
    </svg>
    <div className="px-note" style={{ display: 'flex', justifyContent: 'space-between' }}><span>● water ε ≈ 80</span><span style={{ color: '#a07c50' }}>■ minerals, air ε ≈ 3–5</span></div>
  </div>);
}

function Depths({ k }) {
  const y = (cm) => 30 + cm * 9;
  return (<div className="px-ov px-depths px-glass" style={{ opacity: k }}>
    <h4>What each sensor sees</h4>
    <svg viewBox="0 0 400 230" style={{ width: '100%' }}>
      <rect x="20" y={y(0)} width="360" height={y(20) - y(0)} rx="6" fill="#8b6b4f" opacity=".85" />
      <rect x="20" y={y(0)} width="170" height={y(5) - y(0)} fill={TONE.sense} opacity=".45" />
      <text x="105" y={y(2.8)} textAnchor="middle" style={{ fill: '#fff', fontWeight: 700 }}>C-band SAR ≈ 0–5 cm</text>
      {[2.5, 7.5, 12.5, 17.5].map((c, i) => <g key={c}><rect x="252" y={y(c) - 5} width="18" height="10" rx="2" fill="#d98a5f" /><text x="280" y={y(c) + 4} style={{ fill: '#fff', fontWeight: 700 }}>E{i + 1} · {['0–5', '5–10', '10–15', '15–20'][i]} cm</text></g>)}
      <line x1="20" x2="380" y1={y(15)} y2={y(15)} stroke={TONE.warn} strokeWidth="2" strokeDasharray="6 4" />
      <text x="24" y={y(15) - 5} style={{ fill: '#ffe2a8', fontWeight: 700 }}>−15 cm: the AWD decision</text>
      <text x="20" y="20">surface</text>
    </svg>
  </div>);
}

/** SAR panel: shows public/media/sar/surat.jpg when the team adds it; until then a labelled synthetic placeholder. */
function SarPanel({ k, base }) {
  const cv = useRef(null);
  useEffect(() => {
    // synthetic placeholder: a grid of field parcels, some ponded (dark), with speckle; clearly labelled as a placeholder
    const c = cv.current; if (!c) return; const x = c.getContext('2d'); const W = c.width, H = c.height; const r = rng(99);
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const t = tmp.getContext('2d');
    t.fillStyle = '#7d7d7d'; t.fillRect(0, 0, W, H);
    t.save(); t.translate(W / 2, H / 2); t.rotate(-0.12); t.translate(-W / 2, -H / 2);
    for (let gx = -40; gx < W + 40; gx += 34 + r() * 18) for (let gy = -40; gy < H + 40; gy += 26 + r() * 14) {
      const pond = r() < 0.42; const v = pond ? 30 + r() * 25 : 120 + r() * 70; t.fillStyle = `rgb(${v},${v},${v})`; t.fillRect(gx + 2, gy + 2, 30 + r() * 14, 22 + r() * 10);
    }
    t.restore();
    const img = t.getImageData(0, 0, W, H);
    for (let i = 0; i < img.data.length; i += 4) { const n = (r() - 0.5) * 70 * (img.data[i] / 160 + 0.35); const v = Math.max(0, Math.min(255, img.data[i] + n)); img.data[i] = img.data[i + 1] = img.data[i + 2] = v; }
    t.putImageData(img, 0, 0);
    x.filter = 'blur(0.5px)'; x.drawImage(tmp, 0, 0); x.filter = 'none';
  }, []);
  return (<div className="px-ov px-sar px-glass" style={{ opacity: k }}>
    <h4>Sentinel-1 C-band · VV backscatter</h4>
    <div className="img">
      <canvas ref={cv} width="560" height="245" />
      <img src={`${base}media/sar/surat.jpg`} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ position: 'absolute', inset: 0 }} />
    </div>
    <div className="cap"><span>Dark = smooth open water (ponded fields)</span><span>Placeholder until the team’s Surat figure is added (public/media/sar/surat.jpg)</span></div>
    <blockquote>Radar can’t see 15 cm down. The probe can.</blockquote>
  </div>);
}

/** Left half of chapter 17: the pipeline as calm cards joined by thin animated lines with data dots. */
// [col, row] for each stage, 2 columns × 5 rows
const POS = [[0, 0], [1, 0], [0, 1], [0, 2], [1, 1], [1, 2], [0, 3], [1, 3], [0, 4], [1, 4]];
function Pipeline({ t, split, sms }) {
  const ref = useRef(null);
  const W = 100, rowH = 100 / 5;
  const active = STAGES.filter((s) => t >= s.t).length - 1;
  const xy = (i) => ({ x: POS[i][0] ? 52 : 0, y: POS[i][1] * rowH });
  const links = [[0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [5, 6], [4, 7], [6, 8], [7, 8], [8, 9]];
  const cardH = rowH * 0.78;
  return (<div className="px-split" style={{ width: `${100 - 50 * split}%` }}>
    <div className="px-split-in" ref={ref}>
      <h2>Backend pipeline</h2>
      <div className="px-pipe">
        <svg viewBox={`0 0 ${W} 100`} preserveAspectRatio="none">
          {links.map(([a, b]) => { const A = xy(a), B = xy(b); const on = t >= STAGES[b].t; const sameRow = POS[a][1] === POS[b][1]; const x1 = sameRow ? A.x + 46 : A.x + 23, y1 = sameRow ? A.y + cardH / 2 : A.y + cardH, x2 = sameRow ? B.x : B.x + 23, y2 = sameRow ? B.y + cardH / 2 : B.y; const k = Math.min(1, Math.max(0, (t - STAGES[b].t + 0.9) / 0.9));
            return (<g key={`${a}-${b}`}><path d={`M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`} fill="none" stroke={on ? '#2bb3cf' : '#cfd8d1'} strokeWidth="0.35" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 2 }} />
              {k > 0 && k < 1 && <circle cx={x1 + (x2 - x1) * k} cy={y1 + (y2 - y1) * k} r="0.9" fill="#2bb3cf" />}</g>); })}
        </svg>
        {STAGES.map((s, i) => { const p = xy(i); const isDec = s.id === 'dc'; return (<div key={s.id} className={`px-stage-card ${i === active ? 'on' : ''} ${i < active ? 'done' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%`, height: `${cardH}%`, opacity: t >= s.t - 0.6 ? 1 : 0.35 }}>
          <b>{isDec && sms ? 'Decision → SMS (Marathi)' : s.name}</b>{isDec && sms ? <small className="dev">{sms}</small> : <><small>{s.sub}</small><em>{s.status}</em></>}</div>); })}
      </div>
    </div>
  </div>);
}

function Impact({ t, hideCosts }) {
  const on = (a) => ({ opacity: Math.min(1, Math.max(0, (t - a) / 0.8)), transform: `translateY(${Math.max(0, 1 - (t - a) / 0.8) * 10}px)` });
  return (<div className="px-impact">
    <div className="px-impact-grid">
      <div className="px-icard px-glass" style={on(0.6)}><b>up to 30 %</b><span>less irrigation water with AWD</span><small>IRRI, AWD in India · irri.org/where-we-work/india</small></div>
      <div className="px-icard px-glass" style={on(1.6)}><b>up to 48 %</b><span>less methane from the paddy</span><small>IRRI, AWD in India · irri.org/where-we-work/india</small></div>
      <div className="px-icard px-glass" style={on(2.6)}><b>51.3 Mha</b><span>rice area in India, 2024–25</span><small>DA&amp;FW estimates (51.27 Mha) · USDA FAS (51.3 Mha)</small></div>
      <div className="px-icard px-glass" style={on(3.4)}><b>150 MMT</b><span>rice produced, 2024–25</span><small>Government of India (PIB), record estimate 150.18 MMT</small></div>
      <div className="px-icard px-glass" style={on(4.6)}><b>6.5 ± 1.0 Tg</b><span>CH₄ a year from India’s rice paddies</span><small>Chen et al. 2025, Earth’s Future · doi:10.1029/2024EF005479</small></div>
      <div className="px-icard px-glass wide" style={on(7)}><span>Methane per hectare, IPCC 2019 Tier 1</span>
        <div className="px-formula">CH₄ = EF<sub>c</sub> × SF<sub>w</sub> × t × A<br />continuous flooding: 1.19 × 1.00 × 120 d × 1 ha ≈ 143 kg<br />multiple drainage (AWD): 1.19 × 0.55 × 120 d × 1 ha ≈ 79 kg</div>
        <small>Defaults EF<sub>c</sub> 1.19 kg CH₄/ha/day and SF<sub>w</sub> 0.55: confirm against IPCC 2019 Refinement Vol. 4 Ch. 5, Tables 5.11/5.12. 120-day season assumed.</small></div>
      <div className="px-icard px-glass" style={on(9)}><span>Scale path</span><div className="px-path"><span>FPOs</span><i>→</i><span>KVK pilots</span><i>→</i><span>credit verification</span></div><small>Probe data gives the per-field AWD evidence that methane-credit schemes need.</small></div>
      {!hideCosts && <div className="px-icard px-glass full" style={on(11)} data-cost="1"><span>Cost, network side (₹)</span>
        <div className="px-formula">ESP-NOW: radio built into the ESP32 → ₹0 extra per node<br />LoRa radio (RFM95W 868 MHz): ₹676 per node · LoRaWAN gateway (IN865): ₹20,789 ex-GST<br />Commercial capacitance profile probes: price OPEN (not yet sourced)</div>
        <small>Prices from the team’s CONTEXT-PACK sourcing BOM (T2, verified listings). Full probe-node BOM: see PROBE.md.</small></div>}
    </div>
  </div>);
}

export function Overlay({ ov, base }) {
  if (!ov) return null;
  if (ov.kind === 'zoom') return <Zoom {...ov} />;
  if (ov.kind === 'depths') return <Depths {...ov} />;
  if (ov.kind === 'sar') return <SarPanel k={ov.k} base={base} />;
  if (ov.kind === 'pipeline') return <Pipeline {...ov} />;
  if (ov.kind === 'impact') return <Impact {...ov} />;
  return null;
}
