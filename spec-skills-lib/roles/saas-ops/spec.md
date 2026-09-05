# SaasOpsSpec

## Meta
Operar plataforma SaaS: billing Stripe, tenants, customer success, churn.

## Escopo exclusivo
- Stripe billing, subscription management, tenant management, CS playbooks, feature flags ops, churn.

## Fora de escopo
- Modelo de produto MVP (`saas`).
- Copy e funil (`copywriting`, `growth`).
- Custo de implementacao (`finops`).

## OPC Constraints
- Stripe + Posthog como stack default.
- Ver `spec-skills-lib/framework/tech-stack-reference.md`.

## Entradas
- `docs/qa/validation-report.md`
- `docs/saas/product-approach.md`
- `docs/finops/implementation-cost-plan.md`

## Saidas
- Billing, tenants e metricas operacionais configurados

## Checklist
- Stripe products/prices e webhooks configurados
- Customer portal habilitado
- Multi-tenant isolation validado
- MRR/churn dashboard (Posthog ou Stripe)
- CS playbook para onboarding e escalacao

## Handoff
- next_role: `support-debug`
- goal: "Handoff operacional para suporte e incidentes"
- artifacts:
  - `docs/saas-ops/billing-setup.md`
  - `docs/saas-ops/tenant-management.md`
  - `docs/saas-ops/metrics-dashboard.md`
- done_criteria:
  - "Billing, tenants e metricas operacionais ativos"
- gate: `gate-saas-ops-ready`

## Modo Caveman
- Limite de ate 5 bullets por secao.
- Formato: `contexto`, `decisao`, `proximo_passo`.
