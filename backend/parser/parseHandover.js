const medsDict = require('../dictionaries/meds_ptbr.json');

function findMeds(text){
  const found = [];
  const lower = text.toLowerCase();
  for(const m of medsDict){
    if(lower.includes(m.name.toLowerCase())){
      found.push(m);
    }
  }
  return found;
}

function extractVitals(text){
  const vitals = [];
  // temperatura
  const tempRegex = /(temperatura|temp|t)[:\s]*([0-9]{2}(?:[\.,][0-9])?)\s?°?\s?(c|C)?/i;
  const tempMatch = text.match(tempRegex);
  if(tempMatch){
    vitals.push({ type: 'temperature', value: tempMatch[2].replace(',', '.'), unit: 'C' });
  } else {
    // try bare number with °C
    const t2 = text.match(/([0-9]{2}(?:[\.,][0-9])?)\s?°\s?c/i);
    if(t2) vitals.push({ type:'temperature', value: t2[1].replace(',', '.'), unit:'C' });
  }

  // pressão arterial
  const bp = text.match(/(pa|press[aã]o|pressão arterial)[:\s]*([0-9]{2,3})\/?([0-9]{2,3})/i);
  const bpAlt = text.match(/(\b)([0-9]{2,3})\/([0-9]{2,3})(\b)/);
  if(bp) vitals.push({ type: 'bp', systolic: parseInt(bp[2],10), diastolic: parseInt(bp[3],10) });
  else if(bpAlt) vitals.push({ type:'bp', systolic: parseInt(bpAlt[2],10), diastolic: parseInt(bpAlt[3],10) });

  // FC
  const hr = text.match(/(fc|bpm|batimentos)[:\s]*([0-9]{2,3})/i);
  if(hr) vitals.push({ type:'hr', value: parseInt(hr[2],10), unit:'bpm' });

  // SpO2 / saturação
  const spo2 = text.match(/(saturação|spO2|spo2|sat[oó]2)[:\s]*([0-9]{2,3})\%?/i);
  if(spo2) vitals.push({ type:'spo2', value: parseInt(spo2[2],10), unit:'%' });

  // glicemia
  const gly = text.match(/(glicemia|glic[ée]mia)[:\s]*([0-9]{2,3})\s?mg\/?dl?/i);
  if(gly) vitals.push({ type:'glicemia', value: parseInt(gly[2],10), unit:'mg/dL' });

  return vitals;
}

function extractAllergies(text){
  const allergies = [];
  const m = text.match(/alergia[s]?\s*[:\-]?\s*([a-zA-Z0-9, \-]+)/i);
  if(m){
    const list = m[1].split(/,| e |;|\band\b/);
    for(const a of list) allergies.push(a.trim());
  }
  return allergies;
}

function extractDevices(text){
  const devices = [];
  const terms = ['sonda vesical','cateter','ox[ií]metro','oxigenoterapia','bomba de infus[oõ]es','sonda'];
  const lower = text.toLowerCase();
  for(const t of terms){
    if(lower.includes(t)) devices.push(t);
  }
  return devices;
}

function buildClinicalText(struct){
  const lines = [];
  if(struct.header) lines.push(`Entregador: ${struct.header.from || '---'}. Receptor: ${struct.header.to || '---'}. Data/Hora: ${struct.header.datetime || '---'}.`);
  if(struct.summary) lines.push(`Resumo clínico: ${struct.summary}`);
  if(struct.vitals && struct.vitals.length){
    const vs = struct.vitals.map(v => {
      if(v.type==='temperature') return `Temperatura: ${v.value} ${v.unit}`;
      if(v.type==='bp') return `PA: ${v.systolic}/${v.diastolic} mmHg`;
      if(v.type==='hr') return `FC: ${v.value} bpm`;
      if(v.type==='spo2') return `SpO2: ${v.value}%`;
      if(v.type==='glicemia') return `Glicemia capilar: ${v.value} ${v.unit}`;
      return '';
    }).join('; ');
    lines.push(vs + '.');
  }
  if(struct.medications && struct.medications.length){
    const meds = struct.medications.map(m=> `${m.name}${m.dose? ' - '+m.dose:''}${m.freq? ' - '+m.freq: ''}`);
    lines.push('Medicação em uso: ' + meds.join('; ') + '.');
  }
  if(struct.devices && struct.devices.length) lines.push('Dispositivos: ' + struct.devices.join('; ') + '.');
  if(struct.pending && struct.pending.length) lines.push('Pendências: ' + struct.pending.join('; ') + '.');
  if(struct.plan && struct.plan.length) lines.push('Plano imediato: ' + struct.plan.join('; ') + '.');
  return lines.join('\n');
}

function parseHandover(text, opts={}){
  const structured = {};
  structured.header = { from: null, to: null, datetime: new Date().toISOString() };
  structured.patient = { id: opts.patientId || null };
  // naive summary: first sentence
  const firstSentence = text.split(/[\.\n]/)[0];
  structured.summary = firstSentence.trim();

  structured.vitals = extractVitals(text);
  structured.medications = findMeds(text);
  structured.allergies = extractAllergies(text);
  structured.devices = extractDevices(text);

  // pendências heurística
  const pending = [];
  const pendingMatch = text.match(/pendente[s]?[:\-]?\s*([\s\S]+)/i);
  if(pendingMatch){
    pending.push(pendingMatch[1].trim().split(/[\.\n]/)[0]);
  }
  // procurar "revisão" "coleta" "exame"
  const reTerms = ['revisar', 'revisão', 'coleta', 'solicitado', 'agendado', 'exame', 'radiografia', 'rx', 'curativo'];
  for(const t of reTerms){
    const idx = text.toLowerCase().indexOf(t);
    if(idx>-1){
      const snippet = text.substring(idx, Math.min(text.length, idx+80)).split(/[\.\n]/)[0];
      if(!pending.includes(snippet)) pending.push(snippet.trim());
    }
  }
  structured.pending = pending;

  // plan heuristics
  const plan = [];
  if(text.toLowerCase().includes('monitorar')) plan.push('Monitorar sinais vitais conforme orientação');
  if(text.toLowerCase().includes('manter') && text.toLowerCase().includes('oxigênio')) plan.push('Manter oxigenoterapia conforme prescrição');
  structured.plan = plan;

  // escalation criteria (defaults)
  structured.escalationCriteria = ['Temp >= 38.5°C','SpO2 < 92%','PAS < 90 mmHg','FC > 130 bpm'];

  structured.clinicalText = buildClinicalText(structured);
  return structured;
}

module.exports = { parseHandover };
