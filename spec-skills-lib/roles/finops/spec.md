# FinopsSpec

## Meta
Garantir o menor custo de implementacao possivel (setup, provisionamento, configuracao, operacao ate go-live).

## Escopo exclusivo
- Plano de custo de implementacao e backlog de otimizacao apenas na entrega inicial.

## Fora de escopo
- Reescolher provedor ou servico cloud (`cloud`).
- Margem alvo e lucro (`digital-business`).
- Copy e oferta comercial (`copywriting`).
- Modelo de produto (`saas`).

## Entradas
- `docs/cloud/option-evaluation.md` (obrigatorio se cloud aplicavel)
- `docs/security/threat-model.md`
- `docs/security/controls-matrix.md` (ou controles do escopo)
- Escopo de entrega e prazo

## Saidas
- Plano de custo de implementacao
- Backlog de otimizacao para go-live

## Checklist
- Linhas de custo: infra setup, ferramentas, horas, licencas
- Meta de reducao explicita
- Acoes limitadas a implementacao/operacao inicial
- Nao altera opcao em option-evaluation.md

## Checklist
- Linhas de custo: infra setup, ferramentas, horas, licencas
- Meta de reducao explicita
- Acoes limitadas a implementacao/operacao inicial
- Nao altera opcao em option-evaluation.md
- Governanca aplicada (`spec-skills-lib/framework/governance-checklist.md`)

## Handoff
- next_role: `frontend` (opc-flow/default-flow) ou `infrastructure` (complex-flow)
- goal: "Implementar com budget de entrega definido"
- artifacts:
  - `docs/finops/implementation-cost-plan.md`
  - `docs/finops/optimization-backlog.md`
- done_criteria:
  - "Plano de custo de implementacao com meta de reducao"
- gate: `gate-finops-implementation-cost`

## Modo Caveman
- Limite de ate 5 bullets por secao.
- Formato: `contexto`, `decisao`, `proximo_passo`.
