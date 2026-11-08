import { createContext, useContext, useEffect, useState } from 'react';
import { FIELDS, NODES } from '../data/demo.js';
import { SiteCtx } from './SiteContext.jsx';

const Ctx = createContext(null);
const API = () => import.meta.env.VITE_AGRI_API || 'http://localhost:8001';

async function get(path, ms=3500){
  const r = await fetch(`${API()}${path}`, { signal: AbortSignal.timeout(ms) });
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export function ModeProvider({ children }){
  const [mode, setMode] = useState('demo'); // demo | live
  const [liveStatus, setLiveStatus] = useState('idle'); // idle|checking|connected|fallback
  const [liveData, setLiveData] = useState(null); // { fields, nodes, updatedAt }
  useEffect(()=>{
    if(mode!=='live') return;
    setLiveStatus('checking');
    let cancelled = false;
    (async ()=>{
      try{
        const [f, n] = await Promise.all([get('/agri/fields'), get('/agri/nodes').catch(()=>null)]);
        if(cancelled) return;
        setLiveData({ fields:f.fields||f, nodes:n?.nodes||null, updatedAt:new Date().toISOString() });
        setLiveStatus('connected');
      }catch{ if(!cancelled) setLiveStatus('fallback'); }
    })();
    return ()=>{ cancelled = true; };
  },[mode]);
  return <Ctx.Provider value={{ mode, setMode, liveStatus, liveData }}>{children}</Ctx.Provider>;
}
export const useMode = ()=> useContext(Ctx);

// Single source of truth for pages: live API data when actually connected, else demo data.
// Returns { fields, nodes, isLive } — isLive is true ONLY when showing backend values.
// Without a backend, pages show the selected farm site (real boundaries + open data, simulated nodes).
export function useLiveData(){
  const { mode, liveStatus, liveData } = useContext(Ctx);
  const siteCtx = useContext(SiteCtx);
  const connected = mode==='live' && liveStatus==='connected' && liveData?.fields?.length;
  const farm = siteCtx?.farm;
  return {
    fields: connected ? liveData.fields : farm?.fields?.length ? farm.fields : FIELDS,
    nodes: connected && liveData.nodes?.length ? liveData.nodes : farm?.nodes?.length ? farm.nodes : NODES,
    farm,
    isLive: !!connected,
  };
}
