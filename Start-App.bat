@echo off
setlocal
title Sunveil Interactive Kanban & Mindmap
cd /d "%~dp0"

echo ========================================================
echo   Sunveil Interactive Kanban & Visual Mindmap
echo   100%% .EXE-Frei (Virenscanner-Sicher)
echo ========================================================
echo.
echo Starte lokale Anwendung...

where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    start "" /b node server.js
    exit
)

powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0server.ps1"
exit
