@echo off
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel% equ 0 (
  py -3 server.py
) else (
  python server.py
)
if errorlevel 1 (
  echo Install Python 3 and enable its PATH option, then try again.
  pause
)
