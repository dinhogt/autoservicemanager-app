# Épicos — Fase 4

| Épico | Resultado | Fluxos | Entregas | Gate de saída |
|---|---|---|---|---|
| EP-01 Preservar experiência da OS | Ciclo, rejeição, notificações, RBAC, validações e métricas sem regressão | F1–F7 | 3, 6, 8 | regression/e2e verde |
| EP-02 Identidade e rastreabilidade | Auth CPF e correlação distribuída ponta a ponta | F8–F9 | 2, 3, 7 | security/observability |
| EP-03 Billing | Cobrança Mercado Pago sandbox idempotente e compensável | F10–F11 | 2, 4, 6 | security + e2e |
| EP-04 Execution | Diagnóstico/reparo assíncronos e canceláveis | F1, F2, F11 | 2, 5, 6 | implementation + e2e |
| EP-05 Saga no OS | Orquestração persistente, timeout, retry e rollback | F1, F10, F11 | 3, 6 | architecture + e2e |
| EP-06 Plataforma independente | Três MS, database-per-service, CI/CD, K8s e qualidade ≥90% | F12 | 2, 8, 9 | infrastructure/release |

## Histórias essenciais

### EP-01
- Como cliente, quero acompanhar a OS pelos mesmos estados da Fase 3.
- Como cliente, quero rejeitar orçamento sem ser cobrado.
- Como operador, quero preservar controles administrativos e métricas existentes.

### EP-02
- Como cliente, quero autenticar por CPF sem expor informação sensível.
- Como suporte, quero localizar uma jornada por `correlationId` e `sagaId`.

### EP-03
- Como cliente, quero pagar no sandbox e ter uma única confirmação.
- Como operador, quero reembolsar automaticamente quando execução paga falhar.

### EP-04
- Como oficina, quero filas independentes de diagnóstico e reparo.
- Como orquestrador, quero cancelar trabalho pendente durante compensação.

### EP-05
- Como negócio, quero estado durável da Saga para retomar após falhas.
- Como suporte, quero ver passo, erro, tentativas e compensação sem acessar bancos alheios.

### EP-06
- Como equipe, quero implantar cada serviço por pipeline independente.
- Como avaliador, quero evidência de BDD/e2e, Sonar e cobertura 90%.

## Definition of Ready

ADR/RFC aprovado, schema versionado, owner do dado definido, ameaça relevante controlada e critério F1–F12 associado.

## Definition of Done

Testes do recorte verdes, cobertura ≥90%, segurança sem crítico aberto, telemetria correlacionada, rollback documentado e evidência vinculada ao gate.
