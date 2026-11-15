# P1 — Secrets, Sonar e CD (Fase 4)

Data: 2026-11-15

## Configurado

| Item | Onde | Valor / estado |
|---|---|---|
| Environments `homolog` + `production` | billing, execution | Criados |
| `AWS_ROLE_ARN` | billing/execution/auth/infra-db/infra-k8s (envs) | Roles `gha-autoservicemanager-*` |
| `ECR_REPOSITORY` | app, billing, execution | `autoservice-homolog-api` / `autoservicemanager-billing` / `autoservicemanager-execution` |
| `EKS_CLUSTER_NAME` | app, billing, execution | `autoservicemanager-homolog` |
| `IRSA_ROLE_ARN` | billing, execution | Placeholder `…-billing-irsa` / `…-execution-irsa` (confirmado pós-apply) |
| `AWS_REGION` | vars repo | `us-east-1` |
| `ENABLE_OIDC_CD` | vars repo | `false` até smoke pós-apply; depois `true` |
| `TF_STATE_BUCKET` | infra-db/infra-k8s | já existia |
| IAM OIDC roles | AWS | billing + execution criados (+ PowerUserAccess) |
| ECR repos | AWS | billing + execution criados |

## SonarQube / SonarCloud

`SONAR_TOKEN` **não** foi configurado (token do time indisponível nesta sessão).  
Workflows de todos os serviços **já tratam** ausência: emitem warning e seguem CI.  
Para ativar: criar projeto no SonarCloud e `gh secret set SONAR_TOKEN -R <repo> -b <token>`.

## Critério P1

Pipeline pronto para quality + CD gated; secrets fora do Git; Sonar documentado como skip até token.
