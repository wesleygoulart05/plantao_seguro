# Especificação do endpoint /api/v1/handover/normalize

Request:
POST /api/v1/handover/normalize
Content-Type: application/json

Body:
{
  "text": "texto livre da passagem...",
  "patientId": "p123",
  "fromUserId": "u123",
  "toUserId": "u456"
}

Response:
200 OK
{
  "structured": { /* campos extraídos */ },
  "clinicalText": "Texto padronizado PT-BR"
}

Dicionários iniciais:
- backend/dictionaries/meds_ptbr.json

Notas sobre LLM:
- Para ativar reescrita por LLM, configurar USE_LLM=true e OPENAI_API_KEY no .env.
- Enviar dados sensíveis para provedores externos requer avaliação legal/contratual.
