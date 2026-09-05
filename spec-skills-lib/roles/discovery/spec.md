# DiscoverySpec

## Meta
Validar oportunidade de mercado antes de viabilidade financeira (ICP, JTBD, mapa competitivo).

## Escopo exclusivo
- Pesquisa de mercado, analise competitiva, ICP, personas, Jobs To Be Done, validacao de problema.

## Fora de escopo
- P&L e lucro (`digital-business`).
- Modelo de produto SaaS (`saas`).
- Requisitos tecnicos (`requirements`).
- Copy e funil (`copywriting`).

## OPC Constraints
- Prefer IA assistida para pesquisa; founder valida ICP final.
- Ver `spec-skills-lib/framework/opc-mode.md`.

## Entradas
- `docs/business/problem-statement.md`
- `docs/business/success-metrics.md`

## Saidas
- Mapa competitivo e ICP validado
- Veredito de oportunidade

## Checklist
- ICP definido com segmento, dor e willingness to pay
- Pelo menos 3 concorrentes mapeados
- JTBD documentado para persona principal
- Veredito: prosseguir ou revisar problema

## Handoff
- next_role: `digital-business`
- goal: "Avaliar viabilidade financeira da oportunidade validada"
- artifacts:
  - `docs/discovery/market-research.md`
  - `docs/discovery/competitive-map.md`
  - `docs/discovery/icp-personas.md`
- done_criteria:
  - "ICP e JTBD documentados com veredito de oportunidade"
- gate: `gate-discovery-validated`

## Modo Caveman
- Limite de ate 5 bullets por secao.
- Formato: `contexto`, `decisao`, `proximo_passo`.
