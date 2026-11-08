import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SITES } from '../data/sites.js';
import { fetchWeather, fetchSoil, fetchPower, fetchOsmFields } from '../lib/openData.js';
import { buildFarm } from '../lib/farmModel.js';

export const SiteCtx = createContext(null);

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

/**
 * Selected farm site + its live open data. Every dashboard page reads the farm from here.
 * status per source: 'loading' | 'live' | 'cache' | 'stale' | 'none'
 */
export function SiteProvider({ children }) {
  const [custom, setCustom] = useState(() => read('ag:customSites', []));
  const sites = useMemo(() => [...SITES, ...custom], [custom]);
  const [siteId, setSiteId] = useState(() => read('ag:site', 'maval'));
  const site = sites.find(s => s.id === siteId) || sites[0];
  const [traces, setTraces] = useState(() => read('ag:traces', {}));
  const [data, setData] = useState({});   // { [siteId]: { weather, soil, power, osm, status:{...} } }
  const [tick, setTick] = useState(0);    // bump to refetch

  useEffect(() => { write('ag:site', site.id); }, [site.id]);
  useEffect(() => { write('ag:traces', traces); }, [traces]);
  useEffect(() => { write('ag:customSites', custom); }, [custom]);

  useEffect(() => {
    let dead = false;
    const id = site.id;
    const set = (key, res) => { if (dead) return; setData(d => ({ ...d, [id]: { ...d[id], [key]: res.data, status: { ...(d[id]?.status || {}), [key]: res.src }, errors: { ...(d[id]?.errors || {}), [key]: res.error } } })); };
    setData(d => ({ ...d, [id]: { ...d[id], status: { weather: 'loading', soil: 'loading', power: 'loading', osm: 'loading', ...(d[id]?.status || {}) } } }));
    fetchWeather(site.lat, site.lng).then(r => set('weather', r));
    fetchSoil(site.lat, site.lng).then(r => set('soil', r));
    fetchPower(site.lat, site.lng).then(r => set('power', r));
    fetchOsmFields(site.lat, site.lng, site.radiusM).then(r => set('osm', r));
    // refresh weather every 15 min while open
    const t = setInterval(() => fetchWeather(site.lat, site.lng).then(r => set('weather', r)), 15 * 60e3);
    return () => { dead = true; clearInterval(t); };
  }, [site.id, site.lat, site.lng, site.radiusM, tick]);

  const d = data[site.id] || {};
  const farm = useMemo(() => buildFarm({ site, weather: d.weather, soil: d.soil, power: d.power, osm: d.osm, traced: traces[site.id] }),
    [site, d.weather, d.soil, d.power, d.osm, traces]);

  const addTrace = useCallback((poly, name) => setTraces(t => ({ ...t, [site.id]: [...(t[site.id] || []), { poly, name: name || `Traced ${((t[site.id] || []).length) + 1}` }] })), [site.id]);
  const clearTraces = useCallback(() => setTraces(t => ({ ...t, [site.id]: [] })), [site.id]);
  const addSite = useCallback(s => { setCustom(c => [...c.filter(x => x.id !== s.id), s]); setSiteId(s.id); }, []);
  const removeSite = useCallback(id => { setCustom(c => c.filter(x => x.id !== id)); if (siteId === id) setSiteId('maval'); }, [siteId]);

  const value = { sites, site, setSiteId, farm, status: d.status || {}, errors: d.errors || {}, refresh: () => setTick(x => x + 1), traces: traces[site.id] || [], addTrace, clearTraces, addSite, removeSite };
  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

export const useSite = () => useContext(SiteCtx);
