const fetch = require('node-fetch');

async function normalizeWithLLM(originalText, structured){
  const apiKey = process.env.OPENAI_API_KEY;
  if(!apiKey) throw new Error('OPENAI_API_KEY not configured');

  // Exemplo genérico: usa OpenAI completions para reescrever em Português técnico.
  // ATENÇÃO: enviar PHI para provedores externos exige conformidade com LGPD.

  const prompt = `Transforme a seguinte passagem de plantão escrita de forma coloquial em uma passagem de plantão técnica, objetiva e padronizada (PT-BR)."\n\nTexto:\n${originalText}\n\nCampos extraídos:\n${JSON.stringify(structured, null, 2)}\n\nSaída:`;

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600
    })
  });
  if(!resp.ok) throw new Error('LLM request failed: '+resp.statusText);
  const j = await resp.json();
  const content = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  return { clinicalText: content };
}

module.exports = { normalizeWithLLM };
