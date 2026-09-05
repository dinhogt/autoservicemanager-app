# Security guardrails (shared)

- Never commit secrets, API keys, passwords, or private keys.
- Load credentials from environment or approved secret stores only (`allowed_secret_stores` in global-rules).
- Validate and sanitize all external input at system boundaries.
- Do not log tokens, credentials, or full PII.
- Before finishing a change set, run dependency audit commands from the active stack playbook.
- Update `docs/security/threat-model.md` when trust boundaries change.
- Satisfy `gate-security-review` before implementation stages.

Full playbook: `spec-skills-lib/rules/security-playbook.yaml`
