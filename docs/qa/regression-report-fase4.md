# Relatório de regressão — Fase 4

## Baseline preservada

Os fluxos F1–F7 da Fase 3 permanecem cobertos pela suíte do OS Service. Auth
CPF (F8) permanece no Lambda. A mudança adiciona F9–F12 sem compartilhar banco
entre serviços.

## Regressão executada

| Área | Resultado |
|---|---|
| Ciclo e regras de status da OS | PASS |
| Rejeição de orçamento e notificações | PASS |
| Webhook/guards/RBAC | PASS |
| CPF/CNPJ/placa | PASS |
| Métricas de execução | PASS |
| Contratos versionados | PASS |
| Saga e quatro classes de compensação | PASS |
| Pagamento/refund com mock Mercado Pago | PASS |
| Idempotência | PASS |
| Build dos quatro deployables | PASS |

## Evidência e2e

Comando:

```sh
yarn test:phase4
```

Resultado observado em 2026-09-22:

```text
6 scenarios (6 passed)
42 steps (42 passed)
```

O runner remove volumes antes do teste, aguarda MySQL/LocalStack/mock, aplica
migrations, semeia seis OSs, inicia OS/Billing/Execution, executa Cucumber e
remove a stack ao final. Isso evita falso positivo causado pela saída normal
dos containers one-shot de migration/seed.

## Riscos residuais

1. SonarCloud depende de token e projeto remoto.
2. Branch protection dos novos remotes só pode ser aplicada após publicação.
3. Smoke EKS/CloudWatch/X-Ray depende do apply AWS autorizado.
