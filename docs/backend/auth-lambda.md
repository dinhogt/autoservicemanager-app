# Auth Lambda — autoservicemanager-auth-lambda

| Campo | Valor |
|-------|-------|
| Role | `backend` |
| Todo | `repo-lambda` |
| Data | 2026-09-08 |
| Código | [autoservicemanager-auth-lambda](https://github.com/dinhogt/autoservicemanager-auth-lambda) |

## Entrega

- Handler `POST /auth/cpf` (API Gateway HTTP API v2)
- Validação CPF via `@dinhogt/domain-shared`
- Lookup `Cliente` no MySQL (`mysql2`, query parametrizada)
- JWT **RS256** (`jsonwebtoken`) com chave em Secrets Manager / PEM local
- Handler `notify-os` (SNS → SES) — notificações serverless (RFC-004)
- Bundle **esbuild** → `auth-cpf.zip` + `notify-os.zip`
- CI OIDC: download de artefatos → `UpdateFunctionCode` (sem rebuild no CD)

## Handoff

- Função Lambda, secrets JWT, JWKS e rota APIGW no stack `infra-k8s`; CI atualiza o código (`AUTH_LAMBDA_NAME`, `NOTIFY_LAMBDA_NAME`).
