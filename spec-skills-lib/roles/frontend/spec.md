# FrontendSpec

## Meta
Implementar experiencia de usuario, estados de tela e interacoes com APIs.

## Entradas
- Arquitetura aprovada
- Requisitos funcionais e criterios de aceite
- `docs/ux/wireframes.md`
- `docs/ux/design-system.md`

## Saidas
- Componentes e paginas implementados
- Testes de interface
- Evidencias de acessibilidade basica

## Checklist
- Next.js App Router com SSR/SSG/ISR conforme requisito
- Shadcn/UI + Tailwind CSS como component library
- Estado de erro e loading cobertos
- Contrato de API respeitado
- Testes de UI (Playwright) executando localmente
- SEO meta tags e Core Web Vitals considerados

## OPC Constraints
- Stack oficial: Next.js 15+, React, TypeScript, Tailwind, Shadcn/UI.
- Playbook: `nestjs-next-react`.
- Diretorio: `apps/web/`.

## Handoff
- next_role: `backend`
- goal: "Sincronizar comportamento de API e regras de negocio"
- artifacts:
  - `docs/frontend/ui-contracts.md`
  - `docs/frontend/test-evidence.md`
- done_criteria:
  - "Fluxos principais navegaveis"
  - "Eventos de erro tratados"
- open_risks:
  - "Mudanca de contrato de API em aberto"

## Modo Caveman
- Entregar checklist curto por fluxo.
- Descrever apenas diferencas de contrato.
- Limitar evidencia a links de testes e snapshots.
