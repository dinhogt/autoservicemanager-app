# Validation Report — AutoServiceManager

| Campo | Valor |
|-------|-------|
| Role | `qa` (`.agents/skills/role-qa`, `spec-skills-lib/roles/qa/spec.md`) |
| Workflow | `.agents/workflows/validate-release.md` |
| Stack | `nestjs-next-react` (`detect-stack.sh`) |
| Escopo | Gate de qualidade Fase 2 (feedback: fluxos críticos) + baseline antes da implementação Fase 3 |
| Data | 2026-08-07 |
| Suíte | `yarn test:cov` — **88** suites / **380** testes — **PASS** (revalidado 2026-08-08) |

## Decisão go/no-go

| Gate | Decisão | Escopo |
|------|---------|--------|
| Qualidade Fase 2 (fluxos críticos F1–F7) | **GO** | Entrega atual / feedback de testes |
| Release corporativa Fase 3 (cloud / 4 repos) | **NO-GO** | `security-gate` e `dockerfile-nonroot` **PASS**; ainda bloqueado por auth CPF Lambda, 4 repos e observabilidade |

**Go/no-go explícito (Fase 2):** **GO** — critérios de aceite dos fluxos críticos atendidos; bugs críticos: nenhum aberto.

**Handoff:** `support-debug` para operação com riscos residuais abaixo; pipeline Fase 3: `security-gate` **PASS** → próximo todo `repo-app`.

## Critérios de aceite (fluxos críticos)

Fonte: [`docs/qa/critical-flows.yaml`](./critical-flows.yaml) e [`docs/status-os-validacoes-mapeamento.md`](../status-os-validacoes-mapeamento.md).

| ID | Fluxo | Resultado | Evidência |
|----|-------|-----------|-----------|
| F1 | Ciclo completo RECEBIDA → ENTREGUE | PASS | `test/integration/fluxos-criticos-os.integration.spec.ts` |
| F2 | Rejeição AGUARDANDO_APROVACAO → REJEITADA | PASS | mesmo + `ordem-servico.controller.integration.spec.ts` |
| F3 | Webhook + `X-Webhook-Secret` | PASS | `webhook-os.controller.integration.spec.ts` |
| F4 | Notificações e-mail nas transições | PASS | ciclo F1 (5 envios SMTP mock) + notifiers unit |
| F5 | RBAC admin | PASS | `roles.guard.spec.ts` + controllers integration |
| F6 | CPF/CNPJ/placa (dígito + Mercosul) | PASS | `cpf-cnpj.*.spec.ts`, `placa.*.spec.ts` |
| F7 | Tempo médio execução (global / por serviço) | PASS | use case + adapter + HTTP shape |

F8/F9 (Lambda auth CPF, `X-Amzn-Trace-Id`) são escopo Fase 3 — fora deste gate.

## Cobertura e qualidade automatizada

| Métrica | Valor | Threshold | Status |
|---------|-------|-----------|--------|
| Statements | 98.31% | ≥ 80% | PASS |
| Lines | 98.72% | ≥ 80% | PASS |
| Functions | 97.54% | ≥ 70% | PASS |
| Branches | 83.83% | ≥ 70% | PASS |
| Domain (`src/domain/`) lines | 100% | meta plano ≥ 90% | PASS |
| `yarn arch:check` (dependency-cruiser) | 0 violações | — | PASS |
| `yarn lint` | 0 erros (após correção `require-await` no spec F1) | — | PASS |

## Security release checklist

Fonte: `spec-skills-lib/rules/security-playbook.yaml` → `release_checklist` + `.agents/rules/security-guardrails.md`.

| Item | Status | Notas |
|------|--------|-------|
| Threat model atualizado para boundaries alteradas | **PASS** (Fase 3) | [`docs/security/threat-model.md`](../security/threat-model.md) + [`controls-matrix.md`](../security/controls-matrix.md) (2026-08-08). |
| Dependency audit executado e críticos triados | **PASS com residual Low** | 2026-08-08: High `js-yaml` mitigado (`resolutions` → 4.3.1). Prod: **0 moderate+**, **1 Low** (`body-parser`). Ver controls-matrix. |
| Sem secrets no diff | **PASS** | Alterações apenas em `docs/qa/` e specs de teste; `.env` permanece ignorado. |
| Security gate criteria satisfied | **PASS** | `gate-security-review` Fase 3 atendido (threat model + ASVS + audit + no secrets). |

## Defeitos

| ID | Severidade | Descrição | Status |
|----|------------|-----------|--------|
| — | — | Nenhum defeito funcional crítico/bloqueante nos F1–F7 | — |
| ~~AUDIT-001~~ | — | `js-yaml` High | **Fechado** — resolution 4.3.1 |
| AUDIT-002 | Low | `body-parser` via express (limit inválido) | Aceito residual — default Nest |
| ~~DOC-001~~ | — | Threat model ausente | **Fechado** — `docs/security/threat-model.md` |

## NFR checklist (QASpec)

| Item | Aplicável? | Resultado |
|------|------------|-----------|
| Carga mínima no caminho crítico | Não (MVP acadêmico / sem carga formal neste gate) | N/A |
| Acessibilidade UI | Não (API-only) | N/A |
| Browsers/devices | Não | N/A |
| Fronteiras arquiteturais | Sim | `yarn arch:check` PASS |

## Riscos residuais

Ver também [`docs/qa/regression-report.md`](./regression-report.md).

1. Sem e2e com banco real MySQL — fluxos críticos usam use cases reais + repositório em memória / controllers com use cases mockados.
2. ~~Achado `js-yaml` High~~ — mitigado (4.3.1); residual Low `body-parser`.
3. ~~Threat model formal ausente~~ — publicado em `docs/security/threat-model.md`.
4. ~~Dockerfile ainda roda como root~~ — endereçado em `dockerfile-nonroot` (uid 10001 + `readOnlyRootFilesystem`).

## Artefatos de handoff

- `docs/qa/validation-report.md` (este arquivo)
- `docs/qa/regression-report.md`
- `docs/qa/critical-flows.yaml`

**next_role:** `support-debug` (operação) em paralelo; plano Fase 3 → `repo-app` (`role-backend`).
