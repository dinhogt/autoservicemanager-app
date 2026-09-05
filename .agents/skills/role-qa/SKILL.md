---
name: role-qa
description: Functional and non-functional validation before release. Use after observability handoff, for production releases, post-incident regression, or when gate-release-quality fails.
---

# QA role

Follow `spec-skills-lib/roles/qa/spec.md`.

Hand off to **support-debug** with `docs/qa/validation-report.md` and `docs/qa/regression-report.md`.

Playbook: `spec-skills-lib/playbooks/stacks/<stack_profile>.yaml` (detect via `spec-skills-lib/tools/detect-stack.sh`).

Security: review `release_checklist` in `spec-skills-lib/rules/security-playbook.yaml`.

Cursor subagent: `.cursor/agents/qa.md` — invoke with "Use the qa subagent to …"
