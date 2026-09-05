# Example: Web Monolith

Exemplo de uso da spec-skills lib em um monolito web local.

## Contexto
- Arquitetura: modular monolith
- Stack: TypeScript + Node.js + PostgreSQL
- Nivel: MVP

## Como usar
1. Copie `examples/web-monolith/global-rules.override.yaml` para `rules/global-rules.yaml` do projeto alvo (ou mescle os campos).
2. Ajuste `flows/default-flow.yaml` se o fluxo interno divergir.
3. Rode `bash tools/validate-local.sh`.

## Artefatos esperados por ciclo
- `docs/business/*`
- `docs/requirements/*`
- `docs/architecture/*`
- `docs/frontend/*`
- `docs/backend/*`
- `docs/observability/*`
- `docs/qa/*`
- `docs/support/*`

## Observabilidade (papel obrigatorio)
- Defina dashboards para jornada principal e erros de API.
- Configure alertas para latencia, erro 5xx e indisponibilidade.
- Mantenha runbook de resposta vinculado aos alertas.
