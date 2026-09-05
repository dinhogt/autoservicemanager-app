# Workflow: launch and growth loop

Post-launch OPC stages from `opc-flow.yaml`.

## Stages

1. `saas-ops` — Stripe billing, tenants, metrics
2. `support-debug` — incidents, feedback backlog
3. `growth` — SEO, retention, PLG loops

## Feedback loops

- `growth` → `requirements` when product changes needed
- `support-debug` → `requirements` on recurring incidents
- `saas-ops` → `finops` when unit economics degrade

## Gates

- `gate-saas-ops-ready`
- `gate-growth-baseline`
