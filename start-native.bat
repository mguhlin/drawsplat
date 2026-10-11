@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Install Node.js 22 or newer with npm.
 exit /b 1
)
node selfhost/district/start-native.js %*
endlocal
