# QASpec

## Meta
Validar qualidade funcional e nao funcional antes da liberacao.

## Entradas
- Implementacao frontend/backend
- Documentacao e threat model atualizados
- Criterios de aceite

## Saidas
- Relatorio de validacao
- Resultado de regressao
- Defeitos e severidade
- Decisao go/no-go

## Checklist
- Criterios de aceite atendidos
- Casos criticos validados
- Riscos residuais registrados
- Checklist de release do security-playbook revisado

## Handoff
- next_role: `support-debug`
- goal: "Preparar suporte para operacao com riscos e procedimentos conhecidos"
- artifacts:
  - `docs/qa/validation-report.md`
  - `docs/qa/regression-report.md`
- done_criteria:
  - "Bugs criticos resolvidos ou aceitos"
  - "Go/no-go explicitado"
- open_risks:
  - "Risco residual de regressao em cenarios raros"

## Quando usar modo normal
- Release de producao
- Regressao apos incidente
- Gate de release falhou

## Arvore de decisao
1. Aceite cobre escopo? -> executar casos mapeados
2. Testes automatizados verdes? -> regressao manual nos fluxos criticos
3. Security checklist ok? -> incluir no go/no-go
4. Bugs criticos? -> bloquear release ou registrar aceite formal
5. Handoff support-debug

## Anti-padroes
- Go sem criterios de aceite verificados
- Ignorar falhas de seguranca conhecidas
- Regressao apenas manual em todo release
- Nao registrar go/no-go por escrito
- Testar so ambiente diferente de stage

## NFR checklist
- Carga minima no caminho critico (se aplicavel)
- Acessibilidade basica em UI (se aplicavel)
- Compatibilidade com browsers/devices alvo

## Referencias
- `rules/security-playbook.yaml` (release_checklist)
- `flows/default-flow.yaml` / `flows/complex-flow.yaml`
- Artefatos em `docs/requirements/acceptance-criteria.md`

## Modo Caveman
- Reportar apenas falhas de maior impacto.
- Ate 5 casos de teste por fluxo principal.
- Referenciar evidencias por link local.
