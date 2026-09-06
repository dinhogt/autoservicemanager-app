# Regression Report — AutoServiceManager (pós-cisão)

| Campo | Valor |
|-------|-------|
| Role | `qa` |
| Data | 2026-09-06 |
| Baseline | 4 remotes + docs ADR-011 / diagrams / ER / delivery-index |
| Resultado automático | **Mantém PASS** do regression 2026-08-08 (não re-executado nesta sessão de docs/bootstrap) |
| Cloud smoke | **HOLD** — sem terraform apply |

## Objetivo

Confirmar que a cisão e a documentação Fase 3 **não invalidam** a regressão funcional já verde, e registrar o que falta para GO live.

## Gate checklist

| Dimensão | Check | Status |
|----------|-------|--------|
| Função | F1–F7 (baseline specs) | **PASS** (herdado) |
| Docs rubrica | Componentes, sequências auth+abertura OS, RFCs, ADR-011, ER | **PASS** |
| Repos | 4 remotes + CI + README | **PASS** |
| GitHub governance | branch protection + envs | **PASS** |
| AWS apply / smoke | db→k8s→lambda→app | **HOLD** (sem apply) |
| OIDC IAM 4 subjects | script + trust template | **READY** (não criado — IAM denied no profile bootstrap) |

## Matriz

| Área | Status |
|------|--------|
| App Nest / Prisma / guards CLIENTE | PASS baseline |
| auth-lambda + domain-shared Packages | Código + publish 0.1.0 |
| infra-db / infra-k8s Terraform | Código pronto; **apply não rodado** |
| Observabilidade IaC/docs | PASS docs; live HOLD |

## Decisão

**GO documental / estrutural.**  
**NO-GO live** até apply + smoke aprovados — depois promover este arquivo para **GO** com URLs de API, run IDs Actions e prints de dashboard.
