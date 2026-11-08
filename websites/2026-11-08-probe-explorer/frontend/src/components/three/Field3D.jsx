import { useState } from 'react';
import SkyBanner from './SkyBanner.jsx';

const STAGES = [[0.1, 'Transplanted'], [0.4, 'Tillering'], [0.7, 'Heading'], [0.95, 'Ripening']];

/** Interactive 3D field: orbit, growth stage, SAR overlay, time of day. */
export default function Field3D({ nodes, height = 440, lat, lng }) {
  const [stage, setStage] = useState(0.4);
  const [sar, setSar] = useState(false);
  const label = STAGES.reduce((a, s) => (stage >= s[0] - 0.15 ? s[1] : a), STAGES[0][1]);
  return (
    <div className="ag-field3d">
      <SkyBanner nodes={nodes} height={height} interactive stage={stage} sar={sar} lat={lat} lng={lng}
        caption="Drag to orbit · scroll to zoom" />
      <div className="ag-field3d-bar">
        <label htmlFor="ag-stage">Crop stage <b>{label}</b></label>
        <input id="ag-stage" type="range" min="0" max="1" step="0.01" value={stage} onChange={e => setStage(+e.target.value)} />
        <button type="button" className={`ag-chip ${sar ? 'on' : ''}`} aria-pressed={sar} onClick={() => setSar(!sar)}>SAR water layer {sar ? 'on' : 'off'}</button>
        <span className="ag-note">SAR layer is illustrative until a real Sentinel-1 tile is loaded.</span>
      </div>
    </div>
  );
}
