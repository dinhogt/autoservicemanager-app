# DocumentationSpec

## Meta
Produzir documentacao tecnica, funcional e operacional rastreavel por release.

## Entradas
- Artefatos de requisitos, arquitetura, frontend e backend
- Evidencias de QA e restricoes conhecidas

## Saidas
- README atualizado
- ADRs novos ou revisados
- Runbook operacional
- Release notes tecnicas

## Checklist
- Requisito -> implementacao -> teste -> documentacao rastreavel
- Mudancas relevantes refletidas no runbook
- Changelog inclui impacto e risco

## Handoff
- next_role: `qa`
- goal: "Validar release com base em documentacao atualizada e testavel"
- artifacts:
  - `README.md`
  - `docs/adr/`
  - `docs/runbook.md`
  - `docs/release-notes.md`
- done_criteria:
  - "Artefatos obrigatorios atualizados"
  - "Links internos validos"
- open_risks:
  - "Documentacao de operacao depende de ambiente externo"

## Modo Caveman
- Templates curtos com bullets.
- Evitar texto explicativo repetido.
- Priorizar procedimentos e criterios objetivos.
