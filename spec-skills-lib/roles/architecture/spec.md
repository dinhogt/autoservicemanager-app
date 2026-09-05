# ArchitectureSpec

## Meta
Definir estrutura tecnica, boundaries e decisoes arquiteturais da solucao.

## Entradas
- Requisitos e criterios de aceite
- Regras globais de arquitetura e playbook da stack

## Saidas
- Desenho de componentes e contratos
- ADRs de decisoes relevantes
- Mapa de riscos tecnicos

## Checklist
- Boundaries bem definidos
- Contratos entre modulos claros
- Trade-offs registrados
- Playbook da stack respeitado (`nestjs-next-react` em OPC)
- Governanca tecnologica aplicada (`spec-skills-lib/framework/governance-checklist.md`)

## Handoff
- next_role: `ai-engineering` (opc-flow, se ai_features_enabled) ou `cloud` (default)
- goal: "Selecionar melhor opcao cloud para o desenho logico"
- artifacts:
  - `docs/architecture/solution-design.md`
  - `docs/architecture/adr-001.md`
- done_criteria:
  - "Arquitetura valida para nivel de implementacao"
  - "Riscos e mitigacoes mapeados"
- open_risks:
  - "Complexidade de integracao entre modulos"

## Quando usar modo normal
- Mudanca de estilo arquitetural (monolito -> microservicos)
- Integracao critica externa descoberta
- Gate de arquitetura falhou em caveman

## Arvore de decisao
1. Requisitos ambiguos? -> voltar a requirements (complex-flow)
2. Stack definida? -> carregar playbook correspondente
3. Multi-servico? -> considerar complex-flow + infrastructure
4. Contratos entre modulos definidos? -> ADR para decisoes nao obvias
5. Pronto? -> handoff cloud

## Anti-padroes
- Arquitetura sem ADR para decisoes irreversiveis
- Boundaries que ignoram o playbook da stack
- Over-engineering sem requisito NFR
- Acoplamento circular entre modulos
- Ignorar constraints de seguranca globais

## NFR checklist
- Escalabilidade do caminho critico
- Resiliencia (timeouts, retries, circuit breaker onde aplicavel)
- Observabilidade nos boundaries

## Referencias
- `playbooks/stacks/<stack_profile>.yaml`
- `rules/global-rules.yaml`
- `rules/complexity-profile.yaml`

## Modo Caveman
- Apenas diagrama textual minimo por componente.
- No maximo 3 trade-offs por decisao.
- Linkar ADRs em vez de repetir justificativa completa.
