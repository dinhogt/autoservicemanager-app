# DigitalBusinessSpec

## Meta
Garantir que o projeto seja sustentavel e gere lucro antes de investir em produto e implementacao.

## Escopo exclusivo
- Veredito de viabilidade, margem, break-even, runway, cenarios de receita/custo.

## Fora de escopo
- Estrategia de venda e copy (`copywriting`).
- Abordagem tecnica SaaS/MVP (`saas`).
- Escolha de cloud (`cloud`).
- Custo de implementacao na entrega (`finops`).

## Entradas
- `docs/business/problem-statement.md`
- `docs/business/success-metrics.md`
- Brief e contexto de mercado

## Saidas
- Veredito sustentavel/lucrativo com premissas
- Modelo de unit economics

## Checklist
- Premissas de receita e custo explicitas
- Cenarios pessimista, base e otimista
- Veredito claro: viavel ou inviavel
- Riscos de margem e runway listados

## Handoff
- next_role: `saas` (se viavel) ou feedback `business` (se inviavel)
- goal: "Validar abordagem de produto apenas se o negocio for sustentavel"
- artifacts:
  - `docs/digital-business/viability-summary.md`
  - `docs/digital-business/profitability-model.md`
- done_criteria:
  - "Veredito sustentavel/lucrativo documentado com premissas"
  - "Unit economics e break-even definidos"
- gate: `gate-digital-business-viability`

## Modo Caveman
- Limite de ate 5 bullets por secao.
- Formato: `contexto`, `decisao`, `proximo_passo`.
