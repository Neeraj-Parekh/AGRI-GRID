// Centralized deterministic demo data layer — seed=42
// Cluster -> Farms -> Fields -> Zones -> Nodes -> Measurements -> Alerts -> Evidence
export const CLUSTER = { id:'pune-pilot', name:'Pune Pilot Cluster', location:'Pune, Maharashtra', season:'Kharif 2026', crop:'Paddy Season', weather:{ temp:28, cond:'Partly cloudy' }, lastUpdated:'15 Sep 2026, 14:30' };

// Field polygons around Pune (demo coords, SIMULATED)
const P = (lat,lng)=>[lat,lng];
export const FIELDS = [
  { id:'AGRI-001', crop:'Paddy', area:2.4, stage:'Vegetative', nodes:4, awd:'Cycle 3 (Day 12)', state:'watch', health:82, poly:[P(18.531,73.851),P(18.533,73.858),P(18.528,73.860),P(18.526,73.853)], water:5.2, moisture:62, temp:28.4, updated:'15 Sep 2026, 14:30' },
  { id:'AGRI-002', crop:'Paddy', area:3.1, stage:'Tillering', nodes:4, awd:'Cycle 2 (Day 8)', state:'normal', health:91, poly:[P(18.534,73.859),P(18.537,73.866),P(18.532,73.868),P(18.530,73.861)], water:7.8, moisture:71, temp:27.9, updated:'15 Sep 2026, 14:20' },
  { id:'AGRI-003', crop:'Paddy', area:1.8, stage:'Vegetative', nodes:3, awd:'Cycle 3 (Day 10)', state:'watch', health:74, poly:[P(18.526,73.844),P(18.529,73.850),P(18.524,73.851),P(18.522,73.845)], water:3.1, moisture:48, temp:29.6, updated:'15 Sep 2026, 13:55' },
  { id:'AGRI-004', crop:'Sugarcane', area:4.2, stage:'Grand growth', nodes:5, awd:'N/A', state:'normal', health:88, poly:[P(18.535,73.845),P(18.539,73.852),P(18.534,73.855),P(18.531,73.848)], water:8.4, moisture:68, temp:27.2, updated:'15 Sep 2026, 14:10' },
  { id:'AGRI-005', crop:'Paddy', area:2.0, stage:'Panicle', nodes:4, awd:'Cycle 4 (Day 5)', state:'normal', health:90, poly:[P(18.520,73.856),P(18.523,73.862),P(18.519,73.864),P(18.517,73.858)], water:6.9, moisture:66, temp:28.1, updated:'15 Sep 2026, 14:05' },
  { id:'AGRI-006', crop:'Paddy', area:2.9, stage:'Vegetative', nodes:6, awd:'Cycle 1 (Day 3)', state:'alert', health:58, poly:[P(18.540,73.856),P(18.543,73.862),P(18.538,73.865),P(18.536,73.858)], water:1.4, moisture:36, temp:31.2, updated:'15 Sep 2026, 14:28' },
  { id:'AGRI-007', crop:'Vegetables', area:1.2, stage:'Flowering', nodes:3, awd:'N/A', state:'normal', health:86, poly:[P(18.524,73.866),P(18.527,73.872),P(18.522,73.874),P(18.520,73.868)], water:6.1, moisture:64, temp:28.0, updated:'15 Sep 2026, 13:40' },
  { id:'AGRI-008', crop:'Paddy', area:3.6, stage:'Tillering', nodes:5, awd:'Cycle 2 (Day 11)', state:'normal', health:89, poly:[P(18.528,73.836),P(18.532,73.842),P(18.527,73.844),P(18.524,73.838)], water:7.2, moisture:69, temp:27.5, updated:'15 Sep 2026, 14:15' },
];

export const NODES = [
  { id:'A1', fieldId:'AGRI-001', zone:'B1', lat:18.5295, lng:73.8550, water:6.8, moisture:68, temp:28.0, batt:87, rssi:-71, status:'normal', updated:'14:30' },
  { id:'B2', fieldId:'AGRI-001', zone:'B2', lat:18.5285, lng:73.8570, water:2.4, moisture:44, temp:30.1, batt:76, rssi:-78, status:'alert', updated:'14:30' },
  { id:'C3', fieldId:'AGRI-001', zone:'B3', lat:18.5275, lng:73.8545, water:5.9, moisture:63, temp:28.3, batt:91, rssi:-69, status:'normal', updated:'14:29' },
  { id:'D4', fieldId:'AGRI-001', zone:'B4', lat:18.5300, lng:73.8530, water:5.7, moisture:61, temp:28.5, batt:82, rssi:-73, status:'normal', updated:'14:30' },
  { id:'A1', fieldId:'AGRI-002', zone:'A1', lat:18.5335, lng:73.8630, water:7.8, moisture:71, temp:27.9, batt:88, rssi:-70, status:'normal', updated:'14:20' },
  { id:'C1', fieldId:'AGRI-003', zone:'C1', lat:18.5260, lng:73.8475, water:3.1, moisture:48, temp:29.6, batt:69, rssi:-81, status:'watch', updated:'13:55' },
];

