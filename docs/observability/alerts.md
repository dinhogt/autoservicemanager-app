# Alertas — AutoServiceManager Fase 3

| Campo | Valor |
|-------|-------|
| Role | `observability` |
| Todo | `observability` |
| Data | 2026-08-09 |
| IaC | [`infra-k8s/observability.tf`](../../infra-k8s/observability.tf) |
| SNS | `{project}-{env}-ops-alerts` (assinar e-mail/ChatOps em ops) |

## Matriz (um alerta por falha crítica)

| Alarme Terraform | Condição | Severidade | Ação recomendada |
|------------------|----------|------------|------------------|
| `*-apigw-p95-gt-1s` | Latency p95 > **1000 ms** (3×60s) | Alta | Ver X-Ray + pods; HPA; cold start Lambda só em `/auth/cpf` |
| `*-apigw-5xx-gt-1pct` | `100 * 5xx/Count` > **1%** (3×60s) | Crítica | Logs app (`level=error`); NLB unhealthy; integração VPC Link |
| `*-nlb-unhealthy-hosts` | `UnHealthyHostCount` > 0 | Crítica | Probes `/`, Deployment, Target Group binding, SG |
| `*-auth-cpf-errors` | Lambda `Errors` ≥ 1 | Alta | Logs `/aws/lambda/...`; DB secret; JWT secret |
| `*-os-transicao-erro` | `OsTransicaoErro` ≥ 1 / min | Alta | Filtrar `event=os_transicao_erro`; correlacionar `correlationId` |

Thresholds podem exigir calibração em produção (handoff observability).

## Procedimento de resposta (runbook curto)

1. **Receber SNS** → abrir dashboard `{project}-{env}-ops`.  
2. **Confirmar** janela e métrica (não silenciar sem evidência).  
3. **Correlacionar:** Logs Insights com `correlationId` / `xrayTraceId` → X-Ray service map.  
4. **Mitigar:**  
   - 5xx / NLB: rollback imagem (`kubectl set image` / re-run CD) ou scale.  
   - Auth: verificar Secrets Manager + SG MySQL Lambda.  
   - OS: reproduzir transição; checar RBAC / webhook secret / estado inválido.  
5. **Registrar** causa + link do trace no ticket; ajustar threshold só após 1 semana de baseline.

## Emissão de `os_transicao_erro`

Metric filter no log group de aplicação:

```
{ $.event = "os_transicao_erro" }
```

Contrato de log (JSON):

```json
{
  "level": "error",
  "event": "os_transicao_erro",
  "message": "...",
  "correlationId": "...",
  "xrayTraceId": "1-..."
}
```

Apps/handlers devem incluir `event` no payload quando uma transição de status falhar após validação de domínio.

## Assinatura SNS

```bash
aws sns subscribe \
  --topic-arn "$(terraform -chdir=infra-k8s output -raw ops_alerts_topic_arn)" \
  --protocol email \
  --notification-endpoint ops@example.com
```

## Done criteria

- [x] Alertas acionáveis sem ruído excessivo (5 alarmes)  
- [x] Procedimento de resposta documentado  
