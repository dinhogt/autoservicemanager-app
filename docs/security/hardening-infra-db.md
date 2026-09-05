# Hardening infra-db / CI — remediação pós-revisão

| Campo | Valor |
|-------|-------|
| Role | `security` + `infrastructure` |
| Data | 2026-08-08 |
| Escopo | Riscos High/Medium da revisão do stack `infra-db` |
| Gate retomada Fase 3 | Este documento + validate CI |

## Achados → mitigação

| Severidade | Achado | Mitigação | Residual |
|------------|--------|-----------|----------|
| High | OIDC no `terraform plan` de PR | Removido; PR só `fmt`/`validate` sem AWS | Trust OIDC na conta AWS (ops, ADR-009) |
| Medium | Senha RDS no tfstate | Bucket policy deny-exceto role CI (`STATE_ADMIN_ROLE_ARN`) | Quem assume a role ainda lê state |
| Medium | Comment de plan no PR | Eliminado com o job PR+AWS | — |
| Medium | Apply ≠ plan revisado | Push: `plan -out=tfplan` + `apply tfplan` no mesmo job | — |
| Medium | State único homolog/prod | Keys `db/homolog/` e `db/prod/` + `TF_VAR_environment` | Conta AWS única acadêmica |
| Medium | MySQL aberto ao CIDR da VPC | Default `db_allowed_cidr_blocks = []` | Conectividade só após SG→SG em `repo-infra-k8s` |

## Fora deste ciclo

- IAM trust policy OIDC (`sub` / repo / branch) na AWS
- Migração para RDS `manage_master_user_password`

## Retomada

Gate satisfeito (2026-08-08). Fase 3 retomada em `repo-infra-k8s` — ver [repo-infra-k8s.md](../infrastructure/repo-infra-k8s.md).
