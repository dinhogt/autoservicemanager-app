# Documento-base para entrega no portal — Fase 4

## Identificação

Preencher nomes, RM e turma dos participantes antes da exportação para PDF.

## Links

| Item | URL |
|---|---|
| OS Service | https://github.com/dinhogt/autoservicemanager-app |
| Billing Service | https://github.com/dinhogt/autoservicemanager-billing |
| Execution Service | https://github.com/dinhogt/autoservicemanager-execution |
| Auth Lambda | https://github.com/dinhogt/autoservicemanager-auth-lambda |
| Infra DB | https://github.com/dinhogt/autoservicemanager-infra-db |
| Infra Kubernetes | https://github.com/dinhogt/autoservicemanager-infra-k8s |
| Vídeo de demonstração | preencher após upload |

## Resumo da solução

A aplicação foi dividida em OS, Billing e Execution. O OS Service persiste a
ordem no MySQL e orquestra uma Saga. Comandos são enviados por SQS; Billing e
Execution publicam eventos versionados por SNS. Cada serviço possui banco,
pipeline, imagem e deployment independentes. Billing usa DynamoDB e integra o
Mercado Pago sandbox; Execution usa DynamoDB para seus work items.

## Saga

A estratégia é orquestrada para centralizar transições e compensações no OS
Service. Uma falha após pagamento emite `payment.refund`; rejeição cancela o
trabalho sem cobrança; timeout de pagamento não inicia execução. Consumidores
usam `messageId` para idempotência e toda a jornada propaga `correlationId`.

## Tecnologias e justificativa

- NestJS e arquitetura hexagonal preservam a base testada da Fase 3.
- RDS MySQL mantém consistência da OS; DynamoDB on-demand isola Billing e
  Execution e atende ao requisito NoSQL.
- SQS fornece entrega durável e DLQ; SNS desacopla eventos de domínio.
- EKS, API Gateway, CloudWatch e X-Ray reaproveitam a plataforma Fase 3.
- Jest e Sonar bloqueiam cobertura inferior a 90%, acima dos 80% exigidos.

## Evidências (anexar / linkar no PDF)

| Item do enunciado | Onde está |
|---|---|
| Diagrama geral de arquitetura | [`diagrams-fase4.md`](../architecture/diagrams-fase4.md#diagrama-geral-de-arquitetura) |
| Evidência de cobertura ≥80% | [`coverage-evidence-fase4.md`](../qa/coverage-evidence-fase4.md) + [`coverage-artifacts/`](../qa/coverage-artifacts/) |
| Dockerfile + manifestos K8s | [`artifacts-fase4.md`](./artifacts-fase4.md) |
| Collections Postman atualizadas | [`README-fase4.md`](../postman/README-fase4.md) |
| Índice completo | [`delivery-index-fase4.md`](../architecture/delivery-index-fase4.md) |

## Checklist antes da exportação

- [ ] Inserir participantes e links públicos.
- [ ] Incluir (ou linkar) o **Diagrama Geral** exportado do Mermaid.
- [ ] Anexar prints/links de **cobertura** (HTML LCOV ou tabela do relatório).
- [ ] Citar caminhos dos **Dockerfiles** e **manifestos K8s** por serviço.
- [ ] Mencionar as **collections** Fase 4 / AWS atualizadas.
- [ ] Executar o smoke Kubernetes autorizado e registrar o run do pipeline.
- [ ] Gravar vídeo de até 15 minutos conforme o roteiro.
- [ ] Validar que nenhuma credencial, CPF, token ou dado de pagamento aparece.
