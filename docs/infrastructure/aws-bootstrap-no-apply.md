# AWS bootstrap — sem terraform apply (2026-09-06)

| Campo | Valor |
|-------|-------|
| Todo | `aws-bootstrap-smoke` (escopo reduzido) |
| Conta | `975769101856` |
| Região | `us-east-1` |
| Restrição do usuário | **Sem `terraform apply`** nesta sessão |
| Profile local | `asm-bootstrap` (`bootstrap-autoservicemanager`) — **sem** IAM create/list roles, **sem** EKS/Lambda list; listagem parcial do bucket de state |

## O que foi feito nesta sessão

| Item | Estado |
|------|--------|
| Documentar ordem de bootstrap | **DONE** (este arquivo) |
| Templates trust OIDC 1 role/repo | **DONE** — [`oidc-trust-policies/`](./oidc-trust-policies/) |
| Script de criação de roles (admin) | **DONE** — [`scripts/create-oidc-roles.sh`](../../scripts/create-oidc-roles.sh) |
| `terraform apply` db/k8s | **NÃO EXECUTADO** (pedido explícito) |
| Smoke APIGW / JWT / OS / dashboards ao vivo | **DEFERRED** — depende de apply + secrets |
| CD GitHub (push develop) | **NÃO DISPARADO** — evitar apply automático dos workflows de infra |

## Ordem quando apply for liberado

```text
1. Admin AWS: rodar scripts/create-oidc-roles.sh (ou colar policies)
2. Colar secrets nos 4 repos (homolog + production) — matriz abaixo
3. infra-db: terraform apply (homolog)   ← gera custo
4. infra-k8s: terraform apply (homolog)  ← gera custo (EKS)
5. auth-lambda CD (UpdateFunctionCode)
6. app CD (ECR + migrate + EKS)
7. Smoke (seção abaixo) + SNS subscribe
8. Destroy pós-demo: k8s → db
```

State bucket (já referenciado nos envs): `autoservicemanager-tfstate-975769101856`  
Prefixes observados (list only): `db/`, `k8s/` — objetos `*/homolog/terraform.tfstate` existem (~182 B; provavelmente placeholder; **GetObject 403** para o user bootstrap).

## Matriz de secrets (colar na UI — API não lê valores)

Fonte: monorepo `dinhogt/autoServiceManager` → Environment `homolog`.

| Secret | app | auth-lambda | infra-db | infra-k8s |
|--------|-----|-------------|----------|-----------|
| `AWS_ROLE_ARN` | ✓ (ARN do role **app**) | ✓ role lambda | ✓ role db | ✓ role k8s |
| `ECR_REPOSITORY` | ✓ | | | |
| `EKS_CLUSTER_NAME` | ✓ | | | |
| `APP_IRSA_ROLE_ARN` | ✓ | | | |
| `MIGRATE_IRSA_ROLE_ARN` | ✓ | | | |
| `TARGET_GROUP_ARN` | ✓ | | | |
| `DATABASE_URL` | ✓ (se workflow exigir) | | | |
| `AUTH_LAMBDA_NAME` | | ✓ | | |
| Var `TF_STATE_BUCKET` | | | ✓ já set | ✓ já set |

## Smoke checklist (após apply)

1. `POST {api_endpoint}/auth/cpf` → JWT RS256  
2. `GET/POST` rota protegida com `Authorization: Bearer`  
3. `POST /ordens-servico` + status + log JSON / X-Ray  
4. Dashboard CloudWatch + alarme falha OS  
5. PR → checks → merge → deploy automático  

## Profile IAM — gap

O user `bootstrap-autoservicemanager` **não** pode criar OIDC roles. Usar um principal com `iam:CreateRole`, `iam:UpdateAssumeRolePolicy`, `iam:AttachRolePolicy` (root/admin do lab) para o script.
