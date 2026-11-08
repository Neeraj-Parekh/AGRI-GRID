import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, Brain, FileCheck, Cpu, FileText, Settings, HelpCircle, Bell, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMode } from '../context/ModeContext.jsx';
import { useSite } from '../context/SiteContext.jsx';

export default function Layout({ children }){
  const { mode, setMode, liveStatus } = useMode();
  const live = mode==='live';
  const { site, farm } = useSite();
  return (
    <div className="app">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand"><div className="brand-mark">AG</div><div><b>AGRI-GRID</b><small>From sensor points to a living digital field</small></div></div>
        <div className="cluster"><b>{site.name.toUpperCase()}</b><small>{site.district ? `${site.district}, ` : ''}{site.state} · {farm.crop.crop} · {farm.season}</small></div>
        <nav className="nav">
          <NavLink to="/dashboard" className={({isActive})=>isActive?'active':''}><LayoutDashboard size={17}/> Overview</NavLink>
          <NavLink to="/fields" className={({isActive})=>isActive?'active':''}><MapIcon size={17}/> Fields</NavLink>
          <NavLink to="/intelligence" className={({isActive})=>isActive?'active':''}><Brain size={17}/> Intelligence</NavLink>
          <NavLink to="/evidence" className={({isActive})=>isActive?'active':''}><FileCheck size={17}/> Evidence</NavLink>
          <div className="nav-sep"/>
          <NavLink to="/hardware" className={({isActive})=>isActive?'active':''}><Cpu size={17}/> Hardware</NavLink>
          <NavLink to="/reports" className={({isActive})=>isActive?'active':''}><FileText size={17}/> Reports</NavLink>
          <NavLink to="/settings" className={({isActive})=>isActive?'active':''}><Settings size={17}/> Settings</NavLink>
          <Link to="/"><Globe size={17}/> Project site</Link>
          <a href="#" onClick={e=>e.preventDefault()}><HelpCircle size={17}/> Help</a>
        </nav>
        <div className="side-quote">“Data for Resilient Agriculture”</div>
        <div className="side-foot">AGRI-GRID<br/><small style={{fontWeight:400,color:'#B9CDC2'}}>MITAOE | FusionForge</small></div>
      </aside>
      <div className="main">
        <div className="topbar">
          <nav aria-label="Sections">
            <NavLink to="/dashboard" className={({isActive})=>isActive?'active':''}>Overview</NavLink>
            <NavLink to="/fields">Fields</NavLink>
            <NavLink to="/intelligence">Intelligence</NavLink>
            <NavLink to="/evidence">Evidence</NavLink>
            <NavLink to="/hardware">Hardware</NavLink>
          </nav>
          <div className="top-right">
            <button className={`mode-pill ${live?'live':''}`} onClick={()=>setMode(live?'demo':'live')} title="Toggle Demo / Live">
              <span className="dot"/> {live ? `Live ${liveStatus==='connected'?'(connected)':liveStatus==='fallback'?'(offline fallback)':'(checking…)'}` : 'Demo Mode'}
            </button>
            <Bell size={19} color="#65716B"/>
            <div className="userchip"><div className="avatar">NP</div><div><b>Neeraj Parekh</b><br/><small style={{color:'#65716B'}}>Team FusionForge</small></div></div>
          </div>
        </div>
        {live ? (
          <div className="live-banner">LIVE MODE — reading local AGRI-GRID API prototype store {liveStatus==='connected'?'(connected). POST node packets to /agri/ingest to feed the dashboard.':liveStatus==='fallback'?'(backend unreachable — showing demo fallback, SIMULATED).':'(checking backend…)'} <button className="btn ghost" style={{marginLeft:12,padding:'4px 10px'}} onClick={()=>setMode('demo')}>Switch to Demo</button></div>
        ) : (
          <div className="demo-banner"><b>DEMO MODE</b> · real field boundaries, weather and soil from open data · sensor node readings simulated until hardware is deployed <span className="badge b-sim">NODES SIMULATED</span></div>
        )}
        <div className="content">{children}
          <div className="footer-note">AGRI-GRID prototype — field evidence demo. Ground + Space + Context cross-validation. <span className="badge b-proto">PROTOTYPE — NOT FOR PRODUCTION</span></div>
        </div>
      </div>
    </div>
  );
}
