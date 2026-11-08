import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useParams } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { ModeProvider } from './context/ModeContext.jsx';
import { SiteProvider } from './context/SiteContext.jsx';
import Home from './site/Home.jsx';
import Overview from './pages/Overview.jsx';
import Fields from './pages/Fields.jsx';
import FieldDetail from './pages/FieldDetail.jsx';
import Intelligence from './pages/Intelligence.jsx';
import Evidence, { EvidenceDetail } from './pages/Evidence.jsx';
import Hardware from './pages/Hardware.jsx';
import Reports, { Settings } from './pages/Reports.jsx';
// The Probe Explorer is heavy (three.js worlds), so it loads only on /probe.
const ProbeExplorer = lazy(() => import('./probe/ProbeExplorer.jsx'));
function ProbeRoute(){ return <Suspense fallback={<div style={{position:'fixed',inset:0,display:'grid',placeItems:'center',fontWeight:700,color:'#4E5F56'}}>Loading the probe…</div>}><ProbeExplorer/></Suspense>; }
function EvWrap(){ const { id } = useParams(); return <EvidenceDetail id={id}/>; }
function Shell(){ return <Layout><Outlet/></Layout>; }
// "/" is the public story site; the dashboard lives under /dashboard and the existing routes.
export default function App(){
  return (<SiteProvider><ModeProvider><BrowserRouter basename={import.meta.env.BASE_URL}><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/probe" element={<ProbeRoute/>}/>
    <Route element={<Shell/>}>
      <Route path="/dashboard" element={<Overview/>}/>
      <Route path="/fields" element={<Fields/>}/>
      <Route path="/fields/:id" element={<FieldDetail/>}/>
      <Route path="/intelligence" element={<Intelligence/>}/>
      <Route path="/evidence" element={<Evidence/>}/>
      <Route path="/evidence/:id" element={<EvWrap/>}/>
      <Route path="/hardware" element={<Hardware/>}/>
      <Route path="/reports" element={<Reports/>}/>
      <Route path="/settings" element={<Settings/>}/>
    </Route>
    <Route path="*" element={<Home/>}/>
  </Routes></BrowserRouter></ModeProvider></SiteProvider>);
}
