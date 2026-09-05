# Branch protection — Fase 3

| Campo | Valor |
|-------|-------|
| Role | `infrastructure` |
| Todo | `branch-protection` |
| Data | 2026-09-02 |
| Repo | [dinhogt/autoServiceManager](https://github.com/dinhogt/autoServiceManager) (monorepo; cisão física dos 4 repos ainda pendente) |
| ADR | [ADR-009](../architecture/adr-009-github-oidc-aws-iam.md) |

## Controles aplicados

| Controle | Estado |
|----------|--------|
| Branch `master` | Renomeada de `main` (2026-08-10); protegida — merge só via PR a partir de `develop` |
| Branch `develop` | Integração / homolog; push direto permitido |
| Merge em `master` | Só via PR — `required_pull_request_reviews` |
| Aprovações | 1 (reviews stale dismiss; conversation resolution) |
| Status check | `ci` + **`security-gate`** (strict) |
| Force push / delete | Bloqueados; `enforce_admins: true` |
| Environments | `homolog` (branch `develop`, policy customizada), `production` (`master`, branch protegida) |

### Environment `homolog` (deploy sem proteger `develop`)

A branch `develop` **não** usa branch protection (push direto). O environment `homolog` deve usar **Selected branches** com apenas `develop`:

1. GitHub → **Settings** → **Environments** → **homolog**
2. **Deployment branches** → **Selected branches** → adicionar `develop`
3. Manter `production` com **Protected branches** (apenas `master`)

Via CLI (admin):

```bash
gh api -X PUT repos/dinhogt/autoServiceManager/environments/homolog/deployment-branch-policy \
  -f protected_branches=false -f custom_branch_policies=true

gh api -X POST repos/dinhogt/autoServiceManager/environments/homolog/deployment-branch-policies \
  -f name=develop
```
| Colaborador `soat-architecture` | Convite **Read (pull)** reenviado em 2026-08-10 (pendente de aceite); antes estava com Write e foi removido/recriado |
| Credenciais CI AWS | Workflows usam OIDC (`role-to-assume: secrets.AWS_ROLE_ARN`); **sem** `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` no repo |

## Superfícies CI (4 “repos lógicos” no monorepo)

| Superfície | Workflow | Push `develop` / `master` |
|------------|----------|-------------------------|
| app | `ci-cd.yml` | OIDC → ECR → migrate → EKS |
| auth-lambda | `auth-lambda-ci-cd.yml` | OIDC → `lambda:UpdateFunctionCode` |
| infra-db | `infra-db-ci-cd.yml` | OIDC → `plan -out` → `apply tfplan` |
| infra-k8s | `infra-k8s-ci-cd.yml` | OIDC → `plan -out` → `apply tfplan` |

PR: jobs de validação (app/lambda testes + **`security-gate`**; infra `fmt`/`validate` + **`security-gate`**, sem AWS).

**Regra:** nenhum job `cd` / `plan-apply` executa sem `security-gate` verde.

## Secrets esperados (OIDC — não versionados)

| Secret / env | Uso |
|--------------|-----|
| `AWS_ROLE_ARN` | Assume role via GitHub OIDC (todos os CD) |
| `ECR_REPOSITORY` | Push imagem app |
| `EKS_CLUSTER_NAME` | `kubectl` / deploy |
| `APP_IRSA_ROLE_ARN` / `MIGRATE_IRSA_ROLE_ARN` | Patch de ServiceAccounts |
| `AUTH_LAMBDA_NAME` | Update código Lambda |
| `TARGET_GROUP_ARN` | Registrar IPs dos pods no NLB interno (APIGW VPC Link) |
| `TF_STATE_BUCKET` (variable, opcional) | Backend Terraform |

No momento da aplicação deste todo a lista de Actions secrets no GitHub estava **vazia** — CD falhará até o bootstrap IAM OIDC + preenchimento dos secrets (ops / conta AWS). Isso é esperado e alinhado a ADR-009 (nada estático no git).

## Pós-cisão (checklist)

Quando os repos físicos existirem (`autoservicemanager-app`, `-auth-lambda`, `-infra-db`, `-infra-k8s`), repetir por repo:

1. Criar `master` + `develop` (ou espelhar histórico)
2. Mesmas regras de protection + environments
3. Convidar `soat-architecture` (pull)
4. Trust OIDC IAM por `repo:<org>/<name>:*` e secrets por repo
5. Remover paths monorepo dos workflows

## Handoff

- **next_todo:** `delivery-pdf`
- **next_role:** `documentation`
- **goal:** Vídeo ≤15 min + PDF final (links dos repos, docs, confirmação do colaborador)
- **open_risks:** Cisão física dos 4 repos; secrets OIDC ainda não preenchidos na conta GitHub; merge requer 1 aprovação; convite Read de `soat-architecture` pendente de aceite
