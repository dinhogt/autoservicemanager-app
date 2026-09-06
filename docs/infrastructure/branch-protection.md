# Branch protection — Fase 3 (4 remotes)

| Campo | Valor |
|-------|-------|
| Role | `infrastructure` |
| Todo | `branch-protection` |
| Data | 2026-09-05 |
| Repos | [app](https://github.com/dinhogt/autoservicemanager-app) · [auth-lambda](https://github.com/dinhogt/autoservicemanager-auth-lambda) · [infra-db](https://github.com/dinhogt/autoservicemanager-infra-db) · [infra-k8s](https://github.com/dinhogt/autoservicemanager-infra-k8s) |
| ADR | [ADR-009](../architecture/adr-009-github-oidc-aws-iam.md) |

## Controles (aplicar em cada repo)

| Controle | Estado alvo |
|----------|-------------|
| Branch `master` | Protegida — merge só via PR a partir de `develop` |
| Branch `develop` | Integração / homolog; push direto permitido |
| Merge em `master` | Só via PR — `required_pull_request_reviews` |
| Aprovações | 1 (reviews stale dismiss; conversation resolution) |
| Status check | `ci` (ou `validate`) + **`security-gate`** (strict) |
| Force push / delete | Bloqueados; `enforce_admins: true` |
| Environments | `homolog` (branch `develop`), `production` (`master`) |
| Colaborador `soat-architecture` | **Read (pull)** nos 4 remotes |
| Credenciais CI AWS | OIDC (`secrets.AWS_ROLE_ARN`); **sem** AKIA no git |

### Environment `homolog` (por repo)

```bash
REPO=dinhogt/autoservicemanager-app   # repetir para os 4
gh api -X PUT "repos/${REPO}/environments/homolog/deployment-branch-policy" \
  -f protected_branches=false -f custom_branch_policies=true
gh api -X POST "repos/${REPO}/environments/homolog/deployment-branch-policies" \
  -f name=develop
```

## Superfícies CI (4 remotes físicos)

| Repo | Workflow | Push `develop` / `master` |
|------|----------|---------------------------|
| [autoservicemanager-app](https://github.com/dinhogt/autoservicemanager-app) | `ci-cd.yml` | OIDC → ECR → migrate → EKS |
| [autoservicemanager-auth-lambda](https://github.com/dinhogt/autoservicemanager-auth-lambda) | `ci-cd.yml` | OIDC → `lambda:UpdateFunctionCode` |
| [autoservicemanager-infra-db](https://github.com/dinhogt/autoservicemanager-infra-db) | `ci-cd.yml` | OIDC → `plan -out` → `apply tfplan` |
| [autoservicemanager-infra-k8s](https://github.com/dinhogt/autoservicemanager-infra-k8s) | `ci-cd.yml` | OIDC → `plan -out` → `apply tfplan` |

PR: validação + **`security-gate`** (infra: `fmt`/`validate` sem AWS). Nenhum job `cd` / `plan-apply` sem `security-gate` verde. **Sem** `paths:` de monorepo.

## Secrets esperados (OIDC — não versionados)

| Secret / env | Repos |
|--------------|-------|
| `AWS_ROLE_ARN` (ARN distinto por role, preferência Fase C) | todos |
| `ECR_REPOSITORY`, `EKS_CLUSTER_NAME`, `APP_IRSA_ROLE_ARN`, `MIGRATE_IRSA_ROLE_ARN`, `TARGET_GROUP_ARN` | app |
| `AUTH_LAMBDA_NAME` | auth-lambda |
| `TF_STATE_BUCKET` (variable) | infra-db, infra-k8s |

Trust OIDC subjects (Fase C): `repo:dinhogt/autoservicemanager-{app,auth-lambda,infra-db,infra-k8s}:*`

## Pós-cisão (checklist)

| # | Item | Estado |
|---|------|--------|
| 1 | Criar `master` + `develop` nos 4 repos | **DONE** |
| 2 | Remover paths monorepo dos workflows | **DONE** |
| 3 | Docs / READMEs apontam para 4 remotes | **DONE** (Phase B) |
| 4 | `domain-shared` publicado (`@dinhogt/domain-shared` 0.1.0) | **DONE** (publish workflow) |
| 4b | Package → Manage Actions access → auth-lambda | **Pendente** (UI; desbloqueia install CI) |
| 4c | Commit `yarn.lock` auth-lambda com resolved Packages | **Pendente** (após 4b + token `read:packages`) |
| 5 | Convidar `soat-architecture` (pull) nos 4 | **DONE** (Phase A) — aceite a confirmar |
| 6 | Branch protection + environments por repo (gh API) | **Pendente Fase C** |
| 7 | Trust OIDC IAM + secrets por repo | **Pendente Fase C** |

## Handoff

- **next_todo:** Fase C — OIDC/secrets/branch protection ao vivo; depois AWS bootstrap smoke
- **next_role:** `infrastructure` / ops
- **goal:** CD homolog funcional nos 4 remotes
- **open_risks:** Secrets OIDC ainda não preenchidos pós-cisão; protection live = Fase C
