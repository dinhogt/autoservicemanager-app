# Workflow: parallel implementation

## Prerequisites
- Security gate passed (`gate-security-review`)
- For complex-flow: infrastructure stage complete
- Run `bash spec-skills-lib/tools/run-pipeline.sh status` — both impl branches should show `ready` after finops/infrastructure

## Orchestrator

```bash
# Show ready parallel stages
bash spec-skills-lib/tools/run-pipeline.sh next

# After each branch completes (artifacts + gate-check)
bash spec-skills-lib/tools/run-pipeline.sh gate-check stage-frontend
bash spec-skills-lib/tools/run-pipeline.sh complete stage-frontend

bash spec-skills-lib/tools/run-pipeline.sh gate-check stage-backend
bash spec-skills-lib/tools/run-pipeline.sh complete stage-backend

# Join unlocks automation (opc) or documentation (default/complex)
bash spec-skills-lib/tools/run-pipeline.sh next
```

Optional SDK dispatch (requires `CURSOR_API_KEY` and `pip install cursor-sdk`):

```bash
bash spec-skills-lib/tools/run-pipeline.sh dispatch stage-frontend --sdk
```

## Stages (parallel)
- **frontend** — UI + tests (`gate-frontend-quality`)
- **backend** — APIs + tests (`gate-implementation-quality`)

Open separate IDE agent sessions per branch. Use `parallel_group: impl-fork` from `next` output to coordinate.

## Then
Documentation → observability → QA → … per active flow.
