# FinOps — Plano de custo Fase 4

## Objetivo

Entregar a demo distribuída reaproveitando a Fase 3 e reduzir em **≥60%** o custo AWS mensal de um ambiente deixado ativo 24x7, medido contra o mesmo stack sem desligamento/destroy e com capacidade provisionada.

## Drivers e limites

| Driver | Estratégia inicial | Guardrail |
|---|---|---|
| EKS/EC2 | nós mínimos e janela curta de demo | budget/alarme; destroy pós-demo |
| RDS | instância pequena, single-AZ em demo | sem produção real; snapshot antes de destroy |
| NAT/LB | reutilizar plataforma e reduzir horas ligadas | conferir órfãos após destroy |
| DynamoDB | on-demand, duas tabelas | alarme de consumo; sem scan crítico |
| SQS/SNS | pay-per-request, payload mínimo | retenção e DLQ limitadas por ambiente |
| Logs/X-Ray | retenção curta e sampling em demo | nunca desativar trilha crítica |
| Mercado Pago | sandbox | zero cobrança real |
| Ferramentas | GitHub/Jest/LocalStack/mock locais; Sonar free quando elegível | sem licença paga sem aprovação |

## Plano de implementação

1. Desenvolvimento e e2e local por padrão; AWS apenas para smoke e vídeo.
2. Tags obrigatórias `project`, `env`, `owner`, `phase=4`, `expires-at`.
3. Budget e alerta antes do primeiro apply; estimativa Terraform anexada à aprovação.
4. Criar ambiente em janela agendada, executar smoke/evidências e destruir no mesmo dia.
5. Conferir EKS/nodes, RDS, NAT, load balancers, EIPs, endpoints, logs e backups remanescentes.

## Backlog da entrega

| Prioridade | Ação | Meta |
|---|---|---|
| P0 | Bloquear apply sem aprovação de budget/OIDC | evitar gasto acidental |
| P0 | Script/checklist de destroy e inventário pós-demo | zero recurso computacional órfão |
| P1 | VPC endpoints vs NAT: escolher pelo custo da janela | menor custo total |
| P1 | Retenção CloudWatch por ambiente | controlar crescimento |
| P2 | Rightsizing após métricas do smoke | reduzir capacidade ociosa |

## Gate finops

**PASS documental:** linhas de custo, meta ≥60% e backlog inicial definidos. Valores monetários dependem de região, cotação e plano Terraform da Entrega 2; apply permanece bloqueado até essa evidência.
