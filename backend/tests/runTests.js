#!/usr/bin/env node
const assert = require('assert');
const { parseHandover } = require('../parser/parseHandover');

function approxEqual(a,b){
  return JSON.stringify(a) === JSON.stringify(b);
}

const tests = [];

tests.push({
  name: 'Test temp and med extraction',
  text: 'Pac. João, 78 anos, ficou com febre ontem à noite, deu dipirona e abaixou. Enoxaparina 40 mg SC 1x/dia. Glicemia 250 mg/dL.' ,
  expect: {
    vitals: [{ type:'temperature' } , { type:'glicemia' }],
    medications: [{ name: 'Enoxaparina' }]
  }
});

tests.push({
  name: 'Test bp and spo2 extraction',
  text: 'Maria, PA 80/50, SpO2 88% sem O2, sonda vesical presente.',
  expect: { vitals: [{ type:'bp' }, { type:'spo2' }], devices: ['sonda vesical'] }
});

let failed = 0;
for(const t of tests){
  const out = parseHandover(t.text, {});
  try{
    // check types present
    for(const v of t.expect.vitals || []){
      if(!out.vitals.find(x=> x.type===v.type)) throw new Error('missing vital '+v.type);
    }
    for(const m of (t.expect.medications||[])){
      if(!out.medications.find(x=> x.name.toLowerCase().includes(m.name.toLowerCase()))) throw new Error('missing med '+m.name);
    }
    for(const d of (t.expect.devices||[])){
      if(!out.devices.find(x=> x.toLowerCase().includes(d.toLowerCase()))) throw new Error('missing device '+d);
    }
    console.log('[OK] '+t.name);
  }catch(e){
    failed++;
    console.error('[FAIL] '+t.name+' -> '+e.message);
  }
}
process.exit(failed>0?1:0);
