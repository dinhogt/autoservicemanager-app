# Cloud — Fase 4 AWS

## Contexto

A preferência global OCI-first é excepcionada: a Fase 3 já possui EKS, RDS, API Gateway, SNS, CloudWatch/X-Ray, OIDC e Terraform AWS. Migrar impediria o reuso exigido e aumentaria risco da entrega.

## Avaliação (1–5; pesos)

| Opção | Custo 30% | Performance 20% | Qualidade 30% | Usabilidade 20% | Total |
|---|---:|---:|---:|---:|---:|
| AWS incremental | 3 | 5 | 5 | 5 | **4,4** |
| OCI migração | 4 | 3 | 3 | 2 | 3,1 |
| GCP migração | 3 | 4 | 3 | 2 | 2,9 |

**Recomendação única:** AWS incremental. Custo bruto não é o menor, mas continuidade, qualidade operacional e tempo de implementação dominam esta fase.

## Serviços

- API Gateway + Lambda auth existentes; EKS executa OS, Billing e Execution.
- RDS MySQL permanece no OS; DynamoDB on-demand separado para Billing/Execution.
- SQS + DLQ para comandos; SNS + subscriptions SQS para eventos.
- Secrets Manager, IRSA e KMS/criptografia gerenciada nas boundaries.
- CloudWatch Logs/EMF/alarms e X-Ray preservam observabilidade Fase 3.

## Escala

| Carga indicativa | Estratégia |
|---|---|
| 100 usuários/demo | single-AZ, réplicas mínimas, on-demand, destroy pós-demo |
| 1K | HPA + filas absorvem pico; RDS dimensionado por métrica |
| 10K | multi-AZ, autoscaling, revisar GSIs/partições e NAT endpoints |
| 100K | teste de carga, particionamento, reservas/Savings Plans e DR formal |

## Gate cloud-selection

**PASS documental:** opções comparadas nos quatro critérios, pesos explícitos e AWS recomendada. `terraform apply` continua em HOLD até aprovação de budget, credenciais OIDC e janela de demo.
