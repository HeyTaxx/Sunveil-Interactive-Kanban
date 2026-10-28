@echo off
setlocal
title Sunveil Kanban & Mindmap
cd /d "%~dp0"

:: 100% .EXE Free - Antivirus cannot delete or quarantine scripts!
where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    start "" /b node server.js
    exit
)

powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0server.ps1"
exit
