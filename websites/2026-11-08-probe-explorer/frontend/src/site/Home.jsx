import { Link } from 'react-router-dom';
import { ArrowRight, Satellite, Cpu, Brain, ShieldCheck, Smartphone, Users, Landmark, Leaf, Store, Droplets } from 'lucide-react';
import SkyBanner from '../components/three/SkyBanner.jsx';
import StoryScroll from '../components/three/StoryScroll.jsx';
import Photo from './Photo.jsx';
import { lazy, Suspense } from 'react';
import { NODES } from '../data/demo.js';
import './site.css';

// The cutaway embed pulls in the probe engine, so it is split into its own chunk.
const ProbeCutaway = lazy(() => import('../probe/embeds/ProbeCutaway.jsx'));
const heroNodes = NODES.filter(n => n.fieldId === 'AGRI-001').map(n => ({ id: n.id, water: n.water, status: n.status }));

const STATS = [
  { v: '3.9 Mt', l: 'methane a year from India\'s irrigated paddy fields, slightly more than Germany\'s total methane emissions', s: 'Nature Food study, 2026 (via news summary)' },
  { v: '30–70%', l: 'less methane when fields follow Alternate Wetting and Drying, with no yield loss', s: 'IRRI' },
  { v: 'up to 30%', l: 'less irrigation water under AWD', s: 'IRRI / CGIAR' },
  { v: '−15 cm', l: 'the AWD re-irrigation point: below the soil, where a farmer cannot see it', s: 'IRRI' },
];

const AI = [
  { icon: Cpu, t: 'Probe calibration model', d: 'Turns raw capacitance counts into soil water content, fitted to oven-dried samples of the local soil and corrected for temperature.', b: ['b-proto', 'In progress'] },
  { icon: Brain, t: 'Spatial anomaly detection', d: 'Compares drying rates across neighbouring nodes. One zone draining 27× faster than the rest means a leaking bund, not weather.', b: ['b-sim', 'Prototype · simulated data'] },
  { icon: Satellite, t: 'SAR water mapping', d: 'A ResNet-34 U-Net on Sentinel-1 VV/VH maps water across whole fields: 0.3817 per-chip mIoU on a clean test set.', b: ['b-active', 'Measured'] },
  { icon: ShieldCheck, t: 'Discrepancy engine', d: 'When ground and satellite disagree, nothing is averaged. The field is flagged and a person reviews it. That is what makes the record credit-grade.', b: ['b-proto', 'Design · in dashboard'] },
];

const WHO = [
  { icon: Smartphone, t: 'Farmer', d: 'One SMS in Marathi, Hindi or English: irrigate, wait, or check a bund.', planned: false },
  { icon: Users, t: 'FPO', d: 'Every member field on one map, with the fields that need a visit first.', planned: false },
  { icon: Landmark, t: 'Agriculture department', d: 'Verified AWD adoption and water saved, by block and district.', planned: false },
  { icon: Leaf, t: 'Carbon & water credits', d: 'An evidence trail per field: every reading with node, time, signal and a satellite cross-check.', planned: true },
  { icon: Store, t: 'Marketplaces', d: 'Low-water rice labels, input and insurance offers tied to verified practice.', planned: true },
];

const ROADMAP = [
  ['Now', 'Prototype', 'Printed probes, ESP nodes, SMS gateway, dashboard, trained SAR model.'],
  ['Next', 'Field pilot', 'Four nodes on a real paddy plot for a full AWD cycle; calibration and range measured.'],
  ['Then', 'FPO cluster', 'LoRa 865 MHz nodes, solar enclosures, 20–50 fields, live SAR wiring.'],
  ['Later', 'Credits & markets', 'Evidence trail registered with a credit standard; marketplace and scheme integrations.'],
];

