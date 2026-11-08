// /probe — the Probe Explorer: 18 deterministic chapters over three 3D worlds, with the HUD, settings menu,
// record mode (?record=1, 1920×1080, C = clean frame) and exact deep links (?ch=&t=&paused=1).
import { Component, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createEngine } from './engine.js';
import { CHAPTERS } from './director/chapters.js';
import { Card, FieldMap } from './hud/cards.jsx';
import { Overlay } from './hud/overlays.jsx';
import { makeT, LANGS } from './i18n.js';
import { INTERACTIVE, parseLog } from './director/interactive.js';
import '../components/dash/dash.css';
import './probe.css';

const BASE = import.meta.env.BASE_URL || '/';
const PANELS = ['chapter', 'card', 'map', 'log', 'toasts', 'captions', 'honesty', 'tags'];
const DEFAULTS = { hidden: [], panels: PANELS, hideCosts: false, variant: 'prototype', quality: 'auto', lang: 'en' };
const LS_KEY = 'agrigrid-probe-settings-v1';

function readSettings() {
  let s = { ...DEFAULTS };
  try { const raw = localStorage.getItem(LS_KEY); if (raw) s = { ...s, ...JSON.parse(raw) }; } catch { /* storage unavailable */ }
  const q = new URLSearchParams(window.location.search);
  if (q.has('hide')) s.hidden = q.get('hide').split(',').filter(Boolean).map(Number);
  if (q.has('panels')) s.panels = q.get('panels').split(',').filter(Boolean);
  if (q.has('costs')) s.hideCosts = q.get('costs') === '0';
  if (q.has('variant')) s.variant = q.get('variant') === 'field' ? 'field' : 'prototype';
  if (q.has('quality')) s.quality = q.get('quality');
  if (q.has('lang')) s.lang = q.get('lang');
  return s;
}
function settingsQuery(s) {
  const q = new URLSearchParams();
  if (s.hidden.length) q.set('hide', s.hidden.join(','));
  if (s.panels.length !== PANELS.length) q.set('panels', s.panels.join(','));
  if (s.hideCosts) q.set('costs', '0');
  if (s.variant !== 'prototype') q.set('variant', s.variant);
  if (s.quality !== 'auto') q.set('quality', s.quality);
  if (s.lang !== 'en') q.set('lang', s.lang);
  return q;
}
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const chTone = (ch) => ({ problem: 'warn', corrode: 'alert', cycle: 'alert', grid: 'alert', lies: 'warn', impact: 'ok', calib: 'ok', install: 'ok' }[ch.id] || 'sense');

const Icon = { play: <svg viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>, pause: <svg viewBox="0 0 16 16"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" /></svg>, menu: <svg viewBox="0 0 20 20"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>, close: <svg viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg> };

/** Keeps a failure in one 3D world from blanking the page; shows the message and a reload link. */
class Boundary extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (<div className="px" style={{ display: 'grid', placeItems: 'center' }}><div className="px-glass" style={{ padding: 24, maxWidth: 520 }}>
      <h3 style={{ marginTop: 0 }}>The Probe Explorer hit a problem</h3><p className="px-note">{String(this.state.err?.message || this.state.err)}</p>
      <a className="px-link" href={window.location.pathname}>Reload from the start</a></div></div>);
  }
}

export default function ProbeExplorerPage() { return <Boundary><ProbeExplorer /></Boundary>; }

