# Mapa de riscos — Fase 3

| Campo | Valor |
|-------|-------|
| Todo | `docs-arch` |
| Data | 2026-08-09 |
| Detalhe arquitetural | [solution-design-fase3.md](./solution-design-fase3.md) |
| Segurança | [threat-model.md](../security/threat-model.md) |

## Matriz

| # | Risco | Impacto | Estado mitigação | Ref |
|---|-------|---------|------------------|-----|
| R1 | Cold start Lambda authCpf | Médio | Alarme duração Lambda | [alerts.md](../observability/alerts.md) |
| R2 | Custo AWS acumulado | Médio | Destroy pós-demo; single-AZ homolog | RFC-001 |
| R3 | Drift regra CPF | Baixo | Pacote `domain-shared` | packages/domain-shared |
| R4 | Perda correlação VPC Link | Médio | TraceMiddleware + X-Ray | ADR-006 |
| R5 | Breaking change rotas cliente | Alto | Documentado; JWT obrigatório | ADR-007 |
| R6 | Rotação JWT RS256 | Médio | Duas chaves JWKS (`kid`) | ADR-007 / runbook |
| R7 | Timeout APIGW 30s | Baixo | Endpoints curtos | ADR-004 |
| R8 | `readOnlyRootFilesystem` | Médio | `emptyDir` `/tmp`; migrate Job | Dockerfile / k8s |
| R9 | Regressão fluxos críticos | Alto | Suite QA F1–F9 | docs/qa/* |
| R10 | Forja `x-cpf` se NLB exposto | Alto | NLB interno + VPC Link + SG | ADR-004 / T1 |
| R11 | State TF / apply paralelo | Médio | DynamoDB lock; ordem db→k8s | ADR-008 |
| R12 | AKIA em CI | Alto | OIDC only | ADR-009 |
| R13 | Thresholds obs frios | Baixo | Calibrar pós-baseline | observability handoff |
| R14 | Target Group sem pods | Alto até bind | LB Controller / anotação Service | infra-k8s |

## Top 3 atenção ops

1. **R10 / R14** — não abrir NLB; garantir bind de pods antes de tráfego real.  
2. **R5** — clientes Fase 2 quebram sem JWT.  
3. **R9** — não liberar sem relatórios QA verdes.
