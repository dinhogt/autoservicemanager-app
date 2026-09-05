# Workflow: upstream OPC discovery

Run stages from `opc-flow.yaml` through discovery and viability.

## Stages

1. `business` — problem statement, success metrics
2. `discovery` — ICP, JTBD, competitive map
3. `digital-business` — viability, profitability

## Gates

- `gate-discovery-validated`
- `gate-digital-business-viability`

## On fail

- Discovery invalid → feedback to `business`
- Not viable → feedback to `business`; do not proceed to `saas`

## Artifacts

- `docs/business/`
- `docs/discovery/`
- `docs/digital-business/`
