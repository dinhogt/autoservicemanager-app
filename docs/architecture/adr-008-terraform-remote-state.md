# ADR-008 — State remoto Terraform (S3 + DynamoDB)

| Campo | Valor |
|-------|-------|
| Status | Aceito — Fase 3 |
| Data | 2026-08-07 |
| Role | architecture |
| Relacionados | ADR-002 (módulos Terraform), ADR-009 (OIDC apply) |

## Contexto

A Fase 3 exige **dois** repositórios de infraestrutura: `autoservicemanager-infra-db` (RDS) e `autoservicemanager-infra-k8s` (VPC, EKS, API Gateway, Lambda). State local (como em `infra/terraform/local` da Fase 2) não escala para CI multi-repo nem para colaboração com `soat-architecture`. É necessário contrato explícito de outputs entre stacks.

## Decisão

1. **Backend remoto único por conta AWS:**
   - Bucket S3 `autoservicemanager-tfstate-<account-id>` — versioning + SSE-S3 (ou SSE-KMS).
   - Tabela DynamoDB `autoservicemanager-tflock` — lock (`LockID`).
2. **Bootstrap manual uma vez** (fora dos 4 repos de entrega), documentado em [`infra-db/scripts/bootstrap-state.sh`](../../infra-db/scripts/bootstrap-state.sh); não versionar state no Git.
   - Bucket policy **obrigatória**: deny `GetObject`/`PutObject`/`DeleteObject` exceto role OIDC CI/admin (`STATE_ADMIN_ROLE_ARN`).
   - State é **tier-0** (contém senha RDS / `DATABASE_URL`); leitura do objeto = posse da credencial.
3. **Keys distintos por stack e ambiente:**
   - `infra-db` homolog → `db/homolog/terraform.tfstate`
   - `infra-db` prod → `db/prod/terraform.tfstate`
   - `infra-k8s` homolog → `k8s/homolog/terraform.tfstate`
   - `infra-k8s` prod → `k8s/prod/terraform.tfstate`
4. **`infra-k8s` consome `terraform_remote_state` de `db/<env>/`** (ou SSM Parameter Store espelhando outputs). Contrato mínimo de outputs:

| Output | Consumidor |
|--------|------------|
| `db_endpoint` | Lambda, App (Secrets/Config) |
| `db_sg_id` | Regras de SG EKS/Lambda |
| `db_secret_arn` | IRSA / env da Lambda e Job migrate |
| `db_port` | Security groups |

5. **Ordem de apply:** `infra-db` → `infra-k8s` (por ambiente). **Destroy:** inverso.
6. Ambientes `homolog` / `prod` sob o mesmo bucket com prefixes acima; CI define `TF_VAR_environment` e a key conforme branch (`develop` → homolog, `master` → prod). Destroy pós-demo para conter custo.

### Trade-offs

| Opção | Prós | Contras | Escolha |
|-------|------|---------|---------|
| State local / commit no Git | Zero bootstrap | Conflito; vazamento; CI quebrado | Rejeitada |
| S3 + DynamoDB lock | Padrão AWS; CI seguro | Bootstrap manual | **Aceita** |
| Terraform Cloud | UI e policies | Conta extra; fora do escopo FIAP AWS | Adiada |

## Consequências

- Pipelines de `infra-*` precisam permissão IAM `s3:GetObject/PutObject` no prefixo + DynamoDB lock via OIDC (ADR-009); a bucket policy restringe a essa role.
- Plan com state real **somente pós-merge** (PR: `fmt`/`validate` sem assume-role).
- Mudança de contrato de outputs/keys é breaking entre repos — versionar no README de `infra-db`.

## Fora de escopo

- Módulo Terraform publicado em registry privado.
- Drift detection contínuo (Atlantis/Spacelift).
