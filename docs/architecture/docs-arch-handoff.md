# Docs-arch — handoff

| Campo | Valor |
|-------|-------|
| Role | `documentation` |
| Todo | `docs-arch` / Fase D docs gaps |
| Data | 2026-09-06 |

## Entrega

| Artefato | Path |
|----------|------|
| Índice PDF Portal | [delivery-index.md](./delivery-index.md) |
| Diagramas (componentes + auth + **abertura OS** + status) | [diagrams-fase3.md](./diagrams-fase3.md) |
| ER + justificativa + relacionamentos | [er-diagram.md](./er-diagram.md) |
| Riscos | [risk-map-fase3.md](./risk-map-fase3.md) |
| RFC-001/002/003 | `rfc-00*.md` |
| ADR-004…011 | `adr-00*.md` (+ [ADR-011 sync REST](./adr-011-sync-rest-api-gateway.md)) |
| Solution design | [solution-design-fase3.md](./solution-design-fase3.md) |
| Runbook | [../runbook.md](../runbook.md) |
| Release notes | [../release-notes.md](../release-notes.md) |
| README app | [../../README.md](../../README.md) |

## Handoff

- **next_todo:** AWS bootstrap/smoke (**requer aprovação explícita de custo**) → QA GO → `delivery-pdf`
- **next_role:** `infrastructure` / `qa` / `documentation`
- **goal:** Vídeo ≤15 min + PDF final com links, docs e confirmação do colaborador
- **open_risks:** OIDC IAM roles ainda deferred; secrets CD incompletos; `soat-architecture` pending accept; PNG raster opcional
