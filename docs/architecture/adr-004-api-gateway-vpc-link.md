# ADR-004 — API Gateway HTTP API + VPC Link + NLB

| Campo | Valor |
|-------|-------|
| Status | Aceito — Fase 3 |
| Data | 2026-08-09 |
| Role | architecture |
| Relacionados | ADR-007, RFC-001, RFC-003 |

## Contexto

O app NestJS roda em EKS (privado). É preciso expor HTTPS público, autenticar cliente no edge e **não** expor o NLB/nós diretamente à internet.

## Decisão

1. **API Gateway HTTP API** como único entrypoint público.
2. Rotas:
   - `POST /auth/cpf` → Lambda (sem JWT Authorizer)
   - `/clientes/*`, `/ordens-servico/*` → JWT Authorizer → **VPC Link** → **NLB interno** → pods
   - `/admin/*`, `/webhooks/*`, health → sem JWT RS256 (admin HS256 / webhook secret no app)
3. NLB `internal`, target type `ip`, health TCP na porta do app.
4. Headers `x-cpf` / `x-scope` / `x-amzn-trace-id` propagados após Authorizer.

### Trade-offs

| Opção | Prós | Contras | Escolha |
|-------|------|---------|---------|
| NLB público + WAF | Simples | Expõe compute; forja de headers | Rejeitada |
| HTTP API + VPC Link | Edge auth; NLB privado | Timeout 30s; ops VPC Link | **Aceita** |
| ALB Ingress só | Nativo EKS | Sem JWT Authorizer nativo HTTP API | Rejeitada p/ auth cliente |

## Consequências

- Threat model T1: confiar em `x-cpf` **somente** se tráfego vier do VPC Link/SG.
- Timeout 30s limita jobs longos (R7).
