# Ambientes — infra Fase 3

| Ambiente | Branch | State keys | `TF_VAR_environment` |
|----------|--------|------------|----------------------|
| Homolog | `develop` | `db/homolog/`, `k8s/homolog/` | `homolog` |
| Prod (demo) | `master` | `db/prod/`, `k8s/prod/` | `prod` |

Promoção: merge PR → push aplica Terraform do prefixo correspondente. Sem credenciais estáticas (ADR-009).
