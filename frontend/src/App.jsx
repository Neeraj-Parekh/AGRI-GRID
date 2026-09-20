import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { ModeProvider } from './context/ModeContext.jsx';
import Overview from './pages/Overview.jsx';
import Fields from './pages/Fields.jsx';
import FieldDetail from './pages/FieldDetail.jsx';
import Intelligence from './pages/Intelligence.jsx';
import Evidence, { EvidenceDetail } from './pages/Evidence.jsx';
import Hardware from './pages/Hardware.jsx';
import Reports, { Settings } from './pages/Reports.jsx';
function EvWrap(){ const { id } = useParams(); return <EvidenceDetail id={id}/>; }
export default function App(){
  return (<ModeProvider><BrowserRouter><Layout><Routes>
    <Route path="/" element={<Overview/>}/>
    <Route path="/fields" element={<Fields/>}/>
    <Route path="/fields/:id" element={<FieldDetail/>}/>
    <Route path="/intelligence" element={<Intelligence/>}/>
    <Route path="/evidence" element={<Evidence/>}/>
    <Route path="/evidence/:id" element={<EvWrap/>}/>
    <Route path="/hardware" element={<Hardware/>}/>
    <Route path="/reports" element={<Reports/>}/>
    <Route path="/settings" element={<Settings/>}/>
  </Routes></Layout></BrowserRouter></ModeProvider>);
}
