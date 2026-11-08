// Offline field artwork — replaces hotlinked stock photos so pages render with no network.
// Swap these with real AGRI-GRID node photos before judging (real hardware beats illustration).
export function FieldArt({ label='AGRI-001 · Paddy', variant=0 }){
  const skies = [['#BFE0F2','#EAF6E9'],['#C9DDF5','#F2F5E4'],['#B7D9EE','#E9F3E2']];
  const [s0,s1] = skies[variant%3];
  return (
    <svg viewBox="0 0 600 220" role="img" aria-label={label} style={{width:'100%',borderRadius:10,display:'block'}}>
      <defs><linearGradient id={`ag${variant}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={s0}/><stop offset=".55" stopColor={s1}/><stop offset=".56" stopColor="#3E7A45"/><stop offset="1" stopColor="#2F7D46"/>
      </linearGradient></defs>
      <rect width="600" height="220" fill={`url(#ag${variant})`}/>
      <circle cx="490" cy="42" r="20" fill="#F6C445" opacity=".9"/>
      <path d="M0 96 L120 78 L240 96 L360 80 L480 96 L600 82 L600 124 L0 124 Z" fill="#0B2E22" opacity=".55"/>
      {Array.from({length:9}).map((_,r)=>(<line key={r} x1="0" y1={132+r*10} x2="600" y2={128+r*10} stroke="#79C95B" strokeWidth="3" opacity=".55"/>))}
      {[[140,150],[300,140],[430,165],[230,180]].map(([x,y],i)=>(
        <g key={i}><circle cx={x} cy={y} r="7" fill={i===1?'#C94D3D':'#FFFFFF'} stroke="#0B2E22" strokeWidth="2"/><text x={x} y={y-11} fontSize="11" fontWeight="800" fill="#fff" textAnchor="middle" stroke="#0B2E22" strokeWidth="3" paintOrder="stroke">{['A1','B2','C3','D4'][i]}</text></g>
      ))}
      <text x="14" y="206" fontSize="13" fontWeight="700" fill="#fff">{label} — illustrative, not satellite imagery</text>
    </svg>
  );
}
