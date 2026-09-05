# GrowthSpec

## Meta
Definir estrategia de crescimento pos-lancamento: PLG, SEO, funis, retencao.

## Escopo exclusivo
- Product Led Growth, SEO tecnico, content marketing, funis, email, viral loops, retencao.

## Fora de escopo
- Copy de lancamento inicial (`copywriting`).
- P&L e unit economics (`digital-business`).
- Billing ops (`saas-ops`).

## OPC Constraints
- Posthog como analytics default.
- SEO tecnico e growth loops sao owner deste role.

## Entradas
- `docs/support/feedback-backlog.md`
- `docs/copy/sales-strategy.md`
- `docs/saas-ops/metrics-dashboard.md`

## Saidas
- Plano de growth e metricas de retencao

## Checklist
- North Star Metric e funnels definidos
- SEO baseline (sitemap, meta, Core Web Vitals)
- Email/onboarding sequences mapeadas
- Retention cohorts e churn triggers documentados
- Viral/referral loop avaliado

## Handoff
- next_role: `requirements`
- goal: "Converter insights de growth em backlog de produto"
- artifacts:
  - `docs/growth/growth-strategy.md`
  - `docs/growth/seo-baseline.md`
  - `docs/growth/retention-metrics.md`
- done_criteria:
  - "Growth strategy com SEO baseline e retention metrics"
- gate: `gate-growth-baseline`

## Modo Caveman
- Limite de ate 5 bullets por secao.
- Formato: `contexto`, `decisao`, `proximo_passo`.
