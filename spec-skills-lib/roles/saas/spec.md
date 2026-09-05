# SaasSpec

## Meta
Definir a melhor abordagem para novos produtos digitais e startups (MVP, PLG, multi-tenant, trial).

## Escopo exclusivo
- Modelo de entrega de produto (PLG vs sales-led, tenant, trial, API-first, metricas de produto).

## Fora de escopo
- Lucro e sustentabilidade (`digital-business`).
- Estrategia de venda e textos (`copywriting`).
- Selecao de provedor cloud (`cloud`).
- Custo de implementacao (`finops`).

## Entradas
- `docs/digital-business/viability-summary.md`
- `docs/business/problem-statement.md`
- `docs/business/success-metrics.md`

## Saidas
- Abordagem de produto recomendada
- Checklist de padroes startup/SaaS

## Checklist
- Modelo adequado ao estagio (MVP vs escala)
- Multi-tenant/trial/billing hook mapeados (Stripe — detalhes em saas-ops)
- Feature flags strategy (Posthog) referenciada
- Metricas de produto alinhadas ao brief
- Sem fechar P&L (referenciar digital-business)
- Sem operacao de billing live (referenciar saas-ops)

## OPC Constraints
- Stack oficial: NestJS + Next.js + Prisma + MySQL + Redis.
- Billing ops delegadas a `saas-ops`; este role define modelo apenas.

## Handoff
- next_role: `requirements`
- goal: "Converter abordagem de produto em requisitos testaveis"
- artifacts:
  - `docs/saas/product-approach.md`
  - `docs/saas/startup-pattern-checklist.md`
- done_criteria:
  - "Abordagem MVP/PLG/tenant adequada ao estagio documentada"
- gate: `gate-saas-approach`

## Modo Caveman
- Limite de ate 5 bullets por secao.
- Formato: `contexto`, `decisao`, `proximo_passo`.
