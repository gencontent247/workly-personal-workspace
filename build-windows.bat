@echo off
setlocal
cd /d "%~dp0"
set "NODE_OPTIONS=%NODE_OPTIONS% --use-system-ca"
where npm.cmd >nul 2>nul
if errorlevel 1 (echo [ERROR] Node.js LTS not found. & pause & exit /b 1)
call npm.cmd install
if errorlevel 1 (echo [ERROR] npm install failed. & pause & exit /b 1)
call npm.cmd run dist:win
if errorlevel 1 (echo [ERROR] Build failed. & pause & exit /b 1)
echo [OK] Windows installer created in release folder.
pause
