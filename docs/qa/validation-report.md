# Validation Report — AutoServiceManager

| Campo | Valor |
|-------|-------|
| Role | `qa` |
| Data | 2026-09-06 |
| Escopo | Revalidação pós-cisão 4 repos + docs Fase 3 |
| Suíte app | Manter baseline `yarn test:cov` (último PASS documentado: 88 suites / 380 testes) |

## Decisão go/no-go

| Gate | Decisão | Escopo |
|------|---------|--------|
| Qualidade Fase 2 (fluxos F1–F7) | **GO** | Testes automatizados + regressão |
| Entrega acadêmica docs / 4 repos / CI GitHub | **GO** | Cisão, READMEs, ADRs/RFCs/diagramas/ER, delivery-index, branch protection |
| Release live homolog (APIGW + EKS + smoke) | **CONDITIONAL / HOLD** | Usuário pediu **sem terraform apply**; profile `asm-bootstrap` sem IAM admin; smoke ao vivo **não executado** |

**Go/no-go Fase 3 (docs + repos):** **GO** para rubrica documental e estrutura de remotes.  
**Go/no-go Fase 3 (demo cloud ao vivo):** **HOLD** até liberar `terraform apply` + secrets OIDC + smoke — ver [aws-bootstrap-no-apply.md](../infrastructure/aws-bootstrap-no-apply.md).

## Critérios de aceite (fluxos críticos)

| ID | Fluxo | Resultado | Evidência |
|----|-------|-----------|-----------|
| F1–F7 | Ciclo OS / webhook / RBAC / docs | **PASS** (baseline) | `docs/qa/regression-report.md` + specs integration |
| F8 | Auth CPF Lambda (live) | **HOLD** | Código + repo auth-lambda prontos; endpoint APIGW depende apply |
| F9 | Correlação / X-Ray (live) | **HOLD** | Código + IaC obs prontos; dashboards dependem cluster |

## Cobertura e qualidade (baseline app)

| Métrica | Status |
|---------|--------|
| Suites/testes documentados | PASS (380+) |
| `yarn arch:check` / lint (último regression) | PASS |
| Security gate workflows nos 4 repos | PRESENT |
| Secrets no git | PASS (não versionados) |

## Security release checklist

| Item | Status |
|------|--------|
| Threat model | PASS |
| 4 remotes + OIDC-only CD | PASS (GitHub); IAM roles AWS **script ready**, não aplicadas por este user |
| Sem terraform apply nesta sessão | **INTENCIONAL** |

## Riscos residuais

| Risco | Mitigação |
|-------|-----------|
| Demo sem cluster | Liberar apply + smoke numa janela curta; destroy pós-vídeo |
| `soat-architecture` pending | Reenviar convites Read |
| Secrets CD incompletos nos 4 repos | Colar da UI monorepo após roles OIDC |

## Handoff

- **next:** liberar apply → smoke → atualizar este report para **GO live**  
- **delivery:** [delivery-index.md](../architecture/delivery-index.md) · [portal-entrega.md](../delivery/portal-entrega.md)
