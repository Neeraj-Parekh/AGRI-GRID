import { useEffect, useRef, useState } from 'react';
import './three.css';

export const STORY = [
  { kicker: '01 · Space', title: 'A radar satellite photographs the field', body: 'Sentinel-1 sends C-band radar pulses through cloud, day or night. Wet soil and standing water change how much signal comes back, so the image shows where water is across every field at once.', tag: 'Real data source · free from ESA Copernicus' },
  { kicker: '02 · Ground', title: 'Printed probes read the water you cannot see', body: 'Each node carries a 3D-printed dielectric probe: one strip reads standing water, four bands read soil moisture down to 20 cm. That is where the AWD decision lives: re-irrigate when water falls 15 cm below the surface.', tag: 'Prototype hardware' },
  { kicker: '03 · AI', title: 'Two AI models read space and ground together', body: 'A U-Net maps water in the SAR image (0.38 mIoU on a clean test set, measured). An anomaly model compares nodes: when B2 drains far faster than its neighbours, that is a leaking bund, not weather. A discrepancy check decides whether ground and space agree.', tag: 'SAR model measured · live wiring in progress' },
  { kicker: '04 · Person', title: 'When the evidence agrees, advice goes out. When it does not, a person checks.', body: 'Agreement sends a recommendation automatically. Disagreement is never averaged away: it goes to an agronomist for review. That rule is what makes the record trustworthy.', tag: 'Design principle' },
  { kicker: '05 · Farmer', title: 'One SMS, in the farmer\'s language, with one clear action', body: '"Field A1: soil dry at 15 cm. Irrigate today. Also check the B2 bund." No app or data plan needed. The farmer runs the pump only when the field needs it.', tag: 'Demo: ESP32 gateway + SIM800L' },
  { kicker: '06 · Everyone', title: 'The same evidence serves the whole chain', body: 'FPOs see every member field. Agriculture departments see verified AWD adoption. Carbon and water credit buyers get an evidence trail. Marketplaces can label low-water rice. Credits and marketplace links are planned, not built.', tag: 'Roadmap' },
];

/** Scroll-driven 3D story. Renders a tall section with a sticky canvas and captions. */
export default function StoryScroll({ sarImage }) {
  const section = useRef(null), canvas = useRef(null), api = useRef(null);
  const [chapter, setChapter] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    import('../../three/storyScene.js').then(({ mountStory }) => {
      if (disposed || !canvas.current) return;
      try { api.current = mountStory(canvas.current, { onChapter: setChapter, sarImage }); } catch { setFailed(true); }
      onScroll();
    }).catch(() => setFailed(true));
    function onScroll() {
      const el = section.current; if (!el || !api.current) return;
      const r = el.getBoundingClientRect(); const total = el.offsetHeight - window.innerHeight;
      api.current.setProgress(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0);
    }
    window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll);
    return () => { disposed = true; window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); api.current?.dispose(); api.current = null; };
  }, [sarImage]);

  const jumpTo = (i) => {
    const el = section.current; if (!el) return;
    const total = el.offsetHeight - window.innerHeight; const starts = [0.02, 0.2, 0.42, 0.6, 0.73, 0.95];
    window.scrollTo({ top: el.offsetTop + starts[i] * total, behavior: 'smooth' });
  };

  return (
    <section ref={section} className="ag-story" aria-label="How AGRI-GRID works">
      <div className="ag-story-sticky">
        {failed ? <div className="ag-sky-fallback" /> : <div ref={canvas} className="ag-story-canvas" />}
        <div className="ag-story-card" aria-live="polite">
          <div className="ag-story-kicker">{STORY[chapter].kicker}</div>
          <h3>{STORY[chapter].title}</h3>
          <p>{STORY[chapter].body}</p>
          <span className="ag-story-tag">{STORY[chapter].tag}</span>
        </div>
        <nav className="ag-story-dots" aria-label="Story chapters">
          {STORY.map((s, i) => <button key={s.kicker} type="button" aria-current={i === chapter} onClick={() => jumpTo(i)} title={s.kicker}><span>{s.kicker.split('· ')[1]}</span></button>)}
        </nav>
        <div className="ag-story-hint">Scroll to follow the data</div>
      </div>
    </section>
  );
}
