@echo off
setlocal
cd /d "%~dp0"
where docker >nul 2>nul
if errorlevel 1 (
 echo Install Docker Desktop with Linux containers, then run this file again.
 exit /b 1
)
docker info >nul 2>nul
if errorlevel 1 (
 echo Start Docker Desktop, then run this file again.
 exit /b 1
)
docker compose version >nul
if errorlevel 1 exit /b 1
docker run --rm -v "%cd%:/workspace" -w /workspace node:22-alpine node selfhost/district/prepare.js %*
if errorlevel 1 exit /b 1
docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml up -d --build --wait --wait-timeout 240
if errorlevel 1 exit /b 1
echo DrawSplat is running. Finish installation at the setup address printed above.
endlocal
