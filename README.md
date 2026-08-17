# Plantão Seguro

Projeto para suporte a plantão/home-care — normalização automatizada de passagens de plantão (PT-BR), API de backend e esqueleto de app Android.

Escopo inicial (MVP):
- Serviço REST POST /api/v1/handover/normalize que recebe texto livre em PT-BR e retorna:
  - structured: campos extraídos (paciente, sinais vitais, medicações, pendências, plano, critérios de escalonamento)
  - clinicalText: passagem padronizada em linguagem técnica PT-BR
- Parser rule-based + opção de reescrita por LLM (controle via variável de ambiente)
- UI Android (skeleton) que consome o endpoint

Observação sobre LLM: a opção de uso de LLM foi habilitada conforme solicitado; ela é opcional e controlada por USE_LLM=true e a variável OPENAI_API_KEY (ou outro provedor) no ambiente. Ao usar LLM com dados sensíveis, confirme conformidade com LGPD e acordos de processamento de dados.

Como executar o backend localmente:
1. Vá para a pasta backend
2. Copie `.env.example` para `.env` e ajuste as variáveis
3. npm install
4. npm start

Estrutura do repositório:
- backend/: código do serviço REST e parser
- mobile-android/: instruções e esqueleto para app Android (Kotlin)
- docs/: especificações e dicionários

Próximos passos que irei realizar quando você confirmar:
- Implementar UI Android que consome o endpoint e salva passagens (primeiro commit já criado)
- Ajustar/destinar hosting (Heroku/DigitalOcean) se desejar
- Receber exemplos reais anonimizados para calibrar parser

