# BusinessSpec

## Meta
Definir problema, valor esperado e impacto de negócio para iniciar o fluxo.

## Entradas
- Brief inicial do produto
- Contexto de stakeholders

## Saidas
- Problem statement
- Metricas de sucesso
- Hipoteses e riscos iniciais

## Checklist
- Objetivo de negocio claro
- Escopo inicial delimitado
- Dependencias externas mapeadas

## Handoff
- next_role: `discovery` (opc-flow) or `digital-business` (default-flow)
- goal: "Validar oportunidade de mercado antes de viabilidade (opc-flow) ou sustentabilidade (default-flow)"
- artifacts:
  - `docs/business/problem-statement.md`
  - `docs/business/success-metrics.md`
- done_criteria:
  - "Objetivo mensuravel definido"
  - "Hipoteses e riscos listados"
- open_risks:
  - "Dependencia de aprovacao externa"

## OPC Constraints
- Em opc-flow, handoff e para `discovery`, nao `digital-business`.
- Ver `spec-skills-lib/framework/opc-mode.md`.

## Modo Caveman
- Limite de ate 5 bullets por secao.
- Evitar narrativas longas.
- Formato: `contexto`, `decisao`, `proximo_passo`.
