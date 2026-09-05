# Example: Microservices

Exemplo de uso da spec-skills lib em arquitetura de microservicos local.

## Contexto
- Arquitetura: microservices
- Stack: TypeScript + Node.js + Kafka + PostgreSQL
- Fluxo: inclui estágio `security` (v0.2); considere `complex-flow` para produção
- Nivel: Production

## Como usar
1. Copie `examples/microservices/global-rules.override.yaml` para `rules/global-rules.yaml` (ou mescle os campos relevantes).
2. Adapte `flows/default-flow.yaml` para incluir etapas por servico se necessario.
3. Rode `bash tools/validate-local.sh`.

## Recomendacao
- Execute o fluxo por servico e mantenha um `DocumentationSpec` consolidado para operacao cross-service.
- Execute tambem o `ObservabilitySpec` por servico e um consolidado da plataforma.

## Observabilidade (papel obrigatorio)
- Dashboards por servico para throughput, erro e latencia.
- Alertas de dependencias criticas (fila, banco e APIs externas).
- Tracing distribuido para correlacionar falhas cross-service.
