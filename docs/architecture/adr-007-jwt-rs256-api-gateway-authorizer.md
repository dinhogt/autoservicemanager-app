# ADR-007 — JWT RS256 + JWT Authorizer (API Gateway)

| Campo | Valor |
|-------|-------|
| Status | Aceito — Fase 3 |
| Data | 2026-08-07 |
| Role | architecture |
| Relacionados | ADR-002 (auth admin HS256), ADR-009 (OIDC CI), RFC-003 (estratégia auth) |

## Contexto

A Fase 3 exige autenticação serverless por CPF e proteção de rotas sensíveis via API Gateway. Na Fase 2, o monólito NestJS valida JWT **HS256** com `JWT_SECRET` compartilhado para usuários **admin**. Introduzir uma Lambda `authCpf` que emitiria o mesmo segredo simétrico criaria **dupla fonte da verdade** e acoplamento de rotação de segredo entre dois deployables.

## Decisão

1. **Lambda `authCpf`** emite JWT **RS256** (`alg: RS256`) com chave privada em Secrets Manager.
2. **JWKS público** (com `kid`) publicado em endpoint estático (S3 + CloudFront ou rota dedicada).
3. **API Gateway HTTP API** usa **JWT Authorizer** apontando para o JWKS; valida assinatura, `iss`, `aud` e expiração **antes** do proxy para o EKS.
4. Claims mínimas do token de cliente: `sub = cpf` (somente dígitos), `scope = cliente`, `kid` na header. Sem PII expandida.
5. App NestJS em EKS **não** revalida o JWT de cliente; confia nos headers injetados pelo authorizer (ex.: `x-cpf`, `x-scope`) após o VPC Link. Middleware valida presença/formato do CPF.
6. **`JwtAuthGuard` + RBAC admin (HS256)** permanece **apenas** para rotas `/admin/*` (roles `ADMIN`, `GERENTE`, `MECANICO`, `ATENDENTE`). Novo role lógico `CLIENTE` aplica-se somente ao fluxo de gateway/cliente.
7. Rotação: manter **duas** chaves ativas no JWKS durante a janela de troca; documentar no runbook.

### Trade-offs (máx. 3)

| Opção | Prós | Contras | Escolha |
|-------|------|---------|---------|
| HS256 segredo compartilhado | Simples | Acoplamento Lambda↔App; rotação distribuída | Rejeitada |
| RS256 + Authorizer no Gateway | Boundary claro; App sem segredo de cliente | Operar JWKS/keys | **Aceita** |
| Validar RS256 também no Nest | Defesa em profundidade | Duplica lógica; clock skew | Adiada (opcional pós-MVP) |

## Governança (checklist OPC)

- Complexidade: neutra/reduz vs HS256 compartilhado em 4 repos.
- Operável por uma pessoa com AI: sim (Terraform + Secrets Manager).
- Alternativa mais simples (HS256) rejeitada por risco de segredo compartilhado.
- AWS classificada como **Uso Excepcional** no governance-checklist — justificada pelo requisito acadêmico FIAP e ADR-002.

## Consequências

- Breaking change vs Fase 2: rotas hoje públicas por CPF/placa passam a exigir Bearer JWT de cliente.
- Dois mecanismos de auth coexistem (admin HS256 local; cliente RS256 no edge).
- Threat model deve registrar fronteira API Gateway ↔ EKS (headers confiáveis só se originados do VPC Link).

## Fora de escopo

- OAuth2/OIDC IdP externo (Cognito User Pool) — possível evolução; não obrigatório no PDF.
- MFA para cliente.
