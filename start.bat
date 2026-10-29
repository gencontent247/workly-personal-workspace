@echo off
cd /d "%~dp0"
if not exist node_modules (call npm.cmd install || exit /b 1)
call npm.cmd run dev
pause
