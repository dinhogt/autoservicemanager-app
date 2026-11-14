# ADR-016 — DynamoDB para Billing e Execution

| Campo | Valor |
|---|---|
| Status | Aceito — Fase 4 |
| Relacionados | ADR-010, ADR-013, ADR-018 |

## Contexto

A Fase 4 exige uso de SQL e NoSQL. Billing e Execution têm acesso por chave, estado agregado e idempotência; não necessitam joins com o modelo relacional do OS.

## Decisão

- Billing usa tabela DynamoDB própria para cobrança, status do provedor, idempotência e referências de refund.
- Execution usa tabela própria para work items de diagnóstico/reparo, estado e tentativas.
- Capacidade **on-demand**, criptografia AWS gerenciada, PITR nos ambientes persistentes e TTL apenas para registros técnicos descartáveis.
- Chaves e GSIs são desenhados a partir de access patterns; scan não integra caminho crítico.
- Dados do OS e `SagaInstance` permanecem no RDS MySQL.

## Clarificação ADR-010

MongoDB continua descontinuado para auditoria do OS. Esta decisão introduz DynamoDB como armazenamento operacional de novos bounded contexts e não reabre a decisão sobre Mongo.

## Alternativas

MySQL compartilhado foi rejeitado por acoplamento. RDS por serviço foi rejeitado por custo e por não demonstrar NoSQL. Tabela DynamoDB compartilhada foi rejeitada por ownership e IAM.

## Consequências

Consultas cruzadas usam APIs/eventos e projeções, nunca joins entre bancos. Modelagem, retenção, backup e alarmes são independentes por serviço.
