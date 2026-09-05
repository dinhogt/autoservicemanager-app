# BackendSpec

## Meta
Implementar regras de negocio, APIs e integracoes de dados com confiabilidade.

## Entradas
- Arquitetura de referencia
- Controles de seguranca (`docs/security/controls-matrix.md`)
- Requisitos funcionais e nao funcionais
- Playbook da stack

## Saidas
- Endpoints/servicos implementados
- Testes unitarios e de integracao
- Contratos de erro e observabilidade

## Checklist
- Casos de sucesso e falha cobertos
- Validacoes de entrada e seguranca aplicadas
- Performance dentro do budget
- Comandos test/lint do playbook executados

## Handoff
- next_role: `documentation`
- goal: "Atualizar documentacao tecnica e operacional com a implementacao"
- artifacts:
  - `docs/backend/api-contract.md`
  - `docs/backend/test-report.md`
- done_criteria:
  - "Contrato de API atualizado"
  - "Testes locais verdes"
- open_risks:
  - "Dependencia de infraestrutura externa para carga"

## Quando usar modo normal
- Mudanca em contrato publico de API
- Fluxos de auth ou pagamento alterados
- Gate de implementacao falhou

## Arvore de decisao
1. Contrato definido na arquitetura? -> implementar + testes
2. Input externo? -> validar na boundary (ASVS V2)
3. Dados sensiveis? -> nao logar PII; criptografia conforme playbook
4. Integracao externa? -> timeouts e error paths testados
5. Testes verdes? -> handoff documentation

## Anti-padroes
- SQL/string concatenation para queries
- Expor stack traces em producao
- Ignorar controls-matrix de seguranca
- Testes apenas no caminho feliz
- Bypass de lint obrigatorio

## NFR checklist
- Latencia p95 dentro de `performance_budget_ms`
- Idempotencia em operacoes criticas
- Health checks e metricas expostas

## Referencias
- `playbooks/stacks/<stack_profile>.yaml`
- `rules/security-playbook.yaml`
- `roles/security/spec.md`

## Modo Caveman
- Resumir cada endpoint em 1 linha.
- Expor apenas payloads essenciais.
- Linkar logs e relatorios em vez de anexar conteudo extenso.
