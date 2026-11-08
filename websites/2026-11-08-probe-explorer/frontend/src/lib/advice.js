// One decision per field, plus the farmer SMS in the local language of the site.
// Translations are simple and should be checked by a native speaker before field use.

export function fieldDecision(field, nodes, weather) {
  const leak = nodes.find(n => n.fieldId === field.id && n.leak);
  const rain = weather?.rain3f ?? 0;
  const v = field.water != null ? `water ${field.water} cm` : `moisture ${field.moisture}%`;
  if (leak) return { key: 'leak', tone: 'alert', v, node: leak.id, title: `Check the bund near ${leak.id} today`, detail: `${leak.id} is draining far faster than the other nodes in ${field.id}. That pattern points to a bund breach, not normal drying.` };
  if (/Fallow|Land prep/.test(field.crop + field.stage)) return { key: 'ok', tone: 'ok', v, title: 'No crop in the field', detail: 'Field between seasons. Nodes keep logging soil moisture for the next sowing decision.' };
  if (field.state === 'alert') {
    if (rain >= 15) return { key: 'rain', tone: 'watch', v, rain, title: `Hold: ${rain} mm rain expected`, detail: `Field is at threshold, but ${rain} mm is forecast in the next 3 days. Re-check tomorrow morning.` };
    return { key: 'irrigate', tone: 'act', v, title: 'Irrigate today', detail: field.paddy ? `Water table ${field.water} cm: at or below the IRRI AWD trigger of −15 cm.` : `Only about ${Math.round(field.rel * 100)}% of plant-available water left in the root zone.` };
  }
  if (field.state === 'watch') {
    if (rain >= 10) return { key: 'rain', tone: 'ok', v, rain, title: `Don't irrigate: ${rain} mm rain coming`, detail: 'Forecast rain should refill the field before it reaches threshold.' };
    return { key: 'plan', tone: 'watch', v, title: 'Plan irrigation in 2–3 days', detail: field.paddy ? `Drying towards −15 cm. Letting it dry is what cuts methane, so wait until the trigger.` : 'Moisture falling; schedule water before stress sets in.' };
  }
  return { key: 'ok', tone: 'ok', v, title: 'No irrigation needed', detail: field.paddy && field.water != null && field.water < 0 ? 'Field is in a safe drying phase of AWD. Keep drying: it saves water and methane.' : 'Water and soil moisture are in the healthy range.' };
}

const T = {
  irrigate: { en: 'Field is dry ({v}). Irrigate today.', mr: 'शेत कोरडे आहे ({v}). आज पाणी द्या.', hi: 'खेत सूखा है ({v})। आज सिंचाई करें।', kn: 'ಹೊಲ ಒಣಗಿದೆ ({v}). ಇಂದು ನೀರು ಹಾಯಿಸಿ.', gu: 'ખેતર સૂકું છે ({v}). આજે પિયત આપો.' },
  leak: { en: 'Water dropping fast near node {n}. Check the bund today.', mr: 'नोड {n} जवळ पाणी वेगाने कमी होत आहे. आज बांध तपासा.', hi: 'नोड {n} के पास पानी तेज़ी से घट रहा है। आज मेड़ जाँचें।', kn: 'ನೋಡ್ {n} ಬಳಿ ನೀರು ವೇಗವಾಗಿ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ. ಇಂದು ಬದು ಪರಿಶೀಲಿಸಿ.', gu: 'નોડ {n} પાસે પાણી ઝડપથી ઘટે છે. આજે પાળ તપાસો.' },
  plan: { en: 'Drying ({v}). Plan to irrigate in 2-3 days.', mr: 'शेत सुकत आहे ({v}). २-३ दिवसांत पाणी देण्याची तयारी ठेवा.', hi: 'खेत सूख रहा है ({v})। 2-3 दिन में सिंचाई की तैयारी रखें।', kn: 'ಹೊಲ ಒಣಗುತ್ತಿದೆ ({v}). 2-3 ದಿನಗಳಲ್ಲಿ ನೀರು ಹಾಯಿಸಲು ಸಿದ್ಧರಾಗಿ.', gu: 'ખેતર સુકાઈ રહ્યું છે ({v}). 2-3 દિવસમાં પિયતની તૈયારી રાખો.' },
  rain: { en: '{r} mm rain expected. Do not irrigate yet.', mr: '{r} मिमी पाऊस अपेक्षित. अजून पाणी देऊ नका.', hi: '{r} मिमी बारिश की संभावना। अभी सिंचाई न करें।', kn: '{r} ಮಿ.ಮೀ ಮಳೆ ನಿರೀಕ್ಷೆ. ಈಗ ನೀರು ಹಾಯಿಸಬೇಡಿ.', gu: '{r} મિમી વરસાદની શક્યતા. હમણાં પિયત ન આપો.' },
  ok: { en: 'All normal ({v}). No irrigation needed.', mr: 'सर्व ठीक आहे ({v}). पाणी देण्याची गरज नाही.', hi: 'सब ठीक है ({v})। सिंचाई की ज़रूरत नहीं।', kn: 'ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ ({v}). ನೀರು ಹಾಯಿಸುವ ಅಗತ್ಯವಿಲ್ಲ.', gu: 'બધું બરાબર છે ({v}). પિયતની જરૂર નથી.' },
};
export const LANGS = { en: 'English', mr: 'मराठी', hi: 'हिंदी', kn: 'ಕನ್ನಡ', gu: 'ગુજરાતી' };
export const siteLang = s => ({ MH: 'mr', KA: 'kn', GJ: 'gu' }[s.stateCode] || 'hi');

export function smsText(fieldId, d, lang) {
  const t = (T[d.key] || T.ok)[lang] || T[d.key].en;
  return `AGRI-GRID ${fieldId}: ` + t.replace('{v}', d.v).replace('{n}', d.node || '').replace('{r}', d.rain ?? '');
}
