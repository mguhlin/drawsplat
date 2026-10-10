@echo off
setlocal
cd /d "%~dp0..\.."
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMddTHHmmss"') do set BACKUP_TIME=%%i
set "BACKUP_DIR=selfhost\district\backups\%BACKUP_TIME%"
mkdir "%BACKUP_DIR%" || exit /b 1
docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml exec -T db sh -c "export MYSQL_PWD=$MYSQL_ROOT_PASSWORD; if command -v mariadb-dump >/dev/null; then dump=mariadb-dump; else dump=mysqldump; fi; $dump --single-transaction --quick --skip-lock-tables --hex-blob $MYSQL_DATABASE > /tmp/drawsplat-backup.sql && chmod 600 /tmp/drawsplat-backup.sql"
if errorlevel 1 exit /b 1
docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml cp db:/tmp/drawsplat-backup.sql "%BACKUP_DIR%\database.sql"
if errorlevel 1 exit /b 1
docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml cp api:/data/config.json "%BACKUP_DIR%\config.json"
if errorlevel 1 exit /b 1
docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml exec -T db rm /tmp/drawsplat-backup.sql
echo Bundled database and private configuration saved to %BACKUP_DIR%.
echo Restrict this folder to district administrators using Windows permissions.
