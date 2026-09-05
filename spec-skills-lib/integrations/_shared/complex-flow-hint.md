# Complex project hint (shared)

Switch to `spec-skills-lib/flows/complex-flow.yaml` when any of these apply:

- Multiple deployable services or bounded contexts
- Multiple owning teams
- External integrations (payments, identity, third-party APIs)
- Regulated data (PII, financial, health)
- Infrastructure as code across environments
- Event-driven backbone (Kafka, Pub/Sub, SQS, etc.)

When `complexity_profile: high`, produce `docs/requirements/wbs.md` and `docs/requirements/epics.md` before architecture.

Run the `infrastructure` role stage before parallel frontend/backend implementation.
