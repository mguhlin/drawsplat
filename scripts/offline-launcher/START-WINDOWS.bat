@echo off
cd /d "%~dp0"
py -3 --version >nul 2>&1
if not errorlevel 1 (
  py -3 offline-server.py %*
  goto finished
)
python --version >nul 2>&1
if not errorlevel 1 (
  python offline-server.py %*
  goto finished
)
echo Python 3 is required. Install it once, then run this launcher again.
echo See START-HERE.html for instructions.
:finished
pause
