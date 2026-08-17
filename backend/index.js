require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { parseHandover } = require('./parser/parseHandover');
const { normalizeWithLLM } = require('./llm/llmClient');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '200kb' }));

app.post('/api/v1/handover/normalize', async (req, res) => {
  try {
    const { text, patientId, fromUserId, toUserId } = req.body;
    if (!text || !fromUserId) return res.status(400).json({ error: 'text and fromUserId are required' });

    // Rule-based parse
    const structured = parseHandover(text, { patientId });

    // clinicalText from template
    let clinicalText = structured.clinicalText;

    // Optional: re-write / improve with LLM if enabled
    const useLLM = process.env.USE_LLM === 'true';
    if (useLLM && process.env.OPENAI_API_KEY) {
      try {
        const llmResult = await normalizeWithLLM(text, structured);
        if (llmResult && llmResult.clinicalText) clinicalText = llmResult.clinicalText;
      } catch (err) {
        console.error('LLM rewrite failed:', err.message);
        // proceed with rule-based output
      }
    }

    return res.json({ structured, clinicalText });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Plantao Seguro backend running on port ${PORT}`));
