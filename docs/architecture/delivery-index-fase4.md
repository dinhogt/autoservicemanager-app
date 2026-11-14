# Índice de entrega — Tech Challenge Fase 4

## Repositórios

| Repositório | Responsabilidade | Banco |
|---|---|---|
| `autoservicemanager-app` | OS Service e orquestrador da Saga | RDS MySQL |
| `autoservicemanager-billing` | Orçamentos, Mercado Pago e reembolsos | DynamoDB Billing |
| `autoservicemanager-execution` | Diagnóstico, reparo e cancelamento | DynamoDB Execution |
| `autoservicemanager-auth-lambda` | Autenticação CPF e JWT RS256 | leitura restrita do RDS |
| `autoservicemanager-infra-db` | RDS e tabelas DynamoDB | Terraform |
| `autoservicemanager-infra-k8s` | EKS, API Gateway, SQS, SNS, IAM e observabilidade | Terraform |

## Evidências por requisito

| Exigência | Evidência canônica |
|---|---|
| Três microsserviços independentes | READMEs, Dockerfiles, manifests e pipelines dos repos app/billing/execution |
| Banco SQL e NoSQL por serviço | ADR-016, ADR-018 e `autoservicemanager-infra-db` |
| REST e mensageria | ADR-015, RFC-007 e Swagger de cada serviço |
| Saga com compensação | ADR-014, RFC-005 e `features/ciclo-os-saga.feature` |
| Mercado Pago | ADR-017, RFC-006 e Billing Service |
| Cobertura mínima | [coverage-evidence-fase4.md](../qa/coverage-evidence-fase4.md) + LCOV em `coverage-artifacts/` |
| BDD/e2e | feature Gherkin e ambiente `docker-compose.phase4.yml` |
| CI/CD Kubernetes | workflows independentes e manifests por serviço |
| Dockerfile + K8s | [artifacts-fase4.md](../delivery/artifacts-fase4.md) |
| Collections Postman | [README-fase4.md](../postman/README-fase4.md) |
| Observabilidade | `docs/observability/` e dashboard CloudWatch Fase 4 |
| Segurança | threat model, controls matrix e security gates |

## Arquitetura e operação

- [Solution design](./solution-design-fase4.md)
- [Diagrama Geral + diagramas](./diagrams-fase4.md)
- [Runbook distribuído](../runbook-fase4.md)
- [Alertas](../observability/alerts-fase4.md)
- [Tracing](../observability/tracing-fase4.md)
- [Relatório de validação](../qa/validation-report-fase4.md)
- [Inventário de artefatos](../delivery/artifacts-fase4.md)

## Entrega no portal

- **PDF canônico (P4):** [portal-entrega-fase4.md](../delivery/portal-entrega-fase4.md) — cenário final Opção B (diagrama, Saga, cobertura, Docker/K8s, Postman).
- Diagrama PNG: [delivery/assets/diagrama-geral-fase4.png](../delivery/assets/diagrama-geral-fase4.png).
- Roteiro do vídeo: [video-script-fase4.md](../delivery/video-script-fase4.md).
- Links dos 6 repositórios: preenchidos no portal.
- Participantes e link do vídeo: `[PREENCHER]` no portal (P5/time).
- Smoke AWS / deploy EKS: após P2–P3; anexar evidência no PDF antes da submissão.
- Branch protection formal em billing/execution exige GitHub Pro (repos privados) ou repos públicos; default branch = `develop`.
