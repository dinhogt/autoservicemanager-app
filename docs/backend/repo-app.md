# Repo app — preparação Fase 3

| Campo | Valor |
|-------|-------|
| Role | `backend` |
| Todo | `repo-app` |
| Data | 2026-08-08 |

Este monorepo atua como **autoservicemanager-app** até a cisão dos 4 repos.

## CI/CD (OIDC)

Workflow [`.github/workflows/ci-cd.yml`](../../.github/workflows/ci-cd.yml):

- `ci`: lint, arch, test:cov, build, docker build (PR + push `master`/`develop`)
- `cd` (push `master` **ou** `develop`): OIDC → ECR push → migrate Job → deploy EKS
  - Secrets: `AWS_ROLE_ARN`, `ECR_REPOSITORY`, `EKS_CLUSTER_NAME` (sem AKIA)

`develop` → ambiente homolog; `master` → produção demo.

## Auth

| Público | Admin | Cliente |
|---------|-------|---------|
| `POST /ordens-servico`, login, webhook | JWT HS256 + `AppRole` staff | Headers `x-cpf` / `x-scope` (`AppRole.CLIENTE`) |

Implementação: `ClienteAuthGuard` + `RolesGuard` (`AppRole.CLIENTE`).

## Observabilidade (app)

- `JsonLogger` quando `LOG_FORMAT=json` ou `NODE_ENV=production` (`correlationId`, `xrayTraceId`, `event`)
- `TraceMiddleware`: propaga `X-Amzn-Trace-Id` e `X-Correlation-Id` (ALS)
- `aws-xray-sdk-core` quando `AWS_XRAY_ENABLED=true` (ConfigMap EKS + DaemonSet)
- Ops: [docs/observability/](../observability/) — Container Insights, dashboards, alarmes

## Handoff

- **next_todo:** `delivery-pdf` ([../infrastructure/branch-protection.md](../infrastructure/branch-protection.md))
- **open_risks:** NLB Target Group bind; calibrar thresholds (ver alerts.md)
