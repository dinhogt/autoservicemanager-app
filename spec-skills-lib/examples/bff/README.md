# Example: BFF

Exemplo de adocao para Backends For Frontends (BFFs) com contratos por canal.

## Contexto
- Arquitetura: bff per experience
- Stack: Node.js + React/React Native clients
- Nivel: Production

## Como usar
1. Aplique `global-rules.override.yaml`.
2. Defina boundaries por canal (`web-bff`, `mobile-bff`).
3. Garanta `ObservabilitySpec` para cada BFF.

## Observabilidade (papel obrigatorio)
- Dashboard por BFF com sucesso/erro por endpoint.
- Alertas por degradacao de dependencias downstream.
- Correlacao de request id entre cliente, BFF e servicos de dominio.
