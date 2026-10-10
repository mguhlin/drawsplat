#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
command -v docker >/dev/null || { echo 'Install Docker Engine or Docker Desktop with Compose, then run this launcher again.'; exit 1; }
docker info >/dev/null 2>&1 || { echo 'Start Docker and confirm your account can use it.'; exit 1; }
docker compose version >/dev/null
docker run --rm -v "$PWD:/workspace" -w /workspace node:22-alpine node selfhost/district/prepare.js "$@"
docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml up -d --build --wait --wait-timeout 240
printf '\nDrawSplat is running. Finish installation at the setup address printed above.\n'
