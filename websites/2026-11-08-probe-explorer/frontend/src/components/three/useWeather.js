import { useEffect, useState } from 'react';

// Live weather from Open-Meteo (free, no API key). Returns null until loaded, or on failure.
// { cloud: 0..1, rain: 0..1, wind: 0..1, tempC, rain3dMm, raw }
export function useWeather(lat = 18.52, lng = 73.85, enabled = true) {
  const [w, setW] = useState(null);
  useEffect(() => {
    if (!enabled) return;
    let dead = false;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      '&current=temperature_2m,cloud_cover,precipitation,wind_speed_10m&daily=precipitation_sum&forecast_days=3&timezone=Asia%2FKolkata';
    fetch(url, { signal: AbortSignal.timeout(6000) })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(d => {
        if (dead) return;
        const c = d.current || {};
        const rain3 = (d.daily?.precipitation_sum || []).reduce((a, b) => a + (b || 0), 0);
        setW({
          cloud: Math.min(1, (c.cloud_cover ?? 20) / 100),
          rain: Math.min(1, (c.precipitation ?? 0) / 4),
          wind: Math.min(1, (c.wind_speed_10m ?? 8) / 30),
          tempC: c.temperature_2m ?? null,
          rain3dMm: +rain3.toFixed(1),
          raw: d,
        });
      })
      .catch(() => { if (!dead) setW(null); });
    return () => { dead = true; };
  }, [lat, lng, enabled]);
  return w;
}
