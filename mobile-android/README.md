# Esqueleto Android - Plantão Seguro

Este diretório contém instruções e um esqueleto inicial para o app Android (Kotlin + Jetpack Compose). O app consumirá o endpoint /api/v1/handover/normalize do backend.

Arquitetura recomendada:
- MVVM, Retrofit para chamadas HTTP, Room para storage local, Hilt para DI.

Endpoints esperados:
- POST /api/v1/handover/normalize

Próximos passos (mobile):
- Criar projeto Android Studio com pacote com.github.wesleygoulart05.plantaoseguro
- Implementar Tela HandoverScreen com campo de texto, botão "Padronizar" e preview do resultado

