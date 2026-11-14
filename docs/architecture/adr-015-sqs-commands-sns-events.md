# ADR-015 — SQS para comandos e SNS para eventos

| Campo | Valor |
|---|---|
| Status | Aceito — Fase 4 |
| Efeito | Substitui parcialmente ADR-011 entre serviços |
| Relacionados | ADR-006, ADR-011, ADR-014, RFC-007 |

## Contexto

REST da Fase 3 cria acoplamento temporal inadequado para etapas longas e compensáveis. Comandos têm um destino; eventos podem interessar a vários consumidores.

## Decisão

- Um comando por fila SQS do consumidor, com DLQ, retry limitado, visibility timeout superior ao processamento e long polling.
- Eventos de domínio publicados em tópicos SNS e entregues a filas SQS inscritas, com filtro quando aplicável.
- REST permanece no edge e em consultas pontuais; mudanças de estado entre OS/Billing/Execution usam mensagens.
- Contratos versionados em `packages/domain-shared`; evolução aditiva e consumidores tolerantes a campos extras.
- Entrega é **at-least-once**: deduplicação por `messageId`/chave de negócio e inbox com retenção.

## Envelope mínimo

`messageId`, `type`, `version`, `occurredAt`, `correlationId`, `sagaId`, `causationId`, `producer` e `payload` mínimo sem PII desnecessária.

## Alternativas

| Opção | Decisão |
|---|---|
| REST entre serviços | Rejeitada para comandos de processo; mantém consultas excepcionais. |
| Kafka/MSK | Rejeitada por custo/complexidade de demo. |
| SQS para eventos sem fan-out | Rejeitada por acoplar produtor a consumidores. |

## Consequências

Ordem global não é garantida. A implementação deve controlar ordem por Saga, alarmar DLQ e preservar correlação X-Ray/CloudWatch.
