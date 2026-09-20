import { createContext, useContext, useEffect, useState } from 'react';
const Ctx = createContext(null);
export function ModeProvider({ children }){
  const [mode, setMode] = useState('demo'); // demo | live
  const [liveStatus, setLiveStatus] = useState('idle'); // idle|checking|connected|fallback
  const [liveData, setLiveData] = useState(null);
  useEffect(()=>{
    if(mode!=='live') return;
    setLiveStatus('checking');
    const url = import.meta.env.VITE_AGRI_API || 'http://localhost:8001';
    fetch(`${url}/agri/fields`, { signal: AbortSignal.timeout(3500) })
      .then(r=>{ if(!r.ok) throw new Error('bad'); return r.json(); })
      .then(j=>{ setLiveData(j); setLiveStatus('connected'); })
      .catch(()=> setLiveStatus('fallback'));
  },[mode]);
  return <Ctx.Provider value={{ mode, setMode, liveStatus, liveData }}>{children}</Ctx.Provider>;
}
export const useMode = ()=> useContext(Ctx);
