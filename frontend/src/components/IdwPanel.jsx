import { useEffect, useRef } from 'react';
import { idwGrid, waterColor } from '../lib/idw.js';

// Canvas panel rendering a *computed* IDW surface from node readings.
// Props: poly (field polygon), nodes [{lat,lng,water}], height
export default function IdwPanel({ poly, nodes, height=150 }){
  const ref = useRef(null);
  useEffect(()=>{
    const cv = ref.current; if(!cv||!poly||!nodes?.length) return;
    const ctx = cv.getContext('2d');
    const W = cv.width = 520, H = cv.height = 220;
    const { samples, bbox } = idwGrid(poly, nodes.map(n=>({lat:n.lat,lng:n.lng,value:n.water})), 46);
    const X = lng => (lng-bbox.minLng)/Math.max(1e-9,bbox.maxLng-bbox.minLng)*W;
    const Y = lat => H-(lat-bbox.minLat)/Math.max(1e-9,bbox.maxLat-bbox.minLat)*H;
    ctx.fillStyle = '#dfe8dd'; ctx.fillRect(0,0,W,H);
    const cw = W/46+1, ch = H/46+1;
    for(const s of samples){ ctx.fillStyle = waterColor(s.value,0.92); ctx.fillRect(X(s.lng)-cw/2, Y(s.lat)-ch/2, cw, ch); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath();
    poly.forEach(([la,ln],i)=>{ const x=X(ln),y=Y(la); i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
    ctx.closePath(); ctx.stroke();
    for(const n of nodes){
      ctx.beginPath(); ctx.arc(X(n.lng),Y(n.lat),8,0,7);
      ctx.fillStyle = n.status==='alert'?'#C94D3D':n.status==='watch'?'#D99A25':'#2F7D46'; ctx.fill();
      ctx.lineWidth=2.5; ctx.strokeStyle='#fff'; ctx.stroke();
    }
  },[poly,nodes]);
  if(!nodes?.length) return <p><small>No node readings — cannot interpolate.</small></p>;
  return (
    <div>
      <canvas ref={ref} style={{width:'100%',height,borderRadius:10,display:'block'}} role="img" aria-label="IDW-interpolated water surface computed from node readings"/>
      <small>Water Level (cm): &gt;10 · 5–10 · 2–5 · 0–2 — IDW (p=2) from {nodes.length} nodes, computed in-browser</small>
    </div>
  );
}
