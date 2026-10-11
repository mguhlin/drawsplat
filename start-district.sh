#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
command -v docker >/dev/null || { echo 'Install Docker Engine or Docker Desktop with Compose, then run this launcher again.'; exit 1; }
docker info >/dev/null 2>&1 || { echo 'Start Docker and confirm your account can use it.'; exit 1; }
docker compose version >/dev/null
docker compose up --help | grep -q -- '--wait-timeout' || { echo 'Your Compose command lacks --wait-timeout. Update Compose using the official Docker instructions.' >&2; exit 1; }
if [[ "${1:-}" == "--plan" ]]; then
  [[ -n "${2:-}" && -f "$2" ]] || { echo '--plan needs an existing JSON file.' >&2; exit 1; }
  selected_plan=$(cd -- "$(dirname -- "$2")" && pwd)/$(basename -- "$2")
  shift 2
  docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/workspace" --mount "type=bind,src=$selected_plan,dst=/selected-plan.json,readonly" -w /workspace node:22-alpine node selfhost/district/prepare.js --plan /selected-plan.json "$@"
else
  docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/workspace" -w /workspace node:22-alpine node selfhost/district/prepare.js "$@"
fi
docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml up -d --build --wait --wait-timeout 240
docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml restart web
printf '\nDrawSplat is running. Open the setup hub address printed above to continue or rerun your checklist.\n'
site_url=$(sed -n 's/^SITE_ORIGIN=//p' selfhost/district/.env)
if command -v xdg-open >/dev/null; then xdg-open "$site_url/start-here.html" >/dev/null 2>&1 || true; elif command -v open >/dev/null; then open "$site_url/start-here.html" || true; fi
