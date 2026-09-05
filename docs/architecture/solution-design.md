# Solution Design — Fase 2 AutoServiceManager

## Visão geral

Monólito modular NestJS (Clean Architecture / DDD) com persistência transacional MySQL (RDS) e auditoria opcional MongoDB. Infraestrutura na AWS provisionada via Terraform; deploy contínuo em EKS via GitHub Actions.

## Componentes

| Camada | Responsabilidade |
|--------|------------------|
| **Interfaces HTTP** | Controllers REST, Swagger, guards JWT/RBAC/webhook |
| **Application** | Use cases, DTOs, orquestração |
| **Domain** | Entidades, regras de status, ports (repositório, audit, e-mail) |
| **Infrastructure** | Prisma/MySQL, Mongo audit, SMTP/Nodemailer, auth |

## Infraestrutura AWS

```
Internet → ALB/Service LB → EKS (Deployment API + HPA)
                              ↓
                         RDS MySQL
                         Secrets Manager → K8s Secrets
                         ECR (imagens)
                         MongoDB Atlas ou in-cluster (auditoria)
```

## Fluxo de deploy

### Local (kind + Compose) — demo Fase 2

1. `terraform apply` em `infra/terraform/local` (cluster + DB compose)
2. `./scripts/kind-setup.sh` (build, secrets, manifests, migrate)
3. CI GitHub Actions em push/PR (lint, testes, docker build)
4. HPA escala pods conforme CPU/memória

Ver [`fase2-architecture-diagram.md`](./fase2-architecture-diagram.md) e [`../runbook-deploy-local-k8s.md`](../runbook-deploy-local-k8s.md).

### AWS (alternativo)

1. `terraform apply` em `infra/terraform/environments/dev`
2. Push na branch `master` dispara CI/CD
3. Pipeline: lint → testes → build → push ECR → `kubectl apply` → job migrate
4. HPA escala pods conforme CPU/memória

## APIs críticas (Fase 2)

- `POST /ordens-servico` — abertura de OS
- `GET /ordens-servico/:id/status` — consulta pública
- `POST /ordens-servico/:id/aprovacoes` — aprovação de orçamento
- `GET /admin/ordens-servico` — listagem priorizada (exclui finalizadas/entregues)
- `POST /webhooks/os/:id/status` — integração externa (header `X-Webhook-Secret`)
- Notificações e-mail em transições de status (`EMAIL_ENABLED=true`)

## Decisões

Ver [adr-002-fase2-aws-email.md](./adr-002-fase2-aws-email.md).

## Evolução Fase 3

Desenho corporativo (API Gateway, Lambda auth CPF, OIDC, state remoto, fim do Mongo): [solution-design-fase3.md](./solution-design-fase3.md).
