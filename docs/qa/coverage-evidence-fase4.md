# Evidência de cobertura de testes — Fase 4

Data da regeneração: **2026-11-14**  
Gate do enunciado: **≥ 80%** por serviço.  
Gate interno do projeto: **≥ 90%** (statements, branches, functions, lines).

## Resumo

| Serviço | Testes | Statements | Branches | Functions | Lines | Gate |
|---|---:|---:|---:|---:|---:|---|
| OS Service (`app`) | 439 | 98,91% | 90,04% | 99,45% | 98,98% | PASS |
| Billing | 59 | 97,92% | 93,15% | 98,48% | 98,03% | PASS |
| Execution | 35 | 97,57% | 92,72% | 97,61% | 97,82% | PASS |
| Auth Lambda | 41 | 100% | 98,88% | 100% | 100% | PASS |

Todos acima do mínimo de **80%** do enunciado e do gate interno de **90%**.  
Fonte: `coverage-artifacts/*/coverage-summary.json` (gerado em 2026-11-14).

## BDD / e2e distribuído

```text
yarn test:phase4
→ 6 scenarios (6 passed)
→ 42 steps (42 passed)
```

Feature: `features/ciclo-os-saga.feature`  
Relato: [`entrega-6-bdd.md`](../entrega-6-bdd.md)

## Artefatos versionados (prints / links)

Pasta: [`coverage-artifacts/`](./coverage-artifacts/)

| Serviço | json-summary | LCOV | HTML | log da execução |
|---|---|---|---|---|
| OS | `os/coverage-summary.json` | `os/lcov.info` | `os/lcov-report/` | `os/test-run.txt` |
| Billing | `billing/coverage-summary.json` | `billing/lcov.info` | `billing/lcov-report/` | `billing/test-run.txt` |
| Execution | `execution/coverage-summary.json` | `execution/lcov.info` | `execution/lcov-report/` | `execution/test-run.txt` |
| Auth | `auth-lambda/coverage-summary.json` | `auth-lambda/lcov.info` | `auth-lambda/lcov-report/` | `auth-lambda/test-run.txt` |

Para o PDF/portal: anexe prints do HTML (`lcov-report/index.html`) ou cite este documento + pasta no README.

## Como regenerar

```bash
# a partir da pasta pai dos clones
EVID=autoservicemanager-app/docs/qa/coverage-artifacts

(cd autoservicemanager-billing && yarn test:cov \
  --coverageDirectory="../$EVID/billing" \
  --coverageReporters=json-summary --coverageReporters=lcov --coverageReporters=html)

(cd autoservicemanager-execution && yarn test:cov \
  --coverageDirectory="../$EVID/execution" \
  --coverageReporters=json-summary --coverageReporters=lcov --coverageReporters=html)

(cd autoservicemanager-auth-lambda && NODE_AUTH_TOKEN=dummy yarn test --coverage \
  --coverageDirectory="../$EVID/auth-lambda" \
  --coverageReporters=json-summary --coverageReporters=lcov --coverageReporters=html)

(cd autoservicemanager-app && yarn test:cov \
  --coverageDirectory="docs/qa/coverage-artifacts/os" \
  --coverageReporters=json-summary --coverageReporters=lcov --coverageReporters=html)
```

> A pasta `coverage/` na raiz de cada serviço permanece no `.gitignore`. As evidências de entrega ficam sob `docs/qa/coverage-artifacts/` para versionamento.

## SonarQube / SonarCloud

Workflows CI já executam scan quando `SONAR_TOKEN` está configurado (`sonar-project.properties` em cada serviço). Inclua no PDF o link do quality gate ou print do pipeline com o step Sonar verde.
