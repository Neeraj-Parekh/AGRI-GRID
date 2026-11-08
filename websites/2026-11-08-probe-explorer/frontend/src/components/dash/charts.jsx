// Lightweight SVG charts for the dashboard (no chart library, animate in, theme via CSS vars).
import { useEffect, useId, useRef, useState } from 'react';

export function useCountUp(value, ms = 900) {
  const [v, setV] = useState(typeof value === 'number' ? 0 : value);
  const from = useRef(0);
  useEffect(() => {
    if (typeof value !== 'number' || Number.isNaN(value)) { setV(value); return; }
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setV(value); from.current = value; return; }
    const a = from.current, t0 = performance.now(); let raf;
    const step = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); setV(a + (value - a) * e); if (k < 1) raf = requestAnimationFrame(step); else from.current = value; };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return v;
}

export function CountUp({ value, decimals = 0, suffix = '' }) {
  const v = useCountUp(value);
  return <>{typeof v === 'number' ? v.toFixed(decimals) : v}{suffix}</>;
}

function path(pts) { return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(''); }
function smooth(pts) {
  if (pts.length < 3) return path(pts);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[Math.max(0, i - 1)], [x1, y1] = pts[i], [x2, y2] = pts[i + 1], [x3, y3] = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = x1 + (x2 - x0) / 6, c1y = y1 + (y2 - y0) / 6, c2x = x2 - (x3 - x1) / 6, c2y = y2 - (y3 - y1) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return d;
}

