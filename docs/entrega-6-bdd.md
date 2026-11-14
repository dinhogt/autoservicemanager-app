# Entrega 6 — Saga e BDD executável

O `SagaOrchestratorService` é o dono do ciclo distribuído. A criação de OS
preserva a API existente e, quando `SAGA_AUTO_START=true`, inicia a saga e
acrescenta ao retorno o vínculo `saga.id`, `saga.correlationId` e
`saga.status`. O compose da fase 4 também permite iniciar sagas pelo endpoint
interno para cenários reprodutíveis.

Eventos chegam pela fila `os-events` e pelo endpoint
`POST /internal/sagas/events`. Ambos passam pela mesma validação de envelope,
máquina de estados, idempotência por `messageId`, lock otimista e outbox.

## Execução local

```sh
yarn test:phase4
```

O comando sobe MySQL, LocalStack (SQS/SNS/DynamoDB), OS, Billing, Execution e
o mock do Mercado Pago. O container `bdd` executa
`features/ciclo-os-saga.feature`; o runner aguarda dependências, executa
migration/seed separadamente e propaga o código de saída real do Cucumber.

Validação local em 2026-09-22:

```text
6 scenarios (6 passed)
42 steps (42 passed)
```

Para validar apenas contratos e bindings:

```sh
yarn test
yarn test:cov
yarn test:bdd --dry-run
```
