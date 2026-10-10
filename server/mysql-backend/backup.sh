#!/usr/bin/env bash
set -euo pipefail
# Usage: backup.sh /private/backup.cnf /private/backups [database]
credentials=${1:?Provide a private MariaDB/MySQL client option file}
folder=${2:?Provide a private backup directory}
database=${3:-drawsplat}
[[ "$database" =~ ^[A-Za-z0-9_]+$ ]] || { echo 'Invalid database name'; exit 1; }
umask 077
mkdir -p "$folder"
if command -v mariadb-dump >/dev/null; then dump=mariadb-dump; else dump=mysqldump; fi
stamp=$(date -u +%Y%m%dT%H%M%SZ)
file="$folder/$database-$stamp.sql.gz"
trap 'rm -f "$file.partial"' EXIT
"$dump" --defaults-extra-file="$credentials" --single-transaction --quick --skip-lock-tables --hex-blob "$database" | gzip > "$file.partial"
gzip -t "$file.partial"
mv "$file.partial" "$file"
sha256sum "$file" > "$file.sha256"
printf 'Created %s\n' "$file"