function ProbeExplorer() {
  const q = useMemo(() => new URLSearchParams(window.location.search), []);
  const record = q.get('record') === '1';
  const reduced = useMemo(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const [settings, setSettings] = useState(readSettings);
  const [st, setSt] = useState(null);
  const [menu, setMenu] = useState(false);
  const [hudOn, setHudOn] = useState(q.get('hud') !== '0');
  const [clean, setClean] = useState(q.get('clean') === '1');
  const [scale, setScale] = useState(1);
  const [hover, setHover] = useState(null);
  const [frame, setFrame] = useState(0);
  const [explore, setExplore] = useState(null); // { mode, params }
  const [hoverCard, setHoverCard] = useState(null);
  const [log, setLog] = useState(null);
  const stageRef = useRef(null); const engRef = useRef(null); const frameRef = useRef(null);
  const T = useMemo(() => makeT(settings.lang), [settings.lang]);

  // engine lifecycle
  useEffect(() => {
    const eng = createEngine(stageRef.current, { base: BASE, quality: settings.quality, fixedSize: record ? [1920, 1080] : null, hold: record ? 1 : 0, settings, onFrame: setSt, onHover: setHoverCard });
    engRef.current = eng; window.__probe = eng;
    const ch = Number(q.get('ch')), t = Number(q.get('t') || 0);
    if (ch) eng.seekChapter(ch, t); else eng.seek(0);
    const autoplay = q.get('paused') !== '1' && !reduced;
    eng.ready.then(() => { if (autoplay) eng.play(); });
    // build the remaining worlds when the browser is idle, so later chapters start without a hitch
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
    const h = q.get('warm') === '0' ? 0 : idle(() => eng.warm(), { timeout: 3000 });
    return () => { (window.cancelIdleCallback || clearTimeout)(h); eng.dispose(); engRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // settings → engine, storage and URL
  useEffect(() => {
    engRef.current?.setSettings({ variant: settings.variant, hideCosts: settings.hideCosts, lang: settings.lang, hidden: settings.hidden });
    engRef.current?.setTags(settings.panels.includes('tags') && !clean);

    try { localStorage.setItem(LS_KEY, JSON.stringify(settings)); } catch { /* storage unavailable */ }
  }, [settings, clean, hudOn, record]);

  // record mode: fit the fixed 1920×1080 frame into the window; frame counter outside the capture area
  useEffect(() => {
    if (!record) return undefined;
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit);
  }, [record]);
  useEffect(() => { if (st) setFrame(Math.round(st.T * 30)); }, [st]);
  // keep the 3D subject centred in the free area between the left column and the right panels
  const chN = st?.ch.n; const hasLog = !!(st?.hud?.log?.length); const hasMap = !!st?.hud?.map;
  useEffect(() => {
    const fr = frameRef.current; const eng = engRef.current; if (!fr || !eng) return;
    const W = fr.clientWidth; if (!W || (!record && window.innerWidth <= 820)) { eng.setInset(0); return; }
    const left = fr.querySelector('.px-left')?.getBoundingClientRect(); const fb = fr.getBoundingClientRect(); const sc = fb.width / W || 1;
    const lEdge = left && left.width > 0 && fr.querySelector('.px-ch, .px-card') ? (left.right - fb.left) / sc : 0;
    const rights = [...fr.querySelectorAll('.px-log, .px-map')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => (r.left - fb.left) / sc);
    const rEdge = rights.length ? Math.min(...rights) : W;
    eng.setInset(Math.round(lEdge + rEdge - W));
  }, [chN, hudOn, clean, settings.panels, record, scale, hasLog, hasMap, explore]);

  const set = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  // interactive modes → engine
  useEffect(() => { engRef.current?.setInteractive(explore?.mode || null, explore?.params); }, [explore]);
  const setParam = (k, v) => setExplore((e) => ({ ...e, params: { ...e.params, [k]: v } }));
  const onFile = async (file) => { try { const rows = parseLog(await file.text()); setLog(rows); setExplore({ mode: 'replay', params: { log: rows, i: 0 } }); } catch (err) { setLog({ error: String(err.message || err) }); } };

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const eng = engRef.current; if (!eng) return;
      if (e.code === 'Space') { e.preventDefault(); eng.toggle(); }
      else if (e.key === 'ArrowRight') eng.seek(eng.T + 5);
      else if (e.key === 'ArrowLeft') eng.seek(eng.T - 5);
      else if (/^[1-9]$/.test(e.key)) { const segs = eng.timeline.segs; const s = segs[Number(e.key) - 1]; if (s) eng.seek(s.t0); }
      else if (e.key === 'r' || e.key === 'R') { eng.seek(0); eng.play(); }
      else if (e.key === 'h' || e.key === 'H') setHudOn((v) => !v);
      else if (e.key === 'c' || e.key === 'C') setClean((v) => !v);
      else if (e.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);

  const eng = engRef.current;
  const hud = st?.hud || {};
  const P = (k) => settings.panels.includes(k) && !clean;
  const showHud = hudOn && !clean;
  const segs = st?.segs || [];
  const total = st?.total || 1;
  const seekFromEvent = (e) => { const r = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width; eng?.seek(x * total); };
  const stepReduced = (dir) => { if (!eng || !st) return; const cur = st.T; const pts = segs.flatMap((s) => [0, 0.25, 0.5, 0.75].map((f) => s.t0 + f * s.dur)); const next = dir > 0 ? pts.find((p) => p > cur + 0.01) : [...pts].reverse().find((p) => p < cur - 0.01); if (next != null) eng.seek(next); };
  const copyLink = () => { const qq = settingsQuery(settings); if (st) { qq.set('ch', st.ch.n); qq.set('t', st.local.toFixed(2)); qq.set('paused', '1'); } const url = `${window.location.origin}${window.location.pathname}?${qq}`; try { navigator.clipboard.writeText(url); } catch { /* clipboard unavailable */ } window.history.replaceState(null, '', `?${qq}`); };

  const frameStyle = record ? { transform: `translate(${(window.innerWidth - 1920 * scale) / 2}px, ${(window.innerHeight - 1080 * scale) / 2}px) scale(${scale})` } : undefined;
  const caption = T.cap(hud.caption);

  return (
    <div className={`px ${record ? 'record' : ''}`}>
      {record && !clean && <div className="px-counter">frame {frame} · {st ? `${st.ch.n}·${st.local.toFixed(2)}s` : ''}</div>}
      <div className="px-frame" style={frameStyle} ref={frameRef}>
        <div className="px-stage" ref={stageRef} />
        {!st && <div className="px-loading">Loading the probe…</div>}
        {st?.dim > 0 && <div className="px-dim" style={{ opacity: st.dim * 2 }} />}
        {st && hud.overlay && !(clean && hud.overlay.kind !== 'pipeline' && hud.overlay.kind !== 'impact' && hud.overlay.kind !== 'sar') && <Overlay ov={hud.overlay} base={BASE} />}
        {st?.ch.id === 'split' && st.split > 0.5 && !clean && <div className="px-phone-cap">Farmer’s phone · prototype app</div>}

        <div className={`px-hud ${showHud ? '' : 'off'}`}>
          <div className="px-left">
          {st && P('chapter') && (
            <section className="px-ch px-glass">
              <div className="px-brand"><em>AG</em>AGRI-GRID · {T.ui('explorer')}</div>
              <h1><span>{String(st.ch.n).padStart(2, '0')}</span>{T.title(st.ch)}</h1>
              {hud.phase && <div className="px-phase" data-tone={hud.phase.tone}><i className={`px-dot ${hud.phase.tone === 'sense' ? 'sense' : ''}`} />{hud.phase.text}</div>}
              {hud.kpis?.length > 0 && <div className={`px-kpis ${hud.kpis.length >= 4 ? 'n4' : ''}`} style={{ '--n': Math.min(4, hud.kpis.length) }}>{hud.kpis.slice(0, 4).map((k) => <div className={`px-kpi ${typeof k.v === 'string' && /[A-Za-z]{3}/.test(k.v) ? 'txt' : ''}`} key={k.l} data-tone={k.tone}><b style={{ color: k.tone ? 'var(--tc)' : undefined }}>{k.v}<small>{k.u}</small></b><span>{k.l}</span></div>)}</div>}
            </section>
          )}
          {st && P('card') && hud.card && <section className="px-card px-glass"><Card card={hud.card} /></section>}
          {explore && (
            <section className="px-card px-glass">
              <h3>Explore <button className="px-link" onClick={() => setExplore(null)}>Back to the story ›</button></h3>
              <div className="px-seg" style={{ marginBottom: 10 }}>{[['moisture', 'Moisture'], ['explode', 'Exploded'], ['replay', 'Node log']].map(([m, l]) => <button key={m} className={`px-pill ${explore.mode === m ? 'on' : ''}`} onClick={() => setExplore({ mode: m, params: m === 'replay' ? { log: Array.isArray(log) ? log : [], i: 0 } : { ...INTERACTIVE[m].defaults } })}>{l}</button>)}</div>
              {explore.mode === 'moisture' && <>{['E1', 'E2', 'E3', 'E4'].map((b) => <label key={b} className="px-row"><span>{b} θ</span><input type="range" min="0.1" max="0.48" step="0.01" value={explore.params[b]} onChange={(e) => setParam(b, Number(e.target.value))} /><b className="px-mono">{Math.round(explore.params[b] * 100)}%</b></label>)}
                <label className="px-row"><span>Water</span><input type="range" min="-200" max="60" step="5" value={explore.params.level} onChange={(e) => setParam('level', Number(e.target.value))} /><b className="px-mono">{explore.params.level} mm</b></label></>}
              {explore.mode === 'explode' && <><label className="px-row"><span>Explode</span><input type="range" min="0" max="1" step="0.01" value={explore.params.k} onChange={(e) => setParam('k', Number(e.target.value))} /><b className="px-mono">{Math.round(explore.params.k * 100)}%</b></label>
                <label className="px-row"><span>X-ray</span><input type="checkbox" checked={!!explore.params.section} onChange={(e) => setParam('section', e.target.checked ? 1 : 0)} /></label></>}
              {explore.mode === 'replay' && <><label className="px-row"><span>Log file</span><input type="file" accept=".csv,.json,text/csv,application/json" onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} /></label>
                {Array.isArray(explore.params.log) && explore.params.log.length > 0 ? <label className="px-row"><span>Row</span><input type="range" min="0" max={explore.params.log.length - 1} step="1" value={explore.params.i} onChange={(e) => setParam('i', Number(e.target.value))} /><b className="px-mono">{explore.params.i + 1}/{explore.params.log.length}</b></label>
                  : <div className="px-note">{log?.error ? `Could not read the file: ${log.error}` : 'CSV columns: timestamp,node,level_mm,E1,E2,E3,E4 (θ as fraction or %). The honesty line switches to “Measured” with the node and date.'}</div>}</>}
            </section>
          )}
          </div>
          <div className="px-top-right px-keep">
            {st && P('map') && hud.map && showHud && <section className="px-map px-glass"><h3>{T.ui('fieldMap')}</h3><FieldMap map={hud.map} /></section>}
            {!clean && <button className="px-menu-btn px-glass" aria-label={T.ui('settings')} onClick={() => setMenu((v) => !v)}>{menu ? Icon.close : Icon.menu}</button>}
          </div>
          {st && P('log') && hud.log?.length > 0 && (
            <section className="px-log px-glass" style={{ top: hud.map && P('map') ? undefined : 82 }}>
              <h3>{T.ui('events')}</h3>
              <ol>{hud.log.slice(hud.overlay && (hud.overlay.kind === 'zoom' || hud.overlay.kind === 'depths') ? -3 : -7).map((e) => <li key={`${e.t}${e.text}`} data-tone={e.tone} onClick={() => eng?.seek(st.seg.t0 + e.t)}><i /><span>{e.text}</span><small>{e.src}</small></li>)}</ol>
            </section>
          )}
          <div className="px-bottom">
            {st && P('toasts') && hud.toast && <div className="px-toast" data-tone={hud.toast.tone} style={{ opacity: hud.toast.k }}><i />{hud.toast.text}</div>}
            {st && P('captions') && caption && <div className="px-caption">{caption}</div>}
            {!record && st && (
              <div className="px-timeline px-glass">
                <button className="px-play" aria-label={st.playing ? T.ui('pause') : T.ui('play')} onClick={() => (reduced ? stepReduced(1) : eng?.toggle())}>{st.playing ? Icon.pause : Icon.play}</button>
                <div className="px-track" onClick={seekFromEvent} onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * total; const s = segs.find((g) => x >= g.t0 && x < g.t1); setHover(s ? { x: (e.clientX - r.left), s } : null); }} onMouseLeave={() => setHover(null)}>
                  {segs.map((s) => { const on = st.seg === s; const fill = Math.max(0, Math.min(1, (st.T - s.t0) / (s.t1 - s.t0))); return (<div key={s.ch.n} className={`seg ${on ? 'on' : ''}`} data-tone={chTone(s.ch)} style={{ left: `calc(${(s.t0 / total) * 100}% + 1px)`, width: `calc(${((s.t1 - s.t0) / total) * 100}% - 2px)` }}><b style={{ width: `${fill * 100}%` }} /></div>); })}
                  <div className="head" style={{ left: `calc(${(st.T / total) * 100}% - 2px)` }} />
                  {hover && <div className="tip" style={{ left: hover.x }}>{hover.s.ch.n}. {T.title(hover.s.ch)}</div>}
                </div>
                <div className="px-tl-right">
                  <span className="hide-sm">{fmtT(st.T)} / {fmtT(total)}</span>
                  {[1, 2, 4].map((s) => <button key={s} className={`px-pill hide-sm ${st.speed === s ? 'on' : ''}`} onClick={() => eng?.setSpeed(s)}>{s}×</button>)}
                  {['follow', 'overview', 'free'].map((m) => <button key={m} className={`px-pill hide-sm ${st.camMode === m ? 'on' : ''}`} onClick={() => eng?.setCamMode(m)}>{T.ui(m)}</button>)}
                  <button className={`px-pill ${explore ? 'on' : ''}`} onClick={() => setExplore((e) => (e ? null : { mode: 'moisture', params: { ...INTERACTIVE.moisture.defaults } }))}>Explore</button>
                </div>
              </div>
            )}
          </div>
        </div>
        {st && P('honesty') && <div className="px-honesty px-keep">{st.ch.honesty}</div>}
        {hoverCard && !clean && <div className="px-hover px-glass" style={{ left: hoverCard.x / hoverCard.sx + 16, top: hoverCard.y / hoverCard.sx + 12 }}><b>{hoverCard.title}</b><small>{hoverCard.text}</small></div>}

        {menu && !clean && (
          <aside className="px-settings px-glass" onKeyDown={(e) => e.stopPropagation()}>
            <h3>{T.ui('sections')} <button className="px-link" onClick={() => set({ hidden: [] })}>{T.ui('all')}</button></h3>
            <div className="px-checks">{CHAPTERS.map((c) => <label key={c.n}><input type="checkbox" checked={!settings.hidden.includes(c.n)} onChange={(e) => set({ hidden: e.target.checked ? settings.hidden.filter((n) => n !== c.n) : [...settings.hidden, c.n].sort((a, b) => a - b) })} /><span>{c.n}. {T.title(c)}</span></label>)}</div>
            <h3>{T.ui('panels')}</h3>
            <div className="px-checks">{[['chapter', 'chapterCard'], ['card', 'readingCard'], ['map', 'map'], ['log', 'log'], ['toasts', 'toasts'], ['captions', 'captions'], ['honesty', 'honesty'], ['tags', 'tags']].map(([k, l]) => <label key={k}><input type="checkbox" checked={settings.panels.includes(k)} onChange={(e) => set({ panels: e.target.checked ? [...settings.panels, k] : settings.panels.filter((p) => p !== k) })} /><span>{T.ui(l)}</span></label>)}</div>
            <div className="px-row" style={{ marginTop: 10 }}><label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={settings.hideCosts} onChange={(e) => set({ hideCosts: e.target.checked })} />{T.ui('hideCosts')}</label></div>
            <h3>{T.ui('variant')}</h3>
            <div className="px-seg">{['prototype', 'field'].map((v) => <button key={v} className={`px-pill ${settings.variant === v ? 'on' : ''}`} onClick={() => set({ variant: v })}>{T.ui(v)}</button>)}</div>
            <h3>{T.ui('quality')}</h3>
            <div className="px-seg">{['auto', 'high', 'medium', 'low'].map((v) => <button key={v} className={`px-pill ${settings.quality === v ? 'on' : ''}`} onClick={() => { set({ quality: v }); engRef.current?.setSettings({ quality: v }); }}>{v}</button>)}</div>
            <h3>{T.ui('language')}</h3>
            <div className="px-seg">{Object.entries(LANGS).map(([k, l]) => <button key={k} className={`px-pill ${settings.lang === k ? 'on' : ''}`} onClick={() => set({ lang: k })}>{l}</button>)}</div>
            <h3>{T.ui('record')}</h3>
            <div className="px-row"><button className="px-link" onClick={copyLink}>{T.ui('copyLink')}</button><a className="px-link" href={`?${(() => { const qq = settingsQuery(settings); qq.set('record', '1'); return qq; })()}`}>1920×1080 ›</a></div>
            <div className="px-note">Keys: space play · ←/→ 5 s · 1–9 chapter · R restart · H HUD · C clean frame</div>
          </aside>
        )}
      </div>
    </div>
  );
}
