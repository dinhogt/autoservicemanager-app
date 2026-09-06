# ADR-011 — Comunicação síncrona HTTP/REST via API Gateway

| Campo | Valor |
|-------|-------|
| Status | Aceito — Fase 3 |
| Data | 2026-09-06 |
| Role | architecture |
| Relacionados | [ADR-003](./adr-003-hexagonal-adaptation.md), [ADR-004](./adr-004-api-gateway-vpc-link.md), [ADR-005](./adr-005-hpa.md), [ADR-007](./adr-007-jwt-rs256-api-gateway-authorizer.md) |

## Contexto

A rubrica e o NFR de latência (&lt; 5s síncrono; timeout APIGW 30s) exigem um padrão de comunicação explícito entre cliente, edge e o monólito NestJS. Opções típicas: REST síncrono, gRPC, ou mensageria assíncrona entre bounded contexts.

O produto permanece um **monólito modular hexagonal** (ADR-003): bounded contexts (`atendimento`, `cadastro`, `estoque`, etc.) no mesmo processo, sem rede entre BCs no MVP.

## Decisão

1. **Protocolo externo:** HTTPS + **HTTP/REST JSON** síncrono.
2. **Edge:** todo tráfego público entra pelo **API Gateway HTTP API** (ADR-004); rotas cliente com **JWT Authorizer** (ADR-007); `POST /auth/cpf` → Lambda.
3. **Backend:** NestJS no EKS via VPC Link + NLB; controllers REST existentes (`POST /ordens-servico`, consultas, admin).
4. **Entre BCs:** chamadas in-process (ports/adapters hexagonais) — **sem** fila/mensageria no MVP.
5. **Escalabilidade:** réplicas horizontais via HPA (ADR-005), não via desacoplamento assíncrono.

### Trade-offs

| Opção | Prós | Contras | Escolha |
|-------|------|---------|---------|
| REST sync via APIGW | Simples; Swagger/Postman; alinha timeout edge | Acoplamento temporal | **Aceita** |
| Event bus entre BCs (SQS/SNS) | Desacopla picos | Complexidade OPC; latência eventual | Rejeitada no MVP |
| gRPC interno | Performance | Tooling FIAP/demo; APIGW HTTP API | Rejeitada |

## Consequências

- Diagramas de sequência (auth, abertura OS, status) modelam request/response único.
- Falhas de integração e OS aparecem como HTTP 4xx/5xx + logs JSON / alarmes CloudWatch — não como “mensagem não consumida”.
- Evolução futura para filas (notificações assíncronas já existem em pontos pontuais) não altera o contrato público REST.

## Fora de escopo

- Substituição do monólito por microserviços.
- WebSocket / SSE para push ao cliente.
