# RFC-007 — Contratos SQS/SNS

| Campo | Valor |
|---|---|
| Status | Aceito para plataforma Fase 4 |
| ADR | ADR-015 |

## Topologia

- Filas de comando separadas por serviço/capacidade; produtor conhece a fila do destinatário.
- Tópicos SNS por domínio de eventos com subscriptions SQS dos consumidores.
- Toda fila tem DLQ e redrive; ambiente faz parte do nome físico.

## Envelope

```json
{
  "messageId": "uuid",
  "type": "billing.payment.confirmed",
  "version": 1,
  "occurredAt": "ISO-8601",
  "correlationId": "uuid",
  "sagaId": "uuid",
  "causationId": "uuid",
  "producer": "billing-service",
  "payload": {}
}
```

Schemas ficam em `packages/domain-shared`, são validados em producer/consumer e seguem SemVer. Mudança incompatível cria nova versão de evento e janela de compatibilidade.

## Semântica operacional

- At-least-once; inbox/dedup por `messageId` e idempotência por chave de negócio.
- Ack/delete só após persistir efeito e evento/outbox.
- Erros transitórios retornam mensagem; erros permanentes são classificados e vão à DLQ.
- Consumers rejeitam versão desconhecida de forma observável.
- Payload mínimo; CPF/token/credencial e objeto completo do provedor são proibidos.

## Observabilidade

Logs e traces incluem IDs do envelope. Métricas: idade/profundidade, receive count, falhas por tipo, DLQ, latência de passo e Saga parada.

## Critérios

Contract tests, replay seguro, duplicidade, out-of-order, poison message, indisponibilidade SNS/SQS e propagação de correlação devem ser automatizados.
