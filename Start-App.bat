@echo off
setlocal
title Sunveil Interactive Kanban & Mindmap
cd /d "%~dp0"

echo ========================================================
echo   Sunveil Interactive Kanban & Visual Mindmap
echo   100%% .EXE-Free (Antivirus-Safe)
echo ========================================================
echo.
echo Starting local application...

where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    start "" /b node server.js
    exit
)

powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0server.ps1"
exit
