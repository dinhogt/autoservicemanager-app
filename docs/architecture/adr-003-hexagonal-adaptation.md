# ADR-003 — Adaptação hexagonal no monólito NestJS

**Status:** Aceito  
**Data:** 2026-05-22  
**Contexto:** Tech Challenge Fase 2 (APIs, AWS/K8s, CI/CD) já entregue; necessidade de alinhar camadas a ports/adapters sem quebrar contratos HTTP.

## Decisão

Manter **monólito modular** com mapa hexagonal pragmático:

| Hexagonal | Pasta |
|-----------|--------|
| Driving adapters | `src/interfaces/http/` |
| Application (use cases) | `src/application/` |
| Domain | `src/domain/` |
| Driven adapters | `src/infrastructure/` |

### Ports driven

- **Persistência:** `domain/*/repositories/` (ex.: `OrdemServicoRepository`)
- **Integração externa:** `domain/*/ports/` (audit Mongo, e-mail, leitura cross-context)
- **`OrdemServicoReadPort`:** consultas de leitura para cadastro/catálogo/estoque sem acoplar módulos Nest

### Núcleo de domínio

- `StatusOs` enum em `domain/atendimento/value-objects/` (sem `@prisma/client`)
- Mapper `status-os.mapper.ts` na infra Prisma
- `OrderStatusService` puro + `StatusTransitionException`; application mapeia para HTTP 409 via `runOrderStatusAssertion`

### Composition root

Módulos `*.module.ts` são o único lugar com `useClass: Prisma*Repository` e providers de ports.

## Consequências

- **Positivas:** domain testável sem Nest/Prisma; application sem `PrismaService`; `yarn arch:check` no CI
- **Trade-offs:** repositório OS continua “gordo” (transações no adapter); duplicação de provider `ORDEM_SERVICO_READ_PORT` por módulo consumidor (evita import circular)

## Fora de escopo

- Renomear `interfaces/` → `adapters/inbound/`
- Microserviços
- Alteração de contratos REST da Fase 2
