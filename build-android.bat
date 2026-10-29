@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-android.ps1"
if errorlevel 1 (echo [ERROR] Android build failed. & pause & exit /b 1)
echo [OK] Android APK created in release\android
pause
