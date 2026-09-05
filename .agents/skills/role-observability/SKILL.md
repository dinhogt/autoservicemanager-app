---
name: role-observability
description: Dashboards, actionable alerts, and log/trace correlation for critical journeys. Use after documentation when operational readiness must be defined before QA.
---

# Observability role

Follow `spec-skills-lib/roles/observability/spec.md`.

Hand off to **qa** with `docs/observability/dashboards.md`, `docs/observability/alerts.md`, and `docs/observability/tracing.md`.

Templates: `.cursor/skills/observability-role/templates.md`

Stack defaults: `observability_defaults` in `spec-skills-lib/playbooks/stacks/<stack_profile>.yaml` (detect via `spec-skills-lib/tools/detect-stack.sh`).

Cursor subagent: `.cursor/agents/observability.md` — invoke with "Use the observability subagent to …"
