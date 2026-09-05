#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_DIR="$ROOT_DIR/schema"
RULES_FILE="$ROOT_DIR/rules/global-rules.yaml"
FLOW_DIR="$ROOT_DIR/flows"
FRAMEWORK_DIR="$ROOT_DIR/framework"

echo "==> Running local integrity checks (v0.4)"

required_files=(
  "$SCHEMA_DIR/core-spec.schema.json"
  "$SCHEMA_DIR/global-rules.schema.json"
  "$SCHEMA_DIR/flow-spec.schema.json"
  "$SCHEMA_DIR/framework.schema.json"
  "$RULES_FILE"
  "$FLOW_DIR/default-flow.yaml"
  "$FLOW_DIR/complex-flow.yaml"
  "$FLOW_DIR/opc-flow.yaml"
  "$ROOT_DIR/VERSION"
  "$ROOT_DIR/rules/security-playbook.yaml"
  "$ROOT_DIR/playbooks/stacks/nestjs-next-react.yaml"
  "$FRAMEWORK_DIR/opc-mode.md"
  "$FRAMEWORK_DIR/skills-map.yaml"
  "$FRAMEWORK_DIR/maturity-matrix.yaml"
  "$FRAMEWORK_DIR/priority-matrix.yaml"
  "$FRAMEWORK_DIR/ai-augmentation-matrix.yaml"
  "$FRAMEWORK_DIR/learning-roadmap.yaml"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
done

specialist_roles=(
  digital-business
  saas
  copywriting
  cloud
  finops
  discovery
  ux
  ai-engineering
  legal
  automation
  growth
  saas-ops
)
for role in "${specialist_roles[@]}"; do
  spec="$ROOT_DIR/roles/$role/spec.md"
  if [[ ! -f "$spec" ]]; then
    echo "Missing specialist role spec: $spec" >&2
    exit 1
  fi
done
if [[ ! -f "$ROOT_DIR/roles/_boundaries.md" ]]; then
  echo "Missing roles/_boundaries.md" >&2
  exit 1
fi

echo "==> Required files found (incl. v0.4 OPC roles and framework)"

PYTHON="python3"
if [[ -x "$ROOT_DIR/../.venv/bin/python3" ]]; then
  PYTHON="$ROOT_DIR/../.venv/bin/python3"
elif [[ -x "$ROOT_DIR/.venv/bin/python3" ]]; then
  PYTHON="$ROOT_DIR/.venv/bin/python3"
fi

if ! command -v "$PYTHON" >/dev/null 2>&1; then
  echo "python3 is required for validation." >&2
  exit 1
fi

"$PYTHON" - "$ROOT_DIR" <<'PY'
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML required. Install: pip install pyyaml jsonschema", file=sys.stderr)
    sys.exit(1)

try:
    import jsonschema
except ImportError:
    print("ERROR: jsonschema required. Install: pip install jsonschema", file=sys.stderr)
    sys.exit(1)


def load_yaml(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if not isinstance(data, dict):
        raise ValueError(f"Expected mapping in {path}")
    return data


def load_json_schema(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


schema_cache: dict[Path, dict] = {}
yaml_cache: dict[Path, dict] = {}


def get_schema(path: Path) -> dict:
    if path not in schema_cache:
        schema_cache[path] = load_json_schema(path)
    return schema_cache[path]


def get_yaml(path: Path) -> dict:
    if path not in yaml_cache:
        yaml_cache[path] = load_yaml(path)
    return yaml_cache[path]


def validate(instance: dict, schema_path: Path, label: str) -> None:
    schema = get_schema(schema_path)
    jsonschema.validate(instance=instance, schema=schema)
    print(f"==> Schema OK: {label}")


def check_parallel_groups(flow: dict, flow_name: str, stage_ids: set[str]) -> None:
    explicit = flow.get("parallel_groups", [])
    for group in explicit:
        gid = group["id"]
        for sid in group["stages"]:
            if sid not in stage_ids:
                raise ValueError(f"{flow_name}: parallel_group {gid} unknown stage {sid}")
        join = group["join_stage"]
        if join not in stage_ids:
            raise ValueError(f"{flow_name}: parallel_group {gid} unknown join_stage {join}")
        policy = group.get("join_policy", "all")
        if policy not in ("all", "any"):
            raise ValueError(f"{flow_name}: parallel_group {gid} invalid join_policy {policy}")
    print(f"==> Parallel groups OK: {flow_name}")


schema_dir = root / "schema"
rules = get_yaml(root / "rules" / "global-rules.yaml")
validate(rules, schema_dir / "global-rules.schema.json", "global-rules.yaml")

flow_files = sorted((root / "flows").glob("*.yaml"))
for flow_file in flow_files:
    flow = get_yaml(flow_file)
    validate(flow, schema_dir / "flow-spec.schema.json", flow_file.name)

framework_dir = root / "framework"
framework_schema = schema_dir / "framework.schema.json"
for fw_file in sorted(framework_dir.glob("*.yaml")):
    fw = get_yaml(fw_file)
    validate(fw, framework_schema, fw_file.name)

# Cross-check: gate stage_id, feedback loops, parallel_groups (single pass per flow)
for flow_file in flow_files:
    flow = get_yaml(flow_file)
    stage_ids = {s["id"] for s in flow["stages"]}
    for gate in flow.get("gates", []):
        sid = gate["stage_id"]
        if sid not in stage_ids:
            raise ValueError(f"{flow_file.name}: gate {gate['id']} references unknown stage {sid}")
    for key in ("feedback_loop",):
        fb = flow.get(key)
        if fb:
            for field in ("from_stage", "to_stage"):
                if fb[field] not in stage_ids:
                    raise ValueError(f"{flow_file.name}: feedback_loop.{field} unknown")
    for fb in flow.get("feedback_loops", []):
        for field in ("from_stage", "to_stage"):
            if fb[field] not in stage_ids:
                raise ValueError(f"{flow_file.name}: feedback_loops {field} unknown")
    for tr in flow.get("transitions", []):
        if tr["from"] not in stage_ids or tr["to"] not in stage_ids:
            raise ValueError(f"{flow_file.name}: invalid transition {tr}")
    check_parallel_groups(flow, flow_file.name, stage_ids)
    print(f"==> Flow cross-check OK: {flow_file.name}")

# Manifest source files exist
manifest = get_yaml(root / "integrations" / "manifest.yaml")
for target_name, entries in manifest.get("targets", {}).items():
    if target_name == "antigravity":
        entries = entries.get("workspace", [])
    for entry in entries:
        src = root / entry["from"]
        if not src.is_file():
            raise ValueError(f"manifest missing source: {entry['from']}")
print("==> Manifest sources OK")

print("==> All validations passed")
PY

echo "==> Local validation completed successfully"
