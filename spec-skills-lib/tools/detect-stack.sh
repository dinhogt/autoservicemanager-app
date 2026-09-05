#!/usr/bin/env bash

set -euo pipefail

TARGET_DIR="${1:-.}"
OUTPUT_FILE="${2:-}"

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "ERROR: directory not found: $TARGET_DIR" >&2
  exit 1
fi

detect_profile() {
  local dir="$1"
  if [[ -f "$dir/Cargo.toml" ]]; then
    echo "rust-cli-service"
  elif compgen -G "$dir"/*.csproj >/dev/null 2>&1 || [[ -f "$dir/global.json" ]]; then
    echo "dotnet-aspnet"
  elif [[ -f "$dir/go.mod" ]]; then
    echo "go-http-service"
  elif [[ -f "$dir/pom.xml" ]] || [[ -f "$dir/build.gradle" ]] || [[ -f "$dir/build.gradle.kts" ]]; then
    echo "java-spring"
  elif [[ -f "$dir/pyproject.toml" ]] || [[ -f "$dir/requirements.txt" ]] || [[ -f "$dir/setup.py" ]]; then
    echo "python-django-fastapi"
  elif [[ -f "$dir/package.json" ]]; then
    if grep -q '"@nestjs/core"' "$dir/package.json" 2>/dev/null && grep -q '"next"' "$dir/package.json" 2>/dev/null; then
      echo "nestjs-next-react"
    elif grep -q '"@nestjs/core"' "$dir/package.json" 2>/dev/null; then
      echo "nestjs-next-react"
    elif grep -q '"next"' "$dir/package.json" 2>/dev/null; then
      echo "nestjs-next-react"
    else
      echo "typescript-node-react"
    fi
  elif [[ -f "$dir/Gemfile" ]]; then
    echo "ruby-rails"
  else
    echo "unknown"
  fi
}

PROFILE="$(detect_profile "$TARGET_DIR")"

SUGGESTED="$(cat <<EOF
# Suggested override — merge into spec-skills-lib/rules/global-rules.override.yaml
technologies:
  stack_profile: "${PROFILE}"
flow_config:
  active_flow: "opc-flow"
  complexity_profile: "low"
  opc_mode: true
EOF
)"

if [[ -n "$OUTPUT_FILE" ]]; then
  printf '%s\n' "$SUGGESTED" >"$OUTPUT_FILE"
  echo "Wrote: $OUTPUT_FILE"
else
  echo "$SUGGESTED"
fi

echo ""
echo "Detected stack_profile: ${PROFILE}"
if [[ "$PROFILE" == "unknown" ]]; then
  echo "No known markers found. Set stack_profile manually in global-rules.override.yaml"
  exit 2
fi
