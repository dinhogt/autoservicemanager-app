#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: install-ide-integration.sh <target-project> [options]

Options:
  --ide <name>       cursor | vscode | antigravity | all (repeatable)
  --symlink          Symlink instead of copy
  --no-overwrite     Skip existing destination files
  --global           Install Antigravity global snippet to ~/.gemini/GEMINI.md (append)
  --help

Examples:
  install-ide-integration.sh . --ide all
  install-ide-integration.sh /path/proj --ide vscode --ide cursor --symlink
EOF
}

TARGET=""
IDES=()
MODE="copy"
OVERWRITE="yes"
GLOBAL="no"
LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ide)
      IDES+=("${2:-}")
      shift 2
      ;;
    --symlink) MODE="symlink"; shift ;;
    --no-overwrite) OVERWRITE="no"; shift ;;
    --global) GLOBAL="yes"; shift ;;
    --help|-h) usage; exit 0 ;;
    *)
      if [[ -z "$TARGET" ]]; then
        TARGET="$1"
        shift
      else
        echo "Unknown argument: $1" >&2
        usage
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  usage
  exit 1
fi

if [[ ${#IDES[@]} -eq 0 ]]; then
  IDES=("all")
fi

if [[ ! -d "$TARGET" ]]; then
  echo "ERROR: target not found: $TARGET" >&2
  exit 1
fi

TARGET="$(cd "$TARGET" && pwd)"

install_mapping() {
  local from_rel="$1"
  local to_rel="$2"
  local src="$LIB_DIR/$from_rel"
  local dest="$TARGET/$to_rel"

  if [[ ! -f "$src" ]]; then
    echo "ERROR: source missing: $src" >&2
    return 1
  fi

  mkdir -p "$(dirname "$dest")"

  if [[ -e "$dest" && "$OVERWRITE" == "no" ]]; then
    echo "SKIP (exists): $to_rel"
    return 0
  fi

  if [[ -e "$dest" ]]; then
    rm -f "$dest"
  fi

  if [[ "$MODE" == "symlink" ]]; then
    ln -sf "$src" "$dest"
    echo "LINK: $to_rel -> $src"
  else
    cp "$src" "$dest"
    echo "COPY: $to_rel"
  fi
}

run_ide_block() {
  local ide="$1"
  python3 - "$LIB_DIR" "$TARGET" "$ide" "$MODE" "$OVERWRITE" <<'PY'
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

lib_dir, target, ide, mode, overwrite = sys.argv[1:6]
target = Path(target)
manifest = yaml.safe_load((Path(lib_dir) / "integrations" / "manifest.yaml").read_text())
targets = manifest.get("targets", {})

def install(from_rel, to_rel):
    src = Path(lib_dir) / from_rel
    dest = target / to_rel
    if not src.is_file():
        raise FileNotFoundError(src)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and overwrite == "no":
        print(f"SKIP (exists): {to_rel}")
        return
    if dest.exists() or dest.is_symlink():
        dest.unlink()
    if mode == "symlink":
        dest.symlink_to(src.resolve())
        print(f"LINK: {to_rel}")
    else:
        dest.write_bytes(src.read_bytes())
        print(f"COPY: {to_rel}")

if ide == "all":
    ides = ["cursor", "vscode", "antigravity"]
else:
    ides = [ide]

for name in ides:
    block = targets.get(name)
    if not block:
        print(f"WARN: unknown ide {name}", file=sys.stderr)
        continue
    if name == "antigravity":
        entries = block.get("workspace", [])
    else:
        entries = block
    for entry in entries:
        install(entry["from"], entry["to"])

# AGENTS.md
agents = manifest.get("agents_md")
if agents:
    install(agents["from"], agents["to"])
PY
}

for ide in "${IDES[@]}"; do
  echo "==> Installing IDE integration: $ide"
  run_ide_block "$ide"
done

if [[ "$GLOBAL" == "yes" ]]; then
  SNIPPET="$LIB_DIR/integrations/antigravity/global/GEMINI-snippet.md"
  GEMINI_DIR="$HOME/.gemini"
  GEMINI_FILE="$GEMINI_DIR/GEMINI.md"
  mkdir -p "$GEMINI_DIR"
  if [[ -f "$GEMINI_FILE" ]] && grep -q "Spec-Skills (global snippet)" "$GEMINI_FILE" 2>/dev/null; then
    echo "SKIP: GEMINI.md already contains spec-skills snippet"
  else
    {
      echo ""
      cat "$SNIPPET"
    } >>"$GEMINI_FILE"
    echo "APPEND: $GEMINI_FILE"
  fi
fi

echo "==> IDE integration complete"
