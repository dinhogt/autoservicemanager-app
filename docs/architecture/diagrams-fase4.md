# Diagramas — Fase 4

Fonte arquitetural: [solution-design-fase4.md](./solution-design-fase4.md).  
Diagrama canônico para o **PDF do portal**: seção [Diagrama Geral de Arquitetura](#diagrama-geral-de-arquitetura).

---

## Diagrama Geral de Arquitetura

Visão completa da solução distribuída: entrada, microsserviços, bancos, mensageria, pagamentos, CI/CD e observabilidade.

```mermaid
flowchart TB
  subgraph Clients["Clientes"]
    CLI[Cliente / Admin / Postman]
  end

  subgraph Edge["Borda AWS"]
    APIGW[API Gateway HTTP]
    AUTH[auth-lambda CPF → JWT RS256]
    NLB[NLB / VPC Link]
  end

  subgraph EKS["EKS · namespace autoservice"]
    OS[OS Service<br/>NestJS · Saga Orchestrator]
    BL[Billing Service<br/>NestJS]
    EX[Execution Service<br/>NestJS]
  end

  subgraph Data["Database per service"]
    MY[(RDS MySQL<br/>OS + Saga)]
    DDB1[(DynamoDB Billing)]
    DDB2[(DynamoDB Execution)]
  end

  subgraph Messaging["Mensageria"]
    SQS[SQS commands + DLQ<br/>billing / execution]
    SNS[SNS domain events<br/>billing / execution]
    OSEVT[SQS os-events + DLQ]
  end

  subgraph External["Externos"]
    MP[Mercado Pago sandbox]
  end

  subgraph Obs["Observabilidade"]
    CW[CloudWatch Logs / Metrics / Alarms]
    XR[AWS X-Ray]
  end

  subgraph Cicd["CI/CD por repositório"]
    GH[GitHub Actions<br/>lint · test · Sonar · build]
    ECR[Amazon ECR]
    DEP[Deploy kubectl / rollout]
  end

  CLI -->|HTTPS| APIGW
  APIGW --> AUTH
  APIGW --> NLB
  NLB --> OS
  NLB -->|/billing| BL
  NLB -->|/execucoes| EX

  OS --> MY
  BL --> DDB1
  EX --> DDB2

  OS -->|comandos| SQS
  SQS --> BL
  SQS --> EX
  BL -->|eventos| SNS
  EX -->|eventos| SNS
  SNS --> OSEVT
  OSEVT --> OS

  BL <-->|PIX / webhook| MP

  OS --> CW
  BL --> CW
  EX --> CW
  OS --> XR
  BL --> XR
  EX --> XR

  GH --> ECR
  ECR --> DEP
  DEP --> OS
  DEP --> BL
  DEP --> EX
```

### Legenda rápida

| Elemento | Papel |
|---|---|
| OS Service | Dono da OS, histórico e **orquestrador da Saga** (MySQL) |
| Billing | Orçamento, pagamento PIX, refund; único boundary Mercado Pago (DynamoDB) |
| Execution | Fila de diagnóstico/reparo/cancelamento (DynamoDB) |
| SQS / SNS | Comandos ponto a ponto e eventos desacoplados; DLQ em ambos os lados |
| auth-lambda | Autenticação CPF; leitura restrita do RDS (legado Fase 3) |
| CI/CD | Pipeline, imagem e rollback **independentes** por microsserviço |

### Repositórios

| Repo | Artefatos |
|---|---|
| `autoservicemanager-app` | Código OS, Saga, `Dockerfile`, `k8s/`, Postman, docs |
| `autoservicemanager-billing` | Código Billing, `Dockerfile`, `k8s/billing.yaml` |
| `autoservicemanager-execution` | Código Execution, `Dockerfile`, `k8s/execution.yaml` |
| `autoservicemanager-auth-lambda` | Lambda auth + notify |
| `autoservicemanager-infra-db` | Terraform VPC/RDS/DynamoDB |
| `autoservicemanager-infra-k8s` | Terraform EKS/APIGW/SQS/SNS/IRSA/obs |

---

## Componentes e trust boundaries

```mermaid
flowchart LR
  C[Cliente/Admin] -->|HTTPS| G[API Gateway]
  G --> A[authCpf Lambda]
  G --> OS[OS Service]
  G --> BL[Billing Service]
  G --> EX[Execution Service]
  OS --> MY[(RDS MySQL)]
  BL --> DB[(DynamoDB Billing)]
  EX --> DE[(DynamoDB Execution)]
  OS -->|comandos| Q[SQS + DLQ]
  Q --> BL
  Q --> EX
  BL -->|eventos| N[SNS]
  EX -->|eventos| N
  N -->|subscriptions SQS| OS
  BL <-->|HTTPS + webhook| MP[Mercado Pago sandbox]
  OS --> CW[CloudWatch / X-Ray]
  BL --> CW
  EX --> CW
```

## Saga — caminho feliz

```mermaid
sequenceDiagram
  participant C as Cliente
  participant O as OS Orchestrator
  participant E as Execution
  participant B as Billing
  participant M as Mercado Pago
  C->>O: criar OS
  O-->>E: IniciarDiagnostico (SQS)
  E-->>O: DiagnosticoConcluido (SNS)
  O-->>B: GerarOrcamento (SQS)
  B-->>O: OrcamentoGerado (SNS)
  C->>O: aprovar orçamento
  O-->>B: Cobrar (SQS)
  B->>M: criar preferência
  M-->>B: webhook
  B->>M: consultar pagamento
  B-->>O: PagamentoConfirmado (SNS)
  O-->>E: IniciarExecucao (SQS)
  E-->>O: ExecucaoConcluida (SNS)
  O-->>C: OS FINALIZADA/ENTREGUE
```

## Compensação após pagamento

```mermaid
sequenceDiagram
  participant O as OS Orchestrator
  participant E as Execution
  participant B as Billing
  participant M as Mercado Pago
  E-->>O: ExecucaoFalhou
  O-->>B: ReembolsarPagamento
  B->>M: refund idempotente
  M-->>B: refund confirmado
  B-->>O: ReembolsoConcluido
  O->>O: Saga COMPENSADA + histórico
```

## Estados resumidos

```mermaid
stateDiagram-v2
  [*] --> RECEBIDA
  RECEBIDA --> EM_DIAGNOSTICO
  EM_DIAGNOSTICO --> AGUARDANDO_APROVACAO
  AGUARDANDO_APROVACAO --> REJEITADA
  AGUARDANDO_APROVACAO --> AGUARDANDO_PAGAMENTO
  AGUARDANDO_PAGAMENTO --> EM_EXECUCAO
  EM_EXECUCAO --> FINALIZADA
  FINALIZADA --> ENTREGUE
  EM_DIAGNOSTICO --> CANCELADA: falha
  EM_EXECUCAO --> COMPENSANDO: falha após pagamento
  COMPENSANDO --> CANCELADA: refund confirmado
```

## Deploy e artefatos por serviço

```mermaid
flowchart LR
  SRC[Código no GitHub] --> CI[GitHub Actions]
  CI --> TEST[lint / test:cov / Sonar]
  TEST --> IMG[Docker build → ECR]
  IMG --> K8S[kubectl apply manifests]
  K8S --> POD[Pods EKS]
```

Inventário: [artifacts-fase4.md](../delivery/artifacts-fase4.md).
