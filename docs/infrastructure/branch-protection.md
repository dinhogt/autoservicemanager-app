# Branch protection — Fase 3 (4 remotes)

| Campo | Valor |
|-------|-------|
| Role | `infrastructure` |
| Todo | `branch-protection` / `oidc-secrets-review` (GitHub side) |
| Data | 2026-09-05 |
| Repos | [app](https://github.com/dinhogt/autoservicemanager-app) · [auth-lambda](https://github.com/dinhogt/autoservicemanager-auth-lambda) · [infra-db](https://github.com/dinhogt/autoservicemanager-infra-db) · [infra-k8s](https://github.com/dinhogt/autoservicemanager-infra-k8s) |
| ADR | [ADR-009](../architecture/adr-009-github-oidc-aws-iam.md) |
| Status Fase C | **GitHub ready** |
| Status Fase E (2026-09-06) | **Sem terraform apply** (pedido do usuário). Prep OIDC + checklist: [aws-bootstrap-no-apply.md](./aws-bootstrap-no-apply.md) |

## Controles aplicados (GitHub — DONE)

| Controle | Estado |
|----------|--------|
| Branch `master` (4 repos) | Protegida — PR obrigatório; force push / delete bloqueados; `enforce_admins: true` |
| Aprovações | 1 (stale dismiss; conversation resolution) |
| Status checks — app / auth-lambda | `ci` + `security-gate` (strict) |
| Status checks — infra-db / infra-k8s | `validate` + `security-gate` (strict) |
| Branch `develop` | Integração / homolog; push direto permitido |
| Environment `homolog` | Selected branches → `develop` |
| Environment `production` | Protected branches → `master` |
| Colaborador `soat-architecture` | Convite **Read** pendente de aceite nos 4 |
| Credenciais CI AWS | OIDC only (`secrets.AWS_ROLE_ARN`); **sem** AKIA no git |

### URLs Settings (protection / environments)

| Repo | Branches | Environments |
|------|----------|--------------|
| [autoservicemanager-app](https://github.com/dinhogt/autoservicemanager-app) | [settings/branches](https://github.com/dinhogt/autoservicemanager-app/settings/branches) | [settings/environments](https://github.com/dinhogt/autoservicemanager-app/settings/environments) |
| [autoservicemanager-auth-lambda](https://github.com/dinhogt/autoservicemanager-auth-lambda) | [settings/branches](https://github.com/dinhogt/autoservicemanager-auth-lambda/settings/branches) | [settings/environments](https://github.com/dinhogt/autoservicemanager-auth-lambda/settings/environments) |
| [autoservicemanager-infra-db](https://github.com/dinhogt/autoservicemanager-infra-db) | [settings/branches](https://github.com/dinhogt/autoservicemanager-infra-db/settings/branches) | [settings/environments](https://github.com/dinhogt/autoservicemanager-infra-db/settings/environments) |
| [autoservicemanager-infra-k8s](https://github.com/dinhogt/autoservicemanager-infra-k8s) | [settings/branches](https://github.com/dinhogt/autoservicemanager-infra-k8s/settings/branches) | [settings/environments](https://github.com/dinhogt/autoservicemanager-infra-k8s/settings/environments) |

## Superfícies CI (4 remotes)

| Repo | Workflow | Push `develop` / `master` |
|------|----------|---------------------------|
| [app](https://github.com/dinhogt/autoservicemanager-app) | `ci-cd.yml` | OIDC → ECR → migrate → EKS |
| [auth-lambda](https://github.com/dinhogt/autoservicemanager-auth-lambda) | `ci-cd.yml` | OIDC → `lambda:UpdateFunctionCode` |
| [infra-db](https://github.com/dinhogt/autoservicemanager-infra-db) | `ci-cd.yml` | OIDC → `plan -out` → `apply tfplan` |
| [infra-k8s](https://github.com/dinhogt/autoservicemanager-infra-k8s) | `ci-cd.yml` | OIDC → `plan -out` → `apply tfplan` |

PR: validação + **`security-gate`**. Nenhum job `cd` / `plan-apply` sem `security-gate` verde.

## Secrets / vars — estado atual vs pendente (AWS deferred)

`gh secret` **não** permite ler valores. Copiar do monorepo exige colar manualmente na UI (ou recriar a partir do console AWS).

### Já configurado no GitHub

| Item | Onde | Nota |
|------|------|------|
| Environments `homolog` + `production` | 4 repos | Policies develop→homolog, master→production |
| `TF_STATE_BUCKET` (variable) | infra-db, infra-k8s (`homolog` + `production`) | `autoservicemanager-tfstate-975769101856` |
| `AWS_ROLE_ARN` (secret) | **somente** app (`homolog` + `production`) | Presente desde tentativa anterior Fase C; **não verificado** — trust OIDC AWS **não** atualizado nesta sessão |

### USER deve colar (após aprovação AWS / OIDC)

Fonte de valores hoje: monorepo [autoServiceManager](https://github.com/dinhogt/autoServiceManager) → Environments → `homolog` (UI), ou console AWS após criar/atualizar roles.

| Secret | Repos / envs | Origem sugerida |
|--------|--------------|-----------------|
| `AWS_ROLE_ARN` | **todos** os 4 × `homolog` + `production` (ARN **distinto por repo**, preferência) | IAM role OIDC — **criar/atualizar só com aprovação explícita** |
| `ECR_REPOSITORY` | app | monorepo homolog |
| `EKS_CLUSTER_NAME` | app | monorepo homolog |
| `APP_IRSA_ROLE_ARN` | app | monorepo homolog |
| `MIGRATE_IRSA_ROLE_ARN` | app | monorepo homolog |
| `TARGET_GROUP_ARN` | app | monorepo homolog |
| `AUTH_LAMBDA_NAME` | auth-lambda | monorepo homolog |
| `DATABASE_URL` (se o workflow app exigir no env) | app | monorepo homolog — **não** versionar no git |

Trust OIDC subjects alvo (quando AWS for liberado):

```text
repo:dinhogt/autoservicemanager-app:*
repo:dinhogt/autoservicemanager-auth-lambda:*
repo:dinhogt/autoservicemanager-infra-db:*
repo:dinhogt/autoservicemanager-infra-k8s:*
```

Preferência: **1 IAM role por repo**. Alternativa: expandir trust do role monorepo para os 4 subjects.

### Passos manuais (secrets)

1. Abrir monorepo → Settings → Environments → `homolog` → copiar **valores** (não commits).
2. Em cada remote novo → Settings → Environments → `homolog` / `production` → New secret.
3. Para `AWS_ROLE_ARN`: usar ARNs dos roles pós-revisão OIDC (ainda **não** feitos — zero mutação AWS em 2026-09-05).

## Pós-cisão (checklist)

| # | Item | Estado |
|---|------|--------|
| 1 | Criar `master` + `develop` nos 4 repos | **DONE** |
| 2 | Remover paths monorepo dos workflows | **DONE** |
| 3 | Docs / READMEs apontam para 4 remotes | **DONE** (Phase B) |
| 4 | `domain-shared` publicado (`@dinhogt/domain-shared` 0.1.0) | **DONE** |
| 4b | Package → Manage Actions access → auth-lambda | Verificar UI se CI install falhar |
| 5 | Convidar `soat-architecture` (pull) nos 4 | **DONE** — aceite **pendente** |
| 6 | Branch protection + environments (gh API) | **DONE** (GitHub) |
| 7 | Trust OIDC IAM + secrets por repo | **DEFERRED** — aguarda aprovação explícita (custo/AWS zero) |
| 8 | Fase D bootstrap apply / smoke | **BLOQUEADO** até item 7 |

## Handoff

- **next_todo:** Após OK do usuário — OIDC IAM (1 role/repo ou trust expandido) + preencher secrets; só então Fase D
- **next_role:** `infrastructure` / ops (com aprovação)
- **goal:** CD homolog funcional nos 4 remotes
- **open_risks:** Secrets CD incompletos; `AWS_ROLE_ARN` no app não validado; invite `soat-architecture` sem aceite; production secrets do monorepo também estavam vazios
