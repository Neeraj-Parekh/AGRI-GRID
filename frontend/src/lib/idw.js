// Inverse-distance-weighted (IDW) spatial interpolation over node readings.
// Powers the "spatial grid" claim: values between nodes are *computed*, not filled.
export function idw(points, lat, lng, power = 2){
  let num = 0, den = 0;
  for(const p of points){
    const d2 = (p.lat - lat) ** 2 + (p.lng - lng) ** 2;
    if(d2 < 1e-14) return p.value; // exactly on a node
    const w = 1 / Math.pow(Math.sqrt(d2), power);
    num += w * p.value; den += w;
  }
  return den === 0 ? 0 : num / den;
}

// Ponded-water colormap (cm): red = dry/stress → amber → blue = flooded
export function waterColor(v, alpha = 1){
  const stops = [[0,'#C94D3D'],[2,'#C94D3D'],[3.5,'#D99A25'],[6,'#6FB6D9'],[10,'#2D78B7']];
  const c = hex => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
  let a = stops[0], b = stops[stops.length-1];
  for(let i=0;i<stops.length-1;i++){ if(v>=stops[i][0]&&v<=stops[i+1][0]){ a=stops[i]; b=stops[i+1]; break; } }
  const t = Math.min(1, Math.max(0, (v-a[0])/Math.max(1e-9,b[0]-a[0])));
  const ca=c(a[1]), cb=c(b[1]);
  const m = ca.map((x,i)=>Math.round(x+(cb[i]-x)*t));
  return `rgba(${m[0]},${m[1]},${m[2]},${alpha})`;
}

export function bboxOf(poly){
  const lats = poly.map(p=>p[0]), lngs = poly.map(p=>p[1]);
  return { minLat:Math.min(...lats), maxLat:Math.max(...lats), minLng:Math.min(...lngs), maxLng:Math.max(...lngs) };
}

// Ray-cast point-in-polygon for [lat,lng] polygons
export function pointInPoly(lat, lng, poly){
  let inside = false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i][1], yi=poly[i][0], xj=poly[j][1], yj=poly[j][0];
    if(((yi>lat)!==(yj>lat)) && (lng < (xj-xi)*(lat-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}

// Grid of IDW-interpolated sample points inside a polygon (for Leaflet/canvas overlays)
export function idwGrid(poly, points, n = 14){
  const b = bboxOf(poly), out = [];
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){
    const lat = b.minLat + (b.maxLat-b.minLat)*(i+0.5)/n;
    const lng = b.minLng + (b.maxLng-b.minLng)*(j+0.5)/n;
    if(!pointInPoly(lat,lng,poly)) continue;
    out.push({ lat, lng, value:+idw(points,lat,lng).toFixed(2) });
  }
  return { samples:out, bbox:b };
}
