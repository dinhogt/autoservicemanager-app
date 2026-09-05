# RFC-003 — Autenticação cliente (Lambda RS256 + JWKS)

| Campo | Valor |
|-------|-------|
| Status | Aceito |
| Data | 2026-08-09 |
| Role | documentation / architecture |
| Relacionados | ADR-007, ADR-004, pacote `domain-shared` |

## Problema

Proteger rotas de cliente (CPF/placa/OS) sem compartilhar segredo HS256 entre Lambda e Nest, e validar token **no edge**.

## Proposta

1. `POST /auth/cpf` → Lambda `authCpf` (valida CPF via `@autoservicemanager/domain-shared`, consulta RDS, emite JWT **RS256**)
2. JWKS público (S3 + CloudFront) com `kid`
3. API Gateway **JWT Authorizer** valida Bearer antes do VPC Link
4. Nest recebe `x-cpf` / `x-scope` injetados; admin permanece HS256 local

## Alternativas rejeitadas

| Opção | Motivo |
|-------|--------|
| HS256 compartilhado | Dupla fonte de verdade; rotação acoplada |
| Cognito User Pool | Escopo além do MVP; CPF custom |
| Validar RS256 também no Nest | Duplica lógica (opcional pós-MVP) |

## Decisão

**RS256 no edge (Authorizer) + HS256 admin no app** — ver [ADR-007](./adr-007-jwt-rs256-api-gateway-authorizer.md).

## Critérios de aceite

- [x] Lambda + JWKS + Authorizer no `infra-k8s`
- [x] Repo `auth-lambda` com CI OIDC
- [x] Sequência documentada em [diagrams-fase3.md](./diagrams-fase3.md)
