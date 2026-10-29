@echo off
setlocal
cd /d "%~dp0"

if exist "%~dp0Sunveil.exe" (
    start "" "%~dp0Sunveil.exe"
    exit
)

where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    start "" /b node server.js
    exit
)

powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0server.ps1"
exit
