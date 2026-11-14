# Runbook operacional distribuído — Fase 4

## Triagem inicial

1. Copiar `correlationId`, `sagaId`, `ordemServicoId` e `messageId`.
2. Consultar o dashboard `autoservicemanager-<env>-ops-fase4`.
3. Buscar o `correlationId` nos logs dos três serviços.
4. Consultar a Saga no OS antes de redirigir ou repetir mensagens.
5. Nunca alterar diretamente tabelas DynamoDB/MySQL para “destravar” fluxo.

## Saga parada

| Sintoma | Diagnóstico | Ação segura |
|---|---|---|
| Comando sem evento | profundidade/idade da fila, logs do consumer | corrigir consumer; aguardar retry |
| Mensagem na DLQ | validar schema, versão e erro original | corrigir causa; usar redrive controlado |
| Pagamento pendente | consultar pagamento no Mercado Pago pelo ID externo | reconciliar no Billing; publicar um único evento |
| Execução falhou após pagamento | procurar `payment.refund` e `refund.completed` | não iniciar execução; escalar falha de refund |
| Evento duplicado | conferir `messageId` na store idempotente | nenhuma ação se o primeiro processamento concluiu |

## Redrive de DLQ

1. Congelar novas publicações para o agregado afetado, quando possível.
2. Exportar as mensagens e validar `schemaVersion`, `messageType`,
   `messageId`, `aggregateId` e `correlationId`.
3. Corrigir configuração/código e implantar antes do replay.
4. Redirigir um lote pequeno com o mecanismo de redrive do SQS.
5. Confirmar idempotência, estado da Saga e métricas.
6. Prosseguir em lotes; registrar operador, horário e quantidade.

Não editar o corpo nem enviar a mensagem diretamente à fila principal sem
registro de auditoria.

## Falha de reembolso

1. Bloquear avanço da Saga; estado esperado: compensação pendente/falha.
2. Consultar o pagamento no Mercado Pago usando credencial de runtime.
3. Se já reembolsado, reconciliar de forma idempotente e emitir
   `refund.completed`.
4. Se não reembolsado, repetir pela política limitada do Billing.
5. Após esgotar retries, manter na DLQ e acionar atendimento financeiro.

## Rollback de aplicação

1. Identificar a última imagem saudável pelo SHA.
2. Fazer rollback somente do serviço afetado com `kubectl rollout undo`.
3. Verificar readiness, consumo de fila e compatibilidade do schema.
4. Não reverter schema de evento já publicado; consumidores devem tolerar a
   versão suportada.

## Deploy/destroy

Provisionar: `infra-db → infra-k8s → auth-lambda → OS/Billing/Execution`.
Destruir: aplicações/Lambda → infra-k8s → infra-db. `terraform apply` e
`destroy` requerem aprovação operacional explícita.

## Critérios de encerramento

- Saga terminou em estado consistente.
- Não há cobrança indevida nem execução duplicada.
- DLQ voltou a zero ou possui incidente vinculado.
- Trace e logs preservam correlação sem PII/segredo.
- Causa raiz, replay e compensação foram documentados.
