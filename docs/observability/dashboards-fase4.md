# Dashboards — Fase 4

## Painel consolidado

Nome: `autoservicemanager-<env>-ops-fase4`.

| Jornada/sistema | Sinais |
|---|---|
| API Gateway | volume, p95/p99 e 4xx/5xx por rota |
| OS Service | OS criadas, transições inválidas, Saga iniciada/concluída/compensada e duração |
| Billing | orçamentos, pagamentos aprovados/rejeitados, latência Mercado Pago e refunds |
| Execution | diagnósticos, reparos, falhas, cancelamentos e duração |
| SQS/SNS | mensagens visíveis/em voo, idade da mais antiga, taxa de publicação e DLQ |
| EKS | CPU, memória, restarts, replicas disponíveis e readiness por deployment |

## Painéis por serviço

Cada serviço filtra `service`, `environment` e `correlationId` e mostra os
quatro golden signals: tráfego, erros, latência e saturação. Billing acrescenta
dependência Mercado Pago; OS acrescenta Saga; Execution acrescenta duração de
work items.

## Consultas Logs Insights

Saga completa:

```text
fields @timestamp, service, event, sagaId, messageId, correlationId, status
| filter correlationId = "<id>"
| sort @timestamp asc
```

Compensações:

```text
fields @timestamp, service, event, sagaId, reason
| filter event in ["saga_compensation_started", "refund_failed", "saga_compensated"]
| sort @timestamp desc
```

## Critério de validação

O cenário BDD deve produzir um trace e uma linha temporal consultáveis usando
um único `correlationId`. Métricas e logs não podem conter CPF completo, token,
credencial ou payload sensível do pagamento.

## Provisionamento entregue

O Terraform cria `autoservicemanager-<env>-ops-fase4` com:

- RPS, p95 e 5xx das rotas reais `billing` e `execution` do API Gateway;
- depth, idade e DLQ das duas filas de comando e da fila de eventos do OS;
- `SagaStarted`, `SagaStepDuration`, `SagaDuration` p95 e `SagaOutcome`;
- `PaymentOutcome`, latência/erros do Mercado Pago e `RefundFailed`;
- duração/outcome de Execution (diagnóstico pertence a este serviço);
- CPU/memória do namespace `autoservice` via Container Insights;
- consulta única por `correlationId`, `sagaId` e `messageId`.

As métricas EMF usam `AutoServiceManager/<environment>` e as dimensões
`Service` e `Service/Operation/Outcome`. Nenhum recurso de APM adicional foi
pressuposto.
