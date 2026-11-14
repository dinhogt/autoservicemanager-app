# Alertas e resposta — Fase 4

| Alerta | Condição inicial | Severidade | Primeira ação |
|---|---|---|---|
| DLQ com mensagem | `ApproximateNumberOfMessagesVisible >= 1` por 1 min | crítica | congelar replay e seguir runbook de DLQ |
| Mensagem envelhecida | idade da mais antiga > 5 min | alta | verificar consumer, pods e permissões |
| Saga lenta | p95 > 10 min por 3 períodos | alta | localizar passo pelo `sagaId` |
| 5xx por serviço | >1% por 3 min | alta | separar erro do serviço/dependência |
| Mercado Pago indisponível | erro/timeout >5% por 5 min | alta | abrir circuit breaker e não avançar Saga |
| Refund falhou | `refund_failed >= 1` | crítica | bloquear Saga e acionar financeiro |
| Pod indisponível | replicas disponíveis < desejadas por 5 min | alta | conferir rollout, readiness e capacidade |
| Sem eventos | comandos enviados sem evento no SLA | alta | conferir fila, DLQ e trace do consumer |

## Política

- Alarmes críticos notificam o tópico operacional e exigem incidente.
- `missing_data` não é falha para ambientes acadêmicos desligados.
- Thresholds devem ser calibrados após smoke/carga; mudanças ficam em IaC.
- Todo alarme possui `service`, `environment`, dashboard e link para
  [runbook-fase4.md](../runbook-fase4.md).

## Encerramento

Registrar causa, duração, mensagens afetadas, replay/compensação e teste que
evita recorrência. Refund inconclusivo e cobrança indevida não podem ser
encerrados apenas com retry técnico.

## Alarmes provisionados

- DLQ > 0 e idade > 300 s para cada fila de comando;
- DLQ > 0 e idade > 300 s para eventos consumidos pelo OS;
- `RefundFailed >= 1`;
- `SagaDuration p95 > 600000 ms` por três períodos;
- `5xx > 0` por serviço nas rotas detalhadas do API Gateway.

Todos notificam `autoservicemanager-<env>-ops-alerts`, recuperam para o mesmo
tópico e usam `treat_missing_data = notBreaching`.
