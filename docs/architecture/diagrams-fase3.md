# Diagramas — Fase 3

| Campo | Valor |
|-------|-------|
| Todo | `docs-arch` |
| Data | 2026-08-09 |
| Fonte | [solution-design-fase3.md](./solution-design-fase3.md) |

## Componentes

```mermaid
flowchart LR
  Cliente[Cliente] --> APIGW[API Gateway HTTP API]
  Admin[Admin client] --> APIGW
  APIGW -->|POST /auth/cpf| Lambda[Lambda authCpf]
  Lambda --> RDS[(RDS MySQL 8)]
  Lambda -->|JWT RS256| Cliente
  APIGW -->|JWT Authorizer JWKS| AuthZ[Authorizer]
  APIGW -->|VPC Link + NLB| EKS[EKS NestJS]
  EKS --> RDS
  EKS --> CW[CloudWatch]
  EKS --> XRay[X-Ray]
  Lambda --> CW
  Lambda --> XRay
  APIGW --> CW
  GH[GitHub OIDC] --> ECR[ECR]
  GH --> EKS
  GH --> TF[Terraform]
```

## Sequência — autenticação CPF

```mermaid
sequenceDiagram
  participant C as Cliente
  participant G as API Gateway
  participant L as Lambda authCpf
  participant D as RDS
  C->>G: POST /auth/cpf { cpf }
  G->>L: invoke (X-Amzn-Trace-Id)
  L->>D: SELECT cliente WHERE cpf=?
  D-->>L: cliente
  L-->>G: 200 { access_token JWT RS256 }
  G-->>C: JWT
```

## Sequência — OS protegida (cliente)

```mermaid
sequenceDiagram
  participant C as Cliente
  participant G as API Gateway
  participant A as NestJS EKS
  participant D as RDS
  C->>G: GET /ordens-servico/... Bearer JWT
  G->>G: JWT Authorizer (JWKS)
  G->>A: VPC Link + x-cpf + x-amzn-trace-id
  A->>A: ClienteAuthGuard / RolesGuard CLIENTE
  A->>D: query OS
  D-->>A: dados
  A-->>G: 200 + X-Correlation-Id
  G-->>C: 200
```

## Sequência — transição de status (admin / webhook)

```mermaid
sequenceDiagram
  participant S as Staff ou Webhook
  participant G as API Gateway
  participant A as NestJS
  participant D as RDS
  S->>G: POST transição (JWT admin ou X-Webhook-Secret)
  G->>A: proxy (sem JWT RS256 em /admin|/webhooks)
  A->>A: OrderStatusService assert
  alt transição inválida
    A-->>S: 409 + log event=os_transicao_erro
  else OK
    A->>D: UPDATE status
    A-->>S: 200
  end
```

## PNG

Exportar estes Mermaid no viewer (GitHub / mermaid.live) se o PDF da entrega exigir imagem raster — fontes canônicas são os blocos acima.
