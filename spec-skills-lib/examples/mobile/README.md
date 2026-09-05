# Example: Mobile

Exemplo de adocao para app mobile com React Native e BFF.

## Contexto
- Arquitetura: mobile + backend services
- Stack: React Native + Node.js
- Nivel: MVP/Production

## Como usar
1. Aplique `global-rules.override.yaml` no projeto alvo.
2. Mantenha specs separadas para app mobile e BFF.
3. Rode `bash tools/validate-local.sh`.

## Observabilidade (papel obrigatorio)
- Monitore crash rate, tempo de inicializacao e latencia de chamadas.
- Configure alertas para degradacao de UX e falhas de sincronizacao.
- Mantenha tracing entre app e BFF para diagnostico ponta a ponta.
