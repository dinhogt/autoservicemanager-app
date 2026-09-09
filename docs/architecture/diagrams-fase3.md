# Diagramas — Fase 3

| Campo | Valor |
|-------|-------|
| Todo | `docs-diagrams` |
| Data | 2026-09-06 |
| Fonte | [solution-design-fase3.md](./solution-design-fase3.md) |
| Repos | app · auth-lambda · infra-db · infra-k8s (pós-cisão) |

## Componentes (nuvem, APIs, banco, monitoramento)

Visão pós-cisão: quatro repositórios GitHub com CI/CD OIDC; runtime AWS (API Gateway, Lambda, EKS, RDS); observabilidade nativa (CloudWatch, Container Insights, X-Ray).

```mermaid
flowchart TB
  subgraph edge [Edge]
    Cliente[Cliente]
    Admin[Admin client]
    APIGW[API Gateway HTTP API]
    AuthZ[JWT Authorizer JWKS]
  end
  subgraph compute [Compute]
    Lambda[Lambda authCpf]
    Notify[Lambda notify-os]
    EKS[EKS NestJS monólito]
    NLB[NLB interno VPC Link]
    SNS[SNS os-notifications]
  end
  subgraph data [Dados]
    RDS[(RDS MySQL 8)]
    SM[Secrets Manager]
    SES[SES]
  end
  subgraph obs [Observabilidade]
    CW[CloudWatch Logs Metrics]
    CI[Container Insights]
    XRay[X-Ray]
  end
  subgraph cicd [CI CD 4 repos]
    GHapp[autoservicemanager-app]
    GHlam[autoservicemanager-auth-lambda]
    GHdb[autoservicemanager-infra-db]
    GHk8s[autoservicemanager-infra-k8s]
    OIDC[GitHub OIDC IAM]
    ECR[ECR]
    TF[Terraform apply]
  end

  Cliente --> APIGW
  Admin --> APIGW
  APIGW -->|POST /auth/cpf| Lambda
  APIGW --> AuthZ
  AuthZ -->|Bearer JWT RS256| APIGW
  APIGW -->|VPC Link| NLB
  NLB --> EKS
  Lambda --> RDS
  Lambda --> SM
  EKS --> RDS
  EKS --> SM
  EKS --> SNS
  SNS --> Notify
  Notify --> SES
  Lambda -->|JWT| Cliente
  EKS --> CW
  EKS --> CI
  EKS --> XRay
  Lambda --> CW
  Notify --> CW
  Lambda --> XRay
  APIGW --> CW
  GHapp --> OIDC
  GHlam --> OIDC
  GHdb --> OIDC
  GHk8s --> OIDC
  OIDC --> ECR
  OIDC --> EKS
  OIDC --> TF
  OIDC --> Lambda
  OIDC --> Notify
```

## Sequência — autenticação CPF

```mermaid
sequenceDiagram
  participant C as Cliente
  participant G as API Gateway
  participant L as Lambda authCpf
  participant D as RDS
  C->>G: POST /auth/cpf { cpf }
  G->>L: invoke sync X-Amzn-Trace-Id
  L->>L: validar CPF domain-shared
  L->>D: SELECT cliente WHERE cpfCnpj=?
  D-->>L: cliente ativo
  L-->>G: 200 access_token JWT RS256
  G-->>C: JWT Bearer
```

## Sequência — abertura de ordem de serviço (POST)

Fluxo obrigatório da rubrica: cliente autenticado abre OS (`POST /ordens-servico`).

```mermaid
sequenceDiagram
  participant C as Cliente
  participant G as API Gateway
  participant A as NestJS EKS
  participant D as RDS
  C->>G: POST /ordens-servico Bearer JWT body veiculo itens
  G->>G: JWT Authorizer JWKS
  G->>A: VPC Link x-cpf x-amzn-trace-id
  A->>A: ClienteAuthGuard RolesGuard CLIENTE
  A->>D: validar Cliente Veiculo catalogo estoque
  A->>D: INSERT OrdemServico status RECEBIDA
  A->>D: INSERT ItemServicoOs ItemPecaOs
  A->>D: INSERT OrdemServicoStatusHistorico
  D-->>A: OS criada
  Note over A: EMF OsCriada
  A-->>G: 201 JSON OS X-Correlation-Id
  G-->>C: 201
  Note over A,D: Logs JSON + X-Ray trace
```

## Sequência — notificação serverless (status OS)

```mermaid
sequenceDiagram
  participant A as NestJS EKS
  participant SNS as SNS os-notifications
  participant N as Lambda notify-os
  participant SES as SES
  A->>SNS: Publish JSON type=os_status
  SNS->>N: invoke
  N->>SES: SendEmail
  N-->>N: log event=os_notification
```

## Sequência — consulta OS protegida (cliente)

```mermaid
sequenceDiagram
  participant C as Cliente
  participant G as API Gateway
  participant A as NestJS EKS
  participant D as RDS
  C->>G: GET /ordens-servico/:id/status Bearer JWT
  G->>G: JWT Authorizer JWKS
  G->>A: VPC Link x-cpf x-amzn-trace-id
  A->>A: ClienteAuthGuard RolesGuard CLIENTE
  A->>D: query OS do cliente
  D-->>A: dados
  A-->>G: 200 X-Correlation-Id
  G-->>C: 200
```

## Sequência — transição de status (admin / webhook)

```mermaid
sequenceDiagram
  participant S as Staff ou Webhook
  participant G as API Gateway
  participant A as NestJS
  participant D as RDS
  participant SNS as SNS
  S->>G: POST transição JWT admin ou X-Webhook-Secret
  G->>A: proxy sem JWT RS256 em admin webhooks
  A->>A: OrderStatusService assert
  alt transição inválida
    A-->>S: 409 log event=os_transicao_erro
  else OK
    A->>D: UPDATE status + INSERT historico
    A->>SNS: Publish notificação
    Note over A: EMF OsFaseDuracao
    A-->>S: 200
  end
```

## PNG

Exportar estes Mermaid no viewer (GitHub / mermaid.live) se o PDF da entrega exigir imagem raster — fontes canônicas são os blocos acima.
