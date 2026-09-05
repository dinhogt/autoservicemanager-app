#!/bin/sh
set -e
# Migrations run exclusively via k8s/job-migrate.yaml (or compose migrate service).
exec node dist/src/main.js
