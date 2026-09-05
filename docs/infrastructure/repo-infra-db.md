# Repo infra-db — preparação Fase 3

| Campo | Valor |
|-------|-------|
| Role | `infrastructure` |
| Todo | `repo-infra-db` (+ hardening CI/state/SG) |
| Data | 2026-08-08 |
| Código | [autoservicemanager-infra-db](https://github.com/dinhogt/autoservicemanager-infra-db) |
| ADRs | [ADR-008](../architecture/adr-008-terraform-remote-state.md), [ADR-009](../architecture/adr-009-github-oidc-aws-iam.md) |
| Hardening | [hardening-infra-db.md](../security/hardening-infra-db.md) |

## Entrega

- Stack Terraform autocontido: **VPC** + **RDS MySQL 8** + **Secrets Manager**
- Backend S3 + DynamoDB com keys `db/homolog/` e `db/prod/`; bootstrap com bucket policy least-privilege
- Outputs contrato ADR-008: `db_endpoint`, `db_port`, `db_sg_id`, `db_secret_arn` (+ `vpc_*` para o stack k8s)
- Secret JSON alinhado à Lambda (`DB_SECRET_ARN`) e `DATABASE_URL` para Prisma
- Senha gerada por `random_password` (sem segredo em `.tfvars` versionado)
- SG RDS **sem ingress CIDR** por default (`db_allowed_cidr_blocks = []`)
- CI OIDC: PR só `fmt`/`validate`; push `plan -out` + `apply tfplan` por ambiente

## Decisão de fronteira

VPC fica neste repo para permitir **apply db → k8s**. `infra-k8s` consome `vpc_id` / subnets via remote state e **deve** abrir MySQL com regras SG→SG em `db_sg_id` (EKS nodes + Lambda).

## Handoff

- **Gate hardening:** [hardening-infra-db.md](../security/hardening-infra-db.md) concluído (2026-08-08).
- **next_todo:** `delivery-pdf` ([branch-protection](./branch-protection.md))
- Stack k8s consome `terraform_remote_state` `db/<homolog|prod>/` e abre MySQL com SG→SG.