// deterministic 48-point series, seed=42 style (no Math.random at render)
function series(base, drift, amp){
  const out=[]; let v=base;
  for(let i=0;i<48;i++){ v += drift + Math.sin(i/5)*amp*0.18; out.push({ t:`${String(Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`, v:+v.toFixed(2) }); }
  return out;
}
export const TELEMETRY = {
  'AGRI-001:B2:water': (()=>{ const s=series(6.4,-0.085,0.5); s[46].v=2.6; s[47].v=2.4; return s; })(),
  'AGRI-001:B2:moisture': series(66,-0.45,1.2),
  'AGRI-001:B2:temp': series(27.6,0.05,0.6),
  'AGRI-001:avg:water': series(6.2,-0.02,0.4),
};

export const ALERTS = [
  { id:'AL-101', sev:'crit', title:'Low water level detected', field:'AGRI-001', node:'Node B2', ago:'2 hours ago', why:'Water dropped 4.0 cm in 30 min — rate 8x normal AWD drying. Check bund leak or drain.', time:'15 Sep 2026, 12:32' },
  { id:'AL-102', sev:'warn', title:'Unusual drying pattern', field:'AGRI-003', node:'Zone C1', ago:'5 hours ago', why:'Zone C1 drying faster than neighbours B1/B3. Possible uneven levelling.', time:'15 Sep 2026, 09:15' },
  { id:'AL-103', sev:'info', title:'High temperature', field:'AGRI-002', node:'Node A1', ago:'1 day ago', why:'31.4°C spike at noon, recovered. No irrigation action needed.', time:'14 Sep 2026, 13:00' },
  { id:'AL-104', sev:'warn', title:'Sensor communication gap', field:'AGRI-006', node:'Node D2', ago:'3 hours ago', why:'No packets 45 min. Likely LoRa RSSI dip (-89 dBm). Gateway retry scheduled.', time:'15 Sep 2026, 11:20' },
];

export const EVIDENCE = [
  { id:'EV-2026-0142', field:'AGRI-001', zone:'B2', time:'15 Sep 2026, 12:30', obs:'Water state', ground:'Water level 2.4 cm (Node B2)', space:'SAR water extent LOW (simulated Sentinel-1)', context:'No rainfall 72h, 31°C max (simulated IMD)', consistency:'Consistent', confidence:86, review:'Auto-validated', lineage:['node-B2:12:30','sar-sim:12:32','imd-sim:12:00'] },
  { id:'EV-2026-0143', field:'AGRI-001', zone:'B1', time:'15 Sep 2026, 12:30', obs:'Water state', ground:'Water level 6.8 cm (Node A1)', space:'SAR water extent HIGH (simulated)', context:'No rainfall 72h', consistency:'Consistent', confidence:91, review:'Auto-validated', lineage:['node-A1:12:30','sar-sim:12:32','imd-sim:12:00'] },
  { id:'EV-2026-0139', field:'AGRI-003', zone:'C1', time:'15 Sep 2026, 09:15', obs:'Water state', ground:'Water level 6.5 cm (Node C1) — HIGH', space:'SAR water extent LOW (simulated)', context:'Dry, no rain (simulated)', consistency:'Discrepancy', confidence:41, review:'Review required', lineage:['node-C1:09:15','sar-sim:09:18','imd-sim:09:00'] },
];

export const INTEL = {
  detect:[{ zone:'B2', text:'Water level dropped 4 cm in 30 min.', score:0.92, time:'12:32', src:'Node B2 + neighbours B1/B3/B4' }],
  infer:[{ text:'Zones B2–B4 show accelerated drying relative to neighbouring zones.', area:'0.6 ha', conf:78 }],
  predict:[{ title:'Irrigation requirement estimate (PROTOTYPE)', text:'At current drying rate B2 reaches AWD stress threshold (~0 cm) in ~14 h. Suggested inspection before Day-13 irrigation.', conf:64 }],
};

export const KPIS = { normalPct:78, attention:2, awd:'6 / 8', nodes:48 };
