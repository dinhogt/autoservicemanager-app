# WBS — Fase 4

| Pacote | Entrega | Saída | Dependência | Gate |
|---|---|---|---|---|
| 0.1 Governança | 0 | Override complex/high/microservices/90 | baseline Fase 3 | complexity-intake |
| 0.2 Requisitos | 0 | requisitos + aceite F1–F12 | 0.1 | requirements-quality |
| 0.3 Planejamento | 0 | WBS + épicos + rastreabilidade | 0.2 | complexity-intake |
| 1.1 Arquitetura | 1 | ADR-013–018 + solution design | Entrega 0 | architecture-quality |
| 1.2 Contratos | 1 | RFC-005–007 + diagramas | 1.1 | architecture-quality |
| 1.3 Cloud | 1 | decisão AWS Fase 4 | 1.1 | cloud-selection |
| 1.4 Segurança | 1 | threat model + controles | 1.1–1.3 | security-review |
| 1.5 FinOps | 1 | plano de custo/redução | 1.3–1.4 | finops-cost |
| 2 Plataforma | 2 | SQS/SNS/DLQ/DynamoDB/IRSA/APIGW + schemas | Entrega 1 | infrastructure-quality |
| 3 OS | 3 | orquestrador + SagaInstance + adapters | Entrega 2 | implementation-quality |
| 4 Billing | 4 | serviço DynamoDB + Mercado Pago | Entrega 2 | implementation/security |
| 5 Execution | 5 | serviço DynamoDB + filas de trabalho | Entrega 2 | implementation-quality |
| 6 Integração | 6 | caminho feliz + compensações e2e | 3–5 | release-quality |
| 7 Observabilidade | 7 | logs, X-Ray, métricas, dashboard, alertas | 6 | observability-quality |
| 8 Qualidade/CI | 8 | 90%, BDD, Sonar, pipelines | 3–7 | implementation/release |
| 9 Pacote final | 9 | QA, runbook, índice, vídeo, smoke | 8 | release-quality |

## Marcos das Entregas 0–1

1. M0 — governança reconhece projeto distribuído e meta 90%.
2. M1 — F1–F12 têm requisito, critério e épico.
3. M2 — decisões irreversíveis e contratos estão registrados.
4. M3 — novos trust boundaries possuem ameaças e controles.
5. M4 — AWS e custo de demo têm justificativa e limite operacional.

## Dependências externas

- Credenciais Mercado Pago sandbox e segredo de webhook via Secrets Manager.
- Aprovação explícita para `terraform apply` e budget AWS.
- Repositórios Billing/Execution e permissões OIDC em entregas futuras.
- Conta Sonar e proteção de branch antes do gate final.

## Handoff

Entregas 0–1 terminam em documentação; o início da Entrega 2 requer todos os gates M0–M4 e aprovação operacional de custo.
