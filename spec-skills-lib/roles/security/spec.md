# SecuritySpec

## Meta
Garantir que mudancas atendam controles ASVS, threat model e politicas de segredos antes da implementacao.

## Entradas
- Arquitetura (solution-design, ADR)
- `rules/security-playbook.yaml` e `rules/global-rules.yaml`

## Saidas
- Threat model (STRIDE-lite)
- Mapa de controles ASVS aplicaveis ao escopo
- Checklist de auditoria de dependencias

## Checklist
- Threat model atualizado para boundaries alterados
- Controles ASVS mapeados por `implementation_level`
- Nenhum segredo no diff
- Comandos de audit do playbook executados localmente

## Handoff
- next_role: `frontend` (e `backend` em paralelo no fluxo)
- goal: "Implementar com controles de seguranca ja definidos"
- artifacts:
  - `docs/security/threat-model.md`
  - `docs/security/controls-matrix.md`
- done_criteria:
  - "Threat model e controles aprovados para o escopo"
  - "Gate gate-security-review atendido"
- open_risks:
  - "Controles pendentes de infraestrutura em runtime"

## Quando usar modo normal
- Primeira release em ambiente regulado
- Mudanca em auth, pagamentos ou dados sensiveis
- Gate de seguranca falhou em caveman

## Arvore de decisao
1. Houve mudanca em trust boundary? -> atualizar threat model
2. Novas dependencias? -> rodar audit do playbook da stack
3. Auth/session alterado? -> revisar ASVS V2/V3/V4
4. Dados sensiveis novos? -> revisar logging e retencao
5. Pronto para implementacao? -> handoff com controls-matrix

## Anti-padroes
- Segredos em codigo ou commits
- Threat model generico sem assets do projeto
- Pular audit de dependencias em MVP+
- Logar tokens ou PII completa
- Security only no final do sprint

## NFR checklist
- Disponibilidade de controles em todos os ambientes
- Fail-secure em erros de auth
- Rate limiting em endpoints sensiveis (producao)

## Referencias
- `rules/security-playbook.yaml`
- `playbooks/stacks/<stack_profile>.yaml`
- OWASP ASVS

## Modo Caveman
- Maximo 5 ameacas no threat model
- Tabela ASVS somente para controles tocados
- Linkar evidencias de audit em vez de colar logs
