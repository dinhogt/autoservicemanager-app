# Critérios de aceite — Fase 4

## Entrega 0

| ID | Dado/Quando/Então | Evidência |
|---|---|---|
| AC-01 | Dado o repositório configurado, quando a governança for lida, então `complex-flow`, complexidade `high`, arquitetura `microservices` e cobertura 90 estarão ativos. | `global-rules.override.yaml` + validação local |
| AC-02 | Dado o escopo Fase 4, quando os requisitos forem revisados, então F1–F12 estarão ligados a requisitos, épicos e critérios de aceite. | `requirements.md`, `epics.md` |
| AC-03 | Dada a alta complexidade, quando o gate de intake executar, então WBS e épicos existirão, terão responsáveis, dependências e gates. | `wbs.md`, `epics.md` |
| AC-04 | Dada a baseline, quando os novos artefatos forem adicionados, então documentos e decisões da Fase 3 permanecerão disponíveis e não serão reescritos como Fase 4. | diff documental |

## Entrega 1

| ID | Dado/Quando/Então | Evidência |
|---|---|---|
| AC-05 | Dada a cisão, quando a arquitetura for revisada, então OS, Billing, Execution e auth terão responsabilidades e bancos explícitos, sem banco compartilhado. | ADR-013/018, solution design |
| AC-06 | Dada uma OS, quando ocorrer o fluxo feliz, então o OS persistirá a Saga e coordenará comandos SQS/eventos SNS até `ENTREGUE`. | ADR-014, RFC-005, diagramas |
| AC-07 | Dada mensagem duplicada, atrasada ou inválida, quando um consumidor processá-la, então idempotência, versão e transição válida impedirão efeito duplicado. | ADR-015, RFC-007 |
| AC-08 | Dada falha de diagnóstico/orçamento/pagamento/execução, quando a política correspondente disparar, então a Saga registrará a compensação e não deixará cobrança ou execução indevida. | ADR-014, RFC-005 |
| AC-09 | Dada cobrança sandbox, quando o webhook Mercado Pago for recebido, então assinatura, idempotência e estado consultado no provedor serão validados antes do evento de pagamento. | ADR-017, RFC-006 |
| AC-10 | Dada a persistência, quando um serviço acessar dados, então OS usará apenas MySQL e Billing/Execution apenas suas tabelas DynamoDB. | ADR-016/018 |
| AC-11 | Dadas as novas boundaries, quando o gate de segurança executar, então ameaças, ASVS, IRSA, DLQ, PII e webhook estarão mapeados e não haverá segredo no diff. | threat model + controls matrix |
| AC-12 | Dada a escolha AWS, quando o gate cloud/FinOps executar, então haverá comparação de opções, recomendação única, meta de redução e plano de destruição pós-demo. | `fase4-aws.md`, cost plan |

## Critérios futuros de implementação F1–F12

| Fluxo | Critério objetivo |
|---|---|
| F1 | E2E percorre todos os estados e registra os passos da Saga uma única vez. |
| F2 | Rejeição publica cancelamento de Execution, não cria cobrança e termina em `REJEITADA`. |
| F3 | Webhooks inválido/ausente retornam 401/403; replay válido não duplica efeitos. |
| F4 | Um evento de status produz no máximo uma notificação observável. |
| F5 | Cliente não executa endpoint administrativo; staff autorizado executa. |
| F6 | CPFs/CNPJs/placas inválidos são rejeitados antes da persistência ou publicação. |
| F7 | Métrica mantém a semântica Fase 3 e retorna agregado global/por serviço. |
| F8 | CPF válido emite JWT RS256; inválido não revela existência do cliente. |
| F9 | `correlationId`, `sagaId` e trace conectam edge, OS, fila, consumidor e provedor. |
| F10 | Pagamento sandbox confirmado avança a Saga uma vez e dispara execução. |
| F11 | Quatro cenários de rollback automatizados terminam em estado consistente. |
| F12 | CI de cada serviço passa lint, arquitetura, cobertura 90, Sonar, build e segurança. |

## Gates

- `gate-complexity-intake`: **PASS documental** com WBS, épicos e rastreabilidade.
- `gate-requirements-quality`: **PASS documental**; todo RF/RNF tem critério ou fluxo verificável.
- `gate-architecture-quality`: **PASS documental**; decisões ADR-013–018 e boundaries explícitas.
- `gate-cloud-selection`: **PASS documental**; AWS é exceção justificada pela plataforma Fase 3.
- `gate-security-review`: **PASS de desenho**; controles de runtime ficam bloqueantes antes de produção.
- `gate-finops-implementation-cost`: **PASS documental**; orçamento, redução e backlog definidos.
