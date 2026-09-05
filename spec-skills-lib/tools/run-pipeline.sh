#!/usr/bin/env bash

set -euo pipefail

TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$TOOLS_DIR/.." && pwd)"
PROJECT_ROOT="$(pwd)"
ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-root)
      PROJECT_ROOT="$2"
      shift 2
      ;;
    *)
      ARGS+=("$1")
      shift
      ;;
  esac
done

PYTHON="python3"
if [[ -x "$ROOT_DIR/../.venv/bin/python3" ]]; then
  PYTHON="$ROOT_DIR/../.venv/bin/python3"
elif [[ -x "$ROOT_DIR/.venv/bin/python3" ]]; then
  PYTHON="$ROOT_DIR/.venv/bin/python3"
fi

exec "$PYTHON" "$TOOLS_DIR/pipeline-orchestrator.py" --project-root "$PROJECT_ROOT" "${ARGS[@]}"
