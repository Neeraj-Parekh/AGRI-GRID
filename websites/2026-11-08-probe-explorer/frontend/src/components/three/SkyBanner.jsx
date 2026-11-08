import { useEffect, useRef, useState } from 'react';
import { useWeather } from './useWeather.js';
import './three.css';

const TIMES = [['live', 'Auto'], [6.3, 'Dawn'], [12, 'Noon'], [17.8, 'Dusk'], [22, 'Night']];

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

/**
 * Living-sky banner. Drop anywhere; it lazy-loads three.js.
 * props: nodes [{id:'A1', water:cm, status:'normal'|'watch'|'alert'}], lat, lng,
 *        height (css), liveWeather (bool), showControls (bool), interactive (bool), stage (0..1), sar (bool), className
 */
export default function SkyBanner({ nodes, lat = 18.52, lng = 73.85, height = 300, liveWeather = true, showControls = true, interactive = false, stage, sar, sarImage, className = '', caption, weatherData = null }) {
  const ref = useRef(null);
  const api = useRef(null);
  const [time, setTime] = useState('live');
  const [failed, setFailed] = useState(false);
  const fetched = useWeather(lat, lng, liveWeather && !weatherData);
  const weather = weatherData || fetched;

  useEffect(() => {
    if (!webglOK()) { setFailed(true); return; }
    let disposed = false;
    import('../../three/farmScene.js').then(({ mountSky }) => {
      if (disposed || !ref.current) return;
      api.current = mountSky(ref.current, { lat, lng, nodes, interactive, stage, sar, sarImage });
    }).catch(() => setFailed(true));
    return () => { disposed = true; api.current?.dispose(); api.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  useEffect(() => { if (nodes) api.current?.update({ nodes }); }, [nodes]);
  useEffect(() => { if (weather) api.current?.update({ weather }); }, [weather]);
  useEffect(() => { api.current?.update({ hour: time === 'live' ? null : time }); }, [time]);
  useEffect(() => { if (stage != null) api.current?.update({ stage }); }, [stage]);
  useEffect(() => { if (sar != null) api.current?.update({ sar }); }, [sar]);

  return (
    <div className={`ag-sky ${className}`} style={{ height }}>
      {failed ? <div className="ag-sky-fallback" role="img" aria-label="Paddy field with sensor nodes (3D view unavailable on this device)" /> : <div ref={ref} className="ag-sky-canvas" />}
      {caption && <div className="ag-sky-caption">{caption}</div>}
      {showControls && !failed && (
        <div className="ag-sky-times" role="group" aria-label="Time of day">
          {TIMES.map(([v, l]) => <button key={l} type="button" aria-pressed={time === v} onClick={() => setTime(v)}>{l}</button>)}
        </div>
      )}
      {weather && showControls && (
        <div className="ag-sky-weather">{weather.tempC != null ? `${Math.round(weather.tempC)}°C · ` : ''}{Math.round(weather.cloud * 100)}% cloud · rain next 3 days {weather.rain3dMm} mm <span>Open-Meteo</span></div>
      )}
    </div>
  );
}
