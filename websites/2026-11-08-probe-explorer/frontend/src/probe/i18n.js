// UI strings and chapter titles. English is complete; Marathi and Hindi cover the interface, chapter titles
// and the key farmer-facing captions (translations to be checked by a native speaker before field use).
// Any string missing from a language falls back to English.
export const LANGS = { en: 'English', mr: 'मराठी', hi: 'हिंदी' };

const UI = {
  en: { explorer: 'Probe Explorer', play: 'Play', pause: 'Pause', settings: 'Settings', sections: 'Sections', panels: 'Panels', chapterCard: 'Chapter card', readingCard: 'Reading card', map: 'Field map', log: 'Event log', toasts: 'Toasts', captions: 'Captions', honesty: 'Honesty line', tags: 'Result tags', hideCosts: 'Hide costs / BOM', variant: 'Hardware', prototype: 'Prototype (today)', field: 'Field (ideal)', quality: 'Quality', language: 'Language', camera: 'Camera', follow: 'Follow', overview: 'Overview', free: 'Free', record: 'Record mode', copyLink: 'Copy link to this setup', all: 'All', none: 'None', events: 'Events', fieldMap: 'Field map', reset: 'Reset', speed: 'Speed', moisture: 'Moisture slider', realData: 'Load node log (CSV/JSON)', explode: 'Exploded view' },
  mr: { explorer: 'प्रोब एक्सप्लोरर', play: 'चालू करा', pause: 'थांबवा', settings: 'सेटिंग्ज', sections: 'विभाग', panels: 'पॅनेल', chapterCard: 'अध्याय कार्ड', readingCard: 'वाचन कार्ड', map: 'शेत नकाशा', log: 'घटना नोंद', toasts: 'सूचना', captions: 'मथळे', honesty: 'प्रामाणिक ओळ', tags: 'निकाल टॅग', hideCosts: 'किंमत लपवा', variant: 'हार्डवेअर', prototype: 'प्रोटोटाइप (आज)', field: 'फील्ड (आदर्श)', quality: 'गुणवत्ता', language: 'भाषा', camera: 'कॅमेरा', follow: 'अनुसरण', overview: 'आढावा', free: 'मुक्त', record: 'रेकॉर्ड मोड', copyLink: 'या सेटअपची लिंक कॉपी करा', all: 'सर्व', none: 'काहीही नाही', events: 'घटना', fieldMap: 'शेत नकाशा', reset: 'रीसेट', speed: 'वेग' },
  hi: { explorer: 'प्रोब एक्सप्लोरर', play: 'चलाएँ', pause: 'रोकें', settings: 'सेटिंग्स', sections: 'अनुभाग', panels: 'पैनल', chapterCard: 'अध्याय कार्ड', readingCard: 'रीडिंग कार्ड', map: 'खेत नक्शा', log: 'घटना लॉग', toasts: 'सूचनाएँ', captions: 'कैप्शन', honesty: 'ईमानदारी पंक्ति', tags: 'परिणाम टैग', hideCosts: 'लागत छिपाएँ', variant: 'हार्डवेयर', prototype: 'प्रोटोटाइप (आज)', field: 'फ़ील्ड (आदर्श)', quality: 'गुणवत्ता', language: 'भाषा', camera: 'कैमरा', follow: 'फ़ॉलो', overview: 'ओवरव्यू', free: 'मुक्त', record: 'रिकॉर्ड मोड', copyLink: 'इस सेटअप का लिंक कॉपी करें', all: 'सभी', none: 'कोई नहीं', events: 'घटनाएँ', fieldMap: 'खेत नक्शा', reset: 'रीसेट', speed: 'गति' },
};

const TITLES = {
  mr: { problem: 'समस्या', meet: 'प्रोबची ओळख', build: 'प्रिंट आणि जोडणी', corrode: 'गंज का लागत नाही', sense: 'हे कसे मोजते', guards: 'गार्ड रिंग आणि संदर्भ', install: 'बसवणी', cycle: 'एक AWD चक्र', grid: 'नोड्स बोलतात', space: 'जमीन आणि अवकाश', calib: 'कॅलिब्रेशन', lies: 'वाचन चुकते तेव्हा', prints: 'तीन प्रिंट्स', node: 'नोडच्या आत', farm: 'शेताचे जाळे', sar: 'जमीन + अवकाश, खरा डेटा', split: 'बॅकएंड + शेतकरी', impact: 'परिणाम आणि विस्तार' },
  hi: { problem: 'समस्या', meet: 'प्रोब से मिलिए', build: 'प्रिंट और असेंबली', corrode: 'जंग क्यों नहीं लगती', sense: 'यह कैसे मापता है', guards: 'गार्ड रिंग और संदर्भ', install: 'लगाना', cycle: 'एक AWD चक्र', grid: 'नोड्स की बातचीत', space: 'ज़मीन और अंतरिक्ष', calib: 'कैलिब्रेशन', lies: 'जब रीडिंग गलत हो', prints: 'तीन प्रिंट', node: 'नोड के अंदर', farm: 'खेत का ग्रिड', sar: 'ज़मीन + अंतरिक्ष, असली डेटा', split: 'बैकएंड + किसान', impact: 'प्रभाव और विस्तार' },
};

// Key captions (farmer-facing beats). Keyed by the English text.
const CAPTIONS = {
  mr: {
    'The AWD rule from IRRI: re-irrigate when the water is 15 cm below the soil surface. That is the depth the probe has to see.': 'IRRI चा AWD नियम: पाणी मातीच्या पृष्ठभागाखाली १५ सेमी गेल्यावर पुन्हा पाणी द्या. प्रोबला हीच खोली पाहायची आहे.',
    'Alternate wetting and drying (AWD) lets the water drop below the surface, then floods the field again.': 'AWD मध्ये पाणी पृष्ठभागाखाली जाऊ दिले जाते, नंतर शेत पुन्हा भरले जाते.',
    'The gateway sends an SMS in Marathi: check the bund near B2; plot A has reached −15 cm.': 'गेटवे मराठीत SMS पाठवतो: B2 जवळचा बांध तपासा; शेत A −१५ सेमीवर पोहोचले आहे.',
    'Right: the farmer’s phone. A Marathi SMS arrives; one tap opens the AGRI-GRID app with today’s status, the plan and the next irrigation time.': 'उजवीकडे: शेतकऱ्याचा फोन. मराठी SMS येतो; एका टॅपमध्ये AGRI-GRID ॲप उघडते: आजची स्थिती, नियोजन आणि पुढील पाण्याची वेळ.',
  },
  hi: {
    'The AWD rule from IRRI: re-irrigate when the water is 15 cm below the soil surface. That is the depth the probe has to see.': 'IRRI का AWD नियम: पानी मिट्टी की सतह से 15 सेमी नीचे जाने पर फिर से सिंचाई करें। प्रोब को यही गहराई देखनी है।',
    'Alternate wetting and drying (AWD) lets the water drop below the surface, then floods the field again.': 'AWD में पानी को सतह से नीचे जाने दिया जाता है, फिर खेत दोबारा भरा जाता है।',
  },
};

export function makeT(lang) {
  const ui = { ...UI.en, ...(UI[lang] || {}) };
  return {
    ui: (k) => ui[k] || k,
    title: (ch) => (TITLES[lang] && TITLES[lang][ch.id]) || ch.title,
    cap: (s) => (s && CAPTIONS[lang] && CAPTIONS[lang][s]) || s,
  };
}
