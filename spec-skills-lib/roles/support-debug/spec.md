# SupportDebugSpec

## Meta
Sustentar operacao, diagnosticar incidentes e fechar loop de melhoria.

## Entradas
- Relatorio de QA
- Runbook e release notes

## Saidas
- Playbook de incidentes
- Lista de known issues
- Feedback estruturado para requisitos

## Checklist
- Procedimentos de troubleshooting validados
- Sinais de monitoramento definidos
- Causa raiz registrada para incidentes relevantes

## Handoff
- next_role: `requirements`
- goal: "Realimentar backlog com problemas de producao e melhorias"
- artifacts:
  - `docs/support/incident-playbook.md`
  - `docs/support/known-issues.md`
- done_criteria:
  - "Feedback priorizado por impacto"
  - "Acoes preventivas definidas"
- open_risks:
  - "Lacuna de observabilidade em ponto critico"

## Modo Caveman
- Relatar incidente em formato curto: sintoma, impacto, acao.
- Limitar backlog de melhoria a itens priorizados.
- Reusar links para logs locais.
