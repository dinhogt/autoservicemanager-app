# Auth Lambda — autoservicemanager-auth-lambda

| Campo | Valor |
|-------|-------|
| Role | `backend` |
| Todo | `repo-lambda` |
| Data | 2026-08-08 |
| Código | [autoservicemanager-auth-lambda](https://github.com/dinhogt/autoservicemanager-auth-lambda) |

## Entrega

- Handler `POST /auth/cpf` (API Gateway HTTP API v2)
- Validação CPF via `@dinhogt/domain-shared`
- Lookup `Cliente` no MySQL (`mysql2`, query parametrizada)
- JWT **RS256** (`jose`) com chave em Secrets Manager / PEM local
- Bundle **esbuild** → `dist/handler.js` / `auth-cpf.zip`
- CI OIDC: repo [autoservicemanager-auth-lambda](https://github.com/dinhogt/autoservicemanager-auth-lambda) → `.github/workflows/ci-cd.yml`

## Handoff

- **next_todo:** `delivery-pdf` ([branch-protection](../infrastructure/branch-protection.md))
- Função Lambda, secrets JWT, JWKS e rota APIGW criados no stack `infra-k8s`; CI atualiza o código (`AUTH_LAMBDA_NAME`).
