#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.."
umask 077
backup_dir="selfhost/district/backups/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir"
compose=(docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml)
"${compose[@]}" exec -T db sh -c 'export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"; if command -v mariadb-dump >/dev/null; then dump=mariadb-dump; else dump=mysqldump; fi; "$dump" --single-transaction --quick --skip-lock-tables --hex-blob "$MYSQL_DATABASE" > /tmp/drawsplat-backup.sql && chmod 600 /tmp/drawsplat-backup.sql'
"${compose[@]}" cp db:/tmp/drawsplat-backup.sql "$backup_dir/database.sql"
"${compose[@]}" cp api:/data/config.json "$backup_dir/config.json"
"${compose[@]}" exec -T db rm /tmp/drawsplat-backup.sql
chmod 700 "$backup_dir"
chmod 600 "$backup_dir"/*
printf 'Bundled database and private configuration saved to %s\n' "$backup_dir"
