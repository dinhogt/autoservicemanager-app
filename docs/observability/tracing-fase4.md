# Tracing, logs e correlação — Fase 4

## Contexto propagado

| Campo | Uso |
|---|---|
| `correlationId` | uma jornada ponta a ponta |
| `sagaId` | instância persistida pelo OS |
| `messageId` | idempotência de comando/evento |
| `causationId` | mensagem que causou a atual |
| `aggregateId` | ordem de serviço |
| `traceparent` / X-Ray header | ligação de spans |

O edge aceita/gera correlação; o OS a inclui no envelope. Consumidores criam
span do processamento e ligam o contexto da mensagem, pois SQS/SNS quebram a
pilha síncrona. Chamadas ao Mercado Pago são subsegments externos sem token ou
payload de pagamento.

## Logs JSON

Campos mínimos: `timestamp`, `level`, `service`, `environment`, `event`,
`correlationId`, `sagaId`, `messageId`, `aggregateId`, `durationMs` e
`outcome`. Erros incluem classe/código e stack controlada.

Redação obrigatória: `authorization`, token Mercado Pago, segredo de webhook,
CPF/CNPJ, e-mail, placas quando não necessárias, senha e connection string.

## Spans esperados no caminho feliz

`APIGW → OS:create → SQS:diagnosis.start → Execution:consume →
SNS:diagnosis.completed → OS:consume → SQS:payment.authorize →
Billing:consume → MercadoPago → Billing:webhook → SNS:payment.authorized →
OS:consume → SQS:execution.start → Execution:consume`.

## Validação

1. Executar cenário BDD completo.
2. Pesquisar logs pelo `correlationId`.
3. Confirmar spans dos três serviços e da dependência externa.
4. Confirmar métricas de Saga, fila e pagamento.
5. Verificar amostra de logs com scanner de segredos/PII.

## Implementação entregue

- O envelope `1.0` mantém compatibilidade e passa `sagaId` opcional junto de
  `correlationId`, `messageId`, `causationId` e `aggregateId`.
- Esses identificadores também seguem como attributes de SQS/SNS. Cada
  consumer restaura o contexto com `AsyncLocalStorage` antes de executar a
  regra de negócio.
- A quebra assíncrona é ligada explicitamente pelo envelope e por
  `occurredAt`; `QueueMessageAge` mede o tempo entre criação e consumo. O
  serviço OS mantém o bootstrap X-Ray já existente para o trecho HTTP.
- Logs operacionais são JSON/EMF e incluem sempre `service`, `environment`,
  `event`, `correlationId`, `sagaId`, `messageId`, `aggregateId`,
  `durationMs` e `outcome` (usando `system`/`none` fora de uma mensagem).
