# Requisitos — Fase 4

| Campo | Valor |
|---|---|
| Escopo | Entregas 0–1: requisitos e desenho da evolução para microsserviços |
| Baseline | Fase 3 preservada; F1–F9 continuam válidos |
| Meta | Três microsserviços, Saga orquestrada, SQL + NoSQL, integração Mercado Pago |

## Objetivo

Evoluir o monólito modular para três bounded contexts implantáveis de forma independente, mantendo o ciclo da ordem de serviço e tornando pagamento e execução resilientes, rastreáveis e compensáveis.

## Requisitos funcionais

| ID | Requisito | Prioridade | Fluxos |
|---|---|---|---|
| RF-01 | O OS Service deve abrir, consultar e manter histórico/status da OS no MySQL. | Must | F1, F2 |
| RF-02 | O OS Service deve orquestrar e persistir cada Saga e suas transições. | Must | F1, F11 |
| RF-03 | O OS deve enviar comandos idempotentes ao Billing e Execution por SQS. | Must | F1, F10, F11 |
| RF-04 | Billing e Execution devem publicar eventos versionados por SNS. | Must | F1, F9–F11 |
| RF-05 | Billing deve criar cobrança e receber webhook do Mercado Pago sandbox. | Must | F10 |
| RF-06 | Billing deve suportar compensação por cancelamento/reembolso. | Must | F11 |
| RF-07 | Execution deve processar diagnóstico, reparo, andamento, conclusão e cancelamento. | Must | F1, F2, F11 |
| RF-08 | Cada serviço deve possuir seu próprio banco: OS/MySQL, Billing/DynamoDB e Execution/DynamoDB. | Must | F1, F10 |
| RF-09 | Cadastro, catálogo, estoque, RBAC, validações e notificações permanecem no OS. | Must | F4–F6 |
| RF-10 | A autenticação CPF via Lambda RS256 e o edge API Gateway devem ser preservados. | Must | F8 |
| RF-11 | A solução deve correlacionar requisições, mensagens, Saga e chamadas ao Mercado Pago. | Must | F9 |
| RF-12 | A entrega deve demonstrar caminho feliz e compensações sem acesso direto ao banco de outro serviço. | Must | F12 |

## Requisitos não funcionais

| ID | Requisito verificável |
|---|---|
| RNF-01 | Cobertura Jest por serviço ≥90% em statements, lines, branches e functions; Sonar bloqueante no mesmo limiar. |
| RNF-02 | Comandos/eventos usam `messageId`, `correlationId`, `sagaId`, `occurredAt`, `type` e `version`; consumidores são idempotentes. |
| RNF-03 | Filas possuem DLQ, retry limitado e política de redrive; timeouts não avançam a Saga indevidamente. |
| RNF-04 | Segredos ficam em Secrets Manager; IRSA concede menor privilégio por serviço; nenhum segredo é versionado. |
| RNF-05 | Logs JSON e traces X-Ray não expõem CPF, token nem dados completos de pagamento. |
| RNF-06 | Cada serviço tem CI/CD independente, health checks, imagem não-root e rollback por tag anterior. |
| RNF-07 | O fluxo completo possui BDD Gherkin e e2e local com MySQL, LocalStack e mock do Mercado Pago. |
| RNF-08 | A infraestrutura de demo usa single-AZ, DynamoDB on-demand e é destruída após a apresentação. |

## Restrições e fora de escopo

- NestJS hexagonal em AWS; Saga orquestrada no OS; SQS para comandos e SNS para eventos.
- REST público e para consultas; comunicação de mudança de estado entre serviços é assíncrona.
- MongoDB, Kafka/MSK, RabbitMQ, frontend e cisão adicional de cadastro/estoque não fazem parte da Fase 4.
- `terraform apply`, criação de repositórios e implementação de runtime pertencem às entregas posteriores.

## Rastreabilidade F1–F12

| Fluxo | Resultado esperado | Requisitos |
|---|---|---|
| F1 | Ciclo `RECEBIDA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → EM_EXECUCAO → FINALIZADA → ENTREGUE` | RF-01–04, RF-07 |
| F2 | Rejeição de orçamento cancela o trabalho e não cobra | RF-01, RF-06–07 |
| F3 | Integrações máquina são autenticadas e idempotentes | RF-03–05, RNF-02 |
| F4 | Mudanças relevantes notificam o cliente | RF-09 |
| F5 | RBAC protege operações administrativas | RF-09–10 |
| F6 | CPF/CNPJ/placa permanecem validados | RF-09 |
| F7 | Tempo médio global e por serviço permanece consultável | RF-01 |
| F8 | Cliente autentica por CPF e recebe JWT RS256 | RF-10 |
| F9 | Jornada propaga correlação e trace fim a fim | RF-04, RF-11 |
| F10 | Cobrança sandbox confirma pagamento por webhook válido | RF-03–05, RF-08 |
| F11 | Falhas executam compensação determinística e auditável | RF-02, RF-06–07 |
| F12 | Três serviços são testados e implantáveis independentemente | RF-08, RF-12, RNF-01/06/07 |

## Handoff

`requirements → architecture`: critérios testáveis em [acceptance-criteria.md](./acceptance-criteria.md), decomposição em [wbs.md](./wbs.md) e [epics.md](./epics.md).
