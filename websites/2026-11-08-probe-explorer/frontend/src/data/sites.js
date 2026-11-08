// Five real farming sites for the multi-farm demo. Coordinates are public (sources listed per site).
// "precision" says how exact the anchor is: 'campus' = the research farm itself, 'town' = town centre,
// with field boundaries loaded live from OpenStreetMap inside `radiusM`.
// Crop calendars drive the crop stage shown for "today", so the dashboard never shows paddy in
// the field months after harvest.

export const SITES = [
  {
    id: 'maval', code: 'MVL', name: 'Vadgaon Maval', short: 'Maval',
    district: 'Pune', state: 'Maharashtra', stateCode: 'MH',
    lat: 18.7486, lng: 73.641, precision: 'town', radiusM: 2500, zoom: 15,
    tagline: 'Indrayani paddy belt of the Sahyadri foothills',
    about: 'Home of the Agricultural Research Station, Vadgaon Maval (MPKV Rahuri, est. 1940s), which bred the popular Indrayani rice. Transplanted paddy under monsoon rain, our nearest pilot cluster to MITAOE.',
    calendar: [
      { crop: 'Paddy (Indrayani)', from: '06-25', to: '11-10', paddy: true, stages: ['Nursery', 'Transplanting', 'Tillering', 'Panicle initiation', 'Flowering', 'Grain filling', 'Maturity'] },
      { crop: 'Chickpea (rabi)', from: '11-11', to: '03-10', stages: ['Sowing', 'Vegetative', 'Flowering', 'Pod fill', 'Harvest'] },
    ],
    soilFallback: { clay: 36, sand: 30, silt: 34, soc: 14, ph: 6.2, bdod: 1.32, label: 'Lateritic clay loam (typical)' },
    sources: [
      { t: 'MPKV: ARS Vadgaon Maval', u: 'https://mpkv.ac.in/Research/ResearchSMZone' },
      { t: 'Vadgaon Maval (Wikipedia coordinates)', u: 'https://en.wikipedia.org/wiki/Vadgaon_Maval' },
    ],
  },
  {
    id: 'karjat', code: 'KJT', name: 'Karjat', short: 'Karjat',
    district: 'Raigad', state: 'Maharashtra', stateCode: 'MH',
    lat: 18.9167, lng: 73.33, precision: 'town', radiusM: 3000, zoom: 15,
    tagline: 'Konkan lowland rice, India’s first rice research station',
    about: 'Regional Agricultural Research Station Karjat (Dr. BSKKV, est. 14 Aug 1919) developed the Karjat series of rice varieties. Heavy-rainfall Konkan paddy on lateritic soils; irrigated summer rice after kharif.',
    calendar: [
      { crop: 'Paddy (Karjat-3)', from: '06-15', to: '10-31', paddy: true, stages: ['Nursery', 'Transplanting', 'Tillering', 'Panicle initiation', 'Flowering', 'Grain filling', 'Maturity'] },
      { crop: 'Field bean (val)', from: '11-01', to: '02-15', stages: ['Sowing', 'Vegetative', 'Flowering', 'Pod fill'] },
      { crop: 'Summer paddy', from: '02-16', to: '06-14', paddy: true, stages: ['Nursery', 'Transplanting', 'Tillering', 'Flowering', 'Grain filling', 'Maturity'] },
    ],
    soilFallback: { clay: 40, sand: 28, silt: 32, soc: 18, ph: 5.8, bdod: 1.28, label: 'Lateritic, acidic (typical)' },
    sources: [
      { t: 'Dr. BSKKV research stations', u: 'https://old.dbskkv.org/Research/Research_Stations_&_Organogram.html' },
      { t: 'The Better India: 100 years of RARS Karjat', u: 'https://thebetterindia.com/131542/rice-research-institute-karjat-maharashtra' },
    ],
  },
  {
    id: 'baramati', code: 'BRM', name: 'KVK Baramati', short: 'Baramati',
    district: 'Pune', state: 'Maharashtra', stateCode: 'MH',
    lat: 18.1439, lng: 74.5299, precision: 'campus', radiusM: 2000, zoom: 15,
    tagline: 'Sugarcane, where AI farming pilots are already running',
    about: 'Krishi Vigyan Kendra of the Agricultural Development Trust, Malegaon Khurd. Its "Farm of the Future" programme with Microsoft and Oxford uses satellite + sensor data for sugarcane irrigation decisions.',
    calendar: [
      { crop: 'Sugarcane (adsali)', from: '07-15', to: '01-14', wrapYears: 1, stages: ['Germination', 'Tillering', 'Grand growth', 'Grand growth', 'Maturity'] },
    ],
    soilFallback: { clay: 52, sand: 18, silt: 30, soc: 9, ph: 8.1, bdod: 1.38, label: 'Black cotton soil, vertisol (typical)' },
    sources: [
      { t: 'ADT Baramati: Farm Vibes (location link)', u: 'https://agridevelopmenttrustbaramati.org/micro.pdf' },
      { t: 'Punekar News: AI sugarcane at KVK Baramati', u: 'https://www.punekarnews.in/pune-indias-first-ai-driven-sugarcane-farming-experiment-succeeds-in-baramati/' },
    ],
  },
  {
    id: 'mandya', code: 'MDY', name: 'V.C. Farm, Mandya', short: 'Mandya',
    district: 'Mandya', state: 'Karnataka', stateCode: 'KA',
    lat: 12.5198, lng: 76.8673, precision: 'town', radiusM: 3000, zoom: 15,
    tagline: 'Cauvery-canal paddy and sugarcane, Sugar City',
    about: 'Visvesvaraya Canal Farm (est. 1931): Zonal Agricultural Research Station and AICRP rice centre, irrigated from the KRS dam. Mandya district grows ~90,000 ha of paddy (district contingency plan).',
    calendar: [
      { crop: 'Paddy (kharif)', from: '07-25', to: '12-20', paddy: true, stages: ['Nursery', 'Transplanting', 'Tillering', 'Panicle initiation', 'Flowering', 'Grain filling', 'Maturity'] },
      { crop: 'Ragi / pulses', from: '12-21', to: '04-15', stages: ['Sowing', 'Vegetative', 'Flowering', 'Harvest'] },
      { crop: 'Summer paddy', from: '04-16', to: '07-24', paddy: true, stages: ['Nursery', 'Transplanting', 'Tillering', 'Flowering', 'Maturity'] },
    ],
    soilFallback: { clay: 24, sand: 58, silt: 18, soc: 8, ph: 7.3, bdod: 1.45, label: 'Red loamy (typical)' },
    sources: [
      { t: 'UAS Bangalore: VC Farm Mandya', u: 'https://www.uasbangalore.edu.in/?p=6956' },
      { t: 'ICAR-CRIDA contingency plan, Mandya', u: 'https://www.icar-crida.res.in/CP/Karnataka/GKVK,%20Bangalore/KAR16-MANDYA%2031.03.2011.pdf' },
    ],
  },
  {
    id: 'anand', code: 'AND', name: 'AAU Anand', short: 'Anand',
    district: 'Anand', state: 'Gujarat', stateCode: 'GJ',
    lat: 22.5358, lng: 72.9747, precision: 'campus', radiusM: 2500, zoom: 15,
    tagline: 'Charotar plains: kharif paddy, then rabi wheat',
    about: 'Anand Agricultural University research farms in the fertile "goradu" soils of Charotar. Transplanted kharif paddy (GR varieties), followed by wheat, tobacco and fodder in rabi.',
    calendar: [
      { crop: 'Paddy (GR-11)', from: '07-01', to: '10-25', paddy: true, stages: ['Nursery', 'Transplanting', 'Tillering', 'Panicle initiation', 'Flowering', 'Grain filling', 'Maturity'] },
      { crop: 'Wheat (rabi)', from: '10-26', to: '03-20', stages: ['Land prep', 'Sowing', 'Crown root', 'Tillering', 'Jointing', 'Heading', 'Grain fill', 'Harvest'] },
      { crop: 'Summer fodder', from: '03-21', to: '06-30', stages: ['Sowing', 'Vegetative', 'Cutting'] },
    ],
    soilFallback: { clay: 12, sand: 68, silt: 20, soc: 5, ph: 7.9, bdod: 1.52, label: 'Goradu sandy loam (typical)' },
    sources: [
      { t: 'Anand Agricultural University (Wikipedia coordinates)', u: 'https://en.wikipedia.org/wiki/Anand_Agricultural_University' },
      { t: 'KVK contingency plan, Anand (paddy varieties)', u: 'https://kvk.icar.gov.in/' },
    ],
  },
];