/** Area sparkline. data: [{v}] */
export function Spark({ data, color = 'var(--d-water)', height = 42, min, max }) {
  const id = useId().replace(/:/g, '');
  if (!data?.length) return <div style={{ height }} />;
  const vs = data.map(d => d.v), lo = min ?? Math.min(...vs), hi = max ?? Math.max(...vs), W = 160, H = height, pad = 3;
  const pts = vs.map((v, i) => [i / (vs.length - 1) * W, pad + (H - 2 * pad) * (1 - (v - lo) / ((hi - lo) || 1))]);
  return (
    <svg className="d-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }} aria-hidden="true">
      <defs><linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${smooth(pts)}L${W},${H}L0,${H}Z`} fill={`url(#g${id})`} />
      <path d={smooth(pts)} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" className="d-draw" />
      <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r="3" fill={color} />
    </svg>
  );
}

/** Progress ring. value 0..1 */
export function Ring({ value = 0, size = 64, stroke = 7, color = 'var(--d-leaf)', track = 'var(--d-track)', children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="d-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))} transform={`rotate(-90 ${size / 2} ${size / 2})`} className="d-ring-arc" />
      </svg>
      <div className="d-ring-in">{children}</div>
    </div>
  );
}

/** Daily rain bars + ET0 line, past days solid, forecast days hatched. daily: [{date, rain, et0, forecast}] */
export function RainEtChart({ daily, height = 210 }) {
  const id = useId().replace(/:/g, '');
  const [hover, setHover] = useState(null);
  if (!daily?.length) return <div className="d-skel" style={{ height }} />;
  const W = 640, H = height, L = 34, Rr = 10, T = 14, B = 26;
  const maxV = Math.max(5, ...daily.map(d => Math.max(d.rain || 0, d.et0 || 0))) * 1.15;
  const bw = (W - L - Rr) / daily.length;
  const y = v => T + (H - T - B) * (1 - v / maxV);
  const et = daily.map((d, i) => [L + bw * (i + 0.5), y(d.et0 || 0)]);
  const ticks = [0, maxV / 2, maxV].map(v => Math.round(v));
  const todayI = daily.findIndex(d => d.forecast) - 1;
  return (
    <div className="d-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="d-chart" role="img" aria-label="Daily rainfall and reference evapotranspiration">
        <defs>
          <linearGradient id={`rb${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--d-water)" /><stop offset="1" stopColor="var(--d-sky)" /></linearGradient>
          <pattern id={`hp${id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--d-sky)" opacity=".35" /><line x1="0" y1="0" x2="0" y2="6" stroke="var(--d-water)" strokeWidth="2" opacity=".6" /></pattern>
        </defs>
        {ticks.map(t => <g key={t}><line x1={L} x2={W - Rr} y1={y(t)} y2={y(t)} className="d-grid" /><text x={L - 6} y={y(t) + 4} className="d-axis" textAnchor="end">{t}</text></g>)}
        {todayI >= 0 && <rect x={L + bw * (todayI + 1)} y={T - 6} width={W - Rr - (L + bw * (todayI + 1))} height={H - T - B + 6} className="d-forecast-bg" rx="8" />}
        {daily.map((d, i) => {
          const h = Math.max(0, (H - B) - y(d.rain || 0));
          return <rect key={d.date} x={L + bw * i + bw * 0.18} y={y(d.rain || 0)} width={bw * 0.64} height={h} rx="3" fill={d.forecast ? `url(#hp${id})` : `url(#rb${id})`} className="d-bar" style={{ '--i': i }} />;
        })}
        <path d={smooth(et)} fill="none" stroke="var(--d-amber)" strokeWidth="2.5" className="d-draw" />
        {et.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 4.5 : 2.5} fill="var(--d-amber)" />)}
        {daily.map((d, i) => (i % 2 === 0 || daily.length < 12) && <text key={d.date} x={L + bw * (i + 0.5)} y={H - 8} className="d-axis" textAnchor="middle">{new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).replace(' ', ' ')}</text>)}
        {daily.map((d, i) => <rect key={'h' + i} x={L + bw * i} y={T} width={bw} height={H - T - B} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />)}
        {todayI >= 0 && <text x={L + bw * (todayI + 1) + 6} y={T + 4} className="d-axis d-axis-strong">forecast →</text>}
      </svg>
      {hover != null && <div className="d-tip" style={{ left: `${((L + bw * (hover + 0.5)) / W) * 100}%` }}><b>{new Date(daily[hover].date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</b><span>Rain {(+daily[hover].rain || 0).toFixed(1)} mm</span><span>ET₀ {(+daily[hover].et0 || 0).toFixed(1)} mm</span>{daily[hover].forecast && <em>forecast</em>}</div>}
    </div>
  );
}

/** Multi-line chart for 48 hourly points. lines: [{data:[{v}], color, label}] */
export function Lines48({ lines, height = 170, unit = '' }) {
  const all = lines.flatMap(l => l.data?.map(d => d.v) || []).filter(v => v != null);
  if (!all.length) return <div className="d-skel" style={{ height }} />;
  const W = 640, H = height, L = 34, Rr = 10, T = 10, B = 22;
  const lo = Math.floor(Math.min(...all) - 1), hi = Math.ceil(Math.max(...all) + 1);
  const y = v => T + (H - T - B) * (1 - (v - lo) / ((hi - lo) || 1));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="d-chart" role="img" aria-label="Last 48 hours">
      {[lo, (lo + hi) / 2, hi].map(t => <g key={t}><line x1={L} x2={W - Rr} y1={y(t)} y2={y(t)} className="d-grid" /><text x={L - 6} y={y(t) + 4} className="d-axis" textAnchor="end">{Math.round(t)}{unit}</text></g>)}
      {['-48h', '-36h', '-24h', '-12h', 'now'].map((t, i) => <text key={t} x={L + (W - L - Rr) * i / 4} y={H - 6} className="d-axis" textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>{t}</text>)}
      {lines.map(l => {
        const pts = (l.data || []).map((d, i, a) => [L + (W - L - Rr) * i / (a.length - 1), y(d.v)]);
        return pts.length > 1 && <path key={l.label} d={smooth(pts)} fill="none" stroke={l.color} strokeWidth="2.5" strokeDasharray={l.dash} className="d-draw" />;
      })}
    </svg>
  );
}

/** Horizontal stacked texture bar: sand / silt / clay */
export function TextureBar({ sand, silt, clay }) {
  const tot = (sand || 0) + (silt || 0) + (clay || 0) || 1;
  const seg = [['Sand', sand, 'var(--d-sand)'], ['Silt', silt, 'var(--d-silt)'], ['Clay', clay, 'var(--d-clay)']];
  return (
    <div>
      <div className="d-texture">{seg.map(([n, v, c]) => <i key={n} style={{ width: `${(v || 0) / tot * 100}%`, background: c }} title={`${n} ${v}%`} />)}</div>
      <div className="d-texture-l">{seg.map(([n, v, c]) => <span key={n}><b style={{ background: c }} />{n} {v != null ? Math.round(v) : '–'}%</span>)}</div>
    </div>
  );
}
