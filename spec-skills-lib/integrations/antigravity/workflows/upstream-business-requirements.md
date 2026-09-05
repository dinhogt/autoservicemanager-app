# Workflow: upstream business through requirements (v0.3)

## Stages (in order)

1. **business** — problem statement, success metrics → `docs/business/`
2. **digital-business** — viability, profitability → `docs/digital-business/`
3. **saas** — product approach, startup patterns → `docs/saas/`
4. **requirements** — requirements, acceptance criteria → `docs/requirements/`
5. **copywriting** — sales strategy, copy deck → `docs/copy/`

## Gates

- `gate-digital-business-viability`
- `gate-saas-approach`
- `gate-requirements-quality`
- `gate-copy-sales-strategy`

## Blocking

If viability is **not viable**, return to **business** — do not run saas or requirements.

## Next

Run `/design-architecture-security` or continue manually: **architecture** → **cloud** → **security** → **finops** → implementation.
