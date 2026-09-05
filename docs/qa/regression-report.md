# Regression Report — AutoServiceManager

| Campo | Valor |
|-------|-------|
| Role | `qa` |
| Data | 2026-08-08 |
| Baseline | Pós `security-gate` + `repo-app` (CLIENTE, X-Ray/logger, CI OIDC) |
| Comandos | `yarn lint` · `yarn arch:check` · `yarn test:cov` · `yarn build` · `yarn audit --groups dependencies --level moderate` |
| Resultado | **88** suites / **380** testes (+ **17** domain-shared) — **todos PASS** |

## Objetivo

Confirmar que as mudanças de auth cliente (`AppRole.CLIENTE` / `x-cpf`), observabilidade (JSON logger, trace, X-Ray) e CI **não introduziram regressão** funcional, de qualidade ou de segurança.

## Gate checklist (integridade)

| Dimensão | Check | Status |
|----------|-------|--------|
| Função | `yarn test:cov` — unit + integração + fluxos F1–F7 | **PASS** |
| Função | `packages/domain-shared` tests | **PASS** (17) |
| Qualidade | `yarn lint` | **PASS** (0 erros) |
| Qualidade | `yarn arch:check` | **PASS** (283 módulos / 748 deps) |
| Qualidade | Cobertura global | Stmts **93.9%** · Lines **93.7%** · Funcs **92.2%** · Branches **79.2%** (acima do threshold) |
| Qualidade | Cobertura `src/domain/` | Lines/Stmts **100%** |
| Qualidade | `yarn build` | **PASS** |
| Segurança | Threat model + controls-matrix presentes | **PASS** |
| Segurança | `yarn audit` prod moderate+ | **PASS** (0 moderate/high; 1 Low `body-parser` — AUDIT-002 aceito) |
| Segurança | Sem secrets no fluxo de teste | **PASS** |

## Matriz de regressão

| Área | Specs principais | Status |
|------|------------------|--------|
| Ciclo OS / rejeição / e-mail / métrica (F1/F2/F4/F7) | `fluxos-criticos-os.integration.spec.ts` | PASS |
| OS HTTP + RBAC + CLIENTE `x-cpf` | `ordem-servico.controller.integration.spec.ts` | PASS (auth cliente via header) |
| Webhook (F3) | `webhook-os.controller.integration.spec.ts` | PASS |
| Auth login admin | `auth.controller.integration.spec.ts` | PASS |
| Clientes / veículos / usuários | `*.controller.integration.spec.ts` | PASS |
| Peças / catálogo | peca / servico-catalogo integration | PASS |
| Domain OrderStatusService | `order-status.service.spec.ts` | PASS |
| CLIENTE / Roles / JWT guards | `cliente-auth.guard.spec.ts`, `roles.guard.spec.ts`, `jwt-auth.guard.spec.ts` | PASS |
| Trace header | `trace.middleware.spec.ts` | PASS (extract Root) |
| CPF/CNPJ/placa | utils + VOs + domain-shared | PASS |
| Fronteiras DDD | `yarn arch:check` | PASS |

## Cenários críticos reexecutados

### F1 — Ciclo completo
RECEBIDA → … → ENTREGUE (use cases reais + notifiers) — PASS  

### F2 — Rejeição
HTTP `POST .../aprovacoes` com `x-cpf` + `aprovado: false` → REJEITADA — PASS  

### F3 — Webhook
Secret inválido/ausente → 401; válido → 201 — PASS  

### F5 / F6 / F7
RBAC admin, validações documento/placa, métrica tempo médio — PASS  

## Mudanças sob teste (vs baseline QA 07/08)

| Área | Impacto na regressão |
|------|----------------------|
| Rotas cliente deixam de ser `@Public` + query | Specs HTTP atualizados para `x-cpf` |
| Observabilidade nova | Cobertura baixa em `json-logger` / `xray.bootstrap` (não no caminho crítico); thresholds globais OK |
| `aws-xray-sdk-core` | Audit prod sem moderate+ novos |

## Defeitos encontrados nesta execução

Nenhum bloqueante.

## Riscos residuais

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Observabilidade (`JsonLogger` / X-Ray) pouco coberta por unit | Baixo | Smoke em EKS no todo `observability`; thresholds Jest ainda verdes |
| Sem e2e MySQL real | Médio | Aceito MVP; smoke pós-deploy Fase 3 |
| AUDIT-002 Low `body-parser` | Baixo | Nest usa default limit; monitorar bump express |
| T1 headers `x-cpf` forjáveis se NLB exposto | Médio | Validar SG/VPC Link em `repo-infra-k8s` |

## Conclusão

Regressão **verde**. Projeto **íntegro** em função, qualidade e segurança para o estado atual do monorepo app.

| Gate | Decisão |
|------|--------|
| Integridade pós-`repo-app` | **GO** |
| Release corporativa Fase 3 (4 repos / Lambda / cloud) | **NO-GO** até `repo-lambda` + infra + observability |
