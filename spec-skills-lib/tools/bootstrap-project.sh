#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: bootstrap-project.sh <target-project-path> [options]

Options:
  --with-cursor
  --with-vscode
  --with-antigravity
  --with-all-ides
  --symlink-ides       Use symlinks for IDE integration files (recommended for local dev)
  --no-overwrite-ides
  --skip-detect
  --skip-validate
  --help
EOF
}

TARGET_DIR=""
WITH_CURSOR="no"
WITH_VSCODE="no"
WITH_ANTIGRAVITY="no"
SYMLINK="no"
NO_OVERWRITE="no"
SKIP_DETECT="no"
SKIP_VALIDATE="no"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-cursor) WITH_CURSOR="yes"; shift ;;
    --with-vscode) WITH_VSCODE="yes"; shift ;;
    --with-antigravity) WITH_ANTIGRAVITY="yes"; shift ;;
    --with-all-ides) WITH_CURSOR="yes"; WITH_VSCODE="yes"; WITH_ANTIGRAVITY="yes"; shift ;;
    --symlink-ides) SYMLINK="yes"; shift ;;
    --no-overwrite-ides) NO_OVERWRITE="yes"; shift ;;
    --skip-detect) SKIP_DETECT="yes"; shift ;;
    --skip-validate) SKIP_VALIDATE="yes"; shift ;;
    --help|-h) usage; exit 0 ;;
    *)
      if [[ -z "$TARGET_DIR" ]]; then
        TARGET_DIR="$1"
        shift
      else
        echo "Unknown: $1" >&2
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$TARGET_DIR" ]]; then
  usage
  exit 1
fi

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="$TARGET_DIR/spec-skills-lib"
TOOLS_DIR="$SOURCE_DIR/tools"

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "Target directory does not exist: $TARGET_DIR" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"

for item in schema rules roles flows framework examples tools playbooks integrations AGENTS.md VERSION README.md; do
  if [[ -e "$SOURCE_DIR/$item" ]]; then
    cp -R "$SOURCE_DIR/$item" "$DEST_DIR/"
  fi
done

echo "spec-skills-lib installed at: $DEST_DIR"

if [[ "$SKIP_DETECT" != "yes" ]]; then
  SUGGESTED="$TARGET_DIR/suggested-stack-profile.yaml"
  bash "$TOOLS_DIR/detect-stack.sh" "$TARGET_DIR" "$SUGGESTED" || true
fi

INSTALL_ARGS=("$TARGET_DIR")
if [[ "$SYMLINK" == "yes" ]]; then
  INSTALL_ARGS+=(--symlink)
fi
if [[ "$NO_OVERWRITE" == "yes" ]]; then
  INSTALL_ARGS+=(--no-overwrite)
fi

install_ides() {
  local -a ides=()
  [[ "$WITH_CURSOR" == "yes" ]] && ides+=(cursor)
  [[ "$WITH_VSCODE" == "yes" ]] && ides+=(vscode)
  [[ "$WITH_ANTIGRAVITY" == "yes" ]] && ides+=(antigravity)
  if [[ ${#ides[@]} -eq 0 ]]; then
    return 0
  fi
  if [[ ${#ides[@]} -eq 3 ]]; then
    bash "$TOOLS_DIR/install-ide-integration.sh" "${INSTALL_ARGS[@]}" --ide all
  else
    local ide
    for ide in "${ides[@]}"; do
      bash "$TOOLS_DIR/install-ide-integration.sh" "${INSTALL_ARGS[@]}" --ide "$ide"
    done
  fi
}

install_ides

if [[ "$SKIP_VALIDATE" != "yes" ]]; then
  bash "$DEST_DIR/tools/validate-local.sh"
fi

echo "Bootstrap complete."
