# Repo infra-k8s — preparação Fase 3

| Campo | Valor |
|-------|-------|
| Role | `infrastructure` |
| Todo | `repo-infra-k8s` |
| Data | 2026-08-09 |
| Código | [autoservicemanager-infra-k8s](https://github.com/dinhogt/autoservicemanager-infra-k8s) |
| ADRs | [ADR-007](../architecture/adr-007-jwt-rs256-api-gateway-authorizer.md), [ADR-008](../architecture/adr-008-terraform-remote-state.md), [ADR-009](../architecture/adr-009-github-oidc-aws-iam.md) |
| Upstream | [repo-infra-db.md](./repo-infra-db.md), [hardening-infra-db.md](../security/hardening-infra-db.md) |

## Entrega

- Stack Terraform autocontido: **EKS** + **NLB** + **VPC Link** + **API Gateway HTTP API** + **JWT Authorizer** + **Lambda authCpf** + **JWKS (S3+CloudFront)** + **IRSA**
- Consome `terraform_remote_state` `db/<env>/` (VPC, `db_sg_id`, `db_secret_arn`)
- Ingress MySQL **somente SG→SG** (nodes + Lambda) — fecha o residual do hardening
- State keys `k8s/homolog/` e `k8s/prod/`; CI PR sem OIDC; push `plan -out` + `apply tfplan`
- Headers `x-cpf` / `x-scope` injetados nas rotas JWT a partir das claims do Authorizer

## Fronteiras de auth no gateway

| Rota | Authorizer |
|------|------------|
| `POST /auth/cpf` | Nenhum → Lambda |
| `/clientes/*`, `/ordens-servico/*` | JWT RS256 (JWKS) |
| `/admin/*`, `/webhooks/*`, `GET /health` | Nenhum (Nest HS256 / webhook secret) |

## Handoff

- **next_todo:** `delivery-pdf` ([branch-protection](./branch-protection.md))
- **next_role:** `infrastructure`
- **Artefatos observability:** [dashboards.md](../observability/dashboards.md), [alerts.md](../observability/alerts.md), [tracing.md](../observability/tracing.md)
- **Artefatos docs-arch:** [docs-arch-handoff.md](../architecture/docs-arch-handoff.md)
- Registrar pods no Target Group; ServiceAccounts com IRSA ARNs
- **open_risks:** Target Group vazio até o app bind; trust OIDC IAM na conta (ops); thresholds CloudWatch a calibrar
