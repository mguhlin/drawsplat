#!/bin/sh
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  exec python3 offline-server.py "$@"
fi
printf '%s\n' 'Python 3 is required. Install it once, then run this launcher again. See START-HERE.html.'
read -r answer
exit 1
