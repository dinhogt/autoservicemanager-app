# InfrastructureSpec

## Meta
Definir CI/CD, ambientes, IaC e rollback para projetos de alta complexidade.

## Entradas
- Arquitetura e controles de seguranca
- `flows/complex-flow.yaml` ativo

## Saidas
- Pipelines CI/CD
- Definicao de ambientes (dev/stage/prod)
- IaC e procedimento de rollback

## Checklist
- Pipeline cobre build, test, lint do playbook da stack
- Secrets apenas em runtime (stores aprovados)
- Rollback documentado e testavel

## Handoff
- next_role: `frontend`
- goal: "Implementar com pipeline e ambientes prontos"
- artifacts:
  - `docs/infrastructure/ci-cd.md`
  - `docs/infrastructure/environments.md`
- done_criteria:
  - "CI/CD definido para componentes alterados"
  - "Rollback path documentado"
- open_risks:
  - "Drift entre IaC e ambiente real"

## Quando usar modo normal
- Novo servico ou ambiente de producao
- Mudanca em rede, IAM ou secrets de runtime
- Gate infrastructure falhou

## Arvore de decisao
1. Novo deployable? -> definir pipeline minimo
2. Multi-ambiente? -> documentar promocao e secrets por env
3. IaC alterado? -> plan/review antes de apply
4. Dependencia de cloud? -> alinhar com security controls
5. Handoff para implementacao paralela

## Anti-padroes
- Secrets em YAML de pipeline commitado
- Pipeline sem testes obrigatorios
- Producao sem rollback
- Ambientes compartilhando credenciais
- IaC manual fora do repo

## NFR checklist
- Tempo de build dentro do budget do time
- Artefatos imutaveis por release
- Observabilidade do pipeline (falhas visiveis)

## Referencias
- `rules/complexity-profile.yaml`
- `playbooks/stacks/<stack_profile>.yaml`
- `roles/security/spec.md`

## Modo Caveman
- 1 diagrama textual de ambientes
- Lista de jobs do pipeline em bullets
- Link para configs em vez de duplicar