export default function Home() {
  return (
    <div className="site">
      <header className="site-nav">
        <a href="#top" className="site-brand"><span className="brand-mark">AG</span> AGRI-GRID</a>
        <nav aria-label="Sections"><a href="#problem">Problem</a><a href="#how">How it works</a><a href="#probe">Probe</a><a href="#ai">AI</a><a href="#who">Who it helps</a><a href="#team">Team</a></nav>
        <Link to="/dashboard" className="btn site-cta">Open dashboard <ArrowRight size={15} /></Link>
      </header>

      <section id="top" className="site-hero">
        <SkyBanner nodes={heroNodes} height="min(68vh, 620px)" className="site-hero-sky" />
        <div className="site-hero-copy">
          <span className="site-kicker">AI for Climate Change · Paddy water and methane</span>
          <h1>See the water under the mud. Save it, and prove it.</h1>
          <p>AGRI-GRID combines 3D-printed soil probes with satellite radar and AI to tell rice farmers exactly when to irrigate, cutting water and methane with evidence a buyer or government can trust.</p>
          <div className="site-actions"><a href="#how" className="btn">See how it works</a><Link to="/dashboard" className="btn ghost">Open the dashboard</Link></div>
        </div>
      </section>

      <section id="problem" className="site-sec">
        <div className="site-wrap">
          <h2>Flooded rice is a methane factory, and the fix is already known</h2>
          <p className="site-lead">Alternate Wetting and Drying works. Farmers rarely use it because nobody can see 15 cm under the soil across a whole field, every day, and nobody can prove it was done.</p>
          <div className="site-stats">{STATS.map(s => <div key={s.v} className="site-stat"><b>{s.v}</b><p>{s.l}</p><small>{s.s}</small></div>)}</div>
        </div>
      </section>

      <div id="how"><StoryScroll /></div>

      <section id="probe" className="site-sec">
        <div className="site-wrap site-split">
          <div>
            <span className="site-kicker">Hardware</span>
            <h2>A printed probe that reads water above and below the soil</h2>
            <p>A PETG tube with copper electrodes on the inside wall. The plastic wall is the insulator, so no metal touches soil and nothing corrodes.</p>
            <ul className="site-list">
              <li><Droplets size={16} /> Water strip: standing water from −5 to +100 mm</li>
              <li><Droplets size={16} /> Four soil bands: 0–5, 5–10, 10–15, 15–20 cm</li>
              <li><Droplets size={16} /> Band E1 matches the depth C-band radar sees, so ground and satellite can be compared</li>
              <li><Droplets size={16} /> Read by ESP32 touch channels; calibrated by the oven-dry method</li>
            </ul>
            <p className="site-fine">Principle: capacitance (dielectric) soil sensing, the same family as commercial profile probes. Accuracy figures will be published after calibration.</p>
          </div>
          <div>
            <Suspense fallback={<div style={{ height: 460, borderRadius: 18, background: '#e9eef0' }} />}><ProbeCutaway chapter={5} height={460} /></Suspense>
            <div className="site-gallery two" style={{ marginTop: 14 }}>
              <Photo name="probe-cutaway.jpg" alt="Printed probe, cutaway" ratio="4 / 3" />
              <Photo name="printer.jpg" alt="3D printer printing the probe" ratio="4 / 3" />
            </div>
          </div>
        </div>
      </section>

      <section id="ai" className="site-sec alt">
        <div className="site-wrap">
          <span className="site-kicker">AI</span>
          <h2>Four AI layers, each labelled with how far along it is</h2>
          <div className="site-cards four">{AI.map(({ icon: I, t, d, b }) => <div key={t} className="site-card"><I size={22} /><h3>{t}</h3><p>{d}</p><span className={`badge ${b[0]}`}>{b[1]}</span></div>)}</div>
        </div>
      </section>

      <section id="who" className="site-sec">
        <div className="site-wrap">
          <span className="site-kicker">Precision decisions</span>
          <h2>One field record, five people who act on it</h2>
          <div className="site-cards five">{WHO.map(({ icon: I, t, d, planned }) => <div key={t} className="site-card"><I size={22} /><h3>{t}</h3><p>{d}</p>{planned && <span className="badge b-demo">Planned</span>}</div>)}</div>
        </div>
      </section>

      <section className="site-sec alt">
        <div className="site-wrap">
          <span className="site-kicker">Roadmap</span>
          <h2>From the table to the cluster</h2>
          <ol className="site-road">{ROADMAP.map(([w, t, d]) => <li key={t}><small>{w}</small><b>{t}</b><p>{d}</p></li>)}</ol>
        </div>
      </section>

      <section id="evidence" className="site-sec">
        <div className="site-wrap">
          <span className="site-kicker">Evidence</span>
          <h2>From the field and the bench</h2>
          <div className="site-gallery four">
            <Photo name="field-1.jpg" alt="Field visit photo" caption="Field visit" />
            <Photo name="field-2.jpg" alt="Paddy field photo" caption="Paddy plot" />
            <Photo name="prototype-1.jpg" alt="Prototype node photo" caption="Prototype node" />
            <Photo name="prototype-2.jpg" alt="Bench test photo" caption="Bench test" />
          </div>
        </div>
      </section>

      <section id="team" className="site-sec alt">
        <div className="site-wrap">
          <span className="site-kicker">Team FusionForge · MITAOE</span>
          <h2>The team</h2>
          <div className="site-team">
            {[['team-1.jpg', 'Team member 1', 'Role'], ['team-2.jpg', 'Team member 2', 'Role'], ['team-3.jpg', 'Team member 3', 'Role'], ['team-4.jpg', 'Team member 4', 'Role']].map(([f, n, r]) => (
              <div key={f}><Photo name={f} alt={n} ratio="1 / 1" /><b>{n}</b><small>{r}</small></div>))}
          </div>
        </div>
      </section>

      <footer className="site-foot">
        <div className="site-wrap">
          <p><b>AGRI-GRID</b> · prototype for the Indradhanu PCCOE International Grand Challenge 2026. Data in the dashboard is simulated unless marked live; nothing here claims a deployment we have not done.</p>
          <p className="site-fine">Sources: IRRI, Alternate wetting and drying (ghgmitigation.irri.org); CGIAR CCAFS AWD case study (2014); IWMI (2024) on rice's share of global CH₄; Nature Food study on paddy emissions (2026, reported by Vajiram & Ravi). Weather: Open-Meteo. Satellite imagery, when added: contains modified Copernicus Sentinel data.</p>
        </div>
      </footer>
    </div>
  );
}
