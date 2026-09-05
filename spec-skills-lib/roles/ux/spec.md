# UxSpec

## Meta
Definir experiencia do usuario: wireframes, arquitetura de informacao, design system e acessibilidade.

## Escopo exclusivo
- UX research, wireframes, prototipos, tokens de design system, checklist a11y.

## Fora de escopo
- Implementacao de UI (`frontend`).
- Copy comercial (`copywriting`).
- SEO tecnico (`growth`).
- Arquitetura tecnica (`architecture`).

## OPC Constraints
- Usar Shadcn/UI + Tailwind como base do design system.
- Ver `spec-skills-lib/framework/tech-stack-reference.md`.

## Entradas
- `docs/requirements/requirements.md`
- `docs/requirements/acceptance-criteria.md`
- `docs/saas/product-approach.md`

## Saidas
- Wireframes e design system prontos para implementacao

## Checklist
- Fluxos principais wireframed
- Design system tokens definidos (cores, tipografia, espacamento)
- WCAG 2.1 AA checklist para fluxos criticos
- Estados loading/erro/vazio mapeados

## Handoff
- next_role: `copywriting`
- goal: "Informar narrativa comercial com UX definida"
- artifacts:
  - `docs/ux/wireframes.md`
  - `docs/ux/design-system.md`
  - `docs/ux/a11y-checklist.md`
- done_criteria:
  - "Wireframes e design system prontos para frontend"
- gate: `gate-ux-ready`

## Modo Caveman
- Limite de ate 5 bullets por secao.
- Formato: `contexto`, `decisao`, `proximo_passo`.
