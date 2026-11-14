#!/usr/bin/env bash
set -euo pipefail

compose=(docker compose -f docker-compose.phase4.yml)

cleanup() {
  "${compose[@]}" down -v --remove-orphans
}
trap cleanup EXIT

cleanup

# Start only long-running dependencies first. One-shot migrate/seed containers
# cannot be used with --abort-on-container-exit because their successful exit
# would stop the BDD service before the scenarios run.
"${compose[@]}" up --build --wait mysql localstack mercado-pago-mock
"${compose[@]}" run --rm migrate
"${compose[@]}" run --rm seed
"${compose[@]}" up --build --wait os billing execution
"${compose[@]}" run --rm --no-deps bdd