export const siteById = id => SITES.find(s => s.id === id) || null;

// ---- crop calendar -> today's crop + stage ----
const md = s => { const [m, d] = s.split('-').map(Number); return { m, d }; };
function dayOfYear(date) { const s = Date.UTC(date.getFullYear(), 0, 1); return Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - s) / 864e5); }
function doyOf({ m, d }, year) { return dayOfYear(new Date(year, m - 1, d)); }

export function cropToday(site, date = new Date()) {
  const y = date.getFullYear(), today = dayOfYear(date);
  for (const c of site.calendar) {
    let a = doyOf(md(c.from), y), b = doyOf(md(c.to), y), t = today;
    if (b < a) { b += 365; if (t < a) t += 365; } // window wraps the new year
    if (t >= a && t <= b) {
      const f = (t - a) / Math.max(1, b - a);
      const stage = c.stages[Math.min(c.stages.length - 1, Math.floor(f * c.stages.length))];
      const sown = new Date(date.getTime() - (t - a) * 864e5);
      return { crop: c.crop, paddy: !!c.paddy, stage, progress: f, daysIn: t - a, daysLeft: b - t, sown };
    }
  }
  return { crop: 'Fallow', paddy: false, stage: 'Land preparation', progress: 0, daysIn: 0, daysLeft: 0, sown: date };
}

// Season label in the Indian convention.
export function seasonLabel(date = new Date()) {
  const m = date.getMonth() + 1, y = date.getFullYear();
  if (m >= 6 && m <= 10) return `Kharif ${y}`;
  if (m >= 11 || m <= 2) return `Rabi ${m >= 11 ? y : y - 1}-${String((m >= 11 ? y + 1 : y) % 100).padStart(2, '0')}`;
  return `Zaid ${y}`;
}
