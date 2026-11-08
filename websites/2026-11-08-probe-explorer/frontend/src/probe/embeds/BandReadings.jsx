// Dashboard embed: probe band readings E1–E4 + EW for the selected field. Derived only from the field object
// the page already has (water level or moisture), so the dashboard's data flow is unchanged. Simulated until a
// real node log is loaded in the Probe Explorer.
import { Link } from 'react-router-dom';
import { clamp, smooth01 } from '../spec/physics.js';

const BANDS = [['E1', '0–5 cm', -25], ['E2', '5–10 cm', -75], ['E3', '10–15 cm', -125], ['E4', '15–20 cm', -175]];

/** θ at depth z (mm) for a water level (mm, + above the surface): saturated below, draining above (illustrative). */
export function bandTheta(levelMm, z) {
  if (z <= levelMm) return 0.48;
  return 0.48 - 0.15 * smooth01((z - Math.min(levelMm, 0)) / 90);
}

export default function BandReadings({ field }) {
  const level = field.water != null ? field.water * 10 : -40 - (40 - clamp(field.moisture ?? 30, 10, 45)) * 4;
  const rows = BANDS.map(([id, d, z]) => ({ id, d, th: bandTheta(level, z) }));
  const x = (th) => clamp((th - 0.2) / 0.3, 0, 1);
  return (
    <div className="d-card d-rise">
      <div className="d-card-h"><div><h2>Probe bands · {field.id}</h2><small>θ per depth and the water strip. Simulated from this field’s water level until a probe log is loaded.</small></div>
        <Link to="/probe?ch=8" className="d-btn ghost" style={{ whiteSpace: 'nowrap' }}>How the probe reads</Link></div>
      <div style={{ display: 'grid', gap: 9 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 52px', gap: 10, alignItems: 'center', fontSize: 13 }}>
          <span style={{ fontWeight: 650 }}>EW <small style={{ color: 'var(--d-ink3)', fontWeight: 500 }}>water</small></span>
          <div style={{ height: 12, borderRadius: 6, background: 'var(--d-track)', position: 'relative', overflow: 'hidden' }}><div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${clamp((level + 50) / 150, 0, 1) * 100}%`, background: 'var(--d-water)', borderRadius: 6 }} /></div>
          <b style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{level > 0 ? '+' : ''}{Math.round(level)} mm</b>
        </div>
        {rows.map((r) => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 52px', gap: 10, alignItems: 'center', fontSize: 13 }}>
            <span style={{ fontWeight: 650 }}>{r.id} <small style={{ color: 'var(--d-ink3)', fontWeight: 500 }}>{r.d}</small></span>
            <div style={{ height: 12, borderRadius: 6, background: 'var(--d-track)', position: 'relative', overflow: 'hidden' }}><div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${x(r.th) * 100}%`, background: r.th < 0.4 ? 'var(--d-amber)' : '#2bb3cf', borderRadius: 6 }} /></div>
            <b style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{Math.round(r.th * 100)}%</b>
          </div>
        ))}
      </div>
      <small className="d-fine">Simulated · illustrative until calibrated in this field’s soil (oven-dry method).</small>
    </div>
  );
}
