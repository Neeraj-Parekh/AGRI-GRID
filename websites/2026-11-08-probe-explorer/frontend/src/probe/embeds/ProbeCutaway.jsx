// Home-page embed: a compact cutaway that loops the chapter 5 sensing beat, with its honesty line.
// The engine module loads only when the embed scrolls into view.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const BASE = import.meta.env.BASE_URL || '/';

export default function ProbeCutaway({ chapter = 5, height = 460 }) {
  const ref = useRef(null);
  const [st, setSt] = useState(null);
  useEffect(() => {
    let eng = null; let cancelled = false;
    const start = async () => {
      const { createEngine } = await import('../engine.js');
      if (cancelled || !ref.current) return;
      eng = createEngine(ref.current, { base: BASE, quality: 'medium', loop: true, settings: { hidden: Array.from({ length: 18 }, (_, i) => i + 1).filter((n) => n !== chapter) }, onFrame: setSt });
      eng.setTags(false);
      eng.ready.then(() => { const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; if (reduced) eng.seek(20); else eng.play(); });
    };
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && !eng) { start(); io.disconnect(); } }, { rootMargin: '200px' });
    if (ref.current) io.observe(ref.current);
    return () => { cancelled = true; io.disconnect(); eng?.dispose(); };
  }, [chapter]);
  return (
    <div style={{ position: 'relative', height, borderRadius: 18, overflow: 'hidden', background: '#e9eef0' }}>
      <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', left: 14, top: 10, fontSize: 11.5, fontWeight: 650, color: '#4E5F56', textShadow: '0 0 6px rgba(255,255,255,.9)' }}>{st ? st.ch.honesty : 'Design render · probe in build'}</div>
      {st?.hud?.caption && <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, fontSize: 13.5, lineHeight: 1.4, fontWeight: 550, padding: '9px 12px', borderRadius: 12, background: 'rgba(255,255,255,.82)', backdropFilter: 'blur(8px)' }}>{st.hud.caption}</div>}
      <Link to="/probe" className="btn" style={{ position: 'absolute', right: 14, top: 12 }}>Open the Probe Explorer</Link>
    </div>
  );
}
