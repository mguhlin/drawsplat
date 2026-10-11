#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
command -v node >/dev/null || { echo 'Install Node.js 22 or newer with npm.' >&2; exit 1; }
exec node selfhost/district/start-native.js "$@"
