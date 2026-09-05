# Release notes — Fase 3

| Campo | Valor |
|-------|-------|
| Release | Fase 3 — cloud corporativa |
| Data | 2026-09-02 |
| Todo docs | `security-hardening-deploy` |

## Impacto

- Entry point público: **API Gateway** (não Load Balancer público do app).  
- Cliente: autenticação por **CPF → JWT RS256**; rotas antes públicas exigem Bearer.  
- Admin: JWT **HS256** inalterado em `/admin/*`.  
- **MongoDB removido** do caminho crítico (auditoria → CloudWatch Logs).  
- Quatro repositórios: app, auth-lambda, infra-db, infra-k8s (cisão concluída).
- **Security gate no CI** bloqueia deploy AWS sem audit + scan de secrets.
- Hardening runtime: CORS allowlist, Swagger off em production, fail-closed T1, webhook timing-safe, log redaction.

## Security gate (entrega/deploy)

| Check | Evidência |
|-------|-----------|
| `bash scripts/security-gate.sh` | 0 moderate+ prod; lambda audit 0 |
| Workflows CD | `security-gate` em `needs` antes de OIDC |
| Smoke pós-deploy | `scripts/security-smoke.sh <APIGW_URL>` |
| Docs | [threat-model.md](./security/threat-model.md), [runbook-deploy-eks.md](./runbook-deploy-eks.md) |

## Riscos desta release

Ver [risk-map-fase3.md](./architecture/risk-map-fase3.md) — destaque **R5** (breaking client) e **R10** (headers).

## Artefatos

| Tipo | Links |
|------|-------|
| Design | [solution-design-fase3.md](./architecture/solution-design-fase3.md) |
| Diagramas | [diagrams-fase3.md](./architecture/diagrams-fase3.md), [er-diagram.md](./architecture/er-diagram.md) |
| RFCs | [001](./architecture/rfc-001-cloud-aws.md), [002](./architecture/rfc-002-mysql-rds.md), [003](./architecture/rfc-003-auth-lambda-rs256.md) |
| ADRs | [004](./architecture/adr-004-api-gateway-vpc-link.md)–[010](./architecture/adr-010-discontinue-mongodb-audit.md) |
| Obs | [observability/](./observability/) |
| QA | [validation-report.md](./qa/validation-report.md), [regression-report.md](./qa/regression-report.md) |
| Runbook | [runbook.md](./runbook.md) |
| Branch protection | [infrastructure/branch-protection.md](./infrastructure/branch-protection.md) |

## Como validar

1. `bash scripts/security-gate.sh` + `yarn test`
2. Deploy homolog (`develop`) → `./scripts/security-smoke.sh <APIGW_URL>`
3. `POST /auth/cpf` → token → chamada `/clientes/...`
4. Dashboard CloudWatch + trace X-Ray (homolog)
5. HPA sob carga (`scripts/load-test.sh`)
